import React, { useState } from 'react';
import { useJournal } from '../../contexts/JournalContext';
import { Instrument, MarketType } from '../../types';
import { MARKET_TYPES } from '../../lib/constants';
import { useToast } from '../common/Toast';
import {
  Plus,
  Coins,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface InstrumentsViewProps {
  onSelectInstrument?: (instrumentId: string) => void;
}

export const InstrumentsView: React.FC<InstrumentsViewProps> = () => {
  const {
    instruments,
    trades,
    addInstrument,
    updateInstrument,
    deleteInstrument,
    resetStarterInstruments,
  } = useJournal();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [marketType, setMarketType] = useState<MarketType>('Crypto');
  const [deleteTarget, setDeleteTarget] = useState<Instrument | null>(null);

  const openAddModal = () => {
    setEditingInstrument(null);
    setSymbol('');
    setName('');
    setMarketType('Crypto');
    setIsModalOpen(true);
  };

  const openEditModal = (inst: Instrument) => {
    setEditingInstrument(inst);
    setSymbol(inst.symbol);
    setName(inst.name);
    setMarketType(inst.market_type);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !name.trim()) {
      showToast('Please enter both symbol and full name', 'warning');
      return;
    }

    try {
      if (editingInstrument) {
        await updateInstrument(editingInstrument.id, symbol, name, marketType);
        showToast(`Instrument ${symbol.toUpperCase()} updated.`, 'success');
      } else {
        await addInstrument(symbol, name, marketType);
        showToast(`Instrument ${symbol.toUpperCase()} added to portfolio!`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save instrument', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInstrument(deleteTarget.id);
      showToast(`Instrument ${deleteTarget.symbol} deleted.`, 'info');
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete instrument', 'error');
    }
  };

  const handleRestoreStarter = async () => {
    try {
      await resetStarterInstruments();
      showToast('Default starter instruments restored!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to restore default instruments', 'error');
    }
  };

  const getInstrumentStats = (instId: string) => {
    const instTrades = trades.filter((t) => t.instrument_id === instId);
    let netPnl = 0;
    let wins = 0;

    instTrades.forEach((t) => {
      const p = Number(t.pnl) || 0;
      netPnl += p;
      if (t.result === 'win' || p > 0) wins++;
    });

    const winRate = instTrades.length > 0 ? (wins / instTrades.length) * 100 : 0;

    return {
      tradesCount: instTrades.length,
      netPnl,
      winRate,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Trading Instruments
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your watched currency pairs, cryptos, and commodities
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRestoreStarter}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors cursor-pointer"
            title="Restore Starter List (BTC, ETH, SOL, HYPE, XAUUSD, EURUSD)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Add Defaults</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Instrument</span>
          </button>
        </div>
      </div>

      {/* Instruments Grid */}
      {instruments.length === 0 ? (
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center transition-colors">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <Coins className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            No Instruments Configured
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
            Add your favorite crypto pairs, forex pairs, or commodities to start logging trades.
          </p>
          <button
            onClick={handleRestoreStarter}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>Load Starter Instruments</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {instruments.map((inst) => {
            const stats = getInstrumentStats(inst.id);
            const isProfit = stats.netPnl > 0;
            const isLoss = stats.netPnl < 0;

            return (
              <div
                key={inst.id}
                className="group relative bg-white dark:bg-[#121215] hover:bg-zinc-50/70 dark:hover:bg-[#16161A] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-mono text-zinc-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {inst.symbol}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {inst.market_type}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {inst.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(inst)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit instrument"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(inst)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-rose-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete instrument"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Instrument Stats */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-zinc-50 dark:bg-[#18181B] rounded-xl border border-zinc-200 dark:border-zinc-800 mt-3 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase block">Trades</span>
                      <span className="text-zinc-900 dark:text-white font-medium tabular-nums">
                        {stats.tradesCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase block">Win %</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                        {stats.tradesCount > 0 ? `${stats.winRate.toFixed(0)}%` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase block">Net P&L</span>
                      <span
                        className={`font-bold tabular-nums ${
                          isProfit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isLoss
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {stats.netPnl > 0 ? '+' : ''}${stats.netPnl.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Available in Add Trade</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">Active</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Instrument Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {editingInstrument ? 'Edit Instrument' : '+ Add New Instrument'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Ticker / Symbol (e.g. BTC, XAUUSD, EURUSD)
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="BTC"
                  required
                  className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-sm font-mono uppercase outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Full Name / Description
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bitcoin / US Dollar"
                  required
                  className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Asset Market Type
                </label>
                <select
                  value={marketType}
                  onChange={(e) => setMarketType(e.target.value as MarketType)}
                  className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
                >
                  {MARKET_TYPES.map((m) => (
                    <option key={m} value={m} className="bg-white dark:bg-[#121215] text-zinc-900 dark:text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm cursor-pointer"
                >
                  {editingInstrument ? 'Save Changes' : 'Add Instrument'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#121215] border border-red-200 dark:border-red-900/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
              Delete {deleteTarget.symbol}?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Are you sure you want to remove this instrument? Existing trades referencing it will remain intact.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
