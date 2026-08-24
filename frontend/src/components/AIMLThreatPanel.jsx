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
  Sparkles,
  Radio
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
    <div className="panel-chassis p-6 sm:p-8 space-y-6 relative overflow-hidden">
      
      {/* Corner Screws */}
      <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f8fafc] pb-4 px-2">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-[#ffffff] text-[#7048e8] rounded-2xl shadow-[var(--shadow-card)] border border-white/70">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
              AI / ML Neural Threat Intelligence
              <span className="text-[10px] bg-[#7048e8]/15 text-[#5f3dc4] font-mono font-bold px-2 py-0.5 rounded border border-[#7048e8]/30">
                ENSEMBLE v2.1
              </span>
            </h2>
            <p className="text-xs text-[#64748b]">
              Multi-task NLP classification, BEC telemetry, synthetic language forensics, and MITRE ATT&CK mapping
            </p>
          </div>
        </div>

        {/* Primary Classification Pill */}
        <div className="sm:text-right slot-recessed-sm px-4 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] font-mono">Classification Verdict</div>
          <div className={`text-sm font-black font-mono ${isThreat ? 'text-[#ef4444]' : 'text-[#059669]'}`}>
            {THREAT_LABELS[primaryThreat] || primaryThreat}
          </div>
          <div className="text-[10px] text-[#64748b] font-mono font-bold">Confidence: {confidencePct}%</div>
        </div>
      </div>

      {/* Forensic Summary Alert */}
      {ai_forensics.forensic_summary && (
        <div className="slot-recessed p-4 flex items-start gap-3 border-l-4 border-l-[#7048e8]">
          <FileSearch className="w-5 h-5 text-[#7048e8] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] font-mono">Executive Forensic Brief</h4>
            <p className="text-xs sm:text-sm text-[#0f172a] leading-relaxed font-sans font-medium">{ai_forensics.forensic_summary}</p>
          </div>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Category Probabilities */}
        <div className="slot-recessed p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2 font-mono">
            <TrendingUp className="w-4 h-4 text-[#ef4444]" />
            Threat Category Probability Distribution
          </h3>

          <div className="space-y-3">
            {Object.entries(probs).map(([catKey, probVal]) => {
              const pct = Math.round(probVal * 100);
              const isSelected = catKey === primaryThreat;
              const isClean = catKey === "clean";

              let barColor = isClean ? "bg-[#10b981]" : "bg-[#ef4444]";
              if (!isClean && pct >= 40) barColor = "bg-[#ef4444]";
              else if (!isClean && pct >= 20) barColor = "bg-[#f59e0b]";

              return (
                <div key={catKey} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className={isSelected ? "text-[#0f172a] font-bold" : "text-[#64748b]"}>
                      {THREAT_LABELS[catKey] || catKey}
                    </span>
                    <span className="font-mono font-bold text-[#0f172a]">{pct}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#f8fafc] rounded-full overflow-hidden shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]">
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
            <div className="pt-3 border-t border-[#e2e8f0]/50 space-y-1.5">
              <span className="text-[#64748b] font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#ef4444]" />
                Key Model Predictive N-Grams
              </span>
              <div className="flex flex-wrap gap-1.5">
                {explainableTokens.map((tok, i) => (
                  <span key={i} className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0]/60 shadow-sm">
                    "{tok}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Vector Threat Indicator */}
          {classification.is_multi_vector_attack && (
            <div className="mt-3 p-3 bg-[#ef4444]/15 border border-[#ef4444]/30 rounded-xl flex items-center gap-2 text-xs text-[#d63031]">
              <ShieldAlert className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
              <span>Multi-Vector Campaign: Combines <strong>{classification.detected_attack_vectors?.join(", ")}</strong></span>
            </div>
          )}
        </div>

        {/* Right Column: Social Engineering & BEC Telemetry */}
        <div className="space-y-6">
          
          {/* Social Engineering Vectors */}
          <div className="slot-recessed p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2 font-mono">
              <Flame className="w-4 h-4 text-[#f59e0b]" />
              Social Engineering & Manipulation Vectors
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/50 shadow-sm">
                <span className="text-[#64748b] block font-mono text-[10px] uppercase font-bold">Urgency / Pressure:</span>
                <span className={`font-bold font-mono text-sm ${manipScores.urgency > 0 ? 'text-[#d97706]' : 'text-[#0f172a]'}`}>
                  {manipScores.urgency || 0} trigger(s)
                </span>
              </div>
              <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/50 shadow-sm">
                <span className="text-[#64748b] block font-mono text-[10px] uppercase font-bold">Fear & Intimidation:</span>
                <span className={`font-bold font-mono text-sm ${manipScores.fear_intimidation > 0 ? 'text-[#ef4444]' : 'text-[#0f172a]'}`}>
                  {manipScores.fear_intimidation || 0} trigger(s)
                </span>
              </div>
              <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/50 shadow-sm">
                <span className="text-[#64748b] block font-mono text-[10px] uppercase font-bold">Authority Framing:</span>
                <span className={`font-bold font-mono text-sm ${manipScores.authority > 0 ? 'text-[#7048e8]' : 'text-[#0f172a]'}`}>
                  {manipScores.authority || 0} trigger(s)
                </span>
              </div>
              <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/50 shadow-sm">
                <span className="text-[#64748b] block font-mono text-[10px] uppercase font-bold">Financial / Greed:</span>
                <span className={`font-bold font-mono text-sm ${manipScores.financial_greed > 0 ? 'text-[#059669]' : 'text-[#0f172a]'}`}>
                  {manipScores.financial_greed || 0} trigger(s)
                </span>
              </div>
            </div>
          </div>

          {/* BEC & Synthetic Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* BEC Subcard */}
            <div className="slot-recessed p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#0f172a] font-mono">
                <UserX className="w-4 h-4 text-[#7048e8]" />
                BEC / VIP Spoofing
              </div>
              <div className="text-2xl font-black font-mono text-[#0f172a]">
                {bec_analysis.bec_confidence_score || 0}%
              </div>
              <p className="text-xs text-[#64748b]">
                {bec_analysis.bec_risk_level || "None"} Risk {bec_analysis.is_vip_impersonation ? "(VIP Target)" : ""}
              </p>
            </div>

            {/* Synthetic Subcard */}
            <div className="slot-recessed p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#0f172a] font-mono">
                <Bot className="w-4 h-4 text-[#0ea5e9]" />
                Synthetic Text (AI)
              </div>
              <div className="text-2xl font-black font-mono text-[#0f172a]">
                {synthetic_analysis.synthetic_score || 0}%
              </div>
              <p className="text-xs text-[#64748b]">
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
          <div className="slot-recessed p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#e2e8f0]/50 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2 font-mono">
                <Database className="w-4 h-4 text-[#7048e8]" />
                Semantic Threat Memory (Vector DB)
              </h3>
              <span className="text-[10px] font-mono font-bold text-[#7048e8] bg-[#7048e8]/15 px-2 py-0.5 rounded border border-[#7048e8]/30">
                ChromaDB
              </span>
            </div>
            
            {semanticMatches.length > 0 ? (
              <div className="space-y-2">
                {semanticMatches.map((m, idx) => (
                  <div key={idx} className="bg-[#f8fafc] border border-[#e2e8f0]/60 p-3 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm">
                    <div className="space-y-0.5 truncate">
                      <div className="font-bold text-[#0f172a] truncate font-sans">
                        {m.metadata?.subject || m.email_id}
                      </div>
                      <div className="text-[11px] text-[#64748b] font-mono truncate">
                        Sender: {m.metadata?.from || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="px-2 py-1 rounded bg-[#7048e8]/15 text-[#5f3dc4] font-mono font-bold text-[11px] border border-[#7048e8]/30">
                        {m.confidence}% Match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#64748b] italic text-xs py-2">No mathematical duplicates detected in vector threat database.</p>
            )}
          </div>

          {/* Repeat Offender Cross-Case Correlations */}
          <div className="slot-recessed p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2 font-mono border-b border-[#e2e8f0]/50 pb-2">
              <History className="w-4 h-4 text-[#d97706]" />
              Cross-Case Threat Correlation
            </h3>

            <div className="space-y-2 text-xs">
              <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/50 flex justify-between items-center font-mono shadow-sm">
                <span className="text-[#64748b] font-bold">Domain Historic Cases:</span>
                <span className={correlations.domain_case_count > 0 ? 'text-[#d97706] font-bold' : 'text-[#0f172a]'}>
                  {correlations.domain_case_count || 0} prior incident(s)
                </span>
              </div>
              <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/50 flex justify-between items-center font-mono shadow-sm">
                <span className="text-[#64748b] font-bold">Origin IP Historic Cases:</span>
                <span className={correlations.ip_case_count > 0 ? 'text-[#d97706] font-bold' : 'text-[#0f172a]'}>
                  {correlations.ip_case_count || 0} prior incident(s)
                </span>
              </div>
              {correlations.linked_campaigns?.length > 0 && (
                <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/50 space-y-1 shadow-sm">
                  <span className="text-[#64748b] font-bold block text-[10px] uppercase tracking-wider font-mono">Linked Campaigns:</span>
                  <div className="flex flex-wrap gap-1">
                    {correlations.linked_campaigns.map((camp, idx) => (
                      <span key={idx} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#7048e8]/15 text-[#5f3dc4] border border-[#7048e8]/30">
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
        <div className="slot-recessed p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2 font-mono">
            <Zap className="w-4 h-4 text-[#ef4444]" />
            MITRE ATT&CK® Tactics & Techniques
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ttps.map((ttp, idx) => (
              <div key={idx} className="bg-[#f8fafc] border border-[#e2e8f0]/60 p-3 rounded-xl flex items-start space-x-3 shadow-sm">
                <span className="font-mono text-xs font-bold px-2 py-1 bg-[#ef4444]/15 text-[#d63031] rounded border border-[#ef4444]/30 flex-shrink-0">
                  {ttp.id}
                </span>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-[#0f172a] flex items-center gap-1.5 font-sans">
                    {ttp.name}
                    <span className="text-[10px] text-[#64748b] font-mono font-normal">({ttp.tactic})</span>
                  </div>
                  <p className="text-[#64748b] text-[11px] leading-relaxed font-sans">{ttp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Defense: Autonomous ScamBaiter Counter-Engagement */}
      {isThreat && (
        <div className="panel-dark-tech p-5 space-y-3 border-l-4 border-l-[#ef4444]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#ef4444]/20 text-[#ef4444] rounded-lg border border-[#ef4444]/40">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  Active Defense: Autonomous Tarpitting (ScamBaiter)
                </h3>
                <p className="text-[11px] text-[#a8b2d1]">Resource exhaustion & real-time deanonymization beacon</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 animate-pulse">
              READY TO ENGAGE
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="slot-dark-screen p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#a8b2d1]">
                <span>Target Mailbox: <strong className="text-white">{data.reply_to || data.from_address || 'Attacker Mailbox'}</strong></span>
                <span className="text-[#ef4444] font-bold flex items-center gap-1">
                  <span className="led-node led-node-red animate-pulse" /> Beacon Armed
                </span>
              </div>
              <div className="text-[#e2e8f0] leading-relaxed font-mono text-[11px] bg-black/40 p-3 rounded border border-white/10">
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
              <p className="text-[11px] text-[#a8b2d1] italic">
                * When the attacker opens this simulated reply, the embedded tracking pixel resolves their real physical IP and browser fingerprint.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SOC Recommended Remediation Checklist */}
      {socActions.length > 0 && (
        <div className="slot-recessed p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2 font-mono">
            <CheckSquare className="w-4 h-4 text-[#059669]" />
            Recommended SOC Incident Response Actions
          </h3>
          <ul className="space-y-2">
            {socActions.map((action, idx) => (
              <li key={idx} className="flex items-start text-xs text-[#0f172a] bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/50 shadow-sm">
                <span className="w-5 h-5 flex items-center justify-center bg-[#10b981]/20 text-[#047857] font-bold rounded-full mr-2.5 flex-shrink-0 text-[10px] font-mono">
                  {idx + 1}
                </span>
                <span className="mt-0.5 font-medium">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
