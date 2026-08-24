import React from 'react';
import CyberGlobeCanvas from './CyberGlobe';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, AlertTriangle, ShieldCheck, Settings, Activity, Server, Database } from 'lucide-react';

const mockLogs = [
  { id: 1, time: '10:42:01', source: '192.168.1.100', type: 'DDoS Attempt', status: 'Blocked', color: 'text-green-600' },
  { id: 2, time: '10:42:05', source: '45.33.22.11', type: 'SQL Injection', status: 'Flagged', color: 'text-amber-600' },
  { id: 3, time: '10:42:15', source: '10.0.0.5', type: 'Brute Force', status: 'Blocked', color: 'text-green-600' },
  { id: 4, time: '10:42:22', source: '198.51.100.24', type: 'Phishing Vector', status: 'Critical', color: 'text-red-600' },
];

export default function DashboardView() {
  return (
    <div className="flex w-full min-h-[800px] bg-white/20 backdrop-blur-xl text-slate-800 rounded-2xl overflow-hidden border border-white/40 shadow-xl">
      {/* Fixed Left Vertical Navigation */}
      <div className="w-20 bg-white/40 border-r border-white/50 flex flex-col items-center py-6 space-y-8 flex-shrink-0">
        <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-md mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <button className="p-3 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors tooltip" title="Dashboard">
          <LayoutDashboard className="w-5 h-5" />
        </button>
        <button className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors tooltip" title="Alerts">
          <AlertTriangle className="w-5 h-5" />
        </button>
        <button className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors tooltip" title="Activity">
          <Activity className="w-5 h-5" />
        </button>
        <div className="flex-grow"></div>
        <button className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors tooltip" title="Settings">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area (2-column layout) */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Global Tactical Dashboard</h1>
            <p className="text-sm text-slate-500">Live Enterprise Security Platform</p>
          </div>
          <div className="flex gap-4">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              All Systems Operational
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Analytical HUD & Live Logs */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Top Stats HUD Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Server className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Active Nodes</span>
                </div>
                <div className="text-3xl font-bold text-slate-800">1,248</div>
                <div className="text-xs text-green-600 font-semibold mt-1">+12% from yesterday</div>
              </div>
              <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold uppercase">Critical Threats</span>
                </div>
                <div className="text-3xl font-bold text-red-600">3</div>
                <div className="text-xs text-slate-500 font-semibold mt-1">Requiring attention</div>
              </div>
            </div>

            {/* Live Attack Log Table */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-slate-800">Live Attack Log</h3>
                </div>
                <span className="text-xs font-semibold text-slate-400">Auto-refreshing</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <div className="min-w-full text-xs text-left px-2 mb-2 font-semibold text-slate-400 grid grid-cols-4 uppercase tracking-wider">
                  <div>Time</div>
                  <div>Source IP</div>
                  <div>Vector</div>
                  <div>Status</div>
                </div>
                <div className="space-y-1">
                  <AnimatePresence>
                    {mockLogs.map(log => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        key={log.id} 
                        className="grid grid-cols-4 px-2 py-2.5 text-xs font-mono rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100"
                      >
                        <div className="text-slate-500">{log.time}</div>
                        <div className="font-semibold text-slate-700">{log.source}</div>
                        <div className="text-slate-600">{log.type}</div>
                        <div className={`font-semibold ${log.color}`}>{log.status}</div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Cyber Globe */}
          <div className="lg:col-span-7">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col relative p-4">
              <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-sm">
                  Global Threat Topography
                </h3>
              </div>
              <div className="flex-1 w-full rounded-xl overflow-hidden relative">
                <CyberGlobeCanvas />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
