// pages/api/search.js
export default async function handler(req, res) {
  const { query } = req.query;
  
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/profile/${query}?apikey=${process.env.FMP_API_KEY}`
    );
    
    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
}