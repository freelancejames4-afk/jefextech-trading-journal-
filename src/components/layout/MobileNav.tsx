import React from 'react';
import { CalendarDays, Layers, BarChart3, SlidersHorizontal, Plus } from 'lucide-react';

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
    { id: 'instruments', label: 'Instruments', icon: SlidersHorizontal },
  ];

  return (
    <>
      {/* Floating Action Button (Quick Trade Log) - mobile thumb reach */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={onOpenAddTrade}
          className="w-13 h-13 rounded-full bg-[#2F80FF] text-white flex items-center justify-center shadow-lg shadow-[#2F80FF]/40 border border-[#2F80FF]/80 active:scale-95 transition-transform"
          aria-label="Add Trade"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1220]/95 backdrop-blur-md border-t border-[#1E2B45] px-2 py-1.5 flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors min-w-[64px] ${
                isActive
                  ? 'text-[#2F80FF]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
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
