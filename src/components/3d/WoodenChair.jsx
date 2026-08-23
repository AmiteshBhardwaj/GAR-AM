import React from 'react';

export default function WoodenChair({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const woodColor = '#24160d';
  const seatColor = '#301d12';

  return (
    <group position={position} rotation={rotation} name="WoodenChair">
      {/* Seat Cushion/Board */}
      <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.05, 0.55]} />
        <meshStandardMaterial color={seatColor} roughness={0.8} />
      </mesh>

      {/* 4 Legs */}
      <mesh position={[-0.23, 0.25, 0.23]} castShadow>
        <cylinderGeometry args={[0.025, 0.02, 0.5, 8]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>
      <mesh position={[0.23, 0.25, 0.23]} castShadow>
        <cylinderGeometry args={[0.025, 0.02, 0.5, 8]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>
      <mesh position={[-0.23, 0.25, -0.23]} castShadow>
        <cylinderGeometry args={[0.025, 0.02, 0.5, 8]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>
      <mesh position={[0.23, 0.25, -0.23]} castShadow>
        <cylinderGeometry args={[0.025, 0.02, 0.5, 8]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>

      {/* Backrest Uprights (Left & Right posts) */}
      <mesh position={[-0.23, 0.85, -0.24]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.65, 8]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>
      <mesh position={[0.23, 0.85, -0.24]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.65, 8]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>

      {/* Top Backrest Rail */}
      <mesh position={[0, 1.15, -0.24]} castShadow>
        <boxGeometry args={[0.52, 0.08, 0.03]} />
        <meshStandardMaterial color={woodColor} roughness={0.8} />
      </mesh>

      {/* Backrest Slats */}
      <mesh position={[-0.1, 0.85, -0.24]} castShadow>
        <boxGeometry args={[0.03, 0.45, 0.02]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.85, -0.24]} castShadow>
        <boxGeometry args={[0.03, 0.45, 0.02]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>
      <mesh position={[0.1, 0.85, -0.24]} castShadow>
        <boxGeometry args={[0.03, 0.45, 0.02]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>
    </group>
  );
}
