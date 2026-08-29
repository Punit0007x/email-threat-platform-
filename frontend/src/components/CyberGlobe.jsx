import React, { useState, useEffect, useRef } from 'react';
import GlobeMap from 'react-globe.gl';

const BANGALORE_COORDS = { lat: 12.9716, lng: 77.5946 };

const CyberGlobe = ({ hops = null, interactive = false, width = null, height = null }) => {
  const [windowWidth, setWindowWidth] = useState(width || 800);
  const [windowHeight, setWindowHeight] = useState(height || 500);
  const globeRef = useRef();

  useEffect(() => {
    if (width && height) return;
    const handleResize = () => {
      setWindowWidth(width || (window.innerWidth > 1024 ? window.innerWidth * 0.8 : window.innerWidth - 40));
      setWindowHeight(height || window.innerHeight * 0.8);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);

  let displayArcs = [];
  let displayLabels = [];

  if (hops && hops.length > 0) {
    const geoHops = hops.filter(h => h.geolocation && (h.geolocation.lat != null || h.geolocation.latitude != null) && (h.geolocation.long != null || h.geolocation.longitude != null));
    const getLat = (h) => h.geolocation?.lat ?? h.geolocation?.latitude;
    const getLong = (h) => h.geolocation?.long ?? h.geolocation?.longitude;

    for (let i = 0; i < geoHops.length - 1; i++) {
      displayArcs.push({
        startLat: getLat(geoHops[i]),
        startLng: getLong(geoHops[i]),
        endLat: getLat(geoHops[i + 1]),
        endLng: getLong(geoHops[i + 1]),
        color: ['#ef4444', '#0ea5e9']
      });
    }

    geoHops.forEach((h, i) => {
      displayLabels.push({
        lat: getLat(h),
        lng: getLong(h),
        text: h.geolocation?.city || h.ip,
        color: i === 0 ? '#ef4444' : '#0ea5e9',
        size: 1.2
      });
    });
  } else {
    // Default demo arcs centered on Bangalore, Karnataka, India
    displayArcs = [
      { startLat: 39.9042, startLng: 116.4074, endLat: BANGALORE_COORDS.lat, endLng: BANGALORE_COORDS.lng, color: ['#ef4444', '#ef4444'] },   // Beijing → Bangalore
      { startLat: 55.7558, startLng: 37.6173, endLat: BANGALORE_COORDS.lat, endLng: BANGALORE_COORDS.lng, color: ['#ef4444', '#ef4444'] },     // Moscow → Bangalore
      { startLat: 48.8566, startLng: 2.3522, endLat: BANGALORE_COORDS.lat, endLng: BANGALORE_COORDS.lng, color: ['#0ea5e9', '#0ea5e9'] },      // Paris → Bangalore
      { startLat: 37.7749, startLng: -122.4194, endLat: BANGALORE_COORDS.lat, endLng: BANGALORE_COORDS.lng, color: ['#0ea5e9', '#0ea5e9'] },   // San Francisco → Bangalore
    ];

    displayLabels = [
      { lat: BANGALORE_COORDS.lat, lng: BANGALORE_COORDS.lng, text: 'Bangalore, Karnataka', color: '#10b981', size: 1.5 },
    ];
  }

  // Camera focus animation - Always prioritize Bangalore, Karnataka for origin view
  useEffect(() => {
    if (!globeRef.current) return;
    const timer = setTimeout(() => {
      globeRef.current.pointOfView({ lat: BANGALORE_COORDS.lat, lng: BANGALORE_COORDS.lng, altitude: 2.0 }, 1500);
    }, 400);
    return () => clearTimeout(timer);
  }, [hops]);

  return (
    <div className={`relative flex justify-center items-center h-full w-full ${interactive ? '' : 'pointer-events-none'}`}>
      {/* Illuminated radial aura behind the globe for high contrast */}
      <div className="absolute w-[460px] h-[460px] rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.18)_0%,_rgba(30,58,138,0.12)_45%,_transparent_70%)] pointer-events-none filter blur-xl"></div>
      
      <GlobeMap
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere={true}
        atmosphereColor="#38bdf8"
        atmosphereAltitude={0.28}
        arcsData={displayArcs}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        labelsData={displayLabels}
        labelLat={d => d.lat}
        labelLng={d => d.lng}
        labelText={d => d.text}
        labelSize={d => d.size || 1.3}
        labelDotRadius={d => (d.size || 1.3) * 0.5}
        labelColor={d => d.color}
        labelResolution={2}
        width={windowWidth}
        height={windowHeight}
        backgroundColor="rgba(0,0,0,0)"
        enablePointerInteraction={interactive}
      />
    </div>
  );
};

export default CyberGlobe;
