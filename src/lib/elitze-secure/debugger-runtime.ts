import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { relative, resolve } from "node:path";
import { getDb } from "@/db";
import { debugEvents, debugSessions } from "@/db/debugger-schema";

type RemoteSummary = { type?: string; subtype?: string; value?: unknown; description?: string };
type Frame = { callFrameId:string; functionName:string; url:string; location:{lineNumber:number;columnNumber:number}; scopeChain?:Array<{type:string;name?:string;object?:{objectId?:string}}> };
type Breakpoint = { id:string; type:"breakpoint"|"conditional"|"logpoint"|"temporary"; file:string; line:number; column:number; condition?:string; expression?:string };
type Watch = { id:string; expression:string; result?:RemoteSummary };

const globalState = globalThis as typeof globalThis & { __elitzeDebugSessions?: Map<string, DebugSession> };
globalState.__elitzeDebugSessions ??= new Map();

function isEnabled() {
  return process.env.ELITZE_DEBUGGER_ENABLED === "true" || (process.env.NODE_ENV !== "production" && process.env.ELITZE_DEBUGGER_ENABLED !== "false");
}
function sideEffectsEnabled() { return process.env.ELITZE_DEBUGGER_ALLOW_SIDE_EFFECTS === "true"; }
function root() { return resolve(process.cwd()); }
function workspacePath(input:string) {
  const candidate=resolve(root(),input||"."); const rel=relative(root(),candidate);
  if (rel.startsWith("..") || rel.includes("/../") || rel.includes("\\..\\")) throw new Error("Debugger path must remain inside the ELITZE workspace");
  return candidate;
}
function truncate(value:string,max=20000){ return value.length>max ? value.slice(-max) : value; }
function summarize(value:unknown):RemoteSummary {
  if (!value || typeof value!=="object") return { value };
  const v=value as {type?:string;subtype?:string;value?:unknown;description?:string};
  return {type:v.type,subtype:v.subtype,value:v.value,description:v.description};
}
async function audit(sessionId:string,eventType:string,payload:Record<string,unknown>) {
  try { await getDb().insert(debugEvents).values({sessionId,eventType,payload}); return true; } catch { return false; }
}

class InspectorClient {
  private socket:WebSocket|null=null;
  private seq=1;
  private pending=new Map<number,{resolve:(v:Record<string,unknown>)=>void;reject:(e:Error)=>void}>();
  private handler:((m:Record<string,unknown>)=>void)|null=null;

  async connect(url:string) {
    const Ctor=(globalThis as typeof globalThis & {WebSocket?:typeof WebSocket}).WebSocket;
    if (!Ctor) throw new Error("WebSocket is unavailable in this Node runtime");
    await new Promise<void>((resolveOpen,rejectOpen)=>{
      const socket=new Ctor(url);
      const timer=setTimeout(()=>rejectOpen(new Error("Timed out connecting to Node inspector")),10000);
      socket.onopen=()=>{clearTimeout(timer);resolveOpen();};
      socket.onerror=()=>{clearTimeout(timer);rejectOpen(new Error("Node inspector connection failed"));};
      socket.onclose=()=>{for(const p of this.pending.values())p.reject(new Error("Inspector connection closed"));this.pending.clear();};
      socket.onmessage=(event)=>{let m:Record<string,unknown>;try{m=JSON.parse(String(event.data))}catch{return}
        const id=typeof m.id==="number"?m.id:null;
        if(id!==null){const p=this.pending.get(id);if(!p)return;this.pending.delete(id);const e=m.error as {message?:string}|undefined;if(e)p.reject(new Error(e.message||"Inspector command failed"));else p.resolve((m.result as Record<string,unknown>)||{});return;}
        this.handler?.(m);
      };
      this.socket=socket;
    });
  }
  onEvent(handler:(m:Record<string,unknown>)=>void){this.handler=handler;}
  request(method:string,params:Record<string,unknown>={}) {
    if(!this.socket)return Promise.reject(new Error("Inspector is not connected"));
    const id=this.seq++;
    return new Promise<Record<string,unknown>>((resolveResult,rejectResult)=>{
      const timer=setTimeout(()=>{this.pending.delete(id);rejectResult(new Error("Inspector command timed out: "+method));},15000);
      this.pending.set(id,{resolve:(v)=>{clearTimeout(timer);resolveResult(v)},reject:(e)=>{clearTimeout(timer);rejectResult(e)}});
      this.socket?.send(JSON.stringify({id,method,params}));
    });
  }
  close(){this.socket?.close();this.socket=null;}
}

export class DebugSession {
  readonly id=randomUUID();
  private child:ChildProcessWithoutNullStreams|null=null;
  private inspector:InspectorClient|null=null;
  private status="starting";
  private paused=false;
  private pauseReason:string|null=null;
  private frames:Frame[]=[];
  private breakpoints=new Map<string,Breakpoint>();
  private inspectorIds=new Map<string,string>();
  private watches=new Map<string,Watch>();
  private logs:Array<{at:string;level:"info"|"error";message:string}>=[];
  private stdout=""; private stderr="";
  private auditPersistence:"connected"|"unavailable"="unavailable";
  private readyResolve!:()=>void; private readyReject!: (e:Error)=>void;
  private ready=new Promise<void>((resolveReady,rejectReady)=>{this.readyResolve=resolveReady;this.readyReject=rejectReady;});

  constructor(readonly actorId:string,readonly entry:string,readonly args:string[],readonly cwd:string){}

  async start(){
    if(!isEnabled())throw new Error("Built-in debugger is disabled. Set ELITZE_DEBUGGER_ENABLED=true.");
    const entryPath=workspacePath(this.entry); workspacePath(this.cwd);
    if(!/\.(mjs|cjs|js|ts)$/.test(entryPath))throw new Error("Debugger supports Node .js, .mjs, .cjs and .ts entry files.");
    const flags=entryPath.endsWith(".ts")?["--experimental-strip-types"]:[];
    this.child=spawn(process.execPath,[...flags,"--inspect-brk=0",entryPath,...this.args],{cwd:workspacePath(this.cwd),env:{...process.env,NODE_OPTIONS:undefined},stdio:["pipe","pipe","pipe"]});
    this.child.stdout.setEncoding("utf8");this.child.stderr.setEncoding("utf8");
    this.child.stdout.on("data",(chunk:string)=>{this.stdout=truncate(this.stdout+chunk)});
    this.child.stderr.on("data",(chunk:string)=>{this.stderr=truncate(this.stderr+chunk);const match=String(chunk).match(/Debugger listening on (ws:\/\/127\.0\.0\.1:\d+\/[^\s]+)/);if(match)void this.connect(match[1]);});
    this.child.on("error",(e)=>{this.status="error";this.logs.push({at:new Date().toISOString(),level:"error",message:e.message});this.readyReject(e);});
    this.child.on("exit",(code,signal)=>{if(this.status!=="stopped")this.status=code===0?"exited":"crashed";this.logs.push({at:new Date().toISOString(),level:code===0?"info":"error",message:"Process exited code="+String(code)+" signal="+String(signal)});void audit(this.id,"process.exit",{code,signal,status:this.status});void this.finishAudit();});
    try{await getDb().insert(debugSessions).values({sessionId:this.id,actorId:this.actorId,entry:this.entry,cwd:this.cwd,status:"starting"});this.auditPersistence="connected"}catch{this.auditPersistence="unavailable"}
    await this.ready; this.status="running"; await audit(this.id,"session.started",{entry:this.entry,cwd:this.cwd,pid:this.child.pid||null});
  }

  private async connect(url:string){
    if(this.inspector)return;
    try{
      const client=new InspectorClient();client.onEvent((m)=>void this.handleEvent(m));await client.connect(url);this.inspector=client;
      await client.request("Runtime.enable");await client.request("Debugger.enable");
      await client.request("Debugger.setPauseOnExceptions",{state:"uncaught"}).catch(()=>undefined);
      this.readyResolve();await client.request("Debugger.resume").catch(()=>undefined);
    }catch(error){this.status="error";this.readyReject(error instanceof Error?error:new Error(String(error)));}
  }

  private frameSummary(frame:Frame,index:number){
    return {index,functionName:frame.functionName||"(anonymous)",file:frame.url.replace(/^file:\/\//,""),line:frame.location.lineNumber+1,column:frame.location.columnNumber+1};
  }
  currentLocation(){return this.frames[0]?this.frameSummary(this.frames[0],0):null;}

  private async handleEvent(message:Record<string,unknown>){
    if(message.method==="Debugger.paused"){
      const p=(message.params||{}) as {reason?:string;callFrames?:Frame[];hitBreakpoints?:string[]};
      this.paused=true;this.status="paused";this.pauseReason=p.reason||"breakpoint";this.frames=p.callFrames||[];
      const hits=p.hitBreakpoints||[];
      for(const bp of [...this.breakpoints.values()]){
        const iid=this.inspectorIds.get(bp.id); if(!iid||!hits.includes(iid))continue;
        if(bp.type==="logpoint"){
          try{const result=await this.evaluate(bp.expression||"",0,false);this.logs.push({at:new Date().toISOString(),level:"info",message:"Logpoint "+bp.file+":"+bp.line+" -> "+(result.value!==undefined?JSON.stringify(result.value):result.description||result.type||"undefined")});await audit(this.id,"debug.logpoint",{breakpointId:bp.id,expression:bp.expression||"",result});}
          catch(error){this.logs.push({at:new Date().toISOString(),level:"error",message:"Logpoint evaluation failed: "+String(error)});}
          await this.inspector?.request("Debugger.resume").catch(()=>undefined);
        }
        if(bp.type==="temporary"){await this.removeBreakpoint(bp.id).catch(()=>undefined);}
      }
      await this.refreshWatches();
      await audit(this.id,"debug.paused",{reason:this.pauseReason,location:this.currentLocation(),callFrames:this.frames.slice(0,20).map((f,i)=>this.frameSummary(f,i))});
      return;
    }
    if(message.method==="Debugger.resumed"){this.paused=false;this.status="running";this.pauseReason=null;this.frames=[];return;}
    if(message.method==="Runtime.exceptionThrown"){this.logs.push({at:new Date().toISOString(),level:"error",message:"Runtime exception observed."});void audit(this.id,"runtime.exception",{observed:true});}
  }

  private async finishAudit(){try{await getDb().update(debugSessions).set({status:this.status,endedAt:new Date()});this.auditPersistence="connected"}catch{this.auditPersistence="unavailable"}}

  async setBreakpoint(input:{file:string;line:number;column?:number;type?:Breakpoint["type"];condition?:string;expression?:string}){
    if(!Number.isInteger(input.line)||input.line<1)throw new Error("Breakpoint line must be a positive integer");
    const file=workspacePath(input.file);
    if(input.type==="conditional"&&!input.condition?.trim())throw new Error("Conditional breakpoint requires a condition");
    if(input.type==="logpoint"&&!input.expression?.trim())throw new Error("Logpoint requires an expression");
    await this.ready;if(!this.inspector)throw new Error("Inspector unavailable");
    const result=await this.inspector.request("Debugger.setBreakpointByUrl",{url:pathToFileURL(file).href,lineNumber:input.line-1,columnNumber:Math.max(0,input.column||0),...(input.type==="conditional"?{condition:input.condition}:{})});
    const inspectorId=String(result.breakpointId||"");if(!inspectorId)throw new Error("Debugger did not return a breakpoint id");
    const bp:Breakpoint={id:randomUUID(),type:input.type||"breakpoint",file,line:input.line,column:input.column||0,condition:input.condition,expression:input.expression};
    this.breakpoints.set(bp.id,bp);this.inspectorIds.set(bp.id,inspectorId);await audit(this.id,"debug.breakpoint.set",bp as unknown as Record<string,unknown>);return bp;
  }
  async removeBreakpoint(id:string){const iid=this.inspectorIds.get(id);if(!this.breakpoints.has(id))throw new Error("Unknown breakpoint");if(iid)await this.inspector?.request("Debugger.removeBreakpoint",{breakpointId:iid});this.breakpoints.delete(id);this.inspectorIds.delete(id);await audit(this.id,"debug.breakpoint.removed",{breakpointId:id});}
  async resume(){await this.ready;await this.inspector?.request("Debugger.resume");return this.snapshot();}
  async pause(){await this.ready;await this.inspector?.request("Debugger.pause");return this.snapshot();}
  async step(kind:"over"|"into"|"out"){if(!this.paused||!this.inspector)throw new Error("Process is not paused");await this.inspector.request(kind==="over"?"Debugger.stepOver":kind==="into"?"Debugger.stepInto":"Debugger.stepOut");return this.snapshot();}
  async runToLocation(file:string,line:number){const bp=await this.setBreakpoint({file,line,type:"temporary"});await this.resume();await audit(this.id,"debug.run_to_location",{breakpointId:bp.id,file,line});return bp;}

  async evaluate(expression:string,frameIndex=0,allowSideEffects=false):Promise<RemoteSummary>{
    if(!expression.trim())throw new Error("Expression is required");
    if(!this.paused||!this.inspector)throw new Error("Expressions require a paused process");
    if(allowSideEffects&&!sideEffectsEnabled())throw new Error("Side-effecting expressions are disabled by policy");
    const frame=this.frames[frameIndex];if(!frame)throw new Error("Frame does not exist");
    const result=await this.inspector.request("Debugger.evaluateOnCallFrame",{callFrameId:frame.callFrameId,expression,objectGroup:"elitze-debugger",includeCommandLineAPI:true,returnByValue:true,awaitPromise:true,throwOnSideEffect:!allowSideEffects});
    const exception=result.exceptionDetails as {text?:string}|undefined;if(exception)throw new Error(exception.text||"Expression evaluation failed");
    const summary=summarize(result.result);await audit(this.id,"debug.expression.evaluated",{expression,frameIndex,allowSideEffects,result:summary});return summary;
  }

  async variables(frameIndex=0){
    if(!this.paused||!this.inspector)throw new Error("Variables require a paused process");
    const frame=this.frames[frameIndex];if(!frame)throw new Error("Frame does not exist");
    const values:Array<{scope:string;values:Array<{name:string;value:RemoteSummary}>}>=[];
    for(const scope of frame.scopeChain||[]){const objectId=scope.object?.objectId;if(!objectId)continue;
      const response=await this.inspector.request("Runtime.getProperties",{objectId,ownProperties:true,accessorPropertiesOnly:false,generatePreview:true});
      const properties=response.result?.result; const props=Array.isArray(properties)?properties as Array<{name?:string;value?:unknown}>:[];
      values.push({scope:scope.name||scope.type,values:props.slice(0,200).map((p)=>({name:p.name||"(unnamed)",value:summarize(p.value)}))});
    }
    await audit(this.id,"debug.variables.read",{frameIndex,scopes:values.length});return values;
  }

  async addWatch(expression:string){if(!expression.trim())throw new Error("Watch expression is required");const watch:Watch={id:randomUUID(),expression:expression.trim()};this.watches.set(watch.id,watch);await this.refreshWatches();await audit(this.id,"debug.watch.added",{watchId:watch.id,expression:watch.expression});return watch;}
  async removeWatch(id:string){this.watches.delete(id);await audit(this.id,"debug.watch.removed",{watchId:id});}
  private async refreshWatches(){if(!this.paused)return;for(const watch of this.watches.values()){try{watch.result=await this.evaluate(watch.expression,0,false)}catch(error){watch.result={type:"error",description:String(error)}}}}

  async investigate(){
    const gateway=process.env.ELITZE_AI_GATEWAY_URL?.trim();if(!gateway)throw new Error("ELITZE_AI_GATEWAY_URL is not configured. No AI investigation was generated.");
    const response=await fetch(gateway.replace(/\/$/,"")+"/chat/completions",{method:"POST",headers:{"content-type":"application/json",...(process.env.ELITZE_AI_GATEWAY_TOKEN?{authorization:"Bearer "+process.env.ELITZE_AI_GATEWAY_TOKEN}:{})},body:JSON.stringify({model:process.env.ELITZE_AI_MODEL||"default",messages:[{role:"system",content:"You are the ELITZE runtime debugging investigator. Use only supplied debugger evidence. Separate observations from hypotheses. Do not invent telemetry or claim a fix was made. Recommend concrete debugger actions."},{role:"user",content:JSON.stringify(this.snapshot())}]}),signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error("Configured AI gateway rejected the debugger investigation");
    const payload=await response.json() as {choices?:Array<{message?:{content?:string}}>};
    const answer=payload.choices?.[0]?.message?.content?.trim();if(!answer)throw new Error("Configured AI gateway returned no investigation");
    await audit(this.id,"debug.ai.investigation",{answer});return answer;
  }

  snapshot(){
    return {id:this.id,status:this.status,entry:this.entry,cwd:this.cwd,pid:this.child?.pid||null,paused:this.paused,pauseReason:this.pauseReason,currentLocation:this.currentLocation(),callFrames:this.frames.slice(0,50).map((f,i)=>this.frameSummary(f,i)),breakpoints:[...this.breakpoints.values()],watches:[...this.watches.values()],logs:this.logs.slice(-100),stdout:truncate(this.stdout),stderr:truncate(this.stderr),auditPersistence:this.auditPersistence};
  }

  async command(body:{action:string;[key:string]:unknown}){
    switch(body.action){
      case "resume":return this.resume();case "pause":return this.pause();case "stepOver":return this.step("over");case "stepInto":return this.step("into");case "stepOut":return this.step("out");
      case "runToLocation":return this.runToLocation(String(body.file),Number(body.line));
      case "setBreakpoint":return this.setBreakpoint({file:String(body.file),line:Number(body.line),column:body.column===undefined?undefined:Number(body.column),type:(body.type as Breakpoint["type"])||"breakpoint",condition:body.condition===undefined?undefined:String(body.condition),expression:body.expression===undefined?undefined:String(body.expression)});
      case "removeBreakpoint":return this.removeBreakpoint(String(body.id));
      case "evaluate":return {result:await this.evaluate(String(body.expression),body.frameIndex===undefined?0:Number(body.frameIndex),Boolean(body.allowSideEffects))};
      case "variables":return {variables:await this.variables(body.frameIndex===undefined?0:Number(body.frameIndex))};
      case "addWatch":return this.addWatch(String(body.expression));case "removeWatch":return this.removeWatch(String(body.id));case "investigate":return {answer:await this.investigate()};
      default:throw new Error("Unknown debugger action: "+body.action);
    }
  }

  async stop(){this.status="stopped";await this.inspector?.request("Debugger.resume").catch(()=>undefined);this.inspector?.close();this.inspector=null;this.child?.kill("SIGTERM");this.child=null;await audit(this.id,"session.stopped",{});await this.finishAudit();globalState.__elitzeDebugSessions?.delete(this.id);}
}

export async function createDebugSession(input:{actorId:string;entry:string;args?:string[];cwd?:string}){
  const session=new DebugSession(input.actorId,input.entry,input.args||[],input.cwd||".");globalState.__elitzeDebugSessions?.set(session.id,session);
  try{await session.start();return session}catch(error){globalState.__elitzeDebugSessions?.delete(session.id);try{await session.stop()}catch{}throw error;}
}
export function getDebugSession(id:string,actorId:string){const session=globalState.__elitzeDebugSessions?.get(id)||null;return session&&session.actorId===actorId?session:null;}
export function listDebugSessions(actorId:string){return [...(globalState.__elitzeDebugSessions?.values()||[])].filter((s)=>s.actorId===actorId).map((s)=>s.snapshot());}
