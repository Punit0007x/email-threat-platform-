import React, { useState, useEffect } from 'react';
import { Zap, Radar, Terminal, CheckCircle2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-3xl p-8 rounded-3xl bg-[#0F1319] shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden space-y-6 border border-yellow-500/20">
        
        {/* Subtle Gold Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(234, 179, 8, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(234, 179, 8, 0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Top Header */}
        <div className="relative flex items-center justify-between border-b border-yellow-500/10 pb-4 px-1">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-yellow-950/30 text-yellow-500 rounded-2xl shadow-[0_0_10px_rgba(234,179,8,0.2)] border border-yellow-500/30 relative">
              <Radar className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 tracking-wider flex items-center gap-2 font-mono drop-shadow-sm">
                ANALYZING THREAT VECTOR
              </h3>
              <p className="text-xs text-yellow-600/60 font-mono tracking-wide">Deep Neural Forensic Extraction in Progress</p>
            </div>
          </div>

          <span className="font-mono text-4xl font-bold text-yellow-500 drop-shadow-sm">
            {Math.min(100, progress)}<span className="text-2xl text-yellow-700/80">%</span>
          </span>
        </div>

        {/* Subtle Gold Progress Bar */}
        <div className="relative space-y-2 px-1">
          <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-yellow-900/30">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 transition-all duration-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {/* Terminal Telemetry Log Box */}
        <div className="relative bg-black/40 rounded-2xl p-6 font-mono text-xs space-y-3 h-56 overflow-y-auto border border-yellow-500/10 shadow-inner">
          <div className="text-yellow-700 flex items-center gap-2 text-[12px] pb-3 border-b border-yellow-900/30 font-bold uppercase tracking-wider sticky top-0 bg-black/60 z-10">
            <Terminal className="w-4 h-4 text-yellow-600" />
            Live Telemetry Execution Pipeline:
          </div>

          {SCAN_STEPS.slice(0, currentStep + 1).map((step, idx) => {
            const isLatest = idx === currentStep;
            return (
              <div key={idx} className={`flex items-center gap-3 transition-all duration-300 ${isLatest ? 'text-yellow-500 font-bold drop-shadow-sm scale-100 opacity-100' : 'text-slate-600 scale-95 opacity-50'}`}>
                {isLatest ? (
                  <Zap className="w-4 h-4 text-yellow-500 animate-spin flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-yellow-800/50 flex-shrink-0" />
                )}
                <span className="truncate tracking-wide">{step}</span>
              </div>
            );
          })}
        </div>

        <div className="relative text-center pt-2">
          <span className="text-[10px] text-yellow-800/60 font-mono font-medium tracking-wide flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-600/80"></div>
            Forensically sealed on local Ethereum blockchain notary ledger
          </span>
        </div>

      </div>
    </div>
  );
}
