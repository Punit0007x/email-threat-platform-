import React from 'react';
import { ShieldAlert, CheckCircle, ArrowRight, Activity, Globe } from 'lucide-react';

export default function RelayHopVisualizer({ data }) {
  const hops = data?.trace?.hops || [];
  const solAnomalies = data?.trace?.sol_anomalies || [];

  if (!hops || hops.length === 0) return null;

  return (
    <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 font-mono">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Animated Relay Stream & Speed-of-Light Physics
          </h4>
        </div>
        <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
          {hops.length} Total Relays
        </span>
      </div>

      {/* Animated Hop Pipeline */}
      <div className="relative py-3 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max pb-2">
          {hops.map((hop, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === hops.length - 1;
            const hasAnomaly = solAnomalies.some(a => a.hop_index === idx || a.hop_from === hop.ip || a.hop_to === hop.ip);

            return (
              <React.Fragment key={idx}>
                {/* Hop Node */}
                <div className={`relative p-3.5 rounded-xl border flex flex-col justify-between w-48 shadow-md transition-all ${
                  hasAnomaly 
                    ? 'bg-rose-950/30 border-rose-500/50 text-rose-300' 
                    : isFirst
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                    : 'bg-slate-900/90 border-slate-700/80 text-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800 pb-1.5 mb-1.5">
                    <span className="font-bold flex items-center gap-1">
                      {isFirst ? 'HOP 0 (ORIGIN)' : isLast ? `HOP ${idx} (FINAL)` : `HOP ${idx}`}
                    </span>
                    {hasAnomaly ? (
                      <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded border border-rose-500/30">
                        ANOMALY
                      </span>
                    ) : (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>

                  <div className="font-mono text-xs font-bold truncate text-white">
                    {hop.ip || 'Unknown IP'}
                  </div>

                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {hop.by_host || hop.from_host || 'Relay Server'}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5 text-cyan-400" />
                      {hop.geo?.country || 'Unknown'}
                    </span>
                    <span>{hop.delay_seconds !== undefined ? `${hop.delay_seconds.toFixed(1)}s` : '0s'}</span>
                  </div>
                </div>

                {/* Animated Connecting Arrow with Flowing Pulses */}
                {!isLast && (
                  <div className="flex flex-col items-center justify-center px-1 relative">
                    <div className="w-8 h-0.5 bg-cyan-500/30 relative overflow-hidden rounded">
                      <div className="absolute inset-y-0 w-3 bg-cyan-400 animate-[pulse_1s_infinite] rounded-full shadow-sm shadow-cyan-400" 
                           style={{ animation: 'laser-sweep 1.2s infinite ease-in-out' }} />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 -mt-1.5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Physics Anomaly Warning */}
      {solAnomalies.length > 0 && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <strong className="text-rose-300 font-mono block">SPEED-OF-LIGHT PHYSICAL IMPOSSIBILITY DETECTED</strong>
            <span>Packets traveled between geographical relay hops faster than the speed of light in optical fiber (c &approx; 200,000 km/s). This confirms header timestamp tampering or proxy spoofing.</span>
          </div>
        </div>
      )}
    </div>
  );
}
