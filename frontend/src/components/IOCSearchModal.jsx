import React, { useState } from 'react';
import { Search, X, ShieldAlert, Hash, Globe, Mail, Server, FolderArchive } from 'lucide-react';
import { API_BASE_URL } from '../config';

const getIOCTypeIcon = (type) => {
  switch (type) {
    case 'ip': return Server;
    case 'domain': return Globe;
    case 'email': return Mail;
    case 'sha256': return Hash;
    default: return Search;
  }
};

export default function IOCSearchModal({ isOpen, onClose, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const executeSearch = React.useCallback(async (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch(`${API_BASE_URL}/api/indicators/${encodeURIComponent(trimmed)}`);
      if (resp.ok) {
        const data = await resp.json();
        setResult(data);
      } else {
        setError("Failed to query IOC from server.");
      }
    } catch (err) {
      setError(err.message || "Network error querying indicator.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (initialQuery && isOpen) {
      setQuery(initialQuery);
      executeSearch(initialQuery);
    }
  }, [initialQuery, isOpen, executeSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="panel-chassis w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-[#e2e8f0] relative">
        
        {/* Corner Screws */}
        <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
        <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
        <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
        <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f8fafc] bg-[#ffffff]">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-[#ffffff] text-[#0ea5e9] rounded-xl shadow-[var(--shadow-card)] border border-white/70">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a] flex items-center gap-2 font-mono">
                Global IOC Threat Dossier & Cross-Case Pivot
              </h2>
              <p className="text-xs text-[#64748b]">Search IPs, Domains, Senders, Hashes, or Keywords across forensic database</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#64748b] hover:text-[#0f172a] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-6 border-b border-[#f8fafc] bg-[#f8fafc]">
          <form onSubmit={(e) => { e.preventDefault(); executeSearch(query); }} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Enter IP (e.g. 192.168.1.100), Domain (paypa1.com), Email, SHA-256 hash, or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full slot-recessed pl-10 pr-4 py-2.5 text-xs text-[#0f172a] focus:outline-none font-mono rounded-xl"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-tactile-primary text-xs font-bold disabled:opacity-50 flex-shrink-0"
            >
              {loading ? "Searching..." : "Lookup IOC"}
            </button>
          </form>

          {/* Quick Examples */}
          <div className="flex items-center gap-2 mt-3 text-[11px] text-[#64748b]">
            <span className="font-bold font-mono">Quick Pivots:</span>
            {['paypa1.com', '192.168.1.100', 'payroll', 'tim cook'].map((quick) => (
              <button
                key={quick}
                onClick={() => { setQuery(quick); executeSearch(quick); }}
                className="font-mono text-[10px] px-2.5 py-1 rounded-lg bg-[#ffffff] hover:bg-[#f8fafc] text-[#7048e8] border border-[#e2e8f0] font-bold transition-colors cursor-pointer shadow-sm"
              >
                {quick}
              </button>
            ))}
          </div>
        </div>

        {/* Result Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-[#0f172a]">
          {error && (
            <div className="p-4 rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#d63031] flex items-center gap-2 font-mono">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-[#ef4444]" />
              <span>{error}</span>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="text-center py-12 text-[#94a3b8] italic space-y-2">
              <Search className="w-10 h-10 mx-auto text-[#e2e8f0] stroke-[1.5]" />
              <p>Type any IOC above to aggregate cross-incident threat history and attribution campaigns.</p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* IOC Overview Header Card */}
              <div className="slot-recessed p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#f8fafc]">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-[#ffffff] text-[#7048e8] rounded-xl shadow-[var(--shadow-card)] border border-white/70">
                    {React.createElement(getIOCTypeIcon(result.ioc_type), { className: "w-5 h-5" })}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#64748b] font-bold block tracking-wider">
                      {result.ioc_type} IOC Value
                    </span>
                    <h3 className="text-sm font-bold text-[#0f172a] font-mono">{result.ioc_value}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${result.verdict === 'MALICIOUS' ? 'bg-[#ef4444]/15 text-[#d63031] border-[#ef4444]/30' : (result.verdict === 'SUSPICIOUS' ? 'bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/30' : 'bg-[#10b981]/15 text-[#047857] border-[#10b981]/30')}`}>
                    {result.verdict}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#ffffff] border border-[#e2e8f0] text-[#64748b] font-bold">
                    {result.match_count} Incident Match(es)
                  </span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="slot-recessed p-3.5 space-y-1 font-mono">
                  <span className="text-[#64748b] block text-[10px] uppercase font-bold">Avg Fraud Score</span>
                  <span className={`text-base font-bold ${result.avg_fraud_score > 70 ? 'text-[#d63031]' : 'text-[#047857]'}`}>
                    {result.avg_fraud_score} / 100
                  </span>
                </div>

                <div className="slot-recessed p-3.5 space-y-1 font-mono">
                  <span className="text-[#64748b] block text-[10px] uppercase font-bold">Linked Campaigns</span>
                  <span className="text-base font-bold text-[#7048e8]">
                    {result.linked_campaigns?.length || 0} Cluster(s)
                  </span>
                </div>

                <div className="slot-recessed p-3.5 space-y-1 font-mono col-span-2 sm:col-span-1">
                  <span className="text-[#64748b] block text-[10px] uppercase font-bold">Attribution Status</span>
                  <span className="text-xs font-bold text-[#0f172a] block truncate">
                    {result.match_count > 1 ? 'Repeat Offender Campaign' : 'Single Sighting'}
                  </span>
                </div>
              </div>

              {/* Matched Historical Cases */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-1.5 font-mono">
                  <FolderArchive className="w-3.5 h-3.5 text-[#7048e8]" />
                  Correlated Incident Cases ({result.historical_cases?.length || 0})
                </h4>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {result.historical_cases && result.historical_cases.length > 0 ? (
                    result.historical_cases.map((c) => (
                      <div key={c.case_id} className="bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]/60 flex items-center justify-between gap-3 font-mono shadow-sm">
                        <div className="truncate space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[#7048e8] font-bold text-xs">{c.evidence_id}</span>
                            <span className="text-[10px] text-[#64748b] font-sans">({c.primary_threat?.replace('_', ' ')})</span>
                          </div>
                          <span className="text-[11px] text-[#0f172a] font-sans font-medium block truncate max-w-sm">{c.subject}</span>
                          <span className="text-[10px] text-[#64748b] block truncate">From: {c.from_address}</span>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.fraud_score > 70 ? 'bg-[#ef4444]/15 text-[#d63031]' : 'bg-[#10b981]/15 text-[#047857]'}`}>
                            Score: {c.fraud_score}
                          </span>
                          <span className="text-[10px] text-[#64748b] block mt-1 font-bold">{c.campaign_id}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#94a3b8] italic py-3 text-center slot-recessed">No previous incidents match this indicator.</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
