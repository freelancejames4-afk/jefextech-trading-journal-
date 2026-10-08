import React, { useState, useMemo } from 'react';
import { useJournal } from '../../contexts/JournalContext';
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart2,
  Activity,
} from 'lucide-react';

interface AnalyticsViewProps {
  onSelectJournalDay: (dateString: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onSelectJournalDay }) => {
  const { trades, analyticsStats, journalDays } = useJournal();

  // Calendar Heatmap state (viewing month/year)
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    equity: number;
    tradePnl: number;
    symbol: string;
    x: number;
    y: number;
  } | null>(null);

  // 1. Calculate Chronological Equity Curve
  const equityCurveData = useMemo(() => {
    if (trades.length === 0) return [];

    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let runningEquity = 0;
    const curve = [
      {
        index: 0,
        tradeId: 'start',
        date: sortedTrades[0]?.created_at?.split('T')[0] || 'Start',
        symbol: 'Initial',
        tradePnl: 0,
        equity: 0,
      },
    ];

    sortedTrades.forEach((trade, idx) => {
      const pnl = Number(trade.pnl) || 0;
      runningEquity += pnl;
      curve.push({
        index: idx + 1,
        tradeId: trade.id,
        date: trade.created_at ? trade.created_at.split('T')[0] : `Trade ${idx + 1}`,
        symbol: trade.instrument?.symbol || 'Trade',
        tradePnl: pnl,
        equity: runningEquity,
      });
    });

    return curve;
  }, [trades]);

  // 2. P&L by Instrument Breakdown
  const instrumentPnlBreakdown = useMemo(() => {
    const map: Record<string, { symbol: string; pnl: number; count: number; wins: number }> = {};

    trades.forEach((trade) => {
      const symbol = trade.instrument?.symbol || 'OTHER';
      const pnl = Number(trade.pnl) || 0;
      if (!map[symbol]) {
        map[symbol] = { symbol, pnl: 0, count: 0, wins: 0 };
      }
      map[symbol].pnl += pnl;
      map[symbol].count += 1;
      if (trade.result === 'win' || pnl > 0) {
        map[symbol].wins += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  // 3. Calendar Heatmap Data
  const heatmapMonthData = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const dayTradeMap: Record<string, { pnl: number; count: number; completed: boolean }> = {};

    trades.forEach((trade) => {
      const dateStr = trade.created_at?.split('T')[0];
      if (dateStr) {
        if (!dayTradeMap[dateStr]) {
          dayTradeMap[dateStr] = { pnl: 0, count: 0, completed: false };
        }
        dayTradeMap[dateStr].pnl += Number(trade.pnl) || 0;
        dayTradeMap[dateStr].count += 1;
      }
    });

    journalDays.forEach((jd) => {
      if (!dayTradeMap[jd.date]) {
        dayTradeMap[jd.date] = { pnl: 0, count: 0, completed: jd.completed };
      } else {
        dayTradeMap[jd.date].completed = jd.completed;
      }
    });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const data = dayTradeMap[dateStr] || { pnl: 0, count: 0, completed: false };
      days.push({
        dayNumber: d,
        dateString: dateStr,
        pnl: data.pnl,
        tradeCount: data.count,
        completed: data.completed,
      });
    }

    return { days, firstDayIndex, year, month };
  }, [currentMonthDate, trades, journalDays]);

  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // SVG Chart Geometry
  const chartWidth = 700;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 60 };

  const { pointsString, areaString, minEquity, maxEquity, zeroY } = useMemo(() => {
    if (equityCurveData.length <= 1) {
      return { pointsString: '', areaString: '', minEquity: 0, maxEquity: 0, zeroY: chartHeight / 2 };
    }

    const equities = equityCurveData.map((d) => d.equity);
    let min = Math.min(0, ...equities);
    let max = Math.max(0, ...equities);

    const range = max - min || 100;
    min -= range * 0.1;
    max += range * 0.1;

    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const getX = (idx: number) => padding.left + (idx / (equityCurveData.length - 1)) * innerWidth;
    const getY = (val: number) => padding.top + innerHeight - ((val - min) / (max - min)) * innerHeight;

    const zero = getY(0);

    const pts = equityCurveData.map((d, i) => `${getX(i)},${getY(d.equity)}`);
    const linePath = pts.join(' ');

    const areaPath = `${getX(0)},${zero} ` + linePath + ` ${getX(equityCurveData.length - 1)},${zero}`;

    return {
      pointsString: linePath,
      areaString: areaPath,
      minEquity: min,
      maxEquity: max,
      zeroY: zero,
    };
  }, [equityCurveData, chartWidth, chartHeight]);

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Performance Analytics & Heatmap
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Precision execution metrics calculated live from your Supabase trade database
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Net P&L */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-colors">
          <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
            Total Realized P&L
          </span>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              analyticsStats.totalPnl > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : analyticsStats.totalPnl < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-zinc-900 dark:text-white'
            }`}
          >
            {analyticsStats.totalPnl > 0 ? '+' : ''}${analyticsStats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
            {trades.length} recorded trades
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-colors">
          <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
            Execution Win Rate
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {analyticsStats.winRate.toFixed(1)}%
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{analyticsStats.winningTrades}W</span>
            <span>·</span>
            <span className="text-red-600 dark:text-red-400 font-semibold">{analyticsStats.losingTrades}L</span>
            <span>·</span>
            <span className="text-amber-500">{analyticsStats.breakevenTrades}BE</span>
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-colors">
          <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
            Profit Factor
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white tabular-nums">
            {analyticsStats.profitFactor.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono flex items-center justify-between">
            <span>Avg Win: ${analyticsStats.avgWin.toFixed(0)}</span>
            <span>Avg Loss: ${analyticsStats.avgLoss.toFixed(0)}</span>
          </div>
        </div>

        {/* Best Instrument */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-colors">
          <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
            Top Yield Instrument
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white tracking-tight">
            {analyticsStats.bestInstrument ? analyticsStats.bestInstrument.symbol : '—'}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono font-semibold">
            {analyticsStats.bestInstrument
              ? `+$${analyticsStats.bestInstrument.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'No closed trades yet'}
          </div>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cumulative Equity Curve ($)</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Account trajectory across all closed executions</p>
          </div>
          <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
            Net: <span className={analyticsStats.totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>${analyticsStats.totalPnl.toFixed(2)}</span>
          </div>
        </div>

        {trades.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs">
            <TrendingUp className="w-8 h-8 mb-2 opacity-40 text-emerald-500" />
            <span>No trades yet. Log your first trade to plot your equity curve.</span>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-56 sm:h-64 select-none"
            >
              <defs>
                <linearGradient id="emeraldEquityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Zero baseline */}
              <line
                x1={padding.left}
                y1={zeroY}
                x2={chartWidth - padding.right}
                y2={zeroY}
                stroke="currentColor"
                className="text-zinc-200 dark:text-zinc-800"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={zeroY + 3}
                fill="currentColor"
                className="text-zinc-400 dark:text-zinc-500"
                fontSize="9"
                fontFamily="JetBrains Mono"
                textAnchor="end"
              >
                $0
              </text>

              {/* Top value */}
              <text
                x={padding.left - 8}
                y={padding.top + 5}
                fill="currentColor"
                className="text-zinc-400 dark:text-zinc-500"
                fontSize="9"
                fontFamily="JetBrains Mono"
                textAnchor="end"
              >
                ${maxEquity.toFixed(0)}
              </text>

              {/* Bottom value */}
              <text
                x={padding.left - 8}
                y={chartHeight - padding.bottom + 10}
                fill="currentColor"
                className="text-zinc-400 dark:text-zinc-500"
                fontSize="9"
                fontFamily="JetBrains Mono"
                textAnchor="end"
              >
                ${minEquity.toFixed(0)}
              </text>

              {/* Area under curve */}
              {areaString && (
                <polygon
                  points={areaString}
                  fill="url(#emeraldEquityGradient)"
                />
              )}

              {/* Main curve polyline */}
              {pointsString && (
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsString}
                />
              )}

              {/* Data points */}
              {equityCurveData.map((d, i) => {
                const innerWidth = chartWidth - padding.left - padding.right;
                const innerHeight = chartHeight - padding.top - padding.bottom;
                const cx = padding.left + (i / (equityCurveData.length - 1)) * innerWidth;
                const cy = padding.top + innerHeight - ((d.equity - minEquity) / (maxEquity - minEquity)) * innerHeight;

                return (
                  <circle
                    key={d.tradeId}
                    cx={cx}
                    cy={cy}
                    r={hoveredPoint?.equity === d.equity ? 5 : 3}
                    fill={d.tradePnl >= 0 ? '#10B981' : '#EF4444'}
                    stroke="currentColor"
                    className="text-white dark:text-zinc-950 cursor-pointer transition-all hover:scale-150"
                    strokeWidth="1.5"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        date: d.date,
                        equity: d.equity,
                        tradePnl: d.tradePnl,
                        symbol: d.symbol,
                        x: cx,
                        y: cy,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 px-2.5 py-1.5 rounded-lg text-xs font-mono shadow-xl z-20"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                  transform: 'translate(-50%, -125%)',
                }}
              >
                <div className="font-bold text-emerald-400 dark:text-emerald-600">{hoveredPoint.symbol} · {hoveredPoint.date}</div>
                <div>
                  Trade P&L: <span className={hoveredPoint.tradePnl >= 0 ? 'text-emerald-400 dark:text-emerald-600' : 'text-red-400'}>${hoveredPoint.tradePnl.toFixed(2)}</span>
                </div>
                <div>Equity: ${hoveredPoint.equity.toFixed(2)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Row: Calendar Heatmap & P&L per Instrument */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Heatmap */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Calendar Heatmap</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Green = Profit, Red = Drawdown. Click to jump to day.</p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 font-mono px-2">
                {monthName}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-[10px] font-mono text-zinc-400 uppercase">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty offset padding cells */}
            {Array.from({ length: heatmapMonthData.firstDayIndex }).map((_, i) => (
              <div key={`offset-${i}`} className="aspect-square rounded-lg bg-zinc-50 dark:bg-[#18181B]/40" />
            ))}

            {/* Month Day Cells */}
            {heatmapMonthData.days.map((day) => {
              const hasTrades = day.tradeCount > 0;
              const isProfit = day.pnl > 0;
              const isLoss = day.pnl < 0;

              let cellBg = 'bg-zinc-50 dark:bg-[#18181B] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 border border-zinc-200/60 dark:border-zinc-800';
              let textColor = 'text-zinc-500 dark:text-zinc-400';

              if (hasTrades) {
                if (isProfit) {
                  cellBg = 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50';
                  textColor = 'text-emerald-700 dark:text-emerald-400 font-bold';
                } else if (isLoss) {
                  cellBg = 'bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700/60 hover:bg-red-100 dark:hover:bg-red-900/50';
                  textColor = 'text-red-700 dark:text-red-400 font-bold';
                } else {
                  cellBg = 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100';
                  textColor = 'text-amber-700 dark:text-amber-400 font-bold';
                }
              }

              return (
                <button
                  key={day.dateString}
                  onClick={() => onSelectJournalDay(day.dateString)}
                  title={`${day.dateString}: ${day.tradeCount} trades, P&L: $${day.pnl.toFixed(2)}`}
                  className={`aspect-square rounded-xl p-1 flex flex-col justify-between items-center transition-all cursor-pointer ${cellBg}`}
                >
                  <span className={`text-[10px] font-mono self-start ${textColor}`}>
                    {day.dayNumber}
                  </span>

                  {hasTrades && (
                    <span className="text-[9px] font-mono tabular-nums leading-none">
                      {day.pnl > 0 ? '+' : ''}${Math.round(day.pnl)}
                    </span>
                  )}

                  {day.completed && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 self-end mt-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* P&L per Instrument Chart */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col transition-colors">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>P&L by Instrument</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total net dollar returns grouped by asset</p>
          </div>

          {instrumentPnlBreakdown.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs p-8">
              <span>No trade records available yet to display per-instrument performance.</span>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-72 pr-1">
              {instrumentPnlBreakdown.map((item) => {
                const isPositive = item.pnl >= 0;
                const maxAbs = Math.max(...instrumentPnlBreakdown.map((i) => Math.abs(i.pnl))) || 1;
                const barWidth = Math.min(100, Math.max(8, (Math.abs(item.pnl) / maxAbs) * 100));

                return (
                  <div key={item.symbol} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 dark:text-white">{item.symbol}</span>
                        <span className="text-[10px] text-zinc-500">
                          {item.count} trade{item.count !== 1 ? 's' : ''} ({item.wins}W)
                        </span>
                      </div>
                      <span
                        className={`font-bold tabular-nums ${
                          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}${item.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-zinc-100 dark:bg-[#18181B] rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isPositive ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
