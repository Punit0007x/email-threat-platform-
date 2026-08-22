from typing import Dict, Any, List

def build_forensic_attribution_graph(
    email_data: Dict[str, Any],
    trace_results: Dict[str, Any],
    ai_ml_results: Dict[str, Any],
    dns_intel: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Constructs a graph network representing all relational nodes (Sender, IPs, Relays,
    Domains, Extracted URLs, Attachments, Crypto Wallets, and Recipient) and their forensic links.
    """
    nodes = []
    links = []
    
    # 1. Email Root Node
    email_node_id = "node_email_root"
    nodes.append({
        "id": email_node_id,
        "label": email_data.get("subject", "Email Incident")[:25] + "...",
        "type": "email",
        "risk": "high" if ai_ml_results.get("classification", {}).get("is_threat") else "low"
    })
    
    # 2. Sender Domain Node
    from_addr = email_data.get("from_address", "")
    domain = from_addr.split("@")[-1].strip(">").strip() if "@" in from_addr else "unknown-domain"
    sender_domain_id = f"domain_{domain}"
    nodes.append({
        "id": sender_domain_id,
        "label": domain,
        "type": "domain",
        "risk": "high" if not dns_intel.get("is_resolvable", True) or not dns_intel.get("has_mx_records", True) else "medium"
    })
    links.append({
        "source": email_node_id,
        "target": sender_domain_id,
        "label": "CLAIMED_FROM"
    })

    # 3. Origin IP Node
    origin_ip = trace_results.get("best_guess_ip")
    if origin_ip:
        origin_ip_id = f"ip_{origin_ip}"
        nodes.append({
            "id": origin_ip_id,
            "label": f"Origin: {origin_ip}",
            "type": "origin_ip",
            "risk": "high"
        })
        links.append({
            "source": sender_domain_id,
            "target": origin_ip_id,
            "label": "TRANSMITTED_FROM"
        })

    # 4. Relay Hop Nodes
    prev_node = origin_ip_id if origin_ip else email_node_id
    for idx, hop in enumerate(trace_results.get("hops", [])):
        hop_ip = hop.get("ip")
        if hop_ip and hop_ip != origin_ip:
            hop_id = f"hop_{hop_ip}_{idx}"
            nodes.append({
                "id": hop_id,
                "label": f"Relay: {hop_ip}",
                "type": "relay_ip",
                "risk": "low"
            })
            links.append({
                "source": prev_node,
                "target": hop_id,
                "label": f"HOP_{idx+1}"
            })
            prev_node = hop_id

    # 5. Extracted URLs Nodes
    urls = email_data.get("urls", [])
    for idx, u in enumerate(urls[:5]):
        url_id = f"url_{idx}"
        nodes.append({
            "id": url_id,
            "label": u[:30] + ("..." if len(u) > 30 else ""),
            "type": "url",
            "risk": "high"
        })
        links.append({
            "source": email_node_id,
            "target": url_id,
            "label": "CONTAINS_URL"
        })

    # 6. Crypto Wallet Nodes
    wallets = ai_ml_results.get("features", {}).get("entities", {}).get("crypto_wallets", [])
    for idx, w in enumerate(wallets[:3]):
        w_id = f"crypto_{idx}"
        nodes.append({
            "id": w_id,
            "label": f"BTC: {w[:10]}...",
            "type": "crypto_wallet",
            "risk": "critical"
        })
        links.append({
            "source": email_node_id,
            "target": w_id,
            "label": "DEMANDS_RANSOM_TO"
        })

    # 7. Suspicious Attachments
    suspicious_att = ai_ml_results.get("features", {}).get("suspicious_attachments", [])
    for idx, att in enumerate(suspicious_att[:3]):
        att_id = f"att_{idx}"
        nodes.append({
            "id": att_id,
            "label": att.get("filename", f"Payload_{idx}"),
            "type": "payload",
            "risk": "critical"
        })
        links.append({
            "source": email_node_id,
            "target": att_id,
            "label": "DELIVERS_PAYLOAD"
        })

    return {
        "nodes": nodes,
        "links": links,
        "total_nodes": len(nodes),
        "total_links": len(links)
    }
