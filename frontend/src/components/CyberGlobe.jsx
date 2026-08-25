import React, { useState, useEffect, useRef } from 'react';
import GlobeMap from 'react-globe.gl';

const CyberGlobe = ({ hops = null, interactive = false, width = null }) => {
  const [windowWidth, setWindowWidth] = useState(width || 800);
  const globeRef = useRef();

  useEffect(() => {
    if (width) return;
    const handleResize = () => {
      setWindowWidth(window.innerWidth > 1024 ? window.innerWidth / 2.5 : window.innerWidth - 40);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  let displayArcs = [];
  let displayLabels = [];

  if (hops && hops.length > 0) {
    const geoHops = hops.filter(h => h.geolocation && (h.geolocation.lat != null || h.geolocation.latitude != null) && (h.geolocation.long != null || h.geolocation.longitude != null));
    const getLat = (h) => h.geolocation?.lat ?? h.geolocation?.latitude;
    const getLong = (h) => h.geolocation?.long ?? h.geolocation?.longitude;

    for(let i=0; i < geoHops.length - 1; i++) {
        displayArcs.push({
            startLat: getLat(geoHops[i]),
            startLng: getLong(geoHops[i]),
            endLat: getLat(geoHops[i+1]),
            endLng: getLong(geoHops[i+1]),
            color: ['#ef4444', '#0ea5e9']
        });
    }

    geoHops.forEach((h, i) => {
        displayLabels.push({
            lat: getLat(h),
            lng: getLong(h),
            text: h.geolocation?.city || h.ip,
            color: i === 0 ? '#ef4444' : '#0ea5e9', // Origin red, relays blue
            size: 1.2
        });
    });

    useEffect(() => {
        if (globeRef.current && displayLabels.length > 0) {
            setTimeout(() => {
                const origin = displayLabels[0];
                globeRef.current.pointOfView({ lat: origin.lat, lng: origin.lng, altitude: 2 }, 1500);
            }, 500);
        }
    }, [hops]);
  } else {
    // Default demo arcs for landing page
    displayArcs = [
      { startLat: 39.9042, startLng: 116.4074, endLat: 38.9072, endLng: -77.0369, color: ['#ef4444', '#ef4444'] },
      { startLat: 55.7558, startLng: 37.6173, endLat: 38.9072, endLng: -77.0369, color: ['#ef4444', '#ef4444'] },
      { startLat: 48.8566, startLng: 2.3522, endLat: 40.7128, endLng: -74.0060, color: ['#0ea5e9', '#0ea5e9'] },
    ];
  }

  return (
    <div className={`flex justify-center items-center h-full w-full ${interactive ? '' : 'pointer-events-none'}`}>
      <GlobeMap
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        arcsData={displayArcs}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        labelsData={displayLabels}
        labelLat={d => d.lat}
        labelLng={d => d.lng}
        labelText={d => d.text}
        labelSize={d => d.size}
        labelDotRadius={d => d.size * 0.5}
        labelColor={d => d.color}
        labelResolution={2}
        width={windowWidth}
        height={width ? width * 0.75 : 500}
        backgroundColor="rgba(0,0,0,0)"
        enablePointerInteraction={interactive}
      />
    </div>
  );
};

export default CyberGlobe;
