/**
 * GET /api/geocode?q=...
 * Place search via OpenStreetMap Nominatim (usage policy: light use, identify the app,
 * search on submit only). The client falls back to a built-in gazetteer if this fails.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2 || q.length > 160) return Response.json({ results: [] });
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: "jsonv2", limit: "5", "accept-language": "vi,en" })}`,
      { signal: ctrl.signal, headers: { "User-Agent": "SoilTimeMachine/0.1 (hackathon prototype)" }, cache: "no-store" },
    );
    clearTimeout(timer);
    if (!res.ok) return Response.json({ error: `Geocoder responded ${res.status}`, results: [] }, { status: 502 });
    const json = (await res.json()) as { display_name: string; lat: string; lon: string }[];
    return Response.json({ results: json.map((r) => ({ name: r.display_name, lat: Number(r.lat), lon: Number(r.lon) })) });
  } catch {
    return Response.json({ error: "Geocoder unavailable", results: [] }, { status: 502 });
  }
}
