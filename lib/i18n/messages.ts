/**
 * Shared, key-based messages (engine explanations, assumptions, sources, labels).
 * UI copy that appears once lives next to its component via L(en, vi).
 */
export const MESSAGES: Record<string, { en: string; vi: string }> = {
  "geo.searching": { en: "Looking up the address…", vi: "Đang tìm vị trí…" },
  "geo.choose": { en: "Several places match. Choose the correct one to move the map.", vi: "Có nhiều địa điểm phù hợp. Chọn đúng địa điểm để bản đồ di chuyển tới." },
  "geo.located": { en: "Map moved to {name}. Check the pin and click the exact field location.", vi: "Đã đưa bản đồ tới {name}. Kiểm tra rồi bấm đúng vị trí thửa ruộng." },
  "geo.notConfigured": { en: "Online address search is not set up. Use a suggested place or enter coordinates.", vi: "Tìm địa chỉ trực tuyến chưa sẵn sàng. Bạn có thể chọn địa danh gợi ý hoặc nhập tọa độ." },
  "geo.unavailable": { en: "Address search is temporarily unavailable. Suggestions below are approximate local reference points.", vi: "Hiện chưa kết nối được dịch vụ tìm địa chỉ. Các gợi ý bên dưới là vị trí tham khảo trong danh mục có sẵn." },
  "geo.hint": { en: "Press Enter to search. A unique match moves the map automatically; otherwise choose a result. Rural fields may need a manual pin or boundary.", vi: "Nhấn Enter để tìm. Nếu chỉ có một kết quả, bản đồ tự di chuyển tới; nếu có nhiều kết quả, hãy chọn địa điểm. Với ruộng không có địa chỉ, bạn có thể ghim điểm hoặc vẽ ranh giới." },
  // data status
  "status.observed": { en: "Observed", vi: "Quan trắc" },
  "status.estimated": { en: "Estimated", vi: "Ước tính" },
  "status.illustrative": { en: "Illustrative", vi: "Minh họa" },
  "status.unavailable": { en: "Unavailable", vi: "Chưa có dữ liệu" },
  "status.observed.tip": {
    en: "Real historical observations or reanalysis retrieved from a named data service.",
    vi: "Số liệu lịch sử thật (quan trắc hoặc tái phân tích) lấy từ dịch vụ dữ liệu được ghi rõ.",
  },
  "status.estimated.tip": {
    en: "Computed by this tool from data plus documented assumptions. Not a measurement.",
    vi: "Được công cụ tính từ dữ liệu cùng các giả định đã công bố. Không phải số đo.",
  },
  "status.illustrative.tip": {
    en: "Demonstration example only — Illustrative Demo Data, not real satellite measurements.",
    vi: "Chỉ để minh họa — Dữ liệu demo, không phải số đo vệ tinh thật.",
  },
  "status.unavailable.tip": {
    en: "Not enough evidence to show a value.",
    vi: "Chưa đủ cơ sở để hiển thị giá trị.",
  },
  "conf.high": { en: "High confidence", vi: "Độ tin cậy cao" },
  "conf.medium": { en: "Medium confidence", vi: "Độ tin cậy trung bình" },
  "conf.low": { en: "Low confidence", vi: "Độ tin cậy thấp" },

  // classes
  "stress.0": { en: "Low", vi: "Thấp" },
  "stress.1": { en: "Moderate", vi: "Vừa" },
  "stress.2": { en: "High", vi: "Cao" },
  "stress.3": { en: "Very high", vi: "Rất cao" },
  "suit.good": { en: "Good fit", vi: "Phù hợp tốt" },
  "suit.fair": { en: "Fair fit", vi: "Tương đối phù hợp" },
  "suit.poor": { en: "Poor fit", vi: "Kém phù hợp" },
  "div.low": { en: "Low diversity", vi: "Đa dạng thấp" },
  "div.moderate": { en: "Moderate diversity", vi: "Đa dạng vừa" },
  "div.high": { en: "High diversity", vi: "Đa dạng cao" },
  "soil.1": { en: "SOC decline > 0.4%/yr", vi: "SOC giảm trên 0,4%/năm" },
  "soil.2": { en: "SOC decline 0.1–0.4%/yr", vi: "SOC giảm 0,1–0,4%/năm" },
  "soil.3": { en: "SOC approximately stable", vi: "SOC gần ổn định" },
  "soil.4": { en: "SOC gain 0.1–0.4%/yr", vi: "SOC tăng 0,1–0,4%/năm" },
  "soil.5": { en: "SOC gain ≥ 0.4%/yr", vi: "SOC tăng ≥ 0,4%/năm" },

  // criteria
  "crit.soil": { en: "Improve soil health", vi: "Cải thiện sức khỏe đất" },
  "crit.water": { en: "Reduce irrigation demand", vi: "Giảm nhu cầu tưới" },
  "crit.drought": { en: "Lower drought exposure", vi: "Giảm rủi ro hạn" },
  "crit.income": { en: "Maintain income stability", vi: "Giữ thu nhập ổn định" },
  "crit.inputs": { en: "Reduce input costs", vi: "Giảm chi phí đầu vào" },
  "crit.climate": { en: "Crop–climate suitability", vi: "Phù hợp khí hậu" },
  "crit.soil.short": { en: "Soil", vi: "Đất" },
  "crit.water.short": { en: "Water", vi: "Nước" },
  "crit.drought.short": { en: "Drought", vi: "Hạn" },
  "crit.income.short": { en: "Income", vi: "Thu nhập" },
  "crit.inputs.short": { en: "Inputs", vi: "Đầu vào" },
  "crit.climate.short": { en: "Climate fit", vi: "Khí hậu" },

  // climate assumptions
  "clim.baseline": { en: "Historical baseline", vi: "Như lịch sử" },
  "clim.drier": { en: "Drier than usual", vi: "Khô hơn bình thường" },
  "clim.wetter": { en: "Wetter than usual", vi: "Ẩm hơn bình thường" },
  "clim.warmer": { en: "Warmer", vi: "Nóng hơn" },
  "clim.baseline.def": { en: "Uses the historical NASA POWER record as is.", vi: "Dùng nguyên chuỗi số liệu lịch sử NASA POWER." },
  "clim.drier.def": { en: "Rainfall −20%, temperature +0.5 °C in every month.", vi: "Lượng mưa −20%, nhiệt độ +0,5 °C mọi tháng." },
  "clim.wetter.def": { en: "Rainfall +20% in every month.", vi: "Lượng mưa +20% mọi tháng." },
  "clim.warmer.def": { en: "Temperature +1.5 °C in every month; rainfall unchanged.", vi: "Nhiệt độ +1,5 °C mọi tháng; lượng mưa giữ nguyên." },
  "clim.custom": { en: "Your own test", vi: "Tự chọn" },
  "clim.custom.def": { en: "Rainfall {rain}, temperature {temp} in every month (your sliders).", vi: "Lượng mưa {rain}, nhiệt độ {temp} mọi tháng (theo thanh trượt)." },

  // soil / farm enums
  "tex.clay": { en: "Clay", vi: "Đất sét" },
  "tex.silty_clay": { en: "Silty clay", vi: "Đất sét mịn" },
  "tex.clay_loam": { en: "Clay loam", vi: "Đất thịt nặng" },
  "tex.loam": { en: "Loam", vi: "Đất thịt trung bình" },
  "tex.sandy_loam": { en: "Sandy loam", vi: "Đất thịt nhẹ" },
  "tex.sand": { en: "Sand", vi: "Đất cát" },
  "drain.good": { en: "good", vi: "tốt" },
  "drain.moderate": { en: "moderate", vi: "trung bình" },
  "drain.poor": { en: "poor", vi: "kém" },
  "sal.none": { en: "none", vi: "không có" },
  "sal.occasional": { en: "occasional", vi: "thỉnh thoảng" },
  "sal.frequent": { en: "frequent", vi: "thường xuyên" },
  "src.canal": { en: "Canal / river", vi: "Kênh / sông" },
  "src.groundwater": { en: "Groundwater well", vi: "Giếng nước ngầm" },
  "src.pond": { en: "Farm pond", vi: "Ao chứa" },
  "src.rainfed": { en: "Rain-fed only", vi: "Chỉ nhờ nước mưa" },
  "avail.abundant": { en: "Abundant", vi: "Dồi dào" },
  "avail.moderate": { en: "Moderate", vi: "Vừa phải" },
  "avail.limited": { en: "Limited", vi: "Hạn chế" },
  "water.very_high": { en: "Very high water", vi: "Cần rất nhiều nước" },
  "water.high": { en: "High water", vi: "Cần nhiều nước" },
  "water.moderate": { en: "Moderate water", vi: "Cần nước vừa" },
  "water.low": { en: "Low water", vi: "Cần ít nước" },
  "water.none": { en: "No irrigation", vi: "Không tưới" },

  // suitability factors
  "factor.temperature.name": { en: "Temperature", vi: "Nhiệt độ" },
  "factor.heat.name": { en: "Heat stress", vi: "Sốc nhiệt" },
  "factor.waterlogging.name": { en: "Waterlogging", vi: "Ngập úng" },
  "factor.soil.name": { en: "Soil", vi: "Đất" },
  "factor.salinity.name": { en: "Salinity", vi: "Mặn" },
  "factor.calendar.name": { en: "Season", vi: "Mùa vụ" },
  "factor.temperature": { en: "Mean temperature {t} °C vs. optimal {min}–{max} °C.", vi: "Nhiệt độ trung bình {t} °C so với khoảng tối ưu {min}–{max} °C." },
  "factor.heat": { en: "Mid-season mean daily maximum ≈ {tmax} °C (heat-stress threshold {thr} °C).", vi: "Nhiệt độ cao nhất trung bình giữa vụ ≈ {tmax} °C (ngưỡng sốc nhiệt {thr} °C)." },
  "factor.waterlogging": { en: "Wettest month ≈ {p} mm of rain with {drainage} drainage.", vi: "Tháng mưa nhiều nhất ≈ {p} mm, thoát nước {drainage}." },
  "factor.soil": { en: "{texture} soil, pH {ph} (crop range {phMin}–{phMax}).", vi: "{texture}, pH {ph} (cây chịu được {phMin}–{phMax})." },
  "factor.salinity": { en: "Dry-season salinity intrusion: {risk}.", vi: "Xâm nhập mặn mùa khô: {risk}." },
  "factor.calendar": { en: "Planting season compared with this crop's usual calendar.", vi: "Mùa trồng so với lịch thời vụ thông thường của cây." },

  // risks
  "risk.heat": { en: "Heat stress around flowering", vi: "Sốc nhiệt lúc trổ/ra hoa" },
  "risk.waterlogging": { en: "Waterlogging in wet months", vi: "Ngập úng vào tháng mưa nhiều" },
  "risk.salinity": { en: "Dry-season salinity intrusion", vi: "Xâm nhập mặn mùa khô" },
  "risk.smapWetMonths": { en: "Regional SMAP history is wet during this crop. Check field drainage.", vi: "Lịch sử SMAP cho thấy vùng này ẩm trong vụ. Kiểm tra thoát nước tại ruộng." },
  "risk.calendar": { en: "Outside usual planting season", vi: "Ngoài lịch thời vụ thông thường" },
  "risk.dryYear": { en: "In dry years, demand may exceed water supply", vi: "Năm khô hạn, nhu cầu có thể vượt nguồn nước" },
  "risk.rainfed": { en: "Rain-fed: rainfall may not cover crop needs", vi: "Chỉ nhờ mưa: mưa có thể không đủ cho cây" },
  "risk.overlap": { en: "Overlaps with the next crop — adjust planting month", vi: "Chồng lấn với vụ sau — chỉnh tháng gieo trồng" },

  // sources
  "src.waterDemand": {
    en: "FAO-56 Penman–Monteith ET0 from NASA POWER monthly data × FAO-56 crop coefficients − FAO/AGLW effective rainfall (+ paddy percolation and land preparation).",
    vi: "ET0 Penman–Monteith (FAO-56) từ số liệu tháng NASA POWER × hệ số cây trồng FAO-56 − mưa hữu hiệu FAO/AGLW (+ thấm và làm đất cho lúa nước).",
  },
  "src.waterRisk": {
    en: "Seasonal irrigation need compared with the assumed seasonal supply for your water source and availability.",
    vi: "So sánh nhu cầu tưới theo vụ với lượng nước giả định có thể cấp theo nguồn nước và mức sẵn có của bạn.",
  },
  "src.suitability": {
    en: "Rule-based screen of temperature, heat, waterlogging, soil, salinity and season against crop ranges (limiting factor weighted 60%).",
    vi: "Sàng lọc theo quy tắc: nhiệt độ, sốc nhiệt, ngập úng, đất, mặn và mùa vụ so với ngưỡng của cây (yếu tố hạn chế chiếm 60%).",
  },
  "src.diversity": {
    en: "Shannon diversity index of crops over the last 3 crop years (current practice counted for early years).",
    vi: "Chỉ số đa dạng Shannon của cây trồng trong 3 năm gần nhất (tính cả cách canh tác hiện tại ở những năm đầu).",
  },
  "src.soil": {
    en: "RothC monthly SOC balance at 0–30 cm; one baseline-climate inverse spin-up from supplied soil stock (farmer measurement or SoilGrids), then crop-residue inputs under the selected climate. Estimated, low confidence.",
    vi: "Cân bằng SOC hàng tháng theo RothC ở 0–30 cm; spin-up nghịch một lần với khí hậu nền từ trữ lượng đất được cung cấp (nông dân đo hoặc SoilGrids), sau đó dùng đầu vào tàn dư cây dưới khí hậu đã chọn. Ước tính, độ tin cậy thấp.",
  },
  "src.nitrogen": {
    en: "Typical crop N requirement minus legume credit from the previous crop (illustrative regional values).",
    vi: "Nhu cầu đạm điển hình của cây trừ phần đạm cây họ đậu vụ trước để lại (giá trị minh họa theo vùng).",
  },
  "src.economics": {
    en: "Gross margin = yield × price − cost from supplied inputs; demo inputs remain illustrative. Revenue is reduced 15% for fair and 40% for poor climate fit.",
    vi: "Lãi gộp = năng suất × giá − chi phí theo đầu vào được cung cấp; số liệu demo là minh họa. Doanh thu giảm 15% nếu khí hậu tương đối phù hợp và 40% nếu kém phù hợp.",
  },

  // assumptions
  "asm.et0": {
    en: "Reference ET0 uses FAO-56 Penman–Monteith with monthly NASA POWER temperature, diurnal range, humidity, wind and solar radiation.",
    vi: "ET0 tham chiếu theo FAO-56 Penman–Monteith với nhiệt độ, biên độ ngày, độ ẩm, gió và bức xạ hàng tháng của NASA POWER.",
  },
  "asm.peff": {
    en: "Effective rainfall: 0.8·P − 25 when P > 75 mm/month, else 0.6·P − 10 (FAO/AGLW).",
    vi: "Mưa hữu hiệu: 0,8·P − 25 khi P > 75 mm/tháng, ngược lại 0,6·P − 10 (FAO/AGLW).",
  },
  "asm.flood": {
    en: "Flooded rice adds percolation (1.5–10 mm/day by soil texture) and 150–250 mm land preparation per season.",
    vi: "Lúa nước cộng thêm lượng thấm (1,5–10 mm/ngày tùy sa cấu đất) và 150–250 mm làm đất mỗi vụ.",
  },
  "asm.supply": {
    en: "Seasonal water supply assumed: abundant 1000 mm, moderate 550 mm, limited 300 mm; reduced for salinity in dry seasons.",
    vi: "Nguồn nước giả định mỗi vụ: dồi dào 1000 mm, vừa 550 mm, hạn chế 300 mm; giảm khi có mặn trong mùa khô.",
  },
  "asm.rothc": { en: "SOC starts at the shared inverse-spin-up stock; future values are end-of-crop-year estimates (December–November). Pan evaporation = ET0/day × calendar days ÷ 0.75; FYM = 0 because none was entered.", vi: "SOC bắt đầu từ cùng trữ lượng sau spin-up nghịch; các giá trị tương lai là ước tính cuối năm vụ (tháng 12–11). Bốc hơi chảo = ET0/ngày × số ngày lịch ÷ 0,75; FYM = 0 vì chưa có số nhập." },
  "asm.rothcGap": { en: "Equilibrium carbon input can differ from estimated crop residues. The difference is disclosed; residues are never rescaled to force equilibrium.", vi: "Đầu vào carbon cân bằng có thể khác tàn dư cây ước tính. Chênh lệch được công bố; không tự chỉnh tàn dư để ép cân bằng." },
  "asm.noStorage": {
    en: "Monthly water balance with no soil-water carry-over between months (conservative).",
    vi: "Cân bằng nước theo tháng, không tính nước trữ trong đất chuyển sang tháng sau (thận trọng).",
  },

  // why panel
  "why.baselineYear": {
    en: "This is today's baseline. Every scenario starts from your current practice ({pattern}).",
    vi: "Đây là năm hiện tại. Mọi kịch bản đều bắt đầu từ cách canh tác hiện nay của bạn ({pattern}).",
  },
  "why.swap": {
    en: "{season}: {from} → {to} changes the irrigation need by {delta} mm.",
    vi: "{season}: {from} → {to} làm nhu cầu tưới thay đổi {delta} mm.",
  },
  "why.swapFlood": {
    en: "{season}: {from} → {to} avoids ponding, percolation and land-preparation water ({delta} mm).",
    vi: "{season}: {from} → {to} không cần giữ nước, bù thấm và làm đất ngập ({delta} mm).",
  },
  "why.same": {
    en: "Same crops as your current practice this year, so water and suitability match the baseline.",
    vi: "Năm này trồng giống cách hiện tại, nên nhu cầu nước và mức phù hợp giống năm gốc.",
  },
  "why.climate": {
    en: "Under “{assumption}” ({def}) irrigation need is {delta} mm vs. historical conditions.",
    vi: "Với giả định “{assumption}” ({def}) nhu cầu tưới thay đổi {delta} mm so với điều kiện lịch sử.",
  },
  "why.rothc": { en: "SOC changed {delta} t C/ha since the previous year. This year returns an estimated {carbon} t C/ha in residues/green manure, with {cover} covered and {flood} flooded months.", vi: "SOC thay đổi {delta} t C/ha so với năm trước. Năm này trả lại khoảng {carbon} t C/ha từ tàn dư/phân xanh, có {cover} tháng che phủ và {flood} tháng ngập." },
  "why.rothcDrivers": { en: "Retained residues and incorporated green manure add carbon. Cover and the paddy factors slow modeled decomposition; SOC depends on their full carbon balance, not a reward or penalty for rice.", vi: "Tàn dư giữ lại và phân xanh vùi bổ sung carbon. Che phủ và hệ số ruộng lúa làm chậm phân giải trong mô hình; SOC phụ thuộc toàn bộ cân bằng carbon, không phải điểm thưởng hay phạt cho lúa." },
  "why.rothcClimate": { en: "The selected climate changes modeled SOC by {delta} t C/ha versus the same rotation under historical baseline climate.", vi: "Khí hậu đã chọn làm SOC mô phỏng chênh {delta} t C/ha so với cùng luân canh dưới khí hậu nền lịch sử." },
  "rothc.scoreLabel": { en: "SOC-change score", vi: "điểm thay đổi SOC" },
  "rothc.compactLimit": { en: "Low confidence · estimated inputs · paddy factors need local validation", vi: "Tin cậy thấp · đầu vào ước tính · cần kiểm chứng hệ số ruộng lúa tại địa phương" },
  "rothc.glossary": { en: "RothC estimates SOC stocks at 0–30 cm in t C/ha and changes from the initial stock. It combines farmer measurements or modeled SoilGrids soil with climate and estimated residues. These are low-confidence scenario estimates that need field SOC measurements and local calibration.", vi: "RothC ước tính trữ lượng SOC ở 0–30 cm theo t C/ha và chênh lệch so với đầu kỳ. Mô hình kết hợp đất nông dân đo hoặc SoilGrids, khí hậu và tàn dư ước tính. Đây là kịch bản có độ tin cậy thấp, cần đo SOC thực địa và hiệu chỉnh địa phương." },
  "rothc.residueColumn": { en: "Residue C, t C/ha/crop", vi: "C tàn dư, t C/ha/vụ" },
  "rothc.title": { en: "Soil organic carbon (RothC)", vi: "Carbon hữu cơ đất (RothC)" },
  "rothc.tradeoff": { en: "SOC {delta} t C/ha versus current practice", vi: "SOC chênh {delta} t C/ha so với hiện trạng" },
  "rothc.change": { en: "Δ {delta} t C/ha · {rate}%/yr vs initial stock", vi: "Δ {delta} t C/ha · {rate}%/năm so với trữ lượng đầu kỳ" },
  "rothc.depthSource": { en: "0–30 cm · RothC · POWER/IMERG · farmer/SoilGrids soil", vi: "0–30 cm · RothC · POWER/IMERG · đất nông dân đo/SoilGrids" },
  "rothc.limit": { en: "Low confidence: modeled soil and estimated residues. Paddy factors need local validation; original RothC excludes permanently waterlogged soil.", vi: "Độ tin cậy thấp: đất theo mô hình, tàn dư ước tính. Hệ số ruộng lúa cần kiểm chứng địa phương; RothC gốc không áp dụng cho đất ngập thường xuyên." },
  "rothc.missing": { en: "SOC unavailable: supply clay (%) and a positive SOC stock for 0–30 cm.", vi: "Chưa có SOC: cần tỷ lệ sét (%) và trữ lượng SOC dương cho lớp 0–30 cm." },
  "rothc.noInput": { en: "SOC unavailable: the current rotation supplies no crop carbon, so inverse spin-up is not identifiable.", vi: "Chưa có SOC: luân canh hiện tại không có đầu vào carbon cây trồng, chưa thể xác định spin-up nghịch." },
  "rothc.climateMissing": { en: "SOC unavailable: twelve complete monthly climate inputs are required.", vi: "Chưa có SOC: cần đủ đầu vào khí hậu cho 12 tháng." },
  "rothc.vsCurrent": { en: "{delta} t C/ha vs current practice", vi: "{delta} t C/ha so với cách đang trồng" },
  "rothc.sameAsCurrent": { en: "Same soil carbon as current practice", vi: "Carbon đất như cách đang trồng" },
  "rothc.allDecline": { en: "In this model every plan, including today's, slowly loses soil carbon. Compare the plans with each other rather than reading the absolute number.", vi: "Theo mô hình, mọi cách trồng, kể cả cách hiện tại, đều mất dần một ít carbon đất. Hãy so các cách trồng với nhau thay vì đọc con số tuyệt đối." },
  "rothc.whyDecline": { en: "Why does soil carbon fall in every plan?", vi: "Vì sao carbon đất giảm ở mọi cách trồng?" },
  "rothc.whyDeclinePlain": { en: "The straw and stubble the model assumes are left in the field supply only about {ratio}% of the carbon needed to hold today's soil-carbon estimate from SoilGrids, so the model drifts down until a field measurement says otherwise.", vi: "Lượng rơm rạ, gốc rạ mô hình giả định để lại ruộng chỉ bằng khoảng {ratio}% lượng carbon cần để giữ mức carbon đất SoilGrids ước tính hiện nay, nên mô hình giảm dần cho tới khi có số đo tại ruộng." },
  "rothc.gapTitle": { en: "Carbon-input information gap", vi: "Khoảng trống thông tin về đầu vào carbon" },
  "rothc.inputGap": { en: "Inverse spin-up requires {equilibrium} t C/ha/yr at equilibrium; current-practice residues supply {residues} ({ratio}% of that input).", vi: "Spin-up nghịch cần {equilibrium} t C/ha/năm để cân bằng; tàn dư hiện trạng cung cấp {residues} ({ratio}% lượng cần)." },
  "rothc.gapAction": { en: "Check field SOC, residue retention, harvest height and drainage history with a local expert. The model keeps this mismatch visible.", vi: "Cần chuyên gia địa phương kiểm tra SOC thực địa, tỷ lệ tàn dư giữ lại, chiều cao cắt và lịch sử thoát nước. Mô hình giữ nguyên và công bố chênh lệch này." },
  "rothc.methodTitle": { en: "RothC monthly carbon model", vi: "Mô hình carbon hàng tháng RothC" },
  "rothc.methodPools": { en: "DPM (decomposable plant material), RPM (resistant plant material), BIO, HUM and inert IOM. Each active pool retains C × exp(−a·b·c·p·k/12); k = 10, 0.3, 0.66, 0.02 /yr, respectively. IOM does not decompose. No radiocarbon age is calculated.", vi: "Các pool DPM (vật liệu dễ phân giải), RPM (khó phân giải), BIO, HUM và IOM trơ. Mỗi pool hoạt tính giữ C × exp(−a·b·c·p·k/12); k lần lượt = 10; 0,3; 0,66; 0,02 /năm. IOM không phân giải. Không tính tuổi phóng xạ." },
  "rothc.methodModifiers": { en: "a = 47.91/[1+exp(106.06/(T+18.27))], zero below −5 °C. Max TSMD = −(20+1.3·clay−0.01·clay²)×30/23. Accumulate rain−0.75·pan, capped at 0 and the vegetation-dependent deficit limit. b=1 above 0.444·max; otherwise b=0.2+0.8·(max−TSMD)/(max−0.444·max). Bare-soil limit=0.556·max. c=0.6 covered, 1 bare.", vi: "a = 47,91/[1+exp(106,06/(T+18,27))], bằng 0 dưới −5 °C. TSMD tối đa = −(20+1,3·sét−0,01·sét²)×30/23. Tích lũy mưa−0,75·bốc hơi chảo, giới hạn bởi 0 và mức thiếu hụt theo che phủ. b=1 trên 0,444·max; nếu không b=0,2+0,8·(max−TSMD)/(max−0,444·max). Giới hạn đất trống=0,556·max. c=0,6 khi có cây, 1 khi trống." },
  "rothc.methodPartition": { en: "x = 1.67·[1.85+1.6·exp(−0.0786·clay)] = CO₂/(BIO+HUM). Of decomposed C, x/(1+x) becomes CO₂; the remainder splits 46% BIO / 54% HUM. Residues enter DPM/RPM at harvest/incorporation month using sourced crop ratios; simultaneous inputs mix by carbon mass. FYM remains zero without farmer input.", vi: "x = 1,67·[1,85+1,6·exp(−0,0786·sét)] = CO₂/(BIO+HUM). Carbon phân giải chia x/(1+x) thành CO₂; phần còn lại chia 46% BIO / 54% HUM. Tàn dư vào DPM/RPM trong tháng thu hoạch/vùi theo tỷ lệ có nguồn của cây; đầu vào cùng tháng được trộn theo khối lượng carbon. FYM bằng 0 khi chưa có nông dân nhập." },
  "rothc.methodSpinup": { en: "IOM = 0.049·SOC^1.139 (Falloon et al., 1998). One inverse spin-up repeats the current rotation under baseline monthly mean climate to match the initial stock. Every alternative and climate test shares those initial pools and TSMD. The first displayed year is that initial stock; subsequent values are November year-end stocks. Annualized change = 100·(SOC−initial SOC)/(initial SOC·elapsed years), not compound growth.", vi: "IOM = 0,049·SOC^1,139 (Falloon và cs., 1998). Spin-up nghịch lặp luân canh hiện tại với khí hậu trung bình tháng nền để khớp trữ lượng ban đầu. Mọi phương án và phép thử khí hậu dùng chung pool và TSMD đầu kỳ. Năm hiển thị đầu tiên là mốc trữ lượng đó; năm sau là trữ lượng cuối tháng 11. Thay đổi bình quân năm = 100·(SOC−SOC đầu)/(SOC đầu·số năm), không phải lãi kép." },
  "rothc.methodPaddy": { en: "Shirato & Yokozawa (2005), Fig.2 / Table 3: p=0.2 during rice growing, p=0.6 in other months of a paddy field; upland p=1. Covered flooded-rice months follow the existing monthly-cover calendar. Ponding resets TSMD to zero: an explicit app extension for irrigated rice, not a verified statement from that paper. A paddy field remains paddy-drained after rice; permanent land conversion and flood dates need expert validation.", vi: "Shirato & Yokozawa (2005), Hình 2 / Bảng 3: p=0,2 trong vụ lúa, p=0,6 các tháng khác của ruộng lúa; đất cạn p=1. Tháng lúa ngập theo lịch che phủ hàng tháng hiện có. Ngập đặt TSMD về 0: mở rộng được công bố của app cho lúa có tưới, không phải kết luận đã xác minh trong bài gốc. Ruộng lúa tiếp tục được xem là đã tháo nước sau vụ; chuyển đổi đất lâu dài và lịch ngập cần chuyên gia kiểm chứng." },
  "rothc.methodData": { en: "Only two RothC input datasets: NASA POWER monthly climate (weather 0.5°×0.625°, solar ~1°; complete IMERG 0.1° rainfall when available), and ISRIC SoilGrids 2.0 (250 m). Use mean T/rain/ET0 by calendar month after climate adjustment; pan=ET0/day×calendar days/0.75. Soil depth is 0–30 cm, combining 0–5, 5–15 and 15–30 cm; no coarse-fragment correction. NDVI and SMAP do not enter RothC.", vi: "Chỉ hai bộ đầu vào RothC: khí hậu tháng NASA POWER (thời tiết 0,5°×0,625°, bức xạ ~1°; mưa IMERG 0,1° khi đủ toàn kỳ) và ISRIC SoilGrids 2.0 (250 m). Dùng T/mưa/ET0 trung bình theo tháng lịch sau chỉnh khí hậu; bốc hơi chảo=ET0/ngày×số ngày/0,75. Độ sâu đất 0–30 cm gộp 0–5, 5–15 và 15–30 cm; chưa trừ đá sỏi thô. NDVI và SMAP không tham gia RothC." },
  "rothc.methodLevels": { en: "Annualized SOC change: level 1 <−0.4%; level 2 −0.4% to −0.1% inclusive; level 3 >−0.1% and <+0.1%; level 4 ≥+0.1% and <+0.4%; level 5 ≥+0.4%. The +0.4% anchor comes from 4 per 1000, an aspirational orientation, not a field guarantee. The other boundaries are transparent app choices. Score=clamp(50+125×annualized %, 0, 100); soil criterion=0.7×score+0.3×diversity, excluded when unavailable.", vi: "Thay đổi SOC bình quân năm: mức 1 <−0,4%; mức 2 từ −0,4% đến −0,1%, gồm hai đầu; mức 3 >−0,1% và <+0,1%; mức 4 ≥+0,1% và <+0,4%; mức 5 ≥+0,4%. Mốc +0,4% lấy từ 4 per 1000, là định hướng, không bảo đảm cho thửa ruộng. Các ngưỡng còn lại là lựa chọn minh bạch của app. Điểm=clamp(50+125×% bình quân năm, 0, 100); tiêu chí đất=0,7×điểm+0,3×đa dạng, bỏ qua nếu chưa có dữ liệu." },
  "rothc.diagram": { en: "Topsoil tone follows the modeled SOC-change level. The diagram is illustrative; its thickness is fixed and is not a predicted soil-depth change.", vi: "Màu đất mặt theo mức thay đổi SOC mô phỏng. Sơ đồ là minh họa; độ dày cố định, không phải dự báo thay đổi độ sâu đất." },
  "rothc.evidenceSource": { en: "RothC + POWER climate + SoilGrids / farmer soil + sourced residue estimates", vi: "RothC + khí hậu POWER + đất SoilGrids / số đo nông dân + tàn dư ước tính có nguồn" },
  "why.diversity": {
    en: "{n} different crops from {f} plant families in the last 3 years (Shannon index {h}).",
    vi: "{n} loại cây từ {f} họ thực vật trong 3 năm gần nhất (chỉ số Shannon {h}).",
  },
  "why.limit": {
    en: "{crop} in {season}: main limitation is {factor} — {detail}",
    vi: "{crop} vụ {season}: hạn chế chính là {factor} — {detail}",
  },
  "why.stress": {
    en: "{season} needs ≈ {mm} mm of irrigation vs. ≈ {cap} mm assumed supply.",
    vi: "Vụ {season} cần tưới ≈ {mm} mm so với nguồn nước giả định ≈ {cap} mm.",
  },
  "why.nitrogen": {
    en: "Estimated fertiliser N need {n} kg/ha/yr vs. {ref} kg/ha/yr today.",
    vi: "Nhu cầu phân đạm ước tính {n} kg/ha/năm so với {ref} kg/ha/năm hiện nay.",
  },
  "why.caveat": {
    en: "These are modeled scenarios under stated assumptions. Actual results depend on local soil conditions, varieties and management.",
    vi: "Đây là kịch bản mô phỏng theo các giả định đã nêu. Kết quả thực tế phụ thuộc điều kiện đất, giống và cách quản lý tại chỗ.",
  },
};

/** Pure formatter for both React UI and engine evidence (no store/React dependency). */
export function translateMessage(lang: "en" | "vi", key: string, values?: Record<string, string | number>) {
  let message = MESSAGES[key]?.[lang] ?? key;
  if (values) for (const [name, value] of Object.entries(values)) message = message.split(`{${name}}`).join(String(value));
  return message;
}
