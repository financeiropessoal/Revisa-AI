import React, { useMemo } from 'react';
import { Deck, Flashcard } from '../types';
import { ArrowLeft, BarChart2, Calendar, TrendingUp } from 'lucide-react';

interface StatsDashboardProps {
  decks: Deck[];
  onBack: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ decks, onBack }) => {
  // Aggregate all cards
  const allCards = useMemo(() => decks.flatMap(d => d.cards), [decks]);

  // Calculate stats
  const stats = useMemo(() => {
    const history: number[] = [];
    allCards.forEach(card => {
        if (card.studyHistory) {
            history.push(...card.studyHistory);
        }
    });

    // Group by date (YYYY-MM-DD)
    const counts: Record<string, number> = {};
    history.forEach(timestamp => {
        const date = new Date(timestamp).toLocaleDateString('pt-BR');
        counts[date] = (counts[date] || 0) + 1;
    });

    const today = new Date().toLocaleDateString('pt-BR');
    
    // Generate last 7 days keys
    const last7Days: { date: string, label: string, count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toLocaleDateString('pt-BR');
        const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }); // ex: "seg, 28"
        last7Days.push({
            date: dateKey,
            label: dayLabel.replace('.', ''),
            count: counts[dateKey] || 0
        });
    }

    return {
        totalReviews: history.length,
        todayCount: counts[today] || 0,
        last7Days,
        maxDaily: Math.max(...last7Days.map(d => d.count), 5) // Minimum scale of 5 for better viz
    };
  }, [allCards]);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center gap-4 mb-8">
        <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Painel de Estatísticas</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe seu rendimento e constância</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* KPI: Reviewed Today */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-4 rounded-full">
                <Calendar size={32} />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Revisados Hoje</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.todayCount}</h3>
            </div>
        </div>

        {/* KPI: Total Reviewed */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-full">
                <BarChart2 size={32} />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total de Revisões</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.totalReviews}</h3>
            </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-primary dark:text-blue-400" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Desempenho (Últimos 7 dias)</h3>
        </div>

        <div className="h-64 w-full flex items-end justify-between gap-2 md:gap-4 relative pt-6">
            {/* Grid lines background (simple) */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-xs text-slate-300 dark:text-slate-600">
                 <div className="border-b border-slate-100 dark:border-slate-700 w-full flex items-end"><span>{stats.maxDaily}</span></div>
                 <div className="border-b border-slate-100 dark:border-slate-700 w-full flex items-end"><span>{Math.round(stats.maxDaily / 2)}</span></div>
                 <div className="border-b border-slate-100 dark:border-slate-700 w-full flex items-end"><span>0</span></div>
            </div>

            {stats.last7Days.map((day, idx) => {
                const heightPercentage = (day.count / stats.maxDaily) * 100;
                return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full z-10 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {day.count} cards
                        </div>
                        
                        {/* Bar */}
                        <div 
                            className="w-full max-w-[40px] bg-primary dark:bg-blue-600 rounded-t-md hover:bg-secondary dark:hover:bg-blue-500 transition-all duration-500 ease-out"
                            style={{ height: `${Math.max(heightPercentage, 2)}%` }} // min height 2% for visibility
                        ></div>
                        
                        {/* Label */}
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium text-center uppercase tracking-tighter">
                            {day.label}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};