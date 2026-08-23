import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import RoomEnvironment from './RoomEnvironment';
import HangingLamp from './HangingLamp';
import WoodenTable from './WoodenTable';
import OpponentDealer from './OpponentDealer';
import Revolver3D from './Revolver3D';
import TableProps from './TableProps';
import MuzzleFlashEffect from './MuzzleFlashEffect';
import FirstPersonCamera from './FirstPersonCamera';
import MechanicalDropdownScreen3D from './MechanicalDropdownScreen3D';

export default function GameScene3D({
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
  isSpinning,
  overlayType,
  botName = 'WARDEN',
  botMessage = '',
  isBotThinking = false,
  playerScore = 0,
  botScore = 0,
  bulletCount = 1,
  chamberCount = 6,
  probability = 16.7,
  playerName = 'REVISER',
  isAnswerCorrect = null,
  gunOwner = 'player',
  tablePosition = [0, 0, 0],
  tableRotation = [0, Math.PI / 2, 0],
  tableScale = 1,
  selectedCharacter = 'spartan'
}) {
  const isBang = overlayType === 'bang';
  const isBotShooting = turn === 'bot' && (gameState === 'bot_turn' || gameState === 'firing' || gameState === 'bot_shooting');
  const botHit = isBang && shootTarget === 'bot';

  // Revolver visibility: fully visible during shooting choice, firing, bot shooting, or gun pickup
  const isGunVisible =
    gameState === 'shooting_choice' ||
    gameState === 'firing' ||
    gameState === 'bot_shooting' ||
    gameState === 'card_morphing_gun' ||
    gameState === 'table_idle' ||
    gameState === 'round_transition';

  return (
    <div className="w-full h-full absolute inset-0 bg-[#0a0a08] select-none">
      <Canvas
        shadows="percentage"
        camera={{ position: [0, 1.22, 1.05], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          {/* Seated 1st-Person Camera with Breathing & Parallax */}
          <FirstPersonCamera
            isShaking={isBang}
            isAnswering={gameState === 'answering'}
          />

          {/* Atmospheric Dark Room & Dust Motes */}
          <RoomEnvironment />

          {/* Swinging Overhead Pendant Incandescent Lamp */}
          <HangingLamp isShaking={isBang} />

          {/* Long Weathered Rustic Oak Table and Chairs */}
          <WoodenTable position={tablePosition} rotation={tableRotation} scale={tableScale} />

          {/* Menacing Opponent Dealer seated across the table */}
          <OpponentDealer
            botName={botName}
            selectedCharacter={selectedCharacter}
            isThinking={isBotThinking}
            isShooting={isBotShooting}
            botHit={botHit}
            botMessage={botMessage}
          />

          {/* 3D Mechanical Ceiling Dropdown Blackboard Screen */}
          <MechanicalDropdownScreen3D
            question={question}
            selectedAnswer={selectedAnswer}
            isAnswerCorrect={isAnswerCorrect}
            timeLeft={timeLeft}
            turn={turn}
            gameState={gameState}
            onAnswer={onAnswer}
            tablePosition={tablePosition}
          />

          {/* Articulated 6-Chamber Revolver (Presents to Shooter during Shootout) */}
          <Revolver3D
            gameState={gameState}
            turn={turn}
            shootTarget={shootTarget}
            isSpinning={isSpinning}
            isFiring={isBang}
            gunOwner={gunOwner}
            isVisible={isGunVisible}
          />

          {/* Tabletop score notepad & brass casings */}
          <TableProps
            playerScore={playerScore}
            botScore={botScore}
            roundNumber={roundNumber}
            bulletCount={bulletCount}
            chamberCount={chamberCount}
            probability={probability}
            playerName={playerName}
            botName={botName}
          />

          {/* Muzzle Flash & Explosion Light on Gunshots */}
          <MuzzleFlashEffect isFiring={isBang} shootTarget={shootTarget} />
        </Suspense>
      </Canvas>
    </div>
  );
}

