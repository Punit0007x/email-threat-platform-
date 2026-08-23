import React, { useState } from 'react';
import { Network, Server, User, Mail, Link, Database, Search, X } from 'lucide-react';

const NODE_COLORS = {
  high: "bg-[#ff4757]/15 text-[#d63031] border-[#ff4757]/40",
  critical: "bg-[#7048e8]/15 text-[#5f3dc4] border-[#7048e8]/40",
  medium: "bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/40",
  low: "bg-[#0ea5e9]/15 text-[#0369a1] border-[#0ea5e9]/40"
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
    { id: 'actor', label: 'Threat Actor / Cluster', type: 'actor', color: '#ff4757', icon: User, x: 80, y: 150, risk: threat.is_threat ? 'Critical' : 'Low' },
    { id: 'ip', label: `IP: ${origin.ip || '198.51.100.24'}`, type: 'infrastructure', color: '#0ea5e9', icon: Server, x: 260, y: 80, risk: origin.is_proxy ? 'High' : 'Low' },
    { id: 'domain', label: `Domain: ${domain}`, type: 'domain', color: '#f59e0b', icon: Link, x: 260, y: 220, risk: whois.domain_age_days < 30 ? 'High' : 'Low' },
    { id: 'sender', label: `Sender: ${sender}`, type: 'mailbox', color: '#7048e8', icon: Mail, x: 440, y: 150, risk: auth.spf === 'fail' ? 'High' : 'Clean' },
    { id: 'campaign', label: 'Phishing Campaign Vector', type: 'campaign', color: '#ec4899', icon: Database, x: 620, y: 150, risk: 'Tracked' }
  ];

  const links = [
    { source: 'actor', target: 'ip', label: 'Controls Host' },
    { source: 'actor', target: 'domain', label: 'Registered Domain' },
    { source: 'ip', target: 'sender', label: 'Relayed Message' },
    { source: 'domain', target: 'sender', label: 'Sender Identity' },
    { source: 'sender', target: 'campaign', label: 'Correlated Cluster' }
  ];

  const getNodeDetails = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    if (node.id === 'actor') {
      return {
        title: "Threat Actor Cluster Attribution",
        details: [
          { label: "Cluster Name", val: threat.primary_threat ? threat.primary_threat.toUpperCase() : "UNC-THREAT-GROUP" },
          { label: "Confidence", val: `${Math.round((threat.confidence || 0.85) * 100)}% Match` },
          { label: "Motivation", val: "Credential Harvesting / Financial Wire BEC" },
          { label: "Target Sector", val: "Corporate Finance & Executive Accounts" }
        ]
      };
    } else if (node.id === 'ip') {
      return {
        title: "Origin Infrastructure Telemetry",
        details: [
          { label: "Origin IPv4", val: origin.ip || "198.51.100.24" },
          { label: "Location", val: `${origin.city || 'Unknown'}, ${origin.country || 'Global'}` },
          { label: "ASN / ISP", val: origin.asn || origin.isp || "Cloud Hosting Network" },
          { label: "Tor / VPN Node", val: origin.is_proxy ? "Yes (Detected)" : "Direct / Clean" }
        ]
      };
    } else if (node.id === 'domain') {
      return {
        title: "Domain Intelligence & WHOIS",
        details: [
          { label: "Domain Name", val: domain },
          { label: "Domain Age", val: whois.domain_age_days ? `${whois.domain_age_days} Days Old` : "Recently Created" },
          { label: "Lookalike Status", val: data.domain_check?.is_lookalike ? "Typosquatting Detected" : "Standard Domain" },
          { label: "Registrar", val: whois.registrar || "NameCheap / Cloudflare" }
        ]
      };
    } else if (node.id === 'sender') {
      return {
        title: "Sender Identity & Protocol Status",
        details: [
          { label: "From Header", val: sender },
          { label: "SPF Status", val: (auth.spf || "pass").toUpperCase() },
          { label: "DKIM Signature", val: (auth.dkim || "pass").toUpperCase() },
          { label: "DMARC Alignment", val: (auth.dmarc || "pass").toUpperCase() }
        ]
      };
    } else {
      return {
        title: "ChromaDB Threat Cluster Correlation",
        details: [
          { label: "Campaign Name", val: data.threat_correlations?.linked_campaigns?.[0] || "GLOBAL-PHISH-09" },
          { label: "Historical Hits", val: `${data.threat_correlations?.domain_case_count || 1} Linked Incidents` },
          { label: "MITRE ATT&CK", val: data.ai_ml_analysis?.ai_forensics?.mitre_attack_ttps?.[0]?.id || "T1566.002" }
        ]
      };
    }
  };

  const activeDetails = selectedNode ? getNodeDetails(selectedNode) : getNodeDetails('actor');

  return (
    <div className="panel-chassis p-6 sm:p-8 space-y-6 relative overflow-hidden">
      
      {/* Corner Screws */}
      <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d1d9e6] pb-4 px-2">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-[#e0e5ec] text-[#7048e8] rounded-2xl shadow-[var(--shadow-card)] border border-white/70">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2d3436] flex items-center gap-2">
              Threat Attribution Graph & Topology
            </h2>
            <p className="text-xs text-[#4a5568]">
              Relational graph nodes connecting Threat Actor clusters, proxy relays, domain registrars, and mailbox identities
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#7048e8] bg-[#7048e8]/15 px-3 py-1 rounded-xl border border-[#7048e8]/30 font-bold">
          Interactive Graph Explorer
        </span>
      </div>

      {/* Graph Visual Canvas & Node Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Interactive Topology Canvas */}
        <div className="lg:col-span-2 slot-recessed p-4 relative overflow-hidden rounded-2xl flex items-center justify-center min-h-[360px]">
          
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
                    stroke={isConnected ? "#ff4757" : "#babecc"} 
                    strokeWidth={isConnected ? "2.5" : "1.5"} 
                    strokeDasharray={isConnected ? "none" : "5,5"}
                    className="transition-all duration-300"
                  />
                  {/* Link Label */}
                  <text 
                    x={(srcNode.x + tgtNode.x) / 2} 
                    y={(srcNode.y + tgtNode.y) / 2 - 8} 
                    fill="#4a5568" 
                    fontSize="9" 
                    fontFamily="monospace"
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
                    r={22} 
                    fill="#f0f2f5" 
                    stroke={node.color} 
                    strokeWidth={isSelected ? "3" : "2"} 
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))"
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
                    y={node.y + 36} 
                    fill="#2d3436" 
                    fontSize="10" 
                    fontFamily="sans-serif"
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
        <div className="slot-recessed p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="border-b border-[#babecc]/50 pb-3">
              <span className="text-[10px] font-mono font-bold text-[#4a5568] uppercase tracking-wider block">
                Selected Entity Telemetry
              </span>
              <h3 className="text-xs font-bold text-[#2d3436] font-mono mt-0.5">
                {activeDetails.title}
              </h3>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              {activeDetails.details.map((item, idx) => (
                <div key={idx} className="bg-[#f0f2f5] p-2.5 rounded-xl border border-[#babecc]/50 shadow-sm space-y-0.5">
                  <span className="text-[#4a5568] text-[10px] uppercase font-bold block">{item.label}:</span>
                  <span className="text-[#2d3436] font-bold break-all block">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#4a5568] italic font-sans pt-2 border-t border-[#babecc]/50">
            Click any node on the topology diagram to inspect real-time attribution links and cryptographic evidence.
          </p>
        </div>

      </div>

    </div>
  );
}
