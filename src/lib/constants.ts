import { MarketType } from '../types';

export const STARTER_INSTRUMENTS: Array<{ symbol: string; name: string; market_type: MarketType }> = [
  { symbol: 'BTC', name: 'Bitcoin / US Dollar', market_type: 'Crypto' },
  { symbol: 'ETH', name: 'Ethereum / US Dollar', market_type: 'Crypto' },
  { symbol: 'SOL', name: 'Solana / US Dollar', market_type: 'Crypto' },
  { symbol: 'HYPE', name: 'Hyperliquid', market_type: 'Crypto' },
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', market_type: 'Commodities' },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', market_type: 'Forex' },
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
  'Crypto',
  'Commodities',
  'Indices',
  'Stocks',
];

export const SUPABASE_SQL_SETUP = `-- Supabase SQL Schema for Jefextech Trading Journal
-- Run this in your Supabase SQL Editor if you haven't created the tables yet.

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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.instruments enable row level security;
alter table public.journal_days enable row level security;
alter table public.trades enable row level security;

-- Policies for instruments
create policy "Users can manage own instruments" on public.instruments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies for journal_days
create policy "Users can manage own journal days" on public.journal_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies for trades
create policy "Users can manage own trades" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket for screenshots
insert into storage.buckets (id, name, public) 
values ('trade-screenshots', 'trade-screenshots', true)
on conflict (id) do nothing;

create policy "Public screenshots read" on storage.objects 
  for select using (bucket_id = 'trade-screenshots');

create policy "Authenticated users can upload screenshots" on storage.objects 
  for insert with check (bucket_id = 'trade-screenshots' and auth.role() = 'authenticated');
`;
