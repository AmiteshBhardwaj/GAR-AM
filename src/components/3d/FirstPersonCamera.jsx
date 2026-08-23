import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function FirstPersonCamera({ isShaking = false, isAnswering = false }) {
  const { camera } = useThree();
  const currentLookTarget = useRef(new THREE.Vector3(0, 1.06, -0.90));

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();

    // 1. Natural seated breathing sway
    const breathY = Math.sin(t * 1.5) * 0.005;
    const breathX = Math.cos(t * 0.75) * 0.004;

    // 2. Subtle mouse look parallax
    const mouseX = pointer.x * (isAnswering ? 0.05 : 0.10);
    const mouseY = pointer.y * (isAnswering ? 0.04 : 0.06);

    // 3. Recoil violent shake on gunshot
    let shakeX = 0;
    let shakeY = 0;
    if (isShaking) {
      shakeX = (Math.random() - 0.5) * 0.08;
      shakeY = (Math.random() - 0.5) * 0.08;
    }

    // Dynamic focus position: Natural centered seated posture facing the opponent
    const targetPosX = breathX + mouseX + shakeX;
    const targetPosY = isAnswering ? 1.20 + breathY + mouseY + shakeY : 1.22 + breathY + mouseY + shakeY;
    const targetPosZ = isAnswering ? 1.08 : 1.10;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetPosX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetPosY, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetPosZ, 0.05);

    // Dynamic look target: Direct eye-level focus on dealer and table revolver
    const desiredLookTarget = isAnswering 
      ? new THREE.Vector3(0, 1.02, -0.85) 
      : new THREE.Vector3(0, 1.06, -0.88);

    currentLookTarget.current.lerp(desiredLookTarget, 0.05);
    camera.lookAt(currentLookTarget.current);
  });

  return null;
}
