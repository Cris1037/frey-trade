// app/screener/page.jsx
const filters = {
    marketCapMoreThan: 1000000000, // $1B+
    volumeMoreThan: 1000000,
    betaLowerThan: 1.2,
  };
  
  const fetchScreener = async () => {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/stock-screener?marketCapMoreThan=${filters.marketCapMoreThan}&volumeMoreThan=${filters.volumeMoreThan}&betaLowerThan=${filters.betaLowerThan}&apikey=${process.env.NEXT_PUBLIC_FMP_KEY}`
    );
    return res.json();
  };