import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, Zap } from 'lucide-react';
import ThreatRadarGraphic from './ThreatRadarGraphic';

const getReasonCategory = (reason) => {
  const r = reason.toLowerCase();
  if (r.includes('authentication') || r.includes('spf') || r.includes('dkim') || r.includes('dmarc')) {
    return { label: 'AUTH', color: 'bg-red-500/20 text-red-300 border-red-500/30' };
  }
  if (r.includes('lookalike') || r.includes('return-path') || r.includes('domain') || r.includes('whois') || r.includes('registrar')) {
    return { label: 'DOMAIN/WHOIS', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  }
  if (r.includes('ai') || r.includes('bec') || r.includes('synthetic') || r.includes('pressure') || r.includes('urgency') || r.includes('authority')) {
    return { label: 'AI/BEHAVIOR', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  }
  if (r.includes('ip') || r.includes('tor') || r.includes('blocklist') || r.includes('cidr') || r.includes('dnsbl')) {
    return { label: 'NET/IP', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  }
  if (r.includes('dork') || r.includes('wayback') || r.includes('subdomain') || r.includes('phishing kit')) {
    return { label: 'OSINT', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
  }
  if (r.includes('attachment') || r.includes('link') || r.includes('shortener') || r.includes('payload')) {
    return { label: 'PAYLOAD', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  }
  return { label: 'SIGNAL', color: 'bg-slate-700 text-slate-300 border-slate-600' };
};

export default function FraudScorePanel({ data }) {
  const rawScore = data?.fraud_assessment?.score ?? 0;
  const risk_level = data?.fraud_assessment?.risk_level ?? 'LOW';
  const reasons = data?.fraud_assessment?.reasons ?? [];

  // Animated Count-Up Hook
  const [score, setScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, rawScore));
    if (end === 0) {
      setScore(0);
      return;
    }
    const duration = 800; // ms
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = end / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setScore(end);
        clearInterval(timer);
      } else {
        setScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [rawScore]);

  if (!data || !data.fraud_assessment) return null;

  let colorClass = "text-emerald-400";
  let Icon = CheckCircle;

  if (score > 70) {
    colorClass = "text-red-400";
    Icon = AlertTriangle;
  } else if (score > 30) {
    colorClass = "text-amber-400";
    Icon = Info;
  }

  // Calculate 6 Multi-Vector Sub-Scores for Explainable Defense
  const auth = data.auth_analysis || data.auth_assessment || {};
  const threat = data.ai_ml_analysis?.classification || {};
  const threatCorrelations = data.threat_correlations || {};
  const semanticMatches = data.semantic_matches || [];
  const trace = data.trace || {};
  const whois = data.whois_intel || {};
  const dns = data.dns_intel || {};
  const textSignals = data.text_signals || {};
  const qrUrls = data.qr_urls || [];

  const vectors = [
    {
      name: "Authentication Integrity",
      score: (auth.spf === 'fail' ? 35 : 0) + (auth.dkim === 'none' || auth.dkim === 'fail' ? 35 : 0) + (auth.dmarc === 'fail' ? 30 : 0),
      color: "from-red-500 to-rose-600",
      desc: "SPF, DKIM & DMARC alignment"
    },
    {
      name: "NLP & Behavioral Pressure",
      score: Math.round((threat.confidence || (score > 60 ? 0.85 : 0.2)) * 100),
      color: "from-purple-500 to-indigo-600",
      desc: "Urgency, fear & authority framing"
    },
    {
      name: "Origin & Network Physics",
      score: (trace.latency_triangulation?.is_anomaly ? 50 : 0) + (data.ip_reputation?.is_listed ? 35 : 0) + (score > 70 ? 15 : 0),
      color: "from-blue-500 to-cyan-600",
      desc: "Speed-of-light & DNSBL blocklists"
    },
    {
      name: "Domain & WHOIS Trust",
      score: (whois.domain_age_days < 30 ? 45 : (whois.domain_age_days < 90 ? 25 : 0)) + (data.domain_check?.is_lookalike ? 40 : 0) + (!dns.is_resolvable ? 15 : 0),
      color: "from-amber-500 to-orange-600",
      desc: "Domain age, typosquats & MX records"
    },
    {
      name: "Payload & Deceptive Links",
      score: (textSignals.link_mismatch_count > 0 ? 45 : 0) + (qrUrls.length > 0 ? 30 : 0) + (textSignals.has_shortener ? 25 : 0),
      color: "from-pink-500 to-rose-500",
      desc: "Link text mismatch, QR & shorteners"
    },
    {
      name: "Attribution & Vector Memory",
      score: (semanticMatches.length > 0 ? 55 : 0) + (threatCorrelations.domain_case_count > 1 ? 45 : 0),
      color: "from-emerald-500 to-teal-500",
      desc: "ChromaDB memory & repeat offenders"
    }
  ];

  // SVG Radial Gauge Calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  let gaugeGlow = "rgba(16, 185, 129, 0.15)";
  let gaugeColor = "#10b981";
  if (score > 70) {
    gaugeGlow = "rgba(244, 63, 94, 0.2)";
    gaugeColor = "#f43f5e";
  } else if (score > 30) {
    gaugeGlow = "rgba(245, 158, 11, 0.2)";
    gaugeColor = "#f59e0b";
  }

  return (
    <div className="cyber-panel rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      
      {/* Subtle ambient light */}
      <div 
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-500"
        style={{ background: gaugeGlow }}
      />

      <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
        
        {/* Clean SVG Circular Gauge */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 relative">
          <div className="relative flex items-center justify-center w-44 h-44">
            
            {/* SVG Circular Progress Meter */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-zinc-800"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={gaugeColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: "stroke-dashoffset 0.8s ease-out"
                }}
              />
            </svg>

            {/* Centered Score */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-5xl font-black font-mono tracking-tight ${colorClass}`}>
                {score}
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mt-0.5">
                Threat Score
              </span>
            </div>
          </div>

          <div className={`mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold uppercase tracking-wide text-xs ${colorClass} bg-zinc-900 border border-zinc-800 shadow-sm`}>
            <Icon className="w-4 h-4" />
            {risk_level} Risk Level
          </div>
        </div>

        {/* Reasons & Triggered Signals List */}
        <div className="flex-1 w-full bg-slate-950/60 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-inner space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Zap className="w-4 h-4 text-cyan-400" />
              Forensic Detection Telemetry & Signals
            </h3>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-3 py-0.5 rounded-full border border-cyan-500/30">
              {reasons.length} Signal(s)
            </span>
          </div>

          <ul className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {reasons && reasons.length > 0 ? (
              reasons.map((reason, idx) => {
                const cat = getReasonCategory(reason);
                return (
                  <li key={idx} className="flex items-start gap-2.5 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
                    <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase border flex-shrink-0 mt-0.5 ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-slate-200 leading-relaxed font-sans font-medium">{reason}</span>
                  </li>
                );
              })
            ) : (
              <li className="text-slate-500 italic text-xs py-4 text-center">No threat indicators detected. Standard legitimate email baseline.</li>
            )}
          </ul>

          {/* Quick Status Strip */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${score >= 70 ? 'bg-red-500 animate-ping' : (score > 30 ? 'bg-amber-500' : 'bg-emerald-500')}`} />
              <span>SIEM ACTION: <strong className="text-white">{score >= 70 ? 'HIGH-PRIORITY INCIDENT' : (score > 30 ? 'MANUAL REVIEW' : 'AUTO-APPROVED')}</strong></span>
            </div>
            {score >= 70 && (
              <span className="text-red-400 font-bold flex items-center gap-1 bg-red-950/50 px-2.5 py-0.5 rounded-md border border-red-500/30 text-[10px]">
                <ShieldAlert className="w-3.5 h-3.5" /> QUARANTINE ACTIVE
              </span>
            )}
          </div>
        </div>
        
      </div>

      {/* Interactive 360-degree Threat Radar Graphic */}
      <ThreatRadarGraphic data={data} score={score} />

      {/* Multi-Vector Sub-Score Breakdown Matrix */}
      <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <span className="w-1.5 h-3 bg-cyan-500 rounded-sm"></span>
            Multi-Vector Explainable Risk Breakdown
          </h4>
          <span className="text-[10px] font-mono text-slate-500">6 Mathematical Defense Dimensions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {vectors.map((vec, i) => (
            <div key={i} className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-200 text-[11px] font-sans">{vec.name}</span>
                <span className="font-mono font-bold text-[11px] text-cyan-300">{Math.min(100, Math.max(0, vec.score))}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${vec.color} transition-all duration-700 shadow-sm`}
                  style={{ width: `${Math.min(100, Math.max(4, vec.score))}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block truncate font-mono">{vec.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

