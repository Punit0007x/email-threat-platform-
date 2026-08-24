import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Globe, MapPin, Radio, ShieldCheck, ShieldAlert, Network, Activity } from 'lucide-react';
import L from 'leaflet';
import RelayHopVisualizer from './RelayHopVisualizer';

// Custom Map Marker Icons
const originIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 0 10px #ef4444;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const hopIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #0ea5e9; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 8px #0ea5e9;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const VERDICT_LABELS = {
  legitimate: { label: "Legitimate Authenticated Origin", color: "bg-[#10b981]/15 text-[#047857] border-[#10b981]/30" },
  compromised_account: { label: "Compromised Account / Hijack", color: "bg-[#ef4444]/15 text-[#d63031] border-[#ef4444]/30" },
  spoofed_domain: { label: "Spoofed Domain Impersonation", color: "bg-[#ef4444]/15 text-[#d63031] border-[#ef4444]/30" },
  anonymized_infrastructure: { label: "Anonymized / Proxy / VPN", color: "bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/30" },
  direct_actor: { label: "Direct Actor Infrastructure", color: "bg-[#7048e8]/15 text-[#5f3dc4] border-[#7048e8]/30" },
  unknown: { label: "Unclassified Origin", color: "bg-[#ffffff] text-[#64748b] border-[#e2e8f0]" }
};

export default function MapPanel({ data, onLookupIOC }) {
  if (!data || !data.trace || !data.trace.hops) return null;

  const hops = data.trace.hops;
  const ipRep = data.ip_reputation || {};
  const ipNet = data.ip_network_context || {};
  const verdict = data.origin_verdict || {};
  const latency = data.trace.latency_triangulation || {};
  
  const geoHops = hops.filter(h => h.geolocation && (h.geolocation.lat != null || h.geolocation.latitude != null) && (h.geolocation.long != null || h.geolocation.longitude != null));
  
  const getLat = (h) => h.geolocation?.lat ?? h.geolocation?.latitude;
  const getLong = (h) => h.geolocation?.long ?? h.geolocation?.longitude;
  const getAsn = (h) => h.geolocation?.isp_org ?? h.geolocation?.asn_org ?? "Unknown ASN";

  const pathCoordinates = geoHops.map(h => [getLat(h), getLong(h)]);
  const bestGuessIp = data.trace.best_guess_ip || (hops.length > 0 ? hops[0].ip : null);
  const bestGuessHop = geoHops.find(h => h.ip === bestGuessIp) || geoHops[geoHops.length - 1];
  const center = bestGuessHop ? [getLat(bestGuessHop), getLong(bestGuessHop)] : [20, 0];

  const verdictConfig = VERDICT_LABELS[verdict.verdict] || VERDICT_LABELS.unknown;

  return (
    <div className="panel-chassis p-6 sm:p-8 space-y-6 relative overflow-hidden">
      
      {/* Corner Screws */}
      <div className="absolute top-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute top-3.5 right-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 left-3.5"><div className="screw-head" /></div>
      <div className="absolute bottom-3.5 right-3.5"><div className="screw-head" /></div>

      {/* Header with Origin Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f8fafc] pb-4 px-2">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-[#ffffff] text-[#0ea5e9] rounded-2xl shadow-[var(--shadow-card)] border border-white/70">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
              Forensic Routing & Origin Triangulation
            </h2>
            <p className="text-xs text-[#64748b]">
              Relay hop progression, Speed-of-Light latency constraints, and IP reputation blocklists
            </p>
          </div>
        </div>

        {/* Origin Verdict Badge */}
        {verdict.verdict && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider font-mono">Origin Verdict</span>
            <div className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 font-mono ${verdictConfig.color}`}>
              <Activity className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{verdictConfig.label}</span>
              {verdict.confidence > 0 && (
                <span className="text-[10px] opacity-80 font-mono">({verdict.confidence}%)</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Speed-of-Light Relay Hop Pipeline */}
      <RelayHopVisualizer data={data} />

      {/* Interactive Map Box */}
      {geoHops.length > 0 ? (
        <div className="space-y-3">
          <div className="slot-recessed p-2 rounded-2xl">
            <div className="h-[360px] w-full rounded-xl overflow-hidden shadow-inner border border-[#e2e8f0]/60 bg-[#f8fafc]">
              <MapContainer 
                center={center} 
                zoom={2} 
                style={{ height: '100%', width: '100%', backgroundColor: '#f8fafc' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                
                <Polyline 
                  positions={pathCoordinates} 
                  color="#ef4444" 
                  weight={2.5} 
                  opacity={0.8} 
                  dashArray="6, 6" 
                />

                {geoHops.map((hop, idx) => {
                  const isOrigin = hop.ip === bestGuessIp;
                  const pos = [getLat(hop), getLong(hop)];
                  
                  return (
                    <Marker 
                      key={`${hop.ip}-${idx}`} 
                      position={pos}
                      icon={isOrigin ? originIcon : hopIcon}
                    >
                      <Popup>
                        <div className="font-mono text-xs p-1">
                          <strong className={`block text-xs mb-1 font-bold ${isOrigin ? "text-[#ef4444]" : "text-[#0ea5e9]"}`}>
                            {isOrigin ? "PHYSICAL ORIGIN NODE" : `RELAY HOP #${hop.hop_index + 1}`}
                          </strong>
                          <div><strong>IP:</strong> {hop.ip}</div>
                          <div><strong>Location:</strong> {hop.geolocation.city ? `${hop.geolocation.city}, ` : ''}{hop.geolocation.country}</div>
                          <div><strong>ASN:</strong> {getAsn(hop)}</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#64748b] gap-3 px-2 font-mono">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                <span>Suspect Origin ({bestGuessIp || 'N/A'})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></span>
                <span>Intermediary Relays ({hops.length} total)</span>
              </div>
            </div>
            <div className="font-bold">
              Total Relay Time: {latency.total_latency_seconds ? `${latency.total_latency_seconds}s` : 'Sub-second'}
            </div>
          </div>
        </div>
      ) : (
        <div className="slot-recessed p-6 text-center text-[#64748b] text-xs font-mono">
          No geographic coordinates resolved for the Received headers in this email.
        </div>
      )}

      {/* Deep IP Reputation & Network Context Lower Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        
        {/* Left Column: DNSBL Reputation & Tor Intelligence */}
        <div className="slot-recessed p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#e2e8f0]/50 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#ef4444]" />
              <span className="font-bold text-[#0f172a] uppercase tracking-wider text-[11px]">
                IP Reputation & DNSBL Blocklists
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              ipRep.risk_level === 'Critical' || ipRep.is_tor_exit ? 'bg-[#ef4444]/15 text-[#d63031] border border-[#ef4444]/30' :
              ipRep.is_listed ? 'bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/30' :
              'bg-[#10b981]/15 text-[#047857] border border-[#10b981]/30'
            }`}>
              {ipRep.is_tor_exit ? 'TOR EXIT NODE' : (ipRep.risk_level || 'Clean')}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[#64748b] bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/50 shadow-sm">
              <span className="font-bold">Reverse DNS (PTR):</span>
              <span className="text-[#0f172a] font-bold truncate max-w-[200px]">{ipRep.reverse_dns || "No PTR Record"}</span>
            </div>

            {/* DNSBL Zones Grid */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[#64748b] font-bold uppercase text-[10px] tracking-wider block">
                Queried Reputation Zones ({ipRep.dnsbl_results?.length || 0})
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(ipRep.dnsbl_results || []).map((dnsbl, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#f8fafc] px-2.5 py-1.5 rounded-xl border border-[#e2e8f0]/50 shadow-sm">
                    <span className="text-[#0f172a] font-bold truncate max-w-[110px]">{dnsbl.blocklist_name}</span>
                    {dnsbl.listed ? (
                      <span className="flex items-center gap-1 text-[#d63031] font-bold">
                        <ShieldAlert className="w-3 h-3 text-[#ef4444]" /> LISTED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[#059669] font-bold">
                        <ShieldCheck className="w-3 h-3 text-[#059669]" /> Clean
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {ipRep.risk_indicators?.length > 0 && (
              <div className="text-[11px] text-[#b45309] bg-[#f59e0b]/10 p-2.5 rounded-xl border border-[#f59e0b]/20 font-medium">
                {ipRep.risk_indicators.join("; ")}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: BGP Network Context & Triangulation */}
        <div className="slot-recessed p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#e2e8f0]/50 pb-2">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-[#7048e8]" />
              <span className="font-bold text-[#0f172a] uppercase tracking-wider text-[11px]">
                BGP ASN & Network Context
              </span>
            </div>
            {ipNet.cidr && (
              <span className="font-mono text-[10px] font-bold text-[#7048e8] bg-[#7048e8]/15 px-2 py-0.5 rounded border border-[#7048e8]/30">
                {ipNet.cidr}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/50 space-y-1 text-[11px] shadow-sm">
              <div className="flex justify-between">
                <span className="text-[#64748b] font-bold">ASN / Organization:</span>
                <span className="text-[#0f172a] font-bold">{ipNet.asn_info?.as_name || ipNet.asn_info?.asn || "Autonomous System"}</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#64748b]">
                <span>Route Prefix:</span>
                <span className="text-[#0f172a]">{ipNet.asn_info?.route || ipNet.cidr || "Standard Route"}</span>
              </div>
              {ipNet.asn_info?.country && (
                <div className="flex justify-between text-[10px] text-[#64748b]">
                  <span>Country Registry:</span>
                  <span className="text-[#0f172a]">{ipNet.asn_info?.country}</span>
                </div>
              )}
            </div>

            {/* Hop Progression Summary */}
            <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/50 space-y-1 shadow-sm">
              <span className="text-[#64748b] font-bold uppercase text-[10px] tracking-wider block">
                Relay Hop Chain Summary
              </span>
              <div className="flex items-center justify-between text-[11px] text-[#0f172a]">
                <span>Total Hops Traversed:</span>
                <span className="font-bold">{hops.length} server(s)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#0f172a]">
                <span>Origin Boundary IP:</span>
                <span className="font-bold text-[#0ea5e9]">{bestGuessIp || 'Undetermined'}</span>
              </div>
            </div>

            {ipNet.network_risk_indicators?.length > 0 && (
              <div className="text-[11px] text-[#b45309] bg-[#f59e0b]/10 p-2.5 rounded-xl border border-[#f59e0b]/20 font-medium">
                {ipNet.network_risk_indicators.join("; ")}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

