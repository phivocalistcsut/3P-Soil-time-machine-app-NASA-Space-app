import { validCoordinates } from "../data/evidence";

export interface PlaceResult { name: string; lat: number; lon: number; zoom: number }

/** Photon/OSM features, including addresses, POIs and administrative places. */
export function parsePhoton(json: unknown): PlaceResult[] {
  if (!json || typeof json !== "object" || !("features" in json) || !Array.isArray(json.features)) throw new Error("invalid_geocoding");
  const results: PlaceResult[] = [];
  for (const feature of json.features) {
    const point = feature?.geometry?.coordinates;
    const p = feature?.properties;
    if (feature?.geometry?.type !== "Point" || !Array.isArray(point) || typeof point[0] !== "number" || typeof point[1] !== "number" ||
      !validCoordinates(point[1], point[0]) || !p || typeof p !== "object") continue;
    const clean = (v: unknown) => typeof v === "string" ? v.trim() : "";
    const street = [clean(p.housenumber), clean(p.street)].filter(Boolean).join(" ");
    const name = [...new Set([clean(p.name), street, clean(p.district), clean(p.city), clean(p.state), clean(p.country)].filter(Boolean))].join(", ");
    if (!name || results.some(r => Math.abs(r.lon - point[0]) < 0.00001 && Math.abs(r.lat - point[1]) < 0.00001)) continue;
    const zoom = p.housenumber ? 17 : p.street ? 16 : ["state", "country", "county"].includes(p.type) ? 8 : p.type === "city" ? 12 : 14;
    results.push({ name, lon: point[0], lat: point[1], zoom });
  }
  return results.slice(0, 5);
}

/** Public Photon permits reasonable project use. Submit-only, no autocomplete. */
export async function geocodePhoton(query: string, language: "vi" | "en", fetcher: typeof fetch = fetch) {
  const base = process.env.PHOTON_GEOCODING_URL || "https://photon.komoot.io/api/";
  const url = new URL(base);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  // The public instance supports en/de/fr, with local OSM names as fallback.
  if (language === "en") url.searchParams.set("lang", "en");
  const response = await fetcher(url, {
    signal: AbortSignal.timeout(8000), cache: "no-store",
    headers: { "User-Agent": "SoilTimeMachine/0.1 (+https://github.com/phivocalistcsut/3P-Soil-time-machine-app-NASA-Space-app)", "Accept": "application/json" },
  });
  if (!response.ok) throw new Error("geocoding_unavailable");
  return parsePhoton(await response.json());
}

/** MapTiler GeoJSON contract. Discard malformed coordinates and duplicate features. */
export function parseGeocoding(json: unknown): PlaceResult[] {
  if (!json || typeof json !== "object" || !("features" in json) || !Array.isArray(json.features)) throw new Error("invalid_geocoding");
  const results: PlaceResult[] = [];
  for (const feature of json.features) {
    const point = feature?.center ?? feature?.geometry?.coordinates;
    if (!Array.isArray(point) || point.length < 2 || typeof feature.place_name !== "string" || !feature.place_name.trim() ||
      typeof point[0] !== "number" || typeof point[1] !== "number" || !validCoordinates(point[1], point[0])) continue;
    if (results.some((r) => Math.abs(r.lon - point[0]) < 0.00001 && Math.abs(r.lat - point[1]) < 0.00001)) continue;
    const type = Array.isArray(feature.place_type) ? feature.place_type : [];
    const zoom = type.includes("address") ? 17 : type.includes("poi") ? 16 : type.includes("region") || type.includes("country") ? 8 : 13;
    results.push({ name: feature.place_name, lon: point[0], lat: point[1], zoom });
  }
  return results.slice(0, 5);
}

export async function geocode(query: string, language: "vi" | "en", apiKey: string, fetcher: typeof fetch = fetch) {
  const params = new URLSearchParams({ key: apiKey, language, limit: "5", autocomplete: "false" });
  const response = await fetcher(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params}`, {
    signal: AbortSignal.timeout(8000), cache: "no-store",
  });
  if (!response.ok) throw new Error("geocoding_unavailable");
  return parseGeocoding(await response.json());
}
