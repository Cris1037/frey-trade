'use client';
import { useState, useEffect, useRef } from 'react';

export default function StockSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const searchStocks = async (searchQuery) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?query=${searchQuery}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setResults(list.map(stock => ({
        symbol: stock.symbol,
        name: stock.name || stock.companyName || stock.symbol,
        exchangeShort: stock.exchangeShortName,
      })));
      setOpen(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.length > 1) {
      const timer = setTimeout(() => searchStocks(query), 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (symbol) => {
    onSelect?.(symbol);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && query.length > 1 && searchStocks(query)}
          placeholder="Search stocks…"
          className="w-full bg-[var(--bg-input)] border border-[var(--clr-border)] rounded-xl pl-9 pr-9 py-2 text-[var(--text-hi)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--clr-blue)] focus:ring-1 focus:ring-[var(--clr-blue)]/40 transition-all text-sm"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--clr-blue)]/20 border-t-[var(--clr-blue)] rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-[var(--bg-surface)] border border-[var(--clr-border)]/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-60 overflow-y-auto">
          {results.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelect(stock.symbol)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-input)] transition-colors text-left border-b border-[var(--clr-border)]/20 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-[var(--clr-blue-lt)] w-16">{stock.symbol}</span>
                <span className="text-[var(--text-md)] text-sm truncate max-w-[200px]">{stock.name}</span>
              </div>
              <span className="text-xs text-[var(--text-dim)] shrink-0">{stock.exchangeShort}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
