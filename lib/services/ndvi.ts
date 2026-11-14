import { isoDay, MODIS_SOURCE, vegetationDates } from "@/lib/data/evidence";
import type { NdviSeries } from "@/lib/types";
import { ProviderError, upstreamJson } from "./http";

const BASE = "https://modis.ornl.gov/rst/api/v1/MOD13Q1";
const NDVI = "250m_16_days_NDVI";
const QA = "250m_16_days_VI_Quality";
const RELIABILITY = "250m_16_days_pixel_reliability";

type ModisDate = { modis_date: string; calendar_date: string };
type BandRow = ModisDate & { band: string; data: number[] };
type Subset = { nrows: number; ncols: number; subset: BandRow[] };

export function normalizeNdvi(date: string, raw?: number, reliability?: number, viQuality?: number): NdviSeries["points"][number] {
  const base = { date, reliability, viQuality };
  if (!Number.isInteger(raw) || raw! < -2000 || raw! > 10000 ||
      !Number.isInteger(viQuality) || viQuality! < 0 || viQuality! >= 65535 ||
      !Number.isInteger(reliability) || reliability! < 0 || reliability! > 3) {
    return { ...base, ndvi: null, quality: "missing" };
  }
  // MODLAND QA bits 0–1, adjacent cloud bit 8, mixed cloud bit 10, snow bit 14, shadow bit 15.
  const modland = viQuality! & 3;
  const contaminated = Boolean(viQuality! & ((1 << 8) | (1 << 10) | (1 << 14) | (1 << 15)));
  if (reliability! >= 2 || modland >= 2 || contaminated) return { ...base, ndvi: null, quality: "rejected" };
  // Keep marginal data visible as gaps instead of interpreting it as a crop signal.
  if (reliability !== 0 || modland !== 0) return { ...base, ndvi: null, quality: "marginal" };
  return { ...base, ndvi: raw! / 10000, quality: "good" };
}

export async function fetchNdviSeries(
  lat: number,
  lon: number,
  period = vegetationDates(new URLSearchParams())!,
  fetcher: typeof fetch = fetch,
): Promise<NdviSeries> {
  const point = new URLSearchParams({ latitude: lat.toFixed(5), longitude: lon.toFixed(5) });
  const location = await upstreamJson<{ dates: ModisDate[] }>(`${BASE}/dates?${point}`, 16000, fetcher);
  if (!Array.isArray(location.dates)) throw new ProviderError("upstream");
  const wanted = location.dates.filter((d) => isoDay(d.calendar_date) && /^A\d{7}$/.test(d.modis_date) &&
    d.calendar_date >= period.start && d.calendar_date <= period.end)
    .sort((a, b) => a.calendar_date.localeCompare(b.calendar_date));
  if (!wanted.length) throw new ProviderError("unavailable");
  const chunks: ModisDate[][] = [];
  for (let i = 0; i < wanted.length; i += 10) chunks.push(wanted.slice(i, i + 10));
  const responses = await Promise.allSettled(chunks.flatMap((chunk) => [NDVI, QA, RELIABILITY].map(async (band) => {
    const query = new URLSearchParams(point);
    query.set("startDate", chunk[0].modis_date);
    query.set("endDate", chunk.at(-1)!.modis_date);
    query.set("kmAboveBelow", "0");
    query.set("kmLeftRight", "0");
    query.set("band", band);
    const data = await upstreamJson<Subset>(`${BASE}/subset?${query}`, 30000, fetcher, 20000);
    if (data.nrows !== 1 || data.ncols !== 1 || !Array.isArray(data.subset)) throw new ProviderError("upstream");
    return data.subset.filter((row) => row.band === band);
  })));
  const successful = responses.flatMap((r) => r.status === "fulfilled" ? r.value : []);
  if (![NDVI, QA, RELIABILITY].every((band) => successful.some((row) => row.band === band))) {
    const failure = responses.find((r) => r.status === "rejected");
    throw failure?.reason ?? new ProviderError("unavailable");
  }
  const samples = new Map(successful.map((row) => [`${row.modis_date}:${row.band}`, row.data?.[0]]));
  const points = wanted.map(({ modis_date: id, calendar_date: date }) =>
    normalizeNdvi(date, samples.get(`${id}:${NDVI}`), samples.get(`${id}:${RELIABILITY}`), samples.get(`${id}:${QA}`)));
  const valid = points.filter((p) => p.ndvi !== null).length;
  const retrievedAt = new Date().toISOString();
  const resolution = "250 m nominal · 16-day composite";
  return {
    status: "observed", source: "NASA MODIS Terra MOD13Q1 v061 via ORNL DAAC", product: "MOD13Q1.061",
    resolution, retrievedAt, cached: false, latitude: lat, longitude: lon, points,
    evidence: {
      provider: "NASA LP DAAC via ORNL DAAC", dataset: "MODIS Terra Vegetation Indices", productId: "MOD13Q1.061",
      geometry: { type: "Point", coordinates: [lon, lat] },
      period: [points[0].date, points.at(-1)!.date], resolution, retrievedAt, sourceUrl: MODIS_SOURCE,
      quality: `${valid}/${points.length} composite starts passed both quality layers; other dates are gaps; ${responses.filter((r) => r.status === "rejected").length} of ${responses.length} subset requests failed`,
    },
  };
}

/** Plain-language greenness class used in charts and the calendar. */
export function ndviClass(v: number | null): "none" | "low" | "medium" | "high" {
  if (v === null) return "none";
  return v < 0.3 ? "low" : v < 0.6 ? "medium" : "high";
}
