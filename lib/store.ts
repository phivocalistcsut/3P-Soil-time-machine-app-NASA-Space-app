"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ClimateAssumption,
  CustomClimate,
  CriterionId,
  DataMode,
  EconomicInput,
  FarmProfile,
  Lang,
  RotationScenario,
  SavedPlan,
} from "@/lib/types";
import { DEFAULT_SCENARIO_NAMES, weightsFromPriorities } from "@/lib/data/demo";
import { withRothCSoil } from "@/lib/data/farm-soil";

export type MapMetric = "stress" | "suitability" | "soil";

export interface AppState {
  lang: Lang;
  langChosen: boolean;
  dataMode: DataMode;
  farm: FarmProfile | null;
  scenarios: RotationScenario[];
  scenarioDrafts: Record<string, RotationScenario>;
  activeScenarioId: string | null;
  compareIds: string[];
  climateAssumption: ClimateAssumption;
  customClimate: CustomClimate;
  weights: Record<CriterionId, number>;
  startYear: number;
  historyYears: { start: number; end: number } | null;
  horizon: number;
  selectedYear: number;
  economics: Record<string, EconomicInput>;
  plans: SavedPlan[];
  mapMetric: MapMetric;
  /** set when scenarios must be rebuilt from the engine (new farm) */
  needsDefaultScenarios: boolean;

  setLang: (l: Lang) => void;
  setDataMode: (m: DataMode) => void;
  setFarm: (f: FarmProfile) => void;
  clearFarm: () => void;
  setScenarios: (s: RotationScenario[]) => void;
  upsertScenario: (s: RotationScenario) => void;
  setScenarioDraft: (s: RotationScenario) => void;
  discardScenarioDraft: (id: string) => void;
  removeScenario: (id: string) => void;
  setActiveScenario: (id: string) => void;
  setCompareIds: (ids: string[]) => void;
  setClimate: (c: ClimateAssumption) => void;
  setCustomClimate: (c: Partial<CustomClimate>) => void;
  setWeight: (k: CriterionId, v: number) => void;
  resetWeights: () => void;
  setYear: (y: number) => void;
  setHorizon: (h: number) => void;
  setStartYear: (y: number) => void;
  setHistoryYears: (years: AppState["historyYears"]) => void;
  setEconomics: (e: Record<string, EconomicInput>) => void;
  savePlan: (p: SavedPlan) => void;
  removePlan: (id: string) => void;
  setMapMetric: (m: MapMetric) => void;
  markDefaultsBuilt: () => void;
}

const thisYear = new Date().getFullYear();

function removeDraft(drafts: AppState["scenarioDrafts"], id: string) {
  if (!drafts[id]) return drafts;
  const remaining = { ...drafts };
  delete remaining[id];
  return remaining;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      lang: "en",
      langChosen: false,
      dataMode: "live",
      farm: null,
      scenarios: [],
      scenarioDrafts: {},
      activeScenarioId: null,
      compareIds: [],
      climateAssumption: "baseline",
      customClimate: { rainPct: -10, deltaT: 1 },
      weights: { soil: 5, water: 4, drought: 2, income: 3, inputs: 1, climate: 3 },
      startYear: thisYear,
      historyYears: null,
      horizon: 5,
      selectedYear: thisYear + 2,
      economics: {},
      plans: [],
      mapMetric: "stress",
      needsDefaultScenarios: false,

      setLang: (lang) =>
        set((st) => {
          const translateName = (s: RotationScenario) => {
            const d = DEFAULT_SCENARIO_NAMES[s.id];
            return d && (s.name === d.en || s.name === d.vi) ? { ...s, name: d[lang] } : s;
          };
          return {
            lang,
            langChosen: true,
            scenarios: st.scenarios.map(translateName),
            scenarioDrafts: Object.fromEntries(
              Object.entries(st.scenarioDrafts).map(([id, s]) => [id, translateName(s)]),
            ),
          };
        }),
      setDataMode: (dataMode) => set({ dataMode }),
      setFarm: (farm) =>
        set({
          farm,
          weights: weightsFromPriorities(farm.farmerPriorities),
          needsDefaultScenarios: true,
          scenarios: [],
          scenarioDrafts: {},
          activeScenarioId: null,
          compareIds: [],
          selectedYear: get().startYear + 2,
        }),
      clearFarm: () => set({ farm: null, scenarios: [], scenarioDrafts: {}, activeScenarioId: null, compareIds: [] }),
      setScenarios: (scenarios) =>
        set({
          scenarios,
          scenarioDrafts: {},
          activeScenarioId: scenarios[0]?.id ?? null,
          compareIds: scenarios.slice(0, 3).map((s) => s.id),
        }),
      upsertScenario: (s) =>
        set((st) => {
          const exists = st.scenarios.some((x) => x.id === s.id);
          return {
            scenarios: exists ? st.scenarios.map((x) => (x.id === s.id ? s : x)) : [...st.scenarios, s],
            scenarioDrafts: removeDraft(st.scenarioDrafts, s.id),
          };
        }),
      setScenarioDraft: (s) =>
        set((st) => st.farm?.id === s.farmId && st.scenarios.some((saved) => saved.id === s.id)
          ? { scenarioDrafts: { ...st.scenarioDrafts, [s.id]: s } }
          : st),
      discardScenarioDraft: (id) =>
        set((st) => ({ scenarioDrafts: removeDraft(st.scenarioDrafts, id) })),
      removeScenario: (id) =>
        set((st) => {
          const scenarios = st.scenarios.filter((s) => s.id !== id);
          return {
            scenarios,
            scenarioDrafts: removeDraft(st.scenarioDrafts, id),
            activeScenarioId: st.activeScenarioId === id ? scenarios[0]?.id ?? null : st.activeScenarioId,
            compareIds: st.compareIds.filter((x) => x !== id),
          };
        }),
      setActiveScenario: (activeScenarioId) => set({ activeScenarioId }),
      setCompareIds: (compareIds) => set({ compareIds: compareIds.slice(0, 3) }),
      setClimate: (climateAssumption) => set({ climateAssumption }),
      setCustomClimate: (c) => set((st) => ({ customClimate: { ...st.customClimate, ...c }, climateAssumption: "custom" })),
      setWeight: (k, v) => set((st) => ({ weights: { ...st.weights, [k]: v } })),
      resetWeights: () => {
        const f = get().farm;
        set({ weights: weightsFromPriorities(f?.farmerPriorities ?? ["soil", "water", "income", "drought", "inputs"]) });
      },
      setYear: (selectedYear) => set({ selectedYear }),
      setHorizon: (horizon) =>
        set((st) => ({ horizon, selectedYear: Math.min(st.selectedYear, st.startYear + horizon) })),
      setStartYear: (startYear) => set((st) => ({ startYear, selectedYear: startYear + Math.min(2, st.horizon) })),
      setHistoryYears: (historyYears) => set({ historyYears }),
      setEconomics: (economics) => set({ economics }),
      savePlan: (p) => set((st) => ({ plans: [p, ...st.plans.filter((x) => x.id !== p.id)] })),
      removePlan: (id) => set((st) => ({ plans: st.plans.filter((p) => p.id !== id) })),
      setMapMetric: (mapMetric) => set({ mapMetric }),
      markDefaultsBuilt: () => set({ needsDefaultScenarios: false }),
    }),
    {
      name: "soil-time-machine-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppState>;
        return { ...current, ...saved, farm: saved.farm ? withRothCSoil(saved.farm) : null };
      },
      partialize: (state) => ({ ...state, scenarioDrafts: undefined }),
    },
  ),
);
