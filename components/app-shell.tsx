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
import { TONES, type Tone } from "@/components/ui/sections";

interface NavItem {
  href: string;
  icon: LucideIcon;
  en: string;
  vi: string;
  shortEn: string;
  shortVi: string;
  tone: Tone;
}

export const NAV: NavItem[] = [
  { href: "/overview", icon: Sprout, en: "My Farm", vi: "Ruộng của tôi", shortEn: "My Farm", shortVi: "Ruộng", tone: "green" },
  { href: "/simulator", icon: TrendingUp, en: "5-Year Simulator", vi: "Mô phỏng 5 năm", shortEn: "Simulate", shortVi: "Mô phỏng", tone: "blue" },
  { href: "/compare", icon: Scale, en: "Compare Plans", vi: "So sánh cách trồng", shortEn: "Compare", shortVi: "So sánh", tone: "amber" },
  { href: "/planner", icon: CalendarRange, en: "Season Plan", vi: "Kế hoạch mùa vụ", shortEn: "Plan", shortVi: "Kế hoạch", tone: "leaf" },
  { href: "/learn", icon: GraduationCap, en: "Guide & Glossary", vi: "Hướng dẫn & Thuật ngữ", shortEn: "Guide", shortVi: "Hướng dẫn", tone: "violet" },
  { href: "/methodology", icon: BookOpen, en: "Data sources", vi: "Nguồn dữ liệu", shortEn: "Data", shortVi: "Dữ liệu", tone: "teal" },
  { href: "/settings", icon: Settings, en: "Settings", vi: "Cài đặt", shortEn: "Settings", shortVi: "Cài đặt", tone: "earth" },
];

function DataModePill({ dark }: { dark?: boolean }) {
  const { L } = useI18n();
  const mode = useApp((s) => s.dataMode);
  return (
    <Link
      href="/settings"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium",
        dark ? "bg-white/10 text-mint hover:bg-white/15" : mode === "live" ? "bg-water-soft text-water-ink" : "bg-sand-2 text-ink-2",
      )}
      title={L("Data mode — change in Settings", "Chế độ dữ liệu — đổi trong Cài đặt")}
    >
      {mode === "live" ? <Wifi className="h-3.5 w-3.5" aria-hidden /> : <WifiOff className="h-3.5 w-3.5" aria-hidden />}
      {mode === "live" ? L("Live NASA data", "Dữ liệu NASA trực tuyến") : L("Offline mode", "Ngoại tuyến")}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { L, num } = useI18n();
  const farm = useApp((s) => s.farm);
  const hydrated = useHydrated();
  const [more, setMore] = useState(false);

  return (
    <div className="min-h-screen lg:pl-[264px] print:min-h-0 print:pl-0">
      <a href="#main" className="sr-only z-[100] rounded bg-white px-3 py-2 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        {L("Skip to content", "Bỏ qua tới nội dung")}
      </a>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col bg-gradient-to-b from-forest-deep via-[#123f32] to-[#0d2f25] text-white lg:flex no-print">
        <div className="px-5 pb-4 pt-5">
          <Logo light />
        </div>
        {hydrated && farm && (
          <Link href="/overview" className="mx-3 mb-4 rounded-2xl bg-white/10 px-3.5 py-3 ring-1 ring-white/10 hover:bg-white/15">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-mint/70">{L("Your field", "Ruộng đang xem")}</p>
            <p className="truncate text-sm font-semibold">{farm.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-mint/75">
              <MapPin className="h-3 w-3" aria-hidden />
              {num(farm.latitude, 3)}°, {num(farm.longitude, 3)}° · {num(farm.areaHa, 1)} ha
            </p>
          </Link>
        )}
        <nav aria-label={L("Main", "Chính")} className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((n, i) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-12 items-center gap-3 rounded-xl px-2.5 text-[14px] font-medium transition-colors",
                  active ? "bg-white text-forest-deep shadow-sm" : "text-mint/90 hover:bg-white/10 hover:text-white",
                  i === 4 && "mt-3",
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white", TONES[n.tone].solid)}>
                  <n.icon className="h-[17px] w-[17px]" aria-hidden />
                </span>
                {L(n.en, n.vi)}
              </Link>
            );
          })}
          <Link href="/setup" className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-dashed border-white/25 px-3 text-sm text-mint/85 hover:border-white/50 hover:text-white">
            <Plus className="h-4 w-4" aria-hidden />
            {L("New farm profile", "Tạo hồ sơ trang trại")}
          </Link>
        </nav>
        <div className="space-y-3 border-t border-white/10 px-4 py-4">
          <DataModePill dark />
          <LanguageSwitcher dark />
          <p className="text-[10px] leading-snug text-mint/60">
            {L("NASA Space Apps · Climate-resilient crop rotation prototype", "NASA Space Apps · Nguyên mẫu luân canh thích ứng khí hậu")}
          </p>
        </div>
      </aside>

      {/* Top bar (mobile + tablet) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 bg-forest-deep px-4 text-white lg:hidden no-print">
        <Logo light />
        <LanguageSwitcher dark />
      </header>

      <main id="main" className="mx-auto max-w-[1440px] px-4 pb-28 pt-5 md:px-6 lg:px-8 lg:pb-12 lg:pt-7 print:p-0">
        {hydrated ? (
          children
        ) : (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-28 rounded-3xl" />
            <Skeleton className="h-20" />
            <Skeleton className="h-72" />
          </div>
        )}
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label={L("Main", "Chính")}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden no-print"
      >
        {NAV.slice(0, 4).map((n) => {
          const active = pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cn("flex min-h-[62px] flex-col items-center justify-center gap-1 text-[10.5px] font-semibold", active ? TONES[n.tone].ink : "text-ink-2")}
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", active ? cn(TONES[n.tone].solid, "text-white") : "")}>
                <n.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="max-w-[72px] truncate">{L(n.shortEn, n.shortVi)}</span>
            </Link>
          );
        })}
        <button onClick={() => setMore(true)} className="flex min-h-[62px] flex-col items-center justify-center gap-1 text-[10.5px] font-semibold text-ink-2">
          <span className="flex h-8 w-8 items-center justify-center">
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </span>
          {L("More", "Thêm")}
        </button>
      </nav>
      <Sheet open={more} onOpenChange={setMore} title={L("More", "Thêm")}>
        <div className="grid gap-2 pb-4">
          {[...NAV.slice(4), { href: "/setup", icon: Plus, en: "New farm profile", vi: "Tạo hồ sơ trang trại", shortEn: "", shortVi: "", tone: "green" as Tone }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMore(false)} className="flex h-14 items-center gap-3 rounded-2xl border border-line px-4 text-sm font-semibold">
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-white", TONES[n.tone].solid)}>
                <n.icon className="h-5 w-5" aria-hidden />
              </span>
              {L(n.en, n.vi)}
            </Link>
          ))}
          <div className="pt-2">
            <DataModePill />
          </div>
        </div>
      </Sheet>
    </div>
  );
}
