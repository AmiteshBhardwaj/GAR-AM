import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, Shield, AlertTriangle } from 'lucide-react';
import { soundEngine } from './audio/SoundEngine';

export default function QuestionHudOverlay({
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
  botMessage = '',
  isAnswerCorrect = null
}) {
  const isAnswering = gameState === 'answering' && turn === 'player' && isAnswerCorrect === null;

  const handleOptionClick = (key) => {
    if (!isAnswering) return;
    soundEngine.playChalkSnap();
    onAnswer(key);
  };

  const handleShootClick = (target) => {
    soundEngine.playClick();
    onShoot(target);
  };

  // Keyboard shortcut listener (A-D, 1-4 for blackboard answering; 1-2, B, S for shooting choice)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnswering && question?.options) {
        const key = e.key.toUpperCase();
        const optionKeys = ['A', 'B', 'C', 'D'];
        
        // Match A/B/C/D
        if (optionKeys.includes(key) && question.options[key]) {
          handleOptionClick(key);
        } else if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          const optKey = optionKeys[idx];
          if (optKey && question.options[optKey]) {
            handleOptionClick(optKey);
          }
        }
      } else if (gameState === 'shooting_choice') {
        if (e.key === '1' || e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'o') {
          handleShootClick('bot');
        } else if (e.key === '2' || e.key.toLowerCase() === 's') {
          handleShootClick('self');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isAnswering, turn, question, isAnswerCorrect, onAnswer, onShoot]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-6">
      {/* Spacer to respect top status bar */}
      <div className="h-12" />

      {/* CENTER: Opponent Interrogation Subtitles */}
      <div className="flex-1 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {/* Subtitle box during bot turn */}
          {(gameState === 'bot_turn' || turn === 'bot') && gameState !== 'outcome_overlay' && gameState !== 'shooting_choice' && (
            <motion.div
              key="bot-message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pointer-events-auto bg-black/85 backdrop-blur-md border border-red-900/60 px-6 py-3.5 rounded-xl shadow-2xl max-w-lg text-center"
            >
              <div className="flex items-center justify-center gap-2 text-red-400 text-[11px] font-mono uppercase tracking-widest mb-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>INTERROGATOR'S TURN ({botName})</span>
              </div>
              <p className="text-zinc-200 italic text-sm font-sans leading-relaxed">
                "{botMessage || `${botName} is resolving the inquiry...`}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM: Compact Tactical Trigger Bar for Shootout Choices */}
      <div className="flex justify-center pb-2 pointer-events-none">
        <AnimatePresence>
          {gameState === 'shooting_choice' && (
            <motion.div
              key="shooting-bar"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto bg-zinc-950/90 backdrop-blur-xl border-2 border-amber-500/50 p-4 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.9)] max-w-xl w-full"
            >
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono font-bold tracking-widest text-[11px] uppercase mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span>GUN IN HAND // SELECT DISCHARGE TARGET</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleShootClick('bot')}
                  className="py-3.5 px-4 rounded-xl bg-red-950/90 border-2 border-red-600 hover:bg-red-900 text-red-100 font-mono font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_25px_rgba(239,68,68,0.4)] cursor-pointer"
                >
                  <Target className="w-4 h-4 text-red-400" />
                  <div className="flex flex-col items-start leading-tight">
                    <span>DISCHARGE AT {botName}</span>
                    <span className="text-[10px] text-red-400 font-normal font-sans">[Key: 1 or B] +300 PTS</span>
                  </div>
                </button>

                <button
                  onClick={() => handleShootClick('self')}
                  className="py-3.5 px-4 rounded-xl bg-amber-950/90 border-2 border-amber-600 hover:bg-amber-900 text-amber-100 font-mono font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <div className="flex flex-col items-start leading-tight">
                    <span>DISCHARGE AT SELF</span>
                    <span className="text-[10px] text-amber-400 font-normal font-sans">[Key: 2 or S] +200 PTS (RETAIN TURN IF BLANK)</span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

