import type { NdviSeries } from "../types";

/** Exploratory peak screening, not crop classification or a calibrated phenology model.
 * Explicit app choices: QA-screened triplets ≤40 d apart, peak≥0.5, prominence≥0.08,
 * and peaks at least 48 d apart. Never bridge long cloud gaps or overwrite farm history.
 */
export function ndviSeasonPeaks(series: NdviSeries) {
  const rows = series.points.filter(p => p.ndvi !== null && Number.isFinite(p.ndvi) &&
    (p.quality === "good" || p.quality === "marginal")).sort((a,b)=>a.date.localeCompare(b.date));
  const candidates: {date:string; ndvi:number}[] = [];
  const days = (a:string,b:string)=>(Date.parse(a)-Date.parse(b))/86400000;
  for (let i=1;i<rows.length-1;i++) {
    const [before,point,after]=[rows[i-1],rows[i],rows[i+1]];
    if (days(point.date,before.date)>40 || days(after.date,point.date)>40) continue;
    if (point.ndvi! >= 0.5 && point.ndvi! > before.ndvi! && point.ndvi! >= after.ndvi! &&
      point.ndvi! - Math.min(before.ndvi!,after.ndvi!) >= 0.08) candidates.push({date:point.date,ndvi:point.ndvi!});
  }
  const peaks: typeof candidates = [];
  for (const point of candidates.sort((a,b)=>b.ndvi-a.ndvi))
    if (peaks.every(p=>Math.abs(days(p.date,point.date))>=48)) peaks.push(point);
  return { usable: rows.length, total: series.points.length, peaks:peaks.sort((a,b)=>a.date.localeCompare(b.date)) };
}
