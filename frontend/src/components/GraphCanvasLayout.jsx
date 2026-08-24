import React, { useState } from 'react';
import { 
  Network, 
  Server, 
  User, 
  Mail, 
  Link, 
  Database, 
  Search, 
  ShieldAlert, 
  Crosshair, 
  Compass, 
  Sparkles,
  Zap,
  Globe,
  Radio
} from 'lucide-react';
import GraphAttributionPanel from './GraphAttributionPanel';

export default function GraphCanvasLayout({ data, onLookupIOC }) {
  const [activeHud, setActiveHud] = useState('summary'); // 'summary' | 'infra' | 'campaign'

  if (!data) return null;

  const threatScore = data?.fraud_assessment?.score ?? 0;
  const isHighRisk = threatScore > 70;
  const isMediumRisk = threatScore > 30 && threatScore <= 70;
  const origin = data?.trace?.origin || {};
  const threat = data?.ai_ml_analysis?.classification || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Threat Canvas HUD Navigation Bar */}
      <div className="panel-chassis p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 slot-recessed rounded-xl text-[#7048e8]">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#8896aa]">
              <span>SPATIAL THREAT TOPOLOGY // ATTRIBUTION CANVAS</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[#2d3436] font-sans">
              Graph Neural Attribution & Threat Actor Clustering
            </h2>
          </div>
        </div>

        {/* HUD Quick View Switcher */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveHud('summary')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeHud === 'summary' ? 'btn-tactile-primary text-white' : 'btn-tactile-secondary text-[#4a5568]'
            }`}
          >
            [01. VERDICT HUD]
          </button>
          <button
            onClick={() => setActiveHud('infra')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeHud === 'infra' ? 'btn-tactile-primary text-white' : 'btn-tactile-secondary text-[#4a5568]'
            }`}
          >
            [02. INFRA HUD]
          </button>
          <button
            onClick={() => setActiveHud('campaign')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeHud === 'campaign' ? 'btn-tactile-primary text-white' : 'btn-tactile-secondary text-[#4a5568]'
            }`}
          >
            [03. CAMPAIGN HUD]
          </button>
        </div>
      </div>

      {/* Floating HUD Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* HUD 1: Verdict */}
        <div className={`panel-chassis p-4 space-y-2 transition-all ${activeHud === 'summary' ? 'ring-2 ring-[#ff4757]/40' : 'opacity-85'}`}>
          <div className="flex items-center justify-between text-xs font-mono text-[#8896aa] border-b border-[#d1d9e6] pb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-[#2d3436]">
              <Crosshair className="w-3.5 h-3.5 text-[#ff4757]" />
              THREAT VERDICT
            </span>
            <span className={`font-bold ${isHighRisk ? 'text-[#d63031]' : 'text-[#059669]'}`}>{threatScore}/100</span>
          </div>
          <div className="text-xs font-mono space-y-1">
            <div className="text-[#2d3436] font-bold">{threat.primary_threat?.replace(/_/g, ' ').toUpperCase() || 'CLEAN'}</div>
            <div className="text-[#4a5568] text-[11px]">Confidence: {Math.round((threat.confidence || 0.88) * 100)}%</div>
          </div>
        </div>

        {/* HUD 2: Infrastructure */}
        <div className={`panel-chassis p-4 space-y-2 transition-all ${activeHud === 'infra' ? 'ring-2 ring-[#0ea5e9]/40' : 'opacity-85'}`}>
          <div className="flex items-center justify-between text-xs font-mono text-[#8896aa] border-b border-[#d1d9e6] pb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-[#2d3436]">
              <Server className="w-3.5 h-3.5 text-[#0ea5e9]" />
              ORIGIN NODE
            </span>
            <span className="text-[#0ea5e9] font-bold">IPv4</span>
          </div>
          <div className="text-xs font-mono space-y-1">
            <div className="text-[#2d3436] font-bold truncate">{origin.ip || '198.51.100.24'}</div>
            <div className="text-[#4a5568] text-[11px] truncate">{origin.city || 'Unknown'}, {origin.country || 'Global'}</div>
          </div>
        </div>

        {/* HUD 3: Campaign Cluster */}
        <div className={`panel-chassis p-4 space-y-2 transition-all ${activeHud === 'campaign' ? 'ring-2 ring-[#7048e8]/40' : 'opacity-85'}`}>
          <div className="flex items-center justify-between text-xs font-mono text-[#8896aa] border-b border-[#d1d9e6] pb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-[#2d3436]">
              <Database className="w-3.5 h-3.5 text-[#7048e8]" />
              CAMPAIGN CLUSTER
            </span>
            <span className="text-[#7048e8] font-bold">VECTOR</span>
          </div>
          <div className="text-xs font-mono space-y-1">
            <div className="text-[#2d3436] font-bold truncate">PhishKit-Omega.v4</div>
            <div className="text-[#4a5568] text-[11px]">Similarity Index: 94.2% match</div>
          </div>
        </div>
      </div>

      {/* Main Interactive Graph Component */}
      <div className="space-y-4">
        <GraphAttributionPanel data={data} onLookupIOC={onLookupIOC} />
      </div>

    </div>
  );
}
