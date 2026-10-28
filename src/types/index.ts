export type MarketType = 'Forex' | 'Crypto' | 'Commodity/Indices' | 'Commodity' | 'Commodities' | 'Indices' | 'Stocks';

export interface Instrument {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  market_type: MarketType;
  created_at: string;
}

export interface JournalDay {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  notes: string;
  completed: boolean;
  created_at: string;
}

export type TradeDirection = 'buy' | 'sell';
export type TradeResult = 'win' | 'loss' | 'breakeven';

export interface Trade {
  id: string;
  user_id: string;
  journal_day_id: string;
  instrument_id: string;
  direction: TradeDirection;
  entry_price: number;
  stop_loss?: number | null;
  take_profit?: number | null;
  exit_price?: number | null;
  lot_size: number;
  result: TradeResult;
  pnl: number;
  strategy: string;
  session: string;
  emotion: string;
  notes: string;
  screenshot_urls: string[];
  rules_followed?: number[]; // IDs/numbers of rules followed (1 to 10)
  traded_in_best_time?: boolean; // True if executed within optimal session window
  created_at: string;
  // Joined or resolved client-side:
  instrument?: Instrument;
  journal_day?: JournalDay;
}

export interface TradingRule {
  id?: string;
  user_id?: string;
  rule_number: number;
  rule_text: string;
}

export interface UserProfile {
  user_id: string;
  avatar_url: string | null;
  updated_at?: string;
}

export interface BestTimeConfig {
  id?: string;
  user_id?: string;
  symbol: string;
  session_description: string;
  custom_window_override?: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TradeFilters {
  instrument_id?: string;
  result?: TradeResult | 'all';
  direction?: TradeDirection | 'all';
  session?: string | 'all';
  strategy?: string | 'all';
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsStats {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  profitFactor: number;
  bestInstrument: { symbol: string; pnl: number } | null;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  rulesDisciplinedTrades: number; // trades that followed all 10 rules
  rulesBrokenTrades: number; // trades where 1 or more rules were broken
  bestTimeTradesCount: number; // trades taken in best time
  bestTimeWinsCount: number;
  bestTimeWinRate: number;
  outsideBestTimeTradesCount: number; // trades taken outside best time
  outsideBestTimeWinsCount: number;
  outsideBestTimeWinRate: number;
}
