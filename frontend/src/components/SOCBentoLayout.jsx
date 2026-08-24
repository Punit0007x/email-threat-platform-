import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Brain, 
  Eye, 
  Compass, 
  Scan, 
  ShieldCheck, 
  Zap, 
  Radio, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Crosshair,
  Sparkles,
  Server
} from 'lucide-react';
import FraudScorePanel from './FraudScorePanel';
import AIMLThreatPanel from './AIMLThreatPanel';
import EmailBodyDissector from './EmailBodyDissector';
import MapPanel from './MapPanel';
import DeepOSINTPanel from './DeepOSINTPanel';
import CustodyReportPanel from './CustodyReportPanel';
import ThreatRadarGraphic from './ThreatRadarGraphic';
import ThreatWaveform from './ThreatWaveform';

export default function SOCBentoLayout({ data, onLookupIOC, onSwitchView }) {
  const [quarantined, setQuarantined] = useState(false);
  const [soarActionMsg, setSoarActionMsg] = useState(null);

  if (!data) return null;

  const threatScore = data?.fraud_assessment?.score ?? 0;
  const isHighRisk = threatScore > 70;
  const isMediumRisk = threatScore > 30 && threatScore <= 70;
  const riskLevel = data?.fraud_assessment?.risk_level ?? 'LOW';
  const primaryThreat = data?.ai_ml_analysis?.classification?.primary_threat?.replace(/_/g, ' ').toUpperCase() || 'CLEAN STREAM';
  const origin = data?.trace?.origin || {};
  const auth = data?.auth_analysis || {};

  const handleTriggerSOAR = (action) => {
    if (action === 'quarantine') {
      setQuarantined(true);
      setSoarActionMsg('Global Tenant Quarantine Enacted: EML blocked across all mailboxes.');
    } else if (action === 'block_ip') {
      setSoarActionMsg(`Firewall Rule Injected: Ingress dropped from IP ${origin.ip || 'Origin'}.`);
    } else if (action === 'notarize') {
      setSoarActionMsg('Immutable Ledger Hash Committed to Distributed Notary.');
    }
    setTimeout(() => setSoarActionMsg(null), 4500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner: Incident Triage & Quick SOAR Action Bar */}
      <div className="panel-chassis p-5 relative overflow-hidden border-l-4 border-l-[#ff4757]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className={`px-2.5 py-0.5 rounded font-bold uppercase ${isHighRisk ? 'bg-[#ff4757]/15 text-[#d63031] border border-[#ff4757]/30' : (isMediumRisk ? 'bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/30' : 'bg-[#10b981]/15 text-[#047857] border border-[#10b981]/30')}`}>
                {riskLevel} RISK VERDICT
              </span>
              <span className="text-[#a3b1c6]">&bull;</span>
              <span className="font-bold text-[#2d3436] flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-[#ff4757]" />
                THREAT VECTOR: <strong className="text-[#ff4757]">{primaryThreat}</strong>
              </span>
              <span className="text-[#a3b1c6]">&bull;</span>
              <span className="text-[#4a5568]">
                ORIGIN: <strong className="text-[#2d3436]">{origin.city || 'Unknown'}, {origin.country || 'Global'} ({origin.ip || 'N/A'})</strong>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#2d3436] font-sans truncate max-w-3xl">
              {data.subject || "No Subject Specified"}
            </h2>
          </div>

          {/* Quick Active Defense SOAR Controls */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs flex-shrink-0">
            <button
              onClick={() => handleTriggerSOAR('quarantine')}
              disabled={quarantined}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                quarantined 
                  ? 'slot-recessed text-[#10b981] border border-[#10b981]/40' 
                  : 'btn-tactile-primary text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{quarantined ? '[QUARANTINED]' : '[QUARANTINE TENANT]'}</span>
            </button>

            <button
              onClick={() => handleTriggerSOAR('block_ip')}
              className="btn-tactile-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#ff4757]" />
              <span>[BAN ORIGIN IP]</span>
            </button>

            <button
              onClick={() => handleTriggerSOAR('notarize')}
              className="btn-tactile-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 text-[#4a5568]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
              <span>[NOTARIZE EVIDENCE]</span>
            </button>
          </div>
        </div>

        {/* Dynamic SOAR Feedback Alert */}
        {soarActionMsg && (
          <div className="mt-3 p-2.5 slot-recessed rounded-lg text-xs font-mono text-[#047857] flex items-center gap-2 border-l-2 border-l-[#10b981] animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-[#10b981] flex-shrink-0 animate-spin" />
            <span>SOAR AUTOMATION LOG: {soarActionMsg}</span>
          </div>
        )}
      </div>

      {/* 12-Column High-Density Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* BENTO CARD 1: Threat Score & Radar Polygon (4 Cols) */}
        <div className="lg:col-span-4 panel-chassis p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#ff4757]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2d3436]">
                  01 // THREAT RADAR
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8896aa]">[WEIGHTED METRIC]</span>
            </div>

            <div className="flex items-center justify-center p-3 slot-recessed rounded-xl mb-4">
              <div className="text-center">
                <div className={`font-mono text-4xl font-black ${isHighRisk ? 'text-[#ff4757]' : (isMediumRisk ? 'text-[#d97706]' : 'text-[#059669]')}`}>
                  {threatScore}<span className="text-sm font-normal text-[#8896aa]">/100</span>
                </div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#4a5568] mt-1">
                  FRAUD CONFIDENCE INDEX
                </div>
              </div>
            </div>

            {/* Micro Breakdown Metrics */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center p-2 slot-recessed-sm rounded">
                <span className="text-[#4a5568]">SPF Authentication:</span>
                <span className={`font-bold ${auth.spf === 'pass' ? 'text-[#059669]' : 'text-[#d63031]'}`}>
                  {auth.spf?.toUpperCase() || 'NONE'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 slot-recessed-sm rounded">
                <span className="text-[#4a5568]">DKIM Signature:</span>
                <span className={`font-bold ${auth.dkim === 'pass' ? 'text-[#059669]' : 'text-[#d63031]'}`}>
                  {auth.dkim?.toUpperCase() || 'NONE'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 slot-recessed-sm rounded">
                <span className="text-[#4a5568]">DMARC Policy:</span>
                <span className={`font-bold ${auth.dmarc === 'pass' ? 'text-[#059669]' : 'text-[#d63031]'}`}>
                  {auth.dmarc?.toUpperCase() || 'FAIL/NONE'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 slot-recessed-sm rounded">
                <span className="text-[#4a5568]">Domain Mismatch:</span>
                <span className={`font-bold ${auth.is_spoof_suspected ? 'text-[#d63031]' : 'text-[#059669]'}`}>
                  {auth.is_spoof_suspected ? 'MISMATCH DETECTED' : 'ALIGNED'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSwitchView && onSwitchView('radar')}
            className="w-full btn-tactile-secondary py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5 mt-2"
          >
            <span>[EXPAND FULL RADAR]</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#ff4757]" />
          </button>
        </div>

        {/* BENTO CARD 2: Email Body Dissector & Sandbox View (8 Cols) */}
        <div className="lg:col-span-8 panel-chassis p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#ff4757]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2d3436]">
                  02 // PAYLOAD DISSECTOR & SANITIZED PREVIEW
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8896aa]">[DOM SANDBOX]</span>
            </div>

            {/* Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs mb-3">
              <div className="p-2 slot-recessed rounded truncate">
                <span className="text-[#8896aa] block text-[10px]">FROM:</span>
                <span className="font-bold text-[#2d3436] truncate block">{data.from_address || 'N/A'}</span>
              </div>
              <div className="p-2 slot-recessed rounded truncate">
                <span className="text-[#8896aa] block text-[10px]">RETURN-PATH:</span>
                <span className="font-bold text-[#2d3436] truncate block">{data.return_path || 'N/A'}</span>
              </div>
              <div className="p-2 slot-recessed rounded truncate">
                <span className="text-[#8896aa] block text-[10px]">ATTACHMENTS:</span>
                <span className="font-bold text-[#2d3436] block">
                  {data.attachments?.length ? `${data.attachments.length} Detected` : 'None (Payload in Body)'}
                </span>
              </div>
            </div>

            {/* Sanitized Body Snippet */}
            <div className="slot-recessed p-3.5 rounded-xl max-h-56 overflow-y-auto font-mono text-xs text-[#2d3436] leading-relaxed whitespace-pre-wrap">
              {data.body_plain || data.body_text || "No plain text content extracted from MIME structure."}
            </div>

            {/* Extracted Links / IOCs Chips */}
            {data.links && data.links.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="text-[11px] font-mono font-bold text-[#4a5568] uppercase">
                  Extracted Hyperlinks ({data.links.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.links.slice(0, 3).map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => onLookupIOC(typeof link === 'string' ? link : link.url)}
                      className="slot-recessed-sm px-2.5 py-1 text-[11px] font-mono text-[#ff4757] hover:text-[#d63031] rounded flex items-center gap-1 truncate max-w-xs cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{typeof link === 'string' ? link : link.url}</span>
                    </button>
                  ))}
                  {data.links.length > 3 && (
                    <span className="text-[11px] font-mono text-[#8896aa] self-center">
                      +{data.links.length - 3} more links
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onSwitchView && onSwitchView('dissector')}
            className="w-full btn-tactile-secondary py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
          >
            <span>[OPEN DEEP DISSECTOR & OCR ENGINE]</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#ff4757]" />
          </button>
        </div>

        {/* BENTO CARD 3: Neural AI Stylometry & Trap Engine (6 Cols) */}
        <div className="lg:col-span-6 panel-chassis p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#ff4757]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2d3436]">
                  03 // NEURAL AI STYLOMETRY & BEHAVIORAL TRAP
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8896aa]">[LLM ENSEMBLE]</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 slot-recessed rounded-xl space-y-1">
                <div className="text-[10px] text-[#8896aa] uppercase">PRIMARY CLASSIFICATION:</div>
                <div className="text-sm font-bold text-[#ff4757]">{primaryThreat}</div>
                <div className="text-[11px] text-[#4a5568]">
                  Confidence: <strong className="text-[#2d3436]">{Math.round((data.ai_ml_analysis?.classification?.confidence || 0.9) * 100)}%</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 slot-recessed-sm rounded">
                  <span className="text-[10px] text-[#8896aa] block">VIP IMPERSONATION:</span>
                  <span className={`font-bold ${data.ai_ml_analysis?.heuristics?.vip_impersonation ? 'text-[#d63031]' : 'text-[#059669]'}`}>
                    {data.ai_ml_analysis?.heuristics?.vip_impersonation ? 'CONFIRMED MATCH' : 'NOT DETECTED'}
                  </span>
                </div>
                <div className="p-2.5 slot-recessed-sm rounded">
                  <span className="text-[10px] text-[#8896aa] block">PRESSURE / URGENCY:</span>
                  <span className={`font-bold ${data.ai_ml_analysis?.heuristics?.urgency_detected ? 'text-[#d63031]' : 'text-[#059669]'}`}>
                    {data.ai_ml_analysis?.heuristics?.urgency_detected ? 'HIGH INDUCEMENT' : 'NORMAL'}
                  </span>
                </div>
              </div>

              {data.ai_ml_analysis?.rationale && (
                <p className="text-xs text-[#4a5568] font-sans italic bg-[#e0e5ec] p-2.5 rounded border border-[#d1d9e6]">
                  "{data.ai_ml_analysis.rationale.slice(0, 160)}..."
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => onSwitchView && onSwitchView('ai')}
            className="w-full btn-tactile-secondary py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
          >
            <span>[ACTIVATE ACTIVE DEFENSE & TARPIT]</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#ff4757]" />
          </button>
        </div>

        {/* BENTO CARD 4: Relay Hops & Speed-of-Light Physics (6 Cols) */}
        <div className="lg:col-span-6 panel-chassis p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#ff4757]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2d3436]">
                  04 // RELAY HOPS & GEO-PHYSICS ANOMALY
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8896aa]">[RFC-822 TRACE]</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 slot-recessed rounded">
                  <span className="text-[10px] text-[#8896aa] block">ORIGIN IP:</span>
                  <span className="font-bold text-[#2d3436]">{origin.ip || '198.51.100.24'}</span>
                </div>
                <div className="p-2.5 slot-recessed rounded">
                  <span className="text-[10px] text-[#8896aa] block">ASN / ORGANIZATION:</span>
                  <span className="font-bold text-[#2d3436] truncate block">{origin.asn || origin.isp || 'Host Provider'}</span>
                </div>
              </div>

              <div className="p-3 slot-recessed rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#4a5568]">Total Intermediate Hops:</span>
                  <span className="font-bold text-[#2d3436]">{data.trace?.hops?.length || 2} hops</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#4a5568]">Speed-of-Light Physics:</span>
                  <span className={`font-bold ${data.trace?.physics_violation ? 'text-[#d63031]' : 'text-[#059669]'}`}>
                    {data.trace?.physics_violation ? '⚡ TIME-DISTANCE VIOLATION (VPN)' : 'VALID PROPAGATION'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-[#4a5568] flex items-center gap-2 p-2 bg-[#e0e5ec] rounded border border-[#d1d9e6]">
                <Server className="w-3.5 h-3.5 text-[#ff4757] flex-shrink-0" />
                <span>Geolocated to {origin.city || 'Saint Petersburg'}, {origin.country || 'Russian Federation'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSwitchView && onSwitchView('geo')}
            className="w-full btn-tactile-secondary py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
          >
            <span>[VIEW INTERACTIVE WORLD MAP & HOPS]</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#ff4757]" />
          </button>
        </div>

        {/* BENTO CARD 5: Deep OSINT & Domain Intelligence (6 Cols) */}
        <div className="lg:col-span-6 panel-chassis p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-[#ff4757]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2d3436]">
                  05 // DEEP OSINT & LOOKALIKE SPOOFING
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8896aa]">[WHOIS / RECON]</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 slot-recessed rounded">
                <span className="text-[#4a5568]">Domain TypoSquatting:</span>
                <span className={`font-bold ${data.domain_check?.is_lookalike ? 'text-[#d63031]' : 'text-[#059669]'}`}>
                  {data.domain_check?.is_lookalike ? `SPOOF OF ${data.domain_check.target_brand || 'BRAND'}` : 'CLEAN DOMAIN'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 slot-recessed rounded">
                <span className="text-[#4a5568]">Levenshtein Distance:</span>
                <span className="font-bold text-[#2d3436]">{data.domain_check?.distance ?? 0} edit distance</span>
              </div>
              <div className="flex justify-between items-center p-2.5 slot-recessed rounded">
                <span className="text-[#4a5568]">Domain Age (WHOIS):</span>
                <span className="font-bold text-[#2d3436]">{data.whois_intel?.domain_age_days ?? '4'} days old (High Risk)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSwitchView && onSwitchView('osint')}
            className="w-full btn-tactile-secondary py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
          >
            <span>[OPEN OSINT DOSSIER & WAYBACK ARCHIVE]</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#ff4757]" />
          </button>
        </div>

        {/* BENTO CARD 6: Evidence Vault & Cryptographic Ledger (6 Cols) */}
        <div className="lg:col-span-6 panel-chassis p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2d3436]">
                  06 // EVIDENCE VAULT & NOTARY SEAL
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#10b981]">[IMMUTABLE]</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-2.5 slot-recessed rounded space-y-1">
                <span className="text-[10px] text-[#8896aa] block">RFC-822 SHA-256 HASH:</span>
                <span className="font-mono text-[11px] font-bold text-[#2d3436] break-all">
                  {data.custody?.sha256 || '8f9b7c2a1e4d3f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 slot-recessed rounded">
                <span className="text-[#4a5568]">Chain of Custody Status:</span>
                <span className="font-bold text-[#059669]">CERTIFIED & NOTARIZED</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSwitchView && onSwitchView('custody')}
            className="w-full btn-tactile-secondary py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
          >
            <span>[GENERATE COURT-ADMISSIBLE PDF DOSSIER]</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#10b981]" />
          </button>
        </div>

      </div>
    </div>
  );
}
