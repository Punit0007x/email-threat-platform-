import React, { useState } from 'react';
import { Mail, AlignLeft, ShieldAlert, Layers, Check } from 'lucide-react';

const THREAT_PATTERNS = [
  { 
    type: 'urgency', 
    regex: /\b(urgent|urgently|immediately|suspended|suspend|act now|closed|close|verify now|action required|limited time|expire|expired|warning)\b/i, 
    bg: 'bg-[#ff4757]/15 text-[#d63031] border border-[#ff4757]/30', 
    label: 'Urgency' 
  },
  { 
    type: 'financial', 
    regex: /\b(wire transfer|direct deposit|payroll|routing number|routing|bank account|invoice|swift code|paycheck|payment|remittance|gift card|crypto|wallet)\b/i, 
    bg: 'bg-[#7048e8]/15 text-[#5f3dc4] border border-[#7048e8]/30', 
    label: 'Financial / BEC' 
  },
  { 
    type: 'authority', 
    regex: /\b(ceo|chief executive officer|board meeting|confidential|offsite|do not process|management|admin|security team|director|president)\b/i, 
    bg: 'bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/30', 
    label: 'Authority Framing' 
  },
  { 
    type: 'url', 
    regex: /(https?:\/\/[^\s<>"']+)/i, 
    bg: 'bg-[#0ea5e9]/15 text-[#0369a1] border border-[#0ea5e9]/30 font-mono', 
    label: 'Hyperlink' 
  }
];

const COMBINED_REGEX = /(https?:\/\/[^\s<>"']+|\b(?:urgent|urgently|immediately|suspended|suspend|act now|closed|close|verify now|action required|limited time|expire|expired|warning|wire transfer|direct deposit|payroll|routing number|routing|bank account|invoice|swift code|paycheck|payment|remittance|gift card|crypto|wallet|ceo|chief executive officer|board meeting|confidential|offsite|do not process|management|admin|security team|director|president)\b)/gi;

function renderAnnotatedBody(text, highlightEnabled) {
  if (!text) return <span className="text-[#4a5568] italic font-mono">No message body text found in payload.</span>;
  if (!highlightEnabled) return text;

  const parts = text.split(COMBINED_REGEX);
  return parts.map((part, idx) => {
    if (!part) return null;
    for (const p of THREAT_PATTERNS) {
      if (p.regex.test(part)) {
        return (
          <mark
            key={idx}
            className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${p.bg} transition-all inline-block my-0.5 shadow-sm`}
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
    <div className="panel-chassis p-6 sm:p-8 space-y-6 relative overflow-hidden">
      
      {/* Corner Screws */}
      <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d1d9e6] pb-4 px-2">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-[#e0e5ec] text-[#0ea5e9] rounded-2xl shadow-[var(--shadow-card)] border border-white/70">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2d3436] flex items-center gap-2">
              Email Payload & RFC Header Matrix
            </h2>
            <p className="text-xs text-[#4a5568]">
              Standard RFC-5322 header dissection, Return-Path divergence, and threat signal annotations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 slot-recessed rounded-xl font-mono text-xs">
          <button
            onClick={() => setViewTab('headers')}
            className={`key-switch px-3 py-1.5 text-xs font-bold ${viewTab === 'headers' ? 'active' : ''}`}
          >
            Headers
          </button>
          <button
            onClick={() => setViewTab('body')}
            className={`key-switch px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${viewTab === 'body' ? 'active' : ''}`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            Body Preview
          </button>
          <button
            onClick={() => setViewTab('raw_hops')}
            className={`key-switch px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${viewTab === 'raw_hops' ? 'active' : ''}`}
          >
            <Layers className="w-3.5 h-3.5" />
            Hops ({data.received_chain?.length || 0})
          </button>
        </div>
      </div>

      {/* Tab 1: Headers Table */}
      {viewTab === 'headers' && (
        <div className="space-y-4">
          <div className="slot-recessed p-1 rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-[#babecc]/50 text-xs text-left">
              <tbody className="divide-y divide-[#babecc]/40 bg-[#f0f2f5] font-mono">
                {rows.map((row, idx) => {
                  if (!row.value && row.label === "Reply-To") return null;
                  const isReplyTo = row.label === "Reply-To";
                  return (
                    <tr key={idx} className="hover:bg-[#e0e5ec]/60 transition-colors">
                      <th className="px-4 py-3 font-bold text-[#4a5568] w-1/4 bg-[#e0e5ec]/70 font-mono text-[11px] uppercase tracking-wider">
                        {row.label}
                      </th>
                      <td className="px-4 py-3 text-[#2d3436] break-all text-[11px] font-medium">
                        <div className="flex items-center justify-between gap-2">
                          <span>{row.value || <span className="text-[#8896aa] italic font-sans font-normal">Not available</span>}</span>
                          {isReplyTo && hasReplyToMismatch && (
                            <span className="flex items-center gap-1 text-[10px] text-[#b45309] bg-[#f59e0b]/15 px-2.5 py-0.5 rounded border border-[#f59e0b]/30 flex-shrink-0 font-bold font-sans">
                              <ShieldAlert className="w-3.5 h-3.5 text-[#d97706]" />
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
            <div className="slot-recessed p-3.5 rounded-xl text-[11px] font-mono">
              <span className="text-[#4a5568] font-bold block mb-1 text-[10px] uppercase font-mono tracking-wider">Raw Authentication-Results:</span>
              <span className="text-[#2d3436] break-all">{data.authentication_results}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sanitized Body Preview & Threat Highlighter */}
      {viewTab === 'body' && (
        <div className="space-y-4">
          {/* Controls & Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 slot-recessed p-3 rounded-xl text-[11px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#4a5568] font-bold uppercase text-[10px] font-mono tracking-wider">Signal Legend:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ff4757]/15 text-[#d63031] border border-[#ff4757]/30 text-[10px] font-bold font-mono">
                Urgency / Threat
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#7048e8]/15 text-[#5f3dc4] border border-[#7048e8]/30 text-[10px] font-bold font-mono">
                Financial / BEC
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/30 text-[10px] font-bold font-mono">
                Authority Framing
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0ea5e9]/15 text-[#0369a1] border border-[#0ea5e9]/30 text-[10px] font-bold font-mono">
                URL Link
              </span>
            </div>

            <button
              onClick={() => setHighlightThreats(!highlightThreats)}
              className={`key-switch px-3 py-1 text-xs font-bold ${highlightThreats ? 'active text-[#ff4757]' : ''}`}
            >
              {highlightThreats ? '✓ Highlighting Active' : 'Highlighting Disabled'}
            </button>
          </div>

          <div className="slot-recessed p-5 rounded-xl text-xs text-[#2d3436] max-h-72 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans select-text font-medium bg-[#f0f2f5]">
            {renderAnnotatedBody(data.body_plain || data.body_html, highlightThreats)}
          </div>
          
          <div className="flex justify-between text-[10px] text-[#4a5568] font-mono px-1">
            <span>Body Length: {(data.body_plain || data.body_html || '').length} characters</span>
            <span>Extracted URLs: {data.urls?.length || 0} link(s)</span>
          </div>
        </div>
      )}

      {/* Tab 3: Full Received Header Chain */}
      {viewTab === 'raw_hops' && (
        <div className="space-y-2.5 max-h-72 overflow-y-auto font-mono text-[11px] pr-1">
          {data.received_chain && data.received_chain.length > 0 ? (
            data.received_chain.map((hopHeader, idx) => (
              <div key={idx} className="bg-[#f0f2f5] p-3 rounded-xl border border-[#babecc]/60 space-y-1 shadow-sm">
                <span className="text-[#0ea5e9] font-bold block text-[10px] uppercase">
                  HOP #{idx + 1} (Received Header)
                </span>
                <p className="text-[#2d3436] break-all leading-tight whitespace-pre-wrap">
                  {hopHeader}
                </p>
              </div>
            ))
          ) : (
            <p className="text-[#4a5568] italic text-xs py-4 text-center slot-recessed">No Received header chain available.</p>
          )}
        </div>
      )}

    </div>
  );
}

