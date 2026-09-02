export interface ExposureInput { cvss:number|null; epss:number|null; kev:boolean; internetExposed:boolean; assetCriticality:number; exploitVerified:boolean; }
export interface ExposurePriority { score:number; priority:"CRITICAL"|"HIGH"|"MEDIUM"|"LOW"; }
export function prioritizeExposure(x:ExposureInput):ExposurePriority {
 const score=Math.round((x.cvss??0)*5+(x.epss??0)*25+(x.kev?25:0)+(x.internetExposed?15:0)+Math.min(10,Math.max(0,x.assetCriticality))+(x.exploitVerified?15:0));
 return {score,priority:score>=75?"CRITICAL":score>=50?"HIGH":score>=25?"MEDIUM":"LOW"};
}