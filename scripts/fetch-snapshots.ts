/**
 * Refresh the offline snapshots for the demo farm with REAL data:
 *   npx tsx scripts/fetch-snapshots.ts [lat] [lon]
 * Writes data/power-daily-thoi-lai.json and data/ndvi-thoi-lai.json.
 */
import { writeFileSync } from "node:fs";
import { aggregateDaily, powerDailyUrl } from "../lib/services/power-daily";
import { fetchNdviSeries } from "../lib/services/ndvi";

const lat = Number(process.argv[2] ?? 10.0706);
const lon = Number(process.argv[3] ?? 105.5599);
const end = new Date().getUTCFullYear() - 1;
const start = end - 9;
const today = new Date().toISOString().slice(0, 10);

async function main() {
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
