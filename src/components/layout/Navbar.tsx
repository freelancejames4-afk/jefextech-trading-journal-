import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useJournal } from '../../contexts/JournalContext';
import { Plus, LogOut, Sun, Moon, TrendingUp, ShieldCheck, Settings } from 'lucide-react';
import { SessionClock } from './SessionClock';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddTrade: () => void;
  onOpenRules: () => void;
  onOpenProfileModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenAddTrade,
  onOpenRules,
  onOpenProfileModal,
}) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { avatarUrl } = useJournal();

  const navLinks = [
    { id: 'journal', label: 'Daily Journal' },
    { id: 'trades', label: 'All Trades' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'best-times', label: 'Best Times' },
    { id: 'coach', label: 'AI Coach' },
    { id: 'instruments', label: 'Instruments' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Zone 1: Brand Wordmark with Round Profile Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Round Logo Clickable to Open Profile Photo Modal */}
          <button
            type="button"
            onClick={onOpenProfileModal}
            title="Click to change your profile logo"
            className="relative group cursor-pointer focus:outline-none shrink-0"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-500/80 group-hover:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center transition-all shadow-xs group-hover:scale-105">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#09090B]" />
          </button>

          <button
            onClick={() => onTabChange('journal')}
            className="flex flex-col text-left group cursor-pointer"
          >
            <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white font-sans group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors whitespace-nowrap">
              Jefextech Journal
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-wider -mt-1 uppercase hidden sm:block">
              Execution Analytics
            </span>
          </button>
        </div>

        {/* Zone 1.5: Live Session Clock (Nigerian Time Africa/Lagos) */}
        <div className="flex items-center">
          <SessionClock />
        </div>

        {/* Zone 2: Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-zinc-100 dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-1 rounded-lg">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Rules Button */}
          <button
            onClick={onOpenRules}
            title="My 10 Trading Rules"
            className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700/60 rounded-lg transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="inline">Rules</span>
          </button>

          {/* Add Trade Button (Sharp Trading Green) */}
          <button
            onClick={onOpenAddTrade}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Trade</span>
            <span className="sm:hidden">Log</span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          {/* Settings shortcut */}
          <button
            onClick={() => onTabChange('settings')}
            title="Settings & System Status"
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={() => signOut()}
            title={`Log out (${user?.email || 'User'})`}
            className="hidden sm:flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
