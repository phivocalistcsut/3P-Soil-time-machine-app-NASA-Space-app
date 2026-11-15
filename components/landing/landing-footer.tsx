"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUp, CalendarDays, Check, MapPin, TrendingUp } from "lucide-react";
import { Logo } from "@/components/common";
import { buttonClass } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n";

export function LandingFooter({ onDemo }: { onDemo: () => void }) {
  const { L } = useI18n();
  const shortcuts = [
    { icon:MapPin,href:"/setup",title:L("Find your field","Chọn ruộng của bạn"),body:L("Start with its location and crops.","Bắt đầu từ vị trí và cây đang trồng.") },
    { icon:TrendingUp,href:"/simulator",title:L("Rehearse a change","Thử một cách trồng"),body:L("Explore water, soil and seasonal risks.","Xem nước tưới, đất và rủi ro mùa vụ.") },
    { icon:CalendarDays,href:"/planner",title:L("Make a season plan","Lên kế hoạch mùa vụ"),body:L("Keep the dates and notes together.","Lưu lịch mùa vụ và những điều cần nhớ.") },
  ];
  return <>
    <section className="relative isolate overflow-hidden bg-space-950 text-center text-white" aria-labelledby="landing-closing-title">
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image src="/images/orbital-sunrise.webp" alt="" fill sizes="100vw" className="object-cover object-[50%_48%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-space-950/40 via-space-950/55 to-space-950" />
        <div className="absolute inset-0 bg-stars opacity-40" />
      </div>
      <div className="landing-shell py-16 md:py-24">
        <p className="mb-5 text-sm font-bold uppercase tracking-[.18em] text-lime-bright">{L("Next steps","Bước tiếp theo")}</p>
        <h2 id="landing-closing-title" className="title-caps mx-auto max-w-4xl scroll-mt-10 text-3xl font-extrabold leading-tight text-white [text-wrap:balance] [text-shadow:0_2px_24px_#05090f80] md:text-5xl">
          {L("Your next harvest starts with today's decisions.","Vụ mùa tới bắt đầu từ quyết định hôm nay.")}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/90">{L("Your farm profile stays in this browser. Data providers receive the location or place name needed for your lookup.","Hồ sơ ruộng được lưu trên trình duyệt này. Dịch vụ dữ liệu nhận vị trí hoặc tên địa điểm khi cần tra cứu.")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/setup" className={buttonClass("primary","lg","h-auto min-h-14 py-3 text-base")}>{L("Start Exploring","Bắt đầu với ruộng của tôi")}<ArrowRight className="h-5 w-5" aria-hidden /></Link>
          <button onClick={onDemo} className={buttonClass("glass","lg","h-auto min-h-14 py-3 text-base")}>{L("Open demo farm","Mở trang trại mẫu")}</button>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/90">{[L("No account needed","Không cần tài khoản"),L("Explore the sources","Xem rõ nguồn dữ liệu"),L("Save on your device","Lưu trên thiết bị")].map(t=><span key={t} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-lime-bright" aria-hidden />{t}</span>)}</div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-3 text-left md:grid-cols-3">{shortcuts.map((s,i)=><Link key={s.href} href={s.href} className="group flex items-start gap-3 rounded-2xl border border-white/25 bg-space-950/45 p-4 backdrop-blur-sm transition-colors hover:border-lime-bright/70 hover:bg-space-950/75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-bright md:p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-lime-bright/45 text-lime-bright"><s.icon className="h-5 w-5" aria-hidden /></span><span><span className="text-sm font-bold text-lime-bright">0{i+1}</span><span className="mt-1 block text-lg font-bold text-white">{s.title}</span><span className="mt-2 hidden text-base leading-relaxed text-white/85 md:block">{s.body}</span></span><ArrowRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-white/75 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
        </Link>)}</div>
      </div>
    </section>
    <footer className="bg-space-950 text-base text-white/80" aria-label={L("Footer","Chân trang")}>
      <div className="landing-shell grid gap-8 border-t border-white/15 py-10 md:grid-cols-[1.3fr_1fr_1fr] md:gap-12">
        <div><Logo light /><p className="mt-4 max-w-sm leading-relaxed">Soil Time Machine · NASA Space Apps Challenge {L("prototype","nguyên mẫu")}</p><p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">{L("A five-year view to support conversations about your next season.","Góc nhìn 5 năm để cùng cân nhắc cho những mùa vụ tới.")}</p></div>
        <nav aria-label={L("Help and guidance","Hỗ trợ và hướng dẫn")}><h3 className="mb-3 text-lg font-bold text-white">{L("Explore the app","Khám phá ứng dụng")}</h3><ul className="space-y-1">{[{href:"/learn#start",label:L("How to use the app","Cách dùng ứng dụng")},{href:"/learn#glossary",label:L("Words explained","Giải thích thuật ngữ")},{href:"/learn#experts",label:L("Questions for an adviser","Câu hỏi cho khuyến nông")}].map(l=><li key={l.href}><Link href={l.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:text-white hover:underline">{l.label}</Link></li>)}</ul></nav>
        <nav aria-label={L("Data and image sources","Nguồn dữ liệu và hình ảnh")}><h3 className="mb-3 text-lg font-bold text-white">{L("Behind the numbers","Hiểu những con số")}</h3><ul className="space-y-1"><li><Link href="/methodology" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-white hover:underline">{L("Data & methods","Dữ liệu và cách tính")}</Link></li><li><Link href="/learn#satellite" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-white hover:underline">{L("Space & field measurements","Vệ tinh và đo tại ruộng")}</Link></li><li><a href="/images/CREDITS.md" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-white hover:underline">{L("Image credits","Nguồn và bản quyền ảnh")}</a></li></ul></nav>
      </div>
      <div className="landing-shell flex flex-col items-start justify-between gap-5 border-t border-white/15 py-6 md:flex-row md:items-center"><p className="max-w-4xl text-sm leading-relaxed text-white/65">{L("Not affiliated with or endorsed by NASA. Data: NASA POWER, NASA GIBS, EOX Sentinel-2 cloudless, ISRIC SoilGrids, © OpenStreetMap. Background photos: NASA / ISS crew.","Sản phẩm độc lập, không do NASA bảo trợ. Dữ liệu: NASA POWER, NASA GIBS, EOX Sentinel-2 cloudless, ISRIC SoilGrids, © OpenStreetMap. Ảnh nền: NASA / phi hành đoàn ISS.")}</p><a href="#top" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border border-white/25 px-4 text-base font-semibold text-white hover:bg-white/10">{L("Back to top","Về đầu trang")}<ArrowUp className="h-4 w-4" aria-hidden /></a></div>
    </footer>
  </>;
}
