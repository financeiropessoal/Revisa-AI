import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Loader2, AlertTriangle, Signal, ExternalLink } from 'lucide-react';
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
        setError("Não foi possível gerar cards. A resposta da IA veio vazia ou incompleta.");
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      
      if (msg.includes("API_KEY") || msg.includes("403")) {
          setError("API_KEY_ERROR");
      } else if (msg.includes("404") || msg.includes("not found")) {
          setError("Modelo de IA indisponível ou erro de conexão. Tente novamente mais tarde.");
      } else {
          setError(`Erro: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 text-primary dark:text-blue-400">
            <Sparkles size={24} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Gerador de Baralhos</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" disabled={loading}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleGenerate}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Matéria Principal
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading || (!isNewDeck && !!initialSubject)}
                className="w-full p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Ex: Direito Penal"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assunto Específico
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                className="w-full p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Ex: Crimes contra a Vida"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <Signal size={16} className="text-slate-500 dark:text-slate-400" />
                Nível de Dificuldade
              </label>
              <div className="grid grid-cols-2 gap-2">
                 <button
                    type="button"
                    onClick={() => setDifficulty('easy')}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${difficulty === 'easy' ? 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                 >
                    Fácil
                 </button>
                 <button
                    type="button"
                    onClick={() => setDifficulty('medium')}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${difficulty === 'medium' ? 'bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                 >
                    Médio
                 </button>
                 <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${difficulty === 'hard' ? 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                 >
                    Difícil
                 </button>
                 <button
                    type="button"
                    onClick={() => setDifficulty('mixed')}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${difficulty === 'mixed' ? 'bg-indigo-100 border-indigo-400 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                 >
                    Misto (Todas)
                 </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Quantidade de Flashcards
              </label>
              <input
                type="range"
                min="3"
                max="15"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={loading}
                className="w-full accent-primary dark:accent-blue-500 h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>3</span>
                <span className="font-bold text-primary dark:text-blue-400 text-base">{quantity}</span>
                <span>15</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-xs rounded-lg flex items-start gap-2 border border-amber-100 dark:border-amber-900/50">
             <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
             <p>A IA utiliza <strong>EXCLUSIVAMENTE FLASHCARDS COM BASE NA LEI SECA</strong>. Jurisprudência não incluída. As questões médias/difíceis focam em casos práticos e exceções.</p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg flex flex-col items-start gap-2 border border-red-100 dark:border-red-900/50">
              <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span className="break-words font-medium">
                      {error === "API_KEY_ERROR" 
                          ? "Chave de API não configurada." 
                          : error}
                  </span>
              </div>
              
              {error === "API_KEY_ERROR" && (
                <div className="ml-6 flex flex-col gap-2 w-full">
                    <p className="text-xs">Para usar a IA, você precisa adicionar uma chave do Google Gemini.</p>
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 w-fit bg-red-100 dark:bg-red-800/50 px-3 py-1.5 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-xs font-bold text-red-800 dark:text-red-200"
                    >
                        <ExternalLink size={12} />
                        Gerar Chave de API Gratuita
                    </a>
                    <p className="text-[10px] opacity-80">
                        Local: Crie um arquivo <code>.env</code> com <code>API_KEY=sua_chave</code><br/>
                        Vercel: Adicione em Settings &gt; Environment Variables.
                    </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                loading ? 'bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-secondary dark:from-blue-700 dark:to-blue-600 hover:shadow-xl hover:scale-[1.02]'
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
