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
      // Ensure decoded text contains mostly printable characters
      if (/^[\x20-\x7E\r\n\t]+$/.test(decoded) && decoded.length > 5) {
        results.push({
          type: 'Base64 Encoded Stream',
          raw: raw.substring(0, 40) + (raw.length > 40 ? '...' : ''),
          fullRaw: raw,
          decoded: decoded,
          confidence: 'High',
          color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40'
        });
      }
    } catch {
      // Not valid base64
    }
  }

  // 2. Hex encoded patterns (e.g. \x48\x65\x6c\x6c\x6f or 48656c6c6f)
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
      color: 'text-amber-400 border-amber-500/40 bg-amber-950/40'
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
      color: 'text-rose-400 border-rose-500/40 bg-rose-950/40'
    });
  }

  return results.slice(0, 10); // cap at 10
}

// Detect Zero-Width Unicode or Invisible text
function detectHiddenText(html, plain) {
  const hidden = [];
  
  // Zero-width characters regex
  const zeroWidthRegex = /[\u200B\u200C\u200D\uFEFF\u00A0]{2,}/g;
  if (plain && zeroWidthRegex.test(plain)) {
    hidden.push({
      type: 'Zero-Width Unicode Characters',
      location: 'Plaintext Stream',
      desc: 'Invisible zero-width unicode spaces injected to break spam filter Bayesian tokenization.'
    });
  }

  // HTML zero-font or display:none or transparent color
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

// Detect Tracking Pixels (1x1 images)
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

  // Obfuscation Analysis
  const obfuscations = useMemo(() => {
    const fullContent = `${plainBody} ${htmlBody}`;
    return detectObfuscatedStrings(fullContent);
  }, [plainBody, htmlBody]);

  // Hidden text analysis
  const hiddenText = useMemo(() => {
    return detectHiddenText(htmlBody, plainBody);
  }, [htmlBody, plainBody]);

  // Tracking pixels analysis
  const trackingPixels = useMemo(() => {
    return detectTrackingPixels(htmlBody);
  }, [htmlBody]);

  // Handle Custom De-Obfuscator Studio
  const handleDecodeCustom = () => {
    if (!customInput.trim()) return;
    const input = customInput.trim();
    let result = { type: 'Unknown', decoded: '' };

    // Try Base64
    try {
      const b64 = atob(input);
      if (b64) {
        result = { type: 'Base64 Decoded', decoded: b64 };
      }
    } catch {
      // Try URL Decode
      try {
        const urlDec = decodeURIComponent(input);
        if (urlDec !== input) {
          result = { type: 'URL Encoded', decoded: urlDec };
        }
      } catch {
        // Try Hex
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

  // Prepare safe Sandboxed HTML with injected threat callout highlights
  const safeSandboxedHtml = useMemo(() => {
    if (!htmlBody) return `<div style="font-family: monospace; color: #94a3b8; padding: 20px;">[No HTML Body Stream Present. Showing Plaintext Payload.]<br><br>${plainBody.replace(/\n/g, '<br>')}</div>`;

    // Neutralize dangerous scripts
    let sanitized = htmlBody
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '<!-- [DANGEROUS SCRIPT BLOCKED BY SANDBOX] -->')
      .replace(/onload=/gi, 'data-blocked-onload=')
      .replace(/onerror=/gi, 'data-blocked-onerror=')
      .replace(/onclick=/gi, 'data-blocked-onclick=');

    // Inject CSS for deceptive link highlighting and dark styling
    const injectedStyles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; background: #0b1426; padding: 16px; line-height: 1.6; }
        a { color: #38bdf8; text-decoration: underline; }
        .threat-highlight-link { background: rgba(244, 63, 94, 0.25) !important; border: 1px solid #f43f5e !important; color: #fda4af !important; padding: 2px 4px !important; border-radius: 4px !important; font-weight: bold !important; }
        .threat-highlight-hidden { background: rgba(245, 158, 11, 0.3) !important; border: 1px dashed #f59e0b !important; color: #fde047 !important; display: inline-block !important; font-size: 12px !important; }
      </style>
    `;

    return injectedStyles + sanitized;
  }, [htmlBody, plainBody]);

  return (
    <div className="cyber-panel rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      
      {/* Header with Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/30 shadow-md">
            <Eye className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-sans">
              Email Payload Dissector & Sandbox
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                ISOLATED SANDBOX
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Safe WYSIWYG rendering, deceptive link divergence, hidden zero-font text, and automated payload de-obfuscation
            </p>
          </div>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/90 border border-slate-800 rounded-xl font-mono text-xs">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
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
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Deceptive Links:</span>
          <span className={`font-bold ${linkMismatches.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {linkMismatches.length} Detected
          </span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Obfuscated Strings:</span>
          <span className={`font-bold ${obfuscations.length > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {obfuscations.length} Detected
          </span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Hidden / Zero-Font:</span>
          <span className={`font-bold ${hiddenText.length > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {hiddenText.length} Found
          </span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Tracking Beacons:</span>
          <span className={`font-bold ${trackingPixels.length > 0 ? 'text-purple-400' : 'text-slate-300'}`}>
            {trackingPixels.length} Pixels
          </span>
        </div>
      </div>

      {/* TAB 1: Safe Sandboxed WYSIWYG Preview */}
      {viewMode === 'wysiwyg' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/80 px-4 py-2 rounded-t-xl border border-slate-800">
            <span className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              SANDBOX SECURITY: SCRIPTS DISABLED & EXTERNAL BEACONS NEUTRALIZED
            </span>
            <span className="text-slate-500">Render Engine: Chromium Isolated Frame</span>
          </div>

          <div className="w-full h-[450px] rounded-b-xl overflow-hidden border border-slate-800 bg-[#0b1426] shadow-inner">
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
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Deceptive Links Callouts */}
          {linkMismatches.length > 0 ? (
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Deceptive Link Divergence Detected ({linkMismatches.length})
              </h4>
              <p className="text-xs text-slate-300">
                The displayed anchor text in the email leads the victim to believe they are navigating to a legitimate service, but the underlying destination points to a malicious host.
              </p>

              <div className="space-y-2.5 pt-1">
                {linkMismatches.map((mismatch, idx) => (
                  <div key={idx} className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Displayed Anchor:</span>
                        <strong className="text-emerald-400 font-semibold">{mismatch.text}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 font-bold">
                          MISMATCH
                        </span>
                        {onLookupIOC && (
                          <button
                            onClick={() => onLookupIOC(mismatch.href)}
                            className="text-[10px] text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
                          >
                            Lookup Target IOC
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 truncate">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Actual HREF Target:</span>
                      <span className="text-rose-300 font-bold truncate">{mismatch.href}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>No deceptive link mismatches detected. Links match their visible anchor text.</span>
            </div>
          )}

          {/* Hidden Zero-Font & Filter Poisoning Callouts */}
          {hiddenText.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Hidden Zero-Font & Camouflage Poisoning ({hiddenText.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hiddenText.map((item, idx) => (
                  <div key={idx} className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-amber-300 font-semibold font-mono">{item.type}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">{item.location}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plain Text Body Inspector */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Normalized Plaintext Stream
            </h4>
            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {plainBody || "[No Plaintext Stream Detected]"}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: Automated & Interactive De-Obfuscator Studio */}
      {viewMode === 'deobfuscate' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Automated De-Obfuscated Findings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Automated Payload De-Obfuscation ({obfuscations.length})
            </h4>

            {obfuscations.length > 0 ? (
              <div className="space-y-3">
                {obfuscations.map((item, idx) => (
                  <div key={idx} className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${item.color}`}>
                        {item.type}
                      </span>
                      <button
                        onClick={() => copyToClipboard(item.decoded, `item-${idx}`)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `item-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === `item-${idx}` ? 'Copied' : 'Copy Decoded'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      <div className="space-y-1">
                        <span className="text-slate-500 uppercase text-[10px]">Obfuscated Raw Input:</span>
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-400 break-all max-h-24 overflow-y-auto">
                          {item.fullRaw}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-cyan-400 uppercase text-[10px] font-bold">Unpacked Payload:</span>
                        <div className="bg-slate-950 p-2.5 rounded border border-cyan-500/30 text-emerald-300 break-all max-h-24 overflow-y-auto font-bold">
                          {item.decoded}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>No complex Base64, Hex, or Script obfuscation layers detected in this payload.</span>
              </div>
            )}
          </div>

          {/* Interactive De-Obfuscator Sandbox Workbench */}
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Live Analyst De-Obfuscator Sandbox Workbench
            </h4>
            <p className="text-xs text-slate-400">
              Paste any suspicious encoded string, Base64 block, Hex byte array, or wrapped URL to immediately unpack it in real-time.
            </p>

            <div className="space-y-3">
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Paste encoded string here (e.g. SGVsbG8gV29ybGQ= or \x61\x64\x6d\x69\x6e or https://google.com/url?q=...)"
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />

              <button
                onClick={handleDecodeCustom}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs font-mono shadow-md cursor-pointer transition-all hover:scale-105"
              >
                Unpack & Decode Payload
              </button>

              {customDecoded && (
                <div className="bg-slate-900/90 p-4 rounded-xl border border-cyan-500/40 space-y-2 font-mono text-xs animate-in fade-in">
                  <div className="flex items-center justify-between text-cyan-300 font-bold text-[11px]">
                    <span>Format Identified: {customDecoded.type}</span>
                    <button
                      onClick={() => copyToClipboard(customDecoded.decoded, 'custom')}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'custom' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === 'custom' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 text-emerald-300 break-all whitespace-pre-wrap font-bold">
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
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Raw HTML / MIME Source Code Stream</span>
            <button
              onClick={() => copyToClipboard(htmlBody || plainBody, 'raw-source')}
              className="text-[11px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
            >
              {copiedId === 'raw-source' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedId === 'raw-source' ? 'Source Copied' : 'Copy Source'}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {htmlBody || plainBody || "[No Raw Body Content Available]"}
          </div>
        </div>
      )}

    </div>
  );
}
