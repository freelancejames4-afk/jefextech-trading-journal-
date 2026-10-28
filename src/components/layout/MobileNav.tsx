import React from 'react';
import { CalendarDays, Layers, BarChart3, Clock, Bot, SlidersHorizontal, Settings, Plus } from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddTrade: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onTabChange,
  onOpenAddTrade,
}) => {
  const items = [
    { id: 'journal', label: 'Journal', icon: CalendarDays },
    { id: 'trades', label: 'Trades', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'coach', label: 'Coach', icon: Bot },
    { id: 'best-times', label: 'Times', icon: Clock },
    { id: 'instruments', label: 'Pairs', icon: SlidersHorizontal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Floating Action Button (Quick Trade Log) - emerald green */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={onOpenAddTrade}
          className="w-13 h-13 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform cursor-pointer"
          aria-label="Add Trade"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-2 py-1.5 flex items-center justify-around transition-colors">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[50px] cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
