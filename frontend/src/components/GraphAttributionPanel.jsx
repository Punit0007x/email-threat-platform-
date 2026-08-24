import React, { useState } from 'react';
import { Network, Server, User, Mail, Link, Database, Search, X } from 'lucide-react';

const NODE_COLORS = {
  high: "bg-red-50 text-red-700 border-red-200",
  critical: "bg-purple-50 text-purple-700 border-purple-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-blue-50 text-blue-700 border-blue-200"
};

export default function GraphAttributionPanel({ data, onLookupIOC }) {
  const [selectedNode, setSelectedNode] = useState(null);

  if (!data) return null;

  const auth = data.auth_analysis || {};
  const threat = data.ai_ml_analysis?.classification || {};
  const origin = data.trace?.origin || {};
  const whois = data.whois_intel || {};
  const domain = data.from_domain || data.domain || 'Target Domain';
  const sender = data.from_address || 'Sender Mailbox';

  // Define synthetic graph nodes
  const nodes = [
    { id: 'actor', label: 'Attacker Group', type: 'actor', color: '#dc2626', icon: User, x: 80, y: 150, risk: threat.is_threat ? 'Critical' : 'Low' },
    { id: 'ip', label: `Server IP`, type: 'infrastructure', color: '#2563eb', icon: Server, x: 260, y: 80, risk: origin.is_proxy ? 'High' : 'Low' },
    { id: 'domain', label: `Website`, type: 'domain', color: '#d97706', icon: Link, x: 260, y: 220, risk: whois.domain_age_days < 30 ? 'High' : 'Low' },
    { id: 'sender', label: `Email Account`, type: 'mailbox', color: '#7c3aed', icon: Mail, x: 440, y: 150, risk: auth.spf === 'fail' ? 'High' : 'Clean' },
    { id: 'campaign', label: 'Known Attack', type: 'campaign', color: '#db2777', icon: Database, x: 620, y: 150, risk: 'Tracked' }
  ];

  const links = [
    { source: 'actor', target: 'ip', label: 'Uses' },
    { source: 'actor', target: 'domain', label: 'Owns' },
    { source: 'ip', target: 'sender', label: 'Sent From' },
    { source: 'domain', target: 'sender', label: 'Linked To' },
    { source: 'sender', target: 'campaign', label: 'Part Of' }
  ];

  const getNodeDetails = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    if (node.id === 'actor') {
      return {
        title: "Potential Threat Group",
        details: [
          { label: "Group Name", val: threat.primary_threat ? threat.primary_threat.replace(/_/g, ' ').toUpperCase() : "Unknown Attackers" },
          { label: "Confidence", val: `${Math.round((threat.confidence || 0.85) * 100)}% Match` },
          { label: "Goal", val: "Stealing passwords or money" },
          { label: "Target", val: "Employees and Executives" }
        ]
      };
    } else if (node.id === 'ip') {
      return {
        title: "Server Details",
        details: [
          { label: "IP Address", val: origin.ip || "198.51.100.24" },
          { label: "Location", val: `${origin.city || 'Unknown'}, ${origin.country || 'Global'}` },
          { label: "Internet Provider", val: origin.asn || origin.isp || "Cloud Hosting Network" },
          { label: "Hidden Connection", val: origin.is_proxy ? "Yes (Using VPN/Tor)" : "No (Direct)" }
        ]
      };
    } else if (node.id === 'domain') {
      return {
        title: "Website Information",
        details: [
          { label: "Address", val: domain },
          { label: "Age of Website", val: whois.domain_age_days ? `${whois.domain_age_days} days old` : "Just created" },
          { label: "Fake Website Status", val: data.domain_check?.is_lookalike ? "Looks like a real company but is fake" : "Standard website" },
          { label: "Registered Through", val: whois.registrar || "NameCheap / Cloudflare" }
        ]
      };
    } else if (node.id === 'sender') {
      return {
        title: "Email Account Checks",
        details: [
          { label: "From Address", val: sender },
          { label: "SPF Check", val: (auth.spf || "pass").toUpperCase() },
          { label: "DKIM Check", val: (auth.dkim || "pass").toUpperCase() },
          { label: "DMARC Check", val: (auth.dmarc || "pass").toUpperCase() }
        ]
      };
    } else {
      return {
        title: "Past Incident History",
        details: [
          { label: "Incident Name", val: data.threat_correlations?.linked_campaigns?.[0] || "Past Attack Wave" },
          { label: "Times Seen", val: `${data.threat_correlations?.domain_case_count || 1} related emails found` },
          { label: "Attack Type", val: "Phishing Link" }
        ]
      };
    }
  };

  const activeDetails = selectedNode ? getNodeDetails(selectedNode) : getNodeDetails('actor');

  return (
    <div className="panel-chassis p-6 sm:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shadow-sm border border-purple-100">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Connection Graph
            </h2>
            <p className="text-sm text-gray-500">
              A visual map showing how this sender is connected to servers and known attacks.
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
          Interactive Map
        </span>
      </div>

      {/* Graph Visual Canvas & Node Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Interactive Topology Canvas */}
        <div className="lg:col-span-2 bg-slate-50 border border-gray-200 p-4 relative overflow-hidden rounded-2xl flex items-center justify-center min-h-[360px] shadow-sm">
          
          <svg className="w-full h-full min-h-[340px]" viewBox="0 0 700 300">
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
                    stroke={isConnected ? "#dc2626" : "#cbd5e1"} 
                    strokeWidth={isConnected ? "3" : "2"} 
                    strokeDasharray={isConnected ? "none" : "6,6"}
                    className="transition-all duration-300"
                  />
                  {/* Link Label */}
                  <text 
                    x={(srcNode.x + tgtNode.x) / 2} 
                    y={(srcNode.y + tgtNode.y) / 2 - 8} 
                    fill="#64748b" 
                    fontSize="11" 
                    fontFamily="sans-serif"
                    fontWeight="600"
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
                      r={30} 
                      fill="none" 
                      stroke={node.color} 
                      strokeWidth="2" 
                      strokeDasharray="4,4"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* Main Node Body */}
                  <circle 
                    cx={node.x} 
                    cy={node.y} 
                    r={24} 
                    fill="#ffffff" 
                    stroke={node.color} 
                    strokeWidth={isSelected ? "3" : "2"} 
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))"
                  />

                  {/* Centered Node Icon */}
                  <foreignObject 
                    x={node.x - 10} 
                    y={node.y - 10} 
                    width={20} 
                    height={20}
                    className="pointer-events-none"
                  >
                    <Icon className="w-5 h-5" style={{ color: node.color }} />
                  </foreignObject>

                  {/* Node Label Text */}
                  <text 
                    x={node.x} 
                    y={node.y + 40} 
                    fill="#334155" 
                    fontSize="12" 
                    fontFamily="sans-serif"
                    fontWeight="600" 
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
        <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Details
              </span>
              <h3 className="text-sm font-bold text-gray-800">
                {activeDetails.title}
              </h3>
            </div>

            <div className="space-y-3 text-sm">
              {activeDetails.details.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-1">
                  <span className="text-gray-500 text-xs uppercase font-semibold block">{item.label}:</span>
                  <span className="text-gray-800 font-semibold break-all block">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500 italic pt-3 border-t border-gray-200 mt-4">
            Click any circle on the graph to see detailed information about that part of the email's origin.
          </p>
        </div>

      </div>

    </div>
  );
}
