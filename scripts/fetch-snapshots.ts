/**
 * Refresh the offline snapshots for the demo farm with REAL data:
 *   npx tsx scripts/fetch-snapshots.ts [lat] [lon]
 *   npx tsx scripts/fetch-snapshots.ts --soil [lat] [lon]
 * Writes daily/NDVI snapshots, or data/soilgrids-thoi-lai.json with --soil.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { aggregateDaily, powerDailyUrl } from "../lib/services/power-daily";
import { fetchNdviSeries } from "../lib/services/ndvi";
import { fetchSoilGrids, SOILGRIDS_SOURCE } from "../lib/services/soilgrids";
import { validCoordinates } from "../lib/data/evidence";

const soilOnly = process.argv[2] === "--soil";
const args = process.argv.slice(soilOnly ? 3 : 2);
const lat = Number(args[0] ?? 10.0706);
const lon = Number(args[1] ?? 105.5599);
const end = new Date().getUTCFullYear() - 1;
const start = end - 9;
const today = new Date().toISOString().slice(0, 10);

async function main() {
if (!validCoordinates(lat, lon)) throw new Error("Invalid coordinates");
// Bundled files are tied to this point; do not silently replace them with another location.
if (soilOnly && (lat !== 10.0706 || lon !== 105.5599)) throw new Error("Bundled Thới Lai soil snapshot requires 10.0706, 105.5599");
if (soilOnly) {
  const path = "data/soilgrids-thoi-lai.json";
  try {
    const soil = await fetchSoilGrids(lat, lon);
    const previous = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
    if (previous?.socStockTCHa != null && previous?.clayPercent0to30 != null &&
        (soil.socStockTCHa === null || soil.clayPercent0to30 === null)) {
      console.warn("Incomplete SoilGrids lookup; keeping the previous complete snapshot and its retrieval date.");
      process.exitCode = 1;
      return;
    }
    writeFileSync(path, JSON.stringify({ latitude: lat, longitude: lon, ...soil, cached: true }, null, 2) + "\n");
    console.log(JSON.stringify(soil, null, 2));
  } catch (error) {
    // Preserve a prior real snapshot. On the first failed lookup, record the gap explicitly.
    if (!existsSync(path)) writeFileSync(path, JSON.stringify({
      latitude: lat, longitude: lon, status: "unavailable", retrievedAt: new Date().toISOString(), cached: true,
      ph: null, socPercent: null, clayPercent: null, sandPercent: null, texture: null,
      socStockTCHa: null, clayPercent0to30: null, layers: [],
      source: "ISRIC SoilGrids 2.0 WCS · 0–30 cm · lookup unavailable", sourceUrl: SOILGRIDS_SOURCE,
    }, null, 2) + "\n");
    throw error;
  }
  return;
}
const res = await fetch(powerDailyUrl(lat, lon, start, end));
if (!res.ok) throw new Error(`POWER ${res.status}`);
const daily = aggregateDaily(await res.json(), { lat, lon, start, end, retrievedAt: today, cached: true });
writeFileSync("data/power-daily-thoi-lai.json", JSON.stringify(daily));
console.log(`daily extremes: ${daily.months.length} months`);

const ndvi = await fetchNdviSeries(lat, lon);
writeFileSync("data/ndvi-thoi-lai.json", JSON.stringify({ ...ndvi, cached: true }));
console.log(`ndvi: ${ndvi.points.length} composites, ${ndvi.points[0]?.date} → ${ndvi.points.at(-1)?.date}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
