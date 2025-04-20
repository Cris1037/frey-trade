export default async function handler(req, res) {
    const { symbol } = req.query;
  
    try {
      // Validate symbol parameter
      if (!symbol || typeof symbol !== 'string') {
        return res.status(400).json({ error: 'Invalid stock symbol' });
      }
  
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${process.env.FMP_API_KEY}`
      );
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error('FMP Profile Error:', {
          status: response.status,
          error: errorText,
          url: response.url
        });
        return res.status(response.status).json({ 
          error: `FMP API Error: ${response.statusText}` 
        });
      }
  
      const data = await response.json();
      
      // Validate response format
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(404).json({ error: 'Stock not found' });
      }
  
      res.status(200).json(data[0]);
  
    } catch (error) {
      console.error('Stock Profile API Error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to fetch stock profile',
        details: error.stack 
      });
    }
  }