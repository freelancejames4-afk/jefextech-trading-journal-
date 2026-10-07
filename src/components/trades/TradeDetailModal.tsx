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
  Maximize2,
  Calendar,
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
    ? 'text-[#00C896]'
    : isLoss
    ? 'text-[#FF4D5E]'
    : 'text-[#F59E0B]';

  const formatPrice = (val?: number | null) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });
  };

  // Calculate Risk:Reward if SL is present
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
        <div className="relative w-full max-w-3xl bg-[#111A2E] border border-[#1E2B45] rounded-xl shadow-2xl overflow-hidden my-6">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2B45] bg-[#0B1220]/60">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  trade.direction === 'buy'
                    ? 'bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/30'
                    : 'bg-[#FF4D5E]/15 text-[#FF4D5E] border border-[#FF4D5E]/30'
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
                  <h2 className="text-lg font-bold text-white font-mono">
                    {trade.instrument?.symbol || 'UNKNOWN'}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {trade.instrument?.name || trade.instrument?.market_type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-[#16223B] hover:bg-[#1C2A48] border border-[#1E2B45] rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#2F80FF]" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#FF4D5E] hover:bg-[#FF4D5E]/10 border border-[#1E2B45] hover:border-[#FF4D5E]/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#16223B] transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#16223B] border border-[#1E2B45] p-3.5 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                  Net Realized P&L
                </span>
                <span className={`text-xl font-bold font-mono tabular-nums ${pnlColor}`}>
                  {trade.pnl > 0 ? '+' : ''}${Number(trade.pnl).toFixed(2)}
                </span>
              </div>

              <div className="bg-[#16223B] border border-[#1E2B45] p-3.5 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                  Outcome
                </span>
                <span
                  className={`text-sm font-bold uppercase font-mono ${
                    trade.result === 'win'
                      ? 'text-[#00C896]'
                      : trade.result === 'loss'
                      ? 'text-[#FF4D5E]'
                      : 'text-[#F59E0B]'
                  }`}
                >
                  {trade.result}
                </span>
              </div>

              <div className="bg-[#16223B] border border-[#1E2B45] p-3.5 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                  Lot Size
                </span>
                <span className="text-sm font-bold font-mono text-white tabular-nums">
                  {trade.lot_size} Lots
                </span>
              </div>

              <div className="bg-[#16223B] border border-[#1E2B45] p-3.5 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                  R:R Realized
                </span>
                <span className="text-sm font-bold font-mono text-[#2F80FF] tabular-nums">
                  {rrRatio ? `1 : ${rrRatio}` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Execution Price Levels */}
            <div className="bg-[#0B1220] border border-[#1E2B45] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 font-mono">
                Price Structure & Order Levels
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase mb-1">Entry Price</span>
                  <span className="text-white text-sm font-medium tabular-nums">
                    {formatPrice(trade.entry_price)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase mb-1">Exit Price</span>
                  <span className="text-white text-sm font-medium tabular-nums">
                    {formatPrice(trade.exit_price)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase mb-1">Stop Loss</span>
                  <span className="text-[#FF4D5E] text-sm font-medium tabular-nums">
                    {formatPrice(trade.stop_loss)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase mb-1">Take Profit</span>
                  <span className="text-[#00C896] text-sm font-medium tabular-nums">
                    {formatPrice(trade.take_profit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Strategy, Session, Emotion */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#16223B]/60 border border-[#1E2B45] rounded-lg">
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase font-mono mb-1">
                  <Tag className="w-3 h-3 text-[#2F80FF]" />
                  <span>Strategy</span>
                </span>
                <span className="text-xs text-white font-medium">
                  {trade.strategy || 'Unspecified'}
                </span>
              </div>

              <div className="p-3 bg-[#16223B]/60 border border-[#1E2B45] rounded-lg">
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase font-mono mb-1">
                  <Clock className="w-3 h-3 text-[#2F80FF]" />
                  <span>Session</span>
                </span>
                <span className="text-xs text-white font-medium">
                  {trade.session || 'Unspecified'}
                </span>
              </div>

              <div className="p-3 bg-[#16223B]/60 border border-[#1E2B45] rounded-lg">
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase font-mono mb-1">
                  <Smile className="w-3 h-3 text-[#2F80FF]" />
                  <span>Mindset / Emotion</span>
                </span>
                <span className="text-xs text-white font-medium">
                  {trade.emotion || 'Neutral'}
                </span>
              </div>
            </div>

            {/* Notes */}
            {trade.notes && (
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Execution Commentary
                </h3>
                <div className="p-4 bg-[#16223B]/50 border border-[#1E2B45] rounded-xl text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {trade.notes}
                </div>
              </div>
            )}

            {/* Screenshots Gallery */}
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                <span>Chart Screenshots ({trade.screenshot_urls?.length || 0})</span>
                <span className="text-[10px] text-slate-500 lowercase font-normal">Click image to expand full-screen</span>
              </h3>

              {!trade.screenshot_urls || trade.screenshot_urls.length === 0 ? (
                <div className="p-8 border border-dashed border-[#1E2B45] rounded-xl text-center text-xs text-slate-500 bg-[#0B1220]/40">
                  No chart screenshots attached to this trade.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trade.screenshot_urls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setZoomedImage(url)}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-[#1E2B45] bg-[#0B1220] cursor-zoom-in hover:border-[#2F80FF] transition-all shadow-md"
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

      {/* Confirmation Modal for Delete */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111A2E] border border-[#FF4D5E]/40 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-[#FF4D5E]/15 text-[#FF4D5E] flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Delete Trade Record?</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to delete this {trade.instrument?.symbol} trade? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#16223B] border border-[#1E2B45] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#FF4D5E] hover:bg-[#FF4D5E]/90 rounded-lg shadow-lg shadow-[#FF4D5E]/20"
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
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed chart screenshot"
            referrerPolicy="no-referrer"
            className="max-w-[95vw] max-h-[92vh] object-contain rounded-lg shadow-2xl border border-[#1E2B45]"
          />
        </div>
      )}
    </>
  );
};
