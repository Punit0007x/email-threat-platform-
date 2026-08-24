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
    <div className="panel-chassis p-6 sm:p-8 space-y-6 relative overflow-hidden">
      
      {/* Corner Screws */}
      <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f8fafc] pb-4 px-2">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-[#ffffff] text-[#0ea5e9] rounded-2xl shadow-[var(--shadow-card)] border border-white/70">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
              Case Management, Campaigns & SOC Alerts
            </h2>
            <p className="text-xs text-[#64748b]">Searchable historical investigations, threat clusters, SIEM alerts, and GDPR compliance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1.5 slot-recessed rounded-xl font-mono text-xs">
            <button
              onClick={() => setSelectedTab('campaigns')}
              className={`key-switch px-3 py-1.5 text-xs font-bold ${selectedTab === 'campaigns' ? 'active' : ''}`}
            >
              Campaign Clusters ({campaigns.length})
            </button>
            <button
              onClick={() => setSelectedTab('cases')}
              className={`key-switch px-3 py-1.5 text-xs font-bold ${selectedTab === 'cases' ? 'active' : ''}`}
            >
              Incident Log ({cases.length})
            </button>
            <button
              onClick={() => setSelectedTab('alerts')}
              className={`key-switch px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${selectedTab === 'alerts' ? 'active text-[#ef4444]' : ''}`}
            >
              <Bell className="w-3.5 h-3.5" />
              SOC Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setSelectedTab('retention')}
              className={`key-switch px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${selectedTab === 'retention' ? 'active text-[#10b981]' : ''}`}
            >
              <Shield className="w-3.5 h-3.5" />
              GDPR Retention
            </button>
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="btn-tactile-secondary p-2 rounded-xl"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-[#64748b] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Campaign Explorer Tab */}
      {selectedTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-[#94a3b8] text-xs italic slot-recessed">
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
                className="slot-recessed p-5 space-y-3 hover:scale-[1.01] transition-all cursor-pointer group shadow-sm bg-[#f8fafc]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#7048e8] bg-[#7048e8]/15 px-2.5 py-0.5 rounded border border-[#7048e8]/30">
                    {camp.campaign_id}
                  </span>
                  <span className="text-xs font-bold text-[#64748b] flex items-center gap-1 group-hover:text-[#7048e8] transition-colors font-mono">
                    {camp.case_count} incident(s) &rarr;
                  </span>
                </div>
                <div className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  Avg Fraud Score: 
                  <span className={camp.avg_score > 70 ? 'text-[#d63031] font-mono' : (camp.avg_score > 30 ? 'text-[#b45309] font-mono' : 'text-[#047857] font-mono')}>
                    {camp.avg_score} / 100
                  </span>
                </div>
                <div className="text-xs text-[#64748b]">
                  Targeted Domains: <span className="font-mono font-bold text-[#0f172a]">{camp.domains.join(', ') || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#64748b] pt-2 border-t border-[#e2e8f0]/50">
                  <span className="font-mono">Last Seen: {camp.last_seen?.replace('T', ' ').substring(0, 19) || 'Just now'}</span>
                  <span className="text-[#7048e8] text-[10px] font-sans font-bold">Click to drill-down</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Incident Cases Tab */}
      {selectedTab === 'cases' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <input
              type="text"
              placeholder="Search cases by sender, subject, or campaign ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:flex-1 slot-recessed px-4 py-2.5 text-xs text-[#0f172a] focus:outline-none font-mono rounded-xl"
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
              className="btn-tactile-secondary flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 flex-shrink-0"
              title="Export Cases to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#0ea5e9]" />
              Export CSV ({filteredCases.length})
            </button>
          </div>

          <div className="slot-recessed p-1 rounded-2xl overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e2e8f0]/50 text-xs text-left">
              <thead className="bg-[#ffffff] text-[#64748b] font-bold font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-3">Evidence ID</th>
                  <th className="px-3.5 py-3">From</th>
                  <th className="px-3.5 py-3">Subject</th>
                  <th className="px-3.5 py-3">Threat</th>
                  <th className="px-3.5 py-3">Score</th>
                  <th className="px-3.5 py-3">Campaign</th>
                  <th className="px-3.5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]/40 bg-[#f8fafc] font-mono">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-[#94a3b8] italic font-sans">
                      No matching cases found.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => (
                    <tr 
                      key={c.case_id} 
                      onClick={() => setSelectedCase(c)}
                      className="hover:bg-[#ffffff]/60 cursor-pointer transition-colors"
                    >
                      <td className="px-3.5 py-2.5 text-[#7048e8] font-bold">{c.evidence_id}</td>
                      <td className="px-3.5 py-2.5 text-[#0f172a] truncate max-w-[150px] font-medium">{c.from_address}</td>
                      <td className="px-3.5 py-2.5 text-[#0f172a] truncate max-w-[200px] font-sans font-medium">{c.subject}</td>
                      <td className="px-3.5 py-2.5 capitalize font-sans text-[#64748b]">{c.primary_threat?.replace('_', ' ')}</td>
                      <td className="px-3.5 py-2.5">
                        <span className={`px-2 py-0.5 rounded font-bold ${c.fraud_score > 70 ? 'bg-[#ef4444]/15 text-[#d63031]' : 'bg-[#10b981]/15 text-[#047857]'}`}>
                          {c.fraud_score}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-[#64748b] text-[10px]">{c.campaign_id}</td>
                      <td className="px-3.5 py-2.5 text-right">
                        <span className="text-[#0ea5e9] text-[11px] font-bold hover:underline flex items-center justify-end gap-1 font-sans">
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="panel-chassis w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-xs border border-[#e2e8f0]">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#f8fafc] bg-[#ffffff]">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-[#ffffff] text-[#7048e8] rounded-xl shadow-[var(--shadow-card)] border border-white/70">
                      <FolderArchive className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0f172a] font-mono">{selectedCase.evidence_id}</h3>
                      <p className="text-[10px] text-[#64748b] font-mono">Case ID: {selectedCase.case_id}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCase(null)}
                    className="p-1.5 text-[#64748b] hover:text-[#0f172a] rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-4 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="slot-recessed p-3.5 rounded-xl space-y-1">
                      <span className="text-[#64748b] font-bold block text-[10px] uppercase">FRAUD SCORE</span>
                      <span className={`text-xl font-bold ${selectedCase.fraud_score > 70 ? 'text-[#d63031]' : 'text-[#047857]'}`}>
                        {selectedCase.fraud_score} / 100
                      </span>
                    </div>
                    <div className="slot-recessed p-3.5 rounded-xl space-y-1">
                      <span className="text-[#64748b] font-bold block text-[10px] uppercase">CAMPAIGN CLUSTER</span>
                      <span className="text-[#7048e8] font-bold text-sm truncate block">{selectedCase.campaign_id || 'Isolated'}</span>
                    </div>
                  </div>

                  <div className="slot-recessed p-4 space-y-2.5 font-mono">
                    <div>
                      <span className="text-[#64748b] font-bold block text-[10px] uppercase">SENDER (FROM)</span>
                      <span className="text-[#0f172a] font-bold break-all">{selectedCase.from_address}</span>
                    </div>
                    <div className="pt-2 border-t border-[#e2e8f0]/50">
                      <span className="text-[#64748b] font-bold block text-[10px] uppercase">SUBJECT</span>
                      <span className="text-[#0f172a] font-sans font-bold break-all">{selectedCase.subject}</span>
                    </div>
                    <div className="pt-2 border-t border-[#e2e8f0]/50">
                      <span className="text-[#64748b] font-bold block text-[10px] uppercase">PRIMARY THREAT CLASSIFICATION</span>
                      <span className="text-[#b45309] font-bold capitalize font-sans">{selectedCase.primary_threat?.replace('_', ' ')}</span>
                    </div>
                    <div className="pt-2 border-t border-[#e2e8f0]/50">
                      <span className="text-[#64748b] font-bold block text-[10px] uppercase">INGESTION TIMESTAMP</span>
                      <span className="text-[#64748b] text-[11px] font-medium">{selectedCase.timestamp_utc?.replace('T', ' ')}</span>
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
            <div className="slot-recessed p-3.5 flex items-center justify-between">
              <span className="text-[#64748b] font-bold font-mono uppercase text-[10px]">Total Logged Alerts</span>
              <span className="text-base font-bold font-mono text-[#0f172a]">{alertStats.total_alerts || 0}</span>
            </div>
            <div className="slot-recessed p-3.5 flex items-center justify-between">
              <span className="text-[#d63031] font-bold font-mono uppercase text-[10px]">High-Risk Critical Alerts</span>
              <span className="text-base font-bold font-mono text-[#ef4444]">{alertStats.high_risk_alerts || 0}</span>
            </div>
            <div className="slot-recessed p-3.5 flex items-center justify-between">
              <span className="text-[#047857] font-bold font-mono uppercase text-[10px]">Webhooks Dispatched</span>
              <span className="text-base font-bold font-mono text-[#10b981]">{alertStats.webhook_delivered || 0}</span>
            </div>
          </div>

          {/* Webhook Configuration Card */}
          <div className="slot-recessed p-5 space-y-3 text-xs bg-[#f8fafc]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0f172a] uppercase tracking-wider text-[11px] flex items-center gap-1.5 font-mono">
                <Webhook className="w-4 h-4 text-[#7048e8]" />
                Automated SIEM / Webhook Dispatcher
              </span>
              <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${webhookConfig.enabled ? 'bg-[#10b981]/15 text-[#047857] border border-[#10b981]/30' : 'bg-[#ffffff] text-[#64748b] border border-[#e2e8f0]'}`}>
                {webhookConfig.enabled ? 'DISPATCH ACTIVE' : 'DISPATCH DISABLED'}
              </span>
            </div>

            <form onSubmit={handleSaveWebhook} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6 space-y-1">
                <label className="text-[#64748b] font-bold block text-[11px] font-mono">Webhook Endpoint URL (Slack / Teams / Splunk / SIEM):</label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={webhookConfig.webhook_url || ''}
                  onChange={(e) => setWebhookConfig({ ...webhookConfig, webhook_url: e.target.value })}
                  className="w-full bg-[#ffffff] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[#64748b] font-bold block text-[11px] font-mono">Min Trigger Score (0-100):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={webhookConfig.min_score_threshold || 70}
                  onChange={(e) => setWebhookConfig({ ...webhookConfig, min_score_threshold: parseInt(e.target.value) || 70 })}
                  className="w-full bg-[#ffffff] border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-[#0f172a] font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={webhookConfig.enabled === 1 || webhookConfig.enabled === true}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, enabled: e.target.checked ? 1 : 0 })}
                    className="rounded border-[#e2e8f0] text-[#7048e8] focus:ring-0"
                  />
                  <span>Enable</span>
                </label>

                <button
                  type="submit"
                  disabled={savingWebhook}
                  className="btn-tactile-primary flex items-center gap-1 text-xs font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingWebhook ? "Saving..." : "Save"}
                </button>
              </div>
            </form>

            {webhookSuccess && (
              <div className="text-[#047857] flex items-center gap-1 text-[11px] font-bold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
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
              className="w-full slot-recessed px-4 py-2.5 text-xs text-[#0f172a] focus:outline-none font-mono rounded-xl"
            />

            <div className="slot-recessed p-1 rounded-2xl overflow-x-auto">
              <table className="min-w-full divide-y divide-[#e2e8f0]/50 text-xs text-left">
                <thead className="bg-[#ffffff] text-[#64748b] font-bold font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-3">Alert ID</th>
                    <th className="px-3.5 py-3">Evidence ID</th>
                    <th className="px-3.5 py-3">Threat Classification</th>
                    <th className="px-3.5 py-3">Fraud Score</th>
                    <th className="px-3.5 py-3">Webhook Status</th>
                    <th className="px-3.5 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]/40 bg-[#f8fafc] font-mono">
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-[#94a3b8] italic font-sans">
                        No high-risk alerts recorded. Alerts trigger automatically when an email score exceeds {webhookConfig.min_score_threshold || 70}.
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((a) => (
                      <tr key={a.alert_id} className="hover:bg-[#ffffff]/60">
                        <td className="px-3.5 py-2.5 text-[#d63031] font-bold">{a.alert_id}</td>
                        <td className="px-3.5 py-2.5 text-[#7048e8] font-medium">{a.evidence_id}</td>
                        <td className="px-3.5 py-2.5 capitalize font-sans text-[#0f172a]">{a.primary_threat?.replace('_', ' ')}</td>
                        <td className="px-3.5 py-2.5">
                          <span className={`px-2 py-0.5 rounded font-bold ${a.fraud_score >= 70 ? 'bg-[#ef4444]/15 text-[#d63031]' : 'bg-[#f59e0b]/15 text-[#b45309]'}`}>
                            {a.fraud_score} / 100
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-sans">
                          {a.webhook_sent ? (
                            <span className="text-[#047857] text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Sent
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] text-[11px]">Unsent / Disabled</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-[#64748b] text-[10px]">
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
          
          <div className="slot-recessed p-5 space-y-4 bg-[#f8fafc]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#ffffff] text-[#047857] rounded-xl shadow-[var(--shadow-card)] border border-white/70">
                  <Shield className="w-4 h-4 text-[#059669]" />
                </span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f172a] font-mono">
                    GDPR Data Retention & PII Redaction Policy
                  </h3>
                  <p className="text-[11px] text-[#64748b]">Automated case expiry and cryptographic masking of sensitive user identifiers</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${retentionConfig.enabled ? 'bg-[#10b981]/15 text-[#047857] border border-[#10b981]/30' : 'bg-[#ffffff] text-[#64748b] border border-[#e2e8f0]'}`}>
                {retentionConfig.enabled ? 'POLICY ACTIVE' : 'POLICY INACTIVE'}
              </span>
            </div>

            <form onSubmit={handleSaveRetention} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Max Retention Days */}
                <div className="space-y-1.5 bg-[#ffffff] p-3.5 rounded-xl border border-[#e2e8f0]">
                  <label className="text-[#0f172a] font-bold block font-mono">Maximum Case Retention Window:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={retentionConfig.max_case_age_days}
                      onChange={(e) => setRetentionConfig({ ...retentionConfig, max_case_age_days: parseInt(e.target.value) || 90 })}
                      className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-1 text-[#0f172a] w-24 font-mono font-bold focus:outline-none"
                    />
                    <span className="text-[#64748b] font-medium">Days (Purge cases older than this)</span>
                  </div>
                </div>

                {/* Policy Enabled Toggle */}
                <div className="space-y-1.5 bg-[#ffffff] p-3.5 rounded-xl border border-[#e2e8f0] flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer text-[#0f172a] font-bold">
                    <input
                      type="checkbox"
                      checked={Boolean(retentionConfig.enabled)}
                      onChange={(e) => setRetentionConfig({ ...retentionConfig, enabled: e.target.checked })}
                      className="rounded border-[#e2e8f0] text-[#10b981] focus:ring-0"
                    />
                    <span>Enforce Automated Retention Schedule</span>
                  </label>
                  <p className="text-[11px] text-[#64748b] ml-6 font-medium">Automatically cleans cases during daily system maintenance</p>
                </div>

              </div>

              {/* PII Masking Toggles */}
              <div className="bg-[#ffffff] p-3.5 rounded-xl border border-[#e2e8f0] space-y-2">
                <span className="text-[#0f172a] font-bold flex items-center gap-1.5 font-mono">
                  <Lock className="w-3.5 h-3.5 text-[#7048e8]" />
                  PII Data Redaction & Cryptographic Masking Rules:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[#0f172a] bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0] font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(retentionConfig.mask_pii_in_storage)}
                      onChange={(e) => setRetentionConfig({ ...retentionConfig, mask_pii_in_storage: e.target.checked })}
                      className="rounded border-[#e2e8f0] text-[#10b981] focus:ring-0"
                    />
                    <span>Mask PII in SQLite / Case Database (Storage)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[#0f172a] bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0] font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(retentionConfig.mask_pii_in_reports)}
                      onChange={(e) => setRetentionConfig({ ...retentionConfig, mask_pii_in_reports: e.target.checked })}
                      className="rounded border-[#e2e8f0] text-[#10b981] focus:ring-0"
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
                  className="btn-tactile-primary flex items-center gap-1.5 text-xs font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingRetention ? "Saving Policy..." : "Save Retention Policy"}
                </button>

                <button
                  type="button"
                  onClick={handleRunPurge}
                  disabled={purging}
                  className="btn-tactile-secondary flex items-center gap-1.5 text-xs font-bold text-[#d63031]"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#ef4444]" />
                  {purging ? "Purging Cases..." : "Run Retention Purge Now"}
                </button>
              </div>
            </form>

            {retentionSuccess && (
              <div className="text-[#047857] flex items-center gap-1 text-[11px] font-bold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                Retention policy updated successfully!
              </div>
            )}

            {purgeResult && (
              <div className="bg-[#ffffff] p-3.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] font-mono text-[11px] space-y-1">
                <div className="text-[#047857] font-bold font-sans flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" /> Purge Cycle Executed:
                </div>
                <div>Purged Expired Cases: <strong>{purgeResult.purged_cases}</strong></div>
                <div>Masked Retained Cases: <strong>{purgeResult.masked_cases}</strong></div>
                <div className="text-[#64748b]">Cutoff Date: {purgeResult.cutoff_date}</div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}


