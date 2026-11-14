import { historyYears, pointFromQuery } from "@/lib/data/evidence";
import { evidenceRoute, invalidEvidenceRequest } from "@/lib/services/evidence-route";
import { upstreamJson } from "@/lib/services/http";
import { parsePowerMonthly, powerMonthlyUrl, type PowerJson } from "@/lib/services/power";

export const maxDuration = 30;

const climate = evidenceRoute("power-monthly-ag-v3", async ({ lat, lon }, period) => {
  const start = Number(period.start);
  const end = Number(period.end);
  const json = await upstreamJson<PowerJson>(powerMonthlyUrl(lat, lon, start, end));
  return parsePowerMonthly(json, { lat, lon, start, end, retrievedAt: new Date().toISOString(), cached: false });
});

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const point = pointFromQuery(query);
  const years = historyYears(query);
  if (!point || !years) return invalidEvidenceRequest();
  return climate(point, { start: String(years.start), end: String(years.end) });
}
