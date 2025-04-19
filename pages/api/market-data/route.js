export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${process.env.FMP_API_KEY}`
    );
    
    const data = await res.json();
    
    // Transform FMP data to candlestick format
    const chartData = data.historical.map(item => ({
      time: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));
  
    return NextResponse.json(chartData.reverse()); // Oldest first
  }