import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, Zap, Radio } from 'lucide-react';
import ThreatRadarGraphic from './ThreatRadarGraphic';

const getReasonCategory = (reason) => {
  const r = reason.toLowerCase();
  if (r.includes('authentication') || r.includes('spf') || r.includes('dkim') || r.includes('dmarc')) {
    return { label: 'SENDER', color: 'bg-red-100 text-red-700 border-red-200' };
  }
  if (r.includes('lookalike') || r.includes('return-path') || r.includes('domain') || r.includes('whois') || r.includes('registrar')) {
    return { label: 'DOMAIN', color: 'bg-orange-100 text-orange-700 border-orange-200' };
  }
  if (r.includes('ai') || r.includes('bec') || r.includes('synthetic') || r.includes('pressure') || r.includes('urgency') || r.includes('authority')) {
    return { label: 'BEHAVIOR', color: 'bg-purple-100 text-purple-700 border-purple-200' };
  }
  if (r.includes('ip') || r.includes('tor') || r.includes('blocklist') || r.includes('cidr') || r.includes('dnsbl')) {
    return { label: 'NETWORK', color: 'bg-blue-100 text-blue-700 border-blue-200' };
  }
  if (r.includes('dork') || r.includes('wayback') || r.includes('subdomain') || r.includes('phishing kit')) {
    return { label: 'HISTORY', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  if (r.includes('attachment') || r.includes('link') || r.includes('shortener') || r.includes('payload')) {
    return { label: 'CONTENT', color: 'bg-red-100 text-red-700 border-red-200' };
  }
  return { label: 'INFO', color: 'bg-gray-100 text-gray-700 border-gray-200' };
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

  let colorClass = "text-green-600";
  let gaugeColor = "#16a34a"; // green-600
  let Icon = CheckCircle;

  if (score > 70) {
    colorClass = "text-red-600";
    gaugeColor = "#dc2626"; // red-600
    Icon = AlertTriangle;
  } else if (score > 30) {
    colorClass = "text-amber-600";
    gaugeColor = "#d97706"; // amber-600
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
      name: "Sender Verification",
      score: (auth.spf === 'fail' ? 35 : 0) + (auth.dkim === 'none' || auth.dkim === 'fail' ? 35 : 0) + (auth.dmarc === 'fail' ? 30 : 0),
      color: "from-red-500 to-red-600",
      desc: "Checks if the sender is actually who they claim to be"
    },
    {
      name: "Manipulation & Urgency",
      score: Math.round((threat.confidence || (score > 60 ? 0.85 : 0.2)) * 100),
      color: "from-purple-500 to-purple-600",
      desc: "Detects pressuring language and scams"
    },
    {
      name: "Network Reputation",
      score: (trace.latency_triangulation?.is_anomaly ? 50 : 0) + (data.ip_reputation?.is_listed ? 35 : 0) + (score > 70 ? 15 : 0),
      color: "from-blue-500 to-blue-600",
      desc: "Checks if the email came from a known bad source"
    },
    {
      name: "Domain Trust",
      score: (whois.domain_age_days < 30 ? 45 : (whois.domain_age_days < 90 ? 25 : 0)) + (data.domain_check?.is_lookalike ? 40 : 0) + (!dns.is_resolvable ? 15 : 0),
      color: "from-amber-500 to-amber-600",
      desc: "Checks for fake or newly registered domains"
    },
    {
      name: "Links & Attachments",
      score: (textSignals.link_mismatch_count > 0 ? 45 : 0) + (qrUrls.length > 0 ? 30 : 0) + (textSignals.has_shortener ? 25 : 0),
      color: "from-pink-500 to-pink-600",
      desc: "Scans for hidden or dangerous links"
    },
    {
      name: "Past Threat History",
      score: (semanticMatches.length > 0 ? 55 : 0) + (threatCorrelations.domain_case_count > 1 ? 45 : 0),
      color: "from-green-500 to-green-600",
      desc: "Matches against previously known attacks"
    }
  ];

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="panel-chassis p-6 sm:p-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-800">
            Risk Analysis
          </h2>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8">
        
        {/* Radial Instrument Dial */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 relative">
          <div className="relative flex items-center justify-center w-48 h-48 rounded-full p-2 bg-slate-50 border border-gray-200">
            
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-gray-200"
                strokeWidth="11"
                fill="transparent"
              />
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

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-5xl font-bold tracking-tight ${colorClass}`}>
                {score}
              </span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">
                Risk Score
              </span>
            </div>
          </div>

          <div className={`mt-4 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-xs ${colorClass} bg-slate-50 border border-gray-200`}>
            <Icon className="w-4 h-4" />
            <span>{risk_level} Risk Level</span>
          </div>
        </div>

        {/* Reasons & Triggered Signals List */}
        <div className="flex-1 w-full bg-slate-50 border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600" />
              Suspicious Indicators Found
            </h3>
            <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-0.5">
              {reasons.length} Indicator(s)
            </span>
          </div>

          <ul className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {reasons && reasons.length > 0 ? (
              reasons.map((reason, idx) => {
                const cat = getReasonCategory(reason);
                return (
                  <li key={idx} className="flex items-start gap-3 text-sm bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex-shrink-0 mt-0.5 ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-gray-700 leading-relaxed font-medium">{reason}</span>
                  </li>
                );
              })
            ) : (
              <li className="text-gray-500 italic text-sm py-4 text-center">No suspicious indicators found. This email appears legitimate.</li>
            )}
          </ul>

          <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between text-xs font-medium text-gray-600 gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${score >= 70 ? 'bg-red-500 animate-pulse' : (score > 30 ? 'bg-amber-500' : 'bg-green-500')}`} />
              <span>Recommended Action: <strong className="text-gray-800">{score >= 70 ? 'Block Email & Warn User' : (score > 30 ? 'Manual Review' : 'Allow Email')}</strong></span>
            </div>
          </div>
        </div>
        
      </div>

      <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            Risk Factors Breakdown
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {vectors.map((vec, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">{vec.name}</span>
                <span className="font-bold text-gray-600">{Math.min(100, Math.max(0, vec.score))}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${vec.color} transition-all duration-700`}
                  style={{ width: `${Math.min(100, Math.max(4, vec.score))}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 block truncate">{vec.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

