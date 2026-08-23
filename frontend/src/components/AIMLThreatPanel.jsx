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
  History,
  Database,
  Sparkles
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
  const explainableTokens = classification.explainable_tokens || [];

  const manipScores = features.manipulation_vectors?.scores || {};
  const ttps = ai_forensics.mitre_attack_ttps || [];
  const socActions = ai_forensics.recommended_soc_actions || [];
  
  const semanticMatches = data.semantic_matches || [];
  const correlations = data.threat_correlations || {};

  return (
    <div className="cyber-panel rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20 shadow-md">
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

          {/* Explainable Predictive Tokens */}
          {explainableTokens.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Key Model Predictive N-Grams
              </span>
              <div className="flex flex-wrap gap-1.5">
                {explainableTokens.map((tok, i) => (
                  <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    "{tok}"
                  </span>
                ))}
              </div>
            </div>
          )}

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

      {/* Semantic Vector Matches & Threat Correlations */}
      {(semanticMatches.length > 0 || correlations.domain_seen_before || correlations.ip_seen_before) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Vector DB Similar Threats */}
          <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                Semantic Threat Memory (Vector DB)
              </h3>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                ChromaDB
              </span>
            </div>
            
            {semanticMatches.length > 0 ? (
              <div className="space-y-2">
                {semanticMatches.map((m, idx) => (
                  <div key={idx} className="bg-slate-800/80 border border-slate-700/70 p-3 rounded-lg flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 truncate">
                      <div className="font-semibold text-white truncate font-sans">
                        {m.metadata?.subject || m.email_id}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        Sender: {m.metadata?.from || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[11px] border border-purple-500/30">
                        {m.confidence}% Match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic text-xs">No mathematical duplicates detected in vector threat database.</p>
            )}
          </div>

          {/* Repeat Offender Cross-Case Correlations */}
          <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              Cross-Case Threat Correlation
            </h3>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center font-mono">
                <span className="text-slate-400">Domain Historic Cases:</span>
                <span className={correlations.domain_case_count > 0 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                  {correlations.domain_case_count || 0} prior incident(s)
                </span>
              </div>
              <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center font-mono">
                <span className="text-slate-400">Origin IP Historic Cases:</span>
                <span className={correlations.ip_case_count > 0 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                  {correlations.ip_case_count || 0} prior incident(s)
                </span>
              </div>
              {correlations.linked_campaigns?.length > 0 && (
                <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700 space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Linked Campaigns:</span>
                  <div className="flex flex-wrap gap-1">
                    {correlations.linked_campaigns.map((camp, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {camp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

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

      {/* Active Defense: Autonomous ScamBaiter Counter-Engagement */}
      {isThreat && (
        <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-rose-200 flex items-center gap-2">
                  Active Defense: Autonomous Tarpitting (ScamBaiter)
                </h3>
                <p className="text-[11px] text-slate-400">Resource exhaustion & real-time deanonymization beacon</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              READY TO ENGAGE
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-rose-500/20 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Engagement Target: <strong className="text-slate-200">{data.reply_to || data.from_address || 'Attacker Mailbox'}</strong></span>
                <span className="text-rose-400 font-bold">Beacon: 1x1 Pixel Armed</span>
              </div>
              <div className="text-slate-300 leading-relaxed font-mono text-[11px] bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
                "{((subj) => {
                  const s = (subj || '').toLowerCase();
                  if (s.includes('invoice') || s.includes('payment') || s.includes('wire') || s.includes('bank')) {
                    return "Hi, I am trying to process this payment but our accounting portal indicates the routing number is invalid. Could you please provide an alternative SWIFT code or a revised invoice PDF with the updated banking details? - Sent from my iPhone";
                  } else if (s.includes('password') || s.includes('account') || s.includes('login') || s.includes('verify')) {
                    return "Hello, I clicked the verification link but the portal returned 'Session Token Expired'. I really need to get this resolved today before my flight. Is there a direct link you can send me? Thanks.";
                  } else {
                    return "I received this notice but the attachment appears corrupted on macOS. Could you please resend it in an alternative document format so I can review it?";
                  }
                })(data.subject)}"
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * When the attacker opens this simulated reply, the embedded tracking pixel resolves their real physical IP and browser fingerprint, bypassing VPN proxies.
              </p>
            </div>
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
