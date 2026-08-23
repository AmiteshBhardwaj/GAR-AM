import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Play, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';
import bgImage from '../assets/bg-home.png';

const leftColumnVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" } 
  }
};

const rightColumnVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut", delay: 0.15 } 
  }
};

export default function HomeScreen({
  playerName,
  setPlayerName,
  difficulty,
  setDifficulty,
  questionCount,
  setQuestionCount,
  totalRounds,
  setTotalRounds,
  onStart,

  pdfParsedText,
  setPdfParsedText,
  pdfFileName,
  setPdfFileName,
  leaderboardScores,
  onClearLeaderboard,
  onParsePdf,
  isGenerating,
  gameStartError,
  setGameStartError,
  selectedCharacter = 'spartan',
  setSelectedCharacter
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseError, setParseError] = useState(null);
  const [sourceType, setSourceType] = useState('pdf');

  useEffect(() => {
    if (gameStartError && setGameStartError) {
      setGameStartError(null);
    }
  }, [gameStartError, pdfParsedText, sourceType, difficulty, questionCount, playerName, setGameStartError]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        await processPdfFile(file);
      } else {
        setParseError("Format error: Only PDFs are supported.");
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processPdfFile(file);
    }
  };

  const processPdfFile = async (file) => {
    setIsParsing(true);
    setParseProgress(0);
    setParseError(null);
    setPdfFileName(file.name);
    
    try {
      const parsedText = await onParsePdf(file, (progress) => {
        setParseProgress(progress);
      });
      setPdfParsedText(parsedText);
      setIsParsing(false);
    } catch (err) {
      console.error(err);
      setParseError(err.message || "Failed to extract text from PDF.");
      setIsParsing(false);
      setPdfParsedText('');
      setPdfFileName('');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const clearPdf = () => {
    setPdfParsedText('');
    setPdfFileName('');
    setParseError(null);
  };

  return (
    <div 
      className="w-[100vw] min-h-[100vh] overflow-x-hidden font-sans text-white flex flex-col"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark Overlay Gradient */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none" 
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.92) 100%)'
        }}
      />

      {/* Main Content Grid */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-8 flex-1 flex flex-col">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[52%_48%] gap-12 pt-[80px]">
          
          {/* LEFT COLUMN */}
          <motion.div 
            className="w-full flex flex-col"
            variants={leftColumnVariants}
            initial="hidden"
            animate="show"
          >
            {/* Label Above Title */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              <span className="text-[11px] text-[#f59e0b] font-mono tracking-[3px]">
                // ACTIVE RECALL PROTOCOL //
              </span>
            </div>

            {/* Hero Text */}
            <div className="flex flex-col">
              <h1 className="text-[72px] text-white font-[900] leading-[1]">
                GAMIFIED
              </h1>
              <h1 className="text-[72px] text-[#f59e0b] font-[900] leading-[1]">
                ACTIVE RECALL
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-[14px] text-[#a8a29e] mt-[12px]">
              Upload your notes. Answer the question. Pull the trigger.
            </p>

            {/* Divider Line */}
            <div className="w-[40px] h-[2px] bg-[#f59e0b] my-[20px]" />

            {/* Form Panel */}
            <div 
              className="p-[20px] rounded-[12px] flex flex-col gap-4"
              style={{
                backgroundColor: 'rgba(0,0,0,0.65)',
                border: '1px solid rgba(245,158,11,0.2)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              
              {/* Candidate Tag */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-[2px] text-[#a8a29e]">
                  Agent Callsign
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase().slice(0, 16))}
                  placeholder="Enter alias..."
                  maxLength={16}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  className="w-full h-[44px] border border-[rgba(245,158,11,0.25)] focus:border-[#f59e0b] focus:outline-none px-3 text-white rounded-[8px] text-[14px] transition-colors"
                />
              </div>

              {/* Source Selection */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-[2px] text-[#a8a29e]">
                    Study Material
                  </label>
                  {pdfFileName && (
                    <button 
                      onClick={clearPdf} 
                      className="text-[10px] text-[#ef4444] hover:text-[#f87171] transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setSourceType('pdf'); clearPdf(); }}
                    className={`flex-1 h-[38px] text-[12px] font-medium rounded-[8px] transition-all cursor-pointer border ${
                      sourceType === 'pdf' 
                        ? 'bg-[rgba(245,158,11,0.15)] border-[#f59e0b] text-[#f59e0b]' 
                        : 'bg-transparent border-[rgba(255,255,255,0.1)] text-[#a8a29e]'
                    }`}
                  >
                    PDF Document
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSourceType('text'); clearPdf(); }}
                    className={`flex-1 h-[38px] text-[12px] font-medium rounded-[8px] transition-all cursor-pointer border ${
                      sourceType === 'text' 
                        ? 'bg-[rgba(245,158,11,0.15)] border-[#f59e0b] text-[#f59e0b]' 
                        : 'bg-transparent border-[rgba(255,255,255,0.1)] text-[#a8a29e]'
                    }`}
                  >
                    Paste Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceType('demo');
                      setPdfParsedText('TEST_DECK');
                      setPdfFileName('Fixed Test Question Deck (12 MCQs)');
                      setParseError(null);
                    }}
                    className={`flex-1 h-[38px] text-[12px] font-medium rounded-[8px] transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                      sourceType === 'demo' 
                        ? 'bg-[rgba(245,158,11,0.2)] border-[#f59e0b] text-[#f59e0b] font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]' 
                        : 'bg-transparent border-[rgba(255,255,255,0.1)] text-[#a8a29e] hover:border-[rgba(245,158,11,0.3)]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                    Test Deck
                  </button>
                </div>

                {sourceType === 'demo' ? (
                  <div 
                    className="border border-[#f59e0b] h-[72px] rounded-[8px] flex items-center justify-between px-4"
                    style={{ backgroundColor: 'rgba(245,158,11,0.08)' }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Sparkles className="w-5 h-5 text-[#f59e0b]" />
                      <div className="text-left truncate">
                        <p className="text-[13px] text-white font-medium truncate max-w-[280px]">
                          Standard CS Test Question Deck
                        </p>
                        <p className="text-[11px] text-[#f59e0b] flex items-center gap-1 mt-0.5">
                          <CheckCircle className="w-3.5 h-3.5" /> 12 Fixed Questions Mounted (Instant Play)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : sourceType === 'pdf' ? (
                  !pdfFileName ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        onClick={(e) => e.stopPropagation()}
                        className="hidden"
                      />
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                        className={`h-[72px] border border-dashed rounded-[8px] text-center transition-all cursor-pointer flex items-center justify-center gap-3 ${
                          dragActive 
                            ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.1)]' 
                            : 'border-[rgba(245,158,11,0.3)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(245,158,11,0.05)]'
                        }`}
                      >
                        <Upload className="w-5 h-5 text-[#f59e0b]" />
                        <span className="text-[13px] text-[#a8a29e]">
                          Click or drag to upload PDF
                        </span>
                      </div>
                    </>
                  ) : (
                    <div 
                      className="border border-[#f59e0b] h-[72px] rounded-[8px] flex items-center justify-between px-4"
                      style={{ backgroundColor: 'rgba(245,158,11,0.05)' }}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-5 h-5 text-[#f59e0b]" />
                        <div className="text-left truncate">
                          <p className="text-[13px] text-white truncate max-w-[280px]">
                            {pdfFileName}
                          </p>
                          <p className="text-[11px] text-[#f59e0b] flex items-center gap-1 mt-0.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Mounted
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-1">
                    <textarea
                      value={pdfParsedText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPdfParsedText(val);
                        setPdfFileName(val.trim().length > 0 ? 'Pasted Notes' : '');
                      }}
                      placeholder="Paste your study notes here..."
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                      className="w-full h-[72px] border border-[rgba(245,158,11,0.25)] focus:border-[#f59e0b] focus:outline-none p-3 text-white rounded-[8px] text-[13px] transition-colors resize-none"
                    />
                  </div>
                )}

                {isParsing && (
                  <div className="pt-1">
                    <div className="flex justify-between text-[10px] text-[#a8a29e] mb-1 uppercase tracking-wider">
                      <span>Extracting</span>
                      <span>{parseProgress}%</span>
                    </div>
                    <div className="w-full bg-[rgba(255,255,255,0.1)] rounded-full h-[3px] relative overflow-hidden">
                      <div 
                        className="bg-[#f59e0b] h-full transition-all"
                        style={{ width: `${parseProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {parseError && (
                  <p className="text-[11px] text-[#ef4444] flex items-center gap-1.5 pt-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> {parseError}
                  </p>
                )}
              </div>

              {/* 3D Opponent Avatar Selector */}
              {setSelectedCharacter && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase text-[#57534e] flex items-center justify-between">
                    <span>Opponent Model (3D)</span>
                    <span className="text-[#f59e0b] font-mono text-[9px]">GLB ANIMATED</span>
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'sitting_bot', label: 'SEATED BOT', sub: 'Mixamo Rig' },
                      { id: 'spartan', label: 'SPARTAN', sub: 'Mk V Armor' },
                      { id: 'zombie', label: 'ZOMBIE', sub: 'Undead' },
                      { id: 'cyborg', label: 'CYBORG', sub: 'Warden' }
                    ].map(({ id, label, sub }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedCharacter(id)}
                        className={`flex flex-col items-center justify-center flex-1 h-[42px] rounded-[6px] transition-all cursor-pointer border ${
                          selectedCharacter === id 
                            ? 'bg-[rgba(245,158,11,0.15)] border-[#f59e0b] text-[#f59e0b]' 
                            : 'bg-transparent border-[rgba(255,255,255,0.08)] text-[#57534e] hover:border-[rgba(255,255,255,0.2)]'
                        }`}
                      >
                        <span className={`text-[11px] leading-tight ${selectedCharacter === id ? 'font-bold' : ''}`}>{label}</span>
                        <span className="text-[9px] opacity-70 leading-tight">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty / Timer Mode */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase text-[#57534e]">
                  Difficulty (Time Limit)
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'Easy', label: 'UNLIMITED', sub: 'No rush' },
                    { id: 'Medium', label: '60 SECONDS', sub: 'Standard' },
                    { id: 'Hard', label: '30 SECONDS', sub: 'Hardcore' }
                  ].map(({ id, label, sub }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDifficulty(id)}
                      className={`flex flex-col items-center justify-center flex-1 h-[42px] rounded-[6px] transition-all cursor-pointer border ${
                        difficulty === id 
                          ? 'bg-[rgba(245,158,11,0.15)] border-[#f59e0b] text-[#f59e0b]' 
                          : 'bg-transparent border-[rgba(255,255,255,0.08)] text-[#57534e]'
                      }`}
                    >
                      <span className={`text-[11px] leading-tight ${difficulty === id ? 'font-bold' : ''}`}>{label}</span>
                      <span className="text-[9px] opacity-70 leading-tight">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Total Rounds */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] uppercase text-[#57534e]">
                  Total Rounds
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setTotalRounds(count)}
                      className={`flex flex-col items-center justify-center flex-1 h-[42px] rounded-[6px] transition-all cursor-pointer border ${
                        totalRounds === count 
                          ? 'bg-[rgba(245,158,11,0.15)] border-[#f59e0b] text-[#f59e0b]' 
                          : 'bg-transparent border-[rgba(255,255,255,0.08)] text-[#57534e]'
                      }`}
                    >
                      <span className={`text-[13px] leading-tight ${totalRounds === count ? 'font-bold' : ''}`}>{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={onStart}
                disabled={isParsing || isGenerating}
                className="w-full h-[48px] rounded-[8px] bg-[#f59e0b] text-[#000000] font-[700] text-[13px] tracking-[2px] uppercase flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 hover:bg-[#d97706] hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed mt-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-black border-black/30 rounded-full animate-spin shrink-0" />
                    CALIBRATING...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black shrink-0" />
                    LOAD GUN & START MISSION
                  </>
                )}
              </button>

              {gameStartError && (
                <div className="text-center pt-1">
                  <p className="text-[11px] text-[#ef4444]">
                    {gameStartError}
                  </p>
                </div>
              )}

            </div>
          </motion.div>

          {/* RIGHT COLUMN: Scoreboard (48%) */}
          <motion.div 
            className="w-full"
            variants={rightColumnVariants}
            initial="hidden"
            animate="show"
          >
            <Leaderboard scores={leaderboardScores} onClear={onClearLeaderboard} theme="home" />
          </motion.div>

        </div>

        {/* FOOTER */}
        <div className="w-full text-center py-[16px] mt-auto">
          <p className="text-[#f59e0b] text-[9px] font-mono tracking-[3px]">
            // SYSTEM TERMINAL SECURE // GAMIFIED ACTIVE RECALL PROTOCOL ACTIVE
          </p>
        </div>
      </div>
    </div>
  );
}
