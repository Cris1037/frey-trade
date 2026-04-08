import { fetchStockProfile } from "@/utils/fmp-cache";
import { validateSymbolParam } from "@/utils/validation";

export async function GET(request) {
  const { value: symbol, error } = validateSymbolParam(request);
  if (error) return error;

  try {
    const d = await fetchStockProfile(symbol);
    if (!d.symbol) return new Response(JSON.stringify({ error: "Stock not found" }), { status: 404 });

    return new Response(JSON.stringify({
      symbol: d.symbol,
      companyName: d.companyName ?? d.name ?? null,
      price: d.price,
      changesPercentage: d.changePercentage ?? null,
      changes: d.change ?? null,
      mktCap: d.marketCap ?? null,
      exchangeShortName: d.exchange ?? null,
      beta: d.beta ?? null,
      open: d.open ?? null,
      previousClose: d.previousClose ?? null,
      volAvg: d.averageVolume ?? null,
    }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Failed to fetch stock profile" }), { status: 500 });
  }
}
