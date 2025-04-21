// export async function GET(request) {
//   const { searchParams } = new URL(request.url);
//   const symbol = searchParams.get('symbol');

//   try {
//     const response = await fetch(
//       `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${process.env.FMP_API_KEY}`
//     );
    
//     if (!response.ok) {
//       throw new Error(`FMP API Error: ${response.status} ${response.statusText}`);
//     }

//     const data = await response.json();
    
//     if (!Array.isArray(data) || data.length === 0) {
//       return new Response(JSON.stringify({ error: 'Stock not found' }), {
//         status: 404,
//         headers: { 'Content-Type': 'application/json' }
//       });
//     }

//     return new Response(JSON.stringify(data[0]), {
//       headers: { 
//         'Content-Type': 'application/json',
//         'Cache-Control': 'public, max-age=3600'
//       }
//     });

//   } catch (error) {
//     console.error('Stock Profile API Error:', error);
//     return new Response(JSON.stringify({ 
//       error: error.message || 'Failed to fetch stock profile',
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' }
//     });
//   }
// }
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
      pe: data[0].pe,
      exchangeShortName: data[0].exchangeShortName,
      yearHigh: data[0].yearHigh,
      yearLow: data[0].yearLow,
      beta: data[0].beta,
      open: data[0].open,
      previousClose: data[0].previousClose,
      volume: data[0].volume
    }));

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to fetch stock profile'
    }), { status: 500 });
  }
}