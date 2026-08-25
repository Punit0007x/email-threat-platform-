import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, AlertTriangle, Activity, Settings, Zap, Shield, ShieldAlert, Cpu, Globe, Server } from 'lucide-react';
import CyberGlobe from './CyberGlobe';

const generateRandomIP = () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
const EVENTS = [
  { event: 'Suspicious Relay Hop', severity: 'amber' },
  { event: 'Failed DKIM Signature', severity: 'red' },
  { event: 'Benign Internal Routing', severity: 'green' },
  { event: 'Multi-Hop Anomaly', severity: 'amber' },
  { event: 'Known Botnet IP', severity: 'red' },
  { event: 'Spoofed Return-Path', severity: 'red' },
  { event: 'Valid SPF Record', severity: 'green' },
  { event: 'Zero-Day Pattern Match', severity: 'red' }
];

const DashboardView = () => {
  const [logs, setLogs] = useState([]);
  const [activeNodes, setActiveNodes] = useState(1248);
  const [criticalThreats, setCriticalThreats] = useState(14);

  useEffect(() => {
    // Initial populate
    const initialLogs = Array.from({ length: 5 }).map((_, i) => ({
      id: `init-${i}`,
      time: new Date(Date.now() - i * 5000).toLocaleTimeString('en-US', { hour12: false }),
      ip: generateRandomIP(),
      ...EVENTS[Math.floor(Math.random() * EVENTS.length)]
    })).reverse();
    setLogs(initialLogs);

    const interval = setInterval(() => {
      const newEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      const newLog = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        ip: generateRandomIP(),
        ...newEvent
      };

      setLogs(prev => [...prev.slice(-6), newLog]);
      
      // Jitter metrics
      setActiveNodes(prev => prev + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5));
      if (newEvent.severity === 'red') setCriticalThreats(prev => prev + 1);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col px-4 sm:px-8 xl:px-12 pt-28 pb-8 max-w-[1600px] mx-auto">
      <div className="backdrop-blur-2xl bg-white/40 border border-white/60 rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex-1 flex flex-col overflow-hidden relative">
        
        {/* Header HUD */}
        <div className="flex items-center justify-between border-b border-gray-200/50 pb-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0f172a] rounded-xl shadow-lg">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Global Tactical Dashboard</h2>
          </div>
          <div className="flex items-center gap-2.5 bg-[#10b981]/15 px-4 py-2 rounded-full border border-[#10b981]/30">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[11px] font-black text-[#047857] uppercase tracking-widest font-mono">All Systems Operational</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 flex-1">
          {/* Left Column - Telemetry */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 border border-white/80 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                <div className="flex items-center gap-2 mb-3 text-[#64748b]">
                  <Server className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest font-mono">Monitored Nodes</span>
                </div>
                <div className="text-4xl font-black text-[#0f172a] tracking-tighter">{activeNodes.toLocaleString()}</div>
              </div>

              <div className="bg-white/60 border border-white/80 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
                <div className="flex items-center gap-2 mb-3 text-[#64748b]">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest font-mono">Critical Threats</span>
                </div>
                <div className="text-4xl font-black text-[#0f172a] tracking-tighter">{criticalThreats.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-[#f8fafc] border border-[#e2e8f0]/60 rounded-[1.5rem] p-6 shadow-inner flex-1 flex flex-col relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-[#64748b]">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest font-mono">Live Attack Telemetry</span>
                </div>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }}/>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }}/>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}/>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {logs.map((log) => (
                    <motion.div 
                      key={log.id}
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="bg-white/80 border border-[#e2e8f0] p-3.5 rounded-xl flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-[#94a3b8] font-mono font-semibold">{log.time}</span>
                        <span className="font-mono font-bold text-[#0f172a] text-xs">{log.ip}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                        log.severity === 'red' ? 'bg-[#ef4444]/15 text-[#d63031] border-[#ef4444]/30' :
                        log.severity === 'amber' ? 'bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/30' :
                        'bg-[#10b981]/15 text-[#047857] border-[#10b981]/30'
                      }`}>
                        {log.event}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            
          </div>

          {/* Right Column - 3D Globe */}
          <div className="col-span-12 lg:col-span-7 bg-[#0f172a] rounded-[2rem] overflow-hidden relative shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] border border-[#1e293b]">
             <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/20 shadow-lg">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">Global Threat Topography</span>
             </div>
             
             {/* Dynamic scan line overlay for sci-fi effect */}
             <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] z-0"></div>
             
             <div className="relative z-10 w-full h-full transform scale-110">
               <CyberGlobe interactive={true} />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;
