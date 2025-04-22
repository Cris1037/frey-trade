// app/home/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../_utils/supabase-client";
import SecureRoute from "../_utils/secure-route";

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
  const [accountBalance, setAccountBalance] = useState(0);

  const handleStockSelect = async (symbol) => {
    try {
      setSelectedStock(symbol);
      const res = await fetch(`/api/market-data?symbol=${symbol}`);
      const chartData = await res.json();
      setChartData(chartData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setChartData(null);
    }
  };

  const HoldingsRows = portfolio.map((holding) => (
    <tr 
      key={holding.ticker}
      onClick={() => handleStockSelect(holding.ticker)}
      className="hover:bg-[#A57730]/20 cursor-pointer transition-colors"
    >
      <td className="px-6 py-4">
        <div className="font-medium text-[#C4BB96]">{holding.name}</div>
        <div className="text-sm text-gray-400">{holding.ticker}</div>
      </td>
      <td className="px-6 py-4 text-right text-[#C4BB96]">{holding.shares.toFixed(2)}</td>
      <td className="px-6 py-4 text-right text-[#C4BB96]">${holding.avgPrice.toFixed(2)}</td>
      <td className="px-6 py-4 text-right text-[#C4BB96]">${holding.currentPrice.toFixed(2)}</td>
      <td className="px-6 py-4 text-right font-medium text-[#C4BB96]">
        ${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </td>
    </tr>
  ));

  const fetchPortfolio = async (userId) => {
    try {
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('holdings')
        .select(`
          shares_owned,
          avg_buy_price,
          stock_symbol,
          stock_name
        `)
        .eq('user_id', userId);
  
      if (holdingsError) throw new Error(holdingsError.message);
  
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', userId)
        .single();
  
      if (accountError) throw new Error(accountError.message);
      setAccountBalance(accountData.balance);
  
      const portfolioData = await Promise.all(
        holdingsData.map(async (holding) => {
          try {
            const res = await fetch(`/api/stock-profile?symbol=${holding.stock_symbol}`);
            if (!res.ok) throw new Error('Price fetch failed');
            const { price } = await res.json();
            return {
              ticker: holding.stock_symbol,
              name: holding.stock_name,
              shares: holding.shares_owned,
              avgPrice: holding.avg_buy_price,
              currentPrice: price,
              value: holding.shares_owned * price
            };
          } catch (error) {
            console.error(`Price fetch error for ${holding.stock_symbol}:`, error);
            return null;
          }
        })
      );
  
      // Filter out null values and calculate total
      const validHoldings = portfolioData.filter(h => h !== null);
      const total = validHoldings.reduce((sum, h) => sum + h.value, 0);
      
      setPortfolio(validHoldings);
      setTotalValue(total);
  
      // Fetch chart data if valid holdings exist
      if (validHoldings.length > 0) {
        const targetSymbol = selectedStock || validHoldings[0].ticker;
        const res = await fetch(`/api/market-data?symbol=${targetSymbol}`);
        if (res.ok) {
          setChartData(await res.json());
        }
      }
  
    } catch (error) {
      console.error("Portfolio fetch error:", {
        message: error.message,
        stack: error.stack
      });
      setPortfolio([]);
      setTotalValue(0);
      setChartData(null);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchPortfolio(session.user.id);
    }
  }, [session]); // Changed dependency to session instead of router

  // Auth and session management
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          router.replace("/sign-in");
        } else {
          setSession(session);
          setLoading(false);
          fetchPortfolio(session.user.id);
        }
      }
    );

    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        setLoading(false);
        fetchPortfolio(session.user.id);
      } else {
        router.replace("/sign-in");
      }
    };

    checkSession();
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (<SecureRoute>
    <div className="p-8 flex flex-col items-start min-h-screen">
      <div className="w-full flex justify-between items-center mt-13 relative" style={{ top: "22px" }}>
        <div className='bg-[#123A41] p-10 mb-3 rounded-tr-xl rounded-tl-xl relative z-1 '>
          <h1 className="text-2xl font-bold text-[#C4BB96]">Welcome</h1>
          <p className="text-lg text-[#C4BB96]">
            Portfolio Value: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}<br/>
            Available Balance: ${(accountBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="mt-20 w-full">
        <StockSearch onSelect={(symbol) => {
          setSelectedStock(symbol);
          setChartData(null);
        }} />
        </div>
        <button
          onClick={handleSignOut}
          className="bg-red-500 hover:bg-red-600 text-white py-2 mb-8 rounded-lg transition-colors w-40"
        >
          Sign Out
        </button>
      </div>

        {chartData && portfolio.length > 0 && (
      <div className="w-full mb-8 bg-[#123A41] rounded-xl shadow-lg p-6 relative z-0 ">
        <h2 className="text-xl font-semibold mb-4 text-[#C4BB96]">
          {(selectedStock 
            ? portfolio.find(h => h.ticker === selectedStock)?.name
            : portfolio[0]?.name
          )} Price Chart
        </h2>
        <TradingChart data={chartData}/>
      </div>
      )}

      <div className="w-full bg-[#123A41] rounded-xl shadow-lg overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b text-[#C4BB96]">Your Holdings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#A57730]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-[#123A41]">Stock</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-[#123A41]">Shares</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-[#123A41]">Avg. Price</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-[#123A41]">Current Price</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-[#123A41]">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#A57730]">
              {HoldingsRows}
              {portfolio.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-[#C4BB96]">
                    No holdings found. Start investing!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </SecureRoute>
  );
}