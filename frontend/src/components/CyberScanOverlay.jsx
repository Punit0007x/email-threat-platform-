import React, { useState, useEffect } from 'react';
import { Zap, Cpu, Terminal, CheckCircle2 } from 'lucide-react';

const SCAN_STEPS = [
  "PARSING RFC-822 MIME STREAM & MULTIPART HEADERS...",
  "EXTRACTING SENDER ROUTING HOPS & TIME DELAYS...",
  "CALCULATING SPEED-OF-LIGHT LATENCY GEOLOCATION...",
  "GENERATING SHA-256 INTEGRITY HASH & ETHEREUM CUSTODY SEAL...",
  "RUNNING TESSERACT COMPUTER VISION OCR & QR CODE DETONATION...",
  "EXECUTING NEURAL NLP & SYNTHETIC STYLOMETRY CLASSIFIER...",
  "CROSS-REFERENCING CHROMADB EMBEDDING THREAT MEMORY...",
  "SYNTHESIZING AUTONOMOUS SCAMBAITER TARPIT COUNTER-TRAP...",
  "ASSEMBLING MULTI-VECTOR FRAUD RISK DOSSIER..."
];

export default function CyberScanOverlay({ isOpen }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setCurrentStep(0);
    setProgress(10);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          return 95;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });

      setCurrentStep((prev) => {
        if (prev < SCAN_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-md">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Analyzing Email Stream
              </h3>
              <p className="text-xs text-zinc-400 font-mono">Autonomous Forensics & Threat Extraction</p>
            </div>
          </div>

          <span className="font-mono text-2xl font-bold text-blue-400">
            {Math.min(100, progress)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transition-all duration-200 shadow-lg shadow-cyan-500/50"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {/* Terminal Telemetry Log Box */}
        <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 font-mono text-xs space-y-2 shadow-inner h-44 overflow-y-auto">
          <div className="text-slate-500 flex items-center gap-1 text-[11px] pb-1 border-b border-slate-900">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            LIVE TELEMETRY EXECUTION PIPELINE:
          </div>

          {SCAN_STEPS.slice(0, currentStep + 1).map((step, idx) => {
            const isLatest = idx === currentStep;
            return (
              <div key={idx} className={`flex items-center gap-2 ${isLatest ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}>
                {isLatest ? (
                  <Zap className="w-3.5 h-3.5 text-cyan-400 animate-spin flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                )}
                <span className="truncate">{step}</span>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <span className="text-[11px] text-slate-500 font-mono">
            * Forensically sealed on local Ethereum blockchain notary ledger
          </span>
        </div>

      </div>
    </div>
  );
}
