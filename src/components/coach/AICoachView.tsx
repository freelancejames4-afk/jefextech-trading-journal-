import React from 'react';
import {
  Bot,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Clock,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { AICoachChat } from './AICoachChat';
import { useCoach } from '../../contexts/CoachContext';
import { useJournal } from '../../contexts/JournalContext';

export const AICoachView: React.FC = () => {
  const { sendMessage, isTyping } = useCoach();
  const { analyticsStats, trades, instruments } = useJournal();

  const handlePromptClick = (prompt: string) => {
    if (isTyping) return;
    sendMessage(prompt);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Bot className="w-4 h-4 stroke-[2.5]" />
            </span>
            <span>AI Trading Coach</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Personalized execution reviews, behavioral psychology feedback & session timing guidance via your n8n workflow.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>n8n Webhook Connected</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chat on Left, Context & Quick Prompts on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): The Chat Window */}
        <div className="lg:col-span-2 h-[680px] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col bg-white dark:bg-[#121215]">
          <AICoachChat />
        </div>

        {/* Right Column (Span 1): Trading Context & Quick Prompts */}
        <div className="space-y-6">
          {/* Live Context Card */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#18181B] flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                Your Trading Ledger Context
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Win Rate</span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {analyticsStats.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Total Trades</span>
                <span className="text-base font-bold font-mono text-zinc-900 dark:text-white">
                  {analyticsStats.totalTrades}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Net P&L</span>
                <span
                  className={`text-base font-bold font-mono ${
                    analyticsStats.totalPnl >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {analyticsStats.totalPnl >= 0 ? '+' : ''}${analyticsStats.totalPnl.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Active Pairs</span>
                <span className="text-base font-bold font-mono text-zinc-900 dark:text-white">
                  {instruments.length}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              When you consult the coach, your logged-in user credentials and session are authenticated via Supabase bearer tokens.
            </p>
          </div>

          {/* Quick Prompts by Category */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                Coach Inquiries
              </h2>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase">
                Psychology & Performance
              </span>
              <button
                type="button"
                onClick={() => handlePromptClick('What is my biggest mistake this week?')}
                disabled={isTyping}
                className="w-full text-left p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 text-xs text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <span>What is my biggest mistake this week?</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              </button>
              <button
                type="button"
                onClick={() => handlePromptClick('Which pair am I best at according to my journal?')}
                disabled={isTyping}
                className="w-full text-left p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 text-xs text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <span>Which pair am I best at?</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
              <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase">
                Market Sentiment & Macro
              </span>
              <button
                type="button"
                onClick={() => handlePromptClick('Is gold bullish or bearish today?')}
                disabled={isTyping}
                className="w-full text-left p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 text-xs text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <span>Is gold bullish or bearish today?</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              </button>
              <button
                type="button"
                onClick={() => handlePromptClick('Give me a strategy review for EURUSD during London Open.')}
                disabled={isTyping}
                className="w-full text-left p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 text-xs text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <span>EURUSD London Open strategy review</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
