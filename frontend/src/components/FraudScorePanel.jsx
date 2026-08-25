import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, Zap, Radio } from 'lucide-react';
import ThreatRadarGraphic from './ThreatRadarGraphic';

const getReasonCategory = (reason) => {
  const r = reason.toLowerCase();
  if (r.includes('authentication') || r.includes('spf') || r.includes('dkim') || r.includes('dmarc')) {
    return { label: 'AUTH', color: 'bg-[#ef4444]/15 text-[#d63031] border-[#ef4444]/30' };
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
    return { label: 'PAYLOAD', color: 'bg-[#ef4444]/15 text-[#d63031] border-[#ef4444]/30' };
  }
  return { label: 'SIGNAL', color: 'bg-[#ffffff] text-[#64748b] border-[#e2e8f0]' };
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
    colorClass = "text-[#ef4444]";
    gaugeColor = "#ef4444";
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
      color: "from-[#ef4444] to-[#e84118]",
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

      <div className="flex items-center justify-between border-b border-gray-200 pb-4 px-2">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">
            Fraudulent Email Detection Engine
          </h2>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
        
        {/* Radial Instrument Dial */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 relative">
          <div className="relative flex items-center justify-center w-56 h-56 rounded-full p-2 bg-white shadow-sm border border-gray-100">
            
            {/* SVG Circular Progress Meter */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-gray-100"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={gaugeColor}
                strokeWidth="12"
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
              <span className={`text-6xl font-black tracking-tight ${colorClass}`}>
                {score}
              </span>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-1">
                Fraud Score
              </span>
            </div>
          </div>

          <div className={`mt-4 flex items-center gap-2 px-5 py-2 rounded-full font-bold uppercase tracking-wide text-sm bg-white shadow-sm border border-gray-100 ${colorClass}`}>
            <Icon className="w-5 h-5" />
            <span>{risk_level} Risk Level</span>
          </div>
        </div>

        {/* Reasons & Triggered Signals List */}
        <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-500" />
              Detected Threat Indicators
            </h3>
            <span className="text-sm text-gray-600 font-semibold bg-gray-50 px-3 py-1 rounded-lg">
              {reasons.length} Indicator(s) Found
            </span>
          </div>

          <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {reasons && reasons.length > 0 ? (
              reasons.map((reason, idx) => {
                const cat = getReasonCategory(reason);
                return (
                  <li key={idx} className="flex items-start gap-3 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 transition-all">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase border flex-shrink-0 ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-gray-800 leading-relaxed font-medium">{reason}</span>
                  </li>
                );
              })
            ) : (
              <li className="text-gray-500 italic text-sm py-6 text-center bg-gray-50 rounded-xl">No threat indicators detected. This email appears legitimate.</li>
            )}
          </ul>

          {/* Quick Status Strip */}
          <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between text-sm text-gray-600 gap-3">
            <div className="flex items-center gap-2">
              <span>Recommended Action: <strong className="text-gray-900 font-bold">{score >= 70 ? 'Block and Quarantine' : (score > 30 ? 'Review Carefully' : 'Allow (Safe)')}</strong></span>
            </div>
            {score >= 70 && (
              <span className="text-red-700 font-bold flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                <ShieldAlert className="w-4 h-4" /> QUARANTINE SUGGESTED
              </span>
            )}
          </div>
        </div>
        
      </div>

      {/* Interactive 360-degree Threat Radar Graphic */}
      <ThreatRadarGraphic data={data} score={score} />

      {/* Multi-Vector Sub-Score Breakdown Matrix */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-500 rounded-sm"></span>
            Threat Breakdown Analysis
          </h4>
          <span className="text-sm text-gray-500 font-medium">NLP & ML Component Scores</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {vectors.map((vec, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">{vec.name}</span>
                <span className="font-bold text-red-500">{Math.min(100, Math.max(0, vec.score))}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${vec.color} transition-all duration-700`}
                  style={{ width: `${Math.min(100, Math.max(4, vec.score))}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 block truncate font-medium">{vec.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

