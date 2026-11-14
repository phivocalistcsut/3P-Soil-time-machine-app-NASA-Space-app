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
import { useMounted } from "@/lib/hooks";
import { LanguageSwitcher, Logo } from "@/components/common";
import { buttonClass, Skeleton } from "@/components/ui/primitives";
import { HeroDemo } from "./hero-demo";
import {
  IlloBalance,
  IlloGrow,
  IlloLocate,
  IlloSatellite,
} from "@/components/illustrations";

export function Landing() {
  const { L } = useI18n();
  const router = useRouter();
  const setFarm = useApp((s) => s.setFarm);
  const mounted = useMounted();
  const startDemo = () => {
    setFarm(createDemoFarm());
    router.push("/overview");
  };

  const steps = [
    {
      icon: MapPin,
      art: IlloLocate,
      title: L("Locate your farm", "Xác định trang trại"),
      text: L(
        "Pin your field on the map, or start from the Mekong Delta demo farm.",
        "Ghim ruộng của bạn trên bản đồ, hoặc bắt đầu với trang trại mẫu ở ĐBSCL.",
      ),
    },
    {
      icon: Layers,
      art: IlloSatellite,
      title: L("Understand your soil and climate", "Hiểu đất và khí hậu"),
      text: L(
        "See regional rainfall, temperature, and soil moisture history for your location.",
        "Xem 10 năm số liệu mưa, nhiệt độ và độ ẩm đất của NASA cho khu vực của bạn.",
      ),
    },
    {
      icon: GitCompareArrows,
      art: IlloGrow,
      title: L("Try new planting plans", "Thử cách trồng mới"),
      text: L(
        "Pick a plan and a year up to 5 years ahead, and see water, soil and risks change.",
        "Chọn cách trồng và một năm trong 5 năm tới, xem nước, đất và rủi ro thay đổi ra sao.",
      ),
    },
    {
      icon: Scale,
      art: IlloBalance,
      title: L("Make a more informed decision", "Ra quyết định sáng suốt hơn"),
      text: L(
        "Compare plans against your own priorities and turn one into a season plan.",
        "So sánh các cách trồng theo ưu tiên của bạn và biến một lựa chọn thành kế hoạch mùa vụ.",
      ),
    },
  ];

  const challenges = [
    {
      icon: Droplets,
      title: L("Water scarcity", "Khan hiếm nước"),
      text: L(
        "Dry-season irrigation competes with saltwater intrusion and upstream flow changes. Every season of flooded rice needs land-preparation and percolation water on top of crop use.",
        "Tưới mùa khô phải cạnh tranh với xâm nhập mặn và dòng chảy thượng nguồn thay đổi. Mỗi vụ lúa ngập cần thêm nước làm đất và bù thấm ngoài lượng cây sử dụng.",
      ),
    },
    {
      icon: Mountain,
      title: L("Soil degradation", "Suy thoái đất"),
      text: L(
        "Continuous cropping of the same crop removes nutrients and keeps soils permanently flooded. Rotation with legumes and green manure is one widely studied way to rebuild soil function.",
        "Độc canh liên tục lấy đi dinh dưỡng và giữ đất luôn ngập. Luân canh với cây họ đậu và phân xanh là một hướng đã được nghiên cứu nhiều để phục hồi chức năng của đất.",
      ),
    },
    {
      icon: ThermometerSun,
      title: L("Climate uncertainty", "Khí hậu bất định"),
      text: L(
        "Hotter, drier or wetter seasons change which crops fit. Testing a plan against several climate assumptions shows where it is fragile before you plant.",
        "Mùa nóng hơn, khô hơn hay ẩm hơn sẽ thay đổi cây nào phù hợp. Thử kế hoạch với nhiều giả định khí hậu cho thấy điểm yếu trước khi xuống giống.",
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
        "Bản đồ đất toàn cầu mô hình hóa: pH, carbon hữu cơ, sa cấu (không thuộc NASA, bổ sung).",
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
    { value: "5", label: L("years ahead", "năm phía trước") },
    { value: "3+1", label: L("plans vs. today", "cách trồng so với hiện tại") },
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
        <header className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-5 md:px-6">
          <Logo light />
          <nav className="flex items-center gap-2">
            <Link href="/methodology" className="hidden rounded-full px-3 py-2 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-white/70 hover:text-white sm:block">
              {L("Data sources", "Nguồn dữ liệu")}
            </Link>
            <LanguageSwitcher dark />
          </nav>
        </header>
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 pb-24 pt-10 md:px-6 lg:grid-cols-[1fr_1fr] lg:pb-32 lg:pt-16">
          <div>
            <p className="eyebrow text-lime-bright">
              {L("See the future of your soil. Shape it today.", "Thấy trước tương lai của đất. Định hình ngay hôm nay.")}
            </p>
            <h1 className="title-caps mt-5 text-[36px] font-extrabold leading-[1.04] md:text-[54px] lg:text-[60px]">
              {L("What if you could see the future of your farm?", "Nếu bạn có thể nhìn thấy tương lai của ruộng mình?")}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
              {L(
                "Explore how today's crop rotation decisions may shape tomorrow's soil health, water demand, and climate resilience — powered by NASA Earth observations.",
                "Khám phá các quyết định luân canh hôm nay có thể định hình sức khỏe đất, nhu cầu nước và khả năng chống chịu khí hậu ngày mai ra sao — dựa trên dữ liệu quan sát Trái Đất của NASA.",
              )}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/setup" className={buttonClass("primary", "lg")}>
                {L("Explore My Farm", "Khám phá trang trại của tôi")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <button onClick={startDemo} className={buttonClass("glass", "lg")}>
                {L("Try Interactive Demo", "Dùng thử bản demo")}
              </button>
            </div>
            <p className="mt-5 text-xs text-white/60">
              {L(
                "No sign-up. Works with free NASA data. Demo values are clearly labeled.",
                "Không cần đăng ký. Dùng dữ liệu NASA miễn phí. Giá trị demo được ghi nhãn rõ ràng.",
              )}
            </p>
          </div>
          <div>{mounted ? <HeroDemo /> : <Skeleton className="h-[420px] rounded-[28px] bg-white/10" />}</div>
        </div>
      </section>

      {/* FACTS: overlaps the hero */}
      <div className="relative z-10 mx-auto -mt-12 max-w-[1240px] px-4 md:px-6">
        <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-float)] md:grid-cols-4">
          {facts.map((f, i) => (
            <div key={f.label} className={`px-5 py-6 text-center md:py-8 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}>
              <dt className="sr-only">{f.label}</dt>
              <dd>
                <span className="block font-display text-4xl font-extrabold text-lime-ink tabular md:text-5xl">{f.value}</span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-2">{f.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-[1240px] px-4 py-20 md:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center text-lime-ink">{L("How it works", "Cách hoạt động")}</p>
          <h2 className="title-caps mt-3 text-3xl font-extrabold md:text-4xl">
            {L("From one field to several possible futures", "Từ một thửa ruộng đến nhiều tương lai có thể")}
          </h2>
        </div>
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="group rounded-3xl border border-line bg-white p-3 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-lime hover:shadow-[var(--shadow-float)]">
              <s.art className="block h-auto w-full rounded-2xl" />
              <div className="px-2 pb-3 pt-5">
                <p className="font-display text-xs font-extrabold uppercase tracking-[0.2em] text-lime-ink">
                  {L("Step", "Bước")} {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1.5 text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{s.text}</p>
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
        <div className="mx-auto max-w-[1240px] px-4 py-20 md:px-6 lg:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow text-lime-bright">{L("Why it matters", "Vì sao quan trọng")}</p>
            <h2 className="title-caps mt-3 text-3xl font-extrabold md:text-[42px] md:leading-[1.1]">
              {L("Three pressures meet on every field", "Ba áp lực gặp nhau trên mỗi thửa ruộng")}
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
      <section className="mx-auto max-w-[1240px] px-4 py-20 md:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow text-lime-ink">{L("Powered by Earth observations", "Dựa trên quan sát Trái Đất")}</p>
            <h2 className="title-caps mt-3 text-3xl font-extrabold md:text-4xl">{L("Real data, honest limits", "Dữ liệu thật, giới hạn minh bạch")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-2">
              {L(
                "NASA missions describe the climate and land conditions around your farm. They do not measure or predict the soil health of an individual field. Soil Time Machine combines these regional observations with transparent agronomic rules to explore scenarios — and labels every number as observed, estimated, illustrative or unavailable.",
                "Các sứ mệnh NASA mô tả khí hậu và điều kiện mặt đất quanh trang trại của bạn. Chúng không đo hay dự báo sức khỏe đất của từng thửa ruộng. Soil Time Machine kết hợp số liệu theo vùng này với các quy tắc nông học minh bạch để khám phá kịch bản — và ghi nhãn mọi con số là quan trắc, ước tính, minh họa hoặc chưa có dữ liệu.",
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
          <h2 className="title-caps text-3xl font-extrabold md:text-5xl">
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
              {L("Start Exploring", "Bắt đầu khám phá")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <button onClick={startDemo} className={buttonClass("glass", "lg")}>
              {L("Open demo farm", "Mở trang trại mẫu")}
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-space-950 text-white/60">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 py-10 text-xs md:flex-row md:items-start md:justify-between md:px-6">
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
                "Không liên kết hay được NASA bảo trợ. Dữ liệu: NASA POWER, NASA GIBS, EOX Sentinel-2 cloudless, ISRIC SoilGrids, © OpenStreetMap.",
              )}
            </p>
            <p>{L("Photographs: NASA / International Space Station crew.", "Ảnh: NASA / phi hành đoàn Trạm Vũ trụ Quốc tế.")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
