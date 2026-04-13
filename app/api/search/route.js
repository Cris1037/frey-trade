import { fetchSearchResults } from "@/utils/fmp-cache";
import { validateQueryParam } from "@/utils/validation";

export async function GET(request) {
  const { value: query, error } = validateQueryParam(request);
  if (error) return error;

  try {
    const data = await fetchSearchResults(query);
    const stocks = Array.isArray(data) ? data.filter((item) => item.type === "stock") : [];
    return new Response(JSON.stringify(stocks));
  } catch {
    return new Response(JSON.stringify({ error: "Failed to fetch search results" }), { status: 500 });
  }
}
