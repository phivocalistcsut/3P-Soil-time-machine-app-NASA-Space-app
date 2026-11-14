"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CloudRain,
  Droplets,
  GitCompareArrows,
  Layers,
  MapPin,
  Mountain,
  Satellite,
  Scale,
  Sprout,
  ThermometerSun,
  Waves,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { createDemoFarm } from "@/lib/data/demo";
import { LanguageSwitcher, Logo } from "@/components/common";
import { buttonClass } from "@/components/ui/primitives";
import { HeroEarth } from "./hero-earth";
import { StepPhoto } from "./step-photo";

export function Landing() {
  const { L } = useI18n();
  const router = useRouter();
  const setFarm = useApp((s) => s.setFarm);
  const startDemo = () => {
    setFarm(createDemoFarm());
    router.push("/overview");
  };

  const steps = [
    {
      icon: MapPin,
      image: "/images/how-it-works/01-farm-location.png",
      alt: L("Two people overlooking terraced rice fields", "Hai người đứng bên những thửa ruộng bậc thang"),
      imageClass: "object-cover object-[0%_58%]",
      title: L("Locate your farm", "Chọn vị trí ruộng"),
      text: L(
        "Pin your field on the map, or start from the Mekong Delta demo farm.",
        "Tìm địa chỉ rồi ghim đúng thửa ruộng, hoặc khám phá trước với ruộng mẫu ở Đồng bằng sông Cửu Long.",
      ),
    },
    {
      icon: Layers,
      image: "/images/how-it-works/02-field-observation.png",
      alt: L("An agricultural drone flying above a rice field", "Máy bay nông nghiệp bay phía trên ruộng lúa"),
      imageClass: "object-cover object-[58%_38%]",
      title: L("Understand your soil and climate", "Tìm hiểu đất và khí hậu"),
      text: L(
        "See regional rainfall, temperature, and soil moisture history for your location.",
        "Xem 10 năm số liệu mưa, nhiệt độ và độ ẩm đất của NASA cho khu vực của bạn.",
      ),
    },
    {
      icon: GitCompareArrows,
      image: "/images/how-it-works/03-crop-rotation.png",
      alt: L("Crop rotation diagram and examples of planted beds", "Sơ đồ luân canh và các luống cây minh họa"),
      imageClass: "object-contain",
      title: L("Try new planting plans", "Thử cách trồng mới"),
      text: L(
        "Pick a plan and a year up to 5 years ahead, and see water, soil and risks change.",
        "Thử các phương án luân canh trong 5 năm để so sánh nhu cầu tưới, carbon trong đất và rủi ro mùa vụ.",
      ),
    },
    {
      icon: Scale,
      image: "/images/how-it-works/04-farm-decision.png",
      alt: L("A grower harvesting leafy vegetables in a field", "Người làm vườn thu hoạch rau trên ruộng"),
      imageClass: "object-cover object-[60%_48%]",
      title: L("Make a more informed decision", "Chọn phương án phù hợp"),
      text: L(
        "Compare plans against your own priorities and turn one into a season plan.",
        "Cân nhắc từng phương án theo nhu cầu của gia đình, sau đó lập lịch gieo trồng cho từng vụ.",
      ),
    },
  ];

  const challenges = [
    {
      icon: Droplets,
      title: L("Water scarcity", "Khan hiếm nước"),
      text: L(
        "Dry-season irrigation competes with saltwater intrusion and upstream flow changes. Every season of flooded rice needs land-preparation and percolation water on top of crop use.",
        "Mùa khô và xâm nhập mặn khiến nguồn nước tưới khó bảo đảm. Ngoài lượng nước cây cần, mỗi vụ lúa còn dùng nước làm đất, duy trì ngập và bù thấm.",
      ),
    },
    {
      icon: Mountain,
      title: L("Soil degradation", "Suy thoái đất"),
      text: L(
        "Repeated cropping, residue removal and water management affect soil carbon and nutrients. Legumes and green manure can return organic matter; the outcome depends on local management.",
        "Canh tác liên tục, lấy tàn dư khỏi ruộng và chế độ nước đều ảnh hưởng đến dinh dưỡng và carbon trong đất. Cây họ đậu, phân xanh có thể bổ sung hữu cơ, nhưng hiệu quả cần được đánh giá tại ruộng.",
      ),
    },
    {
      icon: ThermometerSun,
      title: L("Climate uncertainty", "Thời tiết khó lường"),
      text: L(
        "Hotter, drier or wetter seasons change which crops fit. Testing a plan against several climate assumptions shows where it is fragile before you plant.",
        "Nắng nóng, thiếu nước hoặc mưa nhiều có thể làm một số cây khó thích nghi. Thử trước các tình huống thời tiết giúp nhận diện rủi ro trước khi xuống giống.",
      ),
    },
  ];

  const sources = [
    {
      icon: ThermometerSun,
      name: "NASA POWER",
      what: L(
        "Monthly temperature, rainfall, humidity, wind, solar radiation and soil wetness since 1981.",
        "Nhiệt độ, mưa, độ ẩm, gió, bức xạ và độ ẩm đất theo tháng từ 1981.",
      ),
      use: L(
        "Drives the water-balance model (FAO-56 ET0).",
        "Là đầu vào của mô hình cân bằng nước (ET0 FAO-56).",
      ),
      scale: L("≈ 55 km grid", "Lưới ≈ 55 km"),
    },
    {
      icon: CloudRain,
      name: "GPM IMERG",
      what: L(
        "Satellite precipitation estimates from the Global Precipitation Measurement mission.",
        "Ước tính mưa từ vệ tinh của sứ mệnh Đo mưa Toàn cầu (GPM).",
      ),
      use: L(
        "Historical monthly rainfall and a map overlay. Used in the model when history is complete.",
        "Lượng mưa tháng và lớp bản đồ. Mô hình dùng khi chuỗi lịch sử đầy đủ.",
      ),
      scale: L("≈ 11 km", "≈ 11 km"),
    },
    {
      icon: Waves,
      name: "SMAP L4",
      what: L(
        "Satellite-informed estimates of surface and root-zone soil moisture.",
        "Ước tính độ ẩm lớp mặt và vùng rễ từ mô hình kết hợp vệ tinh.",
      ),
      use: L(
        "Monthly charts and seasonal drainage checks.",
        "Biểu đồ tháng và kiểm tra thoát nước theo mùa.",
      ),
      scale: L("9 km", "9 km"),
    },
    {
      icon: Satellite,
      name: "MODIS Terra",
      what: L(
        "Quality-screened vegetation greenness and a surface temperature map.",
        "Độ xanh thực vật đã lọc chất lượng và bản đồ nhiệt độ bề mặt.",
      ),
      use: L(
        "Greenness history helps you decide what to check in your field.",
        "Lịch sử độ xanh giúp chọn điều cần kiểm tra ngoài ruộng.",
      ),
      scale: L("250 m NDVI", "NDVI 250 m"),
    },
    {
      icon: Sprout,
      name: "ISRIC SoilGrids",
      what: L(
        "Global modeled soil pH, organic carbon and texture (non-NASA, supplementary).",
        "Ước tính pH, carbon hữu cơ và thành phần cơ giới đất theo mô hình toàn cầu (nguồn bổ sung ngoài NASA).",
      ),
      use: L(
        "Optional regional estimate when you have no soil test.",
        "Ước tính theo vùng khi bạn chưa có số đo đất.",
      ),
      scale: L("250 m", "250 m"),
    },
  ];

  const facts = [
    { value: "4", label: L("NASA datasets", "bộ dữ liệu NASA") },
    { value: "5", label: L("years ahead", "năm mô phỏng") },
    { value: L("Compare", "So sánh"), label: L("planting strategies", "phương án canh tác") },
    { value: "1981", label: L("weather history since", "lịch sử thời tiết từ") },
  ];

  return (
    <div className="bg-sand">
      {/* HERO: Earth's horizon from the ISS */}
      <section className="relative isolate overflow-hidden bg-space-950 text-white">
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image src="/images/space-horizon.webp" alt="" fill priority sizes="100vw" className="object-cover object-[50%_70%] opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-space-950/80 via-space-950/55 to-space-950/95" />
          <div className="absolute inset-0 bg-stars opacity-60 motion-safe:animate-[var(--animate-twinkle)]" />
        </div>
        <div aria-hidden className="landing-hero-aura pointer-events-none absolute inset-0 -z-10" />
        <header className="landing-shell relative flex items-center justify-between gap-3 py-5">
          <Logo light />
          <nav className="flex items-center gap-2">
            <Link href="/methodology" className="hidden rounded-full px-3 py-2 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-white/70 hover:text-white sm:block">
              {L("Data sources", "Nguồn dữ liệu")}
            </Link>
            <LanguageSwitcher dark />
          </nav>
        </header>
        <div className="landing-shell relative grid items-center gap-8 pb-24 pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28 lg:pt-12 xl:gap-16">
          <div className="relative z-10 min-w-0">
            <p className="eyebrow text-lime-bright">
              {L("See the future of your soil. Shape it today.", "Hiểu đất hôm nay, chủ động mùa vụ ngày mai.")}
            </p>
            <h1 className="landing-title-gradient title-caps mt-5 text-[clamp(2.25rem,4.5vw,4.25rem)] font-extrabold leading-[1.08] [text-wrap:balance]">
              {L("What if you could see the future of your farm?", "Chọn cách trồng hôm nay, chuẩn bị cho những mùa vụ tới.")}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
              {L(
                "Explore how today's crop rotation decisions may shape tomorrow's soil health, water demand, and climate resilience — powered by NASA Earth observations.",
                "Dùng dữ liệu NASA và mô hình nông học để so sánh phương án luân canh, ước tính nhu cầu tưới và theo dõi carbon trong đất qua từng năm.",
              )}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/setup" className={buttonClass("primary", "lg")}>
                {L("Explore My Farm", "Thiết lập ruộng của tôi")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <button onClick={startDemo} className={buttonClass("glass", "lg")}>
                {L("Try Interactive Demo", "Khám phá ruộng mẫu")}
              </button>
            </div>
            <p className="mt-5 text-xs text-white/60">
              {L(
                "No sign-up. Works with free NASA data. Demo values are clearly labeled.",
                "Không cần đăng ký. Có sẵn ruộng mẫu để dùng thử; mỗi số liệu đều kèm nguồn và mức độ tin cậy.",
              )}
            </p>
          </div>
          <HeroEarth />
        </div>
      </section>

      {/* FACTS: overlaps the hero */}
      <div className="landing-shell relative z-10 -mt-12">
        <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-float)] md:grid-cols-4">
          {facts.map((f, i) => (
            <div key={f.label} className={`px-5 py-6 text-center md:py-8 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}>
              <dt className="sr-only">{f.label}</dt>
              <dd>
                <span className="block font-display text-3xl font-extrabold text-lime-ink tabular md:text-4xl">{f.value}</span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-2">{f.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="landing-shell py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow justify-center text-lime-ink">{L("How it works", "Cách hoạt động")}</p>
          <h2 className="landing-title-gradient landing-title-gradient-on-light title-caps mt-3 text-3xl font-extrabold [text-wrap:balance] md:text-[42px] md:leading-[1.15]">
            {L("From one field to several possible futures", "So sánh cách trồng, chọn hướng phù hợp cho ruộng")}
          </h2>
        </div>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          {steps.map((s, i) => (
            <li key={s.title} className="group min-w-0 rounded-[28px] border border-line bg-white p-3 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-lime hover:shadow-[var(--shadow-float)]">
              <StepPhoto src={s.image} alt={s.alt} title={s.title} imageClass={s.imageClass} contain={i === 2} />
              <div className="px-2 pb-4 pt-5 xl:px-3">
                <p className="flex items-center gap-2 font-display text-xs font-extrabold uppercase tracking-[0.16em] text-lime-ink">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-soft"><s.icon className="h-3.5 w-3.5" aria-hidden /></span>
                  {L("Step", "Bước")} {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-xl font-bold leading-snug">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.7] text-ink-2">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* WHY IT MATTERS: the Mekong Delta from the ISS */}
      <section className="relative isolate overflow-hidden bg-space-900 text-white">
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image src="/images/mekong-delta.webp" alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-space-950/90 via-space-950/55 to-space-950/10" />
        </div>
        <div className="landing-shell py-20 lg:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow text-lime-bright">{L("Why it matters", "Vì sao quan trọng")}</p>
            <h2 className="landing-title-gradient title-caps mt-3 text-3xl font-extrabold [text-wrap:balance] md:text-[42px] md:leading-[1.15]">
              {L("Three pressures meet on every field", "Những thách thức cần cân nhắc trước mỗi mùa vụ")}
            </h2>
            <p className="mt-3 text-sm text-white/70">
              {L(
                "The Bassac River at Cù Lao Dung, Mekong Delta, photographed from the International Space Station (NASA, 2025).",
                "Sông Hậu tại Cù Lao Dung, Đồng bằng sông Cửu Long, chụp từ Trạm Vũ trụ Quốc tế (NASA, 2025).",
              )}
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {challenges.map((c) => (
              <article key={c.title} className="rounded-3xl border border-white/15 bg-space-950/55 p-6 backdrop-blur-md">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-lime/50 text-lime-bright">
                  <c.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-xl font-bold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{c.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* DATA */}
      <section className="landing-shell py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow text-lime-ink">{L("Powered by Earth observations", "Dựa trên quan sát Trái Đất")}</p>
            <h2 className="landing-title-gradient landing-title-gradient-on-light title-caps mt-3 text-3xl font-extrabold [text-wrap:balance] md:text-4xl">{L("Real data, honest limits", "Dữ liệu thật, giới hạn minh bạch")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-2">
              {L(
                "NASA missions describe the climate and land conditions around your farm. They do not measure or predict the soil health of an individual field. Soil Time Machine combines these regional observations with transparent agronomic rules to explore scenarios — and labels every number as observed, estimated, illustrative or unavailable.",
                "Dữ liệu NASA cung cấp bối cảnh khí hậu và điều kiện bề mặt theo vùng. Ứng dụng kết hợp các dữ liệu này với thông tin ruộng và mô hình nông học để so sánh phương án canh tác. Kết quả có nhãn nguồn, mức độ tin cậy và giới hạn; cần đối chiếu với số đo thực địa.",
              )}
            </p>
            <Link href="/methodology" className={buttonClass("dark", "md", "mt-6")}>
              {L("Read the methodology", "Xem phương pháp")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {sources.map((s) => (
              <li key={s.name} className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)] transition-colors hover:border-lime">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-space-900 text-lime-bright">
                    <s.icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold uppercase tracking-wide">{s.name}</p>
                    <p className="text-[11px] text-ink-3">{s.scale}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink-2">{s.what}</p>
                <p className="mt-2 text-xs font-semibold text-lime-ink">{s.use}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FINAL CTA: sunrise over Earth's limb */}
      <section className="relative isolate overflow-hidden bg-space-950 text-center text-white">
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image src="/images/orbital-sunrise.webp" alt="" fill sizes="100vw" className="object-cover object-[50%_60%]" />
          <div className="absolute inset-0 bg-space-950/45" />
          <div className="absolute inset-0 bg-stars opacity-50" />
        </div>
        <div className="mx-auto max-w-3xl px-4 py-24 md:py-32">
          <h2 className="landing-title-gradient title-caps text-3xl font-extrabold [text-wrap:balance] md:text-5xl">
            {L("Your next harvest starts with today's decisions.", "Vụ mùa tới bắt đầu từ quyết định hôm nay.")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/75">
            {L(
              "Your farm profile stays in this browser. Data providers receive the location or place name needed for your lookup.",
              "Hồ sơ ruộng được lưu trên trình duyệt này. Dịch vụ dữ liệu nhận vị trí hoặc tên địa điểm khi cần tra cứu.",
            )}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/setup" className={buttonClass("primary", "lg")}>
              {L("Start Exploring", "Bắt đầu với ruộng của tôi")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <button onClick={startDemo} className={buttonClass("glass", "lg")}>
              {L("Open demo farm", "Mở trang trại mẫu")}
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-space-950 text-white/60">
        <div className="landing-shell flex flex-col gap-6 py-10 text-xs md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo light />
            <p className="mt-3">
              Soil Time Machine · NASA Space Apps Challenge {L("prototype", "nguyên mẫu")}
            </p>
          </div>
          <div className="max-w-xl space-y-2 md:text-right">
            <p>
              {L(
                "Not affiliated with or endorsed by NASA. Data: NASA POWER, NASA GIBS, EOX Sentinel-2 cloudless, ISRIC SoilGrids, © OpenStreetMap.",
                "Sản phẩm độc lập, không do NASA bảo trợ. Dữ liệu: NASA POWER, NASA GIBS, EOX Sentinel-2 cloudless, ISRIC SoilGrids, © OpenStreetMap.",
              )}
            </p>
            <p>{L("Background photos: NASA / ISS crew. ", "Ảnh nền: NASA / phi hành đoàn ISS. ")}<a href="/images/CREDITS.md" target="_blank" rel="noreferrer" className="underline underline-offset-2">{L("All image credits", "Thông tin bản quyền ảnh")}</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
