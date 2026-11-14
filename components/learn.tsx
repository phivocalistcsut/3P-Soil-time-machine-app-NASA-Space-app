"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookA,
  CalendarRange,
  GraduationCap,
  HandHelping,
  Leaf,
  MapPin,
  Satellite,
  Scale,
  Search,
  Sprout,
  TrendingUp,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GLOSSARY, GLOSSARY_GROUPS, type GlossaryGroup } from "@/lib/data/glossary";
import { CROPS } from "@/lib/data/crops";
import { CropIcon } from "@/components/common";
import { Card, Input, buttonClass, cn } from "@/components/ui/primitives";
import { PageHeader, SectionPanel, SectionTabs, Strip, TONES, useSection, type Tone } from "@/components/ui/sections";

const GROUP_TONE: Record<GlossaryGroup, Tone> = { water: "blue", soil: "earth", satellite: "teal", crop: "leaf", risk: "rose", model: "violet" };

export function Learn() {
  const { L, lang } = useI18n();
  const [section, setSection] = useSection("learn", ["start", "glossary", "satellite", "crops", "experts"], "start");
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<GlossaryGroup | "all">("all");

  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();
  const entries = useMemo(
    () =>
      GLOSSARY.filter((g) => (group === "all" || g.group === group) && (!q.trim() || norm(`${g.term.en} ${g.term.vi} ${g.short.en} ${g.short.vi}`).includes(norm(q)))),
    [q, group],
  );

  const tabs = [
    { id: "start", icon: GraduationCap, label: L("How to use the app", "Cách dùng app"), hint: L("5 steps, 5 minutes", "5 bước, 5 phút"), tone: "violet" as const },
    { id: "glossary", icon: BookA, label: L("Glossary", "Thuật ngữ"), hint: L(`${GLOSSARY.length} words explained`, `${GLOSSARY.length} từ được giải thích`), tone: "blue" as const },
    { id: "satellite", icon: Satellite, label: L("Satellite vs field", "Vệ tinh và đo tại ruộng"), hint: L("What each can and can't see", "Mỗi cách thấy được gì"), tone: "teal" as const },
    { id: "crops", icon: Sprout, label: L("What each crop does", "Vai trò của cây trồng"), hint: L("Beans, cover, deep roots, dry-season", "Họ đậu, che phủ, rễ sâu, chịu hạn"), tone: "leaf" as const },
    { id: "experts", icon: HandHelping, label: L("When to ask an expert", "Khi nào hỏi chuyên gia"), hint: L("Decisions the app can't make", "Điều app không quyết thay"), tone: "amber" as const },
  ];

  const steps = [
    { icon: MapPin, href: "/overview", tone: "green" as Tone, t: L("Look at your field", "Xem ruộng của bạn"), d: L("My Farm: map, rain, heat, soil and how green the field looks from space.", "Ruộng của tôi: bản đồ, mưa, nắng nóng, đất và độ xanh của ruộng nhìn từ vệ tinh.") },
    { icon: TrendingUp, href: "/simulator", tone: "blue" as Tone, t: L("Try a planting plan", "Thử một cách trồng"), d: L("5-Year Simulator: pick a plan, a year and the weather; read the 4 big numbers.", "Mô phỏng 5 năm: chọn cách trồng, năm và thời tiết; xem 4 con số chính.") },
    { icon: CalendarRange, href: "/simulator#calendar", tone: "amber" as Tone, t: L("Check the risky months", "Xem các tháng rủi ro"), d: L("The 12-month calendar shows bare months and when crops are most exposed.", "Lịch 12 tháng cho thấy tháng đất trống và lúc cây dễ bị ảnh hưởng nhất.") },
    { icon: Scale, href: "/compare", tone: "earth" as Tone, t: L("Compare and set priorities", "So sánh và chọn ưu tiên"), d: L("Compare Plans: move the sliders for what matters to you; the ranking follows.", "So sánh cách trồng: kéo thanh trượt theo điều bạn coi trọng; thứ hạng thay đổi theo.") },
    { icon: Users, href: "/simulator#evidence", tone: "violet" as Tone, t: L("Ask before you plant", "Hỏi trước khi gieo"), d: L("Copy the questions for your extension officer, then make a season plan.", "Sao chép câu hỏi gửi cán bộ khuyến nông, rồi lập kế hoạch mùa vụ.") },
  ];

  const sources = [
    { name: "NASA POWER", what: L("Rain, temperature, humidity, wind, sun, soil wetness", "Mưa, nhiệt độ, độ ẩm, gió, nắng, độ ẩm đất"), size: "≈ 55 km", freq: L("daily / monthly since 1981", "theo ngày / tháng từ 1981"), use: L("Main input of the model", "Đầu vào chính của mô hình") },
    { name: "GPM IMERG", what: L("Rainfall from space", "Lượng mưa từ vệ tinh"), size: "≈ 11 km", freq: L("every 30 min, daily", "30 phút, hằng ngày"), use: L("Map layer", "Lớp bản đồ") },
    { name: "SMAP L4", what: L("Surface soil moisture", "Độ ẩm lớp đất mặt"), size: "9 km", freq: L("daily", "hằng ngày"), use: L("Map layer", "Lớp bản đồ") },
    { name: "MODIS NDVI", what: L("Greenness of plants", "Độ xanh của cây"), size: "250 m", freq: L("every 16 days", "16 ngày một lần"), use: L("Green / bare rhythm of the field", "Nhịp xanh – trống của ruộng") },
    { name: "Sentinel-2", what: L("True-colour picture", "Ảnh màu thật"), size: "10 m", freq: L("one cloud-free mosaic (2023)", "một ảnh ghép không mây (2023)"), use: L("Background map", "Bản đồ nền") },
    { name: L("Rain gauge, soil test", "Thùng đo mưa, xét nghiệm đất"), what: L("Your field exactly", "Đúng thửa ruộng của bạn"), size: L("one spot", "một điểm"), freq: L("when you measure", "khi bạn đo"), use: L("Enter in farm setup to replace estimates", "Nhập khi thiết lập để thay giá trị ước tính") },
  ];

  const roles = [
    { id: "n-fixing", tone: "leaf" as Tone, t: L("Nitrogen-fixing (legumes)", "Cố định đạm (cây họ đậu)"), d: L("Bacteria in root nodules turn air into fertiliser; the next rice needs less urea.", "Vi khuẩn ở nốt rễ biến đạm trong không khí thành phân; vụ lúa sau bớt phân urê."), crops: CROPS.filter((c) => c.agronomicProperties.nFixing && c.category === "legume") },
    { id: "cover-crop", tone: "green" as Tone, t: L("Cover / green manure", "Che phủ / phân xanh"), d: L("Keeps soil covered in months that would be bare, then ploughed in as organic matter.", "Che đất trong những tháng lẽ ra để trống, rồi cày vùi làm chất hữu cơ."), crops: CROPS.filter((c) => c.category === "green_manure") },
    { id: "deep-root", tone: "earth" as Tone, t: L("Deep-rooting", "Rễ sâu"), d: L("Roots below the plough layer help water soak in and bring nutrients up.", "Rễ xuống dưới lớp đất cày giúp nước thấm và đưa dinh dưỡng lên."), crops: CROPS.filter((c) => c.agronomicProperties.rootDepthM >= 0.9 && c.id !== "fallow") },
    { id: "drought-tolerant", tone: "amber" as Tone, t: L("Drought-tolerant", "Chịu hạn"), d: L("Finish with little water in the dry season — but dislike waterlogging.", "Cho thu hoạch với ít nước mùa khô — nhưng kỵ ngập úng."), crops: CROPS.filter((c) => c.waterRequirement === "low" && c.category !== "green_manure") },
  ];

  const human = [
    L("Choosing varieties, seed sources and exact sowing dates for your area.", "Chọn giống, nguồn giống và ngày gieo cụ thể cho địa phương."),
    L("Judging whether your field drains fast enough for upland crops.", "Đánh giá ruộng có thoát nước đủ nhanh cho cây màu hay không."),
    L("Liming, raised beds or other fixes for acid or salty soil.", "Bón vôi, lên liếp hay cách khác cho đất chua hoặc nhiễm mặn."),
    L("Markets, prices and who will buy a new crop.", "Thị trường, giá cả và ai sẽ mua cây trồng mới."),
    L("Labour, machines and money needed to change crops.", "Công lao động, máy móc và vốn cần để đổi cây."),
    L("Pest and disease outbreaks this season.", "Dịch sâu bệnh trong vụ này."),
    L("Water schedules from the pump station or cooperative.", "Lịch cấp nước của trạm bơm hoặc hợp tác xã."),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        image="night-coast"
        icon={GraduationCap}
        eyebrow={L("Guide & glossary", "Hướng dẫn & Thuật ngữ")}
        title={L("Understand the words, trust the numbers", "Hiểu từ ngữ, tin con số")}
        desc={L("Short explanations in plain language. Tap any dotted word in the app to see its meaning.", "Giải thích ngắn, lời dễ hiểu. Bấm vào chữ có gạch chấm ở bất kỳ đâu trong app để xem nghĩa.")}
      />
      <SectionTabs tabs={tabs} value={section} onChange={setSection} label={L("Guide topics", "Chủ đề hướng dẫn")} />

      <SectionPanel id="start" active={section === "start"}>
        <Strip tone="violet" icon={GraduationCap} title={L("Five steps to use the app", "Năm bước dùng app")} desc={L("Tap a step to go there", "Bấm vào bước để đi tới")} />
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.href}>
              <Link href={s.href} className="flex h-full flex-col rounded-2xl bg-white p-4 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] hover:ring-lime">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", TONES[s.tone].soft, TONES[s.tone].ink)}>
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-3">{L(`Step ${i + 1}`, `Bước ${i + 1}`)}</span>
                <span className="text-sm font-bold">{s.t}</span>
                <span className="mt-1 flex-1 text-xs leading-relaxed text-ink-2">{s.d}</span>
                <span className={cn("mt-2 inline-flex items-center gap-1 text-xs font-semibold", TONES[s.tone].ink)}>
                  {L("Open", "Mở")} <ArrowRight className="h-3 w-3" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </SectionPanel>

      <SectionPanel id="glossary" active={section === "glossary"}>
        <Strip tone="blue" icon={BookA} title={L("Glossary", "Thuật ngữ")} desc={L("Search in English or Vietnamese, with or without accents", "Tìm bằng tiếng Việt hoặc tiếng Anh, có dấu hay không dấu đều được")} />
        <Card className="mb-3 flex flex-col gap-3 p-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">{L("Search", "Tìm")}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L("e.g. NDVI, evaporation, salinity", "VD: NDVI, bốc hơi, xâm nhập mặn")} className="pl-9" />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...Object.keys(GLOSSARY_GROUPS)] as (GlossaryGroup | "all")[]).map((g) => (
              <button
                key={g}
                aria-pressed={group === g}
                onClick={() => setGroup(g)}
                className={cn(
                  "h-9 rounded-full px-3 text-xs font-semibold",
                  group === g ? "bg-space-900 text-white" : "bg-sand-2 text-ink-2 hover:text-ink",
                )}
              >
                {g === "all" ? L("All", "Tất cả") : GLOSSARY_GROUPS[g][lang]}
              </button>
            ))}
          </div>
        </Card>
        <div className="grid gap-3 md:grid-cols-2">
          {entries.length === 0 && <p className="text-sm text-ink-2">{L("No word matches.", "Không có từ phù hợp.")}</p>}
          {entries.map((g) => (
            <Card key={g.id} id={`term-${g.id}`} className="overflow-hidden">
              <div className={cn("h-1.5", TONES[GROUP_TONE[g.group]].solid)} aria-hidden />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-bold">{g.term[lang]}</h3>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", TONES[GROUP_TONE[g.group]].soft, TONES[GROUP_TONE[g.group]].ink)}>{GLOSSARY_GROUPS[g.group][lang]}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-ink">{g.short[lang]}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{g.long[lang]}</p>
              </div>
            </Card>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel id="satellite" active={section === "satellite"}>
        <Strip tone="teal" icon={Satellite} title={L("Satellites see the area; a field test sees your plot", "Vệ tinh nhìn cả vùng; đo tại ruộng nhìn đúng thửa của bạn")} desc={L("Combining both gives the most reliable picture", "Kết hợp cả hai cho bức tranh đáng tin nhất")} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="bg-sand text-left text-xs text-ink-2">
                  <th className="px-3 py-2.5">{L("Source", "Nguồn")}</th>
                  <th className="px-3 py-2.5">{L("Measures", "Đo gì")}</th>
                  <th className="px-3 py-2.5">{L("One value covers", "Một giá trị cho")}</th>
                  <th className="px-3 py-2.5">{L("How often", "Bao lâu một lần")}</th>
                  <th className="px-3 py-2.5">{L("Used in the app for", "Dùng trong app để")}</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.name} className="border-t border-line">
                    <td className="px-3 py-2.5 font-semibold">{s.name}</td>
                    <td className="px-3 py-2.5 text-ink-2">{s.what}</td>
                    <td className="px-3 py-2.5 font-semibold tabular text-[#1C6159]">{s.size}</td>
                    <td className="px-3 py-2.5 text-ink-2">{s.freq}</td>
                    <td className="px-3 py-2.5 text-ink-2">{s.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="space-y-3">
            <Card className="p-4">
              <h3 className="text-sm font-bold">{L("A 2.5 ha field is tiny for most satellites", "Ruộng 2,5 ha rất nhỏ so với hầu hết vệ tinh")}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">
                {L(
                  "One NASA POWER value covers about 300,000 ha. One MODIS greenness value covers 6 ha — your field plus its neighbours. That is why the app labels these as area-wide observations, not measurements of your plot.",
                  "Một giá trị NASA POWER phủ khoảng 300.000 ha. Một giá trị độ xanh MODIS phủ 6 ha — gồm ruộng của bạn và ruộng bên cạnh. Vì vậy app ghi đây là quan trắc theo vùng, không phải số đo thửa ruộng.",
                )}
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-bold">{L("How to make the results more accurate", "Làm sao để kết quả chính xác hơn")}</h3>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-ink-2">
                <li>• {L("Do a soil test and enter pH and organic carbon in farm setup.", "Xét nghiệm đất và nhập pH, carbon hữu cơ khi thiết lập.")}</li>
                <li>• {L("Draw your field boundary so the map and area are right.", "Vẽ ranh giới ruộng để bản đồ và diện tích đúng.")}</li>
                <li>• {L("Enter your own yields, prices and costs in Settings.", "Nhập năng suất, giá, chi phí của bạn trong Cài đặt.")}</li>
                <li>• {L("Compare the rain and heat with what you remember from past seasons.", "So mưa và nắng nóng với những gì bạn nhớ về các vụ trước.")}</li>
              </ul>
            </Card>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel id="crops" active={section === "crops"}>
        <Strip tone="leaf" icon={Leaf} title={L("What each type of crop does for the soil", "Mỗi loại cây làm gì cho đất")} desc={L("Examples from the app's crop list", "Ví dụ từ danh mục cây trong app")} />
        <div className="grid gap-3 md:grid-cols-2">
          {roles.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <div className={cn("flex items-center gap-2 px-4 py-3", TONES[r.tone].soft, TONES[r.tone].ink)}>
                <Sprout className="h-4 w-4" aria-hidden />
                <h3 className="text-sm font-bold">{r.t}</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-ink">{r.d}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.crops.map((c) => (
                    <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-sand px-2.5 py-1 text-xs font-semibold">
                      <CropIcon cropId={c.id} size={20} className="rounded-full" />
                      {c.name[lang]}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel id="experts" active={section === "experts"}>
        <Strip tone="amber" icon={HandHelping} title={L("The app supports your judgment — it does not replace it", "App hỗ trợ — không thay thế — phán đoán của bạn")} desc={L("Decisions where local knowledge matters most", "Những quyết định cần kinh nghiệm địa phương nhất")} />
        <Card className="p-5">
          <ul className="grid gap-2 md:grid-cols-2">
            {human.map((h, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-amber-soft/70 px-3 py-2.5 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B7791F] text-xs font-bold text-white">{i + 1}</span>
                {h}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#EFE7F6] px-4 py-3">
            <p className="text-sm">{L("Each plan comes with a ready list of questions for your extension officer.", "Mỗi cách trồng có sẵn danh sách câu hỏi cho cán bộ khuyến nông.")}</p>
            <Link href="/simulator#evidence" className={buttonClass("primary", "md")}>
              {L("See the questions", "Xem câu hỏi")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Card>
      </SectionPanel>
    </div>
  );
}
