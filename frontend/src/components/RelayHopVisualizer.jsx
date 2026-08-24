import React from 'react';
import { ShieldAlert, CheckCircle, ArrowRight, Activity, Globe, Server, Clock } from 'lucide-react';

export default function RelayHopVisualizer({ data }) {
  const hops = data?.trace?.hops || [];
  const solAnomalies = data?.trace?.sol_anomalies || [];

  if (!hops || hops.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Speed-of-light Anomaly Banner */}
      {solAnomalies.length > 0 && (
        <div className="slot-recessed p-4 flex items-start gap-3 border-l-4 border-l-[#ef4444] animate-pulse">
          <ShieldAlert className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#d63031] font-mono">
              Speed-of-Light Physical Relay Violation Detected ({solAnomalies.length})
            </h4>
            <p className="text-xs text-[#0f172a] font-medium leading-relaxed font-sans">
              Packets traveled between geographical relay hops faster than the speed of light in optical fiber (c &approx; 200,000 km/s). This confirms header timestamp tampering or injected proxy headers.
            </p>
          </div>
        </div>
      )}

      {/* Industrial Mechanical Relay Pipe Pipeline */}
      <div className="slot-recessed p-4 sm:p-6 overflow-x-auto">
        <div className="flex items-center min-w-max py-4 px-2">
          {hops.map((hop, idx) => {
            const isOrigin = idx === 0;
            const isDestination = idx === hops.length - 1;
            const hasAnomaly = solAnomalies.some(a => a.hop_index === idx || a.hop_from === hop.ip || a.hop_to === hop.ip);

            return (
              <React.Fragment key={idx}>
                {/* Relay Node */}
                <div className="flex flex-col items-center group relative">
                  
                  {/* Node Capsule */}
                  <div className={`p-3.5 rounded-2xl transition-all border flex flex-col items-center space-y-1.5 shadow-[var(--shadow-card)] relative min-w-40 ${
                    hasAnomaly 
                      ? 'bg-[#ef4444]/15 border-[#ef4444]/60 text-[#d63031]' 
                      : isOrigin 
                        ? 'bg-[#f8fafc] border-[#0ea5e9]/50 text-[#0284c7]' 
                        : isDestination 
                          ? 'bg-[#f8fafc] border-[#10b981]/50 text-[#047857]' 
                          : 'bg-[#f8fafc] border-[#e2e8f0] text-[#0f172a]'
                  }`}>
                    <div className="flex items-center justify-between w-full font-mono text-[10px] font-bold border-b border-[#e2e8f0]/50 pb-1">
                      <span className="flex items-center gap-1">
                        <Server className="w-3 h-3" />
                        {isOrigin ? 'HOP 0 (ORIGIN)' : isDestination ? `HOP ${idx} (FINAL)` : `HOP ${idx}`}
                      </span>
                      {hasAnomaly ? (
                        <span className="text-[9px] bg-[#ef4444]/20 text-[#d63031] px-1.5 py-0.2 rounded border border-[#ef4444]/40 font-bold">
                          ANOMALY
                        </span>
                      ) : (
                        <CheckCircle className="w-3 h-3 text-[#059669]" />
                      )}
                    </div>

                    <div className="text-xs font-mono font-black tracking-tight text-[#0f172a] truncate w-full text-center">
                      {hop.ip || 'Unknown IP'}
                    </div>

                    <div className="text-[10px] font-sans text-[#64748b] font-semibold truncate max-w-[150px]">
                      {hop.by_host || hop.from_host || 'Relay Server'}
                    </div>

                    {/* Delay & Geo */}
                    <div className="w-full pt-1 border-t border-[#e2e8f0]/50 flex items-center justify-between text-[9px] font-mono text-[#64748b]">
                      <span className="flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5 text-[#0ea5e9]" />
                        {hop.geo?.country || hop.country || 'Unknown'}
                      </span>
                      <span className="font-bold">{hop.delay_seconds !== undefined ? `+${hop.delay_seconds.toFixed(1)}s` : '0s'}</span>
                    </div>
                  </div>
                </div>

                {/* Mechanical Pipe Connector */}
                {!isDestination && (
                  <div className="flex items-center mx-2">
                    <div className="w-10 sm:w-14 h-2 mechanical-pipe relative flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5 text-[#ef4444] absolute" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
