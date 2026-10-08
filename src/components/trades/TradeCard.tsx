import React from 'react';
import { Trade } from '../../types';
import { ArrowUpRight, ArrowDownRight, Image as ImageIcon, Clock } from 'lucide-react';

interface TradeCardProps {
  trade: Trade;
  onClick: () => void;
}

export const TradeCard: React.FC<TradeCardProps> = ({ trade, onClick }) => {
  const isProfit = trade.pnl > 0 || trade.result === 'win';
  const isLoss = trade.pnl < 0 || trade.result === 'loss';

  const indicatorColor = isProfit
    ? 'bg-emerald-500'
    : isLoss
    ? 'bg-red-500'
    : 'bg-amber-500';

  const pnlColor = isProfit
    ? 'text-emerald-600 dark:text-emerald-400'
    : isLoss
    ? 'text-red-600 dark:text-red-400'
    : 'text-amber-600 dark:text-amber-400';

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
      className="group relative bg-white dark:bg-[#121215] hover:bg-zinc-50 dark:hover:bg-[#16161A] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-4 transition-all duration-150 cursor-pointer shadow-sm hover:shadow overflow-hidden"
    >
      {/* 3px indicator line on left edge */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3.5px] ${indicatorColor}`} />

      <div className="pl-2">
        {/* Top row: Symbol, Direction Pill & P&L */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-zinc-900 dark:text-white font-mono tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {trade.instrument?.symbol || 'UNKNOWN'}
            </span>

            {/* Direction Pill */}
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                trade.direction === 'buy'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
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
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              {trade.lot_size} lot{trade.lot_size !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Net P&L */}
          <div className="text-right">
            <div className={`text-base font-bold font-mono tabular-nums ${pnlColor}`}>
              {pnlSign}${Number(trade.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 dark:text-zinc-500 font-medium">
              {trade.result}
            </div>
          </div>
        </div>

        {/* Middle row: Execution prices */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 px-2.5 bg-zinc-50 dark:bg-[#18181B] rounded-lg border border-zinc-200 dark:border-zinc-800 mb-2.5 text-xs font-mono">
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase">Entry</span>
            <span className="text-zinc-800 dark:text-zinc-200 tabular-nums">{formatPrice(trade.entry_price)}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase">Exit</span>
            <span className="text-zinc-800 dark:text-zinc-200 tabular-nums">{formatPrice(trade.exit_price)}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase">Stop Loss</span>
            <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">{formatPrice(trade.stop_loss)}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase">Take Profit</span>
            <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">{formatPrice(trade.take_profit)}</span>
          </div>
        </div>

        {/* Bottom row: Strategy, Session, Emotion & Screenshots */}
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {trade.strategy && (
              <span className="text-[11px] text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded text-ellipsis max-w-[150px] truncate">
                {trade.strategy}
              </span>
            )}
            {trade.session && (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                <Clock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                <span>{trade.session}</span>
              </span>
            )}
            {trade.emotion && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-[#18181B] px-1.5 py-0.5 rounded">
                {trade.emotion}
              </span>
            )}
          </div>

          {trade.screenshot_urls && trade.screenshot_urls.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{trade.screenshot_urls.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
