import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function HangingLamp({ isShaking = false }) {
  const lampGroup = useRef();
  const spotlightRef = useRef();

  useFrame(({ clock }) => {
    if (!lampGroup.current) return;
    const t = clock.getElapsedTime();

    // Natural ambient pendulum oscillation
    const baseSwingX = Math.sin(t * 1.2) * 0.035;
    const baseSwingZ = Math.cos(t * 0.9) * 0.025;

    if (isShaking) {
      // Violent recoil reaction on gunshot
      const shakeDecay = Math.sin(t * 14) * 0.15;
      lampGroup.current.rotation.x = baseSwingX + shakeDecay;
      lampGroup.current.rotation.z = baseSwingZ + Math.cos(t * 16) * 0.12;
    } else {
      lampGroup.current.rotation.x = THREE.MathUtils.lerp(lampGroup.current.rotation.x, baseSwingX, 0.05);
      lampGroup.current.rotation.z = THREE.MathUtils.lerp(lampGroup.current.rotation.z, baseSwingZ, 0.05);
    }
  });

  return (
    <group position={[0, 4.8, 0]}>
      {/* Ceiling Mount */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
        <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Hanging Cord & Fixture (Pivot is at the ceiling mount) */}
      <group ref={lampGroup}>
        {/* Cord */}
        <mesh position={[0, -1.0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 2.0, 8]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>

        {/* Metal Shade Hood */}
        <mesh position={[0, -2.0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.38, 0.28, 24, 1, true]} />
          <meshStandardMaterial
            color="#27272a"
            metalness={0.7}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Lamp Hood Top Cap */}
        <mesh position={[0, -1.86, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.09, 0.06, 16]} />
          <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Exposed Bulb */}
        <mesh position={[0, -2.05, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="#fffbeb"
            emissive="#f59e0b"
            emissiveIntensity={4.5}
            roughness={0.1}
          />
        </mesh>

        {/* Main Downward Spotlight onto Table */}
        <spotLight
          ref={spotlightRef}
          position={[0, -2.06, 0]}
          target-position={[0, 0, 0]}
          color="#fef3c7"
          intensity={22.0}
          distance={12.0}
          angle={Math.PI / 2.75}
          penumbra={0.7}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />

        {/* Local Point Light for bulb warmth & glow */}
        <pointLight
          position={[0, -2.05, 0]}
          color="#f59e0b"
          intensity={5.5}
          distance={6.0}
          decay={1.8}
        />
      </group>
    </group>
  );
}
