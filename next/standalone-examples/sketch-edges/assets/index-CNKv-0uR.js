const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/webgl-L3d3AHpd.js","assets/render-pipeline-DmOCffZ_.js","assets/texture-BVwFVHYm.js","assets/expression-BGM2n2UH.js","assets/wgsl-binding-scan-MgRqd6na.js","assets/shader-block-layout-H8otM8O5.js","assets/webgpu-device-FiDOKuk_.js","assets/stencil-state-DcBAh56O.js","assets/wgsl-interface-scan-CFFQh3Kl.js"])))=>i.map(i=>d[i]);
import{_ as e,d as t,f as n,h as r,i,l as a,m as o,n as s,o as c,p as l,r as u,t as d,v as f,y as p}from"./render-pipeline-DmOCffZ_.js";import{C as m,D as h,E as g,S as _,T as v,_ as y,a as b,b as x,c as S,d as C,f as w,g as T,h as E,l as D,m as O,n as k,o as A,p as ee,r as te,s as ne,t as re,u as ie,v as ae,w as oe,x as se,y as ce}from"./stencil-state-DcBAh56O.js";import{n as le,r as ue,t as de}from"./shader-block-layout-H8otM8O5.js";import{a as fe,n as pe,r as me,t as j}from"./texture-BVwFVHYm.js";import{a as he,c as ge,i as _e,l as ve,n as ye,o as be,r as xe,s as Se,t as Ce}from"./wgsl-binding-scan-MgRqd6na.js";import{A as we,C as Te,D as Ee,E as De,F as Oe,I as ke,M as Ae,N as je,O as Me,P as Ne,S as Pe,T as Fe,_ as Ie,a as Le,b as Re,c as ze,d as Be,f as Ve,g as He,h as Ue,i as We,j as Ge,k as Ke,l as M,m as qe,n as Je,o as Ye,p as Xe,r as Ze,s as Qe,t as $e,u as et,v as tt,w as nt,x as rt,y as it}from"./expression-BGM2n2UH.js";import{t as at}from"./wgsl-interface-scan-CFFQh3Kl.js";var ot=Object.defineProperty,st=(e,t)=>{let n={};for(var r in e)ot(n,r,{get:e[r],enumerable:!0});return t||ot(n,Symbol.toStringTag,{value:`Module`}),n};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function ct(e,t){if(!e)throw Error(t||`loader assertion failed.`)}var lt={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};lt.self||lt.window||lt.global,lt.window||lt.self||lt.global,lt.global||lt.self||lt.window,lt.document;var ut=!!(typeof process!=`object`||String(process)!==`[object process]`||process.browser),dt=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);dt&&parseFloat(dt[1]);var ft=globalThis;globalThis.document;var pt=globalThis.process||{};globalThis.console,globalThis.navigator;function mt(e){if(typeof window<`u`&&window.process?.type===`renderer`||typeof process<`u`&&process.versions?.electron)return!0;let t=typeof navigator<`u`&&navigator.userAgent,n=e||t;return!!(n&&n.indexOf(`Electron`)>=0)}function ht(){return!(typeof process==`object`&&String(process)===`[object process]`&&!process?.browser)||mt()}var gt=`4.1.1`;function _t(e,t){if(!e)throw Error(t||`Assertion failed`)}function vt(e){if(!e)return 0;let t;switch(typeof e){case`number`:t=e;break;case`object`:t=e.logLevel||e.priority||0;break;default:return 0}return _t(Number.isFinite(t)&&t>=0),t}function yt(e){let{logLevel:t,message:n}=e;e.logLevel=vt(t);let r=e.args?Array.from(e.args):[];for(;r.length&&r.shift()!==n;);switch(typeof t){case`string`:case`function`:n!==void 0&&r.unshift(n),e.message=t;break;case`object`:Object.assign(e,t);break;default:}typeof e.message==`function`&&(e.message=e.message());let i=typeof e.message;return _t(i===`string`||i===`object`),Object.assign(e,{args:r},e.opts)}var bt=()=>{},xt=class{constructor({level:e=0}={}){this.userData={},this._onceCache=new Set,this._level=e}set level(e){this.setLevel(e)}get level(){return this.getLevel()}setLevel(e){return this._level=e,this}getLevel(){return this._level}warn(e,...t){return this._log(`warn`,0,e,t,{once:!0})}error(e,...t){return this._log(`error`,0,e,t)}log(e,t,...n){return this._log(`log`,e,t,n)}info(e,t,...n){return this._log(`info`,e,t,n)}once(e,t,...n){return this._log(`once`,e,t,n,{once:!0})}_log(e,t,n,r,i={}){let a=yt({logLevel:t,message:n,args:this._buildArgs(t,n,r),opts:i});return this._createLogFunction(e,a,i)}_buildArgs(e,t,n){return[e,t,...n]}_createLogFunction(e,t,n){if(!this._shouldLog(t.logLevel))return bt;let r=this._getOnceTag(n.tag??t.tag??t.message);if((n.once||t.once)&&r!==void 0){if(this._onceCache.has(r))return bt;this._onceCache.add(r)}return this._emit(e,t)}_shouldLog(e){return this.getLevel()>=vt(e)}_getOnceTag(e){if(e!==void 0)try{return typeof e==`string`?e:String(e)}catch{return}}};function St(e){try{let t=window[e],n=`__storage_test__`;return t.setItem(n,n),t.removeItem(n),t}catch{return null}}var Ct=class{constructor(e,t,n=`sessionStorage`){this.storage=St(n),this.id=e,this.config=t,this._loadConfiguration()}getConfiguration(){return this.config}setConfiguration(e){if(Object.assign(this.config,e),this.storage){let e=JSON.stringify(this.config);this.storage.setItem(this.id,e)}}_loadConfiguration(){let e={};if(this.storage){let t=this.storage.getItem(this.id);e=t?JSON.parse(t):{}}return Object.assign(this.config,e),this}};function wt(e){let t;return t=e<10?`${e.toFixed(2)}ms`:e<100?`${e.toFixed(1)}ms`:e<1e3?`${e.toFixed(0)}ms`:`${(e/1e3).toFixed(2)}s`,t}function Tt(e,t=8){let n=Math.max(t-e.length,0);return`${` `.repeat(n)}${e}`}var Et;(function(e){e[e.BLACK=30]=`BLACK`,e[e.RED=31]=`RED`,e[e.GREEN=32]=`GREEN`,e[e.YELLOW=33]=`YELLOW`,e[e.BLUE=34]=`BLUE`,e[e.MAGENTA=35]=`MAGENTA`,e[e.CYAN=36]=`CYAN`,e[e.WHITE=37]=`WHITE`,e[e.BRIGHT_BLACK=90]=`BRIGHT_BLACK`,e[e.BRIGHT_RED=91]=`BRIGHT_RED`,e[e.BRIGHT_GREEN=92]=`BRIGHT_GREEN`,e[e.BRIGHT_YELLOW=93]=`BRIGHT_YELLOW`,e[e.BRIGHT_BLUE=94]=`BRIGHT_BLUE`,e[e.BRIGHT_MAGENTA=95]=`BRIGHT_MAGENTA`,e[e.BRIGHT_CYAN=96]=`BRIGHT_CYAN`,e[e.BRIGHT_WHITE=97]=`BRIGHT_WHITE`})(Et||={});var Dt=10;function Ot(e){return typeof e==`string`?(e=e.toUpperCase(),Et[e]||Et.WHITE):e}function kt(e,t,n){return!ht&&typeof e==`string`&&(t&&(e=`\u001b[${Ot(t)}m${e}\u001b[39m`),n&&(e=`\u001b[${Ot(n)+Dt}m${e}\u001b[49m`)),e}function At(e,t=[`constructor`]){let n=Object.getPrototypeOf(e),r=Object.getOwnPropertyNames(n),i=e;for(let n of r){let r=i[n];typeof r==`function`&&(t.find(e=>n===e)||(i[n]=r.bind(e)))}}function jt(){let e;if(ht()&&ft.performance)e=ft?.performance?.now?.();else if(`hrtime`in pt){let t=pt?.hrtime?.();e=t[0]*1e3+t[1]/1e6}else e=Date.now();return e}var Mt={debug:ht()&&console.debug||console.log,log:console.log,info:console.info,warn:console.warn,error:console.error},Nt={enabled:!0,level:0},Pt=class extends xt{constructor({id:e}={id:``}){super({level:0}),this.VERSION=gt,this._startTs=jt(),this._deltaTs=jt(),this.userData={},this.LOG_THROTTLE_TIMEOUT=0,this.id=e,this.userData={},this._storage=new Ct(`__probe-${this.id}__`,{[this.id]:Nt}),this.timeStamp(`${this.id} started`),At(this),Object.seal(this)}isEnabled(){return this._getConfiguration().enabled}getLevel(){return this._getConfiguration().level}getTotal(){return Number((jt()-this._startTs).toPrecision(10))}getDelta(){return Number((jt()-this._deltaTs).toPrecision(10))}set priority(e){this.level=e}get priority(){return this.level}getPriority(){return this.level}enable(e=!0){return this._updateConfiguration({enabled:e}),this}setLevel(e){return this._updateConfiguration({level:e}),this}get(e){return this._getConfiguration()[e]}set(e,t){this._updateConfiguration({[e]:t})}settings(){console.table?console.table(this._storage.config):console.log(this._storage.config)}assert(e,t){if(!e)throw Error(t||`Assertion failed`)}warn(e,...t){return this._log(`warn`,0,e,t,{method:Mt.warn,once:!0})}error(e,...t){return this._log(`error`,0,e,t,{method:Mt.error})}deprecated(e,t){return this.warn(`\`${e}\` is deprecated and will be removed \
in a later version. Use \`${t}\` instead`)}removed(e,t){return this.error(`\`${e}\` has been removed. Use \`${t}\` instead`)}probe(e,t,...n){return this._log(`log`,e,t,n,{method:Mt.log,time:!0,once:!0})}log(e,t,...n){return this._log(`log`,e,t,n,{method:Mt.debug})}info(e,t,...n){return this._log(`info`,e,t,n,{method:console.info})}once(e,t,...n){return this._log(`once`,e,t,n,{method:Mt.debug||Mt.info,once:!0})}table(e,t,n){return t?this._log(`table`,e,t,n&&[n]||[],{method:console.table||bt,tag:It(t)}):bt}time(e,t){return this._log(`time`,e,t,[],{method:console.time?console.time:console.info})}timeEnd(e,t){return this._log(`time`,e,t,[],{method:console.timeEnd?console.timeEnd:console.info})}timeStamp(e,t){return this._log(`time`,e,t,[],{method:console.timeStamp||bt})}group(e,t,n={collapsed:!1}){let r=(n.collapsed?console.groupCollapsed:console.group)||console.info;return this._log(`group`,e,t,[],{method:r})}groupCollapsed(e,t,n={}){return this.group(e,t,Object.assign({},n,{collapsed:!0}))}groupEnd(e){return this._log(`groupEnd`,e,``,[],{method:console.groupEnd||bt})}withGroup(e,t,n){this.group(e,t)();try{n()}finally{this.groupEnd(e)()}}trace(){console.trace&&console.trace()}_shouldLog(e){return this.isEnabled()&&super._shouldLog(e)}_emit(e,t){let n=t.method;_t(n),t.total=this.getTotal(),t.delta=this.getDelta(),this._deltaTs=jt();let r=Ft(this.id,t.message,t);return n.bind(console,r,...t.args)}_getConfiguration(){return this._storage.config[this.id]||this._updateConfiguration(Nt),this._storage.config[this.id]}_updateConfiguration(e){let t=this._storage.config[this.id]||{...Nt};this._storage.setConfiguration({[this.id]:{...t,...e}})}};Pt.VERSION=gt;function Ft(e,t,n){if(typeof t==`string`){let r=n.time?Tt(wt(n.total)):``;t=n.time?`${e}: ${r}  ${t}`:`${e}: ${t}`,t=kt(t,n.color,n.background)}return t}function It(e){for(let t in e)for(let n in e[t])return n||`untitled`;return`empty`}var Lt=`v4.5.2`;function Rt(){let e=new Pt({id:`loaders.gl`});return globalThis.loaders||={},globalThis.loaders.log=e,globalThis.loaders.version=Lt,globalThis.probe||={},globalThis.probe.loaders=e,e}var zt=Rt(),Bt=e=>typeof e==`boolean`,Vt=e=>typeof e==`function`,Ht=e=>typeof e==`object`&&!!e,Ut=e=>Ht(e)&&e.constructor==={}.constructor,Wt=e=>typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer,Gt=e=>Ht(e)&&typeof e.byteLength==`number`&&typeof e.slice==`function`,Kt=e=>!!e&&Vt(e[Symbol.iterator]),qt=e=>!!e&&Vt(e[Symbol.asyncIterator]),Jt=e=>typeof Response<`u`&&e instanceof Response||Ht(e)&&Vt(e.arrayBuffer)&&Vt(e.text)&&Vt(e.json),Yt=e=>typeof Blob<`u`&&e instanceof Blob,Xt=e=>typeof ReadableStream<`u`&&e instanceof ReadableStream||Ht(e)&&Vt(e.tee)&&Vt(e.cancel)&&Vt(e.getReader),Zt=e=>Ht(e)&&Vt(e.read)&&Vt(e.pipe)&&Bt(e.readable),Qt=e=>Xt(e)||Zt(e);function $t(e,t){return en(e||{},t)}function en(e,t,n=0){if(n>3)return t;let r={...e};for(let[e,i]of Object.entries(t))i&&typeof i==`object`&&!Array.isArray(i)?r[e]=en(r[e]||{},t[e],n+1):r[e]=t[e];return r}var tn=`latest`;function nn(){return globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version=`4.5.2`),globalThis._loadersgl_.version}var rn=nn();function an(e,t){if(!e)throw Error(t||`loaders.gl assertion failed.`)}var on={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};on.self||on.window||on.global,on.window||on.self||on.global,on.global||on.self||on.window,on.document;var sn=typeof process!=`object`||String(process)!==`[object process]`||process.browser,cn=typeof window<`u`&&window.orientation!==void 0,ln=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);ln&&parseFloat(ln[1]);var un=class{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t){this.workerThread.postMessage({source:`loaders.gl`,type:e,payload:t})}done(e){an(this.isRunning),this.isRunning=!1,this._resolve(e)}error(e){an(this.isRunning),this.isRunning=!1,this._reject(e)}},dn=class{terminate(){}},fn=new Map;function pn(e){an(e.source&&!e.url||!e.source&&e.url);let t=fn.get(e.source||e.url);return t||(e.url&&(t=mn(e.url),fn.set(e.url,t)),e.source&&(t=hn(e.source),fn.set(e.source,t))),an(t),t}function mn(e){return e.startsWith(`http`)?hn(gn(e)):e}function hn(e){let t=new Blob([e],{type:`application/javascript`});return URL.createObjectURL(t)}function gn(e){return`\
try {
  importScripts('${e}');
} catch (error) {
  console.error(error);
  throw error;
}`}function _n(e,t=!0,n){let r=n||new Set;if(e){if(vn(e))r.add(e);else if(vn(e.buffer))r.add(e.buffer);else if(!ArrayBuffer.isView(e)&&t&&typeof e==`object`)for(let n in e)_n(e[n],t,r)}return n===void 0?Array.from(r):[]}function vn(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}var yn=()=>{},bn=class{name;source;url;terminated=!1;worker;onMessage;onError;_loadableURL=``;static isSupported(){return typeof Worker<`u`&&sn||dn!==void 0&&!sn}constructor(e){let{name:t,source:n,url:r}=e;an(n||r),this.name=t,this.source=n,this.url=r,this.onMessage=yn,this.onError=e=>console.log(e),this.worker=sn?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=yn,this.onError=yn,this.worker.terminate(),this.terminated=!0}get isRunning(){return!!this.onMessage}postMessage(e,t){t||=_n(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t=`Failed to load `;return t+=`worker ${this.name} from ${this.url}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){this._loadableURL=pn({source:this.source,url:this.url});let e=new Worker(this._loadableURL,{name:this.name});return e.onmessage=e=>{e.data?this.onMessage(e.data):this.onError(Error(`No data received`))},e.onerror=e=>{this.onError(this._getErrorFromErrorEvent(e)),this.terminated=!0},e.onmessageerror=e=>console.error(e),e}_createNodeWorker(){let e;if(this.url)e=new dn(this.url.includes(`:/`)||this.url.startsWith(`/`)?this.url:`./${this.url}`,{eval:!1,type:this.url.endsWith(`.ts`)||this.url.endsWith(`.mjs`)?`module`:`commonjs`});else if(this.source)e=new dn(this.source,{eval:!0});else throw Error(`no worker`);return e.on(`message`,e=>{this.onMessage(e)}),e.on(`error`,e=>{this.onError(e)}),e.on(`exit`,e=>{}),e}},xn=class{name=`unnamed`;source;url;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];count=0;isDestroyed=!1;static isSupported(){return bn.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.setProps(e)}destroy(){this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},e.name!==void 0&&(this.name=e.name),e.maxConcurrency!==void 0&&(this.maxConcurrency=e.maxConcurrency),e.maxMobileConcurrency!==void 0&&(this.maxMobileConcurrency=e.maxMobileConcurrency),e.reuseWorkers!==void 0&&(this.reuseWorkers=e.reuseWorkers),e.onDebug!==void 0&&(this.onDebug=e.onDebug)}async startJob(e,t=(e,t,n)=>e.done(n),n=(e,t)=>e.error(t)){let r=new Promise(r=>(this.jobQueue.push({name:e,onMessage:t,onError:n,onStart:r}),this));return this._startQueuedJob(),await r}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:`Starting job`,name:t.name,workerThread:e,backlog:this.jobQueue.length});let n=new un(t.name,e);e.onMessage=e=>t.onMessage(n,e.type,e.payload),e.onError=e=>t.onError(n,e),t.onStart(n);try{await n.result}catch(e){console.error(`Worker exception: ${e}`)}finally{this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){!sn||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.destroy(),this.count--):this.idleQueue.push(e),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){return this.idleQueue.length>0?this.idleQueue.shift()||null:this.count<this._getMaxConcurrency()?(this.count++,new bn({name:`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`,source:this.source,url:this.url})):null}_getMaxConcurrency(){return cn?this.maxMobileConcurrency:this.maxConcurrency}},Sn={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}},Cn=class e{props;workerPools=new Map;static _workerFarm;static isSupported(){return bn.isSupported()}static getWorkerFarm(t={}){return e._workerFarm=e._workerFarm||new e({}),e._workerFarm.setProps(t),e._workerFarm}constructor(e){this.props={...Sn},this.setProps(e),this.workerPools=new Map}destroy(){for(let e of this.workerPools.values())e.destroy();this.workerPools=new Map}setProps(e){this.props={...this.props,...e};for(let e of this.workerPools.values())e.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:n,url:r}=e,i=this.workerPools.get(t);return i||(i=new xn({name:t,source:n,url:r}),i.setProps(this._getWorkerPoolProps()),this.workerPools.set(t,i)),i}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}};function wn(e,t={}){let n=t[e.id]||{},r=sn?e.workerFile||`${e.id}-worker.js`:`${e.id}-worker-node.js`,i=n.workerUrl;if(!i&&e.id===`compression`&&(i=t.workerUrl),(t._workerType||t?.core?._workerType)===`test`&&(i=sn?`modules/${e.module}/dist/${r}`:`modules/${e.module}/src/workers/${e.id}-worker-node.ts`),!i){let t=e.version;t===`latest`&&(t=tn);let n=t?`@${t}`:``;i=`https://unpkg.com/@loaders.gl/${e.module}${n}/dist/${r}`}return an(i),i}function Tn(e,t=rn){an(e,`no worker provided`);let n=e.version;return!(!t||!n)}function En(e,t){if(!Cn.isSupported())return!1;let n=t?._nodeWorkers??t?.core?._nodeWorkers;if(!sn&&!n)return!1;let r=t?.worker??t?.core?.worker;return!!(e.worker&&r)}async function Dn(e,t,n,r,i){let a=e.id,o=wn(e,n),s=Cn.getWorkerFarm(n?.core).getWorkerPool({name:a,url:o});n=JSON.parse(JSON.stringify(n||{})),n._workerLoaderId=e.id,r=JSON.parse(JSON.stringify(r||{}));let c=await s.startJob(`process-on-worker`,On.bind(null,i));return c.postMessage(`process`,{input:t,options:n,context:r}),await(await c.result).result}async function On(e,t,n,r){switch(n){case`done`:t.done(r);break;case`error`:t.error(Error(r.error));break;case`process`:let{id:i,input:a,options:o}=r;try{let n=await e(a,o);t.postMessage(`done`,{id:i,result:n})}catch(e){let n=e instanceof Error?e.message:`unknown error`;t.postMessage(`error`,{id:i,error:n})}break;default:console.warn(`parse-with-worker unknown message ${n}`)}}function kn(e,t,n){if(n||=e.byteLength,e.byteLength<n||t.byteLength<n)return!1;let r=new Uint8Array(e),i=new Uint8Array(t);for(let e=0;e<r.length;++e)if(r[e]!==i[e])return!1;return!0}function An(...e){return jn(e)}function jn(e){let t=e.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),n=t.reduce((e,t)=>e+t.byteLength,0),r=new Uint8Array(n),i=0;for(let e of t)r.set(e,i),i+=e.byteLength;return r.buffer}async function Mn(e){let t=[];for await(let n of e)t.push(Nn(n));return An(...t)}function Nn(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:n,byteLength:r}=e;return Pn(t,n,r)}return Pn(e)}function Pn(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function Fn(){let e;if(typeof window<`u`&&window.performance)e=window.performance.now();else if(typeof process<`u`&&process.hrtime){let t=process.hrtime();e=t[0]*1e3+t[1]/1e6}else e=Date.now();return e}var In=class{constructor(e,t){this.sampleSize=1,this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this.name=e,this.type=t,this.reset()}reset(){return this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this}setSampleSize(e){return this.sampleSize=e,this}incrementCount(){return this.addCount(1),this}decrementCount(){return this.subtractCount(1),this}addCount(e){return this._count+=e,this._samples++,this._checkSampling(),this}subtractCount(e){return this._count-=e,this._samples++,this._checkSampling(),this}addTime(e){return this._time+=e,this.lastTiming=e,this._samples++,this._checkSampling(),this}timeStart(){return this._startTime=Fn(),this._timerPending=!0,this}timeEnd(){return this._timerPending?(this.addTime(Fn()-this._startTime),this._timerPending=!1,this._checkSampling(),this):this}getSampleAverageCount(){return this.sampleSize>0?this.lastSampleCount/this.sampleSize:0}getSampleAverageTime(){return this.sampleSize>0?this.lastSampleTime/this.sampleSize:0}getSampleHz(){return this.lastSampleTime>0?this.sampleSize/(this.lastSampleTime/1e3):0}getAverageCount(){return this.samples>0?this.count/this.samples:0}getAverageTime(){return this.samples>0?this.time/this.samples:0}getHz(){return this.time>0?this.samples/(this.time/1e3):0}_checkSampling(){this._samples===this.sampleSize&&(this.lastSampleTime=this._time,this.lastSampleCount=this._count,this.count+=this._count,this.time+=this._time,this.samples+=this._samples,this._time=0,this._count=0,this._samples=0)}},Ln=class{constructor(e){this.stats={},this.id=e.id,this.stats={},this._initializeStats(e.stats),Object.seal(this)}get(e,t=`count`){return this._getOrCreate({name:e,type:t})}get size(){return Object.keys(this.stats).length}reset(){for(let e of Object.values(this.stats))e.reset();return this}forEach(e){for(let t of Object.values(this.stats))e(t)}getTable(){let e={};return this.forEach(t=>{e[t.name]={time:t.time||0,count:t.count||0,average:t.getAverageTime()||0,hz:t.getHz()||0}}),e}_initializeStats(e=[]){e.forEach(e=>this._getOrCreate(e))}_getOrCreate(e){let{name:t,type:n}=e,r=this.stats[t];return r||(r=e instanceof In?e:new In(t,n),this.stats[t]=r),r}},Rn=``,zn={};function Bn(e){for(let t in zn)if(e.startsWith(t)){let n=zn[t];e=e.replace(t,n)}return!e.startsWith(`http://`)&&!e.startsWith(`https://`)&&(e=`${Rn}${e}`),e}function Vn(e){return e}function Hn(e){return e&&typeof e==`object`&&e.isBuffer}function Un(e){if(Hn(e))return Vn(e);if(e instanceof ArrayBuffer)return e;if(Wt(e))return Gn(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return e.byteOffset===0&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if(typeof e==`string`){let t=e;return new TextEncoder().encode(t).buffer}if(e&&typeof e==`object`&&e._toArrayBuffer)return e._toArrayBuffer();throw Error(`toArrayBuffer`)}function Wn(e){if(e instanceof ArrayBuffer)return e;if(Wt(e))return Gn(e);let{buffer:t,byteOffset:n,byteLength:r}=e;return t instanceof ArrayBuffer&&n===0&&r===t.byteLength?t:Gn(t,n,r)}function Gn(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function Kn(e){return ArrayBuffer.isView(e)?e:new Uint8Array(e)}function qn(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(t+1):e}function Jn(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(0,t):``}var Yn=class extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response},Xn=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,Zn=/^([-\w.]+\/[-\w.+]+)/;function Qn(e,t){return e.toLowerCase()===t.toLowerCase()}function $n(e){let t=Zn.exec(e);return t?t[1]:e}function er(e){let t=Xn.exec(e);return t?t[1]:``}var tr=/\?.*/;function nr(e){let t=e.match(tr);return t&&t[0]}function rr(e){return e.replace(tr,``)}function ir(e){if(e.length<50)return e;let t=e.slice(e.length-15);return`${e.substr(0,32)}...${t}`}function ar(e){return Jt(e)?e.url:Yt(e)?(`name`in e?e.name:``)||``:typeof e==`string`?e:``}function or(e){if(Jt(e)){let t=e.headers.get(`content-type`)||``,n=rr(e.url);return $n(t)||er(n)}return Yt(e)?e.type||``:typeof e==`string`?er(e):``}function sr(e){return Jt(e)?e.headers[`content-length`]||-1:Yt(e)?e.size:typeof e==`string`?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}async function cr(e){if(Jt(e))return e;let t={},n=sr(e);n>=0&&(t[`content-length`]=String(n));let r=ar(e),i=or(e);i&&(t[`content-type`]=i);let a=await dr(e);a&&(t[`x-first-bytes`]=a),typeof e==`string`&&(e=new TextEncoder().encode(e));let o=new Response(e,{headers:t});return Object.defineProperty(o,`url`,{value:r}),o}async function lr(e){if(!e.ok)throw await ur(e)}async function ur(e){let t=ir(e.url),n=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;n=n.length>100?`${n.slice(0,100)}...`:n;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get(`Content-Type`);r.reason=!e.bodyUsed&&t?.includes(`application/json`)?await e.json():await e.text()}catch{}return new Yn(n,r)}async function dr(e){if(typeof e==`string`)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let n=new FileReader;n.onload=t=>e(t?.target?.result),n.readAsDataURL(t)})}return e instanceof ArrayBuffer?`data:base64,${fr(e.slice(0,5))}`:null}function fr(e){let t=``,n=new Uint8Array(e);for(let e=0;e<n.byteLength;e++)t+=String.fromCharCode(n[e]);return btoa(t)}function pr(e){return!mr(e)&&!hr(e)}function mr(e){return e.startsWith(`http:`)||e.startsWith(`https:`)}function hr(e){return e.startsWith(`data:`)}async function gr(e,t){if(typeof e==`string`){let n=Bn(e);return pr(n)&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(n,t):await fetch(n,t)}return await cr(e)}var _r=new Pt({id:`loaders.gl`}),vr=class{log(){return()=>{}}info(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}},yr={core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,log:new class{console;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,CDN:`https://unpkg.com/@loaders.gl`,worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:ut,_nodeWorkers:!1,_workerType:``,limit:0,_limitMB:0,batchSize:`auto`,batchDebounceMs:0,metadata:!1,transforms:[]}},br={baseUri:`core.baseUrl`,fetch:`core.fetch`,mimeType:`core.mimeType`,fallbackMimeType:`core.fallbackMimeType`,ignoreRegisteredLoaders:`core.ignoreRegisteredLoaders`,nothrow:`core.nothrow`,log:`core.log`,useLocalLibraries:`core.useLocalLibraries`,CDN:`core.CDN`,worker:`core.worker`,maxConcurrency:`core.maxConcurrency`,maxMobileConcurrency:`core.maxMobileConcurrency`,reuseWorkers:`core.reuseWorkers`,_nodeWorkers:`core.nodeWorkers`,_workerType:`core._workerType`,_worker:`core._workerType`,limit:`core.limit`,_limitMB:`core._limitMB`,batchSize:`core.batchSize`,batchDebounceMs:`core.batchDebounceMs`,metadata:`core.metadata`,transforms:`core.transforms`,throws:`nothrow`,dataType:`(no longer used)`,uri:`core.baseUrl`,method:`core.fetch.method`,headers:`core.fetch.headers`,body:`core.fetch.body`,mode:`core.fetch.mode`,credentials:`core.fetch.credentials`,cache:`core.fetch.cache`,redirect:`core.fetch.redirect`,referrer:`core.fetch.referrer`,referrerPolicy:`core.fetch.referrerPolicy`,integrity:`core.fetch.integrity`,keepalive:`core.fetch.keepalive`,signal:`core.fetch.signal`},xr=[`baseUrl`,`fetch`,`mimeType`,`fallbackMimeType`,`ignoreRegisteredLoaders`,`nothrow`,`log`,`useLocalLibraries`,`CDN`,`worker`,`maxConcurrency`,`maxMobileConcurrency`,`reuseWorkers`,`_nodeWorkers`,`_workerType`,`limit`,`_limitMB`,`batchSize`,`batchDebounceMs`,`metadata`,`transforms`];function Sr(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||={},e._state}function Cr(){let e=Sr();return e.globalOptions=e.globalOptions||{...yr,core:{...yr.core}},Tr(e.globalOptions)}function wr(e,t,n,r){return n||=[],n=Array.isArray(n)?n:[n],Er(e,n),Tr(kr(t,e,r))}function Tr(e){let t=Mr(e);Nr(t);for(let e of xr)t.core&&t.core[e]!==void 0&&delete t[e];return t.core&&t.core._workerType!==void 0&&delete t._worker,t}function Er(e,t){Dr(e,null,yr,br,t);for(let n of t){let r=e&&e[n.id]||{},i=n.options&&n.options[n.id]||{},a=n.deprecatedOptions&&n.deprecatedOptions[n.id]||{};Dr(r,n.id,i,a,t)}}function Dr(e,t,n,r,i){let a=t||`Top level`,o=t?`${t}.`:``;for(let s in e){let c=!t&&Ht(e[s]),l=s===`baseUri`&&!t,u=s===`workerUrl`&&t;if(!(s in n)&&!l&&!u){if(s in r)_r.level>0&&_r.warn(`${a} loader option \'${o}${s}\' no longer supported, use \'${r[s]}\'`)();else if(!c&&_r.level>0){let e=Or(s,i);_r.warn(`${a} loader option \'${o}${s}\' not recognized. ${e}`)()}}}}function Or(e,t){let n=e.toLowerCase(),r=``;for(let i of t)for(let t in i.options){if(e===t)return`Did you mean \'${i.id}.${t}\'?`;let a=t.toLowerCase();(n.startsWith(a)||a.startsWith(n))&&(r||=`Did you mean \'${i.id}.${t}\'?`)}return r}function kr(e,t,n){let r=e.options||{},i={...r};return r.core&&(i.core={...r.core}),Nr(i),i.core?.log===null&&(i.core={...i.core,log:new vr}),Ar(i,Tr(Cr())),Ar(i,Tr(t)),jr(i,n),Pr(i),i}function Ar(e,t){for(let n in t)if(n in t){let r=t[n];Ut(r)&&Ut(e[n])?e[n]={...e[n],...t[n]}:e[n]=t[n]}}function jr(e,t){t&&e.core?.baseUrl===void 0&&(e.core||={},e.core.baseUrl=Jn(rr(t)))}function Mr(e){let t={...e};return e.core&&(t.core={...e.core}),t}function Nr(e){e.baseUri!==void 0&&(e.core||={},e.core.baseUrl===void 0&&(e.core.baseUrl=e.baseUri));for(let t of xr)if(e[t]!==void 0){let n=e.core=e.core||{};n[t]===void 0&&(n[t]=e[t])}let t=e._worker;t!==void 0&&(e.core||={},e.core._workerType===void 0&&(e.core._workerType=t))}function Pr(e){let t=e.core;if(t)for(let n of xr)t[n]!==void 0&&(e[n]=t[n])}function Fr(e){return e?(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions)):!1}function Ir(e){ct(e,`null loader`),ct(Fr(e),`invalid loader`);let t;return Array.isArray(e)&&(t=e[1],e=e[0],e={...e,options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}var Lr=()=>{let e=Sr();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function Rr(e){let t=Lr();e=Array.isArray(e)?e:[e];for(let n of e){let e=Ir(n);t.find(t=>e===t)||t.unshift(e)}}function zr(){return Lr()}var Br=/\.([^.]+)$/;async function Vr(e,t=[],n,r){if(!Gr(e))return null;let i=Tr(n||{});if(i.core||={},e instanceof Response&&Hr(e)){let n=Ur(await e.clone().text(),t,{...i,core:{...i.core,nothrow:!0}},r);if(n)return n}let a=Ur(e,t,{...i,core:{...i.core,nothrow:!0}},r);if(a)return a;if(Yt(e)&&(e=await e.slice(0,10).arrayBuffer(),a=Ur(e,t,i,r)),!a&&e instanceof Response&&Hr(e)&&(a=Ur(await e.clone().text(),t,i,r)),!a&&!i.core.nothrow)throw Error(Kr(e));return a}function Hr(e){let t=or(e);return!!(t&&(t.startsWith(`text/`)||t===`application/json`||t.endsWith(`+json`)))}function Ur(e,t=[],n,r){if(!Gr(e))return null;let i=Tr(n||{});if(i.core||={},t&&!Array.isArray(t))return Ir(t);let a=[];t&&(a=a.concat(t)),i.core.ignoreRegisteredLoaders||a.push(...zr()),qr(a);let o=Wr(e,a,i,r);if(!o&&!i.core.nothrow)throw Error(Kr(e));return o}function Wr(e,t,n,r){let i=ar(e),a=or(e),o=rr(i)||r?.url,s=null,c=``;return n?.core?.mimeType&&(s=Xr(t,n?.core?.mimeType),c=`match forced by supplied MIME type ${n?.core?.mimeType}`),s||=Jr(t,o),c||=s?`matched url ${o}`:``,s||=Xr(t,a),c||=s?`matched MIME type ${a}`:``,s||=Zr(t,e),c||=s?`matched initial data ${ti(e)}`:``,n?.core?.fallbackMimeType&&(s||=Xr(t,n?.core?.fallbackMimeType),c||=s?`matched fallback MIME type ${a}`:``),c&&zt.log(1,`selectLoader selected ${s?.name}: ${c}.`),s}function Gr(e){return!(e instanceof Response&&e.status===204)}function Kr(e){let t=ar(e),n=or(e),r=`No valid loader found (`;r+=t?`${qn(t)}, `:`no url provided, `,r+=`MIME type: ${n?`"${n}"`:`not provided`}, `;let i=e?ti(e):``;return r+=i?` first bytes: "${i}"`:`first bytes: not available`,r+=`)`,r}function qr(e){for(let t of e)Ir(t)}function Jr(e,t){let n=t&&Br.exec(t),r=n&&n[1];return r?Yr(e,r):null}function Yr(e,t){t=t.toLowerCase();for(let n of e)for(let e of n.extensions)if(e.toLowerCase()===t)return n;return null}function Xr(e,t){for(let n of e)if(n.mimeTypes?.some(e=>Qn(t,e))||Qn(t,`application/x.${n.id}`))return n;return null}function Zr(e,t){if(!t)return null;for(let n of e)if(typeof t==`string`){if(Qr(t,n))return n}else if(ArrayBuffer.isView(t)){if($r(t.buffer,t.byteOffset,n))return n}else if(t instanceof ArrayBuffer&&$r(t,0,n))return n;return null}function Qr(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}function $r(e,t,n){return(Array.isArray(n.tests)?n.tests:[n.tests]).some(r=>ei(e,t,n,r))}function ei(e,t,n,r){if(Gt(r))return kn(r,e,r.byteLength);switch(typeof r){case`function`:return r(Wn(e));case`string`:return r===ni(e,t,r.length);default:return!1}}function ti(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?ni(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?ni(e,0,t):``}function ni(e,t,n){if(e.byteLength<t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}var ri=256*1024;function*ii(e,t){let n=t?.chunkSize||ri,r=0,i=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,n),a=e.slice(r,r+t);r+=t,yield Wn(i.encode(a))}}var ai=256*1024;function*oi(e,t={}){let{chunkSize:n=ai}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,n),i=new ArrayBuffer(t),a=new Uint8Array(e,r,t);new Uint8Array(i).set(a),r+=t,yield i}}var si=1024*1024;async function*ci(e,t){let n=t?.chunkSize||si,r=0;for(;r<e.size;){let t=r+n,i=await e.slice(r,t).arrayBuffer();r=t,yield i}}function li(e,t){return ut?ui(e,t):di(e,t)}async function*ui(e,t){let n=e.getReader(),r;try{for(;;){let e=r||n.read();t?._streamReadAhead&&(r=n.read());let{done:i,value:a}=await e;if(i)return;yield Un(a)}}catch{n.releaseLock()}}async function*di(e,t){for await(let t of e)yield Un(t)}function fi(e,t){if(typeof e==`string`)return ii(e,t);if(e instanceof ArrayBuffer)return oi(e,t);if(Yt(e))return ci(e,t);if(Qt(e))return li(e,t);if(Jt(e)){let n=e.body;if(!n)throw Error(`Readable stream not available on Response`);return li(n,t)}throw Error(`makeIterator`)}var pi=`Cannot convert supplied data type`;function mi(e,t,n){if(t.text&&typeof e==`string`)return e;if(Hn(e)&&(e=e.buffer),Gt(e)){let n=Kn(e);return t.text&&!t.binary?new TextDecoder(`utf8`).decode(n):Un(n)}throw Error(pi)}async function hi(e,t,n){if(typeof e==`string`||Gt(e))return mi(e,t,n);if(Yt(e)&&(e=await cr(e)),Jt(e))return await lr(e),t.binary?await e.arrayBuffer():await e.text();if(Qt(e)&&(e=fi(e,n)),Kt(e)||qt(e))return Mn(e);throw Error(pi)}function gi(e,t){let n=Cr(),r=e||n,i=r.fetch??r.core?.fetch;return typeof i==`function`?i:Ht(i)?e=>gr(e,i):t?.fetch?t?.fetch:gr}function _i(e,t,n){if(n)return n;let r={fetch:gi(t,e),...e};if(r.url){let e=rr(r.url);r.baseUrl=e,r.queryString=nr(r.url),r.filename=qn(e),r.baseUrl=Jn(e)}return Array.isArray(r.loaders)||(r.loaders=null),r}function vi(e,t){if(e&&!Array.isArray(e))return e;let n;if(e&&(n=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];n=n?[...n,...e]:e}return n&&n.length?n:void 0}async function yi(e,t,n,r){t&&!Array.isArray(t)&&!Fr(t)&&(r=void 0,n=t,t=void 0),e=await e,n||={};let i=ar(e),a=vi(t,r),o=await Vr(e,a,n);if(!o)return null;let s=wr(n,o,a,i);return r=_i({url:i,_parse:yi,loaders:a},s,r||null),await bi(o,e,s,r)}async function bi(e,t,n,r){if(Tn(e),n=$t(e.options,n),Jt(t)){let{ok:e,redirected:n,status:i,statusText:a,type:o,url:s}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:n,status:i,statusText:a,type:o,url:s}}t=await hi(t,e,n);let i=e;if(i.parseTextSync&&typeof t==`string`)return i.parseTextSync(t,n,r);if(En(e,n))return await Dn(e,t,n,r,yi);if(i.parseText&&typeof t==`string`)return await i.parseText(t,n,r);if(i.parse)return await i.parse(t,n,r);throw an(!i.parseSync),Error(`${e.id} loader - no parser found and worker is disabled`)}async function xi(e,t,n,r){let i,a;!Array.isArray(t)&&!Fr(t)?(i=[],a=t,r=void 0):(i=t,a=n);let o=gi(a),s=e;return typeof e==`string`&&(s=await o(e)),Yt(e)&&(s=await o(e)),typeof e==`string`&&(Tr(a||{}).core?.baseUrl||(a={...a,core:{...a?.core,baseUrl:e}})),await yi(s,i,a)}var Si=`4.5.2`,Ci=globalThis.loaders?.parseImageNode,wi=typeof Image<`u`,Ti=typeof ImageBitmap<`u`,Ei=ut?!0:!!Ci;function Di(e){switch(e){case`auto`:return Ti||wi||Ei;case`imagebitmap`:return Ti;case`image`:return wi;case`data`:return Ei;default:throw Error(`@loaders.gl/images: image ${e} not supported in this environment`)}}function Oi(){if(Ti)return`imagebitmap`;if(wi)return`image`;if(Ei)return`data`;throw Error(`Install '@loaders.gl/polyfills' to parse images under Node.js`)}function ki(e){let t=ji(e);if(!t)throw Error(`Not an image`);return t}function Ai(e){switch(ki(e)){case`data`:return e;case`image`:case`imagebitmap`:let t=document.createElement(`canvas`),n=t.getContext(`2d`);if(!n)throw Error(`getImageData`);return t.width=e.width,t.height=e.height,n.drawImage(e,0,0),n.getImageData(0,0,e.width,e.height);default:throw Error(`getImageData`)}}function ji(e){return typeof ImageBitmap<`u`&&e instanceof ImageBitmap?`imagebitmap`:typeof Image<`u`&&e instanceof Image?`image`:e&&typeof e==`object`&&e.data&&e.width&&e.height?`data`:null}var Mi=/^data:image\/svg\+xml/,Ni=/\.svg((\?|#).*)?$/;function Pi(e){return e&&(Mi.test(e)||Ni.test(e))}function Fi(e,t){if(Pi(t)){let t=new TextDecoder().decode(e);try{typeof unescape==`function`&&typeof encodeURIComponent==`function`&&(t=unescape(encodeURIComponent(t)))}catch(e){throw Error(e.message)}return`data:image/svg+xml;base64,${btoa(t)}`}return Ii(e,t)}function Ii(e,t){if(Pi(t))throw Error(`SVG cannot be parsed directly to imagebitmap`);return new Blob([new Uint8Array(e)])}async function Li(e,t,n){let r=Fi(e,n),i=self.URL||self.webkitURL,a=typeof r!=`string`&&i.createObjectURL(r);try{return await Ri(a||r,t)}finally{a&&i.revokeObjectURL(a)}}async function Ri(e,t){let n=new Image;return n.src=e,t.image&&t.image.decode&&n.decode?(await n.decode(),n):await new Promise((e,t)=>{try{n.onload=()=>e(n),n.onerror=e=>{let n=e instanceof Error?e.message:`error`;t(Error(n))}}catch(e){t(e)}})}var zi=!0;async function Bi(e,t,n){let r;r=Pi(n)?await Li(e,t,n):Ii(e,n);let i=t&&t.imagebitmap;return await Vi(r,i)}async function Vi(e,t=null){if((Hi(t)||!zi)&&(t=null),t)try{return await createImageBitmap(e,t)}catch(e){console.warn(e),zi=!1}return await createImageBitmap(e)}function Hi(e){if(!e)return!0;for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function Ui(e){return!qi(e,`ftyp`,4)||!(e[8]&96)?null:Wi(e)}function Wi(e){switch(Gi(e,8,12).replace(`\0`,` `).trim()){case`avif`:case`avis`:return{extension:`avif`,mimeType:`image/avif`};default:return null}}function Gi(e,t,n){return String.fromCharCode(...e.slice(t,n))}function Ki(e){return[...e].map(e=>e.charCodeAt(0))}function qi(e,t,n=0){let r=Ki(t);for(let t=0;t<r.length;++t)if(r[t]!==e[t+n])return!1;return!0}var Ji=!1,Yi=!0;function Xi(e){let t=ra(e);return Qi(t)||ta(t)||$i(t)||ea(t)||Zi(t)}function Zi(e){let t=Ui(new Uint8Array(e instanceof DataView?e.buffer:e));return t?{mimeType:t.mimeType,width:0,height:0}:null}function Qi(e){let t=ra(e);return t.byteLength>=24&&t.getUint32(0,Ji)===2303741511?{mimeType:`image/png`,width:t.getUint32(16,Ji),height:t.getUint32(20,Ji)}:null}function $i(e){let t=ra(e);return t.byteLength>=10&&t.getUint32(0,Ji)===1195984440?{mimeType:`image/gif`,width:t.getUint16(6,Yi),height:t.getUint16(8,Yi)}:null}function ea(e){let t=ra(e);return t.byteLength>=14&&t.getUint16(0,Ji)===16973&&t.getUint32(2,Yi)===t.byteLength?{mimeType:`image/bmp`,width:t.getUint32(18,Yi),height:t.getUint32(22,Yi)}:null}function ta(e){let t=ra(e);if(!(t.byteLength>=3&&t.getUint16(0,Ji)===65496&&t.getUint8(2)===255))return null;let{tableMarkers:n,sofMarkers:r}=na(),i=2;for(;i+9<t.byteLength;){let e=t.getUint16(i,Ji);if(r.has(e))return{mimeType:`image/jpeg`,height:t.getUint16(i+5,Ji),width:t.getUint16(i+7,Ji)};if(!n.has(e))return null;i+=2,i+=t.getUint16(i,Ji)}return null}function na(){let e=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)e.add(t);return{tableMarkers:e,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}function ra(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw Error(`toDataView`)}async function ia(e,t){let{mimeType:n}=Xi(e)||{},r=globalThis.loaders?.parseImageNode;return ct(r),await r(e,n)}async function aa(e,t,n){t||={};let r=(t.image||{}).type||`auto`,{url:i}=n||{},a=oa(r),o;switch(a){case`imagebitmap`:o=await Bi(e,t,i);break;case`image`:o=await Li(e,t,i);break;case`data`:o=await ia(e,t);break;default:ct(!1)}return r===`data`&&(o=Ai(o)),o}function oa(e){switch(e){case`auto`:case`data`:return Oi();default:return Di(e),e}}var sa={dataType:null,batchType:null,id:`image`,module:`images`,name:`Images`,version:Si,mimeTypes:[`image/png`,`image/jpeg`,`image/gif`,`image/webp`,`image/avif`,`image/bmp`,`image/vnd.microsoft.icon`,`image/svg+xml`],extensions:[`png`,`jpg`,`jpeg`,`gif`,`webp`,`bmp`,`ico`,`svg`,`avif`],parse:aa,tests:[e=>!!Xi(new DataView(e))],options:{image:{type:`auto`,decode:!0}}},N=new Pt({id:`deck`}),ca={};function la(e){ca=e}function P(e,t,n,r){N.level>0&&ca[e]&&ca[e].call(null,t,n,r)}function ua(e){let t=e[0],n=e[e.length-1];return t===`{`&&n===`}`||t===`[`&&n===`]`}var da={dataType:null,batchType:null,id:`JSON`,name:`JSON`,module:``,version:``,options:{},extensions:[`json`,`geojson`],mimeTypes:[`application/json`,`application/geo+json`],testText:ua,parseTextSync:JSON.parse};function fa(){let e=`9.4.0`,t=globalThis.deck&&globalThis.deck.VERSION;if(t&&t!==e)throw Error(`deck.gl - multiple versions detected: ${t} vs ${e}`);return t||(N.log(1,`deck.gl ${e}`)(),globalThis.deck={...globalThis.deck,VERSION:e,version:e,log:N,_registerLoggers:la},Rr([da,[sa,{imagebitmap:{premultiplyAlpha:`none`}}]])),e}var pa=fa(),F=`(?:var<\\s*(uniform|storage(?:\\s*,\\s*[A-Za-z_][A-Za-z0-9_]*)?)\\s*>|var)\\s+([A-Za-z_][A-Za-z0-9_]*)`,ma=`\\s*`,ha=[RegExp(`@binding\\(\\s*(auto|\\d+)\\s*\\)${ma}@group\\(\\s*(\\d+)\\s*\\)${ma}${F}`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)${ma}@binding\\(\\s*(auto|\\d+)\\s*\\)${ma}${F}`,`g`)],ga=[RegExp(`@binding\\(\\s*(auto|\\d+)\\s*\\)${ma}@group\\(\\s*(\\d+)\\s*\\)${ma}${F}`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)${ma}@binding\\(\\s*(auto|\\d+)\\s*\\)${ma}${F}`,`g`)],_a=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)${ma}@group\\(\\s*(\\d+)\\s*\\)${ma}${F}`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)${ma}@binding\\(\\s*(\\d+)\\s*\\)${ma}${F}`,`g`)],va=[RegExp(`@binding\\(\\s*(auto)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${F}`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto)\\s*\\)\\s*${F}`,`g`),RegExp(`@binding\\(\\s*(auto)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)(?:[\\s\\n\\r]*@[A-Za-z_][^\\n\\r]*)*[\\s\\n\\r]*${F}`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto)\\s*\\)(?:[\\s\\n\\r]*@[A-Za-z_][^\\n\\r]*)*[\\s\\n\\r]*${F}`,`g`)];function ya(e){let t=e.split(``),n=0,r=0,i=!1,a=!1,o=!1;for(;n<e.length;){let s=e[n],c=e[n+1];if(a){o?o=!1:s===`\\`?o=!0:s===`"`&&(a=!1),n++;continue}if(i){s===`
`||s===`\r`?i=!1:t[n]=` `,n++;continue}if(r>0){if(s===`/`&&c===`*`){t[n]=` `,t[n+1]=` `,r++,n+=2;continue}if(s===`*`&&c===`/`){t[n]=` `,t[n+1]=` `,r--,n+=2;continue}s!==`
`&&s!==`\r`&&(t[n]=` `),n++;continue}if(s===`"`){a=!0,n++;continue}if(s===`/`&&c===`/`){t[n]=` `,t[n+1]=` `,i=!0,n+=2;continue}if(s===`/`&&c===`*`){t[n]=` `,t[n+1]=` `,r=1,n+=2;continue}n++}return t.join(``)}function ba(e,t){let n=ya(e),r=[];for(let i of t){i.lastIndex=0;let a;for(a=i.exec(n);a;){let o=i===t[0],s=a.index,c=a[0].length;r.push({match:e.slice(s,s+c),index:s,length:c,bindingToken:a[o?1:2],groupToken:a[o?2:1],accessDeclaration:a[3]?.trim(),name:a[4]}),a=i.exec(n)}}return r.sort((e,t)=>e.index-t.index)}function xa(e,t,n){let r=ba(e,t);if(!r.length)return e;let i=``,a=0;for(let t of r)i+=e.slice(a,t.index),i+=n(t),a=t.index+t.length;return i+=e.slice(a),i}function Sa(e){return/@binding\(\s*auto\s*\)/.test(ya(e))}function Ca(e,t){return ba(e,t===ha||t===ga?va:t).find(e=>e.bindingToken===`auto`)}function wa(e,t={}){let n=Ta(e),r=Ea(n);if(!r)return null;let i=Da(n,r);if(!i)return null;let a=ka(n,r,i);if(!a)return null;if(t.scanVertexAttributes===!1)return{attributes:[],bindings:a};let o=Oa(n,r);if(!o)return null;let s=Pa(n,r,i,o,t.vertexEntryPoint);return s?{attributes:s,bindings:a}:null}function Ta(e){let t=ya(e),n=/[A-Za-z_][A-Za-z0-9_]*|(?:0[xX][0-9A-Fa-f]+|\d+)|[@(){}<>\[\]:,;=]/g,r=[],i=n.exec(t);for(;i;)r.push({value:i[0],index:i.index}),i=n.exec(t);return r}function Ea(e){let t=[],n=0;for(let r of e){if(r.value===`}`&&n===0)return null;t.push(n),r.value===`{`?n++:r.value===`}`&&n--}return n===0?t:null}function Da(e,t){let n=new Map;for(let r=0;r<e.length;r++){if(t[r]!==0||e[r].value!==`alias`)continue;let i=e[r+1]?.value;if(!Xa(i)||e[r+2]?.value!==`=`||n.has(i))return null;let a=Ka(e,t,r+3,`;`);if(a<0||a===r+3)return null;n.set(i,Ya(e.slice(r+3,a))),r=a}return n}function Oa(e,t){let n=new Map;for(let r=0;r<e.length;r++){if(t[r]!==0||e[r].value!==`struct`)continue;let i=e[r+1]?.value,a=r+2;if(!Xa(i)||n.has(i)||e[a]?.value!==`{`)return null;let o=Ua(e,a,`{`,`}`);if(o<0)return null;n.set(i,e.slice(a+1,o)),r=o}return n}function ka(e,t,n){let r=[],i=new Set,a=new Set;for(let o=0;o<e.length;o++){if(t[o]!==0||e[o].value!==`var`)continue;let s=qa(e,t,o),c=e.slice(s,o),l=Ba(c,`group`),u=Ba(c,`binding`);if(l===null||u===null||l===void 0!=(u===void 0))return null;if(l===void 0||u===void 0)continue;let d=o+1,f=[];if(e[d]?.value===`<`){let t=Ua(e,d,`<`,`>`);if(t<0)return null;let n=Wa(e.slice(d+1,t),`,`);if(!n)return null;f=n.map(Ya),d=t+1}let p=e[d]?.value;if(!Xa(p)||e[d+1]?.value!==`:`)return null;let m=Ka(e,t,d+2,`;`);if(m<0||m===d+2)return null;let h=La(Ya(e.slice(d+2,m)),n);if(!h)return null;let g=Aa({name:p,group:l,location:u,addressSpace:f,resourceType:h}),_=`${l}:${u}`;if(!g||i.has(_)||a.has(p))return null;r.push(g),i.add(_),a.add(p),o=m}return Na(r),r.sort((e,t)=>e.group-t.group||e.location-t.location||e.name.localeCompare(t.name))}function Aa(e){let{name:t,group:n,location:r,addressSpace:i,resourceType:a}=e,o={name:t,group:n,location:r};if(i[0]===`uniform`&&i.length===1)return{...o,type:`uniform`};if(i[0]===`storage`&&i.length<=2){let e=i[1]||`read`;return e===`read`?{...o,type:`read-only-storage`}:e===`read_write`?{...o,type:`storage`}:null}return i.length>0?null:a===`sampler`||a===`sampler_comparison`?{...o,type:`sampler`,...a===`sampler_comparison`?{samplerType:`comparison`}:{}}:a===`texture_external`?{...o,type:`external-texture`}:ja(o,a)||Ma(o,a)}function ja(e,t){let n=/^texture_storage_(1d|2d|2d_array|3d)<([A-Za-z0-9_]+),(read|write|read_write)>$/.exec(t);if(!n)return null;let r={read:`read-only`,write:`write-only`,read_write:`read-write`}[n[3]];return{...e,type:`storage`,format:n[2],access:r,viewDimension:Ha(n[1])}}function Ma(e,t){let n=/^texture_(multisampled_)?(1d|2d|2d_array|cube|cube_array|3d)<(f32|i32|u32)>$/.exec(t);if(n){if(n[1]&&n[2]!==`2d`)return null;let t={f32:`float`,i32:`sint`,u32:`uint`}[n[3]];return{...e,type:`texture`,viewDimension:Ha(n[2]),sampleType:t,multisampled:!!n[1]}}let r=/^texture_depth_(multisampled_)?(2d|2d_array|cube|cube_array)$/.exec(t);return!r||r[1]&&r[2]!==`2d`?null:{...e,type:`texture`,viewDimension:Ha(r[2]),sampleType:`depth`,multisampled:!!r[1]}}function Na(e){for(let t of e){if(t.type!==`sampler`||t.samplerType||!t.name.endsWith(`Sampler`))continue;let n=t.name.slice(0,-7);e.find(e=>e.type===`texture`&&e.name===n&&e.group===t.group)?.sampleType===`depth`&&(t.samplerType=`non-filtering`)}}function Pa(e,t,n,r,i){let a=Fa(e,t);if(!a)return null;let o=a.filter(e=>e.vertex),s=i?o.find(e=>e.name===i):o.length===1?o[0]:void 0;if(!s)return o.length===0&&!i?[]:null;let c=Wa(s.parameters,`,`);if(!c)return null;let l=[],u=new Set,d=new Set,f=new Set;for(let e of c)if(e.length>0&&!Ia({declaration:e,aliases:n,structures:r,attributes:l,attributeLocations:u,attributeNames:d,visitedStructures:f}))return null;return l.sort((e,t)=>e.location-t.location||e.name.localeCompare(t.name))}function Fa(e,t){let n=[],r=new Set;for(let i=0;i<e.length;i++){if(t[i]!==0||e[i].value!==`fn`)continue;let a=e[i+1]?.value,o=i+2;if(!Xa(a)||r.has(a)||e[o]?.value!==`(`)return null;let s=Ua(e,o,`(`,`)`);if(s<0)return null;let c=qa(e,t,i);n.push({name:a,vertex:Va(e.slice(c,i),`vertex`),parameters:e.slice(o+1,s)}),r.add(a),i=s}return n}function Ia(e){let{declaration:t,aliases:n,structures:r,attributes:i,attributeLocations:a,attributeNames:o,visitedStructures:s}=e,c=Ga(t,`:`);if(c<1||c===t.length-1)return!1;let l=Ja(t.slice(0,c)),u=Ba(t.slice(0,c),`location`),d=Va(t.slice(0,c),`builtin`),f=La(Ya(t.slice(c+1)),n);if(!l||u===null||!f||u!==void 0&&d)return!1;if(u!==void 0){let e=za(f);return!e||a.has(u)||o.has(l)?!1:(i.push({name:l,location:u,type:e}),a.add(u),o.add(l),!0)}if(d)return!0;let p=r.get(f);if(!p||s.has(f))return!1;let m=Wa(p,`,`);if(!m)return!1;s.add(f);for(let t of m)if(t.length>0&&!Ia({...e,declaration:t}))return!1;return s.delete(f),!0}function La(e,t,n=new Set){let r=Ta(e),i=``;for(let e of r){let r=t.get(e.value);if(!r){i+=Ra(e.value);continue}if(n.has(e.value))return null;let a=new Set(n);a.add(e.value);let o=La(r,t,a);if(!o)return null;i+=o}return i}function Ra(e){let t=/^(vec[234]|mat[234]x[234])([fiuh])$/.exec(e);if(!t)return e;let n={f:`f32`,i:`i32`,u:`u32`,h:`f16`}[t[2]];return`${t[1]}<${n}>`}function za(e){return/^(?:i32|u32|f32|f16|vec[234]<(?:i32|u32|f32|f16)>)$/.test(e)?e:null}function Ba(e,t){let n;for(let r=0;r<e.length;r++)if(!(e[r].value!==`@`||e[r+1]?.value!==t)){if(n!==void 0||e[r+2]?.value!==`(`||!/^\d+$/.test(e[r+3]?.value||``)||e[r+4]?.value!==`)`)return null;n=Number(e[r+3].value)}return n}function Va(e,t){return e.some((n,r)=>n.value===`@`&&e[r+1]?.value===t)}function Ha(e){return e.replace(`_`,`-`)}function Ua(e,t,n,r){let i=0;for(let a=t;a<e.length;a++)if(e[a].value===n)i++;else if(e[a].value===r&&--i===0)return a;return-1}function Wa(e,t){let n=[],r=0,i={"(":0,"<":0,"[":0,"{":0},a=Object.keys(i),o={")":`(`,">":`<`,"]":`[`,"}":`{`};for(let s=0;s<e.length;s++){let c=e[s].value;if(c===t&&a.every(e=>i[e]===0)){n.push(e.slice(r,s)),r=s+1;continue}if(c in i)i[c]++;else if(c in o){let e=o[c];if(i[e]--,i[e]<0)return null}}return a.every(e=>i[e]===0)?(n.push(e.slice(r)),n):null}function Ga(e,t){let n=Wa(e,t);return n&&n.length===2?n[0].length:-1}function Ka(e,t,n,r){for(let i=n;i<e.length;i++)if(t[i]===0&&e[i].value===r)return i;return-1}function qa(e,t,n){for(let r=n-1;r>=0;r--)if(e[r].value===`;`&&t[r]===0||e[r].value===`}`&&t[r]===1)return r+1;return 0}function Ja(e){for(let t=e.length-1;t>=0;t--)if(Xa(e[t].value))return e[t].value;return null}function Ya(e){return e.map(e=>e.value).join(``)}function Xa(e){return!!(e&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(e))}function Za(e,t){if(!e){let e=Error(t||`shadertools: assertion failed.`);throw Error.captureStackTrace?.(e,Za),e}}var Qa={number:{type:`number`,validate(e,t){return Number.isFinite(e)&&typeof t==`object`&&(t.max===void 0||e<=t.max)&&(t.min===void 0||e>=t.min)}},array:{type:`array`,validate(e,t){return Array.isArray(e)||ArrayBuffer.isView(e)}}};function $a(e){let t={};for(let[n,r]of Object.entries(e))t[n]=eo(r);return t}function eo(e){let t=to(e);if(t!==`object`)return{value:e,...Qa[t],type:t};if(typeof e==`object`)return e?e.type===void 0?e.value===void 0?{type:`object`,value:e}:(t=to(e.value),{...e,...Qa[t],type:t}):{...e,...Qa[e.type],type:e.type}:{type:`object`,value:null};throw Error(`props`)}function to(e){return Array.isArray(e)||ArrayBuffer.isView(e)?`array`:typeof e}var no={vertex:`#ifdef MODULE_LOGDEPTH
  logdepth_adjustPosition(gl_Position);
#endif
`,fragment:`#ifdef MODULE_MATERIAL
  fragColor = material_filterColor(fragColor);
#endif

#ifdef MODULE_LIGHTING
  fragColor = lighting_filterColor(fragColor);
#endif

#ifdef MODULE_FOG
  fragColor = fog_filterColor(fragColor);
#endif

#ifdef MODULE_PICKING
  fragColor = picking_filterHighlightColor(fragColor);
  fragColor = picking_filterPickingColor(fragColor);
#endif

#ifdef MODULE_LOGDEPTH
  logdepth_setFragDepth();
#endif
`},ro=/void\s+main\s*\([^)]*\)\s*\{\n?/,io=/}\n?[^{}]*$/,ao=[],oo=`__LUMA_INJECT_DECLARATIONS__`;function so(e){let t={vertex:{},fragment:{}};for(let n in e){let r=e[n],i=co(n);typeof r==`string`&&(r={order:0,injection:r}),t[i][n]=r}return t}function co(e){let t=e.slice(0,2);switch(t){case`vs`:return`vertex`;case`fs`:return`fragment`;default:throw Error(t)}}function lo(e,t,n,r=!1,i=`glsl`,a={}){let o=t===`vertex`;for(let t in n){let r=n[t];r.sort((e,t)=>e.order-t.order),ao.length=r.length;for(let e=0,t=r.length;e<t;++e)ao[e]=r[e].injection;let s=`${ao.join(`
`)}\n`;switch(t){case`vs:#decl`:(i===`wgsl`||o)&&(e=e.replace(oo,s));break;case`vs:#main-start`:(i===`wgsl`||o)&&(e=i===`wgsl`?uo(e,`vertex`,s,`start`,a.vertex):e.replace(ro,e=>e+s));break;case`vs:#main-end`:(i===`wgsl`||o)&&(e=i===`wgsl`?uo(e,`vertex`,s,`end`,a.vertex):e.replace(io,e=>s+e));break;case`fs:#decl`:(i===`wgsl`||!o)&&(e=e.replace(oo,s));break;case`fs:#main-start`:(i===`wgsl`||!o)&&(e=i===`wgsl`?uo(e,`fragment`,s,`start`,a.fragment):e.replace(ro,e=>e+s));break;case`fs:#main-end`:(i===`wgsl`||!o)&&(e=i===`wgsl`?uo(e,`fragment`,s,`end`,a.fragment):e.replace(io,e=>s+e));break;default:e=e.replace(t,e=>e+s)}}return e=e.replace(oo,``),r&&(e=e.replace(/\}\s*$/,e=>e+no[t])),e}function uo(e,t,n,r,i){let a=fo(e,t,i);if(!a)return e;if(r===`start`){let t=a.openBraceIndex+1;return`${e.slice(0,t)}\n${n}${e.slice(t)}`}return`${e.slice(0,a.closeBraceIndex)}${n}${e.slice(a.closeBraceIndex)}`}function fo(e,t,n){let r=t===`vertex`?`@vertex`:`@fragment`,i=e.indexOf(r);if(i<0)return null;let a=n?e.search(RegExp(`\\bfn\\s+${po(n)}\\s*\\(`)):e.indexOf(`fn`,i);if(a<0)return null;let o=e.indexOf(`{`,a);if(o<0)return null;let s=0;for(let t=o;t<e.length;t++){let n=e[t];if(n===`{`)s++;else if(n===`}`&&(s--,s===0))return{openBraceIndex:o,closeBraceIndex:t}}return null}function po(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function mo(e){e.map(e=>ho(e))}function ho(e){if(e.instance)return;mo(e.dependencies||[]);let{propTypes:t={},deprecations:n=[],inject:r={}}=e,i={normalizedInjections:so(r),parsedDeprecations:_o(n)};t&&(i.propValidators=$a(t)),e.instance=i;let a={};t&&(a=Object.entries(t).reduce((e,[t,n])=>{let r=n?.value;return r&&(e[t]=r),e},{})),e.defaultUniforms={...e.defaultUniforms,...a}}function go(e,t,n){e.deprecations?.forEach(e=>{e.regex?.test(t)&&(e.deprecated?n.deprecated(e.old,e.new)():n.removed(e.old,e.new)())})}function _o(e){return e.forEach(e=>{switch(e.type){case`function`:e.regex=RegExp(`\\b${e.old}\\(`);break;default:e.regex=RegExp(`${e.type} ${e.old};`)}}),e}function vo(e){mo(e);let t={},n={};yo({modules:e,level:0,moduleMap:t,moduleDepth:n});let r=Object.keys(n).sort((e,t)=>n[t]-n[e]).map(e=>t[e]);return mo(r),r}function yo(e){let{modules:t,level:n,moduleMap:r,moduleDepth:i}=e;if(n>=5)throw Error(`Possible loop in shader dependency graph`);for(let e of t)r[e.name]=e,(i[e.name]===void 0||i[e.name]<n)&&(i[e.name]=n);for(let e of t)e.dependencies&&yo({modules:e.dependencies,level:n+1,moduleMap:r,moduleDepth:i})}var bo=`set luma.log.level=1 (or higher) to trace rendering`,xo="No matching device found. Ensure `@luma.gl/core/webgl` and/or `@luma.gl/core/webgpu` modules are imported.",So=class t{static defaultProps={...h,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=v;log=e;VERSION=typeof __VERSION__<`u`?__VERSION__:`running from source`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw e.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),e.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);e.error(`This version of luma.gl has already been initialized`)()}e.log(1,`${this.VERSION} - ${bo}`)(),globalThis.luma=this}async createDevice(e={}){let n={...t.defaultProps,...e};try{let e=this.selectAdapter(n.type,n.adapters);if(!e)throw Error(xo);return n.waitForPageLoad&&await e.pageLoaded,await e.create(n)}catch(e){throw n.debug&&Co(e),e}}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(xo);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(t=!0,n=[]){let r=this._getAdapterMap(n).get(`webgl`);r||e.warn(`enforceWebGL2: webgl adapter not found`)(),r?.enforceWebGL2?.(t)}setDefaultDeviceProps(e){Object.assign(t.defaultProps,e)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(t,n=[]){return t instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&t instanceof GPUDevice||t?.queue?`webgpu`:t===null?`null`:(t instanceof WebGLRenderingContext?e.warn(`WebGL1 is not supported`,t)():e.warn(`Unknown handle type`,t)(),null)}};function Co(e){typeof alert>`u`||alert(e instanceof Error?e.message:String(e))}var wo=new So,To=class{get pageLoaded(){return ko()}},Eo=p()&&typeof document<`u`,Do=()=>Eo&&document.readyState===`complete`,Oo=null;function ko(){return Oo||=Do()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),Oo}var Ao=class e extends l{width;height;setSampler(e){return me(this,e),this}updateTimestamp;get[Symbol.toStringTag](){return`ExternalTexture`}constructor(t,n){super(t,n,e.defaultProps);let r=this.props.source?t.getExternalImageSize(this.props.source):null;this.width=this.props.width||r?.width||0,this.height=this.props.height||r?.height||0,this.updateTimestamp=t.incrementTimestamp()}static defaultProps={...l.defaultProps,source:void 0,width:0,height:0,colorSpace:`srgb`,sampler:{}}},jo=class extends l{get[Symbol.toStringTag](){return`SharedRenderPipeline`}constructor(e,t){super(e,t,{...l.defaultProps,handle:void 0,vs:void 0,fs:void 0,varyings:void 0,bufferMode:void 0})}},Mo=class e extends l{static defaultProps={...l.defaultProps,layout:void 0,buffers:{}};get[Symbol.toStringTag](){return`TransformFeedback`}constructor(t,n){super(t,n,e.defaultProps)}},No;function Po(e){return(!No||No.byteLength<e)&&(No=new ArrayBuffer(e)),No}function Fo(e,t){return new e(Po(e.BYTES_PER_ELEMENT*t),0,t)}function Io(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Lo(e){return Array.isArray(e)?e.length===0||typeof e[0]==`number`:Io(e)}var Ro=class{layout;constructor(e){this.layout=e}has(e){return!!this.layout.fields[e]}get(e){let t=this.layout.fields[e];return t?{offset:t.offset,size:t.size}:void 0}getFlatUniformValues(e){let t={};for(let[n,r]of Object.entries(e)){let e=this.layout.uniformTypes[n];e?this._flattenCompositeValue(t,n,e,r):this.layout.fields[n]&&(t[n]=r)}return t}getData(e){let t=Po(this.layout.byteLength);new Uint8Array(t,0,this.layout.byteLength).fill(0);let n={i32:new Int32Array(t),u32:new Uint32Array(t),f32:new Float32Array(t),f16:new Uint16Array(t)},r=this.getFlatUniformValues(e);for(let[e,t]of Object.entries(r))this._writeLeafValue(n,e,t);return new Uint8Array(t,0,this.layout.byteLength)}_flattenCompositeValue(t,n,r,i){if(i!==void 0){if(typeof r==`string`||this.layout.fields[n]){t[n]=i;return}if(Array.isArray(r)){let a=r[0],o=r[1];if(Array.isArray(a))throw Error(`Nested arrays are not supported for ${n}`);if(typeof a==`string`&&Lo(i)){this._flattenPackedArray(t,n,a,o,i);return}if(!Array.isArray(i)){e.warn(`Unsupported uniform array value for ${n}:`,i)();return}for(let e=0;e<Math.min(i.length,o);e++){let r=i[e];r!==void 0&&this._flattenCompositeValue(t,`${n}[${e}]`,a,r)}return}if(le(r)&&zo(i)){for(let[e,a]of Object.entries(i)){if(a===void 0)continue;let i=`${n}.${e}`;this._flattenCompositeValue(t,i,r[e],a)}return}e.warn(`Unsupported uniform value for ${n}:`,i)()}}_flattenPackedArray(e,t,n,r,i){let a=i,o=de(n,this.layout.layout).components;for(let n=0;n<r;n++){let r=n*o;if(r>=a.length)break;o===1?e[`${t}[${n}]`]=Number(a[r]):e[`${t}[${n}]`]=Bo(i,r,r+o)}}_writeLeafValue(t,n,r){let i=this.layout.fields[n];if(!i){e.warn(`Uniform ${n} not found in layout`)();return}let{type:a,components:o,columns:s,rows:c,offset:l,columnStride:u}=i,d=t[a];if(o===1){d[l]=Number(r);return}let f=r;if(s===1){for(let e=0;e<o;e++)d[l+e]=Number(f[e]??0);return}let p=0;for(let e=0;e<s;e++){let t=l+e*u;for(let e=0;e<c;e++)d[t+e]=Number(f[p++]??0)}}};function zo(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function Bo(e,t,n){return Array.prototype.slice.call(e,t,n)}var Vo=128;function Ho(e,t,n=16){if(e===t)return!0;let r=e,i=t;if(!Lo(r)||!Lo(i)||r.length!==i.length)return!1;let a=Math.min(n,Vo);if(r.length>a)return!1;for(let e=0;e<r.length;++e)if(i[e]!==r[e])return!1;return!0}function Uo(e){return Lo(e)?e.slice():e}var Wo=class{name;uniforms={};modifiedUniforms={};modified=!0;bindingLayout={};needsRedraw=`initialized`;constructor(e){if(this.name=e?.name||`unnamed`,e?.name&&e?.shaderLayout){let t=e?.shaderLayout.bindings?.find(t=>t.type===`uniform`&&t.name===e?.name);if(!t)throw Error(e?.name);let n=t;for(let e of n.uniforms||[])this.bindingLayout[e.name]=e}}setUniforms(e){for(let[t,n]of Object.entries(e))this._setUniform(t,n)&&!this.needsRedraw&&this.setNeedsRedraw(`${this.name}.${t}=${n}`)}setNeedsRedraw(e){this.needsRedraw=this.needsRedraw||e}getAllUniforms(){return this.modifiedUniforms={},this.needsRedraw=!1,this.uniforms||{}}_setUniform(e,t){return Ho(this.uniforms[e],t)?!1:(this.uniforms[e]=Uo(t),this.modifiedUniforms[e]=!0,this.modified=!0,!0)}},Go=1024,Ko=class{device;uniformBlocks=new Map;shaderBlockLayouts=new Map;shaderBlockWriters=new Map;uniformBuffers=new Map;constructor(e,t){this.device=e;for(let[n,r]of Object.entries(t)){let t=n,i=ue(r.uniformTypes??{},{layout:r.layout??qo(e)}),a=new Ro(i);this.shaderBlockLayouts.set(t,i),this.shaderBlockWriters.set(t,a);let o=new Wo({name:n});o.setUniforms(a.getFlatUniformValues(r.defaultUniforms||{})),this.uniformBlocks.set(t,o)}}destroy(){for(let e of this.uniformBuffers.values())e.destroy()}setUniforms(e,t){for(let[t,n]of Object.entries(e)){let e=t,r=this.shaderBlockWriters.get(e)?.getFlatUniformValues(n||{});this.uniformBlocks.get(e)?.setUniforms(r||{})}this.updateUniformBuffers(t)}getUniformBufferByteLength(e){let t=this.shaderBlockLayouts.get(e)?.byteLength||0;return Math.max(t,Go)}getUniformBufferData(e){let t=this.uniformBlocks.get(e)?.getAllUniforms()||{};return this.shaderBlockWriters.get(e)?.getData(t)||new Uint8Array}createUniformBuffer(e,t){t&&this.setUniforms(t);let r=this.getUniformBufferByteLength(e),i=this.device.createBuffer({usage:n.UNIFORM|n.COPY_DST,byteLength:r}),a=this.getUniformBufferData(e);return i.write(a),i}getManagedUniformBuffer(e){if(!this.uniformBuffers.get(e)){let t=this.getUniformBufferByteLength(e),r=this.device.createBuffer({usage:n.UNIFORM|n.COPY_DST,byteLength:t});this.uniformBuffers.set(e,r)}return this.uniformBuffers.get(e)}updateUniformBuffers(t){let n=!1;for(let e of this.uniformBlocks.keys()){let r=this.updateUniformBuffer(e,t);n||=r}return n&&e.log(3,`UniformStore.updateUniformBuffers(): ${n}`)(),n}updateUniformBuffer(t,n){let r=this.uniformBlocks.get(t),i=this.uniformBuffers.get(t),a=!1;if(i&&r?.needsRedraw){a||=r.needsRedraw;let o=this.getUniformBufferData(t);if(i=this.uniformBuffers.get(t),i&&(n?this.device.writeBufferViaCommandEncoder(n,i,o):i.write(o)),e.level>=4){let n=this.uniformBlocks.get(t)?.getAllUniforms();e.log(4,`Writing to uniform buffer ${String(t)}`,o,n)()}}return a}};function qo(e){return e.type===`webgpu`?`wgsl-uniform`:`std140`}function Jo(e,t){let n={},r=ne(e,t,{warnOnMissingBufferLayout:!0});for(let t of r){let r=Yo(e,t);n[t.attributeName]=r}return n}function Yo(e,n){let r=Xo(e,n.attributeName),i=t.getAttributeShaderTypeInfo(r.type),a=n.vertexFormat,o=u.getVertexFormatInfo(a);return{attributeName:n.attributeName,bufferName:n.bufferName,location:r.location,shaderType:r.type,primitiveType:i.primitiveType,shaderComponents:i.components,vertexFormat:a,bufferDataType:o.type,bufferComponents:o.components,normalized:o.normalized,integer:i.integer,stepMode:n.stepMode,byteOffset:n.byteOffset,byteStride:n.byteStride}}function Xo(t,n){let r=t.attributes.find(e=>e.name===n);return r||e.warn(`shader layout attribute "${n}" not present in shader`)(),r||null}var Zo=/^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/,Qo=/((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g;function $o(e){return`${e.name}Uniforms`}function es(e,t){let n=t===`wgsl`?e.source:t===`vertex`?e.vs:e.fs;if(!n)return null;let r=$o(e);return as(n,t===`wgsl`?`wgsl`:`glsl`,r)}function ts(e,t){let n=Object.keys(e.uniformTypes||{});if(!n.length)return null;let r=es(e,t);return r?{moduleName:e.name,uniformBlockName:$o(e),stage:t,expectedUniformNames:n,actualUniformNames:r,matches:cs(n,r)}:null}function ns(e,t,n={}){let r=ts(e,t);if(!r||r.matches)return r;let i=ls(r);return n.log?.error?.(i,r)(),n.throwOnError!==!1&&Za(!1,i),r}function rs(e){let t=[],n=us(e);for(let e of n.matchAll(Qo)){let n=e[1]?.trim()||null;t.push({blockName:e[2],body:e[3],instanceName:e[4]||null,layoutQualifier:n,hasLayoutQualifier:!!n,isStd140:!!(n&&/\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(n))})}return t}function is(e,t,n,r){let i=rs(e).filter(e=>!e.isStd140),a=new Set;for(let e of i){if(a.has(e.blockName))continue;a.add(e.blockName);let i=r?.label?`${r.label} `:``,o=e.hasLayoutQualifier?`declares ${ds(e.layoutQualifier)} instead of layout(std140)`:`does not declare layout(std140)`,s=`${i}${t} shader uniform block ${e.blockName} ${o}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;n?.warn?.(s,e)()}return i}function as(e,t,n){let r=t===`wgsl`?os(e,n):ss(e,n);if(!r)return null;let i=[];for(let e of r.split(`
`)){let n=e.replace(/\/\/.*$/,``).trim();if(!n||n.startsWith(`#`))continue;let r=t===`wgsl`?n.match(/^([A-Za-z0-9_]+)\s*:/):n.match(Zo);r&&i.push(r[1])}return i}function os(e,t){let n=RegExp(`\\bstruct\\s+${t}\\b`,`m`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index);if(r<0)return null;let i=0;for(let t=r;t<e.length;t++){let n=e[t];if(n===`{`){i++;continue}if(n===`}`&&(i--,i===0))return e.slice(r+1,t)}return null}function ss(e,t){return rs(e).find(e=>e.blockName===t)?.body||null}function cs(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function ls(e){let{expectedUniformNames:t,actualUniformNames:n}=e,r=t.filter(e=>!n.includes(e)),i=n.filter(e=>!t.includes(e)),a=[`Expected ${t.length} fields, found ${n.length}.`],o=fs(t,n);return o&&a.push(o),r.length&&a.push(`Missing from shader block (${r.length}): ${ps(r)}.`),i.length&&a.push(`Unexpected in shader block (${i.length}): ${ps(i)}.`),t.length<=12&&n.length<=12&&(r.length||i.length)&&(a.push(`Expected: ${t.join(`, `)}.`),a.push(`Actual: ${n.join(`, `)}.`)),`${e.moduleName}: ${e.stage} shader uniform block ${e.uniformBlockName} does not match module.uniformTypes. ${a.join(` `)}`}function us(e){return e.replace(/\/\*[\s\S]*?\*\//g,``).replace(/\/\/.*$/gm,``)}function ds(e){return e.replace(/\s+/g,` `).trim()}function fs(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++)if(e[r]!==t[r])return`First mismatch at field ${r+1}: expected ${e[r]}, found ${t[r]}.`;return e.length>t.length?`Shader block ends after field ${t.length}; expected next field ${e[t.length]}.`:t.length>e.length?`Shader block has extra field ${t.length}: ${t[e.length]}.`:null}function ps(e,t=8){if(e.length<=t)return e.join(`, `);let n=e.length-t;return`${e.slice(0,t).join(`, `)}, ... (${n} more)`}function ms(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
// Apple optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case`nvidia`:return`#define NVIDIA_GPU
// Nvidia optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
`;case`intel`:return`#define INTEL_GPU
// Intel optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Intel's built-in 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case`amd`:return`#define AMD_GPU
`;default:return`#define DEFAULT_GPU
// Prevent driver from optimizing away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Headless Chrome's software shader 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// If the GPU doesn't have full 32 bits precision, will causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`}}function hs(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=ys(e,_s),e;case`fragment`:return e=ys(e,vs),e;default:throw Error(t)}}var gs=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],_s=[...gs,[bs(`attribute`),`in $1`],[bs(`varying`),`out $1`]],vs=[...gs,[bs(`varying`),`in $1`]];function ys(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function bs(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}function xs(e,t,n=`glsl`){let r=``;for(let i in e){let a=e[i];if(r+=`${n===`wgsl`?`fn`:`void`} ${a.signature} {\n`,a.header&&(r+=`  ${a.header}`),t[i]){let e=t[i];e.sort((e,t)=>e.order-t.order);for(let t of e)r+=`  ${t.injection}\n`}a.footer&&(r+=`  ${a.footer}`),r+=`}
`}return r}function Ss(e){let t={vertex:{},fragment:{}};for(let n of e){let e,r;typeof n==`string`?(e={},r=n):(e=n,r=e.hook),r=r.trim();let i=r.indexOf(`:`),a=r.slice(0,i),o=r.slice(i+1),s=r.replace(/\(.+/,``),c=Object.assign(e,{signature:o});switch(a){case`vs`:t.vertex[s]=c;break;case`fs`:t.fragment[s]=c;break;default:throw Error(a)}}return t}function Cs(e,t){return{name:ws(e,t),language:`glsl`,version:Ts(e)}}function ws(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function Ts(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}var Es=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${F}\\s*:\\s*([^;]+);`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${F}\\s*:\\s*([^;]+);`,`g`)];function Ds(e,t=[]){let n=ya(e),r=new Map;for(let e of t)r.set(ks(e.name,e.group,e.location),e.moduleName);let i=[];for(let e of Es){e.lastIndex=0;let t;for(t=e.exec(n);t;){let a=e===Es[0],o=Number(t[a?1:2]),s=Number(t[a?2:1]),c=t[3]?.trim(),l=t[4],u=t[5].trim(),d=r.get(ks(l,s,o));i.push(Os({name:l,group:s,binding:o,owner:d?`module`:`application`,moduleName:d,accessDeclaration:c,resourceType:u})),t=e.exec(n)}}return i.sort((e,t)=>e.group===t.group?e.binding===t.binding?e.name.localeCompare(t.name):e.binding-t.binding:e.group-t.group)}function Os(e){let t={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:`unknown`,moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let n=e.accessDeclaration.split(`,`).map(e=>e.trim());if(n[0]===`uniform`)return{...t,kind:`uniform`,access:`uniform`};if(n[0]===`storage`){let e=n[1]||`read_write`;return{...t,kind:e===`read`?`read-only-storage`:`storage`,access:e}}}return e.resourceType===`sampler`||e.resourceType===`sampler_comparison`?{...t,kind:`sampler`,samplerKind:e.resourceType===`sampler_comparison`?`comparison`:`filtering`}:e.resourceType.startsWith(`texture_storage_`)?{...t,kind:`storage-texture`,access:Ms(e.resourceType),viewDimension:As(e.resourceType)}:e.resourceType.startsWith(`texture_`)?{...t,kind:`texture`,viewDimension:As(e.resourceType),sampleType:js(e.resourceType),multisampled:e.resourceType.startsWith(`texture_multisampled_`)}:t}function ks(e,t,n){return`${t}:${n}:${e}`}function As(e){if(e.includes(`cube_array`))return`cube-array`;if(e.includes(`2d_array`))return`2d-array`;if(e.includes(`cube`))return`cube`;if(e.includes(`3d`))return`3d`;if(e.includes(`2d`))return`2d`;if(e.includes(`1d`))return`1d`}function js(e){if(e.startsWith(`texture_depth_`))return`depth`;if(e.includes(`<i32>`))return`sint`;if(e.includes(`<u32>`))return`uint`;if(e.includes(`<f32>`))return`float`}function Ms(e){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e)?.[1]}var Ns=`([a-zA-Z_][a-zA-Z0-9_]*)`,Ps=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,Fs=RegExp(`^\\s*\\#\\s*ifdef\\s*${Ns}\\s*$`),Is=RegExp(`^\\s*\\#\\s*ifndef\\s*${Ns}\\s*(?:\\/\\/.*)?$`),Ls=/^\s*\#\s*else\s*(?:\/\/.*)?$/,Rs=/^\s*\#\s*endif\s*$/,zs=RegExp(`^\\s*\\#\\s*ifdef\\s*${Ns}\\s*(?:\\/\\/.*)?$`),Bs=/^\s*\#\s*endif\s*(?:\/\/.*)?$/;function Vs(e,t){let n=e.split(`
`),r=[],i=[],a=!0;for(let e of n){let n=e.match(Ps),o=e.match(zs)||e.match(Fs),s=e.match(Is),c=e.match(Ls),l=e.match(Bs)||e.match(Rs);if(n){let e=Hs(n[1],t?.defines||{}),r=a&&e;i.push({parentActive:a,branchTaken:e,active:r}),a=r}else if(o||s){let e=(o||s)?.[1],n=!!t?.defines?.[e],r=o?n:!n,c=a&&r;i.push({parentActive:a,branchTaken:r,active:c}),a=c}else if(c){let e=i[i.length-1];if(!e)throw Error(`Encountered #else without matching #if, #ifdef or #ifndef`);e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,a=e.active}else l?(i.pop(),a=i.length?i[i.length-1].active:!0):a&&r.push(e)}if(i.length>0)throw Error(`Unterminated conditional block in shader source`);return r.join(`
`)}function Hs(e,t){let n=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(n))return Number(n)!==0;if(n===`true`)return!0;if(n===`false`)return!1;let r=n.match(RegExp(`^!\\s*${Ns}$`));if(r)return!t[r[1]];let i=n.match(RegExp(`^${Ns}$`));if(i)return!!t[i[1]];let a=n.match(RegExp(`^defined\\s*\\(\\s*${Ns}\\s*\\)$`));if(a)return t[a[1]]!==void 0;let o=n.match(RegExp(`^!\\s*defined\\s*\\(\\s*${Ns}\\s*\\)$`));if(o)return t[o[1]]===void 0;throw Error(`Unsupported #if expression "${e}"`)}function Us(e,t){let n=[];for(let[r,i]of Object.entries(t))Ks(e,r),n.push(`in ${Gs(i)} ${r};`);return n.join(`
`)}function Ws(e,t,n){let r=Object.entries(n);if(r.length===0)return{source:e,declarations:``,initialization:``};let i=qs(e,t),a=e.slice(i.openParenthesis+1,i.closeParenthesis),o=Js(e,a),s=new Set(o.locations),c=[],l=[],u=[];for(let[t,n]of r){if(o.names.has(t)||$s(e,t))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing WGSL shader input or variable`);let r=ec(s);s.add(r);let i=`_luma_${t}`;c.push(`@location(${r}) ${i}: ${n}`),l.push(`var<private> ${t}: ${n};`),u.push(`${t} = ${i};`)}let d=a.trim()?`,
  `:`
  `,f=a.trim()?``:`
`,p=`${a}${d}${c.join(`,
  `)}${f}`;return{source:e.slice(0,i.openParenthesis+1)+p+e.slice(i.closeParenthesis),declarations:l.join(`
`),initialization:u.join(`
`)}}function Gs(e){let{primitiveType:n,components:r}=t.getAttributeShaderTypeInfo(e),i=n===`i32`?`int`:n===`u32`?`uint`:`float`;return r===1?i:`${i===`int`?`i`:i===`uint`?`u`:``}vec${r}`}function Ks(e,t){let n=rc(t);if(RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${n}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing GLSL input`)}function qs(e,t){let n=RegExp(`\\bfn\\s+${rc(t)}\\s*\\(`,`g`).exec(e);if(!n)throw Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${t}"`);let r=e.indexOf(`(`,n.index),i=tc(e,r,`(`,`)`);if(i<0)throw Error(`Unable to parse WGSL vertex entry point "${t}" parameters`);return{openParenthesis:r,closeParenthesis:i}}function Js(e,t){let n=Ys(t),r=new Set(Xs(t)),i=Zs(t);for(let t of i){let i=Qs(e,t);if(i!==null){n.push(...Ys(i));for(let e of Xs(i))r.add(e)}}return{locations:n,names:r}}function Ys(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function Xs(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Zs(e){let t=[],n=/:\s*([A-Za-z_][\w]*)\b/g,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Qs(e,t){let n=RegExp(`\\bstruct\\s+${rc(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=tc(e,r,`{`,`}`);return i<0?null:e.slice(r+1,i)}function $s(e,t){let n=rc(t),r=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${n}\\b`,`g`),i=r.exec(e);for(;i;){if(nc(e,i.index)===0)return!0;i=r.exec(e)}return!1}function ec(e){let t=0;for(;e.has(t);)t++;return t}function tc(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function nc(e,t){let n=0,r=0,i=!1;for(let a=0;a<t;a++){let t=e[a],o=e[a+1];if(i){t===`
`&&(i=!1);continue}if(r>0){t===`/`&&o===`*`?(r++,a++):t===`*`&&o===`/`&&(r--,a++);continue}t===`/`&&o===`/`?(i=!0,a++):t===`/`&&o===`*`?(r=1,a++):t===`{`?n++:t===`}`&&n--}return n}function rc(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function ic(e,t,n){let r=[],i=[];for(let[a,o]of Object.entries(n)){wc(e,a);let n=o.interpolation===`flat`?`flat `:``,s=t===`vertex`?`out`:`in`;r.push(`${n}${s} ${Gs(o.type)} ${a};`),t===`vertex`&&i.push(`${a} = ${Sc(o.type)};`)}return{declarations:r.join(`
`),initialization:i.join(`
`)}}function ac(e,t,n,r){let i=Object.entries(r);if(i.length===0)return{source:e,declarations:``,vertexInitialization:``,fragmentInitialization:``};let a=e,o=oc(a,t,`vertex`),s=sc(a,o),c=oc(a,n,`fragment`),l=cc(a,c),u=lc(a,s),d=lc(a,l.type),f=new Set([...yc(o.parameters),...yc(u.body),...yc(c.parameters),...yc(d.body)]),p=new Set([...vc(u.body),...vc(d.body)]),m=[],h=[],g=[],_=[];for(let[e,t]of i){if(f.has(e)||bc(a,e))throw Error(`ShaderPlugin varying "${e}" conflicts with existing WGSL stage I/O or a module variable`);let n=xc(p);p.add(n);let r=t.interpolation===`flat`?` @interpolate(flat)`:``;m.push(`  @location(${n})${r} ${e}: ${t.type},`),h.push(`var<private> ${e}: ${t.type};`),g.push(`${e} = ${Cc(t.type)};`),_.push(`${e} = ${l.name}.${e};`)}dc(a,s,o.openBrace,o.closeBrace),a=fc(a,s,o,i.map(([e])=>e)),o=oc(a,t,`vertex`),a=pc(a,o,i.map(([e])=>e));let v=(s===l.type?[s]:[s,l.type]).map(e=>lc(a,e).closeBrace).sort((e,t)=>t-e);for(let e of v)a=a.slice(0,e)+`${m.join(`
`)}\n`+a.slice(e);if(c=oc(a,n,`fragment`),!RegExp(`\\b${Dc(l.name)}\\s*:`).test(c.parameters))throw Error(`Unable to preserve WGSL fragment input "${l.name}"`);return{source:a,declarations:h.join(`
`),vertexInitialization:g.join(`
`),fragmentInitialization:_.join(`
`)}}function oc(e,t,n){let r=RegExp(`\\bfn\\s+${Dc(t)}\\s*\\(`,`g`).exec(e);if(!r)throw Error(`ShaderPlugin varyings require WGSL ${n} entry point "${t}"`);let i=e.indexOf(`(`,r.index),a=Tc(e,i,`(`,`)`),o=e.indexOf(`{`,a),s=Tc(e,o,`{`,`}`);if(a<0||o<0||s<0)throw Error(`Unable to parse WGSL ${n} entry point "${t}"`);return{openParenthesis:i,closeParenthesis:a,openBrace:o,closeBrace:s,parameters:e.slice(i+1,a)}}function sc(e,t){let n=e.slice(t.closeParenthesis+1,t.openBrace),r=/->\s*([A-Za-z_][\w]*)\s*$/.exec(n.trim());if(!r||uc(e,r[1])===null)throw Error(`ShaderPlugin varyings require the WGSL vertex entry point to return a named struct`);return r[1]}function cc(e,t){let n=[];for(let r of _c(t.parameters,`,`)){let t=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(r.trim());t&&uc(e,t[2])&&n.push({name:t[1],type:t[2]})}if(n.length!==1)throw Error(`ShaderPlugin varyings require exactly one named WGSL fragment input struct; found ${n.length}`);return n[0]}function lc(e,t){let n=uc(e,t);if(!n)throw Error(`Unable to find WGSL stage I/O struct "${t}"`);return n}function uc(e,t){let n=RegExp(`\\bstruct\\s+${Dc(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=Tc(e,r,`{`,`}`);return i<0?null:{openBrace:r,closeBrace:i,body:e.slice(r+1,i)}}function dc(e,t,n,r){let i=RegExp(`\\b${Dc(t)}\\s*\\(`,`g`),a=i.exec(e);for(;a;){if(a.index<n||a.index>r)throw Error(`ShaderPlugin varying output struct "${t}" is constructed outside the selected vertex entry point`);a=i.exec(e)}}function fc(e,t,n,r){let i=RegExp(`\\b${Dc(t)}\\s*\\(`,`g`),a=[],o=i.exec(e);for(;o;){if(o.index>n.openBrace&&o.index<n.closeBrace){let r=e.indexOf(`(`,o.index),i=Tc(e,r,`(`,`)`);if(i<0||i>n.closeBrace)throw Error(`Unable to parse WGSL output constructor "${t}"`);a.push({openParenthesis:r,closeParenthesis:i})}o=i.exec(e)}for(let t of a.sort((e,t)=>t.closeParenthesis-e.closeParenthesis)){let n=e.slice(t.openParenthesis+1,t.closeParenthesis).trim()?`, `:``;e=e.slice(0,t.closeParenthesis)+n+r.join(`, `)+e.slice(t.closeParenthesis)}return e}function pc(e,t,n){let r=mc(e,t.openBrace+1,t.closeBrace);for(let t=r.length-1;t>=0;t--){let i=r[t],a=e.slice(i.expressionStart,i.semicolon).trim();if(!a)throw Error(`ShaderPlugin varying vertex entry point cannot use an empty return`);let o=`_luma_vertexOutput${t}`,s=`{\nvar ${o} = ${a};\n${n.map(e=>`${o}.${e} = ${e};`).join(`
`)}\nreturn ${o};\n}`;e=e.slice(0,i.start)+s+e.slice(i.semicolon+1)}return e}function mc(e,t,n){let r=[],i=t;for(;i<n;)if(i=gc(e,i,n),e.slice(i,i+6)===`return`&&!/[A-Za-z0-9_]/.test(e[i+6]||``)){let t=i+6,a=hc(e,t,n);if(a<0)throw Error(`Unable to parse WGSL return statement in selected vertex entry point`);r.push({start:i,expressionStart:t,semicolon:a}),i=a+1}else i++;return r}function hc(e,t,n){let r=0,i=0;for(let a=t;a<n;a++){let t=gc(e,a,n);if(t!==a){a=t-1;continue}let o=e[a];if(o===`(`&&r++,o===`)`&&r--,o===`[`&&i++,o===`]`&&i--,o===`;`&&r===0&&i===0)return a}return-1}function gc(e,t,n){let r=t;if(e[r]===`/`&&e[r+1]===`/`){let t=e.indexOf(`
`,r+2);return t<0||t>n?n:t+1}if(e[r]===`/`&&e[r+1]===`*`){let t=1;for(r+=2;r<n&&t>0;)e[r]===`/`&&e[r+1]===`*`?(t++,r+=2):e[r]===`*`&&e[r+1]===`/`?(t--,r+=2):r++}return r}function _c(e,t){let n=[],r=0,i=0,a=0;for(let o=0;o<e.length;o++){let s=e[o];s===`(`&&i++,s===`)`&&i--,s===`<`&&a++,s===`>`&&a--,s===t&&i===0&&a===0&&(n.push(e.slice(r,o)),r=o+1)}return n.push(e.slice(r)),n}function vc(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function yc(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function bc(e,t){let n=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${Dc(t)}\\b`,`g`),r=n.exec(e);for(;r;){if(Ec(e,r.index)===0)return!0;r=n.exec(e)}return!1}function xc(e){let t=0;for(;e.has(t);)t++;return t}function Sc(e){let{primitiveType:n,components:r}=t.getAttributeShaderTypeInfo(e),i=n===`u32`?`0u`:n===`i32`?`0`:`0.0`;return r===1?i:`${Gs(e)}(${i})`}function Cc(e){let{primitiveType:n,components:r}=t.getAttributeShaderTypeInfo(e),i=`${n}(0)`;return r===1?i:`${e}(${i})`}function wc(e,t){if(RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${Dc(t)}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin varying "${t}" conflicts with existing GLSL stage I/O`)}function Tc(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function Ec(e,t){let n=0;for(let r=0;r<t;r++){let i=gc(e,r,t);if(i!==r){r=i-1;continue}e[r]===`{`&&n++,e[r]===`}`&&n--}return n}function Dc(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}var Oc=`\n\n${oo}\n`,kc=100,Ac=`precision highp float;
`;function jc(e){let t=vo(e.modules||[]),{source:n,bindingAssignments:r}=Nc(e.platformInfo,{...e,source:e.source,stage:`vertex`,modules:t});return{source:n,getUniforms:Fc(t),bindingAssignments:r,bindingTable:Ds(n,r),shaderLayout:wa(n,{vertexEntryPoint:e.vertexEntryPoint,scanVertexAttributes:e.scanVertexAttributes})}}function Mc(e){let{vs:t,fs:n}=e,r=vo(e.modules||[]);return{vs:Pc(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:Pc(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:Fc(r)}}function Nc(e,t){let{source:n,stage:r,modules:i,defines:a={},hookFunctions:o=[],inject:s={},pluginInjections:c={},pluginVertexInputs:l={},pluginVaryings:u={},vertexEntryPoint:d=`vertexMain`,fragmentEntryPoint:f=`fragmentMain`,log:p}=t;Za(typeof n==`string`,`shader source must be a string`);let m=Ws(Vs(n,{defines:a}),d,l),h=ac(m.source,d,f,u),g=h.source,_=``,v=Ss(o),y={},b={},x={};Ic(c,y,b,x);for(let e in s){let t=typeof s[e]==`string`?{injection:s[e],order:0}:s[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?b[e]=[t]:x[e]=[t]:y[e]=[t]}else x[e]=[t]}Lc(m.declarations,m.initialization,b,x),Rc(h,b,x);let S=i,C=Gc(g),w=Wc(C.source),T=Yc(S,t._bindingRegistry,w,a),E=[];for(let e of S){p&&go(e,g,p);let n=Kc(Vs(Uc(e,`wgsl`,p),{defines:a}),e,{usedBindingsByGroup:w,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:T});E.push(...n.bindingAssignments);let r=n.source;_+=r;let i=zc(e);for(let e in i){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let n=t[2]===`decl`?b:x;n[e]=n[e]||[],n[e].push(i[e])}else y[e]=y[e]||[],y[e].push(i[e])}}return _+=Oc,_=lo(_,r,Bc(b),!1,`wgsl`,{vertex:d,fragment:f}),_+=Vc(v,y),_+=il(E),_+=C.source,_=lo(_,r,x,!1,`wgsl`,{vertex:d,fragment:f}),rl(_),{source:_,bindingAssignments:E}}function Pc(e,t){let{source:n,stage:r,language:i=`glsl`,modules:a,defines:o={},hookFunctions:s=[],inject:c={},pluginInjections:l={},pluginVertexInputs:u={},pluginVaryings:d={},prologue:f=!0,log:p}=t;Za(typeof n==`string`,`shader source must be a string`);let m=i===`glsl`?Cs(n).version:-1,h=e.shaderLanguageVersion,g=m===100?`#version 100`:`#version 300 es`,_=n.split(`
`).slice(1).join(`
`),v={};a.forEach(e=>{Object.assign(v,e.defines)}),Object.assign(v,o);let y=``;switch(i){case`wgsl`:break;case`glsl`:y=f?`\
${g}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${r.toUpperCase()}`}

${ms(e)}
${r===`fragment`?Ac:``}

// ----- APPLICATION DEFINES -------------------------

${Hc(v)}

`:`${g}
`;break}let b=Ss(s),x={},S={},C={};Ic(l,x,S,C);for(let e in c){let t=typeof c[e]==`string`?{injection:c[e],order:0}:c[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?S[e]=[t]:C[e]=[t]:x[e]=[t]}else C[e]=[t]}if(r===`vertex`){let e=Us(_,u);e&&(S[`vs:#decl`]=S[`vs:#decl`]||[],S[`vs:#decl`].push({injection:e,order:-(2**53-1)}))}let w=ic(_,r,d);if(w.declarations){let e=r===`vertex`?`vs:#decl`:`fs:#decl`;S[e]=S[e]||[],S[e].push({injection:w.declarations,order:-(2**53-1)})}w.initialization&&(C[`vs:#main-start`]=C[`vs:#main-start`]||[],C[`vs:#main-start`].push({injection:w.initialization,order:-(2**53-1)}));for(let e of a){p&&go(e,_,p);let t=Uc(e,r,p);y+=t;let n=e.instance?.normalizedInjections[r]||{};for(let e in n){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let r=t[2]===`decl`?S:C;r[e]=r[e]||[],r[e].push(n[e])}else x[e]=x[e]||[],x[e].push(n[e])}}return y+=`// ----- MAIN SHADER SOURCE -------------------------`,y+=Oc,y=lo(y,r,S),y+=xs(b[r],x),y+=_,y=lo(y,r,C),i===`glsl`&&m!==h&&(y=hs(y,r)),i===`glsl`&&is(y,r,p),y.trim()}function Fc(e){return function(t){let n={};for(let r of e){let e=r.getUniforms?.(t,n);Object.assign(n,e)}return n}}function Ic(e,t,n,r){for(let i in e){let a=/^(v|f)s:(#)?([\w-]+)$/.exec(i);if(a){let o=a[2],s=a[3],c=o?s===`decl`?n:r:t;c[i]=c[i]||[],c[i].push(...e[i])}else r[i]=r[i]||[],r[i].push(...e[i])}}function Lc(e,t,n,r){e&&(n[`vs:#decl`]=n[`vs:#decl`]||[],n[`vs:#decl`].push({injection:e,order:-(2**53-1)})),t&&(r[`vs:#main-start`]=r[`vs:#main-start`]||[],r[`vs:#main-start`].push({injection:t,order:-(2**53-1)}))}function Rc(e,t,n){e.declarations&&(t[`vs:#decl`]=t[`vs:#decl`]||[],t[`vs:#decl`].push({injection:e.declarations,order:-(2**53-1)})),e.vertexInitialization&&(n[`vs:#main-start`]=n[`vs:#main-start`]||[],n[`vs:#main-start`].push({injection:e.vertexInitialization,order:-(2**53-1)})),e.fragmentInitialization&&(n[`fs:#main-start`]=n[`fs:#main-start`]||[],n[`fs:#main-start`].push({injection:e.fragmentInitialization,order:-(2**53-1)}))}function zc(e){return{...e.instance?.normalizedInjections.vertex||{},...e.instance?.normalizedInjections.fragment||{}}}function Bc(e){let t=[...e[`vs:#decl`]||[],...e[`fs:#decl`]||[]];return t.length?{"vs:#decl":t}:{}}function Vc(e,t){return xs(e.vertex,t,`wgsl`)+xs(e.fragment,t,`wgsl`)}function Hc(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}function Uc(e,t,n){let r;switch(t){case`vertex`:r=e.vs||``;break;case`fragment`:r=e.fs||``;break;case`wgsl`:r=e.source||``;break;default:Za(!1)}if(!e.name)throw Error(`Shader module must have a name`);ns(e,t,{log:n});let i=e.name.toUpperCase().replace(/[^0-9a-z]/gi,`_`),a=`\
// ----- MODULE ${e.name} ---------------

`;return t!==`wgsl`&&(a+=`#define MODULE_${i}\n`),a+=`${r}\n`,a}function Wc(e){let t=new Map;for(let n of ba(e,_a)){let e=Number(n.bindingToken),r=Number(n.groupToken);Qc(r,e,n.name),el(t,r,e,`application binding "${n.name}"`)}return t}function Gc(e){let t=ba(e,ga),n=new Map;for(let e of t){if(e.bindingToken===`auto`)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);Qc(r,t,e.name),el(n,r,t,`application binding "${e.name}"`)}let r={sawSupportedBindingDeclaration:t.length>0},i=xa(e,ga,e=>Jc(e,n,r));if(Sa(e)&&!r.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:i}}function Kc(e,t,n){let r=[],i={sawSupportedBindingDeclaration:ba(e,ha).length>0,nextHintedBindingLocation:typeof t.firstBindingSlot==`number`?t.firstBindingSlot:null},a=xa(e,ha,e=>qc(e,{module:t,context:n,bindingAssignments:r,relocationState:i}));if(Sa(e)&&!i.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:a,bindingAssignments:r}}function qc(e,t){let{module:n,context:r,bindingAssignments:i,relocationState:a}=t,{match:o,bindingToken:s,groupToken:c,name:l}=e,u=Number(c);if(s===`auto`){let e=al(u,n.name,l),t=r.bindingRegistry?.get(e),s=t===void 0?tl(u,r.usedBindingsByGroup,n.name,a.nextHintedBindingLocation??void 0,r.bindingRegistry):t;return $c(n.name,u,s,l),t!==void 0&&Xc(r.reservedBindingKeysByGroup,u,s,e)?(i.push({moduleName:n.name,name:l,group:u,location:s}),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`)):(el(r.usedBindingsByGroup,u,s,`module "${n.name}" binding "${l}"`),r.bindingRegistry?.set(e,s),i.push({moduleName:n.name,name:l,group:u,location:s}),a.nextHintedBindingLocation!==null&&t===void 0&&(a.nextHintedBindingLocation=s+1),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`))}let d=Number(s);return $c(n.name,u,d,l),el(r.usedBindingsByGroup,u,d,`module "${n.name}" binding "${l}"`),i.push({moduleName:n.name,name:l,group:u,location:d}),o}function Jc(e,t,n){let{match:r,bindingToken:i,groupToken:a,name:o}=e,s=Number(a);if(i===`auto`){let e=nl(s,t);return Qc(s,e,o),el(t,s,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return n.sawSupportedBindingDeclaration=!0,r}function Yc(e,t,n,r){let i=new Map;if(!t)return i;for(let a of e)for(let e of Zc(a,r)){let r=al(e.group,a.name,e.name),o=t.get(r);if(o!==void 0){let t=i.get(e.group)||new Map,a=t.get(o);if(a&&a!==r)throw Error(`Duplicate WGSL binding reservation for modules "${a}" and "${r}": group ${e.group}, binding ${o}.`);el(n,e.group,o,`registered module binding "${r}"`),t.set(o,r),i.set(e.group,t)}}return i}function Xc(e,t,n,r){let i=e.get(t);if(!i)return!1;let a=i.get(n);if(!a)return!1;if(a!==r)throw Error(`Registered module binding "${r}" collided with "${a}": group ${t}, binding ${n}.`);return!0}function Zc(e,t){let n=[],r=Vs(e.source||``,{defines:t});for(let e of ba(r,ha))n.push({name:e.name,group:Number(e.groupToken)});return n}function Qc(e,t,n){if(e===0&&t>=kc)throw Error(`Application binding "${n}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below ${kc}.`)}function $c(e,t,n,r){if(t===0&&n<kc)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${n}. Module-owned explicit group-0 bindings must be ${kc} or higher.`)}function el(e,t,n,r){let i=e.get(t)||new Set;if(i.has(n))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${n}.`);i.add(n),e.set(t,i)}function tl(e,t,n,r,i){let a=t.get(e)||new Set,o=new Set,s=`${e}:`,c=`${s}${n}:`;for(let[e,t]of i||[])e.startsWith(c)&&o.add(t);let l=r??(e===0?kc:a.size>0?Math.max(...a)+1:0);for(;a.has(l)||o.has(l);)l++;for(let[e,t]of i||[])t===l&&e.startsWith(s)&&i?.delete(e);return l}function nl(e,t){let n=t.get(e)||new Set,r=0;for(;n.has(r);)r++;return r}function rl(e){let t=Ca(e,ha);if(!t)return;let n=ol(e,t.index);throw n?Error(`Unresolved @binding(auto) for module "${n}" binding "${t.name}" remained in assembled WGSL source.`):sl(e,t.index)?Error(`Unresolved @binding(auto) for application binding "${t.name}" remained in assembled WGSL source.`):Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${cl(t.match)}".`)}function il(e){if(e.length===0)return``;let t=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let n of e)t+=`// ${n.moduleName}.${n.name} -> @group(${n.group}) @binding(${n.location})\n`;return t+=`
`,t}function al(e,t,n){return`${e}:${t}:${n}`}function ol(e,t){let n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,r,i;for(i=n.exec(e);i&&i.index<=t;)r=i[1],i=n.exec(e);return r}function sl(e,t){let n=e.indexOf(Oc);return n>=0?t>n:!0}function cl(e){return e.replace(/\s+/g,` `).trim()}var ll=class e{static defaultShaderAssemblers={};_hookFunctions=[];_defaultModules=[];static getDefaultShaderAssembler(t){return Za(t===`glsl`||t===`wgsl`),t===`wgsl`?(e.defaultShaderAssemblers.wgsl=e.defaultShaderAssemblers.wgsl||new dl,e.defaultShaderAssemblers.wgsl):(e.defaultShaderAssemblers.glsl=e.defaultShaderAssemblers.glsl||new ul,e.defaultShaderAssemblers.glsl)}addDefaultModule(e){this._defaultModules.find(t=>t.name===(typeof e==`string`?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t=typeof e==`string`?e:e.name;this._defaultModules=this._defaultModules.filter(e=>e.name!==t)}addShaderHook(e,t){t&&(e=Object.assign(t,{hook:e})),this._hookFunctions.push(e)}_getModuleList(e=[]){let t=Array(this._defaultModules.length+e.length),n={},r=0;for(let e=0,i=this._defaultModules.length;e<i;++e){let i=this._defaultModules[e],a=i.name;t[r++]=i,n[a]=!0}for(let i=0,a=e.length;i<a;++i){let a=e[i],o=a.name;n[o]||(t[r++]=a,n[o]=!0)}return t.length=r,mo(t),t}},ul=class extends ll{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=this._hookFunctions;return{...Mc({...e,vs:e.vs,fs:e.fs,modules:t,hookFunctions:n}),modules:t}}},dl=class e extends ll{shaderLanguage=`wgsl`;_wgslBindingRegistry=new Map;assembleWGSLShader(t){let n=this._getModuleList(t.modules),r=this._hookFunctions,i=e.getShaderPreprocessorDefines(t,n),a=t.platformInfo.shaderLanguage===`wgsl`&&t.source?Vs(t.source,{defines:i}):t.source,{source:o,getUniforms:s,bindingAssignments:c}=jc({...t,source:a,defines:i,_bindingRegistry:this._wgslBindingRegistry,modules:n,hookFunctions:r}),l=t.platformInfo.shaderLanguage===`wgsl`?Vs(o,{defines:i}):o;return{source:l,getUniforms:s,modules:n,bindingAssignments:c,bindingTable:Ds(l,c),shaderLayout:wa(l,{vertexEntryPoint:t.vertexEntryPoint,scanVertexAttributes:t.scanVertexAttributes})}}static getShaderPreprocessorDefines(t,n){return{...e.getPlatformPreprocessorDefines(t.platformInfo),...n.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...t.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type===`webgpu`&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP32_TAN_PRECISION_WORKAROUND:e.type===`webgpu`&&e.gpu.toLowerCase()!==`nvidia`&&e.gpu.toLowerCase()!==`amd`,LUMA_FP64_INTEGER_ARITHMETIC:e.type===`webgpu`&&e.gpu.toLowerCase()===`apple`}}};function fl(e,t=[],n=0){let r=Math.fround(e),i=e-r;return t[n]=r,t[n+1]=i,t}function pl(e){return e-Math.fround(e)}function ml(e){let t=new Float32Array(32);for(let n=0;n<4;++n)for(let r=0;r<4;++r){let i=n*4+r;fl(e[r*4+n],t,i*2)}return t}function hl(e,t=!0){return e??t}function gl(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}function _l(e,t=!0){let n=gl(e.slice(0,3),t),r=Number.isFinite(e[3]),i=r?e[3]:1;return[n[0],n[1],n[2],t&&r?i/255:i]}var vl={name:`fp32`,source:`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
const FP32_TWO_PI: f32 = 6.2831854820251465;
const FP32_PI_2: f32 = 1.5707963705062866;
const FP32_PI_16: f32 = 0.1963495463132858;

const FP32_SIN_TABLE_0: f32 = 0.19509032368659973;
const FP32_SIN_TABLE_1: f32 = 0.3826834261417389;
const FP32_SIN_TABLE_2: f32 = 0.5555702447891235;
const FP32_SIN_TABLE_3: f32 = 0.7071067690849304;

const FP32_COS_TABLE_0: f32 = 0.9807852506637573;
const FP32_COS_TABLE_1: f32 = 0.9238795042037964;
const FP32_COS_TABLE_2: f32 = 0.8314695954322815;
const FP32_COS_TABLE_3: f32 = 0.7071067690849304;

const FP32_INVERSE_FACTORIAL_3: f32 = 1.666666716337204e-01;
const FP32_INVERSE_FACTORIAL_5: f32 = 8.333333767950535e-03;
const FP32_INVERSE_FACTORIAL_7: f32 = 1.9841270113829523e-04;
const FP32_INVERSE_FACTORIAL_9: f32 = 2.75573188446287533e-06;
const FP32_OVERFLOW: f32 = 3.402823466e+38;

fn sin_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let x = -a * a;
  var sum = a;
  var term = a;

  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_3;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_5;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_7;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_9;

  return sum;
}

fn tan_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let z = floor(a / FP32_TWO_PI);
  let reduced = a - FP32_TWO_PI * z;

  var quadrantValue = floor(reduced / FP32_PI_2 + 0.5);
  let quadrant = i32(quadrantValue);
  if (quadrant < -2 || quadrant > 2) {
    return FP32_OVERFLOW;
  }

  var angle = reduced - FP32_PI_2 * quadrantValue;
  quadrantValue = floor(angle / FP32_PI_16 + 0.5);
  let tableIndex = i32(quadrantValue);
  let absoluteTableIndex = abs(tableIndex);
  if (absoluteTableIndex > 4) {
    return FP32_OVERFLOW;
  }

  angle = angle - FP32_PI_16 * quadrantValue;
  let sinAngle = sin_taylor_fp32(angle);
  let cosAngle = sqrt(1.0 - sinAngle * sinAngle);

  var tableCos = 0.0;
  var tableSin = 0.0;
  if (absoluteTableIndex == 1) {
    tableCos = FP32_COS_TABLE_0;
    tableSin = FP32_SIN_TABLE_0;
  } else if (absoluteTableIndex == 2) {
    tableCos = FP32_COS_TABLE_1;
    tableSin = FP32_SIN_TABLE_1;
  } else if (absoluteTableIndex == 3) {
    tableCos = FP32_COS_TABLE_2;
    tableSin = FP32_SIN_TABLE_2;
  } else if (absoluteTableIndex == 4) {
    tableCos = FP32_COS_TABLE_3;
    tableSin = FP32_SIN_TABLE_3;
  }

  var sinReduced = sinAngle;
  var cosReduced = cosAngle;
  if (tableIndex > 0) {
    sinReduced = tableCos * sinAngle + tableSin * cosAngle;
    cosReduced = tableCos * cosAngle - tableSin * sinAngle;
  } else if (tableIndex < 0) {
    sinReduced = tableCos * sinAngle - tableSin * cosAngle;
    cosReduced = tableCos * cosAngle + tableSin * sinAngle;
  }

  var sinValue = 0.0;
  var cosValue = 0.0;
  if (quadrant == 0) {
    sinValue = sinReduced;
    cosValue = cosReduced;
  } else if (quadrant == 1) {
    sinValue = cosReduced;
    cosValue = -sinReduced;
  } else if (quadrant == -1) {
    sinValue = -cosReduced;
    cosValue = sinReduced;
  } else {
    sinValue = -sinReduced;
    cosValue = -cosReduced;
  }

  return sinValue / cosValue;
}

fn tan_fp32(a: f32) -> f32 {
  return tan_taylor_fp32(a);
}
#else
fn tan_fp32(a: f32) -> f32 {
  return tan(a);
}
#endif
`,vs:`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND

// All these functions are for substituting tan() function from Intel GPU only
const float TWO_PI = 6.2831854820251465;
const float PI_2 = 1.5707963705062866;
const float PI_16 = 0.1963495463132858;

const float SIN_TABLE_0 = 0.19509032368659973;
const float SIN_TABLE_1 = 0.3826834261417389;
const float SIN_TABLE_2 = 0.5555702447891235;
const float SIN_TABLE_3 = 0.7071067690849304;

const float COS_TABLE_0 = 0.9807852506637573;
const float COS_TABLE_1 = 0.9238795042037964;
const float COS_TABLE_2 = 0.8314695954322815;
const float COS_TABLE_3 = 0.7071067690849304;

const float INVERSE_FACTORIAL_3 = 1.666666716337204e-01; // 1/3!
const float INVERSE_FACTORIAL_5 = 8.333333767950535e-03; // 1/5!
const float INVERSE_FACTORIAL_7 = 1.9841270113829523e-04; // 1/7!
const float INVERSE_FACTORIAL_9 = 2.75573188446287533e-06; // 1/9!

float sin_taylor_fp32(float a) {
  float r, s, t, x;

  if (a == 0.0) {
    return 0.0;
  }

  x = -a * a;
  s = a;
  r = a;

  r = r * x;
  t = r * INVERSE_FACTORIAL_3;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_5;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_7;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_9;
  s = s + t;

  return s;
}

void sincos_taylor_fp32(float a, out float sin_t, out float cos_t) {
  if (a == 0.0) {
    sin_t = 0.0;
    cos_t = 1.0;
  }
  sin_t = sin_taylor_fp32(a);
  cos_t = sqrt(1.0 - sin_t * sin_t);
}

float tan_taylor_fp32(float a) {
    float sin_a;
    float cos_a;

    if (a == 0.0) {
        return 0.0;
    }

    // 2pi range reduction
    float z = floor(a / TWO_PI);
    float r = a - TWO_PI * z;

    float t;
    float q = floor(r / PI_2 + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return 1.0 / 0.0;
    }

    t = r - PI_2 * q;

    q = floor(t / PI_16 + 0.5);
    int k = int(q);
    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return 1.0 / 0.0;
    } else {
        t = t - PI_16 * q;
    }

    float u = 0.0;
    float v = 0.0;

    float sin_t, cos_t;
    float s, c;
    sincos_taylor_fp32(t, sin_t, cos_t);

    if (k == 0) {
        s = sin_t;
        c = cos_t;
    } else {
        if (abs(float(abs_k) - 1.0) < 0.5) {
            u = COS_TABLE_0;
            v = SIN_TABLE_0;
        } else if (abs(float(abs_k) - 2.0) < 0.5) {
            u = COS_TABLE_1;
            v = SIN_TABLE_1;
        } else if (abs(float(abs_k) - 3.0) < 0.5) {
            u = COS_TABLE_2;
            v = SIN_TABLE_2;
        } else if (abs(float(abs_k) - 4.0) < 0.5) {
            u = COS_TABLE_3;
            v = SIN_TABLE_3;
        }
        if (k > 0) {
            s = u * sin_t + v * cos_t;
            c = u * cos_t - v * sin_t;
        } else {
            s = u * sin_t - v * cos_t;
            c = u * cos_t + v * sin_t;
        }
    }

    if (j == 0) {
        sin_a = s;
        cos_a = c;
    } else if (j == 1) {
        sin_a = c;
        cos_a = -s;
    } else if (j == -1) {
        sin_a = -c;
        cos_a = s;
    } else {
        sin_a = -s;
        cos_a = -c;
    }
    return sin_a / cos_a;
}
#endif

float tan_fp32(float a) {
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
  return tan_taylor_fp32(a);
#else
  return tan(a);
#endif
}
`},yl=`
layout(std140) uniform fp64arithmeticUniforms {
  uniform float ONE;
  uniform float SPLIT;
} fp64;

/*
About LUMA_FP64_CODE_ELIMINATION_WORKAROUND

The purpose of this workaround is to prevent shader compilers from
optimizing away necessary arithmetic operations by swapping their sequences
or transform the equation to some 'equivalent' form.

These helpers implement Dekker/Veltkamp-style error tracking. If the compiler
folds constants or reassociates the arithmetic, the high/low split can stop
tracking the rounding error correctly. That failure mode tends to look fine in
simple coordinate setup, but then breaks down inside iterative arithmetic such
as fp64 Mandelbrot loops.

The method is to multiply an artifical variable, ONE, which will be known to
the compiler to be 1 only at runtime. The whole expression is then represented
as a polynomial with respective to ONE. In the coefficients of all terms, only one a
and one b should appear

err = (a + b) * ONE^6 - a * ONE^5 - (a + b) * ONE^4 + a * ONE^3 - b - (a + b) * ONE^2 + a * ONE
*/

float prevent_fp64_optimization(float value) {
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  return value + fp64.ONE * 0.0;
#else
  return value;
#endif
}

// Divide float number to high and low floats to extend fraction bits
vec2 split(float a) {
  // Keep SPLIT as a runtime uniform so the compiler cannot fold the Dekker
  // split into a constant expression and reassociate the recovery steps.
  float split = prevent_fp64_optimization(fp64.SPLIT);
  float t = prevent_fp64_optimization(a * split);
  float temp = t - a;
  float a_hi = t - temp;
  float a_lo = a - a_hi;
  return vec2(a_hi, a_lo);
}

// Divide float number again when high float uses too many fraction bits
vec2 split2(vec2 a) {
  vec2 b = split(a.x);
  b.y += a.y;
  return b;
}

// Special sum operation when a > b
vec2 quickTwoSum(float a, float b) {
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float sum = (a + b) * fp64.ONE;
  float err = b - (sum - a) * fp64.ONE;
#else
  float sum = a + b;
  float err = b - (sum - a);
#endif
  return vec2(sum, err);
}

// General sum operation
vec2 twoSum(float a, float b) {
  float s = (a + b);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float v = (s * fp64.ONE - a) * fp64.ONE;
  float err = (a - (s - v) * fp64.ONE) * fp64.ONE * fp64.ONE * fp64.ONE + (b - v);
#else
  float v = s - a;
  float err = (a - (s - v)) + (b - v);
#endif
  return vec2(s, err);
}

vec2 twoSub(float a, float b) {
  float s = (a - b);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float v = (s * fp64.ONE - a) * fp64.ONE;
  float err = (a - (s - v) * fp64.ONE) * fp64.ONE * fp64.ONE * fp64.ONE - (b + v);
#else
  float v = s - a;
  float err = (a - (s - v)) - (b + v);
#endif
  return vec2(s, err);
}

vec2 twoSqr(float a) {
  float prod = a * a;
  vec2 a_fp64 = split(a);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float err = ((a_fp64.x * a_fp64.x - prod) * fp64.ONE + 2.0 * a_fp64.x *
    a_fp64.y * fp64.ONE * fp64.ONE) + a_fp64.y * a_fp64.y * fp64.ONE * fp64.ONE * fp64.ONE;
#else
  float err = ((a_fp64.x * a_fp64.x - prod) + 2.0 * a_fp64.x * a_fp64.y) + a_fp64.y * a_fp64.y;
#endif
  return vec2(prod, err);
}

vec2 twoProd(float a, float b) {
  float prod = a * b;
  vec2 a_fp64 = split(a);
  vec2 b_fp64 = split(b);
  // twoProd is especially sensitive because mul_fp64 and div_fp64 both depend
  // on the split terms and cross terms staying in the original evaluation
  // order. If the compiler folds or reassociates them, the low part tends to
  // collapse to zero or NaN on some drivers.
  float highProduct = prevent_fp64_optimization(a_fp64.x * b_fp64.x);
  float crossProduct1 = prevent_fp64_optimization(a_fp64.x * b_fp64.y);
  float crossProduct2 = prevent_fp64_optimization(a_fp64.y * b_fp64.x);
  float lowProduct = prevent_fp64_optimization(a_fp64.y * b_fp64.y);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float err1 = (highProduct - prod) * fp64.ONE;
  float err2 = crossProduct1 * fp64.ONE * fp64.ONE;
  float err3 = crossProduct2 * fp64.ONE * fp64.ONE * fp64.ONE;
  float err4 = lowProduct * fp64.ONE * fp64.ONE * fp64.ONE * fp64.ONE;
#else
  float err1 = highProduct - prod;
  float err2 = crossProduct1;
  float err3 = crossProduct2;
  float err4 = lowProduct;
#endif
  float err = ((err1 + err2) + err3) + err4;
  return vec2(prod, err);
}

vec2 sum_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSum(a.x, b.x);
  t = twoSum(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 sub_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSub(a.x, b.x);
  t = twoSub(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 mul_fp64(vec2 a, vec2 b) {
  vec2 prod = twoProd(a.x, b.x);
  // y component is for the error
  prod.y += a.x * b.y;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  prod.y += a.y * b.x;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  return prod;
}

vec2 div_fp64(vec2 a, vec2 b) {
  float xn = 1.0 / b.x;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  vec2 yn = mul_fp64(a, vec2(xn, 0));
#else
  vec2 yn = a * xn;
#endif
  float diff = (sub_fp64(a, mul_fp64(b, yn))).x;
  vec2 prod = twoProd(xn, diff);
  return sum_fp64(yn, prod);
}

vec2 sqrt_fp64(vec2 a) {
  if (a.x == 0.0 && a.y == 0.0) return vec2(0.0, 0.0);
  if (a.x < 0.0) return vec2(0.0 / 0.0, 0.0 / 0.0);

  float x = 1.0 / sqrt(a.x);
  float yn = a.x * x;
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  vec2 yn_sqr = twoSqr(yn) * fp64.ONE;
#else
  vec2 yn_sqr = twoSqr(yn);
#endif
  float diff = sub_fp64(a, yn_sqr).x;
  vec2 prod = twoProd(x * 0.5, diff);
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  return sum_fp64(split(yn), prod);
#else
  return sum_fp64(vec2(yn, 0.0), prod);
#endif
}
`,bl={name:`fp64arithmetic`,source:`struct Fp64ArithmeticUniforms {
  ONE: f32,
  SPLIT: f32,
};

@group(0) @binding(auto) var<uniform> fp64arithmetic : Fp64ArithmeticUniforms;

#ifndef LUMA_FP64_F32_INPUT_ONLY
struct Fp64Bits {
  sign: u32,
  exponent: i32,
  significand: vec2u,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_nan(seed: f32) -> f32 {
  let nanBits = 0x7fc00000u | select(0u, 1u, seed < 0.0);
  return bitcast<f32>(nanBits);
}
#endif

fn fp64_u64_is_zero(value: vec2u) -> bool {
  return value.x == 0u && value.y == 0u;
}

fn fp64_u64_compare(a: vec2u, b: vec2u) -> i32 {
  if (a.x != b.x) {
    return select(-1, 1, a.x > b.x);
  }
  if (a.y != b.y) {
    return select(-1, 1, a.y > b.y);
  }
  return 0;
}

fn fp64_u64_add(a: vec2u, b: vec2u) -> vec2u {
  let low = a.y + b.y;
  let carry = select(0u, 1u, low < a.y);
  return vec2u(a.x + b.x + carry, low);
}

fn fp64_u64_sub(a: vec2u, b: vec2u) -> vec2u {
  let borrow = select(0u, 1u, a.y < b.y);
  return vec2u(a.x - b.x - borrow, a.y - b.y);
}

fn fp64_u64_shift_left(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u((value.x << shift) | (value.y >> (32u - shift)), value.y << shift);
  }
  if (shift == 32u) {
    return vec2u(value.y, 0u);
  }
  if (shift < 64u) {
    return vec2u(value.y << (shift - 32u), 0u);
  }
  return vec2u(0u);
}

fn fp64_u64_shift_right(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u(value.x >> shift, (value.y >> shift) | (value.x << (32u - shift)));
  }
  if (shift == 32u) {
    return vec2u(0u, value.x);
  }
  if (shift < 64u) {
    return vec2u(0u, value.x >> (shift - 32u));
  }
  return vec2u(0u);
}

fn fp64_u64_get_bit(value: vec2u, bitIndex: u32) -> bool {
  if (bitIndex >= 64u) {
    return false;
  }
  if (bitIndex >= 32u) {
    return ((value.x >> (bitIndex - 32u)) & 1u) != 0u;
  }
  return ((value.y >> bitIndex) & 1u) != 0u;
}

fn fp64_u64_has_bits_below(value: vec2u, bitCount: u32) -> bool {
  if (bitCount == 0u) {
    return false;
  }
  if (bitCount >= 64u) {
    return !fp64_u64_is_zero(value);
  }
  if (bitCount > 32u) {
    let highBitCount = bitCount - 32u;
    let highMask = (1u << highBitCount) - 1u;
    return value.y != 0u || (value.x & highMask) != 0u;
  }
  if (bitCount == 32u) {
    return value.y != 0u;
  }
  let lowMask = (1u << bitCount) - 1u;
  return (value.y & lowMask) != 0u;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_u64_shift_right_sticky(value: vec2u, shift: u32) -> vec2u {
  var shifted = fp64_u64_shift_right(value, shift);
  if (fp64_u64_has_bits_below(value, shift)) {
    shifted.y = shifted.y | 1u;
  }
  return shifted;
}
#endif

fn fp64_u64_count_leading_zeros(value: vec2u) -> u32 {
  if (value.x != 0u) {
    return countLeadingZeros(value.x);
  }
  return 32u + countLeadingZeros(value.y);
}

fn fp64_round_shift_right_to_u32(value: vec2u, shift: u32) -> u32 {
  if (shift == 0u) {
    return value.y;
  }

  let truncated = fp64_u64_shift_right(value, shift);
  var rounded = truncated.y;
  let guard = fp64_u64_get_bit(value, shift - 1u);
  let hasTrailingBits = fp64_u64_has_bits_below(value, shift - 1u);
  if (guard && (hasTrailingBits || (rounded & 1u) == 1u)) {
    rounded = rounded + 1u;
  }
  return rounded;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_round_shift_right(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }

  var rounded = fp64_u64_shift_right(value, shift);
  let guard = fp64_u64_get_bit(value, shift - 1u);
  let hasTrailingBits = fp64_u64_has_bits_below(value, shift - 1u);
  if (guard && (hasTrailingBits || (rounded.y & 1u) == 1u)) {
    rounded = fp64_u64_add(rounded, vec2u(0u, 1u));
  }
  return rounded;
}
#endif

fn fp64_make_f32_bits_from_u64(sign: u32, significand: vec2u, baseExponent: i32) -> u32 {
  if (fp64_u64_is_zero(significand)) {
    return sign << 31u;
  }

  let leadingZeros = fp64_u64_count_leading_zeros(significand);
  let mostSignificantBit = 63u - leadingZeros;
  var exponent = baseExponent + i32(mostSignificantBit);

  if (exponent > 127) {
    return (sign << 31u) | 0x7f800000u;
  }

  if (exponent >= -126) {
    let shift = i32(mostSignificantBit) - 23;
    var significand24: u32;
    if (shift > 0) {
      significand24 = fp64_round_shift_right_to_u32(significand, u32(shift));
    } else {
      significand24 = fp64_u64_shift_left(significand, u32(-shift)).y;
    }

    if (significand24 >= 0x1000000u) {
      significand24 = significand24 >> 1u;
      exponent = exponent + 1;
      if (exponent > 127) {
        return (sign << 31u) | 0x7f800000u;
      }
    }

    return (sign << 31u) | (u32(exponent + 127) << 23u) | (significand24 & 0x7fffffu);
  }

  let scaleExponent = baseExponent + 149;
  var mantissa: u32;
  if (scaleExponent >= 0) {
    mantissa = fp64_u64_shift_left(significand, u32(scaleExponent)).y;
  } else {
    mantissa = fp64_round_shift_right_to_u32(significand, u32(-scaleExponent));
  }

  if (mantissa >= 0x800000u) {
    return (sign << 31u) | 0x00800000u;
  }
  return (sign << 31u) | mantissa;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_decode_bits(bits: vec2u) -> Fp64Bits {
  let sign = bits.x >> 31u;
  let exponentBits = (bits.x >> 20u) & 0x7ffu;
  let fractionHigh = bits.x & 0xfffffu;
  let fractionLow = bits.y;
  let fraction = vec2u(fractionHigh, fractionLow);

  if (exponentBits == 0x7ffu) {
    let isInf = fp64_u64_is_zero(fraction);
    return Fp64Bits(sign, 0, vec2u(0u), false, isInf, !isInf);
  }

  if (exponentBits == 0u) {
    let isZero = fp64_u64_is_zero(fraction);
    return Fp64Bits(sign, -1022, fraction, isZero, false, false);
  }

  return Fp64Bits(sign, i32(exponentBits) - 1023, vec2u((1u << 20u) | fractionHigh, fractionLow), false, false, false);
}

fn fp64_finite_magnitude_compare(a: Fp64Bits, b: Fp64Bits) -> i32 {
  if (a.exponent != b.exponent) {
    return select(-1, 1, a.exponent > b.exponent);
  }
  return fp64_u64_compare(a.significand, b.significand);
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
struct Fp64RawF32Bits {
  sign: u32,
  baseExponent: i32,
  significand: u32,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};

// Decode an f32 as (-1)^sign * significand * 2^baseExponent. This shared
// integer representation lets normalization remain independent of the
// selected double-single arithmetic implementation.
fn fp64_decode_raw_f32_bits(bits: u32) -> Fp64RawF32Bits {
  let sign = bits >> 31u;
  let exponentBits = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x7fffffu;

  if (exponentBits == 0xffu) {
    return Fp64RawF32Bits(sign, 0, 0u, false, fraction == 0u, fraction != 0u);
  }
  if (exponentBits == 0u) {
    return Fp64RawF32Bits(sign, -149, fraction, fraction == 0u, false, false);
  }
  return Fp64RawF32Bits(
    sign,
    i32(exponentBits) - 150,
    0x800000u | fraction,
    false,
    false,
    false
  );
}

fn fp64_raw_f32_magnitude_compare(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  return select(-1, 1, aMagnitude > bMagnitude);
}

fn fp64_make_raw_residual_f32_bits(
  exactSign: u32,
  exactMagnitude: vec2u,
  exactBaseExponent: i32,
  highBits: u32
) -> u32 {
  if (fp64_u64_is_zero(exactMagnitude)) {
    return 0u;
  }

  let high = fp64_decode_raw_f32_bits(highBits);
  if (high.isInf || high.isNan) {
    return 0u;
  }
  if (high.isZero) {
    return fp64_make_f32_bits_from_u64(exactSign, exactMagnitude, exactBaseExponent);
  }

  let commonBaseExponent = min(exactBaseExponent, high.baseExponent);
  let exactShift = exactBaseExponent - commonBaseExponent;
  let highShift = high.baseExponent - commonBaseExponent;
  if (exactShift >= 64 || highShift >= 64) {
    return 0u;
  }

  let exactAligned = fp64_u64_shift_left(exactMagnitude, u32(exactShift));
  let highAligned = fp64_u64_shift_left(vec2u(0u, high.significand), u32(highShift));
  let comparison = fp64_u64_compare(exactAligned, highAligned);
  if (comparison == 0) {
    return 0u;
  }

  var residualSign = exactSign;
  var residualMagnitude: vec2u;
  if (comparison > 0) {
    residualMagnitude = fp64_u64_sub(exactAligned, highAligned);
  } else {
    residualSign = exactSign ^ 1u;
    residualMagnitude = fp64_u64_sub(highAligned, exactAligned);
  }
  return fp64_make_f32_bits_from_u64(
    residualSign,
    residualMagnitude,
    commonBaseExponent
  );
}

fn fp64_split_raw_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  if (fp64_u64_is_zero(magnitude)) {
    return vec2u(0u);
  }
  let highBits = fp64_make_f32_bits_from_u64(sign, magnitude, baseExponent);
  let rawLowBits = fp64_make_raw_residual_f32_bits(sign, magnitude, baseExponent, highBits);
  let lowBits = select(rawLowBits, 0u, (rawLowBits & 0x7fffffffu) == 0u);
  if ((highBits & 0x7fffffffu) == 0u && (lowBits & 0x7fffffffu) == 0u) {
    return vec2u(0u);
  }
  return vec2u(highBits, lowBits);
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
// Round an arithmetic accumulator to binary64 before splitting it. The
// aligned add/subtract paths retain three guard bits plus a sticky bit, which
// is sufficient for round-to-nearest-even at the binary64 boundary.
fn fp64_split_binary64_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  if (fp64_u64_is_zero(magnitude)) {
    return vec2u(0u);
  }

  let mostSignificantBit = 63u - fp64_u64_count_leading_zeros(magnitude);
  let exponent = baseExponent + i32(mostSignificantBit);
  if (exponent > 1023) {
    return vec2u((sign << 31u) | 0x7f800000u, 0u);
  }

  var roundedMagnitude = magnitude;
  var roundedBaseExponent = baseExponent;
  if (exponent >= -1022) {
    if (mostSignificantBit > 52u) {
      let shift = mostSignificantBit - 52u;
      roundedMagnitude = fp64_round_shift_right(magnitude, shift);
      roundedBaseExponent = baseExponent + i32(shift);
    }
  } else {
    let shift = -1074 - baseExponent;
    if (shift > 0) {
      roundedMagnitude = fp64_round_shift_right(magnitude, u32(shift));
      roundedBaseExponent = -1074;
    }
  }

  if (fp64_u64_is_zero(roundedMagnitude)) {
    return vec2u(0u);
  }
  return fp64_split_raw_accumulator_bits(sign, roundedMagnitude, roundedBaseExponent);
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_add_raw_f32_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_raw_f32_bits(aBits);
  let b = fp64_decode_raw_f32_bits(bBits);

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    if (a.isInf && b.isInf && a.sign != b.sign) {
      return vec2u(0x7fc00000u, 0u);
    }
    return select(vec2u(bBits, 0u), vec2u(aBits, 0u), a.isInf);
  }
  if (a.isZero && b.isZero) {
    return vec2u(0u);
  }
  if (a.isZero) {
    return vec2u(bBits, 0u);
  }
  if (b.isZero) {
    return vec2u(aBits, 0u);
  }

  let exponentDifference = abs(a.baseExponent - b.baseExponent);
  if (exponentDifference > 25) {
    if (fp64_raw_f32_magnitude_compare(aBits, bBits) >= 0) {
      return vec2u(aBits, bBits);
    }
    return vec2u(bBits, aBits);
  }

  let commonBaseExponent = min(a.baseExponent, b.baseExponent);
  let aMagnitude = fp64_u64_shift_left(
    vec2u(0u, a.significand),
    u32(a.baseExponent - commonBaseExponent)
  );
  let bMagnitude = fp64_u64_shift_left(
    vec2u(0u, b.significand),
    u32(b.baseExponent - commonBaseExponent)
  );

  var resultSign = a.sign;
  var resultMagnitude: vec2u;
  if (a.sign == b.sign) {
    resultMagnitude = fp64_u64_add(aMagnitude, bMagnitude);
  } else {
    let comparison = fp64_u64_compare(aMagnitude, bMagnitude);
    if (comparison == 0) {
      return vec2u(0u);
    }
    if (comparison > 0) {
      resultMagnitude = fp64_u64_sub(aMagnitude, bMagnitude);
    } else {
      resultSign = b.sign;
      resultMagnitude = fp64_u64_sub(bMagnitude, aMagnitude);
    }
  }

  return fp64_split_raw_accumulator_bits(
    resultSign,
    resultMagnitude,
    commonBaseExponent
  );
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_add_aligned_magnitudes_to_fp64_bits(
  sign: u32,
  larger: Fp64Bits,
  smaller: Fp64Bits
) -> vec2u {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_add(largeSignificand, smallSignificand);
  return fp64_split_binary64_accumulator_bits(
    sign,
    resultSignificand,
    larger.exponent - 55
  );
}

fn fp64_sub_aligned_magnitudes_to_fp64_bits(
  sign: u32,
  larger: Fp64Bits,
  smaller: Fp64Bits
) -> vec2u {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_sub(largeSignificand, smallSignificand);
  return fp64_split_binary64_accumulator_bits(
    sign,
    resultSignificand,
    larger.exponent - 55
  );
}

fn fp64_add_aligned_magnitudes_to_f32_bits(sign: u32, larger: Fp64Bits, smaller: Fp64Bits) -> u32 {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_add(largeSignificand, smallSignificand);
  return fp64_make_f32_bits_from_u64(sign, resultSignificand, larger.exponent - 55);
}

fn fp64_sub_aligned_magnitudes_to_f32_bits(sign: u32, larger: Fp64Bits, smaller: Fp64Bits) -> u32 {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_sub(largeSignificand, smallSignificand);
  return fp64_make_f32_bits_from_u64(sign, resultSignificand, larger.exponent - 55);
}

// Subtract two raw binary64 values and round the exact result once to f32.
// The input words are canonical high/low words: .x contains sign/exponent/high
// fraction bits, and .y contains the low 32 fraction bits.
fn sub_fp64u32_to_f32_bits(aBits: vec2u, bBits: vec2u) -> u32 {
  let a = fp64_decode_bits(aBits);
  let b = fp64_decode_bits(bBits);
  let bSubtractionSign = b.sign ^ 1u;

  if (a.isNan || b.isNan) {
    return 0x7fc00000u;
  }
  if (a.isInf && b.isInf) {
    if (a.sign == bSubtractionSign) {
      return (a.sign << 31u) | 0x7f800000u;
    }
    return 0x7fc00000u;
  }
  if (a.isInf) {
    return (a.sign << 31u) | 0x7f800000u;
  }
  if (b.isInf) {
    return (bSubtractionSign << 31u) | 0x7f800000u;
  }
  if (a.isZero && b.isZero) {
    return select(0u, 0x80000000u, a.sign == 1u && b.sign == 0u);
  }

  let magnitudeComparison = fp64_finite_magnitude_compare(a, b);
  if (a.sign == bSubtractionSign) {
    if (magnitudeComparison >= 0) {
      return fp64_add_aligned_magnitudes_to_f32_bits(a.sign, a, b);
    }
    return fp64_add_aligned_magnitudes_to_f32_bits(a.sign, b, a);
  }

  if (magnitudeComparison == 0) {
    return 0u;
  }
  if (magnitudeComparison > 0) {
    return fp64_sub_aligned_magnitudes_to_f32_bits(a.sign, a, b);
  }
  return fp64_sub_aligned_magnitudes_to_f32_bits(bSubtractionSign, b, a);
}

fn sub_fp64u32_to_f32(aBits: vec2u, bBits: vec2u) -> f32 {
  return bitcast<f32>(sub_fp64u32_to_f32_bits(aBits, bBits));
}

// Subtract two raw binary64 values, round once to binary64, then split the
// result into normalized f32 limbs. Finite results must fit within the f32
// exponent range; larger magnitudes map to infinity and smaller magnitudes
// map to zero. The input words use canonical high/low word order.
fn sub_fp64u32_to_fp64_bits(aBits: vec2u, bBits: vec2u) -> vec2u {
  let a = fp64_decode_bits(aBits);
  let b = fp64_decode_bits(bBits);
  let bSubtractionSign = b.sign ^ 1u;

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf && b.isInf) {
    if (a.sign == bSubtractionSign) {
      return vec2u((a.sign << 31u) | 0x7f800000u, 0u);
    }
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf) {
    return vec2u((a.sign << 31u) | 0x7f800000u, 0u);
  }
  if (b.isInf) {
    return vec2u((bSubtractionSign << 31u) | 0x7f800000u, 0u);
  }
  if (a.isZero && b.isZero) {
    return vec2u(0u);
  }

  let magnitudeComparison = fp64_finite_magnitude_compare(a, b);
  if (a.sign == bSubtractionSign) {
    if (magnitudeComparison >= 0) {
      return fp64_add_aligned_magnitudes_to_fp64_bits(a.sign, a, b);
    }
    return fp64_add_aligned_magnitudes_to_fp64_bits(a.sign, b, a);
  }

  if (magnitudeComparison == 0) {
    return vec2u(0u);
  }
  if (magnitudeComparison > 0) {
    return fp64_sub_aligned_magnitudes_to_fp64_bits(a.sign, a, b);
  }
  return fp64_sub_aligned_magnitudes_to_fp64_bits(bSubtractionSign, b, a);
}

fn sub_fp64u32_to_fp64(aBits: vec2u, bBits: vec2u) -> vec2f {
  let resultBits = sub_fp64u32_to_fp64_bits(aBits, bBits);
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_runtime_zero() -> f32 {
  return fp64arithmetic.ONE * 0.0;
}

fn prevent_fp64_optimization(value: f32) -> f32 {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  return value + fp64_runtime_zero();
#else
  return value;
#endif
}
#endif

#ifdef LUMA_FP64_INTEGER_ARITHMETIC
struct Fp64F32Bits {
  sign: u32,
  baseExponent: i32,
  significand: u32,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};

// Decode an f32 as (-1)^sign * significand * 2^baseExponent.
fn fp64_decode_f32_bits(bits: u32) -> Fp64F32Bits {
  let sign = bits >> 31u;
  let exponentBits = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x7fffffu;

  if (exponentBits == 0xffu) {
    return Fp64F32Bits(sign, 0, 0u, false, fraction == 0u, fraction != 0u);
  }
  if (exponentBits == 0u) {
    return Fp64F32Bits(sign, -149, fraction, fraction == 0u, false, false);
  }
  return Fp64F32Bits(sign, i32(exponentBits) - 150, 0x800000u | fraction, false, false, false);
}

fn fp64_f32_magnitude_compare(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  return select(-1, 1, aMagnitude > bMagnitude);
}

fn fp64_make_residual_f32_bits(
  exactSign: u32,
  exactMagnitude: vec2u,
  exactBaseExponent: i32,
  highBits: u32
) -> u32 {
  if (fp64_u64_is_zero(exactMagnitude)) {
    return 0u;
  }

  let high = fp64_decode_f32_bits(highBits);
  if (high.isInf || high.isNan) {
    return exactSign << 31u;
  }
  if (high.isZero) {
    return fp64_make_f32_bits_from_u64(exactSign, exactMagnitude, exactBaseExponent);
  }

  let commonBaseExponent = min(exactBaseExponent, high.baseExponent);
  let exactShift = exactBaseExponent - commonBaseExponent;
  let highShift = high.baseExponent - commonBaseExponent;

  // A normal two-sum/two-product residual never needs a shift this large.
  // This guard gives deterministic underflow behavior outside that contract.
  if (exactShift >= 64 || highShift >= 64) {
    return exactSign << 31u;
  }

  let exactAligned = fp64_u64_shift_left(exactMagnitude, u32(exactShift));
  let highAligned = fp64_u64_shift_left(vec2u(0u, high.significand), u32(highShift));
  let comparison = fp64_u64_compare(exactAligned, highAligned);
  if (comparison == 0) {
    return 0u;
  }

  var residualSign = exactSign;
  var residualMagnitude: vec2u;
  if (comparison > 0) {
    residualMagnitude = fp64_u64_sub(exactAligned, highAligned);
  } else {
    residualSign = exactSign ^ 1u;
    residualMagnitude = fp64_u64_sub(highAligned, exactAligned);
  }
  return fp64_make_f32_bits_from_u64(
    residualSign,
    residualMagnitude,
    commonBaseExponent
  );
}

fn fp64_split_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  let highBits = fp64_make_f32_bits_from_u64(sign, magnitude, baseExponent);
  let lowBits = fp64_make_residual_f32_bits(sign, magnitude, baseExponent, highBits);
  return vec2u(highBits, lowBits);
}

fn fp64_two_sum_integer_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_f32_bits(aBits);
  let b = fp64_decode_f32_bits(bBits);

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    if (a.isInf && b.isInf && a.sign != b.sign) {
      return vec2u(0x7fc00000u, 0u);
    }
    return select(vec2u(bBits, 0u), vec2u(aBits, 0u), a.isInf);
  }
  if (a.isZero && b.isZero) {
    return vec2u((a.sign & b.sign) << 31u, 0u);
  }
  if (a.isZero) {
    return vec2u(bBits, 0u);
  }
  if (b.isZero) {
    return vec2u(aBits, 0u);
  }

  let exponentDifference = select(
    b.baseExponent - a.baseExponent,
    a.baseExponent - b.baseExponent,
    a.baseExponent >= b.baseExponent
  );

  // Beyond half an ulp, rounding cannot change the larger operand. Returning
  // the smaller operand intact also avoids an unbounded integer alignment.
  // At a power-of-two boundary the spacing below the larger operand is half
  // the spacing above it, so an opposite-sign gap-25 operand can still change
  // the rounded high limb. Gap 26 is the first universally safe early-out.
  if (exponentDifference > 25) {
    if (fp64_f32_magnitude_compare(aBits, bBits) >= 0) {
      return vec2u(aBits, bBits);
    }
    return vec2u(bBits, aBits);
  }

  let commonBaseExponent = min(a.baseExponent, b.baseExponent);
  let aMagnitude = fp64_u64_shift_left(
    vec2u(0u, a.significand),
    u32(a.baseExponent - commonBaseExponent)
  );
  let bMagnitude = fp64_u64_shift_left(
    vec2u(0u, b.significand),
    u32(b.baseExponent - commonBaseExponent)
  );

  var resultSign = a.sign;
  var resultMagnitude: vec2u;
  if (a.sign == b.sign) {
    resultMagnitude = fp64_u64_add(aMagnitude, bMagnitude);
  } else {
    let comparison = fp64_u64_compare(aMagnitude, bMagnitude);
    if (comparison == 0) {
      return vec2u(0u, 0u);
    }
    if (comparison > 0) {
      resultMagnitude = fp64_u64_sub(aMagnitude, bMagnitude);
    } else {
      resultSign = b.sign;
      resultMagnitude = fp64_u64_sub(bMagnitude, aMagnitude);
    }
  }

  return fp64_split_accumulator_bits(resultSign, resultMagnitude, commonBaseExponent);
}

fn fp64_two_sum_integer(a: f32, b: f32) -> vec2f {
  let resultBits = fp64_two_sum_integer_bits(bitcast<u32>(a), bitcast<u32>(b));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn fp64_multiply_significands(a: u32, b: u32) -> vec2u {
  let aLow = a & 0xffffu;
  let aHigh = a >> 16u;
  let bLow = b & 0xffffu;
  let bHigh = b >> 16u;
  let lowProduct = aLow * bLow;
  let crossProduct = aLow * bHigh + aHigh * bLow;
  let highProduct = aHigh * bHigh;

  var result = vec2u(0u, lowProduct);
  result = fp64_u64_add(
    result,
    fp64_u64_shift_left(vec2u(0u, crossProduct), 16u)
  );
  result = fp64_u64_add(result, vec2u(highProduct, 0u));
  return result;
}

fn fp64_two_prod_integer_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_f32_bits(aBits);
  let b = fp64_decode_f32_bits(bBits);
  let resultSign = a.sign ^ b.sign;

  if (a.isNan || b.isNan || ((a.isZero || b.isZero) && (a.isInf || b.isInf))) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    return vec2u((resultSign << 31u) | 0x7f800000u, resultSign << 31u);
  }
  if (a.isZero || b.isZero) {
    return vec2u(resultSign << 31u, resultSign << 31u);
  }

  let magnitude = fp64_multiply_significands(a.significand, b.significand);
  return fp64_split_accumulator_bits(
    resultSign,
    magnitude,
    a.baseExponent + b.baseExponent
  );
}

fn fp64_two_prod_integer(a: f32, b: f32) -> vec2f {
  let resultBits = fp64_two_prod_integer_bits(bitcast<u32>(a), bitcast<u32>(b));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn fp64_round_add_integer(a: f32, b: f32) -> f32 {
  return fp64_two_sum_integer(a, b).x;
}

fn fp64_round_mul_integer(a: f32, b: f32) -> f32 {
  return fp64_two_prod_integer(a, b).x;
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_f32_finite_exponent(value: Fp64F32Bits) -> i32 {
  let mostSignificantBit = 31u - countLeadingZeros(value.significand);
  return value.baseExponent + i32(mostSignificantBit);
}

fn fp64_scale_f32_integer(value: f32, exponent: i32) -> f32 {
  let decoded = fp64_decode_f32_bits(bitcast<u32>(value));
  if (decoded.isZero || decoded.isInf || decoded.isNan) {
    return value;
  }
  let resultBits = fp64_make_f32_bits_from_u64(
    decoded.sign,
    vec2u(0u, decoded.significand),
    decoded.baseExponent + exponent
  );
  return bitcast<f32>(resultBits);
}

// Divide normalized significands so the hardware operation cannot overflow,
// underflow, or flush a subnormal result. Reapply the exponent with integer
// packing, which also produces subnormal correction limbs without relying on
// floating-point arithmetic to preserve them.
fn fp64_divide_f32_integer(aValue: f32, bValue: f32) -> f32 {
  let a = fp64_decode_f32_bits(bitcast<u32>(aValue));
  let b = fp64_decode_f32_bits(bitcast<u32>(bValue));
  if (a.isZero || b.isZero || a.isInf || b.isInf || a.isNan || b.isNan) {
    return aValue / bValue;
  }

  let aMostSignificantBit = 31u - countLeadingZeros(a.significand);
  let bMostSignificantBit = 31u - countLeadingZeros(b.significand);
  let normalizedABits = fp64_make_f32_bits_from_u64(
    a.sign,
    vec2u(0u, a.significand),
    -i32(aMostSignificantBit)
  );
  let normalizedBBits = fp64_make_f32_bits_from_u64(
    b.sign,
    vec2u(0u, b.significand),
    -i32(bMostSignificantBit)
  );
  let normalizedQuotient = bitcast<f32>(normalizedABits) / bitcast<f32>(normalizedBBits);
  let quotient = fp64_decode_f32_bits(bitcast<u32>(normalizedQuotient));
  let exponentShift =
    a.baseExponent + i32(aMostSignificantBit) -
    b.baseExponent - i32(bMostSignificantBit);
  let quotientBits = fp64_make_f32_bits_from_u64(
    quotient.sign,
    vec2u(0u, quotient.significand),
    quotient.baseExponent + exponentShift
  );
  return bitcast<f32>(quotientBits);
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn split(a: f32) -> vec2f {
  let aBits = bitcast<u32>(a);
  let decoded = fp64_decode_f32_bits(aBits);
  if (decoded.isZero || decoded.isInf || decoded.isNan) {
    return vec2f(a, 0.0);
  }

  var roundedHigh = decoded.significand >> 12u;
  let remainder = decoded.significand & 0xfffu;
  if (remainder > 0x800u || (remainder == 0x800u && (roundedHigh & 1u) == 1u)) {
    roundedHigh = roundedHigh + 1u;
  }
  var highMagnitude = vec2u(0u, roundedHigh << 12u);
  var highBits = fp64_make_f32_bits_from_u64(
    decoded.sign,
    highMagnitude,
    decoded.baseExponent
  );
  // Rounding the high limb of a maximum-exponent value can overflow even
  // though the original value is finite. Truncate only in that boundary case
  // so split remains an exact finite decomposition.
  if (fp64_decode_f32_bits(highBits).isInf) {
    roundedHigh = decoded.significand >> 12u;
    highMagnitude = vec2u(0u, roundedHigh << 12u);
    highBits = fp64_make_f32_bits_from_u64(
      decoded.sign,
      highMagnitude,
      decoded.baseExponent
    );
  }
  let lowBits = fp64_make_residual_f32_bits(
    decoded.sign,
    vec2u(0u, decoded.significand),
    decoded.baseExponent,
    highBits
  );
  return vec2f(bitcast<f32>(highBits), bitcast<f32>(lowBits));
}

fn split2(a: vec2f) -> vec2f {
  var result = split(a.x);
  result.y = fp64_round_add_integer(result.y, a.y);
  return result;
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn quickTwoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}
#endif

fn twoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let bBits = bitcast<u32>(b) ^ 0x80000000u;
  let resultBits = fp64_two_sum_integer_bits(bitcast<u32>(a), bBits);
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn twoSqr(a: f32) -> vec2f {
  return fp64_two_prod_integer(a, a);
}

fn twoProd(a: f32, b: f32) -> vec2f {
  return fp64_two_prod_integer(a, b);
}
#endif

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  var sum = fp64_two_sum_integer(a.x, b.x);
  let lowSum = fp64_two_sum_integer(a.y, b.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.x);
  sum = fp64_two_sum_integer(sum.x, sum.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.y);
  return fp64_two_sum_integer(sum.x, sum.y);
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  let negatedB = vec2f(
    bitcast<f32>(bitcast<u32>(b.x) ^ 0x80000000u),
    bitcast<f32>(bitcast<u32>(b.y) ^ 0x80000000u)
  );
  return sum_fp64(a, negatedB);
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  var product = fp64_two_prod_integer(a.x, b.x);
  let crossProduct1 = fp64_round_mul_integer(a.x, b.y);
  product.y = fp64_round_add_integer(product.y, crossProduct1);
  product = fp64_two_sum_integer(product.x, product.y);
  let crossProduct2 = fp64_round_mul_integer(a.y, b.x);
  product.y = fp64_round_add_integer(product.y, crossProduct2);
  return fp64_two_sum_integer(product.x, product.y);
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_scale_fp64_integer(value: vec2f, exponent: i32) -> vec2f {
  let high = fp64_scale_f32_integer(value.x, exponent);
  let low = fp64_scale_f32_integer(value.y, exponent);
  return sum_fp64(vec2f(high, 0.0), vec2f(low, 0.0));
}

fn fp64_div_fp64_normalized(a: vec2f, b: vec2f) -> vec2f {
  let quotientHigh = fp64_divide_f32_integer(a.x, b.x);
  var quotient = vec2f(quotientHigh, 0.0);

  let remainder = sub_fp64(a, mul_fp64(b, quotient));
  let quotientLow = fp64_divide_f32_integer(remainder.x, b.x);
  quotient = sum_fp64(quotient, vec2f(quotientLow, 0.0));

  let secondRemainder = sub_fp64(a, mul_fp64(b, quotient));
  let correction = fp64_divide_f32_integer(secondRemainder.x, b.x);
  return sum_fp64(quotient, vec2f(correction, 0.0));
}

fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let decodedA = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let decodedB = fp64_decode_f32_bits(bitcast<u32>(b.x));
  if (
    decodedA.isZero || decodedB.isZero ||
    decodedA.isInf || decodedB.isInf ||
    decodedA.isNan || decodedB.isNan
  ) {
    return fp64_div_fp64_normalized(a, b);
  }

  let exponentA = fp64_f32_finite_exponent(decodedA);
  let exponentB = fp64_f32_finite_exponent(decodedB);
  // Correct the quotient near unity so b * q and the remainder stay clear of
  // both f32 underflow and overflow. The exponent difference is applied once.
  let normalizedA = fp64_scale_fp64_integer(a, -exponentA);
  let normalizedB = fp64_scale_fp64_integer(b, -exponentB);
  let normalizedQuotient = fp64_div_fp64_normalized(normalizedA, normalizedB);
  return fp64_scale_fp64_integer(normalizedQuotient, exponentA - exponentB);
}

fn fp64_sqrt_fp64_normalized(a: vec2f) -> vec2f {
  let estimate = sqrt(a.x);
  let difference = sub_fp64(a, fp64_two_prod_integer(estimate, estimate)).x;
  let denominator = fp64_round_add_integer(estimate, estimate);
  let correction = fp64_divide_f32_integer(difference, denominator);
  return sum_fp64(vec2f(estimate, 0.0), vec2f(correction, 0.0));
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  let decoded = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let decodedLow = fp64_decode_f32_bits(bitcast<u32>(a.y));
  if (decoded.isZero && decodedLow.isZero) {
    return vec2f(0.0, 0.0);
  }
  if (decoded.sign == 1u) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  if (decoded.isInf || decoded.isNan) {
    return fp64_sqrt_fp64_normalized(a);
  }
  let exponent = fp64_f32_finite_exponent(decoded);
  // An even scale lets the final square-root rescale use an integer exponent.
  let evenExponent = exponent - (exponent & 1);
  let normalizedA = fp64_scale_fp64_integer(a, -evenExponent);
  let normalizedRoot = fp64_sqrt_fp64_normalized(normalizedA);
  return fp64_scale_fp64_integer(normalizedRoot, evenExponent / 2);
}
#endif

#else
fn split(a: f32) -> vec2f {
  let splitValue = prevent_fp64_optimization(fp64arithmetic.SPLIT + fp64_runtime_zero());
  let t = prevent_fp64_optimization(a * splitValue);
  let temp = prevent_fp64_optimization(t - a);
  let aHi = prevent_fp64_optimization(t - temp);
  let aLo = prevent_fp64_optimization(a - aHi);
  return vec2f(aHi, aLo);
}

fn split2(a: vec2f) -> vec2f {
  var b = split(a.x);
  b.y = b.y + a.y;
  return b;
}

fn quickTwoSum(a: f32, b: f32) -> vec2f {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let sum = prevent_fp64_optimization((a + b) * fp64arithmetic.ONE);
  let err = prevent_fp64_optimization(b - (sum - a) * fp64arithmetic.ONE);
#else
  let sum = prevent_fp64_optimization(a + b);
  let err = prevent_fp64_optimization(b - (sum - a));
#endif
  return vec2f(sum, err);
}

fn twoSum(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a + b);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let v = prevent_fp64_optimization((s * fp64arithmetic.ONE - a) * fp64arithmetic.ONE);
  let err =
    prevent_fp64_optimization((a - (s - v) * fp64arithmetic.ONE) *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE) +
    prevent_fp64_optimization(b - v);
#else
  let v = prevent_fp64_optimization(s - a);
  let err = prevent_fp64_optimization(a - (s - v)) + prevent_fp64_optimization(b - v);
#endif
  return vec2f(s, err);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a - b);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let v = prevent_fp64_optimization((s * fp64arithmetic.ONE - a) * fp64arithmetic.ONE);
  let err =
    prevent_fp64_optimization((a - (s - v) * fp64arithmetic.ONE) *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE) -
    prevent_fp64_optimization(b + v);
#else
  let v = prevent_fp64_optimization(s - a);
  let err = prevent_fp64_optimization(a - (s - v)) - prevent_fp64_optimization(b + v);
#endif
  return vec2f(s, err);
}

fn twoSqr(a: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * a);
  let aFp64 = split(a);
  let highProduct = prevent_fp64_optimization(aFp64.x * aFp64.x);
  let crossProduct = prevent_fp64_optimization(2.0 * aFp64.x * aFp64.y);
  let lowProduct = prevent_fp64_optimization(aFp64.y * aFp64.y);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let err =
    (prevent_fp64_optimization(highProduct - prod) * fp64arithmetic.ONE +
      crossProduct * fp64arithmetic.ONE * fp64arithmetic.ONE) +
    lowProduct * fp64arithmetic.ONE * fp64arithmetic.ONE * fp64arithmetic.ONE;
#else
  let err = ((prevent_fp64_optimization(highProduct - prod) + crossProduct) + lowProduct);
#endif
  return vec2f(prod, err);
}

fn twoProd(a: f32, b: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * b);
  let aFp64 = split(a);
  let bFp64 = split(b);
  let highProduct = prevent_fp64_optimization(aFp64.x * bFp64.x);
  let crossProduct1 = prevent_fp64_optimization(aFp64.x * bFp64.y);
  let crossProduct2 = prevent_fp64_optimization(aFp64.y * bFp64.x);
  let lowProduct = prevent_fp64_optimization(aFp64.y * bFp64.y);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let err1 = (highProduct - prod) * fp64arithmetic.ONE;
  let err2 = crossProduct1 * fp64arithmetic.ONE * fp64arithmetic.ONE;
  let err3 = crossProduct2 * fp64arithmetic.ONE * fp64arithmetic.ONE * fp64arithmetic.ONE;
  let err4 =
    lowProduct *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE;
#else
  let err1 = highProduct - prod;
  let err2 = crossProduct1;
  let err3 = crossProduct2;
  let err4 = lowProduct;
#endif
  let err12InputA = prevent_fp64_optimization(err1);
  let err12InputB = prevent_fp64_optimization(err2);
  let err12 = prevent_fp64_optimization(err12InputA + err12InputB);
  let err123InputA = prevent_fp64_optimization(err12);
  let err123InputB = prevent_fp64_optimization(err3);
  let err123 = prevent_fp64_optimization(err123InputA + err123InputB);
  let err1234InputA = prevent_fp64_optimization(err123);
  let err1234InputB = prevent_fp64_optimization(err4);
  let err = prevent_fp64_optimization(err1234InputA + err1234InputB);
  return vec2f(prod, err);
}

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  var s = twoSum(a.x, b.x);
  let t = twoSum(a.y, b.y);
  s.y = prevent_fp64_optimization(s.y + t.x);
  s = quickTwoSum(s.x, s.y);
  s.y = prevent_fp64_optimization(s.y + t.y);
  s = quickTwoSum(s.x, s.y);
  return s;
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  var s = twoSub(a.x, b.x);
  let t = twoSub(a.y, b.y);
  s.y = prevent_fp64_optimization(s.y + t.x);
  s = quickTwoSum(s.x, s.y);
  s.y = prevent_fp64_optimization(s.y + t.y);
  s = quickTwoSum(s.x, s.y);
  return s;
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  var prod = twoProd(a.x, b.x);
  let crossProduct1 = prevent_fp64_optimization(a.x * b.y);
  prod.y = prevent_fp64_optimization(prod.y + crossProduct1);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  let crossProduct2 = prevent_fp64_optimization(a.y * b.x);
  prod.y = prevent_fp64_optimization(prod.y + crossProduct2);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  return prod;
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let xn = prevent_fp64_optimization(1.0 / b.x);
  let yn = mul_fp64(a, vec2f(xn, fp64_runtime_zero()));
  let diff = prevent_fp64_optimization(sub_fp64(a, mul_fp64(b, yn)).x);
  let prod = twoProd(xn, diff);
  return sum_fp64(yn, prod);
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  if (a.x == 0.0 && a.y == 0.0) {
    return vec2f(0.0, 0.0);
  }
  if (a.x < 0.0) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  let x = prevent_fp64_optimization(1.0 / sqrt(a.x));
  let yn = prevent_fp64_optimization(a.x * x);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let ynSqr = twoSqr(yn) * fp64arithmetic.ONE;
#else
  let ynSqr = twoSqr(yn);
#endif
  let diff = prevent_fp64_optimization(sub_fp64(a, ynSqr).x);
  let prod = twoProd(prevent_fp64_optimization(x * 0.5), diff);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  return sum_fp64(split(yn), prod);
#else
  return sum_fp64(vec2f(yn, 0.0), prod);
#endif
}
#endif
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_f32_bits_is_nan(bits: u32) -> bool {
  return (bits & 0x7fffffffu) > 0x7f800000u;
}

fn fp64_f32_bits_is_inf(bits: u32) -> bool {
  return (bits & 0x7fffffffu) == 0x7f800000u;
}

fn fp64_compare_f32_bits(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == 0u && bMagnitude == 0u) {
    return 0;
  }
  let aSign = aBits >> 31u;
  let bSign = bBits >> 31u;
  if (aSign != bSign) {
    return select(1, -1, aSign == 1u);
  }
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  let magnitudeComparison = select(-1, 1, aMagnitude > bMagnitude);
  return select(magnitudeComparison, -magnitudeComparison, aSign == 1u);
}

// Normalize an arbitrary pair of finite f32 limbs with integer accumulation.
// This is independent of LUMA_FP64_INTEGER_ARITHMETIC and canonicalizes every
// representation of zero to vec2f(+0.0, +0.0).
fn normalize_fp64(value: vec2f) -> vec2f {
  let resultBits = fp64_add_raw_f32_bits(bitcast<u32>(value.x), bitcast<u32>(value.y));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn is_nan_fp64(value: vec2f) -> bool {
  let normalized = normalize_fp64(value);
  return fp64_f32_bits_is_nan(bitcast<u32>(normalized.x)) ||
    fp64_f32_bits_is_nan(bitcast<u32>(normalized.y));
}

fn is_finite_fp64(value: vec2f) -> bool {
  let normalized = normalize_fp64(value);
  let highBits = bitcast<u32>(normalized.x);
  let lowBits = bitcast<u32>(normalized.y);
  return !fp64_f32_bits_is_nan(highBits) && !fp64_f32_bits_is_nan(lowBits) &&
    !fp64_f32_bits_is_inf(highBits) && !fp64_f32_bits_is_inf(lowBits);
}

// Returns -1, 0, or 1. NaN is unordered and returns 0; call is_nan_fp64 or
// is_finite_fp64 first when 0 must mean a finite zero.
fn sign_fp64(value: vec2f) -> i32 {
  let normalized = normalize_fp64(value);
  let highBits = bitcast<u32>(normalized.x);
  let lowBits = bitcast<u32>(normalized.y);
  if (fp64_f32_bits_is_nan(highBits) || fp64_f32_bits_is_nan(lowBits)) {
    return 0;
  }
  if ((highBits & 0x7fffffffu) != 0u) {
    return select(1, -1, (highBits >> 31u) == 1u);
  }
  if ((lowBits & 0x7fffffffu) != 0u) {
    return select(1, -1, (lowBits >> 31u) == 1u);
  }
  return 0;
}

// Compares double-single values and returns -1, 0, or 1. NaN is unordered
// and returns 0; callers that require equality semantics must first check
// is_nan_fp64 or is_finite_fp64.
fn compare_fp64(a: vec2f, b: vec2f) -> i32 {
  let normalizedA = normalize_fp64(a);
  let normalizedB = normalize_fp64(b);
  let aHighBits = bitcast<u32>(normalizedA.x);
  let aLowBits = bitcast<u32>(normalizedA.y);
  let bHighBits = bitcast<u32>(normalizedB.x);
  let bLowBits = bitcast<u32>(normalizedB.y);
  if (fp64_f32_bits_is_nan(aHighBits) || fp64_f32_bits_is_nan(aLowBits) ||
      fp64_f32_bits_is_nan(bHighBits) || fp64_f32_bits_is_nan(bLowBits)) {
    return 0;
  }
  let highComparison = fp64_compare_f32_bits(aHighBits, bHighBits);
  if (highComparison != 0) {
    return highComparison;
  }
  return fp64_compare_f32_bits(aLowBits, bLowBits);
}
#endif
`,fs:yl,vs:yl,defaultUniforms:{ONE:1,SPLIT:4097},uniformTypes:{ONE:`f32`,SPLIT:`f32`},fp64ify:fl,fp64LowPart:pl,fp64ifyMatrix4:ml},xl={props:{},uniforms:{},name:`picking`,uniformTypes:{isActive:`f32`,isAttribute:`f32`,isHighlightActive:`f32`,useByteColors:`f32`,highlightedObjectColor:`vec3<f32>`,highlightColor:`vec4<f32>`},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:[0,1,1,1]},vs:`layout(std140) uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useByteColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

out vec4 picking_vRGBcolor_Avalid;

// Normalize unsigned byte color to 0-1 range
vec3 picking_normalizeColor(vec3 color) {
  return picking.useByteColors > 0.5 ? color / 255.0 : color;
}

// Normalize unsigned byte color to 0-1 range
vec4 picking_normalizeColor(vec4 color) {
  return picking.useByteColors > 0.5 ? color / 255.0 : color;
}

bool picking_isColorZero(vec3 color) {
  return dot(color, vec3(1.0)) < 0.00001;
}

bool picking_isColorValid(vec3 color) {
  return dot(color, vec3(1.0)) > 0.00001;
}

// Check if this vertex is highlighted 
bool isVertexHighlighted(vec3 vertexColor) {
  vec3 highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
  return
    bool(picking.isHighlightActive) && picking_isColorZero(abs(vertexColor - highlightedObjectColor));
}

// Set the current picking color
void picking_setPickingColor(vec3 pickingColor) {
  pickingColor = picking_normalizeColor(pickingColor);

  if (bool(picking.isActive)) {
    // Use alpha as the validity flag. If pickingColor is [0, 0, 0] fragment is non-pickable
    picking_vRGBcolor_Avalid.a = float(picking_isColorValid(pickingColor));

    if (!bool(picking.isAttribute)) {
      // Stores the picking color so that the fragment shader can render it during picking
      picking_vRGBcolor_Avalid.rgb = pickingColor;
    }
  } else {
    // Do the comparison with selected item color in vertex shader as it should mean fewer compares
    picking_vRGBcolor_Avalid.a = float(isVertexHighlighted(pickingColor));
  }
}

void picking_setPickingAttribute(float value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.r = value;
  }
}

void picking_setPickingAttribute(vec2 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rg = value;
  }
}

void picking_setPickingAttribute(vec3 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rgb = value;
  }
}
`,fs:`layout(std140) uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useByteColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

in vec4 picking_vRGBcolor_Avalid;

/*
 * Returns highlight color if this item is selected.
 */
vec4 picking_filterHighlightColor(vec4 color) {
  // If we are still picking, we don't highlight
  if (picking.isActive > 0.5) {
    return color;
  }

  bool selected = bool(picking_vRGBcolor_Avalid.a);

  if (selected) {
    // Blend in highlight color based on its alpha value
    float highLightAlpha = picking.highlightColor.a;
    float blendedAlpha = highLightAlpha + color.a * (1.0 - highLightAlpha);
    float highLightRatio = highLightAlpha / blendedAlpha;

    vec3 blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);
    return vec4(blendedRGB, blendedAlpha);
  } else {
    return color;
  }
}

/*
 * Returns picking color if picking enabled else unmodified argument.
 */
vec4 picking_filterPickingColor(vec4 color) {
  if (bool(picking.isActive)) {
    if (picking_vRGBcolor_Avalid.a == 0.0) {
      discard;
    }
    return picking_vRGBcolor_Avalid;
  }
  return color;
}

/*
 * Returns picking color if picking is enabled if not
 * highlight color if this item is selected, otherwise unmodified argument.
 */
vec4 picking_filterColor(vec4 color) {
  vec4 highlightColor = picking_filterHighlightColor(color);
  return picking_filterPickingColor(highlightColor);
}
`,getUniforms:Sl};function Sl(e={},t){let n={},r=hl(e.useByteColors,!0);return e.highlightedObjectColor===void 0||(e.highlightedObjectColor===null?n.isHighlightActive=!1:(n.isHighlightActive=!0,n.highlightedObjectColor=e.highlightedObjectColor.slice(0,3))),e.highlightColor&&(n.highlightColor=_l(e.highlightColor,r)),e.isActive!==void 0&&(n.isActive=!!e.isActive,n.isAttribute=!!e.isAttribute),e.useByteColors!==void 0&&(n.useByteColors=!!e.useByteColors),n}var Cl=`struct LayerUniforms {
  opacity: f32,
};

@group(0) @binding(auto)
var<uniform> layer: LayerUniforms;
`,wl=`layout(std140) uniform layerUniforms {
  uniform float opacity;
} layer;
`,Tl={name:`layer`,source:Cl,vs:wl,fs:wl,getUniforms:e=>({opacity:e.opacity**(1/2.2)}),uniformTypes:{opacity:`f32`}},El=`const SMOOTH_EDGE_RADIUS: f32 = 0.5;

struct VertexGeometry {
  position: vec4<f32>,
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry_: VertexGeometry = VertexGeometry(
  vec4<f32>(0.0, 0.0, 1.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec2<f32>(0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0)
);

struct FragmentGeometry {
  uv: vec2<f32>,
};

var<private> fragmentGeometry: FragmentGeometry;

fn smoothedge(edge: f32, x: f32) -> f32 {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`,Dl=`#define SMOOTH_EDGE_RADIUS 0.5`,Ol={name:`geometry`,source:El,vs:`\
${Dl}

struct VertexGeometry {
  vec4 position;
  vec3 worldPosition;
  vec3 worldPositionAlt;
  vec3 normal;
  vec2 uv;
  vec3 pickingColor;
} geometry = VertexGeometry(
  vec4(0.0, 0.0, 1.0, 0.0),
  vec3(0.0),
  vec3(0.0),
  vec3(0.0),
  vec2(0.0),
  vec3(0.0)
);
`,fs:`\
${Dl}

struct FragmentGeometry {
  vec2 uv;
};
FragmentGeometry geometry;

float smoothedge(float edge, float x) {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`};1/Math.PI*180,1/180*Math.PI;var kl={EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1};globalThis.mathgl=globalThis.mathgl||{config:{...kl}};var I=globalThis.mathgl.config;function Al(e,{precision:t=I.precision}={}){return e=Fl(e),`${parseFloat(e.toPrecision(t))}`}function jl(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Ml(e,t,n){return Ll(e,e=>Math.max(t,Math.min(n,e)))}function Nl(e,t,n){return jl(e)?e.map((e,r)=>Nl(e,t[r],n)):n*t+(1-n)*e}function Pl(e,t,n){let r=I.EPSILON;n&&(I.EPSILON=n);try{if(e===t)return!0;if(jl(e)&&jl(t)){if(e.length!==t.length)return!1;for(let n=0;n<e.length;++n)if(!Pl(e[n],t[n]))return!1;return!0}return e&&e.equals?e.equals(t):t&&t.equals?t.equals(e):typeof e==`number`&&typeof t==`number`?Math.abs(e-t)<=I.EPSILON*Math.max(1,Math.abs(e),Math.abs(t)):!1}finally{I.EPSILON=r}}function Fl(e){return Math.round(e/I.EPSILON)*I.EPSILON}function Il(e){return e.clone?e.clone():Array(e.length)}function Ll(e,t,n){if(jl(e)){let r=e;n||=Il(r);for(let i=0;i<n.length&&i<r.length;++i){let r=typeof e==`number`?e:e[i];n[i]=t(r,i,n)}return n}return t(e)}var Rl=class extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let n=0;n<this.ELEMENTS;++n)this[n]=e[n+t];return this.check()}toArray(e=[],t=0){for(let n=0;n<this.ELEMENTS;++n)e[t+n]=this[n];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:jl(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toString(){return this.formatString(I)}formatString(e){let t=``;for(let n=0;n<this.ELEMENTS;++n)t+=(n>0?`, `:``)+Al(this[n],e);return`${e.printTypes?this.constructor.name:``}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!Pl(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,n){if(n===void 0)return this.lerp(this,e,t);for(let r=0;r<this.ELEMENTS;++r){let i=e[r];this[r]=i+n*((typeof t==`number`?t:t[r])-i)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(Math.max(this[n],e[n]),t[n]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if(typeof e==`number`)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(I.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e&&=Number.isFinite(this[t]);return e}};function zl(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}function L(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}function Bl(e,t,n=``){if(I.debug&&!zl(e,t))throw Error(`math.gl: ${n} some fields set to invalid numbers'`);return e}var Vl=class extends Rl{toString(){let e=`[`;if(I.printRowMajor){e+=`row-major:`;for(let t=0;t<this.RANK;++t)for(let n=0;n<this.RANK;++n)e+=` ${this[n*this.RANK+t]}`}else{e+=`column-major:`;for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+=`]`,e}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,n){return this[t*this.RANK+e]=L(n),this}getColumn(e,t=Array(this.RANK).fill(-0)){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[n+e];return t}setColumn(e,t){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)this[n+e]=t[e];return this}};function Hl(e,t){if(!e)throw Error(`math.gl assertion ${t}`)}var Ul=class extends Rl{get x(){return this[0]}set x(e){this[0]=L(e)}get y(){return this[1]}set y(e){this[1]=L(e)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let e=0;for(let t=0;t<this.ELEMENTS;++t)e+=this[t]*this[t];return e}magnitudeSquared(){return this.lengthSquared()}distance(e){return Math.sqrt(this.distanceSquared(e))}distanceSquared(e){let t=0;for(let n=0;n<this.ELEMENTS;++n){let r=this[n]-e[n];t+=r*r}return L(t)}dot(e){let t=0;for(let n=0;n<this.ELEMENTS;++n)t+=this[n]*e[n];return L(t)}normalize(){let e=this.magnitude();if(e!==0)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e;return this.check()}multiply(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]*=t[e];return this.check()}divide(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]/=t[e];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(e){return this.distance(e)}distanceToSquared(e){return this.distanceSquared(e)}getComponent(e){return Hl(e>=0&&e<this.ELEMENTS,`index is out of range`),L(this[e])}setComponent(e,t){return Hl(e>=0&&e<this.ELEMENTS,`index is out of range`),this[e]=t,this.check()}addVectors(e,t){return this.copy(e).add(t)}subVectors(e,t){return this.copy(e).subtract(t)}multiplyVectors(e,t){return this.copy(e).multiply(t)}addScaledVector(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]+=e[n]*t;return this.check()}};Math.PI/180;function Wl(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e}function Gl(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e}function Kl(e,t){return e[0]=-t[0],e[1]=-t[1],e}function ql(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[4]*i+n[12],e[1]=n[1]*r+n[5]*i+n[13],e}var Jl=Gl;function Yl(e,t,n){let r=t[0],i=t[1],a=n[3]*r+n[7]*i||1;return e[0]=(n[0]*r+n[4]*i)/a,e[1]=(n[1]*r+n[5]*i)/a,e}function Xl(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a||1;return e[0]=(n[0]*r+n[4]*i+n[8]*a)/o,e[1]=(n[1]*r+n[5]*i+n[9]*a)/o,e[2]=(n[2]*r+n[6]*i+n[10]*a)/o,e}function Zl(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i,e[1]=n[1]*r+n[3]*i,e[2]=t[2],e}function Ql(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e}function $l(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function eu(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2];return e[0]=i*c-a*s,e[1]=a*o-r*c,e[2]=r*s-i*o,e}function tu(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a+n[15];return o||=1,e[0]=(n[0]*r+n[4]*i+n[8]*a+n[12])/o,e[1]=(n[1]*r+n[5]*i+n[9]*a+n[13])/o,e[2]=(n[2]*r+n[6]*i+n[10]*a+n[14])/o,e}function nu(e,t,n){let r=t[0],i=t[1],a=t[2];return e[0]=r*n[0]+i*n[3]+a*n[6],e[1]=r*n[1]+i*n[4]+a*n[7],e[2]=r*n[2]+i*n[5]+a*n[8],e}function ru(e,t,n){let r=n[0],i=n[1],a=n[2],o=n[3],s=t[0],c=t[1],l=t[2],u=i*l-a*c,d=a*s-r*l,f=r*c-i*s,p=i*f-a*d,m=a*u-r*f,h=r*d-i*u,g=o*2;return u*=g,d*=g,f*=g,p*=2,m*=2,h*=2,e[0]=s+u+p,e[1]=c+d+m,e[2]=l+f+h,e}function iu(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0],a[1]=i[1]*Math.cos(r)-i[2]*Math.sin(r),a[2]=i[1]*Math.sin(r)+i[2]*Math.cos(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function au(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[2]*Math.sin(r)+i[0]*Math.cos(r),a[1]=i[1],a[2]=i[2]*Math.cos(r)-i[0]*Math.sin(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function ou(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0]*Math.cos(r)-i[1]*Math.sin(r),a[1]=i[0]*Math.sin(r)+i[1]*Math.cos(r),a[2]=i[2],e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function su(e,t){let n=e[0],r=e[1],i=e[2],a=t[0],o=t[1],s=t[2],c=Math.sqrt((n*n+r*r+i*i)*(a*a+o*o+s*s)),l=c&&$l(e,t)/c;return Math.acos(Math.min(Math.max(l,-1),1))}var cu=Ql,lu=[0,0,0],uu,R=class e extends Ul{static get ZERO(){return uu||(uu=new e(0,0,0),Object.freeze(uu)),uu}constructor(e=0,t=0,n=0){super(-0,-0,-0),arguments.length===1&&jl(e)?this.copy(e):(I.debug&&(L(e),L(t),L(n)),this[0]=e,this[1]=t,this[2]=n)}set(e,t,n){return this[0]=e,this[1]=t,this[2]=n,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this.check()}fromObject(e){return I.debug&&(L(e.x),L(e.y),L(e.z)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this.check()}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e}get ELEMENTS(){return 3}get z(){return this[2]}set z(e){this[2]=L(e)}angle(e){return su(this,e)}cross(e){return eu(this,this,e),this.check()}rotateX({radians:e,origin:t=lu}){return iu(this,this,t,e),this.check()}rotateY({radians:e,origin:t=lu}){return au(this,this,t,e),this.check()}rotateZ({radians:e,origin:t=lu}){return ou(this,this,t,e),this.check()}transform(e){return this.transformAsPoint(e)}transformAsPoint(e){return tu(this,this,e),this.check()}transformAsVector(e){return Xl(this,this,e),this.check()}transformByMatrix3(e){return nu(this,this,e),this.check()}transformByMatrix2(e){return Zl(this,this,e),this.check()}transformByQuaternion(e){return ru(this,this,e),this.check()}};function du(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function fu(e,t){if(e===t){let n=t[1],r=t[2],i=t[3],a=t[6],o=t[7],s=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=i,e[13]=o,e[14]=s}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}function pu(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,E=u*_-p*m,D=d*g-f*h,O=d*_-p*h,k=f*_-p*g,A=v*k-y*O+b*D+x*E-S*T+C*w;return A?(A=1/A,e[0]=(s*k-c*O+l*D)*A,e[1]=(i*O-r*k-a*D)*A,e[2]=(h*C-g*S+_*x)*A,e[3]=(f*S-d*C-p*x)*A,e[4]=(c*E-o*k-l*T)*A,e[5]=(n*k-i*E+a*T)*A,e[6]=(g*b-m*C-_*y)*A,e[7]=(u*C-f*b+p*y)*A,e[8]=(o*O-s*E+l*w)*A,e[9]=(r*E-n*O-a*w)*A,e[10]=(m*S-h*b+_*v)*A,e[11]=(d*b-u*S-p*v)*A,e[12]=(s*T-o*D-c*w)*A,e[13]=(n*D-r*T+i*w)*A,e[14]=(h*y-m*x-g*v)*A,e[15]=(u*x-d*y+f*v)*A,e):null}function mu(e){let t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=n*s-r*o,b=l*m-u*p,x=l*h-d*p,S=u*h-d*m,C=t*S-n*x+r*b,w=a*S-o*x+s*b,T=l*y-u*v+d*_,E=p*y-m*v+h*_;return c*C-i*w+g*T-f*E}function hu(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e}function gu(e,t,n){let r=n[0],i=n[1],a=n[2],o,s,c,l,u,d,f,p,m,h,g,_;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*a+t[12],e[13]=t[1]*r+t[5]*i+t[9]*a+t[13],e[14]=t[2]*r+t[6]*i+t[10]*a+t[14],e[15]=t[3]*r+t[7]*i+t[11]*a+t[15]):(o=t[0],s=t[1],c=t[2],l=t[3],u=t[4],d=t[5],f=t[6],p=t[7],m=t[8],h=t[9],g=t[10],_=t[11],e[0]=o,e[1]=s,e[2]=c,e[3]=l,e[4]=u,e[5]=d,e[6]=f,e[7]=p,e[8]=m,e[9]=h,e[10]=g,e[11]=_,e[12]=o*r+u*i+m*a+t[12],e[13]=s*r+d*i+h*a+t[13],e[14]=c*r+f*i+g*a+t[14],e[15]=l*r+p*i+_*a+t[15]),e}function _u(e,t,n){let r=n[0],i=n[1],a=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function vu(e,t,n,r){let i=r[0],a=r[1],o=r[2],s=Math.sqrt(i*i+a*a+o*o),c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,ee;return s<1e-6?null:(s=1/s,i*=s,a*=s,o*=s,l=Math.sin(n),c=Math.cos(n),u=1-c,d=t[0],f=t[1],p=t[2],m=t[3],h=t[4],g=t[5],_=t[6],v=t[7],y=t[8],b=t[9],x=t[10],S=t[11],C=i*i*u+c,w=a*i*u+o*l,T=o*i*u-a*l,E=i*a*u-o*l,D=a*a*u+c,O=o*a*u+i*l,k=i*o*u+a*l,A=a*o*u-i*l,ee=o*o*u+c,e[0]=d*C+h*w+y*T,e[1]=f*C+g*w+b*T,e[2]=p*C+_*w+x*T,e[3]=m*C+v*w+S*T,e[4]=d*E+h*D+y*O,e[5]=f*E+g*D+b*O,e[6]=p*E+_*D+x*O,e[7]=m*E+v*D+S*O,e[8]=d*k+h*A+y*ee,e[9]=f*k+g*A+b*ee,e[10]=p*k+_*A+x*ee,e[11]=m*k+v*A+S*ee,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)}function yu(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e}function bu(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i-l*r,e[1]=o*i-u*r,e[2]=s*i-d*r,e[3]=c*i-f*r,e[8]=a*r+l*i,e[9]=o*r+u*i,e[10]=s*r+d*i,e[11]=c*r+f*i,e}function xu(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[4],u=t[5],d=t[6],f=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i+l*r,e[1]=o*i+u*r,e[2]=s*i+d*r,e[3]=c*i+f*r,e[4]=l*i-a*r,e[5]=u*i-o*r,e[6]=d*i-s*r,e[7]=f*i-c*r,e}function Su(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[1]=u+_,e[2]=f-g,e[3]=0,e[4]=u-_,e[5]=1-l-m,e[6]=p+h,e[7]=0,e[8]=f+g,e[9]=p-h,e[10]=1-l-d,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function Cu(e,t,n,r,i,a,o){let s=1/(n-t),c=1/(i-r),l=1/(a-o);return e[0]=a*2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a*2*c,e[6]=0,e[7]=0,e[8]=(n+t)*s,e[9]=(i+r)*c,e[10]=(o+a)*l,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*a*2*l,e[15]=0,e}function wu(e,t,n,r,i){let a=1/Math.tan(t/2);if(e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0){let t=1/(r-i);e[10]=(i+r)*t,e[14]=2*i*r*t}else e[10]=-1,e[14]=-2*r;return e}var Tu=wu;function Eu(e,t,n,r,i,a,o){let s=1/(t-n),c=1/(r-i),l=1/(a-o);return e[0]=-2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*c,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*l,e[11]=0,e[12]=(t+n)*s,e[13]=(i+r)*c,e[14]=(o+a)*l,e[15]=1,e}var Du=Eu;function Ou(e,t,n,r){let i,a,o,s,c,l,u,d,f,p,m=t[0],h=t[1],g=t[2],_=r[0],v=r[1],y=r[2],b=n[0],x=n[1],S=n[2];return Math.abs(m-b)<1e-6&&Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6?du(e):(d=m-b,f=h-x,p=g-S,i=1/Math.sqrt(d*d+f*f+p*p),d*=i,f*=i,p*=i,a=v*p-y*f,o=y*d-_*p,s=_*f-v*d,i=Math.sqrt(a*a+o*o+s*s),i?(i=1/i,a*=i,o*=i,s*=i):(a=0,o=0,s=0),c=f*s-p*o,l=p*a-d*s,u=d*o-f*a,i=Math.sqrt(c*c+l*l+u*u),i?(i=1/i,c*=i,l*=i,u*=i):(c=0,l=0,u=0),e[0]=a,e[1]=c,e[2]=d,e[3]=0,e[4]=o,e[5]=l,e[6]=f,e[7]=0,e[8]=s,e[9]=u,e[10]=p,e[11]=0,e[12]=-(a*m+o*h+s*g),e[13]=-(c*m+l*h+u*g),e[14]=-(d*m+f*h+p*g),e[15]=1,e)}function ku(e){if(e.length!==16||Array.from(e).some(e=>!Number.isFinite(e))||e[3]!==0||e[7]!==0||e[11]!==0||e[15]!==1)throw RangeError(`Expected a finite affine matrix`);let t=[Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])];if(t.some(e=>e===0||!Number.isFinite(e)))throw RangeError(`Singular transform`);let n=Array.from({length:9},(n,r)=>e[Math.floor(r/3)*4+r%3]/t[Math.floor(r/3)]);for(let[e,t]of[[0,3],[0,6],[3,6]])if(Math.abs(n[e]*n[t]+n[e+1]*n[t+1]+n[e+2]*n[t+2])>1e-7)throw RangeError(`Sheared transforms do not have a TRS decomposition`);if(n[0]*(n[4]*n[8]-n[5]*n[7])-n[3]*(n[1]*n[8]-n[2]*n[7])+n[6]*(n[1]*n[5]-n[2]*n[4])<0){t[0]=-t[0];for(let e=0;e<3;e++)n[e]=-n[e]}return{rotation:n,scale:t,translation:[e[12],e[13],e[14]]}}function Au(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*a+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*a+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*a+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*a+n[15]*o,e}var ju=45*Math.PI/180,Mu=1,Nu=.1,Pu=500,Fu=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),z=class extends Vl{static get IDENTITY(){return zu()}static get ZERO(){return Ru()}get ELEMENTS(){return 16}get RANK(){return 4}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this[4]=i,this[5]=a,this[6]=o,this[7]=s,this[8]=c,this[9]=l,this[10]=u,this[11]=d,this[12]=f,this[13]=p,this[14]=m,this[15]=h,this.check()}setRowMajor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=i,this[2]=c,this[3]=f,this[4]=t,this[5]=a,this[6]=l,this[7]=p,this[8]=n,this[9]=o,this[10]=u,this[11]=m,this[12]=r,this[13]=s,this[14]=d,this[15]=h,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(Fu)}fromObject(e){return this.check()}fromQuaternion(e){return Su(this,e),this.check()}fromMatrix3(e){return this.set(e[0],e[1],e[2],0,e[3],e[4],e[5],0,e[6],e[7],e[8],0,0,0,0,1)}frustum(e){let{left:t,right:n,bottom:r,top:i,near:a=Nu,far:o=Pu}=e;return o===1/0?Vu(this,t,n,r,i,a):Cu(this,t,n,r,i,a,o),this.check()}lookAt(e){let{eye:t,center:n=[0,0,0],up:r=[0,1,0]}=e;return Ou(this,t,n,r),this.check()}ortho(e){let{left:t,right:n,bottom:r,top:i,near:a=Nu,far:o=Pu}=e;return Du(this,t,n,r,i,a,o),this.check()}orthographic(e){let{fovy:t=ju,aspect:n=Mu,focalDistance:r=1,near:i=Nu,far:a=Pu}=e;Bu(t);let o=t/2,s=r*Math.tan(o),c=s*n;return this.ortho({left:-c,right:c,bottom:-s,top:s,near:i,far:a})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:n=1,near:r=.1,far:i=500}=e;return Bu(t),Tu(this,t,n,r,i),this.check()}determinant(){return mu(this)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){let{rotation:n,scale:r}=ku(this);if(e||=Array(16),t)for(let e=0;e<3;e++)t[e]=r[e];for(let t=0;t<16;t++)e[t]=0;for(let t=0;t<9;t++)e[Math.floor(t/3)*4+t%3]=n[t];return e[15]=1,e}getRotationMatrix3(e,t){let{rotation:n,scale:r}=ku(this);if(e||=Array(9),t)for(let e=0;e<3;e++)t[e]=r[e];for(let t=0;t<9;t++)e[t]=n[t];return e}transpose(){return fu(this,this),this.check()}invert(){return pu(this,this),this.check()}multiplyLeft(e){return hu(this,e,this),this.check()}multiplyRight(e){return hu(this,this,e),this.check()}rotateX(e){return yu(this,this,e),this.check()}rotateY(e){return bu(this,this,e),this.check()}rotateZ(e){return xu(this,this,e),this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){return vu(this,this,e,t),this.check()}scale(e){return _u(this,this,Array.isArray(e)?e:[e,e,e]),this.check()}translate(e){return gu(this,this,e),this.check()}transform(e,t){return e.length===4?(t=Au(t||[-0,-0,-0,-0],e,this),Bl(t,4),t):this.transformAsPoint(e,t)}transformAsPoint(e,t){let{length:n}=e,r;switch(n){case 2:r=ql(t||[-0,-0],e,this);break;case 3:r=tu(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return Bl(r,e.length),r}transformAsVector(e,t){let n;switch(e.length){case 2:n=Yl(t||[-0,-0],e,this);break;case 3:n=Xl(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return Bl(n,e.length),n}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,n){return this.identity().translate([e,t,n])}},Iu,Lu;function Ru(){return Iu||(Iu=new z([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),Object.freeze(Iu)),Iu}function zu(){return Lu||(Lu=new z,Object.freeze(Lu)),Lu}function Bu(e){if(e>Math.PI*2)throw Error(`expected radians`)}function Vu(e,t,n,r,i,a){let o=2*a/(n-t),s=2*a/(i-r),c=(n+t)/(n-t),l=(i+r)/(i-r),u=-2*a;return e[0]=o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=c,e[9]=l,e[10]=-1,e[11]=-1,e[12]=0,e[13]=0,e[14]=u,e[15]=0,e}var B;(function(e){e[e.Start=1]=`Start`,e[e.Move=2]=`Move`,e[e.End=4]=`End`,e[e.Cancel=8]=`Cancel`})(B||={});var V;(function(e){e[e.None=0]=`None`,e[e.Left=1]=`Left`,e[e.Right=2]=`Right`,e[e.Up=4]=`Up`,e[e.Down=8]=`Down`,e[e.Horizontal=3]=`Horizontal`,e[e.Vertical=12]=`Vertical`,e[e.All=15]=`All`})(V||={});var H;(function(e){e[e.Possible=1]=`Possible`,e[e.Began=2]=`Began`,e[e.Changed=4]=`Changed`,e[e.Ended=8]=`Ended`,e[e.Recognized=8]=`Recognized`,e[e.Cancelled=16]=`Cancelled`,e[e.Failed=32]=`Failed`})(H||={});var Hu=`auto`,Uu=`manipulation`,Wu=`none`,Gu=`pan-x`,Ku=`pan-y`;function qu(e){if(e.includes(`none`))return Wu;let t=e.includes(Gu),n=e.includes(Ku);return t&&n?Wu:t||n?t?Gu:Ku:e.includes(`manipulation`)?Uu:Hu}var Ju=class{constructor(e,t){this.actions=``,this.manager=e,this.set(t)}set(e){e===`compute`&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));return qu(e.join(` `))}};function Yu(e){return e.trim().split(/\s+/g)}function Xu(e,t,n){if(e)for(let r of Yu(t))e.addEventListener(r,n,!1)}function Zu(e,t,n){if(e)for(let r of Yu(t))e.removeEventListener(r,n,!1)}function Qu(e){return(e.ownerDocument||e).defaultView}function $u(e,t){let n=e;for(;n;){if(n===t)return!0;n=n.parentNode}return!1}function ed(e){let t=e.length;if(t===1)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let n=0,r=0,i=0;for(;i<t;)n+=e[i].clientX,r+=e[i].clientY,i++;return{x:Math.round(n/t),y:Math.round(r/t)}}function td(e){let t=[],n=0;for(;n<e.pointers.length;)t[n]={clientX:Math.round(e.pointers[n].clientX),clientY:Math.round(e.pointers[n].clientY)},n++;return{timeStamp:Date.now(),pointers:t,center:ed(t),deltaX:e.deltaX,deltaY:e.deltaY}}function nd(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.sqrt(n*n+r*r)}function rd(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.sqrt(n*n+r*r)}function id(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.atan2(r,n)*180/Math.PI}function ad(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.atan2(r,n)*180/Math.PI}function od(e,t){return e===t?V.None:Math.abs(e)>=Math.abs(t)?e<0?V.Left:V.Right:t<0?V.Up:V.Down}function sd(e,t){let n=t.center,r=e.offsetDelta,i=e.prevDelta,a=e.prevInput;return(t.eventType===B.Start||a?.eventType===B.End)&&(i=e.prevDelta={x:a?.deltaX||0,y:a?.deltaY||0},r=e.offsetDelta={x:n.x,y:n.y}),{deltaX:i.x+(n.x-r.x),deltaY:i.y+(n.y-r.y)}}function cd(e,t,n){return{x:t/e||0,y:n/e||0}}function ld(e,t){return rd(t[0],t[1])/rd(e[0],e[1])}function ud(e,t){return ad(t[1],t[0])-ad(e[1],e[0])}function dd(e,t){let n=e.lastInterval||t,r=t.timeStamp-n.timeStamp,i,a,o,s;if(t.eventType!==B.Cancel&&(r>25||n.velocity===void 0)){let c=t.deltaX-n.deltaX,l=t.deltaY-n.deltaY,u=cd(r,c,l);a=u.x,o=u.y,i=Math.abs(u.x)>Math.abs(u.y)?u.x:u.y,s=od(c,l),e.lastInterval=t}else i=n.velocity,a=n.velocityX,o=n.velocityY,s=n.direction;t.velocity=i,t.velocityX=a,t.velocityY=o,t.direction=s}function fd(e,t){return`pointerId`in e?e.pointerId:t}function pd(e,t){e.movementOrigin=new Map(t.map((e,t)=>[fd(e,t),{clientX:e.clientX,clientY:e.clientY}])),e.firstMovementTime=void 0}function md(e,t){let n=t.pointers.map(fd);if(e.movementOrigin?.size===n.length&&n.every(t=>e.movementOrigin.has(t))||pd(e,t.pointers),t.distancePerPointer=t.pointers.map((t,r)=>rd(e.movementOrigin.get(n[r]),t)),t.eventType&B.Move&&t.distancePerPointer.some(e=>e>0)&&(e.firstMovementTime??=t.timeStamp),t.movementDeltaTime=e.firstMovementTime===void 0?0:t.timeStamp-e.firstMovementTime,t.eventType&(B.End|B.Cancel)){let r=t.changedPointers.map(e=>fd(e,t.pointers.indexOf(e)));pd(e,t.pointers.filter((e,t)=>!r.includes(n[t])))}}function hd(e,t){let{session:n}=e,{pointers:r}=t,{length:i}=r;n.firstInput||=td(t),i>1&&!n.firstMultiple?n.firstMultiple=td(t):i===1&&(n.firstMultiple=!1);let{firstInput:a,firstMultiple:o}=n,s=o?o.center:a.center,c=t.center=ed(r);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-a.timeStamp,md(n,t),t.angle=id(s,c),t.distance=nd(s,c);let{deltaX:l,deltaY:u}=sd(n,t);t.deltaX=l,t.deltaY=u,t.offsetDirection=od(t.deltaX,t.deltaY);let d=cd(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=d.x,t.overallVelocityY=d.y,t.overallVelocity=Math.abs(d.x)>Math.abs(d.y)?d.x:d.y,t.scale=o?ld(o.pointers,r):1,t.rotation=o?ud(o.pointers,r):0,t.maxPointers=n.prevInput?t.pointers.length>n.prevInput.maxPointers?t.pointers.length:n.prevInput.maxPointers:t.pointers.length;let f=e.element;return $u(t.srcEvent.target,f)&&(f=t.srcEvent.target),t.target=f,dd(n,t),t}function gd(e,t,n){let r=n.pointers.length,i=n.changedPointers.length,a=t&B.Start&&r-i===0,o=t&(B.End|B.Cancel)&&r-i===0;n.isFirst=!!a,n.isFinal=!!o,a&&(e.session={}),n.eventType=t;let s=hd(e,n);e.emit(`hammer.input`,s),e.recognize(s),e.session.prevInput=s}var _d=class{constructor(e){this.evEl=``,this.evWin=``,this.evTarget=``,this.domHandler=e=>{this.manager.options.enable&&this.handler(e)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){gd(this.manager,e,t)}init(){Xu(this.element,this.evEl,this.domHandler),Xu(this.target,this.evTarget,this.domHandler),Xu(Qu(this.element),this.evWin,this.domHandler)}destroy(){Zu(this.element,this.evEl,this.domHandler),Zu(this.target,this.evTarget,this.domHandler),Zu(Qu(this.element),this.evWin,this.domHandler)}},vd={pointerdown:B.Start,pointermove:B.Move,pointerup:B.End,pointercancel:B.Cancel,pointerout:B.Cancel},yd=`pointerdown`,bd=`pointermove pointerup pointercancel`,xd=class extends _d{constructor(e){super(e),this.evEl=yd,this.evWin=bd,this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,n=!1,r=vd[e.type],i=e.pointerType,a=i===`touch`,o=t.findIndex(t=>t.pointerId===e.pointerId);r&B.Start&&(e.buttons||a)?o<0&&(t.push(e),o=t.length-1):r&(B.End|B.Cancel)&&(n=!0),!(o<0)&&(t[o]=e,this.callback(r,{pointers:t,changedPointers:[e],eventType:r,pointerType:i,srcEvent:e}),n&&t.splice(o,1))}},Sd=[``,`webkit`,`Moz`,`MS`,`ms`,`o`];function Cd(e,t){let n=t[0].toUpperCase()+t.slice(1);for(let r of Sd){let i=r?r+n:t;if(i in e)return i}}var wd=1,Td=2,Ed={touchAction:`compute`,enable:!0,inputTarget:null,cssProps:{userSelect:`none`,userDrag:`none`,touchCallout:`none`,tapHighlightColor:`rgba(0,0,0,0)`}},Dd=class{constructor(e,t){this.options={...Ed,...t,cssProps:{...Ed.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new xd(this),this.touchAction=new Ju(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?Td:wd}recognize(e){let{session:t}=this;if(t.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let n,{recognizers:r}=this,{curRecognizer:i}=t;(!i||i&&i.state&H.Recognized)&&(i=t.curRecognizer=null);let a=0;for(;a<r.length;)n=r[a],t.stopped!==Td&&(!i||n===i||n.canRecognizeWith(i))?n.recognize(e):n.reset(),!i&&n.state&(H.Began|H.Changed|H.Ended)&&(i=t.curRecognizer=n),a++}get(e){let{recognizers:t}=this;for(let n=0;n<t.length;n++)if(t[n].options.event===e)return t[n];return null}add(e){if(Array.isArray(e)){for(let t of e)this.add(t);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let t of e)this.remove(t);return this}let t=typeof e==`string`?this.get(e):e;if(t){let{recognizers:e}=this,n=e.indexOf(t);n!==-1&&(e.splice(n,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:n}=this;for(let r of Yu(e))n[r]=n[r]||[],n[r].push(t)}off(e,t){if(!e)return;let{handlers:n}=this;for(let r of Yu(e))t?n[r]&&n[r].splice(n[r].indexOf(t),1):delete n[r]}emit(e,t){let n=this.handlers[e]&&this.handlers[e].slice();if(!n||!n.length)return;let r=t;r.type=e,r.preventDefault=function(){t.srcEvent.preventDefault()};let i=0;for(;i<n.length;)n[i](r),i++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[n,r]of Object.entries(this.options.cssProps)){let i=Cd(t.style,n);e?(this.oldCssProps[i]=t.style[i],t.style[i]=r):t.style[i]=this.oldCssProps[i]||``}e||(this.oldCssProps={})}}},Od=1;function kd(){return Od++}function Ad(e){return e&H.Cancelled?`cancel`:e&H.Ended?`end`:e&H.Changed?`move`:e&H.Began?`start`:``}var jd=class{constructor(e){this.options=e,this.id=kd(),this.state=H.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){if(Array.isArray(e)){for(let t of e)this.recognizeWith(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:n}=this;return n[t.id]||(n[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){if(Array.isArray(e)){for(let t of e)this.dropRecognizeWith(t);return this}let t;return t=typeof e==`string`?this.manager.get(e):e,t&&delete this.simultaneous[t.id],this}requireFailure(e){if(Array.isArray(e)){for(let t of e)this.requireFailure(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:n}=this;return n.indexOf(t)===-1&&(n.push(t),t.requireFailure(this)),this}dropRequireFailure(e){if(Array.isArray(e)){for(let t of e)this.dropRequireFailure(t);return this}let t;if(t=typeof e==`string`?this.manager.get(e):e,t){let e=this.requireFail.indexOf(t);e>-1&&this.requireFail.splice(e,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<H.Ended&&this.manager.emit(this.options.event+Ad(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=H.Ended&&this.manager.emit(this.options.event+Ad(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=H.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&(H.Failed|H.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=H.Failed;return}this.state&(H.Recognized|H.Cancelled|H.Failed)&&(this.state=H.Possible),this.state=this.process(t),this.state&(H.Began|H.Changed|H.Ended|H.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}};function Md(e){return Math.abs(((e+180)%360+360)%360-180)}function Nd(e,t){return(t.distance===void 0||e.distance>=t.distance)&&(t.distancePerPointer===void 0||e.distancePerPointer.length>0&&e.distancePerPointer.every(e=>e>=t.distancePerPointer))&&(t.movementDeltaTime===void 0||e.movementDeltaTime>=t.movementDeltaTime)&&(t.rotation===void 0||Md(e.rotation)>=t.rotation)&&(t.scale===void 0||Math.abs(e.scale-1)>=t.scale)}var Pd=class extends jd{attrTest(e){let t=this.options.pointers;return t===0||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(t=>Nd(e,t))}process(e){let{state:t}=this,{eventType:n}=e,r=t&(H.Began|H.Changed),i=this.attrTest(e);return r&&(n&B.Cancel||!i)?t|H.Cancelled:r||i?n&B.End?t|H.Ended:t&H.Began?t|H.Changed:H.Began:H.Failed}},Fd=[``,`start`,`move`,`end`,`cancel`],Id=class extends jd{constructor(e={}){super({enable:!0,event:`doubleclickdrag`,pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[Uu]}getEventNames(){return Fd.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length===t.pointers?e.eventType&B.Start?this._handleStart(e):e.eventType&B.Move?this._handleMove(e):e.eventType&B.Cancel?this._handleEnd(e,!0):e.eventType&B.End?this._handleEnd(e,!1):H.Failed:(this.reset(),H.Failed)}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===H.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===H.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===H.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===H.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,H.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,H.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return H.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?H.Began:(this._drag.active=!0,e.scale=2**(t/this.options.pixelsPerScale),this._emittedStart?H.Changed:H.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:n,startCenter:r}=this._drag;return this._drag=null,this._tapStart=null,this._lastTap=null,n?(e.scale=2**((r.y-e.center.y)/this.options.pixelsPerScale),t?H.Cancelled:H.Ended):(this._emittedStart=!1,H.Failed)}return!this._tapStart||!this._isSamePointer(e,this._tapStart.pointerId)?(t&&this.reset(),H.Failed):(this._isValidTap(e)?this._lastTap={center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null,H.Failed)}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&nd(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return`pointerId`in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return t===null||this._getPointerId(e)===t}},Ld=class extends jd{constructor(e={}){super({enable:!0,event:`tap`,pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[Uu]}process(e){let{options:t}=this,n=e.pointers.length===t.pointers,r=e.distance<t.threshold,i=e.deltaTime<t.time;if(this.reset(),e.eventType&B.Start&&this.count===0)return this.failTimeout();if(r&&i&&n){if(e.eventType!==B.End)return this.failTimeout();let n=this.pTime?e.timeStamp-this.pTime<t.interval:!0,r=!this.pCenter||nd(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,!r||!n?this.count=1:this.count+=1,this._input=e,this.count%t.taps===0)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=H.Recognized,this.tryEmit(this._input)},t.interval),H.Began):H.Recognized}return H.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=H.Failed},this.options.interval),H.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===H.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}},Rd=class extends Pd{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{e.device===`trackpad`&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...n}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(n),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:n}=e,r=t.deltaX??e.deltaX,i=t.deltaY??e.deltaY,a=od(r,i),o=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY),s=n;return{pointers:[s,s],changedPointers:[s,s],pointerType:`trackpad`,srcEvent:s,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:r,deltaY:i,angle:Math.atan2(i,r)*180/Math.PI,distance:Math.sqrt(r*r+i*i),distancePerPointer:[o,o],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:a,offsetDirection:a,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:n.target||this.manager.element,additionalEvent:``,...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&this.options.pointers===2);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}},zd=[``,`start`,`move`,`end`,`cancel`,`up`,`down`,`left`,`right`],Bd=class extends Rd{constructor(e={}){super({enable:!0,pointers:1,event:`pan`,threshold:10,direction:V.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&V.Horizontal&&t.push(Ku),e&V.Vertical&&t.push(Gu),t}getEventNames(){return zd.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,n=!0,{distance:r}=e,{direction:i}=e,a=e.deltaX,o=e.deltaY;return i&t.direction||(t.direction&V.Horizontal?(i=a===0?V.None:a<0?V.Left:V.Right,n=a!==this.pX,r=Math.abs(e.deltaX)):(i=o===0?V.None:o<0?V.Up:V.Down,n=o!==this.pY,r=Math.abs(e.deltaY))),e.direction=i,n&&r>t.threshold&&!!(i&t.direction)}attrTest(e){let t=!!(this.state&H.Began),n=!(this.options.coherent?.length&&e.eventType&(B.End|B.Cancel));return super.attrTest(e)&&(t||n&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=V[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(H.Recognized|H.Cancelled|H.Failed)&&(this.state=H.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}},Vd=[``,`start`,`move`,`end`,`cancel`,`in`,`out`],Hd=class extends Rd{constructor(e={}){super({enable:!0,event:`pinch`,threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return[Wu]}getEventNames(){return Vd.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,n=!!(this.state&H.Began),r=!(t&&e.eventType&(B.End|B.Cancel));return super.attrTest(e)&&(n||r&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(e.scale!==1){let t=e.scale<1?`in`:`out`;e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(H.Recognized|H.Cancelled|H.Failed)&&(this.state=H.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}},Ud=class{constructor(e,t,n){this.element=e,this.callback=t,this.options=n}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}},Wd=(typeof navigator<`u`&&navigator.userAgent?navigator.userAgent.toLowerCase():``).indexOf(`firefox`)!==-1,Gd=40,Kd=.25,qd=class extends Ud{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{if(!this.options.enable)return;let t=e.deltaY;globalThis.WheelEvent&&(Wd&&e.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(t/=globalThis.devicePixelRatio),e.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(t*=Gd)),e.shiftKey&&t&&(t*=Kd),this.callback({type:`wheel`,center:{x:e.clientX,y:e.clientY},delta:-t,device:this.options.wheelSession?.device??`unknown`,srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen(`wheel`,!0))}destroy(){this.listen(`wheel`,!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){e===`wheel`&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen(`wheel`,t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}},Jd=4.000244140625,Yd=40,Xd=0,Zd=1,Qd=40,$d=40,ef=120,tf={classificationDelay:32,endDelay:80},nf=class{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=e=>{if(!this.hasSubscribers)return`unknown`;let t=af(e,this.pressedControlKeys.size>0),n=this.session;if(n&&t.timeStamp-n.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return`unknown`;n=null}n?(this.scheduleEnd(),this.addSample(n,t)):(n=this.startPendingSession(t),this.scheduleEnd());let{device:r}=n;return r===`unknown`&&(r=of(n.samples,!1),r!==`unknown`&&this.begin(n,r)),r},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||this.session.device!==`unknown`)return;let e=this.session,t=of(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)},this.end=()=>{if(!this.session)return;if(this.session.device===`unknown`){let e=this.session,t=of(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)}if(!this.session)return;let e=this.session;this.emit(B.End,e.lastEvent),this.reset()},this.handleKeyDown=e=>{e.key===`Control`&&this.pressedControlKeys.add(e.code||e.key)},this.handleKeyUp=e=>{e.key===`Control`&&(e.code?this.pressedControlKeys.delete(e.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...tf,...t},this.element?.addEventListener(`wheel`,this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??`unknown`}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&e.device!==`unknown`&&this.emit(B.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener(`wheel`,this.handleEvent)}startPendingSession(e){let t={samples:[e],device:`unknown`,firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,e.device!==`unknown`){let n=e.samples[e.samples.length-2],r=t.timeStamp-n.timeStamp;e.velocityX=r>0?t.deltaX/r:0,e.velocityY=r>0?t.deltaY/r:0,this.emit(B.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(B.Start,e.samples[0].event);let n=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=n>0?e.totalDeltaX/n:0,e.velocityY=n>0?e.totalDeltaY/n:0,this.emit(B.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,n){let r=this.session;if(!r||r.device===`unknown`)return;let i=e===B.Start,a=e===B.End||e===B.Cancel,o=i?r.firstTimeStamp:r.lastTimeStamp,s=i?0:Math.max(0,o-r.firstTimeStamp),c=i?0:r.totalDeltaX,l=i?0:r.totalDeltaY,u=s>0?c/s:0,d=s>0?l/s:0,f=i?0:n?.velocityX??r.velocityX,p=i?0:n?.velocityY??r.velocityY,m={eventType:e,device:r.device,srcEvent:t,timeStamp:o,center:{x:t.clientX,y:t.clientY},deltaX:c,deltaY:l,deltaTime:s,velocity:Math.abs(f)>Math.abs(p)?f:p,velocityX:f,velocityY:p,overallVelocity:Math.abs(u)>Math.abs(d)?u:d,overallVelocityX:u,overallVelocityY:d,isFirst:i,isFinal:a};for(let{listener:e}of[...this.subscriptions.values()])e(m)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){this.classificationTimer!==null&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){this.endTimer!==null&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t=rf();!t||e===this.listeningForControlKeys||(this.listeningForControlKeys=e,e?(t.addEventListener(`keydown`,this.handleKeyDown,!0),t.addEventListener(`keyup`,this.handleKeyUp,!0),t.addEventListener(`blur`,this.handleWindowBlur)):(t.removeEventListener(`keydown`,this.handleKeyDown,!0),t.removeEventListener(`keyup`,this.handleKeyUp,!0),t.removeEventListener(`blur`,this.handleWindowBlur),this.pressedControlKeys.clear()))}};function rf(){return typeof window<`u`?window:globalThis.document?.defaultView}function af(e,t){let n=e.deltaX,r=e.deltaY;return e.deltaMode===Zd&&(n*=Yd,r*=Yd),{event:e,timeStamp:e.timeStamp,deltaX:n,deltaY:r,isControlKeyDown:t}}function of(e,t){return e.some(({event:e,isControlKeyDown:t})=>e.ctrlKey&&!t)?`trackpad`:e.some(({event:e})=>e.deltaMode!==Xd)||e.some(sf)||e.every(({event:e})=>{let t=e.wheelDelta;return t!==void 0&&Math.abs(t)%40==0})?`mouse`:e.some(({deltaX:e})=>e!==0)||e.length>1&&cf(e)?`trackpad`:t?`mouse`:`unknown`}function sf({event:e,deltaX:t,deltaY:n}){if(t!==0||n===0)return!1;let r=Math.abs(n/Jd);if(Number.isInteger(r))return!0;let i=e.wheelDelta;return typeof i==`number`&&i!==0&&i%ef===0}function cf(e){for(let t=0;t<e.length;t++){let n=e[t];if(Math.abs(n.deltaX)>$d||Math.abs(n.deltaY)>$d||t>0&&n.timeStamp-e[t-1].timeStamp>Qd)return!1}return!0}var lf=[`mousedown`,`mousemove`,`mouseup`,`mouseover`,`mouseout`,`mouseenter`,`mouseleave`],uf=class extends Ud{constructor(e,t,n){super(e,t,{enable:!0,...n}),this.handleEvent=e=>{this.handleOverEvent(e),this.handleOutEvent(e),this.handleEnterEvent(e),this.handleLeaveEvent(e),this.handleMoveEvent(e)},this.pressed=!1;let{enable:r=!1}=this.options;this.enableMoveEvent=r,this.enableLeaveEvent=r,this.enableEnterEvent=r,this.enableOutEvent=r,this.enableOverEvent=r,r&&lf.forEach(e=>this.listen(e,!0))}destroy(){lf.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case`pointermove`:this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen(`mousedown`,t),this.listen(`mousemove`,t),this.listen(`mouseup`,t));break;case`pointerover`:this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen(`mouseover`,t));break;case`pointerout`:this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen(`mouseout`,t));break;case`pointerenter`:this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen(`mouseenter`,t));break;case`pointerleave`:this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen(`mouseleave`,t));break;default:}}handleOverEvent(e){this.enableOverEvent&&e.type===`mouseover`&&this._emit(`pointerover`,e)}handleOutEvent(e){this.enableOutEvent&&e.type===`mouseout`&&this._emit(`pointerout`,e)}handleEnterEvent(e){this.enableEnterEvent&&e.type===`mouseenter`&&this._emit(`pointerenter`,e)}handleLeaveEvent(e){this.enableLeaveEvent&&e.type===`mouseleave`&&this._emit(`pointerleave`,e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case`mousedown`:e.button>=0&&(this.pressed=!0);break;case`mousemove`:e.buttons===0&&(this.pressed=!1),this.pressed||this._emit(`pointermove`,e);break;case`mouseup`:this.pressed=!1;break;default:}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:`mouse`,target:t.target})}},df=[`keydown`,`keyup`],ff=class extends Ud{constructor(e,t,n){super(e,t,{enable:!0,tabIndex:0,...n}),this.handleEvent=e=>{let t=e.target||e.srcElement;t.tagName===`INPUT`&&t.type===`text`||t.tagName===`TEXTAREA`||(this.enableDownEvent&&e.type===`keydown`&&this.callback({type:`keydown`,srcEvent:e,key:e.key,target:e.target}),this.enableUpEvent&&e.type===`keyup`&&this.callback({type:`keyup`,srcEvent:e,key:e.key,target:e.target}))};let{enable:r=!1}=this.options;this.enableDownEvent=r,this.enableUpEvent=r,e.tabIndex=this.options.tabIndex,e.style.outline=`none`,r&&df.forEach(e=>this.listen(e,!0))}destroy(){df.forEach(e=>this.listen(e,!1))}enableEventType(e,t){e===`keydown`&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),e===`keyup`&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}},pf=class extends Ud{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{this.options.enable&&this.callback({type:`contextmenu`,center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&this.listen(`contextmenu`,!0)}destroy(){this.listen(`contextmenu`,!1)}enableEventType(e,t){e===`contextmenu`&&this.options.enable!==t&&(this.options.enable=t,this.listen(`contextmenu`,t))}},mf=1,hf=2,gf=4,_f={pointerdown:mf,pointermove:hf,pointerup:gf,mousedown:mf,mousemove:hf,mouseup:gf},vf=0,yf=1,bf=2,xf=1,Sf=2,Cf=4;function wf(e){let t=_f[e.srcEvent.type];if(!t)return null;let{buttons:n,button:r}=e.srcEvent,i=!1,a=!1,o=!1;return t===hf?(i=!!(n&xf),a=!!(n&Cf),o=!!(n&Sf)):(i=r===vf,a=r===yf,o=r===bf),{leftButton:i,middleButton:a,rightButton:o}}function Tf(e,t){let n=e.center;if(!n)return null;let r=t.getBoundingClientRect(),i=r.width/t.offsetWidth||1,a=r.height/t.offsetHeight||1;return{center:n,offsetCenter:{x:(n.x-r.left-t.clientLeft)/i,y:(n.y-r.top-t.clientTop)/a}}}var Ef={srcElement:`root`,priority:0},Df=class{constructor(e,t){this.handleEvent=e=>{if(this.isEmpty())return;let t=this._normalizeEvent(e),n=e.srcEvent.target;for(;n&&n!==t.rootElement;){if(this._emit(t,n),t.handled)return;n=n.parentNode}this._emit(t,`root`)},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,n,r=!1,i=!1){let{handlers:a,handlersByElement:o}=this,s={...Ef,...n},c=o.get(s.srcElement);c||(c=[],o.set(s.srcElement,c));let l={type:e,handler:t,srcElement:s.srcElement,priority:s.priority};r&&(l.once=!0),i&&(l.passive=!0),a.push(l),this._active=this._active||!l.passive;let u=c.length-1;for(;u>=0&&!(c[u].priority>=l.priority);)u--;c.splice(u+1,0,l)}remove(e,t){let{handlers:n,handlersByElement:r}=this;for(let i=n.length-1;i>=0;i--){let a=n[i];if(a.type===e&&a.handler===t){n.splice(i,1);let e=r.get(a.srcElement);e.splice(e.indexOf(a),1),e.length===0&&r.delete(a.srcElement)}}this._active=n.some(e=>!e.passive)}_emit(e,t){let n=this.handlersByElement.get(t);if(n){let t=!1,r=()=>{e.handled=!0},i=()=>{e.handled=!0,t=!0},a=[];for(let o=0;o<n.length;o++){let{type:s,handler:c,once:l}=n[o];if(c({...e,type:s,stopPropagation:r,stopImmediatePropagation:i}),l&&a.push(n[o]),t)break}for(let e=0;e<a.length;e++){let{type:t,handler:n}=a[e];this.remove(t,n)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...wf(e),...Tf(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}};function Of(e){if(`recognizer`in e)return e;let t,n=Array.isArray(e)?[...e]:[e];return t=typeof n[0]==`function`?new(n.shift())(n.shift()||{}):n.shift(),{recognizer:t,recognizeWith:typeof n[0]==`string`?[n[0]]:n[0],requireFailure:typeof n[1]==`string`?[n[1]]:n[1]}}var kf=class{constructor(e=null,t={}){if(this._onBasicInput=e=>{this.manager.emit(e.srcEvent.type,e)},this._onOtherEvent=e=>{this.manager.emit(e.type,e)},this.options={recognizers:[],events:{},touchAction:`compute`,tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new nf(e),e){this.manager=new Dd(e,this.options);for(let e of this.options.recognizers){let{recognizer:t,recognizeWith:n,requireFailure:r}=Of(e);this.manager.add(t),n&&t.recognizeWith(n),r&&t.requireFailure(r)}this.manager.on(`hammer.input`,this._onBasicInput),this.wheelInput=new qd(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new uf(e,this._onOtherEvent,{enable:!1}),this.keyInput=new ff(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new pf(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}}getElement(){return this.element}destroy(){if(!this.element){this.wheelSession.destroy();return}this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()}on(e,t,n){this._addEventHandler(e,t,n,!1)}once(e,t,n){this._addEventHandler(e,t,n,!0)}watch(e,t,n){this._addEventHandler(e,t,n,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:n}=this;if(!n)return;let r=n.get(e);r&&(r.set({enable:t,wheelSession:this.wheelSession}),n.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,n,r,i){if(typeof e!=`string`){n=t;for(let[t,a]of Object.entries(e))this._addEventHandler(t,a,n,r,i);return}let{manager:a,events:o}=this;if(!a)return;let s=o.get(e);if(!s){let t=this._getRecognizerName(e)||e;s=new Df(this,t),o.set(e,s),a&&a.on(e,s.handleEvent)}s.add(e,t,n,r,i),s.isEmpty()||this._toggleRecognizer(s.recognizerName,!0)}_removeEventHandler(e,t){if(typeof e!=`string`){for(let[t,n]of Object.entries(e))this._removeEventHandler(t,n);return}let{events:n}=this,r=n.get(e);if(r&&(r.remove(e,t),r.isEmpty())){let{recognizerName:e}=r,t=!1;for(let r of n.values())if(r.recognizerName===e&&!r.isEmpty()){t=!0;break}t||this._toggleRecognizer(e,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}},Af={DEFAULT:`default`,LNGLAT:`lnglat`,METER_OFFSETS:`meter-offsets`,LNGLAT_OFFSETS:`lnglat-offsets`,CARTESIAN:`cartesian`};Object.defineProperty(Af,`IDENTITY`,{get:()=>(N.deprecated(`COORDINATE_SYSTEM.IDENTITY`,`COORDINATE_SYSTEM.CARTESIAN`)(),Af.CARTESIAN)});var U={WEB_MERCATOR:1,GLOBE:2,WEB_MERCATOR_AUTO_OFFSET:4,IDENTITY:0},jf={common:0,meters:1,pixels:2},Mf={click:`onClick`,dblclick:`onClick`,panstart:`onDragStart`,panmove:`onDrag`,panend:`onDragEnd`},Nf={multipan:[Bd,{threshold:10,pointers:2,trackpad:!0}],pinch:[Hd,{trackpad:!0},null,[`multipan`]],pan:[Bd,{threshold:1},[`pinch`],[`multipan`]],dblclick:[Ld,{event:`dblclick`,taps:2,enable:!1}],dblclickdrag:[Id,{event:`dblclickdrag`,enable:!1},[`dblclick`],null],click:[Ld,{event:`click`},[`dblclickdrag`],[`dblclick`,`dblclickdrag`]]};function Pf(e,t){if(e===t)return!0;if(Array.isArray(e)){let n=e.length;if(!t||t.length!==n)return!1;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}return!1}function Ff(e){let t={},n;return r=>{for(let i in r)if(!Pf(r[i],t[i])){n=e(r),t=r;break}return n}}var If=[0,0,0,0],Lf=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],Rf=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],zf=[0,0,0],Bf=[0,0,0],Vf={default:-1,cartesian:0,lnglat:1,"meter-offsets":2,"lnglat-offsets":3};function Hf(e){let t=Vf[e];if(t===void 0)throw Error(`Invalid coordinateSystem: ${e}`);return t}var Uf=Ff(qf);function Wf(e,t,n=Bf){n.length<3&&(n=[n[0],n[1],0]);let r=n,i,a=!0;switch(i=t===`lnglat-offsets`||t===`meter-offsets`?n:e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null,e.projectionMode){case U.WEB_MERCATOR:(t===`lnglat`||t===`cartesian`)&&(i=[0,0,0],a=!1);break;case U.WEB_MERCATOR_AUTO_OFFSET:t===`lnglat`?r=i:t===`cartesian`&&(r=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],i=e.unprojectPosition(r),r[0]-=n[0],r[1]-=n[1],r[2]-=n[2]);break;case U.IDENTITY:r=e.position.map(Math.fround),r[2]=r[2]||0;break;case U.GLOBE:a=!1,i=null;break;default:a=!1}return{geospatialOrigin:i,shaderCoordinateOrigin:r,offsetMode:a}}function Gf(e,t,n){let{viewMatrixUncentered:r,projectionMatrix:i}=e,{viewMatrix:a,viewProjectionMatrix:o}=e,s=If,c=If,l=e.cameraPosition,{geospatialOrigin:u,shaderCoordinateOrigin:d,offsetMode:f}=Wf(e,t,n);return f&&(c=e.projectPosition(u||d),l=[l[0]-c[0],l[1]-c[1],l[2]-c[2]],c[3]=1,s=Au([],c,o),a=r||a,o=hu([],i,a),o=hu([],o,Lf)),{viewMatrix:a,viewProjectionMatrix:o,projectionCenter:s,originCommon:c,cameraPosCommon:l,shaderCoordinateOrigin:d,geospatialOrigin:u}}function Kf({viewport:e,devicePixelRatio:t=1,modelMatrix:n=null,coordinateSystem:r=`default`,coordinateOrigin:i=Bf,autoWrapLongitude:a=!1}){r===`default`&&(r=e.isGeospatial?`lnglat`:`cartesian`);let o=Uf({viewport:e,devicePixelRatio:t,coordinateSystem:r,coordinateOrigin:i});return o.wrapLongitude=a,o.modelMatrix=n||Rf,o}function qf({viewport:e,devicePixelRatio:t,coordinateSystem:n,coordinateOrigin:r}){let{projectionCenter:i,viewProjectionMatrix:a,originCommon:o,cameraPosCommon:s,shaderCoordinateOrigin:c,geospatialOrigin:l}=Gf(e,n,r),u=e.getDistanceScales(),d=[e.width*t,e.height*t],f=Au([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,p={coordinateSystem:Hf(n),projectionMode:e.projectionMode,coordinateOrigin:c,commonOrigin:o.slice(0,3),center:i,pseudoMeters:!!e._pseudoMeters,viewportSize:d,devicePixelRatio:t,focalDistance:f,commonUnitsPerMeter:u.unitsPerMeter,commonUnitsPerWorldUnit:u.unitsPerMeter,commonUnitsPerWorldUnit2:zf,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:a,modelMatrix:Rf,cameraPosition:s};if(l){let t=e.getDistanceScales(l);switch(n){case`meter-offsets`:p.commonUnitsPerWorldUnit=t.unitsPerMeter,p.commonUnitsPerWorldUnit2=t.unitsPerMeter2;break;case`lnglat`:case`lnglat-offsets`:e._pseudoMeters||(p.commonUnitsPerMeter=t.unitsPerMeter),p.commonUnitsPerWorldUnit=t.unitsPerDegree,p.commonUnitsPerWorldUnit2=t.unitsPerDegree2;break;case`cartesian`:p.commonUnitsPerWorldUnit=[1,1,t.unitsPerMeter[2]],p.commonUnitsPerWorldUnit2=[0,0,t.unitsPerMeter2[2]];break;default:break}}if(e.projectionMode===U.GLOBE&&n===`meter-offsets`){let e=r[0]*Math.PI/180,t=r[1]*Math.PI/180,n=Math.cos(t),i=((r[2]||0)/6370972+1)*256;p.commonOrigin=[Math.sin(e)*n*i,-Math.cos(e)*n*i,Math.sin(t)*i]}return p}var Jf=`\
${`\
${[`default`,`lnglat`,`meter-offsets`,`lnglat-offsets`,`cartesian`].map(e=>`const COORDINATE_SYSTEM_${e.toUpperCase().replaceAll(`-`,`_`)}: i32 = ${Hf(e)};`).join(``)}
${Object.keys(U).map(e=>`const PROJECTION_MODE_${e}: i32 = ${U[e]};`).join(``)}
${Object.keys(jf).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${jf[e]};`).join(``)}

const TILE_SIZE: f32 = 512.0;
const PI: f32 = 3.1415926536;
const WORLD_SCALE: f32 = TILE_SIZE / (PI * 2.0);
const ZERO_64_LOW: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
const EARTH_RADIUS: f32 = 6370972.0; // meters
const GLOBE_RADIUS: f32 = 256.0;

// -----------------------------------------------------------------------------
// Uniform block (converted from GLSL uniform block)
// -----------------------------------------------------------------------------
struct ProjectUniforms {
  wrapLongitude: i32,
  coordinateSystem: i32,
  commonUnitsPerMeter: vec3<f32>,
  projectionMode: i32,
  scale: f32,
  commonUnitsPerWorldUnit: vec3<f32>,
  commonUnitsPerWorldUnit2: vec3<f32>,
  center: vec4<f32>,
  modelMatrix: mat4x4<f32>,
  viewProjectionMatrix: mat4x4<f32>,
  viewportSize: vec2<f32>,
  devicePixelRatio: f32,
  focalDistance: f32,
  cameraPosition: vec3<f32>,
  coordinateOrigin: vec3<f32>,
  commonOrigin: vec3<f32>,
  pseudoMeters: i32,
};

@group(0) @binding(auto)
var<uniform> project: ProjectUniforms;

// -----------------------------------------------------------------------------
// Geometry data shared across the project helpers.
// The active layer shader is responsible for populating this private module
// state before calling the project functions below.
// -----------------------------------------------------------------------------

// Structure to carry additional geometry data used by deck.gl filters.
struct Geometry {
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  position: vec4<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry: Geometry;
`}

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

// Returns an adjustment factor for commonUnitsPerMeter
fn _project_size_at_latitude(lat: f32) -> f32 {
  let y = clamp(lat, -89.9, 89.9);
  return 1.0 / cos(radians(y));
}

// Overloaded version: scales a value in meters at a given latitude.
fn _project_size_at_latitude_m(meters: f32, lat: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * _project_size_at_latitude(lat);
}

// Computes a non-linear scale factor based on geometry.
// (Note: This function relies on "geometry" being provided.)
fn project_size() -> f32 {
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
      project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
      project.pseudoMeters == 0) {
    if (geometry.position.w == 0.0) {
      return _project_size_at_latitude(geometry.worldPosition.y);
    }
    let y: f32 = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
    let y2 = y * y;
    let y4 = y2 * y2;
    let y6 = y4 * y2;
    return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
  }
  return 1.0;
}

// Overloads to scale offsets (meters to world units)
fn project_size_float(meters: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * project_size();
}

fn project_size_vec2(meters: vec2<f32>) -> vec2<f32> {
  return meters * project.commonUnitsPerMeter.xy * project_size();
}

fn project_size_vec3(meters: vec3<f32>) -> vec3<f32> {
  return meters * project.commonUnitsPerMeter * project_size();
}

fn project_size_vec4(meters: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(meters.xyz * project.commonUnitsPerMeter, meters.w);
}

// Returns a rotation matrix aligning the z‑axis with the given up vector.
fn project_get_orientation_matrix(up: vec3<f32>) -> mat3x3<f32> {
  let uz = normalize(up);
  var ux = vec3<f32>(1.0, 0.0, 0.0);
  if (abs(uz.z) != 1.0) {
    ux = normalize(vec3<f32>(uz.y, -uz.x, 0.0));
  }
  let uy = cross(uz, ux);
  return mat3x3<f32>(ux, uy, uz);
}

// Since WGSL does not support "out" parameters, we return a struct.
struct RotationResult {
  needsRotation: bool,
  transform: mat3x3<f32>,
};

fn project_needs_rotation(commonPosition: vec3<f32>) -> RotationResult {
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    return RotationResult(true, project_get_orientation_matrix(commonPosition));
  } else {
    return RotationResult(false, mat3x3<f32>());  // identity alternative if needed
  };
}

// Projects a normal vector from the current coordinate system to world space.
fn project_normal(vector: vec3<f32>) -> vec3<f32> {
  let normal_modelspace = project.modelMatrix * vec4<f32>(vector, 0.0);
  var n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
  let rotResult = project_needs_rotation(geometry.position.xyz);
  if (rotResult.needsRotation) {
    n = rotResult.transform * n;
  }
  return n;
}

// Applies a scale offset based on y-offset (dy)
fn project_offset_(offset: vec4<f32>) -> vec4<f32> {
  let dy: f32 = offset.y;
  let commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
  return vec4<f32>(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}

// Projects lng/lat coordinates to a unit tile [0,1]
fn project_mercator_(lnglat: vec2<f32>) -> vec2<f32> {
  var x = lnglat.x;
  if (project.wrapLongitude != 0) {
    x = ((x + 180.0) % 360.0) - 180.0;
  }
  let y = clamp(lnglat.y, -89.9, 89.9);
  return vec2<f32>(
    radians(x) + PI,
    PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// Projects lng/lat/z coordinates for a globe projection.
fn project_globe_(lnglatz: vec3<f32>) -> vec3<f32> {
  let lambda = radians(lnglatz.x);
  let phi = radians(lnglatz.y);
  let cosPhi = cos(phi);
  let D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
  return vec3<f32>(
    sin(lambda) * cosPhi,
    -cos(lambda) * cosPhi,
    sin(phi)
  ) * D;
}

// Projects positions (with an optional 64-bit low part) from the input
// coordinate system to the common space.
fn project_position_vec4_f64(position: vec4<f32>, position64Low: vec3<f32>) -> vec4<f32> {
  var position_world = project.modelMatrix * position;

  // Work around for a Mac+NVIDIA bug:
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_mercator_(position_world.xy),
        _project_size_at_latitude_m(position_world.z, position_world.y),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
      position_world = vec4f(position_world.xyz + project.coordinateOrigin, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_globe_(position_world.xyz),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
      let enuMatrix = project_get_orientation_matrix(project.commonOrigin);
      let metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
      let offsetCommon = (enuMatrix * vec3<f32>(-position_world.x, -position_world.y, position_world.z)) * metersToCommon;
      return vec4<f32>(project.commonOrigin + offsetCommon, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
        return vec4<f32>(
          project_mercator_(position_world.xy) - project.commonOrigin.xy,
          project_size_float(position_world.z),
          position_world.w
        );
      }
    }
  }
  if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
      (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
       (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
        project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
    position_world = vec4f(position_world.xyz - project.coordinateOrigin, position_world.w);
  }

  return project_offset_(position_world) +
         project_offset_(project.modelMatrix * vec4<f32>(position64Low, 0.0));
}

// Overloaded versions for different input types.
fn project_position_vec4_f32(position: vec4<f32>) -> vec4<f32> {
  return project_position_vec4_f64(position, ZERO_64_LOW);
}

fn project_position_vec3_f64(position: vec3<f32>, position64Low: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), position64Low);
  return projected_position.xyz;
}

fn project_position_vec3_f32(position: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), ZERO_64_LOW);
  return projected_position.xyz;
}

fn project_position_vec2_f32(position: vec2<f32>) -> vec2<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 0.0, 1.0), ZERO_64_LOW);
  return projected_position.xy;
}

// Transforms a common space position to clip space.
fn project_common_position_to_clipspace_with_projection(position: vec4<f32>, viewProjectionMatrix: mat4x4<f32>, center: vec4<f32>) -> vec4<f32> {
  var clipPosition = viewProjectionMatrix * position + center;
  // deck.gl projection matrices use WebGL's [-w, w] depth range; WebGPU clips z to [0, w].
  clipPosition.z = (clipPosition.z + clipPosition.w) * 0.5;
  return clipPosition;
}

// Uses the project viewProjectionMatrix and center.
fn project_common_position_to_clipspace(position: vec4<f32>) -> vec4<f32> {
  return project_common_position_to_clipspace_with_projection(position, project.viewProjectionMatrix, project.center);
}

// Returns a clip space offset corresponding to a given number of screen pixels.
fn project_pixel_size_to_clipspace(pixels: vec2<f32>) -> vec2<f32> {
  let offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
  return offset * project.focalDistance;
}

fn project_meter_size_to_pixel(meters: f32) -> f32 {
  return project_size_float(meters) * project.scale;
}

fn project_unit_size_to_pixel(size: f32, unit: i32) -> f32 {
  if (unit == UNIT_METERS) {
    return project_meter_size_to_pixel(size);
  } else if (unit == UNIT_COMMON) {
    return size * project.scale;
  }
  // UNIT_PIXELS: no scaling applied.
  return size;
}

fn project_pixel_size_float(pixels: f32) -> f32 {
  return pixels / project.scale;
}

fn project_pixel_size_vec2(pixels: vec2<f32>) -> vec2<f32> {
  return pixels / project.scale;
}
`,Yf=`\
${[`default`,`lnglat`,`meter-offsets`,`lnglat-offsets`,`cartesian`].map(e=>`const int COORDINATE_SYSTEM_${e.toUpperCase().replaceAll(`-`,`_`)} = ${Hf(e)};`).join(``)}
${Object.keys(U).map(e=>`const int PROJECTION_MODE_${e} = ${U[e]};`).join(``)}
${Object.keys(jf).map(e=>`const int UNIT_${e.toUpperCase()} = ${jf[e]};`).join(``)}
layout(std140) uniform projectUniforms {
bool wrapLongitude;
int coordinateSystem;
vec3 commonUnitsPerMeter;
int projectionMode;
float scale;
vec3 commonUnitsPerWorldUnit;
vec3 commonUnitsPerWorldUnit2;
vec4 center;
mat4 modelMatrix;
mat4 viewProjectionMatrix;
vec2 viewportSize;
float devicePixelRatio;
float focalDistance;
vec3 cameraPosition;
vec3 coordinateOrigin;
vec3 commonOrigin;
bool pseudoMeters;
} project;
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / (PI * 2.0);
const vec3 ZERO_64_LOW = vec3(0.0);
const float EARTH_RADIUS = 6370972.0;
const float GLOBE_RADIUS = 256.0;
float project_size_at_latitude(float lat) {
float y = clamp(lat, -89.9, 89.9);
return 1.0 / cos(radians(y));
}
float project_size() {
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
project.pseudoMeters == false) {
if (geometry.position.w == 0.0) {
return project_size_at_latitude(geometry.worldPosition.y);
}
float y = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
float y2 = y * y;
float y4 = y2 * y2;
float y6 = y4 * y2;
return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
}
return 1.0;
}
float project_size_at_latitude(float meters, float lat) {
return meters * project.commonUnitsPerMeter.z * project_size_at_latitude(lat);
}
float project_size(float meters) {
return meters * project.commonUnitsPerMeter.z * project_size();
}
vec2 project_size(vec2 meters) {
return meters * project.commonUnitsPerMeter.xy * project_size();
}
vec3 project_size(vec3 meters) {
return meters * project.commonUnitsPerMeter * project_size();
}
vec4 project_size(vec4 meters) {
return vec4(meters.xyz * project.commonUnitsPerMeter, meters.w);
}
mat3 project_get_orientation_matrix(vec3 up) {
vec3 uz = normalize(up);
vec3 ux = abs(uz.z) == 1.0 ? vec3(1.0, 0.0, 0.0) : normalize(vec3(uz.y, -uz.x, 0));
vec3 uy = cross(uz, ux);
return mat3(ux, uy, uz);
}
bool project_needs_rotation(vec3 commonPosition, out mat3 transform) {
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
transform = project_get_orientation_matrix(commonPosition);
return true;
}
return false;
}
vec3 project_normal(vec3 vector) {
vec4 normal_modelspace = project.modelMatrix * vec4(vector, 0.0);
vec3 n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
mat3 rotation;
if (project_needs_rotation(geometry.position.xyz, rotation)) {
n = rotation * n;
}
return n;
}
vec4 project_offset_(vec4 offset) {
float dy = offset.y;
vec3 commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
return vec4(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}
vec2 project_mercator_(vec2 lnglat) {
float x = lnglat.x;
if (project.wrapLongitude) {
x = mod(x + 180., 360.0) - 180.;
}
float y = clamp(lnglat.y, -89.9, 89.9);
return vec2(
radians(x) + PI,
PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
) * WORLD_SCALE;
}
vec3 project_globe_(vec3 lnglatz) {
float lambda = radians(lnglatz.x);
float phi = radians(lnglatz.y);
float cosPhi = cos(phi);
float D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
return vec3(
sin(lambda) * cosPhi,
-cos(lambda) * cosPhi,
sin(phi)
) * D;
}
vec4 project_position(vec4 position, vec3 position64Low) {
vec4 position_world = project.modelMatrix * position;
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_mercator_(position_world.xy),
project_size_at_latitude(position_world.z, position_world.y),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
position_world.xyz += project.coordinateOrigin;
}
}
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_globe_(position_world.xyz),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
mat3 enuMatrix = project_get_orientation_matrix(project.commonOrigin);
float metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
vec3 offsetCommon = (enuMatrix * vec3(-position_world.xy, position_world.z)) * metersToCommon;
return vec4(project.commonOrigin + offsetCommon, position_world.w);
}
}
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
return vec4(
project_mercator_(position_world.xy) - project.commonOrigin.xy,
project_size(position_world.z),
position_world.w
);
}
}
}
if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
(project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
(project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
position_world.xyz -= project.coordinateOrigin;
}
return project_offset_(position_world) + project_offset_(project.modelMatrix * vec4(position64Low, 0.0));
}
vec4 project_position(vec4 position) {
return project_position(position, ZERO_64_LOW);
}
vec3 project_position(vec3 position, vec3 position64Low) {
vec4 projected_position = project_position(vec4(position, 1.0), position64Low);
return projected_position.xyz;
}
vec3 project_position(vec3 position) {
vec4 projected_position = project_position(vec4(position, 1.0), ZERO_64_LOW);
return projected_position.xyz;
}
vec2 project_position(vec2 position) {
vec4 projected_position = project_position(vec4(position, 0.0, 1.0), ZERO_64_LOW);
return projected_position.xy;
}
vec4 project_common_position_to_clipspace(vec4 position, mat4 viewProjectionMatrix, vec4 center) {
return viewProjectionMatrix * position + center;
}
vec4 project_common_position_to_clipspace(vec4 position) {
return project_common_position_to_clipspace(position, project.viewProjectionMatrix, project.center);
}
vec2 project_pixel_size_to_clipspace(vec2 pixels) {
vec2 offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
return offset * project.focalDistance;
}
float project_size_to_pixel(float meters) {
return project_size(meters) * project.scale;
}
vec2 project_size_to_pixel(vec2 meters) {
return project_size(meters) * project.scale;
}
float project_size_to_pixel(float size, int unit) {
if (unit == UNIT_METERS) return project_size_to_pixel(size);
if (unit == UNIT_COMMON) return size * project.scale;
return size;
}
float project_pixel_size(float pixels) {
return pixels / project.scale;
}
vec2 project_pixel_size(vec2 pixels) {
return pixels / project.scale;
}
`,Xf={};function Zf(e=Xf){return`viewport`in e?Kf(e):{}}var Qf={name:`project`,dependencies:[vl,Ol],source:Jf,vs:Yf,getUniforms:Zf,uniformTypes:{wrapLongitude:`f32`,coordinateSystem:`i32`,commonUnitsPerMeter:`vec3<f32>`,projectionMode:`i32`,scale:`f32`,commonUnitsPerWorldUnit:`vec3<f32>`,commonUnitsPerWorldUnit2:`vec3<f32>`,center:`vec4<f32>`,modelMatrix:`mat4x4<f32>`,viewProjectionMatrix:`mat4x4<f32>`,viewportSize:`vec2<f32>`,devicePixelRatio:`f32`,focalDistance:`f32`,cameraPosition:`vec3<f32>`,coordinateOrigin:`vec3<f32>`,commonOrigin:`vec3<f32>`,pseudoMeters:`f32`}},$f={name:`project32`,dependencies:[Qf],source:`// Define a structure to hold both the clip-space position and the common position.
struct ProjectResult {
  clipPosition: vec4<f32>,
  commonPosition: vec4<f32>,
};

// This function mimics the GLSL version with the 'out' parameter by returning both values.
fn project_position_to_clipspace_and_commonspace(
    position: vec3<f32>,
    position64Low: vec3<f32>,
    offset: vec3<f32>
) -> ProjectResult {
  // Compute the projected position.
  let projectedPosition: vec3<f32> = project_position_vec3_f64(position, position64Low);

  // Start with the provided offset.
  var finalOffset: vec3<f32> = offset;

  // Get whether a rotation is needed and the rotation matrix.
  let rotationResult = project_needs_rotation(projectedPosition);

  // If rotation is needed, update the offset.
  if (rotationResult.needsRotation) {
    finalOffset = rotationResult.transform * offset;
  }

  // Compute the common position.
  let commonPosition: vec4<f32> = vec4<f32>(projectedPosition + finalOffset, 1.0);

  // Convert to clip-space.
  let clipPosition: vec4<f32> = project_common_position_to_clipspace(commonPosition);

  return ProjectResult(clipPosition, commonPosition);
}

// A convenience overload that returns only the clip-space position.
fn project_position_to_clipspace(
    position: vec3<f32>,
    position64Low: vec3<f32>,
    offset: vec3<f32>
) -> vec4<f32> {
  return project_position_to_clipspace_and_commonspace(position, position64Low, offset).clipPosition;
}
`,vs:`vec4 project_position_to_clipspace(
  vec3 position, vec3 position64Low, vec3 offset, out vec4 commonPosition
) {
  vec3 projectedPosition = project_position(position, position64Low);
  mat3 rotation;
  if (project_needs_rotation(projectedPosition, rotation)) {
    // offset is specified as ENU
    // when in globe projection, rotate offset so that the ground alighs with the surface of the globe
    offset = rotation * offset;
  }
  commonPosition = vec4(projectedPosition + offset, 1.0);
  return project_common_position_to_clipspace(commonPosition);
}

vec4 project_position_to_clipspace(
  vec3 position, vec3 position64Low, vec3 offset
) {
  vec4 commonPosition;
  return project_position_to_clipspace(position, position64Low, offset, commonPosition);
}
`},ep=typeof Float32Array<`u`?Float32Array:Array;Math.PI/180;function tp(){let e=new ep(2);return ep!=Float32Array&&(e[0]=0,e[1]=0),e}function np(e,t,n,r){let i=t[0],a=t[1];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e}(function(){let e=tp();return function(t,n,r,i,a,o){let s,c;for(n||=2,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],a(e,e,o),t[s]=e[0],t[s+1]=e[1];return t}})();function rp(){let e=new ep(3);return ep!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e}function ip(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e}(function(){let e=rp();return function(t,n,r,i,a,o){let s,c;for(n||=3,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],e[2]=t[s+2],a(e,e,o),t[s]=e[0],t[s+1]=e[1],t[s+2]=e[2];return t}})();function ap(e,t,n){let r=n[0],i=n[1],a=n[2],o,s,c,l,u,d,f,p,m,h,g,_;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*a+t[12],e[13]=t[1]*r+t[5]*i+t[9]*a+t[13],e[14]=t[2]*r+t[6]*i+t[10]*a+t[14],e[15]=t[3]*r+t[7]*i+t[11]*a+t[15]):(o=t[0],s=t[1],c=t[2],l=t[3],u=t[4],d=t[5],f=t[6],p=t[7],m=t[8],h=t[9],g=t[10],_=t[11],e[0]=o,e[1]=s,e[2]=c,e[3]=l,e[4]=u,e[5]=d,e[6]=f,e[7]=p,e[8]=m,e[9]=h,e[10]=g,e[11]=_,e[12]=o*r+u*i+m*a+t[12],e[13]=s*r+d*i+h*a+t[13],e[14]=c*r+f*i+g*a+t[14],e[15]=l*r+p*i+_*a+t[15]),e}function op(e,t,n){let r=n[0],i=n[1],a=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function sp(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e}function cp(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[4],u=t[5],d=t[6],f=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i+l*r,e[1]=o*i+u*r,e[2]=s*i+d*r,e[3]=c*i+f*r,e[4]=l*i-a*r,e[5]=u*i-o*r,e[6]=d*i-s*r,e[7]=f*i-c*r,e}function lp(){let e=new ep(4);return ep!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0,e[3]=0),e}function up(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e}function dp(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*a+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*a+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*a+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*a+n[15]*o,e}(function(){let e=lp();return function(t,n,r,i,a,o){let s,c;for(n||=4,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],e[2]=t[s+2],e[3]=t[s+3],a(e,e,o),t[s]=e[0],t[s+1]=e[1],t[s+2]=e[2],t[s+3]=e[3];return t}})();function fp(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function pp(e,t){let n=dp([],t,e);return up(n,n,1/n[3]),n}function mp(e,t,n){return e<t?t:e>n?n:e}function hp(e){return Math.log(e)*Math.LOG2E}var gp=Math.log2||hp;function _p(e,t){if(!e)throw Error(t||`@math.gl/web-mercator: assertion failed.`)}var vp=Math.PI,yp=vp/4,bp=vp/180,xp=180/vp,Sp=512,Cp=4003e4,wp=85.051129,Tp=1.5;function Ep(e){return gp(e)}function Dp(e){let[t,n]=e;_p(Number.isFinite(t)),_p(Number.isFinite(n)&&n>=-90&&n<=90,`invalid latitude`);let r=t*bp,i=n*bp;return[Sp*(r+vp)/(2*vp),Sp*(vp+Math.log(Math.tan(yp+i*.5)))/(2*vp)]}function Op(e){let[t,n]=e,r=t/Sp*(2*vp)-vp,i=2*(Math.atan(Math.exp(n/Sp*(2*vp)-vp))-yp);return[r*xp,i*xp]}function kp(e){let{latitude:t}=e;return _p(Number.isFinite(t)),Ep(Cp*Math.cos(t*bp))-9}function Ap(e){let t=Math.cos(e*bp);return Sp/Cp/t}function jp(e){let{latitude:t,longitude:n,highPrecision:r=!1}=e;_p(Number.isFinite(t)&&Number.isFinite(n));let i=Sp,a=Math.cos(t*bp),o=i/360,s=o/a,c=i/Cp/a,l={unitsPerMeter:[c,c,c],metersPerUnit:[1/c,1/c,1/c],unitsPerDegree:[o,s,c],degreesPerUnit:[1/o,1/s,1/c]};if(r){let e=bp*Math.tan(t*bp)/a,n=o*e/2,r=i/Cp*e,u=r/s*c;l.unitsPerDegree2=[0,n,r],l.unitsPerMeter2=[u,0,u]}return l}function Mp(e,t){let[n,r,i]=e,[a,o,s]=t,{unitsPerMeter:c,unitsPerMeter2:l}=jp({longitude:n,latitude:r,highPrecision:!0}),u=Dp(e);u[0]+=a*(c[0]+l[0]*o),u[1]+=o*(c[1]+l[1]*o);let d=Op(u),f=(i||0)+(s||0);return Number.isFinite(i)||Number.isFinite(s)?[d[0],d[1],f]:d}function Np(e){let{height:t,pitch:n,bearing:r,altitude:i,scale:a,center:o}=e,s=fp();ap(s,s,[0,0,-i]),sp(s,s,-n*bp),cp(s,s,r*bp);let c=a/t;return op(s,s,[c,c,c]),o&&ap(s,s,ip([],o)),s}function Pp(e){let{width:t,height:n,altitude:r,pitch:i=0,offset:a,center:o,scale:s,nearZMultiplier:c=1,farZMultiplier:l=1}=e,{fovy:u=Fp(Tp)}=e;r!==void 0&&(u=Fp(r));let d=u*bp,f=i*bp,p=Ip(u),m=p;o&&(m+=o[2]*s/Math.cos(f)/n);let h=d*(.5+(a?a[1]:0)/n),g=Math.sin(h)*m/Math.sin(mp(Math.PI/2-f-h,.01,Math.PI-.01)),_=Math.sin(f)*g+m,v=m*10,y=Math.min(_*l,v);return{fov:d,aspect:t/n,focalDistance:p,near:c,far:y}}function Fp(e){return 2*Math.atan(.5/e)*xp}function Ip(e){return .5/Math.tan(.5*e*bp)}function Lp(e,t){let[n,r,i=0]=e;return _p(Number.isFinite(n)&&Number.isFinite(r)&&Number.isFinite(i)),pp(t,[n,r,i,1])}function Rp(e,t,n=0){let[r,i,a]=e;if(_p(Number.isFinite(r)&&Number.isFinite(i),`invalid pixel coordinate`),Number.isFinite(a))return pp(t,[r,i,a,1]);let o=pp(t,[r,i,0,1]),s=pp(t,[r,i,1,1]),c=o[2],l=s[2];return np([],o,s,c===l?0:((n||0)-c)/(l-c))}function zp(e){let{width:t,height:n,bounds:r,minExtent:i=0,maxZoom:a=24,offset:o=[0,0]}=e,[[s,c],[l,u]]=r,d=Bp(e.padding),f=Dp([s,mp(u,-wp,wp)]),p=Dp([l,mp(c,-wp,wp)]),m=[Math.max(Math.abs(p[0]-f[0]),i),Math.max(Math.abs(p[1]-f[1]),i)],h=[t-d.left-d.right-Math.abs(o[0])*2,n-d.top-d.bottom-Math.abs(o[1])*2];_p(h[0]>0&&h[1]>0);let g=h[0]/m[0],_=h[1]/m[1],v=(d.right-d.left)/2/g,y=(d.top-d.bottom)/2/_,b=Op([(p[0]+f[0])/2+v,(p[1]+f[1])/2+y]),x=Math.min(a,gp(Math.abs(Math.min(g,_))));return _p(Number.isFinite(x)),{longitude:b[0],latitude:b[1],zoom:x}}function Bp(e=0){return typeof e==`number`?{top:e,bottom:e,left:e,right:e}:(_p(Number.isFinite(e.top)&&Number.isFinite(e.bottom)&&Number.isFinite(e.left)&&Number.isFinite(e.right)),e)}var Vp=Math.PI/180;function Hp(e,t=0){let{width:n,height:r,unproject:i}=e,a={targetZ:t},o=i([0,r],a),s=i([n,r],a),c,l;return(e.fovy?.5*e.fovy*Vp:Math.atan(.5/e.altitude))>(90-e.pitch)*Vp-.01?(c=Up(e,0,t),l=Up(e,n,t)):(c=i([0,0],a),l=i([n,0],a)),[o,s,l,c]}function Up(e,t,n){let{pixelUnprojectionMatrix:r}=e,i=pp(r,[t,0,1,1]),a=pp(r,[t,e.height,1,1]),o=Op(np([],i,a,(n*e.distanceScales.unitsPerMeter[2]-i[2])/(a[2]-i[2])));return o.push(n),o}var Wp=`
layout(std140) uniform shadowUniforms {
  bool drawShadowMap;
  bool useShadowMap;
  vec4 color;
  highp int lightId;
  float lightCount;
  mat4 viewProjectionMatrix0;
  mat4 viewProjectionMatrix1;
  vec4 projectCenter0;
  vec4 projectCenter1;
} shadow;
`,Gp=`
${Wp}

const int max_lights = 2;

out vec3 shadow_vPosition[max_lights];

vec4 shadow_setVertexPosition(vec4 position_commonspace) {
  mat4 viewProjectionMatrices[max_lights];
  viewProjectionMatrices[0] = shadow.viewProjectionMatrix0;
  viewProjectionMatrices[1] = shadow.viewProjectionMatrix1;
  vec4 projectCenters[max_lights];
  projectCenters[0] = shadow.projectCenter0;
  projectCenters[1] = shadow.projectCenter1;

  if (shadow.drawShadowMap) {
    return project_common_position_to_clipspace(position_commonspace, viewProjectionMatrices[shadow.lightId], projectCenters[shadow.lightId]);
  }
  if (shadow.useShadowMap) {
    for (int i = 0; i < max_lights; i++) {
      if(i < int(shadow.lightCount)) {
        vec4 shadowMap_position = project_common_position_to_clipspace(position_commonspace, viewProjectionMatrices[i], projectCenters[i]);
        shadow_vPosition[i] = (shadowMap_position.xyz / shadowMap_position.w + 1.0) / 2.0;
      }
    }
  }
  return gl_Position;
}

`,Kp=`
${Wp}

const int max_lights = 2;
uniform sampler2D shadow_uShadowMap0;
uniform sampler2D shadow_uShadowMap1;

in vec3 shadow_vPosition[max_lights];

const vec4 bitPackShift = vec4(1.0, 255.0, 65025.0, 16581375.0);
const vec4 bitUnpackShift = 1.0 / bitPackShift;
const vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0,  0.0);

float shadow_getShadowWeight(vec3 position, sampler2D shadowMap) {
  vec4 rgbaDepth = texture(shadowMap, position.xy);

  float z = dot(rgbaDepth, bitUnpackShift);
  return smoothstep(0.001, 0.01, position.z - z);
}

vec4 shadow_filterShadowColor(vec4 color) {
  if (shadow.drawShadowMap) {
    vec4 rgbaDepth = fract(gl_FragCoord.z * bitPackShift);
    rgbaDepth -= rgbaDepth.gbaa * bitMask;
    return rgbaDepth;
  }
  if (shadow.useShadowMap) {
    float shadowAlpha = 0.0;
    shadowAlpha += shadow_getShadowWeight(shadow_vPosition[0], shadow_uShadowMap0);
    if(shadow.lightCount > 1.0) {
      shadowAlpha += shadow_getShadowWeight(shadow_vPosition[1], shadow_uShadowMap1);
    }
    shadowAlpha *= shadow.color.a / shadow.lightCount;
    float blendedAlpha = shadowAlpha + color.a * (1.0 - shadowAlpha);

    return vec4(
      mix(color.rgb, shadow.color.rgb, shadowAlpha / blendedAlpha),
      blendedAlpha
    );
  }
  return color;
}

`,qp=Ff(Qp),Jp=Ff($p),Yp=[0,0,0,1],Xp=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0];function Zp(e,t){let[n,r,i]=e,a=Rp([n,r,i],t);return Number.isFinite(i)?a:[a[0],a[1],0]}function Qp({viewport:e,center:t}){return new z(e.viewProjectionMatrix).invert().transform(t)}function $p({viewport:e,shadowMatrices:t}){let n=[],r=e.pixelUnprojectionMatrix,i=e.isGeospatial?void 0:1,a=[[0,0,i],[e.width,0,i],[0,e.height,i],[e.width,e.height,i],[0,0,-1],[e.width,0,-1],[0,e.height,-1],[e.width,e.height,-1]].map(e=>Zp(e,r));for(let r of t){let t=r.clone().translate(new R(e.center).negate()),i=a.map(e=>t.transform(e)),o=new z().ortho({left:Math.min(...i.map(e=>e[0])),right:Math.max(...i.map(e=>e[0])),bottom:Math.min(...i.map(e=>e[1])),top:Math.max(...i.map(e=>e[1])),near:Math.min(...i.map(e=>-e[2])),far:Math.max(...i.map(e=>-e[2]))});n.push(o.multiplyRight(r))}return n}function em(e){let{shadowEnabled:t=!0,project:n}=e;if(!t||!n||!e.shadowMatrices||!e.shadowMatrices.length)return{drawShadowMap:!1,useShadowMap:!1,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};let r=Qf.getUniforms(n),i=qp({viewport:n.viewport,center:r.center}),a=[],o=Jp({shadowMatrices:e.shadowMatrices,viewport:n.viewport}).slice();for(let t=0;t<e.shadowMatrices.length;t++){let e=o[t],s=e.clone().translate(new R(n.viewport.center).negate());r.coordinateSystem===Hf(`lnglat`)&&r.projectionMode===U.WEB_MERCATOR?(o[t]=s,a[t]=i):(o[t]=e.clone().multiplyRight(Xp),a[t]=s.transform(i))}let s={drawShadowMap:!!e.drawToShadowMap,useShadowMap:e.shadowMaps?e.shadowMaps.length>0:!1,color:e.shadowColor||Yp,lightId:e.shadowLightId||0,lightCount:e.shadowMatrices.length,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};for(let e=0;e<o.length;e++)s[`viewProjectionMatrix${e}`]=o[e],s[`projectCenter${e}`]=a[e];for(let t=0;t<2;t++)s[`shadow_uShadowMap${t}`]=e.shadowMaps&&e.shadowMaps[t]||e.dummyShadowMap;return s}var tm={name:`shadow`,dependencies:[Qf],vs:Gp,fs:Kp,inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    position = shadow_setVertexPosition(geometry.position);
    `,"fs:DECKGL_FILTER_COLOR":`
    color = shadow_filterShadowColor(color);
    `},getUniforms:em,uniformTypes:{drawShadowMap:`f32`,useShadowMap:`f32`,color:`vec4<f32>`,lightId:`i32`,lightCount:`f32`,viewProjectionMatrix0:`mat4x4<f32>`,viewProjectionMatrix1:`mat4x4<f32>`,projectCenter0:`vec4<f32>`,projectCenter1:`vec4<f32>`}},nm=16777215;function rm(e,t){e.length===10?N.warn(`pickMultipleObjects can only exclude 10 previously picked objects for layers without picking buffers`)():e.push(t)}var im=`  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function am(e){return e.replace(`  vec4 highlightColor;
} picking;`,`  vec4 highlightColor;\n${im}} picking;`)}function om(e,t){return[e[t]||0,e[t+1]||0,e[t+2]||0,e[t+3]||0]}var sm=`\
vec3 picking_getPickingColorFromIndex(float objectIndex) {
  if (objectIndex < 0.0 || objectIndex >= ${nm}.0) {
    return vec3(0.0);
  }

  for (int i = 0; i < 10; i++) {
    if (float(i) >= picking.disabledPickingIndexCount) {
      break;
    }
    vec4 disabledIndices = i < 4
      ? picking.disabledPickingIndices0
      : (i < 8 ? picking.disabledPickingIndices1 : picking.disabledPickingIndices2);
    float disabledIndex = disabledIndices[i - (i / 4) * 4];
    if (disabledIndex == objectIndex) {
      return vec3(0.0);
    }
  }

  float encodedIndex = objectIndex + 1.0;
  return vec3(
    mod(encodedIndex, 256.0),
    mod(floor(encodedIndex / 256.0), 256.0),
    mod(floor(encodedIndex / 65536.0), 256.0)
  );
}

vec3 picking_getPickingColorFromIndex(uint objectIndex) {
  return picking_getPickingColorFromIndex(float(objectIndex));
}

vec3 picking_getPickingColorFromInstanceID() {
  return picking_getPickingColorFromIndex(float(gl_InstanceID));
}

void picking_setPickingColorFromInstanceID() {
  picking_setPickingColor(picking_getPickingColorFromInstanceID());
}
`,cm=`\
struct pickingUniforms {
  isActive: f32,
  isAttribute: f32,
  isHighlightActive: f32,
  useByteColors: f32,
  highlightedObjectColor: vec3<f32>,
  highlightColor: vec4<f32>,
  disabledPickingIndexCount: f32,
  disabledPickingIndices0: vec4<f32>,
  disabledPickingIndices1: vec4<f32>,
  disabledPickingIndices2: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> picking: pickingUniforms;

fn picking_normalizeColor(color: vec3<f32>) -> vec3<f32> {
  return select(color, color / 255.0, picking.useByteColors > 0.5);
}

fn picking_normalizeColor4(color: vec4<f32>) -> vec4<f32> {
  return select(color, color / 255.0, picking.useByteColors > 0.5);
}

fn picking_isColorZero(color: vec3<f32>) -> bool {
  return dot(color, vec3<f32>(1.0)) < 0.00001;
}

fn picking_isColorValid(color: vec3<f32>) -> bool {
  return dot(color, vec3<f32>(1.0)) > 0.00001;
}

fn picking_getPickingColorFromIndex(objectIndex: u32) -> vec3<f32> {
  if (objectIndex >= ${nm}u) {
    return vec3<f32>(0.0);
  }

  for (var i = 0; i < 10; i = i + 1) {
    if (f32(i) >= picking.disabledPickingIndexCount) {
      break;
    }
    let disabledIndices = select(
      picking.disabledPickingIndices2,
      select(picking.disabledPickingIndices1, picking.disabledPickingIndices0, i < 4),
      i < 8
    );
    let disabledIndex = disabledIndices[i % 4];
    if (disabledIndex == f32(objectIndex)) {
      return vec3<f32>(0.0);
    }
  }

  let encodedIndex = objectIndex + 1u;
  return vec3<f32>(
    f32(encodedIndex % 256u),
    f32((encodedIndex / 256u) % 256u),
    f32((encodedIndex / 65536u) % 256u)
  ) / 255.0;
}
`,lm={...xl,vs:`${am(xl.vs)}\n${sm}`,fs:am(xl.fs),source:cm,uniformTypes:{...xl.uniformTypes,disabledPickingIndexCount:`f32`,disabledPickingIndices0:`vec4<f32>`,disabledPickingIndices1:`vec4<f32>`,disabledPickingIndices2:`vec4<f32>`},defaultUniforms:{...xl.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(e,t){let n=xl.getUniforms(e,t),r=e.disabledPickingIndices||[];return n.disabledPickingIndexCount=r.length,n.disabledPickingIndices0=om(r,0),n.disabledPickingIndices1=om(r,4),n.disabledPickingIndices2=om(r,8),n},inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `,"vs:DECKGL_FILTER_COLOR":`
  picking_setPickingColor(geometry.pickingColor);
  `,"fs:DECKGL_FILTER_COLOR":{order:99,injection:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}}},um=[Ol],dm=[`vs:DECKGL_FILTER_SIZE(inout vec3 size, VertexGeometry geometry)`,`vs:DECKGL_FILTER_GL_POSITION(inout vec4 position, VertexGeometry geometry)`,`vs:DECKGL_FILTER_COLOR(inout vec4 color, VertexGeometry geometry)`,`fs:DECKGL_FILTER_COLOR(inout vec4 color, FragmentGeometry geometry)`],fm=[];function pm(e){let t=ll.getDefaultShaderAssembler(e);for(let e of um)t.addDefaultModule(e);t._hookFunctions.length=0;let n=e===`glsl`?dm:fm;for(let e of n)t.addShaderHook(e);return t}var mm=[255,255,255],hm=1,gm=0,_m=class{constructor(e={}){this.type=`ambient`;let{color:t=mm}=e,{intensity:n=hm}=e;this.id=e.id||`ambient-${gm++}`,this.color=t,this.intensity=n}},vm=[255,255,255],ym=1,bm=[0,0,-1],xm=0,Sm=class{constructor(e={}){this.type=`directional`;let{color:t=vm}=e,{intensity:n=ym}=e,{direction:r=bm}=e,{_shadow:i=!1}=e;this.id=e.id||`directional-${xm++}`,this.color=t,this.intensity=n,this.type=`directional`,this.direction=new R(r).normalize().toArray(),this.shadow=i}getProjectedLight(e){return this}},Cm=class{constructor(e,t={id:`pass`}){let{id:n}=t;this.id=n,this.device=e,this.props={...t}}setProps(e){Object.assign(this.props,e)}render(e){}cleanup(){}},wm={depthWriteEnabled:!0,depthCompare:`less-equal`,blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaOperation:`add`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`},Tm=class extends Cm{constructor(){super(...arguments),this._lastRenderIndex=-1}render(e){this._render(e)}_render(e){let{canvasContext:t=this.device.canvasContext}=e,n=e.target??t.getCurrentFramebuffer(),[r,i]=t.getDrawingBufferSize(),a=e.clearCanvas??!0,o=e.clearColor??(a?[0,0,0,0]:!1),s=a?1:!1,c=a?0:!1,l=e.colorMask??15,u={viewport:[0,0,r,i]};e.colorMask&&(u.colorMask=l),e.scissorRect&&(u.scissorRect=e.scissorRect);let{shaderModuleProps:d,viewports:f,views:p,onViewportActive:m,clearStack:h=!0}=e,g=e.pass||`unknown`,_=this.device.type===`webgpu`;h&&(this._lastRenderIndex=-1);let v=[];if(!f.length)return this.device.beginRenderPass({framebuffer:n,parameters:u,clearColor:o,clearDepth:s,clearStencil:c}).end(),this.device.submit(),v;try{for(let r of f){m?.(r);let i=this._getDrawLayerParams(r,e),a=p&&p[r.id],l=r.subViewports||[r],f=_?l.map(e=>[e]):[l];for(let r of f){let l=this.device.beginRenderPass({framebuffer:n,parameters:u,clearColor:o,clearDepth:s,clearStencil:c});try{for(let o of r){let r=this._drawLayersInViewport(l,{target:n,canvasContext:t,shaderModuleProps:d,viewport:o,view:a,pass:g,layers:e.layers,isPicking:e.isPicking},i);v.push(r)}}finally{l.end(),_&&this.device.submit()}o=!1,s=!1,c=!1}}return v}finally{_||this.device.submit()}}_getDrawLayerParams(e,{layers:t,pass:n,isPicking:r=!1,layerFilter:i,cullRect:a,views:o,effects:s,canvasContext:c=this.device.canvasContext,shaderModuleProps:l},u=!1){let d=[],f=Em(this._lastRenderIndex+1),p={layer:t[0],viewport:e,isPicking:r,renderPass:n,cullRect:a},m={};for(let r=0;r<t.length;r++){let a=t[r],h=this._shouldDrawLayer(a,p,i,m),g={shouldDrawLayer:h};h&&!u&&(g.shouldDrawLayer=!0,g.layerRenderIndex=f(a,h),g.shaderModuleProps=this._getShaderModuleProps(a,s,n,c,l),g.layerParameters={...a.context.device.type===`webgpu`?wm:null,...a.context.deck?.props.parameters,...o?.[e.id]?.props.parameters,...this.getLayerParameters(a,r,e)}),d[r]=g}return d}_drawLayersInViewport(e,{layers:t,shaderModuleProps:n,pass:r,target:i,canvasContext:a,viewport:o,view:s,isPicking:c},l){let u=Dm(this.device,{canvasContext:a,shaderModuleProps:n,target:i,viewport:o});if(s){let{clear:e,clearColor:t,clearDepth:n,clearStencil:r}=s.props;if(e){let e=[0,0,0,0],a=1,o=0;Array.isArray(t)&&!c?e=[...t.slice(0,3),t[3]||255].map(e=>e/255):t===!1&&(e=!1),n!==void 0&&(a=n),r!==void 0&&(o=r),this.device.beginRenderPass({framebuffer:i,parameters:{viewport:u,scissorRect:u},clearColor:e,clearDepth:a,clearStencil:o}).end()}}let d={totalCount:t.length,visibleCount:0,compositeCount:0,pickableCount:0};e.setParameters({viewport:u});for(let n=0;n<t.length;n++){let i=t[n],a=l[n],{shouldDrawLayer:s}=a;if(s&&i.props.pickable&&d.pickableCount++,i.isComposite&&d.compositeCount++,i.isDrawable&&a.shouldDrawLayer){let{layerRenderIndex:t,shaderModuleProps:n,layerParameters:s}=a;d.visibleCount++,this._lastRenderIndex=Math.max(this._lastRenderIndex,t),n.project&&(n.project.viewport=o),i.context.renderPass=e;try{i._drawLayer({renderPass:e,shaderModuleProps:n,uniforms:{layerIndex:t},parameters:s})}catch(e){i.raiseError(e,`drawing ${i} to ${r}`)}}}return d}shouldDrawLayer(e){return!0}getShaderModuleProps(e,t,n){return null}getLayerParameters(e,t,n){return e.props.parameters}_shouldDrawLayer(e,t,n,r){if(!(e.props.visible&&this.shouldDrawLayer(e)))return!1;t.layer=e;let i=e.parent;for(;i;){if(!i.props.visible||!i.filterSubLayer(t))return!1;t.layer=i,i=i.parent}if(n){let e=t.layer.id;if(e in r||(r[e]=n(t)),!r[e])return!1}return e.activateViewport(t.viewport),!0}_getShaderModuleProps(e,t,n,r,i){let a=r.cssToDeviceRatio(),o=e.internalState?.propsInTransition||e.props,s={layer:o,picking:{isActive:!1},project:{viewport:e.context.viewport,devicePixelRatio:a,modelMatrix:o.modelMatrix,coordinateSystem:o.coordinateSystem,coordinateOrigin:o.coordinateOrigin,autoWrapLongitude:e.wrapLongitude}};if(t)for(let n of t)Om(s,n.getShaderModuleProps?.(e,s));for(let t of e.context.defaultShaderModules)t.name in s||(s[t.name]={});return Om(s,this.getShaderModuleProps(e,t,s),i)}};function Em(e=0,t={}){let n={},r=(i,a)=>{let o=i.props._offset,s=i.id,c=i.parent&&i.parent.id,l;if(c&&!(c in t)&&r(i.parent,!1),c in n){let e=n[c]=n[c]||Em(t[c],t);l=e(i,a),n[s]=e}else Number.isFinite(o)?(l=o+(t[c]||0),n[s]=null):l=e;return a&&l>=e&&(e=l+1),t[s]=l,l};return r}function Dm(e,{canvasContext:t=e.canvasContext,shaderModuleProps:n,target:r,viewport:i}){let a=n?.project?.devicePixelRatio??t.cssToDeviceRatio(),[,o]=t.getDrawingBufferSize(),s=r?r.height:o,c=i;return[c.x*a,e.type===`webgpu`?c.y*a:s-(c.y+c.height)*a,c.width*a,c.height*a]}function Om(e,...t){for(let n of t)if(n)for(let t in n)e[t]?Object.assign(e[t],n[t]):e[t]=n[t];return e}var km=class extends Tm{constructor(e,t){super(e,t);let n=e.createTexture({format:`rgba8unorm`,width:1,height:1,sampler:{minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}),r=e.createTexture({format:`depth16unorm`,width:1,height:1});this.fbo=e.createFramebuffer({id:`shadowmap`,width:1,height:1,colorAttachments:[n],depthStencilAttachment:r})}delete(){this.fbo&&=(this.fbo.destroy(),null)}getShadowMap(){return this.fbo.colorAttachments[0].texture}render(e){let t=this.fbo,n=this.device.canvasContext.cssToDeviceRatio(),r=e.viewports[0],i=r.width*n,a=r.height*n,o=[1,1,1,1];(i!==t.width||a!==t.height)&&t.resize({width:i,height:a}),super.render({...e,clearColor:o,target:t,pass:`shadow`})}getLayerParameters(e,t,n){return{...e.props.parameters,blend:!1,depthWriteEnabled:!0,depthCompare:`less-equal`}}shouldDrawLayer(e){return e.props.shadowEnabled!==!1}getShaderModuleProps(e,t,n){return{shadow:{project:n.project,drawToShadowMap:!0}}}},Am={color:[255,255,255],intensity:1},jm=[{color:[255,255,255],intensity:1,direction:[-1,3,-1]},{color:[255,255,255],intensity:.9,direction:[1,-8,-2.5]}],Mm=[0,0,0,200/255],Nm=class{constructor(e={}){this.id=`lighting-effect`,this.shadowColor=Mm,this.shadow=!1,this.directionalLights=[],this.pointLights=[],this.shadowPasses=[],this.dummyShadowMap=null,this.setProps(e)}setup(e){this.context=e;let{device:t,deck:n}=e;this.shadow&&!this.dummyShadowMap&&(this._createShadowPasses(t),n._addDefaultShaderModule(tm),this.dummyShadowMap=t.createTexture({width:1,height:1}))}setProps(e){this.ambientLight=void 0,this.directionalLights=[],this.pointLights=[];for(let t in e){let n=e[t];switch(n.type){case`ambient`:this.ambientLight=n;break;case`directional`:this.directionalLights.push(n);break;case`point`:this.pointLights.push(n);break;default:}}this._applyDefaultLights(),this.shadow=this.directionalLights.some(e=>e.shadow),this.context&&this.setup(this.context),this.props=e}preRender({layers:e,layerFilter:t,viewports:n,onViewportActive:r,views:i}){if(this.shadow){this.shadowMatrices=this._calculateMatrices();for(let a=0;a<this.shadowPasses.length;a++)this.shadowPasses[a].render({layers:e,layerFilter:t,viewports:n,onViewportActive:r,views:i,shaderModuleProps:{shadow:{shadowLightId:a,dummyShadowMap:this.dummyShadowMap,shadowMatrices:this.shadowMatrices}}})}}getShaderModuleProps(e,t){let n=this.shadow?{project:t.project,shadowMaps:this.shadowPasses.map(e=>e.getShadowMap()),dummyShadowMap:this.dummyShadowMap,shadowColor:this.shadowColor,shadowMatrices:this.shadowMatrices}:{},r={enabled:!0,lights:this._getLights(e)},i=e.props.material;return{shadow:n,lighting:r,phongMaterial:i,gouraudMaterial:i}}cleanup(e){for(let e of this.shadowPasses)e.delete();this.shadowPasses.length=0,this.dummyShadowMap&&(this.dummyShadowMap.destroy(),this.dummyShadowMap=null,e.deck._removeDefaultShaderModule(tm))}_calculateMatrices(){let e=[];for(let t of this.directionalLights){let n=new z().lookAt({eye:new R(t.direction).negate()});e.push(n)}return e}_createShadowPasses(e){for(let t=0;t<this.directionalLights.length;t++){let n=new km(e);this.shadowPasses[t]=n}}_applyDefaultLights(){let{ambientLight:e,pointLights:t,directionalLights:n}=this;!e&&t.length===0&&n.length===0&&(this.ambientLight=new _m(Am),this.directionalLights.push(new Sm(jm[0]),new Sm(jm[1])))}_getLights(e){let t=[];this.ambientLight&&t.push(this.ambientLight);for(let n of this.pointLights)t.push(n.getProjectedLight({layer:e}));for(let n of this.directionalLights)t.push(n.getProjectedLight({layer:e}));return t}},Pm=new class{constructor(e={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(e)}setOptions(e){Object.assign(this.opts,e)}allocate(e,t,{size:n=1,type:r,padding:i=0,copy:a=!1,initialize:o=!1,maxCount:s}){let c=r||e&&e.constructor||Float32Array,l=t*n+i;if(ArrayBuffer.isView(e)){if(l<=e.length)return e;if(l*e.BYTES_PER_ELEMENT<=e.buffer.byteLength)return new c(e.buffer,0,l)}let u=1/0;s&&(u=s*n+i);let d=this._allocate(c,l,o,u);return e&&a?d.set(e):o||d.fill(0,0,4),this._release(e),d}release(e){this._release(e)}_allocate(e,t,n,r){let i=Math.max(Math.ceil(t*this.opts.overAlloc),1);i>r&&(i=r);let a=this._pool,o=e.BYTES_PER_ELEMENT*i,s=a.findIndex(e=>e.byteLength>=o);if(s>=0){let t=new e(a.splice(s,1)[0],0,i);return n&&t.fill(0),t}return new e(i)}_release(e){if(!ArrayBuffer.isView(e))return;let t=this._pool,{buffer:n}=e,{byteLength:r}=n,i=t.findIndex(e=>e.byteLength>=r);i<0?t.push(n):(i>0||t.length<this.opts.poolSize)&&t.splice(i,0,n),t.length>this.opts.poolSize&&t.shift()}};function Fm(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function Im(e,t){let n=e%t;return n<0?t+n:n}function Lm(e){return[e[12],e[13],e[14]]}function Rm(e){return{left:Bm(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),right:Bm(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),bottom:Bm(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),top:Bm(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),near:Bm(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),far:Bm(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14])}}var zm=new R;function Bm(e,t,n,r){zm.set(e,t,n);let i=zm.len();return{distance:r/i,normal:new R(-e/i,-t/i,-n/i)}}function Vm(e){return e-Math.fround(e)}var Hm;function Um(e,t){let{size:n=1,startIndex:r=0}=t,i=t.endIndex===void 0?e.length:t.endIndex,a=(i-r)/n;Hm=Pm.allocate(Hm,a,{type:Float32Array,size:n*2});let o=r,s=0;for(;o<i;){for(let t=0;t<n;t++){let r=e[o++];Hm[s+t]=r,Hm[s+t+n]=Vm(r)}s+=n*2}return Hm.subarray(0,a*n*2)}function Wm(e){let t=null,n=!1;for(let r of e)r&&(t?(n||=(t=[[t[0][0],t[0][1]],[t[1][0],t[1][1]]],!0),t[0][0]=Math.min(t[0][0],r[0][0]),t[0][1]=Math.min(t[0][1],r[0][1]),t[1][0]=Math.max(t[1][0],r[1][0]),t[1][1]=Math.max(t[1][1],r[1][1])):t=r);return t}var Gm=Math.PI/180,Km=Fm(),qm=[0,0,0],Jm={unitsPerMeter:[1,1,1],metersPerUnit:[1,1,1]};function Ym({width:e,height:t,orthographic:n,fovyRadians:r,focalDistance:i,padding:a,near:o,far:s}){let c=e/t,l=n?new z().orthographic({fovy:r,aspect:c,focalDistance:i,near:o,far:s}):new z().perspective({fovy:r,aspect:c,near:o,far:s});if(a){let{left:n=0,right:r=0,top:i=0,bottom:o=0}=a,s=Ml((n+e-r)/2,0,e)-e/2,c=Ml((i+t-o)/2,0,t)-t/2;l[8]-=s*2/e,l[9]+=c*2/t}return l}var Xm=class e{constructor(e={}){this._frustumPlanes={},this.id=e.id||this.constructor.displayName||`viewport`,this.x=e.x||0,this.y=e.y||0,this.width=e.width||1,this.height=e.height||1,this.zoom=e.zoom||0,this.padding=e.padding,this.distanceScales=e.distanceScales||Jm,this.focalDistance=e.focalDistance||1,this.position=e.position||qm,this.modelMatrix=e.modelMatrix||null;let{longitude:t,latitude:n}=e;this.isGeospatial=Number.isFinite(n)&&Number.isFinite(t),this._initProps(e),this._initMatrices(e),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return this.distanceScales.metersPerUnit[2]/this.scale}get projectionMode(){return this.isGeospatial?this.zoom<12?U.WEB_MERCATOR:U.WEB_MERCATOR_AUTO_OFFSET:U.IDENTITY}equals(t){return t instanceof e?this===t?!0:t.width===this.width&&t.height===this.height&&t.scale===this.scale&&t.projectionMode===this.projectionMode&&t.resolution===this.resolution&&Pl(t.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&Pl(t.projectionMatrix,this.projectionMatrix)&&Pl(t.viewMatrix,this.viewMatrix):!1}project(e,{topLeft:t=!0}={}){let n=Lp(this.projectPosition(e),this.pixelProjectionMatrix),[r,i]=n,a=t?i:this.height-i;return e.length===2?[r,a]:[r,a,n[2]]}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[r,i,a]=e,o=t?i:this.height-i,s=n&&n*this.distanceScales.unitsPerMeter[2],c=Rp([r,o,a],this.pixelUnprojectionMatrix,s),[l,u,d]=this.unprojectPosition(c);return Number.isFinite(a)?[l,u,d]:Number.isFinite(n)?[l,u,n]:[l,u]}projectPosition(e){let[t,n]=this.projectFlat(e);return[t,n,(e[2]||0)*this.distanceScales.unitsPerMeter[2]]}unprojectPosition(e){let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)*this.distanceScales.metersPerUnit[2]]}projectFlat(e){if(this.isGeospatial){let t=Dp(e);return t[1]=Ml(t[1],-318,830),t}return e}unprojectFlat(e){return this.isGeospatial?Op(e):e}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,0],t),r=this.unproject([this.width,0],t),i=this.unproject([0,this.height],t),a=this.unproject([this.width,this.height],t);return[Math.min(n[0],r[0],i[0],a[0]),Math.min(n[1],r[1],i[1],a[1]),Math.max(n[0],r[0],i[0],a[0]),Math.max(n[1],r[1],i[1],a[1])]}getDistanceScales(e){return e&&this.isGeospatial?jp({longitude:e[0],latitude:e[1],highPrecision:!0}):this.distanceScales}containsPixel({x:e,y:t,width:n=1,height:r=1}){return e<this.x+this.width&&this.x<e+n&&t<this.y+this.height&&this.y<t+r}getFrustumPlanes(){return this._frustumPlanes.near||Object.assign(this._frustumPlanes,Rm(this.viewProjectionMatrix)),this._frustumPlanes}panByPosition(e,t,n){return null}_initProps(e){let t=e.longitude,n=e.latitude;this.isGeospatial&&(Number.isFinite(e.zoom)||(this.zoom=kp({latitude:n})+Math.log2(this.focalDistance)),this.distanceScales=e.distanceScales||jp({latitude:n,longitude:t})),this.scale=2**this.zoom;let{position:r,modelMatrix:i}=e,a=qm;if(r&&(a=i?new z(i).transformAsVector(r,[]):r),this.isGeospatial){let e=this.projectPosition([t,n,0]);this.center=new R(a).scale(this.distanceScales.unitsPerMeter).add(e)}else this.center=this.projectPosition(a)}_initMatrices(e){let{viewMatrix:t=Km,projectionMatrix:n=null,orthographic:r=!1,fovyRadians:i,fovy:a=75,near:o=.1,far:s=1e3,padding:c=null,focalDistance:l=1}=e;this.viewMatrixUncentered=t,this.viewMatrix=new z().multiplyRight(t).translate(new R(this.center).negate()),this.projectionMatrix=n||Ym({width:this.width,height:this.height,orthographic:r,fovyRadians:i||a*Gm,focalDistance:l,padding:c,near:o,far:s});let u=Fm();hu(u,u,this.projectionMatrix),hu(u,u,this.viewMatrix),this.viewProjectionMatrix=u,this.viewMatrixInverse=pu([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=Lm(this.viewMatrixInverse);let d=Fm(),f=Fm();_u(d,d,[this.width/2,-this.height/2,1]),gu(d,d,[1,-1,0]),hu(f,d,this.viewProjectionMatrix),this.pixelProjectionMatrix=f,this.pixelUnprojectionMatrix=pu(Fm(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||N.warn(`Pixel project matrix not invertible`)()}};Xm.displayName=`Viewport`;var Zm=class e extends Xm{constructor(e={}){let{latitude:t=0,longitude:n=0,zoom:r=0,pitch:i=0,bearing:a=0,nearZMultiplier:o=.1,farZMultiplier:s=1.01,nearZ:c,farZ:l,orthographic:u=!1,projectionMatrix:d,repeat:f=!1,worldOffset:p=0,position:m,padding:h,legacyMeterSizes:g=!1}=e,{width:_,height:v,altitude:y=1.5}=e,b=2**r;_||=1,v||=1;let x,S=null;if(d)y=d[5]/2,x=Fp(y);else{e.fovy?(x=e.fovy,y=Ip(x)):x=Fp(y);let n;if(h){let{top:e=0,bottom:t=0}=h;n=[0,Ml((e+v-t)/2,0,v)-v/2]}S=Pp({width:_,height:v,scale:b,center:m&&[0,0,m[2]*Ap(t)],offset:n,pitch:i,fovy:x,nearZMultiplier:o,farZMultiplier:s}),Number.isFinite(c)&&(S.near=c),Number.isFinite(l)&&(S.far=l)}let C=Np({height:v,pitch:i,bearing:a,scale:b,altitude:y});p&&(C=new z().translate([512*p,0,0]).multiplyLeft(C)),super({...e,width:_,height:v,viewMatrix:C,longitude:n,latitude:t,zoom:r,...S,fovy:x,focalDistance:y}),this.latitude=t,this.longitude=n,this.zoom=r,this.pitch=i,this.bearing=a,this.altitude=y,this.fovy=x,this.orthographic=u,this._subViewports=f?[]:null,this._pseudoMeters=g,Object.freeze(this)}get subViewports(){if(this._subViewports&&!this._subViewports.length){let t=this.getBounds(),n=Math.floor((t[0]+180)/360),r=Math.ceil((t[2]-180)/360);for(let t=n;t<=r;t++){let n=t?new e({...this,worldOffset:t}):this;this._subViewports.push(n)}}return this._subViewports}equals(t){return t instanceof e&&t._pseudoMeters===this._pseudoMeters&&super.equals(t)}projectPosition(e){if(this._pseudoMeters)return super.projectPosition(e);let[t,n]=this.projectFlat(e);return[t,n,(e[2]||0)*Ap(e[1])]}unprojectPosition(e){if(this._pseudoMeters)return super.unprojectPosition(e);let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)/Ap(n)]}addMetersToLngLat(e,t){return Mp(e,t)}panByPosition(e,t,n){let r=Rp(t,this.pixelUnprojectionMatrix),i=Wl([],this.projectFlat(e),Kl([],r)),a=Wl([],this.center,i),[o,s]=this.unprojectFlat(a);return{longitude:o,latitude:s}}panByPosition3D(e,t){let n=e[2]||0,r=Jl([],e,this.unproject(t,{targetZ:n}));return{longitude:this.longitude+r[0],latitude:this.latitude+r[1]}}getBounds(e={}){let t=Hp(this,e.z||0);return[Math.min(t[0][0],t[1][0],t[2][0],t[3][0]),Math.min(t[0][1],t[1][1],t[2][1],t[3][1]),Math.max(t[0][0],t[1][0],t[2][0],t[3][0]),Math.max(t[0][1],t[1][1],t[2][1],t[3][1])]}fitBounds(t,n={}){let{width:r,height:i}=this,{longitude:a,latitude:o,zoom:s}=zp({width:r,height:i,bounds:t,...n});return new e({width:r,height:i,longitude:a,latitude:o,zoom:s})}};Zm.displayName=`WebMercatorViewport`;var Qm=[0,0,0];function $m(e,t,n=!1){let r=t.projectPosition(e);if(n&&t instanceof Zm){let[n,i,a=0]=e;r[2]=a*t.getDistanceScales([n,i]).unitsPerMeter[2]}return r}function eh(e){let{viewport:t,modelMatrix:n,coordinateOrigin:r}=e,{coordinateSystem:i,fromCoordinateSystem:a,fromCoordinateOrigin:o}=e;return i===`default`&&(i=t.isGeospatial?`lnglat`:`cartesian`),a===void 0?a=i:a===`default`&&(a=t.isGeospatial?`lnglat`:`cartesian`),o===void 0&&(o=r),{viewport:t,coordinateSystem:i,coordinateOrigin:r,modelMatrix:n,fromCoordinateSystem:a,fromCoordinateOrigin:o}}function th(e,{viewport:t,modelMatrix:n,coordinateSystem:r,coordinateOrigin:i,offsetMode:a}){let[o,s,c=0]=e;switch(n&&([o,s,c]=Au([],[o,s,c,1],n)),r){case`default`:return th(e,{viewport:t,modelMatrix:n,coordinateSystem:t.isGeospatial?`lnglat`:`cartesian`,coordinateOrigin:i,offsetMode:a});case`lnglat`:return $m([o,s,c],t,a);case`lnglat-offsets`:return $m([o+i[0],s+i[1],c+(i[2]||0)],t,a);case`meter-offsets`:return $m(Mp(i,[o,s,c]),t,a);case`cartesian`:return t.isGeospatial?[o+i[0],s+i[1],c+i[2]]:t.projectPosition([o,s,c]);default:throw Error(`Invalid coordinateSystem: ${r}`)}}function nh(e,t){let{viewport:n,coordinateSystem:r,coordinateOrigin:i,modelMatrix:a,fromCoordinateSystem:o,fromCoordinateOrigin:s}=eh(t),{autoOffset:c=!0}=t,{geospatialOrigin:l=Qm,shaderCoordinateOrigin:u=Qm,offsetMode:d=!1}=c?Wf(n,r,i):{},f=th(e,{viewport:n,modelMatrix:a,coordinateSystem:o,coordinateOrigin:s,offsetMode:d});return d&&cu(f,f,n.projectPosition(l||u)),f}var rh=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),Symbol.toStringTag).get;function ih(e){return ArrayBuffer.isView(e)?rh.call(e):void 0}function ah(e){let t=ih(e);return t!==void 0&&t!==`BigInt64Array`&&t!==`BigUint64Array`}var oh=0,sh=class{constructor(e){this.userData={},this.id=e.id||`geometry-${++oh}`,this.topology=e.topology,this.attributes={};let t=e.indices?ch(e.indices):void 0;for(let[n,r]of Object.entries(e.attributes||{})){let e=ch(r);if((n===`POSITION`||n===`positions`)&&(e.size||=3),n===`indices`){if(t)throw Error(`Geometry has multiple index attributes`);t=e}else this.attributes[n]=e}if(t){if(!(t.value instanceof Uint16Array||t.value instanceof Uint32Array))throw Error(`Geometry indices must be a Uint16Array or Uint32Array`);t.size=1,this.indices=t,lh(t,this.attributes)}if(this.vertexCount=e.vertexCount??uh(this.attributes,this.indices),!Number.isInteger(this.vertexCount)||this.vertexCount<0)throw Error(`Geometry vertexCount must be a non-negative integer`)}getVertexCount(){return this.vertexCount}getAttributes(){return this.indices?{indices:this.indices,...this.attributes}:this.attributes}};function ch(e){let t=ah(e)?{value:e}:{...e};if(!ah(t.value))throw Error(`Geometry attributes must contain a typed-array value`);if(t.size!==void 0&&(!Number.isInteger(t.size)||t.size<1))throw Error(`Geometry attribute size must be a positive integer`);if(t.size&&t.value.length%t.size!==0)throw Error(`Geometry attribute length must be divisible by its size`);return t}function lh(e,t){let n=-1;for(let t of e.value)n=Math.max(n,Number(t));for(let[e,r]of Object.entries(t))if(!r.constant&&r.size){let t=r.value.length/r.size;if(n>=t)throw Error(`Geometry index ${n} exceeds ${e} vertex count ${t}`)}}function uh(e,t){if(t)return t.value.length;let n=1/0;for(let t of Object.values(e))!t.constant&&t.size&&(n=Math.min(n,t.value.length/t.size));if(!Number.isFinite(n))throw Error(`Geometry has no countable attributes`);return n}var dh=class extends sh{bufferLayout;constructor(e){let t={},n=new Map;for(let[r,i]of Object.entries(e.attributes)){let e=fh(r),a=n.get(e);a&&delete t[a],n.set(e,r),t[r]=i}let r=e.indices,i=r instanceof Uint8Array?new Uint16Array(r):r&&!ArrayBuffer.isView(r)&&r.value instanceof Uint8Array?{...r,value:new Uint16Array(r.value)}:r;super({...e,attributes:t,indices:i});for(let[e,n]of Object.entries(t))!ArrayBuffer.isView(n)&&Object.isExtensible(n)&&e!==`indices`&&(Object.assign(n,this.attributes[e]),this.attributes[e]=n);this.bufferLayout=e.bufferLayout||ph(this.attributes)}};function fh(e){switch(e){case`POSITION`:return`positions`;case`NORMAL`:return`normals`;case`TEXCOORD_0`:return`texCoords`;case`TEXCOORD_1`:return`texCoords1`;case`COLOR_0`:return`colors`;default:return e}}function ph(e){let t=[];for(let[n,r]of Object.entries(e)){if(!r)continue;let{value:e,size:i,normalized:a}=r;if(i===void 0)throw Error(`Attribute ${n} is missing a size`);t.push({name:fh(n),format:u.getVertexFormatFromAttribute(e,i,a)})}return t}function mh(e,t={}){let n=t.bufferName||`geometry`;if(hh(e,n))return e;let r=t.minAttributeAlignment||4,i=gh(e,t.attributes),a=[],o=0,s=1/0;for(let[e,t]of i){if(!t)continue;if(t.constant)throw Error(`Attribute ${e} is constant`);let{value:n,size:i,normalized:c}=t;if(!ArrayBuffer.isView(n))throw Error(`Attribute ${e} is missing typed array data`);if(i===void 0)throw Error(`Attribute ${e} is missing a size`);let l=u.getVertexFormatFromAttribute(n,i,c),d=u.getVertexFormatInfo(l);o=vh(o,r),a.push({sourceName:e,attributeName:fh(e),value:n,size:i,format:l,byteOffset:o,byteLength:d.byteLength}),o+=d.byteLength;let f=n.length/i;if(!Number.isInteger(f))throw Error(`Attribute ${e} length is not divisible by size`);s=Math.min(s,f)}if(a.length===0||!Number.isFinite(s))throw Error(`Geometry ${e.id} has no interleavable attributes`);let c=vh(o,r),l=new ArrayBuffer(s*c);for(let e of a)_h(l,s,c,e);return new dh({id:e.id,topology:e.topology||`triangle-list`,vertexCount:e.vertexCount,indices:e.indices,attributes:{[n]:{value:new Uint8Array(l),size:c,byteStride:c}},bufferLayout:[{name:n,stepMode:`vertex`,byteStride:c,attributes:a.map(e=>({attribute:e.attributeName,format:e.format,byteOffset:e.byteOffset}))}]})}function hh(e,t){if(e.bufferLayout?.length!==1)return!1;let n=e.bufferLayout[0];return n.name===t&&!!n.attributes?.length&&!!e.attributes[t]}function gh(e,t){let n=new Map,r=t||Object.keys(e.attributes);for(let t of r){let r=e.attributes[t];r&&n.set(fh(t),[t,r])}return Array.from(n.values())}function _h(e,t,n,r){let i=r.value.constructor,a=i.BYTES_PER_ELEMENT;if(r.byteOffset%a!==0||n%a!==0)throw Error(`Attribute ${r.sourceName} is not aligned to its component type`);let o=new i(e),s=r.value,c=r.byteOffset/a,l=n/a;for(let e=0;e<t;e++){let t=e*r.size,n=e*l+c;for(let e=0;e<r.size;e++)o[n+e]=s[t+e]}}function vh(e,t){return Math.ceil(e/t)*t}var yh=1,bh=1,xh=class{time=0;channels=new Map;animations=new Map;playing=!1;lastEngineTime=-1;constructor(){}addChannel(e){let{delay:t=0,duration:n=1/0,rate:r=1,repeat:i=1}=e,a=yh++,o={time:0,delay:t,duration:n,rate:r,repeat:i};return this._setChannelTime(o,this.time),this.channels.set(a,o),a}removeChannel(e){this.channels.delete(e);for(let[t,n]of this.animations)n.channel===e&&this.detachAnimation(t)}isFinished(e){let t=this.channels.get(e);return t===void 0?!1:this.time>=t.delay+t.duration*t.repeat}getTime(e){if(e===void 0)return this.time;let t=this.channels.get(e);return t===void 0?-1:t.time}setTime(e){this.time=Math.max(0,e);let t=this.channels.values();for(let e of t)this._setChannelTime(e,this.time);let n=this.animations.values();for(let e of n){let{animation:t,channel:n}=e;t.setTime(this.getTime(n))}}play(){this.playing=!0}pause(){this.playing=!1,this.lastEngineTime=-1}reset(){this.setTime(0)}attachAnimation(e,t){let n=bh++;return this.animations.set(n,{animation:e,channel:t}),e.setTime(this.getTime(t)),n}detachAnimation(e){this.animations.delete(e)}update(e){this.playing&&(this.lastEngineTime===-1&&(this.lastEngineTime=e),this.setTime(this.time+(e-this.lastEngineTime)),this.lastEngineTime=e)}_setChannelTime(e,t){let n=t-e.delay;n>=e.duration*e.repeat?e.time=e.duration*e.rate:(e.time=Math.max(0,n)%e.duration,e.time*=e.rate)}};function Sh(e){let t=typeof window<`u`?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null;return t?t.call(window,e):setTimeout(()=>e(typeof performance<`u`?performance.now():Date.now()),1e3/60)}function Ch(e){let t=typeof window<`u`?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null;if(t){t.call(window,e);return}clearTimeout(e)}var wh=0,Th=`Animation Loop`,Eh={requestAnimationFrame:e=>Sh(e),cancelAnimationFrame:e=>Ch(e)},Dh=class e{static defaultAnimationLoopProps={device:null,mobileQuality:void 0,onAddHTML:()=>``,onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:Eh};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw=`initialized`;_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(t){if(this.props={...e.defaultAnimationLoopProps,...t},t=this.props,!t.device)throw Error(`No device provided`);this.stats=t.stats||new g({id:`animation-loop-${wh++}`}),this.sharedStats=wo.stats.get(Th),this.frameRate=this.stats.get(`Frame Rate`),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get(`CPU Time`),this.gpuTime=this.stats.get(`GPU Time`),this.setProps({autoResizeViewport:t.autoResizeViewport,animationFrameProvider:t.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this._stopEventHandling(),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(t){this._error=t,this.props.onError(t),this.props.onError===e.defaultAnimationLoopProps.onError&&typeof window<`u`&&typeof ErrorEvent<`u`&&window.dispatchEvent(new ErrorEvent(`error`,{error:t,message:t.message}))}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if(`autoResizeViewport`in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),`animationFrameProvider`in e){let t=e.animationFrameProvider||Eh;if(t!==this.props.animationFrameProvider){let e=this._animationFrameId!==null;e&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,e&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}return this._running?(this._cancelAnimationFrame(),this._requestAnimationFrame(),this):null}catch(e){let t=e instanceof Error?e:Error(`Unknown error`);throw this.props.onError(t),t}}stop(){if(this._running){let e=this.animationProps;this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0,e&&this.props.onFinalize(e)}return this}redraw(e,t=null){return this.device?.isLost||this._error?this:(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&=(this._resolveNextFrame(this),this._nextFramePromise=null,null),this._endFrameTimers(),this)}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw(`waitForRender`),this._nextFramePromise||=new Promise(e=>{this._resolveNextFrame=e}),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw(`toDataURL`),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw Error(`OffscreenCanvas`)}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){this._animationFrameId!==null&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){if(this._running)try{this.redraw(e,t??null),this._requestAnimationFrame()}catch(e){let t=e instanceof Error?e:Error(String(e));this.reportError(t),this.stop()}}_renderFrame(e){if(this.display){this.display._renderFrame(e);return}let t=this.props.onRender(this._getAnimationProps());this.device&&t!==!1&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw Error(`loop`);let t=e?.canvas,n=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:n,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null,mobileQuality:this.props.mobileQuality}}_getAnimationProps(){if(!this.animationProps)throw Error(`animationProps`);return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:n}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw(`drawing buffer resized`),n!==this.animationProps.aspect&&this.setNeedsRedraw(`drawing buffer aspect changed`),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=n,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw Error(`No device provided`);this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement(`div`);document.body.appendChild(e),e.style.position=`relative`;let t=document.createElement(`div`);t.style.position=`absolute`,t.style.left=`10px`,t.style.bottom=`10px`,t.style.width=`300px`,t.style.background=`white`,this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let n=this.props.onAddHTML(t);n&&(t.innerHTML=n)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize();return{width:e,height:t,aspect:e>0&&t>0?e/t:1}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??(typeof performance<`u`?performance.now():Date.now());if(this._lastFrameTime){let e=t-this._lastFrameTime;e>0&&this.frameRate.addTime(e)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;e!==void 0&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener(`mousemove`,this._onMousemove),this.canvas.addEventListener(`mouseleave`,this._onMouseleave))}_stopEventHandling(){this.canvas?.removeEventListener(`mousemove`,this._onMousemove),this.canvas?.removeEventListener(`mouseleave`,this._onMouseleave)}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}};function Oh(e=[],t){let n={modules:[],injectionTargets:[],defines:{},injections:{},vertexInputs:{},interStageVariables:{}};for(let r of e)Ah(n,r,t);let{vertexInputs:r,interStageVariables:i}=n;for(let e of Object.keys(i))if(r[e])throw Error(`ShaderPlugin name "${e}" cannot be both a vertex input and a varying`);return n}function kh(e=[],t=[],n={}){let r=[...e],i=new Map;for(let e of r){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||i.set(e.name,e)}for(let e of t){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||(r.push(e),i.set(e.name,e))}return r}function Ah(e,t,n){t.module&&e.modules.push(t.module),t.defines&&Object.assign(e.defines,t.defines);for(let[n,r]of Object.entries(t.vertexInputs||{})){jh(n,`vertex input`);let t=e.vertexInputs[n];if(t&&t!==r)throw Error(`ShaderPlugin vertex input "${n}" has conflicting types "${t}" and "${r}"`);e.vertexInputs[n]=r}for(let[n,r]of Object.entries(t.interStageVariables||{})){jh(n,`varying`);let t=Mh(n,r),i=e.interStageVariables[n];if(i&&(i.type!==t.type||i.interpolation!==t.interpolation))throw Error(`ShaderPlugin varying "${n}" has conflicting declarations "${i.type}/${i.interpolation}" and "${t.type}/${t.interpolation}"`);e.interStageVariables[n]=t}for(let r of t.injectionTargets||[]){let t=r[n];if(!t)continue;let i=`${r.stage===`vertex`?`vs`:`fs`}:${r.name}`;if(!/^(vs|fs):[A-Za-z_][A-Za-z0-9_]*$/.test(i))throw Error(`Invalid ShaderPlugin injection target ${i}`);let a=e.injectionTargets.find(e=>e.stage===r.stage&&e.name===r.name),o=a?.[n];if(o&&(o.parameters!==t.parameters||(o.returnType||`void`)!==(t.returnType||`void`)||o.header!==t.header||o.footer!==t.footer))throw Error(`Conflicting ShaderPlugin injection target ${i}`);a||e.injectionTargets.push({name:r.name,stage:r.stage,[n]:t})}let r=Ge(Array.isArray(t.injections)?t.injections:Object.entries(t.injections||{}).flatMap(([e,t])=>{let r=Nh(e,n);if(r===void 0)return[];let[i,...a]=r.split(`:`);if(i!==`vs`&&i!==`fs`)throw Error(`Invalid ShaderPlugin injection ${e}`);return[{stage:i===`vs`?`vertex`:`fragment`,target:a.join(`:`),[n]:t}]}),n,t.name);for(let[t,n]of Object.entries(r))e.injections[t]||=[],e.injections[t].push(...n)}function jh(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)||e.startsWith(`_luma_`))throw Error(`ShaderPlugin ${t} "${e}" must be a valid non-reserved identifier`)}function Mh(e,n){let{primitiveType:r}=t.getAttributeShaderTypeInfo(n.type),i=r===`i32`||r===`u32`,a=n.interpolation||(i?`flat`:`smooth`);if(i&&a===`smooth`)throw Error(`ShaderPlugin integer varying "${e}" must use flat interpolation`);return{type:n.type,interpolation:a}}function Nh(e,t){let n=/^(glsl|wgsl):([\s\S]+)$/.exec(e);return n?n[1]===t?n[2]:void 0:e}var Ph=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${ye}\\s*:\\s*([^;]+);`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${ye}\\s*:\\s*([^;]+);`,`g`)];function Fh(e,t=[]){let n=ge(e),r=new Map;for(let e of t)r.set(Lh(e.name,e.group,e.location),e.moduleName);let i=[];for(let e of Ph){e.lastIndex=0;let t;for(t=e.exec(n);t;){let a=e===Ph[0],o=Number(t[a?1:2]),s=Number(t[a?2:1]),c=t[3]?.trim(),l=t[4],u=t[5].trim(),d=r.get(Lh(l,s,o));i.push(Ih({name:l,group:s,binding:o,owner:d?`module`:`application`,moduleName:d,accessDeclaration:c,resourceType:u})),t=e.exec(n)}}return i.sort((e,t)=>e.group===t.group?e.binding===t.binding?e.name.localeCompare(t.name):e.binding-t.binding:e.group-t.group)}function Ih(e){let t={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:`unknown`,moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let n=e.accessDeclaration.split(`,`).map(e=>e.trim());if(n[0]===`uniform`)return{...t,kind:`uniform`,access:`uniform`};if(n[0]===`storage`){let e=n[1]||`read_write`;return{...t,kind:e===`read`?`read-only-storage`:`storage`,access:e}}}return e.resourceType===`sampler`||e.resourceType===`sampler_comparison`?{...t,kind:`sampler`,samplerKind:e.resourceType===`sampler_comparison`?`comparison`:`filtering`}:e.resourceType.startsWith(`texture_storage_`)?{...t,kind:`storage-texture`,access:Bh(e.resourceType),viewDimension:Rh(e.resourceType)}:e.resourceType.startsWith(`texture_`)?{...t,kind:`texture`,viewDimension:Rh(e.resourceType),sampleType:zh(e.resourceType),multisampled:e.resourceType.startsWith(`texture_multisampled_`)}:t}function Lh(e,t,n){return`${t}:${n}:${e}`}function Rh(e){if(e.includes(`cube_array`))return`cube-array`;if(e.includes(`2d_array`))return`2d-array`;if(e.includes(`cube`))return`cube`;if(e.includes(`3d`))return`3d`;if(e.includes(`2d`))return`2d`;if(e.includes(`1d`))return`1d`}function zh(e){if(e.startsWith(`texture_depth_`))return`depth`;if(e.includes(`<i32>`))return`sint`;if(e.includes(`<u32>`))return`uint`;if(e.includes(`<f32>`))return`float`}function Bh(e){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e)?.[1]}function Vh(e,t=``){let n=new Map,r=Object.values(e).flatMap(e=>Object.entries(e).map(([e,t])=>`${e.slice(3)}\n${t.signature}\n${t.header||``}\n${t.footer||``}`)),i=new Set(ge(`${t}\n${r.join(`
`)}`).match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let t of Object.keys(e.vertex)){let r=t.slice(3);e.fragment[`fs:${r}`]&&n.set(r,{vertex:Uh(`_luma_vertex_target_${r}`,i),fragment:Uh(`_luma_fragment_target_${r}`,i)})}return n}function Hh(e,t,n=Vh(t)){if(!n.size)return e;let r=ge(e),i=new Map,a=/((?:@\w+(?:\([^)]*\))?\s*)*)\bfn\s+([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu;for(let e=a.exec(r);e;e=a.exec(r)){let t=r.indexOf(`{`,a.lastIndex),n=t+1,o=1;for(;n<r.length&&o;n++)r[n]===`{`&&o++,r[n]===`}`&&o--;Ne(t>=0&&o===0);let s=e[2],c=e.index+e[0].lastIndexOf(s),l=Array.from(r.slice(t+1,n-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu),e=>e[1]);i.set(s,{name:s,start:e.index,end:n,nameStart:c,bodyStart:t,calls:l,stages:new Set,entryStage:/@vertex\b/.test(e[1])?`vertex`:/@fragment\b/.test(e[1])?`fragment`:void 0}),a.lastIndex=n}function o(e,t){let r=i.get(e);if(!(!r||r.stages.has(t))){r.stages.add(t);for(let e of r.calls)o(n.get(e)?.[t]||e,t)}}for(let e of i.values())e.entryStage&&o(e.name,e.entryStage);for(let e of[`vertex`,`fragment`])for(let r of Object.keys(t[e])){let t=r.slice(3);o(n.get(t)?.[e]||t,e)}let s=new Set,c=!0;for(;c;){c=!1;for(let e of i.values())!s.has(e.name)&&e.calls.some(e=>n.has(e)||s.has(e))&&(s.add(e.name),c=!0)}let l=new Map,u=new Set(r.match(/[_\p{XID_Start}][\p{XID_Continue}]*/gu));for(let e of s)i.get(e)?.stages.size===2&&l.set(e,{vertex:Uh(`_luma_vertex_helper_${e}`,u),fragment:Uh(`_luma_fragment_helper_${e}`,u)});function d(e,t){return n.get(e)?.[t]||l.get(e)?.[t]||e}for(let t of[...i.values()].reverse()){if(!s.has(t.name))continue;if(!t.stages.size)throw Error(`Cannot infer WGSL target stage in ${t.name}`);let n=[],i=t.start;for(let a of t.stages){let o=e.slice(i,t.end),s=[...r.slice(t.bodyStart+1,t.end-1).matchAll(/([_\p{XID_Start}][\p{XID_Continue}]*)\s*\(/gu)];for(let e of s.reverse()){let n=t.bodyStart+1+e.index-i,r=d(e[1],a);o=o.slice(0,n)+r+o.slice(n+e[1].length)}let c=t.nameStart-i;o=o.slice(0,c)+d(t.name,a)+o.slice(c+t.name.length),n.push(o)}e=e.slice(0,i)+n.join(`
`)+e.slice(t.end)}return e}function Uh(e,t){let n=e,r=0;for(;t.has(n);)n=`${e}_${++r}`;return t.add(n),n}var Wh=`([a-zA-Z_][a-zA-Z0-9_]*)`,Gh=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,Kh=RegExp(`^\\s*\\#\\s*ifdef\\s*${Wh}\\s*$`),qh=RegExp(`^\\s*\\#\\s*ifndef\\s*${Wh}\\s*(?:\\/\\/.*)?$`),Jh=/^\s*\#\s*else\s*(?:\/\/.*)?$/,Yh=/^\s*\#\s*endif\s*$/,Xh=RegExp(`^\\s*\\#\\s*ifdef\\s*${Wh}\\s*(?:\\/\\/.*)?$`),Zh=/^\s*\#\s*endif\s*(?:\/\/.*)?$/;function Qh(e,t){let n=e.split(`
`),r=[],i=[],a=!0;for(let e of n){let n=e.match(Gh),o=e.match(Xh)||e.match(Kh),s=e.match(qh),c=e.match(Jh),l=e.match(Zh)||e.match(Yh);if(n){let e=$h(n[1],t?.defines||{}),r=a&&e;i.push({parentActive:a,branchTaken:e,active:r}),a=r}else if(o||s){let e=(o||s)?.[1],n=!!t?.defines?.[e],r=o?n:!n,c=a&&r;i.push({parentActive:a,branchTaken:r,active:c}),a=c}else if(c){let e=i[i.length-1];if(!e)throw Error(`Encountered #else without matching #if, #ifdef or #ifndef`);e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,a=e.active}else l?(i.pop(),a=i.length?i[i.length-1].active:!0):a&&r.push(e)}if(i.length>0)throw Error(`Unterminated conditional block in shader source`);return r.join(`
`)}function $h(e,t){let n=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(n))return Number(n)!==0;if(n===`true`)return!0;if(n===`false`)return!1;let r=`(?:[A-Za-z_][A-Za-z0-9_]*|[+-]?\\d+(?:\\.\\d+)?)`,i=n.match(RegExp(`^(${r})\\s*(==|!=|<=|>=|<|>)\\s*(${r})$`));if(i){let e=e=>/^[A-Za-z_]/.test(e)?Number(t[e]??0):Number(e),n=e(i[1]),r=e(i[3]);switch(i[2]){case`==`:return n===r;case`!=`:return n!==r;case`<=`:return n<=r;case`>=`:return n>=r;case`<`:return n<r;case`>`:return n>r}}let a=n.match(RegExp(`^!\\s*${Wh}$`));if(a)return!t[a[1]];let o=n.match(RegExp(`^${Wh}$`));if(o)return!!t[o[1]];let s=n.match(RegExp(`^defined\\s*\\(\\s*${Wh}\\s*\\)$`));if(s)return t[s[1]]!==void 0;let c=n.match(RegExp(`^!\\s*defined\\s*\\(\\s*${Wh}\\s*\\)$`));if(c)return t[c[1]]===void 0;throw Error(`Unsupported #if expression "${e}"`)}function eg(e){let t=Ae(e.modules||[]),{source:n,bindingAssignments:r}=tg(e.platformInfo,{...e,source:e.source,stage:`vertex`,modules:t});return{source:n,getUniforms:Fe(t),bindingAssignments:r}}function tg(e,t){let{source:n,stage:r,modules:i,defines:a={},injectionTargets:o=[],inject:s={},pluginInjections:c={},pluginVertexInputs:l={},pluginInterStageVariables:u={},vertexEntryPoint:d=`vertexMain`,fragmentEntryPoint:f=`fragmentMain`,log:p}=t;Ne(typeof n==`string`,`shader source must be a string`);let m=rt(Qh(n,{defines:a}),d,l),h=Re(m.source,d,f,u),g=h.source,_=``,v=Ie(o,t.pluginInjectionTargets,`wgsl`),y={},b={},x={};nt(c,y,b,x),nt(Array.isArray(s)?Ge(s,`wgsl`):{},y,b,x);let S=Array.isArray(s)?{}:s;for(let e in S){let t=typeof S[e]==`string`?{injection:S[e],order:0}:S[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?b[e]=[...b[e]||[],t]:x[e]=[...x[e]||[],t]:y[e]=[...y[e]||[],t]}else x[e]=[...x[e]||[],t]}ng(m.declarations,m.initialization,b,x),rg(h,b,x),tt(v,y);let C=i.map(e=>({module:e,source:Qh(De(e,`wgsl`,p),{defines:a})})),w=sg(g),T=og(w.source),E=dg(C,t._bindingRegistry,T),D=[],O=C.map(({module:e,source:n})=>{let r=cg(n,e,{usedBindingsByGroup:T,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:E});return D.push(...r.bindingAssignments),{module:e,source:r.source}});for(let{module:e,source:t}of O)p&&je(e,g,p),_+=t;_+=Te,_=we(_,r,ig(b),!1,`wgsl`,{vertex:d,fragment:f});let k=Vh(v,[_,w.source,...Object.values(y).flat().map(e=>e.injection),...Object.values(x).flat().map(e=>e.injection)].join(`
`));return _+=ag(v,y,k),_+=yg(D),_+=w.source,_=we(_,r,x,!1,`wgsl`,{vertex:d,fragment:f}),_=Hh(_,v,k),vg(_),{source:_,bindingAssignments:D}}function ng(e,t,n,r){e&&(n[`vs:#decl`]=n[`vs:#decl`]||[],n[`vs:#decl`].push({injection:e,order:-(2**53-1)})),t&&(r[`vs:#main-start`]=r[`vs:#main-start`]||[],r[`vs:#main-start`].push({injection:t,order:-(2**53-1)}))}function rg(e,t,n){e.declarations&&(t[`vs:#decl`]=t[`vs:#decl`]||[],t[`vs:#decl`].push({injection:e.declarations,order:-(2**53-1)})),e.vertexInitialization&&(n[`vs:#main-start`]=n[`vs:#main-start`]||[],n[`vs:#main-start`].push({injection:e.vertexInitialization,order:-(2**53-1)})),e.fragmentInitialization&&(n[`fs:#main-start`]=n[`fs:#main-start`]||[],n[`fs:#main-start`].push({injection:e.fragmentInitialization,order:-(2**53-1)}))}function ig(e){let t=[...e[`vs:#decl`]||[],...e[`fs:#decl`]||[]];return t.length?{"vs:#decl":t}:{}}function ag(e,t,n=Vh(e)){return[`vertex`,`fragment`].map(r=>He(Object.fromEntries(Object.entries(e[r]).map(([e,t])=>{let i=e.slice(3),a=n.get(i)?.[r]||i;return[e,{...t,signature:a+t.signature.slice(i.length)}]})),t,`wgsl`)).join(``)}function og(e){let t=new Map;for(let n of be(e,_e)){let e=Number(n.bindingToken),r=Number(n.groupToken);pg(r,e,n.name),hg(t,r,e,`application binding "${n.name}"`)}return t}function sg(e){let t=be(e,xe),n=new Map;for(let e of t){if(e.bindingToken===`auto`)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);pg(r,t,e.name),hg(n,r,t,`application binding "${e.name}"`)}let r={sawSupportedBindingDeclaration:t.length>0},i=ve(e,xe,e=>ug(e,n,r));if(Se(e)&&!r.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:i}}function cg(e,t,n){let r=[],i={sawSupportedBindingDeclaration:be(e,Ce).length>0,nextHintedBindingLocation:typeof t.firstBindingSlot==`number`?t.firstBindingSlot:null},a=ve(e,Ce,e=>lg(e,{module:t,context:n,bindingAssignments:r,relocationState:i}));if(Se(e)&&!i.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:a,bindingAssignments:r}}function lg(e,t){let{module:n,context:r,bindingAssignments:i,relocationState:a}=t,{match:o,bindingToken:s,groupToken:c,name:l}=e,u=Number(c);if(s===`auto`){let e=bg(u,n.name,l),t=r.bindingRegistry?.get(e),s=t===void 0?gg(u,r.usedBindingsByGroup,n.name,a.nextHintedBindingLocation??void 0,r.bindingRegistry):t;return mg(n.name,u,s,l),t!==void 0&&fg(r.reservedBindingKeysByGroup,u,s,e)?(i.push({moduleName:n.name,name:l,group:u,location:s}),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`)):(hg(r.usedBindingsByGroup,u,s,`module "${n.name}" binding "${l}"`),r.bindingRegistry?.set(e,s),i.push({moduleName:n.name,name:l,group:u,location:s}),a.nextHintedBindingLocation!==null&&t===void 0&&(a.nextHintedBindingLocation=s+1),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`))}let d=Number(s);mg(n.name,u,d,l);let f=bg(u,n.name,l);return fg(r.reservedBindingKeysByGroup,u,d,f)||hg(r.usedBindingsByGroup,u,d,`module "${n.name}" binding "${l}"`),i.push({moduleName:n.name,name:l,group:u,location:d}),o}function ug(e,t,n){let{match:r,bindingToken:i,groupToken:a,name:o}=e,s=Number(a);if(i===`auto`){let e=_g(s,t);return pg(s,e,o),hg(t,s,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return n.sawSupportedBindingDeclaration=!0,r}function dg(e,t,n){let r=new Map,i=[];function a(e,t,i,a){hg(n,e,t,a);let o=r.get(e)||new Map;o.set(t,i),r.set(e,o)}for(let{module:t,source:n}of e)for(let e of be(n,Ce)){let n=Number(e.groupToken);if(e.bindingToken===`auto`){i.push({module:t,name:e.name,group:n});continue}let r=Number(e.bindingToken);mg(t.name,n,r,e.name),a(n,r,bg(n,t.name,e.name),`module "${t.name}" binding "${e.name}"`)}for(let{module:e,name:n,group:r}of i){let i=bg(r,e.name,n),o=t?.get(i);o!==void 0&&a(r,o,i,`registered module binding "${i}"`)}return r}function fg(e,t,n,r){let i=e.get(t);if(!i)return!1;let a=i.get(n);if(!a)return!1;if(a!==r)throw Error(`Registered module binding "${r}" collided with "${a}": group ${t}, binding ${n}.`);return i.delete(n),!0}function pg(e,t,n){if(e===0&&t>=100)throw Error(`Application binding "${n}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below 100.`)}function mg(e,t,n,r){if(t===0&&n<100)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${n}. Module-owned explicit group-0 bindings must be 100 or higher.`)}function hg(e,t,n,r){let i=e.get(t)||new Set;if(i.has(n))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${n}.`);i.add(n),e.set(t,i)}function gg(e,t,n,r,i){let a=t.get(e)||new Set,o=new Set,s=`${e}:`,c=`${s}${n}:`;for(let[e,t]of i||[])e.startsWith(c)&&o.add(t);let l=r??(e===0?100:a.size>0?Math.max(...a)+1:0);for(;a.has(l)||o.has(l);)l++;for(let[e,t]of i||[])t===l&&e.startsWith(s)&&i?.delete(e);return l}function _g(e,t){let n=t.get(e)||new Set,r=0;for(;n.has(r);)r++;return r}function vg(e){let t=he(e,Ce);if(!t)return;let n=xg(e,t.index);throw n?Error(`Unresolved @binding(auto) for module "${n}" binding "${t.name}" remained in assembled WGSL source.`):Sg(e,t.index)?Error(`Unresolved @binding(auto) for application binding "${t.name}" remained in assembled WGSL source.`):Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${Cg(t.match)}".`)}function yg(e){if(e.length===0)return``;let t=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let n of e)t+=`// ${n.moduleName}.${n.name} -> @group(${n.group}) @binding(${n.location})\n`;return t+=`
`,t}function bg(e,t,n){return`${e}:${t}:${n}`}function xg(e,t){let n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,r,i;for(i=n.exec(e);i&&i.index<=t;)r=i[1],i=n.exec(e);return r}function Sg(e,t){let n=e.indexOf(Te);return n>=0?t>n:!0}function Cg(e){return e.replace(/\s+/g,` `).trim()}function wg(e,t){return{name:Tg(e,t),language:`glsl`,version:Eg(e)}}function Tg(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function Eg(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function Dg(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
// Apple optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case`nvidia`:return`#define NVIDIA_GPU
// Nvidia optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
`;case`intel`:return`#define INTEL_GPU
// Intel optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Intel's built-in 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case`amd`:return`#define AMD_GPU
`;default:return`#define DEFAULT_GPU
// Prevent driver from optimizing away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Headless Chrome's software shader 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// If the GPU doesn't have full 32 bits precision, will causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`}}function Og(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=Mg(e,Ag),e;case`fragment`:return e=Mg(e,jg),e;default:throw Error(t)}}var kg=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],Ag=[...kg,[Ng(`attribute`),`in $1`],[Ng(`varying`),`out $1`]],jg=[...kg,[Ng(`varying`),`in $1`]];function Mg(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function Ng(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var Pg=`precision highp float;
`;function Fg(e){let{vs:t,fs:n}=e,r=Ae(e.modules||[]);return{vs:Ig(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:Ig(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:Fe(r)}}function Ig(e,t){let{source:n,stage:r,language:i=`glsl`,modules:a,defines:o={},injectionTargets:s=[],inject:c={},pluginInjections:l={},pluginVertexInputs:u={},pluginInterStageVariables:d={},prologue:f=!0,log:p}=t;Ne(typeof n==`string`,`shader source must be a string`);let m=i===`glsl`?wg(n).version:-1,h=e.shaderLanguageVersion,g=m===100?`#version 100`:`#version 300 es`,_=n.split(`
`).slice(1).join(`
`),v={};a.forEach(e=>{Object.assign(v,e.defines)}),Object.assign(v,o);let y=``;switch(i){case`wgsl`:break;case`glsl`:y=f?`\
${g}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${r.toUpperCase()}`}

${Dg(e)}
${r===`fragment`?Pg:``}

// ----- APPLICATION DEFINES -------------------------

${Lg(v)}

`:`${g}
`;break}let b=Ie(s,t.pluginInjectionTargets,`glsl`),x={},S={},C={};nt(l,x,S,C),nt(Array.isArray(c)?Ge(c,`glsl`):{},x,S,C);let w=Array.isArray(c)?{}:c;for(let e in w){let t=typeof w[e]==`string`?{injection:w[e],order:0}:w[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?S[e]=[...S[e]||[],t]:C[e]=[...C[e]||[],t]:x[e]=[...x[e]||[],t]}else C[e]=[...C[e]||[],t]}if(r===`vertex`){let e=Pe(_,u);e&&(y+=`${e}\n`)}let T=it(_,r,d);T.declarations&&(y+=`${T.declarations}\n`),T.initialization&&(C[`vs:#main-start`]=C[`vs:#main-start`]||[],C[`vs:#main-start`].push({injection:T.initialization,order:-(2**53-1)}));for(let e of a){p&&je(e,_,p);let t=De(e,r,p);y+=t}return tt(b,x,r),y+=`// ----- MAIN SHADER SOURCE -------------------------`,y+=Te,y=we(y,r,S),y+=He(b[r],x),y+=_,y=we(y,r,C),i===`glsl`&&m!==h&&(y=Og(y,r)),i===`glsl`&&Ke(y,r,p),y.trim()}function Lg(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var Rg=class extends Ue{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._injectionTargets,...e.injectionTargets||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...Fg({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,injectionTargets:n}),modules:t}}},zg=class e extends Ue{shaderLanguage=`wgsl`;_wgslBindingRegistry=new Map;assembleWGSLShader(t){let n=this._getModuleList(t.modules),r=[...this._injectionTargets,...t.injectionTargets||[]],i=this._transpileShader(t,n,t.source,t.shaderStage??(t.computeEntryPoint?`compute`:void 0)),a={vertex:i.entryPoints?.vertex??t.vertexEntryPoint,fragment:i.entryPoints?.fragment??t.fragmentEntryPoint,compute:i.entryPoints?.compute??t.computeEntryPoint},o=e.getShaderPreprocessorDefines(t,n),s=t.platformInfo.shaderLanguage===`wgsl`&&i.code?Qh(i.code,{defines:o}):i.code,{source:c,getUniforms:l,bindingAssignments:u}=eg({...t,source:s,vertexEntryPoint:a.vertex,fragmentEntryPoint:a.fragment,defines:o,_bindingRegistry:this._wgslBindingRegistry,modules:i.modules,injectionTargets:r}),d=t.platformInfo.shaderLanguage===`wgsl`?Qh(c,{defines:o}):c;return{source:d,entryPoints:a,getUniforms:l,modules:n,bindingAssignments:u,bindingTable:Fh(d,u),shaderLayout:at(d,{vertexEntryPoint:a.vertex,scanVertexAttributes:t.scanVertexAttributes})}}static getShaderPreprocessorDefines(t,n){return{...e.getPlatformPreprocessorDefines(t.platformInfo),...n.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...t.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type===`webgpu`&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP32_TAN_PRECISION_WORKAROUND:e.type===`webgpu`&&e.gpu.toLowerCase()!==`nvidia`&&e.gpu.toLowerCase()!==`amd`,LUMA_FP64_INTEGER_ARITHMETIC:e.type===`webgpu`&&e.gpu.toLowerCase()===`apple`}}},Bg=`#version 300 es
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`;function Vg(e){let{input:t,inputChannels:n,output:r}=e||{};if(!t)return Bg;if(!n)throw Error(`inputChannels`);return`\
#version 300 es
in ${Hg(n)} ${t};
out vec4 ${r};
void main() {
  ${r} = ${Ug(t,n)};
}`}function Hg(e){switch(e){case 1:return`float`;case 2:return`vec2`;case 3:return`vec3`;case 4:return`vec4`;default:throw Error(`invalid channels: ${e}`)}}function Ug(e,t){switch(t){case 1:return`vec4(${e}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${e}, 0.0, 1.0)`;case 3:return`vec4(${e}, 1.0)`;case 4:return e;default:throw Error(`invalid channels: ${t}`)}}var Wg=null,Gg=new ArrayBuffer(4),Kg=new Float32Array(Gg),qg=new Uint32Array(Gg);function Jg(e){Wg||=Xg(),e=Ml(e,-65504,65504),Kg[0]=e;let t=qg[0],n=t>>23&511;return Wg.baseTable[n]+((t&8388607)>>Wg.shiftTable[n])}function Yg(e){Wg||=Xg();let t=e>>10;return qg[0]=Wg.mantissaTable[Wg.offsetTable[t]+(e&1023)]+Wg.exponentTable[t],Kg[0]}function Xg(){let e=new Uint32Array(512),t=new Uint32Array(512);for(let n=0;n<256;++n){let r=n-127;r<-27?(e[n]=0,e[n|256]=32768,t[n]=24,t[n|256]=24):r<-14?(e[n]=1024>>-r-14,e[n|256]=1024>>-r-14|32768,t[n]=-r-1,t[n|256]=-r-1):r<=15?(e[n]=r+15<<10,e[n|256]=r+15<<10|32768,t[n]=13,t[n|256]=13):r<128?(e[n]=31744,e[n|256]=64512,t[n]=24,t[n|256]=24):(e[n]=31744,e[n|256]=64512,t[n]=13,t[n|256]=13)}let n=new Uint32Array(2048),r=new Uint32Array(64),i=new Uint32Array(64);for(let e=1;e<1024;++e){let t=e<<13,r=0;for(;!(t&8388608);)t<<=1,r-=8388608;t&=-8388609,r+=947912704,n[e]=t|r}for(let e=1024;e<2048;++e)n[e]=939524096+(e-1024<<13);for(let e=1;e<31;++e)r[e]=e<<23;r[31]=1199570944,r[32]=2147483648;for(let e=33;e<63;++e)r[e]=2147483648+(e-32<<23);r[63]=3347054592;for(let e=1;e<64;++e)e!==32&&(i[e]=1024);return{baseTable:e,shiftTable:t,mantissaTable:n,exponentTable:r,offsetTable:i}}function Zg(e,t=!0){return e??t}function Qg(e=[0,0,0],t=!0){if(e_(e)&&e.length===3)return e;let n=$g(e,t)?255:1;return[e[0]/n,e[1]/n,e[2]/n]}function $g(e,t){return Array.isArray(e)?t:`BYTES_PER_ELEMENT`in e&&e.BYTES_PER_ELEMENT===1}function e_(e){let t=Object.prototype.toString.call(e);return ArrayBuffer.isView(e)&&(t===`[object Float16Array]`||t===`[object Float32Array]`||t===`[object Float64Array]`)}var t_={width:2,jitter:.7,variation:.35,grain:.45,offset:0,extension:3,sketch:1,minimumAntialias:.7},n_=`
layout(std140) uniform sketchStrokeUniforms {
  float width;
  float jitter;
  float variation;
  float grain;
  float offset;
  float extension;
  float sketch;
  float minimumAntialias;
} sketchStroke;
`,r_={name:`sketchStroke`,bindingLayout:[{name:`sketchStroke`,group:3}],source:`
struct sketchStrokeUniforms {
  width: f32,
  jitter: f32,
  variation: f32,
  grain: f32,
  offset: f32,
  extension: f32,
  sketch: f32,
  minimumAntialias: f32,
};
@group(3) @binding(auto) var<uniform> sketchStroke: sketchStrokeUniforms;
fn sketchStroke_noise(coordinate: f32) -> f32 {
  let cell = floor(coordinate);
  let fraction = fract(coordinate);
  let first = fract(sin(cell * 127.1) * 43758.5453);
  let second = fract(sin((cell + 1.0) * 127.1) * 43758.5453);
  return mix(first, second, fraction * fraction * (3.0 - 2.0 * fraction));
}
fn sketchStroke_noise2(coordinate: vec2<f32>) -> f32 {
  let cell = floor(coordinate);
  var fraction = fract(coordinate);
  fraction = fraction * fraction * (vec2<f32>(3.0) - 2.0 * fraction);
  let first = fract(sin(dot(cell, vec2<f32>(127.1, 311.7))) * 43758.5453);
  let second = fract(sin(dot(cell + vec2<f32>(1.0, 0.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  let third = fract(sin(dot(cell + vec2<f32>(0.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  let fourth = fract(sin(dot(cell + vec2<f32>(1.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  return mix(mix(first, second, fraction.x), mix(third, fourth, fraction.x), fraction.y);
}
fn sketchStroke_getCoverage(coordinates: vec2<f32>, strokeLength: f32, seed: f32) -> f32 {
  let along = coordinates.x;
  let side = select(1.0, -1.0, sketchStroke_noise(seed * 29.0) < 0.5);
  let center = (sketchStroke_noise(along * strokeLength / 36.0 + seed * 19.0) * 2.0 - 1.0) * sketchStroke.jitter * sketchStroke.sketch + side * sketchStroke.offset * sketchStroke.sketch;
  let variation = mix(1.0, 0.55 + sketchStroke_noise(along * 31.0 + seed * 7.0) * 0.75, sketchStroke.variation * sketchStroke.sketch);
  let grainCoordinates = vec2<f32>(along * strokeLength, coordinates.y) + vec2<f32>(seed * 17.0, seed * 53.0);
  let coarseGrain = sketchStroke_noise2(grainCoordinates * 0.55);
  let fineGrain = sketchStroke_noise2(grainCoordinates * 2.8);
  let toothGrain = sketchStroke_noise2(grainCoordinates * 6.5);
  let grainTexture = coarseGrain * 0.35 + fineGrain * 0.4 + toothGrain * 0.25;
  let edgeRoughness = (grainTexture - 0.5) * sketchStroke.grain * sketchStroke.sketch * 0.7;
  let radius = sketchStroke.width * 0.5 * variation + edgeRoughness;
  let endDistance = max(-along, along - 1.0) * strokeLength - sketchStroke.extension;
  let distance = max(abs(coordinates.y - center) - radius, endDistance);
  let antialias = max(fwidth(distance), max(sketchStroke.minimumAntialias, 0.0001));
  let coverage = 1.0 - smoothstep(-antialias * 0.5, antialias * 0.5, distance);
  // Keep the pigment opaque; grain changes the stroke edge so the paper does not show through as white flecks.
  return coverage;
}
`,vs:n_,fs:n_+`
float sketchStroke_noise(float coordinate) {
  float cell = floor(coordinate);
  float fraction = fract(coordinate);
  float first = fract(sin(cell * 127.1) * 43758.5453);
  float second = fract(sin((cell + 1.0) * 127.1) * 43758.5453);
  return mix(first, second, fraction * fraction * (3.0 - 2.0 * fraction));
}
float sketchStroke_noise2(vec2 coordinate) {
  vec2 cell = floor(coordinate);
  vec2 fraction = fract(coordinate);
  fraction = fraction * fraction * (3.0 - 2.0 * fraction);
  float first = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
  float second = fract(sin(dot(cell + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float third = fract(sin(dot(cell + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float fourth = fract(sin(dot(cell + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(first, second, fraction.x), mix(third, fourth, fraction.x), fraction.y);
}
// coordinates.x is normalized distance along a segment, y is signed transverse distance. All distances use the same units.
// Seeds belong to the geometry; neither camera position nor time changes the grain.
float sketchStroke_getCoverage(vec2 coordinates, float strokeLength, float seed) {
  float along = coordinates.x;
  float side = sketchStroke_noise(seed * 29.0) < 0.5 ? -1.0 : 1.0;
  float center = (sketchStroke_noise(along * strokeLength / 36.0 + seed * 19.0) * 2.0 - 1.0) * sketchStroke.jitter * sketchStroke.sketch + side * sketchStroke.offset * sketchStroke.sketch;
  float variation = mix(1.0, 0.55 + sketchStroke_noise(along * 31.0 + seed * 7.0) * 0.75, sketchStroke.variation * sketchStroke.sketch);
  vec2 grainCoordinates = vec2(along * strokeLength, coordinates.y) + vec2(seed * 17.0, seed * 53.0);
  float coarseGrain = sketchStroke_noise2(grainCoordinates * 0.55);
  float fineGrain = sketchStroke_noise2(grainCoordinates * 2.8);
  float toothGrain = sketchStroke_noise2(grainCoordinates * 6.5);
  float grainTexture = coarseGrain * 0.35 + fineGrain * 0.4 + toothGrain * 0.25;
  float edgeRoughness = (grainTexture - 0.5) * sketchStroke.grain * sketchStroke.sketch * 0.7;
  float radius = sketchStroke.width * 0.5 * variation + edgeRoughness;
  float endDistance = max(-along, along - 1.0) * strokeLength - sketchStroke.extension;
  float distance = max(abs(coordinates.y - center) - radius, endDistance);
  float antialias = max(fwidth(distance), max(sketchStroke.minimumAntialias, 0.0001));
  float coverage = 1.0 - smoothstep(-antialias * 0.5, antialias * 0.5, distance);
  // Keep the pigment opaque; grain changes the stroke edge so the paper does not show through as white flecks.
  return coverage;
}
`,uniformTypes:{width:`f32`,jitter:`f32`,variation:`f32`,grain:`f32`,offset:`f32`,extension:`f32`,sketch:`f32`,minimumAntialias:`f32`},defaultUniforms:t_,getUniforms(e={}){return{...t_,...e}}};function i_(){return{color:[0,0,0],position:[0,0,0],halfAxisX:[0,0,0],halfAxisY:[0,0,0],normal:[0,0,-1],disk:0}}var a_={color:`vec3<f32>`,position:`vec3<f32>`,halfAxisX:`vec3<f32>`,halfAxisY:`vec3<f32>`,normal:`vec3<f32>`,disk:`i32`};function o_(e,t=!1){return Array.from({length:4},(n,r)=>{let i=e[r];if(!i)return i_();let a=Qg(i.color||(t?[255,255,255]:[1,1,1]),t);return{position:i.position,halfAxisX:i.halfAxisX,halfAxisY:i.halfAxisY,normal:i.normal,disk:i.type===`disk`?1:0,color:a.map(e=>e*(i.intensity??1e3))}})}var s_=`precision highp int;

// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
struct AmbientLight {
  vec3 color;
};

struct PointLight {
  vec3 color;
  vec3 position;
  vec3 attenuation; // 2nd order x:Constant-y:Linear-z:Exponential
};

struct SpotLight {
  vec3 color;
  vec3 position;
  vec3 direction;
  vec3 attenuation;
  vec2 coneCos;
};

struct DirectionalLight {
  vec3 color;
  vec3 direction;
};

struct UniformLight {
  vec3 color;
  vec3 position;
  vec3 direction;
  vec3 attenuation;
  vec2 coneCos;
};

struct AreaLightUniform {
  vec3 color; vec3 position; vec3 halfAxisX; vec3 halfAxisY; vec3 normal; int disk;
};

layout(std140) uniform lightingUniforms {
  int enabled;
  int directionalLightCount;
  int pointLightCount;
  int spotLightCount;
  vec3 ambientColor;
  UniformLight lights[5];
  int areaLightCount;
  AreaLightUniform areaLights[4];
} lighting;

PointLight lighting_getPointLight(int index) {
  UniformLight light = lighting.lights[index];
  return PointLight(light.color, light.position, light.attenuation);
}

SpotLight lighting_getSpotLight(int index) {
  UniformLight light = lighting.lights[lighting.pointLightCount + index];
  return SpotLight(light.color, light.position, light.direction, light.attenuation, light.coneCos);
}

DirectionalLight lighting_getDirectionalLight(int index) {
  UniformLight light =
    lighting.lights[lighting.pointLightCount + lighting.spotLightCount + index];
  return DirectionalLight(light.color, light.direction);
}

float getPointLightAttenuation(PointLight pointLight, float distance) {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

float getSpotLightAttenuation(SpotLight spotLight, vec3 positionWorldspace) {
  vec3 light_direction = normalize(positionWorldspace - spotLight.position);
  float coneFactor = smoothstep(
    spotLight.coneCos.y,
    spotLight.coneCos.x,
    dot(normalize(spotLight.direction), light_direction)
  );
  float distanceAttenuation = getPointLightAttenuation(
    PointLight(spotLight.color, spotLight.position, spotLight.attenuation),
    distance(spotLight.position, positionWorldspace)
  );
  return distanceAttenuation / max(coneFactor, 0.0001);
}

// #endif
`,c_=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
const MAX_LIGHTS: i32 = 5;

struct AmbientLight {
  color: vec3<f32>,
};

struct PointLight {
  color: vec3<f32>,
  position: vec3<f32>,
  attenuation: vec3<f32>, // 2nd order x:Constant-y:Linear-z:Exponential
};

struct SpotLight {
  color: vec3<f32>,
  position: vec3<f32>,
  direction: vec3<f32>,
  attenuation: vec3<f32>,
  coneCos: vec2<f32>,
};

struct DirectionalLight {
  color: vec3<f32>,
  direction: vec3<f32>,
};

struct UniformLight {
  color: vec3<f32>,
  position: vec3<f32>,
  direction: vec3<f32>,
  attenuation: vec3<f32>,
  coneCos: vec2<f32>,
};

struct AreaLightUniform {
  color: vec3f, position: vec3f, halfAxisX: vec3f, halfAxisY: vec3f, normal: vec3f, disk: i32,
};

struct lightingUniforms {
  enabled: i32,
  directionalLightCount: i32,
  pointLightCount: i32,
  spotLightCount: i32,
  ambientColor: vec3<f32>,
  lights: array<UniformLight, 5>,
  areaLightCount: i32,
  areaLights: array<AreaLightUniform, 4>,
};

@group(2) @binding(auto) var<uniform> lighting : lightingUniforms;

fn lighting_getPointLight(index: i32) -> PointLight {
  let light = lighting.lights[index];
  return PointLight(light.color, light.position, light.attenuation);
}

fn lighting_getSpotLight(index: i32) -> SpotLight {
  let light = lighting.lights[lighting.pointLightCount + index];
  return SpotLight(light.color, light.position, light.direction, light.attenuation, light.coneCos);
}

fn lighting_getDirectionalLight(index: i32) -> DirectionalLight {
  let light = lighting.lights[lighting.pointLightCount + lighting.spotLightCount + index];
  return DirectionalLight(light.color, light.direction);
}

fn getPointLightAttenuation(pointLight: PointLight, distance: f32) -> f32 {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

fn getSpotLightAttenuation(spotLight: SpotLight, positionWorldspace: vec3<f32>) -> f32 {
  let lightDirection = normalize(positionWorldspace - spotLight.position);
  let coneFactor = smoothstep(
    spotLight.coneCos.y,
    spotLight.coneCos.x,
    dot(normalize(spotLight.direction), lightDirection)
  );
  let distanceAttenuation = getPointLightAttenuation(
    PointLight(spotLight.color, spotLight.position, spotLight.attenuation),
    distance(spotLight.position, positionWorldspace)
  );
  return distanceAttenuation / max(coneFactor, 0.0001);
}
`,l_=5,u_={props:{},uniforms:{},name:`lighting`,defines:{},uniformTypes:{enabled:`i32`,directionalLightCount:`i32`,pointLightCount:`i32`,spotLightCount:`i32`,ambientColor:`vec3<f32>`,lights:[{color:`vec3<f32>`,position:`vec3<f32>`,direction:`vec3<f32>`,attenuation:`vec3<f32>`,coneCos:`vec2<f32>`},l_],areaLightCount:`i32`,areaLights:[a_,4]},defaultUniforms:h_(),bindingLayout:[{name:`lighting`,group:2}],firstBindingSlot:0,source:c_,vs:s_,fs:s_,getUniforms:d_};function d_(e,t={}){e&&={...e};let n=(e?.lights||[]).filter(e=>e.type===`rect`||e.type===`disk`);if(!e)return h_();e.lights&&(e={...e,...p_(e.lights),lights:void 0});let{useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s}=e||{};if(!(i||a&&a.length>0||o&&o.length>0||s&&s.length>0)&&n.length===0)return{...h_(),enabled:0};let c={...h_(),...f_({useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s})};return c.areaLightCount=Math.min(n.length,4),c.areaLights=o_(n,Zg(e.useByteColors,!0)),e.enabled!==void 0&&(c.enabled=e.enabled?1:0),c}function f_({useByteColors:e,ambientLight:t,pointLights:n=[],spotLights:r=[],directionalLights:i=[]}){let a=g_(),o=0,s=0,c=0,l=0;for(let t of n){if(o>=l_)break;a[o]={...a[o],color:m_(t,e),position:t.position,attenuation:t.attenuation||[1,0,0]},o++,s++}for(let t of r){if(o>=l_)break;a[o]={...a[o],color:m_(t,e),position:t.position,direction:t.direction,attenuation:t.attenuation||[1,0,0],coneCos:v_(t)},o++,c++}for(let t of i){if(o>=l_)break;a[o]={...a[o],color:m_(t,e),direction:t.direction},o++,l++}return n.length+r.length+i.length>l_&&console.warn(`MAX_LIGHTS exceeded, truncating to ${l_}`),{ambientColor:m_(t,e),directionalLightCount:l,pointLightCount:s,spotLightCount:c,lights:a}}function p_(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let n of e||[])switch(n.type){case`ambient`:t.ambientLight=n;break;case`directional`:t.directionalLights?.push(n);break;case`point`:t.pointLights?.push(n);break;case`spot`:t.spotLights?.push(n);break;default:}return t}function m_(e={},t){let{color:n=[0,0,0],intensity:r=1}=e;return Qg(n,Zg(t,!0)).map(e=>e*r)}function h_(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:g_(),areaLightCount:0,areaLights:o_([])}}function g_(){return Array.from({length:l_},()=>__())}function __(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function v_(e){let t=e.innerConeAngle??0,n=e.outerConeAngle??Math.PI/4;return[Math.cos(t),Math.cos(n)]}var y_=`#ifdef USE_IBL
@group(2) @binding(auto) var pbr_diffuseEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_diffuseEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_specularEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_specularEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_brdfLUT: texture_2d<f32>;
@group(2) @binding(auto) var pbr_brdfLUTSampler: sampler;
#endif
`,b_=`#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif
`,x_={name:`ibl`,firstBindingSlot:32,bindingLayout:[{name:`pbr_diffuseEnvSampler`,group:2},{name:`pbr_specularEnvSampler`,group:2},{name:`pbr_brdfLUT`,group:2}],source:y_,vs:b_,fs:b_},S_=`
#ifdef USE_AREA_LIGHT_LTC
uniform sampler2D areaLTCMatrix;
uniform sampler2D areaLTCAmplitude;
// GGX fit and Fresnel decomposition: Heitz, Dupuy, Hill and Neubelt, SIGGRAPH 2016.
// Explicit bilinear lookup avoids requiring filterable float32 textures on WebGPU.
vec4 areaLTC_lookup(sampler2D table, vec2 coordinate) {
  vec2 position = clamp(coordinate, 0.0, 1.0) * 63.0;
  ivec2 lower = ivec2(floor(position));
  ivec2 upper = min(lower + ivec2(1), ivec2(63));
  vec2 fraction = fract(position);
  return mix(mix(texelFetch(table, lower, 0), texelFetch(table, ivec2(upper.x, lower.y), 0), fraction.x),
             mix(texelFetch(table, ivec2(lower.x, upper.y), 0), texelFetch(table, upper, 0), fraction.x), fraction.y);
}

// Exact horizon clipping followed by the spherical polygon edge integral.
// Disk support uses an inscribed 32-gon; the area error is below 0.65 percent.
float areaLTC_integral(AreaLightUniform light, vec3 receiver, vec3 normal, vec3 view, mat3 inverseTransform) {
  if (dot(light.normal, receiver - light.position) <= 0.0) return 0.0;
  vec3 tangent = view - normal * dot(view, normal);
  if (dot(tangent, tangent) < 1e-8) {
    vec3 axis = abs(normal.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
    tangent = cross(axis, normal);
  }
  tangent = normalize(tangent);
  mat3 transform = inverseTransform * transpose(mat3(tangent, -cross(normal, tangent), normal));
  vec3 vertices[33];
  int count = light.disk != 0 ? 32 : 4;
  for (int index = 0; index < 32; index++) {
    if (index >= count) break;
    vec2 coordinate;
    if (light.disk != 0) {
      float angle = float(index) * 6.28318530718 / 32.0;
      coordinate = vec2(cos(angle), -sin(angle));
    } else {
      coordinate = index == 0 ? vec2(1.0, -1.0) : index == 1 ? vec2(-1.0, -1.0) : index == 2 ? vec2(-1.0, 1.0) : vec2(1.0, 1.0);
    }
    vertices[index] = transform * (light.position + coordinate.x * light.halfAxisX + coordinate.y * light.halfAxisY - receiver);
  }
  vec3 clipped[34];
  int clippedCount = 0;
  for (int index = 0; index < 32; index++) {
    if (index >= count) break;
    vec3 start = vertices[index];
    vec3 end = vertices[(index + 1) % count];
    if (start.z > 0.0) { clipped[clippedCount] = start; clippedCount++; }
    if ((start.z > 0.0) != (end.z > 0.0)) {
      clipped[clippedCount] = mix(start, end, start.z / (start.z - end.z));
      clippedCount++;
    }
  }
  if (clippedCount < 3) return 0.0;
  vec3 integral = vec3(0.0);
  for (int index = 0; index < 34; index++) {
    if (index >= clippedCount) break;
    vec3 start = normalize(clipped[index]);
    vec3 end = normalize(clipped[(index + 1) % clippedCount]);
    vec3 edge = cross(start, end);
    float sine = length(edge);
    if (sine > 1e-7) integral += edge * (acos(clamp(dot(start, end), -1.0, 1.0)) / sine);
  }
  return min(abs(integral.z) / 6.28318530718, 1.0);
}

vec3 areaLTC_specular(AreaLightUniform light, vec3 receiver, vec3 normal, vec3 view, float roughness, vec3 reflectance0, vec3 reflectance90) {
  vec2 coordinate = vec2(roughness, sqrt(1.0 - clamp(dot(normal, view), 0.0, 1.0)));
  vec4 coefficients = areaLTC_lookup(areaLTCMatrix, coordinate);
  vec4 amplitude = areaLTC_lookup(areaLTCAmplitude, coordinate);
  mat3 inverseTransform = mat3(vec3(coefficients.x, 0.0, coefficients.y), vec3(0.0, 1.0, 0.0), vec3(coefficients.z, 0.0, coefficients.w));
  vec3 fresnel = reflectance0 * amplitude.x + (reflectance90 - reflectance0) * amplitude.y;
  return light.color * fresnel * areaLTC_integral(light, receiver, normal, view, inverseTransform);
}

vec3 areaLTC_evaluate(int index, vec3 receiver, vec3 normal, vec3 view, float roughness, vec3 diffuseColor, vec3 reflectance0, vec3 reflectance90) {
  AreaLightUniform light = areaLighting_getLight(index);
  float diffuseIntegral = areaLTC_integral(light, receiver, normal, view, mat3(1.0));
  return light.color * diffuseColor * (vec3(1.0) - reflectance0) * diffuseIntegral +
    areaLTC_specular(light, receiver, normal, view, roughness, reflectance0, reflectance90);
}
#endif
`,C_=`
#ifdef USE_AREA_LIGHT_LTC
@group(2) @binding(auto) var areaLTCMatrix: texture_2d<f32>;
@group(2) @binding(auto) var areaLTCAmplitude: texture_2d<f32>;
fn areaLTC_lookup(table: texture_2d<f32>, coordinate: vec2f) -> vec4f {
  let position = clamp(coordinate, vec2f(0.0), vec2f(1.0)) * 63.0;
  let lower = vec2i(floor(position));
  let upper = min(lower + vec2i(1), vec2i(63));
  let fraction = fract(position);
  return mix(mix(textureLoad(table, lower, 0), textureLoad(table, vec2i(upper.x, lower.y), 0), fraction.x),
             mix(textureLoad(table, vec2i(lower.x, upper.y), 0), textureLoad(table, upper, 0), fraction.x), fraction.y);
}
fn areaLTC_integral(light: AreaLightUniform, receiver: vec3f, normal: vec3f, view: vec3f, inverseTransform: mat3x3f) -> f32 {
  if (dot(light.normal, receiver - light.position) <= 0.0) { return 0.0; }
  var tangent = view - normal * dot(view, normal);
  if (dot(tangent, tangent) < 1e-8) {
    let axis = select(vec3f(0.0, 1.0, 0.0), vec3f(0.0, 0.0, 1.0), abs(normal.z) < 0.9);
    tangent = cross(axis, normal);
  }
  tangent = normalize(tangent);
  let transform = inverseTransform * transpose(mat3x3f(tangent, -cross(normal, tangent), normal));
  var vertices: array<vec3f, 33>;
  let count = select(4, 32, light.disk != 0);
  for (var index = 0; index < 32; index++) {
    if (index >= count) { break; }
    var coordinate: vec2f;
    if (light.disk != 0) {
      let angle = f32(index) * 6.28318530718 / 32.0;
      coordinate = vec2f(cos(angle), -sin(angle));
    } else {
      coordinate = vec2f(1.0, 1.0);
      if (index == 0) { coordinate = vec2f(1.0, -1.0); }
      if (index == 1) { coordinate = vec2f(-1.0, -1.0); }
      if (index == 2) { coordinate = vec2f(-1.0, 1.0); }
    }
    vertices[index] = transform * (light.position + coordinate.x * light.halfAxisX + coordinate.y * light.halfAxisY - receiver);
  }
  var clipped: array<vec3f, 34>;
  var clippedCount = 0;
  for (var index = 0; index < 32; index++) {
    if (index >= count) { break; }
    let start = vertices[index];
    let end = vertices[(index + 1) % count];
    if (start.z > 0.0) { clipped[clippedCount] = start; clippedCount++; }
    if ((start.z > 0.0) != (end.z > 0.0)) {
      clipped[clippedCount] = mix(start, end, start.z / (start.z - end.z));
      clippedCount++;
    }
  }
  if (clippedCount < 3) { return 0.0; }
  var integral = vec3f(0.0);
  for (var index = 0; index < 34; index++) {
    if (index >= clippedCount) { break; }
    let start = normalize(clipped[index]);
    let end = normalize(clipped[(index + 1) % clippedCount]);
    let edge = cross(start, end);
    let sine = length(edge);
    if (sine > 1e-7) { integral += edge * (acos(clamp(dot(start, end), -1.0, 1.0)) / sine); }
  }
  return min(abs(integral.z) / 6.28318530718, 1.0);
}
fn areaLTC_specular(light: AreaLightUniform, receiver: vec3f, normal: vec3f, view: vec3f, roughness: f32, reflectance0: vec3f, reflectance90: vec3f) -> vec3f {
  let coordinate = vec2f(roughness, sqrt(1.0 - clamp(dot(normal, view), 0.0, 1.0)));
  let coefficients = areaLTC_lookup(areaLTCMatrix, coordinate);
  let amplitude = areaLTC_lookup(areaLTCAmplitude, coordinate);
  let inverseTransform = mat3x3f(vec3f(coefficients.x, 0.0, coefficients.y), vec3f(0.0, 1.0, 0.0), vec3f(coefficients.z, 0.0, coefficients.w));
  let fresnel = reflectance0 * amplitude.x + (reflectance90 - reflectance0) * amplitude.y;
  return light.color * fresnel * areaLTC_integral(light, receiver, normal, view, inverseTransform);
}
fn areaLTC_evaluate(index: i32, receiver: vec3f, normal: vec3f, view: vec3f, roughness: f32, diffuseColor: vec3f, reflectance0: vec3f, reflectance90: vec3f) -> vec3f {
  let light = areaLighting_getLight(index);
  let diffuseIntegral = areaLTC_integral(light, receiver, normal, view, mat3x3f(vec3f(1.0,0.0,0.0),vec3f(0.0,1.0,0.0),vec3f(0.0,0.0,1.0)));
  return light.color * diffuseColor * (vec3f(1.0) - reflectance0) * diffuseIntegral +
    areaLTC_specular(light, receiver, normal, view, roughness, reflectance0, reflectance90);
}
#endif
`,w_=`
layout(std140) uniform areaLightingUniforms {
  int lightCount;
  int sampleCount;
  AreaLightUniform lights[4];
} areaLighting;

int areaLighting_getLightCount() { return lighting.areaLightCount + areaLighting.lightCount; }
AreaLightUniform areaLighting_getLight(int index) {
  if (index < lighting.areaLightCount) return lighting.areaLights[index];
  return areaLighting.lights[index - lighting.areaLightCount];
}

PointLight areaLighting_getSample(int lightIndex, int sampleIndex, vec3 receiver) {
  AreaLightUniform light = areaLighting_getLight(lightIndex);
  int grid = int(sqrt(float(areaLighting.sampleCount)));
  vec2 coordinate = (vec2(float(sampleIndex % grid), float(sampleIndex / grid)) + 0.5) / float(grid);
  float area = 4.0 * length(light.halfAxisX) * length(light.halfAxisY);
  if (light.disk != 0) {
    float radius = sqrt(coordinate.y);
    float angle = coordinate.x * 6.28318530718;
    coordinate = radius * vec2(cos(angle), sin(angle));
    area *= 0.785398163397;
  } else {
    coordinate = coordinate * 2.0 - 1.0;
  }
  vec3 position = light.position + coordinate.x * light.halfAxisX + coordinate.y * light.halfAxisY;
  vec3 displacement = receiver - position;
  float distanceSquared = max(dot(displacement, displacement), 0.000001);
  float emissionCosine = max(dot(light.normal, displacement * inversesqrt(distanceSquared)), 0.0);
  return PointLight(light.color * (area * emissionCosine / (float(areaLighting.sampleCount) * distanceSquared)), position, vec3(1.0, 0.0, 0.0));
}
`,T_={name:`areaLighting`,props:{},uniforms:{},dependencies:[u_],defaultUniforms:{lightCount:0,sampleCount:64,lights:Array.from({length:4},i_)},uniformTypes:{lightCount:`i32`,sampleCount:`i32`,lights:[a_,4]},bindingLayout:[{name:`areaLighting`,group:2},{name:`areaLTCMatrix`,group:2},{name:`areaLTCAmplitude`,group:2}],source:`
struct AreaLightingUniforms {
  lightCount: i32,
  sampleCount: i32,
  lights: array<AreaLightUniform, 4>,
};
@group(2) @binding(auto) var<uniform> areaLighting: AreaLightingUniforms;

fn areaLighting_getLightCount() -> i32 { return lighting.areaLightCount + areaLighting.lightCount; }
fn areaLighting_getLight(index: i32) -> AreaLightUniform {
  if (index < lighting.areaLightCount) { return lighting.areaLights[index]; }
  return areaLighting.lights[index - lighting.areaLightCount];
}

fn areaLighting_getSample(lightIndex: i32, sampleIndex: i32, receiver: vec3f) -> PointLight {
  let light = areaLighting_getLight(lightIndex);
  let grid = i32(sqrt(f32(areaLighting.sampleCount)));
  var coordinate = (vec2f(f32(sampleIndex % grid), f32(sampleIndex / grid)) + 0.5) / f32(grid);
  var area = 4.0 * length(light.halfAxisX) * length(light.halfAxisY);
  if (light.disk != 0) {
    let radius = sqrt(coordinate.y);
    let angle = coordinate.x * 6.28318530718;
    coordinate = radius * vec2f(cos(angle), sin(angle));
    area *= 0.785398163397;
  } else {
    coordinate = coordinate * 2.0 - 1.0;
  }
  let position = light.position + coordinate.x * light.halfAxisX + coordinate.y * light.halfAxisY;
  let displacement = receiver - position;
  let distanceSquared = max(dot(displacement, displacement), 0.000001);
  let emissionCosine = max(dot(light.normal, displacement * inverseSqrt(distanceSquared)), 0.0);
  return PointLight(light.color * (area * emissionCosine / (f32(areaLighting.sampleCount) * distanceSquared)), position, vec3f(1.0, 0.0, 0.0));
}
`+C_,vs:w_+S_,fs:w_+S_,getUniforms(e={}){let t=e.lights||[];return{lightCount:Math.min(t.length,4),sampleCount:e.sampleCount||64,lights:o_(t,e.useByteColors)}}},E_=`out vec3 pbr_vPosition;
out vec2 pbr_vUV0;
out vec2 pbr_vUV1;

#ifdef HAS_NORMALS
# ifdef HAS_TANGENTS
out mat3 pbr_vTBN;
# else
out vec3 pbr_vNormal;
# endif
#endif

void pbr_setPositionNormalTangentUV(
  vec4 position,
  vec4 normal,
  vec4 tangent,
  vec2 uv0,
  vec2 uv1
)
{
  vec4 pos = pbrProjection.modelMatrix * position;
  pbr_vPosition = vec3(pos.xyz) / pos.w;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
  vec3 normalW = normalize(vec3(pbrProjection.normalMatrix * vec4(normal.xyz, 0.0)));
  vec3 tangentW = normalize(vec3(pbrProjection.modelMatrix * vec4(tangent.xyz, 0.0)));
  vec3 bitangentW = cross(normalW, tangentW) * tangent.w;
  pbr_vTBN = mat3(tangentW, bitangentW, normalW);
#else // HAS_TANGENTS != 1
  pbr_vNormal = normalize(vec3(pbrProjection.normalMatrix * vec4(normal.xyz, 0.0)));
#endif
#endif

#ifdef HAS_UV
  pbr_vUV0 = uv0;
#else
  pbr_vUV0 = vec2(0.,0.);
#endif

  pbr_vUV1 = uv1;
}
`,D_=`precision highp float;

layout(std140) uniform pbrMaterialUniforms {
  // Material is unlit
  bool unlit;

  // Base color map
  bool baseColorMapEnabled;
  vec4 baseColorFactor;

  bool normalMapEnabled;  
  float normalScale; // #ifdef HAS_NORMALMAP

  bool emissiveMapEnabled;
  vec3 emissiveFactor; // #ifdef HAS_EMISSIVEMAP

  vec2 metallicRoughnessValues;
  bool metallicRoughnessMapEnabled;

  bool occlusionMapEnabled;
  float occlusionStrength; // #ifdef HAS_OCCLUSIONMAP
  
  bool alphaCutoffEnabled;
  float alphaCutoff; // #ifdef ALPHA_CUTOFF

  vec3 specularColorFactor;
  float specularIntensityFactor;
  bool specularColorMapEnabled;
  bool specularIntensityMapEnabled;

  float ior;

  float transmissionFactor;
  bool transmissionMapEnabled;

  float thicknessFactor;
  float attenuationDistance;
  vec3 attenuationColor;

  float clearcoatFactor;
  float clearcoatRoughnessFactor;
  bool clearcoatMapEnabled;
  bool clearcoatRoughnessMapEnabled;

  vec3 sheenColorFactor;
  float sheenRoughnessFactor;
  bool sheenColorMapEnabled;
  bool sheenRoughnessMapEnabled;

  float iridescenceFactor;
  float iridescenceIor;
  vec2 iridescenceThicknessRange;
  bool iridescenceMapEnabled;

  float anisotropyStrength;
  float anisotropyRotation;
  vec2 anisotropyDirection;
  bool anisotropyMapEnabled;

  float emissiveStrength;
  float dispersion;
  
  // IBL
  bool IBLenabled;
  vec2 scaleIBLAmbient; // #ifdef USE_IBL
  
  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  vec4 scaleDiffBaseMR;
  vec4 scaleFGDSpec;
  // #endif

  int baseColorUVSet;
  mat3 baseColorUVTransform;
  int metallicRoughnessUVSet;
  mat3 metallicRoughnessUVTransform;
  int normalUVSet;
  mat3 normalUVTransform;
  int occlusionUVSet;
  mat3 occlusionUVTransform;
  int emissiveUVSet;
  mat3 emissiveUVTransform;
  int specularColorUVSet;
  mat3 specularColorUVTransform;
  int specularIntensityUVSet;
  mat3 specularIntensityUVTransform;
  int transmissionUVSet;
  mat3 transmissionUVTransform;
  int thicknessUVSet;
  mat3 thicknessUVTransform;
  int clearcoatUVSet;
  mat3 clearcoatUVTransform;
  int clearcoatRoughnessUVSet;
  mat3 clearcoatRoughnessUVTransform;
  int clearcoatNormalUVSet;
  mat3 clearcoatNormalUVTransform;
  int sheenColorUVSet;
  mat3 sheenColorUVTransform;
  int sheenRoughnessUVSet;
  mat3 sheenRoughnessUVTransform;
  int iridescenceUVSet;
  mat3 iridescenceUVTransform;
  int iridescenceThicknessUVSet;
  mat3 iridescenceThicknessUVTransform;
  int anisotropyUVSet;
  mat3 anisotropyUVTransform;

  float bumpFactor;
  bool bumpMapEnabled;
  float diffuseTransmissionFactor;
  bool diffuseTransmissionMapEnabled;
  vec3 diffuseTransmissionColorFactor;
  bool diffuseTransmissionColorMapEnabled;
  vec3 multiscatterColorFactor;
  bool multiscatterColorMapEnabled;
  float scatterAnisotropy;

  int bumpUVSet;
  mat3 bumpUVTransform;
  int diffuseTransmissionUVSet;
  mat3 diffuseTransmissionUVTransform;
  int diffuseTransmissionColorUVSet;
  mat3 diffuseTransmissionColorUVTransform;
  int multiscatterColorUVSet;
  mat3 multiscatterColorUVTransform;
  bool lightmapMapEnabled;
  float lightmapIntensity;
  int lightmapUVSet;
  mat3 lightmapUVTransform;
  float scatterStrengthFactor;
} pbrMaterial;

// Samplers
#ifdef HAS_BASECOLORMAP
uniform sampler2D pbr_baseColorSampler;
#endif
#ifdef HAS_NORMALMAP
uniform sampler2D pbr_normalSampler;
#endif
#ifdef HAS_EMISSIVEMAP
uniform sampler2D pbr_emissiveSampler;
#endif
#ifdef HAS_LIGHTMAP
uniform sampler2D pbr_lightmapSampler;
#endif
#ifdef HAS_METALROUGHNESSMAP
uniform sampler2D pbr_metallicRoughnessSampler;
#endif
#ifdef HAS_OCCLUSIONMAP
uniform sampler2D pbr_occlusionSampler;
#endif
#ifdef HAS_SPECULARCOLORMAP
uniform sampler2D pbr_specularColorSampler;
#endif
#ifdef HAS_SPECULARINTENSITYMAP
uniform sampler2D pbr_specularIntensitySampler;
#endif
#ifdef HAS_TRANSMISSIONMAP
uniform sampler2D pbr_transmissionSampler;
#endif
#ifdef HAS_THICKNESSMAP
uniform sampler2D pbr_thicknessSampler;
#endif
#ifdef HAS_CLEARCOATMAP
uniform sampler2D pbr_clearcoatSampler;
#endif
#ifdef HAS_CLEARCOATROUGHNESSMAP
uniform sampler2D pbr_clearcoatRoughnessSampler;
#endif
#ifdef HAS_CLEARCOATNORMALMAP
uniform sampler2D pbr_clearcoatNormalSampler;
#endif
#ifdef HAS_SHEENCOLORMAP
uniform sampler2D pbr_sheenColorSampler;
#endif
#ifdef HAS_SHEENROUGHNESSMAP
uniform sampler2D pbr_sheenRoughnessSampler;
#endif
#ifdef HAS_IRIDESCENCEMAP
uniform sampler2D pbr_iridescenceSampler;
#endif
#ifdef HAS_IRIDESCENCETHICKNESSMAP
uniform sampler2D pbr_iridescenceThicknessSampler;
#endif
#ifdef HAS_ANISOTROPYMAP
uniform sampler2D pbr_anisotropySampler;
#endif
#ifdef HAS_BUMPMAP
uniform sampler2D pbr_bumpSampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONMAP
uniform sampler2D pbr_diffuseTransmissionSampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
uniform sampler2D pbr_diffuseTransmissionColorSampler;
#endif
#ifdef HAS_MULTISCATTERCOLORMAP
uniform sampler2D pbr_multiscatterColorSampler;
#endif
// Inputs from vertex shader

in vec3 pbr_vPosition;
in vec2 pbr_vUV0;
in vec2 pbr_vUV1;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
in mat3 pbr_vTBN;
#else
in vec3 pbr_vNormal;
#endif
#endif

// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.
struct PBRInfo {
  float NdotL;                  // cos angle between normal and light direction
  float NdotV;                  // cos angle between normal and view direction
  float NdotH;                  // cos angle between normal and half vector
  float LdotH;                  // cos angle between light direction and half vector
  float VdotH;                  // cos angle between view direction and half vector
  float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
  float metalness;              // metallic value at the surface
  vec3 reflectance0;            // full reflectance color (normal incidence angle)
  vec3 reflectance90;           // reflectance color at grazing angle
  float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
  vec3 diffuseColor;            // color contribution from diffuse lighting
  vec3 specularColor;           // color contribution from specular lighting
  vec3 n;                       // normal at surface point
  vec3 v;                       // vector from surface point to camera
  vec3 l;                       // direction from the surface toward the current light
  vec3 h;                       // half vector between the current light and camera
};

const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

// Widen sub-pixel specular lobes using the screen-space normal footprint.
// This is geometric specular antialiasing: the normal variance is converted
// into an additional squared perceptual roughness before evaluating BRDFs.
float widenSpecularRoughness(float perceptualRoughness, vec3 normal)
{
  vec3 normalDerivativeX = dFdx(normal);
  vec3 normalDerivativeY = dFdy(normal);
  float normalVariance =
    dot(normalDerivativeX, normalDerivativeX) +
    dot(normalDerivativeY, normalDerivativeY);
  float kernelRoughnessSquared = min(2.0 * normalVariance, 1.0);
  return clamp(
    sqrt(perceptualRoughness * perceptualRoughness + kernelRoughnessSquared),
    c_MinRoughness,
    1.0
  );
}

vec3 calculateFinalColor(PBRInfo pbrInfo, vec3 lightColor);

vec4 SRGBtoLINEAR(vec4 srgbIn)
{
#ifdef MANUAL_SRGB
#ifdef SRGB_FAST_APPROXIMATION
  vec3 linOut = pow(srgbIn.xyz,vec3(2.2));
#else // SRGB_FAST_APPROXIMATION
  vec3 bLess = step(vec3(0.04045),srgbIn.xyz);
  vec3 linOut = mix( srgbIn.xyz/vec3(12.92), pow((srgbIn.xyz+vec3(0.055))/vec3(1.055),vec3(2.4)), bLess );
#endif //SRGB_FAST_APPROXIMATION
  return vec4(linOut,srgbIn.w);;
#else //MANUAL_SRGB
  return srgbIn;
#endif //MANUAL_SRGB
}

vec2 getMaterialUV(int uvSet, mat3 uvTransform)
{
  vec2 baseUV = uvSet == 1 ? pbr_vUV1 : pbr_vUV0;
  return (uvTransform * vec3(baseUV, 1.0)).xy;
}

// Build the tangent basis from interpolated attributes or screen-space derivatives.
mat3 getTBN(vec2 uv)
{
#ifndef HAS_TANGENTS
  vec3 pos_dx = dFdx(pbr_vPosition);
  vec3 pos_dy = dFdy(pbr_vPosition);
  vec3 tex_dx = dFdx(vec3(uv, 0.0));
  vec3 tex_dy = dFdy(vec3(uv, 0.0));
  vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

#ifdef HAS_NORMALS
  vec3 ng = normalize(pbr_vNormal);
#else
  vec3 ng = cross(pos_dx, pos_dy);
#endif

  t = normalize(t - ng * dot(ng, t));
  vec3 b = normalize(cross(ng, t));
  mat3 tbn = mat3(t, b, ng);
#else // HAS_TANGENTS
  mat3 tbn = pbr_vTBN;
#endif

#ifdef DOUBLE_SIDED
#ifdef HAS_NORMALS
  // Derivative normals already face the viewer; only flip an authored basis.
  if (!gl_FrontFacing) tbn = mat3(-tbn[0], -tbn[1], -tbn[2]);
#endif
#endif
  return tbn;
}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
vec3 getMappedNormal(sampler2D normalSampler, mat3 tbn, float normalScale, vec2 uv)
{
  vec3 n = texture(normalSampler, uv).rgb;
  return normalize(tbn * ((2.0 * n - 1.0) * vec3(normalScale, normalScale, 1.0)));
}

vec3 getNormal(mat3 tbn, vec2 uv)
{
#ifdef HAS_NORMALMAP
  vec3 n = getMappedNormal(pbr_normalSampler, tbn, pbrMaterial.normalScale, uv);
#else
  // The tbn matrix is linearly interpolated, so we need to re-normalize
  vec3 n = normalize(tbn[2].xyz);
#endif

#ifdef HAS_BUMPMAP
  vec2 bumpUV = getMaterialUV(pbrMaterial.bumpUVSet, pbrMaterial.bumpUVTransform);
  vec2 bumpTexelSize = 1.0 / vec2(textureSize(pbr_bumpSampler, 0));
  float bumpHeight = texture(pbr_bumpSampler, bumpUV).r;
  vec2 bumpGradient = vec2(
    texture(pbr_bumpSampler, bumpUV + vec2(bumpTexelSize.x, 0.0)).r - bumpHeight,
    texture(pbr_bumpSampler, bumpUV + vec2(0.0, bumpTexelSize.y)).r - bumpHeight
  );
  n = normalize(n - pbrMaterial.bumpFactor *
    (tbn[0] * bumpGradient.x + tbn[1] * bumpGradient.y));
#endif

  return n;
}

vec3 getClearcoatNormal(mat3 tbn, vec3 baseNormal, vec2 uv)
{
#ifdef HAS_CLEARCOATNORMALMAP
  return getMappedNormal(pbr_clearcoatNormalSampler, tbn, 1.0, uv);
#else
  return baseNormal;
#endif
}

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
#ifdef USE_IBL
vec3 getIBLContribution(PBRInfo pbrInfo, vec3 n, vec3 reflection)
{
#ifdef USE_SCENE_ENVIRONMENT
  float maximumMipLevel = max(pbrScene.environmentMipCount - 1.0, 0.0);
  float rotationSine = sin(pbrScene.environmentRotation);
  float rotationCosine = cos(pbrScene.environmentRotation);
  mat2 environmentRotation = mat2(rotationCosine, rotationSine, -rotationSine, rotationCosine);
  vec3 environmentNormal = vec3(environmentRotation * n.xz, n.y).xzy;
  vec3 environmentReflection = vec3(environmentRotation * reflection.xz, reflection.y).xzy;
#else
  float maximumMipLevel = 9.0;
  vec3 environmentNormal = n;
  vec3 environmentReflection = reflection;
#endif
  float lod = pbrInfo.perceptualRoughness * maximumMipLevel;
  // retrieve a scale and bias to F0. See [1], Figure 3
  vec4 brdfSample = texture(pbr_brdfLUT,
    vec2(pbrInfo.NdotV, 1.0 - pbrInfo.perceptualRoughness));
  vec4 diffuseSample = texture(pbr_diffuseEnvSampler, environmentNormal);

#ifdef USE_TEX_LOD
  vec4 specularSample = textureLod(pbr_specularEnvSampler, environmentReflection, lod);
#else
  vec4 specularSample = texture(pbr_specularEnvSampler, environmentReflection);
#endif

#ifdef USE_SCENE_ENVIRONMENT
  vec3 brdf = brdfSample.rgb;
  vec3 diffuseLight = diffuseSample.rgb;
  vec3 specularLight = specularSample.rgb;
#else
  vec3 brdf = SRGBtoLINEAR(brdfSample).rgb;
  vec3 diffuseLight = SRGBtoLINEAR(diffuseSample).rgb;
  vec3 specularLight = SRGBtoLINEAR(specularSample).rgb;
#endif

  vec3 diffuse = diffuseLight * pbrInfo.diffuseColor;
  vec3 specular = specularLight * (pbrInfo.specularColor * brdf.x + brdf.y);

  // For presentation, this allows us to disable IBL terms
  diffuse *= pbrMaterial.scaleIBLAmbient.x;
  specular *= pbrMaterial.scaleIBLAmbient.y;

#ifdef USE_SCENE_ENVIRONMENT
  return (diffuse + specular) * max(pbrScene.environmentIntensity, 0.0);
#else
  return diffuse + specular;
#endif
}
#endif

// Basic Lambertian diffuse
// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
// See also [1], Equation 1
vec3 diffuse(PBRInfo pbrInfo)
{
  return pbrInfo.diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 specularReflection(PBRInfo pbrInfo)
{
  return pbrInfo.reflectance0 +
    (pbrInfo.reflectance90 - pbrInfo.reflectance0) *
    pow(clamp(1.0 - pbrInfo.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
float geometricOcclusion(PBRInfo pbrInfo)
{
  float NdotL = pbrInfo.NdotL;
  float NdotV = pbrInfo.NdotV;
  float r = pbrInfo.alphaRoughness;

  float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
  float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
  return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across
// the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface
// for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes
// from EPIC Games [1], Equation 3.
float microfacetDistribution(PBRInfo pbrInfo)
{
  float roughnessSq = pbrInfo.alphaRoughness * pbrInfo.alphaRoughness;
  float f = (pbrInfo.NdotH * roughnessSq - pbrInfo.NdotH) * pbrInfo.NdotH + 1.0;
  return roughnessSq / (M_PI * f * f);
}

float maxComponent(vec3 value)
{
  return max(max(value.r, value.g), value.b);
}

float getDielectricF0(float ior)
{
  float clampedIor = max(ior, 1.0);
  float ratio = (clampedIor - 1.0) / (clampedIor + 1.0);
  return ratio * ratio;
}

vec2 normalizeDirection(vec2 direction)
{
  float directionLength = length(direction);
  return directionLength > 0.0001 ? direction / directionLength : vec2(1.0, 0.0);
}

vec2 rotateDirection(vec2 direction, float rotation)
{
  float s = sin(rotation);
  float c = cos(rotation);
  return vec2(direction.x * c - direction.y * s, direction.x * s + direction.y * c);
}

vec3 encodeLinearSRGB(vec3 linearColor)
{
  vec3 positiveColor = max(linearColor, vec3(0.0));
  return mix(
    positiveColor * 12.92,
    1.055 * pow(positiveColor, vec3(1.0 / 2.4)) - 0.055,
    greaterThan(positiveColor, vec3(0.0031308))
  );
}

vec3 toneMapKhronosPBRNeutral(vec3 color)
{
  const float startCompression = 0.76;
  float darkestChannel = min(color.r, min(color.g, color.b));
  float offset = darkestChannel < 0.08
    ? darkestChannel - 6.25 * darkestChannel * darkestChannel
    : 0.04;
  color -= vec3(offset);

  float peak = maxComponent(color);
  if (peak < startCompression) {
    return color;
  }

  float compressionRange = 1.0 - startCompression;
  float compressedPeak = 1.0 - compressionRange * compressionRange /
    (peak + compressionRange - startCompression);
  color *= compressedPeak / max(peak, 0.0001);
  float desaturation = 1.0 - 1.0 / (0.15 * (peak - compressedPeak) + 1.0);
  return mix(color, vec3(compressedPeak), desaturation);
}

vec3 applySceneColorManagement(vec3 sceneColor)
{
#ifdef USE_SCENE_COLOR_MANAGEMENT
  vec3 color = max(sceneColor, vec3(0.0)) * max(pbrScene.exposure, 0.0);
  if (pbrScene.toneMapMode == 1) {
    color /= vec3(1.0) + color;
  } else if (pbrScene.toneMapMode == 2) {
    color = toneMapKhronosPBRNeutral(color);
  } else if (pbrScene.toneMapMode == 3) {
    color = clamp(
      (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14),
      vec3(0.0),
      vec3(1.0)
    );
  }
  return pbrScene.outputEncoding == 0 ? color : encodeLinearSRGB(color);
#else
  return pow(max(sceneColor, vec3(0.0)), vec3(1.0 / 2.2));
#endif
}

float dielectricSchlick(float reflectance, float cosine)
{
  return reflectance + (1.0 - reflectance) * pow(clamp(1.0 - cosine, 0.0, 1.0), 5.0);
}

vec3 evaluateIridescenceSensitivity(float opticalPathDifference, vec3 phaseShift)
{
  float phase = 2.0 * M_PI * opticalPathDifference * 1.0e-9;
  vec3 sensitivity = vec3(5.4856e-13, 4.4201e-13, 5.2481e-13);
  vec3 position = vec3(1.6810e6, 1.7953e6, 2.2084e6);
  vec3 variance = vec3(4.3278e9, 9.3046e9, 6.6121e9);
  vec3 xyz = sensitivity * sqrt(2.0 * M_PI * variance) *
    cos(position * phase + phaseShift) * exp(-phase * phase * variance);
  xyz.x += 9.7470e-14 * sqrt(2.0 * M_PI * 4.5282e9) *
    cos(2.2399e6 * phase + phaseShift.x) * exp(-4.5282e9 * phase * phase);
  xyz /= 1.0685e-7;
  return mat3(
    3.2404542, -0.9692660, 0.0556434,
    -1.5371385, 1.8760108, -0.2040259,
    -0.4985314, 0.0415560, 1.0572252
  ) * xyz;
}

vec3 getIridescenceTint(float iridescence, float thickness, float NdotV, vec3 baseReflectance)
{
  if (iridescence <= 0.0 || thickness <= 0.0) {
    return baseReflectance;
  }

  float filmIor = max(pbrMaterial.iridescenceIor, 1.0);
  float sineSquared = (1.0 - NdotV * NdotV) / (filmIor * filmIor);
  float cosineSquared = 1.0 - sineSquared;
  if (cosineSquared <= 0.0) {
    return mix(baseReflectance, vec3(1.0), iridescence);
  }
  float filmCosine = sqrt(cosineSquared);
  float firstInterfaceReflectance = dielectricSchlick(getDielectricF0(filmIor), NdotV);
  float transmittedEnergy = 1.0 - firstInterfaceReflectance;

  vec3 baseIor = (vec3(1.0) + sqrt(clamp(baseReflectance, vec3(0.0), vec3(0.9999)))) /
    (vec3(1.0) - sqrt(clamp(baseReflectance, vec3(0.0), vec3(0.9999))));
  vec3 secondInterfaceF0 = (baseIor - vec3(filmIor)) / (baseIor + vec3(filmIor));
  secondInterfaceF0 *= secondInterfaceF0;
  vec3 secondInterfaceReflectance = secondInterfaceF0 +
    (vec3(1.0) - secondInterfaceF0) * pow(1.0 - filmCosine, 5.0);
  vec3 phaseShift = vec3(M_PI);
  phaseShift += mix(vec3(0.0), vec3(M_PI), lessThan(baseIor, vec3(filmIor)));
  float opticalPathDifference = 2.0 * filmIor * thickness * filmCosine;
  vec3 combinedReflectance = clamp(
    firstInterfaceReflectance * secondInterfaceReflectance,
    vec3(0.00001),
    vec3(0.9999)
  );
  vec3 recurringAmplitude = sqrt(combinedReflectance);
  vec3 interfaceResponse = transmittedEnergy * transmittedEnergy * secondInterfaceReflectance /
    (vec3(1.0) - combinedReflectance);
  vec3 reflectedSpectrum = vec3(firstInterfaceReflectance) + interfaceResponse;
  vec3 harmonicAmplitude = interfaceResponse - vec3(transmittedEnergy);
  for (int harmonic = 1; harmonic <= 2; harmonic++) {
    harmonicAmplitude *= recurringAmplitude;
    reflectedSpectrum += harmonicAmplitude * 2.0 * evaluateIridescenceSensitivity(
      float(harmonic) * opticalPathDifference,
      float(harmonic) * phaseShift
    );
  }
  return mix(baseReflectance, clamp(reflectedSpectrum, vec3(0.0), vec3(1.0)), iridescence);
}

vec3 getVolumeAttenuation(float thickness)
{
  if (thickness <= 0.0) {
    return vec3(1.0);
  }

  vec3 attenuationCoefficient =
    -log(max(pbrMaterial.attenuationColor, vec3(0.0001))) /
    max(pbrMaterial.attenuationDistance, 0.0001);
  return exp(-attenuationCoefficient * thickness);
}

// KHR_materials_volume_scatter is an active draft. This evaluates a local,
// thickness-aware single-scattering approximation rather than random walk.
vec3 getDiffuseTransmissionAttenuation(
  PBRInfo pbrInfo,
  vec3 multiscatterColor,
  float thickness
)
{
  vec3 volumeAttenuation = getVolumeAttenuation(thickness);
  float scatteringStrength = maxComponent(multiscatterColor);
  if (thickness <= 0.0 || scatteringStrength <= 0.0001) {
    return volumeAttenuation;
  }

  float anisotropy = clamp(pbrMaterial.scatterAnisotropy, -0.95, 0.95);
  float scatteringCosine = clamp(dot(-pbrInfo.v, pbrInfo.l), -1.0, 1.0);
  float phaseDenominator = max(
    1.0 + anisotropy * anisotropy - 2.0 * anisotropy * scatteringCosine,
    0.0001
  );
  float phaseWeight = clamp(
    (1.0 - anisotropy * anisotropy) / pow(phaseDenominator, 1.5),
    0.0,
    4.0
  );
  float scatteringDepth = thickness / max(pbrMaterial.attenuationDistance, 0.0001);
  float scatteringProbability = 1.0 - exp(-scatteringDepth);
  vec3 scatteringColor = clamp(multiscatterColor, vec3(0.0), vec3(1.0));
  return mix(
    volumeAttenuation,
    volumeAttenuation * mix(vec3(1.0), scatteringColor * phaseWeight, scatteringColor),
    scatteringProbability
  );
}

vec3 calculateDiffuseTransmissionLight(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 diffuseTransmissionColor,
  float diffuseTransmission,
  vec3 multiscatterColor,
  float thickness
)
{
  float oppositeHemisphere = max(dot(-pbrInfo.n, pbrInfo.l), 0.0);
  if (oppositeHemisphere <= 0.0 || diffuseTransmission <= 0.0) {
    return vec3(0.0);
  }

  vec3 nonReflectedEnergy = vec3(1.0) - clamp(pbrInfo.reflectance0, vec3(0.0), vec3(1.0));
  vec3 attenuatedColor = getDiffuseTransmissionAttenuation(
    pbrInfo,
    multiscatterColor,
    thickness
  );
  return lightColor * diffuseTransmissionColor * nonReflectedEnergy *
    attenuatedColor * (diffuseTransmission * oppositeHemisphere / M_PI);
}

#ifdef USE_IBL
vec3 calculateDiffuseTransmissionIBL(
  PBRInfo pbrInfo,
  vec3 diffuseTransmissionColor,
  float diffuseTransmission,
  vec3 multiscatterColor,
  float thickness
)
{
  if (diffuseTransmission <= 0.0) {
    return vec3(0.0);
  }

#ifdef USE_SCENE_ENVIRONMENT
  float rotationSine = sin(pbrScene.environmentRotation);
  float rotationCosine = cos(pbrScene.environmentRotation);
  mat2 environmentRotation = mat2(rotationCosine, rotationSine, -rotationSine, rotationCosine);
  vec3 oppositeNormal = vec3(environmentRotation * -pbrInfo.n.xz, -pbrInfo.n.y).xzy;
  vec3 environmentColor = texture(pbr_diffuseEnvSampler, oppositeNormal).rgb *
    max(pbrScene.environmentIntensity, 0.0);
#else
  vec3 environmentColor = SRGBtoLINEAR(texture(pbr_diffuseEnvSampler, -pbrInfo.n)).rgb;
#endif
  vec3 nonReflectedEnergy = vec3(1.0) - clamp(pbrInfo.reflectance0, vec3(0.0), vec3(1.0));
  return environmentColor * diffuseTransmissionColor * nonReflectedEnergy *
    getDiffuseTransmissionAttenuation(pbrInfo, multiscatterColor, thickness) *
    diffuseTransmission * pbrMaterial.scaleIBLAmbient.x;
}
#endif

#ifdef USE_TRANSMISSION_FRAMEBUFFER
vec3 sampleTransmittedSceneColor(
  vec3 position,
  vec3 normal,
  vec3 viewDirection,
  float thickness,
  float perceptualRoughness,
  float indexOfRefraction
)
{
  vec3 refractionDirection = refract(
    -viewDirection,
    normal,
    1.0 / max(indexOfRefraction, 1.0)
  );
  vec3 refractedPosition = position + refractionDirection * thickness;
  vec4 clipPosition = pbrScene.projectionMatrix *
    pbrScene.viewMatrix * vec4(refractedPosition, 1.0);
  vec2 textureCoordinate = clipPosition.xy / max(clipPosition.w, 0.0001) * 0.5 + 0.5;
  textureCoordinate = clamp(textureCoordinate, vec2(0.001), vec2(0.999));

  vec2 blurRadius = perceptualRoughness * perceptualRoughness * 8.0 /
    max(pbrScene.framebufferSize, vec2(1.0));
  vec3 sceneColor = texture(pbr_transmissionFramebufferSampler, textureCoordinate).rgb * 0.4;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate + vec2(blurRadius.x, 0.0)
  ).rgb * 0.15;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate - vec2(blurRadius.x, 0.0)
  ).rgb * 0.15;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate + vec2(0.0, blurRadius.y)
  ).rgb * 0.15;
  sceneColor += texture(
    pbr_transmissionFramebufferSampler,
    textureCoordinate - vec2(0.0, blurRadius.y)
  ).rgb * 0.15;
  return max(sceneColor, vec3(0.0));
}

vec3 getTransmittedSceneColor(
  vec3 position,
  vec3 normal,
  vec3 viewDirection,
  float thickness,
  float perceptualRoughness
)
{
  if (pbrMaterial.dispersion <= 0.0) {
    return sampleTransmittedSceneColor(
      position,
      normal,
      viewDirection,
      thickness,
      perceptualRoughness,
      pbrMaterial.ior
    );
  }

  float halfSpread = (max(pbrMaterial.ior, 1.0) - 1.0) * 0.025 * pbrMaterial.dispersion;
  vec3 indicesOfRefraction = max(
    vec3(pbrMaterial.ior - halfSpread, pbrMaterial.ior, pbrMaterial.ior + halfSpread),
    vec3(1.0)
  );
  return vec3(
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.r
    ).r,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.g
    ).g,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.b
    ).b
  );
}
#endif

PBRInfo createClearcoatPBRInfo(PBRInfo basePBRInfo, vec3 clearcoatNormal, float clearcoatRoughness)
{
  float perceptualRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
  float alphaRoughness = perceptualRoughness * perceptualRoughness;
  float NdotV = clamp(abs(dot(clearcoatNormal, basePBRInfo.v)), 0.001, 1.0);

  return PBRInfo(
    basePBRInfo.NdotL,
    NdotV,
    basePBRInfo.NdotH,
    basePBRInfo.LdotH,
    basePBRInfo.VdotH,
    perceptualRoughness,
    0.0,
    vec3(0.04),
    vec3(1.0),
    alphaRoughness,
    vec3(0.0),
    vec3(0.04),
    clearcoatNormal,
    basePBRInfo.v,
    basePBRInfo.l,
    basePBRInfo.h
  );
}

vec3 calculateClearcoatContribution(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 clearcoatNormal,
  float clearcoatFactor,
  float clearcoatRoughness
) {
  if (clearcoatFactor <= 0.0) {
    return vec3(0.0);
  }

  PBRInfo clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return calculateFinalColor(clearcoatPBRInfo, lightColor) * clearcoatFactor;
}

#ifdef USE_IBL
vec3 calculateClearcoatIBLContribution(
  PBRInfo pbrInfo,
  vec3 clearcoatNormal,
  vec3 reflection,
  float clearcoatFactor,
  float clearcoatRoughness
) {
  if (clearcoatFactor <= 0.0) {
    return vec3(0.0);
  }

  PBRInfo clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return getIBLContribution(clearcoatPBRInfo, clearcoatNormal, reflection) * clearcoatFactor;
}
#endif

vec3 calculateSheenContribution(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 sheenColor,
  float sheenRoughness
) {
  if (maxComponent(sheenColor) <= 0.0) {
    return vec3(0.0);
  }

  float alpha = max(sheenRoughness * sheenRoughness, 0.0001);
  float inverseAlpha = 1.0 / alpha;
  float sineSquared = max(1.0 - pbrInfo.NdotH * pbrInfo.NdotH, 0.0);
  float distribution = (2.0 + inverseAlpha) * pow(sineSquared, inverseAlpha * 0.5) /
    (2.0 * M_PI);
  float visibility = 1.0 / max(
    4.0 * (pbrInfo.NdotL + pbrInfo.NdotV - pbrInfo.NdotL * pbrInfo.NdotV),
    0.0001
  );
  return pbrInfo.NdotL * lightColor * sheenColor * distribution * visibility *
    (1.0 - pbrInfo.metalness);
}

vec3 calculateAnisotropicLightColor(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 anisotropyTangent,
  float anisotropyStrength
) {
  if (anisotropyStrength <= 0.0) {
    return calculateFinalColor(pbrInfo, lightColor);
  }

  vec3 anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  float tangentRoughness = mix(
    pbrInfo.alphaRoughness,
    1.0,
    anisotropyStrength * anisotropyStrength
  );
  float bitangentRoughness = clamp(pbrInfo.alphaRoughness, 0.001, 1.0);
  float roughnessProduct = tangentRoughness * bitangentRoughness;
  vec3 distributionVector = vec3(
    bitangentRoughness * dot(anisotropyTangent, pbrInfo.h),
    tangentRoughness * dot(anisotropyBitangent, pbrInfo.h),
    roughnessProduct * pbrInfo.NdotH
  );
  float distributionFactor = roughnessProduct /
    max(dot(distributionVector, distributionVector), 0.000001);
  float distribution = roughnessProduct * distributionFactor * distributionFactor / M_PI;
  float viewMask = pbrInfo.NdotL * length(vec3(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.v),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.v),
    pbrInfo.NdotV
  ));
  float lightMask = pbrInfo.NdotV * length(vec3(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.l),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.l),
    pbrInfo.NdotL
  ));
  float visibility = clamp(0.5 / max(viewMask + lightMask, 0.000001), 0.0, 1.0);
  vec3 fresnel = specularReflection(pbrInfo);
  vec3 diffuseContribution = (vec3(1.0) - fresnel) * diffuse(pbrInfo);
  return pbrInfo.NdotL * lightColor *
    (diffuseContribution + fresnel * distribution * visibility);
}

vec3 getAnisotropicReflection(PBRInfo pbrInfo, vec3 anisotropyTangent, float anisotropyStrength)
{
  if (anisotropyStrength <= 0.0) {
    return -normalize(reflect(pbrInfo.v, pbrInfo.n));
  }
  vec3 anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  vec3 anisotropicNormal = normalize(cross(anisotropyBitangent, pbrInfo.v));
  anisotropicNormal = normalize(cross(anisotropicNormal, anisotropyBitangent));
  float bend = anisotropyStrength * (1.0 - pbrInfo.perceptualRoughness);
  return -normalize(reflect(pbrInfo.v, normalize(mix(pbrInfo.n, anisotropicNormal, bend))));
}

vec3 calculateMaterialLightColor(
  PBRInfo pbrInfo,
  vec3 lightColor,
  vec3 clearcoatNormal,
  float clearcoatFactor,
  float clearcoatRoughness,
  vec3 sheenColor,
  float sheenRoughness,
  vec3 anisotropyTangent,
  float anisotropyStrength
) {
  vec3 color = calculateAnisotropicLightColor(
    pbrInfo,
    lightColor,
    anisotropyTangent,
    anisotropyStrength
  );
  color += calculateClearcoatContribution(
    pbrInfo,
    lightColor,
    clearcoatNormal,
    clearcoatFactor,
    clearcoatRoughness
  );
  color += calculateSheenContribution(pbrInfo, lightColor, sheenColor, sheenRoughness);
  return color;
}

void PBRInfo_setAmbientLight(inout PBRInfo pbrInfo) {
  pbrInfo.NdotL = 1.0;
  pbrInfo.NdotH = 0.0;
  pbrInfo.LdotH = 0.0;
  pbrInfo.VdotH = 1.0;
  pbrInfo.l = pbrInfo.n;
  pbrInfo.h = pbrInfo.n;
}

void PBRInfo_setDirectionalLight(inout PBRInfo pbrInfo, vec3 lightDirection) {
  vec3 n = pbrInfo.n;
  vec3 v = pbrInfo.v;
  vec3 l = normalize(lightDirection);             // Vector from surface point to light
  vec3 h = normalize(l+v);                        // Half vector between both l and v

  pbrInfo.NdotL = clamp(dot(n, l), 0.001, 1.0);
  pbrInfo.NdotH = clamp(dot(n, h), 0.0, 1.0);
  pbrInfo.LdotH = clamp(dot(l, h), 0.0, 1.0);
  pbrInfo.VdotH = clamp(dot(v, h), 0.0, 1.0);
  pbrInfo.l = l;
  pbrInfo.h = h;
}

void PBRInfo_setPointLight(inout PBRInfo pbrInfo, PointLight pointLight) {
  vec3 light_direction = normalize(pointLight.position - pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

void PBRInfo_setSpotLight(inout PBRInfo pbrInfo, SpotLight spotLight) {
  vec3 light_direction = normalize(spotLight.position - pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

vec3 calculateFinalColor(PBRInfo pbrInfo, vec3 lightColor) {
  // Calculate the shading terms for the microfacet specular shading model
  vec3 F = specularReflection(pbrInfo);
  float G = geometricOcclusion(pbrInfo);
  float D = microfacetDistribution(pbrInfo);

  // Calculation of analytical lighting contribution
  vec3 diffuseContrib = (1.0 - F) * diffuse(pbrInfo);
  vec3 specContrib = F * G * D / (4.0 * pbrInfo.NdotL * pbrInfo.NdotV);
  // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
  return pbrInfo.NdotL * lightColor * (diffuseContrib + specContrib);
}

// Visibility for the first four spotlights; environment and other lights are unaffected.
float pbr_ambientVisibility = 1.0;

vec4 pbr_filterColorWithShadows(vec4 vertexColor, float directionalVisibility, vec4 pointVisibility, vec4 spotVisibility)
{
  vec2 baseColorUV = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  vec2 metallicRoughnessUV = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  vec2 normalUV = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  vec2 occlusionUV = getMaterialUV(pbrMaterial.occlusionUVSet, pbrMaterial.occlusionUVTransform);
  vec2 emissiveUV = getMaterialUV(pbrMaterial.emissiveUVSet, pbrMaterial.emissiveUVTransform);
  vec2 lightmapUV = getMaterialUV(pbrMaterial.lightmapUVSet, pbrMaterial.lightmapUVTransform);
  vec2 specularColorUV = getMaterialUV(
    pbrMaterial.specularColorUVSet,
    pbrMaterial.specularColorUVTransform
  );
  vec2 specularIntensityUV = getMaterialUV(
    pbrMaterial.specularIntensityUVSet,
    pbrMaterial.specularIntensityUVTransform
  );
  vec2 transmissionUV = getMaterialUV(
    pbrMaterial.transmissionUVSet,
    pbrMaterial.transmissionUVTransform
  );
  vec2 thicknessUV = getMaterialUV(pbrMaterial.thicknessUVSet, pbrMaterial.thicknessUVTransform);
  vec2 clearcoatUV = getMaterialUV(pbrMaterial.clearcoatUVSet, pbrMaterial.clearcoatUVTransform);
  vec2 clearcoatRoughnessUV = getMaterialUV(
    pbrMaterial.clearcoatRoughnessUVSet,
    pbrMaterial.clearcoatRoughnessUVTransform
  );
  vec2 clearcoatNormalUV = getMaterialUV(
    pbrMaterial.clearcoatNormalUVSet,
    pbrMaterial.clearcoatNormalUVTransform
  );
  vec2 sheenColorUV = getMaterialUV(
    pbrMaterial.sheenColorUVSet,
    pbrMaterial.sheenColorUVTransform
  );
  vec2 sheenRoughnessUV = getMaterialUV(
    pbrMaterial.sheenRoughnessUVSet,
    pbrMaterial.sheenRoughnessUVTransform
  );
  vec2 iridescenceUV = getMaterialUV(
    pbrMaterial.iridescenceUVSet,
    pbrMaterial.iridescenceUVTransform
  );
  vec2 iridescenceThicknessUV = getMaterialUV(
    pbrMaterial.iridescenceThicknessUVSet,
    pbrMaterial.iridescenceThicknessUVTransform
  );
  vec2 anisotropyUV = getMaterialUV(
    pbrMaterial.anisotropyUVSet,
    pbrMaterial.anisotropyUVTransform
  );
  vec2 diffuseTransmissionUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionUVSet,
    pbrMaterial.diffuseTransmissionUVTransform
  );
  vec2 diffuseTransmissionColorUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionColorUVSet,
    pbrMaterial.diffuseTransmissionColorUVTransform
  );
  vec2 multiscatterColorUV = getMaterialUV(
    pbrMaterial.multiscatterColorUVSet,
    pbrMaterial.multiscatterColorUVTransform
  );

  // The albedo may be defined from a base texture or a flat color
#ifdef HAS_BASECOLORMAP
  vec4 baseColor =
    SRGBtoLINEAR(texture(pbr_baseColorSampler, baseColorUV)) *
    pbrMaterial.baseColorFactor * vertexColor;
#else
  vec4 baseColor = pbrMaterial.baseColorFactor * vertexColor;
#endif

#ifdef ALPHA_CUTOFF
  if (baseColor.a < pbrMaterial.alphaCutoff) {
    discard;
  }
#endif

  vec3 color = vec3(0, 0, 0);

  float transmission = 0.0;

  vec3 lightmapIrradiance = vec3(0.0);
#ifdef HAS_LIGHTMAP
  if (pbrMaterial.lightmapMapEnabled) {
    lightmapIrradiance = texture(pbr_lightmapSampler, lightmapUV).rgb * pbrMaterial.lightmapIntensity;
  }
#endif

  if(pbrMaterial.unlit){
    color.rgb = baseColor.rgb;
#ifdef HAS_LIGHTMAP
    if (pbrMaterial.lightmapMapEnabled) {
      color *= lightmapIrradiance / M_PI * pbr_ambientVisibility;
#ifdef HAS_OCCLUSIONMAP
      if (pbrMaterial.occlusionMapEnabled) {
        float ao = texture(pbr_occlusionSampler, occlusionUV).r;
        color = mix(color, color * ao, pbrMaterial.occlusionStrength);
      }
#endif
    }
#endif
  }
  else{
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    float perceptualRoughness = pbrMaterial.metallicRoughnessValues.y;
    float metallic = pbrMaterial.metallicRoughnessValues.x;
#ifdef HAS_METALROUGHNESSMAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    vec4 mrSample = texture(pbr_metallicRoughnessSampler, metallicRoughnessUV);
    perceptualRoughness = mrSample.g * perceptualRoughness;
    metallic = mrSample.b * metallic;
#endif
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    mat3 tbn = getTBN(normalUV);
    vec3 n = getNormal(tbn, normalUV);                          // normal at surface point
    perceptualRoughness = widenSpecularRoughness(perceptualRoughness, n);
    vec3 v = normalize(pbrProjection.camera - pbr_vPosition);  // Vector from surface point to camera
    float NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
#ifdef USE_MATERIAL_EXTENSIONS
    bool useExtendedPBR =
      pbrMaterial.specularColorMapEnabled ||
      pbrMaterial.specularIntensityMapEnabled ||
      abs(pbrMaterial.specularIntensityFactor - 1.0) > 0.0001 ||
      maxComponent(abs(pbrMaterial.specularColorFactor - vec3(1.0))) > 0.0001 ||
      abs(pbrMaterial.ior - 1.5) > 0.0001 ||
      pbrMaterial.dispersion > 0.0001 ||
      pbrMaterial.transmissionMapEnabled ||
      pbrMaterial.transmissionFactor > 0.0001 ||
      pbrMaterial.diffuseTransmissionMapEnabled ||
      pbrMaterial.diffuseTransmissionColorMapEnabled ||
      pbrMaterial.diffuseTransmissionFactor > 0.0001 ||
      pbrMaterial.multiscatterColorMapEnabled ||
      maxComponent(pbrMaterial.multiscatterColorFactor) > 0.0001 ||
      pbrMaterial.clearcoatMapEnabled ||
      pbrMaterial.clearcoatRoughnessMapEnabled ||
      pbrMaterial.clearcoatFactor > 0.0001 ||
      pbrMaterial.clearcoatRoughnessFactor > 0.0001 ||
      pbrMaterial.sheenColorMapEnabled ||
      pbrMaterial.sheenRoughnessMapEnabled ||
      maxComponent(pbrMaterial.sheenColorFactor) > 0.0001 ||
      pbrMaterial.sheenRoughnessFactor > 0.0001 ||
      pbrMaterial.iridescenceMapEnabled ||
      pbrMaterial.iridescenceFactor > 0.0001 ||
      abs(pbrMaterial.iridescenceIor - 1.3) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.x - 100.0) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.y - 400.0) > 0.0001 ||
      pbrMaterial.anisotropyMapEnabled ||
      pbrMaterial.anisotropyStrength > 0.0001 ||
      abs(pbrMaterial.anisotropyRotation) > 0.0001 ||
      length(pbrMaterial.anisotropyDirection - vec2(1.0, 0.0)) > 0.0001;
#else
    bool useExtendedPBR = false;
#endif

    if (!useExtendedPBR) {
      // Keep the baseline metallic-roughness implementation byte-for-byte equivalent in behavior.
      float alphaRoughness = perceptualRoughness * perceptualRoughness;

      vec3 f0 = vec3(0.04);
      vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
      diffuseColor *= 1.0 - metallic;
      vec3 specularColor = mix(f0, baseColor.rgb, metallic);

      float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
      float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
      vec3 specularEnvironmentR0 = specularColor.rgb;
      vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;
      vec3 reflection = -normalize(reflect(v, n));

      PBRInfo pbrInfo = PBRInfo(
        0.0, // NdotL
        NdotV,
        0.0, // NdotH
        0.0, // LdotH
        0.0, // VdotH
        perceptualRoughness,
        metallic,
        specularEnvironmentR0,
        specularEnvironmentR90,
        alphaRoughness,
        diffuseColor,
        specularColor,
        n,
        v,
        n,
        n
      );

#ifdef USE_LIGHTS
      PBRInfo_setAmbientLight(pbrInfo);
      color += calculateFinalColor(pbrInfo, lighting.ambientColor * pbr_ambientVisibility);

      for(int i = 0; i < lighting.directionalLightCount; i++) {
        if (i < lighting.directionalLightCount) {
          PBRInfo_setDirectionalLight(pbrInfo, -lighting_getDirectionalLight(i).direction);
          color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color * (i == 0 ? clamp(directionalVisibility, 0.0, 1.0) : 1.0));
        }
      }

      for(int i = 0; i < lighting.pointLightCount; i++) {
        if (i < lighting.pointLightCount) {
          PBRInfo_setPointLight(pbrInfo, lighting_getPointLight(i));
          float attenuation = getPointLightAttenuation(lighting_getPointLight(i), distance(lighting_getPointLight(i).position, pbr_vPosition));
          color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color * (i < 4 ? clamp(pointVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation);
        }
      }

      for(int i = 0; i < lighting.spotLightCount; i++) {
        if (i < lighting.spotLightCount) {
          PBRInfo_setSpotLight(pbrInfo, lighting_getSpotLight(i));
          float attenuation = getSpotLightAttenuation(lighting_getSpotLight(i), pbr_vPosition);
          color += calculateFinalColor(pbrInfo, lighting_getSpotLight(i).color * (i < 4 ? clamp(spotVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation);
        }
      }
      for (int areaIndex = 0; areaIndex < areaLighting_getLightCount(); areaIndex++) {
#ifdef USE_AREA_LIGHT_LTC
        color += areaLTC_evaluate(areaIndex, pbr_vPosition, pbrInfo.n, pbrInfo.v, pbrInfo.perceptualRoughness, pbrInfo.diffuseColor, pbrInfo.reflectance0, pbrInfo.reflectance90);
#else
        for (int sampleIndex = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          PointLight sampleLight = areaLighting_getSample(areaIndex, sampleIndex, pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(pbrInfo, sampleLight);
            color += calculateFinalColor(pbrInfo, sampleLight.color);
          }
        }
#endif
      }
#endif

vec3 indirectBaseColor = color;
#ifdef USE_IBL
      if (pbrMaterial.IBLenabled) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
#endif

      // The pinned KHR_lightmap draft explicitly defines c_diff = (1 - metallic) * baseColor.
      color += baseColor.rgb * (1.0 - metallic) * lightmapIrradiance / M_PI;
      color = indirectBaseColor + (color - indirectBaseColor) * pbr_ambientVisibility;

#ifdef HAS_OCCLUSIONMAP
      if (pbrMaterial.occlusionMapEnabled) {
        float ao = texture(pbr_occlusionSampler, occlusionUV).r;
        color = mix(color, color * ao, pbrMaterial.occlusionStrength);
      }
#endif

      vec3 emissive = pbrMaterial.emissiveFactor;
#ifdef HAS_EMISSIVEMAP
      if (pbrMaterial.emissiveMapEnabled) {
        emissive *= SRGBtoLINEAR(texture(pbr_emissiveSampler, emissiveUV)).rgb;
      }
#endif
      color += emissive * pbrMaterial.emissiveStrength;

#ifdef PBR_DEBUG
      color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
      color = mix(color, vec3(metallic), pbrMaterial.scaleDiffBaseMR.z);
      color = mix(color, vec3(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
#endif

      return vec4(applySceneColorManagement(color), baseColor.a);
    }

    float specularIntensity = pbrMaterial.specularIntensityFactor;
#ifdef HAS_SPECULARINTENSITYMAP
    if (pbrMaterial.specularIntensityMapEnabled) {
      specularIntensity *= texture(pbr_specularIntensitySampler, specularIntensityUV).a;
    }
#endif

    vec3 specularFactor = pbrMaterial.specularColorFactor;
#ifdef HAS_SPECULARCOLORMAP
    if (pbrMaterial.specularColorMapEnabled) {
      specularFactor *= SRGBtoLINEAR(texture(pbr_specularColorSampler, specularColorUV)).rgb;
    }
#endif

    transmission = pbrMaterial.transmissionFactor;
#ifdef HAS_TRANSMISSIONMAP
    if (pbrMaterial.transmissionMapEnabled) {
      transmission *= texture(pbr_transmissionSampler, transmissionUV).r;
    }
#endif
    transmission = clamp(transmission * (1.0 - metallic), 0.0, 1.0);
    float thickness = max(pbrMaterial.thicknessFactor, 0.0);
#ifdef HAS_THICKNESSMAP
    thickness *= texture(pbr_thicknessSampler, thicknessUV).g;
#endif

    float diffuseTransmission = clamp(pbrMaterial.diffuseTransmissionFactor, 0.0, 1.0);
#ifdef HAS_DIFFUSETRANSMISSIONMAP
    if (pbrMaterial.diffuseTransmissionMapEnabled) {
      diffuseTransmission *= texture(pbr_diffuseTransmissionSampler, diffuseTransmissionUV).a;
    }
#endif
    diffuseTransmission *= (1.0 - metallic) * (1.0 - transmission);
    vec3 diffuseTransmissionColor = pbrMaterial.diffuseTransmissionColorFactor;
#ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
    if (pbrMaterial.diffuseTransmissionColorMapEnabled) {
      diffuseTransmissionColor *= SRGBtoLINEAR(
        texture(pbr_diffuseTransmissionColorSampler, diffuseTransmissionColorUV)
      ).rgb;
    }
#endif
    vec3 multiscatterColor = pbrMaterial.multiscatterColorFactor;
#ifdef HAS_MULTISCATTERCOLORMAP
    if (pbrMaterial.multiscatterColorMapEnabled) {
      multiscatterColor *= SRGBtoLINEAR(
        texture(pbr_multiscatterColorSampler, multiscatterColorUV)
      ).rgb;
    }
#endif

    float originalTransmission = transmission;
    float scatterReflection = 0.0;
#ifdef HAS_MATERIAL_SCATTER
    if (thickness <= 0.0) {
      float strength = clamp(pbrMaterial.scatterStrengthFactor, 0.0, 1.0);
#ifdef HAS_DIFFUSETRANSMISSIONMAP
      if (pbrMaterial.diffuseTransmissionMapEnabled) {
        strength *= texture(pbr_diffuseTransmissionSampler, diffuseTransmissionUV).a;
      }
#endif
      float anisotropy = pbrMaterial.scatterAnisotropy;
      scatterReflection = originalTransmission * strength * (1.0 - anisotropy) * 0.5;
      diffuseTransmission = originalTransmission * strength * (1.0 + anisotropy) * 0.5;
      diffuseTransmissionColor = multiscatterColor;
      transmission *= 1.0 - strength;
    }
#endif

    float clearcoatFactor = pbrMaterial.clearcoatFactor;
    float clearcoatRoughness = pbrMaterial.clearcoatRoughnessFactor;
#ifdef HAS_CLEARCOATMAP
    if (pbrMaterial.clearcoatMapEnabled) {
      clearcoatFactor *= texture(pbr_clearcoatSampler, clearcoatUV).r;
    }
#endif
#ifdef HAS_CLEARCOATROUGHNESSMAP
    if (pbrMaterial.clearcoatRoughnessMapEnabled) {
      clearcoatRoughness *= texture(pbr_clearcoatRoughnessSampler, clearcoatRoughnessUV).g;
    }
#endif
    clearcoatFactor = clamp(clearcoatFactor, 0.0, 1.0);
    clearcoatRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
    vec3 clearcoatNormal = getClearcoatNormal(getTBN(clearcoatNormalUV), n, clearcoatNormalUV);
    clearcoatRoughness = widenSpecularRoughness(clearcoatRoughness, clearcoatNormal);

    vec3 sheenColor = pbrMaterial.sheenColorFactor;
    float sheenRoughness = pbrMaterial.sheenRoughnessFactor;
#ifdef HAS_SHEENCOLORMAP
    if (pbrMaterial.sheenColorMapEnabled) {
      sheenColor *= SRGBtoLINEAR(texture(pbr_sheenColorSampler, sheenColorUV)).rgb;
    }
#endif
#ifdef HAS_SHEENROUGHNESSMAP
    if (pbrMaterial.sheenRoughnessMapEnabled) {
      sheenRoughness *= texture(pbr_sheenRoughnessSampler, sheenRoughnessUV).a;
    }
#endif
    sheenRoughness = clamp(sheenRoughness, c_MinRoughness, 1.0);

    float iridescence = pbrMaterial.iridescenceFactor;
#ifdef HAS_IRIDESCENCEMAP
    if (pbrMaterial.iridescenceMapEnabled) {
      iridescence *= texture(pbr_iridescenceSampler, iridescenceUV).r;
    }
#endif
    iridescence = clamp(iridescence, 0.0, 1.0);
    float iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      0.5
    );
#ifdef HAS_IRIDESCENCETHICKNESSMAP
    iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      texture(pbr_iridescenceThicknessSampler, iridescenceThicknessUV).g
    );
#endif

    float anisotropyStrength = clamp(pbrMaterial.anisotropyStrength, 0.0, 1.0);
    vec2 anisotropyDirection = normalizeDirection(pbrMaterial.anisotropyDirection);
#ifdef HAS_ANISOTROPYMAP
    if (pbrMaterial.anisotropyMapEnabled) {
      vec3 anisotropySample = texture(pbr_anisotropySampler, anisotropyUV).rgb;
      anisotropyStrength *= anisotropySample.b;
      vec2 mappedDirection = anisotropySample.rg * 2.0 - 1.0;
      if (length(mappedDirection) > 0.0001) {
        anisotropyDirection = normalize(mappedDirection);
      }
    }
#endif
    anisotropyDirection = rotateDirection(anisotropyDirection, pbrMaterial.anisotropyRotation);
    vec3 anisotropyTangent = normalize(tbn[0] * anisotropyDirection.x + tbn[1] * anisotropyDirection.y);
    if (length(anisotropyTangent) < 0.0001) {
      anisotropyTangent = normalize(tbn[0]);
    }
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    float dielectricF0 = getDielectricF0(pbrMaterial.ior);
    vec3 dielectricSpecularF0 = min(
      vec3(dielectricF0) * specularFactor * specularIntensity,
      vec3(1.0)
    );
    dielectricSpecularF0 = getIridescenceTint(
      iridescence,
      iridescenceThickness,
      NdotV,
      dielectricSpecularF0
    );
    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - dielectricSpecularF0);
    diffuseColor *= (1.0 - metallic) * (1.0 - transmission) * (1.0 - diffuseTransmission);
#ifdef HAS_MATERIAL_SCATTER
    diffuseColor = (baseColor.rgb * (1.0 - metallic) * (1.0 - originalTransmission) +
      multiscatterColor * scatterReflection) * (vec3(1.0) - dielectricSpecularF0);
#endif
    vec3 specularColor = mix(dielectricSpecularF0, baseColor.rgb, metallic);

    float clearcoatViewFresnel = dielectricSchlick(
      0.04,
      clamp(abs(dot(clearcoatNormal, v)), 0.0, 1.0)
    );
    float sheenDirectionalAlbedo = maxComponent(sheenColor) *
      (0.157 + 0.343 * (1.0 - NdotV)) * (1.0 - sheenRoughness * 0.5);
    float baseLayerEnergy = (1.0 - clearcoatFactor * clearcoatViewFresnel) *
      (1.0 - clamp(sheenDirectionalAlbedo, 0.0, 1.0));
    diffuseColor *= baseLayerEnergy;
    specularColor *= baseLayerEnergy;

    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing
    // reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%),
    // incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;
    vec3 reflection = -normalize(reflect(v, n));

    PBRInfo pbrInfo = PBRInfo(
      0.0, // NdotL
      NdotV,
      0.0, // NdotH
      0.0, // LdotH
      0.0, // VdotH
      perceptualRoughness,
      metallic,
      specularEnvironmentR0,
      specularEnvironmentR90,
      alphaRoughness,
      diffuseColor,
      specularColor,
      n,
      v,
      n,
      n
    );


#ifdef USE_LIGHTS
    // Apply ambient light
    PBRInfo_setAmbientLight(pbrInfo);
    color += calculateMaterialLightColor(
      pbrInfo,
      lighting.ambientColor * pbr_ambientVisibility,
      clearcoatNormal,
      clearcoatFactor,
      clearcoatRoughness,
      sheenColor,
      sheenRoughness,
      anisotropyTangent,
      anisotropyStrength
    );

    // Apply directional light
    for(int i = 0; i < lighting.directionalLightCount; i++) {
      if (i < lighting.directionalLightCount) {
        PBRInfo_setDirectionalLight(pbrInfo, -lighting_getDirectionalLight(i).direction);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getDirectionalLight(i).color * (i == 0 ? clamp(directionalVisibility, 0.0, 1.0) : 1.0),
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getDirectionalLight(i).color * (i == 0 ? clamp(directionalVisibility, 0.0, 1.0) : 1.0),
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }

    // Apply point light
    for(int i = 0; i < lighting.pointLightCount; i++) {
      if (i < lighting.pointLightCount) {
        PBRInfo_setPointLight(pbrInfo, lighting_getPointLight(i));
        float attenuation = getPointLightAttenuation(lighting_getPointLight(i), distance(lighting_getPointLight(i).position, pbr_vPosition));
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getPointLight(i).color * (i < 4 ? clamp(pointVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getPointLight(i).color * (i < 4 ? clamp(pointVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }

    for(int i = 0; i < lighting.spotLightCount; i++) {
      if (i < lighting.spotLightCount) {
        PBRInfo_setSpotLight(pbrInfo, lighting_getSpotLight(i));
        float attenuation = getSpotLightAttenuation(lighting_getSpotLight(i), pbr_vPosition);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getSpotLight(i).color * (i < 4 ? clamp(spotVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getSpotLight(i).color * (i < 4 ? clamp(spotVisibility[min(i, 3)], 0.0, 1.0) : 1.0) / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }
      for (int areaIndex = 0; areaIndex < areaLighting_getLightCount(); areaIndex++) {
#ifdef USE_AREA_LIGHT_LTC
        // Unsupported fits retain numerical integration rather than silently dropping material lobes.
        if (anisotropyStrength <= 0.0001 && dot(sheenColor, sheenColor) <= 0.000001 && diffuseTransmission <= 0.0001) {
        color += areaLTC_evaluate(areaIndex, pbr_vPosition, pbrInfo.n, pbrInfo.v, pbrInfo.perceptualRoughness, pbrInfo.diffuseColor, pbrInfo.reflectance0, pbrInfo.reflectance90);
        color += clearcoatFactor * areaLTC_specular(areaLighting_getLight(areaIndex), pbr_vPosition, clearcoatNormal, pbrInfo.v, clearcoatRoughness, vec3(0.04), vec3(1.0));
        } else {
        for (int sampleIndex = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          PointLight sampleLight = areaLighting_getSample(areaIndex, sampleIndex, pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(pbrInfo, sampleLight);
            color += calculateMaterialLightColor(pbrInfo, sampleLight.color, clearcoatNormal,
              clearcoatFactor, clearcoatRoughness, sheenColor, sheenRoughness, anisotropyTangent, anisotropyStrength);
            color += calculateDiffuseTransmissionLight(pbrInfo, sampleLight.color,
              diffuseTransmissionColor, diffuseTransmission, multiscatterColor, thickness);
          }
        }

        }
#else
        for (int sampleIndex = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          PointLight sampleLight = areaLighting_getSample(areaIndex, sampleIndex, pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(pbrInfo, sampleLight);
            color += calculateMaterialLightColor(pbrInfo, sampleLight.color, clearcoatNormal,
              clearcoatFactor, clearcoatRoughness, sheenColor, sheenRoughness, anisotropyTangent, anisotropyStrength);
            color += calculateDiffuseTransmissionLight(pbrInfo, sampleLight.color,
              diffuseTransmissionColor, diffuseTransmission, multiscatterColor, thickness);
          }
        }

#endif
      }
#endif

    vec3 indirectBaseColor = color;
    // Calculate lighting contribution from image based lighting source (IBL)
#ifdef USE_IBL
    if (pbrMaterial.IBLenabled) {
      color += getIBLContribution(
        pbrInfo,
        n,
        getAnisotropicReflection(pbrInfo, anisotropyTangent, anisotropyStrength)
      );
      color += calculateClearcoatIBLContribution(
        pbrInfo,
        clearcoatNormal,
        -normalize(reflect(v, clearcoatNormal)),
        clearcoatFactor,
        clearcoatRoughness
      );
      color += calculateDiffuseTransmissionIBL(
        pbrInfo,
        diffuseTransmissionColor,
        diffuseTransmission,
        multiscatterColor,
        thickness
      );
      color += sheenColor * pbrMaterial.scaleIBLAmbient.x * (1.0 - sheenRoughness) * 0.25;
    }
#endif

#ifdef HAS_MATERIAL_SCATTER
    color += (baseColor.rgb * (1.0 - metallic) * (1.0 - originalTransmission) +
      multiscatterColor * scatterReflection) * baseLayerEnergy * lightmapIrradiance / M_PI;
#else
    color += baseColor.rgb * (1.0 - metallic) * (1.0 - transmission) *
      (1.0 - diffuseTransmission) * baseLayerEnergy * lightmapIrradiance / M_PI;
#endif

    color = indirectBaseColor + (color - indirectBaseColor) * pbr_ambientVisibility;

 // Apply optional PBR terms for additional (optional) shading
#ifdef HAS_OCCLUSIONMAP
    if (pbrMaterial.occlusionMapEnabled) {
      float ao = texture(pbr_occlusionSampler, occlusionUV).r;
      color = mix(color, color * ao, pbrMaterial.occlusionStrength);
    }
#endif

    vec3 emissive = pbrMaterial.emissiveFactor;
#ifdef HAS_EMISSIVEMAP
    if (pbrMaterial.emissiveMapEnabled) {
      emissive *= SRGBtoLINEAR(texture(pbr_emissiveSampler, emissiveUV)).rgb;
    }
#endif
    color += emissive * pbrMaterial.emissiveStrength;

    if (transmission > 0.0) {
#ifdef USE_TRANSMISSION_FRAMEBUFFER
      float dielectricFresnel = getDielectricF0(pbrMaterial.ior);
      float transmissionFresnel = dielectricFresnel +
        (1.0 - dielectricFresnel) * pow(1.0 - NdotV, 5.0);
      vec3 transmittedColor = getTransmittedSceneColor(
        pbr_vPosition,
        n,
        v,
        thickness,
        perceptualRoughness
      );
      color += transmittedColor * getVolumeAttenuation(thickness) *
        transmission * (1.0 - transmissionFresnel);
#else
      color = mix(color, color * getVolumeAttenuation(thickness), transmission);
#endif
    }

    // This section uses mix to override final color for reference app visualization
    // of various parameters in the lighting equation.
#ifdef PBR_DEBUG
    // TODO: Figure out how to debug multiple lights

    // color = mix(color, F, pbr_scaleFGDSpec.x);
    // color = mix(color, vec3(G), pbr_scaleFGDSpec.y);
    // color = mix(color, vec3(D), pbr_scaleFGDSpec.z);
    // color = mix(color, specContrib, pbr_scaleFGDSpec.w);

    // color = mix(color, diffuseContrib, pbr_scaleDiffBaseMR.x);
    color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
    color = mix(color, vec3(metallic), pbrMaterial.scaleDiffBaseMR.z);
    color = mix(color, vec3(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
#endif

  }

#ifdef USE_TRANSMISSION_FRAMEBUFFER
  float alpha = clamp(baseColor.a, 0.0, 1.0);
#else
  float alpha = clamp(baseColor.a * (1.0 - transmission), 0.0, 1.0);
#endif
  return vec4(applySceneColorManagement(color), alpha);
}

// Depth-only passes use the same base-color alpha, vertex color and UV transform.
void pbr_discardMaskedFragment(vec4 vertexColor) {
#ifdef ALPHA_CUTOFF
  float alpha = pbrMaterial.baseColorFactor.a * vertexColor.a;
#ifdef HAS_BASECOLORMAP
  alpha *= texture(pbr_baseColorSampler, getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform)).a;
#endif
  if (alpha < pbrMaterial.alphaCutoff) {discard;}
#endif
}

vec4 pbr_filterColorWithSpotShadows(vec4 vertexColor, vec4 spotVisibility) {
  return pbr_filterColorWithShadows(vertexColor, 1.0, vec4(1.0), spotVisibility);
}

vec4 pbr_filterColor(vec4 vertexColor) {
  return pbr_filterColorWithSpotShadows(vertexColor, vec4(1.0));
}
`,O_=`#ifdef DOUBLE_SIDED
var<private> pbr_frontFacing: bool = true;
#endif
struct PBRFragmentInputs {
  pbr_vPosition: vec3f,
  pbr_vUV0: vec2f,
  pbr_vUV1: vec2f,
  pbr_vTBN: mat3x3f,
  pbr_vNormal: vec3f
};

var<private> fragmentInputs: PBRFragmentInputs;

fn pbr_setPositionNormalTangentUV(
  position: vec4f,
  normal: vec4f,
  tangent: vec4f,
  uv0: vec2f,
  uv1: vec2f
)
{
  var pos: vec4f = pbrProjection.modelMatrix * position;
  fragmentInputs.pbr_vPosition = pos.xyz / pos.w;
  fragmentInputs.pbr_vNormal = vec3f(0.0, 0.0, 1.0);
  fragmentInputs.pbr_vTBN = mat3x3f(
    vec3f(1.0, 0.0, 0.0),
    vec3f(0.0, 1.0, 0.0),
    vec3f(0.0, 0.0, 1.0)
  );
  fragmentInputs.pbr_vUV0 = vec2f(0.0, 0.0);
  fragmentInputs.pbr_vUV1 = uv1;

#ifdef HAS_NORMALS
  let normalW: vec3f = normalize((pbrProjection.normalMatrix * vec4f(normal.xyz, 0.0)).xyz);
  fragmentInputs.pbr_vNormal = normalW;
#ifdef HAS_TANGENTS
  let tangentW: vec3f = normalize((pbrProjection.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz);
  let bitangentW: vec3f = cross(normalW, tangentW) * tangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangentW, bitangentW, normalW);
#endif
#endif

#ifdef HAS_UV
  fragmentInputs.pbr_vUV0 = uv0;
#endif
}

struct pbrMaterialUniforms {
  // Material is unlit
  unlit: u32,

  // Base color map
  baseColorMapEnabled: u32,
  baseColorFactor: vec4f,

  normalMapEnabled : u32,
  normalScale: f32,  // #ifdef HAS_NORMALMAP

  emissiveMapEnabled: u32,
  emissiveFactor: vec3f, // #ifdef HAS_EMISSIVEMAP

  metallicRoughnessValues: vec2f,
  metallicRoughnessMapEnabled: u32,

  occlusionMapEnabled: i32,
  occlusionStrength: f32, // #ifdef HAS_OCCLUSIONMAP
  
  alphaCutoffEnabled: i32,
  alphaCutoff: f32, // #ifdef ALPHA_CUTOFF

  specularColorFactor: vec3f,
  specularIntensityFactor: f32,
  specularColorMapEnabled: i32,
  specularIntensityMapEnabled: i32,

  ior: f32,

  transmissionFactor: f32,
  transmissionMapEnabled: i32,

  thicknessFactor: f32,
  attenuationDistance: f32,
  attenuationColor: vec3f,

  clearcoatFactor: f32,
  clearcoatRoughnessFactor: f32,
  clearcoatMapEnabled: i32,
  clearcoatRoughnessMapEnabled: i32,

  sheenColorFactor: vec3f,
  sheenRoughnessFactor: f32,
  sheenColorMapEnabled: i32,
  sheenRoughnessMapEnabled: i32,

  iridescenceFactor: f32,
  iridescenceIor: f32,
  iridescenceThicknessRange: vec2f,
  iridescenceMapEnabled: i32,

  anisotropyStrength: f32,
  anisotropyRotation: f32,
  anisotropyDirection: vec2f,
  anisotropyMapEnabled: i32,

  emissiveStrength: f32,
  dispersion: f32,
  
  // IBL
  IBLenabled: i32,
  scaleIBLAmbient: vec2f, // #ifdef USE_IBL
  
  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  scaleDiffBaseMR: vec4f,
  scaleFGDSpec: vec4f,
  // #endif

  baseColorUVSet: i32,
  baseColorUVTransform: mat3x3f,
  metallicRoughnessUVSet: i32,
  metallicRoughnessUVTransform: mat3x3f,
  normalUVSet: i32,
  normalUVTransform: mat3x3f,
  occlusionUVSet: i32,
  occlusionUVTransform: mat3x3f,
  emissiveUVSet: i32,
  emissiveUVTransform: mat3x3f,
  specularColorUVSet: i32,
  specularColorUVTransform: mat3x3f,
  specularIntensityUVSet: i32,
  specularIntensityUVTransform: mat3x3f,
  transmissionUVSet: i32,
  transmissionUVTransform: mat3x3f,
  thicknessUVSet: i32,
  thicknessUVTransform: mat3x3f,
  clearcoatUVSet: i32,
  clearcoatUVTransform: mat3x3f,
  clearcoatRoughnessUVSet: i32,
  clearcoatRoughnessUVTransform: mat3x3f,
  clearcoatNormalUVSet: i32,
  clearcoatNormalUVTransform: mat3x3f,
  sheenColorUVSet: i32,
  sheenColorUVTransform: mat3x3f,
  sheenRoughnessUVSet: i32,
  sheenRoughnessUVTransform: mat3x3f,
  iridescenceUVSet: i32,
  iridescenceUVTransform: mat3x3f,
  iridescenceThicknessUVSet: i32,
  iridescenceThicknessUVTransform: mat3x3f,
  anisotropyUVSet: i32,
  anisotropyUVTransform: mat3x3f,

  bumpFactor: f32,
  bumpMapEnabled: i32,
  diffuseTransmissionFactor: f32,
  diffuseTransmissionMapEnabled: i32,
  diffuseTransmissionColorFactor: vec3f,
  diffuseTransmissionColorMapEnabled: i32,
  multiscatterColorFactor: vec3f,
  multiscatterColorMapEnabled: i32,
  scatterAnisotropy: f32,

  bumpUVSet: i32,
  bumpUVTransform: mat3x3f,
  diffuseTransmissionUVSet: i32,
  diffuseTransmissionUVTransform: mat3x3f,
  diffuseTransmissionColorUVSet: i32,
  diffuseTransmissionColorUVTransform: mat3x3f,
  multiscatterColorUVSet: i32,
  multiscatterColorUVTransform: mat3x3f,
  lightmapMapEnabled: u32,
  lightmapIntensity: f32,
  lightmapUVSet: i32,
  lightmapUVTransform: mat3x3f,
  scatterStrengthFactor: f32,
}

@group(3) @binding(auto) var<uniform> pbrMaterial : pbrMaterialUniforms;

// Samplers
#ifdef HAS_BASECOLORMAP
@group(3) @binding(auto) var pbr_baseColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_baseColorSamplerSampler: sampler;
#endif
#ifdef HAS_NORMALMAP
@group(3) @binding(auto) var pbr_normalSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_normalSamplerSampler: sampler;
#endif
#ifdef HAS_EMISSIVEMAP
@group(3) @binding(auto) var pbr_emissiveSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_emissiveSamplerSampler: sampler;
#endif
#ifdef HAS_LIGHTMAP
@group(3) @binding(auto) var pbr_lightmapSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_lightmapSamplerSampler: sampler;
#endif
#ifdef HAS_METALROUGHNESSMAP
@group(3) @binding(auto) var pbr_metallicRoughnessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_metallicRoughnessSamplerSampler: sampler;
#endif
#ifdef HAS_OCCLUSIONMAP
@group(3) @binding(auto) var pbr_occlusionSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_occlusionSamplerSampler: sampler;
#endif
#ifdef HAS_SPECULARCOLORMAP
@group(3) @binding(auto) var pbr_specularColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_specularColorSamplerSampler: sampler;
#endif
#ifdef HAS_SPECULARINTENSITYMAP
@group(3) @binding(auto) var pbr_specularIntensitySampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_specularIntensitySamplerSampler: sampler;
#endif
#ifdef HAS_TRANSMISSIONMAP
@group(3) @binding(auto) var pbr_transmissionSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_transmissionSamplerSampler: sampler;
#endif
#ifdef HAS_THICKNESSMAP
@group(3) @binding(auto) var pbr_thicknessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_thicknessSamplerSampler: sampler;
#endif
#ifdef HAS_CLEARCOATMAP
@group(3) @binding(auto) var pbr_clearcoatSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_clearcoatSamplerSampler: sampler;
#endif
#ifdef HAS_CLEARCOATROUGHNESSMAP
@group(3) @binding(auto) var pbr_clearcoatRoughnessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_clearcoatRoughnessSamplerSampler: sampler;
#endif
#ifdef HAS_CLEARCOATNORMALMAP
@group(3) @binding(auto) var pbr_clearcoatNormalSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_clearcoatNormalSamplerSampler: sampler;
#endif
#ifdef HAS_SHEENCOLORMAP
@group(3) @binding(auto) var pbr_sheenColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_sheenColorSamplerSampler: sampler;
#endif
#ifdef HAS_SHEENROUGHNESSMAP
@group(3) @binding(auto) var pbr_sheenRoughnessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_sheenRoughnessSamplerSampler: sampler;
#endif
#ifdef HAS_IRIDESCENCEMAP
@group(3) @binding(auto) var pbr_iridescenceSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_iridescenceSamplerSampler: sampler;
#endif
#ifdef HAS_IRIDESCENCETHICKNESSMAP
@group(3) @binding(auto) var pbr_iridescenceThicknessSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_iridescenceThicknessSamplerSampler: sampler;
#endif
#ifdef HAS_ANISOTROPYMAP
@group(3) @binding(auto) var pbr_anisotropySampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_anisotropySamplerSampler: sampler;
#endif
#ifdef HAS_BUMPMAP
@group(3) @binding(auto) var pbr_bumpSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_bumpSamplerSampler: sampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONMAP
@group(3) @binding(auto) var pbr_diffuseTransmissionSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_diffuseTransmissionSamplerSampler: sampler;
#endif
#ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
@group(3) @binding(auto) var pbr_diffuseTransmissionColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_diffuseTransmissionColorSamplerSampler: sampler;
#endif
#ifdef HAS_MULTISCATTERCOLORMAP
@group(3) @binding(auto) var pbr_multiscatterColorSampler: texture_2d<f32>;
@group(3) @binding(auto) var pbr_multiscatterColorSamplerSampler: sampler;
#endif
// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.
struct PBRInfo {
  NdotL: f32,                  // cos angle between normal and light direction
  NdotV: f32,                  // cos angle between normal and view direction
  NdotH: f32,                  // cos angle between normal and half vector
  LdotH: f32,                  // cos angle between light direction and half vector
  VdotH: f32,                  // cos angle between view direction and half vector
  perceptualRoughness: f32,    // roughness value, as authored by the model creator (input to shader)
  metalness: f32,              // metallic value at the surface
  reflectance0: vec3f,            // full reflectance color (normal incidence angle)
  reflectance90: vec3f,           // reflectance color at grazing angle
  alphaRoughness: f32,         // roughness mapped to a more linear change in the roughness (proposed by [2])
  diffuseColor: vec3f,            // color contribution from diffuse lighting
  specularColor: vec3f,           // color contribution from specular lighting
  n: vec3f,                       // normal at surface point
  v: vec3f,                       // vector from surface point to camera
  l: vec3f,                       // direction from the surface toward the current light
  h: vec3f                        // half vector between the current light and camera
};

const M_PI = 3.141592653589793;
const c_MinRoughness = 0.04;

// Widen sub-pixel specular lobes using the screen-space normal footprint.
// This is geometric specular antialiasing: the normal variance is converted
// into an additional squared perceptual roughness before evaluating BRDFs.
fn widenSpecularRoughness(perceptualRoughness: f32, normal: vec3f) -> f32 {
  let normalDerivativeX = dpdx(normal);
  let normalDerivativeY = dpdy(normal);
  let normalVariance =
    dot(normalDerivativeX, normalDerivativeX) +
    dot(normalDerivativeY, normalDerivativeY);
  let kernelRoughnessSquared = min(2.0 * normalVariance, 1.0);
  return clamp(
    sqrt(perceptualRoughness * perceptualRoughness + kernelRoughnessSquared),
    c_MinRoughness,
    1.0
  );
}

fn SRGBtoLINEAR(srgbIn: vec4f ) -> vec4f
{
  var linOut: vec3f = srgbIn.xyz;
#ifdef MANUAL_SRGB
  let bLess: vec3f = step(vec3f(0.04045), srgbIn.xyz);
  linOut = mix(
    srgbIn.xyz / vec3f(12.92),
    pow((srgbIn.xyz + vec3f(0.055)) / vec3f(1.055), vec3f(2.4)),
    bLess
  );
#ifdef SRGB_FAST_APPROXIMATION
  linOut = pow(srgbIn.xyz, vec3f(2.2));
#endif
#endif
  return vec4f(linOut, srgbIn.w);
}

fn getMaterialUV(uvSet: i32, uvTransform: mat3x3f) -> vec2f
{
  var baseUV = fragmentInputs.pbr_vUV0;
  if (uvSet == 1) {
    baseUV = fragmentInputs.pbr_vUV1;
  }
  return (uvTransform * vec3f(baseUV, 1.0)).xy;
}

// Build the tangent basis from interpolated attributes or screen-space derivatives.
fn getTBN(uv: vec2f) -> mat3x3f
{
  let pos_dx: vec3f = dpdx(fragmentInputs.pbr_vPosition);
  let pos_dy: vec3f = dpdy(fragmentInputs.pbr_vPosition);
  let tex_dx: vec3f = dpdx(vec3f(uv, 0.0));
  let tex_dy: vec3f = dpdy(vec3f(uv, 0.0));
  var t: vec3f = (tex_dy.y * pos_dx - tex_dx.y * pos_dy) / (tex_dx.x * tex_dy.y - tex_dy.x * tex_dx.y);

  var ng: vec3f = cross(pos_dy, pos_dx);
#ifdef HAS_NORMALS
  ng = normalize(fragmentInputs.pbr_vNormal);
#endif
  t = normalize(t - ng * dot(ng, t));
  var b: vec3f = normalize(cross(ng, t));
  var tbn: mat3x3f = mat3x3f(t, b, ng);
#ifdef HAS_TANGENTS
  tbn = fragmentInputs.pbr_vTBN;
#endif

#ifdef DOUBLE_SIDED
#ifdef HAS_NORMALS
  // Derivative normals already face the viewer; only flip an authored basis.
  if (!pbr_frontFacing) { tbn = mat3x3f(-tbn[0], -tbn[1], -tbn[2]); }
#endif
#endif
  return tbn;
}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
fn getMappedNormal(
  normalSampler: texture_2d<f32>,
  normalSamplerBinding: sampler,
  tbn: mat3x3f,
  normalScale: f32,
  uv: vec2f
) -> vec3f
{
  let n = textureSample(normalSampler, normalSamplerBinding, uv).rgb;
  return normalize(tbn * ((2.0 * n - 1.0) * vec3f(normalScale, normalScale, 1.0)));
}

fn getNormal(tbn: mat3x3f, uv: vec2f) -> vec3f
{
  // The tbn matrix is linearly interpolated, so we need to re-normalize
  var n: vec3f = normalize(tbn[2].xyz);
#ifdef HAS_NORMALMAP
  n = getMappedNormal(
    pbr_normalSampler,
    pbr_normalSamplerSampler,
    tbn,
    pbrMaterial.normalScale,
    uv
  );
#endif

#ifdef HAS_BUMPMAP
  let bumpUV = getMaterialUV(pbrMaterial.bumpUVSet, pbrMaterial.bumpUVTransform);
  let bumpTexelSize = 1.0 / vec2f(textureDimensions(pbr_bumpSampler, 0));
  let bumpHeight = textureSample(pbr_bumpSampler, pbr_bumpSamplerSampler, bumpUV).r;
  let bumpGradient = vec2f(
    textureSample(
      pbr_bumpSampler,
      pbr_bumpSamplerSampler,
      bumpUV + vec2f(bumpTexelSize.x, 0.0)
    ).r - bumpHeight,
    textureSample(
      pbr_bumpSampler,
      pbr_bumpSamplerSampler,
      bumpUV + vec2f(0.0, bumpTexelSize.y)
    ).r - bumpHeight
  );
  n = normalize(n - pbrMaterial.bumpFactor *
    (tbn[0] * bumpGradient.x + tbn[1] * bumpGradient.y));
#endif

  return n;
}

fn getClearcoatNormal(tbn: mat3x3f, baseNormal: vec3f, uv: vec2f) -> vec3f
{
#ifdef HAS_CLEARCOATNORMALMAP
  return getMappedNormal(
    pbr_clearcoatNormalSampler,
    pbr_clearcoatNormalSamplerSampler,
    tbn,
    1.0,
    uv
  );
#else
  return baseNormal;
#endif
}

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
#ifdef USE_IBL
fn getIBLContribution(pbrInfo: PBRInfo, n: vec3f, reflection: vec3f) -> vec3f
{
#ifdef USE_SCENE_ENVIRONMENT
  let maximumMipLevel = max(pbrScene.environmentMipCount - 1.0, 0.0);
  let rotationSine = sin(pbrScene.environmentRotation);
  let rotationCosine = cos(pbrScene.environmentRotation);
  let environmentRotation = mat2x2f(
    vec2f(rotationCosine, rotationSine),
    vec2f(-rotationSine, rotationCosine)
  );
  let rotatedNormal = environmentRotation * n.xz;
  let rotatedReflection = environmentRotation * reflection.xz;
  let environmentNormal = vec3f(rotatedNormal.x, n.y, rotatedNormal.y);
  let environmentReflection = vec3f(rotatedReflection.x, reflection.y, rotatedReflection.y);
#else
  let maximumMipLevel = 9.0;
  let environmentNormal = n;
  let environmentReflection = reflection;
#endif
  let lod = pbrInfo.perceptualRoughness * maximumMipLevel;
  // retrieve a scale and bias to F0. See [1], Figure 3
  let brdfSample = textureSampleLevel(
    pbr_brdfLUT,
    pbr_brdfLUTSampler,
    vec2f(pbrInfo.NdotV, 1.0 - pbrInfo.perceptualRoughness),
    0.0
  );
  let diffuseSample = textureSampleLevel(
    pbr_diffuseEnvSampler,
    pbr_diffuseEnvSamplerSampler,
    environmentNormal,
    0.0
  );
  var specularSample = textureSampleLevel(
    pbr_specularEnvSampler,
    pbr_specularEnvSamplerSampler,
    environmentReflection,
    0.0
  );
#ifdef USE_TEX_LOD
  specularSample = textureSampleLevel(
    pbr_specularEnvSampler,
    pbr_specularEnvSamplerSampler,
    environmentReflection,
    lod
  );
#endif

#ifdef USE_SCENE_ENVIRONMENT
  let brdf = brdfSample.rgb;
  let diffuseLight = diffuseSample.rgb;
  let specularLight = specularSample.rgb;
#else
  let brdf = SRGBtoLINEAR(brdfSample).rgb;
  let diffuseLight = SRGBtoLINEAR(diffuseSample).rgb;
  let specularLight = SRGBtoLINEAR(specularSample).rgb;
#endif

  let diffuse = diffuseLight * pbrInfo.diffuseColor * pbrMaterial.scaleIBLAmbient.x;
  let specular =
    specularLight * (pbrInfo.specularColor * brdf.x + brdf.y) * pbrMaterial.scaleIBLAmbient.y;

#ifdef USE_SCENE_ENVIRONMENT
  return (diffuse + specular) * max(pbrScene.environmentIntensity, 0.0);
#else
  return diffuse + specular;
#endif
}
#endif

// Basic Lambertian diffuse
// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
// See also [1], Equation 1
fn diffuse(pbrInfo: PBRInfo) -> vec3<f32> {
  return pbrInfo.diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
fn specularReflection(pbrInfo: PBRInfo) -> vec3<f32> {
  return pbrInfo.reflectance0 +
    (pbrInfo.reflectance90 - pbrInfo.reflectance0) *
    pow(clamp(1.0 - pbrInfo.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
fn geometricOcclusion(pbrInfo: PBRInfo) -> f32 {
  let NdotL: f32 = pbrInfo.NdotL;
  let NdotV: f32 = pbrInfo.NdotV;
  let r: f32 = pbrInfo.alphaRoughness;

  let attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
  let attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
  return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across
// the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface
// for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes
// from EPIC Games [1], Equation 3.
fn microfacetDistribution(pbrInfo: PBRInfo) -> f32 {
  let roughnessSq = pbrInfo.alphaRoughness * pbrInfo.alphaRoughness;
  let f = (pbrInfo.NdotH * roughnessSq - pbrInfo.NdotH) * pbrInfo.NdotH + 1.0;
  return roughnessSq / (M_PI * f * f);
}

fn maxComponent(value: vec3f) -> f32 {
  return max(max(value.r, value.g), value.b);
}

fn getDielectricF0(ior: f32) -> f32 {
  let clampedIor = max(ior, 1.0);
  let ratio = (clampedIor - 1.0) / (clampedIor + 1.0);
  return ratio * ratio;
}

fn normalizeDirection(direction: vec2f) -> vec2f {
  let directionLength = length(direction);
  if (directionLength > 0.0001) {
    return direction / directionLength;
  }

  return vec2f(1.0, 0.0);
}

fn rotateDirection(direction: vec2f, rotation: f32) -> vec2f {
  let s = sin(rotation);
  let c = cos(rotation);
  return vec2f(direction.x * c - direction.y * s, direction.x * s + direction.y * c);
}

fn encodeLinearSRGB(linearColor: vec3f) -> vec3f {
  let positiveColor = max(linearColor, vec3f(0.0));
  return select(
    positiveColor * 12.92,
    1.055 * pow(positiveColor, vec3f(1.0 / 2.4)) - 0.055,
    positiveColor > vec3f(0.0031308)
  );
}

fn toneMapKhronosPBRNeutral(inputColor: vec3f) -> vec3f {
  let startCompression = 0.76;
  let darkestChannel = min(inputColor.r, min(inputColor.g, inputColor.b));
  let offset = select(
    0.04,
    darkestChannel - 6.25 * darkestChannel * darkestChannel,
    darkestChannel < 0.08
  );
  var color = inputColor - vec3f(offset);
  let peak = maxComponent(color);
  if (peak < startCompression) {
    return color;
  }

  let compressionRange = 1.0 - startCompression;
  let compressedPeak = 1.0 - compressionRange * compressionRange /
    (peak + compressionRange - startCompression);
  color *= compressedPeak / max(peak, 0.0001);
  let desaturation = 1.0 - 1.0 / (0.15 * (peak - compressedPeak) + 1.0);
  return mix(color, vec3f(compressedPeak), desaturation);
}

fn applySceneColorManagement(sceneColor: vec3f) -> vec3f {
#ifdef USE_SCENE_COLOR_MANAGEMENT
  var color = max(sceneColor, vec3f(0.0)) * max(pbrScene.exposure, 0.0);
  if (pbrScene.toneMapMode == 1) {
    color /= vec3f(1.0) + color;
  } else if (pbrScene.toneMapMode == 2) {
    color = toneMapKhronosPBRNeutral(color);
  } else if (pbrScene.toneMapMode == 3) {
    color = clamp(
      (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14),
      vec3f(0.0),
      vec3f(1.0)
    );
  }
  if (pbrScene.outputEncoding == 0) {
    return color;
  }
  return encodeLinearSRGB(color);
#else
  return pow(max(sceneColor, vec3f(0.0)), vec3f(1.0 / 2.2));
#endif
}

fn dielectricSchlick(reflectance: f32, cosine: f32) -> f32 {
  return reflectance + (1.0 - reflectance) * pow(clamp(1.0 - cosine, 0.0, 1.0), 5.0);
}

fn evaluateIridescenceSensitivity(opticalPathDifference: f32, phaseShift: vec3f) -> vec3f {
  let phase = 2.0 * M_PI * opticalPathDifference * 1.0e-9;
  let sensitivity = vec3f(5.4856e-13, 4.4201e-13, 5.2481e-13);
  let position = vec3f(1.6810e6, 1.7953e6, 2.2084e6);
  let variance = vec3f(4.3278e9, 9.3046e9, 6.6121e9);
  var xyz = sensitivity * sqrt(2.0 * M_PI * variance) *
    cos(position * phase + phaseShift) * exp(-phase * phase * variance);
  xyz.x += 9.7470e-14 * sqrt(2.0 * M_PI * 4.5282e9) *
    cos(2.2399e6 * phase + phaseShift.x) * exp(-4.5282e9 * phase * phase);
  xyz /= 1.0685e-7;
  return mat3x3f(
    vec3f(3.2404542, -0.9692660, 0.0556434),
    vec3f(-1.5371385, 1.8760108, -0.2040259),
    vec3f(-0.4985314, 0.0415560, 1.0572252)
  ) * xyz;
}

fn getIridescenceTint(
  iridescence: f32,
  thickness: f32,
  NdotV: f32,
  baseReflectance: vec3f
) -> vec3f {
  if (iridescence <= 0.0 || thickness <= 0.0) {
    return baseReflectance;
  }

  let filmIor = max(pbrMaterial.iridescenceIor, 1.0);
  let sineSquared = (1.0 - NdotV * NdotV) / (filmIor * filmIor);
  let cosineSquared = 1.0 - sineSquared;
  if (cosineSquared <= 0.0) {
    return mix(baseReflectance, vec3f(1.0), iridescence);
  }
  let filmCosine = sqrt(cosineSquared);
  let firstInterfaceReflectance = dielectricSchlick(getDielectricF0(filmIor), NdotV);
  let transmittedEnergy = 1.0 - firstInterfaceReflectance;
  let squareRootReflectance = sqrt(clamp(baseReflectance, vec3f(0.0), vec3f(0.9999)));
  let baseIor = (vec3f(1.0) + squareRootReflectance) /
    (vec3f(1.0) - squareRootReflectance);
  var secondInterfaceF0 = (baseIor - vec3f(filmIor)) / (baseIor + vec3f(filmIor));
  secondInterfaceF0 *= secondInterfaceF0;
  let secondInterfaceReflectance = secondInterfaceF0 +
    (vec3f(1.0) - secondInterfaceF0) * pow(1.0 - filmCosine, 5.0);
  let phaseShift = vec3f(M_PI) + select(
    vec3f(0.0),
    vec3f(M_PI),
    baseIor < vec3f(filmIor)
  );
  let opticalPathDifference = 2.0 * filmIor * thickness * filmCosine;
  let combinedReflectance = clamp(
    firstInterfaceReflectance * secondInterfaceReflectance,
    vec3f(0.00001),
    vec3f(0.9999)
  );
  let recurringAmplitude = sqrt(combinedReflectance);
  let interfaceResponse = transmittedEnergy * transmittedEnergy * secondInterfaceReflectance /
    (vec3f(1.0) - combinedReflectance);
  var reflectedSpectrum = vec3f(firstInterfaceReflectance) + interfaceResponse;
  var harmonicAmplitude = interfaceResponse - vec3f(transmittedEnergy);
  for (var harmonic = 1; harmonic <= 2; harmonic++) {
    harmonicAmplitude *= recurringAmplitude;
    reflectedSpectrum += harmonicAmplitude * 2.0 * evaluateIridescenceSensitivity(
      f32(harmonic) * opticalPathDifference,
      f32(harmonic) * phaseShift
    );
  }
  return mix(baseReflectance, clamp(reflectedSpectrum, vec3f(0.0), vec3f(1.0)), iridescence);
}

fn getVolumeAttenuation(thickness: f32) -> vec3f {
  if (thickness <= 0.0) {
    return vec3f(1.0);
  }

  let attenuationCoefficient =
    -log(max(pbrMaterial.attenuationColor, vec3f(0.0001))) /
    max(pbrMaterial.attenuationDistance, 0.0001);
  return exp(-attenuationCoefficient * thickness);
}

// KHR_materials_volume_scatter is an active draft. This evaluates a local,
// thickness-aware single-scattering approximation rather than random walk.
fn getDiffuseTransmissionAttenuation(
  pbrInfo: PBRInfo,
  multiscatterColor: vec3f,
  thickness: f32
) -> vec3f {
  let volumeAttenuation = getVolumeAttenuation(thickness);
  let scatteringStrength = maxComponent(multiscatterColor);
  if (thickness <= 0.0 || scatteringStrength <= 0.0001) {
    return volumeAttenuation;
  }

  let anisotropy = clamp(pbrMaterial.scatterAnisotropy, -0.95, 0.95);
  let scatteringCosine = clamp(dot(-pbrInfo.v, pbrInfo.l), -1.0, 1.0);
  let phaseDenominator = max(
    1.0 + anisotropy * anisotropy - 2.0 * anisotropy * scatteringCosine,
    0.0001
  );
  let phaseWeight = clamp(
    (1.0 - anisotropy * anisotropy) / pow(phaseDenominator, 1.5),
    0.0,
    4.0
  );
  let scatteringDepth = thickness / max(pbrMaterial.attenuationDistance, 0.0001);
  let scatteringProbability = 1.0 - exp(-scatteringDepth);
  let scatteringColor = clamp(multiscatterColor, vec3f(0.0), vec3f(1.0));
  return mix(
    volumeAttenuation,
    volumeAttenuation * mix(vec3f(1.0), scatteringColor * phaseWeight, scatteringColor),
    scatteringProbability
  );
}

fn calculateDiffuseTransmissionLight(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  diffuseTransmissionColor: vec3f,
  diffuseTransmission: f32,
  multiscatterColor: vec3f,
  thickness: f32
) -> vec3f {
  let oppositeHemisphere = max(dot(-pbrInfo.n, pbrInfo.l), 0.0);
  if (oppositeHemisphere <= 0.0 || diffuseTransmission <= 0.0) {
    return vec3f(0.0);
  }

  let nonReflectedEnergy = vec3f(1.0) - clamp(pbrInfo.reflectance0, vec3f(0.0), vec3f(1.0));
  let attenuatedColor = getDiffuseTransmissionAttenuation(
    pbrInfo,
    multiscatterColor,
    thickness
  );
  return lightColor * diffuseTransmissionColor * nonReflectedEnergy *
    attenuatedColor * (diffuseTransmission * oppositeHemisphere / M_PI);
}

#ifdef USE_IBL
fn calculateDiffuseTransmissionIBL(
  pbrInfo: PBRInfo,
  diffuseTransmissionColor: vec3f,
  diffuseTransmission: f32,
  multiscatterColor: vec3f,
  thickness: f32
) -> vec3f {
  if (diffuseTransmission <= 0.0) {
    return vec3f(0.0);
  }

#ifdef USE_SCENE_ENVIRONMENT
  let rotationSine = sin(pbrScene.environmentRotation);
  let rotationCosine = cos(pbrScene.environmentRotation);
  let environmentRotation = mat2x2f(
    vec2f(rotationCosine, rotationSine),
    vec2f(-rotationSine, rotationCosine)
  );
  let rotatedNormal = environmentRotation * -pbrInfo.n.xz;
  let oppositeNormal = vec3f(rotatedNormal.x, -pbrInfo.n.y, rotatedNormal.y);
  let environmentColor = textureSampleLevel(
    pbr_diffuseEnvSampler,
    pbr_diffuseEnvSamplerSampler,
    oppositeNormal,
    0.0
  ).rgb * max(pbrScene.environmentIntensity, 0.0);
#else
  let environmentColor = SRGBtoLINEAR(
    textureSampleLevel(pbr_diffuseEnvSampler, pbr_diffuseEnvSamplerSampler, -pbrInfo.n, 0.0)
  ).rgb;
#endif
  let nonReflectedEnergy = vec3f(1.0) - clamp(pbrInfo.reflectance0, vec3f(0.0), vec3f(1.0));
  return environmentColor * diffuseTransmissionColor * nonReflectedEnergy *
    getDiffuseTransmissionAttenuation(pbrInfo, multiscatterColor, thickness) *
    diffuseTransmission * pbrMaterial.scaleIBLAmbient.x;
}
#endif

#ifdef USE_TRANSMISSION_FRAMEBUFFER
fn sampleTransmittedSceneColor(
  position: vec3f,
  normal: vec3f,
  viewDirection: vec3f,
  thickness: f32,
  perceptualRoughness: f32,
  indexOfRefraction: f32
) -> vec3f {
  let refractionDirection = refract(
    -viewDirection,
    normal,
    1.0 / max(indexOfRefraction, 1.0)
  );
  let refractedPosition = position + refractionDirection * thickness;
  let clipPosition = pbrScene.projectionMatrix *
    pbrScene.viewMatrix * vec4f(refractedPosition, 1.0);
  var textureCoordinate = clipPosition.xy / max(clipPosition.w, 0.0001) * 0.5 + 0.5;
  textureCoordinate.y = 1.0 - textureCoordinate.y;
  textureCoordinate = clamp(textureCoordinate, vec2f(0.001), vec2f(0.999));

  let blurRadius = perceptualRoughness * perceptualRoughness * 8.0 /
    max(pbrScene.framebufferSize, vec2f(1.0));
  var sceneColor = textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate,
    0.0
  ).rgb * 0.4;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate + vec2f(blurRadius.x, 0.0),
    0.0
  ).rgb * 0.15;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate - vec2f(blurRadius.x, 0.0),
    0.0
  ).rgb * 0.15;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate + vec2f(0.0, blurRadius.y),
    0.0
  ).rgb * 0.15;
  sceneColor += textureSampleLevel(
    pbr_transmissionFramebufferSampler,
    pbr_transmissionFramebufferSamplerSampler,
    textureCoordinate - vec2f(0.0, blurRadius.y),
    0.0
  ).rgb * 0.15;
  return max(sceneColor, vec3f(0.0));
}

fn getTransmittedSceneColor(
  position: vec3f,
  normal: vec3f,
  viewDirection: vec3f,
  thickness: f32,
  perceptualRoughness: f32
) -> vec3f {
  if (pbrMaterial.dispersion <= 0.0) {
    return sampleTransmittedSceneColor(
      position,
      normal,
      viewDirection,
      thickness,
      perceptualRoughness,
      pbrMaterial.ior
    );
  }

  let halfSpread = (max(pbrMaterial.ior, 1.0) - 1.0) * 0.025 * pbrMaterial.dispersion;
  let indicesOfRefraction = max(
    vec3f(pbrMaterial.ior - halfSpread, pbrMaterial.ior, pbrMaterial.ior + halfSpread),
    vec3f(1.0)
  );
  return vec3f(
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.r
    ).r,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.g
    ).g,
    sampleTransmittedSceneColor(
      position, normal, viewDirection, thickness, perceptualRoughness, indicesOfRefraction.b
    ).b
  );
}
#endif

fn createClearcoatPBRInfo(
  basePBRInfo: PBRInfo,
  clearcoatNormal: vec3f,
  clearcoatRoughness: f32
) -> PBRInfo {
  let perceptualRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
  let alphaRoughness = perceptualRoughness * perceptualRoughness;
  let NdotV = clamp(abs(dot(clearcoatNormal, basePBRInfo.v)), 0.001, 1.0);

  return PBRInfo(
    basePBRInfo.NdotL,
    NdotV,
    basePBRInfo.NdotH,
    basePBRInfo.LdotH,
    basePBRInfo.VdotH,
    perceptualRoughness,
    0.0,
    vec3f(0.04),
    vec3f(1.0),
    alphaRoughness,
    vec3f(0.0),
    vec3f(0.04),
    clearcoatNormal,
    basePBRInfo.v,
    basePBRInfo.l,
    basePBRInfo.h
  );
}

fn calculateClearcoatContribution(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  clearcoatNormal: vec3f,
  clearcoatFactor: f32,
  clearcoatRoughness: f32
) -> vec3f {
  if (clearcoatFactor <= 0.0) {
    return vec3f(0.0);
  }

  let clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return calculateFinalColor(clearcoatPBRInfo, lightColor) * clearcoatFactor;
}

#ifdef USE_IBL
fn calculateClearcoatIBLContribution(
  pbrInfo: PBRInfo,
  clearcoatNormal: vec3f,
  reflection: vec3f,
  clearcoatFactor: f32,
  clearcoatRoughness: f32
) -> vec3f {
  if (clearcoatFactor <= 0.0) {
    return vec3f(0.0);
  }

  let clearcoatPBRInfo = createClearcoatPBRInfo(pbrInfo, clearcoatNormal, clearcoatRoughness);
  return getIBLContribution(clearcoatPBRInfo, clearcoatNormal, reflection) * clearcoatFactor;
}
#endif

fn calculateSheenContribution(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  sheenColor: vec3f,
  sheenRoughness: f32
) -> vec3f {
  if (maxComponent(sheenColor) <= 0.0) {
    return vec3f(0.0);
  }

  let alpha = max(sheenRoughness * sheenRoughness, 0.0001);
  let inverseAlpha = 1.0 / alpha;
  let sineSquared = max(1.0 - pbrInfo.NdotH * pbrInfo.NdotH, 0.0);
  let distribution = (2.0 + inverseAlpha) * pow(sineSquared, inverseAlpha * 0.5) /
    (2.0 * M_PI);
  let visibility = 1.0 / max(
    4.0 * (pbrInfo.NdotL + pbrInfo.NdotV - pbrInfo.NdotL * pbrInfo.NdotV),
    0.0001
  );
  return pbrInfo.NdotL * lightColor * sheenColor * distribution * visibility *
    (1.0 - pbrInfo.metalness);
}

fn calculateAnisotropicLightColor(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  anisotropyTangent: vec3f,
  anisotropyStrength: f32
) -> vec3f {
  if (anisotropyStrength <= 0.0) {
    return calculateFinalColor(pbrInfo, lightColor);
  }

  let anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  let tangentRoughness = mix(
    pbrInfo.alphaRoughness,
    1.0,
    anisotropyStrength * anisotropyStrength
  );
  let bitangentRoughness = clamp(pbrInfo.alphaRoughness, 0.001, 1.0);
  let roughnessProduct = tangentRoughness * bitangentRoughness;
  let distributionVector = vec3f(
    bitangentRoughness * dot(anisotropyTangent, pbrInfo.h),
    tangentRoughness * dot(anisotropyBitangent, pbrInfo.h),
    roughnessProduct * pbrInfo.NdotH
  );
  let distributionFactor = roughnessProduct /
    max(dot(distributionVector, distributionVector), 0.000001);
  let distribution = roughnessProduct * distributionFactor * distributionFactor / M_PI;
  let viewMask = pbrInfo.NdotL * length(vec3f(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.v),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.v),
    pbrInfo.NdotV
  ));
  let lightMask = pbrInfo.NdotV * length(vec3f(
    tangentRoughness * dot(anisotropyTangent, pbrInfo.l),
    bitangentRoughness * dot(anisotropyBitangent, pbrInfo.l),
    pbrInfo.NdotL
  ));
  let visibility = clamp(0.5 / max(viewMask + lightMask, 0.000001), 0.0, 1.0);
  let fresnel = specularReflection(pbrInfo);
  let diffuseContribution = (vec3f(1.0) - fresnel) * diffuse(pbrInfo);
  return pbrInfo.NdotL * lightColor *
    (diffuseContribution + fresnel * distribution * visibility);
}

fn getAnisotropicReflection(
  pbrInfo: PBRInfo,
  anisotropyTangent: vec3f,
  anisotropyStrength: f32
) -> vec3f {
  if (anisotropyStrength <= 0.0) {
    return -normalize(reflect(pbrInfo.v, pbrInfo.n));
  }
  let anisotropyBitangent = normalize(cross(pbrInfo.n, anisotropyTangent));
  var anisotropicNormal = normalize(cross(anisotropyBitangent, pbrInfo.v));
  anisotropicNormal = normalize(cross(anisotropicNormal, anisotropyBitangent));
  let bend = anisotropyStrength * (1.0 - pbrInfo.perceptualRoughness);
  return -normalize(reflect(pbrInfo.v, normalize(mix(pbrInfo.n, anisotropicNormal, bend))));
}

fn calculateMaterialLightColor(
  pbrInfo: PBRInfo,
  lightColor: vec3f,
  clearcoatNormal: vec3f,
  clearcoatFactor: f32,
  clearcoatRoughness: f32,
  sheenColor: vec3f,
  sheenRoughness: f32,
  anisotropyTangent: vec3f,
  anisotropyStrength: f32
) -> vec3f {
  var color = calculateAnisotropicLightColor(
    pbrInfo,
    lightColor,
    anisotropyTangent,
    anisotropyStrength
  );
  color += calculateClearcoatContribution(
    pbrInfo,
    lightColor,
    clearcoatNormal,
    clearcoatFactor,
    clearcoatRoughness
  );
  color += calculateSheenContribution(pbrInfo, lightColor, sheenColor, sheenRoughness);
  return color;
}

fn PBRInfo_setAmbientLight(pbrInfo: ptr<function, PBRInfo>) {
  (*pbrInfo).NdotL = 1.0;
  (*pbrInfo).NdotH = 0.0;
  (*pbrInfo).LdotH = 0.0;
  (*pbrInfo).VdotH = 1.0;
  (*pbrInfo).l = (*pbrInfo).n;
  (*pbrInfo).h = (*pbrInfo).n;
}

fn PBRInfo_setDirectionalLight(pbrInfo: ptr<function, PBRInfo>, lightDirection: vec3<f32>) {
  let n = (*pbrInfo).n;
  let v = (*pbrInfo).v;
  let l = normalize(lightDirection);             // Vector from surface point to light
  let h = normalize(l + v);                      // Half vector between both l and v

  (*pbrInfo).NdotL = clamp(dot(n, l), 0.001, 1.0);
  (*pbrInfo).NdotH = clamp(dot(n, h), 0.0, 1.0);
  (*pbrInfo).LdotH = clamp(dot(l, h), 0.0, 1.0);
  (*pbrInfo).VdotH = clamp(dot(v, h), 0.0, 1.0);
  (*pbrInfo).l = l;
  (*pbrInfo).h = h;
}

fn PBRInfo_setPointLight(pbrInfo: ptr<function, PBRInfo>, pointLight: PointLight) {
  let light_direction = normalize(pointLight.position - fragmentInputs.pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

fn PBRInfo_setSpotLight(pbrInfo: ptr<function, PBRInfo>, spotLight: SpotLight) {
  let light_direction = normalize(spotLight.position - fragmentInputs.pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

fn calculateFinalColor(pbrInfo: PBRInfo, lightColor: vec3<f32>) -> vec3<f32> {
  // Calculate the shading terms for the microfacet specular shading model
  let F = specularReflection(pbrInfo);
  let G = geometricOcclusion(pbrInfo);
  let D = microfacetDistribution(pbrInfo);

  // Calculation of analytical lighting contribution
  let diffuseContrib = (1.0 - F) * diffuse(pbrInfo);
  let specContrib = F * G * D / (4.0 * pbrInfo.NdotL * pbrInfo.NdotV);
  // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
  return pbrInfo.NdotL * lightColor * (diffuseContrib + specContrib);
}

// Visibility for the first four spotlights; environment and other lights are unaffected.
var<private> pbr_ambientVisibility: f32 = 1.0;

fn pbr_filterColorWithShadows(vertexColor: vec4<f32>, directionalVisibility: f32, pointVisibility: vec4f, spotVisibility: vec4f) -> vec4<f32> {
  let baseColorUV = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  let metallicRoughnessUV = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  let normalUV = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  let occlusionUV = getMaterialUV(pbrMaterial.occlusionUVSet, pbrMaterial.occlusionUVTransform);
  let emissiveUV = getMaterialUV(pbrMaterial.emissiveUVSet, pbrMaterial.emissiveUVTransform);
  let lightmapUV = getMaterialUV(pbrMaterial.lightmapUVSet, pbrMaterial.lightmapUVTransform);
  let specularColorUV = getMaterialUV(
    pbrMaterial.specularColorUVSet,
    pbrMaterial.specularColorUVTransform
  );
  let specularIntensityUV = getMaterialUV(
    pbrMaterial.specularIntensityUVSet,
    pbrMaterial.specularIntensityUVTransform
  );
  let transmissionUV = getMaterialUV(
    pbrMaterial.transmissionUVSet,
    pbrMaterial.transmissionUVTransform
  );
  let thicknessUV = getMaterialUV(pbrMaterial.thicknessUVSet, pbrMaterial.thicknessUVTransform);
  let clearcoatUV = getMaterialUV(pbrMaterial.clearcoatUVSet, pbrMaterial.clearcoatUVTransform);
  let clearcoatRoughnessUV = getMaterialUV(
    pbrMaterial.clearcoatRoughnessUVSet,
    pbrMaterial.clearcoatRoughnessUVTransform
  );
  let clearcoatNormalUV = getMaterialUV(
    pbrMaterial.clearcoatNormalUVSet,
    pbrMaterial.clearcoatNormalUVTransform
  );
  let sheenColorUV = getMaterialUV(
    pbrMaterial.sheenColorUVSet,
    pbrMaterial.sheenColorUVTransform
  );
  let sheenRoughnessUV = getMaterialUV(
    pbrMaterial.sheenRoughnessUVSet,
    pbrMaterial.sheenRoughnessUVTransform
  );
  let iridescenceUV = getMaterialUV(
    pbrMaterial.iridescenceUVSet,
    pbrMaterial.iridescenceUVTransform
  );
  let iridescenceThicknessUV = getMaterialUV(
    pbrMaterial.iridescenceThicknessUVSet,
    pbrMaterial.iridescenceThicknessUVTransform
  );
  let anisotropyUV = getMaterialUV(
    pbrMaterial.anisotropyUVSet,
    pbrMaterial.anisotropyUVTransform
  );
  let diffuseTransmissionUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionUVSet,
    pbrMaterial.diffuseTransmissionUVTransform
  );
  let diffuseTransmissionColorUV = getMaterialUV(
    pbrMaterial.diffuseTransmissionColorUVSet,
    pbrMaterial.diffuseTransmissionColorUVTransform
  );
  let multiscatterColorUV = getMaterialUV(
    pbrMaterial.multiscatterColorUVSet,
    pbrMaterial.multiscatterColorUVTransform
  );

  // The albedo may be defined from a base texture or a flat color
  var baseColor: vec4<f32> = pbrMaterial.baseColorFactor * vertexColor;
  #ifdef HAS_BASECOLORMAP
  baseColor = SRGBtoLINEAR(
    textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, baseColorUV)
  ) * pbrMaterial.baseColorFactor * vertexColor;
  #endif

  #ifdef ALPHA_CUTOFF
  if (baseColor.a < pbrMaterial.alphaCutoff) {
    discard;
  }
  #endif

  var color = vec3<f32>(0.0, 0.0, 0.0);
  var transmission = 0.0;

  var lightmapIrradiance = vec3<f32>(0.0);
  #ifdef HAS_LIGHTMAP
  if (pbrMaterial.lightmapMapEnabled != 0u) {
    lightmapIrradiance = textureSample(pbr_lightmapSampler, pbr_lightmapSamplerSampler, lightmapUV).rgb * pbrMaterial.lightmapIntensity;
  }
  #endif

  if (pbrMaterial.unlit != 0u) {
    color = baseColor.rgb;
    #ifdef HAS_LIGHTMAP
    if (pbrMaterial.lightmapMapEnabled != 0u) {
      color *= lightmapIrradiance / M_PI * pbr_ambientVisibility;
      #ifdef HAS_OCCLUSIONMAP
      if (pbrMaterial.occlusionMapEnabled != 0) {
        let ao = textureSample(pbr_occlusionSampler, pbr_occlusionSamplerSampler, occlusionUV).r;
        color = mix(color, color * ao, pbrMaterial.occlusionStrength);
      }
      #endif
    }
    #endif
  } else {
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    var perceptualRoughness = pbrMaterial.metallicRoughnessValues.y;
    var metallic = pbrMaterial.metallicRoughnessValues.x;
    #ifdef HAS_METALROUGHNESSMAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    let mrSample = textureSample(
      pbr_metallicRoughnessSampler,
      pbr_metallicRoughnessSamplerSampler,
      metallicRoughnessUV
    );
    perceptualRoughness = mrSample.g * perceptualRoughness;
    metallic = mrSample.b * metallic;
    #endif
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    let tbn = getTBN(normalUV);
    let n = getNormal(tbn, normalUV);                          // normal at surface point
    perceptualRoughness = widenSpecularRoughness(perceptualRoughness, n);
#ifdef USE_SCENE_PROBE_CAMERA
    let v = normalize(sceneProbeOrigin[0].xyz - fragmentInputs.pbr_vPosition);
#else
    let v = normalize(pbrProjection.camera - fragmentInputs.pbr_vPosition);
#endif  // Vector from surface point to camera
    let NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
    var useExtendedPBR = false;
    #ifdef USE_MATERIAL_EXTENSIONS
    useExtendedPBR =
      pbrMaterial.specularColorMapEnabled != 0 ||
      pbrMaterial.specularIntensityMapEnabled != 0 ||
      abs(pbrMaterial.specularIntensityFactor - 1.0) > 0.0001 ||
      maxComponent(abs(pbrMaterial.specularColorFactor - vec3f(1.0))) > 0.0001 ||
      abs(pbrMaterial.ior - 1.5) > 0.0001 ||
      pbrMaterial.dispersion > 0.0001 ||
      pbrMaterial.transmissionMapEnabled != 0 ||
      pbrMaterial.transmissionFactor > 0.0001 ||
      pbrMaterial.diffuseTransmissionMapEnabled != 0 ||
      pbrMaterial.diffuseTransmissionColorMapEnabled != 0 ||
      pbrMaterial.diffuseTransmissionFactor > 0.0001 ||
      pbrMaterial.multiscatterColorMapEnabled != 0 ||
      maxComponent(pbrMaterial.multiscatterColorFactor) > 0.0001 ||
      pbrMaterial.clearcoatMapEnabled != 0 ||
      pbrMaterial.clearcoatRoughnessMapEnabled != 0 ||
      pbrMaterial.clearcoatFactor > 0.0001 ||
      pbrMaterial.clearcoatRoughnessFactor > 0.0001 ||
      pbrMaterial.sheenColorMapEnabled != 0 ||
      pbrMaterial.sheenRoughnessMapEnabled != 0 ||
      maxComponent(pbrMaterial.sheenColorFactor) > 0.0001 ||
      pbrMaterial.sheenRoughnessFactor > 0.0001 ||
      pbrMaterial.iridescenceMapEnabled != 0 ||
      pbrMaterial.iridescenceFactor > 0.0001 ||
      abs(pbrMaterial.iridescenceIor - 1.3) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.x - 100.0) > 0.0001 ||
      abs(pbrMaterial.iridescenceThicknessRange.y - 400.0) > 0.0001 ||
      pbrMaterial.anisotropyMapEnabled != 0 ||
      pbrMaterial.anisotropyStrength > 0.0001 ||
      abs(pbrMaterial.anisotropyRotation) > 0.0001 ||
      length(pbrMaterial.anisotropyDirection - vec2f(1.0, 0.0)) > 0.0001;
    #endif

    if (!useExtendedPBR) {
      let alphaRoughness = perceptualRoughness * perceptualRoughness;

      let f0 = vec3<f32>(0.04);
      var diffuseColor = baseColor.rgb * (vec3<f32>(1.0) - f0);
      diffuseColor *= 1.0 - metallic;
      let specularColor = mix(f0, baseColor.rgb, metallic);

      let reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
      let reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
      let specularEnvironmentR0 = specularColor;
      let specularEnvironmentR90 = vec3<f32>(1.0, 1.0, 1.0) * reflectance90;
      let reflection = -normalize(reflect(v, n));

      var pbrInfo = PBRInfo(
        0.0, // NdotL
        NdotV,
        0.0, // NdotH
        0.0, // LdotH
        0.0, // VdotH
        perceptualRoughness,
        metallic,
        specularEnvironmentR0,
        specularEnvironmentR90,
        alphaRoughness,
        diffuseColor,
        specularColor,
        n,
        v,
        n,
        n
      );

      #ifdef USE_LIGHTS
      PBRInfo_setAmbientLight(&pbrInfo);
      color += calculateFinalColor(pbrInfo, lighting.ambientColor * pbr_ambientVisibility);

      for (var i = 0; i < lighting.directionalLightCount; i++) {
        if (i < lighting.directionalLightCount) {
          PBRInfo_setDirectionalLight(&pbrInfo, -lighting_getDirectionalLight(i).direction);
          color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color * select(1.0, clamp(directionalVisibility, 0.0, 1.0), i == 0));
        }
      }

      for (var i = 0; i < lighting.pointLightCount; i++) {
        if (i < lighting.pointLightCount) {
          PBRInfo_setPointLight(&pbrInfo, lighting_getPointLight(i));
          let attenuation = getPointLightAttenuation(
            lighting_getPointLight(i),
            distance(lighting_getPointLight(i).position, fragmentInputs.pbr_vPosition)
          );
          color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color * select(1.0, clamp(pointVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation);
        }
      }

      for (var i = 0; i < lighting.spotLightCount; i++) {
        if (i < lighting.spotLightCount) {
          PBRInfo_setSpotLight(&pbrInfo, lighting_getSpotLight(i));
          let attenuation = getSpotLightAttenuation(
            lighting_getSpotLight(i),
            fragmentInputs.pbr_vPosition
          );
          color += calculateFinalColor(pbrInfo, lighting_getSpotLight(i).color * select(1.0, clamp(spotVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation);
        }
      }
      for (var areaIndex: i32 = 0; areaIndex < areaLighting_getLightCount(); areaIndex++) {
#ifdef USE_AREA_LIGHT_LTC
        color += areaLTC_evaluate(areaIndex, fragmentInputs.pbr_vPosition, pbrInfo.n, pbrInfo.v, pbrInfo.perceptualRoughness, pbrInfo.diffuseColor, pbrInfo.reflectance0, pbrInfo.reflectance90);
#else
        for (var sampleIndex: i32 = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          let sampleLight = areaLighting_getSample(areaIndex, sampleIndex, fragmentInputs.pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(&pbrInfo, sampleLight);
            color += calculateFinalColor(pbrInfo, sampleLight.color);
          }
        }
#endif
      }
      #endif

      let indirectBaseColor = color;
#ifdef USE_IBL
      if (pbrMaterial.IBLenabled != 0) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
      #endif

      // The pinned KHR_lightmap draft explicitly defines c_diff = (1 - metallic) * baseColor.
      color += baseColor.rgb * (1.0 - metallic) * lightmapIrradiance / M_PI;
      color = indirectBaseColor + (color - indirectBaseColor) * pbr_ambientVisibility;

      #ifdef HAS_OCCLUSIONMAP
      if (pbrMaterial.occlusionMapEnabled != 0) {
        let ao = textureSample(pbr_occlusionSampler, pbr_occlusionSamplerSampler, occlusionUV).r;
        color = mix(color, color * ao, pbrMaterial.occlusionStrength);
      }
      #endif

      var emissive = pbrMaterial.emissiveFactor;
      #ifdef HAS_EMISSIVEMAP
      if (pbrMaterial.emissiveMapEnabled != 0u) {
        emissive *= SRGBtoLINEAR(
          textureSample(pbr_emissiveSampler, pbr_emissiveSamplerSampler, emissiveUV)
        ).rgb;
      }
      #endif
      color += emissive * pbrMaterial.emissiveStrength;

      #ifdef PBR_DEBUG
      color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
      color = mix(color, vec3<f32>(metallic), pbrMaterial.scaleDiffBaseMR.z);
      color = mix(color, vec3<f32>(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
      #endif

      return vec4<f32>(applySceneColorManagement(color), baseColor.a);
    }

    var specularIntensity = pbrMaterial.specularIntensityFactor;
    #ifdef HAS_SPECULARINTENSITYMAP
    if (pbrMaterial.specularIntensityMapEnabled != 0) {
      specularIntensity *= textureSample(
        pbr_specularIntensitySampler,
        pbr_specularIntensitySamplerSampler,
        specularIntensityUV
      ).a;
    }
    #endif

    var specularFactor = pbrMaterial.specularColorFactor;
    #ifdef HAS_SPECULARCOLORMAP
    if (pbrMaterial.specularColorMapEnabled != 0) {
      specularFactor *= SRGBtoLINEAR(
        textureSample(
          pbr_specularColorSampler,
          pbr_specularColorSamplerSampler,
          specularColorUV
        )
      ).rgb;
    }
    #endif

    transmission = pbrMaterial.transmissionFactor;
    #ifdef HAS_TRANSMISSIONMAP
    if (pbrMaterial.transmissionMapEnabled != 0) {
      transmission *= textureSample(
        pbr_transmissionSampler,
        pbr_transmissionSamplerSampler,
        transmissionUV
      ).r;
    }
    #endif
    transmission = clamp(transmission * (1.0 - metallic), 0.0, 1.0);
    var thickness = max(pbrMaterial.thicknessFactor, 0.0);
    #ifdef HAS_THICKNESSMAP
    thickness *= textureSample(
      pbr_thicknessSampler,
      pbr_thicknessSamplerSampler,
      thicknessUV
    ).g;
    #endif

    var diffuseTransmission = clamp(pbrMaterial.diffuseTransmissionFactor, 0.0, 1.0);
    #ifdef HAS_DIFFUSETRANSMISSIONMAP
    if (pbrMaterial.diffuseTransmissionMapEnabled != 0) {
      diffuseTransmission *= textureSample(
        pbr_diffuseTransmissionSampler,
        pbr_diffuseTransmissionSamplerSampler,
        diffuseTransmissionUV
      ).a;
    }
    #endif
    diffuseTransmission *= (1.0 - metallic) * (1.0 - transmission);
    var diffuseTransmissionColor = pbrMaterial.diffuseTransmissionColorFactor;
    #ifdef HAS_DIFFUSETRANSMISSIONCOLORMAP
    if (pbrMaterial.diffuseTransmissionColorMapEnabled != 0) {
      diffuseTransmissionColor *= SRGBtoLINEAR(
        textureSample(
          pbr_diffuseTransmissionColorSampler,
          pbr_diffuseTransmissionColorSamplerSampler,
          diffuseTransmissionColorUV
        )
      ).rgb;
    }
    #endif
    var multiscatterColor = pbrMaterial.multiscatterColorFactor;
    #ifdef HAS_MULTISCATTERCOLORMAP
    if (pbrMaterial.multiscatterColorMapEnabled != 0) {
      multiscatterColor *= SRGBtoLINEAR(
        textureSample(
          pbr_multiscatterColorSampler,
          pbr_multiscatterColorSamplerSampler,
          multiscatterColorUV
        )
      ).rgb;
    }
    #endif

    let originalTransmission = transmission;
    var scatterReflection = 0.0;
#ifdef HAS_MATERIAL_SCATTER
    if (thickness <= 0.0) {
      var strength = clamp(pbrMaterial.scatterStrengthFactor, 0.0, 1.0);
#ifdef HAS_DIFFUSETRANSMISSIONMAP
      if (pbrMaterial.diffuseTransmissionMapEnabled != 0) {
        strength *= textureSample(
        pbr_diffuseTransmissionSampler,
        pbr_diffuseTransmissionSamplerSampler,
        diffuseTransmissionUV
      ).a;
      }
#endif
      let anisotropy = pbrMaterial.scatterAnisotropy;
      scatterReflection = originalTransmission * strength * (1.0 - anisotropy) * 0.5;
      diffuseTransmission = originalTransmission * strength * (1.0 + anisotropy) * 0.5;
      diffuseTransmissionColor = multiscatterColor;
      transmission *= 1.0 - strength;
    }
#endif

    var clearcoatFactor = pbrMaterial.clearcoatFactor;
    var clearcoatRoughness = pbrMaterial.clearcoatRoughnessFactor;
    #ifdef HAS_CLEARCOATMAP
    if (pbrMaterial.clearcoatMapEnabled != 0) {
      clearcoatFactor *= textureSample(
        pbr_clearcoatSampler,
        pbr_clearcoatSamplerSampler,
        clearcoatUV
      ).r;
    }
    #endif
    #ifdef HAS_CLEARCOATROUGHNESSMAP
    if (pbrMaterial.clearcoatRoughnessMapEnabled != 0) {
      clearcoatRoughness *= textureSample(
        pbr_clearcoatRoughnessSampler,
        pbr_clearcoatRoughnessSamplerSampler,
        clearcoatRoughnessUV
      ).g;
    }
    #endif
    clearcoatFactor = clamp(clearcoatFactor, 0.0, 1.0);
    clearcoatRoughness = clamp(clearcoatRoughness, c_MinRoughness, 1.0);
    let clearcoatNormal = getClearcoatNormal(getTBN(clearcoatNormalUV), n, clearcoatNormalUV);
    clearcoatRoughness = widenSpecularRoughness(clearcoatRoughness, clearcoatNormal);

    var sheenColor = pbrMaterial.sheenColorFactor;
    var sheenRoughness = pbrMaterial.sheenRoughnessFactor;
    #ifdef HAS_SHEENCOLORMAP
    if (pbrMaterial.sheenColorMapEnabled != 0) {
      sheenColor *= SRGBtoLINEAR(
        textureSample(
          pbr_sheenColorSampler,
          pbr_sheenColorSamplerSampler,
          sheenColorUV
        )
      ).rgb;
    }
    #endif
    #ifdef HAS_SHEENROUGHNESSMAP
    if (pbrMaterial.sheenRoughnessMapEnabled != 0) {
      sheenRoughness *= textureSample(
        pbr_sheenRoughnessSampler,
        pbr_sheenRoughnessSamplerSampler,
        sheenRoughnessUV
      ).a;
    }
    #endif
    sheenRoughness = clamp(sheenRoughness, c_MinRoughness, 1.0);

    var iridescence = pbrMaterial.iridescenceFactor;
    #ifdef HAS_IRIDESCENCEMAP
    if (pbrMaterial.iridescenceMapEnabled != 0) {
      iridescence *= textureSample(
        pbr_iridescenceSampler,
        pbr_iridescenceSamplerSampler,
        iridescenceUV
      ).r;
    }
    #endif
    iridescence = clamp(iridescence, 0.0, 1.0);
    var iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      0.5
    );
    #ifdef HAS_IRIDESCENCETHICKNESSMAP
    iridescenceThickness = mix(
      pbrMaterial.iridescenceThicknessRange.x,
      pbrMaterial.iridescenceThicknessRange.y,
      textureSample(
        pbr_iridescenceThicknessSampler,
        pbr_iridescenceThicknessSamplerSampler,
        iridescenceThicknessUV
      ).g
    );
    #endif

    var anisotropyStrength = clamp(pbrMaterial.anisotropyStrength, 0.0, 1.0);
    var anisotropyDirection = normalizeDirection(pbrMaterial.anisotropyDirection);
    #ifdef HAS_ANISOTROPYMAP
    if (pbrMaterial.anisotropyMapEnabled != 0) {
      let anisotropySample = textureSample(
        pbr_anisotropySampler,
        pbr_anisotropySamplerSampler,
        anisotropyUV
      ).rgb;
      anisotropyStrength *= anisotropySample.b;
      let mappedDirection = anisotropySample.rg * 2.0 - 1.0;
      if (length(mappedDirection) > 0.0001) {
        anisotropyDirection = normalize(mappedDirection);
      }
    }
    #endif
    anisotropyDirection = rotateDirection(anisotropyDirection, pbrMaterial.anisotropyRotation);
    var anisotropyTangent =
      normalize(tbn[0] * anisotropyDirection.x + tbn[1] * anisotropyDirection.y);
    if (length(anisotropyTangent) < 0.0001) {
      anisotropyTangent = normalize(tbn[0]);
    }
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    let alphaRoughness = perceptualRoughness * perceptualRoughness;

    let dielectricF0 = getDielectricF0(pbrMaterial.ior);
    var dielectricSpecularF0 = min(
      vec3f(dielectricF0) * specularFactor * specularIntensity,
      vec3f(1.0)
    );
    dielectricSpecularF0 = getIridescenceTint(
      iridescence,
      iridescenceThickness,
      NdotV,
      dielectricSpecularF0
    );
    var diffuseColor = baseColor.rgb * (vec3f(1.0) - dielectricSpecularF0);
    diffuseColor *= (1.0 - metallic) * (1.0 - transmission) * (1.0 - diffuseTransmission);
#ifdef HAS_MATERIAL_SCATTER
    diffuseColor = (baseColor.rgb * (1.0 - metallic) * (1.0 - originalTransmission) +
      multiscatterColor * scatterReflection) * (vec3f(1.0) - dielectricSpecularF0);
#endif
    var specularColor = mix(dielectricSpecularF0, baseColor.rgb, metallic);

    let clearcoatViewFresnel = dielectricSchlick(
      0.04,
      clamp(abs(dot(clearcoatNormal, v)), 0.0, 1.0)
    );
    let sheenDirectionalAlbedo = maxComponent(sheenColor) *
      (0.157 + 0.343 * (1.0 - NdotV)) * (1.0 - sheenRoughness * 0.5);
    let baseLayerEnergy = (1.0 - clearcoatFactor * clearcoatViewFresnel) *
      (1.0 - clamp(sheenDirectionalAlbedo, 0.0, 1.0));
    diffuseColor *= baseLayerEnergy;
    specularColor *= baseLayerEnergy;

    // Compute reflectance.
    let reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing
    // reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%),
    // incrementally reduce grazing reflectance to 0%.
    let reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    let specularEnvironmentR0 = specularColor;
    let specularEnvironmentR90 = vec3<f32>(1.0, 1.0, 1.0) * reflectance90;
    let reflection = -normalize(reflect(v, n));

    var pbrInfo = PBRInfo(
      0.0, // NdotL
      NdotV,
      0.0, // NdotH
      0.0, // LdotH
      0.0, // VdotH
      perceptualRoughness,
      metallic,
      specularEnvironmentR0,
      specularEnvironmentR90,
      alphaRoughness,
      diffuseColor,
      specularColor,
      n,
      v,
      n,
      n
    );

    #ifdef USE_LIGHTS
    // Apply ambient light
    PBRInfo_setAmbientLight(&pbrInfo);
    color += calculateMaterialLightColor(
      pbrInfo,
      lighting.ambientColor * pbr_ambientVisibility,
      clearcoatNormal,
      clearcoatFactor,
      clearcoatRoughness,
      sheenColor,
      sheenRoughness,
      anisotropyTangent,
      anisotropyStrength
    );

    // Apply directional light
    for (var i = 0; i < lighting.directionalLightCount; i++) {
      if (i < lighting.directionalLightCount) {
        PBRInfo_setDirectionalLight(&pbrInfo, -lighting_getDirectionalLight(i).direction);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getDirectionalLight(i).color * select(1.0, clamp(directionalVisibility, 0.0, 1.0), i == 0),
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getDirectionalLight(i).color * select(1.0, clamp(directionalVisibility, 0.0, 1.0), i == 0),
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }

    // Apply point light
    for (var i = 0; i < lighting.pointLightCount; i++) {
      if (i < lighting.pointLightCount) {
        PBRInfo_setPointLight(&pbrInfo, lighting_getPointLight(i));
        let attenuation = getPointLightAttenuation(
          lighting_getPointLight(i),
          distance(lighting_getPointLight(i).position, fragmentInputs.pbr_vPosition)
        );
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getPointLight(i).color * select(1.0, clamp(pointVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getPointLight(i).color * select(1.0, clamp(pointVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }

    for (var i = 0; i < lighting.spotLightCount; i++) {
      if (i < lighting.spotLightCount) {
        PBRInfo_setSpotLight(&pbrInfo, lighting_getSpotLight(i));
        let attenuation = getSpotLightAttenuation(lighting_getSpotLight(i), fragmentInputs.pbr_vPosition);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getSpotLight(i).color * select(1.0, clamp(spotVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation,
          clearcoatNormal,
          clearcoatFactor,
          clearcoatRoughness,
          sheenColor,
          sheenRoughness,
          anisotropyTangent,
          anisotropyStrength
        );
        color += calculateDiffuseTransmissionLight(
          pbrInfo,
          lighting_getSpotLight(i).color * select(1.0, clamp(spotVisibility[min(i, 3)], 0.0, 1.0), i < 4) / attenuation,
          diffuseTransmissionColor,
          diffuseTransmission,
          multiscatterColor,
          thickness
        );
      }
    }
      for (var areaIndex: i32 = 0; areaIndex < areaLighting_getLightCount(); areaIndex++) {
#ifdef USE_AREA_LIGHT_LTC
        // Unsupported fits retain numerical integration rather than silently dropping material lobes.
        if (anisotropyStrength <= 0.0001 && dot(sheenColor, sheenColor) <= 0.000001 && diffuseTransmission <= 0.0001) {
        color += areaLTC_evaluate(areaIndex, fragmentInputs.pbr_vPosition, pbrInfo.n, pbrInfo.v, pbrInfo.perceptualRoughness, pbrInfo.diffuseColor, pbrInfo.reflectance0, pbrInfo.reflectance90);
        color += clearcoatFactor * areaLTC_specular(areaLighting_getLight(areaIndex), fragmentInputs.pbr_vPosition, clearcoatNormal, pbrInfo.v, clearcoatRoughness, vec3f(0.04), vec3f(1.0));
        } else {
        for (var sampleIndex: i32 = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          let sampleLight = areaLighting_getSample(areaIndex, sampleIndex, fragmentInputs.pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(&pbrInfo, sampleLight);
            color += calculateMaterialLightColor(pbrInfo, sampleLight.color, clearcoatNormal,
              clearcoatFactor, clearcoatRoughness, sheenColor, sheenRoughness, anisotropyTangent, anisotropyStrength);
            color += calculateDiffuseTransmissionLight(pbrInfo, sampleLight.color,
              diffuseTransmissionColor, diffuseTransmission, multiscatterColor, thickness);
          }
        }

        }
#else
        for (var sampleIndex: i32 = 0; sampleIndex < areaLighting.sampleCount; sampleIndex++) {
          let sampleLight = areaLighting_getSample(areaIndex, sampleIndex, fragmentInputs.pbr_vPosition);
          if (dot(sampleLight.color, sampleLight.color) > 0.0) {
            PBRInfo_setPointLight(&pbrInfo, sampleLight);
            color += calculateMaterialLightColor(pbrInfo, sampleLight.color, clearcoatNormal,
              clearcoatFactor, clearcoatRoughness, sheenColor, sheenRoughness, anisotropyTangent, anisotropyStrength);
            color += calculateDiffuseTransmissionLight(pbrInfo, sampleLight.color,
              diffuseTransmissionColor, diffuseTransmission, multiscatterColor, thickness);
          }
        }

#endif
      }
    #endif

    let indirectBaseColor = color;
    // Calculate lighting contribution from image based lighting source (IBL)
    #ifdef USE_IBL
    if (pbrMaterial.IBLenabled != 0) {
      color += getIBLContribution(
        pbrInfo,
        n,
        getAnisotropicReflection(pbrInfo, anisotropyTangent, anisotropyStrength)
      );
      color += calculateClearcoatIBLContribution(
        pbrInfo,
        clearcoatNormal,
        -normalize(reflect(v, clearcoatNormal)),
        clearcoatFactor,
        clearcoatRoughness
      );
      color += calculateDiffuseTransmissionIBL(
        pbrInfo,
        diffuseTransmissionColor,
        diffuseTransmission,
        multiscatterColor,
        thickness
      );
      color += sheenColor * pbrMaterial.scaleIBLAmbient.x * (1.0 - sheenRoughness) * 0.25;
    }
    #endif

#ifdef HAS_MATERIAL_SCATTER
    color += (baseColor.rgb * (1.0 - metallic) * (1.0 - originalTransmission) +
      multiscatterColor * scatterReflection) * baseLayerEnergy * lightmapIrradiance / M_PI;
#else
    color += baseColor.rgb * (1.0 - metallic) * (1.0 - transmission) *
      (1.0 - diffuseTransmission) * baseLayerEnergy * lightmapIrradiance / M_PI;
#endif

    color = indirectBaseColor + (color - indirectBaseColor) * pbr_ambientVisibility;

    // Apply optional PBR terms for additional (optional) shading
    #ifdef HAS_OCCLUSIONMAP
    if (pbrMaterial.occlusionMapEnabled != 0) {
      let ao = textureSample(pbr_occlusionSampler, pbr_occlusionSamplerSampler, occlusionUV).r;
      color = mix(color, color * ao, pbrMaterial.occlusionStrength);
    }
    #endif

    var emissive = pbrMaterial.emissiveFactor;
    #ifdef HAS_EMISSIVEMAP
    if (pbrMaterial.emissiveMapEnabled != 0u) {
      emissive *= SRGBtoLINEAR(
        textureSample(pbr_emissiveSampler, pbr_emissiveSamplerSampler, emissiveUV)
      ).rgb;
    }
    #endif
    color += emissive * pbrMaterial.emissiveStrength;

    if (transmission > 0.0) {
      #ifdef USE_TRANSMISSION_FRAMEBUFFER
      let dielectricFresnel = getDielectricF0(pbrMaterial.ior);
      let transmissionFresnel = dielectricFresnel +
        (1.0 - dielectricFresnel) * pow(1.0 - NdotV, 5.0);
      let transmittedColor = getTransmittedSceneColor(
        fragmentInputs.pbr_vPosition,
        n,
        v,
        thickness,
        perceptualRoughness
      );
      color += transmittedColor * getVolumeAttenuation(thickness) *
        transmission * (1.0 - transmissionFresnel);
      #else
      color = mix(color, color * getVolumeAttenuation(thickness), transmission);
      #endif
    }

    // This section uses mix to override final color for reference app visualization
    // of various parameters in the lighting equation.
    #ifdef PBR_DEBUG
    // TODO: Figure out how to debug multiple lights

    // color = mix(color, F, pbr_scaleFGDSpec.x);
    // color = mix(color, vec3(G), pbr_scaleFGDSpec.y);
    // color = mix(color, vec3(D), pbr_scaleFGDSpec.z);
    // color = mix(color, specContrib, pbr_scaleFGDSpec.w);

    // color = mix(color, diffuseContrib, pbr_scaleDiffBaseMR.x);
    color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
    color = mix(color, vec3<f32>(metallic), pbrMaterial.scaleDiffBaseMR.z);
    color = mix(color, vec3<f32>(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
    #endif
  }

  #ifdef USE_TRANSMISSION_FRAMEBUFFER
  let alpha = clamp(baseColor.a, 0.0, 1.0);
  #else
  let alpha = clamp(baseColor.a * (1.0 - transmission), 0.0, 1.0);
  #endif
  return vec4<f32>(applySceneColorManagement(color), alpha);
}

// Depth-only passes use the same base-color alpha, vertex color and UV transform.
fn pbr_discardMaskedFragment(vertexColor: vec4f) {
#ifdef ALPHA_CUTOFF
  var alpha = pbrMaterial.baseColorFactor.a * vertexColor.a;
#ifdef HAS_BASECOLORMAP
  alpha *= textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform)).a;
#endif
  if (alpha < pbrMaterial.alphaCutoff) {discard;}
#endif
}

fn pbr_filterColorWithSpotShadows(vertexColor: vec4f, spotVisibility: vec4f) -> vec4f {
  return pbr_filterColorWithShadows(vertexColor, 1.0, vec4f(1.0), spotVisibility);
}

fn pbr_filterColor(vertexColor: vec4<f32>) -> vec4<f32> {
  return pbr_filterColorWithSpotShadows(vertexColor, vec4f(1.0));
}
`,k_=`layout(std140) uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,A_={name:`pbrProjection`,bindingLayout:[{name:`pbrProjection`,group:0}],source:`struct pbrProjectionUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  camera: vec3<f32>
};

@group(0) @binding(auto) var<uniform> pbrProjection: pbrProjectionUniforms;
`,vs:k_,fs:k_,getUniforms:e=>e,uniformTypes:{modelViewProjectionMatrix:`mat4x4<f32>`,modelMatrix:`mat4x4<f32>`,normalMatrix:`mat4x4<f32>`,camera:`vec3<f32>`}},j_={NONE:0,REINHARD:1,KHRONOS_PBR_NEUTRAL:2,ACES:3},M_=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],N_=`layout(std140) uniform pbrSceneUniforms {
  float exposure;
  highp int toneMapMode;
  float environmentIntensity;
  float environmentRotation;
  float environmentMipCount;
  highp int outputEncoding;
  vec2 framebufferSize;
  mat4 viewMatrix;
  mat4 projectionMatrix;
} pbrScene;

#ifdef USE_TRANSMISSION_FRAMEBUFFER
uniform sampler2D pbr_transmissionFramebufferSampler;
#endif
`,P_={props:{},uniforms:{},defaultUniforms:{unlit:!1,baseColorMapEnabled:!1,baseColorFactor:[1,1,1,1],normalMapEnabled:!1,normalScale:1,emissiveMapEnabled:!1,lightmapMapEnabled:!1,emissiveFactor:[0,0,0],metallicRoughnessValues:[1,1],metallicRoughnessMapEnabled:!1,occlusionMapEnabled:!1,occlusionStrength:1,alphaCutoffEnabled:!1,alphaCutoff:.5,IBLenabled:!1,scaleIBLAmbient:[1,1],scaleDiffBaseMR:[0,0,0,0],scaleFGDSpec:[0,0,0,0],specularColorFactor:[1,1,1],specularIntensityFactor:1,specularColorMapEnabled:!1,specularIntensityMapEnabled:!1,ior:1.5,transmissionFactor:0,transmissionMapEnabled:!1,thicknessFactor:0,attenuationDistance:1e9,attenuationColor:[1,1,1],clearcoatFactor:0,clearcoatRoughnessFactor:0,clearcoatMapEnabled:!1,clearcoatRoughnessMapEnabled:!1,sheenColorFactor:[0,0,0],sheenRoughnessFactor:0,sheenColorMapEnabled:!1,sheenRoughnessMapEnabled:!1,iridescenceFactor:0,iridescenceIor:1.3,iridescenceThicknessRange:[100,400],iridescenceMapEnabled:!1,anisotropyStrength:0,anisotropyRotation:0,anisotropyDirection:[1,0],anisotropyMapEnabled:!1,emissiveStrength:1,lightmapIntensity:1,scatterStrengthFactor:0,dispersion:0,baseColorUVSet:0,baseColorUVTransform:[1,0,0,0,1,0,0,0,1],metallicRoughnessUVSet:0,metallicRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],normalUVSet:0,normalUVTransform:[1,0,0,0,1,0,0,0,1],occlusionUVSet:0,occlusionUVTransform:[1,0,0,0,1,0,0,0,1],emissiveUVSet:0,lightmapUVSet:0,emissiveUVTransform:[1,0,0,0,1,0,0,0,1],lightmapUVTransform:[1,0,0,0,1,0,0,0,1],specularColorUVSet:0,specularColorUVTransform:[1,0,0,0,1,0,0,0,1],specularIntensityUVSet:0,specularIntensityUVTransform:[1,0,0,0,1,0,0,0,1],transmissionUVSet:0,transmissionUVTransform:[1,0,0,0,1,0,0,0,1],thicknessUVSet:0,thicknessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatUVSet:0,clearcoatUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatRoughnessUVSet:0,clearcoatRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatNormalUVSet:0,clearcoatNormalUVTransform:[1,0,0,0,1,0,0,0,1],sheenColorUVSet:0,sheenColorUVTransform:[1,0,0,0,1,0,0,0,1],sheenRoughnessUVSet:0,sheenRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceUVSet:0,iridescenceUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceThicknessUVSet:0,iridescenceThicknessUVTransform:[1,0,0,0,1,0,0,0,1],anisotropyUVSet:0,anisotropyUVTransform:[1,0,0,0,1,0,0,0,1],bumpFactor:1,bumpMapEnabled:!1,diffuseTransmissionFactor:0,diffuseTransmissionMapEnabled:!1,diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorMapEnabled:!1,multiscatterColorFactor:[0,0,0],multiscatterColorMapEnabled:!1,scatterAnisotropy:0,bumpUVSet:0,bumpUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionUVSet:0,diffuseTransmissionUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionColorUVSet:0,diffuseTransmissionColorUVTransform:[1,0,0,0,1,0,0,0,1],multiscatterColorUVSet:0,multiscatterColorUVTransform:[1,0,0,0,1,0,0,0,1]},name:`pbrMaterial`,firstBindingSlot:0,bindingLayout:[{name:`pbrMaterial`,group:3},{name:`pbr_baseColorSampler`,group:3},{name:`pbr_normalSampler`,group:3},{name:`pbr_emissiveSampler`,group:3},{name:`pbr_lightmapSampler`,group:3},{name:`pbr_metallicRoughnessSampler`,group:3},{name:`pbr_occlusionSampler`,group:3},{name:`pbr_specularColorSampler`,group:3},{name:`pbr_specularIntensitySampler`,group:3},{name:`pbr_transmissionSampler`,group:3},{name:`pbr_thicknessSampler`,group:3},{name:`pbr_clearcoatSampler`,group:3},{name:`pbr_clearcoatRoughnessSampler`,group:3},{name:`pbr_clearcoatNormalSampler`,group:3},{name:`pbr_sheenColorSampler`,group:3},{name:`pbr_sheenRoughnessSampler`,group:3},{name:`pbr_iridescenceSampler`,group:3},{name:`pbr_iridescenceThicknessSampler`,group:3},{name:`pbr_anisotropySampler`,group:3},{name:`pbr_bumpSampler`,group:3},{name:`pbr_diffuseTransmissionSampler`,group:3},{name:`pbr_diffuseTransmissionColorSampler`,group:3},{name:`pbr_multiscatterColorSampler`,group:3}],dependencies:[u_,T_,x_,A_,{name:`pbrScene`,bindingLayout:[{name:`pbrScene`,group:1},{name:`pbr_transmissionFramebufferSampler`,group:1}],source:`struct pbrSceneUniforms {
  exposure: f32,
  toneMapMode: i32,
  environmentIntensity: f32,
  environmentRotation: f32,
  environmentMipCount: f32,
  outputEncoding: i32,
  framebufferSize: vec2<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>
};

@group(1) @binding(auto) var<uniform> pbrScene: pbrSceneUniforms;

#ifdef USE_TRANSMISSION_FRAMEBUFFER
@group(1) @binding(auto) var pbr_transmissionFramebufferSampler: texture_2d<f32>;
@group(1) @binding(auto) var pbr_transmissionFramebufferSamplerSampler: sampler;
#endif
`,vs:N_,fs:N_,getUniforms:e=>e,uniformTypes:{exposure:`f32`,toneMapMode:`i32`,environmentIntensity:`f32`,environmentRotation:`f32`,environmentMipCount:`f32`,outputEncoding:`i32`,framebufferSize:`vec2<f32>`,viewMatrix:`mat4x4<f32>`,projectionMatrix:`mat4x4<f32>`},defaultUniforms:{exposure:1,toneMapMode:j_.KHRONOS_PBR_NEUTRAL,environmentIntensity:1,environmentRotation:Math.PI*.5,environmentMipCount:1,outputEncoding:1,framebufferSize:[1,1],viewMatrix:M_,projectionMatrix:M_}}],source:O_,vs:E_,fs:D_,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_LIGHTMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,HAS_SPECULARCOLORMAP:!1,HAS_SPECULARINTENSITYMAP:!1,HAS_TRANSMISSIONMAP:!1,HAS_THICKNESSMAP:!1,HAS_CLEARCOATMAP:!1,HAS_CLEARCOATROUGHNESSMAP:!1,HAS_CLEARCOATNORMALMAP:!1,HAS_SHEENCOLORMAP:!1,HAS_SHEENROUGHNESSMAP:!1,HAS_IRIDESCENCEMAP:!1,HAS_IRIDESCENCETHICKNESSMAP:!1,HAS_ANISOTROPYMAP:!1,HAS_BUMPMAP:!1,HAS_DIFFUSETRANSMISSIONMAP:!1,HAS_DIFFUSETRANSMISSIONCOLORMAP:!1,HAS_MULTISCATTERCOLORMAP:!1,USE_MATERIAL_EXTENSIONS:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:e=>e,uniformTypes:{unlit:`i32`,baseColorMapEnabled:`i32`,baseColorFactor:`vec4<f32>`,normalMapEnabled:`i32`,normalScale:`f32`,emissiveMapEnabled:`i32`,emissiveFactor:`vec3<f32>`,metallicRoughnessValues:`vec2<f32>`,metallicRoughnessMapEnabled:`i32`,occlusionMapEnabled:`i32`,occlusionStrength:`f32`,alphaCutoffEnabled:`i32`,alphaCutoff:`f32`,specularColorFactor:`vec3<f32>`,specularIntensityFactor:`f32`,specularColorMapEnabled:`i32`,specularIntensityMapEnabled:`i32`,ior:`f32`,transmissionFactor:`f32`,transmissionMapEnabled:`i32`,thicknessFactor:`f32`,attenuationDistance:`f32`,attenuationColor:`vec3<f32>`,clearcoatFactor:`f32`,clearcoatRoughnessFactor:`f32`,clearcoatMapEnabled:`i32`,clearcoatRoughnessMapEnabled:`i32`,sheenColorFactor:`vec3<f32>`,sheenRoughnessFactor:`f32`,sheenColorMapEnabled:`i32`,sheenRoughnessMapEnabled:`i32`,iridescenceFactor:`f32`,iridescenceIor:`f32`,iridescenceThicknessRange:`vec2<f32>`,iridescenceMapEnabled:`i32`,anisotropyStrength:`f32`,anisotropyRotation:`f32`,anisotropyDirection:`vec2<f32>`,anisotropyMapEnabled:`i32`,emissiveStrength:`f32`,dispersion:`f32`,IBLenabled:`i32`,scaleIBLAmbient:`vec2<f32>`,scaleDiffBaseMR:`vec4<f32>`,scaleFGDSpec:`vec4<f32>`,baseColorUVSet:`i32`,baseColorUVTransform:`mat3x3<f32>`,metallicRoughnessUVSet:`i32`,metallicRoughnessUVTransform:`mat3x3<f32>`,normalUVSet:`i32`,normalUVTransform:`mat3x3<f32>`,occlusionUVSet:`i32`,occlusionUVTransform:`mat3x3<f32>`,emissiveUVSet:`i32`,emissiveUVTransform:`mat3x3<f32>`,specularColorUVSet:`i32`,specularColorUVTransform:`mat3x3<f32>`,specularIntensityUVSet:`i32`,specularIntensityUVTransform:`mat3x3<f32>`,transmissionUVSet:`i32`,transmissionUVTransform:`mat3x3<f32>`,thicknessUVSet:`i32`,thicknessUVTransform:`mat3x3<f32>`,clearcoatUVSet:`i32`,clearcoatUVTransform:`mat3x3<f32>`,clearcoatRoughnessUVSet:`i32`,clearcoatRoughnessUVTransform:`mat3x3<f32>`,clearcoatNormalUVSet:`i32`,clearcoatNormalUVTransform:`mat3x3<f32>`,sheenColorUVSet:`i32`,sheenColorUVTransform:`mat3x3<f32>`,sheenRoughnessUVSet:`i32`,sheenRoughnessUVTransform:`mat3x3<f32>`,iridescenceUVSet:`i32`,iridescenceUVTransform:`mat3x3<f32>`,iridescenceThicknessUVSet:`i32`,iridescenceThicknessUVTransform:`mat3x3<f32>`,anisotropyUVSet:`i32`,anisotropyUVTransform:`mat3x3<f32>`,bumpFactor:`f32`,bumpMapEnabled:`i32`,diffuseTransmissionFactor:`f32`,diffuseTransmissionMapEnabled:`i32`,diffuseTransmissionColorFactor:`vec3<f32>`,diffuseTransmissionColorMapEnabled:`i32`,multiscatterColorFactor:`vec3<f32>`,multiscatterColorMapEnabled:`i32`,scatterAnisotropy:`f32`,bumpUVSet:`i32`,bumpUVTransform:`mat3x3<f32>`,diffuseTransmissionUVSet:`i32`,diffuseTransmissionUVTransform:`mat3x3<f32>`,diffuseTransmissionColorUVSet:`i32`,diffuseTransmissionColorUVTransform:`mat3x3<f32>`,multiscatterColorUVSet:`i32`,multiscatterColorUVTransform:`mat3x3<f32>`,lightmapMapEnabled:`i32`,lightmapIntensity:`f32`,lightmapUVSet:`i32`,lightmapUVTransform:`mat3x3<f32>`,scatterStrengthFactor:`f32`}},F_=class{buffer;byteOffset=0;constructor(e){this.device=e}prepare(e){if(!this.buffer||this.buffer.byteLength<e){let t=Math.max(1024,(this.buffer?.byteLength??0)*2,e),r=this.device.createBuffer({id:`batch-uniforms`,byteLength:t,usage:n.UNIFORM|n.COPY_DST});this.buffer?.destroy(),this.buffer=r}this.byteOffset=0}getAlignedByteLength(e){let t=this.device.limits.minUniformBufferOffsetAlignment||1;return Math.ceil(e/t)*t}write(e){o(this.buffer&&this.byteOffset+e.byteLength<=this.buffer.byteLength);let t={buffer:this.buffer,offset:this.byteOffset,size:e.byteLength};return this.buffer.write(e,t.offset),this.byteOffset+=this.getAlignedByteLength(e.byteLength),t}destroy(){this.buffer?.destroy(),this.buffer=void 0,this.byteOffset=0}};function I_(e,t){let n={},r=`Values`;if(e.attributes.length===0&&!e.varyings?.length)return{"No attributes or varyings":{[r]:`N/A`}};for(let t of e.attributes)if(t){let e=`${t.location} ${t.name}: ${t.type}`;n[`in ${e}`]={[r]:t.stepMode||`vertex`}}for(let t of e.varyings||[]){let e=`${t.location} ${t.name}`;n[`out ${e}`]={[r]:JSON.stringify(t)}}return n}var L_=`__debugFramebufferState`,R_=8;function z_(e,t,n){if(e.device.type!==`webgl`)return;let r=H_(e.device);if(!r.flushing){if(W_(e)){B_(e,n,r);return}t&&U_(t)&&t.handle!==null&&(r.queuedFramebuffers.includes(t)||r.queuedFramebuffers.push(t))}}function B_(e,t,n){if(n.queuedFramebuffers.length===0)return;let{gl:r}=e.device,i=r.getParameter(r.READ_FRAMEBUFFER_BINDING),a=r.getParameter(r.DRAW_FRAMEBUFFER_BINDING),[o,s]=e.device.getDefaultCanvasContext().getDrawingBufferSize(),c=G_(t.top,R_),l=G_(t.left,R_);n.flushing=!0;try{for(let e of n.queuedFramebuffers){let[n,i,a,u,d]=V_({framebuffer:e,targetWidth:o,targetHeight:s,topPx:c,leftPx:l,minimap:t.minimap});r.bindFramebuffer(r.READ_FRAMEBUFFER,e.handle),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.blitFramebuffer(0,0,e.width,e.height,n,i,a,u,r.COLOR_BUFFER_BIT,r.NEAREST),c+=d+R_}}finally{r.bindFramebuffer(r.READ_FRAMEBUFFER,i),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,a),n.flushing=!1}}function V_(e){let{framebuffer:t,targetWidth:n,targetHeight:r,topPx:i,leftPx:a,minimap:o}=e,s=o?Math.max(Math.floor(n/4),1):n,c=o?Math.max(Math.floor(r/4),1):r,l=Math.min(s/t.width,c/t.height),u=Math.max(Math.floor(t.width*l),1),d=Math.max(Math.floor(t.height*l),1),f=a,p=Math.max(r-i-d,0);return[f,p,f+u,p+d,d]}function H_(e){return e.userData[L_]||={flushing:!1,queuedFramebuffers:[]},e.userData[L_]}function U_(e){return`colorAttachments`in e}function W_(e){let t=e.props.framebuffer;return!t||t.handle===null}function G_(e,t){if(!e)return t;let n=Number.parseInt(e,10);return Number.isFinite(n)?n:t}function K_(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!K_(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=e,i=t,a=Object.keys(e),o=Object.keys(t);if(a.length!==o.length)return!1;for(let e of a)if(!t.hasOwnProperty(e)||!K_(r[e],i[e],n-1))return!1;return!0}return!1}var q_=class{bufferLayouts;constructor(e){this.bufferLayouts=e}getBufferLayout(e){return this.bufferLayouts.find(t=>t.name===e)||null}getAttributeNamesForBuffer(e){return te(e)}mergeBufferLayouts(e,t){let n=[...e];for(let e of t){let t=n.findIndex(t=>t.name===e.name);t<0?n.push(e):n[t]=e}return n}};function J_(e,t){let n=A(e),r=t.slice();return r.sort((e,t)=>b(te(e).map(e=>n[e]))-b(te(t).map(e=>n[e]))),r}function Y_(e,t){if(!e||!t.some(e=>e.bindingLayout?.length))return e;let n={...e,bindings:e.bindings.map(e=>({...e}))};`attributes`in(e||{})&&(n.attributes=e?.attributes||[]);for(let e of t)for(let t of e.bindingLayout||[])for(let e of ev(t.name)){let r=n.bindings.find(t=>t.name===e);r?.group===0&&(r.group=t.group),r&&t.visibility!==void 0&&(r.visibility=t.visibility)}return n}function X_(e,t,n=[]){return e?t?{...e,attributes:e.attributes.length?rv(e.attributes,t.attributes.filter(e=>n.includes(e.name))):t.attributes,bindings:nv(e.bindings,t.bindings)}:e:t}function Z_(e){return!!(e.uniformTypes&&!tv(e.uniformTypes))}function Q_(e){let t=[];for(let n of e){let e=Me(n),r=new Set([n.vs,n.fs].flatMap(e=>e?Ee(e).filter(e=>e.isStd140).map(e=>e.blockName):[])),i=r.has(e)?e:r.size===1?r.values().next().value:void 0;Z_(n)&&i&&t.push({name:i,uniformTypes:n.uniformTypes})}return t}function $_(e,t){let n=[],r=new Set;for(let i of[...e||[],...t||[]])r.has(i.name)||(r.add(i.name),n.push(i));return n}function ev(e){let t=new Set([e,`${e}Uniforms`]);return e.endsWith(`Uniforms`)||t.add(`${e}Sampler`),[...t]}function tv(e){for(let t in e)return!1;return!0}function nv(e,t){let n=e.map(e=>({...e})),r=new Set(e.map(e=>e.name)),i=new Set(e.map(e=>`${e.group}:${e.location}`));for(let e of t){let t=`${e.group}:${e.location}`;!r.has(e.name)&&!i.has(t)&&n.push({...e})}return n}function rv(e,t){let n=e.map(e=>({...e})),r=new Map(e.map(e=>[e.name,e])),i=new Map(e.map(e=>[e.location,e]));for(let e of t){let t=r.get(e.name);if(t){if(t.type!==e.type||t.location!==e.location)throw Error(`Shader attribute "${e.name}" conflicts with its inferred type or location`);continue}let a=i.get(e.location);if(a)throw Error(`Shader attributes "${a.name}" and "${e.name}" both use location ${e.location}`);n.push({...e})}return n}var iv={};function av(e=`id`){return iv[e]=iv[e]||1,`${e}-${iv[e]++}`}function ov(e,t,n){for(let[r,i]of Object.entries(t)){if(!i)continue;if(!i.format)throw Error(`${e} GPUVector "${r}" requires a format`);let t=n.find(e=>e.name===r);if(!t)throw Error(`${e} GPUVector "${r}" requires a Model buffer layout`);let a=t.attributes??[];if(a.length>1)throw Error(`${e} GPUVector "${r}" does not support interleaved layouts`);let o=a[0],s=t.format??o?.format,c=cv(e,r,i.format),l=t.byteStride??c.byteLength;if(s!==i.format||l!==i.byteStride||i.rowByteLength!==c.byteLength)throw Error(`${e} GPUVector "${r}" must match its Model buffer layout`)}}function sv(e,t){let n=Object.entries(t).filter(e=>e[1]!==void 0);if(n.length===0)return[];let[r,i]=n[0];for(let[t,a]of n){if(!a.format)throw Error(`${e} GPUVector "${t}" requires a format`);if(cv(e,t,a.format),a.length!==i.length)throw Error(`${e} GPUVector "${t}" rows must match "${r}" rows`);if(a.data.length!==i.data.length)throw Error(`${e} GPUVector chunk counts must align`)}let a=0;return i.data.map((t,r)=>{let i={};for(let[a,o]of n){let n=o.data[r];if(!n||n.length!==t.length)throw Error(`${e} GPUVector chunk ${r} row counts must align`);if(n.format!==o.format||n.byteStride!==o.byteStride||n.rowByteLength!==o.rowByteLength)throw Error(`${e} GPUVector "${a}" chunk layout must be stable`);i[a]=n}let o={batchIndex:r,rowIndexOffset:a,rowCount:t.length,data:i};return a+=t.length,o})}function cv(e,t,n){if(n.includes(`<`))throw Error(`${e} GPUVector "${t}" requires a fixed-width scalar format`);return u.getVertexFormatInfo(n)}function lv(e){let t;for(let n of Object.values(e)){if(!n||`isConstant`in n)continue;let e=0;for(let t of n.data)e+=t.length;if(o(e===n.length),t){o(n.length===t.length&&n.data.length===t.data.length);for(let e=0;e<n.data.length;e++)o(n.data[e].length===t.data[e].length)}else t=n}}function uv(e,t,n,r,i,a){let o=t.inputs,s=n.inputs,c=t.sourceLayouts,l=n.sourceLayouts,u=t.layouts,d=n.layouts,f=n.stepMode,p=t.batchCount,m=n.batchCount,h=Array.from({length:p},(e,n)=>t.getBatch(n)),g=Array.from({length:m},(e,t)=>n.getBatch(t)),_=dv(h),v=dv(g),y=e.vertexCount,b=e.instanceCount,x=!0;try{let o=e.isInstanced&&n.vertexCount===void 0,s=o?p*m:Math.max(p,m);if(p===0||m===0)return!0;for(let c=0;c<s;c++){let s=o?Math.floor(c/m):Math.min(c,p-1),l=o?c%m:Math.min(c,m-1);t.setInputs(h[s],u,`vertex`),n.setInputs(g[l],d,f),r();let S=t.rowCount===void 0?n.vertexCount===void 0?0:v[l]:_[s];a===`vertex`&&e.setVertexCount(Math.max(0,Math.min(t.rowCount??n.vertexCount??y,y-S))),a===`instance`&&n.instanceCount!==void 0&&e.setInstanceCount(Math.max(0,Math.min(n.instanceCount,b-v[l]))),!(!e.indexBuffer&&e.vertexCount===0||e.isInstanced&&e.instanceCount===0)&&(x=i()&&x)}}finally{t.setInputs(o,c,`vertex`),n.setInputs(s,l,f),r(),e.setVertexCount(y),e.setInstanceCount(b)}return x}function dv(e){let t=0;return e.map(e=>{let n=t;for(let n of Object.values(e))if(n&&`data`in n){t+=n.length;break}return n})}var fv=class{inputs={};sourceLayouts;stepMode=`vertex`;claimedNames=new Set;layouts=[];buffers={};byteOffsets={};constants={};rowCount;vertexCount;instanceCount;constantBuffers={};constructor(e,t){this.device=e,this.id=t}setInputs(e,t,r,i=!0){if(i)lv(e);else for(let t of Object.values(e))t&&!W(t)&&o(t.data.length===1);this.claimedNames.clear(),this.inputs=e,this.sourceLayouts=t,this.stepMode=r,this.rowCount=void 0,this.vertexCount=void 0,this.instanceCount=void 0;let a=t??Object.entries(e).flatMap(([e,t])=>t&&!W(t)&&t.bufferLayout?[{...t.bufferLayout,name:e}]:[]),s=Object.entries(e).flatMap(([e,t])=>{if(!t||a.some(t=>t.name===e||t.attributes?.some(t=>t.attribute===e)))return[];o(t.format);let n=t.format;return[{name:e,stepMode:r,byteStride:W(t)?0:t.byteStride,attributes:[{attribute:e,format:n,byteOffset:0}]}]}),c=[...a,...mv(e,s)];for(let[t,n]of Object.entries(e))if(n){if(!W(n)&&!Array.isArray(n.data))throw TypeError(`Expected a GPU vector or constant for ${t}`);!W(n)&&i&&((c.find(e=>e.name===t||e.attributes?.some(e=>e.attribute===t))?.stepMode??r)===`instance`?(o(this.instanceCount===void 0||this.instanceCount===n.length),this.instanceCount=n.length):(o(this.vertexCount===void 0||this.vertexCount===n.length),this.vertexCount=n.length),this.rowCount=r===`instance`?this.instanceCount:this.vertexCount),this.claimedNames.add(t)}this.layouts=c.flatMap(t=>{let n=e[t.name],i=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]),a=i.filter(t=>W(e[t.attribute])),o={...t,stepMode:t.stepMode??r};return this.device.type!==`webgpu`||n&&!W(n)&&n.bufferLayout||!a.length||a.length===i.length?[{...o,byteStride:a.length===i.length&&a.length?0:o.byteStride}]:[{...o,attributes:i.filter(t=>!W(e[t.attribute]))},{...o,name:`${t.name}-constants`,byteStride:0,attributes:a}]}),this.buffers={},this.byteOffsets={},this.constants={};let l=new Set;for(let t of this.layouts){this.claimedNames.add(t.name);let r=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]);for(let e of r)this.claimedNames.add(e.attribute);let i=e[t.name];if(i&&!W(i)){let e=i.bufferLayout||!i.format?0:(r.find(e=>e.attribute===t.name)??r[0])?.byteOffset??0;this.bindVector(t.name,i,e)}let a=0;for(let n of r){let r=e[n.attribute]??(n.attribute===t.name?e[t.name]:void 0);r&&(o(r.format===void 0||r.format===n.format),W(r)?(this.constants[n.attribute]=pv(r),a=Math.max(a,(n.byteOffset??0)+r.byteLength)):this.buffers[t.name]||this.bindVector(t.name,r,n.byteOffset??0))}if(this.device.type===`webgpu`&&a&&!this.buffers[t.name]){let i=new Uint8Array(Math.ceil(a/4)*4);for(let t of r){let n=e[t.attribute];W(n)&&i.set(new Uint8Array(n.value.buffer,n.value.byteOffset,n.byteLength),t.byteOffset??0)}let o=this.constantBuffers[t.name];(!o||o.byteLength<i.byteLength)&&(o?.destroy(),o=this.device.createBuffer({id:`${this.id}-${t.name}-constant`,byteLength:i.byteLength,usage:n.VERTEX|n.COPY_DST|n.COPY_SRC}),this.constantBuffers[t.name]=o),o.write(i),this.buffers[t.name]=o,l.add(t.name)}}for(let[e,t]of Object.entries(this.constantBuffers))l.has(e)||(t.destroy(),delete this.constantBuffers[e])}get batchCount(){let e=Object.values(this.inputs).find(e=>e&&!W(e));return e&&!W(e)?e.data.length:1}getBatch(e){return Object.fromEntries(Object.entries(this.inputs).map(([t,n])=>{if(!n||W(n))return[t,n];let r=n.data[e];return[t,{...n,length:r?.length??0,data:r?[r]:[]}]}))}destroy(){for(let e of Object.values(this.constantBuffers))e.destroy();this.constantBuffers={}}bindVector(e,t,n){let r=t.data[0];if(!r)return;let i=r.byteOffset-n;o(i>=0),this.buffers[e]=r.buffer,this.byteOffsets[e]=i}};function W(e){return!!(e&&`isConstant`in e&&e.isConstant)}function pv(e){let t=u.getVertexFormatInfo(e.format);if(e.format===`unorm10-10-10-2`){let t=e.value[0];return new Float32Array([(t&1023)/1023,(t>>>10&1023)/1023,(t>>>20&1023)/1023,(t>>>30)/3])}let n=Array.from(e.value);if(e.format===`unorm8x4-bgra`&&([n[0],n[2]]=[n[2],n[0]]),t.normalized){let r=e.value.BYTES_PER_ELEMENT*8,i=2**r-1;return new Float32Array(n.map(e=>t.signed?(e+2**(r-1))/i*2-1:e/i))}return t.integer?t.signed?new Int32Array(n):new Uint32Array(n):new Float32Array(n)}function mv(e,t){let n=[],r,i=0,a=[...t].sort((t,n)=>{let r=e[t.name],i=e[n.name];return(r&&!W(r)?r.data[0]?.byteOffset??0:0)-(i&&!W(i)?i.data[0]?.byteOffset??0:0)});for(let t of a){let a=e[t.name],o=t.attributes[0];if(W(a)){r||(r={...t,attributes:[]},n.push(r));let e=Math.min(4,a.byteLength);i=Math.ceil(i/e)*e,r.attributes.push({...o,byteOffset:i}),i+=a.byteLength;continue}let s=n.find(n=>{let r=e[n.name];if(!r||W(r)||!r.data.length||!a.data.length)return!1;let i=a.data[0].byteOffset-r.data[0].byteOffset;return n.stepMode===t.stepMode&&n.byteStride===t.byteStride&&i>=0&&i+a.rowByteLength<=a.byteStride&&a.data.every((e,t)=>{let n=r.data[t];return e.buffer===n.buffer&&e.byteStride===n.byteStride&&e.byteOffset-n.byteOffset===i})});if(s){let t=e[s.name];s.attributes.push({...o,byteOffset:a.data[0].byteOffset-t.data[0].byteOffset})}else n.push({...t,attributes:[...t.attributes]})}return n}function hv(e){return(Array.isArray(e)?e.length===0||typeof e[0]==`number`:ArrayBuffer.isView(e)&&!(e instanceof DataView))||typeof e==`number`||typeof e==`boolean`}function gv(e,t={}){let n={bindings:{},uniforms:{}};return Object.keys(e).forEach(r=>{let i=e[r];Object.prototype.hasOwnProperty.call(t,r)||hv(i)?n.uniforms[r]=i:n.bindings[r]=i}),n}var _v=class{options={disableWarnings:!1};modules;moduleUniforms;moduleBindings;directBindings={};constructor(t,n){Object.assign(this.options,n);let r=Ae(Object.values(t).filter(Cv));for(let e of r)t[e.name]=e;e.log(1,`Creating ShaderInputs with modules`,Object.keys(t))(),this.modules=t,this.moduleUniforms={},this.moduleBindings={};for(let[n,r]of Object.entries(t))r&&(this._addModule(r),r.name&&n!==r.name&&!this.options.disableWarnings&&e.warn(`Module name: ${n} vs ${r.name}`)())}destroy(){}setProps(t){t.bindings&&Object.assign(this.directBindings,t.bindings);for(let n of Object.keys(t)){if(n===`bindings`)continue;let r=n,i=t[r]||{},a=this.modules[r];if(!a)this.options.disableWarnings||e.warn(`Module ${n} not found`)();else{let e=this.moduleUniforms[r],t=this.moduleBindings[r],{uniforms:n,bindings:o}=gv(a.getUniforms?.(i,e)||i,a.uniformTypes);this.moduleUniforms[r]=vv(e,n,a.uniformTypes),this.moduleBindings[r]={...t,...o}}}}getModules(){return Object.values(this.modules)}addModules(e){let t=Ae(e);for(let e of t){let t=e.name;this.modules[t]||(this.modules[t]=e,this._addModule(e))}}getUniformValues(){return this.moduleUniforms}getBindingValues(){let e={};for(let t of Object.values(this.moduleBindings))Object.assign(e,t);return Object.assign(e,this.directBindings),e}getModuleBindingValues(e){let t=this.moduleBindings[e];return t?{...t}:{}}getDebugTable(){let e={};for(let[t,n]of Object.entries(this.moduleUniforms))for(let[r,i]of Object.entries(n))e[`${t}.${r}`]={type:this.modules[t].uniformTypes?.[r],value:String(i)};return e}_addModule(e){let t=e.name;this.moduleUniforms[t]=vv({},e.defaultUniforms||{},e.uniformTypes),this.moduleBindings[t]={}}};function vv(e={},t={},n={}){let r={...e};for(let[i,a]of Object.entries(t))a!==void 0&&(r[i]=yv(e[i],a,n[i]));return r}function yv(e,t,n){if(!n||typeof n==`string`)return bv(t);if(Array.isArray(n)){if(xv(t)||!Array.isArray(t))return bv(t);let r=Array.isArray(e)&&!xv(e)?[...e]:[],i=r.slice();for(let e=0;e<t.length;e++){let a=t[e];a!==void 0&&(i[e]=yv(r[e],a,n[0]))}return i}if(!Sv(t))return bv(t);let r=n,i=Sv(e)?e:{},a={...i};for(let[e,n]of Object.entries(t))n!==void 0&&(a[e]=yv(i[e],n,r[e]));return a}function bv(e){return ArrayBuffer.isView(e)?Array.prototype.slice.call(e):Array.isArray(e)?xv(e)?e.slice():e.map(e=>e===void 0?void 0:bv(e)):Sv(e)?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t===void 0?void 0:bv(t)])):e}function xv(e){return ArrayBuffer.isView(e)||Array.isArray(e)&&(e.length===0||typeof e[0]==`number`)}function Sv(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function Cv(e){return!!e?.dependencies}function wv(e){return typeof e==`object`&&!!e&&`resolveTextureBinding`in e&&typeof e.resolveTextureBinding==`function`}function Tv(e){return e?.type===`texture`||e?.type===`external-texture`}function Ev(e,t,n){let r=E(e,t,{ignoreWarnings:!0});return Tv(r)?r:e.bindings.length===0&&n?.fallbackGroup!==void 0?{type:`texture`,name:t,group:n.fallbackGroup,location:0}:null}var Dv=2,Ov=1e4,kv=`render pipeline initialization failed`,Av=[`stencil8`,`depth16unorm`,`depth24plus`,`depth24plus-stencil8`,`depth32float`,`depth32float-stencil8`],jv=class t{static async createAsync(e,t){let n=!ke.getAsyncCompilation(e),r=n?ke.beginAsyncCompilation(e):ke.getAsyncCompilation(e),i;try{i=new this(e,t)}finally{n&&ke.endAsyncCompilation(e,r)}try{return n?await Promise.all(r):await i._pipelineInitialization,i}catch(e){throw i.destroy(),e}}static defaultProps={...d.defaultProps,inferDrawCount:`no`,enforceMatchingVectorLengths:!0,geometry:null,attributeVectors:void 0,source:void 0,sourceLanguage:void 0,vs:null,fs:null,id:`unnamed`,handle:void 0,userData:{},defines:{},modules:[],plugins:[],indexBuffer:null,indexCount:void 0,firstVertex:0,firstIndex:0,attributes:{},constantAttributes:{},bindings:{},uniforms:{},varyings:[],isInstanced:void 0,instanceCount:0,vertexCount:0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,transformFeedback:void 0,shaderAssembler:void 0,debugShaders:void 0,disableWarnings:void 0};device;id;source;vs;fs;pipelineFactory;shaderFactory;userData={};parameters;topology;bufferLayout;isInstanced=void 0;instanceCount=0;vertexCount;indexCount;firstVertex;firstIndex;indexBuffer=null;bufferAttributes={};constantAttributes={};bindings={};vertexArray;transformFeedback=null;pipeline;shaderInputs;_uniformStore;_attributeInfos={};props;batchUniformBuffer;geometryVectorBindings;attributeVectorBindings;explicitBufferLayout=[];constructorDrawCounts;constructorDrawOffsets;drawingVectorBatches=!1;indexVector=null;currentAttributes={};currentAttributeByteOffsets={};_dynamicIndexBufferSource=null;_dynamicAttributeBufferSources={};_colorAttachmentFormats;_depthStencilAttachmentFormat;_pipelineNeedsUpdate=`newly created`;_needsRedraw=`initializing`;_drawBlockedReason=!1;_destroyed=!1;_vertexCountSet=!1;_lastDrawTimestamp=-1;_bindingTable=[];_pipelineInitialization;get[Symbol.toStringTag](){return`Model`}toString(){return`Model(${this.id})`}constructor(e,n){this.constructorDrawOffsets={firstVertex:n.firstVertex,firstIndex:n.firstIndex};let r=this.constructor.defaultProps;this.constructorDrawCounts={vertexCount:n.vertexCount??(r.vertexCount||void 0),instanceCount:n.instanceCount??(r.instanceCount||void 0)};let i=r.shaderAssembler,a=Object.hasOwn(n,`vertexCount`);this.props={...r,...n,shaderAssembler:n.shaderAssembler??(i&&Mv(i,e.info.shadingLanguage)?i:e.info.shadingLanguage===`wgsl`?new zg:new Rg)},this._vertexCountSet=a,n=this.props,this.id=n.id||av(`model`),this.device=e,Object.assign(this.userData,n.userData),this.vertexCount=this.props.vertexCount,this.indexCount=this.props.indexCount,this.firstVertex=this.props.firstVertex,this.firstIndex=this.props.firstIndex,this.instanceCount=this.props.instanceCount,this.topology=this.props.topology,this.bufferLayout=this.props.bufferLayout,this.parameters=this.props.parameters,this._colorAttachmentFormats=this.props.colorAttachmentFormats,this._depthStencilAttachmentFormat=this.props.depthStencilAttachmentFormat,this.isInstanced=n.isInstanced??(n.instanceCount?!0:void 0),this.explicitBufferLayout=this.bufferLayout,this.geometryVectorBindings=new fv(e,`${this.id}-geometry`),this.attributeVectorBindings=new fv(e,`${this.id}-attributes`);try{this._initializeProps(n);let t=Xe(e),r=Oh(this.props.plugins,t.shaderLanguage),i=kh(this.props.modules,r.modules),a=Object.fromEntries(i.map(e=>[e.name,e])),s=n.shaderInputs||new _v(a,{disableWarnings:this.props.disableWarnings});n.shaderInputs&&r.modules.length>0&&s.addModules(r.modules),this.setShaderInputs(s);let c=$_(this.props.modules,s.getModules()),l={...r.defines,...this.props.defines};if(this.device.type===`webgl`&&(this.props._uniformBlockLayouts=Q_(c)),this.props.shaderLayout=Y_(this.props.shaderLayout,c)||null,this.device.type===`webgpu`&&this.props.source){let n=this.props.shaderAssembler;o(Mv(n,`wgsl`));let{source:i,getUniforms:a,bindingTable:s,entryPoints:u={},shaderLayout:d}=n.assembleWGSLShader({platformInfo:t,...this.props,modules:c,defines:l,pluginInjectionTargets:r.injectionTargets,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.source=i,this.props.vertexEntryPoint=u.vertex||this.props.vertexEntryPoint,this.props.fragmentEntryPoint=u.fragment||this.props.fragmentEntryPoint,this._getModuleUniforms=a,this._bindingTable=s;let f=Nv(d??e.getShaderLayout?.(this.source),r.vertexInputs),p=X_(this.props.shaderLayout,f,Object.keys(r.vertexInputs));this.props.shaderLayout=Y_(p||null,c)||null}else{let e=this.props.shaderAssembler;o(Mv(e,`glsl`));let{vs:n,fs:i,getUniforms:a}=e.assembleGLSLShaderPair({platformInfo:t,...this.props,modules:c,defines:l,pluginInjectionTargets:r.injectionTargets,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.vs=n,this.fs=i,this._getModuleUniforms=a,this._bindingTable=[]}this.pipelineFactory=n.pipelineFactory||ke.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||Oe.getDefaultShaderFactory(this.device);let u=ke.getAsyncCompilation(this.device);u?(this._pipelineInitialization=this._initializePipelineAsync(n),u.push(this._pipelineInitialization)):(this.pipeline=this._updatePipeline(),this._initializePipelineResources(n))}catch(e){try{t.prototype.destroy.call(this)}finally{throw e}}}_initializeProps(e){e.geometry&&this.setGeometry(e.geometry),e.attributeVectors&&this.setAttributeVectors(e.attributeVectors)}_usesManagedUniformBuffer(e){return!0}async _initializePipelineAsync(e){await this._updatePipelineAsync(),this._initializePipelineResources(e)}_initializeAttributes(){this.applyVectorAttributes(),this.indexVector&&this.bindIndexVector()}_initializePipelineResources(e){this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._initializeAttributes(),e.indexBuffer&&this.setIndexBuffer(e.indexBuffer),e.indexCount!==void 0&&this.setIndexCount(e.indexCount),this.constructorDrawOffsets.firstVertex!==void 0&&(this.firstVertex=this.constructorDrawOffsets.firstVertex),this.constructorDrawOffsets.firstIndex!==void 0&&(this.firstIndex=this.constructorDrawOffsets.firstIndex),e.isInstanced!==void 0&&(this.isInstanced=e.isInstanced),this.constructorDrawCounts.instanceCount!==void 0&&this.setInstanceCount(this.constructorDrawCounts.instanceCount),this.constructorDrawCounts.vertexCount!==void 0&&this.setVertexCount(this.constructorDrawCounts.vertexCount),e.attributes&&this.setAttributes(e.attributes),e.constantAttributes&&this.setConstantAttributes(e.constantAttributes),e.bindings&&this.setBindings(e.bindings),e.transformFeedback&&(this.transformFeedback=e.transformFeedback)}destroy(){this._destroyed||=(this.pipeline&&(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.pipeline.vs),this.pipeline.fs&&this.pipeline.fs!==this.pipeline.vs&&this.shaderFactory.release(this.pipeline.fs)),this.vertexArray?.destroy(),this.geometryVectorBindings.destroy(),this.attributeVectorBindings.destroy(),this._uniformStore?.destroy(),this.batchUniformBuffer?.destroy(),!0)}needsRedraw(){this._getBindingsUpdateTimestamp()>this._lastDrawTimestamp&&this.setNeedsRedraw(`contents of bound textures or buffers updated`);let e=this._needsRedraw;return this._needsRedraw=!1,e}setNeedsRedraw(e){this._needsRedraw||=e}getBindingDebugTable(){return this._bindingTable}predraw(e){this._syncDynamicBuffers(),this.updateShaderInputs(e),this.pipeline=this._updatePipeline()}draw(e,t){return t?.parameters?this._withDrawParameters(e,t.parameters,()=>this._draw(e)):this._draw(e)}_withDrawParameters(e,t,n){let r=e.getParameters();try{return e.setParameters(t),n()}finally{e.setParameters(r)}}_draw(t){if(this.indexVector?.length===0)return this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1,!0;if(!this.drawingVectorBatches&&(this.geometryVectorBindings.batchCount!==1||this.attributeVectorBindings.batchCount!==1))return this.drawVectorGroups(t);if(this._drawBlockedReason&&!this._pipelineNeedsUpdate)return e.info(Dv,`>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)(),!1;let n=this._areBindingsLoading();if(n)return e.info(Dv,`>>> DRAWING ABORTED ${this.id}: ${n} not loaded`)(),!1;this._syncAttachmentFormats(t);try{t.pushDebugGroup(`${this}.predraw(${t})`),this.device.type===`webgpu`?(this.updateShaderInputs(),this._syncDynamicBuffers(),this.pipeline=this._updatePipeline()):this.predraw(this.device.commandEncoder)}finally{t.popDebugGroup()}let r,i=this.pipeline.isErrored;try{if(t.pushDebugGroup(`${this}.draw(${t})`),this._logDrawCallStart(),this.pipeline=this._updatePipeline(),i=this.pipeline.isErrored,i)e.info(Dv,`>>> DRAWING ABORTED ${this.id}: ${kv}`)(),r=!1;else{let n=this.vertexArray.getDrawValidationError();if(n)e.info(Dv,`>>> DRAWING ABORTED ${this.id}: ${n}`)(),this._drawBlockedReason=n,r=!1;else{let e=this._getCurrentShaderLayout(),n=this._getBindings(e),i=this._getBindGroups(e,n),{indexBuffer:a}=this.vertexArray,o=a?this.indexCount??(this._vertexCountSet?this.vertexCount:a.byteLength/(a.indexType===`uint32`?4:2)):void 0;t.setPipeline(this.pipeline),t.setBindings(i,{_bindGroupCacheKeys:this._getBindGroupCacheKeys()}),t.setVertexArray(this.vertexArray),r=this.isInstanced===!0&&this.instanceCount===0?!0:t.draw({isInstanced:this.isInstanced,vertexCount:this.vertexCount,instanceCount:this.isInstanced?this.instanceCount:void 0,indexCount:o,firstVertex:this.firstVertex,firstIndex:this.firstIndex,transformFeedback:this.transformFeedback||void 0,uniforms:this.props.uniforms,parameters:this.parameters,topology:this.topology})}}}finally{t.popDebugGroup(),this._logDrawCallEnd()}return this._logFramebuffer(t),r?(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1):i?(this._needsRedraw=kv,this._drawBlockedReason=kv):this._drawBlockedReason?this._needsRedraw=this._drawBlockedReason:this._needsRedraw=`waiting for resource initialization`,r}setGeometry(e){e&&this.setTopology(e.topology),this.setGeometryVectors(e?.attributes??{},e?.bufferLayout),this.setIndexVector(e?.indices??null),e?.vertexCount!==void 0&&this.setVertexCount(e.vertexCount)}setGeometryVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.geometryVectorBindings.sourceLayouts),this.validateVectorLengthPolicy(),this.props.enforceMatchingVectorLengths&&lv(e),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||this.attributeVectorBindings.vertexCount!==void 0)&&lv([...Object.values(e),...Object.values(this.attributeVectorBindings.inputs)]),this.geometryVectorBindings.setInputs(e,t,`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.geometryVectorBindings),this.syncVectorBindings();let n=this.geometryVectorBindings.rowCount;o(n===void 0||this.attributeVectorBindings.vertexCount===void 0||n===this.attributeVectorBindings.vertexCount),this.props.inferDrawCount===`vertex`&&this.setVertexCount(n??this.attributeVectorBindings.vertexCount??0)}setAttributeVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.attributeVectorBindings.sourceLayouts),this.isInstanced===void 0&&(t?.some(e=>e.stepMode===`instance`)||Object.values(e).some(e=>e&&`data`in e&&e.bufferLayout?.stepMode===`instance`))&&(this.isInstanced=!0);let n=!this.isInstanced||Object.entries(e).some(([e,n])=>n&&`data`in n&&(t?.find(t=>t.name===e||t.attributes?.some(t=>t.attribute===e))?.stepMode??n.bufferLayout?.stepMode)===`vertex`);this.validateVectorLengthPolicy(),n&&this.props.enforceMatchingVectorLengths&&lv([...Object.values(this.geometryVectorBindings.inputs),...Object.values(e)]),this.attributeVectorBindings.setInputs(e,t,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.attributeVectorBindings),this.syncVectorBindings(),this.props.inferDrawCount===`instance`&&this.attributeVectorBindings.instanceCount!==void 0&&this.setInstanceCount(this.attributeVectorBindings.instanceCount);let r=this.attributeVectorBindings.vertexCount;if(r!==void 0&&this.props.inferDrawCount===`vertex`){let e=this.geometryVectorBindings.rowCount;o(e===void 0||e===r),e===void 0&&this.setVertexCount(r)}}setGPUAttributes(e,t){this.setAttributeVectors(e,t)}setIndexVector(e){e&&(o(e.format===`uint8`||e.format===`uint16`||e.format===`uint32`),o(e.data.length<=1),o(e.byteStride===(e.format===`uint32`?4:e.format===`uint16`?2:1))),this.indexVector=e,this.vertexArray&&this.bindIndexVector()}bindIndexVector(){let e=this.indexVector,t=e?.data[0];t&&this.indexVector&&o((t.buffer instanceof M?t.buffer.buffer:t.buffer).indexType===this.indexVector.format&&t.byteOffset%this.indexVector.byteStride===0),this.indexVector=null,this.setIndexBuffer(t?.buffer??null),this.indexVector=e,this.indexCount=e?.length,this.setDrawOffsets({firstVertex:t?.byteOffset??0,firstIndex:t?t.byteOffset/this.indexVector.byteStride:0})}claimVectorLayouts(e){this.explicitBufferLayout=this.explicitBufferLayout.filter(t=>!e.claimedNames.has(t.name)&&!t.attributes?.some(t=>e.claimedNames.has(t.attribute)))}getExplicitVectorLayouts(e,t=this.explicitBufferLayout){let n=new Set(Object.keys(e)),r=t.filter(e=>n.has(e.name)||e.attributes?.some(e=>n.has(e.attribute)));return r.length?r:void 0}getVectorBufferLayout(){let e=[this.geometryVectorBindings,this.attributeVectorBindings];return[...this.explicitBufferLayout.filter(t=>!e.some(e=>e.claimedNames.has(t.name)||t.attributes?.some(t=>e.claimedNames.has(t.attribute)))),...this.geometryVectorBindings.layouts,...this.attributeVectorBindings.layouts]}syncVectorBindings(){let e=this.getVectorBufferLayout();this.vertexArray?(this.applyBufferLayout(e),this.applyVectorAttributes()):this.bufferLayout=e}applyVectorAttributes(){let e=new Set(this.bufferLayout.map(e=>e.name));for(let t of Object.keys(this.currentAttributes))e.has(t)||delete this.currentAttributes[t];this.setAttributes({...this.currentAttributes,...this.geometryVectorBindings.buffers,...this.attributeVectorBindings.buffers},{byteOffsets:{...this.currentAttributeByteOffsets,...this.geometryVectorBindings.byteOffsets,...this.attributeVectorBindings.byteOffsets},disableWarnings:!0}),this.device.type===`webgl`&&this.setConstantAttributes({...this.geometryVectorBindings.constants,...this.attributeVectorBindings.constants})}setGPUVectors(e,t){let n=sv(this.id,e);o(n.length<=1),ov(this.id,e,this.bufferLayout),n[0]&&this.setGPUData(n[0].data),this.setBatchDrawCount(n[0]?.rowCount??0,t?.count)}drawVectorGroups(e){let n=this.drawingVectorBatches,r=this._vertexCountSet;this.drawingVectorBatches=!0;try{let n=uv(this,this.geometryVectorBindings,this.attributeVectorBindings,()=>this.syncVectorBindings(),()=>t.prototype.draw.call(this,e),this.props.inferDrawCount);return n&&(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1),n}finally{this._vertexCountSet=r,this.drawingVectorBatches=n}}drawBatches(e,{vectors:n,onBatch:r}){let i=sv(this.id,n);ov(this.id,n,this.bufferLayout);for(let e of Object.keys(n))o(!n[e]||this.currentAttributes[e]);let a={...this.currentAttributes},s={...this.currentAttributeByteOffsets},c={...this.bindings},l=this.instanceCount,u=this.vertexCount,d=this.isInstanced,f=this._vertexCountSet,p=this.drawingVectorBatches,m=this.device.type===`webgpu`&&i.length?new Ko(this.device,this.shaderInputs.modules):void 0;if(m&&this._uniformStore.uniformBuffers.size){this.batchUniformBuffer??=new F_(this.device);let e=0;for(let t of this._uniformStore.uniformBuffers.keys())e+=this.batchUniformBuffer.getAlignedByteLength(m.getUniformBufferData(t).byteLength);this.batchUniformBuffer.prepare(e*i.length)}this.drawingVectorBatches=!0;let h=!0;try{for(let n of i){this.setGPUData(n.data),this.setBatchDrawCount(n.rowCount),r?.(n);let i={};try{if(m){m.setUniforms(this.shaderInputs.getUniformValues());for(let[e,t]of this._uniformStore.uniformBuffers){let n=`${e}Uniforms`;this.bindings[n]===t&&(i[n]=t,this.setBindings({[n]:this.batchUniformBuffer.write(m.getUniformBufferData(e))}))}}h=t.prototype.draw.call(this,e)&&h}finally{this.setBindings(i)}}}finally{m?.destroy(),this.setAttributes(a,{byteOffsets:s});for(let e of Object.keys(this.bindings))e in c||delete this.bindings[e];this.setBindings(c),this.setInstanceCount(l),this.setVertexCount(u),this.isInstanced=d,this._vertexCountSet=f,this.drawingVectorBatches=p}return h}setGPUData(e){this.setAttributes(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t.buffer])),{byteOffsets:Object.fromEntries(Object.entries(e).map(([e,t])=>{let n=this.bufferLayout.find(t=>t.name===e),r=t.byteOffset-(n?.attributes?.[0]?.byteOffset??0);return o(r>=0),[e,r]}))})}validateVectorLengthPolicy(){o(this.props.enforceMatchingVectorLengths!==!1||this.props.inferDrawCount===`no`)}setBatchDrawCount(e,t=this.props.inferDrawCount===`no`?`none`:this.props.inferDrawCount){t===`instance`?this.setInstanceCount(e):t===`vertex`&&this.setVertexCount(e)}setTopology(e){e!==this.topology&&(this.topology=e,this._setPipelineNeedsUpdate(`topology`))}setBufferLayout(e){this.explicitBufferLayout=e;let t=this.geometryVectorBindings,n=this.attributeVectorBindings,r=this.getExplicitVectorLayouts(t.inputs)??t.sourceLayouts,i=this.getExplicitVectorLayouts(n.inputs)??n.sourceLayouts;t.setInputs(t.inputs,r,`vertex`,this.props.enforceMatchingVectorLengths),n.setInputs(n.inputs,i,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||n.vertexCount!==void 0)&&lv([...Object.values(t.inputs),...Object.values(n.inputs)]),this.claimVectorLayouts(t),this.claimVectorLayouts(n),this.applyBufferLayout(this.getVectorBufferLayout())}applyBufferLayout(e){if(e=J_(this.pipeline.shaderLayout,e),K_(e,this.bufferLayout,-1))return;this.bufferLayout=e,this._setPipelineNeedsUpdate(`bufferLayout`),this.pipeline=this._updatePipeline();let t=this.vertexArray;this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),t.destroy(),this._dynamicAttributeBufferSources={},this.applyVectorAttributes(),this.indexBuffer&&this.vertexArray.setIndexBuffer(this.indexBuffer)}setParameters(e){K_(e,this.parameters,2)||(this.parameters=e,this.device.type===`webgl`?this.setNeedsRedraw(`parameters`):this._setPipelineNeedsUpdate(`parameters`))}setInstanceCount(e){this.instanceCount=e,this.isInstanced===void 0&&e>0&&(this.isInstanced=!0),this.setNeedsRedraw(`instanceCount`)}setVertexCount(e){this.vertexCount=e,this._vertexCountSet=!0,this.setNeedsRedraw(`vertexCount`)}setIndexCount(e){this.indexCount=e,this.setNeedsRedraw(`indexCount`)}setDrawOffsets({firstVertex:e,firstIndex:t}){this.firstVertex=e,this.firstIndex=t,this.setNeedsRedraw(`drawOffsets`)}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new Ko(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(Z_(t)&&this._usesManagedUniformBuffer(e)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.setNeedsRedraw(`shaderInputs`)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this.setBindings(this._getShaderInputBindings()),this.setNeedsRedraw(`shaderInputs`)}_getShaderInputBindings(){return this.shaderInputs.getBindingValues()}setBindings(e){Object.assign(this.bindings,e),this.setNeedsRedraw(`bindings`)}setTransformFeedback(e){this.transformFeedback=e,this.setNeedsRedraw(`transformFeedback`)}setIndexBuffer(e){this.indexVector&&(this.indexCount=void 0,this.firstVertex=0,this.firstIndex=0),this.indexVector=null;let t=e instanceof M?e.buffer:e;this.indexBuffer=t,this._dynamicIndexBufferSource=e instanceof M?{source:e,generation:e.generation}:null,this.vertexArray.setIndexBuffer(t),this.setNeedsRedraw(`indexBuffer`)}setAttributes(t,n){Object.assign(this.currentAttributes,t);for(let e of Object.keys(t))this.currentAttributeByteOffsets[e]=n?.byteOffsets?.[e]??0;this._drawBlockedReason=!1;let r=n?.disableWarnings??this.props.disableWarnings;t.indices&&e.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)(),this.bufferLayout=J_(this.pipeline.shaderLayout,this.bufferLayout);let i=new q_(this.bufferLayout);for(let[a,o]of Object.entries(t)){let t=o instanceof M?o.buffer:o,s=i.getBufferLayout(a);if(!s){r||e.warn(`Model(${this.id}): Missing layout for buffer "${a}".`)();continue}let c=i.getAttributeNamesForBuffer(s),l=!1;for(let i of c){let s=this._attributeInfos[i];if(s){let i=this.device.type===`webgpu`?this.vertexArray.getBufferSlot(s.bufferName):s.location;if(i===null){r||e.warn(`Model(${this.id}): Missing vertex array slot for buffer "${s.bufferName}".`)();continue}let c=n?.byteOffsets?.[a]??0;this.vertexArray.setBuffer(i,t,c),o instanceof M?this._dynamicAttributeBufferSources[i]={source:o,generation:o.generation,byteOffset:c}:delete this._dynamicAttributeBufferSources[i],l=!0}}!l&&!r&&e.warn(`Model(${this.id}): Ignoring buffer "${t.id}" for unknown attribute "${a}"`)()}this.setNeedsRedraw(`attributes`)}setConstantAttributes(t,n){for(let[r,i]of Object.entries(t)){let t=this._attributeInfos[r];t?this.vertexArray.setConstantWebGL(t.location,i):(n?.disableWarnings??this.props.disableWarnings)||e.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${r}"`)()}this.setNeedsRedraw(`constants`)}_areBindingsLoading(){for(let e of Object.values(this.bindings))if(wv(e)&&!e.isReady)return e.id;return!1}_getBindings(e=this._getCurrentShaderLayout()){let t={};for(let[n,r]of Object.entries(this.bindings)){let i=Pv(n,r,e);i&&(t[n]=i)}return t}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){return e.bindings.length?T(e,t):{0:t}}_getBindGroupCacheKeys(){return{}}_getBindingsUpdateTimestamp(){let e=0;this._dynamicIndexBufferSource&&(e=Math.max(e,this._dynamicIndexBufferSource.source.updateTimestamp));for(let t of Object.values(this._dynamicAttributeBufferSources))e=Math.max(e,t.source.updateTimestamp);for(let t of Object.values(this.bindings))t instanceof ae?e=Math.max(e,t.texture.updateTimestamp):t instanceof n||t instanceof j||t instanceof Ao||t instanceof M?e=Math.max(e,t.updateTimestamp):wv(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:Be(t)&&(e=Math.max(e,(t.buffer instanceof M,t.buffer.updateTimestamp)));return e}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate||=e,this._drawBlockedReason=!1,this.setNeedsRedraw(e)}_updatePipeline(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=this.pipelineFactory.createRenderPipeline(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createRenderPipelineAsync(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let t=this.pipeline?.vs??null,n=this.pipeline?.fs??null;this.pipeline&&e.log(1,`GPUVectorModel ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1;let r=null,i=null;try{r=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:`vertex`,source:this.source||this.vs,debugShaders:this.props.debugShaders}),this.source?i=r:this.fs&&(i=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`fragment`,source:this.fs,debugShaders:this.props.debugShaders}))}catch(e){throw this._releasePipelineShaders(r,i),this._pipelineNeedsUpdate=`shader creation failed`,e}return{props:{...this.props,bindings:void 0,bufferLayout:this.bufferLayout,colorAttachmentFormats:this._colorAttachmentFormats,depthStencilAttachmentFormat:this._depthStencilAttachmentFormat,topology:this.topology,parameters:this.parameters,bindGroups:void 0,vs:r,fs:i},vertexShader:r,fragmentShader:i,previousVertexShader:t,previousFragmentShader:n}}_finishPipelineUpdate(e){this._attributeInfos=Jo(this.pipeline.shaderLayout,this.bufferLayout),this._releasePipelineShaders(e.previousVertexShader,e.previousFragmentShader)}_releasePipelineShaders(e,t){e&&this.shaderFactory.release(e),t&&t!==e&&this.shaderFactory.release(t)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let t=e.level>3?0:Ov;e.level<2||Date.now()-this._lastLogTime<t||(this._lastLogTime=Date.now(),this._logOpen=!0,e.group(Dv,`>>> DRAWING MODEL ${this.id}`,{collapsed:e.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let t=I_(this.pipeline.shaderLayout,this.id);e.table(Dv,t)();let n=this.shaderInputs.getDebugTable();e.table(Dv,n)();let r=this._getAttributeDebugTable();e.table(Dv,this._attributeInfos)(),e.table(Dv,r)(),e.groupEnd(Dv)(),this._logOpen=!1}}_drawCount=0;_logFramebuffer(e){let t=this.device.props.debugFramebuffers;if(this._drawCount++,!t)return;let n=e.props.framebuffer;z_(e,n,{id:n?.id||`${this.id}-framebuffer`,minimap:!0})}_getAttributeDebugTable(){let e={};for(let[t,n]of Object.entries(this._attributeInfos)){let r=this.vertexArray.attributes[n.location];e[n.location]={name:t,type:n.shaderType,values:r?this._getBufferOrConstantValues(r,n.bufferDataType):`null`}}if(this.vertexArray.indexBuffer){let{indexBuffer:t}=this.vertexArray,n=t.indexType===`uint32`?new Uint32Array(t.debugData):new Uint16Array(t.debugData);e.indices={name:`indices`,type:t.indexType,values:n.toString()}}return e}_getBufferOrConstantValues(e,t){let r=i.getTypedArrayConstructor(t);return(e instanceof n?new r(e.debugData):e).toString()}_getCurrentShaderLayout(){return this.pipeline?.shaderLayout||this.props.shaderLayout||{bindings:[]}}_syncDynamicBuffers(){if(this._dynamicIndexBufferSource&&this._dynamicIndexBufferSource.generation!==this._dynamicIndexBufferSource.source.generation){let e=this._dynamicIndexBufferSource.source.buffer;this.indexBuffer=e,this.vertexArray.setIndexBuffer(e),this._dynamicIndexBufferSource.generation=this._dynamicIndexBufferSource.source.generation,this.setNeedsRedraw(`dynamic index buffer`)}for(let[e,t]of Object.entries(this._dynamicAttributeBufferSources))t.generation!==t.source.generation&&(this.vertexArray.setBuffer(Number(e),t.source.buffer,t.byteOffset),t.generation=t.source.generation,this.setNeedsRedraw(`dynamic attribute buffer`))}_syncAttachmentFormats(e){if(this.device.type!==`webgpu`)return;let t=e.framebuffer||e.props.framebuffer,n=e.props,r=n.colorAttachmentFormats??t?.colorAttachments?.map(e=>Fv(e?.texture?.format)),i=n.depthStencilAttachmentFormat===!1?void 0:n.depthStencilAttachmentFormat??Iv(t?.depthStencilAttachment?.texture?.format);(!K_(this._colorAttachmentFormats,r,1)||this._depthStencilAttachmentFormat!==i)&&(this._colorAttachmentFormats=r,this._depthStencilAttachmentFormat=i,this._setPipelineNeedsUpdate(`attachment formats`))}};function Mv(e,t){return e.shaderLanguage!==void 0&&e.shaderLanguage!==t?!1:t===`glsl`?`assembleGLSLShaderPair`in e&&typeof e.assembleGLSLShaderPair==`function`:`assembleWGSLShader`in e&&typeof e.assembleWGSLShader==`function`}function Nv(e,t){return!e||Object.keys(t).length===0?e:{...e,attributes:e.attributes.map(e=>{let n=e.name.startsWith(`_luma_`)?e.name.slice(6):null;return n&&t[n]?{...e,name:n}:e})}}function Pv(e,t,n){if(wv(t)){let r=Ev(n,e,{fallbackGroup:0});return r?t.resolveTextureBinding(r):null}return t instanceof M?t.buffer:Be(t)?Ve(t):t}function Fv(e){return e&&!Lv(e)?e:null}function Iv(e){return e&&Lv(e)?e:void 0}function Lv(e){return Av.includes(e)}var Rv=class{id;userData={};topology;bufferLayout=[];vertexCount;indices;attributes;constructor(e){if(this.id=e.id||av(`geometry`),this.topology=e.topology,this.indices=e.indices||null,this.attributes=e.attributes,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout||[],this.indices&&!(this.indices.usage&n.INDEX))throw Error(`Index buffer must have INDEX usage`)}destroy(){this.indices?.destroy();for(let e of Object.values(this.attributes))e.destroy()}getVertexCount(){return this.vertexCount}getAttributes(){return this.attributes}getIndexes(){return this.indices||null}_calculateVertexCount(e){return e.byteLength/12}};function zv(e,t){if(t instanceof Rv)return t;let n=mh(t),r=Bv(e,n),{attributes:i,bufferLayout:a}=Vv(e,n);return new Rv({topology:n.topology||`triangle-list`,bufferLayout:a,vertexCount:n.vertexCount,indices:r,attributes:i})}function Bv(e,t){if(!t.indices)return;let r=t.indices.value;return e.createBuffer({usage:n.INDEX,data:r})}function Vv(e,t){let n={};for(let[r,i]of Object.entries(t.attributes)){let a=t.bufferLayout?.find(e=>e.name===r)?.name||fh(r);i&&(n[a]=e.createBuffer({data:i.value,id:`${r}-buffer`}))}return{attributes:n,bufferLayout:t.bufferLayout||ph(t.attributes),vertexCount:t.vertexCount}}var Hv=class{attributes;indices;topology;vertexCount;bufferLayout;destroy(){}constructor(e){this.attributes=e.attributes,this.indices=e.indices??null,this.topology=e.topology??`triangle-list`,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout}};function Uv(e){let t={};for(let[n,r]of Object.entries(e.attributes)){let i=e.bufferLayout.find(e=>e.name===n),a=i?.format,o=i?.byteStride??(a?u.getVertexFormatInfo(a).byteLength:0),s=e.indices&&o?Math.floor(r.byteLength/o):e.vertexCount;t[n]={name:n,format:a,length:s,byteStride:o,rowByteLength:o,bufferLayout:i,data:[{buffer:r,byteOffset:0,length:s,format:a,byteStride:o,rowByteLength:o}]}}if(e.indices){let e=Math.min(...Object.values(t).map(e=>e.length));for(let[n,r]of Object.entries(t))t[n]={...r,length:e,data:r.data.map(t=>({...t,length:e}))}}let n=e.indices,r=n?.indexType===`uint32`?4:n?.indexType===`uint8`?1:2,i=n?n.byteLength/r:0;return new Hv({attributes:t,indices:n?{name:`indices`,format:n.indexType,length:i,byteStride:r,rowByteLength:r,data:[{buffer:n,byteOffset:0,length:i,format:n.indexType,byteStride:r,rowByteLength:r}]}:null,topology:e.topology,vertexCount:e.vertexCount,bufferLayout:e.bufferLayout})}var Wv=class extends jv{static defaultProps={...jv.defaultProps,material:void 0};get sourceGeometry(){return this.sourceGeometryValue}constructor(e,t){let n=t.geometry===void 0?new.target.defaultProps.geometry:t.geometry,r=n&&!(n instanceof Hv)?zv(e,n):null,i=r?Uv(r):n,a={...t,geometry:i instanceof Hv?i:null};try{super(e,a)}catch(e){throw r?.destroy(),e}this._gpuGeometry=r,this.sourceGeometryValue=n,r&&this.setIndexCount(this.props.indexCount)}_initializeProps(e){this.material=e.material||null,this._gpuGeometry=null,this.sourceGeometryValue=null,super._initializeProps(e)}_initializeAttributes(){super._initializeAttributes(),this._gpuGeometry&&super.setIndexCount(this.indexCountOverride)}destroy(){super.destroy(),this._gpuGeometry?.destroy(),this._gpuGeometry=null,this.sourceGeometryValue=null}setGeometry(e){this._gpuGeometry?.destroy(),this._gpuGeometry=e&&!(e instanceof Hv)?zv(this.device,e):null;let t=this._gpuGeometry?Uv(this._gpuGeometry):e;super.setGeometry(t instanceof Hv?t:null),e instanceof Hv||super.setIndexCount(this.indexCountOverride),this.sourceGeometryValue=e}setIndexCount(e){this.indexCountOverride=e,super.setIndexCount(e)}setMaterial(e){this.material=e,this.setNeedsRedraw(`material`)}_usesManagedUniformBuffer(e){return!this.material?.ownsModule(e)}updateShaderInputs(e){super.updateShaderInputs(e),this.material?.updateShaderInputs(e)}_getShaderInputBindings(){let e=super._getShaderInputBindings(),t=this.material;return t?Object.fromEntries(Object.entries(e).filter(([e])=>!t.ownsBinding(e))):e}_areBindingsLoading(){let e=super._areBindingsLoading();if(e)return e;for(let e of Object.values(this.material?.bindings||{}))if(wv(e)&&!e.isReady)return e.id;return!1}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){let n=super._getBindGroups(e,t);for(let[t,r]of Object.entries(this.material?.getBindingsByGroup(e)||{})){let e=Number(t);n[e]={...n[e]||{},...r}}return n}_getBindGroupCacheKeys(){let e=this.material?.getBindGroupCacheKey(3);return e?{3:e}:{}}_getBindingsUpdateTimestamp(){return Math.max(super._getBindingsUpdateTimestamp(),this.material?.getBindingsUpdateTimestamp()||0)}},Gv=class{device;modules;_materialBindingNames;_materialModuleNames;constructor(e,t={}){this.device=e,this.modules=t.modules||[];let n=new _v(Object.fromEntries(this.modules.map(e=>[e.name,e])));this._materialBindingNames=qv(n),this._materialModuleNames=Jv(n)}createMaterial(e={}){return new Yv(this.device,{...e,factory:this})}getBindingNames(){return Array.from(this._materialBindingNames)}ownsBinding(e){if(this._materialBindingNames.has(e))return!0;let t=Kv(e);return t?this._materialModuleNames.has(t):!1}ownsModule(e){return this._materialModuleNames.has(e)}getBindingsByGroup(e){return Object.keys(e).length>0?{3:e}:{}}};function Kv(e){return e.endsWith(`Uniforms`)?e.slice(0,-8):null}function qv(e){let t=new Set;for(let n of Object.values(e.modules))for(let e of n.bindingLayout||[])e.group===3&&t.add(e.name);return t}function Jv(e){let t=new Set;for(let n of Object.values(e.modules))n.name&&n.bindingLayout?.some(e=>e.group===3&&e.name===n.name)&&t.add(n.name);return t}var Yv=class{id;metadata={};device;factory;shaderInputs;bindings={};_uniformStore;_bindGroupCacheToken={};_dynamicResourceGenerations={};constructor(e,t={}){this.id=t.id||av(`material`),this.device=e,this.factory=t.factory||new Gv(e,{modules:t.modules||t.shaderInputs?.getModules()||[]});let n=Object.fromEntries((t.shaderInputs?.getModules()||this.factory.modules).map(e=>[e.name,e]));this.shaderInputs=t.shaderInputs||new _v(n),this._uniformStore=new Ko(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(this.ownsModule(e)&&Z_(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.updateShaderInputs(),t.bindings&&this._replaceOwnedBindings(t.bindings)}destroy(){this._uniformStore.destroy()}clone(e={}){let t=this.factory.createMaterial({id:e.id,shaderInputs:e.shaderInputs,bindings:{...this.getResourceBindings(),...e.bindings}});return e.shaderInputs||t.setProps(this.shaderInputs.getUniformValues()),e.moduleProps&&t.setProps(e.moduleProps),t.metadata={...this.metadata},t.updateShaderInputs(),t}ownsBinding(e){return this.factory.ownsBinding(e)}ownsModule(e){return this.factory.ownsModule(e)}setProps(e){this.shaderInputs.setProps(e)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this._setOwnedBindings(this.shaderInputs.getBindingValues())&&(this._bindGroupCacheToken={})}getResourceBindings(){let e={};for(let[t,n]of Object.entries(this.bindings))Kv(t)||(e[t]=n);return e}getBindings(e={bindings:[]}){this._syncDynamicResourceGenerations();let t={},n=t;for(let[t,r]of Object.entries(this.bindings))if(wv(r)){let i=Ev(e,t,{fallbackGroup:3}),a=i?r.resolveTextureBinding(i):null;a&&(n[t]=a)}else r instanceof M?n[t]=r.buffer:Be(r)?n[t]=Ve(r):n[t]=r;return this._syncDynamicResourceGenerations(),t}getBindingsByGroup(e={bindings:[]}){return this.factory.getBindingsByGroup(this.getBindings(e))}getBindGroupCacheKey(e){return this._syncDynamicResourceGenerations(),e===3?this._bindGroupCacheToken:null}getBindingsUpdateTimestamp(){let e=0;for(let t of Object.values(this.bindings))t instanceof ae?e=Math.max(e,t.texture.updateTimestamp):t instanceof n||t instanceof j||t instanceof Ao||t instanceof M?e=Math.max(e,t.updateTimestamp):wv(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:Be(t)&&(e=Math.max(e,(t.buffer instanceof M,t.buffer.updateTimestamp)));return e}_replaceOwnedBindings(e){this._setOwnedBindings(e)&&(this._bindGroupCacheToken={})}_setOwnedBindings(e){let t=!1;for(let[n,r]of Object.entries(e))r!==void 0&&this.ownsBinding(n)&&this.bindings[n]!==r&&(this.bindings[n]=r,t=!0);return t}_syncDynamicResourceGenerations(){let e={},t=!1;for(let[n,r]of Object.entries(this.bindings)){let i=Xv(r);i!==null&&(e[n]=i,this._dynamicResourceGenerations[n]!==i&&(t=!0))}Object.keys(e).length!==Object.keys(this._dynamicResourceGenerations).length&&(t=!0),this._dynamicResourceGenerations=e,t&&(this._bindGroupCacheToken={})}};function Xv(e){return wv(e)?e.generation:et(e)?.generation??null}var Zv=35980,Qv=35981,$v=class e{device;model;transformFeedback;outputVectorBindings={};outputBuffers={};static defaultProps={...jv.defaultProps,inputVectors:void 0,outputVectors:void 0,feedbackBufferMode:`separate`,outputs:void 0,feedbackBuffers:void 0};static isSupported(e){return e?.info?.type===`webgl`}constructor(t,n=e.defaultProps){if(!e.isSupported(t))throw Error(`BufferTransform not yet implemented on WebGPU`);this.device=t,this.outputBuffers=n.feedbackBuffers||{};let{inputVectors:r,outputVectors:i,...a}=n;this.model=new jv(this.device,{id:n.id||`buffer-transform-model`,fs:n.fs||Vg(),topology:n.topology||`point-list`,varyings:n.outputs||n.varyings,...a,bufferMode:n.bufferMode||(n.feedbackBufferMode===`interleaved`?Zv:Qv)}),this.transformFeedback=this.device.createTransformFeedback({layout:this.model.pipeline.shaderLayout,buffers:n.feedbackBuffers}),this.model.setTransformFeedback(this.transformFeedback),r&&this.model.setGPUVectors(r,{count:`vertex`}),i&&this.setOutputVectors(i)}destroy(){this.model&&this.model.destroy()}delete(){this.destroy()}run(e){let{inputVectors:t,outputVectors:n,inputBuffers:r,outputBuffers:i,...a}=e??{};r&&this.model.setAttributes(r),t&&this.model.setGPUVectors(t,{count:`vertex`}),i&&(this.outputBuffers=i),(i||n||Object.keys(this.outputVectorBindings).length>0)&&this.setOutputVectors(n??this.outputVectorBindings);let o=this.device.beginRenderPass({discard:!0,...a});try{this.model.draw(o)}finally{o.end()}}setOutputVectors(e){let t=sv(this.model.id,e);o(t.length===0||this.model.pipeline.props.bufferMode!==Zv),o(t.length<=1),this.outputVectorBindings=e,this.transformFeedback.setBuffers({...this.outputBuffers,...Object.fromEntries(Object.entries(t[0]?.data??{}).map(([e,t])=>(o(t.byteStride===t.rowByteLength),[e,{buffer:t.buffer instanceof M?t.buffer.buffer:t.buffer,byteOffset:t.byteOffset,byteLength:t.length*t.byteStride}])))})}getBuffer(e){return this.transformFeedback.getBuffer(e)}readAsync(e){let t=this.getBuffer(e);if(!t)throw Error(`BufferTransform#getBuffer`);if(t instanceof n)return t.readAsync();let{buffer:r,byteOffset:i=0,byteLength:a=r.byteLength}=t;return r.readAsync(i,a)}};function ey(e,t){if(!e)throw Error(t)}var ty=class{id;matrix=new z;display=!0;selectable=!0;hoverable=!0;position=new R;rotation=new R;scale=new R(1,1,1);metadata={};userData={};props={};constructor(e={}){let{id:t}=e;this.id=t||av(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return ey(e.length===3,`setPosition requires vector argument`),this.position=e,this}setRotation(e){return ey(e.length===3||e.length===4,`setRotation requires vector argument`),this.rotation=e,this}setScale(e){return ey(e.length===3,`setScale requires vector argument`),this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){let{position:t,rotation:n,scale:r,update:i=!0}=e;return t&&this.setPosition(t),n&&this.setRotation(n),r&&this.setScale(r),i&&this.updateMatrix(),this}updateMatrix(){if(this.matrix.identity(),this.matrix.translate(this.position),this.rotation.length===4){let e=new z().fromQuaternion(this.rotation);this.matrix.multiplyRight(e)}else this.matrix.rotateXYZ(this.rotation);return this.matrix.scale(this.scale),this}update({position:e,rotation:t,scale:n}={}){return e&&this.setPosition(e),t&&this.setRotation(t),n&&this.setScale(n),this.updateMatrix(),this}getCoordinateUniforms(e,t){t||=this.matrix;let n=new z(e).multiplyRight(t),r=n.invert(),i=r.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:n,worldInverseMatrix:r,worldInverseTransposeMatrix:i}}_setScenegraphNodeProps(e){e.selectable!==void 0&&(this.selectable=e.selectable),e.hoverable!==void 0&&(this.hoverable=e.hoverable),e.display!==void 0&&(this.display=e.display),e?.position&&this.setPosition(e.position),e?.rotation&&this.setRotation(e.rotation),e?.scale&&this.setScale(e.scale),this.updateMatrix(),e?.matrix&&this.setMatrix(e.matrix),Object.assign(this.props,e)}};function ny(){return[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]]}function ry(e,t,n){let r=new z(n);for(let n=0;n<8;n++){let i=new R(t[n&1?1:0][0],t[n&2?1:0][1],t[n&4?1:0][2]);r.transformAsPoint(i,i);for(let t=0;t<3;t++)e[0][t]=Math.min(e[0][t],i[t]),e[1][t]=Math.max(e[1][t],i[t])}}function iy(e){return Number.isFinite(e[0][0])}var ay=class extends ty{model;instanceMatrices;bounds=null;managedResources;constructor(e){super(e),this.model=e.model,this.managedResources=e.managedResources||[],this.instanceMatrices=e.instanceMatrices||null,this.bounds=e.bounds?this.instanceMatrices?oy(e.bounds,this.instanceMatrices):e.bounds:null,this.setProps(e)}destroy(){this.model&&=(this.model.destroy(),null),this.managedResources.forEach(e=>e.destroy()),this.managedResources=[]}getBounds(){return this.bounds}draw(e){return this.model.draw(e)}};function oy(e,t){let n=ny();for(let r of t)ry(n,e,r);return iy(n)?n:null}function sy(e,t={}){let{angleThreshold:n=30,weldTolerance:r=0,positionAttribute:i=`POSITION`}=t,a=cy(e,i);o(Number.isFinite(r)&&r>=0),o(Number.isFinite(n)&&n>=0&&n<=180);let s=e.indices?.value,c=a.value.length/3,l=new Map,u=new Map,d=new Set,f=new Map,p=Math.cos(n*Math.PI/180),m=r*r;function h(e){return[a.value[e*3],a.value[e*3+1],a.value[e*3+2]]}function g(e){let t=l.get(e);if(t!==void 0)return t;o(Number.isInteger(e)&&e>=0&&e<c);let n=h(e);o(n.every(Number.isFinite));let i=r>0?n.map(e=>Math.floor(e/r)):n,a=r>0?1:0;for(let t=-a;t<=a;t++)for(let r=-a;r<=a;r++)for(let o=-a;o<=a;o++){let a=u.get(`${i[0]+t},${i[1]+r},${i[2]+o}`);for(let t of a||[]){let r=h(t);if((n[0]-r[0])**2+(n[1]-r[1])**2+(n[2]-r[2])**2<=m)return l.set(e,t),t}}let s=i.join(`,`),d=u.get(s)||[];return d.push(e),u.set(s,d),l.set(e,e),e}function _(e,t,n){let r=Math.min(e,t),i=Math.max(e,t),a=`${r},${i}`,o=f.get(a);if(o){o.faceCount++;let e=n[0]*o.normal[0]+n[1]*o.normal[1]+n[2]*o.normal[2];o.crease||=e<.9999999&&e<=p+1e-7}else f.set(a,{start:r,end:i,normal:n,faceCount:1,crease:!1})}for(let t=0;t<e.vertexCount;t+=3){let e=g(s?.[t]??t),n=g(s?.[t+1]??t+1),r=g(s?.[t+2]??t+2);if(e===n||n===r||r===e)continue;let i=[e,n,r].sort((e,t)=>e-t).join(`,`);if(d.has(i))continue;d.add(i);let a=h(e),o=h(n),c=h(r),l=o.map((e,t)=>e-a[t]),u=c.map((e,t)=>e-a[t]),f=[l[1]*u[2]-l[2]*u[1],l[2]*u[0]-l[0]*u[2],l[0]*u[1]-l[1]*u[0]],p=Math.hypot(...f);p!==0&&(f[0]/=p,f[1]/=p,f[2]/=p,_(e,n,f),_(n,r,f),_(r,e,f))}let v=[...f.values()].filter(e=>t.includeCoplanarEdges||e.faceCount!==2||e.crease).sort((e,t)=>e.start-t.start||e.end-t.end);return new dh({id:`${e.id}-edges`,topology:`line-list`,attributes:{[i]:a},indices:new Uint32Array(v.flatMap(e=>[e.start,e.end]))})}function cy(e,t){let n=e.attributes[t];return o(e.topology===`triangle-list`&&n?.size===3),o(n.value.length%3==0&&e.vertexCount%3==0),o(!n.byteStride||n.byteStride===n.value.BYTES_PER_ELEMENT*3),o(e.vertexCount>=0&&e.vertexCount<=(e.indices?.value.length??n.value.length/3)),n}var ly={blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`zero`,blendAlphaOperation:`add`,blendAlphaSrcFactor:`constant`,blendAlphaDstFactor:`zero`},uy=class extends Tm{constructor(){super(...arguments),this._colorEncoderState=null}render(e){return`pickingFBO`in e?this._drawPickingBuffer(e):{decodePickingColor:null,stats:super._render(e)}}_drawPickingBuffer({layers:e,layerFilter:t,views:n,viewports:r,onViewportActive:i,pickingFBO:a,deviceRect:{x:o,y:s,width:c,height:l},cullRect:u,effects:d,pass:f=`picking`,pickZ:p,canvasContext:m,shaderModuleProps:h,clearColor:g}){this.pickZ=p;let _=this._resetColorEncoder(p),v=[o,this.device.type===`webgpu`?a.height-s-l:s,c,l],y=super._render({target:a,layers:e,layerFilter:t,views:n,viewports:r,onViewportActive:i,cullRect:u,effects:d?.filter(e=>e.useInPicking),pass:f,canvasContext:m,isPicking:!0,shaderModuleProps:h,clearColor:g??[0,0,0,0],colorMask:15,scissorRect:v});return this._colorEncoderState=null,{decodePickingColor:_&&fy.bind(null,_),stats:y}}shouldDrawLayer(e){let{pickable:t,operation:n}=e.props;return t&&n.includes(`draw`)||n.includes(`terrain`)||n.includes(`mask`)}getShaderModuleProps(e,t,n){return{picking:{isActive:1,isAttribute:this.pickZ,disabledPickingIndices:e.internalState?.disabledPickingIndices},lighting:{enabled:!1}}}getLayerParameters(e,t,n){let r={...e.props.parameters},{pickable:i,operation:a}=e.props;return this._colorEncoderState?i&&a.includes(`draw`)?(Object.assign(r,ly),r.blend=!0,this.device.type===`webgpu`?r.blendConstant=dy(this._colorEncoderState,e,n):r.blendColor=dy(this._colorEncoderState,e,n),a.includes(`terrain`)&&e.state?._hasPickingCover&&(r.blendAlphaSrcFactor=`one`)):a.includes(`terrain`)&&(r.blend=!1):r.blend=!1,r}_resetColorEncoder(e){return this._colorEncoderState=e?null:{byLayer:new Map,byAlpha:[]},this._colorEncoderState}};function dy(e,t,n){let{byLayer:r,byAlpha:i}=e,a,o=r.get(t);return o?(o.viewports.push(n),a=o.a):(a=r.size+1,a<=255?(o={a,layer:t,viewports:[n]},r.set(t,o),i[a]=o):(N.warn(`Too many pickable layers, only picking the first 255`)(),a=0)),[0,0,0,a/255]}function fy(e,t){let n=e.byAlpha[t[3]];return n&&{pickedLayer:n.layer,pickedViewports:n.viewports,pickedObjectIndex:n.layer.decodePickingColor(t)}}var py={NO_STATE:`Awaiting state`,MATCHED:`Matched. State transferred from previous layer`,INITIALIZED:`Initialized`,AWAITING_GC:`Discarded. Awaiting garbage collection`,AWAITING_FINALIZATION:`No longer matched. Awaiting garbage collection`,FINALIZED:`Finalized! Awaiting garbage collection`},my=Symbol.for(`component`),hy=Symbol.for(`propTypes`),gy=Symbol.for(`deprecatedProps`),_y=Symbol.for(`asyncPropDefaults`),vy=Symbol.for(`asyncPropOriginal`),yy=Symbol.for(`asyncPropResolved`);function by(e,t=()=>!0){return Array.isArray(e)?xy(e,t,[]):t(e)?[e]:[]}function xy(e,t,n){let r=-1;for(;++r<e.length;){let i=e[r];Array.isArray(i)?xy(i,t,n):t(i)&&n.push(i)}return n}function Sy({target:e,source:t,start:n=0,count:r=1}){let i=t.length,a=r*i,o=0;for(let r=n;o<i;o++)e[r++]=t[o];for(;o<a;)o<a-o?(e.copyWithin(n+o,n,n+o),o*=2):(e.copyWithin(n+o,n,n+a-o),o=a);return e}var Cy=class{constructor(e,t,n){this._loadCount=0,this._subscribers=new Set,this.id=e,this.context=n,this.setData(t)}subscribe(e){this._subscribers.add(e)}unsubscribe(e){this._subscribers.delete(e)}inUse(){return this._subscribers.size>0}delete(){}getData(){return this.isLoaded?this._error?Promise.reject(this._error):this._content:this._loader.then(()=>this.getData())}setData(e,t){if(e===this._data&&!t)return;this._data=e;let n=++this._loadCount,r=e;typeof e==`string`&&(r=xi(e)),r instanceof Promise?(this.isLoaded=!1,this._loader=r.then(e=>{this._loadCount===n&&(this.isLoaded=!0,this._error=void 0,this._content=e)}).catch(e=>{this._loadCount===n&&(this.isLoaded=!0,this._error=e||!0)})):(this.isLoaded=!0,this._error=void 0,this._content=e);for(let e of this._subscribers)e.onChange(this.getData())}},wy=class{constructor(e){this.protocol=e.protocol||`resource://`,this._context={device:e.device,gl:e.device?.gl,resourceManager:this},this._resources={},this._consumers={},this._pruneRequest=null}contains(e){return e.startsWith(this.protocol)?!0:e in this._resources}add({resourceId:e,data:t,forceUpdate:n=!1,persistent:r=!0}){let i=this._resources[e];i?i.setData(t,n):(i=new Cy(e,t,this._context),this._resources[e]=i),i.persistent=r}remove(e){let t=this._resources[e];t&&(t.delete(),delete this._resources[e])}unsubscribe({consumerId:e}){let t=this._consumers[e];if(t){for(let e in t){let n=t[e],r=this._resources[n.resourceId];r&&r.unsubscribe(n)}delete this._consumers[e],this.prune()}}subscribe({resourceId:e,onChange:t,consumerId:n,requestId:r=`default`}){let{_resources:i,protocol:a}=this;e.startsWith(a)&&(e=e.replace(a,``),i[e]||this.add({resourceId:e,data:null,persistent:!1}));let o=i[e];if(this._track(n,r,o,t),o)return o.getData()}prune(){this._pruneRequest||=setTimeout(()=>this._prune(),0)}finalize(){for(let e in this._resources)this._resources[e].delete()}_track(e,t,n,r){let i=this._consumers,a=i[e]=i[e]||{},o=a[t],s=o&&o.resourceId&&this._resources[o.resourceId];s&&(s.unsubscribe(o),this.prune()),n&&(o?(o.onChange=r,o.resourceId=n.id):o={onChange:r,resourceId:n.id},a[t]=o,n.subscribe(o))}_prune(){this._pruneRequest=null;for(let e of Object.keys(this._resources)){let t=this._resources[e];!t.persistent&&!t.inUse()&&(t.delete(),delete this._resources[e])}}},Ty=`layerManager.setLayers`,Ey=`layerManager.activateViewport`,Dy=class{constructor(e,t){this._lastRenderedLayers=[],this._needsRedraw=!1,this._needsUpdate=!1,this._nextLayers=null,this._debug=!1,this._defaultShaderModulesChanged=!1,this.activateViewport=e=>{P(Ey,this,e),e&&(this.context.viewport=e)};let{deck:n,stats:r,viewport:i,timeline:a}=t||{};this.layers=[],this.resourceManager=new wy({device:e,protocol:`deck://`}),this.context={mousePosition:null,userData:{},layerManager:this,device:e,gl:e?.gl,deck:n,shaderAssembler:pm(e?.info?.shadingLanguage||`glsl`),defaultShaderModules:[Tl],renderPass:void 0,stats:r||new Ln({id:`deck.gl`}),viewport:i||new Xm({id:`DEFAULT-INITIAL-VIEWPORT`}),timeline:a||new xh,resourceManager:this.resourceManager,onError:void 0},Object.seal(this)}finalize(){this.resourceManager.finalize();for(let e of this.layers)this._finalizeLayer(e)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);for(let n of this.layers){let r=n.getNeedsRedraw(e);t||=r}return t}needsUpdate(){return this._nextLayers&&this._nextLayers!==this._lastRenderedLayers?`layers changed`:this._defaultShaderModulesChanged?`shader modules changed`:this._needsUpdate}setNeedsRedraw(e){this._needsRedraw=this._needsRedraw||e}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e}getLayers({layerIds:e}={}){return e?this.layers.filter(t=>e.find(e=>t.id.indexOf(e)===0)):this.layers}setProps(e){`debug`in e&&(this._debug=e.debug),`userData`in e&&(this.context.userData=e.userData),`layers`in e&&(this._nextLayers=e.layers),`onError`in e&&(this.context.onError=e.onError)}setLayers(e,t){P(Ty,this,t,e),this._lastRenderedLayers=e;let n=by(e,Boolean);for(let e of n)e.context=this.context;this._updateLayers(this.layers,n)}updateLayers(){let e=this.needsUpdate();e&&(this.setNeedsRedraw(`updating layers: ${e}`),this.setLayers(this._nextLayers||this._lastRenderedLayers,e)),this._nextLayers=null}addDefaultShaderModule(e){let{defaultShaderModules:t}=this.context;t.find(t=>t.name===e.name)||(t.push(e),this._defaultShaderModulesChanged=!0)}removeDefaultShaderModule(e){let{defaultShaderModules:t}=this.context,n=t.findIndex(t=>t.name===e.name);n>=0&&(t.splice(n,1),this._defaultShaderModulesChanged=!0)}_handleError(e,t,n){n.raiseError(t,`${e} of ${n}`)}_updateLayers(e,t){let n={};for(let t of e)n[t.id]?N.warn(`Multiple old layers with same id ${t.id}`)():n[t.id]=t;if(this._defaultShaderModulesChanged){for(let t of e)t.setNeedsUpdate(),t.setChangeFlags({extensionsChanged:!0});this._defaultShaderModulesChanged=!1}let r=[];this._updateSublayersRecursively(t,n,r),this._finalizeOldLayers(n);let i=!1;for(let e of r)if(e.hasUniformTransition()){i=`Uniform transition in ${e}`;break}this._needsUpdate=i,this.layers=r}_updateSublayersRecursively(e,t,n){for(let r of e){r.context=this.context;let e=t[r.id];e===null&&N.warn(`Multiple new layers with same id ${r.id}`)(),t[r.id]=null;let i=null;try{this._debug&&e!==r&&r.validateProps(),e?(this._transferLayerState(e,r),this._updateLayer(r)):this._initializeLayer(r),n.push(r),i=r.isComposite?r.getSubLayers():null}catch(e){this._handleError(`matching`,e,r)}i&&this._updateSublayersRecursively(i,t,n)}}_finalizeOldLayers(e){for(let t in e){let n=e[t];n&&this._finalizeLayer(n)}}_initializeLayer(e){try{e._initialize(),e.lifecycle=py.INITIALIZED}catch(t){this._handleError(`initialization`,t,e)}}_transferLayerState(e,t){t._transferState(e),t.lifecycle=py.MATCHED,t!==e&&(e.lifecycle=py.AWAITING_GC)}_updateLayer(e){try{e._update()}catch(t){this._handleError(`update`,t,e)}}_finalizeLayer(e){this._needsRedraw=this._needsRedraw||`finalized ${e}`,e.lifecycle=py.AWAITING_FINALIZATION;try{e._finalize(),e.lifecycle=py.FINALIZED}catch(t){this._handleError(`finalization`,t,e)}}};function G(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!G(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=Object.keys(e),i=Object.keys(t);if(r.length!==i.length)return!1;for(let i of r)if(!t.hasOwnProperty(i)||!G(e[i],t[i],n-1))return!1;return!0}return!1}var Oy=`default-canvas`,ky=class{constructor(e){this.views=[],this.width=100,this.height=100,this.viewState={},this.controllers={},this.timeline=e.timeline,this._viewports=[],this._viewportMap={},this._isUpdating=!1,this._needsRedraw=`First render`,this._needsUpdate=`Initialize`,this._eventManager=e.eventManager,this._eventManagers=e.eventManagers||{},this._viewEventManagers={},this._eventCallbacks={onViewStateChange:e.onViewStateChange,onInteractionStateChange:e.onInteractionStateChange},this._pickPosition=e.pickPosition,this._getCanvasContext=e.getCanvasContext,Object.seal(this),this.setProps(e)}finalize(){for(let e in this.controllers){let t=this.controllers[e];t&&t.finalize()}this.controllers={}}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e,this._needsRedraw=this._needsRedraw||e}updateViewStates(){for(let e in this.controllers){let t=this.controllers[e];t&&t.updateTransition()}}getViewports(e){return e?this._viewports.filter(t=>{let n=!e.canvasId||this.getCanvasId(t.id)===e.canvasId,r=!(`x`in e)||t.containsPixel(e);return n&&r}):this._viewports}getViews(){let e={};return this.views.forEach(t=>{e[t.id]=t}),e}getView(e){return this.views.find(t=>t.id===e)}getViewState(e){let t=typeof e==`string`?this.getView(e):e,n=t&&this.viewState[t.getViewStateId()]||this.viewState;return t?t.filterViewState(n):n}getViewport(e){return this._viewportMap[e]}getCanvasId(e){let t=typeof e==`string`?this.getView(e):e;return t?this._viewEventManagers[t.id]?.canvasId||this._getCanvasIdFromView(t):void 0}unproject(e,t){let n=this.getViewports(),r={x:e[0],y:e[1]};for(let i=n.length-1;i>=0;--i){let a=n[i];if(a.containsPixel(r)){let n=e.slice();return n[0]-=a.x,n[1]-=a.y,a.unproject(n,t)}}return null}setProps(e){e.views&&this._setViews(e.views),e.viewState&&this._setViewState(e.viewState),(`width`in e||`height`in e)&&this._setSize(e.width,e.height),`pickPosition`in e&&(this._pickPosition=e.pickPosition),`eventManagers`in e&&this._setEventManagers(e.eventManagers||{}),this._isUpdating||this._update()}_update(){this._isUpdating=!0,this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._isUpdating=!1}_setSize(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.setNeedsUpdate(`Size changed`))}_setViews(e){e=by(e,Boolean),this._diffViews(e,this.views)&&this.setNeedsUpdate(`views changed`),this.views=e}_setViewState(e){e?(G(e,this.viewState,3)||this.setNeedsUpdate(`viewState changed`),this.viewState=e):N.warn("missing `viewState` or `initialViewState`")()}_setEventManagers(e){this._eventManagers!==e&&(this._eventManagers=e,this.setNeedsUpdate(`eventManagers changed`))}_getCanvasIdFromView(e){return e.props.canvasId||this._getCanvasContext?.(e.id)?.id||`default-canvas`}_getCanvasDimensions(e){let[t,n]=(this._getCanvasContext?.(e.id))?.getCSSSize()||[this.width,this.height];return{width:t,height:n}}_getViewEventManager(e){let t=this.getCanvasId(e)||`default-canvas`;return{canvasId:t,eventManager:this._eventManagers[t]||this._eventManager}}_startViewportRebuild(){let e=this.controllers,t=this._viewEventManagers;return this._viewports=[],this.controllers={},this._viewEventManagers={},{oldControllers:e,oldViewEventManagers:t}}_getReusableController(e,t,n){return e&&(t?.canvasId!==n.canvasId||t?.eventManager!==n.eventManager)?(e.finalize(),null):e}_createController(e,t){let n=t.type;return new n({timeline:this.timeline,eventManager:this._getViewEventManager(e).eventManager,onViewStateChange:this._eventCallbacks.onViewStateChange,onStateChange:this._eventCallbacks.onInteractionStateChange,makeViewport:t=>this.getView(e.id)?.makeViewport({viewState:t,...this._getCanvasDimensions(e)}),pickPosition:(t,n)=>this._pickPosition?.(t,n,e.id)})}_updateController(e,t,n,r){let i=e.controller;if(i&&n){let a={...t,...i,id:e.id,x:n.x,y:n.y,width:n.width,height:n.height};return(!r||r.constructor!==i.type)&&(r=this._createController(e,a)),r&&r.setProps(a),r}return null}_rebuildViewports(){let{views:e}=this,{oldControllers:t,oldViewEventManagers:n}=this._startViewportRebuild(),r=!1;for(let i=e.length;i--;){let a=e[i],{width:o,height:s}=this._getCanvasDimensions(a),c=this._getViewEventManager(a);this._viewEventManagers[a.id]=c;let l=this.getViewState(a),u=a.makeViewport({viewState:l,width:o,height:s}),d=this._getReusableController(t[a.id],n[a.id],c),f=!!a.controller;f&&!d&&(r=!0),(r||!f)&&d&&(d.finalize(),d=null),this.controllers[a.id]=this._updateController(a,l,u,d),u&&this._viewports.unshift(u)}for(let e in t){let n=t[e];n&&!this.controllers[e]&&n.finalize()}this._buildViewportMap()}_buildViewportMap(){this._viewportMap={},this._viewports.forEach(e=>{e.id&&(this._viewportMap[e.id]=this._viewportMap[e.id]||e)})}_diffViews(e,t){return e.length===t.length?e.some((n,r)=>!e[r].equals(t[r])):!0}},Ay=/^(?:\d+\.?\d*|\.\d+)$/;function jy(e){switch(typeof e){case`number`:if(!Number.isFinite(e))throw Error(`Could not parse position string ${e}`);return{type:`literal`,value:e};case`string`:try{return new Fy(Py(e)).parseExpression()}catch(t){let n=t instanceof Error?t.message:String(t);throw Error(`Could not parse position string ${e}: ${n}`)}default:throw Error(`Could not parse position string ${e}`)}}function My(e,t){switch(e.type){case`literal`:return e.value;case`percentage`:return Math.round(e.value*t);case`binary`:let n=My(e.left,t),r=My(e.right,t);return e.operator===`+`?n+r:n-r;default:throw Error(`Unknown layout expression type`)}}function Ny(e,t){return My(e,t)}function Py(e){let t=[],n=0;for(;n<e.length;){let r=e[n];if(/\s/.test(r)){n++;continue}if(r===`+`||r===`-`||r===`(`||r===`)`||r===`%`){t.push({type:`symbol`,value:r}),n++;continue}if(Iy(r)||r===`.`){let i=n,a=r===`.`;for(n++;n<e.length;){let t=e[n];if(Iy(t)){n++;continue}if(t===`.`&&!a){a=!0,n++;continue}break}let o=e.slice(i,n);if(!Ay.test(o))throw Error(`Invalid number token`);t.push({type:`number`,value:parseFloat(o)});continue}if(Ly(r)){let r=n;for(;n<e.length&&Ly(e[n]);)n++;let i=e.slice(r,n).toLowerCase();t.push({type:`word`,value:i});continue}throw Error(`Invalid token in position string`)}return t}var Fy=class{constructor(e){this.index=0,this.tokens=e}parseExpression(){let e=this.parseBinaryExpression();if(this.index<this.tokens.length)throw Error(`Unexpected token at end of expression`);return e}parseBinaryExpression(){let e=this.parseFactor(),t=this.peek();for(;Ry(t);){this.index++;let n=this.parseFactor();e={type:`binary`,operator:t.value,left:e,right:n},t=this.peek()}return e}parseFactor(){let e=this.peek();if(!e)throw Error(`Unexpected end of expression`);if(e.type===`symbol`&&e.value===`+`)return this.index++,this.parseFactor();if(e.type===`symbol`&&e.value===`-`)return this.index++,{type:`binary`,operator:`-`,left:{type:`literal`,value:0},right:this.parseFactor()};if(e.type===`symbol`&&e.value===`(`){this.index++;let e=this.parseBinaryExpression();if(!this.consumeSymbol(`)`))throw Error(`Missing closing parenthesis`);return e}if(e.type===`word`&&e.value===`calc`){if(this.index++,!this.consumeSymbol(`(`))throw Error(`Missing opening parenthesis after calc`);let e=this.parseBinaryExpression();if(!this.consumeSymbol(`)`))throw Error(`Missing closing parenthesis`);return e}if(e.type===`number`){this.index++;let t=e.value,n=this.peek();return n&&n.type===`symbol`&&n.value===`%`?(this.index++,{type:`percentage`,value:t/100}):(n&&n.type===`word`&&n.value===`px`&&this.index++,{type:`literal`,value:t})}throw Error(`Unexpected token in expression`)}consumeSymbol(e){let t=this.peek();return t&&t.type===`symbol`&&t.value===e?(this.index++,!0):!1}peek(){return this.tokens[this.index]||null}};function Iy(e){return e>=`0`&&e<=`9`}function Ly(e){return e>=`a`&&e<=`z`||e>=`A`&&e<=`Z`}function Ry(e){return!!(e&&e.type===`symbol`&&(e.value===`+`||e.value===`-`))}function zy(e,t){let n={...e};for(let e in t)e!==`id`&&(Array.isArray(n[e])&&Array.isArray(t[e])?n[e]=By(n[e],t[e]):n[e]=t[e]);return n}function By(e,t){e=e.slice();for(let n=0;n<t.length;n++){let r=t[n];Number.isFinite(r)&&(e[n]=r)}return e}var Vy=class{constructor(e){let{id:t,x:n=0,y:r=0,width:i=`100%`,height:a=`100%`,padding:o=null}=e;this.id=t||this.constructor.displayName||`view`,this.props={...e,id:this.id},this._x=jy(n),this._y=jy(r),this._width=jy(i),this._height=jy(a),this._padding=o&&{left:jy(o.left||0),right:jy(o.right||0),top:jy(o.top||0),bottom:jy(o.bottom||0)},this.equals=this.equals.bind(this),Object.seal(this)}equals(e){return this===e?!0:this.constructor===e.constructor&&G(this.props,e.props,2)}clone(e){let t=this.constructor;return new t({...this.props,...e})}makeViewport({width:e,height:t,viewState:n}){n=this.filterViewState(n);let r=this.getDimensions({width:e,height:t});return!r.height||!r.width?null:new(this.getViewportType(n))({...n,...this.props,...r})}getViewStateId(){let{viewState:e}=this.props;return typeof e==`string`?e:e?.id||this.id}filterViewState(e){return this.props.viewState&&typeof this.props.viewState==`object`?this.props.viewState.id?zy(e,this.props.viewState):this.props.viewState:e}getDimensions({width:e,height:t}){let n={x:Ny(this._x,e),y:Ny(this._y,t),width:Ny(this._width,e),height:Ny(this._height,t)};return this._padding&&(n.padding={left:Ny(this._padding.left,e),top:Ny(this._padding.top,t),right:Ny(this._padding.right,e),bottom:Ny(this._padding.bottom,t)}),n}get controller(){let e=this.props.controller;return e?e===!0?{type:this.ControllerType}:typeof e==`function`?{type:e}:{type:this.ControllerType,...e}:null}},Hy=class{constructor(e){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=e}get inProgress(){return this._inProgress}start(e){this.cancel(),this.settings=e,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&=(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,!1)}update(){if(!this._inProgress)return!1;if(this._handle===null){let{_timeline:e,settings:t}=this;this._handle=e.addChannel({delay:e.getTime(),duration:t.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}},Uy=()=>{},Wy={mode:`preserve`},Gy={mode:`hard`},Ky={BREAK:1,SNAP_TO_END:2,IGNORE:3},qy=e=>e,Jy=Ky.BREAK,Yy=class{constructor(e){this._onTransitionUpdate=e=>{let{time:t,settings:{interpolator:n,startProps:r,endProps:i,duration:a,easing:o}}=e,s=o(t/a),c=n.interpolateProps(r,i,s);this.propsInTransition=this.getControllerState({...this.props,...c},Wy).getViewportProps(),this.onViewStateChange({viewState:this.propsInTransition,oldViewState:this.props})},this.getControllerState=e.getControllerState,this.propsInTransition=null,this.transition=new Hy(e.timeline),this.onViewStateChange=e.onViewStateChange||Uy,this.onStateChange=e.onStateChange||Uy}finalize(){this.transition.cancel()}getViewportInTransition(){return this.propsInTransition}processViewStateChange(e){let t=!1,n=this.props;if(this.props=e,!n||this._shouldIgnoreViewportChange(n,e))return!1;if(this._isTransitionEnabled(e)){let r=n;if(this.transition.inProgress){let{interruption:e,endProps:t}=this.transition.settings;r={...n,...e===Ky.SNAP_TO_END?t:this.propsInTransition||n}}this._triggerTransition(r,e),t=!0}else this.transition.cancel();return t}updateTransition(){this.transition.update()}_isTransitionEnabled(e){let{transitionDuration:t,transitionInterpolator:n}=e;return(t>0||t===`auto`)&&!!n}_isUpdateDueToCurrentTransition(e){return this.transition.inProgress&&this.propsInTransition?this.transition.settings.interpolator.arePropsEqual(e,this.propsInTransition):!1}_shouldIgnoreViewportChange(e,t){return this.transition.inProgress?this.transition.settings.interruption===Ky.IGNORE||this._isUpdateDueToCurrentTransition(t):this._isTransitionEnabled(t)?t.transitionInterpolator.arePropsEqual(e,t):!0}_triggerTransition(e,t){let n=this.getControllerState(e,Wy),r=this.getControllerState(t,Gy).shortestPathFrom(n),i=t.transitionInterpolator,a=i.getDuration?i.getDuration(e,t):t.transitionDuration;if(a===0)return;let o=i.initializeProps(e,r);this.propsInTransition={};let s={duration:a,easing:t.transitionEasing||qy,interpolator:i,interruption:t.transitionInterruption||Jy,startProps:o.start,endProps:o.end,onStart:t.onTransitionStart,onUpdate:this._onTransitionUpdate,onInterrupt:this._onTransitionEnd(t.onTransitionInterrupt),onEnd:this._onTransitionEnd(t.onTransitionEnd)};this.transition.start(s),this.onStateChange({inTransition:!0}),this.updateTransition()}_onTransitionEnd(e){return t=>{this.propsInTransition=null,this.onStateChange({inTransition:!1,isZooming:!1,isPanning:!1,isRotating:!1}),e?.(t)}}};function K(e,t){if(!e)throw Error(t||`deck.gl: assertion failed.`)}var Xy=class{constructor(e){let{compare:t,extract:n,required:r}=e;this._propsToCompare=t,this._propsToExtract=n||t,this._requiredProps=r}arePropsEqual(e,t){for(let n of this._propsToCompare)if(!(n in e)||!(n in t)||!Pl(e[n],t[n]))return!1;return!0}initializeProps(e,t){let n={},r={};for(let i of this._propsToExtract)(i in e||i in t)&&(n[i]=e[i],r[i]=t[i]);return this._checkRequiredProps(n),this._checkRequiredProps(r),{start:n,end:r}}getDuration(e,t){return t.transitionDuration}_checkRequiredProps(e){this._requiredProps&&this._requiredProps.forEach(t=>{let n=e[t];K(Number.isFinite(n)||Array.isArray(n),`${t} is required for transition`)})}},Zy=[`longitude`,`latitude`,`zoom`,`bearing`,`pitch`],Qy=[`longitude`,`latitude`,`zoom`],$y=class extends Xy{constructor(e={}){let t=Array.isArray(e)?e:e.transitionProps,n=Array.isArray(e)?{}:e;n.transitionProps=Array.isArray(t)?{compare:t,required:t}:t||{compare:Zy,required:Qy},super(n.transitionProps),this.opts=n}initializeProps(e,t){let n=super.initializeProps(e,t),{makeViewport:r,around:i}=this.opts;if(r&&i){let a=r(e),o=r(t),s=a.unproject(i);n.start.around=i,Object.assign(n.end,{around:o.project(s),aroundPosition:s,width:t.width,height:t.height})}return n}interpolateProps(e,t,n){let r={};for(let i of this._propsToExtract)r[i]=Nl(e[i]||0,t[i]||0,n);if(t.aroundPosition&&this.opts.makeViewport){let i=this.opts.makeViewport({...t,...r});Object.assign(r,i.panByPosition(t.aroundPosition,Nl(e.around,t.around,n)))}return r}},eb={transitionDuration:0},tb=300,nb=300,rb=e=>1-(1-e)*(1-e),ib=e=>e===1?1:1-2**(-10*e),ab={WHEEL:[`wheel`],PAN:[`panstart`,`panmove`,`panend`],PINCH:[`pinchstart`,`pinchmove`,`pinchend`],MULTI_PAN:[`multipanstart`,`multipanmove`,`multipanend`],DOUBLE_CLICK:[`dblclick`],DOUBLE_CLICK_DRAG:[`dblclickdragstart`,`dblclickdragmove`,`dblclickdragend`,`dblclickdragcancel`],KEYBOARD:[`keydown`]},ob={},sb=class{constructor(e){this.state={},this._events={},this._interactionState={isDragging:!1},this._customEvents=[],this._eventStartBlocked=null,this._panMove=!1,this._multiPanMode=null,this._multiPanStartCenter=null,this._doubleClickDragAnchor=null,this._suppressDoubleClickUntil=0,this.invertPan=!1,this.dragMode=`rotate`,this.inertia=0,this.scrollZoom=!0,this.dragPan=!0,this.dragRotate=!0,this.doubleClickZoom=!0,this.doubleClickDragZoom=!0,this.touchZoom=!0,this.touchRotate=!1,this.multiTouchDrag=null,this.trackpadGesture=!1,this.zoomAround=`pointer`,this.keyboard=!0,this.transitionManager=new Yy({...e,getControllerState:(t,n)=>new this.ControllerState({...t,constraintContext:n,makeViewport:e.makeViewport}),onViewStateChange:this._onTransition.bind(this),onStateChange:this._setInteractionState.bind(this)}),this.handleEvent=this.handleEvent.bind(this),this.eventManager=e.eventManager,this.onViewStateChange=e.onViewStateChange||(()=>{}),this.onStateChange=e.onStateChange||(()=>{}),this.makeViewport=e.makeViewport,this.pickPosition=e.pickPosition}set events(e){this.toggleEvents(this._customEvents,!1),this.toggleEvents(e,!0),this._customEvents=e,this.props&&this.setProps(this.props)}finalize(){for(let e in this._events)this._events[e]&&this.eventManager?.off(e,this.handleEvent);this.transitionManager.finalize()}handleEvent(e){this._controllerState=void 0;let t=this._eventStartBlocked;switch(e.type){case`panstart`:return t?!1:this._onPanStart(e);case`panmove`:return this._onPan(e);case`panend`:return this._onPanEnd(e);case`pinchstart`:return t||!this._isTrackpadGestureAllowed(e)?!1:this._onPinchStart(e);case`pinchmove`:return this._isTrackpadGestureAllowed(e)?this._onPinch(e):!1;case`pinchend`:return this._isTrackpadGestureAllowed(e)?this._onPinchEnd(e):!1;case`multipanstart`:return t?!1:this._onMultiPanStart(e);case`multipanmove`:return this._onMultiPan(e);case`multipanend`:return this._onMultiPanEnd(e);case`dblclick`:return this._onDoubleClick(e);case`dblclickdragstart`:return t?!1:this._onDoubleClickDragStart(e);case`dblclickdragmove`:return this._onDoubleClickDrag(e);case`dblclickdragend`:case`dblclickdragcancel`:return this._onDoubleClickDragEnd(e);case`wheel`:return this._onWheel(e);case`keydown`:return this._onKeyDown(e);default:return!1}}get controllerState(){return this._controllerState=this._controllerState||new this.ControllerState({makeViewport:this.makeViewport,...this.props,...this.state}),this._controllerState}getCenter(e){let{x:t,y:n}=this.props,{offsetCenter:r}=e;return[r.x-t,r.y-n]}getZoomPosition(e){if(this.zoomAround===`pointer`)return e;let t=this.makeViewport(this.controllerState.getViewportProps()),[n,r]=Lp(t.center,t.pixelProjectionMatrix);return[n,r]}isPointInBounds(e,t){let{width:n,height:r}=this.props;if(t&&t.handled)return!1;let i=e[0]>=0&&e[0]<=n&&e[1]>=0&&e[1]<=r;return i&&t&&t.stopPropagation(),i}isFunctionKeyPressed(e){let{srcEvent:t}=e;return!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}isDragging(){return this._interactionState.isDragging||!1}blockEvents(e){let t=setTimeout(()=>{this._eventStartBlocked===t&&(this._eventStartBlocked=null)},e);this._eventStartBlocked=t}setProps(e){e.maxBoundsPadding===void 0&&(e.maxBoundsPadding=null),e.dragMode&&(this.dragMode=e.dragMode);let t=this.props;this.props=e,`transitionInterpolator`in e||(e.transitionInterpolator=this._getTransitionProps().transitionInterpolator),this.transitionManager.processViewStateChange(e);let{inertia:n}=e;this.inertia=Number.isFinite(n)?n:n===!0?tb:0;let{scrollZoom:r=!0,dragPan:i=!0,dragRotate:a=!0,doubleClickZoom:o=!0,doubleClickDragZoom:s=!1,touchZoom:c=!0,touchRotate:l=!1,multiTouchDrag:u=l?`rotate`:null,trackpadGesture:d=!1,zoomAround:f=`pointer`,keyboard:p=!0}=e,m=!!this.onViewStateChange;if(this.toggleEvents(ab.WHEEL,m&&r),this.toggleEvents(ab.PAN,m),this.toggleEvents(ab.PINCH,m&&(c||u===`rotate`)),this.toggleEvents(ab.MULTI_PAN,m&&!!u),this.toggleEvents(ab.DOUBLE_CLICK,m&&o),this.toggleEvents(ab.DOUBLE_CLICK_DRAG,m&&s),this.toggleEvents(ab.KEYBOARD,m&&p),this.scrollZoom=r,this.dragPan=i,this.dragRotate=a,this.doubleClickZoom=o,this.doubleClickDragZoom=s,this.touchZoom=c,this.touchRotate=u===`rotate`,this.multiTouchDrag=u,this.trackpadGesture=d,this.zoomAround=f,this.keyboard=p,(!t||t.height!==e.height||t.width!==e.width||t.maxBounds!==e.maxBounds||t.maxBoundsPadding!==e.maxBoundsPadding)&&e.maxBounds){let t=new this.ControllerState({...e,makeViewport:this.makeViewport}),n=t.getViewportProps();Object.keys(n).some(t=>!G(n[t],e[t],1))&&this.updateViewport(t)}}updateTransition(){this.transitionManager.updateTransition()}toggleEvents(e,t){this.eventManager&&e.forEach(e=>{this._events[e]!==t&&(this._events[e]=t,t?this.eventManager.on(e,this.handleEvent):this.eventManager.off(e,this.handleEvent))})}updateViewport(e,t=null,n={}){let r={...e.getViewportProps(),...t},i=this.controllerState!==e;if(this.state=e.getState(),this._setInteractionState(n),i){let e=this.controllerState&&this.controllerState.getViewportProps();this.onViewStateChange&&this.onViewStateChange({viewState:r,interactionState:this._interactionState,oldViewState:e,viewId:this.props.id})}}_onTransition(e){this.onViewStateChange({...e,interactionState:this._interactionState,viewId:this.props.id})}_setInteractionState(e){Object.assign(this._interactionState,e),this.onStateChange(this._interactionState)}_getConstraintContext(e,t){return this.props.rubberBand?{mode:t===`update`?`elastic`:t===`end`?`rebound`:`hard`}:{mode:`hard`}}_getReboundTransition(e,t){if(e.mode!==`rebound`)return null;let n=t.getViewportProps();return Object.keys(n).some(e=>!G(this.props[e],n[e],1))?{...this._getTransitionProps(),transitionDuration:nb,transitionEasing:ib}:null}_onPanStart(e){let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e)||e.rightButton||!1;(this.invertPan||this.dragMode===`pan`)&&(n=!n);let r=n?`pan`:`rotate`,i=this._getConstraintContext(r,`start`),a=n?this.controllerState.panStart({pos:t},i):this.controllerState.rotateStart({pos:t},i);return this._panMove=n,this.updateViewport(a,eb,{isDragging:!0}),!0}_onPan(e){return this.isDragging()?this._panMove?this._onPanMove(e):this._onPanRotate(e):!1}_onPanEnd(e){return this.isDragging()?this._panMove?this._onPanMoveEnd(e):this._onPanRotateEnd(e):!1}_onPanMove(e){if(!this.dragPan)return!1;let t=this.getCenter(e),n=this.controllerState.pan({pos:t},this._getConstraintContext(`pan`,`update`));return this.updateViewport(n,eb,{isDragging:!0,isPanning:!0}),!0}_onPanMoveEnd(e){let{inertia:t}=this;if(this.dragPan&&t&&e.velocity){let n=this.getCenter(e),r=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],i=this.controllerState.pan({pos:r}).panEnd();this.updateViewport(i,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:rb},{isDragging:!1,isPanning:!0})}else{let e=this.controllerState,t=this._getConstraintContext(`pan`,`end`),n=e.panEnd(t),r=this._getReboundTransition(t,n);this.updateViewport(n,r,{isDragging:!1,isPanning:!!r})}return!0}_onPanRotate(e){if(!this.dragRotate)return!1;let t=this.getCenter(e),n=this.controllerState.rotate({pos:t},this._getConstraintContext(`rotate`,`update`));return this.updateViewport(n,eb,{isDragging:!0,isRotating:!0}),!0}_onPanRotateEnd(e){let{inertia:t}=this;if(this.dragRotate&&t&&e.velocity){let n=this.getCenter(e),r=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],i=this.controllerState.rotate({pos:r}).rotateEnd();this.updateViewport(i,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:rb},{isDragging:!1,isRotating:!0})}else{let e=this.controllerState,t=this._getConstraintContext(`rotate`,`end`),n=e.rotateEnd(t),r=this._getReboundTransition(t,n);this.updateViewport(n,r,{isDragging:!1,isRotating:!!r})}return!0}_onWheel(e){if(!this.scrollZoom||this.trackpadGesture&&e.device!==`mouse`)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;e.srcEvent.preventDefault();let{speed:n=.01,smooth:r=!1}=this.scrollZoom===!0?{}:this.scrollZoom,{delta:i}=e,a=2/(1+Math.exp(-Math.abs(i*n)));i<0&&a!==0&&(a=1/a);let o=this.getZoomPosition(t),s=r?{...this._getTransitionProps({around:o}),transitionDuration:250}:eb,c=this.controllerState.zoom({pos:o,scale:a});return this.updateViewport(c,s,{isZooming:!0,isPanning:!0}),r||this._setInteractionState({isZooming:!1,isPanning:!1}),!0}_onMultiPanStart(e){let{multiTouchDrag:t}=this;if(!t||!this._isMultiPanEventAllowed(e,t))return!1;let n=e.offsetCenter;if(!this.isPointInBounds(this.getCenter(e),e))return!1;let r=e.pointerType===`trackpad`,i={x:n.x-(r?0:e.deltaX),y:n.y-(r?0:e.deltaY)},a={...e,offsetCenter:i},o=this.getCenter(a),s=t===`pan`?this.controllerState.panStart({pos:o},this._getConstraintContext(`pan`,`start`)):this.controllerState.rotateStart({pos:o},this._getConstraintContext(`rotate`,`start`));return this._multiPanMode=t,this._multiPanStartCenter=i,this.updateViewport(s,eb,{isDragging:!0}),!0}_onMultiPan(e){let{mode:t,event:n}=this._getMultiPanEvent(e);return!t||!n||!this.isDragging()?!1:t===`pan`?this._onPanMove(n):this._onPanRotate(n)}_onMultiPanEnd(e){let{mode:t,event:n}=this._getMultiPanEvent(e);if(!t||!n||!this.isDragging())return this._resetMultiPan(),!1;let r=t===`pan`?this._onPanMoveEnd(n):this._onPanRotateEnd(n);return this._resetMultiPan(),r}_isTrackpadGestureAllowed(e){return e.pointerType!==`trackpad`||this.trackpadGesture}_isMultiPanEventAllowed(e,t){return e.pointerType===`trackpad`?this.trackpadGesture&&(t===`pan`?this.dragPan:this.dragRotate):e.pointerType===`touch`&&(t===`pan`?this.dragPan:this.dragRotate)}_getMultiPanEvent(e){let t=this._multiPanMode,n=this._multiPanStartCenter;return!t||!n?{mode:null,event:null}:{mode:t,event:{...e,offsetCenter:{x:n.x+e.deltaX,y:n.y+e.deltaY}}}}_resetMultiPan(){this._multiPanMode=null,this._multiPanStartCenter=null}_onPinchStart(e){this._doubleClickDragAnchor=null;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.controllerState.zoomStart({pos:this.getZoomPosition(t)},this._getConstraintContext(`zoom`,`start`)).rotateStart({pos:t},this._getConstraintContext(`rotate`,`start`));return ob._startPinchRotation=e.rotation,ob._lastPinchEvent=e,this.updateViewport(n,eb,{isDragging:!0}),!0}_onPinch(e){if(!this.touchZoom&&!this.touchRotate||!this.isDragging())return!1;let t=this.controllerState;if(this.touchZoom){let{scale:n}=e,r=this.getCenter(e);t=t.zoom({pos:this.getZoomPosition(r),scale:n},this._getConstraintContext(`zoom`,`update`))}if(this.touchRotate){let{rotation:n}=e;t=t.rotate({deltaAngleX:ob._startPinchRotation-n},this._getConstraintContext(`rotate`,`update`))}return this.updateViewport(t,eb,{isDragging:!0,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:this.touchRotate}),ob._lastPinchEvent=e,!0}_onPinchEnd(e){if(!this.isDragging())return!1;let{inertia:t}=this,{_lastPinchEvent:n}=ob;if(this.touchZoom&&t&&n&&e.scale!==n.scale){let r=this.getCenter(e),i=this.getZoomPosition(r),a=this.controllerState.rotateEnd(),o=Math.log2(e.scale),s=2**(o+(o-Math.log2(n.scale))/(e.deltaTime-n.deltaTime)*t/2);a=a.zoom({pos:i,scale:s}).zoomEnd(),this.updateViewport(a,{...this._getTransitionProps({around:i}),transitionDuration:t,transitionEasing:rb},{isDragging:!1,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:!1}),this.blockEvents(t)}else{let e=this.controllerState,t=this._getConstraintContext(`zoom`,`end`),n=this._getConstraintContext(`rotate`,`end`),r=e.zoomEnd(t).rotateEnd(n),i=this._getReboundTransition(this.touchZoom?t:n,r);this.updateViewport(r,i,{isDragging:!1,isPanning:!!i&&this.touchZoom,isZooming:!!i&&this.touchZoom,isRotating:!!i&&this.touchRotate})}return ob._startPinchRotation=null,ob._lastPinchEvent=null,!0}_onDoubleClick(e){if(!this.doubleClickZoom||Date.now()<this._suppressDoubleClickUntil)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e),r=this.getZoomPosition(t),i=this.controllerState.zoom({pos:r,scale:n?.5:2});return this.updateViewport(i,this._getTransitionProps({around:r}),{isZooming:!0,isPanning:!0}),this.blockEvents(100),!0}_onDoubleClickDragStart(e){if(!this.doubleClickDragZoom)return this._doubleClickDragAnchor=null,!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return this._doubleClickDragAnchor=null,!1;this._doubleClickDragAnchor=this.getZoomPosition(t);let n=this.controllerState.zoomStart({pos:this._doubleClickDragAnchor},this._getConstraintContext(`zoom`,`start`));return e.scale!==1&&(n=n.zoom({pos:this._doubleClickDragAnchor,scale:e.scale},this._getConstraintContext(`zoom`,`update`))),this.updateViewport(n,eb,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDrag(e){let t=this._doubleClickDragAnchor;if(!t)return!1;let n=this.controllerState.zoom({pos:t,scale:e.scale},this._getConstraintContext(`zoom`,`update`));return this.updateViewport(n,eb,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDragEnd(e){if(!this._doubleClickDragAnchor)return!1;this._doubleClickDragAnchor=null;let t=this.controllerState,n=this._getConstraintContext(`zoom`,`end`),r=t.zoomEnd(n),i=this._getReboundTransition(n,r);return this.updateViewport(r,i,{isDragging:!1,isPanning:!!i,isZooming:!!i}),this._suppressDoubleClickUntil=Date.now()+100,this.blockEvents(100),!0}_onKeyDown(e){if(!this.keyboard)return!1;let t=this.isFunctionKeyPressed(e),{zoomSpeed:n,moveSpeed:r,rotateSpeedX:i,rotateSpeedY:a}=this.keyboard===!0?{}:this.keyboard,{controllerState:o}=this,s,c={};switch(e.srcEvent.code){case`Minus`:s=t?o.zoomOut(n).zoomOut(n):o.zoomOut(n),c.isZooming=!0;break;case`Equal`:s=t?o.zoomIn(n).zoomIn(n):o.zoomIn(n),c.isZooming=!0;break;case`ArrowLeft`:t?(s=o.rotateLeft(i),c.isRotating=!0):(s=o.moveLeft(r),c.isPanning=!0);break;case`ArrowRight`:t?(s=o.rotateRight(i),c.isRotating=!0):(s=o.moveRight(r),c.isPanning=!0);break;case`ArrowUp`:t?(s=o.rotateUp(a),c.isRotating=!0):(s=o.moveUp(r),c.isPanning=!0);break;case`ArrowDown`:t?(s=o.rotateDown(a),c.isRotating=!0):(s=o.moveDown(r),c.isPanning=!0);break;default:return!1}return this.updateViewport(s,this._getTransitionProps(),c),!0}_getTransitionProps(e){let{transition:t}=this;return!t||!t.transitionInterpolator?eb:e?{...t,transitionInterpolator:new $y({...e,...t.transitionInterpolator.opts,makeViewport:this.controllerState.makeViewport})}:t}},cb=Symbol(`constraintAround`),lb=class{constructor(e,t,n,r){this.makeViewport=n,this._viewportProps=this.applyConstraints(e,r),this._state=t}getViewportProps(){return this._viewportProps}getState(){return this._state}};function ub(e,t,n){let r=e-t;return r&&Number.isFinite(r)?t+r*n/(n+Math.abs(r)):t}function db(e,t,n){let r=Ny(jy(n?.left??0),e),i=Ny(jy(n?.right??0),e),a=Ny(jy(n?.top??0),t),o=Ny(jy(n?.bottom??0),t);return{x:r,y:a,width:e-r-i,height:t-a-o}}function fb(e,t,n){let[r,i]=e.project(t);return r=Number.isFinite(r)?r:e.width/2,i=Number.isFinite(i)?i:e.height/2,{left:r-n.x,right:n.x+n.width-r,top:i-n.y,bottom:n.y+n.height-i}}var pb=5,mb=1.2,hb=512,gb=[[-1/0,-90],[1/0,90]],_b=1;function vb([e,t]){if(Math.abs(t)>90&&(t=Math.sign(t)*90),Number.isFinite(e)){let[n,r]=Dp([e,t]);return[n,Ml(r,0,hb)]}let[,n]=Dp([0,t]);return[e,Ml(n,0,hb)]}var yb=class extends lb{constructor(e){let{width:t,height:n,latitude:r,longitude:i,zoom:a,bearing:o=0,pitch:s=0,altitude:c=1.5,position:l=[0,0,0],maxZoom:u=20,minZoom:d=0,maxPitch:f=60,minPitch:p=0,startPanLngLat:m,startZoomLngLat:h,startRotatePos:g,startRotateLngLat:_,startBearing:v,startPitch:y,startZoom:b,normalize:x=!0,rubberBand:S=!1}=e,{[cb]:C}=e;K(Number.isFinite(i)),K(Number.isFinite(r)),K(Number.isFinite(a));let w=e.maxBounds||(x?gb:null),T=e.maxBoundsPadding||null;super({width:t,height:n,latitude:r,longitude:i,zoom:a,bearing:o,pitch:s,altitude:c,maxZoom:u,minZoom:d,maxPitch:f,minPitch:p,normalize:x,position:l,maxBounds:w,maxBoundsPadding:T,rubberBand:S,[cb]:C},{startPanLngLat:m,startZoomLngLat:h,startRotatePos:g,startRotateLngLat:_,startBearing:v,startPitch:y,startZoom:b},e.makeViewport,e.constraintContext),this.getAltitude=e.getAltitude}panStart({pos:e},t){return this._getUpdatedState({startPanLngLat:this._unproject(e)},t)}pan({pos:e,startPos:t},n){let r=this.getState().startPanLngLat||this._unproject(t);if(!r)return this;let i=this.makeViewport(this.getViewportProps()).panByPosition(r,e);return this._getUpdatedState(i,n)}panEnd(e){return this._getUpdatedState({startPanLngLat:null},e)}rotateStart({pos:e}){let t=this.getAltitude?.(e);return this._getUpdatedState({startRotatePos:e,startRotateLngLat:t===void 0?void 0:this._unproject3D(e,t),startBearing:this.getViewportProps().bearing,startPitch:this.getViewportProps().pitch})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:n=0}){let{startRotatePos:r,startRotateLngLat:i,startBearing:a,startPitch:o}=this.getState();if(!r||a===void 0||o===void 0)return this;let s;if(s=e?this._getNewRotation(e,r,o,a):{bearing:a+t,pitch:o+n},i){let e=this.makeViewport({...this.getViewportProps(),...s}),t=`panByPosition3D`in e?`panByPosition3D`:`panByPosition`;return this._getUpdatedState({...s,...e[t](i,r)})}return this._getUpdatedState(s)}rotateEnd(){return this._getUpdatedState({startRotatePos:null,startRotateLngLat:null,startBearing:null,startPitch:null})}zoomStart({pos:e},t){return this._getUpdatedState({startZoomLngLat:this._unproject(e),startZoom:this.getViewportProps().zoom},t)}zoom({pos:e,startPos:t,scale:n},r){let{startZoom:i,startZoomLngLat:a}=this.getState();return a||=(i=this.getViewportProps().zoom,this._unproject(t)||this._unproject(e)),a?this._getUpdatedState({zoom:i+Math.log2(n),[cb]:{position:a,screenPosition:e}},r):this}zoomEnd(e){return this._getUpdatedState({startZoomLngLat:null,startZoom:null},e)}zoomIn(e=2,t){return this._zoomFromCenter(e,t)}zoomOut(e=2,t){return this._zoomFromCenter(1/e,t)}moveLeft(e=100,t){return this._panFromCenter([e,0],t)}moveRight(e=100,t){return this._panFromCenter([-e,0],t)}moveUp(e=100,t){return this._panFromCenter([0,e],t)}moveDown(e=100,t){return this._panFromCenter([0,-e],t)}rotateLeft(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing-e})}rotateRight(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing+e})}rotateUp(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch+e})}rotateDown(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch-e})}shortestPathFrom(e){let t=e.getViewportProps(),n={...this.getViewportProps()},{bearing:r,longitude:i}=n;return Math.abs(r-t.bearing)>180&&(n.bearing=r<0?r+360:r-360),Math.abs(i-t.longitude)>180&&(n.longitude=i<0?i+360:i-360),n}applyConstraints(e,t){let n=e,r=n[cb];delete n[cb];let{maxPitch:i,minPitch:a,pitch:o,bearing:s,normalize:c,maxBounds:l,rubberBand:u}=e;c&&(s<-180||s>180)&&(e.bearing=Im(s+180,360)-180),e.pitch=Ml(o,a,i);let d=this._constrainZoom(e.zoom,e),f=u&&t?.mode===`elastic`;if(e.zoom=t?.mode===`preserve`?e.zoom:f?ub(e.zoom,d,_b):d,r){let t=this.makeViewport(e);Object.assign(e,t.panByPosition(r.position,r.screenPosition))}if(c&&(e.longitude<-180||e.longitude>180)&&(e.longitude=Im(e.longitude+180,360)-180),l){let n=db(e.width,e.height,e.maxBoundsPadding),r=fb(this.makeViewport({...e,bearing:0,pitch:0}),[e.longitude,e.latitude],n),i=vb(l[0]),a=vb(l[1]),o=2**e.zoom,s=[i[0]+r.left/o,i[1]+r.bottom/o],c=[a[0]-r.right/o,a[1]-r.top/o],u=vb([e.longitude,e.latitude]),d=[Ml(u[0],s[0],c[0]),Ml(u[1],s[1],c[1])],p=u.slice();if(n.width>=0&&(p[0]=t?.mode===`preserve`?u[0]:f?ub(u[0],d[0],n.width/2/o):d[0]),n.height>=0&&(p[1]=t?.mode===`preserve`?u[1]:f?ub(u[1],d[1],n.height/2/o):d[1]),p[0]!==u[0]||p[1]!==u[1]){let[t,n]=Op(p);p[0]!==u[0]&&(e.longitude=t),p[1]!==u[1]&&(e.latitude=n)}}return e}_constrainZoom(e,t){t||=this.getViewportProps();let{maxZoom:n,maxBounds:r}=t,i=r!==null&&t.width>0&&t.height>0,{minZoom:a}=t;if(i){let e=db(t.width,t.height,t.maxBoundsPadding),i=vb(r[0]),o=vb(r[1]),s=o[0]-i[0],c=o[1]-i[1];e.width>0&&Number.isFinite(s)&&s>0&&(a=Math.max(a,Math.log2(e.width/s))),e.height>0&&Number.isFinite(c)&&c>0&&(a=Math.max(a,Math.log2(e.height/c))),a>n&&(a=n)}return Ml(e,a,n)}_zoomFromCenter(e,t){let{width:n,height:r}=this.getViewportProps();return this.zoom({pos:[n/2,r/2],scale:e},t)}_panFromCenter(e,t){let{width:n,height:r}=this.getViewportProps();return this.pan({startPos:[n/2,r/2],pos:[n/2+e[0],r/2+e[1]]},t)}_getUpdatedState(e,t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e,constraintContext:t})}_unproject(e){let t=this.makeViewport(this.getViewportProps());return e&&t.unproject(e)}_unproject3D(e,t){return this.makeViewport(this.getViewportProps()).unproject(e,{targetZ:t})}_getNewRotation(e,t,n,r){let i=e[0]-t[0],a=e[1]-t[1],o=e[1],s=t[1],{width:c,height:l}=this.getViewportProps(),u=i/c,d=0;a>0?Math.abs(l-s)>pb&&(d=a/(s-l)*mb):a<0&&s>pb&&(d=1-o/s),d=Ml(d,-1,1);let{minPitch:f,maxPitch:p}=this.getViewportProps(),m=r+180*u,h=n;return d>0?h=n+d*(p-n):d<0&&(h=n-d*(f-n)),{pitch:h,bearing:m}}},bb=class extends sb{constructor(){super(...arguments),this.ControllerState=yb,this.transition={transitionDuration:300,transitionInterpolator:new $y({transitionProps:{compare:[`longitude`,`latitude`,`zoom`,`bearing`,`pitch`,`position`],required:[`longitude`,`latitude`,`zoom`]}})},this.dragMode=`pan`,this.rotationPivot=`center`,this._getAltitude=e=>{if(this.rotationPivot===`2d`)return 0;if(this.rotationPivot===`3d`&&this.pickPosition){let{x:t,y:n}=this.props,r=this.pickPosition(t+e[0],n+e[1]);if(r&&r.coordinate&&r.coordinate.length>=3)return r.coordinate[2]}}}setProps(e){`rotationPivot`in e&&(this.rotationPivot=e.rotationPivot||`center`),e.getAltitude=this._getAltitude,e.position=e.position||[0,0,0],e.maxBounds=e.maxBounds||(e.normalize===!1?null:gb),super.setProps(e)}updateViewport(e,t=null,n={}){let r=e.getState();n.isDragging&&r.startRotateLngLat?n={...n,rotationPivotPosition:r.startRotateLngLat}:n.isDragging===!1&&(n={...n,rotationPivotPosition:void 0}),super.updateViewport(e,t,n)}},xb=class extends Vy{constructor(e={}){super(e)}getViewportType(){return Zm}get ControllerType(){return bb}};xb.displayName=`MapView`;var Sb=new Nm;function Cb(e,t){return(e.order??1/0)-(t.order??1/0)}var wb=class{constructor(e){this._resolvedEffects=[],this._defaultEffects=[],this.effects=[],this._context=e,this._needsRedraw=`Initial render`,this._setEffects([])}addDefaultEffect(e){let t=this._defaultEffects;if(!t.find(t=>t.id===e.id)){let n=t.findIndex(t=>Cb(t,e)>0);n<0?t.push(e):t.splice(n,0,e),e.setup(this._context),this._setEffects(this.effects)}}setProps(e){`effects`in e&&(G(e.effects,this.effects,1)||this._setEffects(e.effects))}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}getEffects(){return this._resolvedEffects}_setEffects(e){let t={};for(let e of this.effects)t[e.id]=e;let n=[];for(let r of e){let e=t[r.id],i=r;e&&e!==r?e.setProps?(e.setProps(r.props),i=e):e.cleanup(this._context):e||r.setup(this._context),n.push(i),delete t[r.id]}for(let e in t)t[e].cleanup(this._context);this.effects=n,this._resolvedEffects=n.concat(this._defaultEffects),e.some(e=>e instanceof Nm)||this._resolvedEffects.push(Sb),this._needsRedraw=`effects changed`}finalize(){for(let e of this._resolvedEffects)e.cleanup(this._context);this.effects.length=0,this._resolvedEffects.length=0,this._defaultEffects.length=0}},Tb=class extends Tm{shouldDrawLayer(e){let{operation:t}=e.props;return t.includes(`draw`)||t.includes(`terrain`)}render(e){return this._render(e)}},Eb=`deckRenderer.renderLayers`,Db=class{constructor(e,t={}){this.device=e,this.stats=t.stats,this.layerFilter=null,this.drawPickingColors=!1,this.drawLayersPass=new Tb(e),this.pickLayersPass=new uy(e),this.renderCount=0,this._needsRedraw=`Initial render`,this.renderBuffers=[],this.lastPostProcessEffect=null}setProps(e){this.layerFilter!==e.layerFilter&&(this.layerFilter=e.layerFilter,this._needsRedraw=`layerFilter changed`),this.drawPickingColors!==e.drawPickingColors&&(this.drawPickingColors=e.drawPickingColors,this._needsRedraw=`drawPickingColors changed`)}renderLayers(e){let t=this.drawPickingColors?this.pickLayersPass:this.drawLayersPass,n={layerFilter:this.layerFilter,isPicking:this.drawPickingColors,...e};if(!e.viewports.length){let e=t.render(n),r=`stats`in e?e.stats:e;this._updateStats(r);return}n.effects&&this._preRender(n.effects,n);let r=this.lastPostProcessEffect?this.renderBuffers[0]:n.target;this.lastPostProcessEffect&&(n.clearColor=[0,0,0,0],n.clearCanvas=!0);let i=t.render({...n,target:r}),a=`stats`in i?i.stats:i;n.effects&&(this.lastPostProcessEffect&&(n.clearCanvas=e.clearCanvas===void 0?!0:e.clearCanvas),this._postRender(n.effects,n)),this.renderCount++,P(Eb,this,a,e),this._updateStats(a)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}finalize(){let{renderBuffers:e}=this;for(let t of e)t.delete();e.length=0}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get(`Layers rendered`).addCount(t)}_preRender(e,t){this.lastPostProcessEffect=null,t.preRenderStats=t.preRenderStats||{};for(let n of e)t.preRenderStats[n.id]=n.preRender(t),n.postRender&&(this.lastPostProcessEffect=n.id);this.lastPostProcessEffect&&this._resizeRenderBuffers(t.canvasContext)}_resizeRenderBuffers(e=this.device.canvasContext){let{renderBuffers:t}=this,n=e.getDrawingBufferSize(),[r,i]=n;t.length===0&&[0,1].map(e=>{let n=this.device.createTexture({sampler:{minFilter:`linear`,magFilter:`linear`},width:r,height:i});t.push(this.device.createFramebuffer({id:`deck-renderbuffer-${e}`,depthStencilAttachment:e===0?`depth24plus`:void 0,colorAttachments:[n]}))});for(let e of t)e.resize(n)}_postRender(e,t){let{renderBuffers:n}=this,r=t.target??t.canvasContext?.getCurrentFramebuffer()??t.target,i={...t,inputBuffer:n[0],swapBuffer:n[1]};for(let t of e)if(t.postRender){i.target=t.id===this.lastPostProcessEffect?r:void 0;let e=t.postRender(i);i.inputBuffer=e,i.swapBuffer=e===n[0]?n[1]:n[0]}}},Ob={pickedColor:null,pickedObjectIndex:-1};function kb({pickedColors:e,decodePickingColor:t,deviceX:n,deviceY:r,deviceRadius:i,deviceRect:a}){let{x:o,y:s,width:c,height:l}=a,u=i*i,d=-1,f=0;for(let t=0;t<l;t++){let i=t+s-r,a=i*i;if(a>u)f+=4*c;else for(let t=0;t<c;t++){if(e[f+3]-1>=0){let e=t+o-n,r=e*e+a;r<=u&&(u=r,d=f)}f+=4}}if(d>=0){let n=e.slice(d,d+4),r=t(n);if(r){let e=Math.floor(d/4/c),t=d/4-e*c;return{...r,pickedColor:n,pickedX:o+t,pickedY:s+e}}N.error(`Picked non-existent layer. Is picking buffer corrupt?`)()}return Ob}function Ab({pickedColors:e,decodePickingColor:t}){let n=new Map;if(e){for(let r=0;r<e.length;r+=4)if(e[r+3]-1>=0){let i=e.slice(r,r+4),a=i.join(`,`);if(!n.has(a)){let e=t(i);e?n.set(a,{...e,color:i}):N.error(`Picked non-existent layer. Is picking buffer corrupt?`)()}}}return Array.from(n.values())}function jb({pickInfo:e,viewports:t,pixelRatio:n,x:r,y:i,z:a}){let o=t[0];t.length>1&&(o=Pb(e?.pickedViewports||t,{x:r,y:i}));let s;if(o){let e=[r-o.x,i-o.y];a!==void 0&&(e[2]=a),s=o.unproject(e)}return{color:null,layer:null,viewport:o,index:-1,picked:!1,x:r,y:i,pixel:[r,i],coordinate:s,devicePixel:e&&`pickedX`in e?[e.pickedX,e.pickedY]:void 0,pixelRatio:n}}function Mb(e){let{pickInfo:t,lastPickedInfo:n,mode:r,layers:i}=e,{pickedColor:a,pickedLayer:o,pickedObjectIndex:s}=t,c=o?[o]:[];if(r===`hover`){let e=n.index,t=n.layerId,r=o?o.props.id:null;if(r!==t||s!==e){if(r!==t){let e=i.find(e=>e.props.id===t);e&&c.unshift(e)}n.layerId=r,n.index=s,n.info=null}}let l=jb(e),u=new Map;return u.set(null,l),c.forEach(e=>{let t={...l};e===o&&(t.color=a,t.index=s,t.picked=!0),t=Nb({layer:e,info:t,mode:r});let i=t.layer;e===o&&r===`hover`&&(n.info=t),u.set(i.id,t),r===`hover`&&i.updateAutoHighlight(t)}),u}function Nb({layer:e,info:t,mode:n}){for(;e&&t;){let r=t.layer||null;t.sourceLayer=r,t.layer=e,t=e.getPickingInfo({info:t,mode:n,sourceLayer:r}),e=e.parent}return t}function Pb(e,t){for(let n=e.length-1;n>=0;n--){let r=e[n];if(r.containsPixel(t))return r}return e[0]}var Fb=class{constructor(e,t={}){this._pickable=!0,this.device=e,this.stats=t.stats,this.pickLayersPass=new uy(e),this.lastPickedInfo={index:-1,layerId:null,info:null}}setProps(e){`layerFilter`in e&&(this.layerFilter=e.layerFilter),`_pickable`in e&&(this._pickable=e._pickable)}finalize(){this.pickingFBO&&this.pickingFBO.destroy(),this.depthFBO&&this.depthFBO.destroy()}pickObjectAsync(e){return this._pickClosestObjectAsync(e)}pickObjectsAsync(e){return this._pickVisibleObjectsAsync(e)}pickObject(e){return this._pickClosestObject(e)}pickObjects(e){return this._pickVisibleObjects(e)}getLastPickedObject({x:e,y:t,layers:n,viewports:r},i=this.lastPickedInfo.info){let a=i&&i.layer&&i.layer.id,o=i&&i.viewport&&i.viewport.id,s=a?n.find(e=>e.id===a):null,c=o&&r.find(e=>e.id===o)||r[0],l={x:e,y:t,viewport:c,coordinate:c&&c.unproject([e-c.x,t-c.y]),layer:s};return{...i,...l}}_resizeBuffer(e=this.device.getDefaultCanvasContext()){if(!this.pickingFBO){let e=this.device.createTexture({format:`rgba8unorm`,width:1,height:1,usage:j.RENDER_ATTACHMENT|j.COPY_SRC});if(this.pickingFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:`depth16unorm`}),this.device.isTextureFormatRenderable(`rgba32float`)){let e=this.device.createTexture({format:`rgba32float`,width:1,height:1,usage:j.RENDER_ATTACHMENT|j.COPY_SRC});this.depthFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:`depth16unorm`})}}let[t,n]=e.getDrawingBufferSize();this.pickingFBO?.resize({width:t,height:n}),this.depthFBO?.resize({width:t,height:n})}_getPickable(e){if(this._pickable===!1)return null;let t=e.filter(e=>this.pickLayersPass.shouldDrawLayer(e)&&!e.isComposite);return t.length?t:null}async _pickClosestObjectAsync({layers:e,views:t,viewports:n,x:r,y:i,radius:a=0,depth:o=1,mode:s=`query`,unproject3D:c,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=l.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0){let t=Mb({pickInfo:{pickedColor:null,pickedObjectIndex:-1},lastPickedInfo:this.lastPickedInfo,mode:s,layers:e,viewports:n,x:r,y:i,pixelRatio:f});return{result:Array.from(t.values()).filter(e=>e.layer),emptyInfo:jb({viewports:n,x:r,y:i,pixelRatio:f})}}this._resizeBuffer(l);let m=l.cssToDevicePixels([r,i],!0),h=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],g=Math.round(a*f),{width:_,height:v}=this.pickingFBO,y=this._getPickingRect({deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceWidth:_,deviceHeight:v}),b={x:r-a,y:i-a,width:a*2+1,height:a*2+1},x,S=[],C=new Set;for(let e=0;e<o;e++){let a;a=y?kb({...await this._drawAndSampleAsync({layers:p,views:t,viewports:n,onViewportActive:u,deviceRect:y,cullRect:b,effects:d,pass:`picking:${s}`,canvasContext:l}),deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceRect:y}):{pickedColor:null,pickedObjectIndex:-1};let m,_=this._getDepthLayers(a,p,c);if(_.length>0){let{pickedColors:e}=await this._drawAndSampleAsync({layers:_,views:t,viewports:n,onViewportActive:u,deviceRect:{x:a.pickedX??h[0],y:a.pickedY??h[1],width:1,height:1},cullRect:b,effects:d,pass:`picking:${s}:z`,canvasContext:l},!0);e[3]&&(m=e[0])}a.pickedLayer&&e+1<o&&(C.add(a.pickedLayer),a.pickedLayer.disablePickingIndex(a.pickedObjectIndex)),x=Mb({pickInfo:a,lastPickedInfo:this.lastPickedInfo,mode:s,layers:p,viewports:n,x:r,y:i,z:m,pixelRatio:f});for(let e of x.values())e.layer&&S.push(e);if(!a.pickedColor)break}for(let e of C)e.restorePickingColors();return{result:S,emptyInfo:x.get(null)}}_pickClosestObject({layers:e,views:t,viewports:n,x:r,y:i,radius:a=0,depth:o=1,mode:s=`query`,unproject3D:c,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=l.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0){let t=Mb({pickInfo:{pickedColor:null,pickedObjectIndex:-1},lastPickedInfo:this.lastPickedInfo,mode:s,layers:e,viewports:n,x:r,y:i,pixelRatio:f});return{result:Array.from(t.values()).filter(e=>e.layer),emptyInfo:jb({viewports:n,x:r,y:i,pixelRatio:f})}}this._resizeBuffer(l);let m=l.cssToDevicePixels([r,i],!0),h=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],g=Math.round(a*f),{width:_,height:v}=this.pickingFBO,y=this._getPickingRect({deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceWidth:_,deviceHeight:v}),b={x:r-a,y:i-a,width:a*2+1,height:a*2+1},x,S=[],C=new Set;for(let e=0;e<o;e++){let a;a=y?kb({...this._drawAndSample({layers:p,views:t,viewports:n,onViewportActive:u,deviceRect:y,cullRect:b,effects:d,pass:`picking:${s}`,canvasContext:l}),deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceRect:y}):{pickedColor:null,pickedObjectIndex:-1};let m,_=this._getDepthLayers(a,p,c);if(_.length>0){let{pickedColors:e}=this._drawAndSample({layers:_,views:t,viewports:n,onViewportActive:u,deviceRect:{x:a.pickedX??h[0],y:a.pickedY??h[1],width:1,height:1},cullRect:b,effects:d,pass:`picking:${s}:z`,canvasContext:l},!0);e[3]&&(m=e[0])}a.pickedLayer&&e+1<o&&(C.add(a.pickedLayer),a.pickedLayer.disablePickingIndex(a.pickedObjectIndex)),x=Mb({pickInfo:a,lastPickedInfo:this.lastPickedInfo,mode:s,layers:p,viewports:n,x:r,y:i,z:m,pixelRatio:f});for(let e of x.values())e.layer&&S.push(e);if(!a.pickedColor)break}for(let e of C)e.restorePickingColors();return{result:S,emptyInfo:x.get(null)}}async _pickVisibleObjectsAsync({layers:e,views:t,viewports:n,x:r,y:i,width:a=1,height:o=1,mode:s=`query`,maxObjects:c=null,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=this._getPickable(e);if(!f||n.length===0)return[];this._resizeBuffer(l);let p=l.cssToDeviceRatio(),m=l.cssToDevicePixels([r,i],!0),h=m.x,g=m.y+m.height,_=l.cssToDevicePixels([r+a,i+o],!0),v=_.x+_.width,y=_.y,b={x:h,y,width:v-h,height:g-y},x=Ab(await this._drawAndSampleAsync({layers:f,views:t,viewports:n,onViewportActive:u,deviceRect:b,cullRect:{x:r,y:i,width:a,height:o},effects:d,pass:`picking:${s}`,canvasContext:l})),S=new Map,C=[],w=Number.isFinite(c);for(let e=0;e<x.length&&!(w&&C.length>=c);e++){let t=x[e],n={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:i,pixelRatio:p};n=Nb({layer:t.pickedLayer,info:n,mode:s});let a=n.layer.id;S.has(a)||S.set(a,new Set);let o=S.get(a),c=n.object??n.index;o.has(c)||(o.add(c),C.push(n))}return C}_pickVisibleObjects({layers:e,views:t,viewports:n,x:r,y:i,width:a=1,height:o=1,mode:s=`query`,maxObjects:c=null,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=this._getPickable(e);if(!f||n.length===0)return[];this._resizeBuffer(l);let p=l.cssToDeviceRatio(),m=l.cssToDevicePixels([r,i],!0),h=m.x,g=m.y+m.height,_=l.cssToDevicePixels([r+a,i+o],!0),v=_.x+_.width,y=_.y,b={x:h,y,width:v-h,height:g-y},x=Ab(this._drawAndSample({layers:f,views:t,viewports:n,onViewportActive:u,deviceRect:b,cullRect:{x:r,y:i,width:a,height:o},effects:d,pass:`picking:${s}`,canvasContext:l})),S=new Map,C=[],w=Number.isFinite(c);for(let e=0;e<x.length&&!(w&&C.length>=c);e++){let t=x[e],n={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:i,pixelRatio:p};n=Nb({layer:t.pickedLayer,info:n,mode:s});let a=n.layer.id;S.has(a)||S.set(a,new Set);let o=S.get(a),c=n.object??n.index;o.has(c)||(o.add(c),C.push(n))}return C}async _drawAndSampleAsync({layers:e,views:t,viewports:n,onViewportActive:r,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c},l=!1){let u=l?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:r,pickingFBO:u,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c,pickZ:l,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(d.preRenderStats[e.id]=e.preRender(d));let{decodePickingColor:f,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:h,width:g,height:_}=i,v=u.colorAttachments[0]?.texture;if(!v)throw Error(`Picking framebuffer color attachment is missing`);let y=await this._readTextureDataAsync(v,{x:m,y:h,width:g,height:_},l?Float32Array:Uint8Array);if(!l){let e=!1;for(let t=3;t<y.length;t+=4)if(y[t]!==0){e=!0;break}!e&&y.length>0&&N.warn(`Async pick readback returned only zero alpha values`,{deviceRect:i,bytes:Array.from(y.subarray(0,Math.min(y.length,16)))})()}return{pickedColors:y,decodePickingColor:f}}async _readTextureDataAsync(e,t,r){let{width:i,height:a}=t,o=e.computeMemoryLayout(t),s=this.device.createBuffer({byteLength:o.byteLength,usage:n.COPY_DST|n.MAP_READ});try{let n=this.device.type===`webgpu`?{...t,y:e.height-t.y-a}:t;e.readBuffer(n,s);let c=await s.readAsync(0,o.byteLength),l=r.BYTES_PER_ELEMENT;if(o.bytesPerRow%l!==0)throw Error(`Texture readback row stride ${o.bytesPerRow} is not aligned to ${l}-byte elements.`);let u=new r(c.buffer,c.byteOffset,o.byteLength/l),d=i*4,f=o.bytesPerRow/l;if(f<d)throw Error(`Texture readback row stride ${f} is smaller than packed row length ${d}.`);let p=new r(i*a*4);for(let e=0;e<a;e++){let t=(this.device.type===`webgpu`?a-e-1:e)*f;p.set(u.subarray(t,t+d),e*d)}return p}finally{s.destroy()}}_drawAndSample({layers:e,views:t,viewports:n,onViewportActive:r,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c},l=!1){let u=l?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:r,pickingFBO:u,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c,pickZ:l,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(d.preRenderStats[e.id]=e.preRender(d));let{decodePickingColor:f,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:h,width:g,height:_}=i,v=new(l?Float32Array:Uint8Array)(g*_*4);return this.device.readPixelsToArrayWebGL(u,{sourceX:m,sourceY:h,sourceWidth:g,sourceHeight:_,target:v}),{pickedColors:v,decodePickingColor:f}}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get(`Layers picked`).addCount(t)}_getDepthLayers(e,t,n){if(!n||!this.depthFBO)return[];let{pickedLayer:r}=e,i=r?.state?.terrainDrawMode===`drape`;return r&&!i?[r]:t.filter(e=>e.props.operation.includes(`terrain`))}_getPickingRect({deviceX:e,deviceY:t,deviceRadius:n,deviceWidth:r,deviceHeight:i}){let a=Math.max(0,e-n),o=Math.max(0,t-n),s=Math.min(r,e+n+1)-a,c=Math.min(i,t+n+1)-o;return s<=0||c<=0?null:{x:a,y:o,width:s,height:c}}},Ib={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},Lb=`top-left`,Rb=`root`,zb=class{constructor({deck:e,parentElement:t}){this.defaultWidgets=[],this.widgets=[],this.resolvedWidgets=[],this.containers={},this.lastViewports={},this.deck=e,t?.classList.add(`deck-widget-container`),this.parentElement=t}getWidgets(){return this.resolvedWidgets}setProps(e){if(e.widgets&&!G(e.widgets,this.widgets,1)){let t=e.widgets.filter(Boolean);this._setWidgets(t)}}finalize(){for(let e of this.getWidgets())this._removeWidget(e);this.defaultWidgets.length=0,this.resolvedWidgets.length=0;for(let e in this.containers)this.containers[e].remove()}addDefault(e){this.defaultWidgets.find(t=>t.id===e.id)||(this._addWidget(e),this.defaultWidgets.push(e),this._setWidgets(this.widgets))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getWidgets()){let{viewId:i}=r;if(i){let e=n[i];e&&(r.onViewportChange&&r.onViewportChange(e),r.onRedraw?.({viewports:[e],layers:t}))}else{if(r.onViewportChange)for(let t of e)r.onViewportChange(t);r.onRedraw?.({viewports:e,layers:t})}}this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getWidgets()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}getCanvasBounds(e){let t=(this.deck?.getCanvas?.())?.getBoundingClientRect(),n=this.parentElement?.getBoundingClientRect(),r=this.deck?.getCanvasContext?.(e?.id);if(r&&n){r.updatePosition();let[e,t]=r.getPosition(),[i,a]=r.getCSSSize();return{x:e-n.left,y:t-n.top,width:i,height:a}}return{x:t&&n?t.left-n.left:0,y:t&&n?t.top-n.top:0,width:t?.width||this.deck?.width||0,height:t?.height||this.deck?.height||0}}onEvent(e,t){let n=Mf[t.type];if(n)for(let r of this.getWidgets()){let{viewId:i}=r;(!i||i===e.viewport?.id)&&r[n]?.(e,t)}}_setWidgets(e){let t={};for(let e of this.resolvedWidgets)t[e.id]=e;this.resolvedWidgets.length=0;for(let e of this.defaultWidgets)t[e.id]=null,this.resolvedWidgets.push(e);for(let n of e){let e=t[n.id];e?e.viewId!==n.viewId||e.placement!==n.placement?(this._removeWidget(e),this._addWidget(n)):n!==e&&(e.setProps(n.props),n=e):this._addWidget(n),t[n.id]=null,this.resolvedWidgets.push(n)}for(let e in t){let n=t[e];n&&this._removeWidget(n)}this.widgets=e}_addWidget(e){let{viewId:t=null,placement:n=Lb}=e,r=e.props._container??t;e.widgetManager=this,e.deck=this.deck,e.rootElement=e._onAdd({deck:this.deck,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeWidget(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.widgetManager=void 0}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=e||Rb,r=this.containers[n];r||(r=document.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,this.parentElement?.append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=globalThis.document.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,Ib[t]),r.append(i)),i}_updateContainers(){for(let e in this.containers){let t=this.lastViewports[e]||null,n=e===Rb||t,r=this.containers[e];if(n){let e=this._getContainerBounds(t);r.style.display=`block`,r.style.left=`${e.x}px`,r.style.top=`${e.y}px`,r.style.width=`${e.width}px`,r.style.height=`${e.height}px`}else r.style.display=`none`}}_getContainerBounds(e){if(!e)return{x:0,y:0,width:this.parentElement?.clientWidth||this.deck.width,height:this.parentElement?.clientHeight||this.deck.height};let t=this.getCanvasBounds(e);return{x:t.x+e.x,y:t.y+e.y,width:e.width,height:e.height}}};function Bb(e,t){t&&Object.entries(t).map(([t,n])=>{t.startsWith(`--`)?e.style.setProperty(t,n):e.style[t]=n})}function Vb(e,t){t&&Object.keys(t).map(t=>{t.startsWith(`--`)?e.style.removeProperty(t):e.style[t]=``})}var Hb=class{constructor(e){this.viewId=null,this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n=this.rootElement;n&&t.className!==e.className&&(t.className&&n.classList.remove(t.className),e.className&&n.classList.add(e.className)),n&&!G(t.style,e.style,1)&&(Vb(n,t.style),Bb(n,e.style)),Object.assign(this.props,e),this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}get viewIds(){return this.viewId?[this.viewId]:this.deck?.getViews().map(e=>e.id)??[]}getViewState(e){return this.deck?.viewManager?.getViewState(e)||{}}setViewState(e,t){this.deck?._onViewStateChange({viewId:e,viewState:t,interactionState:{}})}onCreateRootElement(){let e=[`deck-widget`,this.className,this.props.className],t=document.createElement(`div`);return e.filter(e=>typeof e==`string`&&e.length>0).forEach(e=>t.classList.add(e)),Bb(t,this.props.style),t}_onAdd(e){return this.onAdd(e)??this.onCreateRootElement()}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};Hb.defaultProps={id:`widget`,style:{},_container:null,className:``};var Ub={zIndex:`1`,position:`absolute`,pointerEvents:`none`,color:`#a0a7b4`,backgroundColor:`#29323c`,padding:`10px`,top:`0`,left:`0`,display:`none`},Wb=class extends Hb{constructor(e={}){super(e),this.id=`default-tooltip`,this.placement=`fill`,this.className=`deck-tooltip`,this.isVisible=!1,this.setProps(e)}onCreateRootElement(){let e=document.createElement(`div`);return e.className=this.className,Object.assign(e.style,Ub),e}onRenderHTML(e){}onViewportChange(e){this.isVisible&&e.id===this.lastViewport?.id&&!e.equals(this.lastViewport)&&this.setTooltip(null),this.lastViewport=e}onHover(e){let{deck:t}=this,n=t&&t.props.getTooltip;if(!n)return;let r=n(e),i=this.widgetManager?.getCanvasBounds(e.viewport),a=e.x+(i?.x||0),o=e.y+(i?.y||0);this.setTooltip(r,a,o)}setTooltip(e,t,n){let r=this.rootElement;if(r){if(typeof e==`string`)r.innerText=e;else if(e)e.text&&(r.innerText=e.text),e.html&&(r.innerHTML=e.html),e.className&&(r.className=e.className);else{this.isVisible=!1,r.style.display=`none`;return}this.isVisible=!0,r.style.display=`block`,r.style.transform=`translate(${t}px, ${n}px)`,e&&typeof e==`object`&&`style`in e&&Object.assign(r.style,e.style)}}};Wb.defaultProps={...Hb.defaultProps};var Gb=class{constructor(e){this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap,this._createEventManager=e.createEventManager,this._getEventRoot=e.getEventRoot}finalize(){for(let e of Object.values(this.targets))e.eventManager.destroy(),e.presentationContext.destroy();this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap}syncCanvasEntries(e){let t=this._normalizeCanvasList(e.canvases),n={},r=[],i=new Map;for(let{canvas:e}of t){let t=this._getEventRoot(e);i.set(t,(i.get(t)||0)+1)}for(let{id:a,canvas:o}of t){let t=this._getEventRoot(o),s=i.get(t)===1?t:o,c=this.targets[a];if(!c||c.device!==e.device||c.canvas!==o||c.eventRoot!==s){c?.eventManager.destroy(),c?.presentationContext.destroy();let t=e.device.createPresentationContext({id:a,canvas:o,useDevicePixels:e.useDevicePixels,autoResize:!0});c={id:a,device:e.device,canvas:o,eventRoot:s,presentationContext:t,eventManager:this._createEventManager(s)}}this._eventRootToCanvasId.set(s,a),this._eventRootToCanvasId.set(o,a),n[a]=c,r.push(a)}for(let[e,t]of Object.entries(this.targets))n[e]||(t.eventManager.destroy(),t.presentationContext.destroy());this.targets=n,this.order=r;let a=Object.fromEntries(Object.entries(n).map(([e,t])=>[e,t.eventManager]));this._haveSameEventManagers(a)||(this.eventManagers=a)}getCanvasIdFromEvent(e){return e?this._eventRootToCanvasId.get(e):void 0}getTarget(e){return this.targets[e||this.order[0]||`default-canvas`]||null}_normalizeCanvasList(e=[]){let t=new Set;return e.map((e,n)=>{let r,i;return typeof e==`string`?(r=document.getElementById(e),K(r,`Canvas with id ${e} not found`),i=e):(r=e,i=r.id||`deckgl-canvas-${n}`),K(!t.has(i),`Duplicate canvas id ${i}`),t.add(i),{id:i,canvas:r}})}_haveSameEventManagers(e){let t=Object.keys(e),n=Object.keys(this.eventManagers);return t.length===n.length&&t.every(t=>e[t]===this.eventManagers[t])}},q=function(e){return e[e.DEPTH_BUFFER_BIT=256]=`DEPTH_BUFFER_BIT`,e[e.STENCIL_BUFFER_BIT=1024]=`STENCIL_BUFFER_BIT`,e[e.COLOR_BUFFER_BIT=16384]=`COLOR_BUFFER_BIT`,e[e.POINTS=0]=`POINTS`,e[e.LINES=1]=`LINES`,e[e.LINE_LOOP=2]=`LINE_LOOP`,e[e.LINE_STRIP=3]=`LINE_STRIP`,e[e.TRIANGLES=4]=`TRIANGLES`,e[e.TRIANGLE_STRIP=5]=`TRIANGLE_STRIP`,e[e.TRIANGLE_FAN=6]=`TRIANGLE_FAN`,e[e.ZERO=0]=`ZERO`,e[e.ONE=1]=`ONE`,e[e.SRC_COLOR=768]=`SRC_COLOR`,e[e.ONE_MINUS_SRC_COLOR=769]=`ONE_MINUS_SRC_COLOR`,e[e.SRC_ALPHA=770]=`SRC_ALPHA`,e[e.ONE_MINUS_SRC_ALPHA=771]=`ONE_MINUS_SRC_ALPHA`,e[e.DST_ALPHA=772]=`DST_ALPHA`,e[e.ONE_MINUS_DST_ALPHA=773]=`ONE_MINUS_DST_ALPHA`,e[e.DST_COLOR=774]=`DST_COLOR`,e[e.ONE_MINUS_DST_COLOR=775]=`ONE_MINUS_DST_COLOR`,e[e.SRC_ALPHA_SATURATE=776]=`SRC_ALPHA_SATURATE`,e[e.CONSTANT_COLOR=32769]=`CONSTANT_COLOR`,e[e.ONE_MINUS_CONSTANT_COLOR=32770]=`ONE_MINUS_CONSTANT_COLOR`,e[e.CONSTANT_ALPHA=32771]=`CONSTANT_ALPHA`,e[e.ONE_MINUS_CONSTANT_ALPHA=32772]=`ONE_MINUS_CONSTANT_ALPHA`,e[e.FUNC_ADD=32774]=`FUNC_ADD`,e[e.FUNC_SUBTRACT=32778]=`FUNC_SUBTRACT`,e[e.FUNC_REVERSE_SUBTRACT=32779]=`FUNC_REVERSE_SUBTRACT`,e[e.BLEND_EQUATION=32777]=`BLEND_EQUATION`,e[e.BLEND_EQUATION_RGB=32777]=`BLEND_EQUATION_RGB`,e[e.BLEND_EQUATION_ALPHA=34877]=`BLEND_EQUATION_ALPHA`,e[e.BLEND_DST_RGB=32968]=`BLEND_DST_RGB`,e[e.BLEND_SRC_RGB=32969]=`BLEND_SRC_RGB`,e[e.BLEND_DST_ALPHA=32970]=`BLEND_DST_ALPHA`,e[e.BLEND_SRC_ALPHA=32971]=`BLEND_SRC_ALPHA`,e[e.BLEND_COLOR=32773]=`BLEND_COLOR`,e[e.ARRAY_BUFFER_BINDING=34964]=`ARRAY_BUFFER_BINDING`,e[e.ELEMENT_ARRAY_BUFFER_BINDING=34965]=`ELEMENT_ARRAY_BUFFER_BINDING`,e[e.LINE_WIDTH=2849]=`LINE_WIDTH`,e[e.ALIASED_POINT_SIZE_RANGE=33901]=`ALIASED_POINT_SIZE_RANGE`,e[e.ALIASED_LINE_WIDTH_RANGE=33902]=`ALIASED_LINE_WIDTH_RANGE`,e[e.CULL_FACE_MODE=2885]=`CULL_FACE_MODE`,e[e.FRONT_FACE=2886]=`FRONT_FACE`,e[e.DEPTH_RANGE=2928]=`DEPTH_RANGE`,e[e.DEPTH_WRITEMASK=2930]=`DEPTH_WRITEMASK`,e[e.DEPTH_CLEAR_VALUE=2931]=`DEPTH_CLEAR_VALUE`,e[e.DEPTH_FUNC=2932]=`DEPTH_FUNC`,e[e.STENCIL_CLEAR_VALUE=2961]=`STENCIL_CLEAR_VALUE`,e[e.STENCIL_FUNC=2962]=`STENCIL_FUNC`,e[e.STENCIL_FAIL=2964]=`STENCIL_FAIL`,e[e.STENCIL_PASS_DEPTH_FAIL=2965]=`STENCIL_PASS_DEPTH_FAIL`,e[e.STENCIL_PASS_DEPTH_PASS=2966]=`STENCIL_PASS_DEPTH_PASS`,e[e.STENCIL_REF=2967]=`STENCIL_REF`,e[e.STENCIL_VALUE_MASK=2963]=`STENCIL_VALUE_MASK`,e[e.STENCIL_WRITEMASK=2968]=`STENCIL_WRITEMASK`,e[e.STENCIL_BACK_FUNC=34816]=`STENCIL_BACK_FUNC`,e[e.STENCIL_BACK_FAIL=34817]=`STENCIL_BACK_FAIL`,e[e.STENCIL_BACK_PASS_DEPTH_FAIL=34818]=`STENCIL_BACK_PASS_DEPTH_FAIL`,e[e.STENCIL_BACK_PASS_DEPTH_PASS=34819]=`STENCIL_BACK_PASS_DEPTH_PASS`,e[e.STENCIL_BACK_REF=36003]=`STENCIL_BACK_REF`,e[e.STENCIL_BACK_VALUE_MASK=36004]=`STENCIL_BACK_VALUE_MASK`,e[e.STENCIL_BACK_WRITEMASK=36005]=`STENCIL_BACK_WRITEMASK`,e[e.VIEWPORT=2978]=`VIEWPORT`,e[e.SCISSOR_BOX=3088]=`SCISSOR_BOX`,e[e.COLOR_CLEAR_VALUE=3106]=`COLOR_CLEAR_VALUE`,e[e.COLOR_WRITEMASK=3107]=`COLOR_WRITEMASK`,e[e.UNPACK_ALIGNMENT=3317]=`UNPACK_ALIGNMENT`,e[e.PACK_ALIGNMENT=3333]=`PACK_ALIGNMENT`,e[e.MAX_TEXTURE_SIZE=3379]=`MAX_TEXTURE_SIZE`,e[e.MAX_VIEWPORT_DIMS=3386]=`MAX_VIEWPORT_DIMS`,e[e.SUBPIXEL_BITS=3408]=`SUBPIXEL_BITS`,e[e.RED_BITS=3410]=`RED_BITS`,e[e.GREEN_BITS=3411]=`GREEN_BITS`,e[e.BLUE_BITS=3412]=`BLUE_BITS`,e[e.ALPHA_BITS=3413]=`ALPHA_BITS`,e[e.DEPTH_BITS=3414]=`DEPTH_BITS`,e[e.STENCIL_BITS=3415]=`STENCIL_BITS`,e[e.POLYGON_OFFSET_UNITS=10752]=`POLYGON_OFFSET_UNITS`,e[e.POLYGON_OFFSET_FACTOR=32824]=`POLYGON_OFFSET_FACTOR`,e[e.TEXTURE_BINDING_2D=32873]=`TEXTURE_BINDING_2D`,e[e.SAMPLE_BUFFERS=32936]=`SAMPLE_BUFFERS`,e[e.SAMPLES=32937]=`SAMPLES`,e[e.SAMPLE_COVERAGE_VALUE=32938]=`SAMPLE_COVERAGE_VALUE`,e[e.SAMPLE_COVERAGE_INVERT=32939]=`SAMPLE_COVERAGE_INVERT`,e[e.COMPRESSED_TEXTURE_FORMATS=34467]=`COMPRESSED_TEXTURE_FORMATS`,e[e.VENDOR=7936]=`VENDOR`,e[e.RENDERER=7937]=`RENDERER`,e[e.VERSION=7938]=`VERSION`,e[e.IMPLEMENTATION_COLOR_READ_TYPE=35738]=`IMPLEMENTATION_COLOR_READ_TYPE`,e[e.IMPLEMENTATION_COLOR_READ_FORMAT=35739]=`IMPLEMENTATION_COLOR_READ_FORMAT`,e[e.BROWSER_DEFAULT_WEBGL=37444]=`BROWSER_DEFAULT_WEBGL`,e[e.STATIC_DRAW=35044]=`STATIC_DRAW`,e[e.STREAM_DRAW=35040]=`STREAM_DRAW`,e[e.DYNAMIC_DRAW=35048]=`DYNAMIC_DRAW`,e[e.ARRAY_BUFFER=34962]=`ARRAY_BUFFER`,e[e.ELEMENT_ARRAY_BUFFER=34963]=`ELEMENT_ARRAY_BUFFER`,e[e.BUFFER_SIZE=34660]=`BUFFER_SIZE`,e[e.BUFFER_USAGE=34661]=`BUFFER_USAGE`,e[e.CURRENT_VERTEX_ATTRIB=34342]=`CURRENT_VERTEX_ATTRIB`,e[e.VERTEX_ATTRIB_ARRAY_ENABLED=34338]=`VERTEX_ATTRIB_ARRAY_ENABLED`,e[e.VERTEX_ATTRIB_ARRAY_SIZE=34339]=`VERTEX_ATTRIB_ARRAY_SIZE`,e[e.VERTEX_ATTRIB_ARRAY_STRIDE=34340]=`VERTEX_ATTRIB_ARRAY_STRIDE`,e[e.VERTEX_ATTRIB_ARRAY_TYPE=34341]=`VERTEX_ATTRIB_ARRAY_TYPE`,e[e.VERTEX_ATTRIB_ARRAY_NORMALIZED=34922]=`VERTEX_ATTRIB_ARRAY_NORMALIZED`,e[e.VERTEX_ATTRIB_ARRAY_POINTER=34373]=`VERTEX_ATTRIB_ARRAY_POINTER`,e[e.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING=34975]=`VERTEX_ATTRIB_ARRAY_BUFFER_BINDING`,e[e.CULL_FACE=2884]=`CULL_FACE`,e[e.FRONT=1028]=`FRONT`,e[e.BACK=1029]=`BACK`,e[e.FRONT_AND_BACK=1032]=`FRONT_AND_BACK`,e[e.BLEND=3042]=`BLEND`,e[e.DEPTH_TEST=2929]=`DEPTH_TEST`,e[e.DITHER=3024]=`DITHER`,e[e.POLYGON_OFFSET_FILL=32823]=`POLYGON_OFFSET_FILL`,e[e.SAMPLE_ALPHA_TO_COVERAGE=32926]=`SAMPLE_ALPHA_TO_COVERAGE`,e[e.SAMPLE_COVERAGE=32928]=`SAMPLE_COVERAGE`,e[e.SCISSOR_TEST=3089]=`SCISSOR_TEST`,e[e.STENCIL_TEST=2960]=`STENCIL_TEST`,e[e.NO_ERROR=0]=`NO_ERROR`,e[e.INVALID_ENUM=1280]=`INVALID_ENUM`,e[e.INVALID_VALUE=1281]=`INVALID_VALUE`,e[e.INVALID_OPERATION=1282]=`INVALID_OPERATION`,e[e.OUT_OF_MEMORY=1285]=`OUT_OF_MEMORY`,e[e.CONTEXT_LOST_WEBGL=37442]=`CONTEXT_LOST_WEBGL`,e[e.CW=2304]=`CW`,e[e.CCW=2305]=`CCW`,e[e.DONT_CARE=4352]=`DONT_CARE`,e[e.FASTEST=4353]=`FASTEST`,e[e.NICEST=4354]=`NICEST`,e[e.GENERATE_MIPMAP_HINT=33170]=`GENERATE_MIPMAP_HINT`,e[e.BYTE=5120]=`BYTE`,e[e.UNSIGNED_BYTE=5121]=`UNSIGNED_BYTE`,e[e.SHORT=5122]=`SHORT`,e[e.UNSIGNED_SHORT=5123]=`UNSIGNED_SHORT`,e[e.INT=5124]=`INT`,e[e.UNSIGNED_INT=5125]=`UNSIGNED_INT`,e[e.FLOAT=5126]=`FLOAT`,e[e.DOUBLE=5130]=`DOUBLE`,e[e.DEPTH_COMPONENT=6402]=`DEPTH_COMPONENT`,e[e.ALPHA=6406]=`ALPHA`,e[e.RGB=6407]=`RGB`,e[e.RGBA=6408]=`RGBA`,e[e.LUMINANCE=6409]=`LUMINANCE`,e[e.LUMINANCE_ALPHA=6410]=`LUMINANCE_ALPHA`,e[e.UNSIGNED_SHORT_4_4_4_4=32819]=`UNSIGNED_SHORT_4_4_4_4`,e[e.UNSIGNED_SHORT_5_5_5_1=32820]=`UNSIGNED_SHORT_5_5_5_1`,e[e.UNSIGNED_SHORT_5_6_5=33635]=`UNSIGNED_SHORT_5_6_5`,e[e.FRAGMENT_SHADER=35632]=`FRAGMENT_SHADER`,e[e.VERTEX_SHADER=35633]=`VERTEX_SHADER`,e[e.COMPILE_STATUS=35713]=`COMPILE_STATUS`,e[e.DELETE_STATUS=35712]=`DELETE_STATUS`,e[e.LINK_STATUS=35714]=`LINK_STATUS`,e[e.VALIDATE_STATUS=35715]=`VALIDATE_STATUS`,e[e.ATTACHED_SHADERS=35717]=`ATTACHED_SHADERS`,e[e.ACTIVE_ATTRIBUTES=35721]=`ACTIVE_ATTRIBUTES`,e[e.ACTIVE_UNIFORMS=35718]=`ACTIVE_UNIFORMS`,e[e.MAX_VERTEX_ATTRIBS=34921]=`MAX_VERTEX_ATTRIBS`,e[e.MAX_VERTEX_UNIFORM_VECTORS=36347]=`MAX_VERTEX_UNIFORM_VECTORS`,e[e.MAX_VARYING_VECTORS=36348]=`MAX_VARYING_VECTORS`,e[e.MAX_COMBINED_TEXTURE_IMAGE_UNITS=35661]=`MAX_COMBINED_TEXTURE_IMAGE_UNITS`,e[e.MAX_VERTEX_TEXTURE_IMAGE_UNITS=35660]=`MAX_VERTEX_TEXTURE_IMAGE_UNITS`,e[e.MAX_TEXTURE_IMAGE_UNITS=34930]=`MAX_TEXTURE_IMAGE_UNITS`,e[e.MAX_FRAGMENT_UNIFORM_VECTORS=36349]=`MAX_FRAGMENT_UNIFORM_VECTORS`,e[e.SHADER_TYPE=35663]=`SHADER_TYPE`,e[e.SHADING_LANGUAGE_VERSION=35724]=`SHADING_LANGUAGE_VERSION`,e[e.CURRENT_PROGRAM=35725]=`CURRENT_PROGRAM`,e[e.NEVER=512]=`NEVER`,e[e.LESS=513]=`LESS`,e[e.EQUAL=514]=`EQUAL`,e[e.LEQUAL=515]=`LEQUAL`,e[e.GREATER=516]=`GREATER`,e[e.NOTEQUAL=517]=`NOTEQUAL`,e[e.GEQUAL=518]=`GEQUAL`,e[e.ALWAYS=519]=`ALWAYS`,e[e.KEEP=7680]=`KEEP`,e[e.REPLACE=7681]=`REPLACE`,e[e.INCR=7682]=`INCR`,e[e.DECR=7683]=`DECR`,e[e.INVERT=5386]=`INVERT`,e[e.INCR_WRAP=34055]=`INCR_WRAP`,e[e.DECR_WRAP=34056]=`DECR_WRAP`,e[e.NEAREST=9728]=`NEAREST`,e[e.LINEAR=9729]=`LINEAR`,e[e.NEAREST_MIPMAP_NEAREST=9984]=`NEAREST_MIPMAP_NEAREST`,e[e.LINEAR_MIPMAP_NEAREST=9985]=`LINEAR_MIPMAP_NEAREST`,e[e.NEAREST_MIPMAP_LINEAR=9986]=`NEAREST_MIPMAP_LINEAR`,e[e.LINEAR_MIPMAP_LINEAR=9987]=`LINEAR_MIPMAP_LINEAR`,e[e.TEXTURE_MAG_FILTER=10240]=`TEXTURE_MAG_FILTER`,e[e.TEXTURE_MIN_FILTER=10241]=`TEXTURE_MIN_FILTER`,e[e.TEXTURE_WRAP_S=10242]=`TEXTURE_WRAP_S`,e[e.TEXTURE_WRAP_T=10243]=`TEXTURE_WRAP_T`,e[e.TEXTURE_2D=3553]=`TEXTURE_2D`,e[e.TEXTURE=5890]=`TEXTURE`,e[e.TEXTURE_CUBE_MAP=34067]=`TEXTURE_CUBE_MAP`,e[e.TEXTURE_BINDING_CUBE_MAP=34068]=`TEXTURE_BINDING_CUBE_MAP`,e[e.TEXTURE_CUBE_MAP_POSITIVE_X=34069]=`TEXTURE_CUBE_MAP_POSITIVE_X`,e[e.TEXTURE_CUBE_MAP_NEGATIVE_X=34070]=`TEXTURE_CUBE_MAP_NEGATIVE_X`,e[e.TEXTURE_CUBE_MAP_POSITIVE_Y=34071]=`TEXTURE_CUBE_MAP_POSITIVE_Y`,e[e.TEXTURE_CUBE_MAP_NEGATIVE_Y=34072]=`TEXTURE_CUBE_MAP_NEGATIVE_Y`,e[e.TEXTURE_CUBE_MAP_POSITIVE_Z=34073]=`TEXTURE_CUBE_MAP_POSITIVE_Z`,e[e.TEXTURE_CUBE_MAP_NEGATIVE_Z=34074]=`TEXTURE_CUBE_MAP_NEGATIVE_Z`,e[e.MAX_CUBE_MAP_TEXTURE_SIZE=34076]=`MAX_CUBE_MAP_TEXTURE_SIZE`,e[e.TEXTURE0=33984]=`TEXTURE0`,e[e.ACTIVE_TEXTURE=34016]=`ACTIVE_TEXTURE`,e[e.REPEAT=10497]=`REPEAT`,e[e.CLAMP_TO_EDGE=33071]=`CLAMP_TO_EDGE`,e[e.MIRRORED_REPEAT=33648]=`MIRRORED_REPEAT`,e[e.TEXTURE_WIDTH=4096]=`TEXTURE_WIDTH`,e[e.TEXTURE_HEIGHT=4097]=`TEXTURE_HEIGHT`,e[e.FLOAT_VEC2=35664]=`FLOAT_VEC2`,e[e.FLOAT_VEC3=35665]=`FLOAT_VEC3`,e[e.FLOAT_VEC4=35666]=`FLOAT_VEC4`,e[e.INT_VEC2=35667]=`INT_VEC2`,e[e.INT_VEC3=35668]=`INT_VEC3`,e[e.INT_VEC4=35669]=`INT_VEC4`,e[e.BOOL=35670]=`BOOL`,e[e.BOOL_VEC2=35671]=`BOOL_VEC2`,e[e.BOOL_VEC3=35672]=`BOOL_VEC3`,e[e.BOOL_VEC4=35673]=`BOOL_VEC4`,e[e.FLOAT_MAT2=35674]=`FLOAT_MAT2`,e[e.FLOAT_MAT3=35675]=`FLOAT_MAT3`,e[e.FLOAT_MAT4=35676]=`FLOAT_MAT4`,e[e.SAMPLER_2D=35678]=`SAMPLER_2D`,e[e.SAMPLER_CUBE=35680]=`SAMPLER_CUBE`,e[e.LOW_FLOAT=36336]=`LOW_FLOAT`,e[e.MEDIUM_FLOAT=36337]=`MEDIUM_FLOAT`,e[e.HIGH_FLOAT=36338]=`HIGH_FLOAT`,e[e.LOW_INT=36339]=`LOW_INT`,e[e.MEDIUM_INT=36340]=`MEDIUM_INT`,e[e.HIGH_INT=36341]=`HIGH_INT`,e[e.FRAMEBUFFER=36160]=`FRAMEBUFFER`,e[e.RENDERBUFFER=36161]=`RENDERBUFFER`,e[e.RGBA4=32854]=`RGBA4`,e[e.RGB5_A1=32855]=`RGB5_A1`,e[e.RGB565=36194]=`RGB565`,e[e.DEPTH_COMPONENT16=33189]=`DEPTH_COMPONENT16`,e[e.STENCIL_INDEX=6401]=`STENCIL_INDEX`,e[e.STENCIL_INDEX8=36168]=`STENCIL_INDEX8`,e[e.DEPTH_STENCIL=34041]=`DEPTH_STENCIL`,e[e.RENDERBUFFER_WIDTH=36162]=`RENDERBUFFER_WIDTH`,e[e.RENDERBUFFER_HEIGHT=36163]=`RENDERBUFFER_HEIGHT`,e[e.RENDERBUFFER_INTERNAL_FORMAT=36164]=`RENDERBUFFER_INTERNAL_FORMAT`,e[e.RENDERBUFFER_RED_SIZE=36176]=`RENDERBUFFER_RED_SIZE`,e[e.RENDERBUFFER_GREEN_SIZE=36177]=`RENDERBUFFER_GREEN_SIZE`,e[e.RENDERBUFFER_BLUE_SIZE=36178]=`RENDERBUFFER_BLUE_SIZE`,e[e.RENDERBUFFER_ALPHA_SIZE=36179]=`RENDERBUFFER_ALPHA_SIZE`,e[e.RENDERBUFFER_DEPTH_SIZE=36180]=`RENDERBUFFER_DEPTH_SIZE`,e[e.RENDERBUFFER_STENCIL_SIZE=36181]=`RENDERBUFFER_STENCIL_SIZE`,e[e.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE=36048]=`FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE`,e[e.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME=36049]=`FRAMEBUFFER_ATTACHMENT_OBJECT_NAME`,e[e.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL=36050]=`FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL`,e[e.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE=36051]=`FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE`,e[e.COLOR_ATTACHMENT0=36064]=`COLOR_ATTACHMENT0`,e[e.DEPTH_ATTACHMENT=36096]=`DEPTH_ATTACHMENT`,e[e.STENCIL_ATTACHMENT=36128]=`STENCIL_ATTACHMENT`,e[e.DEPTH_STENCIL_ATTACHMENT=33306]=`DEPTH_STENCIL_ATTACHMENT`,e[e.NONE=0]=`NONE`,e[e.FRAMEBUFFER_COMPLETE=36053]=`FRAMEBUFFER_COMPLETE`,e[e.FRAMEBUFFER_INCOMPLETE_ATTACHMENT=36054]=`FRAMEBUFFER_INCOMPLETE_ATTACHMENT`,e[e.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT=36055]=`FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT`,e[e.FRAMEBUFFER_INCOMPLETE_DIMENSIONS=36057]=`FRAMEBUFFER_INCOMPLETE_DIMENSIONS`,e[e.FRAMEBUFFER_UNSUPPORTED=36061]=`FRAMEBUFFER_UNSUPPORTED`,e[e.FRAMEBUFFER_BINDING=36006]=`FRAMEBUFFER_BINDING`,e[e.RENDERBUFFER_BINDING=36007]=`RENDERBUFFER_BINDING`,e[e.READ_FRAMEBUFFER=36008]=`READ_FRAMEBUFFER`,e[e.DRAW_FRAMEBUFFER=36009]=`DRAW_FRAMEBUFFER`,e[e.MAX_RENDERBUFFER_SIZE=34024]=`MAX_RENDERBUFFER_SIZE`,e[e.INVALID_FRAMEBUFFER_OPERATION=1286]=`INVALID_FRAMEBUFFER_OPERATION`,e[e.UNPACK_FLIP_Y_WEBGL=37440]=`UNPACK_FLIP_Y_WEBGL`,e[e.UNPACK_PREMULTIPLY_ALPHA_WEBGL=37441]=`UNPACK_PREMULTIPLY_ALPHA_WEBGL`,e[e.UNPACK_COLORSPACE_CONVERSION_WEBGL=37443]=`UNPACK_COLORSPACE_CONVERSION_WEBGL`,e[e.READ_BUFFER=3074]=`READ_BUFFER`,e[e.UNPACK_ROW_LENGTH=3314]=`UNPACK_ROW_LENGTH`,e[e.UNPACK_SKIP_ROWS=3315]=`UNPACK_SKIP_ROWS`,e[e.UNPACK_SKIP_PIXELS=3316]=`UNPACK_SKIP_PIXELS`,e[e.PACK_ROW_LENGTH=3330]=`PACK_ROW_LENGTH`,e[e.PACK_SKIP_ROWS=3331]=`PACK_SKIP_ROWS`,e[e.PACK_SKIP_PIXELS=3332]=`PACK_SKIP_PIXELS`,e[e.TEXTURE_BINDING_3D=32874]=`TEXTURE_BINDING_3D`,e[e.UNPACK_SKIP_IMAGES=32877]=`UNPACK_SKIP_IMAGES`,e[e.UNPACK_IMAGE_HEIGHT=32878]=`UNPACK_IMAGE_HEIGHT`,e[e.MAX_3D_TEXTURE_SIZE=32883]=`MAX_3D_TEXTURE_SIZE`,e[e.MAX_ELEMENTS_VERTICES=33e3]=`MAX_ELEMENTS_VERTICES`,e[e.MAX_ELEMENTS_INDICES=33001]=`MAX_ELEMENTS_INDICES`,e[e.MAX_TEXTURE_LOD_BIAS=34045]=`MAX_TEXTURE_LOD_BIAS`,e[e.MAX_FRAGMENT_UNIFORM_COMPONENTS=35657]=`MAX_FRAGMENT_UNIFORM_COMPONENTS`,e[e.MAX_VERTEX_UNIFORM_COMPONENTS=35658]=`MAX_VERTEX_UNIFORM_COMPONENTS`,e[e.MAX_ARRAY_TEXTURE_LAYERS=35071]=`MAX_ARRAY_TEXTURE_LAYERS`,e[e.MIN_PROGRAM_TEXEL_OFFSET=35076]=`MIN_PROGRAM_TEXEL_OFFSET`,e[e.MAX_PROGRAM_TEXEL_OFFSET=35077]=`MAX_PROGRAM_TEXEL_OFFSET`,e[e.MAX_VARYING_COMPONENTS=35659]=`MAX_VARYING_COMPONENTS`,e[e.FRAGMENT_SHADER_DERIVATIVE_HINT=35723]=`FRAGMENT_SHADER_DERIVATIVE_HINT`,e[e.RASTERIZER_DISCARD=35977]=`RASTERIZER_DISCARD`,e[e.VERTEX_ARRAY_BINDING=34229]=`VERTEX_ARRAY_BINDING`,e[e.MAX_VERTEX_OUTPUT_COMPONENTS=37154]=`MAX_VERTEX_OUTPUT_COMPONENTS`,e[e.MAX_FRAGMENT_INPUT_COMPONENTS=37157]=`MAX_FRAGMENT_INPUT_COMPONENTS`,e[e.MAX_SERVER_WAIT_TIMEOUT=37137]=`MAX_SERVER_WAIT_TIMEOUT`,e[e.MAX_ELEMENT_INDEX=36203]=`MAX_ELEMENT_INDEX`,e[e.RED=6403]=`RED`,e[e.RGB8=32849]=`RGB8`,e[e.RGBA8=32856]=`RGBA8`,e[e.RGB10_A2=32857]=`RGB10_A2`,e[e.TEXTURE_3D=32879]=`TEXTURE_3D`,e[e.TEXTURE_WRAP_R=32882]=`TEXTURE_WRAP_R`,e[e.TEXTURE_MIN_LOD=33082]=`TEXTURE_MIN_LOD`,e[e.TEXTURE_MAX_LOD=33083]=`TEXTURE_MAX_LOD`,e[e.TEXTURE_BASE_LEVEL=33084]=`TEXTURE_BASE_LEVEL`,e[e.TEXTURE_MAX_LEVEL=33085]=`TEXTURE_MAX_LEVEL`,e[e.TEXTURE_COMPARE_MODE=34892]=`TEXTURE_COMPARE_MODE`,e[e.TEXTURE_COMPARE_FUNC=34893]=`TEXTURE_COMPARE_FUNC`,e[e.SRGB=35904]=`SRGB`,e[e.SRGB8=35905]=`SRGB8`,e[e.SRGB8_ALPHA8=35907]=`SRGB8_ALPHA8`,e[e.COMPARE_REF_TO_TEXTURE=34894]=`COMPARE_REF_TO_TEXTURE`,e[e.RGBA32F=34836]=`RGBA32F`,e[e.RGB32F=34837]=`RGB32F`,e[e.RGBA16F=34842]=`RGBA16F`,e[e.RGB16F=34843]=`RGB16F`,e[e.TEXTURE_2D_ARRAY=35866]=`TEXTURE_2D_ARRAY`,e[e.TEXTURE_BINDING_2D_ARRAY=35869]=`TEXTURE_BINDING_2D_ARRAY`,e[e.R11F_G11F_B10F=35898]=`R11F_G11F_B10F`,e[e.RGB9_E5=35901]=`RGB9_E5`,e[e.RGBA32UI=36208]=`RGBA32UI`,e[e.RGB32UI=36209]=`RGB32UI`,e[e.RGBA16UI=36214]=`RGBA16UI`,e[e.RGB16UI=36215]=`RGB16UI`,e[e.RGBA8UI=36220]=`RGBA8UI`,e[e.RGB8UI=36221]=`RGB8UI`,e[e.RGBA32I=36226]=`RGBA32I`,e[e.RGB32I=36227]=`RGB32I`,e[e.RGBA16I=36232]=`RGBA16I`,e[e.RGB16I=36233]=`RGB16I`,e[e.RGBA8I=36238]=`RGBA8I`,e[e.RGB8I=36239]=`RGB8I`,e[e.RED_INTEGER=36244]=`RED_INTEGER`,e[e.RGB_INTEGER=36248]=`RGB_INTEGER`,e[e.RGBA_INTEGER=36249]=`RGBA_INTEGER`,e[e.R8=33321]=`R8`,e[e.RG8=33323]=`RG8`,e[e.R16F=33325]=`R16F`,e[e.R32F=33326]=`R32F`,e[e.RG16F=33327]=`RG16F`,e[e.RG32F=33328]=`RG32F`,e[e.R8I=33329]=`R8I`,e[e.R8UI=33330]=`R8UI`,e[e.R16I=33331]=`R16I`,e[e.R16UI=33332]=`R16UI`,e[e.R32I=33333]=`R32I`,e[e.R32UI=33334]=`R32UI`,e[e.RG8I=33335]=`RG8I`,e[e.RG8UI=33336]=`RG8UI`,e[e.RG16I=33337]=`RG16I`,e[e.RG16UI=33338]=`RG16UI`,e[e.RG32I=33339]=`RG32I`,e[e.RG32UI=33340]=`RG32UI`,e[e.R8_SNORM=36756]=`R8_SNORM`,e[e.RG8_SNORM=36757]=`RG8_SNORM`,e[e.RGB8_SNORM=36758]=`RGB8_SNORM`,e[e.RGBA8_SNORM=36759]=`RGBA8_SNORM`,e[e.RGB10_A2UI=36975]=`RGB10_A2UI`,e[e.TEXTURE_IMMUTABLE_FORMAT=37167]=`TEXTURE_IMMUTABLE_FORMAT`,e[e.TEXTURE_IMMUTABLE_LEVELS=33503]=`TEXTURE_IMMUTABLE_LEVELS`,e[e.UNSIGNED_INT_2_10_10_10_REV=33640]=`UNSIGNED_INT_2_10_10_10_REV`,e[e.UNSIGNED_INT_10F_11F_11F_REV=35899]=`UNSIGNED_INT_10F_11F_11F_REV`,e[e.UNSIGNED_INT_5_9_9_9_REV=35902]=`UNSIGNED_INT_5_9_9_9_REV`,e[e.FLOAT_32_UNSIGNED_INT_24_8_REV=36269]=`FLOAT_32_UNSIGNED_INT_24_8_REV`,e[e.UNSIGNED_INT_24_8=34042]=`UNSIGNED_INT_24_8`,e[e.HALF_FLOAT=5131]=`HALF_FLOAT`,e[e.RG=33319]=`RG`,e[e.RG_INTEGER=33320]=`RG_INTEGER`,e[e.INT_2_10_10_10_REV=36255]=`INT_2_10_10_10_REV`,e[e.CURRENT_QUERY=34917]=`CURRENT_QUERY`,e[e.QUERY_RESULT=34918]=`QUERY_RESULT`,e[e.QUERY_RESULT_AVAILABLE=34919]=`QUERY_RESULT_AVAILABLE`,e[e.ANY_SAMPLES_PASSED=35887]=`ANY_SAMPLES_PASSED`,e[e.ANY_SAMPLES_PASSED_CONSERVATIVE=36202]=`ANY_SAMPLES_PASSED_CONSERVATIVE`,e[e.MAX_DRAW_BUFFERS=34852]=`MAX_DRAW_BUFFERS`,e[e.DRAW_BUFFER0=34853]=`DRAW_BUFFER0`,e[e.DRAW_BUFFER1=34854]=`DRAW_BUFFER1`,e[e.DRAW_BUFFER2=34855]=`DRAW_BUFFER2`,e[e.DRAW_BUFFER3=34856]=`DRAW_BUFFER3`,e[e.DRAW_BUFFER4=34857]=`DRAW_BUFFER4`,e[e.DRAW_BUFFER5=34858]=`DRAW_BUFFER5`,e[e.DRAW_BUFFER6=34859]=`DRAW_BUFFER6`,e[e.DRAW_BUFFER7=34860]=`DRAW_BUFFER7`,e[e.DRAW_BUFFER8=34861]=`DRAW_BUFFER8`,e[e.DRAW_BUFFER9=34862]=`DRAW_BUFFER9`,e[e.DRAW_BUFFER10=34863]=`DRAW_BUFFER10`,e[e.DRAW_BUFFER11=34864]=`DRAW_BUFFER11`,e[e.DRAW_BUFFER12=34865]=`DRAW_BUFFER12`,e[e.DRAW_BUFFER13=34866]=`DRAW_BUFFER13`,e[e.DRAW_BUFFER14=34867]=`DRAW_BUFFER14`,e[e.DRAW_BUFFER15=34868]=`DRAW_BUFFER15`,e[e.MAX_COLOR_ATTACHMENTS=36063]=`MAX_COLOR_ATTACHMENTS`,e[e.COLOR_ATTACHMENT1=36065]=`COLOR_ATTACHMENT1`,e[e.COLOR_ATTACHMENT2=36066]=`COLOR_ATTACHMENT2`,e[e.COLOR_ATTACHMENT3=36067]=`COLOR_ATTACHMENT3`,e[e.COLOR_ATTACHMENT4=36068]=`COLOR_ATTACHMENT4`,e[e.COLOR_ATTACHMENT5=36069]=`COLOR_ATTACHMENT5`,e[e.COLOR_ATTACHMENT6=36070]=`COLOR_ATTACHMENT6`,e[e.COLOR_ATTACHMENT7=36071]=`COLOR_ATTACHMENT7`,e[e.COLOR_ATTACHMENT8=36072]=`COLOR_ATTACHMENT8`,e[e.COLOR_ATTACHMENT9=36073]=`COLOR_ATTACHMENT9`,e[e.COLOR_ATTACHMENT10=36074]=`COLOR_ATTACHMENT10`,e[e.COLOR_ATTACHMENT11=36075]=`COLOR_ATTACHMENT11`,e[e.COLOR_ATTACHMENT12=36076]=`COLOR_ATTACHMENT12`,e[e.COLOR_ATTACHMENT13=36077]=`COLOR_ATTACHMENT13`,e[e.COLOR_ATTACHMENT14=36078]=`COLOR_ATTACHMENT14`,e[e.COLOR_ATTACHMENT15=36079]=`COLOR_ATTACHMENT15`,e[e.SAMPLER_3D=35679]=`SAMPLER_3D`,e[e.SAMPLER_2D_SHADOW=35682]=`SAMPLER_2D_SHADOW`,e[e.SAMPLER_2D_ARRAY=36289]=`SAMPLER_2D_ARRAY`,e[e.SAMPLER_2D_ARRAY_SHADOW=36292]=`SAMPLER_2D_ARRAY_SHADOW`,e[e.SAMPLER_CUBE_SHADOW=36293]=`SAMPLER_CUBE_SHADOW`,e[e.INT_SAMPLER_2D=36298]=`INT_SAMPLER_2D`,e[e.INT_SAMPLER_3D=36299]=`INT_SAMPLER_3D`,e[e.INT_SAMPLER_CUBE=36300]=`INT_SAMPLER_CUBE`,e[e.INT_SAMPLER_2D_ARRAY=36303]=`INT_SAMPLER_2D_ARRAY`,e[e.UNSIGNED_INT_SAMPLER_2D=36306]=`UNSIGNED_INT_SAMPLER_2D`,e[e.UNSIGNED_INT_SAMPLER_3D=36307]=`UNSIGNED_INT_SAMPLER_3D`,e[e.UNSIGNED_INT_SAMPLER_CUBE=36308]=`UNSIGNED_INT_SAMPLER_CUBE`,e[e.UNSIGNED_INT_SAMPLER_2D_ARRAY=36311]=`UNSIGNED_INT_SAMPLER_2D_ARRAY`,e[e.MAX_SAMPLES=36183]=`MAX_SAMPLES`,e[e.SAMPLER_BINDING=35097]=`SAMPLER_BINDING`,e[e.PIXEL_PACK_BUFFER=35051]=`PIXEL_PACK_BUFFER`,e[e.PIXEL_UNPACK_BUFFER=35052]=`PIXEL_UNPACK_BUFFER`,e[e.PIXEL_PACK_BUFFER_BINDING=35053]=`PIXEL_PACK_BUFFER_BINDING`,e[e.PIXEL_UNPACK_BUFFER_BINDING=35055]=`PIXEL_UNPACK_BUFFER_BINDING`,e[e.COPY_READ_BUFFER=36662]=`COPY_READ_BUFFER`,e[e.COPY_WRITE_BUFFER=36663]=`COPY_WRITE_BUFFER`,e[e.COPY_READ_BUFFER_BINDING=36662]=`COPY_READ_BUFFER_BINDING`,e[e.COPY_WRITE_BUFFER_BINDING=36663]=`COPY_WRITE_BUFFER_BINDING`,e[e.FLOAT_MAT2x3=35685]=`FLOAT_MAT2x3`,e[e.FLOAT_MAT2x4=35686]=`FLOAT_MAT2x4`,e[e.FLOAT_MAT3x2=35687]=`FLOAT_MAT3x2`,e[e.FLOAT_MAT3x4=35688]=`FLOAT_MAT3x4`,e[e.FLOAT_MAT4x2=35689]=`FLOAT_MAT4x2`,e[e.FLOAT_MAT4x3=35690]=`FLOAT_MAT4x3`,e[e.UNSIGNED_INT_VEC2=36294]=`UNSIGNED_INT_VEC2`,e[e.UNSIGNED_INT_VEC3=36295]=`UNSIGNED_INT_VEC3`,e[e.UNSIGNED_INT_VEC4=36296]=`UNSIGNED_INT_VEC4`,e[e.UNSIGNED_NORMALIZED=35863]=`UNSIGNED_NORMALIZED`,e[e.SIGNED_NORMALIZED=36764]=`SIGNED_NORMALIZED`,e[e.VERTEX_ATTRIB_ARRAY_INTEGER=35069]=`VERTEX_ATTRIB_ARRAY_INTEGER`,e[e.VERTEX_ATTRIB_ARRAY_DIVISOR=35070]=`VERTEX_ATTRIB_ARRAY_DIVISOR`,e[e.TRANSFORM_FEEDBACK_BUFFER_MODE=35967]=`TRANSFORM_FEEDBACK_BUFFER_MODE`,e[e.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS=35968]=`MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS`,e[e.TRANSFORM_FEEDBACK_VARYINGS=35971]=`TRANSFORM_FEEDBACK_VARYINGS`,e[e.TRANSFORM_FEEDBACK_BUFFER_START=35972]=`TRANSFORM_FEEDBACK_BUFFER_START`,e[e.TRANSFORM_FEEDBACK_BUFFER_SIZE=35973]=`TRANSFORM_FEEDBACK_BUFFER_SIZE`,e[e.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN=35976]=`TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN`,e[e.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS=35978]=`MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS`,e[e.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS=35979]=`MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS`,e[e.INTERLEAVED_ATTRIBS=35980]=`INTERLEAVED_ATTRIBS`,e[e.SEPARATE_ATTRIBS=35981]=`SEPARATE_ATTRIBS`,e[e.TRANSFORM_FEEDBACK_BUFFER=35982]=`TRANSFORM_FEEDBACK_BUFFER`,e[e.TRANSFORM_FEEDBACK_BUFFER_BINDING=35983]=`TRANSFORM_FEEDBACK_BUFFER_BINDING`,e[e.TRANSFORM_FEEDBACK=36386]=`TRANSFORM_FEEDBACK`,e[e.TRANSFORM_FEEDBACK_PAUSED=36387]=`TRANSFORM_FEEDBACK_PAUSED`,e[e.TRANSFORM_FEEDBACK_ACTIVE=36388]=`TRANSFORM_FEEDBACK_ACTIVE`,e[e.TRANSFORM_FEEDBACK_BINDING=36389]=`TRANSFORM_FEEDBACK_BINDING`,e[e.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING=33296]=`FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING`,e[e.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE=33297]=`FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE`,e[e.FRAMEBUFFER_ATTACHMENT_RED_SIZE=33298]=`FRAMEBUFFER_ATTACHMENT_RED_SIZE`,e[e.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE=33299]=`FRAMEBUFFER_ATTACHMENT_GREEN_SIZE`,e[e.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE=33300]=`FRAMEBUFFER_ATTACHMENT_BLUE_SIZE`,e[e.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE=33301]=`FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE`,e[e.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE=33302]=`FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE`,e[e.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE=33303]=`FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE`,e[e.FRAMEBUFFER_DEFAULT=33304]=`FRAMEBUFFER_DEFAULT`,e[e.DEPTH24_STENCIL8=35056]=`DEPTH24_STENCIL8`,e[e.DRAW_FRAMEBUFFER_BINDING=36006]=`DRAW_FRAMEBUFFER_BINDING`,e[e.READ_FRAMEBUFFER_BINDING=36010]=`READ_FRAMEBUFFER_BINDING`,e[e.RENDERBUFFER_SAMPLES=36011]=`RENDERBUFFER_SAMPLES`,e[e.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER=36052]=`FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER`,e[e.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE=36182]=`FRAMEBUFFER_INCOMPLETE_MULTISAMPLE`,e[e.UNIFORM_BUFFER=35345]=`UNIFORM_BUFFER`,e[e.UNIFORM_BUFFER_BINDING=35368]=`UNIFORM_BUFFER_BINDING`,e[e.UNIFORM_BUFFER_START=35369]=`UNIFORM_BUFFER_START`,e[e.UNIFORM_BUFFER_SIZE=35370]=`UNIFORM_BUFFER_SIZE`,e[e.MAX_VERTEX_UNIFORM_BLOCKS=35371]=`MAX_VERTEX_UNIFORM_BLOCKS`,e[e.MAX_FRAGMENT_UNIFORM_BLOCKS=35373]=`MAX_FRAGMENT_UNIFORM_BLOCKS`,e[e.MAX_COMBINED_UNIFORM_BLOCKS=35374]=`MAX_COMBINED_UNIFORM_BLOCKS`,e[e.MAX_UNIFORM_BUFFER_BINDINGS=35375]=`MAX_UNIFORM_BUFFER_BINDINGS`,e[e.MAX_UNIFORM_BLOCK_SIZE=35376]=`MAX_UNIFORM_BLOCK_SIZE`,e[e.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS=35377]=`MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS`,e[e.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS=35379]=`MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS`,e[e.UNIFORM_BUFFER_OFFSET_ALIGNMENT=35380]=`UNIFORM_BUFFER_OFFSET_ALIGNMENT`,e[e.ACTIVE_UNIFORM_BLOCKS=35382]=`ACTIVE_UNIFORM_BLOCKS`,e[e.UNIFORM_TYPE=35383]=`UNIFORM_TYPE`,e[e.UNIFORM_SIZE=35384]=`UNIFORM_SIZE`,e[e.UNIFORM_BLOCK_INDEX=35386]=`UNIFORM_BLOCK_INDEX`,e[e.UNIFORM_OFFSET=35387]=`UNIFORM_OFFSET`,e[e.UNIFORM_ARRAY_STRIDE=35388]=`UNIFORM_ARRAY_STRIDE`,e[e.UNIFORM_MATRIX_STRIDE=35389]=`UNIFORM_MATRIX_STRIDE`,e[e.UNIFORM_IS_ROW_MAJOR=35390]=`UNIFORM_IS_ROW_MAJOR`,e[e.UNIFORM_BLOCK_BINDING=35391]=`UNIFORM_BLOCK_BINDING`,e[e.UNIFORM_BLOCK_DATA_SIZE=35392]=`UNIFORM_BLOCK_DATA_SIZE`,e[e.UNIFORM_BLOCK_ACTIVE_UNIFORMS=35394]=`UNIFORM_BLOCK_ACTIVE_UNIFORMS`,e[e.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES=35395]=`UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES`,e[e.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER=35396]=`UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER`,e[e.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER=35398]=`UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER`,e[e.OBJECT_TYPE=37138]=`OBJECT_TYPE`,e[e.SYNC_CONDITION=37139]=`SYNC_CONDITION`,e[e.SYNC_STATUS=37140]=`SYNC_STATUS`,e[e.SYNC_FLAGS=37141]=`SYNC_FLAGS`,e[e.SYNC_FENCE=37142]=`SYNC_FENCE`,e[e.SYNC_GPU_COMMANDS_COMPLETE=37143]=`SYNC_GPU_COMMANDS_COMPLETE`,e[e.UNSIGNALED=37144]=`UNSIGNALED`,e[e.SIGNALED=37145]=`SIGNALED`,e[e.ALREADY_SIGNALED=37146]=`ALREADY_SIGNALED`,e[e.TIMEOUT_EXPIRED=37147]=`TIMEOUT_EXPIRED`,e[e.CONDITION_SATISFIED=37148]=`CONDITION_SATISFIED`,e[e.WAIT_FAILED=37149]=`WAIT_FAILED`,e[e.SYNC_FLUSH_COMMANDS_BIT=1]=`SYNC_FLUSH_COMMANDS_BIT`,e[e.COLOR=6144]=`COLOR`,e[e.DEPTH=6145]=`DEPTH`,e[e.STENCIL=6146]=`STENCIL`,e[e.MIN=32775]=`MIN`,e[e.MAX=32776]=`MAX`,e[e.DEPTH_COMPONENT24=33190]=`DEPTH_COMPONENT24`,e[e.STREAM_READ=35041]=`STREAM_READ`,e[e.STREAM_COPY=35042]=`STREAM_COPY`,e[e.STATIC_READ=35045]=`STATIC_READ`,e[e.STATIC_COPY=35046]=`STATIC_COPY`,e[e.DYNAMIC_READ=35049]=`DYNAMIC_READ`,e[e.DYNAMIC_COPY=35050]=`DYNAMIC_COPY`,e[e.DEPTH_COMPONENT32F=36012]=`DEPTH_COMPONENT32F`,e[e.DEPTH32F_STENCIL8=36013]=`DEPTH32F_STENCIL8`,e[e.INVALID_INDEX=4294967295]=`INVALID_INDEX`,e[e.TIMEOUT_IGNORED=-1]=`TIMEOUT_IGNORED`,e[e.MAX_CLIENT_WAIT_TIMEOUT_WEBGL=37447]=`MAX_CLIENT_WAIT_TIMEOUT_WEBGL`,e[e.UNMASKED_VENDOR_WEBGL=37445]=`UNMASKED_VENDOR_WEBGL`,e[e.UNMASKED_RENDERER_WEBGL=37446]=`UNMASKED_RENDERER_WEBGL`,e[e.MAX_TEXTURE_MAX_ANISOTROPY_EXT=34047]=`MAX_TEXTURE_MAX_ANISOTROPY_EXT`,e[e.TEXTURE_MAX_ANISOTROPY_EXT=34046]=`TEXTURE_MAX_ANISOTROPY_EXT`,e[e.R16_EXT=33322]=`R16_EXT`,e[e.RG16_EXT=33324]=`RG16_EXT`,e[e.RGB16_EXT=32852]=`RGB16_EXT`,e[e.RGBA16_EXT=32859]=`RGBA16_EXT`,e[e.R16_SNORM_EXT=36760]=`R16_SNORM_EXT`,e[e.RG16_SNORM_EXT=36761]=`RG16_SNORM_EXT`,e[e.RGB16_SNORM_EXT=36762]=`RGB16_SNORM_EXT`,e[e.RGBA16_SNORM_EXT=36763]=`RGBA16_SNORM_EXT`,e[e.COMPRESSED_RGB_S3TC_DXT1_EXT=33776]=`COMPRESSED_RGB_S3TC_DXT1_EXT`,e[e.COMPRESSED_RGBA_S3TC_DXT1_EXT=33777]=`COMPRESSED_RGBA_S3TC_DXT1_EXT`,e[e.COMPRESSED_RGBA_S3TC_DXT3_EXT=33778]=`COMPRESSED_RGBA_S3TC_DXT3_EXT`,e[e.COMPRESSED_RGBA_S3TC_DXT5_EXT=33779]=`COMPRESSED_RGBA_S3TC_DXT5_EXT`,e[e.COMPRESSED_SRGB_S3TC_DXT1_EXT=35916]=`COMPRESSED_SRGB_S3TC_DXT1_EXT`,e[e.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT=35917]=`COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT`,e[e.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT=35918]=`COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT`,e[e.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT=35919]=`COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT`,e[e.COMPRESSED_RED_RGTC1_EXT=36283]=`COMPRESSED_RED_RGTC1_EXT`,e[e.COMPRESSED_SIGNED_RED_RGTC1_EXT=36284]=`COMPRESSED_SIGNED_RED_RGTC1_EXT`,e[e.COMPRESSED_RED_GREEN_RGTC2_EXT=36285]=`COMPRESSED_RED_GREEN_RGTC2_EXT`,e[e.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT=36286]=`COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT`,e[e.COMPRESSED_RGBA_BPTC_UNORM_EXT=36492]=`COMPRESSED_RGBA_BPTC_UNORM_EXT`,e[e.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT=36493]=`COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT`,e[e.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT=36494]=`COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT`,e[e.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT=36495]=`COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT`,e[e.COMPRESSED_R11_EAC=37488]=`COMPRESSED_R11_EAC`,e[e.COMPRESSED_SIGNED_R11_EAC=37489]=`COMPRESSED_SIGNED_R11_EAC`,e[e.COMPRESSED_RG11_EAC=37490]=`COMPRESSED_RG11_EAC`,e[e.COMPRESSED_SIGNED_RG11_EAC=37491]=`COMPRESSED_SIGNED_RG11_EAC`,e[e.COMPRESSED_RGB8_ETC2=37492]=`COMPRESSED_RGB8_ETC2`,e[e.COMPRESSED_RGBA8_ETC2_EAC=37493]=`COMPRESSED_RGBA8_ETC2_EAC`,e[e.COMPRESSED_SRGB8_ETC2=37494]=`COMPRESSED_SRGB8_ETC2`,e[e.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC=37495]=`COMPRESSED_SRGB8_ALPHA8_ETC2_EAC`,e[e.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2=37496]=`COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2`,e[e.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2=37497]=`COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2`,e[e.COMPRESSED_RGB_PVRTC_4BPPV1_IMG=35840]=`COMPRESSED_RGB_PVRTC_4BPPV1_IMG`,e[e.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG=35842]=`COMPRESSED_RGBA_PVRTC_4BPPV1_IMG`,e[e.COMPRESSED_RGB_PVRTC_2BPPV1_IMG=35841]=`COMPRESSED_RGB_PVRTC_2BPPV1_IMG`,e[e.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG=35843]=`COMPRESSED_RGBA_PVRTC_2BPPV1_IMG`,e[e.COMPRESSED_RGB_ETC1_WEBGL=36196]=`COMPRESSED_RGB_ETC1_WEBGL`,e[e.COMPRESSED_RGB_ATC_WEBGL=35986]=`COMPRESSED_RGB_ATC_WEBGL`,e[e.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL=35986]=`COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL`,e[e.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL=34798]=`COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL`,e[e.COMPRESSED_RGBA_ASTC_4x4_KHR=37808]=`COMPRESSED_RGBA_ASTC_4x4_KHR`,e[e.COMPRESSED_RGBA_ASTC_5x4_KHR=37809]=`COMPRESSED_RGBA_ASTC_5x4_KHR`,e[e.COMPRESSED_RGBA_ASTC_5x5_KHR=37810]=`COMPRESSED_RGBA_ASTC_5x5_KHR`,e[e.COMPRESSED_RGBA_ASTC_6x5_KHR=37811]=`COMPRESSED_RGBA_ASTC_6x5_KHR`,e[e.COMPRESSED_RGBA_ASTC_6x6_KHR=37812]=`COMPRESSED_RGBA_ASTC_6x6_KHR`,e[e.COMPRESSED_RGBA_ASTC_8x5_KHR=37813]=`COMPRESSED_RGBA_ASTC_8x5_KHR`,e[e.COMPRESSED_RGBA_ASTC_8x6_KHR=37814]=`COMPRESSED_RGBA_ASTC_8x6_KHR`,e[e.COMPRESSED_RGBA_ASTC_8x8_KHR=37815]=`COMPRESSED_RGBA_ASTC_8x8_KHR`,e[e.COMPRESSED_RGBA_ASTC_10x5_KHR=37816]=`COMPRESSED_RGBA_ASTC_10x5_KHR`,e[e.COMPRESSED_RGBA_ASTC_10x6_KHR=37817]=`COMPRESSED_RGBA_ASTC_10x6_KHR`,e[e.COMPRESSED_RGBA_ASTC_10x8_KHR=37818]=`COMPRESSED_RGBA_ASTC_10x8_KHR`,e[e.COMPRESSED_RGBA_ASTC_10x10_KHR=37819]=`COMPRESSED_RGBA_ASTC_10x10_KHR`,e[e.COMPRESSED_RGBA_ASTC_12x10_KHR=37820]=`COMPRESSED_RGBA_ASTC_12x10_KHR`,e[e.COMPRESSED_RGBA_ASTC_12x12_KHR=37821]=`COMPRESSED_RGBA_ASTC_12x12_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR=37840]=`COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR=37841]=`COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR=37842]=`COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR=37843]=`COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR=37844]=`COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR=37845]=`COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR=37846]=`COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR=37847]=`COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR=37848]=`COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR=37849]=`COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR=37850]=`COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR=37851]=`COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR=37852]=`COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR`,e[e.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR=37853]=`COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR`,e[e.QUERY_COUNTER_BITS_EXT=34916]=`QUERY_COUNTER_BITS_EXT`,e[e.CURRENT_QUERY_EXT=34917]=`CURRENT_QUERY_EXT`,e[e.QUERY_RESULT_EXT=34918]=`QUERY_RESULT_EXT`,e[e.QUERY_RESULT_AVAILABLE_EXT=34919]=`QUERY_RESULT_AVAILABLE_EXT`,e[e.TIME_ELAPSED_EXT=35007]=`TIME_ELAPSED_EXT`,e[e.TIMESTAMP_EXT=36392]=`TIMESTAMP_EXT`,e[e.GPU_DISJOINT_EXT=36795]=`GPU_DISJOINT_EXT`,e[e.COMPLETION_STATUS_KHR=37297]=`COMPLETION_STATUS_KHR`,e[e.DEPTH_CLAMP_EXT=34383]=`DEPTH_CLAMP_EXT`,e[e.FIRST_VERTEX_CONVENTION_WEBGL=36429]=`FIRST_VERTEX_CONVENTION_WEBGL`,e[e.LAST_VERTEX_CONVENTION_WEBGL=36430]=`LAST_VERTEX_CONVENTION_WEBGL`,e[e.PROVOKING_VERTEX_WEBL=36431]=`PROVOKING_VERTEX_WEBL`,e[e.POLYGON_MODE_WEBGL=2880]=`POLYGON_MODE_WEBGL`,e[e.POLYGON_OFFSET_LINE_WEBGL=10754]=`POLYGON_OFFSET_LINE_WEBGL`,e[e.LINE_WEBGL=6913]=`LINE_WEBGL`,e[e.FILL_WEBGL=6914]=`FILL_WEBGL`,e[e.MAX_CLIP_DISTANCES_WEBGL=3378]=`MAX_CLIP_DISTANCES_WEBGL`,e[e.MAX_CULL_DISTANCES_WEBGL=33529]=`MAX_CULL_DISTANCES_WEBGL`,e[e.MAX_COMBINED_CLIP_AND_CULL_DISTANCES_WEBGL=33530]=`MAX_COMBINED_CLIP_AND_CULL_DISTANCES_WEBGL`,e[e.CLIP_DISTANCE0_WEBGL=12288]=`CLIP_DISTANCE0_WEBGL`,e[e.CLIP_DISTANCE1_WEBGL=12289]=`CLIP_DISTANCE1_WEBGL`,e[e.CLIP_DISTANCE2_WEBGL=12290]=`CLIP_DISTANCE2_WEBGL`,e[e.CLIP_DISTANCE3_WEBGL=12291]=`CLIP_DISTANCE3_WEBGL`,e[e.CLIP_DISTANCE4_WEBGL=12292]=`CLIP_DISTANCE4_WEBGL`,e[e.CLIP_DISTANCE5_WEBGL=12293]=`CLIP_DISTANCE5_WEBGL`,e[e.CLIP_DISTANCE6_WEBGL=12294]=`CLIP_DISTANCE6_WEBGL`,e[e.CLIP_DISTANCE7_WEBGL=12295]=`CLIP_DISTANCE7_WEBGL`,e[e.POLYGON_OFFSET_CLAMP_EXT=36379]=`POLYGON_OFFSET_CLAMP_EXT`,e[e.LOWER_LEFT_EXT=36001]=`LOWER_LEFT_EXT`,e[e.UPPER_LEFT_EXT=36002]=`UPPER_LEFT_EXT`,e[e.NEGATIVE_ONE_TO_ONE_EXT=37726]=`NEGATIVE_ONE_TO_ONE_EXT`,e[e.ZERO_TO_ONE_EXT=37727]=`ZERO_TO_ONE_EXT`,e[e.CLIP_ORIGIN_EXT=37724]=`CLIP_ORIGIN_EXT`,e[e.CLIP_DEPTH_MODE_EXT=37725]=`CLIP_DEPTH_MODE_EXT`,e[e.SRC1_COLOR_WEBGL=35065]=`SRC1_COLOR_WEBGL`,e[e.SRC1_ALPHA_WEBGL=34185]=`SRC1_ALPHA_WEBGL`,e[e.ONE_MINUS_SRC1_COLOR_WEBGL=35066]=`ONE_MINUS_SRC1_COLOR_WEBGL`,e[e.ONE_MINUS_SRC1_ALPHA_WEBGL=35067]=`ONE_MINUS_SRC1_ALPHA_WEBGL`,e[e.MAX_DUAL_SOURCE_DRAW_BUFFERS_WEBGL=35068]=`MAX_DUAL_SOURCE_DRAW_BUFFERS_WEBGL`,e[e.MIRROR_CLAMP_TO_EDGE_EXT=34627]=`MIRROR_CLAMP_TO_EDGE_EXT`,e}(q||{}),Kb={WEBGL_depth_texture:{UNSIGNED_INT_24_8_WEBGL:q.UNSIGNED_INT_24_8},OES_element_index_uint:{},OES_texture_float:{},OES_texture_half_float:{HALF_FLOAT_OES:q.HALF_FLOAT},EXT_color_buffer_float:{},OES_standard_derivatives:{FRAGMENT_SHADER_DERIVATIVE_HINT_OES:q.FRAGMENT_SHADER_DERIVATIVE_HINT},EXT_frag_depth:{},EXT_blend_minmax:{MIN_EXT:q.MIN,MAX_EXT:q.MAX},EXT_shader_texture_lod:{}},qb=e=>({drawBuffersWEBGL(t){return e.drawBuffers(t)},COLOR_ATTACHMENT0_WEBGL:q.COLOR_ATTACHMENT0,COLOR_ATTACHMENT1_WEBGL:q.COLOR_ATTACHMENT1,COLOR_ATTACHMENT2_WEBGL:q.COLOR_ATTACHMENT2,COLOR_ATTACHMENT3_WEBGL:q.COLOR_ATTACHMENT3}),Jb=e=>({VERTEX_ARRAY_BINDING_OES:q.VERTEX_ARRAY_BINDING,createVertexArrayOES(){return e.createVertexArray()},deleteVertexArrayOES(t){return e.deleteVertexArray(t)},isVertexArrayOES(t){return e.isVertexArray(t)},bindVertexArrayOES(t){return e.bindVertexArray(t)}}),Yb=e=>({VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE:35070,drawArraysInstancedANGLE(...t){return e.drawArraysInstanced(...t)},drawElementsInstancedANGLE(...t){return e.drawElementsInstanced(...t)},vertexAttribDivisorANGLE(...t){return e.vertexAttribDivisor(...t)}});function Xb(e=!0){let t=HTMLCanvasElement.prototype;if(!e&&t.originalGetContext){t.getContext=t.originalGetContext,t.originalGetContext=void 0;return}t.originalGetContext=t.getContext,t.getContext=function(e,t){if(e===`webgl`||e===`experimental-webgl`){let e=this.originalGetContext(`webgl2`,t);return e instanceof HTMLElement&&Zb(e),e}return this.originalGetContext(e,t)}}function Zb(e){e.getExtension(`EXT_color_buffer_float`);let t={...Kb,WEBGL_disjoint_timer_query:e.getExtension(`EXT_disjoint_timer_query_webgl2`),WEBGL_draw_buffers:qb(e),OES_vertex_array_object:Jb(e),ANGLE_instanced_arrays:Yb(e)},n=e.getExtension.bind(e);e.getExtension=function(e){return n(e)||(e in t?t[e]:null)};let r=e.getSupportedExtensions;e.getSupportedExtensions=function(){return(r.apply(e)||[])?.concat(Object.keys(t))}}var Qb=null,$b=null,ex=!1;async function tx(){if(!Qb){ax();return}await Qb.load()}function nx(e,t){return Qb?Qb.makeDebugContext(e,t):(ax(),e)}async function rx(e){if(!$b){ax();return}await $b.load(e)}function ix(e){return $b?.initialize(e)||null}function ax(){ex||(ex=!0,e.warn(`Import @luma.gl/core/webgl-debug before enabling WebGL debugging.`)())}var ox=`modulepreload`,sx=function(e){return`/next/standalone-examples/sketch-edges/`+e},cx={},lx=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=sx(t,n),t in cx)return;cx[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:ox,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},ux=1,dx=class extends To{type=`webgl`;enforceWebGL2(e){Xb(e)}isSupported(){return typeof WebGL2RenderingContext<`u`}isDeviceHandle(t){return typeof WebGL2RenderingContext<`u`&&t instanceof WebGL2RenderingContext?!0:(typeof WebGLRenderingContext<`u`&&t instanceof WebGLRenderingContext&&e.warn(`WebGL1 is not supported`,t)(),!1)}async attach(e,t={}){let{WebGLDevice:n}=await lx(async()=>{let{WebGLDevice:e}=await Promise.resolve().then(()=>bw);return{WebGLDevice:e}},void 0);if(e instanceof n)return e;let r=n.getDeviceFromContext(e);if(r)return r;if(!fx(e))throw Error(`Invalid WebGL2RenderingContext`);t=mx(t),await hx(t);let i=t.createCanvasContext===!0?{}:t.createCanvasContext;return new n({...t,_handle:e,createCanvasContext:{canvas:e.canvas,autoResize:!1,...i}})}async create(t={}){let{WebGLDevice:n}=await lx(async()=>{let{WebGLDevice:e}=await Promise.resolve().then(()=>bw);return{WebGLDevice:e}},void 0);t=mx(t),await hx(t);try{let r=new n(t);e.groupCollapsed(ux,`WebGLDevice ${r.id} created`)();let i=`\
${r._reused?`Reusing`:`Created`} device with WebGL2 ${r.props.debug?`debug `:``}context: \
${r.info.vendor}, ${r.info.renderer} for canvas: ${r.canvasContext.id}`;return e.probe(ux,i)(),e.table(ux,r.info)(),r}finally{e.groupEnd(ux)(),e.info(ux,`%cWebGL call tracing: luma.log.set('debug-webgl') `,`color: white; background: blue; padding: 2px 6px; border-radius: 3px;`)()}}};function fx(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:!!(e&&typeof e.createVertexArray==`function`)}var px=new dx;function mx(t){return{...t,debug:t.debug??se.defaultProps.debug,debugWebGL:t.debugWebGL??se.defaultProps.debugWebGL,debugSpectorJS:t.debugSpectorJS??!!e.get(`debug-spectorjs`)}}async function hx(t){let n=[];(t.debugWebGL||t.debug)&&n.push(tx()),t.debugSpectorJS&&n.push(rx(t));let r=await Promise.allSettled(n);for(let t of r)t.status===`rejected`&&e.error(`Failed to initialize debug libraries ${t.reason}`)()}var gx={[q.BLEND]:!1,[q.BLEND_COLOR]:new Float32Array([0,0,0,0]),[q.BLEND_EQUATION_RGB]:q.FUNC_ADD,[q.BLEND_EQUATION_ALPHA]:q.FUNC_ADD,[q.BLEND_SRC_RGB]:q.ONE,[q.BLEND_DST_RGB]:q.ZERO,[q.BLEND_SRC_ALPHA]:q.ONE,[q.BLEND_DST_ALPHA]:q.ZERO,[q.COLOR_CLEAR_VALUE]:new Float32Array([0,0,0,0]),[q.COLOR_WRITEMASK]:[!0,!0,!0,!0],[q.CULL_FACE]:!1,[q.CULL_FACE_MODE]:q.BACK,[q.DEPTH_TEST]:!1,[q.DEPTH_CLAMP_EXT]:!1,[q.DEPTH_CLEAR_VALUE]:1,[q.DEPTH_FUNC]:q.LESS,[q.DEPTH_RANGE]:new Float32Array([0,1]),[q.DEPTH_WRITEMASK]:!0,[q.DITHER]:!0,[q.CURRENT_PROGRAM]:null,[q.FRAMEBUFFER_BINDING]:null,[q.RENDERBUFFER_BINDING]:null,[q.VERTEX_ARRAY_BINDING]:null,[q.ARRAY_BUFFER_BINDING]:null,[q.FRONT_FACE]:q.CCW,[q.GENERATE_MIPMAP_HINT]:q.DONT_CARE,[q.LINE_WIDTH]:1,[q.POLYGON_OFFSET_FILL]:!1,[q.POLYGON_OFFSET_CLAMP_EXT]:0,[q.POLYGON_OFFSET_FACTOR]:0,[q.POLYGON_OFFSET_UNITS]:0,[q.SAMPLE_ALPHA_TO_COVERAGE]:!1,[q.SAMPLE_COVERAGE]:!1,[q.SAMPLE_COVERAGE_VALUE]:1,[q.SAMPLE_COVERAGE_INVERT]:!1,[q.SCISSOR_TEST]:!1,[q.SCISSOR_BOX]:new Int32Array([0,0,1024,1024]),[q.STENCIL_TEST]:!1,[q.STENCIL_CLEAR_VALUE]:0,[q.STENCIL_WRITEMASK]:4294967295,[q.STENCIL_BACK_WRITEMASK]:4294967295,[q.STENCIL_FUNC]:q.ALWAYS,[q.STENCIL_REF]:0,[q.STENCIL_VALUE_MASK]:4294967295,[q.STENCIL_BACK_FUNC]:q.ALWAYS,[q.STENCIL_BACK_REF]:0,[q.STENCIL_BACK_VALUE_MASK]:4294967295,[q.STENCIL_FAIL]:q.KEEP,[q.STENCIL_PASS_DEPTH_FAIL]:q.KEEP,[q.STENCIL_PASS_DEPTH_PASS]:q.KEEP,[q.STENCIL_BACK_FAIL]:q.KEEP,[q.STENCIL_BACK_PASS_DEPTH_FAIL]:q.KEEP,[q.STENCIL_BACK_PASS_DEPTH_PASS]:q.KEEP,[q.VIEWPORT]:[0,0,1024,1024],[q.TRANSFORM_FEEDBACK_BINDING]:null,[q.COPY_READ_BUFFER_BINDING]:null,[q.COPY_WRITE_BUFFER_BINDING]:null,[q.PIXEL_PACK_BUFFER_BINDING]:null,[q.PIXEL_UNPACK_BUFFER_BINDING]:null,[q.FRAGMENT_SHADER_DERIVATIVE_HINT]:q.DONT_CARE,[q.READ_FRAMEBUFFER_BINDING]:null,[q.RASTERIZER_DISCARD]:!1,[q.PACK_ALIGNMENT]:4,[q.UNPACK_ALIGNMENT]:4,[q.UNPACK_FLIP_Y_WEBGL]:!1,[q.UNPACK_PREMULTIPLY_ALPHA_WEBGL]:!1,[q.UNPACK_COLORSPACE_CONVERSION_WEBGL]:q.BROWSER_DEFAULT_WEBGL,[q.PACK_ROW_LENGTH]:0,[q.PACK_SKIP_PIXELS]:0,[q.PACK_SKIP_ROWS]:0,[q.UNPACK_ROW_LENGTH]:0,[q.UNPACK_IMAGE_HEIGHT]:0,[q.UNPACK_SKIP_PIXELS]:0,[q.UNPACK_SKIP_ROWS]:0,[q.UNPACK_SKIP_IMAGES]:0,[q.CLIP_ORIGIN_EXT]:q.LOWER_LEFT_EXT,[q.CLIP_DEPTH_MODE_EXT]:q.NEGATIVE_ONE_TO_ONE_EXT},J=(e,t,n)=>t?e.enable(n):e.disable(n),_x=(e,t,n)=>e.hint(n,t),Y=(e,t,n)=>e.pixelStorei(n,t),vx=(e,t,n)=>{let r=n===q.FRAMEBUFFER_BINDING?q.DRAW_FRAMEBUFFER:q.READ_FRAMEBUFFER;return e.bindFramebuffer(r,t)},yx=(e,t,n)=>{let r={[q.ARRAY_BUFFER_BINDING]:q.ARRAY_BUFFER,[q.COPY_READ_BUFFER_BINDING]:q.COPY_READ_BUFFER,[q.COPY_WRITE_BUFFER_BINDING]:q.COPY_WRITE_BUFFER,[q.PIXEL_PACK_BUFFER_BINDING]:q.PIXEL_PACK_BUFFER,[q.PIXEL_UNPACK_BUFFER_BINDING]:q.PIXEL_UNPACK_BUFFER}[n];e.bindBuffer(r,t)};function bx(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}var xx={[q.BLEND]:J,[q.BLEND_COLOR]:(e,t)=>e.blendColor(...t),[q.BLEND_EQUATION_RGB]:`blendEquation`,[q.BLEND_EQUATION_ALPHA]:`blendEquation`,[q.BLEND_SRC_RGB]:`blendFunc`,[q.BLEND_DST_RGB]:`blendFunc`,[q.BLEND_SRC_ALPHA]:`blendFunc`,[q.BLEND_DST_ALPHA]:`blendFunc`,[q.COLOR_CLEAR_VALUE]:(e,t)=>e.clearColor(...t),[q.COLOR_WRITEMASK]:(e,t)=>e.colorMask(...t),[q.CULL_FACE]:J,[q.CULL_FACE_MODE]:(e,t)=>e.cullFace(t),[q.DEPTH_TEST]:J,[q.DEPTH_CLEAR_VALUE]:(e,t)=>e.clearDepth(t),[q.DEPTH_FUNC]:(e,t)=>e.depthFunc(t),[q.DEPTH_RANGE]:(e,t)=>e.depthRange(...t),[q.DEPTH_WRITEMASK]:(e,t)=>e.depthMask(t),[q.DITHER]:J,[q.FRAGMENT_SHADER_DERIVATIVE_HINT]:_x,[q.CURRENT_PROGRAM]:(e,t)=>e.useProgram(t),[q.RENDERBUFFER_BINDING]:(e,t)=>e.bindRenderbuffer(q.RENDERBUFFER,t),[q.TRANSFORM_FEEDBACK_BINDING]:(e,t)=>e.bindTransformFeedback?.(q.TRANSFORM_FEEDBACK,t),[q.VERTEX_ARRAY_BINDING]:(e,t)=>e.bindVertexArray(t),[q.FRAMEBUFFER_BINDING]:vx,[q.READ_FRAMEBUFFER_BINDING]:vx,[q.ARRAY_BUFFER_BINDING]:yx,[q.COPY_READ_BUFFER_BINDING]:yx,[q.COPY_WRITE_BUFFER_BINDING]:yx,[q.PIXEL_PACK_BUFFER_BINDING]:yx,[q.PIXEL_UNPACK_BUFFER_BINDING]:yx,[q.FRONT_FACE]:(e,t)=>e.frontFace(t),[q.GENERATE_MIPMAP_HINT]:_x,[q.LINE_WIDTH]:(e,t)=>e.lineWidth(t),[q.POLYGON_OFFSET_FILL]:J,[q.POLYGON_OFFSET_CLAMP_EXT]:`polygonOffset`,[q.POLYGON_OFFSET_FACTOR]:`polygonOffset`,[q.POLYGON_OFFSET_UNITS]:`polygonOffset`,[q.RASTERIZER_DISCARD]:J,[q.SAMPLE_ALPHA_TO_COVERAGE]:J,[q.SAMPLE_COVERAGE]:J,[q.SAMPLE_COVERAGE_VALUE]:`sampleCoverage`,[q.SAMPLE_COVERAGE_INVERT]:`sampleCoverage`,[q.SCISSOR_TEST]:J,[q.SCISSOR_BOX]:(e,t)=>e.scissor(...t),[q.STENCIL_TEST]:J,[q.STENCIL_CLEAR_VALUE]:(e,t)=>e.clearStencil(t),[q.STENCIL_WRITEMASK]:(e,t)=>e.stencilMaskSeparate(q.FRONT,t),[q.STENCIL_BACK_WRITEMASK]:(e,t)=>e.stencilMaskSeparate(q.BACK,t),[q.STENCIL_FUNC]:`stencilFuncFront`,[q.STENCIL_REF]:`stencilFuncFront`,[q.STENCIL_VALUE_MASK]:`stencilFuncFront`,[q.STENCIL_BACK_FUNC]:`stencilFuncBack`,[q.STENCIL_BACK_REF]:`stencilFuncBack`,[q.STENCIL_BACK_VALUE_MASK]:`stencilFuncBack`,[q.STENCIL_FAIL]:`stencilOpFront`,[q.STENCIL_PASS_DEPTH_FAIL]:`stencilOpFront`,[q.STENCIL_PASS_DEPTH_PASS]:`stencilOpFront`,[q.STENCIL_BACK_FAIL]:`stencilOpBack`,[q.STENCIL_BACK_PASS_DEPTH_FAIL]:`stencilOpBack`,[q.STENCIL_BACK_PASS_DEPTH_PASS]:`stencilOpBack`,[q.VIEWPORT]:(e,t)=>e.viewport(...t),[q.DEPTH_CLAMP_EXT]:(e,t)=>{e.getExtension(`EXT_depth_clamp`)&&J(e,t,q.DEPTH_CLAMP_EXT)},[q.CLIP_ORIGIN_EXT]:`clipControl`,[q.CLIP_DEPTH_MODE_EXT]:`clipControl`,[q.POLYGON_OFFSET_LINE_WEBGL]:J,[q.CLIP_DISTANCE0_WEBGL]:J,[q.CLIP_DISTANCE1_WEBGL]:J,[q.CLIP_DISTANCE2_WEBGL]:J,[q.CLIP_DISTANCE3_WEBGL]:J,[q.CLIP_DISTANCE4_WEBGL]:J,[q.CLIP_DISTANCE5_WEBGL]:J,[q.CLIP_DISTANCE6_WEBGL]:J,[q.CLIP_DISTANCE7_WEBGL]:J,[q.PACK_ALIGNMENT]:Y,[q.UNPACK_ALIGNMENT]:Y,[q.UNPACK_FLIP_Y_WEBGL]:Y,[q.UNPACK_PREMULTIPLY_ALPHA_WEBGL]:Y,[q.UNPACK_COLORSPACE_CONVERSION_WEBGL]:Y,[q.PACK_ROW_LENGTH]:Y,[q.PACK_SKIP_PIXELS]:Y,[q.PACK_SKIP_ROWS]:Y,[q.UNPACK_ROW_LENGTH]:Y,[q.UNPACK_IMAGE_HEIGHT]:Y,[q.UNPACK_SKIP_PIXELS]:Y,[q.UNPACK_SKIP_ROWS]:Y,[q.UNPACK_SKIP_IMAGES]:Y,framebuffer:(e,t)=>{let n=t&&`handle`in t?t.handle:t;return e.bindFramebuffer(q.FRAMEBUFFER,n)},blend:(e,t)=>t?e.enable(q.BLEND):e.disable(q.BLEND),blendColor:(e,t)=>e.blendColor(...t),blendEquation:(e,t)=>{let n=typeof t==`number`?[t,t]:t;e.blendEquationSeparate(...n)},blendFunc:(e,t)=>{let n=t?.length===2?[...t,...t]:t;e.blendFuncSeparate(...n)},clearColor:(e,t)=>e.clearColor(...t),clearDepth:(e,t)=>e.clearDepth(t),clearStencil:(e,t)=>e.clearStencil(t),colorMask:(e,t)=>e.colorMask(...t),cull:(e,t)=>t?e.enable(q.CULL_FACE):e.disable(q.CULL_FACE),cullFace:(e,t)=>e.cullFace(t),depthTest:(e,t)=>t?e.enable(q.DEPTH_TEST):e.disable(q.DEPTH_TEST),depthFunc:(e,t)=>e.depthFunc(t),depthMask:(e,t)=>e.depthMask(t),depthRange:(e,t)=>e.depthRange(...t),dither:(e,t)=>t?e.enable(q.DITHER):e.disable(q.DITHER),derivativeHint:(e,t)=>{e.hint(q.FRAGMENT_SHADER_DERIVATIVE_HINT,t)},frontFace:(e,t)=>e.frontFace(t),mipmapHint:(e,t)=>e.hint(q.GENERATE_MIPMAP_HINT,t),lineWidth:(e,t)=>e.lineWidth(t),polygonOffsetFill:(e,t)=>t?e.enable(q.POLYGON_OFFSET_FILL):e.disable(q.POLYGON_OFFSET_FILL),polygonOffset:(e,t)=>e.polygonOffset(...t),sampleCoverage:(e,t)=>e.sampleCoverage(t[0],t[1]||!1),scissorTest:(e,t)=>t?e.enable(q.SCISSOR_TEST):e.disable(q.SCISSOR_TEST),scissor:(e,t)=>e.scissor(...t),stencilTest:(e,t)=>t?e.enable(q.STENCIL_TEST):e.disable(q.STENCIL_TEST),stencilMask:(e,t)=>{t=bx(t)?t:[t,t];let[n,r]=t;e.stencilMaskSeparate(q.FRONT,n),e.stencilMaskSeparate(q.BACK,r)},stencilFunc:(e,t)=>{t=bx(t)&&t.length===3?[...t,...t]:t;let[n,r,i,a,o,s]=t;e.stencilFuncSeparate(q.FRONT,n,r,i),e.stencilFuncSeparate(q.BACK,a,o,s)},stencilOp:(e,t)=>{t=bx(t)&&t.length===3?[...t,...t]:t;let[n,r,i,a,o,s]=t;e.stencilOpSeparate(q.FRONT,n,r,i),e.stencilOpSeparate(q.BACK,a,o,s)},viewport:(e,t)=>e.viewport(...t)};function X(e,t,n){return t[e]===void 0?n[e]:t[e]}var Sx={clipControl:(e,t,n)=>{let r=e.getExtension(`EXT_clip_control`);if(!r)return;let i=X(q.CLIP_ORIGIN_EXT,t,n),a=X(q.CLIP_DEPTH_MODE_EXT,t,n),{valueChanged:o}=e.lumaState._updateCache({[q.CLIP_ORIGIN_EXT]:i,[q.CLIP_DEPTH_MODE_EXT]:a});o&&r.clipControlEXT(i,a)},blendEquation:(e,t,n)=>e.blendEquationSeparate(X(q.BLEND_EQUATION_RGB,t,n),X(q.BLEND_EQUATION_ALPHA,t,n)),blendFunc:(e,t,n)=>e.blendFuncSeparate(X(q.BLEND_SRC_RGB,t,n),X(q.BLEND_DST_RGB,t,n),X(q.BLEND_SRC_ALPHA,t,n),X(q.BLEND_DST_ALPHA,t,n)),polygonOffset:(e,t,n)=>{let r=X(q.POLYGON_OFFSET_FACTOR,t,n),i=X(q.POLYGON_OFFSET_UNITS,t,n),a=X(q.POLYGON_OFFSET_CLAMP_EXT,t,n);if(!a){e.polygonOffset(r,i);return}let o=e.getExtension(`EXT_polygon_offset_clamp`);o&&e.lumaState._updateCache({[q.POLYGON_OFFSET_FACTOR]:r,[q.POLYGON_OFFSET_UNITS]:i,[q.POLYGON_OFFSET_CLAMP_EXT]:a}).valueChanged&&o.polygonOffsetClampEXT(r,i,a)},sampleCoverage:(e,t,n)=>e.sampleCoverage(X(q.SAMPLE_COVERAGE_VALUE,t,n),X(q.SAMPLE_COVERAGE_INVERT,t,n)),stencilFuncFront:(e,t,n)=>e.stencilFuncSeparate(q.FRONT,X(q.STENCIL_FUNC,t,n),X(q.STENCIL_REF,t,n),X(q.STENCIL_VALUE_MASK,t,n)),stencilFuncBack:(e,t,n)=>e.stencilFuncSeparate(q.BACK,X(q.STENCIL_BACK_FUNC,t,n),X(q.STENCIL_BACK_REF,t,n),X(q.STENCIL_BACK_VALUE_MASK,t,n)),stencilOpFront:(e,t,n)=>e.stencilOpSeparate(q.FRONT,X(q.STENCIL_FAIL,t,n),X(q.STENCIL_PASS_DEPTH_FAIL,t,n),X(q.STENCIL_PASS_DEPTH_PASS,t,n)),stencilOpBack:(e,t,n)=>e.stencilOpSeparate(q.BACK,X(q.STENCIL_BACK_FAIL,t,n),X(q.STENCIL_BACK_PASS_DEPTH_FAIL,t,n),X(q.STENCIL_BACK_PASS_DEPTH_PASS,t,n))},Cx={[q.ARRAY_BUFFER]:q.ARRAY_BUFFER_BINDING,[q.COPY_READ_BUFFER]:q.COPY_READ_BUFFER_BINDING,[q.COPY_WRITE_BUFFER]:q.COPY_WRITE_BUFFER_BINDING,[q.PIXEL_PACK_BUFFER]:q.PIXEL_PACK_BUFFER_BINDING,[q.PIXEL_UNPACK_BUFFER]:q.PIXEL_UNPACK_BUFFER_BINDING},wx={enable:{value:!0},disable:{value:!1},pixelStorei:{},hint:{},clearDepth:{parameter:q.DEPTH_CLEAR_VALUE},clearStencil:{parameter:q.STENCIL_CLEAR_VALUE},cullFace:{parameter:q.CULL_FACE_MODE},depthFunc:{parameter:q.DEPTH_FUNC},depthMask:{parameter:q.DEPTH_WRITEMASK},frontFace:{parameter:q.FRONT_FACE},lineWidth:{parameter:q.LINE_WIDTH}},Tx={useProgram:(e,t)=>e({[q.CURRENT_PROGRAM]:t}),bindRenderbuffer:(e,t,n)=>e({[q.RENDERBUFFER_BINDING]:n}),bindTransformFeedback:(e,t,n)=>e({[q.TRANSFORM_FEEDBACK_BINDING]:n}),bindVertexArray:(e,t)=>e({[q.VERTEX_ARRAY_BINDING]:t}),bindFramebuffer:(e,t,n)=>{switch(t){case q.FRAMEBUFFER:return e({[q.DRAW_FRAMEBUFFER_BINDING]:n,[q.READ_FRAMEBUFFER_BINDING]:n});case q.DRAW_FRAMEBUFFER:return e({[q.DRAW_FRAMEBUFFER_BINDING]:n});case q.READ_FRAMEBUFFER:return e({[q.READ_FRAMEBUFFER_BINDING]:n});default:return null}},bindBuffer:(e,t,n)=>{let r=Cx[t];return r?e({[r]:n}):{valueChanged:!0}},blendColor:(e,t,n,r,i)=>e({[q.BLEND_COLOR]:new Float32Array([t,n,r,i])}),blendEquation:(e,t)=>e({[q.BLEND_EQUATION_RGB]:t,[q.BLEND_EQUATION_ALPHA]:t}),blendEquationSeparate:(e,t,n)=>e({[q.BLEND_EQUATION_RGB]:t,[q.BLEND_EQUATION_ALPHA]:n}),blendFunc:(e,t,n)=>e({[q.BLEND_SRC_RGB]:t,[q.BLEND_DST_RGB]:n,[q.BLEND_SRC_ALPHA]:t,[q.BLEND_DST_ALPHA]:n}),blendFuncSeparate:(e,t,n,r,i)=>e({[q.BLEND_SRC_RGB]:t,[q.BLEND_DST_RGB]:n,[q.BLEND_SRC_ALPHA]:r,[q.BLEND_DST_ALPHA]:i}),clearColor:(e,t,n,r,i)=>e({[q.COLOR_CLEAR_VALUE]:new Float32Array([t,n,r,i])}),colorMask:(e,t,n,r,i)=>e({[q.COLOR_WRITEMASK]:[t,n,r,i]}),depthRange:(e,t,n)=>e({[q.DEPTH_RANGE]:new Float32Array([t,n])}),polygonOffset:(e,t,n)=>e({[q.POLYGON_OFFSET_FACTOR]:t,[q.POLYGON_OFFSET_UNITS]:n,[q.POLYGON_OFFSET_CLAMP_EXT]:0}),sampleCoverage:(e,t,n)=>e({[q.SAMPLE_COVERAGE_VALUE]:t,[q.SAMPLE_COVERAGE_INVERT]:n}),scissor:(e,t,n,r,i)=>e({[q.SCISSOR_BOX]:new Int32Array([t,n,r,i])}),stencilMask:(e,t)=>e({[q.STENCIL_WRITEMASK]:t,[q.STENCIL_BACK_WRITEMASK]:t}),stencilMaskSeparate:(e,t,n)=>e({[t===q.FRONT?q.STENCIL_WRITEMASK:q.STENCIL_BACK_WRITEMASK]:n}),stencilFunc:(e,t,n,r)=>e({[q.STENCIL_FUNC]:t,[q.STENCIL_REF]:n,[q.STENCIL_VALUE_MASK]:r,[q.STENCIL_BACK_FUNC]:t,[q.STENCIL_BACK_REF]:n,[q.STENCIL_BACK_VALUE_MASK]:r}),stencilFuncSeparate:(e,t,n,r,i)=>e({[t===q.FRONT?q.STENCIL_FUNC:q.STENCIL_BACK_FUNC]:n,[t===q.FRONT?q.STENCIL_REF:q.STENCIL_BACK_REF]:r,[t===q.FRONT?q.STENCIL_VALUE_MASK:q.STENCIL_BACK_VALUE_MASK]:i}),stencilOp:(e,t,n,r)=>e({[q.STENCIL_FAIL]:t,[q.STENCIL_PASS_DEPTH_FAIL]:n,[q.STENCIL_PASS_DEPTH_PASS]:r,[q.STENCIL_BACK_FAIL]:t,[q.STENCIL_BACK_PASS_DEPTH_FAIL]:n,[q.STENCIL_BACK_PASS_DEPTH_PASS]:r}),stencilOpSeparate:(e,t,n,r,i)=>e({[t===q.FRONT?q.STENCIL_FAIL:q.STENCIL_BACK_FAIL]:n,[t===q.FRONT?q.STENCIL_PASS_DEPTH_FAIL:q.STENCIL_BACK_PASS_DEPTH_FAIL]:r,[t===q.FRONT?q.STENCIL_PASS_DEPTH_PASS:q.STENCIL_BACK_PASS_DEPTH_PASS]:i}),viewport:(e,t,n,r,i)=>e({[q.VIEWPORT]:[t,n,r,i]})},Ex=(e,t)=>e.isEnabled(t),Dx=(e,t)=>e.getExtension(`EXT_clip_control`)?e.getParameter(t):gx[t],Ox={[q.BLEND]:Ex,[q.CULL_FACE]:Ex,[q.DEPTH_TEST]:Ex,[q.DEPTH_CLAMP_EXT]:e=>!!e.getExtension(`EXT_depth_clamp`)&&e.isEnabled(q.DEPTH_CLAMP_EXT),[q.DITHER]:Ex,[q.POLYGON_OFFSET_CLAMP_EXT]:e=>e.getExtension(`EXT_polygon_offset_clamp`)?e.getParameter(q.POLYGON_OFFSET_CLAMP_EXT):0,[q.POLYGON_OFFSET_FILL]:Ex,[q.SAMPLE_ALPHA_TO_COVERAGE]:Ex,[q.SAMPLE_COVERAGE]:Ex,[q.SCISSOR_TEST]:Ex,[q.STENCIL_TEST]:Ex,[q.RASTERIZER_DISCARD]:Ex,[q.CLIP_ORIGIN_EXT]:Dx,[q.CLIP_DEPTH_MODE_EXT]:Dx},kx=new Set([q.ACTIVE_TEXTURE,q.TRANSFORM_FEEDBACK_ACTIVE,q.TRANSFORM_FEEDBACK_PAUSED,q.TRANSFORM_FEEDBACK_BUFFER_BINDING,q.UNIFORM_BUFFER_BINDING,q.ELEMENT_ARRAY_BUFFER_BINDING,q.IMPLEMENTATION_COLOR_READ_FORMAT,q.IMPLEMENTATION_COLOR_READ_TYPE,q.READ_BUFFER,q.DRAW_BUFFER0,q.DRAW_BUFFER1,q.DRAW_BUFFER2,q.DRAW_BUFFER3,q.DRAW_BUFFER4,q.DRAW_BUFFER5,q.DRAW_BUFFER6,q.DRAW_BUFFER7,q.DRAW_BUFFER8,q.DRAW_BUFFER9,q.DRAW_BUFFER10,q.DRAW_BUFFER11,q.DRAW_BUFFER12,q.DRAW_BUFFER13,q.DRAW_BUFFER14,q.DRAW_BUFFER15,q.SAMPLER_BINDING,q.TEXTURE_BINDING_2D,q.TEXTURE_BINDING_2D_ARRAY,q.TEXTURE_BINDING_3D,q.TEXTURE_BINDING_CUBE_MAP]);function Ax(e,t){if(Nx(t))return;let n={};for(let r in t){let i=Number(r),a=xx[r];a&&(typeof a==`string`?n[a]=!0:a(e,t[r],i))}let r=e.lumaState?.cache;if(r)for(let i in n){let n=Sx[i];n(e,t,r)}}function jx(e,t=gx){if(typeof t==`number`){let n=t,r=Ox[n];return r?r(e,n):e.getParameter(n)}let n=Array.isArray(t)?t:Object.keys(t),r={};for(let t of n){let n=Ox[t];r[t]=n?n(e,Number(t)):e.getParameter(Number(t))}return r}function Mx(e){Ax(e,gx)}function Nx(e){for(let t in e)return!1;return!0}function Px(e,t){if(e===t)return!0;if(Fx(e)&&Fx(t)&&e.length===t.length){for(let n=0;n<e.length;++n)if(e[n]!==t[n])return!1;return!0}return!1}function Fx(e){return Array.isArray(e)||ArrayBuffer.isView(e)}var Ix=class{static get(e){return e.lumaState}gl;program=null;stateStack=[];enable=!0;cache=null;log;initialized=!1;constructor(e,t){this.gl=e,this.log=t?.log||(()=>{}),this._updateCache=this._updateCache.bind(this),Object.seal(this)}push(e={}){this.stateStack.push({})}pop(){let e=this.stateStack[this.stateStack.length-1];Ax(this.gl,e),this.stateStack.pop()}invalidateDeletedBinding(e,t){this.cache[e]===t&&(this.cache[e]=null);for(let n of this.stateStack)n[e]===t&&(n[e]=null)}trackState(e,t){if(this.initialized||t?.copyState){let t=this.enable;this.enable=!1;try{this.cache=jx(e),this.program=this.cache[q.CURRENT_PROGRAM],this.stateStack.length=0}finally{this.enable=t}if(this.initialized)return}else this.cache={...gx},this.cache[q.VIEWPORT]=e.getParameter(q.VIEWPORT),this.cache[q.SCISSOR_BOX]=e.getParameter(q.SCISSOR_BOX);this.initialized=!0,this.gl.lumaState=this,Bx(e),Vx(e,`deleteFramebuffer`,[q.DRAW_FRAMEBUFFER_BINDING,q.READ_FRAMEBUFFER_BINDING]),Vx(e,`deleteRenderbuffer`,[q.RENDERBUFFER_BINDING]),Vx(e,`deleteVertexArray`,[q.VERTEX_ARRAY_BINDING]);for(let t in Tx){let n=Tx[t];Rx(e,t,n)}for(let t in wx)zx(e,t,wx[t]);Lx(e,`getParameter`),Lx(e,`isEnabled`)}_updateScalar(e,t){let n=this.cache[e];if(t===n)return!1;let r=this.stateStack[this.stateStack.length-1];return r&&!(e in r)&&(r[e]=n),this.cache[e]=t,!0}_updateCache(e){let t=!1,n,r=this.stateStack.length>0?this.stateStack[this.stateStack.length-1]:null;for(let i in e){let a=e[i],o=this.cache[i];Px(a,o)||(t=!0,n=o,r&&!(i in r)&&(r[i]=o),this.cache[i]=a)}return{valueChanged:t,oldValue:n}}};function Lx(e,t){let n=e[t].bind(e);e[t]=function(t){if(t===void 0||kx.has(t))return n(t);let r=Ix.get(e);return t in r.cache||(r.cache[t]=n(t)),r.enable?r.cache[t]:n(t)},Object.defineProperty(e[t],`name`,{value:`${t}-from-cache`,configurable:!1})}function Rx(e,t,n){if(!e[t])return;let r=e[t].bind(e);e[t]=function(...t){let{valueChanged:i,oldValue:a}=n(Ix.get(e)._updateCache,...t);return i&&r(...t),a},Object.defineProperty(e[t],`name`,{value:`${t}-to-cache`,configurable:!1})}function zx(e,t,n){if(!e[t])return;let r=e[t].bind(e);e[t]=function(t,i){let a=n.parameter??t,o=n.value??(n.parameter===void 0?i:t),s=Ix.get(e),c=s.cache[a];if(s._updateScalar(a,o))return r(t,i),c},Object.defineProperty(e[t],`name`,{value:`${t}-to-cache`,configurable:!1})}function Bx(e){let t=e.useProgram.bind(e);e.useProgram=function(n){let r=Ix.get(e);r.program!==n&&(t(n),r.program=n)}}function Vx(e,t,n){let r=e[t].bind(e);e[t]=function(t){if(r(t),t!==null){let r=Ix.get(e);for(let e of n)r.invalidateDeletedBinding(e,t)}}}function Hx(e){let t=e.luma||{_polyfilled:!1,extensions:{},softwareRenderer:!1};return t._polyfilled??=!1,t.extensions||={},e.luma=t,t}function Ux(e,t,n){let r=``,i=e=>{let t=e.statusMessage;t&&(r||=t)};e.addEventListener(`webglcontextcreationerror`,i,!1);let a=n.failIfMajorPerformanceCaveat!==!0,o={preserveDrawingBuffer:!0,...n,failIfMajorPerformanceCaveat:!0},s=null;try{s||=e.getContext(`webgl2`,o),!s&&o.failIfMajorPerformanceCaveat&&(r||="Only software GPU is available. Set `failIfMajorPerformanceCaveat: false` to allow.");let n=!1;if(!s&&a&&(o.failIfMajorPerformanceCaveat=!1,s=e.getContext(`webgl2`,o),n=!0),s||(s=e.getContext(`webgl`,{}),s&&(s=null,r||=`Your browser only supports WebGL1`)),!s)throw r||=`Your browser does not support WebGL`,Error(`Failed to create WebGL context: ${r}`);let i=Hx(s);return i.softwareRenderer=n,e.addEventListener(`webglcontextlost`,t.onContextLost,{signal:t.signal}),e.addEventListener(`webglcontextrestored`,t.onContextRestored,{signal:t.signal}),s}finally{e.removeEventListener(`webglcontextcreationerror`,i,!1)}}function Wx(e,t,n){return n[t]===void 0&&(n[t]=e.getExtension(t)||null),n[t]}function Gx(e,t){let n=e.getParameter(q.VENDOR),r=e.getParameter(q.RENDERER);Wx(e,`WEBGL_debug_renderer_info`,t);let i=t.WEBGL_debug_renderer_info,a=e.getParameter(i?i.UNMASKED_VENDOR_WEBGL:q.VENDOR),o=e.getParameter(i?i.UNMASKED_RENDERER_WEBGL:q.RENDERER),s=a||n,c=o||r,l=e.getParameter(q.VERSION),u=Kx(s,c),d=qx(s,c);return{type:`webgl`,gpu:u,gpuType:Jx(s,c),gpuBackend:d,vendor:s,renderer:c,version:l,shadingLanguage:`glsl`,shadingLanguageVersion:300}}function Kx(e,t){return/NVIDIA/i.exec(e)||/NVIDIA/i.exec(t)?`nvidia`:/INTEL/i.exec(e)||/INTEL/i.exec(t)?`intel`:/Apple/i.exec(e)||/Apple/i.exec(t)?`apple`:/AMD/i.exec(e)||/AMD/i.exec(t)||/ATI/i.exec(e)||/ATI/i.exec(t)?`amd`:/SwiftShader/i.exec(e)||/SwiftShader/i.exec(t)?`software`:`unknown`}function qx(e,t){return/Metal/i.exec(e)||/Metal/i.exec(t)?`metal`:/ANGLE/i.exec(e)||/ANGLE/i.exec(t)?`opengl`:`unknown`}function Jx(e,t){if(/SwiftShader/i.exec(e)||/SwiftShader/i.exec(t))return`cpu`;switch(Kx(e,t)){case`apple`:return Yx(e,t)?`integrated`:`unknown`;case`intel`:return`integrated`;case`software`:return`cpu`;case`unknown`:return`unknown`;default:return`discrete`}}function Yx(e,t){return/Apple (M\d|A\d|GPU)/i.test(`${e} ${t}`)}function Xx(e){switch(e){case`uint8`:return q.UNSIGNED_BYTE;case`sint8`:return q.BYTE;case`unorm8`:return q.UNSIGNED_BYTE;case`snorm8`:return q.BYTE;case`uint16`:return q.UNSIGNED_SHORT;case`sint16`:return q.SHORT;case`unorm16`:return q.UNSIGNED_SHORT;case`snorm16`:return q.SHORT;case`uint32`:return q.UNSIGNED_INT;case`sint32`:return q.INT;case`float16`:return q.HALF_FLOAT;case`float32`:return q.FLOAT}throw Error(String(e))}var Zx=`WEBGL_compressed_texture_s3tc`,Qx=`WEBGL_compressed_texture_s3tc_srgb`,$x=`EXT_texture_compression_rgtc`,eS=`EXT_texture_compression_bptc`,tS=`WEBGL_compressed_texture_etc`,nS=`WEBGL_compressed_texture_astc`,rS=`WEBGL_compressed_texture_etc1`,iS=`WEBGL_compressed_texture_pvrtc`,aS=`WEBGL_compressed_texture_atc`,oS=`EXT_texture_norm16`,sS=`EXT_render_snorm`,cS=`EXT_color_buffer_float`,lS=`snorm8-renderable-webgl`,uS=`norm16-renderable-webgl`,dS=`snorm16-renderable-webgl`,fS=`float16-renderable-webgl`,pS=`float32-renderable-webgl`,mS=`rgb9e5ufloat-renderable-webgl`,hS={"float32-renderable-webgl":{extensions:[cS]},"float16-renderable-webgl":{extensions:[`EXT_color_buffer_half_float`]},"rgb9e5ufloat-renderable-webgl":{extensions:[`WEBGL_render_shared_exponent`]},"snorm8-renderable-webgl":{extensions:[sS]},"norm16-webgl":{extensions:[oS]},"norm16-renderable-webgl":{features:[`norm16-webgl`]},"snorm16-renderable-webgl":{features:[`norm16-webgl`],extensions:[sS]},"float32-filterable":{extensions:[`OES_texture_float_linear`]},"float16-filterable-webgl":{extensions:[`OES_texture_half_float_linear`]},"texture-filterable-anisotropic-webgl":{extensions:[`EXT_texture_filter_anisotropic`]},"texture-blend-float-webgl":{extensions:[`EXT_float_blend`]},"texture-compression-bc":{extensions:[Zx,Qx,$x,eS]},"texture-compression-bc5-webgl":{extensions:[$x]},"texture-compression-bc7-webgl":{extensions:[eS]},"texture-compression-etc2":{extensions:[tS]},"texture-compression-astc":{extensions:[nS]},"texture-compression-etc1-webgl":{extensions:[rS]},"texture-compression-pvrtc-webgl":{extensions:[iS]},"texture-compression-atc-webgl":{extensions:[aS]}};function gS(e){return e in hS}function _S(e,t,n){return vS(e,t,n,new Set)}function vS(e,t,n,r){let i=hS[t];if(!i||r.has(t))return!1;r.add(t);let a=(i.features||[]).every(t=>vS(e,t,n,r));return r.delete(t),a?(i.extensions||[]).every(t=>!!Wx(e,t,n)):!1}var yS={r8unorm:{gl:q.R8,rb:!0},r8snorm:{gl:q.R8_SNORM,r:lS},r8uint:{gl:q.R8UI,rb:!0},r8sint:{gl:q.R8I,rb:!0},rg8unorm:{gl:q.RG8,rb:!0},rg8snorm:{gl:q.RG8_SNORM,r:lS},rg8uint:{gl:q.RG8UI,rb:!0},rg8sint:{gl:q.RG8I,rb:!0},r16uint:{gl:q.R16UI,rb:!0},r16sint:{gl:q.R16I,rb:!0},r16float:{gl:q.R16F,rb:!0,r:fS},r16unorm:{gl:q.R16_EXT,rb:!0,r:uS},r16snorm:{gl:q.R16_SNORM_EXT,r:dS},"rgba4unorm-webgl":{gl:q.RGBA4,rb:!0},"rgb565unorm-webgl":{gl:q.RGB565,rb:!0},"rgb5a1unorm-webgl":{gl:q.RGB5_A1,rb:!0},"rgb8unorm-webgl":{gl:q.RGB8},"rgb8snorm-webgl":{gl:q.RGB8_SNORM},rgba8unorm:{gl:q.RGBA8},"rgba8unorm-srgb":{gl:q.SRGB8_ALPHA8},rgba8snorm:{gl:q.RGBA8_SNORM,r:lS},rgba8uint:{gl:q.RGBA8UI},rgba8sint:{gl:q.RGBA8I},bgra8unorm:{},"bgra8unorm-srgb":{},rg16uint:{gl:q.RG16UI},rg16sint:{gl:q.RG16I},rg16float:{gl:q.RG16F,rb:!0,r:fS},rg16unorm:{gl:q.RG16_EXT,r:uS},rg16snorm:{gl:q.RG16_SNORM_EXT,r:dS},r32uint:{gl:q.R32UI,rb:!0},r32sint:{gl:q.R32I,rb:!0},r32float:{gl:q.R32F,r:pS},rgb9e5ufloat:{gl:q.RGB9_E5,r:mS},rg11b10ufloat:{gl:q.R11F_G11F_B10F,rb:!0},rgb10a2unorm:{gl:q.RGB10_A2,rb:!0},rgb10a2uint:{gl:q.RGB10_A2UI,rb:!0},"rgb16unorm-webgl":{gl:q.RGB16_EXT,r:!1},"rgb16snorm-webgl":{gl:q.RGB16_SNORM_EXT,r:!1},rg32uint:{gl:q.RG32UI,rb:!0},rg32sint:{gl:q.RG32I,rb:!0},rg32float:{gl:q.RG32F,rb:!0,r:pS},rgba16uint:{gl:q.RGBA16UI,rb:!0},rgba16sint:{gl:q.RGBA16I,rb:!0},rgba16float:{gl:q.RGBA16F,r:fS},rgba16unorm:{gl:q.RGBA16_EXT,rb:!0,r:uS},rgba16snorm:{gl:q.RGBA16_SNORM_EXT,r:dS},"rgb32float-webgl":{gl:q.RGB32F,x:cS,r:pS,dataFormat:q.RGB,types:[q.FLOAT]},rgba32uint:{gl:q.RGBA32UI,rb:!0},rgba32sint:{gl:q.RGBA32I,rb:!0},rgba32float:{gl:q.RGBA32F,rb:!0,r:pS},stencil8:{gl:q.STENCIL_INDEX8,rb:!0},depth16unorm:{gl:q.DEPTH_COMPONENT16,dataFormat:q.DEPTH_COMPONENT,types:[q.UNSIGNED_SHORT],rb:!0},depth24plus:{gl:q.DEPTH_COMPONENT24,dataFormat:q.DEPTH_COMPONENT,types:[q.UNSIGNED_INT]},depth32float:{gl:q.DEPTH_COMPONENT32F,dataFormat:q.DEPTH_COMPONENT,types:[q.FLOAT],rb:!0},"depth24plus-stencil8":{gl:q.DEPTH24_STENCIL8,rb:!0,depthTexture:!0,dataFormat:q.DEPTH_STENCIL,types:[q.UNSIGNED_INT_24_8]},"depth32float-stencil8":{gl:q.DEPTH32F_STENCIL8,dataFormat:q.DEPTH_STENCIL,types:[q.FLOAT_32_UNSIGNED_INT_24_8_REV],rb:!0},"bc1-rgb-unorm-webgl":{gl:q.COMPRESSED_RGB_S3TC_DXT1_EXT,x:Zx},"bc1-rgb-unorm-srgb-webgl":{gl:q.COMPRESSED_SRGB_S3TC_DXT1_EXT,x:Qx},"bc1-rgba-unorm":{gl:q.COMPRESSED_RGBA_S3TC_DXT1_EXT,x:Zx},"bc1-rgba-unorm-srgb":{gl:q.COMPRESSED_SRGB_S3TC_DXT1_EXT,x:Qx},"bc2-rgba-unorm":{gl:q.COMPRESSED_RGBA_S3TC_DXT3_EXT,x:Zx},"bc2-rgba-unorm-srgb":{gl:q.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,x:Qx},"bc3-rgba-unorm":{gl:q.COMPRESSED_RGBA_S3TC_DXT5_EXT,x:Zx},"bc3-rgba-unorm-srgb":{gl:q.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT,x:Qx},"bc4-r-unorm":{gl:q.COMPRESSED_RED_RGTC1_EXT,x:$x},"bc4-r-snorm":{gl:q.COMPRESSED_SIGNED_RED_RGTC1_EXT,x:$x},"bc5-rg-unorm":{gl:q.COMPRESSED_RED_GREEN_RGTC2_EXT,x:$x},"bc5-rg-snorm":{gl:q.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT,x:$x},"bc6h-rgb-ufloat":{gl:q.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,x:eS},"bc6h-rgb-float":{gl:q.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,x:eS},"bc7-rgba-unorm":{gl:q.COMPRESSED_RGBA_BPTC_UNORM_EXT,x:eS},"bc7-rgba-unorm-srgb":{gl:q.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT,x:eS},"etc2-rgb8unorm":{gl:q.COMPRESSED_RGB8_ETC2},"etc2-rgb8unorm-srgb":{gl:q.COMPRESSED_SRGB8_ETC2},"etc2-rgb8a1unorm":{gl:q.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2},"etc2-rgb8a1unorm-srgb":{gl:q.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2},"etc2-rgba8unorm":{gl:q.COMPRESSED_RGBA8_ETC2_EAC},"etc2-rgba8unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC},"eac-r11unorm":{gl:q.COMPRESSED_R11_EAC},"eac-r11snorm":{gl:q.COMPRESSED_SIGNED_R11_EAC},"eac-rg11unorm":{gl:q.COMPRESSED_RG11_EAC},"eac-rg11snorm":{gl:q.COMPRESSED_SIGNED_RG11_EAC},"astc-4x4-unorm":{gl:q.COMPRESSED_RGBA_ASTC_4x4_KHR},"astc-4x4-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR},"astc-5x4-unorm":{gl:q.COMPRESSED_RGBA_ASTC_5x4_KHR},"astc-5x4-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR},"astc-5x5-unorm":{gl:q.COMPRESSED_RGBA_ASTC_5x5_KHR},"astc-5x5-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR},"astc-6x5-unorm":{gl:q.COMPRESSED_RGBA_ASTC_6x5_KHR},"astc-6x5-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR},"astc-6x6-unorm":{gl:q.COMPRESSED_RGBA_ASTC_6x6_KHR},"astc-6x6-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR},"astc-8x5-unorm":{gl:q.COMPRESSED_RGBA_ASTC_8x5_KHR},"astc-8x5-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR},"astc-8x6-unorm":{gl:q.COMPRESSED_RGBA_ASTC_8x6_KHR},"astc-8x6-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR},"astc-8x8-unorm":{gl:q.COMPRESSED_RGBA_ASTC_8x8_KHR},"astc-8x8-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR},"astc-10x5-unorm":{gl:q.COMPRESSED_RGBA_ASTC_10x5_KHR},"astc-10x5-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR},"astc-10x6-unorm":{gl:q.COMPRESSED_RGBA_ASTC_10x6_KHR},"astc-10x6-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR},"astc-10x8-unorm":{gl:q.COMPRESSED_RGBA_ASTC_10x8_KHR},"astc-10x8-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR},"astc-10x10-unorm":{gl:q.COMPRESSED_RGBA_ASTC_10x10_KHR},"astc-10x10-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR},"astc-12x10-unorm":{gl:q.COMPRESSED_RGBA_ASTC_12x10_KHR},"astc-12x10-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR},"astc-12x12-unorm":{gl:q.COMPRESSED_RGBA_ASTC_12x12_KHR},"astc-12x12-unorm-srgb":{gl:q.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR},"pvrtc-rgb4unorm-webgl":{gl:q.COMPRESSED_RGB_PVRTC_4BPPV1_IMG},"pvrtc-rgba4unorm-webgl":{gl:q.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG},"pvrtc-rgb2unorm-webgl":{gl:q.COMPRESSED_RGB_PVRTC_2BPPV1_IMG},"pvrtc-rgba2unorm-webgl":{gl:q.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG},"etc1-rgb-unorm-webgl":{gl:q.COMPRESSED_RGB_ETC1_WEBGL},"etc1-rbg-unorm-webgl":{gl:q.COMPRESSED_RGB_ETC1_WEBGL},"atc-rgb-unorm-webgl":{gl:q.COMPRESSED_RGB_ATC_WEBGL},"atc-rgba-unorm-webgl":{gl:q.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL},"atc-rgbai-unorm-webgl":{gl:q.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL}};function bS(e,t,n){let r=t.create,i=yS[t.format];i?.gl===void 0&&(r=!1),i?.x&&(r&&=!!Wx(e,i.x,n)),t.format===`stencil8`&&(r=!1);let a=i?.r===!1?!1:i?.r===void 0||_S(e,i.r,n),o=r&&t.render&&a&&xS(e,t.format,n);return{format:t.format,create:r&&t.create,render:o,filter:r&&t.filter,blend:r&&t.blend,store:!1}}function xS(e,t,n){let r=yS[t],i=r?.gl;if(i===void 0||r?.x&&!Wx(e,r.x,n))return!1;let a=e.getParameter(q.TEXTURE_BINDING_2D),o=e.getParameter(q.FRAMEBUFFER_BINDING),s=e.createTexture(),c=e.createFramebuffer();if(!s||!c)return!1;let l=Number(q.NO_ERROR),u=Number(e.getError());for(;u!==l;)u=e.getError();let d=!1;try{if(e.bindTexture(q.TEXTURE_2D,s),e.texStorage2D(q.TEXTURE_2D,1,i,1,1),Number(e.getError())!==l)return!1;e.bindFramebuffer(q.FRAMEBUFFER,c),e.framebufferTexture2D(q.FRAMEBUFFER,q.COLOR_ATTACHMENT0,q.TEXTURE_2D,s,0),d=Number(e.checkFramebufferStatus(q.FRAMEBUFFER))===Number(q.FRAMEBUFFER_COMPLETE)&&Number(e.getError())===l}finally{e.bindFramebuffer(q.FRAMEBUFFER,o),e.deleteFramebuffer(c),e.bindTexture(q.TEXTURE_2D,a),e.deleteTexture(s)}return d}function SS(e){let t=yS[e],n=TS(e),r=fe.getInfo(e);return r.compressed&&(t.dataFormat=n),{internalFormat:n,format:t?.dataFormat||wS(r.channels,r.integer,r.normalized,n),type:r.dataType?Xx(r.dataType):t?.types?.[0]||q.UNSIGNED_BYTE,compressed:r.compressed||!1}}function CS(e){switch(fe.getInfo(e).attachment){case`depth`:return q.DEPTH_ATTACHMENT;case`stencil`:return q.STENCIL_ATTACHMENT;case`depth-stencil`:return q.DEPTH_STENCIL_ATTACHMENT;default:throw Error(`Not a depth stencil format: ${e}`)}}function wS(e,t,n,r){if(r===q.RGBA||r===q.RGB)return r;switch(e){case`r`:return t&&!n?q.RED_INTEGER:q.RED;case`rg`:return t&&!n?q.RG_INTEGER:q.RG;case`rgb`:return t&&!n?q.RGB_INTEGER:q.RGB;case`rgba`:return t&&!n?q.RGBA_INTEGER:q.RGBA;case`bgra`:throw Error(`bgra pixels not supported by WebGL`);default:return q.RGBA}}function TS(e){let t=yS[e]?.gl;if(t===void 0)throw Error(`Unsupported texture format ${e}`);return t}var ES={"depth-clip-control":`EXT_depth_clamp`,"timestamp-query":`EXT_disjoint_timer_query_webgl2`,"compilation-status-async-webgl":`KHR_parallel_shader_compile`,"clip-control-webgl":`EXT_clip_control`,"html-in-canvas":e=>oe()&&typeof e.texElementImage2D==`function`,"polygon-mode-webgl":`WEBGL_polygon_mode`,"polygon-offset-clamp-webgl":`EXT_polygon_offset_clamp`,"provoking-vertex-webgl":`WEBGL_provoking_vertex`,"shader-clip-cull-distance-webgl":`WEBGL_clip_cull_distance`,"shader-noperspective-interpolation-webgl":`NV_shader_noperspective_interpolation`,"shader-conservative-depth-webgl":`EXT_conservative_depth`},DS=class extends _{gl;extensions;testedFeatures=new Set;constructor(e,t,n){super([],n),this.gl=e,this.extensions=t,Wx(e,`EXT_color_buffer_float`,t)}*[Symbol.iterator](){let e=this.getFeatures();for(let t of e)this.has(t)&&(yield t);return[]}has(e){return this.disabledFeatures?.[e]?!1:(this.testedFeatures.has(e)||(this.testedFeatures.add(e),gS(e)&&_S(this.gl,e,this.extensions)&&this.features.add(e),this.getWebGLFeature(e)&&this.features.add(e)),this.features.has(e))}initializeFeatures(){let e=this.getFeatures().filter(e=>e!==`polygon-mode-webgl`);for(let t of e)this.has(t)}getFeatures(){return[...Object.keys(ES),...Object.keys(hS)]}getWebGLFeature(e){let t=ES[e];return typeof t==`string`?!!Wx(this.gl,t,this.extensions):typeof t==`function`?t(this.gl):!!t}},OS=class extends m{get maxTextureDimension1D(){return 0}get maxTextureDimension2D(){return this.getParameter(q.MAX_TEXTURE_SIZE)}get maxTextureDimension3D(){return this.getParameter(q.MAX_3D_TEXTURE_SIZE)}get maxTextureArrayLayers(){return this.getParameter(q.MAX_ARRAY_TEXTURE_LAYERS)}get maxBindGroups(){return 0}get maxBindGroupsPlusVertexBuffers(){return 0}get maxBindingsPerBindGroup(){return 0}get maxDynamicUniformBuffersPerPipelineLayout(){return 0}get maxDynamicStorageBuffersPerPipelineLayout(){return 0}get maxSampledTexturesPerShaderStage(){return this.getParameter(q.MAX_VERTEX_TEXTURE_IMAGE_UNITS)}get maxSamplersPerShaderStage(){return this.getParameter(q.MAX_COMBINED_TEXTURE_IMAGE_UNITS)}get maxStorageBuffersPerShaderStage(){return 0}get maxStorageBuffersInVertexStage(){return 0}get maxStorageBuffersInFragmentStage(){return 0}get maxStorageTexturesPerShaderStage(){return 0}get maxStorageTexturesInVertexStage(){return 0}get maxStorageTexturesInFragmentStage(){return 0}get maxUniformBuffersPerShaderStage(){return this.getParameter(q.MAX_UNIFORM_BUFFER_BINDINGS)}get maxUniformBufferBindingSize(){return this.getParameter(q.MAX_UNIFORM_BLOCK_SIZE)}get maxStorageBufferBindingSize(){return 0}get maxBufferSize(){return 2**53-1}get minUniformBufferOffsetAlignment(){return this.getParameter(q.UNIFORM_BUFFER_OFFSET_ALIGNMENT)}get minStorageBufferOffsetAlignment(){return 0}get maxVertexBuffers(){return 16}get maxVertexAttributes(){return this.getParameter(q.MAX_VERTEX_ATTRIBS)}get maxVertexBufferArrayStride(){return 2048}get maxInterStageShaderVariables(){return this.getParameter(q.MAX_VARYING_COMPONENTS)}get maxColorAttachments(){return this.getParameter(q.MAX_COLOR_ATTACHMENTS)}get maxColorAttachmentBytesPerSample(){return 0}get maxComputeWorkgroupStorageSize(){return 0}get maxComputeInvocationsPerWorkgroup(){return 0}get maxComputeWorkgroupSizeX(){return 0}get maxComputeWorkgroupSizeY(){return 0}get maxComputeWorkgroupSizeZ(){return 0}get maxComputeWorkgroupsPerDimension(){return 0}gl;limits={};constructor(e){super(),this.gl=e}getParameter(e){return this.limits[e]===void 0&&(this.limits[e]=this.gl.getParameter(e)),this.limits[e]||0}},kS=class extends y{device;gl;handle;colorAttachments=[];depthStencilAttachment=null;constructor(e,t){super(e,t);let n=t.handle,r=n===null;this.device=e,this.gl=e.gl,this.handle=n||r?n:this.gl.createFramebuffer(),r||(e._setWebGLDebugMetadata(this.handle,this,{spector:this.props}),t.handle||(this.autoCreateAttachmentTextures(),this.updateAttachments()))}destroyHandle(){this.handle!==null&&this.ownsHandle&&this.gl.deleteFramebuffer(this.handle)}updateAttachments(){let e=this.gl.bindFramebuffer(q.FRAMEBUFFER,this.handle);for(let e=0;e<this.colorAttachments.length;++e){let t=this.colorAttachments[e];if(t){let n=q.COLOR_ATTACHMENT0+e;this._attachTextureView(n,t)}}if(this.depthStencilAttachment){let e=CS(this.depthStencilAttachment.props.format);this._attachTextureView(e,this.depthStencilAttachment)}if(this.device.props.debug){let e=this.gl.checkFramebufferStatus(q.FRAMEBUFFER);if(e!==q.FRAMEBUFFER_COMPLETE)throw Error(`Framebuffer ${jS(e)}`)}this.gl.bindFramebuffer(q.FRAMEBUFFER,e)}_attachTextureView(e,t){let{gl:n}=this.device,{texture:r}=t,i=t.props.baseMipLevel,a=t.props.baseArrayLayer;switch(n.bindTexture(r.glTarget,r.handle),r.glTarget){case q.TEXTURE_2D_ARRAY:case q.TEXTURE_3D:n.framebufferTextureLayer(q.FRAMEBUFFER,e,r.handle,i,a);break;case q.TEXTURE_CUBE_MAP:let t=AS(a);n.framebufferTexture2D(q.FRAMEBUFFER,e,t,r.handle,i);break;case q.TEXTURE_2D:n.framebufferTexture2D(q.FRAMEBUFFER,e,q.TEXTURE_2D,r.handle,i);break;default:throw Error(`Illegal texture type`)}n.bindTexture(r.glTarget,null)}resizeAttachments(e,t){if(this.handle===null){this.width=e,this.height=t;return}super.resizeAttachments(e,t)}};function AS(e){return e<q.TEXTURE_CUBE_MAP_POSITIVE_X?e+q.TEXTURE_CUBE_MAP_POSITIVE_X:e}function jS(e){switch(e){case q.FRAMEBUFFER_COMPLETE:return`success`;case q.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:return`Mismatched attachments`;case q.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:return`No attachments`;case q.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:return`Height/width mismatch`;case q.FRAMEBUFFER_UNSUPPORTED:return`Unsupported or split attachments`;case q.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:return`Samples mismatch`;default:return`${e}`}}var MS=class extends x{device;handle=null;_framebuffer=null;get[Symbol.toStringTag](){return`WebGLCanvasContext`}constructor(e,t){super(t),this.device=e,this._setAutoCreatedCanvasId(`${this.device.id}-canvas`),this._configureDevice()}destroy(){this._framebuffer?.destroy(),this._framebuffer=null,super.destroy()}_configureDevice(){(this.drawingBufferWidth!==this._framebuffer?.width||this.drawingBufferHeight!==this._framebuffer?.height)&&this._framebuffer?.resize([this.drawingBufferWidth,this.drawingBufferHeight])}_getCurrentFramebuffer(){return this._framebuffer||=new kS(this.device,{id:`canvas-context-framebuffer`,handle:null,width:this.drawingBufferWidth,height:this.drawingBufferHeight}),this._framebuffer}},NS=class extends ce{device;handle=null;context2d;get[Symbol.toStringTag](){return`WebGLPresentationContext`}constructor(e,t={}){super(t),this.device=e;let n=`${this[Symbol.toStringTag]}(${this.id})`;if(!this.device.getDefaultCanvasContext().offscreenCanvas)throw Error(`${n}: WebGL PresentationContext requires the default CanvasContext canvas to be an OffscreenCanvas`);let r=this.canvas.getContext(`2d`);if(!r)throw Error(`${n}: Failed to create 2d presentation context`);this.context2d=r,this._setAutoCreatedCanvasId(`${this.device.id}-presentation-canvas`),this._configureDevice(),this._startObservers()}present(){this._resizeDrawingBufferIfNeeded(),this.device.submit();let e=this.device.getDefaultCanvasContext(),[t,n]=e.getDrawingBufferSize();if(!(this.drawingBufferWidth===0||this.drawingBufferHeight===0||t===0||n===0||e.canvas.width===0||e.canvas.height===0)){if(t!==this.drawingBufferWidth||n!==this.drawingBufferHeight||e.canvas.width!==this.drawingBufferWidth||e.canvas.height!==this.drawingBufferHeight)throw Error(`${this[Symbol.toStringTag]}(${this.id}): Default canvas context size ${t}x${n} does not match presentation size ${this.drawingBufferWidth}x${this.drawingBufferHeight}`);this.context2d.clearRect(0,0,this.drawingBufferWidth,this.drawingBufferHeight),this.context2d.drawImage(e.canvas,0,0)}}_configureDevice(){}_getCurrentFramebuffer(e){let t=this.device.getDefaultCanvasContext();return t.setDrawingBufferSize(this.drawingBufferWidth,this.drawingBufferHeight),t.getCurrentFramebuffer(e)}},PS={};function FS(e=`id`){return PS[e]=PS[e]||1,`${e}-${PS[e]++}`}var IS=class extends n{device;gl;handle;glTarget;glUsage;glIndexType=q.UNSIGNED_SHORT;byteLength=0;bytesUsed=0;constructor(e,t={}){super(e,t),this.device=e,this.gl=this.device.gl,this.handle=(typeof t==`object`?t.handle:void 0)||this.gl.createBuffer(),e._setWebGLDebugMetadata(this.handle,this,{spector:{...this.props,data:typeof this.props.data}}),this.glTarget=LS(this.props.usage),this.glUsage=RS(this.props.usage),this.glIndexType=this.props.indexType===`uint32`?q.UNSIGNED_INT:q.UNSIGNED_SHORT,t.data?this._initWithData(t.data,t.byteOffset,t.byteLength):this._initWithByteLength(t.byteLength||0)}destroyHandle(){this.handle&&=(this.props.handle||this.gl.deleteBuffer(this.handle),null)}_initWithData(e,t=0,n=e.byteLength+t){let r=this.glTarget;this.gl.bindBuffer(r,this.handle),this.gl.bufferData(r,n,this.glUsage),this.gl.bufferSubData(r,t,e),this.gl.bindBuffer(r,null),this.bytesUsed=n,this.byteLength=n,this._setDebugData(e,t,n),this.props.handle?this.trackReferencedMemory(n,`Buffer`):this.trackAllocatedMemory(n)}_initWithByteLength(e){let t=e;e===0&&(t=new Float32Array);let n=this.glTarget;return this.gl.bindBuffer(n,this.handle),this.gl.bufferData(n,t,this.glUsage),this.gl.bindBuffer(n,null),this.bytesUsed=e,this.byteLength=e,this._setDebugData(null,0,e),this.props.handle?this.trackReferencedMemory(e,`Buffer`):this.trackAllocatedMemory(e),this}write(e,t=0){let n=ArrayBuffer.isView(e)?e:new Uint8Array(e),r=q.COPY_WRITE_BUFFER;this.gl.bindBuffer(r,this.handle),this.gl.bufferSubData(r,t,n),this.gl.bindBuffer(r,null),this._setDebugData(e,t,e.byteLength)}async mapAndWriteAsync(e,t=0,n=this.byteLength-t){let r=new ArrayBuffer(n);await e(r,`copied`),this.write(r,t)}async readAsync(e=0,t){return this.readSyncWebGL(e,t)}async mapAndReadAsync(e,t=0,n){return await e((await this.readAsync(t,n)).buffer,`copied`)}readSyncWebGL(e=0,t){t??=this.byteLength-e;let n=new Uint8Array(t);return this.gl.bindBuffer(q.COPY_READ_BUFFER,this.handle),this.gl.getBufferSubData(q.COPY_READ_BUFFER,e,n,0,t),this.gl.bindBuffer(q.COPY_READ_BUFFER,null),this._setDebugData(n,e,t),n}};function LS(e){return e&n.INDEX?q.ELEMENT_ARRAY_BUFFER:e&n.VERTEX?q.ARRAY_BUFFER:e&n.UNIFORM?q.UNIFORM_BUFFER:q.ARRAY_BUFFER}function RS(e){return e&n.INDEX||e&n.VERTEX?q.STATIC_DRAW:e&n.UNIFORM?q.DYNAMIC_DRAW:q.STATIC_DRAW}function zS(e){let t=e.split(/\r?\n/),n=[];for(let e of t){if(e.length<=1)continue;let t=e.trim(),r=e.split(`:`),i=r[0]?.trim();if(r.length===2){let[e,a]=r;if(!e||!a){n.push({message:t,type:BS(i||`info`),lineNum:0,linePos:0});continue}n.push({message:a.trim(),type:BS(e),lineNum:0,linePos:0});continue}let[a,o,s,...c]=r;if(!a||!o||!s){n.push({message:r.slice(1).join(`:`).trim()||t,type:BS(i||`info`),lineNum:0,linePos:0});continue}let l=parseInt(s,10);Number.isNaN(l)&&(l=0);let u=parseInt(o,10);Number.isNaN(u)&&(u=0),n.push({message:c.join(`:`).trim(),type:BS(a),lineNum:l,linePos:u})}return n}function BS(e){let t=[`warning`,`error`,`info`],n=e.toLowerCase();return t.includes(n)?n:`info`}var VS=class extends s{device;handle;_compilationInfoLog=``;constructor(e,t){super(e,t),this.device=e;let n=this.props.handle;switch(this.props.stage){case`vertex`:this.handle=n||this.device.gl.createShader(q.VERTEX_SHADER);break;case`fragment`:this.handle=n||this.device.gl.createShader(q.FRAGMENT_SHADER);break;default:throw Error(this.props.stage)}e._setWebGLDebugMetadata(this.handle,this,{spector:this.props});let r=this._compile(this.source);r&&typeof r.catch==`function`&&r.catch(()=>{this.compilationStatus=`error`})}destroyHandle(){this.handle&&this.ownsHandle&&this.device.gl.deleteShader(this.handle)}get asyncCompilationStatus(){return this._waitForCompilationComplete().then(()=>(this._getCompilationStatus(),this.compilationStatus))}async getCompilationInfo(){return await this._waitForCompilationComplete(),this.getCompilationInfoSync()}getCompilationInfoSync(){let e=this._getCompilationInfoLog();return e?zS(e):[]}getTranslatedSource(){return this.device.getExtension(`WEBGL_debug_shaders`).WEBGL_debug_shaders?.getTranslatedShaderSource(this.handle)||null}_compile(t){t=t.startsWith(`#version `)?t:`#version 300 es\n${t}`;let{gl:n}=this.device;if(n.shaderSource(this.handle,t),n.compileShader(this.handle),!this.device.props.debug){this.compilationStatus=`pending`;return}if(!this.device.features.has(`compilation-status-async-webgl`)){if(this._getCompilationStatus(),this.debugShader(),this.compilationStatus===`error`)throw Error(this._getCompilationErrorMessage(t));return}return e.once(1,`Shader compilation is asynchronous`)(),this._waitForCompilationComplete().then(()=>{e.info(2,`Shader ${this.id} - async compilation complete: ${this.compilationStatus}`)(),this._getCompilationStatus(),this.debugShader()})}async _waitForCompilationComplete(){let e=async e=>await new Promise(t=>setTimeout(t,e));if(!this.device.features.has(`compilation-status-async-webgl`)){await e(10);return}let{gl:t}=this.device;for(;;){if(t.getShaderParameter(this.handle,q.COMPLETION_STATUS_KHR))return;await e(10)}}_getCompilationStatus(){this.compilationStatus=this.device.gl.getShaderParameter(this.handle,q.COMPILE_STATUS)?`success`:`error`,this.compilationStatus===`error`&&this._getCompilationInfoLog()}_getCompilationErrorMessage(e){let t=`${this.props.stage} shader ${this.props.id}`,n=HS(this._getCompilationInfoLog()),r=this.getCompilationInfoSync(),i=r.find(e=>e.type===`error`&&e.message.trim())||r.find(e=>e.message.trim())||r.find(e=>e.type===`error`)||r[0];if(!i)return n?`GLSL compilation errors in ${t}: ${n}`:`GLSL compilation errors in ${t}: WebGL did not provide a shader compiler log`;let a=i.lineNum?e.split(/\r?\n/)[i.lineNum-1]?.trim():void 0,o=i.lineNum?` line ${i.lineNum}`:``,s=a?`\nSource: ${a}`:``;return`GLSL compilation errors in ${t}:${o}: ${i.message.trim()||n||`WebGL did not provide a shader compiler log`}${s}`}_getCompilationInfoLog(){let e=this.device.gl.getShaderInfoLog(this.handle)?.trim();return e&&(this._compilationInfoLog=e),this._compilationInfoLog}};function HS(e){return e.split(/\r?\n/).find(e=>e.trim())?.trim()}function US(e,t,n,r){if(QS(t))return r(e);let i=e;i.pushState();try{return WS(e,t),Ax(i.gl,n),r(e)}finally{i.popState()}}function WS(e,t){let n=e,{gl:r}=n;if(t.cullMode)switch(t.cullMode){case`none`:r.disable(q.CULL_FACE);break;case`front`:r.enable(q.CULL_FACE),r.cullFace(q.FRONT);break;case`back`:r.enable(q.CULL_FACE),r.cullFace(q.BACK);break}t.frontFace&&r.frontFace(XS(`frontFace`,t.frontFace,{ccw:q.CCW,cw:q.CW})),t.unclippedDepth!==void 0&&e.features.has(`depth-clip-control`)&&(t.unclippedDepth?r.enable(q.DEPTH_CLAMP_EXT):r.disable(q.DEPTH_CLAMP_EXT));let{depthBias:i,depthBiasSlopeScale:a,depthBiasClamp:o}=t;if(i!==void 0||a!==void 0||o!==void 0){if(o&&!e.features.has(`polygon-offset-clamp-webgl`))throw Error(`polygon-offset-clamp-webgl`);r.enable(q.POLYGON_OFFSET_FILL),Ax(r,{[q.POLYGON_OFFSET_FACTOR]:a??0,[q.POLYGON_OFFSET_UNITS]:i??0,[q.POLYGON_OFFSET_CLAMP_EXT]:o??0})}if(t.provokingVertex&&e.features.has(`provoking-vertex-webgl`)){let e=n.getExtension(`WEBGL_provoking_vertex`).WEBGL_provoking_vertex,r=XS(`provokingVertex`,t.provokingVertex,{first:q.FIRST_VERTEX_CONVENTION_WEBGL,last:q.LAST_VERTEX_CONVENTION_WEBGL});e?.provokingVertexWEBGL(r)}if((t.polygonMode||t.polygonOffsetLine)&&e.features.has(`polygon-mode-webgl`)){if(t.polygonMode){let e=n.getExtension(`WEBGL_polygon_mode`).WEBGL_polygon_mode,r=XS(`polygonMode`,t.polygonMode,{fill:q.FILL_WEBGL,line:q.LINE_WEBGL});e?.polygonModeWEBGL(q.FRONT,r),e?.polygonModeWEBGL(q.BACK,r)}t.polygonOffsetLine&&r.enable(q.POLYGON_OFFSET_LINE_WEBGL)}if(e.features.has(`shader-clip-cull-distance-webgl`)&&(t.clipDistance0&&r.enable(q.CLIP_DISTANCE0_WEBGL),t.clipDistance1&&r.enable(q.CLIP_DISTANCE1_WEBGL),t.clipDistance2&&r.enable(q.CLIP_DISTANCE2_WEBGL),t.clipDistance3&&r.enable(q.CLIP_DISTANCE3_WEBGL),t.clipDistance4&&r.enable(q.CLIP_DISTANCE4_WEBGL),t.clipDistance5&&r.enable(q.CLIP_DISTANCE5_WEBGL),t.clipDistance6&&r.enable(q.CLIP_DISTANCE6_WEBGL),t.clipDistance7&&r.enable(q.CLIP_DISTANCE7_WEBGL)),t.depthWriteEnabled!==void 0&&r.depthMask(ZS(`depthWriteEnabled`,t.depthWriteEnabled)),t.depthCompare&&(t.depthCompare===`always`?r.disable(q.DEPTH_TEST):r.enable(q.DEPTH_TEST),r.depthFunc(GS(`depthCompare`,t.depthCompare))),t.clearDepth!==void 0&&r.clearDepth(t.clearDepth),t.stencilWriteMask!==void 0&&r.stencilMask(t.stencilWriteMask),re(t)||t.stencilReadMask!==void 0){let e=t.stencilReadMask??4294967295;r.enable(q.STENCIL_TEST);let n=[[q.FRONT,k(t,t.stencilFront)],[q.BACK,k(t,t.stencilBack)]],i=n.some(([,e])=>e.failOp||e.depthFailOp||e.passOp);for(let[t,a]of n)r.stencilFuncSeparate(t,GS(`stencilCompare`,a.compare??`always`),0,e),i&&r.stencilOpSeparate(t,KS(`stencilFailOperation`,a.failOp),KS(`stencilDepthFailOperation`,a.depthFailOp),KS(`stencilPassOperation`,a.passOp))}if(t.colorMask!==void 0){let e=t.colorMask;r.colorMask(!!(e&1),!!(e&2),!!(e&4),!!(e&8))}switch(t.blend){case!0:r.enable(q.BLEND);break;case!1:r.disable(q.BLEND);break;default:}if(t.blendColorOperation||t.blendAlphaOperation){let e=qS(`blendColorOperation`,t.blendColorOperation||`add`),n=qS(`blendAlphaOperation`,t.blendAlphaOperation||`add`);r.blendEquationSeparate(e,n);let i=JS(`blendColorSrcFactor`,t.blendColorSrcFactor||`one`),a=JS(`blendColorDstFactor`,t.blendColorDstFactor||`zero`),o=JS(`blendAlphaSrcFactor`,t.blendAlphaSrcFactor||`one`),s=JS(`blendAlphaDstFactor`,t.blendAlphaDstFactor||`zero`);r.blendFuncSeparate(i,a,o,s)}}function GS(e,t){return XS(e,t,{never:q.NEVER,less:q.LESS,equal:q.EQUAL,"less-equal":q.LEQUAL,greater:q.GREATER,"not-equal":q.NOTEQUAL,"greater-equal":q.GEQUAL,always:q.ALWAYS})}function KS(e,t=`keep`){return XS(e,t,{keep:q.KEEP,zero:q.ZERO,replace:q.REPLACE,invert:q.INVERT,"increment-clamp":q.INCR,"decrement-clamp":q.DECR,"increment-wrap":q.INCR_WRAP,"decrement-wrap":q.DECR_WRAP})}function qS(e,t){return XS(e,t,{add:q.FUNC_ADD,subtract:q.FUNC_SUBTRACT,"reverse-subtract":q.FUNC_REVERSE_SUBTRACT,min:q.MIN,max:q.MAX})}function JS(e,t,n=`color`){return XS(e,t,{one:q.ONE,zero:q.ZERO,src:q.SRC_COLOR,"one-minus-src":q.ONE_MINUS_SRC_COLOR,dst:q.DST_COLOR,"one-minus-dst":q.ONE_MINUS_DST_COLOR,"src-alpha":q.SRC_ALPHA,"one-minus-src-alpha":q.ONE_MINUS_SRC_ALPHA,"dst-alpha":q.DST_ALPHA,"one-minus-dst-alpha":q.ONE_MINUS_DST_ALPHA,"src-alpha-saturated":q.SRC_ALPHA_SATURATE,constant:n===`color`?q.CONSTANT_COLOR:q.CONSTANT_ALPHA,"one-minus-constant":n===`color`?q.ONE_MINUS_CONSTANT_COLOR:q.ONE_MINUS_CONSTANT_ALPHA,src1:q.SRC_COLOR,"one-minus-src1":q.ONE_MINUS_SRC_COLOR,"src1-alpha":q.SRC_ALPHA,"one-minus-src1-alpha":q.ONE_MINUS_SRC_ALPHA})}function YS(e,t){return`Illegal parameter ${t} for ${e}`}function XS(e,t,n){if(!(t in n))throw Error(YS(e,t));return n[t]}function ZS(e,t){return t}function QS(e){let t=!0;for(let n in e){t=!1;break}return t}function $S(e){let t={};return e.addressModeU&&(t[q.TEXTURE_WRAP_S]=eC(e.addressModeU)),e.addressModeV&&(t[q.TEXTURE_WRAP_T]=eC(e.addressModeV)),e.addressModeW&&(t[q.TEXTURE_WRAP_R]=eC(e.addressModeW)),e.magFilter&&(t[q.TEXTURE_MAG_FILTER]=tC(e.magFilter)),(e.minFilter||e.mipmapFilter)&&(t[q.TEXTURE_MIN_FILTER]=nC(e.minFilter||`linear`,e.mipmapFilter)),e.lodMinClamp!==void 0&&(t[q.TEXTURE_MIN_LOD]=e.lodMinClamp),e.lodMaxClamp!==void 0&&(t[q.TEXTURE_MAX_LOD]=e.lodMaxClamp),e.type===`comparison-sampler`&&(t[q.TEXTURE_COMPARE_MODE]=q.COMPARE_REF_TO_TEXTURE),e.compare&&(t[q.TEXTURE_COMPARE_FUNC]=GS(`compare`,e.compare)),e.maxAnisotropy&&(t[q.TEXTURE_MAX_ANISOTROPY_EXT]=e.maxAnisotropy),t}function eC(e){switch(e){case`clamp-to-edge`:return q.CLAMP_TO_EDGE;case`repeat`:return q.REPEAT;case`mirror-repeat`:return q.MIRRORED_REPEAT}}function tC(e){switch(e){case`nearest`:return q.NEAREST;case`linear`:return q.LINEAR}}function nC(e,t=`none`){if(!t)return tC(e);switch(t){case`none`:return tC(e);case`nearest`:switch(e){case`nearest`:return q.NEAREST_MIPMAP_NEAREST;case`linear`:return q.LINEAR_MIPMAP_NEAREST}break;case`linear`:switch(e){case`nearest`:return q.NEAREST_MIPMAP_LINEAR;case`linear`:return q.LINEAR_MIPMAP_LINEAR}}}var rC=class extends pe{device;handle;parameters;constructor(e,t){super(e,t),this.device=e,this.parameters=$S(t),this.handle=t.handle||this.device.gl.createSampler(),this._setSamplerParameters(this.parameters)}destroyHandle(){this.handle&&this.ownsHandle&&this.device.gl.deleteSampler(this.handle),this.handle=void 0}toString(){return`Sampler(${this.id},${JSON.stringify(this.props)})`}_setSamplerParameters(e){for(let[t,n]of Object.entries(e)){let e=Number(t);switch(e){case q.TEXTURE_MIN_LOD:case q.TEXTURE_MAX_LOD:this.device.gl.samplerParameterf(this.handle,e,n);break;default:this.device.gl.samplerParameteri(this.handle,e,n);break}}}};function iC(e,t,n){if(aC(t))return n(e);let r=Ix.get(e);if(r.push(),t.nocatch){Ax(e,t);let i=n(e);return r.pop(),i}try{return Ax(e,t),n(e)}finally{r.pop()}}function aC(e){for(let t in e)return!1;return!0}var oC=class extends ae{device;gl;handle;texture;constructor(e,t){super(e,{...j.defaultProps,...t}),this.device=e,this.gl=this.device.gl,this.handle=null,this.texture=t.texture}};function sC(e){return cC[e]}var cC={[q.INT]:`sint32`,[q.UNSIGNED_INT]:`uint32`,[q.SHORT]:`sint16`,[q.UNSIGNED_SHORT]:`uint16`,[q.BYTE]:`sint8`,[q.UNSIGNED_BYTE]:`uint8`,[q.FLOAT]:`float32`,[q.HALF_FLOAT]:`float16`,[q.UNSIGNED_SHORT_5_6_5]:`uint16`,[q.UNSIGNED_SHORT_4_4_4_4]:`uint16`,[q.UNSIGNED_SHORT_5_5_5_1]:`uint16`,[q.UNSIGNED_INT_2_10_10_10_REV]:`uint32`,[q.UNSIGNED_INT_10F_11F_11F_REV]:`uint32`,[q.UNSIGNED_INT_5_9_9_9_REV]:`uint32`,[q.UNSIGNED_INT_24_8]:`uint32`,[q.FLOAT_32_UNSIGNED_INT_24_8_REV]:`uint32`},lC=[],uC=Object.freeze({}),dC=class extends j{device;gl;handle;sampler=void 0;view;glTarget;glFormat;glType;glInternalFormat;compressed;_textureUnit=0;_framebuffer=null;_framebufferAttachmentKey=null;constructor(e,t){super(e,t,{byteAlignment:1}),this.device=e,this.gl=this.device.gl;let n=SS(this.props.format);if(this.glTarget=mC(this.props.dimension),this.glInternalFormat=n.internalFormat,this.glFormat=n.format,this.glType=n.type,this.compressed=n.compressed,this.isHandleBorrowed&&this.props.handle===void 0)throw Error(`Borrowed WebGL textures require a texture handle`);if(this.handle=this.props.handle||this.gl.createTexture(),this.device._setWebGLDebugMetadata(this.handle,this,{spector:this.props}),!this.isHandleBorrowed){this.gl.bindTexture(this.glTarget,this.handle);let{dimension:e,width:n,height:r,depth:i,mipLevels:a,glTarget:o,glInternalFormat:s}=this;if(!this.compressed)switch(e){case`2d`:case`cube`:this.gl.texStorage2D(o,a,s,n,r);break;case`2d-array`:case`3d`:this.gl.texStorage3D(o,a,s,n,r,i);break;default:throw Error(e)}this.gl.bindTexture(this.glTarget,null),this._initializeData(t.data)}this.ownsHandle?this.trackAllocatedMemory(this.getAllocatedByteLength(),`Texture`):this.trackReferencedMemory(this.getAllocatedByteLength(),`Texture`),this.isHandleBorrowed||this.setSampler(this.props.sampler),this.view=new oC(this.device,{...this.props,texture:this}),this.view.transferOwnershipTo(this),Object.seal(this)}destroyHandle(){this.handle&&(this._framebuffer?.destroy(),this._framebuffer=null,this._framebufferAttachmentKey=null,this.ownsHandle&&this.gl.deleteTexture(this.handle))}createView(e){return new oC(this.device,{...e,texture:this})}clone(e){if(this.isHandleBorrowed&&e&&(e.width!==this.width||e.height!==this.height))throw Error(`Cannot resize borrowed read-only ${this}`);return super.clone(e)}setSampler(e={}){this._assertWritable(`set sampler parameters on`),super.setSampler(e);let t=$S(this.sampler.props);this._setSamplerParameters(t)}copyExternalImage(e){this._assertWritable(`copy external image data into`);let t=this._normalizeCopyExternalImageOptions(e);if(t.sourceX||t.sourceY)throw Error(`WebGL does not support sourceX/sourceY)`);let{glFormat:n,glType:r}=this,{image:i,depth:a,mipLevel:o,x:s,y:c,z:l,width:u,height:d}=t,f=hC(this.glTarget,this.dimension,l),p={[q.UNPACK_FLIP_Y_WEBGL]:!!t.flipY,[q.UNPACK_PREMULTIPLY_ALPHA_WEBGL]:!!t.premultipliedAlpha};return this.gl.bindTexture(this.glTarget,this.handle),iC(this.gl,p,()=>{switch(this.dimension){case`2d`:case`cube`:this.gl.texSubImage2D(f,o,s,c,u,d,n,r,i);break;case`2d-array`:case`3d`:this.gl.texSubImage3D(f,o,s,c,l,u,d,a,n,r,i);break;default:}}),this.gl.bindTexture(this.glTarget,null),{width:t.width,height:t.height}}copyElementImage(e){this._assertWritable(`copy element image data into`);let t=this._normalizeCopyElementImageOptions(e),{glFormat:n}=this,{element:r,depth:i,mipLevel:a,sourceX:o,sourceY:s,sourceWidth:c,sourceHeight:l,x:u,y:d,z:f,width:p,height:m}=t,h=hC(this.glTarget,this.dimension,f),g={[q.UNPACK_FLIP_Y_WEBGL]:!!t.flipY,[q.UNPACK_PREMULTIPLY_ALPHA_WEBGL]:!!t.premultipliedAlpha},_=this.gl;if(i!==1||this.dimension!==`2d`&&this.dimension!==`cube`)throw Error(`${this} copyElementImage only supports 2d and cube textures on WebGL`);if(a!==0||u!==0||d!==0)throw Error(`${this} copyElementImage only supports full base-level uploads on WebGL`);if(typeof _.texElementImage2D!=`function`)throw Error(`${this} copyElementImage is not supported by this WebGL implementation`);return this.gl.bindTexture(this.glTarget,this.handle),iC(this.gl,g,()=>{_.texElementImage2D?.(h,n,r,{sx:o,sy:s,swidth:c??p,sheight:l??m,width:p,height:m})}),this.gl.bindTexture(this.glTarget,null),{width:t.width,height:t.height}}copyImageData(e){super.copyImageData(e)}readBuffer(e={},t){if(!t)throw Error(`${this} readBuffer requires a destination buffer`);let n=this._getSupportedColorReadOptions(e),r=e.byteOffset??0,i=this.computeMemoryLayout(n);if(t.byteLength<r+i.byteLength)throw Error(`${this} readBuffer target is too small (${t.byteLength} < ${r+i.byteLength})`);let a=t;this.gl.bindBuffer(q.PIXEL_PACK_BUFFER,a.handle);try{this._readColorTextureLayers(n,i,e=>{this.gl.readPixels(n.x,n.y,n.width,n.height,this.glFormat,this.glType,r+e)})}finally{this.gl.bindBuffer(q.PIXEL_PACK_BUFFER,null)}return t}async readDataAsync(e={}){throw Error(`${this} readDataAsync is deprecated; use readBuffer() with an explicit destination buffer or DynamicTexture.readAsync()`)}writeBuffer(e,t=uC){let n=lC.pop()||{};try{this._assertWritable(`write buffer data into`);let r=this._normalizeTextureWriteOptions(t,n),i=hC(this.glTarget,this.dimension,r.z);if(this.compressed)throw Error(`writeBuffer for compressed textures is not implemented in WebGL`);let{bytesPerPixel:a}=this.device.getTextureFormatInfo(this.format),o=a?r.bytesPerRow/a:void 0;this.gl.bindTexture(this.glTarget,this.handle),this.gl.bindBuffer(q.PIXEL_UNPACK_BUFFER,e.handle),this._isUnpackStateCurrent(o,r.rowsPerImage)?this._uploadBuffer(r,i):this._uploadBufferWithUnpackParameters(r,i,o),this.gl.bindBuffer(q.PIXEL_UNPACK_BUFFER,null),this.gl.bindTexture(this.glTarget,null)}finally{lC.push(n)}}writeData(e,t=uC){let n=lC.pop()||{};try{this._assertWritable(`write data into`);let r=this._normalizeTextureWriteOptions(t,n),i=hC(this.glTarget,this.dimension,r.z),a=ArrayBuffer.isView(e)?e:new Uint8Array(e),o=pC(a,r.byteOffset),s=this.compressed?fC(a,r.byteOffset):a,c;if(!this.compressed){let{bytesPerPixel:e}=this.device.getTextureFormatInfo(this.format);e&&(c=r.bytesPerRow/e)}this.gl.bindTexture(this.glTarget,this.handle),this.gl.bindBuffer(q.PIXEL_UNPACK_BUFFER,null),this.compressed||this._isUnpackStateCurrent(c,r.rowsPerImage)?this._uploadData(r,s,o,i):this._uploadDataWithUnpackParameters(r,s,o,i,c),this.gl.bindTexture(this.glTarget,null)}finally{lC.push(n)}}_isUnpackStateCurrent(e,t){let n=Ix.get(this.gl);return!!(n?.enable&&n.cache&&n.cache[q.UNPACK_ALIGNMENT]===this.byteAlignment&&(e===void 0||n.cache[q.UNPACK_ROW_LENGTH]===e)&&n.cache[q.UNPACK_IMAGE_HEIGHT]===t)}_getUnpackParameters(e,t){let n={[q.UNPACK_ALIGNMENT]:this.byteAlignment,[q.UNPACK_IMAGE_HEIGHT]:t};return e!==void 0&&(n[q.UNPACK_ROW_LENGTH]=e),n}_uploadBufferWithUnpackParameters(e,t,n){iC(this.gl,this._getUnpackParameters(n,e.rowsPerImage),()=>{this._uploadBuffer(e,t)})}_uploadDataWithUnpackParameters(e,t,n,r,i){iC(this.gl,this._getUnpackParameters(i,e.rowsPerImage),()=>{this._uploadData(e,t,n,r)})}_uploadBuffer(e,t){let{width:n,height:r,depthOrArrayLayers:i,mipLevel:a,byteOffset:o,x:s,y:c,z:l}=e,{glFormat:u,glType:d}=this;switch(this.dimension){case`2d`:case`cube`:this.gl.texSubImage2D(t,a,s,c,n,r,u,d,o);break;case`2d-array`:case`3d`:this.gl.texSubImage3D(t,a,s,c,l,n,r,i,u,d,o);break;default:}}_uploadData(e,t,n,r){let{width:i,height:a,depthOrArrayLayers:o,mipLevel:s,x:c,y:l,z:u}=e,{glFormat:d,glType:f,compressed:p}=this,m=t,h=p&&c===0&&l===0&&u===0&&i===Math.max(1,this.width>>s)&&a===(this.baseDimension===`1d`?1:Math.max(1,this.height>>s))&&o===(this.dimension===`3d`?Math.max(1,this.depth>>s):this.depth);switch(this.dimension){case`2d`:case`cube`:p?h?this.gl.compressedTexImage2D(r,s,d,i,a,0,m):this.gl.compressedTexSubImage2D(r,s,c,l,i,a,d,m):this.gl.texSubImage2D(r,s,c,l,i,a,d,f,t,n);break;case`2d-array`:case`3d`:p?h?this.gl.compressedTexImage3D(r,s,d,i,a,o,0,m):this.gl.compressedTexSubImage3D(r,s,c,l,u,i,a,o,d,m):this.gl.texSubImage3D(r,s,c,l,u,i,a,o,d,f,t,n);break;default:}}_getRowByteAlignment(e,t){return 1}_getFramebuffer(){return this._framebuffer||=this.device.createFramebuffer({id:`framebuffer-for-${this.id}`,width:this.width,height:this.height,colorAttachments:[this]}),this._framebuffer}readDataSyncWebGL(e={}){let t=this._getSupportedColorReadOptions(e),n=this.computeMemoryLayout(t),r=c(sC(this.glType)),i=new r(n.byteLength/r.BYTES_PER_ELEMENT);return this._readColorTextureLayers(t,n,e=>{let a=new r(i.buffer,i.byteOffset+e,n.bytesPerImage/r.BYTES_PER_ELEMENT);this.gl.readPixels(t.x,t.y,t.width,t.height,this.glFormat,this.glType,a)}),i.buffer}_readColorTextureLayers(e,t,n){let r=this._getFramebuffer(),i=t.bytesPerRow/t.bytesPerPixel,a={[q.PACK_ALIGNMENT]:this.byteAlignment,...i===e.width?{}:{[q.PACK_ROW_LENGTH]:i}},o=this.gl.getParameter(q.READ_BUFFER),s=this.gl.bindFramebuffer(q.FRAMEBUFFER,r.handle);try{this.gl.readBuffer(q.COLOR_ATTACHMENT0),iC(this.gl,a,()=>{for(let i=0;i<e.depthOrArrayLayers;i++)this._attachReadSubresource(r,e.mipLevel,e.z+i),n(i*t.bytesPerImage)})}finally{this.gl.bindFramebuffer(q.FRAMEBUFFER,s||null),this.gl.readBuffer(o)}}_attachReadSubresource(e,t,n){let r=`${t}:${n}`;if(this._framebufferAttachmentKey!==r){switch(this.dimension){case`2d`:this.gl.framebufferTexture2D(q.FRAMEBUFFER,q.COLOR_ATTACHMENT0,q.TEXTURE_2D,this.handle,t);break;case`cube`:this.gl.framebufferTexture2D(q.FRAMEBUFFER,q.COLOR_ATTACHMENT0,hC(this.glTarget,this.dimension,n),this.handle,t);break;case`2d-array`:case`3d`:this.gl.framebufferTextureLayer(q.FRAMEBUFFER,q.COLOR_ATTACHMENT0,this.handle,t,n);break;default:throw Error(`${this} color readback does not support ${this.dimension} textures`)}if(this.device.props.debug){let t=Number(this.gl.checkFramebufferStatus(q.FRAMEBUFFER));if(t!==Number(q.FRAMEBUFFER_COMPLETE))throw Error(`${e} incomplete for ${this} readback (${t})`)}this._framebufferAttachmentKey=r}}generateMipmapsWebGL(t){if(this._assertWritable(`generate mipmaps for`),!(!(this.device.isTextureFormatRenderable(this.props.format)&&this.device.isTextureFormatFilterable(this.props.format))&&(e.warn(`${this} is not renderable or filterable, may not be able to generate mipmaps`)(),!t?.force)))try{this.gl.bindTexture(this.glTarget,this.handle),this.gl.generateMipmap(this.glTarget)}catch(t){e.warn(`Error generating mipmap for ${this}: ${t.message}`)()}finally{this.gl.bindTexture(this.glTarget,null)}}_setSamplerParameters(t){e.level>=2&&e.log(2,`${this.id} sampler parameters`,this.device.getGLKeys(t))(),this.gl.bindTexture(this.glTarget,this.handle);for(let[e,n]of Object.entries(t)){let t=Number(e),r=n;switch(t){case q.TEXTURE_MIN_LOD:case q.TEXTURE_MAX_LOD:this.gl.texParameterf(this.glTarget,t,r);break;case q.TEXTURE_MAG_FILTER:case q.TEXTURE_MIN_FILTER:this.gl.texParameteri(this.glTarget,t,r);break;case q.TEXTURE_WRAP_S:case q.TEXTURE_WRAP_T:case q.TEXTURE_WRAP_R:this.gl.texParameteri(this.glTarget,t,r);break;case q.TEXTURE_MAX_ANISOTROPY_EXT:this.device.features.has(`texture-filterable-anisotropic-webgl`)&&this.gl.texParameteri(this.glTarget,t,r);break;case q.TEXTURE_COMPARE_MODE:case q.TEXTURE_COMPARE_FUNC:this.gl.texParameteri(this.glTarget,t,r);break}}this.gl.bindTexture(this.glTarget,null)}_getActiveUnit(){return this.gl.getParameter(q.ACTIVE_TEXTURE)-q.TEXTURE0}_bind(e){let{gl:t}=this;return e!==void 0&&(this._textureUnit=e,t.activeTexture(t.TEXTURE0+e)),t.bindTexture(this.glTarget,this.handle),e}_unbind(e){let{gl:t}=this;return e!==void 0&&(this._textureUnit=e,t.activeTexture(t.TEXTURE0+e)),t.bindTexture(this.glTarget,null),e}_assertWritable(e){if(this.isHandleBorrowed)throw Error(`Cannot ${e} borrowed read-only ${this}`)}};function fC(e,t=0){return t?new e.constructor(e.buffer,e.byteOffset+t,(e.byteLength-t)/e.BYTES_PER_ELEMENT):e}function pC(e,t){if(t%e.BYTES_PER_ELEMENT!==0)throw Error(`Texture byteOffset ${t} must align to typed array element size ${e.BYTES_PER_ELEMENT}`);return t/e.BYTES_PER_ELEMENT}function mC(e){switch(e){case`1d`:break;case`2d`:return q.TEXTURE_2D;case`3d`:return q.TEXTURE_3D;case`cube`:return q.TEXTURE_CUBE_MAP;case`2d-array`:return q.TEXTURE_2D_ARRAY;case`cube-array`:break}throw Error(e)}function hC(e,t,n){return t===`cube`?q.TEXTURE_CUBE_MAP_POSITIVE_X+n:e}function gC(e,t,n,r){let i=e,a=r;a===!0&&(a=1),a===!1&&(a=0);let o=typeof a==`number`?[a]:a;switch(n){case q.SAMPLER_2D:case q.SAMPLER_CUBE:case q.SAMPLER_3D:case q.SAMPLER_2D_SHADOW:case q.SAMPLER_2D_ARRAY:case q.SAMPLER_2D_ARRAY_SHADOW:case q.SAMPLER_CUBE_SHADOW:case q.INT_SAMPLER_2D:case q.INT_SAMPLER_3D:case q.INT_SAMPLER_CUBE:case q.INT_SAMPLER_2D_ARRAY:case q.UNSIGNED_INT_SAMPLER_2D:case q.UNSIGNED_INT_SAMPLER_3D:case q.UNSIGNED_INT_SAMPLER_CUBE:case q.UNSIGNED_INT_SAMPLER_2D_ARRAY:if(typeof r!=`number`)throw Error(`samplers must be set to integers`);return e.uniform1i(t,r);case q.FLOAT:return e.uniform1fv(t,o);case q.FLOAT_VEC2:return e.uniform2fv(t,o);case q.FLOAT_VEC3:return e.uniform3fv(t,o);case q.FLOAT_VEC4:return e.uniform4fv(t,o);case q.INT:return e.uniform1iv(t,o);case q.INT_VEC2:return e.uniform2iv(t,o);case q.INT_VEC3:return e.uniform3iv(t,o);case q.INT_VEC4:return e.uniform4iv(t,o);case q.BOOL:return e.uniform1iv(t,o);case q.BOOL_VEC2:return e.uniform2iv(t,o);case q.BOOL_VEC3:return e.uniform3iv(t,o);case q.BOOL_VEC4:return e.uniform4iv(t,o);case q.UNSIGNED_INT:return i.uniform1uiv(t,o,1);case q.UNSIGNED_INT_VEC2:return i.uniform2uiv(t,o,2);case q.UNSIGNED_INT_VEC3:return i.uniform3uiv(t,o,3);case q.UNSIGNED_INT_VEC4:return i.uniform4uiv(t,o,4);case q.FLOAT_MAT2:return e.uniformMatrix2fv(t,!1,o);case q.FLOAT_MAT3:return e.uniformMatrix3fv(t,!1,o);case q.FLOAT_MAT4:return e.uniformMatrix4fv(t,!1,o);case q.FLOAT_MAT2x3:return i.uniformMatrix2x3fv(t,!1,o);case q.FLOAT_MAT2x4:return i.uniformMatrix2x4fv(t,!1,o);case q.FLOAT_MAT3x2:return i.uniformMatrix3x2fv(t,!1,o);case q.FLOAT_MAT3x4:return i.uniformMatrix3x4fv(t,!1,o);case q.FLOAT_MAT4x2:return i.uniformMatrix4x2fv(t,!1,o);case q.FLOAT_MAT4x3:return i.uniformMatrix4x3fv(t,!1,o)}throw Error(`Illegal uniform`)}function _C(e){return CC[e]}function vC(e){return xC[e]}function yC(e){return!!SC[e]}function bC(e){return SC[e]}var xC={[q.FLOAT]:`f32`,[q.FLOAT_VEC2]:`vec2<f32>`,[q.FLOAT_VEC3]:`vec3<f32>`,[q.FLOAT_VEC4]:`vec4<f32>`,[q.INT]:`i32`,[q.INT_VEC2]:`vec2<i32>`,[q.INT_VEC3]:`vec3<i32>`,[q.INT_VEC4]:`vec4<i32>`,[q.UNSIGNED_INT]:`u32`,[q.UNSIGNED_INT_VEC2]:`vec2<u32>`,[q.UNSIGNED_INT_VEC3]:`vec3<u32>`,[q.UNSIGNED_INT_VEC4]:`vec4<u32>`,[q.BOOL]:`i32`,[q.BOOL_VEC2]:`vec2<i32>`,[q.BOOL_VEC3]:`vec3<i32>`,[q.BOOL_VEC4]:`vec4<i32>`,[q.FLOAT_MAT2]:`mat2x2<f32>`,[q.FLOAT_MAT2x3]:`mat2x3<f32>`,[q.FLOAT_MAT2x4]:`mat2x4<f32>`,[q.FLOAT_MAT3x2]:`mat3x2<f32>`,[q.FLOAT_MAT3]:`mat3x3<f32>`,[q.FLOAT_MAT3x4]:`mat3x4<f32>`,[q.FLOAT_MAT4x2]:`mat4x2<f32>`,[q.FLOAT_MAT4x3]:`mat4x3<f32>`,[q.FLOAT_MAT4]:`mat4x4<f32>`},SC={[q.SAMPLER_2D]:{viewDimension:`2d`,sampleType:`float`},[q.SAMPLER_CUBE]:{viewDimension:`cube`,sampleType:`float`},[q.SAMPLER_3D]:{viewDimension:`3d`,sampleType:`float`},[q.SAMPLER_2D_SHADOW]:{viewDimension:`3d`,sampleType:`depth`},[q.SAMPLER_2D_ARRAY]:{viewDimension:`2d-array`,sampleType:`float`},[q.SAMPLER_2D_ARRAY_SHADOW]:{viewDimension:`2d-array`,sampleType:`depth`},[q.SAMPLER_CUBE_SHADOW]:{viewDimension:`cube`,sampleType:`float`},[q.INT_SAMPLER_2D]:{viewDimension:`2d`,sampleType:`sint`},[q.INT_SAMPLER_3D]:{viewDimension:`3d`,sampleType:`sint`},[q.INT_SAMPLER_CUBE]:{viewDimension:`cube`,sampleType:`sint`},[q.INT_SAMPLER_2D_ARRAY]:{viewDimension:`2d-array`,sampleType:`uint`},[q.UNSIGNED_INT_SAMPLER_2D]:{viewDimension:`2d`,sampleType:`uint`},[q.UNSIGNED_INT_SAMPLER_3D]:{viewDimension:`3d`,sampleType:`uint`},[q.UNSIGNED_INT_SAMPLER_CUBE]:{viewDimension:`cube`,sampleType:`uint`},[q.UNSIGNED_INT_SAMPLER_2D_ARRAY]:{viewDimension:`2d-array`,sampleType:`uint`}},CC={uint8:q.UNSIGNED_BYTE,sint8:q.BYTE,unorm8:q.UNSIGNED_BYTE,snorm8:q.BYTE,uint16:q.UNSIGNED_SHORT,sint16:q.SHORT,unorm16:q.UNSIGNED_SHORT,snorm16:q.SHORT,uint32:q.UNSIGNED_INT,sint32:q.INT,float16:q.HALF_FLOAT,float32:q.FLOAT};q.BYTE,q.UNSIGNED_BYTE,q.SHORT,q.UNSIGNED_SHORT,q.INT,q.UNSIGNED_INT,q.FLOAT,q.HALF_FLOAT;function wC(e,t,n={}){let r={attributes:[],bindings:[]};r.attributes=TC(e,t);let i=OC(e,t,n);for(let e of i){let t=e.uniforms.map(e=>({name:e.name,format:e.format,byteOffset:e.byteOffset,byteStride:e.byteStride,arrayLength:e.arrayLength}));r.bindings.push({type:`uniform`,name:e.name,group:0,location:e.location,visibility:(e.vertex?1:0)|(e.fragment?2:0),minBindingSize:e.byteLength,uniforms:t})}let a=DC(e,t),o=0;for(let e of a)if(yC(e.type)){let{viewDimension:t,sampleType:n}=bC(e.type);r.bindings.push({type:`texture`,name:e.name,group:0,location:o,viewDimension:t,sampleType:n}),e.textureUnit=o,o+=1}a.length&&(r.uniforms=a);let s=EC(e,t);return s?.length&&(r.varyings=s),r}function TC(e,t){let n=[],r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i);if(!r)throw Error(`activeInfo`);let{name:a,type:o}=r,s=e.getAttribLocation(t,a);if(s>=0){let e=vC(o),t=/instance/i.test(a)?`instance`:`vertex`;n.push({name:a,location:s,stepMode:t,type:e})}}return n.sort((e,t)=>e.location-t.location),n}function EC(e,t){let n=[],r=e.getProgramParameter(t,q.TRANSFORM_FEEDBACK_VARYINGS);for(let i=0;i<r;i++){let r=e.getTransformFeedbackVarying(t,i);if(!r)throw Error(`activeInfo`);let{name:o,type:s,size:c}=r,{type:l,components:u}=a(vC(s));n.push({location:i,name:o,type:l,size:c*u})}return n.sort((e,t)=>e.location-t.location),n}function DC(e,t){let n=[],r=e.getProgramParameter(t,q.ACTIVE_UNIFORMS);for(let i=0;i<r;i++){let r=e.getActiveUniform(t,i);if(!r)throw Error(`activeInfo`);let{name:a,size:o,type:s}=r,{name:c,isArray:l}=VC(a),u=e.getUniformLocation(t,c),d={location:u,name:c,size:o,type:s,isArray:l};if(n.push(d),d.size>1)for(let r=0;r<d.size;r++){let i=`${c}[${r}]`;u=e.getUniformLocation(t,i);let a={...d,name:i,location:u};n.push(a)}}return n}function OC(t,n,r){let i=[],a=MC(t,n,r);for(let[r,o]of a){i.push(o);try{kC(PC(t,n,r,o.name),o)}catch(t){let n=t instanceof Error?t.message:String(t);e.once(0,`WebGL uniform block reflection failed for "${o.name}"; using supplied std140 metadata. ${n}`)()}}let o=t.getProgramParameter(n,q.ACTIVE_UNIFORM_BLOCKS);if(!Number.isInteger(o)||o<0)throw Error(`Failed to reflect WebGL uniform blocks: ACTIVE_UNIFORM_BLOCKS returned ${String(o)}`);for(let e=0;e<o;e++)a.has(e)||i.push(PC(t,n,e));return i.sort((e,t)=>e.location-t.location),i}function kC(e,t){for(let n of e.uniforms){let e=t.uniforms.find(e=>n.name===e.name)||t.uniforms.find(e=>jC(n.name,e.name)!==null)||t.uniforms.find(e=>n.name.endsWith(`.${e.name}`));if(!e)throw Error(`Failed to validate WebGL uniform block "${t.name}": reflected unexpected member "${n.name}"`);let r=n.format!==e.format||n.arrayLength!==e.arrayLength||n.byteOffset!==e.byteOffset||n.byteStride!==e.byteStride,i=jC(n.name,e.name),a=i!==null&&i<e.arrayLength&&n.format===e.format&&n.arrayLength===1&&n.byteOffset===e.byteOffset+i*e.byteStride&&n.byteStride===0;if(r&&!a)throw Error(`Failed to validate WebGL uniform block "${t.name}": reflected layout for "${n.name}" does not match supplied std140 metadata`)}}function AC(e,t){return e===t||e.endsWith(`.${t}`)}function jC(e,t){let n=t.indexOf(`[0].`);if(n<0)return null;let r=t.slice(0,n),i=t.slice(n+3);if(!e.endsWith(i))return null;let a=e.slice(0,-i.length).match(/^(.*)\[(\d+)\]$/),o=a?.[1],s=a?.[2];return!o||!s||!AC(o,r)?null:Number(s)}function MC(e,t,n){let r=new Map;for(let e of n.uniformBlockLayouts||[])r.set(e.name,RC(e));for(let e of n.shaderLayout?.bindings||[])BC(e)&&r.set(e.name,e);let i=new Map;for(let n of r.values()){let r=NC(e,t,n.name);if(!r)continue;let{blockIndex:a,blockName:o}=r;if(i.has(a))throw Error(`Multiple supplied uniform block layouts resolve to active WebGL block "${o}"`);i.set(a,{name:o,location:a,byteLength:n.minBindingSize,vertex:!!(n.visibility&&n.visibility&1),fragment:!!(n.visibility&&n.visibility&2),uniformCount:n.uniforms.length,uniforms:n.uniforms.map(e=>({...e}))})}return i}function NC(e,t,n){let r=n.endsWith(`Uniforms`)?[n,n.slice(0,-8)]:[n,`${n}Uniforms`];for(let n of r){let r=e.getUniformBlockIndex(t,n);if(r!==q.INVALID_INDEX){if(!Number.isInteger(r)||r<0)throw Error(`Failed to resolve WebGL uniform block "${n}": getUniformBlockIndex returned ${String(r)}`);return{blockIndex:r,blockName:n}}}return null}function PC(t,n,r,i){let a=i||t.getActiveUniformBlockName(n,r);if(!a)throw Error(`Failed to reflect WebGL uniform block at index ${r}: missing block name`);let o=(e,i)=>{let o=t.getActiveUniformBlockParameter(n,r,e);if(o==null)throw Error(`Failed to reflect WebGL uniform block "${a}": ${i} returned null`);return o},s=LC(o(q.UNIFORM_BLOCK_BINDING,`UNIFORM_BLOCK_BINDING`),a,`UNIFORM_BLOCK_BINDING`,0),c=LC(o(q.UNIFORM_BLOCK_DATA_SIZE,`UNIFORM_BLOCK_DATA_SIZE`),a,`UNIFORM_BLOCK_DATA_SIZE`,0),l=LC(o(q.UNIFORM_BLOCK_ACTIVE_UNIFORMS,`UNIFORM_BLOCK_ACTIVE_UNIFORMS`),a,`UNIFORM_BLOCK_ACTIVE_UNIFORMS`,0),u=IC(o(q.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES,`UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES`),a,`UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES`,l),d=FC(t,n,u,q.UNIFORM_TYPE,`UNIFORM_TYPE`,a,l),f=FC(t,n,u,q.UNIFORM_SIZE,`UNIFORM_SIZE`,a,l),p=FC(t,n,u,q.UNIFORM_BLOCK_INDEX,`UNIFORM_BLOCK_INDEX`,a,l),m=FC(t,n,u,q.UNIFORM_OFFSET,`UNIFORM_OFFSET`,a,l),h=FC(t,n,u,q.UNIFORM_ARRAY_STRIDE,`UNIFORM_ARRAY_STRIDE`,a,l),g=[];for(let e=0;e<l;e++){if(p[e]!==r)throw Error(`Failed to reflect WebGL uniform block "${a}": active uniform index ${u[e]} belongs to block ${p[e]}, expected ${r}`);let i=u[e],o=t.getActiveUniform(n,i);if(!o)throw Error(`Failed to reflect WebGL uniform block "${a}": getActiveUniform(${i}) returned null`);let s=LC(d[e],a,`UNIFORM_TYPE[${e}]`,1),c=LC(f[e],a,`UNIFORM_SIZE[${e}]`,1),l=LC(m[e],a,`UNIFORM_OFFSET[${e}]`,0),_=LC(h[e],a,`UNIFORM_ARRAY_STRIDE[${e}]`,0);if(o.type!==s||o.size!==c)throw Error(`Failed to reflect WebGL uniform block "${a}": getActiveUniform(${i}) disagrees with getActiveUniforms`);g.push({name:o.name,format:vC(s),arrayLength:c,byteOffset:l,byteStride:_})}let _={name:a,location:s,byteLength:c,vertex:!!o(q.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER,`UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER`),fragment:!!o(q.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER,`UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER`),uniformCount:l,uniforms:g},v=new Set(_.uniforms.map(e=>e.name.split(`.`)[0]).filter(e=>!!e)),y=_.name.replace(/Uniforms$/,``);if(v.size===1&&!v.has(_.name)&&!v.has(y)){let[t]=v;e.warn(`Uniform block "${_.name}" uses GLSL instance "${t}". luma.gl binds uniform buffers by block name ("${_.name}") and alias ("${y}"). Prefer matching the instance name to one of those to avoid confusing silent mismatches.`)()}return _}function FC(e,t,n,r,i,a,o){let s=e.getActiveUniforms(t,n,r);if(s===null)throw Error(`Failed to reflect WebGL uniform block "${a}": ${i} returned null`);return IC(s,a,i,o)}function IC(e,t,n,r){if(!Array.isArray(e)&&!ArrayBuffer.isView(e))throw Error(`Failed to reflect WebGL uniform block "${t}": ${n} returned a non-array value`);let i=Array.from(e);if(i.length!==r||i.some(e=>!Number.isInteger(e)))throw Error(`Failed to reflect WebGL uniform block "${t}": ${n} returned ${i.length} invalid values, expected ${r}`);return i}function LC(e,t,n,r){if(!Number.isInteger(e)||e<r)throw Error(`Failed to reflect WebGL uniform block "${t}": ${n} returned ${String(e)}`);return e}function RC(e){let t=ue(e.uniformTypes,{layout:`std140`}),n=zC(e.uniformTypes,t.fields);return{type:`uniform`,name:e.name,group:0,location:0,minBindingSize:t.byteLength,uniforms:n}}function zC(e,t){let n=[],r=(e,a)=>{if(typeof a==`string`){let r=t[e];if(!r)throw Error(`Missing std140 layout field ${e}`);n.push({name:e,format:r.shaderType,arrayLength:1,byteOffset:r.offset*4,byteStride:0});return}if(Array.isArray(a)){i(e,a[0],a[1]);return}for(let[t,n]of Object.entries(a))r(`${e}.${t}`,n)},i=(e,r,i)=>{if(typeof r==`string`){let r=t[`${e}[0]`],a=i>1?t[`${e}[1]`]:void 0;if(!r)throw Error(`Missing std140 array layout field ${e}[0]`);n.push({name:`${e}[0]`,format:r.shaderType,arrayLength:i,byteOffset:r.offset*4,byteStride:a?(a.offset-r.offset)*4:0});return}if(Array.isArray(r))throw Error(`Nested uniform arrays are not supported for ${e}`);for(let[a,o]of Object.entries(r)){if(typeof o!=`string`)throw Error(`Composite uniform array members are not supported for ${e}`);let r=`${e}[0].${a}`,s=`${e}[1].${a}`,c=t[r],l=i>1?t[s]:void 0;if(!c)throw Error(`Missing std140 array layout field ${r}`);n.push({name:r,format:c.shaderType,arrayLength:i,byteOffset:c.offset*4,byteStride:l?(l.offset-c.offset)*4:0})}};for(let[t,n]of Object.entries(e))r(t,n);return n}function BC(e){return e.type===`uniform`&&Number.isInteger(e.minBindingSize)&&e.minBindingSize>=0&&Array.isArray(e.uniforms)&&e.uniforms.every(e=>typeof e.name==`string`&&typeof e.format==`string`&&Number.isInteger(e.arrayLength)&&e.arrayLength>0&&Number.isInteger(e.byteOffset)&&e.byteOffset>=0&&Number.isInteger(e.byteStride)&&e.byteStride>=0)}function VC(e){if(e[e.length-1]!==`]`)return{name:e,length:1,isArray:!1};let t=/([^[]*)(\[[0-9]+\])?/.exec(e);return{name:r(t?.[1],`Failed to parse GLSL uniform name ${e}`),length:t?.[2]?1:0,isArray:!!t?.[2]}}var HC=class extends d{device;handle;vs;fs;introspectedLayout;bindings={};uniforms={};varyings=null;_uniformCount=0;_uniformSetters={};get[Symbol.toStringTag](){return`WEBGLRenderPipeline`}constructor(e,t){super(e,t),this.device=e;let n=this.sharedRenderPipeline||this.device._createSharedRenderPipelineWebGL(t);this.sharedRenderPipeline=n,this.handle=n.handle,this.vs=n.vs,this.fs=n.fs,this.linkStatus=n.linkStatus,this.introspectedLayout=wC(this.device.gl,this.handle,{uniformBlockLayouts:t._uniformBlockLayouts,shaderLayout:t.shaderLayout}),this.device._setWebGLDebugMetadata(this.handle,this,{spector:{id:this.props.id}}),this.shaderLayout=t.shaderLayout?UC(this.introspectedLayout,t.shaderLayout):this.introspectedLayout}destroyHandle(){this.sharedRenderPipeline&&!this.props._sharedRenderPipeline&&this.sharedRenderPipeline.destroy()}setBindings(t,n){let r=O(T(this.shaderLayout,t));for(let[t,i]of Object.entries(r)){let r=WC(this.shaderLayout,t);if(r){switch(i||e.warn(`Unsetting binding "${t}" in render pipeline "${this.id}"`)(),r.type){case`uniform`:if(!(i instanceof IS)&&!(i.buffer instanceof IS))throw Error(`buffer value`);break;case`texture`:if(!(i instanceof oC||i instanceof dC||i instanceof kS))throw Error(`${this} Bad texture binding for ${t}`);break;case`sampler`:e.warn(`Ignoring sampler ${t}`)();break;default:throw Error(r.type)}this.bindings[t]=i}else{let r=this.shaderLayout.bindings.map(e=>`"${e.name}"`).join(`, `);n?.disableWarnings||e.warn(`No binding "${t}" in render pipeline "${this.id}", expected one of ${r}`,i)()}}}draw(e){let t=e.renderPass,n=e.bindGroups?O(e.bindGroups):e.bindings||this.bindings;return t.setPipeline(this),t.setBindings(n),t.setVertexArray(e.vertexArray),t.draw({parameters:e.parameters,topology:e.topology,isInstanced:e.isInstanced,vertexCount:e.vertexCount,indexCount:e.indexCount,instanceCount:e.instanceCount,firstVertex:e.firstVertex,firstIndex:e.firstIndex,firstInstance:e.firstInstance,baseVertex:e.baseVertex,transformFeedback:e.transformFeedback,uniforms:e.uniforms})}_areTexturesRenderable(t){let n=!0;for(let r of this.shaderLayout.bindings)GC(t,r.name)||(e.warn(`Binding ${r.name} not found in ${this.id}`)(),n=!1);return n}_applyBindings(t,n){if(this._syncLinkStatus(),this.linkStatus!==`success`)return;let{gl:r}=this.device;r.useProgram(this.handle);let i=0,a=0;for(let n of this.shaderLayout.bindings){let o=GC(t,n.name);if(!o)throw Error(`No value for binding ${n.name} in ${this.id}`);switch(n.type){case`uniform`:let t=this.sharedRenderPipeline._getUniformBlockIndex(n.name);if(r.uniformBlockBinding(this.handle,t,a),o instanceof IS)r.bindBufferBase(q.UNIFORM_BUFFER,a,o.handle);else{let e=o;r.bindBufferRange(q.UNIFORM_BUFFER,a,e.buffer.handle,e.offset||0,e.size||e.buffer.byteLength-(e.offset||0))}a+=1;break;case`texture`:if(!(o instanceof oC||o instanceof dC||o instanceof kS))throw Error(`texture`);let s;if(o instanceof oC)s=o.texture;else if(o instanceof dC)s=o;else if(o instanceof kS&&o.colorAttachments[0]instanceof oC)e.warn(`Passing framebuffer in texture binding may be deprecated. Use fbo.colorAttachments[0] instead`)(),s=o.colorAttachments[0].texture;else throw Error(`No texture`);r.activeTexture(q.TEXTURE0+i),r.bindTexture(s.glTarget,s.handle),i+=1;break;case`sampler`:break;case`storage`:case`read-only-storage`:throw Error(`binding type '${n.type}' not supported in WebGL`)}}}_applyUniforms(e){for(let t of this.shaderLayout.uniforms||[]){let{name:n,location:r,type:i,textureUnit:a}=t,o=e[n]??a;o!==void 0&&gC(this.device.gl,r,i,o)}}_syncLinkStatus(){this.linkStatus=this.sharedRenderPipeline.linkStatus}};function UC(t,n){let r={...t,attributes:t.attributes.map(e=>({...e})),bindings:t.bindings.map(e=>({...e}))};for(let t of n?.attributes||[]){let n=r.attributes.find(e=>e.name===t.name);n?(n.type=t.type||n.type,n.stepMode=t.stepMode||n.stepMode):e.warn(`shader layout attribute ${t.name} not present in shader`)}for(let t of n?.bindings||[]){let n=WC(r,t.name);if(!n){e.warn(`shader layout binding ${t.name} not present in shader`);continue}Object.assign(n,t)}return r}function WC(e,t){return e.bindings.find(e=>e.name===t||e.name===`${t}Uniforms`||`${e.name}Uniforms`===t)}function GC(e,t){return e[t]||e[`${t}Uniforms`]||e[t.replace(/Uniforms$/,``)]}var KC=4,qC=class extends jo{device;handle;vs;fs;linkStatus=`pending`;_uniformBlockIndices=new Map;constructor(e,t){super(e,t),this.device=e,this.handle=t.handle||this.device.gl.createProgram(),this.vs=t.vs,this.fs=t.fs,t.varyings&&t.varyings.length>0&&this.device.gl.transformFeedbackVaryings(this.handle,t.varyings,t.bufferMode||q.SEPARATE_ATTRIBS),this._linkShaders()}destroyHandle(){this.device.gl.useProgram(null),this.device.gl.deleteProgram(this.handle),this.handle.destroyed=!0}_getUniformBlockIndex(e){let t=this._uniformBlockIndices.get(e);if(t===void 0){if(t=this.device.gl.getUniformBlockIndex(this.handle,e),t===q.INVALID_INDEX)throw Error(`Invalid uniform block name ${e}`);this._uniformBlockIndices.set(e,t)}return t}async _linkShaders(){let{gl:t}=this.device;if(t.attachShader(this.handle,this.vs.handle),t.attachShader(this.handle,this.fs.handle),e.time(KC,`linkProgram for ${this.id}`)(),t.linkProgram(this.handle),e.timeEnd(KC,`linkProgram for ${this.id}`)(),!this.device.features.has(`compilation-status-async-webgl`)){let e=this._getLinkStatus();this._reportLinkStatus(e);return}e.once(1,`RenderPipeline linking is asynchronous`)(),await this._waitForLinkComplete(),e.info(2,`RenderPipeline ${this.id} - async linking complete: ${this.linkStatus}`)();let n=this._getLinkStatus();this._reportLinkStatus(n)}async _reportLinkStatus(e){switch(e){case`success`:return;default:let t=e===`link-error`?`Link error`:`Validation error`;switch(this.vs.compilationStatus){case`error`:throw this.vs.debugShader(),Error(`${this} ${t} during compilation of ${this.vs}`);case`pending`:await this.vs.asyncCompilationStatus,this.vs.debugShader();break;case`success`:break}switch(this.fs?.compilationStatus){case`error`:throw this.fs.debugShader(),Error(`${this} ${t} during compilation of ${this.fs}`);case`pending`:await this.fs.asyncCompilationStatus,this.fs.debugShader();break;case`success`:break}let n=this.device.gl.getProgramInfoLog(this.handle);this.device.reportError(Error(`${t} during ${e}: ${n}`),this)(),this.device.debug()}}_getLinkStatus(){let{gl:e}=this.device;return e.getProgramParameter(this.handle,q.LINK_STATUS)?(this._initializeSamplerUniforms(),e.validateProgram(this.handle),e.getProgramParameter(this.handle,q.VALIDATE_STATUS)?(this.linkStatus=`success`,`success`):(this.linkStatus=`error`,`validation-error`)):(this.linkStatus=`error`,`link-error`)}_initializeSamplerUniforms(){let{gl:e}=this.device;e.useProgram(this.handle);let t=0,n=e.getProgramParameter(this.handle,q.ACTIVE_UNIFORMS);for(let r=0;r<n;r++){let n=e.getActiveUniform(this.handle,r);if(n&&yC(n.type)){let r=n.name.endsWith(`[0]`),i=r?n.name.slice(0,-3):n.name,a=e.getUniformLocation(this.handle,i);a!==null&&(t=this._assignSamplerUniform(a,n,r,t))}}}_assignSamplerUniform(e,t,n,r){let{gl:i}=this.device;if(n&&t.size>1){let n=Int32Array.from({length:t.size},(e,t)=>r+t);return i.uniform1iv(e,n),r+t.size}return i.uniform1i(e,r),r+1}async _waitForLinkComplete(){let e=async e=>await new Promise(t=>setTimeout(t,e));if(!this.device.features.has(`compilation-status-async-webgl`)){await e(10);return}let{gl:t}=this.device;for(;;){if(t.getProgramParameter(this.handle,q.COMPLETION_STATUS_KHR))return;await e(10)}}},JC=class extends C{device;handle=null;commands=[];constructor(e,t={}){super(e,t),this.device=e}flushCommands(){let e=this.commands;this.commands=[],this._executeCommands(e)}_executeCommands(e){for(let t of e)switch(t.name){case`copy-buffer-to-buffer`:YC(this.device,t.options);break;case`copy-buffer-to-texture`:XC(this.device,t.options);break;case`copy-texture-to-buffer`:ZC(this.device,t.options);break;case`copy-texture-to-texture`:QC(this.device,t.options);break;default:throw Error(t.name)}}};function YC(e,t){let n=t.sourceBuffer,r=t.destinationBuffer;e.gl.bindBuffer(q.COPY_READ_BUFFER,n.handle),e.gl.bindBuffer(q.COPY_WRITE_BUFFER,r.handle),e.gl.copyBufferSubData(q.COPY_READ_BUFFER,q.COPY_WRITE_BUFFER,t.sourceOffset??0,t.destinationOffset??0,t.size),e.gl.bindBuffer(q.COPY_READ_BUFFER,null),e.gl.bindBuffer(q.COPY_WRITE_BUFFER,null)}function XC(e,t){let{sourceBuffer:n,byteOffset:r=0,destinationTexture:i,mipLevel:a=0,origin:o=[0,0,0],aspect:s=`all`,bytesPerRow:c,rowsPerImage:l,size:u}=t;if(s!==`all`)throw Error(`copyBufferToTexture aspect is not supported in WebGL`);i.writeBuffer(n,{byteOffset:r,bytesPerRow:c,rowsPerImage:l,mipLevel:a,x:o[0]??0,y:o[1]??0,z:o[2]??0,width:u[0],height:u[1],depthOrArrayLayers:u[2]})}function ZC(e,t){let{sourceTexture:n,mipLevel:i=0,aspect:a=`all`,width:o=t.sourceTexture.width,height:s=t.sourceTexture.height,depthOrArrayLayers:c,origin:l=[0,0,0],destinationBuffer:u,byteOffset:d=0,bytesPerRow:f,rowsPerImage:p}=t;if(n instanceof j){n.readBuffer({x:l[0]??0,y:l[1]??0,z:l[2]??0,width:o,height:s,depthOrArrayLayers:c,mipLevel:i,aspect:a,byteOffset:d},u);return}if(a!==`all`)throw Error(`aspect not supported in WebGL`);if(i!==0||c!==void 0||f||p)throw Error(`not implemented`);let{framebuffer:m,destroyFramebuffer:h}=$C(n),g;try{let t=u,n=o||m.width,i=s||m.height,a=SS(r(m.colorAttachments[0]).texture.props.format),c=a.format,f=a.type;e.gl.bindBuffer(q.PIXEL_PACK_BUFFER,t.handle),g=e.gl.bindFramebuffer(q.FRAMEBUFFER,m.handle),e.gl.readPixels(l[0],l[1],n,i,c,f,d)}finally{e.gl.bindBuffer(q.PIXEL_PACK_BUFFER,null),g!==void 0&&e.gl.bindFramebuffer(q.FRAMEBUFFER,g),h&&m.destroy()}}function QC(e,t){let{sourceTexture:n,destinationMipLevel:r=0,origin:i=[0,0],destinationOrigin:a=[0,0,0],destinationTexture:o}=t,{width:s=t.destinationTexture.width,height:c=t.destinationTexture.height}=t,{framebuffer:l,destroyFramebuffer:u}=$C(n),[d=0,f=0]=i,[p,m,h]=a,g=e.gl.bindFramebuffer(q.FRAMEBUFFER,l.handle),_,v;if(o instanceof dC)_=o,s=Number.isFinite(s)?s:_.width,c=Number.isFinite(c)?c:_.height,_._bind(0),v=_.glTarget;else throw Error(`invalid destination`);switch(v){case q.TEXTURE_2D:case q.TEXTURE_CUBE_MAP:e.gl.copyTexSubImage2D(v,r,p,m,d,f,s,c);break;case q.TEXTURE_2D_ARRAY:case q.TEXTURE_3D:e.gl.copyTexSubImage3D(v,r,p,m,h,d,f,s,c);break;default:}_&&_._unbind(),e.gl.bindFramebuffer(q.FRAMEBUFFER,g),u&&l.destroy()}function $C(e){if(e instanceof j){let{width:t,height:n,id:r}=e;return{framebuffer:e.device.createFramebuffer({id:`framebuffer-for-${r}`,width:t,height:n,colorAttachments:[e]}),destroyFramebuffer:!0}}return{framebuffer:e,destroyFramebuffer:!1}}function ew(e){switch(e){case`point-list`:return q.POINTS;case`line-list`:return q.LINES;case`line-strip`:return q.LINE_STRIP;case`triangle-list`:return q.TRIANGLES;case`triangle-strip`:return q.TRIANGLE_STRIP;default:throw Error(e)}}function tw(e){switch(e){case`point-list`:return q.POINTS;case`line-list`:return q.LINES;case`line-strip`:return q.LINES;case`triangle-list`:return q.TRIANGLES;case`triangle-strip`:return q.TRIANGLES;default:throw Error(e)}}var nw=class extends ee{device;handle=null;glParameters={};pipeline=null;bindings={};bindingsPipeline=null;vertexArray=null;constructor(e,t){if(t.clipDepthMode===`zero-to-one`&&!e.features.has(`clip-control-webgl`))throw Error(`clip-control-webgl`);super(e,t),this.device=e;let n=this.props.framebuffer,r=!n||n.handle===null;r&&e.getDefaultCanvasContext()._resizeDrawingBufferIfNeeded();let i;if(!t?.parameters?.viewport)if(!r&&n){let{width:e,height:t}=n;i=[0,0,e,t]}else{let[t,n]=e.getDefaultCanvasContext().getDrawingBufferSize();i=[0,0,t,n]}if(this.device.pushState(),this.setParameters({viewport:i,...this.props.parameters}),!r&&n?.colorAttachments.length){let e=n.colorAttachments.map((e,t)=>q.COLOR_ATTACHMENT0+t);this.device.gl.drawBuffers(e)}else r&&this.device.gl.drawBuffers([q.BACK]);this.clear(),this.props.timestampQuerySet&&this.props.beginTimestampIndex!==void 0&&this.props.timestampQuerySet.writeTimestamp(this.props.beginTimestampIndex)}end(){this.destroyed||(this.props.timestampQuerySet&&this.props.endTimestampIndex!==void 0&&this.props.timestampQuerySet.writeTimestamp(this.props.endTimestampIndex),this.device.popState(),this.destroy())}pushDebugGroup(e){}popDebugGroup(){}insertDebugMarker(e){}executeBundles(e){throw Error(`Render bundles are only supported in WebGPU`)}setParameters(e={}){let t={...this.glParameters};t.framebuffer=this.props.framebuffer||null,this.props.depthReadOnly&&(t.depthMask=!this.props.depthReadOnly),this.props.stencilReadOnly&&(t.stencilMask=0),t[q.RASTERIZER_DISCARD]=this.props.discard,this.props.clipDepthMode&&(t[q.CLIP_DEPTH_MODE_EXT]=this.props.clipDepthMode===`zero-to-one`?q.ZERO_TO_ONE_EXT:q.NEGATIVE_ONE_TO_ONE_EXT),e.viewport&&(t.viewport=e.viewport.slice(0,4),e.viewport.length===6&&(t.depthRange=e.viewport.slice(4))),e.scissorRect===null?t.scissorTest=!1:e.scissorRect&&(t.scissorTest=e.scissorTest??!0,t.scissor=[...e.scissorRect]),e.blendConstant&&(t.blendColor=[...e.blendConstant]),e.stencilReference!==void 0&&(t[q.STENCIL_REF]=e.stencilReference,t[q.STENCIL_BACK_REF]=e.stencilBackReference??e.stencilReference),this.glParameters=t,Ax(this.device.gl,t)}getParameters(){let e=e=>this.device.gl.getParameter(e);return{viewport:[...e(q.VIEWPORT),...e(q.DEPTH_RANGE)],scissorRect:[...e(q.SCISSOR_BOX)],scissorTest:e(q.SCISSOR_TEST),blendConstant:[...e(q.BLEND_COLOR)],stencilReference:e(q.STENCIL_REF),stencilBackReference:e(q.STENCIL_BACK_REF)}}setPipeline(e){this.pipeline=e}setBindings(e,t){if(!this.pipeline)throw Error(`Call setPipeline() before setBindings()`);this.bindings=O(T(this.pipeline.shaderLayout,e)),this.bindingsPipeline=this.pipeline}setVertexArray(e){this.vertexArray=e}draw(t){let n=this.pipeline,r=this.vertexArray;if(!n)throw Error(`Call setPipeline() before draw()`);if(n.shaderLayout.bindings.length>0&&this.bindingsPipeline!==n)throw Error(`RenderPass.setBindings() must be called after setPipeline() before draw()`);n._syncLinkStatus();let{parameters:i=n.props.parameters,topology:a=n.props.topology,vertexCount:o,indexCount:s,instanceCount:c,isInstanced:l=!1,firstVertex:u=0,firstIndex:d=0,transformFeedback:f,uniforms:p=n.uniforms}=t,m=ew(a),h=!!r?.indexBuffer;if(s!==void 0&&!h)throw Error(`RenderPass.draw(): indexCount without index buffer`);let g=r?.indexBuffer?.glIndexType,_=d*(g===q.UNSIGNED_INT?4:2),v=s??o??0;if(n.linkStatus!==`success`)return e.info(2,`RenderPipeline:${n.id}.draw() aborted - waiting for shader linking`)(),!1;if(!n._areTexturesRenderable(this.bindings))return e.info(2,`RenderPipeline:${n.id}.draw() aborted - textures not yet loaded`)(),!1;this.device.gl.useProgram(n.handle),r?.bindBeforeRender(this);let y=f;return y&&y.begin(a),n._applyBindings(this.bindings,{disableWarnings:n.props.disableWarnings}),n._applyUniforms(p),US(this.device,i,this.glParameters,()=>{h&&l?this.device.gl.drawElementsInstanced(m,v,g,_,c||0):h?this.device.gl.drawElements(m,v,g,_):l?this.device.gl.drawArraysInstanced(m,u,o||0,c||0):this.device.gl.drawArrays(m,u,o||0),y&&y.end()}),r?.unbindAfterRender(this),!0}drawIndirect(e,t=0){throw Error(`Indirect drawing is only supported in WebGPU`)}drawIndexedIndirect(e,t=0){throw Error(`Indirect drawing is only supported in WebGPU`)}beginOcclusionQuery(e){this.props.occlusionQuerySet?.beginOcclusionQuery()}endOcclusionQuery(){this.props.occlusionQuerySet?.endOcclusionQuery()}clear(){let e={...this.glParameters},t=0;this.props.clearColors&&this.props.clearColors.forEach((e,t)=>{e&&this.clearColorBuffer(t,e)}),this.props.clearColor!==!1&&this.props.clearColors===void 0&&(t|=q.COLOR_BUFFER_BIT,e.clearColor=this.props.clearColor),this.props.clearDepth!==!1&&(t|=q.DEPTH_BUFFER_BIT,e.clearDepth=this.props.clearDepth),t!==0&&iC(this.device.gl,e,()=>{this.device.gl.clear(t)}),!this.props.stencilReadOnly&&this.props.clearStencil!==!1&&iC(this.device.gl,{...e,clearStencil:this.props.clearStencil,stencilMask:4294967295,scissorTest:!1},()=>this.device.gl.clear(q.STENCIL_BUFFER_BIT))}clearColorBuffer(e=0,t=[0,0,0,0]){iC(this.device.gl,{framebuffer:this.props.framebuffer},()=>{switch(t.constructor){case Int8Array:case Int16Array:case Int32Array:this.device.gl.clearBufferiv(q.COLOR,e,t);break;case Uint8Array:case Uint8ClampedArray:case Uint16Array:case Uint32Array:this.device.gl.clearBufferuiv(q.COLOR,e,t);break;case Float32Array:case Float16Array:this.device.gl.clearBufferfv(q.COLOR,e,t);break;default:throw Error(`invalid color`)}})}},rw=class extends w{device;handle=null;commandBuffer;constructor(e,t){super(e,t),this.device=e,this.commandBuffer=new JC(e,{id:this.id,userData:this.userData})}finish(){return this.destroy(),this.commandBuffer}beginRenderPass(e={}){return this.commandBuffer.flushCommands(),new nw(this.device,this._applyTimeProfilingToPassProps(e))}beginComputePass(e={}){throw Error(`ComputePass not supported in WebGL`)}copyBufferToBuffer(e){this.commandBuffer.commands.push({name:`copy-buffer-to-buffer`,options:e})}copyBufferToTexture(e){this.commandBuffer.commands.push({name:`copy-buffer-to-texture`,options:e})}copyTextureToBuffer(e){this.commandBuffer.commands.push({name:`copy-texture-to-buffer`,options:e})}copyTextureToTexture(e){this.commandBuffer.commands.push({name:`copy-texture-to-texture`,options:e})}pushDebugGroup(e){}popDebugGroup(){}insertDebugMarker(e){}resolveQuerySet(e,t,n){throw Error(`resolveQuerySet is not supported in WebGL`)}writeTimestamp(e,t){e.writeTimestamp(t)}};function iw(e){let{target:t,source:n,start:r=0,count:i=1}=e,a=n.length,o=i*a,s=0;for(let e=r;s<a;s++)t[e++]=n[s]??0;for(;s<o;)s<o-s?(t.copyWithin(r+s,r,r+s),s*=2):(t.copyWithin(r+s,r,r+o-s),s=o);return e.target}var aw=class e extends ie{get[Symbol.toStringTag](){return`VertexArray`}device;handle;attributeInfosByLocation;buffer=null;bufferValue=null;static isConstantAttributeZeroSupported(e){return f()===`Chrome`}constructor(e,t){super(e,t),this.device=e,this.handle=this.device.gl.createVertexArray(),this.attributeInfosByLocation=Array(this.maxVertexAttributes).fill(null);for(let e of Object.values(Jo(t.shaderLayout,t.bufferLayout)))this.attributeInfosByLocation[e.location]=e}destroyHandle(){this.buffer&&this.buffer?.destroy(),this.handle&&=(this.device.gl.deleteVertexArray(this.handle),void 0)}setIndexBuffer(e){let t=this.device.gl,n=e;if(n&&n.glTarget!==q.ELEMENT_ARRAY_BUFFER)throw Error(`INDEX mismatch`);t.bindVertexArray(this.handle),t.bindBuffer(q.ELEMENT_ARRAY_BUFFER,n?n.handle:null),this.indexBuffer=n,t.bindVertexArray(null)}setBuffer(e,t,n=0){let r=this.device.gl,i=t;if(i.glTarget===q.ELEMENT_ARRAY_BUFFER)throw Error(`INDEX mismatch`);let{size:a,type:o,stride:s,offset:c,normalized:l,integer:u,divisor:d}=this._getAccessor(e);r.bindVertexArray(this.handle),r.bindBuffer(q.ARRAY_BUFFER,i.handle),u?r.vertexAttribIPointer(e,a,o,s,c+n):r.vertexAttribPointer(e,a,o,l,s,c+n),r.bindBuffer(q.ARRAY_BUFFER,null),r.enableVertexAttribArray(e),r.vertexAttribDivisor(e,d||0),this.attributes[e]=i,this.attributeByteOffsets[e]=n,r.bindVertexArray(null)}setConstantWebGL(e,t){this._enable(e,!1),this.attributes[e]=t}bindBeforeRender(){this.device.gl.bindVertexArray(this.handle),this._applyConstantAttributes()}unbindAfterRender(){this.device.gl.bindVertexArray(null)}_applyConstantAttributes(){for(let e=0;e<this.maxVertexAttributes;++e){let t=this.attributes[e];ArrayBuffer.isView(t)&&this.device.setConstantAttributeWebGL(e,t)}}_getAccessor(e){let t=this.attributeInfosByLocation[e];if(!t)throw Error(`Unknown attribute location ${e}`);let n=Xx(t.bufferDataType);return{size:t.bufferComponents,type:n,stride:t.byteStride,offset:t.byteOffset,normalized:t.normalized,integer:t.integer,divisor:t.stepMode===`instance`?1:0}}_enable(t,n=!0){let r=this.device.gl,i=e.isConstantAttributeZeroSupported(this.device)||t!==0;(n||i)&&(t=Number(t),r.bindVertexArray(this.handle),n?r.enableVertexAttribArray(t):r.disableVertexAttribArray(t),r.bindVertexArray(null))}getConstantBuffer(e,t){let n=ow(t),r=n.byteLength*e,i=n.length*e;if(this.buffer&&r!==this.buffer.byteLength)throw Error(`Buffer size is immutable, byte length ${r} !== ${this.buffer.byteLength}.`);let a=!this.buffer;if(this.buffer=this.buffer||this.device.createBuffer({byteLength:r}),a||=!sw(n,this.bufferValue),a){let e=Fo(t.constructor,i);iw({target:e,source:n,start:0,count:i}),this.buffer.write(e),this.bufferValue=t}return this.buffer}};function ow(e){return Array.isArray(e)?new Float32Array(e):e}function sw(e,t){if(!e||!t||e.length!==t.length||e.constructor!==t.constructor)return!1;for(let n=0;n<e.length;++n)if(e[n]!==t[n])return!1;return!0}var cw=class extends Mo{device;gl;handle;layout;buffers={};unusedBuffers={};bindOnUse=!0;_bound=!1;constructor(e,t){super(e,t),this.device=e,this.gl=e.gl,this.handle=this.props.handle||this.gl.createTransformFeedback(),this.layout=this.props.layout,t.buffers&&this.setBuffers(t.buffers),Object.seal(this)}destroyHandle(){this.gl.deleteTransformFeedback(this.handle)}begin(e=`point-list`){this.gl.bindTransformFeedback(q.TRANSFORM_FEEDBACK,this.handle),this.bindOnUse&&this._bindBuffers(),this.gl.beginTransformFeedback(tw(e))}end(){this.gl.endTransformFeedback(),this.bindOnUse&&this._unbindBuffers(),this.gl.bindTransformFeedback(q.TRANSFORM_FEEDBACK,null)}setBuffers(e){this.buffers={},this.unusedBuffers={},this.bind(()=>{for(let[t,n]of Object.entries(e))this.setBuffer(t,n)})}setBuffer(t,n){let r=this._getVaryingIndex(t),{buffer:i,byteLength:a,byteOffset:o}=this._getBufferRange(n);if(r<0){this.unusedBuffers[t]=i,e.warn(`${this.id} unusedBuffers varying buffer ${t}`)();return}this.buffers[r]={buffer:i,byteLength:a,byteOffset:o},this.bindOnUse||this._bindBuffer(r,i,o,a)}getBuffer(e){if(lw(e))return this.buffers[e]||null;let t=this._getVaryingIndex(e);return this.buffers[t]??null}bind(e=this.handle){if(typeof e!=`function`)return this.gl.bindTransformFeedback(q.TRANSFORM_FEEDBACK,e),this;let t;return this._bound?t=e():(this.gl.bindTransformFeedback(q.TRANSFORM_FEEDBACK,this.handle),this._bound=!0,t=e(),this._bound=!1,this.gl.bindTransformFeedback(q.TRANSFORM_FEEDBACK,null)),t}unbind(){this.bind(null)}_getBufferRange(e){if(e instanceof IS)return{buffer:e,byteOffset:0,byteLength:e.byteLength};let{buffer:t,byteOffset:n=0,byteLength:r=e.buffer.byteLength}=e;return{buffer:t,byteOffset:n,byteLength:r}}_getVaryingIndex(e){if(lw(e))return Number(e);for(let t of this.layout.varyings||[])if(e===t.name)return t.location;return-1}_bindBuffers(){for(let[e,t]of Object.entries(this.buffers)){let{buffer:n,byteLength:r,byteOffset:i}=this._getBufferRange(t);this._bindBuffer(Number(e),n,i,r)}}_unbindBuffers(){for(let e in this.buffers)this.gl.bindBufferBase(q.TRANSFORM_FEEDBACK_BUFFER,Number(e),null)}_bindBuffer(e,t,n=0,r){let i=t&&t.handle;!i||r===void 0?this.gl.bindBufferBase(q.TRANSFORM_FEEDBACK_BUFFER,e,i):this.gl.bindBufferRange(q.TRANSFORM_FEEDBACK_BUFFER,e,i,n,r)}};function lw(e){return typeof e==`number`?Number.isInteger(e):/^\d+$/.test(e)}var uw=class extends D{device;handle;_timestampPairs=[];_pendingReads=new Set;_occlusionQuery=null;_occlusionActive=!1;get[Symbol.toStringTag](){return`QuerySet`}constructor(e,t){if(super(e,t),this.device=e,t.type===`timestamp`){if(t.count<2)throw Error(`Timestamp QuerySet requires at least two query slots`);this._timestampPairs=Array(Math.ceil(t.count/2)).fill(null).map(()=>({activeQuery:null,completedQueries:[]})),this.handle=null}else{if(t.count>1)throw Error(`WebGL occlusion QuerySet can only have one value`);let e=this.device.gl.createQuery();if(!e)throw Error(`WebGL query not supported`);this.handle=e}Object.seal(this)}destroyHandle(){this.handle&&this.device.gl.deleteQuery(this.handle);for(let e of this._timestampPairs){e.activeQuery&&(this._cancelPendingQuery(e.activeQuery),this.device.gl.deleteQuery(e.activeQuery.handle));for(let t of e.completedQueries)this._cancelPendingQuery(t),this.device.gl.deleteQuery(t.handle)}this._occlusionQuery&&(this._cancelPendingQuery(this._occlusionQuery),this.device.gl.deleteQuery(this._occlusionQuery.handle));for(let e of Array.from(this._pendingReads))this._cancelPendingQuery(e)}isResultAvailable(e){return this.props.type===`timestamp`?e===void 0?this._timestampPairs.some((e,t)=>this._isTimestampPairAvailable(t)):this._isTimestampPairAvailable(this._getTimestampPairIndex(e)):this._occlusionQuery?this._pollQueryAvailability(this._occlusionQuery):!1}async readResults(e){let t=e?.firstQuery||0,n=e?.queryCount||this.props.count-t;if(this._validateRange(t,n),this.props.type===`timestamp`){let e=Array(n).fill(0n),r=Math.floor(t/2),i=Math.floor((t+n-1)/2);for(let a=r;a<=i;a++){let r=await this._consumeTimestampPairResult(a),i=a*2,o=i+1;i>=t&&i<t+n&&(e[i-t]=0n),o>=t&&o<t+n&&(e[o-t]=r)}return e}if(!this._occlusionQuery)throw Error(`Occlusion query has not been started`);return[await this._consumeQueryResult(this._occlusionQuery)]}async readTimestampDuration(e,t){if(this.props.type!==`timestamp`)throw Error(`Timestamp durations require a timestamp QuerySet`);if(e<0||t>=this.props.count||t<=e)throw Error(`Timestamp duration range is out of bounds`);if(e%2!=0||t!==e+1)throw Error(`WebGL timestamp durations require adjacent even/odd query indices`);let n=await this._consumeTimestampPairResult(this._getTimestampPairIndex(e));return Number(n)/1e6}beginOcclusionQuery(){if(this.props.type!==`occlusion`)throw Error(`Occlusion queries require an occlusion QuerySet`);if(!this.handle)throw Error(`WebGL occlusion query is not available`);if(this._occlusionActive)throw Error(`Occlusion query is already active`);this.device.gl.beginQuery(q.ANY_SAMPLES_PASSED,this.handle),this._occlusionQuery={handle:this.handle,promise:null,result:null,disjoint:!1,cancelled:!1,pollRequestId:null,resolve:null,reject:null},this._occlusionActive=!0}endOcclusionQuery(){if(!this._occlusionActive)throw Error(`Occlusion query is not active`);this.device.gl.endQuery(q.ANY_SAMPLES_PASSED),this._occlusionActive=!1}writeTimestamp(e){if(this.props.type!==`timestamp`)throw Error(`Timestamp writes require a timestamp QuerySet`);let t=this._getTimestampPairIndex(e),n=this._timestampPairs[t];if(e%2==0){if(n.activeQuery)throw Error(`Timestamp query pair is already active`);let e=this.device.gl.createQuery();if(!e)throw Error(`WebGL query not supported`);let t={handle:e,promise:null,result:null,disjoint:!1,cancelled:!1,pollRequestId:null,resolve:null,reject:null};this.device.gl.beginQuery(q.TIME_ELAPSED_EXT,e),n.activeQuery=t;return}if(!n.activeQuery)throw Error(`Timestamp query pair was ended before it was started`);this.device.gl.endQuery(q.TIME_ELAPSED_EXT),n.completedQueries.push(n.activeQuery),n.activeQuery=null}_validateRange(e,t){if(e<0||t<0||e+t>this.props.count)throw Error(`Query read range is out of bounds`)}_getTimestampPairIndex(e){if(e<0||e>=this.props.count)throw Error(`Query index is out of bounds`);return Math.floor(e/2)}_isTimestampPairAvailable(e){let t=this._timestampPairs[e];return!t||t.completedQueries.length===0?!1:this._pollQueryAvailability(t.completedQueries[0])}_pollQueryAvailability(e){if(e.cancelled||this.destroyed)return e.result=0n,!0;if(e.result!==null||e.disjoint)return!0;if(!this.device.gl.getQueryParameter(e.handle,q.QUERY_RESULT_AVAILABLE))return!1;let t=!!this.device.gl.getParameter(q.GPU_DISJOINT_EXT);return e.disjoint=t,e.result=t?0n:BigInt(this.device.gl.getQueryParameter(e.handle,q.QUERY_RESULT)),!0}async _consumeTimestampPairResult(e){let t=this._timestampPairs[e];if(!t||t.completedQueries.length===0)throw Error(`Timestamp query pair has no completed result`);let n=t.completedQueries.shift();try{return await this._consumeQueryResult(n)}finally{this.device.gl.deleteQuery(n.handle)}}_consumeQueryResult(e){return e.promise?e.promise:(this._pendingReads.add(e),e.promise=new Promise((t,n)=>{e.resolve=t,e.reject=n;let r=()=>{if(e.pollRequestId=null,e.cancelled||this.destroyed){this._pendingReads.delete(e),e.promise=null,e.resolve=null,e.reject=null,t(0n);return}if(!this._pollQueryAvailability(e)){e.pollRequestId=this._requestAnimationFrame(r);return}this._pendingReads.delete(e),e.promise=null,e.resolve=null,e.reject=null,e.disjoint?n(Error(`GPU timestamp query was invalidated by a disjoint event`)):t(e.result||0n)};r()}),e.promise)}_cancelPendingQuery(e){if(this._pendingReads.delete(e),e.cancelled=!0,e.pollRequestId!==null&&(this._cancelAnimationFrame(e.pollRequestId),e.pollRequestId=null),e.resolve){let t=e.resolve;e.promise=null,e.resolve=null,e.reject=null,t(0n)}}_requestAnimationFrame(e){return requestAnimationFrame(e)}_cancelAnimationFrame(e){cancelAnimationFrame(e)}},dw=class extends S{device;gl;handle;signaled;_signaled=!1;constructor(e,t={}){super(e,t),this.device=e,this.gl=e.gl;let n=this.props.handle||this.gl.fenceSync(this.gl.SYNC_GPU_COMMANDS_COMPLETE,0);if(!n)throw Error(`Failed to create WebGL fence`);this.handle=n,this.signaled=new Promise(e=>{let t=()=>{let n=this.gl.clientWaitSync(this.handle,0,0);n===this.gl.ALREADY_SIGNALED||n===this.gl.CONDITION_SATISFIED?(this._signaled=!0,e()):setTimeout(t,1)};t()})}isSignaled(){return this._signaled?!0:(this._signaled=this.gl.getSyncParameter(this.handle,this.gl.SYNC_STATUS)===this.gl.SIGNALED,this._signaled)}destroyHandle(){this.handle&&this.ownsHandle&&this.gl.deleteSync(this.handle)}};function fw(e){switch(e){case q.ALPHA:case q.R32F:case q.RED:case q.RED_INTEGER:return 1;case q.RG32I:case q.RG32UI:case q.RG32F:case q.RG_INTEGER:case q.RG:return 2;case q.RGB:case q.RGB_INTEGER:case q.RGB32F:return 3;case q.RGBA:case q.RGBA_INTEGER:case q.RGBA32F:return 4;default:return 0}}function pw(e){switch(e){case q.UNSIGNED_BYTE:return 1;case q.UNSIGNED_SHORT_5_6_5:case q.UNSIGNED_SHORT_4_4_4_4:case q.UNSIGNED_SHORT_5_5_5_1:return 2;case q.FLOAT:return 4;default:return 0}}function mw(e,t){let{sourceX:n=0,sourceY:r=0,sourceAttachment:a=0}=t||{},{target:o=null,sourceWidth:s,sourceHeight:c,sourceDepth:l,sourceFormat:u,sourceType:d}=t||{},{framebuffer:f,deleteFramebuffer:p}=gw(e),{gl:m,handle:h}=f;s||=f.width,c||=f.height;let g=f.colorAttachments[a]?.texture;if(!g)throw Error(`Invalid framebuffer attachment ${a}`);l=g?.depth||1,u||=g?.glFormat||q.RGBA,d||=g?.glType||q.UNSIGNED_BYTE,o=vw(o,d,u,s,c,l);let _=i.getDataType(o);d||=_C(_);let v=m.bindFramebuffer(q.FRAMEBUFFER,h);return m.readBuffer(m.COLOR_ATTACHMENT0+a),m.readPixels(n,r,s,c,u,d,o),m.readBuffer(m.COLOR_ATTACHMENT0),m.bindFramebuffer(q.FRAMEBUFFER,v||null),p&&f.destroy(),o}function hw(e,t){let{target:n,sourceX:r=0,sourceY:i=0,sourceFormat:a=q.RGBA,targetByteOffset:o=0}=t||{},{sourceWidth:s,sourceHeight:c,sourceType:l}=t||{},{framebuffer:u,deleteFramebuffer:d}=gw(e);s||=u.width,c||=u.height;let f=u;l||=q.UNSIGNED_BYTE;let p=n;if(!p){let e=fw(a),t=pw(l),n=o+s*c*e*t;p=f.device.createBuffer({byteLength:n})}let m=e.device.createCommandEncoder();return m.copyTextureToBuffer({sourceTexture:e,width:s,height:c,origin:[r,i],destinationBuffer:p,byteOffset:o}),m.destroy(),d&&u.destroy(),p}function gw(e){return e instanceof y?{framebuffer:e,deleteFramebuffer:!1}:{framebuffer:_w(e),deleteFramebuffer:!0}}function _w(e,t){let{device:n,width:r,height:i,id:a}=e;return n.createFramebuffer({...t,id:`framebuffer-for-${a}`,width:r,height:i,colorAttachments:[e]})}function vw(e,t,n,r,a,o){if(e)return e;t||=q.UNSIGNED_BYTE;let s=sC(t),c=i.getTypedArrayConstructor(s),l=fw(n);return new c(r*a*l)}function yw(e){let t=new Map;for(let n in e){let r=e[n];if(n<`a`){let e=t.get(r);t.set(r,e?`${e}, GL.${n}`:`GL.${n}`)}}return t}var bw=st({WebGLDevice:()=>xw}),xw=class t extends se{static getDeviceFromContext(e){return e?e.luma?.device??null:null}type=`webgl`;handle;features;limits;info;canvasContext;preferredColorFormat=`rgba8unorm`;preferredDepthFormat=`depth24plus`;commandEncoder;lost;_resolveContextLost;_lossWasRequested=!1;_isLost=!1;gl;_glKeyByValue=null;extensions;_polyfilled=!1;spectorJS;get[Symbol.toStringTag](){return`WebGLDevice`}toString(){return`${this[Symbol.toStringTag]}(${this.id})`}isVertexFormatSupported(e){switch(e){case`unorm8x4-bgra`:return!1;default:return!0}}contextEvents=new AbortController;constructor(n){super({...n,id:n.id||FS(`webgl-device`)});let r=se._getCanvasContextProps(n);if(!r)throw Error(`WebGLDevice requires props.createCanvasContext to be set`);let i=r.canvas?.gl??null,a=t.getDeviceFromContext(i);if(a)throw Error(`WebGL context already attached to device ${a.id}`);this.canvasContext=new MS(this,r),this.lost=new Promise(e=>{this._resolveContextLost=e});let o={...n.webgl};r.alphaMode===`premultiplied`&&(o.premultipliedAlpha=!0),n.powerPreference!==void 0&&(o.powerPreference=n.powerPreference),n.failIfMajorPerformanceCaveat!==void 0&&(o.failIfMajorPerformanceCaveat=n.failIfMajorPerformanceCaveat);let s=this.props._handle,c=s||Ux(this.canvasContext.canvas,{signal:this.contextEvents.signal,onContextLost:e=>this._resolveContextLost?.({reason:this._lossWasRequested?`destroyed`:`unknown`,message:this._lossWasRequested?`Application triggered context loss`:`Entered sleep mode, or too many apps or browser tabs are using the GPU.`}),onContextRestored:e=>{console.log(`WebGL context restored`)}},o);if(!c)throw Error(`WebGL context creation failed`);if(a=t.getDeviceFromContext(c),a){if(this.canvasContext.destroy(),this.contextEvents.abort(),n._reuseDevices)return a._reused=!0,a;throw Error(`WebGL context already attached to device ${a.id}`)}this.handle=c,this.gl=c,this.spectorJS=ix({...this.props,gl:this.handle});let l=Hx(this.handle);l.device=this,l.extensions||={},this.extensions=l.extensions,this.info=Gx(this.gl,this.extensions),this.limits=new OS(this.gl),this.features=new DS(this.gl,this.extensions,this.props._disabledFeatures),this.props._initializeFeatures&&this.features.initializeFeatures(),(Ix.get(this.gl)||new Ix(this.gl,{log:(...t)=>e.log(1,...t)()})).trackState(this.gl,{copyState:!!(s||r.canvas)}),(n.debug||n.debugWebGL)&&(this.gl=nx(this.gl,{debugWebGL:!0,traceWebGL:n.debugWebGL}),e.warn(`WebGL debug mode activated. Performance reduced.`)()),n.debugWebGL&&(e.level=Math.max(e.level,1)),this.commandEncoder=new rw(this,{id:`${this}-command-encoder`}),this.canvasContext._startObservers()}get ownsHandle(){return this.props.ownsHandle??(!this.props._handle&&!this.props._reuseDevices&&!this._reused)}destroy(){this.contextEvents.signal.aborted||this.props.ownsHandle===void 0&&(this.props._reuseDevices||this._reused)||(this.contextEvents.abort(),this.commandEncoder?.destroy(),this.canvasContext.destroy(),Hx(this.handle).device=null,this.ownsHandle&&this.loseDevice(),this._isLost=!0)}get isLost(){return this._isLost||this.gl.isContextLost()}createCanvasContext(e){throw Error(`WebGL only supports a single canvas`)}createPresentationContext(e){return new NS(this,e||{})}createBuffer(e){this._assertContext();let t=this._normalizeBufferProps(e);return new IS(this,t)}createTexture(e){return this._assertContext(),new dC(this,e)}createExternalTexture(e){throw Error(`ExternalTexture is not available on WebGL`)}createSampler(e){return this._assertContext(),new rC(this,e)}createShader(e){return this._assertContext(),new VS(this,e)}_assertContext(){if(this.contextEvents.signal.aborted||this.gl.isContextLost())throw Error(`WebGL context is lost`)}createFramebuffer(e){return new kS(this,e)}createVertexArray(e){return new aw(this,e)}createTransformFeedback(e){return new cw(this,e)}createQuerySet(e){return new uw(this,e)}createFence(){return new dw(this)}createRenderPipeline(e){return new HC(this,e)}_createSharedRenderPipelineWebGL(e){return new qC(this,e)}createComputePipeline(e){throw Error(`ComputePipeline not supported in WebGL`)}createRenderBundleEncoder(e){throw Error(`Render bundles are only supported in WebGPU`)}createCommandEncoder(e={}){return new rw(this,e)}submit(e){let t=null;e||({submittedCommandEncoder:t,commandBuffer:e}=this._finalizeDefaultCommandEncoderForSubmit());try{e.flushCommands(),t&&t.resolveTimeProfilingQuerySet().then(()=>{this.commandEncoder._gpuTimeMs=t._gpuTimeMs}).catch(()=>{})}finally{e.destroy()}}writeBufferViaCommandEncoder(e,t,n,r=0){e.commandBuffer.flushCommands(),t.write(n,r)}_finalizeDefaultCommandEncoderForSubmit(){let e=this.commandEncoder,t=e.finish();return this.commandEncoder.destroy(),this.commandEncoder=this.createCommandEncoder({id:e.props.id,timeProfilingQuerySet:e.getTimeProfilingQuerySet()}),{submittedCommandEncoder:e,commandBuffer:t}}readPixelsToArrayWebGL(e,t){return mw(e,t)}readPixelsToBufferWebGL(e,t){return hw(e,t)}setParametersWebGL(e){Ax(this.gl,e)}getParametersWebGL(e){return jx(this.gl,e)}withParametersWebGL(e,t){return iC(this.gl,e,t)}resetWebGL(){e.warn(`WebGLDevice.resetWebGL is deprecated, use only for debugging`)(),Mx(this.gl)}_getDeviceSpecificTextureFormatCapabilities(e){return bS(this.gl,e,this.extensions)}loseDevice(){this._lossWasRequested=!0,this._isLost=!0;let e=!1,t=this.getExtension(`WEBGL_lose_context`).WEBGL_lose_context;return t&&(e=!0,t.loseContext()),this._resolveContextLost?.({reason:`destroyed`,message:`Application triggered context loss`}),e}pushState(){Ix.get(this.gl).push()}popState(){Ix.get(this.gl).pop()}getGLKey(e,t){return this._getGLKeyByValue().get(Number(e))||(t?.emptyIfUnknown?``:String(e))}getGLKeys(e){let t={emptyIfUnknown:!0};return Object.entries(e).reduce((e,[n,r])=>(e[`${n}:${this.getGLKey(n,t)}`]=`${r}:${this.getGLKey(r,t)}`,e),{})}_getGLKeyByValue(){return this._glKeyByValue??=yw(this.gl),this._glKeyByValue}setConstantAttributeWebGL(e,t){switch(t.constructor){case Float32Array:Sw(this,e,t);break;case Int32Array:Cw(this,e,t);break;case Uint32Array:ww(this,e,t);break;default:throw Error(`constant`)}}getExtension(e){return Wx(this.gl,e,this.extensions),this.extensions}_setWebGLDebugMetadata(e,t,n){e.luma=t,e.__SPECTOR_Metadata={props:n.spector,id:n.spector.id}}};function Sw(e,t,n){switch(n.length){case 1:e.gl.vertexAttrib1fv(t,n);break;case 2:e.gl.vertexAttrib2fv(t,n);break;case 3:e.gl.vertexAttrib3fv(t,n);break;case 4:e.gl.vertexAttrib4fv(t,n);break;default:}}function Cw(e,t,n){n.length<4?e.gl.vertexAttribI4i(t,n[0]??0,n[1]??0,n[2]??0,1):e.gl.vertexAttribI4iv(t,n)}function ww(e,t,n){n.length<4?e.gl.vertexAttribI4ui(t,n[0]??0,n[1]??0,n[2]??0,1):e.gl.vertexAttribI4uiv(t,n)}function Tw(){}var Ew={id:``,width:`100%`,height:`100%`,style:null,viewState:null,initialViewState:null,pickingRadius:0,pickAsync:`auto`,layerFilter:null,parameters:{},parent:null,device:null,deviceProps:{},gl:null,canvas:null,_canvases:null,layers:[],effects:[],views:null,controller:null,useDevicePixels:!0,touchAction:`none`,eventRecognizerOptions:{},_framebuffer:null,_animate:!1,_pickable:!0,_typedArrayManagerProps:{},_customRender:null,widgets:[],onDeviceInitialized:Tw,onWebGLInitialized:Tw,onResize:Tw,onViewStateChange:Tw,onInteractionStateChange:Tw,onBeforeRender:Tw,onAfterRender:Tw,onLoad:Tw,onError:e=>N.error(e.message,e.cause)(),onHover:null,onClick:null,onDragStart:null,onDrag:null,onDragEnd:null,_onMetrics:null,getCursor:({isDragging:e})=>e?`grabbing`:`grab`,getTooltip:null,debug:!1,drawPickingColors:!1},Dw=class{constructor(e){this.width=0,this.height=0,this.userData={},this.device=null,this.canvas=null,this.viewManager=null,this.layerManager=null,this.effectManager=null,this.deckRenderer=null,this.deckPicker=null,this.eventManager=null,this.eventManagers={},this.widgetManager=null,this.tooltip=null,this.animationLoop=null,this._canvasContext=null,this._deviceResizeHandler=null,this.cursorState={isHovering:!1,isDragging:!1},this.stats=new Ln({id:`deck.gl`}),this.metrics={fps:0,setPropsTime:0,layersCount:0,drawLayersCount:0,updateLayersCount:0,updateAttributesCount:0,updateAttributesTime:0,framesRedrawn:0,pickTime:0,pickCount:0,pickLayersCount:0,gpuTime:0,gpuTimePerFrame:0,cpuTime:0,cpuTimePerFrame:0,bufferMemory:0,textureMemory:0,renderbufferMemory:0,gpuMemory:0},this._metricsCounter=0,this._hoverPickSequence=0,this._pointerDownPickSequence=0,this._needsRedraw=`Initial render`,this._canvasManager=new Gb({createEventManager:e=>this._createEventManager(e),getEventRoot:e=>this._getEventRoot(e)}),this._ownedCanvas=null,this._pickRequest={mode:`hover`,x:-1,y:-1,radius:0,canvasId:void 0,event:null,unproject3D:!1},this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this._onPointerMove=e=>{let{_pickRequest:t}=this,n=this._getCanvasIdFromEvent(e);if(e.type===`pointerleave`)t.x=-1,t.y=-1,t.radius=0,t.canvasId=n;else if(e.leftButton||e.rightButton)return;else{let r=e.offsetCenter;if(!r)return;t.x=r.x,t.y=r.y,t.radius=this.props.pickingRadius,t.canvasId=n}this.layerManager&&(this.layerManager.context.mousePosition={x:t.x,y:t.y}),t.event=e},this._onEvent=e=>{let t=Mf[e.type],n=e.offsetCenter,r=this._getCanvasIdFromEvent(e);if(!t||!n||!this.layerManager)return;let i=this.layerManager.getLayers(),a=this._getInternalPickingMode();if(a){if(a===`sync`){let t=e.type===`click`&&this._shouldUnproject3D(i)?this._getFirstPickedInfo(this._pickPointSync(this._getPointPickOptions(n.x,n.y,{unproject3D:!0,canvasId:r},i))):this._getLastPointerDownPickingInfo(n.x,n.y,r,i);this._dispatchPickingEvent(t,e);return}(this._lastPointerDownInfoPromise||Promise.resolve(this._getLastPointerDownPickingInfo(n.x,n.y,r,i))).then(t=>{this._dispatchPickingEvent(t,e)}).catch(e=>this.props.onError?.(e))}},this._onPointerDown=e=>{let t=e.offsetCenter,n=this._getCanvasIdFromEvent(e);if(!t)return;let r=this._getInternalPickingMode();if(!r)return;let i=this.layerManager?.getLayers()||[],a=++this._pointerDownPickSequence;if(r===`sync`){let e=this._pickPointSync({x:t.x,y:t.y,canvasId:n,radius:this.props.pickingRadius}),r=this._getFirstPickedInfo(e);this._lastPointerDownInfo=r,this._lastPointerDownInfoPromise=Promise.resolve(r);return}let o=this._pickPointAsync(this._getPointPickOptions(t.x,t.y,{canvasId:n},i)).then(e=>this._getFirstPickedInfo(e)).then(e=>(a===this._pointerDownPickSequence&&(this._lastPointerDownInfo=e),e)).catch(e=>{this.props.onError?.(e);let r=this.deckPicker&&this.viewManager?this._getLastPointerDownPickingInfo(t.x,t.y,n,i):{};return a===this._pointerDownPickSequence&&(this._lastPointerDownInfo=r),r});this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=o};let t=e;this.props={...Ew,...e},e=this.props,this._validateCanvasConfiguration(e),e.viewState&&e.initialViewState&&N.warn("View state tracking is disabled. Use either `initialViewState` for auto update or `viewState` for manual update.")(),this.viewState=this.props.initialViewState,e.device&&(this.device=e.device,this._setDeviceCanvasContext(e.device));let n=this.device;!n&&e.gl&&(e.gl instanceof WebGLRenderingContext&&N.error(`WebGL1 context not supported.`)(),n=px.attach(e.gl,{_cacheShaders:!0,_cachePipelines:!0,...this.props.deviceProps})),n||=this._createDevice(e),this.animationLoop=this._createAnimationLoop(n,e),this.setProps(t),e._typedArrayManagerProps&&Pm.setOptions(e._typedArrayManagerProps),this.animationLoop.start()}finalize(){this._restoreDeviceResizeHandler(),this.animationLoop?.stop(),this.animationLoop?.destroy(),this.animationLoop=null,this._hoverPickSequence++,this._pointerDownPickSequence++,this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this.layerManager?.finalize(),this.layerManager=null,this.viewManager?.finalize(),this.viewManager=null,this.effectManager?.finalize(),this.effectManager=null,this.deckRenderer?.finalize(),this.deckRenderer=null,this.deckPicker?.finalize(),this.deckPicker=null,Object.keys(this._canvasManager.targets).length||this.eventManager?.destroy(),this.eventManager=null,this.eventManagers={},this.widgetManager?.finalize(),this.widgetManager=null,this._canvasManager.finalize(),this._isMultiCanvasMode()?this.canvas=null:this.canvas&&this.canvas===this._ownedCanvas&&(this.canvas.parentElement?.removeChild(this.canvas),this.canvas=null,this._ownedCanvas=null),this._canvasContext=null}setProps(e){this.stats.get(`setProps Time`).timeStart(),`onLayerHover`in e&&N.removed(`onLayerHover`,`onHover`)(),`onLayerClick`in e&&N.removed(`onLayerClick`,`onClick`)(),e.initialViewState&&!G(this.props.initialViewState,e.initialViewState,3)&&(this.viewState=e.initialViewState),K(!(`_canvases`in e)||Array.isArray(e._canvases)===this._isMultiCanvasMode()),Object.assign(this.props,e),this._validateCanvasConfiguration(this.props),this._validateInternalPickingMode(),this.device&&this._isMultiCanvasMode()&&this._syncCanvasTargets(),this._setCanvasSize(this.props);let t=Object.create(this.props);if(Object.assign(t,{views:this._getViews(),width:this.width,height:this.height,viewState:this._getViewState(),eventManagers:this.eventManagers}),e.device&&e.device.id!==this.device?.id){let t=e.device.getDefaultCanvasContext();this.animationLoop?.stop(),!this._isMultiCanvasMode()&&this.canvas!==t.canvas&&(this.canvas?.remove(),this.eventManager?.destroy(),this.canvas=null),this._setDeviceCanvasContext(e.device),N.log(`recreating animation loop for new device! id=${e.device.id}`)(),this.animationLoop=this._createAnimationLoop(e.device,e),this.animationLoop.start()}if(this.animationLoop?.setProps(t),e.useDevicePixels!==void 0&&this._canvasContext?.setProps){this._canvasContext.setProps({useDevicePixels:e.useDevicePixels});for(let t of Object.values(this._canvasManager.targets))t.presentationContext.setProps({useDevicePixels:e.useDevicePixels})}this.layerManager&&(this.viewManager.setProps(t),this.layerManager.activateViewport(this.getViewports()[0]),this.layerManager.setProps(t),this.effectManager.setProps(t),this.deckRenderer.setProps(t),this.deckPicker.setProps(t),this.widgetManager.setProps(t)),this.stats.get(`setProps Time`).timeEnd()}needsRedraw(e={clearRedrawFlags:!1}){if(!this.layerManager)return!1;if(this.props._animate)return`Deck._animate`;let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);let n=this.viewManager.needsRedraw(e),r=this.layerManager.needsRedraw(e),i=this.effectManager.needsRedraw(e),a=this.deckRenderer.needsRedraw(e);return t=t||n||r||i||a,t}redraw(e){if(!this.layerManager)return;let t=this.needsRedraw({clearRedrawFlags:!0});t=e||t,t&&(this.stats.get(`Redraw Count`).incrementCount(),this.props._customRender?this.props._customRender(t):this._drawLayers(t))}get isInitialized(){return this.viewManager!==null}getViews(){return K(this.viewManager),this.viewManager.views}getView(e){return K(this.viewManager),this.viewManager.getView(e)}getViewports(e){return K(this.viewManager),this.viewManager.getViewports(e)}getCanvas(){return this.canvas}getCanvasContext(e){let t=e?this.viewManager?.getView(e)?.props.canvasId:void 0;return this._getCanvasContext(t)}getEventManager(e){if(!e||!this.viewManager)return this.eventManager;let t=this.viewManager.getCanvasId(e)||`default-canvas`;return this.eventManagers[t]||this.eventManager}async pickObjectAsync(e){let t=(await this._pickAsync(`pickObjectAsync`,`pickObject Time`,e)).result;return t.length?t[0]:null}async pickObjectsAsync(e){return await this._pickAsync(`pickObjectsAsync`,`pickObjects Time`,e)}pickObject(e){let t=this._pick(`pickObject`,`pickObject Time`,e).result;return t.length?t[0]:null}pickMultipleObjects(e){return e.depth=e.depth||10,this._pick(`pickObject`,`pickMultipleObjects Time`,e).result}pickObjects(e){return this._pick(`pickObjects`,`pickObjects Time`,e)}_pickPositionForController(e,t,n){return this._getInternalPickingMode()===`sync`?this.pickObject({x:e,y:t,radius:0,unproject3D:!0,canvasId:n?this.viewManager?.getCanvasId(n):void 0}):null}_addResources(e,t=!1){for(let n in e)this.layerManager.resourceManager.add({resourceId:n,data:e[n],forceUpdate:t})}_removeResources(e){for(let t of e)this.layerManager.resourceManager.remove(t)}_addDefaultEffect(e){this.effectManager.addDefaultEffect(e)}_addDefaultShaderModule(e){this.layerManager.addDefaultShaderModule(e)}_removeDefaultShaderModule(e){this.layerManager?.removeDefaultShaderModule(e)}_resolveInternalPickingMode(){let{pickAsync:e}=this.props,t=this.device?.type||this.props.deviceProps?.type;if(e===`auto`)return t===`webgpu`?`async`:`sync`;if(e===`sync`&&t===`webgpu`)throw Error('`pickAsync: "sync"` is not supported when Deck is using a WebGPU device.');return e}_getInternalPickingMode(){try{return this._resolveInternalPickingMode()}catch(e){return this.props.onError?.(e),null}}_validateInternalPickingMode(){this._getInternalPickingMode()}_getFirstPickedInfo({result:e,emptyInfo:t}){return e[0]||t}_shouldUnproject3D(e=this.layerManager?.getLayers()||[]){return e.some(e=>e.props.pickable===`3d`)}_getPointPickOptions(e,t,n={},r=this.layerManager?.getLayers()||[]){return{x:e,y:t,canvasId:n.canvasId,radius:this.props.pickingRadius,unproject3D:this._shouldUnproject3D(r),...n}}_pickPointSync(e){return this._pick(`pickObject`,`pickObject Time`,e)}_pickPointAsync(e){return this._pickAsync(`pickObjectAsync`,`pickObject Time`,e)}_getLastPointerDownPickingInfo(e,t,n,r=this.layerManager?.getLayers()||[]){return this.deckPicker.getLastPickedObject({x:e,y:t,layers:r,viewports:this.getViewports({x:e,y:t,canvasId:n})},this._lastPointerDownInfo)}_applyHoverCallbacks({result:e,emptyInfo:t},n){if(!this.widgetManager)return;this.cursorState.isHovering=e.some(e=>e.picked);let r=t,i=!1;for(let t of e)r=t,i=t.layer?.onHover(t,n)||i;i||(this.props.onHover?.(r,n),this.widgetManager.onHover(r,n))}_dispatchPickingEvent(e,t){if(!this.layerManager||!this.widgetManager)return;let n=Mf[t.type];if(!n)return;let{layer:r}=e,i=r&&(r[n]||r.props[n]),a=this.props[n],o=!1;i&&(o=i.call(r,e,t)),o||(a?.(e,t),this.widgetManager.onEvent(e,t))}_pickAsync(e,t,n){K(this.deckPicker);let{stats:r}=this,i=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,a=this._getCanvasContext(i)||void 0;r.get(`Pick Count`).incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(i);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:i}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:i,canvasContext:a});return r.get(t).timeEnd(),o}_pick(e,t,n){K(this.deckPicker);let{stats:r}=this,i=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,a=this._getCanvasContext(i)||void 0;r.get(`Pick Count`).incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(i);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:i}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:i,canvasContext:a});return r.get(t).timeEnd(),o}_createCanvas(e){let t=e.canvas;return typeof t==`string`&&(t=document.getElementById(t),K(t)),t?this._ownedCanvas=null:(t=document.createElement(`canvas`),t.id=e.id||`deckgl-overlay`,e.width&&typeof e.width==`number`&&(t.width=e.width),e.height&&typeof e.height==`number`&&(t.height=e.height),(e.parent||document.body).appendChild(t),this._ownedCanvas=t),Object.assign(t.style,e.style),t}_isMultiCanvasMode(){return Array.isArray(this.props._canvases)}_getDefaultCanvasId(){return this._canvasManager.order[0]||`default-canvas`}_validateCanvasConfiguration(e){Array.isArray(e._canvases)&&(K(!e.canvas),K(!e.gl),K(!e.device?.canvasContext||e.device.getDefaultCanvasContext().offscreenCanvas))}_createEventManager(e){let t=new kf(e,{touchAction:this.props.touchAction,recognizers:Object.keys(Nf).map(e=>{let[t,n,r,i]=Nf[e],a=this.props.eventRecognizerOptions?.[e];return{recognizer:new t({...n,...a,event:e}),recognizeWith:r,requireFailure:i}}),events:{pointerdown:this._onPointerDown,pointermove:this._onPointerMove,pointerleave:this._onPointerMove}});for(let e in Mf)e===`dblclick`?t.watch(e,this._onEvent):t.on(e,this._onEvent);return t}_getEventRoot(e){return e.closest(`.deck-events-root`)||this.props.parent?.querySelector(`.deck-events-root`)||e}_syncCanvasTargets(){if(!this.device||!this._isMultiCanvasMode())return;this._canvasManager.syncCanvasEntries({device:this.device,canvases:this.props._canvases||[],useDevicePixels:this.props.useDevicePixels}),this.eventManagers=this._canvasManager.eventManagers;let e=this._getDefaultCanvasId();this.eventManager=this.eventManagers[e]||null,this.canvas=this._canvasManager.targets[e]?.canvas||null}_setCanvasContext(e){this._canvasContext=e,`style`in e.canvas&&(this.canvas=e.canvas)}_setDeviceCanvasContext(e,t={}){let n=e.getDefaultCanvasContext();this._setCanvasContext(n),this._setDeviceResizeHandler(e,t)}_setDeviceResizeHandler(e,t={}){let n=!!t.syncDrawingBuffer;if(this._deviceResizeHandler?.device===e){this._deviceResizeHandler.syncDrawingBuffer=n;return}this._restoreDeviceResizeHandler();let r=e=>{this._isMultiCanvasMode()?this._updateMultiCanvasDimensions():e===this._canvasContext&&this._canvasContext&&this._onCanvasContextResize(this._canvasContext,{syncDrawingBuffer:this._deviceResizeHandler?.syncDrawingBuffer})};e.props.onResize=r,this._deviceResizeHandler={device:e,onResize:r,syncDrawingBuffer:n}}_restoreDeviceResizeHandler(){let e=this._deviceResizeHandler;e&&e.device.props?.onResize===e.onResize&&(e.device.props.onResize=Tw),this._deviceResizeHandler=null}_setCanvasSize(e){if(this._isMultiCanvasMode()||!this.canvas)return;let{width:t,height:n}=e;if(t||t===0){let e=Number.isFinite(t)?`${t}px`:t;this.canvas.style.width=e}if(n||n===0){let t=Number.isFinite(n)?`${n}px`:n;this.canvas.style.position=e.style?.position||`absolute`,this.canvas.style.height=t}}_getCanvasIdFromEvent(e){return this._canvasManager.getCanvasIdFromEvent(e?.rootElement)}_getCanvasContext(e){return this._canvasManager.getTarget(e)?.presentationContext||this._canvasContext}_resizeForCanvasTarget(e){let t=this._canvasManager.getTarget(e);if(!t||!this.device?.canvasContext)return;let[n,r]=t.presentationContext.getDrawingBufferSize();this.device.canvasContext.setDrawingBufferSize(n,r)}_createDeviceCanvas(e){if(this._isMultiCanvasMode()){let t=globalThis.OffscreenCanvas;if(!t)throw Error("`_canvases` requires OffscreenCanvas support.");return new t(typeof e.width==`number`&&Number.isFinite(e.width)?e.width:1,typeof e.height==`number`&&Number.isFinite(e.height)?e.height:1)}return this._createCanvas(e)}_updateCanvasSize(e=this._canvasContext){if(this._isMultiCanvasMode()){this._updateMultiCanvasDimensions();return}let{canvas:t}=this,[n,r]=e?e.getCSSSize():[t?.clientWidth??t?.width??0,t?.clientHeight??t?.height??0];(n!==this.width||r!==this.height)&&(this.width=n,this.height=r,this.viewManager?.setProps({width:n,height:r}),this.layerManager?.activateViewport(this.getViewports()[0]),this.props.onResize({width:n,height:r},e||void 0))}_onCanvasContextResize(e,t={}){if(t.syncDrawingBuffer){let{width:t,height:n}=e.canvas;e.setDrawingBufferSize(t,n)}this._needsRedraw=`Canvas resized`,this._updateCanvasSize(e)}_updateMultiCanvasDimensions(){let[e,t]=this._getCanvasContext()?.getCSSSize()||[0,0];(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.props.onResize({width:e,height:t})),this._needsRedraw=`Canvas resized`,this.viewManager?.setNeedsUpdate(`Canvas resized`),this.viewManager?.setProps({width:this.width,height:this.height})}_createAnimationLoop(e,t){let{gl:n,onError:r}=t;return new Dh({device:e,autoResizeDrawingBuffer:!n&&!Array.isArray(t._canvases),autoResizeViewport:!1,onInitialize:e=>this._setDevice(e.device),onRender:this._onRenderFrame.bind(this),onError:r})}_createDevice(e){let t=this.props.deviceProps?.createCanvasContext,n=typeof t==`object`?t:void 0,r={adapters:[],_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps};r.adapters.includes(px)||r.adapters.push(px);let i={alphaMode:this.props.deviceProps?.type===`webgpu`?`premultiplied`:void 0};return wo.createDevice({_reuseDevices:!0,type:`webgl`,...r,createCanvasContext:{...i,...n,canvas:this._createDeviceCanvas(e),useDevicePixels:this.props.useDevicePixels,autoResize:!0}})}_getViewState(){return this.props.viewState||this.viewState}_getViews(){let{views:e}=this.props,t=Array.isArray(e)?e:e?[e]:[new xb({id:`default-view`})];return t.length&&this.props.controller&&(t[0]=t[0].clone({controller:this.props.controller})),t}_onContextLost(){let{onError:e}=this.props;this.animationLoop&&e&&e(Error(`WebGL context is lost`))}_pickAndCallback(){let{_pickRequest:e}=this;if(e.event){let t=e.event,n=this.layerManager?.getLayers()||[],r=this._getPointPickOptions(e.x,e.y,{canvasId:e.canvasId,radius:e.radius,mode:e.mode},n),i=this._getInternalPickingMode(),a=++this._hoverPickSequence;if(e.event=null,e.canvasId=void 0,!i)return;if(i===`sync`){this._applyHoverCallbacks(this._pickPointSync(r),t);return}this._pickPointAsync(r).then(({result:e,emptyInfo:n})=>{a===this._hoverPickSequence&&this._applyHoverCallbacks({result:e,emptyInfo:n},t)}).catch(e=>this.props.onError?.(e))}}_updateCursor(){let e=this.props.getCursor(this.cursorState);if(this._isMultiCanvasMode()){for(let t of Object.values(this._canvasManager.targets))t.canvas.style.cursor=e;return}let t=this.props.parent||this.canvas;t&&(t.style.cursor=e)}_setDevice(e){if(this.device=e,this._validateInternalPickingMode(),!this.animationLoop)return;this._setDeviceCanvasContext(e,{syncDrawingBuffer:!!(this.props.gl&&this.props.device!==e)}),this._isMultiCanvasMode()?this._syncCanvasTargets():this.canvas&&!this.canvas.isConnected&&this.props.parent&&this.props.parent.insertBefore(this.canvas,this.props.parent.firstChild),this.device.type===`webgl`&&this.device.setParametersWebGL({blend:!0,blendFunc:[770,771,1,771],polygonOffsetFill:!0,depthTest:!0,depthFunc:515}),this.props.onDeviceInitialized(this.device),this.device.type===`webgl`&&this.props.onWebGLInitialized(this.device.gl);let t=new xh;if(t.play(),this.animationLoop.attachTimeline(t),!this._isMultiCanvasMode()){let e=this.canvas&&this._getEventRoot(this.canvas);K(e),this.eventManager=this._createEventManager(e),this.eventManagers={[Oy]:this.eventManager}}this.viewManager=new ky({timeline:t,eventManager:this.eventManager,eventManagers:this.eventManagers,getCanvasContext:this._isMultiCanvasMode()?this.getCanvasContext.bind(this):void 0,onViewStateChange:this._onViewStateChange.bind(this),onInteractionStateChange:this._onInteractionStateChange.bind(this),pickPosition:this._pickPositionForController.bind(this),views:this._getViews(),viewState:this._getViewState(),width:this.width,height:this.height});let n=this.viewManager.getViewports()[0];this.layerManager=new Dy(this.device,{deck:this,stats:this.stats,viewport:n,timeline:t}),this.effectManager=new wb({deck:this,device:this.device}),this.deckRenderer=new Db(this.device,{stats:this.stats}),this.deckPicker=new Fb(this.device,{stats:this.stats});let r=this.props.parent?.querySelector(`.deck-widgets-root`)||(this._isMultiCanvasMode()?this.props.parent||this.canvas?.parentElement:null)||this.canvas?.parentElement;this.widgetManager=new zb({deck:this,parentElement:r}),this.widgetManager.addDefault(new Wb),this.setProps({}),this._updateCanvasSize(this._canvasContext),this.props.onLoad()}_drawLayers(e,t){let{device:n,gl:r}=this.layerManager.context;this.props.onBeforeRender({device:n,gl:r});let i={target:this.props._framebuffer,layers:this.layerManager.getLayers(),viewports:this.viewManager.getViewports(),onViewportActive:this.layerManager.activateViewport,views:this.viewManager.getViews(),pass:`screen`,effects:this.effectManager.getEffects(),...t};if(this._isMultiCanvasMode()&&i.pass===`screen`&&!i.target&&this._canvasManager.order.length)for(let e of this._canvasManager.order){let t=i.viewports.filter(t=>this.viewManager.getCanvasId(t.id)===e);if(!t.length){let t=this._canvasManager.targets[e];this._resizeForCanvasTarget(e),this.deckRenderer?.renderLayers({...i,canvasContext:t.presentationContext,target:t.presentationContext.getCurrentFramebuffer(),viewports:[],clearCanvas:!0}),t.presentationContext.present();continue}let n=this._canvasManager.targets[e];this._resizeForCanvasTarget(e);let r=n.presentationContext.getCurrentFramebuffer();this.deckRenderer?.renderLayers({...i,canvasContext:n.presentationContext,target:r,viewports:t}),n.presentationContext.present()}else this.deckRenderer?.renderLayers(i);i.pass===`screen`&&this.widgetManager.onRedraw({viewports:i.viewports,layers:i.layers}),this.props.onAfterRender({device:n,gl:r})}_onRenderFrame(){this._getFrameStats(),this._metricsCounter++%60==0&&(this._getMetrics(),this.stats.reset(),N.table(4,this.metrics)(),this.props._onMetrics&&this.props._onMetrics(this.metrics)),this._updateCursor(),this.layerManager.updateLayers(),this._pickAndCallback(),this.redraw(),this.viewManager&&this.viewManager.updateViewStates()}_onViewStateChange(e){let t=this.props.onViewStateChange(e)||e.viewState;this.viewState&&(this.viewState={...this.viewState,[e.viewId]:t},this.props.viewState||this.viewManager&&this.viewManager.setProps({viewState:this.viewState}))}_onInteractionStateChange(e){this.cursorState.isDragging=e.isDragging||!1,this.props.onInteractionStateChange(e)}_getFrameStats(){let{stats:e}=this;e.get(`frameRate`).timeEnd(),e.get(`frameRate`).timeStart();let t=this.animationLoop.stats;e.get(`GPU Time`).addTime(t.get(`GPU Time`).lastTiming),e.get(`CPU Time`).addTime(t.get(`CPU Time`).lastTiming)}_getMetrics(){let{metrics:e,stats:t}=this;e.fps=t.get(`frameRate`).getHz(),e.setPropsTime=t.get(`setProps Time`).time,e.updateAttributesTime=t.get(`Update Attributes`).time,e.framesRedrawn=t.get(`Redraw Count`).count,e.pickTime=t.get(`pickObject Time`).time+t.get(`pickMultipleObjects Time`).time+t.get(`pickObjects Time`).time,e.pickCount=t.get(`Pick Count`).count,e.layersCount=this.layerManager?.layers.length??0,e.drawLayersCount=t.get(`Layers rendered`).lastSampleCount,e.pickLayersCount=t.get(`Layers picked`).lastSampleCount,e.updateLayersCount=t.get(`Layer updates`).count,e.updateAttributesCount=t.get(`Attributes updated`).count,e.gpuTime=t.get(`GPU Time`).time,e.cpuTime=t.get(`CPU Time`).time,e.gpuTimePerFrame=t.get(`GPU Time`).getAverageTime(),e.cpuTimePerFrame=t.get(`CPU Time`).getAverageTime();let n=wo.stats.get(`GPU Time and Memory`);e.bufferMemory=n.get(`Buffer Memory`).count,e.textureMemory=n.get(`Texture Memory`).count,e.renderbufferMemory=n.get(`Renderbuffer Memory`).count,e.gpuMemory=n.get(`GPU Memory`).count}};Dw.defaultProps=Ew,Dw.VERSION=pa;function Ow(e){switch(e){case`float64`:return Float64Array;case`uint8`:case`unorm8`:return Uint8ClampedArray;default:return c(e)}}var kw=i.getDataType.bind(i);function Aw(e,t,n){if(t.size>4)return null;let r=n===`webgpu`&&t.type===`uint8`?`unorm8`:t.type,i=t.size,a=!!(n!==`webgpu`&&i===3&&r&&[`uint8`,`sint8`,`unorm8`,`snorm8`,`uint16`,`sint16`,`unorm16`,`snorm16`].includes(r));return{attribute:e,format:i>1?`${r}x${i}${a?`-webgl`:``}`:t.type,byteOffset:t.offset||0}}function jw(e){return e.stride||e.size*e.bytesPerElement}function Mw(e,t){return e.type===t.type&&e.size===t.size&&jw(e)===jw(t)&&(e.offset||0)===(t.offset||0)}function Nw(e,t){t.offset&&N.removed(`shaderAttribute.offset`,`vertexOffset, elementOffset`)();let n=jw(e),r=t.vertexOffset===void 0?e.vertexOffset||0:t.vertexOffset,i=t.elementOffset||0,a=r*n+i*e.bytesPerElement+(e.offset||0);return{...t,offset:a,stride:n}}function Pw(e,t){let n=Nw(e,t);return{high:n,low:{...n,offset:n.offset+e.size*4}}}var Fw=class{constructor(e,t,n){this._buffer=null,this.device=e,this.id=t.id||``,this.size=t.size||1;let r=t.logicalType||t.type,i=r===`float64`,{defaultValue:a}=t;a=Number.isFinite(a)?[a]:a||Array(this.size).fill(0);let o;o=i?`float32`:!r&&t.isIndexed?`uint32`:r||`float32`;let s=Ow(r||o);this.doublePrecision=i,i&&t.fp64===!1&&(s=Float32Array),this.value=null,this.settings={...t,defaultType:s,defaultValue:a,logicalType:r,type:o,normalized:o.includes(`norm`),size:this.size,bytesPerElement:s.BYTES_PER_ELEMENT},this.state={...n,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let e=this.getAccessor();return e.vertexOffset?e.vertexOffset*jw(e):0}get numInstances(){return this.state.numInstances}set numInstances(e){this.state.numInstances=e}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&=(this._buffer.delete(),null),Pm.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&this.device.type!==`webgpu`?null:this.state.externalBuffer||this._buffer}getValue(e=this.id,t=null){let n={};if(this.state.constant){let r=this.value;if(this.device.type===`webgpu`&&this._buffer)n[e]=this._buffer;else if(t){let i=Nw(this.getAccessor(),t),a=i.offset/r.BYTES_PER_ELEMENT,o=i.size||this.size;n[e]=r.subarray(a,a+o)}else n[e]=r}else n[e]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?n[`${e}64Low`]=n[e]:n[`${e}64Low`]=new Float32Array(this.size)),n}_getBufferLayout(e=this.id,t=null){let n=this.getAccessor(),r=[],i={name:this.id,byteStride:this.device.type===`webgpu`&&this.state.constant?0:jw(n)};if(this.doublePrecision){let i=Pw(n,t||{});r.push(Aw(e,{...n,...i.high},this.device.type),Aw(`${e}64Low`,{...n,...i.low},this.device.type))}else if(t){let i=Nw(n,t);r.push(Aw(e,{...n,...i},this.device.type))}else r.push(Aw(e,n,this.device.type));return i.attributes=r.filter(Boolean),i}setAccessor(e){this.state.bufferAccessor=e}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let e=null;if(this.state.constant&&this.value){let t=Array.from(this.value);e=[t,t]}else{let{value:t,numInstances:n,size:r}=this,i=n*r;if(t&&i&&t.length>=i){let n=Array(r).fill(1/0),a=Array(r).fill(-1/0);for(let e=0;e<i;)for(let i=0;i<r;i++){let r=t[e++];r<n[i]&&(n[i]=r),r>a[i]&&(a[i]=r)}e=[n,a]}}return this.state.bounds=e,e}setData(e){let{state:t}=this,r;r=ArrayBuffer.isView(e)?{value:e}:e instanceof n?{buffer:e}:e;let i={...this.settings,...r};if(ArrayBuffer.isView(r.value)){if(!r.type)if(this.doublePrecision&&r.value instanceof Float64Array)i.type=`float32`;else{let e=kw(r.value);i.type=i.normalized?e.replace(`int`,`norm`):e}i.bytesPerElement=r.value.BYTES_PER_ELEMENT,i.stride=jw(i)}if(t.bounds=null,r.constant){let e=r.value;if(e=this._normalizeValue(e,[],0),this.settings.normalized&&(e=this.normalizeConstant(e)),!(!t.constant||!this._areValuesEqual(e,this.value)))return!1;t.externalBuffer=null,t.constant=!0,this.value=ArrayBuffer.isView(e)?e:new Float32Array(e)}else if(r.buffer)t.externalBuffer=r.buffer,t.constant=!1,this.value=r.value||null;else if(r.value){this._checkExternalBuffer(r);let e=r.value,n=e;t.externalBuffer=null,t.constant=!1,this.value=e,this._shouldSplitDoublePrecisionValue(n)&&(n=Um(n,i),e instanceof Float32Array&&(i.stride=i.size*2*Float32Array.BYTES_PER_ELEMENT));let{buffer:a}=this,o=jw(i),s=(i.vertexOffset||0)*o;if(this.settings.isIndexed){let e=this.settings.defaultType;n.constructor!==e&&(n=new e(n))}let c=n.byteLength+s+o*2;(!a||a.byteLength<c)&&(a=this._createBuffer(c)),a.write(n,s)}return this.setAccessor(i),!0}updateSubBuffer(e={}){this.state.bounds=null;let t=this.value,{startOffset:n=0,endOffset:r}=e,i=this._shouldSplitDoublePrecisionValue(t);this.buffer.write(i?Um(t,{size:this.size,startIndex:n,endIndex:r}):t.subarray(n,r),n*(i?8:t.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(e,t=!1){let{state:n}=this,r=n.allocatedValue,i=Pm.allocate(r,e+1,{size:this.size,type:this.settings.defaultType,copy:t});this.value=i;let a=this._shouldSplitDoublePrecisionValue(i),o=a&&i instanceof Float32Array?{...this.settings,stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(o);let{byteOffset:s}=this,{buffer:c}=this,l=i.byteLength*(a&&i instanceof Float32Array?2:1);return(!c||c.byteLength<l+s)&&(c=this._createBuffer(l+s),t&&r&&c.write(this._shouldSplitDoublePrecisionValue(r)?Um(r,this):r,s)),n.allocatedValue=i,n.constant=!1,n.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(e){return!!(this.doublePrecision&&(e instanceof Float64Array||this.device.type===`webgpu`&&e instanceof Float32Array))}_checkExternalBuffer(e){let{value:t}=e;if(!ArrayBuffer.isView(t))throw Error(`Attribute ${this.id} value is not TypedArray`);let n=this.settings.defaultType,r=!1;if(this.doublePrecision&&(r=t.BYTES_PER_ELEMENT<4),r)throw Error(`Attribute ${this.id} does not support ${t.constructor.name}`);!(t instanceof n)&&this.settings.normalized&&!(`normalized`in e)&&N.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(e){switch(this.settings.type){case`snorm8`:return new Float32Array(e).map(e=>(e+128)/255*2-1);case`snorm16`:return new Float32Array(e).map(e=>(e+32768)/65535*2-1);case`unorm8`:return new Float32Array(e).map(e=>e/255);case`unorm16`:return new Float32Array(e).map(e=>e/65535);default:return e}}_normalizeValue(e,t,n){let{defaultValue:r,size:i}=this.settings;if(Number.isFinite(e))return t[n]=e,t;if(!e){let e=i;for(;--e>=0;)t[n+e]=r[e];return t}switch(i){case 4:t[n+3]=Number.isFinite(e[3])?e[3]:r[3];case 3:t[n+2]=Number.isFinite(e[2])?e[2]:r[2];case 2:t[n+1]=Number.isFinite(e[1])?e[1]:r[1];case 1:t[n+0]=Number.isFinite(e[0])?e[0]:r[0];break;default:let a=i;for(;--a>=0;)t[n+a]=Number.isFinite(e[a])?e[a]:r[a]}return t}_areValuesEqual(e,t){if(!e||!t)return!1;let{size:n}=this;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}_createBuffer(e){this._buffer&&this._buffer.destroy();let{isIndexed:t,type:r}=this.settings,i=this.device.type===`webgpu`&&!t?n.VERTEX|n.STORAGE|n.COPY_DST|n.COPY_SRC:(t?n.INDEX:n.VERTEX)|n.COPY_DST;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:i,indexType:t?r:void 0,byteLength:e}),this._buffer}},Iw=[],Lw=[];function Rw(e,t=0,n=1/0){let r=Iw,i={index:-1,data:e,target:[]};return e?typeof e[Symbol.iterator]==`function`?r=e:e.length>0&&(Lw.length=e.length,r=Lw):r=Iw,(t>0||Number.isFinite(n))&&(r=(Array.isArray(r)?r:Array.from(r)).slice(t,n),i.index=t-1),{iterable:r,objectInfo:i}}function zw(e){return e&&e[Symbol.asyncIterator]}function Bw(e,t){let{size:n,stride:r,offset:i,startIndices:a,nested:o}=t,s=e.BYTES_PER_ELEMENT,c=r?r/s:n,l=i?i/s:0,u=Math.floor((e.length-l)/c);return(t,{index:r,target:i})=>{if(!a){let t=r*c+l;for(let r=0;r<n;r++)i[r]=e[t+r];return i}let s=a[r],d=a[r+1]||u,f;if(o){f=Array(d-s);for(let t=s;t<d;t++){let r=t*c+l;i=Array(n);for(let t=0;t<n;t++)i[t]=e[r+t];f[t-s]=i}}else if(c===n)f=e.subarray(s*n+l,d*n+l);else{f=new e.constructor((d-s)*n);let t=0;for(let r=s;r<d;r++){let i=r*c+l;for(let r=0;r<n;r++)f[t++]=e[i+r]}}return f}}var Vw=[],Hw=[[0,1/0]];function Uw(e,t){if(e===Hw||(t[0]<0&&(t[0]=0),t[0]>=t[1]))return e;let n=[],r=e.length,i=0;for(let a=0;a<r;a++){let r=e[a];r[1]<t[0]?(n.push(r),i=a+1):r[0]>t[1]?n.push(r):t=[Math.min(r[0],t[0]),Math.max(r[1],t[1])]}return n.splice(i,0,t),n}var Ww={interpolation:{duration:0,easing:e=>e},spring:{stiffness:.05,damping:.5}};function Gw(e,t){if(!e)return null;Number.isFinite(e)&&(e={type:`interpolation`,duration:e});let n=e.type||`interpolation`;return{...Ww[n],...t,...e,type:n}}var Kw=class extends Fw{constructor(e,t){super(e,t,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:Hw}),this.constant=!1,this.settings.update=t.update||(t.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(e){this.state.startIndices=e}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:e=!1}={}){let t=this.state.needsRedraw;return this.state.needsRedraw=t&&!e,t}layoutChanged(){return this.state.layoutChanged}setAccessor(e){var t;(t=this.state).layoutChanged||(t.layoutChanged=!Mw(e,this.getAccessor())),super.setAccessor(e)}getUpdateTriggers(){let{accessor:e}=this.settings;return[this.id].concat(typeof e!=`function`&&e||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(e){if(!e||!this.supportsTransition())return null;let{accessor:t}=this.settings,n=this.settings.transition;return Gw(Array.isArray(t)?e[t.find(t=>e[t])]:e[t],n)}setNeedsUpdate(e=this.id,t){if(this.state.needsUpdate=this.state.needsUpdate||e,this.setNeedsRedraw(e),t){let{startRow:e=0,endRow:n=1/0}=t;this.state.updateRanges=Uw(this.state.updateRanges,[e,n])}else this.state.updateRanges=Hw}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=Vw}setNeedsRedraw(e=this.id){this.state.needsRedraw=this.state.needsRedraw||e}allocate(e){let{state:t,settings:n}=this;if(n.noAlloc)return!1;if(n.update){let n=this.isConstant;return super.allocate(e,t.updateRanges!==Hw),t.layoutChanged||=n&&this.device.type===`webgpu`,!0}return!1}updateBuffer({numInstances:e,data:t,props:n,context:r}){if(!this.needsUpdate())return!1;let{state:{updateRanges:i},settings:{update:a,noAlloc:o}}=this,s=!0;if(a){for(let[o,s]of i)a.call(r,this,{data:t,startRow:o,endRow:s,props:n,numInstances:e});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let e=this.value;this.value=null,this.setConstantValue(r,e)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[t,n]of i){let r=Number.isFinite(t)?this.getVertexOffset(t):0,i=Number.isFinite(n)?this.getVertexOffset(n):o||!Number.isFinite(e)?this.value.length:e*this.size;super.updateSubBuffer({startOffset:r,endOffset:i})}this._checkAttributeArray()}else s=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),s}setConstantValue(e,t){var n;if(t===void 0||typeof t==`function`)return!1;let r=this.isConstant,i=this.settings.transform&&e?this.settings.transform.call(e,t):t,a=this.settings.defaultType;this.state.constantValue=this._normalizeValue(i,new a(this.size),0);let o=this.setData({constant:!0,value:i});if(this.device.type===`webgpu`){let e=this.state.constantValue;this.doublePrecision&&(e instanceof Float32Array||e instanceof Float64Array)&&(e=Um(e,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}));let t=this._buffer;(!t||t.byteLength<e.byteLength)&&(t=this._createBuffer(e.byteLength)),t.write(e),(n=this.state).layoutChanged||(n.layoutChanged=!r),this.constant=!1}return o&&this.setNeedsRedraw(),this.clearNeedsUpdate(),!0}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(e){let{state:t}=this;return e?(this.clearNeedsUpdate(),t.lastExternalBuffer===e?!0:(t.lastExternalBuffer=e,this.setNeedsRedraw(),this.setData(e),!0)):(t.lastExternalBuffer=null,!1)}setBinaryValue(e,t=null){let{state:n,settings:r}=this;if(!e)return n.binaryValue=null,n.binaryAccessor=null,!1;if(r.noAlloc)return!1;if(n.binaryValue===e)return this.clearNeedsUpdate(),!0;if(n.binaryValue=e,this.setNeedsRedraw(),r.transform||t!==this.startIndices){ArrayBuffer.isView(e)&&(e={value:e});let i=e;K(ArrayBuffer.isView(i.value),`invalid ${r.accessor}`);let a=!!i.size&&i.size!==this.size;return n.binaryAccessor=Bw(i.value,{size:i.size||this.size,stride:i.stride,offset:i.offset,startIndices:t,nested:a}),!1}return this.clearNeedsUpdate(),this.setData(e),!0}getVertexOffset(e){let{startIndices:t}=this;return(t?e<t.length?t[e]:this.numInstances:e)*this.size}getValue(){let e=this.settings.shaderAttributes,t=super.getValue();if(!e)return t;for(let n in e)Object.assign(t,super.getValue(n,e[n]));return t}getBufferLayout(e){this.state.layoutChanged=!1;let t=this.settings.shaderAttributes,n=super._getBufferLayout(),{stepMode:r}=this.settings;if(r===`dynamic`?n.stepMode=e?e.isInstanced?`instance`:`vertex`:`instance`:n.stepMode=r??`vertex`,!t)return n;for(let e in t){let r=super._getBufferLayout(e,t[e]);n.attributes.push(...r.attributes)}return n}_autoUpdater(e,{data:t,startRow:n,endRow:r,props:i,numInstances:a}){let{settings:o,state:s,value:c,size:l,startIndices:u}=e,{accessor:d,transform:f}=o,p=s.binaryAccessor||(typeof d==`function`?d:i[d]);K(typeof p==`function`,`accessor "${d}" is not a function`);let m=e.getVertexOffset(n),{iterable:h,objectInfo:g}=Rw(t,n,r);for(let t of h){g.index++;let n=p(t,g);if(f&&(n=f.call(this,n)),u){let t=(g.index<u.length-1?u[g.index+1]:a)-u[g.index];if(n&&Array.isArray(n[0])){let t=m;for(let r of n)e._normalizeValue(r,c,t),t+=l}else n&&n.length>l?c.set(n,m):(e._normalizeValue(n,g.target,0),Sy({target:c,source:g.target,start:m,count:t}));m+=t*l}else e._normalizeValue(n,c,m),m+=l}}_validateAttributeUpdaters(){let{settings:e}=this;if(!(e.noAlloc||typeof e.update==`function`))throw Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:e}=this,t=Math.min(4,this.size);if(e&&e.length>=t){let n=!0;switch(t){case 4:n&&=Number.isFinite(e[3]);case 3:n&&=Number.isFinite(e[2]);case 2:n&&=Number.isFinite(e[1]);case 1:n&&=Number.isFinite(e[0]);break;default:n=!1}if(!n)throw Error(`Illegal attribute generated for ${this.id}`)}}},qw=class{buffer;format;length;valueLength;byteOffset;byteStride;rowByteLength;valueOffsets;nullBitmap;constructor(e){let t=ze(e.format),n=ArrayBuffer.isView(e.buffer)?e.buffer:void 0;this.buffer=n?n.buffer:e.buffer,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength??e.length*(t.listSize??1);let r=e.byteOffset??0;this.byteOffset=(n?.byteOffset??0)+r,this.rowByteLength=e.rowByteLength??t.byteLength,this.byteStride=e.byteStride??this.rowByteLength,this.valueOffsets=e.valueOffsets,this.nullBitmap=e.nullBitmap;let i=t.vertexList||t.valueList,a=i?this.valueLength:this.length;o([this.length,this.valueLength,r,this.rowByteLength,this.byteStride].every(e=>Number.isSafeInteger(e)&&e>=0)),o(this.rowByteLength>=t.byteLength&&this.byteStride>=this.rowByteLength),o(i||this.valueLength===this.length*(t.listSize??1)),o(r+(a?(a-1)*this.byteStride+this.rowByteLength:0)<=e.buffer.byteLength)}};function Jw(e,t,n){let r=ze(e.format),i=n?.startsWith(`float16`)?`float16`:r.signedDataType,a=n?.endsWith(`x3`)?3:r.components;o((a===3||a===4)&&[`uint8`,`float16`,`float32`].includes(i));let s=i===`uint8`?1:i===`float16`?2:4,c=new DataView(e.buffer,e.byteOffset),l=t===`unorm8x4`?new Uint8Array(e.length*4):t===`float16x4`?new Uint16Array(e.length*4):new Float32Array(e.length*4),u=new DataView(new ArrayBuffer(4));for(let n=0;n<e.length;n++)for(let r=0;r<4;r++){let o=n*e.byteStride+r*s,d=r>=a?1:i===`uint8`?c.getUint8(o)/255:i===`float16`?Yg(c.getUint16(o,!0)):c.getFloat32(o,!0);l[n*4+r]=t===`unorm8x4`?Math.round(Math.min(Math.max(d,0),1)*255):t===`float16x4`?Yw(d,u):d}return new qw({buffer:l,format:t,length:e.length,nullBitmap:e.nullBitmap&&new Uint8Array(e.nullBitmap)})}function Yw(e,t){t.setFloat32(0,e,!0);let n=t.getUint32(0,!0),r=n>>>16&32768,i=n>>>23&255,a=n&8388607;if(i===255)return r|31744|(a?512:0);if(i>142)return r|31744;if(i<102)return r;let o=i<113?126-i:13,s=i<113?a|8388608:a,c=2**o,l=Math.floor(s/c),u=s%c,d=l+(u>c/2||u===c/2&&l%2?1:0);return r|(i<113?0:(i-112)*1024)+d}var Xw=class e{static async createAsync(t,n){let r=!ke.getAsyncCompilation(t),i=r?ke.beginAsyncCompilation(t):ke.getAsyncCompilation(t),a;try{a=new e(t,n)}finally{r&&ke.endAsyncCompilation(t,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}device;id;source;pipelineFactory;shaderFactory;shader;pipeline;_pipelineInitialization;_destroyed=!1;constructor(e,t){if(e.type!==`webgpu`)throw Error(`Kernel is only supported in WebGPU`);let{source:n,pipelineFactory:r,shaderFactory:i,debugShaders:a,...o}=t;this.device=e,this.id=t.id??`kernel`,this.source=n,this.pipelineFactory=r??ke.getDefaultPipelineFactory(e),this.shaderFactory=i??Oe.getDefaultShaderFactory(e),this.shader=this.shaderFactory.createShader({id:`${this.id}-compute`,stage:`compute`,source:this.source,debugShaders:a});let s={...o,shader:this.shader},c=ke.getAsyncCompilation(e);if(c){let e=this.pipelineFactory.createComputePipelineAsync(s);this._pipelineInitialization=e,c.push(e.then(e=>(this.pipeline=e,e)))}else this.pipeline=this.pipelineFactory.createComputePipeline(s)}dispatch(e,t){this._setPipeline(e,t.bindings),e.dispatch(t.x,t.y,t.z)}dispatchIndirect(e,t){this._setPipeline(e,t.bindings),e.dispatchIndirect(t.indirectBuffer,t.indirectOffset??0)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),!0)}_setPipeline(e,t={}){e.setPipeline(this.pipeline),e.setBindings(t)}};function Zw({elementWise:e,func:t,inputs:n,output:r,outputBuffer:i}){let a=Array.isArray(n)?n:Object.values(n);for(let e of a)if(!e.value)throw Error(`${e} does not have CPU value`);let o=r.length,s=r.size,c=new r.ValueType(o*s);for(let n=0;n<o;n++){let r=a.map(e=>Z(e,n));if(e)for(let e=0;e<s;e++)c[n*s+e]=t.apply(null,r.map(t=>t[e]));else t.call(null,c.subarray(n*s,n*s+s),...r)}let l=r.ValueType.BYTES_PER_ELEMENT,u=r.offset/l,d=r.stride/l,f=s,p=c;if(u!==0||d!==f){p=new r.ValueType(u+r.byteLength/l);for(let e=0;e<o;e++){let t=e*f,n=u+e*d,r=c.subarray(t,t+s);p.set(r,n),i.write(r,n*l)}}else i.write(c);return{success:!0,value:p}}function Z(e,t){let n=e.value,r=e.size,i=e.offset/e.ValueType.BYTES_PER_ELEMENT,a=e.stride/e.ValueType.BYTES_PER_ELEMENT,o=i+(e.isConstant?0:t)*a,s=n.slice(o,o+r);if(!e.normalized)return s;let c=new Float32Array(r);for(let t=0;t<r;t++)c[t]=Qw(s[t],e.type);return c}function Qw(e,t){switch(t){case`uint8`:return e/255;case`uint16`:return e/65535;case`uint32`:return e/4294967295;case`sint8`:return Math.max(e/127,-1);case`sint16`:return Math.max(e/32767,-1);case`sint32`:return Math.max(e/2147483647,-1);case`float32`:return e;default:throw Error(`Unsupported normalized source type ${t}`)}}var $w=({inputs:e,output:t,target:n})=>{for(let t of Object.values(e.namedInputs))if(!t.value)throw Error(`${t} does not have CPU value`);let r=new t.ValueType(t.length*t.size);for(let n=0;n<t.length;n++){let i=Object.fromEntries(Object.entries(e.namedInputs).map(([e,t])=>[e,Z(t,n)]));for(let a=0;a<t.size;a++)r[n*t.size+a]=eT(e.expression,i,a)}return n.write(r),{success:!0,value:r}};function eT(e,t,n){switch(e.kind){case`input`:{let r=t[e.name];return n<r.length?r[n]:r.length===1?r[0]:0}case`literal`:return Array.isArray(e.value)?e.value[n]??0:e.value;case`call`:{tT(e.op,e.args.length);let r=e.args.map(e=>eT(e,t,n));switch(e.op){case`add`:return r[0]+r[1];case`subtract`:return r[0]-r[1];case`multiply`:return r[0]*r[1];case`divide`:return r[0]/r[1];case`pow`:return r[0]**+r[1];case`sqrt`:return Math.sqrt(r[0]);case`abs`:return Math.abs(r[0]);case`sin`:return Math.sin(r[0]);case`cos`:return Math.cos(r[0]);case`tan`:return Math.tan(r[0]);case`exp`:return Math.exp(r[0]);case`log`:return Math.log(r[0]);default:{let t=e.op;throw Error(`Unsupported arithmetic op ${t}`)}}}default:{let t=e;throw Error(`Unsupported expression node ${t.kind}`)}}}function tT(e,t){let n=Je[e].arity;if(t!==n)throw Error(`Arithmetic op '${e}' expects ${n} args, got ${t}`)}var nT=({inputs:e,output:t,target:n})=>rT(e,t,n);async function rT(e,t,n){let r=await e.source.ensureCPUValue(),i=ze(e.inputFormat),a=ze(e.outputFormat),o=new t.ValueType(t.length*t.size),s=e.source.offset/e.source.ValueType.BYTES_PER_ELEMENT,c=e.source.stride/e.source.ValueType.BYTES_PER_ELEMENT;for(let n=0;n<t.length;n++)for(let l=0;l<t.size;l++){let u=r[s+n*c+l],d=iT(u,e.source.type,i.normalized);o[n*t.size+l]=aT(d,t,a.normalized)}return n.write(o),{success:!0,value:o}}function iT(e,t,n){if(t===`float16`)return Yg(e);if(!n)return e;let{minimum:r,maximum:i}=oT(t);return Math.max(e/i,r<0?-1:0)}function aT(e,t,n){if(t.type===`float16`)return Jg(e);if(!n&&t.type===`float32`)return e;let{minimum:r,maximum:i}=oT(t.type),a=n?e*i:e;return Math.round(Math.min(i,Math.max(r,a)))}function oT(e){switch(e){case`sint8`:return{minimum:-127,maximum:127};case`sint16`:return{minimum:-32767,maximum:32767};case`sint32`:return{minimum:-2147483648,maximum:2147483647};case`uint8`:return{minimum:0,maximum:255};case`uint16`:return{minimum:0,maximum:65535};case`uint32`:return{minimum:0,maximum:4294967295};default:throw Error(`castData CPU output does not support ${e}`)}}var sT=async({inputs:e,target:t})=>{let{source:n,inputFormat:r,outputFormat:i}=e,a=Jw(new qw({buffer:await n.ensureCPUValue(),format:n.format??(r===`uint8x3`?`uint8x3-webgl`:r===`float16x3`?`uint16x3-webgl`:r),length:n.length,byteOffset:n.offset,byteStride:n.stride}),i,r),o=new Uint8Array(a.buffer,a.byteOffset,a.length*a.byteStride);return t.write(o),{success:!0}},cT=({inputs:e,output:t,target:n})=>{let{sourceValues:r}=e;if(!r.value)throw Error(`${r} does not have CPU value`);let i=new t.ValueType(t.length*t.size);if(r.length===0)return{success:!1,error:Error(`${r} is empty`)};for(let e=0;e<r.size;e++){let n=Z(r,0)[e],a=e*t.size,o=a+1;i[a]=n,i[o]=n;for(let t=1;t<r.length;t++){let n=Z(r,t)[e];n<i[a]&&(i[a]=n),n>i[o]&&(i[o]=n)}}return n.write(i),{success:!0,value:i}},lT=({inputs:e,output:t,target:n})=>Zw({func:(e,t)=>{let n=e.length/2,r=new Float64Array(t.buffer);for(let t=0;t<n;t++){let i=r[t];e[t]=Math.fround(i),e[t+n]=i-e[t]}return e},inputs:e,output:t,outputBuffer:n}),uT=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=r.value,o=i.value;if(!a)throw Error(`${r} does not have CPU value`);if(!o)throw Error(`${i} does not have CPU value`);let s=new t.ValueType(t.length*t.size),c=Array(t.size).fill(0);for(let e=0;e<t.length;e++){let n=Z(r,e),a=Number(n[0]),o=dT(a,i.length)?Z(i,a):c;s.set(o,e*t.size)}return n.write(s),{success:!0,value:s}};function dT(e,t){return Number.isInteger(e)&&e>=0&&e<t}var fT=({inputs:e,output:t,target:n})=>Zw({func:(e,...t)=>{let n=0;for(let r of t)e.set(r,n),n+=r.length},inputs:e,output:t,outputBuffer:n}),pT=({inputs:e,output:t,target:n})=>{let{x:r,y:i}=e,a=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=Z(r,e),n=Z(i,e),o=0;for(let e=0;e<r.size;e++)o+=t[e]*n[e];a[e]=o}return n.write(a),{success:!0,value:a}},mT=({inputs:e,output:t,target:n})=>{let{x:r,y:i}=e,a=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=Z(r,e),n=Z(i,e),o=1;for(let e=0;e<r.size;e++)if(t[e]!==n[e]){o=0;break}a[e]=o}return n.write(a),{success:!0,value:a}},hT=({inputs:e,output:t,target:n})=>{let{x:r}=e,i=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=Z(r,e),n=0;for(let e=0;e<r.size;e++)n+=t[e]*t[e];i[e]=Math.sqrt(n)}return n.write(i),{success:!0,value:i}},gT=async({inputs:e,output:t,target:n})=>{let{segments:r,vertexCount:i}=e,a=r.value;if(!a)throw Error(`${r} does not have CPU value`);_T(a,r,i);let o=new t.ValueType(t.length*t.size),s=0;for(let e=0;e<i;e++){for(;s+1<r.length&&a[vT(r,s+1)]<=e;)s++;let n=a[vT(r,s)],i=e*t.size;o[i]=s,o[i+1]=e-n}return n.write(o),{success:!0,value:o}};function _T(e,t,n){if(t.length<1)throw Error(`segmentedMap segments must contain at least one segment start`);let r=0;for(let n=0;n<t.length;n++){let i=e[vT(t,n)];if(n===0&&i!==0)throw Error(`segmentedMap segments must start at 0, got ${i}`);if(n>0&&i<r)throw Error(`segmentedMap segments must be non-decreasing, got ${i} after ${r}`);r=i}if(r>n)throw Error(`segmentedMap last segment start must be <= vertexCount, got ${r} > ${n}`)}function vT(e,t){return e.offset/e.ValueType.BYTES_PER_ELEMENT+t*(e.stride/e.ValueType.BYTES_PER_ELEMENT)}var yT=async({inputs:e,output:t,target:n})=>{let{condition:r,whenTrue:i,whenFalse:a}=e,o=new t.ValueType(t.length*t.size);for(let e=0;e<t.length;e++){let n=Z(r,e),s=Z(i,e),c=Z(a,e);for(let l=0;l<t.size;l++){let u=bT(n,r.size,l);o[e*t.size+l]=u===0?bT(c,a.size,l):bT(s,i.size,l)}}return n.write(o),{success:!0,value:o}};function bT(e,t,n){return n<t?e[n]:t===1?e[0]:0}var xT=({inputs:e,output:t,target:n})=>{let r=new t.ValueType(t.length);for(let n=0;n<t.length;n++)r[n]=e.start+n*e.step;return n.write(r),{success:!0,value:r}},ST=({inputs:e,output:t,target:n})=>{let{columns:r}=e;return Zw({func:(e,t)=>{for(let n=0;n<r.length;n++)e[n]=t[r[n]]},inputs:{x:e.x},output:t,outputBuffer:n})},CT=st({arithmetic:()=>$w,castData:()=>nT,convertColors:()=>sT,dot:()=>pT,equalAll:()=>mT,extent:()=>cT,fround:()=>lT,gather:()=>uT,interleave:()=>fT,length:()=>hT,segmentedMap:()=>gT,select:()=>yT,sequence:()=>xT,swizzle:()=>ST}),wT=new class{_modules={cpu:CT};add(t,n){let r=this._modules[t];if(typeof n.then==`function`){let i=Promise.all([Promise.resolve(r||{}),n]).then(([e,t])=>({...e,...t}));return this._modules[t]=i,i.then(e=>{this._modules[t]=e}).catch(n=>{e.error(`Failed to register ${t} backend: ${n}`)()}),i}if(r&&typeof r.then==`function`){let i=Promise.resolve(r).then(e=>({...e,...n})).then(e=>(this._modules[t]=e,e)).catch(n=>{throw e.error(`Failed to register ${t} backend: ${n}`)(),n});return this._modules[t]=i,i}let i={...r||{},...n};return this._modules[t]=i,Promise.resolve(i)}async get(e,t){let n=this._modules[e];if(!n)if(e===`webgl`)n=this.add(`webgl`,lx(()=>import(`./webgl-L3d3AHpd.js`),__vite__mapDeps([0,1,2,3,4,5])));else if(e===`webgpu`)n=this.add(`webgpu`,lx(()=>Promise.resolve().then(()=>iD),void 0));else throw Error(`${e} backend not registered`);let r=(await n)[t];if(typeof r!=`function`&&(e===`webgl`?r=(await lx(()=>import(`./webgl-L3d3AHpd.js`),__vite__mapDeps([0,1,2,3,4,5])))[t]:e===`webgpu`&&(r=(await lx(()=>Promise.resolve().then(()=>iD),void 0))[t])),typeof r!=`function`)throw Error(`${e} backend does not implement ${t}`);return r}getSync(e,t){let n=this._modules[e];if(!n)throw Error(`${e} backend not registered`);if(typeof n.then==`function`)throw Error(`${e} backend is not loaded yet`);let r=n[t];if(typeof r!=`function`)throw Error(`${e} backend does not implement ${t}`);return r}clear(){this._modules={}}},TT=class{inputs;dependencies;constructor(e){this.inputs=e,this.dependencies=Array.from(e instanceof Array?e:Object.values(e)).filter(e=>e instanceof Ze)}async execute(e,t,n){n||await this._resolveDependencies(e);let r=await wT.get(this._getHandlerRegistry(e,n),this.name);if(n&&(e.type!==`webgpu`||!r.supportsEvaluationScope))throw Error(`${this.name} does not support deferred-submission evaluation`);return n&&await this._resolveDependencies(e,n),await this._executeWithHandler(r,t,n)}executeSync(e,t){this._resolveDependenciesSync(e);let n=this._executeWithHandler(wT.getSync(this._getHandlerRegistry(e),this.name),t);if(ET(n))throw Error(`${this.name} returned a Promise in executeSync()`);return n}shouldExecuteOnCPU(){return this.output.length<=1&&Array.from(this.dependencies).every(e=>!!e.value)}_getHandlerRegistry(e,t){return!t&&this.shouldExecuteOnCPU()?`cpu`:e.type}async _resolveDependencies(e,t){for(let n of this.dependencies)await n.evaluate(e,{scope:t});if(this._getHandlerRegistry(e,t)===`cpu`||e.type===`null`)for(let e of this.dependencies)await e.ensureCPUValue()}_resolveDependenciesSync(e){for(let t of this.dependencies)t.evaluateSync(e);if(this._getHandlerRegistry(e)===`cpu`||e.type===`null`)for(let e of this.dependencies)e.ensureCPUValueSync()}_executeWithHandler(e,t,n){return e({scope:n,device:t.device,inputs:this.inputs,output:this.output,target:t})}};function ET(e){return typeof e?.then==`function`}function DT(...e){let t=OT(e.map(e=>e.type));return t[0]!==`f`&&e.some(e=>e.normalized)&&(t=`float32`),{isConstant:e.every(e=>e.isConstant),type:t,size:e.reduce((e,t)=>Math.max(e,t.size),0),length:e.reduce((e,t)=>Math.max(e,t.length),0)}}function OT(e){let t=0,n=0;for(let r of e){if(r[0]===`f`)return`float32`;let e=r.endsWith(`8`)?8:r.endsWith(`6`)?16:32;r[0]===`u`?t=Math.max(t,e):n=Math.max(n,e)}return t&&!n?`uint${t}`:n&&t<32?`sint${Math.max(n,t*2)}`:`float32`}var kT=class e{gpuDataEvaluators;format;length;id;_gpuVector;_ownsGPUDataEvaluators;_destroyed=!1;_evaluationScope;static fromGPUVector(t){if(t.bufferLayout)throw Error(`GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${t.name}"`);if(t.data.length===0)throw Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${t.name}"`);return new e({id:t.name,gpuDataEvaluators:t.data.map(e=>Ze.fromGPUData(e,{id:t.name})),gpuVector:t,format:t.format})}static fromGPUDataEvaluators(t,n={}){return new e({id:n.id,gpuDataEvaluators:t,format:n.format})}constructor({id:e,gpuDataEvaluators:t,gpuVector:n,format:r}){if(t.length===0)throw Error(`GPUVectorEvaluator requires at least one GPUData evaluator`);AT(t),this.id=e,this.gpuDataEvaluators=t,this.format=r??t[0].format,this.length=t.reduce((e,t)=>e+t.length,0),this._gpuVector=n,this._ownsGPUDataEvaluators=!n}get evaluated(){return!!this._gpuVector}getInspection(){return Ye(this.gpuDataEvaluators)}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}mapGPUData(t){return e.fromGPUDataEvaluators(this.gpuDataEvaluators.map((e,n)=>t(e,n)),{id:this.id})}async evaluate(e,t={}){if(this.assertScopeAccess(t.scope),this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);let n=t.scope,r;if(n){if(n.assertEvaluating(e),!this._evaluationScope){let e=this._gpuVector;this._evaluationScope=n,n.retain(t=>{this._evaluationScope=void 0,t||(this._gpuVector=e)})}r=[];for(let n of this.gpuDataEvaluators)r.push(await n.evaluate(e,t));if(this._gpuVector)return this._gpuVector}else{if(this._gpuVector)return this._gpuVector;r=await Promise.all(this.gpuDataEvaluators.map(n=>n.evaluate(e,t)))}let i=r[0],a=r.map(jT),o=t.format??this.format??i.format;return this._gpuVector=new Qe({type:`data`,name:t.name??this.id??`vector`,format:o,data:a,stride:i.stride,byteStride:i.byteStride,rowByteLength:i.rowByteLength,bufferLayout:i.bufferLayout}),this._gpuVector}evaluateSync(e,t={}){if(t.scope)throw Error(`Use scope.evaluate() for deferred submission`);if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let n=this.gpuDataEvaluators.map(n=>n.evaluateSync(e,t)),r=n[0],i=n.map(jT),a=t.format??this.format??r.format;return this._gpuVector=new Qe({type:`data`,name:t.name??this.id??`vector`,format:a,data:i,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}invalidate(){if(this.assertScopeAccess(),this._destroyed)throw Error(`Cannot invalidate a destroyed evaluator`);this._gpuVector=void 0}destroy(){if(this.assertScopeAccess(),this._ownsGPUDataEvaluators)for(let e of this.gpuDataEvaluators)e.destroy();this._gpuVector=void 0,this._destroyed=!0}assertScopeAccess(e){if(this._evaluationScope&&this._evaluationScope!==e)throw Error(`Evaluator is retained by an unsubmitted scope`)}toString(){return this.id??this.constructor.name}};function AT(e){let t=e[0];for(let n of e.slice(1))if(n.type!==t.type||n.size!==t.size||n.normalized!==t.normalized||n.format!==t.format)throw Error(`GPUVectorEvaluator requires matching GPUData evaluator layouts`)}function jT(e){let[t,...n]=e.data;if(!t||n.length>0)throw Error(`GPUVectorEvaluator requires one GPUData chunk for "${e.name}"`);return t}var MT=class extends TT{name=`interleave`;output;constructor(e){super(e);let{isConstant:t,type:n,length:r}=DT(...e);this.output=new Ze({isConstant:t,type:n,size:e.reduce((e,t)=>e+t.size,0),length:r,source:this})}toString(){return`_${this.inputs.join(`_`)}_`}};function NT(...e){if(e.length===0)throw Error(`interleave() requires at least one input`);return e.length===1?We(e[0]):new MT(e.map(We)).output}function PT(e,t){let n=IT(t);for(let t of n)t.evaluateSync(e);return FT(n),t}function FT(e){let t=new Set(e.flatMap(BT)),n=new Set;for(let t of e)zT(t,n);for(let e of n)e.evaluated&&!t.has(e.buffer)&&e.destroy()}function IT(e){let t=new Set;return LT(e,t,new Set),Array.from(t)}function LT(e,t,n){if(VT(e)){t.add(e);return}if(!(!e||typeof e!=`object`||n.has(e))){if(n.add(e),Array.isArray(e)){for(let r of e)LT(r,t,n);return}if(RT(e))for(let r of Object.values(e))LT(r,t,n)}}function RT(e){let t=Object.getPrototypeOf(e);return t===Object.prototype||t===null}function zT(e,t){if(e instanceof kT){for(let n of e.gpuDataEvaluators)zT(n,t);return}let n=e.source;if(n){if(n instanceof Ze){t.has(n)||(t.add(n),zT(n,t));return}for(let e of n.dependencies)t.has(e)||(t.add(e),zT(e,t))}}function BT(e){return e instanceof Ze?[e.buffer]:e.gpuVector.data.map(e=>e.buffer instanceof M?e.buffer.buffer:e.buffer)}function VT(e){return e instanceof Ze||e instanceof kT}var HT=65535;function UT(e,t){let n=KT(t),r=Math.max(1,Math.ceil(e)),i=Math.min(r,n),a=Math.min(Math.ceil(r/i),n),o=Math.ceil(r/i/a);if(o>n)throw Error(`WebGPU dispatch requires ${r} workgroups, exceeding the 3D dispatch limit of ${n} per dimension`);return{x:i,y:a,z:o}}function WT(e,t=`workgroupId`){return`((${t}.z * ${e.y}u + ${t}.y) * ${e.x}u + ${t}.x)`}function GT(e,t,n=`workgroupId`,r=`localId`){return`(${WT(e,n)} * ${t}u + ${r}.x)`}function KT(e){return Number.isFinite(e)&&e>0?Math.floor(e):HT}function qT(e,t){switch(e){case`u32`:return`${t}u`;case`f32`:return Number.isInteger(t)?`${t}.0`:`${t}`;default:return`${t}`}}function JT(e,t){switch(e){case`uint32`:return qT(`u32`,Math.trunc(t));case`sint32`:return`${Math.trunc(t)}`;case`float32`:return qT(`f32`,t);default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function YT(e){switch(e){case`uint32`:return`0u`;case`sint32`:return`0`;case`float32`:return`0.0`;default:throw Error(`WebGPU operations only support 32-bit output types, got ${e}`)}}function Q(e){switch(e){case`uint32`:return`u32`;case`sint32`:return`i32`;case`float32`:return`f32`;default:throw Error(`WebGPU operations only support 32-bit storage types, got ${e}`)}}var XT=64,ZT=`GPGPU Operation Counts`,QT=`Computation Runs`,$T=new zg;function eE(e){return!e.isConstant||!e.value}function tE({scope:e,module:t,elementWise:n=!1,expression:r,inputs:i,output:a,operationType:o=a.type,outputBuffer:s}){if(!t.source)throw Error(`WebGPU kernel ${t.name} requires WGSL source`);let c=sE(i),l=c.map(([e,t])=>({name:e,input:t})),u=l.filter(({input:e})=>eE(e)).map((e,t)=>({...e,index:t})),d=Q(o),f=Q(a.type),p={TYPE:d,RESULT_LEN:a.size.toString()},m=UT(Math.ceil(a.length/XT),s.device.limits.maxComputeWorkgroupsPerDimension);for(let[e,t]of c)p[`${e.toUpperCase()}_LEN`]=t.size.toString();let h=`
${lE(t.source,p)}
${u.map(({name:e,input:t,index:n})=>nE(e,t,n)).join(`
`)}
${l.map(({name:e,input:t})=>rE(e,t,o)).join(`
`)}
${iE(a,u.length)}
${aE(a)}

@compute @workgroup_size(${XT}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${GT(m,XT)};
  if (rowIndex >= ${a.length}u) {
    return;
  }

${l.map(({name:e})=>`  let ${e} = read_${e}(rowIndex);`).join(`
`)}
  var result: array<${f}, ${a.size}>;
${oE(t.name,c,a,n,r)}
  write_result(rowIndex, result);
}
`,g=$T.assembleWGSLShader({platformInfo:Xe(s.device),source:h,modules:t.dependencies,shaderStage:`compute`,scanVertexAttributes:!1}),_=new Xw(s.device,{source:g.source,shaderLayout:{bindings:[...u.map(({name:e},t)=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:u.length}]}});e&&e.retain(()=>_.destroy());let v=Object.fromEntries(u.map(({name:e,input:t})=>[e,t.buffer]));v.result=s;let y=e?e.commandEncoder.beginComputePass({}):s.device.beginComputePass({});s.device.statsManager.getStats(ZT).get(QT).incrementCount(),_.dispatch(y,{bindings:v,...m}),y.end(),e||(s.device.submit(),_.destroy())}function nE(e,t,n){return`@group(0) @binding(${n}) var<storage, read> ${e}: array<${Q(t.type)}>;`}function rE(e,t,n){let r=Q(n),i=t.type===n?``:r,a=t.stride/t.ValueType.BYTES_PER_ELEMENT,o=t.offset/t.ValueType.BYTES_PER_ELEMENT;return eE(t)?`fn read_${e}(rowIndex: u32) -> array<${r}, ${t.size}> {
  var value: array<${r}, ${t.size}>;
  let rowOffset = ${o}u + ${t.isConstant?`0u`:`rowIndex`} * ${a}u;
${Array.from({length:t.size},(t,n)=>i?`  value[${n}] = ${i}(${e}[rowOffset + ${n}u]);`:`  value[${n}] = ${e}[rowOffset + ${n}u];`).join(`
`)}
  return value;
}`:`fn read_${e}(_rowIndex: u32) -> array<${r}, ${t.size}> {
  return array<${r}, ${t.size}>(${cE(t,i)});
}`}function iE(e,t){return`@group(0) @binding(${t}) var<storage, read_write> result: array<${Q(e.type)}>;`}function aE(e){let t=e.stride/e.ValueType.BYTES_PER_ELEMENT,n=e.offset/e.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${Q(e.type)}, ${e.size}>) {
  let rowOffset = ${n}u + rowIndex * ${t}u;
${Array.from({length:e.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join(`
`)}
}`}function oE(e,t,n,r,i){let a=``;if(i)for(let e=0;e<n.size;e++)a+=`  result[${e}] = ${i(e)};\n`;else if(r){let r=YT(n.type),i=Q(n.type);for(let o=0;o<n.size;o++){let n=t.map(([e,t])=>o<t.size?Q(t.type)===i?`${e}[${o}]`:`${i}(${e}[${o}])`:r);a+=`  result[${o}] = ${e}(${n.join(`, `)});\n`}}else a+=`result = ${e}(${t.map(([e])=>e).join(`, `)});`;return a.trimEnd()}function sE(e){return Array.isArray(e)?e.map((e,t)=>[`x${t}`,e]):Object.entries(e)}function cE(e,t){let n=e.value;if(!n)throw Error(`Constant input ${e} is missing CPU values`);return Array.from({length:e.size},(e,r)=>qT(t,n[r]??0)).join(`, `)}function lE(e,t){for(let n in t)e=e.replaceAll(`{${n}}`,t[n]);return e}var uE=`fn arithmetic_add(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x + y;
}

fn arithmetic_subtract(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x - y;
}

fn arithmetic_multiply(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x * y;
}

fn arithmetic_divide(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x / y;
}

fn arithmetic_tan(x: f32) -> f32 {
  return tan_fp32(x);
}
`,dE=({inputs:e,output:t,target:n,scope:r})=>{let i=t.type,a=Q(i),o=YT(i),s=e.namedInputs;return tE({scope:r,module:{name:`arithmetic`,source:uE,dependencies:[qe]},inputs:s,output:t,operationType:i,outputBuffer:n,expression:t=>$e(e.expression,{operations:Je,inputs:s,laneIndex:t,formatInput:e=>`${e}[${t}]`,formatOutOfBoundsInput:e=>s[e].size===1?`${e}[0]`:o,formatLiteral:e=>`${a}(${JT(i,Array.isArray(e)?e[t]??0:e)})`,formatCall:(e,t)=>`${e}(${t.join(`, `)})`})}),{success:!0}};dE.supportsEvaluationScope=!0;var fE=64,pE=`GPGPU Operation Counts`,mE=`Computation Runs`,hE=async({inputs:e,output:t,target:n})=>{let r=Math.ceil(t.byteLength/4),i=new Xw(n.device,{source:gE(e,t.length),shaderLayout:{bindings:[{name:`source`,type:`storage`,group:0,location:0},{name:`result`,type:`storage`,group:0,location:1}]}}),a={source:e.source.buffer,result:n};if(r>0){let e=n.device.beginComputePass({});n.device.statsManager.getStats(pE).get(mE).incrementCount(),i.dispatch(e,{bindings:a,x:Math.ceil(r/fE)}),e.end(),n.device.submit()}return i.destroy(),{success:!0}};function gE(e,t){let n=ze(e.inputFormat),r=ze(e.outputFormat),i=n.components,a=t*i,o=r.elementByteLength/r.components,s=4/o;return`\
@group(0) @binding(0) var<storage, read> source: array<u32>;
@group(0) @binding(1) var<storage, read_write> result: array<u32>;

fn readByte(byteIndex: u32) -> u32 {
  let word = source[byteIndex / 4u];
  return (word >> ((byteIndex % 4u) * 8u)) & 0xffu;
}

fn readUint16(byteIndex: u32) -> u32 {
  return readByte(byteIndex) | (readByte(byteIndex + 1u) << 8u);
}

fn readSourceValue(scalarIndex: u32) -> f32 {
  let rowIndex = scalarIndex / ${i}u;
  let componentIndex = scalarIndex % ${i}u;
  let byteIndex = ${e.source.offset}u + rowIndex * ${e.source.stride}u +
    componentIndex * ${n.elementByteLength/i}u;
  ${_E(n.signedDataType,n.normalized)}
}

${vE(e.outputFormat)}

@compute @workgroup_size(${fE}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let wordIndex = id.x;
  let firstScalarIndex = wordIndex * ${s}u;
  if (firstScalarIndex >= ${a}u) {
    return;
  }
  ${yE(r.signedDataType,o,a)}
}
`}function _E(e,t){switch(e){case`float32`:return`return bitcast<f32>(source[byteIndex / 4u]);`;case`float16`:return`let values = unpack2x16float(source[byteIndex / 4u]);
  return select(values.x, values.y, byteIndex % 4u == 2u);`;case`uint8`:return t?`return f32(readByte(byteIndex)) / 255.0;`:`return f32(readByte(byteIndex));`;case`sint8`:return t?`return max(f32(i32(readByte(byteIndex) << 24u) >> 24) / 127.0, -1.0);`:`return f32(i32(readByte(byteIndex) << 24u) >> 24);`;case`uint16`:return t?`return f32(readUint16(byteIndex)) / 65535.0;`:`return f32(readUint16(byteIndex));`;case`sint16`:return t?`return max(f32(i32(readUint16(byteIndex) << 16u) >> 16) / 32767.0, -1.0);`:`return f32(i32(readUint16(byteIndex) << 16u) >> 16);`;case`uint32`:return t?`return f32(source[byteIndex / 4u]) / 4294967295.0;`:`return f32(source[byteIndex / 4u]);`;case`sint32`:return t?`return max(f32(bitcast<i32>(source[byteIndex / 4u])) / 2147483647.0, -1.0);`:`return f32(bitcast<i32>(source[byteIndex / 4u]));`;default:throw Error(`castData WebGPU input does not support ${e}`)}}function vE(e){let{signedDataType:t,normalized:n}=ze(e);if(t===`float32`||t===`float16`)return`fn encodeValue(value: f32) -> f32 { return value; }`;let r=bE(t),i=t.startsWith(`sint`)?-r:0;return`fn encodeValue(value: f32) -> f32 { return ${n?`round(clamp(value, ${i<0?`-1.0`:`0.0`}, 1.0) * ${r}.0)`:`round(clamp(value, ${i}.0, ${r}.0))`}; }`}function yE(e,t,n){if(t===4){let t=`encodeValue(readSourceValue(firstScalarIndex))`;return e===`float32`?`result[wordIndex] = bitcast<u32>(${t});`:e===`sint32`?`result[wordIndex] = bitcast<u32>(i32(${t}));`:`result[wordIndex] = u32(${t});`}if(t===2&&e===`float16`)return`let second = select(0.0, readSourceValue(firstScalarIndex + 1u), firstScalarIndex + 1u < ${n}u);
  result[wordIndex] = pack2x16float(vec2<f32>(
    encodeValue(readSourceValue(firstScalarIndex)),
    encodeValue(second)
  ));`;let r=4/t,i=t*8,a=i===8?`0xffu`:`0xffffu`;return`result[wordIndex] = ${Array.from({length:r},(t,r)=>{let o=`firstScalarIndex + ${r}u`;return`(select(0u, (${e.startsWith(`sint`)?`bitcast<u32>(i32(encodeValue(readSourceValue(${o}))))`:`u32(encodeValue(readSourceValue(${o})))`}) & ${a}, ${o} < ${n}u) << ${r*i}u)`}).join(` |
    `)};`}function bE(e){switch(e){case`sint8`:return 127;case`uint8`:return 255;case`sint16`:return 32767;case`uint16`:return 65535;case`sint32`:return 2147483647;case`uint32`:return 4294967295;default:throw Error(`castData WebGPU output does not support ${e}`)}}var xE=64,SE=`GPGPU Operation Counts`,CE=`Computation Runs`,wE=async({inputs:e,output:t,target:n,scope:r})=>{let{source:i,inputFormat:a}=e;if(t.length===0)return{success:!0};let o=new Xw(n.device,{source:TE(a,i.offset,i.stride,t.length,e.outputFormat),shaderLayout:{bindings:[{name:`source`,type:`storage`,group:0,location:0},{name:`result`,type:`storage`,group:0,location:1}]}}),s={source:i.buffer,result:n};r&&r.retain(()=>o.destroy());try{let e=r?r.commandEncoder.beginComputePass({}):n.device.beginComputePass({});try{n.device.statsManager.getStats(SE).get(CE).incrementCount(),o.dispatch(e,{bindings:s,x:Math.ceil(t.length/xE)})}finally{e.end()}r||n.device.submit()}finally{r||o.destroy()}return{success:!0}};wE.supportsEvaluationScope=!0;function TE(e,t,n,r,i){return`\
@group(0) @binding(0) var<storage, read> source: array<u32>;
@group(0) @binding(1) var<storage, read_write> result: array<u32>;

// Treat the storage binding as raw 32-bit words so one shader can address packed Uint8, Float16,
// and Float32 rows with arbitrary supported strides. The float readers decode IEEE bit patterns;
// they do not numerically convert integer values to floats.

fn readByte(byteIndex: u32) -> u32 {
  let word = source[byteIndex / 4u];
  let shift = (byteIndex % 4u) * 8u;
  return (word >> shift) & 0xffu;
}

fn readUint8(byteIndex: u32) -> f32 {
  return f32(readByte(byteIndex)) / 255.0;
}

fn readFloat16Bits(byteIndex: u32) -> f32 {
  let word = source[byteIndex / 4u];
  let values = unpack2x16float(word);
  return select(values.x, values.y, byteIndex % 4u == 2u);
}

fn readFloat32Bits(byteIndex: u32) -> f32 {
  return bitcast<f32>(source[byteIndex / 4u]);
}

fn readColor(rowIndex: u32) -> vec4<f32> {
  let rowByteOffset = ${t}u + rowIndex * ${n}u;
${EE(e)}
}

@compute @workgroup_size(${xE}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let rowIndex = id.x;
  if (rowIndex >= ${r}u) {
    return;
  }

  let color = readColor(rowIndex);
${i===`unorm8x4`?`  result[rowIndex] = pack4x8unorm(color);`:i===`float16x4`?`  result[rowIndex * 2u] = pack2x16float(color.xy);
  result[rowIndex * 2u + 1u] = pack2x16float(color.zw);`:`  result[rowIndex * 4u] = bitcast<u32>(color.x);
  result[rowIndex * 4u + 1u] = bitcast<u32>(color.y);
  result[rowIndex * 4u + 2u] = bitcast<u32>(color.z);
  result[rowIndex * 4u + 3u] = bitcast<u32>(color.w);`}
}
`}function EE(e){switch(e){case`uint8x3`:return`  return vec4<f32>(
    readUint8(rowByteOffset),
    readUint8(rowByteOffset + 1u),
    readUint8(rowByteOffset + 2u),
    1.0
  );`;case`uint8x4`:return`  return vec4<f32>(
    readUint8(rowByteOffset),
    readUint8(rowByteOffset + 1u),
    readUint8(rowByteOffset + 2u),
    readUint8(rowByteOffset + 3u)
  );`;case`float16x3`:return`  return vec4<f32>(
    readFloat16Bits(rowByteOffset),
    readFloat16Bits(rowByteOffset + 2u),
    readFloat16Bits(rowByteOffset + 4u),
    1.0
  );`;case`float16x4`:return`  return vec4<f32>(
    readFloat16Bits(rowByteOffset),
    readFloat16Bits(rowByteOffset + 2u),
    readFloat16Bits(rowByteOffset + 4u),
    readFloat16Bits(rowByteOffset + 6u)
  );`;case`float32x3`:return`  return vec4<f32>(
    readFloat32Bits(rowByteOffset),
    readFloat32Bits(rowByteOffset + 4u),
    readFloat32Bits(rowByteOffset + 8u),
    1.0
  );`;case`float32x4`:return`  return vec4<f32>(
    readFloat32Bits(rowByteOffset),
    readFloat32Bits(rowByteOffset + 4u),
    readFloat32Bits(rowByteOffset + 8u),
    readFloat32Bits(rowByteOffset + 12u)
  );`;default:{let t=e;throw Error(`Unsupported color input format ${t}`)}}}var DE=`fn row_dot(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(y[i]);
  }
  return array<f32, 1>(sum);
}
`,OE=({inputs:e,output:t,target:n,scope:r})=>(tE({scope:r,module:{name:`row_dot`,source:DE},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0});OE.supportsEvaluationScope=!0;var kE=`fn equalAll(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<u32, 1> {
  var allEqual = 1u;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    if (x[i] != y[i]) {
      allEqual = 0u;
      break;
    }
  }
  return array<u32, 1>(allEqual);
}
`,AE=({inputs:e,output:t,target:n,scope:r})=>(tE({scope:r,module:{name:`equalAll`,source:kE},inputs:e,output:t,operationType:e.x.type,outputBuffer:n}),{success:!0});AE.supportsEvaluationScope=!0;function jE(e,t,n){return`@group(0) @binding(${n}) var<storage, read> ${e}: array<${Q(t.type)}>;`}function ME(e,t,n,r=e){let i=Q(n);if(t.isConstant){let e=t.value;if(!e)throw Error(`Constant input ${t} is missing CPU values`);return`fn read_${r}(_sourceIndex: u32) -> array<${i}, ${t.size}> {
  return array<${i}, ${t.size}>(${Array.from({length:t.size},(t,n)=>qT(i,e[n]??0)).join(`, `)});
}`}let a=t.stride/t.ValueType.BYTES_PER_ELEMENT,o=t.offset/t.ValueType.BYTES_PER_ELEMENT,s=Q(t.type)===i?``:`${i}`;return`fn read_${r}(sourceIndex: u32) -> array<${i}, ${t.size}> {
  var value: array<${i}, ${t.size}>;
  let rowOffset = ${o}u + sourceIndex * ${a}u;
${Array.from({length:t.size},(t,n)=>s?`  value[${n}] = ${s}(${e}[rowOffset + ${n}u]);`:`  value[${n}] = ${e}[rowOffset + ${n}u];`).join(`
`)}
  return value;
}`}function NE(e,t){return ME(`sourceValues`,e,t,`source_values`)}function PE(e,t){return`@group(0) @binding(${t}) var<storage, read_write> result: array<${Q(e.type)}>;`}function FE(e){let t=e.stride/e.ValueType.BYTES_PER_ELEMENT,n=e.offset/e.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${Q(e.type)}, ${e.size}>) {
  let rowOffset = ${n}u + rowIndex * ${t}u;
${Array.from({length:e.size},(e,t)=>`  result[rowOffset + ${t}u] = value[${t}];`).join(`
`)}
}`}function IE(e,t){let n=YT(e);return`fn zero_result() -> array<${Q(e)}, ${t}> {
  var result: array<${Q(e)}, ${t}>;
${Array.from({length:t},(e,t)=>`  result[${t}] = ${n};`).join(`
`)}
  return result;
}`}var LE=({inputs:e,output:t,target:n})=>{let{sourceValues:r}=e;if(r.length===0){let e=new t.ValueType(t.length*t.size);return n.write(e),{success:!0,value:e}}if(r.isConstant){let e=r.value;if(!e)throw Error(`Constant input ${r} is missing CPU values`);let i=new t.ValueType(t.length*t.size);for(let n=0;n<t.length;n++){let t=e[n];i[n*2]=t,i[n*2+1]=t}return n.write(i),{success:!0,value:i}}let i=[],a=r,o=`raw`,s=r.length;try{for(;;){let e=Math.ceil(s/64),r=t.length*e,c=e===1?n:Le.createOrReuse(n.device,r*t.stride);if(e>1&&i.push(c),RE({input:a,inputMode:o,inputGroupCount:s,channelCount:t.length,outputType:t.type,outputBuffer:c,outputLength:r,outputStride:t.stride,outputOffset:t.offset}),e===1)break;a=new Ze({buffer:c,type:t.type,size:2,length:r}),o=`partial`,s=e}return{success:!0}}finally{for(let e of i)Le.recycle(e)}};function RE({input:e,inputMode:t,inputGroupCount:n,channelCount:r,outputType:i,outputBuffer:a,outputLength:o,outputStride:s,outputOffset:c}){let l=Q(i),u=UT(o,a.device.limits.maxComputeWorkgroupsPerDimension),d=new Ze({buffer:a,type:i,size:2,length:o,stride:s,offset:c}),f=`
${e.isConstant?``:jE(`sourceValues`,e,0)}
${NE(e,i)}
${PE(d,e.isConstant?0:1)}
${FE(d)}
${zE(t,i,r,n)}

var<workgroup> sharedMin: array<${l}, 64>;
var<workgroup> sharedMax: array<${l}, 64>;

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let outputRowIndex = ${WT(u)};
  if (outputRowIndex >= ${o}u) {
    return;
  }

  let channelIndex = outputRowIndex % ${r}u;
  let outputGroupIndex = outputRowIndex / ${r}u;
  let inputGroupIndex = outputGroupIndex * 64u + localId.x;

  let result = extent_pass(channelIndex, inputGroupIndex);
  sharedMin[localId.x] = result[0];
  sharedMax[localId.x] = result[1];
  workgroupBarrier();

  var stride = 32u;
  loop {
    if (stride == 0u) {
      break;
    }
    if (localId.x < stride) {
      let compareIndex = localId.x + stride;
      if (sharedMin[compareIndex] < sharedMin[localId.x]) {
        sharedMin[localId.x] = sharedMin[compareIndex];
      }
      if (sharedMax[compareIndex] > sharedMax[localId.x]) {
        sharedMax[localId.x] = sharedMax[compareIndex];
      }
    }
    workgroupBarrier();
    stride = stride / 2u;
  }

  if (localId.x == 0u) {
    write_result(outputRowIndex, array<${l}, 2>(sharedMin[0], sharedMax[0]));
  }
}
`,p=new Xw(a.device,{source:f,shaderLayout:{bindings:[...e.isConstant?[]:[{name:`sourceValues`,type:`storage`,group:0,location:0}],{name:`result`,type:`storage`,group:0,location:e.isConstant?0:1}]}}),m={result:a};e.isConstant||(m.sourceValues=e.buffer);let h=m,g=a.device.beginComputePass({});p.dispatch(g,{bindings:h,x:u.x,y:u.y,z:u.z}),g.end(),a.device.submit(),p.destroy()}function zE(e,t,n,r){let i=Q(t),[a,o]=BE(t);return e===`raw`?`fn extent_pass(channelIndex: u32, inputGroupIndex: u32) -> array<${i}, 2> {
  var result: array<${i}, 2>;
  result[0] = ${a};
  result[1] = ${o};

  if (inputGroupIndex < ${r}u) {
    let value = read_source_values(inputGroupIndex);
    result[0] = value[channelIndex];
    result[1] = value[channelIndex];
  }

  return result;
}`:`fn extent_pass(channelIndex: u32, inputGroupIndex: u32) -> array<${i}, 2> {
  var result: array<${i}, 2>;
  result[0] = ${a};
  result[1] = ${o};

  if (inputGroupIndex < ${r}u) {
    let rowIndex = inputGroupIndex * ${n}u + channelIndex;
    let value = read_source_values(rowIndex);
    result[0] = value[0];
    result[1] = value[1];
  }

  return result;
}`}function BE(e){switch(e){case`uint32`:return[`0xffffffffu`,`0u`];case`sint32`:return[`2147483647`,`-2147483648`];case`float32`:return[`3.402823e38`,`-3.402823e38`];default:throw Error(`Unsupported WebGPU extent type for ${e}`)}}function VE(){let e=new Uint16Array([255]);return new Uint8Array(e.buffer)[0]>0}var HE=`\
const LE: bool = ${VE()?`true`:`false`};
const F32_NAN: u32 = 0xffffffffu;
const F32_INF: u32 = 0x7f800000u;

fn roundShiftRight(value: u32, shift: i32) -> u32 {
  if (shift <= 0) {
    return value << u32(-shift);
  }

  if (shift >= 32) {
    if (shift == 32 && value > 0x80000000u) {
      return 1u;
    }
    return 0u;
  }

  let shiftU32 = u32(shift);
  let truncated = value >> shiftU32;
  let halfShift = 1u << u32(shift - 1);
  let remainder = value & ((1u << shiftU32) - 1u);
  if (remainder > halfShift || (remainder == halfShift && (truncated & 1u) == 1u)) {
    return truncated + 1u;
  }
  return truncated;
}

fn makeFloatImmediate(sign: u32, exponent: i32, mantissa: u32) -> u32 {
  return (sign << 31u) | (u32(exponent + 127) << 23u) | (mantissa & 0x7fffffu);
}

fn makeFloat(sign: u32, exponent: i32, significand: u32) -> u32 {
  if (significand == 0u) {
    return sign << 31u;
  }

  let leadingZeros = i32(countLeadingZeros(significand));
  var normalizedExponent = exponent + 31 - leadingZeros;

  if (normalizedExponent > 127) {
    return (sign << 31u) | F32_INF;
  }

  var mantissa: u32;
  if (normalizedExponent >= -126) {
    mantissa = roundShiftRight(significand, 8 - leadingZeros);
    if (mantissa >= 0x1000000u) {
      mantissa = mantissa >> 1u;
      normalizedExponent += 1;
      if (normalizedExponent > 127) {
        return (sign << 31u) | F32_INF;
      }
    }
    return makeFloatImmediate(sign, normalizedExponent, mantissa);
  }

  let subnormalShift = -149 - exponent;
  mantissa = roundShiftRight(significand, subnormalShift);
  if (mantissa >= 0x800000u) {
    return (sign << 31u) | (1u << 23u);
  }
  return (sign << 31u) | mantissa;
}

fn parseAsDouble(words: vec2<u32>) -> vec2<u32> {
  var d = words;
  if (LE) {
    d = d.yx;
  }

  let sign = (d.x >> 31u) & 1u;
  let exponentBits = (d.x >> 20u) & 0x7ffu;
  let exponent = i32(exponentBits) - 1023;
  let fractionHigh = d.x & 0xfffffu;
  let fractionLow = d.y;

  if (exponentBits == 0x7ffu) {
    if (fractionHigh == 0u && fractionLow == 0u) {
      return vec2<u32>((sign << 31u) | F32_INF, F32_NAN);
    }
    return vec2<u32>(F32_NAN);
  }

  if (exponentBits == 0u) {
    return vec2<u32>(sign << 31u);
  }

  if (exponent > 127) {
    return vec2<u32>((sign << 31u) | F32_INF, ((1u - sign) << 31u) | F32_INF);
  }

  let highSignificand = 0x800000u | (fractionHigh << 3u) | (fractionLow >> 29u);
  let lowSignificand = fractionLow & 0x1fffffffu;

  if (exponent < -126) {
    let highPart = makeFloat(sign, exponent - 23, highSignificand);
    let lowPart = makeFloat(sign, exponent - 52, lowSignificand);
    return vec2<u32>(highPart, lowPart);
  }

  let roundUp = lowSignificand > 0x10000000u ||
    (lowSignificand == 0x10000000u && (highSignificand & 1u) == 1u);

  var roundedSignificand = highSignificand + select(0u, 1u, roundUp);
  var highExponent = exponent;
  if (roundedSignificand == 0x1000000u) {
    roundedSignificand = 0x800000u;
    highExponent += 1;
  }

  if (highExponent > 127) {
    return vec2<u32>((sign << 31u) | F32_INF, ((1u - sign) << 31u) | F32_INF);
  }

  let highPart = makeFloatImmediate(sign, highExponent, roundedSignificand);

  var remainder = i32(lowSignificand);
  var lowSign = sign;
  if (roundUp) {
    remainder -= 0x20000000;
  }
  if (remainder < 0) {
    lowSign = 1u - sign;
    remainder = -remainder;
  }

  let lowPart = makeFloat(lowSign, exponent - 52, u32(remainder));
  return vec2<u32>(highPart, lowPart);
}

fn fround(x: array<u32, {X_LEN}>) -> array<f32, {RESULT_LEN}> {
  var result: array<f32, {RESULT_LEN}>;
  let n = {X_LEN}u / 2u;
  for (var i = 0u; i < n; i = i + 1u) {
    let parts = parseAsDouble(vec2<u32>(x[i * 2u], x[i * 2u + 1u]));
    result[i] = bitcast<f32>(parts.x);
    result[i + n] = bitcast<f32>(parts.y);
  }
  return result;
}
`,UE=({inputs:e,output:t,target:n,scope:r})=>(tE({scope:r,module:{name:`fround`,source:HE},inputs:e,output:t,operationType:`uint32`,outputBuffer:n}),{success:!0});UE.supportsEvaluationScope=!0;var WE=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=Q(r.type),o=[];r.isConstant||o.push({name:`ids`,input:r,index:o.length}),i.isConstant||o.push({name:`sourceValues`,input:i,index:o.length});let s=UT(Math.ceil(t.length/64),n.device.limits.maxComputeWorkgroupsPerDimension),c=`
${o.map(({name:e,input:t,index:n})=>jE(e,t,n)).join(`
`)}
${GE(r,a)}
${NE(i,t.type)}
${PE(t,o.length)}
${FE(t)}
${IE(t.type,t.size)}
${KE(r.type,t.type,t.size,i.length)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${GT(s,64)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let idsValue = read_ids(rowIndex);
  let result = gather(idsValue);
  write_result(rowIndex, result);
}
`,l=new Xw(n.device,{source:c,shaderLayout:{bindings:[...o.map(({name:e,index:t})=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:o.length}]}}),u={};r.isConstant||(u.ids=r.buffer),i.isConstant||(u.sourceValues=i.buffer),u.result=n;let d=u,f=n.device.beginComputePass({});return l.dispatch(f,{bindings:d,x:s.x,y:s.y,z:s.z}),f.end(),n.device.submit(),l.destroy(),{success:!0}};function GE(e,t){if(e.isConstant){let n=e.value;if(!n)throw Error(`Constant input ${e} is missing CPU values`);return`fn read_ids(_rowIndex: u32) -> ${t} {
  return ${qT(t,n[0]??0)};
}`}let n=e.stride/e.ValueType.BYTES_PER_ELEMENT;return`fn read_ids(rowIndex: u32) -> ${t} {
  let rowOffset = ${e.offset/e.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${n}u;
  return ids[rowOffset];
}`}function KE(e,t,n,r){let i=Q(e);return`fn gather(idsValue: ${i}) -> array<${Q(t)}, ${n}> {
  let sourceIndex = ${i===`u32`?`i32(idsValue)`:i===`i32`?`idsValue`:`i32(idsValue)`};
  if (sourceIndex < 0 || sourceIndex >= ${r}) {
    return zero_result();
  }
  return read_source_values(u32(sourceIndex));
}`}var qE=async({inputs:e,output:t,target:n})=>{let{segments:r}=e,i=r.isConstant?[]:[{name:`segments`,input:r,index:0}],a=UT(Math.ceil(t.length/64),n.device.limits.maxComputeWorkgroupsPerDimension),o=`
${i.map(({name:e,input:t,index:n})=>jE(e,t,n)).join(`
`)}
${ME(`segments`,r,`uint32`)}
${PE(t,i.length)}
${FE(t)}
${JE(r.length)}

@compute @workgroup_size(64) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${GT(a,64)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let result = segmented_map(rowIndex);
  write_result(rowIndex, result);
}
`,s=new Xw(n.device,{source:o,shaderLayout:{bindings:[...i.map(({name:e,index:t})=>({name:e,type:`storage`,group:0,location:t})),{name:`result`,type:`storage`,group:0,location:i.length}]}}),c=Object.fromEntries(i.map(({name:e,input:t})=>[e,t.buffer]));c.result=n;let l=c,u=n.device.beginComputePass({});return s.dispatch(u,{bindings:l,x:a.x,y:a.y,z:a.z}),u.end(),n.device.submit(),s.destroy(),{success:!0}};function JE(e){return`fn segmented_map(vertexIndex: u32) -> array<u32, 2> {
  var low = 0i;
  var high = ${e}i;
  while (low < high) {
    let mid = low + (high - low) / 2i;
    let midStart = read_segments(u32(mid))[0];
    if (midStart <= vertexIndex) {
      low = mid + 1i;
    } else {
      high = mid;
    }
  }

  let segmentIndex = u32(max(low - 1i, 0i));
  let segmentStart = read_segments(segmentIndex)[0];
  return array<u32, 2>(segmentIndex, vertexIndex - segmentStart);
}`}var YE=({inputs:e,output:t,target:n,scope:r})=>{let i=e.map((e,t)=>[`x${t}`,e]);XE(n.device.limits,i);let a=i.map(([e,t])=>`${e}: array<{TYPE}, ${t.size}>`).join(`, `),o=0;return tE({scope:r,module:{name:`interleave`,source:`\
fn interleave(${a}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${i.map(([e,t])=>{let n=Array.from({length:t.size},(t,n)=>`  out[${o+n}] = ${e}[${n}];`).join(`
`);return o+=t.size,n}).join(`
`)}
  return out;
}
`},inputs:e,output:t,outputBuffer:n}),{success:!0}};function XE(e,t){let n=t.filter(([,e])=>eE(e)).length+1;if(n>e.maxStorageBuffersPerShaderStage)throw Error(`interleave() requires ${n} storage buffers, exceeding device limit ${e.maxStorageBuffersPerShaderStage}`);if(n>e.maxBindingsPerBindGroup)throw Error(`interleave() requires ${n} bindings, exceeding bind group limit ${e.maxBindingsPerBindGroup}`)}YE.supportsEvaluationScope=!0;var ZE=`fn row_length(x: array<{TYPE}, {X_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(x[i]);
  }
  return array<f32, 1>(sqrt(sum));
}
`,QE=({inputs:e,output:t,target:n,scope:r})=>(tE({scope:r,module:{name:`row_length`,source:ZE},inputs:e,output:t,operationType:`float32`,outputBuffer:n}),{success:!0});QE.supportsEvaluationScope=!0;var $E=async({inputs:e,output:t,target:n,scope:r})=>{let i=YT(t.type);return tE({scope:r,module:{name:`select`,source:`// inline expression select
`},inputs:e,output:t,operationType:t.type,outputBuffer:n,expression:t=>{let n=eD(`condition`,e.condition,t,i),r=eD(`whenTrue`,e.whenTrue,t,i);return`select(${eD(`whenFalse`,e.whenFalse,t,i)}, ${r}, ${n} != ${i})`}}),{success:!0}};function eD(e,t,n,r){return n<t.size?`${e}[${n}]`:t.size===1?`${e}[0]`:r}$E.supportsEvaluationScope=!0;var tD=64,nD=({inputs:e,output:t,target:n})=>{let r=UT(Math.ceil(t.length/tD),n.device.limits.maxComputeWorkgroupsPerDimension),i=`\
@group(0) @binding(0) var<storage, read_write> result: array<i32>;

@compute @workgroup_size(${tD}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${GT(r,tD)};
  if (rowIndex >= ${t.length}u) {
    return;
  }

  let rowOffset = ${t.offset/t.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${t.stride/t.ValueType.BYTES_PER_ELEMENT}u;
  result[rowOffset] = ${e.start} + i32(rowIndex) * ${e.step};
}
`,a=new Xw(n.device,{source:i,shaderLayout:{bindings:[{name:`result`,type:`storage`,group:0,location:0}]}}),o={result:n},s=n.device.beginComputePass({});return a.dispatch(s,{bindings:o,x:r.x,y:r.y,z:r.z}),s.end(),n.device.submit(),a.destroy(),{success:!0}},rD=({inputs:e,output:t,target:n,scope:r})=>{let{columns:i}=e;return tE({scope:r,module:{name:`swizzle`,source:`// swizzle expression handled inline`},expression:e=>`x[${i[e]}]`,inputs:{x:e.x},output:t,outputBuffer:n}),{success:!0}};rD.supportsEvaluationScope=!0;var iD=st({arithmetic:()=>dE,castData:()=>hE,convertColors:()=>wE,dot:()=>OE,equalAll:()=>AE,extent:()=>LE,fround:()=>UE,gather:()=>WE,interleave:()=>YE,length:()=>QE,segmentedMap:()=>qE,select:()=>$E,sequence:()=>nD,swizzle:()=>rD}),aD=class{constructor(e,{id:t,isTransitionAttribute:n}){this.packedBuffers={},this.device=e,this.id=t,this.isTransitionAttribute=n,this.device.type===`webgpu`&&wT.add(`webgpu`,{interleave:YE})}hasGroups(e){return this.device.type===`webgpu`&&Object.values(e).some(e=>!!e.settings.bufferGroup)}finalize(){for(let e of Object.values(this.packedBuffers))e.packed.destroy();this.packedBuffers={}}getBufferLayouts(e,t){let n=this._getPackedGroups(e,t,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(e,n,t)}getBindings(e,t,n,r){let i=this._getPackedGroups(e,n,{requireValues:!0,excludeAttributes:r}),a={},o=new Set;for(let e of i.values()){let n=!this.packedBuffers[e.id]||e.attributes.some(e=>!!t[e.id]);a[e.id]=this._getPackedBuffer(e,n);for(let t of e.attributes)o.add(t.id)}return{bufferLayouts:this._getBufferLayouts(e,i,n).filter(t=>!r[t.name]&&!e[t.name]?.settings.isIndexed),buffers:a,groupedAttributeIds:o}}_getPackedGroups(e,t,{requireValues:n,excludeAttributes:r}){let i=new Map;for(let t of Object.values(e)){let e=t.settings.bufferGroup;if(!e)continue;let n=i.get(e)||[];n.push(t),i.set(e,n)}let a=new Map;for(let[e,o]of i){let i=this._getPackedGroup(e,o,t,n,r);i&&a.set(e,i)}return a}_getPackedGroup(e,t,n,r,i){if(t.length<2)return null;let a=t.map(e=>e.getBufferLayout(n)),o=a[0].stepMode,s=Math.max(1,t[0].numInstances),c=r&&t.every(e=>e.isConstant);for(let e=0;e<t.length;e++){let n=t[e],c=n.getAccessor(),l=c.size*c.bytesPerElement;if(i[n.id]||n.settings.isIndexed||n.settings.noAlloc||n.doublePrecision||this.isTransitionAttribute(n.id)||a[e].stepMode!==o||n.numInstances!==t[0].numInstances||(c.offset||0)!==0||(c.vertexOffset||0)!==0||jw(c)!==l||r&&(n.isConstant?!n.getConstantValue()||n.getConstantValue().byteLength<l:!ArrayBuffer.isView(n.value)||n.value.byteLength<s*l))return null}let l={},u=[],d=0;for(let e=0;e<t.length;e++){let n=t[e];d=oD(d),l[n.id]=d;for(let t of a[e].attributes||[])u.push({...t,byteOffset:d+(t.byteOffset||0)});d+=jw(n.getAccessor())}return d=oD(d),{id:e,attributes:t,byteStride:d,byteOffsets:l,rowCount:s,layout:{name:e,byteStride:c?0:d,stepMode:o,attributes:u}}}_getBufferLayouts(e,t,n){let r=[],i=new Set,a=new Set;for(let e of t.values())for(let t of e.attributes)a.add(t.id);for(let o of Object.values(e)){let e=o.settings.bufferGroup,s=e&&t.get(e);s&&a.has(o.id)?i.has(s.id)||(r.push(s.layout),i.add(s.id)):r.push(o.getBufferLayout(n))}return r}_getPackedBuffer(e,t){let n=JSON.stringify({byteStride:e.layout.byteStride,attributes:e.layout.attributes}),r=this.packedBuffers[e.id];if((!r||r.layoutKey!==n)&&(t=!0),t){r&&(r.packed.destroy(),delete this.packedBuffers[e.id]);let t=this._interleavePackedGroup(e);return this.packedBuffers[e.id]={packed:t,layoutKey:n},t.buffer}if(!r)throw Error(`Attribute buffer group ${e.id} has no packed buffer`);return r.packed.buffer}_interleavePackedGroup(e){let t=NT(...e.attributes.map(t=>this._getInterleaveInput(e,t)));return PT(this.device,t),t}_getInterleaveInput(e,t){let n=jw(t.getAccessor()),r=e.byteOffsets[t.id];if(sD(`${e.id}.${t.id} rowByteLength`,n),sD(`${e.id}.${t.id} groupByteOffset`,r),t.isConstant){let r=t.getConstantValue();if(!r)throw Error(`Attribute group ${e.id} is missing constant value ${t.id}`);return sD(`${e.id}.${t.id} constant byteOffset`,r.byteOffset),new Ze({id:t.id,type:`uint32`,size:n/4,isConstant:!0,value:new Uint32Array(r.buffer,r.byteOffset,n/Uint32Array.BYTES_PER_ELEMENT)})}let i=t.getBuffer(),a=t.byteOffset,o=t.getAccessor().stride||n;if(sD(`${e.id}.${t.id} byteOffset`,a),sD(`${e.id}.${t.id} stride`,o),!i)throw Error(`Attribute group ${e.id} cannot interleave missing buffer ${t.id}`);return new Ze({id:t.id,type:`uint32`,size:n/4,offset:a,stride:o,length:e.rowCount,buffer:i})}};function oD(e){return Math.ceil(e/4)*4}function sD(e,t){if(t%4!=0)throw Error(`Attribute buffer groups require 32-bit alignment: ${e}=${t}`)}function cD(e){let{source:t,target:n,start:r=0,size:i,getData:a}=e,o=e.end||n.length,s=t.length,c=o-r;if(s>c){n.set(t.subarray(0,c),r);return}if(n.set(t,r),!a)return;let l=s;for(;l<c;){let e=a(l,t);for(let t=0;t<i;t++)n[r+l]=e[t]||0,l++}}function lD({source:e,target:t,size:n,getData:r,sourceStartIndices:i,targetStartIndices:a}){if(!i||!a)return cD({source:e,target:t,size:n,getData:r}),t;let o=0,s=0,c=r&&((e,t)=>r(e+s,t)),l=Math.min(i.length,a.length);for(let r=1;r<l;r++){let l=i[r]*n,u=a[r]*n;cD({source:e.subarray(o,l),target:t,start:s,end:u,size:n,getData:c}),o=l,s=u}return s<t.length&&cD({source:[],target:t,start:s,size:n,getData:c}),t}function uD(e){let{device:t,settings:n,value:r}=e,i=new Kw(t,n);return i.setData({value:r instanceof Float64Array?new Float64Array:new Float32Array,normalized:n.normalized}),i}function dD(e){switch(e){case 1:return`float`;case 2:return`vec2`;case 3:return`vec3`;case 4:return`vec4`;default:throw Error(`No defined attribute type for size "${e}"`)}}function fD(e){switch(e){case 1:return`float32`;case 2:return`float32x2`;case 3:return`float32x3`;case 4:return`float32x4`;default:throw Error(`invalid type size`)}}function pD(e){e.push(e.shift())}function mD(e,t){let{settings:n,value:r,size:i}=e,a=e.isDoublePrecisionBuffer?2:1,o=0,{shaderAttributes:s}=e.settings;if(s)for(let e of Object.values(s))o=Math.max(o,e.vertexOffset??0);return(n.noAlloc?r.length:(t+o)*i)*a}function hD({device:e,source:t,target:n}){return(!n||n.byteLength<t.byteLength)&&(n?.destroy(),n=e.createBuffer({byteLength:t.byteLength,usage:t.usage})),n}function gD({device:e,buffer:t,attribute:n,fromLength:r,toLength:i,fromStartIndices:a,getData:o=e=>e}){let s=n.isDoublePrecisionBuffer?2:1,c=n.size*s,l=n.byteOffset,u=n.settings.bytesPerElement<4?l/n.settings.bytesPerElement*4:l,d=n.startIndices,f=a&&d,p=n.isConstant;if(!f&&t&&r>=i)return t;let m=n.value instanceof Float64Array?Float32Array:n.value.constructor,h=p?n.value:new m(n.getBuffer().readSyncWebGL(l,i*m.BYTES_PER_ELEMENT).buffer);if(n.settings.normalized&&!p){let e=o;o=(t,r)=>n.normalizeConstant(e(t,r))}let g=p?(e,t)=>o(h,t):(e,t)=>o(h.subarray(e+l,e+l+c),t),_=t?new Float32Array(t.readSyncWebGL(u,r*4).buffer):new Float32Array,v=new Float32Array(i);return lD({source:_,target:v,sourceStartIndices:a,targetStartIndices:d,size:c,getData:g}),(!t||t.byteLength<v.byteLength+u)&&(t?.destroy(),t=e.createBuffer({byteLength:v.byteLength+u,usage:35050})),t.write(v,u),t}var _D=class{constructor({device:e,attribute:t,timeline:n}){this.buffers=[],this.currentLength=0,this.device=e,this.transition=new Hy(n),this.attribute=t,this.attributeInTransition=uD(t),this.currentStartIndices=t.startIndices}get inProgress(){return this.transition.inProgress}start(e,t,n=1/0){this.settings=e,this.currentStartIndices=this.attribute.startIndices,this.currentLength=mD(this.attribute,t),this.transition.start({...e,duration:n})}update(){let e=this.transition.update();return e&&this.onUpdate(),e}setBuffer(e){let{stride:t}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:e,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:t})}cancel(){this.transition.cancel()}delete(){this.cancel();for(let e of this.buffers)e.destroy();this.buffers.length=0}},vD=class extends _D{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type=`interpolation`,this.transform=CD(e,t)}start(e,t){let n=this.currentLength,r=this.currentStartIndices;if(super.start(e,t,e.duration),e.duration<=0){this.transition.cancel();return}let{buffers:i,attribute:a}=this;pD(i),i[0]=gD({device:this.device,buffer:i[0],attribute:a,fromLength:n,toLength:this.currentLength,fromStartIndices:r,getData:e.enter}),i[1]=hD({device:this.device,source:i[0],target:i[1]}),this.setBuffer(i[1]);let{transform:o}=this,s=o.model,c=Math.floor(this.currentLength/a.size);SD(a)&&(c/=2),s.setVertexCount(c),a.isConstant?(s.setAttributes({aFrom:i[0]}),s.setConstantAttributes({aTo:a.value})):s.setAttributes({aFrom:i[0],aTo:a.getBuffer()}),o.transformFeedback.setBuffers({vCurrent:i[1]})}onUpdate(){let{duration:e,easing:t}=this.settings,{time:n}=this.transition,r=n/e;t&&(r=t(r));let{model:i}=this.transform,a={time:r};i.shaderInputs.setProps({interpolation:a}),this.transform.run({discard:!0})}delete(){super.delete(),this.transform.destroy()}},yD={name:`interpolation`,vs:`layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,uniformTypes:{time:`f32`}},bD=`#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,xD=`#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aFrom64Low;
in ATTRIBUTE_TYPE aTo;
in ATTRIBUTE_TYPE aTo64Low;
out ATTRIBUTE_TYPE vCurrent;
out ATTRIBUTE_TYPE vCurrent64Low;

vec2 mix_fp64(vec2 a, vec2 b, float x) {
  vec2 range = sub_fp64(b, a);
  return sum_fp64(a, mul_fp64(range, vec2(x, 0.0)));
}

void main(void) {
  for (int i=0; i<ATTRIBUTE_SIZE; i++) {
    vec2 value = mix_fp64(vec2(aFrom[i], aFrom64Low[i]), vec2(aTo[i], aTo64Low[i]), interpolation.time);
    vCurrent[i] = value.x;
    vCurrent64Low[i] = value.y;
  }
  gl_Position = vec4(0.0);
}
`;function SD(e){return e.isDoublePrecisionBuffer}function CD(e,t){let n=t.size,r=dD(n),i=fD(n),a=t.getBufferLayout();return SD(t)?new $v(e,{vs:xD,bufferLayout:[{name:`aFrom`,byteStride:8*n,attributes:[{attribute:`aFrom`,format:i,byteOffset:0},{attribute:`aFrom64Low`,format:i,byteOffset:4*n}]},{name:`aTo`,byteStride:8*n,attributes:[{attribute:`aTo`,format:i,byteOffset:0},{attribute:`aTo64Low`,format:i,byteOffset:4*n}]}],modules:[bl,yD],defines:{ATTRIBUTE_TYPE:r,ATTRIBUTE_SIZE:n},moduleSettings:{},varyings:[`vCurrent`,`vCurrent64Low`],bufferMode:35980,disableWarnings:!0}):new $v(e,{vs:bD,bufferLayout:[{name:`aFrom`,format:i},{name:`aTo`,format:a.attributes[0].format}],modules:[yD],defines:{ATTRIBUTE_TYPE:r},varyings:[`vCurrent`],disableWarnings:!0})}var wD=class extends _D{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type=`spring`,this.texture=kD(e),this.framebuffer=AD(e,this.texture),this.transform=OD(e,t)}start(e,t){let n=this.currentLength,r=this.currentStartIndices;super.start(e,t);let{buffers:i,attribute:a}=this;for(let t=0;t<2;t++)i[t]=gD({device:this.device,buffer:i[t],attribute:a,fromLength:n,toLength:this.currentLength,fromStartIndices:r,getData:e.enter});i[2]=hD({device:this.device,source:i[0],target:i[2]}),this.setBuffer(i[1]);let{model:o}=this.transform;o.setVertexCount(Math.floor(this.currentLength/a.size)),a.isConstant?o.setConstantAttributes({aTo:a.value}):o.setAttributes({aTo:a.getBuffer()})}onUpdate(){let{buffers:e,transform:t,framebuffer:n,transition:r}=this,i=this.settings;t.model.setAttributes({aPrev:e[0],aCur:e[1]}),t.transformFeedback.setBuffers({vNext:e[2]});let a={stiffness:i.stiffness,damping:i.damping};t.model.shaderInputs.setProps({spring:a}),t.run({framebuffer:n,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),pD(e),this.setBuffer(e[1]),this.device.readPixelsToArrayWebGL(n)[0]>0||r.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}},TD={name:`spring`,vs:`layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,uniformTypes:{damping:`f32`,stiffness:`f32`}},ED=`#version 300 es
#define SHADER_NAME spring-transition-vertex-shader

#define EPSILON 0.00001

in ATTRIBUTE_TYPE aPrev;
in ATTRIBUTE_TYPE aCur;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vNext;
out float vIsTransitioningFlag;

ATTRIBUTE_TYPE getNextValue(ATTRIBUTE_TYPE cur, ATTRIBUTE_TYPE prev, ATTRIBUTE_TYPE dest) {
  ATTRIBUTE_TYPE velocity = cur - prev;
  ATTRIBUTE_TYPE delta = dest - cur;
  ATTRIBUTE_TYPE force = delta * spring.stiffness;
  ATTRIBUTE_TYPE resistance = velocity * spring.damping;
  return force - resistance + velocity + cur;
}

void main(void) {
  bool isTransitioning = length(aCur - aPrev) > EPSILON || length(aTo - aCur) > EPSILON;
  vIsTransitioningFlag = isTransitioning ? 1.0 : 0.0;

  vNext = getNextValue(aCur, aPrev, aTo);
  gl_Position = vec4(0, 0, 0, 1);
  gl_PointSize = 100.0;
}
`,DD=`#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`;function OD(e,t){let n=dD(t.size),r=fD(t.size);return new $v(e,{vs:ED,fs:DD,bufferLayout:[{name:`aPrev`,format:r},{name:`aCur`,format:r},{name:`aTo`,format:t.getBufferLayout().attributes[0].format}],varyings:[`vNext`],modules:[TD],defines:{ATTRIBUTE_TYPE:n},parameters:{depthCompare:`always`,blendColorOperation:`max`,blendColorSrcFactor:`one`,blendColorDstFactor:`one`,blendAlphaOperation:`max`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one`}})}function kD(e){return e.createTexture({data:new Uint8Array(4),format:`rgba8unorm`,width:1,height:1})}function AD(e,t){return e.createFramebuffer({id:`spring-transition-is-transitioning-framebuffer`,width:1,height:1,colorAttachments:[t]})}var jD={interpolation:vD,spring:wD},MD=class{constructor(e,{id:t,timeline:n}){if(!e)throw Error(`AttributeTransitionManager is constructed without device`);this.id=t,this.device=e,this.timeline=n,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let e in this.transitions)this._removeTransition(e)}update({attributes:e,transitions:t,numInstances:n}){this.numInstances=n||1;for(let n in e){let r=e[n],i=r.getTransitionSetting(t);i&&this._updateAttribute(n,r,i)}for(let n in this.transitions){let r=e[n];(!r||!r.getTransitionSetting(t))&&this._removeTransition(n)}}hasAttribute(e){let t=this.transitions[e];return t&&t.inProgress}getAttributes(){let e={};for(let t in this.transitions){let n=this.transitions[t];n.inProgress&&(e[t]=n.attributeInTransition)}return e}run(){if(this.numInstances===0)return!1;for(let e in this.transitions)this.transitions[e].update()&&(this.needsRedraw=!0);let e=this.needsRedraw;return this.needsRedraw=!1,e}_removeTransition(e){this.transitions[e].delete(),delete this.transitions[e]}_updateAttribute(e,t,n){let r=this.transitions[e],i=!r||r.type!==n.type;if(i){r&&this._removeTransition(e);let a=jD[n.type];a?this.transitions[e]=new a({attribute:t,timeline:this.timeline,device:this.device}):(N.error(`unsupported transition type '${n.type}'`)(),i=!1)}(i||t.needsRedraw())&&(this.needsRedraw=!0,this.transitions[e].start(n,this.numInstances))}},ND=`attributeManager.invalidate`,PD=`attributeManager.updateStart`,FD=`attributeManager.updateEnd`,ID=`attribute.updateStart`,LD=`attribute.allocate`,RD=`attribute.updateEnd`,zD=class{constructor(e,{id:t=`attribute-manager`,stats:n,timeline:r}={}){this.mergeBoundsMemoized=Ff(Wm),this.id=t,this.device=e,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=n,this.attributeTransitionManager=new MD(e,{id:`${t}-transitions`,timeline:r}),this.attributeBufferGroups=e.type===`webgpu`?new aD(e,{id:t,isTransitionAttribute:e=>this.attributeTransitionManager.hasAttribute(e)}):null,Object.seal(this)}finalize(){this.attributeBufferGroups?.finalize();for(let e in this.attributes)this.attributes[e].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(e={clearRedrawFlags:!1}){let t=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!e.clearRedrawFlags,t&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(e){this._add(e)}addInstanced(e){this._add(e,{stepMode:`instance`})}remove(e){for(let t of e)this.attributes[t]!==void 0&&(this.attributes[t].delete(),delete this.attributes[t])}invalidate(e,t){let n=this._invalidateTrigger(e,t);P(ND,this,e,n)}invalidateAll(e){for(let t in this.attributes)this.attributes[t].setNeedsUpdate(t,e);P(ND,this,`all`)}update({data:e,numInstances:t,startIndices:n=null,transitions:r,props:i={},buffers:a={},context:o={}}){let s=!1;P(PD,this),this.stats&&this.stats.get(`Update Attributes`).timeStart();for(let r in this.attributes){let c=this.attributes[r],l=c.settings.accessor;c.startIndices=n,c.numInstances=t,i[r]&&N.removed(`props.${r}`,`data.attributes.${r}`)(),c.setExternalBuffer(a[r])||c.setBinaryValue(typeof l==`string`?a[l]:void 0,e.startIndices)||typeof l==`string`&&!a[l]&&c.setConstantValue(o,i[l])||c.needsUpdate()&&(s=!0,this._updateAttribute({attribute:c,numInstances:t,data:e,props:i,context:o})),this.needsRedraw=this.needsRedraw||c.needsRedraw()}s&&P(FD,this,t),this.stats&&(this.stats.get(`Update Attributes`).timeEnd(),s&&this.stats.get(`Attributes updated`).incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:t,transitions:r})}updateTransition(){let{attributeTransitionManager:e}=this,t=e.run();return this.needsRedraw=this.needsRedraw||t,t}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getBounds(e){let t=e.map(e=>this.attributes[e]?.getBounds());return this.mergeBoundsMemoized(t)}getChangedAttributes(e={clearChangedFlags:!1}){let{attributes:t,attributeTransitionManager:n}=this,r={...n.getAttributes()};for(let i in t){let a=t[i];a.needsRedraw(e)&&!n.hasAttribute(i)&&(r[i]=a)}return r}getBufferLayouts(e){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),e):Object.values(this.getAttributes()).map(t=>t.getBufferLayout(e))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(e,t,n={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),e,t,n):{bufferLayouts:this.getBufferLayouts(t),buffers:{},groupedAttributeIds:new Set}}_add(e,t){for(let n in e){let r=e[n],i={...r,id:n,size:r.isIndexed&&1||r.size||1,...t};this.attributes[n]=new Kw(this.device,i)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let e={};for(let t in this.attributes)this.attributes[t].getUpdateTriggers().forEach(n=>{e[n]||(e[n]=[]),e[n].push(t)});this.updateTriggers=e}_invalidateTrigger(e,t){let{attributes:n,updateTriggers:r}=this,i=r[e];return i&&i.forEach(e=>{let r=n[e];r&&r.setNeedsUpdate(r.id,t)}),i}_updateAttribute(e){let{attribute:t,numInstances:n}=e;if(P(ID,t),t.constant){t.setConstantValue(e.context,t.value);return}t.allocate(n)&&P(LD,t,n),t.updateBuffer(e)&&(this.needsRedraw=!0,P(RD,t,n))}},BD=class extends Hy{get value(){return this._value}_onUpdate(){let{time:e,settings:{fromValue:t,toValue:n,duration:r,easing:i}}=this;this._value=Nl(t,n,i(e/r))}},VD=1e-5;function HD(e,t,n,r,i){let a=t-e;return(n-t)*i+-a*r+a+t}function UD(e,t,n,r,i){if(Array.isArray(n)){let a=[];for(let o=0;o<n.length;o++)a[o]=HD(e[o],t[o],n[o],r,i);return a}return HD(e,t,n,r,i)}function WD(e,t){if(Array.isArray(e)){let n=0;for(let r=0;r<e.length;r++){let i=e[r]-t[r];n+=i*i}return Math.sqrt(n)}return Math.abs(e-t)}var GD={interpolation:BD,spring:class extends Hy{get value(){return this._currValue}_onUpdate(){let{fromValue:e,toValue:t,damping:n,stiffness:r}=this.settings,{_prevValue:i=e,_currValue:a=e}=this,o=UD(i,a,t,n,r),s=WD(o,t),c=WD(o,a);s<VD&&c<VD&&(o=t,this.end()),this._prevValue=a,this._currValue=o}}},KD=class{constructor(e){this.transitions=new Map,this.timeline=e}get active(){return this.transitions.size>0}add(e,t,n,r){let{transitions:i}=this;if(i.has(e)){let n=i.get(e),{value:r=n.settings.fromValue}=n;t=r,this.remove(e)}if(r=Gw(r),!r)return;let a=GD[r.type];if(!a){N.error(`unsupported transition type '${r.type}'`)();return}let o=new a(this.timeline);o.start({...r,fromValue:t,toValue:n}),i.set(e,o)}remove(e){let{transitions:t}=this;t.has(e)&&(t.get(e).cancel(),t.delete(e))}update(){let e={};for(let[t,n]of this.transitions)n.update(),e[t]=n.value,n.inProgress||this.remove(t);return e}clear(){for(let e of this.transitions.keys())this.remove(e)}};function qD(e){let t=e[hy];for(let n in t){let r=t[n],{validate:i}=r;if(i&&!i(e[n],r))throw Error(`Invalid prop ${n}: ${e[n]}`)}}function JD(e,t){let n=XD({newProps:e,oldProps:t,propTypes:e[hy],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),r=QD(e,t),i=!1;return r||(i=$D(e,t)),{dataChanged:r,propsChanged:n,updateTriggersChanged:i,extensionsChanged:eO(e,t),transitionsChanged:YD(e,t)}}function YD(e,t){if(!e.transitions)return!1;let n={},r=e[hy],i=!1;for(let a in e.transitions){let o=r[a],s=o&&o.type;(s===`number`||s===`color`||s===`array`)&&ZD(e[a],t[a],o)&&(n[a]=!0,i=!0)}return i?n:!1}function XD({newProps:e,oldProps:t,ignoreProps:n={},propTypes:r={},triggerName:i=`props`}){if(t===e)return!1;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return`${i} changed shallowly`;for(let a of Object.keys(e))if(!(a in n)){if(!(a in t))return`${i}.${a} added`;let n=ZD(e[a],t[a],r[a]);if(n)return`${i}.${a} ${n}`}for(let a of Object.keys(t))if(!(a in n)){if(!(a in e))return`${i}.${a} dropped`;if(!Object.hasOwnProperty.call(e,a)){let n=ZD(e[a],t[a],r[a]);if(n)return`${i}.${a} ${n}`}}return!1}function ZD(e,t,n){let r=n&&n.equal;return r&&!r(e,t,n)||!r&&(r=e&&t&&e.equals,r&&!r.call(e,t))?`changed deeply`:!r&&t!==e?`changed shallowly`:null}function QD(e,t){if(t===null)return`oldProps is null, initial diff`;let n=!1,{dataComparator:r,_dataDiff:i}=e;return r?r(e.data,t.data)||(n=`Data comparator detected a change`):e.data!==t.data&&(n=`A new data container was supplied`),n&&i&&(n=i(e.data,t.data)||n),n}function $D(e,t){if(t===null||`all`in e.updateTriggers&&tO(e,t,`all`))return{all:!0};let n={},r=!1;for(let i in e.updateTriggers)i!==`all`&&tO(e,t,i)&&(n[i]=!0,r=!0);return r?n:!1}function eO(e,t){if(t===null)return!0;let n=t.extensions,{extensions:r}=e;if(r===n)return!1;if(!n||!r||r.length!==n.length)return!0;for(let e=0;e<r.length;e++)if(!r[e].equals(n[e]))return!0;return!1}function tO(e,t,n){let r=e.updateTriggers[n];r??={};let i=t.updateTriggers[n];return i??={},XD({oldProps:i,newProps:r,triggerName:n})}var nO=`count(): argument not an object`,rO=`count(): argument not a container`;function iO(e){if(!oO(e))throw Error(nO);if(typeof e.count==`function`)return e.count();if(Number.isFinite(e.size))return e.size;if(Number.isFinite(e.length))return e.length;if(aO(e))return Object.keys(e).length;throw Error(rO)}function aO(e){return typeof e==`object`&&!!e&&e.constructor===Object}function oO(e){return typeof e==`object`&&!!e}function sO(e,t){if(!t)return e;let n={...e,...t};if(`defines`in t&&(n.defines={...e.defines,...t.defines}),`modules`in t&&(n.modules=(e.modules||[]).concat(t.modules),t.modules.some(e=>e.name===`project64`))){let e=n.modules.findIndex(e=>e.name===`project32`);e>=0&&n.modules.splice(e,1)}if(`inject`in t)if(!e.inject)n.inject=t.inject;else{let r={...e.inject};for(let e in t.inject)r[e]=(r[e]||``)+t.inject[e];n.inject=r}return n}var cO={minFilter:`linear`,mipmapFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},lO={};function uO(e,t,n,r){if(n instanceof j)return n;n.constructor&&n.constructor.name!==`Object`&&(n={data:n});let i=null;n.compressed&&(i={minFilter:`linear`,mipmapFilter:n.data.length>1?`nearest`:`linear`});let{width:a,height:o}=n.data,s=t.createTexture({...n,sampler:{...cO,...i,...r},mipLevels:t.getMipLevelCount(a,o)});return t.type===`webgl`?s.generateMipmapsWebGL():t.type===`webgpu`&&t.generateMipmapsWebGPU(s),lO[s.id]=e,s}function dO(e,t){!t||!(t instanceof j)||lO[t.id]===e&&(t.delete(),delete lO[t.id])}var fO={boolean:{validate(e,t){return!0},equal(e,t,n){return!!e==!!t}},number:{validate(e,t){return Number.isFinite(e)&&(!(`max`in t)||e<=t.max)&&(!(`min`in t)||e>=t.min)}},color:{validate(e,t){return t.optional&&!e||gO(e)&&(e.length===3||e.length===4)},equal(e,t,n){return G(e,t,1)}},accessor:{validate(e,t){let n=_O(e);return n===`function`||n===_O(t.value)},equal(e,t,n){return typeof t==`function`?!0:G(e,t,1)}},array:{validate(e,t){return t.optional&&!e||gO(e)},equal(e,t,n){let{compare:r}=n;return r?G(e,t,Number.isInteger(r)?r:r?1:0):e===t}},object:{equal(e,t,n){if(n.ignore)return!0;let{compare:r}=n;return r?G(e,t,Number.isInteger(r)?r:r?1:0):e===t}},function:{validate(e,t){return t.optional&&!e||typeof e==`function`},equal(e,t,n){return!n.compare&&n.ignore!==!1||e===t}},data:{transform:(e,t,n)=>{if(!e)return e;let{dataTransform:r}=n.props;return r?r(e):typeof e.shape==`string`&&e.shape.endsWith(`-table`)&&Array.isArray(e.data)?e.data:e}},image:{transform:(e,t,n)=>{let r=n.context;return!r||!r.device?null:uO(n.id,r.device,e,{...t.parameters,...n.props.textureParameters})},release:(e,t,n)=>{dO(n.id,e)}}};function pO(e){let t={},n={},r={};for(let[i,a]of Object.entries(e)){let e=a?.deprecatedFor;if(e)r[i]=Array.isArray(e)?e:[e];else{let e=mO(i,a);t[i]=e,n[i]=e.value}}return{propTypes:t,defaultProps:n,deprecatedProps:r}}function mO(e,t){switch(_O(t)){case`object`:return hO(e,t);case`array`:return hO(e,{type:`array`,value:t,compare:!1});case`boolean`:return hO(e,{type:`boolean`,value:t});case`number`:return hO(e,{type:`number`,value:t});case`function`:return hO(e,{type:`function`,value:t,compare:!0});default:return{name:e,type:`unknown`,value:t}}}function hO(e,t){return`type`in t?{name:e,...fO[t.type],...t}:`value`in t?{name:e,type:_O(t.value),...t}:{name:e,type:`object`,value:t}}function gO(e){return Array.isArray(e)||ArrayBuffer.isView(e)}function _O(e){return gO(e)?`array`:e===null?`null`:typeof e}function vO(e,t){let n;for(let e=t.length-1;e>=0;e--){let r=t[e];`extensions`in r&&(n=r.extensions)}let r=bO(e.constructor,n),i=Object.create(r);i[my]=e,i[vy]={},i[yy]={};for(let e=0;e<t.length;++e){let n=t[e];for(let e in n)i[e]=n[e]}return Object.freeze(i),i}var yO=`_mergedDefaultProps`;function bO(e,t){if(!(e instanceof AO.constructor))return{};let n=yO;if(t)for(let e of t){let t=e.constructor;t&&(n+=`:${t.extensionName||t.name}`)}return DO(e,n)||(e[n]=xO(e,t||[]))}function xO(e,t){if(!e.prototype)return null;let n=bO(Object.getPrototypeOf(e)),r=pO(DO(e,`defaultProps`)||{}),i=Object.assign(Object.create(null),n,r.defaultProps),a=Object.assign(Object.create(null),n?.[hy],r.propTypes),o=Object.assign(Object.create(null),n?.[gy],r.deprecatedProps);for(let e of t){let t=bO(e.constructor);t&&(Object.assign(i,t),Object.assign(a,t[hy]),Object.assign(o,t[gy]))}return SO(i,e),wO(i,a),CO(i,o),i[hy]=a,i[gy]=o,t.length===0&&!EO(e,`_propTypes`)&&(e._propTypes=a),i}function SO(e,t){let n=OO(t);Object.defineProperties(e,{id:{writable:!0,value:n}})}function CO(e,t){for(let n in t)Object.defineProperty(e,n,{enumerable:!1,set(e){let r=`${this.id}: ${n}`;for(let r of t[n])EO(this,r)||(this[r]=e);N.deprecated(r,t[n].join(`/`))()}})}function wO(e,t){let n={},r={};for(let e in t){let i=t[e],{name:a,value:o}=i;i.async&&(n[a]=o,r[a]=TO(a))}e[_y]=n,e[vy]={},Object.defineProperties(e,r)}function TO(e){return{enumerable:!0,set(t){typeof t==`string`||t instanceof Promise||zw(t)?this[vy][e]=t:this[yy][e]=t},get(){if(this[yy]){if(e in this[yy])return this[yy][e]||this[_y][e];if(e in this[vy]){let t=this[my]&&this[my].internalState;if(t&&t.hasAsyncProp(e))return t.getAsyncProp(e)||this[_y][e]}}return this[_y][e]}}}function EO(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function DO(e,t){return EO(e,t)&&e[t]}function OO(e){let t=e.componentName;return t||N.warn(`${e.name}.componentName not specified`)(),t||e.name}var kO=0,AO=class{constructor(...e){this.props=vO(this,e),this.id=this.props.id,this.count=kO++}clone(e){let{props:t}=this,n={};for(let e in t[_y])e in t[yy]?n[e]=t[yy][e]:e in t[vy]&&(n[e]=t[vy][e]);return new this.constructor({...t,...n,...e})}};AO.componentName=`Component`,AO.defaultProps={};var jO=Object.freeze({}),MO=class{constructor(e){this.component=e,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let e in this.asyncProps){let t=this.asyncProps[e];t&&t.type&&t.type.release&&t.type.release(t.resolvedValue,t.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||jO}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(e){return e in this.asyncProps}getAsyncProp(e){let t=this.asyncProps[e];return t&&t.resolvedValue}isAsyncPropLoading(e){if(e){let t=this.asyncProps[e];return!!(t&&t.pendingLoadCount>0&&t.pendingLoadCount!==t.resolvedLoadCount)}for(let e in this.asyncProps)if(this.isAsyncPropLoading(e))return!0;return!1}reloadAsyncProp(e,t){this._watchPromise(e,Promise.resolve(t))}setAsyncProps(e){this.component=e[my]||this.component;let t=e[yy]||{},n=e[vy]||e,r=e[_y]||{};for(let e in t){let n=t[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,n),t[e]=this.getAsyncProp(e)}for(let e in n){let t=n[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,t)}}_fetch(e,t){return null}_onResolve(e,t){}_onError(e,t){}_updateAsyncProp(e,t){if(this._didAsyncInputValueChange(e,t)){if(typeof t==`string`&&(t=this._fetch(e,t)),t instanceof Promise){this._watchPromise(e,t);return}if(zw(t)){this._resolveAsyncIterable(e,t);return}this._setPropValue(e,t)}}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps){this.oldAsyncProps=Object.create(this.oldProps);for(let e in this.asyncProps)Object.defineProperty(this.oldAsyncProps,e,{enumerable:!0,value:this.oldProps[e]})}}_didAsyncInputValueChange(e,t){let n=this.asyncProps[e];return t===n.resolvedValue||t===n.lastValue?!1:(n.lastValue=t,!0)}_setPropValue(e,t){this._freezeAsyncOldProps();let n=this.asyncProps[e];n&&(t=this._postProcessValue(n,t),n.resolvedValue=t,n.pendingLoadCount++,n.resolvedLoadCount=n.pendingLoadCount)}_setAsyncPropValue(e,t,n){let r=this.asyncProps[e];r&&n>=r.resolvedLoadCount&&t!==void 0&&(this._freezeAsyncOldProps(),r.resolvedValue=t,r.resolvedLoadCount=n,this.onAsyncPropUpdated(e,t))}_watchPromise(e,t){let n=this.asyncProps[e];if(n){n.pendingLoadCount++;let r=n.pendingLoadCount;t.then(t=>{this.component&&(t=this._postProcessValue(n,t),this._setAsyncPropValue(e,t,r),this._onResolve(e,t))}).catch(t=>{this._onError(e,t)})}}async _resolveAsyncIterable(e,t){if(e!==`data`){this._setPropValue(e,t);return}let n=this.asyncProps[e];if(!n)return;n.pendingLoadCount++;let r=n.pendingLoadCount,i=[],a=0;for await(let n of t){if(!this.component)return;let{dataTransform:t}=this.component.props;i=t?t(n,i):i.concat(n),Object.defineProperty(i,`__diff`,{enumerable:!1,value:[{startRow:a,endRow:i.length}]}),a=i.length,this._setAsyncPropValue(e,i,r)}this._onResolve(e,i)}_postProcessValue(e,t){let n=e.type;return n&&this.component&&(n.release&&n.release(e.resolvedValue,n,this.component),n.transform)?n.transform(t,n,this.component):t}_createAsyncPropData(e,t){if(!this.asyncProps[e]){let n=this.component&&this.component.props[hy];this.asyncProps[e]={type:n&&n[e],lastValue:null,resolvedValue:t,pendingLoadCount:0,resolvedLoadCount:0}}}},NO=class extends MO{constructor({attributeManager:e,layer:t}){super(t),this.attributeManager=e,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}_fetch(e,t){let n=this.layer,r=n?.props.fetch;return r?r(t,{propName:e,layer:n}):super._fetch(e,t)}_onResolve(e,t){let n=this.layer;if(n){let r=n.props.onDataLoad;e===`data`&&r&&r(t,{propName:e,layer:n})}}_onError(e,t){let n=this.layer;n&&n.raiseError(t,`loading ${e} of ${this.layer}`)}},PO=`layer.changeFlag`,FO=`layer.initialize`,IO=`layer.update`,LO=`layer.finalize`,RO=`layer.matched`,zO=2**24-1,BO=Object.freeze([]),VO=Ff(({oldViewport:e,viewport:t})=>e.equals(t)),HO=new Uint8ClampedArray;function UO(e){return e.rowIndexes||e.pickingColors||e.instancePickingColors}function WO(e){return e.rowIndexes}function GO(e){return e.pickingColors||e.instancePickingColors}var KO={data:{type:`data`,value:BO,async:!0},dataComparator:{type:`function`,value:null,optional:!0},_dataDiff:{type:`function`,value:e=>e&&e.__diff,optional:!0},dataTransform:{type:`function`,value:null,optional:!0},onDataLoad:{type:`function`,value:null,optional:!0},onError:{type:`function`,value:null,optional:!0},fetch:{type:`function`,value:(e,{propName:t,layer:n,loaders:r,loadOptions:i,signal:a})=>{let{resourceManager:o}=n.context;i||=n.getLoadOptions(),r||=n.props.loaders,a&&(i={...i,core:{...i?.core,fetch:{...i?.core?.fetch,signal:a}}});let s=o.contains(e);return!s&&!i&&(o.add({resourceId:e,data:xi(e,r),persistent:!1}),s=!0),s?o.subscribe({resourceId:e,onChange:e=>n.internalState?.reloadAsyncProp(t,e),consumerId:n.id,requestId:t}):xi(e,r,i)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:`number`,min:0,max:1,value:1},operation:`draw`,onHover:{type:`function`,value:null,optional:!0},onClick:{type:`function`,value:null,optional:!0},onDragStart:{type:`function`,value:null,optional:!0},onDrag:{type:`function`,value:null,optional:!0},onDragEnd:{type:`function`,value:null,optional:!0},coordinateSystem:`default`,coordinateOrigin:{type:`array`,value:[0,0,0],compare:!0},modelMatrix:{type:`array`,value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:`XYZ`,colorFormat:`RGBA`,parameters:{type:`object`,value:{},optional:!0,compare:2},loadOptions:{type:`object`,value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:`array`,value:[],optional:!0,ignore:!0},getPolygonOffset:{type:`function`,value:({layerIndex:e})=>[0,-e*100]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:`accessor`,value:[0,0,128,128]}},qO=class extends AO{constructor(){super(...arguments),this.internalState=null,this.lifecycle=py.NO_STATE,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,`layerName`)?this.layerName:``}get root(){let e=this;for(;e.parent;)e=e.parent;return e}toString(){return`${this.constructor.layerName||this.constructor.name}({id: '${this.props.id}'})`}project(e){K(this.internalState);let t=this.internalState.viewport||this.context.viewport,[n,r,i]=Lp(th(e,{viewport:t,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem}),t.pixelProjectionMatrix);return e.length===2?[n,r]:[n,r,i]}unproject(e){return K(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(e)}projectPosition(e,t){return K(this.internalState),nh(e,{viewport:this.internalState.viewport||this.context.viewport,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem,...t})}get isComposite(){return!1}get isDrawable(){return!0}setState(e){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,e),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return this.internalState?!this.internalState.isAsyncPropLoading():!1}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let e=this.state;return e&&(e.models||e.model&&[e.model])||[]}setShaderModuleProps(...e){for(let t of this.getModels())t.shaderInputs.setProps(...e)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}use64bitPositions(){let{coordinateSystem:e}=this.props;return e===`default`||e===`lnglat`||e===`cartesian`}onHover(e,t){return this.props.onHover&&this.props.onHover(e,t)||!1}onClick(e,t){return this.props.onClick&&this.props.onClick(e,t)||!1}nullPickingColor(){return[0,0,0]}encodePickingColor(e,t=[]){return t[0]=e+1&255,t[1]=e+1>>8&255,t[2]=e+1>>8>>8&255,t}decodePickingColor(e){K(e instanceof Uint8Array);let[t,n,r]=e;return t+n*256+r*65536-1}getNumInstances(){return Number.isFinite(this.props.numInstances)?this.props.numInstances:this.state&&this.state.numInstances!==void 0?this.state.numInstances:iO(this.props.data)}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds([`positions`,`instancePositions`])}getShaders(e){e=sO(e,{disableWarnings:!0,modules:this.context.defaultShaderModules});for(let t of this.props.extensions)e=sO(e,t.getShaders.call(this,t));return{...e,shaderAssembler:this.context.shaderAssembler}}shouldUpdateState(e){return e.changeFlags.propsOrDataChanged}updateState(e){let t=this.getAttributeManager(),{dataChanged:n}=e.changeFlags;if(n&&t)if(Array.isArray(n))for(let e of n)t.invalidateAll(e);else t.invalidateAll();if(t){let{props:n}=e,r=this.internalState.hasPickingBuffer,i=Number.isInteger(n.highlightedObjectIndex)||!!n.pickable||n.extensions.some(e=>e.getNeedsPickingBuffer.call(this,e));if(r!==i){this.internalState.hasPickingBuffer=i;let e=UO(t.attributes);e&&(i&&e.constant&&(e.constant=!1,t.invalidate(e.id)),!e.value&&!i&&(e.constant=!0,e.value=WO(t.attributes)?[nm]:[0,0,0]))}}}finalizeState(e){for(let e of this.getModels())e.destroy();let t=this.getAttributeManager();t&&t.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(e){for(let t of this.getModels())t.draw(e.renderPass)}getPickingInfo({info:e,mode:t,sourceLayer:n}){let{index:r}=e;return r>=0&&Array.isArray(this.props.data)&&(e.object=this.props.data[r]),e}raiseError(e,t){t&&(e=Error(`${t}: ${e.message}`,{cause:e})),this.props.onError?.(e)||this.context?.onError?.(e,this)}getNeedsRedraw(e={clearRedrawFlags:!1}){return this._getNeedsRedraw(e)}needsUpdate(){return this.internalState?this.internalState.needsUpdate||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()):!1}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(e){if(!this.internalState)return;let t=this.internalState.viewport;this.internalState.viewport=e,(!t||!VO({oldViewport:t,viewport:e}))&&(this.setChangeFlags({viewportChanged:!0}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(e=`all`){let t=this.getAttributeManager();t&&(e===`all`?t.invalidateAll():t.invalidate(e))}updateAttributes(e){let t=!1;for(let n in e)e[n].layoutChanged()&&(t=!0);for(let n of this.getModels())this._setModelAttributes(n,e,t)}_updateAttributes(){let e=this.getAttributeManager();if(!e)return;let t=this.props,n=this.getNumInstances(),r=this.getStartIndices();e.update({data:t.data,numInstances:n,startIndices:r,props:t,transitions:t.transitions,buffers:t.data.attributes,context:this});let i=e.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(i)}_updateAttributeTransition(){let e=this.getAttributeManager();e&&e.updateTransition()}_updateUniformTransition(){let{uniformTransitions:e}=this.internalState;if(e.active){let t=e.update(),n=Object.create(this.props);for(let e in t)Object.defineProperty(n,e,{value:t[e]});return n}return this.props}calculateInstancePickingColors(e,{numInstances:t}){if(e.constant)return;let n=Math.floor(HO.length/4);this.internalState.usesPickingColorCache=!0;let r=t>0&&HO[0]===0;if(n<t||r){t>zO&&N.warn(`Layer has too many data objects. Picking might not be able to distinguish all objects.`)(),HO=Pm.allocate(HO,t,{size:4,copy:!0,maxCount:Math.max(t,zO)});let e=Math.floor(HO.length/4),i=[0,0,0],a=r?0:n;for(let t=a;t<e;t++)this.encodePickingColor(t,i),HO[t*4+0]=i[0],HO[t*4+1]=i[1],HO[t*4+2]=i[2],HO[t*4+3]=0}e.value=HO.subarray(0,t*4)}_setModelAttributes(e,t,r=!1){if(!Object.keys(t).length)return;let i=this.getAttributeManager();if(i?.hasBufferGroups()){this._setGroupedModelAttributes(e,i,t);return}if(r){let n=this.getAttributeManager();e.setBufferLayout(n.getBufferLayouts(e)),t=n.getAttributes()}let a=e.userData?.excludeAttributes||{},o={},s={};for(let r in t){if(a[r])continue;let i=t[r].getValue();for(let a in i){let c=i[a];c instanceof n?t[r].settings.isIndexed?e.setIndexBuffer(c):o[a]=c:c&&(s[a]=c)}}e.setAttributes(o),e.setConstantAttributes(s)}_setGroupedModelAttributes(e,t,r){let i=e.userData?.excludeAttributes||{},a=t.getBufferGroupBindings(r,e,i);e.setBufferLayout(a.bufferLayouts);let o={...a.buffers},s={},c=t.getAttributes();for(let t in c){if(i[t]||a.groupedAttributeIds.has(t))continue;let r=c[t],l=r.getValue();for(let t in l){let i=l[t];i instanceof n?r.settings.isIndexed?e.setIndexBuffer(i):o[t]=i:i&&(s[t]=i)}}e.setAttributes(o),e.setConstantAttributes(s)}disablePickingIndex(e){let t=this.props.data;if(!(`attributes`in t)){this._disablePickingIndex(e);return}let n=this.getAttributeManager().attributes,r=WO(n),i=GO(n),a=r&&t.attributes&&t.attributes[r.id];if(a&&a.value){let n=a.value;for(let i=0;i<t.length;i++)n[r.getVertexOffset(i)]===e&&this._disablePickingIndex(i);return}let o=i&&t.attributes&&t.attributes[i.id];if(o&&o.value){let n=o.value,r=this.encodePickingColor(e);for(let e=0;e<t.length;e++){let t=i.getVertexOffset(e);n[t]===r[0]&&n[t+1]===r[1]&&n[t+2]===r[2]&&this._disablePickingIndex(e)}}else this._disablePickingIndex(e)}_disablePickingIndex(e){let t=this.getAttributeManager().attributes,n=WO(t);if(n){let t=n.getVertexOffset(e),r=n.getVertexOffset(e+1),i=new Uint32Array(r-t);i.fill(nm),n.buffer.write(i,t*i.BYTES_PER_ELEMENT);return}let r=GO(t);if(!r){this.internalState&&rm(this.internalState.disabledPickingIndices,e);return}let i=r.getVertexOffset(e),a=r.getVertexOffset(e+1);r.buffer.write(new Uint8Array(a-i),i)}restorePickingColors(){let e=this.getAttributeManager().attributes,t=UO(e);if(!t){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let n=GO(e);this.internalState.usesPickingColorCache&&n&&n.value.buffer!==HO.buffer&&(n.value=HO.subarray(0,n.value.length)),t.updateSubBuffer({startOffset:0})}_initialize(){K(!this.internalState),P(FO,this);let e=this._getAttributeManager();this.internalState=new NO({attributeManager:e,layer:this}),this._clearChangeFlags(),this.state={},Object.defineProperty(this.state,`attributeManager`,{get:()=>(N.deprecated(`layer.state.attributeManager`,`layer.getAttributeManager()`)(),e)}),this.internalState.uniformTransitions=new KD(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context);for(let e of this.props.extensions)e.initializeState.call(this,this.context,e);this.setChangeFlags({dataChanged:`init`,propsChanged:`init`,viewportChanged:!0,extensionsChanged:!0}),this._update()}_transferState(e){P(RO,this,this===e);let{state:t,internalState:n}=e;this!==e&&(this.internalState=n,this.state=t,this.internalState.setAsyncProps(this.props),this._diffProps(this.props,this.internalState.getOldProps()))}_update(){let e=this.needsUpdate();if(P(IO,this,e),!e)return;this.context.stats.get(`Layer updates`).incrementCount();let t=this.props,n=this.context,r=this.internalState,i=n.viewport,a=this._updateUniformTransition();r.propsInTransition=a,n.viewport=r.viewport||i,this.props=a;try{let e=this._getUpdateParams(),t=this.getModels();if(n.device)this.updateState(e);else try{this.updateState(e)}catch{}for(let t of this.props.extensions)t.updateState.call(this,e,t);this.setNeedsRedraw(),this._updateAttributes();let r=this.getModels()[0]!==t[0];this._postUpdate(e,r)}finally{n.viewport=i,this.props=t,this._clearChangeFlags(),r.needsUpdate=!1,r.resetOldProps()}}_finalize(){P(LO,this),this.finalizeState(this.context);for(let e of this.props.extensions)e.finalizeState.call(this,this.context,e)}_drawLayer({renderPass:e,shaderModuleProps:t=null,uniforms:n={},parameters:r={}}){this._updateAttributeTransition();let i=this.props,a=this.context;this.props=this.internalState.propsInTransition||i;try{t&&this.setShaderModuleProps(t);let{getPolygonOffset:i}=this.props,o=i&&i(n)||[0,0];a.device instanceof xw&&a.device.setParametersWebGL({polygonOffset:o});let s=a.device instanceof xw?null:JO(r);if(YO(this.getModels(),e,r,s),a.device instanceof xw)a.device.withParametersWebGL(r,()=>{let i={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:r,context:a};for(let e of this.props.extensions)e.draw.call(this,i,e);this.draw(i)});else{s?.renderPassParameters&&e.setParameters(s.renderPassParameters);let i={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:r,context:a};for(let e of this.props.extensions)e.draw.call(this,i,e);this.draw(i)}}finally{this.props=i}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(e){if(!this.internalState)return;let{changeFlags:t}=this.internalState;for(let n in e)if(e[n]){let r=!1;switch(n){case`dataChanged`:let i=e[n],a=t[n];i&&Array.isArray(a)&&(t.dataChanged=Array.isArray(i)?a.concat(i):i,r=!0);default:t[n]||(t[n]=e[n],r=!0)}r&&P(PO,this,n,e)}let n=!!(t.dataChanged||t.updateTriggersChanged||t.propsChanged||t.extensionsChanged);t.propsOrDataChanged=n,t.somethingChanged=n||t.viewportChanged||t.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(e,t){let n=JD(e,t);if(n.updateTriggersChanged)for(let e in n.updateTriggersChanged)n.updateTriggersChanged[e]&&this.invalidateAttribute(e);if(n.transitionsChanged)for(let r in n.transitionsChanged)this.internalState.uniformTransitions.add(r,t[r],e[r],e.transitions?.[r]);return this.setChangeFlags(n)}validateProps(){qD(this.props)}updateAutoHighlight(e){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(e)}_updateAutoHighlight(e){let t={highlightedObjectColor:e.picked?e.color:null},{highlightColor:n}=this.props;e.picked&&typeof n==`function`&&(t.highlightColor=n(e)),this.setShaderModuleProps({picking:t}),this.setNeedsRedraw()}_getAttributeManager(){let e=this.context;return new zD(e.device,{id:this.props.id,stats:e.stats,timeline:e.timeline})}_postUpdate(e,t){let{props:n,oldProps:r}=e,i=this.state.model;i?.isInstanced&&i.setInstanceCount(this.getNumInstances());let{autoHighlight:a,highlightedObjectIndex:o,highlightColor:s}=n;if(t||r.autoHighlight!==a||r.highlightedObjectIndex!==o||r.highlightColor!==s){let e={};Array.isArray(s)&&(e.highlightColor=s),(t||r.autoHighlight!==a||o!==r.highlightedObjectIndex)&&(e.highlightedObjectColor=Number.isFinite(o)&&o>=0?this.encodePickingColor(o):null),this.setShaderModuleProps({picking:e})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(e){if(!this.internalState)return!1;let t=!1;t||=this.internalState.needsRedraw&&this.id;let n=this.getAttributeManager(),r=n?n.getNeedsRedraw(e):!1;if(t||=r,t)for(let e of this.props.extensions)e.onNeedsRedraw.call(this,e);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!e.clearRedrawFlags,t}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}};qO.defaultProps=KO,qO.layerName=`Layer`;function JO(e){let{blendConstant:t,...n}=e;return t?{pipelineParameters:n,renderPassParameters:{blendConstant:t}}:{pipelineParameters:n}}function YO(e,t,n,r){for(let i of e)i.device.type===`webgpu`?(XO(i,t),i.setParameters({...i.parameters,...r?.pipelineParameters})):i.setParameters(n)}function XO(e,t){let n=t.props.framebuffer||(t.framebuffer??null);if(!n)return;let r=n.colorAttachments.map(e=>e?.texture?.format??null),i=n.depthStencilAttachment?.texture?.format,a=e;(!ZO(a.props.colorAttachmentFormats,r)||a.props.depthStencilAttachmentFormat!==i)&&(a.props.colorAttachmentFormats=r,a.props.depthStencilAttachmentFormat=i,a._setPipelineNeedsUpdate(`attachment formats`))}function ZO(e,t){if(e===t)return!0;if(!e||!t||e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}var QO={name:`sketchEdge`,bindingLayout:[{name:`sketchEdge`,group:3}],source:`struct SketchEdgeUniforms { color: vec4<f32> }; @group(3) @binding(auto) var<uniform> sketchEdge: SketchEdgeUniforms;`,fs:`layout(std140) uniform sketchEdgeUniforms { vec4 color; } sketchEdge;`,uniformTypes:{color:`vec4<f32>`},defaultUniforms:{color:[.1,.1,.1,1]}},$O=class extends qO{static layerName=`SketchEdgeLayer`;static defaultProps={coordinateSystem:Af.METER_OFFSETS,getPolygonOffset:()=>[0,0],color:[35,31,29,255],style:{}};getAttributeManager(){return null}getNumInstances(){return this.props.segmentCount}initializeState({device:e}){let t=e.createBuffer({data:new Float32Array([0,-1,1,-1,0,1,0,1,1,-1,1,1])});try{let n=new Wv(e,{shaderAssembler:this.context.shaderAssembler,...this.getShaders({source:ek,vs:tk,fs:nk,modules:[$f,lm,r_,QO]}),id:`${this.id}-strokes`,topology:`triangle-list`,vertexCount:6,instanceCount:this.props.segmentCount,bufferLayout:[{name:`corner`,format:`float32x2`},{name:`segments`,stepMode:`instance`,byteStride:32,attributes:[{attribute:`startPosition`,format:`float32x3`,byteOffset:0},{attribute:`endPosition`,format:`float32x3`,byteOffset:12},{attribute:`featureIndex`,format:`float32`,byteOffset:24},{attribute:`seed`,format:`float32`,byteOffset:28}]}],attributes:{corner:t,segments:this.props.segments},parameters:{depthCompare:`less-equal`,depthWriteEnabled:!1,cullMode:`none`,blend:!0,blendColorSrcFactor:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`}});this.setState({model:n,corners:t})}catch(e){throw t.destroy(),e}}updateState({props:e,oldProps:t}){e.segments!==t.segments&&this.state.model.setAttributes({segments:e.segments}),this.state.model.setInstanceCount(e.segmentCount)}getModels(){return this.state.model?[this.state.model]:[]}draw({renderPass:e}){let t=this.props.color;this.state.model.shaderInputs.setProps({sketchStroke:this.props.style||{},sketchEdge:{color:[t[0]/255,t[1]/255,t[2]/255,(t[3]??255)/255*this.props.opacity]}}),this.state.model.draw(e)}finalizeState(e){this.state.model?.destroy(),this.state.corners?.destroy(),super.finalizeState(e)}},ek=`
struct StrokeVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) weightedCoordinates: vec3<f32>,
  @location(1) @interpolate(flat) metrics: vec2<f32>,
  @location(2) @interpolate(flat) pickingColor: vec3<f32>,
};
@vertex fn vertexMain(
  @location(0) corner: vec2<f32>, @location(1) startPosition: vec3<f32>,
  @location(2) endPosition: vec3<f32>, @location(3) featureIndex: f32, @location(4) seed: f32
) -> StrokeVertex {
  var start = project_position_to_clipspace(startPosition, vec3<f32>(0.0), vec3<f32>(0.0));
  var end = project_position_to_clipspace(endPosition, vec3<f32>(0.0), vec3<f32>(0.0));
  var output: StrokeVertex;
  output.position = vec4<f32>(0.0, 0.0, 2.0, 1.0);
  output.weightedCoordinates = vec3<f32>(0.0, 0.0, 1.0);
  output.metrics = vec2<f32>(0.0, seed);
  output.pickingColor = picking_getPickingColorFromIndex(u32(featureIndex));
  if (start.z < 0.0 && end.z < 0.0) { return output; }
  if (start.z < 0.0) { start = mix(start, end, -start.z / (end.z - start.z)); }
  if (end.z < 0.0) { end = mix(end, start, -end.z / (start.z - end.z)); }
  let viewport = project.viewportSize / project.devicePixelRatio;
  let delta = (end.xy / end.w - start.xy / start.w) * viewport * 0.5;
  let lengthPixels = length(delta);
  if (lengthPixels < 0.01 || min(start.w, end.w) <= 0.0) { return output; }
  let direction = delta / lengthPixels;
  let halfSpan = sketchStroke.width * 0.65 + sketchStroke.jitter * sketchStroke.sketch + 1.0;
  let extension = sketchStroke.extension + 1.0;
  let offset = direction * mix(-extension, extension, corner.x) + vec2<f32>(-direction.y, direction.x) * corner.y * halfSpan;
  var position = mix(start, end, corner.x);
  position = vec4<f32>(position.xy + offset * 2.0 / viewport * position.w, position.z - 0.00001 * position.w, position.w);
  output.position = position;
  let along = corner.x + mix(-extension, extension, corner.x) / lengthPixels;
  output.weightedCoordinates = vec3<f32>(vec2<f32>(along, corner.y * halfSpan) * position.w, position.w);
  output.metrics = vec2<f32>(lengthPixels, seed);
  return output;
}
@fragment fn fragmentMain(input: StrokeVertex) -> @location(0) vec4<f32> {
  let coordinates = input.weightedCoordinates.xy / input.weightedCoordinates.z;
  let coverage = sketchStroke_getCoverage(coordinates, input.metrics.x, input.metrics.y);
  if (coverage < 0.01 || input.metrics.x < 0.01) { discard; }
  if (picking.isActive > 0.5) {
    if (picking_isColorZero(input.pickingColor)) { discard; }
    return vec4<f32>(input.pickingColor, 1.0);
  }
  return vec4<f32>(sketchEdge.color.rgb, sketchEdge.color.a * coverage);
}
`,tk=`#version 300 es
in vec2 corner;
in vec3 startPosition;
in vec3 endPosition;
in float featureIndex;
in float seed;
out vec3 weightedCoordinates;
flat out vec2 metrics;
flat out vec3 pickingColor;
void main() {
  vec4 start = project_position_to_clipspace(startPosition, vec3(0.0), vec3(0.0));
  vec4 end = project_position_to_clipspace(endPosition, vec3(0.0), vec3(0.0));
  gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
  weightedCoordinates = vec3(0.0, 0.0, 1.0);
  metrics = vec2(0.0, seed);
  pickingColor = picking_getPickingColorFromIndex(featureIndex);
  float startDistance = start.z + start.w;
  float endDistance = end.z + end.w;
  if (startDistance < 0.0 && endDistance < 0.0) return;
  if (startDistance < 0.0) start = mix(start, end, -startDistance / (endDistance - startDistance));
  if (endDistance < 0.0) end = mix(end, start, -endDistance / ((start.z + start.w) - endDistance));
  vec2 viewport = project.viewportSize / project.devicePixelRatio;
  vec2 delta = (end.xy / end.w - start.xy / start.w) * viewport * 0.5;
  float lengthPixels = length(delta);
  if (lengthPixels < 0.01 || min(start.w, end.w) <= 0.0) return;
  vec2 direction = delta / lengthPixels;
  float halfSpan = sketchStroke.width * 0.65 + sketchStroke.jitter * sketchStroke.sketch + 1.0;
  float extension = sketchStroke.extension + 1.0;
  vec2 offset = direction * mix(-extension, extension, corner.x) + vec2(-direction.y, direction.x) * corner.y * halfSpan;
  vec4 position = mix(start, end, corner.x);
  position.xy += offset * 2.0 / viewport * position.w;
  position.z -= 0.00002 * position.w;
  gl_Position = position;
  float along = corner.x + mix(-extension, extension, corner.x) / lengthPixels;
  weightedCoordinates = vec3(vec2(along, corner.y * halfSpan) * position.w, position.w);
  metrics = vec2(lengthPixels, seed);
}
`,nk=`#version 300 es
precision highp float;
in vec3 weightedCoordinates;
flat in vec2 metrics;
flat in vec3 pickingColor;
out vec4 fragColor;
void main() {
  float coverage = sketchStroke_getCoverage(weightedCoordinates.xy / weightedCoordinates.z, metrics.x, metrics.y);
  if (coverage < 0.01 || metrics.x < 0.01) discard;
  if (picking.isActive > 0.5) {
    if (all(equal(pickingColor, vec3(0.0)))) discard;
    fragColor = vec4(pickingColor / 255.0, 1.0);
  } else {
    fragColor = vec4(sketchEdge.color.rgb, sketchEdge.color.a * coverage);
  }
}
`,rk=[-74.006,40.7128,0];function ik(){let e=[{name:`District`,kind:`ground`,center:[0,0,-3],size:[1050,1250,2],color:[.17,.23,.27]},{name:`River`,kind:`water`,center:[0,0,0],size:[170,1250,0],color:[.08,.39,.48]},{name:`North bridge`,kind:`bridge`,center:[0,275,8],size:[240,30,5],color:[.69,.76,.74]},{name:`South bridge`,kind:`bridge`,center:[0,-265,8],size:[240,30,5],color:[.69,.76,.74]}];for(let t of[-1,1])for(let n=0;n<8;n++)for(let r=0;r<3;r++){let i=[t*(122+r*135),n*135-470,0];if((n+r*2)%7==0)e.push({name:`Riverside garden ${e.length}`,kind:`park`,center:i,size:[78,85,1],color:[.25,.43,.35]});else{let a=25+(n*17+r*31+(t+1)*11)%100;e.push({name:`${t<0?`West`:`East`} ${n+1}.${r+1}`,kind:`building`,center:i,size:[65+r*5,72,a],color:r===0?[.83,.76,.61]:[.61,.71,.73]})}}return e}function ak(e,t=!1){let n=[];return e.forEach((e,r)=>{let[i,a,o]=e.center,[s,c,l]=e.size,u=i-s/2,d=i+s/2,f=a-c/2,p=a+c/2,m=o+l;h([[u,f,m],[d,f,m],[d,p,m],[u,p,m]],[0,0,1]),l>0&&(h([[u,f,o],[d,f,o],[d,f,m],[u,f,m]],[0,-1,0]),h([[d,f,o],[d,p,o],[d,p,m],[d,f,m]],[1,0,0]),h([[d,p,o],[u,p,o],[u,p,m],[d,p,m]],[0,1,0]),h([[u,p,o],[u,f,o],[u,f,m],[u,p,m]],[-1,0,0]));function h(i,a){let o=e.kind===`building`&&a[2]===0,u=Math.max(1,Math.round((a[0]?c:s)/27)),d=Math.max(1,Math.round(l/16)),f=[[0,0],[u,0],[u,d],[0,d]];for(let s of[0,1,2,0,2,3])n.push(...i[s],...a,...e.color,r),t&&n.push(...f[s],Number(o))}}),new Float32Array(n)}var ok=`core-features-and-limits`,sk=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function ck(e){let t={};for(let n of sk){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function lk(e){return e.featureLevel??`core`}function uk(e){let t=lk(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!==`default`&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function dk(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(ok)&&r.push(ok);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function fk(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(ok)?`core`:e===`best-available`?`compatibility`:e}function pk(e,t){return e===`core`?`core`:fk(`compatibility`,t)}var mk=new class extends To{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){return await this._create(e,!0)}async _create(t,n){if(typeof navigator>`u`||!navigator.gpu)throw Error(`WebGPU is not available`);let r=lk(t),i=uk(t),a;try{a=await this.requestGPUAdapter(i)}catch(e){throw Error(`WebGPU adapter request failed`,{cause:e})}if(!a)throw Error(`Failed to request WebGPU adapter`);let o=await hk(a),s={},c=dk(a.features,r,t.optionalFeatures);c.length>0&&(s.requiredFeatures=c);let l={...r===`max`?ck(a.limits):{},...t.requiredLimits};Object.keys(l).length>0&&(s.requiredLimits=l);let u;try{u=await a.requestDevice(s)}catch(e){throw Error(`WebGPU device request failed`,{cause:e})}let d=await gk(u);if(d){if(u.destroy(),n&&d.reason!==`destroyed`)return e.warn(`WebGPU device was returned already lost; retrying with a fresh adapter`)(),await this._create(t,!1);throw Error(`WebGPU device was returned already lost${d.message?`: ${d.message}`:``}`,{cause:d})}e.groupCollapsed(1,`WebGPUDevice created`)();try{let n;try{let{WebGPUDevice:e}=await lx(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-FiDOKuk_.js`);return{WebGPUDevice:e}},__vite__mapDeps([6,7,1,2,4,8])),i=fk(r,u.features),s={...t,featureLevel:i};n=new e(s,u,a,o);let c=e.getCanvasContextProps(s);c&&n.initializeCanvasContext(c)}catch(e){throw n?(n.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})):(u.destroy(),Error(`WebGPU wrapper initialization failed`,{cause:e}))}return e.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),e.table(1,n.info)(),n}finally{e.groupEnd(1)()}}async attach(e,t={}){let{WebGPUDevice:n}=await lx(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-FiDOKuk_.js`);return{WebGPUDevice:e}},__vite__mapDeps([6,7,1,2,4,8]));if(e instanceof n)return e;if(!this.isDeviceHandle(e))throw Error(`Invalid GPUDevice`);let r=n.getDeviceFromHandle(e);if(r)return r;let i=await gk(e);if(i)throw Error(`WebGPU device is already lost`,{cause:i});let a=n.getDeviceFromHandle(e);if(a)return a;let o=e.adapterInfo||{},s=pk(t.featureLevel,e.features),c={...t,featureLevel:s,_handle:e},l=new n(c,e,null,o,!1),u=n.getCanvasContextProps(c);if(u)try{l.initializeCanvasContext(u)}catch(e){throw l.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})}return l}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}};async function hk(t){try{return t.info||await t.requestAdapterInfo?.()||{}}catch(t){return e.warn(`WebGPU adapter metadata is unavailable`,t)(),{}}}async function gk(e){return await Promise.race([e.lost,Promise.resolve(null)])}function _k(e){return{type:e,adapters:e===`webgpu`?[mk,px]:[px]}}function vk({device:e,deviceType:t=`webgpu`}){return e?{device:e}:{deviceProps:_k(t)}}var yk={maxPitch:85},bk={useByteColors:!1,lights:[{type:`ambient`,color:[1,1,1],intensity:.45},{type:`directional`,color:[1,1,1],direction:[.5,.3,-.8],intensity:1.6}]};function xk(e,t){let n=new Gv(e,{modules:[P_]}).createMaterial();n.setProps({pbrMaterial:{metallicRoughnessValues:[0,.8]}});try{let r=new Wv(e,{...t,material:n,defines:{...t.defines,HAS_NORMALS:!0,USE_LIGHTS:!0}});return r.shaderInputs.setProps({lighting:bk}),new ay({model:r,managedResources:[n]})}catch(e){throw n.destroy(),e}}function Sk(e,t,n){let r=Qf.getUniforms(n);`cameraPosition`in r&&e.model.shaderInputs.setProps({pbrProjection:{camera:r.cameraPosition}}),e.draw(t)}var Ck=`
fn shadeBuilding(input: CityVertex, windowCoverage: f32, baseColor: vec3f) -> vec3f {
  fragmentInputs.pbr_vPosition = input.commonPosition;
  fragmentInputs.pbr_vNormal = input.commonNormal;
  fragmentInputs.pbr_vUV0 = vec2f(0.0);
  fragmentInputs.pbr_vUV1 = vec2f(0.0);
  let color = pbr_filterColor(vec4f(baseColor, 1.0)).rgb;
  return riverfrontWindowReflection(color, input.commonNormal,
    pbrProjection.camera - input.commonPosition, vec3f(1.0), windowCoverage);
}
`,wk=`
  pbr_vPosition = project_position(position);
  pbr_vNormal = project_normal(normal);
  pbr_vUV0 = vec2(0.0);
  pbr_vUV1 = vec2(0.0);
`,Tk=`
vec4 shadeBuilding(vec3 facade, vec4 baseColor) {
  vec4 color = pbr_filterColor(baseColor);
  color.rgb = riverfrontWindowReflection(color.rgb, pbr_vNormal,
    pbrProjection.camera - pbr_vPosition, vec3(1.0), riverfrontWindowCoverage(facade));
  return color;
}
`,Ek={name:`riverfrontWindows`,source:`
fn riverfrontWindowCoverage(facade: vec3f) -> f32 {
  let edge = abs(fract(facade.xy) - vec2f(0.5));
  let width = clamp(fwidth(facade.xy), vec2f(0.001), vec2f(0.2));
  let pane = vec2f(1.0) - smoothstep(vec2f(0.32, 0.29) - width, vec2f(0.32, 0.29) + width, edge);
  return pane.x * pane.y * facade.z;
}

fn riverfrontWindowSunGlare(normal: vec3f, toCamera: vec3f, sunDirection: vec3f) -> f32 {
  let unitNormal = normalize(normal);
  let ray = reflect(-normalize(toCamera), unitNormal);
  let alignment = dot(ray.xy, sunDirection.xy) /
    max(length(ray.xy) * length(sunDirection.xy), 0.001);
  let elevationDelta = ray.z - sunDirection.z;
  // The stretched lobe approximates glare on vertically textured architectural glass.
  let glare = pow(max(alignment, 0.0), 14.0) * exp(-3.0 * elevationDelta * elevationDelta);
  let reflection = pow(max(dot(ray, sunDirection), 0.0), 96.0);
  return max(glare, reflection) * smoothstep(0.0, 0.35, dot(unitNormal, sunDirection));
}

fn riverfrontWindowReflection(
  surfaceColor: vec3f, normal: vec3f, toCamera: vec3f, skyLight: vec3f, coverage: f32
) -> vec3f {
  let view = normalize(toCamera);
  let unitNormal = normalize(normal);
  let ray = reflect(-view, unitNormal);
  let elevation = clamp(ray.z * 2.3 + 0.52, 0.0, 1.0);
  let sky = mix(vec3f(0.075, 0.16, 0.23), vec3f(0.53, 0.69, 0.85), elevation);
  let fresnel = pow(1.0 - clamp(abs(dot(view, unitNormal)), 0.0, 1.0), 4.0);
  let glass = (sky * (0.58 + 0.42 * fresnel) + vec3f(0.025, 0.047, 0.065)) * skyLight;
  return mix(surfaceColor, glass, coverage);
}
`,fs:`
float riverfrontWindowCoverage(vec3 facade) {
  vec2 edge = abs(fract(facade.xy) - vec2(0.5));
  vec2 width = clamp(fwidth(facade.xy), vec2(0.001), vec2(0.2));
  vec2 pane = vec2(1.0) - smoothstep(vec2(0.32, 0.29) - width, vec2(0.32, 0.29) + width, edge);
  return pane.x * pane.y * facade.z;
}

float riverfrontWindowSunGlare(vec3 normal, vec3 toCamera, vec3 sunDirection) {
  vec3 unitNormal = normalize(normal);
  vec3 ray = reflect(-normalize(toCamera), unitNormal);
  float alignment = dot(ray.xy, sunDirection.xy) /
    max(length(ray.xy) * length(sunDirection.xy), 0.001);
  float elevationDelta = ray.z - sunDirection.z;
  float glare = pow(max(alignment, 0.0), 14.0) * exp(-3.0 * elevationDelta * elevationDelta);
  float reflection = pow(max(dot(ray, sunDirection), 0.0), 96.0);
  return max(glare, reflection) * smoothstep(0.0, 0.35, dot(unitNormal, sunDirection));
}

vec3 riverfrontWindowReflection(
  vec3 surfaceColor, vec3 normal, vec3 toCamera, vec3 skyLight, float coverage
) {
  vec3 view = normalize(toCamera);
  vec3 unitNormal = normalize(normal);
  vec3 ray = reflect(-view, unitNormal);
  float elevation = clamp(ray.z * 2.3 + 0.52, 0.0, 1.0);
  vec3 sky = mix(vec3(0.075, 0.16, 0.23), vec3(0.53, 0.69, 0.85), elevation);
  float fresnel = pow(1.0 - clamp(abs(dot(view, unitNormal)), 0.0, 1.0), 4.0);
  vec3 glass = (sky * (0.58 + 0.42 * fresnel) + vec3(0.025, 0.047, 0.065)) * skyLight;
  return mix(surfaceColor, glass, coverage);
}
`},Dk=class extends qO{static layerName=`BuildingMeshLayer`;getAttributeManager(){return null}initializeState(){}updateState({props:e,oldProps:t}){if(this.state.meshNode&&e.features===t.features)return;this.destroyMesh();let n=ak(e.features,!0),r=this.context.device.createBuffer({data:n});try{let e=xk(this.context.device,{shaderAssembler:this.context.shaderAssembler,...this.getShaders({source:Ok,vs:kk,fs:Ak,modules:[$f,lm,P_,Ek]}),id:`${this.id}-mesh`,topology:`triangle-list`,vertexCount:n.length/13,bufferLayout:[{name:`vertices`,byteStride:52,attributes:[{attribute:`position`,format:`float32x3`,byteOffset:0},{attribute:`normal`,format:`float32x3`,byteOffset:12},{attribute:`color`,format:`float32x3`,byteOffset:24},{attribute:`featureIndex`,format:`float32`,byteOffset:36},{attribute:`facadeCoordinates`,format:`float32x3`,byteOffset:40}]}],attributes:{vertices:r},parameters:{depthCompare:`less-equal`,depthWriteEnabled:!0,cullMode:`none`}});this.setState({meshNode:e,vertices:r})}catch(e){throw r.destroy(),e}}getModels(){return this.state.meshNode?[this.state.meshNode.model]:[]}draw({renderPass:e}){this.state.meshNode&&Sk(this.state.meshNode,e,{viewport:this.context.viewport,coordinateSystem:this.props.coordinateSystem,coordinateOrigin:this.props.coordinateOrigin,modelMatrix:this.props.modelMatrix})}getPickingInfo({info:e}){return e.object=this.props.features[e.index],e}finalizeState(e){this.destroyMesh(),super.finalizeState(e)}destroyMesh(){this.state.meshNode?.destroy(),this.state.vertices?.destroy(),this.setState({meshNode:void 0,vertices:void 0})}},Ok=`
struct CityVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) @interpolate(flat) pickingColor: vec3<f32>,
  @location(3) commonPosition: vec3<f32>,
  @location(4) commonNormal: vec3<f32>,
  @location(5) facade: vec3f,
  @location(2) worldPosition: vec3<f32>,
};
@vertex fn vertexMain(
  @location(0) position: vec3<f32>, @location(1) normal: vec3<f32>,
  @location(2) color: vec3<f32>, @location(3) featureIndex: f32,
  @location(4) facadeCoordinates: vec3f
) -> CityVertex {
  var output: CityVertex;
  output.position = project_position_to_clipspace(position, vec3<f32>(0.0), vec3<f32>(0.0));
  output.color = color;
  output.facade = facadeCoordinates;
  output.commonPosition = project_position_vec3_f32(position);
  output.commonNormal = project_normal(normal);
  output.pickingColor = picking_getPickingColorFromIndex(u32(featureIndex));
  output.worldPosition = position;
  return output;
}
fn buildingMottleNoise(coordinate: vec2<f32>) -> f32 {
  let cell = floor(coordinate);
  var fraction = fract(coordinate);
  fraction = fraction * fraction * (vec2<f32>(3.0) - 2.0 * fraction);
  let first = fract(sin(dot(cell, vec2<f32>(127.1, 311.7))) * 43758.5453);
  let second = fract(sin(dot(cell + vec2<f32>(1.0, 0.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  let third = fract(sin(dot(cell + vec2<f32>(0.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  let fourth = fract(sin(dot(cell + vec2<f32>(1.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  return mix(mix(first, second, fraction.x), mix(third, fourth, fraction.x), fraction.y);
}
${Ck}
@fragment fn fragmentMain(input: CityVertex) -> @location(0) vec4<f32> {
  let windowCoverage = riverfrontWindowCoverage(input.facade);
  if (picking.isActive > 0.5) {
    if (picking_isColorZero(input.pickingColor)) { discard; }
    return vec4<f32>(input.pickingColor, 1.0);
  }
  let mottle = buildingMottleNoise(input.worldPosition.xy * 0.12) * 0.55 +
    buildingMottleNoise(input.worldPosition.xz * 0.12) * 0.25 +
    buildingMottleNoise(input.worldPosition.yz * 0.12) * 0.2;
  var color = shadeBuilding(input, windowCoverage, input.color * (0.84 + mottle * 0.22));
  if (picking.isHighlightActive > 0.5 && distance(input.pickingColor, picking_normalizeColor(picking.highlightedObjectColor)) < 0.00001) {
    color = mix(color, picking.highlightColor.rgb, picking.highlightColor.a);
  }
  return vec4<f32>(color, layer.opacity);
}
`,kk=`#version 300 es
in vec3 position;
in vec3 normal;
in vec3 color;
in float featureIndex;
in vec3 facadeCoordinates;
out vec3 facade;
out vec4 vertexColor;
out vec3 worldPosition;
void main() {
  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(featureIndex);
  gl_Position = project_position_to_clipspace(position, vec3(0.0), vec3(0.0));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  worldPosition = position;
  ${wk}
  facade = facadeCoordinates;
  vertexColor = vec4(color, layer.opacity);
  DECKGL_FILTER_COLOR(vertexColor, geometry);
}
`,Ak=`#version 300 es
precision highp float;
in vec4 vertexColor;
in vec3 facade;
in vec3 worldPosition;
out vec4 fragColor;
${Tk}
float buildingMottleNoise(vec2 coordinate) {
  vec2 cell = floor(coordinate);
  vec2 fraction = fract(coordinate);
  fraction = fraction * fraction * (3.0 - 2.0 * fraction);
  float first = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
  float second = fract(sin(dot(cell + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float third = fract(sin(dot(cell + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float fourth = fract(sin(dot(cell + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(first, second, fraction.x), mix(third, fourth, fraction.x), fraction.y);
}
void main() {
  float mottle = buildingMottleNoise(worldPosition.xy * 0.12) * 0.55 +
    buildingMottleNoise(worldPosition.xz * 0.12) * 0.25 +
    buildingMottleNoise(worldPosition.yz * 0.12) * 0.2;
  fragColor = shadeBuilding(facade, vec4(vertexColor.rgb * (0.84 + mottle * 0.22), vertexColor.a));
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;function jk(){return ik().map((e,t)=>({...e,id:t})).filter(e=>e.kind===`building`)}function Mk(e,t={}){let n=[];return e.forEach((e,r)=>{let i=ak([e]),a=new Float32Array(i.length/10*3);for(let e=0;e<i.length;e+=10)a.set(i.subarray(e,e+3),e/10*3);let o=sy(new dh({topology:`triangle-list`,attributes:{POSITION:a}}),t).indices.value;for(let t=0;t<o.length;t+=2){let i=o[t]*3,s=o[t+1]*3;n.push(...a.subarray(i,i+3),...a.subarray(s,s+3),r,e.id*37+t/2+1)}}),new Float32Array(n)}function Nk(e,t={}){let n=jk().map(e=>{let t=(e.color[0]+e.color[1]+e.color[2])/3;return{...e,color:[t*.96,t*.94,t*.9]}}),r=ik().filter(e=>e.kind!==`building`),i=`light`,a=y(i),o={angleThreshold:30},s=Mk(n,o),c,l,u=new Promise((e,t)=>{c=e,l=t}),d={frames:0,backend:``,error:``,selected:``,finalized:!1,edgeCount:s.length/8},f=null,p={width:3.1,jitter:.65,grain:.9,variation:.45,extension:5},m=!0,h=!1,g=!0,_=new Dw({parent:e,...vk(t),views:new xb({controller:!0}),initialViewState:{...yk,longitude:rk[0],latitude:rk[1],zoom:15.6,pitch:52,bearing:-28},layers:[],onDeviceInitialized:e=>{d.backend=e.type,f=e.createBuffer({id:`building-edges`,data:s})},onLoad:()=>{v(),c()},onAfterRender:()=>{d.frames++},onError:e=>{d.error=e.message,l(e)},onClick:e=>{d.selected=e.object?.name||``},getTooltip:e=>e.object?.name||null});function v(){_.setProps({layers:[new Dk({id:`surroundings`,features:a,data:a,visible:g,coordinateSystem:Af.METER_OFFSETS,coordinateOrigin:rk}),new Dk({id:`buildings`,features:n,data:n,pickable:!0,opacity:.34,visible:h,coordinateSystem:Af.METER_OFFSETS,coordinateOrigin:rk}),m&&f&&new $O({id:`sketch-edges`,segments:f,segmentCount:s.length/8,data:n,color:[48,44,40,255],style:p,visible:m,coordinateOrigin:rk,pickable:!0})]})}return{deck:_,features:n,diagnostics:d,ready:u,get segments(){return f},setStyle(e){p={...p,...e},v()},setEdgeOptions(e){if(o={...o,...e},!f)return;s=Mk(n,o),d.edgeCount=s.length/8;let t=f;f=t.device.createBuffer({id:`building-edges`,data:s}),v(),t.destroy()},setContextVisible(e){g=e,v()},setGroundTone(e){i!==e&&(i=e,a=y(i),v())},setEdgesVisible(e){m=e,v()},setFillsVisible(e){h=e,v()},rebuildLayers(){v()},finalize(){d.finalized||(d.finalized=!0,_.finalize(),f?.destroy(),f=null)}};function y(e){let t=e===`light`?[.78,.77,.73]:[.17,.23,.27];return r.map(e=>e.kind===`ground`?{...e,color:t}:e)}}var Pk=document.querySelector(`#scene`),Fk=document.querySelector(`#backend`);Fk.value=new URLSearchParams(location.search).get(`backend`)===`webgl`?`webgl`:`webgpu`;var $=Nk(Pk,{deviceType:Fk.value===`webgl`?`webgl`:`webgpu`});window.sketchScene=$,Fk.addEventListener(`change`,()=>{location.search=`?backend=${Fk.value}`});var Ik=document.querySelector(`#style`);Ik.addEventListener(`change`,()=>{$.setStyle({sketch:Ik.value===`sketch`?1:0})});for(let e of[`width`,`jitter`,`grain`,`extension`]){let t=document.querySelector(`#${e}`);t.addEventListener(`input`,()=>$.setStyle({[e]:Number(t.value)}))}var Lk=document.querySelector(`#edges`);Lk.addEventListener(`change`,()=>$.setEdgesVisible(Lk.checked));var Rk=document.querySelector(`#fills`);Rk.addEventListener(`change`,()=>$.setFillsVisible(Rk.checked));var zk=document.querySelector(`#context`);zk.addEventListener(`change`,()=>$.setContextVisible(zk.checked));var Bk=document.querySelector(`#ground`);Bk.addEventListener(`change`,()=>$.setGroundTone(Bk.value));var Vk=document.querySelector(`#edge-mode`);Vk.addEventListener(`change`,()=>{$.setEdgeOptions({includeCoplanarEdges:Vk.value===`triangles`}),Uk()});var Hk=document.querySelector(`#angle`);Hk.addEventListener(`input`,()=>{$.setEdgeOptions({angleThreshold:Number(Hk.value)}),Uk()});function Uk(){document.querySelector(`#edge-count`).textContent=`${$.features.length} buildings · ${$.diagnostics.edgeCount} edges`}$.ready.then(()=>{document.body.dataset.ready=`true`,Uk()}).catch(e=>{document.querySelector(`#status`).textContent=e.message}),window.addEventListener(`pagehide`,()=>$.finalize());export{Ao as a,Rg as i,nT as n,Vg as r,sT as t};