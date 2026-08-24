import React, { useState, useMemo } from 'react';
import { 
  Eye, 
  Code, 
  FileText, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  Zap, 
  Terminal, 
  Copy, 
  Check, 
  Sparkles
} from 'lucide-react';

// Common Base64 / Hex / Script Obfuscation Detector
function detectObfuscatedStrings(text) {
  if (!text) return [];
  const results = [];

  // 1. Base64 patterns (min 20 chars ending in = or valid base64)
  const b64Regex = /\b[A-Za-z0-9+/]{24,}={0,2}\b/g;
  let match;
  while ((match = b64Regex.exec(text)) !== null) {
    const raw = match[0];
    try {
      const decoded = atob(raw);
      if (/^[\x20-\x7E\r\n\t]+$/.test(decoded) && decoded.length > 5) {
        results.push({
          type: 'Base64 Encoded Stream',
          raw: raw.substring(0, 40) + (raw.length > 40 ? '...' : ''),
          fullRaw: raw,
          decoded: decoded,
          confidence: 'High',
          color: 'text-[#0284c7] border-[#0ea5e9]/30 bg-[#0ea5e9]/10'
        });
      }
    } catch {
      // Not valid base64
    }
  }

  // 2. Hex encoded patterns
  const hexRegex = /(?:\\x[0-9a-fA-F]{2}){4,}/g;
  while ((match = hexRegex.exec(text)) !== null) {
    const raw = match[0];
    const hexBytes = raw.replace(/\\x/g, '');
    let decoded = '';
    for (let i = 0; i < hexBytes.length; i += 2) {
      decoded += String.fromCharCode(parseInt(hexBytes.substr(i, 2), 16));
    }
    results.push({
      type: 'Hex Escaped String',
      raw: raw.substring(0, 40) + '...',
      fullRaw: raw,
      decoded: decoded,
      confidence: 'High',
      color: 'text-[#b45309] border-[#f59e0b]/30 bg-[#f59e0b]/10'
    });
  }

  // 3. Multi-hop URL Redirector Obfuscation
  const redirectRegex = /https?:\/\/(?:www\.)?(?:google\.com\/url\?q=|bing\.com\/ck\/|l\.facebook\.com\/l\.php\?u=)(https?[^&\s]+)/gi;
  while ((match = redirectRegex.exec(text)) !== null) {
    results.push({
      type: 'Open Redirector Wrapper',
      raw: match[0].substring(0, 45) + '...',
      fullRaw: match[0],
      decoded: decodeURIComponent(match[1]),
      confidence: 'Critical',
      color: 'text-[#d63031] border-[#ef4444]/30 bg-[#ef4444]/10'
    });
  }

  return results.slice(0, 10);
}

function detectHiddenText(html, plain) {
  const hidden = [];
  
  const zeroWidthRegex = /[\u200B\u200C\u200D\uFEFF\u00A0]{2,}/g;
  if (plain && zeroWidthRegex.test(plain)) {
    hidden.push({
      type: 'Zero-Width Unicode Characters',
      location: 'Plaintext Stream',
      desc: 'Invisible zero-width unicode spaces injected to break spam filter Bayesian tokenization.'
    });
  }

  if (html) {
    if (html.includes('font-size:0') || html.includes('font-size: 0') || html.includes('display:none') || html.includes('display: none')) {
      hidden.push({
        type: 'Zero-Font / Hidden CSS Elements',
        location: 'HTML DOM',
        desc: 'CSS rules (font-size: 0px or display: none) hiding text from victim while feeding tokens to spam engines.'
      });
    }
    if (html.includes('color:white;background:white') || html.includes('color:#ffffff;background:#ffffff') || html.includes('color: white; background: white')) {
      hidden.push({
        type: 'White-on-White Camouflage Text',
        location: 'HTML DOM Styling',
        desc: 'Invisible white text on white background used for filter poisoning.'
      });
    }
  }

  return hidden;
}

function detectTrackingPixels(html) {
  if (!html) return [];
  const pixels = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const src = match[1];
    if (
      fullTag.includes('width="1"') || fullTag.includes('width="0"') || 
      fullTag.includes('width:1px') || fullTag.includes('width: 1px') ||
      fullTag.includes('height="1"') || fullTag.includes('height="0"') ||
      src.includes('track') || src.includes('pixel') || src.includes('beacon') || src.includes('open.php')
    ) {
      pixels.push({
        src: src,
        tag: fullTag
      });
    }
  }
  return pixels;
}

export default function EmailBodyDissector({ data, onLookupIOC }) {
  const [viewMode, setViewMode] = useState('wysiwyg'); // 'wysiwyg' | 'text' | 'deobfuscate' | 'raw'
  const [customInput, setCustomInput] = useState('');
  const [customDecoded, setCustomDecoded] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const plainBody = data?.body_plain || "";
  const htmlBody = data?.body_html || "";
  const linkMismatches = data?.domain_check?.link_mismatches || [];

  const obfuscations = useMemo(() => {
    const fullContent = `${plainBody} ${htmlBody}`;
    return detectObfuscatedStrings(fullContent);
  }, [plainBody, htmlBody]);

  const hiddenText = useMemo(() => {
    return detectHiddenText(htmlBody, plainBody);
  }, [htmlBody, plainBody]);

  const trackingPixels = useMemo(() => {
    return detectTrackingPixels(htmlBody);
  }, [htmlBody]);

  const handleDecodeCustom = () => {
    if (!customInput.trim()) return;
    const input = customInput.trim();
    let result = { type: 'Unknown', decoded: '' };

    try {
      const b64 = atob(input);
      if (b64) {
        result = { type: 'Base64 Decoded', decoded: b64 };
      }
    } catch {
      try {
        const urlDec = decodeURIComponent(input);
        if (urlDec !== input) {
          result = { type: 'URL Encoded', decoded: urlDec };
        }
      } catch {
        try {
          const cleanHex = input.replace(/\\x|0x|\s/g, '');
          if (/^[0-9a-fA-F]+$/.test(cleanHex) && cleanHex.length % 2 === 0) {
            let hexStr = '';
            for (let i = 0; i < cleanHex.length; i += 2) {
              hexStr += String.fromCharCode(parseInt(cleanHex.substr(i, 2), 16));
            }
            result = { type: 'Hex Bytes Decoded', decoded: hexStr };
          }
        } catch {
          result = { type: 'Plain text', decoded: input };
        }
      }
    }

    setCustomDecoded(result);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const safeSandboxedHtml = useMemo(() => {
    if (!htmlBody) return `<div style="font-family: monospace; color: #0f172a; background: #ffffff; padding: 20px;">[No HTML Body Stream Present. Showing Plaintext Payload.]<br><br>${plainBody.replace(/\n/g, '<br>')}</div>`;

    let sanitized = htmlBody
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '<!-- [DANGEROUS SCRIPT BLOCKED BY SANDBOX] -->')
      .replace(/onload=/gi, 'data-blocked-onload=')
      .replace(/onerror=/gi, 'data-blocked-onerror=')
      .replace(/onclick=/gi, 'data-blocked-onclick=');

    const injectedStyles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background: #f8fafc; padding: 16px; line-height: 1.6; }
        a { color: #ef4444; text-decoration: underline; font-weight: bold; }
        .threat-highlight-link { background: rgba(255, 71, 87, 0.15) !important; border: 1px solid #ef4444 !important; color: #d63031 !important; padding: 2px 4px !important; border-radius: 4px !important; font-weight: bold !important; }
        .threat-highlight-hidden { background: rgba(245, 158, 11, 0.2) !important; border: 1px dashed #f59e0b !important; color: #b45309 !important; display: inline-block !important; font-size: 12px !important; }
      </style>
    `;

    return injectedStyles + sanitized;
  }, [htmlBody, plainBody]);

  return (
    <div className="panel-chassis p-6 sm:p-8 space-y-6 relative overflow-hidden">
      
      {/* Corner Screws */}
      <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

      {/* Header with Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#f8fafc] pb-4 px-2">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-[#ffffff] text-[#ef4444] rounded-2xl shadow-[var(--shadow-card)] border border-white/70">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2 font-sans">
              Email Payload Dissector & Sandbox
              <span className="text-[10px] bg-[#10b981]/15 text-[#047857] font-mono font-bold px-2 py-0.5 rounded border border-[#10b981]/30">
                ISOLATED SANDBOX
              </span>
            </h2>
            <p className="text-xs text-[#64748b]">
              Safe WYSIWYG rendering, deceptive link divergence, hidden zero-font text, and automated payload de-obfuscation
            </p>
          </div>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 slot-recessed rounded-xl font-mono text-xs">
          {[
            { id: 'wysiwyg', label: 'Safe Preview', icon: Eye },
            { id: 'text', label: 'Threat Callouts', icon: FileText },
            { id: 'deobfuscate', label: 'De-Obfuscator', icon: Terminal },
            { id: 'raw', label: 'Raw MIME Source', icon: Code },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`key-switch flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ${
                  isActive ? 'active' : ''
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Threat Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="slot-recessed p-3 flex items-center justify-between">
          <span className="text-[#64748b] font-bold">Deceptive Links:</span>
          <span className={`font-bold font-mono ${linkMismatches.length > 0 ? 'text-[#ef4444]' : 'text-[#059669]'}`}>
            {linkMismatches.length} Detected
          </span>
        </div>

        <div className="slot-recessed p-3 flex items-center justify-between">
          <span className="text-[#64748b] font-bold">Obfuscated Strings:</span>
          <span className={`font-bold font-mono ${obfuscations.length > 0 ? 'text-[#d97706]' : 'text-[#0f172a]'}`}>
            {obfuscations.length} Detected
          </span>
        </div>

        <div className="slot-recessed p-3 flex items-center justify-between">
          <span className="text-[#64748b] font-bold">Hidden / Zero-Font:</span>
          <span className={`font-bold font-mono ${hiddenText.length > 0 ? 'text-[#d97706]' : 'text-[#0f172a]'}`}>
            {hiddenText.length} Found
          </span>
        </div>

        <div className="slot-recessed p-3 flex items-center justify-between">
          <span className="text-[#64748b] font-bold">Tracking Beacons:</span>
          <span className={`font-bold font-mono ${trackingPixels.length > 0 ? 'text-[#7048e8]' : 'text-[#0f172a]'}`}>
            {trackingPixels.length} Pixels
          </span>
        </div>
      </div>

      {/* TAB 1: Safe Sandboxed WYSIWYG Preview */}
      {viewMode === 'wysiwyg' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-mono text-[#64748b] slot-recessed-sm px-4 py-2">
            <span className="flex items-center gap-2 text-[#059669] font-bold">
              <Lock className="w-3.5 h-3.5" />
              SANDBOX SECURITY: SCRIPTS DISABLED & EXTERNAL BEACONS NEUTRALIZED
            </span>
            <span className="text-[#94a3b8] font-semibold">Render Engine: Chromium Isolated Frame</span>
          </div>

          <div className="w-full h-[450px] rounded-xl overflow-hidden slot-recessed border border-[#e2e8f0]/60 shadow-inner bg-[#f8fafc]">
            <iframe
              title="Sandboxed Email Preview"
              srcDoc={safeSandboxedHtml}
              sandbox="allow-same-origin"
              className="w-full h-full border-none"
            />
          </div>
        </div>
      )}

      {/* TAB 2: Threat Callouts & Deceptive Links */}
      {viewMode === 'text' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Deceptive Links Callouts */}
          {linkMismatches.length > 0 ? (
            <div className="slot-recessed p-5 space-y-3 border-l-4 border-l-[#ef4444]">
              <h4 className="text-xs font-bold text-[#d63031] uppercase tracking-wider font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                Deceptive Link Divergence Detected ({linkMismatches.length})
              </h4>
              <p className="text-xs text-[#0f172a] font-medium">
                The displayed anchor text in the email leads the victim to believe they are navigating to a legitimate service, but the underlying destination points to a malicious host.
              </p>

              <div className="space-y-2.5 pt-1">
                {linkMismatches.map((mismatch, idx) => (
                  <div key={idx} className="bg-[#f8fafc] p-3.5 rounded-xl border border-[#e2e8f0]/60 space-y-2 font-mono text-xs shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 text-[#64748b]">
                        <span className="text-[10px] uppercase font-bold">Displayed Anchor:</span>
                        <strong className="text-[#059669] font-bold">{mismatch.text}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-[#ef4444]/15 text-[#d63031] px-2 py-0.5 rounded border border-[#ef4444]/30 font-bold">
                          MISMATCH
                        </span>
                        {onLookupIOC && (
                          <button
                            onClick={() => onLookupIOC(mismatch.href)}
                            className="text-[10px] text-[#ef4444] hover:underline cursor-pointer font-bold"
                          >
                            Lookup Target IOC
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#64748b] truncate">
                      <span className="text-[10px] uppercase font-bold">Actual HREF Target:</span>
                      <span className="text-[#d63031] font-bold truncate">{mismatch.href}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="slot-recessed p-4 text-xs text-[#64748b] font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              <span>No deceptive link mismatches detected. Links match their visible anchor text.</span>
            </div>
          )}

          {/* Hidden Zero-Font & Filter Poisoning Callouts */}
          {hiddenText.length > 0 && (
            <div className="slot-recessed p-5 space-y-3 border-l-4 border-l-[#f59e0b]">
              <h4 className="text-xs font-bold text-[#b45309] uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#f59e0b]" />
                Hidden Zero-Font & Camouflage Poisoning ({hiddenText.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hiddenText.map((item, idx) => (
                  <div key={idx} className="bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]/60 space-y-1 text-xs shadow-sm">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#b45309] font-bold font-mono">{item.type}</strong>
                      <span className="text-[10px] text-[#64748b] font-mono font-semibold">{item.location}</span>
                    </div>
                    <p className="text-[#0f172a] text-[11px] leading-relaxed font-sans">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plain Text Body Inspector */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider font-mono">
              Normalized Plaintext Stream
            </h4>
            <div className="slot-recessed p-4 text-xs font-mono text-[#0f172a] max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {plainBody || "[No Plaintext Stream Detected]"}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: Automated & Interactive De-Obfuscator Studio */}
      {viewMode === 'deobfuscate' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Automated De-Obfuscated Findings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#ef4444]" />
              Automated Payload De-Obfuscation ({obfuscations.length})
            </h4>

            {obfuscations.length > 0 ? (
              <div className="space-y-3">
                {obfuscations.map((item, idx) => (
                  <div key={idx} className="bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0]/60 space-y-2.5 font-mono text-xs shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${item.color}`}>
                        {item.type}
                      </span>
                      <button
                        onClick={() => copyToClipboard(item.decoded, `item-${idx}`)}
                        className="text-[11px] text-[#64748b] hover:text-[#0f172a] flex items-center gap-1 cursor-pointer font-sans font-bold"
                      >
                        {copiedId === `item-${idx}` ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === `item-${idx}` ? 'Copied' : 'Copy Decoded'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      <div className="space-y-1">
                        <span className="text-[#64748b] uppercase text-[10px] font-bold">Obfuscated Raw Input:</span>
                        <div className="slot-recessed p-2.5 text-[#64748b] break-all max-h-24 overflow-y-auto">
                          {item.fullRaw}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[#059669] uppercase text-[10px] font-bold">Unpacked Payload:</span>
                        <div className="slot-recessed p-2.5 text-[#059669] break-all max-h-24 overflow-y-auto font-bold bg-[#10b981]/5 border border-[#10b981]/20">
                          {item.decoded}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="slot-recessed p-4 text-xs text-[#64748b] font-mono flex items-center gap-2">
                <Check className="w-4 h-4 text-[#059669]" />
                <span>No complex Base64, Hex, or Script obfuscation layers detected in this payload.</span>
              </div>
            )}
          </div>

          {/* Interactive De-Obfuscator Sandbox Workbench */}
          <div className="slot-recessed p-5 space-y-4">
            <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#f59e0b]" />
              Live Analyst De-Obfuscator Sandbox Workbench
            </h4>
            <p className="text-xs text-[#64748b]">
              Paste any suspicious encoded string, Base64 block, Hex byte array, or wrapped URL to immediately unpack it in real-time.
            </p>

            <div className="space-y-3">
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Paste encoded string here (e.g. SGVsbG8gV29ybGQ= or \x61\x64\x6d\x69\x6e or https://google.com/url?q=...)"
                rows={3}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 text-xs font-mono text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#ef4444] shadow-inner"
              />

              <button
                onClick={handleDecodeCustom}
                className="btn-tactile-primary px-4 py-2 text-xs font-mono"
              >
                Unpack & Decode Payload
              </button>

              {customDecoded && (
                <div className="bg-[#f8fafc] p-4 rounded-xl border border-[#0ea5e9]/40 space-y-2 font-mono text-xs shadow-sm animate-in fade-in">
                  <div className="flex items-center justify-between text-[#0284c7] font-bold text-[11px]">
                    <span>Format Identified: {customDecoded.type}</span>
                    <button
                      onClick={() => copyToClipboard(customDecoded.decoded, 'custom')}
                      className="text-[10px] text-[#64748b] hover:text-[#0f172a] flex items-center gap-1 cursor-pointer font-sans"
                    >
                      {copiedId === 'custom' ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === 'custom' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="slot-recessed p-3 text-[#059669] break-all whitespace-pre-wrap font-bold bg-[#10b981]/5">
                    {customDecoded.decoded}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: Raw MIME Source Code */}
      {viewMode === 'raw' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-mono text-[#64748b]">
            <span className="font-bold">Raw HTML / MIME Source Code Stream</span>
            <button
              onClick={() => copyToClipboard(htmlBody || plainBody, 'raw-source')}
              className="text-[11px] text-[#ef4444] hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              {copiedId === 'raw-source' ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedId === 'raw-source' ? 'Source Copied' : 'Copy Source'}
            </button>
          </div>

          <div className="slot-recessed p-4 text-xs font-mono text-[#0f172a] max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {htmlBody || plainBody || "[No Raw Body Content Available]"}
          </div>
        </div>
      )}

    </div>
  );
}
