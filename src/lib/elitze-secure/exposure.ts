export interface ExposureInput { cvss:number|null; epss:number|null; kev:boolean; internetExposed:boolean; assetCriticality:number; exploitVerified:boolean; }
export interface ExposurePriority { score:number; priority:"CRITICAL"|"HIGH"|"MEDIUM"|"LOW"; }
// A missing or non-finite optional field must not turn the score into NaN: a NaN
// score silently reported every exposure as LOW.
const finite = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
export function prioritizeExposure(x:ExposureInput):ExposurePriority {
 const score=Math.round(finite(x.cvss)*5+finite(x.epss)*25+(x.kev?25:0)+(x.internetExposed?15:0)+Math.min(10,Math.max(0,finite(x.assetCriticality)))+(x.exploitVerified?15:0));
 return {score,priority:score>=75?"CRITICAL":score>=50?"HIGH":score>=25?"MEDIUM":"LOW"};
}
