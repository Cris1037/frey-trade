'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StockSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // components/StockSearch.jsx
const searchStocks = async (searchQuery) => {
    try {
      const res = await fetch(`/api/search?query=${searchQuery}`);
      const data = await res.json();
      
      // Transform profile response to search format
      const results = data.map(stock => ({
        symbol: stock.symbol,
        name: stock.companyName,
        exchangeShort: stock.exchangeShortName
      }));
      
      setResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  

  useEffect(() => {
    if (query.length > 2) {
      setLoading(true);
      const debounceTimer = setTimeout(() => searchStocks(query), 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [query]);

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          placeholder="Search stocks (e.g. AAPL)..."
          className="w-full p-3 border-2 border-[#A57730] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46708D]"
          onKeyDown={(e) => e.key === 'Enter' && searchStocks(query)}
        />
        <button
          onClick={() => searchStocks(query)}
          className="bg-[#A57730] text-white px-4 py-2 rounded-lg hover:bg-[#8a6128] transition-colors"
        >
          Search
        </button>
      </div>

      {loading && <div className="mt-2 text-[#46708D]">Loading...</div>}

      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
          {results.map((stock) => (
            <div
              key={stock.symbol}
              onClick={() => router.push(`/stocks/${stock.symbol}`)}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-[#46708D]">{stock.symbol}</div>
                <div className="text-sm text-gray-600">{stock.name}</div>
              </div>
              <span className="text-sm text-[#A57730]">{stock.exchangeShort}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}