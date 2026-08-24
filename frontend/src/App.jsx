import React, { useState, useEffect } from 'react';
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
  Radio
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
  const [activeView, setActiveView] = useState('radar'); // 'radar' | 'ai' | 'dissector' | 'geo' | 'osint' | 'graph' | 'headers' | 'custody'

  // Load shared data from Chrome extension (injected via scripting API)
  useEffect(() => {
    // 1. Check if data was set in localStorage before the app fully loaded
    const shared = localStorage.getItem('shieldmail_shared_result');
    if (shared) {
      try {
        const data = JSON.parse(shared);
        setResults(data);
        setActiveView('radar');
        localStorage.removeItem('shieldmail_shared_result'); // Clean up
      } catch (err) {
        console.error("Failed to parse shared data from localStorage", err);
      }
    }

    // 2. Listen for custom event if the extension injects data while the app is already open
    const handleSharedData = (event) => {
      if (event.detail && event.detail.data) {
        setResults(event.detail.data);
        setActiveView('radar');
      }
    };
    window.addEventListener('shieldmail_inject', handleSharedData);
    return () => window.removeEventListener('shieldmail_inject', handleSharedData);
  }, []);

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
    <div className="min-h-screen chassis-bg p-4 sm:p-8 text-[#2d3436] font-sans selection:bg-[#ff4757] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-7">
        
        {/* Tactical Industrial Telemetry Ribbon */}
        <header className="panel-chassis px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-mono font-bold text-[#2d3436] uppercase tracking-wider">
              <span className="led-node led-node-green animate-pulse" />
              <span>SOC SENTINEL: ARMED</span>
            </div>
            <span className="text-[#a3b1c6] font-mono hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-2 text-[#4a5568] font-mono text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
              <span>BLOCKCHAIN NOTARY: SYNCED</span>
            </div>
            <span className="text-[#a3b1c6] font-mono hidden md:inline">|</span>
            <div className="hidden md:flex items-center gap-2 text-[#4a5568] font-mono text-[11px] font-semibold">
              <Cpu className="w-3.5 h-3.5 text-[#ff4757]" />
              <span>NEURAL ENSEMBLE: ACTIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="slot-recessed-sm px-3 py-1 font-mono text-[10px] font-bold text-[#4a5568] uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-[#ff4757] animate-pulse" />
              <span>NODE: FASTAPI:8000</span>
            </div>
          </div>
        </header>

        {/* Hero Section & Machine Title */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-6 py-2">
          <div className="space-y-2 text-center lg:text-left max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md slot-recessed-sm text-[#4a5568] text-xs font-mono font-bold tracking-widest uppercase">
              <Zap className="w-3.5 h-3.5 text-[#ff4757]" />
              <span>FORENSIC OPERATIONS // INCIDENT TRIAGE ENGINE v2.8</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#2d3436] drop-shadow-[0_1px_0_#ffffff]">
              Email Threat <span className="text-[#ff4757]">Command Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#4a5568] max-w-2xl leading-relaxed font-sans font-medium">
              RFC-822 header stream parsing, speed-of-light relay anomaly triangulation, computer vision OCR detonation, and neural campaign attribution.
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0 font-mono">
            <button
              onClick={() => setShowIOCSearch(true)}
              className="btn-tactile-secondary px-4 py-2.5 text-xs font-bold"
            >
              <Search className="w-4 h-4 text-[#ff4757]" />
              <span>[LOOKUP IOC]</span>
            </button>

            <button
              onClick={() => setShowPlaybook(true)}
              className="btn-tactile-secondary px-4 py-2.5 text-xs font-bold"
            >
              <BookOpen className="w-4 h-4 text-[#4a5568]" />
              <span>[SOC PLAYBOOK]</span>
            </button>
          </div>
        </section>

        {/* Upload & Demo Presets Chamber (Bolted Physical Module) */}
        <section className="panel-chassis p-6 sm:p-8 space-y-6 relative overflow-hidden">
          
          {/* Corner Screw Heads & Vent Louvers */}
          <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
          <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
          <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
          <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

          <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-3 px-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#ff4757]" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2d3436]">
                INGESTION BAY // RFC-822 STREAM
              </span>
            </div>
            <div className="vent-louvers">
              <div className="vent-slot" />
              <div className="vent-slot" />
              <div className="vent-slot" />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
            
            {/* Tactical Dropzone (Recessed Data Bay) */}
            <label 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex flex-col items-center justify-center w-full max-w-4xl h-44 border-2 border-dashed border-[#babecc] hover:border-[#ff4757] rounded-2xl cursor-pointer slot-recessed transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col items-center justify-center pt-3 pb-4 space-y-2">
                <div className="p-3 bg-[#e0e5ec] text-[#ff4757] rounded-2xl shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-floating)] group-hover:scale-105 transition-all border border-white/60">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[#2d3436] group-hover:text-[#ff4757] transition-colors font-sans">
                  Drop target <span className="text-[#ff4757] font-mono font-bold">.EML</span> file here or <span className="underline decoration-[#ff4757] underline-offset-4">browse filesystem</span>
                </p>
                <p className="text-xs text-[#4a5568] font-mono flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                  Automatic SHA-256 Tamper-Evident Ledger & Ethereum Custody Seal
                </p>
              </div>
              <input type="file" className="hidden" accept=".eml" onChange={handleFileChange} />
            </label>

            {/* Quick Demo Attack Presets */}
            <div className="w-full max-w-4xl space-y-3">
              <div className="flex items-center justify-between text-xs text-[#4a5568] border-b border-[#d1d9e6] pb-2 px-1">
                <span className="font-bold text-[#2d3436] flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider">
                  <Radio className="w-3.5 h-3.5 text-[#ff4757]" />
                  // Instant Sandbox Attack Presets:
                </span>
                <span className="text-[#ff4757] font-mono text-[11px] font-bold">[1-Click Live Ingestion]</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DEMO_EMAILS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => handleLoadDemo(demo)}
                    disabled={loading}
                    className="btn-tactile-secondary p-3.5 flex flex-col justify-between text-left cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="truncate font-bold text-[#2d3436] text-xs font-sans">{demo.label}</span>
                      <span className={`led-node ${demo.led}`} />
                    </div>
                    <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-[#d1d9e6]/80 font-mono">
                      <span className="text-[10px] text-[#4a5568] truncate">{demo.filename}</span>
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
              <div className="flex items-center space-x-3 slot-recessed p-3.5 rounded-xl w-full max-w-4xl border border-[#babecc]/60 animate-in fade-in">
                <FileText className="w-5 h-5 text-[#ff4757] flex-shrink-0" />
                <div className="flex-1 truncate">
                  <span className="text-xs font-bold text-[#2d3436] font-mono block truncate">{file.name}</span>
                  <span className="text-[11px] text-[#4a5568] font-mono font-medium">{(file.size / 1024).toFixed(1)} KB &bull; Stream buffer loaded</span>
                </div>
                <button 
                  onClick={() => handleAnalyze()}
                  disabled={loading}
                  className="btn-tactile-primary px-5 py-2 text-xs font-mono"
                >
                  {loading ? "[ANALYZING...]" : "[INITIATE THREAT SCAN]"}
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-[#d63031] slot-recessed p-3.5 rounded-xl w-full max-w-4xl text-xs font-mono border-l-4 border-l-[#d63031]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>ERROR: {error}</span>
              </div>
            )}
            
          </div>
        </section>

        {/* Results Section with Industrial Navigation Dock */}
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
                <ThreatWaveform score={threatScore} isHighRisk={isHighRisk} />

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

            {/* Industrial Navigation Dock (Key Switches) */}
            <div className="flex items-center gap-2 overflow-x-auto p-2 slot-recessed rounded-2xl">
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
                    className={`key-switch flex items-center gap-2 px-4 py-2.5 text-xs font-bold flex-shrink-0 ${isActive ? 'active' : ''}`}
                  >
                    <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-[#ff4757]' : 'text-[#8896aa]'}`}>
                      [{tab.code}]
                    </span>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ff4757]' : 'text-[#4a5568]'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic View Display Container */}
            <div className="space-y-6">
              {activeView === 'radar' && (
                <div className="space-y-6 animate-in fade-in duration-250">
                  <FraudScorePanel data={results} />
                </div>
              )}

              {activeView === 'ai' && (
                <div className="space-y-6 animate-in fade-in duration-250">
                  <AIMLThreatPanel data={results} />
                </div>
              )}

              {activeView === 'dissector' && (
                <div className="space-y-6 animate-in fade-in duration-250">
                  <EmailBodyDissector data={results} onLookupIOC={handleLookupIOC} />
                </div>
              )}

              {activeView === 'geo' && (
                <div className="space-y-6 animate-in fade-in duration-250">
                  <MapPanel data={results} />
                </div>
              )}

              {activeView === 'osint' && (
                <div className="space-y-6 animate-in fade-in duration-250">
                  <DeepOSINTPanel data={results} />
                </div>
              )}

              {activeView === 'graph' && (
                <div className="space-y-6 animate-in fade-in duration-250">
                  <GraphAttributionPanel data={results} onLookupIOC={handleLookupIOC} />
                </div>
              )}

              {activeView === 'headers' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-250">
                  <HeaderPanel data={results} />
                  <AuthPanel data={results} />
                </div>
              )}

              {activeView === 'custody' && (
                <div className="space-y-6 animate-in fade-in duration-250">
                  <CustodyReportPanel data={results} />
                  <CaseHistoryPanel />
                </div>
              )}
            </div>

          </section>
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


