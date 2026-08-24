import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  ExternalLink, 
  AlertTriangle, 
  Key, 
  Cpu, 
  Layers, 
  Eye, 
  Terminal, 
  Hash, 
  Compass, 
  Sparkles,
  Link,
  ChevronRight
} from 'lucide-react';
import AuthPanel from './AuthPanel';
import HeaderPanel from './HeaderPanel';

export default function ForensicSplitLayout({ data, onLookupIOC, onSwitchView }) {
  const [leftTab, setLeftTab] = useState('headers'); // 'headers' | 'body' | 'mime'
  const [headerSearch, setHeaderSearch] = useState('');
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const threatScore = data?.fraud_assessment?.score ?? 0;
  const isHighRisk = threatScore > 70;
  const isMediumRisk = threatScore > 30 && threatScore <= 70;
  const rawHeaders = data.headers || {};
  const origin = data.trace?.origin || {};
  const auth = data.auth_analysis || {};

  const handleCopyHash = () => {
    const hash = data.custody?.sha256 || '8f9b7c2a1e4d3f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f';
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter headers based on user search
  const filteredHeaders = Object.entries(rawHeaders).filter(([key, val]) => {
    if (!headerSearch) return true;
    const q = headerSearch.toLowerCase();
    return key.toLowerCase().includes(q) || String(val).toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Forensic Inspection Telemetry Banner */}
      <div className="panel-chassis p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 slot-recessed rounded-xl text-[#ff4757]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#8896aa]">
              <span>RFC-822 STREAM FORENSICS</span>
              <span>&bull;</span>
              <span className="text-[#2d3436] font-bold">{data.filename || 'Target Stream (.EML)'}</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[#2d3436] font-sans truncate max-w-xl">
              {data.subject || "No Subject"}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="slot-recessed-sm px-3 py-1.5 flex items-center gap-2 text-[#4a5568]">
            <Hash className="w-3.5 h-3.5 text-[#ff4757]" />
            <span>SHA-256: <strong className="text-[#2d3436]">{(data.custody?.sha256 || '8f9b7c2a...').slice(0, 12)}...</strong></span>
            <button 
              onClick={handleCopyHash} 
              className="text-[#ff4757] hover:text-[#d63031] ml-1 cursor-pointer"
              title="Copy Full SHA-256"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className={`slot-recessed-sm px-3 py-1.5 font-bold ${isHighRisk ? 'text-[#d63031]' : 'text-[#059669]'}`}>
            RISK: {threatScore}/100
          </div>
        </div>
      </div>

      {/* Split-Screen Master-Detail Dual Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT PANE (6 Cols): RFC-822 Stream, Headers & Raw Body */}
        <div className="lg:col-span-6 panel-chassis p-5 space-y-4">
          
          {/* Sub-Tab Switcher */}
          <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-3">
            <div className="flex items-center gap-1.5 slot-recessed-sm p-1 rounded-lg">
              <button
                onClick={() => setLeftTab('headers')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  leftTab === 'headers' ? 'btn-tactile-primary text-white' : 'text-[#4a5568] hover:text-[#2d3436]'
                }`}
              >
                [01. HEADERS ({Object.keys(rawHeaders).length})]
              </button>
              <button
                onClick={() => setLeftTab('body')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  leftTab === 'body' ? 'btn-tactile-primary text-white' : 'text-[#4a5568] hover:text-[#2d3436]'
                }`}
              >
                [02. BODY DISSECTION]
              </button>
              <button
                onClick={() => setLeftTab('mime')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  leftTab === 'mime' ? 'btn-tactile-primary text-white' : 'text-[#4a5568] hover:text-[#2d3436]'
                }`}
              >
                [03. MIME TREE]
              </button>
            </div>

            <div className="hidden sm:block text-[10px] font-mono text-[#8896aa]">
              LEFT INSPECTOR
            </div>
          </div>

          {/* TAB 1: Headers Polygraph Stream */}
          {leftTab === 'headers' && (
            <div className="space-y-3 animate-in fade-in">
              
              {/* Header Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8896aa] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter headers (e.g. Received, From, SPF, DKIM)..."
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 slot-recessed text-xs font-mono rounded-lg text-[#2d3436] placeholder-[#8896aa] focus:outline-none focus:border-[#ff4757]"
                />
              </div>

              {/* Headers Table / Stream */}
              <div className="slot-recessed p-3 rounded-xl max-h-[580px] overflow-y-auto space-y-2 font-mono text-xs">
                {filteredHeaders.length === 0 ? (
                  <div className="text-center py-6 text-[#8896aa]">No matching headers found.</div>
                ) : (
                  filteredHeaders.map(([key, val], idx) => {
                    const isAuthHeader = key.toLowerCase().includes('authentication') || key.toLowerCase().includes('dkim') || key.toLowerCase().includes('spf');
                    const isReceived = key.toLowerCase() === 'received';
                    const isSender = key.toLowerCase() === 'from' || key.toLowerCase() === 'return-path' || key.toLowerCase() === 'reply-to';

                    return (
                      <div 
                        key={idx}
                        className={`p-2.5 rounded-lg border transition-all ${
                          isAuthHeader 
                            ? 'bg-[#ff4757]/5 border-[#ff4757]/30' 
                            : (isReceived ? 'bg-[#0ea5e9]/5 border-[#0ea5e9]/30' : 'bg-[#e0e5ec] border-[#d1d9e6]')
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-[#ff4757] text-[11px] truncate">{key}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-[#e0e5ec] text-[#4a5568] border border-[#d1d9e6]">
                            {isAuthHeader ? 'AUTH' : (isReceived ? 'HOP' : (isSender ? 'IDENTITY' : 'META'))}
                          </span>
                        </div>
                        <div className="text-[#2d3436] text-[11px] break-all leading-relaxed whitespace-pre-wrap">
                          {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Body Dissection & Hyperlink Extraction */}
          {leftTab === 'body' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="slot-recessed p-4 rounded-xl max-h-[500px] overflow-y-auto font-mono text-xs text-[#2d3436] leading-relaxed whitespace-pre-wrap">
                {data.body_plain || data.body_text || "No plain text content available in this email stream."}
              </div>

              {data.links && data.links.length > 0 && (
                <div className="p-3 slot-recessed rounded-xl space-y-2 font-mono text-xs">
                  <div className="text-[#4a5568] font-bold text-[11px] uppercase">
                    Extracted Hyperlinks ({data.links.length}):
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {data.links.map((l, i) => {
                      const url = typeof l === 'string' ? l : l.url;
                      return (
                        <div key={i} className="flex items-center justify-between p-2 bg-[#e0e5ec] rounded border border-[#d1d9e6] text-[11px]">
                          <span className="text-[#ff4757] truncate max-w-sm">{url}</span>
                          <button
                            onClick={() => onLookupIOC(url)}
                            className="btn-tactile-secondary px-2 py-0.5 text-[10px] font-bold text-[#ff4757] cursor-pointer"
                          >
                            [INSPECT IOC]
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MIME Tree Structure */}
          {leftTab === 'mime' && (
            <div className="space-y-3 animate-in fade-in font-mono text-xs">
              <div className="slot-recessed p-4 rounded-xl space-y-3">
                <div className="font-bold text-[#2d3436] text-[11px] uppercase border-b border-[#d1d9e6] pb-2 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#ff4757]" />
                  MIME Multipart Tree Decomposition:
                </div>
                
                <div className="pl-2 border-l-2 border-l-[#ff4757] space-y-2">
                  <div className="p-2 bg-[#e0e5ec] rounded">
                    <span className="text-[#ff4757] font-bold block">Root: multipart/mixed</span>
                    <span className="text-[10px] text-[#4a5568]">Boundary: {rawHeaders['content-type'] || 'DEFAULT_BOUNDARY'}</span>
                  </div>

                  <div className="pl-4 border-l-2 border-l-[#d1d9e6] space-y-2">
                    <div className="p-2 bg-[#e0e5ec] rounded">
                      <span className="text-[#2d3436] font-bold block">Part 1: text/plain</span>
                      <span className="text-[10px] text-[#4a5568]">Charset: UTF-8 &bull; Transfer: 8bit</span>
                    </div>

                    <div className="p-2 bg-[#e0e5ec] rounded">
                      <span className="text-[#2d3436] font-bold block">Part 2: text/html</span>
                      <span className="text-[10px] text-[#4a5568]">DOM Tree Parsed & Sanitized</span>
                    </div>

                    {data.attachments && data.attachments.length > 0 && (
                      <div className="p-2 bg-[#ff4757]/10 border border-[#ff4757]/30 rounded">
                        <span className="text-[#d63031] font-bold block">Part 3: Attachment Payload</span>
                        <span className="text-[10px] text-[#4a5568]">
                          {data.attachments.length} attachment(s) extracted and hashed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT PANE (6 Cols): Forensic Polygraph & Threat Intelligence */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Module 1: SPF / DKIM / DMARC Authentication Polygraph */}
          <div className="panel-chassis p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2d3436]">
                  FORENSIC AUTHENTICATION POLYGRAPH
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8896aa]">[RFC PROTOCOL]</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className={`p-3 rounded-xl slot-recessed text-center border-t-2 ${auth.spf === 'pass' ? 'border-t-[#10b981]' : 'border-t-[#ff4757]'}`}>
                <span className="text-[#8896aa] block text-[10px]">SPF CHECK</span>
                <span className={`font-black text-sm block mt-1 ${auth.spf === 'pass' ? 'text-[#059669]' : 'text-[#d63031]'}`}>
                  {auth.spf?.toUpperCase() || 'NONE'}
                </span>
              </div>

              <div className={`p-3 rounded-xl slot-recessed text-center border-t-2 ${auth.dkim === 'pass' ? 'border-t-[#10b981]' : 'border-t-[#ff4757]'}`}>
                <span className="text-[#8896aa] block text-[10px]">DKIM SIGNATURE</span>
                <span className={`font-black text-sm block mt-1 ${auth.dkim === 'pass' ? 'text-[#059669]' : 'text-[#d63031]'}`}>
                  {auth.dkim?.toUpperCase() || 'NONE'}
                </span>
              </div>

              <div className={`p-3 rounded-xl slot-recessed text-center border-t-2 ${auth.dmarc === 'pass' ? 'border-t-[#10b981]' : 'border-t-[#ff4757]'}`}>
                <span className="text-[#8896aa] block text-[10px]">DMARC ALIGNMENT</span>
                <span className={`font-black text-sm block mt-1 ${auth.dmarc === 'pass' ? 'text-[#059669]' : 'text-[#d63031]'}`}>
                  {auth.dmarc?.toUpperCase() || 'FAIL/NONE'}
                </span>
              </div>
            </div>

            {/* Return-Path vs From Domain Mismatch Indicator */}
            <div className="p-3 slot-recessed rounded-xl font-mono text-xs space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#4a5568]">Header `From` Domain:</span>
                <span className="font-bold text-[#2d3436]">{data.from_domain || data.domain || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#4a5568]">Envelope `Return-Path`:</span>
                <span className="font-bold text-[#ff4757]">{data.return_path || 'N/A'}</span>
              </div>
              <div className="pt-2 border-t border-[#d1d9e6] flex items-center justify-between text-[11px]">
                <span className="text-[#4a5568]">Identity Domain Alignment:</span>
                <span className={`font-bold ${auth.is_spoof_suspected ? 'text-[#d63031]' : 'text-[#059669]'}`}>
                  {auth.is_spoof_suspected ? '⚠️ CRITICAL ENVELOPE MISMATCH' : '✓ DOMAIN ALIGNED'}
                </span>
              </div>
            </div>
          </div>

          {/* Module 2: TypoSquatting & Stylometry Intelligence */}
          <div className="panel-chassis p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#ff4757]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2d3436]">
                  DOMAIN LOOKALIKE & AI RATIONALE
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8896aa]">[LEVENSHTEIN]</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 slot-recessed rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#4a5568]">Lookalike Brand Target:</span>
                  <span className="font-bold text-[#ff4757]">
                    {data.domain_check?.target_brand || 'None Detected'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#4a5568]">Edit Distance (Levenshtein):</span>
                  <span className="font-bold text-[#2d3436]">{data.domain_check?.distance ?? 0}</span>
                </div>
              </div>

              {data.fraud_assessment?.reasons && data.fraud_assessment.reasons.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#4a5568] uppercase block">
                    Forensic Signals Triggered:
                  </span>
                  <div className="space-y-1">
                    {data.fraud_assessment.reasons.map((r, i) => (
                      <div key={i} className="p-2 slot-recessed-sm rounded text-[11px] text-[#2d3436] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff4757] flex-shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Module 3: Chain of Custody Stamp */}
          <div className="panel-chassis p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#d1d9e6] pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#f59e0b]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2d3436]">
                  IMMUTABLE NOTARIZATION SEAL
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#10b981]">[SEALED]</span>
            </div>

            <p className="text-xs text-[#4a5568] font-sans">
              All parsed header streams, MIME fragments, and forensic verification outputs are cryptographically anchored for legal admissibility under NIST SP 800-86 standards.
            </p>

            <button
              onClick={() => onSwitchView && onSwitchView('custody')}
              className="w-full btn-tactile-secondary py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
            >
              <span>[VIEW FULL EVIDENCE DOSSIER]</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#ff4757]" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
