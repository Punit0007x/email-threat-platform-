import React, { useState } from 'react';
import { Network, Server, User, Mail, Link, Database, Search, X } from 'lucide-react';

export default function GraphAttributionPanel({ data, onLookupIOC }) {
  const [selectedNode, setSelectedNode] = useState(null);

  if (!data) return null;

  const auth = data.auth_analysis || {};
  const threat = data.ai_ml_analysis?.classification || {};
  const origin = data.trace?.origin || {};
  const whois = data.whois_intel || {};
  const domain = data.from_domain || data.domain || 'Target Domain';
  const sender = data.from_address || 'Sender Mailbox';

  const generateDynamicGraph = () => {
    const gNodes = [];
    const gLinks = [];

    // 1. Sender Mailbox Node
    gNodes.push({ id: 'sender', label: sender.substring(0,25), type: 'mailbox', color: '#6366f1', icon: Mail, x: 350, y: 150, details: [
      { label: "From Header", val: sender },
      { label: "SPF Status", val: (auth.spf || "pass").toUpperCase() },
      { label: "DKIM Signature", val: (auth.dkim || "pass").toUpperCase() },
      { label: "DMARC Alignment", val: (auth.dmarc || "pass").toUpperCase() }
    ]});

    // 2. Domain Node
    gNodes.push({ id: 'domain', label: domain, type: 'domain', color: '#f59e0b', icon: Link, x: 200, y: 80, details: [
      { label: "Domain Age", val: whois.domain_age_days ? `${whois.domain_age_days} days` : "Unknown" },
      { label: "Registrar", val: whois.registrar || "Unknown" },
      { label: "Subdomains Detected", val: data.domain_recon?.subdomain_count || 0 }
    ]});
    gLinks.push({ source: 'domain', target: 'sender', label: 'Registered Email' });

    // 3. Infrastructure Node
    if (data.trace?.best_guess_ip) {
      gNodes.push({ id: 'infra', label: data.trace.best_guess_ip, type: 'infrastructure', color: '#0ea5e9', icon: Server, x: 200, y: 220, details: [
        { label: "Origin IP", val: data.trace.best_guess_ip },
        { label: "ISP / Host", val: data.ip_network_context?.asn_info?.as_name || "Unknown" },
        { label: "Reputation", val: data.ip_reputation?.risk_level || "Clean" }
      ]});
      gLinks.push({ source: 'infra', target: 'sender', label: 'Origin Server' });
    }

    // 4. Threat Actor Node
    if (threat.threat_actor || (threat.confidence > 0.4 && threat.primary_threat !== 'clean')) {
      gNodes.push({ id: 'actor', label: threat.threat_actor || 'Unknown Threat Actor', type: 'actor', color: '#ef4444', icon: User, x: 500, y: 150, details: [
        { label: "Actor Group", val: threat.threat_actor || "Unknown (Behavioral Match)" },
        { label: "Target Sector", val: "Broad Opportunistic" },
        { label: "Confidence", val: `${Math.round(threat.confidence * 100)}%` }
      ]});
      gLinks.push({ source: 'sender', target: 'actor', label: 'Attributed Identity' });
    }

    // 5. MITRE ATT&CK Node
    const mitre = data.ai_ml_analysis?.features?.mitre_attack_ttps;
    if (mitre && mitre.length > 0) {
      gNodes.push({ id: 'mitre', label: mitre[0].id || 'MITRE TTP', type: 'mitre', color: '#8b5cf6', icon: Database, x: 600, y: 80, details: [
        { label: "Tactic", val: mitre[0].tactic },
        { label: "Technique", val: mitre[0].name },
        { label: "Description", val: mitre[0].description }
      ]});
      gLinks.push({ source: 'sender', target: 'mitre', label: 'Observed Tactic' });
    }

    // Adjust coordinates based on node count to keep them centered
    const numNodes = gNodes.length;
    gNodes.forEach((n, idx) => {
      if (numNodes <= 3) {
        n.x = 100 + (idx * 200);
        n.y = 150;
      }
    });

    return { nodes: gNodes, links: gLinks };
  };

  const { nodes, links } = generateDynamicGraph();

  const getNodeDetails = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { title: "Unknown Node", details: [] };
    
    const titles = {
      mailbox: "Sender Identity Details",
      domain: "Domain Registration Info",
      infrastructure: "Network Origin Info",
      actor: "Threat Actor Profile",
      mitre: "MITRE ATT&CK Technique"
    };

    return {
      title: titles[node.type] || node.label,
      details: node.details || []
    };
  };

  const activeDetails = selectedNode ? getNodeDetails(selectedNode) : getNodeDetails('actor');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Identity & Attribution Graph
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Mapping relationships between domains, servers, sender identities, and threat actors.
            </p>
          </div>
        </div>
      </div>

      {/* Graph Visual Canvas & Node Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Interactive Topology Canvas */}
        <div className="lg:col-span-2 bg-gray-50 border border-gray-100 p-4 relative overflow-hidden rounded-2xl flex items-center justify-center min-h-[400px]">
          
          <svg className="w-full h-full min-h-[360px]" viewBox="0 0 700 300">
            {/* Draw Links */}
            {links.map((link, i) => {
              const srcNode = nodes.find(n => n.id === link.source);
              const tgtNode = nodes.find(n => n.id === link.target);
              if (!srcNode || !tgtNode) return null;

              const isConnected = selectedNode === link.source || selectedNode === link.target;

              return (
                <g key={i}>
                  <line 
                    x1={srcNode.x} 
                    y1={srcNode.y} 
                    x2={tgtNode.x} 
                    y2={tgtNode.y} 
                    stroke={isConnected ? "#ef4444" : "#cbd5e1"} 
                    strokeWidth={isConnected ? "3" : "2"} 
                    strokeDasharray={isConnected ? "none" : "6,6"}
                    className="transition-all duration-300"
                  />
                  {/* Link Label */}
                  <text 
                    x={(srcNode.x + tgtNode.x) / 2} 
                    y={(srcNode.y + tgtNode.y) / 2 - 10} 
                    fill="#64748b" 
                    fontSize="11" 
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {link.label}
                  </text>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode === node.id;
              const Icon = node.icon;

              return (
                <g 
                  key={node.id} 
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(node.id)}
                >
                  {/* Outer circle halo on selected */}
                  {isSelected && (
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r={34} 
                      fill="none" 
                      stroke={node.color} 
                      strokeWidth="3" 
                      strokeDasharray="6,6"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* Main Node Body */}
                  <circle 
                    cx={node.x} 
                    cy={node.y} 
                    r={26} 
                    fill="#ffffff" 
                    stroke={node.color} 
                    strokeWidth={isSelected ? "4" : "3"} 
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                  />

                  {/* Centered Node Icon */}
                  <foreignObject 
                    x={node.x - 12} 
                    y={node.y - 12} 
                    width={24} 
                    height={24}
                    className="pointer-events-none"
                  >
                    <Icon className="w-6 h-6" style={{ color: node.color }} />
                  </foreignObject>

                  {/* Node Label Text */}
                  <text 
                    x={node.x} 
                    y={node.y + 45} 
                    fill="#1e293b" 
                    fontSize="12" 
                    fontWeight="bold" 
                    textAnchor="middle"
                    className="select-none"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Telemetry Inspector Drawer */}
        <div className="bg-gray-50 border border-gray-100 p-6 space-y-4 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Selected Entity Info
              </span>
              <h3 className="text-base font-bold text-gray-900">
                {activeDetails.title}
              </h3>
            </div>

            <div className="space-y-3">
              {activeDetails.details.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 space-y-1 shadow-sm">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-wide block">{item.label}:</span>
                  <span className="text-gray-900 font-bold break-all block text-sm">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500 italic pt-4 border-t border-gray-200 font-medium">
            Click any node on the graph to view its detailed relationship info.
          </p>
        </div>

      </div>

    </div>
  );
}
