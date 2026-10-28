import React from 'react';
import { X, ShieldCheck, CheckCircle2, BookOpen, ExternalLink } from 'lucide-react';
import { useJournal } from '../../contexts/JournalContext';

interface TradingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAndProceed?: () => void;
  onOpenSettings?: () => void;
}

export const TradingRulesModal: React.FC<TradingRulesModalProps> = ({
  isOpen,
  onClose,
  onConfirmAndProceed,
  onOpenSettings,
}) => {
  const { tradingRules } = useJournal();

  if (!isOpen) return null;

  const handleAffirmation = () => {
    if (onConfirmAndProceed) {
      onConfirmAndProceed();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#0E0E11]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                  My 10 Trading Rules
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Execution Discipline
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Read carefully before taking any position today.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rules List */}
        <div className="p-6 overflow-y-auto space-y-2.5 flex-1">
          {tradingRules.map((rule) => {
            const isLossRule = rule.rule_number === 3;
            const isRiskRule = rule.rule_number === 8 || rule.rule_number === 9;
            return (
              <div
                key={rule.rule_number}
                className="group flex items-start gap-3.5 p-3 rounded-xl bg-zinc-50/80 dark:bg-[#18181B]/70 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-400/60 dark:hover:border-emerald-600/60 transition-colors"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                    isLossRule
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                      : isRiskRule
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {rule.rule_number}
                </div>
                <div className="flex-1 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 font-medium">
                  {rule.rule_text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with affirmation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#0E0E11] gap-3">
          {onOpenSettings ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="text-xs text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Edit rules in Settings</span>
            </button>
          ) : (
            <span className="text-[11px] text-zinc-400">Rule-based edge &gt; emotions</span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleAffirmation}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>I will follow these rules</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
