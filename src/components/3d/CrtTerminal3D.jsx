import React from 'react';
import { Html } from '@react-three/drei';
import { Skull, Clock, Target, Shield, AlertTriangle, Zap, Radio } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

export default function CrtTerminal3D({
  question,
  questionIndex,
  totalQuestions,
  roundNumber,
  timeLeft,
  difficulty,
  gameState,
  turn,
  selectedAnswer,
  onAnswer,
  onShoot,
  shootTarget,
  botName = 'WARDEN',
  botMessage = ''
}) {
  const isCorrect = gameState !== 'answering' && selectedAnswer === question?.correctAnswer;
  const isWrong = gameState !== 'answering' && selectedAnswer && selectedAnswer !== question?.correctAnswer;
  const isCriticalTime = timeLeft !== null && timeLeft <= 10 && gameState === 'answering';

  const handleOptionClick = (key) => {
    if (gameState !== 'answering') return;
    soundEngine.playCrtBeep();
    onAnswer(key);
  };

  const handleShootClick = (target) => {
    soundEngine.playClick();
    onShoot(target);
  };

  return (
    <group position={[-0.42, 0.86, -0.06]} rotation={[-0.10, 0.40, 0.04]} name="TortureInterrogationConsole">
      {/* 1. Heavy Rusted Industrial Steel Chassis (Bolted Tabletop Console) */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.40, 0.34]} />
        <meshStandardMaterial color="#1a1412" roughness={0.88} metalness={0.45} />
      </mesh>

      {/* 2. Angled Slanted Hood / Sun Visor */}
      <mesh position={[0, 0.19, 0.07]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.56, 0.035, 0.25]} />
        <meshStandardMaterial color="#271c19" roughness={0.9} metalness={0.4} />
      </mesh>

      {/* 3. Hazard Warning Stripe Trim on Top Hood */}
      <mesh position={[0, 0.20, 0.16]} rotation={[0.35, 0, 0]}>
        <planeGeometry args={[0.52, 0.025]} />
        <meshStandardMaterial color="#d97706" emissive="#b45309" emissiveIntensity={0.3} roughness={0.6} />
      </mesh>

      {/* 4. Bolted Metal Corner Brackets & Rivets */}
      {[-0.25, 0.25].map((x, i) => (
        <group key={i} position={[x, 0, 0.16]}>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.025, 0.05, 0.025]} />
            <meshStandardMaterial color="#3f2b24" roughness={0.7} metalness={0.7} />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <boxGeometry args={[0.025, 0.05, 0.025]} />
            <meshStandardMaterial color="#3f2b24" roughness={0.7} metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* 5. Analog Pressure Meter / Voltage Gauge on Right Flank */}
      <group position={[0.24, 0.05, 0.10]} rotation={[0, Math.PI / 4, 0]}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial color="#1c1917" roughness={0.5} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial color={isCriticalTime ? "#ef4444" : "#fef08a"} />
        </mesh>
      </group>

      {/* 6. Exposed Corrugated Conduits & Shock Cables into Table */}
      <mesh position={[-0.24, -0.16, -0.05]} rotation={[0.2, 0, -0.4]}>
        <cylinderGeometry args={[0.015, 0.015, 0.32, 8]} />
        <meshStandardMaterial color="#09090b" roughness={0.9} />
      </mesh>
      <mesh position={[-0.20, -0.17, 0.02]} rotation={[0.3, 0.1, -0.5]}>
        <cylinderGeometry args={[0.010, 0.010, 0.34, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* 7. Deep Recessed Screen Bezel */}
      <mesh position={[0, 0, 0.165]}>
        <boxGeometry args={[0.46, 0.33, 0.02]} />
        <meshStandardMaterial color="#0c0a09" roughness={0.95} />
      </mesh>

      {/* 8. Curving Phosphor CRT Glass Layer */}
      <mesh position={[0, 0, 0.172]}>
        <planeGeometry args={[0.43, 0.30]} />
        <meshStandardMaterial
          color="#0f0904"
          emissive={isCriticalTime ? "#7f1d1d" : "#451a03"}
          emissiveIntensity={isCriticalTime ? 0.6 : 0.25}
          roughness={0.12}
          metalness={0.5}
        />
      </mesh>

      {/* 9. Dynamic Interrogation Glow Light */}
      <pointLight
        position={[0, 0, 0.30]}
        color={isCriticalTime ? "#ef4444" : "#f59e0b"}
        intensity={isCriticalTime ? 2.0 : 1.2}
        distance={1.6}
        decay={2}
      />

      {/* 10. Diegetic Tabletop Torture UI Screen */}
      <Html
        transform
        distanceFactor={0.70}
        position={[0, 0, 0.176]}
        rotation={[0, 0, 0]}
        className="select-none pointer-events-auto"
        style={{
          width: '460px',
          height: '330px',
          background: isCriticalTime ? 'rgba(20, 6, 6, 0.98)' : 'rgba(14, 10, 6, 0.97)',
          border: isCriticalTime ? '2px solid rgba(239, 68, 68, 0.8)' : '2px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '8px',
          padding: '14px',
          color: isCriticalTime ? '#fca5a5' : '#fbbf24',
          fontFamily: 'monospace',
          boxShadow: isCriticalTime 
            ? 'inset 0 0 35px rgba(239,68,68,0.4), 0 0 30px rgba(0,0,0,0.9)'
            : 'inset 0 0 25px rgba(245,158,11,0.25), 0 0 25px rgba(0,0,0,0.9)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease'
        }}
      >
        {/* CRT Scanline & Blood Stain Overlay Effects */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 2px, transparent 2px, transparent 4px)',
            pointerEvents: 'none',
            zIndex: 10
          }}
        />

        {/* Top Interrogation Header Bar */}
        <div className={`flex justify-between items-center border-b pb-2 text-[11px] tracking-wider z-20 ${
          isCriticalTime ? 'border-red-500/50 text-red-400' : 'border-amber-500/40 text-amber-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
              isCriticalTime ? 'bg-red-500 animate-ping' : 'bg-amber-500 animate-pulse'
            }`} />
            <span className="font-black uppercase tracking-widest">
              INTERROGATION RIG // R-{roundNumber}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 font-black px-2 py-0.5 rounded border ${
                isCriticalTime 
                  ? 'bg-red-950/80 border-red-500 text-red-400 animate-bounce shadow-[0_0_10px_rgba(239,68,68,0.6)]' 
                  : 'bg-black/40 border-amber-500/30 text-amber-300'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            )}
            <span className="text-zinc-400 font-bold">VEC {questionIndex + 1}/{totalQuestions}</span>
          </div>
        </div>

        {/* Middle Screen: Question Vector or Trigger Protocol */}
        <div className="flex-1 my-2 flex flex-col justify-center overflow-y-auto pr-1 z-20">
          {gameState === 'shooting_choice' ? (
            <div className="text-center py-1">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-black tracking-widest text-[12px] uppercase mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>ACTIVE RECALL VERIFIED</span>
              </div>
              <h3 className="text-[16px] font-black text-amber-200 mb-3 tracking-widest">
                SELECT EXECUTION PROTOCOL
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleShootClick('bot')}
                  className="py-3 px-2 rounded bg-red-950/90 border-2 border-red-600 hover:bg-red-900 text-red-200 font-black text-[12px] tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.5)] cursor-pointer"
                >
                  <Target className="w-4 h-4 text-red-400" />
                  DISCHARGE AT {botName}
                  <span className="text-[9px] text-red-400 block font-mono">(+300)</span>
                </button>

                <button
                  onClick={() => handleShootClick('self')}
                  className="py-3 px-2 rounded bg-amber-950/90 border-2 border-amber-600 hover:bg-amber-900 text-amber-200 font-black text-[12px] tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  DISCHARGE AT SELF
                  <span className="text-[9px] text-amber-400 block font-mono">(+200)</span>
                </button>
              </div>
            </div>
          ) : gameState === 'bot_turn' ? (
            <div className="text-center py-3">
              <p className="text-red-400 text-xs font-black tracking-widest uppercase mb-2 animate-pulse flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>INTERROGATOR CONTROLS CHAMBER</span>
              </p>
              <p className="text-zinc-300 italic text-[12px] bg-black/60 p-3 rounded border border-red-900/60 leading-relaxed font-sans">
                "{botMessage || `${botName} is aligning the cylinder to your temple...`}"
              </p>
            </div>
          ) : (
            <div>
              {/* Question Text Box with Rust / Blood Tinted Border */}
              <div className={`p-2.5 rounded mb-2.5 border backdrop-blur-sm ${
                isCriticalTime 
                  ? 'bg-red-950/40 border-red-600/60 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                  : 'bg-black/50 border-amber-500/30 text-amber-100'
              }`}>
                <p className="text-[12px] font-bold leading-relaxed">
                  {question?.question || "Awaiting active recall probe..."}
                </p>
              </div>

              {/* 4 Chunky Industrial Keypad Answer Options */}
              <div className="grid grid-cols-1 gap-1.5">
                {question?.options && Object.entries(question.options).map(([key, text]) => {
                  let btnStyle = isCriticalTime 
                    ? 'border-red-900/60 bg-red-950/20 text-red-200 hover:bg-red-900/50 hover:border-red-500'
                    : 'border-amber-500/30 bg-amber-950/30 text-amber-200 hover:bg-amber-900/50 hover:border-amber-400';

                  if (selectedAnswer === key) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-950/90 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
                    } else if (isWrong) {
                      btnStyle = 'border-red-600 bg-red-950/90 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse';
                    } else {
                      btnStyle = 'border-amber-400 bg-amber-900/80 text-amber-100';
                    }
                  } else if (gameState !== 'answering' && key === question.correctAnswer) {
                    btnStyle = 'border-emerald-500 bg-emerald-950/70 text-emerald-300';
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => handleOptionClick(key)}
                      disabled={gameState !== 'answering'}
                      className={`w-full text-left px-2.5 py-1.5 rounded border text-[11px] font-mono transition-all flex items-center gap-2 cursor-pointer ${btnStyle}`}
                    >
                      <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                        isCriticalTime ? 'bg-red-900/80 text-red-200' : 'bg-black/60 text-amber-400'
                      }`}>
                        [{key}]
                      </span>
                      <span className="truncate flex-1 font-medium">{text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Hardware Status Bar */}
        <div className={`border-t pt-1.5 flex justify-between items-center text-[9px] tracking-widest uppercase z-20 ${
          isCriticalTime ? 'border-red-500/40 text-red-400' : 'border-amber-500/30 text-amber-500/80'
        }`}>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3" />
            <span>SHOCK_CHAMBER // {gameState.toUpperCase()}</span>
          </div>
          <span className="font-bold">VOLTAGE: NOMINAL</span>
        </div>
      </Html>
    </group>
  );
}
