import React, { useState } from 'react';
import { ShieldCheck, Printer, Calendar, ShieldAlert, CheckCircle2, Lock, Eye, X, Copy, Zap } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function CustodyReportPanel({ data }) {
  const [reportHtml, setReportHtml] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [copied, setCopied] = useState(false);

  const [classification, setClassification] = useState("INTERNAL USE ONLY");
  const [investigator, setInvestigator] = useState("Security Agent");
  const [agency, setAgency] = useState("Security Team");

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
    // simplified implementation
    alert("Exporting threat intel data...");
  };

  const handleExportMISP = () => {
    alert("Exporting incident data...");
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
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          {days} days old (High Risk)
        </span>
      );
    }
    if (days < 90) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {days} days old (Recent)
        </span>
      );
    }
    const years = (days / 365.25).toFixed(1);
    return (
      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        {years > 1 ? `${years} yrs (${days}d)` : `${days} days`} (Established)
      </span>
    );
  };

  return (
    <div className="panel-chassis p-6 sm:p-8 space-y-6">
      
      {/* Header & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl shadow-sm border border-green-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Email Details & Security Report
              <span className="text-xs bg-green-50 text-green-700 font-mono px-2 py-0.5 rounded border border-green-200 font-semibold">
                {custody.custody_seal}
              </span>
            </h2>
            <p className="text-sm text-gray-500">Generate reports or view file details.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportSTIX}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            Export Tech Data
          </button>

          <button
            onClick={handlePreviewReport}
            disabled={loadingReport}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-blue-500" />
            {loadingReport ? "Loading..." : "Preview Report"}
          </button>
          
          <button
            onClick={handlePrintReport}
            disabled={loadingReport}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Checksum & Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl shadow-sm">
          <span className="text-gray-500 font-semibold block mb-1 text-xs uppercase">EVIDENCE ID</span>
          <span className="text-gray-800 font-bold">{custody.evidence_id}</span>
        </div>
        <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl shadow-sm overflow-hidden">
          <span className="text-gray-500 font-semibold block mb-1 text-xs uppercase">Unique File Signature</span>
          <span className="text-purple-600 truncate block font-bold">{custody.sha256}</span>
        </div>
        <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl shadow-sm">
          <span className="text-gray-500 font-semibold block mb-1 text-xs uppercase">Analyzed On</span>
          <span className="text-gray-800 font-semibold">{custody.ingestion_timestamp_utc?.replace('T', ' ').substring(0, 19)}</span>
        </div>
        <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl shadow-sm">
          <span className="text-gray-500 font-semibold block mb-1 text-xs uppercase">File Size</span>
          <span className="text-gray-800 block text-xs font-semibold">{custody.file_size_bytes ? `${custody.file_size_bytes} B` : 'Unknown'}</span>
        </div>
      </div>

      {/* Security Verification Ledger Strip */}
      {data.blockchain_receipt && (
        <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="px-2 py-1 rounded-md font-semibold text-xs bg-green-50 text-green-700 border border-green-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Verified Authentic
            </span>
            <span className="text-gray-800 font-semibold">
              Security Log: <span className="text-purple-600">{data.blockchain_receipt.blockchain_network || "Internal-Record"}</span>
            </span>
          </div>
          <div className="text-gray-500 font-mono text-xs truncate max-w-full sm:max-w-md">
            Record ID: <span className="text-gray-800 font-bold">{data.blockchain_receipt.transaction_hash || "0x..."}</span>
          </div>
        </div>
      )}

      {/* Infrastructure, DNS & WHOIS Snapshot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        
        {/* Card 1: Origin Infrastructure */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-gray-500 font-semibold block uppercase tracking-wider text-xs mb-2">
              Server Details
            </span>
            <div className="text-gray-800 font-bold flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full shadow-sm ${infra.is_vpn_proxy ? 'bg-red-500' : (infra.is_cloud ? 'bg-amber-500' : 'bg-blue-500')}`} />
              {infra.infra_type || "Standard ISP"}
            </div>
            <p className="text-gray-600 text-xs mt-2 leading-relaxed">{infra.details}</p>
          </div>
          {infra.ip && (
            <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
              Scanned IP: <span className="text-gray-800 font-bold">{infra.ip}</span>
            </div>
          )}
        </div>

        {/* Card 2: DNS & MX Routing */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-gray-500 font-semibold block uppercase tracking-wider text-xs mb-2">
              Domain Settings
            </span>
            <div className="text-gray-800 font-bold flex items-center gap-2">
              {dns.is_resolvable ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-green-700">Valid Domain</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-700">Invalid Domain (Fake)</span>
                </>
              )}
            </div>
            <p className="text-gray-600 text-xs mt-2 leading-relaxed">
              {dns.risk_indicators?.length > 0 ? dns.risk_indicators.join("; ") : "This sender domain has valid email setup records."}
            </p>
          </div>
          {dns.domain && (
            <div className="pt-3 border-t border-gray-100 text-xs text-gray-500 truncate">
              Website Address: <span className="text-gray-800 font-bold">{dns.domain}</span>
            </div>
          )}
        </div>

        {/* Card 3: WHOIS & Registrar Intelligence */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 font-semibold block uppercase tracking-wider text-xs">
                Website Registration
              </span>
              {getDomainAgeBadge()}
            </div>
            
            <div className="text-gray-800 font-bold truncate">
              {whois.registrar || <span className="text-gray-400 italic font-normal">Provider Unknown</span>}
            </div>

            <div className="space-y-2 mt-3 text-xs text-gray-800">
              {whois.creation_date && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span>Created: <strong className="text-gray-800">{whois.creation_date.substring(0, 10)}</strong></span>
                </div>
              )}
              {whois.is_privacy_protected !== undefined && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Lock className={`w-4 h-4 ${whois.is_privacy_protected ? 'text-amber-500' : 'text-gray-400'} flex-shrink-0`} />
                  <span>
                    Privacy: <strong className={whois.is_privacy_protected ? 'text-amber-700' : 'text-gray-800'}>
                      {whois.is_privacy_protected ? 'Hidden Details' : 'Public Details'}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {whois.registrant_org && (
            <div className="pt-3 border-t border-gray-100 text-xs text-gray-500 truncate">
              Owner: <span className="text-gray-800 font-bold">{whois.registrant_org}</span>
            </div>
          )}
        </div>

      </div>

      {/* In-App Live Forensic Report Preview Modal */}
      {showPreviewModal && reportHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 uppercase">Security Report Preview</h3>
                  <p className="text-xs text-gray-500">ID: {custody.evidence_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHtml}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4 inline mr-1.5" />
                  {copied ? "Copied!" : "Copy HTML"}
                </button>

                <button
                  onClick={handlePrintReport}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4 inline mr-1.5" />
                  Print / Save
                </button>

                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Report Frame */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
              <iframe
                title="Security Report Preview"
                srcDoc={reportHtml}
                className="w-full h-[65vh] rounded-xl border border-gray-300 bg-white shadow-sm"
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

