import { unstable_cache } from "next/cache";
import { ProviderError } from "./http";

export type Point = { lat: number; lon: number };

/** The Next Data Cache stores successful normalized results across serverless invocations.
 * The in-flight map deduplicates concurrent requests in one worker and keeps no snapshots.
 */
export function evidenceRoute<T extends { cached: boolean; retrievedAt: string }>(
  productKey: string,
  fetchData: (point: Point, period: { start: string; end: string }) => Promise<T>,
) {
  const stored = unstable_cache(fetchData, [productKey], { revalidate: 60 * 60 * 12 });
  const inflight = new Map<string, Promise<T>>();
  return async (point: Point, period: { start: string; end: string }) => {
    const key = JSON.stringify([point, period]);
    const started = Date.now();
    let pending = inflight.get(key);
    if (!pending) {
      pending = stored(point, period).finally(() => inflight.delete(key));
      inflight.set(key, pending);
    }
    try {
      const data = await pending;
      return Response.json({ ...data, cached: Date.parse(data.retrievedAt) < started });
    } catch (error) {
      const failure = error instanceof ProviderError ? error : new ProviderError("upstream");
      console.warn("farm_evidence", productKey, failure.code, failure.httpStatus ?? "");
      const status = { unavailable: 404, timeout: 504, rate_limited: 503, upstream: 502 }[failure.code];
      return Response.json({ status: "unavailable", error: failure.code }, { status });
    }
  };
}

export function invalidEvidenceRequest() {
  return Response.json({ error: "invalid_location_or_dates" }, { status: 400 });
}
