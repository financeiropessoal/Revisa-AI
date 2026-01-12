
import React, { useState, useEffect } from 'react';
import { Deck, ViewState, Flashcard, DifficultyLevel } from './types';
import { getDecks, saveDecks, createDeck, createFlashcard } from './services/storageService';
import { DeckList } from './components/DeckList';
import { DeckDetail } from './components/DeckDetail';
import { StudyMode } from './components/StudyMode';
import { StatsDashboard } from './components/StatsDashboard';
import { GeneratorModal } from './components/GeneratorModal';
import { GeneratedCardData } from './services/geminiService';
import { GraduationCap, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorMode, setGeneratorMode] = useState<'NEW_DECK' | 'ADD_TO_DECK'>('NEW_DECK');
  const [tempDeck, setTempDeck] = useState<Deck | null>(null);

  useEffect(() => {
    const loadedDecks = getDecks();
    setDecks(loadedDecks);
  }, []);

  useEffect(() => {
    if (decks.length > 0) {
      saveDecks(decks);
    }
  }, [decks]);

  const activeDeck = tempDeck || decks.find(d => d.id === selectedDeckId);

  // --- Handlers ---

  const handleCreateDeck = () => {
    setGeneratorMode('NEW_DECK');
    setShowGenerator(true);
  };

  const handleSelectDeck = (deck: Deck) => {
    setTempDeck(null); // Ensure no temp deck is active
    setSelectedDeckId(deck.id);
    setView(ViewState.DECK_DETAILS);
  };

  const handleDeleteDeck = (deckId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este baralho?")) {
      const newDecks = decks.filter(d => d.id !== deckId);
      setDecks(newDecks);
      if (newDecks.length === 0) {
          localStorage.removeItem('leiseca_decks_v1');
      } else {
          saveDecks(newDecks); // Explicitly save immediately
      }
      
      // If deleting currently viewed deck
      if (selectedDeckId === deckId) {
          setSelectedDeckId(null);
          setView(ViewState.DASHBOARD);
      }
    }
  };

  const handleDeleteSubject = (subjectName: string) => {
    if (window.confirm(`ATENÇÃO: Tem certeza que deseja excluir a matéria "${subjectName}" e TODOS os seus baralhos?\n\nEsta ação não pode ser desfeita.`)) {
        const newDecks = decks.filter(d => (d.subject || "Geral") !== subjectName);
        setDecks(newDecks);
        if (newDecks.length === 0) {
            localStorage.removeItem('leiseca_decks_v1');
        } else {
            saveDecks(newDecks);
        }
    }
  };

  const handleAddManualCard = (front: string, back: string, ref: string, legalText: string, difficulty?: DifficultyLevel) => {
    if (!selectedDeckId) return;
    const newCard = createFlashcard(front, back, ref, legalText, undefined, undefined, difficulty);
    setDecks(prev => prev.map(deck => {
      if (deck.id === selectedDeckId) {
        return { ...deck, cards: [...deck.cards, newCard] };
      }
      return deck;
    }));
  };
  
  const handleEditCard = (cardId: string, updates: Partial<Flashcard>) => {
    if (!selectedDeckId) return;
    setDecks(prev => prev.map(deck => {
        if (deck.id === selectedDeckId) {
            return {
                ...deck,
                cards: deck.cards.map(c => c.id === cardId ? { ...c, ...updates } : c)
            };
        }
        return deck;
    }));
  };

  const handleDeleteCard = (cardId: string) => {
    if (!selectedDeckId) return;
     setDecks(prev => prev.map(deck => {
      if (deck.id === selectedDeckId) {
        return { ...deck, cards: deck.cards.filter(c => c.id !== cardId) };
      }
      return deck;
    }));
  };

  const handleCardResult = (cardId: string, isCorrect: boolean) => {
    const now = Date.now();
    
    setDecks(prev => prev.map(deck => {
        // Only modify if deck contains the card
        const hasCard = deck.cards.some(c => c.id === cardId);
        if (!hasCard) return deck;

        return {
            ...deck,
            cards: deck.cards.map(c => {
                if (c.id !== cardId) return c;

                // --- SRS Algorithm (Simplified SM-2) ---
                let interval = c.interval || 0;
                let easeFactor = c.easeFactor || 2.5;

                if (isCorrect) {
                    if (interval === 0) {
                        interval = 1; // First success: 1 day
                    } else if (interval === 1) {
                        interval = 3; // Second success: 3 days
                    } else {
                        interval = Math.ceil(interval * easeFactor);
                    }
                    // Reward ease slightly for success
                    easeFactor = Math.min(easeFactor + 0.1, 5.0); 
                } else {
                    // Reset on failure
                    interval = 1; // Back to 1 day
                    // Penalize ease
                    easeFactor = Math.max(easeFactor - 0.2, 1.3);
                }

                // Calculate next review date (interval in days * ms)
                const nextReview = now + (interval * 24 * 60 * 60 * 1000);

                return {
                    ...c,
                    studied: true,
                    studyHistory: [...(c.studyHistory || []), now],
                    interval: interval,
                    easeFactor: easeFactor,
                    nextReviewDate: nextReview
                };
            })
        };
    }));
  };

  const handleRandomReview = () => {
    // Collect all cards from all decks
    const allCards = decks.flatMap(d => d.cards);
    
    if (allCards.length === 0) {
        alert("Crie ao menos um baralho com cartas para usar a revisão aleatória.");
        return;
    }

    // Sort by Due Date (Overdue first)
    const now = Date.now();
    const sortedCards = [...allCards].sort((a, b) => {
        const dateA = a.nextReviewDate || 0;
        const dateB = b.nextReviewDate || 0;
        return dateA - dateB;
    });

    // Take top 50 (most overdue)
    const selectedCards = sortedCards.slice(0, 50);

    const randomDeck: Deck = {
        id: 'random-review-temp',
        title: 'Revisão Inteligente',
        subject: 'Misto',
        description: 'Focada nos cards mais atrasados ou novos.',
        cards: selectedCards,
        createdAt: Date.now()
    };

    setTempDeck(randomDeck);
    setSelectedDeckId(null); 
    setView(ViewState.STUDY_MODE);
  };

  const handleGeneratorSuccess = (subject: string, topic: string, generatedCards: GeneratedCardData[]) => {
    const newCards = generatedCards.map(c => createFlashcard(
        c.front, 
        c.back, 
        c.legalReference, 
        c.legalText,
        c.options,
        c.correctAnswer,
        c.difficulty
    ));

    if (generatorMode === 'NEW_DECK') {
      const newDeck = createDeck(subject, topic, "Flashcards gerados via IA baseados em flashcards com base na Lei Seca.");
      newDeck.cards = newCards;
      setDecks(prev => [...prev, newDeck]);
      setSelectedDeckId(newDeck.id); 
    } else if (generatorMode === 'ADD_TO_DECK' && selectedDeckId) {
      setDecks(prev => prev.map(deck => {
        if (deck.id === selectedDeckId) {
          return { ...deck, cards: [...deck.cards, ...newCards] };
        }
        return deck;
      }));
    }

    setShowGenerator(false);
  };

  const handleOpenGeneratorForDeck = () => {
    if (!selectedDeckId) return;
    setGeneratorMode('ADD_TO_DECK');
    setShowGenerator(true);
  };

  // Prepare deck for study mode (Sort by due date)
  const getStudyDeck = (): Deck | null => {
      if (!activeDeck) return null;
      
      // We create a shallow copy of the deck but with sorted cards
      const sortedCards = [...activeDeck.cards].sort((a, b) => {
          // Priority 1: Overdue cards (nextReviewDate < now)
          // Priority 2: New cards (nextReviewDate == 0)
          // Priority 3: Future cards
          const dateA = a.nextReviewDate || 0;
          const dateB = b.nextReviewDate || 0;
          return dateA - dateB;
      });

      return { ...activeDeck, cards: sortedCards };
  };

  const studyDeck = view === ViewState.STUDY_MODE ? getStudyDeck() : null;

  // --- Render ---

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView(ViewState.DASHBOARD); setSelectedDeckId(null); setTempDeck(null); }}>
          <div className="bg-primary text-white p-2 rounded-lg shadow-sm">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">RevisAI</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">FLASHCARDS COM BASE NA LEI SECA</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
             {view !== ViewState.STATS && (
                <button 
                    onClick={() => setView(ViewState.STATS)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm font-bold"
                >
                    <LayoutDashboard size={18} />
                    <span className="hidden sm:inline">Estatísticas</span>
                </button>
             )}
            <div className="text-xs text-slate-400 font-mono hidden sm:block">
            v1.9 • Gemini 3 Flash
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {view === ViewState.DASHBOARD && (
          <div className="h-full overflow-y-auto">
            <DeckList
              decks={decks}
              onSelectDeck={handleSelectDeck}
              onDeleteDeck={handleDeleteDeck}
              onDeleteSubject={handleDeleteSubject}
              onCreateNew={handleCreateDeck}
              onRandomReview={handleRandomReview}
            />
          </div>
        )}

        {view === ViewState.STATS && (
            <div className="h-full overflow-y-auto">
                <StatsDashboard decks={decks} onBack={() => setView(ViewState.DASHBOARD)} />
            </div>
        )}

        {view === ViewState.DECK_DETAILS && activeDeck && (
          <DeckDetail
            deck={activeDeck}
            onBack={() => { setView(ViewState.DASHBOARD); setSelectedDeckId(null); setTempDeck(null); }}
            onStudy={() => setView(ViewState.STUDY_MODE)}
            onAddManual={handleAddManualCard}
            onGenerateAI={handleOpenGeneratorForDeck}
            onDeleteCard={handleDeleteCard}
            onEditCard={handleEditCard}
          />
        )}

        {view === ViewState.STUDY_MODE && studyDeck && (
          <StudyMode
            deck={studyDeck}
            onExit={() => { 
                if (tempDeck) {
                    setTempDeck(null);
                    setView(ViewState.DASHBOARD);
                } else {
                    setView(ViewState.DECK_DETAILS); 
                }
            }}
            onMarkStudied={handleCardResult}
          />
        )}
      </main>

      {/* Modals */}
      {showGenerator && (
        <GeneratorModal
          onClose={() => setShowGenerator(false)}
          onSuccess={handleGeneratorSuccess}
          initialSubject={generatorMode === 'ADD_TO_DECK' && activeDeck ? activeDeck.subject : ''}
          isNewDeck={generatorMode === 'NEW_DECK'}
        />
      )}
    </div>
  );
};

export default App;