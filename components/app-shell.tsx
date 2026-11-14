"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  CalendarRange,
  GraduationCap,
  MapPin,
  MoreHorizontal,
  Plus,
  Scale,
  Settings,
  Sprout,
  TrendingUp,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { LanguageSwitcher, Logo } from "@/components/common";
import { Sheet } from "@/components/ui/overlays";
import { Skeleton, cn } from "@/components/ui/primitives";

interface NavItem {
  href: string;
  icon: LucideIcon;
  en: string;
  vi: string;
  shortEn: string;
  shortVi: string;
}

const NAV: NavItem[] = [
  { href: "/overview", icon: Sprout, en: "My Farm", vi: "Ruộng của tôi", shortEn: "My Farm", shortVi: "Ruộng" },
  { href: "/simulator", icon: TrendingUp, en: "5-Year Simulator", vi: "Mô phỏng 5 năm", shortEn: "Simulate", shortVi: "Mô phỏng" },
  { href: "/compare", icon: Scale, en: "Compare Plans", vi: "So sánh cách trồng", shortEn: "Compare", shortVi: "So sánh" },
  { href: "/planner", icon: CalendarRange, en: "Season Plan", vi: "Kế hoạch mùa vụ", shortEn: "Plan", shortVi: "Kế hoạch" },
  { href: "/learn", icon: GraduationCap, en: "Guide & Glossary", vi: "Hướng dẫn & Thuật ngữ", shortEn: "Guide", shortVi: "Hướng dẫn" },
  { href: "/methodology", icon: BookOpen, en: "Data sources", vi: "Nguồn dữ liệu", shortEn: "Data", shortVi: "Dữ liệu" },
  { href: "/settings", icon: Settings, en: "Settings", vi: "Cài đặt", shortEn: "Settings", shortVi: "Cài đặt" },
];
const PRIMARY = 4;

function DataModePill({ iconOnly }: { iconOnly?: boolean }) {
  const { L } = useI18n();
  const mode = useApp((s) => s.dataMode);
  const label = mode === "live" ? L("Live NASA data", "Dữ liệu NASA trực tuyến") : L("Offline mode", "Ngoại tuyến");
  return (
    <Link
      href="/settings"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium",
        mode === "live" ? "border-lime/40 text-lime-bright hover:bg-white/5" : "border-white/20 text-white/70 hover:bg-white/5",
      )}
      title={L("Data mode — change in Settings", "Chế độ dữ liệu — đổi trong Cài đặt")}
      aria-label={iconOnly ? label : undefined}
    >
      {mode === "live" ? <Wifi className="h-3.5 w-3.5" aria-hidden /> : <WifiOff className="h-3.5 w-3.5" aria-hidden />}
      {!iconOnly && label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { L, num } = useI18n();
  const farm = useApp((s) => s.farm);
  const hydrated = useHydrated();
  const [more, setMore] = useState(false);
  const isActive = (href: string) => !!pathname?.startsWith(href);

  return (
    <div className="flex min-h-screen flex-col print:min-h-0">
      <a href="#main" className="sr-only z-[100] rounded bg-white px-3 py-2 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        {L("Skip to content", "Bỏ qua tới nội dung")}
      </a>

      {/* Top bar: full navigation on wide screens, logo + language on small ones */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-space-950/95 text-white backdrop-blur no-print">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center gap-4 px-4 md:px-6 lg:px-8">
          <Logo light className="shrink-0" />
          <nav aria-label={L("Main", "Chính")} className="ml-4 hidden flex-1 items-center gap-0.5 xl:flex">
            {NAV.map((n, i) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-16 items-center gap-2 px-3 text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-colors",
                    active ? "text-white" : "text-white/60 hover:text-white",
                    i === PRIMARY && "ml-3 border-l border-white/10 pl-5",
                  )}
                >
                  <n.icon className={cn("h-4 w-4", active ? "text-lime-bright" : "")} aria-hidden />
                  {L(n.shortEn, n.shortVi)}
                  {active && <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-lime" />}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {hydrated && farm && (
              <Link
                href="/overview"
                className="hidden max-w-[220px] items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-lime 2xl:flex"
                title={`${num(farm.latitude, 3)}°, ${num(farm.longitude, 3)}° · ${num(farm.areaHa, 1)} ha`}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-lime-bright" aria-hidden />
                <span className="truncate font-semibold">{farm.name}</span>
              </Link>
            )}
            <span className="hidden xl:inline-flex">
              <DataModePill iconOnly />
            </span>
            <LanguageSwitcher dark />
            <Link
              href="/setup"
              className="hidden h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-lime hover:text-white xl:flex"
              title={L("New farm profile", "Tạo hồ sơ trang trại")}
              aria-label={L("New farm profile", "Tạo hồ sơ trang trại")}
            >
              <Plus className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1360px] flex-1 px-4 pb-28 pt-5 md:px-6 lg:px-8 xl:pb-12 xl:pt-7 print:p-0">
        {hydrated ? (
          children
        ) : (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-40 rounded-3xl" />
            <Skeleton className="h-12 rounded-full" />
            <Skeleton className="h-72" />
          </div>
        )}
      </main>

      <footer className="hidden border-t border-line px-4 py-5 text-center text-[11px] text-ink-3 xl:block no-print">
        {L(
          "NASA Space Apps · climate-resilient crop rotation prototype · Photographs: NASA / International Space Station",
          "NASA Space Apps · nguyên mẫu luân canh thích ứng khí hậu · Ảnh: NASA / Trạm Vũ trụ Quốc tế",
        )}
      </footer>

      {/* Mobile + tablet bottom navigation */}
      <nav
        aria-label={L("Main", "Chính")}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-space-950 pb-[env(safe-area-inset-bottom)] text-white xl:hidden no-print"
      >
        {NAV.slice(0, PRIMARY).map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cn("flex min-h-[62px] flex-col items-center justify-center gap-1 text-[10.5px] font-semibold", active ? "text-white" : "text-white/60")}
            >
              <span className={cn("flex h-8 w-12 items-center justify-center rounded-full", active && "bg-lime text-space-900")}>
                <n.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="max-w-[72px] truncate">{L(n.shortEn, n.shortVi)}</span>
            </Link>
          );
        })}
        <button onClick={() => setMore(true)} className="flex min-h-[62px] flex-col items-center justify-center gap-1 text-[10.5px] font-semibold text-white/60">
          <span className="flex h-8 w-12 items-center justify-center">
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </span>
          {L("More", "Thêm")}
        </button>
      </nav>
      <Sheet open={more} onOpenChange={setMore} title={L("More", "Thêm")}>
        <div className="grid gap-2 pb-4">
          {[...NAV.slice(PRIMARY), { href: "/setup", icon: Plus, en: "New farm profile", vi: "Tạo hồ sơ trang trại", shortEn: "", shortVi: "" }].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMore(false)}
              aria-current={isActive(n.href) ? "page" : undefined}
              className="flex h-14 items-center gap-3 rounded-2xl border border-line px-4 text-sm font-semibold hover:border-lime"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-space-900 text-lime-bright">
                <n.icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              {L(n.en, n.vi)}
            </Link>
          ))}
          {hydrated && farm && (
            <p className="flex items-center gap-1.5 px-1 pt-2 text-xs text-ink-2">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {farm.name} · {num(farm.latitude, 3)}°, {num(farm.longitude, 3)}° · {num(farm.areaHa, 1)} ha
            </p>
          )}
          <div className="rounded-2xl bg-space-900 p-2">
            <DataModePill />
          </div>
        </div>
      </Sheet>
    </div>
  );
}
