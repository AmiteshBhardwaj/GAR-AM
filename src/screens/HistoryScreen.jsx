import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, CalendarClock, Target, Shield, Skull } from 'lucide-react';
import bgImage from '../assets/bg-home.png';

export default function HistoryScreen({ scores = [], onBack, onClear }) {
  const sortedScores = [...scores].sort((a, b) => new Date(b.date) - new Date(a.date));
  const bestAccuracy = sortedScores.reduce((best, score) => Math.max(best, score.accuracy || 0), 0);
  const bestRounds = sortedScores.reduce((best, score) => Math.max(best, score.roundsSurvived || 0), 0);
  const totalSessions = sortedScores.length;

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div 
      className="w-[100vw] min-h-[100vh] overflow-x-hidden font-sans text-[#ffffff] flex flex-col"
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
      
      <motion.div 
        className="relative z-10 w-full max-w-[1400px] mx-auto px-8 pt-[100px] flex-1 flex flex-col pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-[32px]">
          <div>
            <div className="flex flex-col leading-[1] mb-2">
              <h1 className="text-[72px] text-[#ffffff] font-bold">MISSION</h1>
              <h1 className="text-[72px] text-[#f59e0b] font-bold">HISTORY</h1>
            </div>
            <div className="w-[40px] h-[2px] bg-[#f59e0b]" />
          </div>

          <div className="flex gap-4 mt-6 md:mt-0">
            {scores.length > 0 && (
              <button
                onClick={onClear}
                className="group flex items-center justify-center gap-2 rounded-[8px] bg-transparent border border-[#ef4444] text-[#ef4444] text-[12px] font-bold uppercase px-[16px] py-[10px] transition-all duration-200 cursor-pointer hover:bg-[rgba(239,68,68,0.1)] hover:border-[#f87171]"
              >
                <Trash2 className="w-4 h-4" />
                Wipe History
              </button>
            )}
            <button
              onClick={onBack}
              className="flex items-center justify-center gap-2 rounded-[8px] bg-[#f59e0b] text-[#000000] border-none text-[12px] font-bold uppercase px-[16px] py-[10px] transition-all duration-200 cursor-pointer hover:bg-[#d97706] hover:scale-[1.01]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
          {[
            { label: 'TOTAL SESSIONS', value: totalSessions, icon: CalendarClock },
            { label: 'BEST ACCURACY', value: `${bestAccuracy}%`, icon: Target }
          ].map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="p-[24px] rounded-[12px] flex flex-col justify-between transition-all duration-200"
              style={{
                backgroundColor: 'rgba(0,0,0,0.65)',
                border: '1px solid rgba(245,158,11,0.2)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)';
                e.currentTarget.style.backgroundColor = 'rgba(10,8,5,0.85)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)';
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.65)';
              }}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-[11px] text-[#57534e] uppercase tracking-[2px]">{stat.label}</span>
                <stat.icon className="w-[24px] h-[24px] text-[#f59e0b]" />
              </div>
              <div className="mt-4 text-[56px] text-[#ffffff] font-[900] leading-none">
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Missions Table */}
        <div 
          className="mt-[32px] p-[24px] rounded-[12px] overflow-hidden"
          style={{
            backgroundColor: 'rgba(0,0,0,0.65)',
            border: '1px solid rgba(245,158,11,0.2)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          {sortedScores.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Skull className="w-[80px] h-[80px] text-[#f59e0b] opacity-20 mb-4" />
              <p className="text-[14px] text-[#57534e] italic mb-1">No missions logged yet.</p>
              <p className="text-[14px] text-[#57534e] italic">Load your first protocol to begin.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr 
                      className="text-[#f59e0b] text-[10px] uppercase tracking-[2px]"
                      style={{
                        backgroundColor: 'rgba(245,158,11,0.08)',
                        borderBottom: '1px solid rgba(245,158,11,0.15)'
                      }}
                    >
                      <th className="p-[16px_12px] font-normal">DATE / TIME</th>
                      <th className="p-[16px_12px] font-normal">STUDENT ALIAS</th>
                      <th className="p-[16px_12px] font-normal">ACCURACY</th>
                      <th className="p-[16px_12px] font-normal">CORRECT SELECTIONS</th>
                      <th className="p-[16px_12px] font-normal">MAX RISK SURVIVED</th>
                      <th className="p-[16px_12px] font-normal">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedScores.map((score, idx) => {
                      const accuracyNum = Number(score.accuracy) || 0;
                      const maxRiskNum = Number(score.maxProbabilitySurvived) || 0;
                      return (
                        <motion.tr 
                          key={score.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.04 }}
                          className="h-[48px] transition-colors duration-200 hover:bg-[rgba(245,158,11,0.05)]"
                          style={{
                            borderBottom: idx === sortedScores.length - 1 ? 'none' : '1px solid rgba(245,158,11,0.1)'
                          }}
                        >
                          <td className="p-[12px] text-[#a8a29e] text-[13px]">{formatDate(score.date)}</td>
                          <td className="p-[12px] text-[#ffffff] font-bold text-[13px]">{score.name}</td>
                          <td className={`p-[12px] text-[13px] ${accuracyNum > 70 ? 'text-[#f59e0b]' : 'text-[#ffffff]'}`}>
                            {accuracyNum}%
                          </td>
                          <td className="p-[12px] text-[#ffffff] text-[13px]">
                            {score.correctAnswers ?? 0}/{score.totalQuestionsAnswered ?? 0}
                          </td>
                          <td className={`p-[12px] text-[13px] ${maxRiskNum > 50 ? 'text-[#f59e0b]' : 'text-[#a8a29e]'}`}>
                            {maxRiskNum.toFixed(0)}%
                          </td>
                          <td className={`p-[12px] font-bold text-[13px] ${
                            score.result === 'WON' ? 'text-[#f59e0b]' :
                            score.result === 'SURVIVED' ? 'text-[#22c55e]' :
                            'text-[#ef4444]'
                          }`}>
                            {score.result}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card view */}
              <div className="md:hidden flex flex-col gap-4">
                {sortedScores.map((score, idx) => {
                  const accuracyNum = Number(score.accuracy) || 0;
                  const maxRiskNum = Number(score.maxProbabilitySurvived) || 0;
                  return (
                    <motion.div
                      key={score.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex flex-col p-4 rounded-[8px]"
                      style={{
                        backgroundColor: 'rgba(245,158,11,0.03)',
                        border: '1px solid rgba(245,158,11,0.1)'
                      }}
                    >
                      <div className="flex justify-between items-start mb-3 border-b border-[rgba(245,158,11,0.1)] pb-3">
                        <div className="flex flex-col">
                          <span className="text-[#ffffff] font-bold text-[14px]">{score.name}</span>
                          <span className="text-[#a8a29e] text-[11px]">{formatDate(score.date)}</span>
                        </div>
                        <span className={`font-bold text-[12px] ${
                            score.result === 'WON' ? 'text-[#f59e0b]' :
                            score.result === 'SURVIVED' ? 'text-[#22c55e]' :
                            'text-[#ef4444]'
                          }`}>
                          {score.result}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[12px]">
                        <div className="flex flex-col">
                          <span className="text-[#57534e] uppercase text-[9px] tracking-wider">Accuracy</span>
                          <span className={accuracyNum > 70 ? 'text-[#f59e0b]' : 'text-[#ffffff]'}>{accuracyNum}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#57534e] uppercase text-[9px] tracking-wider">Selections</span>
                          <span className="text-[#ffffff]">{score.correctAnswers ?? 0}/{score.totalQuestionsAnswered ?? 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#57534e] uppercase text-[9px] tracking-wider">Max Risk</span>
                          <span className={maxRiskNum > 50 ? 'text-[#f59e0b]' : 'text-[#a8a29e]'}>{maxRiskNum.toFixed(0)}%</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="w-full text-center py-[16px] mt-auto pt-10">
          <p className="text-[#f59e0b] text-[9px] font-mono tracking-[3px]">
            // SYSTEM TERMINAL SECURE // GAMIFIED ACTIVE RECALL PROTOCOL ACTIVE
          </p>
        </div>
      </motion.div>
    </div>
  );
}
