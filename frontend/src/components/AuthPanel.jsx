import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock } from 'lucide-react';

const getStatusBadge = (status) => {
  const s = (status || 'none').toLowerCase();
  if (s === 'pass') {
    return {
      text: 'PASS',
      color: 'bg-[#10b981]/15 text-[#047857] border-[#10b981]/30',
      icon: ShieldCheck,
      led: 'led-node-green'
    };
  } else if (s === 'fail' || s === 'hardfail') {
    return {
      text: 'FAIL',
      color: 'bg-[#ff4757]/15 text-[#d63031] border-[#ff4757]/30',
      icon: ShieldAlert,
      led: 'led-node-red'
    };
  } else if (s === 'softfail') {
    return {
      text: 'SOFTFAIL',
      color: 'bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/30',
      icon: AlertTriangle,
      led: 'led-node-amber'
    };
  }
  return {
    text: s.toUpperCase(),
    color: 'bg-[#e0e5ec] text-[#4a5568] border-[#babecc]',
    icon: Lock,
    led: 'led-node-off'
  };
};

export default function AuthPanel({ data }) {
  if (!data) return null;
  const auth = data.auth_analysis || data.auth_assessment || {};

  const protocols = [
    { name: 'SPF PROTOCOL', val: auth.spf || 'none', desc: 'Sender Policy Framework' },
    { name: 'DKIM SIGNATURE', val: auth.dkim || 'none', desc: 'DomainKeys Identified Mail' },
    { name: 'DMARC POLICY', val: auth.dmarc || 'none', desc: 'Domain Message Authentication' }
  ];

  return (
    <div className="space-y-4">
      {/* 3 Physical Protocol Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
        {protocols.map((p, idx) => {
          const badge = getStatusBadge(p.val);
          const Icon = badge.icon;

          return (
            <div key={idx} className="slot-recessed p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#4a5568] font-bold uppercase tracking-wider">{p.name}</span>
                <span className={`led-node ${badge.led}`} />
              </div>
              <div className="flex items-center justify-between">
                <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${badge.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{badge.text}</span>
                </div>
                <span className="text-[10px] text-[#4a5568] font-sans font-medium">{p.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DMARC Alignment Alert */}
      {auth.dmarc_alignment === false && (
        <div className="slot-recessed p-3.5 flex items-center gap-2.5 border-l-4 border-l-[#ff4757] text-xs text-[#d63031] font-mono">
          <ShieldAlert className="w-4 h-4 text-[#ff4757] flex-shrink-0" />
          <span><strong>DMARC Alignment Breach:</strong> Header 'From' domain does not align with verified SPF / DKIM signing identities.</span>
        </div>
      )}
    </div>
  );
}
