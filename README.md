# Soil Time Machine

**See the Future of Your Soil. Shape It Today.**

A decision-support prototype (NASA Space Apps · climate-resilient crop rotation) that lets farmers compare
how different crop rotations could affect irrigation demand, soil-related outcomes and climate fit on the same
piece of land over the next 3–5 years.

**Live demo:** https://soil-time-machine-3p.vercel.app · demo farm: rice paddy west of Thới Lai town, Cần Thơ (10.0934 °N, 105.5185 °E)

> **Tóm tắt (VI):** Ứng dụng web giúp nông dân so sánh nhiều "tương lai" luân canh cho cùng một thửa ruộng:
> nhu cầu tưới, mức thiếu nước, đa dạng luân canh, carbon hữu cơ đất (RothC, t C/ha) và mức phù hợp khí hậu — dựa trên
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

NASA/SoilGrids data need no provider key. Online address lookup optionally uses a server-side MAPTILER_API_KEY (see .env.example); without it, use the local place list or coordinates. Offline mode uses previously saved data or the bundled demo snapshots.

## Demo journey (≈3 minutes)

1. Open `/` → **Try Interactive Demo** (loads the illustrative Thới Lai, Cần Thơ farm on a real paddy location).
2. **My Farm**: rain & temperature (NASA POWER, GPM IMERG), soil & moisture (SoilGrids, SMAP), extreme days, greenness from space (MODIS NDVI), risk calendar; map with NASA GIBS layers and a 2016 → now time slider.
3. **5-Year Simulator**: pick plan A/B/C, drag the year 2026 → 2031, choose a climate assumption or your own rain/heat sliders, read *Why it changes*, the 12-month calendar and the evidence card, edit crops.
4. **Compare Plans**: plans side by side against current practice; change the priority weights and watch the ranking and the score breakdown update.
5. **Season Plan**: season-by-season plan for the selected year, whole-field water, print / PDF / text summary.

## Screens

| Route | Screen |
| --- | --- |
| `/` | Landing page with a live mini-simulator |
| `/setup` | 4-step farm setup (map pin, boundary drawing, manual coordinates, search, farm details, soil estimate, ranked priorities, review) |
| `/overview` | **My Farm** — field map with NASA layers and time slider, rain & temperature, soil & moisture, extreme days, greenness from space, data sources, risk calendar |
| `/simulator` | **5-Year Simulator** — choose plan, year and weather (presets or rain/heat sliders); results, why it changes, 12-month calendar, evidence & questions, field map, charts, crop editor |
| `/compare` | **Compare Plans** — three alternatives against current practice, priority weights, charts, detailed table with strongest/weakest flags, evidence, "Why the top plan?" |
| `/planner` | **Season Plan** — selected-year plan, season calendar, each season, each year, notes, save / print / PDF / text summary |
| `/learn` | **Guide & Glossary** — how to use the app, glossary, satellite vs field, crop roles, when to ask an expert |
| `/methodology` | All data sources, formulas, thresholds, crop catalog, limitations |
| `/settings` | Language, data mode, horizon, priorities, optional economic inputs, reset |

## Project structure

```
app/
  page.tsx                 landing
  setup/page.tsx           farm setup wizard
  (app)/layout.tsx         top-bar / mobile bottom-bar navigation shell
  (app)/{overview,simulator,compare,planner,methodology,settings}/page.tsx
  api/climate/route.ts     NASA POWER proxy (normalised ClimateDataset)
  api/soil/route.ts        ISRIC SoilGrids proxy (regional estimate)
  api/geocode/route.ts     optional MapTiler geocoding (server-only key, offline place fallback)
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
  engine/simulate.ts       the scenario engine (water, stress, suitability, diversity, N, scoring)
  engine/soil-carbon.ts    shared inverse spin-up, Dec–Nov crop/climate inputs, annual SOC and scoring
  engine/rothc.ts          pure monthly RothC pools and paddy rate extension
  i18n/                    EN/VI messages + useI18n()
  store.ts                 Zustand store persisted to localStorage
  hooks.ts                 useClimate (live → cache → fallback), useEngine (single source of truth)
data/power-snapshot-thoi-lai.json   real NASA POWER monthly data, retrieved 2026-11-07
scripts/                   engine smoke test, snapshot refresher
```

## Data architecture

Live point lookups use NASA POWER weather, GPM IMERG rainfall, SMAP Level 4 soil moisture and quality-screened MODIS NDVI. Overview → Data sources shows each record's time range, spatial scale, retrieval date and quality. NASA GIBS is reserved for map imagery. Farm soil and management inputs are stored in the browser.

The model uses IMERG rainfall when it covers every month of the POWER climate window. SMAP supports a regional drainage warning. MODIS NDVI provides context. SoilGrids WCS supplies modeled topsoil properties and 0–30 cm SOC stock / depth-weighted clay for the RothC carbon model; farmer measurements take priority. The demo uses a real SoilGrids snapshot alongside its illustrative farm details. An offline run uses a matching browser snapshot or the bundled Thới Lai dataset. New locations with unavailable weather wait for data.

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
8. **Soil organic carbon (RothC, engine 0.5.0)**: one inverse spin-up of the current rotation under baseline mean climate initializes shared pools at 0–30 cm. Future Dec–Nov cycles use adjusted monthly temperature/rainfall, pan evaporation = ET0/day × calendar days ÷ 0.75, existing monthly cover, harvest-month residue C and sourced DPM/RPM; FYM is zero without farmer input. The initial displayed year is the post-spin-up stock, followed by end-November stocks. Show SOC (t C/ha), change from the initial stock and linear annualized % change. Five display bands use −0.4, −0.1, +0.1 and +0.4%/yr; the +0.4 anchor is the aspirational 4 per 1000 reference. Score = clamp(50 + 125 × annualized %, 0, 100); soil criterion = 0.7 × score + 0.3 × diversity. Missing clay/SOC, climate or an identifiable current-practice input cycle leaves soil unavailable and excludes it from scoring. Report the inverse-input versus estimated-residue gap without rescaling residues. See [model details, smoke tables and local information gaps](docs/rothc-integration-report.md).
9. **Fertiliser N proxy** with legume credits; optional **gross margin** only from user-entered (or explicitly illustrative) economics.
10. **Multi-criteria score** = Σ(weight × criterion) ÷ Σ weights, with per-criterion contributions; criteria without data are excluded.

The three default plans are generated per farm from the engine's own suitability and irrigation screen — not hard-coded — along the real Mekong trade-off:
**A · Climate fit** keeps the main Winter–Spring rice and puts the best-fitting upland crop in the thirstiest other season ("rice – upland – rice");
**B · Water-Aware** replaces the season with the highest irrigation need (usually dry-season rice, also the most salinity-exposed) with the upland crop that needs the least water;
**C · Soil Restoration** puts a legume in that dry season and, every other year, a green-manure crop instead of flood-season rice.
B and C give up the main rice season, so their income trade-off must be checked locally.
All parameters are listed on `/methodology`.

## Verification

Run `npm test` for adapter, geometry, monthly RothC reference and integration checks; `npm run engine:smoke` prints SOC for current practice and three alternatives under all five climate assumptions. On this Windows sandbox, production builds use `$env:CIRCLE_NODE_TOTAL="2"; $env:UV_THREADPOOL_SIZE="1"; npm run build` to avoid concurrent prerender-directory creation errors. With the app running, use `npm run verify:live` to exercise the real endpoints and compare four locations. Set `STM_VERIFY_URL` for a Vercel preview or a different local port. No provider credentials are required.

## Internationalisation & accessibility

- English and Vietnamese for all navigation, controls, units, chart descriptions and warnings (`lib/i18n`). First visit follows the browser language.
- Keyboard-operable controls (Radix sliders/popovers, dnd-kit keyboard sensor), visible focus, labelled inputs, ≥44 px touch targets on mobile.
- Risk is never colour-only (icons + text), every chart has a summary and a data-table view, `prefers-reduced-motion` is respected.
- Scenario colours were validated for colour-vision deficiency (all pairs ΔE ≥ 9) and lines also use dash patterns.

## Licences & attribution

- NASA POWER and NASA GIBS imagery: NASA open data policy (no endorsement implied).
- Sentinel-2 cloudless 2023 by EOX IT Services GmbH — CC BY-NC-SA 4.0 (non-commercial use; replace for commercial deployments).
- Basemap © OpenStreetMap contributors © CARTO. Address lookup © MapTiler / OpenStreetMap (optional configured key).
- ISRIC SoilGrids — CC BY 4.0.
- NASA photographs from the NASA Image and Video Library (images.nasa.gov) — see `public/images/CREDITS.md`; no NASA endorsement implied.
- RothC reference implementation (Rothamsted Research, `RothC_Py`) — Apache 2.0, used only as a test reference (`data/rothc-reference`).

## Use of SI (AI) tools

Parts of the code, documentation and the landing-page illustrations were produced with the help of SI tools
(Claude by Anthropic; OpenAI Codex). The prompts used for the RothC work are kept in `docs/prompts`, and commits made by
SI agents carry their name. SI-generated illustrations carry a visible **"SI-generated"** watermark. NASA photographs and
all data values come from the cited providers; none are SI-generated. Every SI-assisted change was reviewed and tested
by the team (`npm test`, TypeScript, ESLint, production build).

## Limitations

Regional pixels are not field measurements; there is no yield, pest, market or flood-depth model; the soil indicator is
an estimated RothC SOC balance with low confidence — compare plans with each other rather than reading absolute SOC.
Optical NDVI (MODIS) has long cloud gaps in the Mekong wet season; radar (Sentinel-1) is the next step. SoilGrids pixels and crop residues are estimates, paddy factors need local validation, and original RothC excludes permanently waterlogged soils. Validation with local field trials and extension officers is the necessary next step.
*This tool provides decision-support scenarios, not a substitute for local agronomic advice or field measurements.*

## Landing and P1 review

The landing hero uses a decorative NASA Blue Marble globe with pause/reduced-motion support. Open the full farm demo to use simulation controls. The professional comparison label replaces the old scenario-count shorthand.

Overview now separates the 1984–last-complete-year Sen/Mann–Kendall temperature trend from the up-to-ten-year rotation climate window, which is configured in Settings. The NDVI section compares an explicit peak-screening rule with the declared crop calendar. The demo includes a real POWER/ERA5 hot-day cross-check and clearly labeled illustrative economics with source/assumption records. Run `node --import tsx scripts/validate-weather.ts --save` to refresh the independent weather comparison. ECOSTRESS ET validation and full SRTM/HLS adapters remain outstanding.

See [the implementation, MapTiler setup, measured comparison results and remaining P1 gaps](docs/landing-and-p1-review.md). Globe texture attribution/license: [image credits](public/images/CREDITS.md).
