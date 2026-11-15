"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Lightbulb, MapPin, Play, Sprout } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { createDemoFarm } from "@/lib/data/demo";
import { GUIDE_STEPS } from "@/lib/data/guide";
import { StepPhoto } from "@/components/landing/step-photo";
import { Button, Card, Select, buttonClass, cn } from "@/components/ui/primitives";

export function HowToUse() {
  const { L, lang } = useI18n();
  const router = useRouter();
  const farm = useApp(s => s.farm);
  const setFarm = useApp(s => s.setFarm);
  const [index, setIndex] = useState(0);
  const [read, setRead] = useState<number[]>([]);
  const panel = useRef<HTMLDivElement>(null);
  const current = GUIDE_STEPS[index];
  const screenshotExtension = lang === "en" && (current.id === "simulator" || current.id === "compare") ? "png" : "jpg";
  const select = (i: number) => {
    setIndex(i);
    if (window.matchMedia("(max-width: 1023px)").matches) requestAnimationFrame(() => {
      panel.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      panel.current?.focus({ preventScroll: true });
    });
  };
  const next = () => {
    setRead(previous => previous.includes(index) ? previous : [...previous,index]);
    select(index === GUIDE_STEPS.length - 1 ? 0 : index + 1);
  };
  const openFarm = () => {
    if (!farm) setFarm(createDemoFarm());
    router.push("/overview");
  };

  return <div className="space-y-6">
    <Card className="flex flex-col justify-between gap-5 rounded-3xl border-[#c9d7be] bg-[#f0f6e9] p-5 md:flex-row md:items-center md:p-6">
      <div className="flex items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-white"><Sprout className="h-6 w-6" aria-hidden /></span><div><h2 className="text-xl font-bold text-forest">{L("New here? Try it with a demo field.", "Mới dùng? Thử với ruộng mẫu trước." )}</h2><p className="mt-1 text-base leading-relaxed text-ink">{farm ? L("Your field is already set up. The guide stays here whenever you need it.", "Ruộng của bạn đã được thiết lập. Có thể trở lại hướng dẫn bất cứ lúc nào.") : L("No account needed. Explore first, then set up your own field.", "Không cần tài khoản. Khám phá trước, rồi thiết lập ruộng của bạn.")}</p></div></div>
      <Button onClick={openFarm} className="h-auto min-h-13 shrink-0 rounded-xl px-5 py-3 text-base"><Play className="h-5 w-5" aria-hidden />{farm ? L("Continue to My Farm", "Tiếp tục với ruộng của tôi") : L("Try the demo farm", "Thử ruộng mẫu")}</Button>
    </Card>

    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-sm font-bold uppercase tracking-[.12em] text-lime-ink">{L("Learn by doing", "Làm theo từng bước")}</p><h2 className="text-2xl font-bold text-forest md:text-[28px]">{L("From your field to a season plan", "Từ thửa ruộng đến kế hoạch mùa vụ")}</h2></div><p className="text-base font-semibold text-ink" aria-live="polite">{L(`${read.length} of 5 steps read`, `Đã xem ${read.length}/5 bước`)}</p></div>

    <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
      <nav aria-label={L("Guide steps", "Các bước hướng dẫn")} className="hidden space-y-2 lg:block">
        {GUIDE_STEPS.map((s,i) => <button key={s.id} onClick={() => select(i)} aria-pressed={index === i} className={cn("flex min-h-23 w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors", index === i ? "border-forest bg-forest text-white shadow-md" : "border-[#cbd5cd] bg-white text-ink hover:border-forest hover:bg-[#f0f6e9]")}>
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold", index === i ? "bg-lime text-forest" : "bg-[#edf3e5] text-forest")}>{read.includes(i) ? <Check className="h-5 w-5" aria-label={L("Read", "Đã xem")} /> : i+1}</span><span><span className="block text-base font-bold">{s.title[lang]}</span><span className={cn("mt-1 block text-sm", index === i ? "text-white/85" : "text-ink-2")}>{s.short[lang]}</span></span>
        </button>)}
      </nav>
      <label className="block text-base font-bold text-forest lg:hidden">{L("Choose a step", "Chọn bước muốn xem")}<Select value={index} onChange={e => select(Number(e.target.value))} className="mt-2 h-14 border-[#9eafa3] text-base">{GUIDE_STEPS.map((s,i) => <option key={s.id} value={i}>{i+1}. {s.title[lang]}</option>)}</Select></label>

      <Card className="min-w-0 overflow-hidden rounded-3xl border-[#cbd5cd]">
        <div ref={panel} tabIndex={-1} className="scroll-mt-24 outline-none">
          <div className="border-b border-[#cbd5cd] p-5 md:p-6"><p className="mb-2 flex items-center justify-between gap-3 text-sm font-bold uppercase tracking-[.12em] text-lime-ink">{L(`Step ${index+1} of 5`, `Bước ${index+1}/5`)}<span className="flex gap-1.5" aria-hidden>{GUIDE_STEPS.map((s,i) => <span key={s.id} className={cn("h-2 w-5 rounded-full", i === index ? "bg-forest" : read.includes(i) ? "bg-lime" : "bg-line")} />)}</span></p><h3 className="text-2xl font-bold text-forest md:text-[28px]">{current.title[lang]}</h3><p className="mt-2 text-base leading-relaxed text-ink">{current.intro[lang]}</p></div>
          <div className="grid items-start gap-6 p-5 xl:grid-cols-[.9fr_1.1fr] md:p-6">
            <div className="min-w-0 space-y-4">
              <figure><StepPhoto src={`/images/guide/${current.id}-${lang}.${screenshotExtension}`} alt={L(`Demo app screenshot: ${current.title.en}`, `Ảnh màn hình ứng dụng ở ruộng mẫu: ${current.title.vi}`)} title={current.title[lang]} imageClass="object-contain" contain zoomable previewClassName="aspect-[16/10] border border-[#cbd5cd] bg-[#e9eee5]" sizes="(min-width: 1280px) 420px, (min-width: 1024px) 70vw, 94vw" /><figcaption className="mt-2 text-sm leading-relaxed text-ink-2">{L("Demo screenshot · tap to enlarge. Dates and estimates can change.", "Ảnh ruộng mẫu · bấm để phóng to. Ngày và số liệu có thể thay đổi.")}</figcaption></figure>
              <div className="rounded-2xl border border-[#b9cfb0] bg-[#f1f7e9] p-4 text-base leading-relaxed text-forest"><p className="mb-2 flex items-center gap-2 font-bold"><Check className="h-5 w-5 shrink-0" aria-hidden />{L("What you should see", "Bạn sẽ thấy")}</p><p>{current.outcome[lang]}</p></div>
            </div>
            <ol className="space-y-5">{current.actions.map((a,i) => <li key={i} className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf0e4] text-base font-bold text-forest">{i+1}</span><div><h4 className="text-lg font-bold leading-snug text-ink">{a.title[lang]}</h4><p className="mt-1.5 text-base leading-relaxed text-ink">{a.body[lang]}</p></div></li>)}</ol>
          </div>
          <div className="border-t border-[#cbd5cd] px-5 py-4 md:px-6"><details className="group rounded-2xl bg-[#faf4e8] px-4 text-base leading-relaxed text-[#65430e]"><summary className="flex min-h-13 cursor-pointer list-none items-center gap-2 py-3 font-bold"><Lightbulb className="h-5 w-5 shrink-0" aria-hidden />{L("One thing to remember", "Một điều cần nhớ")}<span className="ml-auto group-open:hidden" aria-hidden>+</span><span className="ml-auto hidden group-open:block" aria-hidden>−</span></summary><p className="border-t border-[#e0d0af] pb-4 pt-3">{current.tip[lang]}</p></details></div>
          <div className="flex flex-col gap-3 border-t border-[#cbd5cd] p-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between md:px-6">
            <Link href={current.href} className={buttonClass("primary","lg","h-auto min-h-13 rounded-xl px-4 py-3 text-base")}><MapPin className="h-5 w-5 shrink-0" aria-hidden />{current.link[lang]}<ArrowRight className="h-5 w-5 shrink-0" aria-hidden /></Link>
            <div className="flex gap-2"><Button variant="outline" disabled={index === 0} onClick={() => select(index-1)} aria-label={L("Previous guide step", "Bước hướng dẫn trước")} className="h-13 w-13 shrink-0 rounded-xl border-[#9eafa3] px-0"><ArrowLeft className="h-5 w-5" aria-hidden /></Button><Button variant="dark" onClick={next} className="h-auto min-h-13 flex-1 rounded-xl px-4 py-3 text-base">{index === 4 ? L("Finish & review", "Đã xem xong") : L("Got it, next step", "Đã hiểu, bước tiếp")}<ArrowRight className="h-5 w-5 shrink-0" aria-hidden /></Button></div>
          </div>
        </div>
      </Card>
    </div>
    {read.length === GUIDE_STEPS.length && <Card className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-[#b9cfb0] bg-[#f1f7e9] p-5"><p className="flex items-center gap-2 text-base font-bold text-forest"><Check className="h-6 w-6 shrink-0" aria-hidden />{L("You've read all five steps. You can revisit any step whenever you need it.", "Bạn đã xem đủ 5 bước. Có thể mở lại bất kỳ bước nào khi cần.")}</p><Link href="/planner" className={buttonClass("outline","lg","rounded-xl text-base")}>{L("Go to the season plan","Mở kế hoạch mùa vụ")}<ArrowRight className="h-5 w-5" aria-hidden /></Link></Card>}
    <p className="flex items-start gap-2 text-base leading-relaxed text-ink"><CircleHelp className="mt-1 h-5 w-5 shrink-0 text-forest" aria-hidden />{L("Stuck on a word? Open Words explained above, or tap a dotted word elsewhere in the app.", "Gặp từ chưa rõ? Mở mục Thuật ngữ phía trên, hoặc bấm vào từ có gạch chấm trong ứng dụng.")}</p>
  </div>;
}
