import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { soundEngine } from '../audio/SoundEngine';

// Generate procedural card front canvas texture
function createFrontCardCanvas(question, selectedAnswer, hoveredOption, timeLeft, isCriticalTime) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Background: Rich antique aged parchment dossier
  const bgGrad = ctx.createLinearGradient(0, 0, 768, 1024);
  bgGrad.addColorStop(0, '#fbf7ed');
  bgGrad.addColorStop(0.3, '#f5edd8');
  bgGrad.addColorStop(0.7, '#ecdec2');
  bgGrad.addColorStop(1, '#dfcdad');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 768, 1024);

  // Aged paper vignette border & texture depth
  const vignette = ctx.createRadialGradient(384, 512, 260, 384, 512, 530);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(146, 64, 14, 0.22)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 768, 1024);

  // Border: Gilded vintage security dossier double border
  ctx.strokeStyle = isCriticalTime ? '#dc2626' : '#92400e';
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, 720, 976);

  ctx.strokeStyle = isCriticalTime ? 'rgba(220, 38, 38, 0.5)' : 'rgba(180, 83, 9, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, 696, 952);

  // Corner decorative rivets / brass marks
  const corners = [[36, 36], [732, 36], [36, 988], [732, 988]];
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = isCriticalTime ? '#dc2626' : '#b45309';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Header Ribbon: Official Classified Protocol Header
  ctx.fillStyle = isCriticalTime ? 'rgba(239, 68, 68, 0.15)' : 'rgba(146, 64, 14, 0.12)';
  ctx.fillRect(44, 48, 680, 70);
  ctx.strokeStyle = isCriticalTime ? '#dc2626' : 'rgba(180, 83, 9, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(44, 48, 680, 70);

  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = isCriticalTime ? '#b91c1c' : '#78350f';
  ctx.textAlign = 'left';
  ctx.fillText(`PROTOCOL // CASE ${question?.category || 'RECALL'}`, 60, 90);

  if (timeLeft !== null) {
    ctx.textAlign = 'right';
    ctx.fillStyle = isCriticalTime ? '#dc2626' : '#b45309';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(`00:${timeLeft.toString().padStart(2, '0')}`, 700, 92);
  }

  // Question Prompt text wrapping (Crisp, High-Contrast Charcoal Ink)
  ctx.textAlign = 'left';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = '#1c1917';

  const qText = question?.question || 'Question text loading...';
  const words = qText.split(' ');
  let line = '';
  let y = 180;
  const maxWidth = 640;
  const lineHeight = 42;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, 64, y);
      line = words[n] + ' ';
      y += lineHeight;
      if (y > 420) {
        line += '...';
        break;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 64, y);

  // Options rendering
  const options = question?.options || {};
  const optionKeys = Object.keys(options);
  const optStartY = 480;
  const optHeight = 100;
  const optSpacing = 118;

  optionKeys.forEach((key, idx) => {
    const optY = optStartY + idx * optSpacing;
    const isSelected = selectedAnswer === key;
    const isHovered = hoveredOption === key;

    // Option Box Background & Borders
    if (isSelected) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.32)';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3.5;
    } else if (isHovered) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2.5;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
      ctx.lineWidth = 2;
    }

    ctx.fillRect(64, optY, 640, optHeight);
    ctx.strokeRect(64, optY, 640, optHeight);

    // Option Badge [A], [B], etc.
    ctx.fillStyle = isSelected ? '#d97706' : '#292524';
    ctx.fillRect(80, optY + 20, 60, 60);

    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = isSelected ? '#000000' : '#f5f5f4';
    ctx.textAlign = 'center';
    ctx.fillText(key, 110, optY + 60);

    // Option Text
    ctx.font = '600 24px sans-serif';
    ctx.fillStyle = isSelected ? '#78350f' : '#1c1917';
    ctx.textAlign = 'left';

    const text = options[key] || '';
    let optText = text;
    if (ctx.measureText(optText).width > 480) {
      while (ctx.measureText(optText + '...').width > 480 && optText.length > 0) {
        optText = optText.slice(0, -1);
      }
      optText += '...';
    }
    ctx.fillText(optText, 160, optY + 58);
  });

  return canvas;
}

// Generate animated blood back canvas texture
function createBackBloodCanvas(bloodProgress, verdictText) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Deep obsidian charcoal leather base
  const bgGrad = ctx.createLinearGradient(0, 0, 768, 1024);
  bgGrad.addColorStop(0, '#090808');
  bgGrad.addColorStop(0.5, '#020202');
  bgGrad.addColorStop(1, '#0c0a0a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 768, 1024);

  // Subtle dark pentagram / occult seal in faint charcoal
  ctx.save();
  ctx.translate(384, 512);
  ctx.strokeStyle = 'rgba(45, 20, 20, 0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 260, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(angle) * 260;
    const y = Math.sin(angle) * 260;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Dark blood splatter marks
  if (bloodProgress > 0.1) {
    ctx.fillStyle = 'rgba(120, 10, 10, 0.45)';
    const splatters = [
      [220, 300, 16], [550, 260, 24], [180, 720, 20], [580, 780, 28],
      [320, 220, 12], [460, 840, 18], [384, 450, 35]
    ];
    splatters.forEach(([sx, sy, sr]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, sr * Math.min(1, bloodProgress * 1.5), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Animated Glowing Blood Script: "YES" or "NO"
  if (bloodProgress > 0.05 && verdictText) {
    ctx.save();
    ctx.translate(384, 512);

    const isYes = verdictText.toUpperCase() === 'YES';
    const text = isYes ? 'YES' : 'NO';

    // Blood outer glow
    ctx.shadowColor = isYes ? 'rgba(239, 68, 68, 0.9)' : 'rgba(185, 28, 28, 0.9)';
    ctx.shadowBlur = 40 * bloodProgress;

    ctx.font = '900 160px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Viscous dark blood base
    ctx.fillStyle = '#450a0a';
    ctx.fillText(text, 0, 0);

    // Glowing vibrant crimson liquid center
    ctx.fillStyle = isYes ? '#dc2626' : '#991b1b';
    ctx.fillText(text, 0, 0);

    ctx.fillStyle = isYes ? '#f87171' : '#ef4444';
    ctx.font = '900 152px serif';
    ctx.fillText(text, 0, -2);

    // Blood Drip trails running down from letters
    if (bloodProgress > 0.3) {
      const dripLen = (bloodProgress - 0.3) * 220;
      ctx.fillStyle = '#7f1d1d';
      const dripXs = isYes ? [-120, -40, 20, 80, 140] : [-80, -20, 40, 100];
      dripXs.forEach((dx, i) => {
        const dHeight = dripLen * (0.6 + ((i * 37) % 10) * 0.05);
        ctx.beginPath();
        ctx.moveTo(dx - 4, 60);
        ctx.lineTo(dx + 4, 60);
        ctx.lineTo(dx + 2, 60 + dHeight);
        ctx.arc(dx, 60 + dHeight, 5, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
      });
    }

    ctx.restore();
  }

  return canvas;
}

export default function QuestionCard3D({
  cardId,
  question,
  cardState = 'table', // 'table', 'inspect', 'flipping', 'blood_reveal', 'morphing', 'discarded'
  turn = 'player',
  cardIndex = 0,
  totalCards = 3,
  selectedAnswer = null,
  isCorrect = null,
  timeLeft = null,
  onSelectCard,
  onAnswerOption
}) {
  const meshRef = useRef();
  const frontCanvasRef = useRef();
  const backCanvasRef = useRef();
  const frontTexRef = useRef();
  const backTexRef = useRef();

  const [hovered, setHovered] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [bloodProgress, setBloodProgress] = useState(0);

  const isCriticalTime = timeLeft !== null && timeLeft <= 10 && cardState === 'inspect';

  // Compute Base Resting Positions on Wooden Table
  const tableRestPos = useMemo(() => {
    const spacing = 0.18;
    const xOffset = (cardIndex - (totalCards - 1) / 2) * spacing;
    if (turn === 'player') {
      return new THREE.Vector3(xOffset, 0.792, 0.28);
    } else {
      return new THREE.Vector3(xOffset, 0.792, -0.28);
    }
  }, [cardIndex, totalCards, turn]);

  const tableRestRot = useMemo(() => {
    if (turn === 'player') {
      return new THREE.Euler(-Math.PI / 2, 0, (cardIndex - 1) * 0.08);
    } else {
      return new THREE.Euler(-Math.PI / 2, 0, Math.PI + (cardIndex - 1) * 0.08);
    }
  }, [cardIndex, turn]);

  // Front Texture Canvas Init & Updates
  useEffect(() => {
    const canvas = createFrontCardCanvas(question, selectedAnswer, hoveredOption, timeLeft, isCriticalTime);
    frontCanvasRef.current = canvas;
    if (!frontTexRef.current) {
      frontTexRef.current = new THREE.CanvasTexture(canvas);
      frontTexRef.current.anisotropy = 8;
    } else {
      frontTexRef.current.image = canvas;
      frontTexRef.current.needsUpdate = true;
    }
  }, [question, selectedAnswer, hoveredOption, timeLeft, isCriticalTime]);

  // Blood Reveal Animation Trigger
  useEffect(() => {
    if (cardState === 'blood_reveal' || cardState === 'morphing') {
      let start = performance.now();
      let animId;
      const duration = 1200; // 1.2s blood carving

      soundEngine.playBloodCarve();

      const animateBlood = (time) => {
        const elapsed = time - start;
        const p = Math.min(1, elapsed / duration);
        setBloodProgress(p);

        const verdict = isCorrect === true ? 'YES' : 'NO';
        const canvas = createBackBloodCanvas(p, verdict);
        backCanvasRef.current = canvas;
        if (backTexRef.current) {
          backTexRef.current.image = canvas;
          backTexRef.current.needsUpdate = true;
        }

        if (p < 1) {
          animId = requestAnimationFrame(animateBlood);
        }
      };

      animId = requestAnimationFrame(animateBlood);
      return () => cancelAnimationFrame(animId);
    } else {
      setBloodProgress(0);
      const canvas = createBackBloodCanvas(0, '');
      backCanvasRef.current = canvas;
      if (backTexRef.current) {
        backTexRef.current.image = canvas;
        backTexRef.current.needsUpdate = true;
      }
    }
  }, [cardState, isCorrect]);

  // Initial Back Texture
  useEffect(() => {
    const canvas = createBackBloodCanvas(0, '');
    backCanvasRef.current = canvas;
    backTexRef.current = new THREE.CanvasTexture(canvas);
    backTexRef.current.anisotropy = 8;
  }, []);

  // Frame-by-Frame 3D Interpolation
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    let targetPos = tableRestPos.clone();
    let targetRot = tableRestRot.clone();
    let targetScale = new THREE.Vector3(1, 1, 1);

    if (cardState === 'inspect') {
      // First-person close-up view facing camera
      targetPos = new THREE.Vector3(0, 1.10, 0.62);
      targetRot = new THREE.Euler(-0.32, 0, 0);
      targetScale = new THREE.Vector3(1.15, 1.15, 1.15);

      // Subtle breathing float
      targetPos.y += Math.sin(t * 2) * 0.005;
    } else if (cardState === 'flipping' || cardState === 'blood_reveal') {
      // Lifted up and flipped 180 deg to show pitch-black back with blood script
      targetPos = new THREE.Vector3(0, 1.10, 0.62);
      targetRot = new THREE.Euler(-0.32, Math.PI, 0);
      targetScale = new THREE.Vector3(1.15, 1.15, 1.15);
    } else if (cardState === 'morphing') {
      // Shrinking & dissolving down to revolver spawn point on table
      targetPos = new THREE.Vector3(0, 0.85, 0.15);
      targetRot = new THREE.Euler(-Math.PI / 2, Math.PI, 0);
      targetScale = new THREE.Vector3(0.01, 0.01, 0.01);
    } else if (cardState === 'table') {
      if (hovered && turn === 'player') {
        targetPos.y += 0.035; // Lift on hover
      }
    } else if (cardState === 'discarded') {
      targetScale = new THREE.Vector3(0, 0, 0);
    }

    meshRef.current.position.lerp(targetPos, 0.12);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRot.x, 0.12);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRot.y, 0.12);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRot.z, 0.12);
    meshRef.current.scale.lerp(targetScale, 0.14);
  });

  // Handle Raycast Clicks on Options in 3D
  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (cardState === 'table' && turn === 'player' && onSelectCard) {
      soundEngine.playCardFlip();
      onSelectCard(cardIndex);
      return;
    }

    if (cardState === 'inspect' && turn === 'player' && e.uv) {
      // Check which option was clicked based on UV coordinates
      const uvY = 1 - e.uv.y;
      const optionKeys = Object.keys(question?.options || {});

      const optStartUV = 480 / 1024;
      const optSpacingUV = 118 / 1024;
      const optHeightUV = 100 / 1024;

      optionKeys.forEach((key, idx) => {
        const top = optStartUV + idx * optSpacingUV;
        const bottom = top + optHeightUV;
        if (uvY >= top && uvY <= bottom) {
          soundEngine.playCrtBeep();
          if (onAnswerOption) onAnswerOption(key);
        }
      });
    }
  };

  const handlePointerMove = (e) => {
    if (cardState === 'inspect' && e.uv) {
      const uvY = 1 - e.uv.y;
      const optionKeys = Object.keys(question?.options || {});
      const optStartUV = 480 / 1024;
      const optSpacingUV = 118 / 1024;
      const optHeightUV = 100 / 1024;

      let found = null;
      optionKeys.forEach((key, idx) => {
        const top = optStartUV + idx * optSpacingUV;
        const bottom = top + optHeightUV;
        if (uvY >= top && uvY <= bottom) {
          found = key;
        }
      });
      setHoveredOption(found);
    }
  };

  return (
    <group
      ref={meshRef}
      position={tableRestPos.toArray()}
      rotation={tableRestRot.toArray()}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => {
        setHovered(false);
        setHoveredOption(null);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      name={`Card_${cardIndex}`}
    >
      {/* 3D Physical Card Mesh */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.30, 0.003]} />
        {/* Materials for 6 faces: [right, left, top, bottom, front, back] */}
        <meshStandardMaterial attach="material-0" color="#3f3f46" roughness={0.7} />
        <meshStandardMaterial attach="material-1" color="#3f3f46" roughness={0.7} />
        <meshStandardMaterial attach="material-2" color="#3f3f46" roughness={0.7} />
        <meshStandardMaterial attach="material-3" color="#3f3f46" roughness={0.7} />
        {/* Front Face (Questions & Options) */}
        <meshStandardMaterial
          attach="material-4"
          map={frontTexRef.current}
          roughness={0.5}
          metalness={0.0}
        />
        {/* Back Face (Pitch Black + Blood Script) */}
        <meshStandardMaterial
          attach="material-5"
          map={backTexRef.current}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Front inspect lighting so card is always crisp and readable when examined */}
      {cardState === 'inspect' && (
        <pointLight position={[0, 0, 0.25]} color="#fffbeb" intensity={1.8} distance={1.0} decay={1.2} />
      )}

      {/* Morphing Dark Smoke / Ash Particle Cloud */}
      {cardState === 'morphing' && (
        <pointLight color="#ef4444" intensity={3.5} distance={1.2} />
      )}
    </group>
  );
}
