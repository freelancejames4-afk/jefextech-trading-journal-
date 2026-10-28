import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Instrument, Trade, JournalDay, MarketType, TradingRule, AnalyticsStats } from '../types';
import { STARTER_INSTRUMENTS, DEFAULT_TRADING_RULES } from '../lib/constants';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface JournalContextType {
  instruments: Instrument[];
  trades: Trade[];
  journalDays: JournalDay[];
  currentDate: string;
  currentJournalDay: JournalDay | null;
  loading: boolean;
  error: string | null;
  // Day actions
  setCurrentDate: (date: string) => void;
  saveDayNotes: (date: string, notes: string) => Promise<void>;
  toggleDayCompleted: (date: string, completed: boolean) => Promise<void>;
  // Trade actions
  addTrade: (trade: Omit<Trade, 'id' | 'user_id' | 'created_at'>) => Promise<Trade>;
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<Trade>;
  deleteTrade: (id: string) => Promise<void>;
  // Instrument actions
  addInstrument: (symbol: string, name: string, market_type: MarketType) => Promise<Instrument>;
  updateInstrument: (id: string, symbol: string, name: string, market_type: MarketType) => Promise<Instrument>;
  deleteInstrument: (id: string) => Promise<void>;
  resetStarterInstruments: () => Promise<void>;
  // Profile avatar actions
  avatarUrl: string | null;
  updateAvatarUrl: (url: string | null) => Promise<void>;
  // Trading rules actions
  tradingRules: TradingRule[];
  updateTradingRule: (ruleNumber: number, ruleText: string) => Promise<void>;
  resetTradingRules: () => Promise<void>;
  // Best trading times overrides
  bestTimesOverrides: Record<string, string>;
  updateBestTimeOverride: (symbol: string, windowDescription: string) => Promise<void>;
  resetBestTimeOverrides: () => Promise<void>;
  // Navigation & Refresh
  refreshData: () => Promise<void>;
  analyticsStats: AnalyticsStats;
  getDayTrades: (date: string) => Trade[];
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

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

  // Profile avatar logo
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Trading rules
  const [tradingRules, setTradingRules] = useState<TradingRule[]>(DEFAULT_TRADING_RULES);

  // Best times user custom overrides (symbol -> window description)
  const [bestTimesOverrides, setBestTimesOverrides] = useState<Record<string, string>>({});

  const getStorageKey = useCallback((key: string) => `jefex_${user?.id || 'guest'}_${key}`, [user?.id]);

  const loadFromLocalStorage = useCallback(() => {
    if (!user) return;
    try {
      const storedInst = localStorage.getItem(getStorageKey('instruments'));
      let instList: Instrument[] = storedInst ? JSON.parse(storedInst) : [];

      // Check for missing starter instruments and append them
      const existingSymbols = new Set(instList.map((i) => i.symbol.toUpperCase().trim()));
      const missingStarters = STARTER_INSTRUMENTS.filter(
        (starter) => !existingSymbols.has(starter.symbol.toUpperCase().trim())
      );

      if (missingStarters.length > 0) {
        const newlyAdded = missingStarters.map((item, idx) => ({
          id: `inst-starter-${Date.now()}-${idx}`,
          user_id: user.id,
          symbol: item.symbol,
          name: item.name,
          market_type: item.market_type,
          created_at: new Date().toISOString(),
        }));
        instList = [...instList, ...newlyAdded];
        localStorage.setItem(getStorageKey('instruments'), JSON.stringify(instList));
      }

      setInstruments(instList);

      const storedTrades = localStorage.getItem(getStorageKey('trades'));
      if (storedTrades) {
        setTrades(JSON.parse(storedTrades));
      } else {
        setTrades([]);
      }

      const storedDays = localStorage.getItem(getStorageKey('journal_days'));
      if (storedDays) {
        setJournalDays(JSON.parse(storedDays));
      } else {
        setJournalDays([]);
      }

      const storedAvatar = localStorage.getItem(getStorageKey('avatar'));
      if (storedAvatar) {
        setAvatarUrl(storedAvatar);
      }

      const storedRules = localStorage.getItem(getStorageKey('rules'));
      if (storedRules) {
        try {
          setTradingRules(JSON.parse(storedRules));
        } catch {
          setTradingRules(DEFAULT_TRADING_RULES);
        }
      }

      const storedBt = localStorage.getItem(getStorageKey('best_times'));
      if (storedBt) {
        try {
          setBestTimesOverrides(JSON.parse(storedBt));
        } catch {
          setBestTimesOverrides({});
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage store:', e);
    }
  }, [user, getStorageKey]);

  const refreshData = useCallback(async () => {
    if (!user) {
      setInstruments([]);
      setTrades([]);
      setJournalDays([]);
      setAvatarUrl(null);
      setTradingRules(DEFAULT_TRADING_RULES);
      setBestTimesOverrides({});
      setLoading(false);
      return;
    }

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
        console.warn('Supabase instruments fetch notice:', instError.message);
        loadFromLocalStorage();
        setError(instError.message);
        setLoading(false);
        return;
      }

      let activeInstruments: Instrument[] = instData || [];

      // Check for missing starter instruments and auto-insert them without duplicates
      const existingSymbols = new Set(activeInstruments.map((i) => i.symbol.toUpperCase().trim()));
      const missingStarters = STARTER_INSTRUMENTS.filter(
        (starter) => !existingSymbols.has(starter.symbol.toUpperCase().trim())
      );

      if (missingStarters.length > 0) {
        const rows = missingStarters.map((item) => ({
          user_id: user.id,
          symbol: item.symbol,
          name: item.name,
          market_type: item.market_type,
        }));
        try {
          const { data: seeded, error: seedErr } = await client
            .from('instruments')
            .insert(rows)
            .select();

          if (!seedErr && seeded) {
            activeInstruments = [...activeInstruments, ...seeded];
          }
        } catch (e) {
          console.warn('Starter seeding notice:', e);
        }
      }

      setInstruments(activeInstruments);
      localStorage.setItem(getStorageKey('instruments'), JSON.stringify(activeInstruments));

      // 2. Fetch Journal Days
      const { data: daysData, error: daysError } = await client
        .from('journal_days')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (daysError) {
        console.warn('Journal days fetch notice:', daysError.message);
      } else {
        setJournalDays(daysData || []);
        localStorage.setItem(getStorageKey('journal_days'), JSON.stringify(daysData || []));
      }

      // 3. Fetch Trades
      const { data: tradesData, error: tradesError } = await client
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tradesError) {
        console.warn('Trades fetch notice:', tradesError.message);
      } else {
        const resolvedTrades: Trade[] = (tradesData || []).map((t) => ({
          ...t,
          instrument: activeInstruments.find((i) => i.id === t.instrument_id),
          rules_followed: Array.isArray(t.rules_followed) ? t.rules_followed : [],
          traded_in_best_time: t.traded_in_best_time === true,
        }));
        setTrades(resolvedTrades);
        localStorage.setItem(getStorageKey('trades'), JSON.stringify(resolvedTrades));
      }

      // 4. Fetch User Profile (Avatar Logo)
      try {
        const { data: profileData } = await client
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData && profileData.avatar_url) {
          setAvatarUrl(profileData.avatar_url);
          localStorage.setItem(getStorageKey('avatar'), profileData.avatar_url);
        } else {
          const localAvatar = localStorage.getItem(getStorageKey('avatar'));
          if (localAvatar) setAvatarUrl(localAvatar);
        }
      } catch (profileErr) {
        console.warn('Could not fetch profiles table (fallback to local):', profileErr);
        const localAvatar = localStorage.getItem(getStorageKey('avatar'));
        if (localAvatar) setAvatarUrl(localAvatar);
      }

      // 5. Fetch Trading Rules
      try {
        const { data: rulesData } = await client
          .from('trading_rules')
          .select('*')
          .eq('user_id', user.id)
          .order('rule_number', { ascending: true });

        if (rulesData && rulesData.length > 0) {
          setTradingRules(rulesData);
          localStorage.setItem(getStorageKey('rules'), JSON.stringify(rulesData));
        } else {
          const localRules = localStorage.getItem(getStorageKey('rules'));
          if (localRules) {
            setTradingRules(JSON.parse(localRules));
          } else {
            setTradingRules(DEFAULT_TRADING_RULES);
          }
        }
      } catch (rulesErr) {
        console.warn('Could not fetch trading_rules table (fallback to defaults):', rulesErr);
        setTradingRules(DEFAULT_TRADING_RULES);
      }

      // 6. Fetch Best Times Custom Overrides
      try {
        const { data: btData } = await client
          .from('best_times')
          .select('*')
          .eq('user_id', user.id);

        if (btData && btData.length > 0) {
          const map: Record<string, string> = {};
          btData.forEach((row: any) => {
            if (row.symbol && row.session_description) {
              map[row.symbol.toUpperCase()] = row.session_description;
            }
          });
          setBestTimesOverrides(map);
          localStorage.setItem(getStorageKey('best_times'), JSON.stringify(map));
        } else {
          const localBt = localStorage.getItem(getStorageKey('best_times'));
          if (localBt) setBestTimesOverrides(JSON.parse(localBt));
        }
      } catch (btErr) {
        console.warn('Could not fetch best_times table:', btErr);
        const localBt = localStorage.getItem(getStorageKey('best_times'));
        if (localBt) setBestTimesOverrides(JSON.parse(localBt));
      }
    } catch (err: any) {
      console.warn('Sync exception:', err);
      setError(err.message || 'Failed to sync with Supabase');
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, [user, isDemoUser, loadFromLocalStorage, getStorageKey]);

  useEffect(() => {
    refreshData();
  }, [user?.id, isDemoUser, refreshData]);

  const currentJournalDay = useMemo(() => {
    return journalDays.find((d) => d.date === currentDate) || null;
  }, [journalDays, currentDate]);

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
        const { data, error: insertError } = await client
          .from('journal_days')
          .insert({
            user_id: user.id,
            date,
            notes: '',
            completed: false,
          })
          .select()
          .single();

        if (insertError) {
          const fallback = { ...newDay };
          setJournalDays((prev) => [...prev, fallback]);
          return fallback;
        }
        setJournalDays((prev) => [...prev, data]);
        return data;
      } catch {
        setJournalDays((prev) => [...prev, newDay]);
        return newDay;
      }
    },
    [journalDays, user, isDemoUser, getStorageKey]
  );

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
      const { data, error: upsertErr } = await client
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

      if (!upsertErr && data) {
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
      const { data, error: upsertErr } = await client
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

      if (!upsertErr && data) {
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

    const day = await ensureJournalDay(currentDate);
    const newTradeId = `trade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const instrument = instruments.find((i) => i.id === tradeData.instrument_id);

    const fullTrade: Trade = {
      ...tradeData,
      id: newTradeId,
      user_id: user.id,
      journal_day_id: day.id,
      rules_followed: tradeData.rules_followed || [],
      traded_in_best_time: tradeData.traded_in_best_time ?? false,
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
      const insertPayload: any = {
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
        rules_followed: tradeData.rules_followed || [],
        traded_in_best_time: tradeData.traded_in_best_time ?? false,
      };

      const { data, error: insertError } = await client
        .from('trades')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.warn('Trade insert warning, attempting fallback without newly migrated columns:', insertError.message);
        // Fallback in case rules_followed or traded_in_best_time column doesn't exist yet in Supabase
        delete insertPayload.traded_in_best_time;
        delete insertPayload.rules_followed;
        const { data: retryData, error: retryErr } = await client
          .from('trades')
          .insert(insertPayload)
          .select()
          .single();

        if (!retryErr && retryData) {
          const created: Trade = {
            ...retryData,
            rules_followed: tradeData.rules_followed || [],
            traded_in_best_time: tradeData.traded_in_best_time ?? false,
            instrument,
          };
          setTrades((prev) => [created, ...prev]);
          return created;
        }

        const updated = [fullTrade, ...trades];
        setTrades(updated);
        localStorage.setItem(getStorageKey('trades'), JSON.stringify(updated));
        return fullTrade;
      }

      const created: Trade = {
        ...data,
        rules_followed: data.rules_followed || tradeData.rules_followed || [],
        traded_in_best_time: data.traded_in_best_time !== undefined ? data.traded_in_best_time : (tradeData.traded_in_best_time ?? false),
        instrument,
      };
      setTrades((prev) => [created, ...prev]);
      return created;
    } catch {
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
      if (tradeData.rules_followed !== undefined) updatePayload.rules_followed = tradeData.rules_followed;
      if (tradeData.traded_in_best_time !== undefined) updatePayload.traded_in_best_time = tradeData.traded_in_best_time;

      const { data, error: updateErr } = await client
        .from('trades')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (!updateErr && data) {
        const finalTrade = {
          ...data,
          rules_followed: data.rules_followed || tradeData.rules_followed || existing.rules_followed || [],
          traded_in_best_time: data.traded_in_best_time !== undefined ? data.traded_in_best_time : (tradeData.traded_in_best_time ?? existing.traded_in_best_time ?? false),
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

    // Prevent duplicate symbol
    const existing = instruments.find((i) => i.symbol.toUpperCase() === cleanSymbol);
    if (existing) {
      return existing;
    }

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
      const { data, error: insertError } = await client
        .from('instruments')
        .insert({
          user_id: user.id,
          symbol: cleanSymbol,
          name: cleanName,
          market_type,
        })
        .select()
        .single();

      if (!insertError && data) {
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
      const { data, error: updateError } = await client
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

      if (!updateError && data) {
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
      if (!instruments.some((i) => i.symbol.toUpperCase() === starter.symbol.toUpperCase())) {
        await addInstrument(starter.symbol, starter.name, starter.market_type);
      }
    }
  };

  // Profile avatar actions
  const updateAvatarUrl = async (url: string | null) => {
    setAvatarUrl(url);
    if (!user) return;

    localStorage.setItem(getStorageKey('avatar'), url || '');

    if (!isDemoUser && isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        await client.from('profiles').upsert(
          {
            user_id: user.id,
            avatar_url: url,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      } catch (err) {
        console.warn('Update avatar error in profiles table:', err);
      }
    }
  };

  // Trading rules actions
  const updateTradingRule = async (ruleNumber: number, ruleText: string) => {
    const updated = tradingRules.map((r) =>
      r.rule_number === ruleNumber ? { ...r, rule_text: ruleText } : r
    );
    setTradingRules(updated);

    if (user) {
      localStorage.setItem(getStorageKey('rules'), JSON.stringify(updated));

      if (!isDemoUser && isSupabaseConfigured()) {
        try {
          const client = getSupabaseClient();
          await client.from('trading_rules').upsert(
            {
              user_id: user.id,
              rule_number: ruleNumber,
              rule_text: ruleText,
            },
            { onConflict: 'user_id,rule_number' }
          );
        } catch (err) {
          console.warn('Update trading rule in Supabase:', err);
        }
      }
    }
  };

  const resetTradingRules = async () => {
    setTradingRules(DEFAULT_TRADING_RULES);
    if (user) {
      localStorage.setItem(getStorageKey('rules'), JSON.stringify(DEFAULT_TRADING_RULES));
      if (!isDemoUser && isSupabaseConfigured()) {
        try {
          const client = getSupabaseClient();
          for (const rule of DEFAULT_TRADING_RULES) {
            await client.from('trading_rules').upsert(
              {
                user_id: user.id,
                rule_number: rule.rule_number,
                rule_text: rule.rule_text,
              },
              { onConflict: 'user_id,rule_number' }
            );
          }
        } catch (err) {
          console.warn('Reset trading rules error:', err);
        }
      }
    }
  };

  // Best trading times custom overrides actions
  const updateBestTimeOverride = async (symbol: string, windowDescription: string) => {
    const cleanSym = symbol.trim().toUpperCase();
    const updated = { ...bestTimesOverrides, [cleanSym]: windowDescription };
    setBestTimesOverrides(updated);

    if (user) {
      localStorage.setItem(getStorageKey('best_times'), JSON.stringify(updated));

      if (!isDemoUser && isSupabaseConfigured()) {
        try {
          const client = getSupabaseClient();
          await client.from('best_times').upsert(
            {
              user_id: user.id,
              symbol: cleanSym,
              session_description: windowDescription,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,symbol' }
          );
        } catch (err) {
          console.warn('Update best time in Supabase:', err);
        }
      }
    }
  };

  const resetBestTimeOverrides = async () => {
    setBestTimesOverrides({});
    if (user) {
      localStorage.removeItem(getStorageKey('best_times'));
      if (!isDemoUser && isSupabaseConfigured()) {
        try {
          const client = getSupabaseClient();
          await client.from('best_times').delete().eq('user_id', user.id);
        } catch (err) {
          console.warn('Reset best times error in Supabase:', err);
        }
      }
    }
  };

  // Filter day trades
  const getDayTrades = useCallback(
    (date: string) => {
      const day = journalDays.find((d) => d.date === date);
      return trades.filter((t) => {
        if (day && t.journal_day_id === day.id) return true;
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
        rulesDisciplinedTrades: 0,
        rulesBrokenTrades: 0,
        bestTimeTradesCount: 0,
        bestTimeWinsCount: 0,
        bestTimeWinRate: 0,
        outsideBestTimeTradesCount: 0,
        outsideBestTimeWinsCount: 0,
        outsideBestTimeWinRate: 0,
      };
    }

    let totalPnl = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let breakevenTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let rulesDisciplinedTrades = 0;
    let rulesBrokenTrades = 0;

    let bestTimeTradesCount = 0;
    let bestTimeWinsCount = 0;
    let outsideBestTimeTradesCount = 0;
    let outsideBestTimeWinsCount = 0;

    const instrumentPnlMap: Record<string, number> = {};

    trades.forEach((trade) => {
      const pnl = Number(trade.pnl) || 0;
      totalPnl += pnl;

      const isWin = trade.result === 'win' || pnl > 0;
      const isLoss = trade.result === 'loss' || pnl < 0;

      if (isWin) {
        winningTrades++;
        grossProfit += pnl;
      } else if (isLoss) {
        losingTrades++;
        grossLoss += Math.abs(pnl);
      } else {
        breakevenTrades++;
      }

      // Check rules followed
      const rf = trade.rules_followed;
      if (rf && Array.isArray(rf)) {
        if (rf.length === 10) {
          rulesDisciplinedTrades++;
        } else if (rf.length > 0) {
          rulesBrokenTrades++;
        }
      }

      // Check best time execution stats
      if (trade.traded_in_best_time === true) {
        bestTimeTradesCount++;
        if (isWin) bestTimeWinsCount++;
      } else if (trade.traded_in_best_time === false) {
        outsideBestTimeTradesCount++;
        if (isWin) outsideBestTimeWinsCount++;
      }

      const symbol = trade.instrument?.symbol || 'UNKNOWN';
      instrumentPnlMap[symbol] = (instrumentPnlMap[symbol] || 0) + pnl;
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
    const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;

    const bestTimeWinRate = bestTimeTradesCount > 0 ? (bestTimeWinsCount / bestTimeTradesCount) * 100 : 0;
    const outsideBestTimeWinRate = outsideBestTimeTradesCount > 0 ? (outsideBestTimeWinsCount / outsideBestTimeTradesCount) * 100 : 0;

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
      rulesDisciplinedTrades,
      rulesBrokenTrades,
      bestTimeTradesCount,
      bestTimeWinsCount,
      bestTimeWinRate,
      outsideBestTimeTradesCount,
      outsideBestTimeWinsCount,
      outsideBestTimeWinRate,
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
        avatarUrl,
        updateAvatarUrl,
        tradingRules,
        updateTradingRule,
        resetTradingRules,
        bestTimesOverrides,
        updateBestTimeOverride,
        resetBestTimeOverrides,
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
