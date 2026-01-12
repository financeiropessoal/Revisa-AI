import React, { useState, useMemo } from 'react';
import { Deck } from '../types';
import { Book, ChevronRight, Plus, Folder, FolderOpen, ArrowLeft, Trash2, Dices } from 'lucide-react';

interface DeckListProps {
  decks: Deck[];
  onSelectDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => void;
  onDeleteSubject: (subject: string) => void;
  onCreateNew: () => void;
  onRandomReview: () => void;
}

export const DeckList: React.FC<DeckListProps> = ({ decks, onSelectDeck, onDeleteDeck, onDeleteSubject, onCreateNew, onRandomReview }) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Group decks by subject
  const subjects = useMemo(() => {
    const subs = new Set<string>();
    decks.forEach(d => subs.add(d.subject || "Geral"));
    return Array.from(subs).sort();
  }, [decks]);

  // Filter decks for the selected subject
  const currentDecks = useMemo(() => {
    if (!selectedSubject) return [];
    return decks.filter(d => (d.subject || "Geral") === selectedSubject);
  }, [decks, selectedSubject]);

  const totalCardsAcrossAllDecks = useMemo(() => {
    return decks.reduce((acc, deck) => acc + deck.cards.length, 0);
  }, [decks]);

  if (selectedSubject) {
    // VIEW: List of Decks within a Subject
    return (
      <div className="p-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center gap-4 mb-8">
            <button 
                onClick={() => setSelectedSubject(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
                <ArrowLeft size={24} className="text-slate-600" />
            </button>
            <div>
                <h2 className="text-3xl font-bold text-slate-800">{selectedSubject}</h2>
                <p className="text-slate-500 mt-1">Selecione um assunto para estudar</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentDecks.map((deck) => {
            const totalCount = deck.cards.length;

            return (
              <div
                key={deck.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow p-5 flex flex-col justify-between group cursor-pointer relative"
                onClick={() => onSelectDeck(deck)}
              >
                {/* Delete Button - Positioned Absolute for better click handling */}
                <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onDeleteDeck(deck.id); 
                    }}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all z-20"
                    title="Excluir este baralho"
                >
                    <Trash2 size={20} />
                </button>

                <div>
                  <div className="flex justify-between items-start">
                      <div className="bg-blue-50 text-blue-700 p-2 rounded-lg mb-4 inline-block">
                          <Book size={24} />
                      </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 pr-8">{deck.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4">{deck.description}</p>
                </div>
                
                <div className="mt-auto">
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-sm font-medium text-slate-600">
                        {totalCount} {totalCount === 1 ? 'carta' : 'cartas'}
                        </span>
                        <span className="text-primary group-hover:translate-x-1 transition-transform">
                        <ChevronRight size={20} />
                        </span>
                    </div>
                </div>
              </div>
            );
          })}
          
           {/* Quick Add Button inside Subject */}
           <button
            onClick={onCreateNew}
            className="border-2 border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary hover:bg-blue-50 transition-all cursor-pointer h-full min-h-[200px]"
          >
            <Plus size={32} className="mb-2" />
            <span className="font-medium">Adicionar Assunto</span>
          </button>
        </div>
      </div>
    );
  }

  // VIEW: List of Subjects (Folders)
  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Minhas Matérias</h2>
            <p className="text-slate-500 mt-1">Organize seus estudos por disciplina jurídica</p>
        </div>
        <div className="flex gap-3">
            {totalCardsAcrossAllDecks > 0 && (
                <button
                    onClick={onRandomReview}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition-colors"
                    title="Estudar até 50 cartas aleatórias de todas as matérias"
                >
                    <Dices size={20} />
                    <span className="hidden sm:inline">Revisão Aleatória</span>
                </button>
            )}
            <button
            onClick={onCreateNew}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
            <Plus size={20} />
            <span>Novo Baralho</span>
            </button>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
          <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-medium text-slate-700">Nenhuma matéria encontrada</h3>
          <p className="text-slate-500 mt-2">Comece criando seu primeiro baralho de estudos.</p>
          <button
            onClick={onCreateNew}
            className="mt-6 text-primary font-medium hover:underline"
          >
            Criar agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {subjects.map((subject) => {
             // Calculate stats
             const subjectDecks = decks.filter(d => (d.subject || "Geral") === subject);
             const count = subjectDecks.length;
             
             return (
              <div
                key={subject}
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all p-5 cursor-pointer flex flex-col items-center text-center gap-4 group relative overflow-hidden"
                onClick={() => setSelectedSubject(subject)}
              >
                 <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onDeleteSubject(subject); 
                    }}
                    className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100"
                    title={`Excluir toda a matéria: ${subject}`}
                >
                    <Trash2 size={18} />
                </button>

                <div className="bg-amber-100 text-amber-600 p-4 rounded-full group-hover:scale-110 transition-transform">
                  <Folder size={32} fill="currentColor" className="opacity-80" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{subject}</h3>
                    <p className="text-sm text-slate-500">{count} {count === 1 ? 'baralho' : 'baralhos'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};