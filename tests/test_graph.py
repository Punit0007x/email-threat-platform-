from app.parsers.case_db import sync_graph_from_db, GLOBAL_GRAPH, cluster_campaigns
sync_graph_from_db()
print(f"Graph nodes: {len(GLOBAL_GRAPH.nodes)}")
print(f"Graph edges: {len(GLOBAL_GRAPH.edges)}")
campaigns = cluster_campaigns(GLOBAL_GRAPH, min_incidents=2)
print(f"Found {len(campaigns)} active campaigns")
