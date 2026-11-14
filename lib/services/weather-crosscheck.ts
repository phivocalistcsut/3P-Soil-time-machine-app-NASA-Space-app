import { isoDay } from "../data/evidence";
import { ProviderError } from "./http";
import { DAILY_THRESHOLDS } from "./power-daily";

export interface Era5Daily {
  latitude: number; longitude: number; timezone: string;
  daily_units?: {temperature_2m_max?: string};
  daily?: {time: string[]; temperature_2m_max: (number|null)[]};
}

/** Match the demo POWER LST day to Vietnam UTC+7. Count only complete calendar years. */
export function era5HotYears(json:Era5Daily,start:number,end:number) {
  if(json.daily_units?.temperature_2m_max!=="°C" || json.timezone!=="Asia/Ho_Chi_Minh" ||
    !Array.isArray(json.daily?.time) || !Array.isArray(json.daily?.temperature_2m_max) ||
    json.daily.time.length!==json.daily.temperature_2m_max.length) throw new ProviderError("upstream");
  const days=new Map<string,number>();
  json.daily.time.forEach((date,i)=>{
    const value=json.daily!.temperature_2m_max[i];
    if(isoDay(date) && value!==null && Number.isFinite(value) && value>=-90 && value<=65) days.set(date,value);
  });
  const years:{year:number;days:number;hotDays:number}[]=[];
  for(let year=start;year<=end;year++) {
    const values=[...days].filter(([date])=>date.startsWith(`${year}-`)).map(([,t])=>t);
    const expected=(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000;
    if(values.length===expected)years.push({year,days:expected,hotDays:values.filter(t=>t>=DAILY_THRESHOLDS.hotC).length});
  }
  return years;
}
