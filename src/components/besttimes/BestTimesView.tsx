import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Sparkles,
  AlertTriangle,
  Newspaper,
  ShieldAlert,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  Edit2,
  Save,
  RotateCcw,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { useJournal } from '../../contexts/JournalContext';
import { useToast } from '../common/Toast';
import {
  DEFAULT_INSTRUMENT_RULES,
  getLiveNigerianClock,
  getSessionStatus,
  evaluateInstrumentBestTime,
  getUtcForLocalTime,
  formatLagosTime,
} from '../../lib/tradingSessions';

export const BestTimesView: React.FC = () => {
  const { instruments, bestTimesOverrides, updateBestTimeOverride, resetBestTimeOverrides } = useJournal();
  const { showToast } = useToast();

  const [now, setNow] = useState<Date>(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState<'All' | 'Forex' | 'Commodity/Indices' | 'Crypto' | 'GoodNow'>('All');

  // Edit window override modal
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');

  // Clock tick every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const clock = getLiveNigerianClock(now);
  const sessions = getSessionStatus(now);

  // US Major News time (8:30 AM America/New_York) converted to Lagos time
  const usNewsUtc = getUtcForLocalTime('America/New_York', 8, 30, now);
  const usNewsLagos = formatLagosTime(usNewsUtc);

  // Evaluate all rules
  const evaluatedList = useMemo(() => {
    // Combine default rules with any user-added instruments
    const ruleMap = new Map(DEFAULT_INSTRUMENT_RULES.map((r) => [r.symbol.toUpperCase(), r]));

    // Check if user has instruments not in default list
    instruments.forEach((inst) => {
      const sym = inst.symbol.toUpperCase();
      if (!ruleMap.has(sym)) {
        const isCrypto = inst.market_type === 'Crypto';
        ruleMap.set(sym, {
          symbol: sym,
          name: inst.name,
          marketType: inst.market_type as any,
          sessionDescription: isCrypto
            ? 'New York Session & Tokyo Open'
            : 'London Open & London/NY Overlap',
          windows: [
            { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 11, endMinute: 0 },
            { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 11, endMinute: 30 },
          ],
        });
      }
    });

    const list = Array.from(ruleMap.values()).map((rule) => {
      const customOverride = bestTimesOverrides[rule.symbol.toUpperCase()];
      return evaluateInstrumentBestTime(rule, now, customOverride);
    });

    return list;
  }, [instruments, bestTimesOverrides, now]);

  // Filter list
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return evaluatedList.filter((item) => {
      const matchesSearch =
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.sessionDescription.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (marketFilter === 'All') return true;
      if (marketFilter === 'GoodNow') return item.status === 'good';
      if (marketFilter === 'Commodity/Indices') {
        return (
          item.marketType === 'Commodity/Indices' ||
          item.marketType === 'Commodities' ||
          item.marketType === 'Indices'
        );
      }
      return item.marketType === marketFilter;
    });
  }, [evaluatedList, searchQuery, marketFilter]);

  const handleStartEdit = (symbol: string, currentDesc: string) => {
    setEditingSymbol(symbol);
    setEditDescription(currentDesc);
  };

  const handleSaveEdit = async () => {
    if (!editingSymbol) return;
    if (!editDescription.trim()) {
      showToast('Please enter a window description', 'warning');
      return;
    }

    try {
      await updateBestTimeOverride(editingSymbol, editDescription.trim());
      showToast(`Updated best time window for ${editingSymbol}`, 'success');
      setEditingSymbol(null);
    } catch {
      showToast('Failed to save override', 'error');
    }
  };

  const handleResetAllOverrides = async () => {
    if (!confirm('Reset all custom instrument window overrides back to standard session rules?')) return;
    try {
      await resetBestTimeOverrides();
      showToast('All instrument windows restored to defaults', 'info');
    } catch {
      showToast('Failed to reset overrides', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Best Trading Times
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold">
              Live DST Engine
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Optimal execution windows for each pair calculated dynamically in Nigerian Time (Africa/Lagos)
          </p>
        </div>

        {/* Live Clock Card */}
        <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Clock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                {clock.timeString}
              </span>
              <span className="text-[10px] px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                WAT
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 font-medium">
              {clock.weekday}, {clock.dateString}
            </div>
          </div>
        </div>
      </div>

      {/* Weekend Banner (Saturday & Sunday) */}
      {clock.isForexWeekend && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/60 flex items-start sm:items-center gap-3.5 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 leading-relaxed">
            <span className="font-bold block sm:inline mr-2">
              Forex &amp; Commodities Market Closed for the Weekend.
            </span>
            <span>
              Forex pairs, Gold, and Indices are inactive until Sunday 10:00 PM WAT. Crypto assets (BTC, ETH, SOL, HYPE) remain active 24/7 with thinner weekend liquidity.
            </span>
          </div>
        </div>
      )}

      {/* Session Windows Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tokyo */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          sessions.tokyo.isOpen
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400/80 dark:border-emerald-700/80'
            : 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">Tokyo Session</span>
            <span className={`w-2 h-2 rounded-full ${sessions.tokyo.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
          </div>
          <div className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {sessions.tokyo.openLagos} – {sessions.tokyo.closeLagos}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            09:00 – 18:00 JST (Asian Liquidity)
          </div>
        </div>

        {/* London */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          sessions.london.isOpen
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400/80 dark:border-emerald-700/80'
            : 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">London Session</span>
            <span className={`w-2 h-2 rounded-full ${sessions.london.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
          </div>
          <div className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {sessions.london.openLagos} – {sessions.london.closeLagos}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            08:00 – 16:30 BST/GMT (High Volume)
          </div>
        </div>

        {/* New York */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          sessions.newyork.isOpen
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400/80 dark:border-emerald-700/80'
            : 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">New York Session</span>
            <span className={`w-2 h-2 rounded-full ${sessions.newyork.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
          </div>
          <div className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {sessions.newyork.openLagos} – {sessions.newyork.closeLagos}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            08:00 – 17:00 EDT/EST (Dollar Dominance)
          </div>
        </div>

        {/* London + NY Overlap (Gold Highlight) */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          sessions.overlap.isOpen
            ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
            : 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>London + NY Overlap</span>
            </span>
            <span className={`w-2 h-2 rounded-full ${sessions.overlap.isOpen ? 'bg-amber-500 animate-pulse' : 'bg-zinc-400'}`} />
          </div>
          <div className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
            {sessions.overlap.openLagos} – {sessions.overlap.closeLagos}
          </div>
          <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80 mt-0.5 font-medium">
            🔥 Highest Daily Market Volatility
          </div>
        </div>
      </div>

      {/* Times to Avoid & Major News Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Times to Avoid */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4.5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white font-mono">
                Times to Avoid (Dead Zones)
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">High spread risk and erratic low liquidity</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200/60 dark:border-zinc-800 flex items-start gap-2.5">
              <span className="font-mono text-rose-600 dark:text-rose-400 font-bold shrink-0 mt-0.5">
                11:00 PM – 1:00 AM WAT
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                <strong>Bank Rollover Period:</strong> Liquidity drops severely, spreads blow out 5x–10x, and swap fees are charged. Avoid new entries.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200/60 dark:border-zinc-800 flex items-start gap-2.5">
              <span className="font-mono text-rose-600 dark:text-rose-400 font-bold shrink-0 mt-0.5">
                Friday After 8:00 PM WAT
              </span>
              <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                <strong>Pre-Weekend Close:</strong> Big desks square positions. High risk of slippage and unpredictable Monday weekend gaps.
              </p>
            </div>
          </div>
        </div>

        {/* Major News Notice */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4.5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white font-mono">
                Major US Economic Releases
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">High-impact red folder event discipline</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-zinc-700 dark:text-zinc-300 space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-amber-700 dark:text-amber-400">
                8:30 AM New York Time
              </span>
              <span className="text-[11px] font-semibold text-zinc-900 dark:text-white bg-white dark:bg-[#121215] px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                = {usNewsLagos} WAT
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <strong>Rule:</strong> Avoid opening positions <strong>15 minutes before and 15 minutes after</strong> major US releases (NFP, CPI, Core PPI, FOMC rate decisions). Spreads surge and slippage can wipe stop-losses.
            </p>
          </div>
        </div>
      </div>

      {/* Instruments Prime Windows Table */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pair e.g. EURUSD, XAUUSD, BTC..."
              className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white pl-9 pr-8 py-2 rounded-xl outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'All', label: 'All Pairs' },
                { id: 'GoodNow', label: 'Good Time Now 🔥' },
                { id: 'Forex', label: 'Forex' },
                { id: 'Commodity/Indices', label: 'Commodities & Indices' },
                { id: 'Crypto', label: 'Crypto' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setMarketFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                  marketFilter === f.id
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}

            {Object.keys(bestTimesOverrides).length > 0 && (
              <button
                onClick={handleResetAllOverrides}
                className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-1 cursor-pointer"
                title="Reset custom window overrides"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#0E0E11] text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-4">Instrument / Pair</th>
                <th className="py-3 px-4">Market</th>
                <th className="py-3 px-4">Best Windows (Nigerian Time)</th>
                <th className="py-3 px-4">Session Characteristic</th>
                <th className="py-3 px-4 text-right">Status Now</th>
                <th className="py-3 px-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70 font-sans">
              {filteredList.map((item) => {
                const hasCustomOverride = Boolean(bestTimesOverrides[item.symbol.toUpperCase()]);

                return (
                  <tr
                    key={item.symbol}
                    className="hover:bg-zinc-50/80 dark:hover:bg-[#18181B]/50 transition-colors"
                  >
                    {/* Instrument */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-900 dark:text-white text-sm">
                          {item.symbol}
                        </span>
                        {item.tag && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                            item.tag.includes('volatility')
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400'
                              : item.tag.includes('24/7')
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400'
                          }`}>
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400">{item.name}</div>
                    </td>

                    {/* Market */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {item.marketType}
                      </span>
                    </td>

                    {/* Best Windows in Nigerian Time */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="space-y-0.5">
                        {item.lagosWindowStrings.map((wStr, i) => (
                          <div
                            key={i}
                            className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs"
                          >
                            {wStr}
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-sans mt-0.5 flex items-center gap-1">
                        <span>{item.sessionDescription}</span>
                        {hasCustomOverride && (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[9px] font-mono">
                            (custom)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Characteristics */}
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs">
                      {item.marketType === 'Crypto' ? (
                        <span>24/7 active; peak institutional liquidity in NY + Tokyo</span>
                      ) : item.symbol === 'XAUUSD' ? (
                        <span>London Gold Fix + NY Morning yield highest momentum</span>
                      ) : item.symbol === 'NAS100' || item.symbol === 'US30' ? (
                        <span>US cash equity open (first 3 hrs) captures institutional order flow</span>
                      ) : item.symbol.includes('JPY') ? (
                        <span>Tokyo flow + London/NY overlap provides major volatility</span>
                      ) : (
                        <span>London open expansion &amp; NY overlap volume confluence</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'good' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60 font-semibold text-[11px] font-mono">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Good time now</span>
                        </span>
                      ) : item.status === 'upcoming' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 font-semibold text-[11px] font-mono">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>{item.statusText}</span>
                        </span>
                      ) : item.status === 'weekend_closed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800 font-semibold text-[11px] font-mono">
                          <span>Weekend Closed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-mono">
                          <span>Off hours</span>
                        </span>
                      )}
                    </td>

                    {/* Edit shortcut */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleStartEdit(item.symbol, item.sessionDescription)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title={`Customize window for ${item.symbol}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Custom Window Modal */}
      {editingSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white font-mono">
                  Customize Best Time for {editingSymbol}
                </h3>
                <p className="text-xs text-zinc-500">Edit description or custom window rules</p>
              </div>
              <button
                onClick={() => setEditingSymbol(null)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Optimal Session Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="e.g. London Open (first 3 hrs) & London/NY Overlap"
                  className="w-full bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 text-zinc-900 dark:text-white p-3 rounded-xl text-xs outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-[#18181B] rounded-xl text-[11px] text-zinc-500 leading-relaxed border border-zinc-200/60 dark:border-zinc-800">
                Custom adjustments are saved to your Supabase account under the <code className="text-emerald-600 dark:text-emerald-400 font-mono">best_times</code> table with Row Level Security.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSymbol(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#18181B] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
