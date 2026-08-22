import React, { useState, useEffect } from 'react';
import { FolderArchive, RefreshCw, Layers, ShieldAlert, ChevronRight, Hash } from 'lucide-react';

export default function CaseHistoryPanel() {
  const [cases, setCases] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('campaigns'); // 'campaigns' or 'cases'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [casesRes, campRes] = await Promise.all([
        fetch('http://localhost:8003/api/cases'),
        fetch('http://localhost:8003/api/campaigns')
      ]);
      if (casesRes.ok && campRes.ok) {
        setCases(await casesRes.json());
        setCampaigns(await campRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredCases = cases.filter(c => 
    c.from_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.campaign_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Case Management & Campaign Explorer
            </h2>
            <p className="text-xs text-slate-400">Searchable historical investigations & recurring threat cluster groupings</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setSelectedTab('campaigns')}
              className={`px-3 py-1.5 rounded-md transition-colors ${selectedTab === 'campaigns' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Campaign Clusters ({campaigns.length})
            </button>
            <button
              onClick={() => setSelectedTab('cases')}
              className={`px-3 py-1.5 rounded-md transition-colors ${selectedTab === 'cases' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Incident Log ({cases.length})
            </button>
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Campaign Explorer Tab */}
      {selectedTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-slate-500 text-xs italic">
              No investigated incident campaigns recorded yet. Upload and analyze an email above.
            </div>
          ) : (
            campaigns.map((camp) => (
              <div key={camp.campaign_id} className="bg-slate-900/50 border border-slate-700/70 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                    {camp.campaign_id}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {camp.case_count} incident(s)
                  </span>
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  Avg Fraud Score: 
                  <span className={camp.avg_score > 70 ? 'text-red-400' : (camp.avg_score > 30 ? 'text-amber-400' : 'text-emerald-400')}>
                    {camp.avg_score} / 100
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Targeted Domains: <span className="font-mono text-slate-300">{camp.domains.join(', ') || 'N/A'}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Last Seen: {camp.last_seen?.replace('T', ' ').substring(0, 19) || 'Just now'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Incident Cases Tab */}
      {selectedTab === 'cases' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search cases by sender, subject, or campaign ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />

          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="min-w-full divide-y divide-slate-700 text-xs text-left">
              <thead className="bg-slate-900 text-slate-400 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Evidence ID</th>
                  <th className="px-3 py-2.5">From</th>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="px-3 py-2.5">Threat</th>
                  <th className="px-3 py-2.5">Score</th>
                  <th className="px-3 py-2.5">Campaign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 bg-slate-800/40 font-mono">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500 italic">
                      No matching cases found.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => (
                    <tr key={c.case_id} className="hover:bg-slate-750">
                      <td className="px-3 py-2 text-indigo-300 font-bold">{c.evidence_id}</td>
                      <td className="px-3 py-2 text-slate-300 truncate max-w-[150px]">{c.from_address}</td>
                      <td className="px-3 py-2 text-slate-200 truncate max-w-[200px] font-sans">{c.subject}</td>
                      <td className="px-3 py-2 capitalize font-sans">{c.primary_threat?.replace('_', ' ')}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded font-bold ${c.fraud_score > 70 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {c.fraud_score}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[10px]">{c.campaign_id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
