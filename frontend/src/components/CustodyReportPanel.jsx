import React, { useState } from 'react';
import { ShieldCheck, FileDown, Lock, Eye, EyeOff, Hash, Printer } from 'lucide-react';

export default function CustodyReportPanel({ data }) {
  if (!data || !data.custody) return null;
  const custody = data.custody;
  const dns = data.dns_intel || {};
  const infra = data.infra_intel || {};

  const handlePrintReport = async () => {
    try {
      const resp = await fetch("http://localhost:8003/api/report/html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (resp.ok) {
        const html = await resp.text();
        const win = window.open("", "_blank");
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
      } else {
        alert("Failed to generate report from server.");
      }
    } catch (err) {
      alert("Error generating report: " + err.message);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-4">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Chain-of-Custody & Evidence Manifest
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                {custody.custody_seal}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Cryptographic evidence preservation & legal reporting</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            Print / Export Forensic Report
          </button>
        </div>
      </div>

      {/* Checksum & Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
          <span className="text-slate-500 block mb-1">EVIDENCE ID</span>
          <span className="text-slate-200 font-bold">{custody.evidence_id}</span>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 overflow-hidden">
          <span className="text-slate-500 block mb-1">SHA-256 DIGEST</span>
          <span className="text-indigo-300 truncate block">{custody.sha256}</span>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
          <span className="text-slate-500 block mb-1">INGESTION UTC</span>
          <span className="text-slate-300">{custody.ingestion_timestamp_utc?.replace('T', ' ').substring(0, 19)}</span>
        </div>
      </div>

      {/* Infrastructure & DNS Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
        <div className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-700/60 space-y-1">
          <span className="text-slate-400 font-bold block uppercase tracking-wider">Origin Infrastructure Tier</span>
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${infra.is_vpn_proxy ? 'bg-red-500' : (infra.is_cloud ? 'bg-amber-500' : 'bg-blue-500')}`} />
            {infra.infra_type || "Standard ISP"}
          </div>
          <p className="text-slate-400 text-[11px]">{infra.details}</p>
        </div>

        <div className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-700/60 space-y-1">
          <span className="text-slate-400 font-bold block uppercase tracking-wider">Sender DNS & MX Status</span>
          <div className="text-sm font-semibold text-white">
            {dns.is_resolvable ? (
              <span className="text-emerald-400">Resolvable ({dns.mx_records?.length || 0} MX records)</span>
            ) : (
              <span className="text-red-400 font-bold">Unresolvable / NXDOMAIN</span>
            )}
          </div>
          <p className="text-slate-400 text-[11px]">
            {dns.risk_indicators?.length > 0 ? dns.risk_indicators.join("; ") : "Valid DNS and MX routing configured."}
          </p>
        </div>
      </div>

    </div>
  );
}
