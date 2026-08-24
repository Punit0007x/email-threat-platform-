import React, { useState, useEffect } from 'react';
import GlobeMap from 'react-globe.gl';

const CyberGlobe = () => {
  const [windowWidth, setWindowWidth] = useState(800);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth > 1024 ? window.innerWidth / 2.5 : window.innerWidth - 40);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const arcsData = [
    { startLat: 39.9042, startLng: 116.4074, endLat: 38.9072, endLng: -77.0369, color: ['#ef4444', '#ef4444'] },
    { startLat: 55.7558, startLng: 37.6173, endLat: 38.9072, endLng: -77.0369, color: ['#ef4444', '#ef4444'] },
    { startLat: 48.8566, startLng: 2.3522, endLat: 40.7128, endLng: -74.0060, color: ['#0ea5e9', '#0ea5e9'] },
  ];

  return (
    <div className="flex justify-center items-center h-full w-full pointer-events-none">
      <GlobeMap
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        width={windowWidth}
        height={500}
        backgroundColor="rgba(0,0,0,0)"
        enablePointerInteraction={false}
      />
    </div>
  );
};

export default CyberGlobe;
