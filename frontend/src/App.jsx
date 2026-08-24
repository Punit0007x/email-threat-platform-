import { useState } from 'react';
import { 
  Upload, 
  AlertCircle, 
  FileText, 
  BookOpen, 
  Search, 
  ShieldAlert, 
  Cpu, 
  Zap, 
  Terminal, 
  Sparkles,
  Compass,
  Activity,
  Brain,
  Scan,
  Network,
  Mail,
  ShieldCheck,
  Eye,
  Radio,
  LayoutGrid,
  Columns2,
  Layers,
  CheckCircle2,
  Info
} from 'lucide-react';
import { analyzeEmail } from './services/analysisService';

import HeaderPanel from './components/HeaderPanel';
import AuthPanel from './components/AuthPanel';
import FraudScorePanel from './components/FraudScorePanel';
import AIMLThreatPanel from './components/AIMLThreatPanel';
import DeepOSINTPanel from './components/DeepOSINTPanel';
import MapPanel from './components/MapPanel';
import CustodyReportPanel from './components/CustodyReportPanel';
import GraphAttributionPanel from './components/GraphAttributionPanel';
import CaseHistoryPanel from './components/CaseHistoryPanel';
import PlaybookModal from './components/PlaybookModal';
import IOCSearchModal from './components/IOCSearchModal';
import CyberScanOverlay from './components/CyberScanOverlay';
import EmailBodyDissector from './components/EmailBodyDissector';
import DashboardView from './components/DashboardView';

const DEMO_EMAILS = [
  {
    id: "sample",
    label: "PayPal Brand Phishing",
    badge: "CRITICAL SPOOF",
    color: "bg-[#e0e5ec] text-[#2d3436] hover:text-[#ff4757]",
    badgeColor: "bg-[#ff4757]/15 text-[#d63031] border-[#ff4757]/30",
    led: "led-node-red",
    filename: "sample.eml",
    content: `From: Security <security@paypa1.com>
To: victim@company.com
Subject: URGENT: Your account has been suspended!
Date: Wed, 22 Aug 2026 09:00:00 +0000
Message-ID: <1234567890@example.com>
Reply-To: sender-reply@example.com
Return-Path: <bounce@attacker-vps.com>
Received: from mail.example.com (mail.example.com [192.168.1.100])
	by mx.company.com with ESMTP id 12345;
	Wed, 22 Aug 2026 09:00:10 +0000
Authentication-Results: mx.company.com;
	spf=fail smtp.mailfrom=bounce@attacker-vps.com;
	dkim=none header.i=@paypa1.com;
	dmarc=fail (p=reject sp=reject dis=none) header.from=paypa1.com
Content-Type: multipart/alternative; boundary="BOUNDARY"

--BOUNDARY
Content-Type: text/plain; charset="utf-8"

Your account will be closed. Act now.
Please verify immediately at http://bit.ly/fake-link

--BOUNDARY
Content-Type: text/html; charset="utf-8"

<html>
<body>
<p>Your account will be closed. Act now.</p>
<p>Please <a href="http://bit.ly/fake-link">verify immediately</a></p>
<p>Visit <a href="http://attacker.com/login">https://paypal.com/login</a></p>
</body>
</html>
--BOUNDARY--`
  },
  {
    id: "bec",
    label: "BEC Executive Wire Fraud",
    badge: "VIP IMPERSONATION",
    color: "bg-[#e0e5ec] text-[#2d3436] hover:text-[#7048e8]",
    badgeColor: "bg-[#7048e8]/15 text-[#5f3dc4] border-[#7048e8]/30",
    led: "led-node-amber",
    filename: "bec_ceo_fraud.eml",
    content: `From: "Tim Cook (CEO)" <ceo.apple.exec@gmail.com>
To: payroll-dept@company.com
Reply-To: executive-finance-secure@protonmail.com
Subject: URGENT: Update my direct deposit information for upcoming payroll
Date: Thu, 20 Aug 2026 09:30:00 +0000
Message-ID: <bec-attack-sample-999@apple.com>

Hi Payroll Team,

I am currently in an urgent offsite board meeting and cannot take calls.
Please update my bank account details for my upcoming direct deposit paycheck immediately.
Attached are the new routing numbers. Do not process via the old account.

Please keep this matter confidential between us.

Thanks,
Tim Cook
Chief Executive Officer`
  },
  {
    id: "multi_hop",
    label: "Multi-Hop Relay Anomaly",
    badge: "RELAY DEVIATION",
    color: "bg-[#e0e5ec] text-[#2d3436] hover:text-[#d97706]",
    badgeColor: "bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/30",
    led: "led-node-amber",
    filename: "multi_hop.eml",
    content: `From: hacker@evil.com
To: victim@company.com
Subject: You won!
Received: from mail-wr1-f49.google.com (mail-wr1-f49.google.com [209.85.221.49]) by mx.company.com with ESMTP id 123; Wed, 22 Aug 2026 09:05:00 +0000
Received: from attacker-vps.xyz (attacker-vps.xyz [89.123.45.67]) by mail.google.com with ESMTP id 456; Wed, 22 Aug 2026 09:04:55 +0000
Received: from localhost (localhost [127.0.0.1]) by attacker-vps.xyz; Wed, 22 Aug 2026 09:04:00 +0000

Click here.`
  },
  {
    id: "clean",
    label: "Clean GitHub Notice",
    badge: "BENIGN PASS",
    color: "bg-[#e0e5ec] text-[#2d3436] hover:text-[#059669]",
    badgeColor: "bg-[#10b981]/15 text-[#047857] border-[#10b981]/30",
    led: "led-node-green",
    filename: "clean.eml",
    content: `From: support@github.com
To: user@example.com
Subject: Your GitHub repository was starred
Date: Wed, 22 Aug 2026 09:00:00 +0000
Message-ID: <clean123@github.com>
Reply-To: noreply@github.com
Return-Path: <bounce@github.com>
Received: from out-1.github.com (out-1.github.com [192.30.252.1])
	by mx.company.com with ESMTP id 12345;
	Wed, 22 Aug 2026 09:00:10 +0000
Authentication-Results: mx.company.com;
	spf=pass (mx.company.com: domain of bounce@github.com designates 192.30.252.1 as permitted sender) smtp.mailfrom=bounce@github.com;
	dkim=pass header.i=@github.com;
	dmarc=pass (p=reject sp=reject dis=none) header.from=github.com
Content-Type: text/plain; charset="utf-8"

Hi there,
Someone just starred your repository!
Check it out at https://github.com/punit007x/my-repo`
  }
];

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [showIOCSearch, setShowIOCSearch] = useState(false);
  const [iocQuery, setIocQuery] = useState('');
  const [activeView, setActiveView] = useState('summary'); // 'summary' | 'content' | 'sender' | 'network' | 'report'

  const handleLookupIOC = (ioc) => {
    setIocQuery(ioc);
    setShowIOCSearch(true);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.name.endsWith('.eml') || selectedFile.type === 'message/rfc822' || selectedFile.size > 0)) {
      setFile(selectedFile);
      setError(null);
      handleAnalyze(selectedFile);
    } else if (selectedFile) {
      setFile(null);
      setError("Please select a valid .eml file.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      handleAnalyze(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAnalyze = async (overrideFile = null) => {
    const targetFile = overrideFile || file;
    if (!targetFile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await analyzeEmail(targetFile);
      setResults(data);
      setActiveView('summary');
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err.message || "Failed to analyze email. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = (demo) => {
    const blob = new Blob([demo.content], { type: "message/rfc822" });
    const demoFile = new File([blob], demo.filename, { type: "message/rfc822" });
    setFile(demoFile);
    handleAnalyze(demoFile);
  };

  const threatScore = results?.fraud_assessment?.score ?? 0;
  const isHighRisk = threatScore > 70;
  const isMediumRisk = threatScore > 30 && threatScore <= 70;

  return (
    <div className="min-h-screen chassis-bg p-4 sm:p-8 text-[#2d3436] font-sans selection:bg-[#ff4757] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-7">
        {/* Header Ribbon */}
        <header className="panel-chassis px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-semibold text-[#1e293b]">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>System Online</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-6 py-2">
          <div className="space-y-2 text-center lg:text-left max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5" />
              <span>Email Analyzer</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1e293b]">
              Email <span className="text-blue-600">Analysis Tool</span>
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
              Upload an email file (.eml) to scan for potential threats, phishing attempts, and suspicious links.
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setShowIOCSearch(true)}
              className="btn-tactile-secondary"
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>Search IOCs</span>
            </button>

            <button
              onClick={() => setShowPlaybook(true)}
              className="btn-tactile-secondary"
            >
              <BookOpen className="w-4 h-4 text-gray-600" />
              <span>Help & Docs</span>
            </button>
          </div>
        </section>

        {/* Upload Section */}
        <section className="panel-chassis p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">
                Upload Email for Analysis
              </h2>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6">
            
            {/* Dropzone */}
            <label 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex flex-col items-center justify-center w-full max-w-4xl h-44 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl cursor-pointer bg-slate-50 transition-colors group"
            >
              <div className="flex flex-col items-center justify-center pt-3 pb-4 space-y-3">
                <div className="p-3 bg-white text-blue-600 rounded-full shadow-sm group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Drop an <span className="font-semibold text-blue-600">.EML</span> file here or <span className="text-blue-600 hover:underline">browse</span>
                </p>
              </div>
              <input type="file" className="hidden" accept=".eml" onChange={handleFileChange} />
            </label>

            {/* Quick Demo Presets */}
            <div className="w-full max-w-4xl space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-200 pb-2">
                <span className="font-medium text-gray-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  Try a sample email:
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DEMO_EMAILS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => handleLoadDemo(demo)}
                    disabled={loading}
                    className="btn-tactile-secondary p-4 flex flex-col justify-between text-left disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="truncate font-semibold text-gray-800 text-sm">{demo.label}</span>
                    </div>
                    <div className="flex items-center justify-between w-full mt-1">
                      <span className="text-xs text-gray-500 truncate">{demo.filename}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected File Action Bar */}
            {file && (
              <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl w-full max-w-4xl border border-gray-200 animate-in fade-in">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1 truncate">
                  <span className="text-sm font-medium text-gray-800 block truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <button 
                  onClick={() => handleAnalyze()}
                  disabled={loading}
                  className="btn-tactile-primary"
                >
                  {loading ? "Analyzing..." : "Analyze File"}
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-xl w-full max-w-4xl text-sm border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
          </div>
        </section>

        {/* Results Section */}
        {results && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Live Threat Quick Telemetry Strip */}
            <div className="panel-chassis p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className={`p-3.5 rounded-xl font-mono text-2xl font-black slot-recessed ${isHighRisk ? 'text-[#ff4757]' : (isMediumRisk ? 'text-[#d97706]' : 'text-[#059669]')}`}>
                  {threatScore}/100
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono font-bold text-[#4a5568]">// INCIDENT VERDICT:</span>
                    <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-md font-mono ${isHighRisk ? 'bg-[#ff4757]/15 text-[#d63031] border border-[#ff4757]/30' : (isMediumRisk ? 'bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/30' : 'bg-[#10b981]/15 text-[#047857] border border-[#10b981]/30')}`}>
                      {results.fraud_assessment?.risk_level} Risk Level
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#2d3436] truncate max-w-xl mt-0.5 font-sans">
                    {results.subject || "No Subject"}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">

                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="slot-recessed-sm px-3 py-1.5 text-[#4a5568]">
                    ORIGIN: <strong className="text-[#2d3436] font-bold">{results.trace?.best_guess_ip || 'N/A'}</strong>
                  </div>
                  <div className="slot-recessed-sm px-3 py-1.5 text-[#4a5568]">
                    THREAT: <strong className="text-[#ff4757] font-bold">{results.ai_ml_analysis?.classification?.primary_threat?.replace(/_/g, ' ').toUpperCase() || 'CLEAN'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-50 rounded-xl border border-gray-200">
              {[
                { id: 'summary', label: 'Summary & Verdict', icon: Activity },
                { id: 'content', label: 'Email Content', icon: Eye },
                { id: 'sender', label: 'Sender Details', icon: Mail },
                { id: 'network', label: 'Network & Origin', icon: Compass },
                { id: 'report', label: 'Analysis Report', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id)}
                    className={`key-switch flex items-center gap-2 px-4 py-2.5 text-sm font-medium flex-shrink-0 ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeView === 'summary' && (
                <div className="space-y-6 animate-in fade-in duration-250">
                  <FraudScorePanel data={results} />
                  <AIMLThreatPanel data={results} />
                </div>
              )}

              {activeView === 'content' && (
                <div className="space-y-6 animate-in fade-in duration-250">
                  <EmailBodyDissector data={results} onLookupIOC={handleLookupIOC} />
                  <DeepOSINTPanel data={results} />
                </div>
              )}

              {activeView === 'sender' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-250">
                  <HeaderPanel data={results} />
                  <AuthPanel data={results} />
                </div>
              )}

              {activeView === 'network' && (
                <div className="space-y-6 animate-in fade-in duration-250">
                  <GraphAttributionPanel data={results} onLookupIOC={handleLookupIOC} />
                  <MapPanel data={results} />
                </div>
              )}

              {activeView === 'report' && (
                <div className="space-y-6 animate-in fade-in duration-250">
                  <CustodyReportPanel data={results} />
                </div>
              )}
            </div>

          </section>
        )}

        {/* Persistent Tactical Dashboard when no active email is loaded */}
        {!results && (
          <DashboardView />
        )}

        {/* Master Investigation Playbook Modal */}
        <PlaybookModal isOpen={showPlaybook} onClose={() => setShowPlaybook(false)} />

        {/* Global IOC Threat Dossier Modal */}
        <IOCSearchModal 
          isOpen={showIOCSearch} 
          onClose={() => {
            setShowIOCSearch(false);
            setIocQuery('');
          }} 
          initialQuery={iocQuery}
        />

        {/* Threat Scanner Overlay */}
        <CyberScanOverlay isOpen={loading} />
        
      </div>
    </div>
  );
}

export default App;


