import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, Zap, Radio } from 'lucide-react';
import ThreatRadarGraphic from './ThreatRadarGraphic';

const getReasonCategory = (reason) => {
  const r = reason.toLowerCase();
  if (r.includes('authentication') || r.includes('spf') || r.includes('dkim') || r.includes('dmarc')) {
    return { label: 'AUTH', color: 'bg-[#ff4757]/15 text-[#d63031] border-[#ff4757]/30' };
  }
  if (r.includes('lookalike') || r.includes('return-path') || r.includes('domain') || r.includes('whois') || r.includes('registrar')) {
    return { label: 'DOMAIN/WHOIS', color: 'bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/30' };
  }
  if (r.includes('ai') || r.includes('bec') || r.includes('synthetic') || r.includes('pressure') || r.includes('urgency') || r.includes('authority')) {
    return { label: 'AI/BEHAVIOR', color: 'bg-[#7048e8]/15 text-[#5f3dc4] border-[#7048e8]/30' };
  }
  if (r.includes('ip') || r.includes('tor') || r.includes('blocklist') || r.includes('cidr') || r.includes('dnsbl')) {
    return { label: 'NET/IP', color: 'bg-[#0ea5e9]/15 text-[#0369a1] border-[#0ea5e9]/30' };
  }
  if (r.includes('dork') || r.includes('wayback') || r.includes('subdomain') || r.includes('phishing kit')) {
    return { label: 'OSINT', color: 'bg-[#d97706]/15 text-[#92400e] border-[#d97706]/30' };
  }
  if (r.includes('attachment') || r.includes('link') || r.includes('shortener') || r.includes('payload')) {
    return { label: 'PAYLOAD', color: 'bg-[#ff4757]/15 text-[#d63031] border-[#ff4757]/30' };
  }
  return { label: 'SIGNAL', color: 'bg-[#e0e5ec] text-[#4a5568] border-[#babecc]' };
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

  let colorClass = "text-[#059669]";
  let gaugeColor = "#10b981";
  let Icon = CheckCircle;

  if (score > 70) {
    colorClass = "text-[#ff4757]";
    gaugeColor = "#ff4757";
    Icon = AlertTriangle;
  } else if (score > 30) {
    colorClass = "text-[#d97706]";
    gaugeColor = "#f59e0b";
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
      color: "from-[#ff4757] to-[#e84118]",
      desc: "SPF, DKIM & DMARC alignment"
    },
    {
      name: "NLP & Behavioral Pressure",
      score: Math.round((threat.confidence || (score > 60 ? 0.85 : 0.2)) * 100),
      color: "from-[#7048e8] to-[#5f3dc4]",
      desc: "Urgency, fear & authority framing"
    },
    {
      name: "Origin & Network Physics",
      score: (trace.latency_triangulation?.is_anomaly ? 50 : 0) + (data.ip_reputation?.is_listed ? 35 : 0) + (score > 70 ? 15 : 0),
      color: "from-[#0ea5e9] to-[#0284c7]",
      desc: "Speed-of-light & DNSBL blocklists"
    },
    {
      name: "Domain & WHOIS Trust",
      score: (whois.domain_age_days < 30 ? 45 : (whois.domain_age_days < 90 ? 25 : 0)) + (data.domain_check?.is_lookalike ? 40 : 0) + (!dns.is_resolvable ? 15 : 0),
      color: "from-[#f59e0b] to-[#d97706]",
      desc: "Domain age, typosquats & MX records"
    },
    {
      name: "Payload & Deceptive Links",
      score: (textSignals.link_mismatch_count > 0 ? 45 : 0) + (qrUrls.length > 0 ? 30 : 0) + (textSignals.has_shortener ? 25 : 0),
      color: "from-[#ec4899] to-[#db2777]",
      desc: "Link text mismatch, QR & shorteners"
    },
    {
      name: "Attribution & Vector Memory",
      score: (semanticMatches.length > 0 ? 55 : 0) + (threatCorrelations.domain_case_count > 1 ? 45 : 0),
      color: "from-[#10b981] to-[#059669]",
      desc: "ChromaDB memory & repeat offenders"
    }
  ];

  // SVG Radial Gauge Calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="panel-chassis p-6 sm:p-8 space-y-6 relative overflow-hidden">
      
      {/* Corner Screws */}
      <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

      <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-3 px-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#ff4757]" />
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#2d3436]">
            ANALYTIC MODULE // MULTI-VECTOR THREAT GAUGES
          </h2>
        </div>
        <div className="vent-louvers">
          <div className="vent-slot" />
          <div className="vent-slot" />
          <div className="vent-slot" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
        
        {/* Radial Instrument Dial */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 relative">
          <div className="relative flex items-center justify-center w-48 h-48 rounded-full p-2 slot-recessed">
            
            {/* SVG Circular Progress Meter */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-[#d1d9e6]"
                strokeWidth="11"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={gaugeColor}
                strokeWidth="11"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: "stroke-dashoffset 0.8s var(--ease-spring)"
                }}
              />
            </svg>

            {/* Centered Score */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-5xl font-black font-mono tracking-tight drop-shadow-[0_1px_0_#ffffff] ${colorClass}`}>
                {score}
              </span>
              <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest font-mono mt-0.5">
                Threat Score
              </span>
            </div>
          </div>

          <div className={`mt-3.5 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-xs ${colorClass} slot-recessed-sm`}>
            <Icon className="w-4 h-4" />
            <span>{risk_level} Risk Level</span>
          </div>
        </div>

        {/* Reasons & Triggered Signals List */}
        <div className="flex-1 w-full slot-recessed p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#babecc]/50 pb-3">
            <h3 className="text-xs font-bold text-[#2d3436] uppercase tracking-wider flex items-center gap-2 font-mono">
              <Radio className="w-4 h-4 text-[#ff4757]" />
              Forensic Detection Telemetry & Signals
            </h3>
            <span className="text-[11px] font-mono text-[#2d3436] font-bold slot-recessed-sm px-3 py-0.5">
              {reasons.length} Signal(s)
            </span>
          </div>

          <ul className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {reasons && reasons.length > 0 ? (
              reasons.map((reason, idx) => {
                const cat = getReasonCategory(reason);
                return (
                  <li key={idx} className="flex items-start gap-2.5 text-xs bg-[#f0f2f5] p-3 rounded-xl border border-[#babecc]/50 shadow-sm transition-all">
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase border flex-shrink-0 mt-0.5 ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-[#2d3436] leading-relaxed font-sans font-medium">{reason}</span>
                  </li>
                );
              })
            ) : (
              <li className="text-[#4a5568] italic text-xs py-4 text-center">No threat indicators detected. Standard legitimate email baseline.</li>
            )}
          </ul>

          {/* Quick Status Strip */}
          <div className="pt-2 border-t border-[#babecc]/50 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#4a5568] gap-2">
            <div className="flex items-center gap-2">
              <span className={`led-node ${score >= 70 ? 'led-node-red animate-pulse' : (score > 30 ? 'led-node-amber' : 'led-node-green')}`} />
              <span>SIEM ACTION: <strong className="text-[#2d3436] font-bold">{score >= 70 ? 'HIGH-PRIORITY INCIDENT' : (score > 30 ? 'MANUAL REVIEW' : 'AUTO-APPROVED')}</strong></span>
            </div>
            {score >= 70 && (
              <span className="text-[#d63031] font-bold flex items-center gap-1 bg-[#ff4757]/15 px-2.5 py-0.5 rounded border border-[#ff4757]/30 text-[10px]">
                <ShieldAlert className="w-3.5 h-3.5" /> QUARANTINE ACTIVE
              </span>
            )}
          </div>
        </div>
        
      </div>

      {/* Interactive 360-degree Threat Radar Graphic */}
      <ThreatRadarGraphic data={data} score={score} />

      {/* Multi-Vector Sub-Score Breakdown Matrix */}
      <div className="slot-recessed p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2d3436] font-mono flex items-center gap-2">
            <span className="w-1.5 h-3 bg-[#ff4757] rounded-sm"></span>
            Multi-Vector Explainable Risk Breakdown
          </h4>
          <span className="text-[10px] font-mono text-[#4a5568] font-semibold">6 Mathematical Defense Dimensions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {vectors.map((vec, i) => (
            <div key={i} className="bg-[#f0f2f5] p-3.5 rounded-xl border border-[#babecc]/60 space-y-2 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#2d3436] text-[11px] font-sans">{vec.name}</span>
                <span className="font-mono font-bold text-[11px] text-[#ff4757]">{Math.min(100, Math.max(0, vec.score))}%</span>
              </div>
              <div className="w-full bg-[#d1d9e6] h-2 rounded-full overflow-hidden shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${vec.color} transition-all duration-700`}
                  style={{ width: `${Math.min(100, Math.max(4, vec.score))}%` }}
                />
              </div>
              <span className="text-[10px] text-[#4a5568] block truncate font-mono font-medium">{vec.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

