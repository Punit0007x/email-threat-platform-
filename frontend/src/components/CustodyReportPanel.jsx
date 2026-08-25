import React, { useState } from 'react';
import { ShieldCheck, Printer, Calendar, ShieldAlert, CheckCircle2, Lock, Eye, X, Copy, Zap } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function CustodyReportPanel({ data }) {
  const [reportHtml, setReportHtml] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [copied, setCopied] = useState(false);

  const [classification, setClassification] = useState("CONFIDENTIAL // TLP:AMBER");
  const [investigator, setInvestigator] = useState("Autonomous SOC Forensic Agent");
  const [agency, setAgency] = useState("Cyber Threat Intelligence Unit");

  if (!data || !data.custody) return null;
  const custody = data.custody;
  const dns = data.dns_intel || {};
  const infra = data.infra_intel || {};
  const whois = data.whois_intel || {};

  const fetchReportHtml = async (customOptions = null) => {
    setLoadingReport(true);
    try {
      const payload = {
        ...data,
        report_options: customOptions || {
          classification,
          investigator,
          agency
        }
      };

      const resp = await fetch(`${API_BASE_URL}/api/report/html`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const html = await resp.text();
        setReportHtml(html);
        return html;
      } else {
        alert("Failed to generate report from server.");
      }
    } catch (err) {
      alert("Error generating report: " + err.message);
    } finally {
      setLoadingReport(false);
    }
    return null;
  };

  const handleExportSTIX = () => {
    const stixBundle = {
      type: "bundle",
      id: `bundle--${crypto.randomUUID ? crypto.randomUUID() : 'c878fa42-b91c-4b51-9e81-2292f7d3a771'}`,
      spec_version: "2.1",
      objects: [
        {
          type: "report",
          spec_version: "2.1",
          id: `report--${crypto.randomUUID ? crypto.randomUUID() : 'b2234053-cfd0-4cb6-88bf-712613d54832'}`,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          name: `Forensic Email Investigation: ${data.subject || 'Incident'}`,
          description: `Cryptographically verified email threat assessment. Fraud Index: ${data.fraud_assessment?.score || 0}/100. Primary Threat: ${data.ai_ml_analysis?.classification?.primary_threat || 'Phishing'}.`,
          published: new Date().toISOString(),
          object_refs: [],
          confidence: data.ai_ml_analysis?.classification?.confidence_pct || 90,
          labels: ["malicious-activity", "phishing", "email-threat"]
        },
        {
          type: "indicator",
          spec_version: "2.1",
          id: `indicator--${crypto.randomUUID ? crypto.randomUUID() : 'fa94ec23-5e74-4b5c-bd62-127e3d1bc822'}`,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          name: `Origin IP: ${data.trace?.best_guess_ip || '127.0.0.1'}`,
          pattern: `[ipv4-addr:value = '${data.trace?.best_guess_ip || '127.0.0.1'}']`,
          pattern_type: "stix",
          valid_from: new Date().toISOString()
        }
      ]
    };

    const blob = new Blob([JSON.stringify(stixBundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STIX2.1-${custody.evidence_id || 'forensic-case'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMISP = () => {
    const mispEvent = {
      Event: {
        id: custody.evidence_id || "EVT-001",
        info: `Email Incident: ${data.subject || 'Forensic Triaged'}`,
        threat_level_id: (data.fraud_assessment?.score || 0) > 70 ? "1" : "2",
        analysis: "2",
        distribution: "1",
        date: new Date().toISOString().substring(0, 10),
        Attribute: [
          { type: "email-src", value: data.from_address || "", category: "Payload delivery" },
          { type: "email-subject", value: data.subject || "", category: "Payload delivery" },
          { type: "ip-src", value: data.trace?.best_guess_ip || "", category: "Network activity" },
          { type: "sha256", value: custody.sha256 || "", category: "Payload delivery" }
        ]
      }
    };

    const blob = new Blob([JSON.stringify(mispEvent, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MISP-Event-${custody.evidence_id || 'case'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreviewReport = async () => {
    const html = await fetchReportHtml();
    if (html) {
      setShowPreviewModal(true);
    }
  };

  const handlePrintReport = async () => {
    const html = await fetchReportHtml();
    if (html) {
      const win = window.open("", "_blank");
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  };

  const handleCopyHtml = () => {
    if (reportHtml) {
      navigator.clipboard.writeText(reportHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDomainAgeBadge = () => {
    if (whois.domain_age_days == null) return null;
    const days = whois.domain_age_days;
    if (days < 30) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-[#ef4444]/15 text-[#d63031] border border-[#ef4444]/30">
          {days} days old (High Risk)
        </span>
      );
    }
    if (days < 90) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/30">
          {days} days old (Recent)
        </span>
      );
    }
    const years = (days / 365.25).toFixed(1);
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-[#10b981]/15 text-[#047857] border border-[#10b981]/30">
        {years > 1 ? `${years} yrs (${days}d)` : `${days} days`} (Established)
      </span>
    );
  };

  return (
    <div className="bg-transparent space-y-10 relative">

      {/* Header & Print Action */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 px-2">
        <div className="flex items-center space-x-5">
          <div className="p-4 bg-white/20 backdrop-blur-3xl text-slate-800 rounded-[1.5rem] border border-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_8px_32px_rgba(0,0,0,0.1)]">
            <Printer className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 drop-shadow-sm">
              Official Incident Report
              <span className="text-xs bg-white/30 text-slate-700 font-mono px-3 py-1.5 rounded-lg border border-white/60 font-bold backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                {custody.custody_seal || "SEALED"}
              </span>
            </h2>
            <p className="text-base text-slate-600 font-medium">Downloadable investigation reports and security data exports.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportSTIX}
            className="bg-white/10 hover:bg-white/30 backdrop-blur-3xl border border-white/60 text-slate-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(0,0,0,0.05)] transition-all text-sm font-bold px-5 py-2.5 rounded-xl"
            title="Download STIX Threat Data"
          >
            Download STIX Data
          </button>

          <button
            onClick={handleExportMISP}
            className="bg-white/10 hover:bg-white/30 backdrop-blur-3xl border border-white/60 text-slate-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(0,0,0,0.05)] transition-all text-sm font-bold px-5 py-2.5 rounded-xl"
            title="Download MISP Security Event"
          >
            Download MISP Data
          </button>
          
          <button
            onClick={handlePrintReport}
            disabled={loadingReport}
            className="bg-slate-800/90 hover:bg-slate-900 backdrop-blur-3xl border border-slate-700 text-white shadow-xl transition-all flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl ml-2"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Checksum & Metadata Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
        <div className="bg-white/20 backdrop-blur-3xl border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] rounded-[2rem] p-7 group hover:bg-white/30 transition-all duration-500">
          <span className="text-slate-600 font-bold block mb-2 text-xs uppercase tracking-wider drop-shadow-sm">Report ID</span>
          <span className="text-slate-900 font-bold font-mono text-lg">{custody.evidence_id}</span>
        </div>
        <div className="bg-white/20 backdrop-blur-3xl border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] rounded-[2rem] p-7 overflow-hidden group hover:bg-white/30 transition-all duration-500">
          <span className="text-slate-600 font-bold block mb-2 text-xs uppercase tracking-wider drop-shadow-sm">File Fingerprint</span>
          <span className="text-indigo-700 truncate block font-bold font-mono text-lg drop-shadow-sm">{custody.sha256}</span>
        </div>
        <div className="bg-white/20 backdrop-blur-3xl border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] rounded-[2rem] p-7 group hover:bg-white/30 transition-all duration-500">
          <span className="text-slate-600 font-bold block mb-2 text-xs uppercase tracking-wider drop-shadow-sm">Analysis Time</span>
          <span className="text-slate-900 font-medium font-mono text-lg">{custody.ingestion_timestamp_utc?.replace('T', ' ').substring(0, 19)}</span>
        </div>
        <div className="bg-white/20 backdrop-blur-3xl border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] rounded-[2rem] p-7 space-y-1.5 group hover:bg-white/30 transition-all duration-500">
          <span className="text-slate-600 font-bold block mb-2 text-xs uppercase tracking-wider drop-shadow-sm">File Details</span>
          <span className="text-slate-900 block truncate text-sm font-bold font-mono">MD5: <span className="text-slate-600">{custody.md5 || 'N/A'}</span></span>
          <span className="text-slate-900 block truncate text-sm font-bold">Size: <span className="text-slate-600">{custody.file_size_bytes ? `${custody.file_size_bytes} Bytes` : 'N/A'}</span></span>
        </div>
      </div>

      {/* Blockchain Notarization Ledger Strip */}
      {data.blockchain_receipt && (
        <div className="relative z-10 bg-white/20 backdrop-blur-3xl border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] rounded-[2rem] p-6 px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-base">
          <div className="flex items-center space-x-4">
            <span className="px-4 py-1.5 rounded-xl font-bold text-xs bg-emerald-500/20 text-emerald-800 border border-emerald-300/50 flex items-center gap-2 uppercase tracking-wide backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              {data.blockchain_receipt.status === 'NOTARIZED' ? "SECURELY RECORDED" : data.blockchain_receipt.status}
            </span>
            <span className="text-slate-800 font-bold">
              Secure Record: <span className="text-indigo-700 font-mono font-medium drop-shadow-sm">Local System Database</span>
            </span>
          </div>
          <div className="font-mono text-sm text-slate-600 truncate max-w-full">
            Receipt ID: <span className="text-slate-900 font-bold ml-1">{data.blockchain_receipt.transaction_hash || "0x..."}</span>
          </div>
        </div>
      )}

      {/* Infrastructure, DNS & WHOIS Snapshot Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
        
        {/* Card 1: Origin Infrastructure */}
        <div className="bg-white/20 backdrop-blur-3xl border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] rounded-[2rem] p-8 space-y-4 flex flex-col justify-between group hover:bg-white/30 transition-all duration-500">
          <div>
            <span className="text-slate-600 font-bold block uppercase tracking-wider text-xs mb-4 drop-shadow-sm">
              Sending Server Details
            </span>
            <div className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] ${infra.is_vpn_proxy ? 'bg-red-500' : (infra.is_cloud ? 'bg-amber-500' : 'bg-sky-500')}`} />
              {infra.infra_type || "Standard Internet Provider"}
            </div>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed font-sans">{infra.details}</p>
          </div>
          {infra.ip && (
            <div className="pt-5 border-t border-slate-300/40 text-sm text-slate-600">
              Analyzed IP Address: <br/>
              <span className="text-slate-900 font-bold font-mono text-base mt-1.5 block">{infra.ip}</span>
            </div>
          )}
        </div>

        {/* Card 2: DNS & MX Routing */}
        <div className="bg-white/20 backdrop-blur-3xl border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] rounded-[2rem] p-8 space-y-4 flex flex-col justify-between group hover:bg-white/30 transition-all duration-500">
          <div>
            <span className="text-slate-600 font-bold block uppercase tracking-wider text-xs mb-4 drop-shadow-sm">
              Domain Routing Check
            </span>
            <div className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              {dns.is_resolvable ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 drop-shadow-sm" />
                  <span className="text-emerald-700 drop-shadow-sm">Resolvable ({dns.mx_records?.length || 0} Routes)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 drop-shadow-sm" />
                  <span className="text-red-700 font-bold drop-shadow-sm">Unresolvable / Fake Domain</span>
                </>
              )}
            </div>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed font-sans">
              {dns.risk_indicators?.length > 0 ? dns.risk_indicators.join("; ") : "Valid internet routing records configured."}
            </p>
          </div>
          {dns.domain && (
            <div className="pt-5 border-t border-slate-300/40 text-sm text-slate-600 truncate">
              Email Domain: <br/>
              <span className="text-slate-900 font-bold text-base mt-1.5 block drop-shadow-sm">{dns.domain}</span>
            </div>
          )}
        </div>

        {/* Card 3: WHOIS & Registrar Intelligence */}
        <div className="bg-white/20 backdrop-blur-3xl border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] rounded-[2rem] p-8 space-y-4 flex flex-col justify-between group hover:bg-white/30 transition-all duration-500">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-600 font-bold block uppercase tracking-wider text-xs drop-shadow-sm">
                Domain Registration Info
              </span>
            </div>
            
            <div className="text-base font-bold text-slate-900 truncate">
              {whois.registrar || <span className="text-slate-500 italic font-normal">Registrar Unspecified</span>}
            </div>

            <div className="space-y-2.5 mt-5 text-sm text-slate-900">
              {whois.creation_date && (
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Created: <strong className="text-slate-900 font-mono drop-shadow-sm">{whois.creation_date.substring(0, 10)}</strong></span>
                </div>
              )}
              {whois.is_privacy_protected !== undefined && (
                <div className="flex items-center gap-2.5">
                  <Lock className={`w-4 h-4 ${whois.is_privacy_protected ? 'text-amber-600' : 'text-slate-500'} flex-shrink-0`} />
                  <span className="text-slate-600">
                    Privacy: <strong className={whois.is_privacy_protected ? 'text-amber-700 drop-shadow-sm' : 'text-slate-900 drop-shadow-sm'}>
                      {whois.is_privacy_protected ? 'Hidden Details' : 'Public Details'}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {whois.risk_indicators?.length > 0 && (
              <div className="mt-5 text-sm text-amber-900 flex items-start gap-2 p-3 bg-white/30 backdrop-blur-3xl rounded-[1rem] border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.02)]">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 drop-shadow-sm" />
                <span className="line-clamp-2 leading-relaxed font-medium">{whois.risk_indicators[0]}</span>
              </div>
            )}
          </div>

          {whois.registrant_org && (
            <div className="pt-5 border-t border-slate-300/40 text-sm text-slate-600 truncate">
              Organization: <br/>
              <span className="text-slate-900 font-bold text-base mt-1.5 block drop-shadow-sm">{whois.registrant_org}</span>
            </div>
          )}
        </div>

      </div>

      {/* In-App Live Forensic Report Preview Modal */}
      {showPreviewModal && reportHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="panel-chassis w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#e2e8f0]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f8fafc] bg-[#ffffff]">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-[#059669]" />
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a] font-mono">FORENSIC INVESTIGATION REPORT PREVIEW</h3>
                  <p className="text-xs text-[#64748b] font-mono">Evidence ID: {custody.evidence_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHtml}
                  className="btn-tactile-secondary text-sm font-bold"
                  title="Copy Report HTML"
                >
                  <Copy className="w-3.5 h-3.5 inline mr-1" />
                  {copied ? "Copied HTML!" : "Copy HTML"}
                </button>

                <button
                  onClick={handlePrintReport}
                  className="btn-tactile-primary text-sm font-bold"
                >
                  <Printer className="w-3.5 h-3.5 inline mr-1" />
                  Print / Export
                </button>

                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-[#64748b] hover:text-[#0f172a] rounded-lg transition-colors cursor-pointer ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Report Configuration & Metadata Toolbar */}
            <div className="px-6 py-3 bg-[#f8fafc] border-b border-[#f8fafc] flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[#64748b] font-bold text-sm font-mono">Classification:</span>
                <select
                  value={classification}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClassification(val);
                    fetchReportHtml({ classification: val, investigator, agency });
                  }}
                  className="bg-[#ffffff] border border-[#e2e8f0] text-[#0f172a] text-sm rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer font-mono font-bold"
                >
                  <option value="CONFIDENTIAL // TLP:AMBER">CONFIDENTIAL // TLP:AMBER</option>
                  <option value="TOP SECRET // TLP:RED">TOP SECRET // TLP:RED</option>
                  <option value="LAW ENFORCEMENT SENSITIVE">LAW ENFORCEMENT SENSITIVE</option>
                  <option value="INTERNAL USE ONLY">INTERNAL USE ONLY</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#64748b] font-bold text-sm font-mono">Investigator:</span>
                <input
                  type="text"
                  value={investigator}
                  onChange={(e) => setInvestigator(e.target.value)}
                  onBlur={() => fetchReportHtml({ classification, investigator, agency })}
                  className="bg-[#ffffff] border border-[#e2e8f0] text-[#0f172a] text-sm rounded-lg px-2.5 py-1 w-44 focus:outline-none font-mono font-bold"
                  placeholder="Analyst Name / Badge"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#64748b] font-bold text-sm font-mono">Agency / Unit:</span>
                <input
                  type="text"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  onBlur={() => fetchReportHtml({ classification, investigator, agency })}
                  className="bg-[#ffffff] border border-[#e2e8f0] text-[#0f172a] text-sm rounded-lg px-2.5 py-1 w-44 focus:outline-none font-mono font-bold"
                  placeholder="SOC Team / Unit"
                />
              </div>
            </div>

            {/* Modal Body / Report Frame */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 border border-gray-100 rounded-xl bg-[#f8fafc]">
              <iframe
                title="Forensic Report Preview"
                srcDoc={reportHtml}
                className="w-full h-[65vh] rounded-xl border border-[#e2e8f0] bg-white shadow-inner"
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

