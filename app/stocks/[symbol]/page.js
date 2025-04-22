// app/stocks/[symbol]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase-client';
import SecureRoute from '@/utils/secure-route';

import TradingChart from '../../../components/trading-chart';

export default function StockPage() {
  const router = useRouter();
  const { symbol } = useParams();
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
            changes: Number(profileData.changes) || 0,
            mktCap: Number(profileData.mktCap) || 0, // Corrected property name
            exchange: profileData.exchangeShortName,
            beta: profileData.beta,
            open: profileData.open,
            previousClose: profileData.previousClose,
            volAvg: Number(profileData.volAvg) || 0,
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
        // Fetch user immediately when component mounts
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            const currentUser = session?.user;
            setUser(currentUser || null);
            
            if (currentUser) {
              // Fetch shares only after confirming user exists
              const { data } = await supabase
                .from('holdings')
                .select('shares_owned')
                .eq('user_id', currentUser.id)
                .eq('stock_symbol', symbol)
                .single();
                
              setCurrentShares(data?.shares_owned || 0);
            }
          }
        );
    
        // Initial check
        const checkUser = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
          if (user) {
            const { data } = await supabase
              .from('holdings')
              .select('shares_owned')
              .eq('user_id', user.id)
              .eq('stock_symbol', symbol)
              .single();
              
            setCurrentShares(data?.shares_owned || 0);
          }
        };
        
        checkUser();
        return () => authListener?.subscription?.unsubscribe();
      }, [symbol]); 

    const handleTransaction = async (type) => {
        if (quantity < 1) {
          alert('Minimum quantity is 1 share');
          return;
        }
      
        try {
          // 1. Get fresh price data from FMP API
          const profileRes = await fetch(`/api/stock-profile?symbol=${symbol}`);
          if (!profileRes.ok) throw new Error('Failed to fetch stock data');
          const stockProfile = await profileRes.json();
          const currentPrice = stockProfile.price;
      
          // 2. Get account balance
          const { data: account, error: accountError } = await supabase
            .from('accounts')
            .select('balance')
            .eq('user_id', user.id)
            .single();
      
          if (accountError || !account) throw new Error(accountError?.message || 'Account not found');
      
          const totalAmount = currentPrice * quantity;
          const newBalance = type === 'buy' 
            ? account.balance - totalAmount
            : account.balance + totalAmount;
      
          // 3. Validate funds
          if (type === 'buy' && newBalance < 0) {
            alert(`Insufficient funds. Needed: $${totalAmount.toFixed(2)}`);
            return;
          }
      
          // 4. Get current holdings using symbol directly
          const { data: holding, error: holdingError } = await supabase
            .from('holdings')
            .select('*')
            .eq('user_id', user.id)
            .eq('stock_symbol', symbol)
            .maybeSingle();
      
          if (holdingError) throw holdingError;
      
          // 5. Validate sell quantity
          const currentShares = holding?.shares_owned || 0;
          if (type === 'sell' && currentShares < quantity) {
            alert(`You only own ${currentShares} shares to sell`);
            return;
          }
      
          // 6. Calculate new values
          const shares = type === 'buy' 
            ? currentShares + quantity
            : currentShares - quantity;
      
          const avgBuyPrice = type === 'buy'
            ? ((currentShares * (holding?.avg_buy_price || 0)) + totalAmount) / shares
            : holding?.avg_buy_price || 0;
      
          // 7. Execute transaction directly without stock table
          const transactionData = {
            user_id: user.id,
            stock_symbol: symbol,
            type,
            shares: quantity,
            price_at_exec: currentPrice,
            stock_name: stockProfile.companyName // Store additional info if needed
          };
      
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert(transactionData);
      
          if (transactionError) throw transactionError;
      
          // 8. Update holdings
          const { error: holdingsError } = await supabase
            .from('holdings')
            .upsert({
              id: holding?.id,
              user_id: user.id,
              stock_symbol: symbol,
              shares_owned: shares,
              avg_buy_price: avgBuyPrice,
              stock_name: stockProfile.companyName // Optional: denormalize data
            });
      
          if (holdingsError) throw holdingsError;
      
          // 9. Update account balance
          const { error: balanceError } = await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('user_id', user.id);
      
          if (balanceError) throw balanceError;
      
          // 10. Update UI
          setCurrentShares(shares);
          alert(`${type.toUpperCase()} SUCCESS!\n${quantity} @ $${currentPrice.toFixed(2)}`);
          router.refresh();
      
        } catch (error) {
          console.error('Transaction Error:', error);
          alert(`Transaction failed: ${error.message}`);
        }
      };
  
    if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
    if (!stockData) return <div className="flex justify-center items-center min-h-screen">Stock data not available</div>;

return (
    <SecureRoute>
    <div className=" min-h-screen flex justify-center items-center"> {/* Main container */}
    <button
        onClick={() => router.push('/home')}
        className="absolute top-4 left-4 bg-[#A57730] text-black px-4 py-2 rounded hover:bg-[#C4BB96] transition-colors"
    >
        Back
    </button>
        <div className="m-10 max-w-6xl  bg-[#123A41] rounded-xl shadow-lg p-6"> {/* Content wrapper */}
            <header>
                <h1 className="text-3xl font-bold mb-6 text-[#C4BB96] text-center">
                    {stockData.companyName} ({stockData.symbol})
                    <p className={` text-center ${stockData.changes > 0 ? 'text-green-500': 'text-red-500'}`} >
                        {stockData.changes}%
                    </p>
                </h1>
                
            </header>
            {/* Chart Container */}
            <div className="mb-8 border-2 border-[#A57730] p-4 rounded-lg">
                <TradingChart data={historicalData} className="w-10"/>
            </div>
            <div className='grid grid-cols-2 gap-4'>
                <div className=" p-4 border-2 border-[#A57730] rounded-lg">
                    <h2 className="text-xl font-semibold mb-4 text-[#C4BB96] text-center">Trade Shares</h2>
                    <div className="flex gap-4 items-center justify-center">
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, e.target.value))}
                            className="w-32 p-2 border-2 border-[#A57730] text-[#C4BB96] rounded"
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
                        <div className="ml-4 text-sm text-[#C4BB96]">
                            {currentShares > 0 ? `You own ${currentShares} shares` : 'No shares owned'}
                        </div>
                    </div>
                </div>
        
                {/* Metrics Grid */}
                <div className=" p-4 rounded-lg text-[#C4BB96] border-2 border-[#A57730] text-center grid grid-cols-5 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-8">Price</h3>
                        <p>${stockData.price.toFixed(2)}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Market Cap</h3>
                        <p>
                            ${(stockData.mktCap / 1e9).toLocaleString(undefined, { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2 
                            })}B
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Avg Volume</h3>
                        <p>{(stockData.volAvg / 1e4).toFixed(1)}M</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-8">Beta</h3>
                        <p>{stockData.beta}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-8">Exchange</h3>
                        <p>{stockData.exchange}</p>
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
    </SecureRoute>
    );
}