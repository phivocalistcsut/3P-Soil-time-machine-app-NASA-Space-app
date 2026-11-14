"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Crosshair,
  GripVertical,
  Loader2,
  MapPin,
  PenLine,
  Search,
  Trash2,
  Undo2,
  FlaskConical,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { CROPS, SEASONS, SEASON_ORDER } from "@/lib/data/crops";
import { validCoordinates } from "@/lib/data/evidence";
import { fieldBoundary } from "@/lib/data/geometry";
import { resolveSoilInput } from "@/lib/data/farm-soil";
import { createDemoFarm, GAZETTEER, newId } from "@/lib/data/demo";
import type { Drainage, FarmProfile, IrrigationSource, PriorityId, SalinityRisk, SeasonId, SoilTexture, SourceTag, WaterAvailability } from "@/lib/types";
import { FarmMap, type Basemap } from "@/components/map/farm-map";
import { BasemapToggle } from "@/components/map/layer-panel";
import { Badge, Button, Card, Hint, Input, Label, Select, Skeleton, buttonClass, cn } from "@/components/ui/primitives";
import { InfoTip, toast } from "@/components/ui/overlays";
import { LanguageSwitcher, Logo, StatusBadge } from "@/components/common";

interface Draft {
  name: string;
  lat: number;
  lon: number;
  pinned: boolean;
  boundary: [number, number][];
  boundaryClosed: boolean;
  areaHa: string;
  currentCropId: string;
  previousCropId: string;
  plantingSeason: SeasonId;
  pattern: Record<SeasonId, string>;
  plantingMonths: Record<SeasonId, number>;
  soilType: SoilTexture | "unknown";
  soilPH: string;
  soc: string;
  clayPercent: string;
  socStockTCHa: string;
  soilEstimate: { texture: SoilTexture | null; ph: number | null; soc: number | null; clayPercent: number | null; socStockTCHa: number | null; source: string } | null;
  irrigationSource: IrrigationSource;
  waterAvailability: WaterAvailability;
  drainage: Drainage;
  salinityRisk: SalinityRisk;
  priorities: { id: PriorityId; on: boolean }[];
}

const INITIAL: Draft = {
  name: "",
  lat: 10.0706,
  lon: 105.5599,
  pinned: false,
  boundary: [],
  boundaryClosed: false,
  areaHa: "",
  currentCropId: "rice",
  previousCropId: "rice",
  plantingSeason: "S3",
  pattern: { S1: "rice", S2: "rice", S3: "rice" },
  plantingMonths: { S1: 12, S2: 4, S3: 8 },
  soilType: "unknown",
  soilPH: "",
  soc: "",
  clayPercent: "",
  socStockTCHa: "",
  soilEstimate: null,
  irrigationSource: "canal",
  waterAvailability: "moderate",
  drainage: "moderate",
  salinityRisk: "none",
  priorities: (["soil", "water", "drought", "income", "inputs"] as PriorityId[]).map((id) => ({ id, on: true })),
};

const inMekong = (lat: number, lon: number) => lat > 8.4 && lat < 11.3 && lon > 104.3 && lon < 107;

export function SetupWizard() {
  const { L, t, num, crop, season, month } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const setFarm = useApp((s) => s.setFarm);
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(INITIAL);
  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const [drawing, setDrawing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ name: string; lat: number; lon: number }[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [soilLoading, setSoilLoading] = useState(false);
  const [view, setView] = useState<{ center: [number, number]; zoom: number }>({ center: [INITIAL.lon, INITIAL.lat], zoom: 13 });
  const dragIdx = useRef<number | null>(null);
  const up = (p: Partial<Draft>) => setD((s) => ({ ...s, ...p }));
  const [coordText, setCoordText] = useState({ lat: String(INITIAL.lat), lon: String(INITIAL.lon) });
  const setCoords = (lat: number, lon: number, extra: Partial<Draft> = {}) => {
    if (!validCoordinates(lat, lon)) return;
    up({ lat, lon, pinned: true, boundary: [], boundaryClosed: false, soilEstimate: null, ...extra });
    setCoordText({ lat: lat.toFixed(5), lon: lon.toFixed(5) });
  };

  const drawnArea = d.boundaryClosed ? fieldBoundary(d.boundary)?.areaHa ?? 0 : 0;
  const steps = [L("Location", "Vị trí"), L("Your farm", "Trang trại"), L("Priorities", "Ưu tiên"), L("Review", "Xem lại")];

  const onMapClick = ([lng, lat]: [number, number]) => {
    if (drawing) {
      if (d.boundary.length >= 100 || d.boundary.some(([x, y]) => x === lng && y === lat)) return;
      setD((s) => ({ ...s, boundary: [...s.boundary, [lng, lat]], boundaryClosed: false }));
      return;
    }
    setCoords(lat, lng);
  };

  const finishBoundary = () => {
    const field = fieldBoundary(d.boundary);
    if (!field) {
      toast.error(L("Draw a field with at least three distinct corners and no crossing edges.", "Vẽ ruộng có ít nhất ba góc khác nhau và các cạnh không cắt nhau."));
      return;
    }
    setCoords(field.lat, field.lon, {
      boundary: d.boundary, boundaryClosed: true, areaHa: d.areaHa || String(Number(field.areaHa.toPrecision(4))),
    });
    setDrawing(false);
    toast.success(L("Field boundary saved", "Đã lưu ranh giới ruộng"));
  };

  const search = async () => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();
    const local = GAZETTEER.filter((g) => norm(g.name).includes(norm(q)));
    setResults(local);
    setSearching(true);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      const j = (await r.json()) as { results: { name: string; lat: number; lon: number }[] };
      setResults([...local, ...(j.results ?? [])].slice(0, 8));
      if (!r.ok && !local.length) toast.info(L("Online search unavailable — try a province name or enter coordinates.", "Tìm kiếm trực tuyến chưa khả dụng — thử tên tỉnh hoặc nhập tọa độ."));
    } catch {
      if (!local.length) toast.info(L("Online search unavailable — try a province name or enter coordinates.", "Tìm kiếm trực tuyến chưa khả dụng — thử tên tỉnh hoặc nhập tọa độ."));
    } finally {
      setSearching(false);
    }
  };

  const goTo = (lat: number, lon: number, zoom = 14) => {
    setCoords(lat, lon);
    setView({ center: [lon, lat], zoom });
  };

  const lookupSoil = async () => {
    setSoilLoading(true);
    try {
      const r = await fetch(`/api/soil?lat=${d.lat}&lon=${d.lon}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "error");
      setD((s) => s.lat === d.lat && s.lon === d.lon ? { ...s,
        soilEstimate: { texture: j.texture, ph: j.ph, soc: j.socPercent,
          clayPercent: j.clayPercent0to30 ?? null, socStockTCHa: j.socStockTCHa ?? null, source: j.source },
      } : s);
      toast.success(L("Regional soil estimate loaded (SoilGrids)", "Đã tải ước tính đất theo vùng (SoilGrids)"));
    } catch (e) {
      toast.error(
        L(`SoilGrids is unavailable right now (${(e as Error).message}). Enter any measurements you have.`, `SoilGrids hiện không khả dụng (${(e as Error).message}). Hãy nhập số đo đất nếu có.`),
      );
    } finally {
      setSoilLoading(false);
    }
  };

  const soilResolved = useMemo(() => {
    const est = d.soilEstimate;
    const userTexture = d.soilType !== "unknown";
    const texture: SoilTexture = userTexture ? (d.soilType as SoilTexture) : est?.texture ?? (inMekong(d.lat, d.lon) ? "clay" : "loam");
    const textureTag: SourceTag = userTexture
      ? { status: "observed", source: "Farmer-reported" }
      : est?.texture
        ? { status: "estimated", source: est.source }
        : inMekong(d.lat, d.lon)
          ? { status: "estimated", source: "Regional reference: Mekong Delta alluvial clay" }
          : { status: "unavailable", source: "Assumed loam — no soil data" };
    const phNum = d.soilPH.trim() ? Number(d.soilPH.replace(",", ".")) : null;
    const socNum = d.soc.trim() ? Number(d.soc.replace(",", ".")) : null;
    const ph = phNum !== null && Number.isFinite(phNum) ? phNum : est?.ph ?? null;
    const phTag: SourceTag = phNum !== null ? { status: "observed", source: "Farmer soil test" } : est?.ph != null ? { status: "estimated", source: est.source } : { status: "unavailable", source: "Not provided" };
    const soc = socNum !== null && Number.isFinite(socNum) ? socNum : est?.soc ?? null;
    const socTag: SourceTag =
      socNum !== null ? { status: "observed", source: "Farmer soil test" } : est?.soc != null ? { status: "estimated", source: est.source } : { status: "unavailable", source: "Not provided" };
    const clay = resolveSoilInput(d.clayPercent, est?.clayPercent, est?.source, 100);
    const stock = resolveSoilInput(d.socStockTCHa, est?.socStockTCHa, est?.source);
    return { texture, textureTag, ph, phTag, soc, socTag, clay, stock };
  }, [d]);

  const phInvalid = d.soilPH.trim() !== "" && !(Number(d.soilPH.replace(",", ".")) >= 3 && Number(d.soilPH.replace(",", ".")) <= 10);
  const areaNum = Number(d.areaHa.replace(",", "."));
  const areaInvalid = d.areaHa.trim() !== "" && !(areaNum > 0 && areaNum < 10000);
  const validSoc = !d.soc.trim() || (Number(d.soc.replace(",", ".")) >= 0 && Number(d.soc.replace(",", ".")) <= 100);
  const clayInvalid = !!d.clayPercent.trim() && !(Number(d.clayPercent.replace(",", ".")) >= 0 && Number(d.clayPercent.replace(",", ".")) <= 100);
  const stockInvalid = !!d.socStockTCHa.trim() && !(Number.isFinite(Number(d.socStockTCHa.replace(",", "."))) && Number(d.socStockTCHa.replace(",", ".")) >= 0);
  const coordinateTextValid = !!coordText.lat.trim() && !!coordText.lon.trim() &&
    validCoordinates(Number(coordText.lat.replace(",", ".")), Number(coordText.lon.replace(",", ".")));
  const canNext = [d.pinned && coordinateTextValid && !drawing, d.name.trim().length > 0 && !phInvalid && validSoc && !clayInvalid && !stockInvalid && !areaInvalid && (d.areaHa.trim() !== "" || drawnArea > 0), d.priorities.some((p) => p.on), true][step];

  const createProfile = () => {
    const f: FarmProfile = {
      id: newId("farm"),
      name: d.name.trim(),
      latitude: d.lat,
      longitude: d.lon,
      areaHa: d.areaHa.trim() ? areaNum : drawnArea,
      boundary: d.boundaryClosed && d.boundary.length >= 3 ? d.boundary : null,
      soilType: soilResolved.texture,
      soilPH: soilResolved.ph,
      soilOrganicCarbon: soilResolved.soc,
      clayPercent: soilResolved.clay.value,
      socStockTCHa: soilResolved.stock.value,
      soilSources: { soilType: soilResolved.textureTag, soilPH: soilResolved.phTag, soilOrganicCarbon: soilResolved.socTag,
        clayPercent: soilResolved.clay.tag, socStockTCHa: soilResolved.stock.tag },
      irrigationSource: d.irrigationSource,
      waterAvailability: d.waterAvailability,
      drainage: d.drainage,
      salinityRisk: d.salinityRisk,
      cropHistory: {
        currentCropId: d.currentCropId,
        plantingMonths: d.plantingMonths,
        previousCropId: d.previousCropId || null,
        plantingSeason: d.plantingSeason,
        typicalPattern: { S1: d.pattern.S1 === "fallow" ? "fallow" : d.pattern.S1, S2: d.pattern.S2, S3: d.pattern.S3 },
      },
      farmerPriorities: d.priorities.filter((p) => p.on).map((p) => p.id),
      isDemo: false,
      createdAt: new Date().toISOString(),
    };
    setFarm(f);
    toast.success(L("Farm profile created", "Đã tạo hồ sơ trang trại"));
    router.push("/overview");
  };

  const movePriority = (from: number, to: number) => {
    setD((s) => {
      const p = [...s.priorities];
      if (to < 0 || to >= p.length) return s;
      const [x] = p.splice(from, 1);
      p.splice(to, 0, x);
      return { ...s, priorities: p };
    });
  };

  const cropOptions = CROPS.filter((c) => c.id !== "fallow");

  return (
    <div className="min-h-screen bg-sand">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-space-950/95 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4 md:px-6">
          <Logo light />
          <div className="flex items-center gap-2">
            <button
              className={buttonClass("glass", "sm", "hidden sm:inline-flex")}
              onClick={() => {
                setFarm(createDemoFarm());
                router.push("/overview");
              }}
            >
              <FlaskConical className="h-4 w-4" aria-hidden />
              {L("Use demo farm instead", "Dùng trang trại mẫu")}
            </button>
            <LanguageSwitcher dark />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-4 py-6 md:px-6">
        <div className="relative isolate mb-5 overflow-hidden rounded-3xl bg-space-900 px-5 py-6 text-white shadow-[var(--shadow-float)] md:px-8">
          <div aria-hidden className="absolute inset-0 -z-10">
            <Image src="/images/mekong-delta.webp" alt="" fill sizes="(min-width: 1240px) 1200px, 100vw" className="object-cover opacity-80" priority />
            <div className="absolute inset-0 bg-gradient-to-r from-space-950/95 via-space-950/75 to-space-950/30" />
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow text-lime-bright">{L("Farm setup", "Thiết lập trang trại")}</p>
              <h1 className="title-caps mt-1.5 text-2xl font-extrabold md:text-[32px]">{[L("Where is your farm?", "Trang trại của bạn ở đâu?"), L("Tell us about your farm", "Giới thiệu trang trại"), L("What matters most to you?", "Điều gì quan trọng nhất với bạn?"), L("Review your farm profile", "Xem lại hồ sơ trang trại")][step]}</h1>
            </div>
            <ol className="flex items-center gap-1.5" aria-label={L("Progress", "Tiến độ")}>
              {steps.map((s, i) => (
                <li key={s} className="flex items-center gap-1.5">
                  <button
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    aria-current={i === step ? "step" : undefined}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold",
                      i === step ? "bg-lime text-space-900" : i < step ? "bg-white/15 text-white" : "border border-white/20 text-white/60",
                    )}
                  >
                    {i < step ? <Check className="h-3.5 w-3.5" aria-hidden /> : <span className="tabular">{i + 1}</span>}
                    <span className="hidden sm:inline">{s}</span>
                  </button>
                  {i < steps.length - 1 && <span className="h-px w-3 bg-white/25 md:w-5" aria-hidden />}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {!hydrated ? (
          <Skeleton className="h-[520px]" />
        ) : (
          <>
            {step === 0 && (
              <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
                <Card className="overflow-hidden">
                  <div className="relative h-[420px] md:h-[540px]">
                    <FarmMap
                      center={view.center}
                      zoom={view.zoom}
                      basemap={basemap}
                      marker={d.pinned ? [d.lon, d.lat] : null}
                      boundary={d.boundaryClosed ? d.boundary : null}
                      draftRing={!d.boundaryClosed ? d.boundary : null}
                      onMapClick={onMapClick}
                      onDoubleClick={drawing ? finishBoundary : undefined}
                      cursor={drawing ? "crosshair" : "pointer"}
                      className="absolute inset-0"
                      ariaLabel={L("Map: click to place your farm", "Bản đồ: bấm để đặt vị trí trang trại")}
                    />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      <BasemapToggle value={basemap} onChange={setBasemap} />
                    </div>
                    <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs shadow-sm">
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        {drawing ? <PenLine className="h-3.5 w-3.5 text-amber-ink" aria-hidden /> : <MapPin className="h-3.5 w-3.5 text-forest" aria-hidden />}
                        {drawing
                          ? L(`Click corners of your field (${d.boundary.length} points). Double-click or press Finish.`, `Bấm vào các góc ruộng (${d.boundary.length} điểm). Bấm đúp hoặc nhấn Hoàn tất.`)
                          : d.pinned
                            ? `${num(d.lat, 5)}°N, ${num(d.lon, 5)}°E`
                            : L("Click the map to pin your farm", "Bấm vào bản đồ để ghim trang trại")}
                      </span>
                      {drawnArea > 0 && <Badge tone="amber">≈ {num(drawnArea, 2)} ha</Badge>}
                    </div>
                  </div>
                </Card>
                <div className="space-y-4">
                  <Card className="p-4">
                    <Label htmlFor="q">{L("Search region or address", "Tìm khu vực hoặc địa chỉ")}</Label>
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        search();
                      }}
                    >
                      <Input id="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={L("e.g. Cờ Đỏ, Cần Thơ", "VD: Cờ Đỏ, Cần Thơ")} />
                      <Button type="submit" variant="secondary" size="icon" aria-label={L("Search", "Tìm")}>
                        {searching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
                      </Button>
                    </form>
                    {results && (
                      <ul className="mt-2 max-h-48 overflow-auto rounded-xl border border-line">
                        {results.length === 0 && !searching && <li className="px-3 py-2 text-xs text-ink-2">{L("No places found.", "Không tìm thấy địa điểm.")}</li>}
                        {results.map((r, i) => (
                          <li key={`${r.name}-${i}`}>
                            <button
                              className="w-full px-3 py-2 text-left text-xs hover:bg-mint/50"
                              onClick={() => {
                                goTo(r.lat, r.lon, 13);
                                setResults(null);
                              }}
                            >
                              {r.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Hint>{L("Search runs on submit. Offline list covers Mekong Delta provinces.", "Tìm khi nhấn Enter. Danh sách ngoại tuyến gồm các tỉnh ĐBSCL.")}</Hint>
                  </Card>
                  <Card className="p-4">
                    <p className="mb-2 text-sm font-medium">{L("Coordinates", "Tọa độ")}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="lat" className="text-xs text-ink-2">
                          {L("Latitude", "Vĩ độ")}
                        </Label>
                        <Input id="lat" inputMode="decimal" value={coordText.lat} onChange={(e) => { const v = e.target.value; setCoordText((c) => ({ ...c, lat: v })); const n = Number(v.replace(",", ".")); if (v.trim() && Number.isFinite(n) && Math.abs(n) <= 90) up({ lat: n, pinned: true, boundary: [], boundaryClosed: false, soilEstimate: null }); }} />
                      </div>
                      <div>
                        <Label htmlFor="lon" className="text-xs text-ink-2">
                          {L("Longitude", "Kinh độ")}
                        </Label>
                        <Input id="lon" inputMode="decimal" value={coordText.lon} onChange={(e) => { const v = e.target.value; setCoordText((c) => ({ ...c, lon: v })); const n = Number(v.replace(",", ".")); if (v.trim() && Number.isFinite(n) && Math.abs(n) <= 180) up({ lon: n, pinned: true, boundary: [], boundaryClosed: false, soilEstimate: null }); }} />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => setView({ center: [d.lon, d.lat], zoom: 15 })}>
                      <Crosshair className="h-4 w-4" aria-hidden />
                      {L("Center map on these coordinates", "Đưa bản đồ về tọa độ này")}
                    </Button>
                  </Card>
                  <Card className="p-4">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {L("Field boundary", "Ranh giới ruộng")} <Badge tone="outline">{L("optional", "tùy chọn")}</Badge>
                    </p>
                    <p className="mt-1 text-xs text-ink-2">{L("Draw an approximate outline to estimate your area.", "Vẽ ranh giới gần đúng để ước tính diện tích.")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!drawing ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDrawing(true);
                            up({ boundary: [], boundaryClosed: false });
                          }}
                        >
                          <PenLine className="h-4 w-4" aria-hidden />
                          {d.boundaryClosed ? L("Redraw", "Vẽ lại") : L("Draw boundary", "Vẽ ranh giới")}
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" onClick={finishBoundary} disabled={d.boundary.length < 3}>
                            <Check className="h-4 w-4" aria-hidden />
                            {L("Finish", "Hoàn tất")}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => up({ boundary: d.boundary.slice(0, -1) })} disabled={!d.boundary.length}>
                            <Undo2 className="h-4 w-4" aria-hidden />
                            {L("Undo", "Hoàn tác")}
                          </Button>
                        </>
                      )}
                      {d.boundary.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            up({ boundary: [], boundaryClosed: false });
                            setDrawing(false);
                          }}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          {L("Clear", "Xóa")}
                        </Button>
                      )}
                    </div>
                  </Card>
                  <button
                    className="w-full rounded-2xl border border-dashed border-amber/60 bg-amber-soft/60 p-4 text-left text-sm hover:bg-amber-soft"
                    onClick={() => {
                      const demo = createDemoFarm();
                      setD((s) => ({ ...s, lat: demo.latitude, lon: demo.longitude, pinned: true, boundary: demo.boundary ?? [], boundaryClosed: true, soilEstimate: null, areaHa: String(demo.areaHa), name: s.name || "Thới Lai Demo Farm" }));
                      setCoordText({ lat: String(demo.latitude), lon: String(demo.longitude) });
                      setDrawing(false);
                      setView({ center: [demo.longitude, demo.latitude], zoom: 15.5 });
                    }}
                  >
                    <span className="flex items-center gap-2 font-semibold text-amber-ink">
                      <FlaskConical className="h-4 w-4" aria-hidden />
                      {L("Use the Mekong Delta demo location", "Dùng vị trí mẫu ở ĐBSCL")}
                    </span>
                    <span className="mt-1 block text-xs text-amber-ink/90">Thới Lai, Cần Thơ · 2.5 ha {L("(illustrative field)", "(ruộng minh họa)")}</span>
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="space-y-4 p-5">
                  <h2 className="text-base font-semibold">{L("Farm and crops", "Trang trại và cây trồng")}</h2>
                  <div>
                    <Label htmlFor="name">{L("Farm name", "Tên trang trại")} *</Label>
                    <Input id="name" value={d.name} onChange={(e) => up({ name: e.target.value })} placeholder={L("e.g. Family rice field", "VD: Ruộng nhà Ba Tư")} />
                  </div>
                  <div>
                    <Label htmlFor="area">{L("Farm size (hectares)", "Diện tích (ha)")} *</Label>
                    <Input id="area" inputMode="decimal" value={d.areaHa} onChange={(e) => up({ areaHa: e.target.value })} placeholder={drawnArea ? num(drawnArea, 2) : "2.5"} aria-invalid={areaInvalid} />
                    {areaInvalid && <Hint className="text-risk-ink">{L("Enter a positive number.", "Nhập một số dương.")}</Hint>}
                    {drawnArea > 0 && <Hint>{L(`Drawn boundary ≈ ${num(drawnArea, 2)} ha`, `Ranh giới đã vẽ ≈ ${num(drawnArea, 2)} ha`)}</Hint>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="cur">{L("Current crop", "Cây đang trồng")}</Label>
                      <Select id="cur" value={d.currentCropId} onChange={(e) => up({ currentCropId: e.target.value })}>
                        {cropOptions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {crop(c.id)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="prev">{L("Previous crop", "Cây vụ trước")}</Label>
                      <Select id="prev" value={d.previousCropId} onChange={(e) => up({ previousCropId: e.target.value })}>
                        {CROPS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {crop(c.id)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="season">{L("Approximate planting season", "Mùa vụ gieo trồng")}</Label>
                    <Select id="season" value={d.plantingSeason} onChange={(e) => up({ plantingSeason: e.target.value as SeasonId })}>
                      {SEASON_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {season(s)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>
                      {L("Typical crop in each season (your current practice)", "Cây thường trồng mỗi vụ (cách canh tác hiện tại)")}
                      <InfoTip>{L("This becomes the current practice used for comparison. Choose fallow for seasons you skip.", "Đây là cách trồng hiện tại dùng để so sánh. Chọn bỏ đất cho vụ không trồng.")}</InfoTip>
                    </Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {SEASON_ORDER.map((s) => (
                        <div key={s}>
                          <span className="mb-1 block text-[11px] font-medium text-ink-2">{season(s)}</span>
                          <Select aria-label={season(s)} value={d.pattern[s]} onChange={(e) => up({ pattern: { ...d.pattern, [s]: e.target.value } })}>
                            {CROPS.map((c) => (
                              <option key={c.id} value={c.id}>
                                {crop(c.id)}
                              </option>
                            ))}
                          </Select>
                          <Select className="mt-2" aria-label={L(`Planting month for ${season(s)}`, `Tháng gieo vụ ${season(s)}`)}
                            value={d.plantingMonths[s]} onChange={(e) => up({ plantingMonths: { ...d.plantingMonths, [s]: Number(e.target.value) } })}>
                            {SEASONS[s].months.map((m) => <option key={m} value={m}>{month(m)}</option>)}
                          </Select>
                        </div>
                      ))}
                    </div>
                    <Hint>{L("The crop calendar follows common Vietnam planting windows. Check dates with your local extension officer.", "Khung thời vụ theo lịch thường gặp tại Việt Nam. Hãy kiểm tra tháng gieo với cán bộ khuyến nông địa phương.")}</Hint>
                  </div>
                </Card>
                <div className="space-y-4">
                  <Card className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-semibold">{L("Soil", "Đất")}</h2>
                      <Button variant="outline" size="sm" onClick={lookupSoil} disabled={soilLoading}>
                        {soilLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
                        {L("Regional estimate (SoilGrids)", "Ước tính theo vùng (SoilGrids)")}
                      </Button>
                    </div>
                    {d.soilEstimate && (
                      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-mint/50 px-3 py-2 text-xs">
                        <StatusBadge status="estimated" />
                        <span>
                          {d.soilEstimate.texture ? t(`tex.${d.soilEstimate.texture}`) : L("Texture unavailable", "Chưa rõ loại đất")} · pH {d.soilEstimate.ph?.toFixed(1) ?? "—"} · SOC {d.soilEstimate.soc?.toFixed(2) ?? "—"}% — {d.soilEstimate.source}
                        </span>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="soil">{L("Soil type (if known)", "Loại đất (nếu biết)")}</Label>
                      <Select id="soil" value={d.soilType} onChange={(e) => up({ soilType: e.target.value as Draft["soilType"] })}>
                        <option value="unknown">{L("I don't know — use regional estimate", "Không rõ — dùng ước tính theo vùng")}</option>
                        {(["clay", "silty_clay", "loam", "sandy_loam", "sand"] as SoilTexture[]).map((x) => (
                          <option key={x} value={x}>
                            {t(`tex.${x}`)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="ph">
                          {L("Soil pH", "pH đất")} <Badge tone="outline">{L("optional", "tùy chọn")}</Badge>
                        </Label>
                        <Input id="ph" inputMode="decimal" value={d.soilPH} onChange={(e) => up({ soilPH: e.target.value })} placeholder="5.5" aria-invalid={phInvalid} />
                        {phInvalid && <Hint className="text-risk-ink">{L("pH should be between 3 and 10.", "pH nên trong khoảng 3–10.")}</Hint>}
                      </div>
                      <div>
                        <Label htmlFor="soc">
                          {L("Organic carbon %", "Carbon hữu cơ %")} <Badge tone="outline">{L("optional", "tùy chọn")}</Badge>
                        </Label>
                        <Input id="soc" inputMode="decimal" value={d.soc} onChange={(e) => up({ soc: e.target.value })} placeholder="1.8" />
                      </div>
                      <div>
                        <Label htmlFor="clay">{L("Clay % (0–30 cm, optional)", "Sét % (0–30 cm, tùy chọn)")}</Label>
                        <Input id="clay" inputMode="decimal" value={d.clayPercent} onChange={(e) => up({ clayPercent: e.target.value })} aria-invalid={clayInvalid} />
                        {clayInvalid && <Hint className="text-risk-ink">{L("Enter 0–100% clay.", "Nhập tỷ lệ sét từ 0–100%.")}</Hint>}
                      </div>
                      <div>
                        <Label htmlFor="soc-stock">{L("SOC stock (t C/ha, 0–30 cm, optional)", "Trữ lượng SOC (t C/ha, 0–30 cm, tùy chọn)")}</Label>
                        <Input id="soc-stock" inputMode="decimal" value={d.socStockTCHa} onChange={(e) => up({ socStockTCHa: e.target.value })} aria-invalid={stockInvalid} />
                        {stockInvalid && <Hint className="text-risk-ink">{L("Enter a non-negative stock in t C/ha.", "Nhập trữ lượng không âm, đơn vị t C/ha.")}</Hint>}
                      </div>
                    </div>
                    <dl className="space-y-2 text-xs">
                      {[
                        [L("Clay (0–30 cm)", "Sét (0–30 cm)"), soilResolved.clay, "%"],
                        [L("SOC stock (0–30 cm)", "Trữ lượng SOC (0–30 cm)"), soilResolved.stock, "t C/ha"],
                      ].map(([label, resolved, unit]) => {
                        const { value, tag } = resolved as typeof soilResolved.clay;
                        return <div key={label as string} className="flex flex-wrap items-center justify-between gap-2">
                          <dt>{label as string}</dt><dd className="flex items-center gap-2" title={tag.source}>
                            {value === null ? "—" : `${num(value, 2)} ${unit}`} <StatusBadge status={tag.status} withTip={false} />
                          </dd>
                        </div>;
                      })}
                    </dl>
                    <Hint>{L("For SOC stock, enter a 0–30 cm stock measurement. Carbon % alone cannot determine stock without bulk density and depth.", "Với trữ lượng SOC, nhập kết quả đo cho lớp 0–30 cm. Chỉ có % carbon thì chưa tính được trữ lượng nếu thiếu dung trọng và độ sâu.")}</Hint>
                    <Hint>
                      {L(
                        "Without a soil test we use regional reference data and label it as an estimate — never as a field measurement.",
                        "Nếu chưa có số đo đất, hệ thống dùng dữ liệu tham chiếu theo vùng và ghi nhãn là ước tính — không bao giờ là số đo thực địa.",
                      )}
                    </Hint>
                  </Card>
                  <Card className="grid grid-cols-2 gap-3 p-5">
                    <h2 className="col-span-2 text-base font-semibold">{L("Water and drainage", "Nước và thoát nước")}</h2>
                    <div>
                      <Label htmlFor="src">{L("Irrigation source", "Nguồn nước tưới")}</Label>
                      <Select id="src" value={d.irrigationSource} onChange={(e) => up({ irrigationSource: e.target.value as IrrigationSource })}>
                        {(["canal", "groundwater", "pond", "rainfed"] as IrrigationSource[]).map((x) => (
                          <option key={x} value={x}>
                            {t(`src.${x}`)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="avail">{L("Water availability", "Mức sẵn có của nước")}</Label>
                      <Select id="avail" value={d.waterAvailability} onChange={(e) => up({ waterAvailability: e.target.value as WaterAvailability })}>
                        {(["abundant", "moderate", "limited"] as WaterAvailability[]).map((x) => (
                          <option key={x} value={x}>
                            {t(`avail.${x}`)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="drain">{L("Drainage", "Thoát nước")}</Label>
                      <Select id="drain" value={d.drainage} onChange={(e) => up({ drainage: e.target.value as Drainage })}>
                        {(["good", "moderate", "poor"] as Drainage[]).map((x) => (
                          <option key={x} value={x}>
                            {t(`drain.${x}`)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sal">
                        {L("Salinity intrusion", "Xâm nhập mặn")}
                        <InfoTip>{L("Saltwater reaching canals in the dry season (Feb–May) limits irrigation and harms sensitive crops.", "Nước mặn vào kênh mùa khô (T2–T5) làm giảm nguồn tưới và hại cây nhạy mặn.")}</InfoTip>
                      </Label>
                      <Select id="sal" value={d.salinityRisk} onChange={(e) => up({ salinityRisk: e.target.value as SalinityRisk })}>
                        {(["none", "occasional", "frequent"] as SalinityRisk[]).map((x) => (
                          <option key={x} value={x}>
                            {t(`sal.${x}`)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {step === 2 && (
              <Card className="mx-auto max-w-2xl p-5">
                <p className="text-sm text-ink-2">
                  {L(
                    "Drag or use the arrows to rank. Turn off anything that does not matter to you. Ranks become importance weights you can fine-tune later.",
                    "Kéo thả hoặc dùng mũi tên để xếp hạng. Tắt mục không quan trọng với bạn. Thứ hạng sẽ thành trọng số có thể chỉnh sau.",
                  )}
                </p>
                <ol className="mt-4 space-y-2">
                  {d.priorities.map((p, i) => {
                    const rank = d.priorities.slice(0, i + 1).filter((x) => x.on).length;
                    return (
                      <li
                        key={p.id}
                        draggable
                        onDragStart={() => (dragIdx.current = i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragIdx.current !== null) movePriority(dragIdx.current, i);
                          dragIdx.current = null;
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 transition-colors",
                          p.on ? "border-line" : "border-dashed border-line opacity-60",
                        )}
                      >
                        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink-3" aria-hidden />
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold", p.on ? "bg-forest text-white" : "bg-sand-2 text-ink-3")}>
                          {p.on ? rank : "–"}
                        </span>
                        <span className="flex-1 text-sm font-medium">{t(`crit.${p.id}`)}</span>
                        <span className="hidden text-xs text-ink-3 sm:inline">{p.on ? L(`importance ${Math.max(1, 5 - (rank - 1))}/5`, `mức ${Math.max(1, 5 - (rank - 1))}/5`) : L("off", "tắt")}</span>
                        <Button variant="ghost" size="icon" aria-label={L("Move up", "Lên")} onClick={() => movePriority(i, i - 1)} disabled={i === 0}>
                          <ArrowUp className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={L("Move down", "Xuống")} onClick={() => movePriority(i, i + 1)} disabled={i === d.priorities.length - 1}>
                          <ArrowDown className="h-4 w-4" aria-hidden />
                        </Button>
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-forest"
                          aria-label={t(`crit.${p.id}`)}
                          checked={p.on}
                          onChange={() => setD((s) => ({ ...s, priorities: s.priorities.map((x) => (x.id === p.id ? { ...x, on: !x.on } : x)) }))}
                        />
                      </li>
                    );
                  })}
                </ol>
                {d.priorities.find((p) => p.id === "income")?.on && (
                  <Hint className="mt-3">
                    {L(
                      "Income is only scored once you enter local yields, prices and costs (Settings). Until then it is shown as unavailable.",
                      "Thu nhập chỉ được chấm điểm khi bạn nhập năng suất, giá và chi phí tại địa phương (Cài đặt). Trước đó sẽ hiển thị là chưa có dữ liệu.",
                    )}
                  </Hint>
                )}
              </Card>
            )}

            {step === 3 && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-5">
                  <h2 className="text-sm font-semibold text-ink-2">{L("Farm", "Trang trại")}</h2>
                  <p className="mt-1 text-lg font-bold">{d.name}</p>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-2">{L("Location", "Vị trí")}</dt>
                      <dd className="tabular">
                        {num(d.lat, 4)}°, {num(d.lon, 4)}°
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-2">{L("Area", "Diện tích")}</dt>
                      <dd>{num(d.areaHa ? areaNum : drawnArea, 2)} ha</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-2">{L("Boundary", "Ranh giới")}</dt>
                      <dd>{d.boundaryClosed ? L("drawn", "đã vẽ") : L("not provided", "chưa có")}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-2">{L("Current crop", "Cây hiện tại")}</dt>
                      <dd>
                        {crop(d.currentCropId)} · {season(d.plantingSeason)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-2">{L("Current practice", "Canh tác hiện tại")}</dt>
                      <dd className="text-right">{SEASON_ORDER.map((s) => crop(d.pattern[s])).join(" → ")}</dd>
                    </div>
                  </dl>
                </Card>
                <Card className="p-5">
                  <h2 className="text-sm font-semibold text-ink-2">{L("Soil and water", "Đất và nước")}</h2>
                  <dl className="mt-3 space-y-2 text-sm">
                    {[
                      [L("Soil type", "Loại đất"), t(`tex.${soilResolved.texture}`), soilResolved.textureTag],
                      ["pH", soilResolved.ph === null ? "—" : num(soilResolved.ph, 1), soilResolved.phTag],
                      [L("Organic carbon", "Carbon hữu cơ"), soilResolved.soc === null ? "—" : `${num(soilResolved.soc, 2)} %`, soilResolved.socTag],
                      [L("Clay (0–30 cm)", "Sét (0–30 cm)"), soilResolved.clay.value === null ? "—" : `${num(soilResolved.clay.value, 2)} %`, soilResolved.clay.tag],
                      [L("SOC stock (0–30 cm)", "Trữ lượng SOC (0–30 cm)"), soilResolved.stock.value === null ? "—" : `${num(soilResolved.stock.value, 2)} t C/ha`, soilResolved.stock.tag],
                    ].map(([k, v, tag]) => (
                      <div key={k as string} className="flex flex-wrap items-center justify-between gap-2">
                        <dt className="text-ink-2">{k as string}</dt>
                        <dd className="flex items-center gap-1.5">
                          {v as string} <StatusBadge status={(tag as SourceTag).status} withTip={false} />
                        </dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-2 border-t border-line pt-2">
                      <dt className="text-ink-2">{L("Irrigation", "Tưới")}</dt>
                      <dd>
                        {t(`src.${d.irrigationSource}`)} · {t(`avail.${d.waterAvailability}`)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-2">{L("Drainage / salinity", "Thoát nước / mặn")}</dt>
                      <dd>
                        {t(`drain.${d.drainage}`)} / {t(`sal.${d.salinityRisk}`)}
                      </dd>
                    </div>
                  </dl>
                </Card>
                <Card className="p-5">
                  <h2 className="text-sm font-semibold text-ink-2">{L("Priorities", "Ưu tiên")}</h2>
                  <ol className="mt-3 space-y-1.5 text-sm">
                    {d.priorities
                      .filter((p) => p.on)
                      .map((p, i) => (
                        <li key={p.id} className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">{i + 1}</span>
                          {t(`crit.${p.id}`)}
                        </li>
                      ))}
                  </ol>
                </Card>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  {L("Back", "Quay lại")}
                </Button>
              ) : (
                <Link href="/" className={buttonClass("ghost")}>
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  {L("Home", "Trang chủ")}
                </Link>
              )}
              {step < 3 ? (
                <div className="flex items-center gap-3">
                  {!canNext && (
                    <span className="hidden text-xs text-ink-2 sm:inline">
                      {[L("Pin your farm on the map first.", "Hãy ghim trang trại trên bản đồ trước."), L("Name and farm size are required.", "Cần nhập tên và diện tích."), L("Keep at least one priority.", "Giữ ít nhất một ưu tiên."), ""][step]}
                    </span>
                  )}
                  <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
                    {L("Continue", "Tiếp tục")}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              ) : (
                <Button size="lg" onClick={createProfile}>
                  <Check className="h-4 w-4" aria-hidden />
                  {L("Create My Farm Profile", "Tạo hồ sơ trang trại")}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
