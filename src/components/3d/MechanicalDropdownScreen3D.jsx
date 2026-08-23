import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { soundEngine } from '../audio/SoundEngine';

// Option box coordinates on the canvas (1024 x 768)
const OPTION_COORDS = {
  A: { x: 45, y: 350, w: 455, h: 145 },
  B: { x: 524, y: 350, w: 455, h: 145 },
  C: { x: 45, y: 515, w: 455, h: 145 },
  D: { x: 524, y: 515, w: 455, h: 145 }
};

// Procedural high-contrast blackboard painter
function drawBlackboardToCanvas(
  canvas,
  question,
  selectedAnswer,
  hoveredOption,
  timeLeft,
  turn,
  isAnswerCorrect,
  isLowered
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Dark Vintage Slate Blackboard Background
  const bg = ctx.createLinearGradient(0, 0, 1024, 768);
  bg.addColorStop(0, '#13191d');
  bg.addColorStop(0.5, '#0f1417');
  bg.addColorStop(1, '#0b0e10');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 768);

  // Subtle slate texture smudges
  ctx.save();
  for (let i = 0; i < 35; i++) {
    const sx = ((i * 149) % 960) + 32;
    const sy = ((i * 257) % 700) + 32;
    const sr = 40 + ((i * 37) % 80);
    const smudge = ctx.createRadialGradient(sx, sy, 5, sx, sy, sr);
    smudge.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    smudge.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = smudge;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Double Chalk Slate Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(18, 18, 988, 732);

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, 972, 716);

  // Corner Rivet Accents in Chalk Amber
  const corners = [
    [32, 32],
    [992, 32],
    [32, 736],
    [992, 736]
  ];
  ctx.fillStyle = '#f59e0b';
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // 2. Header Banner: Subject & Countdown
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(38, 36, 948, 68);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(38, 36, 948, 68);

  // Header Subject
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillStyle = '#fef08a'; // Yellow chalk
  const categoryText = (question?.category || 'ACTIVE RECALL PROTOCOL').toUpperCase();
  ctx.fillText(`SUBJECT // ${categoryText}`, 56, 78);

  // Turn badge
  ctx.font = 'bold 19px "Courier New", monospace';
  ctx.fillStyle = turn === 'player' ? '#6ee7b7' : '#f87171';
  ctx.textAlign = 'center';
  ctx.fillText(turn === 'player' ? '● REVISER TURN' : '▲ INTERROGATOR TURN', 512, 78);

  // Countdown timer in chalk
  if (timeLeft !== null && turn === 'player') {
    const isCritical = timeLeft <= 10;
    ctx.textAlign = 'right';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = isCritical ? '#ef4444' : '#fef08a';
    ctx.fillText(`⏱ 00:${timeLeft.toString().padStart(2, '0')}`, 966, 80);
  }

  // 3. Question Prompt Text (Crisp Chalk Typography)
  ctx.textAlign = 'left';
  const qText = question?.question || 'Calibrating inquiry archives... Prepare for active recall.';
  
  // Dynamic font sizing based on length
  const isLongText = qText.length > 140;
  ctx.font = isLongText ? 'bold 24px "Trebuchet MS", "Segoe UI", Arial, sans-serif' : 'bold 28px "Trebuchet MS", "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';

  const words = qText.split(' ');
  let line = '';
  let y = 148;
  const maxWidth = 900;
  const lineHeight = isLongText ? 36 : 42;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, 56, y);
      line = words[n] + ' ';
      y += lineHeight;
      if (y > 315) {
        line += '...';
        break;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 56, y);

  // 4. Opponent / Bot Solving State
  if (turn === 'bot' && isAnswerCorrect === null) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
    ctx.fillRect(45, 340, 934, 320);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(45, 340, 934, 320);

    ctx.textAlign = 'center';
    ctx.font = 'bold 30px "Courier New", monospace';
    ctx.fillStyle = '#fca5a5';
    ctx.fillText('⚡ INTERROGATOR CALCULATING VERDICT ⚡', 512, 480);

    ctx.font = 'italic 22px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Cross-examining archives under live chamber pressure...', 512, 530);
    return;
  }

  // 5. Option Boxes (A, B, C, D)
  // Handle options format: object { A: '...', B: '...' } or array ['...', '...']
  let normalizedOptions = {};
  if (question?.options) {
    if (Array.isArray(question.options)) {
      ['A', 'B', 'C', 'D'].forEach((k, idx) => {
        normalizedOptions[k] = question.options[idx] || '';
      });
    } else {
      normalizedOptions = question.options;
    }
  } else {
    normalizedOptions = {
      A: 'Option A',
      B: 'Option B',
      C: 'Option C',
      D: 'Option D'
    };
  }

  const optionKeys = ['A', 'B', 'C', 'D'];

  optionKeys.forEach((key) => {
    const optText = normalizedOptions[key] || '';
    const coords = OPTION_COORDS[key];
    if (!coords) return;

    const isHovered = hoveredOption === key;
    const isSelected = selectedAnswer === key;

    // Box styling
    if (isSelected) {
      if (isAnswerCorrect === true) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.strokeStyle = '#4ade80';
      } else if (isAnswerCorrect === false) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.strokeStyle = '#f87171';
      } else {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.strokeStyle = '#f59e0b';
      }
    } else if (isHovered && turn === 'player' && isAnswerCorrect === null) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
      ctx.strokeStyle = '#fef08a';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    }

    ctx.lineWidth = isSelected || isHovered ? 3.0 : 1.8;
    ctx.fillRect(coords.x, coords.y, coords.w, coords.h);
    ctx.strokeRect(coords.x, coords.y, coords.w, coords.h);

    // Option key badge [A]
    ctx.fillStyle = isSelected ? '#fef08a' : isHovered ? '#ffffff' : '#e2e8f0';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[${key}]`, coords.x + 16, coords.y + 34);

    // Option description text wrapped within box
    ctx.font = 'bold 18px "Trebuchet MS", "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = isSelected ? '#ffffff' : isHovered ? '#ffffff' : '#f8fafc';

    const optWords = optText.split(' ');
    let optLine = '';
    let optY = coords.y + 68;
    const optMaxWidth = coords.w - 32;

    for (let n = 0; n < optWords.length; n++) {
      const test = optLine + optWords[n] + ' ';
      if (ctx.measureText(test).width > optMaxWidth && n > 0) {
        ctx.fillText(optLine, coords.x + 16, optY);
        optLine = optWords[n] + ' ';
        optY += 26;
        if (optY > coords.y + coords.h - 10) {
          optLine += '...';
          break;
        }
      } else {
        optLine = test;
      }
    }
    ctx.fillText(optLine, coords.x + 16, optY);

    // Answer indicator check/cross in box corner
    if (isSelected && isAnswerCorrect !== null) {
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'right';
      if (isAnswerCorrect) {
        ctx.fillStyle = '#4ade80';
        ctx.fillText('✓', coords.x + coords.w - 18, coords.y + 38);
      } else {
        ctx.fillStyle = '#f87171';
        ctx.fillText('✗', coords.x + coords.w - 18, coords.y + 38);
      }
    }
  });

  // 6. Verdict Banner (Stamp across bottom if resolved)
  if (isAnswerCorrect !== null) {
    const isYes = isAnswerCorrect === true;
    ctx.fillStyle = isYes ? 'rgba(22, 101, 52, 0.95)' : 'rgba(153, 27, 27, 0.95)';
    ctx.fillRect(45, 680, 934, 52);
    ctx.strokeStyle = isYes ? '#4ade80' : '#f87171';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(45, 680, 934, 52);

    ctx.textAlign = 'center';
    ctx.font = 'bold 21px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(
      isYes ? '✓ VERDICT: ACCURATE // PROCEEDING TO TRIGGER DECISION' : '✗ VERDICT: INCORRECT // INTERROGATOR GAINS FIRE CONTROL',
      512,
      714
    );
  }
}

export default function MechanicalDropdownScreen3D({
  question,
  selectedAnswer,
  isAnswerCorrect,
  timeLeft,
  turn = 'player',
  gameState,
  onAnswer,
  tablePosition = [0, 0, 0]
}) {
  const groupRef = useRef();
  const leftCableRef = useRef();
  const rightCableRef = useRef();
  const leftWinchWheelRef = useRef();
  const rightWinchWheelRef = useRef();

  const [hoveredOption, setHoveredOption] = useState(null);

  // Position constants:
  // Elevated eye-level clearance: y = 1.36, z = -0.30 (elevated ~20cm above table top at 0.78, in front of dealer)
  // Stowed ceiling height: y = 3.60 (stowed safely near ceiling)
  const LOWERED_Y = 1.36;
  const STOWED_Y = 3.60;
  const CEILING_Y = 4.20;
  const BOARD_Z = -0.30;

  // The screen is lowered during question answering and bot thinking
  const isLowered =
    gameState === 'answering' ||
    gameState === 'player_card_inspect' ||
    gameState === 'bot_turn' ||
    gameState === 'bot_thinking';

  // Sound triggers on transition
  const prevLoweredRef = useRef(isLowered);
  useEffect(() => {
    if (prevLoweredRef.current !== isLowered) {
      if (isLowered) {
        soundEngine.playWinchLower();
      } else {
        soundEngine.playWinchRaise();
      }
      prevLoweredRef.current = isLowered;
    }
  }, [isLowered]);

  // Dedicated Persistent Canvas and Texture
  const canvasRef = useRef(null);
  if (!canvasRef.current) {
    canvasRef.current = document.createElement('canvas');
    canvasRef.current.width = 1024;
    canvasRef.current.height = 768;
    // Pre-paint initial frame
    drawBlackboardToCanvas(
      canvasRef.current,
      question,
      selectedAnswer,
      hoveredOption,
      timeLeft,
      turn,
      isAnswerCorrect,
      isLowered
    );
  }

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvasRef.current);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }, []);

  // Update canvas contents whenever props change
  useEffect(() => {
    if (canvasRef.current && texture) {
      drawBlackboardToCanvas(
        canvasRef.current,
        question,
        selectedAnswer,
        hoveredOption,
        timeLeft,
        turn,
        isAnswerCorrect,
        isLowered
      );
      texture.needsUpdate = true;
    }
  }, [question, selectedAnswer, hoveredOption, timeLeft, turn, isAnswerCorrect, isLowered, texture]);

  // Clean, smooth, non-oscillating damped lerp movement
  const currentYRef = useRef(isLowered ? LOWERED_Y : STOWED_Y);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const targetY = isLowered ? LOWERED_Y : STOWED_Y;
    const lerpSpeed = isLowered ? 6.0 : 7.0;
    
    // Smooth exponential decay lerp without bouncy spring overshoot
    currentYRef.current = THREE.MathUtils.lerp(
      currentYRef.current,
      targetY,
      Math.min(1.0, delta * lerpSpeed)
    );

    // Apply board position
    groupRef.current.position.y = currentYRef.current;
    groupRef.current.position.z = BOARD_Z;

    // Dynamic cable scaling
    const boardTopY = currentYRef.current + 0.38;
    const cableLength = Math.max(0.1, CEILING_Y - boardTopY);
    const cableCenterY = (CEILING_Y + boardTopY) / 2;

    if (leftCableRef.current) {
      leftCableRef.current.position.y = cableCenterY;
      leftCableRef.current.scale.set(1, cableLength, 1);
    }
    if (rightCableRef.current) {
      rightCableRef.current.position.y = cableCenterY;
      rightCableRef.current.scale.set(1, cableLength, 1);
    }

    // Winch pulleys rotate when screen moves
    const diff = targetY - currentYRef.current;
    if (Math.abs(diff) > 0.01) {
      const rot = (diff > 0 ? -1 : 1) * delta * 2.5;
      if (leftWinchWheelRef.current) leftWinchWheelRef.current.rotation.x += rot;
      if (rightWinchWheelRef.current) rightWinchWheelRef.current.rotation.x += rot;
    }
  });

  // Pointer Raycasting on Blackboard Face
  const handlePointerMove = useCallback((e) => {
    if (!isLowered || turn !== 'player' || isAnswerCorrect !== null) {
      if (hoveredOption !== null) {
        setHoveredOption(null);
        document.body.style.cursor = 'auto';
      }
      return;
    }
    e.stopPropagation();

    // Map UV coordinates (0 to 1) to Canvas pixel coords
    if (!e.uv) return;
    const canvasX = e.uv.x * 1024;
    const canvasY = (1 - e.uv.y) * 768;

    let matched = null;
    for (const [key, coords] of Object.entries(OPTION_COORDS)) {
      if (
        canvasX >= coords.x &&
        canvasX <= coords.x + coords.w &&
        canvasY >= coords.y &&
        canvasY <= coords.y + coords.h
      ) {
        matched = key;
        break;
      }
    }

    if (matched !== hoveredOption) {
      if (matched) soundEngine.playChalkScratch();
      setHoveredOption(matched);
      document.body.style.cursor = matched ? 'pointer' : 'auto';
    }
  }, [isLowered, turn, isAnswerCorrect, hoveredOption]);

  const handlePointerOut = useCallback(() => {
    if (hoveredOption !== null) {
      setHoveredOption(null);
      document.body.style.cursor = 'auto';
    }
  }, [hoveredOption]);

  const handleClick = useCallback((e) => {
    if (!isLowered || turn !== 'player' || isAnswerCorrect !== null || !hoveredOption) return;
    e.stopPropagation();
    soundEngine.playChalkSnap();
    document.body.style.cursor = 'auto';
    if (onAnswer) {
      onAnswer(hoveredOption);
    }
  }, [isLowered, turn, isAnswerCorrect, hoveredOption, onAnswer]);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. CEILING WINCH APPARATUS (Anchored at Ceiling) */}
      <group position={[0, CEILING_Y, BOARD_Z]}>
        {/* Main Ceiling Cross-Truss Beam */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[1.5, 0.08, 0.16]} />
          <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.4} />
        </mesh>

        {/* Left Winch Box */}
        <group position={[-0.52, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.16, 0.14, 0.14]} />
            <meshStandardMaterial color="#27272a" metalness={0.7} roughness={0.5} />
          </mesh>
          <mesh ref={leftWinchWheelRef} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.07, 16]} />
            <meshStandardMaterial color="#71717a" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>

        {/* Right Winch Box */}
        <group position={[0.52, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.16, 0.14, 0.14]} />
            <meshStandardMaterial color="#27272a" metalness={0.7} roughness={0.5} />
          </mesh>
          <mesh ref={rightWinchWheelRef} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.07, 16]} />
            <meshStandardMaterial color="#71717a" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* 2. DUAL STEEL CABLES (Dynamic stretching) */}
      <mesh ref={leftCableRef} position={[-0.52, 2.8, BOARD_Z]}>
        <cylinderGeometry args={[0.004, 0.004, 1.0, 8]} />
        <meshStandardMaterial color="#a1a1aa" metalness={0.95} roughness={0.2} />
      </mesh>

      <mesh ref={rightCableRef} position={[0.52, 2.8, BOARD_Z]}>
        <cylinderGeometry args={[0.004, 0.004, 1.0, 8]} />
        <meshStandardMaterial color="#a1a1aa" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* 3. INDUSTRIAL BLACKBOARD & FRAME (Motorized Screen) */}
      <group ref={groupRef} position={[0, STOWED_Y, BOARD_Z]}>
        {/* Outer Heavy Iron Backing Plate */}
        <mesh castShadow receiveShadow position={[0, 0, -0.01]}>
          <boxGeometry args={[1.38, 0.76, 0.02]} />
          <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.5} />
        </mesh>

        {/* Outer Frame Bevel / Border Trim */}
        <mesh position={[0, 0, 0.005]}>
          <boxGeometry args={[1.34, 0.72, 0.01]} />
          <meshStandardMaterial color="#27272a" metalness={0.7} roughness={0.4} />
        </mesh>

        {/* Slate Blackboard Display Face with High-Contrast Canvas Material */}
        <mesh
          position={[0, 0, 0.015]}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <planeGeometry args={[1.28, 0.66]} />
          <meshBasicMaterial
            map={texture}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Overhead Hooded Lamps */}
        {[-0.38, 0.38].map((xPos, idx) => (
          <group key={`lamp_${idx}`} position={[xPos, 0.38, 0.04]}>
            {/* Stem */}
            <mesh rotation={[0.4, 0, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.10, 8]} />
              <meshStandardMaterial color="#71717a" metalness={0.8} />
            </mesh>
            {/* Hood */}
            <mesh position={[0, 0.02, 0.05]} rotation={[0.5, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.05, 0.035, 16, 1, true]} />
              <meshStandardMaterial color="#18181b" metalness={0.7} roughness={0.4} />
            </mesh>
            {/* Glowing Bulb */}
            <mesh position={[0, 0.015, 0.045]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshStandardMaterial color="#fffbeb" emissive="#f59e0b" emissiveIntensity={1.5} />
            </mesh>
          </group>
        ))}

        {/* 4 Corner Brass Rivet Accents */}
        {[
          [-0.65, 0.34],
          [0.65, 0.34],
          [-0.65, -0.34],
          [0.65, -0.34]
        ].map(([cx, cy], i) => (
          <group key={`bracket_${i}`} position={[cx, cy, 0.018]}>
            <mesh>
              <boxGeometry args={[0.04, 0.04, 0.006]} />
              <meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.003]}>
              <sphereGeometry args={[0.005, 8, 8]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Bottom Chalk Tray & Sticks */}
        <group position={[0, -0.39, 0.03]}>
          <mesh castShadow>
            <boxGeometry args={[1.28, 0.025, 0.05]} />
            <meshStandardMaterial color="#1c1917" metalness={0.8} roughness={0.4} />
          </mesh>
          <mesh position={[-0.15, 0.015, 0]} rotation={[0, 0.2, Math.PI / 2]}>
            <cylinderGeometry args={[0.004, 0.004, 0.04, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.9} />
          </mesh>
          <mesh position={[0.10, 0.015, 0.004]} rotation={[0, -0.3, Math.PI / 2]}>
            <cylinderGeometry args={[0.004, 0.004, 0.035, 8]} />
            <meshStandardMaterial color="#fef08a" roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

