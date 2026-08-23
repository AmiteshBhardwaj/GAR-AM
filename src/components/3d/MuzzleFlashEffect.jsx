import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function MuzzleFlashEffect({ isFiring = false, shootTarget = 'bot' }) {
  const flashLightRef = useRef();

  useFrame(({ clock }) => {
    if (!flashLightRef.current) return;
    if (isFiring) {
      flashLightRef.current.intensity = Math.random() * 25.0 + 15.0;
    } else {
      flashLightRef.current.intensity = 0;
    }
  });

  if (!isFiring) return null;

  // Flash position depends on whether player shot or bot shot
  const flashPos = shootTarget === 'self' ? [0, 1.35, 0.9] : [0.18, 1.32, 0.5];

  return (
    <group position={flashPos}>
      {/* Intense explosive burst light */}
      <pointLight
        ref={flashLightRef}
        color="#ffedd5"
        intensity={30}
        distance={6.0}
        decay={1.5}
      />
      {/* Visual Flash Flare */}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
