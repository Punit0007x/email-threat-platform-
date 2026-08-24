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
  html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 8px #3b82f6;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const VERDICT_LABELS = {
  legitimate: { label: "Legitimate Origin", color: "bg-green-50 text-green-700 border-green-200" },
  compromised_account: { label: "Compromised Account", color: "bg-red-50 text-red-700 border-red-200" },
  spoofed_domain: { label: "Fake Sender Domain", color: "bg-red-50 text-red-700 border-red-200" },
  anonymized_infrastructure: { label: "Hidden Server (VPN/Proxy)", color: "bg-amber-50 text-amber-700 border-amber-200" },
  direct_actor: { label: "Attacker Infrastructure", color: "bg-purple-50 text-purple-700 border-purple-200" },
  unknown: { label: "Unknown Origin", color: "bg-gray-100 text-gray-600 border-gray-200" }
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
    <div className="panel-chassis p-6 sm:p-8 space-y-6">

      {/* Header with Origin Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Geographic Map & Network Info
            </h2>
            <p className="text-sm text-gray-500">
              A map showing where the email came from and its server reputation.
            </p>
          </div>
        </div>

        {/* Origin Verdict Badge */}
        {verdict.verdict && (
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase font-semibold text-gray-500 mb-1">Our Conclusion</span>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${verdictConfig.color}`}>
              <Activity className="w-4 h-4 flex-shrink-0" />
              <span>{verdictConfig.label}</span>
              {verdict.confidence > 0 && (
                <span className="opacity-75">({verdict.confidence}%)</span>
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
          <div className="bg-slate-50 border border-gray-200 p-2 rounded-2xl shadow-sm">
            <div className="h-[360px] w-full rounded-xl overflow-hidden bg-gray-200 relative z-0 border border-gray-200">
              <MapContainer 
                center={center} 
                zoom={2} 
                style={{ height: '100%', width: '100%' }}
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
                        <div className="text-sm p-1">
                          <strong className={`block text-xs uppercase mb-1 ${isOrigin ? "text-red-600" : "text-blue-600"}`}>
                            {isOrigin ? "Actual Origin" : `Server Hop #${hop.hop_index + 1}`}
                          </strong>
                          <div><strong>IP:</strong> {hop.ip}</div>
                          <div><strong>Location:</strong> {hop.geolocation.city ? `${hop.geolocation.city}, ` : ''}{hop.geolocation.country}</div>
                          <div><strong>Provider:</strong> {getAsn(hop)}</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 gap-3 px-2 font-medium">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span>Origin IP ({bestGuessIp || 'N/A'})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Relay Servers ({hops.length} total)</span>
              </div>
            </div>
            <div className="font-semibold text-gray-800">
              Time Taken: {latency.total_latency_seconds ? `${latency.total_latency_seconds}s` : 'Sub-second'}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500 text-sm italic shadow-sm">
          We couldn't map the location of this email.
        </div>
      )}

      {/* Deep IP Reputation & Network Context Lower Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        
        {/* Left Column: DNSBL Reputation & Tor Intelligence */}
        <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-gray-800 uppercase text-xs tracking-wider">
                Server Reputation
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-md font-semibold text-xs border ${
              ipRep.risk_level === 'Critical' || ipRep.is_tor_exit ? 'bg-red-50 text-red-700 border-red-200' :
              ipRep.is_listed ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-green-50 text-green-700 border-green-200'
            }`}>
              {ipRep.is_tor_exit ? 'TOR EXIT NODE' : (ipRep.risk_level || 'Clean')}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-gray-600 bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-xs">
              <span className="font-semibold uppercase">Registered Name:</span>
              <span className="text-gray-800 font-bold truncate max-w-[200px]">{ipRep.reverse_dns || "No PTR Record"}</span>
            </div>

            {/* DNSBL Zones Grid */}
            <div className="space-y-2 pt-1">
              <span className="text-gray-500 font-semibold uppercase text-xs tracking-wider block">
                Scanned Databases ({ipRep.dnsbl_results?.length || 0})
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(ipRep.dnsbl_results || []).map((dnsbl, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-xs">
                    <span className="text-gray-800 font-semibold truncate max-w-[110px]">{dnsbl.blocklist_name}</span>
                    {dnsbl.listed ? (
                      <span className="flex items-center gap-1 text-red-600 font-bold">
                        <ShieldAlert className="w-3 h-3 text-red-600" /> LISTED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 font-bold">
                        <ShieldCheck className="w-3 h-3 text-green-600" /> Clean
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {ipRep.risk_indicators?.length > 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 font-medium">
                {ipRep.risk_indicators.join("; ")}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: BGP Network Context & Triangulation */}
        <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-gray-800 uppercase text-xs tracking-wider">
                Network Details
              </span>
            </div>
            {ipNet.cidr && (
              <span className="font-semibold text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-200">
                {ipNet.cidr}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5 text-xs shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase">Organization:</span>
                <span className="text-gray-800 font-bold">{ipNet.asn_info?.as_name || ipNet.asn_info?.asn || "Unknown"}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span className="uppercase font-semibold">Network Block:</span>
                <span className="text-gray-800 font-medium">{ipNet.asn_info?.route || ipNet.cidr || "Standard Route"}</span>
              </div>
              {ipNet.asn_info?.country && (
                <div className="flex justify-between items-center text-gray-500">
                  <span className="uppercase font-semibold">Country Registry:</span>
                  <span className="text-gray-800 font-medium">{ipNet.asn_info?.country}</span>
                </div>
              )}
            </div>

            {/* Hop Progression Summary */}
            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5 shadow-sm text-xs">
              <span className="text-gray-500 font-semibold uppercase tracking-wider block mb-2">
                Hop Summary
              </span>
              <div className="flex items-center justify-between text-gray-600">
                <span className="uppercase font-semibold">Total Hops Traversed:</span>
                <span className="font-bold text-gray-800">{hops.length} server(s)</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span className="uppercase font-semibold">First Server Used:</span>
                <span className="font-bold text-blue-600">{bestGuessIp || 'Undetermined'}</span>
              </div>
            </div>

            {ipNet.network_risk_indicators?.length > 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 font-medium">
                {ipNet.network_risk_indicators.join("; ")}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

