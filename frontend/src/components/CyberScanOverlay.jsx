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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="panel-chassis w-full max-w-2xl p-8 shadow-2xl relative overflow-hidden space-y-6 border border-[#e2e8f0]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#f8fafc] pb-4 px-1">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-700">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-wide flex items-center gap-2 font-mono">
                ANALYZING EMAIL STREAM
              </h3>
              <p className="text-xs text-slate-500 font-mono">Autonomous Forensics & Threat Extraction</p>
            </div>
          </div>

          <span className="font-mono text-2xl font-bold text-slate-900">
            {Math.min(100, progress)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 px-1">
          <div className="w-full slot-recessed h-4 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-slate-900 transition-all duration-200 shadow-sm"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {/* Terminal Telemetry Log Box */}
        <div className="bg-white rounded-2xl p-5 font-mono text-xs space-y-2.5 h-48 overflow-y-auto border border-slate-200 shadow-inner">
          <div className="text-slate-500 flex items-center gap-1.5 text-[11px] pb-1.5 border-b border-slate-200 font-bold uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-slate-900" />
            LIVE TELEMETRY EXECUTION PIPELINE:
          </div>

          {SCAN_STEPS.slice(0, currentStep + 1).map((step, idx) => {
            const isLatest = idx === currentStep;
            return (
              <div key={idx} className={`flex items-center gap-2 ${isLatest ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                {isLatest ? (
                  <Zap className="w-3.5 h-3.5 text-slate-900 animate-spin flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] flex-shrink-0" />
                )}
                <span className="truncate">{step}</span>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <span className="text-[11px] text-slate-500 font-mono font-bold">
            * Forensically sealed on local Ethereum blockchain notary ledger
          </span>
        </div>

      </div>
    </div>
  );
}
