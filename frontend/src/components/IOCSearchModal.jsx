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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Global IOC Threat Dossier & Cross-Case Pivot
              </h2>
              <p className="text-xs text-slate-400">Search IPs, Domains, Senders, Hashes, or Keywords across forensic database</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <form onSubmit={(e) => { e.preventDefault(); executeSearch(query); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Enter IP (e.g. 192.168.1.100), Domain (paypa1.com), Email, SHA-256 hash, or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              {loading ? "Searching..." : "Lookup IOC"}
            </button>
          </form>

          {/* Quick Examples */}
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
            <span className="text-slate-500 font-semibold">Quick Pivots:</span>
            {['paypa1.com', '192.168.1.100', 'payroll', 'tim cook'].map((quick) => (
              <button
                key={quick}
                onClick={() => { setQuery(quick); executeSearch(quick); }}
                className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-slate-700 transition-colors cursor-pointer"
              >
                {quick}
              </button>
            ))}
          </div>
        </div>

        {/* Result Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-200">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="text-center py-12 text-slate-500 italic space-y-2">
              <Search className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
              <p>Type any IOC above to aggregate cross-incident threat history and attribution campaigns.</p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* IOC Overview Header Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                    {React.createElement(getIOCTypeIcon(result.ioc_type), { className: "w-5 h-5" })}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block tracking-wider">
                      {result.ioc_type} IOC Value
                    </span>
                    <h3 className="text-sm font-bold text-white font-mono">{result.ioc_value}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${result.verdict === 'MALICIOUS' ? 'bg-red-500/20 text-red-400 border-red-500/40' : (result.verdict === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40')}`}>
                    {result.verdict}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300">
                    {result.match_count} Incident Match(es)
                  </span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 font-mono">
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Avg Fraud Score</span>
                  <span className={`text-base font-bold ${result.avg_fraud_score > 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {result.avg_fraud_score} / 100
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 font-mono">
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Linked Campaigns</span>
                  <span className="text-base font-bold text-indigo-300">
                    {result.linked_campaigns?.length || 0} Cluster(s)
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 font-mono col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Attribution Status</span>
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {result.match_count > 1 ? 'Repeat Offender Campaign' : 'Single Sighting'}
                  </span>
                </div>
              </div>

              {/* Matched Historical Cases */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FolderArchive className="w-3.5 h-3.5 text-indigo-400" />
                  Correlated Incident Cases ({result.historical_cases?.length || 0})
                </h4>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {result.historical_cases && result.historical_cases.length > 0 ? (
                    result.historical_cases.map((c) => (
                      <div key={c.case_id} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 flex items-center justify-between gap-3 font-mono">
                        <div className="truncate space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-300 font-bold text-xs">{c.evidence_id}</span>
                            <span className="text-[10px] text-slate-400 font-sans">({c.primary_threat?.replace('_', ' ')})</span>
                          </div>
                          <span className="text-[11px] text-slate-300 font-sans block truncate max-w-sm">{c.subject}</span>
                          <span className="text-[10px] text-slate-500 block truncate">From: {c.from_address}</span>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.fraud_score > 70 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            Score: {c.fraud_score}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">{c.campaign_id}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic py-3 text-center">No previous incidents match this indicator.</p>
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
