// app/api/market-data/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${process.env.FMP_API_KEY}`
    );

    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: `FMP API Error: ${response.statusText}` 
      }), { 
        status: response.status 
      });
    }

    const data = await response.json();
    const chartData = data.historical?.map(item => ({
      time: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    })) || [];

    return new Response(JSON.stringify(chartData.reverse()), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to fetch market data'
    }), { status: 500 });
  }
}