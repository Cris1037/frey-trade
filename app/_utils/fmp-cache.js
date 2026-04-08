import { unstable_cache } from "next/cache";

export const fetchSearchResults = unstable_cache(
  async (query) => {
    const response = await fetch(
      `https://financialmodelingprep.com/stable/search-symbol?query=${query}&apikey=${process.env.FMP_API_KEY}`
    );
    return response.json();
  },
  ["fmp-search"],
  { revalidate: 300 } // 5 minutes
);

export const fetchStockProfile = unstable_cache(
  async (symbol) => {
    const key = process.env.FMP_API_KEY;
    const base = "https://financialmodelingprep.com/stable";

    const [profileRes, quoteRes] = await Promise.all([
      fetch(`${base}/profile?symbol=${symbol}&apikey=${key}`),
      fetch(`${base}/quote?symbol=${symbol}&apikey=${key}`),
    ]);

    if (!profileRes.ok) throw new Error(`FMP API Error: ${profileRes.statusText}`);

    const [profileData, quoteData] = await Promise.all([
      profileRes.json(),
      quoteRes.ok ? quoteRes.json() : Promise.resolve([]),
    ]);

    const p = profileData[0] ?? {};
    const q = Array.isArray(quoteData) ? (quoteData[0] ?? {}) : (quoteData ?? {});

    return { ...p, ...q };
  },
  ["fmp-profile"],
  { revalidate: 60 } // 1 minute — price changes frequently
);

export const fetchMarketData = unstable_cache(
  async (symbol) => {
    const response = await fetch(
      `https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=${symbol}&apikey=${process.env.FMP_API_KEY}`
    );
    if (!response.ok) throw new Error(`FMP API Error: ${response.statusText}`);

    const data = await response.json();
    const items = Array.isArray(data) ? data : (data.historical ?? []);
    return items.map((item) => ({
      time: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    })).reverse();
  },
  ["fmp-market-data"],
  { revalidate: 600 } // 10 minutes — EOD data changes infrequently
);
