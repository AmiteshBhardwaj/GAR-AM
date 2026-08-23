import React, { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Procedural fallback table (Dark industrial weathered oak / steel frame)
function ProceduralTable() {
  const woodDarkColor = '#141210';
  const woodTopColor = '#1e1915';
  const metalTrimColor = '#24211e';

  return (
    <group name="ProceduralTableFallback" rotation={[0, Math.PI / 2, 0]}>
      {/* Table Top Surface */}
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.06, 0.82]} />
        <meshStandardMaterial
          color={woodTopColor}
          roughness={0.9}
          metalness={0.12}
        />
      </mesh>

      {/* Tabletop Side Trim (Beveled dark edge) */}
      <mesh position={[0, 0.73, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.44, 0.04, 0.76]} />
        <meshStandardMaterial
          color={metalTrimColor}
          roughness={0.85}
          metalness={0.2}
        />
      </mesh>

      {/* Table Apron/Frame */}
      <mesh position={[0, 0.68, 0.35]} castShadow receiveShadow>
        <boxGeometry args={[1.36, 0.06, 0.04]} />
        <meshStandardMaterial color={woodDarkColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.68, -0.35]} castShadow receiveShadow>
        <boxGeometry args={[1.36, 0.06, 0.04]} />
        <meshStandardMaterial color={woodDarkColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.66, 0.68, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 0.06, 0.7]} />
        <meshStandardMaterial color={woodDarkColor} roughness={0.9} />
      </mesh>
      <mesh position={[-0.66, 0.68, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 0.06, 0.7]} />
        <meshStandardMaterial color={woodDarkColor} roughness={0.9} />
      </mesh>

      {/* 4 Heavy Table Legs */}
      <mesh position={[-0.64, 0.37, 0.35]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.74, 0.08]} />
        <meshStandardMaterial color={woodDarkColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.64, 0.37, 0.35]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.74, 0.08]} />
        <meshStandardMaterial color={woodDarkColor} roughness={0.9} />
      </mesh>
      <mesh position={[-0.64, 0.37, -0.35]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.74, 0.08]} />
        <meshStandardMaterial color={woodDarkColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.64, 0.37, -0.35]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.74, 0.08]} />
        <meshStandardMaterial color={woodDarkColor} roughness={0.9} />
      </mesh>

      {/* Table without cluttering chairs */}
    </group>
  );
}

// 3D GLB Table Model Loader Component
function GlbTableSetModel({
  position = [0, 0, 0],
  rotation = [0, Math.PI / 2, 0],
  scale = 1
}) {
  const { scene } = useGLTF('/models/table_set.glb');

  const { clonedScene, offset, scaleMultiplier } = useMemo(() => {
    if (!scene) {
      return { clonedScene: null, offset: [0, 0, 0], scaleMultiplier: 1 };
    }
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.DoubleSide;
        }
      }
    });

    // Compute bounding box for automatic alignment
    const bbox = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);

    // Auto-normalize scale if exported in millimeters or centimeters
    let multiplier = 1;
    if (size.y > 100) {
      multiplier = 0.001; // mm to m
    } else if (size.y > 10) {
      multiplier = 0.01; // cm to m
    }

    // Ground the model at y = 0 and center on X/Z axes
    const computedOffset = [
      -center.x * multiplier,
      -bbox.min.y * multiplier,
      -center.z * multiplier
    ];

    return {
      clonedScene: clone,
      offset: computedOffset,
      scaleMultiplier: multiplier
    };
  }, [scene]);

  if (!clonedScene) return null;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive
        object={clonedScene}
        position={offset}
        scale={scaleMultiplier}
      />
    </group>
  );
}

// Safe Error Boundary for Table Model
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn('GLB Table & Chair Model failed to load, falling back to procedural set:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function WoodenTable({
  position = [0, 0, 0],
  rotation = [0, Math.PI / 2, 0],
  scale = 1
}) {
  return (
    <group name="WoodenTableSet">
      <ModelErrorBoundary fallback={<ProceduralTable />}>
        <Suspense fallback={<ProceduralTable />}>
          <GlbTableSetModel
            position={position}
            rotation={rotation}
            scale={scale}
          />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
}

// Preload the GLB model in the background
useGLTF.preload('/models/table_set.glb');
