import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CharacterModel from './CharacterModel';

// Safe Error Boundary for Character GLB Models
class CharacterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn('GLB Character failed to load, falling back to procedural Cyborg Dealer:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Procedural Cyberpunk Trenchcoat Cyborg Dealer (Reliable fallback & classic skin)
function ProceduralCyborgDealer({
  isThinking = false,
  isShooting = false,
  botHit = false
}) {
  const groupRef = useRef();
  const headRef = useRef();
  const eyesRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();

    // 1. Subtle breathing animation on torso
    if (groupRef.current) {
      const breath = Math.sin(t * 1.8) * 0.008;
      groupRef.current.position.y = breath;
    }

    // 2. Head tracking (subtly tracks player/mouse with damping)
    if (headRef.current) {
      const targetRotX = (pointer.y * 0.08) + Math.sin(t * 1.2) * 0.015;
      const targetRotY = (-pointer.x * 0.15) + Math.cos(t * 0.8) * 0.03;
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetRotX, 0.05);
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetRotY, 0.05);
    }

    // 3. Eye visor glow intensity & color
    if (eyesRef.current) {
      if (botHit) {
        eyesRef.current.material.emissiveIntensity = Math.random() * 5.0;
        eyesRef.current.material.emissive.set('#ffffff');
      } else if (isThinking || isShooting) {
        const pulse = 2.0 + Math.sin(t * 8.0) * 1.5;
        eyesRef.current.material.emissiveIntensity = pulse;
        eyesRef.current.material.emissive.set('#ef4444');
      } else {
        const pulse = 1.8 + Math.sin(t * 2.5) * 0.6;
        eyesRef.current.material.emissiveIntensity = pulse;
        eyesRef.current.material.emissive.set('#f59e0b');
      }
    }

    // 4. Arm poses (resting on table vs reaching/aiming)
    if (rightArmRef.current) {
      if (isShooting) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI / 2.2, 0.1);
        rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, 0.05, 0.1);
      } else {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.62, 0.08);
        rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, -0.15, 0.08);
      }
    }
  });

  const coatColor = '#111113';
  const pantsColor = '#141416';
  const shirtColor = '#1c1917';
  const metalColor = '#27272a';

  return (
    <group ref={groupRef} position={[0.0, 0, -1.06]} rotation={[0, 0, 0]} name="OpponentDealerProcedural">
      {/* Pelvis / Hips on Chair */}
      <mesh position={[0, 0.46, -0.02]} castShadow>
        <boxGeometry args={[0.42, 0.12, 0.36]} />
        <meshStandardMaterial color={pantsColor} roughness={0.9} />
      </mesh>

      {/* Thighs extending forward */}
      <mesh position={[-0.13, 0.44, 0.18]} castShadow>
        <boxGeometry args={[0.14, 0.12, 0.36]} />
        <meshStandardMaterial color={pantsColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.13, 0.44, 0.18]} castShadow>
        <boxGeometry args={[0.14, 0.12, 0.36]} />
        <meshStandardMaterial color={pantsColor} roughness={0.9} />
      </mesh>

      {/* Knees & Shins */}
      <mesh position={[-0.13, 0.22, 0.34]} castShadow>
        <boxGeometry args={[0.12, 0.36, 0.12]} />
        <meshStandardMaterial color={pantsColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.13, 0.22, 0.34]} castShadow>
        <boxGeometry args={[0.12, 0.36, 0.12]} />
        <meshStandardMaterial color={pantsColor} roughness={0.9} />
      </mesh>

      {/* Combat Boots */}
      <mesh position={[-0.13, 0.05, 0.38]} castShadow>
        <boxGeometry args={[0.13, 0.10, 0.22]} />
        <meshStandardMaterial color="#09090b" roughness={0.8} />
      </mesh>
      <mesh position={[0.13, 0.05, 0.38]} castShadow>
        <boxGeometry args={[0.13, 0.10, 0.22]} />
        <meshStandardMaterial color="#09090b" roughness={0.8} />
      </mesh>

      {/* Trench Coat Skirt */}
      <mesh position={[0, 0.40, -0.16]} castShadow>
        <boxGeometry args={[0.46, 0.45, 0.06]} />
        <meshStandardMaterial color={coatColor} roughness={0.9} />
      </mesh>
      <mesh position={[-0.22, 0.40, 0.02]} castShadow>
        <boxGeometry args={[0.06, 0.45, 0.40]} />
        <meshStandardMaterial color={coatColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.22, 0.40, 0.02]} castShadow>
        <boxGeometry args={[0.06, 0.45, 0.40]} />
        <meshStandardMaterial color={coatColor} roughness={0.9} />
      </mesh>

      {/* Torso & Trench Coat */}
      <mesh position={[0, 0.74, 0]} castShadow>
        <boxGeometry args={[0.48, 0.48, 0.28]} />
        <meshStandardMaterial color={coatColor} roughness={0.9} />
      </mesh>

      {/* Collar & Tie */}
      <mesh position={[0, 0.82, 0.15]} castShadow>
        <boxGeometry args={[0.20, 0.28, 0.02]} />
        <meshStandardMaterial color={shirtColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.76, 0.17]}>
        <boxGeometry args={[0.05, 0.22, 0.01]} />
        <meshStandardMaterial color="#991b1b" roughness={0.7} />
      </mesh>

      {/* Shoulders */}
      <mesh position={[-0.28, 0.94, 0]} castShadow>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color={coatColor} roughness={0.85} />
      </mesh>
      <mesh position={[0.28, 0.94, 0]} castShadow>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color={coatColor} roughness={0.85} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.28, 0.92, 0]} rotation={[-0.62, 0.15, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.048, 0.34, 10]} />
          <meshStandardMaterial color={coatColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.32, 0.15]} rotation={[0.62, 0, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.34, 10]} />
          <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.46, 0.28]} castShadow>
          <boxGeometry args={[0.08, 0.035, 0.11]} />
          <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.28, 0.92, 0]} rotation={[-0.62, -0.15, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.048, 0.34, 10]} />
          <meshStandardMaterial color={coatColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.32, 0.15]} rotation={[0.62, 0, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.34, 10]} />
          <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.46, 0.28]} castShadow>
          <boxGeometry args={[0.08, 0.035, 0.11]} />
          <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.065, 0.10, 12]} />
        <meshStandardMaterial color="#18181b" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Head Pivot */}
      <group ref={headRef} position={[0, 1.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.25, 0.24]} />
          <meshStandardMaterial color="#1f2421" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.12]} castShadow>
          <boxGeometry args={[0.20, 0.23, 0.035]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh ref={eyesRef} position={[0, 0.035, 0.14]}>
          <boxGeometry args={[0.15, 0.032, 0.02]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={2.0}
            toneMapped={false}
          />
        </mesh>
        <pointLight
          position={[0, 0.035, 0.2]}
          color="#f59e0b"
          intensity={0.9}
          distance={1.2}
        />
        <mesh position={[0, 0.14, 0.02]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.02, 24]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.23, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.16, 0.16, 20]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

export default function OpponentDealer({
  botName = 'WARDEN',
  selectedCharacter = 'spartan', // 'spartan' | 'zombie' | 'cyborg'
  isThinking = false,
  isShooting = false,
  botHit = false,
  botMessage = ''
}) {
  const proceduralFallback = (
    <ProceduralCyborgDealer
      isThinking={isThinking}
      isShooting={isShooting}
      botHit={botHit}
    />
  );

  if (selectedCharacter === 'cyborg') {
    return proceduralFallback;
  }

  return (
    <CharacterErrorBoundary fallback={proceduralFallback}>
      <Suspense fallback={proceduralFallback}>
        <CharacterModel
          character={selectedCharacter}
          isShooting={isShooting}
          botHit={botHit}
        />
      </Suspense>
    </CharacterErrorBoundary>
  );
}
