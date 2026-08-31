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
  Radio,
  AlertCircle
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
  const calibrationNote = classification.calibration_note;
  const probs = classification.class_probabilities || classification.probabilities || {};
  const explainableTokens = classification.explainable_tokens || [];

  const manipScores = features.manipulation_vectors?.scores || {};
  const ttps = ai_forensics.mitre_attack_ttps || [];
  const socActions = ai_forensics.recommended_soc_actions || [];
  
  const semanticMatches = data.semantic_matches || [];
  const correlations = data.threat_correlations || {};

  return (
    <div className="bg-transparent space-y-6 relative overflow-hidden">
      
      {/* Corner Screws */}
      <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/30 pb-4 px-2">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-white/20 backdrop-blur-3xl text-indigo-600 rounded-[1.5rem] shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_8px_32px_rgba(0,0,0,0.1)] border border-white/60">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 drop-shadow-sm">
              AI / ML Neural Threat Intelligence
              <span className="text-[10px] bg-white/30 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded-md border border-white/60 backdrop-blur-md">
                ENSEMBLE v2.1
              </span>
            </h2>
            <p className="text-xs text-slate-700 font-medium drop-shadow-sm">
              Multi-task NLP classification, BEC telemetry, synthetic language forensics, and MITRE ATT&CK mapping
            </p>
          </div>
        </div>

        {/* Primary Classification Pill */}
        <div className="sm:text-right bg-white/20 backdrop-blur-md border border-white/40 shadow-sm rounded-xl px-4 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono drop-shadow-sm">Classification Verdict</div>
          <div className={`text-sm font-black font-mono drop-shadow-sm ${isThreat ? 'text-red-600' : 'text-emerald-700'}`}>
            {THREAT_LABELS[primaryThreat] || primaryThreat}
          </div>
          <div className="text-[10px] text-slate-600 font-mono font-bold drop-shadow-sm">Confidence: {confidencePct}%</div>
        </div>
      </div>

      {/* Calibration override note */}
      {calibrationNote && (
        <div className="bg-amber-50/70 backdrop-blur-md border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-800 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{calibrationNote}</span>
        </div>
      )}

      {/* Forensic Summary Alert */}
      {ai_forensics.forensic_summary && (
        <div className="bg-white/20 backdrop-blur-3xl border border-white/60 p-5 rounded-[2rem] space-y-2 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 font-mono drop-shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            AI SOC Forensic Analysis & Reasoning
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-relaxed font-sans drop-shadow-sm">
            {ai_forensics.forensic_summary}
          </p>
        </div>
      )}

      {/* Deep AI Forensic Audit Dossier (Higher-Capability Auditing Layer) */}
      {data.ai_ml_analysis?.deep_ai_audit && (
        <div className="bg-white/20 backdrop-blur-3xl rounded-[2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] border border-white/70 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-600 border border-indigo-500/20">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                  Deep AI Forensic Audit Dossier
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md border border-indigo-200 font-mono">
                    NEURAL AUDITOR v2.5
                  </span>
                </h3>
                <p className="text-xs text-slate-600 font-sans">Multi-dimensional cognitive, evasion, and calibrated threat audit</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">Audited Score</div>
                <div className={`text-lg font-black font-mono ${data.ai_ml_analysis.deep_ai_audit.audited_score >= 70 ? 'text-red-600' : data.ai_ml_analysis.deep_ai_audit.audited_score >= 35 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {data.ai_ml_analysis.deep_ai_audit.audited_score}/100
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${data.ai_ml_analysis.deep_ai_audit.verdict === 'MALICIOUS' ? 'bg-red-50 text-red-700 border-red-200' : data.ai_ml_analysis.deep_ai_audit.verdict === 'SUSPICIOUS' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {data.ai_ml_analysis.deep_ai_audit.verdict}
              </span>
            </div>
          </div>

          {/* 5 Evidence Pillars Gauge Grid */}
          {data.ai_ml_analysis.deep_ai_audit.evidence_pillars && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700">Calibrated Evidence Pillars:</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white/30 backdrop-blur-md p-3 rounded-xl border border-white/50 space-y-1">
                  <div className="text-[10px] font-mono text-slate-600 uppercase font-bold">ML Probability</div>
                  <div className="text-base font-black font-mono text-slate-900">{data.ai_ml_analysis.deep_ai_audit.evidence_pillars.ml_text_probability_score}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, data.ai_ml_analysis.deep_ai_audit.evidence_pillars.ml_text_probability_score)}%` }} />
                  </div>
                </div>
                <div className="bg-white/30 backdrop-blur-md p-3 rounded-xl border border-white/50 space-y-1">
                  <div className="text-[10px] font-mono text-slate-600 uppercase font-bold">Cognitive Coercion</div>
                  <div className="text-base font-black font-mono text-slate-900">{data.ai_ml_analysis.deep_ai_audit.evidence_pillars.cognitive_manipulation_score}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, data.ai_ml_analysis.deep_ai_audit.evidence_pillars.cognitive_manipulation_score)}%` }} />
                  </div>
                </div>
                <div className="bg-white/30 backdrop-blur-md p-3 rounded-xl border border-white/50 space-y-1">
                  <div className="text-[10px] font-mono text-slate-600 uppercase font-bold">Evasion Risk</div>
                  <div className="text-base font-black font-mono text-slate-900">{data.ai_ml_analysis.deep_ai_audit.evidence_pillars.evasion_obfuscation_score}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, data.ai_ml_analysis.deep_ai_audit.evidence_pillars.evasion_obfuscation_score)}%` }} />
                  </div>
                </div>
                <div className="bg-white/30 backdrop-blur-md p-3 rounded-xl border border-white/50 space-y-1">
                  <div className="text-[10px] font-mono text-slate-600 uppercase font-bold">Protocol Misalign</div>
                  <div className="text-base font-black font-mono text-slate-900">{data.ai_ml_analysis.deep_ai_audit.evidence_pillars.protocol_alignment_score}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, data.ai_ml_analysis.deep_ai_audit.evidence_pillars.protocol_alignment_score)}%` }} />
                  </div>
                </div>
                <div className="bg-white/30 backdrop-blur-md p-3 rounded-xl border border-white/50 space-y-1">
                  <div className="text-[10px] font-mono text-slate-600 uppercase font-bold">Origin Anomaly</div>
                  <div className="text-base font-black font-mono text-slate-900">{data.ai_ml_analysis.deep_ai_audit.evidence_pillars.infrastructure_origin_score}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, data.ai_ml_analysis.deep_ai_audit.evidence_pillars.infrastructure_origin_score)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cognitive & Evasion Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/40 space-y-2">
              <div className="font-bold text-slate-900 font-mono flex items-center justify-between">
                <span>Psychological Coercion Profile:</span>
                <span className="text-[10px] text-slate-600">{data.ai_ml_analysis.deep_ai_audit.cognitive_audit?.coercion_level} Intensity</span>
              </div>
              <div className="text-slate-700">
                <span className="font-semibold text-slate-900">Dominant Vector:</span> {data.ai_ml_analysis.deep_ai_audit.cognitive_audit?.dominant_tactic}
              </div>
              {data.ai_ml_analysis.deep_ai_audit.cognitive_audit?.active_vectors?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {data.ai_ml_analysis.deep_ai_audit.cognitive_audit.active_vectors.map((vec, i) => (
                    <span key={i} className="text-[10px] font-mono font-bold px-2 py-0.5 bg-red-100/80 text-red-800 rounded-md border border-red-200">
                      {vec}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/40 space-y-2">
              <div className="font-bold text-slate-900 font-mono flex items-center justify-between">
                <span>Evasion & Obfuscation Scan:</span>
                <span className="text-[10px] font-mono font-bold text-slate-600">
                  {data.ai_ml_analysis.deep_ai_audit.evasion_audit?.is_evasion_detected ? 'Tactics Found' : 'Clean Payload'}
                </span>
              </div>
              {data.ai_ml_analysis.deep_ai_audit.evasion_audit?.tactics_detected?.length > 0 ? (
                <div className="space-y-1.5">
                  {data.ai_ml_analysis.deep_ai_audit.evasion_audit.tactics_detected.map((t, idx) => (
                    <div key={idx} className="text-[11px] text-slate-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                      <span className="font-bold text-amber-900">{t.technique}: </span>
                      {t.details}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-[11px] italic">No zero-width injection, cloaked HTML CSS, or homoglyph character spoofing detected.</p>
              )}
            </div>
          </div>

          {/* Threat Intent & Attack Stage */}
          {data.ai_ml_analysis.deep_ai_audit.intent_profile && (
            <div className="bg-white/30 backdrop-blur-md p-4 rounded-xl border border-white/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">Attacker Strategic Objective</span>
                <span className="font-bold text-slate-900 font-sans">{data.ai_ml_analysis.deep_ai_audit.intent_profile.primary_intent}</span>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">MITRE Lifecycle Phase</span>
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 inline-block mt-0.5">
                  {data.ai_ml_analysis.deep_ai_audit.intent_profile.attack_lifecycle_stage}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Category Probabilities */}
        <div className="bg-white/20 backdrop-blur-3xl rounded-[2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] border border-white/70 p-6 space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 font-mono drop-shadow-sm">
            <TrendingUp className="w-4 h-4 text-red-500" />
            Threat Category Probability Distribution
          </h3>

          <div className="space-y-3">
            {Object.entries(probs).map(([catKey, probVal]) => {
              const pct = Math.round(probVal * 100);
              const isSelected = catKey === primaryThreat;
              const isClean = catKey === "clean";

              let barColor = isClean ? "bg-emerald-500" : "bg-red-500";
              if (!isClean && pct >= 40) barColor = "bg-red-500";
              else if (!isClean && pct >= 20) barColor = "bg-amber-500";

              return (
                <div key={catKey} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className={isSelected ? "text-slate-900 font-bold drop-shadow-sm" : "text-slate-700 drop-shadow-sm"}>
                      {THREAT_LABELS[catKey] || catKey}
                    </span>
                    <span className="font-mono font-bold text-slate-900 drop-shadow-sm">{pct}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-white/30 backdrop-blur-md border border-white/40 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-700 rounded-full shadow-md ${barColor}`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explainable Predictive Tokens */}
          {explainableTokens.length > 0 && (
            <div className="pt-4 border-t border-white/30 space-y-2">
              <span className="text-slate-700 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5 font-mono drop-shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                Key Model Predictive N-Grams
              </span>
              <div className="flex flex-wrap gap-1.5">
                {explainableTokens.map((tok, i) => (
                  <span key={i} className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/40 backdrop-blur-md text-slate-900 border border-white/60 shadow-sm">
                    "{tok}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Vector Threat Indicator */}
          {classification.is_multi_vector_attack && (
            <div className="mt-4 p-3 bg-red-500/10 backdrop-blur-md border border-red-400/40 shadow-sm rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
              <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>Multi-Vector Campaign: Combines <strong>{classification.detected_attack_vectors?.join(", ")}</strong></span>
            </div>
          )}
        </div>

        {/* Right Column: Social Engineering & BEC Telemetry */}
        <div className="space-y-6">
          
          {/* Social Engineering Vectors */}
          <div className="bg-white/20 backdrop-blur-3xl rounded-[2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] border border-white/70 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 font-mono drop-shadow-sm">
              <Flame className="w-4 h-4 text-amber-500" />
              Social Engineering & Manipulation Vectors
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/40 shadow-sm hover:bg-white/30 transition-colors">
                <span className="text-slate-700 block font-mono text-[10px] uppercase font-bold drop-shadow-sm">Urgency / Pressure:</span>
                <span className={`font-bold font-mono text-sm drop-shadow-sm ${manipScores.urgency > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {manipScores.urgency || 0} trigger(s)
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/40 shadow-sm hover:bg-white/30 transition-colors">
                <span className="text-slate-700 block font-mono text-[10px] uppercase font-bold drop-shadow-sm">Fear & Intimidation:</span>
                <span className={`font-bold font-mono text-sm drop-shadow-sm ${manipScores.fear_intimidation > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {manipScores.fear_intimidation || 0} trigger(s)
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/40 shadow-sm hover:bg-white/30 transition-colors">
                <span className="text-slate-700 block font-mono text-[10px] uppercase font-bold drop-shadow-sm">Authority Framing:</span>
                <span className={`font-bold font-mono text-sm drop-shadow-sm ${manipScores.authority > 0 ? 'text-indigo-600' : 'text-slate-900'}`}>
                  {manipScores.authority || 0} trigger(s)
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/40 shadow-sm hover:bg-white/30 transition-colors">
                <span className="text-slate-700 block font-mono text-[10px] uppercase font-bold drop-shadow-sm">Financial / Greed:</span>
                <span className={`font-bold font-mono text-sm drop-shadow-sm ${manipScores.financial_greed > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {manipScores.financial_greed || 0} trigger(s)
                </span>
              </div>
            </div>
          </div>

          {/* BEC & Synthetic Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* BEC Subcard */}
            <div className="bg-white/20 backdrop-blur-3xl rounded-[2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] border border-white/70 p-5 space-y-2 hover:bg-white/30 transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-900 font-mono drop-shadow-sm">
                <UserX className="w-4 h-4 text-indigo-600" />
                BEC / VIP Spoofing
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 drop-shadow-md">
                {bec_analysis.bec_confidence_score || 0}%
              </div>
              <p className="text-xs text-slate-700 font-medium drop-shadow-sm">
                {bec_analysis.bec_risk_level || "None"} Risk {bec_analysis.is_vip_impersonation ? "(VIP Target)" : ""}
              </p>
            </div>

            {/* Synthetic Subcard */}
            <div className="bg-white/20 backdrop-blur-3xl rounded-[2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] border border-white/70 p-5 space-y-2 hover:bg-white/30 transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-900 font-mono drop-shadow-sm">
                <Bot className="w-4 h-4 text-sky-600" />
                Synthetic Text (AI)
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 drop-shadow-md">
                {synthetic_analysis.synthetic_score || 0}%
              </div>
              <p className="text-xs text-slate-700 font-medium drop-shadow-sm">
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
          <div className="bg-white/20 backdrop-blur-3xl rounded-[2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] border border-white/70 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/30 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 font-mono drop-shadow-sm">
                <Database className="w-4 h-4 text-indigo-600" />
                Semantic Threat Memory
              </h3>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-white/30 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/50 shadow-sm">
                ChromaDB
              </span>
            </div>
            
            {semanticMatches.length > 0 ? (
              <div className="space-y-3">
                {semanticMatches.map((m, idx) => (
                  <div key={idx} className="bg-white/20 backdrop-blur-md border border-white/40 p-3 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm hover:bg-white/30 transition-colors">
                    <div className="space-y-0.5 truncate">
                      <div className="font-bold text-slate-900 truncate font-sans drop-shadow-sm">
                        {m.metadata?.subject || m.email_id}
                      </div>
                      <div className="text-[11px] text-slate-700 font-mono truncate font-medium">
                        Sender: {m.metadata?.from || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="px-2 py-1 rounded-md bg-white/40 backdrop-blur-md text-indigo-800 font-mono font-bold text-[11px] border border-white/60 shadow-sm">
                        {m.confidence}% Match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-700 italic text-xs py-2 drop-shadow-sm">No mathematical duplicates detected in vector threat database.</p>
            )}
          </div>

          {/* Repeat Offender Cross-Case Correlations */}
          <div className="bg-white/20 backdrop-blur-3xl rounded-[2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] border border-white/70 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 font-mono border-b border-white/30 pb-3 drop-shadow-sm">
              <History className="w-4 h-4 text-amber-600" />
              Cross-Case Threat Correlation
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/40 flex justify-between items-center font-mono shadow-sm">
                <span className="text-slate-700 font-bold drop-shadow-sm">Domain Historic Cases:</span>
                <span className={`drop-shadow-sm ${correlations.domain_case_count > 0 ? 'text-amber-700 font-bold' : 'text-slate-900 font-bold'}`}>
                  {correlations.domain_case_count || 0} prior incident(s)
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/40 flex justify-between items-center font-mono shadow-sm">
                <span className="text-slate-700 font-bold drop-shadow-sm">Origin IP Historic Cases:</span>
                <span className={`drop-shadow-sm ${correlations.ip_case_count > 0 ? 'text-amber-700 font-bold' : 'text-slate-900 font-bold'}`}>
                  {correlations.ip_case_count || 0} prior incident(s)
                </span>
              </div>
              {correlations.linked_campaigns?.length > 0 && (
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/40 space-y-2 shadow-sm">
                  <span className="text-slate-700 font-bold block text-[10px] uppercase tracking-wider font-mono drop-shadow-sm">Linked Campaigns:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {correlations.linked_campaigns.map((camp, idx) => (
                      <span key={idx} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/40 backdrop-blur-md text-indigo-800 border border-white/60 shadow-sm">
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
        <div className="bg-white/20 backdrop-blur-3xl rounded-[2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] border border-white/70 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 font-mono drop-shadow-sm">
            <Zap className="w-4 h-4 text-red-600" />
            MITRE ATT&CK® Tactics & Techniques
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ttps.map((ttp, idx) => (
              <div key={idx} className="bg-white/20 backdrop-blur-md border border-white/40 p-4 rounded-xl flex items-start space-x-3 shadow-sm hover:bg-white/30 transition-colors">
                <span className="font-mono text-xs font-bold px-2 py-1 bg-white/40 backdrop-blur-md text-red-700 rounded-lg border border-white/60 flex-shrink-0 shadow-sm">
                  {ttp.id}
                </span>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 font-sans drop-shadow-sm">
                    {ttp.name}
                    <span className="text-[10px] text-slate-700 font-mono font-normal">({ttp.tactic})</span>
                  </div>
                  <p className="text-slate-800 text-[11px] leading-relaxed font-sans font-medium">{ttp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Defense: Autonomous ScamBaiter Counter-Engagement (Dark Glassmorphism) */}
      {isThreat && (
        <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.3)] border border-slate-700/50 p-6 space-y-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-red-500/20 backdrop-blur-md text-red-400 rounded-xl border border-red-500/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2 drop-shadow-md">
                  Active Defense: Autonomous Tarpitting (ScamBaiter)
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">Resource exhaustion & real-time deanonymization beacon</p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold bg-red-500/20 backdrop-blur-md text-red-400 border border-red-500/40 animate-pulse shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              READY TO ENGAGE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Target Mailbox: <strong className="text-white drop-shadow-md">{data.reply_to || data.from_address || 'Attacker Mailbox'}</strong></span>
                <span className="text-red-400 font-bold flex items-center gap-1.5 drop-shadow-md">
                  <span className="led-node led-node-red animate-pulse" /> Beacon Armed
                </span>
              </div>
              <div className="text-slate-300 leading-relaxed font-mono text-[11px] bg-slate-900/80 p-4 rounded-lg border border-slate-800 shadow-inner">
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
              <p className="text-[11px] text-slate-500 italic font-medium">
                * When the attacker opens this simulated reply, the embedded tracking pixel resolves their real physical IP and browser fingerprint.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SOC Recommended Remediation Checklist */}
      {socActions.length > 0 && (
        <div className="bg-white/20 backdrop-blur-3xl rounded-[2rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] border border-white/70 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 font-mono drop-shadow-sm">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            Recommended SOC Incident Response Actions
          </h3>
          <ul className="space-y-3">
            {socActions.map((action, idx) => (
              <li key={idx} className="flex items-start text-xs text-slate-900 bg-white/20 backdrop-blur-md p-3.5 rounded-xl border border-white/40 shadow-sm hover:bg-white/30 transition-colors">
                <span className="w-6 h-6 flex items-center justify-center bg-white/40 backdrop-blur-md text-emerald-800 border border-white/60 shadow-sm font-bold rounded-lg mr-3 flex-shrink-0 text-[11px] font-mono">
                  {idx + 1}
                </span>
                <span className="mt-1 font-medium leading-relaxed drop-shadow-sm">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
