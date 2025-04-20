// app/home/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../_utils/supabase-client";
import TradingChart from "../../components/trading-chart";
import StockSearch from "../../components/stock-search";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedStock, setSelectedStock] = useState(null);

  // Fetch portfolio data
  const fetchPortfolio = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('holdings')
        .select(`
          shares_owned,
          avg_buy_price,
          stocks (ticker, name, price)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      const holdings = data.map(holding => ({
        ticker: holding.stocks.ticker,
        name: holding.stocks.name,
        shares: holding.shares_owned,
        avgPrice: holding.avg_buy_price,
        currentPrice: holding.stocks.price,
        value: holding.shares_owned * holding.stocks.price
      }));

      const total = holdings.reduce((sum, h) => sum + h.value, 0);
      setTotalValue(total);
      setPortfolio(holdings);

      // Fetch chart data if holdings exist
      if (holdings.length > 0) {
        const res = await fetch(`../../pages/api/market-data?symbol=${holdings[0].ticker}`);
        const chartData = await res.json();
        setChartData(chartData);
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchPortfolio(session.user.id);
    }
  }, [router]);

  // Check session and fetch data
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/sign-in");
      } else {
        setSession(session);
        setLoading(false);
        fetchPortfolio(session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/sign-in");
      else {
        setSession(session);
        fetchPortfolio(session.user.id);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 flex flex-col items-start min-h-screen">
      <div className="w-full flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {session.user.email}</h1>
          <p className="text-lg text-gray-600">
            Portfolio Value: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="w-full">
        <StockSearch onSelect={(symbol) => {
          setSelectedStock(symbol);
          setChartData(null);
        }} />
        </div>
        <button
          onClick={handleSignOut}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>

      {chartData && portfolio.length > 0 && (
        <div className="w-full mb-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#46708D]">
            {portfolio[0].name} Price Chart
          </h2>
          <TradingChart data={chartData}/>
        </div>
      )}

      <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">Your Holdings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Stock</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Shares</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Avg. Price</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Current Price</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {portfolio.map((holding) => (
                <tr key={holding.ticker}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{holding.name}</div>
                    <div className="text-sm text-gray-500">{holding.ticker}</div>
                  </td>
                  <td className="px-6 py-4 text-right">{holding.shares.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">${holding.avgPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">${holding.currentPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-medium">
                    ${holding.value.toLocaleString(undefined, { minimumFractionDigits:2 })}
                  </td>
                </tr>
              ))}
              {portfolio.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No holdings found. Start investing!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}