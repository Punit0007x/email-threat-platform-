import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

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

export default function MapPanel({ data }) {
  if (!data || !data.trace || !data.trace.hops) return null;

  const hops = data.trace.hops;
  
  // Filter hops that have geolocation coordinates
  const geoHops = hops.filter(h => h.geolocation && (h.geolocation.lat != null || h.geolocation.latitude != null) && (h.geolocation.long != null || h.geolocation.longitude != null));
  
  if (geoHops.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-2 text-white flex items-center">
          <MapPin className="w-5 h-5 mr-3 text-blue-400" /> Geolocation Trace
        </h2>
        <p className="text-slate-400">No geographic coordinates available for the IP hops in this email.</p>
      </div>
    );
  }

  const getLat = (h) => h.geolocation?.lat ?? h.geolocation?.latitude;
  const getLong = (h) => h.geolocation?.long ?? h.geolocation?.longitude;
  const getAsn = (h) => h.geolocation?.isp_org ?? h.geolocation?.asn_org ?? "Unknown ASN";

  // Create polyline path
  const pathCoordinates = geoHops.map(h => [getLat(h), getLong(h)]);
  
  // Calculate center (just use the last hop / origin)
  const bestGuessIp = data.trace.best_guess_ip;
  const bestGuessHop = geoHops.find(h => h.ip === bestGuessIp) || geoHops[geoHops.length - 1];
  const center = [getLat(bestGuessHop), getLong(bestGuessHop)];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
      <div className="flex items-center mb-6">
        <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg mr-3">
          <MapPin className="w-5 h-5" />
        </span>
        <h2 className="text-xl font-semibold text-white">Forensic Routing Trace</h2>
      </div>

      <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-700">
        <MapContainer 
          center={center} 
          zoom={2} 
          style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
        >
          {/* Dark theme tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          <Polyline 
            positions={pathCoordinates} 
            color="#3b82f6" 
            weight={3} 
            opacity={0.7} 
            dashArray="10, 10" 
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
                      {isOrigin ? "Origin IP (Suspect)" : "Relay Hop"}
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
      
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
        <div className="flex items-center">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" className="h-4 w-3 mr-2" alt="Origin" />
          Best Guess Origin
        </div>
        <div className="flex items-center">
          <img src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png" className="h-4 w-3 mr-2" alt="Relay" />
          Mail Relay
        </div>
        <div className="flex items-center">
          <span className="inline-block w-4 h-0.5 bg-blue-500 mr-2 border-t border-dashed"></span>
          Routing Path
        </div>
      </div>
    </div>
  );
}
