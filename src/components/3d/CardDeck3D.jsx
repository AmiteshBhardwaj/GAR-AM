import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function CardDeck3D({
  deckCount = 6,
  isDealing = false
}) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    if (isDealing) {
      groupRef.current.position.y = 0.785 + Math.sin(t * 15) * 0.005;
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.785, 0.1);
    }
  });

  return (
    <group ref={groupRef} position={[-0.42, 0.785, 0.0]} rotation={[0, 0.15, 0]} name="CardDeck3D">
      {/* Stack of thick cards */}
      {Array.from({ length: Math.min(deckCount, 8) }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.sin(i * 1.5) * 0.003),
            i * 0.0035,
            (Math.cos(i * 1.5) * 0.003)
          ]}
          rotation={[-Math.PI / 2, 0, (i * 0.02)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.22, 0.30, 0.003]} />
          <meshStandardMaterial
            color="#0c0a09"
            roughness={0.65}
            metalness={0.2}
          />
        </mesh>
      ))}

      {/* Gold Seal on Top Deck Card */}
      <mesh
        position={[0, Math.min(deckCount, 8) * 0.0035 + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.02, 0.04, 24]} />
        <meshStandardMaterial
          color="#d97706"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}
