
import React, { useState, useEffect } from 'react';
import { Deck, Flashcard, DifficultyLevel } from '../types';
import { ArrowLeft, Play, Plus, Trash, Wand2, BookOpen, Scale, ListChecks, Pencil, AlertTriangle, Save } from 'lucide-react';

interface DeckDetailProps {
  deck: Deck;
  onBack: () => void;
  onStudy: () => void;
  onAddManual: (front: string, back: string, ref: string, legalText: string, difficulty?: DifficultyLevel) => void;
  onGenerateAI: () => void;
  onDeleteCard: (cardId: string) => void;
  onEditCard: (cardId: string, updates: Partial<Flashcard>) => void;
}

// Simple helper to render bold text from markdown-like syntax
const RenderText: React.FC<{ text: string, className?: string }> = ({ text, className }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold bg-yellow-100 text-slate-900 px-0.5 rounded">{part.slice(2, -2)}</strong>;
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
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${styles[level] || styles.medium}`}>
            {labels[level] || "Médio"}
        </span>
    );
};

export const DeckDetail: React.FC<DeckDetailProps> = ({
  deck,
  onBack,
  onStudy,
  onAddManual,
  onGenerateAI,
  onDeleteCard,
  onEditCard
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Form states
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [ref, setRef] = useState('');
  const [legalText, setLegalText] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');

  // If the edited card is deleted externally, close the form
  useEffect(() => {
    if (editingCardId && !deck.cards.find(c => c.id === editingCardId)) {
        setShowForm(false);
        setEditingCardId(null);
        setFront('');
        setBack('');
        setRef('');
        setLegalText('');
    }
  }, [deck.cards, editingCardId]);

  const handleEditClick = (e: React.MouseEvent, card: Flashcard) => {
    e.stopPropagation();
    setEditingCardId(card.id);
    setFront(card.front);
    setBack(card.back);
    setRef(card.legalReference || '');
    setLegalText(card.legalText || '');
    setDifficulty(card.difficulty || 'medium');
    setShowForm(true);
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    onDeleteCard(cardId);
  };

  const handleAddNewClick = () => {
    setEditingCardId(null);
    setFront('');
    setBack('');
    setRef('');
    setLegalText('');
    setDifficulty('medium');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (front && back) {
      if (editingCardId) {
        onEditCard(editingCardId, {
            front,
            back,
            legalReference: ref,
            legalText: legalText,
            difficulty: difficulty
        });
      } else {
        onAddManual(front, back, ref, legalText, difficulty);
      }
      
      // Reset
      setFront('');
      setBack('');
      setRef('');
      setLegalText('');
      setDifficulty('medium');
      setEditingCardId(null);
      setShowForm(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs uppercase tracking-wider font-semibold">{deck.subject || "Geral"}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{deck.title}</h2>
            <p className="text-slate-500 text-sm">{deck.cards.length} cartas</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button
            onClick={onGenerateAI}
            className="flex items-center gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Wand2 size={18} />
            <span className="hidden sm:inline">Gerar com IA</span>
          </button>
          <button
            onClick={handleAddNewClick}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
          <button
            onClick={onStudy}
            disabled={deck.cards.length === 0}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold shadow transition-colors ${
              deck.cards.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-primary hover:bg-secondary text-white'
            }`}
          >
            <Play size={18} />
            <span>Estudar</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-xl shadow border border-slate-200 animate-in fade-in slide-in-from-top-4 border-l-4 border-l-primary">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            {editingCardId ? <Pencil size={18} /> : <Plus size={18} />} 
            {editingCardId ? 'Editar Flashcard' : 'Nova Carta Manual'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pergunta (Frente)</label>
              <input
                type="text"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400"
                placeholder="Ex: Qual a pena para o crime de furto simples?"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Explicação (Verso)</label>
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none h-20 placeholder:text-slate-400"
                placeholder="Ex: É a subtração de coisa alheia móvel..."
                required
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Referência Legal</label>
                  <input
                    type="text"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400"
                    placeholder="Ex: Art. 155, CP"
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Dificuldade</label>
                   <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                        className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                   >
                       <option value="easy">Fácil</option>
                       <option value="medium">Médio</option>
                       <option value="hard">Difícil</option>
                   </select>
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Texto de Lei (Literal)</label>
              <textarea
                value={legalText}
                onChange={(e) => setLegalText(e.target.value)}
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none h-20 font-serif placeholder:text-slate-400"
                placeholder="Cole o artigo da lei aqui. Use **texto** para grifar."
              />
            </div>
           
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary flex items-center gap-2"
              >
                <Save size={18} />
                {editingCardId ? 'Salvar Alterações' : 'Criar Carta'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Warning Disclaimer */}
      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3 text-sm text-amber-900">
        <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
        <p>
          <strong>Atenção:</strong> O conteúdo é gerado com base <strong>EXCLUSIVAMENTE EM FLASHCARDS COM BASE NA LEI SECA</strong>. Entendimentos jurisprudenciais (STF/STJ) ou doutrinários <strong>NÃO</strong> estão incluídos. Podem ocorrer imprecisões da IA; sempre confira o texto oficial vigente.
        </p>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto pr-2">
        {deck.cards.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Este baralho está vazio.</p>
            <p className="text-sm">Use a IA para gerar questões ou adicione manualmente.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-10">
            {deck.cards.map((card) => (
              <div key={card.id} className={`bg-white p-5 rounded-lg border hover:border-blue-300 transition-colors flex justify-between gap-4 group shadow-sm ${card.studied ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
                <div className="flex-1 space-y-3">
                  {/* Front */}
                  <div className="flex items-start gap-2 relative">
                     <span className="font-bold text-slate-800 text-sm mt-0.5 min-w-[20px]">P:</span>
                     <span className="text-slate-800 font-medium pr-16">{card.front}</span>
                     
                     <div className="absolute right-0 top-0 flex flex-col gap-1 items-end">
                         {card.studied && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Estudado</span>}
                         <DifficultyBadge level={card.difficulty} />
                     </div>
                  </div>

                  {/* Options Indicator (if present) */}
                  {card.options && card.options.length > 0 && (
                     <div className="ml-7 mb-1">
                         <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <ListChecks size={12} />
                            Questão com alternativas
                         </span>
                     </div>
                  )}
                  
                  {/* Back */}
                   <div className="flex items-start gap-2">
                     <span className="font-bold text-slate-500 text-sm mt-0.5 min-w-[20px]">R:</span>
                     <p className="text-slate-600 text-sm">{card.back}</p>
                  </div>
                  
                  {/* Legal Text */}
                  {card.legalText && (
                    <div className="ml-7 p-3 bg-slate-50 border-l-2 border-primary rounded-r text-sm text-slate-700 font-serif italic">
                         <div className="flex items-center gap-1 mb-1 text-slate-400 text-xs not-italic font-sans">
                            <Scale size={12} />
                            <span>Texto da Lei:</span>
                         </div>
                         <RenderText text={card.legalText} />
                    </div>
                  )}

                  {/* Reference */}
                  {card.legalReference && (
                    <div className="ml-7">
                        <span className="text-xs text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded">
                        {card.legalReference}
                        </span>
                    </div>
                  )}
                </div>
                
                {/* Actions - Visible on mobile (default), Hidden on desktop until hover */}
                <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => handleEditClick(e, card)}
                        className="text-slate-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded"
                        title="Editar carta"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={(e) => handleDeleteClick(e, card.id)}
                        className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded"
                        title="Excluir carta"
                    >
                        <Trash size={18} />
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};