"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useApp } from "@/lib/store";
import { historyYears, vegetationDates, type EnvironmentalSeries } from "@/lib/data/evidence";
import { climateWithImerg } from "@/lib/engine/environment";
import type { ClimateDataset, DailyExtremes, FarmProfile, NdviSeries, SimulationSettings } from "@/lib/types";
import { getDemoDaily, getDemoNdvi, getDemoSnapshot, getOfflineClimate, getOfflineDaily, getOfflineNdvi } from "@/lib/data/climate-datasets";

/* --------------------------- generic remote dataset --------------------------- */

export interface RemoteState<T> {
  data: T | null;
  loading: boolean;
  /** why live data was not used (offline mode, error text) */
  fallbackReason: string | null;
}

const CACHE_TTL = 12 * 60 * 60 * 1000;
const remoteMem = new Map<string, { at: number; data: unknown }>();
const inFlight = new Map<string, Promise<unknown>>();

function readLocal<T extends { cached: boolean }>(key: string): { at: number; data: T } | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null") as { at: number; data: T } | null;
    return value?.data ? { ...value, data: { ...value.data, cached: true } } : null;
  } catch { return null; }
}

/**
 * Live → memory cache → localStorage cache → offline fallback (which may be null = unavailable).
 * Never invents observations.
 */
function useRemote<T extends { cached: boolean }>(cacheKey: string | null, url: string | null, offline: () => T | null, timeoutMs: number, fallbackKey = ""): RemoteState<T> {
  const dataMode = useApp((s) => s.dataMode);
  const key = cacheKey ? `${dataMode}:${cacheKey}:${fallbackKey}` : "";
  const [state, setState] = useState<RemoteState<T> & { key: string }>({ data: null, loading: true, fallbackReason: null, key: "" });
  useEffect(() => {
    if (!cacheKey || !url) return;
    let cancelled = false;
    const done = (data: T | null, fallbackReason: string | null) => {
      if (!cancelled) setState({ data, loading: false, fallbackReason, key });
    };
    if (dataMode === "offline") {
      const stored = remoteMem.get(cacheKey);
      done(stored ? { ...(stored.data as T), cached: true } : readLocal<T>(cacheKey)?.data ?? offline(), "offline");
      return;
    }
    const mem = remoteMem.get(cacheKey);
    if (mem && Date.now() - mem.at < CACHE_TTL) {
      done({ ...(mem.data as T), cached: true }, null);
      return;
    }
    const stored = readLocal<T>(cacheKey);
    if (stored && Date.now() - stored.at < CACHE_TTL) {
      done(stored.data, null);
      return;
    }
    let pending = inFlight.get(cacheKey) as Promise<T> | undefined;
    if (!pending) {
      pending = fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error ?? `HTTP ${r.status}`);
        return r.json() as Promise<T>;
      })
      .then((data) => {
        const entry = { at: Date.now(), data };
        if (remoteMem.size >= 80) remoteMem.delete(remoteMem.keys().next().value!);
        remoteMem.set(cacheKey, entry);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(entry));
        } catch {
          /* ignore quota */
        }
        return data;
      }).finally(() => inFlight.delete(cacheKey));
      inFlight.set(cacheKey, pending);
    }
    pending.then((data) => done(data, null))
      .catch((e: Error) => done(stored?.data ?? offline(), e.name === "TimeoutError" ? "timeout" : e.message || "network"));
    return () => { cancelled = true; };
    // offline() is a pure function of the coordinates already in cacheKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, url, dataMode, timeoutMs, key]);
  if (state.key !== key) return { data: null, loading: !!cacheKey, fallbackReason: null };
  return state;
}

function usePointData<T extends { cached: boolean }>(
  farm: FarmProfile | null, endpoint: string, period: { start: string | number; end: string | number },
  offline: () => T | null, timeout: number,
) {
  const query = farm ? new URLSearchParams({
    lat: farm.latitude.toFixed(5), lon: farm.longitude.toFixed(5),
    start: String(period.start), end: String(period.end),
  }).toString() : null;
  return useRemote<T>(query ? `stm-evidence-v3-${endpoint}?${query}` : null,
    query ? `/api/${endpoint}?${query}` : null, offline, timeout, farm?.isDemo ? "demo" : "farm");
}

function useHistoryYears() {
  const selected = useApp((s) => s.historyYears);
  return selected ?? historyYears(new URLSearchParams())!;
}

function snapshotCovers(period: { start: number; end: number }, dataset: { period: [number, number] } | null) {
  return dataset && period.start === dataset.period[0] && period.end === dataset.period[1];
}

export function useDailyExtremes(farm: FarmProfile | null) {
  const years = useHistoryYears();
  return usePointData<DailyExtremes>(farm, "climate-daily", years, () => {
    const cached = farm ? farm.isDemo ? getDemoDaily() : getOfflineDaily(farm.latitude, farm.longitude) : null;
    return snapshotCovers(years, cached) ? cached : null;
  }, 32000);
}

export function useNdvi(farm: FarmProfile | null) {
  const period = vegetationDates(new URLSearchParams())!;
  return usePointData<NdviSeries>(farm, "ndvi", period,
    () => farm ? farm.isDemo ? getDemoNdvi() : getOfflineNdvi(farm.latitude, farm.longitude) : null, 62000);
}

export function useImerg(farm: FarmProfile | null) {
  const years = useHistoryYears();
  return usePointData<EnvironmentalSeries>(years.end < 2001 ? null : farm, "imerg", { ...years, start: Math.max(2001, years.start) }, () => null, 32000);
}

export function useSmap(farm: FarmProfile | null) {
  const years = useHistoryYears();
  return usePointData<EnvironmentalSeries>(years.end < 2015 ? null : farm, "smap", { ...years, start: Math.max(2015, years.start) }, () => null, 47000);
}
import { buildDefaultScenarios } from "@/lib/data/demo";
import { runEngine, type EngineOutput } from "@/lib/engine/simulate";

/** true only after the first client render (prevents SSR/localStorage mismatches) */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useHydrated() {
  const mounted = useMounted();
  const hydrated = useSyncExternalStore(
    (cb) => useApp.persist.onFinishHydration(cb),
    () => useApp.persist.hasHydrated(),
    () => false,
  );
  return mounted && hydrated;
}

/** First visit: follow the browser language (vi → Vietnamese, otherwise English). */
export function useInitialLanguage() {
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    const st = useApp.getState();
    if (st.langChosen) st.setLang(st.lang); // re-sync default scenario names
    else if (typeof navigator !== "undefined") {
      const vi = navigator.language?.toLowerCase().startsWith("vi");
      useApp.getState().setLang(vi ? "vi" : "en");
      useApp.setState({ langChosen: false });
    }
  }, [hydrated]);
  useEffect(() => {
    const unsub = useApp.subscribe((s) => {
      if (typeof document !== "undefined") document.documentElement.lang = s.lang;
    });
    if (typeof document !== "undefined") document.documentElement.lang = useApp.getState().lang;
    return unsub;
  }, []);
}

export type ClimateState = RemoteState<ClimateDataset>;

export function useClimate(farm: FarmProfile | null): ClimateState {
  const years = useHistoryYears();
  return usePointData<ClimateDataset>(farm, "climate", years, () => {
    const cached = farm ? farm.isDemo ? getDemoSnapshot() : getOfflineClimate(farm.latitude, farm.longitude) : null;
    return snapshotCovers(years, cached) ? cached : null;
  }, 32000);
}

export function useSettings(): SimulationSettings {
  const startYear = useApp((s) => s.startYear);
  const horizon = useApp((s) => s.horizon);
  const climateAssumption = useApp((s) => s.climateAssumption);
  const customClimate = useApp((s) => s.customClimate);
  const weights = useApp((s) => s.weights);
  const economics = useApp((s) => s.economics);
  return useMemo(
    () => ({ startYear, horizon, climateAssumption, customClimate, weights, economics }),
    [startYear, horizon, climateAssumption, customClimate, weights, economics],
  );
}

export function useScenarios() {
  const saved = useApp((s) => s.scenarios);
  const drafts = useApp((s) => s.scenarioDrafts);
  return useMemo(() => saved.map((scenario) => {
    const draft = drafts[scenario.id];
    if (!draft) return scenario;
    return { ...draft, name: draft.name.trim() || scenario.name };
  }), [saved, drafts]);
}

/** Run the same saved rotations and in-session drafts on every screen. */
export function useEngine(): {
  farm: FarmProfile | null;
  climate: ClimateState;
  extremes: RemoteState<DailyExtremes>;
  ndvi: RemoteState<NdviSeries>;
  imerg: RemoteState<EnvironmentalSeries>;
  smap: RemoteState<EnvironmentalSeries>;
  usesImerg: boolean;
  modelClimate: ClimateDataset | null;
  modelLoading: boolean;
  output: EngineOutput | null;
  settings: SimulationSettings;
} {
  const farm = useApp((s) => s.farm);
  const scenarios = useScenarios();
  const needsDefaults = useApp((s) => s.needsDefaultScenarios);
  const climate = useClimate(farm);
  const extremes = useDailyExtremes(farm);
  const settings = useSettings();
  const ndvi = useNdvi(farm);
  const imerg = useImerg(farm);
  const smap = useSmap(farm);
  const modelLoading = climate.loading || (!!climate.data && (imerg.loading || smap.loading || extremes.loading));
  const modelClimate = useMemo(() =>
    climate.data ? climateWithImerg(climate.data, imerg.data) : null, [climate.data, imerg.data]);
  const usesImerg = modelClimate !== climate.data;

  useEffect(() => {
    if (!farm || !modelClimate || modelLoading) return;
    if (needsDefaults || scenarios.length === 0) {
      const defaults = buildDefaultScenarios(farm, modelClimate, settings, useApp.getState().lang);
      useApp.getState().setScenarios(defaults);
      useApp.getState().markDefaultsBuilt();
    }
  }, [farm, modelClimate, modelLoading, needsDefaults, scenarios.length, settings]);

  const output = useMemo(() => {
    if (!farm || !modelClimate || modelLoading || scenarios.length === 0) return null;
    try {
      return runEngine({ farm, scenarios, climate: modelClimate, settings, extremes: extremes.data, smap: smap.data });
    } catch (e) {
      console.error("Engine error", e);
      return null;
    }
  }, [farm, modelClimate, modelLoading, scenarios, settings, extremes.data, smap.data]);

  return { farm, climate, modelClimate, modelLoading, extremes, ndvi, imerg, smap, usesImerg, output, settings };
}
