import React, { useState } from 'react';
import { 
  Scan, 
  QrCode, 
  Link2, 
  History, 
  Cpu, 
  FileText, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export default function DeepOSINTPanel({ data }) {
  const [activeTab, setActiveTab] = useState('vision_links'); // 'vision_links' | 'osint_recon'

  if (!data) return null;

  const ocrText = data.ocr_text || '';
  const qrUrls = data.qr_urls || [];
  const attachments = data.attachments || [];
  const domainCheck = data.domain_check || {};
  const textSignals = data.text_signals || {};
  const linkMismatches = textSignals.link_mismatches || [];
  const shorteners = textSignals.shortener_urls || [];

  const tech = data.tech_fingerprint || {};
  const history = data.history_intel || {};
  const dork = data.dork_intel || {};
  const domainRecon = data.domain_recon || {};

  const hasVisionOrLinks = ocrText || qrUrls.length > 0 || linkMismatches.length > 0 || domainCheck.is_lookalike || shorteners.length > 0 || attachments.length > 0;
  const hasOsint = tech.web_server || (tech.technologies && tech.technologies.length > 0) || history.total_snapshots > 0 || dork.positive_hits > 0 || (domainRecon.subdomains && domainRecon.subdomains.length > 0);

  if (!hasVisionOrLinks && !hasOsint) return null;

  return (
    <div className="cyber-panel rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
      
      {/* Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shadow-md">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Multi-Modal Vision, Deceptive Links & Deep OSINT
            </h2>
            <p className="text-xs text-slate-400">
              OCR attachment extraction, QR detonation, typosquatting, Wayback volatility, and passive reconnaissance
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('vision_links')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${activeTab === 'vision_links' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Vision, Links & Attachments
          </button>
          <button
            onClick={() => setActiveTab('osint_recon')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${activeTab === 'osint_recon' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Passive OSINT & Web Intel
          </button>
        </div>
      </div>

      {/* TAB 1: Vision, QR, Links & Domain Spoofing */}
      {activeTab === 'vision_links' && (
        <div className="space-y-4">
          
          {/* Domain Lookalike / Brand Spoofing Banner */}
          {(domainCheck.is_lookalike || domainCheck.is_subdomain_spoof) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-red-300 uppercase tracking-wider">
                    {domainCheck.is_lookalike ? "Brand Typosquatting / Lookalike Domain Detected" : "Subdomain Brand Spoofing Detected"}
                  </h4>
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-red-500/20 text-red-300 border border-red-500/40">
                    Target: {domainCheck.target_brand || "Recognized Brand"}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{domainCheck.details}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Card: Deceptive Links & URL Shorteners */}
            <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-blue-400" />
                  Deceptive Link Mismatch Inspector
                </span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${linkMismatches.length > 0 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {linkMismatches.length} Mismatch(es)
                </span>
              </div>

              {linkMismatches.length > 0 ? (
                <div className="space-y-2">
                  {linkMismatches.map((m, i) => (
                    <div key={i} className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1 font-mono text-[11px]">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="font-bold text-slate-400">Visible Text:</span>
                        <span className="text-amber-300 truncate">{m.display_text}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="font-bold text-red-400">Actual Target:</span>
                        <span className="text-red-300 truncate">{m.actual_url}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px]">No deceptive href mismatches detected in body text.</p>
              )}

              {/* URL Shorteners */}
              {shorteners.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                    Obfuscated / Shortened URLs ({shorteners.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {shorteners.map((s, i) => (
                      <span key={i} className="font-mono text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Card: Multi-Modal OCR & QR Detonation */}
            <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-purple-400" />
                  Attachment OCR & Detonated QR Codes
                </span>
                {qrUrls.length > 0 && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {qrUrls.length} QR Link(s)
                  </span>
                )}
              </div>

              {/* QR Code Detonation Results */}
              {qrUrls.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Decoded QR Code Destinations:</span>
                  {qrUrls.map((qr, i) => (
                    <div key={i} className="bg-slate-800/80 p-2 rounded border border-purple-500/30 font-mono text-[11px] text-purple-300 truncate flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                      <span className="truncate">{qr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px]">No malicious QR codes found in image attachments.</p>
              )}

              {/* OCR Extracted Text Preview */}
              {ocrText ? (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                    Extracted Attachment Text (OCR):
                  </span>
                  <div className="bg-slate-800/70 p-2 rounded border border-slate-700 max-h-24 overflow-y-auto text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {ocrText}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px]">No embedded text detected via Tesseract OCR.</p>
              )}

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                    Attached Files ({attachments.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {attachments.map((att, i) => (
                      <span key={i} className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                        <FileText className="w-3 h-3 text-blue-400" />
                        {att.filename} ({att.content_type})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: Passive OSINT, Wayback & Web Tech */}
      {activeTab === 'osint_recon' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Subcard 1: Web Tech & Phishing Kit Fingerprint */}
          <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Web Technology Fingerprint
                </span>
                {tech.phishing_kit_detected && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                    PHISHING KIT DETECTED
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="bg-slate-800/70 p-2 rounded border border-slate-700 flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Web Server Software:</span>
                  <span className="text-slate-200 font-semibold">{tech.web_server || "Hidden / Unspecified"}</span>
                </div>

                {tech.technologies?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Identified Frameworks & Stacks:</span>
                    <div className="flex flex-wrap gap-1">
                      {tech.technologies.map((t, i) => (
                        <span key={i} className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tech.risk_indicators?.length > 0 && (
                  <div className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    {tech.risk_indicators.join("; ")}
                  </div>
                )}
              </div>
            </div>

            {domainRecon.subdomain_count > 0 && (
              <div className="pt-2 border-t border-slate-800 flex justify-between font-mono text-[10px] text-slate-400">
                <span>Discovered Subdomains:</span>
                <span className="text-indigo-300 font-bold">{domainRecon.subdomain_count} host(s)</span>
              </div>
            )}
          </div>

          {/* Subcard 2: Wayback Machine History & Dork Intel */}
          <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-400" />
                  Wayback History & OSINT Dorks
                </span>
                {history.total_snapshots > 0 && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {history.total_snapshots} Snapshot(s)
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="bg-slate-800/70 p-2.5 rounded border border-slate-700 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">First Archived Appearance:</span>
                    <span className="text-slate-200">{history.first_seen_date ? history.first_seen_date.substring(0, 10) : 'Not Archived'}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Web Archive Age:</span>
                    <span className="text-emerald-300 font-bold">{history.domain_age_wayback_days != null ? `${history.domain_age_wayback_days} days` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Content Mutation Volatility:</span>
                    <span className="text-slate-300">{history.content_changes ? `${history.content_changes} hash rotations` : 'Stable'}</span>
                  </div>
                </div>

                {/* Dork Findings */}
                {dork.positive_hits > 0 && (
                  <div className="bg-slate-800/70 p-2.5 rounded border border-slate-700 space-y-1">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                      OSINT Dork Scanner ({dork.positive_hits} Hit(s)):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {dork.categories?.phishing_pages?.length > 0 && (
                        <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-mono">
                          Phishing Pages ({dork.categories.phishing_pages.length})
                        </span>
                      )}
                      {dork.categories?.leaked_credentials?.length > 0 && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                          Leaked Creds ({dork.categories.leaked_credentials.length})
                        </span>
                      )}
                      {dork.categories?.sensitive_files?.length > 0 && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded font-mono">
                          Exposed Files ({dork.categories.sensitive_files.length})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {history.risk_indicators?.length > 0 && (
                  <div className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    {history.risk_indicators.join("; ")}
                  </div>
                )}
              </div>
            </div>

            {dork.domain && (
              <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 truncate">
                Target Domain: <span className="text-slate-300">{dork.domain}</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
