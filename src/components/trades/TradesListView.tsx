import React, { useState, useMemo } from 'react';
import { useJournal } from '../../contexts/JournalContext';
import { TradeCard } from './TradeCard';
import { Trade, TradeResult, TradeDirection } from '../../types';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react';

interface TradesListViewProps {
  onOpenTradeDetail: (trade: Trade) => void;
  onOpenAddTrade: () => void;
}

export const TradesListView: React.FC<TradesListViewProps> = ({
  onOpenTradeDetail,
  onOpenAddTrade,
}) => {
  const { trades, instruments } = useJournal();

  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<TradeResult | 'all'>('all');
  const [directionFilter, setDirectionFilter] = useState<TradeDirection | 'all'>('all');
  const [instrumentFilter, setInstrumentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'pnl-desc' | 'pnl-asc'>('date-desc');

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    return trades
      .filter((trade) => {
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const symbol = trade.instrument?.symbol?.toLowerCase() || '';
          const strategy = trade.strategy?.toLowerCase() || '';
          const notes = trade.notes?.toLowerCase() || '';
          if (!symbol.includes(q) && !strategy.includes(q) && !notes.includes(q)) {
            return false;
          }
        }

        // Result filter
        if (resultFilter !== 'all' && trade.result !== resultFilter) {
          return false;
        }

        // Direction filter
        if (directionFilter !== 'all' && trade.direction !== directionFilter) {
          return false;
        }

        // Instrument filter
        if (instrumentFilter !== 'all' && trade.instrument_id !== instrumentFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortBy === 'date-asc') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (sortBy === 'pnl-desc') {
          return (Number(b.pnl) || 0) - (Number(a.pnl) || 0);
        } else {
          return (Number(a.pnl) || 0) - (Number(b.pnl) || 0);
        }
      });
  }, [trades, searchTerm, resultFilter, directionFilter, instrumentFilter, sortBy]);

  // Aggregated filtered stats
  const filteredStats = useMemo(() => {
    let totalPnl = 0;
    let wins = 0;
    filteredTrades.forEach((t) => {
      const p = Number(t.pnl) || 0;
      totalPnl += p;
      if (t.result === 'win' || p > 0) wins++;
    });
    const winRate = filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0;
    return { totalPnl, winRate, count: filteredTrades.length };
  }, [filteredTrades]);

  const hasActiveFilters =
    searchTerm !== '' ||
    resultFilter !== 'all' ||
    directionFilter !== 'all' ||
    instrumentFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setResultFilter('all');
    setDirectionFilter('all');
    setInstrumentFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            All Executed Trades
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete trading ledger with full execution metrics & screenshots
          </p>
        </div>

        <button
          onClick={onOpenAddTrade}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2F80FF] hover:bg-[#2F80FF]/90 rounded-lg shadow-lg shadow-[#2F80FF]/25 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Trade</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111A2E] border border-[#1E2B45] rounded-xl p-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search symbol, strategy, notes..."
              className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white pl-9 pr-3 py-2 rounded-lg text-xs placeholder:text-slate-500 outline-none transition-colors"
            />
          </div>

          {/* Outcome Filter */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as any)}
            className="bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
          >
            <option value="all">Outcome: All Results</option>
            <option value="win">Outcome: Wins Only</option>
            <option value="loss">Outcome: Losses Only</option>
            <option value="breakeven">Outcome: Breakeven</option>
          </select>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value as any)}
            className="bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
          >
            <option value="all">Direction: Buy & Sell</option>
            <option value="buy">Direction: Buy / Long</option>
            <option value="sell">Direction: Sell / Short</option>
          </select>

          {/* Instrument Filter */}
          <select
            value={instrumentFilter}
            onChange={(e) => setInstrumentFilter(e.target.value)}
            className="bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-xs font-mono outline-none cursor-pointer"
          >
            <option value="all">Instrument: All Pairs</option>
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.symbol}
              </option>
            ))}
          </select>
        </div>

        {/* Sort & Quick Filter Stats row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1E2B45]/70 text-xs">
          <div className="flex items-center gap-3 text-slate-400 font-mono">
            <span>
              Showing <strong className="text-white">{filteredTrades.length}</strong> of{' '}
              {trades.length} trades
            </span>
            <span>·</span>
            <span>
              Filtered P&L:{' '}
              <strong
                className={
                  filteredStats.totalPnl > 0
                    ? 'text-[#00C896]'
                    : filteredStats.totalPnl < 0
                    ? 'text-[#FF4D5E]'
                    : 'text-white'
                }
              >
                {filteredStats.totalPnl > 0 ? '+' : ''}${filteredStats.totalPnl.toFixed(2)}
              </strong>
            </span>
            <span>·</span>
            <span>
              Win Rate: <strong className="text-[#2F80FF]">{filteredStats.winRate.toFixed(1)}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 bg-[#16223B] rounded border border-[#1E2B45]"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#16223B] border border-[#1E2B45] text-slate-200 px-2 py-1 rounded text-xs outline-none cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="pnl-desc">Highest P&L First</option>
                <option value="pnl-asc">Lowest P&L First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Trades Grid / List */}
      {filteredTrades.length === 0 ? (
        <div className="bg-[#111A2E] border border-[#1E2B45] rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#16223B] border border-[#1E2B45] flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            {hasActiveFilters ? 'No Matching Trades Found' : 'No Trades Recorded Yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {hasActiveFilters
              ? 'Try modifying your search query or reset the filters.'
              : 'Add your first trade execution to see detailed metrics and chart patterns.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#16223B] border border-[#1E2B45] hover:border-[#2F80FF] rounded-lg transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          ) : (
            <button
              onClick={onOpenAddTrade}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2F80FF] hover:bg-[#2F80FF]/90 rounded-lg shadow-lg shadow-[#2F80FF]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Your First Trade</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTrades.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              onClick={() => onOpenTradeDetail(trade)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
