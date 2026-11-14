"use client";

import Image from "next/image";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Droplets,
  Satellite,
  Snowflake,
  Sprout,
  Sun,
  Table2,
  ThermometerSun,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getCrop } from "@/lib/data/crops";
import { CROP_YEAR_MONTHS, type RowId, type VulnerabilityCalendar } from "@/lib/engine/insights";
import { RiskCalendar } from "@/components/insights";
import { cn } from "@/components/ui/primitives";

/* ---------------------------------------------------------------------------
 * "Field info" tab: summary-first cards in the landing page's style.
 * Each card = a dark visual (optionally over a photo) + one big number + one short line.
 * Tapping a card opens the full detail panel underneath (rendered by the page).
 * ------------------------------------------------------------------------- */

export type InfoDetail = "weather" | "soil" | "extremes" | "risk" | "sources";
export const INFO_DETAILS: InfoDetail[] = ["weather", "soil", "extremes", "risk", "sources"];

/** Dark visual area shared by all cards. Pass `image` (a file in /public/images) to put a photo behind the data. */
function Visual({ children, image, className }: { children: React.ReactNode; image?: string; className?: string }) {
  return (
    <div className={cn("relative isolate h-44 overflow-hidden rounded-2xl bg-space-900 text-white md:h-52", className)}>
      {image ? (
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image src={`/images/${image}`} alt="" fill sizes="(min-width: 1280px) 300px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-space-950/90 via-space-950/65 to-space-950/45" />
        </div>
      ) : (
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(141,198,63,0.14),transparent_60%)]" />
      )}
      {children}
    </div>
  );
}

/* ------------------------------- mini visuals ------------------------------ */

export function RainSpark({ months }: { months: { month: number; precip: number; et0: number }[] }) {
  const max = Math.max(...months.map((m) => Math.max(m.precip, m.et0)), 1);
  const H = 92;
  const y = (v: number) => 8 + H - (v / max) * H;
  const x = (i: number) => 14 + i * 19;
  const line = months.map((m, i) => `${i ? "L" : "M"}${x(i) + 6},${y(m.et0)}`).join(" ");
  return (
    <svg viewBox="0 0 240 120" className="h-full w-full" aria-hidden>
      {months.map((m, i) => {
        const dry = m.precip < m.et0 / 2;
        return (
          <g key={m.month}>
            <rect x={x(i)} y={y(m.precip)} width={12} height={Math.max(8 + H - y(m.precip), 1.5)} rx={3} fill={dry ? "#e4a84c" : "#7dbbe6"} />
            <text x={x(i) + 6} y={116} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.4)">{m.month}</text>
          </g>
        );
      })}
      <path d={line} fill="none" stroke="#a8dc5c" strokeWidth={1.6} strokeDasharray="3 3" strokeLinecap="round" />
    </svg>
  );
}

/** Root-zone moisture as two level gauges: dry season vs. wet season. */
export function SoilVisual({ dry, wet }: { dry: number | null; wet: number | null }) {
  const { L, num } = useI18n();
  if (dry === null || wet === null) return <VisualState loading={false} />;
  const gauge = (v: number, label: string, Icon: LucideIcon, fill: string) => (
    <div className="flex h-full flex-1 items-end gap-3">
      <div className="relative h-full w-9 overflow-hidden rounded-xl border border-white/15 bg-white/5">
        <div className="absolute inset-x-0 bottom-0 rounded-b-[10px]" style={{ height: `${Math.max(4, Math.min(100, v * 100))}%`, background: fill }} />
      </div>
      <div className="pb-0.5">
        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
          <Icon className="h-3 w-3" aria-hidden />
          {label}
        </p>
        <p className="font-display text-2xl font-extrabold leading-none tabular">{num(v * 100)}%</p>
      </div>
    </div>
  );
  return (
    <div className="flex h-full flex-col px-4 pb-4 pt-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">{L("Root-zone moisture", "Độ ẩm vùng rễ")}</p>
      <div className="flex min-h-0 flex-1 gap-4">
        {gauge(dry, L("Dry", "Mùa khô"), Sun, "linear-gradient(to top,#b57b38,#e4a84c)")}
        {gauge(wet, L("Wet", "Mùa mưa"), CloudRain, "linear-gradient(to top,#24628d,#7dbbe6)")}
      </div>
    </div>
  );
}

export function ExtremesVisual({ items }: { items: { icon: LucideIcon; value: string; label: string; color: string }[] }) {
  return (
    <div className="grid h-full grid-cols-3 items-center px-2">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col items-center gap-1.5 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5">
            <it.icon className={cn("h-[18px] w-[18px]", it.color)} aria-hidden />
          </span>
          <span className="font-display text-xl font-extrabold tabular leading-none">{it.value}</span>
          <span className="text-[10px] leading-tight text-white/60">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ risk summary ------------------------------ */

const RISK_ROWS: Exclude<RowId, "cover">[] = ["water", "rain", "heat", "salinity", "frost"];
const ROW_ICON: Record<RowId, LucideIcon> = { cover: Sprout, water: Droplets, rain: CloudRain, heat: ThermometerSun, salinity: Waves, frost: Snowflake };
/** colours on dark surfaces, level 0 → 3 */
const DARK_LEVEL = ["#4f9d69", "#d8c04a", "#e08a3c", "#d96a5f"];
/** soft tiles on light surfaces, level 0 → 3 (same as the full calendar) */
const LIGHT_BG = ["bg-[#E7F4EA]", "bg-[#FBEFD6]", "bg-[#F7D9B5]", "bg-[#F3C5BE]"];
const LIGHT_TEXT = ["text-[#2F6E45]", "text-[#8A5A10]", "text-[#8A4A10]", "text-[#A63F33]"];

/** Level of each crop-year month = its worst single risk (same scale as the full table). */
export function monthLevels(cal: VulnerabilityCalendar): (0 | 1 | 2 | 3)[] {
  const rows = cal.rows.filter((r) => r.id !== "cover");
  return CROP_YEAR_MONTHS.map((_, k) => Math.max(0, ...rows.map((r) => r.cells[k]?.level ?? 0)) as 0 | 1 | 2 | 3);
}

/** Risks that reach "High" at least once, most serious first. */
export function mainRisks(cal: VulnerabilityCalendar) {
  return cal.rows
    .filter((r) => r.id !== "cover" && r.cells.some((c) => c.level >= 2))
    .map((r) => ({ row: r, score: r.cells.reduce((s, c) => s + c.level, 0) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.row);
}

function isBare(cal: VulnerabilityCalendar, k: number) {
  return !cal.rows.find((r) => r.id === "cover")?.cells[k]?.cropId;
}

/** Card visual: 12 months, bar height = how much is going wrong that month; hatched cap = bare field. */
export function RiskStrip({ calendar }: { calendar: VulnerabilityCalendar }) {
  const { month } = useI18n();
  const max = Math.max(...calendar.totals, 1);
  const lv = monthLevels(calendar);
  return (
    <div className="flex h-full items-end gap-[3px] px-3 pb-2 pt-4">
      {CROP_YEAR_MONTHS.map((m, k) => (
        <div key={k} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <div className="w-full rounded-md" style={{ height: `${Math.max(8, (calendar.totals[k] / max) * 78)}%`, background: DARK_LEVEL[lv[k]] }} />
          <div
            className={cn("h-1.5 w-full rounded-full", isBare(calendar, k) ? "bg-[repeating-linear-gradient(45deg,#c49b6c_0_2px,transparent_2px_4px)]" : "bg-lime/70")}
            aria-hidden
          />
          <span className="text-[8px] leading-none text-white/45">{month(m).replace(/^Th(áng)?\s?/, "")}</span>
        </div>
      ))}
    </div>
  );
}

/** Full detail: season timeline → what to watch (analysed per risk) → full table on demand. */
export function RiskDetail({ calendar, cta }: { calendar: VulnerabilityCalendar; cta: React.ReactNode }) {
  const { L, lang, month } = useI18n();
  const [table, setTable] = useState(false);
  const lv = monthLevels(calendar);
  const levelWord = [L("OK", "Ổn"), L("Watch", "Chú ý"), L("High", "Cao"), L("Very high", "Rất cao")];
  const cover = calendar.rows.find((r) => r.id === "cover");

  const risks = RISK_ROWS.map((id) => calendar.rows.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => {
      const hot = r.cells.map((c, k) => ({ c, k })).filter(({ c }) => c.level >= 2);
      const peak = r.cells.reduce((best, c, k) => (c.level > r.cells[best].level ? k : best), 0);
      const score = r.cells.reduce((s, c) => s + c.level, 0);
      return { row: r, hot, peak, score, max: Math.max(...r.cells.map((c) => c.level)) };
    });
  const watch = risks.filter((r) => r.max >= 2).sort((a, b) => b.score - a.score);
  const calm = risks.filter((r) => r.max < 2);

  return (
    <div className="space-y-5">
      {/* 1 · the crop year at a glance */}
      <div className="rounded-3xl border border-line bg-white p-4 shadow-[var(--shadow-card)] md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold">{L("Your crop year, Dec → Nov", "Năm mùa vụ của bạn, T12 → T11")}</h3>
          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
            {levelWord.map((w, i) => (
              <span key={w} className={cn("rounded-full px-2 py-0.5", LIGHT_BG[i], LIGHT_TEXT[i])}>{w}</span>
            ))}
          </div>
        </div>
        <ol className="grid grid-cols-6 gap-1.5 md:grid-cols-12">
          {CROP_YEAR_MONTHS.map((m, k) => {
            const c = cover?.cells[k];
            const crop = getCrop(c?.cropId ?? null);
            return (
              <li key={k} className="flex flex-col gap-1">
                <span className={cn("text-center text-[11px] font-bold", lv[k] === 3 ? "text-risk-ink" : "text-ink-2")}>{month(m)}</span>
                <span
                  className={cn("truncate rounded-md px-1 py-1 text-center text-[10px] font-semibold", !crop && "bg-[repeating-linear-gradient(45deg,#e9d9bf_0_4px,#f8f1e5_4px_8px)] text-earth-ink")}
                  style={crop ? { background: `${crop.color}2e`, color: "#21312B" } : undefined}
                  title={c?.value[lang]}
                >
                  {crop ? c?.value[lang] : L("Bare", "Trống")}
                </span>
                <span className={cn("flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-bold", LIGHT_BG[lv[k]], LIGHT_TEXT[lv[k]])}>
                  {lv[k] >= 2 && <AlertTriangle className="mb-0.5 h-3.5 w-3.5" aria-hidden />}
                  {levelWord[lv[k]]}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-[11px] text-ink-2">
          {L("Each month shows its highest single risk. Hatched = bare field.", "Mỗi tháng hiện mức rủi ro cao nhất trong tháng. Ô sọc = ruộng để trống.")}
        </p>
      </div>

      {/* 2 · what to watch, analysed per risk */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <AlertTriangle className="h-4 w-4 text-risk-ink" aria-hidden />
          {L("What to watch", "Điểm cần chú ý")}
        </h3>
        {watch.length === 0 ? (
          <p className="rounded-2xl bg-lime-soft px-4 py-3 text-sm text-lime-ink">{L("No month reaches a high level.", "Không tháng nào ở mức cao.")}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {watch.map(({ row, hot, peak, max }) => {
              const Icon = ROW_ICON[row.id];
              const pc = row.cells[peak];
              return (
                <article key={row.id} className="flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)]">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", LIGHT_BG[max], LIGHT_TEXT[max])}>
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <h4 className="font-bold">{row.name[lang]}</h4>
                      <span className={cn("text-xs font-bold", LIGHT_TEXT[max])}>
                        {hot.length} {L(hot.length === 1 ? "month" : "months", "tháng")}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {hot.map(({ c, k }) => (
                        <span key={k} className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", LIGHT_BG[c.level], LIGHT_TEXT[c.level])}>
                          {month(CROP_YEAR_MONTHS[k])}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-ink">
                      <span className="font-semibold">{L("Peak", "Nặng nhất")}: {month(CROP_YEAR_MONTHS[peak])}</span> · {pc.risk ? `${pc.risk[lang]} · ` : ""}
                      {pc.value[lang]}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-ink-2">{row.help[lang]}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {calm.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-2">
            <CheckCircle2 className="h-4 w-4 text-[#2F6E45]" aria-hidden />
            {L("Never high:", "Chưa đến mức cao:")}
            {calm.map(({ row }) => (
              <span key={row.id} className="rounded-full bg-[#E7F4EA] px-2 py-0.5 font-semibold text-[#2F6E45]">{row.name[lang]}</span>
            ))}
          </p>
        )}
      </div>

      {cta}

      {/* 3 · the full month-by-month table, only on demand */}
      <div>
        <button
          type="button"
          onClick={() => setTable((v) => !v)}
          aria-expanded={table}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-lime"
        >
          <Table2 className="h-4 w-4 text-ink-2" aria-hidden />
          {table ? L("Hide the full table", "Ẩn bảng đầy đủ") : L("Full month-by-month table", "Xem bảng đầy đủ theo tháng")}
          {table ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
        </button>
        {table && (
          <div className="mt-3 animate-fade-in rounded-2xl border border-line bg-white p-3 md:p-4">
            <RiskCalendar calendar={calendar} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- cards ---------------------------------- */

export function InfoCard({
  icon: Icon,
  title,
  value,
  unit,
  note,
  visual,
  image,
  open,
  onToggle,
  controls,
}: {
  icon: LucideIcon;
  title: string;
  value: React.ReactNode;
  unit?: string;
  note?: React.ReactNode;
  visual: React.ReactNode;
  image?: string;
  open: boolean;
  onToggle: () => void;
  controls: string;
}) {
  const { L } = useI18n();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      className={cn(
        "group flex flex-col rounded-3xl border bg-white p-3 text-left shadow-[var(--shadow-card)] transition-all duration-300",
        open ? "border-lime ring-2 ring-lime/40" : "border-line hover:-translate-y-1 hover:border-lime hover:shadow-[var(--shadow-float)]",
      )}
    >
      <Visual image={image}>{visual}</Visual>
      <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
        <p className="flex items-center gap-1.5 font-display text-[11px] font-extrabold uppercase tracking-[0.18em] text-lime-ink">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {title}
        </p>
        <p className="mt-1.5 font-display text-[28px] font-extrabold leading-tight text-ink tabular">
          {value}
          {unit && <span className="ml-1 text-xs font-semibold text-ink-2">{unit}</span>}
        </p>
        {note && <p className="mt-0.5 text-xs text-ink-2">{note}</p>}
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-ink-2 group-hover:text-lime-ink">
          {open ? L("Hide details", "Thu gọn") : L("Details", "Xem chi tiết")}
          {open ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
        </span>
      </div>
    </button>
  );
}

/** Placeholder inside a card's dark visual while data loads or when it is missing. */
export function VisualState({ loading }: { loading: boolean }) {
  const { L } = useI18n();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
      {loading ? (
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-lime/60" />
        </div>
      ) : (
        <Satellite className="h-5 w-5 text-white/40" aria-hidden />
      )}
      <p className="text-[11px] text-white/55">{loading ? L("Loading from NASA…", "Đang tải từ NASA…") : L("No data yet", "Chưa có dữ liệu")}</p>
    </div>
  );
}

/** Slim dark band at the bottom: where the numbers come from. */
export function SourcesBand({ open, onToggle, names }: { open: boolean; onToggle: () => void; names: string[] }) {
  const { L } = useI18n();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="info-detail-sources"
      className={cn(
        "relative isolate flex w-full flex-wrap items-center gap-3 overflow-hidden rounded-3xl bg-space-900 px-5 py-4 text-left text-white transition-shadow",
        open ? "ring-2 ring-lime/60" : "hover:shadow-[var(--shadow-float)]",
      )}
    >
      <div aria-hidden className="absolute inset-0 -z-10 bg-stars opacity-40" />
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-lime/50 text-lime-bright">
        <Satellite className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-lime-bright">{L("Data sources", "Nguồn dữ liệu")}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {names.map((n) => (
            <span key={n} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-white/80">
              {n}
            </span>
          ))}
        </div>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/75">
        {open ? L("Hide", "Thu gọn") : L("Coverage & quality", "Phạm vi & chất lượng")}
        {open ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
      </span>
    </button>
  );
}

/** Container for the full detail of the open card. */
export function DetailPanel({ id, title, onClose, children }: { id: string; title: string; onClose: () => void; children: React.ReactNode }) {
  const { L } = useI18n();
  return (
    <section id={id} className="scroll-mt-24 animate-fade-in rounded-3xl border border-line bg-sand-2/40 p-3 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="eyebrow text-lime-ink">{title}</p>
        <button type="button" onClick={onClose} className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold text-ink-2 hover:bg-white hover:text-ink">
          {L("Hide", "Thu gọn")}
          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      {children}
    </section>
  );
}
