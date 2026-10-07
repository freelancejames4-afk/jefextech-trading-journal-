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
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface InstrumentsViewProps {
  onSelectInstrument?: (instrumentId: string) => void;
}

export const InstrumentsView: React.FC<InstrumentsViewProps> = ({ onSelectInstrument }) => {
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
        showToast(`Instrument ${symbol.toUpperCase()} added to your portfolio!`, 'success');
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

  // Compute metrics per instrument from real trades
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
          <h2 className="text-xl font-bold text-white tracking-tight">
            Trading Instruments
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your watched currency pairs, cryptos, and commodities
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRestoreStarter}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#16223B] hover:bg-[#1C2A48] border border-[#1E2B45] rounded-lg transition-colors cursor-pointer"
            title="Restore Starter List (BTC, ETH, SOL, HYPE, XAUUSD, EURUSD)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#2F80FF]" />
            <span className="hidden sm:inline">Add Defaults</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2F80FF] hover:bg-[#2F80FF]/90 rounded-lg shadow-lg shadow-[#2F80FF]/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Instrument</span>
          </button>
        </div>
      </div>

      {/* Instruments Grid */}
      {instruments.length === 0 ? (
        <div className="bg-[#111A2E] border border-[#1E2B45] rounded-xl p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#16223B] border border-[#1E2B45] flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Coins className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            No Instruments Configured
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Add your favorite crypto pairs, forex pairs, or commodities to start logging trades.
          </p>
          <button
            onClick={handleRestoreStarter}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2F80FF] hover:bg-[#2F80FF]/90 rounded-lg shadow-lg shadow-[#2F80FF]/25 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
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
                className="group relative bg-[#111A2E] hover:bg-[#16223B] border border-[#1E2B45] hover:border-[#2F80FF]/40 rounded-xl p-5 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-mono text-white tracking-tight group-hover:text-[#2F80FF] transition-colors">
                          {inst.symbol}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#0B1220] border border-[#1E2B45] text-slate-300">
                          {inst.market_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {inst.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(inst)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-[#0B1220] rounded-md transition-colors"
                        title="Edit instrument"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(inst)}
                        className="p-1.5 text-slate-400 hover:text-[#FF4D5E] hover:bg-[#FF4D5E]/10 rounded-md transition-colors"
                        title="Delete instrument"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Instrument Stats */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-[#0B1220]/60 rounded-lg border border-[#1E2B45]/60 mt-3 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Trades</span>
                      <span className="text-white font-medium tabular-nums">
                        {stats.tradesCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Win %</span>
                      <span className="text-[#2F80FF] font-medium tabular-nums">
                        {stats.tradesCount > 0 ? `${stats.winRate.toFixed(0)}%` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Net P&L</span>
                      <span
                        className={`font-bold tabular-nums ${
                          isProfit
                            ? 'text-[#00C896]'
                            : isLoss
                            ? 'text-[#FF4D5E]'
                            : 'text-slate-400'
                        }`}
                      >
                        {stats.netPnl > 0 ? '+' : ''}${stats.netPnl.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1E2B45]/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Available in Add Trade</span>
                  <span className="font-mono text-[#2F80FF]">Active</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Instrument Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#111A2E] border border-[#1E2B45] rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2B45] mb-4">
              <h3 className="text-base font-bold text-white">
                {editingInstrument ? 'Edit Instrument' : '+ Add New Instrument'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Ticker / Symbol (e.g. BTC, XAUUSD, EURUSD)
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="BTC"
                  required
                  className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-sm font-mono uppercase outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name / Description
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bitcoin / US Dollar"
                  required
                  className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Asset Market Type
                </label>
                <select
                  value={marketType}
                  onChange={(e) => setMarketType(e.target.value as MarketType)}
                  className="w-full bg-[#16223B] border border-[#1E2B45] focus:border-[#2F80FF] text-white px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                >
                  {MARKET_TYPES.map((m) => (
                    <option key={m} value={m} className="bg-[#111A2E] text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2B45]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#16223B] border border-[#1E2B45] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#2F80FF] hover:bg-[#2F80FF]/90 rounded-lg shadow-lg shadow-[#2F80FF]/25"
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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111A2E] border border-[#FF4D5E]/40 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-[#FF4D5E]/15 text-[#FF4D5E] flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Delete {deleteTarget.symbol}?
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to remove this instrument? Existing trades referencing it will remain intact.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#16223B] border border-[#1E2B45] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#FF4D5E] hover:bg-[#FF4D5E]/90 rounded-lg shadow-lg shadow-[#FF4D5E]/20"
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
