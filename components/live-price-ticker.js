// components/LivePriceTicker.jsx
'use client';
import { useEffect, useState } from 'react';

export default function LivePriceTicker({ symbols }) {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const fetchPrices = async () => {
      const res = await fetch(
        `https://financialmodelingprep.com/api/v3/quote-short/${symbols.join(',')}?apikey=${process.env.NEXT_PUBLIC_FMP_KEY}`
      );
      const data = await res.json();
      
      const newPrices = {};
      data.forEach(stock => {
        newPrices[stock.symbol] = stock.price;
      });
      
      setPrices(newPrices);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // Refresh every 10s
    
    return () => clearInterval(interval);
  }, [symbols]);

  return (
    <div className="flex gap-4 overflow-x-auto py-2 bg-[#2D3748] text-white">
      {Object.entries(prices).map(([symbol, price]) => (
        <div key={symbol} className="flex items-center gap-2">
          <span className="font-bold">{symbol}</span>
          <span>${price.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}