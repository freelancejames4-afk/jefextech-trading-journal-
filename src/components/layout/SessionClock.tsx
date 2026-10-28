import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, Globe, ChevronDown } from 'lucide-react';
import { getLiveNigerianClock, getSessionStatus } from '../../lib/tradingSessions';

export const SessionClock: React.FC = () => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const clock = getLiveNigerianClock(now);
  const sessions = getSessionStatus(now);

  return (
    <div className="relative">
      <div
        onClick={() => setShowDetails((prev) => !prev)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 text-xs font-mono cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors select-none"
        title="Click to view all market session windows in Nigerian time"
      >
        {/* Live Nigerian Time */}
        <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-bold tracking-tight">{clock.timeStringNoSec}</span>
          <span className="text-[10px] text-zinc-400 font-medium">WAT</span>
        </div>

        <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700 mx-0.5 hidden sm:block" />

        {/* Overlap Highlight in Gold when active */}
        {sessions.overlap.isOpen ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold tracking-wide animate-pulse">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span>London + NY Overlap</span>
          </span>
        ) : (
          /* Individual Session Badges */
          <div className="hidden sm:flex items-center gap-1">
            {/* Tokyo */}
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                sessions.tokyo.isOpen
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-400'
              }`}
            >
              Tokyo
            </span>

            {/* London */}
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                sessions.london.isOpen
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-400'
              }`}
            >
              London
            </span>

            {/* New York */}
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                sessions.newyork.isOpen
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-400'
              }`}
            >
              NY
            </span>
          </div>
        )}

        {/* Small arrow indicator */}
        <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown details popup */}
      {showDetails && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 z-50 w-72 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-zinc-900 dark:text-white">Global Market Sessions</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Africa/Lagos</span>
          </div>

          <div className="space-y-2 font-mono">
            {/* Tokyo */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200/60 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${sessions.tokyo.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                <span className="font-semibold text-zinc-900 dark:text-white">Tokyo</span>
              </div>
              <div className="text-right text-[11px]">
                <div className="text-zinc-600 dark:text-zinc-300">{sessions.tokyo.openLagos} – {sessions.tokyo.closeLagos}</div>
                <div className="text-[9px] text-zinc-400 font-sans">09:00 – 18:00 JST</div>
              </div>
            </div>

            {/* London */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200/60 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${sessions.london.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                <span className="font-semibold text-zinc-900 dark:text-white">London</span>
              </div>
              <div className="text-right text-[11px]">
                <div className="text-zinc-600 dark:text-zinc-300">{sessions.london.openLagos} – {sessions.london.closeLagos}</div>
                <div className="text-[9px] text-zinc-400 font-sans">08:00 – 16:30 BST/GMT</div>
              </div>
            </div>

            {/* New York */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200/60 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${sessions.newyork.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                <span className="font-semibold text-zinc-900 dark:text-white">New York</span>
              </div>
              <div className="text-right text-[11px]">
                <div className="text-zinc-600 dark:text-zinc-300">{sessions.newyork.openLagos} – {sessions.newyork.closeLagos}</div>
                <div className="text-[9px] text-zinc-400 font-sans">08:00 – 17:00 EDT/EST</div>
              </div>
            </div>

            {/* Overlap */}
            <div className={`flex items-center justify-between p-2 rounded-xl border ${sessions.overlap.isOpen ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400' : 'bg-zinc-50 dark:bg-[#18181B] border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold">London + NY</span>
              </div>
              <div className="text-right text-[11px]">
                <div>{sessions.overlap.openLagos} – {sessions.overlap.closeLagos}</div>
                <div className="text-[9px] text-amber-600/80 dark:text-amber-400/80 font-sans font-medium">Peak Global Liquidity</div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 leading-tight">
            Times automatically adjust when the UK and US change their clocks via browser Intl.
          </div>
        </div>
      )}
    </div>
  );
};
