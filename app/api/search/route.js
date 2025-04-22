// app/api/search/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/search?query=${query}&apikey=${process.env.FMP_API_KEY}`
    );
    const data = await response.json();
    return new Response(JSON.stringify(data));
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch search results'
    }), { status: 500 });
  }
}