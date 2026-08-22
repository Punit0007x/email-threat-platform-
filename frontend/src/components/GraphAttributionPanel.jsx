import React from 'react';
import { Network, Server, Globe, Link2, DollarSign, FileWarning, ArrowRight } from 'lucide-react';

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

export default function GraphAttributionPanel({ data }) {
  if (!data || !data.attribution_graph) return null;
  const { nodes = [], links = [], total_nodes, total_links } = data.attribution_graph;

  if (nodes.length === 0) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-5">
      
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
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
      </div>

      {/* Visual Relationship Chain Flow */}
      <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 overflow-x-auto">
        <div className="flex flex-wrap items-center gap-3 min-w-[500px]">
          {nodes.map((node, idx) => {
            const Icon = NODE_ICONS[node.type] || Network;
            const colorClass = NODE_COLORS[node.risk] || NODE_COLORS.low;

            return (
              <React.Fragment key={node.id}>
                <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${colorClass} bg-slate-800 shadow-md`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {node.type.replace('_', ' ')}
                    </span>
                    <span className="font-mono font-semibold text-white truncate max-w-[140px] block">
                      {node.label}
                    </span>
                  </div>
                </div>

                {idx < nodes.length - 1 && (
                  <div className="text-slate-600 flex items-center">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Node & Link Details Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Identified Entity Nodes</h4>
          <ul className="space-y-1.5 font-mono">
            {nodes.map((n) => (
              <li key={n.id} className="flex justify-between text-slate-300 bg-slate-800/50 px-2.5 py-1.5 rounded">
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
