import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ShieldAlert, Activity, AlertTriangle, CheckCircle2, XCircle, Network } from 'lucide-react';
import L from 'leaflet';
import RelayHopVisualizer from './RelayHopVisualizer';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for the final origin (Best Guess)
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const VERDICT_LABELS = {
  legitimate: { label: "Legitimate Authenticated Origin", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  compromised_account: { label: "Compromised Account / Hijack", color: "bg-red-500/20 text-red-300 border-red-500/40" },
  spoofed_domain: { label: "Spoofed Domain Impersonation", color: "bg-red-500/20 text-red-300 border-red-500/40" },
  anonymized_infrastructure: { label: "Anonymized / Proxy / VPN", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  direct_actor: { label: "Direct Actor Infrastructure", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  unknown: { label: "Unclassified Origin", color: "bg-slate-700 text-slate-300 border-slate-600" }
};

export default function MapPanel({ data }) {
  if (!data || !data.trace || !data.trace.hops) return null;

  const hops = data.trace.hops;
  const ipRep = data.ip_reputation || {};
  const ipNet = data.ip_network_context || {};
  const verdict = data.origin_verdict || {};
  const latency = data.trace.latency_triangulation || {};
  
  // Filter hops that have geolocation coordinates
  const geoHops = hops.filter(h => h.geolocation && (h.geolocation.lat != null || h.geolocation.latitude != null) && (h.geolocation.long != null || h.geolocation.longitude != null));
  
  const getLat = (h) => h.geolocation?.lat ?? h.geolocation?.latitude;
  const getLong = (h) => h.geolocation?.long ?? h.geolocation?.longitude;
  const getAsn = (h) => h.geolocation?.isp_org ?? h.geolocation?.asn_org ?? "Unknown ASN";

  const pathCoordinates = geoHops.map(h => [getLat(h), getLong(h)]);
  const bestGuessIp = data.trace.best_guess_ip;
  const bestGuessHop = geoHops.find(h => h.ip === bestGuessIp) || geoHops[geoHops.length - 1];
  const center = bestGuessHop ? [getLat(bestGuessHop), getLong(bestGuessHop)] : [20, 0];

  const verdictConfig = VERDICT_LABELS[verdict.verdict] || VERDICT_LABELS.unknown;

  return (
    <div className="cyber-panel rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
      
      {/* Header with Origin Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-md">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Forensic Routing & Origin Triangulation
            </h2>
            <p className="text-xs text-slate-400">
              Relay hop progression, Speed-of-Light latency constraints, and IP reputation blocklists
            </p>
          </div>
        </div>

        {/* Origin Verdict Badge */}
        {verdict.verdict && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Origin Verdict</span>
            <div className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${verdictConfig.color}`}>
              <Activity className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{verdictConfig.label}</span>
              {verdict.confidence > 0 && (
                <span className="text-[10px] opacity-80 font-mono">({verdict.confidence}%)</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Latency Triangulation Alert Banner */}
      {latency.is_spoofed_path && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-red-300 uppercase tracking-wider">
              Speed-of-Light Triangulation Violation Detected
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Temporal or physical constraints violated across relay hops. The email headers exhibit speed or time anomalies indicative of forged Received hops or proxy evasion.
            </p>
            {latency.hop_anomalies?.length > 0 && (
              <ul className="list-disc list-inside space-y-0.5 text-red-300/90 font-mono text-[11px] pt-1">
                {latency.hop_anomalies.map((anom, i) => (
                  <li key={i}>{anom}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Animated Packet Stream & Relay Hop Physics Visualizer */}
      <RelayHopVisualizer data={data} />

      {/* Interactive Leaflet Map */}
      {geoHops.length > 0 ? (
        <div className="space-y-3">
          <div className="h-[380px] w-full rounded-xl overflow-hidden border border-slate-700 shadow-inner">
            <MapContainer 
              center={center} 
              zoom={2} 
              style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              
              <Polyline 
                positions={pathCoordinates} 
                color="#3b82f6" 
                weight={3} 
                opacity={0.7} 
                dashArray="8, 8" 
              />

              {geoHops.map((hop, idx) => {
                const isOrigin = hop.ip === bestGuessIp;
                const pos = [getLat(hop), getLong(hop)];
                
                return (
                  <Marker 
                    key={`${hop.ip}-${idx}`} 
                    position={pos}
                    icon={isOrigin ? originIcon : new L.Icon.Default()}
                    zIndexOffset={isOrigin ? 1000 : 0}
                  >
                    <Popup className="bg-slate-800 text-slate-800">
                      <div className="font-sans">
                        <strong className="block text-base mb-1">
                          {isOrigin ? "Origin IP (Suspect)" : `Relay Hop #${hop.hop_index + 1}`}
                        </strong>
                        <div className="text-sm">
                          <p><strong>IP:</strong> {hop.ip}</p>
                          <p><strong>Location:</strong> {hop.geolocation.city ? `${hop.geolocation.city}, ` : ''}{hop.geolocation.country}</p>
                          <p><strong>ASN/ISP:</strong> {getAsn(hop)}</p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3 pt-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" className="h-4 w-3 mr-1.5" alt="Origin" />
                <span>Suspect Origin ({bestGuessIp || 'N/A'})</span>
              </div>
              <div className="flex items-center">
                <img src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png" className="h-4 w-3 mr-1.5" alt="Relay" />
                <span>Intermediary Relays ({hops.length} total)</span>
              </div>
            </div>
            <div className="text-slate-500 font-mono">
              Total Relay Time: {latency.total_latency_seconds ? `${latency.total_latency_seconds}s` : 'Sub-second'}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-700 text-center text-slate-400 text-xs">
          No geographic coordinates resolved for the Received headers in this email.
        </div>
      )}

      {/* Deep IP Reputation & Network Context Lower Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
        
        {/* Left Column: DNSBL Reputation & Tor Intelligence */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                IP Reputation & DNSBL Blocklists
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${
              ipRep.risk_level === 'Critical' || ipRep.is_tor_exit ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
              ipRep.is_listed ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {ipRep.is_tor_exit ? 'TOR EXIT NODE' : (ipRep.risk_level || 'Clean')}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-slate-400 bg-slate-800/60 p-2 rounded border border-slate-700/50 font-mono text-[11px]">
              <span>Reverse DNS (PTR):</span>
              <span className="text-slate-200 truncate max-w-[200px]">{ipRep.reverse_dns || "No PTR Record"}</span>
            </div>

            {/* DNSBL Zones Grid */}
            <div className="space-y-1.5 pt-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                Queried Reputation Zones ({ipRep.dnsbl_results?.length || 0})
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(ipRep.dnsbl_results || []).map((dnsbl, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700/60 font-mono text-[10px]">
                    <span className="text-slate-300 truncate max-w-[110px]">{dnsbl.blocklist_name}</span>
                    {dnsbl.listed ? (
                      <span className="flex items-center gap-1 text-red-400 font-bold">
                        <XCircle className="w-3 h-3" /> LISTED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Clean
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {ipRep.risk_indicators?.length > 0 && (
              <div className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                {ipRep.risk_indicators.join("; ")}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: BGP Network Context & Triangulation */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                BGP ASN & Network Context
              </span>
            </div>
            {ipNet.cidr && (
              <span className="font-mono text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                {ipNet.cidr}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700/50 space-y-1 text-[11px]">
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">ASN / Organization:</span>
                <span className="text-slate-200 font-semibold">{ipNet.asn_info?.as_name || ipNet.asn_info?.asn || "Autonomous System"}</span>
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-400">
                <span>Route Prefix:</span>
                <span className="text-slate-300">{ipNet.asn_info?.route || ipNet.cidr || "Standard Route"}</span>
              </div>
              {ipNet.asn_info?.country && (
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>Country Registry:</span>
                  <span className="text-slate-300">{ipNet.asn_info?.country}</span>
                </div>
              )}
            </div>

            {/* Hop Progression Summary */}
            <div className="bg-slate-800/40 p-2.5 rounded border border-slate-700/50 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                Relay Hop Chain Summary
              </span>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span>Total Hops Traversed:</span>
                <span className="font-bold text-white">{hops.length} server(s)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span>Origin Boundary IP:</span>
                <span className="font-bold text-indigo-300">{bestGuessIp || 'Undetermined'}</span>
              </div>
            </div>

            {ipNet.network_risk_indicators?.length > 0 && (
              <div className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                {ipNet.network_risk_indicators.join("; ")}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

