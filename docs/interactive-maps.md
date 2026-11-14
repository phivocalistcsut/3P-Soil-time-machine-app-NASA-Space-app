# Interactive road map and NASA imagery

The farm-location step starts with an online OpenStreetMap road map. The old CARTO tiles now return an API-key watermark, so CARTO is no longer the default. Drag, zoom, click to pin, draw a boundary, use the compass and enter fullscreen directly in the map. A visible attribution and scale remain on the canvas. Satellite mode retains the explicitly dated Sentinel-2 cloudless 2023 mosaic: neither satellite mode nor NASA layers claim to be live camera imagery.

Address lookup works without a key through Photon/OSM, on explicit search submission only. It validates coordinate types/ranges and deduplicates results. A unique result moves and pins the map; multiple results require a selection. Rural-address coverage varies: adjust the pin by clicking the actual field. A local place list and manual coordinates remain available during provider outages. Optional server-side MapTiler configuration takes priority, with Photon fallback on failure. Addresses and provider keys are never logged by the application.

In My Farm, NASA controls sit below the canvas, so legends and the timeline no longer obscure the field. Each of IMERG rain, SMAP moisture and MODIS surface temperature can be switched on, viewed alone or adjusted from 0–100% opacity. The basemap comparison button temporarily hides overlays while retaining the selection and opacity. Multiple layers retain a documented draw order. Regional view zooms out; My field returns to the boundary/pin even after manual panning. Clicking an inspection point shows dates and spatial resolution without moving the farm, with a NASA Worldview link. No numerical value is invented from map colors. Expand each layer's color scale for the official GIBS legend and explanation.

The timeline supports direct month entry, presets, previous/next and playback. Daily layers request the 15th of a historical month; MODIS requests a monthly composite. “Latest” uses a product-specific publication lag estimate, not verified instant availability. Gaps can mean missing/cloudy data. These display layers do not change simulation inputs or estimates.

## Provider operating conditions

- [OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/): browser requests use the official HTTPS tile URL, retain Referer and HTTP caching, and display attribution. No proxy, scraping, bulk prefetch or offline tile download. This community service is best-effort. Use NEXT_PUBLIC_STREET_TILE_URL plus matching NEXT_PUBLIC_STREET_TILE_ATTRIBUTION for another provider when traffic grows.
- [Photon](https://github.com/komoot/photon#demo-server): public demo permits reasonable project use, may throttle and has no availability guarantee. Search is submit-only, not autocomplete. Use a private PHOTON_GEOCODING_URL or MapTiler for larger traffic.
- [NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/access-basics/): public WMTS imagery with per-product dates, spatial resolution and official legends. It is a regional visualization, not a direct field-scale measurement.

No new library, account or API key is required to run these defaults.

## Verification (2026-11-14)

- `npm test`: 41/41 passed, including new Photon response validation/outage contracts and NASA per-product dates.
- `npm run lint`, TypeScript and the production build passed. Windows build used CIRCLE_NODE_TOTAL=2 and UV_THREADPOOL_SIZE=1.
- Tested the production server in the browser: actual OSM roads loaded; a live Photon search for Buôn Ma Thuột returned selectable results and moved the pin to 12.68432 N, 108.05083 E. A mobile map click updated coordinates and enabled Continue.
- Checked SMAP imagery at March 2020, opacity 65% → 40%, solo mode, all three toggles, basemap comparison, field/regional recentering, direct month entry (October 2024), and playback (March → July 2020), then pause. Inspection shows the requested dates/resolutions and keeps the farm pin unchanged.
- Desktop and 390 px mobile: document scroll width equalled client width (1425/1425 and 375/375 respectively). Browser console contained no errors in the final check. Mobile imagery and controls were inspected visually.
- Fullscreen/compass/scale are provided by MapLibre. Fullscreen was not exercised in the automated browser check. Provider outage display is controlled; full network-offline map rendering is not promised.

Source code is ready locally. Publishing through the connected GitHub integration returned `403 Resource not accessible by integration`; GitHub CLI authentication returned 401. The user can push the Phuong branch from their authenticated normal PowerShell session and merge it into main for the existing Vercel project.
