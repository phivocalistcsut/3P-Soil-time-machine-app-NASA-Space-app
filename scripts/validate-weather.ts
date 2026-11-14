import {readFile,writeFile} from "node:fs/promises";
import power from "../data/power-daily-thoi-lai.json";
import {era5HotYears,type Era5Daily} from "../lib/services/weather-crosscheck";
import {upstreamJson} from "../lib/services/http";

async function main() {
const [start,end]=power.period;
const params=new URLSearchParams({latitude:String(power.latitude),longitude:String(power.longitude),start_date:`${start}-01-01`,
  end_date:`${end}-12-31`,daily:"temperature_2m_max",models:"era5",timezone:"Asia/Ho_Chi_Minh",elevation:"nan"});
const url=`https://archive-api.open-meteo.com/v1/archive?${params}`;
const rawPath=process.argv.indexOf("--raw");
const raw:Era5Daily=rawPath>=0 ? JSON.parse(await readFile(process.argv[rawPath+1],"utf8")) : await upstreamJson<Era5Daily>(url);
const era=era5HotYears(raw,start,end);
const years=era.flatMap(e=>{
  const months=power.months.filter(m=>m.year===e.year);
  return months.length===12 ? [{year:e.year,powerHotDays:months.reduce((s,m)=>s+m.hotDays,0),era5HotDays:e.hotDays}] : [];
});
if(!years.length)throw Error("No complete overlapping years");
const mean=(key:"powerHotDays"|"era5HotDays")=>years.reduce((s,y)=>s+y[key],0)/years.length;
const result={latitude:power.latitude,longitude:power.longitude,start,end,thresholdC:35,years,
  meanPowerHotDays:mean("powerHotDays"),meanEra5HotDays:mean("era5HotDays"),
  meanDifferenceDays:mean("powerHotDays")-mean("era5HotDays"),
  powerRetrievedAt:power.retrievedAt,era5RetrievedAt:new Date().toISOString(),era5SourceUrl:url,
  era5GridPoint:{latitude:raw.latitude,longitude:raw.longitude},
  method:"Complete-year counts of Tmax >=35 C; POWER LST versus ERA5 Asia/Ho_Chi_Minh (UTC+7 at this longitude). ERA5 0.25 degree via Open-Meteo; elevation=nan disables downscaling. Separate reanalysis comparison, not station or field validation. Neither product corrects the other or changes model inputs."};
if(process.argv.includes("--save"))await writeFile("data/weather-crosscheck-thoi-lai.json",JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result,null,2));
}
main().catch(()=>{console.error("Weather cross-check unavailable; no results were generated.");process.exitCode=1;});
