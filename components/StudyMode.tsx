import React, { useState, useEffect, useRef } from 'react';
import { Deck, DifficultyLevel } from '../types';
import { ArrowLeft, CheckCircle, RefreshCcw, X, RotateCw, Scale, List, Check, AlertTriangle, Clock, Pause, Play, ThumbsUp, ThumbsDown, Signal } from 'lucide-react';

interface StudyModeProps {
  deck: Deck;
  onExit: () => void;
  onMarkStudied: (cardId: string, isCorrect: boolean) => void;
}

// Helper to render bold text
const RenderText: React.FC<{ text: string, className?: string }> = ({ text, className }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold bg-yellow-500/30 text-white px-0.5 rounded">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
};

const DifficultyBadge: React.FC<{ level?: DifficultyLevel }> = ({ level }) => {
    if (!level) return null;
    const styles = {
        easy: "bg-green-100 text-green-700 border-green-200",
        medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
        hard: "bg-red-100 text-red-700 border-red-200"
    };
    const labels = {
        easy: "Fácil",
        medium: "Médio",
        hard: "Difícil"
    };
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${styles[level] || styles.medium}`}>
            <Signal size={10} />
            {labels[level] || "Médio"}
        </span>
    );
};

// Helper to format time MM:SS
const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const StudyMode: React.FC<StudyModeProps> = ({ deck, onExit, onMarkStudied }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizStatus, setQuizStatus] = useState<'neutral' | 'correct' | 'wrong'>('neutral');
  
  // Timer State
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const currentCard = deck.cards[currentIndex];

  useEffect(() => {
    if (!isPaused && !finished) {
        timerRef.current = window.setInterval(() => {
        setTimeElapsed(prev => prev + 1);
        }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, finished]);

  useEffect(() => {
    // Reset state when deck changes or study restarts
    resetCardState();
  }, [deck]);

  const resetCardState = () => {
    setIsFlipped(false);
    setShowOptions(false);
    setSelectedOption(null);
    setQuizStatus('neutral');
  };

  const advanceCard = (isCorrect: boolean) => {
     if (currentCard) {
        onMarkStudied(currentCard.id, isCorrect);
    }

    if (currentIndex < deck.cards.length - 1) {
      resetCardState();
      // Small delay for UX transition
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  // Handle Manual Grading (No options)
  const handleManualGrade = (isCorrect: boolean) => {
    advanceCard(isCorrect);
  };

  // Handle Multiple Choice Grading
  const handleOptionClick = (option: string) => {
    if (quizStatus !== 'neutral') return; // Prevent creating multiple clicks

    setSelectedOption(option);
    
    // Simple normalization for comparison (trim)
    const isCorrect = option.trim() === currentCard.correctAnswer?.trim();
    
    setQuizStatus(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
        // Automatically flip after a short delay if correct, then move to next? 
        // For SRS, we want to show the back briefly, then move on.
        setTimeout(() => {
            setIsFlipped(true);
            // Auto advance after showing correct answer for a moment?
            // Let's let the user read the explanation then click next, 
            // OR auto-advance. Let's provide a "Next" button in the flipped state.
            // Actually, we must register the result NOW.
            onMarkStudied(currentCard.id, true);
        }, 800);
    } else {
        // Just register the wrong attempt
        onMarkStudied(currentCard.id, false);
    }
  };

  const handleNextAfterQuiz = () => {
      // Just moves to next, grading was done at click time
      if (currentIndex < deck.cards.length - 1) {
        resetCardState();
        setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
      } else {
        setFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      resetCardState();
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    resetCardState();
    setFinished(false);
    setTimeElapsed(0); // Reset timer
    setIsPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };

  const togglePause = () => {
      setIsPaused(!isPaused);
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-2xl mx-auto">
        <div className="bg-green-100 text-green-600 p-6 rounded-full mb-6">
            <CheckCircle size={64} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Parabéns!</h2>
        <p className="text-slate-600 mb-2 text-lg">
          Você revisou todas as {deck.cards.length} cartas de <strong>{deck.title}</strong>.
        </p>
        <p className="text-sm text-slate-500 mb-6">
            O algoritmo de repetição espaçada agendou suas próximas revisões.
        </p>
        <div className="flex items-center gap-2 justify-center text-slate-500 mb-8 font-mono bg-slate-100 py-1 px-3 rounded-full w-fit mx-auto">
           <Clock size={16} />
           <span>Tempo total: {formatTime(timeElapsed)}</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onExit}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Voltar ao Menu
          </button>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCcw size={20} />
            Revisar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const hasOptions = currentCard.options && currentCard.options.length > 0;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="text-slate-500 hover:text-slate-800 transition-colors">
          <X size={24} />
        </button>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-sm bg-slate-100 pl-3 pr-1 py-1 rounded-full">
                <Clock size={14} />
                <span className="min-w-[40px] text-center">{formatTime(timeElapsed)}</span>
                <button 
                    onClick={togglePause}
                    className="ml-1 p-1 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
                    title={isPaused ? "Retomar" : "Pausar"}
                >
                    {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                </button>
            </div>
            <div className="text-slate-500 font-medium font-mono">
                {currentIndex + 1} / {deck.cards.length}
            </div>
        </div>
      </div>

      {/* PAUSE OVERLAY */}
      {isPaused && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl animate-in fade-in duration-200">
            <div className="bg-slate-100 p-6 rounded-full mb-6 text-slate-400">
                <Pause size={48} fill="currentColor" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Pausado</h2>
            <p className="text-slate-500 mb-8">Seu tempo de estudo está parado.</p>
            <button 
                onClick={() => setIsPaused(false)}
                className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
            >
                <Play size={20} fill="currentColor" />
                Retomar Estudo
            </button>
        </div>
      )}

      {/* Card Container */}
      <div className="flex-1 flex items-center justify-center mb-8 perspective-1000">
        <div
          className={`relative w-full max-w-3xl h-full max-h-[600px] transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front (Question) */}
          <div 
             className="absolute inset-0 w-full h-full bg-white border border-slate-200 rounded-2xl shadow-xl p-6 md:p-8 flex flex-col backface-hidden overflow-y-auto"
          >
             {/* Quiz Status Banner */}
             {quizStatus !== 'neutral' && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top-2 ${
                    quizStatus === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {quizStatus === 'correct' ? <Check size={18} /> : <AlertTriangle size={18} />}
                    {quizStatus === 'correct' ? 'Resposta Correta!' : 'Resposta Incorreta. Tente novamente.'}
                </div>
             )}

            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pergunta</span>
                    <DifficultyBadge level={currentCard.difficulty} />
                </div>
                
                <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed mb-8">
                  {currentCard.front}
                </p>

                {/* Options Section */}
                {!isFlipped && hasOptions && showOptions && (
                    <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4">
                        {currentCard.options!.map((option, idx) => {
                            let btnClass = "w-full p-3 text-left rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm md:text-base";
                            
                            // Styling based on selection and correctness
                            if (quizStatus !== 'neutral') {
                                if (option === currentCard.correctAnswer) {
                                     btnClass = "w-full p-3 text-left rounded-lg border border-green-300 bg-green-50 text-green-800 font-medium";
                                } else if (option === selectedOption && quizStatus === 'wrong') {
                                     btnClass = "w-full p-3 text-left rounded-lg border border-red-300 bg-red-50 text-red-800";
                                } else {
                                     btnClass += " opacity-60";
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); handleOptionClick(option); }}
                                    className={btnClass}
                                    disabled={quizStatus === 'correct'} // Disable if already answered correctly
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="mt-6 flex flex-col items-center gap-3">
                 {!showOptions && hasOptions && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowOptions(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full font-medium hover:bg-indigo-100 transition-colors"
                    >
                        <List size={18} />
                        Mostrar Opções
                    </button>
                 )}
                 {/* Only allow manual flip if not answered correctly yet (to prevent cheating logic flow, or allow it?) */}
                 {/* Actually, always allow flip for learning */}
                 <p className="text-slate-400 text-sm flex items-center gap-2 mt-2 cursor-pointer hover:text-primary transition-colors" onClick={() => setIsFlipped(true)}>
                    <RotateCw size={14} /> Clique para virar
                 </p>
            </div>
          </div>

          {/* Back (Answer) */}
          <div 
             className="absolute inset-0 w-full h-full bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-8 flex flex-col backface-hidden rotate-y-180 text-left overflow-y-auto"
          >
            <span className="absolute top-6 left-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Resposta</span>
            
            <div className="mt-8 space-y-6 flex-1">
                {/* Explanation */}
                <div>
                    <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">Explicação</h4>
                    <p className="text-lg text-slate-100 leading-relaxed">
                        {currentCard.back}
                    </p>
                </div>

                <div className="w-full h-px bg-slate-700 my-2"></div>

                {/* Legal Text */}
                {currentCard.legalText && (
                    <div>
                         <h4 className="text-amber-500 text-xs uppercase font-bold mb-2 flex items-center gap-1">
                            <Scale size={14} /> Flashcards com base na Lei Seca
                         </h4>
                         <div className="font-serif italic text-slate-300 text-base leading-relaxed p-3 bg-slate-800/50 rounded border-l-2 border-amber-500">
                            <RenderText text={currentCard.legalText} />
                         </div>
                    </div>
                )}
            </div>

             {currentCard.legalReference && (
              <div className="mt-6 mb-2 text-right">
                  <span className="inline-block px-3 py-1 bg-slate-800 rounded text-blue-300 text-sm font-mono border border-slate-700">
                    {currentCard.legalReference}
                  </span>
              </div>
            )}
            
            {/* Action Buttons for SRS Grading or Next */}
            <div className="mt-auto pt-6 border-t border-slate-800 flex justify-between gap-4">
                 <button
                    onClick={(e) => {e.stopPropagation(); setIsFlipped(false); }}
                    className="text-slate-400 hover:text-white text-sm flex items-center gap-2"
                 >
                    <RotateCw size={14} /> Ver Pergunta
                 </button>

                 {hasOptions ? (
                    /* For multiple choice, we just show Next because grading happened on the front */
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNextAfterQuiz(); }}
                        className="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                        Próxima <ArrowLeft size={18} className="rotate-180" />
                    </button>
                 ) : (
                    /* For manual cards, show grading buttons */
                    <div className="flex gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleManualGrade(false); }}
                            className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/50 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            <ThumbsDown size={18} /> Errei (Rever)
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleManualGrade(true); }}
                            className="bg-green-500/20 hover:bg-green-500/40 text-green-300 border border-green-500/50 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            <ThumbsUp size={18} /> Acertei
                        </button>
                    </div>
                 )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};