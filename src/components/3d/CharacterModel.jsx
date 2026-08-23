import React, { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

export const CHARACTER_PRESETS = {
  spartan: {
    id: 'spartan',
    name: 'SPARTAN MK V',
    file: '/models/spartan_armour_mkv_-_halo_reach.glb',
    scale: 0.40,
    position: [0, -0.02, -0.64],
    rotation: [0, 0, 0],
    subTitle: 'HALO REACH'
  },
  zombie: {
    id: 'zombie',
    name: 'ZOMBIE',
    file: '/models/zombie.glb',
    scale: 0.19,
    position: [0, -0.02, -0.84],
    rotation: [0, 0, 0],
    subTitle: 'MUTATED UNDEAD'
  },
  sitting_bot: {
    id: 'sitting_bot',
    name: 'SEATED BOT',
    file: '/models/spartan_armour_mkv_-_halo_reach.glb',
    scale: 0.40,
    position: [0, -0.02, -0.84],
    rotation: [0, 0, 0],
    subTitle: 'ARTICULATED RIG'
  }
};

export default function CharacterModel({
  character = 'spartan',
  position,
  rotation,
  scale,
  isShooting = false,
  botHit = false
}) {
  const group = useRef();
  const config = CHARACTER_PRESETS[character] || CHARACTER_PRESETS.spartan;
  const modelPath = config.file;

  const { scene } = useGLTF(modelPath);

  // Clone scene with SkeletonUtils so SkinnedMesh and bones are cloned with active bone bindings
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    try {
      const clone = SkeletonUtils.clone(scene);

      clone.traverse((child) => {
        // Hide foreign ground plane meshes
        if (child.isMesh) {
          if (child.name && child.name.toLowerCase().includes('floor')) {
            child.visible = false;
          } else {
            child.visible = true;
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.side = THREE.DoubleSide;
            }
          }
        }
      });

      return clone;
    } catch (e) {
      console.error('[CharacterModel] Error in SkeletonUtils.clone:', e);
      return scene.clone(true);
    }
  }, [scene, modelPath]);

  // Index humanoid bones including wrists and individual fingers
  const bones = useMemo(() => {
    if (!clonedScene) return {};
    const found = { fingers: [] };

    clonedScene.traverse((child) => {
      if (child.name) {
        const lower = child.name.toLowerCase();
        if (lower.includes('leftupleg') || lower.includes('left_upleg') || lower.includes('leftup_leg')) {
          found.leftUpLeg = child;
        } else if (lower.includes('rightupleg') || lower.includes('right_upleg') || lower.includes('rightup_leg')) {
          found.rightUpLeg = child;
        } else if ((lower.includes('leftleg') || lower.includes('left_leg')) && !lower.includes('upleg')) {
          found.leftLeg = child;
        } else if ((lower.includes('rightleg') || lower.includes('right_leg')) && !lower.includes('upleg')) {
          found.rightLeg = child;
        } else if (lower.includes('leftfoot') || lower.includes('left_foot')) {
          found.leftFoot = child;
        } else if (lower.includes('rightfoot') || lower.includes('right_foot')) {
          found.rightFoot = child;
        } else if ((lower.includes('leftarm') || lower.includes('left_arm')) && !lower.includes('fore')) {
          found.leftArm = child;
        } else if ((lower.includes('rightarm') || lower.includes('right_arm')) && !lower.includes('fore')) {
          found.rightArm = child;
        } else if (lower.includes('leftforearm') || lower.includes('left_forearm') || lower.includes('leftfore_arm')) {
          found.leftForeArm = child;
        } else if (lower.includes('rightforearm') || lower.includes('right_forearm') || lower.includes('rightfore_arm')) {
          found.rightForeArm = child;
        } else if (lower.includes('lefthand') && !lower.includes('thumb') && !lower.includes('index') && !lower.includes('middle') && !lower.includes('ring') && !lower.includes('pinky')) {
          found.leftHand = child;
        } else if (lower.includes('righthand') && !lower.includes('thumb') && !lower.includes('index') && !lower.includes('middle') && !lower.includes('ring') && !lower.includes('pinky')) {
          found.rightHand = child;
        } else if (lower.includes('thumb') || lower.includes('index') || lower.includes('middle') || lower.includes('ring') || lower.includes('pinky')) {
          found.fingers.push(child);
        } else if (lower.includes('head') && !lower.includes('top')) {
          found.head = child;
        } else if (lower.includes('neck')) {
          found.neck = child;
        } else if (lower.includes('spine')) {
          found.spine = child;
        }
      }
    });

    return found;
  }, [clonedScene]);

  // Seated posture & kinematic animation loop executed every frame
  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    const breath = Math.sin(t * 1.8) * 0.005;
    const microSway = Math.cos(t * 1.2) * 0.003;

    const basePos = position || config.position;
    const baseRot = rotation || config.rotation;

    const ptrX = pointer ? pointer.x : 0;
    const ptrY = pointer ? pointer.y : 0;

    // --- ARTICULATE SKELETON INTO NATURAL SEATED POSTURE ---
    // 1. Thighs / Upper Legs (Bend ~85° forward onto chair)
    if (bones.leftUpLeg) {
      bones.leftUpLeg.rotation.x = -1.48;
      bones.leftUpLeg.rotation.y = 0.05;
      bones.leftUpLeg.rotation.z = -0.06;
    }
    if (bones.rightUpLeg) {
      bones.rightUpLeg.rotation.x = -1.48;
      bones.rightUpLeg.rotation.y = -0.05;
      bones.rightUpLeg.rotation.z = 0.06;
    }

    // 2. Shins / Knees (Bend ~90° down towards floor)
    if (bones.leftLeg) {
      bones.leftLeg.rotation.x = 1.54;
      bones.leftLeg.rotation.y = 0;
      bones.leftLeg.rotation.z = 0;
    }
    if (bones.rightLeg) {
      bones.rightLeg.rotation.x = 1.54;
      bones.rightLeg.rotation.y = 0;
      bones.rightLeg.rotation.z = 0;
    }

    // 3. Feet resting flat on floor
    if (bones.leftFoot) {
      bones.leftFoot.rotation.x = -0.1;
    }
    if (bones.rightFoot) {
      bones.rightFoot.rotation.x = -0.1;
    }

    // 4. Arms & Forearms (Bending elbows forward & down directly onto the wooden table surface)
    if (bones.leftArm) {
      bones.leftArm.rotation.x = -0.35;
      bones.leftArm.rotation.y = -0.12;
      bones.leftArm.rotation.z = 1.32;
    }
    if (bones.leftForeArm) {
      bones.leftForeArm.rotation.x = 0.85;
      bones.leftForeArm.rotation.y = -0.30;
      bones.leftForeArm.rotation.z = -0.20;
    }

    if (bones.rightArm) {
      if (isShooting) {
        bones.rightArm.rotation.x = -Math.PI / 2.1;
        bones.rightArm.rotation.y = 0.1;
        bones.rightArm.rotation.z = 0.1;
      } else {
        bones.rightArm.rotation.x = -0.35;
        bones.rightArm.rotation.y = 0.12;
        bones.rightArm.rotation.z = -1.32;
      }
    }
    if (bones.rightForeArm) {
      if (isShooting) {
        bones.rightForeArm.rotation.x = 0;
        bones.rightForeArm.rotation.y = 0;
      } else {
        bones.rightForeArm.rotation.x = 0.85;
        bones.rightForeArm.rotation.y = 0.30;
        bones.rightForeArm.rotation.z = 0.20;
      }
    }

    // 5. Wrists & Hands (Planted flat down on the tabletop surface)
    if (bones.leftHand) {
      bones.leftHand.rotation.x = -0.30;
      bones.leftHand.rotation.y = 0.05;
      bones.leftHand.rotation.z = -0.20;
    }
    if (bones.rightHand) {
      if (!isShooting) {
        bones.rightHand.rotation.x = -0.30;
        bones.rightHand.rotation.y = -0.05;
        bones.rightHand.rotation.z = 0.20;
      }
    }

    // 6. Fingers (Naturally relaxed curves resting on the wood)
    if (bones.fingers && bones.fingers.length > 0) {
      bones.fingers.forEach((finger) => {
        finger.rotation.x = 0.30;
      });
    }

    // 7. Head tracking & breathing
    if (bones.head) {
      bones.head.rotation.y = -ptrX * 0.25;
      bones.head.rotation.x = ptrY * 0.15;
    }
    if (bones.neck) {
      bones.neck.rotation.y = -ptrX * 0.1;
    }
    if (bones.spine) {
      bones.spine.rotation.x = 0.05 + breath;
    }

    // Overall root body reactions
    if (botHit) {
      group.current.position.y = basePos[1] + (Math.random() - 0.5) * 0.06;
      group.current.position.z = basePos[2] - 0.12;
      group.current.rotation.z = (Math.random() - 0.5) * 0.12;
    } else {
      group.current.position.y = basePos[1] + breath;
      group.current.position.z = basePos[2];
      group.current.rotation.y = baseRot[1];
      group.current.rotation.x = baseRot[0];
      group.current.rotation.z = baseRot[2] + microSway;
    }
  });

  const finalPos = position || config.position;
  const finalRot = rotation || config.rotation;
  const finalScale = scale || config.scale;

  if (!clonedScene) return null;

  return (
    <group
      ref={group}
      position={finalPos}
      rotation={finalRot}
      scale={finalScale}
      dispose={null}
      name={`Character-${character}`}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload GLB models
useGLTF.preload('/models/spartan_armour_mkv_-_halo_reach.glb');
useGLTF.preload('/models/zombie.glb');
