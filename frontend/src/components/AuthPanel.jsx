import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';

const StatusBadge = ({ protocol, status }) => {
  let bgColor = "bg-slate-700";
  let textColor = "text-slate-300";
  let Icon = ShieldQuestion;
  let label = status.toUpperCase();

  if (status === "pass") {
    bgColor = "bg-emerald-500/20";
    textColor = "text-emerald-400";
    Icon = ShieldCheck;
  } else if (status === "fail" || status === "softfail") {
    bgColor = "bg-red-500/20";
    textColor = "text-red-400";
    Icon = ShieldAlert;
  } else if (status === "none" || status === "not_present") {
    bgColor = "bg-slate-700/50";
    textColor = "text-slate-400";
    label = "NONE";
  }

  return (
    <div className="flex flex-col items-center p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
      <div className="text-sm font-semibold text-slate-400 mb-3">{protocol.toUpperCase()}</div>
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${bgColor} ${textColor}`}>
        <Icon className="w-5 h-5" />
        <span className="font-bold tracking-wider">{label}</span>
      </div>
    </div>
  );
};

export default function AuthPanel({ data }) {
  if (!data || !data.auth_analysis) return null;
  const auth = data.auth_analysis;

  return (
    <div className="cyber-panel rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden">
      <div className="flex items-center mb-6 border-b border-zinc-800 pb-3">
        <span className="bg-purple-500/10 text-purple-400 p-2.5 rounded-xl mr-3 border border-purple-500/20 shadow-sm">
          <Shield className="w-5 h-5" />
        </span>
        <h2 className="text-xl font-bold text-white">Authentication Protocols</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatusBadge protocol="SPF" status={auth.spf} />
        <StatusBadge protocol="DKIM" status={auth.dkim} />
        <StatusBadge protocol="DMARC" status={auth.dmarc} />
      </div>

      {/* Domain Alignment Alert */}
      {!auth.domain_alignment_pass && (
        <div className="flex items-start space-x-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-500">Domain Alignment Failure</h4>
            <p className="text-xs text-amber-400/80 mt-1">
              The Return-Path domain does not match the From domain. This is a common technique used in spoofing attacks to bypass authentication checks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
