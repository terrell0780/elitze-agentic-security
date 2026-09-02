export interface AgentRiskInput { autonomy:number; privilege:number; monitorability:number; delegationDepth:number; persistence:number; dataSensitivity:number; }
export interface AgentRiskResult { score:number; action:"ALLOW"|"REVIEW"|"RESTRICT"|"BLOCK"; }
const n=(v:number)=>Math.max(0,Math.min(100,v));
export function evaluateAgentRisk(x:AgentRiskInput):AgentRiskResult {
  const exposure=(n(x.autonomy)*.2+n(x.privilege)*.2+(100-n(x.monitorability))*.2+n(x.delegationDepth*20)*.15+n(x.persistence)*.1+n(x.dataSensitivity)*.15);
  const score=Math.round(exposure);
  return {score,action:score>=85?"BLOCK":score>=65?"RESTRICT":score>=40?"REVIEW":"ALLOW"};
}