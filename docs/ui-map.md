# Bản đồ giao diện: sửa từng phần

Tài liệu này cho biết mỗi phần giao diện nằm ở file nào, để bạn sửa từng phần một mà không phải lục cả codebase.

## Chạy app để xem trực tiếp

```bash
npm run dev
```

Mở http://localhost:3000. Lưu file là trang tự tải lại (hot reload). Muốn có dữ liệu mẫu thì bấm **Try Interactive Demo** ở trang chủ.

Mỗi trang trong app chia thành các tab con. Bạn mở thẳng một tab bằng `#id` trên URL, ví dụ `/overview#weather`. Cột "Link" bên dưới dùng cách này.

## 1. Phần dùng chung (sửa một chỗ, đổi cả app)

| Thứ cần đổi | File |
|---|---|
| Màu, font, bóng, animation (design tokens) | [app/globals.css](../app/globals.css), khối `@theme` |
| Font chữ (Inter, Exo 2), tiêu đề tab trình duyệt | [app/layout.tsx](../app/layout.tsx) |
| Thanh menu trên cùng, thanh tab dưới (mobile), mục menu | [components/app-shell.tsx](../components/app-shell.tsx), mảng `NAV` |
| Button, Card, Badge, Input, Select, Skeleton, SectionTitle | [components/ui/primitives.tsx](../components/ui/primitives.tsx) |
| Header ảnh đầu trang (`PageHeader`), thanh tab con (`SectionTabs`), `StatTile` | [components/ui/sections.tsx](../components/ui/sections.tsx) |
| Tooltip, Popover, Sheet (ngăn kéo), Slider, Switch, Toast | [components/ui/overlays.tsx](../components/ui/overlays.tsx) |
| Logo, nút đổi ngôn ngữ, các badge trạng thái, thông báo demo | [components/common.tsx](../components/common.tsx) |
| Khung biểu đồ, màu trục và lưới, tooltip biểu đồ | [components/charts.tsx](../components/charts.tsx) |
| Thẻ chỉ số | [components/metric-card.tsx](../components/metric-card.tsx) |
| Hình minh họa SVG | [components/illustrations.tsx](../components/illustrations.tsx) |
| Ảnh NASA (nền) | `public/images/` (nguồn ảnh ghi trong `CREDITS.md`) |
| Câu chữ EN/VI | Viết ngay trong component dạng `L("English", "Tiếng Việt")`, một số chuỗi chung ở [lib/i18n/messages.ts](../lib/i18n/messages.ts) |

> **Lưu ý:** `--color-scn-a..d` (màu kịch bản) đã được kiểm tra cho người mù màu. Không đổi các màu này.

## 2. Từng trang

### Trang chủ: `/`. File [components/landing/landing.tsx](../components/landing/landing.tsx)
| Phần | Dòng (khoảng) |
|---|---|
| Hero: tiêu đề + nút | ~185 |
| Quả địa cầu xoay | [components/landing/hero-earth.tsx](../components/landing/hero-earth.tsx) |
| Facts (dải số liệu) | ~235 |
| How it works | ~250 |
| Why it matters (ảnh đồng bằng Mekong) | ~274 |
| Data | ~307 |
| Final CTA | ~344 |

### Thiết lập ruộng: `/setup`. File [components/setup/setup-wizard.tsx](../components/setup/setup-wizard.tsx)
Có 4 bước: `step === 0` (~338), `1` (~498), `2` (~694), `3` (~754).

### Ruộng của tôi: `/overview`. File [components/overview/overview.tsx](../components/overview/overview.tsx)
Có 2 tab lớn (`HeroTabs` trong `ui/sections.tsx`). Tab Thông tin đất hiện thẻ tóm tắt trước, bấm vào thẻ thì mở chi tiết. Thẻ, biểu đồ mini và dải nguồn dữ liệu nằm ở [overview/field-info.tsx](../components/overview/field-info.tsx).

| Tab / chi tiết | Link | Component con |
|---|---|---|
| Bản đồ ruộng | `/overview#map` | [map/map-explorer.tsx](../components/map/map-explorer.tsx), [map/farm-map.tsx](../components/map/farm-map.tsx), [map/layer-panel.tsx](../components/map/layer-panel.tsx) |
| Thông tin đất (4 thẻ + nguồn dữ liệu) | `#info` | `field-info.tsx` (`InfoCard`, `RainSpark`, `SoilVisual`, `ExtremesVisual`, `RiskStrip`, `SourcesBand`). Thẻ nhận prop `image` để đặt ảnh nền |
| → chi tiết Mưa & nhiệt độ | `#weather` | `charts.tsx`, [overview/climate-trend.tsx](../components/overview/climate-trend.tsx) |
| → chi tiết Đất & độ ẩm | `#soil` | `charts.tsx` (`SoilWetnessChart`), `metric-card.tsx` |
| → chi tiết Thời tiết khắc nghiệt | `#extremes` | [insights.tsx](../components/insights.tsx), [overview/weather-crosscheck.tsx](../components/overview/weather-crosscheck.tsx) |
| → chi tiết Rủi ro trong năm | `#risk` | `field-info.tsx` (`RiskDetail`), bảng đầy đủ: `insights.tsx` (`RiskCalendar`) |
| → chi tiết Nguồn dữ liệu | `#sources` | [overview/farm-evidence.tsx](../components/overview/farm-evidence.tsx) |

### Mô phỏng 5 năm: `/simulator`. File [components/sim/simulator.tsx](../components/sim/simulator.tsx)
| Tab | Link | Dòng | Component con |
|---|---|---|---|
| Kết quả | `#results` | ~728 | [sim/outcomes.tsx](../components/sim/outcomes.tsx), [sim/soil-profile.tsx](../components/sim/soil-profile.tsx) |
| Vì sao | `#why` | ~741 | [sim/why-panel.tsx](../components/sim/why-panel.tsx) |
| Lịch | `#calendar` | ~770 | [sim/timeline.tsx](../components/sim/timeline.tsx) (`RotationGantt`) |
| Bằng chứng | `#evidence` | ~806 | `insights.tsx` (`EvidencePanel`) |
| Bản đồ | `#map` | ~829 | `map/*` |
| Biểu đồ | `#charts` | ~961 | [sim/sim-charts.tsx](../components/sim/sim-charts.tsx), [sim/soil-carbon.tsx](../components/sim/soil-carbon.tsx) |
| Chỉnh luân canh | `#edit` | ~1005 | [sim/rotation-builder.tsx](../components/sim/rotation-builder.tsx) (kéo-thả) |

### So sánh: `/compare`. File [components/compare/compare.tsx](../components/compare/compare.tsx)
`#cards` ~246 · `#weights` ~424 · `#charts` ~491 · `#table` ~541 · `#evidence` ~600 · `#why` ~613

### Kế hoạch mùa vụ: `/planner`. File [components/planner/planner.tsx](../components/planner/planner.tsx)
`#calendar` ~288 · `#seasons` ~297 · `#years` ~410 · `#notes` ~444

### Hướng dẫn: `/learn`. File [components/learn.tsx](../components/learn.tsx)
`#start` ~95 · `#glossary` ~116 · `#satellite` ~158 · `#crops` ~208 · `#experts` ~233

### Nguồn dữ liệu: `/methodology`. File [components/methodology.tsx](../components/methodology.tsx)
### Cài đặt: `/settings`. File [components/settings.tsx](../components/settings.tsx)

## 3. Quy trình đề xuất khi sửa một phần

1. Mở đúng tab bằng link `#id` ở trên.
2. Sửa file tương ứng. Nếu chỉ đổi màu hay kiểu dáng mà muốn áp dụng cho cả app, sửa token trong `globals.css` hoặc primitive trong `components/ui/` thay vì sửa từng chỗ.
3. Kiểm tra cả **EN và VI** (nút đổi ngôn ngữ trên menu), vì câu tiếng Việt thường dài hơn.
4. Kiểm tra trên **mobile**: thanh tab dưới và layout một cột.
5. Commit mỗi phần riêng để dễ quay lại nếu cần.

Ghi chú kỹ thuật: dự án dùng Next.js 16 và Tailwind CSS v4. Tailwind v4 cấu hình bằng `@theme` trong CSS, **không** có `tailwind.config.js`. Tài liệu Next đi kèm nằm ở `node_modules/next/dist/docs/`.
