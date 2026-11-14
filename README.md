# Soil Time Machine

**See the Future of Your Soil. Shape It Today.**

A decision-support prototype (NASA Space Apps · climate-resilient crop rotation) that lets farmers compare
how different crop rotations could affect irrigation demand, soil-related outcomes and climate fit on the same
piece of land over the next 3–5 years.

> **Tóm tắt (VI):** Ứng dụng web giúp nông dân so sánh nhiều "tương lai" luân canh cho cùng một thửa ruộng:
> nhu cầu tưới, mức thiếu nước, đa dạng luân canh, triển vọng đất (định tính) và mức phù hợp khí hậu — dựa trên
> dữ liệu NASA POWER thật, mô hình quy tắc minh bạch và nhãn dữ liệu rõ ràng (Quan trắc / Ước tính / Minh họa /
> Chưa có dữ liệu). Hỗ trợ tiếng Anh và tiếng Việt.

---

## Quick start

Requirements: Node.js 20+ (tested with Node 24) and npm.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start   # production
npm test            # provider and engine regression checks
npm run engine:smoke # prints results for the demo farm
```

No provider API keys are needed. Offline mode uses previously saved data or the bundled demo snapshot.

## Demo journey (≈3 minutes)

1. Open `/` → **Try Interactive Demo** (loads the illustrative Thới Lai, Cần Thơ farm).
2. **Overview**: 10 years of NASA POWER rainfall, temperature and soil wetness; toggle NASA GIBS layers (IMERG, SMAP, MODIS LST).
3. **Explore Your Farm's Future** → **Time Machine**: pick A/B/C, drag the timeline 2026 → 2031, switch the climate assumption, edit crop cards (drag to swap seasons, click to change crop/month), read *Why did this change?*.
4. **Compare Futures**: change the year and the priority weights; watch the ranking and the score breakdown update.
5. **Build My Rotation Plan** → **Planner**: seasonal calendar, per-season requirements and risks, save / print / download.

## Screens

| Route | Screen |
| --- | --- |
| `/` | Landing page with a live mini-simulator |
| `/setup` | 4-step farm setup (map pin, boundary drawing, manual coordinates, search, farm details, soil estimate, ranked priorities, review) |
| `/overview` | Three-panel farm overview: profile · map with layers/legend · climate & land cards, plus charts |
| `/simulator` | **Time Machine** — scenario control · map + timeline + climate + soil-future diagram + "why" panel · outcome cards; rotation builder, trends, monthly water, rotation timeline |
| `/compare` | Three alternatives and the current-practice baseline, configurable weights, grouped bars, score-over-time lines, comparison table with strongest/weakest flags, "Why this scenario?" |
| `/planner` | Seasonal plan, edit sequence, save locally, print / PDF, text summary download |
| `/methodology` | All data sources, formulas, thresholds, crop catalog, limitations |
| `/settings` | Language, data mode, horizon, priorities, optional economic inputs, reset |

## Project structure

```
app/
  page.tsx                 landing
  setup/page.tsx           farm setup wizard
  (app)/layout.tsx         sidebar / mobile navigation shell
  (app)/{overview,simulator,compare,planner,methodology,settings}/page.tsx
  api/climate/route.ts     NASA POWER proxy (normalised ClimateDataset)
  api/soil/route.ts        ISRIC SoilGrids proxy (regional estimate)
  api/geocode/route.ts     Nominatim search (client falls back to an offline gazetteer)
  api/simulate/route.ts    same engine as the browser, JSON in/out (FastAPI-ready contract)
components/
  ui/                      design-system primitives (button, card, badge, fields, slider, popover, sheet, toast)
  common.tsx               status badges, crop icons, logo, language switcher, notices
  map/                     MapLibre farm map, layer panel, GIBS legends
  charts.tsx               Recharts wrappers with accessible data-table toggle
  sim/                     timeline, rotation builder, outcomes, soil profile, why panel, simulator page
  compare/ planner/ overview/ setup/ landing/
lib/
  types.ts                 FarmProfile, Crop, RotationScenario, SimulationResult, ClimateDataset …
  data/crops.ts            crop catalog (FAO-56 Kc, temperature/pH/soil/salinity/N properties)
  data/demo.ts             demo farm, default-scenario generator, rank-based weights, gazetteer
  data/climate-datasets.ts cached real POWER snapshot + clearly-labelled illustrative fallback
  data/layers.ts           NASA GIBS layer definitions (IDs verified against GetCapabilities)
  engine/climate.ts        climate assumptions, FAO-56 Penman–Monteith ET0, effective rainfall
  engine/simulate.ts       the scenario engine (water, stress, suitability, diversity, soil, N, scoring)
  i18n/                    EN/VI messages + useI18n()
  store.ts                 Zustand store persisted to localStorage
  hooks.ts                 useClimate (live → cache → fallback), useEngine (single source of truth)
data/power-snapshot-thoi-lai.json   real NASA POWER monthly data, retrieved 2026-11-07
scripts/                   engine smoke test, snapshot refresher
```

## Data architecture

Live point lookups use NASA POWER weather, GPM IMERG rainfall, SMAP Level 4 soil moisture and quality-screened MODIS NDVI. Overview → Data sources shows each record's time range, spatial scale, retrieval date and quality. NASA GIBS is reserved for map imagery. Farm soil and management inputs are stored in the browser.

The model uses IMERG rainfall when it covers every month of the POWER climate window. SMAP supports a regional drainage warning. MODIS NDVI provides context. SoilGrids WCS supplies modeled topsoil properties and 0–30 cm SOC stock / depth-weighted clay for future RothC integration; farmer measurements take priority. The demo uses a real SoilGrids snapshot alongside its illustrative farm details. An offline run uses a matching browser snapshot or the bundled Thới Lai dataset. New locations with unavailable weather wait for data.

See the [architecture, provider matrix, environment setup and live validation](docs/data-and-validation.md).

## Simulation engine (lib/engine)

Pure, deterministic, JSON-serialisable functions (`runEngine(EngineInput) → EngineOutput`):

1. Apply the climate assumption (baseline · drier −20 % rain +0.5 °C · wetter +20 % rain · warmer +1.5 °C).
2. Monthly **FAO-56 Penman–Monteith ET0** from POWER T2M, T2M_RANGE, RH2M, WS2M, ALLSKY_SFC_SW_DWN.
3. Crop water use **ETc = Kc × ET0** with FAO-56 stage curves; **FAO/AGLW effective rainfall**; paddy rice adds percolation (by texture) and land preparation.
4. Each season is evaluated against every historical year → median and 10–90 % range.
5. **Water stress** = irrigation need ÷ assumed seasonal supply (availability × source, reduced for dry-season salinity).
6. **Climate suitability**: temperature, heat stress, waterlogging × drainage, soil texture & pH, salinity, season (limiting factor weighted 60 %).
7. **Rotation diversity**: Shannon index over a trailing 3-year window.
8. **Soil improvement potential** (qualitative, 5 levels): legume/green-manure points, consecutive flooded-rice penalties, carried forward with soil memory.
9. **Fertiliser N proxy** with legume credits; optional **gross margin** only from user-entered (or explicitly illustrative) economics.
10. **Multi-criteria score** = Σ(weight × criterion) ÷ Σ weights, with per-criterion contributions; criteria without data are excluded.

Default scenarios B and C are generated per farm from the engine's own suitability screen — not hard-coded.
All parameters are listed on `/methodology`.

## Verification

Run `npm test` for mocked adapter, geometry and simulation checks. With the app running, use `npm run verify:live` to exercise the real endpoints and compare four locations. Set `STM_VERIFY_URL` for a Vercel preview or a different local port. No provider credentials are required.

## Internationalisation & accessibility

- English and Vietnamese for all navigation, controls, units, chart descriptions and warnings (`lib/i18n`). First visit follows the browser language.
- Keyboard-operable controls (Radix sliders/popovers, dnd-kit keyboard sensor), visible focus, labelled inputs, ≥44 px touch targets on mobile.
- Risk is never colour-only (icons + text), every chart has a summary and a data-table view, `prefers-reduced-motion` is respected.
- Scenario colours were validated for colour-vision deficiency (all pairs ΔE ≥ 9) and lines also use dash patterns.

## Licences & attribution

- NASA POWER and NASA GIBS imagery: NASA open data policy (no endorsement implied).
- Sentinel-2 cloudless 2023 by EOX IT Services GmbH — CC BY-NC-SA 4.0 (non-commercial use; replace for commercial deployments).
- Basemap © OpenStreetMap contributors © CARTO. Geocoding © OpenStreetMap Nominatim (light use).
- ISRIC SoilGrids — CC BY 4.0.

## Limitations

Regional pixels are not field measurements; there is no yield, pest, market or flood-depth model; the soil indicator is
qualitative with low confidence; validation with local field trials and extension officers is the necessary next step.
*This tool provides decision-support scenarios, not a substitute for local agronomic advice or field measurements.*
