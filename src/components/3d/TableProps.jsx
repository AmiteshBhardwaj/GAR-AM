import React from 'react';
import { Html } from '@react-three/drei';
import { Skull, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function TableProps({
  playerScore = 0,
  botScore = 0,
  roundNumber = 1,
  bulletCount = 1,
  chamberCount = 6,
  probability = 16.7,
  playerName = 'REVISER',
  botName = 'WARDEN'
}) {
  return (
    <group name="TableProps">
      {/* 1. Tactical Scorecard Notepad on Right Side of Table */}
      <group position={[0.32, 0.785, 0.05]} rotation={[0, -0.32, 0]}>
        {/* Paper Notepad Sheet */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.01, 0.44]} />
          <meshStandardMaterial color="#d6c7a1" roughness={0.9} />
        </mesh>

        {/* Metal Clipboard Top Clip */}
        <mesh position={[0, 0.012, -0.2]} castShadow>
          <boxGeometry args={[0.16, 0.02, 0.04]} />
          <meshStandardMaterial color="#52525b" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Diegetic Notepad Content */}
        <Html
          transform
          distanceFactor={0.52}
          position={[0, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          className="select-none pointer-events-none"
          style={{
            width: '260px',
            height: '320px',
            fontFamily: 'monospace',
            color: '#262626',
            padding: '12px',
            fontSize: '11px'
          }}
        >
          <div className="border-b-2 border-dashed border-stone-800 pb-1 mb-2 font-bold tracking-wider">
            DOSSIER // SCORE LOG
          </div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="font-bold">{playerName}:</span>
            <span className="font-black text-amber-900 bg-amber-200 px-1 rounded">
              {playerScore} PTS
            </span>
          </div>
          <div className="flex justify-between items-center mb-2 text-[11px]">
            <span className="font-bold text-red-900">{botName}:</span>
            <span className="font-black text-red-900 bg-red-200 px-1 rounded">
              {botScore} PTS
            </span>
          </div>

          <div className="border-t border-stone-400 pt-2 mt-2">
            <div className="text-[10px] text-stone-600 font-bold uppercase mb-1">
              CHAMBER STATUS
            </div>
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: chamberCount }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border border-stone-700 flex items-center justify-center text-[9px] font-bold ${
                    i < bulletCount ? 'bg-red-700 text-white' : 'bg-stone-300 text-stone-600'
                  }`}
                >
                  {i < bulletCount ? '●' : '○'}
                </div>
              ))}
            </div>
            <div className="text-[11px] font-bold text-red-800 mt-2">
              RISK: {probability.toFixed(0)}%
            </div>
          </div>
        </Html>
      </group>

      {/* 2. Brass Bullet Casings scattered on the table */}
      <group position={[0.15, 0.785, 0.08]} rotation={[0, 0.8, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.045, 12]} />
          <meshStandardMaterial color="#eab308" metalness={0.92} roughness={0.2} />
        </mesh>
      </group>
      <group position={[0.18, 0.785, -0.06]} rotation={[0, -0.4, 0]}>
        <mesh rotation={[Math.PI / 2, 0, -0.6]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.045, 12]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}
