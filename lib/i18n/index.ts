"use client";

import { useCallback, useMemo } from "react";
import { useApp } from "@/lib/store";
import { MESSAGES } from "./messages";
import { getCrop, SEASONS } from "@/lib/data/crops";
import type { CustomClimate, Lang, SeasonId, SuitabilityFactor } from "@/lib/types";

const MONTHS: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  vi: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
};

export function translate(lang: Lang, key: string, values?: Record<string, string | number>) {
  const m = MESSAGES[key];
  let s = m ? m[lang] : key;
  if (values) for (const [k, v] of Object.entries(values)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Values for the "{rain}" and "{temp}" placeholders of the custom climate text. */
export function climateValues(lang: Lang, c?: CustomClimate | null) {
  const v = c ?? { rainPct: 0, deltaT: 0 };
  const f = (n: number, d: number) => new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  const sign = v.rainPct > 0 ? "+" : v.rainPct < 0 ? "−" : "±";
  return { rain: `${sign}${f(Math.abs(v.rainPct), 0)}%`, temp: `+${f(v.deltaT, 1)} °C` };
}

export function useI18n() {
  const lang = useApp((s) => s.lang);
  const L = useCallback((en: string, vi: string) => (lang === "vi" ? vi : en), [lang]);
  const t = useCallback((key: string, values?: Record<string, string | number>) => translate(lang, key, values), [lang]);
  const nf = useMemo(() => (digits = 0) => new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }), [lang]);
  const num = useCallback((v: number, digits = 0) => (Number.isFinite(v) ? nf(digits).format(v) : "—"), [nf]);
  const crop = useCallback(
    (id: string | null | undefined) => (id ? getCrop(id)?.name[lang] ?? id : lang === "vi" ? "Bỏ trống" : "Empty"),
    [lang],
  );
  const cropShort = useCallback((id: string | null | undefined) => crop(id).replace(/\s*\(.*\)$/, ""), [crop]);
  const season = useCallback((id: SeasonId) => SEASONS[id].name[lang], [lang]);
  const month = useCallback((m: number) => MONTHS[lang][((m - 1) % 12 + 12) % 12], [lang]);
  const signed = useCallback((v: number, digits = 0) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${num(Math.abs(v), digits)}`, [num]);
  const factorText = useCallback(
    (f: SuitabilityFactor) => {
      const v = { ...f.values };
      if (f.id === "soil") v.texture = translate(lang, `tex.${v.texture}`);
      if (f.id === "waterlogging") v.drainage = translate(lang, `drain.${v.drainage}`);
      if (f.id === "salinity") v.risk = translate(lang, `sal.${v.risk}`);
      if (typeof v.t === "string" && lang === "vi") v.t = v.t.replace(".", ",");
      if (typeof v.tmax === "string" && lang === "vi") v.tmax = v.tmax.replace(".", ",");
      if (typeof v.ph === "string" && lang === "vi") v.ph = v.ph.replace(".", ",");
      return translate(lang, f.key, v);
    },
    [lang],
  );
  return { lang, L, t, num, crop, cropShort, season, month, signed, factorText };
}
