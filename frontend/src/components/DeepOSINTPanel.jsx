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
  const [activeTab, setActiveTab] = useState('vision_links');

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
    <div className="panel-chassis p-6 sm:p-8 space-y-6">
      
      {/* Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm border border-amber-100">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Advanced Scanning & Reconnaissance
            </h2>
            <p className="text-sm text-gray-500">
              Scans attachments, links, and background data for hidden threats.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium">
          <button
            onClick={() => setActiveTab('vision_links')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'vision_links' ? 'bg-white shadow-sm border border-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            Links & Attachments
          </button>
          <button
            onClick={() => setActiveTab('osint_recon')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'osint_recon' ? 'bg-white shadow-sm border border-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            Background Data
          </button>
        </div>
      </div>

      {/* TAB 1: Vision, QR, Links & Domain Spoofing */}
      {activeTab === 'vision_links' && (
        <div className="space-y-4">
          
          {/* Domain Lookalike / Brand Spoofing Banner */}
          {(domainCheck.is_lookalike || domainCheck.is_subdomain_spoof) && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex items-start gap-3 border-l-4 border-l-red-500">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-red-700 uppercase">
                    {domainCheck.is_lookalike ? "Fake Website Detected" : "Fake Subdomain Detected"}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 border border-red-200 font-semibold">
                    Target: {domainCheck.target_brand || "Recognized Brand"}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed font-medium">{domainCheck.details}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Card: Deceptive Links & URL Shorteners */}
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="font-semibold text-gray-800 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-600" />
                  Deceptive Links
                </span>
                <span className={`text-xs px-2 py-1 rounded-md font-semibold ${linkMismatches.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {linkMismatches.length} Found
                </span>
              </div>

              {linkMismatches.length > 0 ? (
                <div className="space-y-3">
                  {linkMismatches.map((m, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 space-y-1 shadow-sm text-xs">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-semibold uppercase">Visible Text:</span>
                        <span className="text-amber-600 font-semibold truncate">{m.display_text}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-semibold text-red-600 uppercase">Actual Target:</span>
                        <span className="text-red-700 font-semibold truncate">{m.actual_url}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic py-2">No deceptive links found in the email body.</p>
              )}

              {/* URL Shorteners */}
              {shorteners.length > 0 && (
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <span className="text-gray-600 font-semibold block text-xs uppercase">
                    Hidden / Shortened URLs ({shorteners.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {shorteners.map((s, i) => (
                      <span key={i} className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Card: Multi-Modal OCR & QR Detonation */}
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="font-semibold text-gray-800 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-purple-600" />
                  Scanned Attachments & QR Codes
                </span>
                {qrUrls.length > 0 && (
                  <span className="text-xs px-2 py-1 rounded-md font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    {qrUrls.length} QR Link(s)
                  </span>
                )}
              </div>

              {/* QR Code Detonation Results */}
              {qrUrls.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-gray-600 font-semibold text-xs uppercase block">Where the QR codes go:</span>
                  {qrUrls.map((qr, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-purple-100 text-xs text-purple-700 font-semibold truncate flex items-center gap-2 shadow-sm">
                      <ExternalLink className="w-4 h-4 flex-shrink-0 text-purple-600" />
                      <span className="truncate">{qr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic py-2">No QR codes found in image attachments.</p>
              )}

              {/* OCR Extracted Text Preview */}
              {ocrText ? (
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <span className="text-gray-600 font-semibold block text-xs uppercase">
                    Text Found Inside Attachments:
                  </span>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto text-xs font-mono text-gray-700 whitespace-pre-wrap shadow-sm">
                    {ocrText}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic py-2">No text was found hidden inside images or attachments.</p>
              )}

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <span className="text-gray-600 font-semibold block text-xs uppercase">
                    Files Attached ({attachments.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-700 shadow-sm">
                        <FileText className="w-4 h-4 text-blue-500" />
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
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-3">
                <span className="font-semibold text-gray-800 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  Website Details
                </span>
                {tech.phishing_kit_detected && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-md bg-red-100 text-red-700 border border-red-200">
                    PHISHING KIT DETECTED
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between text-xs shadow-sm">
                  <span className="text-gray-600 font-semibold uppercase">Server Type:</span>
                  <span className="text-gray-800 font-semibold">{tech.web_server || "Hidden / Unspecified"}</span>
                </div>

                {tech.technologies?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-gray-600 font-semibold block text-xs uppercase">Technologies Used:</span>
                    <div className="flex flex-wrap gap-2">
                      {tech.technologies.map((t, i) => (
                        <span key={i} className="text-xs font-semibold px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100 shadow-sm">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tech.risk_indicators?.length > 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 font-medium">
                    {tech.risk_indicators.join("; ")}
                  </div>
                )}
              </div>
            </div>

            {domainRecon.subdomain_count > 0 && (
              <div className="pt-3 border-t border-gray-200 flex justify-between text-xs font-semibold text-gray-600">
                <span>Discovered Subdomains:</span>
                <span className="text-purple-600">{domainRecon.subdomain_count} host(s)</span>
              </div>
            )}
          </div>

          {/* Subcard 2: Wayback Machine History & Dork Intel */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-3">
                <span className="font-semibold text-gray-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-green-600" />
                  History & Leaks
                </span>
                {history.total_snapshots > 0 && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200">
                    {history.total_snapshots} Snapshot(s)
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2 text-xs shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-semibold uppercase">First Seen Online:</span>
                    <span className="text-gray-800 font-bold">{history.first_seen_date ? history.first_seen_date.substring(0, 10) : 'Never seen before'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-semibold uppercase">Age of Website:</span>
                    <span className="text-green-600 font-bold">{history.domain_age_wayback_days != null ? `${history.domain_age_wayback_days} days` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-semibold uppercase">How often it changes:</span>
                    <span className="text-gray-800 font-semibold">{history.content_changes ? `${history.content_changes} major changes` : 'Stable'}</span>
                  </div>
                </div>

                {/* Dork Findings */}
                {dork.positive_hits > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2 shadow-sm">
                    <span className="text-gray-600 font-semibold block text-xs uppercase">
                      Data Leaks Found ({dork.positive_hits}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {dork.categories?.phishing_pages?.length > 0 && (
                        <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md font-semibold border border-red-100">
                          Phishing Pages ({dork.categories.phishing_pages.length})
                        </span>
                      )}
                      {dork.categories?.leaked_credentials?.length > 0 && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-semibold border border-amber-100">
                          Leaked Passwords ({dork.categories.leaked_credentials.length})
                        </span>
                      )}
                      {dork.categories?.sensitive_files?.length > 0 && (
                        <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-md font-semibold border border-orange-100">
                          Exposed Files ({dork.categories.sensitive_files.length})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {history.risk_indicators?.length > 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 font-medium">
                    {history.risk_indicators.join("; ")}
                  </div>
                )}
              </div>
            </div>

            {dork.domain && (
              <div className="pt-3 border-t border-gray-200 text-xs text-gray-600 truncate flex items-center gap-2">
                <span className="font-semibold uppercase">Website:</span> <span className="text-gray-800 font-bold">{dork.domain}</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
