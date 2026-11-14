import { historyYears, pointFromQuery } from "@/lib/data/evidence";
import { evidenceRoute, invalidEvidenceRequest } from "@/lib/services/evidence-route";
import { fetchImerg } from "@/lib/services/imerg";

export const maxDuration = 30;

const imerg = evidenceRoute("power-imerg-daily-utc-monthly-aggregation-v1", ({ lat, lon }, period) =>
  fetchImerg(lat, lon, Number(period.start), Number(period.end)).then((series) => ({ ...series, retrievedAt: series.evidence.retrievedAt })));

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const point = pointFromQuery(query);
  const years = historyYears(query, 2001);
  if (!point || !years) return invalidEvidenceRequest();
  return imerg(point, { start: String(years.start), end: String(years.end) });
}
