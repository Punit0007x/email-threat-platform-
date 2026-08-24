import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const AttackArc = ({ start, end, color }) => {
  const curve = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    
    const midPoint = startVec.clone().lerp(endVec, 0.5);
    const distance = startVec.distanceTo(endVec);
    midPoint.normalize().multiplyScalar(2.2 + distance * 0.3);

    return new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec);
  }, [start, end]);

  const tubeRef = useRef();

  useFrame(({ clock }) => {
    if (tubeRef.current) {
       // Example pulse logic
       tubeRef.current.material.opacity = 0.5 + Math.sin(clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <mesh ref={tubeRef}>
      <tubeGeometry args={[curve, 64, 0.015, 8, false]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={2} 
        transparent 
        opacity={0.8} 
      />
    </mesh>
  );
};

const GlobeCore = () => {
  const globeRef = useRef();

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={globeRef}>
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial 
          color="#1e293b" 
          roughness={0.7}
          metalness={0.2}
        />
      </Sphere>

      <AttackArc start={[2, 0, 0]} end={[-1, 1.732, 0]} color="#10b981" />
      <AttackArc start={[0, 2, 0]} end={[1.414, -1.414, 0]} color="#f59e0b" />
      <AttackArc start={[-2, 0, 0]} end={[0, -2, 0]} color="#10b981" />
    </group>
  );
};

export default function CyberGlobeCanvas() {
  return (
    <div className="w-full h-full min-h-[400px] lg:min-h-[600px] rounded-2xl overflow-hidden bg-transparent relative">
      <div className="absolute inset-0 pointer-events-none z-10" />
      
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#e2e8f0" />
        
        <GlobeCore />
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          autoRotate={false}
          maxDistance={8}
          minDistance={3}
        />
      </Canvas>
    </div>
  );
}
