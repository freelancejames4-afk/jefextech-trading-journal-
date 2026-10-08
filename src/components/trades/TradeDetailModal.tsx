import React, { useState } from 'react';
import { Trade } from '../../types';
import { useJournal } from '../../contexts/JournalContext';
import { useToast } from '../common/Toast';
import {
  X,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Tag,
  Smile,
  AlertTriangle,
  ZoomIn,
} from 'lucide-react';

interface TradeDetailModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  trade,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { deleteTrade } = useJournal();
  const { showToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (!isOpen || !trade) return null;

  const isProfit = trade.pnl > 0 || trade.result === 'win';
  const isLoss = trade.pnl < 0 || trade.result === 'loss';
  const pnlColor = isProfit
    ? 'text-emerald-600 dark:text-emerald-400'
    : isLoss
    ? 'text-red-600 dark:text-red-400'
    : 'text-amber-500';

  const formatPrice = (val?: number | null) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });
  };

  const calculateRR = () => {
    if (!trade.stop_loss || !trade.entry_price) return null;
    const risk = Math.abs(trade.entry_price - trade.stop_loss);
    if (risk === 0) return null;

    if (trade.exit_price) {
      const reward = Math.abs(trade.exit_price - trade.entry_price);
      return (reward / risk).toFixed(2);
    } else if (trade.take_profit) {
      const plannedReward = Math.abs(trade.take_profit - trade.entry_price);
      return (plannedReward / risk).toFixed(2);
    }
    return null;
  };

  const rrRatio = calculateRR();

  const handleDelete = async () => {
    try {
      await deleteTrade(trade.id);
      showToast('Trade record deleted', 'info');
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete trade', 'error');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
        <div className="relative w-full max-w-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 transition-colors">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#0E0E11]">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  trade.direction === 'buy'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}
              >
                {trade.direction === 'buy' ? (
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white font-mono">
                    {trade.instrument?.symbol || 'UNKNOWN'}
                  </h2>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {trade.instrument?.name || trade.instrument?.market_type}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  {new Date(trade.created_at).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  ·{' '}
                  {new Date(trade.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(trade)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#18181B] hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-zinc-200 dark:border-zinc-800 hover:border-red-300 dark:hover:border-red-800 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl">
                <span className="text-[10px] uppercase font-mono text-zinc-500 dark:text-zinc-400 block mb-0.5">
                  Net Realized P&L
                </span>
                <span className={`text-xl font-bold font-mono tabular-nums ${pnlColor}`}>
                  {trade.pnl > 0 ? '+' : ''}${Number(trade.pnl).toFixed(2)}
                </span>
              </div>

              <div className="bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl">
                <span className="text-[10px] uppercase font-mono text-zinc-500 dark:text-zinc-400 block mb-0.5">
                  Outcome
                </span>
                <span
                  className={`text-sm font-bold uppercase font-mono ${
                    trade.result === 'win'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : trade.result === 'loss'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-500'
                  }`}
                >
                  {trade.result}
                </span>
              </div>

              <div className="bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl">
                <span className="text-[10px] uppercase font-mono text-zinc-500 dark:text-zinc-400 block mb-0.5">
                  Lot Size
                </span>
                <span className="text-sm font-bold font-mono text-zinc-900 dark:text-white tabular-nums">
                  {trade.lot_size} Lots
                </span>
              </div>

              <div className="bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl">
                <span className="text-[10px] uppercase font-mono text-zinc-500 dark:text-zinc-400 block mb-0.5">
                  R:R Realized
                </span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {rrRatio ? `1 : ${rrRatio}` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Execution Price Levels */}
            <div className="bg-zinc-50/70 dark:bg-[#0E0E11] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-3 font-mono">
                Price Structure & Order Levels
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase mb-1 block">Entry Price</span>
                  <span className="text-zinc-900 dark:text-white text-sm font-medium tabular-nums">
                    {formatPrice(trade.entry_price)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase mb-1 block">Exit Price</span>
                  <span className="text-zinc-900 dark:text-white text-sm font-medium tabular-nums">
                    {formatPrice(trade.exit_price)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase mb-1 block">Stop Loss</span>
                  <span className="text-red-600 dark:text-red-400 text-sm font-medium tabular-nums">
                    {formatPrice(trade.stop_loss)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase mb-1 block">Take Profit</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium tabular-nums">
                    {formatPrice(trade.take_profit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Strategy, Session, Emotion */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-mono mb-1 flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Strategy</span>
                </span>
                <span className="text-xs text-zinc-900 dark:text-white font-medium">
                  {trade.strategy || 'Unspecified'}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-mono mb-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Session</span>
                </span>
                <span className="text-xs text-zinc-900 dark:text-white font-medium">
                  {trade.session || 'Unspecified'}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <span className="text-[10px] text-zinc-500 uppercase font-mono mb-1 flex items-center gap-1.5">
                  <Smile className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Mindset</span>
                </span>
                <span className="text-xs text-zinc-900 dark:text-white font-medium">
                  {trade.emotion || 'Neutral'}
                </span>
              </div>
            </div>

            {/* Notes */}
            {trade.notes && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                  Execution Commentary
                </h3>
                <div className="p-4 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {trade.notes}
                </div>
              </div>
            )}

            {/* Screenshots Gallery */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                <span>Chart Screenshots ({trade.screenshot_urls?.length || 0})</span>
                <span className="text-[10px] text-zinc-400 lowercase font-normal">Click image to expand full-screen</span>
              </h3>

              {!trade.screenshot_urls || trade.screenshot_urls.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-xs text-zinc-400 bg-zinc-50/50 dark:bg-[#18181B]/40">
                  No chart screenshots attached to this trade.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trade.screenshot_urls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setZoomedImage(url)}
                      className="group relative aspect-video rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#09090B] cursor-zoom-in hover:border-emerald-500 transition-all shadow-sm"
                    >
                      <img
                        src={url}
                        alt={`Trade screenshot ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium">
                        <ZoomIn className="w-5 h-5 text-white" />
                        <span>Click to Zoom</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#121215] border border-red-200 dark:border-red-900/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Delete Trade Record?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Are you sure you want to delete this {trade.instrument?.symbol} trade? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-sm cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoomed Image Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-70 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in cursor-zoom-out"
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed chart screenshot"
            referrerPolicy="no-referrer"
            className="max-w-[95vw] max-h-[92vh] object-contain rounded-xl shadow-2xl border border-zinc-800"
          />
        </div>
      )}
    </>
  );
};
