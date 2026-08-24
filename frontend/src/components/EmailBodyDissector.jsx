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
          type: 'Base64 Encoded',
          raw: raw.substring(0, 40) + (raw.length > 40 ? '...' : ''),
          fullRaw: raw,
          decoded: decoded,
          confidence: 'High',
          color: 'text-blue-700 border-blue-200 bg-blue-50'
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
      type: 'Hex Escaped',
      raw: raw.substring(0, 40) + '...',
      fullRaw: raw,
      decoded: decoded,
      confidence: 'High',
      color: 'text-orange-700 border-orange-200 bg-orange-50'
    });
  }

  // 3. Multi-hop URL Redirector Obfuscation
  const redirectRegex = /https?:\/\/(?:www\.)?(?:google\.com\/url\?q=|bing\.com\/ck\/|l\.facebook\.com\/l\.php\?u=)(https?[^&\s]+)/gi;
  while ((match = redirectRegex.exec(text)) !== null) {
    results.push({
      type: 'Hidden Redirect',
      raw: match[0].substring(0, 45) + '...',
      fullRaw: match[0],
      decoded: decodeURIComponent(match[1]),
      confidence: 'High',
      color: 'text-red-700 border-red-200 bg-red-50'
    });
  }

  return results.slice(0, 10);
}

function detectHiddenText(html, plain) {
  const hidden = [];
  
  const zeroWidthRegex = /[\u200B\u200C\u200D\uFEFF\u00A0]{2,}/g;
  if (plain && zeroWidthRegex.test(plain)) {
    hidden.push({
      type: 'Invisible Characters',
      location: 'Plain text',
      desc: 'Invisible characters used to trick spam filters.'
    });
  }

  if (html) {
    if (html.includes('font-size:0') || html.includes('font-size: 0') || html.includes('display:none') || html.includes('display: none')) {
      hidden.push({
        type: 'Hidden HTML Elements',
        location: 'HTML Code',
        desc: 'Text hidden using CSS rules so the user cannot see it, but spam filters process it.'
      });
    }
    if (html.includes('color:white;background:white') || html.includes('color:#ffffff;background:#ffffff') || html.includes('color: white; background: white')) {
      hidden.push({
        type: 'White-on-White Text',
        location: 'HTML Code',
        desc: 'Invisible white text on a white background used to bypass filters.'
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
  const [viewMode, setViewMode] = useState('wysiwyg');
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
            result = { type: 'Hex Decoded', decoded: hexStr };
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
    if (!htmlBody) return `<div style="font-family: monospace; color: #374151; background: #f3f4f6; padding: 20px;">[No HTML content found. Showing plain text instead.]<br><br>${plainBody.replace(/\n/g, '<br>')}</div>`;

    let sanitized = htmlBody
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '<!-- [SCRIPT BLOCKED FOR SAFETY] -->')
      .replace(/onload=/gi, 'data-blocked-onload=')
      .replace(/onerror=/gi, 'data-blocked-onerror=')
      .replace(/onclick=/gi, 'data-blocked-onclick=');

    const injectedStyles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #374151; background: #f9fafb; padding: 16px; line-height: 1.6; }
        a { color: #dc2626; text-decoration: underline; font-weight: bold; }
      </style>
    `;

    return injectedStyles + sanitized;
  }, [htmlBody, plainBody]);

  return (
    <div className="panel-chassis p-6 sm:p-8 space-y-6">
      
      {/* Header with Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl shadow-sm border border-red-100">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Email Content Viewer
              <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded border border-green-200">
                PROTECTED VIEW
              </span>
            </h2>
            <p className="text-sm text-gray-500">
              View the email safely and inspect hidden content or deceptive links.
            </p>
          </div>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium">
          {[
            { id: 'wysiwyg', label: 'Email View', icon: Eye },
            { id: 'text', label: 'Suspicious Links', icon: FileText },
            { id: 'deobfuscate', label: 'Hidden Code Viewer', icon: Terminal },
            { id: 'raw', label: 'Raw Source', icon: Code },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-white shadow-sm border border-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Threat Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-gray-600 font-medium">Deceptive Links:</span>
          <span className={`font-semibold ${linkMismatches.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {linkMismatches.length} Found
          </span>
        </div>

        <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-gray-600 font-medium">Hidden Code:</span>
          <span className={`font-semibold ${obfuscations.length > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
            {obfuscations.length} Found
          </span>
        </div>

        <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-gray-600 font-medium">Invisible Text:</span>
          <span className={`font-semibold ${hiddenText.length > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
            {hiddenText.length} Found
          </span>
        </div>

        <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-gray-600 font-medium">Tracking Pixels:</span>
          <span className={`font-semibold ${trackingPixels.length > 0 ? 'text-purple-600' : 'text-gray-800'}`}>
            {trackingPixels.length} Found
          </span>
        </div>
      </div>

      {/* TAB 1: Safe Sandboxed WYSIWYG Preview */}
      {viewMode === 'wysiwyg' && (
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600 bg-slate-50 border border-gray-200 rounded-lg px-4 py-2">
            <span className="flex items-center gap-2 text-green-600 font-semibold">
              <Lock className="w-4 h-4" />
              Security active: harmful code blocked.
            </span>
          </div>

          <div className="w-full h-[450px] rounded-xl overflow-hidden border border-gray-200 bg-white">
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
        <div className="space-y-6">
          
          {/* Deceptive Links Callouts */}
          {linkMismatches.length > 0 ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 space-y-3 border-l-4 border-l-red-500">
              <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Deceptive Links Found ({linkMismatches.length})
              </h4>
              <p className="text-sm text-gray-700">
                These links say one thing but take the user to a completely different website.
              </p>

              <div className="space-y-3 pt-2">
                {linkMismatches.map((mismatch, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 space-y-2 text-sm shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-xs uppercase font-semibold">Text user sees:</span>
                        <strong className="text-green-700">{mismatch.text}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold border border-red-200">
                          MISMATCH
                        </span>
                        {onLookupIOC && (
                          <button
                            onClick={() => onLookupIOC(mismatch.href)}
                            className="text-xs text-red-600 hover:underline cursor-pointer font-semibold"
                          >
                            Investigate Target
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 truncate">
                      <span className="text-xs uppercase font-semibold">Where it actually goes:</span>
                      <span className="text-red-700 font-medium truncate">{mismatch.href}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>No deceptive links found. Links match the text shown to the user.</span>
            </div>
          )}

          {/* Hidden Zero-Font & Filter Poisoning Callouts */}
          {hiddenText.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-3 border-l-4 border-l-amber-500">
              <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Invisible Text Found ({hiddenText.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hiddenText.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 space-y-1 text-sm shadow-sm">
                    <div className="flex items-center justify-between">
                      <strong className="text-amber-800 font-semibold">{item.type}</strong>
                      <span className="text-xs text-gray-500 font-medium">{item.location}</span>
                    </div>
                    <p className="text-gray-700 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plain Text Body Inspector */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-800">
              Plain Text Version
            </h4>
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-sm font-mono text-gray-800 max-h-72 overflow-y-auto whitespace-pre-wrap">
              {plainBody || "[No plain text version found]"}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: Automated & Interactive De-Obfuscator Studio */}
      {viewMode === 'deobfuscate' && (
        <div className="space-y-6">
          
          {/* Automated De-Obfuscated Findings */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-red-600" />
              Automatically Uncovered Code ({obfuscations.length})
            </h4>

            {obfuscations.length > 0 ? (
              <div className="space-y-3">
                {obfuscations.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 text-sm shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${item.color}`}>
                        {item.type}
                      </span>
                      <button
                        onClick={() => copyToClipboard(item.decoded, `item-${idx}`)}
                        className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium transition-colors"
                      >
                        {copiedId === `item-${idx}` ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        {copiedId === `item-${idx}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs font-semibold uppercase">Hidden Input:</span>
                        <div className="bg-slate-50 border border-gray-200 rounded-md p-3 text-gray-600 break-all max-h-24 overflow-y-auto font-mono text-xs">
                          {item.fullRaw}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-green-600 text-xs font-semibold uppercase">Revealed Content:</span>
                        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-700 break-all max-h-24 overflow-y-auto font-mono text-xs font-semibold">
                          {item.decoded}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>No complex hidden code found in this email.</span>
              </div>
            )}
          </div>

          {/* Interactive De-Obfuscator Sandbox Workbench */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Manual Code Decrypter
            </h4>
            <p className="text-sm text-gray-600">
              Paste any suspicious encoded string to immediately decrypt it and see what it says.
            </p>

            <div className="space-y-3">
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Paste encoded text here..."
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handleDecodeCustom}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Decrypt Text
              </button>

              {customDecoded && (
                <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-2 text-sm shadow-sm">
                  <div className="flex items-center justify-between text-blue-700 font-semibold text-xs">
                    <span>Format Identified: {customDecoded.type}</span>
                    <button
                      onClick={() => copyToClipboard(customDecoded.decoded, 'custom')}
                      className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium"
                    >
                      {copiedId === 'custom' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copiedId === 'custom' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-green-700 break-all whitespace-pre-wrap font-mono font-semibold">
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
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="font-semibold text-gray-800">Raw Email Source Code</span>
            <button
              onClick={() => copyToClipboard(htmlBody || plainBody, 'raw-source')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              {copiedId === 'raw-source' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copiedId === 'raw-source' ? 'Copied' : 'Copy Code'}
            </button>
          </div>

          <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-xs font-mono text-gray-800 max-h-96 overflow-y-auto whitespace-pre-wrap">
            {htmlBody || plainBody || "[No code available]"}
          </div>
        </div>
      )}

    </div>
  );
}
