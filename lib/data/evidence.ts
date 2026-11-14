/** Common provenance for point samples. Coordinates are [longitude, latitude]. */
export interface Evidence {
  provider: string;
  dataset: string;
  productId: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  /** Nearest grid-cell center if published by the provider. */
  sampledCoordinates?: [number, number];
  period: [string, string];
  resolution: string;
  retrievedAt: string;
  sourceUrl: string;
  quality: string;
}

export interface EnvironmentalObservation {
  variable: string;
  value: number | null;
  unit: string;
  period: [string, string];
  quality: "valid" | "missing";
}

export interface EnvironmentalSeries {
  evidence: Evidence;
  status: "observed" | "estimated";
  cached: boolean;
  observations: EnvironmentalObservation[];
}

export const POWER_SOURCE = "https://power.larc.nasa.gov/docs/services/api/temporal/";
export const MODIS_SOURCE = "https://doi.org/10.5067/MODIS/MOD13Q1.061";
export const SMAP_SOURCE = "https://power.larc.nasa.gov/docs/methodology/data/sources_hydrology/#smap";
export const IMERG_SOURCE = "https://gpm.nasa.gov/data/imerg";

export function validCoordinates(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

export function pointFromQuery(query: URLSearchParams) {
  const latText = query.get("lat")?.trim();
  const lonText = query.get("lon")?.trim();
  if (!latText || !lonText) return null;
  const lat = Number(latText);
  const lon = Number(lonText);
  if (!validCoordinates(lat, lon)) return null;
  return { lat: Number(lat.toFixed(5)), lon: Number(lon.toFixed(5)) };
}

export function historyYears(query: URLSearchParams, minimum = 1984, now = new Date()) {
  const latest = now.getUTCFullYear() - 1;
  const end = Number(query.get("end") ?? latest);
  const start = Number(query.get("start") ?? Math.max(minimum, end - 9));
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < minimum || end > latest || start > end || end - start > 9) return null;
  return { start, end };
}

export function monthPeriod(year: number, month: number): [string, string] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return [`${prefix}-01`, `${prefix}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`];
}

export function isoDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function vegetationDates(query: URLSearchParams, now = new Date()) {
  const end = query.get("end") ?? now.toISOString().slice(0, 10);
  const start = query.get("start") ?? `${now.getUTCFullYear() - 1}-01-01`;
  const days = (Date.parse(end) - Date.parse(start)) / 86400000;
  if (!isoDay(start) || !isoDay(end) || start < "2000-02-18" || end > now.toISOString().slice(0, 10) || days < 0 || days > 731) return null;
  return { start, end };
}
