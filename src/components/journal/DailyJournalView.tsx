import React, { useState, useEffect } from 'react';
import { useJournal } from '../../contexts/JournalContext';
import { TradeCard } from '../trades/TradeCard';
import { Trade } from '../../types';
import { useToast } from '../common/Toast';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle,
  Plus,
  Save,
  BookOpen,
} from 'lucide-react';

interface DailyJournalViewProps {
  onOpenTradeDetail: (trade: Trade) => void;
  onOpenAddTrade: () => void;
}

export const DailyJournalView: React.FC<DailyJournalViewProps> = ({
  onOpenTradeDetail,
  onOpenAddTrade,
}) => {
  const {
    currentDate,
    setCurrentDate,
    currentJournalDay,
    saveDayNotes,
    toggleDayCompleted,
    getDayTrades,
  } = useJournal();
  const { showToast } = useToast();

  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Sync notes from currentJournalDay
  useEffect(() => {
    if (currentJournalDay) {
      setNotes(currentJournalDay.notes || '');
    } else {
      setNotes('');
    }
  }, [currentJournalDay, currentDate]);

  const handlePrevDay = () => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
  };

  const dayTrades = getDayTrades(currentDate);

  let dayPnl = 0;
  let dayWins = 0;
  dayTrades.forEach((t) => {
    const val = Number(t.pnl) || 0;
    dayPnl += val;
    if (t.result === 'win' || val > 0) dayWins++;
  });

  const dayWinRate = dayTrades.length > 0 ? (dayWins / dayTrades.length) * 100 : 0;
  const isCompleted = currentJournalDay?.completed ?? false;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await saveDayNotes(currentDate, notes);
    setIsSavingNotes(false);
    showToast('Daily journal notes saved.', 'success');
  };

  const handleToggleCompleted = async () => {
    const nextState = !isCompleted;
    await toggleDayCompleted(currentDate, nextState);
    if (nextState) {
      showToast('Journal day marked as completed!', 'success');
    } else {
      showToast('Journal day marked as in-progress.', 'info');
    }
  };

  const dateObj = new Date(currentDate + 'T00:00:00');
  const formattedDateTitle = dateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isToday = currentDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Date Navigation & Controls */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm transition-colors">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handlePrevDay}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white font-mono">
              {currentDate}
            </span>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider font-mono">
                Today
              </span>
            )}
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleToday}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
              isToday
                ? 'bg-zinc-100 dark:bg-[#18181B] text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 cursor-default'
                : 'text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#18181B] hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            Jump to Today
          </button>

          {/* Direct Date Picker input */}
          <div className="relative">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
              className="bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white px-3 py-1.5 rounded-xl text-xs font-mono outline-none cursor-pointer hover:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Task Card for the Day */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        {/* Card Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#0E0E11] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                {formattedDateTitle}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Trading plan, daily review & execution tracking
            </p>
          </div>

          {/* "Journal Completed" Checkbox Button */}
          <button
            onClick={handleToggleCompleted}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'bg-zinc-100 dark:bg-[#18181B] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-emerald-500'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-zinc-400 dark:border-zinc-600 bg-white dark:bg-[#121215]'
              }`}
            >
              {isCompleted && <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <span>
              {isCompleted ? 'Journal Completed ✓' : 'Mark Journal Completed'}
            </span>
          </button>
        </div>

        {/* Day Metric Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-zinc-200 dark:border-zinc-800 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-[#121215]">
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
              Daily Realized P&L
            </span>
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                dayPnl > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : dayPnl < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {dayPnl > 0 ? '+' : ''}${dayPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
              Executions Logged
            </span>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white tabular-nums">
              {dayTrades.length} {dayTrades.length === 1 ? 'Trade' : 'Trades'}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
              Day Win Rate
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {dayTrades.length > 0 ? `${dayWinRate.toFixed(1)}%` : '—'}
            </div>
          </div>
        </div>

        {/* Daily Notes & Observations Box */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono">
              Daily Pre-Market Prep & Post-Market Notes
            </label>
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="Document macroeconomic news events, key market bias, sessions traded, psychological observations, and rules followed..."
            rows={4}
            className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white p-3.5 rounded-xl text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-colors resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Trades for this day */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Trades Taken on {currentDate}
            </h3>
            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-[#18181B] px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800">
              {dayTrades.length}
            </span>
          </div>

          <button
            onClick={onOpenAddTrade}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Trade for this Day</span>
          </button>
        </div>

        {dayTrades.length === 0 ? (
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center transition-colors">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              No Trades Logged for this Date
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
              Keep your record strict. Log any executed setups or review your daily notes above.
            </p>
            <button
              onClick={onOpenAddTrade}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Log Trade for {currentDate}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {dayTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onClick={() => onOpenTradeDetail(trade)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
