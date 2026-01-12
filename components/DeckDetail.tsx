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

const RenderText: React.FC<{ text: string, className?: string }> = ({ text, className }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-primary underline decoration-accent/30 underline-offset-2">{part.slice(2, -2)}</strong>;
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
        medium: "bg-amber-100 text-amber-700 border-amber-200",
        hard: "bg-rose-100 text-rose-700 border-rose-200"
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

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [ref, setRef] = useState('');
  const [legalText, setLegalText] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');

  useEffect(() => {
    if (editingCardId && !deck.cards.find(c => c.id === editingCardId)) {
        setShowForm(false);
        setEditingCardId(null);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    if (confirm("Deseja excluir esta carta?")) {
        onDeleteCard(cardId);
    }
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
        onEditCard(editingCardId, { front, back, legalReference: ref, legalText, difficulty });
      } else {
        onAddManual(front, back, ref, legalText, difficulty);
      }
      setShowForm(false);
      setEditingCardId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto w-full h-full flex flex-col">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
            <ArrowLeft size={24} />
          </button>
          <div>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold mb-1 inline-block">{deck.subject || "Geral"}</span>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{deck.title}</h2>
            <p className="text-slate-500 text-sm font-medium">{deck.cards.length} flashcards catalogados</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onGenerateAI} className="flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-xl font-semibold transition-all shadow-sm">
            <Wand2 size={18} />
            <span className="hidden sm:inline">IA Lei Seca</span>
          </button>
          <button onClick={handleAddNewClick} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-semibold transition-all shadow-sm">
            <Plus size={18} />
            <span className="hidden sm:inline">Manual</span>
          </button>
          <button onClick={onStudy} disabled={deck.cards.length === 0} className={`flex items-center gap-2 px-8 py-2 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 ${deck.cards.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-secondary'}`}>
            <Play size={18} fill="currentColor" />
            <span>ESTUDAR</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 animate-in fade-in slide-in-from-top-4 border-l-4 border-l-primary">
          <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
            {editingCardId ? <Pencil size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />} 
            {editingCardId ? 'Editar Flashcard' : 'Adicionar Letra da Lei'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pergunta / Enunciado</label>
                        <textarea value={front} onChange={(e) => setFront(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-24 text-slate-800" placeholder="Ex: Qual o prazo prescricional para..." required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gabarito Comentado</label>
                        <textarea value={back} onChange={(e) => setBack(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-24 text-slate-800" placeholder="Ex: O prazo é de 5 anos conforme..." required />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ref. Legal</label>
                            <input type="text" value={ref} onChange={(e) => setRef(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Ex: Art. 1, CP" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dificuldade</label>
                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                                <option value="easy">Fácil</option>
                                <option value="medium">Médio</option>
                                <option value="hard">Difícil</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Texto Literal da Lei (Lei Seca)</label>
                        <textarea value={legalText} onChange={(e) => setLegalText(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-24 font-serif italic" placeholder="Cole o artigo aqui. Use **negrito** nos pontos chave." />
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">DESCARTAR</button>
              <button type="submit" className="px-8 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-secondary transition-all">
                {editingCardId ? 'SALVAR ALTERAÇÕES' : 'CRIAR FLASHCARD'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {deck.cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            <BookOpen size={64} className="mb-4 opacity-20" />
            <p className="text-xl font-semibold">Este baralho ainda está em branco.</p>
            <p className="text-sm">Gere cartas com IA ou adicione os artigos manualmente para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-12">
            {deck.cards.map((card) => (
              <div key={card.id} className={`bg-white p-6 rounded-2xl border transition-all hover:shadow-md group relative ${card.studied ? 'border-green-100 bg-green-50/10' : 'border-slate-200'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                         <DifficultyBadge level={card.difficulty} />
                         {card.studied && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Revisado</span>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleEditClick(e, card)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"><Pencil size={18} /></button>
                        <button onClick={(e) => handleDeleteClick(e, card.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash size={18} /></button>
                    </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Questão / Frente</h4>
                    <p className="text-slate-800 font-semibold leading-relaxed">{card.front}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-50">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Fundamentação Jurídica (Verso)</h4>
                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                        <p className="text-slate-600 text-sm leading-relaxed">{card.back}</p>
                        {card.legalText && (
                            <div className="border-l-4 border-accent pl-4 py-1">
                                <span className="text-[9px] font-bold text-accent uppercase block mb-1">Lei Seca (Literalidade)</span>
                                <RenderText text={card.legalText} className="text-slate-800 font-serif italic text-sm leading-relaxed" />
                            </div>
                        )}
                        {card.legalReference && (
                            <div className="flex justify-end">
                                <span className="text-[10px] font-mono font-bold bg-white border border-slate-200 px-2 py-1 rounded text-primary">{card.legalReference}</span>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};