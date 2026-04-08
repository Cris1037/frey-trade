import { fetchMarketData } from "@/utils/fmp-cache";
import { validateSymbolParam } from "@/utils/validation";

export async function GET(request) {
  const { value: symbol, error } = validateSymbolParam(request);
  if (error) return error;

  try {
    const chartData = await fetchMarketData(symbol);
    return new Response(JSON.stringify(chartData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Failed to fetch market data" }), { status: 500 });
  }
}
