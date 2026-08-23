import React, { useState } from 'react';
import { ShieldCheck, Printer, Calendar, ShieldAlert, CheckCircle2, Lock, Eye, X, Copy } from 'lucide-react';
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
        <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/30">
          {days} days old (High Risk)
        </span>
      );
    }
    if (days < 90) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
          {days} days old (Recent)
        </span>
      );
    }
    const years = (days / 365.25).toFixed(1);
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        {years > 1 ? `${years} yrs (${days}d)` : `${days} days`} (Established)
      </span>
    );
  };

  return (
    <div className="cyber-panel rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      
      {/* Header & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Chain-of-Custody & Evidence Manifest
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {custody.custody_seal}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">Cryptographic evidence preservation & legal reporting</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportSTIX}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 px-3 py-2 rounded-xl text-xs font-mono font-bold shadow-sm transition-all cursor-pointer hover:border-cyan-400"
            title="Download OASIS STIX 2.1 Threat Intel Bundle"
          >
            STIX 2.1
          </button>

          <button
            onClick={handleExportMISP}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40 px-3 py-2 rounded-xl text-xs font-mono font-bold shadow-sm transition-all cursor-pointer hover:border-purple-400"
            title="Download MISP Event Threat Format"
          >
            MISP Event
          </button>

          <button
            onClick={handlePreviewReport}
            disabled={loadingReport}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 hover:border-cyan-500/50"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            {loadingReport ? "Loading..." : "Preview Report"}
          </button>
          
          <button
            onClick={handlePrintReport}
            disabled={loadingReport}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/50 transition-all cursor-pointer disabled:opacity-50 hover:scale-105"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Checksum & Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
          <span className="text-slate-500 block mb-1">EVIDENCE ID</span>
          <span className="text-slate-200 font-bold">{custody.evidence_id}</span>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 overflow-hidden">
          <span className="text-slate-500 block mb-1">SHA-256 DIGEST</span>
          <span className="text-indigo-300 truncate block font-bold">{custody.sha256}</span>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
          <span className="text-slate-500 block mb-1">INGESTION UTC</span>
          <span className="text-slate-300">{custody.ingestion_timestamp_utc?.replace('T', ' ').substring(0, 19)}</span>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
          <span className="text-slate-500 block mb-1">FILE CHECKSUMS</span>
          <span className="text-slate-400 block truncate text-[10px]">MD5: {custody.md5 || 'N/A'}</span>
          <span className="text-slate-400 block truncate text-[10px]">Size: {custody.file_size_bytes ? `${custody.file_size_bytes} B` : 'N/A'}</span>
        </div>
      </div>

      {/* Blockchain Notarization Ledger Strip */}
      {data.blockchain_receipt && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-3.5 rounded-xl border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {data.blockchain_receipt.status || "NOTARIZED"}
            </span>
            <span className="text-slate-300 font-semibold">
              Immutable Ledger: <span className="text-indigo-300 font-mono">{data.blockchain_receipt.blockchain_network || "Local-Ethereum-Notary"}</span>
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 truncate max-w-full sm:max-w-md">
            Txn: <span className="text-slate-200">{data.blockchain_receipt.transaction_hash || "0x..."}</span>
          </div>
        </div>
      )}

      {/* Infrastructure, DNS & WHOIS Snapshot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
        
        {/* Card 1: Origin Infrastructure */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/60 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[11px] mb-1">
              Origin Infrastructure Tier
            </span>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${infra.is_vpn_proxy ? 'bg-red-500' : (infra.is_cloud ? 'bg-amber-500' : 'bg-blue-500')}`} />
              {infra.infra_type || "Standard ISP"}
            </div>
            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">{infra.details}</p>
          </div>
          {infra.ip && (
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500">
              Analyzed IP: <span className="text-slate-300">{infra.ip}</span>
            </div>
          )}
        </div>

        {/* Card 2: DNS & MX Routing */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/60 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[11px] mb-1">
              Sender DNS & MX Status
            </span>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              {dns.is_resolvable ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-400">Resolvable ({dns.mx_records?.length || 0} MX)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 font-bold">Unresolvable / NXDOMAIN</span>
                </>
              )}
            </div>
            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
              {dns.risk_indicators?.length > 0 ? dns.risk_indicators.join("; ") : "Valid DNS and MX routing records configured."}
            </p>
          </div>
          {dns.domain && (
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500 truncate">
              Domain: <span className="text-slate-300">{dns.domain}</span>
            </div>
          )}
        </div>

        {/* Card 3: WHOIS & Registrar Intelligence */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/60 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[11px]">
                WHOIS & Registrar Intel
              </span>
              {getDomainAgeBadge()}
            </div>
            
            <div className="text-sm font-semibold text-white truncate">
              {whois.registrar || <span className="text-slate-500 italic">Registrar Unspecified</span>}
            </div>

            <div className="space-y-1 mt-2 text-[11px] text-slate-300">
              {whois.creation_date && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>Created: <strong className="text-slate-200 font-mono">{whois.creation_date.substring(0, 10)}</strong></span>
                </div>
              )}
              {whois.is_privacy_protected !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Lock className={`w-3.5 h-3.5 ${whois.is_privacy_protected ? 'text-amber-400' : 'text-slate-500'} flex-shrink-0`} />
                  <span className="text-slate-400">
                    Privacy: <strong className={whois.is_privacy_protected ? 'text-amber-300' : 'text-slate-300'}>
                      {whois.is_privacy_protected ? 'Redacted / Protected' : 'Public Org'}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {whois.risk_indicators?.length > 0 && (
              <div className="mt-2 text-[11px] text-amber-400 flex items-start gap-1">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{whois.risk_indicators[0]}</span>
              </div>
            )}
          </div>

          {whois.registrant_org && (
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500 truncate">
              Org: <span className="text-slate-300">{whois.registrant_org}</span>
            </div>
          )}
        </div>

      </div>

      {/* In-App Live Forensic Report Preview Modal */}
      {showPreviewModal && reportHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Forensic Investigation Report Preview</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Evidence ID: {custody.evidence_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHtml}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  title="Copy Report HTML"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied HTML!" : "Copy HTML"}
                </button>

                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Export
                </button>

                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Report Configuration & Metadata Toolbar */}
            <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold text-[11px]">Classification:</span>
                <select
                  value={classification}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClassification(val);
                    fetchReportHtml({ classification: val, investigator, agency });
                  }}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-1 focus:outline-none cursor-pointer font-mono"
                >
                  <option value="CONFIDENTIAL // TLP:AMBER">CONFIDENTIAL // TLP:AMBER</option>
                  <option value="TOP SECRET // TLP:RED">TOP SECRET // TLP:RED</option>
                  <option value="LAW ENFORCEMENT SENSITIVE">LAW ENFORCEMENT SENSITIVE</option>
                  <option value="INTERNAL USE ONLY">INTERNAL USE ONLY</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold text-[11px]">Investigator:</span>
                <input
                  type="text"
                  value={investigator}
                  onChange={(e) => setInvestigator(e.target.value)}
                  onBlur={() => fetchReportHtml({ classification, investigator, agency })}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded px-2.5 py-1 w-44 focus:outline-none font-mono"
                  placeholder="Analyst Name / Badge"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold text-[11px]">Agency / Unit:</span>
                <input
                  type="text"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  onBlur={() => fetchReportHtml({ classification, investigator, agency })}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded px-2.5 py-1 w-44 focus:outline-none font-mono"
                  placeholder="SOC Team / Unit"
                />
              </div>
            </div>

            {/* Modal Body / Report Frame */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
              <iframe
                title="Forensic Report Preview"
                srcDoc={reportHtml}
                className="w-full h-[65vh] rounded-lg border border-slate-800 bg-white"
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

