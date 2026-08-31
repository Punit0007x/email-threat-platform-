"""
app/forensics/attribution_graph.py

Identity Correlation and Attribution Support
----------------------------------------------
Answers the "graph-based relationship analysis" section of the problem
statement: correlate flagged emails by shared infrastructure (IP, domain,
ASN, reply-to address) to reveal campaign-level attribution, not just
single-message verdicts.

Design notes:
  - A single flagged email tells you little. Ten flagged emails that all
    route through the same /24, register domains through the same
    registrar, and redirect replies to the same three addresses tell you
    there's one actor running a campaign -- that's the whole point of
    this module, and it's the piece a pure ML classifier structurally
    cannot give you (each email is scored independently).
  - Graph, not a join table: infrastructure reuse is naturally a graph
    problem (incident -> shared node <- other incidents), and campaign
    discovery is just "what's connected." networkx's connected-components
    and BFS give this for free instead of hand-rolled recursive SQL.
  - Edge weights are NOT uniform: a shared originating IP is a far
    stronger attribution signal than two subjects using similar urgency
    language. Confidence scoring sums weighted edges, not edge counts.
  - Persistence: at hackathon/demo scale, in-memory networkx + a JSON
    node-link snapshot is sufficient. At production scale, the same
    schema (nodes = entities, edges = weighted relations) maps directly
    onto Neo4j / Amazon Neptune without redesigning the model.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import networkx as nx


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class Incident:
    incident_id: str
    from_address: Optional[str] = None
    from_domain: Optional[str] = None
    originating_ip: Optional[str] = None
    asn: Optional[str] = None
    reply_to_domain: Optional[str] = None
    subject: Optional[str] = None
    timestamp: Optional[datetime] = None
    fraud_score: float = 0.0


# Relation -> attribution weight. Infrastructure reuse (IP, ASN) is a much
# stronger signal than a shared domain (domains get burned and rotated
# fast) or textual similarity (easy for an actor to vary deliberately).
_EDGE_WEIGHTS = {
    "originates_from_ip": 1.0,
    "resolves_to_asn": 0.6,
    "uses_domain": 0.75,
    "redirects_replies_to_domain": 0.7,
}


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------

def build_attribution_graph() -> nx.Graph:
    return nx.Graph()


def _entity_node(kind: str, value: str) -> str:
    """Namespaced node id so an IP '1.2.3.4' can't collide with a domain '1.2.3.4'."""
    return f"{kind}:{value}"


def add_incident(graph: nx.Graph, incident: Incident) -> None:
    incident_node = _entity_node("incident", incident.incident_id)
    graph.add_node(incident_node, node_type="incident", data=incident)

    def link(kind: str, value: Optional[str], relation: str):
        if not value:
            return
        entity_node = _entity_node(kind, value)
        if not graph.has_node(entity_node):
            graph.add_node(entity_node, node_type=kind, value=value)
        weight = _EDGE_WEIGHTS.get(relation, 0.3)
        if graph.has_edge(incident_node, entity_node):
            # Same incident linked to the same entity twice -> keep max weight, note both relations
            graph[incident_node][entity_node]["relations"].add(relation)
        else:
            graph.add_edge(incident_node, entity_node, weight=weight, relations={relation})

    link("ip", incident.originating_ip, "originates_from_ip")
    link("asn", incident.asn, "resolves_to_asn")
    link("domain", incident.from_domain, "uses_domain")
    link("domain", incident.reply_to_domain, "redirects_replies_to_domain")


# ---------------------------------------------------------------------------
# Campaign discovery
# ---------------------------------------------------------------------------

def find_related_incidents(graph: nx.Graph, incident_id: str) -> set[str]:
    """
    All other incident_ids that share ANY infrastructure node with this
    one, found by connected-component membership. Two incidents sharing
    infra don't need a direct edge -- they're linked through the shared
    entity node, which is exactly what makes this a graph problem.
    """
    incident_node = _entity_node("incident", incident_id)
    if incident_node not in graph:
        return set()

    component = nx.node_connected_component(graph, incident_node)
    related = {
        graph.nodes[n]["data"].incident_id
        for n in component
        if graph.nodes[n].get("node_type") == "incident"
    }
    related.discard(incident_id)
    return related


def shared_infrastructure(graph: nx.Graph, incident_a: str, incident_b: str) -> list[tuple[str, str]]:
    """(entity_kind, entity_value) pairs both incidents are connected to."""
    node_a = _entity_node("incident", incident_a)
    node_b = _entity_node("incident", incident_b)
    if node_a not in graph or node_b not in graph:
        return []
    neighbors_a = set(graph.neighbors(node_a))
    neighbors_b = set(graph.neighbors(node_b))
    shared = neighbors_a & neighbors_b
    return [(graph.nodes[n]["node_type"], graph.nodes[n]["value"]) for n in shared]


def campaign_confidence(graph: nx.Graph, incident_a: str, incident_b: str) -> float:
    """
    Sum of edge weights to every shared entity, normalized to 0..1.
    Sharing one raw IP (weight 1.0) alone crosses ~0.5 confidence;
    sharing IP + ASN + domain saturates near 1.0.
    """
    shared = shared_infrastructure(graph, incident_a, incident_b)
    if not shared:
        return 0.0
    node_a = _entity_node("incident", incident_a)
    total = 0.0
    for kind, value in shared:
        entity_node = _entity_node(kind, value)
        total += graph[node_a][entity_node]["weight"]
    return min(total / 2.0, 1.0)  # /2.0: two matching high-weight signals should already read as ~1.0


def cluster_campaigns(graph: nx.Graph, min_incidents: int = 2) -> list[set[str]]:
    """All campaigns (connected components) with >= min_incidents distinct incidents."""
    campaigns = []
    for component in nx.connected_components(graph):
        incident_ids = {
            graph.nodes[n]["data"].incident_id
            for n in component
            if graph.nodes[n].get("node_type") == "incident"
        }
        if len(incident_ids) >= min_incidents:
            campaigns.append(incident_ids)
    return campaigns


# ---------------------------------------------------------------------------
# Demo / self-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    g = build_attribution_graph()

    incidents = [
        Incident("INC-001", from_domain="totally-different-domain.ru", originating_ip="185.220.101.45",
                 asn="AS208294", reply_to_domain="totally-different-domain.ru",
                 subject="Urgent: Updated payment instructions", fraud_score=0.91),
        Incident("INC-002", from_domain="totally-different-domain.ru", originating_ip="185.220.101.46",
                 asn="AS208294", reply_to_domain="payouts-secure.ru",
                 subject="Invoice overdue -- action required", fraud_score=0.87),
        Incident("INC-003", from_domain="unrelated-shop.com", originating_ip="45.33.32.156",
                 asn="AS63949", reply_to_domain="unrelated-shop.com",
                 subject="Your order has shipped", fraud_score=0.05),
        Incident("INC-004", from_domain="another-fraud-domain.tk", originating_ip="185.220.101.45",
                 asn="AS208294", reply_to_domain="payouts-secure.ru",
                 subject="RE: Wire transfer confirmation", fraud_score=0.94),
    ]
    for inc in incidents:
        add_incident(g, inc)

    print("=== Campaign clustering ===")
    for i, campaign in enumerate(cluster_campaigns(g), 1):
        print(f"  Campaign {i}: {sorted(campaign)}")

    print("\n=== Attribution: is INC-001 related to the others? ===")
    for other in ("INC-002", "INC-003", "INC-004"):
        related = other in find_related_incidents(g, "INC-001")
        conf = campaign_confidence(g, "INC-001", other)
        shared = shared_infrastructure(g, "INC-001", other)
        print(f"  INC-001 <-> {other}: related={related} confidence={conf:.2f} shared={shared}")
