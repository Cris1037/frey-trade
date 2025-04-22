// app/api/stock-profile/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${process.env.FMP_API_KEY}`
    );
    
    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: `FMP API Error: ${response.statusText}`
      }), { status: response.status });
    }

    const data = await response.json();
    if (!data.length) return new Response(JSON.stringify({ error: 'Stock not found' }), { status: 404 });

    return new Response(JSON.stringify({
      symbol: data[0].symbol,
      companyName: data[0].companyName,
      price: data[0].price,
      mktCap: data[0].mktCap,
      changes: data[0].changes,
      exchangeShortName: data[0].exchangeShortName,
      yearHigh: data[0].yearHigh,
      yearLow: data[0].yearLow,
      beta: data[0].beta,
      open: data[0].open,
      previousClose: data[0].previousClose,
      volAvg: data[0].volAvg,
    }));

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to fetch stock profile'
    }), { status: 500 });
  }
}