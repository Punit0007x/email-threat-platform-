import React from 'react';
import { 
  Brain, 
  ShieldAlert, 
  Bot, 
  UserX, 
  CheckSquare, 
  TrendingUp, 
  Zap, 
  Flame,
  FileSearch,
  ExternalLink
} from 'lucide-react';

const THREAT_LABELS = {
  clean: "Legitimate / Benign",
  phishing_credential_harvesting: "Phishing: Credential Harvesting",
  bec_executive_impersonation: "Business Email Compromise (BEC)",
  invoice_payment_fraud: "Invoice & Payment Diversion",
  extortion_blackmail: "Extortion & Blackmail",
  malware_delivery: "Malicious Payload / Malware Delivery",
  brand_impersonation: "Brand Impersonation & Typosquatting"
};

export default function AIMLThreatPanel({ data }) {
  if (!data || !data.ai_ml_analysis) return null;

  const {
    classification = {},
    features = {},
    bec_analysis = {},
    synthetic_analysis = {},
    ai_forensics = {}
  } = data.ai_ml_analysis;

  const primaryThreat = classification.primary_threat || "clean";
  const confidencePct = Math.round((classification.confidence || 0) * 100);
  const isThreat = classification.is_threat;
  const probs = classification.probabilities || {};

  const manipScores = features.manipulation_vectors?.scores || {};
  const ttps = ai_forensics.mitre_attack_ttps || [];
  const socActions = ai_forensics.recommended_soc_actions || [];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-500 text-white rounded-xl shadow-md">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI / ML Neural Threat Intelligence
              <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
                Ensemble v2.1
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Multi-task NLP classification, BEC telemetry, synthetic language forensics, and MITRE ATT&CK mapping
            </p>
          </div>
        </div>

        {/* Primary Classification Pill */}
        <div className="text-right">
          <div className="text-xs font-semibold uppercase text-slate-400">Primary Classification</div>
          <div className={`text-base font-black ${isThreat ? 'text-red-400' : 'text-emerald-400'}`}>
            {THREAT_LABELS[primaryThreat] || primaryThreat}
          </div>
          <div className="text-xs text-slate-500 font-mono">Confidence: {confidencePct}%</div>
        </div>
      </div>

      {/* Forensic Summary Alert */}
      {ai_forensics.forensic_summary && (
        <div className="bg-slate-900/60 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
          <FileSearch className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Executive Forensic Brief</h4>
            <p className="text-sm text-slate-200 leading-relaxed">{ai_forensics.forensic_summary}</p>
          </div>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Category Probabilities & Multi-Vector */}
        <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Threat Category Probability Distribution
          </h3>

          <div className="space-y-3">
            {Object.entries(probs).map(([catKey, probVal]) => {
              const pct = Math.round(probVal * 100);
              const isSelected = catKey === primaryThreat;
              const isClean = catKey === "clean";

              let barColor = isClean ? "bg-emerald-500" : "bg-blue-500";
              if (!isClean && pct >= 40) barColor = "bg-red-500";
              else if (!isClean && pct >= 20) barColor = "bg-amber-500";

              return (
                <div key={catKey} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className={isSelected ? "text-white font-bold" : "text-slate-400"}>
                      {THREAT_LABELS[catKey] || catKey}
                    </span>
                    <span className="font-mono text-slate-300">{pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 rounded-full ${barColor}`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Multi-Vector Threat Indicator */}
          {classification.is_multi_vector_attack && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-300">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>Multi-Vector Campaign: Combines <strong>{classification.detected_attack_vectors?.join(", ")}</strong></span>
            </div>
          )}
        </div>

        {/* Right Column: Social Engineering & BEC Telemetry */}
        <div className="space-y-6">
          
          {/* Social Engineering Vectors */}
          <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Social Engineering & Manipulation Vectors
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block">Urgency / Pressure:</span>
                <span className={`font-bold font-mono ${manipScores.urgency > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {manipScores.urgency || 0} trigger(s)
                </span>
              </div>
              <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block">Fear & Intimidation:</span>
                <span className={`font-bold font-mono ${manipScores.fear_intimidation > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                  {manipScores.fear_intimidation || 0} trigger(s)
                </span>
              </div>
              <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block">Authority Framing:</span>
                <span className={`font-bold font-mono ${manipScores.authority > 0 ? 'text-indigo-400' : 'text-slate-300'}`}>
                  {manipScores.authority || 0} trigger(s)
                </span>
              </div>
              <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block">Financial / Greed:</span>
                <span className={`font-bold font-mono ${manipScores.financial_greed > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {manipScores.financial_greed || 0} trigger(s)
                </span>
              </div>
            </div>
          </div>

          {/* BEC & Synthetic Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* BEC Subcard */}
            <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-300">
                <UserX className="w-4 h-4 text-purple-400" />
                BEC / VIP Spoofing
              </div>
              <div className="text-xl font-black text-white">
                {bec_analysis.bec_confidence_score || 0}%
              </div>
              <p className="text-xs text-slate-400">
                {bec_analysis.bec_risk_level || "None"} Risk {bec_analysis.is_vip_impersonation ? "(VIP Target)" : ""}
              </p>
            </div>

            {/* Synthetic Subcard */}
            <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-300">
                <Bot className="w-4 h-4 text-cyan-400" />
                Synthetic Text (AI)
              </div>
              <div className="text-xl font-black text-white">
                {synthetic_analysis.synthetic_score || 0}%
              </div>
              <p className="text-xs text-slate-400">
                {synthetic_analysis.is_likely_synthetic ? "Likely LLM-Authored" : "Human / Standard"}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* MITRE ATT&CK Matrix Mapping */}
      {ttps.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            MITRE ATT&CK® Tactics & Techniques
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ttps.map((ttp, idx) => (
              <div key={idx} className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg flex items-start space-x-3">
                <span className="font-mono text-xs font-bold px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/30 flex-shrink-0">
                  {ttp.id}
                </span>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    {ttp.name}
                    <span className="text-[10px] text-slate-400 font-mono">({ttp.tactic})</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{ttp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOC Recommended Remediation Checklist */}
      {socActions.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            Recommended SOC Incident Response Actions
          </h3>
          <ul className="space-y-2">
            {socActions.map((action, idx) => (
              <li key={idx} className="flex items-start text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                <span className="w-5 h-5 flex items-center justify-center bg-emerald-500/20 text-emerald-400 font-bold rounded-full mr-2.5 flex-shrink-0 text-[10px]">
                  {idx + 1}
                </span>
                <span className="mt-0.5">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
