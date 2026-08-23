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
  Eye
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
import ThreatWaveform from './components/ThreatWaveform';
import EmailBodyDissector from './components/EmailBodyDissector';

const DEMO_EMAILS = [
  {
    id: "sample",
    label: "PayPal Brand Phishing",
    badge: "CRITICAL SPOOF",
    color: "border-red-500/40 hover:border-red-400 bg-red-950/30 text-red-300 hover:shadow-red-500/20",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
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
    color: "border-purple-500/40 hover:border-purple-400 bg-purple-950/30 text-purple-300 hover:shadow-purple-500/20",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
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
    label: "Multi-Hop Relay Triangulation",
    badge: "ANOMALY HOP",
    color: "border-amber-500/40 hover:border-amber-400 bg-amber-950/30 text-amber-300 hover:shadow-amber-500/20",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
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
    label: "Clean GitHub Star Notice",
    badge: "BENIGN PASS",
    color: "border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/30 text-emerald-300 hover:shadow-emerald-500/20",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
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
  const [activeView, setActiveView] = useState('radar'); // 'radar' | 'ai' | 'geo' | 'osint' | 'graph' | 'headers' | 'custody'

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
      setActiveView('radar');
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
    <div className="min-h-screen cyber-grid ambient-glow p-4 sm:p-8 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Tactical SOC Telemetry Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-b border-slate-800 pb-3 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-emerald-400 font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SOC SENTINEL: ARMED
            </span>
            <span className="hidden sm:inline text-slate-700">//</span>
            <span className="hidden sm:flex items-center gap-1.5 text-cyan-300 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              BLOCKCHAIN NOTARY: SYNCED
            </span>
            <span className="hidden md:inline text-slate-700">//</span>
            <span className="hidden md:flex items-center gap-1.5 text-purple-300 font-medium">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              NEURAL ENSEMBLE: ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-slate-950 px-2.5 py-0.5 rounded border border-slate-700 font-mono text-cyan-300 font-bold">
              NODE: FASTAPI:8000
            </span>
          </div>
        </div>

        {/* Hero Header & Quick Actions */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 py-2">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-wider">
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              FORENSIC OPERATIONS // INCIDENT TRIAGE ENGINE v2.8
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Email Threat <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Command Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed font-sans">
              RFC-822 header stream parsing, speed-of-light relay anomaly triangulation, computer vision OCR detonation, and neural campaign attribution.
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0 font-mono">
            <button
              onClick={() => setShowIOCSearch(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-105"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              [LOOKUP IOC DOSSIER]
            </button>

            <button
              onClick={() => setShowPlaybook(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40 hover:border-purple-400 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-105"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              [SOC PLAYBOOK]
            </button>
          </div>
        </div>

        {/* Upload & Demo Presets Chamber */}
        <div className="cyber-panel rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          
          <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
            
            {/* Tactical Dropzone */}
            <label 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex flex-col items-center justify-center w-full max-w-4xl h-44 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-2xl cursor-pointer bg-slate-950/70 hover:bg-slate-900/70 transition-all shadow-inner group relative"
            >
              <div className="flex flex-col items-center justify-center pt-3 pb-4 space-y-2">
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/30 group-hover:scale-110 group-hover:border-cyan-400 transition-all shadow-md">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors font-sans">
                  Drop target <span className="text-cyan-400 font-mono font-bold">.EML</span> file here or <span className="text-cyan-400 underline decoration-cyan-500 underline-offset-4 font-bold">browse filesystem</span>
                </p>
                <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Automatic SHA-256 Tamper-Evident Ledger & Ethereum Custody Seal
                </p>
              </div>
              <input type="file" className="hidden" accept=".eml" onChange={handleFileChange} />
            </label>

            {/* Quick Demo Attack Presets */}
            <div className="w-full max-w-4xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  // Instant Sandbox Attack Presets:
                </span>
                <span className="text-cyan-400 font-mono text-[11px] font-semibold">[1-Click Live Ingestion]</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DEMO_EMAILS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => handleLoadDemo(demo)}
                    disabled={loading}
                    className={`flex flex-col justify-between p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left disabled:opacity-50 hover:scale-[1.03] shadow-md ${demo.color}`}
                  >
                    <span className="block truncate font-bold text-white text-xs mb-1 font-sans">{demo.label}</span>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 font-mono">
                      <span className="text-[10px] text-slate-400 truncate">{demo.filename}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold flex-shrink-0 ml-1 ${demo.badgeColor}`}>
                        {demo.badge}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected File Action Bar */}
            {file && (
              <div className="flex items-center space-x-3 bg-slate-900/90 border border-cyan-500/40 px-4 py-3 rounded-xl w-full max-w-4xl shadow-lg animate-in fade-in">
                <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div className="flex-1 truncate">
                  <span className="text-xs font-bold text-white font-mono block truncate">{file.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{(file.size / 1024).toFixed(1)} KB &bull; Ingestion stream ready</span>
                </div>
                <button 
                  onClick={() => handleAnalyze()}
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 cursor-pointer flex-shrink-0 hover:scale-105 font-mono"
                >
                  {loading ? "[ANALYZING...]" : "[INITIATE THREAT SCAN]"}
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-rose-400 bg-rose-950/40 border border-rose-500/40 px-4 py-3 rounded-xl w-full max-w-4xl text-xs font-mono">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>ERROR: {error}</span>
              </div>
            )}
            
          </div>
        </div>

        {/* Results Section with Tactical Navigation Dock */}
        {results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            
            {/* Live Threat Quick Telemetry Strip */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-xl ${isHighRisk ? 'bg-rose-950/30 border-rose-500/40' : (isMediumRisk ? 'bg-amber-950/30 border-amber-500/40' : 'bg-emerald-950/30 border-emerald-500/40')}`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl font-mono text-2xl font-black ${isHighRisk ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : (isMediumRisk ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40')}`}>
                  {threatScore}/100
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono font-bold text-slate-400">// INCIDENT VERDICT:</span>
                    <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full font-mono ${isHighRisk ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : (isMediumRisk ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40')}`}>
                      {results.fraud_assessment?.risk_level} Risk
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate max-w-xl mt-0.5 font-sans">
                    {results.subject || "No Subject"}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ThreatWaveform score={threatScore} isHighRisk={isHighRisk} />

                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
                    ORIGIN: <strong className="text-cyan-300 font-bold">{results.trace?.best_guess_ip || 'N/A'}</strong>
                  </div>
                  <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
                    THREAT: <strong className="text-indigo-300 font-bold">{results.ai_ml_analysis?.classification?.primary_threat?.replace(/_/g, ' ').toUpperCase() || 'CLEAN'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Navigation Dock */}
            <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-950/90 border border-slate-800 rounded-2xl shadow-xl">
              {[
                { id: 'radar', code: '01', label: 'Threat Radar', icon: Activity },
                { id: 'ai', code: '02', label: 'Neural AI & Trap', icon: Brain },
                { id: 'dissector', code: '03', label: 'Body Dissector & Sandbox', icon: Eye },
                { id: 'geo', code: '04', label: 'Geo-Origin & Physics', icon: Compass },
                { id: 'osint', code: '05', label: 'Vision & Deep OSINT', icon: Scan },
                { id: 'graph', code: '06', label: 'Attribution Graph', icon: Network },
                { id: 'headers', code: '07', label: 'Header Polygraph', icon: Mail },
                { id: 'custody', code: '08', label: 'Evidence Vault', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-300 border border-cyan-500/60 shadow-lg shadow-cyan-950/50' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-cyan-400' : 'text-slate-600'}`}>[{tab.code}]</span>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic View Display Container */}
            <div className="space-y-6">
              {activeView === 'radar' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <FraudScorePanel data={results} />
                </div>
              )}

              {activeView === 'ai' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <AIMLThreatPanel data={results} />
                </div>
              )}

              {activeView === 'dissector' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <EmailBodyDissector data={results} onLookupIOC={handleLookupIOC} />
                </div>
              )}

              {activeView === 'geo' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <MapPanel data={results} />
                </div>
              )}

              {activeView === 'osint' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <DeepOSINTPanel data={results} />
                </div>
              )}

              {activeView === 'graph' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <GraphAttributionPanel data={results} onLookupIOC={handleLookupIOC} />
                </div>
              )}

              {activeView === 'headers' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  <HeaderPanel data={results} />
                  <AuthPanel data={results} />
                </div>
              )}

              {activeView === 'custody' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <CustodyReportPanel data={results} />
                  <CaseHistoryPanel />
                </div>
              )}
            </div>

          </div>
        )}

        {/* Persistent Case Management & Campaigns when no active email is loaded */}
        {!results && (
          <CaseHistoryPanel />
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


