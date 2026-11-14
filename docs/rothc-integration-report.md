# Báo cáo tích hợp RothC — prompt 03

Ngày kiểm tra: 14/11/2026. Engine **0.5.0**. Nhánh làm việc **Phuong**, theo yêu cầu đổi tên nhánh trong cuộc trò chuyện. Trước khi sửa đã fetch và fast-forward từ origin/main tới **6b65484fe2e7b93ae1a0376e72b14e39415faced**, gồm cả prompt 01 và prompt 02.

## Kết quả và luồng tính

Đã thay chỉ số đất định tính bằng cân bằng carbon hàng tháng RothC. Simulator, Compare, Planner, trang đầu, biểu đồ, giải thích và bảng bằng chứng cùng đọc một kết quả SOC. Đơn vị là **t C/ha, lớp 0–30 cm**; đây là ước tính có độ tin cậy thấp, không phải SOC đo thực địa. Các chuỗi mới có cả EN/VI trong lib/i18n/messages.ts.

lib/engine/soil-carbon.ts dựng đầu vào từ PreparedClimate sau khi áp giả định khí hậu, dùng nhiệt độ, mưa và ET0 trung bình của từng tháng lịch. Bốc hơi chảo = et0Day × số ngày lịch / 0.75, kể cả tháng 2 năm nhuận. Năm vụ dùng **tháng 12 năm trước đến tháng 11 năm được ghi**; xoay cả khí hậu và lịch cây nhất quán. Pool spin-up vì vậy là trạng thái cuối tháng 11, không phải cuối tháng 12 của ví dụ RothC gốc.

Che phủ lấy nguyên monthlyCover của engine; không viết lại cách xác định cây trội trong tháng. Hai năm kề được tính thêm cho lịch che phủ và kiểm tra chồng vụ, để không mất cây gieo tháng 11 hoặc kéo qua ranh giới. Phần đạm của vụ hiển thị đầu tiên vẫn dùng previousCropId nông dân khai báo. Tàn dư + rễ giữ lại được cộng cuối tháng có ngày sinh trưởng cuối cùng của vụ (tháng thu hoạch/vùi). Tàn dư tháng 1 của cây trồng năm trước được chuyển đúng sang năm sau. Spin-up lặp chu kỳ hiện trạng nên đầu vào thu hoạch vượt ranh giới được xoay về cùng chu kỳ. Nếu nhiều cây trả C cùng tháng, trộn khối lượng DPM và RPM rồi mới lấy tỷ lệ. **FYM = 0**, vì chưa có trường nông dân nhập phân chuồng.

Chỉ có hai nhóm dataset đầu vào đã chốt: **NASA POWER** (thời tiết 0.5° × 0.625°, bức xạ khoảng 1°; IMERG 0.1° thay mưa khi đủ toàn kỳ) và **ISRIC SoilGrids 2.0** (250 m). Số đo đất của nông dân có ưu tiên. Không đưa NDVI hoặc SMAP vào RothC. SoilGrids gộp 0–5, 5–15, 15–30 cm; chưa hiệu chỉnh đá sỏi thô. Xem chi tiết nguồn tàn dư và các TODO(source) ở [báo cáo dữ liệu](rothc-data-report.md).

Một inverse spin-up duy nhất trong mỗi lần runEngine dùng **luân canh hiện tại + khí hậu nền**, đất sét 0–30 cm và SOC đầu kỳ. Mọi phương án, hiện trạng và baselineClimate dùng chung pool và TSMD ban đầu. Các năm sau mang tiếp pool/TSMD; không spin-up lại theo khí hậu tương lai. Thiếu đất sét/SOC, thiếu đủ khí hậu 12 tháng hoặc hiện trạng hoàn toàn bỏ hoang không có đầu vào C để xác định inverse spin-up thì kết quả đất là null/unavailable, đóng góp đất bằng 0 và trọng số còn lại được chuẩn hóa lại.

### Quy ước thời gian để xử lý hai yêu cầu mâu thuẫn

File 03 vừa yêu cầu chạy forward horizon + 1 năm và lấy SOC cuối từng năm, vừa yêu cầu năm isBaselineYear khớp stock ban đầu với sai số <1%. Với tàn dư hiện trạng chỉ đạt khoảng 40,5% đầu vào cân bằng, chạy thêm một năm forward ngay tại mốc sẽ làm SOC giảm hơn 3%, không thể đồng thời thỏa hai yêu cầu mà không tự chỉnh tàn dư.

Triển khai giữ **horizon + 1 mốc hiển thị**: 2026 là SOC ngay sau spin-up (Δ = 0), rồi chạy forward 5 chu kỳ tháng 12–11 để có SOC cuối tháng 11/2027…2031. Đây là điều chỉnh có chủ ý so với câu “forward horizon + 1 năm”, để giữ đúng năm gốc và không ép đầu vào cân bằng. UI, methodology, assumptions, smoke và kiểm thử đều nêu cùng quy ước. Các chỉ tiêu nước của năm gốc vẫn mô tả lịch hiện trạng của năm đó.

## Công thức và biến thể ruộng lúa

- Pool hoạt tính DPM/RPM/BIO/HUM có k = 10 / 0.3 / 0.66 / 0.02 năm⁻¹; IOM không phân giải. Carbon còn lại sau một tháng = C × exp(−a·b·c·p·k/12).
- a = 47.91 / [1 + exp(106.06/(T+18.27))], bằng 0 khi T < −5 °C. TSMD tối đa = −(20+1.3·sét−0.01·sét²) × 30/23; cân bằng tháng dùng mưa − 0.75 × bốc hơi chảo. Giới hạn đất trống = 0.556 × TSMD tối đa; b = 1 trên 0.444 × tối đa, nếu không b = 0.2 + 0.8 × (tối đa−TSMD)/(tối đa−0.444×tối đa). c = 0.6 có cây, 1 đất trống.
- x = 1.67 × [1.85+1.6·exp(−0.0786·sét)] = CO₂/(BIO+HUM). Carbon phân giải chia x/(1+x) cho CO₂, còn lại 46% BIO / 54% HUM. IOM = 0.049 × SOC^1.139 theo Falloon và cs. (1998). Không tính tuổi ¹⁴C.
- Shirato & Yokozawa (2005), Hình 2 và Bảng 3: nhân thêm **p = 0.2 trong vụ lúa**, **0.6 các tháng còn lại của ruộng lúa**, kể cả cây vụ đông. Đất cạn không có lịch sử lúa dùng 1. Đây là hệ số tối ưu chung của chín ô ở Nhật, không phải hệ số đã được kiểm chứng cho ĐBSCL. Tối ưu riêng từng ô thay đổi 0–0.5 và 0.25–1 (Bảng 4).
- Tháng cây trội là lúa ngập theo monthlyCover dùng paddyFlooded. Năm có lúa và những năm sau được coi là ruộng lúa đã tháo nước ngoài vụ; chuyển hẳn sang đất cạn chưa có tham số lịch sử. Đặt TSMD = 0 khi ngập là **mở rộng do app thêm cho lúa tưới**, không quy cho bài báo. Không suy lịch ngập thực địa từ lượng mưa.
- RothC gốc loại trừ đất ngập thường xuyên; biến thể paddy và lịch theo tháng chỉ là kịch bản cần chuyên gia kiểm chứng. Không sửa engine prompt 02 hoặc bộ số liệu tham chiếu để làm kết quả đẹp hơn.

SOC thay đổi = SOC cuối kỳ − SOC đầu. %/năm = 100 × thay đổi / (SOC đầu × số năm đã qua), **trung bình tuyến tính, không phải tăng trưởng kép**. Mức 1 <−0.4%; mức 2 từ −0.4% đến −0.1% gồm hai đầu; mức 3 >−0.1% và <+0.1%; mức 4 từ +0.1% đến dưới +0.4%; mức 5 ≥+0.4%. Mốc +0.4% dựa vào định hướng 4 per 1000; các ngưỡng còn lại là lựa chọn minh bạch của app, không phải ranh giới nông học đã được xác nhận. Điểm = clamp(50 + 125 × %/năm, 0, 100); tiêu chí đất = 0.7 × điểm + 0.3 × điểm đa dạng. Khi đất unavailable, loại toàn bộ tiêu chí đất.

## Smoke: SOC theo năm

Lệnh npm run engine:smoke; JSON tái tạo bằng node --import tsx scripts/engine-smoke.ts --json. Bảng dùng createDemoFarm(), snapshot POWER đi kèm repo và ba phương án tạo dưới khí hậu nền, rồi giữ nguyên luân canh khi đổi khí hậu. Trình duyệt có thể dùng IMERG đầy đủ nên số trên UI có thể khác bảng snapshot này. Đất demo: SOC **90.1155 t C/ha**, sét **37.1833333333%**, SoilGrids ước tính tại Thới Lai.

- Hiện trạng: lúa/lúa/lúa, lặp hàng năm.
- A — Climate fit: đậu xanh/lúa/lúa, chu kỳ 1 năm.
- B — Water-Aware: điền thanh/lúa/lúa, rồi đậu xanh/lúa/lúa, chu kỳ 2 năm.
- C — Soil Restoration: đậu nành/lúa/lúa, rồi điền thanh/lúa/lúa, chu kỳ 2 năm. Tên chiến lược không bảo đảm SOC tăng.

Đơn vị mọi ô: **t C/ha ở 0–30 cm**. Năm 2026 là mốc đầu, không phải một năm forward. Không kiểm thử theo kỳ vọng tự đặt về chiều SOC giữa các phương án.

### Nền lịch sử

| Năm | Hiện trạng | A | B | C |
| --- | ---: | ---: | ---: | ---: |
| 2026 | 90.1155 | 90.1155 | 90.1155 | 90.1155 |
| 2027 | 86.9427 | 87.5215 | 88.0038 | 87.9280 |
| 2028 | 84.9755 | 85.9959 | 86.3960 | 86.8145 |
| 2029 | 83.3574 | 84.7257 | 85.5457 | 85.8078 |
| 2030 | 81.9981 | 83.6493 | 84.3393 | 85.0423 |
| 2031 | 80.8316 | 82.7212 | 83.7944 | 84.2958 |

### Khô hơn: mưa −20%, T +0,5 °C

| Năm | Hiện trạng | A | B | C |
| --- | ---: | ---: | ---: | ---: |
| 2026 | 90.1155 | 90.1155 | 90.1155 | 90.1155 |
| 2027 | 86.8547 | 87.5749 | 88.0553 | 87.9819 |
| 2028 | 84.8266 | 86.0908 | 86.4906 | 86.9089 |
| 2029 | 83.1642 | 84.8522 | 85.6709 | 85.9366 |
| 2030 | 81.7710 | 83.8010 | 84.4920 | 85.1965 |
| 2031 | 80.5774 | 82.8936 | 83.9671 | 84.4741 |

### Ẩm hơn: mưa +20%

| Năm | Hiện trạng | A | B | C |
| --- | ---: | ---: | ---: | ---: |
| 2026 | 90.1155 | 90.1155 | 90.1155 | 90.1155 |
| 2027 | 86.9427 | 87.5007 | 87.9831 | 87.9071 |
| 2028 | 84.9755 | 85.9596 | 86.3593 | 86.7778 |
| 2029 | 83.3574 | 84.6775 | 85.4968 | 85.7584 |
| 2030 | 81.9981 | 83.5918 | 84.2806 | 84.9829 |
| 2031 | 80.8316 | 82.6560 | 83.7277 | 84.2278 |

### Nóng hơn: T +1,5 °C

| Năm | Hiện trạng | A | B | C |
| --- | ---: | ---: | ---: | ---: |
| 2026 | 90.1155 | 90.1155 | 90.1155 | 90.1155 |
| 2027 | 86.6806 | 87.3148 | 87.7912 | 87.7212 |
| 2028 | 84.5337 | 85.6403 | 86.0319 | 86.4498 |
| 2029 | 82.7857 | 84.2571 | 85.0617 | 85.3246 |
| 2030 | 81.3276 | 83.0921 | 83.7641 | 84.4604 |
| 2031 | 80.0819 | 82.0916 | 83.1403 | 83.6355 |

### Tự chọn: mưa −10%, T +1 °C

| Năm | Hiện trạng | A | B | C |
| --- | ---: | ---: | ---: | ---: |
| 2026 | 90.1155 | 90.1155 | 90.1155 | 90.1155 |
| 2027 | 86.7673 | 87.4453 | 87.9237 | 87.8520 |
| 2028 | 84.6794 | 85.8657 | 86.2614 | 86.6796 |
| 2029 | 82.9736 | 84.5543 | 85.3659 | 85.6302 |
| 2030 | 81.5475 | 83.4454 | 84.1269 | 84.8273 |
| 2031 | 80.3275 | 82.4908 | 83.5518 | 84.0529 |

Mọi chuỗi demo đều giảm với bộ đầu vào hiện có; mức giảm khác nhau theo cân bằng tàn dư, che phủ, nước và khí hậu. Đây là phép thử chức năng, **không phải kiểm chứng SOC thực địa**. Đầu vào cân bằng inverse = **7.9647807350 t C/ha/năm**, tàn dư hiện trạng = **3.2221757776**, tương ứng **40.4553%** và thiếu **59.5447%**. Không nhân tàn dư cho khớp. Soil score bị clamp ở 0 khi giảm quá 0.4%/năm; vì vậy đọc cả SOC và thông tin đầu vào, không chỉ xếp hạng tổng hợp.

## Khoảng trống cần chuyên gia địa phương

1. Đo SOC, bulk density và đất sét cùng độ sâu 0–30 cm tại ruộng; xác nhận đại diện của pixel 250 m, ngày đo, đá sỏi và lịch sử canh tác. SOC ban đầu không mặc nhiên ở cân bằng.
2. Giải thích chênh lệch **7.96 so với 3.22 t C/ha/năm**: lượng rơm lấy đi/đốt/vùi, gốc rạ, rễ, tiết rễ, bồi phù sa, hữu cơ khác và khả năng trạng thái hiện tại không cân bằng. Không tự coi thiếu hụt này là khuyến cáo bón một lượng phân.
3. Kiểm tra năng suất và khối lượng khô từng giống, tỷ lệ C, tỷ lệ rễ, chiều cao cắt, tỷ lệ giữ tàn dư. Các giả định chuyển từ IPCC và nguồn ngoài ĐBSCL vẫn là estimated; đặc biệt tỷ lệ gốc rạ 5.6% chuyển vùng và sinh khối cây phân xanh. DPM/RPM mặc định 1.44 cần dữ liệu chất lượng tàn dư nếu muốn hiệu chỉnh.
4. Xác nhận tháng/ngày cấy, thu hoạch, vùi, đất có cây, ngập, tháo nước và chuyển đổi lâu dài. monthlyCover chọn cây che phủ trội, không biểu diễn số ngày ngập hoặc nhiều cây cùng tháng; ví dụ hiện trạng demo chỉ có chín tháng cây trội là lúa. Cần đo/nhập lịch ngập để thay xấp xỉ này.
5. Kiểm chứng hệ số paddy 0.2/0.6 và mở rộng TSMD = 0 với đất nhiệt đới có tưới. Chưa mô hình methane, độ sâu nước, phèn, mặn, làm đất hay vận chuyển carbon hòa tan; không suy lợi ích khí hậu tổng thể chỉ từ SOC.
6. So sánh với chuỗi SOC đo lặp lại, không chỉ khớp stock spin-up. Khí hậu ô vùng và trung bình tháng không phản ánh biến động từng năm hoặc độ bất định mô hình. Chưa có dải tin cậy SOC được hiệu chỉnh địa phương.
7. TODO(source) từ prompt 01: con số trung bình ĐBSCL 24.9 g/kg chưa tìm được trong Watanabe và cs. (2017); bài đó báo 35.1 g tổng C/kg ở 0–10 cm tại một ruộng thí nghiệm. Không dùng 24.9 làm chuẩn hiệu chỉnh SOC.

## Kiểm tra kỹ thuật

- npm test: **31/31** qua, gồm 828 tháng tham chiếu RothC gốc, spin-up, bảo toàn C, tích hợp deterministic, mốc đầu <1%, đất thiếu và không xác định, lịch tháng 12–11/năm nhuận/thu hoạch qua năm, FYM = 0 và ngưỡng điểm.
- npm run lint: qua. npm run build: qua với CIRCLE_NODE_TOTAL=2 và UV_THREADPOOL_SIZE=1. Đây là biến môi trường cho lỗi EPERM khi tạo thư mục prerender song song trên Windows sandbox; không thay cấu hình app hay tắt bảo vệ hệ thống.
- npm run engine:smoke: qua cho cả năm giả định khí hậu; các bảng ở trên là output thực.
- Kiểm tra thủ công bằng npm run dev: đã mở simulator, compare, methodology ở cả EN/VI và chụp đủ sáu ảnh toàn trang, hai ảnh thẻ SOC và một ảnh biểu đồ. Xác nhận Compare có SOC hiện trạng và cả A/B/C; simulator năm gốc hiển thị 90.12 t C/ha, Δ = 0; bảng biểu đồ dùng giá trị SOC số thay vì level. Nhãn estimated, nguồn 0–30 cm, giới hạn, chênh lệch đầu vào và giải thích tàn dư/che phủ/ngập đều hiển thị. Không có lỗi console trong lần kiểm tra. Ảnh trong bộ deliverable mang tên rothc-{simulator,compare,methodology}-{en,vi}.jpg, rothc-soil-card-{en,vi}.jpg và rothc-chart-vi.jpg.
- Đã tìm trong components/lib/scripts: không còn logic soilPointsFor, soilLevel, SOIL_MEMORY_NEW, SOIL_LEVEL_THRESHOLDS, agronomicProperties.soilPoints hay khóa asm.soilMemory. Tài liệu prompt cũ và báo cáo lịch sử vẫn giữ nguyên để truy vết.

## Nguồn chính

- [Coleman, Prout & Milne, RothC Model Description (02/2024)](https://www.rothamsted.ac.uk/sites/default/files/Documents/RothC_description.pdf): mô hình gốc, pan × 0.75, độ sâu TSMD, pool và giới hạn đất ngập.
- [Shirato & Yokozawa (2005)](https://doi.org/10.1111/j.1747-0765.2005.tb00046.x): biến thể paddy, Hình 2/Bảng 3/Bảng 4.
- [Falloon và cs. (1998)](https://doi.org/10.1016/S0038-0717(97)00256-3): quan hệ IOM.
- [4 per 1000](https://4p1000.org/decouvrir/): định hướng +0.4%/năm cho lớp đất bề mặt, không phải bảo đảm hoặc chuẩn áp dụng cho mọi ruộng.
