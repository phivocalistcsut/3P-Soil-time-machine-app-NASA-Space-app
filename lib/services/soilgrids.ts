import type { SoilTexture } from "@/lib/types";
import { ProviderError, upstream } from "./http";

export const SOILGRIDS_SOURCE = "https://docs.isric.org/globaldata/soilgrids/wcs.html";
// ISRIC mapped units -> conventional units (divide by the factors below):
// https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html
// SOC: dg/kg -> g/kg; clay/sand: g/kg -> %; bdod: cg/cm³ -> g/cm³ (= kg/dm³).
const VARIABLES = { phh2o: 10, soc: 10, clay: 10, sand: 10, bdod: 100 } as const;
const DEPTHS = [
  { depth: "0-5cm", thicknessCm: 5 },
  { depth: "5-15cm", thicknessCm: 10 },
  { depth: "15-30cm", thicknessCm: 15 },
] as const;
type Variable = keyof typeof VARIABLES;
type Depth = typeof DEPTHS[number]["depth"];

export interface SoilGridsLayer {
  depth: Depth;
  thicknessCm: number;
  socGKg: number | null;
  clayPercent: number | null;
  bulkDensityGCm3: number | null;
}

// Broad compatibility bucket for the crop rules; the GeoTIFF stores fractions, not texture classes.
export function soilTexture(clay: number | null, sand: number | null): SoilTexture | null {
  if (clay === null || sand === null || clay + sand > 102) return null;
  if (clay >= 40) return "clay";
  if (clay >= 27 && sand < 20) return "silty_clay";
  if (sand >= 70) return "sand";
  if (sand >= 50) return "sandy_loam";
  return "loam";
}

async function sample(variable: Variable, depth: Depth, lat: number, lon: number, fetcher: typeof fetch) {
  const q = new URLSearchParams({
    map: `/map/${variable}.map`, SERVICE: "WCS", VERSION: "2.0.1", REQUEST: "GetCoverage",
    COVERAGEID: `${variable}_${depth}_mean`, FORMAT: "image/tiff",
    SUBSETTINGCRS: "http://www.opengis.net/def/crs/EPSG/0/4326",
    OUTPUTCRS: "http://www.opengis.net/def/crs/EPSG/0/4326",
  });
  q.append("SUBSET", `long(${Math.max(-180, lon - 0.008)},${Math.min(180, lon + 0.008)})`);
  q.append("SUBSET", `lat(${Math.max(-90, lat - 0.008)},${Math.min(90, lat + 0.008)})`);
  const bytes = await upstream(`https://maps.isric.org/mapserv?${q}`, (res) => {
    if (!res.headers.get("content-type")?.includes("tiff")) throw new ProviderError("unavailable");
    return res.arrayBuffer();
  }, 20000, fetcher);
  if (bytes.byteLength > 250000) throw new ProviderError("upstream");
  const { fromArrayBuffer } = await import("geotiff");
  const raster = await (await fromArrayBuffer(bytes)).getImage();
  const [x, y] = raster.getOrigin();
  const [dx, dy] = raster.getResolution();
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || dx <= 0 || dy >= 0) return null;
  const col = Math.floor((lon - x) / dx);
  const row = Math.floor((lat - y) / dy);
  if (col < 0 || row < 0 || col >= raster.getWidth() || row >= raster.getHeight()) return null;
  const pixels = await raster.readRasters({ window: [col, row, col + 1, row + 1], samples: [0], interleave: true });
  const value = Number(pixels[0]);
  if (!Number.isFinite(value) || value === raster.getGDALNoData() || value < 0) return null;
  const normalized = value / VARIABLES[variable];
  if (variable === "phh2o") return normalized >= 2 && normalized <= 12 ? normalized : null;
  if (variable === "bdod") return normalized > 0 ? normalized : null;
  return normalized <= (variable === "soc" ? 1000 : 100) ? normalized : null;
}

export async function fetchSoilGrids(lat: number, lon: number, fetcher: typeof fetch = fetch) {
  // Eleven concurrent WCS requests, each with a 20 s total I/O budget (route: 25 s).
  // Keep successful properties when another variable/depth is missing or fails.
  const requests: { variable: Variable; depth: Depth }[] = [
    { variable: "phh2o", depth: "0-5cm" }, { variable: "sand", depth: "0-5cm" },
    ...DEPTHS.flatMap(({ depth }) => (["soc", "clay", "bdod"] as const).map((variable) => ({ variable, depth }))),
  ];
  const result = await Promise.allSettled(requests.map(({ variable, depth }) => sample(variable, depth, lat, lon, fetcher)));
  const values = result.map((r) => r.status === "fulfilled" ? r.value : null);
  if (values.every((v) => v === null)) throw new ProviderError("unavailable");
  const [ph, sandPercent] = values;
  const layers: SoilGridsLayer[] = DEPTHS.map(({ depth, thicknessCm }, i) => ({
    depth, thicknessCm, socGKg: values[2 + i * 3], clayPercent: values[3 + i * 3], bulkDensityGCm3: values[4 + i * 3],
  }));
  const socPercent = layers[0].socGKg === null ? null : layers[0].socGKg / 10;
  const clayPercent = layers[0].clayPercent;
  // Fixed 0–30 cm coverage: never interpolate or reweight an incomplete profile.
  // Stock = Σ SOC(g/kg) × BD(g/cm³) × thickness(cm) × 0.1, in t C/ha.
  // Coarse fragments (cfvo) are NOT subtracted; this is not ISRIC's independently modeled ocs layer.
  const socStockTCHa = layers.some((l) => l.socGKg === null || l.bulkDensityGCm3 === null) ? null
    : layers.reduce((sum, l) => sum + l.socGKg! * l.bulkDensityGCm3! * l.thicknessCm * 0.1, 0);
  const clayPercent0to30 = layers.some((l) => l.clayPercent === null) ? null
    : layers.reduce((sum, l) => sum + l.clayPercent! * l.thicknessCm, 0) / 30;
  return {
    ph, socPercent, clayPercent, sandPercent, texture: soilTexture(clayPercent, sandPercent),
    socStockTCHa, clayPercent0to30, layers,
    status: "estimated" as const,
    source: "ISRIC SoilGrids 2.0 WCS · 250 m · SOC stock and clay 0–30 cm; pH, SOC concentration and texture 0–5 cm · modeled",
    sourceUrl: SOILGRIDS_SOURCE, retrievedAt: new Date().toISOString(), cached: false,
  };
}
