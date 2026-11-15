"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookA, ChevronDown, Clipboard, Droplets, GraduationCap, HandHelping, Leaf, MapPin, Mountain, Satellite, Search, Sprout, X } from "lucide-react";
import { CropIcon } from "@/components/common";
import { StepPhoto } from "@/components/landing/step-photo";
import { Button, Card, Input, Select, buttonClass, cn } from "@/components/ui/primitives";
import { PageHeader, SectionPanel, SectionTabs, useSection } from "@/components/ui/sections";
import { CROPS } from "@/lib/data/crops";
import { GLOSSARY, GLOSSARY_GROUPS, type GlossaryGroup } from "@/lib/data/glossary";
import { GUIDE_SOURCES } from "@/lib/data/guide";
import { useI18n } from "@/lib/i18n";
import { HowToUse } from "./how-to-use";

const POPULAR = ["water-balance", "som", "ph", "ndvi", "rotation", "n-fixing", "range", "scenario"];
const GROUP_COLOR: Record<GlossaryGroup,string> = { water:"#25608c", soil:"#76512c", satellite:"#216358", crop:"#3d6814", risk:"#92352a", model:"#614283" };
const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g,"d");

export function Guide() {
  const { L, lang } = useI18n();
  const [section, setSection] = useSection("learn",["start","glossary","satellite","crops","experts"],"start");
  const [query,setQuery] = useState("");
  const [group,setGroup] = useState<GlossaryGroup|"all">("all");
  const [showAll,setShowAll] = useState(false);
  const [sourceIndex,setSourceIndex] = useState(0);
  const [cropRole,setCropRole] = useState(0);
  const [questions,setQuestions] = useState([0,1,2,3]);
  const [copyStatus,setCopyStatus] = useState("");
  const entries = useMemo(() => GLOSSARY.filter(g => (group === "all" || g.group === group) && (!query.trim() || normalize(`${g.term.en} ${g.term.vi} ${g.short.en} ${g.short.vi}`).includes(normalize(query.trim())))),[group,query]);
  const limited = !showAll && group === "all" && !query.trim();
  const visible = limited ? entries.filter(g => POPULAR.includes(g.id)) : entries;
  const source = GUIDE_SOURCES[sourceIndex];
  const tabs = [
    { id:"start",icon:GraduationCap,label:L("How to use","Cách dùng"),tone:"leaf" as const },
    { id:"glossary",icon:BookA,label:L("Words explained","Thuật ngữ"),tone:"blue" as const },
    { id:"satellite",icon:Satellite,label:L("Space & field","Vệ tinh & ruộng"),tone:"teal" as const },
    { id:"crops",icon:Sprout,label:L("Crop roles","Vai trò cây trồng"),tone:"leaf" as const },
    { id:"experts",icon:HandHelping,label:L("Ask an adviser","Hỏi khuyến nông"),tone:"earth" as const },
  ];
  const roles = [
    { id:"n-fixing",icon:Sprout,title:L("Legumes","Cây họ đậu"),label:L("Nitrogen for the next crop","Đạm cho vụ sau"),body:L("Root bacteria help legumes fix nitrogen. Some can remain for the following crop, depending on residues and field management.","Vi khuẩn ở rễ giúp cây họ đậu cố định đạm. Một phần có thể để lại cho vụ sau, tùy tàn dư và cách quản lý ruộng."),note:L("The app's nitrogen credit is an assumption. Confirm fertilizer needs locally.","Phần đạm để lại trong ứng dụng là giả định. Cần xác nhận nhu cầu phân bón tại địa phương."),crops:CROPS.filter(c=>c.category==="legume") },
    { id:"cover-crop",icon:Leaf,title:L("Green manure","Cây phân xanh"),label:L("Keep the ground covered","Che phủ và bổ sung hữu cơ"),body:L("A green-manure crop covers bare ground and is incorporated into the soil. It is grown for soil management rather than a cash harvest.","Cây phân xanh che phần đất trống và được vùi vào đất. Mục đích chính là chăm sóc đất, thay vì thu hoạch để bán."),note:L("Plan the incorporation date and the gap before the next crop with your adviser.","Trao đổi thời điểm vùi cây và khoảng nghỉ trước vụ sau với cán bộ khuyến nông."),crops:CROPS.filter(c=>c.category==="green_manure") },
    { id:"deep-root",icon:Mountain,title:L("Deeper roots","Cây rễ sâu"),label:L("Explore a different soil layer","Khai thác tầng đất khác"),body:L("Different root systems use different soil layers. Rotating crop families can also interrupt some pest cycles.","Bộ rễ khác nhau sử dụng các tầng đất khác nhau. Đổi họ cây trong luân canh cũng có thể góp phần cắt vòng sâu bệnh."),note:L("Root depth alone does not prove that a crop will suit your soil or drainage.","Rễ sâu chưa đủ để kết luận cây phù hợp với đất và khả năng thoát nước của ruộng."),crops:CROPS.filter(c=>c.agronomicProperties.rootDepthM>=.9&&c.id!=="fallow") },
    { id:"drought-tolerant",icon:Droplets,title:L("Lower water needs","Cây cần ít nước"),label:L("An option for drier seasons","Một lựa chọn cho mùa khô"),body:L("Some short-season crops need less irrigation than flooded rice. They still need suitable water and drainage conditions.","Một số cây ngắn ngày cần ít nước tưới hơn lúa ngập. Vẫn phải kiểm tra nguồn nước và khả năng thoát nước."),note:L("Lower irrigation does not mean a crop tolerates salty water or prolonged flooding.","Ít nước tưới không có nghĩa là cây chịu được nước mặn hoặc ngập lâu."),crops:CROPS.filter(c=>c.waterRequirement==="low"&&c.category!=="green_manure"&&c.id!=="fallow") },
  ];
  const role = roles[cropRole];
  const questionTopics = [
    { title:L("Seed & planting dates","Giống và lịch gieo"),items:[L("Which variety and seed source suit this area?","Giống và nguồn giống nào phù hợp ở đây?"),L("When should I sow and harvest this rotation?","Nên gieo và thu hoạch vào thời điểm nào?")] },
    { title:L("Water & drainage","Nước và thoát nước"),items:[L("Will irrigation water be available in the dry season?","Mùa khô có đủ nước tưới không?"),L("Does this field drain well enough for the replacement crop?","Ruộng có thoát nước đủ nhanh cho cây thay thế không?")] },
    { title:L("Soil & fertilizer","Đất và phân bón"),items:[L("Which soil measurements should we check first?","Cần xét nghiệm những chỉ tiêu đất nào trước?"),L("How should fertilizer rates be adjusted for this field?","Lượng phân bón cần điều chỉnh ra sao cho ruộng này?")] },
    { title:L("Markets & preparation","Đầu ra và chuẩn bị"),items:[L("Who can buy the new crop and at what terms?","Ai có thể thu mua cây mới, với điều kiện nào?"),L("What labour, equipment and costs should I prepare for?","Cần chuẩn bị công, máy móc và chi phí gì?")] },
  ];
  const questionText = [L("Questions to discuss before planting","Câu hỏi trao đổi trước khi gieo"),...questions.flatMap(i=>["",questionTopics[i].title,...questionTopics[i].items.map(q=>`• ${q}`)])].join("\n");
  const copy = async () => {
    try { await navigator.clipboard.writeText(questionText); setCopyStatus(L("Questions copied. You can paste them into a message or notes.","Đã sao chép. Bạn có thể dán vào tin nhắn hoặc ghi chú.")); }
    catch { setCopyStatus(L("Open the question list below, select the text and copy it.","Mở danh sách câu hỏi phía dưới, chọn nội dung rồi sao chép.")); }
  };

  return <div className="space-y-6">
    <PageHeader image="mekong-delta" icon={GraduationCap} eyebrow={L("Your field companion","Cẩm nang mùa vụ")} title={L("One step at a time, from field to plan","Từng bước lên kế hoạch mùa vụ")} desc={L("Follow the pictures, try the steps and open an explanation whenever you need it.","Làm theo hình, thử từng bước. Gặp điều chưa rõ, mở phần giải thích ngay tại đây.")} />
    <div className="hidden md:block"><SectionTabs tabs={tabs} value={section} onChange={setSection} label={L("Guide topics","Chủ đề hướng dẫn")} size="lg" /></div>
    <label className="block text-base font-bold text-forest md:hidden">{L("What would you like to explore?","Bạn muốn tìm hiểu điều gì?")}<Select value={section} onChange={e=>setSection(e.target.value)} className="mt-2 h-14 border-[#9eafa3] text-base">{tabs.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</Select></label>

    <SectionPanel id="start" active={section==="start"} keepMounted><HowToUse /></SectionPanel>

    <SectionPanel id="glossary" active={section==="glossary"} keepMounted>
      <div className="space-y-5">
        <div><h2 className="text-2xl font-bold text-forest">{L("A useful word, simply explained","Hiểu nhanh một thuật ngữ")}</h2><p className="mt-2 text-base text-ink">{L("Start with the common words. Open a card for more detail.","Bắt đầu với những từ thường gặp. Bấm một thẻ để xem giải thích thêm.")}</p></div>
        <Card className="rounded-3xl border-[#cbd5cd] p-4 md:p-5">
          <div className="relative"><label htmlFor="guide-term-search" className="sr-only">{L("Search words","Tìm thuật ngữ")}</label><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-forest" aria-hidden /><Input id="guide-term-search" value={query} onChange={e=>setQuery(e.target.value)} className="h-14 border-[#9eafa3] pl-12 pr-14 text-base" placeholder={L("Try: water, NDVI, soil carbon…","Thử tìm: nước tưới, NDVI, carbon đất…")} />{query && <button onClick={()=>setQuery("")} aria-label={L("Clear search","Xóa từ tìm")} className="absolute right-1 top-1 flex h-12 w-12 items-center justify-center rounded-xl text-forest hover:bg-sand"><X className="h-5 w-5" aria-hidden /></button>}</div>
          <div className="mt-4 flex flex-wrap gap-2">{(["all",...Object.keys(GLOSSARY_GROUPS)] as (GlossaryGroup|"all")[]).map(g=><button key={g} onClick={()=>setGroup(g)} aria-pressed={group===g} className={cn("min-h-12 rounded-xl border px-4 py-2 text-base font-semibold",group===g?"border-forest bg-forest text-white":"border-[#cbd5cd] bg-white text-ink hover:bg-[#f0f6e9]")}>{g==="all"?L("All topics","Tất cả"):GLOSSARY_GROUPS[g][lang]}</button>)}</div>
        </Card>
        <p aria-live="polite" className="text-base font-semibold text-ink">{limited?L("8 words to start with","8 từ để bắt đầu"):L(`${visible.length} words found`,`${visible.length} từ phù hợp`)}</p>
        <div className="grid items-start gap-4 md:grid-cols-2">
          {visible.map(g=><details key={g.id} name="guide-glossary" id={`term-${g.id}`} className="group overflow-hidden rounded-2xl border border-[#cbd5cd] bg-white shadow-[var(--shadow-card)]"><summary className="cursor-pointer list-none p-5"><div className="flex items-start justify-between gap-3"><span className="text-lg font-bold leading-snug text-forest">{g.term[lang]}</span><ChevronDown className="mt-1 h-5 w-5 shrink-0 text-forest transition-transform group-open:rotate-180" aria-hidden /></div><span className="mt-2 inline-block text-sm font-semibold" style={{color:GROUP_COLOR[g.group]}}>{GLOSSARY_GROUPS[g.group][lang]}</span><p className="mt-3 text-base leading-relaxed text-ink">{g.short[lang]}</p></summary><p className="border-t border-[#cbd5cd] bg-[#f7f9f3] p-5 text-base leading-relaxed text-ink">{g.long[lang]}</p></details>)}
        </div>
        {visible.length===0 && <Card className="rounded-2xl p-6 text-center"><BookA className="mx-auto h-10 w-10 text-forest" aria-hidden /><p className="mt-3 text-lg font-bold">{L("No matching word yet","Chưa tìm thấy từ phù hợp")}</p><p className="mt-2 text-base">{L("Try a shorter word or a different topic. Accents are optional.","Thử từ ngắn hơn hoặc đổi nhóm. Có thể gõ không dấu.")}</p><Button variant="outline" onClick={()=>{setQuery("");setGroup("all");}} className="mt-4 h-12 text-base">{L("Reset search","Tìm lại")}</Button></Card>}
        {limited && <Button variant="outline" onClick={()=>setShowAll(true)} className="h-13 rounded-xl border-[#9eafa3] text-base">{L(`See all ${GLOSSARY.length} words`,`Xem tất cả ${GLOSSARY.length} thuật ngữ`)}<ArrowRight className="h-5 w-5" aria-hidden /></Button>}
      </div>
    </SectionPanel>

    <SectionPanel id="satellite" active={section==="satellite"} keepMounted>
      <div className="space-y-5">
        <div><h2 className="text-2xl font-bold text-forest">{L("Two views of the same field","Hai góc nhìn về một thửa ruộng")}</h2><p className="mt-2 text-base text-ink">{L("Use regional data for context, then check the details on the ground.","Dùng dữ liệu vùng để hiểu bối cảnh, rồi đối chiếu thực tế tại ruộng.")}</p></div>
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="overflow-hidden rounded-3xl border-[#cbd5cd]"><div className="relative h-52"><Image src="/images/mekong-delta.webp" alt={L("The Mekong Delta seen from the International Space Station","Đồng bằng Mekong nhìn từ Trạm Vũ trụ Quốc tế")} fill sizes="(min-width: 768px) 50vw, 94vw" className="object-cover" /><span className="absolute bottom-3 left-3 rounded-full bg-space-950/80 px-3 py-1.5 text-sm text-white">NASA / ISS</span></div><div className="p-5"><h3 className="flex items-center gap-2 text-xl font-bold text-forest"><Satellite className="h-6 w-6" aria-hidden />{L("From space: the wider area","Từ vệ tinh: nhìn cả vùng")}</h3><p className="mt-3 text-base leading-relaxed text-ink">{L("See weather and vegetation patterns across many fields. Each value has a date and a coverage area.","Xem thời tiết và nhịp xanh của cây trên nhiều ruộng. Mỗi giá trị có thời gian và phạm vi bao phủ riêng.")}</p></div></Card>
          <Card className="overflow-hidden rounded-3xl border-[#cbd5cd]"><div className="relative h-52"><Image src="/images/how-it-works/04-farm-decision.png" alt={L("A grower working close to crops in a field","Người làm vườn quan sát cây trồng ngay tại ruộng")} fill sizes="(min-width: 768px) 50vw, 94vw" className="object-cover object-[60%_45%]" /><span className="absolute bottom-3 left-3 rounded-full bg-space-950/80 px-3 py-1.5 text-sm text-white">{L("Illustrative field photo","Ảnh minh họa tại ruộng")}</span></div><div className="p-5"><h3 className="flex items-center gap-2 text-xl font-bold text-forest"><MapPin className="h-6 w-6" aria-hidden />{L("On the ground: your own plot","Tại ruộng: đúng thửa của bạn")}</h3><p className="mt-3 text-base leading-relaxed text-ink">{L("Check soil tests, pumped water and planting dates. Your own records help test the model's estimates.","Kiểm tra xét nghiệm đất, lượng nước bơm và lịch gieo. Ghi chép của bạn giúp đối chiếu các ước tính của mô hình.")}</p></div></Card>
        </div>
        <Card className="overflow-hidden rounded-3xl border-[#cbd5cd]">
          <div className="border-b border-[#cbd5cd] p-5"><h3 className="text-xl font-bold text-forest">{L("What does each source tell you?","Mỗi nguồn giúp bạn biết gì?")}</h3><div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={L("Choose a data source","Chọn nguồn dữ liệu")}>{GUIDE_SOURCES.map((s,i)=><button key={s.id} onClick={()=>setSourceIndex(i)} aria-pressed={i===sourceIndex} className={cn("min-h-12 rounded-xl border px-4 py-2 text-base font-bold",i===sourceIndex?"border-forest bg-forest text-white":"border-[#cbd5cd] bg-white text-ink hover:bg-[#f0f6e9]")}>{s.name}</button>)}</div></div>
          <div className="grid gap-5 p-5 md:grid-cols-[230px_minmax(0,1fr)] md:p-6"><div className="rounded-2xl bg-[#e8f2ee] p-5 text-forest"><Satellite className="h-7 w-7" aria-hidden /><p className="mt-3 text-lg font-bold">{source.name}</p><p className="mt-2 text-4xl font-extrabold">{source.scale}</p><p className="mt-2 text-base">{L("Approximate grid size","Kích thước ô lưới gần đúng")}</p></div><div className="space-y-4 text-base leading-relaxed text-ink" aria-live="polite"><div><h4 className="font-bold text-forest">{source.topic[lang]}</h4><p className="mt-1">{source.use[lang]}</p></div><div className="rounded-2xl border border-[#d9c292] bg-[#fff6e6] p-4"><p className="mb-1 font-bold text-[#65430e]">{L("Keep in mind","Cần nhớ")}</p><p>{source.limit[lang]}</p></div></div></div>
        </Card>
        <Link href="/methodology" className={buttonClass("outline","lg","h-auto min-h-13 rounded-xl border-[#9eafa3] py-3 text-base")}>{L("See sources and methods","Xem nguồn dữ liệu và cách tính")}<ArrowRight className="h-5 w-5" aria-hidden /></Link>
      </div>
    </SectionPanel>

    <SectionPanel id="crops" active={section==="crops"} keepMounted>
      <div className="space-y-5"><div><h2 className="text-2xl font-bold text-forest">{L("Different crops, different roles","Mỗi nhóm cây có một vai trò")}</h2><p className="mt-2 text-base text-ink">{L("Pick a group to see examples from the app.","Chọn một nhóm để xem ví dụ trong ứng dụng.")}</p></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{roles.map((r,i)=><button key={r.id} onClick={()=>setCropRole(i)} aria-pressed={i===cropRole} className={cn("flex min-h-24 items-center gap-3 rounded-2xl border p-4 text-left text-base font-bold transition-colors",i===cropRole?"border-forest bg-forest text-white":"border-[#cbd5cd] bg-white text-forest hover:bg-[#f0f6e9]")}><r.icon className="h-7 w-7 shrink-0" aria-hidden />{r.title}</button>)}</div>
        <Card className="grid items-start gap-6 rounded-3xl border-[#cbd5cd] p-5 md:p-6 lg:grid-cols-[.8fr_1.2fr]"><div><StepPhoto src="/images/how-it-works/03-crop-rotation.png" alt={L("Crop rotation diagram and examples of different planted beds","Sơ đồ luân canh và các luống trồng các loại cây khác nhau")} title={L("A visual example of rotation","Minh họa cách bố trí luân canh")} imageClass="object-contain" contain zoomable sizes="(min-width: 1024px) 40vw, 94vw" /><p className="mt-2 text-sm text-ink-2">{L("Illustration supplied by the project team","Hình minh họa do nhóm cung cấp")}</p></div><div className="space-y-5" aria-live="polite"><h3 className="text-2xl font-bold text-forest">{role.label}</h3><p className="text-base leading-relaxed text-ink">{role.body}</p><div><p className="mb-3 text-base font-bold text-forest">{L("Examples in the app","Ví dụ trong ứng dụng")}</p><div className="flex flex-wrap gap-3">{role.crops.map(c=><span key={c.id} className="inline-flex items-center gap-2 rounded-2xl border border-[#cbd5cd] bg-white py-2 pl-2 pr-4 text-base font-bold text-ink"><CropIcon cropId={c.id} size={36} />{c.name[lang]}</span>)}</div></div><p className="rounded-2xl bg-[#fff6e6] p-4 text-base leading-relaxed text-[#65430e]">{role.note}</p></div></Card>
      </div>
    </SectionPanel>

    <SectionPanel id="experts" active={section==="experts"} keepMounted>
      <div className="space-y-5"><div><h2 className="text-2xl font-bold text-forest">{L("Take the right questions to your adviser","Hỏi đúng việc trước khi gieo")}</h2><p className="mt-2 text-base leading-relaxed text-ink">{L("Choose the topics you need, then copy a short question list.","Chọn việc cần trao đổi, rồi sao chép danh sách câu hỏi ngắn gọn.")}</p></div>
        <div className="grid gap-4 md:grid-cols-2">{questionTopics.map((topic,i)=><label key={i} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-5",questions.includes(i)?"border-[#8bac77] bg-[#f1f7e9]":"border-[#cbd5cd] bg-white")}><input type="checkbox" checked={questions.includes(i)} onChange={()=>{setQuestions(previous=>previous.includes(i)?previous.filter(n=>n!==i):[...previous,i].sort());setCopyStatus("");}} className="mt-1 h-6 w-6 shrink-0 accent-forest" /><span><span className="block text-lg font-bold text-forest">{topic.title}</span><span className="mt-3 block space-y-2 text-base leading-relaxed text-ink">{topic.items.map(q=><span key={q} className="block">{q}</span>)}</span></span></label>)}</div>
        <Card className="rounded-3xl border-[#cbd5cd] p-5 md:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><p className="flex items-center gap-2 text-lg font-bold text-forest"><HandHelping className="h-6 w-6" aria-hidden />{L(`${questions.length} topics selected`,`Đã chọn ${questions.length} nhóm câu hỏi`)}</p><Button onClick={copy} disabled={!questions.length} className="min-h-13 h-auto rounded-xl py-3 text-base"><Clipboard className="h-5 w-5 shrink-0" aria-hidden />{L("Copy questions","Sao chép câu hỏi")}</Button></div><p className="mt-3 text-base text-forest" role="status">{copyStatus}</p><details className="group mt-4"><summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 text-base font-bold text-forest">{L("Read the question list","Xem danh sách câu hỏi")}<ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden /></summary><textarea readOnly value={questions.length?questionText:L("Choose a topic above.","Chọn một nhóm câu hỏi ở phía trên.")} aria-label={L("Your question list","Danh sách câu hỏi của bạn")} rows={10} className="mt-3 w-full rounded-2xl border border-[#9eafa3] p-4 text-base leading-relaxed text-ink" /></details></Card>
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#d9c292] bg-[#fff6e6] p-5 sm:flex-row sm:items-center"><p className="text-base leading-relaxed text-[#65430e]">{L("Also check local pest alerts, irrigation schedules and buyers before changing crops.","Kiểm tra thêm cảnh báo sâu bệnh, lịch cấp nước và đầu ra trước khi đổi cây.")}</p><Link href="/compare#evidence" className={buttonClass("outline","lg","h-auto min-h-13 shrink-0 rounded-xl py-3 text-base")}>{L("Questions for a specific plan","Câu hỏi theo từng phương án")}<ArrowRight className="h-5 w-5" aria-hidden /></Link></div>
      </div>
    </SectionPanel>

    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#cbd5cd] pt-5 text-sm leading-relaxed text-ink-2"><p>{L("Regional data and model estimates help you compare. Field records and local advice help you decide.","Dữ liệu vùng và mô hình giúp so sánh. Ghi chép tại ruộng và tư vấn địa phương giúp bạn quyết định.")}</p><a href="/images/CREDITS.md" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{L("Image credits","Nguồn hình ảnh")}</a></div>
  </div>;
}
