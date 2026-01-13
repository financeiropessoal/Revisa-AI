import React, { useState, useEffect, useMemo } from 'react';
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
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Carregamento inicial (apenas uma vez)
  useEffect(() => {
    const loadedDecks = getDecks();
    if (loadedDecks && Array.isArray(loadedDecks)) {
      setDecks(loadedDecks);
    }
    setIsLoaded(true);
  }, []);

  // 2. Persistência segura (evita loops infinitos)
  useEffect(() => {
    if (isLoaded) {
      saveDecks(decks);
    }
  }, [decks, isLoaded]);

  // 3. Seleção de Deck Ativo com Memoização para performance
  const activeDeck = useMemo(() => {
    return tempDeck || decks.find(d => d.id === selectedDeckId) || null;
  }, [tempDeck, decks, selectedDeckId]);

  // --- Handlers ---

  const handleCreateDeck = () => {
    setGeneratorMode('NEW_DECK');
    setShowGenerator(true);
  };

  const handleSelectDeck = (deck: Deck) => {
    setTempDeck(null);
    setSelectedDeckId(deck.id);
    setView(ViewState.DECK_DETAILS);
  };

  const handleDeleteDeck = (deckId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este baralho?")) {
      setDecks(prev => prev.filter(d => d.id !== deckId));
      if (selectedDeckId === deckId) {
        setSelectedDeckId(null);
        setView(ViewState.DASHBOARD);
      }
    }
  };

  const handleDeleteSubject = (subjectName: string) => {
    if (window.confirm(`Excluir a matéria "${subjectName}" e TODOS os seus baralhos?`)) {
      setDecks(prev => prev.filter(d => (d.subject || "Geral") !== subjectName));
      setView(ViewState.DASHBOARD);
    }
  };

  const handleAddManualCard = (front: string, back: string, ref: string, legalText: string, difficulty?: DifficultyLevel) => {
    if (!selectedDeckId) return;
    const newCard = createFlashcard(front, back, ref, legalText, undefined, undefined, difficulty);
    setDecks(prev => prev.map(deck => 
      deck.id === selectedDeckId ? { ...deck, cards: [...deck.cards, newCard] } : deck
    ));
  };

  const handleEditCard = (cardId: string, updates: Partial<Flashcard>) => {
    if (!selectedDeckId) return;
    setDecks(prev => prev.map(deck => 
      deck.id === selectedDeckId ? {
        ...deck,
        cards: deck.cards.map(c => c.id === cardId ? { ...c, ...updates } : c)
      } : deck
    ));
  };

  const handleDeleteCard = (cardId: string) => {
    if (!selectedDeckId) return;
    setDecks(prev => prev.map(deck => 
      deck.id === selectedDeckId ? { ...deck, cards: deck.cards.filter(c => c.id !== cardId) } : deck
    ));
  };

  const handleCardResult = (cardId: string, isCorrect: boolean) => {
    const now = Date.now();
    setDecks(prev => prev.map(deck => {
      if (!deck.cards.some(c => c.id === cardId)) return deck;
      return {
        ...deck,
        cards: deck.cards.map(c => {
          if (c.id !== cardId) return c;
          let interval = c.interval || 0;
          let easeFactor = c.easeFactor || 2.5;

          if (isCorrect) {
            interval = interval === 0 ? 1 : interval === 1 ? 3 : Math.ceil(interval * easeFactor);
            easeFactor = Math.min(easeFactor + 0.1, 5.0);
          } else {
            interval = 1;
            easeFactor = Math.max(easeFactor - 0.2, 1.3);
          }

          return {
            ...c,
            studied: true,
            studyHistory: [...(c.studyHistory || []), now],
            interval,
            easeFactor,
            nextReviewDate: now + (interval * 24 * 60 * 60 * 1000)
          };
        })
      };
    }));
  };

  const handleRandomReview = () => {
    const allCards = decks.flatMap(d => d.cards);
    if (allCards.length === 0) {
      alert("Crie ao menos um baralho com cartas para usar a revisão aleatória.");
      return;
    }

    const sortedCards = [...allCards].sort((a, b) => (a.nextReviewDate || 0) - (b.nextReviewDate || 0));
    const randomDeck: Deck = {
      id: 'random-review-temp',
      title: 'Revisão Inteligente',
      subject: 'Misto',
      description: 'Cards mais atrasados ou novos de todas as suas matérias.',
      cards: sortedCards.slice(0, 50),
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
      const newDeck = createDeck(subject, topic, "Flashcards gerados via IA baseados em Lei Seca.");
      newDeck.cards = newCards;
      setDecks(prev => [...prev, newDeck]);
      setSelectedDeckId(newDeck.id);
      setView(ViewState.DECK_DETAILS);
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

  const getStudyDeck = (): Deck | null => {
      if (!activeDeck) return null;
      const sortedCards = [...activeDeck.cards].sort((a, b) => (a.nextReviewDate || 0) - (b.nextReviewDate || 0));
      return { ...activeDeck, cards: sortedCards };
  };

  const studyDeck = view === ViewState.STUDY_MODE ? getStudyDeck() : null;

  return (
    <div className="flex flex-col h-full bg-slate-50">
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