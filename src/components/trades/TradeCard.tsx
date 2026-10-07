import React from 'react';
import { Trade } from '../../types';
import { ArrowUpRight, ArrowDownRight, Image as ImageIcon, Clock, Crosshair } from 'lucide-react';

interface TradeCardProps {
  trade: Trade;
  onClick: () => void;
}

export const TradeCard: React.FC<TradeCardProps> = ({ trade, onClick }) => {
  const isProfit = trade.pnl > 0 || trade.result === 'win';
  const isLoss = trade.pnl < 0 || trade.result === 'loss';
  const isBreakeven = !isProfit && !isLoss;

  const indicatorColor = isProfit
    ? 'bg-[#00C896]'
    : isLoss
    ? 'bg-[#FF4D5E]'
    : 'bg-[#F59E0B]';

  const pnlColor = isProfit
    ? 'text-[#00C896]'
    : isLoss
    ? 'text-[#FF4D5E]'
    : 'text-[#F59E0B]';

  const pnlSign = trade.pnl > 0 ? '+' : '';

  const formatPrice = (price?: number | null) => {
    if (price === undefined || price === null || isNaN(price)) return '—';
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#111A2E] hover:bg-[#16223B] border border-[#1E2B45] hover:border-[#2F80FF]/50 rounded-xl p-4 transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md hover:shadow-black/30 overflow-hidden"
    >
      {/* 3px indicator line on left edge */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3.5px] ${indicatorColor}`} />

      <div className="pl-2">
        {/* Top row: Symbol, Direction Pill & P&L */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-white font-mono tracking-tight group-hover:text-[#2F80FF] transition-colors">
              {trade.instrument?.symbol || 'UNKNOWN'}
            </span>

            {/* Direction Pill */}
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                trade.direction === 'buy'
                  ? 'bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/30'
                  : 'text-[#FF4D5E] bg-[#FF4D5E]/15 border border-[#FF4D5E]/30'
              }`}
            >
              {trade.direction === 'buy' ? (
                <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
              )}
              {trade.direction === 'buy' ? 'LONG' : 'SHORT'}
            </span>

            {/* Lot size */}
            <span className="text-xs text-slate-400 font-mono">
              {trade.lot_size} lot{trade.lot_size !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Prominent Net P&L */}
          <div className="text-right">
            <div className={`text-base font-bold font-mono tabular-nums ${pnlColor}`}>
              {pnlSign}${Number(trade.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium">
              {trade.result}
            </div>
          </div>
        </div>

        {/* Middle row: Execution prices */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 px-2.5 bg-[#0B1220]/50 rounded-lg border border-[#1E2B45]/60 mb-2.5 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Entry</span>
            <span className="text-slate-200 tabular-nums">{formatPrice(trade.entry_price)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Exit</span>
            <span className="text-slate-200 tabular-nums">{formatPrice(trade.exit_price)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Stop Loss</span>
            <span className="text-slate-400 tabular-nums">{formatPrice(trade.stop_loss)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Take Profit</span>
            <span className="text-slate-400 tabular-nums">{formatPrice(trade.take_profit)}</span>
          </div>
        </div>

        {/* Bottom row: Strategy, Session, Emotion & Screenshots */}
        <div className="flex items-center justify-between text-xs text-slate-400 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {trade.strategy && (
              <span className="text-[11px] text-slate-300 bg-[#16223B] border border-[#1E2B45] px-2 py-0.5 rounded text-ellipsis max-w-[150px] truncate">
                {trade.strategy}
              </span>
            )}
            {trade.session && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{trade.session}</span>
              </span>
            )}
            {trade.emotion && (
              <span className="text-[11px] text-slate-400 bg-[#0B1220]/60 px-1.5 py-0.5 rounded">
                {trade.emotion}
              </span>
            )}
          </div>

          {trade.screenshot_urls && trade.screenshot_urls.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-[#2F80FF] font-mono">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{trade.screenshot_urls.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
