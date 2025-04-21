// // app/_utils/api/market-data/route.js
// export default async function handler(req, res) {
//     const { symbol } = req.query;
  
//     try {
//       const response = await fetch(
//         `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${process.env.FMP_API_KEY}`
//       );
  
//       if (!response.ok) {
//         return res.status(response.status).json({ 
//           error: `FMP API Error: ${response.statusText}` 
//         });
//       }
  
//       const data = await response.json();
//       res.setHeader('Content-Type', 'application/json');
      
//       const chartData = data.historical?.map(item => ({
//         time: item.date,
//         open: item.open,
//         high: item.high,
//         low: item.low,
//         close: item.close,
//         volume: item.volume
//       })) || [];
  
//       res.status(200).json(chartData.reverse());
  
//     } catch (error) {
//       console.error('Market Data Error:', error);
//       res.status(500).json({ 
//         error: error.message || 'Failed to fetch market data'
//       });
//     }
//   }

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