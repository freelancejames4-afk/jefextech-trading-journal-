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
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
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

  // Navigate dates
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

  // Day's trades and stats
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
      showToast('Journal day marked as completed! Great discipline.', 'success');
    } else {
      showToast('Journal day marked as in-progress.', 'info');
    }
  };

  // Format date display
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
      <div className="bg-[#111A2E] border border-[#1E2B45] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handlePrevDay}
            className="p-2 text-slate-300 hover:text-white hover:bg-[#16223B] border border-[#1E2B45] rounded-lg transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white font-mono">
              {currentDate}
            </span>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2F80FF]/15 text-[#2F80FF] border border-[#2F80FF]/30 uppercase tracking-wider font-mono">
                Today
              </span>
            )}
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 text-slate-300 hover:text-white hover:bg-[#16223B] border border-[#1E2B45] rounded-lg transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleToday}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isToday
                ? 'bg-[#16223B] text-slate-400 border-[#1E2B45] cursor-default'
                : 'text-white bg-[#16223B] hover:bg-[#1C2A48] border-[#1E2B45] cursor-pointer'
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
              className="bg-[#16223B] border border-[#1E2B45] text-white px-3 py-1.5 rounded-lg text-xs font-mono outline-none cursor-pointer hover:border-[#2F80FF] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Task Card for the Day */}
      <div className="bg-[#111A2E] border border-[#1E2B45] rounded-xl shadow-lg overflow-hidden">
        {/* Card Header */}
        <div className="p-6 border-b border-[#1E2B45] bg-[#0B1220]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-[#2F80FF]" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                {formattedDateTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Trading plan, daily review & execution tracking
            </p>
          </div>

          {/* "Journal Completed" Checkbox Button */}
          <button
            onClick={handleToggleCompleted}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isCompleted
                ? 'bg-[#00C896]/15 border-[#00C896]/50 text-[#00C896] shadow-md shadow-[#00C896]/10'
                : 'bg-[#16223B] border-[#1E2B45] text-slate-300 hover:text-white hover:border-[#2F80FF]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                isCompleted
                  ? 'bg-[#00C896] border-[#00C896] text-[#0B1220]'
                  : 'border-slate-500 bg-[#0B1220]'
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
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-[#1E2B45] divide-y sm:divide-y-0 sm:divide-x divide-[#1E2B45] bg-[#0B1220]/20">
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Daily Realized P&L
            </span>
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                dayPnl > 0
                  ? 'text-[#00C896]'
                  : dayPnl < 0
                  ? 'text-[#FF4D5E]'
                  : 'text-slate-300'
              }`}
            >
              {dayPnl > 0 ? '+' : ''}${dayPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Executions Logged
            </span>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {dayTrades.length} {dayTrades.length === 1 ? 'Trade' : 'Trades'}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              Day Win Rate
            </span>
            <div className="text-2xl font-bold font-mono text-[#2F80FF] tabular-nums">
              {dayTrades.length > 0 ? `${dayWinRate.toFixed(1)}%` : '—'}
            </div>
          </div>
        </div>

        {/* Daily Notes & Observations Box */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Daily Pre-Market Prep & Post-Market Notes
            </label>
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#16223B] hover:bg-[#1C2A48] border border-[#1E2B45] hover:border-[#2F80FF] text-white rounded-lg transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#2F80FF]" />
              <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="Document macroeconomic news events, key market bias, sessions traded, psychological observations, and rules followed..."
            rows={4}
            className="w-full bg-[#16223B]/60 border border-[#1E2B45] focus:border-[#2F80FF] text-white p-3.5 rounded-xl text-xs placeholder:text-slate-500 outline-none transition-colors resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Trades for this day */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">
              Trades Taken on {currentDate}
            </h3>
            <span className="text-xs font-mono text-slate-400 bg-[#16223B] px-2 py-0.5 rounded-full border border-[#1E2B45]">
              {dayTrades.length}
            </span>
          </div>

          <button
            onClick={onOpenAddTrade}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2F80FF] hover:bg-[#2F80FF]/90 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Trade for this Day</span>
          </button>
        </div>

        {dayTrades.length === 0 ? (
          <div className="bg-[#111A2E] border border-[#1E2B45] rounded-xl p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#16223B] border border-[#1E2B45] flex items-center justify-center mx-auto mb-3 text-slate-500">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              No Trades Logged for this Date
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Keep your record strict. Log any executed buys/sells or review your daily notes above.
            </p>
            <button
              onClick={onOpenAddTrade}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2F80FF] hover:bg-[#2F80FF]/90 rounded-lg shadow-lg shadow-[#2F80FF]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
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
