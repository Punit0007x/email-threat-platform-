import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function FraudScorePanel({ data }) {
  if (!data || !data.fraud_assessment) return null;
  const { score, risk_level, reasons } = data.fraud_assessment;

  let colorClass = "text-emerald-500";
  let bgClass = "bg-emerald-500/10";
  let borderClass = "border-emerald-500/20";
  let Icon = CheckCircle;

  if (score > 70) {
    colorClass = "text-red-500";
    bgClass = "bg-red-500/10";
    borderClass = "border-red-500/20";
    Icon = AlertTriangle;
  } else if (score > 30) {
    colorClass = "text-amber-500";
    bgClass = "bg-amber-500/10";
    borderClass = "border-amber-500/20";
    Icon = Info;
  }

  return (
    <div className={`border ${borderClass} ${bgClass} rounded-2xl p-8 shadow-xl`}>
      <div className="flex flex-col md:flex-row items-center gap-8">
        
        {/* Score Circle */}
        <div className="flex flex-col items-center justify-center">
          <div className={`relative flex items-center justify-center w-40 h-40 rounded-full border-8 ${borderClass} bg-slate-900 shadow-inner`}>
            <div className={`text-5xl font-black ${colorClass}`}>
              {score}
            </div>
            <div className="absolute bottom-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
              / 100
            </div>
          </div>
          <div className={`mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-sm ${colorClass} bg-slate-900/50`}>
            <Icon className="w-5 h-5" />
            {risk_level} RISK
          </div>
        </div>

        {/* Reasons List */}
        <div className="flex-1 w-full bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
            Analysis Reasoning
          </h3>
          <ul className="space-y-3">
            {reasons && reasons.length > 0 ? (
              reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start">
                  <span className={`mt-1 mr-3 flex-shrink-0 w-2 h-2 rounded-full ${score > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-slate-300 leading-relaxed">{reason}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic">No specific risk indicators found.</li>
            )}
          </ul>
        </div>
        
      </div>
    </div>
  );
}
