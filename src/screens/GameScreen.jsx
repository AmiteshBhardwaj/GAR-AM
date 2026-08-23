import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Volume2, VolumeX, Eye, Shield, Target } from 'lucide-react';
import GameScene3D from '../components/3d/GameScene3D';
import QuestionHudOverlay from '../components/QuestionHudOverlay';
import { soundEngine } from '../components/audio/SoundEngine';

export default function GameScreen({
  playerName,
  difficulty,
  question,
  questionIndex,
  totalQuestions,
  roundNumber,
  chamberCount,
  bulletCount,
  bulletsFiredThisRound,
  roundTransition,
  playerScore,
  botScore,
  currentChamber,
  spentChambers,
  bulletChambers,
  bulletFired,
  probability,
  turn,
  isSpinning,
  botMessage,
  isBotThinking,
  onAnswer,
  onShoot,
  gameState,
  selectedAnswer,
  shootTarget,
  overlayType,
  soundEnabled = true,
  onToggleSound,
  botName = 'WARDEN',
  selectedCharacter = 'spartan',
  // Card System Props
  playerCards = [],
  botCards = [],
  activeCardIndex = 0,
  activeCardTurn = 'player',
  cardState = 'table',
  isAnswerCorrect = null,
  gunOwner = 'player',
  onSelectCard
}) {
  const [timeLeft, setTimeLeft] = useState(difficulty === 'Hard' ? 30 : difficulty === 'Medium' ? 60 : null);

  // Sound Engine Sync & Ambient Initialization
  useEffect(() => {
    window.__triggerAnswer = onAnswer;
    soundEngine.setMuted(!soundEnabled);
    if (soundEnabled) {
      soundEngine.startAmbient();
    }
    return () => {
      delete window.__triggerAnswer;
    };
  }, [soundEnabled, onAnswer]);

  // Trigger Sound Effects on Game Events
  useEffect(() => {
    if (overlayType === 'bang') {
      soundEngine.playBang();
    } else if (overlayType === 'click') {
      soundEngine.playClick();
    }
  }, [overlayType]);

  useEffect(() => {
    if (isSpinning) {
      soundEngine.playCylinderSpin();
    }
  }, [isSpinning]);

  // Dynamic Heartbeat based on chamber lethality risk AND countdown timer terror
  useEffect(() => {
    if (!soundEnabled) {
      soundEngine.setHeartbeat(false);
      return;
    }

    if (gameState === 'answering' && timeLeft !== null && timeLeft <= 10) {
      // Escalating panic heartbeat under low time
      const rate = 1.8 + (10 - timeLeft) * 0.15;
      soundEngine.setHeartbeat(true, rate);
    } else if (roundNumber >= 2) {
      const rate = 1.0 + (probability / 100) * 1.5;
      soundEngine.setHeartbeat(true, rate);
    } else {
      soundEngine.setHeartbeat(false);
    }
    return () => soundEngine.setHeartbeat(false);
  }, [soundEnabled, roundNumber, probability, timeLeft, gameState]);

  // Setup/Reset Timer
  useEffect(() => {
    if (difficulty === 'Easy') return;
    if (gameState === 'answering' && turn === 'player') {
      setTimeLeft(difficulty === 'Hard' ? 30 : 60);
    } else {
      setTimeLeft(null);
    }
  }, [questionIndex, roundNumber, gameState, turn, difficulty]);

  // Countdown logic
  useEffect(() => {
    if (gameState !== 'answering' || turn !== 'player' || difficulty === 'Easy' || timeLeft === null) return;
    
    if (timeLeft <= 0) {
      soundEngine.playBuzzer();
      soundEngine.playSparks();
      onAnswer(null); // Timeout!
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => (t !== null ? t - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState, turn, difficulty, onAnswer]);

  const isPanicTime = gameState === 'answering' && timeLeft !== null && timeLeft <= 10;
  const playerHit = overlayType === 'bang' && (shootTarget === 'player' || shootTarget === 'self');
  const botHit = overlayType === 'bang' && shootTarget === 'bot';

  return (
    <div className="w-full h-screen overflow-hidden relative select-none font-sans bg-[#090807]">
      {/* 1. Master 3D Seated Experience with Mechanical Dropdown Blackboard & Revolver */}
      <GameScene3D
        question={question}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        roundNumber={roundNumber}
        timeLeft={timeLeft}
        difficulty={difficulty}
        gameState={gameState}
        turn={turn}
        selectedAnswer={selectedAnswer}
        onAnswer={onAnswer}
        onShoot={onShoot}
        shootTarget={shootTarget}
        isSpinning={isSpinning}
        overlayType={overlayType}
        botName={botName}
        botMessage={botMessage}
        isBotThinking={isBotThinking}
        playerScore={playerScore}
        botScore={botScore}
        bulletCount={bulletCount}
        chamberCount={chamberCount}
        probability={probability}
        playerName={playerName}
        isAnswerCorrect={isAnswerCorrect}
        gunOwner={gunOwner}
        selectedCharacter={selectedCharacter}
      />

      {/* 1.5 Shootout & Interrogator HUD Overlay */}
      <QuestionHudOverlay
        question={question}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        roundNumber={roundNumber}
        timeLeft={timeLeft}
        difficulty={difficulty}
        gameState={gameState}
        turn={turn}
        selectedAnswer={selectedAnswer}
        onAnswer={onAnswer}
        onShoot={onShoot}
        shootTarget={shootTarget}
        botName={botName}
        botMessage={botMessage}
        isAnswerCorrect={isAnswerCorrect}
      />

      {/* 2. Full-screen Cinematic Damage & Flash FX */}
      <AnimatePresence>
        {playerHit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-red-950/80 z-30 pointer-events-none mix-blend-multiply"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {botHit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-amber-500/20 z-30 pointer-events-none mix-blend-screen"
          />
        )}
      </AnimatePresence>

      {/* 2.5 Panic Countdown Red Vignette Overlay */}
      <AnimatePresence>
        {isPanicTime && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 z-30 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(127, 29, 29, 0.6) 80%, rgba(69, 10, 10, 0.9) 100%)',
              mixBlendMode: 'multiply'
            }}
          />
        )}
      </AnimatePresence>

      {/* 3. Top HUD: Audio Toggle & Quick Status Bar */}
      <div className="absolute top-4 left-6 right-6 flex justify-between items-center z-40 pointer-events-auto">
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-amber-500/30 text-xs font-mono text-amber-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>CHAMBER: ROUND {roundNumber}/6</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-300">{bulletCount} LIVE / {chamberCount} CHAMBERS</span>
          <span className="text-zinc-500">•</span>
          <span className="text-red-400 font-bold">RISK: {probability.toFixed(0)}%</span>
        </div>

        <div className="flex items-center gap-3">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-2.5 rounded-lg bg-black/60 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:bg-black/80 transition-all cursor-pointer shadow-lg"
              title={soundEnabled ? "Mute Sound" : "Enable Sound"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>
          )}
        </div>
      </div>

      {/* 4. Round Transition Modal Overlay */}
      <AnimatePresence>
        {roundTransition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <div className="text-center flex flex-col items-center border border-amber-500/40 p-12 rounded-2xl bg-zinc-950/80 shadow-[0_0_50px_rgba(245,158,11,0.2)] max-w-lg">
              <h2 className="text-3xl md:text-5xl font-black tracking-[6px] text-amber-100 mb-2 uppercase font-mono">
                ROUND {roundNumber} LOADED
              </h2>
              <div className="flex items-center gap-4 text-zinc-400 font-mono text-base mb-6 uppercase tracking-widest">
                <span>{bulletCount} BULLETS</span>
                <span className="text-amber-500">•</span>
                <span>{chamberCount} CHAMBERS</span>
              </div>

              <div className="flex flex-col items-center mb-6">
                <span className="text-xs text-amber-500 tracking-[4px] uppercase font-bold mb-2">
                  LETHALITY RISK
                </span>
                <span className="text-6xl font-black leading-none text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.7)] font-mono">
                  {probability.toFixed(0)}%
                </span>
              </div>

              {roundNumber === 6 && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="mt-4 bg-red-950/40 border border-red-500 px-6 py-3 rounded-lg text-red-400 font-bold tracking-[3px] flex items-center gap-3 text-sm"
                >
                  <Skull className="w-5 h-5 text-red-500" />
                  ⚠️ 100% INSTANT DEATH GAUNTLET ⚠️
                  <Skull className="w-5 h-5 text-red-500" />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
