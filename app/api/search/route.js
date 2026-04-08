import { fetchSearchResults } from "@/utils/fmp-cache";
import { validateQueryParam } from "@/utils/validation";

export async function GET(request) {
  const { value: query, error } = validateQueryParam(request);
  if (error) return error;

  try {
    const data = await fetchSearchResults(query);
    return new Response(JSON.stringify(data));
  } catch {
    return new Response(JSON.stringify({ error: "Failed to fetch search results" }), { status: 500 });
  }
}
