import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';
import HistoryScreen from './screens/HistoryScreen';

import { extractTextFromPdf } from './services/pdfParser';
import { generateQuestions, FIXED_TEST_QUESTIONS } from './services/aiGenerator';
import { soundEngine } from './components/audio/SoundEngine';
import logoImg from './assets/logo.png';

const SCORE_HISTORY_KEY = 'gamified_active_recall_scores';

// Dialogue messages database for dynamic bots
const BOT_TAUNTS = {
  CADET_7: {
    wrongAnswer: [
      "I... I think I can do this",
      "My circuits are warming up...",
      "Don't go easy on me!"
    ],
    idle: [
      "I'm ready when you are.",
      "Just select your answer, I guess.",
      "You have no chance of winning, give up!"
    ],
    shootPlayerBang: [
      "I hit! I mean, system damage recorded.",
      "Wow, I actually hit!"
    ],
    shootPlayerBlank: [
      "Phew, you survived.",
      "It was a blank. Good luck!"
    ],
    shootSelfBlank: ["I survived! Wow."],
    shootSelfBang: ["Ouch! That really hurts!"],
    missedBot: ["You missed me! Okay, my turn!"]
  },
  WARDEN: {
    wrongAnswer: [
      "Protocol engaged.",
      "Your hesitation is noted.",
      "The cell is ready for you."
    ],
    idle: [
      "The chamber is waiting.",
      "State your answer.",
      "I am monitoring your performance."
    ],
    shootPlayerBang: [
      "Neutralized.",
      "Threat eliminated.",
      "Direct hit."
    ],
    shootPlayerBlank: [
      "Click. You get a temporary reprieve.",
      "Next question is yours."
    ],
    shootSelfBlank: ["Standard procedure. Proceed."],
    shootSelfBang: ["Minor damage sustained. Recalibrating."],
    missedBot: ["Your aim is substandard. My turn."]
  },
  CIPHER: {
    wrongAnswer: [
      "Predictable.",
      "I've already calculated your next mistake.",
      "Your recall is... adequate."
    ],
    idle: [
      "Every incorrect answer increases your chances of terminal shutdown.",
      "I'm keeping the barrel warm for you.",
      "Make your move."
    ],
    shootPlayerBang: [
      "Hahaha! The mathematical probability finally caught you!",
      "Exactly as simulated."
    ],
    shootPlayerBlank: [
      "A minor variable shift.",
      "It changes nothing."
    ],
    shootSelfBlank: ["Statistically probable."],
    shootSelfBang: ["Anomalous variable detected in chamber..."],
    missedBot: ["You failed to account for my evasive patterns."]
  }
};

export default function App() {
  // Screen Routing
  const [screen, setScreen] = useState('home'); // 'home', 'game', 'result', 'history'
  const [isGlitching, setIsGlitching] = useState(false);
  
  // Game Setup & Configuration
  const [playerName, setPlayerName] = useState('REVISER');
  const [difficulty, setDifficulty] = useState('Medium');
  const [totalRounds, setTotalRounds] = useState(6);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedCharacter, setSelectedCharacter] = useState('spartan');

  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('active_recall_sound') !== 'off');

  // PDF Parser State
  const [pdfParsedText, setPdfParsedText] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');

  // Leaderboard score logs
  const [leaderboardScores, setLeaderboardScores] = useState(() => {
    try {
      const saved = localStorage.getItem(SCORE_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Game Engine State
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);

  // 3D Card System State
  const [playerCards, setPlayerCards] = useState([]);
  const [botCards, setBotCards] = useState([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [activeCardTurn, setActiveCardTurn] = useState('player'); // 'player' | 'bot'
  const [cardState, setCardState] = useState('table'); // 'table', 'inspect', 'flipping', 'blood_reveal', 'morphing', 'discarded'
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [gunOwner, setGunOwner] = useState('player'); // 'player' | 'bot'
  
  // Revolver Cylinder State
  const [bulletChambers, setBulletChambers] = useState([]); // Array of bullet indices
  const [chamberCount, setChamberCount] = useState(6);
  const [bulletCount, setBulletCount] = useState(1);
  const [shotsFiredThisRound, setShotsFiredThisRound] = useState(0);
  const [bulletsFiredThisRound, setBulletsFiredThisRound] = useState(0);
  const [roundTransition, setRoundTransition] = useState(false);
  
  const [currentChamber, setCurrentChamber] = useState(0); // 0-N
  const [spentChambers, setSpentChambers] = useState([]); // clicked indices
  const [isSpinning, setIsSpinning] = useState(false);
  const [bulletFired, setBulletFired] = useState(false);

  // New specific metric trackers requested by user
  const [highestRiskFaced, setHighestRiskFaced] = useState(0);
  const [lowRiskCorrect, setLowRiskCorrect] = useState(0);
  const [lowRiskTotal, setLowRiskTotal] = useState(0);
  const [highRiskCorrect, setHighRiskCorrect] = useState(0);
  const [highRiskTotal, setHighRiskTotal] = useState(0);

  function getRoundConfig(round) {
    const chambers = 6;
    let bullets = Math.round((6 / totalRounds) * round);
    bullets = Math.max(1, Math.min(6, bullets));
    return { chambers, bullets };
  }

  // Active Gameplay Phase
  const [gameState, setGameState] = useState('answering'); // 'answering', 'shooting_choice', 'outcome_overlay'
  const [turn, setTurn] = useState('player'); // 'player' (user turn), 'bot' (bot shooting player)
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerStatus, setAnswerStatus] = useState(null); // 'correct', 'incorrect'
  const [shootTarget, setShootTarget] = useState(null); // 'self', 'bot'
  const [overlayType, setOverlayType] = useState(null); // 'bang', 'click'
  
  // Bot Messaging / Action Simulation
  const botName = difficulty === 'Easy' ? 'CADET_7' : difficulty === 'Medium' ? 'WARDEN' : 'CIPHER';
  const [botMessage, setBotMessage] = useState("Load your gun, Candidate. Class is starting.");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameStartError, setGameStartError] = useState(null);
  const [isShotFired, setIsShotFired] = useState(false);
  
  const botThinkingTimerRef = useRef(null);
  const autoAdvanceTimerRef = useRef(null);
  const incorrectDelayTimerRef = useRef(null);
  const previousScreenRef = useRef(screen);
  const questionPoolRef = useRef([]);
  const poolIndexRef = useRef(0);
  const questionStartTimeRef = useRef(Date.now());

  useEffect(() => {
    if (previousScreenRef.current === screen) return undefined;

    setIsGlitching(true);
    previousScreenRef.current = screen;
    const glitchTimer = setTimeout(() => setIsGlitching(false), 320);

    return () => clearTimeout(glitchTimer);
  }, [screen]);

  const clearPendingTimers = () => {
    console.log("[SHOOT] Clearing all pending timers.");
    if (botThinkingTimerRef.current) {
      clearTimeout(botThinkingTimerRef.current);
      botThinkingTimerRef.current = null;
    }
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (incorrectDelayTimerRef.current) {
      clearTimeout(incorrectDelayTimerRef.current);
      incorrectDelayTimerRef.current = null;
    }
  };

  // Session Statistics Tracker
  const [stats, setStats] = useState({
    correctAnswers: 0,
    totalQuestionsAnswered: 0,
    shotsSurvived: 0,
    maxProbabilitySurvived: 0,
    roundsSurvived: 0,
    roundByRound: [],
    currentRoundData: { round: 1, correct: 0, total: 0, maxRisk: 0 },
    totalResponseTimeMs: 0
  });



  const handleToggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('active_recall_sound', next ? 'on' : 'off');
      return next;
    });
  };

  const handleClearLeaderboard = () => {
    localStorage.removeItem(SCORE_HISTORY_KEY);
    setLeaderboardScores([]);
  };

  const playShotSound = (type) => {
    if (!soundEnabled) return;

    try {
      let audioFile = '';
      
      if (type === 'bang') audioFile = '/bang.mp3';
      else if (type === 'click') audioFile = '/click.mp3';
      else if (type === 'ding') audioFile = '/ding.mp3';

      if (audioFile) {
        const audio = new Audio(audioFile);
        audio.volume = 1.0;
        audio.play().catch(e => console.warn('Audio play prevented by browser:', e));
      }
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  };

  // Calculates probability
  const getProbability = () => {
    const remainingChambers = chamberCount - shotsFiredThisRound;
    if (remainingChambers <= 0) return 0;
    
    const remainingBullets = bulletChambers.filter(b => !spentChambers.includes(b)).length;
    return (remainingBullets / remainingChambers) * 100;
  };

  // Deal Cards helper for a Round
  const dealRoundCards = (allQuestions, round) => {
    const config = getRoundConfig(round);
    const cardsPerSide = Math.max(2, Math.min(3, Math.ceil(config.bullets / 2) + 1));
    const totalToDeal = cardsPerSide * 2;

    const pool = questionPoolRef.current;
    let startIdx = poolIndexRef.current;
    if (startIdx + totalToDeal > pool.length) {
      // Reshuffle pool
      const reshuffled = [...pool];
      for (let i = reshuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
      }
      questionPoolRef.current = reshuffled;
      poolIndexRef.current = 0;
      startIdx = 0;
    }

    const dealtSlice = questionPoolRef.current.slice(startIdx, startIdx + totalToDeal);
    poolIndexRef.current = startIdx + totalToDeal;

    const pCards = dealtSlice.slice(0, cardsPerSide).map((q, i) => ({
      id: `p_${round}_${i}`,
      question: q,
      discarded: false
    }));

    const bCards = dealtSlice.slice(cardsPerSide, totalToDeal).map((q, i) => ({
      id: `b_${round}_${i}`,
      question: q,
      discarded: false
    }));

    setPlayerCards(pCards);
    setBotCards(bCards);
    setActiveCardIndex(0);
    setActiveCardTurn('player');
    setCardState('inspect');
    setIsAnswerCorrect(null);
    setGunOwner('player');
    soundEngine.playCardDeal();
    return { pCards, bCards };
  };

  // Initialize Game Session
  const handleStartGame = async () => {
    setIsSpinning(true);
    setIsGenerating(true);
    
    // Set initial round config
    const config = getRoundConfig(1);
    setChamberCount(config.chambers);
    setBulletCount(config.bullets);
    setShotsFiredThisRound(0);
    setBulletsFiredThisRound(0);

    const generateBullets = (bCount, cCount) => {
      const bArr = [];
      while (bArr.length < bCount) {
        const r = Math.floor(Math.random() * cCount);
        if (!bArr.includes(r)) bArr.push(r);
      }
      return bArr;
    };
    
    setBulletChambers(generateBullets(config.bullets, config.chambers));
    setCurrentChamber(0);
    setSpentChambers([]);
    setBulletFired(false);
    
    // Reset Counters
    setStats({
      correctAnswers: 0,
      totalQuestionsAnswered: 0,
      shotsSurvived: 0,
      maxProbabilitySurvived: 0,
      roundsSurvived: 0,
      roundByRound: [],
      currentRoundData: { round: 1, correct: 0, total: 0, maxRisk: 0 },
      totalResponseTimeMs: 0
    });
    setHighestRiskFaced(0);
    setLowRiskCorrect(0);
    setLowRiskTotal(0);
    setHighRiskCorrect(0);
    setHighRiskTotal(0);
    
    setPlayerScore(0);
    setBotScore(0);
    setRoundNumber(1);
    setCurrentQuestionIndex(0);
    setTurn('player');
    setGameState('answering');
    setSelectedAnswer(null);
    setAnswerStatus(null);
    setShootTarget(null);
    setOverlayType(null);
    setBotMessage(getRandomElement(BOT_TAUNTS[botName].idle));
    setGameStartError(null);
    setIsShotFired(false);

    try {
      const trimmedText = pdfParsedText?.trim() || "";
      let gameQsPool = [];

      if (trimmedText === 'TEST_DECK' || pdfFileName.includes('Test Question Deck') || trimmedText.length === 0) {
        console.log(`[START GAME] Using Fixed Built-in Test Question Deck (${FIXED_TEST_QUESTIONS.length} MCQs)`);
        gameQsPool = [...FIXED_TEST_QUESTIONS];
      } else if (trimmedText.length < 100) {
        // If text is short, prompt or fallback gracefully to fixed questions
        console.log(`[START GAME] Text is short (<100 chars), using Fixed Test Question Deck.`);
        gameQsPool = [...FIXED_TEST_QUESTIONS];
      } else {
        console.log(`[START GAME] Launching question generation from PDF/Notes content...`);
        gameQsPool = await generateQuestions(trimmedText);
      }
      
      if (!gameQsPool || gameQsPool.length === 0) {
        gameQsPool = [...FIXED_TEST_QUESTIONS];
      }

      const shuffleQuestions = (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };

      const shuffledPool = shuffleQuestions(gameQsPool);
      questionPoolRef.current = shuffledPool;
      poolIndexRef.current = 0;
      setQuestions(shuffledPool);

      // Deal physical 3D cards
      dealRoundCards(shuffledPool, 1);

      let initialGreeting = getRandomElement(BOT_TAUNTS[botName].idle);
      setBotMessage(initialGreeting);

      setIsSpinning(false);
      setIsGenerating(false);
      questionStartTimeRef.current = Date.now();
      setScreen('game');
    } catch (error) {
      console.error("[START GAME] Question Generation Failed:", error);
      // Seamless fallback to test questions if API fails
      console.log(`[START GAME] Falling back to Fixed Test Questions after error: ${error.message}`);
      const shuffledFallback = [...FIXED_TEST_QUESTIONS].sort(() => Math.random() - 0.5);
      questionPoolRef.current = shuffledFallback;
      poolIndexRef.current = 0;
      setQuestions(shuffledFallback);
      dealRoundCards(shuffledFallback, 1);
      setIsSpinning(false);
      setIsGenerating(false);
      questionStartTimeRef.current = Date.now();
      setScreen('game');
    }
  };

  const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Card Selection Handler (Player clicks card on table)
  const handleSelectCard = (cardIdx) => {
    if (turn !== 'player' || gameState !== 'answering') return;
    setActiveCardIndex(cardIdx);
    setActiveCardTurn('player');
    setCardState('inspect');
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
  };

  // Bot Auto-Shoot Hook (fires when turn becomes 'bot' during outcome_overlay)
  useEffect(() => {
    if (screen !== 'game' || turn !== 'bot' || gameState !== 'outcome_overlay') return;

    // Simulate BOT cocking gun and aiming with a delay
    setIsBotThinking(true);
    const thinkDelay = 1800 + Math.random() * 1000;

    botThinkingTimerRef.current = setTimeout(() => {
      setIsBotThinking(false);
      // Bot pulls trigger on Player
      shoot('bot', 'player');
    }, thinkDelay);

    return () => {
      if (botThinkingTimerRef.current) clearTimeout(botThinkingTimerRef.current);
    };
  }, [screen, turn, gameState]);

  // Auto-Advance Game Hook after a Shot Outcome resolves
  useEffect(() => {
    if (screen !== 'game' || gameState !== 'outcome_overlay' || overlayType === null) return;

    const delay = overlayType === 'bang' ? 2400 : 1800;
    autoAdvanceTimerRef.current = setTimeout(() => {
      handleNextCardTurn();
    }, delay);

    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [screen, gameState, overlayType, currentChamber, bulletFired, shootTarget, turn, playerScore, botScore]);

  // Player Answer Event Handler with 3D Flip & Blood Reveal & Gun Morph
  // Player Answer Event Handler with Mechanical Dropdown Chalkboard & Shootout Transition
  const handlePlayerAnswer = (optionKey) => {
    if (gameState !== 'answering' || turn !== 'player') return;

    const currentCard = playerCards[activeCardIndex];
    const currentQ = currentCard?.question || questions[currentQuestionIndex];
    if (!currentQ) return;

    setSelectedAnswer(optionKey);
    const isCorrect = optionKey === currentQ.correctAnswer;
    setIsAnswerCorrect(isCorrect);
    
    const timeTaken = Date.now() - questionStartTimeRef.current;
    
    setStats(prev => ({
      ...prev,
      totalQuestionsAnswered: prev.totalQuestionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      totalResponseTimeMs: prev.totalResponseTimeMs + timeTaken,
      currentRoundData: {
        ...prev.currentRoundData,
        correct: prev.currentRoundData.correct + (isCorrect ? 1 : 0),
        total: prev.currentRoundData.total + 1
      }
    }));

    const currentRisk = getProbability();
    if (currentRisk < 50) {
      setLowRiskTotal(prev => prev + 1);
      if (isCorrect) setLowRiskCorrect(prev => prev + 1);
    } else {
      setHighRiskTotal(prev => prev + 1);
      if (isCorrect) setHighRiskCorrect(prev => prev + 1);
    }

    // Step 1: Hold verdict visible on blackboard for 950ms
    setTimeout(() => {
      // Step 2: Retract screen upward into ceiling
      setGameState('table_idle');

      // Step 3: Present Revolver on table for shootout
      setTimeout(() => {
        setGunOwner(isCorrect ? 'player' : 'bot');

        if (isCorrect) {
          setPlayerScore(prev => prev + 100);
          setAnswerStatus('correct');
          setGameState('shooting_choice');
          playShotSound('ding');
        } else {
          setBotScore(prev => prev + 100);
          setAnswerStatus('incorrect');
          setTurn('bot');
          setBotMessage(getRandomElement(BOT_TAUNTS[botName].wrongAnswer));
          setShootTarget('player');
          setGameState('outcome_overlay');
        }
      }, 750);
    }, 950);
  };

  // Bot Turn Mechanical Dropdown Interrogation Execution
  const executeBotCardTurn = (targetBotCardIdx) => {
    setTurn('bot');
    setActiveCardTurn('bot');
    setActiveCardIndex(targetBotCardIdx);
    setGameState('bot_turn');
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setBotMessage(getRandomElement(BOT_TAUNTS[botName].idle));

    // Bot calculates verdict on the lowered blackboard
    setTimeout(() => {
      // Calculate Bot accuracy based on difficulty
      const botAcc = difficulty === 'Easy' ? 0.50 : difficulty === 'Medium' ? 0.72 : 0.88;
      const botIsCorrect = Math.random() < botAcc;
      setIsAnswerCorrect(botIsCorrect);

      // Display verdict on blackboard for 950ms
      setTimeout(() => {
        // Retract screen into ceiling
        setGameState('table_idle');

        setTimeout(() => {
          setGunOwner(botIsCorrect ? 'bot' : 'player');

          if (botIsCorrect) {
            setBotScore(prev => prev + 100);
            setBotMessage(getRandomElement(BOT_TAUNTS[botName].idle));
            setShootTarget('player');
            setGameState('outcome_overlay');
          } else {
            setPlayerScore(prev => prev + 100);
            setTurn('player');
            setBotMessage("An anomalous variable in my calculations... the trigger is yours.");
            setGameState('shooting_choice');
            playShotSound('ding');
          }
        }, 750);
      }, 950);
    }, 1500);
  };

  // Firing Mechanism Trigger Pull
  const shoot = (shooter, target) => {
    if (isShotFired) return;

    setIsShotFired(true);
    clearPendingTimers();

    const config = getRoundConfig(roundNumber);
    const totalShotsThisRound = shotsFiredThisRound + 1;
    setShotsFiredThisRound(totalShotsThisRound);

    const currentRisk = getProbability();
    if (currentRisk > highestRiskFaced) {
      setHighestRiskFaced(currentRisk);
    }

    setStats(prev => ({
      ...prev,
      currentRoundData: {
        ...prev.currentRoundData,
        maxRisk: Math.max(prev.currentRoundData.maxRisk || 0, currentRisk)
      }
    }));

    setShootTarget(target);
    setGameState('outcome_overlay');

    const isBang = bulletChambers.includes(currentChamber);
    const nextChamber = (currentChamber + 1) % config.chambers;

    setSpentChambers(prev => [...prev, currentChamber]);

    if (isBang) {
      setBulletFired(true);
      setBulletsFiredThisRound(prev => prev + 1);
      setOverlayType('bang');
      playShotSound('bang');

      if (shooter === 'player') {
        if (target === 'self') {
          setPlayerScore(l => l - 500);
        } else {
          setBotScore(l => l - 500);
          setPlayerScore(l => l + 300);
        }
      } else {
        setPlayerScore(l => l - 500);
        setBotScore(l => l + 300);
        setBotMessage(getRandomElement(BOT_TAUNTS[botName].shootPlayerBang));
      }
    } else {
      setOverlayType('click');
      playShotSound('click');

      if (shooter === 'player' && target === 'self') {
        setPlayerScore(l => l + 200);
        setStats(prev => ({
          ...prev,
          shotsSurvived: prev.shotsSurvived + 1,
          maxProbabilitySurvived: Math.max(prev.maxProbabilitySurvived, currentRisk)
        }));
      } else if (shooter === 'player' && target === 'bot') {
        setBotScore(l => l + 200);
      }

      if (shooter === 'bot') {
        setPlayerScore(l => l + 200);
        setBotMessage(getRandomElement(BOT_TAUNTS[botName].shootPlayerBlank));
      }
    }

    setCurrentChamber(nextChamber);
  };

  // Player Trigger Handler (Correct Answer Actions)
  const handlePlayerShoot = (target) => {
    if (gameState !== 'shooting_choice') return;
    shoot('player', target);
  };

  // Next Turn / Next Card / Round transitions
  const handleNextCardTurn = () => {
    // 1. Mark the active card as discarded
    if (activeCardTurn === 'player') {
      setPlayerCards(prev => prev.map((c, i) => i === activeCardIndex ? { ...c, discarded: true } : c));
    } else {
      setBotCards(prev => prev.map((c, i) => i === activeCardIndex ? { ...c, discarded: true } : c));
    }

    setOverlayType(null);
    setShootTarget(null);
    setSelectedAnswer(null);
    setAnswerStatus(null);
    setIsShotFired(false);

    // Check if remaining cards exist in the current round
    const remainingPlayerCards = playerCards.filter((c, i) => activeCardTurn === 'player' ? i !== activeCardIndex && !c.discarded : !c.discarded);
    const remainingBotCards = botCards.filter((c, i) => activeCardTurn === 'bot' ? i !== activeCardIndex && !c.discarded : !c.discarded);

    if (remainingPlayerCards.length === 0 && remainingBotCards.length === 0) {
      // All cards in round expended -> Advance Round
      const nextRound = roundNumber + 1;
      if (nextRound > totalRounds) {
        endSession();
        return;
      }

      setRoundTransition(true);
      setRoundNumber(nextRound);
      const nextConfig = getRoundConfig(nextRound);
      setChamberCount(nextConfig.chambers);
      setBulletCount(nextConfig.bullets);
      setShotsFiredThisRound(0);
      setBulletsFiredThisRound(0);

      const generateBullets = (bCount, cCount) => {
        const bArr = [];
        while (bArr.length < bCount) {
          const r = Math.floor(Math.random() * cCount);
          if (!bArr.includes(r)) bArr.push(r);
        }
        return bArr;
      };
      setBulletChambers(generateBullets(nextConfig.bullets, nextConfig.chambers));
      setSpentChambers([]);
      setCurrentChamber(0);
      setBulletFired(false);

      dealRoundCards(questions, nextRound);

      setTimeout(() => {
        setRoundTransition(false);
        setTurn('player');
        setGameState('answering');
        setCardState('inspect');
      }, 2500);
    } else {
      // Alternate turns between Player and Bot
      if (activeCardTurn === 'player') {
        // Player just went -> Now Bot's turn
        const nextBotCardIdx = botCards.findIndex((c, i) => activeCardTurn === 'bot' ? i !== activeCardIndex && !c.discarded : !c.discarded);
        if (nextBotCardIdx !== -1) {
          executeBotCardTurn(nextBotCardIdx);
        } else {
          // If no bot cards left, go to next player card
          const nextPIdx = playerCards.findIndex((c, i) => i !== activeCardIndex && !c.discarded);
          if (nextPIdx !== -1) {
            setActiveCardIndex(nextPIdx);
            setActiveCardTurn('player');
            setTurn('player');
            setGameState('answering');
            setCardState('inspect');
          }
        }
      } else {
        // Bot just went -> Now Player's turn
        const nextPIdx = playerCards.findIndex((c, i) => !c.discarded);
        if (nextPIdx !== -1) {
          setActiveCardIndex(nextPIdx);
          setActiveCardTurn('player');
          setTurn('player');
          setGameState('answering');
          setCardState('inspect');
        } else {
          // If no player cards left, go to next bot card
          const nextBotCardIdx = botCards.findIndex((c, i) => i !== activeCardIndex && !c.discarded);
          if (nextBotCardIdx !== -1) {
            executeBotCardTurn(nextBotCardIdx);
          }
        }
      }
    }
  };

  // Log Score & Terminate Session
  const endSession = () => {
    // Calculate final metrics
    const finalRoundData = { 
      ...stats.currentRoundData, 
      accuracy: stats.currentRoundData.total > 0 ? (stats.currentRoundData.correct / stats.currentRoundData.total) * 100 : 0 
    };
    // Include current round only if questions were answered in it, otherwise it's just an empty round state.
    const fullRoundByRound = stats.currentRoundData.total > 0 
      ? [...stats.roundByRound, finalRoundData]
      : stats.roundByRound;

    // Calculate trend
    let trend = 'flat';
    if (fullRoundByRound.length >= 2) {
      const halfIndex = Math.ceil(fullRoundByRound.length / 2);
      const firstHalfAcc = fullRoundByRound.slice(0, halfIndex).reduce((sum, r) => sum + r.accuracy, 0) / halfIndex;
      const secondHalfAcc = fullRoundByRound.slice(halfIndex).reduce((sum, r) => sum + r.accuracy, 0) / Math.floor(fullRoundByRound.length / 2);
      if (secondHalfAcc > firstHalfAcc + 5) trend = 'improving';
      else if (secondHalfAcc < firstHalfAcc - 5) trend = 'declining';
    }

    // Calculate Stress Score based on the exact tracked answers
    const lowRiskAcc = lowRiskTotal > 0 ? (lowRiskCorrect / lowRiskTotal) * 100 : 0;
    const highRiskAcc = highRiskTotal > 0 ? (highRiskCorrect / highRiskTotal) * 100 : 0;
    
    let stressScore = 50;
    if (highRiskTotal > 0) {
      if (lowRiskTotal > 0) {
        stressScore = 50 + ((highRiskAcc / lowRiskAcc) * 50);
      } else {
        stressScore = highRiskAcc;
      }
    } else {
      stressScore = lowRiskAcc;
    }
    stressScore = Math.min(100, Math.max(0, Math.round(stressScore)));

    const finalResult = playerScore > botScore ? 'WON' : 'DEFEATED';
    const accuracy = stats.totalQuestionsAnswered > 0
      ? Math.round((stats.correctAnswers / stats.totalQuestionsAnswered) * 100)
      : 0;
    const avgResponseTimeMs = stats.totalQuestionsAnswered > 0 ? stats.totalResponseTimeMs / stats.totalQuestionsAnswered : 0;

    // Ensure rounds completed is accurate
    const completedRounds = Math.max(0, roundNumber - 1);

    const enhancedStats = {
      ...stats,
      highestRiskFaced,
      roundsSurvived: completedRounds,
      roundByRound: fullRoundByRound,
      trend,
      stressScore,
      lowRiskAcc,
      highRiskAcc,
      avgResponseTimeMs,
      accuracy
    };

    const scoreObject = {
      id: Date.now().toString(),
      name: playerName.trim() || 'REVISER',
      score: playerScore,
      botScore: botScore,
      roundsSurvived: stats.roundsSurvived,
      correctAnswers: stats.correctAnswers,
      totalQuestionsAnswered: stats.totalQuestionsAnswered,
      accuracy,
      shotsSurvived: stats.shotsSurvived,
      maxProbabilitySurvived: stats.maxProbabilitySurvived,
      difficulty: difficulty,
      botName: botName,
      result: finalResult,
      date: new Date().toISOString(),
      enhancedStats
    };

    const updatedLeaderboard = [scoreObject, ...leaderboardScores];
    setLeaderboardScores(updatedLeaderboard);
    localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(updatedLeaderboard));

    setStats(enhancedStats);
    // Explicitly update highestRiskFaced before sending to result screen, just in case
    setScreen('result');
  };

  const handleRestart = () => {
    setScreen('home');
    clearPdf();
  };

  const clearPdf = () => {
    setPdfParsedText('');
    setPdfFileName('');
  };

  return (
    <div className="w-screen min-h-screen m-0 p-0 relative flex flex-col justify-between overflow-x-hidden bg-[#0a0805] text-[#f8fafc]">
      <AnimatePresence>
        {isGlitching && (
          <motion.div
            key="screen-glitch-transition"
            className="glitch-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.95, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, times: [0, 0.18, 0.72, 1] }}
          >
            <span />
            <span />
            <span />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky top premium navigation bar */}
      {screen !== 'game' && (
        <header className="absolute top-0 z-30 w-full pt-4">
        <div className="max-w-[1400px] mx-auto px-6 py-2 flex items-center justify-between w-full">
          {/* Logo Left */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => screen !== 'game' && setScreen('home')}
          >
            <span className="text-[#f59e0b] font-bold text-[16px] tracking-[3px]">GAR</span>
          </div>

          {/* Navigation Links Center */}
          <nav className="flex items-center gap-4 bg-transparent p-0.5">
            {[
              ['home', 'Dashboard'],
              ['history', 'History']
            ].map(([key, label]) => {
              const isActive = screen === key || (key === 'home' && (screen === 'game' || screen === 'result'));
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'history') setScreen('history');
                    if (key === 'home' && screen !== 'game') setScreen('home');
                  }}
                  disabled={screen === 'game'}
                  className={`py-1.5 text-[13px] font-bold transition-all border-b-2 ${
                    isActive
                      ? 'border-[#f59e0b] text-[#ffffff]'
                      : 'border-transparent text-[#a8a29e] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons Right */}
          <div className="flex items-center gap-3">
            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                soundEnabled
                  ? 'border-[#f59e0b] text-[#f59e0b] bg-transparent hover:bg-[rgba(245,158,11,0.1)]'
                  : 'border-white/10 text-[#a8a29e] bg-transparent hover:text-white'
              }`}
              title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>


          </div>
        </div>
      </header>
      )}

      {/* Screen Router */}
      <div className="flex-grow z-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
            transition={{ duration: 0.34, ease: [0.2, 0.9, 0.2, 1] }}
          >
            {screen === 'home' && (
              <HomeScreen
                playerName={playerName}
                setPlayerName={setPlayerName}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                questionCount={questionCount}
                setQuestionCount={setQuestionCount}
                totalRounds={totalRounds}
                setTotalRounds={setTotalRounds}
                onStart={handleStartGame}

                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                onOpenHistory={() => setScreen('history')}
                pdfParsedText={pdfParsedText}
                setPdfParsedText={setPdfParsedText}
                pdfFileName={pdfFileName}
                setPdfFileName={setPdfFileName}
                leaderboardScores={leaderboardScores}
                onClearLeaderboard={handleClearLeaderboard}
                onParsePdf={extractTextFromPdf}
                isGenerating={isGenerating}
                gameStartError={gameStartError}
                setGameStartError={setGameStartError}
                selectedCharacter={selectedCharacter}
                setSelectedCharacter={setSelectedCharacter}
              />
            )}

            {screen === 'game' && (
              <GameScreen
                playerName={playerName}
                difficulty={difficulty}
                question={
                  (turn === 'player'
                    ? playerCards[activeCardIndex]?.question
                    : botCards[activeCardIndex]?.question) || questions[currentQuestionIndex]
                }
                questionIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                roundNumber={roundNumber}
                chamberCount={chamberCount}
                bulletCount={bulletCount}
                bulletsFiredThisRound={bulletsFiredThisRound}
                roundTransition={roundTransition}
                playerScore={playerScore}
                botScore={botScore}
                currentChamber={currentChamber}
                spentChambers={spentChambers}
                bulletChambers={bulletChambers}
                bulletFired={bulletFired}
                probability={getProbability()}
                turn={turn}
                isSpinning={isSpinning}
                botName={botName}
                botMessage={botMessage}
                isBotThinking={isBotThinking}
                onAnswer={handlePlayerAnswer}
                onShoot={handlePlayerShoot}
                gameState={gameState}
                selectedAnswer={selectedAnswer}
                shootTarget={shootTarget}
                overlayType={overlayType}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                isAnswerCorrect={isAnswerCorrect}
                gunOwner={gunOwner}
                selectedCharacter={selectedCharacter}
              />
            )}

            {screen === 'result' && (
              <ResultScreen
                playerName={playerName}
                difficulty={difficulty}
                playerScore={playerScore}
                botScore={botScore}
                botName={botName}
                roundNumber={roundNumber}
                stats={stats}
                leaderboardScores={leaderboardScores}
                onClearLeaderboard={handleClearLeaderboard}
                onRestart={handleRestart}
                onOpenHistory={() => setScreen('history')}
              />
            )}

            {screen === 'history' && (
              <HistoryScreen
                scores={leaderboardScores}
                onBack={() => setScreen('home')}
                onClear={handleClearLeaderboard}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>



      <footer className="w-full text-center py-4 text-[9px] text-slate-700 font-mono tracking-widest z-10 select-none uppercase">
        // SYSTEM TERMINAL SECURE // GAMIFIED ACTIVE RECALL PROTOCOL ACTIVE
      </footer>
    </div>
  );
}
