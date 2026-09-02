export type NodeKind = "MODEL"|"AGENT"|"MCP"|"TOOL"|"IDENTITY"|"DATA"|"ASSET"|"VULNERABILITY"|"POLICY"|"INCIDENT";
export interface GraphNode { id:string; tenantId:string; kind:NodeKind; risk:number; attributes:Record<string,unknown>; }
export interface GraphEdge { from:string; to:string; type:string; }
export class SecurityGraph {
  private nodes=new Map<string,GraphNode>(); private edges:GraphEdge[]=[];
  addNode(node:GraphNode){ if(!node.tenantId) throw new Error("tenant required"); this.nodes.set(node.id,node); }
  addEdge(edge:GraphEdge){ if(!this.nodes.has(edge.from)||!this.nodes.has(edge.to)) throw new Error("edge endpoints must exist"); this.edges.push(edge); }
  blastRadius(start:string,maxDepth=4){ const seen=new Set([start]); let frontier=[start]; for(let d=0;d<maxDepth;d++){ const next:string[]=[]; for(const id of frontier) for(const e of this.edges) if(e.from===id&&!seen.has(e.to)){seen.add(e.to);next.push(e.to);} frontier=next; if(!frontier.length) break; } return [...seen].map(id=>this.nodes.get(id)!).filter(Boolean); }
}