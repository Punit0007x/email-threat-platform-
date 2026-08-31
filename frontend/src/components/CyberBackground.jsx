import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const PRESET_NODES = Array.from({ length: 30 }).map((_, i) => ({
  id: i,
  size: ((i * 13) % 20) / 10 + 1,
  initX: ((i * 37) % 100) / 100,
  initY: ((i * 53) % 100) / 100,
  initOpacity: ((i * 19) % 30) / 100 + 0.1,
  targetY: ((i * 71) % 100) / 100,
  midOpacity: ((i * 29) % 60) / 100 + 0.2,
  endOpacity: ((i * 41) % 30) / 100 + 0.1,
  duration: ((i * 17) % 20) + 10,
}));

export default function CyberBackground({ theme = 'dark' }) {
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nodes = PRESET_NODES;

  if (!isClient) return null;

  const isLight = theme === 'light';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base Cyber Grid */}
      <div 
        className={`absolute inset-0 ${isLight ? 'opacity-10' : 'opacity-[0.03]'}`}
        style={{ 
          backgroundImage: `linear-gradient(${isLight ? 'rgba(8,145,178,0.3)' : 'rgba(0, 255, 255, 1)'} 1px, transparent 1px), linear-gradient(90deg, ${isLight ? 'rgba(8,145,178,0.3)' : 'rgba(0, 255, 255, 1)'} 1px, transparent 1px)`, 
          backgroundSize: '50px 50px'
        }} 
      />
      
      {/* Animated Glowing Orbs */}
      <motion.div 
        animate={{ 
          x: [0, 50, -50, 0],
          y: [0, -50, 50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] blur-[120px] rounded-full ${isLight ? 'bg-cyan-200/60 mix-blend-multiply' : 'bg-cyan-900/20 mix-blend-screen'}`}
      />
      <motion.div 
        animate={{ 
          x: [0, -50, 50, 0],
          y: [0, 50, -50, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className={`absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] blur-[150px] rounded-full ${isLight ? 'bg-indigo-200/60 mix-blend-multiply' : 'bg-indigo-900/20 mix-blend-screen'}`}
      />
      
      {/* Animated Vertical Scan Line */}
      <motion.div 
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className={`absolute left-0 right-0 h-[1px] blur-[1px] ${isLight ? 'bg-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.5)]'}`}
      />

      {/* Floating Data Nodes */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          initial={{ 
            x: node.initX * dimensions.width, 
            y: node.initY * dimensions.height,
            opacity: node.initOpacity
          }}
          animate={{
            y: [null, node.targetY * dimensions.height],
            opacity: [null, node.midOpacity, node.endOpacity]
          }}
          transition={{ 
            duration: node.duration, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className={`absolute rounded-full blur-[1px] ${isLight ? 'bg-cyan-600' : 'bg-cyan-400'}`}
          style={{ width: node.size, height: node.size }}
        />
      ))}
    </div>
  );
}
