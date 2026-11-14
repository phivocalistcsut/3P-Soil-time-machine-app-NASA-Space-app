import { geocode, geocodePhoton } from "@/lib/services/geocoding";

/** Address lookup on submit. Keep the provider key server-side and never log addresses. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim();
  const headers = { "Cache-Control": "no-store" };
  if (!q || q.length < 2 || q.length > 160) return Response.json({ results: [] }, { headers });
  const key = process.env.MAPTILER_API_KEY;
  const language = params.get("lang") === "en" ? "en" : "vi";
  try {
    if (key) {
      try {
        return Response.json({ results: await geocode(q, language, key), provider: "maptiler" }, { headers });
      } catch { /* A configured provider outage can still use the public fallback. */ }
    }
    return Response.json({ results: await geocodePhoton(q, language), provider: "photon" }, { headers });
  } catch {
    return Response.json({ error: "unavailable", results: [] }, { status: 502, headers });
  }
}
