import { monthPeriod, SMAP_SOURCE, type EnvironmentalSeries } from "@/lib/data/evidence";
import { ProviderError, upstream, upstreamJson } from "./http";

const ARCHIVE = "https://nasa-power-smap.s3.amazonaws.com/smap/temporal/power_smap_monthly_temporal_utc.zarr";
const BANDS = { SFMC: "surface_soil_moisture", RZMC: "root_zone_soil_moisture" } as const;
type Band = keyof typeof BANDS;

interface ArrayMetadata {
  shape: number[];
  chunks: number[];
  dtype: string;
  order: string;
  dimension_separator: string;
  compressor?: { id: string; cname: string };
  filters: { id: string; scale: number; offset: number; dtype: string; astype: string }[] | null;
}

type Metadata = { metadata: Record<string, unknown> };

async function chunk(path: string, fetcher: typeof fetch, expectedBytes: number) {
  const encoded = await upstream(`${ARCHIVE}/${path}`, async (r) => new Uint8Array(await r.arrayBuffer()), 12000, fetcher);
  // Blosc's declared decoded size is at byte offset 4. Check before allocating.
  if (encoded.byteLength < 16 || new DataView(encoded.buffer, encoded.byteOffset).getUint32(4, true) !== expectedBytes) throw new ProviderError("upstream");
  const { default: Blosc } = await import("numcodecs/blosc");
  const decoded = await Blosc.fromConfig({ id: "blosc" }).decode(encoded);
  if (decoded.byteLength !== expectedBytes) throw new ProviderError("upstream");
  return new DataView(decoded.buffer, decoded.byteOffset, decoded.byteLength);
}

function arrayMeta(metadata: Metadata["metadata"], band: string, dtype: string, dims: number) {
  const array = metadata[`${band}/.zarray`] as ArrayMetadata | undefined;
  if (array?.dtype !== dtype || array.order !== "C" || array.compressor?.id !== "blosc" ||
      array.shape?.length !== dims || array.chunks?.length !== dims ||
      [...array.shape, ...array.chunks].some((n) => !Number.isInteger(n) || n < 1 || n > 10000)) throw new ProviderError("upstream");
  return array;
}

function nearest(values: number[], target: number, wrap = false) {
  const distance = (a: number) => wrap ? Math.min(Math.abs(a - target), 360 - Math.abs(a - target)) : Math.abs(a - target);
  return values.reduce((best, value, i) => distance(value) < distance(values[best]) ? i : best, 0);
}

export function normalizeSmap(raw: number, scale: number, offset: number) {
  const value = raw / scale + offset;
  return Number.isFinite(value) && value >= 0 && value <= 0.9 + 1e-8 ? Math.round(value * 1000) / 1000 : null;
}

export async function fetchSmap(lat: number, lon: number, start: number, end: number, fetcher: typeof fetch = fetch): Promise<EnvironmentalSeries> {
  if (Math.abs(lat) > 84.66) throw new ProviderError("unavailable");
  const { metadata } = await upstreamJson<Metadata>(`${ARCHIVE}/.zmetadata`, 10000, fetcher);
  if (!metadata) throw new ProviderError("upstream");
  const readAxis = async (name: string, dtype: string) => {
    const meta = arrayMeta(metadata, name, dtype, 1);
    if (meta.chunks[0] !== meta.shape[0] || meta.filters?.length) throw new ProviderError("upstream");
    const data = await chunk(`${name}/0`, fetcher, meta.shape[0] * 8);
    return Array.from({ length: meta.shape[0] }, (_, i) => name === "time" ? Number(data.getBigInt64(i * 8, true)) : data.getFloat64(i * 8, true));
  };
  const [latitudes, longitudes, days] = await Promise.all([readAxis("lat", "<f8"), readAxis("lon", "<f8"), readAxis("time", "<i8")]);
  const units = (metadata["time/.zattrs"] as { units?: string } | undefined)?.units;
  const origin = units?.match(/^days since (\d{4}-\d{2}-\d{2}) 00:00:00$/)?.[1];
  if (!origin || !Number.isFinite(Date.parse(origin))) throw new ProviderError("upstream");
  const dates = days.map((d) => new Date(Date.parse(origin) + d * 86400000));
  const y = nearest(latitudes, lat);
  const x = nearest(longitudes, lon, true);
  // Provider advisory covers May–July 2026, including three monthly composites.
  const flagged = (date: Date) => date.getUTCFullYear() === 2026 && date.getUTCMonth() >= 4 && date.getUTCMonth() <= 6;
  const selected = dates.map((date, i) => ({ date, i })).filter(({ date }) => date.getUTCFullYear() >= start && date.getUTCFullYear() <= end);
  if (!selected.length) throw new ProviderError("unavailable");
  const byBand = await Promise.all((Object.keys(BANDS) as Band[]).map(async (band) => {
    const meta = arrayMeta(metadata, band, "<f4", 3);
    const attrs = metadata[`${band}/.zattrs`] as { units?: string; _ARRAY_DIMENSIONS?: string[] } | undefined;
    const filter = meta.filters?.[0];
    const [ct, cy, cx] = meta.chunks;
    const expected = ct * cy * cx * 4;
    if (!filter || meta.filters?.length !== 1 || filter.id !== "fixedscaleoffset" || filter.dtype !== "<f4" ||
        filter.astype !== "<f4" || !Number.isFinite(filter.scale) || filter.scale <= 0 || !Number.isFinite(filter.offset) ||
        attrs?.units !== "m3 m-3" || attrs._ARRAY_DIMENSIONS?.join(",") !== "time,lat,lon" ||
        meta.shape.join(",") !== [days.length, latitudes.length, longitudes.length].join(",") ||
        ct !== days.length || meta.dimension_separator !== "." || expected > 2000000) throw new ProviderError("upstream");

    const binary = await chunk(`${band}/0.${Math.floor(y / cy)}.${Math.floor(x / cx)}`, fetcher, expected);
    return selected.map(({ i, date }) => {
      const index = (i * cy + y % cy) * cx + x % cx;
      const value = flagged(date) ? null : normalizeSmap(binary.getFloat32(index * 4, true), filter.scale, filter.offset);
      return {
        variable: BANDS[band], value, unit: "m³/m³",
        period: monthPeriod(date.getUTCFullYear(), date.getUTCMonth() + 1),
        quality: value === null ? "missing" as const : "valid" as const,
      };
    });
  }));
  const observations = byBand.flat().sort((a, b) => a.period[0].localeCompare(b.period[0]));
  const usable = observations.filter((o) => o.value !== null);
  if (!usable.length) throw new ProviderError("unavailable");
  const version = (metadata[".zattrs"] as { version?: string } | undefined)?.version ?? "version undisclosed";
  return {
    status: "estimated", cached: false, observations,
    evidence: {
      provider: "NASA SMAP / NSIDC via NASA POWER", dataset: "SMAP Level-4 surface and root-zone soil moisture",
      productId: `SMAP L4_SM monthly ${version}; upstream collection undisclosed in archive`,
      geometry: { type: "Point", coordinates: [lon, lat] }, sampledCoordinates: [longitudes[x], latitudes[y]],
      period: [usable[0].period[0], usable.at(-1)!.period[1]],
      resolution: "~9 km native · monthly · 0.09° POWER grid",
      retrievedAt: new Date().toISOString(), sourceUrl: SMAP_SOURCE,
      quality: `${usable.length}/${observations.length} valid layer-month values; ranges and provider advisory checked; per-pixel QA unavailable in this archive`,
    },
  };
}
