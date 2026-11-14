#!/usr/bin/env node
/**
 * Refresh the bundled NASA POWER snapshot used by offline/demo mode.
 *
 *   node scripts/fetch-power-snapshot.mjs [lat] [lon] [startYear] [endYear] [outFile]
 *
 * Defaults to the Thới Lai demo farm (10.0934, 105.5185) and the last 10 complete years.
 * The output keeps real retrieved values only — nothing is synthesised.
 */
import { writeFileSync } from "node:fs";

const lat = Number(process.argv[2] ?? 10.0934);
const lon = Number(process.argv[3] ?? 105.5185);
const end = Number(process.argv[5] ? process.argv[5] : new Date().getUTCFullYear() - 1);
const start = Number(process.argv[4] ?? end - 9);
const out = process.argv[6] ?? "data/power-snapshot-thoi-lai.json";
const params = ["PRECTOTCORR", "T2M", "T2M_RANGE", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN", "GWETTOP", "GWETROOT"];

const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?${new URLSearchParams({
  parameters: params.join(","),
  community: "AG",
  latitude: String(lat),
  longitude: String(lon),
  start: String(start),
  end: String(end),
  format: "JSON",
})}`;

const res = await fetch(url);
if (!res.ok) {
  console.error(`NASA POWER responded ${res.status}`);
  process.exit(1);
}
const j = await res.json();
const p = j.properties.parameter;
const months = [];
for (let y = start; y <= end; y++) {
  for (let m = 1; m <= 12; m++) {
    const k = `${y}${String(m).padStart(2, "0")}`;
    const row = [y, m, ...params.map((x) => (p[x]?.[k] === -999 ? null : p[x]?.[k] ?? null))];
    // reorder to the snapshot field order
    const [, , pr, t, range, rh, ws, rs, gTop, gRoot] = row;
    months.push([y, m, pr, t, range, rh, ws, rs, gTop, gRoot]);
  }
}
writeFileSync(
  out,
  JSON.stringify({
    lat,
    lon,
    elevation: j.geometry?.coordinates?.[2] ?? 2,
    months,
    fields: ["year", "month", "precipMmDay", "t2m", "t2mRange", "rh2m", "ws2m", "rsMJ", "gwetTop", "gwetRoot"],
    header: j.header,
    retrievedAt: new Date().toISOString().slice(0, 10),
  }),
);
console.log(`Wrote ${months.length} months (${start}–${end}) to ${out}`);
