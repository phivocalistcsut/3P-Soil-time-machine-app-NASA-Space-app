# Báo cáo triển khai dữ liệu RothC — prompt 01

Ngày thực hiện: 14/11/2026 (Asia/Saigon). Branch: `claude/zealous-bell-e9rpld`.

## Phạm vi đã triển khai

Đã đọc README, AGENTS.md, cấu trúc route/provider, hợp đồng kiểu dữ liệu, wizard, demo/snapshot, Zustand persistence, luồng khí hậu và engine dùng chung. Đã đọc hướng dẫn Next.js được đóng gói trong `node_modules/next/dist/docs/` trước khi sửa Next/React. Tài liệu RothC tháng 02/2024 được tải từ Rothamsted để đối chiếu đầu vào và DPM/RPM.

- SoilGrids: 11 request WCS song song, 3 lớp SOC/sét/dung trọng; giữ pH/cát và các trường cũ ở 0–5 cm. Thêm SOC stock, sét 0–30 cm, các lớp và nhãn estimated; thiếu lớp trả null độc lập.
- Hồ sơ: thêm `clayPercent`, `socStockTCHa`, nhãn nguồn tương ứng; wizard cho nhập số đo, ưu tiên observed; hồ sơ cũ được bổ sung null/unavailable khi nạp lại.
- Demo: dùng snapshot SoilGrids thật; các giá trị đất của demo mới có nhãn estimated. Thông tin ruộng/ranh giới vẫn là minh họa.
- Cây trồng: đủ 9 mục `rothc`, nhãn estimated, công thức và nguồn trong `lib/data/crops.ts`. Giữ `soilPoints` cho prompt 03.
- Chưa triển khai công thức phân giải, spin-up, biến thể ruộng ngập hay thay chỉ số đất; đó là phạm vi prompt 02/03.

## Kết quả SoilGrids thật tại Thới Lai

Tọa độ 10.0706, 105.5599; snapshot `2026-11-14T04:08:15.822Z`:

| Trường | Giá trị | Nhãn |
| --- | ---: | --- |
| `socStockTCHa` (0–30 cm) | 90.1155 t C/ha | estimated |
| `clayPercent0to30` (lưu thành `FarmProfile.clayPercent`) | 37.1833333333% | estimated |
| SOC lớp 0–5 cm | 36.9 g/kg = 3.69% | estimated |
| pH / cát lớp 0–5 cm | 6.0 / 22.7% | estimated |
| Texture từ bộ phân loại hiện có | loam | estimated |

Stock chưa trừ đá sỏi thô. Chi tiết từng lớp, chuyển đổi đơn vị và so sánh Watanabe nằm trong [data-and-validation.md](data-and-validation.md#rothc-data-preparation-prompt-01-14-november-2026). Bài Watanabe được cung cấp ghi 35.1 g total C/kg ở 0–10 cm của ô thí nghiệm, không xác nhận mức trung bình vùng 24.9 g/kg trong prompt.

## Nguồn và phép tính cho từng cây

Các giá trị dưới đây là **ước tính t C/ha/vụ**, không phải dự báo năng suất. `Ydm = Y × DRY`; `AG = Ydm × RAG`; `BG = (Ydm + AG) × RS`; `C = (AG × retained + BG) × CF`. Với khoai lang, BG chỉ bằng `AG × RS` theo chú thích f của IPCC, không tính củ thu hoạch vào phần rễ trả lại đất.

| Cây | Y, t/ha | DRY | RAG | RS | CF | Phần AG giữ lại | residueCTHa | Nguồn và giả định cụ thể |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| rice | 6.2979672082 | 0.89 | 1.4 | 0.16 | 0.4144 | 0.056 | 1.074058593 | Y = (545891+415169+377976)/212614 từ [S1]; hệ số [S2], CF [S3]; chỉ rễ + gốc rạ, tỷ lệ gốc rạ chuyển từ Hu [S5]; rơm thu hoạch lấy đi/đốt theo [S6], không cộng carbon tro/than. |
| maize | 5.831 | 0.87 | 1.0 | 0.22 | 0.4709 | 1 | 3.439960665 | Y [S1]; hệ số [S2], CF [S3]. Giữ toàn bộ phụ phẩm theo mặc định không lấy đi khi chưa có dữ liệu quản lý [S2]. |
| mungbean | 1.38 | 0.91 | 2.1 | 0.19 | 0.47 | 1 | 1.587117714 | Y trung bình 5 giống Chợ Mới, An Giang, bảng 6 [S7]; nhóm Beans and Pulses [S2]; CF thực vật thân thảo [S4]. |
| soybean | 2.012 | 0.91 | 2.1 | 0.19 | 0.47 | 1 | 2.313971624 | Y [S1], hàng Soybeans [S2]; CF chung [S4]. |
| peanut | 1.763 | 0.94 | 1.0 | 0.22 | 0.47 | 1 | 1.121606496 | Y [S1], DRY/RAG hàng Peanuts [S2]. Hàng này thiếu RS: dùng RS chung theo chú thích e; CF chung [S4]; không tính quả thu hoạch. |
| sesame | 1.0 | 0.85 | 1.0 | 0.22 | 0.47 | 1 | 0.575280000 | Y giống DH1 đối chứng ở ĐBSCL [S8]; DRY/RAG/RS hàng generic crops [S2], CF chung [S4]. |
| sweetpotato | 12.491 | 0.22 | 0.4 | 0.20 | 0.4226 | 1 | 0.557430361 | Y [S1]; nhóm Potatoes and Tubers + chú thích f [S2]; CF khoai tây [S3] chuyển sang khoai lang; giữ dây lá và rễ không phải củ, không cộng củ loại chưa đo. |
| sesbania | — | — | — | 0.22 | 0.47 | 1 | 2.637640000 | 4.6 t chất khô thân lá/ha ở 60 ngày [S9]; rễ = 4.6×0.22 theo RS chung [S2], CF [S4]; vùi toàn bộ. Chuyển ước tính 60 ngày sang cây 55 ngày trong danh mục, không tự tạo hệ số hiệu chỉnh tuổi. |
| fallow | — | — | — | — | — | — | 0 | Định nghĩa đất nghỉ trống, không tính cỏ tự mọc; RothC §2.1 [S10]. |

Tất cả dùng `dpmRpm = 1.44`, mặc định cây nông nghiệp theo RothC §1.3 [S10]; Sesbania ở đây là cây phân xanh hàng năm, không dùng tỷ lệ cây gỗ. Tỷ lệ không ảnh hưởng đầu vào fallow bằng 0. Các CF chung và hệ số chuyển nhóm không được trình bày như số đo ĐBSCL. Mặc định giữ toàn bộ phụ phẩm cây cạn dựa trên quy tắc không lấy đi khi thiếu dữ liệu của IPCC, cần điều chỉnh nếu có khảo sát quản lý phụ phẩm.

- **[S1]** [Cục Thống kê Cần Thơ, số liệu KTXH 2024, bảng 4](https://thongkecantho.gso.gov.vn/uploads/files/2025_01_cantho_so%20lieu%20ktxh%20nam%202024_02_1_2025.pdf). Dùng cột ước tính 2024; đổi tạ/ha sang tấn/ha. Năng suất lúa tính từ tổng sản lượng chia tổng diện tích thu hoạch ba vụ.
- **[S2]** [IPCC 2019 Refinement, Vol.4 Ch.11](https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch11_Soils_N2O_CO2.pdf), Table 11.1a, Eq.11.6–11.7, p.11.16–11.18. Bảng này có DRY/RAG/RS và hàm lượng **N**, không cung cấp CF carbon; CF lấy riêng bên dưới.
- **[S3]** [IPCC Good Practice Guidance 2000, Ch.4, Table 4.16](https://www.ipcc-nggip.iges.or.jp/public/gp/english/4_Agriculture.pdf): CF rơm lúa 0.4144, ngô 0.4709, khoai tây 0.4226; dùng CF phụ phẩm làm proxy cho rễ, khoai tây làm proxy cho khoai lang.
- **[S4]** [IPCC 2006, Vol.4 Ch.6 §6.2.1.4](https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/4_Volume4/V4_06_Ch6_Grassland.pdf): CF thực vật thân thảo 0.47, chuyển sang các phụ phẩm/rễ chưa có CF riêng.
- **[S5]** [Hu et al. (2018), Carbon Management 9(6):619–629](https://doi.org/10.1080/17583004.2018.1526625), Eq.5: gốc rạ lúa bằng 5.6% sinh khối rơm. Thí nghiệm Trung Quốc; đây là hệ số chuyển vùng, không phải số đo địa phương. Chỉ lấy tỷ lệ gốc rạ; tỷ lệ rễ vẫn lấy IPCC.
- **[S6]** [Hong Van et al. (2015), Soil Science and Plant Nutrition 61:719–735](https://doi.org/10.1080/00380768.2015.1041862). DOI trong prompt là bài **2015**; bài dẫn một khảo sát 2014 khác. Dùng để xác định giả định quản lý rơm theo mùa, không coi là tỷ lệ đốt phổ quát cho mọi ruộng.
- **[S7]** [So sánh 5 giống đậu xanh triển vọng, ĐH Cần Thơ (2004), bảng 6](https://sj.ctu.edu.vn/ql/docgia/download/baibao-4853/fn_19_lvdung.pdf): năng suất trung bình 1.38 t/ha trong thí nghiệm Chợ Mới.
- **[S8]** [Bùi Quang Đỉnh và cộng sự (2018), Tạp chí KH&CN Nông nghiệp Việt Nam 8(93)](https://tapchi.vaas.vn/sites/tapchi.vaas.vn/files/tapchi/2021-08/tc20-2018_1.pdf): DH1 10 tạ/ha trong thí nghiệm ĐBSCL.
- **[S9]** [Beri, Meelu & Khind (1989), Tropical Agriculture 66(3)](https://journals.sta.uwi.edu/ojs/index.php/ta/article/view/1864): sinh khối chất khô thân lá Sesbania 4.6 t/ha ở 60 ngày, thí nghiệm Ấn Độ.
- **[S10]** [Coleman, Prout & Milne, RothC Model Description, 02/2024](https://www.rothamsted.ac.uk/sites/default/files/Documents/RothC_description.pdf), §1.3 và §2.1.

## Toàn bộ TODO(source)

Không dùng số tùy chọn để lấp dữ liệu thiếu. Những chỗ dưới đây đã có nguồn mặc định/chuyển vùng nhưng cần nguồn địa phương cụ thể hơn; ghi chú tương ứng nằm ngay trong code:

1. `lib/data/crops.ts`, rice: kiểm chứng tỷ lệ gốc rạ 5.6% với chiều cao cắt và cách thu hoạch ở ĐBSCL.
2. `lib/data/crops.ts`, peanut: thay RS chung bằng số đo rễ đậu phộng địa phương.
3. `lib/data/crops.ts`, sesame: thay DRY/RAG/RS chung bằng số đo mè địa phương.
4. `lib/data/crops.ts`, sesbania: sinh khối và rễ địa phương đúng tuổi vùi 55 ngày.
5. `docs/data-and-validation.md`: tìm nguồn sơ cấp xác nhận mức trung bình vùng 24.9 g/kg được nêu trong prompt; không gán số này cho Watanabe khi chưa xác minh.

Giới hạn bổ sung: CF thân thảo chung, CF chuyển từ khoai tây và CF rễ là proxy đã ghi nguồn; chưa có kiểm chứng cấp thửa ruộng. Snapshot SoilGrids không phải xét nghiệm đất. Dữ liệu RothC chưa tham gia điểm đất cho tới prompt 02/03.

## Kiểm tra

- `npm test`: 12/12 đạt, gồm GeoTIFF giả có georeference và công thức tính tay.
- `npm run lint`: đạt.
- Production build: đạt với `$env:CIRCLE_NODE_TOTAL='2'; npm run build` (1 worker). Build mặc định 11 worker bị Windows `EPERM` khi tạo thư mục prerender; không đổi cấu hình sản phẩm để né lỗi máy chạy.
- API production `/api/soil?lat=10.0706&lon=105.5599`: HTTP 200 trong 13.006 giây; `socStockTCHa=90.1155`, `clayPercent0to30=37.18333333333333`, đủ 3 lớp, `retrievedAt=2026-11-14T04:16:53.267Z`, khớp snapshot; nằm trong `maxDuration=25`.
- `npm run engine:smoke`: đạt, đủ ba kịch bản với khí hậu baseline/drier.
- Gọi lại API cùng tọa độ: HTTP 200, `cached=true`, khoảng 0.251 giây; tọa độ sai (`lat=91`) trả HTTP 400. Script snapshot từ chối tọa độ khác để không ghi nhầm vào bản lưu Thới Lai.
