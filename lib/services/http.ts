/** Shared bounded upstream I/O. Never forwards upstream bodies or credentials to callers. */
export class ProviderError extends Error {
  constructor(public readonly code: "unavailable" | "timeout" | "rate_limited" | "upstream", public readonly httpStatus?: number) {
    super(code);
  }
}

export async function upstream<T>(
  url: string,
  read: (response: Response) => Promise<T>,
  budgetMs = 19000,
  fetcher: typeof fetch = fetch,
  attemptMs = 12000,
): Promise<T> {
  const deadline = Date.now() + budgetMs;
  for (let attempt = 0; ; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new ProviderError("timeout");
    let delay = 350;
    let failure: ProviderError;
    try {
      const response = await fetcher(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(Math.min(attemptMs, remaining)),
      });
      if (response.ok) return await read(response);
      const status = response.status;
      if (status === 404 || status === 422) throw new ProviderError("unavailable", status);
      if (status === 429) {
        const retry = response.headers.get("retry-after");
        if (retry) {
          const retryMs = /^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - Date.now();
          if (Number.isFinite(retryMs)) delay = Math.max(delay, retryMs);
        }
      }
      failure = new ProviderError(status === 429 ? "rate_limited" : "upstream", status);
      await response.body?.cancel();
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      failure = new ProviderError(error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? "timeout" : "upstream");
    }
    const retryable = !failure.httpStatus || failure.httpStatus === 429 || failure.httpStatus >= 500;
    if (!retryable || attempt >= 1 || Date.now() + delay + 250 >= deadline) throw failure;
    await new Promise((resolve) => setTimeout(resolve, delay + Math.floor(Math.random() * 100)));
  }
}

export function upstreamJson<T>(url: string, budgetMs?: number, fetcher?: typeof fetch, attemptMs?: number) {
  return upstream(url, (response) => response.json() as Promise<T>, budgetMs, fetcher, attemptMs);
}
