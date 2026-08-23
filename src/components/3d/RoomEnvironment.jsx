import React, { useMemo, useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Volumetric dust particles drifting in the light cone
function DustMotes({ count = 120 }) {
  const pointsRef = useRef();

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Confine dust particles mostly around the table light cone
      pos[i * 3 + 0] = (Math.random() - 0.5) * 4.0;
      pos[i * 3 + 1] = Math.random() * 3.5 + 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4.0;

      spd[i * 3 + 0] = (Math.random() - 0.5) * 0.002;
      spd[i * 3 + 1] = Math.random() * 0.0015 + 0.0005;
      spd[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    return [pos, spd];
  }, [count]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3 + 0] += speeds[i * 3 + 0];
      posAttr.array[i * 3 + 1] += speeds[i * 3 + 1];
      posAttr.array[i * 3 + 2] += speeds[i * 3 + 2];

      // Wrap around bounds
      if (posAttr.array[i * 3 + 1] > 3.8) {
        posAttr.array[i * 3 + 1] = 0.3;
      }
      if (Math.abs(posAttr.array[i * 3 + 0]) > 2.2) {
        posAttr.array[i * 3 + 0] *= -0.9;
      }
      if (Math.abs(posAttr.array[i * 3 + 2]) > 2.2) {
        posAttr.array[i * 3 + 2] *= -0.9;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#fbbf24"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Procedural fallback environment if GLB model is not loaded or errors
function ProceduralRoom() {
  return (
    <group name="ProceduralRoomFallback">
      {/* Floor - weathered wood floorboards */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial
          color="#1c140e"
          roughness={0.88}
          metalness={0.1}
        />
      </mesh>

      {/* Back Wall (behind Dealer) */}
      <mesh position={[0, 3, -4.5]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial
          color="#0f0e0c"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-4.5, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial
          color="#12110e"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Right Wall */}
      <mesh position={[4.5, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial
          color="#12110e"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 5.5, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial
          color="#0a0a08"
          roughness={0.98}
        />
      </mesh>

      {/* Wall trim / baseboard */}
      <mesh position={[0, 0.08, -4.48]}>
        <boxGeometry args={[16, 0.16, 0.04]} />
        <meshStandardMaterial color="#0a0806" roughness={0.9} />
      </mesh>

      {/* Background props: Distant industrial pipes & wires */}
      <group position={[0, 4.2, -4.3]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 14, 12]} />
          <meshStandardMaterial color="#27272a" metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 14, 12]} />
          <meshStandardMaterial color="#18181b" metalness={0.7} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// 3D GLB Room Model Component
function GlbRoomModel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1
}) {
  const { scene } = useGLTF('/models/room.glb');

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone(true);
    const nodesToRemove = [];
    clone.traverse((child) => {
      const nodeName = child.name ? child.name.toLowerCase() : '';
      if (
        nodeName.includes('chair') ||
        nodeName.includes('rope') ||
        nodeName.startsWith('wood')
      ) {
        child.visible = false;
        nodesToRemove.push(child);
      } else if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Ensure double-sided materials for enclosed walls/ceilings if needed
        if (child.material) {
          child.material.side = THREE.DoubleSide;
        }
      }
    });

    nodesToRemove.forEach((node) => {
      if (node.parent) {
        node.parent.remove(node);
      }
    });

    return clone;
  }, [scene]);

  if (!clonedScene) return null;

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

// Safe Error Boundary for 3D Assets
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn('GLB Room Model failed to load, falling back to procedural room:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function RoomEnvironment({
  modelPosition = [0, 0, 0],
  modelRotation = [0, 0, 0],
  modelScale = 1
}) {
  return (
    <group name="RoomEnvironment">
      {/* Ambient moody fill light */}
      <ambientLight intensity={0.75} color="#52525b" />
      
      {/* Soft warm frontal fill light */}
      <directionalLight
        position={[0, 4, 3.5]}
        intensity={0.95}
        color="#fed7aa"
      />
      
      {/* Cool rim and back-wall light */}
      <directionalLight
        position={[3, 5, -3]}
        intensity={0.7}
        color="#93c5fd"
      />

      {/* 3D GLB Background Room with Suspense & Error Boundary fallback */}
      <ModelErrorBoundary fallback={<ProceduralRoom />}>
        <Suspense fallback={<ProceduralRoom />}>
          <GlbRoomModel
            position={modelPosition}
            rotation={modelRotation}
            scale={modelScale}
          />
        </Suspense>
      </ModelErrorBoundary>

      {/* Floating volumetric dust */}
      <DustMotes count={140} />
    </group>
  );
}

// Preload the GLB model in the background
useGLTF.preload('/models/room.glb');
