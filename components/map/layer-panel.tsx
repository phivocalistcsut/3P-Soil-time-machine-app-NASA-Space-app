"use client";

import { useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  History,
  Layers,
  Map as MapIcon,
  Pause,
  Play,
  Satellite,
} from "lucide-react";
import {
  OVERLAYS,
  monthRange,
  overlayDateFor,
  type OverlayId,
} from "@/lib/data/layers";
import { useLayerTime } from "@/lib/layer-time";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/primitives";
import { InfoTip } from "@/components/ui/overlays";
import { cn } from "@/components/ui/primitives";
import type { Basemap } from "./farm-map";

export function BasemapToggle({
  value,
  onChange,
  className,
}: {
  value: Basemap;
  onChange: (b: Basemap) => void;
  className?: string;
}) {
  const { L } = useI18n();
  return (
    <div
      role="group"
      aria-label={L("Basemap", "Bản đồ nền")}
      className={cn(
        "inline-flex rounded-xl border border-line bg-white p-0.5 shadow-sm",
        className,
      )}
    >
      {(
        [
          ["satellite", Satellite, L("Satellite", "Vệ tinh")],
          ["map", MapIcon, L("Map", "Bản đồ")],
        ] as const
      ).map(([id, Icon, label]) => (
        <button
          key={id}
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-xs font-medium",
            value === id ? "bg-forest text-white" : "text-ink-2 hover:text-ink",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

export function LayerPanel({
  overlays,
  onToggle,
  showBoundary,
  onToggleBoundary,
  hasBoundary,
  compact,
}: {
  overlays: OverlayId[];
  onToggle: (id: OverlayId) => void;
  showBoundary: boolean;
  onToggleBoundary: () => void;
  hasBoundary: boolean;
  compact?: boolean;
}) {
  const { L, lang } = useI18n();
  const month = useLayerTime((s) => s.month);
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-2">
        <Layers className="h-3.5 w-3.5" aria-hidden />
        {L("Data layers", "Lớp dữ liệu")}
      </p>
      {hasBoundary && (
        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-forest"
            checked={showBoundary}
            onChange={onToggleBoundary}
          />
          <span className="flex-1">
            {L("Farm boundary", "Ranh giới ruộng")}
          </span>
          <span className="text-[11px] text-ink-3">
            {L("user-drawn", "do bạn vẽ")}
          </span>
        </label>
      )}
      {OVERLAYS.map((o) => {
        const on = overlays.includes(o.id);
        return (
          <div
            key={o.id}
            className={cn(
              "rounded-xl border bg-white px-3 py-2",
              on ? "border-water/50" : "border-line",
            )}
          >
            <label className="flex min-h-8 cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-forest"
                checked={on}
                onChange={() => onToggle(o.id)}
              />
              <span className="flex-1 font-medium">{o.name[lang]}</span>
              <InfoTip label={o.name[lang]}>
                <p className="font-semibold">{o.product}</p>
                <p className="mt-1">{o.desc[lang]}</p>
                <p className="mt-1 text-ink-2">
                  {L("Resolution", "Độ phân giải")}: {o.resolution[lang]} ·{" "}
                  {L("Source", "Nguồn")}: NASA GIBS
                </p>
              </InfoTip>
            </label>
            {(on || !compact) && (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 pl-6 text-[11px] text-ink-2">
                <Badge tone="outline">{L("Imagery", "Ảnh vệ tinh")}</Badge>
                <span>
                  {o.monthly ? L("Month of", "Tháng") : L("Date", "Ngày")}{" "}
                  {overlayDateFor(o, month).slice(0, o.monthly ? 7 : 10)}
                </span>
                <span>· {o.resolution[lang]}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MapLegend({
  overlays,
  className,
}: {
  overlays: OverlayId[];
  className?: string;
}) {
  const { L, lang } = useI18n();
  const month = useLayerTime((s) => s.month);
  const active = OVERLAYS.filter((o) => overlays.includes(o.id));
  if (!active.length) return null;
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-line bg-white/95 p-2.5 shadow-sm backdrop-blur",
        className,
      )}
    >
      {active.map((o) => (
        <figure key={o.id}>
          <figcaption className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-ink">
            <span>{o.name[lang]}</span>
            <span className="font-normal text-ink-3">
              {overlayDateFor(o, month).slice(0, o.monthly ? 7 : 10)}
            </span>
          </figcaption>
          {/* Official GIBS colormap legend */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={o.legendUrl}
            alt={`${o.name[lang]} legend (${o.unit})`}
            className="h-auto w-[230px] max-w-full"
            loading="lazy"
          />
          <p className="mt-0.5 text-[10px] text-ink-3">
            {o.status === "estimated" ? L("Regional estimate", "Ước tính theo vùng") : L("Satellite data", "Dữ liệu vệ tinh")} ·{" "}
            {o.resolution[lang]} —{" "}
            {L("not field scale", "không phải quy mô thửa ruộng")}
          </p>
        </figure>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * U13 · look back in time: one slider moves every NASA layer to the same month,
 * from 2016 to now, with quick jumps to past drought–salinity seasons.
 * ------------------------------------------------------------------------- */
export function LayerTimeBar({
  overlays,
  onEnable,
  className,
}: {
  overlays: OverlayId[];
  onEnable: () => void;
  className?: string;
}) {
  const { L, lang } = useI18n();
  const month = useLayerTime((s) => s.month);
  const setMonth = useLayerTime((s) => s.setMonth);
  const playing = useLayerTime((s) => s.playing);
  const setPlaying = useLayerTime((s) => s.setPlaying);
  const months = useMemo(() => monthRange(), []);
  const last = months.length - 1;
  const idx = month ? Math.max(0, months.indexOf(month)) : last;
  const go = (i: number) => setMonth(i >= last ? null : months[Math.max(0, i)]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const st = useLayerTime.getState();
      const i = st.month ? months.indexOf(st.month) : last;
      if (i >= last - 1) {
        st.setMonth(null);
        st.setPlaying(false);
        return;
      }
      st.setMonth(months[i + 1]);
    }, 1400);
    return () => window.clearInterval(id);
  }, [playing, months, last]);
  useEffect(() => () => useLayerTime.getState().setPlaying(false), []);

  const label = (m: string) => {
    const [y, mm] = m.split("-").map(Number);
    return lang === "vi"
      ? `T${mm}/${y}`
      : new Date(Date.UTC(y, mm - 1, 1)).toLocaleString("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });
  };
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = now.getUTCMonth() + 1;
  const dryY = mo >= 3 ? y : y - 1;
  const wetY = mo >= 10 ? y : y - 1;
  const picks: { m: string | null; text: string }[] = [
    { m: "2016-03", text: L("2016 drought & salt", "Hạn mặn 2016") },
    { m: "2020-03", text: L("2020 drought & salt", "Hạn mặn 2020") },
    { m: `${dryY}-03`, text: L(`Dry season ${dryY}`, `Mùa khô ${dryY}`) },
    { m: `${wetY}-10`, text: L(`Rainy season ${wetY}`, `Mùa mưa ${wetY}`) },
    { m: null, text: L("Latest", "Mới nhất") },
  ];

  if (!overlays.length) {
    return (
      <button
        onClick={onEnable}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-xl border border-white/60 bg-white/95 px-3 text-xs font-semibold text-[#1C6159] shadow-md backdrop-blur hover:bg-white",
          className,
        )}
      >
        <History className="h-3.5 w-3.5" aria-hidden />
        {L(
          "Look back in time with NASA (2016 → now)",
          "Xem lại theo thời gian với NASA (2016 → nay)",
        )}
      </button>
    );
  }

  const btn =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-2 hover:text-ink disabled:opacity-40";
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/60 bg-white/95 p-2.5 shadow-lg backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 shrink-0 text-[#23786F]" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-2">
          {L("Satellite data month", "Tháng dữ liệu vệ tinh")}{" "}
          <span className="text-sm font-extrabold text-ink tabular">
            {label(months[idx])}
          </span>
          {idx === last && (
            <span className="ml-1 text-[11px] font-medium text-ink-3">
              ({L("latest", "mới nhất")})
            </span>
          )}
        </p>
        <button
          className={btn}
          onClick={() => go(idx - 1)}
          disabled={idx === 0}
          aria-label={L("Previous month", "Tháng trước")}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          className={cn(
            btn,
            playing &&
              "border-transparent bg-[#23786F] text-white hover:text-white",
          )}
          onClick={() => {
            if (!playing && idx >= last - 1)
              setMonth(months[Math.max(0, last - 12)]);
            setPlaying(!playing);
          }}
          aria-label={
            playing
              ? L("Pause", "Tạm dừng")
              : L("Play month by month", "Chạy từng tháng")
          }
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
        </button>
        <button
          className={btn}
          onClick={() => go(idx + 1)}
          disabled={idx === last}
          aria-label={L("Next month", "Tháng sau")}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={last}
        step={1}
        value={idx}
        onChange={(e) => {
          setPlaying(false);
          go(Number(e.target.value));
        }}
        className="mt-1.5 w-full accent-[#23786F]"
        aria-label={L(
          "Month shown by the NASA layers",
          "Tháng hiển thị của các lớp NASA",
        )}
        aria-valuetext={label(months[idx])}
      />
      <div className="mt-1 flex flex-wrap gap-1">
        {picks.map((p) => {
          const on =
            (p.m ?? null) === (month ?? null) || (p.m === null && idx === last);
          return (
            <button
              key={p.text}
              onClick={() => {
                setPlaying(false);
                setMonth(p.m && months.indexOf(p.m) < last ? p.m : null);
              }}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                on
                  ? "bg-[#23786F] text-white"
                  : "bg-[#DDF1EE] text-[#1C6159] hover:bg-[#c9e9e4]",
              )}
            >
              {p.text}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[10px] leading-snug text-ink-3">
        {L("Tip: zoom the map out to see the whole region — one NASA pixel covers many farms.", "Mẹo: thu nhỏ bản đồ để thấy cả vùng — một điểm ảnh NASA phủ nhiều trang trại.")}
      </p>
    </div>
  );
}
