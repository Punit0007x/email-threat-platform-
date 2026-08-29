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
  // Backend returns link_mismatch_count (int) not an array — wrap for display
  const linkMismatchCount = textSignals.link_mismatch_count || 0;
  // Backend returns has_shortener (bool) not an array of URLs
  const hasShortener = textSignals.has_shortener || false;

  const tech = data.tech_fingerprint || {};
  const history = data.history_intel || {};
  const dork = data.dork_intel || {};
  const domainRecon = data.domain_recon || {};

  // Backend returns technologies as a dict {name: {category, patterns_matched}}; convert to array of names
  const techList = tech.technologies ? Object.keys(tech.technologies) : [];
  // Derive web server from technologies dict if present
  const webServer = tech.technologies?.['Nginx'] ? 'Nginx'
    : tech.technologies?.['Apache'] ? 'Apache'
    : tech.technologies?.['IIS'] ? 'IIS'
    : null;

  const hasVisionOrLinks = ocrText || qrUrls.length > 0 || linkMismatchCount > 0 || domainCheck.is_lookalike || hasShortener || attachments.length > 0;
  const hasOsint = webServer || techList.length > 0 || (history.snapshot_count > 0) || (dork.total_findings > 0) || (domainRecon.subdomains && domainRecon.subdomains.length > 0);

  if (!hasVisionOrLinks && !hasOsint) return null;

  return (
    <div className="bg-transparent relative overflow-hidden p-8 space-y-6">
      
      {/* Corner Screws */}
      <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

      {/* Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f8fafc] pb-4 px-2">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-[#ffffff] text-[#d97706] rounded-2xl shadow-[var(--shadow-card)] border border-white/70">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
              Multi-Modal Vision, Deceptive Links & Deep OSINT
            </h2>
            <p className="text-sm text-[#64748b]">
              OCR attachment extraction, QR detonation, typosquatting, Wayback volatility, and passive reconnaissance
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 rounded-xl font-mono text-sm">
          <button
            onClick={() => setActiveTab('vision_links')}
            className={`key-switch px-3 py-1.5 text-sm font-bold ${activeTab === 'vision_links' ? 'active' : ''}`}
          >
            Vision & Deceptive Links
          </button>
          <button
            onClick={() => setActiveTab('osint_recon')}
            className={`key-switch px-3 py-1.5 text-sm font-bold ${activeTab === 'osint_recon' ? 'active' : ''}`}
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
            <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-4 flex items-start gap-3 border-l-4 border-l-[#ef4444]">
              <ShieldAlert className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[#d63031] uppercase tracking-wider font-mono">
                    {domainCheck.is_lookalike ? "Brand Typosquatting / Lookalike Domain Detected" : "Subdomain Brand Spoofing Detected"}
                  </h4>
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-[#ef4444]/15 text-[#d63031] border border-[#ef4444]/30">
                    Target: {domainCheck.spoofed_brand || "Recognized Brand"}
                  </span>
                </div>
                <p className="text-[#0f172a] leading-relaxed font-medium">{domainCheck.details}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Card: Deceptive Links & URL Shorteners */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-[#e2e8f0]/50 pb-2">
                <span className="font-bold text-[#0f172a] uppercase tracking-wider text-sm flex items-center gap-1.5 font-mono">
                  <Link2 className="w-4 h-4 text-[#0ea5e9]" />
                  Deceptive Link Mismatch Inspector
                </span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${linkMismatchCount > 0 ? 'bg-[#ef4444]/15 text-[#d63031]' : 'bg-[#10b981]/15 text-[#047857]'}`}>
                  {linkMismatchCount} Mismatch(es)
                </span>
              </div>

              {linkMismatchCount > 0 ? (
                <p className="text-[#d63031] font-bold font-mono text-sm py-1">
                  ⚠ {linkMismatchCount} deceptive anchor link mismatch(es) detected in email body.
                </p>
              ) : (
                <p className="text-[#64748b] italic text-sm py-1">No deceptive href mismatches detected in body text.</p>
              )}

              {/* URL Shorteners */}
              {hasShortener && (
                <div className="pt-2 border-t border-[#e2e8f0]/50 space-y-1">
                  <span className="text-[#64748b] font-bold block text-xs uppercase tracking-wider font-mono">
                    Obfuscated / Shortened URLs Detected:
                  </span>
                  <span className="font-mono text-xs font-bold bg-[#f59e0b]/15 text-[#b45309] px-2 py-0.5 rounded border border-[#f59e0b]/30">
                    URL shortener service detected in email links
                  </span>
                </div>
              )}
            </div>

            {/* Right Card: Multi-Modal OCR & QR Detonation */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-[#e2e8f0]/50 pb-2">
                <span className="font-bold text-[#0f172a] uppercase tracking-wider text-sm flex items-center gap-1.5 font-mono">
                  <QrCode className="w-4 h-4 text-[#7048e8]" />
                  Attachment OCR & Detonated QR Codes
                </span>
                {qrUrls.length > 0 && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-[#7048e8]/15 text-[#5f3dc4] border border-[#7048e8]/30">
                    {qrUrls.length} QR Link(s)
                  </span>
                )}
              </div>

              {/* QR Code Detonation Results */}
              {qrUrls.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[#64748b] font-bold text-xs uppercase tracking-wider block font-mono">Decoded QR Code Destinations:</span>
                  {qrUrls.map((qr, i) => (
                    <div key={i} className="bg-[#f8fafc] p-2 rounded-xl border border-[#7048e8]/30 font-mono text-sm text-[#5f3dc4] font-bold truncate flex items-center gap-1.5 shadow-sm">
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-[#7048e8]" />
                      <span className="truncate">{qr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#64748b] italic text-sm py-1">No malicious QR codes found in image attachments.</p>
              )}

              {/* OCR Extracted Text Preview */}
              {ocrText ? (
                <div className="pt-2 border-t border-[#e2e8f0]/50 space-y-1">
                  <span className="text-[#64748b] font-bold block text-xs uppercase tracking-wider font-mono">
                    Extracted Attachment Text (OCR):
                  </span>
                  <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-2.5 max-h-24 overflow-y-auto text-sm font-mono text-[#0f172a] leading-relaxed whitespace-pre-wrap">
                    {ocrText}
                  </div>
                </div>
              ) : (
                <p className="text-[#64748b] italic text-sm py-1">No embedded text detected via Tesseract OCR.</p>
              )}

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="pt-2 border-t border-[#e2e8f0]/50 space-y-1">
                  <span className="text-[#64748b] font-bold block text-xs uppercase tracking-wider font-mono">
                    Attached Files ({attachments.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {attachments.map((att, i) => (
                      <span key={i} className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-[#f8fafc] px-2 py-0.5 rounded border border-[#e2e8f0]/60 text-[#0f172a] shadow-sm">
                        <FileText className="w-3 h-3 text-[#0ea5e9]" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          
          {/* Subcard 1: Web Tech & Phishing Kit Fingerprint */}
          <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 border-b border-[#e2e8f0]/50 pb-2">
                <span className="font-bold text-[#0f172a] uppercase tracking-wider text-sm flex items-center gap-1.5 font-mono">
                  <Cpu className="w-4 h-4 text-[#7048e8]" />
                  Web Technology Fingerprint
                </span>
                {tech.phishing_kit_detected && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#ef4444]/15 text-[#d63031] border border-[#ef4444]/30">
                    PHISHING KIT DETECTED
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e2e8f0]/60 flex justify-between font-mono text-sm shadow-sm">
                  <span className="text-[#64748b]">Web Server Software:</span>
                  <span className="text-[#0f172a] font-bold">{webServer || "Hidden / Unspecified"}</span>
                </div>

                {techList.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[#64748b] font-bold block text-xs uppercase tracking-wider font-mono">Identified Frameworks & Stacks:</span>
                    <div className="flex flex-wrap gap-1">
                      {techList.map((t, i) => (
                        <span key={i} className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#f8fafc] text-[#7048e8] border border-[#7048e8]/30 shadow-sm">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tech.risk_indicators?.length > 0 && (
                  <div className="text-sm text-[#b45309] bg-[#f59e0b]/10 p-2 rounded-xl border border-[#f59e0b]/20 font-medium">
                    {tech.risk_indicators.join("; ")}
                  </div>
                )}
              </div>
            </div>

            {domainRecon.subdomain_count > 0 && (
              <div className="pt-2 border-t border-[#e2e8f0]/50 flex justify-between font-mono text-xs text-[#64748b]">
                <span>Discovered Subdomains:</span>
                <span className="text-[#7048e8] font-bold">{domainRecon.subdomain_count} host(s)</span>
              </div>
            )}
          </div>

          {/* Subcard 2: Wayback Machine History & Dork Intel */}
          <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/30 p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 border-b border-[#e2e8f0]/50 pb-2">
                <span className="font-bold text-[#0f172a] uppercase tracking-wider text-sm flex items-center gap-1.5 font-mono">
                  <History className="w-4 h-4 text-[#059669]" />
                  Wayback History & OSINT Dorks
                </span>
                {history.snapshot_count > 0 && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#10b981]/15 text-[#047857] border border-[#10b981]/30">
                    {history.snapshot_count} Snapshot(s)
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/60 space-y-1 font-mono text-sm shadow-sm">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">First Archived Date:</span>
                    <span className="text-[#0f172a] font-bold">{history.first_seen ? history.first_seen.substring(0, 10) : 'Not Archived'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#64748b]">
                    <span>Web Archive Age:</span>
                    <span className="text-[#059669] font-bold">{history.domain_age_wayback_days != null ? `${history.domain_age_wayback_days} days` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#64748b]">
                    <span>Content Volatility:</span>
                    <span className="text-[#0f172a]">{history.content_changes ? `${history.content_changes} hash rotations` : 'Stable'}</span>
                  </div>
                </div>

                {/* Dork Findings */}
                {dork.total_findings > 0 && (
                  <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/60 space-y-1 shadow-sm">
                    <span className="text-[#64748b] font-bold block text-xs uppercase tracking-wider font-mono">
                      OSINT Dork Scanner ({dork.total_findings} Hit(s)):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {dork.categories?.phishing_pages?.length > 0 && (
                        <span className="text-xs bg-[#ef4444]/15 text-[#d63031] px-1.5 py-0.5 rounded font-mono font-bold">
                          Phishing Pages ({dork.categories.phishing_pages.length})
                        </span>
                      )}
                      {dork.categories?.leaked_credentials?.length > 0 && (
                        <span className="text-xs bg-[#f59e0b]/15 text-[#b45309] px-1.5 py-0.5 rounded font-mono font-bold">
                          Leaked Creds ({dork.categories.leaked_credentials.length})
                        </span>
                      )}
                      {dork.categories?.sensitive_files?.length > 0 && (
                        <span className="text-xs bg-[#eab308]/15 text-[#854d0e] px-1.5 py-0.5 rounded font-mono font-bold">
                          Exposed Files ({dork.categories.sensitive_files.length})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {history.risk_indicators?.length > 0 && (
                  <div className="text-sm text-[#b45309] bg-[#f59e0b]/10 p-2 rounded-xl border border-[#f59e0b]/20 font-medium">
                    {history.risk_indicators.join("; ")}
                  </div>
                )}
              </div>
            </div>

            {dork.domain && (
              <div className="pt-2 border-t border-[#e2e8f0]/50 text-xs font-mono text-[#64748b] truncate">
                Target Domain: <span className="text-[#0f172a] font-bold">{dork.domain}</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
