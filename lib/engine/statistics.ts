/** Original Mann–Kendall test with tie correction and continuity correction;
 * Sen (1968) median pairwise slope. Normal approximation, independent observations.
 * This does not remove serial correlation, attribute causes or forecast temperature.
 * https://doi.org/10.2307/1907187 · https://doi.org/10.1080/01621459.1968.10480934
 */
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b), n = sorted.length;
  return n % 2 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
};

export function temperatureTrend(points: { year: number; temperature: number }[]) {
  const rows = [...points].filter((p) => Number.isFinite(p.year) && Number.isFinite(p.temperature)).sort((a,b) => a.year - b.year);
  const n = rows.length;
  if (n < 8 || new Set(rows.map(p => p.year)).size !== n) return null;
  let s = 0;
  const slopes: number[] = [], ties = new Map<number, number>();
  rows.forEach((p) => ties.set(p.temperature, (ties.get(p.temperature) ?? 0) + 1));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const difference = rows[j].temperature - rows[i].temperature;
    s += Math.sign(difference);
    slopes.push(difference / (rows[j].year - rows[i].year));
  }
  const variance = (n * (n - 1) * (2 * n + 5) - [...ties.values()].reduce((a,t) => a + t * (t - 1) * (2 * t + 5), 0)) / 18;
  const z = variance === 0 || s === 0 ? 0 : (s - Math.sign(s)) / Math.sqrt(variance);
  // Abramowitz–Stegun normal-tail approximation; two-sided p-value error < 2e-7.
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const p = Math.min(1, 2 * Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) *
    t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))));
  const slopePerYear = median(slopes);
  const intercept = median(rows.map(r => r.temperature - slopePerYear * (r.year - rows[0].year)));
  const residuals = rows.map(r => r.temperature - (intercept + slopePerYear * (r.year - rows[0].year)));
  const mean = residuals.reduce((a,b) => a + b,0) / n;
  const denominator = residuals.reduce((a,b) => a + (b - mean) ** 2,0);
  const lag1 = denominator < 1e-12 ? 0 : residuals.slice(1).reduce((sum, v, i) => sum + (v - mean) * (residuals[i] - mean), 0) / denominator;
  return { n, s, variance, z, p, slopePerYear, intercept, lag1,
    serialCorrelation: Math.abs(lag1) > 1.96 / Math.sqrt(n), start: rows[0].year, end: rows.at(-1)!.year };
}
