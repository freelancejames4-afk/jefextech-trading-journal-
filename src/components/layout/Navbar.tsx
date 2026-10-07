import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, LogOut, Database, UserCheck, Activity } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddTrade: () => void;
  onOpenConfig: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenAddTrade,
  onOpenConfig,
}) => {
  const { user, signOut, isDemoUser } = useAuth();

  const navLinks = [
    { id: 'journal', label: 'Daily Journal' },
    { id: 'trades', label: 'All Trades' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'instruments', label: 'Instruments' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B1220]/95 backdrop-blur-md border-b border-[#1E2B45]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTabChange('journal')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#111A2E] border border-[#1E2B45] group-hover:border-[#2F80FF] flex items-center justify-center text-[#2F80FF] transition-colors shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white font-sans group-hover:text-[#2F80FF] transition-colors">
                Jefextech Journal
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider -mt-1 uppercase">
                Terminal Precision
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-[#111A2E]/70 border border-[#1E2B45] p-1 rounded-lg">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#2F80FF] text-white shadow-sm shadow-[#2F80FF]/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-[#16223B]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddTrade}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2F80FF] hover:bg-[#2F80FF]/90 rounded-lg shadow-lg shadow-[#2F80FF]/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Trade</span>
            <span className="sm:hidden">Log</span>
          </button>

          <button
            onClick={onOpenConfig}
            title="Supabase Settings & SQL"
            className="p-2 text-slate-400 hover:text-white hover:bg-[#16223B] border border-[#1E2B45] rounded-lg transition-colors"
          >
            <Database className="w-4 h-4" />
          </button>

          <button
            onClick={() => signOut()}
            title={`Log out (${user?.email || 'User'})`}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-400 hover:text-[#FF4D5E] hover:bg-[#16223B] border border-[#1E2B45] rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
