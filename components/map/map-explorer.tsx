"use client";

import { useCallback, useState } from "react";
import { Crosshair, Eye, EyeOff, Globe2, Layers, MapPin, X } from "lucide-react";
import type { FarmProfile } from "@/lib/types";
import { DEFAULT_OVERLAY_OPACITY, OVERLAYS, overlayDateFor, type OverlayId } from "@/lib/data/layers";
import { useLayerTime } from "@/lib/layer-time";
import { useI18n } from "@/lib/i18n";
import { Card, cn } from "@/components/ui/primitives";
import { FarmMap, type Basemap, type OverlayLoadStatus } from "./farm-map";
import { BasemapToggle, LayerPanel, LayerTimeBar } from "./layer-panel";

/** Controls stay beside/below the canvas, including on small screens. */
export function MapExplorer({ farm }: { farm: FarmProfile }) {
  const { L, lang, num } = useI18n();
  const month = useLayerTime(s => s.month);
  const [basemap, setBasemap] = useState<Basemap>("map");
  const [overlays, setOverlays] = useState<OverlayId[]>([]);
  const [opacity, setOpacity] = useState({ ...DEFAULT_OVERLAY_OPACITY });
  const [hidden, setHidden] = useState(false);
  const [boundary, setBoundary] = useState(true);
  const [status, setStatus] = useState<Partial<Record<OverlayId, OverlayLoadStatus>>>({});
  const [view, setView] = useState({ zoom: farm.boundary ? 15.5 : 13.5, key: 0, field: true });
  const [point, setPoint] = useState<[number, number] | null>(null);
  const onStatus = useCallback((id: OverlayId, next: OverlayLoadStatus) => {
    setStatus(s => s[id] === next ? s : { ...s, [id]: next });
  }, []);
  const toggle = (id: OverlayId) => {
    setHidden(false);
    const next = overlays.includes(id) ? overlays.filter(x => x !== id) : [...overlays, id];
    setOverlays(next);
    if (!next.length) useLayerTime.getState().setPlaying(false);
  };
  const focus = (field: boolean) => setView(v => ({ zoom: field ? farm.boundary ? 15.5 : 13.5 : 6.5, key: v.key + 1, field }));
  const active = OVERLAYS.filter(o => overlays.includes(o.id));
  const action = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-xs font-semibold shadow-sm hover:bg-sand";

  return <Card className="min-w-0 overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white p-3">
      <BasemapToggle value={basemap} onChange={setBasemap} />
      <div className="flex flex-wrap gap-2">
        <button onClick={() => focus(true)} className={action}><Crosshair className="h-3.5 w-3.5" aria-hidden />{L("My field", "Về ruộng")}</button>
        <button onClick={() => focus(false)} className={action}><Globe2 className="h-3.5 w-3.5" aria-hidden />{L("Regional view", "Xem cả vùng")}</button>
        {active.length > 0 && <button onClick={() => setHidden(v => !v)} aria-pressed={hidden} className={cn(action, hidden && "border-forest bg-mint")}>
          {hidden ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
          {hidden ? L("Restore NASA", "Hiện lại NASA") : L("Compare basemap", "So với bản đồ nền")}
        </button>}
      </div>
    </div>
    <div className="relative h-[390px] md:h-[480px]">
      <FarmMap center={[farm.longitude, farm.latitude]} zoom={view.zoom} viewKey={view.key}
        basemap={basemap} overlays={overlays} overlayOpacity={opacity} hideOverlays={hidden}
        onOverlayStatus={onStatus} boundary={farm.boundary} showBoundary={boundary}
        selection={point}
        marker={[farm.longitude, farm.latitude]} fitToBoundary={view.field}
        onMapClick={setPoint} cursor={active.length ? "crosshair" : undefined}
        ariaLabel={L("Interactive field map and NASA imagery", "Bản đồ ruộng và ảnh NASA tương tác")} className="absolute inset-0" />
      {active.length > 0 && <p className="pointer-events-none absolute left-3 right-14 top-3 w-fit max-w-[80%] rounded-xl bg-white/95 px-3 py-2 text-xs shadow-sm">
        {hidden ? L("Basemap comparison · NASA layers hidden", "Đang so với bản đồ nền · đã ẩn lớp NASA") : L("Click a location to inspect layer dates and coverage", "Bấm một vị trí để xem ngày ảnh và phạm vi dữ liệu")}
      </p>}
    </div>
    <div className="space-y-4 border-t border-line bg-sand/40 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold"><Layers className="h-4 w-4 text-forest" aria-hidden />{L("Explore NASA layers", "Khám phá dữ liệu NASA")}</h3>
        {active.length > 0 && <button onClick={() => { setOverlays([]); setHidden(false); useLayerTime.getState().setPlaying(false); }} className="text-xs font-semibold text-ink-2 underline">{L("Turn all off", "Tắt tất cả")}</button>}
      </div>
      <p className="text-xs leading-relaxed text-ink-2">{L("Choose a layer, adjust its opacity, then use Regional view to see patterns around your field. With multiple layers on, temperature is drawn over moisture, then rain.", "Bật lớp muốn xem, chỉnh độ đậm rồi chọn Xem cả vùng để quan sát quanh ruộng. Khi bật nhiều lớp, nhiệt độ nằm trên độ ẩm, rồi đến mưa.")}</p>
      <LayerPanel overlays={overlays} onToggle={toggle} showBoundary={boundary} onToggleBoundary={() => setBoundary(v => !v)} hasBoundary={!!farm.boundary}
        opacity={opacity} onOpacity={(id, value) => setOpacity(s => ({ ...s, [id]: value }))}
        onSolo={id => { setOverlays([id]); setHidden(false); }} status={status} />
      <LayerTimeBar overlays={overlays} onEnable={() => setOverlays(["smap"])} className="shadow-none" />
      {point && <section className="rounded-xl border border-line bg-white p-3 text-xs" aria-label={L("Selected map location", "Vị trí đang xem")}>
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-semibold"><MapPin className="h-3.5 w-3.5" aria-hidden />{num(point[1], 5)}°, {num(point[0], 5)}°</p>
          <button onClick={() => setPoint(null)} aria-label={L("Close location details", "Đóng thông tin vị trí")} className="rounded-lg p-2"><X className="h-4 w-4" /></button>
        </div>
        <ul className="mt-2 space-y-1">{active.map(o => <li key={o.id}>{o.name[lang]} · {overlayDateFor(o, month)} · {o.resolution[lang]}</li>)}</ul>
        <p className="mt-2 text-ink-2">{L("Map imagery describes a regional area, not a measurement at this exact point. Read the color scale; no numeric value is inferred from the picture. The farm pin stays unchanged.", "Ảnh thể hiện cả vùng, không phải số đo tại đúng điểm bấm. Hãy đối chiếu thang màu; ứng dụng không suy ra số đo từ màu ảnh. Ghim ruộng vẫn giữ nguyên.")}</p>
        <a href={`https://worldview.earthdata.nasa.gov/?v=${point[0]-2},${point[1]-2},${point[0]+2},${point[1]+2}&t=${active[0] ? overlayDateFor(active[0], month) : new Date().toISOString().slice(0,10)}${active.length ? `&l=${active.map(o => o.gibsLayer).join(",")}` : ""}`} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-water underline">{L("Open this area in NASA Worldview ↗", "Mở vùng này trên NASA Worldview ↗")}</a>
      </section>}
      <p className="text-[11px] text-ink-3">{basemap === "satellite" ? L("Sentinel-2 cloudless 2023 · dated mosaic, not live imagery", "Sentinel-2 cloudless 2023 · ảnh ghép, không phải ảnh trực tiếp") : L("OpenStreetMap · online road map", "OpenStreetMap · bản đồ đường trực tuyến")} · <a className="underline" href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">{L("Report a map issue", "Báo lỗi bản đồ")}</a></p>
    </div>
  </Card>;
}
