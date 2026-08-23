import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { soundEngine } from '../audio/SoundEngine';

export default function Revolver3D({
  gameState = 'answering',
  turn = 'player',
  shootTarget = null,
  isSpinning = false,
  isFiring = false,
  gunOwner = 'player',
  isVisible = true
}) {
  const groupRef = useRef();
  const cylinderRef = useRef();
  const hammerRef = useRef();
  const lastStateRef = useRef(gameState);

  // Play heavy gun slide sound on morph/handover
  useEffect(() => {
    if (gameState === 'card_morphing_gun' || (gameState === 'shooting_choice' && lastStateRef.current !== 'shooting_choice')) {
      soundEngine.playGunSlide();
    }
    lastStateRef.current = gameState;
  }, [gameState]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Visibility & scale lerp
    const targetScaleVal = isVisible ? 1.2 : 0.001;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScaleVal, targetScaleVal, targetScaleVal), 0.15);

    // 1. Spinning cylinder animation
    if (cylinderRef.current) {
      if (isSpinning) {
        cylinderRef.current.rotation.z += 0.45;
      }
    }

    // 2. Hammer state (cocked when aiming)
    if (hammerRef.current) {
      const isAiming = gameState === 'shooting_choice' || gameState === 'firing';
      const targetHammerAngle = isAiming ? 0.45 : 0.0;
      hammerRef.current.rotation.x = THREE.MathUtils.lerp(hammerRef.current.rotation.x, targetHammerAngle, 0.15);
    }

    // 3. State-driven positioning & aiming
    let targetPos = new THREE.Vector3(0, 0.795, 0); // Resting on center of table
    let targetRot = new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2); // Flat on wood

    if (gameState === 'card_morphing_gun') {
      // Morphing in center of table with fiery glow
      targetPos = new THREE.Vector3(0, 0.85, 0.10);
      targetRot = new THREE.Euler(-0.2, 0, 0);
    } else if (gunOwner === 'player' || (turn === 'player' && gameState === 'shooting_choice')) {
      if (gameState === 'shooting_choice') {
        if (shootTarget === 'self') {
          // Pointing directly back at seated player's camera
          targetPos = new THREE.Vector3(0, 1.12, 0.85);
          targetRot = new THREE.Euler(-0.35, Math.PI, 0);
        } else {
          // Lifted up, aiming straight across the table at the Dealer
          targetPos = new THREE.Vector3(0.08, 1.10, 0.55);
          targetRot = new THREE.Euler(0.04, 0, 0);
        }
      } else {
        // Resting in front of seated player
        targetPos = new THREE.Vector3(0.0, 0.795, 0.22);
        targetRot = new THREE.Euler(-Math.PI / 2, 0, 0.25);
      }
    } else if (gunOwner === 'bot' || turn === 'bot') {
      if (gameState === 'bot_turn' || gameState === 'firing' || gameState === 'bot_shooting') {
        // Dealer picked up the gun and is aiming straight across the table at the player
        targetPos = new THREE.Vector3(0.08, 1.10, -0.55);
        targetRot = new THREE.Euler(0.04, 0, 0);
      } else {
        // Resting on table towards seated dealer side
        targetPos = new THREE.Vector3(0.0, 0.795, -0.22);
        targetRot = new THREE.Euler(-Math.PI / 2, 0, -0.45);
      }
    }

    // Smooth lerp towards target position and rotation
    groupRef.current.position.lerp(targetPos, 0.12);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRot.x, 0.12);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot.y, 0.12);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRot.z, 0.12);

    // Recoil kick if currently firing
    if (isFiring) {
      groupRef.current.position.y += Math.sin(t * 40) * 0.05;
      groupRef.current.position.z += 0.08;
      groupRef.current.rotation.x -= 0.25;
    }
  });

  const steelColor = '#3f3f46';
  const darkMetal = '#18181b';
  const gripWood = '#451a03';

  return (
    <group ref={groupRef} position={[0, 0.795, 0]} scale={[1.2, 1.2, 1.2]} name="Revolver3D">
      {/* Barrel */}
      <mesh position={[0, 0.06, -0.28]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 0.32, 16]} />
        <meshStandardMaterial color={steelColor} metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Barrel Under-lug */}
      <mesh position={[0, 0.035, -0.26]} castShadow>
        <boxGeometry args={[0.022, 0.03, 0.28]} />
        <meshStandardMaterial color={darkMetal} metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Front Sight */}
      <mesh position={[0, 0.09, -0.42]} castShadow>
        <boxGeometry args={[0.008, 0.02, 0.03]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Main Frame */}
      <mesh position={[0, 0.04, -0.06]} castShadow>
        <boxGeometry args={[0.05, 0.09, 0.14]} />
        <meshStandardMaterial color={steelColor} metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Revolver 6-Chamber Cylinder (Rotatable) */}
      <group ref={cylinderRef} position={[0, 0.04, -0.06]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.052, 0.052, 0.12, 18]} />
          <meshStandardMaterial color={darkMetal} metalness={0.92} roughness={0.2} />
        </mesh>
        {/* Fluting indents on cylinder */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i * Math.PI) / 3;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.045, Math.sin(angle) * 0.045, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.125, 8]} />
              <meshStandardMaterial color="#09090b" roughness={0.5} />
            </mesh>
          );
        })}
      </group>

      {/* Hammer (Cockable) */}
      <group ref={hammerRef} position={[0, 0.08, 0.02]}>
        <mesh position={[0, 0.03, 0.015]} castShadow>
          <boxGeometry args={[0.018, 0.05, 0.03]} />
          <meshStandardMaterial color={steelColor} metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Spur */}
        <mesh position={[0, 0.055, 0.035]} castShadow>
          <boxGeometry args={[0.018, 0.015, 0.02]} />
          <meshStandardMaterial color={steelColor} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Trigger & Guard */}
      <mesh position={[0, -0.02, -0.04]}>
        <torusGeometry args={[0.028, 0.006, 8, 16, Math.PI]} />
        <meshStandardMaterial color={steelColor} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.01, -0.04]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.008, 0.024, 0.01]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Wooden Handle Grip */}
      <mesh position={[0, -0.07, 0.07]} rotation={[0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.045, 0.14, 0.06]} />
        <meshStandardMaterial color={gripWood} roughness={0.7} />
      </mesh>
      {/* Grip Medallion */}
      <mesh position={[0.024, -0.07, 0.07]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.005, 12]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}
