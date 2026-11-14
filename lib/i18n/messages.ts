/**
 * Shared, key-based messages (engine explanations, assumptions, sources, labels).
 * UI copy that appears once lives next to its component via L(en, vi).
 */
export const MESSAGES: Record<string, { en: string; vi: string }> = {
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
  "soil.1": { en: "Higher risk of decline", vi: "Nguy cơ suy giảm cao" },
  "soil.2": { en: "Some risk of decline", vi: "Có nguy cơ suy giảm" },
  "soil.3": { en: "Stable / uncertain", vi: "Ổn định / chưa rõ" },
  "soil.4": { en: "Improvement possible", vi: "Có thể cải thiện" },
  "soil.5": { en: "Strong improvement potential", vi: "Tiềm năng cải thiện rõ" },

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
  "tex.silty_clay": { en: "Silty clay", vi: "Sét pha thịt" },
  "tex.loam": { en: "Loam", vi: "Đất thịt" },
  "tex.sandy_loam": { en: "Sandy loam", vi: "Thịt pha cát" },
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
    en: "Qualitative practice indicator: legumes and green manure add points, consecutive flooded rice subtracts; carried forward with soil memory. No numerical soil carbon prediction.",
    vi: "Chỉ báo định tính theo tập quán canh tác: cây họ đậu và phân xanh cộng điểm, lúa ngập liên tiếp trừ điểm; có tính “trí nhớ của đất”. Không dự báo con số carbon hữu cơ.",
  },
  "src.nitrogen": {
    en: "Typical crop N requirement minus legume credit from the previous crop (illustrative regional values).",
    vi: "Nhu cầu đạm điển hình của cây trừ phần đạm cây họ đậu vụ trước để lại (giá trị minh họa theo vùng).",
  },
  "src.economics": {
    en: "Gross margin = yield × price − cost from your inputs, reduced 15% for fair and 40% for poor climate fit.",
    vi: "Lãi gộp = năng suất × giá − chi phí theo số liệu bạn nhập, giảm 15% nếu khí hậu tương đối phù hợp và 40% nếu kém phù hợp.",
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
  "asm.soilMemory": {
    en: "Soil indicator carries 60% of last year's state forward (soil changes slowly).",
    vi: "Chỉ báo đất giữ lại 60% trạng thái năm trước (đất thay đổi chậm).",
  },
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
  "why.soilUp": {
    en: "Soil indicator moves up ({from} → {to}): {legumes} legume and {green} green-manure season(s) this year.",
    vi: "Chỉ báo đất tăng ({from} → {to}): năm này có {legumes} vụ cây họ đậu và {green} vụ phân xanh.",
  },
  "why.soilDown": {
    en: "Soil indicator moves down ({from} → {to}): {rice} consecutive flooded-rice season(s) with little rotation.",
    vi: "Chỉ báo đất giảm ({from} → {to}): {rice} vụ lúa ngập liên tiếp, ít luân canh.",
  },
  "why.soilSame": {
    en: "Soil indicator holds at “{level}” — soil responds slowly, so changes build over several years.",
    vi: "Chỉ báo đất giữ ở mức “{level}” — đất thay đổi chậm, hiệu quả tích lũy qua nhiều năm.",
  },
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
