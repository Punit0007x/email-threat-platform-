import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, AlertTriangle, Activity, Settings, Zap, Shield, ShieldAlert, Cpu, Globe } from 'lucide-react';
import CyberGlobe from './CyberGlobe';

const LOG_DATA = [
  { id: 1, time: '14:23:01', ip: '185.15.59.2', event: 'Suspicious Relay Hop', severity: 'amber' },
  { id: 2, time: '14:23:05', ip: '45.22.11.9', event: 'Failed DKIM Signature', severity: 'red' },
  { id: 3, time: '14:23:12', ip: '192.168.1.1', event: 'Benign Internal Routing', severity: 'green' },
  { id: 4, time: '14:23:18', ip: '89.123.45.67', event: 'Multi-Hop Anomaly', severity: 'amber' },
  { id: 5, time: '14:23:21', ip: '114.114.114.114', event: 'Known Botnet IP', severity: 'red' },
];

const DashboardView = () => {
  return (
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col pt-24 pb-8 px-6">
      <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-1 flex flex-col overflow-hidden relative">
        
        {/* Header HUD */}
        <div className="flex items-center justify-between border-b border-gray-200/50 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="text-[#0f172a] w-6 h-6" />
            <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">Global Tactical Dashboard</h2>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider">All Systems Operational</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 flex-1">
          {/* Left Column - Telemetry */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 border border-white/80 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">Active Nodes</span>
                </div>
                <div className="text-3xl font-black text-gray-800">1,248</div>
              </div>
              <div className="bg-white/60 border border-white/80 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">Critical Threats</span>
                </div>
                <div className="text-3xl font-black text-gray-800">14</div>
              </div>
            </div>

            <div className="bg-white/60 border border-white/80 rounded-2xl p-5 shadow-sm flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-gray-500">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Live Attack Log</span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                <AnimatePresence>
                  {LOG_DATA.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/40 border border-white/60 p-3 rounded-lg flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-mono">{log.time}</span>
                        <span className="font-mono font-bold text-gray-700">{log.ip}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        log.severity === 'red' ? 'bg-red-100 text-red-700' :
                        log.severity === 'amber' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
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
          <div className="col-span-12 lg:col-span-7 bg-white/60 backdrop-blur-xl rounded-3xl overflow-hidden relative shadow-lg border border-gray-200">
             <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                <Globe className="w-4 h-4 text-slate-800" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Global Threat Topography</span>
             </div>
             <CyberGlobe />
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;
