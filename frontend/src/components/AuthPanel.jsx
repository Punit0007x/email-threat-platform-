import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock } from 'lucide-react';

const getStatusBadge = (status) => {
  const s = (status || 'none').toLowerCase();
  if (s === 'pass') {
    return {
      text: 'PASS',
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: ShieldCheck
    };
  } else if (s === 'fail' || s === 'hardfail') {
    return {
      text: 'FAIL',
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: ShieldAlert
    };
  } else if (s === 'softfail') {
    return {
      text: 'SOFT FAIL',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle
    };
  }
  return {
    text: s.toUpperCase(),
    color: 'bg-white/20 backdrop-blur-md text-slate-700 drop-shadow-sm border-white/40',
    icon: Lock
  };
};

export default function AuthPanel({ data }) {
  if (!data) return null;
  const auth = data.auth_analysis || data.auth_assessment || {};

  const protocols = [
    { name: 'SPF Record', val: auth.spf || 'none', desc: 'Sender Policy Framework' },
    { name: 'DKIM Signature', val: auth.dkim || 'none', desc: 'DomainKeys Identified Mail' },
    { name: 'DMARC Policy', val: auth.dmarc || 'none', desc: 'Domain Message Authentication' }
  ];

  return (
    <div className="bg-transparent space-y-6 relative overflow-hidden">
      <div className="bg-white/20 backdrop-blur-3xl border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_32px_rgba(31,38,135,0.07)] rounded-[2rem] p-6 space-y-6">
        <h3 className="text-lg font-bold text-slate-900 drop-shadow-sm border-b border-white/30 pb-3">Email Authentication Protocols</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {protocols.map((p, idx) => {
            const badge = getStatusBadge(p.val);
            const Icon = badge.icon;

            return (
              <div key={idx} className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 drop-shadow-sm">{p.name}</span>
                  <div className={`px-2.5 py-1 rounded-md border text-xs font-bold flex items-center gap-1.5 ${badge.color}`}>
                    <Icon className="w-4 h-4" />
                    <span>{badge.text}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-700 drop-shadow-sm font-medium block">{p.desc}</span>
              </div>
            );
          })}
        </div>

        {auth.dmarc_alignment === false && (
          <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-200 text-sm text-red-700">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              <strong>DMARC Alignment Failed:</strong> The 'From' domain in the email does not match the domains authorized by SPF or DKIM. This is a strong indicator of email spoofing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
