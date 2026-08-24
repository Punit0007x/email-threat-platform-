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
  phishing_credential_harvesting: "Phishing: Stealing Passwords",
  bec_executive_impersonation: "Impersonation (e.g. Fake CEO)",
  invoice_payment_fraud: "Fake Invoice & Payment Fraud",
  extortion_blackmail: "Extortion & Blackmail",
  malware_delivery: "Contains Viruses / Malware",
  brand_impersonation: "Brand Impersonation (Fake Company)"
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
    <div className="panel-chassis p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shadow-sm border border-purple-100">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              AI Threat Analysis
            </h2>
            <p className="text-sm text-gray-500">
              Analyzing the content and behavior of the email to identify scams and manipulation.
            </p>
          </div>
        </div>

        {/* Primary Classification Pill */}
        <div className="sm:text-right bg-slate-50 border border-gray-200 rounded-xl px-4 py-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Verdict</div>
          <div className={`text-lg font-bold ${isThreat ? 'text-red-600' : 'text-green-600'}`}>
            {THREAT_LABELS[primaryThreat] || primaryThreat}
          </div>
          <div className="text-xs text-gray-500 font-medium">Confidence: {confidencePct}%</div>
        </div>
      </div>

      {/* Forensic Summary Alert */}
      {ai_forensics.forensic_summary && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3 border-l-4 border-l-purple-500">
          <FileSearch className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-800">AI Summary</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{ai_forensics.forensic_summary}</p>
          </div>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Category Probabilities */}
        <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            What kind of threat is this?
          </h3>

          <div className="space-y-3">
            {Object.entries(probs).map(([catKey, probVal]) => {
              const pct = Math.round(probVal * 100);
              const isSelected = catKey === primaryThreat;
              const isClean = catKey === "clean";

              let barColor = isClean ? "bg-green-500" : "bg-red-500";
              if (!isClean && pct >= 40) barColor = "bg-red-500";
              else if (!isClean && pct >= 20) barColor = "bg-amber-500";

              return (
                <div key={catKey} className="space-y-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span className={isSelected ? "text-gray-900 font-semibold" : "text-gray-500"}>
                      {THREAT_LABELS[catKey] || catKey}
                    </span>
                    <span className="font-semibold text-gray-700">{pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
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
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <span className="text-gray-700 font-semibold text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Suspicious Keywords Found
              </span>
              <div className="flex flex-wrap gap-2">
                {explainableTokens.map((tok, i) => (
                  <span key={i} className="text-xs font-semibold px-2 py-1 rounded-md bg-white text-gray-700 border border-gray-200 shadow-sm">
                    "{tok}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Vector Threat Indicator */}
          {classification.is_multi_vector_attack && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
              <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>Multi-Vector Attack: Combines <strong>{classification.detected_attack_vectors?.join(", ")}</strong></span>
            </div>
          )}
        </div>

        {/* Right Column: Social Engineering & BEC Telemetry */}
        <div className="space-y-6">
          
          {/* Social Engineering Vectors */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Manipulation Tactics Detected
            </h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-gray-500 block text-xs font-semibold uppercase mb-1">Urgency / Pressure:</span>
                <span className={`font-semibold ${manipScores.urgency > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                  {manipScores.urgency || 0} trigger(s)
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-gray-500 block text-xs font-semibold uppercase mb-1">Fear & Intimidation:</span>
                <span className={`font-semibold ${manipScores.fear_intimidation > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  {manipScores.fear_intimidation || 0} trigger(s)
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-gray-500 block text-xs font-semibold uppercase mb-1">Authority / Boss:</span>
                <span className={`font-semibold ${manipScores.authority > 0 ? 'text-purple-600' : 'text-gray-700'}`}>
                  {manipScores.authority || 0} trigger(s)
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-gray-500 block text-xs font-semibold uppercase mb-1">Money / Greed:</span>
                <span className={`font-semibold ${manipScores.financial_greed > 0 ? 'text-green-600' : 'text-gray-700'}`}>
                  {manipScores.financial_greed || 0} trigger(s)
                </span>
              </div>
            </div>
          </div>

          {/* BEC & Synthetic Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* BEC Subcard */}
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <UserX className="w-4 h-4 text-purple-600" />
                Impersonation Risk
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {bec_analysis.bec_confidence_score || 0}%
              </div>
              <p className="text-sm text-gray-500">
                {bec_analysis.bec_risk_level || "None"} Risk {bec_analysis.is_vip_impersonation ? "(VIP Target)" : ""}
              </p>
            </div>

            {/* Synthetic Subcard */}
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Bot className="w-4 h-4 text-blue-500" />
                AI Generated Text
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {synthetic_analysis.synthetic_score || 0}%
              </div>
              <p className="text-sm text-gray-500">
                {synthetic_analysis.is_likely_synthetic ? "Likely written by AI" : "Likely written by human"}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Semantic Vector Matches & Threat Correlations */}
      {(semanticMatches.length > 0 || correlations.domain_seen_before || correlations.ip_seen_before) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          
          {/* Vector DB Similar Threats */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                Similar Past Scams
              </h3>
            </div>
            
            {semanticMatches.length > 0 ? (
              <div className="space-y-3">
                {semanticMatches.map((m, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 p-3 rounded-lg flex items-center justify-between gap-3 text-sm shadow-sm">
                    <div className="space-y-1 truncate">
                      <div className="font-semibold text-gray-800 truncate">
                        {m.metadata?.subject || m.email_id}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        Sender: {m.metadata?.from || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="px-2 py-1 rounded bg-purple-50 text-purple-700 font-semibold text-xs border border-purple-100">
                        {m.confidence}% Match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm py-2">No similar emails found in our database.</p>
            )}
          </div>

          {/* Repeat Offender Cross-Case Correlations */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-200 pb-3">
              <History className="w-4 h-4 text-amber-500" />
              Attacker History
            </h3>

            <div className="space-y-3 text-sm">
              <div className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm">
                <span className="text-gray-600 font-medium">Domain used in previous attacks:</span>
                <span className={correlations.domain_case_count > 0 ? 'text-amber-600 font-bold' : 'text-gray-800 font-semibold'}>
                  {correlations.domain_case_count || 0} times
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm">
                <span className="text-gray-600 font-medium">IP Address used in previous attacks:</span>
                <span className={correlations.ip_case_count > 0 ? 'text-amber-600 font-bold' : 'text-gray-800 font-semibold'}>
                  {correlations.ip_case_count || 0} times
                </span>
              </div>
              {correlations.linked_campaigns?.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2 shadow-sm">
                  <span className="text-gray-500 font-semibold block text-xs uppercase">Part of known campaigns:</span>
                  <div className="flex flex-wrap gap-2">
                    {correlations.linked_campaigns.map((camp, idx) => (
                      <span key={idx} className="text-xs font-semibold px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-100">
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

      {/* SOC Recommended Remediation Checklist */}
      {socActions.length > 0 && (
        <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4 mt-6">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-green-600" />
            Recommended Actions
          </h3>
          <ul className="space-y-3">
            {socActions.map((action, idx) => (
              <li key={idx} className="flex items-start text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <span className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-700 font-bold rounded-full mr-3 flex-shrink-0 text-xs">
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
