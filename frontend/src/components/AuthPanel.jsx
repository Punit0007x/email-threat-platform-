import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock } from 'lucide-react';

const getStatusBadge = (status) => {
  const s = (status || 'none').toLowerCase();
  if (s === 'pass') {
    return {
      text: 'PASS',
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: ShieldCheck,
      led: 'bg-green-500'
    };
  } else if (s === 'fail' || s === 'hardfail') {
    return {
      text: 'FAIL',
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: ShieldAlert,
      led: 'bg-red-500'
    };
  } else if (s === 'softfail') {
    return {
      text: 'SOFT FAIL',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      led: 'bg-amber-500'
    };
  }
  return {
    text: s.toUpperCase(),
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Lock,
    led: 'bg-gray-400'
  };
};

export default function AuthPanel({ data }) {
  if (!data) return null;
  const auth = data.auth_analysis || data.auth_assessment || {};

  const protocols = [
    { name: 'SPF Check', val: auth.spf || 'none', desc: 'Verifies Sender IP' },
    { name: 'DKIM Check', val: auth.dkim || 'none', desc: 'Verifies Digital Signature' },
    { name: 'DMARC Check', val: auth.dmarc || 'none', desc: 'Policy Enforcement' }
  ];

  return (
    <div className="space-y-4">
      {/* Authentication Checks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {protocols.map((p, idx) => {
          const badge = getStatusBadge(p.val);
          const Icon = badge.icon;

          return (
            <div key={idx} className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-semibold uppercase">{p.name}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${badge.led} shadow-sm`} />
              </div>
              <div className="flex items-center justify-between">
                <div className={`px-2.5 py-1 rounded-md border text-xs font-bold flex items-center gap-1.5 ${badge.color}`}>
                  <Icon className="w-4 h-4" />
                  <span>{badge.text}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 font-medium">{p.desc}</div>
            </div>
          );
        })}
      </div>

      {/* DMARC Alignment Alert */}
      {auth.dmarc_alignment === false && (
        <div className="bg-red-50 p-4 rounded-xl flex items-center gap-3 border-l-4 border-l-red-500 text-sm text-red-700">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span><strong>DMARC Mismatch:</strong> The sender's 'From' address does not match the actual verified sender.</span>
        </div>
      )}
    </div>
  );
}
