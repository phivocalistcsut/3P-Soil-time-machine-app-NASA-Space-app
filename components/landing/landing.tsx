"use client";

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
  IlloClimate,
  IlloDrought,
  IlloFieldScene,
  IlloGrow,
  IlloLocate,
  IlloSatellite,
  IlloSoil,
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
      art: IlloDrought,
      tone: "text-water-ink bg-water-soft",
      title: L("Water scarcity", "Khan hiếm nước"),
      text: L(
        "Dry-season irrigation competes with saltwater intrusion and upstream flow changes. Every season of flooded rice needs land-preparation and percolation water on top of crop use.",
        "Tưới mùa khô phải cạnh tranh với xâm nhập mặn và dòng chảy thượng nguồn thay đổi. Mỗi vụ lúa ngập cần thêm nước làm đất và bù thấm ngoài lượng cây sử dụng.",
      ),
    },
    {
      icon: Mountain,
      art: IlloSoil,
      tone: "text-earth-ink bg-[#F3E9DC]",
      title: L("Soil degradation", "Suy thoái đất"),
      text: L(
        "Continuous cropping of the same crop removes nutrients and keeps soils permanently flooded. Rotation with legumes and green manure is one widely studied way to rebuild soil function.",
        "Độc canh liên tục lấy đi dinh dưỡng và giữ đất luôn ngập. Luân canh với cây họ đậu và phân xanh là một hướng đã được nghiên cứu nhiều để phục hồi chức năng của đất.",
      ),
    },
    {
      icon: ThermometerSun,
      art: IlloClimate,
      tone: "text-amber-ink bg-amber-soft",
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

  return (
    <div className="bg-[#F7F4EC]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-forest-deep text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-contours-light"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-leaf/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-water/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-120px] left-1/3 h-72 w-[520px] rounded-full bg-amber/20 blur-3xl"
        />
        <header className="relative mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Logo light />
          <nav className="flex items-center gap-2">
            <Link
              href="/methodology"
              className="hidden rounded-lg px-3 py-2 text-sm text-mint/90 hover:text-white sm:block"
            >
              {L("Data sources", "Nguồn dữ liệu")}
            </Link>
            <LanguageSwitcher dark />
          </nav>
        </header>
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-4 pb-16 pt-6 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:pb-24 lg:pt-10">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-mint">
              <Satellite className="h-3.5 w-3.5" aria-hidden />
              {L(
                "See the Future of Your Soil. Shape It Today.",
                "Thấy trước tương lai của đất. Định hình ngay hôm nay.",
              )}
            </p>
            <h1 className="font-display text-[34px] font-extrabold leading-[1.08] md:text-5xl lg:text-[54px]">
              {L(
                "What if you could see the future of your farm?",
                "Nếu bạn có thể nhìn thấy tương lai của ruộng mình?",
              )}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-mint/90 md:text-lg">
              {L(
                "Explore how today's crop rotation decisions may shape tomorrow's soil health, water demand, and climate resilience — powered by NASA Earth observations.",
                "Khám phá các quyết định luân canh hôm nay có thể định hình sức khỏe đất, nhu cầu nước và khả năng chống chịu khí hậu ngày mai ra sao — dựa trên dữ liệu quan sát Trái Đất của NASA.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/setup"
                className={buttonClass(
                  "primary",
                  "lg",
                  "bg-leaf text-forest-deep hover:bg-[#7cc08e]",
                )}
              >
                {L("Explore My Farm", "Khám phá trang trại của tôi")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <button
                onClick={startDemo}
                className={buttonClass(
                  "outline",
                  "lg",
                  "border-white/30 bg-white/5 text-white hover:border-white hover:bg-white/10",
                )}
              >
                {L("Try Interactive Demo", "Dùng thử bản demo")}
              </button>
            </div>
            <p className="mt-4 text-xs text-mint/70">
              {L(
                "No sign-up. Works with free NASA data. Demo values are clearly labeled.",
                "Không cần đăng ký. Dùng dữ liệu NASA miễn phí. Giá trị demo được ghi nhãn rõ ràng.",
              )}
            </p>
          </div>
          <div>
            {mounted ? (
              <HeroDemo />
            ) : (
              <Skeleton className="h-[420px] rounded-[28px] bg-white/10" />
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div className="relative bg-gradient-to-b from-[#E2F2E6] via-[#F1F8EC] to-[#FFF4E0]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-contours"
        />
        <section className="relative mx-auto max-w-[1240px] px-4 py-16 md:px-6 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-leaf-ink">
            {L("How it works", "Cách hoạt động")}
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold">
            {L(
              "From one field to several possible futures",
              "Từ một thửa ruộng đến nhiều tương lai có thể",
            )}
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="group relative rounded-3xl border border-white/80 bg-white/85 p-3 shadow-[var(--shadow-card)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-float)]"
              >
                <s.art className="block h-auto w-full rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]" />
                <div className="px-2 pb-2 pt-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-extrabold text-white">
                      {i + 1}
                    </span>
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* WHY IT MATTERS */}
      <section className="bg-gradient-to-br from-[#FFF1DA] via-[#FFF9F0] to-[#DDEEF9]">
        <div className="mx-auto max-w-[1240px] px-4 py-16 md:px-6 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-leaf-ink">
            {L("Why it matters", "Vì sao quan trọng")}
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold">
            {L(
              "Three pressures meet on every field",
              "Ba áp lực gặp nhau trên mỗi thửa ruộng",
            )}
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {challenges.map((c) => (
              <article
                key={c.title}
                className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]"
              >
                <c.art className="block h-auto w-full" />
                <div className="p-6">
                  <h3 className="flex items-center gap-2.5 text-lg font-semibold">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.tone}`}
                    >
                      <c.icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    {c.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* DATA */}
      <div className="relative bg-gradient-to-br from-[#DCEDF8] via-[#EAF5F1] to-[#E2F2E6]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-contours"
        />
        <section className="relative mx-auto max-w-[1240px] px-4 py-16 md:px-6 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-leaf-ink">
                {L(
                  "Powered by Earth observations",
                  "Dựa trên quan sát Trái Đất",
                )}
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                {L(
                  "Real data, honest limits",
                  "Dữ liệu thật, giới hạn minh bạch",
                )}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                {L(
                  "NASA missions describe the climate and land conditions around your farm. They do not measure or predict the soil health of an individual field. Soil Time Machine combines these regional observations with transparent agronomic rules to explore scenarios — and labels every number as observed, estimated, illustrative or unavailable.",
                  "Các sứ mệnh NASA mô tả khí hậu và điều kiện mặt đất quanh trang trại của bạn. Chúng không đo hay dự báo sức khỏe đất của từng thửa ruộng. Soil Time Machine kết hợp số liệu theo vùng này với các quy tắc nông học minh bạch để khám phá kịch bản — và ghi nhãn mọi con số là quan trắc, ước tính, minh họa hoặc chưa có dữ liệu.",
                )}
              </p>
              <Link
                href="/methodology"
                className={buttonClass("outline", "md", "mt-5")}
              >
                {L("Read the methodology", "Xem phương pháp")}
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {sources.map((s, i) => (
                <li
                  key={s.name}
                  className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[var(--shadow-card)] backdrop-blur"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${["bg-amber-soft text-amber-ink", "bg-water-soft text-water-ink", "bg-[#DDF1EE] text-[#1C6159]", "bg-risk-soft text-risk-ink", "bg-[#F3E9DC] text-earth-ink"][i % 5]}`}
                    >
                      <s.icon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-[11px] text-ink-3">{s.scale}</p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-ink-2">
                    {s.what}
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-forest">
                    {s.use}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[1240px] px-4 pb-20 pt-16 md:px-6">
        <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-forest-deep via-forest to-[#2F7A50] px-6 py-10 text-white shadow-[var(--shadow-float)] md:flex-row md:items-center md:px-10 md:py-14">
          <IlloFieldScene
            tone="dark"
            className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[62%] opacity-80 md:block [mask-image:linear-gradient(to_right,transparent,black_35%)]"
          />
          <div className="relative">
            <h2 className="text-2xl font-bold md:text-3xl">
              {L(
                "Your next harvest starts with today's decisions.",
                "Vụ mùa tới bắt đầu từ quyết định hôm nay.",
              )}
            </h2>
            <p className="mt-2 text-sm text-mint/85">
              {L(
                "Your farm profile stays in this browser. Data providers receive the location or place name needed for your lookup.",
                "Hồ sơ ruộng được lưu trên trình duyệt này. Dịch vụ dữ liệu nhận vị trí hoặc tên địa điểm khi cần tra cứu.",
              )}
            </p>
          </div>
          <div className="relative flex flex-wrap gap-3">
            <Link
              href="/setup"
              className={buttonClass(
                "primary",
                "lg",
                "bg-white text-forest hover:bg-mint",
              )}
            >
              {L("Start Exploring", "Bắt đầu khám phá")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <button
              onClick={startDemo}
              className={buttonClass(
                "outline",
                "lg",
                "border-white/30 bg-transparent text-white hover:bg-white/10",
              )}
            >
              {L("Open demo farm", "Mở trang trại mẫu")}
            </button>
          </div>
        </div>
        <footer className="mt-10 flex flex-col justify-between gap-3 text-xs text-ink-3 md:flex-row">
          <p>
            Soil Time Machine · NASA Space Apps Challenge{" "}
            {L("prototype", "nguyên mẫu")}
          </p>
          <p>
            {L(
              "Not affiliated with or endorsed by NASA. Data: NASA POWER, NASA GIBS, EOX Sentinel-2 cloudless, ISRIC SoilGrids, © OpenStreetMap.",
              "Không liên kết hay được NASA bảo trợ. Dữ liệu: NASA POWER, NASA GIBS, EOX Sentinel-2 cloudless, ISRIC SoilGrids, © OpenStreetMap.",
            )}
          </p>
        </footer>
      </section>
    </div>
  );
}
