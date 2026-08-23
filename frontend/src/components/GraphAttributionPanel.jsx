import React, { useState } from 'react';
import { Network, Server, Globe, Link2, DollarSign, FileWarning, ArrowRight, X, Search } from 'lucide-react';

const NODE_ICONS = {
  email: Network,
  domain: Globe,
  origin_ip: Server,
  relay_ip: Server,
  url: Link2,
  crypto_wallet: DollarSign,
  payload: FileWarning
};

const NODE_COLORS = {
  high: "bg-red-500/20 text-red-400 border-red-500/40",
  critical: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/40"
};

export default function GraphAttributionPanel({ data, onLookupIOC }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  if (!data || !data.attribution_graph) return null;
  const { nodes = [], links = [], total_nodes, total_links } = data.attribution_graph;

  if (nodes.length === 0) return null;

  const filteredNodes = typeFilter === 'all' 
    ? nodes 
    : nodes.filter(n => n.type === typeFilter);

  const availableTypes = Array.from(new Set(nodes.map(n => n.type)));

  const connectedLinks = selectedNode 
    ? links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
    : [];

  return (
    <div className="cyber-panel rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20 shadow-md">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Graph-Based Infrastructure Attribution
              <span className="text-xs bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded-full border border-purple-500/30">
                {total_nodes} Nodes &bull; {total_links} Relationships
              </span>
            </h2>
            <p className="text-xs text-slate-400">Relational topology connecting senders, relay hops, URLs, and threat artifacts</p>
          </div>
        </div>

        {/* Entity Type Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase font-bold transition-colors cursor-pointer border ${typeFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:text-white'}`}
          >
            All ({nodes.length})
          </button>
          {availableTypes.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase font-bold transition-colors cursor-pointer border ${typeFilter === t ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:text-white'}`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Relationship Chain Flow */}
      <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 overflow-x-auto">
        <div className="flex flex-wrap items-center gap-3 min-w-[500px]">
          {filteredNodes.map((node, idx) => {
            const Icon = NODE_ICONS[node.type] || Network;
            const colorClass = NODE_COLORS[node.risk] || NODE_COLORS.low;
            const isSelected = selectedNode && selectedNode.id === node.id;

            return (
              <React.Fragment key={node.id}>
                <button
                  onClick={() => setSelectedNode(isSelected ? null : node)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${colorClass} bg-slate-800 shadow-md transition-all cursor-pointer text-left ${isSelected ? 'ring-2 ring-indigo-400 scale-105' : 'hover:bg-slate-750'}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {node.type.replace('_', ' ')}
                    </span>
                    <span className="font-mono font-semibold text-white truncate max-w-[140px] block">
                      {node.label}
                    </span>
                  </div>
                </button>

                {idx < filteredNodes.length - 1 && (
                  <div className="text-slate-600 flex items-center">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Node Deep-Dive Inspector */}
      {selectedNode && (
        <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 space-y-3 animate-in fade-in duration-200 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase border ${NODE_COLORS[selectedNode.risk] || NODE_COLORS.low}`}>
                {selectedNode.risk || 'Low'} Risk
              </span>
              <h4 className="font-bold text-white font-mono">{selectedNode.label}</h4>
              <span className="text-slate-400 capitalize font-sans">({selectedNode.type.replace('_', ' ')})</span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Connected Graph Edges ({connectedLinks.length}):</span>
              {connectedLinks.length > 0 ? (
                connectedLinks.map((l, i) => (
                  <div key={i} className="font-mono text-[11px] text-slate-300 truncate">
                    <strong className="text-indigo-400">{l.label}</strong>: {l.source} &rarr; {l.target}
                  </div>
                ))
              ) : (
                <span className="text-slate-500 italic">No directional edges mapped to this node.</span>
              )}
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 space-y-2 font-mono text-[11px] flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider font-sans">Attribution Node Metadata:</span>
                <div className="text-slate-300">Entity ID: <span className="text-slate-200">{selectedNode.id}</span></div>
                <div className="text-slate-300">Classification: <span className="text-indigo-300 font-bold capitalize">{selectedNode.type}</span></div>
              </div>

              {onLookupIOC && (
                <button
                  onClick={() => onLookupIOC(selectedNode.label)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all cursor-pointer w-fit font-sans"
                >
                  <Search className="w-3.5 h-3.5" />
                  Investigate IOC in Threat Dossier
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Node & Link Details Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Identified Entity Nodes</h4>
          <ul className="space-y-1.5 font-mono">
            {nodes.map((n) => (
              <li 
                key={n.id} 
                onClick={() => setSelectedNode(selectedNode?.id === n.id ? null : n)}
                className={`flex justify-between text-slate-300 px-2.5 py-1.5 rounded cursor-pointer transition-colors ${selectedNode?.id === n.id ? 'bg-indigo-900/40 border border-indigo-500/40' : 'bg-slate-800/50 hover:bg-slate-800'}`}
              >
                <span className="text-slate-400 capitalize">{n.type.replace('_', ' ')}:</span>
                <span className="font-semibold text-indigo-300 truncate max-w-[200px]">{n.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Attribution Relationship Edges</h4>
          <ul className="space-y-1.5 font-mono">
            {links.map((l, idx) => (
              <li key={idx} className="flex items-center gap-2 text-slate-300 bg-slate-800/50 px-2.5 py-1.5 rounded">
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">{l.label}</span>
                <span className="text-slate-400 truncate">{l.source} &rarr; {l.target}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
