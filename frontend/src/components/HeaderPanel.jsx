import React, { useState } from 'react';
import { Mail, AlignLeft, ShieldAlert, Layers } from 'lucide-react';

const THREAT_PATTERNS = [
  { 
    type: 'urgency', 
    regex: /\b(urgent|urgently|immediately|suspended|suspend|act now|closed|close|verify now|action required|limited time|expire|expired|warning)\b/i, 
    bg: 'bg-red-500/25 text-red-200 border border-red-500/40', 
    label: 'Urgency' 
  },
  { 
    type: 'financial', 
    regex: /\b(wire transfer|direct deposit|payroll|routing number|routing|bank account|invoice|swift code|paycheck|payment|remittance|gift card|crypto|wallet)\b/i, 
    bg: 'bg-purple-500/25 text-purple-200 border border-purple-500/40', 
    label: 'Financial / BEC' 
  },
  { 
    type: 'authority', 
    regex: /\b(ceo|chief executive officer|board meeting|confidential|offsite|do not process|management|admin|security team|director|president)\b/i, 
    bg: 'bg-amber-500/25 text-amber-200 border border-amber-500/40', 
    label: 'Authority Framing' 
  },
  { 
    type: 'url', 
    regex: /(https?:\/\/[^\s<>"']+)/i, 
    bg: 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 font-mono', 
    label: 'Hyperlink' 
  }
];

const COMBINED_REGEX = /(https?:\/\/[^\s<>"']+|\b(?:urgent|urgently|immediately|suspended|suspend|act now|closed|close|verify now|action required|limited time|expire|expired|warning|wire transfer|direct deposit|payroll|routing number|routing|bank account|invoice|swift code|paycheck|payment|remittance|gift card|crypto|wallet|ceo|chief executive officer|board meeting|confidential|offsite|do not process|management|admin|security team|director|president)\b)/gi;

function renderAnnotatedBody(text, highlightEnabled) {
  if (!text) return <span className="text-slate-500 italic">No message body text found in payload.</span>;
  if (!highlightEnabled) return text;

  const parts = text.split(COMBINED_REGEX);
  return parts.map((part, idx) => {
    if (!part) return null;
    for (const p of THREAT_PATTERNS) {
      if (p.regex.test(part)) {
        return (
          <mark
            key={idx}
            className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${p.bg} transition-all inline-block my-0.5 shadow-sm`}
            title={`${p.label} Signal`}
          >
            {part}
          </mark>
        );
      }
    }
    return part;
  });
}

export default function HeaderPanel({ data }) {
  const [viewTab, setViewTab] = useState('headers'); // 'headers' | 'body' | 'raw_hops'
  const [highlightThreats, setHighlightThreats] = useState(true);

  if (!data) return null;

  const rows = [
    { label: "From", value: data.from_address },
    { label: "Reply-To", value: data.reply_to },
    { label: "To", value: data.to_address },
    { label: "Subject", value: data.subject },
    { label: "Date", value: data.date },
    { label: "Message-ID", value: data.message_id },
    { label: "Return-Path", value: data.return_path },
  ];

  const hasReplyToMismatch = Boolean(
    data.reply_to && 
    data.from_address && 
    !data.reply_to.toLowerCase().includes((data.from_address.split('@')[1] || '---').toLowerCase().replace('>', '').trim())
  );

  return (
    <div className="cyber-panel rounded-2xl p-6 shadow-xl space-y-4 relative overflow-hidden">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center">
          <span className="bg-blue-500/10 text-blue-400 p-2 rounded-lg mr-3 border border-blue-500/20 shadow-sm">
            <Mail className="w-5 h-5" />
          </span>
          Email Payload & Headers
        </h2>

        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setViewTab('headers')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${viewTab === 'headers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Headers
          </button>
          <button
            onClick={() => setViewTab('body')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${viewTab === 'body' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <AlignLeft className="w-3 h-3" />
            Body Preview
          </button>
          <button
            onClick={() => setViewTab('raw_hops')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${viewTab === 'raw_hops' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-3 h-3" />
            Hops ({data.received_chain?.length || 0})
          </button>
        </div>
      </div>

      {/* Tab 1: Headers Table */}
      {viewTab === 'headers' && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-slate-700">
            <table className="min-w-full divide-y divide-slate-700 text-xs text-left">
              <tbody className="divide-y divide-slate-700 bg-slate-800/50 font-mono">
                {rows.map((row, idx) => {
                  if (!row.value && row.label === "Reply-To") return null;
                  const isReplyTo = row.label === "Reply-To";
                  return (
                    <tr key={idx} className="hover:bg-slate-750 transition-colors">
                      <th className="px-3.5 py-2.5 font-medium text-slate-400 w-1/4 bg-slate-800/80 font-sans">
                        {row.label}
                      </th>
                      <td className="px-3.5 py-2.5 text-slate-200 break-all text-[11px]">
                        <div className="flex items-center justify-between gap-2">
                          <span>{row.value || <span className="text-slate-500 italic font-sans">Not available</span>}</span>
                          {isReplyTo && hasReplyToMismatch && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex-shrink-0 font-sans">
                              <ShieldAlert className="w-3 h-3" />
                              Domain Mismatch
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Raw Auth Results Snippet */}
          {data.authentication_results && (
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 text-[11px] font-mono">
              <span className="text-slate-400 font-bold block mb-1 text-[10px] uppercase font-sans">Raw Authentication-Results:</span>
              <span className="text-slate-300 break-all">{data.authentication_results}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sanitized Body Preview & Threat Highlighter */}
      {viewTab === 'body' && (
        <div className="space-y-3">
          {/* Controls & Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 text-[11px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Signal Legend:</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-semibold">
                Urgency / Threat
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                Financial / BEC
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                Authority Framing
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold">
                URL Link
              </span>
            </div>

            <button
              onClick={() => setHighlightThreats(!highlightThreats)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${highlightThreats ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              {highlightThreats ? '✓ Highlighting Active' : 'Highlighting Disabled'}
            </button>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-xs text-slate-200 max-h-72 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans select-text">
            {renderAnnotatedBody(data.body_plain || data.body_html, highlightThreats)}
          </div>
          
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Body Length: {(data.body_plain || data.body_html || '').length} characters</span>
            <span>Extracted URLs: {data.urls?.length || 0} link(s)</span>
          </div>
        </div>
      )}

      {/* Tab 3: Full Received Header Chain */}
      {viewTab === 'raw_hops' && (
        <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-[11px]">
          {data.received_chain && data.received_chain.length > 0 ? (
            data.received_chain.map((hopHeader, idx) => (
              <div key={idx} className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-700/60 space-y-1">
                <span className="text-indigo-400 font-bold block text-[10px]">
                  HOP #{idx + 1} (Received Header)
                </span>
                <p className="text-slate-300 break-all leading-tight whitespace-pre-wrap">
                  {hopHeader}
                </p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 italic text-xs">No Received header chain available.</p>
          )}
        </div>
      )}

    </div>
  );
}

