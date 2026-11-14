"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, Marker as MLMarker, StyleSpecification, GeoJSONSource } from "maplibre-gl";
import { MapPinOff } from "lucide-react";
import { BASEMAPS, DEFAULT_OVERLAY_OPACITY, OVERLAYS, overlayDateFor, overlayTiles, type OverlayId, type OverlayOpacity } from "@/lib/data/layers";
import { useLayerTime } from "@/lib/layer-time";
import { cn } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n";

export type Basemap = "map" | "satellite";
export type OverlayLoadStatus = "loading" | "ready" | "error";

export interface FarmMapProps {
  center: [number, number]; // [lng, lat]
  zoom?: number;
  basemap?: Basemap;
  overlays?: OverlayId[];
  overlayOpacity?: OverlayOpacity;
  hideOverlays?: boolean;
  onOverlayStatus?: (id: OverlayId, status: OverlayLoadStatus) => void;
  viewKey?: number;
  selection?: [number, number] | null;
  boundary?: [number, number][] | null;
  showBoundary?: boolean;
  marker?: [number, number] | null;
  fieldFill?: { color: string; opacity?: number } | null;
  draftRing?: [number, number][] | null;
  interactive?: boolean;
  onMapClick?: (lngLat: [number, number]) => void;
  onDoubleClick?: () => void;
  onViewChange?: (center: [number, number], zoom: number) => void;
  className?: string;
  ariaLabel?: string;
  fitToBoundary?: boolean;
  cursor?: string;
  scrollZoom?: boolean;
  attributionPosition?: "bottom-right" | "top-right" | "bottom-left";
}

const polygon = (ring: [number, number][]) => ({
  type: "FeatureCollection" as const,
  features:
    ring.length >= 3
      ? [{ type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [[...ring, ring[0]]] } }]
      : [],
});

const draftFc = (ring: [number, number][]) => ({
  type: "FeatureCollection" as const,
  features: [
    ...(ring.length >= 2
      ? [{ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: ring } }]
      : []),
    ...ring.map((p) => ({ type: "Feature" as const, properties: {}, geometry: { type: "Point" as const, coordinates: p } })),
  ],
});

export function FarmMap({
  center,
  zoom = 14,
  basemap = "satellite",
  overlays = [],
  overlayOpacity = DEFAULT_OVERLAY_OPACITY,
  hideOverlays = false,
  onOverlayStatus,
  viewKey = 0,
  selection,
  boundary,
  showBoundary = true,
  marker,
  fieldFill,
  draftRing,
  interactive = true,
  onMapClick,
  onDoubleClick,
  onViewChange,
  className,
  ariaLabel,
  fitToBoundary = false,
  cursor,
  scrollZoom = true,
  attributionPosition = "bottom-right",
}: FarmMapProps) {
  const { L } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<MLMarker | null>(null);
  const libRef = useRef<typeof import("maplibre-gl") | null>(null);
  const clickRef = useRef(onMapClick);
  const dblRef = useRef(onDoubleClick);
  const viewRef = useRef(onViewChange);
  const statusRef = useRef(onOverlayStatus);
  const [ready, setReady] = useState(false);
  const layerMonth = useLayerTime((s) => s.month);
  // U13: swap NASA tiles when the farmer picks another month on the time bar
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const o of OVERLAYS) {
      const src = map.getSource(`ov-${o.id}`) as unknown as { setTiles?: (t: string[]) => void } | undefined;
      src?.setTiles?.([overlayTiles(o, overlayDateFor(o, layerMonth))]);
    }
  }, [layerMonth, ready]);
  const [failed, setFailed] = useState(false);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    clickRef.current = onMapClick;
    dblRef.current = onDoubleClick;
    viewRef.current = onViewChange;
    statusRef.current = onOverlayStatus;
  });

  // create map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("maplibre-gl");
        const lib = ((mod as unknown as { default?: typeof import("maplibre-gl") }).default ?? mod) as typeof import("maplibre-gl");
        if (cancelled || !container.current) return;
        libRef.current = lib;
        const style: StyleSpecification = {
          version: 8,
          sources: {
            basemap: { type: "raster", tiles: BASEMAPS.map.tiles, tileSize: 256, attribution: BASEMAPS.map.attribution, maxzoom: BASEMAPS.map.maxzoom },
            satellite: {
              type: "raster",
              tiles: BASEMAPS.satellite.tiles,
              tileSize: 256,
              attribution: BASEMAPS.satellite.attribution,
              maxzoom: BASEMAPS.satellite.maxzoom,
            },
            field: { type: "geojson", data: polygon([]) },
            draft: { type: "geojson", data: draftFc([]) },
            inspection: { type: "geojson", data: draftFc([]) },
          },
          layers: [
            { id: "basemap", type: "raster", source: "basemap", layout: { visibility: basemap === "map" ? "visible" : "none" } },
            { id: "satellite", type: "raster", source: "satellite", layout: { visibility: basemap === "satellite" ? "visible" : "none" } },
          ],
        };
        const map = new lib.Map({
          container: container.current,
          style,
          center,
          zoom,
          interactive,
          attributionControl: false,
          maxZoom: 18,
          doubleClickZoom: !dblRef.current,
          cooperativeGestures: false,
          scrollZoom,
        });
        mapRef.current = map;
        if (process.env.NODE_ENV !== "production") ((window as unknown as { __stmMaps?: MLMap[] }).__stmMaps ??= []).push(map);
        if (interactive) {
          map.addControl(new lib.NavigationControl({ showCompass: true }), "top-right");
          map.addControl(new lib.FullscreenControl(), "top-right");
        }
        map.addControl(new lib.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
        // OSM attribution must remain visible, rather than hidden behind an icon.
        map.addControl(new lib.AttributionControl({ compact: false }), attributionPosition);
        map.on("load", () => {
          if (cancelled) return;
          for (const o of OVERLAYS) {
            const date = overlayDateFor(o, useLayerTime.getState().month);
            map.addSource(`ov-${o.id}`, {
              type: "raster",
              tiles: [overlayTiles(o, date)],
              tileSize: 256,
              maxzoom: o.maxZoom,
              // Dates change with setTiles; keep mutable dates in the React controls.
              attribution: `NASA GIBS · ${o.id === "lst" ? "MODIS" : o.id === "imerg" ? "GPM IMERG" : "SMAP L4"}`,
            });
            map.addLayer({
              id: `ov-${o.id}`,
              type: "raster",
              source: `ov-${o.id}`,
              paint: { "raster-opacity": 0.68, "raster-resampling": "nearest" },
              layout: { visibility: "none" },
            });
          }
          map.addLayer({ id: "field-fill", type: "fill", source: "field", paint: { "fill-color": "#66AD79", "fill-opacity": 0.18 } });
          map.addLayer({ id: "field-line", type: "line", source: "field", paint: { "line-color": "#ffffff", "line-width": 2.5 } });
          map.addLayer({
            id: "field-line-inner",
            type: "line",
            source: "field",
            paint: { "line-color": "#174D3A", "line-width": 1.2, "line-dasharray": [2, 1.5] },
          });
          map.addLayer({ id: "draft-line", type: "line", source: "draft", paint: { "line-color": "#E4A84C", "line-width": 2.5 } });
          map.addLayer({
            id: "draft-pts",
            type: "circle",
            source: "draft",
            filter: ["==", ["geometry-type"], "Point"],
            paint: { "circle-radius": 5, "circle-color": "#fff", "circle-stroke-color": "#E4A84C", "circle-stroke-width": 2.5 },
          });
          map.addLayer({ id: "inspection-point", type: "circle", source: "inspection", paint: { "circle-radius": 7, "circle-color": "#fff", "circle-stroke-color": "#177DA6", "circle-stroke-width": 3 } });
          setReady(true);
        });
        map.on("click", (e) => clickRef.current?.([e.lngLat.lng, e.lngLat.lat]));
        map.on("dblclick", (e) => {
          if (dblRef.current) {
            e.preventDefault();
            dblRef.current();
          }
        });
        map.on("moveend", () => {
          const c = map.getCenter();
          viewRef.current?.([c.lng, c.lat], map.getZoom());
        });
        map.on("dataloading", (e) => {
          const id = (e as { sourceId?: string }).sourceId?.replace(/^ov-/, "") as OverlayId;
          if (OVERLAYS.some(o => o.id === id)) statusRef.current?.(id, "loading");
        });
        map.on("sourcedata", (e) => {
          if (!e.isSourceLoaded) return;
          const id = e.sourceId?.replace(/^ov-/, "") as OverlayId;
          if (OVERLAYS.some(o => o.id === id)) statusRef.current?.(id, "ready");
          if (e.sourceId === "basemap" || e.sourceId === "satellite") setTileError(false);
        });
        map.on("error", (e) => {
          // tile errors are expected for missing NASA dates — don't fail the whole map
          if ((e as { error?: { message?: string } }).error?.message?.includes("WebGL")) setFailed(true);
          const source = (e as { sourceId?: string }).sourceId;
          if (source === "basemap" || source === "satellite") setTileError(true);
          const id = source?.replace(/^ov-/, "") as OverlayId;
          if (OVERLAYS.some(o => o.id === id)) statusRef.current?.(id, "error");
        });
        const resize = new ResizeObserver(() => map.resize());
        resize.observe(container.current);
        map.once("remove", () => resize.disconnect());
      } catch (err) {
        console.error(err);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      markerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // basemap + overlays
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty("basemap", "visibility", basemap === "map" ? "visible" : "none");
    map.setLayoutProperty("satellite", "visibility", basemap === "satellite" ? "visible" : "none");
    for (const o of OVERLAYS) {
      map.setLayoutProperty(`ov-${o.id}`, "visibility", overlays.includes(o.id) && !hideOverlays ? "visible" : "none");
      map.setPaintProperty(`ov-${o.id}`, "raster-opacity", Math.max(0, Math.min(1, overlayOpacity[o.id])));
    }
  }, [basemap, overlays, overlayOpacity, hideOverlays, ready]);

  // field polygon
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("field") as GeoJSONSource | undefined)?.setData(polygon(showBoundary && boundary ? boundary : []));
  }, [boundary, showBoundary, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setPaintProperty("field-fill", "fill-color", fieldFill?.color ?? "#66AD79");
    map.setPaintProperty("field-fill", "fill-opacity", fieldFill ? fieldFill.opacity ?? 0.5 : 0.16);
  }, [fieldFill, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("draft") as GeoJSONSource | undefined)?.setData(draftFc(draftRing ?? []));
  }, [draftRing, ready]);

  useEffect(() => {
    if (!ready) return;
    (mapRef.current?.getSource("inspection") as GeoJSONSource | undefined)?.setData(draftFc(selection ? [selection] : []));
  }, [selection, ready]);

  // marker
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib || !ready) return;
    if (!marker) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.innerHTML =
        '<svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 37s12-12.4 12-22A12 12 0 0 0 3 15c0 9.6 12 22 12 22Z" fill="#174D3A" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15" r="4.5" fill="#DDF0E2"/></svg>';
      el.style.filter = "drop-shadow(0 3px 6px rgba(0,0,0,.3))";
      markerRef.current = new lib.Marker({ element: el, anchor: "bottom" }).setLngLat(marker).addTo(map);
    } else markerRef.current.setLngLat(marker);
  }, [marker, ready]);

  // recenter when the requested center changes
  const lastCenter = useRef<string>("");
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const key = `${center[0].toFixed(5)},${center[1].toFixed(5)},${zoom},${viewKey}`;
    if (key === lastCenter.current) return;
    const first = lastCenter.current === "";
    lastCenter.current = key;
    if (fitToBoundary && boundary && boundary.length >= 3 && libRef.current) {
      const b = new libRef.current.LngLatBounds();
      boundary.forEach((p) => b.extend(p));
      map.fitBounds(b, { padding: 60, duration: first ? 0 : 600, maxZoom: 17 });
    } else if (!first) map.flyTo({ center, zoom, duration: 700, essential: true });
  }, [center, zoom, ready, fitToBoundary, boundary, viewKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.getCanvas().style.cursor = cursor ?? "";
  }, [cursor, ready]);

  return (
    <div className={cn("relative overflow-hidden bg-[#dfe6dc]", className)}>
      <div ref={container} style={{ position: "absolute", inset: 0 }} role="region" aria-label={ariaLabel ?? L("Farm map", "Bản đồ trang trại")} />
      {!ready && !failed && <div className="skeleton absolute inset-0" aria-hidden />}
      {tileError && !failed && <p role="status" className="absolute left-3 right-12 top-28 rounded-xl bg-white/95 p-2 text-xs text-ink-2">{L("Some map tiles could not load. Check your connection or switch the basemap.", "Một số ô bản đồ chưa tải được. Kiểm tra kết nối hoặc đổi bản đồ nền.")}</p>}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-sand-2 p-6 text-center text-sm text-ink-2">
          <MapPinOff className="h-6 w-6" aria-hidden />
          {L("The map could not be displayed (WebGL unavailable). All analysis still works.", "Không hiển thị được bản đồ (thiếu WebGL). Mọi phân tích vẫn hoạt động.")}
        </div>
      )}
    </div>
  );
}
