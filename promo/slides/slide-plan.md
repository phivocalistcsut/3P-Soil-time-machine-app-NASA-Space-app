# Soil Time Machine: 7 slide thuyết trình (sau video)

File dựng sẵn: `soil-time-machine-closing.pptx` (16:9, 13.33 × 7.5 in).
Ảnh xem trước từng slide: thư mục `preview/`. Ảnh gốc (nền, dải vệ tinh, ảnh chụp app, QR): thư mục `assets/`. Font: thư mục `fonts/`.

**Phong cách:** kiểu tạp chí, lấy ảnh làm chủ. Mỗi slide có một ảnh vệ tinh NASA hoặc ảnh ISS tràn viền. Chữ đặt thẳng lên ảnh, có bóng mờ để dễ đọc, không đặt trong khung. Tiêu đề tô màu một từ khóa.

## Font

| Dùng cho | Font | Tên trong PowerPoint / Canva |
|---|---|---|
| Tiêu đề, con số lớn, tên mục | Exo 2 Bold | `Exo 2` (in đậm) |
| Chữ thường | Inter Regular | `Inter` |
| Nhãn nhỏ, kicker, nhãn thanh | Inter SemiBold | `Inter SemiBold` |

Giống font của app (`app/layout.tsx`). Cả hai đều là Google Fonts, giấy phép OFL, có sẵn trong Canva. Nếu máy khác mở file `.pptx` mà thấy chữ bị đổi font, cài 4 file trong `fonts/` (nhấp đúp, chọn Install).

## Đưa vào Canva

1. Canva → **Create a design → Import file** → chọn `soil-time-machine-closing.pptx`.
2. So từng slide với ảnh trong `preview/`. Nếu Canva báo thiếu "Inter SemiBold", chọn chữ đó rồi đổi sang **Inter**, độ đậm **Semi Bold**.
3. **Bóng chữ có thể bị mất khi import.** Nếu chữ trên ảnh khó đọc, vào **Effects → Shadow**, chọn kiểu nhẹ (Blur ~10, Transparency ~45%).
4. Nếu ảnh nền bị mất, tải lên lại từ `assets/` (bảng ở dưới) rồi chọn **Set image as background**.
5. Lời thoại nằm trong **Notes** của từng slide. Khi thuyết trình, dùng **Present → Presenter view**.

## Màu (theo app)

| Vai trò | Mã |
|---|---|
| Nền | `#0A121C` |
| Chữ chính / phụ / chú thích | `#FFFFFF` / `#D5DDD8` / `#9AA6A0` |
| Lime (nhấn chính) | `#8DC63F`, sáng `#A8DC5C` |
| Nước | `#4A94C7`, sáng `#6CB2E0` |
| Đất | `#C49B6C`, nền đất `#2A2016` |
| Cam (đạm) | `#E4A84C` |
| Đỏ (rủi ro) | `#D97167` |

---

## Slide 1 · Mở đầu

- **Nền:** ảnh ISS chụp sông Hậu (đồng bằng Mekong), tối dần sang trái
- NASA SPACE APPS · TEAM 3P (lime, chữ giãn rộng)
- **SOIL TIME MACHINE** (Exo 2, 70pt)
- Try new crop rotations **before** changing the field (từ "before" màu lime)
- Icon mầm cây · For Mekong Delta rice farmers and farm advisers

**Animation:** tiêu đề *Rise* → phụ đề *Fade* (theo click).

> **Lời thoại:** Thank you for watching. Soil Time Machine helps Mekong Delta rice farmers and farm advisers try out new crop rotations before making changes in the field.

## Slide 2 · Dữ liệu: dải phim 4 ảnh vệ tinh

- **Nền:** VIIRS Black Marble, đèn đêm Đông Nam Á
- **Tiêu đề:** Four NASA datasets, one **five-year** view
- **Dải phim:** 4 dải ảnh dọc, sát nhau và tràn mép trái lẫn mép dưới slide. Mỗi dải là ảnh thật từ NASA GIBS, tên đặt đè ở chân dải:
  - **NASA POWER** · Weather (cam): nhiệt độ không khí MERRA-2, 01/2026 (`strip-weather.jpg`)
  - **GPM IMERG** · Rainfall (xanh nước): mưa ngày 14/10/2025 (`strip-rain.jpg`)
  - **SMAP** · Soil moisture (nâu đất): độ ẩm đất ngày 01/09/2025 (`strip-soil.jpg`)
  - **MODIS** · Vegetation (lime): NDVI đồng bằng Mekong, 02/2026 (`strip-vegetation.jpg`)
- **Ảnh app:** 5-Year Simulator trong khung trình duyệt, **tràn ra mép phải**, đổ bóng sâu
- **Dưới ảnh app:** → Compare planting plans over 5 years

**Animation:** 4 dải *Rise* lần lượt từ trái sang phải (cách nhau ~0.2s, chạy theo lời đọc "NASA POWER… IMERG… SMAP… MODIS") → khung app *Fade* khi nói "compare planting plans".

> **Lời thoại:** We use NASA POWER for weather, IMERG for rain, SMAP for soil moisture, and MODIS for vegetation. We then compare planting plans over five years.

## Slide 3 · Nước

- **Nền:** Blue Marble Next Generation, bán đảo Đông Dương
- THỚI LAI DEMO (kicker xanh nước)
- **Tiêu đề:** Less **water** to irrigate
- **~40%** (Exo 2, 165pt, xanh nước sáng) đặt thẳng lên ảnh, bên dưới là "less irrigation water"
- **2 thanh dạng viên thuốc:** Rice, three crops a year (thanh xám-xanh, dài hết chiều ngang) · Soybean + green manure (thanh xanh nước dài 60%, phần còn lại là khung nét đứt ghi −40%)
- **Ảnh app:** Compare Plans trong khung trình duyệt, tràn ra mép phải
- **Thẻ trích dẫn FAO-56** (dạng viên thuốc, icon quyển sách) dưới ảnh app: **FAO-56** · Allen et al., FAO Paper 56 (1998). Dòng 2: "Our ET₀ code passes FAO-56 worked Example 17". Đây là bằng chứng cho con số nước. Bài kiểm thử này được ghi trong `docs/landing-and-p1-review.md`: ví dụ 17, Bangkok tháng 4, ET₀ = 5,72 mm/ngày.
- *Model estimate · Thới Lai demo farm · 5-year average*

**Animation:** ~40% *Rise* (hoặc *Pop* nhẹ) → 2 thanh *Wipe* từ trái sang → ảnh app *Fade* → thẻ FAO-56 *Fade*.

> **Lời thoại:** In our Thới Lai demo, the model suggests about forty percent less irrigation water…
> *(chuyển slide ngay trước "roughly half as much nitrogen")*

## Slide 4 · Đạm và carbon: một lát cắt đất trọn bề ngang

- **Nền:** ảnh màu tự nhiên MODIS Terra của đồng bằng Mekong, 27/01/2026
- THỚI LAI DEMO (kicker nâu đất)
- **Tiêu đề:** Half the **nitrogen** (cam), less **carbon** (lime) lost
- **Đường mặt đất** chạy ngang hết slide. Bên dưới là lớp đất nâu sẫm `#2A2016`, có 2 vân lớp đất nét đứt
- **Bên trái, trên mặt đất:** vòng tròn tô cam một nửa, giữa vòng ghi **~½**, đặt "nằm" trên mặt đất. Bên cạnh: "as much nitrogen fertilizer" · "Soybean + green manure rotation"
- **Bên phải:** "Soil carbon lost over 5 years" · "Lower is better · bars show direction, not exact size"
  - Icon bông lúa (đỏ) và icon mầm cây (lime) đứng trên mặt đất
  - Hai thanh **cắm xuống đất**: thanh lúa ba vụ dài, thanh luân canh ngắn, bên dưới có chữ "less loss"
  - **Không ghi số**, vì giá trị carbon tuyệt đối của RothC có độ tin cậy thấp
- **Bằng chứng cho phần carbon, nằm trong lớp đất bên trái:** trang bìa bài *RothC: A model for the turnover of carbon in soil, Model Description* (Coleman, Prout & Milne, Rothamsted Research, 02/2024). Ảnh được đặt nghiêng −3°, phía sau có một tờ giấy lót nghiêng +4° và đổ bóng (`assets/paper-rothc.png`). Bên cạnh ghi:
  - SOIL CARBON MODEL · **RothC · Rothamsted Research**
  - "Our engine matches the official RothC_Py output over 828 months (max. difference 1.1×10⁻¹² t C/ha)." Lấy từ `docs/prompts/00-rothc-shared-context.md` và bài kiểm thử `scripts/rothc.test.ts`.
- *Model estimates · Thới Lai demo farm · 5-year average · soil carbon from RothC*

**Animation:** vòng ~½ *Fade* → khi nói "less carbon loss", hai thanh *Wipe* từ trên xuống (như cắm vào đất) → bìa RothC *Rise*.

> Bài RothC được đặt ở slide 4, không phải slide 3, vì RothC là mô hình carbon đất. Con số nước ở slide 3 được tính bằng FAO-56.

> **Lời thoại:** …and roughly half as much nitrogen for a rotation with soybean and green manure, averaged over five years. It also shows less carbon loss than growing rice three times a year.

## Slide 5 · Độ tin cậy

- **Nền:** ảnh ISS chụp rìa Trái Đất
- **Tiêu đề:** Standard methods, **honest** limits
- **Thanh tiến độ:** 3 icon tròn. FAO-56 (xanh nước) và RothC (lime) tô đặc, nối với nhau bằng nét liền lime. Icon cờ của Real farms chỉ có **viền nét đứt cam**, nối bằng nét đứt cam
- **3 cột chữ đặt thẳng trên ảnh, căn giữa, không khung:**
  - STANDARD METHOD · **FAO-56**: Water calculations: crop water use from daily weather
  - VERIFIED · **RothC**: Core soil-carbon calculations match the official monthly test results
  - NOT YET TESTED · **Real farms** (gạch chân nét đứt cam): We still need to test how well the tool works in real fields

**Animation:** 3 cột *Rise* lần lượt theo lời đọc. Cột "Real farms" có thể để thêm *Blink* nhẹ 1 lần cho icon cờ.

> **Lời thoại:** We use FAO-56 for water calculations. Our core RothC calculations match the official monthly test results, but we still need to test how well the tool works on real farms.

## Slide 6 · Bước tiếp theo

- **Nền:** ảnh ISS chụp bình minh, cắt sao cho vệt chân trời nằm ngay dưới 3 icon
- **Tiêu đề:** A small **field trial** with a cooperative
- 3 icon tròn lime tô đặc, nối bằng mũi tên nét đứt
- **Số 01 · 02 · 03 rất lớn** (150pt, trắng mờ ~9%) nằm phía sau từng tiêu đề bước
  - **Partner**: Run a small trial with a farming cooperative
  - **Measure**: Track water use, fertilizer use and soil carbon
  - **Improve**: Update the tool with field results and farmer feedback

**Animation:** từng bước *Rise* theo click, mũi tên *Wipe* từ trái sang giữa các bước.

> **Lời thoại:** Our next step is to run a small field trial with a cooperative. We'll measure water and fertilizer use and start tracking soil carbon. We'll use these results and feedback from farmers to improve the tool.

## Slide 7 · Kết

- **Nền:** ảnh ISS chụp vầng sáng trên chân trời Trái Đất
- "Farmers make the final choice." (trắng) / "We help them see the trade-offs." (lime), Exo 2 46pt
- **Thank you** · Team 3P · Soil Time Machine · NASA Space Apps
- **Thẻ trắng có mã QR** dẫn tới https://3-p-soil-time-machine-app-nasa-spac.vercel.app, kèm dòng "Try the demo"
- *Có thể thêm tên thành viên dưới dòng "Team 3P".*

**Animation:** câu trắng *Fade* → câu lime *Fade* → thẻ QR *Rise*.

> **Lời thoại:** Farmers make the final choice. We help them see the trade-offs. That's the end of our presentation!

---

## Gợi ý chung cho animation trong Canva

- Chỉ dùng **Fade**, **Rise** hoặc **Wipe**. Tốc độ vừa phải (~0.5–0.8s). Mỗi slide tối đa 2–3 bước.
- Chuyển giữa các slide dùng **Dissolve**. Riêng slide 3 → 4 có thể dùng **Match & Move**, vì "THỚI LAI DEMO" và tiêu đề nằm cùng một vị trí.
- Bấm click cho từng bước theo lời thoại, không để tự chạy.

## Nguồn hình ảnh

| Slide | Ảnh | Nguồn | File |
|---|---|---|---|
| 1 | Sông Hậu, đồng bằng Mekong | NASA / ISS (`public/images/mekong-delta.webp`) | `bg-title-mekong.jpg` |
| 2 | Đèn đêm Đông Nam Á | NASA GIBS `VIIRS_Black_Marble` | `bg-data-blackmarble.jpg` |
| 2 | 4 dải vệ tinh | NASA GIBS: `MERRA2_2m_Air_Temperature_Monthly` (01/2026), `IMERG_Precipitation_Rate` (14/10/2025), `SMAP_L4_Analyzed_Surface_Soil_Moisture` (01/09/2025), `MODIS_Terra_NDVI_8Day` (02/2026); nền `BlueMarble_ShadedRelief_Bathymetry` + `Coastlines_15m` | `strip-*.jpg` |
| 3 | Bán đảo Đông Dương | NASA GIBS `BlueMarble_NextGeneration` | `bg-water-bluemarble.jpg` |
| 4 | Đồng bằng Mekong | NASA GIBS `MODIS_Terra_CorrectedReflectance_TrueColor`, 27/01/2026, đã tăng tương phản | `bg-soil-delta.jpg` |
| 5 | Rìa Trái Đất | NASA / ISS (`earth-limb.webp`) | `bg-trust-limb.jpg` |
| 6 | Bình minh từ quỹ đạo | NASA / ISS (`orbital-sunrise.webp`) | `bg-next-sunrise.jpg` |
| 7 | Vầng sáng trên chân trời | NASA / ISS (`space-horizon.webp`) | `bg-closing-horizon.jpg` |
| 4 | Bìa tài liệu RothC | Coleman, Prout & Milne, *RothC Model Description*, Rothamsted Research, 02/2024 ([PDF](https://www.rothamsted.ac.uk/sites/default/files/Documents/RothC_description.pdf)). Ảnh chụp do team cung cấp. | `paper-rothc.png` |

- Ảnh NASA nói chung không bị ràng buộc bản quyền tại Mỹ (xem `public/images/CREDITS.md`). Không dùng logo NASA.
- Ảnh GIBS được tải ngày 15/11/2026 từ gibs.earthdata.nasa.gov (dịch vụ công khai, không cần key). Các bản đồ mưa, độ ẩm đất và nhiệt độ chỉ để minh họa: không có thang màu, nên không đọc ra giá trị cụ thể.
- Ảnh chụp app lấy từ bản demo đang chạy, với demo farm Thới Lai, ngày 15/11/2026. Các ảnh kế hoạch chưa xác nhận bản quyền chỉ xuất hiện nhỏ bên trong ảnh chụp màn hình app.
