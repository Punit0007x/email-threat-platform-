import React from 'react';
import { Globe, MapPin, Radio, ShieldCheck, ShieldAlert, Network, Activity } from 'lucide-react';
import RelayHopVisualizer from './RelayHopVisualizer';
import CyberGlobe from './CyberGlobe';

const VERDICT_LABELS = {
  legitimate: { label: "Legitimate Origin", color: "bg-green-50 text-green-700 border-green-200" },
  compromised_account: { label: "Compromised Account (Hijacked)", color: "bg-red-50 text-red-700 border-red-200" },
  spoofed_domain: { label: "Spoofed Domain Impersonation", color: "bg-red-50 text-red-700 border-red-200" },
  anonymized_infrastructure: { label: "Anonymized (VPN / Proxy / Tor)", color: "bg-amber-50 text-amber-700 border-amber-200" },
  direct_actor: { label: "Direct Malicious Actor", color: "bg-purple-50 text-purple-700 border-purple-200" },
  unknown: { label: "Unknown Origin", color: "bg-gray-50 text-gray-500 border-gray-200" }
};

export default function MapPanel({ data, onLookupIOC }) {
  if (!data || !data.trace || !data.trace.hops) return null;

  const hops = data.trace.hops;
  const ipRep = data.ip_reputation || {};
  const ipNet = data.ip_network_context || {};
  const verdict = data.origin_verdict || {};
  const latency = data.trace.latency_triangulation || {};
  
  const bestGuessIp = data.trace.best_guess_ip || (hops.length > 0 ? hops[0].ip : 'Resolved Origin');
  const originGeo = data.trace.best_guess_geolocation;

  const effectiveHops = (hops && hops.length > 0) ? hops : [
    {
      ip: bestGuessIp,
      revdns: "origin-host",
      by: "mail-server",
      geolocation: originGeo || { country: "Origin Server", city: "Resolved Origin", lat: 38.8951, long: -77.0364, isp_org: "Mail Host" }
    }
  ];
  
  const geoHops = effectiveHops.filter(h => h.geolocation && (h.geolocation.lat != null || h.geolocation.latitude != null) && (h.geolocation.long != null || h.geolocation.longitude != null));
  
  const verdictConfig = VERDICT_LABELS[verdict.category] || VERDICT_LABELS.unknown;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Origin Traceability & Location
            </h2>
            <p className="text-sm text-gray-500 font-medium">Tracking the physical path and origin of the email</p>
          </div>
        </div>

        {verdict.category && (
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Source Verdict</span>
            <div className={`px-4 py-2 rounded-lg border text-sm font-bold flex items-center gap-2 ${verdictConfig.color}`}>
              <Activity className="w-4 h-4 flex-shrink-0" />
              <span>{verdictConfig.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Map Box (Almost Full Screen) */}
      {geoHops.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-[#0b1120] rounded-2xl p-2 shadow-2xl border border-slate-700/50 relative overflow-hidden">
            {/* Ambient cyber illumination */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.12)_0%,_rgba(15,23,42,0.6)_60%,_transparent_100%)]"></div>
            <div className="h-[80vh] w-full flex items-center justify-center rounded-xl overflow-hidden relative z-10">
              <CyberGlobe hops={hops} interactive={true} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="font-bold">Suspect Origin ({bestGuessIp || 'N/A'})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                <span className="font-bold">Intermediary Relays ({hops.length} total)</span>
              </div>
            </div>
            <div className="font-bold">
              Total Transit Time: {latency.total_latency_seconds ? `${latency.total_latency_seconds} seconds` : 'Sub-second'}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
          No geographic coordinates resolved for the servers in this email.
        </div>
      )}

      {/* Speed-of-Light Relay Hop Pipeline (Moved Below Globe) */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
        <h3 className="text-base font-bold text-gray-800 mb-4">Email Routing Path (Hop by Hop)</h3>
        <RelayHopVisualizer data={data} />
      </div>

      {/* Deep IP Reputation & Network Context Lower Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: DNSBL Reputation & Tor Intelligence */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span className="font-bold text-gray-900 text-base">
                IP Reputation & Blocklists
              </span>
            </div>
            <span className={`px-3 py-1 rounded-lg font-bold text-xs border ${
              ipRep.risk_level === 'Critical' || ipRep.is_tor_exit ? 'bg-red-50 text-red-700 border-red-200' :
              ipRep.is_listed ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-green-50 text-green-700 border-green-200'
            }`}>
              {ipRep.is_tor_exit ? 'TOR EXIT NODE' : (ipRep.risk_level || 'Clean')}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-600 font-bold">Reverse DNS (PTR):</span>
              <span className="text-gray-900 font-bold truncate max-w-[200px]">{ipRep.reverse_dns || "No Record"}</span>
            </div>

            {/* DNSBL Zones Grid */}
            <div className="space-y-2">
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wide">
                Security Databases Checked ({ipRep.dnsbl_results?.length || 0})
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(ipRep.dnsbl_results || []).map((dnsbl, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                    <span className="text-gray-800 font-semibold text-sm truncate max-w-[100px]">{dnsbl.blocklist_name}</span>
                    {dnsbl.listed ? (
                      <span className="flex items-center gap-1 text-red-600 font-bold text-xs">
                        <ShieldAlert className="w-4 h-4" /> LISTED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4" /> Clean
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {ipRep.risk_indicators?.length > 0 && (
              <div className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 font-medium">
                {ipRep.risk_indicators.join("; ")}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: BGP Network Context & Triangulation */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-gray-900 text-base">
                ISP & Network Context
              </span>
            </div>
            {ipNet.cidr && (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                {ipNet.cidr}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Service Provider / ISP:</span>
                <span className="text-gray-900 font-bold">{ipNet.asn_info?.as_name || ipNet.asn_info?.asn || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Country Registry:</span>
                <span className="text-gray-900 font-bold">{ipNet.asn_info?.country || "Unknown"}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2 text-sm">
              <span className="text-gray-500 font-bold uppercase text-xs tracking-wide block mb-2">
                Routing Summary
              </span>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold">Total Servers Jumped:</span>
                <span className="font-bold text-gray-900">{hops.length} server(s)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-bold">Likely Origin IP:</span>
                <span className="font-bold text-sky-600">{bestGuessIp || 'Undetermined'}</span>
              </div>
            </div>

            {ipNet.network_risk_indicators?.length > 0 && (
              <div className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 font-medium">
                {ipNet.network_risk_indicators.join("; ")}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
