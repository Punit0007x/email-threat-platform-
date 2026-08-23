import React, { useState, useEffect } from 'react';
import { FolderArchive, RefreshCw, Bell, Webhook, CheckCircle2, Save, Shield, Trash2, Lock, Download, Eye, X } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function CaseHistoryPanel() {
  const [cases, setCases] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState({ total_alerts: 0, high_risk_alerts: 0, webhook_delivered: 0 });
  const [webhookConfig, setWebhookConfig] = useState({ webhook_url: '', min_score_threshold: 70, enabled: 0 });
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);

  const [retentionConfig, setRetentionConfig] = useState({
    enabled: false,
    max_case_age_days: 90,
    mask_pii_in_storage: true,
    mask_pii_in_reports: true
  });
  const [savingRetention, setSavingRetention] = useState(false);
  const [retentionSuccess, setRetentionSuccess] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState(null);

  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('campaigns'); // 'campaigns' | 'cases' | 'alerts' | 'retention'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [casesRes, campRes, alertsRes, statsRes, webhookRes, retentionRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/cases`),
        fetch(`${API_BASE_URL}/api/campaigns`),
        fetch(`${API_BASE_URL}/api/alerts`),
        fetch(`${API_BASE_URL}/api/alerts/stats`),
        fetch(`${API_BASE_URL}/api/alerts/webhook`),
        fetch(`${API_BASE_URL}/api/retention/config`)
      ]);
      if (casesRes.ok && campRes.ok) {
        setCases(await casesRes.json());
        setCampaigns(await campRes.json());
      }
      if (alertsRes.ok) {
        setAlerts(await alertsRes.json());
      }
      if (statsRes.ok) {
        setAlertStats(await statsRes.json());
      }
      if (webhookRes.ok) {
        setWebhookConfig(await webhookRes.json());
      }
      if (retentionRes.ok) {
        setRetentionConfig(await retentionRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch cases and alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    setSavingWebhook(true);
    setWebhookSuccess(false);
    try {
      const url = `${API_BASE_URL}/api/alerts/webhook?webhook_url=${encodeURIComponent(webhookConfig.webhook_url)}&min_score=${webhookConfig.min_score_threshold}&enabled=${webhookConfig.enabled === 1 || webhookConfig.enabled === true ? 'true' : 'false'}`;
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        setWebhookSuccess(true);
        setTimeout(() => setWebhookSuccess(false), 3000);
      } else {
        alert("Failed to save webhook configuration");
      }
    } catch (err) {
      alert("Error saving webhook: " + err.message);
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleSaveRetention = async (e) => {
    e.preventDefault();
    setSavingRetention(true);
    setRetentionSuccess(false);
    try {
      const url = `${API_BASE_URL}/api/retention/config?enabled=${retentionConfig.enabled ? 'true' : 'false'}&max_case_age_days=${retentionConfig.max_case_age_days}&mask_pii_in_storage=${retentionConfig.mask_pii_in_storage ? 'true' : 'false'}&mask_pii_in_reports=${retentionConfig.mask_pii_in_reports ? 'true' : 'false'}`;
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        setRetentionSuccess(true);
        setTimeout(() => setRetentionSuccess(false), 3000);
      } else {
        alert("Failed to save retention policy");
      }
    } catch (err) {
      alert("Error saving retention: " + err.message);
    } finally {
      setSavingRetention(false);
    }
  };

  const handleRunPurge = async () => {
    if (!window.confirm("Are you sure you want to run retention purge now? Old cases beyond the threshold will be permanently deleted and PII masked.")) {
      return;
    }
    setPurging(true);
    setPurgeResult(null);
    try {
      const url = `${API_BASE_URL}/api/retention/purge?max_age_days=${retentionConfig.max_case_age_days}&mask_pii=${retentionConfig.mask_pii_in_storage ? 'true' : 'false'}`;
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPurgeResult(data);
        fetchHistory();
      } else {
        alert("Failed to execute retention purge");
      }
    } catch (err) {
      alert("Error executing purge: " + err.message);
    } finally {
      setPurging(false);
    }
  };

  const filteredCases = cases.filter(c => 
    c.from_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.campaign_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAlerts = alerts.filter(a =>
    a.alert_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.evidence_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.primary_threat?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="cyber-panel rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-md">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Case Management, Campaigns & SOC Alerts
            </h2>
            <p className="text-xs text-slate-400">Searchable historical investigations, threat clusters, SIEM alerts, and GDPR compliance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setSelectedTab('campaigns')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${selectedTab === 'campaigns' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Campaign Clusters ({campaigns.length})
            </button>
            <button
              onClick={() => setSelectedTab('cases')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${selectedTab === 'cases' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Incident Log ({cases.length})
            </button>
            <button
              onClick={() => setSelectedTab('alerts')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${selectedTab === 'alerts' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Bell className="w-3.5 h-3.5" />
              SOC Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setSelectedTab('retention')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${selectedTab === 'retention' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Shield className="w-3.5 h-3.5" />
              GDPR Retention
            </button>
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors cursor-pointer"
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
              <div 
                key={camp.campaign_id} 
                onClick={() => {
                  setSearchQuery(camp.campaign_id);
                  setSelectedTab('cases');
                }}
                className="bg-slate-900/50 border border-slate-700/70 rounded-xl p-4 space-y-2.5 hover:border-indigo-500/60 hover:bg-slate-850/80 transition-all cursor-pointer group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 group-hover:border-indigo-400">
                    {camp.campaign_id}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                    {camp.case_count} incident(s) &rarr;
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
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
                  <span>Last Seen: {camp.last_seen?.replace('T', ' ').substring(0, 19) || 'Just now'}</span>
                  <span className="text-indigo-400 text-[10px] font-sans font-semibold">Click to drill-down</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Incident Cases Tab */}
      {selectedTab === 'cases' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <input
              type="text"
              placeholder="Search cases by sender, subject, or campaign ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
            
            <button
              onClick={() => {
                if (filteredCases.length === 0) return;
                const headers = ["Evidence ID", "From", "Subject", "Threat", "Score", "Campaign", "Timestamp"];
                const rows = filteredCases.map(c => [
                  `"${c.evidence_id || ''}"`,
                  `"${(c.from_address || '').replace(/"/g, '""')}"`,
                  `"${(c.subject || '').replace(/"/g, '""')}"`,
                  `"${c.primary_threat || ''}"`,
                  c.fraud_score || 0,
                  `"${c.campaign_id || ''}"`,
                  `"${c.timestamp_utc || ''}"`
                ]);
                const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `forensic_cases_export_${new Date().toISOString().substring(0,10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              disabled={filteredCases.length === 0}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-600 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
              title="Export Cases to CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Export CSV ({filteredCases.length})
            </button>
          </div>

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
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 bg-slate-800/40 font-mono">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500 italic font-sans">
                      No matching cases found.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => (
                    <tr 
                      key={c.case_id} 
                      onClick={() => setSelectedCase(c)}
                      className="hover:bg-slate-750 cursor-pointer transition-colors"
                    >
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
                      <td className="px-3 py-2 text-right">
                        <span className="text-indigo-400 text-[11px] hover:underline flex items-center justify-end gap-1 font-sans">
                          <Eye className="w-3.5 h-3.5" /> View
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Historical Case Details Modal */}
          {selectedCase && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-xs">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
                      <FolderArchive className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono">{selectedCase.evidence_id}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Case ID: {selectedCase.case_id}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCase(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-4 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 space-y-1">
                      <span className="text-slate-400 block text-[10px]">FRAUD SCORE</span>
                      <span className={`text-lg font-bold ${selectedCase.fraud_score > 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {selectedCase.fraud_score} / 100
                      </span>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 space-y-1">
                      <span className="text-slate-400 block text-[10px]">CAMPAIGN CLUSTER</span>
                      <span className="text-indigo-300 font-bold text-sm truncate block">{selectedCase.campaign_id || 'Isolated'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">SENDER (FROM)</span>
                      <span className="text-slate-200 break-all">{selectedCase.from_address}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700/60">
                      <span className="text-slate-400 block text-[10px]">SUBJECT</span>
                      <span className="text-slate-200 font-sans font-semibold break-all">{selectedCase.subject}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700/60">
                      <span className="text-slate-400 block text-[10px]">PRIMARY THREAT CLASSIFICATION</span>
                      <span className="text-amber-300 capitalize font-sans">{selectedCase.primary_threat?.replace('_', ' ')}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700/60">
                      <span className="text-slate-400 block text-[10px]">INGESTION TIMESTAMP</span>
                      <span className="text-slate-400 text-[11px]">{selectedCase.timestamp_utc?.replace('T', ' ')}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* SOC Real-Time Alerts & Webhook Tab */}
      {selectedTab === 'alerts' && (
        <div className="space-y-4">
          
          {/* Stats Header Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 flex items-center justify-between">
              <span className="text-slate-400">Total Logged Alerts</span>
              <span className="text-base font-bold font-mono text-white">{alertStats.total_alerts || 0}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 flex items-center justify-between">
              <span className="text-red-400 font-semibold">High-Risk Critical Alerts</span>
              <span className="text-base font-bold font-mono text-red-400">{alertStats.high_risk_alerts || 0}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 flex items-center justify-between">
              <span className="text-emerald-400 font-semibold">Webhooks Dispatched</span>
              <span className="text-base font-bold font-mono text-emerald-400">{alertStats.webhook_delivered || 0}</span>
            </div>
          </div>

          {/* Webhook Configuration Card */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/60 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Webhook className="w-4 h-4 text-purple-400" />
                Automated SIEM / Webhook Dispatcher
              </span>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${webhookConfig.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                {webhookConfig.enabled ? 'DISPATCH ACTIVE' : 'DISPATCH DISABLED'}
              </span>
            </div>

            <form onSubmit={handleSaveWebhook} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6 space-y-1">
                <label className="text-slate-400 block text-[11px]">Webhook Endpoint URL (Slack / Teams / Splunk / SIEM):</label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={webhookConfig.webhook_url || ''}
                  onChange={(e) => setWebhookConfig({ ...webhookConfig, webhook_url: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-slate-400 block text-[11px]">Min Trigger Score (0-100):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={webhookConfig.min_score_threshold || 70}
                  onChange={(e) => setWebhookConfig({ ...webhookConfig, min_score_threshold: parseInt(e.target.value) || 70 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={webhookConfig.enabled === 1 || webhookConfig.enabled === true}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, enabled: e.target.checked ? 1 : 0 })}
                    className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0"
                  />
                  <span>Enable</span>
                </label>

                <button
                  type="submit"
                  disabled={savingWebhook}
                  className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingWebhook ? "Saving..." : "Save"}
                </button>
              </div>
            </form>

            {webhookSuccess && (
              <div className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Webhook configuration saved successfully!
              </div>
            )}
          </div>

          {/* Alerts Table */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Filter alerts by Alert ID, Evidence ID, or Threat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />

            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="min-w-full divide-y divide-slate-700 text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">Alert ID</th>
                    <th className="px-3 py-2.5">Evidence ID</th>
                    <th className="px-3 py-2.5">Threat Classification</th>
                    <th className="px-3 py-2.5">Fraud Score</th>
                    <th className="px-3 py-2.5">Webhook Status</th>
                    <th className="px-3 py-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 bg-slate-800/40 font-mono">
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-500 italic font-sans">
                        No high-risk alerts recorded. Alerts trigger automatically when an email score exceeds {webhookConfig.min_score_threshold || 70}.
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((a) => (
                      <tr key={a.alert_id} className="hover:bg-slate-750">
                        <td className="px-3 py-2 text-red-400 font-bold">{a.alert_id}</td>
                        <td className="px-3 py-2 text-indigo-300">{a.evidence_id}</td>
                        <td className="px-3 py-2 capitalize font-sans">{a.primary_threat?.replace('_', ' ')}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded font-bold ${a.fraud_score >= 70 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {a.fraud_score} / 100
                          </span>
                        </td>
                        <td className="px-3 py-2 font-sans">
                          {a.webhook_sent ? (
                            <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Sent
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Unsent / Disabled</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-400 text-[10px]">
                          {a.timestamp_utc?.replace('T', ' ').substring(0, 19)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* GDPR Data Retention & Privacy Tab */}
      {selectedTab === 'retention' && (
        <div className="space-y-4 text-xs">
          
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <Shield className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    GDPR Data Retention & PII Redaction Policy
                  </h3>
                  <p className="text-[11px] text-slate-400">Automated case expiry and cryptographic masking of sensitive user identifiers</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${retentionConfig.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                {retentionConfig.enabled ? 'POLICY ACTIVE' : 'POLICY INACTIVE'}
              </span>
            </div>

            <form onSubmit={handleSaveRetention} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Max Retention Days */}
                <div className="space-y-1.5 bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                  <label className="text-slate-300 font-semibold block">Maximum Case Retention Window:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={retentionConfig.max_case_age_days}
                      onChange={(e) => setRetentionConfig({ ...retentionConfig, max_case_age_days: parseInt(e.target.value) || 90 })}
                      className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-slate-200 w-24 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-slate-400">Days (Purge cases older than this)</span>
                  </div>
                </div>

                {/* Policy Enabled Toggle */}
                <div className="space-y-1.5 bg-slate-800/70 p-3 rounded-lg border border-slate-700 flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-semibold">
                    <input
                      type="checkbox"
                      checked={Boolean(retentionConfig.enabled)}
                      onChange={(e) => setRetentionConfig({ ...retentionConfig, enabled: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span>Enforce Automated Retention Schedule</span>
                  </label>
                  <p className="text-[11px] text-slate-400 ml-6">Automatically cleans cases during daily system maintenance</p>
                </div>

              </div>

              {/* PII Masking Toggles */}
              <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700 space-y-2">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  PII Data Redaction & Cryptographic Masking Rules:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(retentionConfig.mask_pii_in_storage)}
                      onChange={(e) => setRetentionConfig({ ...retentionConfig, mask_pii_in_storage: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span>Mask PII in SQLite / Case Database (Storage)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(retentionConfig.mask_pii_in_reports)}
                      onChange={(e) => setRetentionConfig({ ...retentionConfig, mask_pii_in_reports: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span>Mask PII in Legal & Exported Forensic Reports</span>
                  </label>
                </div>
              </div>

              {/* Save & Run Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingRetention}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savingRetention ? "Saving Policy..." : "Save Retention Policy"}
                </button>

                <button
                  type="button"
                  onClick={handleRunPurge}
                  disabled={purging}
                  className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  {purging ? "Purging Cases..." : "Run Retention Purge Now"}
                </button>
              </div>
            </form>

            {retentionSuccess && (
              <div className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Retention policy updated successfully!
              </div>
            )}

            {purgeResult && (
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-slate-300 font-mono text-[11px] space-y-1">
                <div className="text-emerald-400 font-bold font-sans flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Purge Cycle Executed:
                </div>
                <div>Purged Expired Cases: <strong>{purgeResult.purged_cases}</strong></div>
                <div>Masked Retained Cases: <strong>{purgeResult.masked_cases}</strong></div>
                <div className="text-slate-500">Cutoff Date: {purgeResult.cutoff_date}</div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}


