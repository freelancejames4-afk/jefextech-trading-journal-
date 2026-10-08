import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Instrument, JournalDay, Trade, AnalyticsStats, TradeFilters, MarketType } from '../types';
import { useAuth } from './AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { STARTER_INSTRUMENTS } from '../lib/constants';

interface JournalContextType {
  instruments: Instrument[];
  trades: Trade[];
  journalDays: JournalDay[];
  currentDate: string; // YYYY-MM-DD
  currentJournalDay: JournalDay | null;
  loading: boolean;
  error: string | null;
  setCurrentDate: (date: string) => void;
  // Day actions
  saveDayNotes: (date: string, notes: string) => Promise<void>;
  toggleDayCompleted: (date: string, completed: boolean) => Promise<void>;
  // Trade actions
  addTrade: (tradeData: Omit<Trade, 'id' | 'user_id' | 'created_at'>) => Promise<Trade>;
  updateTrade: (id: string, tradeData: Partial<Trade>) => Promise<Trade>;
  deleteTrade: (id: string) => Promise<void>;
  // Instrument actions
  addInstrument: (symbol: string, name: string, market_type: MarketType) => Promise<Instrument>;
  updateInstrument: (id: string, symbol: string, name: string, market_type: MarketType) => Promise<Instrument>;
  deleteInstrument: (id: string) => Promise<void>;
  resetStarterInstruments: () => Promise<void>;
  // Navigation & Refresh
  refreshData: () => Promise<void>;
  analyticsStats: AnalyticsStats;
  getDayTrades: (date: string) => Trade[];
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

// Helper for formatted local date 'YYYY-MM-DD'
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoUser } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journalDays, setJournalDays] = useState<JournalDay[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local storage mock store keys (for demo or backup)
  const getStorageKey = (key: string) => `jefex_${user?.id || 'guest'}_${key}`;

  const loadFromLocalStorage = useCallback(() => {
    if (!user) return;
    try {
      const storedInst = localStorage.getItem(getStorageKey('instruments'));
      let instList: Instrument[] = storedInst ? JSON.parse(storedInst) : [];
      if (instList.length === 0) {
        instList = STARTER_INSTRUMENTS.map((item, idx) => ({
          id: `inst-starter-${idx}`,
          user_id: user.id,
          symbol: item.symbol,
          name: item.name,
          market_type: item.market_type,
          created_at: new Date().toISOString(),
        }));
        localStorage.setItem(getStorageKey('instruments'), JSON.stringify(instList));
      }
      setInstruments(instList);

      const storedTrades = localStorage.getItem(getStorageKey('trades'));
      const tradesList: Trade[] = storedTrades ? JSON.parse(storedTrades) : [];
      setTrades(tradesList);

      const storedDays = localStorage.getItem(getStorageKey('journal_days'));
      const daysList: JournalDay[] = storedDays ? JSON.parse(storedDays) : [];
      setJournalDays(daysList);
    } catch (e) {
      console.warn('Error reading from localStorage store:', e);
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    if (!user) {
      setInstruments([]);
      setTrades([]);
      setJournalDays([]);
      setLoading(false);
      return;
    }

    // Only set loading to true on initial load if we don't have instruments yet
    setInstruments((prev) => {
      if (prev.length === 0) setLoading(true);
      return prev;
    });
    setError(null);

    // If demo mode or Supabase not configured, use local storage engine
    if (isDemoUser || !isSupabaseConfigured()) {
      loadFromLocalStorage();
      setLoading(false);
      return;
    }

    try {
      const client = getSupabaseClient();

      // 1. Fetch Instruments
      const { data: instData, error: instError } = await client
        .from('instruments')
        .select('*')
        .eq('user_id', user.id)
        .order('symbol', { ascending: true });

      if (instError) {
        console.warn('Supabase instruments fetch error (falling back to local):', instError.message);
        loadFromLocalStorage();
        setError(instError.message);
        setLoading(false);
        return;
      }

      let activeInstruments: Instrument[] = instData || [];
      // Auto-add starter instruments if empty
      if (activeInstruments.length === 0) {
        const rows = STARTER_INSTRUMENTS.map((item) => ({
          user_id: user.id,
          symbol: item.symbol,
          name: item.name,
          market_type: item.market_type,
        }));
        const { data: seeded, error: seedErr } = await client
          .from('instruments')
          .insert(rows)
          .select();
        if (!seedErr && seeded) {
          activeInstruments = seeded;
        }
      }
      setInstruments(activeInstruments);

      // 2. Fetch Journal Days
      const { data: daysData, error: daysError } = await client
        .from('journal_days')
        .select('*')
        .eq('user_id', user.id);

      if (!daysError && daysData) {
        setJournalDays(daysData);
      }

      // 3. Fetch Trades
      const { data: tradesData, error: tradesError } = await client
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!tradesError && tradesData) {
        // Attach instrument details to each trade
        const instrumentMap = new Map(activeInstruments.map((i) => [i.id, i]));
        const enrichedTrades: Trade[] = tradesData.map((t) => ({
          ...t,
          instrument: instrumentMap.get(t.instrument_id),
        }));
        setTrades(enrichedTrades);
      }
    } catch (err: any) {
      console.warn('Fetch exception:', err);
      setError(err.message || 'Failed to sync with Supabase');
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, [user, isDemoUser, loadFromLocalStorage]);

  useEffect(() => {
    refreshData();
  }, [user?.id, isDemoUser]);

  // Current journal day object
  const currentJournalDay = useMemo(() => {
    return journalDays.find((d) => d.date === currentDate) || null;
  }, [journalDays, currentDate]);

  // Ensure current day exists or getOrCreate
  const ensureJournalDay = useCallback(
    async (date: string): Promise<JournalDay> => {
      const existing = journalDays.find((d) => d.date === date);
      if (existing) return existing;

      if (!user) throw new Error('User not logged in');

      const newDay: JournalDay = {
        id: `day-${date}-${Date.now()}`,
        user_id: user.id,
        date,
        notes: '',
        completed: false,
        created_at: new Date().toISOString(),
      };

      if (isDemoUser || !isSupabaseConfigured()) {
        const updated = [...journalDays, newDay];
        setJournalDays(updated);
        localStorage.setItem(getStorageKey('journal_days'), JSON.stringify(updated));
        return newDay;
      }

      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('journal_days')
          .insert({
            user_id: user.id,
            date,
            notes: '',
            completed: false,
          })
          .select()
          .single();

        if (error) {
          // If already exists or error, fallback
          const fallback = { ...newDay };
          setJournalDays((prev) => [...prev, fallback]);
          return fallback;
        }
        setJournalDays((prev) => [...prev, data]);
        return data;
      } catch (err) {
        setJournalDays((prev) => [...prev, newDay]);
        return newDay;
      }
    },
    [journalDays, user, isDemoUser]
  );

  // Automatically ensure today's journal day exists when app opens
  useEffect(() => {
    if (user && !loading) {
      ensureJournalDay(currentDate);
    }
  }, [user, loading, currentDate, ensureJournalDay]);

  const saveDayNotes = async (date: string, notes: string) => {
    if (!user) return;
    const existing = journalDays.find((d) => d.date === date);

    if (isDemoUser || !isSupabaseConfigured() || !existing?.id || existing.id.startsWith('day-')) {
      const updatedDays = journalDays.map((d) =>
        d.date === date ? { ...d, notes } : d
      );
      if (!updatedDays.find((d) => d.date === date)) {
        updatedDays.push({
          id: `day-${date}-${Date.now()}`,
          user_id: user.id,
          date,
          notes,
          completed: false,
          created_at: new Date().toISOString(),
        });
      }
      setJournalDays(updatedDays);
      localStorage.setItem(getStorageKey('journal_days'), JSON.stringify(updatedDays));
      return;
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('journal_days')
        .upsert(
          {
            user_id: user.id,
            date,
            notes,
          },
          { onConflict: 'user_id,date' }
        )
        .select()
        .single();

      if (!error && data) {
        setJournalDays((prev) =>
          prev.map((d) => (d.date === date ? { ...d, notes } : d))
        );
      }
    } catch (err) {
      console.warn('Save notes error:', err);
    }
  };

  const toggleDayCompleted = async (date: string, completed: boolean) => {
    if (!user) return;
    const existing = journalDays.find((d) => d.date === date);

    if (isDemoUser || !isSupabaseConfigured() || !existing?.id || existing.id.startsWith('day-')) {
      const updatedDays = journalDays.map((d) =>
        d.date === date ? { ...d, completed } : d
      );
      if (!updatedDays.find((d) => d.date === date)) {
        updatedDays.push({
          id: `day-${date}-${Date.now()}`,
          user_id: user.id,
          date,
          notes: '',
          completed,
          created_at: new Date().toISOString(),
        });
      }
      setJournalDays(updatedDays);
      localStorage.setItem(getStorageKey('journal_days'), JSON.stringify(updatedDays));
      return;
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('journal_days')
        .upsert(
          {
            user_id: user.id,
            date,
            completed,
          },
          { onConflict: 'user_id,date' }
        )
        .select()
        .single();

      if (!error && data) {
        setJournalDays((prev) =>
          prev.map((d) => (d.date === date ? { ...d, completed } : d))
        );
      }
    } catch (err) {
      console.warn('Toggle completed error:', err);
    }
  };

  // Add Trade
  const addTrade = async (tradeData: Omit<Trade, 'id' | 'user_id' | 'created_at'>): Promise<Trade> => {
    if (!user) throw new Error('User not logged in');

    // Ensure day exists
    const day = await ensureJournalDay(currentDate);

    const newTradeId = `trade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const instrument = instruments.find((i) => i.id === tradeData.instrument_id);

    const fullTrade: Trade = {
      ...tradeData,
      id: newTradeId,
      user_id: user.id,
      journal_day_id: day.id,
      created_at: new Date().toISOString(),
      instrument,
    };

    if (isDemoUser || !isSupabaseConfigured()) {
      const updated = [fullTrade, ...trades];
      setTrades(updated);
      localStorage.setItem(getStorageKey('trades'), JSON.stringify(updated));
      return fullTrade;
    }

    try {
      const client = getSupabaseClient();
      const insertPayload = {
        user_id: user.id,
        journal_day_id: day.id,
        instrument_id: tradeData.instrument_id,
        direction: tradeData.direction,
        entry_price: tradeData.entry_price,
        stop_loss: tradeData.stop_loss || null,
        take_profit: tradeData.take_profit || null,
        exit_price: tradeData.exit_price || null,
        lot_size: tradeData.lot_size,
        result: tradeData.result,
        pnl: tradeData.pnl,
        strategy: tradeData.strategy || '',
        session: tradeData.session || '',
        emotion: tradeData.emotion || '',
        notes: tradeData.notes || '',
        screenshot_urls: tradeData.screenshot_urls || [],
      };

      const { data, error } = await client
        .from('trades')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.warn('Trade insert error (falling back to state):', error.message);
        const updated = [fullTrade, ...trades];
        setTrades(updated);
        localStorage.setItem(getStorageKey('trades'), JSON.stringify(updated));
        return fullTrade;
      }

      const created: Trade = {
        ...data,
        instrument,
      };
      setTrades((prev) => [created, ...prev]);
      return created;
    } catch (err: any) {
      const updated = [fullTrade, ...trades];
      setTrades(updated);
      localStorage.setItem(getStorageKey('trades'), JSON.stringify(updated));
      return fullTrade;
    }
  };

  // Update Trade
  const updateTrade = async (id: string, tradeData: Partial<Trade>): Promise<Trade> => {
    if (!user) throw new Error('User not logged in');

    const existing = trades.find((t) => t.id === id);
    if (!existing) throw new Error('Trade not found');

    const updatedTrade: Trade = {
      ...existing,
      ...tradeData,
      instrument: tradeData.instrument_id
        ? instruments.find((i) => i.id === tradeData.instrument_id)
        : existing.instrument,
    };

    if (isDemoUser || !isSupabaseConfigured() || id.startsWith('trade-')) {
      const updated = trades.map((t) => (t.id === id ? updatedTrade : t));
      setTrades(updated);
      localStorage.setItem(getStorageKey('trades'), JSON.stringify(updated));
      return updatedTrade;
    }

    try {
      const client = getSupabaseClient();
      const updatePayload: any = {};
      if (tradeData.direction !== undefined) updatePayload.direction = tradeData.direction;
      if (tradeData.instrument_id !== undefined) updatePayload.instrument_id = tradeData.instrument_id;
      if (tradeData.entry_price !== undefined) updatePayload.entry_price = tradeData.entry_price;
      if (tradeData.stop_loss !== undefined) updatePayload.stop_loss = tradeData.stop_loss;
      if (tradeData.take_profit !== undefined) updatePayload.take_profit = tradeData.take_profit;
      if (tradeData.exit_price !== undefined) updatePayload.exit_price = tradeData.exit_price;
      if (tradeData.lot_size !== undefined) updatePayload.lot_size = tradeData.lot_size;
      if (tradeData.result !== undefined) updatePayload.result = tradeData.result;
      if (tradeData.pnl !== undefined) updatePayload.pnl = tradeData.pnl;
      if (tradeData.strategy !== undefined) updatePayload.strategy = tradeData.strategy;
      if (tradeData.session !== undefined) updatePayload.session = tradeData.session;
      if (tradeData.emotion !== undefined) updatePayload.emotion = tradeData.emotion;
      if (tradeData.notes !== undefined) updatePayload.notes = tradeData.notes;
      if (tradeData.screenshot_urls !== undefined) updatePayload.screenshot_urls = tradeData.screenshot_urls;

      const { data, error } = await client
        .from('trades')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (!error && data) {
        const finalTrade = {
          ...data,
          instrument: updatedTrade.instrument,
        };
        setTrades((prev) => prev.map((t) => (t.id === id ? finalTrade : t)));
        return finalTrade;
      }
    } catch (err) {
      console.warn('Update trade exception:', err);
    }

    setTrades((prev) => prev.map((t) => (t.id === id ? updatedTrade : t)));
    return updatedTrade;
  };

  // Delete Trade
  const deleteTrade = async (id: string): Promise<void> => {
    if (!user) return;

    if (isDemoUser || !isSupabaseConfigured() || id.startsWith('trade-')) {
      const updated = trades.filter((t) => t.id !== id);
      setTrades(updated);
      localStorage.setItem(getStorageKey('trades'), JSON.stringify(updated));
      return;
    }

    try {
      const client = getSupabaseClient();
      await client.from('trades').delete().eq('id', id).eq('user_id', user.id);
    } catch (err) {
      console.warn('Delete trade error:', err);
    }

    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  // Add Instrument
  const addInstrument = async (
    symbol: string,
    name: string,
    market_type: MarketType
  ): Promise<Instrument> => {
    if (!user) throw new Error('User not logged in');

    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanName = name.trim();

    const newInst: Instrument = {
      id: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: user.id,
      symbol: cleanSymbol,
      name: cleanName,
      market_type,
      created_at: new Date().toISOString(),
    };

    if (isDemoUser || !isSupabaseConfigured()) {
      const updated = [...instruments, newInst];
      setInstruments(updated);
      localStorage.setItem(getStorageKey('instruments'), JSON.stringify(updated));
      return newInst;
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('instruments')
        .insert({
          user_id: user.id,
          symbol: cleanSymbol,
          name: cleanName,
          market_type,
        })
        .select()
        .single();

      if (!error && data) {
        setInstruments((prev) => [...prev, data]);
        return data;
      }
    } catch (err) {
      console.warn('Add instrument error:', err);
    }

    setInstruments((prev) => [...prev, newInst]);
    return newInst;
  };

  // Update Instrument
  const updateInstrument = async (
    id: string,
    symbol: string,
    name: string,
    market_type: MarketType
  ): Promise<Instrument> => {
    if (!user) throw new Error('User not logged in');
    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanName = name.trim();

    const existing = instruments.find((i) => i.id === id);
    const updatedInst: Instrument = {
      ...(existing || { id, user_id: user.id, created_at: new Date().toISOString() }),
      symbol: cleanSymbol,
      name: cleanName,
      market_type,
    };

    if (isDemoUser || !isSupabaseConfigured() || id.startsWith('inst-')) {
      const updated = instruments.map((i) => (i.id === id ? updatedInst : i));
      setInstruments(updated);
      localStorage.setItem(getStorageKey('instruments'), JSON.stringify(updated));
      return updatedInst;
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('instruments')
        .update({
          symbol: cleanSymbol,
          name: cleanName,
          market_type,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (!error && data) {
        setInstruments((prev) => prev.map((i) => (i.id === id ? data : i)));
        return data;
      }
    } catch (err) {
      console.warn('Update instrument error:', err);
    }

    setInstruments((prev) => prev.map((i) => (i.id === id ? updatedInst : i)));
    return updatedInst;
  };

  // Delete Instrument
  const deleteInstrument = async (id: string): Promise<void> => {
    if (!user) return;

    if (isDemoUser || !isSupabaseConfigured() || id.startsWith('inst-')) {
      const updated = instruments.filter((i) => i.id !== id);
      setInstruments(updated);
      localStorage.setItem(getStorageKey('instruments'), JSON.stringify(updated));
      return;
    }

    try {
      const client = getSupabaseClient();
      await client.from('instruments').delete().eq('id', id).eq('user_id', user.id);
    } catch (err) {
      console.warn('Delete instrument error:', err);
    }

    setInstruments((prev) => prev.filter((i) => i.id !== id));
  };

  // Reset starter instruments
  const resetStarterInstruments = async () => {
    if (!user) return;
    for (const starter of STARTER_INSTRUMENTS) {
      if (!instruments.some((i) => i.symbol === starter.symbol)) {
        await addInstrument(starter.symbol, starter.name, starter.market_type);
      }
    }
  };

  // Filter day trades
  const getDayTrades = useCallback(
    (date: string) => {
      const day = journalDays.find((d) => d.date === date);
      return trades.filter((t) => {
        if (day && t.journal_day_id === day.id) return true;
        // Fallback: check trade created_at date
        const tradeDate = t.created_at?.split('T')[0];
        return tradeDate === date;
      });
    },
    [trades, journalDays]
  );

  // Compute analytics
  const analyticsStats: AnalyticsStats = useMemo(() => {
    if (trades.length === 0) {
      return {
        totalPnl: 0,
        winRate: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        profitFactor: 0,
        bestInstrument: null,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0,
      };
    }

    let totalPnl = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let breakevenTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    const instrumentPnlMap: Record<string, number> = {};

    trades.forEach((trade) => {
      const pnl = Number(trade.pnl) || 0;
      totalPnl += pnl;

      if (trade.result === 'win' || pnl > 0) {
        winningTrades++;
        grossProfit += pnl;
      } else if (trade.result === 'loss' || pnl < 0) {
        losingTrades++;
        grossLoss += Math.abs(pnl);
      } else {
        breakevenTrades++;
      }

      const symbol = trade.instrument?.symbol || 'UNKNOWN';
      instrumentPnlMap[symbol] = (instrumentPnlMap[symbol] || 0) + pnl;
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
    const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;

    // Find best instrument
    let bestInstrument: { symbol: string; pnl: number } | null = null;
    let highestPnl = -Infinity;
    Object.entries(instrumentPnlMap).forEach(([symbol, pnl]) => {
      if (pnl > highestPnl) {
        highestPnl = pnl;
        bestInstrument = { symbol, pnl };
      }
    });

    return {
      totalPnl,
      winRate,
      totalTrades,
      winningTrades,
      losingTrades,
      breakevenTrades,
      profitFactor,
      bestInstrument,
      avgWin,
      avgLoss,
      maxDrawdown: 0,
    };
  }, [trades]);

  return (
    <JournalContext.Provider
      value={{
        instruments,
        trades,
        journalDays,
        currentDate,
        currentJournalDay,
        loading,
        error,
        setCurrentDate,
        saveDayNotes,
        toggleDayCompleted,
        addTrade,
        updateTrade,
        deleteTrade,
        addInstrument,
        updateInstrument,
        deleteInstrument,
        resetStarterInstruments,
        refreshData,
        analyticsStats,
        getDayTrades,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};
