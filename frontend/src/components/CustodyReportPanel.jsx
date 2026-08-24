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
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#ef4444]/15 text-[#d63031] border border-[#ef4444]/30">
          {days} days old (High Risk)
        </span>
      );
    }
    if (days < 90) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/30">
          {days} days old (Recent)
        </span>
      );
    }
    const years = (days / 365.25).toFixed(1);
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#10b981]/15 text-[#047857] border border-[#10b981]/30">
        {years > 1 ? `${years} yrs (${days}d)` : `${days} days`} (Established)
      </span>
    );
  };

  return (
    <div className="panel-chassis p-6 sm:p-8 space-y-6 relative overflow-hidden">
      
      {/* Corner Screws */}
      <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

      {/* Header & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f8fafc] pb-4 px-2">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-[#ffffff] text-[#10b981] rounded-2xl shadow-[var(--shadow-card)] border border-white/70">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
              Chain-of-Custody & Evidence Manifest
              <span className="text-[10px] bg-[#10b981]/15 text-[#047857] font-mono px-2.5 py-0.5 rounded border border-[#10b981]/30 font-bold">
                {custody.custody_seal}
              </span>
            </h2>
            <p className="text-xs text-[#64748b] font-mono">Cryptographic evidence preservation & legal reporting</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportSTIX}
            className="btn-tactile-secondary text-xs font-mono font-bold"
            title="Download OASIS STIX 2.1 Threat Intel Bundle"
          >
            STIX 2.1
          </button>

          <button
            onClick={handleExportMISP}
            className="btn-tactile-secondary text-xs font-mono font-bold"
            title="Download MISP Event Threat Format"
          >
            MISP Event
          </button>

          <button
            onClick={handlePreviewReport}
            disabled={loadingReport}
            className="btn-tactile-secondary flex items-center gap-1.5 text-xs font-bold"
          >
            <Eye className="w-3.5 h-3.5 text-[#0ea5e9]" />
            {loadingReport ? "Loading..." : "Preview Report"}
          </button>
          
          <button
            onClick={handlePrintReport}
            disabled={loadingReport}
            className="btn-tactile-primary flex items-center gap-1.5 text-xs font-bold"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Checksum & Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="slot-recessed p-3.5 rounded-xl">
          <span className="text-[#64748b] font-bold block mb-1 text-[10px] uppercase">EVIDENCE ID</span>
          <span className="text-[#0f172a] font-bold">{custody.evidence_id}</span>
        </div>
        <div className="slot-recessed p-3.5 rounded-xl overflow-hidden">
          <span className="text-[#64748b] font-bold block mb-1 text-[10px] uppercase">SHA-256 DIGEST</span>
          <span className="text-[#7048e8] truncate block font-bold">{custody.sha256}</span>
        </div>
        <div className="slot-recessed p-3.5 rounded-xl">
          <span className="text-[#64748b] font-bold block mb-1 text-[10px] uppercase">INGESTION UTC</span>
          <span className="text-[#0f172a] font-medium">{custody.ingestion_timestamp_utc?.replace('T', ' ').substring(0, 19)}</span>
        </div>
        <div className="slot-recessed p-3.5 rounded-xl">
          <span className="text-[#64748b] font-bold block mb-1 text-[10px] uppercase">FILE CHECKSUMS</span>
          <span className="text-[#64748b] block truncate text-[10px] font-bold">MD5: {custody.md5 || 'N/A'}</span>
          <span className="text-[#64748b] block truncate text-[10px]">Size: {custody.file_size_bytes ? `${custody.file_size_bytes} B` : 'N/A'}</span>
        </div>
      </div>

      {/* Blockchain Notarization Ledger Strip */}
      {data.blockchain_receipt && (
        <div className="slot-recessed p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-[#10b981]/15 text-[#047857] border border-[#10b981]/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#059669]" />
              {data.blockchain_receipt.status || "NOTARIZED"}
            </span>
            <span className="text-[#0f172a] font-bold">
              Immutable Ledger: <span className="text-[#7048e8] font-mono">{data.blockchain_receipt.blockchain_network || "Local-Ethereum-Notary"}</span>
            </span>
          </div>
          <div className="font-mono text-[11px] text-[#64748b] truncate max-w-full sm:max-w-md">
            Txn: <span className="text-[#0f172a] font-bold">{data.blockchain_receipt.transaction_hash || "0x..."}</span>
          </div>
        </div>
      )}

      {/* Infrastructure, DNS & WHOIS Snapshot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
        
        {/* Card 1: Origin Infrastructure */}
        <div className="slot-recessed p-4 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[#64748b] font-bold block uppercase tracking-wider text-[11px] mb-1 font-mono">
              Origin Infrastructure Tier
            </span>
            <div className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${infra.is_vpn_proxy ? 'bg-[#ef4444]' : (infra.is_cloud ? 'bg-[#f59e0b]' : 'bg-[#0ea5e9]')}`} />
              {infra.infra_type || "Standard ISP"}
            </div>
            <p className="text-[#64748b] text-[11px] mt-1 leading-relaxed font-sans">{infra.details}</p>
          </div>
          {infra.ip && (
            <div className="pt-2 border-t border-[#e2e8f0]/50 text-[11px] font-mono text-[#64748b]">
              Analyzed IP: <span className="text-[#0f172a] font-bold">{infra.ip}</span>
            </div>
          )}
        </div>

        {/* Card 2: DNS & MX Routing */}
        <div className="slot-recessed p-4 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[#64748b] font-bold block uppercase tracking-wider text-[11px] mb-1 font-mono">
              Sender DNS & MX Status
            </span>
            <div className="text-sm font-bold text-[#0f172a] flex items-center gap-1.5">
              {dns.is_resolvable ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
                  <span className="text-[#059669]">Resolvable ({dns.mx_records?.length || 0} MX)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
                  <span className="text-[#d63031] font-bold">Unresolvable / NXDOMAIN</span>
                </>
              )}
            </div>
            <p className="text-[#64748b] text-[11px] mt-1 leading-relaxed font-sans">
              {dns.risk_indicators?.length > 0 ? dns.risk_indicators.join("; ") : "Valid DNS and MX routing records configured."}
            </p>
          </div>
          {dns.domain && (
            <div className="pt-2 border-t border-[#e2e8f0]/50 text-[11px] font-mono text-[#64748b] truncate">
              Domain: <span className="text-[#0f172a] font-bold">{dns.domain}</span>
            </div>
          )}
        </div>

        {/* Card 3: WHOIS & Registrar Intelligence */}
        <div className="slot-recessed p-4 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#64748b] font-bold block uppercase tracking-wider text-[11px] font-mono">
                WHOIS & Registrar Intel
              </span>
              {getDomainAgeBadge()}
            </div>
            
            <div className="text-sm font-bold text-[#0f172a] truncate">
              {whois.registrar || <span className="text-[#94a3b8] italic font-normal">Registrar Unspecified</span>}
            </div>

            <div className="space-y-1 mt-2 text-[11px] text-[#0f172a]">
              {whois.creation_date && (
                <div className="flex items-center gap-1.5 text-[#64748b]">
                  <Calendar className="w-3.5 h-3.5 text-[#7048e8] flex-shrink-0" />
                  <span>Created: <strong className="text-[#0f172a] font-mono">{whois.creation_date.substring(0, 10)}</strong></span>
                </div>
              )}
              {whois.is_privacy_protected !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Lock className={`w-3.5 h-3.5 ${whois.is_privacy_protected ? 'text-[#f59e0b]' : 'text-[#94a3b8]'} flex-shrink-0`} />
                  <span className="text-[#64748b]">
                    Privacy: <strong className={whois.is_privacy_protected ? 'text-[#b45309]' : 'text-[#0f172a]'}>
                      {whois.is_privacy_protected ? 'Redacted / Protected' : 'Public Org'}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {whois.risk_indicators?.length > 0 && (
              <div className="mt-2 text-[11px] text-[#b45309] flex items-start gap-1">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#d97706]" />
                <span className="line-clamp-2">{whois.risk_indicators[0]}</span>
              </div>
            )}
          </div>

          {whois.registrant_org && (
            <div className="pt-2 border-t border-[#e2e8f0]/50 text-[11px] font-mono text-[#64748b] truncate">
              Org: <span className="text-[#0f172a] font-bold">{whois.registrant_org}</span>
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
                  <p className="text-[10px] text-[#64748b] font-mono">Evidence ID: {custody.evidence_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHtml}
                  className="btn-tactile-secondary text-xs font-bold"
                  title="Copy Report HTML"
                >
                  <Copy className="w-3.5 h-3.5 inline mr-1" />
                  {copied ? "Copied HTML!" : "Copy HTML"}
                </button>

                <button
                  onClick={handlePrintReport}
                  className="btn-tactile-primary text-xs font-bold"
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
            <div className="px-6 py-3 bg-[#f8fafc] border-b border-[#f8fafc] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#64748b] font-bold text-[11px] font-mono">Classification:</span>
                <select
                  value={classification}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClassification(val);
                    fetchReportHtml({ classification: val, investigator, agency });
                  }}
                  className="bg-[#ffffff] border border-[#e2e8f0] text-[#0f172a] text-[11px] rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer font-mono font-bold"
                >
                  <option value="CONFIDENTIAL // TLP:AMBER">CONFIDENTIAL // TLP:AMBER</option>
                  <option value="TOP SECRET // TLP:RED">TOP SECRET // TLP:RED</option>
                  <option value="LAW ENFORCEMENT SENSITIVE">LAW ENFORCEMENT SENSITIVE</option>
                  <option value="INTERNAL USE ONLY">INTERNAL USE ONLY</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#64748b] font-bold text-[11px] font-mono">Investigator:</span>
                <input
                  type="text"
                  value={investigator}
                  onChange={(e) => setInvestigator(e.target.value)}
                  onBlur={() => fetchReportHtml({ classification, investigator, agency })}
                  className="bg-[#ffffff] border border-[#e2e8f0] text-[#0f172a] text-[11px] rounded-lg px-2.5 py-1 w-44 focus:outline-none font-mono font-bold"
                  placeholder="Analyst Name / Badge"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#64748b] font-bold text-[11px] font-mono">Agency / Unit:</span>
                <input
                  type="text"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  onBlur={() => fetchReportHtml({ classification, investigator, agency })}
                  className="bg-[#ffffff] border border-[#e2e8f0] text-[#0f172a] text-[11px] rounded-lg px-2.5 py-1 w-44 focus:outline-none font-mono font-bold"
                  placeholder="SOC Team / Unit"
                />
              </div>
            </div>

            {/* Modal Body / Report Frame */}
            <div className="flex-1 overflow-y-auto p-4 slot-recessed bg-[#f8fafc]">
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

