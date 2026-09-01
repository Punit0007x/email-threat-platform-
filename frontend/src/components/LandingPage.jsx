import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Brain, Network, MapPin, 
  FileSearch, Lock, Zap, ArrowRight, 
  Activity, CheckCircle2,
  Fingerprint, Database
} from 'lucide-react';
import ExtensionInstallModal from './ExtensionInstallModal';

export default function LandingPage({ onLaunchDemo }) {
  const [showExtension, setShowExtension] = React.useState(false);

  const modules = [
    {
      title: "Multi-Vector Fraud Detection Engine",
      icon: Brain,
      color: "from-cyan-500 to-blue-600",
      features: [
        "Semantic & Behavioral NLP: Real-time evaluation of tone, urgency, and social engineering patterns.",
        "BEC & Impersonation Defense: Intercepts VIP spoofing, invoice fraud, and vendor account takeovers.",
        "Dynamic Threat Interception: Flags credential harvesting, zero-day domains, and obfuscated URLs."
      ]
    },
    {
      title: "Deep Protocol & Header Forensics",
      icon: FileSearch,
      color: "from-emerald-400 to-teal-600",
      features: [
        "Authentication Audits: Real-time verification for SPF, DKIM cryptographic integrity, and DMARC enforcement.",
        "Hop-by-Hop Header Dissection: Audits Received, Return-Path, and Message-ID fields for relay tampering.",
        "MTA Verification: Validates legitimate Mail Transfer Agents vs. unauthorized open relays."
      ]
    },
    {
      title: "Origin Traceability & Intelligence",
      icon: MapPin,
      color: "from-indigo-400 to-purple-600",
      features: [
        "Hop Extraction: Isolates the earliest reliable sending node across complex mail hops.",
        "Network Profiling: Maps sending IPs to physical locations, ASNs, and anonymizers (Tor, VPNs).",
        "Domain & DNS Telemetry: Analyzes passive DNS, WHOIS, SSL fingerprints, and registrar velocity."
      ]
    },
    {
      title: "Attribution & Campaign Intelligence",
      icon: Network,
      color: "from-rose-400 to-orange-600",
      features: [
        "Entity Graph Analytics: Connects disparate attacks across common subnets and payload fingerprints.",
        "Actor Classification: Differentiates between hijacked accounts, spoofed identities, and adversaries.",
        "Confidence Scoring: Matches indicators with global threat feeds to score attribution."
      ]
    },
    {
      title: "Forensic Command Center",
      icon: Activity,
      color: "from-blue-400 to-indigo-600",
      features: [
        "Pre-Delivery Interception: Triggers zero-trust quarantine before malicious emails reach inboxes.",
        "Analyst Console: Single-pane visualization for visual trace-routes and fraud confidence.",
        "Court-Ready Dossiers: Auto-generates structured evidentiary reports for incident response."
      ]
    },
    {
      title: "Privacy-First Compliance",
      icon: Lock,
      color: "from-slate-400 to-slate-600",
      features: [
        "Immutable Logging: Cryptographic hashing and audit trails for chain-of-custody compliance.",
        "Privacy Safeguards: Configurable data retention, granular RBAC, and automated PII masking.",
        "Regulatory Readiness: Designed for strict GDPR and enterprise privacy requirements."
      ]
    }
  ];

  const outcomes = [
    { title: "Pre-Zero-Hour Neutralization", desc: "Stop targeted BEC and polymorphic attacks prior to inbox exposure." },
    { title: "Drastic MTTR Reduction", desc: "Accelerate response workflows by automating header parsing and IP trace-routing." },
    { title: "High-Fidelity Attribution", desc: "Move beyond simple blocking to mapping active threat campaigns and infrastructure." },
    { title: "Litigation & Regulatory Readiness", desc: "Equip security teams with tamper-proof, chain-of-custody documentation." },
    { title: "Financial & Reputational Resilience", desc: "Prevent wire fraud losses, credential leakage, and vendor email compromise." }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-900/20 blur-[120px] rounded-full z-0 pointer-events-none" />

      {/* Light Theme Top Section */}
      <div className="bg-slate-50 text-slate-900 pb-12 rounded-b-[3rem] shadow-sm relative z-10">
        {/* Navigation */}
        <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-cyan-600" />
            <span className="text-xl font-bold tracking-tight">eRakshak<span className="text-cyan-600">.ai</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#platform" className="hover:text-cyan-600 transition-colors">Platform</a>
            <a href="#outcomes" className="hover:text-cyan-600 transition-colors">Outcomes</a>
            <button onClick={() => setShowExtension(true)} className="px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-all shadow-sm flex items-center gap-2">
              Download Extension
            </button>
            <button onClick={onLaunchDemo} className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 transition-all text-slate-900 shadow-sm">
              Access Demo
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 pt-16 pb-20 px-6">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100/50 border border-cyan-200 text-cyan-800 text-xs font-semibold uppercase tracking-widest mb-4">
              <Zap className="w-4 h-4" /> Next-Gen Email Fraud & Protocol Forensics
            </motion.div>
            
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Stop BEC, Phishing, and Spoofing <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-600">Before Delivery.</span>
            </motion.h1>
            
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Combine semantic NLP, deep MTA protocol dissection, and graph-based campaign intelligence into a single automated defense and forensic command center.
            </motion.p>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <button onClick={onLaunchDemo} className="w-full sm:w-auto px-8 py-4 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(8,145,178,0.39)] hover:shadow-[0_6px_20px_rgba(8,145,178,0.23)]">
                Launch Live Demo <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => setShowExtension(true)} className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)]">
                Download Extension
              </button>
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                Read Forensic Whitepaper
              </button>
            </motion.div>
            
          </div>
        </main>
      </div>

      {/* Key Architecture & Functional Modules */}
      <section id="platform" className="relative z-10 py-24 bg-slate-900/50 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Architecture & Modules</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">A comprehensive forensic pipeline designed to intercept, dissect, and attribute sophisticated email threats.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div key={idx} className="group p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-600 transition-all hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-sm">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${mod.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${mod.color} bg-opacity-10 mb-6`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-4 text-slate-100">{mod.title}</h3>
                  
                  <ul className="space-y-3">
                    {mod.features.map((feat, i) => {
                      const [strong, rest] = feat.split(': ');
                      return (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong className="text-slate-300">{strong}: </strong>{rest}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Measurable Impact & Outcomes */}
      <section id="outcomes" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Measurable Impact & Strategic Outcomes</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Transform your email security posture from reactive filtering to proactive forensic intelligence.
            </p>
            <div className="space-y-4">
              {outcomes.map((out, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                    <Fingerprint className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">{out.title}</h4>
                    <p className="text-sm text-slate-400">{out.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/80 shadow-2xl p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-slate-400" />
                  <span className="font-mono text-sm text-slate-300 font-bold uppercase tracking-wider">Live Telemetry Feed</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
              </div>
              
              <div className="space-y-4 font-mono text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                  <span className="text-cyan-400">[00:00:12]</span> SYS: INITIATING PROTOCOL DISSECTION...<br/>
                  <span className="text-cyan-400">[00:00:14]</span> NLP: DETECTED URGENCY_CUE (CONFIDENCE: 94%)<br/>
                  <span className="text-cyan-400">[00:00:15]</span> MTA: EXTRACTING RECEIVED HEADERS... (4 HOPS)<br/>
                  <span className="text-red-400 font-bold">[00:00:18] ALARM: DKIM SIGNATURE MISMATCH DETECTED</span><br/>
                  <span className="text-emerald-400">[00:00:19]</span> TRACE: ORIGIN IP MAPPED TO UNKNOWN PROXY (AS4592)<br/>
                  <span className="text-emerald-400">[00:00:22]</span> GRAPH: CORRELATED TO THREAT CLUSTER #882-ALPHA<br/>
                  <span className="text-cyan-400">[00:00:23]</span> ACTION: EXECUTING PRE-DELIVERY QUARANTINE...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA & Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-6">Ready to Upgrade Your Inbound Email Defenses?</h2>
          <p className="text-slate-400 mb-10 text-lg">Deploy the most advanced forensic pipeline and stop sophisticated threat actors before they reach the inbox.</p>
          <button onClick={onLaunchDemo} className="px-10 py-4 rounded-full bg-white text-slate-950 font-bold hover:bg-slate-200 transition-all duration-300 focus:ring-4 focus:ring-cyan-500/50 outline-none text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Start Live Interactive Demo
          </button>
        </div>
        
        <div className="border-t border-slate-800/80 py-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-400" />
              <span className="font-bold text-slate-200">eRakshak.ai</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
              <span>SOC 2 Type II Certified</span>
              <span>ISO 27001</span>
              <span>GDPR Compliant</span>
            </div>
            <div className="text-sm text-slate-600">
              © 2026 eRakshak Security. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
      <ExtensionInstallModal isOpen={showExtension} onClose={() => setShowExtension(false)} />
    </div>
  );
}
