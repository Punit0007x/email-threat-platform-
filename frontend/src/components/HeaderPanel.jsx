import React, { useState } from 'react';
import { Mail, AlignLeft, ShieldAlert, Layers, Check } from 'lucide-react';

const THREAT_PATTERNS = [
  { 
    type: 'urgency', 
    regex: /\b(urgent|urgently|immediately|suspended|suspend|act now|closed|close|verify now|action required|limited time|expire|expired|warning)\b/i, 
    bg: 'bg-red-100 text-red-700 border border-red-200', 
    label: 'Urgent Language' 
  },
  { 
    type: 'financial', 
    regex: /\b(wire transfer|direct deposit|payroll|routing number|routing|bank account|invoice|swift code|paycheck|payment|remittance|gift card|crypto|wallet)\b/i, 
    bg: 'bg-purple-100 text-purple-700 border border-purple-200', 
    label: 'Financial Request' 
  },
  { 
    type: 'authority', 
    regex: /\b(ceo|chief executive officer|board meeting|confidential|offsite|do not process|management|admin|security team|director|president)\b/i, 
    bg: 'bg-amber-100 text-amber-700 border border-amber-200', 
    label: 'Executive Impersonation' 
  },
  { 
    type: 'url', 
    regex: /(https?:\/\/[^\s<>"']+)/i, 
    bg: 'bg-blue-100 text-blue-700 border border-blue-200 font-mono', 
    label: 'Web Link' 
  }
];

const COMBINED_REGEX = /(https?:\/\/[^\s<>"']+|\b(?:urgent|urgently|immediately|suspended|suspend|act now|closed|close|verify now|action required|limited time|expire|expired|warning|wire transfer|direct deposit|payroll|routing number|routing|bank account|invoice|swift code|paycheck|payment|remittance|gift card|crypto|wallet|ceo|chief executive officer|board meeting|confidential|offsite|do not process|management|admin|security team|director|president)\b)/gi;

function renderAnnotatedBody(text, highlightEnabled) {
  if (!text) return <span className="text-gray-500 italic">No message text found.</span>;
  if (!highlightEnabled) return text;

  const parts = text.split(COMBINED_REGEX);
  return parts.map((part, idx) => {
    if (!part) return null;
    for (const p of THREAT_PATTERNS) {
      if (p.regex.test(part)) {
        return (
          <mark
            key={idx}
            className={`px-1.5 py-0.5 rounded text-xs font-semibold ${p.bg} transition-all inline-block my-0.5 shadow-sm`}
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
  const [viewTab, setViewTab] = useState('headers');
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
    <div className="panel-chassis p-6 sm:p-8 space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Email Header Details
            </h2>
            <p className="text-sm text-gray-500">
              Basic email information and content preview.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium">
          <button
            onClick={() => setViewTab('headers')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${viewTab === 'headers' ? 'bg-white shadow-sm border border-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            Headers
          </button>
          <button
            onClick={() => setViewTab('body')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${viewTab === 'body' ? 'bg-white shadow-sm border border-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            <AlignLeft className="w-4 h-4" />
            Body Preview
          </button>
          <button
            onClick={() => setViewTab('raw_hops')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${viewTab === 'raw_hops' ? 'bg-white shadow-sm border border-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            <Layers className="w-4 h-4" />
            Delivery Path ({data.received_chain?.length || 0})
          </button>
        </div>
      </div>

      {/* Tab 1: Headers Table */}
      {viewTab === 'headers' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-gray-200 rounded-xl overflow-hidden p-1">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <tbody className="divide-y divide-gray-200 bg-white">
                {rows.map((row, idx) => {
                  if (!row.value && row.label === "Reply-To") return null;
                  const isReplyTo = row.label === "Reply-To";
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <th className="px-4 py-3 font-semibold text-gray-600 w-1/4 bg-slate-50 text-xs uppercase">
                        {row.label}
                      </th>
                      <td className="px-4 py-3 text-gray-800 break-all text-xs font-medium">
                        <div className="flex items-center justify-between gap-2">
                          <span>{row.value || <span className="text-gray-400 italic font-normal">Not available</span>}</span>
                          {isReplyTo && hasReplyToMismatch && (
                            <span className="flex items-center gap-1 text-[10px] text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-200 flex-shrink-0 font-bold">
                              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                              Address Mismatch
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
            <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl text-xs font-mono">
              <span className="text-gray-600 font-semibold block mb-2 uppercase">Authentication Details:</span>
              <span className="text-gray-800 break-all">{data.authentication_results}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sanitized Body Preview & Threat Highlighter */}
      {viewTab === 'body' && (
        <div className="space-y-4">
          {/* Controls & Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-gray-200 p-3 rounded-xl text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-600 font-semibold uppercase">Highlight Guide:</span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 font-semibold">
                Urgent Language
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-700 border border-purple-200 font-semibold">
                Financial Request
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200 font-semibold">
                Executive Impersonation
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200 font-semibold">
                Web Links
              </span>
            </div>

            <button
              onClick={() => setHighlightThreats(!highlightThreats)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${highlightThreats ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'}`}
            >
              {highlightThreats ? '✓ Highlighting Active' : 'Highlighting Disabled'}
            </button>
          </div>

          <div className="bg-white border border-gray-200 p-5 rounded-xl text-sm text-gray-800 max-h-72 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text shadow-sm">
            {renderAnnotatedBody(data.body_plain || data.body_html, highlightThreats)}
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>Length: {(data.body_plain || data.body_html || '').length} characters</span>
            <span>Links found: {data.urls?.length || 0}</span>
          </div>
        </div>
      )}

      {/* Tab 3: Full Received Header Chain */}
      {viewTab === 'raw_hops' && (
        <div className="space-y-3 max-h-72 overflow-y-auto text-xs pr-1">
          {data.received_chain && data.received_chain.length > 0 ? (
            data.received_chain.map((hopHeader, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 space-y-1.5 shadow-sm">
                <span className="text-blue-600 font-semibold block text-xs uppercase">
                  Server Hop #{idx + 1}
                </span>
                <p className="text-gray-800 break-all leading-relaxed whitespace-pre-wrap font-mono">
                  {hopHeader}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic text-sm py-4 text-center bg-slate-50 border border-gray-200 rounded-xl">No delivery path data available.</p>
          )}
        </div>
      )}

    </div>
  );
}

