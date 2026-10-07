import React, { useState } from 'react';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { JournalProvider, useJournal } from './contexts/JournalContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { DailyJournalView } from './components/journal/DailyJournalView';
import { TradesListView } from './components/trades/TradesListView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { InstrumentsView } from './components/instruments/InstrumentsView';
import { AddTradeModal } from './components/trades/AddTradeModal';
import { TradeDetailModal } from './components/trades/TradeDetailModal';
import { ConfigModal } from './components/common/ConfigModal';
import { Trade } from './types';
import { Activity, AlertCircle, RefreshCw } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { setCurrentDate, error: journalError, refreshData } = useJournal();

  const [currentTab, setCurrentTab] = useState<string>('journal');
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

  // Splash Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#111A2E] border border-[#1E2B45] flex items-center justify-center text-[#2F80FF] mb-4 shadow-xl">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div className="text-sm font-semibold text-white font-mono">
          Initializing Jefextech Journal...
        </div>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          Connecting to Supabase instance
        </p>
      </div>
    );
  }

  // If not logged in, show Auth Screen
  if (!user) {
    return <AuthScreen />;
  }

  const handleOpenEditTrade = (trade: Trade) => {
    setSelectedTrade(null);
    setTradeToEdit(trade);
    setIsAddTradeOpen(true);
  };

  const handleSelectJournalDayFromAnalytics = (dateString: string) => {
    setCurrentDate(dateString);
    setCurrentTab('journal');
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex flex-col pb-24 md:pb-12">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenAddTrade={() => {
          setTradeToEdit(null);
          setIsAddTradeOpen(true);
        }}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {journalError && (
          <div className="mb-6 p-4 rounded-xl bg-[#16223B] border border-[#F59E0B]/40 flex items-center justify-between gap-3 text-xs text-slate-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span>
                Supabase sync notice: {journalError}. If you haven't run the SQL schema yet, open settings to copy it.
              </span>
            </div>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-3 py-1 bg-[#0B1220] hover:bg-[#1C2A48] border border-[#1E2B45] rounded text-xs text-white shrink-0 font-medium"
            >
              View SQL Schema
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        {currentTab === 'journal' && (
          <DailyJournalView
            onOpenTradeDetail={(trade) => setSelectedTrade(trade)}
            onOpenAddTrade={() => {
              setTradeToEdit(null);
              setIsAddTradeOpen(true);
            }}
          />
        )}

        {currentTab === 'trades' && (
          <TradesListView
            onOpenTradeDetail={(trade) => setSelectedTrade(trade)}
            onOpenAddTrade={() => {
              setTradeToEdit(null);
              setIsAddTradeOpen(true);
            }}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            onSelectJournalDay={handleSelectJournalDayFromAnalytics}
          />
        )}

        {currentTab === 'instruments' && (
          <InstrumentsView />
        )}
      </main>

      {/* Mobile Bottom Navigation & FAB */}
      <MobileNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenAddTrade={() => {
          setTradeToEdit(null);
          setIsAddTradeOpen(true);
        }}
      />

      {/* Modals */}
      <AddTradeModal
        isOpen={isAddTradeOpen}
        onClose={() => {
          setIsAddTradeOpen(false);
          setTradeToEdit(null);
        }}
        tradeToEdit={tradeToEdit}
        onAddInstrumentShortcut={() => {
          setIsAddTradeOpen(false);
          setCurrentTab('instruments');
        }}
      />

      <TradeDetailModal
        trade={selectedTrade}
        isOpen={Boolean(selectedTrade)}
        onClose={() => setSelectedTrade(null)}
        onEdit={handleOpenEditTrade}
      />

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSaved={() => refreshData()}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <JournalProvider>
          <MainApp />
        </JournalProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
