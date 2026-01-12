
import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Loader2, AlertTriangle, Signal } from 'lucide-react';
import { generateLegalFlashcards, GeneratedCardData } from '../services/geminiService';

interface GeneratorModalProps {
  onClose: () => void;
  onSuccess: (subject: string, topic: string, cards: GeneratedCardData[]) => void;
  initialSubject?: string; // If adding to existing deck, subject is locked
  initialTopic?: string; // Usually empty
  isNewDeck?: boolean;
}

export const GeneratorModal: React.FC<GeneratorModalProps> = ({ 
  onClose, 
  onSuccess, 
  initialSubject = '',
  isNewDeck = true
}) => {
  const [subject, setSubject] = useState(initialSubject);
  const [topic, setTopic] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [difficulty, setDifficulty] = useState<'mixed' | 'easy' | 'medium' | 'hard'>('mixed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cards = await generateLegalFlashcards(subject, topic, quantity, difficulty);
      if (cards.length > 0) {
        onSuccess(subject, topic, cards);
      } else {
        setError("Não foi possível gerar cards. Tente um tópico mais específico.");
      }
    } catch (err) {
      setError("Erro de conexão com a IA. Verifique sua chave de API ou tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={24} />
            <h2 className="text-xl font-bold text-slate-900">Gerador de Baralhos</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" disabled={loading}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleGenerate}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Matéria Principal
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading || (!isNewDeck && !!initialSubject)}
                className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-slate-100 disabled:text-slate-500 placeholder:text-slate-400"
                placeholder="Ex: Direito Penal"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Assunto Específico
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400"
                placeholder="Ex: Crimes contra a Vida"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Signal size={16} className="text-slate-500" />
                Nível de Dificuldade
              </label>
              <div className="grid grid-cols-2 gap-2">
                 <button
                    type="button"
                    onClick={() => setDifficulty('easy')}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${difficulty === 'easy' ? 'bg-green-100 border-green-400 text-green-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                 >
                    Fácil
                 </button>
                 <button
                    type="button"
                    onClick={() => setDifficulty('medium')}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${difficulty === 'medium' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                 >
                    Médio
                 </button>
                 <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${difficulty === 'hard' ? 'bg-red-100 border-red-400 text-red-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                 >
                    Difícil
                 </button>
                 <button
                    type="button"
                    onClick={() => setDifficulty('mixed')}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${difficulty === 'mixed' ? 'bg-indigo-100 border-indigo-400 text-indigo-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                 >
                    Misto (Todas)
                 </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantidade de Flashcards
              </label>
              <input
                type="range"
                min="3"
                max="30"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={loading}
                className="w-full accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>3</span>
                <span className="font-bold text-primary text-base">{quantity}</span>
                <span>30</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-xs rounded-lg flex items-start gap-2 border border-amber-100">
             <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
             <p>A IA utiliza <strong>EXCLUSIVAMENTE FLASHCARDS COM BASE NA LEI SECA</strong>. Jurisprudência não incluída. As questões médias/difíceis focam em casos práticos e exceções.</p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Consultando Legislação...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Gerar Cards Automaticamente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};