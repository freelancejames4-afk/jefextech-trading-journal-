import React from 'react';
import { Bot, X, MessageSquare, Sparkles } from 'lucide-react';
import { useCoach } from '../../contexts/CoachContext';
import { AICoachChat } from './AICoachChat';

interface FloatingCoachWidgetProps {
  currentTab: string;
}

export const FloatingCoachWidget: React.FC<FloatingCoachWidgetProps> = ({ currentTab }) => {
  const { isFloatingOpen, setIsFloatingOpen, isTyping } = useCoach();

  // If the user is currently on the dedicated full-screen "coach" tab, hide the floating toggle to avoid redundancy
  if (currentTab === 'coach') {
    return null;
  }

  return (
    <>
      {/* Floating Chat Modal / Drawer */}
      {isFloatingOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 w-[95vw] sm:w-[440px] h-[560px] max-h-[80vh] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200 bg-white dark:bg-[#121215]">
          <AICoachChat compact onClose={() => setIsFloatingOpen(false)} />
        </div>
      )}

      {/* Floating Trigger Button */}
      <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsFloatingOpen(!isFloatingOpen)}
          className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full font-semibold text-xs transition-all shadow-lg cursor-pointer active:scale-95 ${
            isFloatingOpen
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 hover:shadow-emerald-600/40'
          }`}
          aria-label="Toggle AI Coach"
        >
          <div className="relative">
            {isFloatingOpen ? (
              <X className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Bot className="w-4 h-4 stroke-[2.5]" />
            )}
            {!isFloatingOpen && isTyping && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>

          <span className="font-sans font-bold tracking-tight">AI Coach</span>

          {!isFloatingOpen && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 dark:bg-emerald-400 animate-pulse hidden sm:inline-block" />
          )}
        </button>
      </div>
    </>
  );
};
