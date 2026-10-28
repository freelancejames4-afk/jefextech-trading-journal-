/**
 * Automatic Daylight Saving Trading Sessions & Best Windows Engine
 *
 * All sessions are defined in their native local timezones and dynamically
 * converted to Africa/Lagos (WAT, UTC+1) using browser Intl API.
 */

export interface SessionDefinition {
  id: 'tokyo' | 'london' | 'newyork' | 'us_stock';
  name: string;
  timeZone: string;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
}

export const MAJOR_SESSIONS: SessionDefinition[] = [
  {
    id: 'tokyo',
    name: 'Tokyo',
    timeZone: 'Asia/Tokyo',
    openHour: 9,
    openMinute: 0,
    closeHour: 18,
    closeMinute: 0,
  },
  {
    id: 'london',
    name: 'London',
    timeZone: 'Europe/London',
    openHour: 8,
    openMinute: 0,
    closeHour: 16,
    closeMinute: 30,
  },
  {
    id: 'newyork',
    name: 'New York',
    timeZone: 'America/New_York',
    openHour: 8,
    openMinute: 0,
    closeHour: 17,
    closeMinute: 0,
  },
];

export interface PrimeWindowRule {
  timeZone: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  label?: string;
}

export interface InstrumentBestTimeRule {
  symbol: string;
  name: string;
  marketType: 'Forex' | 'Commodity/Indices' | 'Crypto' | 'Other';
  sessionDescription: string;
  windows: PrimeWindowRule[];
  tag?: string;
  defaultNotes?: string;
}

/**
 * Resolves the UTC Date for a given local [hour, minute] on the local day in `timeZone`.
 */
export function getUtcForLocalTime(
  timeZone: string,
  hour: number,
  minute: number,
  referenceDate: Date = new Date()
): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(referenceDate);
  const partMap: Record<string, string> = {};
  for (const p of parts) partMap[p.type] = p.value;

  const y = parseInt(partMap.year, 10);
  const m = parseInt(partMap.month, 10);
  const d = parseInt(partMap.day, 10);

  const guessUtc = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));

  const localParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(guessUtc);

  const localMap: Record<string, string> = {};
  for (const p of localParts) localMap[p.type] = p.value;

  const localHour = parseInt(localMap.hour, 10);
  const localMin = parseInt(localMap.minute, 10);

  let diffMinutes = localHour * 60 + localMin - (hour * 60 + minute);
  if (diffMinutes > 720) diffMinutes -= 1440;
  if (diffMinutes < -720) diffMinutes += 1440;

  return new Date(guessUtc.getTime() - diffMinutes * 60000);
}

/**
 * Formats a Date object in Nigerian Time (Africa/Lagos).
 */
export function formatLagosTime(date: Date, includeSeconds = false): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  }).format(date);
}

/**
 * Formats a Date object as full date in Nigerian Time.
 */
export function formatLagosDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Gets live Nigerian clock information.
 */
export function getLiveNigerianClock(now: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  const weekday = map.weekday; // 'Mon', 'Tue', ... 'Sat', 'Sun'
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  const second = parseInt(map.second, 10);

  // Forex market weekend: Closed from Friday ~10:00/11:00 PM Lagos until Sunday ~10:00/11:00 PM Lagos
  // (specifically 5:00 PM NY Friday to 5:00 PM NY Sunday)
  const nyDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hourCycle: 'h23',
    weekday: 'short',
    hour: 'numeric',
  }).formatToParts(now);

  const nyMap: Record<string, string> = {};
  for (const p of nyDate) nyMap[p.type] = p.value;
  const nyWeekday = nyMap.weekday;
  const nyHour = parseInt(nyMap.hour, 10);

  const isForexWeekend =
    (nyWeekday === 'Fri' && nyHour >= 17) ||
    nyWeekday === 'Sat' ||
    (nyWeekday === 'Sun' && nyHour < 17);

  return {
    timeString: formatLagosTime(now, true),
    timeStringNoSec: formatLagosTime(now, false),
    dateString: formatLagosDate(now),
    hour,
    minute,
    second,
    weekday,
    isForexWeekend,
  };
}

/**
 * Calculates current active status and Lagos times for all 3 major sessions and overlap.
 */
export function getSessionStatus(now: Date = new Date()) {
  const tokyoStart = getUtcForLocalTime('Asia/Tokyo', 9, 0, now);
  const tokyoEnd = getUtcForLocalTime('Asia/Tokyo', 18, 0, now);

  const londonStart = getUtcForLocalTime('Europe/London', 8, 0, now);
  const londonEnd = getUtcForLocalTime('Europe/London', 16, 30, now);

  const nyStart = getUtcForLocalTime('America/New_York', 8, 0, now);
  const nyEnd = getUtcForLocalTime('America/New_York', 17, 0, now);

  const usStockStart = getUtcForLocalTime('America/New_York', 9, 30, now);
  const usStockEnd = getUtcForLocalTime('America/New_York', 16, 0, now);

  const isTokyoOpen = now >= tokyoStart && now < tokyoEnd;
  const isLondonOpen = now >= londonStart && now < londonEnd;
  const isNewYorkOpen = now >= nyStart && now < nyEnd;
  const isUsStockOpen = now >= usStockStart && now < usStockEnd;

  // London + NY Overlap is when both London and NY are open
  const isOverlap = isLondonOpen && isNewYorkOpen;

  // Overlap start is NY start (8:00 AM NY), Overlap end is London end (4:30 PM London)
  const overlapStart = nyStart;
  const overlapEnd = londonEnd;

  return {
    tokyo: {
      name: 'Tokyo',
      isOpen: isTokyoOpen,
      openLagos: formatLagosTime(tokyoStart),
      closeLagos: formatLagosTime(tokyoEnd),
    },
    london: {
      name: 'London',
      isOpen: isLondonOpen,
      openLagos: formatLagosTime(londonStart),
      closeLagos: formatLagosTime(londonEnd),
    },
    newyork: {
      name: 'New York',
      isOpen: isNewYorkOpen,
      openLagos: formatLagosTime(nyStart),
      closeLagos: formatLagosTime(nyEnd),
    },
    overlap: {
      name: 'London + NY Overlap',
      isOpen: isOverlap,
      openLagos: formatLagosTime(overlapStart),
      closeLagos: formatLagosTime(overlapEnd),
    },
    usStock: {
      name: 'US Stock Open',
      isOpen: isUsStockOpen,
      openLagos: formatLagosTime(usStockStart),
      closeLagos: formatLagosTime(usStockEnd),
    },
  };
}

/**
 * Standard Rules Mapping for all instruments
 */
export const DEFAULT_INSTRUMENT_RULES: InstrumentBestTimeRule[] = [
  // 1. EURUSD, GBPUSD: London open (first 3 hours) and London+New York overlap
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    marketType: 'Forex',
    sessionDescription: 'London Open (first 3 hrs) & London/NY Overlap',
    windows: [
      { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 11, endMinute: 0, label: 'London Open' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 11, endMinute: 30, label: 'London/NY Overlap' },
    ],
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    marketType: 'Forex',
    sessionDescription: 'London Open (first 3 hrs) & London/NY Overlap',
    windows: [
      { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 11, endMinute: 0, label: 'London Open' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 11, endMinute: 30, label: 'London/NY Overlap' },
    ],
  },

  // 2. USDJPY: Tokyo session first 4 hours, and the overlap
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    marketType: 'Forex',
    sessionDescription: 'Tokyo Open (first 4 hrs) & London/NY Overlap',
    windows: [
      { timeZone: 'Asia/Tokyo', startHour: 9, startMinute: 0, endHour: 13, endMinute: 0, label: 'Tokyo Morning' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 11, endMinute: 30, label: 'London/NY Overlap' },
    ],
  },

  // 3. GBPJPY, EURJPY: London open and overlap (mark as "High volatility")
  {
    symbol: 'GBPJPY',
    name: 'British Pound / Japanese Yen',
    marketType: 'Forex',
    sessionDescription: 'London Open & London/NY Overlap',
    tag: 'High volatility',
    windows: [
      { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 11, endMinute: 0, label: 'London Open' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 11, endMinute: 30, label: 'London/NY Overlap' },
    ],
  },
  {
    symbol: 'EURJPY',
    name: 'Euro / Japanese Yen',
    marketType: 'Forex',
    sessionDescription: 'London Open & London/NY Overlap',
    tag: 'High volatility',
    windows: [
      { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 11, endMinute: 0, label: 'London Open' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 11, endMinute: 30, label: 'London/NY Overlap' },
    ],
  },

  // 4. EURGBP, USDCHF: London session morning
  {
    symbol: 'EURGBP',
    name: 'Euro / British Pound',
    marketType: 'Forex',
    sessionDescription: 'London Session Morning',
    windows: [
      { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 12, endMinute: 0, label: 'London Morning' },
    ],
  },
  {
    symbol: 'USDCHF',
    name: 'US Dollar / Swiss Franc',
    marketType: 'Forex',
    sessionDescription: 'London Session Morning',
    windows: [
      { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 12, endMinute: 0, label: 'London Morning' },
    ],
  },

  // 5. AUDUSD, NZDUSD, AUDJPY: Tokyo session first 4 hours, then early overlap
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    marketType: 'Forex',
    sessionDescription: 'Tokyo Open (first 4 hrs) & Early London/NY Overlap',
    windows: [
      { timeZone: 'Asia/Tokyo', startHour: 9, startMinute: 0, endHour: 13, endMinute: 0, label: 'Tokyo Session' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 10, endMinute: 30, label: 'Early Overlap' },
    ],
  },
  {
    symbol: 'NZDUSD',
    name: 'New Zealand Dollar / US Dollar',
    marketType: 'Forex',
    sessionDescription: 'Tokyo Open (first 4 hrs) & Early London/NY Overlap',
    windows: [
      { timeZone: 'Asia/Tokyo', startHour: 9, startMinute: 0, endHour: 13, endMinute: 0, label: 'Tokyo Session' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 10, endMinute: 30, label: 'Early Overlap' },
    ],
  },
  {
    symbol: 'AUDJPY',
    name: 'Australian Dollar / Japanese Yen',
    marketType: 'Forex',
    sessionDescription: 'Tokyo Open (first 4 hrs) & Early London/NY Overlap',
    windows: [
      { timeZone: 'Asia/Tokyo', startHour: 9, startMinute: 0, endHour: 13, endMinute: 0, label: 'Tokyo Session' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 10, endMinute: 30, label: 'Early Overlap' },
    ],
  },

  // 6. USDCAD: New York session first 5 hours
  {
    symbol: 'USDCAD',
    name: 'US Dollar / Canadian Dollar',
    marketType: 'Forex',
    sessionDescription: 'New York Session (first 5 hrs)',
    windows: [
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 13, endMinute: 0, label: 'NY Prime Window' },
    ],
  },

  // Other Forex pairs: CADJPY, EURAUD, GBPAUD, GBPCAD
  {
    symbol: 'CADJPY',
    name: 'Canadian Dollar / Japanese Yen',
    marketType: 'Forex',
    sessionDescription: 'Tokyo Morning & New York Session Morning',
    windows: [
      { timeZone: 'Asia/Tokyo', startHour: 9, startMinute: 0, endHour: 13, endMinute: 0, label: 'Tokyo Morning' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 12, endMinute: 0, label: 'NY Morning' },
    ],
  },
  {
    symbol: 'EURAUD',
    name: 'Euro / Australian Dollar',
    marketType: 'Forex',
    sessionDescription: 'London Open & London/NY Overlap',
    windows: [
      { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 11, endMinute: 0, label: 'London Open' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 11, endMinute: 30, label: 'London/NY Overlap' },
    ],
  },
  {
    symbol: 'GBPAUD',
    name: 'British Pound / Australian Dollar',
    marketType: 'Forex',
    sessionDescription: 'London Open & London/NY Overlap',
    tag: 'High volatility',
    windows: [
      { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 11, endMinute: 0, label: 'London Open' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 11, endMinute: 30, label: 'London/NY Overlap' },
    ],
  },
  {
    symbol: 'GBPCAD',
    name: 'British Pound / Canadian Dollar',
    marketType: 'Forex',
    sessionDescription: 'London Open & London/NY Overlap',
    windows: [
      { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 11, endMinute: 0, label: 'London Open' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 12, endMinute: 0, label: 'London/NY Overlap' },
    ],
  },

  // 7. XAUUSD: London open and New York session first 4 hours
  {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    marketType: 'Commodity/Indices',
    sessionDescription: 'London Open (first 3 hrs) & New York (first 4 hrs)',
    tag: 'High volatility',
    windows: [
      { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 11, endMinute: 0, label: 'London Gold Fix' },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 12, endMinute: 0, label: 'NY Gold Session' },
    ],
  },

  // 8. NAS100, US30: first 3 hours after the US stock open
  {
    symbol: 'NAS100',
    name: 'Nasdaq 100 Index',
    marketType: 'Commodity/Indices',
    sessionDescription: 'First 3 Hours After US Stock Open',
    tag: 'Peak volume',
    windows: [
      { timeZone: 'America/New_York', startHour: 9, startMinute: 30, endHour: 12, endMinute: 30, label: 'US Stock Morning' },
    ],
  },
  {
    symbol: 'US30',
    name: 'Dow Jones 30 Index',
    marketType: 'Commodity/Indices',
    sessionDescription: 'First 3 Hours After US Stock Open',
    tag: 'Peak volume',
    windows: [
      { timeZone: 'America/New_York', startHour: 9, startMinute: 30, endHour: 12, endMinute: 30, label: 'US Stock Morning' },
    ],
  },

  // 9. BTCUSD, ETHUSD, SOLUSD, HYPEUSD: New York session, with Tokyo open as second best
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    marketType: 'Crypto',
    sessionDescription: 'New York Session & Tokyo Open',
    tag: '24/7, weaker on weekends',
    windows: [
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 17, endMinute: 0, label: 'NY Session' },
      { timeZone: 'Asia/Tokyo', startHour: 9, startMinute: 0, endHour: 13, endMinute: 0, label: 'Tokyo Open' },
    ],
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    marketType: 'Crypto',
    sessionDescription: 'New York Session & Tokyo Open',
    tag: '24/7, weaker on weekends',
    windows: [
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 17, endMinute: 0, label: 'NY Session' },
      { timeZone: 'Asia/Tokyo', startHour: 9, startMinute: 0, endHour: 13, endMinute: 0, label: 'Tokyo Open' },
    ],
  },
  {
    symbol: 'SOLUSD',
    name: 'Solana / US Dollar',
    marketType: 'Crypto',
    sessionDescription: 'New York Session & Tokyo Open',
    tag: '24/7, weaker on weekends',
    windows: [
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 17, endMinute: 0, label: 'NY Session' },
      { timeZone: 'Asia/Tokyo', startHour: 9, startMinute: 0, endHour: 13, endMinute: 0, label: 'Tokyo Open' },
    ],
  },
  {
    symbol: 'HYPEUSD',
    name: 'Hyperliquid / US Dollar',
    marketType: 'Crypto',
    sessionDescription: 'New York Session & Tokyo Open',
    tag: '24/7, weaker on weekends',
    windows: [
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 17, endMinute: 0, label: 'NY Session' },
      { timeZone: 'Asia/Tokyo', startHour: 9, startMinute: 0, endHour: 13, endMinute: 0, label: 'Tokyo Open' },
    ],
  },
];

export interface InstrumentWindowEvaluation {
  symbol: string;
  name: string;
  marketType: string;
  sessionDescription: string;
  tag?: string;
  status: 'good' | 'upcoming' | 'off' | 'weekend_closed';
  statusText: string;
  startsInMinutes?: number;
  lagosWindowStrings: string[];
  isCurrentlyPrime: boolean;
  isWeekendClosed: boolean;
}

/**
 * Evaluates the current status of an instrument's best trading windows in Nigerian Time.
 */
export function evaluateInstrumentBestTime(
  rule: InstrumentBestTimeRule,
  now: Date = new Date(),
  customOverrideText?: string | null
): InstrumentWindowEvaluation {
  const clock = getLiveNigerianClock(now);
  const isWeekendMarket = rule.marketType !== 'Crypto' && clock.isForexWeekend;

  if (isWeekendMarket) {
    // Weekend closed for forex and commodities
    const lagosWindowStrings = rule.windows.map((w) => {
      const start = getUtcForLocalTime(w.timeZone, w.startHour, w.startMinute, now);
      const end = getUtcForLocalTime(w.timeZone, w.endHour, w.endMinute, now);
      return `${formatLagosTime(start)} – ${formatLagosTime(end)}`;
    });

    return {
      symbol: rule.symbol,
      name: rule.name,
      marketType: rule.marketType,
      sessionDescription: customOverrideText || rule.sessionDescription,
      tag: rule.tag,
      status: 'weekend_closed',
      statusText: 'Weekend Closed',
      lagosWindowStrings,
      isCurrentlyPrime: false,
      isWeekendClosed: true,
    };
  }

  // Calculate concrete window intervals for today
  let isCurrentlyPrime = false;
  let nextUpcomingMinutes: number | null = null;

  const lagosWindowStrings: string[] = [];

  for (const w of rule.windows) {
    const startUtc = getUtcForLocalTime(w.timeZone, w.startHour, w.startMinute, now);
    const endUtc = getUtcForLocalTime(w.timeZone, w.endHour, w.endMinute, now);

    const startTimeLagos = formatLagosTime(startUtc);
    const endTimeLagos = formatLagosTime(endUtc);
    lagosWindowStrings.push(`${startTimeLagos} – ${endTimeLagos}`);

    const nowTime = now.getTime();
    const startTime = startUtc.getTime();
    const endTime = endUtc.getTime();

    if (nowTime >= startTime && nowTime < endTime) {
      isCurrentlyPrime = true;
    } else if (nowTime < startTime) {
      const diffMin = Math.round((startTime - nowTime) / 60000);
      if (nextUpcomingMinutes === null || diffMin < nextUpcomingMinutes) {
        nextUpcomingMinutes = diffMin;
      }
    }
  }

  if (isCurrentlyPrime) {
    return {
      symbol: rule.symbol,
      name: rule.name,
      marketType: rule.marketType,
      sessionDescription: customOverrideText || rule.sessionDescription,
      tag: rule.tag,
      status: 'good',
      statusText: 'Good time now',
      lagosWindowStrings,
      isCurrentlyPrime: true,
      isWeekendClosed: false,
    };
  }

  if (nextUpcomingMinutes !== null && nextUpcomingMinutes <= 8 * 60) {
    const hours = Math.floor(nextUpcomingMinutes / 60);
    const mins = nextUpcomingMinutes % 60;
    const timeLabel = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

    return {
      symbol: rule.symbol,
      name: rule.name,
      marketType: rule.marketType,
      sessionDescription: customOverrideText || rule.sessionDescription,
      tag: rule.tag,
      status: 'upcoming',
      statusText: `Starts in ${timeLabel.trim()}`,
      startsInMinutes: nextUpcomingMinutes,
      lagosWindowStrings,
      isCurrentlyPrime: false,
      isWeekendClosed: false,
    };
  }

  return {
    symbol: rule.symbol,
    name: rule.name,
    marketType: rule.marketType,
    sessionDescription: customOverrideText || rule.sessionDescription,
    tag: rule.tag,
    status: 'off',
    statusText: 'Off hours',
    lagosWindowStrings,
    isCurrentlyPrime: false,
    isWeekendClosed: false,
  };
}

/**
 * Finds the prime window evaluation for a given symbol.
 */
export function getEvaluationForSymbol(
  symbol: string,
  now: Date = new Date(),
  customOverrides?: Record<string, string>
): InstrumentWindowEvaluation {
  const cleanSym = symbol.trim().toUpperCase();
  const foundRule = DEFAULT_INSTRUMENT_RULES.find(
    (r) => r.symbol.toUpperCase() === cleanSym || cleanSym.startsWith(r.symbol.toUpperCase())
  );

  const override = customOverrides ? customOverrides[cleanSym] : null;

  if (foundRule) {
    return evaluateInstrumentBestTime(foundRule, now, override);
  }

  // Fallback rule for custom user pair
  const isCrypto = cleanSym.includes('BTC') || cleanSym.includes('ETH') || cleanSym.includes('SOL');
  const fallbackRule: InstrumentBestTimeRule = {
    symbol: cleanSym,
    name: cleanSym,
    marketType: isCrypto ? 'Crypto' : 'Forex',
    sessionDescription: isCrypto
      ? 'New York Session & Tokyo Open'
      : 'London Open & London/NY Overlap',
    windows: [
      { timeZone: 'Europe/London', startHour: 8, startMinute: 0, endHour: 11, endMinute: 0 },
      { timeZone: 'America/New_York', startHour: 8, startMinute: 0, endHour: 11, endMinute: 30 },
    ],
  };

  return evaluateInstrumentBestTime(fallbackRule, now, override);
}
