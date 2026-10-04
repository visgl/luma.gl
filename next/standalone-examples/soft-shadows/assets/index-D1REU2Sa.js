const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/webgl-device-CKEDq0FY.js","assets/webgl-device-C7sHKAr6.js","assets/buffer-layout-utils-DTWE1EXl.js","assets/shader-type-decoder-DyLPgL-D.js","assets/get-attribute-from-layouts-B8ajLWeI.js","assets/fence-DbPLgSmp.js","assets/array-utils-flat-B03VLymj.js","assets/webgl-vbsKKZUb.js","assets/expression-Cbtkm8lR.js","assets/compute-pipeline-BjeSh0HH.js","assets/buffer-transform-BmxKBUrl.js","assets/external-texture-DT-C7SG4.js","assets/webgpu-ClEapnhV.js","assets/webgpu-BImQ1bOl.js","assets/webgpu-device-BiCMWf4F.js"])))=>i.map(i=>d[i]);
import{_ as e,b as t,f as n,l as r,m as i,v as a}from"./shader-type-decoder-DyLPgL-D.js";import{g as o,h as s,m as c,u as l}from"./fence-DbPLgSmp.js";import{b as u,i as d,n as f,o as p,r as m,s as h,u as g,v as _}from"./expression-Cbtkm8lR.js";import{u as v}from"./buffer-layout-utils-DTWE1EXl.js";import{i as y,n as b,r as x,t as S}from"./webgl-device-C7sHKAr6.js";import{n as C,t as w}from"./buffer-transform-BmxKBUrl.js";import{a as T}from"./webgpu-BImQ1bOl.js";var E=Object.defineProperty,D=(e,t)=>{let n={};for(var r in e)E(n,r,{get:e[r],enumerable:!0});return t||E(n,Symbol.toStringTag,{value:`Module`}),n};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var O=`(max-width: 700px), (max-height: 500px) and (pointer: coarse)`,k=15e5;function A(e,t){let n=typeof e.matchMedia==`function`?e.matchMedia.bind(e):()=>({matches:!1}),r=n(`(pointer: coarse)`).matches,i=e.innerWidth||1,a=e.innerHeight||1;return{compactViewport:n(O).matches,handheld:r&&t.maxTouchPoints>0&&Math.min(i,a)<=700,coarsePointer:r,maxTouchPoints:t.maxTouchPoints||0,viewportWidth:i,viewportHeight:a,devicePixelRatio:e.devicePixelRatio||1}}function ee({devicePixelRatio:e,viewportHeight:t,viewportWidth:n,handheld:r}){let i=Math.max(n,1)*Math.max(t,1);if(!r)return!0;let a=Math.max(1,Math.min(2,Math.sqrt(k/i)));return e<=a?!0:a}function te(e,t){let n=t.handheld&&e.mobileMode===`reduced`;return{canvasPixelRatio:ee(t),intermediateTargetScale:n?.75:1,maximumSampleCount:n?2:4,preferFloatingPointColor:!n,maximumWorkerCount:n?1:2,maximumConcurrentLoadCount:n?2:4,maximumResidentRecordCount:n?25e4:1e6,simulationDimensionScale:n?.5:1,simulationIterationScale:n?.5:1}}function ne(e,t){return t.handheld&&e.mobileMode===`unsupported`?e.unsupportedReason||`This example does not support mobile devices.`:void 0}function re(e){switch(e){case`full`:return`Mobile`;case`reduced`:return`Mobile quality`;case`unsupported`:return`Desktop only`}}function ie(e,t,n){let r=ne(e,t);if(r)return{supported:!1,reason:r};let i=e.requirements;if(!i)return{supported:!0};if(!i.backends.some(e=>n.backends.includes(e)))return{supported:!1,reason:`This example requires ${pe(i.backends)}, but this browser does not expose a compatible graphics backend. Try a current browser on a capable device or use a desktop browser.`};let a=new Set(n.deviceFeatures),o=i.requiredDeviceFeatures?.find(e=>!a.has(e));if(o)return{supported:!1,reason:`This example requires the GPU feature “${o}”. Try a current browser on a capable device or use a desktop browser.`};let s=i.requiredDeviceLimits,c=n.deviceLimits;return s?.maxColorAttachments!==void 0&&(c?.maxColorAttachments??0)<s.maxColorAttachments?{supported:!1,reason:`This example requires ${s.maxColorAttachments} color attachments, but this GPU exposes only ${c?.maxColorAttachments??0}. Try a capable device or desktop browser.`}:s?.maxColorAttachmentBytesPerSample!==void 0&&(c?.maxColorAttachmentBytesPerSample??0)<s.maxColorAttachmentBytesPerSample?{supported:!1,reason:`This example requires ${s.maxColorAttachmentBytesPerSample} color-attachment bytes per sample, but this GPU exposes only ${c?.maxColorAttachmentBytesPerSample??0}. Try a capable device or desktop browser.`}:{supported:!0}}async function ae(){let e=document.documentElement,t=se(document),n=A(window,navigator),r=ie(t,n,{backends:await oe()}),i=te(t,n);e.dataset.lumaExampleId=t.id,e.dataset.lumaExampleMobileMode=t.mobileMode,e.dataset.lumaExampleQualityProfile=t.mobileProfile,e.dataset.lumaExampleState=r.supported?`loading`:`unsupported`,n.handheld&&typeof i.canvasPixelRatio==`number`&&Object.defineProperty(window,`devicePixelRatio`,{configurable:!0,value:i.canvasPixelRatio});let a=t=>{e.dataset.lumaExampleState!==`unsupported`&&(e.dataset.lumaExampleState=`failed`,ue(`failed`,fe(t)))},o=()=>{e.dataset.lumaExampleState===`loading`&&(e.dataset.lumaExampleState=`running`)};return window.addEventListener(`error`,e=>a(e.error||e.message)),window.addEventListener(`unhandledrejection`,e=>a(e.reason)),de(),n.handheld&&le(t.mobileMode),r.supported===!1?ue(`unsupported`,r.reason):ce(o),{supported:r.supported,reportFailed:a,reportRunning:o}}async function oe(){let e=[];if(`WebGL2RenderingContext`in window&&e.push(`webgl2`),`gpu`in navigator)try{let t=navigator.gpu;t&&await t.requestAdapter()&&e.push(`webgpu`)}catch{}return e}function se(e){let t=t=>e.querySelector(`meta[name="${t}"]`)?.content||void 0,n=t(`luma-example-mobile`),r=t(`luma-example-mobile-profile`),i=(t(`luma-example-backends`)||``).split(`,`).filter(Boolean);return{id:t(`luma-example-id`)||location.pathname,mobileMode:n||`reduced`,mobileProfile:r||`standard`,unsupportedReason:t(`luma-example-mobile-unsupported-reason`),requirements:i.length?{backends:i}:void 0}}function ce(e){let t=!1,n=()=>{if(t)return;let n=document.querySelector(`canvas`),i=n&&n.clientWidth>0&&n.clientHeight>0,a=[...document.body?.querySelectorAll(`*`)||[]].some(e=>{if(e instanceof HTMLScriptElement||e instanceof HTMLStyleElement||e.hasAttribute(`data-luma-example-mobile-badge`)||e.hasAttribute(`data-luma-example-status`))return!1;let t=e.getBoundingClientRect();return t.width>0&&t.height>0&&(e.textContent?.trim()||e.children.length)});(i||a)&&(t=!0,r.disconnect(),requestAnimationFrame(()=>requestAnimationFrame(e)))},r=new MutationObserver(n);r.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener(`load`,n,{once:!0})}function le(e){let t=document.createElement(`span`);t.dataset.lumaExampleMobileBadge=``,t.setAttribute(`aria-label`,`Mobile support: ${re(e)}`),t.style.cssText=`position:fixed;left:calc(8px + env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:2147483646;padding:4px 8px;border:1px solid #7dd3fc57;border-radius:999px;background:#020617dd;color:#bae6fd;font:700 11px/1.4 system-ui;pointer-events:none;`,t.textContent=re(e),document.body.append(t)}function ue(e,t){document.querySelector(`[data-luma-example-status]`)?.remove();let n=document.createElement(`div`);n.dataset.lumaExampleStatus=e,n.setAttribute(`role`,`alert`),n.style.cssText=`position:fixed;inset:16px;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;border:1px solid #475569;border-radius:12px;background:#020617ee;color:#e2e8f0;font:16px/1.5 system-ui;text-align:center;`;let r=document.createElement(`div`);r.style.maxWidth=`620px`;let i=document.createElement(`strong`);i.style.cssText=`display:block;font-size:20px;margin-bottom:8px;`,i.textContent=e===`unsupported`?`This example is not supported on this device.`:`This example could not start.`;let a=document.createElement(`span`);a.textContent=t,r.append(i,a),n.append(r),document.body.append(n)}function de(){let e=document.createElement(`style`);e.textContent=`
    @media (pointer: coarse) {
      button, select, input[type='button'], input[type='range'], [role='button'] { min-height: 44px; }
    }
    @media (pointer: coarse), (max-width: 700px), (max-height: 500px) {
      [data-panel], [class*='panel'], [class*='controls'] {
        max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      body { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
    }
  `,document.head.append(e)}function fe(e){return e instanceof Error?e.message:typeof e==`string`?e:`An unexpected error stopped the example.`}function pe(e){return e.map(e=>e===`webgpu`?`WebGPU`:`WebGL2`).join(` or `)}(await ae()).supported||document.querySelectorAll(`script[type="module"]:not([data-luma-example-support-bootstrap])`).forEach(e=>e.remove());function me(e,t){if(!e)throw Error(t||`loader assertion failed.`)}var j={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};j.self||j.window||j.global,j.window||j.self||j.global,j.global||j.self||j.window,j.document;var he=!!(typeof process!=`object`||String(process)!==`[object process]`||process.browser),ge=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);ge&&parseFloat(ge[1]);var _e=`v4.5.2`;function ve(){let e=new a({id:`loaders.gl`});return globalThis.loaders||={},globalThis.loaders.log=e,globalThis.loaders.version=_e,globalThis.probe||={},globalThis.probe.loaders=e,e}var ye=ve(),be=e=>typeof e==`boolean`,M=e=>typeof e==`function`,xe=e=>typeof e==`object`&&!!e,Se=e=>xe(e)&&e.constructor==={}.constructor,Ce=e=>typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer,we=e=>xe(e)&&typeof e.byteLength==`number`&&typeof e.slice==`function`,Te=e=>!!e&&M(e[Symbol.iterator]),Ee=e=>!!e&&M(e[Symbol.asyncIterator]),De=e=>typeof Response<`u`&&e instanceof Response||xe(e)&&M(e.arrayBuffer)&&M(e.text)&&M(e.json),Oe=e=>typeof Blob<`u`&&e instanceof Blob,ke=e=>typeof ReadableStream<`u`&&e instanceof ReadableStream||xe(e)&&M(e.tee)&&M(e.cancel)&&M(e.getReader),Ae=e=>xe(e)&&M(e.read)&&M(e.pipe)&&be(e.readable),je=e=>ke(e)||Ae(e);function Me(e,t){return Ne(e||{},t)}function Ne(e,t,n=0){if(n>3)return t;let r={...e};for(let[e,i]of Object.entries(t))i&&typeof i==`object`&&!Array.isArray(i)?r[e]=Ne(r[e]||{},t[e],n+1):r[e]=t[e];return r}var Pe=`latest`;function Fe(){return globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version=`4.5.2`),globalThis._loadersgl_.version}var Ie=Fe();function Le(e,t){if(!e)throw Error(t||`loaders.gl assertion failed.`)}var Re={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};Re.self||Re.window||Re.global,Re.window||Re.self||Re.global,Re.global||Re.self||Re.window,Re.document;var ze=typeof process!=`object`||String(process)!==`[object process]`||process.browser,Be=typeof window<`u`&&window.orientation!==void 0,Ve=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);Ve&&parseFloat(Ve[1]);var He=class{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t){this.workerThread.postMessage({source:`loaders.gl`,type:e,payload:t})}done(e){Le(this.isRunning),this.isRunning=!1,this._resolve(e)}error(e){Le(this.isRunning),this.isRunning=!1,this._reject(e)}},Ue=class{terminate(){}},We=new Map;function Ge(e){Le(e.source&&!e.url||!e.source&&e.url);let t=We.get(e.source||e.url);return t||(e.url&&(t=Ke(e.url),We.set(e.url,t)),e.source&&(t=qe(e.source),We.set(e.source,t))),Le(t),t}function Ke(e){return e.startsWith(`http`)?qe(Je(e)):e}function qe(e){let t=new Blob([e],{type:`application/javascript`});return URL.createObjectURL(t)}function Je(e){return`\
try {
  importScripts('${e}');
} catch (error) {
  console.error(error);
  throw error;
}`}function Ye(e,t=!0,n){let r=n||new Set;if(e){if(Xe(e))r.add(e);else if(Xe(e.buffer))r.add(e.buffer);else if(!ArrayBuffer.isView(e)&&t&&typeof e==`object`)for(let n in e)Ye(e[n],t,r)}return n===void 0?Array.from(r):[]}function Xe(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}var Ze=()=>{},Qe=class{name;source;url;terminated=!1;worker;onMessage;onError;_loadableURL=``;static isSupported(){return typeof Worker<`u`&&ze||Ue!==void 0&&!ze}constructor(e){let{name:t,source:n,url:r}=e;Le(n||r),this.name=t,this.source=n,this.url=r,this.onMessage=Ze,this.onError=e=>console.log(e),this.worker=ze?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=Ze,this.onError=Ze,this.worker.terminate(),this.terminated=!0}get isRunning(){return!!this.onMessage}postMessage(e,t){t||=Ye(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t=`Failed to load `;return t+=`worker ${this.name} from ${this.url}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){this._loadableURL=Ge({source:this.source,url:this.url});let e=new Worker(this._loadableURL,{name:this.name});return e.onmessage=e=>{e.data?this.onMessage(e.data):this.onError(Error(`No data received`))},e.onerror=e=>{this.onError(this._getErrorFromErrorEvent(e)),this.terminated=!0},e.onmessageerror=e=>console.error(e),e}_createNodeWorker(){let e;if(this.url)e=new Ue(this.url.includes(`:/`)||this.url.startsWith(`/`)?this.url:`./${this.url}`,{eval:!1,type:this.url.endsWith(`.ts`)||this.url.endsWith(`.mjs`)?`module`:`commonjs`});else if(this.source)e=new Ue(this.source,{eval:!0});else throw Error(`no worker`);return e.on(`message`,e=>{this.onMessage(e)}),e.on(`error`,e=>{this.onError(e)}),e.on(`exit`,e=>{}),e}},$e=class{name=`unnamed`;source;url;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];count=0;isDestroyed=!1;static isSupported(){return Qe.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.setProps(e)}destroy(){this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},e.name!==void 0&&(this.name=e.name),e.maxConcurrency!==void 0&&(this.maxConcurrency=e.maxConcurrency),e.maxMobileConcurrency!==void 0&&(this.maxMobileConcurrency=e.maxMobileConcurrency),e.reuseWorkers!==void 0&&(this.reuseWorkers=e.reuseWorkers),e.onDebug!==void 0&&(this.onDebug=e.onDebug)}async startJob(e,t=(e,t,n)=>e.done(n),n=(e,t)=>e.error(t)){let r=new Promise(r=>(this.jobQueue.push({name:e,onMessage:t,onError:n,onStart:r}),this));return this._startQueuedJob(),await r}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:`Starting job`,name:t.name,workerThread:e,backlog:this.jobQueue.length});let n=new He(t.name,e);e.onMessage=e=>t.onMessage(n,e.type,e.payload),e.onError=e=>t.onError(n,e),t.onStart(n);try{await n.result}catch(e){console.error(`Worker exception: ${e}`)}finally{this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){!ze||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.destroy(),this.count--):this.idleQueue.push(e),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){return this.idleQueue.length>0?this.idleQueue.shift()||null:this.count<this._getMaxConcurrency()?(this.count++,new Qe({name:`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`,source:this.source,url:this.url})):null}_getMaxConcurrency(){return Be?this.maxMobileConcurrency:this.maxConcurrency}},et={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}},tt=class e{props;workerPools=new Map;static _workerFarm;static isSupported(){return Qe.isSupported()}static getWorkerFarm(t={}){return e._workerFarm=e._workerFarm||new e({}),e._workerFarm.setProps(t),e._workerFarm}constructor(e){this.props={...et},this.setProps(e),this.workerPools=new Map}destroy(){for(let e of this.workerPools.values())e.destroy();this.workerPools=new Map}setProps(e){this.props={...this.props,...e};for(let e of this.workerPools.values())e.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:n,url:r}=e,i=this.workerPools.get(t);return i||(i=new $e({name:t,source:n,url:r}),i.setProps(this._getWorkerPoolProps()),this.workerPools.set(t,i)),i}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}};function nt(e,t={}){let n=t[e.id]||{},r=ze?e.workerFile||`${e.id}-worker.js`:`${e.id}-worker-node.js`,i=n.workerUrl;if(!i&&e.id===`compression`&&(i=t.workerUrl),(t._workerType||t?.core?._workerType)===`test`&&(i=ze?`modules/${e.module}/dist/${r}`:`modules/${e.module}/src/workers/${e.id}-worker-node.ts`),!i){let t=e.version;t===`latest`&&(t=Pe);let n=t?`@${t}`:``;i=`https://unpkg.com/@loaders.gl/${e.module}${n}/dist/${r}`}return Le(i),i}function rt(e,t=Ie){Le(e,`no worker provided`);let n=e.version;return!(!t||!n)}function it(e,t){if(!tt.isSupported())return!1;let n=t?._nodeWorkers??t?.core?._nodeWorkers;if(!ze&&!n)return!1;let r=t?.worker??t?.core?.worker;return!!(e.worker&&r)}async function at(e,t,n,r,i){let a=e.id,o=nt(e,n),s=tt.getWorkerFarm(n?.core).getWorkerPool({name:a,url:o});n=JSON.parse(JSON.stringify(n||{})),n._workerLoaderId=e.id,r=JSON.parse(JSON.stringify(r||{}));let c=await s.startJob(`process-on-worker`,ot.bind(null,i));return c.postMessage(`process`,{input:t,options:n,context:r}),await(await c.result).result}async function ot(e,t,n,r){switch(n){case`done`:t.done(r);break;case`error`:t.error(Error(r.error));break;case`process`:let{id:i,input:a,options:o}=r;try{let n=await e(a,o);t.postMessage(`done`,{id:i,result:n})}catch(e){let n=e instanceof Error?e.message:`unknown error`;t.postMessage(`error`,{id:i,error:n})}break;default:console.warn(`parse-with-worker unknown message ${n}`)}}function st(e,t,n){if(n||=e.byteLength,e.byteLength<n||t.byteLength<n)return!1;let r=new Uint8Array(e),i=new Uint8Array(t);for(let e=0;e<r.length;++e)if(r[e]!==i[e])return!1;return!0}function ct(...e){return lt(e)}function lt(e){let t=e.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),n=t.reduce((e,t)=>e+t.byteLength,0),r=new Uint8Array(n),i=0;for(let e of t)r.set(e,i),i+=e.byteLength;return r.buffer}async function ut(e){let t=[];for await(let n of e)t.push(dt(n));return ct(...t)}function dt(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:n,byteLength:r}=e;return ft(t,n,r)}return ft(e)}function ft(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}var pt=``,mt={};function ht(e){for(let t in mt)if(e.startsWith(t)){let n=mt[t];e=e.replace(t,n)}return!e.startsWith(`http://`)&&!e.startsWith(`https://`)&&(e=`${pt}${e}`),e}function gt(e){return e}function _t(e){return e&&typeof e==`object`&&e.isBuffer}function vt(e){if(_t(e))return gt(e);if(e instanceof ArrayBuffer)return e;if(Ce(e))return bt(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return e.byteOffset===0&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if(typeof e==`string`){let t=e;return new TextEncoder().encode(t).buffer}if(e&&typeof e==`object`&&e._toArrayBuffer)return e._toArrayBuffer();throw Error(`toArrayBuffer`)}function yt(e){if(e instanceof ArrayBuffer)return e;if(Ce(e))return bt(e);let{buffer:t,byteOffset:n,byteLength:r}=e;return t instanceof ArrayBuffer&&n===0&&r===t.byteLength?t:bt(t,n,r)}function bt(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function xt(e){return ArrayBuffer.isView(e)?e:new Uint8Array(e)}function St(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(t+1):e}function Ct(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(0,t):``}var wt=class extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response},Tt=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,Et=/^([-\w.]+\/[-\w.+]+)/;function Dt(e,t){return e.toLowerCase()===t.toLowerCase()}function Ot(e){let t=Et.exec(e);return t?t[1]:e}function kt(e){let t=Tt.exec(e);return t?t[1]:``}var At=/\?.*/;function jt(e){let t=e.match(At);return t&&t[0]}function Mt(e){return e.replace(At,``)}function Nt(e){if(e.length<50)return e;let t=e.slice(e.length-15);return`${e.substr(0,32)}...${t}`}function Pt(e){return De(e)?e.url:Oe(e)?(`name`in e?e.name:``)||``:typeof e==`string`?e:``}function Ft(e){if(De(e)){let t=e.headers.get(`content-type`)||``,n=Mt(e.url);return Ot(t)||kt(n)}return Oe(e)?e.type||``:typeof e==`string`?kt(e):``}function It(e){return De(e)?e.headers[`content-length`]||-1:Oe(e)?e.size:typeof e==`string`?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}async function Lt(e){if(De(e))return e;let t={},n=It(e);n>=0&&(t[`content-length`]=String(n));let r=Pt(e),i=Ft(e);i&&(t[`content-type`]=i);let a=await Bt(e);a&&(t[`x-first-bytes`]=a),typeof e==`string`&&(e=new TextEncoder().encode(e));let o=new Response(e,{headers:t});return Object.defineProperty(o,`url`,{value:r}),o}async function Rt(e){if(!e.ok)throw await zt(e)}async function zt(e){let t=Nt(e.url),n=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;n=n.length>100?`${n.slice(0,100)}...`:n;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get(`Content-Type`);r.reason=!e.bodyUsed&&t?.includes(`application/json`)?await e.json():await e.text()}catch{}return new wt(n,r)}async function Bt(e){if(typeof e==`string`)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let n=new FileReader;n.onload=t=>e(t?.target?.result),n.readAsDataURL(t)})}return e instanceof ArrayBuffer?`data:base64,${Vt(e.slice(0,5))}`:null}function Vt(e){let t=``,n=new Uint8Array(e);for(let e=0;e<n.byteLength;e++)t+=String.fromCharCode(n[e]);return btoa(t)}function Ht(e){return!Ut(e)&&!Wt(e)}function Ut(e){return e.startsWith(`http:`)||e.startsWith(`https:`)}function Wt(e){return e.startsWith(`data:`)}async function Gt(e,t){if(typeof e==`string`){let n=ht(e);return Ht(n)&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(n,t):await fetch(n,t)}return await Lt(e)}var Kt=new a({id:`loaders.gl`}),qt=class{log(){return()=>{}}info(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}},Jt={core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,log:new class{console;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,CDN:`https://unpkg.com/@loaders.gl`,worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:he,_nodeWorkers:!1,_workerType:``,limit:0,_limitMB:0,batchSize:`auto`,batchDebounceMs:0,metadata:!1,transforms:[]}},Yt={baseUri:`core.baseUrl`,fetch:`core.fetch`,mimeType:`core.mimeType`,fallbackMimeType:`core.fallbackMimeType`,ignoreRegisteredLoaders:`core.ignoreRegisteredLoaders`,nothrow:`core.nothrow`,log:`core.log`,useLocalLibraries:`core.useLocalLibraries`,CDN:`core.CDN`,worker:`core.worker`,maxConcurrency:`core.maxConcurrency`,maxMobileConcurrency:`core.maxMobileConcurrency`,reuseWorkers:`core.reuseWorkers`,_nodeWorkers:`core.nodeWorkers`,_workerType:`core._workerType`,_worker:`core._workerType`,limit:`core.limit`,_limitMB:`core._limitMB`,batchSize:`core.batchSize`,batchDebounceMs:`core.batchDebounceMs`,metadata:`core.metadata`,transforms:`core.transforms`,throws:`nothrow`,dataType:`(no longer used)`,uri:`core.baseUrl`,method:`core.fetch.method`,headers:`core.fetch.headers`,body:`core.fetch.body`,mode:`core.fetch.mode`,credentials:`core.fetch.credentials`,cache:`core.fetch.cache`,redirect:`core.fetch.redirect`,referrer:`core.fetch.referrer`,referrerPolicy:`core.fetch.referrerPolicy`,integrity:`core.fetch.integrity`,keepalive:`core.fetch.keepalive`,signal:`core.fetch.signal`},Xt=[`baseUrl`,`fetch`,`mimeType`,`fallbackMimeType`,`ignoreRegisteredLoaders`,`nothrow`,`log`,`useLocalLibraries`,`CDN`,`worker`,`maxConcurrency`,`maxMobileConcurrency`,`reuseWorkers`,`_nodeWorkers`,`_workerType`,`limit`,`_limitMB`,`batchSize`,`batchDebounceMs`,`metadata`,`transforms`];function Zt(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||={},e._state}function Qt(){let e=Zt();return e.globalOptions=e.globalOptions||{...Jt,core:{...Jt.core}},en(e.globalOptions)}function $t(e,t,n,r){return n||=[],n=Array.isArray(n)?n:[n],tn(e,n),en(an(t,e,r))}function en(e){let t=cn(e);ln(t);for(let e of Xt)t.core&&t.core[e]!==void 0&&delete t[e];return t.core&&t.core._workerType!==void 0&&delete t._worker,t}function tn(e,t){nn(e,null,Jt,Yt,t);for(let n of t){let r=e&&e[n.id]||{},i=n.options&&n.options[n.id]||{},a=n.deprecatedOptions&&n.deprecatedOptions[n.id]||{};nn(r,n.id,i,a,t)}}function nn(e,t,n,r,i){let a=t||`Top level`,o=t?`${t}.`:``;for(let s in e){let c=!t&&xe(e[s]),l=s===`baseUri`&&!t,u=s===`workerUrl`&&t;if(!(s in n)&&!l&&!u){if(s in r)Kt.level>0&&Kt.warn(`${a} loader option \'${o}${s}\' no longer supported, use \'${r[s]}\'`)();else if(!c&&Kt.level>0){let e=rn(s,i);Kt.warn(`${a} loader option \'${o}${s}\' not recognized. ${e}`)()}}}}function rn(e,t){let n=e.toLowerCase(),r=``;for(let i of t)for(let t in i.options){if(e===t)return`Did you mean \'${i.id}.${t}\'?`;let a=t.toLowerCase();(n.startsWith(a)||a.startsWith(n))&&(r||=`Did you mean \'${i.id}.${t}\'?`)}return r}function an(e,t,n){let r=e.options||{},i={...r};return r.core&&(i.core={...r.core}),ln(i),i.core?.log===null&&(i.core={...i.core,log:new qt}),on(i,en(Qt())),on(i,en(t)),sn(i,n),un(i),i}function on(e,t){for(let n in t)if(n in t){let r=t[n];Se(r)&&Se(e[n])?e[n]={...e[n],...t[n]}:e[n]=t[n]}}function sn(e,t){t&&e.core?.baseUrl===void 0&&(e.core||={},e.core.baseUrl=Ct(Mt(t)))}function cn(e){let t={...e};return e.core&&(t.core={...e.core}),t}function ln(e){e.baseUri!==void 0&&(e.core||={},e.core.baseUrl===void 0&&(e.core.baseUrl=e.baseUri));for(let t of Xt)if(e[t]!==void 0){let n=e.core=e.core||{};n[t]===void 0&&(n[t]=e[t])}let t=e._worker;t!==void 0&&(e.core||={},e.core._workerType===void 0&&(e.core._workerType=t))}function un(e){let t=e.core;if(t)for(let n of Xt)t[n]!==void 0&&(e[n]=t[n])}function dn(e){return e?(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions)):!1}function fn(e){me(e,`null loader`),me(dn(e),`invalid loader`);let t;return Array.isArray(e)&&(t=e[1],e=e[0],e={...e,options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}var pn=()=>{let e=Zt();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function mn(e){let t=pn();e=Array.isArray(e)?e:[e];for(let n of e){let e=fn(n);t.find(t=>e===t)||t.unshift(e)}}function hn(){return pn()}var gn=/\.([^.]+)$/;async function _n(e,t=[],n,r){if(!xn(e))return null;let i=en(n||{});if(i.core||={},e instanceof Response&&vn(e)){let n=yn(await e.clone().text(),t,{...i,core:{...i.core,nothrow:!0}},r);if(n)return n}let a=yn(e,t,{...i,core:{...i.core,nothrow:!0}},r);if(a)return a;if(Oe(e)&&(e=await e.slice(0,10).arrayBuffer(),a=yn(e,t,i,r)),!a&&e instanceof Response&&vn(e)&&(a=yn(await e.clone().text(),t,i,r)),!a&&!i.core.nothrow)throw Error(Sn(e));return a}function vn(e){let t=Ft(e);return!!(t&&(t.startsWith(`text/`)||t===`application/json`||t.endsWith(`+json`)))}function yn(e,t=[],n,r){if(!xn(e))return null;let i=en(n||{});if(i.core||={},t&&!Array.isArray(t))return fn(t);let a=[];t&&(a=a.concat(t)),i.core.ignoreRegisteredLoaders||a.push(...hn()),Cn(a);let o=bn(e,a,i,r);if(!o&&!i.core.nothrow)throw Error(Sn(e));return o}function bn(e,t,n,r){let i=Pt(e),a=Ft(e),o=Mt(i)||r?.url,s=null,c=``;return n?.core?.mimeType&&(s=En(t,n?.core?.mimeType),c=`match forced by supplied MIME type ${n?.core?.mimeType}`),s||=wn(t,o),c||=s?`matched url ${o}`:``,s||=En(t,a),c||=s?`matched MIME type ${a}`:``,s||=Dn(t,e),c||=s?`matched initial data ${jn(e)}`:``,n?.core?.fallbackMimeType&&(s||=En(t,n?.core?.fallbackMimeType),c||=s?`matched fallback MIME type ${a}`:``),c&&ye.log(1,`selectLoader selected ${s?.name}: ${c}.`),s}function xn(e){return!(e instanceof Response&&e.status===204)}function Sn(e){let t=Pt(e),n=Ft(e),r=`No valid loader found (`;r+=t?`${St(t)}, `:`no url provided, `,r+=`MIME type: ${n?`"${n}"`:`not provided`}, `;let i=e?jn(e):``;return r+=i?` first bytes: "${i}"`:`first bytes: not available`,r+=`)`,r}function Cn(e){for(let t of e)fn(t)}function wn(e,t){let n=t&&gn.exec(t),r=n&&n[1];return r?Tn(e,r):null}function Tn(e,t){t=t.toLowerCase();for(let n of e)for(let e of n.extensions)if(e.toLowerCase()===t)return n;return null}function En(e,t){for(let n of e)if(n.mimeTypes?.some(e=>Dt(t,e))||Dt(t,`application/x.${n.id}`))return n;return null}function Dn(e,t){if(!t)return null;for(let n of e)if(typeof t==`string`){if(On(t,n))return n}else if(ArrayBuffer.isView(t)){if(kn(t.buffer,t.byteOffset,n))return n}else if(t instanceof ArrayBuffer&&kn(t,0,n))return n;return null}function On(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}function kn(e,t,n){return(Array.isArray(n.tests)?n.tests:[n.tests]).some(r=>An(e,t,n,r))}function An(e,t,n,r){if(we(r))return st(r,e,r.byteLength);switch(typeof r){case`function`:return r(yt(e));case`string`:return r===Mn(e,t,r.length);default:return!1}}function jn(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?Mn(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?Mn(e,0,t):``}function Mn(e,t,n){if(e.byteLength<t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}var Nn=256*1024;function*Pn(e,t){let n=t?.chunkSize||Nn,r=0,i=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,n),a=e.slice(r,r+t);r+=t,yield yt(i.encode(a))}}var Fn=256*1024;function*In(e,t={}){let{chunkSize:n=Fn}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,n),i=new ArrayBuffer(t),a=new Uint8Array(e,r,t);new Uint8Array(i).set(a),r+=t,yield i}}var Ln=1024*1024;async function*Rn(e,t){let n=t?.chunkSize||Ln,r=0;for(;r<e.size;){let t=r+n,i=await e.slice(r,t).arrayBuffer();r=t,yield i}}function zn(e,t){return he?Bn(e,t):Vn(e,t)}async function*Bn(e,t){let n=e.getReader(),r;try{for(;;){let e=r||n.read();t?._streamReadAhead&&(r=n.read());let{done:i,value:a}=await e;if(i)return;yield vt(a)}}catch{n.releaseLock()}}async function*Vn(e,t){for await(let t of e)yield vt(t)}function Hn(e,t){if(typeof e==`string`)return Pn(e,t);if(e instanceof ArrayBuffer)return In(e,t);if(Oe(e))return Rn(e,t);if(je(e))return zn(e,t);if(De(e)){let n=e.body;if(!n)throw Error(`Readable stream not available on Response`);return zn(n,t)}throw Error(`makeIterator`)}var Un=`Cannot convert supplied data type`;function Wn(e,t,n){if(t.text&&typeof e==`string`)return e;if(_t(e)&&(e=e.buffer),we(e)){let n=xt(e);return t.text&&!t.binary?new TextDecoder(`utf8`).decode(n):vt(n)}throw Error(Un)}async function Gn(e,t,n){if(typeof e==`string`||we(e))return Wn(e,t,n);if(Oe(e)&&(e=await Lt(e)),De(e))return await Rt(e),t.binary?await e.arrayBuffer():await e.text();if(je(e)&&(e=Hn(e,n)),Te(e)||Ee(e))return ut(e);throw Error(Un)}function Kn(e,t){let n=Qt(),r=e||n,i=r.fetch??r.core?.fetch;return typeof i==`function`?i:xe(i)?e=>Gt(e,i):t?.fetch?t?.fetch:Gt}function qn(e,t,n){if(n)return n;let r={fetch:Kn(t,e),...e};if(r.url){let e=Mt(r.url);r.baseUrl=e,r.queryString=jt(r.url),r.filename=St(e),r.baseUrl=Ct(e)}return Array.isArray(r.loaders)||(r.loaders=null),r}function Jn(e,t){if(e&&!Array.isArray(e))return e;let n;if(e&&(n=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];n=n?[...n,...e]:e}return n&&n.length?n:void 0}async function Yn(e,t,n,r){t&&!Array.isArray(t)&&!dn(t)&&(r=void 0,n=t,t=void 0),e=await e,n||={};let i=Pt(e),a=Jn(t,r),o=await _n(e,a,n);if(!o)return null;let s=$t(n,o,a,i);return r=qn({url:i,_parse:Yn,loaders:a},s,r||null),await Xn(o,e,s,r)}async function Xn(e,t,n,r){if(rt(e),n=Me(e.options,n),De(t)){let{ok:e,redirected:n,status:i,statusText:a,type:o,url:s}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:n,status:i,statusText:a,type:o,url:s}}t=await Gn(t,e,n);let i=e;if(i.parseTextSync&&typeof t==`string`)return i.parseTextSync(t,n,r);if(it(e,n))return await at(e,t,n,r,Yn);if(i.parseText&&typeof t==`string`)return await i.parseText(t,n,r);if(i.parse)return await i.parse(t,n,r);throw Le(!i.parseSync),Error(`${e.id} loader - no parser found and worker is disabled`)}async function Zn(e,t,n,r){let i,a;!Array.isArray(t)&&!dn(t)?(i=[],a=t,r=void 0):(i=t,a=n);let o=Kn(a),s=e;return typeof e==`string`&&(s=await o(e)),Oe(e)&&(s=await o(e)),typeof e==`string`&&(en(a||{}).core?.baseUrl||(a={...a,core:{...a?.core,baseUrl:e}})),await Yn(s,i,a)}var Qn=`4.5.2`,$n=globalThis.loaders?.parseImageNode,er=typeof Image<`u`,tr=typeof ImageBitmap<`u`,nr=he?!0:!!$n;function rr(e){switch(e){case`auto`:return tr||er||nr;case`imagebitmap`:return tr;case`image`:return er;case`data`:return nr;default:throw Error(`@loaders.gl/images: image ${e} not supported in this environment`)}}function ir(){if(tr)return`imagebitmap`;if(er)return`image`;if(nr)return`data`;throw Error(`Install '@loaders.gl/polyfills' to parse images under Node.js`)}function ar(e){let t=sr(e);if(!t)throw Error(`Not an image`);return t}function or(e){switch(ar(e)){case`data`:return e;case`image`:case`imagebitmap`:let t=document.createElement(`canvas`),n=t.getContext(`2d`);if(!n)throw Error(`getImageData`);return t.width=e.width,t.height=e.height,n.drawImage(e,0,0),n.getImageData(0,0,e.width,e.height);default:throw Error(`getImageData`)}}function sr(e){return typeof ImageBitmap<`u`&&e instanceof ImageBitmap?`imagebitmap`:typeof Image<`u`&&e instanceof Image?`image`:e&&typeof e==`object`&&e.data&&e.width&&e.height?`data`:null}var cr=/^data:image\/svg\+xml/,lr=/\.svg((\?|#).*)?$/;function ur(e){return e&&(cr.test(e)||lr.test(e))}function dr(e,t){if(ur(t)){let t=new TextDecoder().decode(e);try{typeof unescape==`function`&&typeof encodeURIComponent==`function`&&(t=unescape(encodeURIComponent(t)))}catch(e){throw Error(e.message)}return`data:image/svg+xml;base64,${btoa(t)}`}return fr(e,t)}function fr(e,t){if(ur(t))throw Error(`SVG cannot be parsed directly to imagebitmap`);return new Blob([new Uint8Array(e)])}async function pr(e,t,n){let r=dr(e,n),i=self.URL||self.webkitURL,a=typeof r!=`string`&&i.createObjectURL(r);try{return await mr(a||r,t)}finally{a&&i.revokeObjectURL(a)}}async function mr(e,t){let n=new Image;return n.src=e,t.image&&t.image.decode&&n.decode?(await n.decode(),n):await new Promise((e,t)=>{try{n.onload=()=>e(n),n.onerror=e=>{let n=e instanceof Error?e.message:`error`;t(Error(n))}}catch(e){t(e)}})}var hr=!0;async function gr(e,t,n){let r;r=ur(n)?await pr(e,t,n):fr(e,n);let i=t&&t.imagebitmap;return await _r(r,i)}async function _r(e,t=null){if((vr(t)||!hr)&&(t=null),t)try{return await createImageBitmap(e,t)}catch(e){console.warn(e),hr=!1}return await createImageBitmap(e)}function vr(e){if(!e)return!0;for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function yr(e){return!Cr(e,`ftyp`,4)||!(e[8]&96)?null:br(e)}function br(e){switch(xr(e,8,12).replace(`\0`,` `).trim()){case`avif`:case`avis`:return{extension:`avif`,mimeType:`image/avif`};default:return null}}function xr(e,t,n){return String.fromCharCode(...e.slice(t,n))}function Sr(e){return[...e].map(e=>e.charCodeAt(0))}function Cr(e,t,n=0){let r=Sr(t);for(let t=0;t<r.length;++t)if(r[t]!==e[t+n])return!1;return!0}var wr=!1,Tr=!0;function Er(e){let t=Nr(e);return Or(t)||jr(t)||kr(t)||Ar(t)||Dr(t)}function Dr(e){let t=yr(new Uint8Array(e instanceof DataView?e.buffer:e));return t?{mimeType:t.mimeType,width:0,height:0}:null}function Or(e){let t=Nr(e);return t.byteLength>=24&&t.getUint32(0,wr)===2303741511?{mimeType:`image/png`,width:t.getUint32(16,wr),height:t.getUint32(20,wr)}:null}function kr(e){let t=Nr(e);return t.byteLength>=10&&t.getUint32(0,wr)===1195984440?{mimeType:`image/gif`,width:t.getUint16(6,Tr),height:t.getUint16(8,Tr)}:null}function Ar(e){let t=Nr(e);return t.byteLength>=14&&t.getUint16(0,wr)===16973&&t.getUint32(2,Tr)===t.byteLength?{mimeType:`image/bmp`,width:t.getUint32(18,Tr),height:t.getUint32(22,Tr)}:null}function jr(e){let t=Nr(e);if(!(t.byteLength>=3&&t.getUint16(0,wr)===65496&&t.getUint8(2)===255))return null;let{tableMarkers:n,sofMarkers:r}=Mr(),i=2;for(;i+9<t.byteLength;){let e=t.getUint16(i,wr);if(r.has(e))return{mimeType:`image/jpeg`,height:t.getUint16(i+5,wr),width:t.getUint16(i+7,wr)};if(!n.has(e))return null;i+=2,i+=t.getUint16(i,wr)}return null}function Mr(){let e=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)e.add(t);return{tableMarkers:e,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}function Nr(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw Error(`toDataView`)}async function Pr(e,t){let{mimeType:n}=Er(e)||{},r=globalThis.loaders?.parseImageNode;return me(r),await r(e,n)}async function Fr(e,t,n){t||={};let r=(t.image||{}).type||`auto`,{url:i}=n||{},a=Ir(r),o;switch(a){case`imagebitmap`:o=await gr(e,t,i);break;case`image`:o=await pr(e,t,i);break;case`data`:o=await Pr(e,t);break;default:me(!1)}return r===`data`&&(o=or(o)),o}function Ir(e){switch(e){case`auto`:case`data`:return ir();default:return rr(e),e}}var Lr={dataType:null,batchType:null,id:`image`,module:`images`,name:`Images`,version:Qn,mimeTypes:[`image/png`,`image/jpeg`,`image/gif`,`image/webp`,`image/avif`,`image/bmp`,`image/vnd.microsoft.icon`,`image/svg+xml`],extensions:[`png`,`jpg`,`jpeg`,`gif`,`webp`,`bmp`,`ico`,`svg`,`avif`],parse:Fr,tests:[e=>!!Er(new DataView(e))],options:{image:{type:`auto`,decode:!0}}},N=new a({id:`deck`}),Rr={};function zr(e){Rr=e}function P(e,t,n,r){N.level>0&&Rr[e]&&Rr[e].call(null,t,n,r)}function Br(e){let t=e[0],n=e[e.length-1];return t===`{`&&n===`}`||t===`[`&&n===`]`}var Vr={dataType:null,batchType:null,id:`JSON`,name:`JSON`,module:``,version:``,options:{},extensions:[`json`,`geojson`],mimeTypes:[`application/json`,`application/geo+json`],testText:Br,parseTextSync:JSON.parse};function Hr(){let e=`9.4.0`,t=globalThis.deck&&globalThis.deck.VERSION;if(t&&t!==e)throw Error(`deck.gl - multiple versions detected: ${t} vs ${e}`);return t||(N.log(1,`deck.gl ${e}`)(),globalThis.deck={...globalThis.deck,VERSION:e,version:e,log:N,_registerLoggers:zr},mn([Vr,[Lr,{imagebitmap:{premultiplyAlpha:`none`}}]])),e}var Ur=Hr(),Wr=`set luma.log.level=1 (or higher) to trace rendering`,Gr="No matching device found. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.",Kr=new class t{static defaultProps={...s,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=c;log=e;VERSION=typeof __VERSION__<`u`?__VERSION__:`running from source`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw e.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),e.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);e.error(`This version of luma.gl has already been initialized`)()}e.log(1,`${this.VERSION} - ${Wr}`)(),globalThis.luma=this}async createDevice(e={}){let n={...t.defaultProps,...e},r=this.selectAdapter(n.type,n.adapters);if(!r)throw Error(Gr);return n.waitForPageLoad&&await r.pageLoaded,await r.create(n)}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(Gr);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(t=!0,n=[]){let r=this._getAdapterMap(n).get(`webgl`);r||e.warn(`enforceWebGL2: webgl adapter not found`)(),r?.enforceWebGL2?.(t)}setDefaultDeviceProps(e){Object.assign(t.defaultProps,e)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(t,n=[]){return t instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&t instanceof GPUDevice||t?.queue?`webgpu`:t===null?`null`:(t instanceof WebGLRenderingContext?e.warn(`WebGL1 is not supported`,t)():e.warn(`Unknown handle type`,t)(),null)}},qr=class{get pageLoaded(){return Zr()}},Jr=t()&&typeof document<`u`,Yr=()=>Jr&&document.readyState===`complete`,Xr=null;function Zr(){return Xr||=Yr()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),Xr}1/Math.PI*180;var Qr=1/180*Math.PI,$r={EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1};globalThis.mathgl=globalThis.mathgl||{config:{...$r}};var F=globalThis.mathgl.config;function ei(e,{precision:t=F.precision}={}){return e=ai(e),`${parseFloat(e.toPrecision(t))}`}function ti(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function ni(e,t){return si(e,e=>e*Qr,t)}function I(e,t,n){return si(e,e=>Math.max(t,Math.min(n,e)))}function ri(e,t,n){return ti(e)?e.map((e,r)=>ri(e,t[r],n)):n*t+(1-n)*e}function ii(e,t,n){let r=F.EPSILON;n&&(F.EPSILON=n);try{if(e===t)return!0;if(ti(e)&&ti(t)){if(e.length!==t.length)return!1;for(let n=0;n<e.length;++n)if(!ii(e[n],t[n]))return!1;return!0}return e&&e.equals?e.equals(t):t&&t.equals?t.equals(e):typeof e==`number`&&typeof t==`number`?Math.abs(e-t)<=F.EPSILON*Math.max(1,Math.abs(e),Math.abs(t)):!1}finally{F.EPSILON=r}}function ai(e){return Math.round(e/F.EPSILON)*F.EPSILON}function oi(e){return e.clone?e.clone():Array(e.length)}function si(e,t,n){if(ti(e)){let r=e;n||=oi(r);for(let i=0;i<n.length&&i<r.length;++i){let r=typeof e==`number`?e:e[i];n[i]=t(r,i,n)}return n}return t(e)}var ci=class extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let n=0;n<this.ELEMENTS;++n)this[n]=e[n+t];return this.check()}toArray(e=[],t=0){for(let n=0;n<this.ELEMENTS;++n)e[t+n]=this[n];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:ti(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toString(){return this.formatString(F)}formatString(e){let t=``;for(let n=0;n<this.ELEMENTS;++n)t+=(n>0?`, `:``)+ei(this[n],e);return`${e.printTypes?this.constructor.name:``}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!ii(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,n){if(n===void 0)return this.lerp(this,e,t);for(let r=0;r<this.ELEMENTS;++r){let i=e[r];this[r]=i+n*((typeof t==`number`?t:t[r])-i)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(Math.max(this[n],e[n]),t[n]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if(typeof e==`number`)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(F.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e&&=Number.isFinite(this[t]);return e}};function li(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}function L(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}function ui(e,t,n=``){if(F.debug&&!li(e,t))throw Error(`math.gl: ${n} some fields set to invalid numbers'`);return e}var di=class extends ci{toString(){let e=`[`;if(F.printRowMajor){e+=`row-major:`;for(let t=0;t<this.RANK;++t)for(let n=0;n<this.RANK;++n)e+=` ${this[n*this.RANK+t]}`}else{e+=`column-major:`;for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+=`]`,e}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,n){return this[t*this.RANK+e]=L(n),this}getColumn(e,t=Array(this.RANK).fill(-0)){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[n+e];return t}setColumn(e,t){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)this[n+e]=t[e];return this}};function fi(e,t){if(!e)throw Error(`math.gl assertion ${t}`)}var pi=class extends ci{get x(){return this[0]}set x(e){this[0]=L(e)}get y(){return this[1]}set y(e){this[1]=L(e)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let e=0;for(let t=0;t<this.ELEMENTS;++t)e+=this[t]*this[t];return e}magnitudeSquared(){return this.lengthSquared()}distance(e){return Math.sqrt(this.distanceSquared(e))}distanceSquared(e){let t=0;for(let n=0;n<this.ELEMENTS;++n){let r=this[n]-e[n];t+=r*r}return L(t)}dot(e){let t=0;for(let n=0;n<this.ELEMENTS;++n)t+=this[n]*e[n];return L(t)}normalize(){let e=this.magnitude();if(e!==0)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e;return this.check()}multiply(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]*=t[e];return this.check()}divide(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]/=t[e];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(e){return this.distance(e)}distanceToSquared(e){return this.distanceSquared(e)}getComponent(e){return fi(e>=0&&e<this.ELEMENTS,`index is out of range`),L(this[e])}setComponent(e,t){return fi(e>=0&&e<this.ELEMENTS,`index is out of range`),this[e]=t,this.check()}addVectors(e,t){return this.copy(e).add(t)}subVectors(e,t){return this.copy(e).subtract(t)}multiplyVectors(e,t){return this.copy(e).multiply(t)}addScaledVector(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]+=e[n]*t;return this.check()}};Math.PI/180;function mi(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e}function hi(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e}function gi(e,t){return e[0]=-t[0],e[1]=-t[1],e}function _i(e,t,n,r){let i=t[0],a=t[1];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e}function vi(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[4]*i+n[12],e[1]=n[1]*r+n[5]*i+n[13],e}var yi=hi;function bi(e,t,n){let r=t[0],i=t[1],a=n[3]*r+n[7]*i||1;return e[0]=(n[0]*r+n[4]*i)/a,e[1]=(n[1]*r+n[5]*i)/a,e}function xi(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a||1;return e[0]=(n[0]*r+n[4]*i+n[8]*a)/o,e[1]=(n[1]*r+n[5]*i+n[9]*a)/o,e[2]=(n[2]*r+n[6]*i+n[10]*a)/o,e}function Si(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i,e[1]=n[1]*r+n[3]*i,e[2]=t[2],e}function Ci(e){let t=e[0],n=e[1],r=e[2];return Math.sqrt(t*t+n*n+r*r)}function wi(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e}function Ti(e){let t=e[0],n=e[1],r=e[2];return t*t+n*n+r*r}function Ei(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e}function Di(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function Oi(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2];return e[0]=i*c-a*s,e[1]=a*o-r*c,e[2]=r*s-i*o,e}function ki(e,t,n,r){let i=t[0],a=t[1],o=t[2];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e[2]=o+r*(n[2]-o),e}function Ai(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a+n[15];return o||=1,e[0]=(n[0]*r+n[4]*i+n[8]*a+n[12])/o,e[1]=(n[1]*r+n[5]*i+n[9]*a+n[13])/o,e[2]=(n[2]*r+n[6]*i+n[10]*a+n[14])/o,e}function ji(e,t,n){let r=t[0],i=t[1],a=t[2];return e[0]=r*n[0]+i*n[3]+a*n[6],e[1]=r*n[1]+i*n[4]+a*n[7],e[2]=r*n[2]+i*n[5]+a*n[8],e}function Mi(e,t,n){let r=n[0],i=n[1],a=n[2],o=n[3],s=t[0],c=t[1],l=t[2],u=i*l-a*c,d=a*s-r*l,f=r*c-i*s,p=i*f-a*d,m=a*u-r*f,h=r*d-i*u,g=o*2;return u*=g,d*=g,f*=g,p*=2,m*=2,h*=2,e[0]=s+u+p,e[1]=c+d+m,e[2]=l+f+h,e}function Ni(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0],a[1]=i[1]*Math.cos(r)-i[2]*Math.sin(r),a[2]=i[1]*Math.sin(r)+i[2]*Math.cos(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function Pi(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[2]*Math.sin(r)+i[0]*Math.cos(r),a[1]=i[1],a[2]=i[2]*Math.cos(r)-i[0]*Math.sin(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function Fi(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0]*Math.cos(r)-i[1]*Math.sin(r),a[1]=i[0]*Math.sin(r)+i[1]*Math.cos(r),a[2]=i[2],e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function Ii(e,t){let n=e[0],r=e[1],i=e[2],a=t[0],o=t[1],s=t[2],c=Math.sqrt((n*n+r*r+i*i)*(a*a+o*o+s*s)),l=c&&Di(e,t)/c;return Math.acos(Math.min(Math.max(l,-1),1))}var Li=wi,Ri=Ci,zi=Ti,Bi=[0,0,0],Vi,Hi=class e extends pi{static get ZERO(){return Vi||(Vi=new e(0,0,0),Object.freeze(Vi)),Vi}constructor(e=0,t=0,n=0){super(-0,-0,-0),arguments.length===1&&ti(e)?this.copy(e):(F.debug&&(L(e),L(t),L(n)),this[0]=e,this[1]=t,this[2]=n)}set(e,t,n){return this[0]=e,this[1]=t,this[2]=n,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this.check()}fromObject(e){return F.debug&&(L(e.x),L(e.y),L(e.z)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this.check()}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e}get ELEMENTS(){return 3}get z(){return this[2]}set z(e){this[2]=L(e)}angle(e){return Ii(this,e)}cross(e){return Oi(this,this,e),this.check()}rotateX({radians:e,origin:t=Bi}){return Ni(this,this,t,e),this.check()}rotateY({radians:e,origin:t=Bi}){return Pi(this,this,t,e),this.check()}rotateZ({radians:e,origin:t=Bi}){return Fi(this,this,t,e),this.check()}transform(e){return this.transformAsPoint(e)}transformAsPoint(e){return Ai(this,this,e),this.check()}transformAsVector(e){return xi(this,this,e),this.check()}transformByMatrix3(e){return ji(this,this,e),this.check()}transformByMatrix2(e){return Si(this,this,e),this.check()}transformByQuaternion(e){return Mi(this,this,e),this.check()}};function Ui(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function Wi(e,t){if(e===t){let n=t[1],r=t[2],i=t[3],a=t[6],o=t[7],s=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=i,e[13]=o,e[14]=s}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}function Gi(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,E=u*_-p*m,D=d*g-f*h,O=d*_-p*h,k=f*_-p*g,A=v*k-y*O+b*D+x*E-S*T+C*w;return A?(A=1/A,e[0]=(s*k-c*O+l*D)*A,e[1]=(i*O-r*k-a*D)*A,e[2]=(h*C-g*S+_*x)*A,e[3]=(f*S-d*C-p*x)*A,e[4]=(c*E-o*k-l*T)*A,e[5]=(n*k-i*E+a*T)*A,e[6]=(g*b-m*C-_*y)*A,e[7]=(u*C-f*b+p*y)*A,e[8]=(o*O-s*E+l*w)*A,e[9]=(r*E-n*O-a*w)*A,e[10]=(m*S-h*b+_*v)*A,e[11]=(d*b-u*S-p*v)*A,e[12]=(s*T-o*D-c*w)*A,e[13]=(n*D-r*T+i*w)*A,e[14]=(h*y-m*x-g*v)*A,e[15]=(u*x-d*y+f*v)*A,e):null}function Ki(e){let t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=n*s-r*o,b=l*m-u*p,x=l*h-d*p,S=u*h-d*m,C=t*S-n*x+r*b,w=a*S-o*x+s*b,T=l*y-u*v+d*_,E=p*y-m*v+h*_;return c*C-i*w+g*T-f*E}function qi(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e}function Ji(e,t,n){let r=n[0],i=n[1],a=n[2],o,s,c,l,u,d,f,p,m,h,g,_;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*a+t[12],e[13]=t[1]*r+t[5]*i+t[9]*a+t[13],e[14]=t[2]*r+t[6]*i+t[10]*a+t[14],e[15]=t[3]*r+t[7]*i+t[11]*a+t[15]):(o=t[0],s=t[1],c=t[2],l=t[3],u=t[4],d=t[5],f=t[6],p=t[7],m=t[8],h=t[9],g=t[10],_=t[11],e[0]=o,e[1]=s,e[2]=c,e[3]=l,e[4]=u,e[5]=d,e[6]=f,e[7]=p,e[8]=m,e[9]=h,e[10]=g,e[11]=_,e[12]=o*r+u*i+m*a+t[12],e[13]=s*r+d*i+h*a+t[13],e[14]=c*r+f*i+g*a+t[14],e[15]=l*r+p*i+_*a+t[15]),e}function Yi(e,t,n){let r=n[0],i=n[1],a=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function Xi(e,t,n,r){let i=r[0],a=r[1],o=r[2],s=Math.sqrt(i*i+a*a+o*o),c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,ee;return s<1e-6?null:(s=1/s,i*=s,a*=s,o*=s,l=Math.sin(n),c=Math.cos(n),u=1-c,d=t[0],f=t[1],p=t[2],m=t[3],h=t[4],g=t[5],_=t[6],v=t[7],y=t[8],b=t[9],x=t[10],S=t[11],C=i*i*u+c,w=a*i*u+o*l,T=o*i*u-a*l,E=i*a*u-o*l,D=a*a*u+c,O=o*a*u+i*l,k=i*o*u+a*l,A=a*o*u-i*l,ee=o*o*u+c,e[0]=d*C+h*w+y*T,e[1]=f*C+g*w+b*T,e[2]=p*C+_*w+x*T,e[3]=m*C+v*w+S*T,e[4]=d*E+h*D+y*O,e[5]=f*E+g*D+b*O,e[6]=p*E+_*D+x*O,e[7]=m*E+v*D+S*O,e[8]=d*k+h*A+y*ee,e[9]=f*k+g*A+b*ee,e[10]=p*k+_*A+x*ee,e[11]=m*k+v*A+S*ee,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)}function Zi(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e}function Qi(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i-l*r,e[1]=o*i-u*r,e[2]=s*i-d*r,e[3]=c*i-f*r,e[8]=a*r+l*i,e[9]=o*r+u*i,e[10]=s*r+d*i,e[11]=c*r+f*i,e}function $i(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[4],u=t[5],d=t[6],f=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i+l*r,e[1]=o*i+u*r,e[2]=s*i+d*r,e[3]=c*i+f*r,e[4]=l*i-a*r,e[5]=u*i-o*r,e[6]=d*i-s*r,e[7]=f*i-c*r,e}function ea(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[1]=u+_,e[2]=f-g,e[3]=0,e[4]=u-_,e[5]=1-l-m,e[6]=p+h,e[7]=0,e[8]=f+g,e[9]=p-h,e[10]=1-l-d,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function ta(e,t,n,r,i,a,o){let s=1/(n-t),c=1/(i-r),l=1/(a-o);return e[0]=a*2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a*2*c,e[6]=0,e[7]=0,e[8]=(n+t)*s,e[9]=(i+r)*c,e[10]=(o+a)*l,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*a*2*l,e[15]=0,e}function na(e,t,n,r,i){let a=1/Math.tan(t/2);if(e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0){let t=1/(r-i);e[10]=(i+r)*t,e[14]=2*i*r*t}else e[10]=-1,e[14]=-2*r;return e}var ra=na;function ia(e,t,n,r,i,a,o){let s=1/(t-n),c=1/(r-i),l=1/(a-o);return e[0]=-2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*c,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*l,e[11]=0,e[12]=(t+n)*s,e[13]=(i+r)*c,e[14]=(o+a)*l,e[15]=1,e}var aa=ia;function oa(e,t,n,r){let i,a,o,s,c,l,u,d,f,p,m=t[0],h=t[1],g=t[2],_=r[0],v=r[1],y=r[2],b=n[0],x=n[1],S=n[2];return Math.abs(m-b)<1e-6&&Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6?Ui(e):(d=m-b,f=h-x,p=g-S,i=1/Math.sqrt(d*d+f*f+p*p),d*=i,f*=i,p*=i,a=v*p-y*f,o=y*d-_*p,s=_*f-v*d,i=Math.sqrt(a*a+o*o+s*s),i?(i=1/i,a*=i,o*=i,s*=i):(a=0,o=0,s=0),c=f*s-p*o,l=p*a-d*s,u=d*o-f*a,i=Math.sqrt(c*c+l*l+u*u),i?(i=1/i,c*=i,l*=i,u*=i):(c=0,l=0,u=0),e[0]=a,e[1]=c,e[2]=d,e[3]=0,e[4]=o,e[5]=l,e[6]=f,e[7]=0,e[8]=s,e[9]=u,e[10]=p,e[11]=0,e[12]=-(a*m+o*h+s*g),e[13]=-(c*m+l*h+u*g),e[14]=-(d*m+f*h+p*g),e[15]=1,e)}function sa(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e}function ca(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*a+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*a+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*a+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*a+n[15]*o,e}var la;(function(e){e[e.COL0ROW0=0]=`COL0ROW0`,e[e.COL0ROW1=1]=`COL0ROW1`,e[e.COL0ROW2=2]=`COL0ROW2`,e[e.COL0ROW3=3]=`COL0ROW3`,e[e.COL1ROW0=4]=`COL1ROW0`,e[e.COL1ROW1=5]=`COL1ROW1`,e[e.COL1ROW2=6]=`COL1ROW2`,e[e.COL1ROW3=7]=`COL1ROW3`,e[e.COL2ROW0=8]=`COL2ROW0`,e[e.COL2ROW1=9]=`COL2ROW1`,e[e.COL2ROW2=10]=`COL2ROW2`,e[e.COL2ROW3=11]=`COL2ROW3`,e[e.COL3ROW0=12]=`COL3ROW0`,e[e.COL3ROW1=13]=`COL3ROW1`,e[e.COL3ROW2=14]=`COL3ROW2`,e[e.COL3ROW3=15]=`COL3ROW3`})(la||={});var ua=45*Math.PI/180,da=1,fa=.1,pa=500,ma=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),R=class extends di{static get IDENTITY(){return va()}static get ZERO(){return _a()}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return la}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this[4]=i,this[5]=a,this[6]=o,this[7]=s,this[8]=c,this[9]=l,this[10]=u,this[11]=d,this[12]=f,this[13]=p,this[14]=m,this[15]=h,this.check()}setRowMajor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=i,this[2]=c,this[3]=f,this[4]=t,this[5]=a,this[6]=l,this[7]=p,this[8]=n,this[9]=o,this[10]=u,this[11]=m,this[12]=r,this[13]=s,this[14]=d,this[15]=h,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(ma)}fromObject(e){return this.check()}fromQuaternion(e){return ea(this,e),this.check()}fromMatrix3(e){return this.set(e[0],e[1],e[2],0,e[3],e[4],e[5],0,e[6],e[7],e[8],0,0,0,0,1)}frustum(e){let{left:t,right:n,bottom:r,top:i,near:a=fa,far:o=pa}=e;return o===1/0?ba(this,t,n,r,i,a):ta(this,t,n,r,i,a,o),this.check()}lookAt(e){let{eye:t,center:n=[0,0,0],up:r=[0,1,0]}=e;return oa(this,t,n,r),this.check()}ortho(e){let{left:t,right:n,bottom:r,top:i,near:a=fa,far:o=pa}=e;return aa(this,t,n,r,i,a,o),this.check()}orthographic(e){let{fovy:t=ua,aspect:n=da,focalDistance:r=1,near:i=fa,far:a=pa}=e;ya(t);let o=t/2,s=r*Math.tan(o),c=s*n;return this.ortho({left:-c,right:c,bottom:-s,top:s,near:i,far:a})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:n=1,near:r=.1,far:i=500}=e;return ya(t),ra(this,t,n,r,i),this.check()}determinant(){return Ki(this)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=0,e[4]=this[4]*r,e[5]=this[5]*i,e[6]=this[6]*a,e[7]=0,e[8]=this[8]*r,e[9]=this[9]*i,e[10]=this[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}getRotationMatrix3(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=this[4]*r,e[4]=this[5]*i,e[5]=this[6]*a,e[6]=this[8]*r,e[7]=this[9]*i,e[8]=this[10]*a,e}transpose(){return Wi(this,this),this.check()}invert(){return Gi(this,this),this.check()}multiplyLeft(e){return qi(this,e,this),this.check()}multiplyRight(e){return qi(this,this,e),this.check()}rotateX(e){return Zi(this,this,e),this.check()}rotateY(e){return Qi(this,this,e),this.check()}rotateZ(e){return $i(this,this,e),this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){return Xi(this,this,e,t),this.check()}scale(e){return Yi(this,this,Array.isArray(e)?e:[e,e,e]),this.check()}translate(e){return Ji(this,this,e),this.check()}transform(e,t){return e.length===4?(t=ca(t||[-0,-0,-0,-0],e,this),ui(t,4),t):this.transformAsPoint(e,t)}transformAsPoint(e,t){let{length:n}=e,r;switch(n){case 2:r=vi(t||[-0,-0],e,this);break;case 3:r=Ai(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return ui(r,e.length),r}transformAsVector(e,t){let n;switch(e.length){case 2:n=bi(t||[-0,-0],e,this);break;case 3:n=xi(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return ui(n,e.length),n}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,n){return this.identity().translate([e,t,n])}},ha,ga;function _a(){return ha||(ha=new R([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),Object.freeze(ha)),ha}function va(){return ga||(ga=new R,Object.freeze(ga)),ga}function ya(e){if(e>Math.PI*2)throw Error(`expected radians`)}function ba(e,t,n,r,i,a){let o=2*a/(n-t),s=2*a/(i-r),c=(n+t)/(n-t),l=(i+r)/(i-r),u=-2*a;return e[0]=o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=c,e[9]=l,e[10]=-1,e[11]=-1,e[12]=0,e[13]=0,e[14]=u,e[15]=0,e}function xa(e,t=[],n=0){let r=Math.fround(e),i=e-r;return t[n]=r,t[n+1]=i,t}function Sa(e){return e-Math.fround(e)}function Ca(e){let t=new Float32Array(32);for(let n=0;n<4;++n)for(let r=0;r<4;++r){let i=n*4+r;xa(e[r*4+n],t,i*2)}return t}function wa(e,t=!0){return e??t}function Ta(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}function Ea(e,t=!0){let n=Ta(e.slice(0,3),t),r=Number.isFinite(e[3]),i=r?e[3]:1;return[n[0],n[1],n[2],t&&r?i/255:i]}var Da=`
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
`,Oa=`struct Fp64F32Bits {
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

`,ka={name:`fp64arithmetic`,source:`\
struct Fp64ArithmeticUniforms {
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
${`\
${Oa}

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

struct Fp64IntegerAccumulator {
  sign: u32,
  magnitude: vec2u,
};

fn fp64_accumulate_f32_integer(
  accumulator: Fp64IntegerAccumulator,
  value: Fp64F32Bits,
  commonBaseExponent: i32
) -> Fp64IntegerAccumulator {
  if (value.isZero) {
    return accumulator;
  }

  let magnitude = fp64_u64_shift_left(
    vec2u(0u, value.significand),
    u32(value.baseExponent - commonBaseExponent)
  );
  if (fp64_u64_is_zero(accumulator.magnitude)) {
    return Fp64IntegerAccumulator(value.sign, magnitude);
  }
  if (accumulator.sign == value.sign) {
    return Fp64IntegerAccumulator(
      accumulator.sign,
      fp64_u64_add(accumulator.magnitude, magnitude)
    );
  }

  let comparison = fp64_u64_compare(accumulator.magnitude, magnitude);
  if (comparison == 0) {
    return Fp64IntegerAccumulator(0u, vec2u(0u));
  }
  if (comparison > 0) {
    return Fp64IntegerAccumulator(
      accumulator.sign,
      fp64_u64_sub(accumulator.magnitude, magnitude)
    );
  }
  return Fp64IntegerAccumulator(
    value.sign,
    fp64_u64_sub(magnitude, accumulator.magnitude)
  );
}

fn fp64_sum_integer_unfused(a: vec2f, b: vec2f) -> vec2f {
  var sum = fp64_two_sum_integer(a.x, b.x);
  let lowSum = fp64_two_sum_integer(a.y, b.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.x);
  sum = fp64_two_sum_integer(sum.x, sum.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.y);
  return fp64_two_sum_integer(sum.x, sum.y);
}

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  let aHigh = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let aLow = fp64_decode_f32_bits(bitcast<u32>(a.y));
  let bHigh = fp64_decode_f32_bits(bitcast<u32>(b.x));
  let bLow = fp64_decode_f32_bits(bitcast<u32>(b.y));
  if (
    aHigh.isInf || aHigh.isNan || aLow.isInf || aLow.isNan ||
    bHigh.isInf || bHigh.isNan || bLow.isInf || bLow.isNan
  ) {
    return fp64_sum_integer_unfused(a, b);
  }

  var minimumBaseExponent = 2147483647;
  var maximumBaseExponent = -2147483647;
  if (!aHigh.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, aHigh.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, aHigh.baseExponent);
  }
  if (!aLow.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, aLow.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, aLow.baseExponent);
  }
  if (!bHigh.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, bHigh.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, bHigh.baseExponent);
  }
  if (!bLow.isZero) {
    minimumBaseExponent = min(minimumBaseExponent, bLow.baseExponent);
    maximumBaseExponent = max(maximumBaseExponent, bLow.baseExponent);
  }
  if (maximumBaseExponent < minimumBaseExponent) {
    return vec2f(0.0, 0.0);
  }

  // Four 24-bit significands spanning at most 38 bits fit in the 64-bit
  // accumulator, including the two extra carry bits needed by their sum.
  if (maximumBaseExponent - minimumBaseExponent > 38) {
    return fp64_sum_integer_unfused(a, b);
  }

  var accumulator = Fp64IntegerAccumulator(0u, vec2u(0u));
  accumulator = fp64_accumulate_f32_integer(accumulator, aHigh, minimumBaseExponent);
  accumulator = fp64_accumulate_f32_integer(accumulator, aLow, minimumBaseExponent);
  accumulator = fp64_accumulate_f32_integer(accumulator, bHigh, minimumBaseExponent);
  accumulator = fp64_accumulate_f32_integer(accumulator, bLow, minimumBaseExponent);
  let resultBits = fp64_split_accumulator_bits(
    accumulator.sign,
    accumulator.magnitude,
    minimumBaseExponent
  );
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
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
  product = sum_fp64(product, vec2f(crossProduct1, 0.0));
  let crossProduct2 = fp64_round_mul_integer(a.y, b.x);
  return sum_fp64(product, vec2f(crossProduct2, 0.0));
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
`}
#else
#ifdef LUMA_FP64_HYBRID_ARITHMETIC
${`\
${Oa}

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
  result.y = result.y + a.y;
  return result;
}

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
  let highSum = fp64_two_sum_integer(a.x, b.x);
  let lowSum = prevent_fp64_optimization((a.y + b.y) + highSum.y);
  return fp64_two_sum_integer(highSum.x, lowSum);
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  let highDifference = twoSub(a.x, b.x);
  let lowDifference = prevent_fp64_optimization((a.y - b.y) + highDifference.y);
  return fp64_two_sum_integer(highDifference.x, lowDifference);
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  let highProduct = fp64_two_prod_integer(a.x, b.x);
  let crossTerms = prevent_fp64_optimization(a.x * b.y + a.y * b.x);
  let lowTerms = prevent_fp64_optimization((crossTerms + a.y * b.y) + highProduct.y);
  return fp64_two_sum_integer(highProduct.x, lowTerms);
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let estimate = prevent_fp64_optimization(1.0 / b.x);
  let quotient = mul_fp64(a, vec2f(estimate, fp64_runtime_zero()));
  let remainder = prevent_fp64_optimization(sub_fp64(a, mul_fp64(b, quotient)).x);
  return sum_fp64(quotient, twoProd(estimate, remainder));
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  if (a.x == 0.0 && a.y == 0.0) {
    return vec2f(0.0, 0.0);
  }
  if (a.x < 0.0) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  let reciprocalRoot = prevent_fp64_optimization(1.0 / sqrt(a.x));
  let estimate = prevent_fp64_optimization(a.x * reciprocalRoot);
  let difference = prevent_fp64_optimization(sub_fp64(a, twoSqr(estimate)).x);
  let correction = twoProd(prevent_fp64_optimization(reciprocalRoot * 0.5), difference);
  return sum_fp64(vec2f(estimate, 0.0), correction);
}
#endif
`}
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
`,fs:Da,vs:Da,defaultUniforms:{ONE:1,SPLIT:4097},uniformTypes:{ONE:`f32`,SPLIT:`f32`},fp64ify:xa,fp64LowPart:Sa,fp64ifyMatrix4:Ca},Aa={props:{},uniforms:{},name:`picking`,uniformTypes:{isActive:`f32`,isAttribute:`f32`,isHighlightActive:`f32`,useByteColors:`f32`,highlightedObjectColor:`vec3<f32>`,highlightColor:`vec4<f32>`},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:[0,1,1,1]},vs:`layout(std140) uniform pickingUniforms {
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
`,getUniforms:ja};function ja(e={},t){let n={},r=wa(e.useByteColors,!0);return e.highlightedObjectColor===void 0||(e.highlightedObjectColor===null?n.isHighlightActive=!1:(n.isHighlightActive=!0,n.highlightedObjectColor=e.highlightedObjectColor.slice(0,3))),e.highlightColor&&(n.highlightColor=Ea(e.highlightColor,r)),e.isActive!==void 0&&(n.isActive=!!e.isActive,n.isAttribute=!!e.isAttribute),e.useByteColors!==void 0&&(n.useByteColors=!!e.useByteColors),n}var Ma=`precision highp int;

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

layout(std140) uniform lightingUniforms {
  int enabled;
  int directionalLightCount;
  int pointLightCount;
  int spotLightCount;
  vec3 ambientColor;
  UniformLight lights[5];
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
`,Na=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
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

struct lightingUniforms {
  enabled: i32,
  directionalLightCount: i32,
  pointLightCount: i32,
  spotLightCount: i32,
  ambientColor: vec3<f32>,
  lights: array<UniformLight, 5>,
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
`,Pa=5,Fa={props:{},uniforms:{},name:`lighting`,defines:{},uniformTypes:{enabled:`i32`,directionalLightCount:`i32`,pointLightCount:`i32`,spotLightCount:`i32`,ambientColor:`vec3<f32>`,lights:[{color:`vec3<f32>`,position:`vec3<f32>`,direction:`vec3<f32>`,attenuation:`vec3<f32>`,coneCos:`vec2<f32>`},Pa]},defaultUniforms:Ba(),bindingLayout:[{name:`lighting`,group:2}],firstBindingSlot:0,source:Na,vs:Ma,fs:Ma,getUniforms:Ia};function Ia(e,t={}){if(e&&={...e},!e)return Ba();e.lights&&(e={...e,...Ra(e.lights),lights:void 0});let{useByteColors:n,ambientLight:r,pointLights:i,spotLights:a,directionalLights:o}=e||{};if(!(r||i&&i.length>0||a&&a.length>0||o&&o.length>0))return{...Ba(),enabled:0};let s={...Ba(),...La({useByteColors:n,ambientLight:r,pointLights:i,spotLights:a,directionalLights:o})};return e.enabled!==void 0&&(s.enabled=e.enabled?1:0),s}function La({useByteColors:t,ambientLight:n,pointLights:r=[],spotLights:i=[],directionalLights:a=[]}){let o=Va(),s=0,c=0,l=0,u=0;for(let e of r){if(s>=Pa)break;o[s]={...o[s],color:za(e,t),position:e.position,attenuation:e.attenuation||[1,0,0]},s++,c++}for(let e of i){if(s>=Pa)break;o[s]={...o[s],color:za(e,t),position:e.position,direction:e.direction,attenuation:e.attenuation||[1,0,0],coneCos:Ua(e)},s++,l++}for(let e of a){if(s>=Pa)break;o[s]={...o[s],color:za(e,t),direction:e.direction},s++,u++}return r.length+i.length+a.length>Pa&&e.warn(`MAX_LIGHTS exceeded, truncating to ${Pa}`)(),{ambientColor:za(n,t),directionalLightCount:u,pointLightCount:c,spotLightCount:l,lights:o}}function Ra(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let n of e||[])switch(n.type){case`ambient`:t.ambientLight=n;break;case`directional`:t.directionalLights?.push(n);break;case`point`:t.pointLights?.push(n);break;case`spot`:t.spotLights?.push(n);break;default:}return t}function za(e={},t){let{color:n=[0,0,0],intensity:r=1}=e;return Ta(n,wa(t,!0)).map(e=>e*r)}function Ba(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:Va()}}function Va(){return Array.from({length:Pa},()=>Ha())}function Ha(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function Ua(e){let t=e.innerConeAngle??0,n=e.outerConeAngle??Math.PI/4;return[Math.cos(t),Math.cos(n)]}var Wa={name:`lambertMaterial`,firstBindingSlot:0,bindingLayout:[{name:`lambertMaterial`,group:3}],dependencies:[Fa],source:`struct lambertMaterialUniforms {
  unlit: u32,
  ambient: f32,
  diffuse: f32,
};

@group(3) @binding(auto) var<uniform> lambertMaterial : lambertMaterialUniforms;

fn lighting_getLightColor(surfaceColor: vec3<f32>, light_direction: vec3<f32>, normal_worldspace: vec3<f32>, color: vec3<f32>) -> vec3<f32> {
  let lambertian: f32 = max(dot(light_direction, normal_worldspace), 0.0);
  return lambertian * lambertMaterial.diffuse * surfaceColor * color;
}

fn lighting_getLightColor2(surfaceColor: vec3<f32>, cameraPosition: vec3<f32>, position_worldspace: vec3<f32>, normal_worldspace: vec3<f32>) -> vec3<f32> {
  var lightColor: vec3<f32> = surfaceColor;

  if (lambertMaterial.unlit != 0u) {
    return surfaceColor;
  }

  if (lighting.enabled == 0) {
    return lightColor;
  }

  lightColor = lambertMaterial.ambient * surfaceColor * lighting.ambientColor;

  for (var i: i32 = 0; i < lighting.pointLightCount; i++) {
    let pointLight: PointLight = lighting_getPointLight(i);
    let light_position_worldspace: vec3<f32> = pointLight.position;
    let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
    let light_attenuation = getPointLightAttenuation(
      pointLight,
      distance(light_position_worldspace, position_worldspace)
    );
    lightColor += lighting_getLightColor(
      surfaceColor,
      light_direction,
      normal_worldspace,
      pointLight.color / light_attenuation
    );
  }

  for (var i: i32 = 0; i < lighting.spotLightCount; i++) {
    let spotLight: SpotLight = lighting_getSpotLight(i);
    let light_position_worldspace: vec3<f32> = spotLight.position;
    let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
    let light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    lightColor += lighting_getLightColor(
      surfaceColor,
      light_direction,
      normal_worldspace,
      spotLight.color / light_attenuation
    );
  }

  for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
    let directionalLight: DirectionalLight = lighting_getDirectionalLight(i);
    lightColor += lighting_getLightColor(
      surfaceColor,
      -directionalLight.direction,
      normal_worldspace,
      directionalLight.color
    );
  }

  return lightColor;
}
`,vs:`layout(std140) uniform lambertMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
} material;
`,fs:`layout(std140) uniform lambertMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
} material;

vec3 lambert_getLightColor(vec3 surfaceColor, vec3 light_direction, vec3 normal_worldspace, vec3 color) {
  float lambertian = max(dot(light_direction, normal_worldspace), 0.0);
  return lambertian * material.diffuse * surfaceColor * color;
}

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 cameraPosition, vec3 position_worldspace, vec3 normal_worldspace) {
  vec3 lightColor = surfaceColor;

  if (material.unlit) {
    return surfaceColor;
  }

  if (lighting.enabled == 0) {
    return lightColor;
  }

  lightColor = material.ambient * surfaceColor * lighting.ambientColor;

  for (int i = 0; i < lighting.pointLightCount; i++) {
    PointLight pointLight = lighting_getPointLight(i);
    vec3 light_position_worldspace = pointLight.position;
    vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
    float light_attenuation = getPointLightAttenuation(pointLight, distance(light_position_worldspace, position_worldspace));
    lightColor += lambert_getLightColor(surfaceColor, light_direction, normal_worldspace, pointLight.color / light_attenuation);
  }

  for (int i = 0; i < lighting.spotLightCount; i++) {
    SpotLight spotLight = lighting_getSpotLight(i);
    vec3 light_position_worldspace = spotLight.position;
    vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
    float light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    lightColor += lambert_getLightColor(surfaceColor, light_direction, normal_worldspace, spotLight.color / light_attenuation);
  }

  for (int i = 0; i < lighting.directionalLightCount; i++) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(i);
    lightColor += lambert_getLightColor(surfaceColor, -directionalLight.direction, normal_worldspace, directionalLight.color);
  }

  return lightColor;
}
`,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:`i32`,ambient:`f32`,diffuse:`f32`},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6},getUniforms(e){return{...Wa.defaultUniforms,...e}}},Ga={name:`valueNoise`,fs:`
float valueNoise_hash(vec2 cell) {
  vec3 value = fract(vec3(cell.x, cell.y, cell.x) * 0.1031);
  value += dot(value, value.yzx + 33.33);
  return fract((value.x + value.y) * value.z);
}
float valueNoise_noise(vec2 position) {
  vec2 cell = floor(position);
  vec2 fraction = fract(position);
  vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
  return mix(mix(valueNoise_hash(cell), valueNoise_hash(cell + vec2(1.0, 0.0)), blend.x),
    mix(valueNoise_hash(cell + vec2(0.0, 1.0)), valueNoise_hash(cell + vec2(1.0)), blend.x), blend.y);
}

float valueNoise_hash3(vec3 cell) {
  vec3 value = fract(cell * 0.1031);
  value += dot(value, value.yzx + 33.33);
  return fract((value.x + value.y) * value.z);
}
float valueNoise_noise3(vec3 position) {
  vec3 cell = floor(position);
  vec3 fraction = fract(position);
  vec3 blend = fraction * fraction * (3.0 - 2.0 * fraction);
  float bottom = mix(mix(valueNoise_hash3(cell), valueNoise_hash3(cell + vec3(1.0, 0.0, 0.0)), blend.x),
    mix(valueNoise_hash3(cell + vec3(0.0, 1.0, 0.0)), valueNoise_hash3(cell + vec3(1.0, 1.0, 0.0)), blend.x), blend.y);
  float top = mix(mix(valueNoise_hash3(cell + vec3(0.0, 0.0, 1.0)), valueNoise_hash3(cell + vec3(1.0, 0.0, 1.0)), blend.x),
    mix(valueNoise_hash3(cell + vec3(0.0, 1.0, 1.0)), valueNoise_hash3(cell + vec3(1.0)), blend.x), blend.y);
  return mix(bottom, top, blend.z);
}
`,source:`
fn valueNoise_hash(cell: vec2f) -> f32 {
  var value = fract(vec3f(cell.x, cell.y, cell.x) * 0.1031);
  value += vec3f(dot(value, value.yzx + vec3f(33.33)));
  return fract((value.x + value.y) * value.z);
}
fn valueNoise_noise(position: vec2f) -> f32 {
  let cell = floor(position);
  let fraction = fract(position);
  let blend = fraction * fraction * (vec2f(3.0) - 2.0 * fraction);
  return mix(mix(valueNoise_hash(cell), valueNoise_hash(cell + vec2f(1.0, 0.0)), blend.x),
    mix(valueNoise_hash(cell + vec2f(0.0, 1.0)), valueNoise_hash(cell + vec2f(1.0)), blend.x), blend.y);
}

fn valueNoise_hash3(cell: vec3f) -> f32 {
  var value = fract(cell * 0.1031);
  value += vec3f(dot(value, value.yzx + vec3f(33.33)));
  return fract((value.x + value.y) * value.z);
}
fn valueNoise_noise3(position: vec3f) -> f32 {
  let cell = floor(position);
  let fraction = fract(position);
  let blend = fraction * fraction * (vec3f(3.0) - 2.0 * fraction);
  let bottom = mix(mix(valueNoise_hash3(cell), valueNoise_hash3(cell + vec3f(1.0, 0.0, 0.0)), blend.x),
    mix(valueNoise_hash3(cell + vec3f(0.0, 1.0, 0.0)), valueNoise_hash3(cell + vec3f(1.0, 1.0, 0.0)), blend.x), blend.y);
  let top = mix(mix(valueNoise_hash3(cell + vec3f(0.0, 0.0, 1.0)), valueNoise_hash3(cell + vec3f(1.0, 0.0, 1.0)), blend.x),
    mix(valueNoise_hash3(cell + vec3f(0.0, 1.0, 1.0)), valueNoise_hash3(cell + vec3f(1.0)), blend.x), blend.y);
  return mix(bottom, top, blend.z);
}
`},Ka={coreRadius:.12,coreIntensity:1,haloIntensity:.6,falloff:5},qa={name:`pointGlow`,firstBindingSlot:0,bindingLayout:[{name:`pointGlow`,group:3}],uniformTypes:{coreRadius:`f32`,coreIntensity:`f32`,haloIntensity:`f32`,falloff:`f32`},defaultUniforms:Ka,getUniforms(e={},t=Ka){let n={...Ka,...t};return e.coreRadius!==void 0&&(n.coreRadius=Math.min(1,Math.max(0,e.coreRadius))),e.coreIntensity!==void 0&&(n.coreIntensity=Math.max(0,e.coreIntensity)),e.haloIntensity!==void 0&&(n.haloIntensity=Math.max(0,e.haloIntensity)),e.falloff!==void 0&&(n.falloff=Math.max(.01,e.falloff)),n},fs:`
layout(std140) uniform pointGlowUniforms {
  float coreRadius;
  float coreIntensity;
  float haloIntensity;
  float falloff;
} pointGlow;

// Coordinates span [-1, 1] across the sprite; tint is linear RGB.
vec3 pointGlow_getColor(vec2 coordinates, vec3 tint) {
  float radius = length(coordinates);
  float edgeWidth = max(fwidth(radius), 0.0001);
  float envelope = 1.0 - smoothstep(1.0 - edgeWidth, 1.0, radius);
  float core = 1.0 - smoothstep(pointGlow.coreRadius - edgeWidth * 0.5,
    pointGlow.coreRadius + edgeWidth * 0.5, radius);
  if (pointGlow.coreRadius <= 0.0) core = 0.0;
  float outer = exp(-pointGlow.falloff);
  float halo = max(0.0, (exp(-pointGlow.falloff * radius * radius) - outer) / (1.0 - outer));
  return (vec3(core * pointGlow.coreIntensity) + tint * halo * pointGlow.haloIntensity) * envelope;
}
`,source:`
struct pointGlowUniforms {
  coreRadius: f32,
  coreIntensity: f32,
  haloIntensity: f32,
  falloff: f32,
};
@group(3) @binding(auto) var<uniform> pointGlow: pointGlowUniforms;

fn pointGlow_getColor(coordinates: vec2<f32>, tint: vec3<f32>) -> vec3<f32> {
  let radius = length(coordinates);
  let edgeWidth = max(fwidth(radius), 0.0001);
  let envelope = 1.0 - smoothstep(1.0 - edgeWidth, 1.0, radius);
  var core = 1.0 - smoothstep(pointGlow.coreRadius - edgeWidth * 0.5,
    pointGlow.coreRadius + edgeWidth * 0.5, radius);
  if (pointGlow.coreRadius <= 0.0) { core = 0.0; }
  let outer = exp(-pointGlow.falloff);
  let halo = max(0.0, (exp(-pointGlow.falloff * radius * radius) - outer) / (1.0 - outer));
  return (vec3<f32>(core * pointGlow.coreIntensity) + tint * halo * pointGlow.haloIntensity) * envelope;
}
`},Ja={cover:.45,altitude:1e3,thickness:1200,scale:1400,density:.005,time:0,velocity:[14,4],sunDirection:[0,.8,.6],sunColor:[1,.95,.85]},Ya={name:`clouds`,dependencies:[Ga],uniformTypes:{cover:`f32`,altitude:`f32`,thickness:`f32`,scale:`f32`,density:`f32`,time:`f32`,velocity:`vec2<f32>`,sunDirection:`vec3<f32>`,sunColor:`vec3<f32>`},defaultUniforms:Ja,getUniforms(e={},t=Ja){return{...Ja,...t,...e}},fs:`
layout(std140) uniform cloudsUniforms {
  float cover;
  float altitude;
  float thickness;
  float scale;
  float density;
  float time;
  vec2 velocity;
  vec3 sunDirection;
  vec3 sunColor;
} clouds;
// Shared normalized density field for planar slabs and spherical shells.
float clouds_getDensityAt(vec3 coordinate, float height) {
  float envelope = smoothstep(0.0, 0.2, height) * (1.0 - smoothstep(0.65, 1.0, height));
  coordinate += vec3(8.7, 3.2, clouds.time * 0.003);
  float broad = valueNoise_noise3(coordinate);
  float detail = valueNoise_noise3(coordinate * 2.07 + vec3(13.1, 7.3, 2.8));
  float fine = valueNoise_noise3(coordinate * 4.23 + vec3(5.4, 11.7, 8.1));
  float threshold = mix(0.78, 0.18, clamp(clouds.cover, 0.0, 1.0));
  return envelope * smoothstep(threshold, threshold + 0.16, broad * 0.72 + detail * 0.2 + fine * 0.08);
}

float clouds_getDensity(vec3 position) {
  float height = (position.z - clouds.altitude) / max(clouds.thickness, 1.0);
  return clouds_getDensityAt(vec3((position.xy - clouds.velocity * clouds.time) / max(clouds.scale, 1.0), height * 0.8), height);
}
vec3 clouds_getLighting(float density, float sunDensity, float daylight, float silver) {
  vec3 ambient = mix(vec3(0.035, 0.05, 0.085), vec3(0.28, 0.34, 0.42), daylight);
  float sunlight = exp(-(density + sunDensity) * 2.0);
  return ambient + clouds.sunColor * daylight * sunlight * (0.5 + silver * 0.3);
}

// Beer-Lambert extinction toward the sun through the same density used for sky rendering.
float clouds_getTransmittance(vec3 position) {
  if (clouds.cover <= 0.0 || clouds.density <= 0.0) return 1.0;
  vec3 direction = normalize(clouds.sunDirection);
  if (direction.z <= 0.02) return 1.0;
  float start = max((clouds.altitude - position.z) / direction.z, 0.0);
  float end = min((clouds.altitude + clouds.thickness - position.z) / direction.z, 40000.0);
  if (end <= start) return 1.0;
  float stepLength = (end - start) / 16.0;
  float opticalDepth = 0.0;
  for (int sampleIndex = 0; sampleIndex < 16; sampleIndex++) {
    opticalDepth += clouds_getDensity(position + direction * (start + (float(sampleIndex) + 0.5) * stepLength)) * stepLength;
  }
  return exp(-opticalDepth * max(clouds.density, 0.0));
}

vec4 clouds_getColor(vec3 camera, vec3 rayDirection) {
  if (clouds.cover <= 0.0 || clouds.density <= 0.0 || abs(rayDirection.z) < 0.0001) return vec4(0.0);
  float bottom = (clouds.altitude - camera.z) / rayDirection.z;
  float top = (clouds.altitude + max(clouds.thickness, 1.0) - camera.z) / rayDirection.z;
  float start = max(min(bottom, top), 0.0);
  float end = min(max(bottom, top), 20000.0);
  if (end <= start) return vec4(0.0);
  float jitter = valueNoise_hash(rayDirection.xy * 4096.0);
  float stepLength = (end - start) / 64.0;
  vec3 sunDirection = normalize(clouds.sunDirection);
  float daylight = smoothstep(-0.08, 0.18, sunDirection.z);
  float silver = pow(max(dot(rayDirection, sunDirection), 0.0), 12.0);
  vec3 radiance = vec3(0.0);
  float transmittance = 1.0;
  for (int sampleIndex = 0; sampleIndex < 64; sampleIndex++) {
    vec3 position = camera + rayDirection * (start + (float(sampleIndex) + jitter) * stepLength);
    float density = clouds_getDensity(position);
    float sunDensity = clouds_getDensity(position + sunDirection * clouds.thickness * 0.28);
    float alpha = 1.0 - exp(-density * max(clouds.density, 0.0) * stepLength);
    vec3 color = clouds_getLighting(density, sunDensity, daylight, silver);
    radiance += transmittance * alpha * color;
    transmittance *= 1.0 - alpha;
  }
  float distanceFade = 1.0 - smoothstep(10000.0, 20000.0, start);
  return vec4(radiance, 1.0 - transmittance) * distanceFade;
}
`,source:`
struct cloudsUniforms {
  cover: f32,
  altitude: f32,
  thickness: f32,
  scale: f32,
  density: f32,
  time: f32,
  velocity: vec2f,
  sunDirection: vec3f,
  sunColor: vec3f,
};
@group(3) @binding(auto) var<uniform> clouds: cloudsUniforms;
fn clouds_getDensityAt(inputCoordinate: vec3f, height: f32) -> f32 {
  let envelope = smoothstep(0.0, 0.2, height) * (1.0 - smoothstep(0.65, 1.0, height));
  var coordinate = inputCoordinate;
  coordinate += vec3f(8.7, 3.2, clouds.time * 0.003);
  let broad = valueNoise_noise3(coordinate);
  let detail = valueNoise_noise3(coordinate * 2.07 + vec3f(13.1, 7.3, 2.8));
  let fine = valueNoise_noise3(coordinate * 4.23 + vec3f(5.4, 11.7, 8.1));
  let threshold = mix(0.78, 0.18, clamp(clouds.cover, 0.0, 1.0));
  return envelope * smoothstep(threshold, threshold + 0.16, broad * 0.72 + detail * 0.2 + fine * 0.08);
}

fn clouds_getDensity(position: vec3f) -> f32 {
  let height = (position.z - clouds.altitude) / max(clouds.thickness, 1.0);
  return clouds_getDensityAt(vec3f((position.xy - clouds.velocity * clouds.time) / max(clouds.scale, 1.0), height * 0.8), height);
}
fn clouds_getLighting(density: f32, sunDensity: f32, daylight: f32, silver: f32) -> vec3f {
  let ambient = mix(vec3f(0.035, 0.05, 0.085), vec3f(0.28, 0.34, 0.42), daylight);
  let sunlight = exp(-(density + sunDensity) * 2.0);
  return ambient + clouds.sunColor * daylight * sunlight * (0.5 + silver * 0.3);
}

// Beer-Lambert extinction toward the sun through the same density used for sky rendering.
fn clouds_getTransmittance(position: vec3f) -> f32 {
  if (clouds.cover <= 0.0 || clouds.density <= 0.0) { return 1.0; }
  var direction: vec3f = normalize(clouds.sunDirection);
  if (direction.z <= 0.02) { return 1.0; }
  var start: f32 = max((clouds.altitude - position.z) / direction.z, 0.0);
  var end: f32 = min((clouds.altitude + clouds.thickness - position.z) / direction.z, 40000.0);
  if (end <= start) { return 1.0; }
  var stepLength: f32 = (end - start) / 16.0;
  var opticalDepth: f32 = 0.0;
  for (var sampleIndex: i32 = 0; sampleIndex < 16; sampleIndex++) {
    opticalDepth += clouds_getDensity(position + direction * (start + (f32(sampleIndex) + 0.5) * stepLength)) * stepLength;
  }
  return exp(-opticalDepth * max(clouds.density, 0.0));
}

fn clouds_getColor(camera: vec3f, rayDirection: vec3f) -> vec4f {
  if (clouds.cover <= 0.0 || clouds.density <= 0.0 || abs(rayDirection.z) < 0.0001) { return vec4f(0.0); }
  let bottom = (clouds.altitude - camera.z) / rayDirection.z;
  let top = (clouds.altitude + max(clouds.thickness, 1.0) - camera.z) / rayDirection.z;
  let start = max(min(bottom, top), 0.0);
  let end = min(max(bottom, top), 20000.0);
  if (end <= start) { return vec4f(0.0); }
  let jitter = valueNoise_hash(rayDirection.xy * 4096.0);
  let stepLength = (end - start) / 64.0;
  let sunDirection = normalize(clouds.sunDirection);
  let daylight = smoothstep(-0.08, 0.18, sunDirection.z);
  let silver = pow(max(dot(rayDirection, sunDirection), 0.0), 12.0);
  var radiance = vec3f(0.0);
  var transmittance = 1.0;
  for (var sampleIndex = 0; sampleIndex < 64; sampleIndex++) {
    let position = camera + rayDirection * (start + (f32(sampleIndex) + jitter) * stepLength);
    let density = clouds_getDensity(position);
    let sunDensity = clouds_getDensity(position + sunDirection * clouds.thickness * 0.28);
    let alpha = 1.0 - exp(-density * max(clouds.density, 0.0) * stepLength);
    let color = clouds_getLighting(density, sunDensity, daylight, silver);
    radiance += transmittance * alpha * color;
    transmittance *= 1.0 - alpha;
  }
  let distanceFade = 1.0 - smoothstep(10000.0, 20000.0, start);
  return vec4f(radiance, 1.0 - transmittance) * distanceFade;
}
`},Xa={enabled:1,sunDirection:[0,.8,.6],sunIntensity:20,haze:1,rayleigh:1,planetRadius:6371e3,exposure:1,groundColor:[.18,.17,.14]},Za={name:`atmosphere`,uniformTypes:{enabled:`f32`,sunDirection:`vec3<f32>`,sunIntensity:`f32`,haze:`f32`,rayleigh:`f32`,planetRadius:`f32`,exposure:`f32`,groundColor:`vec3<f32>`},defaultUniforms:Xa,getUniforms(e={},t=Xa){return{...Xa,...t,...e}},fs:`
layout(std140) uniform atmosphereUniforms {
  float enabled;
  vec3 sunDirection;
  float sunIntensity;
  float haze;
  float rayleigh;
  float planetRadius;
  float exposure;
  vec3 groundColor;
} atmosphere;
struct AtmosphereSample {
  vec3 radiance;
  vec3 transmittance;
};

vec2 atmosphere_intersectSphere(vec3 origin, vec3 direction, float radius) {
  float projected = dot(origin, direction);
  float discriminant = projected * projected - (dot(origin.xy, origin.xy) + (origin.z - radius) * (origin.z + radius));
  if (discriminant < 0.0) return vec2(-1.0);
  float root = sqrt(discriminant);
  return vec2(-projected - root, -projected + root);
}
vec2 atmosphere_getDensity(vec3 position) {
  float height = max(length(position) - atmosphere.planetRadius, 0.0);
  return exp(-vec2(height / 8000.0, height / 1200.0));
}
AtmosphereSample atmosphere_getScattering(vec3 camera, vec3 direction, float distanceLimit) {
  AtmosphereSample result;
  result.radiance = vec3(0.0);
  result.transmittance = vec3(1.0);
  if (atmosphere.enabled < 0.5 || distanceLimit <= 0.0) return result;
  vec3 origin = vec3(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));
  vec2 shell = atmosphere_intersectSphere(origin, direction, atmosphere.planetRadius + 100000.0);
  float start = max(shell.x, 0.0);
  float end = min(shell.y, distanceLimit);
  vec2 ground = atmosphere_intersectSphere(origin, direction, atmosphere.planetRadius);
  if (ground.x > 0.0) end = min(end, ground.x);
  if (end <= start) return result;
  vec3 sunlight = normalize(atmosphere.sunDirection);
  vec3 rayleigh = vec3(0.0000058, 0.0000135, 0.0000331) * max(atmosphere.rayleigh, 0.0);
  vec3 mie = vec3(0.000021) * max(atmosphere.haze, 0.0);
  float cosine = dot(direction, sunlight);
  float rayleighPhase = 0.0596831 * (1.0 + cosine * cosine);
  float asymmetry = 0.76;
  float miePhase = (1.0 - asymmetry * asymmetry) / (12.566371 * pow(max(1.0 + asymmetry * asymmetry - 2.0 * asymmetry * cosine, 0.001), 1.5));
  float stepLength = (end - start) / 12.0;
  vec2 opticalDepth = vec2(0.0);
  vec3 radiance = vec3(0.0);
  for (int sampleIndex = 0; sampleIndex < 12; sampleIndex++) {
    vec3 position = origin + direction * (start + (float(sampleIndex) + 0.5) * stepLength);
    vec2 density = atmosphere_getDensity(position);
    vec2 centerDepth = opticalDepth + density * stepLength * 0.5;
    opticalDepth += density * stepLength;
    vec2 solarGround = atmosphere_intersectSphere(position, sunlight, atmosphere.planetRadius);
    if (solarGround.x > 0.0) continue;
    float solarDistance = max(atmosphere_intersectSphere(position, sunlight, atmosphere.planetRadius + 100000.0).y, 0.0);
    float solarStep = solarDistance / 4.0;
    vec2 solarDepth = vec2(0.0);
    for (int solarIndex = 0; solarIndex < 4; solarIndex++) {
      solarDepth += atmosphere_getDensity(position + sunlight * ((float(solarIndex) + 0.5) * solarStep)) * solarStep;
    }
    vec3 attenuation = exp(-rayleigh * (centerDepth.x + solarDepth.x) - mie * (centerDepth.y + solarDepth.y));
    radiance += attenuation * (rayleigh * density.x * rayleighPhase + mie * density.y * miePhase) * stepLength;
  }
  result.radiance = radiance * max(atmosphere.sunIntensity, 0.0);
  result.transmittance = exp(-rayleigh * opticalDepth.x - mie * opticalDepth.y);
  return result;
}
vec3 atmosphere_getSkyColor(vec3 camera, vec3 direction) {
  if (atmosphere.enabled < 0.5) return vec3(0.0);
  AtmosphereSample scatteringSample = atmosphere_getScattering(camera, normalize(direction), 1000000.0);
  vec3 origin = vec3(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));
  vec3 sunlight = normalize(atmosphere.sunDirection);
  float groundDistance = atmosphere_intersectSphere(origin, normalize(direction), atmosphere.planetRadius).x;
  if (groundDistance > 0.0 && sunlight.z > 0.0) {
    // Approximate direct irradiance at the ground boundary, attenuated on its way to the eye.
    float elevation = max(sunlight.z, 0.02);
    vec3 extinction = vec3(0.0000058, 0.0000135, 0.0000331) * max(atmosphere.rayleigh, 0.0) * 8000.0
      + vec3(0.000021) * max(atmosphere.haze, 0.0) * 1200.0;
    scatteringSample.radiance += atmosphere.groundColor * atmosphere.sunIntensity * sunlight.z / 3.141593
      * exp(-extinction / elevation) * scatteringSample.transmittance;
  }
  return vec3(1.0) - exp(-scatteringSample.radiance * atmosphere.exposure);
}
vec4 atmosphere_getColor(vec4 color, vec3 position, vec3 camera) {
  vec3 difference = position - camera;
  float distance = length(difference);
  if (distance < 0.001 || atmosphere.enabled < 0.5) return color;
  AtmosphereSample scatteringSample = atmosphere_getScattering(camera, difference / distance, distance);
  vec3 scattering = vec3(1.0) - exp(-scatteringSample.radiance * atmosphere.exposure);
  return vec4(color.rgb * scatteringSample.transmittance + scattering, color.a);
}
`,source:`
struct atmosphereUniforms {
  enabled: f32,
  sunDirection: vec3f,
  sunIntensity: f32,
  haze: f32,
  rayleigh: f32,
  planetRadius: f32,
  exposure: f32,
  groundColor: vec3f,
};
@group(3) @binding(auto) var<uniform> atmosphere: atmosphereUniforms;
struct AtmosphereSample { radiance: vec3f,
  transmittance: vec3f };

fn atmosphere_intersectSphere(origin: vec3f,
  direction: vec3f,
  radius: f32) -> vec2f {
  var projected: f32 = dot(origin, direction);
  var discriminant: f32 = projected * projected - (dot(origin.xy, origin.xy) + (origin.z - radius) * (origin.z + radius));
  if (discriminant < 0.0) { return vec2f(-1.0); }
  var root: f32 = sqrt(discriminant);
  return vec2f(-projected - root, -projected + root);
}
fn atmosphere_getDensity(position: vec3f) -> vec2f {
  var height: f32 = max(length(position) - atmosphere.planetRadius, 0.0);
  return exp(-vec2f(height / 8000.0, height / 1200.0));
}
fn atmosphere_getScattering(camera: vec3f,
  direction: vec3f,
  distanceLimit: f32) -> AtmosphereSample {
  var result: AtmosphereSample;
  result.radiance = vec3f(0.0);
  result.transmittance = vec3f(1.0);
  if (atmosphere.enabled < 0.5 || distanceLimit <= 0.0) { return result; }
  var origin: vec3f = vec3f(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));
  var shell: vec2f = atmosphere_intersectSphere(origin, direction, atmosphere.planetRadius + 100000.0);
  var start: f32 = max(shell.x, 0.0);
  var end: f32 = min(shell.y, distanceLimit);
  var ground: vec2f = atmosphere_intersectSphere(origin, direction, atmosphere.planetRadius);
  if (ground.x > 0.0) { end = min(end, ground.x); }
  if (end <= start) { return result; }
  var sunlight: vec3f = normalize(atmosphere.sunDirection);
  var rayleigh: vec3f = vec3f(0.0000058, 0.0000135, 0.0000331) * max(atmosphere.rayleigh, 0.0);
  var mie: vec3f = vec3f(0.000021) * max(atmosphere.haze, 0.0);
  var cosine: f32 = dot(direction, sunlight);
  var rayleighPhase: f32 = 0.0596831 * (1.0 + cosine * cosine);
  var asymmetry: f32 = 0.76;
  var miePhase: f32 = (1.0 - asymmetry * asymmetry) / (12.566371 * pow(max(1.0 + asymmetry * asymmetry - 2.0 * asymmetry * cosine, 0.001), 1.5));
  var stepLength: f32 = (end - start) / 12.0;
  var opticalDepth: vec2f = vec2f(0.0);
  var radiance: vec3f = vec3f(0.0);
  for (var sampleIndex: i32 = 0; sampleIndex < 12; sampleIndex++) {
    var position: vec3f = origin + direction * (start + (f32(sampleIndex) + 0.5) * stepLength);
    var density: vec2f = atmosphere_getDensity(position);
    var centerDepth: vec2f = opticalDepth + density * stepLength * 0.5;
    opticalDepth += density * stepLength;
    var solarGround: vec2f = atmosphere_intersectSphere(position, sunlight, atmosphere.planetRadius);
    if (solarGround.x > 0.0) { continue; }
    var solarDistance: f32 = max(atmosphere_intersectSphere(position, sunlight, atmosphere.planetRadius + 100000.0).y, 0.0);
    var solarStep: f32 = solarDistance / 4.0;
    var solarDepth: vec2f = vec2f(0.0);
    for (var solarIndex: i32 = 0; solarIndex < 4; solarIndex++) {
      solarDepth += atmosphere_getDensity(position + sunlight * ((f32(solarIndex) + 0.5) * solarStep)) * solarStep;
    }
    var attenuation: vec3f = exp(-rayleigh * (centerDepth.x + solarDepth.x) - mie * (centerDepth.y + solarDepth.y));
    radiance += attenuation * (rayleigh * density.x * rayleighPhase + mie * density.y * miePhase) * stepLength;
  }
  result.radiance = radiance * max(atmosphere.sunIntensity, 0.0);
  result.transmittance = exp(-rayleigh * opticalDepth.x - mie * opticalDepth.y);
  return result;
}
fn atmosphere_getSkyColor(camera: vec3f,
  direction: vec3f) -> vec3f {
  if (atmosphere.enabled < 0.5) { return vec3f(0.0); }
  var scatteringSample: AtmosphereSample = atmosphere_getScattering(camera, normalize(direction), 1000000.0);
  let origin = vec3f(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));
  let sunlight = normalize(atmosphere.sunDirection);
  let groundDistance = atmosphere_intersectSphere(origin, normalize(direction), atmosphere.planetRadius).x;
  if (groundDistance > 0.0 && sunlight.z > 0.0) {
    // Approximate direct irradiance at the ground boundary, attenuated on its way to the eye.
    let elevation = max(sunlight.z, 0.02);
    let extinction = vec3f(0.0000058, 0.0000135, 0.0000331) * max(atmosphere.rayleigh, 0.0) * 8000.0
      + vec3f(0.000021) * max(atmosphere.haze, 0.0) * 1200.0;
    scatteringSample.radiance += atmosphere.groundColor * atmosphere.sunIntensity * sunlight.z / 3.141593
      * exp(-extinction / elevation) * scatteringSample.transmittance;
  }
  return vec3f(1.0) - exp(-scatteringSample.radiance * atmosphere.exposure);
}
fn atmosphere_getColor(color: vec4f,
  position: vec3f,
  camera: vec3f) -> vec4f {
  var difference: vec3f = position - camera;
  var distance: f32 = length(difference);
  if (distance < 0.001 || atmosphere.enabled < 0.5) { return color; }
  var scatteringSample: AtmosphereSample = atmosphere_getScattering(camera, difference / distance, distance);
  var scattering: vec3f = vec3f(1.0) - exp(-scatteringSample.radiance * atmosphere.exposure);
  return vec4f(color.rgb * scatteringSample.transmittance + scattering, color.a);
}
`},Qa=`struct LayerUniforms {
  opacity: f32,
};

@group(0) @binding(auto)
var<uniform> layer: LayerUniforms;
`,$a=`layout(std140) uniform layerUniforms {
  uniform float opacity;
} layer;
`,eo={name:`layer`,source:Qa,vs:$a,fs:$a,getUniforms:e=>({opacity:e.opacity**(1/2.2)}),uniformTypes:{opacity:`f32`}},to=`const SMOOTH_EDGE_RADIUS: f32 = 0.5;

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
`,no=`#define SMOOTH_EDGE_RADIUS 0.5`,ro={name:`geometry`,source:to,vs:`\
${no}

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
${no}

struct FragmentGeometry {
  vec2 uv;
};
FragmentGeometry geometry;

float smoothedge(float edge, float x) {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`},z;(function(e){e[e.Start=1]=`Start`,e[e.Move=2]=`Move`,e[e.End=4]=`End`,e[e.Cancel=8]=`Cancel`})(z||={});var B;(function(e){e[e.None=0]=`None`,e[e.Left=1]=`Left`,e[e.Right=2]=`Right`,e[e.Up=4]=`Up`,e[e.Down=8]=`Down`,e[e.Horizontal=3]=`Horizontal`,e[e.Vertical=12]=`Vertical`,e[e.All=15]=`All`})(B||={});var V;(function(e){e[e.Possible=1]=`Possible`,e[e.Began=2]=`Began`,e[e.Changed=4]=`Changed`,e[e.Ended=8]=`Ended`,e[e.Recognized=8]=`Recognized`,e[e.Cancelled=16]=`Cancelled`,e[e.Failed=32]=`Failed`})(V||={});var io=`auto`,ao=`manipulation`,oo=`none`,so=`pan-x`,co=`pan-y`;function lo(e){if(e.includes(`none`))return oo;let t=e.includes(so),n=e.includes(co);return t&&n?oo:t||n?t?so:co:e.includes(`manipulation`)?ao:io}var uo=class{constructor(e,t){this.actions=``,this.manager=e,this.set(t)}set(e){e===`compute`&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));return lo(e.join(` `))}};function fo(e){return e.trim().split(/\s+/g)}function po(e,t,n){if(e)for(let r of fo(t))e.addEventListener(r,n,!1)}function mo(e,t,n){if(e)for(let r of fo(t))e.removeEventListener(r,n,!1)}function ho(e){return(e.ownerDocument||e).defaultView}function go(e,t){let n=e;for(;n;){if(n===t)return!0;n=n.parentNode}return!1}function _o(e){let t=e.length;if(t===1)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let n=0,r=0,i=0;for(;i<t;)n+=e[i].clientX,r+=e[i].clientY,i++;return{x:Math.round(n/t),y:Math.round(r/t)}}function vo(e){let t=[],n=0;for(;n<e.pointers.length;)t[n]={clientX:Math.round(e.pointers[n].clientX),clientY:Math.round(e.pointers[n].clientY)},n++;return{timeStamp:Date.now(),pointers:t,center:_o(t),deltaX:e.deltaX,deltaY:e.deltaY}}function yo(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.sqrt(n*n+r*r)}function bo(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.sqrt(n*n+r*r)}function xo(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.atan2(r,n)*180/Math.PI}function So(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.atan2(r,n)*180/Math.PI}function Co(e,t){return e===t?B.None:Math.abs(e)>=Math.abs(t)?e<0?B.Left:B.Right:t<0?B.Up:B.Down}function wo(e,t){let n=t.center,r=e.offsetDelta,i=e.prevDelta,a=e.prevInput;return(t.eventType===z.Start||a?.eventType===z.End)&&(i=e.prevDelta={x:a?.deltaX||0,y:a?.deltaY||0},r=e.offsetDelta={x:n.x,y:n.y}),{deltaX:i.x+(n.x-r.x),deltaY:i.y+(n.y-r.y)}}function To(e,t,n){return{x:t/e||0,y:n/e||0}}function Eo(e,t){return bo(t[0],t[1])/bo(e[0],e[1])}function Do(e,t){return So(t[1],t[0])-So(e[1],e[0])}function Oo(e,t){let n=e.lastInterval||t,r=t.timeStamp-n.timeStamp,i,a,o,s;if(t.eventType!==z.Cancel&&(r>25||n.velocity===void 0)){let c=t.deltaX-n.deltaX,l=t.deltaY-n.deltaY,u=To(r,c,l);a=u.x,o=u.y,i=Math.abs(u.x)>Math.abs(u.y)?u.x:u.y,s=Co(c,l),e.lastInterval=t}else i=n.velocity,a=n.velocityX,o=n.velocityY,s=n.direction;t.velocity=i,t.velocityX=a,t.velocityY=o,t.direction=s}function ko(e,t){return`pointerId`in e?e.pointerId:t}function Ao(e,t){e.movementOrigin=new Map(t.map((e,t)=>[ko(e,t),{clientX:e.clientX,clientY:e.clientY}])),e.firstMovementTime=void 0}function jo(e,t){let n=t.pointers.map(ko);if(e.movementOrigin?.size===n.length&&n.every(t=>e.movementOrigin.has(t))||Ao(e,t.pointers),t.distancePerPointer=t.pointers.map((t,r)=>bo(e.movementOrigin.get(n[r]),t)),t.eventType&z.Move&&t.distancePerPointer.some(e=>e>0)&&(e.firstMovementTime??=t.timeStamp),t.movementDeltaTime=e.firstMovementTime===void 0?0:t.timeStamp-e.firstMovementTime,t.eventType&(z.End|z.Cancel)){let r=t.changedPointers.map(e=>ko(e,t.pointers.indexOf(e)));Ao(e,t.pointers.filter((e,t)=>!r.includes(n[t])))}}function Mo(e,t){let{session:n}=e,{pointers:r}=t,{length:i}=r;n.firstInput||=vo(t),i>1&&!n.firstMultiple?n.firstMultiple=vo(t):i===1&&(n.firstMultiple=!1);let{firstInput:a,firstMultiple:o}=n,s=o?o.center:a.center,c=t.center=_o(r);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-a.timeStamp,jo(n,t),t.angle=xo(s,c),t.distance=yo(s,c);let{deltaX:l,deltaY:u}=wo(n,t);t.deltaX=l,t.deltaY=u,t.offsetDirection=Co(t.deltaX,t.deltaY);let d=To(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=d.x,t.overallVelocityY=d.y,t.overallVelocity=Math.abs(d.x)>Math.abs(d.y)?d.x:d.y,t.scale=o?Eo(o.pointers,r):1,t.rotation=o?Do(o.pointers,r):0,t.maxPointers=n.prevInput?t.pointers.length>n.prevInput.maxPointers?t.pointers.length:n.prevInput.maxPointers:t.pointers.length;let f=e.element;return go(t.srcEvent.target,f)&&(f=t.srcEvent.target),t.target=f,Oo(n,t),t}function No(e,t,n){let r=n.pointers.length,i=n.changedPointers.length,a=t&z.Start&&r-i===0,o=t&(z.End|z.Cancel)&&r-i===0;n.isFirst=!!a,n.isFinal=!!o,a&&(e.session={}),n.eventType=t;let s=Mo(e,n);e.emit(`hammer.input`,s),e.recognize(s),e.session.prevInput=s}var Po=class{constructor(e){this.evEl=``,this.evWin=``,this.evTarget=``,this.domHandler=e=>{this.manager.options.enable&&this.handler(e)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){No(this.manager,e,t)}init(){po(this.element,this.evEl,this.domHandler),po(this.target,this.evTarget,this.domHandler),po(ho(this.element),this.evWin,this.domHandler)}destroy(){mo(this.element,this.evEl,this.domHandler),mo(this.target,this.evTarget,this.domHandler),mo(ho(this.element),this.evWin,this.domHandler)}},Fo={pointerdown:z.Start,pointermove:z.Move,pointerup:z.End,pointercancel:z.Cancel,pointerout:z.Cancel},Io=`pointerdown`,Lo=`pointermove pointerup pointercancel`,Ro=class extends Po{constructor(e){super(e),this.evEl=Io,this.evWin=Lo,this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,n=!1,r=Fo[e.type],i=e.pointerType,a=i===`touch`,o=t.findIndex(t=>t.pointerId===e.pointerId);r&z.Start&&(e.buttons||a)?o<0&&(t.push(e),o=t.length-1):r&(z.End|z.Cancel)&&(n=!0),!(o<0)&&(t[o]=e,this.callback(r,{pointers:t,changedPointers:[e],eventType:r,pointerType:i,srcEvent:e}),n&&t.splice(o,1))}},zo=[``,`webkit`,`Moz`,`MS`,`ms`,`o`];function Bo(e,t){let n=t[0].toUpperCase()+t.slice(1);for(let r of zo){let i=r?r+n:t;if(i in e)return i}}var Vo=1,Ho=2,Uo={touchAction:`compute`,enable:!0,inputTarget:null,cssProps:{userSelect:`none`,userDrag:`none`,touchCallout:`none`,tapHighlightColor:`rgba(0,0,0,0)`}},Wo=class{constructor(e,t){this.options={...Uo,...t,cssProps:{...Uo.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new Ro(this),this.touchAction=new uo(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?Ho:Vo}recognize(e){let{session:t}=this;if(t.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let n,{recognizers:r}=this,{curRecognizer:i}=t;(!i||i&&i.state&V.Recognized)&&(i=t.curRecognizer=null);let a=0;for(;a<r.length;)n=r[a],t.stopped!==Ho&&(!i||n===i||n.canRecognizeWith(i))?n.recognize(e):n.reset(),!i&&n.state&(V.Began|V.Changed|V.Ended)&&(i=t.curRecognizer=n),a++}get(e){let{recognizers:t}=this;for(let n=0;n<t.length;n++)if(t[n].options.event===e)return t[n];return null}add(e){if(Array.isArray(e)){for(let t of e)this.add(t);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let t of e)this.remove(t);return this}let t=typeof e==`string`?this.get(e):e;if(t){let{recognizers:e}=this,n=e.indexOf(t);n!==-1&&(e.splice(n,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:n}=this;for(let r of fo(e))n[r]=n[r]||[],n[r].push(t)}off(e,t){if(!e)return;let{handlers:n}=this;for(let r of fo(e))t?n[r]&&n[r].splice(n[r].indexOf(t),1):delete n[r]}emit(e,t){let n=this.handlers[e]&&this.handlers[e].slice();if(!n||!n.length)return;let r=t;r.type=e,r.preventDefault=function(){t.srcEvent.preventDefault()};let i=0;for(;i<n.length;)n[i](r),i++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[n,r]of Object.entries(this.options.cssProps)){let i=Bo(t.style,n);e?(this.oldCssProps[i]=t.style[i],t.style[i]=r):t.style[i]=this.oldCssProps[i]||``}e||(this.oldCssProps={})}}},Go=1;function Ko(){return Go++}function qo(e){return e&V.Cancelled?`cancel`:e&V.Ended?`end`:e&V.Changed?`move`:e&V.Began?`start`:``}var Jo=class{constructor(e){this.options=e,this.id=Ko(),this.state=V.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){if(Array.isArray(e)){for(let t of e)this.recognizeWith(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:n}=this;return n[t.id]||(n[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){if(Array.isArray(e)){for(let t of e)this.dropRecognizeWith(t);return this}let t;return t=typeof e==`string`?this.manager.get(e):e,t&&delete this.simultaneous[t.id],this}requireFailure(e){if(Array.isArray(e)){for(let t of e)this.requireFailure(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:n}=this;return n.indexOf(t)===-1&&(n.push(t),t.requireFailure(this)),this}dropRequireFailure(e){if(Array.isArray(e)){for(let t of e)this.dropRequireFailure(t);return this}let t;if(t=typeof e==`string`?this.manager.get(e):e,t){let e=this.requireFail.indexOf(t);e>-1&&this.requireFail.splice(e,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<V.Ended&&this.manager.emit(this.options.event+qo(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=V.Ended&&this.manager.emit(this.options.event+qo(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=V.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&(V.Failed|V.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=V.Failed;return}this.state&(V.Recognized|V.Cancelled|V.Failed)&&(this.state=V.Possible),this.state=this.process(t),this.state&(V.Began|V.Changed|V.Ended|V.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}};function Yo(e){return Math.abs(((e+180)%360+360)%360-180)}function Xo(e,t){return(t.distance===void 0||e.distance>=t.distance)&&(t.distancePerPointer===void 0||e.distancePerPointer.length>0&&e.distancePerPointer.every(e=>e>=t.distancePerPointer))&&(t.movementDeltaTime===void 0||e.movementDeltaTime>=t.movementDeltaTime)&&(t.rotation===void 0||Yo(e.rotation)>=t.rotation)&&(t.scale===void 0||Math.abs(e.scale-1)>=t.scale)}var Zo=class extends Jo{attrTest(e){let t=this.options.pointers;return t===0||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(t=>Xo(e,t))}process(e){let{state:t}=this,{eventType:n}=e,r=t&(V.Began|V.Changed),i=this.attrTest(e);return r&&(n&z.Cancel||!i)?t|V.Cancelled:r||i?n&z.End?t|V.Ended:t&V.Began?t|V.Changed:V.Began:V.Failed}},Qo=[``,`start`,`move`,`end`,`cancel`],$o=class extends Jo{constructor(e={}){super({enable:!0,event:`doubleclickdrag`,pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[ao]}getEventNames(){return Qo.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length===t.pointers?e.eventType&z.Start?this._handleStart(e):e.eventType&z.Move?this._handleMove(e):e.eventType&z.Cancel?this._handleEnd(e,!0):e.eventType&z.End?this._handleEnd(e,!1):V.Failed:(this.reset(),V.Failed)}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===V.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===V.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===V.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===V.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,V.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,V.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return V.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?V.Began:(this._drag.active=!0,e.scale=2**(t/this.options.pixelsPerScale),this._emittedStart?V.Changed:V.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:n,startCenter:r}=this._drag;return this._drag=null,this._tapStart=null,this._lastTap=null,n?(e.scale=2**((r.y-e.center.y)/this.options.pixelsPerScale),t?V.Cancelled:V.Ended):(this._emittedStart=!1,V.Failed)}return!this._tapStart||!this._isSamePointer(e,this._tapStart.pointerId)?(t&&this.reset(),V.Failed):(this._isValidTap(e)?this._lastTap={center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null,V.Failed)}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&yo(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return`pointerId`in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return t===null||this._getPointerId(e)===t}},es=class extends Jo{constructor(e={}){super({enable:!0,event:`tap`,pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[ao]}process(e){let{options:t}=this,n=e.pointers.length===t.pointers,r=e.distance<t.threshold,i=e.deltaTime<t.time;if(this.reset(),e.eventType&z.Start&&this.count===0)return this.failTimeout();if(r&&i&&n){if(e.eventType!==z.End)return this.failTimeout();let n=this.pTime?e.timeStamp-this.pTime<t.interval:!0,r=!this.pCenter||yo(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,!r||!n?this.count=1:this.count+=1,this._input=e,this.count%t.taps===0)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=V.Recognized,this.tryEmit(this._input)},t.interval),V.Began):V.Recognized}return V.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=V.Failed},this.options.interval),V.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===V.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}},ts=class extends Zo{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{e.device===`trackpad`&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...n}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(n),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:n}=e,r=t.deltaX??e.deltaX,i=t.deltaY??e.deltaY,a=Co(r,i),o=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY),s=n;return{pointers:[s,s],changedPointers:[s,s],pointerType:`trackpad`,srcEvent:s,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:r,deltaY:i,angle:Math.atan2(i,r)*180/Math.PI,distance:Math.sqrt(r*r+i*i),distancePerPointer:[o,o],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:a,offsetDirection:a,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:n.target||this.manager.element,additionalEvent:``,...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&this.options.pointers===2);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}},ns=[``,`start`,`move`,`end`,`cancel`,`up`,`down`,`left`,`right`],rs=class extends ts{constructor(e={}){super({enable:!0,pointers:1,event:`pan`,threshold:10,direction:B.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&B.Horizontal&&t.push(co),e&B.Vertical&&t.push(so),t}getEventNames(){return ns.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,n=!0,{distance:r}=e,{direction:i}=e,a=e.deltaX,o=e.deltaY;return i&t.direction||(t.direction&B.Horizontal?(i=a===0?B.None:a<0?B.Left:B.Right,n=a!==this.pX,r=Math.abs(e.deltaX)):(i=o===0?B.None:o<0?B.Up:B.Down,n=o!==this.pY,r=Math.abs(e.deltaY))),e.direction=i,n&&r>t.threshold&&!!(i&t.direction)}attrTest(e){let t=!!(this.state&V.Began),n=!(this.options.coherent?.length&&e.eventType&(z.End|z.Cancel));return super.attrTest(e)&&(t||n&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=B[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(V.Recognized|V.Cancelled|V.Failed)&&(this.state=V.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}},is=[``,`start`,`move`,`end`,`cancel`,`in`,`out`],as=class extends ts{constructor(e={}){super({enable:!0,event:`pinch`,threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return[oo]}getEventNames(){return is.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,n=!!(this.state&V.Began),r=!(t&&e.eventType&(z.End|z.Cancel));return super.attrTest(e)&&(n||r&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(e.scale!==1){let t=e.scale<1?`in`:`out`;e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(V.Recognized|V.Cancelled|V.Failed)&&(this.state=V.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}},os=class{constructor(e,t,n){this.element=e,this.callback=t,this.options=n}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}},ss=(typeof navigator<`u`&&navigator.userAgent?navigator.userAgent.toLowerCase():``).indexOf(`firefox`)!==-1,cs=40,ls=.25,us=class extends os{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{if(!this.options.enable)return;let t=e.deltaY;globalThis.WheelEvent&&(ss&&e.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(t/=globalThis.devicePixelRatio),e.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(t*=cs)),e.shiftKey&&t&&(t*=ls),this.callback({type:`wheel`,center:{x:e.clientX,y:e.clientY},delta:-t,device:this.options.wheelSession?.device??`unknown`,srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen(`wheel`,!0))}destroy(){this.listen(`wheel`,!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){e===`wheel`&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen(`wheel`,t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}},ds=4.000244140625,fs=40,ps=0,ms=1,hs=40,gs=40,_s=120,vs={classificationDelay:32,endDelay:80},ys=class{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=e=>{if(!this.hasSubscribers)return`unknown`;let t=xs(e,this.pressedControlKeys.size>0),n=this.session;if(n&&t.timeStamp-n.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return`unknown`;n=null}n?(this.scheduleEnd(),this.addSample(n,t)):(n=this.startPendingSession(t),this.scheduleEnd());let{device:r}=n;return r===`unknown`&&(r=Ss(n.samples,!1),r!==`unknown`&&this.begin(n,r)),r},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||this.session.device!==`unknown`)return;let e=this.session,t=Ss(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)},this.end=()=>{if(!this.session)return;if(this.session.device===`unknown`){let e=this.session,t=Ss(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)}if(!this.session)return;let e=this.session;this.emit(z.End,e.lastEvent),this.reset()},this.handleKeyDown=e=>{e.key===`Control`&&this.pressedControlKeys.add(e.code||e.key)},this.handleKeyUp=e=>{e.key===`Control`&&(e.code?this.pressedControlKeys.delete(e.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...vs,...t},this.element?.addEventListener(`wheel`,this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??`unknown`}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&e.device!==`unknown`&&this.emit(z.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener(`wheel`,this.handleEvent)}startPendingSession(e){let t={samples:[e],device:`unknown`,firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,e.device!==`unknown`){let n=e.samples[e.samples.length-2],r=t.timeStamp-n.timeStamp;e.velocityX=r>0?t.deltaX/r:0,e.velocityY=r>0?t.deltaY/r:0,this.emit(z.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(z.Start,e.samples[0].event);let n=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=n>0?e.totalDeltaX/n:0,e.velocityY=n>0?e.totalDeltaY/n:0,this.emit(z.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,n){let r=this.session;if(!r||r.device===`unknown`)return;let i=e===z.Start,a=e===z.End||e===z.Cancel,o=i?r.firstTimeStamp:r.lastTimeStamp,s=i?0:Math.max(0,o-r.firstTimeStamp),c=i?0:r.totalDeltaX,l=i?0:r.totalDeltaY,u=s>0?c/s:0,d=s>0?l/s:0,f=i?0:n?.velocityX??r.velocityX,p=i?0:n?.velocityY??r.velocityY,m={eventType:e,device:r.device,srcEvent:t,timeStamp:o,center:{x:t.clientX,y:t.clientY},deltaX:c,deltaY:l,deltaTime:s,velocity:Math.abs(f)>Math.abs(p)?f:p,velocityX:f,velocityY:p,overallVelocity:Math.abs(u)>Math.abs(d)?u:d,overallVelocityX:u,overallVelocityY:d,isFirst:i,isFinal:a};for(let{listener:e}of[...this.subscriptions.values()])e(m)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){this.classificationTimer!==null&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){this.endTimer!==null&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t=bs();!t||e===this.listeningForControlKeys||(this.listeningForControlKeys=e,e?(t.addEventListener(`keydown`,this.handleKeyDown,!0),t.addEventListener(`keyup`,this.handleKeyUp,!0),t.addEventListener(`blur`,this.handleWindowBlur)):(t.removeEventListener(`keydown`,this.handleKeyDown,!0),t.removeEventListener(`keyup`,this.handleKeyUp,!0),t.removeEventListener(`blur`,this.handleWindowBlur),this.pressedControlKeys.clear()))}};function bs(){return typeof window<`u`?window:globalThis.document?.defaultView}function xs(e,t){let n=e.deltaX,r=e.deltaY;return e.deltaMode===ms&&(n*=fs,r*=fs),{event:e,timeStamp:e.timeStamp,deltaX:n,deltaY:r,isControlKeyDown:t}}function Ss(e,t){return e.some(({event:e,isControlKeyDown:t})=>e.ctrlKey&&!t)?`trackpad`:e.some(({event:e})=>e.deltaMode!==ps)||e.some(Cs)||e.every(({event:e})=>{let t=e.wheelDelta;return t!==void 0&&Math.abs(t)%40==0})?`mouse`:e.some(({deltaX:e})=>e!==0)||e.length>1&&ws(e)?`trackpad`:t?`mouse`:`unknown`}function Cs({event:e,deltaX:t,deltaY:n}){if(t!==0||n===0)return!1;let r=Math.abs(n/ds);if(Number.isInteger(r))return!0;let i=e.wheelDelta;return typeof i==`number`&&i!==0&&i%_s===0}function ws(e){for(let t=0;t<e.length;t++){let n=e[t];if(Math.abs(n.deltaX)>gs||Math.abs(n.deltaY)>gs||t>0&&n.timeStamp-e[t-1].timeStamp>hs)return!1}return!0}var Ts=[`mousedown`,`mousemove`,`mouseup`,`mouseover`,`mouseout`,`mouseenter`,`mouseleave`],Es=class extends os{constructor(e,t,n){super(e,t,{enable:!0,...n}),this.handleEvent=e=>{this.handleOverEvent(e),this.handleOutEvent(e),this.handleEnterEvent(e),this.handleLeaveEvent(e),this.handleMoveEvent(e)},this.pressed=!1;let{enable:r=!1}=this.options;this.enableMoveEvent=r,this.enableLeaveEvent=r,this.enableEnterEvent=r,this.enableOutEvent=r,this.enableOverEvent=r,r&&Ts.forEach(e=>this.listen(e,!0))}destroy(){Ts.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case`pointermove`:this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen(`mousedown`,t),this.listen(`mousemove`,t),this.listen(`mouseup`,t));break;case`pointerover`:this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen(`mouseover`,t));break;case`pointerout`:this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen(`mouseout`,t));break;case`pointerenter`:this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen(`mouseenter`,t));break;case`pointerleave`:this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen(`mouseleave`,t));break;default:}}handleOverEvent(e){this.enableOverEvent&&e.type===`mouseover`&&this._emit(`pointerover`,e)}handleOutEvent(e){this.enableOutEvent&&e.type===`mouseout`&&this._emit(`pointerout`,e)}handleEnterEvent(e){this.enableEnterEvent&&e.type===`mouseenter`&&this._emit(`pointerenter`,e)}handleLeaveEvent(e){this.enableLeaveEvent&&e.type===`mouseleave`&&this._emit(`pointerleave`,e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case`mousedown`:e.button>=0&&(this.pressed=!0);break;case`mousemove`:e.buttons===0&&(this.pressed=!1),this.pressed||this._emit(`pointermove`,e);break;case`mouseup`:this.pressed=!1;break;default:}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:`mouse`,target:t.target})}},Ds=[`keydown`,`keyup`],Os=class extends os{constructor(e,t,n){super(e,t,{enable:!0,tabIndex:0,...n}),this.handleEvent=e=>{let t=e.target||e.srcElement;t.tagName===`INPUT`&&t.type===`text`||t.tagName===`TEXTAREA`||(this.enableDownEvent&&e.type===`keydown`&&this.callback({type:`keydown`,srcEvent:e,key:e.key,target:e.target}),this.enableUpEvent&&e.type===`keyup`&&this.callback({type:`keyup`,srcEvent:e,key:e.key,target:e.target}))};let{enable:r=!1}=this.options;this.enableDownEvent=r,this.enableUpEvent=r,e.tabIndex=this.options.tabIndex,e.style.outline=`none`,r&&Ds.forEach(e=>this.listen(e,!0))}destroy(){Ds.forEach(e=>this.listen(e,!1))}enableEventType(e,t){e===`keydown`&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),e===`keyup`&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}},ks=class extends os{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{this.options.enable&&this.callback({type:`contextmenu`,center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&this.listen(`contextmenu`,!0)}destroy(){this.listen(`contextmenu`,!1)}enableEventType(e,t){e===`contextmenu`&&this.options.enable!==t&&(this.options.enable=t,this.listen(`contextmenu`,t))}},As=1,js=2,Ms=4,Ns={pointerdown:As,pointermove:js,pointerup:Ms,mousedown:As,mousemove:js,mouseup:Ms},Ps=0,Fs=1,Is=2,Ls=1,Rs=2,zs=4;function Bs(e){let t=Ns[e.srcEvent.type];if(!t)return null;let{buttons:n,button:r}=e.srcEvent,i=!1,a=!1,o=!1;return t===js?(i=!!(n&Ls),a=!!(n&zs),o=!!(n&Rs)):(i=r===Ps,a=r===Fs,o=r===Is),{leftButton:i,middleButton:a,rightButton:o}}function Vs(e,t){let n=e.center;if(!n)return null;let r=t.getBoundingClientRect(),i=r.width/t.offsetWidth||1,a=r.height/t.offsetHeight||1;return{center:n,offsetCenter:{x:(n.x-r.left-t.clientLeft)/i,y:(n.y-r.top-t.clientTop)/a}}}var Hs={srcElement:`root`,priority:0},Us=class{constructor(e,t){this.handleEvent=e=>{if(this.isEmpty())return;let t=this._normalizeEvent(e),n=e.srcEvent.target;for(;n&&n!==t.rootElement;){if(this._emit(t,n),t.handled)return;n=n.parentNode}this._emit(t,`root`)},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,n,r=!1,i=!1){let{handlers:a,handlersByElement:o}=this,s={...Hs,...n},c=o.get(s.srcElement);c||(c=[],o.set(s.srcElement,c));let l={type:e,handler:t,srcElement:s.srcElement,priority:s.priority};r&&(l.once=!0),i&&(l.passive=!0),a.push(l),this._active=this._active||!l.passive;let u=c.length-1;for(;u>=0&&!(c[u].priority>=l.priority);)u--;c.splice(u+1,0,l)}remove(e,t){let{handlers:n,handlersByElement:r}=this;for(let i=n.length-1;i>=0;i--){let a=n[i];if(a.type===e&&a.handler===t){n.splice(i,1);let e=r.get(a.srcElement);e.splice(e.indexOf(a),1),e.length===0&&r.delete(a.srcElement)}}this._active=n.some(e=>!e.passive)}_emit(e,t){let n=this.handlersByElement.get(t);if(n){let t=!1,r=()=>{e.handled=!0},i=()=>{e.handled=!0,t=!0},a=[];for(let o=0;o<n.length;o++){let{type:s,handler:c,once:l}=n[o];if(c({...e,type:s,stopPropagation:r,stopImmediatePropagation:i}),l&&a.push(n[o]),t)break}for(let e=0;e<a.length;e++){let{type:t,handler:n}=a[e];this.remove(t,n)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...Bs(e),...Vs(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}};function Ws(e){if(`recognizer`in e)return e;let t,n=Array.isArray(e)?[...e]:[e];return t=typeof n[0]==`function`?new(n.shift())(n.shift()||{}):n.shift(),{recognizer:t,recognizeWith:typeof n[0]==`string`?[n[0]]:n[0],requireFailure:typeof n[1]==`string`?[n[1]]:n[1]}}var Gs=class{constructor(e=null,t={}){if(this._onBasicInput=e=>{this.manager.emit(e.srcEvent.type,e)},this._onOtherEvent=e=>{this.manager.emit(e.type,e)},this.options={recognizers:[],events:{},touchAction:`compute`,tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new ys(e),e){this.manager=new Wo(e,this.options);for(let e of this.options.recognizers){let{recognizer:t,recognizeWith:n,requireFailure:r}=Ws(e);this.manager.add(t),n&&t.recognizeWith(n),r&&t.requireFailure(r)}this.manager.on(`hammer.input`,this._onBasicInput),this.wheelInput=new us(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new Es(e,this._onOtherEvent,{enable:!1}),this.keyInput=new Os(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new ks(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}}getElement(){return this.element}destroy(){if(!this.element){this.wheelSession.destroy();return}this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()}on(e,t,n){this._addEventHandler(e,t,n,!1)}once(e,t,n){this._addEventHandler(e,t,n,!0)}watch(e,t,n){this._addEventHandler(e,t,n,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:n}=this;if(!n)return;let r=n.get(e);r&&(r.set({enable:t,wheelSession:this.wheelSession}),n.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,n,r,i){if(typeof e!=`string`){n=t;for(let[t,a]of Object.entries(e))this._addEventHandler(t,a,n,r,i);return}let{manager:a,events:o}=this;if(!a)return;let s=o.get(e);if(!s){let t=this._getRecognizerName(e)||e;s=new Us(this,t),o.set(e,s),a&&a.on(e,s.handleEvent)}s.add(e,t,n,r,i),s.isEmpty()||this._toggleRecognizer(s.recognizerName,!0)}_removeEventHandler(e,t){if(typeof e!=`string`){for(let[t,n]of Object.entries(e))this._removeEventHandler(t,n);return}let{events:n}=this,r=n.get(e);if(r&&(r.remove(e,t),r.isEmpty())){let{recognizerName:e}=r,t=!1;for(let r of n.values())if(r.recognizerName===e&&!r.isEmpty()){t=!0;break}t||this._toggleRecognizer(e,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}},Ks={DEFAULT:`default`,LNGLAT:`lnglat`,METER_OFFSETS:`meter-offsets`,LNGLAT_OFFSETS:`lnglat-offsets`,CARTESIAN:`cartesian`};Object.defineProperty(Ks,`IDENTITY`,{get:()=>(N.deprecated(`COORDINATE_SYSTEM.IDENTITY`,`COORDINATE_SYSTEM.CARTESIAN`)(),Ks.CARTESIAN)});var H={WEB_MERCATOR:1,GLOBE:2,WEB_MERCATOR_AUTO_OFFSET:4,IDENTITY:0},qs={common:0,meters:1,pixels:2},Js={click:`onClick`,dblclick:`onClick`,panstart:`onDragStart`,panmove:`onDrag`,panend:`onDragEnd`},Ys={multipan:[rs,{threshold:10,pointers:2,trackpad:!0}],pinch:[as,{trackpad:!0},null,[`multipan`]],pan:[rs,{threshold:1},[`pinch`],[`multipan`]],dblclick:[es,{event:`dblclick`,taps:2,enable:!1}],dblclickdrag:[$o,{event:`dblclickdrag`,enable:!1},[`dblclick`],null],click:[es,{event:`click`},[`dblclickdrag`],[`dblclick`,`dblclickdrag`]]};function Xs(e,t){if(e===t)return!0;if(Array.isArray(e)){let n=e.length;if(!t||t.length!==n)return!1;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}return!1}function Zs(e){let t={},n;return r=>{for(let i in r)if(!Xs(r[i],t[i])){n=e(r),t=r;break}return n}}var Qs=[0,0,0,0],$s=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],ec=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],tc=[0,0,0],nc=[0,0,0],rc={default:-1,cartesian:0,lnglat:1,"meter-offsets":2,"lnglat-offsets":3};function ic(e){let t=rc[e];if(t===void 0)throw Error(`Invalid coordinateSystem: ${e}`);return t}var ac=Zs(lc);function oc(e,t,n=nc){n.length<3&&(n=[n[0],n[1],0]);let r=n,i,a=!0;switch(i=t===`lnglat-offsets`||t===`meter-offsets`?n:e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null,e.projectionMode){case H.WEB_MERCATOR:(t===`lnglat`||t===`cartesian`)&&(i=[0,0,0],a=!1);break;case H.WEB_MERCATOR_AUTO_OFFSET:t===`lnglat`?r=i:t===`cartesian`&&(r=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],i=e.unprojectPosition(r),r[0]-=n[0],r[1]-=n[1],r[2]-=n[2]);break;case H.IDENTITY:r=e.position.map(Math.fround),r[2]=r[2]||0;break;case H.GLOBE:a=!1,i=null;break;default:a=!1}return{geospatialOrigin:i,shaderCoordinateOrigin:r,offsetMode:a}}function sc(e,t,n){let{viewMatrixUncentered:r,projectionMatrix:i}=e,{viewMatrix:a,viewProjectionMatrix:o}=e,s=Qs,c=Qs,l=e.cameraPosition,{geospatialOrigin:u,shaderCoordinateOrigin:d,offsetMode:f}=oc(e,t,n);return f&&(c=e.projectPosition(u||d),l=[l[0]-c[0],l[1]-c[1],l[2]-c[2]],c[3]=1,s=ca([],c,o),a=r||a,o=qi([],i,a),o=qi([],o,$s)),{viewMatrix:a,viewProjectionMatrix:o,projectionCenter:s,originCommon:c,cameraPosCommon:l,shaderCoordinateOrigin:d,geospatialOrigin:u}}function cc({viewport:e,devicePixelRatio:t=1,modelMatrix:n=null,coordinateSystem:r=`default`,coordinateOrigin:i=nc,autoWrapLongitude:a=!1}){r===`default`&&(r=e.isGeospatial?`lnglat`:`cartesian`);let o=ac({viewport:e,devicePixelRatio:t,coordinateSystem:r,coordinateOrigin:i});return o.wrapLongitude=a,o.modelMatrix=n||ec,o}function lc({viewport:e,devicePixelRatio:t,coordinateSystem:n,coordinateOrigin:r}){let{projectionCenter:i,viewProjectionMatrix:a,originCommon:o,cameraPosCommon:s,shaderCoordinateOrigin:c,geospatialOrigin:l}=sc(e,n,r),u=e.getDistanceScales(),d=[e.width*t,e.height*t],f=ca([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,p={coordinateSystem:ic(n),projectionMode:e.projectionMode,coordinateOrigin:c,commonOrigin:o.slice(0,3),center:i,pseudoMeters:!!e._pseudoMeters,viewportSize:d,devicePixelRatio:t,focalDistance:f,commonUnitsPerMeter:u.unitsPerMeter,commonUnitsPerWorldUnit:u.unitsPerMeter,commonUnitsPerWorldUnit2:tc,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:a,modelMatrix:ec,cameraPosition:s};if(l){let t=e.getDistanceScales(l);switch(n){case`meter-offsets`:p.commonUnitsPerWorldUnit=t.unitsPerMeter,p.commonUnitsPerWorldUnit2=t.unitsPerMeter2;break;case`lnglat`:case`lnglat-offsets`:e._pseudoMeters||(p.commonUnitsPerMeter=t.unitsPerMeter),p.commonUnitsPerWorldUnit=t.unitsPerDegree,p.commonUnitsPerWorldUnit2=t.unitsPerDegree2;break;case`cartesian`:p.commonUnitsPerWorldUnit=[1,1,t.unitsPerMeter[2]],p.commonUnitsPerWorldUnit2=[0,0,t.unitsPerMeter2[2]];break;default:break}}if(e.projectionMode===H.GLOBE&&n===`meter-offsets`){let e=r[0]*Math.PI/180,t=r[1]*Math.PI/180,n=Math.cos(t),i=((r[2]||0)/6370972+1)*256;p.commonOrigin=[Math.sin(e)*n*i,-Math.cos(e)*n*i,Math.sin(t)*i]}return p}var uc=`\
${`\
${[`default`,`lnglat`,`meter-offsets`,`lnglat-offsets`,`cartesian`].map(e=>`const COORDINATE_SYSTEM_${e.toUpperCase().replaceAll(`-`,`_`)}: i32 = ${ic(e)};`).join(``)}
${Object.keys(H).map(e=>`const PROJECTION_MODE_${e}: i32 = ${H[e]};`).join(``)}
${Object.keys(qs).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${qs[e]};`).join(``)}

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
`,dc=`\
${[`default`,`lnglat`,`meter-offsets`,`lnglat-offsets`,`cartesian`].map(e=>`const int COORDINATE_SYSTEM_${e.toUpperCase().replaceAll(`-`,`_`)} = ${ic(e)};`).join(``)}
${Object.keys(H).map(e=>`const int PROJECTION_MODE_${e} = ${H[e]};`).join(``)}
${Object.keys(qs).map(e=>`const int UNIT_${e.toUpperCase()} = ${qs[e]};`).join(``)}
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
`,fc={};function pc(e=fc){return`viewport`in e?cc(e):{}}var mc={name:`project`,dependencies:[_,ro],source:uc,vs:dc,getUniforms:pc,uniformTypes:{wrapLongitude:`f32`,coordinateSystem:`i32`,commonUnitsPerMeter:`vec3<f32>`,projectionMode:`i32`,scale:`f32`,commonUnitsPerWorldUnit:`vec3<f32>`,commonUnitsPerWorldUnit2:`vec3<f32>`,center:`vec4<f32>`,modelMatrix:`mat4x4<f32>`,viewProjectionMatrix:`mat4x4<f32>`,viewportSize:`vec2<f32>`,devicePixelRatio:`f32`,focalDistance:`f32`,cameraPosition:`vec3<f32>`,coordinateOrigin:`vec3<f32>`,commonOrigin:`vec3<f32>`,pseudoMeters:`f32`}},hc={name:`project32`,dependencies:[mc],source:`// Define a structure to hold both the clip-space position and the common position.
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
`};function gc(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function _c(e,t){let n=ca([],t,e);return sa(n,n,1/n[3]),n}function vc(e,t,n){return e<t?t:e>n?n:e}function yc(e){return Math.log(e)*Math.LOG2E}var bc=Math.log2||yc;function xc(e,t){if(!e)throw Error(t||`@math.gl/web-mercator: assertion failed.`)}var U=Math.PI,Sc=U/4,W=U/180,Cc=180/U,wc=512,Tc=4003e4,Ec=85.051129,Dc=1.5;function Oc(e){return bc(e)}function kc(e){let[t,n]=e;xc(Number.isFinite(t)),xc(Number.isFinite(n)&&n>=-90&&n<=90,`invalid latitude`);let r=t*W,i=n*W;return[wc*(r+U)/(2*U),wc*(U+Math.log(Math.tan(Sc+i*.5)))/(2*U)]}function Ac(e){let[t,n]=e,r=t/wc*(2*U)-U,i=2*(Math.atan(Math.exp(n/wc*(2*U)-U))-Sc);return[r*Cc,i*Cc]}function jc(e){let{latitude:t}=e;return xc(Number.isFinite(t)),Oc(Tc*Math.cos(t*W))-9}function Mc(e){let t=Math.cos(e*W);return wc/Tc/t}function Nc(e){let{latitude:t,longitude:n,highPrecision:r=!1}=e;xc(Number.isFinite(t)&&Number.isFinite(n));let i=wc,a=Math.cos(t*W),o=i/360,s=o/a,c=i/Tc/a,l={unitsPerMeter:[c,c,c],metersPerUnit:[1/c,1/c,1/c],unitsPerDegree:[o,s,c],degreesPerUnit:[1/o,1/s,1/c]};if(r){let e=W*Math.tan(t*W)/a,n=o*e/2,r=i/Tc*e,u=r/s*c;l.unitsPerDegree2=[0,n,r],l.unitsPerMeter2=[u,0,u]}return l}function Pc(e,t){let[n,r,i]=e,[a,o,s]=t,{unitsPerMeter:c,unitsPerMeter2:l}=Nc({longitude:n,latitude:r,highPrecision:!0}),u=kc(e);u[0]+=a*(c[0]+l[0]*o),u[1]+=o*(c[1]+l[1]*o);let d=Ac(u),f=(i||0)+(s||0);return Number.isFinite(i)||Number.isFinite(s)?[d[0],d[1],f]:d}function Fc(e){let{height:t,pitch:n,bearing:r,altitude:i,scale:a,center:o}=e,s=gc();Ji(s,s,[0,0,-i]),Zi(s,s,-n*W),$i(s,s,r*W);let c=a/t;return Yi(s,s,[c,c,c]),o&&Ji(s,s,Ei([],o)),s}function Ic(e){let{width:t,height:n,altitude:r,pitch:i=0,offset:a,center:o,scale:s,nearZMultiplier:c=1,farZMultiplier:l=1}=e,{fovy:u=Lc(Dc)}=e;r!==void 0&&(u=Lc(r));let d=u*W,f=i*W,p=Rc(u),m=p;o&&(m+=o[2]*s/Math.cos(f)/n);let h=d*(.5+(a?a[1]:0)/n),g=Math.sin(h)*m/Math.sin(vc(Math.PI/2-f-h,.01,Math.PI-.01)),_=Math.sin(f)*g+m,v=m*10,y=Math.min(_*l,v);return{fov:d,aspect:t/n,focalDistance:p,near:c,far:y}}function Lc(e){return 2*Math.atan(.5/e)*Cc}function Rc(e){return .5/Math.tan(.5*e*W)}function zc(e,t){let[n,r,i=0]=e;return xc(Number.isFinite(n)&&Number.isFinite(r)&&Number.isFinite(i)),_c(t,[n,r,i,1])}function Bc(e,t,n=0){let[r,i,a]=e;if(xc(Number.isFinite(r)&&Number.isFinite(i),`invalid pixel coordinate`),Number.isFinite(a))return _c(t,[r,i,a,1]);let o=_c(t,[r,i,0,1]),s=_c(t,[r,i,1,1]),c=o[2],l=s[2];return _i([],o,s,c===l?0:((n||0)-c)/(l-c))}function Vc(e){let{width:t,height:n,bounds:r,minExtent:i=0,maxZoom:a=24,offset:o=[0,0]}=e,[[s,c],[l,u]]=r,d=Hc(e.padding),f=kc([s,vc(u,-Ec,Ec)]),p=kc([l,vc(c,-Ec,Ec)]),m=[Math.max(Math.abs(p[0]-f[0]),i),Math.max(Math.abs(p[1]-f[1]),i)],h=[t-d.left-d.right-Math.abs(o[0])*2,n-d.top-d.bottom-Math.abs(o[1])*2];xc(h[0]>0&&h[1]>0);let g=h[0]/m[0],_=h[1]/m[1],v=(d.right-d.left)/2/g,y=(d.top-d.bottom)/2/_,b=Ac([(p[0]+f[0])/2+v,(p[1]+f[1])/2+y]),x=Math.min(a,bc(Math.abs(Math.min(g,_))));return xc(Number.isFinite(x)),{longitude:b[0],latitude:b[1],zoom:x}}function Hc(e=0){return typeof e==`number`?{top:e,bottom:e,left:e,right:e}:(xc(Number.isFinite(e.top)&&Number.isFinite(e.bottom)&&Number.isFinite(e.left)&&Number.isFinite(e.right)),e)}var Uc=Math.PI/180;function Wc(e,t=0){let{width:n,height:r,unproject:i}=e,a={targetZ:t},o=i([0,r],a),s=i([n,r],a),c,l;return(e.fovy?.5*e.fovy*Uc:Math.atan(.5/e.altitude))>(90-e.pitch)*Uc-.01?(c=Gc(e,0,t),l=Gc(e,n,t)):(c=i([0,0],a),l=i([n,0],a)),[o,s,l,c]}function Gc(e,t,n){let{pixelUnprojectionMatrix:r}=e,i=_c(r,[t,0,1,1]),a=_c(r,[t,e.height,1,1]),o=Ac(_i([],i,a,(n*e.distanceScales.unitsPerMeter[2]-i[2])/(a[2]-i[2])));return o.push(n),o}var Kc=Math.PI;Kc/180;var qc=180/Kc,Jc=Kc*6378137;Math.atan(Math.sinh(Kc))*qc,512/(2*Jc);var Yc=`
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
`,Xc=`
${Yc}

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

`,Zc=`
${Yc}

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

`,Qc=Zs(rl),$c=Zs(il),el=[0,0,0,1],tl=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0];function nl(e,t){let[n,r,i]=e,a=Bc([n,r,i],t);return Number.isFinite(i)?a:[a[0],a[1],0]}function rl({viewport:e,center:t}){return new R(e.viewProjectionMatrix).invert().transform(t)}function il({viewport:e,shadowMatrices:t}){let n=[],r=e.pixelUnprojectionMatrix,i=e.isGeospatial?void 0:1,a=[[0,0,i],[e.width,0,i],[0,e.height,i],[e.width,e.height,i],[0,0,-1],[e.width,0,-1],[0,e.height,-1],[e.width,e.height,-1]].map(e=>nl(e,r));for(let r of t){let t=r.clone().translate(new Hi(e.center).negate()),i=a.map(e=>t.transform(e)),o=new R().ortho({left:Math.min(...i.map(e=>e[0])),right:Math.max(...i.map(e=>e[0])),bottom:Math.min(...i.map(e=>e[1])),top:Math.max(...i.map(e=>e[1])),near:Math.min(...i.map(e=>-e[2])),far:Math.max(...i.map(e=>-e[2]))});n.push(o.multiplyRight(r))}return n}function al(e){let{shadowEnabled:t=!0,project:n}=e;if(!t||!n||!e.shadowMatrices||!e.shadowMatrices.length)return{drawShadowMap:!1,useShadowMap:!1,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};let r=mc.getUniforms(n),i=Qc({viewport:n.viewport,center:r.center}),a=[],o=$c({shadowMatrices:e.shadowMatrices,viewport:n.viewport}).slice();for(let t=0;t<e.shadowMatrices.length;t++){let e=o[t],s=e.clone().translate(new Hi(n.viewport.center).negate());r.coordinateSystem===ic(`lnglat`)&&r.projectionMode===H.WEB_MERCATOR?(o[t]=s,a[t]=i):(o[t]=e.clone().multiplyRight(tl),a[t]=s.transform(i))}let s={drawShadowMap:!!e.drawToShadowMap,useShadowMap:e.shadowMaps?e.shadowMaps.length>0:!1,color:e.shadowColor||el,lightId:e.shadowLightId||0,lightCount:e.shadowMatrices.length,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};for(let e=0;e<o.length;e++)s[`viewProjectionMatrix${e}`]=o[e],s[`projectCenter${e}`]=a[e];for(let t=0;t<2;t++)s[`shadow_uShadowMap${t}`]=e.shadowMaps&&e.shadowMaps[t]||e.dummyShadowMap;return s}var ol={name:`shadow`,dependencies:[mc],vs:Xc,fs:Zc,inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    position = shadow_setVertexPosition(geometry.position);
    `,"fs:DECKGL_FILTER_COLOR":`
    color = shadow_filterShadowColor(color);
    `},getUniforms:al,uniformTypes:{drawShadowMap:`f32`,useShadowMap:`f32`,color:`vec4<f32>`,lightId:`i32`,lightCount:`f32`,viewProjectionMatrix0:`mat4x4<f32>`,viewProjectionMatrix1:`mat4x4<f32>`,projectCenter0:`vec4<f32>`,projectCenter1:`vec4<f32>`}},sl=16777215;function cl(e,t){e.length===10?N.warn(`pickMultipleObjects can only exclude 10 previously picked objects for layers without picking buffers`)():e.push(t)}var ll=`  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function ul(e){return e.replace(`  vec4 highlightColor;
} picking;`,`  vec4 highlightColor;\n${ll}} picking;`)}function dl(e,t){return[e[t]||0,e[t+1]||0,e[t+2]||0,e[t+3]||0]}var fl=`\
vec3 picking_getPickingColorFromIndex(float objectIndex) {
  if (objectIndex < 0.0 || objectIndex >= ${sl}.0) {
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
`,pl=`\
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
  if (objectIndex >= ${sl}u) {
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
`,ml={...Aa,vs:`${ul(Aa.vs)}\n${fl}`,fs:ul(Aa.fs),source:pl,uniformTypes:{...Aa.uniformTypes,disabledPickingIndexCount:`f32`,disabledPickingIndices0:`vec4<f32>`,disabledPickingIndices1:`vec4<f32>`,disabledPickingIndices2:`vec4<f32>`},defaultUniforms:{...Aa.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(e,t){let n=Aa.getUniforms(e,t),r=e.disabledPickingIndices||[];return n.disabledPickingIndexCount=r.length,n.disabledPickingIndices0=dl(r,0),n.disabledPickingIndices1=dl(r,4),n.disabledPickingIndices2=dl(r,8),n},inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `,"vs:DECKGL_FILTER_COLOR":`
  picking_setPickingColor(geometry.pickingColor);
  `,"fs:DECKGL_FILTER_COLOR":{order:99,injection:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}}},hl=[ro],gl=[`vs:DECKGL_FILTER_SIZE(inout vec3 size, VertexGeometry geometry)`,`vs:DECKGL_FILTER_GL_POSITION(inout vec4 position, VertexGeometry geometry)`,`vs:DECKGL_FILTER_COLOR(inout vec4 color, VertexGeometry geometry)`,`fs:DECKGL_FILTER_COLOR(inout vec4 color, FragmentGeometry geometry)`],_l=[];function vl(e){let t=u.getDefaultShaderAssembler(e);for(let e of hl)t.addDefaultModule(e);t._hookFunctions.length=0;let n=e===`glsl`?gl:_l;for(let e of n)t.addShaderHook(e);return t}var yl=[255,255,255],bl=1,xl=0,Sl=class{constructor(e={}){this.type=`ambient`;let{color:t=yl}=e,{intensity:n=bl}=e;this.id=e.id||`ambient-${xl++}`,this.color=t,this.intensity=n}},Cl=[255,255,255],wl=1,Tl=[0,0,-1],El=0,Dl=class{constructor(e={}){this.type=`directional`;let{color:t=Cl}=e,{intensity:n=wl}=e,{direction:r=Tl}=e,{_shadow:i=!1}=e;this.id=e.id||`directional-${El++}`,this.color=t,this.intensity=n,this.type=`directional`,this.direction=new Hi(r).normalize().toArray(),this.shadow=i}getProjectedLight(e){return this}},Ol=class{constructor(e,t={id:`pass`}){let{id:n}=t;this.id=n,this.device=e,this.props={...t}}setProps(e){Object.assign(this.props,e)}render(e){}cleanup(){}},kl={depthWriteEnabled:!0,depthCompare:`less-equal`,blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaOperation:`add`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`},Al=class extends Ol{constructor(){super(...arguments),this._lastRenderIndex=-1}render(e){this._render(e)}_render(e){let{canvasContext:t=this.device.canvasContext}=e,n=e.target??t.getCurrentFramebuffer(),[r,i]=t.getDrawingBufferSize(),a=e.clearCanvas??!0,o=e.clearColor??(a?[0,0,0,0]:!1),s=a?1:!1,c=a?0:!1,l=e.colorMask??15,u={viewport:[0,0,r,i]};e.colorMask&&(u.colorMask=l),e.scissorRect&&(u.scissorRect=e.scissorRect);let{shaderModuleProps:d,viewports:f,views:p,onViewportActive:m,clearStack:h=!0}=e,g=e.pass||`unknown`,_=this.device.type===`webgpu`;h&&(this._lastRenderIndex=-1);let v=[];if(!f.length)return this.device.beginRenderPass({framebuffer:n,parameters:u,clearColor:o,clearDepth:s,clearStencil:c}).end(),this.device.submit(),v;try{for(let r of f){m?.(r);let i=this._getDrawLayerParams(r,e),a=p&&p[r.id],l=r.subViewports||[r],f=_?l.map(e=>[e]):[l];for(let r of f){let l=this.device.beginRenderPass({framebuffer:n,parameters:u,clearColor:o,clearDepth:s,clearStencil:c});try{for(let o of r){let r=this._drawLayersInViewport(l,{target:n,canvasContext:t,shaderModuleProps:d,viewport:o,view:a,pass:g,layers:e.layers,isPicking:e.isPicking},i);v.push(r)}}finally{l.end(),_&&this.device.submit()}o=!1,s=!1,c=!1}}return v}finally{_||this.device.submit()}}_getDrawLayerParams(e,{layers:t,pass:n,isPicking:r=!1,layerFilter:i,cullRect:a,views:o,effects:s,canvasContext:c=this.device.canvasContext,shaderModuleProps:l},u=!1){let d=[],f=jl(this._lastRenderIndex+1),p={layer:t[0],viewport:e,isPicking:r,renderPass:n,cullRect:a},m={};for(let r=0;r<t.length;r++){let a=t[r],h=this._shouldDrawLayer(a,p,i,m),g={shouldDrawLayer:h};h&&!u&&(g.shouldDrawLayer=!0,g.layerRenderIndex=f(a,h),g.shaderModuleProps=this._getShaderModuleProps(a,s,n,c,l),g.layerParameters={...a.context.device.type===`webgpu`?kl:null,...a.context.deck?.props.parameters,...o?.[e.id]?.props.parameters,...this.getLayerParameters(a,r,e)}),d[r]=g}return d}_drawLayersInViewport(e,{layers:t,shaderModuleProps:n,pass:r,target:i,canvasContext:a,viewport:o,view:s,isPicking:c},l){let u=Ml(this.device,{canvasContext:a,shaderModuleProps:n,target:i,viewport:o});if(s){let{clear:e,clearColor:t,clearDepth:n,clearStencil:r}=s.props;if(e){let e=[0,0,0,0],a=1,o=0;Array.isArray(t)&&!c?e=[...t.slice(0,3),t[3]||255].map(e=>e/255):t===!1&&(e=!1),n!==void 0&&(a=n),r!==void 0&&(o=r),this.device.beginRenderPass({framebuffer:i,parameters:{viewport:u,scissorRect:u},clearColor:e,clearDepth:a,clearStencil:o}).end()}}let d={totalCount:t.length,visibleCount:0,compositeCount:0,pickableCount:0};e.setParameters({viewport:u});for(let n=0;n<t.length;n++){let i=t[n],a=l[n],{shouldDrawLayer:s}=a;if(s&&i.props.pickable&&d.pickableCount++,i.isComposite&&d.compositeCount++,i.isDrawable&&a.shouldDrawLayer){let{layerRenderIndex:t,shaderModuleProps:n,layerParameters:s}=a;d.visibleCount++,this._lastRenderIndex=Math.max(this._lastRenderIndex,t),n.project&&(n.project.viewport=o),i.context.renderPass=e;try{i._drawLayer({renderPass:e,shaderModuleProps:n,uniforms:{layerIndex:t},parameters:s})}catch(e){i.raiseError(e,`drawing ${i} to ${r}`)}}}return d}shouldDrawLayer(e){return!0}getShaderModuleProps(e,t,n){return null}getLayerParameters(e,t,n){return e.props.parameters}_shouldDrawLayer(e,t,n,r){if(!(e.props.visible&&this.shouldDrawLayer(e)))return!1;t.layer=e;let i=e.parent;for(;i;){if(!i.props.visible||!i.filterSubLayer(t))return!1;t.layer=i,i=i.parent}if(n){let e=t.layer.id;if(e in r||(r[e]=n(t)),!r[e])return!1}return e.activateViewport(t.viewport),!0}_getShaderModuleProps(e,t,n,r,i){let a=r.cssToDeviceRatio(),o=e.internalState?.propsInTransition||e.props,s={layer:o,picking:{isActive:!1},project:{viewport:e.context.viewport,devicePixelRatio:a,modelMatrix:o.modelMatrix,coordinateSystem:o.coordinateSystem,coordinateOrigin:o.coordinateOrigin,autoWrapLongitude:e.wrapLongitude}};if(t)for(let n of t)Nl(s,n.getShaderModuleProps?.(e,s));for(let t of e.context.defaultShaderModules)t.name in s||(s[t.name]={});return Nl(s,this.getShaderModuleProps(e,t,s),i)}};function jl(e=0,t={}){let n={},r=(i,a)=>{let o=i.props._offset,s=i.id,c=i.parent&&i.parent.id,l;if(c&&!(c in t)&&r(i.parent,!1),c in n){let e=n[c]=n[c]||jl(t[c],t);l=e(i,a),n[s]=e}else Number.isFinite(o)?(l=o+(t[c]||0),n[s]=null):l=e;return a&&l>=e&&(e=l+1),t[s]=l,l};return r}function Ml(e,{canvasContext:t=e.canvasContext,shaderModuleProps:n,target:r,viewport:i}){let a=n?.project?.devicePixelRatio??t.cssToDeviceRatio(),[,o]=t.getDrawingBufferSize(),s=r?r.height:o,c=i;return[c.x*a,e.type===`webgpu`?c.y*a:s-(c.y+c.height)*a,c.width*a,c.height*a]}function Nl(e,...t){for(let n of t)if(n)for(let t in n)e[t]?Object.assign(e[t],n[t]):e[t]=n[t];return e}var Pl=class extends Al{constructor(e,t){super(e,t);let n=e.createTexture({format:`rgba8unorm`,width:1,height:1,sampler:{minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}),r=e.createTexture({format:`depth16unorm`,width:1,height:1});this.fbo=e.createFramebuffer({id:`shadowmap`,width:1,height:1,colorAttachments:[n],depthStencilAttachment:r})}delete(){this.fbo&&=(this.fbo.destroy(),null)}getShadowMap(){return this.fbo.colorAttachments[0].texture}render(e){let t=this.fbo,n=this.device.canvasContext.cssToDeviceRatio(),r=e.viewports[0],i=r.width*n,a=r.height*n,o=[1,1,1,1];(i!==t.width||a!==t.height)&&t.resize({width:i,height:a}),super.render({...e,clearColor:o,target:t,pass:`shadow`})}getLayerParameters(e,t,n){return{...e.props.parameters,blend:!1,depthWriteEnabled:!0,depthCompare:`less-equal`}}shouldDrawLayer(e){return e.props.shadowEnabled!==!1}getShaderModuleProps(e,t,n){return{shadow:{project:n.project,drawToShadowMap:!0}}}},Fl={color:[255,255,255],intensity:1},Il=[{color:[255,255,255],intensity:1,direction:[-1,3,-1]},{color:[255,255,255],intensity:.9,direction:[1,-8,-2.5]}],Ll=[0,0,0,200/255],Rl=class{constructor(e={}){this.id=`lighting-effect`,this.shadowColor=Ll,this.shadow=!1,this.directionalLights=[],this.pointLights=[],this.shadowPasses=[],this.dummyShadowMap=null,this.setProps(e)}setup(e){this.context=e;let{device:t,deck:n}=e;this.shadow&&!this.dummyShadowMap&&(this._createShadowPasses(t),n._addDefaultShaderModule(ol),this.dummyShadowMap=t.createTexture({width:1,height:1}))}setProps(e){this.ambientLight=void 0,this.directionalLights=[],this.pointLights=[];for(let t in e){let n=e[t];switch(n.type){case`ambient`:this.ambientLight=n;break;case`directional`:this.directionalLights.push(n);break;case`point`:this.pointLights.push(n);break;default:}}this._applyDefaultLights(),this.shadow=this.directionalLights.some(e=>e.shadow),this.context&&this.setup(this.context),this.props=e}preRender({layers:e,layerFilter:t,viewports:n,onViewportActive:r,views:i}){if(this.shadow){this.shadowMatrices=this._calculateMatrices();for(let a=0;a<this.shadowPasses.length;a++)this.shadowPasses[a].render({layers:e,layerFilter:t,viewports:n,onViewportActive:r,views:i,shaderModuleProps:{shadow:{shadowLightId:a,dummyShadowMap:this.dummyShadowMap,shadowMatrices:this.shadowMatrices}}})}}getShaderModuleProps(e,t){let n=this.shadow?{project:t.project,shadowMaps:this.shadowPasses.map(e=>e.getShadowMap()),dummyShadowMap:this.dummyShadowMap,shadowColor:this.shadowColor,shadowMatrices:this.shadowMatrices}:{},r={enabled:!0,lights:this._getLights(e)},i=e.props.material;return{shadow:n,lighting:r,phongMaterial:i,gouraudMaterial:i}}cleanup(e){for(let e of this.shadowPasses)e.delete();this.shadowPasses.length=0,this.dummyShadowMap&&(this.dummyShadowMap.destroy(),this.dummyShadowMap=null,e.deck._removeDefaultShaderModule(ol))}_calculateMatrices(){let e=[];for(let t of this.directionalLights){let n=new R().lookAt({eye:new Hi(t.direction).negate()});e.push(n)}return e}_createShadowPasses(e){for(let t=0;t<this.directionalLights.length;t++){let n=new Pl(e);this.shadowPasses[t]=n}}_applyDefaultLights(){let{ambientLight:e,pointLights:t,directionalLights:n}=this;!e&&t.length===0&&n.length===0&&(this.ambientLight=new Sl(Fl),this.directionalLights.push(new Dl(Il[0]),new Dl(Il[1])))}_getLights(e){let t=[];this.ambientLight&&t.push(this.ambientLight);for(let n of this.pointLights)t.push(n.getProjectedLight({layer:e}));for(let n of this.directionalLights)t.push(n.getProjectedLight({layer:e}));return t}},zl=new class{constructor(e={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(e)}setOptions(e){Object.assign(this.opts,e)}allocate(e,t,{size:n=1,type:r,padding:i=0,copy:a=!1,initialize:o=!1,maxCount:s}){let c=r||e&&e.constructor||Float32Array,l=t*n+i;if(ArrayBuffer.isView(e)){if(l<=e.length)return e;if(l*e.BYTES_PER_ELEMENT<=e.buffer.byteLength)return new c(e.buffer,0,l)}let u=1/0;s&&(u=s*n+i);let d=this._allocate(c,l,o,u);return e&&a?d.set(e):o||d.fill(0,0,4),this._release(e),d}release(e){this._release(e)}_allocate(e,t,n,r){let i=Math.max(Math.ceil(t*this.opts.overAlloc),1);i>r&&(i=r);let a=this._pool,o=e.BYTES_PER_ELEMENT*i,s=a.findIndex(e=>e.byteLength>=o);if(s>=0){let t=new e(a.splice(s,1)[0],0,i);return n&&t.fill(0),t}return new e(i)}_release(e){if(!ArrayBuffer.isView(e))return;let t=this._pool,{buffer:n}=e,{byteLength:r}=n,i=t.findIndex(e=>e.byteLength>=r);i<0?t.push(n):(i>0||t.length<this.opts.poolSize)&&t.splice(i,0,n),t.length>this.opts.poolSize&&t.shift()}};function Bl(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function Vl(e,t){let n=e%t;return n<0?t+n:n}function Hl(e){return[e[12],e[13],e[14]]}function Ul(e){return{left:Gl(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),right:Gl(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),bottom:Gl(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),top:Gl(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),near:Gl(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),far:Gl(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14])}}var Wl=new Hi;function Gl(e,t,n,r){Wl.set(e,t,n);let i=Wl.len();return{distance:r/i,normal:new Hi(-e/i,-t/i,-n/i)}}function Kl(e){return e-Math.fround(e)}var ql;function Jl(e,t){let{size:n=1,startIndex:r=0}=t,i=t.endIndex===void 0?e.length:t.endIndex,a=(i-r)/n;ql=zl.allocate(ql,a,{type:Float32Array,size:n*2});let o=r,s=0;for(;o<i;){for(let t=0;t<n;t++){let r=e[o++];ql[s+t]=r,ql[s+t+n]=Kl(r)}s+=n*2}return ql.subarray(0,a*n*2)}function Yl(e){let t=null,n=!1;for(let r of e)r&&(t?(n||=(t=[[t[0][0],t[0][1]],[t[1][0],t[1][1]]],!0),t[0][0]=Math.min(t[0][0],r[0][0]),t[0][1]=Math.min(t[0][1],r[0][1]),t[1][0]=Math.max(t[1][0],r[1][0]),t[1][1]=Math.max(t[1][1],r[1][1])):t=r);return t}var Xl=Math.PI/180,Zl=Bl(),Ql=[0,0,0],$l={unitsPerMeter:[1,1,1],metersPerUnit:[1,1,1]};function eu({width:e,height:t,orthographic:n,fovyRadians:r,focalDistance:i,padding:a,near:o,far:s}){let c=e/t,l=n?new R().orthographic({fovy:r,aspect:c,focalDistance:i,near:o,far:s}):new R().perspective({fovy:r,aspect:c,near:o,far:s});if(a){let{left:n=0,right:r=0,top:i=0,bottom:o=0}=a,s=I((n+e-r)/2,0,e)-e/2,c=I((i+t-o)/2,0,t)-t/2;l[8]-=s*2/e,l[9]+=c*2/t}return l}var tu=class e{constructor(e={}){this._frustumPlanes={},this.id=e.id||this.constructor.displayName||`viewport`,this.x=e.x||0,this.y=e.y||0,this.width=e.width||1,this.height=e.height||1,this.zoom=e.zoom||0,this.padding=e.padding,this.distanceScales=e.distanceScales||$l,this.focalDistance=e.focalDistance||1,this.position=e.position||Ql,this.modelMatrix=e.modelMatrix||null;let{longitude:t,latitude:n}=e;this.isGeospatial=Number.isFinite(n)&&Number.isFinite(t),this._initProps(e),this._initMatrices(e),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return this.distanceScales.metersPerUnit[2]/this.scale}get projectionMode(){return this.isGeospatial?this.zoom<12?H.WEB_MERCATOR:H.WEB_MERCATOR_AUTO_OFFSET:H.IDENTITY}equals(t){return t instanceof e?this===t?!0:t.width===this.width&&t.height===this.height&&t.scale===this.scale&&t.projectionMode===this.projectionMode&&t.resolution===this.resolution&&ii(t.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&ii(t.projectionMatrix,this.projectionMatrix)&&ii(t.viewMatrix,this.viewMatrix):!1}project(e,{topLeft:t=!0}={}){let n=zc(this.projectPosition(e),this.pixelProjectionMatrix),[r,i]=n,a=t?i:this.height-i;return e.length===2?[r,a]:[r,a,n[2]]}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[r,i,a]=e,o=t?i:this.height-i,s=n&&n*this.distanceScales.unitsPerMeter[2],c=Bc([r,o,a],this.pixelUnprojectionMatrix,s),[l,u,d]=this.unprojectPosition(c);return Number.isFinite(a)?[l,u,d]:Number.isFinite(n)?[l,u,n]:[l,u]}projectPosition(e){let[t,n]=this.projectFlat(e);return[t,n,(e[2]||0)*this.distanceScales.unitsPerMeter[2]]}unprojectPosition(e){let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)*this.distanceScales.metersPerUnit[2]]}projectFlat(e){if(this.isGeospatial){let t=kc(e);return t[1]=I(t[1],-318,830),t}return e}unprojectFlat(e){return this.isGeospatial?Ac(e):e}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,0],t),r=this.unproject([this.width,0],t),i=this.unproject([0,this.height],t),a=this.unproject([this.width,this.height],t);return[Math.min(n[0],r[0],i[0],a[0]),Math.min(n[1],r[1],i[1],a[1]),Math.max(n[0],r[0],i[0],a[0]),Math.max(n[1],r[1],i[1],a[1])]}getDistanceScales(e){return e&&this.isGeospatial?Nc({longitude:e[0],latitude:e[1],highPrecision:!0}):this.distanceScales}containsPixel({x:e,y:t,width:n=1,height:r=1}){return e<this.x+this.width&&this.x<e+n&&t<this.y+this.height&&this.y<t+r}getFrustumPlanes(){return this._frustumPlanes.near||Object.assign(this._frustumPlanes,Ul(this.viewProjectionMatrix)),this._frustumPlanes}panByPosition(e,t,n){return null}_initProps(e){let t=e.longitude,n=e.latitude;this.isGeospatial&&(Number.isFinite(e.zoom)||(this.zoom=jc({latitude:n})+Math.log2(this.focalDistance)),this.distanceScales=e.distanceScales||Nc({latitude:n,longitude:t})),this.scale=2**this.zoom;let{position:r,modelMatrix:i}=e,a=Ql;if(r&&(a=i?new R(i).transformAsVector(r,[]):r),this.isGeospatial){let e=this.projectPosition([t,n,0]);this.center=new Hi(a).scale(this.distanceScales.unitsPerMeter).add(e)}else this.center=this.projectPosition(a)}_initMatrices(e){let{viewMatrix:t=Zl,projectionMatrix:n=null,orthographic:r=!1,fovyRadians:i,fovy:a=75,near:o=.1,far:s=1e3,padding:c=null,focalDistance:l=1}=e;this.viewMatrixUncentered=t,this.viewMatrix=new R().multiplyRight(t).translate(new Hi(this.center).negate()),this.projectionMatrix=n||eu({width:this.width,height:this.height,orthographic:r,fovyRadians:i||a*Xl,focalDistance:l,padding:c,near:o,far:s});let u=Bl();qi(u,u,this.projectionMatrix),qi(u,u,this.viewMatrix),this.viewProjectionMatrix=u,this.viewMatrixInverse=Gi([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=Hl(this.viewMatrixInverse);let d=Bl(),f=Bl();Yi(d,d,[this.width/2,-this.height/2,1]),Ji(d,d,[1,-1,0]),qi(f,d,this.viewProjectionMatrix),this.pixelProjectionMatrix=f,this.pixelUnprojectionMatrix=Gi(Bl(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||N.warn(`Pixel project matrix not invertible`)()}};tu.displayName=`Viewport`;var nu=class e extends tu{constructor(e={}){let{latitude:t=0,longitude:n=0,zoom:r=0,pitch:i=0,bearing:a=0,nearZMultiplier:o=.1,farZMultiplier:s=1.01,nearZ:c,farZ:l,orthographic:u=!1,projectionMatrix:d,repeat:f=!1,worldOffset:p=0,position:m,padding:h,legacyMeterSizes:g=!1}=e,{width:_,height:v,altitude:y=1.5}=e,b=2**r;_||=1,v||=1;let x,S=null;if(d)y=d[5]/2,x=Lc(y);else{e.fovy?(x=e.fovy,y=Rc(x)):x=Lc(y);let n;if(h){let{top:e=0,bottom:t=0}=h;n=[0,I((e+v-t)/2,0,v)-v/2]}S=Ic({width:_,height:v,scale:b,center:m&&[0,0,m[2]*Mc(t)],offset:n,pitch:i,fovy:x,nearZMultiplier:o,farZMultiplier:s}),Number.isFinite(c)&&(S.near=c),Number.isFinite(l)&&(S.far=l)}let C=Fc({height:v,pitch:i,bearing:a,scale:b,altitude:y});p&&(C=new R().translate([512*p,0,0]).multiplyLeft(C)),super({...e,width:_,height:v,viewMatrix:C,longitude:n,latitude:t,zoom:r,...S,fovy:x,focalDistance:y}),this.latitude=t,this.longitude=n,this.zoom=r,this.pitch=i,this.bearing=a,this.altitude=y,this.fovy=x,this.orthographic=u,this._subViewports=f?[]:null,this._pseudoMeters=g,Object.freeze(this)}get subViewports(){if(this._subViewports&&!this._subViewports.length){let t=this.getBounds(),n=Math.floor((t[0]+180)/360),r=Math.ceil((t[2]-180)/360);for(let t=n;t<=r;t++){let n=t?new e({...this,worldOffset:t}):this;this._subViewports.push(n)}}return this._subViewports}equals(t){return t instanceof e&&t._pseudoMeters===this._pseudoMeters&&super.equals(t)}projectPosition(e){if(this._pseudoMeters)return super.projectPosition(e);let[t,n]=this.projectFlat(e);return[t,n,(e[2]||0)*Mc(e[1])]}unprojectPosition(e){if(this._pseudoMeters)return super.unprojectPosition(e);let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)/Mc(n)]}addMetersToLngLat(e,t){return Pc(e,t)}panByPosition(e,t,n){let r=Bc(t,this.pixelUnprojectionMatrix),i=mi([],this.projectFlat(e),gi([],r)),a=mi([],this.center,i),[o,s]=this.unprojectFlat(a);return{longitude:o,latitude:s}}panByPosition3D(e,t){let n=e[2]||0,r=yi([],e,this.unproject(t,{targetZ:n}));return{longitude:this.longitude+r[0],latitude:this.latitude+r[1]}}getBounds(e={}){let t=Wc(this,e.z||0);return[Math.min(t[0][0],t[1][0],t[2][0],t[3][0]),Math.min(t[0][1],t[1][1],t[2][1],t[3][1]),Math.max(t[0][0],t[1][0],t[2][0],t[3][0]),Math.max(t[0][1],t[1][1],t[2][1],t[3][1])]}fitBounds(t,n={}){let{width:r,height:i}=this,{longitude:a,latitude:o,zoom:s}=Vc({width:r,height:i,bounds:t,...n});return new e({width:r,height:i,longitude:a,latitude:o,zoom:s})}};nu.displayName=`WebMercatorViewport`;var ru=[0,0,0];function iu(e,t,n=!1){let r=t.projectPosition(e);if(n&&t instanceof nu){let[n,i,a=0]=e;r[2]=a*t.getDistanceScales([n,i]).unitsPerMeter[2]}return r}function au(e){let{viewport:t,modelMatrix:n,coordinateOrigin:r}=e,{coordinateSystem:i,fromCoordinateSystem:a,fromCoordinateOrigin:o}=e;return i===`default`&&(i=t.isGeospatial?`lnglat`:`cartesian`),a===void 0?a=i:a===`default`&&(a=t.isGeospatial?`lnglat`:`cartesian`),o===void 0&&(o=r),{viewport:t,coordinateSystem:i,coordinateOrigin:r,modelMatrix:n,fromCoordinateSystem:a,fromCoordinateOrigin:o}}function ou(e,{viewport:t,modelMatrix:n,coordinateSystem:r,coordinateOrigin:i,offsetMode:a}){let[o,s,c=0]=e;switch(n&&([o,s,c]=ca([],[o,s,c,1],n)),r){case`default`:return ou(e,{viewport:t,modelMatrix:n,coordinateSystem:t.isGeospatial?`lnglat`:`cartesian`,coordinateOrigin:i,offsetMode:a});case`lnglat`:return iu([o,s,c],t,a);case`lnglat-offsets`:return iu([o+i[0],s+i[1],c+(i[2]||0)],t,a);case`meter-offsets`:return iu(Pc(i,[o,s,c]),t,a);case`cartesian`:return t.isGeospatial?[o+i[0],s+i[1],c+i[2]]:t.projectPosition([o,s,c]);default:throw Error(`Invalid coordinateSystem: ${r}`)}}function su(e,t){let{viewport:n,coordinateSystem:r,coordinateOrigin:i,modelMatrix:a,fromCoordinateSystem:o,fromCoordinateOrigin:s}=au(t),{autoOffset:c=!0}=t,{geospatialOrigin:l=ru,shaderCoordinateOrigin:u=ru,offsetMode:d=!1}=c?oc(n,r,i):{},f=ou(e,{viewport:n,modelMatrix:a,coordinateSystem:o,coordinateOrigin:s,offsetMode:d});return d&&Li(f,f,n.projectPosition(l||u)),f}var cu=Math.PI/180,lu=1e3*60*60*24,uu=2440588,du=2451545,fu=cu*23.4397,pu=357.5291,mu=.98560028,hu=280.147,gu=360.9856235;function _u(e,t,n){let r=cu*-n,i=cu*t,a=yu(e),o=Du(a),s=wu(a,r)-o.rightAscension;return{azimuth:Su(s,i,o.declination),altitude:Cu(s,i,o.declination)}}function vu(e){return(typeof e==`number`?e:e.getTime())/lu-.5+uu}function yu(e){return vu(e)-du}function bu(e,t){let n=e;return Math.atan2(Math.sin(n)*Math.cos(fu)-Math.tan(t)*Math.sin(fu),Math.cos(n))}function xu(e,t){let n=e;return Math.asin(Math.sin(t)*Math.cos(fu)+Math.cos(t)*Math.sin(fu)*Math.sin(n))}function Su(e,t,n){let r=e,i=t,a=n;return Math.atan2(Math.sin(r),Math.cos(r)*Math.sin(i)-Math.tan(a)*Math.cos(i))}function Cu(e,t,n){let r=e,i=t,a=n;return Math.asin(Math.sin(i)*Math.sin(a)+Math.cos(i)*Math.cos(a)*Math.cos(r))}function wu(e,t){return cu*(hu+gu*e)-t}function Tu(e){return cu*(pu+mu*e)}function Eu(e){let t=e,n=cu*(1.9148*Math.sin(t)+.02*Math.sin(2*t)+3e-4*Math.sin(3*t)),r=cu*102.9372;return t+n+r+Math.PI}function Du(e){let t=Eu(Tu(e));return{declination:xu(t,0),rightAscension:bu(t,0)}}function Ou(e,t,n){let r=typeof e==`number`?e:e.getTime();if(!Number.isFinite(r)||!Number.isFinite(new Date(r).getTime()))throw RangeError(`Timestamp must be a valid Date or milliseconds since Unix epoch`);ku(`Latitude`,t,-90,90),ku(`Longitude`,n,-Number.MAX_VALUE,Number.MAX_VALUE)}function ku(e,t,n,r){if(!Number.isFinite(t)||t<n||t>r)throw RangeError(`${e} must be finite and between ${n} and ${r}`)}function Au(e,t){Ou(e,0,t);let n=yu(e),r=Math.floor(n+.5)-.5,i=(n-r)*24,a=n/36525;return(((6.697375+.065709824279*r+1.0027379*i+258e-7*a*a)%24*Math.PI/12+t%360*Math.PI/180)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)}function ju(e,t,n){Ou(e,t,n);let r=t*Math.PI/180,i=Nu(yu(e)),a=Au(e,n)-i.rightAscension,o=Math.sin(r)*Math.sin(i.declination)+Math.cos(r)*Math.cos(i.declination)*Math.cos(a),s=Math.asin(Math.max(-1,Math.min(1,o))),c=i.distance*Math.cos(s),l=i.distance*Math.sin(s)-6378.14;return{azimuth:Su(a,r,i.declination),altitude:Math.atan2(l,c),distance:Math.hypot(c,l),parallacticAngle:Math.atan2(Math.sin(a),Math.tan(r)*Math.cos(i.declination)-Math.sin(i.declination)*Math.cos(a))}}function Mu(e){Ou(e,0,0);let t=yu(e),n=Du(t),r=Nu(t),i=Math.sin(n.declination)*Math.sin(r.declination)+Math.cos(n.declination)*Math.cos(r.declination)*Math.cos(n.rightAscension-r.rightAscension),a=Math.acos(Math.max(-1,Math.min(1,i))),o=149598e3,s=Math.atan2(o*Math.sin(a),r.distance-o*Math.cos(a)),c=Math.atan2(Math.cos(n.declination)*Math.sin(n.rightAscension-r.rightAscension),Math.sin(n.declination)*Math.cos(r.declination)-Math.cos(n.declination)*Math.sin(r.declination)*Math.cos(n.rightAscension-r.rightAscension));return{fraction:(1+Math.cos(s))/2,phase:.5+.5*s*(c<0?-1:1)/Math.PI,angle:c,phaseAngle:s}}function Nu(e){let t=Math.PI/180,n=t*(218.316+13.176396*e),r=t*(134.963+13.064993*e),i=t*(93.272+13.22935*e),a=n+t*6.289*Math.sin(r),o=t*5.128*Math.sin(i);return{rightAscension:bu(a,o),declination:xu(a,o),distance:385001-20905*Math.cos(r)}}var Pu=[[[16.0841732,2.38692098,0,3.84706859,3.50971532,2.71941777],[29.6328593,6.67553103,0,4.69359787,4.8297756,4.05828118],[43.6177737,12.9221792,0,5.30651504,6.03709506,5.72331263],[56.4318509,20.2624988,.563628306,5.72827362,7.0565125,7.37120092],[67.4696183,27.8949807,2.50982369,6.05900461,7.94085903,8.92689762],[76.7913516,35.3349055,5.1734078,6.33584313,8.7200718,10.3778562],[84.5553874,42.2636381,8.37761488,6.57527327,9.4136928,11.7267384],[91.0819731,48.6350964,11.8923363,6.78572347,10.0357941,12.9806193],[96.5645804,54.3994253,15.5697955,6.97221498,10.5971374,14.147659],[101.239452,59.5776551,19.3020672,7.13823706,11.1062519,15.2359273],[105.214189,64.2293175,22.9672208,7.28652727,11.5700449,16.2529746],[108.642226,68.4090759,26.5409668,7.41939616,11.9941883,17.2056917],[111.632747,72.1770266,30.0011035,7.53886071,12.3833849,18.1002908],[114.24552,75.5823986,33.2957306,7.64670023,12.7415635,18.9423341],[116.5477,78.6568096,36.4247457,7.74448302,13.0720283,19.736784],[118.596487,81.4432883,39.396221,7.83358389,13.3775749,20.4880568],[120.420216,83.9747187,42.2091498,7.91520007,13.6605824,21.2000765],[122.059191,86.2913455,44.8786019,7.99036742,13.9230882,21.8763244],[123.528272,88.417275,47.3888907,8.05997734,14.1668467,22.5198837],[124.858603,90.3792643,49.7605477,8.12479357,14.3933784,23.13348],[126.076781,92.1753283,51.9972503,8.18546839,14.6040091,23.7195165],[127.20054,93.8319873,54.1157957,8.2425577,14.7999023,24.2801063],[128.22204,95.3594295,56.1150724,8.29653471,14.9820861,24.817101],[129.154838,96.7754516,58.0111094,8.34780207,15.1514747,25.3321166],[130.013029,98.0917209,59.800021,8.39670244,15.3088873,25.8265579],[130.807358,99.3202613,61.4810335,8.4435276,15.4550628,26.3016397],[131.545333,100.470519,63.071334,8.48852622,15.5906733,26.7584077],[132.231268,101.544727,64.5815757,8.53191033,15.7163342,27.1977573],[132.874234,102.554371,66.0233752,8.57386083,15.8326136,27.6204513],[133.473391,103.501048,67.3935679,8.614532,15.9400402,28.0271365],[134.026949,104.384689,68.6892467,8.65405534,16.0391091,28.4183585],[134.542639,105.214738,69.9218369,8.69254265,16.130288,28.7945766],[135.024856,105.996042,71.0922451,8.73008864,16.2140213,29.1561767],[135.476961,106.733598,72.2018116,8.76677314,16.2907342,29.5034835],[135.901987,107.433049,73.2585825,8.8026628,16.3608358,29.8367716],[136.304002,108.093721,74.2651196,8.83781266,16.4247219,30.156276],[136.68757,108.715543,75.2241692,8.87226734,16.4827769,30.4622008],[137.055993,109.304235,76.1418029,8.90606217,16.5353762,30.7547282],[137.40523,109.861961,77.0186292,8.93922398,16.5828868,31.0340256],[137.730581,110.390041,77.8545721,8.9717719,16.6256691,31.3002524],[138.033908,110.892586,78.6557823,9.0037181,16.6640777,31.5535657],[138.3197,111.370923,79.4232026,9.03506791,16.6984611,31.7941254],[138.590824,111.824527,80.1538061,9.06582134,16.7291642,32.022099],[138.849893,112.253885,80.8466896,9.09597162,16.7565253,32.2376645],[139.097495,112.662594,81.5080769,9.12550807,16.7808803,32.4410146],[139.333702,113.051849,82.1398709,9.15441411,16.8025592,32.6323581],[139.558583,113.422595,82.7434732,9.18266804,16.8218866,32.8119227],[139.773757,113.777125,83.321769,9.21024647,16.8391859,32.9799563],[139.980424,114.11702,83.8770737,9.23711684,16.8547694,33.1367278],[140.177029,114.441233,84.4089408,9.26324765,16.8689496,33.282528],[140.362013,114.748715,84.9169221,9.28860268,16.8820325,33.4176699],[140.535634,115.040613,85.4033904,9.31313499,16.89431,33.5424891],[140.700183,115.319291,85.8708644,9.3368078,16.9060819,33.6573417],[140.856818,115.585267,86.3187376,9.35957107,16.9176302,33.762606],[141.006713,115.839045,86.7463815,9.38136452,16.9292233,33.8586814],[141.151461,116.082082,87.1551456,9.40215039,16.9411453,33.9459837],[141.291491,116.315978,87.5483182,9.42186751,16.9536522,34.0249491],[141.42545,116.539693,87.9250504,9.44043687,16.9669783,34.0960319],[141.551904,116.752126,88.2843956,9.45782365,16.9813891,34.1596966],[141.669681,116.952606,88.6260534,9.47397126,16.997122,34.216423],[141.780472,117.143929,88.9543295,9.48876998,17.0143625,34.2667084],[141.885412,117.326511,89.2690281,9.50217183,17.033338,34.3110527],[141.985221,117.499955,89.568636,9.51415692,17.0542857,34.3499605],[142.080616,117.663867,89.8516398,9.52462139,17.0773661,34.3839515],[142.172644,117.819053,90.1188786,9.53342609,17.1027036,34.413553],[142.261754,117.967567,90.374317,9.54057169,17.1305156,34.4392786],[142.347041,118.108875,90.6174526,9.54605339,17.1609989,34.4616425],[142.427552,118.242356,90.8476242,9.54976096,17.1942593,34.4811683],[142.502328,118.367388,91.0641706,9.55148127,17.2303197,34.4983856],[142.572034,118.485225,91.2693797,9.55121391,17.2693379,34.5137949],[142.638314,118.597653,91.4659524,9.54903236,17.3115024,34.5278818],[142.700809,118.704061,91.6523915,9.54491586,17.356917,34.5411319],[142.759182,118.803816,91.8271916,9.53874512,17.4056027,34.5540281],[142.813096,118.896285,91.9888474,9.53020524,17.4574392,34.5670539],[142.863236,118.982641,92.1394785,9.51928205,17.5124848,34.5806476],[142.910963,119.065315,92.2838559,9.50620125,17.5709236,34.5952106],[142.95578,119.143164,92.4196909,9.4910589,17.6328287,34.6111368],[142.997116,119.214963,92.5445258,9.47390189,17.698215,34.6288028],[143.034405,119.279485,92.6559031,9.45473551,17.7670444,34.6485627],[143.067727,119.336587,92.7530391,9.43349101,17.8392067,34.6707456],[143.100489,119.391924,92.8445576,9.40983892,17.9144112,34.6956561],[143.13169,119.444276,92.929906,9.38333236,17.9922754,34.7235529],[143.159467,119.491024,93.0064727,9.35466302,18.0730392,34.7546105],[143.18196,119.529552,93.0716461,9.32433088,18.1567759,34.7889819],[143.197307,119.557242,93.1228145,9.29277418,18.2434675,34.8267854],[143.207154,119.576636,93.1636292,9.26046603,18.3330547,34.8680983],[143.216146,119.594505,93.202071,9.22794939,18.4254494,34.9129518],[143.223855,119.610128,93.236262,9.19586546,18.5205401,34.9613286],[143.229774,119.62265,93.2641849,9.1649838,18.6181959,35.0131585],[143.233398,119.631216,93.2838226,9.13623789,18.7182701,35.0683157],[143.234218,119.634971,93.2931578,9.11076908,18.8206024,35.1266144]],[[7.83726564,1.08944361,0,3.81608675,3.47022685,2.66339443],[20.5600366,4.49218788,0,4.86427281,4.82502643,4.02519236],[34.5977858,10.0541891,0,5.63841389,6.11846154,5.7026495],[47.7752494,16.9218894,.467333289,6.19754694,7.23532488,7.37028972],[59.3280045,24.2694953,2.18268639,6.64356362,8.2157021,8.95026419],[69.1401448,31.5418927,4.634931,7.01826465,9.08620813,10.4307656],[77.423443,38.4131523,7.63215632,7.34263048,9.8655771,11.8145365],[84.4075331,44.7805435,10.9774327,7.62887297,10.5679933,13.1079233],[90.3181733,50.580641,14.5175909,7.88502035,11.2046895,14.3179123],[95.3480692,55.8423119,18.1255624,8.11685568,11.7847831,15.4512716],[99.6964674,60.57996,21.7112885,8.32879615,12.315773,16.5143208],[103.453728,64.8544545,25.2158184,8.52432149,12.8038743,17.5128971],[106.719639,68.7239199,28.6095768,8.70620342,13.2542635,18.4523755],[109.576746,72.2242284,31.8667065,8.87664544,13.671268,19.3377009],[112.107451,75.3982144,34.9779508,9.03738068,14.0585167,20.173418],[114.375777,78.2912526,37.9484652,9.18974871,14.4190619,20.9636965],[116.394943,80.9227373,40.7495142,9.33476055,14.7554784,21.712353],[118.209649,83.3329323,43.3996449,9.47315534,15.0699453,22.42287],[119.845755,85.5402716,45.9078709,9.60545059,15.3643125,23.0984136],[121.332859,87.5750692,48.2885189,9.73198649,15.6401567,23.7418511],[122.678368,89.4450723,50.5322247,9.85296481,15.8988275,24.3557679],[123.906405,91.1752428,52.6568555,9.96848276,16.1414856,24.9424853],[125.034963,92.7794713,54.663165,10.0785621,16.3691352,25.5040774],[126.080976,94.2775661,56.5655656,10.1831739,16.5826514,26.0423894],[127.047243,95.6700061,58.3656072,10.2822594,16.7828027,26.5590545],[127.94106,96.9626302,60.0685749,10.3757477,16.9702708,27.0555118],[128.771851,98.1696397,61.6850131,10.4635691,17.1456666,27.5330231],[129.538823,99.2929155,63.2137971,10.5456677,17.3095442,27.9926893],[130.250901,100.342904,64.665972,10.6220093,17.4624128,28.4354666],[130.91437,101.328064,66.0446277,10.692589,17.6047462,28.8621815],[131.533835,102.255617,67.3511428,10.7574357,17.7369913,29.2735453],[132.115084,103.132811,68.5949763,10.816616,17.8595753,29.6701675],[132.660695,103.960114,69.7783087,10.8702354,17.9729102,30.0525688],[133.173774,104.739663,70.9043488,10.9184404,18.0773994,30.4211925],[133.658828,105.478773,71.9805905,10.9614165,18.1734388,30.7764159],[134.116036,106.17661,73.0061241,10.9993897,18.2614229,31.1185598],[134.545994,106.832461,73.9807255,11.0326211,18.3417431,31.4478981],[134.953097,107.452078,74.911706,11.0614089,18.4147936,31.7646657],[135.338021,108.039506,75.8003222,11.0860811,18.4809683,32.0690664],[135.700788,108.598204,76.6466607,11.1069952,18.540664,32.3612796],[136.044305,109.133239,77.4560881,11.1245341,18.5942815,32.6414659],[136.370219,109.64402,78.2307217,11.1390979,18.6422181,32.9097736],[136.678721,110.127652,78.9697221,11.1511099,18.6848838,33.1663418],[136.970778,110.582892,79.6735722,11.1609954,18.7226739,33.4113065],[137.248979,111.014625,80.3469589,11.169198,18.7560013,33.6448027],[137.513253,111.425301,80.9918251,11.1761563,18.7852664,33.8669683],[137.763296,111.817,81.6097832,11.1823046,18.8108641,34.0779472],[137.999811,112.192427,82.2049683,11.1880873,18.8332132,34.2778897],[138.224708,112.552605,82.7792158,11.1939074,18.8526809,34.4669584],[138.439022,112.896552,83.3288595,11.2001814,18.8696764,34.6453244],[138.643789,113.223271,83.850224,11.2072982,18.8845914,34.8131725],[138.840232,113.534661,84.3441215,11.2155884,18.8977549,34.9707039],[139.028831,113.832957,84.8155548,11.2254182,18.9095931,35.1181284],[139.209364,114.117262,85.2665728,11.2370731,18.9204438,35.2556751],[139.381623,114.38666,85.6992126,11.2507758,18.9305886,35.3835913],[139.546845,114.641488,86.1167417,11.2668136,18.9404715,35.5021291],[139.706697,114.884321,86.5209101,11.2853455,18.9503803,35.6115647],[139.859304,115.115956,86.9087602,11.3064346,18.9605005,35.7121954],[140.002675,115.337142,87.2772286,11.3302684,18.9712935,35.8043151],[140.135127,115.548875,87.6239756,11.3569078,18.9830756,35.8882402],[140.258651,115.753192,87.9535703,11.3861988,18.9958589,35.9643201],[140.375029,115.949455,88.2678659,11.4181542,19.0100115,36.0328934],[140.485589,116.136431,88.5674559,11.4528189,19.026032,36.0943024],[140.591661,116.312889,88.8529338,11.4899289,19.0439511,36.1489302],[140.694693,116.479228,89.1263987,11.529087,19.0636263,36.1971813],[140.794832,116.638213,89.3902436,11.5702616,19.0856262,36.2394243],[140.890837,116.789482,89.6426177,11.6133393,19.1104492,36.2760412],[140.98143,116.932589,89.8815371,11.6578684,19.1380516,36.307457],[141.065332,117.067085,90.1050179,11.7031034,19.1679013,36.334134],[141.143013,117.19457,90.3148996,11.7488306,19.2004755,36.3564782],[141.216392,117.316833,90.5149648,11.7949625,19.2365459,36.3748855],[141.285573,117.432676,90.7043868,11.8411193,19.2763999,36.389789],[141.350668,117.540896,90.8823342,11.8866521,19.3198505,36.401657],[141.411789,117.64029,91.0479753,11.9304518,19.3658235,36.411013],[141.470041,117.731963,91.2037474,11.9721096,19.4145648,36.4183065],[141.526543,117.819107,91.3537977,12.0117059,19.4673051,36.4239385],[141.580126,117.900758,91.4954485,12.0489659,19.5246196,36.4283546],[141.629543,117.975846,91.6258549,12.0834609,19.5867936,36.4320211],[141.673547,118.043302,91.7421716,12.1146338,19.6538499,36.4354193],[141.711692,118.10313,91.8435226,12.1417406,19.7253943,36.4390476],[141.748045,118.160735,91.939786,12.1634981,19.7997807,36.4434513],[141.782136,118.215055,92.0299293,12.1784101,19.8746752,36.4491785],[141.812506,118.263648,92.110482,12.1871116,19.9524433,36.4565553],[141.837693,118.304075,92.1779732,12.1897001,20.0343822,36.4659531],[141.856235,118.333897,92.2289322,12.1860031,20.1212464,36.4777557],[141.869762,118.355708,92.2676483,12.1757526,20.2136152,36.4923391],[141.882361,118.376046,92.3041269,12.1586287,20.3119768,36.5100651],[141.8934,118.39387,92.3363282,12.1342812,20.4167655,36.5312776],[141.902191,118.408026,92.3620522,12.1023446,20.5283813,36.5562998],[141.908046,118.417362,92.3790989,12.0624492,20.6472031,36.5854323],[141.910278,118.420723,92.3852683,12.0142303,20.7735973,36.6189518]],[[2.40292506,.300215519,0,3.77294854,3.35985232,2.6191313],[11.2617248,2.33974907,0,4.99591265,4.77280973,3.96559359],[23.600513,6.65463654,0,6.00764021,6.22361301,5.67789213],[36.2946001,12.5707631,.344739502,6.78706882,7.50951342,7.39036078],[47.9414527,19.2800654,1.7415165,7.42813893,8.64366679,9.01024351],[58.1335077,26.1340936,3.85230487,7.97687756,9.65152177,10.5240948],[66.9269682,32.8088799,6.54015724,8.45929483,10.5553859,11.9368582],[74.4350222,39.0656458,9.62386154,8.89149681,11.3731552,13.2578454],[80.8746489,44.8548317,12.9320258,9.28417335,12.1189192,14.4966897],[86.4268214,50.1719911,16.3480144,9.64482802,12.803754,15.6621595],[91.2101315,55.0040194,19.7861357,9.97896972,13.4364048,16.7619027],[95.3904387,59.3899613,23.1730794,10.2907842,14.0238219,17.8024976],[99.0757131,63.380147,26.4710769,10.5835298,14.5715703,18.7895903],[102.299089,67.0175341,29.6542238,10.8597811,15.0841398,19.7280423],[105.161706,70.3265388,32.7093377,11.1215864,15.5651795,20.6220615],[107.734482,73.3458745,35.6383881,11.3705746,16.0176775,21.4753102],[110.032263,76.1091902,38.4148822,11.6080321,16.4440978,22.2909926],[112.103256,78.6542129,41.0539543,11.834962,16.8464866,23.0719237],[113.979348,80.993574,43.561091,12.0521314,17.2265554,23.8205848],[115.691864,83.1565764,45.9485328,12.2601111,17.5857466,24.539167],[117.250644,85.1427696,48.1989648,12.4593097,17.9252851,25.2296077],[118.681123,86.9793716,50.3302679,12.6500039,18.2462211,25.8936198],[119.991953,88.6842666,52.3485287,12.8323652,18.5494633,26.532717],[121.201598,90.277986,54.2679654,13.0064834,18.8358073,27.1482357],[122.317411,91.7619413,56.0880639,13.1723877,19.1059586,27.7413541],[123.348147,93.1411958,57.8142924,13.330065,19.3605514,28.3131099],[124.305757,94.4319089,59.4554263,13.4794759,19.6001647,28.8644157],[125.19442,95.6437999,61.0047106,13.6205687,19.8253357,29.3960743],[126.02387,96.7900415,62.4712976,13.7532909,20.0365703,29.908792],[126.799094,97.8670318,63.8655993,13.8775992,20.2343528,30.4031912],[127.52398,98.8703346,65.1964994,13.9934675,20.4191527,30.879822],[128.205421,99.8120357,66.4712341,14.1008938,20.5914318,31.3391731],[128.846372,100.69847,67.6854916,14.1999049,20.7516474,31.7816812],[129.451173,101.535355,68.8376967,14.290561,20.900258,32.2077398],[130.025624,102.328452,69.9377646,14.3729575,21.0377234,32.6177069],[130.565147,103.079001,70.9852814,14.4472282,21.1645103,33.0119114],[131.065441,103.788716,71.9799273,14.513545,21.2810884,33.3906596],[131.531964,104.46318,72.9285461,14.5721195,21.3879367,33.7542393],[131.97215,105.103866,73.8343026,14.6232014,21.4855382,34.1029246],[132.392945,105.711572,74.6994209,14.6670786,21.5743825,34.436979],[132.798863,106.291304,75.5286717,14.704076,21.6549663,34.7566581],[133.187208,106.844055,76.3237776,14.7345519,21.7277835,35.0622124],[133.553977,107.36805,77.0845958,14.7588996,21.7933436,35.3538882],[133.896837,107.862801,77.8130692,14.7775396,21.8521383,35.6319301],[134.220357,108.332679,78.5146828,14.7909235,21.90468,35.8965808],[134.527483,108.780405,79.1865364,14.7995251,21.9514648,36.1480833],[134.820812,109.208404,79.8250937,14.8038392,21.9929804,36.3866809],[135.102801,109.62003,80.4311701,14.8043841,22.0297433,36.6126171],[135.373651,110.016109,81.0102667,14.8016828,22.0622036,36.8261381],[135.632348,110.394468,81.5641095,14.7962792,22.090863,37.0274902],[135.877877,110.752915,82.0943776,14.7887222,22.1162001,37.2169221],[136.111807,111.092869,82.6040928,14.7795503,22.1386137,37.394686],[136.335945,111.417597,83.0946852,14.7693266,22.1586242,37.5610332],[136.549312,111.727102,83.5650647,14.7585902,22.17664,37.7162195],[136.750908,112.021386,84.0141534,14.7478582,22.1929999,37.8605046],[136.940872,112.301543,84.4434311,14.7376817,22.2082449,37.9941444],[137.12145,112.569743,84.8567206,14.7285571,22.222721,38.1174017],[137.293316,112.825919,85.2525619,14.7209322,22.2366483,38.2305434],[137.457102,113.069946,85.629345,14.715319,22.2505889,38.333829],[137.613604,113.302079,85.9860903,14.7121672,22.2649235,38.4275228],[137.764401,113.525235,86.3270897,14.7118014,22.2796592,38.5118985],[137.909014,113.739025,86.6531521,14.7146362,22.2952416,38.5872177],[138.046535,113.942222,86.9638845,14.7211136,22.3122719,38.6537373],[138.176059,114.1336,87.258894,14.7314821,22.3307767,38.7117257],[138.297893,114.313614,87.5395756,14.7458836,22.3505742,38.7614524],[138.414114,114.485095,87.8089762,14.7647045,22.372342,38.8031623],[138.524523,114.648007,88.0661956,14.7882912,22.3966607,38.8370982],[138.628854,114.802181,88.310196,14.8167371,22.4234512,38.8635114],[138.726841,114.947446,88.5399398,14.8498665,22.4520545,38.8826578],[138.819468,115.08542,88.7578234,14.8879067,22.4830097,38.8947587],[138.907934,115.217756,88.9668554,14.9312149,22.5171827,38.9000221],[138.991748,115.343318,89.1653283,14.979905,22.5548471,38.8986618],[139.070408,115.460979,89.3515104,15.0338114,22.5957138,38.8908952],[139.143408,115.569616,89.5236703,15.0922186,22.6384803,38.8769492],[139.21161,115.670566,89.683978,15.1550313,22.6833774,38.8570189],[139.276871,115.767061,89.837567,15.222698,22.7317356,38.8312867],[139.338372,115.857771,89.9820848,15.2953107,22.7841126,38.7999571],[139.395236,115.941234,90.1149953,15.3727733,22.8407302,38.7632504],[139.446584,116.015987,90.2337623,15.4547924,22.9015244,38.7214031],[139.492331,116.081648,90.3377212,15.5407455,22.965998,38.6746656],[139.536548,116.143901,90.436482,15.6290462,23.0323667,38.623296],[139.578378,116.20216,90.5289661,15.7173986,23.0982414,38.5675337],[139.615944,116.254491,90.6117597,15.8067536,23.1662482,38.5076037],[139.647366,116.298957,90.6814493,15.8973892,23.2378199,38.4437349],[139.670769,116.333626,90.7346213,15.9891949,23.3137863,38.3761404],[139.688159,116.361012,90.7755229,16.0818898,23.3947659,38.3050036],[139.704505,116.386754,90.8139672,16.1750479,23.4812532,38.2304681],[139.718888,116.409637,90.8479654,16.2680868,23.5736559,38.1526308],[139.730299,116.428331,90.8753512,16.360242,23.6723177,38.0715391],[139.737726,116.441505,90.8939581,16.4505331,23.7775367,37.9871904],[139.740162,116.447831,90.9016197,16.5377267,23.8895857,37.8995359]],[[.342773515,.0356861703,0,3.57686702,3.18747754,2.50047659],[4.17349167,.796395661,0,5.02775311,4.66090322,3.85991552],[12.5674132,3.36366262,0,6.35901155,6.31057897,5.60608875],[23.0508312,7.69292503,.206090322,7.47351166,7.8234635,7.38229143],[33.7393385,13.1837044,1.20033813,8.43382312,9.17767824,9.07468885],[43.7043805,19.1768586,2.84912333,9.27929607,10.392714,10.663981],[52.6114077,25.2755216,5.08412319,10.035937,11.4909769,12.1530232],[60.5033836,31.1999196,7.73422645,10.7219602,12.4918694,13.5502983],[67.4105775,36.8214853,10.6806078,11.3506393,13.4111921,14.865179],[73.4690651,42.0536046,13.7863895,11.9319155,14.261596,16.1064988],[78.780283,46.8991228,16.9629813,12.4733827,15.0531754,17.2821707],[83.4653366,51.3595535,20.1428977,12.9809275,15.7939948,18.3991487],[87.6265611,55.4623455,23.2841782,13.4591623,16.4905175,19.4634939],[91.3329745,59.2371914,26.3438672,13.911727,17.1479414,20.4804652],[94.6429834,62.7027077,29.3000518,14.3415046,17.7704629,21.4546085],[97.6176845,65.8927791,32.1478683,14.7507792,18.3614813,22.3898381],[100.298487,68.818489,34.8717494,15.1413541,18.9237599,23.2895103],[102.734036,71.5180286,37.481393,15.5146437,19.4595518,24.1564902],[104.941329,74.0137848,39.9616394,15.8717457,19.9707002,24.9932132],[106.958503,76.3329965,42.3270155,16.2134994,20.458718,25.80174],[108.808517,78.475942,44.5741293,16.5405346,20.9248516,26.5838087],[110.517474,80.4685613,46.7168094,16.8533124,21.3701324,27.3408807],[112.082401,82.3238148,48.751769,17.1521603,21.7954191,28.0741827],[113.520121,84.0628366,50.6923171,17.4373022,22.2014322,28.784744],[114.854657,85.6849452,52.5349219,17.7088842,22.5887819,29.4734298],[116.108906,87.193894,54.2809901,17.9669973,22.9579921,30.1409698],[117.284071,88.6073501,55.9421572,18.2116966,23.30952,30.7879832],[118.36577,89.9339686,57.5171483,18.4430179,23.6437722,31.4150004],[119.364377,91.1853883,59.0147721,18.6609914,23.9611187,32.0224811],[120.296825,92.3652706,60.4423845,18.8656542,24.2619044,32.6108296],[121.176426,93.4775127,61.8072209,19.0570586,24.5464585,33.1804076],[122.008649,94.5321864,63.1173701,19.2352819,24.8151031,33.7315441],[122.792343,95.5269304,64.3656482,19.4004298,25.0681583,34.2645446],[123.528977,96.4605694,65.5472651,19.5526443,25.3059501,34.7796973],[124.22654,97.3424552,66.6729055,19.6921032,25.5288116,35.2772782],[124.883104,98.1775622,67.7466452,19.8190267,25.7370904,35.7575554],[125.496769,98.9706774,68.7721764,19.9336732,25.9311462,36.2207916],[126.073501,99.7271058,69.754968,20.0363453,26.1113586,36.6672465],[126.618699,100.446678,70.6958158,20.1273841,26.2781227,37.0971777],[127.137209,101.128719,71.5949876,20.2071716,26.4318538,37.5108414],[127.633067,101.778431,72.458571,20.2761298,26.5729884,37.9084925],[128.10611,102.397814,73.2874335,20.3347114,26.701975,38.2903852],[128.555047,102.985625,74.0786322,20.383414,26.8192951,38.6567705],[128.980032,103.542317,74.831444,20.4227523,26.9254271,39.0078983],[129.385336,104.073013,75.5521229,20.4532865,27.0208902,39.3440133],[129.771079,104.578357,76.2419694,20.4755923,27.1062033,39.6653566],[130.137024,105.058539,76.9017351,20.4902667,27.1818948,39.9721643],[130.484995,105.514963,77.5344779,20.4979501,27.2485442,40.264663],[130.817404,105.95051,78.14293,20.4992601,27.3066752,40.5430758],[131.133824,106.366972,78.7260041,20.4948693,27.3568896,40.8076129],[131.433806,106.766146,79.2825928,20.4854508,27.399782,41.0584755],[131.718682,107.151474,79.8149892,20.471641,27.4358747,41.2958591],[131.990574,107.523471,80.3263933,20.4541657,27.4658492,41.5199381],[132.249814,107.879237,80.8163984,20.4336866,27.4902768,41.7308815],[132.496754,108.215855,81.284612,20.4108273,27.5096649,41.9288499],[132.732456,108.533074,81.7327118,20.3863395,27.5247764,42.1139744],[132.958459,108.835375,82.1640507,20.3608506,27.5361633,42.2863852],[133.174606,109.12345,82.5775105,20.3349085,27.5442444,42.4462065],[133.380707,109.39788,82.9718505,20.3092628,27.5498615,42.5935214],[133.57695,109.65953,83.3464785,20.2845411,27.5536591,42.7284107],[133.765659,109.910872,83.705728,20.2611364,27.5558452,42.850966],[133.946586,110.151675,84.0499465,20.2396944,27.5571697,42.9612308],[134.118722,110.381059,84.3782084,20.2209364,27.5585925,43.0592206],[134.281058,110.598147,84.6895886,20.2052268,27.5603855,43.1449775],[134.434172,110.804009,84.9853264,20.192797,27.5625642,43.218543],[134.580649,111.001665,85.2690577,20.1843695,27.5662233,43.2798797],[134.719886,111.189954,85.5398725,20.18059,27.5723638,43.3289415],[134.851178,111.367569,85.7967105,20.181702,27.5811654,43.3657177],[134.973824,111.5332,86.0385114,20.1876005,27.5920502,43.3902287],[135.088713,111.688286,86.2681078,20.1988634,27.6059788,43.4023923],[135.197715,111.835615,86.488761,20.2162365,27.6243739,43.4020892],[135.300761,111.974754,86.6981598,20.2401019,27.6479115,43.3892358],[135.397801,112.105246,86.8939757,20.2704988,27.6765162,43.3637864],[135.488784,112.226635,87.0738801,20.3068698,27.7086836,43.3257748],[135.575529,112.34047,87.2397745,20.349528,27.7449621,43.2751148],[135.660212,112.449507,87.3975233,20.3994016,27.7874893,43.2116323],[135.740484,112.55233,87.5453823,20.4569633,27.837398,43.13522],[135.81391,112.647437,87.6814251,20.5224898,27.8953876,43.0458058],[135.878053,112.733322,87.8037248,20.5961011,27.9617644,42.943351],[135.931717,112.809803,87.9121773,20.6776887,28.0361737,42.8278616],[135.98101,112.883688,88.0161789,20.7664409,28.1161615,42.6994625],[136.026288,112.95357,88.1140726,20.86125,28.1980168,42.5583351],[136.066454,113.016346,88.2018748,20.9639305,28.2859919,42.4041793],[136.10041,113.068914,88.2756015,21.0756666,28.3826621,42.2367434],[136.127058,113.108172,88.331269,21.1973424,28.4897413,42.0557549],[136.14837,113.137405,88.3734989,21.3297525,28.6086642,41.8608647],[136.168301,113.164779,88.4133157,21.4736317,28.7406975,41.6516191],[136.186001,113.188876,88.448481,21.6296507,28.8869735,41.4274381],[136.200539,113.208123,88.476573,21.7984006,29.0484992,41.1875959],[136.21098,113.220943,88.4951697,21.9803737,29.2261589,40.9312026],[136.216391,113.225761,88.5018489,22.1759461,29.4207166,40.6571843]],[[.0256924181,.00211444891,0,3.38399857,2.99895881,2.4689462],[1.32667927,.22991503,0,4.93502151,4.52467403,3.77046301],[6.24879153,1.57569969,0,6.57524518,6.34849248,5.55010952],[14.0354851,4.49813265,.119519401,8.01807639,8.06161997,7.38594747],[23.0144142,8.71667938,.796125362,9.28749235,9.60853244,9.1393177],[32.0438388,13.7052932,2.05484597,10.4203965,11.0069466,10.7834911],[40.5518478,19.0646916,3.8613791,11.4448716,12.2815392,12.3204335],[48.3402136,24.463943,6.10558636,12.3814147,13.4534656,13.7600941],[55.3569881,29.724193,8.67394922,13.2452719,14.5393632,15.1139207],[61.6372647,34.7656578,11.4711052,14.0480526,15.5521191,16.3927272],[67.2558953,39.494234,14.3784906,14.7987689,16.5017809,17.6060733],[72.2656089,43.907339,17.3285475,15.5045176,17.3962901,18.7621901],[76.7483722,48.0197403,20.2765383,16.1709458,18.2420181,19.8680911],[80.7968242,51.8418108,23.1726563,16.802577,19.0441483,20.9297315],[84.4442471,55.3802595,26.0016386,17.4030498,19.8069483,21.9521633],[87.74293,58.6600701,28.7586595,17.9752944,20.5339653,22.9396724],[90.7450721,61.6973583,31.4065634,18.5216683,21.2281699,23.8958922],[93.4956164,64.5237854,33.9534991,19.0440633,21.892064,24.8238977],[95.9961519,67.1481806,36.3932276,19.5439897,22.5277624,25.7262828],[98.2879782,69.5970806,38.7354534,20.0226477,23.137059,26.6052245],[100.391248,71.8692247,40.9691337,20.4809828,23.7214765,27.4625362],[102.334878,73.9898799,43.1069549,20.9197371,24.282312,28.2997141],[104.128984,75.9695839,45.1402039,21.3394867,24.8206689,29.1179761],[105.795472,77.8282264,47.0790637,21.7406804,25.337491,29.9182964],[107.342204,79.5684359,48.9274684,22.1236641,25.8335837,30.7014362],[108.778892,81.1964434,50.6921788,22.4887109,26.3096416,31.4679706],[110.120817,82.7274063,52.3790931,22.8360363,26.7662613,32.2183131],[111.374722,84.1669971,53.9807216,23.165821,27.2039664,32.9527379],[112.5545,85.5283155,55.5058969,23.4782195,27.6232124,33.6713997],[113.660285,86.8124378,56.9613964,23.7733772,28.0244108,34.3743524],[114.690958,88.0192756,58.3526228,24.0514338,28.4079272,35.0615648],[115.658293,89.159921,59.6878962,24.3125362,28.7741059,35.7329371],[116.567624,90.2386512,60.9618463,24.5568381,29.1232595,36.3883129],[117.423444,91.2600826,62.1708542,24.7845092,29.4556985,37.0274934],[118.231755,92.231514,63.3243338,24.995733,29.7717093,37.6502465],[118.997807,93.1531711,64.4273663,25.190713,30.0715905,38.2563193],[119.727754,94.0260569,65.4851957,25.3696702,30.3556221,38.8454442],[120.427949,94.8574929,66.5042245,25.5328464,30.624103,39.4173496],[121.092564,95.6480336,67.4804554,25.6805034,30.8773227,39.9717646],[121.714468,96.3970402,68.4087891,25.8129249,31.1155821,40.5084262],[122.296726,97.109022,69.2933098,25.9304168,31.339197,41.0270851],[122.847024,97.7875125,70.1396528,26.033312,31.5484646,41.527507],[123.370618,98.4338345,70.9504442,26.1219669,31.7437381,42.009483],[123.872725,99.050515,71.7294223,26.1967772,31.9253163,42.4728217],[124.354994,99.6416672,72.4804102,26.258167,32.0935744,42.9173651],[124.815335,100.206249,73.2011517,26.3066096,32.2488548,43.3429787],[125.251512,100.742823,73.8889542,26.3426302,32.3915043,43.7495557],[125.664341,101.253292,74.5450989,26.3667966,32.5219605,44.1370297],[126.057831,101.741533,75.1744814,26.3797665,32.6405427,44.5053462],[126.433091,102.20739,75.7778782,26.3822433,32.7477175,44.8544992],[126.791225,102.650684,76.3560612,26.3750135,32.8439333,45.1845071],[127.13475,103.073201,76.9125407,26.3589696,32.9295411,45.4953973],[127.464756,103.477479,77.4491504,26.3350349,33.0051485,45.7872633],[127.780006,103.864165,77.963643,26.3042497,33.0712141,46.0601951],[128.079245,104.233898,78.4537605,26.2677422,33.128152,46.3142921],[128.363257,104.588672,78.9202376,26.2266378,33.1767288,46.5497375],[128.635282,104.930668,79.3677995,26.1821709,33.2174699,46.7666836],[128.894696,105.25839,79.7961546,26.1356354,33.250805,46.9652713],[129.14078,105.570255,80.2048362,26.0882502,33.2776707,47.1457579],[129.373165,105.865307,80.5938468,26.0412816,33.2988031,47.3083678],[129.594561,106.147666,80.966958,25.9960438,33.3145531,47.4532384],[129.805651,106.417657,81.324597,25.9537079,33.3258639,47.580643],[130.006432,106.674379,81.6662246,25.9153682,33.3338789,47.690908],[130.196904,106.91693,81.9913015,25.8821425,33.3391325,47.7842077],[130.378213,107.146265,82.3015602,25.8550693,33.3420046,47.860662],[130.5523,107.365535,82.6005473,25.8349688,33.3438405,47.9206318],[130.718336,107.574206,82.8864709,25.8225975,33.3458806,47.9644487],[130.875402,107.771611,83.1573686,25.818685,33.3486983,47.9922494],[131.022578,107.957079,83.4112776,25.823881,33.3523161,48.0039879],[131.161097,108.132518,83.6508725,25.8386334,33.3579938,47.9999436],[131.293105,108.30031,83.8802818,25.8633191,33.367304,47.9804747],[131.418157,108.459346,84.0975847,25.8982945,33.3812166,47.9457442],[131.535788,108.608495,84.3008387,25.9438598,33.4001411,47.8957162],[131.645533,108.746624,84.4881015,26.000211,33.4234727,47.8299999],[131.749319,108.875347,84.6613426,26.0674613,33.4521283,47.7486372],[131.85006,108.99844,84.8260139,26.1457765,33.4881435,47.6520099],[131.945339,109.114312,84.9805349,26.2353586,33.5328232,47.5402654],[132.032627,109.221265,85.1231377,26.3364444,33.5871917,47.4134616],[132.109395,109.317597,85.252054,26.4493047,33.6520441,47.2715955],[132.174569,109.403174,85.367437,26.574205,33.7277694,47.1145584],[132.235411,109.485968,85.4791105,26.7111738,33.8133438,46.9418064],[132.291783,109.564279,85.5847968,26.8599117,33.9068876,46.7525496],[132.341799,109.634394,85.6797278,27.0211714,34.0120167,46.5479635],[132.383571,109.692603,85.7591354,27.1957099,34.1311093,46.3289033],[132.415211,109.735193,85.8182515,27.3842602,34.265846,46.0960619],[132.439452,109.765921,85.8619999,27.5875301,34.4175858,45.8500669],[132.462297,109.794485,85.9029413,27.8061443,34.5874228,45.5914612],[132.482469,109.819462,85.9389591,28.0405823,34.7762014,45.320665],[132.498596,109.839257,85.9677375,28.2911202,34.9845273,45.0379369],[132.509308,109.852275,85.986961,28.557785,35.2127857,44.7433438],[132.513234,109.856922,85.994314,28.840326,35.4611664,44.4367435]],[[.00105168546,705673637e-13,0,3.25304403,2.90819177,2.44196989],[.479060494,.0753169605,0,4.82793803,4.42627407,3.71700504],[3.5928081,.866025535,0,6.66627146,6.33657704,5.4852161],[9.6407631,2.99494443,.0770589106,8.31358141,8.17535941,7.33557449],[17.3412955,6.40853898,.588504033,9.77116069,9.85264258,9.11757639],[25.5079459,10.7076678,1.61532575,11.0756961,11.3739999,10.7970498],[33.5281203,15.5032931,3.16473882,12.2579658,12.7603201,12.3714334],[41.08186,20.4944747,5.14658018,13.3413028,14.0326146,13.8481646],[47.9949932,25.4602948,7.47643291,14.3433282,15.2089127,15.2375633],[54.2823998,30.2699588,10.0400283,15.2774987,16.3040333,16.5502418],[59.9754564,34.8698175,12.7470533,16.1542109,17.3300284,17.7961527],[65.1240101,39.2075928,15.5288951,16.9815665,18.2967054,18.9842713],[69.7856166,43.2765182,18.3393767,17.7659157,19.2120761,20.1225279],[73.9834056,47.091762,21.1304572,18.5122476,20.0827121,21.2178388],[77.7959661,50.6494355,23.8655401,19.2244849,20.9140188,22.2761706],[81.2857764,53.9682679,26.5300976,19.9057059,21.7104458,23.3026171],[84.4560139,57.0483326,29.1139101,20.5583183,22.4756512,24.301476],[87.3562309,59.9206798,31.6204925,21.1841989,23.2126322,25.2763255],[90.0160183,62.6029428,34.0307878,21.7848001,23.9238304,26.2300971],[92.4706869,65.1178493,36.3529227,22.3612453,24.6112189,27.1651451],[94.7326993,67.4609942,38.5664059,22.9143943,25.2763746,28.0833138],[96.8311018,69.6563068,40.6844002,23.4449126,25.9205407,28.9859991],[98.7702971,71.7081639,42.7080074,23.9533091,26.5446791,29.8742081],[100.572137,73.6353371,44.648118,24.4399896,27.1495172,30.7486123],[102.247625,75.4432071,46.5019216,24.9052741,27.735587,31.6095985],[103.809457,77.1392773,48.2719395,25.349441,28.3032613,32.4573134],[105.270888,78.7376302,49.9659331,25.7727287,28.852783,33.2917059],[106.633136,80.2435059,51.5785345,26.1753746,29.3842934,34.1125631],[107.908673,81.6698285,53.1195263,26.5576027,29.8978542,34.919544],[109.106647,83.0176653,54.591095,26.9196622,30.3934698,35.7122084],[110.235082,84.2871265,55.9934385,27.2618016,30.8711027,36.4900429],[111.303599,85.4896986,57.3354826,27.5843112,31.3306925,37.2524825],[112.309847,86.6275063,58.6182277,27.8874824,31.7721642,37.9989311],[113.25299,87.7032096,59.8435654,28.1716586,32.1954462,38.728777],[114.142815,88.725155,61.0185565,28.4371792,32.6004719,39.4414078],[114.984193,89.6953645,62.1435316,28.6844405,32.9871975,40.1362213],[115.781972,90.616198,63.2196111,28.9138286,33.3555978,40.8126363],[116.542034,91.4941294,64.2540609,29.1257818,33.7056835,41.4700995],[117.263754,92.3304631,65.2452944,29.3207333,34.037495,42.1080922],[117.945778,93.1257337,66.1903863,29.4991429,34.3511128,42.7261351],[118.592205,93.885997,67.0936847,29.6614951,34.6466616,43.3237915],[119.207026,94.6124991,67.9594799,29.8082504,34.9242978,43.9006698],[119.792093,95.3028803,68.7892586,29.9399426,35.1842434,44.4564247],[120.350706,95.9566298,69.5857714,30.0570343,35.4267355,44.990757],[120.887266,96.5795501,70.3532859,30.1600775,35.6520895,45.5034147],[121.398381,97.1738294,71.0903504,30.2495805,35.8606444,45.9941899],[121.880174,97.741224,71.7950965,30.3260584,36.0527783,46.4629176],[122.332744,98.2848023,72.4699277,30.3901065,36.2289615,46.9094767],[122.761676,98.8066017,73.1190406,30.4422147,36.389624,47.3337794],[123.16988,99.3058751,73.7410932,30.4829984,36.535322,47.7357784],[123.560222,99.7818747,74.3347048,30.513051,36.6666319,48.1154572],[123.935375,100.237115,74.9021143,30.5329158,36.784077,48.4728208],[124.295705,100.674274,75.4468694,30.5432974,36.8883986,48.807912],[124.640577,101.092214,75.9689376,30.5448175,36.980239,49.120784],[124.969349,101.489807,76.4682894,30.5381127,37.0602004,49.4115003],[125.283002,101.867862,76.9467264,30.5239715,37.1292069,49.6801594],[125.584209,102.229852,77.4074058,30.5031028,37.18797,49.9268483],[125.872518,102.575952,77.8494296,30.4762465,37.2370804,50.1516461],[126.147384,102.906238,78.2717895,30.4442767,37.277635,50.3546688],[126.408703,103.221277,78.6741936,30.4080283,37.3105314,50.5360092],[126.659759,103.524579,79.0614881,30.3683663,37.3361987,50.6957136],[126.900352,103.815603,79.4333324,30.3262432,37.3557001,50.8338626],[127.129332,104.092746,79.787906,30.2825895,37.3703569,50.9505348],[127.345551,104.354407,80.1233879,30.2383914,37.3807274,51.045729],[127.54983,104.60147,80.4407032,30.1947514,37.3870875,51.1194001],[127.745421,104.837971,80.7444956,30.1526483,37.3909538,51.1715595],[127.931509,105.062981,81.0340467,30.1130181,37.3937536,51.2021719],[128.107163,105.275409,81.3084753,30.0769566,37.3959728,51.2110993],[128.27145,105.474168,81.5669002,30.0458043,37.3971964,51.1981114],[128.426157,105.661057,81.8121353,30.0205229,37.3987896,51.1630453],[128.573786,105.839005,82.0473875,30.0018457,37.4026776,51.1057128],[128.713321,106.00733,82.2706717,29.9906479,37.4099127,51.025817],[128.843717,106.165331,82.4799697,29.9880296,37.4206278,50.9229622],[128.963925,106.312307,82.6732634,29.9956539,37.4331463,50.7966298],[129.075516,106.450347,82.8525283,30.0144809,37.4482419,50.6463942],[129.182,106.583062,83.0232607,30.0447912,37.4687059,50.471884],[129.281939,106.70828,83.1837589,30.0872221,37.4961532,50.2726567],[129.373759,106.823687,83.3321278,30.1426372,37.5317053,50.0482683],[129.455887,106.926969,83.4664727,30.2121818,37.5760162,49.7983157],[129.527962,107.017476,83.5870062,30.2974715,37.6288693,49.5224672],[129.596313,107.103581,83.7046784,30.4013902,37.6870903,49.2204512],[129.660257,107.18433,83.8165301,30.5278157,37.7454186,48.8921333],[129.717594,107.256703,83.9168371,30.6766598,37.8095151,48.537789],[129.766124,107.317679,83.999875,30.8485272,37.8828663,48.1577081],[129.803646,107.364237,84.0599196,31.0443039,37.967761,47.7521944],[129.833049,107.399963,84.102344,31.2647982,38.0660381,47.3215329],[129.860785,107.433461,84.1415762,31.5106197,38.1792064,46.8659349],[129.885394,107.463081,84.1757626,31.782115,38.3084744,46.385486],[129.905296,107.487051,84.2027833,32.0793401,38.4547597,45.8801068],[129.918908,107.503598,84.2205181,32.4020635,38.6186998,45.3495352],[129.924648,107.510951,84.2268472,32.749794,38.80067,44.7933307]],[[405853752e-14,0,0,3.05028298,2.79434874,2.39217544],[.0886879878,.0119673113,0,4.65847962,4.27487961,3.63836426],[1.4423367,.322087606,0,6.71038976,6.29074293,5.39990504],[5.18314327,1.52988604,.03890516,8.62914501,8.26585328,7.26415896],[10.8528905,3.86018715,.35763822,10.3416077,10.0760595,9.07028442],[17.5271855,7.12427019,1.08476481,11.880001,11.7245939,10.7799144],[24.5129237,11.036208,2.27385726,13.2787014,13.234647,12.3890417],[31.3784097,15.3084437,3.88270817,14.5643363,14.6290253,13.9046373],[37.9168741,19.7071275,5.84031062,15.7570132,15.9265642,15.3367778],[44.0288436,24.115119,8.0594193,16.8721577,17.1422762,16.6957995],[49.6695552,28.4057669,10.4538615,17.9218361,18.2881715,17.991312],[54.8438044,32.5274089,12.9630213,18.9156308,19.3740137,19.23193],[59.5905257,36.4594133,15.5419532,19.8612265,20.4078772,20.4252741],[63.9638263,40.1852607,18.1389537,20.7648141,21.3965297,21.5780543],[67.967879,43.698582,20.7143321,21.6313832,22.3456908,22.6961662],[71.6377216,47.0109306,23.249686,22.4649411,23.2602076,23.7847735],[75.005165,50.1166113,25.7260944,23.2686826,24.1441799,24.8483729],[78.1139956,53.0383025,28.144051,24.0451277,25.0010551,25.8908441],[80.9847407,55.7722042,30.4712649,24.7962303,25.8337029,26.9154901],[83.649483,58.3427912,32.718066,25.5234757,26.6444815,27.9250713],[86.1052703,60.7577696,34.882673,26.2279532,27.4352931,28.9218387],[88.3835168,63.0369243,36.973269,26.9104316,28.2076385,29.9075661],[90.5015218,65.1776869,38.9783242,27.5714066,28.9626619,30.8835847],[92.4818195,67.1970968,40.9070787,28.2111645,29.7012009,31.8508184],[94.3323787,69.0987769,42.754703,28.8298104,30.4238217,32.8098209],[96.0653792,70.8892349,44.520389,29.4273244,31.130865,33.7608139],[97.6936551,72.5816219,46.2134037,30.0035747,31.822473,34.7037251],[99.2168422,74.1776327,47.8313188,30.5583698,32.498631,35.6382265],[100.649213,75.690263,49.3827057,31.091457,33.1591863,36.5637715],[101.996451,77.1217049,50.8690936,31.6025754,33.8038867,37.47963],[103.26223,78.4723574,52.2911528,32.0914388,34.4323894,38.384923],[104.458217,79.7532098,53.6574462,32.5577929,35.0443003,39.2786532],[105.586153,80.9685382,54.9653195,33.0013812,35.6391697,40.159735],[106.648423,82.1229637,56.21331,33.4220121,36.216537,41.0270203],[107.654037,83.2237108,57.4095454,33.8195039,36.7759105,41.8793235],[108.606812,84.2716536,58.5564201,34.1937648,37.3168198,42.7154423],[109.510748,85.2686279,59.6568225,34.5447215,37.8387815,43.5341771],[110.372007,86.2225729,60.7173437,34.8724012,38.3413551,44.3343473],[111.191415,87.1319744,61.7352478,35.1768685,38.8241081,45.1148059],[111.969157,87.9938884,62.70661,35.4582694,39.2866499,45.8744511],[112.712228,88.813012,63.6363554,35.7168347,39.7286398,46.6122372],[113.421373,89.594228,64.5284059,35.9528197,40.1497425,47.3271811],[114.092872,90.3396146,65.3830155,36.1666343,40.54974,48.0183716],[114.724971,91.0525083,66.2018406,36.3586526,40.9283683,48.6849698],[115.324051,91.7372537,66.9896052,36.529429,41.2855181,49.3262178],[115.894325,92.3921123,67.7461501,36.6795166,41.6210671,49.9414358],[116.439607,93.0149009,68.470919,36.8095323,41.9349365,50.5300244],[116.963875,93.6070717,69.1670245,36.9202622,42.2272323,51.0914695],[117.46789,94.17331,69.837829,37.0123857,42.4978991,51.6253276],[117.950157,94.7146584,70.481205,37.0868112,42.747159,52.1312413],[118.40917,95.2321291,71.0949781,37.1444542,42.9752347,52.6089256],[118.847531,95.7285701,71.6806911,37.1861743,43.1821999,53.0581552],[119.268272,96.2057996,72.2424964,37.2131191,43.3686015,53.4787925],[119.669809,96.6629257,72.7815709,37.2263129,43.5347372,53.8707462],[120.050562,97.0990535,73.2990924,37.2267945,43.6808256,54.2339729],[120.411386,97.5159135,73.7977489,37.2158922,43.8077443,54.5685156],[120.756227,97.9173249,74.2799512,37.194765,43.9159241,54.8744337],[121.084993,98.3013969,74.7436118,37.1645695,44.0055948,55.1518098],[121.397427,98.666084,75.1865356,37.1267644,44.0779612,55.4008166],[121.693566,99.0099438,75.6074515,37.0826821,44.1338394,55.621627],[121.975953,99.337011,76.0122023,37.0335444,44.1732483,55.814381],[122.245605,99.6489011,76.4006048,36.9808388,44.1973791,55.9793036],[122.502991,99.9461658,76.770628,36.9260631,44.207848,56.1166491],[122.748579,100.229357,77.120241,36.870557,44.2050008,56.2265901],[122.984273,100.500586,77.4502718,36.8157168,44.1888145,56.3092706],[123.212359,100.762365,77.7656197,36.763074,44.1613205,56.3649422],[123.430708,101.012699,78.0659046,36.7140473,44.1243711,56.3938164],[123.637113,101.249474,78.3505656,36.6700026,44.0783744,56.3959892],[123.829365,101.470579,78.6190423,36.6323951,44.0224747,56.3714579],[124.00927,101.677798,78.8741091,36.6026046,43.958586,56.3203277],[124.180514,101.875006,79.1187613,36.5818151,43.8894149,56.2426796],[124.342248,102.061556,79.3511682,36.5711576,43.8163604,56.1384599],[124.493556,102.236773,79.569478,36.5718225,43.7395369,56.0074935],[124.63352,102.399989,79.771839,36.5853183,43.6566023,55.8494595],[124.763882,102.553743,79.9606163,36.6127544,43.568788,55.6641433],[124.888361,102.702147,80.1414058,36.6547201,43.4801018,55.451369],[125.00539,102.842287,80.311753,36.7119334,43.3928592,55.2108507],[125.113295,102.971109,80.4690029,36.785236,43.3086954,54.9422784],[125.210403,103.08556,80.6105007,36.8756974,43.2286352,54.6453728],[125.296499,103.184493,80.7357849,36.9848292,43.1525822,54.3199334],[125.37914,103.277552,80.8560731,37.1153065,43.0765995,53.965862],[125.457008,103.364245,80.9694361,37.2708906,42.9941644,53.5832692],[125.526921,103.441752,81.0711612,37.4523398,42.9131585,53.1726406],[125.585701,103.507255,81.1565351,37.6610341,42.8384389,52.7345007],[125.630168,103.557935,81.2208449,37.8986616,42.7731927,52.2694112],[125.66399,103.597702,81.2694281,38.1668812,42.7199421,51.7779209],[125.695854,103.635148,81.3151878,38.4671523,42.6807179,51.2604869],[125.724007,103.668369,81.3555744,38.8006009,42.6571156,50.7173949],[125.746526,103.695304,81.3878276,39.1679185,42.6503275,50.1486914],[125.76149,103.71389,81.4091869,39.5693001,42.6611773,49.5541392],[125.766976,103.722064,81.416892,40.0044226,42.6901617,48.9332024]],[[0,0,0,2.8363167,2.65482859,2.34797976],[.0056571388,.000551260227,0,4.41200613,4.0657188,3.52216554],[.322801992,.0635599163,0,6.68008019,6.13495074,5.2342881],[1.86636762,.505578476,.0124445771,8.88820353,8.24274368,7.08903788],[5.01856177,1.67350096,.157574787,10.8799095,10.2065095,8.91165653],[9.4312063,3.63896106,.562040124,12.6726247,12.0079406,10.6529054],[14.6147898,6.29872952,1.31684183,14.3066552,13.6644575,12.3026064],[20.131644,9.45638332,2.43421144,15.8157186,15.1986084,13.865003],[25.7116731,12.9283244,3.88465469,17.224029,16.6304589,15.3494227],[31.142653,16.5600867,5.60974291,18.5488134,17.9764323,16.7663516],[36.3728567,20.2459108,7.55006661,19.8028956,19.2498325,18.1258031],[41.3156517,23.8977597,9.64546965,20.9964072,20.4616199,19.4367308],[45.9528026,27.4698471,11.8506128,22.1377596,21.6210509,20.7069137],[50.3036418,30.9353362,14.1133917,23.2341515,22.736118,21.9430389],[54.3625771,34.2609853,16.4009462,24.29182,23.8138253,23.1508482],[58.1509653,37.4405917,18.6962017,25.3161608,24.8603471,24.3352843],[61.6591076,40.4689575,20.9596571,26.3117925,25.8811158,25.5006147],[64.9246215,43.3586415,23.1903011,27.2825997,26.8808709,26.6505249],[67.9881549,46.089592,25.3736358,28.2317708,27.8636866,27.7881842],[70.8699249,48.6811976,27.5120352,29.1618442,28.832998,28.9162905],[73.5473139,51.138386,29.5838755,30.0747523,29.7916222,30.0371001],[76.0501173,53.4769401,31.5965232,30.9718796,30.741791,31.1524487],[78.3847821,55.687948,33.5381206,31.8541114,31.6851787,32.2637683],[80.5713324,57.7859855,35.4154575,32.7218999,32.622947,33.3721028],[82.6241562,59.7726051,37.224081,33.5753089,33.5557778,34.4781253],[84.5580789,61.6514264,38.9632863,34.4140832,34.4839268,35.5821574],[86.3842338,63.4356618,40.6397272,35.2376844,35.4072571,36.684191],[88.1038164,65.129116,42.2484976,36.0453603,36.3252979,37.7839136],[89.7319958,66.7435415,43.7968376,36.8361676,37.2372727,38.8807341],[91.2697303,68.2796073,45.2863002,37.6090431,38.1421622,39.9738133],[92.7154404,69.7371688,46.7175411,38.3628079,39.0387216,41.0620915],[94.082139,71.1271234,48.0983101,39.0962456,39.9255498,42.1443208],[95.3767938,72.4502501,49.4244926,39.8080824,40.8010888,43.2190926],[96.6069069,73.708778,50.6938719,40.4970779,41.6637042,44.2848705],[97.7805411,74.9116895,51.91477,41.1619769,42.5116612,45.3400135],[98.8944442,76.0575518,53.0868035,41.8016171,43.3432192,46.3828092],[99.9466107,77.1454111,54.2097876,42.4148543,44.1565851,47.4114913],[100.946853,78.1831395,55.2898998,43.0006763,44.9500136,48.4242712],[101.897488,79.1738478,56.3283781,43.5581312,45.7217611,49.4193509],[102.799231,80.1195431,57.3255252,44.086395,46.4701488,50.3949474],[103.657137,81.026325,58.2863495,44.5847849,47.1935844,51.3493103],[104.475164,81.8953852,59.2121943,45.0526782,47.8905009,52.2807257],[105.25518,82.7248738,60.1014823,45.4897143,48.5595394,53.1875533],[106.000097,83.5149633,60.9551361,45.8955043,49.1993021,54.0681972],[106.714331,84.271704,61.7792745,46.2699807,49.8086703,54.9211641],[107.397529,84.9960434,62.571328,46.6131056,50.3865493,55.7450259],[108.049018,85.6884101,63.3279956,46.9249735,50.9319644,56.5384382],[108.671973,86.3519404,64.0499716,47.2060203,51.4442724,57.3001851],[109.270065,86.989723,64.7426513,47.4564937,51.9226489,58.0290779],[109.84134,87.6006236,65.4080705,47.6771119,52.3667444,58.724087],[110.3838,88.1834765,66.0482449,47.8686346,52.7762682,59.3842577],[110.899439,88.7408507,66.6672442,48.0316821,53.1507831,60.0086563],[111.392382,89.276147,67.2661159,48.1675509,53.4905945,60.5965717],[111.863233,89.7886747,67.8418178,48.2772472,53.7957094,61.147273],[112.312588,90.277766,68.391312,48.3617508,54.0660952,61.6600574],[112.742584,90.7452194,68.9150422,48.4228522,54.3026893,62.1345022],[113.155977,91.1948424,69.4183923,48.4618398,54.5058582,62.570075],[113.551734,91.6253409,69.9010152,48.4798537,54.6757618,62.9662097],[113.928721,92.0352514,70.362379,48.4790833,54.8139133,63.3227197],[114.286381,92.4237338,70.8026059,48.4612886,54.9213251,63.6393053],[114.628823,92.7950399,71.2263971,48.4275092,54.9980152,63.9154022],[114.956569,93.1501724,71.6334652,48.3799289,55.0455652,64.1508795],[115.268993,93.4889657,72.022147,48.3210383,55.0660862,64.3457575],[115.565475,93.8112543,72.3907792,48.2521933,55.0600787,64.4996066],[115.847703,94.1190186,72.7403599,48.1745164,55.0276286,64.6118777],[116.119273,94.4156725,73.0754151,48.0907665,54.9713663,64.6827192],[116.378417,94.6992061,73.3953437,48.003415,54.8936349,64.7121779],[116.62319,94.9674585,73.6993719,47.913776,54.7949911,64.6997919],[116.851651,95.2182687,73.986726,47.8222906,54.6745004,64.6447021],[117.065536,95.4539134,74.2608431,47.7313276,54.5345142,64.54692],[117.268717,95.6786333,74.5250352,47.6435928,54.3782103,64.4066221],[117.460819,95.8912656,74.7763179,47.560729,54.2071379,64.2235154],[117.641462,96.0906224,75.0116732,47.4834401,54.021307,63.9969106],[117.810262,96.2755153,75.2280831,47.4108693,53.8179161,63.7255096],[117.970103,96.4481801,75.427633,47.3443154,53.5982337,63.4090388],[118.125038,96.6132647,75.6173334,47.2865312,53.3665581,63.0478711],[118.271603,96.768739,75.7952822,47.2390585,53.1251667,62.6419086],[118.406189,96.9124055,75.9593403,47.2029475,52.8755149,62.1909341],[118.525192,97.0420666,76.1073687,47.1788858,52.6183471,61.6947169],[118.627095,97.1575208,76.2393867,47.1669945,52.3531585,61.1530121],[118.722319,97.2689947,76.3666283,47.1654197,52.0752401,60.5652356],[118.810668,97.3743806,76.4867664,47.1711141,51.7771022,59.930934],[118.88943,97.4690092,76.5946891,47.188915,51.4669693,59.2522455],[118.955893,97.5482113,76.6852844,47.2219122,51.1496148,58.5307521],[119.007345,97.6073177,76.7534406,47.2721579,50.8278645,57.7677586],[119.047927,97.6512789,76.8047795,47.3411206,50.5036941,56.964415],[119.086385,97.6925246,76.85302,47.4296743,50.1784191,56.1216844],[119.120541,97.7288243,76.895569,47.5380323,49.8527652,55.2402999],[119.148066,97.7577523,76.9295846,47.6656935,49.5269238,54.3207359],[119.166635,97.7768828,76.9522246,47.8114239,49.200618,53.363206],[119.17392,97.7837901,76.960647,47.9732789,48.8731812,52.367691]],[[0,0,0,2.64906018,2.53803189,2.29871964],[61420619e-12,0,0,4.09650079,3.81102215,3.36459219],[.027871758,.00451721436,0,6.47707316,5.83819582,4.96315804],[.346451215,.0811476053,.00176569509,8.90513546,7.99528004,6.76111144],[1.40830183,.421206796,.0404985592,11.1433155,10.0505797,8.57222615],[3.39063724,1.19989354,.190798277,13.1728514,11.9576985,10.3296819],[6.22150112,2.4956712,.536384445,15.0201548,13.7222119,12.0122069],[9.67666966,4.26731131,1.12771874,16.7185703,15.364092,13.6186876],[13.5377724,6.44077455,1.98074455,18.2979029,16.905046,15.1567168],[17.624263,8.90789386,3.08736121,19.7822681,18.3644491,16.6369421],[21.7567836,11.5810689,4.40553086,21.1906279,19.7584581,18.0702802],[25.8707742,14.371115,5.90864796,22.5379566,21.1002488,19.4666478],[29.9194457,17.2206494,7.56850123,23.8363244,22.4005643,20.8345089],[33.8316256,20.0846596,9.32001738,25.0957086,23.6682645,22.1808408],[37.5935001,22.9242516,11.1452183,26.3245437,24.9107759,23.5112961],[41.2057745,25.7221006,13.0319472,27.5300687,26.1344248,24.8304323],[44.6280451,28.4498326,14.943299,28.7185356,27.3446667,26.1419413],[47.8782093,31.1084815,16.8737855,29.8953324,28.5462396,27.4488443],[50.9634702,33.6645777,18.7853663,31.0650515,29.7432554,28.7536422],[53.9000213,36.1292735,20.6801811,32.2315351,30.9392592,30.0584206],[56.6773762,38.497261,22.5385617,33.3979029,32.1372562,31.3649163],[59.3152606,40.7787529,24.364606,34.5665815,33.3397351,32.6745544],[61.8048527,42.9643292,26.1507842,35.7393266,34.5486697,33.9884636],[64.1622618,45.0647078,27.9024568,36.917258,35.7655379,35.3074815],[66.3934713,47.0742328,29.6081336,38.1008851,36.9913164,36.6321498],[68.5053278,48.9924702,31.2626344,39.2901512,38.2265088,37.9627138],[70.5112416,50.8294394,32.8709408,40.4844627,39.4711398,39.2991174],[72.4153676,52.581091,34.4244557,41.6827425,40.7247985,40.6410095],[74.231581,54.2560661,35.9291165,42.8834601,41.9866319,41.9877458],[75.9589038,55.8597378,37.3848494,44.0846934,43.2554062,43.3384078],[77.5952205,57.396374,38.789819,45.2841557,44.5294942,44.6918095],[79.1533969,58.8738588,40.1503252,46.4792672,45.8069597,46.0465286],[80.6358798,60.2892879,41.465214,47.667174,47.0855283,47.4009146],[82.0458222,61.642136,42.7353131,48.8448309,48.3627023,48.7531306],[83.392484,62.941677,43.9670742,50.009008,49.635703,50.1011562],[84.6764145,64.1857029,45.1541598,51.1563848,50.901621,51.4428392],[85.8987166,65.3725718,46.2910382,52.2835451,52.1573283,52.7758893],[87.0676885,66.5103775,47.3848733,53.3870739,53.399647,54.097935],[88.1849002,67.6006826,48.438656,54.4635552,54.6252687,55.4065157],[89.2508738,68.6437617,49.454003,55.5096429,55.8308663,56.699122],[90.273052,69.6453434,50.4353817,56.5221016,57.0131348,57.9732178],[91.252655,70.6074197,51.3836144,57.4977985,58.1686925,59.2262195],[92.1862742,71.5286633,52.2973456,58.4338391,59.2944035,60.4555968],[93.0732469,72.4098286,53.1772628,59.3274476,60.3869601,61.6587548],[93.921341,73.2569279,54.0285658,60.1761747,61.4434421,62.8332062],[94.7318562,74.0698508,54.849612,60.9777726,62.4608838,63.9764437],[95.5054095,74.8479168,55.6381747,61.7302733,63.4364543,65.0859951],[96.2446896,75.5938417,56.3961838,62.4321101,64.3678259,66.1595499],[96.9534538,76.3115333,57.1277709,63.0818735,65.2523088,67.194671],[97.6328122,77.0001938,57.8320732,63.6786509,66.0879846,68.1891779],[98.2838695,77.659018,58.5081743,64.2218236,66.8729979,69.1409107],[98.9107336,78.2909044,59.1591015,64.7109895,67.6052321,70.047608],[99.5152935,78.8990526,59.7877763,65.1463607,68.283808,70.9074485],[100.094863,79.4825218,60.3922746,65.5282934,68.9073393,71.7184254],[100.646726,80.040359,60.9706948,65.8574148,69.4743983,72.4785066],[101.171595,80.5744984,61.5239296,66.1350157,69.9851661,73.186261],[101.674977,81.0892882,62.0564819,66.3624054,70.4389046,73.8399142],[102.156609,81.5828931,62.5680925,66.5410685,70.8345991,74.4375851],[102.616053,82.0533092,63.0583354,66.6732212,71.1734445,74.9782428],[103.053501,82.4992388,63.5275143,66.7610757,71.455856,75.4605698],[103.473955,82.9254622,63.9809139,66.8066679,71.6807611,75.882697],[103.877106,83.3333387,64.4174615,66.8127375,71.8496074,76.2437431],[104.261267,83.7229272,64.8344736,66.7822972,71.9646734,76.5431592],[104.624754,84.0942865,65.2292669,66.7178773,72.0258232,76.7795168],[104.968929,84.4497989,65.602359,66.6219194,72.032416,76.9512728],[105.298763,84.7930181,65.959088,66.4977105,71.9877012,77.0583616],[105.613016,85.1215322,66.2994588,66.3483858,71.8944936,77.1005625],[105.91024,85.4327366,66.6232422,66.1764084,71.7530253,77.0767944],[106.18899,85.7240271,66.9302092,65.9836318,71.5614856,76.9854324],[106.451926,85.9981334,67.2240229,65.7728287,71.3229193,76.8265772],[106.702935,86.2600308,67.5077259,65.5468547,71.0415368,76.6006646],[106.940709,86.5080452,67.7779957,65.3078144,70.7192186,76.3073867],[107.16389,86.740485,68.0315154,65.0570553,70.3557203,75.9459029],[107.371118,86.9556584,68.2649681,64.7946875,69.9469557,75.5145995],[107.565278,87.1560882,68.4806637,64.5219225,69.4946265,75.0136301],[107.751879,87.3474917,68.6862084,64.2408042,69.0046227,74.4441005],[107.927809,87.527596,68.8792526,63.9525039,68.4799943,73.8063718],[108.089752,87.693918,69.0571867,63.6577595,67.9226721,73.1006615],[108.234392,87.8439745,69.2174013,63.3569549,67.3336505,72.3272551],[108.360805,87.9775659,69.3595663,63.049961,66.7122698,71.4865946],[108.48114,88.1064573,69.4955565,62.7350171,66.0521796,70.579058],[108.593947,88.2282702,69.6234914,62.4092086,65.343293,69.6057245],[108.694794,88.337695,69.7385942,62.0758096,64.5970418,68.5706731],[108.779247,88.429422,69.8360879,61.7369936,63.8201014,67.4773671],[108.842874,88.4981414,69.9111956,61.394309,63.0164715,66.3290502],[108.891141,88.5494811,69.9696126,61.0490072,62.1889843,65.12885],[108.936734,88.597589,70.0246085,60.7020014,61.3395712,63.8796858],[108.976987,88.6399548,70.0733921,60.3537733,60.4693721,62.5841562],[109.009023,88.6738461,70.1129164,60.0042862,59.578831,61.2444517],[109.029963,88.6965307,70.1401342,59.6529319,58.6678109,59.8623144],[109.036929,88.7052765,70.1519985,59.2985267,57.7357279,58.4390538]],[[0,0,0,2.47418826,2.43960093,2.23357585],[9.3422693e-9,134257374e-18,0,3.72208607,3.50228136,3.14083969],[.00051182525,506045797e-13,0,5.87128028,5.2457408,4.49201651],[.0222852265,.00408966615,957469873e-13,8.24624049,7.22222241,6.10180333],[.173359339,.0434415839,.00446238122,10.5464543,9.19938137,7.80474379],[.626714368,.19230864,.0322517179,12.6997873,11.1065993,9.51973011],[1.5216464,.540257916,.121028812,14.7081567,12.9289531,11.2067468],[2.88831175,1.14734315,.316581265,16.5940549,14.6720092,12.8490383],[4.69745829,2.04107895,.653481098,18.3818077,16.3479124,14.4431757],[6.87167793,3.20550442,1.15461237,20.0921341,17.9697425,15.9930155],[9.31816533,4.60694243,1.8158937,21.7414013,19.5493633,17.5059826],[11.958848,6.20381917,2.63513746,23.3422901,21.0967856,18.9908259],[14.7371171,7.96462781,3.60833733,24.9047103,22.6201786,20.4563177],[17.5951734,9.85352566,4.70612953,26.4366058,24.1261278,21.9105558],[20.4703096,11.8213,5.90610347,27.9445717,25.6199619,23.3606419],[23.3314808,13.8423653,7.19738794,29.4342973,27.1060635,24.8125859],[26.1597202,15.8933706,8.55440347,30.9108682,28.5881333,26.2713395],[28.952114,17.9689189,9.97431483,32.3789667,30.0693979,27.7408932],[31.6737083,20.0286388,11.4217249,33.8429919,31.5527616,29.2243968],[34.3289888,22.0743148,12.8974878,35.307131,33.0409123,30.7242802],[36.8856362,24.083148,14.3826696,36.7753829,34.5363818,32.2423574],[39.3543917,26.059667,15.8790035,38.2515648,36.0415816,33.7799149],[41.7408839,27.9905305,17.3628965,39.739284,37.5588019,35.3377729],[44.0585236,29.8803571,18.8332498,41.2419145,39.0902064,36.9163355],[46.2869627,31.7202661,20.2893576,42.7625399,40.637795,38.5156154],[48.4164954,33.5068721,21.7328519,44.3039193,42.20338,40.1352607],[50.4613792,35.2443533,23.1603844,45.8684162,43.7885305,41.7745584],[52.4192397,36.9223175,24.5548274,47.4579665,45.3945462,43.4324548],[54.298144,38.546563,25.9204793,49.0740012,47.0223934,45.1075513],[56.1037533,40.1186965,27.2549085,50.7174288,48.6726907,46.798133],[57.8415851,41.6390319,28.5529084,52.3885549,50.3456391,48.5021617],[59.5198839,43.114418,29.8197523,54.0870914,52.0410323,50.2173229],[61.1312385,44.5388653,31.0533857,55.8120727,53.7581778,51.9410143],[62.6713093,45.9084326,32.2528876,57.5619024,55.4959443,53.6704161],[64.1511828,47.2312425,33.4229368,59.3342634,57.2526665,55.4024684],[65.5705903,48.5070569,34.5599066,61.1262102,59.0262389,57.1339673],[66.9297327,49.7359283,35.6610476,62.9340764,60.8140025,58.8615254],[68.2374174,50.9240176,36.7320622,64.7535992,62.6128739,60.5816836],[69.4925387,52.0706089,37.7711402,66.5798574,64.419248,62.2908726],[70.6923851,53.1739091,38.7750858,68.4073709,66.2290908,63.9854916],[71.8406538,54.2389595,39.7469533,70.2301526,68.0379728,65.6619403],[72.9434456,55.2676115,40.6892572,72.041673,69.8409627,67.3165645],[74.0050229,56.2580905,41.601957,73.8351332,71.6329705,68.9458617],[75.0314837,57.2109271,42.4868101,75.6032254,73.4083045,70.546218],[76.0277801,58.132092,43.3480249,77.338581,75.1613017,72.1142653],[76.9866242,59.0199662,44.1820812,79.0335415,76.8858605,73.6465996],[77.8999804,59.8722967,44.984876,80.6803591,78.5756578,75.139893],[78.7674326,60.6914308,45.7574192,82.2715107,80.2246469,76.591129],[79.5978885,61.4818517,46.5045614,83.7992234,81.8259847,77.9970269],[80.3941353,62.2422644,47.2255178,85.2562865,83.3735311,79.3547818],[81.1589128,62.9713235,47.9194705,86.6356785,84.8609807,80.6615857],[81.8961983,63.6715623,48.5891877,87.9304622,86.2813875,81.9144103],[82.607498,64.346542,49.2373258,89.1347874,87.6294066,83.1109836],[83.2914483,64.9957956,49.8621364,90.2428933,88.8987918,84.2486315],[83.9466973,65.6188574,50.4618898,91.2494826,90.0830374,85.3245941],[84.5753575,66.2178427,51.0378098,92.1507744,91.1781688,86.3370712],[85.1823176,66.7967128,51.5942302,92.9430405,92.1786946,87.2835889],[85.7653315,67.3535552,52.1299202,93.6230579,93.0785459,88.1614532],[86.321907,67.8863118,52.6434591,94.1896249,93.8756437,88.9692572],[86.8505235,68.3938187,53.134066,94.6418067,94.5667212,89.7050147],[87.3577622,68.8817351,53.6060856,94.9785365,95.1457465,90.365845],[87.8441042,69.3504471,54.0602388,95.2010154,95.6116918,90.9502984],[88.3081076,69.7986081,54.4960196,95.3117049,95.9656501,91.4572609],[88.7483308,70.2248718,54.912922,95.3123464,96.204166,91.884271],[89.1663385,70.6311075,55.3133349,95.2050556,96.3228795,92.2287221],[89.5672608,71.0223617,55.7014215,94.9949893,96.3261636,92.4899256],[89.950035,71.3965471,56.0740578,94.687672,96.2182094,92.666817],[90.3134015,71.7513533,56.4278971,94.2875491,95.9980791,92.7571749],[90.6561007,72.0844698,56.7595927,93.7981602,95.6606146,92.758193],[90.9820497,72.3989069,57.0720318,93.226497,95.2122845,92.6691084],[91.2955558,72.6996155,57.3709833,92.5806572,94.6631223,92.4893723],[91.5934138,72.9848654,57.6545329,91.8674471,94.0185613,92.2175087],[91.872394,73.2528874,57.920757,91.0923238,93.2797307,91.8515133],[92.1292669,73.5019125,58.1677319,90.2580005,92.4393963,91.388813],[92.3667497,73.7349667,58.3982627,89.3710055,91.5046043,90.8286476],[92.5929508,73.9584585,58.6187343,88.4407495,90.4927464,90.1709903],[92.8052928,74.1692797,58.8264981,87.4745301,89.4148141,89.4151041],[93.0009221,74.3641067,59.0186768,86.4785804,88.2792453,88.5602299],[93.1769851,74.5396161,59.1923934,85.4580683,87.0922365,87.6058792],[93.3333361,74.695268,59.3474268,84.4164233,85.8561187,86.5520379],[93.4838626,74.8453256,59.4972802,83.3520907,84.5606906,85.3993215],[93.6258555,74.9870566,59.6390703,82.2597685,83.188502,84.1496264],[93.7531351,75.1141767,59.766502,81.150066,81.7694836,82.8061398],[93.8595216,75.2204015,59.8732803,80.0295133,80.3221544,81.3717774],[93.9388354,75.2994468,59.9531102,78.9019843,78.8587095,79.8494402],[93.9978147,75.3580317,60.012661,77.7697819,77.388532,78.2419627],[94.0530948,75.4128886,60.0685497,76.6337981,75.9188775,76.5519566],[94.1017278,75.4611196,60.1177678,75.4935696,74.4551295,74.7816515],[94.1404755,75.499528,60.1570128,74.3473392,73.0009445,72.9327724],[94.1660995,75.5249173,60.1829823,73.192156,71.5583704,71.0064786],[94.1753613,75.5340909,60.1923738,72.024017,70.1279596,69.0033701]]],Fu=.255*Math.PI/180,Iu=Math.max(...Pu[0][90].slice(0,3));function Lu(e,t={}){let{turbidity:n=3,cloudCover:r=0,cloudOpticalDepth:i=10}=t;if(Bu(`Sun altitude`,e,-Math.PI/2,Math.PI/2),Bu(`Turbidity`,n,1,10),Bu(`Cloud cover`,r,0,1),Bu(`Cloud optical depth`,i,0,Number.MAX_VALUE),e<=-Fu)return{color:[0,0,0],intensity:0,diffuse:{color:[0,0,0],intensity:0}};let a=Math.max(0,e),o=a*180/Math.PI,s=Math.min(89,Math.floor(o)),c=o-s,l=Math.min(8,Math.floor(n)-1),u=n-l-1,d=e=>{let t=Pu[l],n=Pu[l+1];return Ru(Ru(t[s][e],t[s+1][e],c),Ru(n[s][e],n[s+1][e],c),u)/Iu},f=Math.min(1,e/Fu),p=(Math.acos(-f)+f*Math.sqrt(1-f*f))/Math.PI,m=Math.sin(a),h=Math.exp(-i/Math.max(.05,m)),g=1-r+r*h,_=1/(1+.12*i),v=[0,0,0],y=[0,0,0];for(let e=0;e<3;e++){let t=d(e)*p,n=d(e+3)*p;v[e]=t*g,y[e]=(1-r)*n+r*_*(n+t*m*(1-h))}return{...zu(v),diffuse:zu(y)}}function Ru(e,t,n){return e+(t-e)*n}function zu(e){let t=Math.max(...e);return{color:t>0?[e[0]/t,e[1]/t,e[2]/t]:[0,0,0],intensity:t}}function Bu(e,t,n,r){if(!Number.isFinite(t)||t<n||t>r)throw RangeError(`${e} must be finite and between ${n} and ${r}`)}function Vu(e){let{latitude:t,longitude:n,elevation:r=0}=e;return ku(`Latitude`,t,-90,90),ku(`Longitude`,n,-Number.MAX_VALUE,Number.MAX_VALUE),ku(`Elevation`,r,-1e3,1e5),Object.freeze({latitude:t,longitude:(n%360+540)%360-180,elevation:r})}function Hu(e,t){return ku(`Altitude`,e,-Math.PI/2,Math.PI/2),ku(`Azimuth`,t,-Number.MAX_VALUE,Number.MAX_VALUE),[-Math.cos(e)*Math.sin(t),-Math.cos(e)*Math.cos(t),Math.sin(e)]}function Uu(e){let{latitude:t,longitude:n}=Vu(e),r=t*Math.PI/180,i=n*Math.PI/180,a=Math.sin(i),o=Math.cos(i),s=Math.sin(r),c=Math.cos(r);return[o,a,0,-a*s,o*s,c,a*c,-o*c,s]}var Wu=1,Gu=1,Ku=class{time=0;channels=new Map;animations=new Map;playing=!1;lastEngineTime=-1;constructor(){}addChannel(e){let{delay:t=0,duration:n=1/0,rate:r=1,repeat:i=1}=e,a=Wu++,o={time:0,delay:t,duration:n,rate:r,repeat:i};return this._setChannelTime(o,this.time),this.channels.set(a,o),a}removeChannel(e){this.channels.delete(e);for(let[t,n]of this.animations)n.channel===e&&this.detachAnimation(t)}isFinished(e){let t=this.channels.get(e);return t===void 0?!1:this.time>=t.delay+t.duration*t.repeat}getTime(e){if(e===void 0)return this.time;let t=this.channels.get(e);return t===void 0?-1:t.time}setTime(e){this.time=Math.max(0,e);let t=this.channels.values();for(let e of t)this._setChannelTime(e,this.time);let n=this.animations.values();for(let e of n){let{animation:t,channel:n}=e;t.setTime(this.getTime(n))}}play(){this.playing=!0}pause(){this.playing=!1,this.lastEngineTime=-1}reset(){this.setTime(0)}attachAnimation(e,t){let n=Gu++;return this.animations.set(n,{animation:e,channel:t}),e.setTime(this.getTime(t)),n}detachAnimation(e){this.animations.delete(e)}update(e){this.playing&&(this.lastEngineTime===-1&&(this.lastEngineTime=e),this.setTime(this.time+(e-this.lastEngineTime)),this.lastEngineTime=e)}_setChannelTime(e,t){let n=t-e.delay;n>=e.duration*e.repeat?e.time=e.duration*e.rate:(e.time=Math.max(0,n)%e.duration,e.time*=e.rate)}};function qu(e){let t=typeof window<`u`?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null;return t?t.call(window,e):setTimeout(()=>e(typeof performance<`u`?performance.now():Date.now()),1e3/60)}function Ju(e){let t=typeof window<`u`?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null;if(t){t.call(window,e);return}clearTimeout(e)}var Yu=0,Xu=`Animation Loop`,Zu={requestAnimationFrame:e=>qu(e),cancelAnimationFrame:e=>Ju(e)},Qu=class e{static defaultAnimationLoopProps={device:null,mobileQuality:void 0,onAddHTML:()=>``,onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:Zu};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw=`initialized`;_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(t){if(this.props={...e.defaultAnimationLoopProps,...t},t=this.props,!t.device)throw Error(`No device provided`);this.stats=t.stats||new o({id:`animation-loop-${Yu++}`}),this.sharedStats=Kr.stats.get(Xu),this.frameRate=this.stats.get(`Frame Rate`),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get(`CPU Time`),this.gpuTime=this.stats.get(`GPU Time`),this.setProps({autoResizeViewport:t.autoResizeViewport,animationFrameProvider:t.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(t){this._error=t,this.props.onError(t),this.props.onError===e.defaultAnimationLoopProps.onError&&typeof window<`u`&&typeof ErrorEvent<`u`&&window.dispatchEvent(new ErrorEvent(`error`,{error:t,message:t.message}))}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if(`autoResizeViewport`in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),`animationFrameProvider`in e){let t=e.animationFrameProvider||Zu;if(t!==this.props.animationFrameProvider){let e=this._animationFrameId!==null;e&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,e&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}return this._running?(this._cancelAnimationFrame(),this._requestAnimationFrame(),this):null}catch(e){let t=e instanceof Error?e:Error(`Unknown error`);throw this.props.onError(t),t}}stop(){if(this._running){let e=this.animationProps;this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0,e&&this.props.onFinalize(e)}return this}redraw(e,t=null){return this.device?.isLost||this._error?this:(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&=(this._resolveNextFrame(this),this._nextFramePromise=null,null),this._endFrameTimers(),this)}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw(`waitForRender`),this._nextFramePromise||=new Promise(e=>{this._resolveNextFrame=e}),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw(`toDataURL`),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw Error(`OffscreenCanvas`)}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){this._animationFrameId!==null&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){if(this._running)try{this.redraw(e,t??null),this._requestAnimationFrame()}catch(e){let t=e instanceof Error?e:Error(String(e));this.reportError(t),this.stop()}}_renderFrame(e){if(this.display){this.display._renderFrame(e);return}let t=this.props.onRender(this._getAnimationProps());this.device&&t!==!1&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw Error(`loop`);let t=e?.canvas,n=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:n,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null,mobileQuality:this.props.mobileQuality}}_getAnimationProps(){if(!this.animationProps)throw Error(`animationProps`);return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:n}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw(`drawing buffer resized`),n!==this.animationProps.aspect&&this.setNeedsRedraw(`drawing buffer aspect changed`),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=n,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw Error(`No device provided`);this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement(`div`);document.body.appendChild(e),e.style.position=`relative`;let t=document.createElement(`div`);t.style.position=`absolute`,t.style.left=`10px`,t.style.bottom=`10px`,t.style.width=`300px`,t.style.background=`white`,this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let n=this.props.onAddHTML(t);n&&(t.innerHTML=n)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize();return{width:e,height:t,aspect:e>0&&t>0?e/t:1}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??(typeof performance<`u`?performance.now():Date.now());if(this._lastFrameTime){let e=t-this._lastFrameTime;e>0&&this.frameRate.addTime(e)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;e!==void 0&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener(`mousemove`,this._onMousemove.bind(this)),this.canvas.addEventListener(`mouseleave`,this._onMouseleave.bind(this)))}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}},$u={blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`zero`,blendAlphaOperation:`add`,blendAlphaSrcFactor:`constant`,blendAlphaDstFactor:`zero`},ed=class extends Al{constructor(){super(...arguments),this._colorEncoderState=null}render(e){return`pickingFBO`in e?this._drawPickingBuffer(e):{decodePickingColor:null,stats:super._render(e)}}_drawPickingBuffer({layers:e,layerFilter:t,views:n,viewports:r,onViewportActive:i,pickingFBO:a,deviceRect:{x:o,y:s,width:c,height:l},cullRect:u,effects:d,pass:f=`picking`,pickZ:p,canvasContext:m,shaderModuleProps:h,clearColor:g}){this.pickZ=p;let _=this._resetColorEncoder(p),v=[o,this.device.type===`webgpu`?a.height-s-l:s,c,l],y=super._render({target:a,layers:e,layerFilter:t,views:n,viewports:r,onViewportActive:i,cullRect:u,effects:d?.filter(e=>e.useInPicking),pass:f,canvasContext:m,isPicking:!0,shaderModuleProps:h,clearColor:g??[0,0,0,0],colorMask:15,scissorRect:v});return this._colorEncoderState=null,{decodePickingColor:_&&nd.bind(null,_),stats:y}}shouldDrawLayer(e){let{pickable:t,operation:n}=e.props;return t&&n.includes(`draw`)||n.includes(`terrain`)||n.includes(`mask`)}getShaderModuleProps(e,t,n){return{picking:{isActive:1,isAttribute:this.pickZ,disabledPickingIndices:e.internalState?.disabledPickingIndices},lighting:{enabled:!1}}}getLayerParameters(e,t,n){let r={...e.props.parameters},{pickable:i,operation:a}=e.props;return this._colorEncoderState?i&&a.includes(`draw`)?(Object.assign(r,$u),r.blend=!0,this.device.type===`webgpu`?r.blendConstant=td(this._colorEncoderState,e,n):r.blendColor=td(this._colorEncoderState,e,n),a.includes(`terrain`)&&e.state?._hasPickingCover&&(r.blendAlphaSrcFactor=`one`)):a.includes(`terrain`)&&(r.blend=!1):r.blend=!1,r}_resetColorEncoder(e){return this._colorEncoderState=e?null:{byLayer:new Map,byAlpha:[]},this._colorEncoderState}};function td(e,t,n){let{byLayer:r,byAlpha:i}=e,a,o=r.get(t);return o?(o.viewports.push(n),a=o.a):(a=r.size+1,a<=255?(o={a,layer:t,viewports:[n]},r.set(t,o),i[a]=o):(N.warn(`Too many pickable layers, only picking the first 255`)(),a=0)),[0,0,0,a/255]}function nd(e,t){let n=e.byAlpha[t[3]];return n&&{pickedLayer:n.layer,pickedViewports:n.viewports,pickedObjectIndex:n.layer.decodePickingColor(t)}}var rd={NO_STATE:`Awaiting state`,MATCHED:`Matched. State transferred from previous layer`,INITIALIZED:`Initialized`,AWAITING_GC:`Discarded. Awaiting garbage collection`,AWAITING_FINALIZATION:`No longer matched. Awaiting garbage collection`,FINALIZED:`Finalized! Awaiting garbage collection`},id=Symbol.for(`component`),ad=Symbol.for(`propTypes`),od=Symbol.for(`deprecatedProps`),sd=Symbol.for(`asyncPropDefaults`),cd=Symbol.for(`asyncPropOriginal`),ld=Symbol.for(`asyncPropResolved`);function ud(e,t=()=>!0){return Array.isArray(e)?dd(e,t,[]):t(e)?[e]:[]}function dd(e,t,n){let r=-1;for(;++r<e.length;){let i=e[r];Array.isArray(i)?dd(i,t,n):t(i)&&n.push(i)}return n}function fd({target:e,source:t,start:n=0,count:r=1}){let i=t.length,a=r*i,o=0;for(let r=n;o<i;o++)e[r++]=t[o];for(;o<a;)o<a-o?(e.copyWithin(n+o,n,n+o),o*=2):(e.copyWithin(n+o,n,n+a-o),o=a);return e}var pd=class{constructor(e,t,n){this._loadCount=0,this._subscribers=new Set,this.id=e,this.context=n,this.setData(t)}subscribe(e){this._subscribers.add(e)}unsubscribe(e){this._subscribers.delete(e)}inUse(){return this._subscribers.size>0}delete(){}getData(){return this.isLoaded?this._error?Promise.reject(this._error):this._content:this._loader.then(()=>this.getData())}setData(e,t){if(e===this._data&&!t)return;this._data=e;let n=++this._loadCount,r=e;typeof e==`string`&&(r=Zn(e)),r instanceof Promise?(this.isLoaded=!1,this._loader=r.then(e=>{this._loadCount===n&&(this.isLoaded=!0,this._error=void 0,this._content=e)}).catch(e=>{this._loadCount===n&&(this.isLoaded=!0,this._error=e||!0)})):(this.isLoaded=!0,this._error=void 0,this._content=e);for(let e of this._subscribers)e.onChange(this.getData())}},md=class{constructor(e){this.protocol=e.protocol||`resource://`,this._context={device:e.device,gl:e.device?.gl,resourceManager:this},this._resources={},this._consumers={},this._pruneRequest=null}contains(e){return e.startsWith(this.protocol)?!0:e in this._resources}add({resourceId:e,data:t,forceUpdate:n=!1,persistent:r=!0}){let i=this._resources[e];i?i.setData(t,n):(i=new pd(e,t,this._context),this._resources[e]=i),i.persistent=r}remove(e){let t=this._resources[e];t&&(t.delete(),delete this._resources[e])}unsubscribe({consumerId:e}){let t=this._consumers[e];if(t){for(let e in t){let n=t[e],r=this._resources[n.resourceId];r&&r.unsubscribe(n)}delete this._consumers[e],this.prune()}}subscribe({resourceId:e,onChange:t,consumerId:n,requestId:r=`default`}){let{_resources:i,protocol:a}=this;e.startsWith(a)&&(e=e.replace(a,``),i[e]||this.add({resourceId:e,data:null,persistent:!1}));let o=i[e];if(this._track(n,r,o,t),o)return o.getData()}prune(){this._pruneRequest||=setTimeout(()=>this._prune(),0)}finalize(){for(let e in this._resources)this._resources[e].delete()}_track(e,t,n,r){let i=this._consumers,a=i[e]=i[e]||{},o=a[t],s=o&&o.resourceId&&this._resources[o.resourceId];s&&(s.unsubscribe(o),this.prune()),n&&(o?(o.onChange=r,o.resourceId=n.id):o={onChange:r,resourceId:n.id},a[t]=o,n.subscribe(o))}_prune(){this._pruneRequest=null;for(let e of Object.keys(this._resources)){let t=this._resources[e];!t.persistent&&!t.inUse()&&(t.delete(),delete this._resources[e])}}},hd=`layerManager.setLayers`,gd=`layerManager.activateViewport`,_d=class{constructor(e,t){this._lastRenderedLayers=[],this._needsRedraw=!1,this._needsUpdate=!1,this._nextLayers=null,this._debug=!1,this._defaultShaderModulesChanged=!1,this.activateViewport=e=>{P(gd,this,e),e&&(this.context.viewport=e)};let{deck:n,stats:r,viewport:i,timeline:a}=t||{};this.layers=[],this.resourceManager=new md({device:e,protocol:`deck://`}),this.context={mousePosition:null,userData:{},layerManager:this,device:e,gl:e?.gl,deck:n,shaderAssembler:vl(e?.info?.shadingLanguage||`glsl`),defaultShaderModules:[eo],renderPass:void 0,stats:r||new o({id:`deck.gl`}),viewport:i||new tu({id:`DEFAULT-INITIAL-VIEWPORT`}),timeline:a||new Ku,resourceManager:this.resourceManager,onError:void 0},Object.seal(this)}finalize(){this.resourceManager.finalize();for(let e of this.layers)this._finalizeLayer(e)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);for(let n of this.layers){let r=n.getNeedsRedraw(e);t||=r}return t}needsUpdate(){return this._nextLayers&&this._nextLayers!==this._lastRenderedLayers?`layers changed`:this._defaultShaderModulesChanged?`shader modules changed`:this._needsUpdate}setNeedsRedraw(e){this._needsRedraw=this._needsRedraw||e}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e}getLayers({layerIds:e}={}){return e?this.layers.filter(t=>e.find(e=>t.id.indexOf(e)===0)):this.layers}setProps(e){`debug`in e&&(this._debug=e.debug),`userData`in e&&(this.context.userData=e.userData),`layers`in e&&(this._nextLayers=e.layers),`onError`in e&&(this.context.onError=e.onError)}setLayers(e,t){P(hd,this,t,e),this._lastRenderedLayers=e;let n=ud(e,Boolean);for(let e of n)e.context=this.context;this._updateLayers(this.layers,n)}updateLayers(){let e=this.needsUpdate();e&&(this.setNeedsRedraw(`updating layers: ${e}`),this.setLayers(this._nextLayers||this._lastRenderedLayers,e)),this._nextLayers=null}addDefaultShaderModule(e){let{defaultShaderModules:t}=this.context;t.find(t=>t.name===e.name)||(t.push(e),this._defaultShaderModulesChanged=!0)}removeDefaultShaderModule(e){let{defaultShaderModules:t}=this.context,n=t.findIndex(t=>t.name===e.name);n>=0&&(t.splice(n,1),this._defaultShaderModulesChanged=!0)}_handleError(e,t,n){n.raiseError(t,`${e} of ${n}`)}_updateLayers(e,t){let n={};for(let t of e)n[t.id]?N.warn(`Multiple old layers with same id ${t.id}`)():n[t.id]=t;if(this._defaultShaderModulesChanged){for(let t of e)t.setNeedsUpdate(),t.setChangeFlags({extensionsChanged:!0});this._defaultShaderModulesChanged=!1}let r=[];this._updateSublayersRecursively(t,n,r),this._finalizeOldLayers(n);let i=!1;for(let e of r)if(e.hasUniformTransition()){i=`Uniform transition in ${e}`;break}this._needsUpdate=i,this.layers=r}_updateSublayersRecursively(e,t,n){for(let r of e){r.context=this.context;let e=t[r.id];e===null&&N.warn(`Multiple new layers with same id ${r.id}`)(),t[r.id]=null;let i=null;try{this._debug&&e!==r&&r.validateProps(),e?(this._transferLayerState(e,r),this._updateLayer(r)):this._initializeLayer(r),n.push(r),i=r.isComposite?r.getSubLayers():null}catch(e){this._handleError(`matching`,e,r)}i&&this._updateSublayersRecursively(i,t,n)}}_finalizeOldLayers(e){for(let t in e){let n=e[t];n&&this._finalizeLayer(n)}}_initializeLayer(e){try{e._initialize(),e.lifecycle=rd.INITIALIZED}catch(t){this._handleError(`initialization`,t,e)}}_transferLayerState(e,t){t._transferState(e),t.lifecycle=rd.MATCHED,t!==e&&(e.lifecycle=rd.AWAITING_GC)}_updateLayer(e){try{e._update()}catch(t){this._handleError(`update`,t,e)}}_finalizeLayer(e){this._needsRedraw=this._needsRedraw||`finalized ${e}`,e.lifecycle=rd.AWAITING_FINALIZATION;try{e._finalize(),e.lifecycle=rd.FINALIZED}catch(t){this._handleError(`finalization`,t,e)}}};function G(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!G(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=Object.keys(e),i=Object.keys(t);if(r.length!==i.length)return!1;for(let i of r)if(!t.hasOwnProperty(i)||!G(e[i],t[i],n-1))return!1;return!0}return!1}var vd=`default-canvas`,yd=class{constructor(e){this.views=[],this.width=100,this.height=100,this.viewState={},this.controllers={},this.timeline=e.timeline,this._viewports=[],this._viewportMap={},this._isUpdating=!1,this._needsRedraw=`First render`,this._needsUpdate=`Initialize`,this._eventManager=e.eventManager,this._eventManagers=e.eventManagers||{},this._viewEventManagers={},this._eventCallbacks={onViewStateChange:e.onViewStateChange,onInteractionStateChange:e.onInteractionStateChange},this._pickPosition=e.pickPosition,this._getCanvasContext=e.getCanvasContext,Object.seal(this),this.setProps(e)}finalize(){for(let e in this.controllers){let t=this.controllers[e];t&&t.finalize()}this.controllers={}}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e,this._needsRedraw=this._needsRedraw||e}updateViewStates(){for(let e in this.controllers){let t=this.controllers[e];t&&t.updateTransition()}}getViewports(e){return e?this._viewports.filter(t=>{let n=!e.canvasId||this.getCanvasId(t.id)===e.canvasId,r=!(`x`in e)||t.containsPixel(e);return n&&r}):this._viewports}getViews(){let e={};return this.views.forEach(t=>{e[t.id]=t}),e}getView(e){return this.views.find(t=>t.id===e)}getViewState(e){let t=typeof e==`string`?this.getView(e):e,n=t&&this.viewState[t.getViewStateId()]||this.viewState;return t?t.filterViewState(n):n}getViewport(e){return this._viewportMap[e]}getCanvasId(e){let t=typeof e==`string`?this.getView(e):e;return t?this._viewEventManagers[t.id]?.canvasId||this._getCanvasIdFromView(t):void 0}unproject(e,t){let n=this.getViewports(),r={x:e[0],y:e[1]};for(let i=n.length-1;i>=0;--i){let a=n[i];if(a.containsPixel(r)){let n=e.slice();return n[0]-=a.x,n[1]-=a.y,a.unproject(n,t)}}return null}setProps(e){e.views&&this._setViews(e.views),e.viewState&&this._setViewState(e.viewState),(`width`in e||`height`in e)&&this._setSize(e.width,e.height),`pickPosition`in e&&(this._pickPosition=e.pickPosition),`eventManagers`in e&&this._setEventManagers(e.eventManagers||{}),this._isUpdating||this._update()}_update(){this._isUpdating=!0,this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._isUpdating=!1}_setSize(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.setNeedsUpdate(`Size changed`))}_setViews(e){e=ud(e,Boolean),this._diffViews(e,this.views)&&this.setNeedsUpdate(`views changed`),this.views=e}_setViewState(e){e?(G(e,this.viewState,3)||this.setNeedsUpdate(`viewState changed`),this.viewState=e):N.warn("missing `viewState` or `initialViewState`")()}_setEventManagers(e){this._eventManagers!==e&&(this._eventManagers=e,this.setNeedsUpdate(`eventManagers changed`))}_getCanvasIdFromView(e){return e.props.canvasId||this._getCanvasContext?.(e.id)?.id||`default-canvas`}_getCanvasDimensions(e){let[t,n]=(this._getCanvasContext?.(e.id))?.getCSSSize()||[this.width,this.height];return{width:t,height:n}}_getViewEventManager(e){let t=this.getCanvasId(e)||`default-canvas`;return{canvasId:t,eventManager:this._eventManagers[t]||this._eventManager}}_startViewportRebuild(){let e=this.controllers,t=this._viewEventManagers;return this._viewports=[],this.controllers={},this._viewEventManagers={},{oldControllers:e,oldViewEventManagers:t}}_getReusableController(e,t,n){return e&&(t?.canvasId!==n.canvasId||t?.eventManager!==n.eventManager)?(e.finalize(),null):e}_createController(e,t){let n=t.type;return new n({timeline:this.timeline,eventManager:this._getViewEventManager(e).eventManager,onViewStateChange:this._eventCallbacks.onViewStateChange,onStateChange:this._eventCallbacks.onInteractionStateChange,makeViewport:t=>this.getView(e.id)?.makeViewport({viewState:t,...this._getCanvasDimensions(e)}),pickPosition:(t,n)=>this._pickPosition?.(t,n,e.id)})}_updateController(e,t,n,r){let i=e.controller;if(i&&n){let a={...t,...i,id:e.id,x:n.x,y:n.y,width:n.width,height:n.height};return(!r||r.constructor!==i.type)&&(r=this._createController(e,a)),r&&r.setProps(a),r}return null}_rebuildViewports(){let{views:e}=this,{oldControllers:t,oldViewEventManagers:n}=this._startViewportRebuild(),r=!1;for(let i=e.length;i--;){let a=e[i],{width:o,height:s}=this._getCanvasDimensions(a),c=this._getViewEventManager(a);this._viewEventManagers[a.id]=c;let l=this.getViewState(a),u=a.makeViewport({viewState:l,width:o,height:s}),d=this._getReusableController(t[a.id],n[a.id],c),f=!!a.controller;f&&!d&&(r=!0),(r||!f)&&d&&(d.finalize(),d=null),this.controllers[a.id]=this._updateController(a,l,u,d),u&&this._viewports.unshift(u)}for(let e in t){let n=t[e];n&&!this.controllers[e]&&n.finalize()}this._buildViewportMap()}_buildViewportMap(){this._viewportMap={},this._viewports.forEach(e=>{e.id&&(this._viewportMap[e.id]=this._viewportMap[e.id]||e)})}_diffViews(e,t){return e.length===t.length?e.some((n,r)=>!e[r].equals(t[r])):!0}},bd=/^(?:\d+\.?\d*|\.\d+)$/;function K(e){switch(typeof e){case`number`:if(!Number.isFinite(e))throw Error(`Could not parse position string ${e}`);return{type:`literal`,value:e};case`string`:try{return new Cd(Sd(e)).parseExpression()}catch(t){let n=t instanceof Error?t.message:String(t);throw Error(`Could not parse position string ${e}: ${n}`)}default:throw Error(`Could not parse position string ${e}`)}}function xd(e,t){switch(e.type){case`literal`:return e.value;case`percentage`:return Math.round(e.value*t);case`binary`:let n=xd(e.left,t),r=xd(e.right,t);return e.operator===`+`?n+r:n-r;default:throw Error(`Unknown layout expression type`)}}function q(e,t){return xd(e,t)}function Sd(e){let t=[],n=0;for(;n<e.length;){let r=e[n];if(/\s/.test(r)){n++;continue}if(r===`+`||r===`-`||r===`(`||r===`)`||r===`%`){t.push({type:`symbol`,value:r}),n++;continue}if(wd(r)||r===`.`){let i=n,a=r===`.`;for(n++;n<e.length;){let t=e[n];if(wd(t)){n++;continue}if(t===`.`&&!a){a=!0,n++;continue}break}let o=e.slice(i,n);if(!bd.test(o))throw Error(`Invalid number token`);t.push({type:`number`,value:parseFloat(o)});continue}if(Td(r)){let r=n;for(;n<e.length&&Td(e[n]);)n++;let i=e.slice(r,n).toLowerCase();t.push({type:`word`,value:i});continue}throw Error(`Invalid token in position string`)}return t}var Cd=class{constructor(e){this.index=0,this.tokens=e}parseExpression(){let e=this.parseBinaryExpression();if(this.index<this.tokens.length)throw Error(`Unexpected token at end of expression`);return e}parseBinaryExpression(){let e=this.parseFactor(),t=this.peek();for(;Ed(t);){this.index++;let n=this.parseFactor();e={type:`binary`,operator:t.value,left:e,right:n},t=this.peek()}return e}parseFactor(){let e=this.peek();if(!e)throw Error(`Unexpected end of expression`);if(e.type===`symbol`&&e.value===`+`)return this.index++,this.parseFactor();if(e.type===`symbol`&&e.value===`-`)return this.index++,{type:`binary`,operator:`-`,left:{type:`literal`,value:0},right:this.parseFactor()};if(e.type===`symbol`&&e.value===`(`){this.index++;let e=this.parseBinaryExpression();if(!this.consumeSymbol(`)`))throw Error(`Missing closing parenthesis`);return e}if(e.type===`word`&&e.value===`calc`){if(this.index++,!this.consumeSymbol(`(`))throw Error(`Missing opening parenthesis after calc`);let e=this.parseBinaryExpression();if(!this.consumeSymbol(`)`))throw Error(`Missing closing parenthesis`);return e}if(e.type===`number`){this.index++;let t=e.value,n=this.peek();return n&&n.type===`symbol`&&n.value===`%`?(this.index++,{type:`percentage`,value:t/100}):(n&&n.type===`word`&&n.value===`px`&&this.index++,{type:`literal`,value:t})}throw Error(`Unexpected token in expression`)}consumeSymbol(e){let t=this.peek();return t&&t.type===`symbol`&&t.value===e?(this.index++,!0):!1}peek(){return this.tokens[this.index]||null}};function wd(e){return e>=`0`&&e<=`9`}function Td(e){return e>=`a`&&e<=`z`||e>=`A`&&e<=`Z`}function Ed(e){return!!(e&&e.type===`symbol`&&(e.value===`+`||e.value===`-`))}function Dd(e,t){let n={...e};for(let e in t)e!==`id`&&(Array.isArray(n[e])&&Array.isArray(t[e])?n[e]=Od(n[e],t[e]):n[e]=t[e]);return n}function Od(e,t){e=e.slice();for(let n=0;n<t.length;n++){let r=t[n];Number.isFinite(r)&&(e[n]=r)}return e}var kd=class{constructor(e){let{id:t,x:n=0,y:r=0,width:i=`100%`,height:a=`100%`,padding:o=null}=e;this.id=t||this.constructor.displayName||`view`,this.props={...e,id:this.id},this._x=K(n),this._y=K(r),this._width=K(i),this._height=K(a),this._padding=o&&{left:K(o.left||0),right:K(o.right||0),top:K(o.top||0),bottom:K(o.bottom||0)},this.equals=this.equals.bind(this),Object.seal(this)}equals(e){return this===e?!0:this.constructor===e.constructor&&G(this.props,e.props,2)}clone(e){let t=this.constructor;return new t({...this.props,...e})}makeViewport({width:e,height:t,viewState:n}){n=this.filterViewState(n);let r=this.getDimensions({width:e,height:t});return!r.height||!r.width?null:new(this.getViewportType(n))({...n,...this.props,...r})}getViewStateId(){let{viewState:e}=this.props;return typeof e==`string`?e:e?.id||this.id}filterViewState(e){return this.props.viewState&&typeof this.props.viewState==`object`?this.props.viewState.id?Dd(e,this.props.viewState):this.props.viewState:e}getDimensions({width:e,height:t}){let n={x:q(this._x,e),y:q(this._y,t),width:q(this._width,e),height:q(this._height,t)};return this._padding&&(n.padding={left:q(this._padding.left,e),top:q(this._padding.top,t),right:q(this._padding.right,e),bottom:q(this._padding.bottom,t)}),n}get controller(){let e=this.props.controller;return e?e===!0?{type:this.ControllerType}:typeof e==`function`?{type:e}:{type:this.ControllerType,...e}:null}},Ad=class{constructor(e){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=e}get inProgress(){return this._inProgress}start(e){this.cancel(),this.settings=e,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&=(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,!1)}update(){if(!this._inProgress)return!1;if(this._handle===null){let{_timeline:e,settings:t}=this;this._handle=e.addChannel({delay:e.getTime(),duration:t.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}},jd=()=>{},Md={mode:`preserve`},Nd={mode:`hard`},Pd={BREAK:1,SNAP_TO_END:2,IGNORE:3},Fd=e=>e,Id=Pd.BREAK,Ld=class{constructor(e){this._onTransitionUpdate=e=>{let{time:t,settings:{interpolator:n,startProps:r,endProps:i,duration:a,easing:o}}=e,s=o(t/a),c=n.interpolateProps(r,i,s);this.propsInTransition=this.getControllerState({...this.props,...c},Md).getViewportProps(),this.onViewStateChange({viewState:this.propsInTransition,oldViewState:this.props})},this.getControllerState=e.getControllerState,this.propsInTransition=null,this.transition=new Ad(e.timeline),this.onViewStateChange=e.onViewStateChange||jd,this.onStateChange=e.onStateChange||jd}finalize(){this.transition.cancel()}getViewportInTransition(){return this.propsInTransition}processViewStateChange(e){let t=!1,n=this.props;if(this.props=e,!n||this._shouldIgnoreViewportChange(n,e))return!1;if(this._isTransitionEnabled(e)){let r=n;if(this.transition.inProgress){let{interruption:e,endProps:t}=this.transition.settings;r={...n,...e===Pd.SNAP_TO_END?t:this.propsInTransition||n}}this._triggerTransition(r,e),t=!0}else this.transition.cancel();return t}updateTransition(){this.transition.update()}_isTransitionEnabled(e){let{transitionDuration:t,transitionInterpolator:n}=e;return(t>0||t===`auto`)&&!!n}_isUpdateDueToCurrentTransition(e){return this.transition.inProgress&&this.propsInTransition?this.transition.settings.interpolator.arePropsEqual(e,this.propsInTransition):!1}_shouldIgnoreViewportChange(e,t){return this.transition.inProgress?this.transition.settings.interruption===Pd.IGNORE||this._isUpdateDueToCurrentTransition(t):this._isTransitionEnabled(t)?t.transitionInterpolator.arePropsEqual(e,t):!0}_triggerTransition(e,t){let n=this.getControllerState(e,Md),r=this.getControllerState(t,Nd).shortestPathFrom(n),i=t.transitionInterpolator,a=i.getDuration?i.getDuration(e,t):t.transitionDuration;if(a===0)return;let o=i.initializeProps(e,r);this.propsInTransition={};let s={duration:a,easing:t.transitionEasing||Fd,interpolator:i,interruption:t.transitionInterruption||Id,startProps:o.start,endProps:o.end,onStart:t.onTransitionStart,onUpdate:this._onTransitionUpdate,onInterrupt:this._onTransitionEnd(t.onTransitionInterrupt),onEnd:this._onTransitionEnd(t.onTransitionEnd)};this.transition.start(s),this.onStateChange({inTransition:!0}),this.updateTransition()}_onTransitionEnd(e){return t=>{this.propsInTransition=null,this.onStateChange({inTransition:!1,isZooming:!1,isPanning:!1,isRotating:!1}),e?.(t)}}};function J(e,t){if(!e)throw Error(t||`deck.gl: assertion failed.`)}var Rd=class{constructor(e){let{compare:t,extract:n,required:r}=e;this._propsToCompare=t,this._propsToExtract=n||t,this._requiredProps=r}arePropsEqual(e,t){for(let n of this._propsToCompare)if(!(n in e)||!(n in t)||!ii(e[n],t[n]))return!1;return!0}initializeProps(e,t){let n={},r={};for(let i of this._propsToExtract)(i in e||i in t)&&(n[i]=e[i],r[i]=t[i]);return this._checkRequiredProps(n),this._checkRequiredProps(r),{start:n,end:r}}getDuration(e,t){return t.transitionDuration}_checkRequiredProps(e){this._requiredProps&&this._requiredProps.forEach(t=>{let n=e[t];J(Number.isFinite(n)||Array.isArray(n),`${t} is required for transition`)})}},zd=[`longitude`,`latitude`,`zoom`,`bearing`,`pitch`],Bd=[`longitude`,`latitude`,`zoom`],Vd=class extends Rd{constructor(e={}){let t=Array.isArray(e)?e:e.transitionProps,n=Array.isArray(e)?{}:e;n.transitionProps=Array.isArray(t)?{compare:t,required:t}:t||{compare:zd,required:Bd},super(n.transitionProps),this.opts=n}initializeProps(e,t){let n=super.initializeProps(e,t),{makeViewport:r,around:i}=this.opts;if(r&&i){let a=r(e),o=r(t),s=a.unproject(i);n.start.around=i,Object.assign(n.end,{around:o.project(s),aroundPosition:s,width:t.width,height:t.height})}return n}interpolateProps(e,t,n){let r={};for(let i of this._propsToExtract)r[i]=ri(e[i]||0,t[i]||0,n);if(t.aroundPosition&&this.opts.makeViewport){let i=this.opts.makeViewport({...t,...r});Object.assign(r,i.panByPosition(t.aroundPosition,ri(e.around,t.around,n)))}return r}},Hd={transitionDuration:0},Ud=300,Wd=300,Gd=e=>1-(1-e)*(1-e),Kd=e=>e===1?1:1-2**(-10*e),qd={WHEEL:[`wheel`],PAN:[`panstart`,`panmove`,`panend`],PINCH:[`pinchstart`,`pinchmove`,`pinchend`],MULTI_PAN:[`multipanstart`,`multipanmove`,`multipanend`],DOUBLE_CLICK:[`dblclick`],DOUBLE_CLICK_DRAG:[`dblclickdragstart`,`dblclickdragmove`,`dblclickdragend`,`dblclickdragcancel`],KEYBOARD:[`keydown`]},Jd={},Yd=class{constructor(e){this.state={},this._events={},this._interactionState={isDragging:!1},this._customEvents=[],this._eventStartBlocked=null,this._panMove=!1,this._multiPanMode=null,this._multiPanStartCenter=null,this._doubleClickDragAnchor=null,this._suppressDoubleClickUntil=0,this.invertPan=!1,this.dragMode=`rotate`,this.inertia=0,this.scrollZoom=!0,this.dragPan=!0,this.dragRotate=!0,this.doubleClickZoom=!0,this.doubleClickDragZoom=!0,this.touchZoom=!0,this.touchRotate=!1,this.multiTouchDrag=null,this.trackpadGesture=!1,this.zoomAround=`pointer`,this.keyboard=!0,this.transitionManager=new Ld({...e,getControllerState:(t,n)=>new this.ControllerState({...t,constraintContext:n,makeViewport:e.makeViewport}),onViewStateChange:this._onTransition.bind(this),onStateChange:this._setInteractionState.bind(this)}),this.handleEvent=this.handleEvent.bind(this),this.eventManager=e.eventManager,this.onViewStateChange=e.onViewStateChange||(()=>{}),this.onStateChange=e.onStateChange||(()=>{}),this.makeViewport=e.makeViewport,this.pickPosition=e.pickPosition}set events(e){this.toggleEvents(this._customEvents,!1),this.toggleEvents(e,!0),this._customEvents=e,this.props&&this.setProps(this.props)}finalize(){for(let e in this._events)this._events[e]&&this.eventManager?.off(e,this.handleEvent);this.transitionManager.finalize()}handleEvent(e){this._controllerState=void 0;let t=this._eventStartBlocked;switch(e.type){case`panstart`:return t?!1:this._onPanStart(e);case`panmove`:return this._onPan(e);case`panend`:return this._onPanEnd(e);case`pinchstart`:return t||!this._isTrackpadGestureAllowed(e)?!1:this._onPinchStart(e);case`pinchmove`:return this._isTrackpadGestureAllowed(e)?this._onPinch(e):!1;case`pinchend`:return this._isTrackpadGestureAllowed(e)?this._onPinchEnd(e):!1;case`multipanstart`:return t?!1:this._onMultiPanStart(e);case`multipanmove`:return this._onMultiPan(e);case`multipanend`:return this._onMultiPanEnd(e);case`dblclick`:return this._onDoubleClick(e);case`dblclickdragstart`:return t?!1:this._onDoubleClickDragStart(e);case`dblclickdragmove`:return this._onDoubleClickDrag(e);case`dblclickdragend`:case`dblclickdragcancel`:return this._onDoubleClickDragEnd(e);case`wheel`:return this._onWheel(e);case`keydown`:return this._onKeyDown(e);default:return!1}}get controllerState(){return this._controllerState=this._controllerState||new this.ControllerState({makeViewport:this.makeViewport,...this.props,...this.state}),this._controllerState}getCenter(e){let{x:t,y:n}=this.props,{offsetCenter:r}=e;return[r.x-t,r.y-n]}getZoomPosition(e){if(this.zoomAround===`pointer`)return e;let t=this.makeViewport(this.controllerState.getViewportProps()),[n,r]=zc(t.center,t.pixelProjectionMatrix);return[n,r]}isPointInBounds(e,t){let{width:n,height:r}=this.props;if(t&&t.handled)return!1;let i=e[0]>=0&&e[0]<=n&&e[1]>=0&&e[1]<=r;return i&&t&&t.stopPropagation(),i}isFunctionKeyPressed(e){let{srcEvent:t}=e;return!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}isDragging(){return this._interactionState.isDragging||!1}blockEvents(e){let t=setTimeout(()=>{this._eventStartBlocked===t&&(this._eventStartBlocked=null)},e);this._eventStartBlocked=t}setProps(e){e.maxBoundsPadding===void 0&&(e.maxBoundsPadding=null),e.dragMode&&(this.dragMode=e.dragMode);let t=this.props;this.props=e,`transitionInterpolator`in e||(e.transitionInterpolator=this._getTransitionProps().transitionInterpolator),this.transitionManager.processViewStateChange(e);let{inertia:n}=e;this.inertia=Number.isFinite(n)?n:n===!0?Ud:0;let{scrollZoom:r=!0,dragPan:i=!0,dragRotate:a=!0,doubleClickZoom:o=!0,doubleClickDragZoom:s=!1,touchZoom:c=!0,touchRotate:l=!1,multiTouchDrag:u=l?`rotate`:null,trackpadGesture:d=!1,zoomAround:f=`pointer`,keyboard:p=!0}=e,m=!!this.onViewStateChange;if(this.toggleEvents(qd.WHEEL,m&&r),this.toggleEvents(qd.PAN,m),this.toggleEvents(qd.PINCH,m&&(c||u===`rotate`)),this.toggleEvents(qd.MULTI_PAN,m&&!!u),this.toggleEvents(qd.DOUBLE_CLICK,m&&o),this.toggleEvents(qd.DOUBLE_CLICK_DRAG,m&&s),this.toggleEvents(qd.KEYBOARD,m&&p),this.scrollZoom=r,this.dragPan=i,this.dragRotate=a,this.doubleClickZoom=o,this.doubleClickDragZoom=s,this.touchZoom=c,this.touchRotate=u===`rotate`,this.multiTouchDrag=u,this.trackpadGesture=d,this.zoomAround=f,this.keyboard=p,(!t||t.height!==e.height||t.width!==e.width||t.maxBounds!==e.maxBounds||t.maxBoundsPadding!==e.maxBoundsPadding)&&e.maxBounds){let t=new this.ControllerState({...e,makeViewport:this.makeViewport}),n=t.getViewportProps();Object.keys(n).some(t=>!G(n[t],e[t],1))&&this.updateViewport(t)}}updateTransition(){this.transitionManager.updateTransition()}toggleEvents(e,t){this.eventManager&&e.forEach(e=>{this._events[e]!==t&&(this._events[e]=t,t?this.eventManager.on(e,this.handleEvent):this.eventManager.off(e,this.handleEvent))})}updateViewport(e,t=null,n={}){let r={...e.getViewportProps(),...t},i=this.controllerState!==e;if(this.state=e.getState(),this._setInteractionState(n),i){let e=this.controllerState&&this.controllerState.getViewportProps();this.onViewStateChange&&this.onViewStateChange({viewState:r,interactionState:this._interactionState,oldViewState:e,viewId:this.props.id})}}_onTransition(e){this.onViewStateChange({...e,interactionState:this._interactionState,viewId:this.props.id})}_setInteractionState(e){Object.assign(this._interactionState,e),this.onStateChange(this._interactionState)}_getConstraintContext(e,t){return this.props.rubberBand?{mode:t===`update`?`elastic`:t===`end`?`rebound`:`hard`}:{mode:`hard`}}_getReboundTransition(e,t){if(e.mode!==`rebound`)return null;let n=t.getViewportProps();return Object.keys(n).some(e=>!G(this.props[e],n[e],1))?{...this._getTransitionProps(),transitionDuration:Wd,transitionEasing:Kd}:null}_onPanStart(e){let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e)||e.rightButton||!1;(this.invertPan||this.dragMode===`pan`)&&(n=!n);let r=n?`pan`:`rotate`,i=this._getConstraintContext(r,`start`),a=n?this.controllerState.panStart({pos:t},i):this.controllerState.rotateStart({pos:t},i);return this._panMove=n,this.updateViewport(a,Hd,{isDragging:!0}),!0}_onPan(e){return this.isDragging()?this._panMove?this._onPanMove(e):this._onPanRotate(e):!1}_onPanEnd(e){return this.isDragging()?this._panMove?this._onPanMoveEnd(e):this._onPanRotateEnd(e):!1}_onPanMove(e){if(!this.dragPan)return!1;let t=this.getCenter(e),n=this.controllerState.pan({pos:t},this._getConstraintContext(`pan`,`update`));return this.updateViewport(n,Hd,{isDragging:!0,isPanning:!0}),!0}_onPanMoveEnd(e){let{inertia:t}=this;if(this.dragPan&&t&&e.velocity){let n=this.getCenter(e),r=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],i=this.controllerState.pan({pos:r}).panEnd();this.updateViewport(i,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:Gd},{isDragging:!1,isPanning:!0})}else{let e=this.controllerState,t=this._getConstraintContext(`pan`,`end`),n=e.panEnd(t),r=this._getReboundTransition(t,n);this.updateViewport(n,r,{isDragging:!1,isPanning:!!r})}return!0}_onPanRotate(e){if(!this.dragRotate)return!1;let t=this.getCenter(e),n=this.controllerState.rotate({pos:t},this._getConstraintContext(`rotate`,`update`));return this.updateViewport(n,Hd,{isDragging:!0,isRotating:!0}),!0}_onPanRotateEnd(e){let{inertia:t}=this;if(this.dragRotate&&t&&e.velocity){let n=this.getCenter(e),r=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],i=this.controllerState.rotate({pos:r}).rotateEnd();this.updateViewport(i,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:Gd},{isDragging:!1,isRotating:!0})}else{let e=this.controllerState,t=this._getConstraintContext(`rotate`,`end`),n=e.rotateEnd(t),r=this._getReboundTransition(t,n);this.updateViewport(n,r,{isDragging:!1,isRotating:!!r})}return!0}_onWheel(e){if(!this.scrollZoom||this.trackpadGesture&&e.device!==`mouse`)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;e.srcEvent.preventDefault();let{speed:n=.01,smooth:r=!1}=this.scrollZoom===!0?{}:this.scrollZoom,{delta:i}=e,a=2/(1+Math.exp(-Math.abs(i*n)));i<0&&a!==0&&(a=1/a);let o=this.getZoomPosition(t),s=r?{...this._getTransitionProps({around:o}),transitionDuration:250}:Hd,c=this.controllerState.zoom({pos:o,scale:a});return this.updateViewport(c,s,{isZooming:!0,isPanning:!0}),r||this._setInteractionState({isZooming:!1,isPanning:!1}),!0}_onMultiPanStart(e){let{multiTouchDrag:t}=this;if(!t||!this._isMultiPanEventAllowed(e,t))return!1;let n=e.offsetCenter;if(!this.isPointInBounds(this.getCenter(e),e))return!1;let r=e.pointerType===`trackpad`,i={x:n.x-(r?0:e.deltaX),y:n.y-(r?0:e.deltaY)},a={...e,offsetCenter:i},o=this.getCenter(a),s=t===`pan`?this.controllerState.panStart({pos:o},this._getConstraintContext(`pan`,`start`)):this.controllerState.rotateStart({pos:o},this._getConstraintContext(`rotate`,`start`));return this._multiPanMode=t,this._multiPanStartCenter=i,this.updateViewport(s,Hd,{isDragging:!0}),!0}_onMultiPan(e){let{mode:t,event:n}=this._getMultiPanEvent(e);return!t||!n||!this.isDragging()?!1:t===`pan`?this._onPanMove(n):this._onPanRotate(n)}_onMultiPanEnd(e){let{mode:t,event:n}=this._getMultiPanEvent(e);if(!t||!n||!this.isDragging())return this._resetMultiPan(),!1;let r=t===`pan`?this._onPanMoveEnd(n):this._onPanRotateEnd(n);return this._resetMultiPan(),r}_isTrackpadGestureAllowed(e){return e.pointerType!==`trackpad`||this.trackpadGesture}_isMultiPanEventAllowed(e,t){return e.pointerType===`trackpad`?this.trackpadGesture&&(t===`pan`?this.dragPan:this.dragRotate):e.pointerType===`touch`&&(t===`pan`?this.dragPan:this.dragRotate)}_getMultiPanEvent(e){let t=this._multiPanMode,n=this._multiPanStartCenter;return!t||!n?{mode:null,event:null}:{mode:t,event:{...e,offsetCenter:{x:n.x+e.deltaX,y:n.y+e.deltaY}}}}_resetMultiPan(){this._multiPanMode=null,this._multiPanStartCenter=null}_onPinchStart(e){this._doubleClickDragAnchor=null;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.controllerState.zoomStart({pos:this.getZoomPosition(t)},this._getConstraintContext(`zoom`,`start`)).rotateStart({pos:t},this._getConstraintContext(`rotate`,`start`));return Jd._startPinchRotation=e.rotation,Jd._lastPinchEvent=e,this.updateViewport(n,Hd,{isDragging:!0}),!0}_onPinch(e){if(!this.touchZoom&&!this.touchRotate||!this.isDragging())return!1;let t=this.controllerState;if(this.touchZoom){let{scale:n}=e,r=this.getCenter(e);t=t.zoom({pos:this.getZoomPosition(r),scale:n},this._getConstraintContext(`zoom`,`update`))}if(this.touchRotate){let{rotation:n}=e;t=t.rotate({deltaAngleX:Jd._startPinchRotation-n},this._getConstraintContext(`rotate`,`update`))}return this.updateViewport(t,Hd,{isDragging:!0,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:this.touchRotate}),Jd._lastPinchEvent=e,!0}_onPinchEnd(e){if(!this.isDragging())return!1;let{inertia:t}=this,{_lastPinchEvent:n}=Jd;if(this.touchZoom&&t&&n&&e.scale!==n.scale){let r=this.getCenter(e),i=this.getZoomPosition(r),a=this.controllerState.rotateEnd(),o=Math.log2(e.scale),s=2**(o+(o-Math.log2(n.scale))/(e.deltaTime-n.deltaTime)*t/2);a=a.zoom({pos:i,scale:s}).zoomEnd(),this.updateViewport(a,{...this._getTransitionProps({around:i}),transitionDuration:t,transitionEasing:Gd},{isDragging:!1,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:!1}),this.blockEvents(t)}else{let e=this.controllerState,t=this._getConstraintContext(`zoom`,`end`),n=this._getConstraintContext(`rotate`,`end`),r=e.zoomEnd(t).rotateEnd(n),i=this._getReboundTransition(this.touchZoom?t:n,r);this.updateViewport(r,i,{isDragging:!1,isPanning:!!i&&this.touchZoom,isZooming:!!i&&this.touchZoom,isRotating:!!i&&this.touchRotate})}return Jd._startPinchRotation=null,Jd._lastPinchEvent=null,!0}_onDoubleClick(e){if(!this.doubleClickZoom||Date.now()<this._suppressDoubleClickUntil)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e),r=this.getZoomPosition(t),i=this.controllerState.zoom({pos:r,scale:n?.5:2});return this.updateViewport(i,this._getTransitionProps({around:r}),{isZooming:!0,isPanning:!0}),this.blockEvents(100),!0}_onDoubleClickDragStart(e){if(!this.doubleClickDragZoom)return this._doubleClickDragAnchor=null,!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return this._doubleClickDragAnchor=null,!1;this._doubleClickDragAnchor=this.getZoomPosition(t);let n=this.controllerState.zoomStart({pos:this._doubleClickDragAnchor},this._getConstraintContext(`zoom`,`start`));return e.scale!==1&&(n=n.zoom({pos:this._doubleClickDragAnchor,scale:e.scale},this._getConstraintContext(`zoom`,`update`))),this.updateViewport(n,Hd,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDrag(e){let t=this._doubleClickDragAnchor;if(!t)return!1;let n=this.controllerState.zoom({pos:t,scale:e.scale},this._getConstraintContext(`zoom`,`update`));return this.updateViewport(n,Hd,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDragEnd(e){if(!this._doubleClickDragAnchor)return!1;this._doubleClickDragAnchor=null;let t=this.controllerState,n=this._getConstraintContext(`zoom`,`end`),r=t.zoomEnd(n),i=this._getReboundTransition(n,r);return this.updateViewport(r,i,{isDragging:!1,isPanning:!!i,isZooming:!!i}),this._suppressDoubleClickUntil=Date.now()+100,this.blockEvents(100),!0}_onKeyDown(e){if(!this.keyboard)return!1;let t=this.isFunctionKeyPressed(e),{zoomSpeed:n,moveSpeed:r,rotateSpeedX:i,rotateSpeedY:a}=this.keyboard===!0?{}:this.keyboard,{controllerState:o}=this,s,c={};switch(e.srcEvent.code){case`Minus`:s=t?o.zoomOut(n).zoomOut(n):o.zoomOut(n),c.isZooming=!0;break;case`Equal`:s=t?o.zoomIn(n).zoomIn(n):o.zoomIn(n),c.isZooming=!0;break;case`ArrowLeft`:t?(s=o.rotateLeft(i),c.isRotating=!0):(s=o.moveLeft(r),c.isPanning=!0);break;case`ArrowRight`:t?(s=o.rotateRight(i),c.isRotating=!0):(s=o.moveRight(r),c.isPanning=!0);break;case`ArrowUp`:t?(s=o.rotateUp(a),c.isRotating=!0):(s=o.moveUp(r),c.isPanning=!0);break;case`ArrowDown`:t?(s=o.rotateDown(a),c.isRotating=!0):(s=o.moveDown(r),c.isPanning=!0);break;default:return!1}return this.updateViewport(s,this._getTransitionProps(),c),!0}_getTransitionProps(e){let{transition:t}=this;return!t||!t.transitionInterpolator?Hd:e?{...t,transitionInterpolator:new Vd({...e,...t.transitionInterpolator.opts,makeViewport:this.controllerState.makeViewport})}:t}},Xd=Symbol(`constraintAround`),Zd=class{constructor(e,t,n,r){this.makeViewport=n,this._viewportProps=this.applyConstraints(e,r),this._state=t}getViewportProps(){return this._viewportProps}getState(){return this._state}};function Qd(e,t,n){let r=e-t;return r&&Number.isFinite(r)?t+r*n/(n+Math.abs(r)):t}function $d(e,t,n){let r=q(K(n?.left??0),e),i=q(K(n?.right??0),e),a=q(K(n?.top??0),t),o=q(K(n?.bottom??0),t);return{x:r,y:a,width:e-r-i,height:t-a-o}}function ef(e,t,n){let[r,i]=e.project(t);return r=Number.isFinite(r)?r:e.width/2,i=Number.isFinite(i)?i:e.height/2,{left:r-n.x,right:n.x+n.width-r,top:i-n.y,bottom:n.y+n.height-i}}var tf=5,nf=1.2,rf=512,af=[[-1/0,-90],[1/0,90]],of=1;function sf([e,t]){if(Math.abs(t)>90&&(t=Math.sign(t)*90),Number.isFinite(e)){let[n,r]=kc([e,t]);return[n,I(r,0,rf)]}let[,n]=kc([0,t]);return[e,I(n,0,rf)]}var cf=class extends Zd{constructor(e){let{width:t,height:n,latitude:r,longitude:i,zoom:a,bearing:o=0,pitch:s=0,altitude:c=1.5,position:l=[0,0,0],maxZoom:u=20,minZoom:d=0,maxPitch:f=60,minPitch:p=0,startPanLngLat:m,startZoomLngLat:h,startRotatePos:g,startRotateLngLat:_,startBearing:v,startPitch:y,startZoom:b,normalize:x=!0,rubberBand:S=!1}=e,{[Xd]:C}=e;J(Number.isFinite(i)),J(Number.isFinite(r)),J(Number.isFinite(a));let w=e.maxBounds||(x?af:null),T=e.maxBoundsPadding||null;super({width:t,height:n,latitude:r,longitude:i,zoom:a,bearing:o,pitch:s,altitude:c,maxZoom:u,minZoom:d,maxPitch:f,minPitch:p,normalize:x,position:l,maxBounds:w,maxBoundsPadding:T,rubberBand:S,[Xd]:C},{startPanLngLat:m,startZoomLngLat:h,startRotatePos:g,startRotateLngLat:_,startBearing:v,startPitch:y,startZoom:b},e.makeViewport,e.constraintContext),this.getAltitude=e.getAltitude}panStart({pos:e},t){return this._getUpdatedState({startPanLngLat:this._unproject(e)},t)}pan({pos:e,startPos:t},n){let r=this.getState().startPanLngLat||this._unproject(t);if(!r)return this;let i=this.makeViewport(this.getViewportProps()).panByPosition(r,e);return this._getUpdatedState(i,n)}panEnd(e){return this._getUpdatedState({startPanLngLat:null},e)}rotateStart({pos:e}){let t=this.getAltitude?.(e);return this._getUpdatedState({startRotatePos:e,startRotateLngLat:t===void 0?void 0:this._unproject3D(e,t),startBearing:this.getViewportProps().bearing,startPitch:this.getViewportProps().pitch})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:n=0}){let{startRotatePos:r,startRotateLngLat:i,startBearing:a,startPitch:o}=this.getState();if(!r||a===void 0||o===void 0)return this;let s;if(s=e?this._getNewRotation(e,r,o,a):{bearing:a+t,pitch:o+n},i){let e=this.makeViewport({...this.getViewportProps(),...s}),t=`panByPosition3D`in e?`panByPosition3D`:`panByPosition`;return this._getUpdatedState({...s,...e[t](i,r)})}return this._getUpdatedState(s)}rotateEnd(){return this._getUpdatedState({startRotatePos:null,startRotateLngLat:null,startBearing:null,startPitch:null})}zoomStart({pos:e},t){return this._getUpdatedState({startZoomLngLat:this._unproject(e),startZoom:this.getViewportProps().zoom},t)}zoom({pos:e,startPos:t,scale:n},r){let{startZoom:i,startZoomLngLat:a}=this.getState();return a||=(i=this.getViewportProps().zoom,this._unproject(t)||this._unproject(e)),a?this._getUpdatedState({zoom:i+Math.log2(n),[Xd]:{position:a,screenPosition:e}},r):this}zoomEnd(e){return this._getUpdatedState({startZoomLngLat:null,startZoom:null},e)}zoomIn(e=2,t){return this._zoomFromCenter(e,t)}zoomOut(e=2,t){return this._zoomFromCenter(1/e,t)}moveLeft(e=100,t){return this._panFromCenter([e,0],t)}moveRight(e=100,t){return this._panFromCenter([-e,0],t)}moveUp(e=100,t){return this._panFromCenter([0,e],t)}moveDown(e=100,t){return this._panFromCenter([0,-e],t)}rotateLeft(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing-e})}rotateRight(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing+e})}rotateUp(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch+e})}rotateDown(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch-e})}shortestPathFrom(e){let t=e.getViewportProps(),n={...this.getViewportProps()},{bearing:r,longitude:i}=n;return Math.abs(r-t.bearing)>180&&(n.bearing=r<0?r+360:r-360),Math.abs(i-t.longitude)>180&&(n.longitude=i<0?i+360:i-360),n}applyConstraints(e,t){let n=e,r=n[Xd];delete n[Xd];let{maxPitch:i,minPitch:a,pitch:o,bearing:s,normalize:c,maxBounds:l,rubberBand:u}=e;c&&(s<-180||s>180)&&(e.bearing=Vl(s+180,360)-180),e.pitch=I(o,a,i);let d=this._constrainZoom(e.zoom,e),f=u&&t?.mode===`elastic`;if(e.zoom=t?.mode===`preserve`?e.zoom:f?Qd(e.zoom,d,of):d,r){let t=this.makeViewport(e);Object.assign(e,t.panByPosition(r.position,r.screenPosition))}if(c&&(e.longitude<-180||e.longitude>180)&&(e.longitude=Vl(e.longitude+180,360)-180),l){let n=$d(e.width,e.height,e.maxBoundsPadding),r=ef(this.makeViewport({...e,bearing:0,pitch:0}),[e.longitude,e.latitude],n),i=sf(l[0]),a=sf(l[1]),o=2**e.zoom,s=[i[0]+r.left/o,i[1]+r.bottom/o],c=[a[0]-r.right/o,a[1]-r.top/o],u=sf([e.longitude,e.latitude]),d=[I(u[0],s[0],c[0]),I(u[1],s[1],c[1])],p=u.slice();if(n.width>=0&&(p[0]=t?.mode===`preserve`?u[0]:f?Qd(u[0],d[0],n.width/2/o):d[0]),n.height>=0&&(p[1]=t?.mode===`preserve`?u[1]:f?Qd(u[1],d[1],n.height/2/o):d[1]),p[0]!==u[0]||p[1]!==u[1]){let[t,n]=Ac(p);p[0]!==u[0]&&(e.longitude=t),p[1]!==u[1]&&(e.latitude=n)}}return e}_constrainZoom(e,t){t||=this.getViewportProps();let{maxZoom:n,maxBounds:r}=t,i=r!==null&&t.width>0&&t.height>0,{minZoom:a}=t;if(i){let e=$d(t.width,t.height,t.maxBoundsPadding),i=sf(r[0]),o=sf(r[1]),s=o[0]-i[0],c=o[1]-i[1];e.width>0&&Number.isFinite(s)&&s>0&&(a=Math.max(a,Math.log2(e.width/s))),e.height>0&&Number.isFinite(c)&&c>0&&(a=Math.max(a,Math.log2(e.height/c))),a>n&&(a=n)}return I(e,a,n)}_zoomFromCenter(e,t){let{width:n,height:r}=this.getViewportProps();return this.zoom({pos:[n/2,r/2],scale:e},t)}_panFromCenter(e,t){let{width:n,height:r}=this.getViewportProps();return this.pan({startPos:[n/2,r/2],pos:[n/2+e[0],r/2+e[1]]},t)}_getUpdatedState(e,t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e,constraintContext:t})}_unproject(e){let t=this.makeViewport(this.getViewportProps());return e&&t.unproject(e)}_unproject3D(e,t){return this.makeViewport(this.getViewportProps()).unproject(e,{targetZ:t})}_getNewRotation(e,t,n,r){let i=e[0]-t[0],a=e[1]-t[1],o=e[1],s=t[1],{width:c,height:l}=this.getViewportProps(),u=i/c,d=0;a>0?Math.abs(l-s)>tf&&(d=a/(s-l)*nf):a<0&&s>tf&&(d=1-o/s),d=I(d,-1,1);let{minPitch:f,maxPitch:p}=this.getViewportProps(),m=r+180*u,h=n;return d>0?h=n+d*(p-n):d<0&&(h=n-d*(f-n)),{pitch:h,bearing:m}}},lf=class extends Yd{constructor(){super(...arguments),this.ControllerState=cf,this.transition={transitionDuration:300,transitionInterpolator:new Vd({transitionProps:{compare:[`longitude`,`latitude`,`zoom`,`bearing`,`pitch`,`position`],required:[`longitude`,`latitude`,`zoom`]}})},this.dragMode=`pan`,this.rotationPivot=`center`,this._getAltitude=e=>{if(this.rotationPivot===`2d`)return 0;if(this.rotationPivot===`3d`&&this.pickPosition){let{x:t,y:n}=this.props,r=this.pickPosition(t+e[0],n+e[1]);if(r&&r.coordinate&&r.coordinate.length>=3)return r.coordinate[2]}}}setProps(e){`rotationPivot`in e&&(this.rotationPivot=e.rotationPivot||`center`),e.getAltitude=this._getAltitude,e.position=e.position||[0,0,0],e.maxBounds=e.maxBounds||(e.normalize===!1?null:af),super.setProps(e)}updateViewport(e,t=null,n={}){let r=e.getState();n.isDragging&&r.startRotateLngLat?n={...n,rotationPivotPosition:r.startRotateLngLat}:n.isDragging===!1&&(n={...n,rotationPivotPosition:void 0}),super.updateViewport(e,t,n)}},uf=class extends kd{constructor(e={}){super(e)}getViewportType(){return nu}get ControllerType(){return lf}};uf.displayName=`MapView`;var df=new Rl;function ff(e,t){return(e.order??1/0)-(t.order??1/0)}var pf=class{constructor(e){this._resolvedEffects=[],this._defaultEffects=[],this.effects=[],this._context=e,this._needsRedraw=`Initial render`,this._setEffects([])}addDefaultEffect(e){let t=this._defaultEffects;if(!t.find(t=>t.id===e.id)){let n=t.findIndex(t=>ff(t,e)>0);n<0?t.push(e):t.splice(n,0,e),e.setup(this._context),this._setEffects(this.effects)}}setProps(e){`effects`in e&&(G(e.effects,this.effects,1)||this._setEffects(e.effects))}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}getEffects(){return this._resolvedEffects}_setEffects(e){let t={};for(let e of this.effects)t[e.id]=e;let n=[];for(let r of e){let e=t[r.id],i=r;e&&e!==r?e.setProps?(e.setProps(r.props),i=e):e.cleanup(this._context):e||r.setup(this._context),n.push(i),delete t[r.id]}for(let e in t)t[e].cleanup(this._context);this.effects=n,this._resolvedEffects=n.concat(this._defaultEffects),e.some(e=>e instanceof Rl)||this._resolvedEffects.push(df),this._needsRedraw=`effects changed`}finalize(){for(let e of this._resolvedEffects)e.cleanup(this._context);this.effects.length=0,this._resolvedEffects.length=0,this._defaultEffects.length=0}},mf=class extends Al{shouldDrawLayer(e){let{operation:t}=e.props;return t.includes(`draw`)||t.includes(`terrain`)}render(e){return this._render(e)}},hf=`deckRenderer.renderLayers`,gf=class{constructor(e,t={}){this.device=e,this.stats=t.stats,this.layerFilter=null,this.drawPickingColors=!1,this.drawLayersPass=new mf(e),this.pickLayersPass=new ed(e),this.renderCount=0,this._needsRedraw=`Initial render`,this.renderBuffers=[],this.lastPostProcessEffect=null}setProps(e){this.layerFilter!==e.layerFilter&&(this.layerFilter=e.layerFilter,this._needsRedraw=`layerFilter changed`),this.drawPickingColors!==e.drawPickingColors&&(this.drawPickingColors=e.drawPickingColors,this._needsRedraw=`drawPickingColors changed`)}renderLayers(e){let t=this.drawPickingColors?this.pickLayersPass:this.drawLayersPass,n={layerFilter:this.layerFilter,isPicking:this.drawPickingColors,...e};if(!e.viewports.length){let e=t.render(n),r=`stats`in e?e.stats:e;this._updateStats(r);return}n.effects&&this._preRender(n.effects,n);let r=this.lastPostProcessEffect?this.renderBuffers[0]:n.target;this.lastPostProcessEffect&&(n.clearColor=[0,0,0,0],n.clearCanvas=!0);let i=t.render({...n,target:r}),a=`stats`in i?i.stats:i;n.effects&&(this.lastPostProcessEffect&&(n.clearCanvas=e.clearCanvas===void 0?!0:e.clearCanvas),this._postRender(n.effects,n)),this.renderCount++,P(hf,this,a,e),this._updateStats(a)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}finalize(){let{renderBuffers:e}=this;for(let t of e)t.delete();e.length=0}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get(`Layers rendered`).addCount(t)}_preRender(e,t){this.lastPostProcessEffect=null,t.preRenderStats=t.preRenderStats||{};for(let n of e)t.preRenderStats[n.id]=n.preRender(t),n.postRender&&(this.lastPostProcessEffect=n.id);this.lastPostProcessEffect&&this._resizeRenderBuffers(t.canvasContext)}_resizeRenderBuffers(e=this.device.canvasContext){let{renderBuffers:t}=this,n=e.getDrawingBufferSize(),[r,i]=n;t.length===0&&[0,1].map(e=>{let n=this.device.createTexture({sampler:{minFilter:`linear`,magFilter:`linear`},width:r,height:i});t.push(this.device.createFramebuffer({id:`deck-renderbuffer-${e}`,depthStencilAttachment:e===0?`depth24plus`:void 0,colorAttachments:[n]}))});for(let e of t)e.resize(n)}_postRender(e,t){let{renderBuffers:n}=this,r=t.target??t.canvasContext?.getCurrentFramebuffer()??t.target,i={...t,inputBuffer:n[0],swapBuffer:n[1]};for(let t of e)if(t.postRender){i.target=t.id===this.lastPostProcessEffect?r:void 0;let e=t.postRender(i);i.inputBuffer=e,i.swapBuffer=e===n[0]?n[1]:n[0]}}},_f={pickedColor:null,pickedObjectIndex:-1};function vf({pickedColors:e,decodePickingColor:t,deviceX:n,deviceY:r,deviceRadius:i,deviceRect:a}){let{x:o,y:s,width:c,height:l}=a,u=i*i,d=-1,f=0;for(let t=0;t<l;t++){let i=t+s-r,a=i*i;if(a>u)f+=4*c;else for(let t=0;t<c;t++){if(e[f+3]-1>=0){let e=t+o-n,r=e*e+a;r<=u&&(u=r,d=f)}f+=4}}if(d>=0){let n=e.slice(d,d+4),r=t(n);if(r){let e=Math.floor(d/4/c),t=d/4-e*c;return{...r,pickedColor:n,pickedX:o+t,pickedY:s+e}}N.error(`Picked non-existent layer. Is picking buffer corrupt?`)()}return _f}function yf({pickedColors:e,decodePickingColor:t}){let n=new Map;if(e){for(let r=0;r<e.length;r+=4)if(e[r+3]-1>=0){let i=e.slice(r,r+4),a=i.join(`,`);if(!n.has(a)){let e=t(i);e?n.set(a,{...e,color:i}):N.error(`Picked non-existent layer. Is picking buffer corrupt?`)()}}}return Array.from(n.values())}function bf({pickInfo:e,viewports:t,pixelRatio:n,x:r,y:i,z:a}){let o=t[0];t.length>1&&(o=Cf(e?.pickedViewports||t,{x:r,y:i}));let s;if(o){let e=[r-o.x,i-o.y];a!==void 0&&(e[2]=a),s=o.unproject(e)}return{color:null,layer:null,viewport:o,index:-1,picked:!1,x:r,y:i,pixel:[r,i],coordinate:s,devicePixel:e&&`pickedX`in e?[e.pickedX,e.pickedY]:void 0,pixelRatio:n}}function xf(e){let{pickInfo:t,lastPickedInfo:n,mode:r,layers:i}=e,{pickedColor:a,pickedLayer:o,pickedObjectIndex:s}=t,c=o?[o]:[];if(r===`hover`){let e=n.index,t=n.layerId,r=o?o.props.id:null;if(r!==t||s!==e){if(r!==t){let e=i.find(e=>e.props.id===t);e&&c.unshift(e)}n.layerId=r,n.index=s,n.info=null}}let l=bf(e),u=new Map;return u.set(null,l),c.forEach(e=>{let t={...l};e===o&&(t.color=a,t.index=s,t.picked=!0),t=Sf({layer:e,info:t,mode:r});let i=t.layer;e===o&&r===`hover`&&(n.info=t),u.set(i.id,t),r===`hover`&&i.updateAutoHighlight(t)}),u}function Sf({layer:e,info:t,mode:n}){for(;e&&t;){let r=t.layer||null;t.sourceLayer=r,t.layer=e,t=e.getPickingInfo({info:t,mode:n,sourceLayer:r}),e=e.parent}return t}function Cf(e,t){for(let n=e.length-1;n>=0;n--){let r=e[n];if(r.containsPixel(t))return r}return e[0]}var wf=class{constructor(e,t={}){this._pickable=!0,this.device=e,this.stats=t.stats,this.pickLayersPass=new ed(e),this.lastPickedInfo={index:-1,layerId:null,info:null}}setProps(e){`layerFilter`in e&&(this.layerFilter=e.layerFilter),`_pickable`in e&&(this._pickable=e._pickable)}finalize(){this.pickingFBO&&this.pickingFBO.destroy(),this.depthFBO&&this.depthFBO.destroy()}pickObjectAsync(e){return this._pickClosestObjectAsync(e)}pickObjectsAsync(e){return this._pickVisibleObjectsAsync(e)}pickObject(e){return this._pickClosestObject(e)}pickObjects(e){return this._pickVisibleObjects(e)}getLastPickedObject({x:e,y:t,layers:n,viewports:r},i=this.lastPickedInfo.info){let a=i&&i.layer&&i.layer.id,o=i&&i.viewport&&i.viewport.id,s=a?n.find(e=>e.id===a):null,c=o&&r.find(e=>e.id===o)||r[0],l={x:e,y:t,viewport:c,coordinate:c&&c.unproject([e-c.x,t-c.y]),layer:s};return{...i,...l}}_resizeBuffer(e=this.device.getDefaultCanvasContext()){if(!this.pickingFBO){let e=this.device.createTexture({format:`rgba8unorm`,width:1,height:1,usage:v.RENDER_ATTACHMENT|v.COPY_SRC});if(this.pickingFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:`depth16unorm`}),this.device.isTextureFormatRenderable(`rgba32float`)){let e=this.device.createTexture({format:`rgba32float`,width:1,height:1,usage:v.RENDER_ATTACHMENT|v.COPY_SRC});this.depthFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:`depth16unorm`})}}let[t,n]=e.getDrawingBufferSize();this.pickingFBO?.resize({width:t,height:n}),this.depthFBO?.resize({width:t,height:n})}_getPickable(e){if(this._pickable===!1)return null;let t=e.filter(e=>this.pickLayersPass.shouldDrawLayer(e)&&!e.isComposite);return t.length?t:null}async _pickClosestObjectAsync({layers:e,views:t,viewports:n,x:r,y:i,radius:a=0,depth:o=1,mode:s=`query`,unproject3D:c,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=l.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0)return{result:[],emptyInfo:bf({viewports:n,x:r,y:i,pixelRatio:f})};this._resizeBuffer(l);let m=l.cssToDevicePixels([r,i],!0),h=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],g=Math.round(a*f),{width:_,height:v}=this.pickingFBO,y=this._getPickingRect({deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceWidth:_,deviceHeight:v}),b={x:r-a,y:i-a,width:a*2+1,height:a*2+1},x,S=[],C=new Set;for(let e=0;e<o;e++){let a;a=y?vf({...await this._drawAndSampleAsync({layers:p,views:t,viewports:n,onViewportActive:u,deviceRect:y,cullRect:b,effects:d,pass:`picking:${s}`,canvasContext:l}),deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceRect:y}):{pickedColor:null,pickedObjectIndex:-1};let m,_=this._getDepthLayers(a,p,c);if(_.length>0){let{pickedColors:e}=await this._drawAndSampleAsync({layers:_,views:t,viewports:n,onViewportActive:u,deviceRect:{x:a.pickedX??h[0],y:a.pickedY??h[1],width:1,height:1},cullRect:b,effects:d,pass:`picking:${s}:z`,canvasContext:l},!0);e[3]&&(m=e[0])}a.pickedLayer&&e+1<o&&(C.add(a.pickedLayer),a.pickedLayer.disablePickingIndex(a.pickedObjectIndex)),x=xf({pickInfo:a,lastPickedInfo:this.lastPickedInfo,mode:s,layers:p,viewports:n,x:r,y:i,z:m,pixelRatio:f});for(let e of x.values())e.layer&&S.push(e);if(!a.pickedColor)break}for(let e of C)e.restorePickingColors();return{result:S,emptyInfo:x.get(null)}}_pickClosestObject({layers:e,views:t,viewports:n,x:r,y:i,radius:a=0,depth:o=1,mode:s=`query`,unproject3D:c,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=l.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0)return{result:[],emptyInfo:bf({viewports:n,x:r,y:i,pixelRatio:f})};this._resizeBuffer(l);let m=l.cssToDevicePixels([r,i],!0),h=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],g=Math.round(a*f),{width:_,height:v}=this.pickingFBO,y=this._getPickingRect({deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceWidth:_,deviceHeight:v}),b={x:r-a,y:i-a,width:a*2+1,height:a*2+1},x,S=[],C=new Set;for(let e=0;e<o;e++){let a;a=y?vf({...this._drawAndSample({layers:p,views:t,viewports:n,onViewportActive:u,deviceRect:y,cullRect:b,effects:d,pass:`picking:${s}`,canvasContext:l}),deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceRect:y}):{pickedColor:null,pickedObjectIndex:-1};let m,_=this._getDepthLayers(a,p,c);if(_.length>0){let{pickedColors:e}=this._drawAndSample({layers:_,views:t,viewports:n,onViewportActive:u,deviceRect:{x:a.pickedX??h[0],y:a.pickedY??h[1],width:1,height:1},cullRect:b,effects:d,pass:`picking:${s}:z`,canvasContext:l},!0);e[3]&&(m=e[0])}a.pickedLayer&&e+1<o&&(C.add(a.pickedLayer),a.pickedLayer.disablePickingIndex(a.pickedObjectIndex)),x=xf({pickInfo:a,lastPickedInfo:this.lastPickedInfo,mode:s,layers:p,viewports:n,x:r,y:i,z:m,pixelRatio:f});for(let e of x.values())e.layer&&S.push(e);if(!a.pickedColor)break}for(let e of C)e.restorePickingColors();return{result:S,emptyInfo:x.get(null)}}async _pickVisibleObjectsAsync({layers:e,views:t,viewports:n,x:r,y:i,width:a=1,height:o=1,mode:s=`query`,maxObjects:c=null,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=this._getPickable(e);if(!f||n.length===0)return[];this._resizeBuffer(l);let p=l.cssToDeviceRatio(),m=l.cssToDevicePixels([r,i],!0),h=m.x,g=m.y+m.height,_=l.cssToDevicePixels([r+a,i+o],!0),v=_.x+_.width,y=_.y,b={x:h,y,width:v-h,height:g-y},x=yf(await this._drawAndSampleAsync({layers:f,views:t,viewports:n,onViewportActive:u,deviceRect:b,cullRect:{x:r,y:i,width:a,height:o},effects:d,pass:`picking:${s}`,canvasContext:l})),S=new Map,C=[],w=Number.isFinite(c);for(let e=0;e<x.length&&!(w&&C.length>=c);e++){let t=x[e],n={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:i,pixelRatio:p};n=Sf({layer:t.pickedLayer,info:n,mode:s});let a=n.layer.id;S.has(a)||S.set(a,new Set);let o=S.get(a),c=n.object??n.index;o.has(c)||(o.add(c),C.push(n))}return C}_pickVisibleObjects({layers:e,views:t,viewports:n,x:r,y:i,width:a=1,height:o=1,mode:s=`query`,maxObjects:c=null,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=this._getPickable(e);if(!f||n.length===0)return[];this._resizeBuffer(l);let p=l.cssToDeviceRatio(),m=l.cssToDevicePixels([r,i],!0),h=m.x,g=m.y+m.height,_=l.cssToDevicePixels([r+a,i+o],!0),v=_.x+_.width,y=_.y,b={x:h,y,width:v-h,height:g-y},x=yf(this._drawAndSample({layers:f,views:t,viewports:n,onViewportActive:u,deviceRect:b,cullRect:{x:r,y:i,width:a,height:o},effects:d,pass:`picking:${s}`,canvasContext:l})),S=new Map,C=[],w=Number.isFinite(c);for(let e=0;e<x.length&&!(w&&C.length>=c);e++){let t=x[e],n={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:i,pixelRatio:p};n=Sf({layer:t.pickedLayer,info:n,mode:s});let a=n.layer.id;S.has(a)||S.set(a,new Set);let o=S.get(a),c=n.object??n.index;o.has(c)||(o.add(c),C.push(n))}return C}async _drawAndSampleAsync({layers:e,views:t,viewports:n,onViewportActive:r,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c},l=!1){let u=l?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:r,pickingFBO:u,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c,pickZ:l,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(d.preRenderStats[e.id]=e.preRender(d));let{decodePickingColor:f,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:h,width:g,height:_}=i,v=u.colorAttachments[0]?.texture;if(!v)throw Error(`Picking framebuffer color attachment is missing`);let y=await this._readTextureDataAsync(v,{x:m,y:h,width:g,height:_},l?Float32Array:Uint8Array);if(!l){let e=!1;for(let t=3;t<y.length;t+=4)if(y[t]!==0){e=!0;break}!e&&y.length>0&&N.warn(`Async pick readback returned only zero alpha values`,{deviceRect:i,bytes:Array.from(y.subarray(0,Math.min(y.length,16)))})()}return{pickedColors:y,decodePickingColor:f}}async _readTextureDataAsync(e,t,n){let{width:r,height:a}=t,o=e.computeMemoryLayout(t),s=this.device.createBuffer({byteLength:o.byteLength,usage:i.COPY_DST|i.MAP_READ});try{let i=this.device.type===`webgpu`?{...t,y:e.height-t.y-a}:t;e.readBuffer(i,s);let c=await s.readAsync(0,o.byteLength),l=n.BYTES_PER_ELEMENT;if(o.bytesPerRow%l!==0)throw Error(`Texture readback row stride ${o.bytesPerRow} is not aligned to ${l}-byte elements.`);let u=new n(c.buffer,c.byteOffset,o.byteLength/l),d=r*4,f=o.bytesPerRow/l;if(f<d)throw Error(`Texture readback row stride ${f} is smaller than packed row length ${d}.`);let p=new n(r*a*4);for(let e=0;e<a;e++){let t=(this.device.type===`webgpu`?a-e-1:e)*f;p.set(u.subarray(t,t+d),e*d)}return p}finally{s.destroy()}}_drawAndSample({layers:e,views:t,viewports:n,onViewportActive:r,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c},l=!1){let u=l?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:r,pickingFBO:u,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c,pickZ:l,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(d.preRenderStats[e.id]=e.preRender(d));let{decodePickingColor:f,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:h,width:g,height:_}=i,v=new(l?Float32Array:Uint8Array)(g*_*4);return this.device.readPixelsToArrayWebGL(u,{sourceX:m,sourceY:h,sourceWidth:g,sourceHeight:_,target:v}),{pickedColors:v,decodePickingColor:f}}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get(`Layers picked`).addCount(t)}_getDepthLayers(e,t,n){if(!n||!this.depthFBO)return[];let{pickedLayer:r}=e,i=r?.state?.terrainDrawMode===`drape`;return r&&!i?[r]:t.filter(e=>e.props.operation.includes(`terrain`))}_getPickingRect({deviceX:e,deviceY:t,deviceRadius:n,deviceWidth:r,deviceHeight:i}){let a=Math.max(0,e-n),o=Math.max(0,t-n),s=Math.min(r,e+n+1)-a,c=Math.min(i,t+n+1)-o;return s<=0||c<=0?null:{x:a,y:o,width:s,height:c}}},Tf={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},Ef=`top-left`,Df=`root`,Of=class{constructor({deck:e,parentElement:t}){this.defaultWidgets=[],this.widgets=[],this.resolvedWidgets=[],this.containers={},this.lastViewports={},this.deck=e,t?.classList.add(`deck-widget-container`),this.parentElement=t}getWidgets(){return this.resolvedWidgets}setProps(e){if(e.widgets&&!G(e.widgets,this.widgets,1)){let t=e.widgets.filter(Boolean);this._setWidgets(t)}}finalize(){for(let e of this.getWidgets())this._removeWidget(e);this.defaultWidgets.length=0,this.resolvedWidgets.length=0;for(let e in this.containers)this.containers[e].remove()}addDefault(e){this.defaultWidgets.find(t=>t.id===e.id)||(this._addWidget(e),this.defaultWidgets.push(e),this._setWidgets(this.widgets))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getWidgets()){let{viewId:i}=r;if(i){let e=n[i];e&&(r.onViewportChange&&r.onViewportChange(e),r.onRedraw?.({viewports:[e],layers:t}))}else{if(r.onViewportChange)for(let t of e)r.onViewportChange(t);r.onRedraw?.({viewports:e,layers:t})}}this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getWidgets()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}getCanvasBounds(e){let t=(this.deck?.getCanvas?.())?.getBoundingClientRect(),n=this.parentElement?.getBoundingClientRect(),r=this.deck?.getCanvasContext?.(e?.id);if(r&&n){r.updatePosition();let[e,t]=r.getPosition(),[i,a]=r.getCSSSize();return{x:e-n.left,y:t-n.top,width:i,height:a}}return{x:t&&n?t.left-n.left:0,y:t&&n?t.top-n.top:0,width:t?.width||this.deck?.width||0,height:t?.height||this.deck?.height||0}}onEvent(e,t){let n=Js[t.type];if(n)for(let r of this.getWidgets()){let{viewId:i}=r;(!i||i===e.viewport?.id)&&r[n]?.(e,t)}}_setWidgets(e){let t={};for(let e of this.resolvedWidgets)t[e.id]=e;this.resolvedWidgets.length=0;for(let e of this.defaultWidgets)t[e.id]=null,this.resolvedWidgets.push(e);for(let n of e){let e=t[n.id];e?e.viewId!==n.viewId||e.placement!==n.placement?(this._removeWidget(e),this._addWidget(n)):n!==e&&(e.setProps(n.props),n=e):this._addWidget(n),t[n.id]=null,this.resolvedWidgets.push(n)}for(let e in t){let n=t[e];n&&this._removeWidget(n)}this.widgets=e}_addWidget(e){let{viewId:t=null,placement:n=Ef}=e,r=e.props._container??t;e.widgetManager=this,e.deck=this.deck,e.rootElement=e._onAdd({deck:this.deck,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeWidget(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.widgetManager=void 0}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=e||Df,r=this.containers[n];r||(r=document.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,this.parentElement?.append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=globalThis.document.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,Tf[t]),r.append(i)),i}_updateContainers(){for(let e in this.containers){let t=this.lastViewports[e]||null,n=e===Df||t,r=this.containers[e];if(n){let e=this._getContainerBounds(t);r.style.display=`block`,r.style.left=`${e.x}px`,r.style.top=`${e.y}px`,r.style.width=`${e.width}px`,r.style.height=`${e.height}px`}else r.style.display=`none`}}_getContainerBounds(e){if(!e)return{x:0,y:0,width:this.parentElement?.clientWidth||this.deck.width,height:this.parentElement?.clientHeight||this.deck.height};let t=this.getCanvasBounds(e);return{x:t.x+e.x,y:t.y+e.y,width:e.width,height:e.height}}};function kf(e,t){t&&Object.entries(t).map(([t,n])=>{t.startsWith(`--`)?e.style.setProperty(t,n):e.style[t]=n})}function Af(e,t){t&&Object.keys(t).map(t=>{t.startsWith(`--`)?e.style.removeProperty(t):e.style[t]=``})}var jf=class{constructor(e){this.viewId=null,this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n=this.rootElement;n&&t.className!==e.className&&(t.className&&n.classList.remove(t.className),e.className&&n.classList.add(e.className)),n&&!G(t.style,e.style,1)&&(Af(n,t.style),kf(n,e.style)),Object.assign(this.props,e),this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}get viewIds(){return this.viewId?[this.viewId]:this.deck?.getViews().map(e=>e.id)??[]}getViewState(e){return this.deck?.viewManager?.getViewState(e)||{}}setViewState(e,t){this.deck?._onViewStateChange({viewId:e,viewState:t,interactionState:{}})}onCreateRootElement(){let e=[`deck-widget`,this.className,this.props.className],t=document.createElement(`div`);return e.filter(e=>typeof e==`string`&&e.length>0).forEach(e=>t.classList.add(e)),kf(t,this.props.style),t}_onAdd(e){return this.onAdd(e)??this.onCreateRootElement()}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};jf.defaultProps={id:`widget`,style:{},_container:null,className:``};var Mf={zIndex:`1`,position:`absolute`,pointerEvents:`none`,color:`#a0a7b4`,backgroundColor:`#29323c`,padding:`10px`,top:`0`,left:`0`,display:`none`},Nf=class extends jf{constructor(e={}){super(e),this.id=`default-tooltip`,this.placement=`fill`,this.className=`deck-tooltip`,this.isVisible=!1,this.setProps(e)}onCreateRootElement(){let e=document.createElement(`div`);return e.className=this.className,Object.assign(e.style,Mf),e}onRenderHTML(e){}onViewportChange(e){this.isVisible&&e.id===this.lastViewport?.id&&!e.equals(this.lastViewport)&&this.setTooltip(null),this.lastViewport=e}onHover(e){let{deck:t}=this,n=t&&t.props.getTooltip;if(!n)return;let r=n(e),i=this.widgetManager?.getCanvasBounds(e.viewport),a=e.x+(i?.x||0),o=e.y+(i?.y||0);this.setTooltip(r,a,o)}setTooltip(e,t,n){let r=this.rootElement;if(r){if(typeof e==`string`)r.innerText=e;else if(e)e.text&&(r.innerText=e.text),e.html&&(r.innerHTML=e.html),e.className&&(r.className=e.className);else{this.isVisible=!1,r.style.display=`none`;return}this.isVisible=!0,r.style.display=`block`,r.style.transform=`translate(${t}px, ${n}px)`,e&&typeof e==`object`&&`style`in e&&Object.assign(r.style,e.style)}}};Nf.defaultProps={...jf.defaultProps};var Pf=class{constructor(e){this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap,this._createEventManager=e.createEventManager,this._getEventRoot=e.getEventRoot}finalize(){for(let e of Object.values(this.targets))e.eventManager.destroy(),e.presentationContext.destroy();this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap}syncCanvasEntries(e){let t=this._normalizeCanvasList(e.canvases),n={},r=[],i=new Map;for(let{canvas:e}of t){let t=this._getEventRoot(e);i.set(t,(i.get(t)||0)+1)}for(let{id:a,canvas:o}of t){let t=this._getEventRoot(o),s=i.get(t)===1?t:o,c=this.targets[a];if(!c||c.device!==e.device||c.canvas!==o||c.eventRoot!==s){c?.eventManager.destroy(),c?.presentationContext.destroy();let t=e.device.createPresentationContext({id:a,canvas:o,useDevicePixels:e.useDevicePixels,autoResize:!0});c={id:a,device:e.device,canvas:o,eventRoot:s,presentationContext:t,eventManager:this._createEventManager(s)}}this._eventRootToCanvasId.set(s,a),this._eventRootToCanvasId.set(o,a),n[a]=c,r.push(a)}for(let[e,t]of Object.entries(this.targets))n[e]||(t.eventManager.destroy(),t.presentationContext.destroy());this.targets=n,this.order=r;let a=Object.fromEntries(Object.entries(n).map(([e,t])=>[e,t.eventManager]));this._haveSameEventManagers(a)||(this.eventManagers=a)}getCanvasIdFromEvent(e){return e?this._eventRootToCanvasId.get(e):void 0}getTarget(e){return this.targets[e||this.order[0]||`default-canvas`]||null}_normalizeCanvasList(e=[]){let t=new Set;return e.map((e,n)=>{let r,i;return typeof e==`string`?(r=document.getElementById(e),J(r,`Canvas with id ${e} not found`),i=e):(r=e,i=r.id||`deckgl-canvas-${n}`),J(!t.has(i),`Duplicate canvas id ${i}`),t.add(i),{id:i,canvas:r}})}_haveSameEventManagers(e){let t=Object.keys(e),n=Object.keys(this.eventManagers);return t.length===n.length&&t.every(t=>e[t]===this.eventManagers[t])}},Ff={WEBGL_depth_texture:{UNSIGNED_INT_24_8_WEBGL:y.UNSIGNED_INT_24_8},OES_element_index_uint:{},OES_texture_float:{},OES_texture_half_float:{HALF_FLOAT_OES:y.HALF_FLOAT},EXT_color_buffer_float:{},OES_standard_derivatives:{FRAGMENT_SHADER_DERIVATIVE_HINT_OES:y.FRAGMENT_SHADER_DERIVATIVE_HINT},EXT_frag_depth:{},EXT_blend_minmax:{MIN_EXT:y.MIN,MAX_EXT:y.MAX},EXT_shader_texture_lod:{}},If=e=>({drawBuffersWEBGL(t){return e.drawBuffers(t)},COLOR_ATTACHMENT0_WEBGL:y.COLOR_ATTACHMENT0,COLOR_ATTACHMENT1_WEBGL:y.COLOR_ATTACHMENT1,COLOR_ATTACHMENT2_WEBGL:y.COLOR_ATTACHMENT2,COLOR_ATTACHMENT3_WEBGL:y.COLOR_ATTACHMENT3}),Lf=e=>({VERTEX_ARRAY_BINDING_OES:y.VERTEX_ARRAY_BINDING,createVertexArrayOES(){return e.createVertexArray()},deleteVertexArrayOES(t){return e.deleteVertexArray(t)},isVertexArrayOES(t){return e.isVertexArray(t)},bindVertexArrayOES(t){return e.bindVertexArray(t)}}),Rf=e=>({VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE:35070,drawArraysInstancedANGLE(...t){return e.drawArraysInstanced(...t)},drawElementsInstancedANGLE(...t){return e.drawElementsInstanced(...t)},vertexAttribDivisorANGLE(...t){return e.vertexAttribDivisor(...t)}});function zf(e=!0){let t=HTMLCanvasElement.prototype;if(!e&&t.originalGetContext){t.getContext=t.originalGetContext,t.originalGetContext=void 0;return}t.originalGetContext=t.getContext,t.getContext=function(e,t){if(e===`webgl`||e===`experimental-webgl`){let e=this.originalGetContext(`webgl2`,t);return e instanceof HTMLElement&&Bf(e),e}return this.originalGetContext(e,t)}}function Bf(e){e.getExtension(`EXT_color_buffer_float`);let t={...Ff,WEBGL_disjoint_timer_query:e.getExtension(`EXT_disjoint_timer_query_webgl2`),WEBGL_draw_buffers:If(e),OES_vertex_array_object:Lf(e),ANGLE_instanced_arrays:Rf(e)},n=e.getExtension.bind(e);e.getExtension=function(e){return n(e)||(e in t?t[e]:null)};let r=e.getSupportedExtensions;e.getSupportedExtensions=function(){return(r.apply(e)||[])?.concat(Object.keys(t))}}var Vf=`modulepreload`,Hf=function(e){return`/next/standalone-examples/soft-shadows/`+e},Uf={},Wf=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=Hf(t,n),t in Uf)return;Uf[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:Vf,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Gf=1,Kf=class extends qr{type=`webgl`;enforceWebGL2(e){zf(e)}isSupported(){return typeof WebGL2RenderingContext<`u`}isDeviceHandle(t){return typeof WebGL2RenderingContext<`u`&&t instanceof WebGL2RenderingContext?!0:(typeof WebGLRenderingContext<`u`&&t instanceof WebGLRenderingContext&&e.warn(`WebGL1 is not supported`,t)(),!1)}async attach(e,t={}){let{WebGLDevice:n}=await Wf(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-CKEDq0FY.js`);return{WebGLDevice:e}},__vite__mapDeps([0,1,2,3,4,5,6]));if(e instanceof n)return e;let r=n.getDeviceFromContext(e);if(r)return r;if(!qf(e))throw Error(`Invalid WebGL2RenderingContext`);t=Yf(t),await Xf(t);let i=t.createCanvasContext===!0?{}:t.createCanvasContext;return new n({...t,_handle:e,createCanvasContext:{canvas:e.canvas,autoResize:!1,...i}})}async create(t={}){let{WebGLDevice:n}=await Wf(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-CKEDq0FY.js`);return{WebGLDevice:e}},__vite__mapDeps([0,1,2,3,4,5,6]));t=Yf(t),await Xf(t);try{let r=new n(t);e.groupCollapsed(Gf,`WebGLDevice ${r.id} created`)();let i=`\
${r._reused?`Reusing`:`Created`} device with WebGL2 ${r.props.debug?`debug `:``}context: \
${r.info.vendor}, ${r.info.renderer} for canvas: ${r.canvasContext.id}`;return e.probe(Gf,i)(),e.table(Gf,r.info)(),r}finally{e.groupEnd(Gf)(),e.info(Gf,`%cWebGL call tracing: luma.log.set('debug-webgl') `,`color: white; background: blue; padding: 2px 6px; border-radius: 3px;`)()}}};function qf(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:!!(e&&typeof e.createVertexArray==`function`)}var Jf=new Kf;function Yf(t){return{...t,debug:t.debug??l.defaultProps.debug,debugWebGL:t.debugWebGL??l.defaultProps.debugWebGL,debugSpectorJS:t.debugSpectorJS??!!e.get(`debug-spectorjs`)}}async function Xf(t){let n=[];(t.debugWebGL||t.debug)&&n.push(x()),t.debugSpectorJS&&n.push(b(t));let r=await Promise.allSettled(n);for(let t of r)t.status===`rejected`&&e.error(`Failed to initialize debug libraries ${t.reason}`)()}function Zf(){}var Qf={id:``,width:`100%`,height:`100%`,style:null,viewState:null,initialViewState:null,pickingRadius:0,pickAsync:`auto`,layerFilter:null,parameters:{},parent:null,device:null,deviceProps:{},gl:null,canvas:null,_canvases:null,layers:[],effects:[],views:null,controller:null,useDevicePixels:!0,touchAction:`none`,eventRecognizerOptions:{},_framebuffer:null,_animate:!1,_pickable:!0,_typedArrayManagerProps:{},_customRender:null,widgets:[],onDeviceInitialized:Zf,onWebGLInitialized:Zf,onResize:Zf,onViewStateChange:Zf,onInteractionStateChange:Zf,onBeforeRender:Zf,onAfterRender:Zf,onLoad:Zf,onError:e=>N.error(e.message,e.cause)(),onHover:null,onClick:null,onDragStart:null,onDrag:null,onDragEnd:null,_onMetrics:null,getCursor:({isDragging:e})=>e?`grabbing`:`grab`,getTooltip:null,debug:!1,drawPickingColors:!1},$f=class{constructor(e){this.width=0,this.height=0,this.userData={},this.device=null,this.canvas=null,this.viewManager=null,this.layerManager=null,this.effectManager=null,this.deckRenderer=null,this.deckPicker=null,this.eventManager=null,this.eventManagers={},this.widgetManager=null,this.tooltip=null,this.animationLoop=null,this._canvasContext=null,this._deviceResizeHandler=null,this.cursorState={isHovering:!1,isDragging:!1},this.stats=new o({id:`deck.gl`}),this.metrics={fps:0,setPropsTime:0,layersCount:0,drawLayersCount:0,updateLayersCount:0,updateAttributesCount:0,updateAttributesTime:0,framesRedrawn:0,pickTime:0,pickCount:0,pickLayersCount:0,gpuTime:0,gpuTimePerFrame:0,cpuTime:0,cpuTimePerFrame:0,bufferMemory:0,textureMemory:0,renderbufferMemory:0,gpuMemory:0},this._metricsCounter=0,this._hoverPickSequence=0,this._pointerDownPickSequence=0,this._needsRedraw=`Initial render`,this._canvasManager=new Pf({createEventManager:e=>this._createEventManager(e),getEventRoot:e=>this._getEventRoot(e)}),this._ownedCanvas=null,this._pickRequest={mode:`hover`,x:-1,y:-1,radius:0,canvasId:void 0,event:null,unproject3D:!1},this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this._onPointerMove=e=>{let{_pickRequest:t}=this,n=this._getCanvasIdFromEvent(e);if(e.type===`pointerleave`)t.x=-1,t.y=-1,t.radius=0,t.canvasId=n;else if(e.leftButton||e.rightButton)return;else{let r=e.offsetCenter;if(!r)return;t.x=r.x,t.y=r.y,t.radius=this.props.pickingRadius,t.canvasId=n}this.layerManager&&(this.layerManager.context.mousePosition={x:t.x,y:t.y}),t.event=e},this._onEvent=e=>{let t=Js[e.type],n=e.offsetCenter,r=this._getCanvasIdFromEvent(e);if(!t||!n||!this.layerManager)return;let i=this.layerManager.getLayers(),a=this._getInternalPickingMode();if(a){if(a===`sync`){let t=e.type===`click`&&this._shouldUnproject3D(i)?this._getFirstPickedInfo(this._pickPointSync(this._getPointPickOptions(n.x,n.y,{unproject3D:!0,canvasId:r},i))):this._getLastPointerDownPickingInfo(n.x,n.y,r,i);this._dispatchPickingEvent(t,e);return}(this._lastPointerDownInfoPromise||Promise.resolve(this._getLastPointerDownPickingInfo(n.x,n.y,r,i))).then(t=>{this._dispatchPickingEvent(t,e)}).catch(e=>this.props.onError?.(e))}},this._onPointerDown=e=>{let t=e.offsetCenter,n=this._getCanvasIdFromEvent(e);if(!t)return;let r=this._getInternalPickingMode();if(!r)return;let i=this.layerManager?.getLayers()||[],a=++this._pointerDownPickSequence;if(r===`sync`){let e=this._pickPointSync({x:t.x,y:t.y,canvasId:n,radius:this.props.pickingRadius}),r=this._getFirstPickedInfo(e);this._lastPointerDownInfo=r,this._lastPointerDownInfoPromise=Promise.resolve(r);return}let o=this._pickPointAsync(this._getPointPickOptions(t.x,t.y,{canvasId:n},i)).then(e=>this._getFirstPickedInfo(e)).then(e=>(a===this._pointerDownPickSequence&&(this._lastPointerDownInfo=e),e)).catch(e=>{this.props.onError?.(e);let r=this.deckPicker&&this.viewManager?this._getLastPointerDownPickingInfo(t.x,t.y,n,i):{};return a===this._pointerDownPickSequence&&(this._lastPointerDownInfo=r),r});this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=o};let t=e;this.props={...Qf,...e},e=this.props,this._validateCanvasConfiguration(e),e.viewState&&e.initialViewState&&N.warn("View state tracking is disabled. Use either `initialViewState` for auto update or `viewState` for manual update.")(),this.viewState=this.props.initialViewState,e.device&&(this.device=e.device,this._setDeviceCanvasContext(e.device));let n=this.device;!n&&e.gl&&(e.gl instanceof WebGLRenderingContext&&N.error(`WebGL1 context not supported.`)(),n=Jf.attach(e.gl,{_cacheShaders:!0,_cachePipelines:!0,...this.props.deviceProps})),n||=this._createDevice(e),this.animationLoop=this._createAnimationLoop(n,e),this.setProps(t),e._typedArrayManagerProps&&zl.setOptions(e._typedArrayManagerProps),this.animationLoop.start()}finalize(){this._restoreDeviceResizeHandler(),this.animationLoop?.stop(),this.animationLoop?.destroy(),this.animationLoop=null,this._hoverPickSequence++,this._pointerDownPickSequence++,this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this.layerManager?.finalize(),this.layerManager=null,this.viewManager?.finalize(),this.viewManager=null,this.effectManager?.finalize(),this.effectManager=null,this.deckRenderer?.finalize(),this.deckRenderer=null,this.deckPicker?.finalize(),this.deckPicker=null,Object.keys(this._canvasManager.targets).length||this.eventManager?.destroy(),this.eventManager=null,this.eventManagers={},this.widgetManager?.finalize(),this.widgetManager=null,this._canvasManager.finalize(),this._isMultiCanvasMode()?this.canvas=null:this.canvas&&this.canvas===this._ownedCanvas&&(this.canvas.parentElement?.removeChild(this.canvas),this.canvas=null,this._ownedCanvas=null),this._canvasContext=null}setProps(e){this.stats.get(`setProps Time`).timeStart(),`onLayerHover`in e&&N.removed(`onLayerHover`,`onHover`)(),`onLayerClick`in e&&N.removed(`onLayerClick`,`onClick`)(),e.initialViewState&&!G(this.props.initialViewState,e.initialViewState,3)&&(this.viewState=e.initialViewState),J(!(`_canvases`in e)||Array.isArray(e._canvases)===this._isMultiCanvasMode()),Object.assign(this.props,e),this._validateCanvasConfiguration(this.props),this._validateInternalPickingMode(),this.device&&this._isMultiCanvasMode()&&this._syncCanvasTargets(),this._setCanvasSize(this.props);let t=Object.create(this.props);if(Object.assign(t,{views:this._getViews(),width:this.width,height:this.height,viewState:this._getViewState(),eventManagers:this.eventManagers}),e.device&&e.device.id!==this.device?.id){let t=e.device.getDefaultCanvasContext();this.animationLoop?.stop(),!this._isMultiCanvasMode()&&this.canvas!==t.canvas&&(this.canvas?.remove(),this.eventManager?.destroy(),this.canvas=null),this._setDeviceCanvasContext(e.device),N.log(`recreating animation loop for new device! id=${e.device.id}`)(),this.animationLoop=this._createAnimationLoop(e.device,e),this.animationLoop.start()}if(this.animationLoop?.setProps(t),e.useDevicePixels!==void 0&&this._canvasContext?.setProps){this._canvasContext.setProps({useDevicePixels:e.useDevicePixels});for(let t of Object.values(this._canvasManager.targets))t.presentationContext.setProps({useDevicePixels:e.useDevicePixels})}this.layerManager&&(this.viewManager.setProps(t),this.layerManager.activateViewport(this.getViewports()[0]),this.layerManager.setProps(t),this.effectManager.setProps(t),this.deckRenderer.setProps(t),this.deckPicker.setProps(t),this.widgetManager.setProps(t)),this.stats.get(`setProps Time`).timeEnd()}needsRedraw(e={clearRedrawFlags:!1}){if(!this.layerManager)return!1;if(this.props._animate)return`Deck._animate`;let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);let n=this.viewManager.needsRedraw(e),r=this.layerManager.needsRedraw(e),i=this.effectManager.needsRedraw(e),a=this.deckRenderer.needsRedraw(e);return t=t||n||r||i||a,t}redraw(e){if(!this.layerManager)return;let t=this.needsRedraw({clearRedrawFlags:!0});t=e||t,t&&(this.stats.get(`Redraw Count`).incrementCount(),this.props._customRender?this.props._customRender(t):this._drawLayers(t))}get isInitialized(){return this.viewManager!==null}getViews(){return J(this.viewManager),this.viewManager.views}getView(e){return J(this.viewManager),this.viewManager.getView(e)}getViewports(e){return J(this.viewManager),this.viewManager.getViewports(e)}getCanvas(){return this.canvas}getCanvasContext(e){let t=e?this.viewManager?.getView(e)?.props.canvasId:void 0;return this._getCanvasContext(t)}getEventManager(e){if(!e||!this.viewManager)return this.eventManager;let t=this.viewManager.getCanvasId(e)||`default-canvas`;return this.eventManagers[t]||this.eventManager}async pickObjectAsync(e){let t=(await this._pickAsync(`pickObjectAsync`,`pickObject Time`,e)).result;return t.length?t[0]:null}async pickObjectsAsync(e){return await this._pickAsync(`pickObjectsAsync`,`pickObjects Time`,e)}pickObject(e){let t=this._pick(`pickObject`,`pickObject Time`,e).result;return t.length?t[0]:null}pickMultipleObjects(e){return e.depth=e.depth||10,this._pick(`pickObject`,`pickMultipleObjects Time`,e).result}pickObjects(e){return this._pick(`pickObjects`,`pickObjects Time`,e)}_pickPositionForController(e,t,n){return this._getInternalPickingMode()===`sync`?this.pickObject({x:e,y:t,radius:0,unproject3D:!0,canvasId:n?this.viewManager?.getCanvasId(n):void 0}):null}_addResources(e,t=!1){for(let n in e)this.layerManager.resourceManager.add({resourceId:n,data:e[n],forceUpdate:t})}_removeResources(e){for(let t of e)this.layerManager.resourceManager.remove(t)}_addDefaultEffect(e){this.effectManager.addDefaultEffect(e)}_addDefaultShaderModule(e){this.layerManager.addDefaultShaderModule(e)}_removeDefaultShaderModule(e){this.layerManager?.removeDefaultShaderModule(e)}_resolveInternalPickingMode(){let{pickAsync:e}=this.props,t=this.device?.type||this.props.deviceProps?.type;if(e===`auto`)return t===`webgpu`?`async`:`sync`;if(e===`sync`&&t===`webgpu`)throw Error('`pickAsync: "sync"` is not supported when Deck is using a WebGPU device.');return e}_getInternalPickingMode(){try{return this._resolveInternalPickingMode()}catch(e){return this.props.onError?.(e),null}}_validateInternalPickingMode(){this._getInternalPickingMode()}_getFirstPickedInfo({result:e,emptyInfo:t}){return e[0]||t}_shouldUnproject3D(e=this.layerManager?.getLayers()||[]){return e.some(e=>e.props.pickable===`3d`)}_getPointPickOptions(e,t,n={},r=this.layerManager?.getLayers()||[]){return{x:e,y:t,canvasId:n.canvasId,radius:this.props.pickingRadius,unproject3D:this._shouldUnproject3D(r),...n}}_pickPointSync(e){return this._pick(`pickObject`,`pickObject Time`,e)}_pickPointAsync(e){return this._pickAsync(`pickObjectAsync`,`pickObject Time`,e)}_getLastPointerDownPickingInfo(e,t,n,r=this.layerManager?.getLayers()||[]){return this.deckPicker.getLastPickedObject({x:e,y:t,layers:r,viewports:this.getViewports({x:e,y:t,canvasId:n})},this._lastPointerDownInfo)}_applyHoverCallbacks({result:e,emptyInfo:t},n){if(!this.widgetManager)return;this.cursorState.isHovering=e.length>0;let r=t,i=!1;for(let t of e)r=t,i=t.layer?.onHover(t,n)||i;i||(this.props.onHover?.(r,n),this.widgetManager.onHover(r,n))}_dispatchPickingEvent(e,t){if(!this.layerManager||!this.widgetManager)return;let n=Js[t.type];if(!n)return;let{layer:r}=e,i=r&&(r[n]||r.props[n]),a=this.props[n],o=!1;i&&(o=i.call(r,e,t)),o||(a?.(e,t),this.widgetManager.onEvent(e,t))}_pickAsync(e,t,n){J(this.deckPicker);let{stats:r}=this,i=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,a=this._getCanvasContext(i)||void 0;r.get(`Pick Count`).incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(i);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:i}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:i,canvasContext:a});return r.get(t).timeEnd(),o}_pick(e,t,n){J(this.deckPicker);let{stats:r}=this,i=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,a=this._getCanvasContext(i)||void 0;r.get(`Pick Count`).incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(i);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:i}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:i,canvasContext:a});return r.get(t).timeEnd(),o}_createCanvas(e){let t=e.canvas;return typeof t==`string`&&(t=document.getElementById(t),J(t)),t?this._ownedCanvas=null:(t=document.createElement(`canvas`),t.id=e.id||`deckgl-overlay`,e.width&&typeof e.width==`number`&&(t.width=e.width),e.height&&typeof e.height==`number`&&(t.height=e.height),(e.parent||document.body).appendChild(t),this._ownedCanvas=t),Object.assign(t.style,e.style),t}_isMultiCanvasMode(){return Array.isArray(this.props._canvases)}_getDefaultCanvasId(){return this._canvasManager.order[0]||`default-canvas`}_validateCanvasConfiguration(e){Array.isArray(e._canvases)&&(J(!e.canvas),J(!e.gl),J(!e.device?.canvasContext||e.device.getDefaultCanvasContext().offscreenCanvas))}_createEventManager(e){let t=new Gs(e,{touchAction:this.props.touchAction,recognizers:Object.keys(Ys).map(e=>{let[t,n,r,i]=Ys[e],a=this.props.eventRecognizerOptions?.[e];return{recognizer:new t({...n,...a,event:e}),recognizeWith:r,requireFailure:i}}),events:{pointerdown:this._onPointerDown,pointermove:this._onPointerMove,pointerleave:this._onPointerMove}});for(let e in Js)e===`dblclick`?t.watch(e,this._onEvent):t.on(e,this._onEvent);return t}_getEventRoot(e){return e.closest(`.deck-events-root`)||this.props.parent?.querySelector(`.deck-events-root`)||e}_syncCanvasTargets(){if(!this.device||!this._isMultiCanvasMode())return;this._canvasManager.syncCanvasEntries({device:this.device,canvases:this.props._canvases||[],useDevicePixels:this.props.useDevicePixels}),this.eventManagers=this._canvasManager.eventManagers;let e=this._getDefaultCanvasId();this.eventManager=this.eventManagers[e]||null,this.canvas=this._canvasManager.targets[e]?.canvas||null}_setCanvasContext(e){this._canvasContext=e,`style`in e.canvas&&(this.canvas=e.canvas)}_setDeviceCanvasContext(e,t={}){let n=e.getDefaultCanvasContext();this._setCanvasContext(n),this._setDeviceResizeHandler(e,t)}_setDeviceResizeHandler(e,t={}){let n=!!t.syncDrawingBuffer;if(this._deviceResizeHandler?.device===e){this._deviceResizeHandler.syncDrawingBuffer=n;return}this._restoreDeviceResizeHandler();let r=e=>{this._isMultiCanvasMode()?this._updateMultiCanvasDimensions():e===this._canvasContext&&this._canvasContext&&this._onCanvasContextResize(this._canvasContext,{syncDrawingBuffer:this._deviceResizeHandler?.syncDrawingBuffer})};e.props.onResize=r,this._deviceResizeHandler={device:e,onResize:r,syncDrawingBuffer:n}}_restoreDeviceResizeHandler(){let e=this._deviceResizeHandler;e&&e.device.props?.onResize===e.onResize&&(e.device.props.onResize=Zf),this._deviceResizeHandler=null}_setCanvasSize(e){if(this._isMultiCanvasMode()||!this.canvas)return;let{width:t,height:n}=e;if(t||t===0){let e=Number.isFinite(t)?`${t}px`:t;this.canvas.style.width=e}if(n||n===0){let t=Number.isFinite(n)?`${n}px`:n;this.canvas.style.position=e.style?.position||`absolute`,this.canvas.style.height=t}}_getCanvasIdFromEvent(e){return this._canvasManager.getCanvasIdFromEvent(e?.rootElement)}_getCanvasContext(e){return this._canvasManager.getTarget(e)?.presentationContext||this._canvasContext}_resizeForCanvasTarget(e){let t=this._canvasManager.getTarget(e);if(!t||!this.device?.canvasContext)return;let[n,r]=t.presentationContext.getDrawingBufferSize();this.device.canvasContext.setDrawingBufferSize(n,r)}_createDeviceCanvas(e){if(this._isMultiCanvasMode()){let t=globalThis.OffscreenCanvas;if(!t)throw Error("`_canvases` requires OffscreenCanvas support.");return new t(typeof e.width==`number`&&Number.isFinite(e.width)?e.width:1,typeof e.height==`number`&&Number.isFinite(e.height)?e.height:1)}return this._createCanvas(e)}_updateCanvasSize(e=this._canvasContext){if(this._isMultiCanvasMode()){this._updateMultiCanvasDimensions();return}let{canvas:t}=this,[n,r]=e?e.getCSSSize():[t?.clientWidth??t?.width??0,t?.clientHeight??t?.height??0];(n!==this.width||r!==this.height)&&(this.width=n,this.height=r,this.viewManager?.setProps({width:n,height:r}),this.layerManager?.activateViewport(this.getViewports()[0]),this.props.onResize({width:n,height:r},e||void 0))}_onCanvasContextResize(e,t={}){if(t.syncDrawingBuffer){let{width:t,height:n}=e.canvas;e.setDrawingBufferSize(t,n)}this._needsRedraw=`Canvas resized`,this._updateCanvasSize(e)}_updateMultiCanvasDimensions(){let[e,t]=this._getCanvasContext()?.getCSSSize()||[0,0];(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.props.onResize({width:e,height:t})),this._needsRedraw=`Canvas resized`,this.viewManager?.setNeedsUpdate(`Canvas resized`),this.viewManager?.setProps({width:this.width,height:this.height})}_createAnimationLoop(e,t){let{gl:n,onError:r}=t;return new Qu({device:e,autoResizeDrawingBuffer:!n&&!Array.isArray(t._canvases),autoResizeViewport:!1,onInitialize:e=>this._setDevice(e.device),onRender:this._onRenderFrame.bind(this),onError:r})}_createDevice(e){let t=this.props.deviceProps?.createCanvasContext,n=typeof t==`object`?t:void 0,r={adapters:[],_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps};r.adapters.includes(Jf)||r.adapters.push(Jf);let i={alphaMode:this.props.deviceProps?.type===`webgpu`?`premultiplied`:void 0};return Kr.createDevice({_reuseDevices:!0,type:`webgl`,...r,createCanvasContext:{...i,...n,canvas:this._createDeviceCanvas(e),useDevicePixels:this.props.useDevicePixels,autoResize:!0}})}_getViewState(){return this.props.viewState||this.viewState}_getViews(){let{views:e}=this.props,t=Array.isArray(e)?e:e?[e]:[new uf({id:`default-view`})];return t.length&&this.props.controller&&(t[0]=t[0].clone({controller:this.props.controller})),t}_onContextLost(){let{onError:e}=this.props;this.animationLoop&&e&&e(Error(`WebGL context is lost`))}_pickAndCallback(){let{_pickRequest:e}=this;if(e.event){let t=e.event,n=this.layerManager?.getLayers()||[],r=this._getPointPickOptions(e.x,e.y,{canvasId:e.canvasId,radius:e.radius,mode:e.mode},n),i=this._getInternalPickingMode(),a=++this._hoverPickSequence;if(e.event=null,e.canvasId=void 0,!i)return;if(i===`sync`){this._applyHoverCallbacks(this._pickPointSync(r),t);return}this._pickPointAsync(r).then(({result:e,emptyInfo:n})=>{a===this._hoverPickSequence&&this._applyHoverCallbacks({result:e,emptyInfo:n},t)}).catch(e=>this.props.onError?.(e))}}_updateCursor(){let e=this.props.getCursor(this.cursorState);if(this._isMultiCanvasMode()){for(let t of Object.values(this._canvasManager.targets))t.canvas.style.cursor=e;return}let t=this.props.parent||this.canvas;t&&(t.style.cursor=e)}_setDevice(e){if(this.device=e,this._validateInternalPickingMode(),!this.animationLoop)return;this._setDeviceCanvasContext(e,{syncDrawingBuffer:!!(this.props.gl&&this.props.device!==e)}),this._isMultiCanvasMode()?this._syncCanvasTargets():this.canvas&&!this.canvas.isConnected&&this.props.parent&&this.props.parent.insertBefore(this.canvas,this.props.parent.firstChild),this.device.type===`webgl`&&this.device.setParametersWebGL({blend:!0,blendFunc:[770,771,1,771],polygonOffsetFill:!0,depthTest:!0,depthFunc:515}),this.props.onDeviceInitialized(this.device),this.device.type===`webgl`&&this.props.onWebGLInitialized(this.device.gl);let t=new Ku;if(t.play(),this.animationLoop.attachTimeline(t),!this._isMultiCanvasMode()){let e=this.canvas&&this._getEventRoot(this.canvas);J(e),this.eventManager=this._createEventManager(e),this.eventManagers={[vd]:this.eventManager}}this.viewManager=new yd({timeline:t,eventManager:this.eventManager,eventManagers:this.eventManagers,getCanvasContext:this._isMultiCanvasMode()?this.getCanvasContext.bind(this):void 0,onViewStateChange:this._onViewStateChange.bind(this),onInteractionStateChange:this._onInteractionStateChange.bind(this),pickPosition:this._pickPositionForController.bind(this),views:this._getViews(),viewState:this._getViewState(),width:this.width,height:this.height});let n=this.viewManager.getViewports()[0];this.layerManager=new _d(this.device,{deck:this,stats:this.stats,viewport:n,timeline:t}),this.effectManager=new pf({deck:this,device:this.device}),this.deckRenderer=new gf(this.device,{stats:this.stats}),this.deckPicker=new wf(this.device,{stats:this.stats});let r=this.props.parent?.querySelector(`.deck-widgets-root`)||(this._isMultiCanvasMode()?this.props.parent||this.canvas?.parentElement:null)||this.canvas?.parentElement;this.widgetManager=new Of({deck:this,parentElement:r}),this.widgetManager.addDefault(new Nf),this.setProps({}),this._updateCanvasSize(this._canvasContext),this.props.onLoad()}_drawLayers(e,t){let{device:n,gl:r}=this.layerManager.context;this.props.onBeforeRender({device:n,gl:r});let i={target:this.props._framebuffer,layers:this.layerManager.getLayers(),viewports:this.viewManager.getViewports(),onViewportActive:this.layerManager.activateViewport,views:this.viewManager.getViews(),pass:`screen`,effects:this.effectManager.getEffects(),...t};if(this._isMultiCanvasMode()&&i.pass===`screen`&&!i.target&&this._canvasManager.order.length)for(let e of this._canvasManager.order){let t=i.viewports.filter(t=>this.viewManager.getCanvasId(t.id)===e);if(!t.length){let t=this._canvasManager.targets[e];this._resizeForCanvasTarget(e),this.deckRenderer?.renderLayers({...i,canvasContext:t.presentationContext,target:t.presentationContext.getCurrentFramebuffer(),viewports:[],clearCanvas:!0}),t.presentationContext.present();continue}let n=this._canvasManager.targets[e];this._resizeForCanvasTarget(e);let r=n.presentationContext.getCurrentFramebuffer();this.deckRenderer?.renderLayers({...i,canvasContext:n.presentationContext,target:r,viewports:t}),n.presentationContext.present()}else this.deckRenderer?.renderLayers(i);i.pass===`screen`&&this.widgetManager.onRedraw({viewports:i.viewports,layers:i.layers}),this.props.onAfterRender({device:n,gl:r})}_onRenderFrame(){this._getFrameStats(),this._metricsCounter++%60==0&&(this._getMetrics(),this.stats.reset(),N.table(4,this.metrics)(),this.props._onMetrics&&this.props._onMetrics(this.metrics)),this._updateCursor(),this.layerManager.updateLayers(),this._pickAndCallback(),this.redraw(),this.viewManager&&this.viewManager.updateViewStates()}_onViewStateChange(e){let t=this.props.onViewStateChange(e)||e.viewState;this.viewState&&(this.viewState={...this.viewState,[e.viewId]:t},this.props.viewState||this.viewManager&&this.viewManager.setProps({viewState:this.viewState}))}_onInteractionStateChange(e){this.cursorState.isDragging=e.isDragging||!1,this.props.onInteractionStateChange(e)}_getFrameStats(){let{stats:e}=this;e.get(`frameRate`).timeEnd(),e.get(`frameRate`).timeStart();let t=this.animationLoop.stats;e.get(`GPU Time`).addTime(t.get(`GPU Time`).lastTiming),e.get(`CPU Time`).addTime(t.get(`CPU Time`).lastTiming)}_getMetrics(){let{metrics:e,stats:t}=this;e.fps=t.get(`frameRate`).getHz(),e.setPropsTime=t.get(`setProps Time`).time,e.updateAttributesTime=t.get(`Update Attributes`).time,e.framesRedrawn=t.get(`Redraw Count`).count,e.pickTime=t.get(`pickObject Time`).time+t.get(`pickMultipleObjects Time`).time+t.get(`pickObjects Time`).time,e.pickCount=t.get(`Pick Count`).count,e.layersCount=this.layerManager?.layers.length??0,e.drawLayersCount=t.get(`Layers rendered`).lastSampleCount,e.pickLayersCount=t.get(`Layers picked`).lastSampleCount,e.updateLayersCount=t.get(`Layer updates`).count,e.updateAttributesCount=t.get(`Attributes updated`).count,e.gpuTime=t.get(`GPU Time`).time,e.cpuTime=t.get(`CPU Time`).time,e.gpuTimePerFrame=t.get(`GPU Time`).getAverageTime(),e.cpuTimePerFrame=t.get(`CPU Time`).getAverageTime();let n=Kr.stats.get(`GPU Time and Memory`);e.bufferMemory=n.get(`Buffer Memory`).count,e.textureMemory=n.get(`Texture Memory`).count,e.renderbufferMemory=n.get(`Renderbuffer Memory`).count,e.gpuMemory=n.get(`GPU Memory`).count}};$f.defaultProps=Qf,$f.VERSION=Ur;function ep(e){switch(e){case`float64`:return Float64Array;case`uint8`:case`unorm8`:return Uint8ClampedArray;default:return n(e)}}var tp=r.getDataType.bind(r);function np(e,t,n){if(t.size>4)return null;let r=n===`webgpu`&&t.type===`uint8`?`unorm8`:t.type,i=t.size,a=!!(n!==`webgpu`&&i===3&&r&&[`uint8`,`sint8`,`unorm8`,`snorm8`,`uint16`,`sint16`,`unorm16`,`snorm16`].includes(r));return{attribute:e,format:i>1?`${r}x${i}${a?`-webgl`:``}`:t.type,byteOffset:t.offset||0}}function rp(e){return e.stride||e.size*e.bytesPerElement}function ip(e,t){return e.type===t.type&&e.size===t.size&&rp(e)===rp(t)&&(e.offset||0)===(t.offset||0)}function ap(e,t){t.offset&&N.removed(`shaderAttribute.offset`,`vertexOffset, elementOffset`)();let n=rp(e),r=t.vertexOffset===void 0?e.vertexOffset||0:t.vertexOffset,i=t.elementOffset||0,a=r*n+i*e.bytesPerElement+(e.offset||0);return{...t,offset:a,stride:n}}function op(e,t){let n=ap(e,t);return{high:n,low:{...n,offset:n.offset+e.size*4}}}var sp=class{constructor(e,t,n){this._buffer=null,this.device=e,this.id=t.id||``,this.size=t.size||1;let r=t.logicalType||t.type,i=r===`float64`,{defaultValue:a}=t;a=Number.isFinite(a)?[a]:a||Array(this.size).fill(0);let o;o=i?`float32`:!r&&t.isIndexed?`uint32`:r||`float32`;let s=ep(r||o);this.doublePrecision=i,i&&t.fp64===!1&&(s=Float32Array),this.value=null,this.settings={...t,defaultType:s,defaultValue:a,logicalType:r,type:o,normalized:o.includes(`norm`),size:this.size,bytesPerElement:s.BYTES_PER_ELEMENT},this.state={...n,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let e=this.getAccessor();return e.vertexOffset?e.vertexOffset*rp(e):0}get numInstances(){return this.state.numInstances}set numInstances(e){this.state.numInstances=e}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&=(this._buffer.delete(),null),zl.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&this.device.type!==`webgpu`?null:this.state.externalBuffer||this._buffer}getValue(e=this.id,t=null){let n={};if(this.state.constant){let r=this.value;if(this.device.type===`webgpu`&&this._buffer)n[e]=this._buffer;else if(t){let i=ap(this.getAccessor(),t),a=i.offset/r.BYTES_PER_ELEMENT,o=i.size||this.size;n[e]=r.subarray(a,a+o)}else n[e]=r}else n[e]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?n[`${e}64Low`]=n[e]:n[`${e}64Low`]=new Float32Array(this.size)),n}_getBufferLayout(e=this.id,t=null){let n=this.getAccessor(),r=[],i={name:this.id,byteStride:this.device.type===`webgpu`&&this.state.constant?0:rp(n)};if(this.doublePrecision){let i=op(n,t||{});r.push(np(e,{...n,...i.high},this.device.type),np(`${e}64Low`,{...n,...i.low},this.device.type))}else if(t){let i=ap(n,t);r.push(np(e,{...n,...i},this.device.type))}else r.push(np(e,n,this.device.type));return i.attributes=r.filter(Boolean),i}setAccessor(e){this.state.bufferAccessor=e}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let e=null;if(this.state.constant&&this.value){let t=Array.from(this.value);e=[t,t]}else{let{value:t,numInstances:n,size:r}=this,i=n*r;if(t&&i&&t.length>=i){let n=Array(r).fill(1/0),a=Array(r).fill(-1/0);for(let e=0;e<i;)for(let i=0;i<r;i++){let r=t[e++];r<n[i]&&(n[i]=r),r>a[i]&&(a[i]=r)}e=[n,a]}}return this.state.bounds=e,e}setData(e){let{state:t}=this,n;n=ArrayBuffer.isView(e)?{value:e}:e instanceof i?{buffer:e}:e;let r={...this.settings,...n};if(ArrayBuffer.isView(n.value)){if(!n.type)if(this.doublePrecision&&n.value instanceof Float64Array)r.type=`float32`;else{let e=tp(n.value);r.type=r.normalized?e.replace(`int`,`norm`):e}r.bytesPerElement=n.value.BYTES_PER_ELEMENT,r.stride=rp(r)}if(t.bounds=null,n.constant){let e=n.value;if(e=this._normalizeValue(e,[],0),this.settings.normalized&&(e=this.normalizeConstant(e)),!(!t.constant||!this._areValuesEqual(e,this.value)))return!1;t.externalBuffer=null,t.constant=!0,this.value=ArrayBuffer.isView(e)?e:new Float32Array(e)}else if(n.buffer)t.externalBuffer=n.buffer,t.constant=!1,this.value=n.value||null;else if(n.value){this._checkExternalBuffer(n);let e=n.value,i=e;t.externalBuffer=null,t.constant=!1,this.value=e,this._shouldSplitDoublePrecisionValue(i)&&(i=Jl(i,r),e instanceof Float32Array&&(r.stride=r.size*2*Float32Array.BYTES_PER_ELEMENT));let{buffer:a}=this,o=rp(r),s=(r.vertexOffset||0)*o;if(this.settings.isIndexed){let e=this.settings.defaultType;i.constructor!==e&&(i=new e(i))}let c=i.byteLength+s+o*2;(!a||a.byteLength<c)&&(a=this._createBuffer(c)),a.write(i,s)}return this.setAccessor(r),!0}updateSubBuffer(e={}){this.state.bounds=null;let t=this.value,{startOffset:n=0,endOffset:r}=e,i=this._shouldSplitDoublePrecisionValue(t);this.buffer.write(i?Jl(t,{size:this.size,startIndex:n,endIndex:r}):t.subarray(n,r),n*(i?8:t.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(e,t=!1){let{state:n}=this,r=n.allocatedValue,i=zl.allocate(r,e+1,{size:this.size,type:this.settings.defaultType,copy:t});this.value=i;let a=this._shouldSplitDoublePrecisionValue(i),o=a&&i instanceof Float32Array?{...this.settings,stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(o);let{byteOffset:s}=this,{buffer:c}=this,l=i.byteLength*(a&&i instanceof Float32Array?2:1);return(!c||c.byteLength<l+s)&&(c=this._createBuffer(l+s),t&&r&&c.write(this._shouldSplitDoublePrecisionValue(r)?Jl(r,this):r,s)),n.allocatedValue=i,n.constant=!1,n.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(e){return!!(this.doublePrecision&&(e instanceof Float64Array||this.device.type===`webgpu`&&e instanceof Float32Array))}_checkExternalBuffer(e){let{value:t}=e;if(!ArrayBuffer.isView(t))throw Error(`Attribute ${this.id} value is not TypedArray`);let n=this.settings.defaultType,r=!1;if(this.doublePrecision&&(r=t.BYTES_PER_ELEMENT<4),r)throw Error(`Attribute ${this.id} does not support ${t.constructor.name}`);!(t instanceof n)&&this.settings.normalized&&!(`normalized`in e)&&N.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(e){switch(this.settings.type){case`snorm8`:return new Float32Array(e).map(e=>(e+128)/255*2-1);case`snorm16`:return new Float32Array(e).map(e=>(e+32768)/65535*2-1);case`unorm8`:return new Float32Array(e).map(e=>e/255);case`unorm16`:return new Float32Array(e).map(e=>e/65535);default:return e}}_normalizeValue(e,t,n){let{defaultValue:r,size:i}=this.settings;if(Number.isFinite(e))return t[n]=e,t;if(!e){let e=i;for(;--e>=0;)t[n+e]=r[e];return t}switch(i){case 4:t[n+3]=Number.isFinite(e[3])?e[3]:r[3];case 3:t[n+2]=Number.isFinite(e[2])?e[2]:r[2];case 2:t[n+1]=Number.isFinite(e[1])?e[1]:r[1];case 1:t[n+0]=Number.isFinite(e[0])?e[0]:r[0];break;default:let a=i;for(;--a>=0;)t[n+a]=Number.isFinite(e[a])?e[a]:r[a]}return t}_areValuesEqual(e,t){if(!e||!t)return!1;let{size:n}=this;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}_createBuffer(e){this._buffer&&this._buffer.destroy();let{isIndexed:t,type:n}=this.settings,r=this.device.type===`webgpu`&&!t?i.VERTEX|i.STORAGE|i.COPY_DST|i.COPY_SRC:(t?i.INDEX:i.VERTEX)|i.COPY_DST;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:r,indexType:t?n:void 0,byteLength:e}),this._buffer}},cp=[],lp=[];function up(e,t=0,n=1/0){let r=cp,i={index:-1,data:e,target:[]};return e?typeof e[Symbol.iterator]==`function`?r=e:e.length>0&&(lp.length=e.length,r=lp):r=cp,(t>0||Number.isFinite(n))&&(r=(Array.isArray(r)?r:Array.from(r)).slice(t,n),i.index=t-1),{iterable:r,objectInfo:i}}function dp(e){return e&&e[Symbol.asyncIterator]}function fp(e,t){let{size:n,stride:r,offset:i,startIndices:a,nested:o}=t,s=e.BYTES_PER_ELEMENT,c=r?r/s:n,l=i?i/s:0,u=Math.floor((e.length-l)/c);return(t,{index:r,target:i})=>{if(!a){let t=r*c+l;for(let r=0;r<n;r++)i[r]=e[t+r];return i}let s=a[r],d=a[r+1]||u,f;if(o){f=Array(d-s);for(let t=s;t<d;t++){let r=t*c+l;i=Array(n);for(let t=0;t<n;t++)i[t]=e[r+t];f[t-s]=i}}else if(c===n)f=e.subarray(s*n+l,d*n+l);else{f=new e.constructor((d-s)*n);let t=0;for(let r=s;r<d;r++){let i=r*c+l;for(let r=0;r<n;r++)f[t++]=e[i+r]}}return f}}var pp=[],mp=[[0,1/0]];function hp(e,t){if(e===mp||(t[0]<0&&(t[0]=0),t[0]>=t[1]))return e;let n=[],r=e.length,i=0;for(let a=0;a<r;a++){let r=e[a];r[1]<t[0]?(n.push(r),i=a+1):r[0]>t[1]?n.push(r):t=[Math.min(r[0],t[0]),Math.max(r[1],t[1])]}return n.splice(i,0,t),n}var gp={interpolation:{duration:0,easing:e=>e},spring:{stiffness:.05,damping:.5}};function _p(e,t){if(!e)return null;Number.isFinite(e)&&(e={type:`interpolation`,duration:e});let n=e.type||`interpolation`;return{...gp[n],...t,...e,type:n}}var vp=class extends sp{constructor(e,t){super(e,t,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:mp}),this.constant=!1,this.settings.update=t.update||(t.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(e){this.state.startIndices=e}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:e=!1}={}){let t=this.state.needsRedraw;return this.state.needsRedraw=t&&!e,t}layoutChanged(){return this.state.layoutChanged}setAccessor(e){var t;(t=this.state).layoutChanged||(t.layoutChanged=!ip(e,this.getAccessor())),super.setAccessor(e)}getUpdateTriggers(){let{accessor:e}=this.settings;return[this.id].concat(typeof e!=`function`&&e||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(e){if(!e||!this.supportsTransition())return null;let{accessor:t}=this.settings,n=this.settings.transition;return _p(Array.isArray(t)?e[t.find(t=>e[t])]:e[t],n)}setNeedsUpdate(e=this.id,t){if(this.state.needsUpdate=this.state.needsUpdate||e,this.setNeedsRedraw(e),t){let{startRow:e=0,endRow:n=1/0}=t;this.state.updateRanges=hp(this.state.updateRanges,[e,n])}else this.state.updateRanges=mp}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=pp}setNeedsRedraw(e=this.id){this.state.needsRedraw=this.state.needsRedraw||e}allocate(e){let{state:t,settings:n}=this;if(n.noAlloc)return!1;if(n.update){let n=this.isConstant;return super.allocate(e,t.updateRanges!==mp),t.layoutChanged||=n&&this.device.type===`webgpu`,!0}return!1}updateBuffer({numInstances:e,data:t,props:n,context:r}){if(!this.needsUpdate())return!1;let{state:{updateRanges:i},settings:{update:a,noAlloc:o}}=this,s=!0;if(a){for(let[o,s]of i)a.call(r,this,{data:t,startRow:o,endRow:s,props:n,numInstances:e});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let e=this.value;this.value=null,this.setConstantValue(r,e)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[t,n]of i){let r=Number.isFinite(t)?this.getVertexOffset(t):0,i=Number.isFinite(n)?this.getVertexOffset(n):o||!Number.isFinite(e)?this.value.length:e*this.size;super.updateSubBuffer({startOffset:r,endOffset:i})}this._checkAttributeArray()}else s=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),s}setConstantValue(e,t){var n;if(t===void 0||typeof t==`function`)return!1;let r=this.isConstant,i=this.settings.transform&&e?this.settings.transform.call(e,t):t,a=this.settings.defaultType;this.state.constantValue=this._normalizeValue(i,new a(this.size),0);let o=this.setData({constant:!0,value:i});if(this.device.type===`webgpu`){let e=this.state.constantValue;this.doublePrecision&&(e instanceof Float32Array||e instanceof Float64Array)&&(e=Jl(e,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}));let t=this._buffer;(!t||t.byteLength<e.byteLength)&&(t=this._createBuffer(e.byteLength)),t.write(e),(n=this.state).layoutChanged||(n.layoutChanged=!r),this.constant=!1}return o&&this.setNeedsRedraw(),this.clearNeedsUpdate(),!0}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(e){let{state:t}=this;return e?(this.clearNeedsUpdate(),t.lastExternalBuffer===e?!0:(t.lastExternalBuffer=e,this.setNeedsRedraw(),this.setData(e),!0)):(t.lastExternalBuffer=null,!1)}setBinaryValue(e,t=null){let{state:n,settings:r}=this;if(!e)return n.binaryValue=null,n.binaryAccessor=null,!1;if(r.noAlloc)return!1;if(n.binaryValue===e)return this.clearNeedsUpdate(),!0;if(n.binaryValue=e,this.setNeedsRedraw(),r.transform||t!==this.startIndices){ArrayBuffer.isView(e)&&(e={value:e});let i=e;J(ArrayBuffer.isView(i.value),`invalid ${r.accessor}`);let a=!!i.size&&i.size!==this.size;return n.binaryAccessor=fp(i.value,{size:i.size||this.size,stride:i.stride,offset:i.offset,startIndices:t,nested:a}),!1}return this.clearNeedsUpdate(),this.setData(e),!0}getVertexOffset(e){let{startIndices:t}=this;return(t?e<t.length?t[e]:this.numInstances:e)*this.size}getValue(){let e=this.settings.shaderAttributes,t=super.getValue();if(!e)return t;for(let n in e)Object.assign(t,super.getValue(n,e[n]));return t}getBufferLayout(e){this.state.layoutChanged=!1;let t=this.settings.shaderAttributes,n=super._getBufferLayout(),{stepMode:r}=this.settings;if(r===`dynamic`?n.stepMode=e?e.isInstanced?`instance`:`vertex`:`instance`:n.stepMode=r??`vertex`,!t)return n;for(let e in t){let r=super._getBufferLayout(e,t[e]);n.attributes.push(...r.attributes)}return n}_autoUpdater(e,{data:t,startRow:n,endRow:r,props:i,numInstances:a}){let{settings:o,state:s,value:c,size:l,startIndices:u}=e,{accessor:d,transform:f}=o,p=s.binaryAccessor||(typeof d==`function`?d:i[d]);J(typeof p==`function`,`accessor "${d}" is not a function`);let m=e.getVertexOffset(n),{iterable:h,objectInfo:g}=up(t,n,r);for(let t of h){g.index++;let n=p(t,g);if(f&&(n=f.call(this,n)),u){let t=(g.index<u.length-1?u[g.index+1]:a)-u[g.index];if(n&&Array.isArray(n[0])){let t=m;for(let r of n)e._normalizeValue(r,c,t),t+=l}else n&&n.length>l?c.set(n,m):(e._normalizeValue(n,g.target,0),fd({target:c,source:g.target,start:m,count:t}));m+=t*l}else e._normalizeValue(n,c,m),m+=l}}_validateAttributeUpdaters(){let{settings:e}=this;if(!(e.noAlloc||typeof e.update==`function`))throw Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:e}=this,t=Math.min(4,this.size);if(e&&e.length>=t){let n=!0;switch(t){case 4:n&&=Number.isFinite(e[3]);case 3:n&&=Number.isFinite(e[2]);case 2:n&&=Number.isFinite(e[1]);case 1:n&&=Number.isFinite(e[0]);break;default:n=!1}if(!n)throw Error(`Illegal attribute generated for ${this.id}`)}}},yp=class e{gpuDataEvaluators;format;length;id;_gpuVector;_ownsGPUDataEvaluators;_destroyed=!1;static fromGPUVector(t){if(t.bufferLayout)throw Error(`GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${t.name}"`);if(t.data.length===0)throw Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${t.name}"`);return new e({id:t.name,gpuDataEvaluators:t.data.map(e=>m.fromGPUData(e,{id:t.name})),gpuVector:t,format:t.format})}static fromGPUDataEvaluators(t,n={}){return new e({id:n.id,gpuDataEvaluators:t,format:n.format})}constructor({id:e,gpuDataEvaluators:t,gpuVector:n,format:r}){if(t.length===0)throw Error(`GPUVectorEvaluator requires at least one GPUData evaluator`);bp(t),this.id=e,this.gpuDataEvaluators=t,this.format=r??t[0].format,this.length=t.reduce((e,t)=>e+t.length,0),this._gpuVector=n,this._ownsGPUDataEvaluators=!n}get evaluated(){return!!this._gpuVector}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}mapGPUData(t){return e.fromGPUDataEvaluators(this.gpuDataEvaluators.map((e,n)=>t(e,n)),{id:this.id})}async evaluate(e,t={}){if(this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let n=await Promise.all(this.gpuDataEvaluators.map(n=>n.evaluate(e,t))),r=n[0],i=n.map(xp),a=t.format??this.format??r.format;return this._gpuVector=new p({type:`data`,name:t.name??this.id??`vector`,format:a,data:i,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}evaluateSync(e,t={}){if(this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let n=this.gpuDataEvaluators.map(n=>n.evaluateSync(e,t)),r=n[0],i=n.map(xp),a=t.format??this.format??r.format;return this._gpuVector=new p({type:`data`,name:t.name??this.id??`vector`,format:a,data:i,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}destroy(){if(this._ownsGPUDataEvaluators)for(let e of this.gpuDataEvaluators)e.destroy();this._gpuVector=void 0,this._destroyed=!0}toString(){return this.id??this.constructor.name}};function bp(e){let t=e[0];for(let n of e.slice(1))if(n.type!==t.type||n.size!==t.size||n.normalized!==t.normalized||n.format!==t.format)throw Error(`GPUVectorEvaluator requires matching GPUData evaluator layouts`)}function xp(e){let[t,...n]=e.data;if(!t||n.length>0)throw Error(`GPUVectorEvaluator requires one GPUData chunk for "${e.name}"`);return t}function Sp({elementWise:e,func:t,inputs:n,output:r,outputBuffer:i}){let a=Array.isArray(n)?n:Object.values(n);for(let e of a)if(!e.value)throw Error(`${e} does not have CPU value`);let o=r.length,s=r.size,c=new r.ValueType(o*s);for(let n=0;n<o;n++){let r=a.map(e=>Y(e,n));if(e)for(let e=0;e<s;e++)c[n*s+e]=t.apply(null,r.map(t=>t[e]));else t.call(null,c.subarray(n*s,n*s+s),...r)}let l=r.ValueType.BYTES_PER_ELEMENT,u=r.offset/l,d=r.stride/l,f=s,p=c;if(u!==0||d!==f){p=new r.ValueType(u+r.byteLength/l);for(let e=0;e<o;e++){let t=e*f,n=u+e*d,r=c.subarray(t,t+s);p.set(r,n),i.write(r,n*l)}}else i.write(c);return{success:!0,value:p}}function Y(e,t){let n=e.value,r=e.size,i=e.offset/e.ValueType.BYTES_PER_ELEMENT,a=e.stride/e.ValueType.BYTES_PER_ELEMENT,o=i+(e.isConstant?0:t)*a,s=n.slice(o,o+r);if(!e.normalized)return s;let c=new Float32Array(r);for(let t=0;t<r;t++)c[t]=Cp(s[t],e.type);return c}function Cp(e,t){switch(t){case`uint8`:return e/255;case`uint16`:return e/65535;case`uint32`:return e/4294967295;case`sint8`:return Math.max(e/127,-1);case`sint16`:return Math.max(e/32767,-1);case`sint32`:return Math.max(e/2147483647,-1);case`float32`:return e;default:throw Error(`Unsupported normalized source type ${t}`)}}var wp=({inputs:e,output:t,target:n})=>{for(let t of Object.values(e.namedInputs))if(!t.value)throw Error(`${t} does not have CPU value`);let r=new t.ValueType(t.length*t.size);for(let n=0;n<t.length;n++){let i=Object.fromEntries(Object.entries(e.namedInputs).map(([e,t])=>[e,Y(t,n)]));for(let a=0;a<t.size;a++)r[n*t.size+a]=Tp(e.expression,i,a)}return n.write(r),{success:!0,value:r}};function Tp(e,t,n){switch(e.kind){case`input`:{let r=t[e.name];return n<r.length?r[n]:r.length===1?r[0]:0}case`literal`:return Array.isArray(e.value)?e.value[n]??0:e.value;case`call`:{Ep(e.op,e.args.length);let r=e.args.map(e=>Tp(e,t,n));switch(e.op){case`add`:return r[0]+r[1];case`subtract`:return r[0]-r[1];case`multiply`:return r[0]*r[1];case`divide`:return r[0]/r[1];case`pow`:return r[0]**+r[1];case`sqrt`:return Math.sqrt(r[0]);case`abs`:return Math.abs(r[0]);case`sin`:return Math.sin(r[0]);case`cos`:return Math.cos(r[0]);case`tan`:return Math.tan(r[0]);case`exp`:return Math.exp(r[0]);case`log`:return Math.log(r[0]);default:{let t=e.op;throw Error(`Unsupported arithmetic op ${t}`)}}}default:{let t=e;throw Error(`Unsupported expression node ${t.kind}`)}}}function Ep(e,t){let n=f[e].arity;if(t!==n)throw Error(`Arithmetic op '${e}' expects ${n} args, got ${t}`)}var Dp=({inputs:e,output:t,target:n})=>{let{sourceValues:r}=e;if(!r.value)throw Error(`${r} does not have CPU value`);let i=new t.ValueType(t.length*t.size);if(r.length===0)return{success:!1,error:Error(`${r} is empty`)};for(let e=0;e<r.size;e++){let n=Y(r,0)[e],a=e*t.size,o=a+1;i[a]=n,i[o]=n;for(let t=1;t<r.length;t++){let n=Y(r,t)[e];n<i[a]&&(i[a]=n),n>i[o]&&(i[o]=n)}}return n.write(i),{success:!0,value:i}},Op=({inputs:e,output:t,target:n})=>Sp({func:(e,t)=>{let n=e.length/2,r=new Float64Array(t.buffer);for(let t=0;t<n;t++){let i=r[t];e[t]=Math.fround(i),e[t+n]=i-e[t]}return e},inputs:e,output:t,outputBuffer:n}),kp=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=r.value,o=i.value;if(!a)throw Error(`${r} does not have CPU value`);if(!o)throw Error(`${i} does not have CPU value`);let s=new t.ValueType(t.length*t.size),c=Array(t.size).fill(0);for(let e=0;e<t.length;e++){let n=Y(r,e),a=Number(n[0]),o=Ap(a,i.length)?Y(i,a):c;s.set(o,e*t.size)}return n.write(s),{success:!0,value:s}};function Ap(e,t){return Number.isInteger(e)&&e>=0&&e<t}var jp=({inputs:e,output:t,target:n})=>Sp({func:(e,...t)=>{let n=0;for(let r of t)e.set(r,n),n+=r.length},inputs:e,output:t,outputBuffer:n}),Mp=({inputs:e,output:t,target:n})=>{let{x:r,y:i}=e,a=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=Y(r,e),n=Y(i,e),o=0;for(let e=0;e<r.size;e++)o+=t[e]*n[e];a[e]=o}return n.write(a),{success:!0,value:a}},Np=({inputs:e,output:t,target:n})=>{let{x:r,y:i}=e,a=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=Y(r,e),n=Y(i,e),o=1;for(let e=0;e<r.size;e++)if(t[e]!==n[e]){o=0;break}a[e]=o}return n.write(a),{success:!0,value:a}},Pp=({inputs:e,output:t,target:n})=>{let{x:r}=e,i=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=Y(r,e),n=0;for(let e=0;e<r.size;e++)n+=t[e]*t[e];i[e]=Math.sqrt(n)}return n.write(i),{success:!0,value:i}},Fp=async({inputs:e,output:t,target:n})=>{let{segments:r,vertexCount:i}=e,a=r.value;if(!a)throw Error(`${r} does not have CPU value`);Ip(a,r,i);let o=new t.ValueType(t.length*t.size),s=0;for(let e=0;e<i;e++){for(;s+1<r.length&&a[Lp(r,s+1)]<=e;)s++;let n=a[Lp(r,s)],i=e*t.size;o[i]=s,o[i+1]=e-n}return n.write(o),{success:!0,value:o}};function Ip(e,t,n){if(t.length<1)throw Error(`segmentedMap segments must contain at least one segment start`);let r=0;for(let n=0;n<t.length;n++){let i=e[Lp(t,n)];if(n===0&&i!==0)throw Error(`segmentedMap segments must start at 0, got ${i}`);if(n>0&&i<r)throw Error(`segmentedMap segments must be non-decreasing, got ${i} after ${r}`);r=i}if(r>n)throw Error(`segmentedMap last segment start must be <= vertexCount, got ${r} > ${n}`)}function Lp(e,t){return e.offset/e.ValueType.BYTES_PER_ELEMENT+t*(e.stride/e.ValueType.BYTES_PER_ELEMENT)}var Rp=async({inputs:e,output:t,target:n})=>{let{condition:r,whenTrue:i,whenFalse:a}=e,o=new t.ValueType(t.length*t.size);for(let e=0;e<t.length;e++){let n=Y(r,e),s=Y(i,e),c=Y(a,e);for(let l=0;l<t.size;l++){let u=zp(n,r.size,l);o[e*t.size+l]=u===0?zp(c,a.size,l):zp(s,i.size,l)}}return n.write(o),{success:!0,value:o}};function zp(e,t,n){return n<t?e[n]:t===1?e[0]:0}var Bp=({inputs:e,output:t,target:n})=>{let r=new t.ValueType(t.length);for(let n=0;n<t.length;n++)r[n]=e.start+n*e.step;return n.write(r),{success:!0,value:r}},Vp=({inputs:e,output:t,target:n})=>{let{columns:r}=e;return Sp({func:(e,t)=>{for(let n=0;n<r.length;n++)e[n]=t[r[n]]},inputs:{x:e.x},output:t,outputBuffer:n})},Hp=D({arithmetic:()=>wp,dot:()=>Mp,equalAll:()=>Np,extent:()=>Dp,fround:()=>Op,gather:()=>kp,interleave:()=>jp,length:()=>Pp,segmentedMap:()=>Fp,select:()=>Rp,sequence:()=>Bp,swizzle:()=>Vp}),Up=new class{_modules={cpu:Hp};add(t,n){let r=this._modules[t];if(typeof n.then==`function`){let i=Promise.all([Promise.resolve(r||{}),n]).then(([e,t])=>({...e,...t}));return this._modules[t]=i,i.then(e=>{this._modules[t]=e}).catch(n=>{e.error(`Failed to register ${t} backend: ${n}`)()}),i}if(r&&typeof r.then==`function`){let i=Promise.resolve(r).then(e=>({...e,...n})).then(e=>(this._modules[t]=e,e)).catch(n=>{throw e.error(`Failed to register ${t} backend: ${n}`)(),n});return this._modules[t]=i,i}let i={...r||{},...n};return this._modules[t]=i,Promise.resolve(i)}async get(e,t){let n=this._modules[e];if(!n)if(e===`webgl`)n=this.add(`webgl`,Wf(()=>import(`./webgl-vbsKKZUb.js`),__vite__mapDeps([7,2,3,8,9,6,10,4,11])));else if(e===`webgpu`)n=this.add(`webgpu`,Wf(()=>import(`./webgpu-ClEapnhV.js`),__vite__mapDeps([12,13,3,9,8,6])));else throw Error(`${e} backend not registered`);let r=(await n)[t];if(typeof r!=`function`)throw Error(`${e} backend does not implement ${t}`);return r}getSync(e,t){let n=this._modules[e];if(!n)throw Error(`${e} backend not registered`);if(typeof n.then==`function`)throw Error(`${e} backend is not loaded yet`);let r=n[t];if(typeof r!=`function`)throw Error(`${e} backend does not implement ${t}`);return r}clear(){this._modules={}}},Wp=class{inputs;dependencies;constructor(e){this.inputs=e,this.dependencies=Array.from(e instanceof Array?e:Object.values(e)).filter(e=>e instanceof m)}async execute(e,t){return await this._resolveDependencies(e),await this._executeWithHandler(await Up.get(this._getHandlerRegistry(e),this.name),t)}executeSync(e,t){this._resolveDependenciesSync(e);let n=this._executeWithHandler(Up.getSync(this._getHandlerRegistry(e),this.name),t);if(Gp(n))throw Error(`${this.name} returned a Promise in executeSync()`);return n}shouldExecuteOnCPU(){return this.output.length<=1&&Array.from(this.dependencies).every(e=>!!e.value)}_getHandlerRegistry(e){return this.shouldExecuteOnCPU()?`cpu`:e.type}async _resolveDependencies(e){for(let t of this.dependencies)await t.evaluate(e);if(this._getHandlerRegistry(e)===`cpu`||e.type===`null`)for(let e of this.dependencies)await e.ensureCPUValue()}_resolveDependenciesSync(e){for(let t of this.dependencies)t.evaluateSync(e);if(this._getHandlerRegistry(e)===`cpu`||e.type===`null`)for(let e of this.dependencies)e.ensureCPUValueSync()}_executeWithHandler(e,t){return e({device:t.device,inputs:this.inputs,output:this.output,target:t})}};function Gp(e){return typeof e?.then==`function`}function Kp(...e){let t=qp(e.map(e=>e.type));return t[0]!==`f`&&e.some(e=>e.normalized)&&(t=`float32`),{isConstant:e.every(e=>e.isConstant),type:t,size:e.reduce((e,t)=>Math.max(e,t.size),0),length:e.reduce((e,t)=>Math.max(e,t.length),0)}}function qp(e){let t=0,n=0;for(let r of e){if(r[0]===`f`)return`float32`;let e=r.endsWith(`8`)?8:r.endsWith(`6`)?16:32;r[0]===`u`?t=Math.max(t,e):n=Math.max(n,e)}return t&&!n?`uint${t}`:n&&t<32?`sint${Math.max(n,t*2)}`:`float32`}var Jp=class extends Wp{name=`interleave`;output;constructor(e){super(e);let{isConstant:t,type:n,length:r}=Kp(...e);this.output=new m({isConstant:t,type:n,size:e.reduce((e,t)=>e+t.size,0),length:r,source:this})}toString(){return`_${this.inputs.join(`_`)}_`}};function Yp(...e){if(e.length===0)throw Error(`interleave() requires at least one input`);return e.length===1?d(e[0]):new Jp(e.map(d)).output}function Xp(e,t){let n=Qp(t);for(let t of n)t.evaluateSync(e);return Zp(n),t}function Zp(e){let t=new Set(e.flatMap(nm)),n=new Set;for(let t of e)tm(t,n);for(let e of n)e.evaluated&&!t.has(e.buffer)&&e.destroy()}function Qp(e){let t=new Set;return $p(e,t,new Set),Array.from(t)}function $p(e,t,n){if(rm(e)){t.add(e);return}if(!(!e||typeof e!=`object`||n.has(e))){if(n.add(e),Array.isArray(e)){for(let r of e)$p(r,t,n);return}if(em(e))for(let r of Object.values(e))$p(r,t,n)}}function em(e){let t=Object.getPrototypeOf(e);return t===Object.prototype||t===null}function tm(e,t){if(e instanceof yp){for(let n of e.gpuDataEvaluators)tm(n,t);return}let n=e.source;if(n){if(n instanceof m){t.has(n)||(t.add(n),tm(n,t));return}for(let e of n.dependencies)t.has(e)||(t.add(e),tm(e,t))}}function nm(e){return e instanceof m?[e.buffer]:e.gpuVector.data.map(e=>e.buffer instanceof h?e.buffer.buffer:e.buffer)}function rm(e){return e instanceof m||e instanceof yp}var im=class{constructor(e,{id:t,isTransitionAttribute:n}){this.packedBuffers={},this.device=e,this.id=t,this.isTransitionAttribute=n,this.device.type===`webgpu`&&Up.add(`webgpu`,{interleave:T})}hasGroups(e){return this.device.type===`webgpu`&&Object.values(e).some(e=>!!e.settings.bufferGroup)}finalize(){for(let e of Object.values(this.packedBuffers))e.packed.destroy();this.packedBuffers={}}getBufferLayouts(e,t){let n=this._getPackedGroups(e,t,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(e,n,t)}getBindings(e,t,n,r){let i=this._getPackedGroups(e,n,{requireValues:!0,excludeAttributes:r}),a={},o=new Set;for(let e of i.values()){let n=!this.packedBuffers[e.id]||e.attributes.some(e=>!!t[e.id]);a[e.id]=this._getPackedBuffer(e,n);for(let t of e.attributes)o.add(t.id)}return{bufferLayouts:this._getBufferLayouts(e,i,n).filter(t=>!r[t.name]&&!e[t.name]?.settings.isIndexed),buffers:a,groupedAttributeIds:o}}_getPackedGroups(e,t,{requireValues:n,excludeAttributes:r}){let i=new Map;for(let t of Object.values(e)){let e=t.settings.bufferGroup;if(!e)continue;let n=i.get(e)||[];n.push(t),i.set(e,n)}let a=new Map;for(let[e,o]of i){let i=this._getPackedGroup(e,o,t,n,r);i&&a.set(e,i)}return a}_getPackedGroup(e,t,n,r,i){if(t.length<2)return null;let a=t.map(e=>e.getBufferLayout(n)),o=a[0].stepMode,s=Math.max(1,t[0].numInstances),c=r&&t.every(e=>e.isConstant);for(let e=0;e<t.length;e++){let n=t[e],c=n.getAccessor(),l=c.size*c.bytesPerElement;if(i[n.id]||n.settings.isIndexed||n.settings.noAlloc||n.doublePrecision||this.isTransitionAttribute(n.id)||a[e].stepMode!==o||n.numInstances!==t[0].numInstances||(c.offset||0)!==0||(c.vertexOffset||0)!==0||rp(c)!==l||r&&(n.isConstant?!n.getConstantValue()||n.getConstantValue().byteLength<l:!ArrayBuffer.isView(n.value)||n.value.byteLength<s*l))return null}let l={},u=[],d=0;for(let e=0;e<t.length;e++){let n=t[e];d=am(d),l[n.id]=d;for(let t of a[e].attributes||[])u.push({...t,byteOffset:d+(t.byteOffset||0)});d+=rp(n.getAccessor())}return d=am(d),{id:e,attributes:t,byteStride:d,byteOffsets:l,rowCount:s,layout:{name:e,byteStride:c?0:d,stepMode:o,attributes:u}}}_getBufferLayouts(e,t,n){let r=[],i=new Set,a=new Set;for(let e of t.values())for(let t of e.attributes)a.add(t.id);for(let o of Object.values(e)){let e=o.settings.bufferGroup,s=e&&t.get(e);s&&a.has(o.id)?i.has(s.id)||(r.push(s.layout),i.add(s.id)):r.push(o.getBufferLayout(n))}return r}_getPackedBuffer(e,t){let n=JSON.stringify({byteStride:e.layout.byteStride,attributes:e.layout.attributes}),r=this.packedBuffers[e.id];if((!r||r.layoutKey!==n)&&(t=!0),t){r&&(r.packed.destroy(),delete this.packedBuffers[e.id]);let t=this._interleavePackedGroup(e);return this.packedBuffers[e.id]={packed:t,layoutKey:n},t.buffer}if(!r)throw Error(`Attribute buffer group ${e.id} has no packed buffer`);return r.packed.buffer}_interleavePackedGroup(e){let t=Yp(...e.attributes.map(t=>this._getInterleaveInput(e,t)));return Xp(this.device,t),t}_getInterleaveInput(e,t){let n=rp(t.getAccessor()),r=e.byteOffsets[t.id];if(om(`${e.id}.${t.id} rowByteLength`,n),om(`${e.id}.${t.id} groupByteOffset`,r),t.isConstant){let r=t.getConstantValue();if(!r)throw Error(`Attribute group ${e.id} is missing constant value ${t.id}`);return om(`${e.id}.${t.id} constant byteOffset`,r.byteOffset),new m({id:t.id,type:`uint32`,size:n/4,isConstant:!0,value:new Uint32Array(r.buffer,r.byteOffset,n/Uint32Array.BYTES_PER_ELEMENT)})}let i=t.getBuffer(),a=t.byteOffset,o=t.getAccessor().stride||n;if(om(`${e.id}.${t.id} byteOffset`,a),om(`${e.id}.${t.id} stride`,o),!i)throw Error(`Attribute group ${e.id} cannot interleave missing buffer ${t.id}`);return new m({id:t.id,type:`uint32`,size:n/4,offset:a,stride:o,length:e.rowCount,buffer:i})}};function am(e){return Math.ceil(e/4)*4}function om(e,t){if(t%4!=0)throw Error(`Attribute buffer groups require 32-bit alignment: ${e}=${t}`)}function sm(e){let{source:t,target:n,start:r=0,size:i,getData:a}=e,o=e.end||n.length,s=t.length,c=o-r;if(s>c){n.set(t.subarray(0,c),r);return}if(n.set(t,r),!a)return;let l=s;for(;l<c;){let e=a(l,t);for(let t=0;t<i;t++)n[r+l]=e[t]||0,l++}}function cm({source:e,target:t,size:n,getData:r,sourceStartIndices:i,targetStartIndices:a}){if(!i||!a)return sm({source:e,target:t,size:n,getData:r}),t;let o=0,s=0,c=r&&((e,t)=>r(e+s,t)),l=Math.min(i.length,a.length);for(let r=1;r<l;r++){let l=i[r]*n,u=a[r]*n;sm({source:e.subarray(o,l),target:t,start:s,end:u,size:n,getData:c}),o=l,s=u}return s<t.length&&sm({source:[],target:t,start:s,size:n,getData:c}),t}function lm(e){let{device:t,settings:n,value:r}=e,i=new vp(t,n);return i.setData({value:r instanceof Float64Array?new Float64Array:new Float32Array,normalized:n.normalized}),i}function um(e){switch(e){case 1:return`float`;case 2:return`vec2`;case 3:return`vec3`;case 4:return`vec4`;default:throw Error(`No defined attribute type for size "${e}"`)}}function dm(e){switch(e){case 1:return`float32`;case 2:return`float32x2`;case 3:return`float32x3`;case 4:return`float32x4`;default:throw Error(`invalid type size`)}}function fm(e){e.push(e.shift())}function pm(e,t){let{settings:n,value:r,size:i}=e,a=e.isDoublePrecisionBuffer?2:1,o=0,{shaderAttributes:s}=e.settings;if(s)for(let e of Object.values(s))o=Math.max(o,e.vertexOffset??0);return(n.noAlloc?r.length:(t+o)*i)*a}function mm({device:e,source:t,target:n}){return(!n||n.byteLength<t.byteLength)&&(n?.destroy(),n=e.createBuffer({byteLength:t.byteLength,usage:t.usage})),n}function hm({device:e,buffer:t,attribute:n,fromLength:r,toLength:i,fromStartIndices:a,getData:o=e=>e}){let s=n.isDoublePrecisionBuffer?2:1,c=n.size*s,l=n.byteOffset,u=n.settings.bytesPerElement<4?l/n.settings.bytesPerElement*4:l,d=n.startIndices,f=a&&d,p=n.isConstant;if(!f&&t&&r>=i)return t;let m=n.value instanceof Float64Array?Float32Array:n.value.constructor,h=p?n.value:new m(n.getBuffer().readSyncWebGL(l,i*m.BYTES_PER_ELEMENT).buffer);if(n.settings.normalized&&!p){let e=o;o=(t,r)=>n.normalizeConstant(e(t,r))}let g=p?(e,t)=>o(h,t):(e,t)=>o(h.subarray(e+l,e+l+c),t),_=t?new Float32Array(t.readSyncWebGL(u,r*4).buffer):new Float32Array,v=new Float32Array(i);return cm({source:_,target:v,sourceStartIndices:a,targetStartIndices:d,size:c,getData:g}),(!t||t.byteLength<v.byteLength+u)&&(t?.destroy(),t=e.createBuffer({byteLength:v.byteLength+u,usage:35050})),t.write(v,u),t}var gm=class{constructor({device:e,attribute:t,timeline:n}){this.buffers=[],this.currentLength=0,this.device=e,this.transition=new Ad(n),this.attribute=t,this.attributeInTransition=lm(t),this.currentStartIndices=t.startIndices}get inProgress(){return this.transition.inProgress}start(e,t,n=1/0){this.settings=e,this.currentStartIndices=this.attribute.startIndices,this.currentLength=pm(this.attribute,t),this.transition.start({...e,duration:n})}update(){let e=this.transition.update();return e&&this.onUpdate(),e}setBuffer(e){let{stride:t}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:e,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:t})}cancel(){this.transition.cancel()}delete(){this.cancel();for(let e of this.buffers)e.destroy();this.buffers.length=0}},_m=class extends gm{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type=`interpolation`,this.transform=Sm(e,t)}start(e,t){let n=this.currentLength,r=this.currentStartIndices;if(super.start(e,t,e.duration),e.duration<=0){this.transition.cancel();return}let{buffers:i,attribute:a}=this;fm(i),i[0]=hm({device:this.device,buffer:i[0],attribute:a,fromLength:n,toLength:this.currentLength,fromStartIndices:r,getData:e.enter}),i[1]=mm({device:this.device,source:i[0],target:i[1]}),this.setBuffer(i[1]);let{transform:o}=this,s=o.model,c=Math.floor(this.currentLength/a.size);xm(a)&&(c/=2),s.setVertexCount(c),a.isConstant?(s.setAttributes({aFrom:i[0]}),s.setConstantAttributes({aTo:a.value})):s.setAttributes({aFrom:i[0],aTo:a.getBuffer()}),o.transformFeedback.setBuffers({vCurrent:i[1]})}onUpdate(){let{duration:e,easing:t}=this.settings,{time:n}=this.transition,r=n/e;t&&(r=t(r));let{model:i}=this.transform,a={time:r};i.shaderInputs.setProps({interpolation:a}),this.transform.run({discard:!0})}delete(){super.delete(),this.transform.destroy()}},vm={name:`interpolation`,vs:`layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,uniformTypes:{time:`f32`}},ym=`#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,bm=`#version 300 es
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
`;function xm(e){return e.isDoublePrecisionBuffer}function Sm(e,t){let n=t.size,r=um(n),i=dm(n),a=t.getBufferLayout();return xm(t)?new w(e,{vs:bm,bufferLayout:[{name:`aFrom`,byteStride:8*n,attributes:[{attribute:`aFrom`,format:i,byteOffset:0},{attribute:`aFrom64Low`,format:i,byteOffset:4*n}]},{name:`aTo`,byteStride:8*n,attributes:[{attribute:`aTo`,format:i,byteOffset:0},{attribute:`aTo64Low`,format:i,byteOffset:4*n}]}],modules:[ka,vm],defines:{ATTRIBUTE_TYPE:r,ATTRIBUTE_SIZE:n},moduleSettings:{},varyings:[`vCurrent`,`vCurrent64Low`],bufferMode:35980,disableWarnings:!0}):new w(e,{vs:ym,bufferLayout:[{name:`aFrom`,format:i},{name:`aTo`,format:a.attributes[0].format}],modules:[vm],defines:{ATTRIBUTE_TYPE:r},varyings:[`vCurrent`],disableWarnings:!0})}var Cm=class extends gm{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type=`spring`,this.texture=Om(e),this.framebuffer=km(e,this.texture),this.transform=Dm(e,t)}start(e,t){let n=this.currentLength,r=this.currentStartIndices;super.start(e,t);let{buffers:i,attribute:a}=this;for(let t=0;t<2;t++)i[t]=hm({device:this.device,buffer:i[t],attribute:a,fromLength:n,toLength:this.currentLength,fromStartIndices:r,getData:e.enter});i[2]=mm({device:this.device,source:i[0],target:i[2]}),this.setBuffer(i[1]);let{model:o}=this.transform;o.setVertexCount(Math.floor(this.currentLength/a.size)),a.isConstant?o.setConstantAttributes({aTo:a.value}):o.setAttributes({aTo:a.getBuffer()})}onUpdate(){let{buffers:e,transform:t,framebuffer:n,transition:r}=this,i=this.settings;t.model.setAttributes({aPrev:e[0],aCur:e[1]}),t.transformFeedback.setBuffers({vNext:e[2]});let a={stiffness:i.stiffness,damping:i.damping};t.model.shaderInputs.setProps({spring:a}),t.run({framebuffer:n,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),fm(e),this.setBuffer(e[1]),this.device.readPixelsToArrayWebGL(n)[0]>0||r.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}},wm={name:`spring`,vs:`layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,uniformTypes:{damping:`f32`,stiffness:`f32`}},Tm=`#version 300 es
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
`,Em=`#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`;function Dm(e,t){let n=um(t.size),r=dm(t.size);return new w(e,{vs:Tm,fs:Em,bufferLayout:[{name:`aPrev`,format:r},{name:`aCur`,format:r},{name:`aTo`,format:t.getBufferLayout().attributes[0].format}],varyings:[`vNext`],modules:[wm],defines:{ATTRIBUTE_TYPE:n},parameters:{depthCompare:`always`,blendColorOperation:`max`,blendColorSrcFactor:`one`,blendColorDstFactor:`one`,blendAlphaOperation:`max`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one`}})}function Om(e){return e.createTexture({data:new Uint8Array(4),format:`rgba8unorm`,width:1,height:1})}function km(e,t){return e.createFramebuffer({id:`spring-transition-is-transitioning-framebuffer`,width:1,height:1,colorAttachments:[t]})}var Am={interpolation:_m,spring:Cm},jm=class{constructor(e,{id:t,timeline:n}){if(!e)throw Error(`AttributeTransitionManager is constructed without device`);this.id=t,this.device=e,this.timeline=n,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let e in this.transitions)this._removeTransition(e)}update({attributes:e,transitions:t,numInstances:n}){this.numInstances=n||1;for(let n in e){let r=e[n],i=r.getTransitionSetting(t);i&&this._updateAttribute(n,r,i)}for(let n in this.transitions){let r=e[n];(!r||!r.getTransitionSetting(t))&&this._removeTransition(n)}}hasAttribute(e){let t=this.transitions[e];return t&&t.inProgress}getAttributes(){let e={};for(let t in this.transitions){let n=this.transitions[t];n.inProgress&&(e[t]=n.attributeInTransition)}return e}run(){if(this.numInstances===0)return!1;for(let e in this.transitions)this.transitions[e].update()&&(this.needsRedraw=!0);let e=this.needsRedraw;return this.needsRedraw=!1,e}_removeTransition(e){this.transitions[e].delete(),delete this.transitions[e]}_updateAttribute(e,t,n){let r=this.transitions[e],i=!r||r.type!==n.type;if(i){r&&this._removeTransition(e);let a=Am[n.type];a?this.transitions[e]=new a({attribute:t,timeline:this.timeline,device:this.device}):(N.error(`unsupported transition type '${n.type}'`)(),i=!1)}(i||t.needsRedraw())&&(this.needsRedraw=!0,this.transitions[e].start(n,this.numInstances))}},Mm=`attributeManager.invalidate`,Nm=`attributeManager.updateStart`,Pm=`attributeManager.updateEnd`,Fm=`attribute.updateStart`,Im=`attribute.allocate`,Lm=`attribute.updateEnd`,Rm=class{constructor(e,{id:t=`attribute-manager`,stats:n,timeline:r}={}){this.mergeBoundsMemoized=Zs(Yl),this.id=t,this.device=e,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=n,this.attributeTransitionManager=new jm(e,{id:`${t}-transitions`,timeline:r}),this.attributeBufferGroups=e.type===`webgpu`?new im(e,{id:t,isTransitionAttribute:e=>this.attributeTransitionManager.hasAttribute(e)}):null,Object.seal(this)}finalize(){this.attributeBufferGroups?.finalize();for(let e in this.attributes)this.attributes[e].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(e={clearRedrawFlags:!1}){let t=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!e.clearRedrawFlags,t&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(e){this._add(e)}addInstanced(e){this._add(e,{stepMode:`instance`})}remove(e){for(let t of e)this.attributes[t]!==void 0&&(this.attributes[t].delete(),delete this.attributes[t])}invalidate(e,t){let n=this._invalidateTrigger(e,t);P(Mm,this,e,n)}invalidateAll(e){for(let t in this.attributes)this.attributes[t].setNeedsUpdate(t,e);P(Mm,this,`all`)}update({data:e,numInstances:t,startIndices:n=null,transitions:r,props:i={},buffers:a={},context:o={}}){let s=!1;P(Nm,this),this.stats&&this.stats.get(`Update Attributes`).timeStart();for(let r in this.attributes){let c=this.attributes[r],l=c.settings.accessor;c.startIndices=n,c.numInstances=t,i[r]&&N.removed(`props.${r}`,`data.attributes.${r}`)(),c.setExternalBuffer(a[r])||c.setBinaryValue(typeof l==`string`?a[l]:void 0,e.startIndices)||typeof l==`string`&&!a[l]&&c.setConstantValue(o,i[l])||c.needsUpdate()&&(s=!0,this._updateAttribute({attribute:c,numInstances:t,data:e,props:i,context:o})),this.needsRedraw=this.needsRedraw||c.needsRedraw()}s&&P(Pm,this,t),this.stats&&(this.stats.get(`Update Attributes`).timeEnd(),s&&this.stats.get(`Attributes updated`).incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:t,transitions:r})}updateTransition(){let{attributeTransitionManager:e}=this,t=e.run();return this.needsRedraw=this.needsRedraw||t,t}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getBounds(e){let t=e.map(e=>this.attributes[e]?.getBounds());return this.mergeBoundsMemoized(t)}getChangedAttributes(e={clearChangedFlags:!1}){let{attributes:t,attributeTransitionManager:n}=this,r={...n.getAttributes()};for(let i in t){let a=t[i];a.needsRedraw(e)&&!n.hasAttribute(i)&&(r[i]=a)}return r}getBufferLayouts(e){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),e):Object.values(this.getAttributes()).map(t=>t.getBufferLayout(e))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(e,t,n={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),e,t,n):{bufferLayouts:this.getBufferLayouts(t),buffers:{},groupedAttributeIds:new Set}}_add(e,t){for(let n in e){let r=e[n],i={...r,id:n,size:r.isIndexed&&1||r.size||1,...t};this.attributes[n]=new vp(this.device,i)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let e={};for(let t in this.attributes)this.attributes[t].getUpdateTriggers().forEach(n=>{e[n]||(e[n]=[]),e[n].push(t)});this.updateTriggers=e}_invalidateTrigger(e,t){let{attributes:n,updateTriggers:r}=this,i=r[e];return i&&i.forEach(e=>{let r=n[e];r&&r.setNeedsUpdate(r.id,t)}),i}_updateAttribute(e){let{attribute:t,numInstances:n}=e;if(P(Fm,t),t.constant){t.setConstantValue(e.context,t.value);return}t.allocate(n)&&P(Im,t,n),t.updateBuffer(e)&&(this.needsRedraw=!0,P(Lm,t,n))}},zm=class extends Ad{get value(){return this._value}_onUpdate(){let{time:e,settings:{fromValue:t,toValue:n,duration:r,easing:i}}=this;this._value=ri(t,n,i(e/r))}},Bm=1e-5;function Vm(e,t,n,r,i){let a=t-e;return(n-t)*i+-a*r+a+t}function Hm(e,t,n,r,i){if(Array.isArray(n)){let a=[];for(let o=0;o<n.length;o++)a[o]=Vm(e[o],t[o],n[o],r,i);return a}return Vm(e,t,n,r,i)}function Um(e,t){if(Array.isArray(e)){let n=0;for(let r=0;r<e.length;r++){let i=e[r]-t[r];n+=i*i}return Math.sqrt(n)}return Math.abs(e-t)}var Wm={interpolation:zm,spring:class extends Ad{get value(){return this._currValue}_onUpdate(){let{fromValue:e,toValue:t,damping:n,stiffness:r}=this.settings,{_prevValue:i=e,_currValue:a=e}=this,o=Hm(i,a,t,n,r),s=Um(o,t),c=Um(o,a);s<Bm&&c<Bm&&(o=t,this.end()),this._prevValue=a,this._currValue=o}}},Gm=class{constructor(e){this.transitions=new Map,this.timeline=e}get active(){return this.transitions.size>0}add(e,t,n,r){let{transitions:i}=this;if(i.has(e)){let n=i.get(e),{value:r=n.settings.fromValue}=n;t=r,this.remove(e)}if(r=_p(r),!r)return;let a=Wm[r.type];if(!a){N.error(`unsupported transition type '${r.type}'`)();return}let o=new a(this.timeline);o.start({...r,fromValue:t,toValue:n}),i.set(e,o)}remove(e){let{transitions:t}=this;t.has(e)&&(t.get(e).cancel(),t.delete(e))}update(){let e={};for(let[t,n]of this.transitions)n.update(),e[t]=n.value,n.inProgress||this.remove(t);return e}clear(){for(let e of this.transitions.keys())this.remove(e)}};function Km(e){let t=e[ad];for(let n in t){let r=t[n],{validate:i}=r;if(i&&!i(e[n],r))throw Error(`Invalid prop ${n}: ${e[n]}`)}}function qm(e,t){let n=Ym({newProps:e,oldProps:t,propTypes:e[ad],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),r=Zm(e,t),i=!1;return r||(i=Qm(e,t)),{dataChanged:r,propsChanged:n,updateTriggersChanged:i,extensionsChanged:$m(e,t),transitionsChanged:Jm(e,t)}}function Jm(e,t){if(!e.transitions)return!1;let n={},r=e[ad],i=!1;for(let a in e.transitions){let o=r[a],s=o&&o.type;(s===`number`||s===`color`||s===`array`)&&Xm(e[a],t[a],o)&&(n[a]=!0,i=!0)}return i?n:!1}function Ym({newProps:e,oldProps:t,ignoreProps:n={},propTypes:r={},triggerName:i=`props`}){if(t===e)return!1;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return`${i} changed shallowly`;for(let a of Object.keys(e))if(!(a in n)){if(!(a in t))return`${i}.${a} added`;let n=Xm(e[a],t[a],r[a]);if(n)return`${i}.${a} ${n}`}for(let a of Object.keys(t))if(!(a in n)){if(!(a in e))return`${i}.${a} dropped`;if(!Object.hasOwnProperty.call(e,a)){let n=Xm(e[a],t[a],r[a]);if(n)return`${i}.${a} ${n}`}}return!1}function Xm(e,t,n){let r=n&&n.equal;return r&&!r(e,t,n)||!r&&(r=e&&t&&e.equals,r&&!r.call(e,t))?`changed deeply`:!r&&t!==e?`changed shallowly`:null}function Zm(e,t){if(t===null)return`oldProps is null, initial diff`;let n=!1,{dataComparator:r,_dataDiff:i}=e;return r?r(e.data,t.data)||(n=`Data comparator detected a change`):e.data!==t.data&&(n=`A new data container was supplied`),n&&i&&(n=i(e.data,t.data)||n),n}function Qm(e,t){if(t===null||`all`in e.updateTriggers&&eh(e,t,`all`))return{all:!0};let n={},r=!1;for(let i in e.updateTriggers)i!==`all`&&eh(e,t,i)&&(n[i]=!0,r=!0);return r?n:!1}function $m(e,t){if(t===null)return!0;let n=t.extensions,{extensions:r}=e;if(r===n)return!1;if(!n||!r||r.length!==n.length)return!0;for(let e=0;e<r.length;e++)if(!r[e].equals(n[e]))return!0;return!1}function eh(e,t,n){let r=e.updateTriggers[n];r??={};let i=t.updateTriggers[n];return i??={},Ym({oldProps:i,newProps:r,triggerName:n})}var th=`count(): argument not an object`,nh=`count(): argument not a container`;function rh(e){if(!ah(e))throw Error(th);if(typeof e.count==`function`)return e.count();if(Number.isFinite(e.size))return e.size;if(Number.isFinite(e.length))return e.length;if(ih(e))return Object.keys(e).length;throw Error(nh)}function ih(e){return typeof e==`object`&&!!e&&e.constructor===Object}function ah(e){return typeof e==`object`&&!!e}function oh(e,t){if(!t)return e;let n={...e,...t};if(`defines`in t&&(n.defines={...e.defines,...t.defines}),`modules`in t&&(n.modules=(e.modules||[]).concat(t.modules),t.modules.some(e=>e.name===`project64`))){let e=n.modules.findIndex(e=>e.name===`project32`);e>=0&&n.modules.splice(e,1)}if(`inject`in t)if(!e.inject)n.inject=t.inject;else{let r={...e.inject};for(let e in t.inject)r[e]=(r[e]||``)+t.inject[e];n.inject=r}return n}var sh={minFilter:`linear`,mipmapFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},ch={};function lh(e,t,n,r){if(n instanceof v)return n;n.constructor&&n.constructor.name!==`Object`&&(n={data:n});let i=null;n.compressed&&(i={minFilter:`linear`,mipmapFilter:n.data.length>1?`nearest`:`linear`});let{width:a,height:o}=n.data,s=t.createTexture({...n,sampler:{...sh,...i,...r},mipLevels:t.getMipLevelCount(a,o)});return t.type===`webgl`?s.generateMipmapsWebGL():t.type===`webgpu`&&t.generateMipmapsWebGPU(s),ch[s.id]=e,s}function uh(e,t){!t||!(t instanceof v)||ch[t.id]===e&&(t.delete(),delete ch[t.id])}var dh={boolean:{validate(e,t){return!0},equal(e,t,n){return!!e==!!t}},number:{validate(e,t){return Number.isFinite(e)&&(!(`max`in t)||e<=t.max)&&(!(`min`in t)||e>=t.min)}},color:{validate(e,t){return t.optional&&!e||hh(e)&&(e.length===3||e.length===4)},equal(e,t,n){return G(e,t,1)}},accessor:{validate(e,t){let n=gh(e);return n===`function`||n===gh(t.value)},equal(e,t,n){return typeof t==`function`?!0:G(e,t,1)}},array:{validate(e,t){return t.optional&&!e||hh(e)},equal(e,t,n){let{compare:r}=n;return r?G(e,t,Number.isInteger(r)?r:r?1:0):e===t}},object:{equal(e,t,n){if(n.ignore)return!0;let{compare:r}=n;return r?G(e,t,Number.isInteger(r)?r:r?1:0):e===t}},function:{validate(e,t){return t.optional&&!e||typeof e==`function`},equal(e,t,n){return!n.compare&&n.ignore!==!1||e===t}},data:{transform:(e,t,n)=>{if(!e)return e;let{dataTransform:r}=n.props;return r?r(e):typeof e.shape==`string`&&e.shape.endsWith(`-table`)&&Array.isArray(e.data)?e.data:e}},image:{transform:(e,t,n)=>{let r=n.context;return!r||!r.device?null:lh(n.id,r.device,e,{...t.parameters,...n.props.textureParameters})},release:(e,t,n)=>{uh(n.id,e)}}};function fh(e){let t={},n={},r={};for(let[i,a]of Object.entries(e)){let e=a?.deprecatedFor;if(e)r[i]=Array.isArray(e)?e:[e];else{let e=ph(i,a);t[i]=e,n[i]=e.value}}return{propTypes:t,defaultProps:n,deprecatedProps:r}}function ph(e,t){switch(gh(t)){case`object`:return mh(e,t);case`array`:return mh(e,{type:`array`,value:t,compare:!1});case`boolean`:return mh(e,{type:`boolean`,value:t});case`number`:return mh(e,{type:`number`,value:t});case`function`:return mh(e,{type:`function`,value:t,compare:!0});default:return{name:e,type:`unknown`,value:t}}}function mh(e,t){return`type`in t?{name:e,...dh[t.type],...t}:`value`in t?{name:e,type:gh(t.value),...t}:{name:e,type:`object`,value:t}}function hh(e){return Array.isArray(e)||ArrayBuffer.isView(e)}function gh(e){return hh(e)?`array`:e===null?`null`:typeof e}function _h(e,t){let n;for(let e=t.length-1;e>=0;e--){let r=t[e];`extensions`in r&&(n=r.extensions)}let r=yh(e.constructor,n),i=Object.create(r);i[id]=e,i[cd]={},i[ld]={};for(let e=0;e<t.length;++e){let n=t[e];for(let e in n)i[e]=n[e]}return Object.freeze(i),i}var vh=`_mergedDefaultProps`;function yh(e,t){if(!(e instanceof kh.constructor))return{};let n=vh;if(t)for(let e of t){let t=e.constructor;t&&(n+=`:${t.extensionName||t.name}`)}return Eh(e,n)||(e[n]=bh(e,t||[]))}function bh(e,t){if(!e.prototype)return null;let n=yh(Object.getPrototypeOf(e)),r=fh(Eh(e,`defaultProps`)||{}),i=Object.assign(Object.create(null),n,r.defaultProps),a=Object.assign(Object.create(null),n?.[ad],r.propTypes),o=Object.assign(Object.create(null),n?.[od],r.deprecatedProps);for(let e of t){let t=yh(e.constructor);t&&(Object.assign(i,t),Object.assign(a,t[ad]),Object.assign(o,t[od]))}return xh(i,e),Ch(i,a),Sh(i,o),i[ad]=a,i[od]=o,t.length===0&&!Th(e,`_propTypes`)&&(e._propTypes=a),i}function xh(e,t){let n=Dh(t);Object.defineProperties(e,{id:{writable:!0,value:n}})}function Sh(e,t){for(let n in t)Object.defineProperty(e,n,{enumerable:!1,set(e){let r=`${this.id}: ${n}`;for(let r of t[n])Th(this,r)||(this[r]=e);N.deprecated(r,t[n].join(`/`))()}})}function Ch(e,t){let n={},r={};for(let e in t){let i=t[e],{name:a,value:o}=i;i.async&&(n[a]=o,r[a]=wh(a))}e[sd]=n,e[cd]={},Object.defineProperties(e,r)}function wh(e){return{enumerable:!0,set(t){typeof t==`string`||t instanceof Promise||dp(t)?this[cd][e]=t:this[ld][e]=t},get(){if(this[ld]){if(e in this[ld])return this[ld][e]||this[sd][e];if(e in this[cd]){let t=this[id]&&this[id].internalState;if(t&&t.hasAsyncProp(e))return t.getAsyncProp(e)||this[sd][e]}}return this[sd][e]}}}function Th(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function Eh(e,t){return Th(e,t)&&e[t]}function Dh(e){let t=e.componentName;return t||N.warn(`${e.name}.componentName not specified`)(),t||e.name}var Oh=0,kh=class{constructor(...e){this.props=_h(this,e),this.id=this.props.id,this.count=Oh++}clone(e){let{props:t}=this,n={};for(let e in t[sd])e in t[ld]?n[e]=t[ld][e]:e in t[cd]&&(n[e]=t[cd][e]);return new this.constructor({...t,...n,...e})}};kh.componentName=`Component`,kh.defaultProps={};var Ah=Object.freeze({}),jh=class{constructor(e){this.component=e,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let e in this.asyncProps){let t=this.asyncProps[e];t&&t.type&&t.type.release&&t.type.release(t.resolvedValue,t.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||Ah}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(e){return e in this.asyncProps}getAsyncProp(e){let t=this.asyncProps[e];return t&&t.resolvedValue}isAsyncPropLoading(e){if(e){let t=this.asyncProps[e];return!!(t&&t.pendingLoadCount>0&&t.pendingLoadCount!==t.resolvedLoadCount)}for(let e in this.asyncProps)if(this.isAsyncPropLoading(e))return!0;return!1}reloadAsyncProp(e,t){this._watchPromise(e,Promise.resolve(t))}setAsyncProps(e){this.component=e[id]||this.component;let t=e[ld]||{},n=e[cd]||e,r=e[sd]||{};for(let e in t){let n=t[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,n),t[e]=this.getAsyncProp(e)}for(let e in n){let t=n[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,t)}}_fetch(e,t){return null}_onResolve(e,t){}_onError(e,t){}_updateAsyncProp(e,t){if(this._didAsyncInputValueChange(e,t)){if(typeof t==`string`&&(t=this._fetch(e,t)),t instanceof Promise){this._watchPromise(e,t);return}if(dp(t)){this._resolveAsyncIterable(e,t);return}this._setPropValue(e,t)}}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps){this.oldAsyncProps=Object.create(this.oldProps);for(let e in this.asyncProps)Object.defineProperty(this.oldAsyncProps,e,{enumerable:!0,value:this.oldProps[e]})}}_didAsyncInputValueChange(e,t){let n=this.asyncProps[e];return t===n.resolvedValue||t===n.lastValue?!1:(n.lastValue=t,!0)}_setPropValue(e,t){this._freezeAsyncOldProps();let n=this.asyncProps[e];n&&(t=this._postProcessValue(n,t),n.resolvedValue=t,n.pendingLoadCount++,n.resolvedLoadCount=n.pendingLoadCount)}_setAsyncPropValue(e,t,n){let r=this.asyncProps[e];r&&n>=r.resolvedLoadCount&&t!==void 0&&(this._freezeAsyncOldProps(),r.resolvedValue=t,r.resolvedLoadCount=n,this.onAsyncPropUpdated(e,t))}_watchPromise(e,t){let n=this.asyncProps[e];if(n){n.pendingLoadCount++;let r=n.pendingLoadCount;t.then(t=>{this.component&&(t=this._postProcessValue(n,t),this._setAsyncPropValue(e,t,r),this._onResolve(e,t))}).catch(t=>{this._onError(e,t)})}}async _resolveAsyncIterable(e,t){if(e!==`data`){this._setPropValue(e,t);return}let n=this.asyncProps[e];if(!n)return;n.pendingLoadCount++;let r=n.pendingLoadCount,i=[],a=0;for await(let n of t){if(!this.component)return;let{dataTransform:t}=this.component.props;i=t?t(n,i):i.concat(n),Object.defineProperty(i,`__diff`,{enumerable:!1,value:[{startRow:a,endRow:i.length}]}),a=i.length,this._setAsyncPropValue(e,i,r)}this._onResolve(e,i)}_postProcessValue(e,t){let n=e.type;return n&&this.component&&(n.release&&n.release(e.resolvedValue,n,this.component),n.transform)?n.transform(t,n,this.component):t}_createAsyncPropData(e,t){if(!this.asyncProps[e]){let n=this.component&&this.component.props[ad];this.asyncProps[e]={type:n&&n[e],lastValue:null,resolvedValue:t,pendingLoadCount:0,resolvedLoadCount:0}}}},Mh=class extends jh{constructor({attributeManager:e,layer:t}){super(t),this.attributeManager=e,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}_fetch(e,t){let n=this.layer,r=n?.props.fetch;return r?r(t,{propName:e,layer:n}):super._fetch(e,t)}_onResolve(e,t){let n=this.layer;if(n){let r=n.props.onDataLoad;e===`data`&&r&&r(t,{propName:e,layer:n})}}_onError(e,t){let n=this.layer;n&&n.raiseError(t,`loading ${e} of ${this.layer}`)}},Nh=`layer.changeFlag`,Ph=`layer.initialize`,Fh=`layer.update`,Ih=`layer.finalize`,Lh=`layer.matched`,Rh=2**24-1,zh=Object.freeze([]),Bh=Zs(({oldViewport:e,viewport:t})=>e.equals(t)),X=new Uint8ClampedArray;function Vh(e){return e.rowIndexes||e.pickingColors||e.instancePickingColors}function Hh(e){return e.rowIndexes}function Uh(e){return e.pickingColors||e.instancePickingColors}var Wh={data:{type:`data`,value:zh,async:!0},dataComparator:{type:`function`,value:null,optional:!0},_dataDiff:{type:`function`,value:e=>e&&e.__diff,optional:!0},dataTransform:{type:`function`,value:null,optional:!0},onDataLoad:{type:`function`,value:null,optional:!0},onError:{type:`function`,value:null,optional:!0},fetch:{type:`function`,value:(e,{propName:t,layer:n,loaders:r,loadOptions:i,signal:a})=>{let{resourceManager:o}=n.context;i||=n.getLoadOptions(),r||=n.props.loaders,a&&(i={...i,core:{...i?.core,fetch:{...i?.core?.fetch,signal:a}}});let s=o.contains(e);return!s&&!i&&(o.add({resourceId:e,data:Zn(e,r),persistent:!1}),s=!0),s?o.subscribe({resourceId:e,onChange:e=>n.internalState?.reloadAsyncProp(t,e),consumerId:n.id,requestId:t}):Zn(e,r,i)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:`number`,min:0,max:1,value:1},operation:`draw`,onHover:{type:`function`,value:null,optional:!0},onClick:{type:`function`,value:null,optional:!0},onDragStart:{type:`function`,value:null,optional:!0},onDrag:{type:`function`,value:null,optional:!0},onDragEnd:{type:`function`,value:null,optional:!0},coordinateSystem:`default`,coordinateOrigin:{type:`array`,value:[0,0,0],compare:!0},modelMatrix:{type:`array`,value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:`XYZ`,colorFormat:`RGBA`,parameters:{type:`object`,value:{},optional:!0,compare:2},loadOptions:{type:`object`,value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:`array`,value:[],optional:!0,ignore:!0},getPolygonOffset:{type:`function`,value:({layerIndex:e})=>[0,-e*100]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:`accessor`,value:[0,0,128,128]}},Gh=class extends kh{constructor(){super(...arguments),this.internalState=null,this.lifecycle=rd.NO_STATE,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,`layerName`)?this.layerName:``}get root(){let e=this;for(;e.parent;)e=e.parent;return e}toString(){return`${this.constructor.layerName||this.constructor.name}({id: '${this.props.id}'})`}project(e){J(this.internalState);let t=this.internalState.viewport||this.context.viewport,[n,r,i]=zc(ou(e,{viewport:t,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem}),t.pixelProjectionMatrix);return e.length===2?[n,r]:[n,r,i]}unproject(e){return J(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(e)}projectPosition(e,t){return J(this.internalState),su(e,{viewport:this.internalState.viewport||this.context.viewport,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem,...t})}get isComposite(){return!1}get isDrawable(){return!0}setState(e){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,e),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return this.internalState?!this.internalState.isAsyncPropLoading():!1}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let e=this.state;return e&&(e.models||e.model&&[e.model])||[]}setShaderModuleProps(...e){for(let t of this.getModels())t.shaderInputs.setProps(...e)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}use64bitPositions(){let{coordinateSystem:e}=this.props;return e===`default`||e===`lnglat`||e===`cartesian`}onHover(e,t){return this.props.onHover&&this.props.onHover(e,t)||!1}onClick(e,t){return this.props.onClick&&this.props.onClick(e,t)||!1}nullPickingColor(){return[0,0,0]}encodePickingColor(e,t=[]){return t[0]=e+1&255,t[1]=e+1>>8&255,t[2]=e+1>>8>>8&255,t}decodePickingColor(e){J(e instanceof Uint8Array);let[t,n,r]=e;return t+n*256+r*65536-1}getNumInstances(){return Number.isFinite(this.props.numInstances)?this.props.numInstances:this.state&&this.state.numInstances!==void 0?this.state.numInstances:rh(this.props.data)}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds([`positions`,`instancePositions`])}getShaders(e){e=oh(e,{disableWarnings:!0,modules:this.context.defaultShaderModules});for(let t of this.props.extensions)e=oh(e,t.getShaders.call(this,t));return e}shouldUpdateState(e){return e.changeFlags.propsOrDataChanged}updateState(e){let t=this.getAttributeManager(),{dataChanged:n}=e.changeFlags;if(n&&t)if(Array.isArray(n))for(let e of n)t.invalidateAll(e);else t.invalidateAll();if(t){let{props:n}=e,r=this.internalState.hasPickingBuffer,i=Number.isInteger(n.highlightedObjectIndex)||!!n.pickable||n.extensions.some(e=>e.getNeedsPickingBuffer.call(this,e));if(r!==i){this.internalState.hasPickingBuffer=i;let e=Vh(t.attributes);e&&(i&&e.constant&&(e.constant=!1,t.invalidate(e.id)),!e.value&&!i&&(e.constant=!0,e.value=Hh(t.attributes)?[sl]:[0,0,0]))}}}finalizeState(e){for(let e of this.getModels())e.destroy();let t=this.getAttributeManager();t&&t.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(e){for(let t of this.getModels())t.draw(e.renderPass)}getPickingInfo({info:e,mode:t,sourceLayer:n}){let{index:r}=e;return r>=0&&Array.isArray(this.props.data)&&(e.object=this.props.data[r]),e}raiseError(e,t){t&&(e=Error(`${t}: ${e.message}`,{cause:e})),this.props.onError?.(e)||this.context?.onError?.(e,this)}getNeedsRedraw(e={clearRedrawFlags:!1}){return this._getNeedsRedraw(e)}needsUpdate(){return this.internalState?this.internalState.needsUpdate||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()):!1}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(e){if(!this.internalState)return;let t=this.internalState.viewport;this.internalState.viewport=e,(!t||!Bh({oldViewport:t,viewport:e}))&&(this.setChangeFlags({viewportChanged:!0}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(e=`all`){let t=this.getAttributeManager();t&&(e===`all`?t.invalidateAll():t.invalidate(e))}updateAttributes(e){let t=!1;for(let n in e)e[n].layoutChanged()&&(t=!0);for(let n of this.getModels())this._setModelAttributes(n,e,t)}_updateAttributes(){let e=this.getAttributeManager();if(!e)return;let t=this.props,n=this.getNumInstances(),r=this.getStartIndices();e.update({data:t.data,numInstances:n,startIndices:r,props:t,transitions:t.transitions,buffers:t.data.attributes,context:this});let i=e.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(i)}_updateAttributeTransition(){let e=this.getAttributeManager();e&&e.updateTransition()}_updateUniformTransition(){let{uniformTransitions:e}=this.internalState;if(e.active){let t=e.update(),n=Object.create(this.props);for(let e in t)Object.defineProperty(n,e,{value:t[e]});return n}return this.props}calculateInstancePickingColors(e,{numInstances:t}){if(e.constant)return;let n=Math.floor(X.length/4);this.internalState.usesPickingColorCache=!0;let r=t>0&&X[0]===0;if(n<t||r){t>Rh&&N.warn(`Layer has too many data objects. Picking might not be able to distinguish all objects.`)(),X=zl.allocate(X,t,{size:4,copy:!0,maxCount:Math.max(t,Rh)});let e=Math.floor(X.length/4),i=[0,0,0],a=r?0:n;for(let t=a;t<e;t++)this.encodePickingColor(t,i),X[t*4+0]=i[0],X[t*4+1]=i[1],X[t*4+2]=i[2],X[t*4+3]=0}e.value=X.subarray(0,t*4)}_setModelAttributes(e,t,n=!1){if(!Object.keys(t).length)return;let r=this.getAttributeManager();if(r?.hasBufferGroups()){this._setGroupedModelAttributes(e,r,t);return}if(n){let n=this.getAttributeManager();e.setBufferLayout(n.getBufferLayouts(e)),t=n.getAttributes()}let a=e.userData?.excludeAttributes||{},o={},s={};for(let n in t){if(a[n])continue;let r=t[n].getValue();for(let a in r){let c=r[a];c instanceof i?t[n].settings.isIndexed?e.setIndexBuffer(c):o[a]=c:c&&(s[a]=c)}}e.setAttributes(o),e.setConstantAttributes(s)}_setGroupedModelAttributes(e,t,n){let r=e.userData?.excludeAttributes||{},a=t.getBufferGroupBindings(n,e,r);e.setBufferLayout(a.bufferLayouts);let o={...a.buffers},s={},c=t.getAttributes();for(let t in c){if(r[t]||a.groupedAttributeIds.has(t))continue;let n=c[t],l=n.getValue();for(let t in l){let r=l[t];r instanceof i?n.settings.isIndexed?e.setIndexBuffer(r):o[t]=r:r&&(s[t]=r)}}e.setAttributes(o),e.setConstantAttributes(s)}disablePickingIndex(e){let t=this.props.data;if(!(`attributes`in t)){this._disablePickingIndex(e);return}let n=this.getAttributeManager().attributes,r=Hh(n),i=Uh(n),a=r&&t.attributes&&t.attributes[r.id];if(a&&a.value){let n=a.value;for(let i=0;i<t.length;i++)n[r.getVertexOffset(i)]===e&&this._disablePickingIndex(i);return}let o=i&&t.attributes&&t.attributes[i.id];if(o&&o.value){let n=o.value,r=this.encodePickingColor(e);for(let e=0;e<t.length;e++){let t=i.getVertexOffset(e);n[t]===r[0]&&n[t+1]===r[1]&&n[t+2]===r[2]&&this._disablePickingIndex(e)}}else this._disablePickingIndex(e)}_disablePickingIndex(e){let t=this.getAttributeManager().attributes,n=Hh(t);if(n){let t=n.getVertexOffset(e),r=n.getVertexOffset(e+1),i=new Uint32Array(r-t);i.fill(sl),n.buffer.write(i,t*i.BYTES_PER_ELEMENT);return}let r=Uh(t);if(!r){this.internalState&&cl(this.internalState.disabledPickingIndices,e);return}let i=r.getVertexOffset(e),a=r.getVertexOffset(e+1);r.buffer.write(new Uint8Array(a-i),i)}restorePickingColors(){let e=this.getAttributeManager().attributes,t=Vh(e);if(!t){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let n=Uh(e);this.internalState.usesPickingColorCache&&n&&n.value.buffer!==X.buffer&&(n.value=X.subarray(0,n.value.length)),t.updateSubBuffer({startOffset:0})}_initialize(){J(!this.internalState),P(Ph,this);let e=this._getAttributeManager();this.internalState=new Mh({attributeManager:e,layer:this}),this._clearChangeFlags(),this.state={},Object.defineProperty(this.state,`attributeManager`,{get:()=>(N.deprecated(`layer.state.attributeManager`,`layer.getAttributeManager()`)(),e)}),this.internalState.uniformTransitions=new Gm(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context);for(let e of this.props.extensions)e.initializeState.call(this,this.context,e);this.setChangeFlags({dataChanged:`init`,propsChanged:`init`,viewportChanged:!0,extensionsChanged:!0}),this._update()}_transferState(e){P(Lh,this,this===e);let{state:t,internalState:n}=e;this!==e&&(this.internalState=n,this.state=t,this.internalState.setAsyncProps(this.props),this._diffProps(this.props,this.internalState.getOldProps()))}_update(){let e=this.needsUpdate();if(P(Fh,this,e),!e)return;this.context.stats.get(`Layer updates`).incrementCount();let t=this.props,n=this.context,r=this.internalState,i=n.viewport,a=this._updateUniformTransition();r.propsInTransition=a,n.viewport=r.viewport||i,this.props=a;try{let e=this._getUpdateParams(),t=this.getModels();if(n.device)this.updateState(e);else try{this.updateState(e)}catch{}for(let t of this.props.extensions)t.updateState.call(this,e,t);this.setNeedsRedraw(),this._updateAttributes();let r=this.getModels()[0]!==t[0];this._postUpdate(e,r)}finally{n.viewport=i,this.props=t,this._clearChangeFlags(),r.needsUpdate=!1,r.resetOldProps()}}_finalize(){P(Ih,this),this.finalizeState(this.context);for(let e of this.props.extensions)e.finalizeState.call(this,this.context,e)}_drawLayer({renderPass:e,shaderModuleProps:t=null,uniforms:n={},parameters:r={}}){this._updateAttributeTransition();let i=this.props,a=this.context;this.props=this.internalState.propsInTransition||i;try{t&&this.setShaderModuleProps(t);let{getPolygonOffset:i}=this.props,o=i&&i(n)||[0,0];a.device instanceof S&&a.device.setParametersWebGL({polygonOffset:o});let s=a.device instanceof S?null:Kh(r);if(qh(this.getModels(),e,r,s),a.device instanceof S)a.device.withParametersWebGL(r,()=>{let i={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:r,context:a};for(let e of this.props.extensions)e.draw.call(this,i,e);this.draw(i)});else{s?.renderPassParameters&&e.setParameters(s.renderPassParameters);let i={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:r,context:a};for(let e of this.props.extensions)e.draw.call(this,i,e);this.draw(i)}}finally{this.props=i}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(e){if(!this.internalState)return;let{changeFlags:t}=this.internalState;for(let n in e)if(e[n]){let r=!1;switch(n){case`dataChanged`:let i=e[n],a=t[n];i&&Array.isArray(a)&&(t.dataChanged=Array.isArray(i)?a.concat(i):i,r=!0);default:t[n]||(t[n]=e[n],r=!0)}r&&P(Nh,this,n,e)}let n=!!(t.dataChanged||t.updateTriggersChanged||t.propsChanged||t.extensionsChanged);t.propsOrDataChanged=n,t.somethingChanged=n||t.viewportChanged||t.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(e,t){let n=qm(e,t);if(n.updateTriggersChanged)for(let e in n.updateTriggersChanged)n.updateTriggersChanged[e]&&this.invalidateAttribute(e);if(n.transitionsChanged)for(let r in n.transitionsChanged)this.internalState.uniformTransitions.add(r,t[r],e[r],e.transitions?.[r]);return this.setChangeFlags(n)}validateProps(){Km(this.props)}updateAutoHighlight(e){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(e)}_updateAutoHighlight(e){let t={highlightedObjectColor:e.picked?e.color:null},{highlightColor:n}=this.props;e.picked&&typeof n==`function`&&(t.highlightColor=n(e)),this.setShaderModuleProps({picking:t}),this.setNeedsRedraw()}_getAttributeManager(){let e=this.context;return new Rm(e.device,{id:this.props.id,stats:e.stats,timeline:e.timeline})}_postUpdate(e,t){let{props:n,oldProps:r}=e,i=this.state.model;i?.isInstanced&&i.setInstanceCount(this.getNumInstances());let{autoHighlight:a,highlightedObjectIndex:o,highlightColor:s}=n;if(t||r.autoHighlight!==a||r.highlightedObjectIndex!==o||r.highlightColor!==s){let e={};Array.isArray(s)&&(e.highlightColor=s),(t||r.autoHighlight!==a||o!==r.highlightedObjectIndex)&&(e.highlightedObjectColor=Number.isFinite(o)&&o>=0?this.encodePickingColor(o):null),this.setShaderModuleProps({picking:e})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(e){if(!this.internalState)return!1;let t=!1;t||=this.internalState.needsRedraw&&this.id;let n=this.getAttributeManager(),r=n?n.getNeedsRedraw(e):!1;if(t||=r,t)for(let e of this.props.extensions)e.onNeedsRedraw.call(this,e);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!e.clearRedrawFlags,t}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}};Gh.defaultProps=Wh,Gh.layerName=`Layer`;function Kh(e){let{blendConstant:t,...n}=e;return t?{pipelineParameters:n,renderPassParameters:{blendConstant:t}}:{pipelineParameters:n}}function qh(e,t,n,r){for(let i of e)i.device.type===`webgpu`?(Jh(i,t),i.setParameters({...i.parameters,...r?.pipelineParameters})):i.setParameters(n)}function Jh(e,t){let n=t.props.framebuffer||(t.framebuffer??null);if(!n)return;let r=n.colorAttachments.map(e=>e?.texture?.format??null),i=n.depthStencilAttachment?.texture?.format,a=e;(!Yh(a.props.colorAttachmentFormats,r)||a.props.depthStencilAttachmentFormat!==i)&&(a.props.colorAttachmentFormats=r,a.props.depthStencilAttachmentFormat=i,a._setPipelineNeedsUpdate(`attachment formats`))}function Yh(e,t){if(e===t)return!0;if(!e||!t||e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}var Xh=Math.PI/180,Zh=180/Math.PI,Qh=1,$h=6370972,eg=.75,tg=1.15;function ng(e){let t=Vl(e+180,360)-180;return Math.abs(t)<Qh}function rg(){let e=256/$h,t=Math.PI/180*256;return{unitsPerMeter:[e,e,e],unitsPerMeter2:[0,0,0],metersPerUnit:[1/e,1/e,1/e],unitsPerDegree:[t,t,e],unitsPerDegree2:[0,0,0],degreesPerUnit:[1/t,1/t,1/e]}}var ig=class extends tu{constructor(e={}){let{longitude:t=0,bearing:n=0,pitch:r=0,zoom:i=0,nearZMultiplier:a=.5,farZMultiplier:o=1,resolution:s=10}=e,{latitude:c=0,height:l,altitude:u=1.5,fovy:d}=e;c=Math.max(Math.min(c,90),-90),l||=1,d?u=Rc(d):d=Lc(u);let f=2**(i-ag(Math.max(Math.min(c,Ec),-Ec))),p=r*Xh,m=e.nearZ??a,h=e.farZ??(u+256*2*f/l/Math.max(Math.cos(p),.1))*o,g=new R().lookAt({eye:[0,-u,0],up:[0,0,1]}).rotateX(-p).rotateY(-n*Xh).rotateX(c*Xh).rotateZ(-t*Xh).scale(f/l);super({...e,height:l,viewMatrix:g,longitude:t,latitude:c,zoom:i,distanceScales:rg(),fovy:d,focalDistance:u,near:m,far:h}),this.scale=f,this.latitude=c,this.longitude=t,this.bearing=n,this.pitch=r,this.fovy=d,this.resolution=s}get projectionMode(){return H.GLOBE}getDistanceScales(){return this.distanceScales}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,this.height/2],t),r=this.unproject([this.width/2,0],t),i=this.unproject([this.width,this.height/2],t),a=this.unproject([this.width/2,this.height],t);return i[0]<this.longitude&&(i[0]+=360),n[0]>this.longitude&&(n[0]-=360),[Math.min(n[0],i[0],r[0],a[0]),Math.min(n[1],i[1],r[1],a[1]),Math.max(n[0],i[0],r[0],a[0]),Math.max(n[1],i[1],r[1],a[1])]}_getRayToGlobe(e,{topLeft:t=!0,targetZ:n}={}){let[r,i]=e,a=t?i:this.height-i,{pixelUnprojectionMatrix:o}=this,s=og(o,[r,a,-1,1]),c=og(o,[r,a,1,1]),l=((n||0)/$h+1)*256,u=zi(Li([],s,c)),d=zi(s),f=zi(c);return{rayStartPosition:s,rayEndPosition:c,radius:l,rayLengthSquared:u,rayStartDistanceSquared:d,distanceToCenterSquared:4*((4*d*f-(u-d-f)**2)/16)/u}}_getRayDistanceToGlobeCenterRatio(e,t){let{distanceToCenterSquared:n,radius:r}=this._getRayToGlobe(e,t);return Math.sqrt(Math.max(0,n))/r}getZoomAnchorStrength(e){let t=this._getRayDistanceToGlobeCenterRatio(e);if(t>=tg)return 0;let n=Math.max(0,Math.min(1,(t-eg)/(tg-eg)));return 1-n*n*(3-2*n)}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[r,i,a]=e,o=t?i:this.height-i,{pixelUnprojectionMatrix:s}=this,c;if(Number.isFinite(a))c=og(s,[r,o,a,1]);else{let{rayStartPosition:r,rayEndPosition:i,radius:a,rayLengthSquared:o,rayStartDistanceSquared:s,distanceToCenterSquared:l}=this._getRayToGlobe(e,{topLeft:t,targetZ:n});c=ki([],r,i,(Math.sqrt(s-l)-Math.sqrt(Math.max(0,a*a-l)))/Math.sqrt(o))}let[l,u,d]=this.unprojectPosition(c);return Number.isFinite(a)?[l,u,d]:Number.isFinite(n)?[l,u,n]:[l,u]}projectPosition(e){let[t,n,r=0]=e,i=t*Xh,a=n*Xh,o=Math.cos(a),s=(r/$h+1)*256;return[Math.sin(i)*o*s,-Math.cos(i)*o*s,Math.sin(a)*s]}unprojectPosition(e){let[t,n,r]=e,i=Ri(e),a=Math.asin(r/i);return[Math.atan2(t,-n)*Zh,a*Zh,(i/256-1)*$h]}projectFlat(e){return e}unprojectFlat(e){return e}panByPosition(e,t,n){if(!n){let n=this.getZoomAnchorStrength(t);if(n===0)return{longitude:this.longitude,latitude:this.latitude};let r=this.unproject(t),i=Vl(e[0]-r[0]+180,360)-180,a=e[1]-r[1],o=Math.abs(r[1])>85.051129||Math.abs(i)>90;if(ng(this.bearing)&&o)return{longitude:this.longitude,latitude:this.latitude};if(ng(this.bearing)&&a!==0){let e=((a>0?Ec:-Ec)-this.latitude)/a;n=Math.min(n,Math.max(0,e))}return{longitude:this.longitude+i*n,latitude:Math.max(Math.min(this.latitude+a*n,90),-90)}}let[r,i,a]=e,o=.25/2**(this.zoom-ag(this.latitude)),s=r+o*(n[0]-t[0]),c=i-o*(n[1]-t[1]);c=Math.max(Math.min(c,90),-90);let l={longitude:s,latitude:c,zoom:a-ag(i)};return l.zoom+=ag(l.latitude),l}};ig.displayName=`GlobeViewport`;function ag(e,t){t&&(e=Math.max(Math.min(e,Ec),-Ec));let n=Math.PI*Math.cos(e*Math.PI/180);return Math.log2(n)}function og(e,t){let n=ca([],t,e);return sa(n,n,1/n[3]),n}function sg(e,t,n){let r=e.projectPosition([t[0],t[1],t[2]||0]),i=n.map((e,t)=>e-r[t]),a=e.getDistanceScales([...t]);if(e instanceof ig){let e=Math.hypot(...r),t=r.map(t=>t/e),n=Math.hypot(t[0],t[1]),o=Math.abs(t[2])===1?[1,0,0]:[t[1]/n,-t[0]/n,0],s=[t[1]*o[2]-t[2]*o[1],t[2]*o[0]-t[0]*o[2],t[0]*o[1]-t[1]*o[0]],c=e=>e.reduce((e,t,n)=>e+t*i[n],0);return[-c(o)/a.unitsPerMeter[0],-c(s)/a.unitsPerMeter[1],c(t)/a.unitsPerMeter[2]]}let o=a.unitsPerMeter,{unitsPerMeter2:s=[0,0,0]}=a,c=Math.max(0,o[1]**2+4*s[1]*i[1]),l=2*i[1]/(o[1]+Math.sqrt(c));return[i[0]/(o[0]+s[0]*l),l,i[2]/(o[2]+s[2]*l)]}var cg=Object.freeze({low:Object.freeze({cascadeCount:3,directionalMapSize:1024,spotMapSize:512,pointMapSize:256,blockerSampleCount:8,filterSampleCount:12,contactScale:.5,contactStepCount:12}),balanced:Object.freeze({cascadeCount:4,directionalMapSize:1536,spotMapSize:1024,pointMapSize:512,blockerSampleCount:16,filterSampleCount:24,contactScale:.75,contactStepCount:24}),cinematic:Object.freeze({cascadeCount:4,directionalMapSize:2048,spotMapSize:2048,pointMapSize:1024,blockerSampleCount:24,filterSampleCount:48,contactScale:1,contactStepCount:40})}),lg=1,ug=4,dg=4,fg=4,pg=6,mg=.1,hg=[1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1],gg=[1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],_g=[{face:`+X`,direction:[1,0,0],up:[0,-1,0]},{face:`-X`,direction:[-1,0,0],up:[0,-1,0]},{face:`+Y`,direction:[0,1,0],up:[0,0,1]},{face:`-Y`,direction:[0,-1,0],up:[0,0,-1]},{face:`+Z`,direction:[0,0,1],up:[0,-1,0]},{face:`-Z`,direction:[0,0,-1],up:[0,-1,0]}],vg=0,yg=class{device;props;inputProps;resources;destroyed=!1;constructor(e,t={}){if(e.type!==`webgpu`&&e.type!==`webgl`)throw Error(`ShadowMapRenderer requires a WebGPU or WebGL2 device.`);this.device=e,this.inputProps={...t},this.props=wg(e,this.inputProps),this.resources=Tg(e,this.props)}setProps(e){this.assertNotDestroyed();let t={...this.inputProps,...e},n=wg(this.device,t),r=!kg(this.props,n);if(this.inputProps=t,this.props=n,!r)return;let i=this.resources;this.resources=Tg(this.device,n),Og(i)}render(e){this.assertNotDestroyed(),Pg(e.camera);let t=e.directionalLights||[],n=e.spotLights||[],r=e.pointLights||[];Lg(`directional`,t.length,this.props.directionalLightCapacity),Lg(`spot`,n.length,this.props.spotLightCapacity),Lg(`point`,r.length,this.props.pointLightCapacity);let i=[],a=zg([],e.camera.far);if(t[0]){let n=Ag(t[0],e.camera);a=zg(bg(e.camera.near,n.shadowDistance,this.props.cascadeCount,n.cascadeSplitLambda),n.shadowDistance),i.push(...xg(e.camera,n,a,this.props.cascadeCount,this.props.directionalMapSize)),i.forEach((t,r)=>{this.renderView({framebuffer:this.resources.directionalFramebuffers[r],view:t,type:`directional`,lightIndex:0,cascadeIndex:r,mapSize:this.props.directionalMapSize,light:n,drawShadowCasters:e.drawShadowCasters})})}let o=n.map(e=>Sg(jg(e)));o.forEach((t,r)=>{this.renderView({framebuffer:this.resources.spotFramebuffers[r],view:t,type:`spot`,lightIndex:r,mapSize:this.props.spotMapSize,light:jg(n[r]),drawShadowCasters:e.drawShadowCasters})});let s=r.flatMap(e=>Cg(Mg(e)));return r.forEach((t,n)=>{let r=Mg(t);for(let t=0;t<pg;t++){let i=n*pg+t;this.renderView({framebuffer:this.resources.pointFramebuffers[i],view:s[i],type:`point`,lightIndex:n,pointFace:_g[t].face,mapSize:this.props.pointMapSize,light:r,drawShadowCasters:e.drawShadowCasters})}}),{quality:this.props.quality,cascadeCount:this.props.cascadeCount,cascadeSplits:a,blockerSampleCount:this.props.blockerSampleCount,filterSampleCount:this.props.filterSampleCount,directionalLights:t.map(t=>Ag(t,e.camera)),spotLights:n.map(jg),pointLights:r.map(Mg),directionalViewProjectionMatrices:Bg(i.map(e=>e.viewProjectionMatrix),fg),spotViewProjectionMatrices:Bg(o.map(e=>e.viewProjectionMatrix),ug),pointViewProjectionMatrices:Bg(s.map(e=>e.viewProjectionMatrix),dg*pg),directionalShadowTexture:this.resources.directionalTexture,spotShadowTexture:this.resources.spotTexture,pointShadowTexture:this.resources.pointTexture,comparisonSampler:this.resources.comparisonSampler,nonFilteringSampler:this.resources.nonFilteringSampler}}destroy(){this.destroyed||(this.destroyed=!0,Og(this.resources))}renderView(e){let t=Object.freeze({depthWriteEnabled:!0,depthCompare:`less-equal`,depthBias:e.light.depthBias,depthBiasSlopeScale:e.light.depthBiasSlopeScale,cullMode:`back`}),n=this.device.beginRenderPass({id:Qg(`${e.type}-shadow-pass`),framebuffer:e.framebuffer,clearDepth:1});try{e.drawShadowCasters({renderPass:n,type:e.type,lightIndex:e.lightIndex,cascadeIndex:e.cascadeIndex,pointFace:e.pointFace,camera:e.view.camera,viewProjectionMatrix:e.view.viewProjectionMatrix,mapSize:e.mapSize,rasterParameters:t})}finally{n.end()}}assertNotDestroyed(){if(this.destroyed)throw Error(`ShadowMapRenderer has been destroyed.`)}};function bg(e,t,n,r=.5){if(!(e>0&&t>e))throw Error(`Cascade split range requires 0 < near < far.`);if(!Number.isInteger(n)||n<1||n>fg)throw Error(`Cascade count must be an integer from 1 to ${fg}.`);let i=Zg(r,0,1),a=[];for(let r=1;r<=n;r++){let o=r/n,s=e*(t/e)**+o,c=e+(t-e)*o;a.push(c*(1-i)+s*i)}return a}function xg(e,t,n,r,i){let a=new R(e.projectionMatrix).multiplyRight(e.viewMatrix).invert(),o=Vg(a,e.clipDepth===`zero-to-one`?0:-1),s=Vg(a,1),c=Ug(t.direction),l=[],u=e.near;for(let a=0;a<r;a++){let r=n[a],d=(u-e.near)/(e.far-e.near),f=(r-e.near)/(e.far-e.near),p=[];for(let e=0;e<4;e++)p.push(Jg(o[e],s[e],d)),p.push(Jg(o[e],s[e],f));let m=Yg(p),h=0;for(let e of p)h=Math.max(h,Xg(m,e));h=Math.ceil(h*16)/16;let g=h*2/i,_=Gg(c,-1),v=Ug(qg(_,Math.abs(_[1])>.99?[0,0,1]:[0,1,0])),y=Ug(qg(v,_)),b=Kg(m,v),x=Kg(m,y),S=Wg(m,Wg(Gg(v,Math.round(b/g)*g-b),Gg(y,Math.round(x/g)*g-x))),C=Wg(S,Gg(c,h+t.casterDistance)),w=new R().lookAt({eye:C,center:S,up:y}),T=new R(hg).multiplyRight(new R().ortho({left:-h,right:h,bottom:-h,top:h,near:.01,far:h*2+t.casterDistance}));l.push({camera:{viewMatrix:w,projectionMatrix:T,near:.01,far:h*2+t.casterDistance,clipDepth:`zero-to-one`},viewProjectionMatrix:new R(T).multiplyRight(w)}),u=r}return l}function Sg(e){let t=Ug(e.direction),n=Math.abs(t[1])>.99?[0,0,1]:[0,1,0],r=new R().lookAt({eye:e.position,center:Wg(e.position,t),up:n}),i=new R(hg).multiplyRight(new R().perspective({fovy:e.outerConeAngle*2,aspect:1,near:e.nearPlane,far:e.range}));return{camera:{viewMatrix:r,projectionMatrix:i,near:e.nearPlane,far:e.range,clipDepth:`zero-to-one`},viewProjectionMatrix:new R(i).multiplyRight(r)}}function Cg(e){let t=new R(hg).multiplyRight(new R().perspective({fovy:ni(90),aspect:1,near:e.nearPlane,far:e.range}));return _g.map(n=>{let r=new R().lookAt({eye:e.position,center:Wg(e.position,n.direction),up:n.up});return{camera:{viewMatrix:r,projectionMatrix:t,near:e.nearPlane,far:e.range,clipDepth:`zero-to-one`},viewProjectionMatrix:new R(t).multiplyRight(r)}})}function wg(e,t){let n=t.quality||`balanced`,r=cg[n];if(!r)throw Error(`Unknown shadow quality: ${String(n)}.`);let i={quality:n,directionalLightCapacity:t.directionalLightCapacity??1,spotLightCapacity:t.spotLightCapacity??1,pointLightCapacity:t.pointLightCapacity??1,directionalMapSize:t.directionalMapSize??r.directionalMapSize,spotMapSize:t.spotMapSize??r.spotMapSize,pointMapSize:t.pointMapSize??r.pointMapSize,cascadeCount:r.cascadeCount,blockerSampleCount:r.blockerSampleCount,filterSampleCount:r.filterSampleCount};Fg(`directionalLightCapacity`,i.directionalLightCapacity,lg),Fg(`spotLightCapacity`,i.spotLightCapacity,ug),Fg(`pointLightCapacity`,i.pointLightCapacity,dg),Ig(e,`directionalMapSize`,i.directionalMapSize),Ig(e,`spotMapSize`,i.spotMapSize),Ig(e,`pointMapSize`,i.pointMapSize);let a=Math.max(pg,i.pointLightCapacity*pg);if(a>e.limits.maxTextureArrayLayers)throw Error(`pointLightCapacity requires ${a} array layers, exceeding the device limit ${e.limits.maxTextureArrayLayers}.`);return i}function Tg(e,t){let n=Math.max(1,t.directionalLightCapacity*t.cascadeCount),r=Math.max(1,t.spotLightCapacity),i=Math.max(pg,t.pointLightCapacity*pg),a=e.createSampler({id:Qg(`shadow-comparison-sampler`),type:`comparison-sampler`,compare:`less-equal`,minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,addressModeW:`clamp-to-edge`}),o=e.createSampler({id:Qg(`shadow-depth-sampler`),minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,addressModeW:`clamp-to-edge`}),s=Eg(e,`directional-shadow-map`,`2d-array`,t.directionalMapSize,n,o),c=Eg(e,`spot-shadow-map`,`2d-array`,t.spotMapSize,r,o),l=Eg(e,`point-shadow-map`,e.type===`webgpu`?`cube-array`:`2d-array`,t.pointMapSize,i,o),u=[];return{directionalTexture:s,spotTexture:c,pointTexture:l,comparisonSampler:a,nonFilteringSampler:o,directionalFramebuffers:Dg(e,s,t.directionalMapSize,n,u),spotFramebuffers:Dg(e,c,t.spotMapSize,r,u),pointFramebuffers:Dg(e,l,t.pointMapSize,i,u),attachmentViews:u}}function Eg(e,t,n,r,i,a){return e.createTexture({id:Qg(t),dimension:n,format:`depth32float`,width:r,height:r,depth:i,sampler:a,usage:v.SAMPLE|v.RENDER})}function Dg(e,t,n,r,i){return Array.from({length:r},(r,a)=>{let o=t.createView({id:Qg(`shadow-layer-view`),format:t.format,dimension:`2d`,baseMipLevel:0,mipLevelCount:1,baseArrayLayer:a,arrayLayerCount:1});return i.push(o),e.createFramebuffer({id:Qg(`shadow-layer-framebuffer`),width:n,height:n,colorAttachments:[],depthStencilAttachment:o})})}function Og(e){for(let t of[...e.directionalFramebuffers,...e.spotFramebuffers,...e.pointFramebuffers])t.destroy();for(let t of e.attachmentViews)t.destroy();e.directionalTexture.destroy(),e.spotTexture.destroy(),e.pointTexture.destroy(),e.comparisonSampler.destroy(),e.nonFilteringSampler.destroy()}function kg(e,t){return e.cascadeCount===t.cascadeCount&&e.directionalLightCapacity===t.directionalLightCapacity&&e.spotLightCapacity===t.spotLightCapacity&&e.pointLightCapacity===t.pointLightCapacity&&e.directionalMapSize===t.directionalMapSize&&e.spotMapSize===t.spotMapSize&&e.pointMapSize===t.pointMapSize}function Ag(e,t){let n=Zg(e.shadowDistance??t.far,t.near,t.far);return{direction:Ug(e.direction),shadowDistance:n,casterDistance:e.casterDistance??n,sourceAngularRadius:e.sourceAngularRadius??.00465,cascadeSplitLambda:e.cascadeSplitLambda??.5,cascadeBlendFraction:e.cascadeBlendFraction??.1,farFadeFraction:e.farFadeFraction??.1,normalBias:e.normalBias??.04,depthBias:e.depthBias??2,depthBiasSlopeScale:e.depthBiasSlopeScale??2,strength:Zg(e.strength??1,0,1)}}function jg(e){if(Rg(`Spot shadow`,e.range),!(e.outerConeAngle>0&&e.outerConeAngle<Math.PI/2))throw Error(`Spot shadow outerConeAngle must be between 0 and PI / 2 radians.`);return{position:[...e.position],direction:Ug(e.direction),range:e.range,outerConeAngle:e.outerConeAngle,nearPlane:Ng(e.nearPlane,e.range),sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,depthBias:e.depthBias??2,depthBiasSlopeScale:e.depthBiasSlopeScale??2,strength:Zg(e.strength??1,0,1)}}function Mg(e){return Rg(`Point shadow`,e.range),{position:[...e.position],range:e.range,nearPlane:Ng(e.nearPlane,e.range),sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,depthBias:e.depthBias??2,depthBiasSlopeScale:e.depthBiasSlopeScale??2,strength:Zg(e.strength??1,0,1)}}function Ng(e,t){let n=e??Math.max(mg,t/1e3);if(!(n>0&&n<t))throw Error(`Shadow nearPlane must be greater than zero and less than range.`);return n}function Pg(e){if(!(e.near>0&&e.far>e.near))throw Error(`ShadowCamera requires 0 < near < far.`)}function Fg(e,t,n){if(!Number.isInteger(t)||t<0||t>n)throw Error(`${e} must be an integer from 0 to ${n}.`)}function Ig(e,t,n){if(!Number.isInteger(n)||n<1||n>e.limits.maxTextureDimension2D)throw Error(`${t} must be a positive integer no greater than ${e.limits.maxTextureDimension2D}.`)}function Lg(e,t,n){if(t>n)throw Error(`${e} shadow light count ${t} exceeds configured capacity ${n}.`)}function Rg(e,t){if(!(t>0&&Number.isFinite(t)))throw Error(`${e} range must be a finite positive number.`)}function zg(e,t){let n=e.slice(0,fg);for(;n.length<fg;)n.push(n[n.length-1]??t);return n}function Bg(e,t){let n=e.slice(0,t);for(;n.length<t;)n.push(gg);return n}function Vg(e,t){return[Hg(e,[-1,-1,t]),Hg(e,[1,-1,t]),Hg(e,[1,1,t]),Hg(e,[-1,1,t])]}function Hg(e,t){let n=t[0],r=t[1],i=t[2],a=e[3]*n+e[7]*r+e[11]*i+e[15];return[(e[0]*n+e[4]*r+e[8]*i+e[12])/a,(e[1]*n+e[5]*r+e[9]*i+e[13])/a,(e[2]*n+e[6]*r+e[10]*i+e[14])/a]}function Ug(e){let t=Math.hypot(e[0],e[1],e[2]);if(!(t>0))throw Error(`Shadow light direction must be non-zero.`);return[e[0]/t,e[1]/t,e[2]/t]}function Wg(e,t){return[e[0]+t[0],e[1]+t[1],e[2]+t[2]]}function Gg(e,t){return[e[0]*t,e[1]*t,e[2]*t]}function Kg(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function qg(e,t){return[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]]}function Jg(e,t,n){return[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n]}function Yg(e){let t=[0,0,0];for(let n of e)t[0]+=n[0],t[1]+=n[1],t[2]+=n[2];return Gg(t,1/e.length)}function Xg(e,t){return Math.hypot(e[0]-t[0],e[1]-t[1],e[2]-t[2])}function Zg(e,t,n){return Math.max(t,Math.min(n,e))}function Qg(e){return vg+=1,`${e}-${vg}`}var $g=`
precision highp sampler2DArray;
struct DirectionalShadowLightUniform {
  vec3 direction;
  float strength;
  float normalBias;
  float sourceAngularRadius;
  float cascadeBlendFraction;
  float farFadeFraction;
  float shadowDistance;
};
struct SpotShadowLightUniform {
  vec3 position;
  float range;
  vec3 direction;
  float outerConeCos;
  float sourceRadius;
  float normalBias;
  float strength;
  float nearPlane;
};
struct PointShadowLightUniform {
  vec3 position;
  float range;
  float sourceRadius;
  float normalBias;
  float strength;
  float nearPlane;
};
layout(std140) uniform shadowUniforms {
  int directionalLightCount;
  int spotLightCount;
  int pointLightCount;
  int cascadeCount;
  int blockerSampleCount;
  int filterSampleCount;
  vec4 cascadeSplits;
  mat4 directionalViewProjectionMatrices[4];
  mat4 spotViewProjectionMatrices[4];
  mat4 pointViewProjectionMatrices[24];
  DirectionalShadowLightUniform directionalLights[1];
  SpotShadowLightUniform spotLights[4];
  PointShadowLightUniform pointLights[4];
} shadow;
uniform sampler2DArray directionalShadowTexture;
uniform sampler2DArray spotShadowTexture;
uniform sampler2DArray pointShadowTexture;
const float SHADOW_PI = 3.141592653589793;
float shadow_hash(vec3 position) {
  return fract(sin(dot(position, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}
vec2 shadow_diskSample(int index, int count, float rotation) {
  float fraction = (float(index) + 0.5) / max(float(count), 1.0);
  float angle = float(index) * 2.39996323 + rotation;
  return sqrt(fraction) * vec2(cos(angle), sin(angle));
}
vec3 shadow_project(mat4 matrix, vec3 worldPosition) {
  vec4 clip = matrix * vec4(worldPosition, 1.0);
  vec3 projected = clip.xyz / max(abs(clip.w), 0.00001);
  // Shared matrices retain [0,1] depth; WebGL texture rows start at the bottom.
  return vec3(projected.xy * 0.5 + 0.5, projected.z);
}
bool shadow_validProjection(vec3 projected) {
  return all(greaterThanEqual(projected, vec3(0.0))) && all(lessThanEqual(projected, vec3(1.0)));
}
// Bilinear interpolation of four depth comparisons matches a hardware 2x2 PCF lookup.
float shadow_compare(sampler2DArray shadowMap, vec2 coordinate, int layer, float reference) {
  ivec2 dimensions = textureSize(shadowMap, 0).xy;
  vec2 position = coordinate * vec2(dimensions) - 0.5;
  ivec2 base = ivec2(floor(position));
  vec2 fraction = fract(position);
  ivec2 maximum = dimensions - 1;
  float lowerLeft = step(reference, texelFetch(shadowMap, ivec3(clamp(base, ivec2(0), maximum), layer), 0).r);
  float lowerRight = step(reference, texelFetch(shadowMap, ivec3(clamp(base + ivec2(1,0), ivec2(0), maximum), layer), 0).r);
  float upperLeft = step(reference, texelFetch(shadowMap, ivec3(clamp(base + ivec2(0,1), ivec2(0), maximum), layer), 0).r);
  float upperRight = step(reference, texelFetch(shadowMap, ivec3(clamp(base + ivec2(1,1), ivec2(0), maximum), layer), 0).r);
  return mix(mix(lowerLeft, lowerRight, fraction.x), mix(upperLeft, upperRight, fraction.x), fraction.y);
}
float shadow_arrayPCSS(sampler2DArray shadowMap, int layer, vec3 projected, float searchRadius, float rotation, float penumbraScale) {
  if (!shadow_validProjection(projected)) return 1.0;
  float texel = 1.0 / float(textureSize(shadowMap, 0).x);
  searchRadius = max(texel, searchRadius);
  float blockerDepth = 0.0;
  float blockerCount = 0.0;
  for (int index = 0; index < 24; index++) {
    if (index >= shadow.blockerSampleCount) break;
    vec2 coordinate = clamp(projected.xy + shadow_diskSample(index, shadow.blockerSampleCount, rotation) * searchRadius, vec2(0.0), vec2(1.0));
    float depth = textureLod(shadowMap, vec3(coordinate, float(layer)), 0.0).r;
    if (depth < projected.z) { blockerDepth += depth; blockerCount += 1.0; }
  }
  if (blockerCount == 0.0) return 1.0;
  float averageBlocker = blockerDepth / blockerCount;
  float penumbra = clamp((projected.z - averageBlocker) / max(abs(averageBlocker), 0.001), 0.0, 1.0);
  float radius = max(texel, searchRadius * (1.0 + penumbra * penumbraScale));
  float visibility = 0.0;
  for (int index = 0; index < 48; index++) {
    if (index >= shadow.filterSampleCount) break;
    vec2 coordinate = clamp(projected.xy + shadow_diskSample(index, shadow.filterSampleCount, rotation) * radius, vec2(0.0), vec2(1.0));
    visibility += shadow_compare(shadowMap, coordinate, layer, projected.z);
  }
  return visibility / max(float(shadow.filterSampleCount), 1.0);
}
int shadow_directionalCascadeIndex(float viewDepth) {
  int cascadeIndex = 0;
  for (int index = 0; index < 4; index++) {
    if (index >= shadow.cascadeCount) break;
    cascadeIndex = index;
    if (viewDepth <= shadow.cascadeSplits[index]) break;
  }
  return cascadeIndex;
}
int shadow_getDirectionalCascadeIndex(float viewDepth) {
  return shadow.directionalLightCount == 0 ? -1 : shadow_directionalCascadeIndex(viewDepth);
}
float shadow_directionalPCSS(int cascadeIndex, vec3 worldPosition, float viewDepth) {
  DirectionalShadowLightUniform light = shadow.directionalLights[0];
  return shadow_arrayPCSS(directionalShadowTexture, cascadeIndex,
    shadow_project(shadow.directionalViewProjectionMatrices[cascadeIndex], worldPosition),
    light.sourceAngularRadius * viewDepth / max(light.shadowDistance, 0.001),
    shadow_hash(worldPosition) * 2.0 * SHADOW_PI, 18.0);
}
float shadow_getDirectionalFactor(vec3 worldPosition, vec3 worldNormal, float viewDepth) {
  if (shadow.directionalLightCount == 0 || viewDepth <= 0.0) return 1.0;
  DirectionalShadowLightUniform light = shadow.directionalLights[0];
  if (viewDepth >= light.shadowDistance) return 1.0;
  vec3 position = worldPosition + normalize(worldNormal) * light.normalBias;
  int cascadeIndex = shadow_directionalCascadeIndex(viewDepth);
  float visibility = shadow_directionalPCSS(cascadeIndex, position, viewDepth);
  if (cascadeIndex + 1 < shadow.cascadeCount) {
    float cascadeStart = cascadeIndex > 0 ? shadow.cascadeSplits[cascadeIndex - 1] : 0.0;
    float cascadeEnd = shadow.cascadeSplits[cascadeIndex];
    float blendWidth = max((cascadeEnd - cascadeStart) * light.cascadeBlendFraction, 0.0001);
    float blend = smoothstep(cascadeEnd - blendWidth, cascadeEnd, viewDepth);
    if (blend > 0.0) visibility = mix(visibility, shadow_directionalPCSS(cascadeIndex + 1, position, viewDepth), blend);
  }
  float fadeWidth = max(light.shadowDistance * light.farFadeFraction, 0.0001);
  visibility = mix(visibility, 1.0, smoothstep(light.shadowDistance - fadeWidth, light.shadowDistance, viewDepth));
  return mix(1.0, visibility, light.strength);
}
float shadow_getSpotFactor(int lightIndex, vec3 worldPosition, vec3 worldNormal) {
  if (lightIndex < 0 || lightIndex >= shadow.spotLightCount) return 1.0;
  SpotShadowLightUniform light = shadow.spotLights[lightIndex];
  vec3 fromLight = worldPosition - light.position;
  float distanceToLight = length(fromLight);
  if (distanceToLight >= light.range || dot(normalize(fromLight), normalize(light.direction)) < light.outerConeCos) return 1.0;
  vec3 position = worldPosition + normalize(worldNormal) * light.normalBias;
  float visibility = shadow_arrayPCSS(spotShadowTexture, lightIndex,
    shadow_project(shadow.spotViewProjectionMatrices[lightIndex], position),
    light.sourceRadius / max(distanceToLight, 0.001) * 0.5,
    shadow_hash(worldPosition) * 2.0 * SHADOW_PI, 16.0);
  return mix(1.0, visibility, light.strength);
}
float shadow_pointReferenceDepth(float majorDistance, float nearPlane, float farPlane) {
  return farPlane / (farPlane - nearPlane) - (farPlane * nearPlane) / ((farPlane - nearPlane) * majorDistance);
}
vec3 shadow_pointCoordinate(int lightIndex, vec3 direction) {
  vec3 magnitude = abs(direction);
  int face = magnitude.x >= magnitude.y && magnitude.x >= magnitude.z ? (direction.x >= 0.0 ? 0 : 1)
    : magnitude.y >= magnitude.z ? (direction.y >= 0.0 ? 2 : 3) : (direction.z >= 0.0 ? 4 : 5);
  PointShadowLightUniform light = shadow.pointLights[lightIndex];
  vec3 projected = shadow_project(shadow.pointViewProjectionMatrices[lightIndex * 6 + face], light.position + direction * light.range * 0.5);
  return vec3(projected.xy, float(lightIndex * 6 + face));
}
float shadow_getPointFactor(int lightIndex, vec3 worldPosition, vec3 worldNormal) {
  if (lightIndex < 0 || lightIndex >= shadow.pointLightCount) return 1.0;
  PointShadowLightUniform light = shadow.pointLights[lightIndex];
  vec3 fromLight = worldPosition + normalize(worldNormal) * light.normalBias - light.position;
  float distanceToLight = length(fromLight);
  if (distanceToLight >= light.range || distanceToLight <= light.nearPlane) return 1.0;
  vec3 direction = normalize(fromLight);
  float referenceDepth = shadow_pointReferenceDepth(max(max(abs(fromLight.x), abs(fromLight.y)), abs(fromLight.z)), light.nearPlane, light.range);
  vec3 reference = abs(direction.y) > 0.99 ? vec3(0,0,1) : vec3(0,1,0);
  vec3 tangent = normalize(cross(direction, reference));
  vec3 bitangent = normalize(cross(direction, tangent));
  float searchRadius = light.sourceRadius / max(distanceToLight, 0.001);
  float rotation = shadow_hash(worldPosition) * 2.0 * SHADOW_PI;
  float blockerDepth = 0.0;
  float blockerCount = 0.0;
  for (int index = 0; index < 24; index++) {
    if (index >= shadow.blockerSampleCount) break;
    vec2 disk = shadow_diskSample(index, shadow.blockerSampleCount, rotation) * searchRadius;
    vec3 coordinate = shadow_pointCoordinate(lightIndex, normalize(direction + tangent * disk.x + bitangent * disk.y));
    float depth = textureLod(pointShadowTexture, coordinate, 0.0).r;
    if (depth < referenceDepth) { blockerDepth += depth; blockerCount += 1.0; }
  }
  if (blockerCount == 0.0) return 1.0;
  float averageBlocker = blockerDepth / blockerCount;
  float penumbra = clamp((referenceDepth - averageBlocker) / max(abs(averageBlocker), 0.001), 0.0, 1.0);
  float radius = searchRadius * (1.0 + penumbra * 12.0);
  float visibility = 0.0;
  for (int index = 0; index < 48; index++) {
    if (index >= shadow.filterSampleCount) break;
    vec2 disk = shadow_diskSample(index, shadow.filterSampleCount, rotation) * radius;
    vec3 coordinate = shadow_pointCoordinate(lightIndex, normalize(direction + tangent * disk.x + bitangent * disk.y));
    visibility += shadow_compare(pointShadowTexture, coordinate.xy, int(coordinate.z), referenceDepth);
  }
  return mix(1.0, visibility / max(float(shadow.filterSampleCount), 1.0), light.strength);
}
`,e_=4,t_=4,n_=4,r_={name:`shadow`,source:`const SHADOW_PI: f32 = 3.141592653589793;

struct DirectionalShadowLightUniform {
  direction: vec3f,
  strength: f32,
  normalBias: f32,
  sourceAngularRadius: f32,
  cascadeBlendFraction: f32,
  farFadeFraction: f32,
  shadowDistance: f32,
};

struct SpotShadowLightUniform {
  position: vec3f,
  range: f32,
  direction: vec3f,
  outerConeCos: f32,
  sourceRadius: f32,
  normalBias: f32,
  strength: f32,
  nearPlane: f32,
};

struct PointShadowLightUniform {
  position: vec3f,
  range: f32,
  sourceRadius: f32,
  normalBias: f32,
  strength: f32,
  nearPlane: f32,
};

struct ShadowUniforms {
  directionalLightCount: i32,
  spotLightCount: i32,
  pointLightCount: i32,
  cascadeCount: i32,
  blockerSampleCount: i32,
  filterSampleCount: i32,
  cascadeSplits: vec4f,
  directionalViewProjectionMatrices: array<mat4x4f, 4>,
  spotViewProjectionMatrices: array<mat4x4f, 4>,
  pointViewProjectionMatrices: array<mat4x4f, 24>,
  directionalLights: array<DirectionalShadowLightUniform, 1>,
  spotLights: array<SpotShadowLightUniform, 4>,
  pointLights: array<PointShadowLightUniform, 4>,
};

@group(2) @binding(auto) var<uniform> shadow: ShadowUniforms;
@group(2) @binding(auto) var directionalShadowTexture: texture_depth_2d_array;
@group(2) @binding(auto) var spotShadowTexture: texture_depth_2d_array;
@group(2) @binding(auto) var pointShadowTexture: texture_depth_cube_array;
@group(2) @binding(auto) var directionalShadowTextureSampler: sampler;
@group(2) @binding(auto) var shadowComparisonSampler: sampler_comparison;

fn shadow_hash(position: vec3f) -> f32 {
  return fract(sin(dot(position, vec3f(12.9898, 78.233, 37.719))) * 43758.5453);
}

fn shadow_diskSample(index: i32, count: i32, rotation: f32) -> vec2f {
  let fraction = (f32(index) + 0.5) / max(f32(count), 1.0);
  let angle = f32(index) * 2.39996323 + rotation;
  return sqrt(fraction) * vec2f(cos(angle), sin(angle));
}

fn shadow_project(matrix: mat4x4f, worldPosition: vec3f) -> vec3f {
  let clip = matrix * vec4f(worldPosition, 1.0);
  let ndc = clip.xyz / max(abs(clip.w), 0.00001);
  return vec3f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5, ndc.z);
}

fn shadow_validProjection(projected: vec3f) -> bool {
  return all(projected.xy >= vec2f(0.0)) && all(projected.xy <= vec2f(1.0)) &&
    projected.z >= 0.0 && projected.z <= 1.0;
}

fn shadow_directionalCascadeIndex(viewDepth: f32) -> i32 {
  var cascadeIndex = 0;
  for (var index: i32 = 0; index < 4; index++) {
    if (index >= shadow.cascadeCount) { break; }
    cascadeIndex = index;
    if (viewDepth <= shadow.cascadeSplits[index]) { break; }
  }
  return cascadeIndex;
}

fn shadow_getDirectionalCascadeIndex(viewDepth: f32) -> i32 {
  if (shadow.directionalLightCount == 0) { return -1; }
  return shadow_directionalCascadeIndex(viewDepth);
}

fn shadow_directionalPCSS(cascadeIndex: i32, worldPosition: vec3f, viewDepth: f32) -> f32 {
  let projected = shadow_project(shadow.directionalViewProjectionMatrices[cascadeIndex], worldPosition);
  if (!shadow_validProjection(projected)) { return 1.0; }
  let dimensions = vec2f(textureDimensions(directionalShadowTexture));
  let texel = 1.0 / dimensions;
  let light = shadow.directionalLights[0];
  let rotation = shadow_hash(worldPosition) * 2.0 * SHADOW_PI;
  let searchRadius = max(texel.x, light.sourceAngularRadius * viewDepth / max(light.shadowDistance, 0.001));
  var blockerDepth = 0.0;
  var blockerCount = 0.0;
  for (var index: i32 = 0; index < 24; index++) {
    if (index >= shadow.blockerSampleCount) { break; }
    let offset = shadow_diskSample(index, shadow.blockerSampleCount, rotation) * searchRadius;
    let sampleDepth = textureSampleLevel(
      directionalShadowTexture,
      directionalShadowTextureSampler,
      clamp(projected.xy + offset, vec2f(0.0), vec2f(1.0)),
      cascadeIndex,
      0
    );
    if (sampleDepth < projected.z) {
      blockerDepth += sampleDepth;
      blockerCount += 1.0;
    }
  }
  if (blockerCount == 0.0) { return 1.0; }
  let averageBlocker = blockerDepth / blockerCount;
  let penumbra = clamp((projected.z - averageBlocker) / max(abs(averageBlocker), 0.001), 0.0, 1.0);
  let filterRadius = max(texel.x, searchRadius * (1.0 + penumbra * 18.0));
  var visibility = 0.0;
  for (var index: i32 = 0; index < 48; index++) {
    if (index >= shadow.filterSampleCount) { break; }
    let offset = shadow_diskSample(index, shadow.filterSampleCount, rotation) * filterRadius;
    visibility += textureSampleCompareLevel(
      directionalShadowTexture,
      shadowComparisonSampler,
      clamp(projected.xy + offset, vec2f(0.0), vec2f(1.0)),
      cascadeIndex,
      projected.z
    );
  }
  return visibility / max(f32(shadow.filterSampleCount), 1.0);
}

fn shadow_getDirectionalFactor(worldPosition: vec3f, worldNormal: vec3f, viewDepth: f32) -> f32 {
  if (shadow.directionalLightCount == 0 || viewDepth <= 0.0) { return 1.0; }
  let light = shadow.directionalLights[0];
  if (viewDepth >= light.shadowDistance) { return 1.0; }
  let biasedPosition = worldPosition + normalize(worldNormal) * light.normalBias;
  let cascadeIndex = shadow_directionalCascadeIndex(viewDepth);
  var visibility = shadow_directionalPCSS(cascadeIndex, biasedPosition, viewDepth);
  if (cascadeIndex + 1 < shadow.cascadeCount) {
    var cascadeStart = 0.0;
    if (cascadeIndex > 0) { cascadeStart = shadow.cascadeSplits[cascadeIndex - 1]; }
    let cascadeEnd = shadow.cascadeSplits[cascadeIndex];
    let blendWidth = max((cascadeEnd - cascadeStart) * light.cascadeBlendFraction, 0.0001);
    let blend = smoothstep(cascadeEnd - blendWidth, cascadeEnd, viewDepth);
    if (blend > 0.0) {
      visibility = mix(
        visibility,
        shadow_directionalPCSS(cascadeIndex + 1, biasedPosition, viewDepth),
        blend
      );
    }
  }
  let fadeWidth = max(light.shadowDistance * light.farFadeFraction, 0.0001);
  let farFade = smoothstep(light.shadowDistance - fadeWidth, light.shadowDistance, viewDepth);
  visibility = mix(visibility, 1.0, farFade);
  return mix(1.0, visibility, light.strength);
}

fn shadow_spotPCSS(lightIndex: i32, worldPosition: vec3f) -> f32 {
  let projected = shadow_project(shadow.spotViewProjectionMatrices[lightIndex], worldPosition);
  if (!shadow_validProjection(projected)) { return 1.0; }
  let light = shadow.spotLights[lightIndex];
  let dimensions = vec2f(textureDimensions(spotShadowTexture));
  let texel = 1.0 / dimensions;
  let distanceToLight = length(worldPosition - light.position);
  let searchRadius = max(texel.x, light.sourceRadius / max(distanceToLight, 0.001) * 0.5);
  let rotation = shadow_hash(worldPosition) * 2.0 * SHADOW_PI;
  var blockerDepth = 0.0;
  var blockerCount = 0.0;
  for (var index: i32 = 0; index < 24; index++) {
    if (index >= shadow.blockerSampleCount) { break; }
    let offset = shadow_diskSample(index, shadow.blockerSampleCount, rotation) * searchRadius;
    let sampleDepth = textureSampleLevel(
      spotShadowTexture,
      directionalShadowTextureSampler,
      clamp(projected.xy + offset, vec2f(0.0), vec2f(1.0)),
      lightIndex,
      0
    );
    if (sampleDepth < projected.z) { blockerDepth += sampleDepth; blockerCount += 1.0; }
  }
  if (blockerCount == 0.0) { return 1.0; }
  let averageBlocker = blockerDepth / blockerCount;
  let penumbra = clamp((projected.z - averageBlocker) / max(abs(averageBlocker), 0.001), 0.0, 1.0);
  let filterRadius = max(texel.x, searchRadius * (1.0 + penumbra * 16.0));
  var visibility = 0.0;
  for (var index: i32 = 0; index < 48; index++) {
    if (index >= shadow.filterSampleCount) { break; }
    let offset = shadow_diskSample(index, shadow.filterSampleCount, rotation) * filterRadius;
    visibility += textureSampleCompareLevel(
      spotShadowTexture,
      shadowComparisonSampler,
      clamp(projected.xy + offset, vec2f(0.0), vec2f(1.0)),
      lightIndex,
      projected.z
    );
  }
  return visibility / max(f32(shadow.filterSampleCount), 1.0);
}

fn shadow_getSpotFactor(lightIndex: i32, worldPosition: vec3f, worldNormal: vec3f) -> f32 {
  if (lightIndex < 0 || lightIndex >= shadow.spotLightCount) { return 1.0; }
  let light = shadow.spotLights[lightIndex];
  let fromLight = worldPosition - light.position;
  let distanceToLight = length(fromLight);
  let coneCos = dot(normalize(fromLight), normalize(light.direction));
  if (distanceToLight >= light.range || coneCos < light.outerConeCos) { return 1.0; }
  let biasedPosition = worldPosition + normalize(worldNormal) * light.normalBias;
  return mix(1.0, shadow_spotPCSS(lightIndex, biasedPosition), light.strength);
}

fn shadow_pointReferenceDepth(majorDistance: f32, nearPlane: f32, farPlane: f32) -> f32 {
  // Match the cube-face projection and stored WebGPU depth in [0, 1].
  return farPlane / (farPlane - nearPlane) -
    (farPlane * nearPlane) / ((farPlane - nearPlane) * majorDistance);
}

fn shadow_pointBasis(direction: vec3f) -> mat2x3f {
  let reference = select(vec3f(0.0, 1.0, 0.0), vec3f(0.0, 0.0, 1.0), abs(direction.y) > 0.99);
  let tangent = normalize(cross(direction, reference));
  return mat2x3f(tangent, normalize(cross(direction, tangent)));
}

fn shadow_getPointFactor(lightIndex: i32, worldPosition: vec3f, worldNormal: vec3f) -> f32 {
  if (lightIndex < 0 || lightIndex >= shadow.pointLightCount) { return 1.0; }
  let light = shadow.pointLights[lightIndex];
  let biasedPosition = worldPosition + normalize(worldNormal) * light.normalBias;
  let fromLight = biasedPosition - light.position;
  let distanceToLight = length(fromLight);
  if (distanceToLight >= light.range || distanceToLight <= light.nearPlane) { return 1.0; }
  let direction = normalize(fromLight);
  let majorDistance = max(max(abs(fromLight.x), abs(fromLight.y)), abs(fromLight.z));
  let referenceDepth = shadow_pointReferenceDepth(majorDistance, light.nearPlane, light.range);
  let searchRadius = light.sourceRadius / max(distanceToLight, 0.001);
  let rotation = shadow_hash(worldPosition) * 2.0 * SHADOW_PI;
  let basis = shadow_pointBasis(direction);
  var blockerDepth = 0.0;
  var blockerCount = 0.0;
  for (var index: i32 = 0; index < 24; index++) {
    if (index >= shadow.blockerSampleCount) { break; }
    let disk = shadow_diskSample(index, shadow.blockerSampleCount, rotation) * searchRadius;
    let sampleDirection = normalize(direction + basis[0] * disk.x + basis[1] * disk.y);
    let sampleDepth = textureSampleLevel(
      pointShadowTexture,
      directionalShadowTextureSampler,
      sampleDirection,
      lightIndex,
      0
    );
    if (sampleDepth < referenceDepth) { blockerDepth += sampleDepth; blockerCount += 1.0; }
  }
  if (blockerCount == 0.0) { return 1.0; }
  let averageBlocker = blockerDepth / blockerCount;
  let penumbra = clamp((referenceDepth - averageBlocker) / max(abs(averageBlocker), 0.001), 0.0, 1.0);
  let filterRadius = searchRadius * (1.0 + penumbra * 12.0);
  var visibility = 0.0;
  for (var index: i32 = 0; index < 48; index++) {
    if (index >= shadow.filterSampleCount) { break; }
    let disk = shadow_diskSample(index, shadow.filterSampleCount, rotation) * filterRadius;
    let sampleDirection = normalize(direction + basis[0] * disk.x + basis[1] * disk.y);
    visibility += textureSampleCompareLevel(
      pointShadowTexture,
      shadowComparisonSampler,
      sampleDirection,
      lightIndex,
      referenceDepth
    );
  }
  visibility /= max(f32(shadow.filterSampleCount), 1.0);
  return mix(1.0, visibility, light.strength);
}
`,fs:$g,props:{},uniforms:{},bindings:{},uniformTypes:{directionalLightCount:`i32`,spotLightCount:`i32`,pointLightCount:`i32`,cascadeCount:`i32`,blockerSampleCount:`i32`,filterSampleCount:`i32`,cascadeSplits:`vec4<f32>`,directionalViewProjectionMatrices:[`mat4x4<f32>`,e_],spotViewProjectionMatrices:[`mat4x4<f32>`,t_],pointViewProjectionMatrices:[`mat4x4<f32>`,24],directionalLights:[{direction:`vec3<f32>`,strength:`f32`,normalBias:`f32`,sourceAngularRadius:`f32`,cascadeBlendFraction:`f32`,farFadeFraction:`f32`,shadowDistance:`f32`},1],spotLights:[{position:`vec3<f32>`,range:`f32`,direction:`vec3<f32>`,outerConeCos:`f32`,sourceRadius:`f32`,normalBias:`f32`,strength:`f32`,nearPlane:`f32`},t_],pointLights:[{position:`vec3<f32>`,range:`f32`,sourceRadius:`f32`,normalBias:`f32`,strength:`f32`,nearPlane:`f32`},n_]},bindingLayout:[{name:`shadow`,group:2},{name:`directionalShadowTexture`,group:2},{name:`spotShadowTexture`,group:2},{name:`pointShadowTexture`,group:2},{name:`shadowComparisonSampler`,group:2}],getUniforms(e){return!e.directionalLights||!e.spotLights||!e.pointLights||!e.cascadeSplits||!e.directionalViewProjectionMatrices||!e.spotViewProjectionMatrices||!e.pointViewProjectionMatrices||!e.directionalShadowTexture||!e.spotShadowTexture||!e.pointShadowTexture||!e.nonFilteringSampler||!e.comparisonSampler?{}:{directionalLightCount:e.directionalLights.length,spotLightCount:e.spotLights.length,pointLightCount:e.pointLights.length,cascadeCount:e.cascadeCount,blockerSampleCount:e.blockerSampleCount,filterSampleCount:e.filterSampleCount,cascadeSplits:e.cascadeSplits,directionalViewProjectionMatrices:e.directionalViewProjectionMatrices,spotViewProjectionMatrices:e.spotViewProjectionMatrices,pointViewProjectionMatrices:e.pointViewProjectionMatrices,directionalLights:i_(e.directionalLights),spotLights:a_(e.spotLights),pointLights:o_(e.pointLights),directionalShadowTexture:e.directionalShadowTexture,spotShadowTexture:e.spotShadowTexture,pointShadowTexture:e.pointShadowTexture,...e.directionalShadowTexture.device.type===`webgpu`?{shadowComparisonSampler:e.comparisonSampler}:{}}}};function i_(e){let t=e[0];return[t?{direction:t.direction,strength:t.strength??1,normalBias:t.normalBias??.04,sourceAngularRadius:t.sourceAngularRadius??.00465,cascadeBlendFraction:t.cascadeBlendFraction??.1,farFadeFraction:t.farFadeFraction??.1,shadowDistance:t.shadowDistance??1}:{direction:[0,1,0],strength:0,normalBias:0,sourceAngularRadius:0,cascadeBlendFraction:0,farFadeFraction:0,shadowDistance:1}]}function a_(e){return s_(e.map(e=>({position:e.position,range:e.range,direction:e.direction,outerConeCos:Math.cos(e.outerConeAngle),sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,strength:e.strength??1,nearPlane:e.nearPlane??.1})),t_,{position:[0,0,0],range:1,direction:[0,-1,0],outerConeCos:1,sourceRadius:0,normalBias:0,strength:0,nearPlane:.1})}function o_(e){return s_(e.map(e=>({position:e.position,range:e.range,sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,strength:e.strength??1,nearPlane:e.nearPlane??.1})),n_,{position:[0,0,0],range:1,sourceRadius:0,normalBias:0,strength:0,nearPlane:.1})}function s_(e,t,n){let r=e.slice(0,t);for(;r.length<t;)r.push(n);return r}function c_(e,t,n=[0,0,0]){if(t)return t;let r=n.some(e=>e!==0)?n:[e instanceof ig||e instanceof nu?e.longitude:0,e instanceof ig||e instanceof nu?e.latitude:0,0];return Vu({longitude:r[0],latitude:r[1],elevation:r[2]})}function l_(e){return new R([e[0],e[1],e[2],0,e[3],e[4],e[5],0,e[6],e[7],e[8],0,0,0,0,1])}function u_(e,t){let n=e instanceof ig?l_(Uu(t)):new R().scale(e.getDistanceScales([t.longitude,t.latitude,t.elevation]).unitsPerMeter);return new R(e.projectionMatrix).multiplyRight(e.viewMatrix).multiplyRight(n)}var d_={name:`skyBody`,uniformTypes:{center:`vec4<f32>`,color:`vec4<f32>`,offset:`vec2<f32>`,moon:`f32`,phase:`f32`,limbAngle:`f32`},source:`struct skyBodyUniforms {
    center: vec4f,
    color: vec4f,
    offset: vec2f,
    moon: f32,
    phase: f32,
    limbAngle: f32,
  }; @group(3) @binding(auto) var<uniform> skyBody: skyBodyUniforms;`,vs:`layout(std140) uniform skyBodyUniforms {
    vec4 center;
    vec4 color;
    vec2 offset;
    float moon;
    float phase;
    float limbAngle;
  } skyBody;`,fs:`layout(std140) uniform skyBodyUniforms {
    vec4 center;
    vec4 color;
    vec2 offset;
    float moon;
    float phase;
    float limbAngle;
  } skyBody;`},f_=class extends Gh{static layerName=`SkyBodyLayer`;static defaultProps={direction:void 0,timestamp:void 0,observer:void 0,radiusPixels:{type:`number`,value:12,min:0},color:{type:`color`,value:[255,235,170,255]},pickable:!1,parameters:{depthCompare:`less-equal`,depthWriteEnabled:!1,cullMode:`none`,blend:!0,blendColorSrcFactor:`one`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`}};getObserver(){return c_(this.context.viewport,this.props.observer,this.props.coordinateOrigin)}getBodyDirection(){return this.props.direction??[0,1,.15]}getBodyRadius(){return this.props.radiusPixels??0}getBodyColor(){let e=this.props.color??[255,235,170,255];return[e[0]/255,e[1]/255,e[2]/255]}getBodySettings(){return{moon:0,phase:.5,limbAngle:0,halo:.3}}getAttributeManager(){return null}initializeState({device:e}){let t=e.createBuffer({data:new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1])});try{let n=new C(e,{...this.getShaders({source:m_,vs:h_,fs:g_,modules:[ml,qa,d_]}),id:`${this.id}-sky-body`,topology:`triangle-list`,vertexCount:6,bufferLayout:[{name:`corner`,format:`float32x2`}],attributes:{corner:t},parameters:{depthCompare:`less-equal`,depthWriteEnabled:!1,cullMode:`none`,blend:!0,blendColorSrcFactor:`one`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`}});this.setState({model:n,corners:t})}catch(e){throw t.destroy(),e}}getModels(){return this.state.model?[this.state.model]:[]}draw({renderPass:e}){let t=p_(this.context.viewport,this.getBodyDirection(),this.props.coordinateOrigin,this.getObserver()),n=this.getBodyRadius();if(!t||!n)return;let r=this.getBodySettings(),i=r.moon?1:3,a=this.context.viewport,o=this.props.color??[255,235,170,255];this.state.model.shaderInputs.setProps({skyBody:{center:t,color:[...this.getBodyColor(),o[3]/255*this.props.opacity],offset:[2*n*i/a.width,2*n*i/a.height],moon:r.moon,phase:r.phase,limbAngle:r.limbAngle},pointGlow:{coreRadius:0,coreIntensity:0,haloIntensity:r.halo,falloff:6}}),this.state.model.draw(e)}finalizeState(e){this.state.model?.destroy(),this.state.corners?.destroy(),super.finalizeState(e)}};function p_(e,t,n=[0,0,0],r){if(!(e instanceof ig)&&t[2]<=0||e.projectionMatrix[15]!==0)return null;let i=u_(e,c_(e,r,n)).transform([t[0],t[1],t[2],0]);return i[3]<=0?null:[i[0]/i[3],i[1]/i[3],1,1]}var m_=`
struct SkyVertex { @builtin(position) position: vec4f, @location(0) coordinate: vec2f };
@vertex fn vertexMain(@location(0) corner: vec2f) -> SkyVertex {
  var output: SkyVertex;
  output.position = vec4f(skyBody.center.xy + corner * skyBody.offset, 1.0, 1.0);
  output.coordinate = corner * select(3.0, 1.0, skyBody.moon > 0.5);
  return output;
}
@fragment fn fragmentMain(input: SkyVertex) -> @location(0) vec4f {
  if (picking.isActive > 0.5) { discard; }
  let radius = length(input.coordinate);
  let edge = max(fwidth(radius), 0.0001);
  let disk = 1.0 - smoothstep(1.0 - edge, 1.0 + edge, radius);
  var color = skyBody.color.rgb;
  var alpha = disk;
  if (skyBody.moon > 0.5) {
    if (radius > 1.0 + edge) { discard; }
    let cosine = cos(skyBody.limbAngle);
    let sine = sin(skyBody.limbAngle);
    let coordinate = vec2f(cosine * input.coordinate.x + sine * input.coordinate.y,
      -sine * input.coordinate.x + cosine * input.coordinate.y);
    let normal = vec3f(coordinate, sqrt(max(0.0, 1.0 - radius * radius)));
    let angle = skyBody.phase * 6.28318530718;
    let illumination = max(0.0, dot(normal, vec3f(sin(angle), 0.0, -cos(angle))));
    let maria = 0.88 + 0.08 * sin(coordinate.x * 11.0 + sin(coordinate.y * 8.0)) *
      cos(coordinate.y * 13.0 - coordinate.x * 3.0);
    color *= maria * (0.045 + 0.955 * sqrt(illumination));
  } else {
    let halo = pointGlow_getColor(input.coordinate / 3.0, vec3f(1.0));
    color *= disk + halo.r;
    alpha = clamp(disk + halo.r, 0.0, 1.0);
    // RGB is already premultiplied by the disk/halo coverage.
    return vec4f(color * skyBody.color.a, alpha * skyBody.color.a);
  }
  return vec4f(color * alpha * skyBody.color.a, alpha * skyBody.color.a);
}`,h_=`#version 300 es
in vec2 corner; out vec2 coordinate;
void main() {
  gl_Position = vec4(skyBody.center.xy + corner * skyBody.offset, 1.0, 1.0);
  coordinate = corner * (skyBody.moon > 0.5 ? 1.0 : 3.0);
}`,g_=`#version 300 es
precision highp float;
in vec2 coordinate; out vec4 fragColor;
void main() {
  if (picking.isActive > 0.5) discard;
  float radius = length(coordinate);
  float edge = max(fwidth(radius), 0.0001);
  float disk = 1.0 - smoothstep(1.0 - edge, 1.0 + edge, radius);
  vec3 color = skyBody.color.rgb;
  float alpha = disk;
  if (skyBody.moon > 0.5) {
    if (radius > 1.0 + edge) discard;
    float cosine = cos(skyBody.limbAngle), sine = sin(skyBody.limbAngle);
    vec2 surface = vec2(cosine * coordinate.x + sine * coordinate.y,
      -sine * coordinate.x + cosine * coordinate.y);
    vec3 normal = vec3(surface, sqrt(max(0.0, 1.0 - radius * radius)));
    float angle = skyBody.phase * 6.28318530718;
    float illumination = max(0.0, dot(normal, vec3(sin(angle), 0.0, -cos(angle))));
    float maria = 0.88 + 0.08 * sin(surface.x * 11.0 + sin(surface.y * 8.0)) *
      cos(surface.y * 13.0 - surface.x * 3.0);
    color *= maria * (0.045 + 0.955 * sqrt(illumination));
  } else {
    float halo = pointGlow_getColor(coordinate / 3.0, vec3(1.0)).r;
    color *= disk + halo;
    alpha = clamp(disk + halo, 0.0, 1.0);
    fragColor = vec4(color * skyBody.color.a, alpha * skyBody.color.a);
    return;
  }
  fragColor = vec4(color * alpha * skyBody.color.a, alpha * skyBody.color.a);
}`,__=class extends f_{static layerName=`SunLayer`;static defaultProps={...f_.defaultProps,color:{type:`color`,value:null,optional:!0},radiance:{type:`number`,value:8,min:0},haloIntensity:{type:`number`,value:.3,min:0}};getBodyDirection(){if(this.props.direction)return this.props.direction;let e=this.getObserver(),t=_u(this.props.timestamp??Date.now(),e.latitude,e.longitude);return Hu(t.altitude,t.azimuth)}getBodyColor(){let e=Lu(this.context.viewport instanceof ig?Math.PI/2:Math.asin(this.getBodyDirection()[2])),t=this.props.direction||this.props.color?super.getBodyColor():e.color,n=this.props.radiance*(this.props.direction?1:e.intensity);return[t[0]*n,t[1]*n,t[2]*n]}getBodySettings(){return{moon:0,phase:.5,limbAngle:0,halo:this.props.haloIntensity}}},v_=class extends f_{static layerName=`MoonLayer`;static defaultProps={...f_.defaultProps,color:{type:`color`,value:[215,224,235,255]},scaleWithDistance:void 0,phase:void 0,limbAngle:void 0};getBodyDirection(){if(this.props.direction)return this.props.direction;let e=this.getObserver(),t=ju(this.props.timestamp??Date.now(),e.latitude,e.longitude);return Hu(t.altitude,t.azimuth)}getBodyRadius(){let e=super.getBodyRadius();if(!(this.props.scaleWithDistance??!this.props.direction))return e;let t=this.getObserver(),n=ju(this.props.timestamp??Date.now(),t.latitude,t.longitude);return e*Math.asin(1737.4/n.distance)/Math.asin(1737.4/384400)}getBodySettings(){let e=this.getObserver(),t=this.props.timestamp??Date.now(),n=Mu(t),r=ju(t,e.latitude,e.longitude);return{moon:1,phase:this.props.phase??(this.props.direction?.5:n.phase),limbAngle:this.props.limbAngle??(this.props.direction?0:Math.PI/2+n.angle-r.parallacticAngle-(n.phase>.5?Math.PI:0)),halo:0}}},y_={name:`skyView`,uniformTypes:{camera:`vec3<f32>`,lowerLeft:`vec3<f32>`,lowerRight:`vec3<f32>`,upperLeft:`vec3<f32>`,opacity:`f32`},source:`struct skyViewUniforms {
    camera: vec3f,
    lowerLeft: vec3f,
    lowerRight: vec3f,
    upperLeft: vec3f,
    opacity: f32,
  }; @group(3) @binding(auto) var<uniform> skyView: skyViewUniforms;`,vs:`layout(std140) uniform skyViewUniforms {
    vec3 camera;
    vec3 lowerLeft;
    vec3 lowerRight;
    vec3 upperLeft;
    float opacity;
  } skyView;`,fs:`layout(std140) uniform skyViewUniforms {
    vec3 camera;
    vec3 lowerLeft;
    vec3 lowerRight;
    vec3 upperLeft;
    float opacity;
  } skyView;`};function b_(e,t){let n=new R(e.projectionMatrix).invert(),r=new R(e.viewMatrix).invert(),i=e.getDistanceScales([...t]).unitsPerMeter;function a(e,t){let a=n.transform([e,t,1,1]),o=r.transform([a[0],a[1],a[2],0]);return[o[0]/i[0],o[1]/i[1],o[2]/i[2]]}return{camera:sg(e,t,e.cameraPosition),lowerLeft:a(-1,-1),lowerRight:a(1,-1),upperLeft:a(-1,1)}}var x_=`
struct SkyViewVertex { @builtin(position) position: vec4f, @location(0) direction: vec3f };
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> SkyViewVertex {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  let corner = positions[index];
  let fraction = corner * 0.5 + 0.5;
  var output: SkyViewVertex;
  output.position = vec4f(corner, 1.0, 1.0);
  output.direction = skyView.lowerLeft + fraction.x * (skyView.lowerRight - skyView.lowerLeft)
    + fraction.y * (skyView.upperLeft - skyView.lowerLeft);
  return output;
}
`,S_=`#version 300 es
out vec3 direction;
void main() {
  vec2 positions[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  vec2 corner = positions[gl_VertexID];
  vec2 fraction = corner * 0.5 + 0.5;
  gl_Position = vec4(corner, 1.0, 1.0);
  direction = skyView.lowerLeft + fraction.x * (skyView.lowerRight - skyView.lowerLeft)
    + fraction.y * (skyView.upperLeft - skyView.lowerLeft);
}`,C_=class extends Gh{static layerName=`CloudLayer`;static defaultProps={cover:{type:`number`,value:.45,min:0,max:1},altitude:{type:`number`,value:1e3},thickness:{type:`number`,value:1200,min:1},scale:{type:`number`,value:1400,min:1},density:{type:`number`,value:.005,min:0},time:{type:`number`,value:0},velocity:[14,4],sunDirection:[0,.8,.6],sunColor:[1,.95,.85],pickable:!1};getAttributeManager(){return null}initializeState({device:e}){this.setState({model:new C(e,{...this.getShaders({source:w_,vs:T_,fs:E_,modules:[ml,Ya,y_]}),id:`${this.id}-clouds`,topology:`triangle-list`,vertexCount:3,parameters:{depthCompare:`less-equal`,depthWriteEnabled:!1,cullMode:`none`,blend:!0,blendColorSrcFactor:`one`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`}})})}getModels(){return this.state.model?[this.state.model]:[]}draw({renderPass:e}){let t=this.context.viewport;t instanceof ig||t.projectionMatrix[15]!==0||!this.props.cover||(this.state.model.shaderInputs.setProps({clouds:{cover:this.props.cover,altitude:this.props.altitude,thickness:this.props.thickness,scale:this.props.scale,density:this.props.density,time:this.props.time,velocity:this.props.velocity,sunDirection:this.props.sunDirection,sunColor:this.props.sunColor},skyView:{...b_(t,this.props.coordinateOrigin),opacity:this.props.opacity}}),this.state.model.draw(e))}finalizeState(e){this.state.model?.destroy(),super.finalizeState(e)}},w_=x_+`
@fragment fn fragmentMain(input: SkyViewVertex) -> @location(0) vec4f {
  if (picking.isActive > 0.5) { discard; }
  return clouds_getColor(skyView.camera, normalize(input.direction)) * skyView.opacity;
}`,T_=S_,E_=`#version 300 es
precision highp float;
in vec3 direction; out vec4 fragColor;
void main() {
  if (picking.isActive > 0.5) discard;
  fragColor = clouds_getColor(skyView.camera, normalize(direction)) * skyView.opacity;
}`,D_=class extends Gh{static layerName=`AtmosphereLayer`;static defaultProps={...Za.defaultUniforms,pickable:!1};getAttributeManager(){return null}initializeState({device:e}){this.setState({model:new C(e,{...this.getShaders({source:O_,vs:S_,fs:k_,modules:[ml,Za,y_]}),id:`${this.id}-atmosphere`,topology:`triangle-list`,vertexCount:3,parameters:{depthCompare:`less-equal`,depthWriteEnabled:!1,cullMode:`none`,blend:!0,blendColorSrcFactor:`one`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`}})})}getModels(){return this.state.model?[this.state.model]:[]}draw({renderPass:e}){let t=this.context.viewport;t instanceof ig||t.projectionMatrix[15]!==0||!this.props.enabled||(this.state.model.shaderInputs.setProps({atmosphere:{enabled:this.props.enabled,sunDirection:this.props.sunDirection,sunIntensity:this.props.sunIntensity,haze:this.props.haze,rayleigh:this.props.rayleigh,planetRadius:this.props.planetRadius,exposure:this.props.exposure,groundColor:this.props.groundColor},skyView:{...b_(t,this.props.coordinateOrigin),opacity:this.props.opacity}}),this.state.model.draw(e))}finalizeState(e){this.state.model?.destroy(),super.finalizeState(e)}},O_=x_+`
@fragment fn fragmentMain(input: SkyViewVertex) -> @location(0) vec4f {
  if (picking.isActive > 0.5) { discard; }
  return vec4f(atmosphere_getSkyColor(skyView.camera, normalize(input.direction)) * skyView.opacity, skyView.opacity);
}`,k_=`#version 300 es
precision highp float;
in vec3 direction; out vec4 fragColor;
void main() {
  if (picking.isActive > 0.5) discard;
  fragColor = vec4(atmosphere_getSkyColor(skyView.camera, normalize(direction)) * skyView.opacity, skyView.opacity);
}`,A_=`core-features-and-limits`,j_=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function M_(e){let t={};for(let n of j_){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function N_(e){return e.featureLevel??`core`}function P_(e){let t=N_(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!==`default`&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function F_(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(A_)&&r.push(A_);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function I_(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(A_)?`core`:e===`best-available`?`compatibility`:e}function L_(e,t){return e===`core`?`core`:I_(`compatibility`,t)}var R_=new class extends qr{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){return await this._create(e,!0)}async _create(t,n){if(typeof navigator>`u`||!navigator.gpu)throw Error(`WebGPU is not available`);let r=N_(t),i=P_(t),a;try{a=await this.requestGPUAdapter(i)}catch(e){throw Error(`WebGPU adapter request failed`,{cause:e})}if(!a)throw Error(`Failed to request WebGPU adapter`);let o=await z_(a),s={},c=F_(a.features,r,t.optionalFeatures);c.length>0&&(s.requiredFeatures=c);let l={...r===`max`?M_(a.limits):{},...t.requiredLimits};Object.keys(l).length>0&&(s.requiredLimits=l);let u;try{u=await a.requestDevice(s)}catch(e){throw Error(`WebGPU device request failed`,{cause:e})}let d=await B_(u);if(d){if(u.destroy(),n&&d.reason!==`destroyed`)return e.warn(`WebGPU device was returned already lost; retrying with a fresh adapter`)(),await this._create(t,!1);throw Error(`WebGPU device was returned already lost${d.message?`: ${d.message}`:``}`,{cause:d})}let{WebGPUDevice:f}=await Wf(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-BiCMWf4F.js`);return{WebGPUDevice:e}},__vite__mapDeps([14,2,3,5,9,11])),p=I_(r,u.features),m={...t,featureLevel:p};e.groupCollapsed(1,`WebGPUDevice created`)();try{let t;try{t=new f(m,u,a,o)}catch(e){throw u.destroy(),Error(`WebGPU wrapper initialization failed`,{cause:e})}let n=f.getCanvasContextProps(m);if(n)try{t.initializeCanvasContext(n)}catch(e){throw t.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})}return e.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),e.table(1,t.info)(),t}finally{e.groupEnd(1)()}}async attach(e,t={}){let{WebGPUDevice:n}=await Wf(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-BiCMWf4F.js`);return{WebGPUDevice:e}},__vite__mapDeps([14,2,3,5,9,11]));if(e instanceof n)return e;if(!this.isDeviceHandle(e))throw Error(`Invalid GPUDevice`);let r=n.getDeviceFromHandle(e);if(r)return r;let i=await B_(e);if(i)throw Error(`WebGPU device is already lost`,{cause:i});let a=n.getDeviceFromHandle(e);if(a)return a;let o=e.adapterInfo||{},s=L_(t.featureLevel,e.features),c={...t,featureLevel:s,_handle:e},l=new n(c,e,null,o,!1),u=n.getCanvasContextProps(c);if(u)try{l.initializeCanvasContext(u)}catch(e){throw l.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})}return l}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}};async function z_(t){try{return t.info||await t.requestAdapterInfo?.()||{}}catch(t){return e.warn(`WebGPU adapter metadata is unavailable`,t)(),{}}}async function B_(e){return await Promise.race([e.lost,Promise.resolve(null)])}async function V_(e){if(e===`webgpu`||e===`webgl`)return e;try{return await navigator.gpu?.requestAdapter()?`webgpu`:`webgl`}catch{return`webgl`}}function H_(e){return{type:e,adapters:e===`webgpu`?[R_,Jf]:[Jf]}}function U_({device:e,deviceType:t=`webgpu`}){return e?{device:e}:{deviceProps:H_(t)}}var Z=[-74.006,40.7128,0];function W_(){let e=[{name:`District`,kind:`ground`,center:[0,0,-3],size:[1050,1250,2],color:[.17,.23,.27]},{name:`River`,kind:`water`,center:[0,0,0],size:[170,1250,0],color:[.08,.39,.48]},{name:`North bridge`,kind:`bridge`,center:[0,275,8],size:[240,30,5],color:[.69,.76,.74]},{name:`South bridge`,kind:`bridge`,center:[0,-265,8],size:[240,30,5],color:[.69,.76,.74]}];for(let t of[-1,1])for(let n=0;n<8;n++)for(let r=0;r<3;r++){let i=[t*(122+r*135),n*135-470,0];if((n+r*2)%7==0)e.push({name:`Riverside garden ${e.length}`,kind:`park`,center:i,size:[78,85,1],color:[.25,.43,.35]});else{let a=25+(n*17+r*31+(t+1)*11)%100;e.push({name:`${t<0?`West`:`East`} ${n+1}.${r+1}`,kind:`building`,center:i,size:[65+r*5,72,a],color:r===0?[.83,.76,.61]:[.61,.71,.73]})}}return e}function G_(e){let t=[];return e.forEach((e,n)=>{let[r,i,a]=e.center,[o,s,c]=e.size,l=r-o/2,u=r+o/2,d=i-s/2,f=i+s/2,p=a+c;m([[l,d,p],[u,d,p],[u,f,p],[l,f,p]],[0,0,1]),c>0&&(m([[l,d,a],[u,d,a],[u,d,p],[l,d,p]],[0,-1,0]),m([[u,d,a],[u,f,a],[u,f,p],[u,d,p]],[1,0,0]),m([[u,f,a],[l,f,a],[l,f,p],[u,f,p]],[0,1,0]),m([[l,f,a],[l,d,a],[l,d,p],[l,f,p]],[-1,0,0]));function m(r,i){for(let a of[0,1,2,0,2,3])t.push(...r[a],...i,...e.color,n)}}),new Float32Array(t)}var K_=6.5,q_=Date.UTC(2026,5,21,4);function Q(e){let t=q_+e*36e5,n=_u(t,Z[1],Z[0]),r=Hu(n.altitude,n.azimuth),i=Math.max(0,1-r[2]*1.6);return{direction:r,color:[255,250-i*58,238-i*105],altitude:n.altitude,timestamp:t}}function J_(e){let t=Math.round(e*60);return`${String(Math.floor(t/60)).padStart(2,`0`)}:${String(t%60).padStart(2,`0`)} EDT`}var Y_={name:`riverfrontCaster`,uniformTypes:{viewProjectionMatrix:`mat4x4<f32>`},vs:`layout(std140) uniform riverfrontCasterUniforms { mat4 viewProjectionMatrix; } riverfrontCaster;`,source:`struct RiverfrontCasterUniforms { viewProjectionMatrix: mat4x4f };
@group(0) @binding(auto) var<uniform> riverfrontCaster: RiverfrontCasterUniforms;`},X_=class{id=`riverfront-soft-shadows`;props={};useInPicking=!1;renderer=null;shadowProps=null;viewMatrix=new R;frameCount=0;vertices=null;casters=[];constructor(e,t){this.features=e,this.settings=t}setup({device:e}){this.renderer=new yg(e,{quality:this.settings.quality,spotLightCapacity:0,pointLightCapacity:0});let t=G_(this.features.filter(e=>e.kind===`building`||e.kind===`bridge`));this.vertices=e.createBuffer({id:`riverfront-shadow-casters`,data:t}),this.casters=Array.from({length:4},(n,r)=>new C(e,{id:`riverfront-caster-${r}`,vs:`#version 300 es
in vec3 position;
void main() {
  vec4 clip = riverfrontCaster.viewProjectionMatrix * vec4(position, 1.0);
  gl_Position = vec4(clip.xy, clip.z * 2.0 - clip.w, clip.w);
}`,fs:`#version 300 es
precision highp float; void main() {}`,source:`@vertex fn vertexMain(@location(0) position: vec3f) -> @builtin(position) vec4f {
  return riverfrontCaster.viewProjectionMatrix * vec4f(position, 1.0);
}
@fragment fn fragmentMain() {}`,shaderInputs:new g({riverfrontCaster:Y_}),topology:`triangle-list`,vertexCount:t.length/10,bufferLayout:[{name:`vertices`,byteStride:40,attributes:[{attribute:`position`,format:`float32x3`,byteOffset:0}]}],attributes:{vertices:this.vertices},colorAttachmentFormats:[],depthStencilAttachmentFormat:`depth32float`,parameters:{depthCompare:`less-equal`,depthWriteEnabled:!0,cullMode:`none`}}))}preRender(e){if(e.isPicking||!this.renderer||!e.viewports[0])return;let t=Z_(e.viewports[0]);this.viewMatrix=t.viewMatrix,this.renderer.setProps({quality:this.settings.quality}),this.shadowProps=this.renderer.render({camera:t,directionalLights:[{direction:Q(this.settings.hour).direction,shadowDistance:Math.min(t.far,2600),casterDistance:450,sourceAngularRadius:this.settings.softness,cascadeSplitLambda:.65,cascadeBlendFraction:.15,normalBias:.12,depthBias:2,depthBiasSlopeScale:2,strength:this.settings.enabled&&Q(this.settings.hour).direction[2]>0?1:0}],drawShadowCasters:e=>this.drawCasters(e)}),this.frameCount++}cleanup(){for(let e of this.casters)e.destroy();this.casters=[],this.vertices?.destroy(),this.vertices=null,this.renderer?.destroy(),this.renderer=null,this.shadowProps=null}drawCasters(e){let t=this.casters[e.cascadeIndex??0];t.shaderInputs.setProps({riverfrontCaster:{viewProjectionMatrix:e.viewProjectionMatrix}}),t.setParameters(e.rasterParameters),t.draw(e.renderPass)}};function Z_(e){let t=e.projectPosition(Z),n=e.getDistanceScales(Z).unitsPerMeter,r=n[2]*Math.hypot(e.viewMatrix[8],e.viewMatrix[9],e.viewMatrix[10]),i=new R().scale([1/r,1/r,1/r]).multiplyRight(e.viewMatrix).translate(t).scale(n),a=new R([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(e.projectionMatrix).scale(r),o=e.projectionMatrix[10],s=e.projectionMatrix[14]/r;return{viewMatrix:i,projectionMatrix:a,clipDepth:`zero-to-one`,near:s/(o-1),far:s/(o+1)}}var Q_={name:`riverfrontReceiver`,uniformTypes:{viewMatrix:`mat4x4<f32>`,cameraPosition:`vec3<f32>`},vs:`layout(std140) uniform riverfrontReceiverUniforms { mat4 viewMatrix;
vec3 cameraPosition; } riverfrontReceiver;`,fs:`layout(std140) uniform riverfrontReceiverUniforms {
    mat4 viewMatrix;
    vec3 cameraPosition;
  } riverfrontReceiver;`,source:`struct RiverfrontReceiverUniforms { viewMatrix: mat4x4f,
cameraPosition: vec3f };
@group(3) @binding(auto) var<uniform> riverfrontReceiver: RiverfrontReceiverUniforms;`},$_=class extends Gh{static layerName=`ShadowDistrictLayer`;getAttributeManager(){return null}initializeState(){}updateState({props:e,oldProps:t}){if(this.state.model&&e.features===t.features)return;this.destroyMesh();let n=G_(e.features),r=this.context.device.createBuffer({data:n});this.setState({vertices:r});try{let e=new C(this.context.device,{...this.getShaders({source:ev,vs:tv,fs:nv,modules:[hc,ml,Wa,r_,Ya,Za,Q_]}),id:`${this.id}-mesh`,topology:`triangle-list`,vertexCount:n.length/10,bufferLayout:[{name:`vertices`,byteStride:40,attributes:[{attribute:`position`,format:`float32x3`,byteOffset:0},{attribute:`normal`,format:`float32x3`,byteOffset:12},{attribute:`color`,format:`float32x3`,byteOffset:24},{attribute:`featureIndex`,format:`float32`,byteOffset:36}]}],attributes:{vertices:r},parameters:{depthCompare:`less-equal`,depthWriteEnabled:!0,cullMode:`none`}});this.setState({model:e})}catch(e){throw this.destroyMesh(),e}}getModels(){return this.state.model?[this.state.model]:[]}draw({renderPass:e}){let t=this.props.shadowEffect;if(!t.shadowProps)return;let n=Q(t.settings.hour);this.state.model?.shaderInputs.setProps({shadow:t.shadowProps,clouds:{...Ya.defaultUniforms,...this.props.clouds()},atmosphere:{...Za.defaultUniforms,...this.props.atmosphere()},riverfrontReceiver:{viewMatrix:t.viewMatrix,cameraPosition:sg(this.context.viewport,this.props.coordinateOrigin,this.context.viewport.cameraPosition)},lambertMaterial:{ambient:.3,diffuse:.85},lighting:{enabled:!0,lights:[{type:`ambient`,color:[218,233,255],intensity:1},{type:`directional`,color:n.color,intensity:n.direction[2]>0?1:0,direction:n.direction.map(e=>-e)}]}}),this.state.model?.draw(e)}getPickingInfo({info:e}){return e.object=this.props.features[e.index],e}finalizeState(e){this.destroyMesh(),super.finalizeState(e)}destroyMesh(){this.state.model?.destroy(),this.state.vertices?.destroy(),this.setState({model:void 0,vertices:void 0})}},ev=`
struct CityVertex {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
  @location(1) @interpolate(flat) pickingColor: vec3f,
  @location(2) worldPosition: vec3f,
  @location(3) normal: vec3f,
  @location(4) viewDepth: f32,
};
@vertex fn vertexMain(
  @location(0) position: vec3f, @location(1) normal: vec3f,
  @location(2) color: vec3f, @location(3) featureIndex: f32
) -> CityVertex {
  var output: CityVertex;
  output.position = project_position_to_clipspace(position, vec3f(0.0), vec3f(0.0));
  output.worldPosition = position;
  output.normal = normal;
  output.viewDepth = -(riverfrontReceiver.viewMatrix * vec4f(position, 1.0)).z;
  output.color = color;
  output.pickingColor = picking_getPickingColorFromIndex(u32(featureIndex));
  return output;
}
@fragment fn fragmentMain(input: CityVertex) -> @location(0) vec4f {
  if (picking.isActive > 0.5) {
    if (picking_isColorZero(input.pickingColor)) { discard; }
    return vec4f(input.pickingColor, 1.0);
  }
  let normal = normalize(input.normal);
  let ambient = lambertMaterial.ambient * input.color * lighting.ambientColor;
  let lit = lighting_getLightColor2(input.color, vec3f(0.0), input.worldPosition, normal);
  let visibility = shadow_getDirectionalFactor(input.worldPosition, normal, input.viewDepth) * clouds_getTransmittance(input.worldPosition);
  var color = ambient + (lit - ambient) * visibility;
  if (picking.isHighlightActive > 0.5 && distance(input.pickingColor, picking_normalizeColor(picking.highlightedObjectColor)) < 0.00001) {
    color = mix(color, picking.highlightColor.rgb, picking.highlightColor.a);
  }
  return atmosphere_getColor(vec4f(color, layer.opacity), input.worldPosition, riverfrontReceiver.cameraPosition);
}
`,tv=`#version 300 es
in vec3 position;
in vec3 normal;
in vec3 color;
in float featureIndex;
out vec3 surfaceColor;
out vec3 worldPosition;
out vec3 surfaceNormal;
out float viewDepth;
void main() {
  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(featureIndex);
  vec4 commonPosition;
  gl_Position = project_position_to_clipspace(position, vec3(0.0), vec3(0.0), commonPosition);
  geometry.position = commonPosition;
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  vec4 filterColor = vec4(color, 1.0);
  DECKGL_FILTER_COLOR(filterColor, geometry);
  surfaceColor = color;
  worldPosition = position;
  surfaceNormal = normal;
  viewDepth = -(riverfrontReceiver.viewMatrix * vec4(position, 1.0)).z;
}`,nv=`#version 300 es
precision highp float;
in vec3 surfaceColor;
in vec3 worldPosition;
in vec3 surfaceNormal;
in float viewDepth;
out vec4 fragColor;
void main() {
  vec3 normal = normalize(surfaceNormal);
  vec3 ambient = material.ambient * surfaceColor * lighting.ambientColor;
  vec3 lit = lighting_getLightColor(surfaceColor, vec3(0.0), worldPosition, normal);
  float visibility = shadow_getDirectionalFactor(worldPosition, normal, viewDepth) * clouds_getTransmittance(worldPosition);
  fragColor = atmosphere_getColor(vec4(ambient + (lit - ambient) * visibility, layer.opacity), worldPosition, riverfrontReceiver.cameraPosition);
  DECKGL_FILTER_COLOR(fragColor, geometry);
}`,rv=20;function iv(e,t,n){let r=Math.max(0,Math.min(165,e.pitch??0)),i={nearZ:.01,farZ:100},a=new nu({...e,...i,width:t,height:n,pitch:r,fovy:50,position:[0,0,0]}),o=a.cameraPosition[2]/a.getDistanceScales().unitsPerMeter[2];return{...e,...i,pitch:r,maxPitch:165,position:[0,0,Math.max(0,rv-o)]}}function av(e,t={}){let n=W_();for(let e of n)e.kind===`ground`&&(e.color=[.72,.73,.69]),e.kind===`building`&&(e.color=[.85,.82,.75]),e.kind===`water`&&(e.color=[.14,.4,.47]);let r={hour:K_,animated:!0,hoursPerSecond:.8,enabled:!0,softness:.018,quality:`balanced`},i={frames:0,backend:``,error:``,finalized:!1},a,o,s=new Promise((e,t)=>{a=e,o=t}),c=new X_(n,r),l={sun:!0,moon:!0},u={enabled:!0,haze:1},d={enabled:!0,shadows:!0,animated:!0,cover:.4,windSpeed:18,windDirection:75,time:0};function f(){return r.animated||d.enabled&&d.animated}function p(e){let t=new Date(Q(e).timestamp),n=ju(t,Z[1],Z[0]),r=Mu(t),i=n.altitude,a=Hu(i,n.azimuth),o=Math.PI/2+r.angle-n.parallacticAngle-(r.phase>.5?Math.PI:0);return{direction:a,phase:r.phase,limbAngle:o,altitude:i}}function m(){let e=Q(r.hour);return{cover:d.enabled?d.cover:0,time:d.time,velocity:[Math.sin(d.windDirection*Math.PI/180)*d.windSpeed,Math.cos(d.windDirection*Math.PI/180)*d.windSpeed],sunDirection:[...e.direction],sunColor:[e.color[0]/255,e.color[1]/255,e.color[2]/255]}}function h(){return{enabled:u.enabled?1:0,sunDirection:[...Q(r.hour).direction],haze:u.haze}}function g(){let e=Q(r.hour),t=p(r.hour);return[new D_({id:`riverfront-atmosphere`,coordinateOrigin:Z,...h(),visible:u.enabled}),new __({id:`riverfront-sun`,direction:e.direction,coordinateOrigin:Z,color:[e.color[0],e.color[1],e.color[2],255],radiusPixels:14,visible:l.sun}),new v_({id:`riverfront-moon`,direction:t.direction,coordinateOrigin:Z,phase:t.phase,limbAngle:t.limbAngle,radiusPixels:18,visible:l.moon}),new C_({id:`riverfront-clouds`,coordinateOrigin:Z,visible:d.enabled,...m()}),new $_({id:`riverfront-shadow-district`,data:n,features:n,shadowEffect:c,clouds:()=>({...m(),cover:d.shadows?m().cover:0}),atmosphere:h,pickable:!0,coordinateSystem:Ks.METER_OFFSETS,coordinateOrigin:Z})]}let _=0,v=iv({longitude:Z[0],latitude:Z[1],zoom:15,pitch:80,bearing:Math.atan2(Q(K_).direction[0],Q(K_).direction[1])*180/Math.PI-12},e.clientWidth,e.clientHeight),y={...v},b=new $f({parent:e,...U_(t),views:new uf({id:`riverfront-shadows`,fovy:50,controller:!0}),viewState:v,onViewStateChange:({viewState:t})=>{v=iv(t,e.clientWidth,e.clientHeight),b.setProps({viewState:v})},onResize:({width:e,height:t})=>{v=iv(v,e,t),b.setProps({viewState:v})},effects:[c],layers:g(),_animate:!0,onDeviceInitialized:e=>{i.backend=e.type},onLoad:()=>a(),onBeforeRender:()=>{let e=performance.now();r.animated&&_&&(r.hour=0+(r.hour-0+(e-_)/1e3*r.hoursPerSecond)%24),_&&d.enabled&&d.animated&&(d.time+=Math.min(e-_,1e3)/1e3),_=e,b.setProps({layers:g()})},onAfterRender:()=>{i.frames++,e.dispatchEvent(new Event(`sun-frame`))},onError:e=>{i.error||=e.message,o(e)},getTooltip:e=>e.object?.name??null});return{deck:b,settings:r,sky:l,get viewState(){return v},cloudSettings:d,atmosphereSettings:u,shadowEffect:c,diagnostics:i,ready:s,get moon(){return p(r.hour)},setClouds(e){d.enabled=e,_=0,b.setProps({_animate:f(),layers:g()}),b.redraw(`cloud toggle`)},setCloudAnimated(e){d.animated=e,_=0,b.setProps({_animate:f()}),b.redraw(`cloud animation`)},setCloudShadows(e){d.shadows=e,b.redraw(`cloud shadows`)},setAtmosphere(e){u.enabled=e,b.setProps({layers:g()}),b.redraw(`atmosphere`)},setHaze(e){u.haze=e,b.setProps({layers:g()}),b.redraw(`atmospheric haze`)},setCloudTime(e){d.time=e,_=0,b.setProps({layers:g()}),b.redraw(`cloud time`)},setCloudCover(e){d.cover=e,b.redraw(`cloud cover`)},setWindSpeed(e){d.windSpeed=e,b.redraw(`cloud wind`)},setWindDirection(e){d.windDirection=e,b.redraw(`cloud wind direction`)},setSkyBody(e,t){l[e]=t,b.setProps({layers:g()})},centerView(){v=iv(y,e.clientWidth,e.clientHeight),b.setProps({viewState:v}),b.redraw(`center riverfront`)},lookAtSkyBody(t){let n=r.hour;t===`sun`&&Q(n).direction[2]<=0&&(n=K_),t===`moon`&&p(n).direction[2]<=0&&(n=Array.from({length:48},(e,t)=>t/2).find(e=>{let t=p(e).altitude*180/Math.PI;return t>4&&t<15})??r.hour),r.hour=n,r.animated=!1,_=0;let i=t===`sun`?Q(n).direction:p(n).direction;v=iv({longitude:Z[0],latitude:Z[1],zoom:15,pitch:90+Math.asin(i[2])*180/Math.PI,bearing:Math.atan2(i[0],i[1])*180/Math.PI},e.clientWidth,e.clientHeight),b.setProps({_animate:f(),layers:g(),viewState:v}),b.redraw(`sky body view`)},get sun(){return Q(r.hour)},setHour(e){r.hour=Math.max(0,Math.min(24,e)),b.redraw(`sun time`)},setAnimated(e){r.animated=e,_=0,b.setProps({_animate:f()}),b.redraw(`sun animation`)},setShadows(e){r.enabled=e,b.redraw(`shadow toggle`)},setSoftness(e){r.softness=e,b.redraw(`shadow softness`)},setSpeed(e){r.hoursPerSecond=e},setQuality(e){r.quality=e,b.redraw(`shadow quality`)},finalize(){i.finalized||(i.finalized=!0,b.finalize())}}}var ov=document.querySelector(`#scene`),sv=document.querySelector(`#status`),cv=document.querySelector(`#hour`),lv=document.querySelector(`#time`),uv=document.querySelector(`#backend`),dv=await V_(new URLSearchParams(location.search).get(`backend`));uv.value=dv,uv.addEventListener(`change`,()=>{location.search=`?backend=${uv.value}`});var $=av(ov,{deviceType:dv});window.riverfrontSoftShadowScene=$,ov.addEventListener(`sun-frame`,()=>{let e=$.settings.hour,t=Math.max(0,Math.min(1,$.sun.direction[2]*3)),n=[4,10,22].map((e,n)=>e+t*([36,72,99][n]-e)),r=[25,44,68].map((e,n)=>e+t*([116,150,165][n]-e));ov.style.background=`linear-gradient(rgb(${n.join(`,`)}), rgb(${r.join(`,`)}))`,lv.value=J_(e),document.activeElement!==cv&&(cv.value=String(e)),sv.value=`Sun altitude ${($.sun.altitude*180/Math.PI).toFixed(0)}° · New York, June 21`}),cv.addEventListener(`input`,()=>{$.setAnimated(!1),document.querySelector(`#animated`).checked=!1,$.setHour(Number(cv.value))});for(let[e,t]of[[`animated`,$.setAnimated],[`shadows`,$.setShadows],[`clouds`,$.setClouds],[`cloud-shadows`,$.setCloudShadows],[`cloud-animated`,$.setCloudAnimated],[`atmosphere`,$.setAtmosphere]]){let n=document.querySelector(`#${e}`);n.addEventListener(`change`,()=>t(n.checked))}for(let[e,t]of[[`softness`,$.setSoftness],[`speed`,$.setSpeed],[`cloud-cover`,$.setCloudCover],[`wind-speed`,$.setWindSpeed],[`wind-direction`,$.setWindDirection],[`haze`,$.setHaze]]){let n=document.querySelector(`#${e}`);n.addEventListener(`input`,()=>t(Number(n.value)))}document.querySelector(`#center`).addEventListener(`click`,()=>$.centerView());for(let e of[`sun`,`moon`]){let t=document.querySelector(`#show-${e}`);t.addEventListener(`change`,()=>$.setSkyBody(e,t.checked)),document.querySelector(`#look-${e}`).addEventListener(`click`,()=>{$.lookAtSkyBody(e),document.querySelector(`#animated`).checked=!1})}var fv=document.querySelector(`#quality`);fv.addEventListener(`change`,()=>{let e=fv.value;(e===`low`||e===`balanced`||e===`cinematic`)&&$.setQuality(e)}),$.ready.then(()=>{document.body.dataset.ready=`true`}).catch(e=>{sv.value=e instanceof Error?e.message:String(e),document.body.dataset.ready=`error`}),window.addEventListener(`pagehide`,()=>$.finalize());