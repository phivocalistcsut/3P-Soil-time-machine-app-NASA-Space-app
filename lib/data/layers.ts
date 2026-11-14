/**
 * Map layers actually available to this prototype. NASA overlays are served as WMTS
 * tiles by NASA GIBS (Global Imagery Browse Services) — public, no key required.
 * Layer identifiers and tile-matrix sets were checked against the GIBS EPSG:3857
 * GetCapabilities document.
 */
export type OverlayId = "imerg" | "smap" | "lst";

export interface OverlayDef {
  id: OverlayId;
  gibsLayer: string;
  matrixSet: string;
  maxZoom: number;
  /** days to step back from today to reach a date that is normally published */
  lagDays: number;
  monthly?: boolean;
  name: { en: string; vi: string };
  product: string;
  status: "observed" | "estimated";
  resolution: { en: string; vi: string };
  legendUrl: string;
  unit: string;
  desc: { en: string; vi: string };
}

export const OVERLAYS: OverlayDef[] = [
  {
    id: "imerg",
    gibsLayer: "IMERG_Precipitation_Rate",
    matrixSet: "GoogleMapsCompatible_Level6",
    maxZoom: 6,
    lagDays: 3,
    name: { en: "Rainfall (GPM IMERG)", vi: "Lượng mưa (GPM IMERG)" },
    product: "NASA GPM IMERG precipitation rate, daily",
    status: "estimated",
    resolution: { en: "0.1° (≈11 km)", vi: "0,1° (≈11 km)" },
    legendUrl: "https://gibs.earthdata.nasa.gov/legends/GPM_Precipitation_Rate_H.svg",
    unit: "mm/hr",
    desc: {
      en: "Satellite precipitation estimate for one day. Shows regional rain patterns, not rain on a single field.",
      vi: "Ước tính mưa từ vệ tinh cho một ngày. Thể hiện mưa theo vùng, không phải mưa trên từng thửa ruộng.",
    },
  },
  {
    id: "smap",
    gibsLayer: "SMAP_L4_Analyzed_Surface_Soil_Moisture",
    matrixSet: "GoogleMapsCompatible_Level6",
    maxZoom: 6,
    lagDays: 4,
    name: { en: "Soil moisture (SMAP L4)", vi: "Độ ẩm đất (SMAP L4)" },
    product: "NASA SMAP L4 analyzed surface soil moisture (0–5 cm), daily",
    status: "estimated",
    resolution: { en: "9 km grid", vi: "Lưới 9 km" },
    legendUrl: "https://gibs.earthdata.nasa.gov/legends/SMAP_Analyzed_Soil_Moisture_H.svg",
    unit: "m³/m³",
    desc: {
      en: "Model-assimilated satellite soil moisture. One pixel covers many farms; flooded paddies may not be represented.",
      vi: "Độ ẩm đất vệ tinh đã đồng hóa mô hình. Một điểm ảnh bao phủ nhiều trang trại; ruộng ngập nước có thể không được thể hiện đúng.",
    },
  },
  {
    id: "lst",
    gibsLayer: "MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day",
    matrixSet: "GoogleMapsCompatible_Level6",
    maxZoom: 6,
    lagDays: 0,
    monthly: true,
    name: { en: "Surface temperature (MODIS)", vi: "Nhiệt độ bề mặt (MODIS)" },
    product: "NASA MODIS Terra land surface temperature, daytime, monthly",
    status: "observed",
    resolution: { en: "≈5.6 km (0.05°)", vi: "≈5,6 km (0,05°)" },
    legendUrl: "https://gibs.earthdata.nasa.gov/legends/MODIS_Land_Surface_Temp_H.svg",
    unit: "K",
    desc: {
      en: "Daytime land-surface (skin) temperature, monthly composite. Clouds can leave gaps.",
      vi: "Nhiệt độ bề mặt đất ban ngày, tổng hợp theo tháng. Mây có thể gây khoảng trống dữ liệu.",
    },
  },
];

export function overlayDate(o: OverlayDef, now = new Date()) {
  if (o.monthly) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (now.getUTCDate() > 12 ? 1 : 2), 1));
    return d.toISOString().slice(0, 10);
  }
  const d = new Date(now.getTime() - o.lagDays * 86400000);
  return d.toISOString().slice(0, 10);
}

/** First month offered on the time slider (covers the 2016 and 2020 Mekong drought–salinity seasons). */
export const LAYER_HISTORY_START = "2016-01";

/** Every month from LAYER_HISTORY_START to the current month, as YYYY-MM. */
export function monthRange(now = new Date()) {
  const out: string[] = [];
  const [y0, m0] = LAYER_HISTORY_START.split("-").map(Number);
  const end = now.getUTCFullYear() * 12 + now.getUTCMonth();
  for (let k = y0 * 12 + (m0 - 1); k <= end; k++) out.push(`${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`);
  return out;
}

/** Date shown for a layer: mid-month for daily layers, 1st for monthly; never later than published data. */
export function overlayDateFor(o: OverlayDef, month: string | null, now = new Date()) {
  const latest = overlayDate(o, now);
  if (!month) return latest;
  const d = o.monthly ? `${month}-01` : `${month}-15`;
  return d > latest ? latest : d;
}

export function overlayTiles(o: OverlayDef, date: string) {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${o.gibsLayer}/default/${date}/${o.matrixSet}/{z}/{y}/{x}.png`;
}

export const BASEMAPS = {
  map: {
    tiles: ["a", "b", "c"].map((s) => `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png`),
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    maxzoom: 19,
  },
  satellite: {
    tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg"],
    attribution:
      '<a href="https://s2maps.eu">Sentinel-2 cloudless 2023</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2023), CC BY-NC-SA 4.0',
    maxzoom: 16,
  },
};
