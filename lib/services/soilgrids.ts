import type { SoilTexture } from "@/lib/types";
import { ProviderError, upstream } from "./http";

export const SOILGRIDS_SOURCE = "https://docs.isric.org/globaldata/soilgrids/wcs.html";
const VARIABLES = { phh2o: 10, soc: 100, clay: 10, sand: 10 } as const;
type Variable = keyof typeof VARIABLES;

// Broad compatibility bucket for the crop rules; the GeoTIFF stores fractions, not texture classes.
export function soilTexture(clay: number | null, sand: number | null): SoilTexture | null {
  if (clay === null || sand === null || clay + sand > 102) return null;
  if (clay >= 40) return "clay";
  if (clay >= 27 && sand < 20) return "silty_clay";
  if (sand >= 70) return "sand";
  if (sand >= 50) return "sandy_loam";
  return "loam";
}

async function sample(variable: Variable, lat: number, lon: number) {
  const q = new URLSearchParams({
    map: `/map/${variable}.map`, SERVICE: "WCS", VERSION: "2.0.1", REQUEST: "GetCoverage",
    COVERAGEID: `${variable}_0-5cm_mean`, FORMAT: "image/tiff",
    SUBSETTINGCRS: "http://www.opengis.net/def/crs/EPSG/0/4326",
    OUTPUTCRS: "http://www.opengis.net/def/crs/EPSG/0/4326",
  });
  q.append("SUBSET", `long(${Math.max(-180, lon - 0.008)},${Math.min(180, lon + 0.008)})`);
  q.append("SUBSET", `lat(${Math.max(-90, lat - 0.008)},${Math.min(90, lat + 0.008)})`);
  const bytes = await upstream(`https://maps.isric.org/mapserv?${q}`, (res) => {
    if (!res.headers.get("content-type")?.includes("tiff")) throw new ProviderError("unavailable");
    return res.arrayBuffer();
  }, 15000);
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
  if (!Number.isFinite(value) || value === raster.getGDALNoData() || value <= 0) return null;
  const normalized = value / VARIABLES[variable];
  if (variable === "phh2o") return normalized >= 2 && normalized <= 12 ? normalized : null;
  return normalized <= 100 ? normalized : null;
}

export async function fetchSoilGrids(lat: number, lon: number) {
  const result = await Promise.allSettled((Object.keys(VARIABLES) as Variable[]).map((v) => sample(v, lat, lon)));
  const [ph, socPercent, clayPercent, sandPercent] = result.map((r) => r.status === "fulfilled" ? r.value : null);
  if ([ph, socPercent, clayPercent, sandPercent].every((v) => v === null)) throw new ProviderError("unavailable");
  return {
    ph, socPercent, clayPercent, sandPercent, texture: soilTexture(clayPercent, sandPercent),
    source: "ISRIC SoilGrids 2.0 WCS · 250 m · 0–5 cm · modeled",
    sourceUrl: SOILGRIDS_SOURCE, retrievedAt: new Date().toISOString(), cached: false,
  };
}
