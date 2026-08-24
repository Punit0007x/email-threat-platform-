import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Upload, AlertCircle, FileText, BookOpen, Search, Zap, Terminal, Sparkles, Radio, Database
} from 'lucide-react';
import { analyzeEmail } from './services/analysisService';

import HeaderPanel from './components/HeaderPanel';
import AuthPanel from './components/AuthPanel';
import FraudScorePanel from './components/FraudScorePanel';
import AIMLThreatPanel from './components/AIMLThreatPanel';
import DeepOSINTPanel from './components/DeepOSINTPanel';
import MapPanel from './components/MapPanel';
import AdvancedSOC from './components/AdvancedSOC';
import CustodyReportPanel from './components/CustodyReportPanel';
import GraphAttributionPanel from './components/GraphAttributionPanel';
import PlaybookModal from './components/PlaybookModal';
import IOCSearchModal from './components/IOCSearchModal';
import CyberScanOverlay from './components/CyberScanOverlay';
import EmailBodyDissector from './components/EmailBodyDissector';
import DashboardView from './components/DashboardView';

const DEMO_EMAILS = [
  {
    id: "sample",
    label: "PayPal Brand Phishing",
    badge: "CRITICAL",
    filename: "sample.eml",
    content: `From: Security <security@paypa1.com>\nTo: victim@company.com\nSubject: URGENT: Your account has been suspended!\nDate: Wed, 22 Aug 2026 09:00:00 +0000\nMessage-ID: <1234567890@example.com>\nReply-To: sender-reply@example.com\nReturn-Path: <bounce@attacker-vps.com>\nReceived: from mail.example.com (mail.example.com [192.168.1.100])\n\tby mx.company.com with ESMTP id 12345;\n\tWed, 22 Aug 2026 09:00:10 +0000\nAuthentication-Results: mx.company.com;\n\tspf=fail smtp.mailfrom=bounce@attacker-vps.com;\n\tdkim=none header.i=@paypa1.com;\n\tdmarc=fail (p=reject sp=reject dis=none) header.from=paypa1.com\nContent-Type: multipart/alternative; boundary="BOUNDARY"\n\n--BOUNDARY\nContent-Type: text/plain; charset="utf-8"\n\nYour account will be closed. Act now.\nPlease verify immediately at http://bit.ly/fake-link\n\n--BOUNDARY\nContent-Type: text/html; charset="utf-8"\n\n<html>\n<body>\n<p>Your account will be closed. Act now.</p>\n<p>Please <a href="http://bit.ly/fake-link">verify immediately</a></p>\n<p>Visit <a href="http://attacker.com/login">https://paypal.com/login</a></p>\n</body>\n</html>\n--BOUNDARY--`
  },
  {
    id: "bec",
    label: "BEC Executive Wire Fraud",
    badge: "VIP SPOOF",
    filename: "bec_ceo_fraud.eml",
    content: `From: "Tim Cook (CEO)" <ceo.apple.exec@gmail.com>\nTo: payroll-dept@company.com\nReply-To: executive-finance-secure@protonmail.com\nSubject: URGENT: Update my direct deposit information\nDate: Thu, 20 Aug 2026 09:30:00 +0000\nMessage-ID: <bec-attack@apple.com>\n\nHi Payroll Team,\n\nI am currently in an urgent offsite board meeting and cannot take calls.\nPlease update my bank account details for my upcoming direct deposit paycheck immediately.\nAttached are the new routing numbers. Do not process via the old account.\n\nPlease keep this matter confidential between us.\n\nThanks,\nTim Cook`
  },
  {
    id: "multi_hop",
    label: "Multi-Hop Relay Anomaly",
    badge: "ANOMALY",
    filename: "multi_hop.eml",
    content: `From: hacker@evil.com\nTo: victim@company.com\nSubject: You won!\nReceived: from mail-wr1-f49.google.com (mail-wr1-f49.google.com [209.85.221.49]) by mx.company.com with ESMTP id 123; Wed, 22 Aug 2026 09:05:00 +0000\nReceived: from attacker-vps.xyz (attacker-vps.xyz [89.123.45.67]) by mail.google.com with ESMTP id 456; Wed, 22 Aug 2026 09:04:55 +0000\nReceived: from localhost (localhost [127.0.0.1]) by attacker-vps.xyz; Wed, 22 Aug 2026 09:04:00 +0000\n\nClick here.`
  },
  {
    id: "clean",
    label: "Clean GitHub Notice",
    badge: "BENIGN",
    filename: "clean.eml",
    content: `From: support@github.com\nTo: user@example.com\nSubject: Your GitHub repository was starred\nDate: Wed, 22 Aug 2026 09:00:00 +0000\nMessage-ID: <clean123@github.com>\nReply-To: noreply@github.com\nReturn-Path: <bounce@github.com>\nReceived: from out-1.github.com (out-1.github.com [192.30.252.1])\n\tby mx.company.com with ESMTP id 12345;\n\tWed, 22 Aug 2026 09:00:10 +0000\nAuthentication-Results: mx.company.com;\n\tspf=pass (mx.company.com: domain of bounce@github.com designates 192.30.252.1 as permitted sender) smtp.mailfrom=bounce@github.com;\n\tdkim=pass header.i=@github.com;\n\tdmarc=pass (p=reject sp=reject dis=none) header.from=github.com\nContent-Type: text/plain; charset="utf-8"\n\nHi there,\nSomeone just starred your repository!\nCheck it out at https://github.com/punit007x/my-repo`
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
  
  const [activeView, setActiveView] = useState('summary');
  const [activeSection, setActiveSection] = useState(1);

  const heroRef = useRef(null);
  const scannerRef = useRef(null);
  const dashboardRef = useRef(null);
  
  const isHeroInView = useInView(heroRef, { amount: 0.5 });
  const isScannerInView = useInView(scannerRef, { amount: 0.5 });
  const isDashboardInView = useInView(dashboardRef, { amount: 0.5 });

  useEffect(() => {
    if (isHeroInView) setActiveSection(1);
    else if (isScannerInView) setActiveSection(2);
    else if (isDashboardInView) setActiveSection(3);
  }, [isHeroInView, isScannerInView, isDashboardInView]);

  // Load shared data from Chrome extension (injected via scripting API)
  useEffect(() => {
    const handleExtensionData = (data) => {
      setResults(data);
      setActiveView('summary');
      setTimeout(() => {
        dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    // 1. Check if data was set in localStorage before the app fully loaded
    const shared = localStorage.getItem('shieldmail_shared_result');
    if (shared) {
      try {
        handleExtensionData(JSON.parse(shared));
        localStorage.removeItem('shieldmail_shared_result'); // Clean up
      } catch (err) {
        console.error("Failed to parse shared data from localStorage", err);
      }
    }

    // 2. Listen for custom events dispatched by the content script while app is open
    const handleSharedData = (event) => {
      if (event.detail && event.detail.data) {
        handleExtensionData(event.detail.data);
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
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      handleAnalyze(selectedFile);
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
      dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err.message || "Failed to analyze email.");
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

  return (
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-[#0A0A0C] font-sans selection:bg-[#ff4757] selection:text-white">
      
      {/* Floating Navigation Pill */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl bg-white/10 border border-white/20 px-6 py-3 rounded-full flex gap-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
        {[1, 2, 3].map((num) => (
          <div 
            key={num} 
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeSection === num ? 'bg-white scale-125' : 'bg-white/30'}`}
          />
        ))}
      </nav>

      {/* SECTION 1: HERO */}
      <section ref={heroRef} className="snap-start h-screen w-full bg-[#0A0A0C] flex flex-col justify-center items-center text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-800/20 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10 text-center max-w-4xl px-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono font-bold tracking-widest uppercase mb-8">
            <Zap className="w-4 h-4 text-slate-500" />
            <span>Email Threat Operations Center</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
            Intelligent <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-500 to-cyan-400">Threat Detonation</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            Advanced forensic parsing, speed-of-light relay anomaly triangulation, computer vision OCR detonation, and neural campaign attribution.
          </p>
          <div className="flex items-center justify-center gap-4">
             <button onClick={() => scannerRef.current?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold transition-all shadow-[0_0_20px_rgba(15,23,42,0.4)]">
               Initialize Scan Bay
             </button>
             <button onClick={() => setShowPlaybook(true)} className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-bold transition-all">
               SOC Playbook
             </button>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: SCANNER */}
      <section ref={scannerRef} className="snap-start h-screen w-full bg-[#0f172a] flex flex-col justify-center items-center relative overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="z-10 w-full max-w-4xl px-4"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
             <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <Terminal className="w-5 h-5 text-slate-400" />
                <h2 className="text-xl font-bold uppercase tracking-wider font-mono">Ingestion Bay</h2>
             </div>

             <label 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-slate-400/50 hover:border-white hover:bg-white/5 rounded-2xl cursor-pointer transition-all group relative overflow-hidden mb-8"
            >
              <div className="flex flex-col items-center justify-center p-6 space-y-4">
                <div className="p-4 bg-slate-800/20 text-slate-300 rounded-full group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-lg font-bold">
                  Drop <span className="text-slate-300 font-mono">.EML</span> file here or click to browse
                </p>
                <p className="text-sm text-slate-300/70 font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Secure Sandbox Environment
                </p>
              </div>
              <input type="file" className="hidden" accept=".eml" onChange={handleFileChange} />
            </label>

            {/* Quick Demo Attack Presets */}
            <div>
              <div className="flex items-center justify-between text-sm text-slate-300 mb-4">
                <span className="font-bold flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Radio className="w-4 h-4" /> Sandbox Attack Presets
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {DEMO_EMAILS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => handleLoadDemo(demo)}
                    disabled={loading}
                    className="bg-black/20 hover:bg-black/40 border border-white/10 rounded-xl p-4 text-left transition-all disabled:opacity-50"
                  >
                    <div className="font-bold text-sm mb-2">{demo.label}</div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 font-mono">
                      <span className="text-[10px] text-slate-400 truncate">{demo.filename}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/20 bg-white/10 ml-2">
                        {demo.badge}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-6 flex items-center space-x-2 text-red-300 bg-red-900/40 p-4 rounded-xl border border-red-500/30 text-sm font-mono">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* SECTION 3: ANALYSIS / DASHBOARD */}
      <section ref={dashboardRef} className="snap-start h-screen w-full bg-[#F8FAFC] relative">
        {results ? (
          <div className="pt-24 pb-12 px-4 sm:px-8 max-w-[90rem] mx-auto h-full flex flex-col">
            
            {/* Tab Navigation System */}
            <div className="bg-white border border-gray-200 rounded-2xl p-2 flex flex-wrap gap-2 shadow-sm mb-6">
              {[
                { id: 'summary', label: 'Summary & Verdict' },
                { id: 'content', label: 'Email Content' },
                { id: 'sender', label: 'Sender Details' },
                { id: 'network', label: 'Network & Origin' },
                { id: 'report', label: 'Analysis Report' },
                { id: 'advanced', label: 'God-Level SOC' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeView === tab.id ? 'bg-[#0f172a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {tab.label}
                </button>
              ))}
              <div className="ml-auto flex gap-2">
                 <button onClick={() => setShowIOCSearch(true)} className="px-3 py-2 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2">
                   <Search className="w-4 h-4"/> IOC Search
                 </button>
                 <button onClick={() => setResults(null)} className="px-3 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-100">
                   Clear Session
                 </button>
              </div>
            </div>

            {/* GlassCard Ecosystem for Results */}
            <div className="flex-1 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-y-auto">
              
              {activeView === 'summary' && (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
                  <FraudScorePanel data={results} />
                  <AIMLThreatPanel data={results} />
                </motion.div>
              )}

              {activeView === 'content' && (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
                  <EmailBodyDissector data={results} onLookupIOC={handleLookupIOC} />
                  <DeepOSINTPanel data={results} />
                </motion.div>
              )}

              {activeView === 'sender' && (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HeaderPanel data={results} />
                  <AuthPanel data={results} />
                </motion.div>
              )}

              {activeView === 'network' && (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
                  <GraphAttributionPanel data={results} onLookupIOC={handleLookupIOC} />
                  <MapPanel data={results} />
                </motion.div>
              )}

              {activeView === 'report' && (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
                  <CustodyReportPanel data={results} />
                </motion.div>
              )}

              {activeView === 'advanced' && (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
                  <AdvancedSOC data={results} />
                </motion.div>
              )}

            </div>
          </div>
        ) : (
          <DashboardView />
        )}
      </section>

      {/* Modals & Overlays */}
      <PlaybookModal isOpen={showPlaybook} onClose={() => setShowPlaybook(false)} />
      <IOCSearchModal 
        isOpen={showIOCSearch} 
        onClose={() => {
          setShowIOCSearch(false);
          setIocQuery('');
        }} 
        initialQuery={iocQuery}
      />
      <CyberScanOverlay isOpen={loading} />
      
    </div>
  );
}

export default App;
