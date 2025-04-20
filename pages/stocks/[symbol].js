import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import TradingChart from '../../components/trading-chart';

export default function StockDetail() {
    const router = useRouter();
    const { symbol } = router.query;
    const [stockData, setStockData] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [currentShares, setCurrentShares] = useState(0);
    const [user, setUser] = useState(null);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          setError(null);
          setLoading(true);
    
          // Fetch stock profile
          const profileRes = await fetch(`/api/stock-profile?symbol=${symbol}`);
          if (!profileRes.ok) {
            const errorData = await profileRes.json();
            throw new Error(errorData.error || 'Failed to fetch profile');
          }
          const profileData = await profileRes.json();
    
          // Fetch historical data
          const historicalRes = await fetch(`/api/market-data?symbol=${symbol}`);
          if (!historicalRes.ok) {
            const errorData = await historicalRes.json();
            throw new Error(errorData.error || 'Failed to fetch historical data');
          }
          const historicalData = await historicalRes.json();
    
          // Validate responses
          if (!profileData?.symbol || !historicalData?.length) {
            throw new Error('Invalid stock data received from API');
          }
    
          setStockData({
            symbol: profileData.symbol,
            companyName: profileData.companyName,
            price: profileData.price,
            mktCap: Number(profileData.mktCap) || 0, // Corrected property name
            pe: profileData.pe,
            exchange: profileData.exchangeShortName,
            yearHigh: profileData.yearHigh,
            yearLow: profileData.yearLow,
            beta: profileData.beta,
            open: profileData.open,
            previousClose: profileData.previousClose,
            volume: profileData.volume
          });
          
          setHistoricalData(historicalData);
    
        } catch (error) {
          console.error('Data fetch error:', {
            error,
            symbol,
            timestamp: new Date().toISOString()
          });
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
    
      if (symbol) fetchData();
    }, [symbol]);

    useEffect(() => {
      const getUser = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          // Fetch current shares for this stock
          const { data, error } = await supabase
            .from('holdings')
            .select('shares_owned')
            .eq('user_id', user.id)
            .eq('stock_id', stockData.id)
            .single();
            
          setCurrentShares(data?.shares_owned || 0);
        }
      };
      if (stockData?.id) getUser();
    }, [stockData]);

    const handleTransaction = async (type) => {
      if (!user || quantity < 1) return;
    
      try {
        const { data: account } = await supabase
          .from('accounts')
          .select('balance')
          .eq('user_id', user.id)
          .single();
    
        const totalAmount = stockData.price * quantity;
        
        // Update balance
        const newBalance = type === 'buy' 
          ? account.balance - totalAmount
          : account.balance + totalAmount;
    
        if (type === 'buy' && newBalance < 0) {
          alert('Insufficient funds');
          return;
        }
    
        // Update holdings
        const { data: holding } = await supabase
          .from('holdings')
          .select('*')
          .eq('user_id', user.id)
          .eq('stock_id', stockData.id)
          .single();
    
        const shares = type === 'buy' 
          ? (holding?.shares_owned || 0) + quantity
          : (holding?.shares_owned || 0) - quantity;
    
        if (shares < 0) {
          alert('Cannot sell more shares than you own');
          return;
        }
    
        await supabase.from('holdings').upsert({
          id: holding?.id,
          user_id: user.id,
          stock_id: stockData.id,
          shares_owned: shares,
          avg_buy_price: type === 'buy' 
            ? ((holding?.avg_buy_price || 0) * (holding?.shares_owned || 0) + totalAmount) / shares
            : holding?.avg_buy_price
        });
    
        // Update account balance
        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('user_id', user.id);
    
        // Record transaction
        await supabase.from('transactions').insert({
          user_id: user.id,
          stock_id: stockData.id,
          type,
          shares: quantity,
          price_at_exec: stockData.price
        });
    
        router.push('/home');
      } catch (error) {
        console.error('Transaction failed:', error);
        alert('Transaction failed');
      }
    };
  
    if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
    if (!stockData) return <div className="flex justify-center items-center min-h-screen">Stock data not available</div>;
  
    return (
        <div className="bg-[#46708D] min-h-screen p-8"> {/* Main container */}
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6"> {/* Content wrapper */}
            <h1 className="text-3xl font-bold mb-6 text-[#C4BB96]">
              {stockData.companyName} ({stockData.symbol})
            </h1>
            
            {/* Chart Container */}
            <div className="mb-8 bg-[#F7FAFC] p-4 rounded-lg">
              <TradingChart data={historicalData} />
            </div>

            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-[#46708D]">Trade Shares</h2>
              <div className="flex gap-4 items-center">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, e.target.value))}
                  className="w-32 p-2 border rounded"
                />
                <button
                  onClick={() => handleTransaction('buy')}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Buy
                </button>
                <button
                  onClick={() => handleTransaction('sell')}
                  disabled={currentShares < quantity}
                  className={`px-4 py-2 rounded ${
                    currentShares >= quantity 
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Sell
                </button>
                <div className="ml-4 text-sm">
                  {currentShares > 0 ? `You own ${currentShares} shares` : 'No shares owned'}
                </div>
              </div>
            </div>
    
            {/* Metrics Grid */}
            <div className="bg-[#A57730] p-4 rounded-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Market Cap</h3>
              <p className="text-2xl">
                ${(stockData.mktCap / 1e9).toLocaleString(undefined, { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}B
              </p>
            <h3>Volume</h3>
            <p>{stockData.volume}</p>
            <h3>Beta</h3>
            <p>{stockData.beta}</p>
            <h3>Exchange</h3>
            <p>{stockData.exchange}</p>
            <h3>Year High</h3>
            <p>{stockData.yearHigh}</p>
            <h3>Year Low</h3>
            <p>{stockData.yearLow}</p>
          </div>
          </div>
        </div>
      );
  }