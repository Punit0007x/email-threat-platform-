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
      color: "bg-[#10b981]/15 text-[#047857] border border-[#10b981]/30",
      badgeColor: "bg-[#10b981]/15 text-[#047857] border-[#10b981]/30",
      what: "Before analysis begins, the raw email code is locked with a SHA-256 digest and recorded onto a local Ethereum blockchain ledger.",
      why: "Ensures legal admissibility in court and insurance fraud claims by proving mathematically that the evidence has never been tampered with or modified.",
      example: "A CFO receives a fake invoice. The platform instantly notarizes the evidence before the user even opens the email."
    },
    {
      num: "02",
      title: "The X-Ray",
      subtitle: "Multi-Modal Computer Vision & QR Detonation",
      icon: Scan,
      color: "bg-[#0ea5e9]/15 text-[#0369a1] border border-[#0ea5e9]/30",
      badgeColor: "bg-[#0ea5e9]/15 text-[#0369a1] border-[#0ea5e9]/30",
      what: "Tesseract OCR extracts text embedded in image screenshots or PDF attachments, and computer vision engines detonate hidden QR codes.",
      why: "Threat actors often bypass traditional text scanners by embedding text in images or tricking users into scanning QR codes on mobile devices.",
      example: "An email with zero body text contains an attached image stating: 'Password Expired. Scan QR code.' The OCR engine extracts the text, detonates the QR URL, and flags the phishing domain."
    },
    {
      num: "03",
      title: "Breaking the VPN",
      subtitle: "Speed-of-Light Latency Triangulation",
      icon: Activity,
      color: "bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/30",
      badgeColor: "bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/30",
      what: "Analyzes timestamps in the 'Received' header chain and calculates physical propagation delays between server coordinates using the speed of light in fiber optics.",
      why: "Scammers use VPNs and proxy chains to disguise their physical location. Physical latency physics exposes forged hops and co-located proxy nodes.",
      example: "Hop 1 claims origin in Moscow, Russia while Hop 2 is in New York, USA with an impossible timestamp difference of 0.005 seconds. The platform flags a temporal speed-of-light violation."
    },
    {
      num: "04",
      title: "The Polygraph",
      subtitle: "Stylometry & Neural Behavioral NLP",
      icon: Brain,
      color: "bg-[#7048e8]/15 text-[#5f3dc4] border border-[#7048e8]/30",
      badgeColor: "bg-[#7048e8]/15 text-[#5f3dc4] border-[#7048e8]/30",
      what: "Multi-task transformer ensemble measures urgency, fear, authority framing, and synthetic LLM-generated language characteristics.",
      why: "Catches sophisticated Business Email Compromise (BEC) and executive impersonation where no malicious attachments or links exist.",
      example: "An email from 'CEO@company.com' urgently requests a $50k wire transfer before a flight. The AI flags linguistic pressure, display name mismatch, and brand lookalike typo 'company.c0m'."
    },
    {
      num: "05",
      title: "The String Board",
      subtitle: "Semantic Memory & Neo4j Attribution Graph",
      icon: Network,
      color: "bg-[#0ea5e9]/15 text-[#0369a1] border border-[#0ea5e9]/30",
      badgeColor: "bg-[#0ea5e9]/15 text-[#0369a1] border-[#0ea5e9]/30",
      what: "ChromaDB vector database stores high-dimensional embeddings of all phishing lures, while Neo4j clusters entities into unified crime syndicates.",
      why: "Even if an attacker rotates their domain, email, and IP, the mathematical syntax of their lure matches past campaigns stored in vector memory.",
      example: "Attacker A targets finance from Nigeria; a month later, Attacker B sends a lure from Brazil. ChromaDB identifies a 98% semantic match, merging both incidents into a single organized campaign cluster."
    },
    {
      num: "06",
      title: "Active Defense",
      subtitle: "Autonomous ScamBaiter & Tracking Beacon",
      icon: ShieldAlert,
      color: "bg-[#ef4444]/15 text-[#d63031] border border-[#ef4444]/30",
      badgeColor: "bg-[#ef4444]/15 text-[#d63031] border-[#ef4444]/30",
      what: "For high-confidence BEC attacks, the platform wakes up the autonomous ScamBaiter agent to auto-reply with realistic delay lures and an embedded 1x1 tracking beacon.",
      why: "Transitions security from passive defense to active attacker deanonymization and resource exhaustion.",
      example: "The AI replies: 'Accounting portal says routing number is invalid. Can you provide an updated PDF with SWIFT code?' When the attacker opens it on mobile, the tracking pixel fires, capturing their real physical IP and device fingerprint."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="panel-chassis w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#e2e8f0] relative">
        
        {/* Corner Screws */}
        <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
        <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
        <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
        <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f8fafc] bg-[#ffffff]">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-[#ffffff] text-[#7048e8] rounded-xl shadow-[var(--shadow-card)] border border-white/70">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a] flex items-center gap-2 font-mono">
                Platform Forensic Playbook & Architecture
                <span className="text-[10px] font-mono bg-[#7048e8]/15 text-[#5f3dc4] px-2 py-0.5 rounded border border-[#7048e8]/30 font-bold">
                  v1.0 Standard
                </span>
              </h2>
              <p className="text-xs text-[#64748b]">Complete end-to-end investigation methodology & enterprise pipeline</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#64748b] hover:text-[#0f172a] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#0f172a]">
          
          {/* Master Workflow Banner */}
          <div className="slot-recessed p-5 space-y-3 bg-[#f8fafc]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7048e8] flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4" />
              The Master Investigation Flow
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-[#ffffff] p-2.5 rounded-xl border border-[#e2e8f0] shadow-sm">
                <span className="text-[10px] font-mono text-[#047857] font-bold block mb-0.5">STEP 1</span>
                <span className="font-bold text-[#0f172a] block text-[11px]">Blockchain Seal</span>
              </div>
              <div className="bg-[#ffffff] p-2.5 rounded-xl border border-[#e2e8f0] shadow-sm">
                <span className="text-[10px] font-mono text-[#0369a1] font-bold block mb-0.5">STEP 2</span>
                <span className="font-bold text-[#0f172a] block text-[11px]">Vision & OCR</span>
              </div>
              <div className="bg-[#ffffff] p-2.5 rounded-xl border border-[#e2e8f0] shadow-sm">
                <span className="text-[10px] font-mono text-[#b45309] font-bold block mb-0.5">STEP 3</span>
                <span className="font-bold text-[#0f172a] block text-[11px]">Origin Physics</span>
              </div>
              <div className="bg-[#ffffff] p-2.5 rounded-xl border border-[#e2e8f0] shadow-sm">
                <span className="text-[10px] font-mono text-[#5f3dc4] font-bold block mb-0.5">STEP 4</span>
                <span className="font-bold text-[#0f172a] block text-[11px]">NLP Polygraph</span>
              </div>
              <div className="bg-[#ffffff] p-2.5 rounded-xl border border-[#e2e8f0] shadow-sm">
                <span className="text-[10px] font-mono text-[#0369a1] font-bold block mb-0.5">STEP 5</span>
                <span className="font-bold text-[#0f172a] block text-[11px]">String Board</span>
              </div>
              <div className="bg-[#ffffff] p-2.5 rounded-xl border border-[#e2e8f0] shadow-sm">
                <span className="text-[10px] font-mono text-[#d63031] font-bold block mb-0.5">STEP 6</span>
                <span className="font-bold text-[#0f172a] block text-[11px]">Active Defense</span>
              </div>
            </div>
          </div>

          {/* 6 Core Investigation Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="slot-recessed p-5 space-y-3 flex flex-col justify-between bg-[#f8fafc]">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-xl ${s.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#0f172a] leading-tight font-mono">{s.title}</h4>
                          <span className="text-[11px] text-[#64748b]">{s.subtitle}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${s.badgeColor}`}>
                        STEP {s.num}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-[#64748b] pt-1">
                      <p className="leading-relaxed"><strong className="text-[#0f172a]">How it works:</strong> {s.what}</p>
                      <p className="leading-relaxed"><strong className="text-[#7048e8]">Why it matters:</strong> {s.why}</p>
                    </div>
                  </div>

                  <div className="bg-[#ffffff] p-3 rounded-xl border border-[#e2e8f0]/60 text-[11px] font-mono text-[#64748b] space-y-1">
                    <span className="text-[#64748b] font-bold block text-[10px] uppercase tracking-wider font-mono">Real-World Scenario:</span>
                    <p className="text-[#0f172a] leading-relaxed font-sans italic font-medium">"{s.example}"</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enterprise Infrastructure Summary */}
          <div className="slot-recessed p-5 space-y-3 bg-[#f8fafc]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2 font-mono">
              <Server className="w-4 h-4 text-[#059669]" />
              Decoupled Docker Enterprise Infrastructure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#ffffff] p-3 rounded-xl border border-[#e2e8f0] space-y-1 shadow-sm">
                <span className="text-[#0f172a] font-bold block font-mono">1. FastAPI Core</span>
                <p className="text-[#64748b] text-[11px]">Async orchestration server executing OCR, headers, and risk engines.</p>
              </div>
              <div className="bg-[#ffffff] p-3 rounded-xl border border-[#e2e8f0] space-y-1 shadow-sm">
                <span className="text-[#0f172a] font-bold block font-mono">2. React + Tailwind</span>
                <p className="text-[#64748b] text-[11px]">Tactile skeuomorphic SOC workstation dashboard with live telemetry.</p>
              </div>
              <div className="bg-[#ffffff] p-3 rounded-xl border border-[#e2e8f0] space-y-1 shadow-sm">
                <span className="text-[#0f172a] font-bold block font-mono">3. Apache Kafka</span>
                <p className="text-[#64748b] text-[11px]">Asynchronous event bus streaming high-velocity telemetry across microservices.</p>
              </div>
              <div className="bg-[#ffffff] p-3 rounded-xl border border-[#e2e8f0] space-y-1 shadow-sm">
                <span className="text-[#0f172a] font-bold block font-mono">4. Neo4j & ChromaDB</span>
                <p className="text-[#64748b] text-[11px]">Attribution graph topology and vector semantic memory for crime rings.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
