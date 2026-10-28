import { MarketType } from '../types';

export const STARTER_INSTRUMENTS: Array<{ symbol: string; name: string; market_type: MarketType }> = [
  // Forex
  { symbol: 'EURUSD', name: 'Euro / US Dollar', market_type: 'Forex' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', market_type: 'Forex' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', market_type: 'Forex' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', market_type: 'Forex' },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', market_type: 'Forex' },
  { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', market_type: 'Forex' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', market_type: 'Forex' },
  { symbol: 'EURGBP', name: 'Euro / British Pound', market_type: 'Forex' },
  { symbol: 'EURJPY', name: 'Euro / Japanese Yen', market_type: 'Forex' },
  { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', market_type: 'Forex' },
  { symbol: 'AUDJPY', name: 'Australian Dollar / Japanese Yen', market_type: 'Forex' },
  { symbol: 'CADJPY', name: 'Canadian Dollar / Japanese Yen', market_type: 'Forex' },
  { symbol: 'EURAUD', name: 'Euro / Australian Dollar', market_type: 'Forex' },
  { symbol: 'GBPAUD', name: 'British Pound / Australian Dollar', market_type: 'Forex' },
  { symbol: 'GBPCAD', name: 'British Pound / Canadian Dollar', market_type: 'Forex' },

  // Commodity / Indices
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', market_type: 'Commodity/Indices' },
  { symbol: 'NAS100', name: 'Nasdaq 100 Index', market_type: 'Commodity/Indices' },
  { symbol: 'US30', name: 'Dow Jones Industrial 30', market_type: 'Commodity/Indices' },

  // Crypto
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', market_type: 'Crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', market_type: 'Crypto' },
  { symbol: 'SOLUSD', name: 'Solana / US Dollar', market_type: 'Crypto' },
  { symbol: 'HYPEUSD', name: 'Hyperliquid / US Dollar', market_type: 'Crypto' },
];

export const DEFAULT_TRADING_RULES = [
  { rule_number: 1, rule_text: "No greed. Take your target, don't move it." },
  { rule_number: 2, rule_text: "No fear. If the setup is valid, take it. If it's not, skip it." },
  { rule_number: 3, rule_text: "No revenge trades. After a loss, step away and wait for the next valid setup." },
  { rule_number: 4, rule_text: "No fighting the trend. Trade with the higher timeframe direction." },
  { rule_number: 5, rule_text: "Wait for a liquidity sweep before entering." },
  { rule_number: 6, rule_text: "Check that the timeframes agree before every trade." },
  { rule_number: 7, rule_text: "Wait for a strong rejection candle. No confirmation, no entry." },
  { rule_number: 8, rule_text: "Minimum 1:2 risk to reward. If the reward is smaller than double the risk, skip it." },
  { rule_number: 9, rule_text: "Risk the same small amount on every trade (1% or less). Always use a stop loss and never move it further away." },
  { rule_number: 10, rule_text: "Journal every trade with a screenshot and a note, win or lose." },
];

export const TRADING_SESSIONS = [
  'Asian',
  'London Open',
  'London NY Overlap',
  'New York AM',
  'New York PM',
  'Sydney',
];

export const TRADING_STRATEGIES = [
  'Breakout',
  'ICT / Smart Money (SMC)',
  'Trend Continuation',
  'Support & Resistance',
  'Order Block Reversal',
  'Fair Value Gap (FVG)',
  'Liquidity Sweep',
  'Mean Reversion',
  'Scalping',
];

export const TRADING_EMOTIONS = [
  { label: 'Disciplined', icon: '🎯', sentiment: 'positive' },
  { label: 'Confident', icon: '🔥', sentiment: 'positive' },
  { label: 'Patient', icon: '🧘', sentiment: 'positive' },
  { label: 'Neutral', icon: '⚖️', sentiment: 'neutral' },
  { label: 'FOMO', icon: '⚡', sentiment: 'negative' },
  { label: 'Revenge Trade', icon: '💢', sentiment: 'negative' },
  { label: 'Hesitant / Fearful', icon: '😰', sentiment: 'negative' },
  { label: 'Greedy', icon: '💰', sentiment: 'negative' },
];

export const MARKET_TYPES: MarketType[] = [
  'Forex',
  'Commodity/Indices',
  'Crypto',
  'Commodities',
  'Indices',
  'Stocks',
];

export const SUPABASE_SQL_SETUP = `-- Supabase SQL Schema for Jefextech Trading Journal
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Create instruments table
create table if not exists public.instruments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  name text not null,
  market_type text not null default 'Crypto',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create journal_days table
create table if not exists public.journal_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  notes text default '',
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- 3. Create trades table
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journal_day_id uuid references public.journal_days(id) on delete set null,
  instrument_id uuid references public.instruments(id) on delete set null,
  direction text not null check (direction in ('buy', 'sell')),
  entry_price numeric not null,
  stop_loss numeric,
  take_profit numeric,
  exit_price numeric,
  lot_size numeric not null default 1,
  result text not null check (result in ('win', 'loss', 'breakeven')),
  pnl numeric not null default 0,
  strategy text default '',
  session text default '',
  emotion text default '',
  notes text default '',
  screenshot_urls text[] default '{}',
  rules_followed int[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure rules_followed column exists if table was already created
alter table public.trades add column if not exists rules_followed int[] default '{}';
alter table public.trades add column if not exists traded_in_best_time boolean default false;
alter table public.trades add column if not exists ai_feedback text;

-- 4. Create profiles table (for round profile logo)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create trading_rules table (for user custom rules)
create table if not exists public.trading_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_number int not null,
  rule_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, rule_number)
);

-- 6. Create best_times table (for custom user instrument windows)
create table if not exists public.best_times (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  session_description text not null,
  custom_window_override text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, symbol)
);

-- Enable Row Level Security (RLS) on all tables
alter table public.instruments enable row level security;
alter table public.journal_days enable row level security;
alter table public.trades enable row level security;
alter table public.profiles enable row level security;
alter table public.trading_rules enable row level security;
alter table public.best_times enable row level security;

-- Policies for instruments
create policy "Users can manage own instruments" on public.instruments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies for best_times
create policy "Users can manage own best times" on public.best_times
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies for journal_days
create policy "Users can manage own journal days" on public.journal_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies for trades
create policy "Users can manage own trades" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies for profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies for trading_rules
create policy "Users can manage own trading rules" on public.trading_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage buckets: trade-screenshots and avatars
insert into storage.buckets (id, name, public) 
values ('trade-screenshots', 'trade-screenshots', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Storage policies for trade-screenshots
create policy "Public screenshots read" on storage.objects 
  for select using (bucket_id = 'trade-screenshots');

create policy "Authenticated users can upload screenshots" on storage.objects 
  for insert with check (bucket_id = 'trade-screenshots' and auth.role() = 'authenticated');

-- Storage policies for avatars
create policy "Public avatars read" on storage.objects 
  for select using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars" on storage.objects 
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update own avatars" on storage.objects 
  for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');
`;
