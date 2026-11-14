import { historyYears, pointFromQuery } from "@/lib/data/evidence";
import { evidenceRoute, invalidEvidenceRequest } from "@/lib/services/evidence-route";
import { fetchSmap } from "@/lib/services/smap";

export const maxDuration = 45;

const smap = evidenceRoute("power-smap-l4-monthly-utc-sfmc-rzmc-v1", ({ lat, lon }, period) =>
  fetchSmap(lat, lon, Number(period.start), Number(period.end)).then((series) => ({ ...series, retrievedAt: series.evidence.retrievedAt })));

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const point = pointFromQuery(query);
  const years = historyYears(query, 2015);
  if (!point || !years) return invalidEvidenceRequest();
  return smap(point, { start: String(years.start), end: String(years.end) });
}
