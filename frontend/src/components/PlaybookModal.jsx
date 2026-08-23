import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Scan, 
  Activity, 
  Brain, 
  Network, 
  ShieldAlert, 
  Layers, 
  Server,
  BookOpen
} from 'lucide-react';

export default function PlaybookModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const steps = [
    {
      num: "01",
      title: "The Cryptographic Seal",
      subtitle: "Blockchain Notary & Immutability",
      icon: ShieldCheck,
      color: "from-emerald-600 to-teal-500",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      what: "Before analysis begins, the raw email code is locked with a SHA-256 digest and recorded onto a local Ethereum blockchain ledger.",
      why: "Ensures legal admissibility in court and insurance fraud claims by proving mathematically that the evidence has never been tampered with or modified.",
      example: "A CFO receives a fake invoice. The platform instantly notarizes the evidence before the user even opens the email."
    },
    {
      num: "02",
      title: "The X-Ray",
      subtitle: "Multi-Modal Computer Vision & QR Detonation",
      icon: Scan,
      color: "from-blue-600 to-cyan-500",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      what: "Tesseract OCR extracts text embedded in image screenshots or PDF attachments, and computer vision engines detonate hidden QR codes.",
      why: "Threat actors often bypass traditional text scanners by embedding text in images or tricking users into scanning QR codes on mobile devices.",
      example: "An email with zero body text contains an attached image stating: 'Password Expired. Scan QR code.' The OCR engine extracts the text, detonates the QR URL, and flags the phishing domain."
    },
    {
      num: "03",
      title: "Breaking the VPN",
      subtitle: "Speed-of-Light Latency Triangulation",
      icon: Activity,
      color: "from-amber-600 to-orange-500",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      what: "Analyzes timestamps in the 'Received' header chain and calculates physical propagation delays between server coordinates using the speed of light in fiber optics.",
      why: "Scammers use VPNs and proxy chains to disguise their physical location. Physical latency physics exposes forged hops and co-located proxy nodes.",
      example: "Hop 1 claims origin in Moscow, Russia while Hop 2 is in New York, USA with an impossible timestamp difference of 0.005 seconds. The platform flags a temporal speed-of-light violation."
    },
    {
      num: "04",
      title: "The Polygraph",
      subtitle: "Stylometry & Neural Behavioral NLP",
      icon: Brain,
      color: "from-purple-600 to-indigo-500",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      what: "Multi-task transformer ensemble measures urgency, fear, authority framing, and synthetic LLM-generated language characteristics.",
      why: "Catches sophisticated Business Email Compromise (BEC) and executive impersonation where no malicious attachments or links exist.",
      example: "An email from 'CEO@company.com' urgently requests a $50k wire transfer before a flight. The AI flags linguistic pressure, display name mismatch, and brand lookalike typo 'company.c0m'."
    },
    {
      num: "05",
      title: "The String Board",
      subtitle: "Semantic Memory & Neo4j Attribution Graph",
      icon: Network,
      color: "from-indigo-600 to-blue-500",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      what: "ChromaDB vector database stores high-dimensional embeddings of all phishing lures, while Neo4j clusters entities into unified crime syndicates.",
      why: "Even if an attacker rotates their domain, email, and IP, the mathematical syntax of their lure matches past campaigns stored in vector memory.",
      example: "Attacker A targets finance from Nigeria; a month later, Attacker B sends a lure from Brazil. ChromaDB identifies a 98% semantic match, merging both incidents into a single organized campaign cluster."
    },
    {
      num: "06",
      title: "Active Defense",
      subtitle: "Autonomous ScamBaiter & Tracking Beacon",
      icon: ShieldAlert,
      color: "from-rose-600 to-red-500",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      what: "For high-confidence BEC attacks, the platform wakes up the autonomous ScamBaiter agent to auto-reply with realistic delay lures and an embedded 1x1 tracking beacon.",
      why: "Transitions security from passive defense to active attacker deanonymization and resource exhaustion.",
      example: "The AI replies: 'Accounting portal says routing number is invalid. Can you provide an updated PDF with SWIFT code?' When the attacker opens it on mobile, the tracking pixel fires, capturing their real physical IP and device fingerprint."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Platform Forensic Playbook & Master Architecture
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  v1.0 Standard
                </span>
              </h2>
              <p className="text-xs text-slate-400">Complete end-to-end investigation methodology & enterprise pipeline</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          
          {/* Master Workflow Banner */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              The Master Investigation Flow
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-0.5">STEP 1</span>
                <span className="font-semibold text-white block text-[11px]">Blockchain Seal</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-0.5">STEP 2</span>
                <span className="font-semibold text-white block text-[11px]">Vision & OCR</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-mono text-amber-400 font-bold block mb-0.5">STEP 3</span>
                <span className="font-semibold text-white block text-[11px]">Origin Triangulation</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-mono text-purple-400 font-bold block mb-0.5">STEP 4</span>
                <span className="font-semibold text-white block text-[11px]">NLP & Polygraph</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-mono text-blue-400 font-bold block mb-0.5">STEP 5</span>
                <span className="font-semibold text-white block text-[11px]">String Board Graph</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-mono text-rose-400 font-bold block mb-0.5">STEP 6</span>
                <span className="font-semibold text-white block text-[11px]">Active Defense</span>
              </div>
            </div>
          </div>

          {/* 6 Core Investigation Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-3 flex flex-col justify-between hover:border-slate-600 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-lg bg-gradient-to-tr ${s.color} text-white shadow-md`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">{s.title}</h4>
                          <span className="text-[11px] text-slate-400">{s.subtitle}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${s.badgeColor}`}>
                        STEP {s.num}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300 pt-1">
                      <p className="leading-relaxed"><strong className="text-slate-200">How it works:</strong> {s.what}</p>
                      <p className="leading-relaxed"><strong className="text-indigo-300">Why it matters:</strong> {s.why}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/60 text-[11px] font-mono text-slate-400 space-y-1">
                    <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider font-sans">Real-World Scenario:</span>
                    <p className="text-slate-300 leading-relaxed font-sans italic">"{s.example}"</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enterprise Infrastructure Summary */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Decoupled Docker Enterprise Infrastructure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
                <span className="text-white font-bold block">1. FastAPI Core</span>
                <p className="text-slate-400 text-[11px]">Async orchestration server executing OCR, headers, and risk engines.</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
                <span className="text-white font-bold block">2. React + Tailwind</span>
                <p className="text-slate-400 text-[11px]">Real-time single-pane SOC dashboard with Leaflet geolocation maps.</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
                <span className="text-white font-bold block">3. Apache Kafka</span>
                <p className="text-slate-400 text-[11px]">Asynchronous event bus streaming high-velocity telemetry across microservices.</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
                <span className="text-white font-bold block">4. Neo4j & ChromaDB</span>
                <p className="text-slate-400 text-[11px]">Attribution graph topology and vector semantic memory for crime rings.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
