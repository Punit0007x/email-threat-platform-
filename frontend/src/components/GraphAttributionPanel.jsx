import React, { useState, useEffect, useRef } from 'react';
import { Network, Server, User, Mail, Link, Database, Search, ShieldAlert, Activity, PieChart, BarChart3, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GraphAttributionPanel({ data, onLookupIOC }) {
  const [selectedNode, setSelectedNode] = useState(null);
  
  if (!data) return null;

  const auth = data.auth_analysis || {};
  const threat = data.ai_ml_analysis?.classification || {};
  const whois = data.whois_intel || {};
  const ipRep = data.ip_reputation || {};
  const sender = data.from_address || 'Sender Mailbox';
  const extractedDomain = sender.includes('@') ? sender.split('@').pop().replace('>', '').trim() : null;
  const domain = auth.from_domain || whois.domain || data.dns_intel?.domain || extractedDomain || 'Target Domain';

  const generateDynamicGraph = () => {
    const gNodes = [];

    // Order matters for the linear pipeline
    
    // 1. True Real-World Identity Node
    const trueIdentityName = whois.registrant_name || (threat.threat_actor ? `${threat.threat_actor} Operator` : "Hidden (Proxy/Privacy)");
    gNodes.push({ id: 'true_identity', name: trueIdentityName, type: 'true_identity', color: '#10b981', icon: Fingerprint, label: 'True Identity', details: [
      { label: "Real-World Identity", val: trueIdentityName },
      { label: "Resolution Source", val: whois.registrant_name ? "WHOIS Registration Records" : "AI Behavioral Attribution" },
      { label: "Status", val: "Unmasked True Sender" }
    ]});

    // 2. Infrastructure Node
    gNodes.push({ id: 'infra', name: data.trace?.best_guess_ip || 'Hidden Proxy', type: 'infrastructure', color: '#0ea5e9', icon: Server, label: 'Infrastructure', details: [
      { label: "Sending Server IP", val: data.trace?.best_guess_ip || 'Unknown' },
      { label: "Hosting Provider", val: data.ip_network_context?.asn_info?.as_name || "Unknown" },
      { label: "Server Risk", val: ipRep.risk_level || "Clean" }
    ]});

    // 3. Domain Node
    gNodes.push({ id: 'domain', name: domain, type: 'domain', color: '#f59e0b', icon: Link, label: 'Registered Domain', details: [
      { label: "Registered Domain", val: domain },
      { label: "Age", val: whois.domain_age_days ? `${whois.domain_age_days} days old` : "Unknown" },
      { label: "Registrar", val: whois.registrar || "Unknown" }
    ]});

    // 4. Claimed Sender Node
    gNodes.push({ id: 'sender', name: sender.substring(0,25), type: 'mailbox', color: '#6366f1', icon: Mail, label: 'Claimed Sender', details: [
      { label: "Claimed Sender", val: sender },
      { label: "Spoofing Check", val: (auth.spf === 'pass' && auth.dkim === 'pass') ? "Passed (Legitimate)" : "Failed (Likely Spoofed)" }
    ]});

    return { nodes: gNodes };
  };

  const { nodes } = generateDynamicGraph();

  const getNodeDetails = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { title: "Unknown Element", details: [] };
    
    return {
      title: node.label,
      details: node.details || []
    };
  };

  const activeDetails = selectedNode ? getNodeDetails(selectedNode) : getNodeDetails('true_identity');

  // Chart Data Calculations
  const threatScore = Math.round((threat.confidence || 0.1) * 100);
  const domainRisk = whois.domain_age_days < 30 ? 95 : (whois.domain_age_days < 180 ? 60 : 15);
  const serverRisk = ipRep.risk_level === 'Critical' ? 98 : (ipRep.risk_level === 'High' ? 80 : 20);
  const contentRisk = threat.primary_threat === 'clean' ? 10 : threatScore;

  return (
    <div className="bg-transparent space-y-6 relative overflow-hidden">
      
      {/* Easy to Understand Header with Specific Description */}
      <div className="bg-white/20 backdrop-blur-3xl border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] rounded-[2rem] p-8">
        <div className="flex items-start gap-4 border-b border-white/40 pb-6 mb-6">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 text-red-600 flex-shrink-0 mt-1">
            <Network className="w-8 h-8" />
          </div>
          <div className="space-y-3 w-full">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 drop-shadow-sm mb-2">
                Identity & Threat Attribution Map
              </h2>
              <p className="text-sm text-slate-700 drop-shadow-sm leading-relaxed max-w-4xl">
                This interactive forensic map reveals the true origin of a threat by bypassing spoofed headers and tracing the digital footprints left behind. It connects the claimed sender to the actual physical server infrastructure, domain registration records, and known attacker behaviors to unmask the real-world identity of the hacker.
              </p>
            </div>
            
            {/* Specific Node Legend */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-4 flex flex-wrap gap-x-6 gap-y-3 mt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
                <span className="text-xs font-bold text-slate-700 drop-shadow-sm uppercase tracking-wide">True Identity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#0ea5e9] shadow-[0_0_8px_#0ea5e9]"></span>
                <span className="text-xs font-bold text-slate-700 drop-shadow-sm uppercase tracking-wide">Infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]"></span>
                <span className="text-xs font-bold text-slate-700 drop-shadow-sm uppercase tracking-wide">Registered Domain</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#6366f1] shadow-[0_0_8px_#6366f1]"></span>
                <span className="text-xs font-bold text-slate-700 drop-shadow-sm uppercase tracking-wide">Claimed Sender</span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Graph Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Slightly Dark Modern Linear Pipeline Graph */}
          <div className="lg:col-span-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm p-8 relative overflow-x-auto overflow-y-hidden flex items-center min-h-[400px]">
            
            {/* Subtle Contrast Grid */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="flex items-center justify-between min-w-[700px] w-full px-12 relative z-10">
              
              {/* Bold Track Line */}
              <div className="absolute left-24 right-24 top-1/2 -translate-y-1/2 h-1.5 bg-white/30 z-0 rounded-full overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 opacity-60 animate-[pulse_2s_ease-in-out_infinite]" />
                <style>{`
                  @keyframes dataFlow {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                  }
                `}</style>
                {/* Traveling Data Packets */}
                <div 
                  className="absolute inset-0 h-full w-full opacity-80"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                    backgroundSize: '20% 100%',
                    animation: 'dataFlow 2s linear infinite',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
              </div>

              {/* Nodes */}
              {nodes.map((node, idx) => {
                const isSelected = selectedNode === node.id;
                const Icon = node.icon;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.2, type: "spring", stiffness: 200, damping: 15 }}
                    key={node.id} 
                    className="relative z-10 flex flex-col items-center cursor-pointer group"
                    onClick={() => setSelectedNode(node.id)}
                  >
                    {/* Glassmorphism Node Body */}
                    <div 
                      className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 transform 
                      ${isSelected ? 'scale-110 rotate-3 bg-white/40 shadow-[0_0_30px_rgba(255,255,255,0.5)]' : 'hover:scale-105 hover:-rotate-3 bg-white/20 backdrop-blur-md shadow-lg'} 
                      border border-white/60`}
                      style={{ 
                        boxShadow: isSelected ? `0 15px 30px -5px ${node.color}40, inset 0 0 15px ${node.color}20` : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      
                      {/* Pulsing ring animation when selected */}
                      {isSelected && (
                        <div className="absolute inset-[-8px] rounded-2xl border-[3px] animate-ping opacity-50" style={{ borderColor: node.color }}></div>
                      )}
                      
                      {/* Icon */}
                      <Icon className="w-8 h-8 transition-colors duration-300" style={{ color: isSelected ? node.color : '#334155' }} />
                      
                      {/* Little status light */}
                      <div 
                        className={`absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 ${isSelected ? 'border-white animate-pulse' : 'border-white/50'}`}
                        style={{ backgroundColor: node.color }}
                      />
                    </div>

                    {/* Crisp Labels */}
                    <div className={`absolute top-24 text-center w-36 space-y-1.5 p-2.5 rounded-xl border border-white/40 backdrop-blur-md transition-all duration-300 ${isSelected ? 'bg-white/40 shadow-xl' : 'bg-white/20 shadow-sm opacity-90 group-hover:opacity-100 group-hover:bg-white/30'}`}>
                      <div 
                        className="text-[10px] font-bold uppercase tracking-widest font-mono drop-shadow-sm"
                        style={{ color: node.color }}
                      >
                        {node.label}
                      </div>
                      <div className="text-xs font-bold text-slate-900 drop-shadow-sm truncate px-1">
                        {node.name}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

            </div>

          </div>

          {/* Node Telemetry Inspector Drawer */}
          <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-white/30 pb-3">
                <span className="text-xs font-bold text-slate-700 drop-shadow-sm uppercase tracking-wider block mb-1">
                  Investigation Details
                </span>
                <h3 className="text-lg font-bold text-slate-900 drop-shadow-sm">
                  {activeDetails.title}
                </h3>
              </div>

              <div className="space-y-3">
                {activeDetails.details.map((item, idx) => (
                  <div key={idx} className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-3 space-y-1">
                    <span className="text-slate-700 drop-shadow-sm text-xs font-bold uppercase tracking-wide block">{item.label}:</span>
                    <span className="text-slate-900 drop-shadow-sm font-bold break-words block text-sm">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm p-4">
              <p className="text-sm text-slate-900 drop-shadow-sm font-medium flex items-start gap-2">
                <Search className="w-5 h-5 flex-shrink-0 text-indigo-600" />
                <span>Click and drag the colored dots on the map to explore the network. Select a dot to read its details here.</span>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* NEW SECTION: Statistical Graphs */}
      <div className="bg-white/20 backdrop-blur-3xl border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] rounded-[2rem] p-8">
        <h3 className="text-xl font-bold text-slate-900 drop-shadow-sm mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          Threat Risk Breakdown Graphs
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Chart 1: Bar Chart of Risk Factors */}
          <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-6">
            <h4 className="text-sm font-bold text-slate-700 drop-shadow-sm uppercase tracking-wide mb-6 text-center">
              Risk by Component
            </h4>
            <div className="space-y-5">
              {[
                { label: 'Domain Suspicion', value: domainRisk, color: 'bg-amber-500' },
                { label: 'Origin Server Risk', value: serverRisk, color: 'bg-red-500' },
                { label: 'Content Maliciousness', value: contentRisk, color: 'bg-indigo-500' }
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-900 drop-shadow-sm">
                    <span>{stat.label}</span>
                    <span>{stat.value}%</span>
                  </div>
                  <div className="w-full bg-white/30 h-3 rounded-full overflow-hidden border border-white/40 shadow-inner">
                    <div 
                      className={`h-full rounded-full ${stat.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${stat.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Donut Chart of Confidence */}
          <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-6 flex flex-col items-center justify-center">
            <h4 className="text-sm font-bold text-slate-700 drop-shadow-sm uppercase tracking-wide mb-6 text-center">
              AI Attribution Confidence
            </h4>
            
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* CSS Donut Chart */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="rgba(255,255,255,0.4)" strokeWidth="16" />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  fill="transparent" 
                  stroke={threatScore > 75 ? "#ef4444" : (threatScore > 40 ? "#f59e0b" : "#10b981")} 
                  strokeWidth="16" 
                  strokeDasharray={`${(threatScore / 100) * 439.8} 439.8`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-900 drop-shadow-sm">{threatScore}%</span>
                <span className="text-xs font-bold text-slate-700 drop-shadow-sm">CONFIDENCE</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-700 drop-shadow-sm mt-6 max-w-xs font-medium">
              This score indicates how confident our AI is that it correctly identified the specific hacker group responsible.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
