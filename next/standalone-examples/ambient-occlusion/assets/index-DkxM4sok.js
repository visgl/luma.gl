const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/webgl-device-kjtQ_MwY.js","assets/webgl-device-DXziiocC.js","assets/buffer-layout-utils-CuSkzITn.js","assets/render-pipeline-DM0TuH--.js","assets/log-C3csoXOC.js","assets/texture-CUNOmMP2.js","assets/shader-block-layout-DKyjbPOs.js","assets/webgl-Kc0sM2Pj.js","assets/expression-B_IY1Y3r.js","assets/compute-pipeline-P9uwCXuw.js","assets/convert-colors-Q3LuSnWC.js","assets/webgpu-BLHKyplS.js","assets/webgpu-BR1BriGA.js","assets/wgsl-interface-scan-CNwPtX-P.js","assets/Arrow.dom-DgcicCtZ.js","assets/Arrow.dom-CuEe12g2.js","assets/chunk-DtRyYLXJ.js","assets/data-query-CUzuRG2A.js","assets/preload-helper-BZarUUnS.js","assets/loader-utils-DvazGlhL.js","assets/sql-parser-CIa1CXD4.js","assets/columnar-predicate-Bl_hZrtr.js","assets/parse-sql-select-CrCaiqpI.js","assets/query-C3xIamdR.js","assets/resolve-query-source-89UD7rJ6.js","assets/sql-catalog-DG1qPvFi.js","assets/spatial-reference-CeK7c2EU.js","assets/convert-arrow-schema-BJnhoCWC.js","assets/take-arrow-rows-DsQZUefz.js","assets/parse-sql-statement-DEWm0lXZ.js","assets/accessor-queries-BIphk7MI.js","assets/deep-equal-DOGKaaWO.js","assets/compiler-BOOzK0jG.js","assets/typed-array-brand-B1DUr6Bg.js","assets/webgpu-device-BL-RBo3s.js","assets/external-texture-B1MI6jEz.js"])))=>i.map(i=>d[i]);
import{t as e}from"./chunk-DtRyYLXJ.js";import{c as t,d as n,l as r,s as i,t as a,u as o}from"./image-loader-types-Zl5vUe39.js";import{r as s,t as c}from"./log-C3csoXOC.js";import{t as l}from"./preload-helper-BZarUUnS.js";import{C as u,D as d,E as f,T as p,g as m,i as h,m as g,p as _,r as v,t as y,w as b,y as x}from"./buffer-layout-utils-CuSkzITn.js";import{n as S,r as C,t as w}from"./authentication-CHtrIxQ-.js";import{n as T}from"./spatial-reference-CeK7c2EU.js";import{i as E,n as D,r as O,t as k}from"./native-arrow-CVLwPD9w.js";import{t as A}from"./compute-pipeline-P9uwCXuw.js";import{F as j,M,N as ee,O as te,c as ne,d as re,f as ie,h as ae,i as N,k as oe,l as se,m as ce,n as le,o as ue,p as de,r as fe,s as pe,u as me}from"./expression-B_IY1Y3r.js";import{S as he,T as ge,_ as P,b as F,d as _e,h as I,m as ve,p as ye,t as be,u as xe,y as Se}from"./render-pipeline-DM0TuH--.js";import{n as Ce,r as we,t as Te}from"./shader-block-layout-DKyjbPOs.js";import{a as Ee,h as De}from"./webgpu-BR1BriGA.js";import{a as Oe,c as ke,i as Ae,l as je,n as Me,o as Ne,r as Pe,s as Fe,t as Ie,u as Le}from"./convert-colors-Q3LuSnWC.js";import{n as Re,t as L}from"./texture-CUNOmMP2.js";import{t as ze}from"./external-texture-B1MI6jEz.js";import{a as Be,i as Ve,n as He,r as Ue,t as We}from"./webgl-device-DXziiocC.js";import{t as Ge}from"./typed-array-brand-B1DUr6Bg.js";import{t as Ke}from"./deep-equal-DOGKaaWO.js";import{n as qe,t as Je}from"./loader-utils-DvazGlhL.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var Ye=`(max-width: 700px), (max-height: 500px) and (pointer: coarse)`,Xe=15e5;function Ze(e,t){let n=typeof e.matchMedia==`function`?e.matchMedia.bind(e):()=>({matches:!1}),r=n(`(pointer: coarse)`).matches,i=e.innerWidth||1,a=e.innerHeight||1;return{compactViewport:n(Ye).matches,handheld:r&&t.maxTouchPoints>0&&Math.min(i,a)<=700,coarsePointer:r,maxTouchPoints:t.maxTouchPoints||0,viewportWidth:i,viewportHeight:a,devicePixelRatio:e.devicePixelRatio||1}}function Qe({devicePixelRatio:e,viewportHeight:t,viewportWidth:n,handheld:r}){let i=Math.max(n,1)*Math.max(t,1);if(!r)return!0;let a=Math.max(1,Math.min(2,Math.sqrt(Xe/i)));return e<=a?!0:a}function $e(e,t){let n=t.handheld&&e.mobileMode===`reduced`;return{canvasPixelRatio:Qe(t),intermediateTargetScale:n?.75:1,maximumSampleCount:n?2:4,preferFloatingPointColor:!n,maximumWorkerCount:n?1:2,maximumConcurrentLoadCount:n?2:4,maximumResidentRecordCount:n?25e4:1e6,simulationDimensionScale:n?.5:1,simulationIterationScale:n?.5:1}}function et(e,t){return t.handheld&&e.mobileMode===`unsupported`?e.unsupportedReason||`This example does not support mobile devices.`:void 0}function tt(e){switch(e){case`full`:return`Mobile`;case`reduced`:return`Mobile quality`;case`unsupported`:return`Desktop only`}}function nt(e,t,n){let r=et(e,t);if(r)return{supported:!1,reason:r};let i=e.requirements;if(!i)return{supported:!0};if(!i.backends.some(e=>n.backends.includes(e)))return{supported:!1,reason:`This example requires ${dt(i.backends)}, but this browser does not expose a compatible graphics backend. Try a current browser on a capable device or use a desktop browser.`};let a=new Set(n.deviceFeatures),o=i.requiredDeviceFeatures?.find(e=>!a.has(e));if(o)return{supported:!1,reason:`This example requires the GPU feature “${o}”. Try a current browser on a capable device or use a desktop browser.`};let s=i.requiredDeviceLimits,c=n.deviceLimits;return s?.maxColorAttachments!==void 0&&(c?.maxColorAttachments??0)<s.maxColorAttachments?{supported:!1,reason:`This example requires ${s.maxColorAttachments} color attachments, but this GPU exposes only ${c?.maxColorAttachments??0}. Try a capable device or desktop browser.`}:s?.maxColorAttachmentBytesPerSample!==void 0&&(c?.maxColorAttachmentBytesPerSample??0)<s.maxColorAttachmentBytesPerSample?{supported:!1,reason:`This example requires ${s.maxColorAttachmentBytesPerSample} color-attachment bytes per sample, but this GPU exposes only ${c?.maxColorAttachmentBytesPerSample??0}. Try a capable device or desktop browser.`}:{supported:!0}}async function rt(){let e=document.documentElement,t=at(document),n=Ze(window,navigator),r=nt(t,n,{backends:await it()}),i=$e(t,n);e.dataset.lumaExampleId=t.id,e.dataset.lumaExampleMobileMode=t.mobileMode,e.dataset.lumaExampleQualityProfile=t.mobileProfile,e.dataset.lumaExampleState=r.supported?`loading`:`unsupported`,n.handheld&&typeof i.canvasPixelRatio==`number`&&Object.defineProperty(window,`devicePixelRatio`,{configurable:!0,value:i.canvasPixelRatio});let a=t=>{e.dataset.lumaExampleState!==`unsupported`&&(e.dataset.lumaExampleState=`failed`,ct(`failed`,ut(t)))},o=()=>{e.dataset.lumaExampleState===`loading`&&(e.dataset.lumaExampleState=`running`)};return window.addEventListener(`error`,e=>a(e.error||e.message)),window.addEventListener(`unhandledrejection`,e=>a(e.reason)),lt(),n.handheld&&st(t.mobileMode),r.supported===!1?ct(`unsupported`,r.reason):ot(o),{supported:r.supported,reportFailed:a,reportRunning:o}}async function it(){let e=[];if(`WebGL2RenderingContext`in window&&e.push(`webgl2`),`gpu`in navigator)try{let t=navigator.gpu;t&&await t.requestAdapter()&&e.push(`webgpu`)}catch{}return e}function at(e){let t=t=>e.querySelector(`meta[name="${t}"]`)?.content||void 0,n=t(`luma-example-mobile`),r=t(`luma-example-mobile-profile`),i=(t(`luma-example-backends`)||``).split(`,`).filter(Boolean);return{id:t(`luma-example-id`)||location.pathname,mobileMode:n||`reduced`,mobileProfile:r||`standard`,unsupportedReason:t(`luma-example-mobile-unsupported-reason`),requirements:i.length?{backends:i}:void 0}}function ot(e){let t=!1,n=()=>{if(t)return;let n=document.querySelector(`canvas`),i=n&&n.clientWidth>0&&n.clientHeight>0,a=[...document.body?.querySelectorAll(`*`)||[]].some(e=>{if(e instanceof HTMLScriptElement||e instanceof HTMLStyleElement||e.hasAttribute(`data-luma-example-mobile-badge`)||e.hasAttribute(`data-luma-example-status`))return!1;let t=e.getBoundingClientRect();return t.width>0&&t.height>0&&(e.textContent?.trim()||e.children.length)});(i||a)&&(t=!0,r.disconnect(),requestAnimationFrame(()=>requestAnimationFrame(e)))},r=new MutationObserver(n);r.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener(`load`,n,{once:!0})}function st(e){let t=document.createElement(`span`);t.dataset.lumaExampleMobileBadge=``,t.setAttribute(`aria-label`,`Mobile support: ${tt(e)}`),t.style.cssText=`position:fixed;left:calc(8px + env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:2147483646;padding:4px 8px;border:1px solid #7dd3fc57;border-radius:999px;background:#020617dd;color:#bae6fd;font:700 11px/1.4 system-ui;pointer-events:none;`,t.textContent=tt(e),document.body.append(t)}function ct(e,t){document.querySelector(`[data-luma-example-status]`)?.remove();let n=document.createElement(`div`);n.dataset.lumaExampleStatus=e,n.setAttribute(`role`,`alert`),n.style.cssText=`position:fixed;inset:16px;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;border:1px solid #475569;border-radius:12px;background:#020617ee;color:#e2e8f0;font:16px/1.5 system-ui;text-align:center;`;let r=document.createElement(`div`);r.style.maxWidth=`620px`;let i=document.createElement(`strong`);i.style.cssText=`display:block;font-size:20px;margin-bottom:8px;`,i.textContent=e===`unsupported`?`This example is not supported on this device.`:`This example could not start.`;let a=document.createElement(`span`);a.textContent=t,r.append(i,a),n.append(r),document.body.append(n)}function lt(){let e=document.createElement(`style`);e.textContent=`
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
  `,document.head.append(e)}function ut(e){return e instanceof Error?e.message:typeof e==`string`?e:`An unexpected error stopped the example.`}function dt(e){return e.map(e=>e===`webgpu`?`WebGPU`:`WebGL2`).join(` or `)}(await rt()).supported||document.querySelectorAll(`script[type="module"]:not([data-luma-example-support-bootstrap])`).forEach(e=>e.remove());var ft=e=>typeof e==`boolean`,pt=e=>typeof e==`function`,mt=e=>typeof e==`object`&&!!e,ht=e=>mt(e)&&e.constructor==={}.constructor,gt=e=>typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer,_t=e=>mt(e)&&typeof e.byteLength==`number`&&typeof e.slice==`function`,vt=e=>mt(e)&&`then`in e&&pt(e.then),yt=e=>!!e&&pt(e[Symbol.iterator]),bt=e=>!!e&&pt(e[Symbol.asyncIterator]),xt=e=>!!e&&pt(e.next),St=e=>typeof Response<`u`&&e instanceof Response||mt(e)&&pt(e.arrayBuffer)&&pt(e.text)&&pt(e.json),Ct=e=>typeof Blob<`u`&&e instanceof Blob,wt=e=>typeof ReadableStream<`u`&&e instanceof ReadableStream||mt(e)&&pt(e.tee)&&pt(e.cancel)&&pt(e.getReader),Tt=e=>mt(e)&&pt(e.read)&&pt(e.pipe)&&ft(e.readable),Et=e=>wt(e)||Tt(e);function Dt(e,t){return Ot(e||{},t)}function Ot(e,t,n=0){if(n>3)return t;let r={...e};for(let[e,i]of Object.entries(t))ht(i)?r[e]=Ot(r[e]||{},t[e],n+1):r[e]=t[e];return r}var kt=`master`;`${kt}`,`${kt}`;var At=`beta`;function jt(){let e=`5.0.0-rc.2`;return globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version||=e,e}var Mt=jt();function Nt(e,t){if(!e)throw Error(t||`loaders.gl assertion failed.`)}var Pt={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};Pt.self||Pt.window||Pt.global,Pt.window||Pt.self||Pt.global,Pt.global||Pt.self||Pt.window,Pt.document;var Ft=typeof process!=`object`||String(process)!==`[object process]`||process.browser,It=typeof window<`u`&&window.orientation!==void 0,Lt=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);Lt&&parseFloat(Lt[1]);var Rt=`latest`;function zt(){return typeof __VERSION__>`u`?Rt:__VERSION__}var Bt=zt();function Vt(e,t){if(!e)throw Error(t||`loaders.gl assertion failed.`)}var Ht={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};Ht.self||Ht.window||Ht.global,Ht.window||Ht.self||Ht.global,Ht.global||Ht.self||Ht.window,Ht.document;var Ut=typeof process!=`object`||String(process)!==`[object process]`||process.browser,Wt=typeof window<`u`&&window.orientation!==void 0,Gt=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);Gt&&parseFloat(Gt[1]);var Kt=class{constructor(e,t){this.isRunning=!0,this.isCancelled=!1,this.failed=!1,this.postMessageMs=0,this.complete=()=>{},this.processStarted=!1,this._resolve=()=>{},this._reject=()=>{},this.name=e,this.workerThread=t,this.completion=new Promise(e=>{this.complete=e}),this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t,n){if(!this.isRunning||this.isCancelled)return;let r=performance.now();(e===`process`||e===`process-in-batches`||e===`preload`)&&(this.processStarted=!0);try{this.workerThread.postMessage({source:`loaders.gl`,type:e,payload:t},n)}finally{this.postMessageMs+=performance.now()-r}}done(e){this.isRunning&&(this.isRunning=!1,this.executionMs=e?.executionMs,clearTimeout(this.cancellationTimer),this.complete(),this.isCancelled||this._resolve(e))}error(e){this.isRunning&&(this.isRunning=!1,this.failed=!0,this.sharedState?.snapshot.cancelled&&(this.isCancelled=!0),clearTimeout(this.cancellationTimer),this.complete(),this._reject(e))}cancel(e,t=1e3){if(!this.isRunning||this.isCancelled)return;if(!Number.isFinite(t)||t<0){this.abort(RangeError(`cancellationTimeout must be finite and nonnegative`));return}this.isCancelled=!0,this.sharedState?.cancel();let n=arguments.length?e:qt(`Worker job "${this.name}" was cancelled`);if(!this.processStarted){this.error(n);return}this._reject(n);try{this.workerThread.postMessage({source:`loaders.gl`,type:`cancel`,payload:{}},[]),this.cancellationTimer=setTimeout(()=>this.abort(e),t)}catch(e){this.abort(e)}}abort(e){this.isRunning&&(this.isCancelled=!0,this.sharedState?.cancel(),this.workerThread.destroy(),this.error(arguments.length?e:qt(`Worker job "${this.name}" was aborted`)))}};function qt(e){let t=Error(e);return t.name=`AbortError`,t}var Jt=class{constructor(...e){let t=globalThis.process?.getBuiltinModule?.(`node:worker_threads`).Worker;if(t)return new t(...e)}terminate(){}};globalThis.process?.getBuiltinModule?.(`node:worker_threads`)?.parentPort;var Yt=new Map;function Xt(e){if(Vt(e.source&&!e.url||!e.source&&e.url),e.url&&e.workerType===`module`){let t=globalThis.document?.baseURI??globalThis.location?.href;if(!t)return e.url;let n=new URL(e.url,t),r=globalThis.location?.origin;return/^https?:$/.test(n.protocol)&&n.origin!==r?Qt(`import ${JSON.stringify(n.href)};`):e.url}let t=Yt.get(e.source||e.url);return t||(e.url&&(t=Zt(e.url),Yt.set(e.url,t)),e.source&&(t=Qt(e.source),Yt.set(e.source,t))),Vt(t),t}function Zt(e){return e.startsWith(`http`)?Qt($t(e)):e}function Qt(e){let t=new Blob([e],{type:`application/javascript`});return URL.createObjectURL(t)}function $t(e){return`\
try {
  importScripts('${e}');
} catch (error) {
  console.error(error);
  throw error;
}`}function en(e,t=!0,n){let r=n||new Set,i=new Set;function a(e){if(!(!e||typeof e!=`object`||i.has(e))){if(i.add(e),tn(e))r.add(e);else if(ArrayBuffer.isView(e))tn(e.buffer)&&r.add(e.buffer);else if(t&&typeof MessageChannel<`u`&&e instanceof MessageChannel)a(e.port1),a(e.port2);else if(t&&e instanceof Map)for(let[t,n]of e)a(t),a(n);else if(t&&e instanceof Set)for(let t of e)a(t);else if(t)for(let t of Object.keys(e))a(e[t])}}return a(e),n===void 0?Array.from(r):[]}function tn(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}function nn(e){let t=new Map;function n(e){if(typeof e==`function`||e instanceof RegExp)return{};if(!e||typeof e!=`object`)return e;if(t.has(e))return t.get(e);if(ArrayBuffer.isView(e)||e instanceof ArrayBuffer||typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer||e instanceof Date||typeof WebAssembly<`u`&&e instanceof WebAssembly.Module||tn(e))return e;let r=e instanceof Map?new Map:e instanceof Set?new Set:Array.isArray(e)?[]:{};if(t.set(e,r),e instanceof Map)for(let[t,i]of e)r.set(n(t),n(i));else if(e instanceof Set)for(let t of e)r.add(n(t));else for(let t of Object.keys(e))Object.defineProperty(r,t,{value:n(e[t]),enumerable:!0,writable:!0,configurable:!0});return r}return e===null?{}:n(e)}var rn=()=>{},an=class{static isSupported(){return typeof Worker<`u`&&Ut||Jt!==void 0&&!Ut}constructor(e){this.terminated=!1,this.createdAt=performance.now(),this._loadableURL=``;let{name:t,source:n,url:r,getUrl:i,loadWorker:a}=e;Vt(n||r||i||a),this.name=t,this.source=n,this.url=r,this.workerType=e.workerType??`classic`,this.getUrl=i,this.loadWorker=a,this.onMessage=rn,this.onError=e=>console.log(e);let o=performance.now();this.worker=Ut?this._createBrowserWorker():this._createNodeWorker(),this.creationTimeMs=performance.now()-o}destroy(){return this.onMessage=rn,this.onError=rn,this.terminated?this.termination??Promise.resolve():(this.terminated=!0,this.termination=Promise.resolve(this.worker.terminate()).then(()=>void 0).finally(()=>this.releaseModuleWorkerURL()),this.termination.catch(()=>void 0),this.termination)}unref(){!Ut&&typeof this.worker.unref==`function`&&this.worker.unref()}ref(){!Ut&&typeof this.worker.ref==`function`&&this.worker.ref()}get isRunning(){return!!this.onMessage}postMessage(e,t){t||=en(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t=`Failed to load `;return t+=`worker ${this.name} from ${this.url||`built-in worker factory`}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){if(this.loadWorker)try{let e=this.loadWorker();if(e)return this._initializeBrowserWorker(e)}catch(e){if(!this.source&&!this.url&&!this.getUrl)throw e}let e=this.url||this.getUrl?.();this._loadableURL=Xt({source:this.source,url:e,workerType:this.workerType}),this.workerType===`module`&&e&&this._loadableURL!==e&&this._loadableURL.startsWith(`blob:`)&&(this.ownedModuleWorkerURL=this._loadableURL);try{let e=new Worker(this._loadableURL,{name:this.name,type:this.workerType});return this._initializeBrowserWorker(e)}catch(e){throw this.releaseModuleWorkerURL(),e}}releaseModuleWorkerURL(){this.ownedModuleWorkerURL&&=(URL.revokeObjectURL(this.ownedModuleWorkerURL),void 0)}_initializeBrowserWorker(e){return e.onmessage=e=>{e.data?e.data.type===`ready`?this.startupTimeMs=performance.now()-this.createdAt:this.onMessage(e.data):this.onError(Error(`No data received`))},e.onerror=e=>{let t=this.onError,n=this._getErrorFromErrorEvent(e);this.destroy(),t(n)},e.onmessageerror=()=>{let e=this.onError;this.destroy(),e(Error(`Worker message could not be deserialized`))},e}_createNodeWorker(){let e;if(this.url){let t=this.url.includes(`:/`)||this.url.startsWith(`/`)?this.url:`./${this.url}`;e=new Jt(t.startsWith(`file:`)?new URL(t):t,{eval:!1,type:this.url.endsWith(`.ts`)||this.url.endsWith(`.mjs`)?`module`:`commonjs`})}else if(this.source)e=new Jt(this.source,{eval:!0});else throw Error(`no worker`);return e.on(`message`,e=>{e?.type===`ready`?this.startupTimeMs=performance.now()-this.createdAt:this.onMessage(e)}),e.on(`error`,e=>{this.terminated=!0,this.onError(e)}),this.termination=new Promise(t=>e.on(`exit`,()=>t())),e.on(`exit`,e=>{this.terminated||(this.terminated=!0,this.onError(Error(`Worker ${this.name} exited unexpectedly (code ${e})`)))}),e}},on=class{get stats(){return{...this.totals,queuedJobs:this.jobQueue.length,activeJobs:this.activeJobs.size,queuedBytes:this.queuedBytes+this.reservedBytes,inFlightBytes:this.inFlightBytes,pendingAdmissions:this.admissions.length,reservations:this.reservations.size}}reserve(e,t={}){let{signal:n}=t;return n?.aborted?Promise.reject(n.reason):this.isDestroyed?Promise.reject(Error(`Worker pool was destroyed`)):this.isClosing?Promise.reject(Error(`Worker pool is closing`)):!Number.isSafeInteger(e)||e<0||e>this.maxQueuedBytes||e>this.maxInFlightBytes?Promise.reject(RangeError(`Reservation exceeds worker byte budgets`)):this.maxQueuedJobs<1||this.admissions.length>=this.maxPendingAdmissions?Promise.reject(RangeError(`Worker admission queue is full`)):new Promise((t,r)=>{let i=()=>{let e=this.admissions.indexOf(a);e>=0&&this.admissions.splice(e,1),a.cleanup(),r(n?.reason),this._admit()},a={inputBytes:e,resolve:t,reject:r,cleanup:()=>n?.removeEventListener(`abort`,i)};this.admissions.push(a),n?.addEventListener(`abort`,i,{once:!0}),this._admit()})}_admit(){for(;!this.isDestroyed&&!this.isClosing&&this.admissions.length;){let e=this.admissions[0];if(e.inputBytes>this.maxQueuedBytes||e.inputBytes>this.maxInFlightBytes){this.admissions.shift(),e.cleanup(),e.reject(RangeError(`Reservation exceeds worker byte budgets`));continue}if(this.jobQueue.length+this.reservations.size>=this.maxQueuedJobs||e.inputBytes>this.maxQueuedBytes-this.queuedBytes-this.reservedBytes)return;this.admissions.shift(),e.cleanup();let t={inputBytes:e.inputBytes,release:()=>{this.reservations.delete(t)&&(this.reservedBytes-=t.inputBytes,this._admit())}};this.reservations.add(t),this.reservedBytes+=t.inputBytes,this.totals.peakQueuedBytes=Math.max(this.totals.peakQueuedBytes,this.queuedBytes+this.reservedBytes),e.resolve(t)}}static isSupported(){return an.isSupported()}constructor(e){this.name=`unnamed`,this.maxConcurrency=1,this.maxMobileConcurrency=1,this.onDebug=()=>{},this.reuseWorkers=!0,this.props={},this.jobQueue=[],this.idleQueue=[],this.activeJobs=new Set,this.startingJobs=0,this.count=0,this.workers=new Set,this.queuedBytes=0,this.inFlightBytes=0,this.maxQueuedBytes=1/0,this.maxInFlightBytes=1/0,this.isDestroyed=!1,this.isClosing=!1,this.maxQueuedJobs=1/0,this.maxPendingAdmissions=128,this.priorityAgingMs=1e3,this.reservations=new Set,this.admissions=[],this.reservedBytes=0,this.totals={peakQueuedBytes:0,peakInFlightBytes:0,workersCreated:0,workerRestarts:0,completed:0,failed:0,cancelled:0},this.source=e.source,this.url=e.url,this.workerType=e.workerType,this.getUrl=e.getUrl,this.loadWorker=e.loadWorker,this.setProps(e)}close(e={}){if(this.closing)return this.closing;if(this.isDestroyed)return this.destroy();if(e.timeout!==void 0&&(!Number.isFinite(e.timeout)||e.timeout<0||e.timeout>2147483647))return Promise.reject(RangeError(`Close timeout must be between 0 and 2147483647 ms`));this.isClosing=!0;let t=Error(`Worker pool is closing`);this.admissions.splice(0).forEach(e=>{e.cleanup(),e.reject(t)}),this.reservations.clear(),this.reservedBytes=0;let n,r=new Promise(e=>{this.onDrained=e});return this.closing=(e.timeout===void 0?r:Promise.race([r,new Promise(t=>{n=setTimeout(t,e.timeout)})])).then(async()=>{clearTimeout(n),await this.destroy()}),this._checkDrained(),this.closing}_checkDrained(){this.isClosing&&!this.jobQueue.length&&!this.activeJobs.size&&!this.startingJobs&&this.onDrained?.()}destroy(e=Error(`Worker pool was destroyed`)){if(this.destruction)return this.destruction;let t=[...this.workers];this.isDestroyed=!0,this.onDrained?.(),this.activeJobs.forEach(t=>t.abort(e)),this.admissions.splice(0).forEach(t=>{t.cleanup(),t.reject(e)}),this.reservations.clear(),this.reservedBytes=0;let n=this.jobQueue.splice(0);return this.queuedBytes=0,n.forEach(t=>{t.removeAbortListener(),t.onReject(e)}),this.idleQueue.splice(0).forEach(e=>{e.destroy(),this.count--}),this.isDestroyed=!0,this.destruction=Promise.all(t.map(e=>e.destroy())).then(()=>{this.workers.clear()}),this.destruction.catch(()=>void 0),this.destruction}setProps(e){for(let t of[`maxQueuedBytes`,`maxInFlightBytes`,`maxQueuedJobs`,`maxPendingAdmissions`]){let n=e[t];if(n!==void 0&&(!(n>=0)||n!==1/0&&!Number.isSafeInteger(n)))throw RangeError(`${t} must be a nonnegative safe integer or Infinity`)}if(e.priorityAgingMs!==void 0&&(!Number.isFinite(e.priorityAgingMs)||e.priorityAgingMs<=0))throw RangeError(`priorityAgingMs must be positive and finite`);this.maxQueuedJobs=e.maxQueuedJobs??this.maxQueuedJobs,this.maxPendingAdmissions=e.maxPendingAdmissions??this.maxPendingAdmissions,this.priorityAgingMs=e.priorityAgingMs??this.priorityAgingMs,this.maxQueuedBytes=e.maxQueuedBytes??this.maxQueuedBytes,this.maxInFlightBytes=e.maxInFlightBytes??this.maxInFlightBytes,this.props={...this.props,...e},e.name!==void 0&&(this.name=e.name),e.maxConcurrency!==void 0&&(this.maxConcurrency=e.maxConcurrency),e.maxMobileConcurrency!==void 0&&(this.maxMobileConcurrency=e.maxMobileConcurrency),e.reuseWorkers!==void 0&&(this.reuseWorkers=e.reuseWorkers),e.onDebug!==void 0&&(this.onDebug=e.onDebug);for(let e of[...this.jobQueue])e.inputBytes>this.maxInFlightBytes&&(this.jobQueue.splice(this.jobQueue.indexOf(e),1),this.queuedBytes-=e.inputBytes,e.removeAbortListener(),e.onReject(RangeError(`Worker job exceeds maxInFlightBytes`)));this._admit(),this._startQueuedJob(),this._checkDrained()}get requiresInputBytes(){return this.maxQueuedBytes!==1/0||this.maxInFlightBytes!==1/0}async startJob(e,t=(e,t,n)=>e.done(n),n=(e,t)=>e.error(t),r,i={}){if(i.cancellationMode!==void 0&&![`terminate`,`cooperative`].includes(i.cancellationMode))throw Error(`Invalid worker cancellation mode`);if(i.cancellationTimeout!==void 0&&(!Number.isFinite(i.cancellationTimeout)||i.cancellationTimeout<0))throw RangeError(`cancellationTimeout must be finite and nonnegative`);if(r?.aborted)throw r.reason;if(this.isDestroyed)return Promise.reject(Error(`Worker pool was destroyed`));if(this.isClosing)return Promise.reject(Error(`Worker pool is closing`));let{inputBytes:a=0,priority:o=0}=i;if(!Number.isSafeInteger(a)||a<0||!Number.isFinite(o))throw RangeError(`Invalid worker scheduling inputBytes or priority`);if(a>this.maxInFlightBytes)throw RangeError(`Worker job exceeds maxInFlightBytes`);let s=i.admission;if(s&&(!this.reservations.has(s)||s.inputBytes!==a))throw Error(`Invalid or consumed worker admission`);let c=!this.jobQueue.length&&this.activeJobs.size<this._getMaxConcurrency()&&this.inFlightBytes+a<=this.maxInFlightBytes;if(!s&&!c&&(this.jobQueue.length+this.reservations.size>=this.maxQueuedJobs||a>this.maxQueuedBytes-this.queuedBytes-this.reservedBytes))throw RangeError(`Worker queue exceeds maxQueuedBytes or maxQueuedJobs`);s&&(this.reservations.delete(s),this.reservedBytes-=s.inputBytes);let l=new Promise((s,l)=>{let u=()=>{let e=this.jobQueue.indexOf(d);e>=0&&(this.jobQueue.splice(e,1),this.queuedBytes-=d.inputBytes,this._admit(),this._startQueuedJob(),d.removeAbortListener(),l(r?.reason),this._checkDrained())},d={name:e,inputBytes:a,priority:o,queuedAt:performance.now(),sharedState:i.sharedState,cancellationMode:i.cancellationMode,cancellationTimeout:i.cancellationTimeout,onMessage:t,onError:n,onStart:s,onReject:l,signal:r,removeAbortListener:()=>r?.removeEventListener(`abort`,u)},f=this.jobQueue.findIndex(e=>e.priority<o);return this.jobQueue.splice(f<0?this.jobQueue.length:f,0,d),this.queuedBytes+=a,c||(this.totals.peakQueuedBytes=Math.max(this.totals.peakQueuedBytes,this.queuedBytes+this.reservedBytes)),r?.addEventListener(`abort`,u,{once:!0}),this});return this._startQueuedJob(),await l}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=performance.now();if(this.jobQueue.sort((t,n)=>n.priority+Math.floor((e-n.queuedAt)/this.priorityAgingMs)-(t.priority+Math.floor((e-t.queuedAt)/this.priorityAgingMs))),this.jobQueue[0].inputBytes>this.maxInFlightBytes-this.inFlightBytes)return;let t;try{t=this._getAvailableWorker()}catch(e){let t=this.jobQueue.shift();t&&(this.queuedBytes-=t.inputBytes),this._admit(),t?.removeAbortListener(),t?.onReject(e),this._startQueuedJob(),this._checkDrained();return}if(!t)return;let n=this.jobQueue.shift();if(n){this.startingJobs++,this.queuedBytes-=n.inputBytes,this.inFlightBytes+=n.inputBytes,this.totals.peakInFlightBytes=Math.max(this.totals.peakInFlightBytes,this.inFlightBytes),this._admit();let e=performance.now();try{this.onDebug({message:`Starting job`,name:n.name,workerThread:t,backlog:this.jobQueue.length})}catch{}if(this.isDestroyed||t.terminated){this.startingJobs--,this.inFlightBytes-=n.inputBytes,n.removeAbortListener(),n.onReject(Error(`Worker pool was destroyed before job start`)),this.returnWorkerToQueue(t);return}let r=new Kt(n.name,t);r.sharedState=n.sharedState,n.removeAbortListener();let i=()=>{n.cancellationMode===`cooperative`?r.cancel(n.signal?.reason,n.cancellationTimeout):r.abort(n.signal?.reason)};n.signal?.addEventListener(`abort`,i,{once:!0}),n.signal?.aborted&&i(),this.activeJobs.add(r),this.startingJobs--,t.ref(),t.onMessage=e=>{try{r.isRunning&&n.onMessage(r,e.type,e.payload)}catch(e){r.abort(e)}},t.onError=e=>{try{n.onError(r,e)}catch(e){r.abort(e)}},r.result.catch(()=>void 0),n.onStart(r),this._startQueuedJob();try{await r.completion}catch{}finally{n.signal?.removeEventListener(`abort`,i),this.activeJobs.delete(r),this.inFlightBytes-=n.inputBytes;let a=r.isCancelled?`cancelled`:r.failed?`failed`:`completed`;this.totals[a]++;let o={name:r.name,outcome:a,queueWaitMs:e-n.queuedAt,durationMs:performance.now()-e,workerCreationMs:t.creationTimeMs,workerStartupMs:t.startupTimeMs,postMessageMs:r.postMessageMs,executionMs:r.executionMs,inputBytes:n.inputBytes};try{this.props.onMetrics?.(o),this.props.performanceMarks&&typeof performance.measure==`function`&&performance.measure(`math.gl.worker:${r.name}`,{start:n.queuedAt,end:performance.now(),detail:o})}catch{}this._admit(),this.returnWorkerToQueue(t)}}else this.returnWorkerToQueue(t)}returnWorkerToQueue(e){e.terminated||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.terminated&&!this.isDestroyed&&this.totals.workerRestarts++,e.terminated||e.destroy(),e.destroy().then(()=>this.workers.delete(e)),this.count--):(e.unref(),this.idleQueue.push(e)),this.isDestroyed||this._startQueuedJob(),this._checkDrained()}_getAvailableWorker(){for(;this.idleQueue.length>0;){let e=this.idleQueue.shift();if(e&&(e.terminated||this.count>this._getMaxConcurrency()))e.terminated&&this.totals.workerRestarts++,e.destroy().then(()=>this.workers.delete(e)),this.count--;else if(e)return e}if(this.count<this._getMaxConcurrency()){this.count++;let e=`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`;try{let t=new an({name:e,source:this.source,url:this.url,workerType:this.workerType,getUrl:this.getUrl,loadWorker:this.loadWorker});return this.totals.workersCreated++,this.workers.add(t),t}catch(e){throw this.count--,e}}return null}_getMaxConcurrency(){return Wt?this.maxMobileConcurrency:this.maxConcurrency}},sn={maxQueuedJobs:1/0,maxPendingAdmissions:128,priorityAgingMs:1e3,onMetrics:()=>{},performanceMarks:!1,maxQueuedBytes:1/0,maxInFlightBytes:1/0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}},cn=new WeakMap,ln=1,un=class e{static isSupported(){return an.isSupported()}static getWorkerFarm(t={}){return e._workerFarm=e._workerFarm||new e({}),e._workerFarm.setProps(t),e._workerFarm}constructor(e){this.workerPools=new Map,this.props={...sn},this.setProps(e),this.workerPools=new Map}destroy(e){let t=[...this.workerPools.values()];return this.workerPools.clear(),Promise.all(t.map(t=>t.destroy(e))).then(()=>void 0)}setProps(e){let t={};for(let n of Object.keys(sn))e[n]!==void 0&&(t[n]=e[n]);this.props={...this.props,...t};for(let e of this.workerPools.values())e.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:n,url:r,getUrl:i,loadWorker:a,workerType:o}=e,s=dn(e),c=this.workerPools.get(s);return c||(c=new on({name:t,source:n,url:r,getUrl:i,loadWorker:a,workerType:o}),c.setProps(this._getWorkerPoolProps()),this.workerPools.set(s,c)),c}_getWorkerPoolProps(){return{maxQueuedJobs:this.props.maxQueuedJobs,maxPendingAdmissions:this.props.maxPendingAdmissions,priorityAgingMs:this.props.priorityAgingMs,onMetrics:this.props.onMetrics,performanceMarks:this.props.performanceMarks,maxQueuedBytes:this.props.maxQueuedBytes,maxInFlightBytes:this.props.maxInFlightBytes,maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}};function dn(e){let{name:t,source:n,url:r,urlKey:i,loadWorker:a,workerType:o}=e;return[t,n?`source:${n}`:``,r||i?`url:${r||i}`:``,a?`loadWorker:${fn(a)}`:``,`type:${o||`classic`}`].filter(Boolean).join(`|`)}function fn(e){let t=cn.get(e);return t||(t=ln++,cn.set(e,t)),t}var pn=class{constructor(){this._values=[],this._settlers=[],this._closed=!1}[Symbol.asyncIterator](){return this}push(e){return this.enqueue(e)}enqueue(e){if(this._closed)throw Error(`Closed`);if(this._settlers.length>0){if(this._values.length>0)throw Error(`Illegal internal state`);let t=this._settlers.shift();e instanceof Error?t.reject(e):t.resolve({value:e})}else this._values.push(e)}close(){for(;this._settlers.length>0;)this._settlers.shift().resolve({done:!0});this._closed=!0}next(){if(this._values.length>0){let e=this._values.shift();return e instanceof Error?Promise.reject(e):Promise.resolve({done:!1,value:e})}if(this._closed){if(this._settlers.length>0)throw Error(`Illegal internal state`);return Promise.resolve({done:!0,value:void 0})}return new Promise((e,t)=>{this._settlers.push({resolve:e,reject:t})})}},mn=new Set;function hn(e){let t=e.version===Bt?``:` (worker-utils@${Bt})`;return`${e.name}@${e.version}${t}`}function gn(e,t={}){let n=Ut?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,r=_n(e,t),i=t._workerType||t?.core?._workerType;if(!r&&i===`test`)if(Ut)r=`modules/${e.module}/dist/${n}`;else{let t=e.module===`tasks`&&e.workerNode?.startsWith(`worker-utils/`)?`worker-utils/workers`:`workers`,n=e.workerSourceNode||`${t}/${e.id}-worker-node.ts`;r=`modules/${e.module}/src/${n}`}return r||null}function _n(e,t={}){return(t[e.id]||{}).workerUrl||(e.id===`compression`?t.workerUrl:null)||null}function vn(e,t={}){let n=gn(e,t),r=typeof e.worker==`string`?e.worker:null,i=n||r||yn(e,!0);return Vt(i),i}function yn(e,t=!1){let n=Ut?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,r=e.version;r===`latest`&&(r=Rt);let i=r?`@${r}`:``,a=`https://unpkg.com/${e.packageName||`@loaders.gl/${e.module}`}${i}/dist/${n}`;return t&&bn(e,a),a}function bn(e,t){if(e.version!==`latest`)return;let n=`${e.module}:${e.id}`;mn.has(n)||(mn.add(n),console.warn(`loaders.gl: ${e.name} loader worker version is "latest" because __VERSION__ was not injected. Fetching ${t} from CDN.`))}function xn(){let e=typeof globalThis.crossOriginIsolated==`boolean`?globalThis.crossOriginIsolated:void 0,t={workers:an.isSupported(),sharedMemory:!1,crossOriginIsolated:e};if(Ut&&e!==!0)t.sharedMemoryUnavailableReason=`cross-origin-isolation`;else if(typeof SharedArrayBuffer>`u`||typeof Atomics>`u`||typeof structuredClone!=`function`)t.sharedMemoryUnavailableReason=`unsupported`;else try{let e=new SharedArrayBuffer(4),n=structuredClone(e);Atomics.store(new Int32Array(e),0,17),t.sharedMemory=Atomics.load(new Int32Array(n),0)===17,t.sharedMemory||(t.sharedMemoryUnavailableReason=`blocked`)}catch{t.sharedMemoryUnavailableReason=`blocked`}return t}var Sn=class{constructor(e){if(typeof SharedArrayBuffer>`u`||!(e instanceof SharedArrayBuffer)||e.byteLength!==16)throw Error(`Expected a 16-byte shared worker control buffer`);this.buffer=e,this.values=new Int32Array(e)}get snapshot(){return{cancelled:Atomics.load(this.values,0)!==0,completed:Atomics.load(this.values,1),total:Atomics.load(this.values,2),revision:Atomics.load(this.values,3)}}cancel(){Atomics.store(this.values,0,1),Atomics.add(this.values,3,1),Atomics.notify(this.values,0)}throwIfCancelled(){if(Atomics.load(this.values,0)!==0){let e=Error(`Shared worker task was cancelled`);throw e.name=`AbortError`,e}}setProgress(e,t=-1){if(!Number.isInteger(e)||e<0||e>2147483647||!Number.isInteger(t)||t<-1||t>2147483647)throw RangeError(`Shared progress requires nonnegative int32 counts (or total -1)`);Atomics.store(this.values,1,e),Atomics.store(this.values,2,t),Atomics.add(this.values,3,1)}};function Cn(){if(!xn().sharedMemory)return null;let e=new Sn(new SharedArrayBuffer(16));return e.setProgress(0),e}function wn(e){if(e.sharedState===void 0&&e.cancellationMode===`cooperative`){let t=Cn();return t?{...e,sharedState:t.buffer}:e}if(e.sharedState){if(!xn().sharedMemory)throw Error(`Shared worker memory is unavailable`);new Sn(e.sharedState).throwIfCancelled()}return e}function Tn(e){let t=new Set,n=0;function r(e){if(!(!e||typeof e!=`object`||t.has(e)))if(t.add(e),ArrayBuffer.isView(e))r(e.buffer);else if(e instanceof ArrayBuffer||typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer)n+=e.byteLength;else if(e instanceof Map)for(let[t,n]of e)r(t),r(n);else if(e instanceof Set)for(let t of e)r(t);else for(let t of Object.keys(e))r(e[t])}return r(e),n}function En(e){if(e!==void 0&&e!==`copy`&&e!==`transfer`)throw Error(`Invalid worker output ownership`)}async function Dn(e,t,n={},r={},i={}){if(En(n.outputOwnership),n.inputOwnership!==void 0&&![`copy`,`transfer`,`share`].includes(n.inputOwnership))throw Error(`Invalid worker input ownership`);n=wn(n),An(n.signal),zn(n,[t,Rn(n),i]);let a=hn(e),o=n.workerPool??un.getWorkerFarm(n).getWorkerPool(Fn(e,n,a)),s=n.jobName||e.name,c=await o.startJob(s,In.bind(null,r,n),void 0,n.signal,{inputBytes:Tn([t,Bn(n),i]),priority:n.priority,admission:n.admission,sharedState:n.sharedState?new Sn(n.sharedState):void 0,cancellationMode:n.cancellationMode,cancellationTimeout:n.cancellationTimeout});try{n.signal?.aborted&&!c.isCancelled&&c.abort(jn(n.signal));let e=nn(Rn(n)),r=nn(i);return c.isRunning&&c.postMessage(`process`,{input:t,options:e,context:r},n.inputOwnership===`copy`||n.inputOwnership===`share`?[]:void 0),(await c.result).result}catch(e){throw c.isCancelled||c.abort(e),e}}function On(e,t,n={},r={},i={}){if(En(n.outputOwnership),n.inputOwnership!==void 0&&![`copy`,`transfer`,`share`].includes(n.inputOwnership))throw Error(`Invalid worker input ownership`);return kn(e,t,n,r,i)}async function*kn(e,t,n,r,i){n=wn(n),An(n.signal);let a=hn(e),o=n.workerPool??un.getWorkerFarm(n).getWorkerPool(Fn(e,n,a));zn(n,[Rn(n),i]);let s=Tn([Bn(n),i]),c=n.inputBytes??s;if(o.requiresInputBytes&&n.inputBytes===void 0)throw Error(`Byte-bounded batch sessions require inputBytes`);if(!Number.isSafeInteger(c)||c<s)throw RangeError(`Batch inputBytes must cover options and context buffers`);let l=new pn,u=Nn(t),d=!1,f=!1,p=!1,m=Promise.resolve(),h=Error(`Worker batch job failed`),g=()=>{!f&&!p&&(p=!0,Pn(u))},_=()=>{d||(d=!0,l.close())},v=e=>{d||(d=!0,l.enqueue(h),l.close())},y=await o.startJob(n.jobName||e.name,(e,t,i)=>{if(!(e.isCancelled&&t!==`done`&&t!==`error`))switch(t){case`progress`:Ln(e,n,i);break;case`input-request`:m=m.then(async()=>{if(!e.isRunning)return;let t=await u.next();if(e.isRunning)if(t.done)f=!0,e.postMessage(`input-done`,{});else{if(zn(n,t.value),n.inputBytes!==void 0&&Tn(t.value)+s>c)throw RangeError(`Worker batch exceeds reserved inputBytes`);e.postMessage(`input-batch`,{input:t.value},n.inputOwnership===`copy`||n.inputOwnership===`share`?[]:void 0)}}).catch(t=>{e.isCancelled||e.abort(t)});break;case`output-batch`:l.push(i.result);break;case`done`:e.done(i),_();break;case`error`:{let t=Error(i.error||`Worker batch processing failed`);t.name=i.errorName||`Error`,e.error(t),v(t);break}case`process`:In(r,n,e,t,i);break;default:{let n=Error(`Unexpected worker batch message: ${t}`);e.error(n),v(n);break}}},void 0,n.signal,{inputBytes:c,priority:n.priority,admission:n.admission,sharedState:n.sharedState?new Sn(n.sharedState):void 0,cancellationMode:n.cancellationMode,cancellationTimeout:n.cancellationTimeout}).catch(e=>{throw g(),e});y.result.catch(e=>{v(e),g()});try{let e=Rn(n);y.isRunning&&y.postMessage(`process-in-batches`,{options:nn(e),context:nn(i)},n.inputOwnership===`copy`||n.inputOwnership===`share`?[]:void 0);try{for await(let e of l)yield e,y.isRunning&&y.postMessage(`output-ack`,{})}catch(e){throw e===h&&await y.result,e}await y.result}finally{y.isRunning&&!y.isCancelled&&y.abort(Mn(`Worker batch iterator was closed`)),g()}}function An(e){if(e?.aborted)throw jn(e)}function jn(e){return e?e.reason:Mn(`Worker job was aborted`)}function Mn(e){let t=Error(e);return t.name=`AbortError`,t}function Nn(e){return Symbol.asyncIterator in e?e[Symbol.asyncIterator]():(async function*(){yield*e})()}function Pn(e){try{Promise.resolve(e.return?.()).catch(()=>void 0)}catch{}}function Fn(e,t,n){if(t.source)return{name:n,source:t.source,workerType:t.workerType};let r=gn(e,t);return r?{name:n,url:r,workerType:t.workerType}:Ut&&e.loadWorker?{name:n,workerType:t.workerType,loadWorker:e.loadWorker,getUrl:()=>vn(e,t),urlKey:yn(e)}:{name:n,url:vn(e,t),workerType:t.workerType}}async function In(e,t,n,r,i){if(!(n.isCancelled&&r!==`done`&&r!==`error`))switch(r){case`progress`:Ln(n,t,i);break;case`done`:n.done(i);break;case`error`:let a=Error(i.error);a.name=i.errorName||`Error`,n.error(a);break;case`process`:let{id:o,input:s,options:c}=i;try{if(!e.process){n.postMessage(`error`,{id:o,error:`Worker not set up to process on main thread`});return}let r=await e.process(s,{...c,signal:t.signal,onProgress:t.onProgress},void 0,i.context||{});n.postMessage(`done`,{id:o,result:r})}catch(e){let t=e instanceof Error?e.message:`unknown error`;n.postMessage(`error`,{id:o,error:t})}break;default:console.warn(`process-on-worker: unknown message ${r}`)}}function Ln(e,t,n){if(!(!e.isRunning||e.isCancelled||!n.progress))try{t.onProgress?.(n.progress)}catch(t){e.abort(t)}}function Rn(e){let{signal:t,onProgress:n,onMetrics:r,workerPool:i,admission:a,workerType:o,...s}=e;return s}function zn(e,t){if(e.inputOwnership===`share`&&en(t).length)throw Error(`Share ownership requires SharedArrayBuffer storage; ordinary transferables are not allowed`)}function Bn(e){let{sharedState:t,...n}=Rn(e);return n}var Vn=new WeakMap,Hn=new WeakSet;function Un(e,t){if(!e.preload)return Promise.resolve();let n=Vn.get(e);return n||(n=Promise.resolve().then(()=>e.preload()).then(()=>{Hn.add(e)}),Vn.set(e,n),n.catch(()=>Vn.delete(e))),Gn(n,t)}function Wn(e){return!e.preload||Hn.has(e)}function Gn(e,t){return t?new Promise((n,r)=>{let i=()=>{t.removeEventListener(`abort`,i),r(t.reason)};t.addEventListener(`abort`,i,{once:!0}),t.aborted&&i(),e.then(e=>{t.removeEventListener(`abort`,i),n(e)},e=>{t.removeEventListener(`abort`,i),r(e)})}):e}var Kn=class extends Error{},qn=class{constructor(e){this.options=e,this.nextId=1,this.pending=new Map,this.incoming=new Map}request(e,t,n,r=[]){if(this.failure)return Promise.reject(this.failure.reason);if(n?.aborted)return Promise.reject(n.reason);let i=this.nextId++;return new Promise((a,o)=>{let s=()=>{let e=this.pending.get(i);e&&(this.pending.delete(i),e.cleanup(),o(n?.reason),this.send({source:`math.gl/tasks`,kind:`cancel`,id:i}))};this.pending.set(i,{resolve:a,reject:o,cleanup:()=>n?.removeEventListener(`abort`,s)}),n?.addEventListener(`abort`,s,{once:!0}),this.send({source:`math.gl/tasks`,kind:`request`,id:i,operation:e,value:t},r)})}emit(e,t,n=[]){if(this.failure)throw this.failure.reason;this.send({source:`math.gl/tasks`,kind:`event`,id:0,operation:e,value:t},n)}receive(e){if(!(this.failure||e?.source!==`math.gl/tasks`)){if(e.kind===`failure`){let t=Error(e.error?.message??`Task channel failed`);this.close(t),this.options.onFailure?.(t)}else if(e.kind===`result`||e.kind===`error`){let t=this.pending.get(e.id);if(!t)return;if(this.pending.delete(e.id),t.cleanup(),e.kind===`result`)t.resolve(e.value);else{let n=new Kn(e.error?.message??`Task request failed`);n.name=e.error?.name??`Error`,t.reject(n)}}else if(e.kind===`cancel`)this.incoming.get(e.id)?.abort(new DOMException(`Task request cancelled`,`AbortError`));else if(e.kind===`event`)try{this.options.handleEvent?.(e.operation,e.value)}catch(e){this.fail(e)}else if(e.kind===`request`){if(this.incoming.has(e.id)){this.fail(Error(`Duplicate task request identifier`));return}let t=new AbortController;this.incoming.set(e.id,t),Promise.resolve().then(()=>(t.signal.throwIfAborted(),this.options.handleRequest(e.operation,e.value,t.signal))).then(n=>{!t.signal.aborted&&!this.failure&&this.send({source:`math.gl/tasks`,kind:`result`,id:e.id,value:n},this.options.getResultTransferList?.(n,e.value))}).catch(n=>{!t.signal.aborted&&!this.failure&&this.send({source:`math.gl/tasks`,kind:`error`,id:e.id,error:{name:n instanceof Error?n.name:`Error`,message:n instanceof Error?n.message:String(n)}})}).finally(()=>this.incoming.delete(e.id))}}}close(e=Error(`Task channel closed`)){if(!this.failure){this.failure={reason:e};for(let t of this.pending.values())t.cleanup(),t.reject(e);this.pending.clear();for(let t of this.incoming.values())t.abort(e);this.incoming.clear()}}send(e,t=[]){if(!this.failure)try{this.options.send(e,t)}catch(e){this.fail(e)}}fail(e){if(!this.failure){this.close(e);try{this.options.send({source:`math.gl/tasks`,kind:`failure`,id:0,error:{name:e instanceof Error?e.name:`Error`,message:e instanceof Error?e.message:String(e)}},[])}catch{}this.options.onFailure?.(e)}}};function Jn(e){if(!e||typeof e!=`object`||Object.getPrototypeOf(e)!==Object.prototype)throw TypeError(`Task payloads must be plain objects with named fields`)}function Yn(e,t=`copy`){if(Jn(e),![`copy`,`transfer`,`share`].includes(t))throw TypeError(`Invalid input ownership`);let n=en(e);if(t===`share`&&n.length)throw TypeError(`Share requires shared storage`);return structuredClone(e,{transfer:t===`transfer`?n:[]})}function Xn(e,t={}){let n=t.signal??new AbortController().signal;return{state:e,signal:n,requestHost:async(e,r,i)=>{if(n.throwIfAborted(),!t.requestHost)throw Error(`No host request handler configured`);return t.requestHost(e,r,i)},emitHost:(e,r)=>{n.throwIfAborted(),t.emitHost?.(e,r)},throwIfAborted:()=>{n.throwIfAborted(),t.throwIfAborted?.()},reportProgress:e=>t.reportProgress?.({...e,phase:e.phase??`process`,unit:e.unit??`items`})}}var Zn=class{constructor(e){this.task=e,this.initialized=!1}async initialize(e,t={}){if(this.initialized)throw Error(`Task is already initialized`);return Jn(e),await Un(this.task,t.signal),t.signal?.throwIfAborted(),this.state=await this.task.initialize?.(e,Xn(void 0,t)),this.initialized=!0,{}}async destroy(){if(this.initialized){this.initialized=!1;let e=this.state;this.state=void 0,this.task.initialize&&await this.task.destroy?.(e)}return{}}async process(e,t,n={}){if(!this.initialized)throw Error(`Task is not initialized`);if(!this.task.process)throw Error(`Task has no atomic processor`);Jn(e);let r=await this.task.process(e,t,Xn(this.state,n));return Jn(r),r}async*stream(e,t,n={}){if(!this.initialized)throw Error(`Task is not initialized`);if(!this.task.processInBatches)throw Error(`Task has no streaming processor`);for await(let r of this.task.processInBatches(e,t,Xn(this.state,n)))Jn(r),yield r}};function Qn(e){return{signal:e.signal,reportProgress:t=>e.onProgress?.(t)}}function $n(e,t,n={}){if(!Wn(e))throw Error(`Preload task on the main thread before runTaskSync`);if(`execution`in n)throw TypeError(`runTaskSync always runs on the calling thread`);if(!e.process)throw TypeError(`Task has no atomic processor`);for(let t of[e.initialize,e.process,e.destroy])if(t&&Object.prototype.toString.call(t)===`[object AsyncFunction]`)throw TypeError(`runTaskSync requires synchronous lifecycle hooks`);if(n.outputOwnership&&![`copy`,`transfer`].includes(n.outputOwnership))throw TypeError(`Invalid output ownership`);let r=Xn(void 0,Qn(n));r.throwIfAborted();let i=n.options??{};if(n.inputOwnership===`transfer`){let e=new Set(en(i));if(en(t).some(t=>e.has(t)))throw Error(`Transferred input aliases reusable options; use inputOwnership: copy`)}let a=Yn(i),o=Yn(n.initialization??{},n.initializationOwnership),s=!1,c,l=!1,u;try{let i=e.initialize?.(o,r);if(er(i))throw Promise.resolve(i).then(t=>e.destroy?.(t)).catch(()=>{}),TypeError(`runTaskSync initialize returned a promise`);r.state=i,s=!0,r.throwIfAborted();let c=Yn(t,n.inputOwnership),l=e.process(c,a,r);if(er(l))throw s=!1,Promise.resolve(l).catch(()=>{}).then(()=>{if(e.initialize)return e.destroy?.(r.state)}).catch(()=>{}),TypeError(`runTaskSync process returned a promise`);Jn(l),r.throwIfAborted(),u=Yn(l,n.outputOwnership??`transfer`)}catch(e){l=!0,c=e}finally{if(s&&e.initialize)try{let t=e.destroy?.(r.state);if(er(t))throw Promise.resolve(t).catch(()=>{}),TypeError(`runTaskSync destroy returned a promise`)}catch(e){throw l?AggregateError([c,e],`Task processing and destruction failed`):e}}if(l)throw c;return u}function er(e){return!!(e&&(typeof e==`object`||typeof e==`function`)&&typeof e.then==`function`)}var tr=class{constructor(e){if(this.maxConcurrency=e,this.pending=[],this.active=0,this.exclusive=!1,this.closed=!1,this.idleWaiters=new Set,!Number.isSafeInteger(e)||e<1)throw RangeError(`maxConcurrency must be a positive safe integer`)}run(e,t,n){return this.closed?Promise.reject(Error(`Task operation queue is closed`)):e!==`parallel`&&e!==`exclusive`?Promise.reject(TypeError(`Invalid operation mode`)):n?.aborted?Promise.reject(n.reason):new Promise((r,i)=>{let a=()=>{let e=this.pending.indexOf(o);e>=0&&(this.pending.splice(e,1),o.cancel(n?.reason),this.pump())},o={mode:e,cancel:e=>{n?.removeEventListener(`abort`,a),i(e)},start:()=>{n?.removeEventListener(`abort`,a),this.active++,e===`exclusive`&&(this.exclusive=!0),Promise.resolve().then(()=>(n?.throwIfAborted(),t())).then(r,i).finally(()=>{this.active--,e===`exclusive`&&(this.exclusive=!1),this.pump()})}};this.pending.push(o),n?.addEventListener(`abort`,a,{once:!0}),n?.aborted?a():this.pump()})}cancelPending(e){this.closed=!0;for(let t of this.pending.splice(0))t.cancel(e);this.pump()}close(){return this.closed=!0,this.whenIdle()}whenIdle(){return!this.active&&!this.pending.length?Promise.resolve():new Promise(e=>this.idleWaiters.add(e))}pump(){for(;!this.exclusive&&this.pending.length&&this.active<this.maxConcurrency;){let e=this.pending[0];if(e.mode===`exclusive`&&this.active||(this.pending.shift(),e.start(),e.mode===`exclusive`))break}if(!this.active&&!this.pending.length){for(let e of this.idleWaiters)e();this.idleWaiters.clear()}}},nr=class{constructor(e,t,n){this.thread=new an({name:e,url:t.url?.toString(),loadWorker:t.create,workerType:`module`}),this.channel=new qn({...n,send:(e,t)=>this.thread.postMessage({source:`loaders.gl/tasks`,type:`task-channel`,payload:e},t)}),this.thread.onMessage=e=>{e?.type===`task-channel`&&this.channel.receive(e.payload)},this.thread.onError=e=>{this.channel.close(e),n.onFailure?.(e)}}async destroy(e){this.channel.close(e),await this.thread.destroy()}},rr=class{constructor(e,t,n){this.task=e,this.release=t,this.initializationControls=n,this.nextProgressId=1,this.progressCallbacks=new Map,this.callbackFailures=new Map,this.closed=!1,this.finalized=!1,this.streams=new Set,this.invalid=!1,this.controller=new AbortController;let r=n;this.runtime=new Zn(e);let i=r.operationConcurrency??1,a=e.concurrency?.maxConcurrency??1;if(!Number.isSafeInteger(a)||a<1||!Number.isSafeInteger(i)||i<1||i>a)throw RangeError(`Task concurrency must be between 1 and the task maximum`);this.operationQueue=new tr(i),this.concurrent=i>1;let o=r.execution??`auto`;if(![`auto`,`main-thread`,`worker`].includes(o))throw TypeError(`Invalid execution mode`);if(o===`worker`&&!e.worker)throw Error(`Task has no worker`);if(o!==`main-thread`&&e.worker){let t=e.worker;if(!!t.url==!!t.create)throw Error(`Supply exactly one worker URL or factory`);if(this.concurrent||r.onRequest||r.onEvent){this.workerChannel=new nr(e.id,t,{handleRequest:async(e,t,n)=>{if(e===`task:next-input`){if(!this.channelInputs)throw Error(`No active task stream`);return this.channelInputs.next()}if(!r.onRequest)throw Error(`No host request handler configured`);let i=t;if(e!==`task:host-request`)throw Error(`Unknown host request`);return r.onRequest(i.operation,i.payload,n)},getResultTransferList:(e,t)=>t.outputOwnership===`transfer`?en(e):[],handleEvent:(e,t)=>{let{id:n}=t;try{if(e===`task:progress`){let e=t;(this.progressCallbacks.get(e.id)??this.streamProgress)?.(e.progress)}else if(e===`task:host-event`){let e=t;r.onEvent?.(e.operation,e.payload)}}catch(e){(this.progressCallbacks.has(n)||this.streamProgressId===n)&&(this.callbackFailures.has(n)||this.callbackFailures.set(n,{reason:e}))}},onFailure:e=>{this.invalid=!0,this.operationQueue.cancelPending(e),this.controller.abort(e)}});return}this.pool=new on({name:e.id,url:t.url?.toString(),loadWorker:t.create,workerType:`module`,maxConcurrency:1,maxMobileConcurrency:1}),this.descriptor={id:e.id,name:e.id,module:`tasks`,version:`prototype`,options:{},worker:t.url?.toString()??!0,loadWorker:t.create,workerInBatches:t.capabilities.streaming}}}async initialize(e,t){try{Jn(e),await this.enqueue(()=>this.invoke(`initialize`,e,{},t))}catch(e){throw await this.terminate(e),e}}runTask(e,...t){if(this.invalid)return Promise.reject(Error(`Initialized task is invalid; initialize a new instance`));if(this.closed)return Promise.reject(Error(`Initialized task is closed`));let n=t[0]?.timeout;if(n!==void 0&&(!Number.isSafeInteger(n)||n<0||n>4294967295))return Promise.reject(RangeError(`Invalid task timeout`));let r=n===void 0?void 0:AbortSignal.timeout(n),i=r&&t[0]?.signal?AbortSignal.any([r,t[0].signal]):r??t[0]?.signal,a={...t[0],signal:i},o=this.task.concurrency?.getSchedulingMode?.(e)??`exclusive`;return this.operationQueue.run(o,async()=>{i?.throwIfAborted(),this.checkCapability(`atomic`);let n=()=>{this.concurrent&&(this.invalid=!0,this.operationQueue.cancelPending(i?.reason),this.controller.abort(i?.reason))};i?.addEventListener(`abort`,n,{once:!0});try{return await this.invoke(`process`,e,t[0]?.options??{},a)}finally{i?.removeEventListener(`abort`,n)}},i)}runTasks(e,...t){return this.serialStream(async function*(n){n.checkCapability(`atomic`);for await(let r of or(e,n.controls(t[0]).signal))yield await n.invoke(`process`,r,t[0]?.options??{},t[0])},t[0]?.signal)}runTaskInBatches(e,...t){return this.serialStream(async function*(n){n.checkCapability(`streaming`);let r=n.controls(t[0]),i=Yn(t[0]?.options??{});async function*a(){for await(let n of or(e,r.signal))r.signal?.throwIfAborted(),sr(n,t[0]?.options??{},r.inputOwnership),yield Yn(n,r.inputOwnership)}let o=!1;try{if(n.workerChannel){n.channelInputs=a()[Symbol.asyncIterator](),n.streamProgress=r.onProgress;try{for(await n.invoke(`stream-open`,{},i,r);;){let e=await n.invoke(`stream-next`,{},{},r);if(e.done)break;yield e.value}}finally{try{n.invalid||await n.invoke(`stream-close`,{},{},r)}finally{await n.channelInputs.return?.(),n.channelInputs=void 0,n.streamProgress=void 0,n.streamProgressId!==void 0&&n.callbackFailures.delete(n.streamProgressId),n.streamProgressId=void 0}}}else if(n.pool)await n.invoke(`stream-options`,{},i,r),yield*On(n.descriptor,a(),{...n.workerOptions(r),inputOwnership:`transfer`,workerInBatches:!0});else for await(let e of n.runtime.stream(a(),i,n.runtimeContext(r)))r.signal?.throwIfAborted(),yield Yn(e,r.outputOwnership??`transfer`);o=!0}catch(e){throw n.workerChannel&&(n.invalid=!0,n.operationQueue.cancelPending(e),n.controller.abort(e),await n.workerChannel.destroy(e)),n.pool&&(n.invalid=!0,await n.pool.destroy(e)),e}finally{if(n.pool&&!o&&(n.invalid=!0),n.workerChannel&&!o&&!n.invalid){let e=Error(`Worker stream ended before completion`);n.invalid=!0,n.operationQueue.cancelPending(e),n.controller.abort(e),await n.workerChannel.destroy(e)}}},t[0]?.signal)}get state(){return this.invalid?`invalid`:this.finalized?`closed`:this.closed?`closing`:`ready`}close(){return this.closing||=(this.closed=!0,(async()=>{try{await this.operationQueue.close(),this.invalid?!this.pool&&!this.workerChannel&&await this.runtime.destroy():await this.invoke(`destroy`,{},{})}finally{try{await this.pool?.destroy(),await this.workerChannel?.destroy()}finally{this.finalized=!0,this.release()}}})()),this.closing}async terminate(e=Error(`Task terminated`)){this.operationQueue.cancelPending(e),this.controller.abort(e),this.workerChannel&&(this.invalid=!0,await this.workerChannel.destroy(e)),this.pool&&(this.invalid=!0,await this.pool.destroy(e)),await Promise.allSettled([...this.streams].map(e=>e())),await this.close()}checkCapability(e){if(this.pool||this.workerChannel?!this.task.worker?.capabilities[e]:!(e===`atomic`?this.task.process:this.task.processInBatches))throw Error(`Task has no ${e} processor for this execution route`)}controls(e={}){if(e.outputOwnership&&![`copy`,`transfer`].includes(e.outputOwnership))throw TypeError(`Invalid output ownership`);return{...e,signal:e.signal?AbortSignal.any([e.signal,this.controller.signal]):this.controller.signal}}workerOptions(e){return{workerPool:this.pool,workerType:`module`,inputOwnership:e.inputOwnership??`copy`,outputOwnership:e.outputOwnership??`transfer`,signal:e.signal,onProgress:e.onProgress,cancellationMode:`terminate`}}async invoke(e,t,n,r={}){if(this.invalid)throw Error(`Initialized task is invalid; initialize a new instance`);let i=e===`destroy`?{}:this.controls(r);i.signal?.throwIfAborted(),Jn(t),sr(t,n,i.inputOwnership);let a=Yn(n);if(this.workerChannel){let n=this.nextProgressId++,r={input:Yn(t,i.inputOwnership),options:a,outputOwnership:i.outputOwnership??`transfer`,progressId:n};e===`stream-open`&&(this.streamProgressId=n),this.progressCallbacks.set(n,i.onProgress);let o;try{let t=await this.workerChannel.channel.request(e,r,i.signal,en(r));if(o=this.callbackFailures.get(n)??(e.startsWith(`stream-`)&&this.streamProgressId!==void 0?this.callbackFailures.get(this.streamProgressId):void 0),o)throw o.reason;return t}catch(t){throw e===`process`&&!i.signal?.aborted&&(t instanceof Kn||o)?t:(this.invalid=!0,this.operationQueue.cancelPending(t),this.controller.abort(t),await this.workerChannel.destroy(t),t)}finally{this.progressCallbacks.delete(n),this.streamProgressId!==n&&this.callbackFailures.delete(n)}}if(this.pool)try{return await Dn(this.descriptor,{operation:e,input:Yn(t,i.inputOwnership),options:a},this.workerOptions({...i,inputOwnership:`transfer`}))}catch(e){throw this.invalid=!0,await this.pool.destroy(e),e}if(e===`destroy`)return this.runtime.destroy();let o=Yn(t,i.inputOwnership),s=this.runtimeContext(i);if(e===`initialize`){let e=await this.runtime.initialize(o,s);return i.signal?.throwIfAborted(),e}let c=await this.runtime.process(o,a,s);return i.signal?.throwIfAborted(),Yn(c,i.outputOwnership??`transfer`)}runtimeContext(e){return{...Qn(e),requestHost:async(t,n,r={})=>{let i=e.signal??this.controller.signal;i.throwIfAborted();let a=this.initializationControls.onRequest;if(!a)throw Error(`No host request handler configured`);let o=await a(t,Yn(n,r.inputOwnership),i);return i.throwIfAborted(),structuredClone(o,{transfer:r.outputOwnership===`transfer`?en(o):[]})},emitHost:(e,t)=>this.initializationControls.onEvent?.(e,structuredClone(t))}}enqueue(e){return this.closed?Promise.reject(Error(`Initialized task is closed`)):this.operationQueue.run(`exclusive`,e)}serialStream(e,t){let n=new AbortController,r=AbortSignal.any([n.signal,this.controller.signal,t].filter(e=>!!e)),i=!1,a=this.acquireStream(e,r,()=>{i=!0}),o=()=>{i||n.abort(Error(`Stream returned before execution`))};return{[Symbol.asyncIterator](){return this},next:()=>a.next(),return:async()=>(o(),a.return(void 0)),throw:async e=>(o(),a.throw(e))}}async*acquireStream(e,t,n){if(this.closed)throw Error(`Initialized task is closed`);let r,i=new Promise(e=>{r=e}),a,o=new Promise(e=>{a=e}),s=this.operationQueue.run(`exclusive`,async()=>{r(),await o},t);if(await Promise.race([i,s]),t.aborted)throw a(),t.reason;n();let c=e(this)[Symbol.asyncIterator](),l,u=()=>(l??=(async()=>{try{await c.return?.()}finally{this.streams.delete(u),a()}})(),l);this.streams.add(u);try{for(;;){this.controller.signal.throwIfAborted();let e=await c.next();if(e.done)return;yield e.value}}finally{await u()}}},ir=class{constructor(e={}){if(this.active=new Set,this.count=0,this.waiters=[],this.closed=!1,this.initializing=new Set,this.iterations=new Set,this.maxConcurrency=e.maxConcurrency??1,!Number.isSafeInteger(this.maxConcurrency)||this.maxConcurrency<1)throw RangeError(`maxConcurrency must be a positive safe integer`)}runTaskSync(e,t,...n){if(this.closed)throw Error(`Task runner is closed`);if(this.count>=this.maxConcurrency)throw Error(`Task runner has no synchronous capacity`);this.count++;try{return $n(e,t,n[0])}finally{let e=this.waiters.shift();e?e.resolve():this.count--}}initializeTask(e,t,n={}){let r=this.open(e,t,n);return this.initializing.add(r),r.then(()=>this.initializing.delete(r),()=>this.initializing.delete(r)),r}async runTask(e,t,...n){let r=n[0]??{},i=await this.initializeTask(e,r.initialization??{},{...r,inputOwnership:r.initializationOwnership??`copy`});return ar(i,()=>i.runTask(t,r))}async*runTasks(e,t,...n){let r=n[0]??{};if(this.closed)throw Error(`Task runner is closed`);if(r.initializationOwnership===`transfer`)throw TypeError(`runTasks initialization is a reusable template; use copy or share`);let i=r.concurrency??1;if(!Number.isSafeInteger(i)||i<1||i>this.maxConcurrency)throw RangeError(`concurrency must be between 1 and maxConcurrency`);let a=[],o=new Set,s=[],c=new AbortController;this.iterations.add(c);let l=r.signal?AbortSignal.any([r.signal,c.signal]):c.signal,u=or(t,l)[Symbol.asyncIterator](),d=!1,f;try{for(;!d||s.length;){l.throwIfAborted(),!d&&!f&&s.length<i&&(f=u.next().then(e=>({kind:`input`,next:e})));let t=await Promise.race([...s.length?[s[0]]:[],...f?[f]:[]]);if(t.kind===`result`){if(s.shift(),o.delete(t.handle),t.failed)throw t.error;yield t.value;continue}if(f=void 0,t.next.done){d=!0;continue}let n=a.find(e=>!o.has(e));if(!n&&(a.length===0||this.count<this.maxConcurrency)&&(n=await this.initializeTask(e,Yn(r.initialization??{},r.initializationOwnership),{...r,signal:l,inputOwnership:r.initializationOwnership??`copy`}),a.push(n)),!n){let e=await s.shift();if(o.delete(e.handle),e.failed)throw e.error;yield e.value,n=e.handle}o.add(n);let c=n;s.push(n.runTask(t.next.value,{...r,signal:l}).then(e=>({kind:`result`,handle:c,value:e}),e=>({kind:`result`,handle:c,failed:!0,error:e})))}}finally{this.iterations.delete(c),c.abort(Error(`Task iteration closed`));try{f&&await f.catch(()=>{}),d||await u.return?.()}finally{await Promise.all(s),await Promise.all(a.map(e=>e.close()))}}}async*runTaskInBatches(e,t,...n){let r=n[0]??{},i=await this.initializeTask(e,r.initialization??{},{...r,inputOwnership:r.initializationOwnership??`copy`});try{yield*i.runTaskInBatches(t,r)}finally{await i.close()}}close(){if(!this.closing){this.closed=!0;for(let e of this.waiters.splice(0))e.reject(Error(`Task runner is closed`));this.closing=(async()=>{await Promise.allSettled(this.initializing);let e=(await Promise.allSettled([...this.active].map(e=>e.close()))).find(e=>e.status===`rejected`);if(e?.status===`rejected`)throw e.reason})()}return this.closing}async terminate(e=Error(`Task runner terminated`)){for(let t of this.iterations)t.abort(e);let t=this.close();await Promise.allSettled([...this.active].map(t=>t.terminate(e))),await t}async open(e,t,n){if(this.closed)throw Error(`Task runner is closed`);n.signal?.throwIfAborted(),this.count>=this.maxConcurrency?await new Promise((e,t)=>{let r={resolve:()=>{a(),e()},reject:e=>{a(),t(e)}},i=()=>{this.waiters=this.waiters.filter(e=>e!==r),r.reject(n.signal?.reason)},a=()=>n.signal?.removeEventListener(`abort`,i);this.waiters.push(r),n.signal?.addEventListener(`abort`,i,{once:!0}),n.signal?.aborted&&i()}):this.count++;let r,i=!1,a=()=>{if(i)return;i=!0,r&&this.active.delete(r);let e=this.waiters.shift();e?e.resolve():this.count--};try{if(this.closed)throw Error(`Task runner is closed`);return r=new rr(e,a,n),this.active.add(r),await r.initialize(t,n),r}catch(e){throw a(),e}}};async function ar(e,t){let n;try{n=await t()}catch(t){try{await e.close()}catch(e){throw AggregateError([t,e],`Task processing and destruction failed`)}throw t}return await e.close(),n}async function*or(e,t){let n=Symbol.asyncIterator in e?e[Symbol.asyncIterator]():e[Symbol.iterator](),r=!1,i=!1;try{for(;;){let e=await new Promise((e,r)=>{let a=()=>t?.removeEventListener(`abort`,o),o=()=>{a(),r(t?.reason)};if(t?.addEventListener(`abort`,o,{once:!0}),t?.aborted){o();return}try{i=!0,Promise.resolve(n.next()).then(t=>{i=!1,a(),e(t)},e=>{i=!1,a(),r(e)})}catch(e){i=!1,a(),r(e)}});if(e.done){r=!0;return}yield e.value}}finally{if(!r)if(i)try{Promise.resolve(n.return?.()).catch(()=>{})}catch{}else await n.return?.()}}function sr(e,t,n){if(n===`transfer`){let n=new Set(en(t));if(en(e).some(e=>n.has(e)))throw Error(`Transferred input aliases reusable options; use inputOwnership: copy`)}}var cr=new Set;function lr(e,t={}){let n=Ft?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,r=ur(e,t),i=t._workerType||t?.core?._workerType;if(!r&&i===`test`)if(Ft)r=`modules/${e.module}/dist/${n}`;else{let t=e.module===`core`&&e.workerNode?.startsWith(`worker-utils/`)?`worker-utils/workers`:`workers`,n=e.workerSourceNode||`${t}/${e.id}-worker-node.ts`;r=`modules/${e.module}/src/${n}`}return r||null}function ur(e,t={}){return(t[e.id]||{}).workerUrl||(e.id===`compression`?t.workerUrl:null)||null}function dr(e,t={}){let n=lr(e,t),r=typeof e.worker==`string`?e.worker:null,i=n||r||fr(e,!0);return Nt(i),i}function fr(e,t=!1){let n=Ft?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,r=e.version;r===`latest`&&(r=At);let i=r?`@${r}`:``,a=`https://unpkg.com/@loaders.gl/${e.module}${i}/dist/${n}`;return t&&pr(e,a),a}function pr(e,t){if(e.version!==`latest`)return;let n=`${e.module}:${e.id}`;cr.has(n)||(cr.add(n),r.warn(`loaders.gl: ${e.name} loader worker version is "latest" because __VERSION__ was not injected. Fetching ${t} from CDN.`)())}function mr(e){return{...e,phase:e.phase??`process`,unit:e.unit??`items`}}function hr(e,t=!0,n){let r=n||new Set;if(e){if(gr(e))r.add(e);else if(gr(e.buffer))r.add(e.buffer);else if(!ArrayBuffer.isView(e)&&t&&typeof e==`object`)for(let n in e)hr(e[n],t,r)}return n===void 0?Array.from(r):[]}function gr(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}function _r(e){if(e===null)return{};let t=Object.assign({},e);return Object.keys(t).forEach(n=>{e[n]!==null&&typeof e[n]==`object`&&!ArrayBuffer.isView(e[n])&&!(e[n]instanceof Array)?t[n]=_r(e[n]):typeof t[n]==`function`||t[n]instanceof RegExp?t[n]={}:t[n]=e[n]}),t}var vr=new WeakMap,yr=new Set,br=new Map;function xr(e,t={}){return!!((Ft?typeof Worker<`u`:t._nodeWorkers)&&t.worker&&(e.worker||e.loadWorker||ur(e,t)))}function Sr(e,t={}){return xr(e,t)?t.workerInBatches===void 0?!!(e.workerInBatches&&!ur(e,t)):t.workerInBatches:!1}async function Cr(e,t,n={},r={},i={}){let a=new AbortController,o=n.signal?AbortSignal.any([n.signal,a.signal]):a.signal,s=kr(e,{...n,signal:o},r,i);s.catch(()=>{});try{let e=t instanceof Promise?await wr(t,o):t;return(await(await s).handle.runTask({value:e},{...Dr(n),options:Or(n)})).value}catch(e){throw a.abort(e),e}finally{await(await s.catch(()=>void 0))?.close()}}async function wr(e,t){let n;try{let r=new Promise((e,r)=>{n=()=>r(t.reason),t.addEventListener(`abort`,n,{once:!0}),t.aborted&&n()});return await Promise.race([e,r])}finally{t.removeEventListener(`abort`,n)}}async function*Tr(e,t,n={},r={},i={}){let a=Ar(t),o;try{o=await kr(e,n,r,i);for await(let e of o.handle.runTaskInBatches(a,{...Dr(n),options:Or(n)}))yield e.value}finally{(a.return?.())?.catch(()=>{}),await o?.close()}}function Er(e,t){if(t.source||t.core?.source)throw Error(`Inline legacy worker source is unsupported; use a TaskRunner worker URL or factory`);let n=!lr(e,t)&&Ft?e.loadWorker:void 0;return{id:`${e.module}:${e.id}`,initialize:e=>e,worker:{...n?{create:()=>n()??jr(dr(e,t))}:{url:dr(e,t)},capabilities:{atomic:!0,streaming:!0}}}}function Dr(e){return{execution:`worker`,signal:e.signal,inputOwnership:e.inputOwnership??`transfer`,outputOwnership:e.outputOwnership??`transfer`,onProgress:e.onProgress?t=>e.onProgress?.(mr(t)):void 0}}function Or(e){let{signal:t,onProgress:n,parserOptions:r,...i}=e;return _r(r??i)}async function kr(e,t,n,r){t.signal?.throwIfAborted();let i=Er(e,t),a=vr.get(e);a||(a={runner:new ir({maxConcurrency:It?t.maxMobileConcurrency??1:t.maxConcurrency??3}),requests:0},vr.set(e,a));let o=a,s=n.process?new MessageChannel:void 0,c=new AbortController,l=!1,u=()=>c.abort(t.signal?.reason);t.signal?.addEventListener(`abort`,u,{once:!0});let d=()=>{l=!0,t.signal?.removeEventListener(`abort`,u),c.abort(),s?.port1.close(),s?.port2.close()};s&&(s.port1.onmessage=async({data:e})=>{try{let t=await n.process(e.input,e.options,{signal:c.signal,throwIfAborted:()=>c.signal.throwIfAborted()},e.context);!l&&!c.signal.aborted&&s.port1.postMessage({identifier:e.identifier,value:t},hr(t))}catch(t){if(l||c.signal.aborted)return;s.port1.postMessage({identifier:e.identifier,error:{name:t instanceof Error?t.name:`Error`,message:t instanceof Error?t.message:String(t)}})}},s.port1.start()),o.requests++,yr.add(o);let f=!1,p=()=>{f||(f=!0,o.requests--,o.requests||yr.delete(o))},m;try{m=await o.runner.initializeTask(i,{context:structuredClone(r),...s?{port:s.port2}:{}},{...Dr(t),inputOwnership:`transfer`})}catch(e){throw p(),d(),e}return{handle:m,async close(){try{await m.close()}finally{d(),p()}}}}function Ar(e){let t=Symbol.asyncIterator in e?e[Symbol.asyncIterator]():e[Symbol.iterator](),n=!1;return{[Symbol.asyncIterator](){return this},async next(){if(n)return{done:!0,value:void 0};let e=await t.next();return e.done||n?(n=!0,{done:!0,value:void 0}):{done:!1,value:{value:e.value}}},async return(){return n||(n=!0,await t.return?.()),{done:!0,value:void 0}}}}function jr(e){let t=new URL(e,globalThis.document?.baseURI??globalThis.location.href),n=t.href;if(/^https?:$/.test(t.protocol)&&t.origin!==globalThis.location.origin){let e=br.get(t.href);e||(e=URL.createObjectURL(new Blob([`import ${JSON.stringify(t.href)};`],{type:`application/javascript`})),br.set(t.href,e)),n=e}return new Worker(n,{type:`module`})}function Mr(e,t=Mt){Nt(e,`no worker provided`);let n=e.version;return!(!t||!n)}function Nr(e,t){let n=t?.[e.id]?.workerUrl;if(t?.core?.worker===!1||!(e.worker||e.loadWorker||n)||t?.core?.credentials?.some(e=>e.type===`request`||`token`in e&&typeof e.token==`function`)||e.id===`shapefile`&&typeof t?.core?.fetch==`function`)return!1;let r=Vr(t),i=r._nodeWorkers;return!Ft&&!i||e.id===`csv`&&!Wr(t)?!1:!!xr(e,r)}function Pr(e,t){let n=t?.parquet;return e.id===`parquet`&&typeof n?.keyRetriever==`function`?!1:!!(e.workerInBatches&&Nr(e,t)&&Sr(e,Vr(t)))}function Fr(e,t,n,r,i=e){if(!Nr(e,n))return!1;if(n?.core?.worker!==`auto`||!i.getWorkerEstimate)return!0;try{let e=i.getWorkerEstimate(t,n,r);return e===void 0||!Number.isFinite(e)||e<0||e>1?!0:e>=(n.core?.workerThreshold??.1)}catch{return!0}}async function Ir(e,t,n,r,i,a){let o=a||Rr(n)||r?.signal,s=await Cr(e,t,{...Vr(n,e),signal:o,onProgress:n?.onProgress||r?.reportProgress},{process:async(t,a,o,s)=>{if(!i)throw Error(`Worker not set up to parse on main thread`);let{_loaderIds:c,_loaderIsArray:l,...u}=s||{};return await zr(i,t,a,r||s||o?.signal?{...r,...u,signal:o?.signal??r?.signal}:void 0,Br(e,c,l,r,n))}},Ur(r));return Gr(e)?e.deserializeWorkerResult(s,n,r):s}async function*Lr(e,t,n,r,i,a){let o=a||Rr(n)||r?.signal,s=Tr(e,t,{...Vr(n,e),signal:o,onProgress:n?.onProgress||r?.reportProgress},{process:async(t,a,o,s)=>{if(!i)throw Error(`Worker not set up to parse on main thread`);let{_loaderIds:c,_loaderIsArray:l,...u}=s||{};return await zr(i,t,a,r||s||o?.signal?{...r,...u,signal:o?.signal??r?.signal}:void 0,Br(e,c,l,r,n))}},Ur(r));for await(let t of s)yield e.deserializeWorkerBatch?e.deserializeWorkerBatch(t,n,r):t}function Rr(e){if(e?.signal)return e.signal;let t=e?.parquet?.signal;if(typeof AbortSignal<`u`&&t instanceof AbortSignal)return t}function zr(e,t,n,r,i){return!i&&e.length<=2?e(t,n):e(t,i,n,r)}function Br(e,t,n,r,i){if(!t)return;let a=new Map,o=new Set;for(let t of[e,...r?.loaders||[]])c(t);let s=t.map(e=>{let t=a.get(e);if(!t)throw Error(`Worker requested unknown loader "${e}". Declare it in loader.subloaders or pass it in context.loaders.`);return t});return n?s:s[0];function c(e){if(!o.has(e)){o.add(e),a.set(e.id,e);for(let[t,n]of Object.entries(e.subloaders||{})){let e=i?.core?.subloaders?.[t]||n;c(e),a.set(n.id,e)}}}}function Vr(e={},t){let n=t?.serializeWorkerOptions?.(e)||e,r={...n,signal:void 0,onProgress:void 0,...n.core?{core:{...n.core,authentications:void 0,log:Kr(n.core.log)?null:void 0}}:{}},i=JSON.parse(JSON.stringify(r,(e,t)=>{if(typeof Headers<`u`&&t instanceof Headers)return Object.fromEntries(t.entries());if(!(typeof AbortSignal<`u`&&t instanceof AbortSignal))return typeof t==`bigint`?null:t}));return Hr(r,i),i.core?.worker===`auto`&&(i.core.worker=!0),t&&(i._workerLoaderId=t.id),{...i,...i.core,parserOptions:i}}function Hr(e,t){if(!(!t||typeof t!=`object`))for(let n of Object.keys(t)){let r=e?.[n];typeof r==`bigint`?t[n]=r:Hr(r,t[n])}}function Ur(e){if(!e)return{};let{fetch:t,loaders:n,coreApi:r,signal:i,reportProgress:a,_parse:o,_parseSync:s,_parseInBatches:c,...l}=e;return JSON.parse(JSON.stringify(l))}function Wr(e){let t=e;return(t?.csv?.shape??t?.core?.shape)===`arrow`}function Gr(e){return typeof e.deserializeWorkerResult==`function`}function Kr(e){return e===null||e instanceof i}function qr(e,t,n){if(n||=e.byteLength,e.byteLength<n||t.byteLength<n)return!1;let r=new Uint8Array(e),i=new Uint8Array(t);for(let e=0;e<r.length;++e)if(r[e]!==i[e])return!1;return!0}function Jr(...e){return Yr(e)}function Yr(e){let t=e.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),n=t.reduce((e,t)=>e+t.byteLength,0),r=new Uint8Array(n),i=0;for(let e of t)r.set(e,i),i+=e.byteLength;return r.buffer}function Xr(e){let t=new Uint8Array(e),n=[],r=3*4096;for(let e=0;e<t.length;e+=r)n.push(btoa(String.fromCharCode(...t.subarray(e,e+r))));return n.join(``)}async function Zr(e){let t=[];for await(let n of e)t.push(Qr(n));return Jr(...t)}function Qr(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:n,byteLength:r}=e;return $r(t,n,r)}return $r(e)}function $r(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}var ei=Symbol(`loaders.gl.authenticated-fetch`),ti=new WeakMap;function ni(e){let t=e.fetch||((e,t)=>fetch(e,t)),n=t[ei],r=new Map(n?.credentialResolutions),i=S(e.credentials.map(e=>r.get(e)||e),e.authentications);if(e.credentials.forEach((e,t)=>{r.set(e,i[t])}),!e.fetchOptions&&(!i.length||n?.credentials.length===i.length&&i.every((e,t)=>e===n.credentials[t])))return t;let a=n?.fetch||t,o=n?[...new Set([...i,...n.credentials])]:i,s=ri(n?.fetchOptions||{},e.fetchOptions),c=o.filter(e=>e.type!==`request`),l=o.filter(e=>e.type===`request`);for(let e of l)oi(e.origins);let u=async(e,t={})=>{if(t=ri(s,t),t.signal?.throwIfAborted(),!o.length)return a(e,t);let n=ui(e),r=n?await si(n,t,c):{url:e,options:t,credentials:[]},i=await ii(r,l,`request`),u=await a(i.url,i.options),d=[];for(let n of r.credentials){let{credential:r}=n;typeof r.token==`function`&&(di(t)||r.canReplayRequest?.(e,t))&&(di(i.options)||r.canReplayRequest?.(i.url,i.options))&&(r.refreshStatusCodes.includes(u.status)||await r.shouldRefresh?.(u))&&d.push(n)}let f=di(t)&&di(i.options)&&i.credentials.some(e=>e.refreshStatusCodes?.includes(u.status));if(!d.length&&!f)return u;t.signal?.throwIfAborted();let p=new Map;if(await Promise.all(d.map(async({credential:t})=>{let n=await ci(t,e,u);n&&p.set(t,n)})),!p.size&&!f)return u;await u.body?.cancel().catch(()=>{}),t.signal?.throwIfAborted();let m=await ii(n?await si(n,t,c,p,r.credentials):{url:e,options:t},l,`retry`,u);return a(m.url,m.options)};return Object.defineProperty(u,ei,{value:{fetch:a,credentials:o,credentialResolutions:r,fetchOptions:s}}),u}function ri(e,t){let n={...e,...t};if(e.headers||t?.headers){let r=new Headers(e.headers);new Headers(t?.headers).forEach((e,t)=>r.set(t,e)),n.headers=r}return n}async function ii(e,t,n,r){let i=[],a=e.options.signal;for(let o of t){let t=ai(e.url);if(!t||!oi(o.origins).includes(t))continue;a?.throwIfAborted();let s=await o.authenticate({url:e.url,options:{...e.options,headers:new Headers(e.options.headers)},reason:n,response:r?{status:r.status,headers:new Headers(r.headers)}:void 0});if(!s||typeof s.url!=`string`||!s.options||typeof s.options!=`object`)throw Error(`Authentication callback returned an invalid request.`);e={url:s.url,options:{...s.options,...a?{signal:a}:{}}},i.push(o)}return a?.throwIfAborted(),{...e,credentials:i}}function ai(e){try{let t=new URL(e);return!t.host||t.username||t.password?null:t.origin===`null`?`${t.protocol}//${t.host}`:t.origin}catch{return null}}function oi(e){if(!e.length)throw Error(`Request authentication requires at least one exact origin.`);return e.map(e=>{let t=ai(e),n;try{n=new URL(e)}catch{throw Error(`Invalid request authentication origin.`)}if(!t||n.pathname&&n.pathname!==`/`||n.search||n.hash)throw Error(`Invalid request authentication origin.`);return t})}async function si(e,t,n,r=new Map,i=[]){let a=new URL(e),o=new Headers(t.headers),s=[],c=new Map(i.map(({credential:e,token:t})=>[e,t]));for(let t of n){if(!t.origins.includes(a.origin))continue;let n=r.get(t),i=c.get(t),l=t.type===`query-parameter`&&i!==void 0,u=t.type===`header`&&i!==void 0;if(t.type===`query-parameter`&&a.searchParams.has(t.name)&&!l||t.type===`header`&&o.has(t.name)&&!u)continue;let d=n??i??await li(t.token,{url:e.toString(),reason:`request`});d&&(t.type===`query-parameter`?a.searchParams.set(t.name,d):o.set(t.name,`${t.prefix||``}${d}`),s.push({credential:t,token:d}))}return{url:a.toString(),options:{...t,headers:o},credentials:s}}async function ci(e,t,n){let r=ti.get(e);if(r)return r;let i=e.token,a=Promise.resolve(i({url:t,reason:`refresh`,response:{status:n.status,headers:n.headers}})).finally(()=>ti.delete(e));return ti.set(e,a),a}async function li(e,t){return typeof e==`function`?e(t):e}function ui(e){try{let t=new URL(e);return[`http:`,`https:`].includes(t.protocol)?t:null}catch{return null}}function di(e){let t=(e.method||`GET`).toUpperCase();return[`GET`,`HEAD`,`OPTIONS`,`PUT`,`DELETE`].includes(t)?!(e.body&&typeof ReadableStream<`u`&&e.body instanceof ReadableStream):!1}var fi=``,pi={};function mi(e){for(let t in pi)if(e.startsWith(t)){let n=pi[t];e=e.replace(t,n)}return!e.startsWith(`http://`)&&!e.startsWith(`https://`)&&(e=`${fi}${e}`),e}function hi(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(t+1):e}function gi(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(0,t):``}function _i(e){return e}function vi(e){return e&&typeof e==`object`&&e.isBuffer}function yi(e){if(vi(e))return _i(e);if(e instanceof ArrayBuffer)return e;if(gt(e))return xi(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return e.byteOffset===0&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if(typeof e==`string`){let t=e;return new TextEncoder().encode(t).buffer}if(e&&typeof e==`object`&&e._toArrayBuffer)return e._toArrayBuffer();throw Error(`toArrayBuffer`)}function bi(e){if(e instanceof ArrayBuffer)return e;if(gt(e))return xi(e);let{buffer:t,byteOffset:n,byteLength:r}=e;return t instanceof ArrayBuffer&&n===0&&r===t.byteLength?t:xi(t,n,r)}function xi(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function Si(e){return ArrayBuffer.isView(e)?e:new Uint8Array(e)}var Ci=class extends SyntaxError{constructor(e,t,n){let r=Ki(t,n);super(`${e} at ${r.line}:${r.column}`),this.name=`WKTCRSSyntaxError`,this.offset=n,this.line=r.line,this.column=r.column}},wi=class extends Error{constructor(e){super(e[0]?.message||`WKT validation failed`),this.name=`WKTCRSValidationError`,this.issues=e}},Ti=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?$/,Ei=/^[A-Za-z][A-Za-z0-9_]*/,Di=new Set([`COMPD_CS`,`CONCAT_MT`,`FITTED_CS`,`GEOCCS`,`GEOGCS`,`INVERSE_MT`,`LOCAL_CS`,`PARAM_MT`,`PASSTHROUGH_MT`,`PROJCS`,`VERT_CS`]),Oi=new Set([...Di,`AUTHORITY`,`AXIS`,`CONCAT_MT`,`DATUM`,`INVERSE_MT`,`LOCAL_DATUM`,`PARAMETER`,`PARAM_MT`,`PASSTHROUGH_MT`,`PRIMEM`,`PROJECTION`,`SPHEROID`,`TOWGS84`,`UNIT`,`VERT_DATUM`]),ki=new Set(Di),Ai=new Set([...Oi,`EXTENSION`]),ji=new Set([...Di,`COMPDCS`,`LOCALCS`,`VERTCS`]),Mi=new Set([...Oi,`COMPDCS`,`LOCALCS`,`VDATUM`,`VERTCS`]),Ni=new Set([`BOUNDCRS`,`COMPOUNDCRS`,`COORDINATEOPERATION`,`ENGCRS`,`ENGINEERINGCRS`,`GEODCRS`,`GEODETICCRS`,`PARAMETRICCRS`,`PROJCRS`,`PROJECTEDCRS`,`TIMECRS`,`VERTCRS`,`VERTICALCRS`]),Pi=new Set([...Ni,`CONCATENATEDOPERATION`,`COORDINATEMETADATA`,`DERIVEDPROJCRS`,`GEOGCRS`,`GEOGRAPHICCRS`,`POINTMOTIONOPERATION`]),Fi=new Set([...Pi,`ABRIDGEDTRANSFORMATION`,`ANCHOR`,`ANGLEUNIT`,`AREA`,`AXIS`,`BASEENGCRS`,`BASEGEODCRS`,`BASEGEOGCRS`,`BASEPARAMCRS`,`BASEPROJCRS`,`BASETIMECRS`,`BASEVERTCRS`,`BBOX`,`BEARING`,`CALENDAR`,`CITATION`,`CONVERSION`,`COORDEPOCH`,`CS`,`DATUM`,`DERIVINGCONVERSION`,`DYNAMIC`,`EDATUM`,`ELLIPSOID`,`ENGINEERINGDATUM`,`ENSEMBLE`,`ENSEMBLEACCURACY`,`EPOCH`,`FRAMEEPOCH`,`GEODETICDATUM`,`GEOIDMODEL`,`ID`,`INTERPOLATIONCRS`,`LENGTHUNIT`,`MEMBER`,`MERIDIAN`,`METHOD`,`MODEL`,`OPERATIONACCURACY`,`ORDER`,`PARAMETER`,`PARAMETERFILE`,`PARAMETRICDATUM`,`PARAMETRICUNIT`,`PDATUM`,`PRIMEM`,`PRIMEMERIDIAN`,`REMARK`,`SCALEUNIT`,`SCOPE`,`SOURCECRS`,`STEP`,`TARGETCRS`,`TDATUM`,`TEMPORALQUANTITY`,`TIMEEXTENT`,`TIMEORIGIN`,`TIMEUNIT`,`TIMEDATUM`,`TRIAXIAL`,`TRF`,`URI`,`USAGE`,`VDATUM`,`VERSION`,`VERTICALDATUM`,`VERTICALEXTENT`,`VELOCITYGRID`,`VRF`]),Ii=new Set([`BASEGEOGCRS`,`CALENDAR`,`CONCATENATEDOPERATION`,`COORDEPOCH`,`COORDINATEMETADATA`,`DERIVEDPROJCRS`,`DYNAMIC`,`ENSEMBLE`,`ENSEMBLEACCURACY`,`EPOCH`,`FRAMEEPOCH`,`GEOGCRS`,`GEOGRAPHICCRS`,`GEOIDMODEL`,`MEMBER`,`MODEL`,`POINTMOTIONOPERATION`,`STEP`,`TEMPORALQUANTITY`,`TRF`,`TRIAXIAL`,`VELOCITYGRID`,`VRF`]),Li=new Set([...Fi].filter(e=>!Ii.has(e))),Ri={wkt1:Di,gdal:ki,esri:ji,"wkt2:2015":Ni,"wkt2:2019":Pi},zi={wkt1:Oi,gdal:Ai,esri:Mi,"wkt2:2015":Li,"wkt2:2019":Fi};function Bi(e,t){let n={type:`wkt-crs`,root:new Hi(e).parse()};if(t?.strict){let e=Vi(n,{profile:t.profile,allowExtensions:!1});if(e.length>0)throw new wi(e)}return n}function Vi(e,t){if(!e||e.type!==`wkt-crs`||e.root?.type!==`node`)throw TypeError(`validateWKTCRS expects a WKTCRSAst`);let n=Ui(e.root.keyword,t?.profile||`auto`),r=Ri[n],i=zi[n],a=[],o=e.root.keyword.toUpperCase();return r.has(o)||a.push({code:`invalid-root`,message:`${e.root.keyword} is not a ${n} root keyword`,path:[],keyword:e.root.keyword}),Gi(e.root,[],e=>{let r=e.node.keyword.toUpperCase();!t?.allowExtensions&&!i.has(r)&&a.push({code:`unknown-keyword`,message:`${e.node.keyword} is not defined by the ${n} profile`,path:e.path,keyword:e.node.keyword}),e.node.values.length===0&&a.push({code:`empty-node`,message:`${e.node.keyword} must contain at least one value`,path:e.path,keyword:e.node.keyword});let o=Wi(e.node);o&&a.push({code:`invalid-value`,message:o,path:e.path,keyword:e.node.keyword})}),a}var Hi=class{constructor(e){this.offset=0,this.source=e}parse(){this.skipWhitespace();let e=this.parseNode();return this.skipWhitespace(),this.offset!==this.source.length&&this.fail(`Unexpected content after WKT root`),e}parseNode(){let e=this.parseKeyword();return this.parseNodeAfterKeyword(e)}parseNodeAfterKeyword(e){this.skipWhitespace();let t=this.source[this.offset];t!==`[`&&t!==`(`&&this.fail(`Expected '[' or '(' after ${e}`),this.offset++;let n=t===`[`?`bracket`:`parenthesis`,r=t===`[`?`]`:`)`,i=[];if(this.skipWhitespace(),this.source[this.offset]===r)return this.offset++,{type:`node`,keyword:e,delimiter:n,values:i};for(;this.offset<this.source.length;){i.push(this.parseValue()),this.skipWhitespace();let t=this.source[this.offset];if(t===`,`){this.offset++,this.skipWhitespace(),this.source[this.offset]===r&&this.fail(`Expected a WKT value after comma`);continue}if(t===r)return this.offset++,{type:`node`,keyword:e,delimiter:n,values:i};(t===`]`||t===`)`)&&this.fail(`Expected '${r}' to close ${e}`),this.fail(`Expected ',' or '${r}' in ${e}`)}this.fail(`Unterminated ${e} node`)}parseValue(){if(this.skipWhitespace(),this.source[this.offset]===`"`)return this.parseString();let e=this.offset;for(;this.offset<this.source.length&&!/[\s,\[\]()"]/.test(this.source[this.offset]);)this.offset++;e===this.offset&&this.fail(`Expected a WKT value`);let t=this.source.slice(e,this.offset);return this.source[this.offset]===`"`&&this.fail(`Unexpected quote in unquoted WKT value`),this.skipWhitespace(),this.source[this.offset]===`[`||this.source[this.offset]===`(`?(/^[A-Za-z][A-Za-z0-9_]*$/.test(t)||this.fail(`Invalid WKT keyword '${t}'`),this.parseNodeAfterKeyword(t)):Ti.test(t)?{type:`number`,value:Number(t),raw:t}:{type:`enumeration`,value:t}}parseKeyword(){let e=this.source.slice(this.offset).match(Ei);return e||this.fail(`Expected a WKT keyword`),this.offset+=e[0].length,e[0]}parseString(){this.offset++;let e=``;for(;this.offset<this.source.length;){let t=this.source[this.offset++];if(t===`"`){if(this.source[this.offset]===`"`){e+=`"`,this.offset++;continue}return{type:`string`,value:e}}e+=t}this.fail(`Unterminated WKT string`)}skipWhitespace(){for(;this.offset<this.source.length&&/\s/.test(this.source[this.offset]);)this.offset++}fail(e){throw new Ci(e,this.source,this.offset)}};function Ui(e,t){return t===`auto`?Di.has(e.toUpperCase())?`wkt1`:`wkt2:2019`:t}function Wi(e){let t=e.keyword.toUpperCase(),n=e.values,r=(e,...t)=>!!(n[e]&&t.includes(n[e].type)),i=(e,...t)=>n.length===e&&t.every((e,t)=>r(t,e));if([`ANGLEUNIT`,`LENGTHUNIT`,`PARAMETRICUNIT`,`SCALEUNIT`,`TIMEUNIT`,`TEMPORALQUANTITY`,`UNIT`].includes(t)&&!(n.length>=2&&r(0,`string`)&&r(1,`number`)))return`${e.keyword} must start with a quoted name and numeric conversion factor`;if(t===`CS`&&!i(2,`enumeration`,`number`))return`${e.keyword} must contain a coordinate-system type and dimension`;if(t===`BBOX`&&!i(4,`number`,`number`,`number`,`number`))return`${e.keyword} must contain four numeric bounds`;if([`ENSEMBLEACCURACY`,`EPOCH`,`COORDEPOCH`,`FRAMEEPOCH`,`OPERATIONACCURACY`,`ORDER`].includes(t)&&!i(1,`number`))return`${e.keyword} must contain one number`;if([`ANCHOR`,`AREA`,`CALENDAR`,`CITATION`,`REMARK`,`SCOPE`,`URI`,`VERSION`].includes(t)&&!i(1,`string`))return`${e.keyword} must contain one quoted string`;if([`ELLIPSOID`,`SPHEROID`,`TRIAXIAL`].includes(t)&&!(n.length>=3&&r(0,`string`)&&r(1,`number`)&&r(2,`number`)))return`${e.keyword} must start with a quoted name and numeric ellipsoid axes`;if([`PARAMETER`].includes(t)&&!(n.length>=2&&r(0,`string`)&&r(1,`number`)))return`${e.keyword} must start with a quoted name and numeric value`;if(t===`PARAMETERFILE`&&!i(2,`string`,`string`))return`${e.keyword} must contain a quoted name and file name`;if([`AUTHORITY`,`ID`].includes(t)&&!(n.length>=2&&r(0,`string`)&&r(1,`string`,`number`)))return`${e.keyword} must start with a quoted authority and identifier`;if([`AXIS`].includes(t)&&!(n.length>=2&&r(0,`string`)&&r(1,`enumeration`)))return`${e.keyword} must start with a quoted name and axis direction`;if([`METHOD`,`PROJECTION`].includes(t)&&!(n.length>=1&&r(0,`string`)))return`${e.keyword} must start with a quoted name`;if(t===`TIMEEXTENT`){let t=e=>r(e,`enumeration`,`string`);if(n.length!==2||!t(0)||!t(1))return`${e.keyword} must contain two date-time or quoted values`}if(t===`VERTICALEXTENT`&&(n.length<2||n.length>3||!r(0,`number`)||!r(1,`number`)||n.length===3&&!r(2,`node`)))return`${e.keyword} must contain two numeric bounds and an optional unit`;if(t===`COORDINATEMETADATA`&&(n.length<1||n.length>2||!r(0,`node`)||n.length===2&&(!r(1,`node`)||![`EPOCH`,`COORDEPOCH`].includes(n[1].keyword.toUpperCase()))))return`${e.keyword} must contain a CRS and an optional coordinate epoch`;if(t===`BOUNDCRS`){let t=n.slice(0,3).map(e=>e.type===`node`?e.keyword.toUpperCase():``);if(t[0]!==`SOURCECRS`||t[1]!==`TARGETCRS`||t[2]!==`ABRIDGEDTRANSFORMATION`)return`${e.keyword} must start with SOURCECRS, TARGETCRS, and ABRIDGEDTRANSFORMATION`}return[`COMPOUNDCRS`,`CONCATENATEDOPERATION`,`COORDINATEOPERATION`,`DERIVEDPROJCRS`,`ENGCRS`,`ENGINEERINGCRS`,`GEODCRS`,`GEODETICCRS`,`GEOGCRS`,`GEOGRAPHICCRS`,`PARAMETRICCRS`,`POINTMOTIONOPERATION`,`PROJCRS`,`PROJECTEDCRS`,`TIMECRS`,`VERTCRS`,`VERTICALCRS`].includes(t)&&!r(0,`string`)?`${e.keyword} must start with a quoted name`:null}function Gi(e,t,n){n({node:e,path:t});for(let r=0;r<e.values.length;r++){let i=e.values[r];i.type===`node`&&Gi(i,[...t,r],n)}}function Ki(e,t){let n=1,r=1;for(let i=0;i<t&&i<e.length;i++)e[i]===`
`?(n++,r=1):r++;return{line:n,column:r}}var qi=class extends SyntaxError{constructor(e,t,n){let r=$i(t,n);super(`${e} at ${r.line}:${r.column}`),this.name=`PROJStringSyntaxError`,this.offset=n,this.line=r.line,this.column=r.column}};function Ji(e){let t=Zi(e);if(t.length===0)throw new qi(`PROJ string is empty`,e,0);return{type:`proj-string`,parameters:t.map(t=>Xi(t.raw,t.offset,e))}}var Yi=/^[+-]?\d+(?:\.\d*)?d(?:\d+(?:\.\d*)?'(?:\d+(?:\.\d*)?")?)?[NSEW]?$/i;function Xi(e,t,n){let r=e.startsWith(`+`)?e.slice(1):e;if(!r)throw new qi(`Expected a parameter after '+'`,n,t);let i=r.indexOf(`=`),a=i<0?r:r.slice(0,i);if(!a||/[\s+=]/.test(a))throw new qi(`Invalid PROJ parameter name '${a}'`,n,t);if(i<0)return{type:`parameter`,name:a};let o=r.slice(i+1);return{type:`parameter`,name:a,value:Qi(o,n,t+i+1),rawValue:o}}function Zi(e){let t=[],n=0;for(;n<e.length;){for(;n<e.length&&/\s/.test(e[n]);)n++;if(n>=e.length)break;let r=n,i=null,a=!1;for(;n<e.length;){let t=e[n];if(a){a=!1,n++;continue}if(t===`\\`&&i){a=!0,n++;continue}if(i){t===i&&(i=null),n++;continue}if((t===`"`||t===`'`)&&e[n-1]===`=`){i=t,n++;continue}if(/\s/.test(t))break;n++}if(i)throw new qi(`Unterminated quoted PROJ value`,e,r);t.push({raw:e.slice(r,n),offset:r})}return t}function Qi(e,t,n){if(!e)return``;let r=e[0];if(r!==`"`&&r!==`'`){if((e.includes(`"`)||e.includes(`'`))&&!Yi.test(e))throw new qi(`Quote must begin a PROJ parameter value`,t,n);return e}if(e[e.length-1]!==r)throw new qi(`Unterminated quoted PROJ value`,t,n);let i=``;for(let t=1;t<e.length-1;t++){let n=e[t];n===`\\`&&t+1<e.length-1?i+=e[++t]:i+=n}return i}function $i(e,t){let n=1,r=1;for(let i=0;i<t&&i<e.length;i++)e[i]===`
`?(n++,r=1):r++;return{line:n,column:r}}var ea={m:{name:`meters`,metersPerUnit:1},mm:{name:`millimeters`,metersPerUnit:.001},cm:{name:`centimeters`,metersPerUnit:.01},ft:{name:`feet`,metersPerUnit:.3048},"us-ft":{name:`us-survey-feet`,metersPerUnit:1200/3937},fath:{name:`fathoms`,metersPerUnit:1.8288},kmi:{name:`nautical-miles`,metersPerUnit:1852},"us-ch":{name:`us-survey-chains`,metersPerUnit:20.1168402336805},"us-mi":{name:`us-survey-miles`,metersPerUnit:1609.34721869444},km:{name:`kilometers`,metersPerUnit:1e3},"ind-ft":{name:`indian-feet`,metersPerUnit:.30479841},"ind-yd":{name:`indian-yards`,metersPerUnit:.91439523},mi:{name:`miles`,metersPerUnit:1609.344},yd:{name:`yards`,metersPerUnit:.9144},ch:{name:`chains`,metersPerUnit:20.1168},link:{name:`links`,metersPerUnit:.201168},dm:{name:`decimeters`,metersPerUnit:.1},in:{name:`inches`,metersPerUnit:.0254},"ind-ch":{name:`indian-chains`,metersPerUnit:20.11669506},"us-in":{name:`us-survey-inches`,metersPerUnit:.025400050800101},"us-yd":{name:`us-survey-yards`,metersPerUnit:.914401828803658}};function ta(e){return JSON.stringify([e.coordinateFrame,e.projection,Object.keys(e.parameters).sort().map(t=>[t,e.parameters[t]]),[e.ellipsoid.semiMajorAxis,e.ellipsoid.semiMinorAxis],e.axis,[e.xUnit.name,e.xUnit.metersPerUnit,e.xUnit.degreesPerUnit],[e.yUnit.name,e.yUnit.metersPerUnit,e.yUnit.degreesPerUnit],[e.zUnit.name,e.zUnit.metersPerUnit,e.zUnit.degreesPerUnit],e.lossy,e.areaOfUse])}function na(e){if(!Number.isFinite(e)||e<0)throw RangeError(`core.batchMaxRowsPerSecond must be a finite nonnegative number`)}async function*ra(e,{batchMaxRowsPerSecond:t=0,getRowCount:n,signal:r}){if(na(t),r?.throwIfAborted(),t===0){yield*e;return}let i=0;for await(let a of e){r?.throwIfAborted();let e=n(a);if(e!==void 0&&e>0){let n=i-performance.now();for(;n>0;)await ia(Math.min(Math.ceil(n),2**31-1),r),n=i-performance.now();r?.throwIfAborted(),i=performance.now()+e/t*1e3}yield a,r?.throwIfAborted()}}function ia(e,t){return t?.throwIfAborted(),new Promise((n,r)=>{let i=setTimeout(()=>{t?.removeEventListener(`abort`,a),n()},e);function a(){clearTimeout(i),t?.removeEventListener(`abort`,a),r(t?.reason)}t?.addEventListener(`abort`,a,{once:!0})})}var aa=class extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response},oa=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,sa=/^([-\w.]+\/[-\w.+]+)/;function ca(e,t){return e.toLowerCase()===t.toLowerCase()}function la(e){let t=sa.exec(e);return t?t[1]:e}function ua(e){let t=oa.exec(e);return t?t[1]:``}var da=/\?.*/;function fa(e){let t=e.match(da);return t&&t[0]}function pa(e){return e.replace(da,``)}function ma(e){if(e.length<50)return e;let t=e.slice(e.length-15);return`${e.substr(0,32)}...${t}`}function ha(e){return St(e)?e.url:Ct(e)?(`name`in e?e.name:``)||``:typeof e==`string`?e:``}function ga(e){if(St(e)){let t=e.headers.get(`content-type`)||``,n=pa(e.url);return la(t)||ua(n)}return Ct(e)?e.type||``:typeof e==`string`?ua(e):``}function _a(e){return St(e)?e.headers[`content-length`]||-1:Ct(e)?e.size:typeof e==`string`?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}async function va(e){if(St(e))return e;let t={},n=_a(e);n>=0&&(t[`content-length`]=String(n));let r=ha(e),i=ga(e);i&&(t[`content-type`]=i);let a=await xa(e);a&&(t[`x-first-bytes`]=a),typeof e==`string`&&(e=new TextEncoder().encode(e));let o=new Response(e,{headers:t});return Object.defineProperty(o,`url`,{value:r}),o}async function ya(e){if(!e.ok)throw await ba(e)}async function ba(e){let t=ma(e.url),n=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;n=n.length>100?`${n.slice(0,100)}...`:n;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get(`Content-Type`);r.reason=!e.bodyUsed&&t?.includes(`application/json`)?await e.json():await e.text()}catch{}return new aa(n,r)}async function xa(e){if(typeof e==`string`)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let n=new FileReader;n.onload=t=>e(t?.target?.result),n.readAsDataURL(t)})}return e instanceof ArrayBuffer?`data:base64,${Xr(e.slice(0,5))}`:null}function Sa(e){return!Ca(e)&&!wa(e)}function Ca(e){return e.startsWith(`http:`)||e.startsWith(`https:`)}function wa(e){return e.startsWith(`data:`)}async function Ta(e,t){if(typeof e==`string`){let n=mi(e);return Sa(n)&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(n,t):await fetch(n,t)}return await va(e)}var Ea={searchParams:void 0,core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,shape:void 0,log:r,useLocalLibraries:!1,subloaders:void 0,CDN:`https://unpkg.com/@loaders.gl`,worker:!0,workerThreshold:.1,workerInBatches:void 0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:o,_nodeWorkers:!1,_workerType:``,batchSize:`auto`,batchMaxRowsPerSecond:0,metadata:!1,transforms:[]}},Da={baseUri:`core.baseUrl`,baseUrl:`core.baseUrl`,fetch:`core.fetch`,mimeType:`core.mimeType`,fallbackMimeType:`core.fallbackMimeType`,ignoreRegisteredLoaders:`core.ignoreRegisteredLoaders`,nothrow:`core.nothrow`,log:`core.log`,useLocalLibraries:`core.useLocalLibraries`,CDN:`core.CDN`,worker:`core.worker`,workerThreshold:`core.workerThreshold`,workerTransferBufferCopy:`core.workerTransferBufferCopy`,maxConcurrency:`core.maxConcurrency`,maxMobileConcurrency:`core.maxMobileConcurrency`,reuseWorkers:`core.reuseWorkers`,_nodeWorkers:`core._nodeWorkers`,_workerType:`core._workerType`,_worker:`core._workerType`,shape:`core.shape`,batchSize:`core.batchSize`,batchDebounceMs:`(removed; use core.batchMaxRowsPerSecond)`,metadata:`core.metadata`,transforms:`core.transforms`,throws:`nothrow`,dataType:`(no longer used)`,uri:`core.baseUrl`,method:`core.fetch.method`,headers:`core.fetch.headers`,body:`core.fetch.body`,mode:`core.fetch.mode`,credentials:`core.fetch.credentials`,cache:`core.fetch.cache`,redirect:`core.fetch.redirect`,referrer:`core.fetch.referrer`,referrerPolicy:`core.fetch.referrerPolicy`,integrity:`core.fetch.integrity`,keepalive:`core.fetch.keepalive`,signal:`core.fetch.signal`};function Oa(e,t){let n=t?.searchParams;if(!n||Object.keys(n).length===0||/^(?:data|blob):/i.test(e))return e;let r=e.indexOf(`#`),i=r>=0?e.slice(r):``,a=r>=0?e.slice(0,r):e,o=a.indexOf(`?`),s=o>=0?a.slice(0,o):a,c=o>=0?a.slice(o+1):``,l=new URLSearchParams(c),u=new URLSearchParams;for(let[e,t]of Object.entries(n))l.has(e)||u.set(e,String(t));let d=u.toString();return`${s}${o>=0?`?${c}`:``}${d?`${o>=0?`&`:`?`}${d}`:``}${i}`}function ka(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||={},e._state}function Aa(){let e=ka();return e.globalOptions=e.globalOptions||{...Ea,core:{...Ea.core}},Ba(e.globalOptions)}function ja(e,t,n,r){n||=[],n=Array.isArray(n)?n:[n],Ma(e,n),Na(e);let i=Ia(t,e,r);return Na(i),i}function Ma(e,t){Pa(e,null,Ea,Da,t);for(let n of t){let r=e&&e[n.id]||{},i=n.options&&n.options[n.id]||{},a=n.deprecatedOptions&&n.deprecatedOptions[n.id]||{};Pa(r,n.id,i,a,t)}}function Na(e){let t=e.core?.workerThreshold;if(t!==void 0&&(!Number.isFinite(t)||t<0||t>1))throw Error(`core.workerThreshold must be a finite number between 0 and 1`)}function Pa(e,t,n,i,a){let o=t||`Top level`,s=t?`${t}.`:``;for(let c in e){let l=!t&&mt(e[c]),u=!t&&[`signal`,`onProgress`].includes(c),d=c===`workerUrl`&&t;if(!(c in n)&&!u&&!d){if(c in i)r.level>0&&r.warn(`${o} loader option \'${s}${c}\' no longer supported, use \'${i[c]}\'`)();else if(!l&&r.level>0){let e=Fa(c,a);r.warn(`${o} loader option \'${s}${c}\' not recognized. ${e}`)()}}}}function Fa(e,t){let n=e.toLowerCase(),r=``;for(let i of t)for(let t in i.options){if(e===t)return`Did you mean \'${i.id}.${t}\'?`;let a=t.toLowerCase();(n.startsWith(a)||a.startsWith(n))&&(r||=`Did you mean \'${i.id}.${t}\'?`)}return r}function Ia(e,n,r){let i=e.options||{},a={...i};i.core&&(a.core={...i.core});let o=e.defaultShape&&k(e);return o&&(a[o]={...i[o],shape:e.defaultShape}),Ra(a,Aa()),Ra(a,n),La(a,n,e),a.core?.log===null&&(a.core={...a.core,log:t(a)}),za(a,r),a}function La(e,t,n){let r=e.core?.shape;if(r===void 0)return;let i=k(n);if(!i)return;let a=n.options?.[i];if(!ht(a)||!(`shape`in a))return;let o=Aa()[i];if(ht(o)&&`shape`in o)return;let s=t[i];if(ht(s)&&`shape`in s)return;let c=e[i];e[i]={...ht(c)?c:{},shape:r}}function Ra(e,t){for(let n in t)if(n in t){let r=t[n];ht(r)&&ht(e[n])?e[n]={...e[n],...t[n]}:e[n]=t[n]}}function za(e,t){t&&e.core?.baseUrl===void 0&&(e.core||={},e.core.baseUrl=gi(pa(t)))}function Ba(e){let t={...e};return e.core&&(t.core={...e.core}),t}function Va(e,t){return Object.is(e,t)||Ha(e,t,new WeakMap)}function Ha(e,t,n){if(Object.is(e,t))return!0;if(!e||!t||typeof e!=`object`||typeof t!=`object`)return!1;let r=Object.getPrototypeOf(e);if(r!==Object.getPrototypeOf(t))return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1}else if(r!==Object.prototype&&r!==null)return!1;let i=n.get(e);if(i?.has(t))return!0;i||(i=new WeakSet,n.set(e,i)),i.add(t);let a=Ua(e),o=Ua(t),s=e,c=t;return a.length===o.length&&a.every(e=>Object.prototype.propertyIsEnumerable.call(t,e)&&Ha(s[e],c[e],n))}function Ua(e){return Reflect.ownKeys(e).filter(t=>Object.prototype.propertyIsEnumerable.call(e,t))}function Wa(e){return e?(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions)):!1}function Ga(e){n(e,`null loader`),n(Wa(e),`invalid loader`);let t;return Array.isArray(e)&&(t=e[1],e=e[0],e={...e,options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}var Ka=()=>{let e=ka();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function qa(e){let t=Ka();e=Array.isArray(e)?e:[e];for(let n of e){let e=Ga(n);t.find(t=>e===t)||t.unshift(e)}}function Ja(){return Ka()}var Ya=/\.([^.]+)$/;async function Xa(e,t=[],n,r,i=`parse`){if(!eo(e))return null;if(t&&!Array.isArray(t))return Ga(t);let a=e instanceof Response&&Za(e)?await e.clone().text():null,o;async function s(t){no(t);let s=a!==null&&$a(a,t,n,r,i)||$a(e,t,n,r,i);return!s&&Ct(e)&&t.length?(o??=await e.slice(0,10).arrayBuffer(),$a(o,t,n,r,i)):s}let c=await s(t||[]);if(!c&&!n?.core?.ignoreRegisteredLoaders&&(c=await s(Ja())),!c&&!n?.core?.nothrow)throw Error(to(e));return c}function Za(e){let t=ga(e);return!!(t&&(t.startsWith(`text/`)||t===`application/json`||t.endsWith(`+json`)))}function Qa(e,t=[],n,r,i=`parse`){if(!eo(e))return null;if(t&&!Array.isArray(t))return Ga(t);let a=t||[];no(a);let o=$a(e,a,n,r,i);if(!o&&!n?.core?.ignoreRegisteredLoaders&&(o=$a(e,Ja(),n,r,i)),!o&&!n?.core?.nothrow)throw Error(to(e));return o}function $a(e,t,n,i,a=`parse`){let o=ha(e),s=ga(e),c=pa(o)||i?.url,l=null,u=``,d=n?.core&&`type`in n.core?n.core.type:void 0;d&&d!==`auto`&&(l=ao(t,d),u=l?`match forced by supplied source type ${d}`:``),n?.core?.mimeType&&(l=co(t,n?.core?.mimeType),u=`match forced by supplied MIME type ${n?.core?.mimeType}`),!l&&a===`source`&&(l=oo(t,c),u=l?`matched source url ${c}`:``);let f=a===`source`&&c?t.filter(e=>!e.testURL):t;return l||=ro(f,c),u||=l?`matched url ${c}`:``,!l&&a===`parse`&&(l=oo(t,c),u=l?`matched source url ${c}`:``),l||=co(f,s),u||=l?`matched MIME type ${s}`:``,l||=lo(f,e),u||=l?`matched initial data ${mo(e)}`:``,!l&&Ct(e)&&(l=so(t,e),u||=l?`matched source testData`:``),n?.core?.fallbackMimeType&&(l||=co(f,n?.core?.fallbackMimeType),u||=l?`matched fallback MIME type ${s}`:``),u&&r.log(1,`selectLoader selected ${l?.name}: ${u}.`),l}function eo(e){return!(e instanceof Response&&e.status===204)}function to(e){let t=ha(e),n=ga(e),r=`No valid loader found (`;r+=t?`${hi(t)}, `:`no url provided, `,r+=`MIME type: ${n?`"${n}"`:`not provided`}, `;let i=e?mo(e):``;return r+=i?` first bytes: "${i}"`:`first bytes: not available`,r+=`)`,r}function no(e){for(let t of e)Ga(t)}function ro(e,t){let n=t&&Ya.exec(t),r=n&&n[1];return r?io(e,r):null}function io(e,t){t=t.toLowerCase();for(let n of e)for(let e of n.extensions)if(e.toLowerCase()===t)return n;return null}function ao(e,t){for(let n of e)if((n.type??n.id)===t)return n;return null}function oo(e,t){if(!t)return null;for(let n of e)if(n.testURL?.(t))return n;return null}function so(e,t){for(let n of e)if(n.testData&&n.testData?.(t))return n;return null}function co(e,t){for(let n of e)if(n.mimeTypes?.some(e=>ca(t,e))||ca(t,`application/x.${n.id}`))return n;return null}function lo(e,t){if(!t)return null;for(let n of e)if(typeof t==`string`){if(uo(t,n))return n}else if(ArrayBuffer.isView(t)){if(fo(t.buffer,t.byteOffset,n))return n}else if(t instanceof ArrayBuffer&&fo(t,0,n))return n;return null}function uo(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}function fo(e,t,n){return(Array.isArray(n.tests)?n.tests:[n.tests]).some(r=>po(e,t,n,r))}function po(e,t,n,r){if(_t(r))return qr(r,e,r.byteLength);switch(typeof r){case`function`:return r(bi(e));case`string`:return r===ho(e,t,r.length);default:return!1}}function mo(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?ho(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?ho(e,0,t):``}function ho(e,t,n){if(e.byteLength<t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}var go=256*1024;function*_o(e,t){let n=t?.chunkSize||go,r=0,i=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,n),a=e.slice(r,r+t);r+=t,yield bi(i.encode(a))}}var vo=256*1024;function*yo(e,t={}){let{chunkSize:n=vo}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,n),i=new ArrayBuffer(t),a=new Uint8Array(e,r,t);new Uint8Array(i).set(a),r+=t,yield i}}var bo=1024*1024;async function*xo(e,t){let n=t?.chunkSize||bo,r=0;for(;r<e.size;){let t=r+n,i=await e.slice(r,t).arrayBuffer();r=t,yield i}}function So(e,t){return o?Co(e,t):wo(e,t)}async function*Co(e,t){let n=e.getReader(),r,i=!1,a=!1,o=!1;try{for(;;){let e=r||n.read();r=void 0;let o;try{o=await e}catch(e){throw a=!0,e}let{done:s,value:c}=o;if(s){i=!0;return}t?._streamReadAhead&&(r=n.read(),r.catch(()=>{})),yield yi(c)}}catch(e){throw o=!0,e}finally{let e=!1,t;if(!i&&!a)try{await n.cancel()}catch(n){e=!0,t=n}try{n.releaseLock()}catch(n){e||(e=!0,t=n)}if(!o&&e)throw t}}async function*wo(e,t){for await(let t of e)yield yi(t)}function To(e,t){if(typeof e==`string`)return _o(e,t);if(e instanceof ArrayBuffer)return yo(e,t);if(Ct(e))return xo(e,t);if(Et(e))return So(e,t);if(St(e)){let n=e.body;if(!n)throw Error(`Readable stream not available on Response`);return So(n,t)}throw Error(`makeIterator`)}var Eo=`Cannot convert supplied data type`;function Do(e,t,n){if(t.text&&typeof e==`string`)return e;if(vi(e)&&(e=e.buffer),_t(e)){let n=Si(e);return t.text&&!t.binary?new TextDecoder(`utf8`).decode(n):yi(n)}throw Error(Eo)}async function Oo(e,t,n){if(typeof e==`string`||_t(e))return Do(e,t,n);if(Ct(e)&&(e=await va(e)),St(e))return await ya(e),t.binary?await e.arrayBuffer():await e.text();if(Et(e)&&(e=To(e,n)),yt(e)||bt(e))return Zr(e);throw Error(Eo)}async function ko(e,t){if(typeof e==`string`)return new TextEncoder().encode(e).buffer;if(_t(e))return yi(Si(e));if(Ct(e)&&(e=await va(e)),St(e))return await ya(e),await e.arrayBuffer();if(Et(e)&&(e=To(e,t)),yt(e)||bt(e))return Zr(e);throw Error(Eo)}async function Ao(e,t){if(vt(e)&&(e=await e),xt(e))return e;if(St(e)){await ya(e);let n=await e.body;if(!n)throw Error(Eo);return To(n,t)}return Ct(e)||Et(e)?To(e,t):bt(e)||yt(e)?e:jo(e)}function jo(e){if(ArrayBuffer.isView(e)||_t(e))return(function*(){yield yi(e)})();if(xt(e))return e;if(yt(e))return e[Symbol.iterator]();throw Error(Eo)}function Mo(e,t){let n=Aa(),r=e||n,i=r.core?.fetch,a;a=typeof i==`function`?i:mt(i)?t?.fetch||Ta:t?.fetch?t.fetch:Ta;let o=r.signal||t?.signal,s=mt(i)?i:void 0;return ni({fetch:a,credentials:r.core?.credentials||[],authentications:r.core?.authentications,fetchOptions:o?{...s,signal:o}:s})}var No=new Map,Po=new Map;async function Fo(e,t,n){if(Lo(e)||!e.preload&&e.createDataSourceSync)return e;let r=Bo(e,t),i=Po.get(e)?.get(r);if(i)return i;let a=No.get(e);a||(a=new Map,No.set(e,a));let o=a.get(r);return o||(o=Ro(e,t,n).then(t=>{let n=Po.get(e);return n||(n=new Map,Po.set(e,n)),n.set(r,t),t}).catch(t=>{throw a.delete(r),a.size===0&&No.delete(e),t}),a.set(r,o)),await o}function Io(e,t){if(e.subloaders&&!Ho.has(e)){let t=Uo.get(e);if(t)return t;if(!Lo(e))return null}if(Lo(e)||!e.preload&&e.createDataSourceSync)return e;let n=Bo(e,t);return Po.get(e)?.get(n)||null}function Lo(e){let t=e;return!!(t.parse||t.parseBlob||t.parseUrl||t.parseSync||t.parseInBatches||t.parseText||t.parseTextSync||t.parseFile||t.parseFileInBatches)}async function Ro(e,t,n){if(e.preload){let r=await e.preload(n||``,t);if(r&&(Lo(r)||r.createDataSourceSync))return r;throw Error(`${e.id} loader preload() did not return a parser-bearing loader or a source factory`)}return await Vo(zo(e,t),e.id)}function zo(e,t){if(t?.core?._workerType===`test`){let t=`modules/${e.module}/src/${e.id}-loader.ts`;return typeof window<`u`?`/${t}`:typeof process<`u`&&process.cwd?new URL(t,`file://${process.cwd()}/`).toString():t}throw Error(`${e.id} loader does not provide a parser implementation. Import a parser-bearing loader directly, or use preload() before parse/load.`)}function Bo(e,t){let n=t?.[e.id],r=e.options?.[e.id];return String(n?.backend||r?.backend||``)}async function Vo(e,t){let n=await l(()=>import(e),[]);for(let e of Object.values(n))if(e&&typeof e==`object`&&e.id===t&&Lo(e))return e;throw Error(`Could not find parser implementation for ${t} in ${e}`)}var Ho=new WeakSet,Uo=new WeakMap;async function Wo(e,t,n,r){t&&!Array.isArray(t)&&!Wa(t)&&(r=void 0,n=t,t=void 0),n||={},(n.signal||r?.signal)?.throwIfAborted();let i=e.url||``,a=ls(t,r),o=await Xa(i,a,n);if(!o)return null;let s=ja(n,o,a,i),c=await C(!o.getAuthentications&&s.core?.credentials?.length?await Fo(o,s,i||r?.url):o,i,s);return r=cs({url:i,_parse:us,loaders:a},c,r||null),Go(o,e,c,r)}async function Go(e,t,n,r){(n.signal||r.signal)?.throwIfAborted(),Mr(e),n=Dt(e.options,n);let i=await Fo(e,n,r.url);if(i.parseFile){let e=i.prepareParseOutput?.(n),a=await i.parseFile(t,e?.options??n,r);return e?e.convert(a):a}if(i.parse){let a=t.bigsize>0n?Number(t.bigsize):t.size;if(!a)throw Error(`${e.id} loader - cannot fall back to parse without a file size`);return await us(await t.read(0n,a),i,n,r)}throw i.createDataSourceSync?Error(`${e.id} has no file parser. Use createDataSource() to open a source.`):Error(`${e.id} loader - no file parser found`)}function Ko(e,t,n,r){!Array.isArray(t)&&!Wa(t)&&(r=void 0,n=t,t=void 0),n||={};let i=ls(t,r),a=Qa(e,i,n);if(!a)return null;let o=ja(n,a,i),s=ha(e),c=()=>{throw Error(`parseSync called parse (which is async`)};return r=cs({url:s,_parseSync:c,_parse:c,loaders:t},o,r||null),qo(Io(a)||a,e,o,r)}function qo(e,t,n,r){if(t=Do(t,e,n),e.parseTextSync&&typeof t==`string`)return e.parseTextSync(t,n);if(e.parseSync&&t instanceof ArrayBuffer)return e.parseSync(t,n,r);throw e.preload?Error(`${e.name} loader: 'parseSync' requires a parser-bearing loader. Import the loader implementation directly, or call preload(loader) before parseSync(). ${r.url||``}`):e.createDataSourceSync?Error(`${e.id} has no synchronous parser. Use createDataSource() to open a source.`):Error(`${e.name} loader: 'parseSync' not supported by this loader, use 'parse' instead. ${r.url||``}`)}async function Jo(e,t,n,r){let i=Array.isArray(t)?t:void 0;!Array.isArray(t)&&!Wa(t)&&(r=void 0,n=t,t=void 0),(n?.signal||r?.signal)?.throwIfAborted(),e=await e,n||={},(n.signal||r?.signal)?.throwIfAborted();let a=ha(e),o=await Xa(e,t,n);if(!o)return[];let s=ja(n,o,i,a),c=await C(!o.getAuthentications&&s.core?.credentials?.length?await Fo(o,s,a||r?.url):o,a||``,s),l=E(o,c);r=cs({url:a,_parseInBatches:Jo,_parse:us,loaders:i},c,r||null);let u=await Yo(o,await Fo(o,c,r.url),e,c,r);return l?O(u):u}async function Yo(e,t,n,r,i){let{batchMaxRowsPerSecond:a=0,batchSize:o}=r.core??{};if(na(a),o!==void 0&&o!==`auto`&&(!Number.isSafeInteger(o)||o<1))throw RangeError(`core.batchSize must be a positive integer or "auto"`);let s=a?{...r,core:{...r.core,batchMaxRowsPerSecond:0}}:r,c=t.parseInBatches?t.prepareParseBatchOutput?.(s):null,l=await Zo(t,n,c?.options??s,i),u=c?Xo(l,c.convert):l,d=a?ra(u,{batchMaxRowsPerSecond:a,getRowCount:e=>rs(e,t.module),signal:r.signal??i.signal}):u;if(!r?.core?.metadata)return d;let f={shape:`metadata`,batchType:`metadata`,metadata:{_loader:e,_context:i},data:[],bytesUsed:0};async function*p(e){yield f,yield*e}return p(d)}async function*Xo(e,t){for await(let n of e)yield t(n)}async function Zo(e,t,n,r){let i=await ns(await Ao(t,n),n?.core?.transforms||[]);return e.parseInBatches?Pr(e,n)?Lr(e,i,n,r,us):e.parseInBatches(i,n,r):Qo(i,e,n,r)}async function*Qo(e,t,n,r){let i=await us(await Zr(e),t,{...n,core:{...n?.core,mimeType:t.mimeTypes[0]}},r);if(D(i)){yield*i.batches;return}yield $o(i,t)}function $o(e,t){let n=es(e)?{...e,length:ts(e),batchType:`data`}:{shape:`unknown`,batchType:`data`,data:e,length:Array.isArray(e)?e.length:1};return n.mimeType=t.mimeTypes[0],n}function es(e){if(!e||typeof e!=`object`||!(`shape`in e))return!1;let t=e;switch(t.shape){case`array-row-table`:case`object-row-table`:return Array.isArray(t.data);case`geojson-table`:return Array.isArray(t.features);case`columnar-table`:return!!(t.data&&typeof t.data==`object`);default:return!1}}function ts(e){switch(e.shape){case`array-row-table`:case`object-row-table`:return e.data.length;case`geojson-table`:return e.features.length;case`columnar-table`:for(let t of Object.values(e.data))return t.length||0;return 0}}async function ns(e,t=[]){let n=e;for await(let e of t)n=e(n);return n}function rs(e,t){if(!e||typeof e!=`object`)return;if(t===`geospatial`&&Array.isArray(e))return e.length;let n=e;if(!(t===`traces`&&n.table!==void 0&&n.table!==`spans`&&n.table!==`slices`)&&!(n.batchType!==void 0&&n.batchType!==`data`)&&n.shape!==`unknown`)return n.data?.numRows??n.numRows??n.header?.vertexCount??n.features?.length??n.length}async function is(e,t,n,r){let i,a;!Array.isArray(t)&&!Wa(t)?(i=[],a=t,r=void 0):(i=t,a=n),a||=Aa();let o;if(typeof e==`string`||Ct(e)){let t=await Xa(e,i,{...a,core:{...a?.core,nothrow:!0}}),n=typeof e==`string`&&t?.fetchBeforePreload,s=t&&(typeof e==`string`||t.createDataSourceSync)?Fo(t,a,typeof e==`string`?e:void 0):null;if(n){let n=a,i=new AbortController,c=n.core?.fetch,l=n.signal||r?.signal||(typeof c==`object`?c?.signal:void 0),u=l?AbortSignal.any([l,i.signal]):i.signal;try{[,o]=await Promise.all([s,C(t,e,n).then(t=>(u.throwIfAborted(),a=w(t),Mo({...a,signal:u},r)(Oa(e,a))))])}catch(e){throw i.abort(e),e}}let c=await s;if(t&&c?.createDataSourceSync&&!Lo(c))throw Error(`${t.id} creates sources. Use createDataSource() instead of load().`);if(!o&&t&&c&&typeof e==`string`){a=await C(t.getAuthentications?t:c,e,a||{});let{parseUrl:n}=c;if(n)return n(Oa(e,a),ja(a,t,[t],e),r)}}a&&=w(a);let s=Mo(a),c=e;return typeof e==`string`&&(c=o??await s(Oa(e,a))),Ct(e)&&(c=await s(e)),typeof e==`string`&&(a?.core?.baseUrl||(a={...a,core:{...a?.core,baseUrl:e}})),await us(c,i,a,r)}function as(e,t,n,r){let i;return!Array.isArray(t)&&!Wa(t)?(r=void 0,n=t,i=void 0):i=t,Array.isArray(e)?e.map(e=>os(e,i,n||{})):os(e,i,n||{})}async function os(e,t,n){if(typeof e==`string`){let r=e,i=await Xa(r,t,{...n,core:{...n.core,nothrow:!0}});return n=await C(i&&!i.getAuthentications&&n.core?.credentials?.length?await Fo(i,n,r):i,r,n),await Jo(await Mo(n)(Oa(r,n)),t,n)}return await Jo(e,t,n)}var ss=Object.freeze({fetchFile:Ta,parse:us,parseFile:Wo,parseSync:Ko,parseInBatches:Jo,load:is,loadInBatches:as});function cs(e,t,n){if(n)return{...n,signal:t.signal||n.signal,reportProgress:t.onProgress||n.reportProgress,coreApi:n.coreApi||e.coreApi||ss,_parse:n._parse||e._parse,fetch:Mo(t,n)};let r={...e,signal:t.signal||e.signal,reportProgress:t.onProgress||e.reportProgress,fetch:Mo(t,e),coreApi:e.coreApi||ss};if(r.url){let e=pa(r.url);r.baseUrl=e,r.queryString=fa(r.url),r.filename=hi(e),r.baseUrl=gi(e)}return Array.isArray(r.loaders)||(r.loaders=null),r}function ls(e,t){if(e&&!Array.isArray(e))return e;let n;if(e&&(n=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];n=n?[...n,...e]:e}return n&&n.length?n:void 0}async function us(e,t,n,r){t&&!Array.isArray(t)&&!Wa(t)&&(r=void 0,n=t,t=void 0),(n?.signal||r?.signal)?.throwIfAborted(),e=await e,n||={},(n.signal||r?.signal)?.throwIfAborted();let i=ha(e),a=ls(t,r),o=await Xa(e,a,n);if(!o)return null;let s=ja(n,o,a,i),c=await C(!o.getAuthentications&&s.core?.credentials?.length?await Fo(o,s,i||r?.url):o,i||``,s);return r=cs({url:i,_parse:us,loaders:a},c,r||null),ds(o,e,c,r)}async function ds(e,t,n,r){if((n.signal||r.signal)?.throwIfAborted(),Mr(e),n=Dt(e.options,n),St(t)){let{ok:e,redirected:n,status:i,statusText:a,type:o,url:s}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:n,status:i,statusText:a,type:o,url:s}}let i=await Fo(e,n,r.url);if(i.createDataSourceSync&&!Lo(i))throw Error(`${e.id} creates sources. Use createDataSource() to open a source.`);let a=i.prepareParseOutput?.(n),o=a?.options??n,s;return Fr(i,t,o,r,e)?s=await Ir(i,St(t)&&t.ok?ko(t,o):await ko(t,o),o,r,us):Ct(t)&&i.parseBlob?s=await i.parseBlob(t,o,r):(t=await Oo(t,e,o),s=await fs(i,t,o,r)),a?a.convert(s):s}async function fs(e,t,n,r){if(e.parseText&&typeof t==`string`)return await e.parseText(t,n,r);if(e.parseTextSync&&typeof t==`string`)return e.parseTextSync(t,n,r);if(e.parse)return await e.parse(t,n,r);throw e.parseSync?Error(`${e.name} loader: 'parse' not available on parser-bearing sync loader. Add an async 'parse' function to this loader, or call preload(loader) before parseSync(). ${r.url||``}`):e.createDataSourceSync?Error(`${e.id} creates sources. Use createDataSource() to open a source.`):Error(`${e.id} loader - no parser found and worker is disabled`)}var R=new c({id:`deck`}),ps={};function ms(e){ps=e}function hs(e,t,n,r){R.level>0&&ps[e]&&ps[e].call(null,t,n,r)}function gs(e){let t=e[0],n=e[e.length-1];return t===`{`&&n===`}`||t===`[`&&n===`]`}var _s={dataType:null,batchType:null,id:`JSON`,name:`JSON`,module:``,version:``,options:{},extensions:[`json`,`geojson`],mimeTypes:[`application/json`,`application/geo+json`],testText:gs,parseTextSync:JSON.parse};function vs(){let e=`10.0.0-alpha.2`,t=globalThis.deck&&globalThis.deck.VERSION;if(t&&t!==e)throw Error(`deck.gl - multiple versions detected: ${t} vs ${e}`);return t||(R.log(1,`deck.gl ${e}`)(),globalThis.deck={...globalThis.deck,VERSION:e,version:e,log:R,_registerLoggers:ms},qa([_s,[a,{imagebitmap:{premultiplyAlpha:`none`}}]])),e}var ys=vs();function bs(e=[],t){let n={modules:[],injectionTargets:[],defines:{},injections:{},vertexInputs:{},interStageVariables:{}};for(let r of e)Ss(n,r,t);let{vertexInputs:r,interStageVariables:i}=n;for(let e of Object.keys(i))if(r[e])throw Error(`ShaderPlugin name "${e}" cannot be both a vertex input and a varying`);return n}function xs(e=[],t=[],n={}){let r=[...e],i=new Map;for(let e of r){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||i.set(e.name,e)}for(let e of t){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||(r.push(e),i.set(e.name,e))}return r}function Ss(e,t,n){t.module&&e.modules.push(t.module),t.defines&&Object.assign(e.defines,t.defines);for(let[n,r]of Object.entries(t.vertexInputs||{})){Cs(n,`vertex input`);let t=e.vertexInputs[n];if(t&&t!==r)throw Error(`ShaderPlugin vertex input "${n}" has conflicting types "${t}" and "${r}"`);e.vertexInputs[n]=r}for(let[n,r]of Object.entries(t.interStageVariables||{})){Cs(n,`varying`);let t=ws(n,r),i=e.interStageVariables[n];if(i&&(i.type!==t.type||i.interpolation!==t.interpolation))throw Error(`ShaderPlugin varying "${n}" has conflicting declarations "${i.type}/${i.interpolation}" and "${t.type}/${t.interpolation}"`);e.interStageVariables[n]=t}for(let r of t.injectionTargets||[]){let t=r[n];if(!t)continue;let i=`${r.stage===`vertex`?`vs`:`fs`}:${r.name}`;if(!/^(vs|fs):[A-Za-z_][A-Za-z0-9_]*$/.test(i))throw Error(`Invalid ShaderPlugin injection target ${i}`);let a=e.injectionTargets.find(e=>e.stage===r.stage&&e.name===r.name),o=a?.[n];if(o&&(o.parameters!==t.parameters||(o.returnType||`void`)!==(t.returnType||`void`)||o.header!==t.header||o.footer!==t.footer))throw Error(`Conflicting ShaderPlugin injection target ${i}`);a||e.injectionTargets.push({name:r.name,stage:r.stage,[n]:t})}let r=M(Array.isArray(t.injections)?t.injections:Object.entries(t.injections||{}).flatMap(([e,t])=>{let r=Ts(e,n);if(r===void 0)return[];let[i,...a]=r.split(`:`);if(i!==`vs`&&i!==`fs`)throw Error(`Invalid ShaderPlugin injection ${e}`);return[{stage:i===`vs`?`vertex`:`fragment`,target:a.join(`:`),[n]:t}]}),n,t.name);for(let[t,n]of Object.entries(r))e.injections[t]||=[],e.injections[t].push(...n)}function Cs(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)||e.startsWith(`_luma_`))throw Error(`ShaderPlugin ${t} "${e}" must be a valid non-reserved identifier`)}function ws(e,t){let{primitiveType:n}=ge.getAttributeShaderTypeInfo(t.type),r=n===`i32`||n===`u32`,i=t.interpolation||(r?`flat`:`smooth`);if(r&&i===`smooth`)throw Error(`ShaderPlugin integer varying "${e}" must use flat interpolation`);return{type:t.type,interpolation:i}}function Ts(e,t){let n=/^(glsl|wgsl):([\s\S]+)$/.exec(e);return n?n[1]===t?n[2]:void 0:e}var Es=class extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let n=0;n<this.ELEMENTS;++n)this[n]=e[n+t];return this.check()}toArray(e=[],t=0){for(let n=0;n<this.ELEMENTS;++n)e[t+n]=this[n];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:Fe(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toString(){return this.formatString(Ae)}formatString(e){let t=``;for(let n=0;n<this.ELEMENTS;++n)t+=(n>0?`, `:``)+Ne(this[n],e);return`${e.printTypes?this.constructor.name:``}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!Oe(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,n){if(n===void 0)return this.lerp(this,e,t);for(let r=0;r<this.ELEMENTS;++r){let i=e[r];this[r]=i+n*((typeof t==`number`?t:t[r])-i)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(Math.max(this[n],e[n]),t[n]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if(typeof e==`number`)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(Ae.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e&&=Number.isFinite(this[t]);return e}};function Ds(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}function Os(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}function ks(e,t,n=``){if(Ae.debug&&!Ds(e,t))throw Error(`math.gl: ${n} some fields set to invalid numbers'`);return e}var As=class extends Es{toString(){let e=`[`;if(Ae.printRowMajor){e+=`row-major:`;for(let t=0;t<this.RANK;++t)for(let n=0;n<this.RANK;++n)e+=` ${this[n*this.RANK+t]}`}else{e+=`column-major:`;for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+=`]`,e}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,n){return this[t*this.RANK+e]=Os(n),this}getColumn(e,t=Array(this.RANK).fill(-0)){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[n+e];return t}setColumn(e,t){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)this[n+e]=t[e];return this}};function js(e,t){if(!e)throw Error(`math.gl assertion ${t}`)}var Ms=class extends Es{get x(){return this[0]}set x(e){this[0]=Os(e)}get y(){return this[1]}set y(e){this[1]=Os(e)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let e=0;for(let t=0;t<this.ELEMENTS;++t)e+=this[t]*this[t];return e}magnitudeSquared(){return this.lengthSquared()}distance(e){return Math.sqrt(this.distanceSquared(e))}distanceSquared(e){let t=0;for(let n=0;n<this.ELEMENTS;++n){let r=this[n]-e[n];t+=r*r}return Os(t)}dot(e){let t=0;for(let n=0;n<this.ELEMENTS;++n)t+=this[n]*e[n];return Os(t)}normalize(){let e=this.magnitude();if(e!==0)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e;return this.check()}multiply(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]*=t[e];return this.check()}divide(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]/=t[e];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(e){return this.distance(e)}distanceToSquared(e){return this.distanceSquared(e)}getComponent(e){return js(e>=0&&e<this.ELEMENTS,`index is out of range`),Os(this[e])}setComponent(e,t){return js(e>=0&&e<this.ELEMENTS,`index is out of range`),this[e]=t,this.check()}addVectors(e,t){return this.copy(e).add(t)}subVectors(e,t){return this.copy(e).subtract(t)}multiplyVectors(e,t){return this.copy(e).multiply(t)}addScaledVector(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]+=e[n]*t;return this.check()}};Math.PI/180;function Ns(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e}function Ps(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e}function Fs(e,t){return e[0]=-t[0],e[1]=-t[1],e}function Is(e,t,n,r){let i=t[0],a=t[1];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e}function Ls(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[4]*i+n[12],e[1]=n[1]*r+n[5]*i+n[13],e}var Rs=Ps;function zs(e,t,n){let r=t[0],i=t[1],a=n[3]*r+n[7]*i||1;return e[0]=(n[0]*r+n[4]*i)/a,e[1]=(n[1]*r+n[5]*i)/a,e}function Bs(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a||1;return e[0]=(n[0]*r+n[4]*i+n[8]*a)/o,e[1]=(n[1]*r+n[5]*i+n[9]*a)/o,e[2]=(n[2]*r+n[6]*i+n[10]*a)/o,e}function Vs(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i,e[1]=n[1]*r+n[3]*i,e[2]=t[2],e}function Hs(e){let t=e[0],n=e[1],r=e[2];return Math.sqrt(t*t+n*n+r*r)}function Us(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e}function Ws(e){let t=e[0],n=e[1],r=e[2];return t*t+n*n+r*r}function Gs(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e}function Ks(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function qs(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2];return e[0]=i*c-a*s,e[1]=a*o-r*c,e[2]=r*s-i*o,e}function Js(e,t,n,r){let i=t[0],a=t[1],o=t[2];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e[2]=o+r*(n[2]-o),e}function Ys(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a+n[15];return o||=1,e[0]=(n[0]*r+n[4]*i+n[8]*a+n[12])/o,e[1]=(n[1]*r+n[5]*i+n[9]*a+n[13])/o,e[2]=(n[2]*r+n[6]*i+n[10]*a+n[14])/o,e}function Xs(e,t,n){let r=t[0],i=t[1],a=t[2];return e[0]=r*n[0]+i*n[3]+a*n[6],e[1]=r*n[1]+i*n[4]+a*n[7],e[2]=r*n[2]+i*n[5]+a*n[8],e}function Zs(e,t,n){let r=n[0],i=n[1],a=n[2],o=n[3],s=t[0],c=t[1],l=t[2],u=i*l-a*c,d=a*s-r*l,f=r*c-i*s,p=i*f-a*d,m=a*u-r*f,h=r*d-i*u,g=o*2;return u*=g,d*=g,f*=g,p*=2,m*=2,h*=2,e[0]=s+u+p,e[1]=c+d+m,e[2]=l+f+h,e}function Qs(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0],a[1]=i[1]*Math.cos(r)-i[2]*Math.sin(r),a[2]=i[1]*Math.sin(r)+i[2]*Math.cos(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function $s(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[2]*Math.sin(r)+i[0]*Math.cos(r),a[1]=i[1],a[2]=i[2]*Math.cos(r)-i[0]*Math.sin(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function ec(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0]*Math.cos(r)-i[1]*Math.sin(r),a[1]=i[0]*Math.sin(r)+i[1]*Math.cos(r),a[2]=i[2],e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function tc(e,t){let n=e[0],r=e[1],i=e[2],a=t[0],o=t[1],s=t[2],c=Math.sqrt((n*n+r*r+i*i)*(a*a+o*o+s*s)),l=c&&Ks(e,t)/c;return Math.acos(Math.min(Math.max(l,-1),1))}var nc=Us,rc=Hs,ic=Ws,ac=[0,0,0],oc,sc=class e extends Ms{static get ZERO(){return oc||(oc=new e(0,0,0),Object.freeze(oc)),oc}constructor(e=0,t=0,n=0){super(-0,-0,-0),arguments.length===1&&Fe(e)?this.copy(e):(Ae.debug&&(Os(e),Os(t),Os(n)),this[0]=e,this[1]=t,this[2]=n)}set(e,t,n){return this[0]=e,this[1]=t,this[2]=n,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this.check()}fromObject(e){return Ae.debug&&(Os(e.x),Os(e.y),Os(e.z)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this.check()}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e}get ELEMENTS(){return 3}get z(){return this[2]}set z(e){this[2]=Os(e)}angle(e){return tc(this,e)}cross(e){return qs(this,this,e),this.check()}rotateX({radians:e,origin:t=ac}){return Qs(this,this,t,e),this.check()}rotateY({radians:e,origin:t=ac}){return $s(this,this,t,e),this.check()}rotateZ({radians:e,origin:t=ac}){return ec(this,this,t,e),this.check()}transform(e){return this.transformAsPoint(e)}transformAsPoint(e){return Ys(this,this,e),this.check()}transformAsVector(e){return Bs(this,this,e),this.check()}transformByMatrix3(e){return Xs(this,this,e),this.check()}transformByMatrix2(e){return Vs(this,this,e),this.check()}transformByQuaternion(e){return Zs(this,this,e),this.check()}};function cc(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function lc(e,t){if(e===t){let n=t[1],r=t[2],i=t[3],a=t[6],o=t[7],s=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=i,e[13]=o,e[14]=s}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}function uc(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,E=u*_-p*m,D=d*g-f*h,O=d*_-p*h,k=f*_-p*g,A=v*k-y*O+b*D+x*E-S*T+C*w;return A?(A=1/A,e[0]=(s*k-c*O+l*D)*A,e[1]=(i*O-r*k-a*D)*A,e[2]=(h*C-g*S+_*x)*A,e[3]=(f*S-d*C-p*x)*A,e[4]=(c*E-o*k-l*T)*A,e[5]=(n*k-i*E+a*T)*A,e[6]=(g*b-m*C-_*y)*A,e[7]=(u*C-f*b+p*y)*A,e[8]=(o*O-s*E+l*w)*A,e[9]=(r*E-n*O-a*w)*A,e[10]=(m*S-h*b+_*v)*A,e[11]=(d*b-u*S-p*v)*A,e[12]=(s*T-o*D-c*w)*A,e[13]=(n*D-r*T+i*w)*A,e[14]=(h*y-m*x-g*v)*A,e[15]=(u*x-d*y+f*v)*A,e):null}function dc(e){let t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=n*s-r*o,b=l*m-u*p,x=l*h-d*p,S=u*h-d*m,C=t*S-n*x+r*b,w=a*S-o*x+s*b,T=l*y-u*v+d*_,E=p*y-m*v+h*_;return c*C-i*w+g*T-f*E}function fc(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e}function pc(e,t,n){let r=n[0],i=n[1],a=n[2],o,s,c,l,u,d,f,p,m,h,g,_;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*a+t[12],e[13]=t[1]*r+t[5]*i+t[9]*a+t[13],e[14]=t[2]*r+t[6]*i+t[10]*a+t[14],e[15]=t[3]*r+t[7]*i+t[11]*a+t[15]):(o=t[0],s=t[1],c=t[2],l=t[3],u=t[4],d=t[5],f=t[6],p=t[7],m=t[8],h=t[9],g=t[10],_=t[11],e[0]=o,e[1]=s,e[2]=c,e[3]=l,e[4]=u,e[5]=d,e[6]=f,e[7]=p,e[8]=m,e[9]=h,e[10]=g,e[11]=_,e[12]=o*r+u*i+m*a+t[12],e[13]=s*r+d*i+h*a+t[13],e[14]=c*r+f*i+g*a+t[14],e[15]=l*r+p*i+_*a+t[15]),e}function mc(e,t,n){let r=n[0],i=n[1],a=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function hc(e,t,n,r){let i=r[0],a=r[1],o=r[2],s=Math.sqrt(i*i+a*a+o*o),c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j;return s<1e-6?null:(s=1/s,i*=s,a*=s,o*=s,l=Math.sin(n),c=Math.cos(n),u=1-c,d=t[0],f=t[1],p=t[2],m=t[3],h=t[4],g=t[5],_=t[6],v=t[7],y=t[8],b=t[9],x=t[10],S=t[11],C=i*i*u+c,w=a*i*u+o*l,T=o*i*u-a*l,E=i*a*u-o*l,D=a*a*u+c,O=o*a*u+i*l,k=i*o*u+a*l,A=a*o*u-i*l,j=o*o*u+c,e[0]=d*C+h*w+y*T,e[1]=f*C+g*w+b*T,e[2]=p*C+_*w+x*T,e[3]=m*C+v*w+S*T,e[4]=d*E+h*D+y*O,e[5]=f*E+g*D+b*O,e[6]=p*E+_*D+x*O,e[7]=m*E+v*D+S*O,e[8]=d*k+h*A+y*j,e[9]=f*k+g*A+b*j,e[10]=p*k+_*A+x*j,e[11]=m*k+v*A+S*j,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)}function gc(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e}function _c(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i-l*r,e[1]=o*i-u*r,e[2]=s*i-d*r,e[3]=c*i-f*r,e[8]=a*r+l*i,e[9]=o*r+u*i,e[10]=s*r+d*i,e[11]=c*r+f*i,e}function vc(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[4],u=t[5],d=t[6],f=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i+l*r,e[1]=o*i+u*r,e[2]=s*i+d*r,e[3]=c*i+f*r,e[4]=l*i-a*r,e[5]=u*i-o*r,e[6]=d*i-s*r,e[7]=f*i-c*r,e}function yc(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[1]=u+_,e[2]=f-g,e[3]=0,e[4]=u-_,e[5]=1-l-m,e[6]=p+h,e[7]=0,e[8]=f+g,e[9]=p-h,e[10]=1-l-d,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function bc(e,t,n,r,i,a,o){let s=1/(n-t),c=1/(i-r),l=1/(a-o);return e[0]=a*2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a*2*c,e[6]=0,e[7]=0,e[8]=(n+t)*s,e[9]=(i+r)*c,e[10]=(o+a)*l,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*a*2*l,e[15]=0,e}function xc(e,t,n,r,i){let a=1/Math.tan(t/2);if(e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0){let t=1/(r-i);e[10]=(i+r)*t,e[14]=2*i*r*t}else e[10]=-1,e[14]=-2*r;return e}var Sc=xc;function Cc(e,t,n,r,i,a,o){let s=1/(t-n),c=1/(r-i),l=1/(a-o);return e[0]=-2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*c,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*l,e[11]=0,e[12]=(t+n)*s,e[13]=(i+r)*c,e[14]=(o+a)*l,e[15]=1,e}var wc=Cc;function Tc(e,t,n,r){let i,a,o,s,c,l,u,d,f,p,m=t[0],h=t[1],g=t[2],_=r[0],v=r[1],y=r[2],b=n[0],x=n[1],S=n[2];return Math.abs(m-b)<1e-6&&Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6?cc(e):(d=m-b,f=h-x,p=g-S,i=1/Math.sqrt(d*d+f*f+p*p),d*=i,f*=i,p*=i,a=v*p-y*f,o=y*d-_*p,s=_*f-v*d,i=Math.sqrt(a*a+o*o+s*s),i?(i=1/i,a*=i,o*=i,s*=i):(a=0,o=0,s=0),c=f*s-p*o,l=p*a-d*s,u=d*o-f*a,i=Math.sqrt(c*c+l*l+u*u),i?(i=1/i,c*=i,l*=i,u*=i):(c=0,l=0,u=0),e[0]=a,e[1]=c,e[2]=d,e[3]=0,e[4]=o,e[5]=l,e[6]=f,e[7]=0,e[8]=s,e[9]=u,e[10]=p,e[11]=0,e[12]=-(a*m+o*h+s*g),e[13]=-(c*m+l*h+u*g),e[14]=-(d*m+f*h+p*g),e[15]=1,e)}function Ec(e){if(e.length!==16||Array.from(e).some(e=>!Number.isFinite(e))||e[3]!==0||e[7]!==0||e[11]!==0||e[15]!==1)throw RangeError(`Expected a finite affine matrix`);let t=[Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])];if(t.some(e=>e===0||!Number.isFinite(e)))throw RangeError(`Singular transform`);let n=Array.from({length:9},(n,r)=>e[Math.floor(r/3)*4+r%3]/t[Math.floor(r/3)]);for(let[e,t]of[[0,3],[0,6],[3,6]])if(Math.abs(n[e]*n[t]+n[e+1]*n[t+1]+n[e+2]*n[t+2])>1e-7)throw RangeError(`Sheared transforms do not have a TRS decomposition`);if(n[0]*(n[4]*n[8]-n[5]*n[7])-n[3]*(n[1]*n[8]-n[2]*n[7])+n[6]*(n[1]*n[5]-n[2]*n[4])<0){t[0]=-t[0];for(let e=0;e<3;e++)n[e]=-n[e]}return{rotation:n,scale:t,translation:[e[12],e[13],e[14]]}}function Dc(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e}function Oc(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*a+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*a+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*a+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*a+n[15]*o,e}var kc=45*Math.PI/180,Ac=1,jc=.1,Mc=500,Nc=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),z=class extends As{static get IDENTITY(){return Lc()}static get ZERO(){return Ic()}get ELEMENTS(){return 16}get RANK(){return 4}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this[4]=i,this[5]=a,this[6]=o,this[7]=s,this[8]=c,this[9]=l,this[10]=u,this[11]=d,this[12]=f,this[13]=p,this[14]=m,this[15]=h,this.check()}setRowMajor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=i,this[2]=c,this[3]=f,this[4]=t,this[5]=a,this[6]=l,this[7]=p,this[8]=n,this[9]=o,this[10]=u,this[11]=m,this[12]=r,this[13]=s,this[14]=d,this[15]=h,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(Nc)}fromObject(e){return this.check()}fromQuaternion(e){return yc(this,e),this.check()}fromMatrix3(e){return this.set(e[0],e[1],e[2],0,e[3],e[4],e[5],0,e[6],e[7],e[8],0,0,0,0,1)}frustum(e){let{left:t,right:n,bottom:r,top:i,near:a=jc,far:o=Mc}=e;return o===1/0?zc(this,t,n,r,i,a):bc(this,t,n,r,i,a,o),this.check()}lookAt(e){let{eye:t,center:n=[0,0,0],up:r=[0,1,0]}=e;return Tc(this,t,n,r),this.check()}ortho(e){let{left:t,right:n,bottom:r,top:i,near:a=jc,far:o=Mc}=e;return wc(this,t,n,r,i,a,o),this.check()}orthographic(e){let{fovy:t=kc,aspect:n=Ac,focalDistance:r=1,near:i=jc,far:a=Mc}=e;Rc(t);let o=t/2,s=r*Math.tan(o),c=s*n;return this.ortho({left:-c,right:c,bottom:-s,top:s,near:i,far:a})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:n=1,near:r=.1,far:i=500}=e;return Rc(t),Sc(this,t,n,r,i),this.check()}determinant(){return dc(this)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){let{rotation:n,scale:r}=Ec(this);if(e||=Array(16),t)for(let e=0;e<3;e++)t[e]=r[e];for(let t=0;t<16;t++)e[t]=0;for(let t=0;t<9;t++)e[Math.floor(t/3)*4+t%3]=n[t];return e[15]=1,e}getRotationMatrix3(e,t){let{rotation:n,scale:r}=Ec(this);if(e||=Array(9),t)for(let e=0;e<3;e++)t[e]=r[e];for(let t=0;t<9;t++)e[t]=n[t];return e}transpose(){return lc(this,this),this.check()}invert(){return uc(this,this),this.check()}multiplyLeft(e){return fc(this,e,this),this.check()}multiplyRight(e){return fc(this,this,e),this.check()}rotateX(e){return gc(this,this,e),this.check()}rotateY(e){return _c(this,this,e),this.check()}rotateZ(e){return vc(this,this,e),this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){return hc(this,this,e,t),this.check()}scale(e){return mc(this,this,Array.isArray(e)?e:[e,e,e]),this.check()}translate(e){return pc(this,this,e),this.check()}transform(e,t){return e.length===4?(t=Oc(t||[-0,-0,-0,-0],e,this),ks(t,4),t):this.transformAsPoint(e,t)}transformAsPoint(e,t){let{length:n}=e,r;switch(n){case 2:r=Ls(t||[-0,-0],e,this);break;case 3:r=Ys(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return ks(r,e.length),r}transformAsVector(e,t){let n;switch(e.length){case 2:n=zs(t||[-0,-0],e,this);break;case 3:n=Bs(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return ks(n,e.length),n}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,n){return this.identity().translate([e,t,n])}},Pc,Fc;function Ic(){return Pc||(Pc=new z([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),Object.freeze(Pc)),Pc}function Lc(){return Fc||(Fc=new z,Object.freeze(Fc)),Fc}function Rc(e){if(e>Math.PI*2)throw Error(`expected radians`)}function zc(e,t,n,r,i,a){let o=2*a/(n-t),s=2*a/(i-r),c=(n+t)/(n-t),l=(i+r)/(i-r),u=-2*a;return e[0]=o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=c,e[9]=l,e[10]=-1,e[11]=-1,e[12]=0,e[13]=0,e[14]=u,e[15]=0,e}var Bc=2**-52;function Vc(e,t,n=e){let r=e.x,i=e.y,a=e.z,{semiMajorAxis:o,semiMinorAxis:s,eccentricitySquared:c}=t,l=Math.sin(i),u=Math.abs(i)===Math.PI/2?0:Math.cos(i),d=s/o,f=c<.9?o/Math.sqrt(1-c*l*l):o/Math.hypot(u,d*l);return qc(n,(f+a)*u*Math.cos(r),(f+a)*u*Math.sin(r),(f*(c<.9?1-c:d*d)+a)*l)}function Hc(e,t,n=e){let r=e.x,i=e.y,a=e.z,{semiMajorAxis:o,semiMinorAxis:s,eccentricitySquared:c}=t,l=Math.atan2(i,r),u=Math.hypot(r,i),d=Math.hypot(r,i,a);if(!(d>0)||!Number.isFinite(d))return!1;if(c===0)return qc(n,u===0?0:l,Math.atan2(a,u),d-o);if(u===0)return qc(n,0,Math.sign(a)*Math.PI/2,Math.abs(a)-s);let f=u/o,p=a/s;if(f*f+p*p<1-16*Bc||c>=.9)return Uc(r,i,a,u,o,s,n);let m=a/d,h=u/d,g=1/Math.sqrt(1-c*(2-c)*h*h),_=h*(1-c)*g,v=m*g;for(let e=0;e<30;e++){let e=o/Math.sqrt(1-c*v*v),t=u*_+a*v-e*(1-c*v*v),r=c*e/(e+t);g=1/Math.sqrt(1-r*(2-r)*h*h);let i=h*(1-r)*g,s=m*g;if(Math.abs(s*_-i*v)<=1e-12){if(!Number.isFinite(t))break;return qc(n,l,Math.atan2(s,Math.abs(i)),t)}_=i,v=s}return Uc(r,i,a,u,o,s,n)}function Uc(e,t,n,r,i,a,o){let s=Math.atan2(t,e),c=a/i,l=c*c,u=r/i,d=n/i,f=1-l;if(!(l>0)||c>1)return!1;let p=i*i,m=a*a,h=Number.isFinite(p)&&p>0?(m-l*p+Gc(a,a,m)-l*Gc(i,i,p)-Gc(l,p,l*p))/p:0,g=r*r,_=e*e,v=t*t,y=_+v,b=Number.isFinite(g)&&g>0?(y-g+Wc(_,v,y)+Gc(e,e,_)+Gc(t,t,v)-Gc(r,r,g))/(2*r):0,x=i*l,S=r-i,C=S+x,w=b+Wc(r,-i,S)+Wc(S,x,C)+Gc(i,l,x)+i*h;if(n===0)return C+w<0?!1:qc(o,s,0,S);let T=Math.abs(d)*c,E=0,D=l+Math.hypot(u,d*c);if(!Number.isFinite(D))return!1;let O=Math.max(T,u-f);O>E&&O<D||(O=D/2);let k=-(C+w)/i,A=Math.sqrt(k*(u+f))/f,j=k>0&&Math.abs(n)/A/i*c<=Bc*k?Math.atan2(Math.sign(n)*A/c,u/f):void 0;for(let e=0;e<1024&&j===void 0;e++){let e=f+O,t=u/e,r=n/O/i,a=r*c,o=i*O,s=C-o,l=(s+(Wc(C,-o,s)+w-Gc(i,O,o)))/(i*e)*(t+1),d=l+a*a;if(!Number.isFinite(d))return!1;d>0?E=O:D=O;let p=-2*(t*t/e+a*a/O),m=O-d/p,h=m>E&&m<D?m:E+(D-E)/2;if(Math.abs(d)<=4*Bc*(Math.abs(l)+a*a)||D-E<=4*Bc*O){j=Math.atan2(r,t);break}O=h}return j!==void 0&&Kc(o,s,j,r,n,i,c)}function Wc(e,t,n){let r=n-e;return e-(n-r)+(t-r)}function Gc(e,t,n){let r=134217729*e,i=134217729*t;if(!Number.isFinite(r)||!Number.isFinite(i))return 0;let a=r-(r-e),o=i-(i-t),s=e-a,c=t-o;return a*o-n+a*c+s*o+s*c}function Kc(e,t,n,r,i,a,o){let s=Math.sin(n),c=Math.cos(n);return qc(e,t,n,r*c+i*s-a*Math.hypot(c,o*s))}function qc(e,t,n,r){return!Number.isFinite(t)||!Number.isFinite(n)||!Number.isFinite(r)?!1:(e.x=t,e.y=n,e.z=r,!0)}function Jc(e,t=[],n=0){let r=Math.fround(e),i=e-r;return t[n]=r,t[n+1]=i,t}function Yc(e){return e-Math.fround(e)}function Xc(e){let t=new Float32Array(32);for(let n=0;n<4;++n)for(let r=0;r<4;++r){let i=n*4+r;Jc(e[r*4+n],t,i*2)}return t}function Zc(e,t=!0){return e??t}function Qc(e=[0,0,0],t=!0){if(tl(e)&&e.length===3)return e;let n=el(e,t)?255:1;return[e[0]/n,e[1]/n,e[2]/n]}function $c(e,t=!0){let n=Number.isFinite(e[3]);if(tl(e)&&e.length===4&&n)return e;let r=el(e,t)?255:1;return[e[0]/r,e[1]/r,e[2]/r,n?e[3]/r:1]}function el(e,t){return Array.isArray(e)?t:`BYTES_PER_ELEMENT`in e&&e.BYTES_PER_ELEMENT===1}function tl(e){let t=Object.prototype.toString.call(e);return ArrayBuffer.isView(e)&&(t===`[object Float16Array]`||t===`[object Float32Array]`||t===`[object Float64Array]`)}var nl=`
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
`,rl=`struct Fp64F32Bits {
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

`,il={name:`fp64arithmetic`,source:`\
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
// Zero bits the compiler cannot prove are zero: the uniform ONE is 1.0 at runtime.
// Some WGSL backends compile with fast-math flags (e.g. Firefox WebGPU on Windows, where DXC
// runs without IEEE strictness). There, a float barrier such as \`x + ONE * 0.0\` folds away,
// and the error terms of the double-single transforms are re-associated and lost. An integer
// OR is opaque to floating-point simplification, and unlike XOR two nested barriers do not
// cancel. Each rounding step the transforms rely on gets its own barrier.
fn fp64_runtime_zero_bits() -> u32 {
  return bitcast<u32>(fp64arithmetic.ONE) ^ 0x3f800000u;
}

fn fp64_runtime_zero() -> f32 {
  return bitcast<f32>(fp64_runtime_zero_bits());
}

fn prevent_fp64_optimization(value: f32) -> f32 {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  return bitcast<f32>(bitcast<u32>(value) | fp64_runtime_zero_bits());
#else
  return value;
#endif
}
#endif

#ifdef LUMA_FP64_INTEGER_ARITHMETIC
${`\
${rl}

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
${rl}

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
  b.y = prevent_fp64_optimization(b.y + a.y);
  return b;
}

fn quickTwoSum(a: f32, b: f32) -> vec2f {
  let sum = prevent_fp64_optimization(a + b);
  let err = prevent_fp64_optimization(b - prevent_fp64_optimization(sum - a));
  return vec2f(sum, err);
}

fn twoSum(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a + b);
  let v = prevent_fp64_optimization(s - a);
  let aErr = prevent_fp64_optimization(a - prevent_fp64_optimization(s - v));
  let bErr = prevent_fp64_optimization(b - v);
  let err = prevent_fp64_optimization(aErr + bErr);
  return vec2f(s, err);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a - b);
  let v = prevent_fp64_optimization(s - a);
  let aErr = prevent_fp64_optimization(a - prevent_fp64_optimization(s - v));
  let bErr = prevent_fp64_optimization(b + v);
  let err = prevent_fp64_optimization(aErr - bErr);
  return vec2f(s, err);
}

fn twoSqr(a: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * a);
  let aFp64 = split(a);
  let highProduct = prevent_fp64_optimization(aFp64.x * aFp64.x);
  let crossProduct = prevent_fp64_optimization(2.0 * aFp64.x * aFp64.y);
  let lowProduct = prevent_fp64_optimization(aFp64.y * aFp64.y);
  let highErr = prevent_fp64_optimization(highProduct - prod);
  let err = prevent_fp64_optimization(
    prevent_fp64_optimization(highErr + crossProduct) + lowProduct
  );
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

// Scale by 2^exponent under either arithmetic. The classic path repacks each limb with
// integer operations and no floating-point arithmetic, so hardware that flushes subnormal
// results cannot zero a subnormal limb. Its result has the value of the integer path's,
// which also renormalizes the limbs; that renormalization would flush them here.
fn fp64_scale_fp64(value: vec2f, exponent: i32) -> vec2f {
#ifdef LUMA_FP64_INTEGER_ARITHMETIC
  return fp64_scale_fp64_integer(value, exponent);
#else
  let high = fp64_decode_raw_f32_bits(bitcast<u32>(value.x));
  let low = fp64_decode_raw_f32_bits(bitcast<u32>(value.y));
  var scaledHigh = value.x;
  if (!(high.isZero || high.isInf || high.isNan)) {
    scaledHigh = bitcast<f32>(
      fp64_make_f32_bits_from_u64(high.sign, vec2u(0u, high.significand), high.baseExponent + exponent)
    );
  }
  var scaledLow = value.y;
  if (!(low.isZero || low.isInf || low.isNan)) {
    scaledLow = bitcast<f32>(
      fp64_make_f32_bits_from_u64(low.sign, vec2u(0u, low.significand), low.baseExponent + exponent)
    );
  }
  return vec2f(scaledHigh, scaledLow);
#endif
}
#endif
`,fs:nl,vs:nl,defaultUniforms:{ONE:1,SPLIT:4097},uniformTypes:{ONE:`f32`,SPLIT:`f32`},fp64ify:Jc,fp64LowPart:Yc,fp64ifyMatrix4:Xc},al={props:{},uniforms:{},name:`picking`,uniformTypes:{isActive:`f32`,isAttribute:`f32`,isHighlightActive:`f32`,useByteColors:`f32`,highlightedObjectColor:`vec3<f32>`,highlightColor:`vec4<f32>`},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:[0,1,1,1]},vs:`layout(std140) uniform pickingUniforms {
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
`,getUniforms:ol};function ol(e={},t){let n={},r=Zc(e.useByteColors,!0);return e.highlightedObjectColor===void 0||(e.highlightedObjectColor===null?n.isHighlightActive=!1:(n.isHighlightActive=!0,n.highlightedObjectColor=e.highlightedObjectColor.slice(0,3))),e.highlightColor&&(n.highlightColor=$c(e.highlightColor,r)),e.isActive!==void 0&&(n.isActive=!!e.isActive,n.isAttribute=!!e.isAttribute),e.useByteColors!==void 0&&(n.useByteColors=!!e.useByteColors),n}function sl(){return{color:[0,0,0],position:[0,0,0],halfAxisX:[0,0,0],halfAxisY:[0,0,0],normal:[0,0,-1],disk:0}}var cl={color:`vec3<f32>`,position:`vec3<f32>`,halfAxisX:`vec3<f32>`,halfAxisY:`vec3<f32>`,normal:`vec3<f32>`,disk:`i32`};function ll(e,t=!1){return Array.from({length:4},(n,r)=>{let i=e[r];if(!i)return sl();let a=Qc(i.color||(t?[255,255,255]:[1,1,1]),t);return{position:i.position,halfAxisX:i.halfAxisX,halfAxisY:i.halfAxisY,normal:i.normal,disk:i.type===`disk`?1:0,color:a.map(e=>e*(i.intensity??1e3))}})}var ul=`precision highp int;

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
`,dl=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
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
`,fl=5,pl={props:{},uniforms:{},name:`lighting`,defines:{},uniformTypes:{enabled:`i32`,directionalLightCount:`i32`,pointLightCount:`i32`,spotLightCount:`i32`,ambientColor:`vec3<f32>`,lights:[{color:`vec3<f32>`,position:`vec3<f32>`,direction:`vec3<f32>`,attenuation:`vec3<f32>`,coneCos:`vec2<f32>`},fl],areaLightCount:`i32`,areaLights:[cl,4]},defaultUniforms:vl(),bindingLayout:[{name:`lighting`,group:2}],firstBindingSlot:0,source:dl,vs:ul,fs:ul,getUniforms:ml};function ml(e,t={}){e&&={...e};let n=(e?.lights||[]).filter(e=>e.type===`rect`||e.type===`disk`);if(!e)return vl();e.lights&&(e={...e,...gl(e.lights),lights:void 0});let{useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s}=e||{};if(!(i||a&&a.length>0||o&&o.length>0||s&&s.length>0)&&n.length===0)return{...vl(),enabled:0};let c={...vl(),...hl({useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s})};return c.areaLightCount=Math.min(n.length,4),c.areaLights=ll(n,Zc(e.useByteColors,!0)),e.enabled!==void 0&&(c.enabled=e.enabled?1:0),c}function hl({useByteColors:e,ambientLight:t,pointLights:n=[],spotLights:r=[],directionalLights:i=[]}){let a=yl(),o=0,s=0,c=0,l=0;for(let t of n){if(o>=fl)break;a[o]={...a[o],color:_l(t,e),position:t.position,attenuation:t.attenuation||[1,0,0]},o++,s++}for(let t of r){if(o>=fl)break;a[o]={...a[o],color:_l(t,e),position:t.position,direction:t.direction,attenuation:t.attenuation||[1,0,0],coneCos:xl(t)},o++,c++}for(let t of i){if(o>=fl)break;a[o]={...a[o],color:_l(t,e),direction:t.direction},o++,l++}return n.length+r.length+i.length>fl&&console.warn(`MAX_LIGHTS exceeded, truncating to ${fl}`),{ambientColor:_l(t,e),directionalLightCount:l,pointLightCount:s,spotLightCount:c,lights:a}}function gl(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let n of e||[])switch(n.type){case`ambient`:t.ambientLight=n;break;case`directional`:t.directionalLights?.push(n);break;case`point`:t.pointLights?.push(n);break;case`spot`:t.spotLights?.push(n);break;default:}return t}function _l(e={},t){let{color:n=[0,0,0],intensity:r=1}=e;return Qc(n,Zc(t,!0)).map(e=>e*r)}function vl(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:yl(),areaLightCount:0,areaLights:ll([])}}function yl(){return Array.from({length:fl},()=>bl())}function bl(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function xl(e){let t=e.innerConeAngle??0,n=e.outerConeAngle??Math.PI/4;return[Math.cos(t),Math.cos(n)]}var Sl={name:`lambertMaterial`,firstBindingSlot:0,bindingLayout:[{name:`lambertMaterial`,group:3}],dependencies:[pl],source:`struct lambertMaterialUniforms {
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
`,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:`i32`,ambient:`f32`,diffuse:`f32`},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6},getUniforms(e){return{...Sl.defaultUniforms,...e}}},Cl=`layout(std140) uniform waterMaterialUniforms {
  uniform float time;
  uniform vec3 baseColor;
  uniform float opacity;
  uniform vec3 fresnelColor;
  uniform float fresnelPower;
  uniform float specularIntensity;
  uniform float normalStrength;
  uniform int mappingMode;
  uniform vec2 coordinateScale;
  uniform vec2 coordinateOffset;
  uniform vec2 waveADirection;
  uniform float waveASpeed;
  uniform float waveAFrequency;
  uniform float waveAAmplitude;
  uniform vec2 waveBDirection;
  uniform float waveBSpeed;
  uniform float waveBFrequency;
  uniform float waveBAmplitude;
} waterMaterial;
`,wl=`layout(std140) uniform waterMaterialUniforms {
  uniform float time;
  uniform vec3 baseColor;
  uniform float opacity;
  uniform vec3 fresnelColor;
  uniform float fresnelPower;
  uniform float specularIntensity;
  uniform float normalStrength;
  uniform int mappingMode;
  uniform vec2 coordinateScale;
  uniform vec2 coordinateOffset;
  uniform vec2 waveADirection;
  uniform float waveASpeed;
  uniform float waveAFrequency;
  uniform float waveAAmplitude;
  uniform vec2 waveBDirection;
  uniform float waveBSpeed;
  uniform float waveBFrequency;
  uniform float waveBAmplitude;
} waterMaterial;

vec2 water_getDirection(vec2 direction) {
  float directionLength = length(direction);
  return directionLength > 0.0 ? direction / directionLength : vec2(1.0, 0.0);
}

vec2 water_getCoordinates(vec3 position_worldspace, vec3 position_objectspace, vec2 uv) {
  vec2 baseCoordinates = uv;
  if (waterMaterial.mappingMode == 1) {
    baseCoordinates = position_worldspace.xz;
  } else if (waterMaterial.mappingMode == 2) {
    vec3 globeDirection = normalize(position_objectspace);
    float longitude = atan(globeDirection.x, globeDirection.z);
    float latitude = asin(clamp(globeDirection.y, -1.0, 1.0));
    baseCoordinates = vec2(longitude, latitude);
  }
  return baseCoordinates * waterMaterial.coordinateScale + waterMaterial.coordinateOffset;
}

vec2 water_getWaveGradient(
  vec2 coordinates,
  vec2 direction,
  float speed,
  float frequency,
  float amplitude
) {
  vec2 normalizedDirection = water_getDirection(direction);
  float phase = dot(coordinates * frequency, normalizedDirection) + waterMaterial.time * speed;
  return cos(phase) * normalizedDirection * frequency * amplitude;
}

vec3 water_getTangent(vec3 normal_worldspace) {
  vec3 referenceAxis = abs(normal_worldspace.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
  return normalize(cross(referenceAxis, normal_worldspace));
}

vec3 water_getNormal(
  vec3 position_worldspace,
  vec3 position_objectspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  vec2 coordinates = water_getCoordinates(position_worldspace, position_objectspace, uv);
  vec2 gradient =
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveADirection,
      waterMaterial.waveASpeed,
      waterMaterial.waveAFrequency,
      waterMaterial.waveAAmplitude
    ) +
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveBDirection,
      waterMaterial.waveBSpeed,
      waterMaterial.waveBFrequency,
      waterMaterial.waveBAmplitude
    );

  vec3 tangent = water_getTangent(normal_worldspace);
  vec3 bitangent = normalize(cross(normal_worldspace, tangent));
  vec3 perturbation =
    waterMaterial.normalStrength * (gradient.x * tangent + gradient.y * bitangent);

  return normalize(normal_worldspace + perturbation);
}

vec3 water_getSpecularContribution(
  vec3 light_direction,
  vec3 view_direction,
  vec3 normal_worldspace,
  vec3 light_color,
  float fresnel
) {
  vec3 halfway_direction = normalize(light_direction + view_direction);
  float specular =
    pow(max(dot(normal_worldspace, halfway_direction), 0.0), 72.0) *
    waterMaterial.specularIntensity *
    (0.25 + 0.75 * fresnel);

  return waterMaterial.fresnelColor * light_color * specular;
}

vec4 water_getColorMapped(
  vec3 cameraPosition,
  vec3 position_worldspace,
  vec3 position_objectspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  vec3 waterNormal = water_getNormal(
    position_worldspace,
    position_objectspace,
    normalize(normal_worldspace),
    uv
  );
  vec3 viewDirection = normalize(cameraPosition - position_worldspace);
  float fresnel =
    pow(
      1.0 - max(dot(viewDirection, waterNormal), 0.0),
      max(waterMaterial.fresnelPower, 0.0001)
    );
  vec3 surfaceColor = mix(
    waterMaterial.baseColor,
    waterMaterial.fresnelColor,
    clamp(fresnel * 0.6, 0.0, 1.0)
  );

  if (lighting.enabled == 0) {
    return vec4(surfaceColor, waterMaterial.opacity);
  }

  vec3 lightColor = surfaceColor * (0.15 + 0.85 * lighting.ambientColor);

  for (int i = 0; i < lighting.pointLightCount; i++) {
    PointLight pointLight = lighting_getPointLight(i);
    vec3 lightPosition = pointLight.position;
    vec3 lightDirection = normalize(lightPosition - position_worldspace);
    float attenuation =
      getPointLightAttenuation(pointLight, distance(lightPosition, position_worldspace));
    vec3 incidentLight = pointLight.color / attenuation;
    float diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (int i = 0; i < lighting.spotLightCount; i++) {
    SpotLight spotLight = lighting_getSpotLight(i);
    vec3 lightPosition = spotLight.position;
    vec3 lightDirection = normalize(lightPosition - position_worldspace);
    float attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    vec3 incidentLight = spotLight.color / attenuation;
    float diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (int i = 0; i < lighting.directionalLightCount; i++) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(i);
    vec3 lightDirection = normalize(-directionalLight.direction);
    float diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * directionalLight.color * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      directionalLight.color,
      fresnel
    );
  }

  lightColor = mix(lightColor, waterMaterial.fresnelColor, clamp(fresnel, 0.0, 1.0) * 0.35);
  return vec4(lightColor, waterMaterial.opacity);
}

vec4 water_getColor(
  vec3 cameraPosition,
  vec3 position_worldspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  return water_getColorMapped(
    cameraPosition,
    position_worldspace,
    position_worldspace,
    normal_worldspace,
    uv
  );
}
`,Tl=`struct waterMaterialUniforms {
  time: f32,
  baseColor: vec3<f32>,
  opacity: f32,
  fresnelColor: vec3<f32>,
  fresnelPower: f32,
  specularIntensity: f32,
  normalStrength: f32,
  mappingMode: i32,
  coordinateScale: vec2<f32>,
  coordinateOffset: vec2<f32>,
  waveADirection: vec2<f32>,
  waveASpeed: f32,
  waveAFrequency: f32,
  waveAAmplitude: f32,
  waveBDirection: vec2<f32>,
  waveBSpeed: f32,
  waveBFrequency: f32,
  waveBAmplitude: f32,
};

@group(3) @binding(auto) var<uniform> waterMaterial : waterMaterialUniforms;

fn water_getDirection(direction: vec2<f32>) -> vec2<f32> {
  let directionLength = length(direction);
  if (directionLength > 0.0) {
    return direction / directionLength;
  }

  return vec2<f32>(1.0, 0.0);
}

fn water_getCoordinates(
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  uv: vec2<f32>
) -> vec2<f32> {
  var baseCoordinates = uv;
  if (waterMaterial.mappingMode == 1) {
    baseCoordinates = position_worldspace.xz;
  } else if (waterMaterial.mappingMode == 2) {
    let globeDirection = normalize(position_objectspace);
    let longitude = atan2(globeDirection.x, globeDirection.z);
    let latitude = asin(clamp(globeDirection.y, -1.0, 1.0));
    baseCoordinates = vec2<f32>(longitude, latitude);
  }

  return baseCoordinates * waterMaterial.coordinateScale + waterMaterial.coordinateOffset;
}

fn water_getWaveGradient(
  coordinates: vec2<f32>,
  direction: vec2<f32>,
  speed: f32,
  frequency: f32,
  amplitude: f32
) -> vec2<f32> {
  let normalizedDirection = water_getDirection(direction);
  let phase = dot(coordinates * frequency, normalizedDirection) + waterMaterial.time * speed;
  return cos(phase) * normalizedDirection * frequency * amplitude;
}

fn water_getTangent(normal_worldspace: vec3<f32>) -> vec3<f32> {
  var referenceAxis = vec3<f32>(0.0, 0.0, 1.0);
  if (abs(normal_worldspace.z) >= 0.999) {
    referenceAxis = vec3<f32>(0.0, 1.0, 0.0);
  }

  return normalize(cross(referenceAxis, normal_worldspace));
}

fn water_getNormal(
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec3<f32> {
  let coordinates = water_getCoordinates(position_worldspace, position_objectspace, uv);
  let gradient =
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveADirection,
      waterMaterial.waveASpeed,
      waterMaterial.waveAFrequency,
      waterMaterial.waveAAmplitude
    ) +
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveBDirection,
      waterMaterial.waveBSpeed,
      waterMaterial.waveBFrequency,
      waterMaterial.waveBAmplitude
    );
  let tangent = water_getTangent(normal_worldspace);
  let bitangent = normalize(cross(normal_worldspace, tangent));
  let perturbation =
    waterMaterial.normalStrength * (gradient.x * tangent + gradient.y * bitangent);

  return normalize(normal_worldspace + perturbation);
}

fn water_getSpecularContribution(
  light_direction: vec3<f32>,
  view_direction: vec3<f32>,
  normal_worldspace: vec3<f32>,
  light_color: vec3<f32>,
  fresnel: f32
) -> vec3<f32> {
  let halfwayDirection = normalize(light_direction + view_direction);
  let specular =
    pow(max(dot(normal_worldspace, halfwayDirection), 0.0), 72.0) *
    waterMaterial.specularIntensity *
    (0.25 + 0.75 * fresnel);

  return waterMaterial.fresnelColor * light_color * specular;
}

fn water_getColorMapped(
  cameraPosition: vec3<f32>,
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec4<f32> {
  let waterNormal = water_getNormal(
    position_worldspace,
    position_objectspace,
    normalize(normal_worldspace),
    uv
  );
  let viewDirection = normalize(cameraPosition - position_worldspace);
  let fresnel =
    pow(
      1.0 - max(dot(viewDirection, waterNormal), 0.0),
      max(waterMaterial.fresnelPower, 0.0001)
    );
  let surfaceColor = mix(
    waterMaterial.baseColor,
    waterMaterial.fresnelColor,
    clamp(fresnel * 0.6, 0.0, 1.0)
  );

  if (lighting.enabled == 0) {
    return vec4<f32>(surfaceColor, waterMaterial.opacity);
  }

  var lightColor = surfaceColor * (0.15 + 0.85 * lighting.ambientColor);

  for (var i: i32 = 0; i < lighting.pointLightCount; i++) {
    let pointLight = lighting_getPointLight(i);
    let lightPosition = pointLight.position;
    let lightDirection = normalize(lightPosition - position_worldspace);
    let attenuation = getPointLightAttenuation(
      pointLight,
      distance(lightPosition, position_worldspace)
    );
    let incidentLight = pointLight.color / attenuation;
    let diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (var i: i32 = 0; i < lighting.spotLightCount; i++) {
    let spotLight = lighting_getSpotLight(i);
    let lightPosition = spotLight.position;
    let lightDirection = normalize(lightPosition - position_worldspace);
    let attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    let incidentLight = spotLight.color / attenuation;
    let diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
    let directionalLight = lighting_getDirectionalLight(i);
    let lightDirection = normalize(-directionalLight.direction);
    let diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * directionalLight.color * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      directionalLight.color,
      fresnel
    );
  }

  lightColor = mix(
    lightColor,
    waterMaterial.fresnelColor,
    clamp(fresnel, 0.0, 1.0) * 0.35
  );
  return vec4<f32>(lightColor, waterMaterial.opacity);
}

fn water_getColor(
  cameraPosition: vec3<f32>,
  position_worldspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec4<f32> {
  return water_getColorMapped(
    cameraPosition,
    position_worldspace,
    position_worldspace,
    normal_worldspace,
    uv
  );
}
`,El={time:0,baseColor:[.04,.18,.31],opacity:.82,fresnelColor:[.86,.95,1],fresnelPower:5,specularIntensity:1.4,normalStrength:.35,mappingMode:0,coordinateScale:[1,1],coordinateOffset:[0,0],waveADirection:[.9805806756909201,.19611613513818402],waveASpeed:.6,waveAFrequency:4,waveAAmplitude:.08,waveBDirection:[.09950371902099893,.9950371902099893],waveBSpeed:-.45,waveBFrequency:7,waveBAmplitude:.04},Dl={name:`waterMaterial`,firstBindingSlot:0,bindingLayout:[{name:`waterMaterial`,group:3}],dependencies:[pl],source:Tl,vs:Cl,fs:wl,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{time:`f32`,baseColor:`vec3<f32>`,opacity:`f32`,fresnelColor:`vec3<f32>`,fresnelPower:`f32`,specularIntensity:`f32`,normalStrength:`f32`,mappingMode:`i32`,coordinateScale:`vec2<f32>`,coordinateOffset:`vec2<f32>`,waveADirection:`vec2<f32>`,waveASpeed:`f32`,waveAFrequency:`f32`,waveAAmplitude:`f32`,waveBDirection:`vec2<f32>`,waveBSpeed:`f32`,waveBFrequency:`f32`,waveBAmplitude:`f32`},defaultUniforms:El,getUniforms(e,t=El){let{mapping:n,...r}=e||{},i=Ol(t);return r.time!==void 0&&(i.time=r.time),r.opacity!==void 0&&(i.opacity=r.opacity),r.fresnelPower!==void 0&&(i.fresnelPower=r.fresnelPower),r.specularIntensity!==void 0&&(i.specularIntensity=r.specularIntensity),r.normalStrength!==void 0&&(i.normalStrength=r.normalStrength),r.coordinateScale!==void 0&&(i.coordinateScale=[Number(r.coordinateScale[0]),Number(r.coordinateScale[1])]),r.coordinateOffset!==void 0&&(i.coordinateOffset=[Number(r.coordinateOffset[0]),Number(r.coordinateOffset[1])]),r.waveASpeed!==void 0&&(i.waveASpeed=r.waveASpeed),r.waveAFrequency!==void 0&&(i.waveAFrequency=r.waveAFrequency),r.waveAAmplitude!==void 0&&(i.waveAAmplitude=r.waveAAmplitude),r.waveBSpeed!==void 0&&(i.waveBSpeed=r.waveBSpeed),r.waveBFrequency!==void 0&&(i.waveBFrequency=r.waveBFrequency),r.waveBAmplitude!==void 0&&(i.waveBAmplitude=r.waveBAmplitude),r.baseColor&&(i.baseColor=kl(r.baseColor)),r.fresnelColor&&(i.fresnelColor=kl(r.fresnelColor)),r.waveADirection&&(i.waveADirection=Al(r.waveADirection)),r.waveBDirection&&(i.waveBDirection=Al(r.waveBDirection)),n!==void 0&&(i.mappingMode=n===`world`?1:n===`object`?2:0),i}};function Ol(e){return{time:e.time??El.time,baseColor:e.baseColor?kl(e.baseColor):El.baseColor,opacity:e.opacity??El.opacity,fresnelColor:e.fresnelColor?kl(e.fresnelColor):El.fresnelColor,fresnelPower:e.fresnelPower??El.fresnelPower,specularIntensity:e.specularIntensity??El.specularIntensity,normalStrength:e.normalStrength??El.normalStrength,mappingMode:e.mappingMode??El.mappingMode,coordinateScale:e.coordinateScale?[Number(e.coordinateScale[0]),Number(e.coordinateScale[1])]:El.coordinateScale,coordinateOffset:e.coordinateOffset?[Number(e.coordinateOffset[0]),Number(e.coordinateOffset[1])]:El.coordinateOffset,waveADirection:e.waveADirection?Al(e.waveADirection):El.waveADirection,waveASpeed:e.waveASpeed??El.waveASpeed,waveAFrequency:e.waveAFrequency??El.waveAFrequency,waveAAmplitude:e.waveAAmplitude??El.waveAAmplitude,waveBDirection:e.waveBDirection?Al(e.waveBDirection):El.waveBDirection,waveBSpeed:e.waveBSpeed??El.waveBSpeed,waveBFrequency:e.waveBFrequency??El.waveBFrequency,waveBAmplitude:e.waveBAmplitude??El.waveBAmplitude}}function kl(e){let t=[Number(e[0]),Number(e[1]),Number(e[2])];return Math.max(...t.map(e=>Math.abs(e)))>1&&(t[0]/=255,t[1]/=255,t[2]/=255),t}function Al(e){let t=Number(e[0]),n=Number(e[1]),r=Math.hypot(t,n);return r===0?[1,0]:[t/r,n/r]}var jl={name:`riverWaterMaterial`,firstBindingSlot:1,bindingLayout:[{name:`riverWaterMaterial`,group:3}],dependencies:[Dl],source:`struct riverWaterMaterialUniforms {
  enabled: i32,
  flowDirection: vec2<f32>,
  skyZenithColor: vec3<f32>,
  skyUpDirection: vec3<f32>,
};

@group(3) @binding(auto) var<uniform> riverWaterMaterial : riverWaterMaterialUniforms;

fn riverWater_getFlowCoordinates(coordinates: vec2<f32>) -> vec2<f32> {
  let flowDirection = normalize(riverWaterMaterial.flowDirection);
  let crossDirection = vec2<f32>(-flowDirection.y, flowDirection.x);
  return vec2<f32>(dot(coordinates, crossDirection), dot(coordinates, flowDirection));
}

// Smooth spatial variation travels with the surface; it does not flicker per frame.
fn riverWater_noise(coordinates: vec2<f32>) -> f32 {
  let cell = floor(coordinates);
  let fraction = fract(coordinates);
  let blend = fraction * fraction * (vec2<f32>(3.0) - 2.0 * fraction);
  let corners = vec4<f32>(
    dot(cell, vec2<f32>(127.1, 311.7)),
    dot(cell + vec2<f32>(1.0, 0.0), vec2<f32>(127.1, 311.7)),
    dot(cell + vec2<f32>(0.0, 1.0), vec2<f32>(127.1, 311.7)),
    dot(cell + vec2<f32>(1.0, 1.0), vec2<f32>(127.1, 311.7))
  );
  let values = fract(sin(corners) * 43758.5453);
  return mix(mix(values.x, values.y, blend.x), mix(values.z, values.w, blend.x), blend.y);
}

fn riverWater_waveGradient(
  coordinates: vec2<f32>,
  direction: vec2<f32>,
  frequency: f32,
  amplitude: f32,
  speed: f32,
  phaseOffset: f32
) -> vec2<f32> {
  // Advect the irregular wave packets together with their carrier waves.
  let movingCoordinates = coordinates + direction * (waterMaterial.time * speed / frequency);
  let crossDirection = vec2<f32>(-direction.y, direction.x);
  let variationCoordinates = vec2<f32>(dot(movingCoordinates, crossDirection), dot(movingCoordinates, direction)) * frequency * vec2<f32>(0.38, 0.16) + vec2<f32>(phaseOffset * 3.7);
  let variation = riverWater_noise(variationCoordinates);
  let detail = riverWater_noise(variationCoordinates * 2.13 + vec2<f32>(11.3, 7.9));
  let envelope = smoothstep(0.12, 0.88, riverWater_noise(variationCoordinates * 0.71 + vec2<f32>(23.6, 5.2)));
  let phase = dot(movingCoordinates, direction) * frequency + phaseOffset + (variation - 0.5) * 7.0 + (detail - 0.5) * 2.5;
  let attenuation = 1.0 - smoothstep(0.8, 3.0, fwidth(phase));
  return direction * (cos(phase) * frequency * amplitude * attenuation * (0.15 + envelope * 1.2));
}

fn riverWater_getNormal(
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec3<f32> {
  let coordinates = riverWater_getFlowCoordinates(
    water_getCoordinates(position_worldspace, position_objectspace, uv)
  );
  let driftCoordinates = coordinates * 0.7 + vec2<f32>(0.0, waterMaterial.time * 0.22);
  let warp = (vec2<f32>(
    riverWater_noise(driftCoordinates),
    riverWater_noise(driftCoordinates + vec2<f32>(17.2, 9.4))
  ) - vec2<f32>(0.5)) * 0.65;
  let warpedCoordinates = coordinates + warp;
  let gradient =
    riverWater_waveGradient(warpedCoordinates, normalize(vec2<f32>(0.08, 1.0)), 2.1, 0.018, 1.25, 0.0) +
    riverWater_waveGradient(warpedCoordinates, normalize(vec2<f32>(-0.28, 1.0)), 3.7, 0.018, 0.95, 1.7) +
    riverWater_waveGradient(warpedCoordinates, normalize(vec2<f32>(0.47, 1.0)), 5.3, 0.012, 1.7, 3.2) +
    riverWater_waveGradient(warpedCoordinates, normalize(vec2<f32>(-0.68, 1.0)), 7.9, 0.008, 0.76, 0.8) +
    riverWater_waveGradient(warpedCoordinates, normalize(vec2<f32>(0.92, 1.0)), 11.6, 0.004, 2.2, 2.1) +
    riverWater_waveGradient(warpedCoordinates, normalize(vec2<f32>(-1.22, 1.0)), 16.3, 0.002, 1.45, 2.8);
  let tangent = water_getTangent(normalize(normal_worldspace));
  let bitangent = normalize(cross(normalize(normal_worldspace), tangent));
  return normalize(normal_worldspace + waterMaterial.normalStrength * 3.2 *
    (gradient.x * tangent + gradient.y * bitangent));
}

// Camera-independent sky approximation; missing scene reflections retain this material color.
fn riverWater_getSkyColor(reflectionDirection: vec3<f32>) -> vec3<f32> {
  let elevation = clamp(dot(normalize(reflectionDirection), normalize(riverWaterMaterial.skyUpDirection)), 0.0, 1.0);
  let horizonColor = mix(waterMaterial.fresnelColor, riverWaterMaterial.skyZenithColor, 0.32);
  return mix(horizonColor, riverWaterMaterial.skyZenithColor, smoothstep(0.0, 1.0, elevation));
}

fn riverWater_getColorMapped(
  cameraPosition: vec3<f32>,
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec4<f32> {
  let waterNormal = riverWater_getNormal(
    position_worldspace, position_objectspace, normal_worldspace, uv
  );
  let viewDirection = normalize(cameraPosition - position_worldspace);
  let fresnel = pow(1.0 - max(dot(viewDirection, waterNormal), 0.0), 3.2);
  let deepColor = waterMaterial.baseColor * vec3<f32>(0.52, 0.74, 0.9);
  let reflectedColor = riverWater_getSkyColor(reflect(-viewDirection, waterNormal));
  let surfaceColor = mix(deepColor, reflectedColor, clamp(fresnel * 0.78, 0.0, 0.78));
  var color = surfaceColor * (0.32 + 0.68 * lighting.ambientColor);

  for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
    let directionalLight = lighting_getDirectionalLight(i);
    let lightDirection = normalize(-directionalLight.direction);
    let halfwayDirection = normalize(lightDirection + viewDirection);
    let diffuse = max(dot(waterNormal, lightDirection), 0.0);
    let specular = pow(max(dot(waterNormal, halfwayDirection), 0.0), 64.0);
    let brokenSpecular = specular * (0.25 + 0.75 * fresnel);
    color += surfaceColor * directionalLight.color * diffuse * 0.38;
    color += vec3<f32>(0.72, 0.88, 0.94) * directionalLight.color * brokenSpecular * 2.1;
  }

  color = mix(color, reflectedColor, clamp(fresnel * 0.3, 0.0, 0.3));
  return vec4<f32>(color, waterMaterial.opacity);
}
`,fs:`layout(std140) uniform riverWaterMaterialUniforms {
  uniform int enabled;
  uniform vec2 flowDirection;
  uniform vec3 skyZenithColor;
  uniform vec3 skyUpDirection;
} riverWaterMaterial;

vec2 riverWater_getFlowCoordinates(vec2 coordinates) {
  vec2 flowDirection = normalize(riverWaterMaterial.flowDirection);
  vec2 crossDirection = vec2(-flowDirection.y, flowDirection.x);
  return vec2(dot(coordinates, crossDirection), dot(coordinates, flowDirection));
}

// Smooth spatial variation travels with the surface; it does not flicker per frame.
float riverWater_noise(vec2 coordinates) {
  vec2 cell = floor(coordinates);
  vec2 fraction = fract(coordinates);
  vec2 blend = fraction * fraction * (vec2(3.0) - 2.0 * fraction);
  vec4 corners = vec4(
    dot(cell, vec2(127.1, 311.7)),
    dot(cell + vec2(1.0, 0.0), vec2(127.1, 311.7)),
    dot(cell + vec2(0.0, 1.0), vec2(127.1, 311.7)),
    dot(cell + vec2(1.0, 1.0), vec2(127.1, 311.7))
  );
  vec4 values = fract(sin(corners) * 43758.5453);
  return mix(mix(values.x, values.y, blend.x), mix(values.z, values.w, blend.x), blend.y);
}

vec2 riverWater_waveGradient(
  vec2 coordinates, vec2 direction, float frequency, float amplitude, float speed, float phaseOffset
) {
  // Advect the irregular wave packets together with their carrier waves.
  vec2 movingCoordinates = coordinates + direction * (waterMaterial.time * speed / frequency);
  vec2 crossDirection = vec2(-direction.y, direction.x);
  vec2 variationCoordinates = vec2(dot(movingCoordinates, crossDirection), dot(movingCoordinates, direction)) * frequency * vec2(0.38, 0.16) + vec2(phaseOffset * 3.7);
  float variation = riverWater_noise(variationCoordinates);
  float detail = riverWater_noise(variationCoordinates * 2.13 + vec2(11.3, 7.9));
  float envelope = smoothstep(0.12, 0.88, riverWater_noise(variationCoordinates * 0.71 + vec2(23.6, 5.2)));
  float phase = dot(movingCoordinates, direction) * frequency + phaseOffset + (variation - 0.5) * 7.0 + (detail - 0.5) * 2.5;
  float attenuation = 1.0 - smoothstep(0.8, 3.0, fwidth(phase));
  return direction * (cos(phase) * frequency * amplitude * attenuation * (0.15 + envelope * 1.2));
}

vec3 riverWater_getNormal(
  vec3 position_worldspace,
  vec3 position_objectspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  vec2 coordinates = riverWater_getFlowCoordinates(
    water_getCoordinates(position_worldspace, position_objectspace, uv)
  );
  vec2 driftCoordinates = coordinates * 0.7 + vec2(0.0, waterMaterial.time * 0.22);
  vec2 warp = (vec2(
    riverWater_noise(driftCoordinates),
    riverWater_noise(driftCoordinates + vec2(17.2, 9.4))
  ) - vec2(0.5)) * 0.65;
  vec2 warpedCoordinates = coordinates + warp;
  vec2 gradient =
    riverWater_waveGradient(warpedCoordinates, normalize(vec2(0.08, 1.0)), 2.1, 0.018, 1.25, 0.0) +
    riverWater_waveGradient(warpedCoordinates, normalize(vec2(-0.28, 1.0)), 3.7, 0.018, 0.95, 1.7) +
    riverWater_waveGradient(warpedCoordinates, normalize(vec2(0.47, 1.0)), 5.3, 0.012, 1.7, 3.2) +
    riverWater_waveGradient(warpedCoordinates, normalize(vec2(-0.68, 1.0)), 7.9, 0.008, 0.76, 0.8) +
    riverWater_waveGradient(warpedCoordinates, normalize(vec2(0.92, 1.0)), 11.6, 0.004, 2.2, 2.1) +
    riverWater_waveGradient(warpedCoordinates, normalize(vec2(-1.22, 1.0)), 16.3, 0.002, 1.45, 2.8);
  vec3 tangent = water_getTangent(normalize(normal_worldspace));
  vec3 bitangent = normalize(cross(normalize(normal_worldspace), tangent));
  return normalize(normal_worldspace + waterMaterial.normalStrength * 3.2 *
    (gradient.x * tangent + gradient.y * bitangent));
}

// Camera-independent sky approximation; missing scene reflections retain this material color.
vec3 riverWater_getSkyColor(vec3 reflectionDirection) {
  float elevation = clamp(dot(normalize(reflectionDirection), normalize(riverWaterMaterial.skyUpDirection)), 0.0, 1.0);
  vec3 horizonColor = mix(waterMaterial.fresnelColor, riverWaterMaterial.skyZenithColor, 0.32);
  return mix(horizonColor, riverWaterMaterial.skyZenithColor, smoothstep(0.0, 1.0, elevation));
}

vec4 riverWater_getColorMapped(
  vec3 cameraPosition,
  vec3 position_worldspace,
  vec3 position_objectspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  vec3 waterNormal = riverWater_getNormal(
    position_worldspace, position_objectspace, normal_worldspace, uv
  );
  vec3 viewDirection = normalize(cameraPosition - position_worldspace);
  float fresnel = pow(1.0 - max(dot(viewDirection, waterNormal), 0.0), 3.2);
  vec3 deepColor = waterMaterial.baseColor * vec3(0.52, 0.74, 0.9);
  vec3 reflectedColor = riverWater_getSkyColor(reflect(-viewDirection, waterNormal));
  vec3 surfaceColor = mix(deepColor, reflectedColor, clamp(fresnel * 0.78, 0.0, 0.78));
  vec3 color = surfaceColor * (0.32 + 0.68 * lighting.ambientColor);

  for (int i = 0; i < lighting.directionalLightCount; i++) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(i);
    vec3 lightDirection = normalize(-directionalLight.direction);
    vec3 halfwayDirection = normalize(lightDirection + viewDirection);
    float diffuse = max(dot(waterNormal, lightDirection), 0.0);
    float specular = pow(max(dot(waterNormal, halfwayDirection), 0.0), 64.0);
    float brokenSpecular = specular * (0.25 + 0.75 * fresnel);
    color += surfaceColor * directionalLight.color * diffuse * 0.38;
    color += vec3(0.72, 0.88, 0.94) * directionalLight.color * brokenSpecular * 2.1;
  }

  color = mix(color, reflectedColor, clamp(fresnel * 0.3, 0.0, 0.3));
  return vec4(color, waterMaterial.opacity);
}
`,uniformTypes:{enabled:`i32`,flowDirection:`vec2<f32>`,skyZenithColor:`vec3<f32>`,skyUpDirection:`vec3<f32>`},defaultUniforms:{enabled:0,flowDirection:[0,1],skyZenithColor:[.22,.48,.57],skyUpDirection:[0,0,1]},getUniforms(e={},t={}){return{enabled:e.enabled??t.enabled??0,flowDirection:e.flowDirection??t.flowDirection??[0,1],skyZenithColor:e.skyZenithColor??t.skyZenithColor??[.22,.48,.57],skyUpDirection:e.skyUpDirection??t.skyUpDirection??[0,0,1]}}},Ml={name:`valueNoise`,fs:`
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
`},Nl={name:`heightFog`,dependencies:[{name:`heightFogFunctions`,dependencies:[Ml],fs:`
float heightFog_getRayTransmittance(float rayLength, float cameraHeight, float fragmentHeight, float density, float baseHeight, float heightFalloff) {
  float startHeight = (cameraHeight - baseHeight) * max(heightFalloff, 0.0);
  float endHeight = (fragmentHeight - baseHeight) * max(heightFalloff, 0.0);
  float lowerHeight = min(startHeight, endHeight);
  float upperHeight = max(startHeight, endHeight);
  float averageDensity = 1.0;
  if (upperHeight > 0.0) {
    float heightSpan = upperHeight - lowerHeight;
    if (heightSpan < 0.001) {
      averageDensity = exp(-max((startHeight + endHeight) * 0.5, 0.0));
    } else if (lowerHeight >= 0.0) {
      averageDensity = (exp(-lowerHeight) - exp(-upperHeight)) / heightSpan;
    } else {
      averageDensity = (-lowerHeight + 1.0 - exp(-upperHeight)) / heightSpan;
    }
  }
  return exp(-max(density, 0.0) * rayLength * averageDensity);
}
float heightFog_hash(vec2 cell) { return valueNoise_hash(cell); }
float heightFog_noise(vec2 position) { return valueNoise_noise(position); }
// Integrate drifting density along the ray so wisps occupy space rather than coat surfaces.
float heightFog_getSpatialTransmittance(vec3 camera, vec3 position, vec3 upDirection,
    float density, float baseHeight, float heightFalloff, float variation, float wispScale,
    float time, vec3 velocity, float evolutionSpeed) {
  if (density <= 0.0) return 1.0;
  float rayLength = distance(camera, position);
  if (variation <= 0.0) return heightFog_getRayTransmittance(rayLength, dot(camera, upDirection),
    dot(position, upDirection), density, baseHeight, heightFalloff);
  vec3 reference = abs(upDirection.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
  vec3 horizontal = normalize(cross(reference, upDirection));
  vec3 forward = cross(upDirection, horizontal);
  float transmittance = 1.0;
  for (int sampleIndex = 0; sampleIndex < 12; sampleIndex++) {
    float fraction = float(sampleIndex) / 12.0;
    vec3 start = mix(camera, position, fraction);
    vec3 end = mix(camera, position, fraction + 1.0 / 12.0);
    vec3 samplePosition = (start + end) * 0.5 - velocity * time;
    vec2 coordinate = vec2(dot(samplePosition, horizontal), dot(samplePosition, forward)) / max(wispScale, 1.0);
    coordinate.y = coordinate.y * 1.8 + dot(samplePosition, upDirection) / max(wispScale, 1.0);
    float warp = heightFog_noise(coordinate * 0.45 + vec2(8.3, 2.7) + time * evolutionSpeed * vec2(1.0, 0.37));
    float broad = heightFog_noise(coordinate + vec2(warp * 2.0, warp * 0.8));
    float detail = heightFog_noise(mat2(0.8, 0.6, -0.6, 0.8) * coordinate * 2.17 + vec2(17.1, 9.2) + broad * 0.7);
    float modulation = mix(1.0, 1.8 * smoothstep(0.15, 0.85, broad * 0.7 + detail * 0.3), clamp(variation, 0.0, 1.0));
    transmittance *= heightFog_getRayTransmittance(rayLength / 12.0, dot(start, upDirection),
      dot(end, upDirection), density * modulation, baseHeight, heightFalloff);
  }
  return transmittance;
}

`,source:`
fn heightFog_getRayTransmittance(rayLength: f32, cameraHeight: f32, fragmentHeight: f32, density: f32, baseHeight: f32, heightFalloff: f32) -> f32 {
  let startHeight = (cameraHeight - baseHeight) * max(heightFalloff, 0.0);
  let endHeight = (fragmentHeight - baseHeight) * max(heightFalloff, 0.0);
  let lowerHeight = min(startHeight, endHeight);
  let upperHeight = max(startHeight, endHeight);
  var averageDensity = 1.0;
  if (upperHeight > 0.0) {
    let heightSpan = upperHeight - lowerHeight;
    if (heightSpan < 0.001) {
      averageDensity = exp(-max((startHeight + endHeight) * 0.5, 0.0));
    } else if (lowerHeight >= 0.0) {
      averageDensity = (exp(-lowerHeight) - exp(-upperHeight)) / heightSpan;
    } else {
      averageDensity = (-lowerHeight + 1.0 - exp(-upperHeight)) / heightSpan;
    }
  }
  return exp(-max(density, 0.0) * rayLength * averageDensity);
}
fn heightFog_hash(cell: vec2f) -> f32 { return valueNoise_hash(cell); }
fn heightFog_noise(position: vec2f) -> f32 { return valueNoise_noise(position); }
// Integrate drifting density along the ray so wisps occupy space rather than coat surfaces.
fn heightFog_getSpatialTransmittance(camera: vec3f, position: vec3f, upDirection: vec3f,
    density: f32, baseHeight: f32, heightFalloff: f32, variation: f32, wispScale: f32,
    time: f32, velocity: vec3f, evolutionSpeed: f32) -> f32 {
  if (density <= 0.0) { return 1.0; }
  let rayLength = distance(camera, position);
  if (variation <= 0.0) { return heightFog_getRayTransmittance(rayLength, dot(camera, upDirection),
    dot(position, upDirection), density, baseHeight, heightFalloff); }
  let reference = select(vec3f(0.0, 1.0, 0.0), vec3f(0.0, 0.0, 1.0), abs(upDirection.z) < 0.9);
  let horizontal = normalize(cross(reference, upDirection));
  let forward = cross(upDirection, horizontal);
  var transmittance = 1.0;
  for (var sampleIndex = 0; sampleIndex < 12; sampleIndex++) {
    let fraction = f32(sampleIndex) / 12.0;
    let start = mix(camera, position, fraction);
    let end = mix(camera, position, fraction + 1.0 / 12.0);
    let samplePosition = (start + end) * 0.5 - velocity * time;
    var coordinate = vec2f(dot(samplePosition, horizontal), dot(samplePosition, forward)) / max(wispScale, 1.0);
    coordinate.y = coordinate.y * 1.8 + dot(samplePosition, upDirection) / max(wispScale, 1.0);
    let warp = heightFog_noise(coordinate * 0.45 + vec2f(8.3, 2.7) + time * evolutionSpeed * vec2f(1.0, 0.37));
    let broad = heightFog_noise(coordinate + vec2f(warp * 2.0, warp * 0.8));
    let detail = heightFog_noise(mat2x2f(vec2f(0.8, 0.6), vec2f(-0.6, 0.8)) * coordinate * 2.17 + vec2f(17.1, 9.2) + vec2f(broad * 0.7));
    let modulation = mix(1.0, 1.8 * smoothstep(0.15, 0.85, broad * 0.7 + detail * 0.3), clamp(variation, 0.0, 1.0));
    transmittance *= heightFog_getRayTransmittance(rayLength / 12.0, dot(start, upDirection),
      dot(end, upDirection), density * modulation, baseHeight, heightFalloff);
  }
  return transmittance;
}

`}],bindingLayout:[{name:`heightFog`,group:3}],uniformTypes:{color:`vec3<f32>`,density:`f32`,baseHeight:`f32`,heightFalloff:`f32`,variation:`f32`,wispScale:`f32`,velocity:`vec3<f32>`,time:`f32`,evolutionSpeed:`f32`},defaultUniforms:{color:[.65,.72,.78],density:0,baseHeight:0,heightFalloff:.01,variation:0,wispScale:160,velocity:[0,0,0],time:0,evolutionSpeed:0},getUniforms(e={}){return e},fs:`
layout(std140) uniform heightFogUniforms {
  vec3 color;
  float density;
  float baseHeight;
  float heightFalloff;
  float variation;
  float wispScale;
  vec3 velocity;
  float time;
  float evolutionSpeed;
} heightFog;
float heightFog_getTransmittance(vec3 position, vec3 cameraPosition) {
  return heightFog_getSpatialTransmittance(cameraPosition, position, vec3(0.0, 0.0, 1.0),
    heightFog.density, heightFog.baseHeight, heightFog.heightFalloff, heightFog.variation, heightFog.wispScale, heightFog.time, heightFog.velocity, heightFog.evolutionSpeed);
}
vec4 heightFog_getColor(vec4 color, vec3 position, vec3 cameraPosition) {
  return vec4(mix(heightFog.color, color.rgb, heightFog_getTransmittance(position, cameraPosition)), color.a);
}
`,source:`
struct heightFogUniforms {
  color: vec3<f32>,
  density: f32,
  baseHeight: f32,
  heightFalloff: f32,
  variation: f32,
  wispScale: f32,
  velocity: vec3<f32>,
  time: f32,
  evolutionSpeed: f32,
};
@group(3) @binding(auto) var<uniform> heightFog: heightFogUniforms;
fn heightFog_getTransmittance(position: vec3<f32>, cameraPosition: vec3<f32>) -> f32 {
  return heightFog_getSpatialTransmittance(cameraPosition, position, vec3<f32>(0.0, 0.0, 1.0),
    heightFog.density, heightFog.baseHeight, heightFog.heightFalloff, heightFog.variation, heightFog.wispScale, heightFog.time, heightFog.velocity, heightFog.evolutionSpeed);
}
fn heightFog_getColor(color: vec4<f32>, position: vec3<f32>, cameraPosition: vec3<f32>) -> vec4<f32> {
  return vec4<f32>(mix(heightFog.color, color.rgb, heightFog_getTransmittance(position, cameraPosition)), color.a);
}
`},Pl={wetness:0,snow:0,puddles:.8,scale:20,snowColor:[.9,.94,.98],skyColor:[.48,.6,.72]},Fl={name:`surfaceWeather`,dependencies:[Ml],uniformTypes:{wetness:`f32`,snow:`f32`,puddles:`f32`,scale:`f32`,snowColor:`vec3<f32>`,skyColor:`vec3<f32>`},defaultUniforms:Pl,getUniforms(e={},t=Pl){return{...Pl,...t,...e}},fs:`
layout(std140) uniform surfaceWeatherUniforms {
  float wetness;
  float snow;
  float puddles;
  float scale;
  vec3 snowColor;
  vec3 skyColor;
} surfaceWeather;

float surfaceWeather_getSnow(vec3 position, vec3 normal, float exposure) {
  if (surfaceWeather.snow <= 0.0 || exposure <= 0.0) return 0.0;
  float slope = smoothstep(0.4, 0.85, normalize(normal).z);
  float variation = valueNoise_noise(position.xy / max(surfaceWeather.scale, 0.01));
  float coverage = smoothstep(variation * 0.65, variation * 0.65 + 0.35, surfaceWeather.snow);
  return coverage * slope * clamp(exposure, 0.0, 1.0);
}
float surfaceWeather_getWetness(vec3 position, vec3 normal, float exposure) {
  if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) return 0.0;
  return clamp(surfaceWeather.wetness, 0.0, 1.0) * clamp(exposure, 0.0, 1.0) * (1.0 - surfaceWeather_getSnow(position, normal, exposure));
}
float surfaceWeather_getPuddle(vec3 position, vec3 normal, float exposure) {
  if (surfaceWeather.wetness <= 0.0 || surfaceWeather.puddles <= 0.0 || exposure <= 0.0) return 0.0;
  float variation = valueNoise_noise(position.xy / max(surfaceWeather.scale, 0.01) + vec2(8.3, 2.7));
  return surfaceWeather_getWetness(position, normal, exposure) * clamp(surfaceWeather.puddles, 0.0, 1.0) *
    smoothstep(0.8, 0.98, normalize(normal).z) * smoothstep(0.38, 0.7, variation);
}
vec3 surfaceWeather_getAlbedo(vec3 albedo, vec3 position, vec3 normal, float exposure) {
  if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) return albedo;
  float wetness = surfaceWeather_getWetness(position, normal, exposure);
  float snow = surfaceWeather_getSnow(position, normal, exposure);
  return mix(albedo * (1.0 - wetness * 0.38), surfaceWeather.snowColor, snow);
}
float surfaceWeather_getRoughness(float roughness, vec3 position, vec3 normal, float exposure) {
  if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) return roughness;
  float wetness = surfaceWeather_getWetness(position, normal, exposure);
  float puddle = surfaceWeather_getPuddle(position, normal, exposure);
  float snow = surfaceWeather_getSnow(position, normal, exposure);
  return mix(mix(roughness, 0.16, max(puddle, wetness * 0.6)), 0.95, snow);
}
// Approximate dielectric highlights and sky tint; callers may use the albedo/roughness helpers with PBR instead.
vec3 surfaceWeather_getReflection(vec3 position, vec3 normal, vec3 camera, vec3 lightDirection, vec3 lightColor, float exposure) {
  if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) return vec3(0.0);
  vec3 surfaceNormal = normalize(normal);
  vec3 view = normalize(camera - position);
  vec3 halfway = normalize(view + normalize(lightDirection));
  float wetness = surfaceWeather_getWetness(position, normal, exposure);
  float puddle = surfaceWeather_getPuddle(position, normal, exposure);
  float facing = max(dot(surfaceNormal, view), 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);
  float highlight = pow(max(dot(surfaceNormal, halfway), 0.0), mix(36.0, 160.0, puddle)) * max(dot(surfaceNormal, normalize(lightDirection)), 0.0);
  return wetness * (surfaceWeather.skyColor * fresnel * (0.15 + puddle * 0.85) + lightColor * highlight * 0.6);
}
`,source:`
struct surfaceWeatherUniforms {
  wetness: f32,
  snow: f32,
  puddles: f32,
  scale: f32,
  snowColor: vec3f,
  skyColor: vec3f,
};
@group(3) @binding(auto) var<uniform> surfaceWeather: surfaceWeatherUniforms;

fn surfaceWeather_getSnow(position: vec3f,
  normal: vec3f,
  exposure: f32) -> f32 {
  if (surfaceWeather.snow <= 0.0 || exposure <= 0.0) { return 0.0; }
  var slope: f32 = smoothstep(0.4, 0.85, normalize(normal).z);
  var variation: f32 = valueNoise_noise(position.xy / max(surfaceWeather.scale, 0.01));
  var coverage: f32 = smoothstep(variation * 0.65, variation * 0.65 + 0.35, surfaceWeather.snow);
  return coverage * slope * clamp(exposure, 0.0, 1.0);
}
fn surfaceWeather_getWetness(position: vec3f,
  normal: vec3f,
  exposure: f32) -> f32 {
  if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) { return 0.0; }
  return clamp(surfaceWeather.wetness, 0.0, 1.0) * clamp(exposure, 0.0, 1.0) * (1.0 - surfaceWeather_getSnow(position, normal, exposure));
}
fn surfaceWeather_getPuddle(position: vec3f,
  normal: vec3f,
  exposure: f32) -> f32 {
  if (surfaceWeather.wetness <= 0.0 || surfaceWeather.puddles <= 0.0 || exposure <= 0.0) { return 0.0; }
  var variation: f32 = valueNoise_noise(position.xy / max(surfaceWeather.scale, 0.01) + vec2f(8.3, 2.7));
  return surfaceWeather_getWetness(position, normal, exposure) * clamp(surfaceWeather.puddles, 0.0, 1.0) *
    smoothstep(0.8, 0.98, normalize(normal).z) * smoothstep(0.38, 0.7, variation);
}
fn surfaceWeather_getAlbedo(albedo: vec3f,
  position: vec3f,
  normal: vec3f,
  exposure: f32) -> vec3f {
  if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) { return albedo; }
  var wetness: f32 = surfaceWeather_getWetness(position, normal, exposure);
  var snow: f32 = surfaceWeather_getSnow(position, normal, exposure);
  return mix(albedo * (1.0 - wetness * 0.38), surfaceWeather.snowColor, snow);
}
fn surfaceWeather_getRoughness(roughness: f32,
  position: vec3f,
  normal: vec3f,
  exposure: f32) -> f32 {
  if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) { return roughness; }
  var wetness: f32 = surfaceWeather_getWetness(position, normal, exposure);
  var puddle: f32 = surfaceWeather_getPuddle(position, normal, exposure);
  var snow: f32 = surfaceWeather_getSnow(position, normal, exposure);
  return mix(mix(roughness, 0.16, max(puddle, wetness * 0.6)), 0.95, snow);
}
// Approximate dielectric highlights and sky tint; callers may use the albedo/roughness helpers with PBR instead.
fn surfaceWeather_getReflection(position: vec3f,
  normal: vec3f,
  camera: vec3f,
  lightDirection: vec3f,
  lightColor: vec3f,
  exposure: f32) -> vec3f {
  if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) { return vec3f(0.0); }
  var surfaceNormal: vec3f = normalize(normal);
  var view: vec3f = normalize(camera - position);
  var halfway: vec3f = normalize(view + normalize(lightDirection));
  var wetness: f32 = surfaceWeather_getWetness(position, normal, exposure);
  var puddle: f32 = surfaceWeather_getPuddle(position, normal, exposure);
  var facing: f32 = max(dot(surfaceNormal, view), 0.0);
  var fresnel: f32 = 0.02 + 0.98 * pow(1.0 - facing, 5.0);
  var highlight: f32 = pow(max(dot(surfaceNormal, halfway), 0.0), mix(36.0, 160.0, puddle)) * max(dot(surfaceNormal, normalize(lightDirection)), 0.0);
  return wetness * (surfaceWeather.skyColor * fresnel * (0.15 + puddle * 0.85) + lightColor * highlight * 0.6);
}
`},Il=`LUMA_WEBGPU_ADAPTER_UNAVAILABLE`,Ll=class{get pageLoaded(){return Vl()}},Rl=s()&&typeof document<`u`,zl=()=>Rl&&document.readyState===`complete`,Bl=null;function Vl(){return Bl||=zl()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),Bl}var Hl=`set luma.log.level=1 (or higher) to trace rendering`,Ul="No matching device found. Ensure `@luma.gl/core/webgl` and/or `@luma.gl/core/webgpu` modules are imported.",Wl=class e{static defaultProps={...f,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=p;log=F;VERSION=`10.0.0-beta.2`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw F.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),F.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);F.error(`This version of luma.gl has already been initialized`)()}F.log(1,`${this.VERSION} - ${Hl}`)(),globalThis.luma=this}async createDevice(t={}){let n={...e.defaultProps,...t};try{let e=this.selectAdapter(n.type,n.adapters);if(!e)throw Error(Ul);return n.waitForPageLoad&&await e.pageLoaded,await e.create(n).catch(t=>{if(n.type===`best-available`&&e.type===`webgpu`&&t?.code===`LUMA_WEBGPU_ADAPTER_UNAVAILABLE`){let e=this.selectAdapter(`webgl`,n.adapters);if(e?.isSupported())return e.create(n)}throw t})}catch(e){throw n.debug&&Gl(e),e}}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(Ul);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(e=!0,t=[]){let n=this._getAdapterMap(t).get(`webgl`);n||F.warn(`enforceWebGL2: webgl adapter not found`)(),n?.enforceWebGL2?.(e)}setDefaultDeviceProps(t){Object.assign(e.defaultProps,t)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(e,t=[]){return e instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue?`webgpu`:e===null?`null`:(e instanceof WebGLRenderingContext?F.warn(`WebGL1 is not supported`,e)():F.warn(`Unknown handle type`,e)(),null)}};function Gl(e){typeof alert>`u`||alert(e instanceof Error?e.message:String(e))}var Kl=new Wl;function ql(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Jl(e){return Array.isArray(e)?e.length===0||typeof e[0]==`number`:ql(e)}var Yl=class{layout;constructor(e){this.layout=e}has(e){return!!this.layout.fields[e]}get(e){let t=this.layout.fields[e];return t?{offset:t.offset,size:t.size}:void 0}getFlatUniformValues(e){let t={};for(let[n,r]of Object.entries(e)){let e=this.layout.uniformTypes[n];e?this._flattenCompositeValue(t,n,e,r):this.layout.fields[n]&&(t[n]=r)}return t}getData(e){let t=Be(this.layout.byteLength);new Uint8Array(t,0,this.layout.byteLength).fill(0);let n={i32:new Int32Array(t),u32:new Uint32Array(t),f32:new Float32Array(t),f16:new Uint16Array(t)},r=this.getFlatUniformValues(e);for(let[e,t]of Object.entries(r))this._writeLeafValue(n,e,t);return new Uint8Array(t,0,this.layout.byteLength)}_flattenCompositeValue(e,t,n,r){if(r!==void 0){if(typeof n==`string`||this.layout.fields[t]){e[t]=r;return}if(Array.isArray(n)){let i=n[0],a=n[1];if(Array.isArray(i))throw Error(`Nested arrays are not supported for ${t}`);if(typeof i==`string`&&Jl(r)){this._flattenPackedArray(e,t,i,a,r);return}if(!Array.isArray(r)){F.warn(`Unsupported uniform array value for ${t}:`,r)();return}for(let n=0;n<Math.min(r.length,a);n++){let a=r[n];a!==void 0&&this._flattenCompositeValue(e,`${t}[${n}]`,i,a)}return}if(Ce(n)&&Xl(r)){for(let[i,a]of Object.entries(r)){if(a===void 0)continue;let r=`${t}.${i}`;this._flattenCompositeValue(e,r,n[i],a)}return}F.warn(`Unsupported uniform value for ${t}:`,r)()}}_flattenPackedArray(e,t,n,r,i){let a=i,o=Te(n,this.layout.layout).components;for(let n=0;n<r;n++){let r=n*o;if(r>=a.length)break;o===1?e[`${t}[${n}]`]=Number(a[r]):e[`${t}[${n}]`]=Zl(i,r,r+o)}}_writeLeafValue(e,t,n){let r=this.layout.fields[t];if(!r){F.warn(`Uniform ${t} not found in layout`)();return}let{type:i,components:a,columns:o,rows:s,offset:c,columnStride:l}=r,u=e[i];if(a===1){u[c]=Number(n);return}let d=n;if(o===1){for(let e=0;e<a;e++)u[c+e]=Number(d[e]??0);return}let f=0;for(let e=0;e<o;e++){let t=c+e*l;for(let e=0;e<s;e++)u[t+e]=Number(d[f++]??0)}}};function Xl(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function Zl(e,t,n){return Array.prototype.slice.call(e,t,n)}var Ql=128;function $l(e,t,n=16){if(e===t)return!0;let r=e,i=t;if(!Jl(r)||!Jl(i)||r.length!==i.length)return!1;let a=Math.min(n,Ql);if(r.length>a)return!1;for(let e=0;e<r.length;++e)if(i[e]!==r[e])return!1;return!0}function eu(e){return Jl(e)?e.slice():e}var tu=class{name;uniforms={};modifiedUniforms={};modified=!0;bindingLayout={};needsRedraw=`initialized`;constructor(e){if(this.name=e?.name||`unnamed`,e?.name&&e?.shaderLayout){let t=e?.shaderLayout.bindings?.find(t=>t.type===`uniform`&&t.name===e?.name);if(!t)throw Error(e?.name);let n=t;for(let e of n.uniforms||[])this.bindingLayout[e.name]=e}}setUniforms(e){for(let[t,n]of Object.entries(e))this._setUniform(t,n)&&!this.needsRedraw&&this.setNeedsRedraw(`${this.name}.${t}=${n}`)}setNeedsRedraw(e){this.needsRedraw=this.needsRedraw||e}getAllUniforms(){return this.modifiedUniforms={},this.needsRedraw=!1,this.uniforms||{}}_setUniform(e,t){return $l(this.uniforms[e],t)?!1:(this.uniforms[e]=eu(t),this.modifiedUniforms[e]=!0,this.modified=!0,!0)}},nu=1024,ru=class{device;uniformBlocks=new Map;shaderBlockLayouts=new Map;shaderBlockWriters=new Map;uniformBuffers=new Map;constructor(e,t){this.device=e;for(let[n,r]of Object.entries(t)){let t=n,i=we(r.uniformTypes??{},{layout:r.layout??iu(e)}),a=new Yl(i);this.shaderBlockLayouts.set(t,i),this.shaderBlockWriters.set(t,a);let o=new tu({name:n});o.setUniforms(a.getFlatUniformValues(r.defaultUniforms||{})),this.uniformBlocks.set(t,o)}}destroy(){for(let e of this.uniformBuffers.values())e.destroy()}setUniforms(e,t){for(let[t,n]of Object.entries(e)){let e=t,r=this.shaderBlockWriters.get(e)?.getFlatUniformValues(n||{});this.uniformBlocks.get(e)?.setUniforms(r||{})}this.updateUniformBuffers(t)}getUniformBufferByteLength(e){let t=this.shaderBlockLayouts.get(e)?.byteLength||0;return Math.max(t,nu)}getUniformBufferData(e){let t=this.uniformBlocks.get(e)?.getAllUniforms()||{};return this.shaderBlockWriters.get(e)?.getData(t)||new Uint8Array}createUniformBuffer(e,t){t&&this.setUniforms(t);let n=this.getUniformBufferByteLength(e),r=this.device.createBuffer({usage:I.UNIFORM|I.COPY_DST,byteLength:n}),i=this.getUniformBufferData(e);return r.write(i),r}getManagedUniformBuffer(e){if(!this.uniformBuffers.get(e)){let t=this.getUniformBufferByteLength(e),n=this.device.createBuffer({usage:I.UNIFORM|I.COPY_DST,byteLength:t});this.uniformBuffers.set(e,n)}return this.uniformBuffers.get(e)}updateUniformBuffers(e){let t=!1;for(let n of this.uniformBlocks.keys()){let r=this.updateUniformBuffer(n,e);t||=r}return t&&F.log(3,`UniformStore.updateUniformBuffers(): ${t}`)(),t}updateUniformBuffer(e,t){let n=this.uniformBlocks.get(e),r=this.uniformBuffers.get(e),i=!1;if(r&&n?.needsRedraw){i||=n.needsRedraw;let a=this.getUniformBufferData(e);if(r=this.uniformBuffers.get(e),r&&(t?this.device.writeBufferViaCommandEncoder(t,r,a):r.write(a)),F.level>=4){let t=this.uniformBlocks.get(e)?.getAllUniforms();F.log(4,`Writing to uniform buffer ${String(e)}`,a,t)()}}return i}};function iu(e){return e.type===`webgpu`?`wgsl-uniform`:`std140`}function au(e){let t=Ge(e);return t!==void 0&&t!==`BigInt64Array`&&t!==`BigUint64Array`}var ou=0,su=class{constructor(e){this.userData={},this.id=e.id||`geometry-${++ou}`,this.topology=e.topology,this.attributes={};let t=e.indices?cu(e.indices):void 0;for(let[n,r]of Object.entries(e.attributes||{})){let e=cu(r);if((n===`POSITION`||n===`positions`)&&(e.size||=3),n===`indices`){if(t)throw Error(`Geometry has multiple index attributes`);t=e}else this.attributes[n]=e}if(t){if(!(t.value instanceof Uint16Array||t.value instanceof Uint32Array))throw Error(`Geometry indices must be a Uint16Array or Uint32Array`);t.size=1,this.indices=t,lu(t,this.attributes)}if(this.vertexCount=e.vertexCount??uu(this.attributes,this.indices),!Number.isInteger(this.vertexCount)||this.vertexCount<0)throw Error(`Geometry vertexCount must be a non-negative integer`)}getVertexCount(){return this.vertexCount}getAttributes(){return this.indices?{indices:this.indices,...this.attributes}:this.attributes}};function cu(e){let t=au(e)?{value:e}:{...e};if(!au(t.value))throw Error(`Geometry attributes must contain a typed-array value`);if(t.size!==void 0&&(!Number.isInteger(t.size)||t.size<1))throw Error(`Geometry attribute size must be a positive integer`);if(t.size&&t.value.length%t.size!==0)throw Error(`Geometry attribute length must be divisible by its size`);return t}function lu(e,t){let n=-1;for(let t of e.value)n=Math.max(n,Number(t));for(let[e,r]of Object.entries(t))if(!r.constant&&r.size){let t=r.value.length/r.size;if(n>=t)throw Error(`Geometry index ${n} exceeds ${e} vertex count ${t}`)}}function uu(e,t){if(t)return t.value.length;let n=1/0;for(let t of Object.values(e))!t.constant&&t.size&&(n=Math.min(n,t.value.length/t.size));if(!Number.isFinite(n))throw Error(`Geometry has no countable attributes`);return n}var du=class extends su{bufferLayout;constructor(e){let t={},n=new Map;for(let[r,i]of Object.entries(e.attributes)){let e=fu(r),a=n.get(e);a&&delete t[a],n.set(e,r),t[r]=i}let r=e.indices,i=r instanceof Uint8Array?new Uint16Array(r):r&&!ArrayBuffer.isView(r)&&r.value instanceof Uint8Array?{...r,value:new Uint16Array(r.value)}:r;super({...e,attributes:t,indices:i});for(let[e,n]of Object.entries(t))!ArrayBuffer.isView(n)&&Object.isExtensible(n)&&e!==`indices`&&(Object.assign(n,this.attributes[e]),this.attributes[e]=n);this.bufferLayout=e.bufferLayout||pu(this.attributes)}};function fu(e){switch(e){case`POSITION`:return`positions`;case`NORMAL`:return`normals`;case`TEXCOORD_0`:return`texCoords`;case`TEXCOORD_1`:return`texCoords1`;case`COLOR_0`:return`colors`;default:return e}}function pu(e){let t=[];for(let[n,r]of Object.entries(e)){if(!r)continue;let{value:e,size:i,normalized:a}=r;if(i===void 0)throw Error(`Attribute ${n} is missing a size`);t.push({name:fu(n),format:xe.getVertexFormatFromAttribute(e,i,a)})}return t}function mu(e,t={}){let n=t.bufferName||`geometry`;if(hu(e,n))return e;let r=t.minAttributeAlignment||4,i=gu(e,t.attributes),a=[],o=0,s=1/0;for(let[e,t]of i){if(!t)continue;if(t.constant)throw Error(`Attribute ${e} is constant`);let{value:n,size:i,normalized:c}=t;if(!ArrayBuffer.isView(n))throw Error(`Attribute ${e} is missing typed array data`);if(i===void 0)throw Error(`Attribute ${e} is missing a size`);let l=xe.getVertexFormatFromAttribute(n,i,c),u=xe.getVertexFormatInfo(l);o=vu(o,r),a.push({sourceName:e,attributeName:fu(e),value:n,size:i,format:l,byteOffset:o,byteLength:u.byteLength}),o+=u.byteLength;let d=n.length/i;if(!Number.isInteger(d))throw Error(`Attribute ${e} length is not divisible by size`);s=Math.min(s,d)}if(a.length===0||!Number.isFinite(s))throw Error(`Geometry ${e.id} has no interleavable attributes`);let c=vu(o,r),l=new ArrayBuffer(s*c);for(let e of a)_u(l,s,c,e);return new du({id:e.id,topology:e.topology||`triangle-list`,vertexCount:e.vertexCount,indices:e.indices,attributes:{[n]:{value:new Uint8Array(l),size:c,byteStride:c}},bufferLayout:[{name:n,stepMode:`vertex`,byteStride:c,attributes:a.map(e=>({attribute:e.attributeName,format:e.format,byteOffset:e.byteOffset}))}]})}function hu(e,t){if(e.bufferLayout?.length!==1)return!1;let n=e.bufferLayout[0];return n.name===t&&!!n.attributes?.length&&!!e.attributes[t]}function gu(e,t){let n=new Map,r=t||Object.keys(e.attributes);for(let t of r){let r=e.attributes[t];r&&n.set(fu(t),[t,r])}return Array.from(n.values())}function _u(e,t,n,r){let i=r.value.constructor,a=i.BYTES_PER_ELEMENT;if(r.byteOffset%a!==0||n%a!==0)throw Error(`Attribute ${r.sourceName} is not aligned to its component type`);let o=new i(e),s=r.value,c=r.byteOffset/a,l=n/a;for(let e=0;e<t;e++){let t=e*r.size,n=e*l+c;for(let e=0;e<r.size;e++)o[n+e]=s[t+e]}}function vu(e,t){return Math.ceil(e/t)*t}var yu=1,bu=1,xu=class{time=0;channels=new Map;animations=new Map;playing=!1;lastEngineTime=-1;constructor(){}addChannel(e){let{delay:t=0,duration:n=1/0,rate:r=1,repeat:i=1}=e,a=yu++,o={time:0,delay:t,duration:n,rate:r,repeat:i};return this._setChannelTime(o,this.time),this.channels.set(a,o),a}removeChannel(e){this.channels.delete(e);for(let[t,n]of this.animations)n.channel===e&&this.detachAnimation(t)}isFinished(e){let t=this.channels.get(e);return t===void 0?!1:this.time>=t.delay+t.duration*t.repeat}getTime(e){if(e===void 0)return this.time;let t=this.channels.get(e);return t===void 0?-1:t.time}setTime(e){this.time=Math.max(0,e);let t=this.channels.values();for(let e of t)this._setChannelTime(e,this.time);let n=this.animations.values();for(let e of n){let{animation:t,channel:n}=e;t.setTime(this.getTime(n))}}play(){this.playing=!0}pause(){this.playing=!1,this.lastEngineTime=-1}reset(){this.setTime(0)}attachAnimation(e,t){let n=bu++;return this.animations.set(n,{animation:e,channel:t}),e.setTime(this.getTime(t)),n}detachAnimation(e){this.animations.delete(e)}update(e){this.playing&&(this.lastEngineTime===-1&&(this.lastEngineTime=e),this.setTime(this.time+(e-this.lastEngineTime)),this.lastEngineTime=e)}_setChannelTime(e,t){let n=t-e.delay;n>=e.duration*e.repeat?e.time=e.duration*e.rate:(e.time=Math.max(0,n)%e.duration,e.time*=e.rate)}};function Su(e){let t=typeof window<`u`?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null;return t?t.call(window,e):setTimeout(()=>e(typeof performance<`u`?performance.now():Date.now()),1e3/60)}function Cu(e){let t=typeof window<`u`?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null;if(t){t.call(window,e);return}clearTimeout(e)}var wu=0,Tu=`Animation Loop`,Eu={requestAnimationFrame:e=>Su(e),cancelAnimationFrame:e=>Cu(e)},Du=class e{static defaultAnimationLoopProps={device:null,mobileQuality:void 0,onAddHTML:()=>``,onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:Eu};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw=`initialized`;_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(t){if(this.props={...e.defaultAnimationLoopProps,...t},t=this.props,!t.device)throw Error(`No device provided`);this.stats=t.stats||new d({id:`animation-loop-${wu++}`}),this.sharedStats=Kl.stats.get(Tu),this.frameRate=this.stats.get(`Frame Rate`),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get(`CPU Time`),this.gpuTime=this.stats.get(`GPU Time`),this.setProps({autoResizeViewport:t.autoResizeViewport,animationFrameProvider:t.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this._stopEventHandling(),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(t){this._error=t,this.props.onError(t),this.props.onError===e.defaultAnimationLoopProps.onError&&typeof window<`u`&&typeof ErrorEvent<`u`&&window.dispatchEvent(new ErrorEvent(`error`,{error:t,message:t.message}))}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if(`autoResizeViewport`in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),`animationFrameProvider`in e){let t=e.animationFrameProvider||Eu;if(t!==this.props.animationFrameProvider){let e=this._animationFrameId!==null;e&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,e&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}return this._running?(this._cancelAnimationFrame(),this._requestAnimationFrame(),this):null}catch(e){let t=e instanceof Error?e:Error(`Unknown error`);throw this.props.onError(t),t}}stop(){if(this._running){let e=this.animationProps;this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0,e&&this.props.onFinalize(e)}return this}redraw(e,t=null){return this.device?.isLost||this._error?this:(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&=(this._resolveNextFrame(this),this._nextFramePromise=null,null),this._endFrameTimers(),this)}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw(`waitForRender`),this._nextFramePromise||=new Promise(e=>{this._resolveNextFrame=e}),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw(`toDataURL`),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw Error(`OffscreenCanvas`)}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){this._animationFrameId!==null&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){if(this._running)try{this.redraw(e,t??null),this._requestAnimationFrame()}catch(e){let t=e instanceof Error?e:Error(String(e));this.reportError(t),this.stop()}}_renderFrame(e){if(this.display){this.display._renderFrame(e);return}let t=this.props.onRender(this._getAnimationProps());this.device&&t!==!1&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw Error(`loop`);let t=e?.canvas,n=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:n,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null,mobileQuality:this.props.mobileQuality}}_getAnimationProps(){if(!this.animationProps)throw Error(`animationProps`);return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:n}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw(`drawing buffer resized`),n!==this.animationProps.aspect&&this.setNeedsRedraw(`drawing buffer aspect changed`),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=n,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw Error(`No device provided`);this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement(`div`);document.body.appendChild(e),e.style.position=`relative`;let t=document.createElement(`div`);t.style.position=`absolute`,t.style.left=`10px`,t.style.bottom=`10px`,t.style.width=`300px`,t.style.background=`white`,this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let n=this.props.onAddHTML(t);n&&(t.innerHTML=n)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize();return{width:e,height:t,aspect:e>0&&t>0?e/t:1}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??(typeof performance<`u`?performance.now():Date.now());if(this._lastFrameTime){let e=t-this._lastFrameTime;e>0&&this.frameRate.addTime(e)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;e!==void 0&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener(`mousemove`,this._onMousemove),this.canvas.addEventListener(`mouseleave`,this._onMouseleave))}_stopEventHandling(){this.canvas?.removeEventListener(`mousemove`,this._onMousemove),this.canvas?.removeEventListener(`mouseleave`,this._onMouseleave)}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}},Ou=class{device;buffer;byteOffset=0;constructor(e){this.device=e}prepare(e){if(!this.buffer||this.buffer.byteLength<e){let t=Math.max(1024,(this.buffer?.byteLength??0)*2,e),n=this.device.createBuffer({id:`batch-uniforms`,byteLength:t,usage:I.UNIFORM|I.COPY_DST});this.buffer?.destroy(),this.buffer=n}this.byteOffset=0}getAlignedByteLength(e){let t=this.device.limits.minUniformBufferOffsetAlignment||1;return Math.ceil(e/t)*t}write(e){P(this.buffer&&this.byteOffset+e.byteLength<=this.buffer.byteLength);let t={buffer:this.buffer,offset:this.byteOffset,size:e.byteLength};return this.buffer.write(e,t.offset),this.byteOffset+=this.getAlignedByteLength(e.byteLength),t}destroy(){this.buffer?.destroy(),this.buffer=void 0,this.byteOffset=0}};function ku(e,t){let n={},r=`Values`;if(e.attributes.length===0&&!e.varyings?.length)return{"No attributes or varyings":{[r]:`N/A`}};for(let t of e.attributes)if(t){let e=`${t.location} ${t.name}: ${t.type}`;n[`in ${e}`]={[r]:t.stepMode||`vertex`}}for(let t of e.varyings||[]){let e=`${t.location} ${t.name}`;n[`out ${e}`]={[r]:JSON.stringify(t)}}return n}var Au=`__debugFramebufferState`,ju=8;function Mu(e,t,n){if(e.device.type!==`webgl`)return;let r=Fu(e.device);if(!r.flushing){if(Lu(e)){Nu(e,n,r);return}t&&Iu(t)&&t.handle!==null&&(r.queuedFramebuffers.includes(t)||r.queuedFramebuffers.push(t))}}function Nu(e,t,n){if(n.queuedFramebuffers.length===0)return;let{gl:r}=e.device,i=r.getParameter(36010),a=r.getParameter(36006),[o,s]=e.device.getDefaultCanvasContext().getDrawingBufferSize(),c=Ru(t.top,ju),l=Ru(t.left,ju);n.flushing=!0;try{for(let e of n.queuedFramebuffers){let[n,i,a,u,d]=Pu({framebuffer:e,targetWidth:o,targetHeight:s,topPx:c,leftPx:l,minimap:t.minimap});r.bindFramebuffer(36008,e.handle),r.bindFramebuffer(36009,null),r.blitFramebuffer(0,0,e.width,e.height,n,i,a,u,16384,9728),c+=d+ju}}finally{r.bindFramebuffer(36008,i),r.bindFramebuffer(36009,a),n.flushing=!1}}function Pu(e){let{framebuffer:t,targetWidth:n,targetHeight:r,topPx:i,leftPx:a,minimap:o}=e,s=o?Math.max(Math.floor(n/4),1):n,c=o?Math.max(Math.floor(r/4),1):r,l=Math.min(s/t.width,c/t.height),u=Math.max(Math.floor(t.width*l),1),d=Math.max(Math.floor(t.height*l),1),f=a,p=Math.max(r-i-d,0);return[f,p,f+u,p+d,d]}function Fu(e){return e.userData[Au]||={flushing:!1,queuedFramebuffers:[]},e.userData[Au]}function Iu(e){return`colorAttachments`in e}function Lu(e){let t=e.props.framebuffer;return!t||t.handle===null}function Ru(e,t){if(!e)return t;let n=Number.parseInt(e,10);return Number.isFinite(n)?n:t}function zu(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!zu(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=e,i=t,a=Object.keys(e),o=Object.keys(t);if(a.length!==o.length)return!1;for(let e of a)if(!t.hasOwnProperty(e)||!zu(r[e],i[e],n-1))return!1;return!0}return!1}var Bu=class{bufferLayouts;constructor(e){this.bufferLayouts=e}getBufferLayout(e){return this.bufferLayouts.find(t=>t.name===e)||null}getAttributeNamesForBuffer(e){return y(e)}mergeBufferLayouts(e,t){let n=[...e];for(let e of t){let t=n.findIndex(t=>t.name===e.name);t<0?n.push(e):n[t]=e}return n}};function Vu(e,t){let n=h(e),r=t.slice();return r.sort((e,t)=>v(y(e).map(e=>n[e]))-v(y(t).map(e=>n[e]))),r}function Hu(e,t){if(!e||!t.some(e=>e.bindingLayout?.length))return e;let n={...e,bindings:e.bindings.map(e=>({...e}))};`attributes`in(e||{})&&(n.attributes=e?.attributes||[]);for(let e of t)for(let t of e.bindingLayout||[])for(let e of qu(t.name)){let r=n.bindings.find(t=>t.name===e);r?.group===0&&(r.group=t.group),r&&t.visibility!==void 0&&(r.visibility=t.visibility)}return n}function Uu(e,t,n=[]){return e?t?{...e,attributes:e.attributes.length?Xu(e.attributes,t.attributes.filter(e=>n.includes(e.name))):t.attributes,bindings:Yu(e.bindings,t.bindings)}:e:t}function Wu(e){return!!(e.uniformTypes&&!Ju(e.uniformTypes))}function Gu(e){let t=[];for(let n of e){let e=oe(n),r=new Set([n.vs,n.fs].flatMap(e=>e?te(e).filter(e=>e.isStd140).map(e=>e.blockName):[])),i=r.has(e)?e:r.size===1?r.values().next().value:void 0;Wu(n)&&i&&t.push({name:i,uniformTypes:n.uniformTypes})}return t}function Ku(e,t){let n=[],r=new Set;for(let i of[...e||[],...t||[]])r.has(i.name)||(r.add(i.name),n.push(i));return n}function qu(e){let t=new Set([e,`${e}Uniforms`]);return e.endsWith(`Uniforms`)||t.add(`${e}Sampler`),[...t]}function Ju(e){for(let t in e)return!1;return!0}function Yu(e,t){let n=e.map(e=>({...e})),r=new Set(e.map(e=>e.name)),i=new Set(e.map(e=>`${e.group}:${e.location}`));for(let e of t){let t=`${e.group}:${e.location}`;!r.has(e.name)&&!i.has(t)&&n.push({...e})}return n}function Xu(e,t){let n=e.map(e=>({...e})),r=new Map(e.map(e=>[e.name,e])),i=new Map(e.map(e=>[e.location,e]));for(let e of t){let t=r.get(e.name);if(t){if(t.type!==e.type||t.location!==e.location)throw Error(`Shader attribute "${e.name}" conflicts with its inferred type or location`);continue}let a=i.get(e.location);if(a)throw Error(`Shader attributes "${a.name}" and "${e.name}" both use location ${e.location}`);n.push({...e})}return n}var Zu={};function Qu(e=`id`){return Zu[e]=Zu[e]||1,`${e}-${Zu[e]++}`}function $u(e,t,n){for(let[r,i]of Object.entries(t)){if(!i)continue;if(!i.format)throw Error(`${e} GPUVector "${r}" requires a format`);let t=n.find(e=>e.name===r);if(!t)throw Error(`${e} GPUVector "${r}" requires a Model buffer layout`);let a=t.attributes??[];if(a.length>1)throw Error(`${e} GPUVector "${r}" does not support interleaved layouts`);let o=a[0],s=t.format??o?.format,c=td(e,r,i.format),l=t.byteStride??c.byteLength;if(s!==i.format||l!==i.byteStride||i.rowByteLength!==c.byteLength)throw Error(`${e} GPUVector "${r}" must match its Model buffer layout`)}}function ed(e,t){let n=Object.entries(t).filter(e=>e[1]!==void 0);if(n.length===0)return[];let[r,i]=n[0];for(let[t,a]of n){if(!a.format)throw Error(`${e} GPUVector "${t}" requires a format`);if(td(e,t,a.format),a.length!==i.length)throw Error(`${e} GPUVector "${t}" rows must match "${r}" rows`);if(a.data.length!==i.data.length)throw Error(`${e} GPUVector chunk counts must align`)}let a=0;return i.data.map((t,r)=>{let i={};for(let[a,o]of n){let n=o.data[r];if(!n||n.length!==t.length)throw Error(`${e} GPUVector chunk ${r} row counts must align`);if(n.format!==o.format||n.byteStride!==o.byteStride||n.rowByteLength!==o.rowByteLength)throw Error(`${e} GPUVector "${a}" chunk layout must be stable`);i[a]=n}let o={batchIndex:r,rowIndexOffset:a,rowCount:t.length,data:i};return a+=t.length,o})}function td(e,t,n){if(n.includes(`<`))throw Error(`${e} GPUVector "${t}" requires a fixed-width scalar format`);return xe.getVertexFormatInfo(n)}function nd(e){let t;for(let n of Object.values(e)){if(!n||`isConstant`in n)continue;let e=0;for(let t of n.data)e+=t.length;if(P(e===n.length),t){P(n.length===t.length&&n.data.length===t.data.length);for(let e=0;e<n.data.length;e++)P(n.data[e].length===t.data[e].length)}else t=n}}function rd(e,t,n,r,i,a){let o=t.inputs,s=n.inputs,c=t.sourceLayouts,l=n.sourceLayouts,u=t.layouts,d=n.layouts,f=n.stepMode,p=t.batchCount,m=n.batchCount,h=Array.from({length:p},(e,n)=>t.getBatch(n)),g=Array.from({length:m},(e,t)=>n.getBatch(t)),_=id(h),v=id(g),y=e.vertexCount,b=e.instanceCount,x=!0;try{let o=e.isInstanced&&n.vertexCount===void 0,s=o?p*m:Math.max(p,m);if(p===0||m===0)return!0;for(let c=0;c<s;c++){let s=o?Math.floor(c/m):Math.min(c,p-1),l=o?c%m:Math.min(c,m-1);t.setInputs(h[s],u,`vertex`),n.setInputs(g[l],d,f),r();let S=t.rowCount===void 0?n.vertexCount===void 0?0:v[l]:_[s];a===`vertex`&&e.setVertexCount(Math.max(0,Math.min(t.rowCount??n.vertexCount??y,y-S))),a===`instance`&&n.instanceCount!==void 0&&e.setInstanceCount(Math.max(0,Math.min(n.instanceCount,b-v[l]))),!(!e.indexBuffer&&e.vertexCount===0||e.isInstanced&&e.instanceCount===0)&&(x=i()&&x)}}finally{t.setInputs(o,c,`vertex`),n.setInputs(s,l,f),r(),e.setVertexCount(y),e.setInstanceCount(b)}return x}function id(e){let t=0;return e.map(e=>{let n=t;for(let n of Object.values(e))if(n&&`data`in n){t+=n.length;break}return n})}var ad=class{device;id;inputs={};sourceLayouts;stepMode=`vertex`;claimedNames=new Set;layouts=[];buffers={};byteOffsets={};constants={};rowCount;vertexCount;instanceCount;constantBuffers={};constructor(e,t){this.device=e,this.id=t}setInputs(e,t,n,r=!0){if(r)nd(e);else for(let t of Object.values(e))t&&!od(t)&&P(t.data.length===1);this.claimedNames.clear(),this.inputs=e,this.sourceLayouts=t,this.stepMode=n,this.rowCount=void 0,this.vertexCount=void 0,this.instanceCount=void 0;let i=t??Object.entries(e).flatMap(([e,t])=>t&&!od(t)&&t.bufferLayout?[{...t.bufferLayout,name:e}]:[]),a=Object.entries(e).flatMap(([e,t])=>{if(!t||i.some(t=>t.name===e||t.attributes?.some(t=>t.attribute===e)))return[];P(t.format);let r=t.format;return[{name:e,stepMode:n,byteStride:od(t)?0:t.byteStride,attributes:[{attribute:e,format:r,byteOffset:0}]}]}),o=[...i,...cd(e,a)];for(let[t,i]of Object.entries(e))if(i){if(!od(i)&&!Array.isArray(i.data))throw TypeError(`Expected a GPU vector or constant for ${t}`);!od(i)&&r&&((o.find(e=>e.name===t||e.attributes?.some(e=>e.attribute===t))?.stepMode??n)===`instance`?(P(this.instanceCount===void 0||this.instanceCount===i.length),this.instanceCount=i.length):(P(this.vertexCount===void 0||this.vertexCount===i.length),this.vertexCount=i.length),this.rowCount=n===`instance`?this.instanceCount:this.vertexCount),this.claimedNames.add(t)}this.layouts=o.flatMap(t=>{let r=e[t.name],i=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]),a=i.filter(t=>od(e[t.attribute])),o={...t,stepMode:t.stepMode??n};return this.device.type!==`webgpu`||r&&!od(r)&&r.bufferLayout||!a.length||a.length===i.length?[{...o,byteStride:a.length===i.length&&a.length?0:o.byteStride}]:[{...o,attributes:i.filter(t=>!od(e[t.attribute]))},{...o,name:`${t.name}-constants`,byteStride:0,attributes:a}]}),this.buffers={},this.byteOffsets={},this.constants={};let s=new Set;for(let t of this.layouts){this.claimedNames.add(t.name);let n=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]);for(let e of n)this.claimedNames.add(e.attribute);let r=e[t.name];if(r&&!od(r)){let e=r.bufferLayout||!r.format?0:(n.find(e=>e.attribute===t.name)??n[0])?.byteOffset??0;this.bindVector(t.name,r,e)}let i=0;for(let r of n){let n=e[r.attribute]??(r.attribute===t.name?e[t.name]:void 0);n&&(P(n.format===void 0||n.format===r.format),od(n)?(this.constants[r.attribute]=sd(n),i=Math.max(i,(r.byteOffset??0)+n.byteLength)):this.buffers[t.name]||this.bindVector(t.name,n,r.byteOffset??0))}if(this.device.type===`webgpu`&&i&&!this.buffers[t.name]){let r=new Uint8Array(Math.ceil(i/4)*4);for(let t of n){let n=e[t.attribute];od(n)&&r.set(new Uint8Array(n.value.buffer,n.value.byteOffset,n.byteLength),t.byteOffset??0)}let a=this.constantBuffers[t.name];(!a||a.byteLength<r.byteLength)&&(a?.destroy(),a=this.device.createBuffer({id:`${this.id}-${t.name}-constant`,byteLength:r.byteLength,usage:I.VERTEX|I.COPY_DST|I.COPY_SRC}),this.constantBuffers[t.name]=a),a.write(r),this.buffers[t.name]=a,s.add(t.name)}}for(let[e,t]of Object.entries(this.constantBuffers))s.has(e)||(t.destroy(),delete this.constantBuffers[e])}get batchCount(){let e=Object.values(this.inputs).find(e=>e&&!od(e));return e&&!od(e)?e.data.length:1}getBatch(e){return Object.fromEntries(Object.entries(this.inputs).map(([t,n])=>{if(!n||od(n))return[t,n];let r=n.data[e];return[t,{...n,length:r?.length??0,data:r?[r]:[]}]}))}destroy(){for(let e of Object.values(this.constantBuffers))e.destroy();this.constantBuffers={}}bindVector(e,t,n){let r=t.data[0];if(!r)return;let i=r.byteOffset-n;P(i>=0),this.buffers[e]=r.buffer,this.byteOffsets[e]=i}};function od(e){return!!(e&&`isConstant`in e&&e.isConstant)}function sd(e){let t=xe.getVertexFormatInfo(e.format);if(e.format===`unorm10-10-10-2`){let t=e.value[0];return new Float32Array([(t&1023)/1023,(t>>>10&1023)/1023,(t>>>20&1023)/1023,(t>>>30)/3])}let n=Array.from(e.value);if(e.format===`unorm8x4-bgra`&&([n[0],n[2]]=[n[2],n[0]]),t.normalized){let r=e.value.BYTES_PER_ELEMENT*8,i=2**r-1;return new Float32Array(n.map(e=>t.signed?(e+2**(r-1))/i*2-1:e/i))}return t.integer?t.signed?new Int32Array(n):new Uint32Array(n):new Float32Array(n)}function cd(e,t){let n=[],r,i=0,a=[...t].sort((t,n)=>{let r=e[t.name],i=e[n.name];return(r&&!od(r)?r.data[0]?.byteOffset??0:0)-(i&&!od(i)?i.data[0]?.byteOffset??0:0)});for(let t of a){let a=e[t.name],o=t.attributes[0];if(od(a)){r||(r={...t,attributes:[]},n.push(r));let e=Math.min(4,a.byteLength);i=Math.ceil(i/e)*e,r.attributes.push({...o,byteOffset:i}),i+=a.byteLength;continue}let s=n.find(n=>{let r=e[n.name];if(!r||od(r)||!r.data.length||!a.data.length)return!1;let i=a.data[0].byteOffset-r.data[0].byteOffset;return n.stepMode===t.stepMode&&n.byteStride===t.byteStride&&i>=0&&i+a.rowByteLength<=a.byteStride&&a.data.every((e,t)=>{let n=r.data[t];return e.buffer===n.buffer&&e.byteStride===n.byteStride&&e.byteOffset-n.byteOffset===i})});if(s){let t=e[s.name];s.attributes.push({...o,byteOffset:a.data[0].byteOffset-t.data[0].byteOffset})}else n.push({...t,attributes:[...t.attributes]})}return n}function ld(e){return(Array.isArray(e)?e.length===0||typeof e[0]==`number`:ArrayBuffer.isView(e)&&!(e instanceof DataView))||typeof e==`number`||typeof e==`boolean`}function ud(e,t={}){let n={bindings:{},uniforms:{}};return Object.keys(e).forEach(r=>{let i=e[r];Object.prototype.hasOwnProperty.call(t,r)||ld(i)?n.uniforms[r]=i:n.bindings[r]=i}),n}var dd=class{options={disableWarnings:!1};modules;moduleUniforms;moduleBindings;directBindings={};constructor(e,t){Object.assign(this.options,t);let n=ee(Object.values(e).filter(_d));for(let t of n)e[t.name]=t;F.log(1,`Creating ShaderInputs with modules`,Object.keys(e))(),this.modules=e,this.moduleUniforms={},this.moduleBindings={};for(let[t,n]of Object.entries(e))n&&(this._addModule(n),n.name&&t!==n.name&&!this.options.disableWarnings&&F.warn(`Module name: ${t} vs ${n.name}`)())}destroy(){}setProps(e){e.bindings&&Object.assign(this.directBindings,e.bindings);for(let t of Object.keys(e)){if(t===`bindings`)continue;let n=t,r=e[n]||{},i=this.modules[n];if(!i)this.options.disableWarnings||F.warn(`Module ${t} not found`)();else{let e=this.moduleUniforms[n],t=this.moduleBindings[n],{uniforms:a,bindings:o}=ud(i.getUniforms?.(r,e)||r,i.uniformTypes);this.moduleUniforms[n]=fd(e,a,i.uniformTypes),this.moduleBindings[n]={...t,...o}}}}getModules(){return Object.values(this.modules)}addModules(e){let t=ee(e);for(let e of t){let t=e.name;this.modules[t]||(this.modules[t]=e,this._addModule(e))}}getUniformValues(){return this.moduleUniforms}getBindingValues(){let e={};for(let t of Object.values(this.moduleBindings))Object.assign(e,t);return Object.assign(e,this.directBindings),e}getModuleBindingValues(e){let t=this.moduleBindings[e];return t?{...t}:{}}getDebugTable(){let e={};for(let[t,n]of Object.entries(this.moduleUniforms))for(let[r,i]of Object.entries(n))e[`${t}.${r}`]={type:this.modules[t].uniformTypes?.[r],value:String(i)};return e}_addModule(e){let t=e.name;this.moduleUniforms[t]=fd({},e.defaultUniforms||{},e.uniformTypes),this.moduleBindings[t]={}}};function fd(e={},t={},n={}){let r={...e};for(let[i,a]of Object.entries(t))a!==void 0&&(r[i]=pd(e[i],a,n[i]));return r}function pd(e,t,n){if(!n||typeof n==`string`)return md(t);if(Array.isArray(n)){if(hd(t)||!Array.isArray(t))return md(t);let r=Array.isArray(e)&&!hd(e)?[...e]:[],i=r.slice();for(let e=0;e<t.length;e++){let a=t[e];a!==void 0&&(i[e]=pd(r[e],a,n[0]))}return i}if(!gd(t))return md(t);let r=n,i=gd(e)?e:{},a={...i};for(let[e,n]of Object.entries(t))n!==void 0&&(a[e]=pd(i[e],n,r[e]));return a}function md(e){return ArrayBuffer.isView(e)?Array.prototype.slice.call(e):Array.isArray(e)?hd(e)?e.slice():e.map(e=>e===void 0?void 0:md(e)):gd(e)?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t===void 0?void 0:md(t)])):e}function hd(e){return ArrayBuffer.isView(e)||Array.isArray(e)&&(e.length===0||typeof e[0]==`number`)}function gd(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function _d(e){return!!e?.dependencies}var vd={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function yd(e){return e?Array.isArray(e)?e[0]??null:e:null}function bd(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=yd(n);if(!e)return null;let{width:t}=xd(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=yd(n);return e?xd(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=yd(n[0]);return e?xd(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=yd(t);return r?xd(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=yd(e[t]);return r?xd(r):null}default:return null}}function xd(e){if(b(e))return u(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function Sd(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function Cd(e){return ArrayBuffer.isView(e)}function wd(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function Td(e){let t=vd[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function Ed(e,t){return 6*e+Td(t)}function Dd(e){throw Error(`setTexture1DData not supported in WebGL.`)}function Od(e){return Array.isArray(e)?e:[e]}function kd(e,t,n,r){let i=Od(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(b(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if(Sd(t))o.push({type:`texture-data`,data:t,textureFormat:wd(t),z:a,mipLevel:e});else if(Cd(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function Ad(e){let t=[];for(let n=0;n<e.length;n++)t.push(...kd(n,e[n]));return t}function jd(e){let t=[];for(let n=0;n<e.length;n++)t.push(...kd(n,e[n]));return t}function Md(e){let t=[];for(let[n,r]of Object.entries(e)){let e=Td(n);t.push(...kd(e,r))}return t}function Nd(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=Ed(n,r);t.push(...kd(e,i))}}),t}var Pd=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=Se(`dynamic-texture`),i=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let t=await this._loadAllData(e);this._checkNotDestroyed();let n=t.data?Fd({...t,width:e.width,height:e.height,format:e.format}):[],r=`format`in e&&e.format!==void 0,i=`usage`in e&&e.usage!==void 0,a=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:bd(t)||{width:this.props.width||1,height:this.props.height||1};if(!a||a.width<=0||a.height<=0)throw Error(`${this} size could not be determined or was zero`);let o=Id(this.device,n,a,{format:r?e.format:void 0}),s=o.format??this.props.format,c={...this.props,...a,format:s,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(s)&&!i&&(c.usage=L.SAMPLE|L.COPY_DST);let l=this.props.mipmaps&&!o.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(s);if(this.device.type===`webgpu`&&l){let e=this.props.dimension===`3d`?L.SAMPLE|L.STORAGE|L.COPY_DST|L.COPY_SRC:L.SAMPLE|L.RENDER|L.COPY_DST|L.COPY_SRC;c.usage|=e}let u=this.device.getMipLevelCount(c.width,c.height),d=o.hasExplicitMipChain?o.mipLevels:this.props.mipLevels===`auto`?u:Math.max(1,Math.min(u,this.props.mipLevels??1)),f={...c,mipLevels:d};this._texture=this.device.createTexture(f),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),o.subresources.length&&this._setTextureSubresources(o.subresources),this.props.mipmaps&&!o.hasExplicitMipChain&&!l&&F.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),l&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),F.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):F.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof Re?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=this.device.createBuffer({byteLength:i.byteLength,usage:I.COPY_DST|I.MAP_READ});this.texture.readBuffer({...e,width:t,height:n,depthOrArrayLayers:r},a);let o=this.device.createFence();return await o.signaled,o.destroy(),a}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),F.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=vd[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=Dd(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=kd(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=Ad(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=jd(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=Md(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=Nd(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await Bd(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&F.warn(`${this} already destroyed`)}_checkReady(){this.isReady||F.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...L.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function Fd(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return Dd(e.data);case`2d`:return kd(0,e.data,t,n);case`3d`:return Ad(e.data);case`2d-array`:return jd(e.data);case`cube`:return Md(e.data);case`cube-array`:return Nd(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function Id(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=Rd(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=Ld(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?zd(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=Rd(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=Ld(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function Ld(e){if(e.type===`texture-data`)return e.textureFormat??wd(e.data)}function Rd(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function zd(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function Bd(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(Bd));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(Bd)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}function Vd(e){return typeof e==`object`&&!!e&&`resolveTextureBinding`in e&&typeof e.resolveTextureBinding==`function`}function Hd(e){return e?.type===`texture`||e?.type===`external-texture`}function Ud(e,t,n){let r=_(e,t,{ignoreWarnings:!0});return Hd(r)?r:e.bindings.length===0&&n?.fallbackGroup!==void 0?{type:`texture`,name:t,group:n.fallbackGroup,location:0}:null}var Wd=2,Gd=1e4,Kd=`render pipeline initialization failed`,qd=[`stencil8`,`depth16unorm`,`depth24plus`,`depth24plus-stencil8`,`depth32float`,`depth32float-stencil8`],Jd=class e{static async createAsync(e,t){let n=!ce.getAsyncCompilation(e),r=n?ce.beginAsyncCompilation(e):ce.getAsyncCompilation(e),i;try{i=new this(e,t)}finally{n&&ce.endAsyncCompilation(e,r)}try{return n?await Promise.all(r):await i._pipelineInitialization,i}catch(e){throw i.destroy(),e}}static defaultProps={...be.defaultProps,inferDrawCount:`no`,enforceMatchingVectorLengths:!0,geometry:null,attributeVectors:void 0,source:void 0,sourceLanguage:void 0,vs:null,fs:null,id:`unnamed`,handle:void 0,userData:{},defines:{},modules:[],plugins:[],indexBuffer:null,indexCount:void 0,firstVertex:0,firstIndex:0,attributes:{},constantAttributes:{},bindings:{},uniforms:{},varyings:[],isInstanced:void 0,instanceCount:0,vertexCount:0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,transformFeedback:void 0,shaderAssembler:void 0,debugShaders:void 0,disableWarnings:void 0};device;id;source;vs;fs;pipelineFactory;shaderFactory;userData={};parameters;topology;bufferLayout;isInstanced=void 0;instanceCount=0;vertexCount;indexCount;firstVertex;firstIndex;indexBuffer=null;bufferAttributes={};constantAttributes={};bindings={};vertexArray;transformFeedback=null;pipeline;shaderInputs;_uniformStore;_attributeInfos={};props;batchUniformBuffer;geometryVectorBindings;attributeVectorBindings;explicitBufferLayout=[];constructorDrawCounts;constructorDrawOffsets;drawingVectorBatches=!1;indexVector=null;currentAttributes={};currentAttributeByteOffsets={};_dynamicIndexBufferSource=null;_dynamicAttributeBufferSources={};_colorAttachmentFormats;_depthStencilAttachmentFormat;_pipelineNeedsUpdate=`newly created`;_needsRedraw=`initializing`;_drawBlockedReason=!1;_destroyed=!1;_vertexCountSet=!1;_lastDrawTimestamp=-1;_bindingTable=[];_pipelineInitialization;get[Symbol.toStringTag](){return`Model`}toString(){return`Model(${this.id})`}constructor(t,n){this.constructorDrawOffsets={firstVertex:n.firstVertex,firstIndex:n.firstIndex};let r=this.constructor.defaultProps;this.constructorDrawCounts={vertexCount:n.vertexCount??(r.vertexCount||void 0),instanceCount:n.instanceCount??(r.instanceCount||void 0)};let i=r.shaderAssembler,a=Object.hasOwn(n,`vertexCount`);this.props={...r,...n,shaderAssembler:n.shaderAssembler??(i&&Yd(i,t.info.shadingLanguage)?i:t.info.shadingLanguage===`wgsl`?new De:new Le)},this._vertexCountSet=a,n=this.props,this.id=n.id||Qu(`model`),this.device=t,Object.assign(this.userData,n.userData),this.vertexCount=this.props.vertexCount,this.indexCount=this.props.indexCount,this.firstVertex=this.props.firstVertex,this.firstIndex=this.props.firstIndex,this.instanceCount=this.props.instanceCount,this.topology=this.props.topology,this.bufferLayout=this.props.bufferLayout,this.parameters=this.props.parameters,this._colorAttachmentFormats=this.props.colorAttachmentFormats,this._depthStencilAttachmentFormat=this.props.depthStencilAttachmentFormat,this.isInstanced=n.isInstanced??(n.instanceCount?!0:void 0),this.explicitBufferLayout=this.bufferLayout,this.geometryVectorBindings=new ad(t,`${this.id}-geometry`),this.attributeVectorBindings=new ad(t,`${this.id}-attributes`);try{this._initializeProps(n);let e=ie(t),r=bs(this.props.plugins,e.shaderLanguage),i=xs(this.props.modules,r.modules),a=Object.fromEntries(i.map(e=>[e.name,e])),o=n.shaderInputs||new dd(a,{disableWarnings:this.props.disableWarnings});n.shaderInputs&&r.modules.length>0&&o.addModules(r.modules),this.setShaderInputs(o);let s=Ku(this.props.modules,o.getModules()),c={...r.defines,...this.props.defines};if(this.device.type===`webgl`&&(this.props._uniformBlockLayouts=Gu(s)),this.props.shaderLayout=Hu(this.props.shaderLayout,s)||null,this.device.type===`webgpu`&&this.props.source){let n=this.props.shaderAssembler;P(Yd(n,`wgsl`));let{source:i,getUniforms:a,bindingTable:o,entryPoints:l={},shaderLayout:u}=n.assembleWGSLShader({platformInfo:e,...this.props,modules:s,defines:c,pluginInjectionTargets:r.injectionTargets,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.source=i,this.props.vertexEntryPoint=l.vertex||this.props.vertexEntryPoint,this.props.fragmentEntryPoint=l.fragment||this.props.fragmentEntryPoint,this._getModuleUniforms=a,this._bindingTable=o;let d=Xd(u??t.getShaderLayout?.(this.source),r.vertexInputs),f=Uu(this.props.shaderLayout,d,Object.keys(r.vertexInputs));this.props.shaderLayout=Hu(f||null,s)||null}else{let t=this.props.shaderAssembler;P(Yd(t,`glsl`));let{vs:n,fs:i,getUniforms:a}=t.assembleGLSLShaderPair({platformInfo:e,...this.props,modules:s,defines:c,pluginInjectionTargets:r.injectionTargets,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.vs=n,this.fs=i,this._getModuleUniforms=a,this._bindingTable=[]}this.pipelineFactory=n.pipelineFactory||ce.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||de.getDefaultShaderFactory(this.device);let l=ce.getAsyncCompilation(this.device);l?(this._pipelineInitialization=this._initializePipelineAsync(n),l.push(this._pipelineInitialization)):(this.pipeline=this._updatePipeline(),this._initializePipelineResources(n))}catch(t){try{e.prototype.destroy.call(this)}finally{throw t}}}_initializeProps(e){e.geometry&&this.setGeometry(e.geometry),e.attributeVectors&&this.setAttributeVectors(e.attributeVectors)}_usesManagedUniformBuffer(e){return!0}async _initializePipelineAsync(e){await this._updatePipelineAsync(),this._initializePipelineResources(e)}_initializeAttributes(){this.applyVectorAttributes(),this.indexVector&&this.bindIndexVector()}_initializePipelineResources(e){this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._initializeAttributes(),e.indexBuffer&&this.setIndexBuffer(e.indexBuffer),e.indexCount!==void 0&&this.setIndexCount(e.indexCount),this.constructorDrawOffsets.firstVertex!==void 0&&(this.firstVertex=this.constructorDrawOffsets.firstVertex),this.constructorDrawOffsets.firstIndex!==void 0&&(this.firstIndex=this.constructorDrawOffsets.firstIndex),e.isInstanced!==void 0&&(this.isInstanced=e.isInstanced),this.constructorDrawCounts.instanceCount!==void 0&&this.setInstanceCount(this.constructorDrawCounts.instanceCount),this.constructorDrawCounts.vertexCount!==void 0&&this.setVertexCount(this.constructorDrawCounts.vertexCount),e.attributes&&this.setAttributes(e.attributes),e.constantAttributes&&this.setConstantAttributes(e.constantAttributes),e.bindings&&this.setBindings(e.bindings),e.transformFeedback&&(this.transformFeedback=e.transformFeedback)}destroy(){this._destroyed||=(this.pipeline&&(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.pipeline.vs),this.pipeline.fs&&this.pipeline.fs!==this.pipeline.vs&&this.shaderFactory.release(this.pipeline.fs)),this.vertexArray?.destroy(),this.geometryVectorBindings.destroy(),this.attributeVectorBindings.destroy(),this._uniformStore?.destroy(),this.batchUniformBuffer?.destroy(),!0)}needsRedraw(){this._getBindingsUpdateTimestamp()>this._lastDrawTimestamp&&this.setNeedsRedraw(`contents of bound textures or buffers updated`);let e=this._needsRedraw;return this._needsRedraw=!1,e}setNeedsRedraw(e){this._needsRedraw||=e}getBindingDebugTable(){return this._bindingTable}predraw(e){this._syncDynamicBuffers(),this.updateShaderInputs(e),this.pipeline=this._updatePipeline()}draw(e,t){return t?.parameters?this._withDrawParameters(e,t.parameters,()=>this._draw(e)):this._draw(e)}_withDrawParameters(e,t,n){let r=e.getParameters();try{return e.setParameters(t),n()}finally{e.setParameters(r)}}_draw(e){if(this.indexVector?.length===0)return this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1,!0;if(!this.drawingVectorBatches&&(this.geometryVectorBindings.batchCount!==1||this.attributeVectorBindings.batchCount!==1))return this.drawVectorGroups(e);if(this._drawBlockedReason&&!this._pipelineNeedsUpdate)return F.info(Wd,`>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)(),!1;let t=this._areBindingsLoading();if(t)return F.info(Wd,`>>> DRAWING ABORTED ${this.id}: ${t} not loaded`)(),!1;this._syncAttachmentFormats(e);try{e.pushDebugGroup(`${this}.predraw(${e})`),this.device.type===`webgpu`?(this.updateShaderInputs(),this._syncDynamicBuffers(),this.pipeline=this._updatePipeline()):this.predraw(this.device.commandEncoder)}finally{e.popDebugGroup()}let n,r=this.pipeline.isErrored;try{if(e.pushDebugGroup(`${this}.draw(${e})`),this._logDrawCallStart(),this.pipeline=this._updatePipeline(),r=this.pipeline.isErrored,r)F.info(Wd,`>>> DRAWING ABORTED ${this.id}: ${Kd}`)(),n=!1;else{let t=this.vertexArray.getDrawValidationError();if(t)F.info(Wd,`>>> DRAWING ABORTED ${this.id}: ${t}`)(),this._drawBlockedReason=t,n=!1;else{let t=this._getCurrentShaderLayout(),r=this._getBindings(t),i=this._getBindGroups(t,r),{indexBuffer:a}=this.vertexArray,o=a?this.indexCount??(this._vertexCountSet?this.vertexCount:a.byteLength/(a.indexType===`uint32`?4:2)):void 0;e.setPipeline(this.pipeline),e.setBindings(i,{_bindGroupCacheKeys:this._getBindGroupCacheKeys()}),e.setVertexArray(this.vertexArray),n=this.isInstanced===!0&&this.instanceCount===0?!0:e.draw({isInstanced:this.isInstanced,vertexCount:this.vertexCount,instanceCount:this.isInstanced?this.instanceCount:void 0,indexCount:o,firstVertex:this.firstVertex,firstIndex:this.firstIndex,transformFeedback:this.transformFeedback||void 0,uniforms:this.props.uniforms,parameters:this.parameters,topology:this.topology})}}}finally{e.popDebugGroup(),this._logDrawCallEnd()}return this._logFramebuffer(e),n?(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1):r?(this._needsRedraw=Kd,this._drawBlockedReason=Kd):this._drawBlockedReason?this._needsRedraw=this._drawBlockedReason:this._needsRedraw=`waiting for resource initialization`,n}setGeometry(e){e&&this.setTopology(e.topology),this.setGeometryVectors(e?.attributes??{},e?.bufferLayout),this.setIndexVector(e?.indices??null),e?.vertexCount!==void 0&&this.setVertexCount(e.vertexCount)}setGeometryVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.geometryVectorBindings.sourceLayouts),this.validateVectorLengthPolicy(),this.props.enforceMatchingVectorLengths&&nd(e),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||this.attributeVectorBindings.vertexCount!==void 0)&&nd([...Object.values(e),...Object.values(this.attributeVectorBindings.inputs)]),this.geometryVectorBindings.setInputs(e,t,`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.geometryVectorBindings),this.syncVectorBindings();let n=this.geometryVectorBindings.rowCount;P(n===void 0||this.attributeVectorBindings.vertexCount===void 0||n===this.attributeVectorBindings.vertexCount),this.props.inferDrawCount===`vertex`&&this.setVertexCount(n??this.attributeVectorBindings.vertexCount??0)}setAttributeVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.attributeVectorBindings.sourceLayouts),this.isInstanced===void 0&&(t?.some(e=>e.stepMode===`instance`)||Object.values(e).some(e=>e&&`data`in e&&e.bufferLayout?.stepMode===`instance`))&&(this.isInstanced=!0);let n=!this.isInstanced||Object.entries(e).some(([e,n])=>n&&`data`in n&&(t?.find(t=>t.name===e||t.attributes?.some(t=>t.attribute===e))?.stepMode??n.bufferLayout?.stepMode)===`vertex`);this.validateVectorLengthPolicy(),n&&this.props.enforceMatchingVectorLengths&&nd([...Object.values(this.geometryVectorBindings.inputs),...Object.values(e)]),this.attributeVectorBindings.setInputs(e,t,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.claimVectorLayouts(this.attributeVectorBindings),this.syncVectorBindings(),this.props.inferDrawCount===`instance`&&this.attributeVectorBindings.instanceCount!==void 0&&this.setInstanceCount(this.attributeVectorBindings.instanceCount);let r=this.attributeVectorBindings.vertexCount;if(r!==void 0&&this.props.inferDrawCount===`vertex`){let e=this.geometryVectorBindings.rowCount;P(e===void 0||e===r),e===void 0&&this.setVertexCount(r)}}setGPUAttributes(e,t){this.setAttributeVectors(e,t)}setIndexVector(e){e&&(P(e.format===`uint8`||e.format===`uint16`||e.format===`uint32`),P(e.data.length<=1),P(e.byteStride===(e.format===`uint32`?4:e.format===`uint16`?2:1))),this.indexVector=e,this.vertexArray&&this.bindIndexVector()}bindIndexVector(){let e=this.indexVector,t=e?.data[0];t&&this.indexVector&&P((t.buffer instanceof se?t.buffer.buffer:t.buffer).indexType===this.indexVector.format&&t.byteOffset%this.indexVector.byteStride===0),this.indexVector=null,this.setIndexBuffer(t?.buffer??null),this.indexVector=e,this.indexCount=e?.length,this.setDrawOffsets({firstVertex:t?.byteOffset??0,firstIndex:t?t.byteOffset/this.indexVector.byteStride:0})}claimVectorLayouts(e){this.explicitBufferLayout=this.explicitBufferLayout.filter(t=>!e.claimedNames.has(t.name)&&!t.attributes?.some(t=>e.claimedNames.has(t.attribute)))}getExplicitVectorLayouts(e,t=this.explicitBufferLayout){let n=new Set(Object.keys(e)),r=t.filter(e=>n.has(e.name)||e.attributes?.some(e=>n.has(e.attribute)));return r.length?r:void 0}getVectorBufferLayout(){let e=[this.geometryVectorBindings,this.attributeVectorBindings];return[...this.explicitBufferLayout.filter(t=>!e.some(e=>e.claimedNames.has(t.name)||t.attributes?.some(t=>e.claimedNames.has(t.attribute)))),...this.geometryVectorBindings.layouts,...this.attributeVectorBindings.layouts]}syncVectorBindings(){let e=this.getVectorBufferLayout();this.vertexArray?(this.applyBufferLayout(e),this.applyVectorAttributes()):this.bufferLayout=e}applyVectorAttributes(){let e=new Set(this.bufferLayout.map(e=>e.name));for(let t of Object.keys(this.currentAttributes))e.has(t)||delete this.currentAttributes[t];this.setAttributes({...this.currentAttributes,...this.geometryVectorBindings.buffers,...this.attributeVectorBindings.buffers},{byteOffsets:{...this.currentAttributeByteOffsets,...this.geometryVectorBindings.byteOffsets,...this.attributeVectorBindings.byteOffsets},disableWarnings:!0}),this.device.type===`webgl`&&this.setConstantAttributes({...this.geometryVectorBindings.constants,...this.attributeVectorBindings.constants})}setGPUVectors(e,t){let n=ed(this.id,e);P(n.length<=1),$u(this.id,e,this.bufferLayout),n[0]&&this.setGPUData(n[0].data),this.setBatchDrawCount(n[0]?.rowCount??0,t?.count)}drawVectorGroups(t){let n=this.drawingVectorBatches,r=this._vertexCountSet;this.drawingVectorBatches=!0;try{let n=rd(this,this.geometryVectorBindings,this.attributeVectorBindings,()=>this.syncVectorBindings(),()=>e.prototype.draw.call(this,t),this.props.inferDrawCount);return n&&(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1),n}finally{this._vertexCountSet=r,this.drawingVectorBatches=n}}drawBatches(t,{vectors:n,onBatch:r}){let i=ed(this.id,n);$u(this.id,n,this.bufferLayout);for(let e of Object.keys(n))P(!n[e]||this.currentAttributes[e]);let a={...this.currentAttributes},o={...this.currentAttributeByteOffsets},s={...this.bindings},c=this.instanceCount,l=this.vertexCount,u=this.isInstanced,d=this._vertexCountSet,f=this.drawingVectorBatches,p=this.device.type===`webgpu`&&i.length?new ru(this.device,this.shaderInputs.modules):void 0;if(p&&this._uniformStore.uniformBuffers.size){this.batchUniformBuffer??=new Ou(this.device);let e=0;for(let t of this._uniformStore.uniformBuffers.keys())e+=this.batchUniformBuffer.getAlignedByteLength(p.getUniformBufferData(t).byteLength);this.batchUniformBuffer.prepare(e*i.length)}this.drawingVectorBatches=!0;let m=!0;try{for(let n of i){this.setGPUData(n.data),this.setBatchDrawCount(n.rowCount),r?.(n);let i={};try{if(p){p.setUniforms(this.shaderInputs.getUniformValues());for(let[e,t]of this._uniformStore.uniformBuffers){let n=`${e}Uniforms`;this.bindings[n]===t&&(i[n]=t,this.setBindings({[n]:this.batchUniformBuffer.write(p.getUniformBufferData(e))}))}}m=e.prototype.draw.call(this,t)&&m}finally{this.setBindings(i)}}}finally{p?.destroy(),this.setAttributes(a,{byteOffsets:o});for(let e of Object.keys(this.bindings))e in s||delete this.bindings[e];this.setBindings(s),this.setInstanceCount(c),this.setVertexCount(l),this.isInstanced=u,this._vertexCountSet=d,this.drawingVectorBatches=f}return m}setGPUData(e){this.setAttributes(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t.buffer])),{byteOffsets:Object.fromEntries(Object.entries(e).map(([e,t])=>{let n=this.bufferLayout.find(t=>t.name===e),r=t.byteOffset-(n?.attributes?.[0]?.byteOffset??0);return P(r>=0),[e,r]}))})}validateVectorLengthPolicy(){P(this.props.enforceMatchingVectorLengths!==!1||this.props.inferDrawCount===`no`)}setBatchDrawCount(e,t=this.props.inferDrawCount===`no`?`none`:this.props.inferDrawCount){t===`instance`?this.setInstanceCount(e):t===`vertex`&&this.setVertexCount(e)}setTopology(e){e!==this.topology&&(this.topology=e,this._setPipelineNeedsUpdate(`topology`))}setBufferLayout(e){this.explicitBufferLayout=e;let t=this.geometryVectorBindings,n=this.attributeVectorBindings,r=this.getExplicitVectorLayouts(t.inputs)??t.sourceLayouts,i=this.getExplicitVectorLayouts(n.inputs)??n.sourceLayouts;t.setInputs(t.inputs,r,`vertex`,this.props.enforceMatchingVectorLengths),n.setInputs(n.inputs,i,this.isInstanced?`instance`:`vertex`,this.props.enforceMatchingVectorLengths),this.props.enforceMatchingVectorLengths&&(!this.isInstanced||n.vertexCount!==void 0)&&nd([...Object.values(t.inputs),...Object.values(n.inputs)]),this.claimVectorLayouts(t),this.claimVectorLayouts(n),this.applyBufferLayout(this.getVectorBufferLayout())}applyBufferLayout(e){if(e=Vu(this.pipeline.shaderLayout,e),zu(e,this.bufferLayout,-1))return;this.bufferLayout=e,this._setPipelineNeedsUpdate(`bufferLayout`),this.pipeline=this._updatePipeline();let t=this.vertexArray;this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),t.destroy(),this._dynamicAttributeBufferSources={},this.applyVectorAttributes(),this.indexBuffer&&this.vertexArray.setIndexBuffer(this.indexBuffer)}setParameters(e){zu(e,this.parameters,2)||(this.parameters=e,this.device.type===`webgl`?this.setNeedsRedraw(`parameters`):this._setPipelineNeedsUpdate(`parameters`))}setInstanceCount(e){this.instanceCount=e,this.isInstanced===void 0&&e>0&&(this.isInstanced=!0),this.setNeedsRedraw(`instanceCount`)}setVertexCount(e){this.vertexCount=e,this._vertexCountSet=!0,this.setNeedsRedraw(`vertexCount`)}setIndexCount(e){this.indexCount=e,this.setNeedsRedraw(`indexCount`)}setDrawOffsets({firstVertex:e,firstIndex:t}){this.firstVertex=e,this.firstIndex=t,this.setNeedsRedraw(`drawOffsets`)}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new ru(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(Wu(t)&&this._usesManagedUniformBuffer(e)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.setNeedsRedraw(`shaderInputs`)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this.setBindings(this._getShaderInputBindings()),this.setNeedsRedraw(`shaderInputs`)}_getShaderInputBindings(){return this.shaderInputs.getBindingValues()}setBindings(e){Object.assign(this.bindings,e),this.setNeedsRedraw(`bindings`)}setTransformFeedback(e){this.transformFeedback=e,this.setNeedsRedraw(`transformFeedback`)}setIndexBuffer(e){this.indexVector&&(this.indexCount=void 0,this.firstVertex=0,this.firstIndex=0),this.indexVector=null;let t=e instanceof se?e.buffer:e;this.indexBuffer=t,this._dynamicIndexBufferSource=e instanceof se?{source:e,generation:e.generation}:null,this.vertexArray.setIndexBuffer(t),this.setNeedsRedraw(`indexBuffer`)}setAttributes(e,t){Object.assign(this.currentAttributes,e);for(let n of Object.keys(e))this.currentAttributeByteOffsets[n]=t?.byteOffsets?.[n]??0;this._drawBlockedReason=!1;let n=t?.disableWarnings??this.props.disableWarnings;e.indices&&F.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)(),this.bufferLayout=Vu(this.pipeline.shaderLayout,this.bufferLayout);let r=new Bu(this.bufferLayout);for(let[i,a]of Object.entries(e)){let e=a instanceof se?a.buffer:a,o=r.getBufferLayout(i);if(!o){n||F.warn(`Model(${this.id}): Missing layout for buffer "${i}".`)();continue}let s=r.getAttributeNamesForBuffer(o),c=!1;for(let r of s){let o=this._attributeInfos[r];if(o){let r=this.device.type===`webgpu`?this.vertexArray.getBufferSlot(o.bufferName):o.location;if(r===null){n||F.warn(`Model(${this.id}): Missing vertex array slot for buffer "${o.bufferName}".`)();continue}let s=t?.byteOffsets?.[i]??0;this.vertexArray.setBuffer(r,e,s),a instanceof se?this._dynamicAttributeBufferSources[r]={source:a,generation:a.generation,byteOffset:s}:delete this._dynamicAttributeBufferSources[r],c=!0}}!c&&!n&&F.warn(`Model(${this.id}): Ignoring buffer "${e.id}" for unknown attribute "${i}"`)()}this.setNeedsRedraw(`attributes`)}setConstantAttributes(e,t){for(let[n,r]of Object.entries(e)){let e=this._attributeInfos[n];e?this.vertexArray.setConstantWebGL(e.location,r):(t?.disableWarnings??this.props.disableWarnings)||F.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${n}"`)()}this.setNeedsRedraw(`constants`)}_areBindingsLoading(){for(let e of Object.values(this.bindings))if(Vd(e)&&!e.isReady)return e.id;return!1}_getBindings(e=this._getCurrentShaderLayout()){let t={};for(let[n,r]of Object.entries(this.bindings)){let i=Zd(n,r,e);i&&(t[n]=i)}return t}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){return e.bindings.length?g(e,t):{0:t}}_getBindGroupCacheKeys(){return{}}_getBindingsUpdateTimestamp(){let e=0;this._dynamicIndexBufferSource&&(e=Math.max(e,this._dynamicIndexBufferSource.source.updateTimestamp));for(let t of Object.values(this._dynamicAttributeBufferSources))e=Math.max(e,t.source.updateTimestamp);for(let t of Object.values(this.bindings))t instanceof m?e=Math.max(e,t.texture.updateTimestamp):t instanceof I||t instanceof L||t instanceof ze||t instanceof se?e=Math.max(e,t.updateTimestamp):Vd(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:me(t)&&(e=Math.max(e,(t.buffer instanceof se,t.buffer.updateTimestamp)));return e}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate||=e,this._drawBlockedReason=!1,this.setNeedsRedraw(e)}_updatePipeline(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=this.pipelineFactory.createRenderPipeline(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createRenderPipelineAsync(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?.vs??null,t=this.pipeline?.fs??null;this.pipeline&&F.log(1,`GPUVectorModel ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1;let n=null,r=null;try{n=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:`vertex`,source:this.source||this.vs,debugShaders:this.props.debugShaders}),this.source?r=n:this.fs&&(r=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`fragment`,source:this.fs,debugShaders:this.props.debugShaders}))}catch(e){throw this._releasePipelineShaders(n,r),this._pipelineNeedsUpdate=`shader creation failed`,e}return{props:{...this.props,bindings:void 0,bufferLayout:this.bufferLayout,colorAttachmentFormats:this._colorAttachmentFormats,depthStencilAttachmentFormat:this._depthStencilAttachmentFormat,topology:this.topology,parameters:this.parameters,bindGroups:void 0,vs:n,fs:r},vertexShader:n,fragmentShader:r,previousVertexShader:e,previousFragmentShader:t}}_finishPipelineUpdate(e){this._attributeInfos=Ve(this.pipeline.shaderLayout,this.bufferLayout),this._releasePipelineShaders(e.previousVertexShader,e.previousFragmentShader)}_releasePipelineShaders(e,t){e&&this.shaderFactory.release(e),t&&t!==e&&this.shaderFactory.release(t)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=F.level>3?0:Gd;F.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,F.group(Wd,`>>> DRAWING MODEL ${this.id}`,{collapsed:F.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=ku(this.pipeline.shaderLayout,this.id);F.table(Wd,e)();let t=this.shaderInputs.getDebugTable();F.table(Wd,t)();let n=this._getAttributeDebugTable();F.table(Wd,this._attributeInfos)(),F.table(Wd,n)(),F.groupEnd(Wd)(),this._logOpen=!1}}_drawCount=0;_logFramebuffer(e){let t=this.device.props.debugFramebuffers;if(this._drawCount++,!t)return;let n=e.props.framebuffer;Mu(e,n,{id:n?.id||`${this.id}-framebuffer`,minimap:!0})}_getAttributeDebugTable(){let e={};for(let[t,n]of Object.entries(this._attributeInfos)){let r=this.vertexArray.attributes[n.location];e[n.location]={name:t,type:n.shaderType,values:r?this._getBufferOrConstantValues(r,n.bufferDataType):`null`}}if(this.vertexArray.indexBuffer){let{indexBuffer:t}=this.vertexArray,n=t.indexType===`uint32`?new Uint32Array(t.debugData):new Uint16Array(t.debugData);e.indices={name:`indices`,type:t.indexType,values:n.toString()}}return e}_getBufferOrConstantValues(e,t){let n=_e.getTypedArrayConstructor(t);return(e instanceof I?new n(e.debugData):e).toString()}_getCurrentShaderLayout(){return this.pipeline?.shaderLayout||this.props.shaderLayout||{bindings:[]}}_syncDynamicBuffers(){if(this._dynamicIndexBufferSource&&this._dynamicIndexBufferSource.generation!==this._dynamicIndexBufferSource.source.generation){let e=this._dynamicIndexBufferSource.source.buffer;this.indexBuffer=e,this.vertexArray.setIndexBuffer(e),this._dynamicIndexBufferSource.generation=this._dynamicIndexBufferSource.source.generation,this.setNeedsRedraw(`dynamic index buffer`)}for(let[e,t]of Object.entries(this._dynamicAttributeBufferSources))t.generation!==t.source.generation&&(this.vertexArray.setBuffer(Number(e),t.source.buffer,t.byteOffset),t.generation=t.source.generation,this.setNeedsRedraw(`dynamic attribute buffer`))}_syncAttachmentFormats(e){if(this.device.type!==`webgpu`)return;let t=e.framebuffer||e.props.framebuffer,n=e.props,r=n.colorAttachmentFormats??t?.colorAttachments?.map(e=>Qd(e?.texture?.format)),i=n.depthStencilAttachmentFormat===!1?void 0:n.depthStencilAttachmentFormat??$d(t?.depthStencilAttachment?.props?.format??t?.depthStencilAttachment?.texture?.format);(!zu(this._colorAttachmentFormats,r,1)||this._depthStencilAttachmentFormat!==i)&&(this._colorAttachmentFormats=r,this._depthStencilAttachmentFormat=i,this._setPipelineNeedsUpdate(`attachment formats`))}};function Yd(e,t){return e.shaderLanguage!==void 0&&e.shaderLanguage!==t?!1:t===`glsl`?`assembleGLSLShaderPair`in e&&typeof e.assembleGLSLShaderPair==`function`:`assembleWGSLShader`in e&&typeof e.assembleWGSLShader==`function`}function Xd(e,t){return!e||Object.keys(t).length===0?e:{...e,attributes:e.attributes.map(e=>{let n=e.name.startsWith(`_luma_`)?e.name.slice(6):null;return n&&t[n]?{...e,name:n}:e})}}function Zd(e,t,n){if(Vd(t)){let r=Ud(n,e,{fallbackGroup:0});return r?t.resolveTextureBinding(r):null}return t instanceof se?t.buffer:me(t)?re(t):t}function Qd(e){return e&&!ef(e)?e:null}function $d(e){return e&&ef(e)?e:void 0}function ef(e){return qd.includes(e)}var tf=class{id;userData={};topology;bufferLayout=[];vertexCount;indices;attributes;constructor(e){if(this.id=e.id||Qu(`geometry`),this.topology=e.topology,this.indices=e.indices||null,this.attributes=e.attributes,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout||[],this.indices&&!(this.indices.usage&I.INDEX))throw Error(`Index buffer must have INDEX usage`)}destroy(){this.indices?.destroy();for(let e of Object.values(this.attributes))e.destroy()}getVertexCount(){return this.vertexCount}getAttributes(){return this.attributes}getIndexes(){return this.indices||null}_calculateVertexCount(e){return e.byteLength/12}};function nf(e,t){if(t instanceof tf)return t;let n=mu(t),r=rf(e,n),{attributes:i,bufferLayout:a}=af(e,n);return new tf({topology:n.topology||`triangle-list`,bufferLayout:a,vertexCount:n.vertexCount,indices:r,attributes:i})}function rf(e,t){if(!t.indices)return;let n=t.indices.value;return e.createBuffer({usage:I.INDEX,data:n})}function af(e,t){let n={};for(let[r,i]of Object.entries(t.attributes)){let a=t.bufferLayout?.find(e=>e.name===r)?.name||fu(r);i&&(n[a]=e.createBuffer({data:i.value,id:`${r}-buffer`}))}return{attributes:n,bufferLayout:t.bufferLayout||pu(t.attributes),vertexCount:t.vertexCount}}var of=class{attributes;indices;topology;vertexCount;bufferLayout;destroy(){}constructor(e){this.attributes=e.attributes,this.indices=e.indices??null,this.topology=e.topology??`triangle-list`,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout}};function sf(e){let t={};for(let[n,r]of Object.entries(e.attributes)){let i=e.bufferLayout.find(e=>e.name===n),a=i?.format,o=i?.byteStride??(a?xe.getVertexFormatInfo(a).byteLength:0),s=e.indices&&o?Math.floor(r.byteLength/o):e.vertexCount;t[n]={name:n,format:a,length:s,byteStride:o,rowByteLength:o,bufferLayout:i,data:[{buffer:r,byteOffset:0,length:s,format:a,byteStride:o,rowByteLength:o}]}}if(e.indices){let e=Math.min(...Object.values(t).map(e=>e.length));for(let[n,r]of Object.entries(t))t[n]={...r,length:e,data:r.data.map(t=>({...t,length:e}))}}let n=e.indices,r=n?.indexType===`uint32`?4:n?.indexType===`uint8`?1:2,i=n?n.byteLength/r:0;return new of({attributes:t,indices:n?{name:`indices`,format:n.indexType,length:i,byteStride:r,rowByteLength:r,data:[{buffer:n,byteOffset:0,length:i,format:n.indexType,byteStride:r,rowByteLength:r}]}:null,topology:e.topology,vertexCount:e.vertexCount,bufferLayout:e.bufferLayout})}var cf=class extends Jd{static defaultProps={...Jd.defaultProps,material:void 0};get sourceGeometry(){return this.sourceGeometryValue}constructor(e,t){let n=t.geometry===void 0?new.target.defaultProps.geometry:t.geometry,r=n&&!(n instanceof of)?nf(e,n):null,i=r?sf(r):n,a={...t,geometry:i instanceof of?i:null};try{super(e,a)}catch(e){throw r?.destroy(),e}this._gpuGeometry=r,this.sourceGeometryValue=n,r&&this.setIndexCount(this.props.indexCount)}_initializeProps(e){this.material=e.material||null,this._gpuGeometry=null,this.sourceGeometryValue=null,super._initializeProps(e)}_initializeAttributes(){super._initializeAttributes(),this._gpuGeometry&&super.setIndexCount(this.indexCountOverride)}destroy(){super.destroy(),this._gpuGeometry?.destroy(),this._gpuGeometry=null,this.sourceGeometryValue=null}setGeometry(e){this._gpuGeometry?.destroy(),this._gpuGeometry=e&&!(e instanceof of)?nf(this.device,e):null;let t=this._gpuGeometry?sf(this._gpuGeometry):e;super.setGeometry(t instanceof of?t:null),e instanceof of||super.setIndexCount(this.indexCountOverride),this.sourceGeometryValue=e}setIndexCount(e){this.indexCountOverride=e,super.setIndexCount(e)}setMaterial(e){this.material=e,this.setNeedsRedraw(`material`)}_usesManagedUniformBuffer(e){return!this.material?.ownsModule(e)}updateShaderInputs(e){super.updateShaderInputs(e),this.material?.updateShaderInputs(e)}_getShaderInputBindings(){let e=super._getShaderInputBindings(),t=this.material;return t?Object.fromEntries(Object.entries(e).filter(([e])=>!t.ownsBinding(e))):e}_areBindingsLoading(){let e=super._areBindingsLoading();if(e)return e;for(let e of Object.values(this.material?.bindings||{}))if(Vd(e)&&!e.isReady)return e.id;return!1}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){let n=super._getBindGroups(e,t);for(let[t,r]of Object.entries(this.material?.getBindingsByGroup(e)||{})){let e=Number(t);n[e]={...n[e]||{},...r}}return n}_getBindGroupCacheKeys(){let e=this.material?.getBindGroupCacheKey(3);return e?{3:e}:{}}_getBindingsUpdateTimestamp(){return Math.max(super._getBindingsUpdateTimestamp(),this.material?.getBindingsUpdateTimestamp()||0)}},lf=35980,uf=35981,df=class e{device;model;transformFeedback;outputVectorBindings={};outputBuffers={};static defaultProps={...Jd.defaultProps,inputVectors:void 0,outputVectors:void 0,feedbackBufferMode:`separate`,outputs:void 0,feedbackBuffers:void 0};static isSupported(e){return e?.info?.type===`webgl`}constructor(t,n=e.defaultProps){if(!e.isSupported(t))throw Error(`BufferTransform not yet implemented on WebGPU`);this.device=t,this.outputBuffers=n.feedbackBuffers||{};let{inputVectors:r,outputVectors:i,...a}=n;this.model=new Jd(this.device,{id:n.id||`buffer-transform-model`,fs:n.fs||je(),topology:n.topology||`point-list`,varyings:n.outputs||n.varyings,...a,bufferMode:n.bufferMode||(n.feedbackBufferMode===`interleaved`?lf:uf)}),this.transformFeedback=this.device.createTransformFeedback({layout:this.model.pipeline.shaderLayout,buffers:n.feedbackBuffers}),this.model.setTransformFeedback(this.transformFeedback),r&&this.model.setGPUVectors(r,{count:`vertex`}),i&&this.setOutputVectors(i)}destroy(){this.model&&this.model.destroy()}delete(){this.destroy()}run(e){let{inputVectors:t,outputVectors:n,inputBuffers:r,outputBuffers:i,...a}=e??{};r&&this.model.setAttributes(r),t&&this.model.setGPUVectors(t,{count:`vertex`}),i&&(this.outputBuffers=i),(i||n||Object.keys(this.outputVectorBindings).length>0)&&this.setOutputVectors(n??this.outputVectorBindings);let o=this.device.beginRenderPass({discard:!0,...a});try{this.model.draw(o)}finally{o.end()}}setOutputVectors(e){let t=ed(this.model.id,e);P(t.length===0||this.model.pipeline.props.bufferMode!==lf),P(t.length<=1),this.outputVectorBindings=e,this.transformFeedback.setBuffers({...this.outputBuffers,...Object.fromEntries(Object.entries(t[0]?.data??{}).map(([e,t])=>(P(t.byteStride===t.rowByteLength),[e,{buffer:t.buffer instanceof se?t.buffer.buffer:t.buffer,byteOffset:t.byteOffset,byteLength:t.length*t.byteStride}])))})}getBuffer(e){return this.transformFeedback.getBuffer(e)}readAsync(e){let t=this.getBuffer(e);if(!t)throw Error(`BufferTransform#getBuffer`);if(t instanceof I)return t.readAsync();let{buffer:n,byteOffset:r=0,byteLength:i=n.byteLength}=t;return n.readAsync(r,i)}},ff=`struct VertexInputs {
  @location(0) clipSpacePositions: vec2<f32>,
  @location(1) texCoords: vec2<f32>,
  @location(2) coordinates: vec2<f32>
}

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) position : vec2<f32>,
  @location(1) coordinate : vec2<f32>,
  @location(2) uv : vec2<f32>
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  outputs.Position = vec4(inputs.clipSpacePositions, 0., 1.);
  outputs.position = inputs.clipSpacePositions;
  outputs.coordinate = inputs.coordinates;
  outputs.uv = inputs.texCoords;
  return outputs;
}
`,pf=`#version 300 es
in vec2 clipSpacePositions;
in vec2 texCoords;
in vec2 coordinates;

out vec2 position;
out vec2 coordinate;
out vec2 uv;

void main(void) {
  gl_Position = vec4(clipSpacePositions, 0., 1.);
  position = clipSpacePositions;
  coordinate = coordinates;
  uv = texCoords;
}
`,mf=[-1,-1,1,-1,-1,1,1,1],hf=[-1,-1,3,-1,-1,3],gf=class extends cf{constructor(e,t){let{geometryType:n=`quad`,...r}=t,i=n===`triangle`?hf:mf,a=i.map(e=>(e+1)/2),o=i.length/2;r.source&&=`${ff}\n${r.source}`,super(e,{id:r.id||Qu(`clip-space`),...r,vs:pf,vertexCount:o,geometry:new du({topology:n===`triangle`?`triangle-list`:`triangle-strip`,vertexCount:o,attributes:{clipSpacePositions:{size:2,value:new Float32Array(i)},texCoords:{size:2,value:new Float32Array(a)},coordinates:{size:2,value:new Float32Array(a)}}})})}},_f={name:`background`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},vf=`@group(0) @binding(auto) var backgroundTexture: texture_2d<f32>;
@group(0) @binding(auto) var backgroundTextureSampler: sampler;
struct backgroundUniforms {
  scale: vec2<f32>,
  flipY: i32,
};
@group(0) @binding(auto) var<uniform> background: backgroundUniforms;

fn billboardTexture_getTextureUV(uv: vec2<f32>) -> vec2<f32> {
  let scale: vec2<f32> = background.scale;
  var position: vec2<f32> = (uv - vec2<f32>(0.5, 0.5)) / scale + vec2<f32>(0.5, 0.5);
  if (background.flipY != 0) {
    position.y = 1.0 - position.y;
  }
  return position;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let position: vec2<f32> = billboardTexture_getTextureUV(inputs.uv);
  return textureSample(backgroundTexture, backgroundTextureSampler, position);
}
`,yf=`#version 300 es
precision highp float;

uniform sampler2D backgroundTexture;

layout(std140) uniform backgroundUniforms {
  vec2 scale;
  int flipY;
} background;

in vec2 coordinate;
out vec4 fragColor;

vec2 billboardTexture_getTextureUV(vec2 coord) {
  vec2 position = (coord - 0.5) / background.scale + 0.5;
  if (background.flipY != 0) {
    position.y = 1.0 - position.y;
  }
  return position;
}

void main(void) {
  vec2 position = billboardTexture_getTextureUV(coordinate);
  fragColor = texture(backgroundTexture, position);
}
`,bf=class extends gf{backgroundTexture=null;flipY=!1;constructor(e,t){if(super(e,{...t,id:t.id||`background-texture-model`,source:vf,fs:yf,modules:[...t.modules||[],_f],parameters:{depthWriteEnabled:!1,...t.parameters||{},...t.blend?{blend:!0,blendColorOperation:`add`,blendAlphaOperation:`add`,blendColorSrcFactor:`one-minus-dst-alpha`,blendColorDstFactor:`one`,blendAlphaSrcFactor:`one-minus-dst-alpha`,blendAlphaDstFactor:`one`}:{}}}),!t.backgroundTexture)throw Error(`BackgroundTextureModel requires a backgroundTexture prop`);this.setProps(t)}setProps(e){let{backgroundTexture:t}=e;if(e.flipY!==void 0&&(this.flipY=e.flipY,this.backgroundTexture&&this.updateScale(this.backgroundTexture)),t)if(this.setBindings({backgroundTexture:t}),t.isReady){let e=t instanceof Pd?t.texture:t;this.backgroundTexture=e,this.updateScale(e)}else t.ready.then(e=>{this.backgroundTexture=e,this.updateScale(e)})}predraw(e){super.predraw(e)}updateScale(e){if(!e){this.shaderInputs.setProps({background:{scale:[1,1],flipY:0}});return}let[t,n]=this.device.getCanvasContext().getDrawingBufferSize(),r=e.width,i=e.height,a=t/n,o=r/i,s=1,c=1;a>o?c=a/o:s=o/a,this.shaderInputs.setProps({background:{scale:[s,c],flipY:this.flipY?1:0}})}},xf=class{id;current;next;constructor(e){this.id=e.id||`swap`,this.current=e.current,this.next=e.next}destroy(){this.current?.destroy(),this.next?.destroy()}swap(){let e=this.current;this.current=this.next,this.next=e}},Sf=class extends xf{constructor(e,t){t={...t};let{width:n=1,height:r=1}=t,i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-0`,format:i,usage:L.SAMPLE|L.RENDER|L.COPY_SRC|L.COPY_DST,width:n,height:r}):i),a=e.createFramebuffer({...t,colorAttachments:i});i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-1`,format:i,usage:L.SAMPLE|L.RENDER|L.COPY_SRC|L.COPY_DST,width:n,height:r}):i);let o=e.createFramebuffer({...t,colorAttachments:i});super({current:a,next:o});for(let[e,n]of(t.colorAttachments||[]).entries())typeof n==`string`&&(a.attachResource(a.colorAttachments[e].texture),o.attachResource(o.colorAttachments[e].texture))}resize(e){if(e.width===this.current.width&&e.height===this.current.height)return!1;let{current:t,next:n}=this;return this.current=t.clone(e),Cf(this.current),t.destroy(),this.next=n.clone(e),Cf(this.next),n.destroy(),!0}};function Cf(e){for(let t of e.colorAttachments)e.attachResource(t.texture);e.depthStencilAttachment&&e.attachResource(e.depthStencilAttachment.texture)}var wf=2,Tf=1e4,Ef=class e{static async createAsync(t,n){let r=!ce.getAsyncCompilation(t),i=r?ce.beginAsyncCompilation(t):ce.getAsyncCompilation(t),a;try{a=new e(t,n)}finally{r&&ce.endAsyncCompilation(t,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}static defaultProps={...A.defaultProps,id:`unnamed`,handle:void 0,userData:{},source:``,sourceLanguage:void 0,modules:[],defines:{},plugins:[],bindings:void 0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,shaderAssembler:void 0,debugShaders:void 0};device;id;pipelineFactory;shaderFactory;userData={};bindings={};pipeline;source;shader;shaderInputs;_uniformStore;_pipelineNeedsUpdate=`newly created`;_getModuleUniforms;props;_destroyed=!1;_pipelineInitialization;constructor(t,n){if(t.type!==`webgpu`)throw Error(`Computation is only supported in WebGPU`);this.props={...e.defaultProps,...n,shaderAssembler:n.shaderAssembler??e.defaultProps.shaderAssembler??new De},n=this.props,this.id=n.id||Qu(`model`),this.device=t,Object.assign(this.userData,n.userData);let r=ie(t),i=bs(this.props.plugins,r.shaderLanguage);if(i.injectionTargets.length>0)throw Error(`Computation does not support ShaderPlugin render hooks`);if(Object.keys(i.vertexInputs).length>0||Object.keys(i.interStageVariables).length>0)throw Error(`Computation does not support ShaderPlugin vertex inputs or interStageVariables`);let a=xs(this.props.modules,i.modules),o=Object.fromEntries(a.map(e=>[e.name,e]));this.shaderInputs=n.shaderInputs||new dd(o),n.shaderInputs&&i.modules.length>0&&this.shaderInputs.addModules(i.modules),this.setShaderInputs(this.shaderInputs);let s=Ku(this.props.modules,this.shaderInputs?.getModules()),c={...i.defines,...this.props.defines};this.props.shaderLayout=Hu(this.props.shaderLayout,s)||null,this.pipelineFactory=n.pipelineFactory||ce.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||de.getDefaultShaderFactory(this.device);let l=this.props.shaderAssembler;P(l instanceof De);let{source:u,getUniforms:d,entryPoints:f={},shaderLayout:p}=l.assembleWGSLShader({platformInfo:r,...this.props,modules:s,defines:c,shaderStage:`compute`,computeEntryPoint:this.props.entryPoint,scanVertexAttributes:!1,pluginInjections:i.injections});this.source=u,this.props.entryPoint=f.compute||this.props.entryPoint,this._getModuleUniforms=d;let m=p??t.getShaderLayout?.(this.source,{scanVertexAttributes:!1});this.props.shaderLayout=Hu(this.props.shaderLayout||m||null,s)||null;let h=ce.getAsyncCompilation(this.device);h?(this._pipelineInitialization=this._updatePipelineAsync(),h.push(this._pipelineInitialization)):this.pipeline=this._updatePipeline(),n.bindings&&this.setBindings(n.bindings)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shader&&this.shaderFactory.release(this.shader),this._uniformStore.destroy(),!0)}predraw(e){this.updateShaderInputs(e)}dispatch(e,t,n,r){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatch(t,n,r)}finally{this._logDrawCallEnd()}}dispatchIndirect(e,t,n=0){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatchIndirect(t,n)}finally{this._logDrawCallEnd()}}_setPipeline(e){this.pipeline=this._updatePipeline(),this.pipeline.setBindings(this.bindings),e.setPipeline(this.pipeline),e.setBindings({})}setVertexCount(e){}setInstanceCount(e){}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new ru(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(Wu(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}}setShaderModuleProps(e){let t=this._getModuleUniforms(e),n=Object.keys(t).filter(e=>{let n=t[e];return!ld(n)}),r={};for(let e of n)r[e]=t[e],delete t[e]}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e)}setBindings(e){Object.assign(this.bindings,e)}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate=this._pipelineNeedsUpdate||e}_updatePipeline(){let e=this._preparePipelineUpdate();return e&&(this.pipeline=this.pipelineFactory.createComputePipeline(e.props),this._finishPipelineUpdate(e.previousShader)),this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createComputePipelineAsync(e.props)}catch(t){throw this.shaderFactory.release(this.shader),this.shader=e.previousShader,this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e.previousShader)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?this.shader:null;return this.pipeline&&F.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1,this.shader=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`compute`,source:this.source,debugShaders:this.props.debugShaders}),{props:{...this.props,shader:this.shader},previousShader:e}}_finishPipelineUpdate(e){e&&this.shaderFactory.release(e)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=F.level>3?0:Tf;F.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,F.group(wf,`>>> DRAWING MODEL ${this.id}`,{collapsed:F.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=this.shaderInputs.getDebugTable();F.table(wf,e)(),F.groupEnd(wf)(),this._logOpen=!1}}_drawCount=0;_getBufferOrConstantValues(e,t){let n=_e.getTypedArrayConstructor(t);return(e instanceof I?new n(e.debugData):e).toString()}};function Df(e){let{shaderPass:t,action:n,shadingLanguage:r}=e;switch(n){case`filter`:let e=`${t.name}_filterColor_ext`;return r===`wgsl`?Of(e):Af(e);case`sample`:let n=`${t.name}_sampleColor`;return r===`wgsl`?kf(n):jf(n);default:throw Error(`${t.name} no fragment shader generated for shader pass`)}}function Of(e){return`\
@group(0) @binding(auto) var sourceTexture: texture_2d<f32>;
@group(0) @binding(auto) var sourceTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let texCoord = shaderPassRenderer_getTextureUV(inputs.coordinate);
  let texSize = vec2f(textureDimensions(sourceTexture));

  var fragColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  fragColor = ${e}(fragColor, texSize, texCoord);
  return fragColor;
}
`}function kf(e){return`\
@group(0) @binding(auto) var sourceTexture: texture_2d<f32>;
@group(0) @binding(auto) var sourceTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let texCoord = shaderPassRenderer_getTextureUV(inputs.coordinate);
  let texSize = vec2f(textureDimensions(sourceTexture));
  return ${e}(sourceTexture, sourceTextureSampler, texSize, texCoord);
}
`}function Af(e){return`\
#version 300 es

uniform sampler2D sourceTexture;

in vec2 position;
in vec2 coordinate;
in vec2 uv;

out vec4 fragColor;

void main() {
  vec2 texCoord = shaderPassRenderer_getTextureUV(coordinate);
  ivec2 iTexSize = textureSize(sourceTexture, 0);
  vec2 texSize = vec2(float(iTexSize.x), float(iTexSize.y));

  fragColor = texture(sourceTexture, texCoord);
  fragColor = ${e}(fragColor, texSize, texCoord);
}
`}function jf(e){return`\
#version 300 es

uniform sampler2D sourceTexture;

in vec2 position;
in vec2 coordinate;
in vec2 uv;

out vec4 fragColor;

void main() {
  vec2 texCoord = shaderPassRenderer_getTextureUV(coordinate);
  ivec2 iTexSize = textureSize(sourceTexture, 0);
  vec2 texSize = vec2(float(iTexSize.x), float(iTexSize.y));

  fragColor = ${e}(sourceTexture, texSize, texCoord);
}
`}var Mf={name:`textureTransform`,source:`
struct textureTransformUniforms {
  scale: vec2<f32>,
  flipY: i32,
};
@group(0) @binding(auto) var<uniform> textureTransform: textureTransformUniforms;

fn shaderPassRenderer_getTextureUV(uv: vec2f) -> vec2f {
  var position = (uv - vec2f(0.5, 0.5)) / textureTransform.scale + vec2f(0.5, 0.5);
  if (textureTransform.flipY != 0) {
    position.y = 1.0 - position.y;
  }
  return position;
}

fn shaderPassRenderer_getRenderTargetUV(textureUV: vec2f) -> vec2f {
  let unscaledCoord = (textureUV - vec2f(0.5, 0.5)) * textureTransform.scale + vec2f(0.5, 0.5);
  return select(vec2f(unscaledCoord.x, 1.0 - unscaledCoord.y), unscaledCoord, textureTransform.flipY != 0);
}
`,fs:`
layout(std140) uniform textureTransformUniforms {
  vec2 scale;
  int flipY;
} textureTransform;

vec2 shaderPassRenderer_getTextureUV(vec2 coord) {
  vec2 position = (coord - 0.5) / textureTransform.scale + 0.5;
  if (textureTransform.flipY != 0) {
    position.y = 1.0 - position.y;
  }
  return position;
}

vec2 shaderPassRenderer_getRenderTargetUV(vec2 textureUV) {
  vec2 unscaledCoord = (textureUV - 0.5) * textureTransform.scale + 0.5;
  return textureTransform.flipY != 0 ? unscaledCoord : vec2(unscaledCoord.x, 1.0 - unscaledCoord.y);
}
`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},Nf=new Set([`original`,`previous`]),Pf=class{device;shaderInputs;passRenderers;swapFramebuffers;textureModel;constructor(e,t){this.device=e;let n=Rf(t.shaderPasses);n.map(e=>j(e));let r=n.reduce((e,t)=>({...e,[t.name]:t}),{});this.shaderInputs=t.shaderInputs||new dd(r);let i=e.getCanvasContext().getDrawingBufferSize();this.swapFramebuffers=new Sf(e,{colorAttachments:[t.colorFormat||e.preferredColorFormat],width:i[0],height:i[1]}),this.textureModel=new bf(e,{backgroundTexture:this.swapFramebuffers.current.colorAttachments[0].texture,flipY:t.flipY??e.type===`webgpu`});let a=t.flipY??e.type===`webgpu`;this.passRenderers=t.shaderPasses.map(t=>new Ff(e,t,this.shaderInputs,a))}destroy(){for(let e of this.passRenderers)e.destroy();this.swapFramebuffers.destroy(),this.textureModel.destroy()}resize(e){e||=this.device.getCanvasContext().getDrawingBufferSize(),this.swapFramebuffers.resize({width:e[0],height:e[1]});for(let t of this.passRenderers)t.resize(e)}resetHistory(){for(let e of this.passRenderers)e.resetHistory()}renderToScreen(e){return this.encodeToScreen(this.device.commandEncoder,e)}encodeToScreen(e,t){let n=this.encodeToTexture(e,t);if(!n)return!1;let r=this.device.getDefaultCanvasContext().getCurrentFramebuffer({depthStencilFormat:!1});this.textureModel.setProps({backgroundTexture:n}),this.textureModel.predraw(e);let i=e.beginRenderPass({id:`shader-pass-renderer-to-screen`,framebuffer:r,clearDepth:!1});return this.textureModel.draw(i),i.end(),!0}renderToTexture(e){return this.encodeToTexture(this.device.commandEncoder,e)}encodeToTexture(e,t){if(e.device!==this.device)throw Error(`ShaderPassRenderer command encoder must belong to the renderer device`);let{sourceTexture:n}=t;if(n instanceof Pd&&!n.isReady)return null;let r=n instanceof Pd?n.texture:n;if(this.passRenderers.length===0)return r;t.resetHistory&&this.resetHistory(),this.textureModel.setProps({backgroundTexture:r}),this.textureModel.predraw(e);let i=ip(this.swapFramebuffers,r),a=e.beginRenderPass({id:`shader-pass-renderer-seed-source`,framebuffer:i,clearColor:[0,0,0,1],clearDepth:!1});this.textureModel.draw(a),a.end();let o=i,s=np(i),c=!1;try{for(let n of this.passRenderers){n.initializeHistoryTargets(r,this.textureModel,e),n.runComputeOptimization({commandEncoder:e,originalTexture:r,previousTexture:s,runtimeUniforms:t.uniforms||{}});for(let i of n.subPassExecutions){let a=i.output||`previous`,c=a===`previous`?rp(this.swapFramebuffers,o):n.getOutputFramebuffer(a),l=np(c),u=n.resolveBindings({execution:i,originalTexture:r,previousTexture:s,outputTexture:l,externalBindings:t.bindings||{}}),d=Gf(this.shaderInputs,i,t.uniforms||{});i.subPassRenderer.prepare({commandEncoder:e,bindings:u,textureScale:ap(u.sourceTexture||s,l),uniforms:d});let f=e.beginRenderPass({id:`shader-pass-renderer-run-pass`,framebuffer:c,clearColor:[0,0,0,1],clearDepth:1});i.subPassRenderer.draw(f),f.end(),a===`previous`?(s=l,o=c):n.markTargetWritten(a)}}c=!0}finally{for(let e of this.passRenderers)e.finishFrame(c)}return s}},Ff=class{device;shaderInputs;passDefinition;renderTargets;subPassExecutions;computeRenderer;constructor(e,t,n,r){if(this.device=e,this.shaderInputs=n,this.passDefinition=t,zf(t)){Hf(t.name,t.renderTargets||{}),this.renderTargets=Kf(e,t.renderTargets||{}),Bf(e,t)&&(this.computeRenderer=new If(e,t.compute,this.renderTargets,n)),this.subPassExecutions=(this.computeRenderer?t.steps.filter(e=>!t.compute.replacedPasses.includes(e.shaderPass.name)):t.steps).flatMap(e=>this.createStepExecutions(t,e,r));return}Vf(t,t.name),this.renderTargets={},this.subPassExecutions=this.createPassExecutions(t,{ownerName:t.name,flipY:r})}destroy(){this.computeRenderer?.destroy();for(let e of this.subPassExecutions)e.subPassRenderer.destroy();Yf(this.renderTargets)}resize(e){Xf(this.device,this.renderTargets,e)}runComputeOptimization(e){if(!this.computeRenderer)return;let t=this.resolveInputTexture(this.computeRenderer.optimization.input,e.originalTexture,e.previousTexture);this.computeRenderer.encode(e.commandEncoder,t,e.runtimeUniforms);for(let e of Object.values(this.computeRenderer.optimization.outputs))this.markTargetWritten(e)}resetHistory(){for(let e of Object.values(this.renderTargets))e.historyInitialized=!1,e.writtenThisFrame=!1}initializeHistoryTargets(e,t,n){for(let r of Object.values(this.renderTargets)){if(r.spec.lifetime!==`history`||r.historyInitialized)continue;let i=ep(r),a=r.spec.initialize||{clearColor:[0,0,0,0]};if(a===`original`){t.setProps({backgroundTexture:e}),t.predraw(n);let a=n.beginRenderPass({id:`${r.name}-initialize-history`,framebuffer:i,clearColor:[0,0,0,0],clearDepth:!1});t.draw(a),a.end()}else n.beginRenderPass({id:`${r.name}-clear-history`,framebuffer:i,clearColor:a.clearColor,clearDepth:!1}).end();r.historyInitialized=!0}}getOutputFramebuffer(e){return this.getRenderTarget(e).framebuffer}markTargetWritten(e){this.getRenderTarget(e).writtenThisFrame=!0}finishFrame(e){for(let t of Object.values(this.renderTargets)){if(e&&t.spec.lifetime===`history`&&t.writtenThisFrame){let e=$f(t),n=ep(t);t.historyTexture=t.texture,t.historyFramebuffer=t.framebuffer,t.texture=e,t.framebuffer=n,t.historyInitialized=!0}t.writtenThisFrame=!1}}getRenderTarget(e){let t=this.renderTargets[e];if(!t)throw Error(`${this.getOwnerName()}: unknown render target "${e}"`);return t}resolveBindings(e){let{execution:t,originalTexture:n,previousTexture:r,outputTexture:i,externalBindings:a}=e,o=t.inputs||{sourceTexture:`previous`},s=this.shaderInputs.getModuleBindingValues(t.shaderPass.name),c=Object.fromEntries(Object.entries(a).filter(([e])=>t.shaderPass.bindingLayout?.some(t=>t.name===e))),l={...s,...c},u=t.output||`previous`;for(let[e,a]of Object.entries(o)){if(!a)continue;let o=this.resolveInputTexture(a,n,r),s=a in this.renderTargets?this.renderTargets[a]:null;if(u!==`previous`&&a===u&&s?.spec.lifetime!==`history`)throw Error(`${t.ownerName}: subpass cannot read and write render target "${u}" in the same draw`);if(o===i)throw Error(`${t.ownerName}: subpass cannot sample from the render target it is writing to`);l[e]=o}return`sourceTexture`in l||(l.sourceTexture=r),l}createStepExecutions(e,t,n){return Vf(t.shaderPass,`${e.name}/${t.shaderPass.name}`),this.createPassExecutions(t.shaderPass,{ownerName:`${e.name}/${t.shaderPass.name}`,firstInputs:t.inputs,lastOutput:t.output,uniformOverrides:t.uniforms,flipY:n})}createPassExecutions(e,t){let n=e.passes||[];return n.map((r,i)=>{let a=i===0,o=i===n.length-1,s=a&&t.firstInputs!==void 0?t.firstInputs:r.inputs,c=o&&t.lastOutput!==void 0?t.lastOutput:r.output;return Uf(t.ownerName,s,c,this.renderTargets),{ownerName:t.ownerName,shaderPass:e,subPassRenderer:new Lf(this.device,e,r,t.flipY),inputs:s,output:c,uniforms:Wf(t.uniformOverrides,r.uniforms)}})}resolveInputTexture(e,t,n){switch(e){case`original`:return t;case`previous`:return n;default:{let t=this.getRenderTarget(e);return t.spec.lifetime===`history`&&!t.writtenThisFrame?$f(t):t.texture}}}getOwnerName(){return this.passDefinition.name}},If=class{optimization;renderTargets;shaderInputs;computation;parameterBuffer;constructor(e,t,n,r){this.optimization=t,this.renderTargets=n,this.shaderInputs=r,this.parameterBuffer=e.createBuffer({id:`${t.name}-parameters`,byteLength:Math.max(Math.ceil(t.uniformNames.length/4)*16,16),usage:I.UNIFORM|I.COPY_DST});let i=Object.entries(t.outputs).map(([e,t],r)=>({name:e,type:`storage`,group:0,location:r+2,access:`write-only`,format:n[t].texture.format}));try{this.computation=new Ef(e,{id:t.name,source:t.source,shaderLayout:{bindings:[{name:t.uniformBinding,type:`uniform`,group:0,location:0},{name:`sourceTexture`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},...i]}})}catch(e){throw this.parameterBuffer.destroy(),e}}encode(e,t,n){let r={...this.shaderInputs.getUniformValues()[this.optimization.uniformModule]||{},...this.optimization.uniforms,...n[this.optimization.uniformModule]||{}},i=new Float32Array(Math.max(Math.ceil(this.optimization.uniformNames.length/4)*4,4));for(let[e,t]of this.optimization.uniformNames.entries()){let n=r[t];i[e]=typeof n==`number`?n:0}this.parameterBuffer.write(i);let a=Object.entries(this.optimization.outputs),o={[this.optimization.uniformBinding]:this.parameterBuffer,sourceTexture:t.view};for(let[e,t]of a)o[e]=this.renderTargets[t].texture.view;this.computation.setBindings(o),this.computation.predraw(e);let s=this.renderTargets[a[0][1]].texture,c=e.beginComputePass({id:this.optimization.name});this.computation.dispatch(c,Math.ceil(s.width/this.optimization.workgroupSize[0]),Math.ceil(s.height/this.optimization.workgroupSize[1]),1),c.end()}destroy(){this.computation.destroy(),this.parameterBuffer.destroy()}},Lf=class{model;shaderPass;subPass;flipY;constructor(e,t,n,r){this.shaderPass=t,this.subPass=n,this.flipY=r;let i=Df({shaderPass:t,action:n.action||n.filter&&`filter`||n.sampler&&`sample`||`filter`,shadingLanguage:e.info.shadingLanguage});this.model=new gf(e,{id:`${t.name}-subpass`,source:i,fs:i,modules:[Mf,t],parameters:{depthWriteEnabled:!1}})}destroy(){this.model.destroy()}prepare(e){let{commandEncoder:t,bindings:n,textureScale:r,uniforms:i}=e;this.model.shaderInputs.setProps({textureTransform:{scale:r,flipY:this.flipY?1:0}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:this.shaderPass.uniforms||{}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:i||{}}),this.model.setBindings(n||{}),this.model.predraw(t)}draw(e){this.model.draw(e)}};function Rf(e){return e.flatMap(e=>zf(e)?e.steps.map(e=>e.shaderPass):[e])}function zf(e){return`steps`in e}function Bf(e,t){let n=t.compute;if(!n||e.type!==`webgpu`)return!1;let r=Object.values(n.outputs);return r.length===0||r.length>e.limits.maxStorageTexturesPerShaderStage||n.workgroupSize[0]>e.limits.maxComputeWorkgroupSizeX||n.workgroupSize[1]>e.limits.maxComputeWorkgroupSizeY||n.workgroupSize[0]*n.workgroupSize[1]>e.limits.maxComputeInvocationsPerWorkgroup?!1:r.every(n=>{let r=t.renderTargets?.[n];if(!r?.storage)return!1;let i=r.format||e.preferredColorFormat;return e.getTextureFormatCapabilities(i).store})}function Vf(e,t){let n=e.renderTargets;if(n&&Object.keys(n).length>0)throw Error(`${t}: ShaderPass.renderTargets is not supported; use CompositeShaderPass.renderTargets instead`)}function Hf(e,t){for(let n of Object.keys(t))if(Nf.has(n))throw Error(`${e}: render target name "${n}" is reserved`)}function Uf(e,t,n,r){let i=t||{sourceTexture:`previous`};for(let t of Object.values(i))if(t&&t!==`original`&&t!==`previous`&&!(t in r))throw Error(`${e}: unknown input source "${t}"`);if(n&&n!==`previous`&&!(n in r))throw Error(`${e}: unknown output target "${n}"`)}function Wf(e,t){if(!(!e&&!t))return{...e||{},...t||{}}}function Gf(e,t,n){return Wf(Wf(e.getUniformValues()[t.shaderPass.name],t.uniforms),n[t.shaderPass.name])}function Kf(e,t){let n=e.getCanvasContext().getDrawingBufferSize(),r={};for(let[i,a]of Object.entries(t)){if(a.aliasFor){let t=r[a.aliasFor];if(!t)throw Error(`${i}: target alias references an unknown earlier target`);let o=tp(n,a.scale),s=a.format||e.preferredColorFormat;if(a.lifetime===`history`||t.spec.lifetime===`history`||!qf(a,t.spec)||t.texture.width!==o[0]||t.texture.height!==o[1]||t.texture.format!==s||a.storage&&!t.spec.storage||!Jf(a,t.spec))throw Error(`${i}: target alias must match a transient target's size, format, and sampler`);r[i]=t;continue}r[i]=Zf(e,i,a,n)}return r}function qf(e,t){let n=e.scale||[1,1],r=t.scale||[1,1];return n[0]===r[0]&&n[1]===r[1]}function Jf(e,t){let n=e.sampler||{},r=t.sampler||{},i=Object.entries(n);return i.length===Object.keys(r).length&&i.every(([e,t])=>r[e]===t)}function Yf(e){for(let t of new Set(Object.values(e)))t.framebuffer.destroy(),t.texture.destroy(),t.historyFramebuffer?.destroy(),t.historyTexture?.destroy()}function Xf(e,t,n){for(let r of new Set(Object.values(t))){let t=tp(n,r.spec.scale);if(r.texture.width===t[0]&&r.texture.height===t[1])continue;r.framebuffer.destroy(),r.texture.destroy(),r.historyFramebuffer?.destroy(),r.historyTexture?.destroy();let i=Zf(e,r.name,r.spec,n);r.texture=i.texture,r.framebuffer=i.framebuffer,r.historyTexture=i.historyTexture,r.historyFramebuffer=i.historyFramebuffer,r.historyInitialized=!1,r.writtenThisFrame=!1}}function Zf(e,t,n,r){let i=tp(r,n.scale),{texture:a,framebuffer:o}=Qf(e,t,n,i),s,c;if(n.lifetime===`history`){let r=Qf(e,`${t}-history`,n,i);s=r.texture,c=r.framebuffer}return{name:t,spec:n,texture:a,framebuffer:o,historyTexture:s,historyFramebuffer:c,historyInitialized:!1,writtenThisFrame:!1}}function Qf(e,t,n,r){let i=e.createTexture({id:`${t}-texture`,width:r[0],height:r[1],format:n.format||e.preferredColorFormat,usage:L.SAMPLE|L.RENDER|L.COPY_SRC|L.COPY_DST|(n.storage&&e.type===`webgpu`&&e.getTextureFormatCapabilities(n.format||e.preferredColorFormat).store?L.STORAGE:0),...n.sampler?{sampler:n.sampler}:{}});return{texture:i,framebuffer:e.createFramebuffer({id:`${t}-framebuffer`,width:r[0],height:r[1],colorAttachments:[i]})}}function $f(e){if(!e.historyTexture)throw Error(`${e.name}: transient render target has no history texture`);return e.historyTexture}function ep(e){if(!e.historyFramebuffer)throw Error(`${e.name}: transient render target has no history framebuffer`);return e.historyFramebuffer}function tp(e,t=[1,1]){return[Math.max(1,Math.round(e[0]*t[0])),Math.max(1,Math.round(e[1]*t[1]))]}function np(e){let t=e.colorAttachments[0]?.texture;if(!t)throw Error(`ShaderPassRenderer: framebuffer is missing a color attachment texture`);return t}function rp(e,t){return t===e.current?e.next:e.current}function ip(e,t){return np(e.current)===t?e.next:e.current}function ap(e,t){let n=e.width/e.height,r=t.width/t.height;return r>n?[1,r/n]:[n/r,1]}var op=`struct LayerUniforms {
  opacity: f32,
};

@group(0) @binding(auto)
var<uniform> layer: LayerUniforms;
`,sp=`layout(std140) uniform layerUniforms {
  uniform float opacity;
} layer;
`,cp={name:`layer`,source:op,vs:sp,fs:sp,getUniforms:e=>({opacity:e.opacity**(1/2.2)}),uniformTypes:{opacity:`f32`}},lp=`const SMOOTH_EDGE_RADIUS: f32 = 0.5;

struct VertexGeometry {
  position: vec4<f32>,
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
  // Offset in normalized device coordinates, multiplied by clip w when applied.
  screenSpaceOffset: vec3<f32>,
};

var<private> geometry_: VertexGeometry = VertexGeometry(
  vec4<f32>(0.0, 0.0, 1.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec2<f32>(0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0)
);

struct FragmentGeometry {
  uv: vec2<f32>,
};

var<private> fragmentGeometry: FragmentGeometry;

fn smoothedge(edge: f32, x: f32) -> f32 {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`,up=`#define SMOOTH_EDGE_RADIUS 0.5`,dp={name:`geometry`,source:lp,vs:`\
${up}

struct VertexGeometry {
  vec4 position;
  vec3 worldPosition;
  vec3 worldPositionAlt;
  vec3 normal;
  vec2 uv;
  vec3 pickingColor;
  // Offset in normalized device coordinates, multiplied by clip w when applied.
  vec3 screenSpaceOffset;
} geometry = VertexGeometry(
  vec4(0.0, 0.0, 1.0, 0.0),
  vec3(0.0),
  vec3(0.0),
  vec3(0.0),
  vec2(0.0),
  vec3(0.0),
  vec3(0.0)
);
`,fs:`\
${up}

struct FragmentGeometry {
  vec2 uv;
};
FragmentGeometry geometry;

float smoothedge(float edge, float x) {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`},fp={IDENTITY:0,GEODETIC:1,PROJECTED:2,GEOCENTRIC:3},B={IDENTITY:0,WEB_MERCATOR:1,GLOBE:2,CUSTOM_GEOSPATIAL:3,WEB_MERCATOR_AUTO_OFFSET:4,METER_OFFSETS:5,GLOBE_METER_OFFSETS:6,GEODETIC_OFFSETS:7},pp=Math.PI/180;function V(e,t,n,r){return[[e,t],[n,r]]}function mp(e){return e>=-180&&e<180?e:((e+180)%360+360)%360-180}function hp(e,t,n,r){if(![e,t,n,r].every(Number.isFinite)||t<-90||r>90||t>r||n-e<-360||n-e>360.0000000001)throw Error(`Invalid geographic coverage`);if(n-e>=359.9999999999)return[-180,t,180,r];let i=mp(n);return[mp(e),t,i===-180&&n>e?180:i,r]}function gp(e){let t=e[2]-e[0];return t<0?t+360:t}function _p(e){let[t,n,r,i]=e;return t<=r?[e]:[[t,n,180,i],[-180,n,r,i]]}function vp(e,t){let[n,r,i,a]=e,o=mp(t[0]);return t[1]>=r&&t[1]<=a&&(n<=i?o>=n&&o<=i||o===-180&&i===180:o>=n||o<=i)}function yp(e,t){let n=Math.max(e[1],t[1]),r=Math.min(e[3],t[3]);if(n>r)return[];let i=[];for(let n of _p(e))for(let e of _p(t)){let t=Math.max(n[0],e[0]),r=Math.min(n[2],e[2]);t<=r?i.push([t,r]):(n[2]===180&&e[0]===-180||e[2]===180&&n[0]===-180)&&i.push([-180,-180])}i.sort((e,t)=>e[0]-t[0]);let a=[];for(let e of i){let t=a[a.length-1];t&&e[0]<=t[1]?t[1]=Math.max(t[1],e[1]):a.push([...e])}if(a.length>1&&a[0][0]===-180&&a[a.length-1][1]===180){let e=a.shift();return[[a.pop()[0],n,e[1],r],...a.map(([e,t])=>[e,n,t,r])]}return a.map(([e,t])=>[e,n,t,r])}function bp(e,t){let n=mp(t[0]),r=Math.max(e[1],Math.min(e[3],t[1]));return vp(e,[n,r])||(n=Math.abs(mp(n-e[0]))<=Math.abs(mp(n-e[2]))?e[0]:e[2]),[n,r]}function xp(e,t=0,n=0){let r=gp(e),i=e[0]*pp-t,a=i+r*pp/2,o=Math.round((n-a)/(2*Math.PI))*2*Math.PI;return V(r===360?n-Math.PI:i+o,e[1]*pp,r===360?n+Math.PI:i+o+r*pp,e[3]*pp)}function Sp(e,t=0){return hp((e[0][0]+t)/pp,e[0][1]/pp,(e[1][0]+t)/pp,e[1][1]/pp)}function Cp(e){if(!e.length)throw Error(`CRS coverage does not intersect the rendering target`);return[[0,1,2].map(t=>Math.min(...e.map(e=>e[0][t]))),[0,1,2].map(t=>Math.max(...e.map(e=>e[1][t])))]}function wp(e,t){if(t)try{return Tp(e(t))}catch{}return Tp(e())}function Tp(e){let t=e.bounds;if(t.some(e=>e.some(e=>!Number.isFinite(e))))throw Error(`Projection rendering bounds must be finite`);return{bounds:t,normalize:e.normalize?.bind(e)}}function Ep(e,t=0){return n=>{let r=n.x*Math.PI/180-t,i=n.y*Math.PI/180,a={x:r,y:i,z:n.z};e(a),a.x!==r&&(n.x=(a.x+t)*180/Math.PI),a.y!==i&&(n.y=a.y*180/Math.PI)}}function Dp(e,t){let n=[];for(let r of e){let e=t(r);e!==null&&n.push(Tp(e))}return n.length?n.length===1?n[0]:{bounds:Cp(n.map(e=>e.bounds)),normalize(e){let t=e.x,r=e.y,i=1/0;for(let a of n){let n={x:e.x,y:e.y,z:e.z};a.normalize?.(n);let o=Math.sin((n.y-e.y)*Math.PI/360)**2+Math.cos(e.y*Math.PI/180)*Math.cos(n.y*Math.PI/180)*Math.sin((n.x-e.x)*Math.PI/360)**2;o<i&&(i=o,t=n.x,r=n.y)}e.x=t,e.y=r}}:null}function Op(){return{bounds:[[-1,-1,0],[1,1,0]]}}var kp=Symbol.for(`@math.gl/projection/projection-implementations`);function Ap(){let e=globalThis;return e[kp]||(e[kp]=new WeakMap),e[kp]}function jp(e){return`create`in e?e:Ap().get(e)?.implementation}function Mp(e){if(`create`in e)return Promise.resolve(e);let t=Ap().get(e);if(t||(t={load:()=>e.preload()},Ap().set(e,t)),t.implementation)return Promise.resolve(t.implementation);let n=t;return n.pending||=Promise.resolve().then(n.load).then(t=>{let r=e=>e.toLowerCase().replace(/[\s_-]/g,``),i=new Set([t.name,...t.aliases||[]].map(r));if(typeof t.create!=`function`||![e.name,...e.aliases||[]].every(e=>i.has(r(e))))throw Error(`Loaded projection does not match descriptor: `+e.name);return n.implementation=t,t}).catch(e=>{throw n.pending=void 0,e}),n.pending}function Np(){return{x:0,y:0,z:0}}var Pp=class{constructor(){this.point=Np(),this.points=[this.point],this.active=0}get depth(){return this.active}acquire(){var e;let t=this.active++;return(e=this.points)[t]||(e[t]=Np()),this.points[t]}release(e){this.active>0&&this.points[this.active-1]===e&&this.active--}};function Fp(e,t){let n=new Pp,r=(e,t,r)=>{let i=n.acquire();try{return i.x=e,i.y=t,i.z=0,r(i),[i.x,i.y]}finally{n.release(i)}};return{forward(t,n){return r(t,n,e)},inverse(e,n){return r(e,n,t)},forwardInPlace:e,inverseInPlace:t}}function Ip(e,t,n=!1){let r=t?e.inverseInPlace:e.forwardInPlace;if(r)return r.bind(e);if(n){let n=t?e.inverse3D:e.forward3D;return t=>{let r=n.call(e,[t.x,t.y,t.z]);t.x=r[0],t.y=r[1],t.z=r[2]}}let i=t?e.inverse:e.forward;return t=>{let n=i.call(e,t.x,t.y);t.x=n[0],t.y=n[1]}}var Lp=34028234663852886e22;function Rp(e,t,n){if(!(Array.isArray(e)||e instanceof Float32Array||e instanceof Float64Array))throw Error(`Scalar input requires a number array, Float32Array or Float64Array`);if(!(Array.isArray(t)||t instanceof Float32Array||t instanceof Float64Array)||t.length<n)throw Error(`Scalar output requires a preallocated number array, Float32Array or Float64Array with sufficient capacity`);if(e===t||Array.isArray(e)||Array.isArray(t))return;let r=e,i=t,a=typeof SharedArrayBuffer<`u`&&r.buffer instanceof SharedArrayBuffer&&i.buffer instanceof SharedArrayBuffer;if((r.buffer===i.buffer||a)&&r.byteOffset<i.byteOffset+n*i.BYTES_PER_ELEMENT&&i.byteOffset<r.byteOffset+r.byteLength)throw Error(`Scalar input/output views overlap; use the same view for in-place projection`)}function zp(e,t,n,r){if(t instanceof Float32Array){if(Math.abs(n.x)>Lp||Math.abs(n.y)>Lp||r>=3&&Math.abs(n.z)>Lp)throw Error(`Projected coordinate exceeds Float32 range`);for(let t=3;t<e.length;t++){let n=e[t];if(Number.isFinite(n)&&Math.abs(n)>Lp)throw Error(`Trailing ordinate exceeds Float32 range`)}}for(let n=3;n<e.length;n++)t[n]=e[n];return t[0]=n.x,t[1]=n.y,r>=3&&(t[2]=n.z),t}var Bp,Vp=Symbol.for(`@math.gl/projection/TypeScriptCRSError`),Hp=class e extends Error{static[(Bp=Vp,Symbol.hasInstance)](t){return this===e?t instanceof Error&&t[Vp]===!0:Function.prototype[Symbol.hasInstance].call(this,t)}constructor(e,t){super(t),this.reason=e,this[Bp]=!0,this.name=`TypeScriptCRSError`}};function H(e){throw new Hp(`missing-transform-stage`,e)}function Up(e,t){if(typeof e==`string`||`type`in e)return{definition:e,lossy:!1};let n=e,r=`crs`in n?n:void 0,i=`crs`in n?n.crs:n;if(i.state!==`explicit`&&i.state!==`default`)throw new Hp(`unknown-syntax`,`Cannot transform an `+i.state+` CRS reference`);let a=!1;return r?.coordinateEpoch!==void 0&&H(`Coordinate epochs require a time-dependent transformation`),r?.vertical&&r.vertical.state!==`absent`&&(t.mode!==`horizontal`&&H(`A separately declared vertical CRS requires explicit horizontal extraction`),a=!0),{definition:i.definition,spatialReference:r,lossy:a}}function Wp(e,t){if(!t)return e;if(t.coordinateFrame!==`unknown`&&t.coordinateFrame!==e.kind)throw Error(`SpatialReference coordinate frame disagrees with its CRS`);let n=t.coordinateOrder,r=e.kind===`geocentric`?{x:`e`,y:`n`,z:`u`}:{longitude:`e`,lon:`e`,latitude:`n`,lat:`n`,easting:`e`,northing:`n`,height:`u`,altitude:`u`,x:`e`,y:`n`,z:`u`},i;if(n.length&&(i=n.slice(0,3).map(e=>r[e.toLowerCase()]||`?`).join(``),i.length===2&&(i+=`u`),(i.length!==3||!i.includes(`e`)||!i.includes(`n`)||!i.includes(`u`))&&H(`Unsupported SpatialReference coordinate order`),(n.length>4||n.length>3&&![`m`,`measure`].includes(n[3]))&&H(`Unsupported fourth coordinate component`)),t.units?.length){let n={m:1,meter:1,metre:1,meters:1,metres:1,km:1e3,ft:.3048,"us-ft":1200/3937,degree:Math.PI/180,degrees:Math.PI/180,radian:1,radians:1,grad:Math.PI/200};for(let r=0;r<Math.min(t.units.length,3);r++){let a=(i||`enu`)[r]===`u`,o=e.kind===`geocentric`?e.toMeter:a?e.verticalUnit:e.kind===`geographic`?e.angularUnit:e.toMeter;(Math.abs((n[t.units[r]]??NaN)-o)>1e-12||n[t.units[r]]===void 0)&&H(`SpatialReference units disagree with its CRS`)}}return Object.freeze({...e,storedAxis:i})}var Gp=Math.PI/180;function U(e,t,n){if(!Object.prototype.hasOwnProperty.call(e,t))return n;let r=e[t];if(typeof r!=`string`||!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(r))throw Error(`Invalid numeric PROJ parameter: +${t}`);let i=Number(r);if(!Number.isFinite(i))throw Error(`Invalid numeric PROJ parameter: +${t}`);return i}function Kp(e,t){let n=U(e,t,0);if(Math.abs(n)>=90)throw Error(`+${t} must be between -90 and 90 degrees`);return n*Gp}function qp(e,t=!1){if(t||Math.abs(e)<=Math.PI)return e;let n=2*Math.PI;return((e+Math.PI)%n+n)%n-Math.PI}var Jp={towgs84:`0,0,0`,ellipse:`WGS84`},Yp={towgs84:`0,0,0`,ellipse:`GRS80`},Xp={wgs84:Jp,WGS84:Jp,nad83:Yp,North_American_Datum_1983:Yp},Zp=new WeakMap,Qp=e=>e.toLowerCase().replace(/[\s_-]/g,``);function $p(e){if(!e.datumCatalogs?.length)return Xp;let t=Zp.get(e);if(t?.catalogs===e.datumCatalogs)return t.definitions;let n=Object.assign(Object.create(null),Xp),r=new Map(Object.entries(Xp).map(([e,t])=>[Qp(e),{definition:t,owner:-1}]));return e.datumCatalogs.forEach((e,t)=>{if(!e.name||!e.datums)throw Error(`Invalid datum catalogue plugin`);for(let[i,a]of Object.entries(e.datums)){let e=Qp(i);if(!e||e===`none`||!a||[`ellipse`,`towgs84`,`nadgrids`].some(e=>a[e]!==void 0&&typeof a[e]!=`string`))throw Error(`Invalid datum definition: `+i);let o=r.get(e);if(o&&(o.owner!==t||o.definition.ellipse!==a.ellipse||o.definition.towgs84!==a.towgs84||o.definition.nadgrids!==a.nadgrids))throw Error(`Conflicting datum registration: `+i);r.set(e,{definition:a,owner:t}),n[i]=a}}),Zp.set(e,{catalogs:e.datumCatalogs,definitions:n}),n}var em={MERIT:{a:6378137,rf:298.257,ellipseName:`MERIT 1983`},SGS85:{a:6378136,rf:298.257,ellipseName:`Soviet Geodetic System 85`},GRS80:{a:6378137,rf:298.257222101,ellipseName:`GRS 1980(IUGG, 1980)`},IAU76:{a:6378140,rf:298.257,ellipseName:`IAU 1976`},airy:{a:6377563.396,b:6356256.91,ellipseName:`Airy 1830`},APL4:{a:6378137,rf:298.25,ellipseName:`Appl. Physics. 1965`},NWL9D:{a:6378145,rf:298.25,ellipseName:`Naval Weapons Lab., 1965`},mod_airy:{a:6377340.189,b:6356034.446,ellipseName:`Modified Airy`},andrae:{a:6377104.43,rf:300,ellipseName:`Andrae 1876 (Den., Iclnd.)`},aust_SA:{a:6378160,rf:298.25,ellipseName:`Australian Natl & S. Amer. 1969`},GRS67:{a:6378160,rf:298.247167427,ellipseName:`GRS 67(IUGG 1967)`},bessel:{a:6377397.155,rf:299.1528128,ellipseName:`Bessel 1841`},bess_nam:{a:6377483.865,rf:299.1528128,ellipseName:`Bessel 1841 (Namibia)`},clrk66:{a:6378206.4,b:6356583.8,ellipseName:`Clarke 1866`},clrk80:{a:6378249.145,rf:293.4663,ellipseName:`Clarke 1880 mod.`},clrk80ign:{a:6378249.2,b:6356515,rf:293.4660213,ellipseName:`Clarke 1880 (IGN)`},clrk58:{a:6378293.645208759,rf:294.2606763692654,ellipseName:`Clarke 1858`},CPM:{a:6375738.7,rf:334.29,ellipseName:`Comm. des Poids et Mesures 1799`},delmbr:{a:6376428,rf:311.5,ellipseName:`Delambre 1810 (Belgium)`},engelis:{a:6378136.05,rf:298.2566,ellipseName:`Engelis 1985`},evrst30:{a:6377276.345,rf:300.8017,ellipseName:`Everest 1830`},evrst48:{a:6377304.063,rf:300.8017,ellipseName:`Everest 1948`},evrst56:{a:6377301.243,rf:300.8017,ellipseName:`Everest 1956`},evrst69:{a:6377295.664,rf:300.8017,ellipseName:`Everest 1969`},evrstSS:{a:6377298.556,rf:300.8017,ellipseName:`Everest (Sabah & Sarawak)`},fschr60:{a:6378166,rf:298.3,ellipseName:`Fischer (Mercury Datum) 1960`},fschr60m:{a:6378155,rf:298.3,ellipseName:`Fischer 1960`},fschr68:{a:6378150,rf:298.3,ellipseName:`Fischer 1968`},helmert:{a:6378200,rf:298.3,ellipseName:`Helmert 1906`},hough:{a:6378270,rf:297,ellipseName:`Hough`},intl:{a:6378388,rf:297,ellipseName:`International 1909 (Hayford)`},kaula:{a:6378163,rf:298.24,ellipseName:`Kaula 1961`},lerch:{a:6378139,rf:298.257,ellipseName:`Lerch 1979`},mprts:{a:6397300,rf:191,ellipseName:`Maupertius 1738`},new_intl:{a:6378157.5,b:6356772.2,ellipseName:`New International 1967`},plessis:{a:6376523,b:6355863,ellipseName:`Plessis 1817 (France)`},krass:{a:6378245,rf:298.3,ellipseName:`Krassovsky, 1942`},SEasia:{a:6378155,b:6356773.3205,ellipseName:`Southeast Asia`},walbeck:{a:6376896,b:6355834.8467,ellipseName:`Walbeck`},WGS60:{a:6378165,rf:298.3,ellipseName:`WGS 60`},WGS66:{a:6378145,rf:298.25,ellipseName:`WGS 66`},WGS72:{a:6378135,rf:298.26,ellipseName:`WGS 72`},WGS84:{a:6378137,rf:298.257223563,ellipseName:`WGS 84`},sphere:{a:6370997,b:6370997,ellipseName:`Normal Sphere (r=6370997)`}},tm={};tm.greenwich=0,tm.lisbon=-9.131906111111,tm.paris=2.337229166667,tm.bogota=-74.080916666667,tm.madrid=-3.687938888889,tm.rome=12.452333333333,tm.bern=7.439583333333,tm.jakarta=106.807719444444,tm.ferro=-17.666666666667,tm.brussels=4.367975,tm.stockholm=18.058277777778,tm.athens=23.7163375,tm.oslo=10.722916666667;var nm={WGS84:`+proj=longlat +datum=WGS84`,"EPSG:4326":`+proj=longlat +datum=WGS84`,"EPSG:4269":`+proj=longlat +datum=NAD83`,"EPSG:4978":`+proj=geocent +datum=WGS84`,"EPSG:4979":`+proj=longlat +datum=WGS84`,"EPSG:3857":`+proj=merc +a=6378137 +b=6378137 +nadgrids=@null +units=m`,"EPSG:3785":`EPSG:3857`,GOOGLE:`EPSG:3857`,"EPSG:900913":`EPSG:3857`,"EPSG:102113":`EPSG:3857`},rm=[`proj`,`datum`,`ellps`,`a`,`b`,`rf`,`f`,`R`,`units`,`to_meter`,`vunits`,`vto_meter`,`no_defs`,`type`,`title`,`towgs84`,`nadgrids`,`geoidgrids`,`axis`,`pm`,`over`,`lon_wrap`],im=[`no_defs`,`over`],am=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),om=e=>e.toLowerCase().replace(/[\s_-]/g,``);function sm(e,t){let n=Object.keys(e).find(e=>om(e)===om(t));return n===void 0?void 0:e[n]}function cm(e){if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(e)){let t=Number(e);if(Number.isFinite(t))return t}if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?r$/i.test(e)){let t=Number(e.slice(0,-1))/Gp;if(Number.isFinite(t))return t}let t=/^([+-]?)(\d+(?:\.\d*)?)(?:d(?:(\d+(?:\.\d*)?)'(?:(\d+(?:\.\d*)?)")?)?)?([NSEW])?$/i.exec(e);if(t&&(/d/i.test(e)||t[5])){let e=Number(t[3]||0),n=Number(t[4]||0);if(e<60&&n<60){let r=(t[1]===`-`?-1:1)*(/[SW]/i.test(t[5]||``)?-1:1)*(Number(t[2])+e/60+n/3600);if(Number.isFinite(r))return r}}throw Error(`Invalid angular parameter: `+e)}function lm(e,t={}){let n=e,r=t.aliases||{},i=new Set;for(;typeof n==`string`&&(am(r,n)||am(nm,n));){if(i.has(n))throw Error(`Circular CRS alias: `+n);i.add(n),n=am(r,n)?r[n]:nm[n]}if(typeof n==`string`){let e=/^EPSG:(326|327)(\d{2})$/.exec(n);e&&Number(e[2])>=1&&Number(e[2])<=60&&(n=`+proj=utm +datum=WGS84 +zone=`+Number(e[2])+(e[1]===`327`?` +south`:``)),(n===`EPSG:5041`||n===`EPSG:5042`)&&(n=`+proj=stere +datum=WGS84 +lat_0=`+(n===`EPSG:5041`?90:-90)+` +k_0=0.994 +x_0=2000000 +y_0=2000000`)}return n}function um(e,t={}){let n=$p(t),r=Up(e,t),i=lm(r.definition,t),a;if(T(i)===`proj-string`&&typeof i==`string`){let e=Object.create(null);for(let t of Ji(i).parameters){if(am(e,t.name))throw Error(`Duplicate PROJ parameter: +`+t.name);e[t.name]=t.value}a={parameters:e}}else{let e=t.parsers?.find(e=>e.canParse(i));if(!e)throw new Hp([`wkt`,`projjson`].includes(T(i))?`missing-parser`:`unknown-syntax`,T(i)===`identifier`?`Unsupported CRS definition: `+i+`; resolve it first`:`Unsupported CRS definition; register a WKT or PROJJSON parser for structured definitions`);a=e.parse(i,t)}let o={...a.parameters};for(let e of[`lon_0`,`lat_0`,`lat_1`,`lat_2`,`lat_ts`,`lon_wrap`,`lon_1`,`lon_2`,`lonc`,`alpha`,`gamma`,`tilt`,`azi`,`o_alpha`,`o_lon_c`,`o_lat_c`,`o_lon_p`,`o_lat_p`,`o_lon_1`,`o_lat_1`,`o_lon_2`,`o_lat_2`])o[e]!==void 0&&(o[e]=String(cm(o[e])));let s=o.proj,c=s?.toLowerCase(),l=c===`geocentric`?`geocent`:[`longlat`,`latlong`,`latlon`,`lonlat`,`identity`,`geocent`].includes(c)?c:s;if(!l)throw Error(`CRS requires +proj`);let u=[`longlat`,`latlong`,`latlon`,`lonlat`].includes(l)?`geographic`:l===`geocent`?`geocentric`:l===`identity`?`identity`:`projected`,d=o.datum,f=d&&d!==`none`?sm(n,d):void 0;d&&d!==`none`&&!f&&H(`Unknown datum: `+d+`; register a datumCatalogs plugin`);let p=fm(o,f?.ellipse),m=o.nadgrids??f?.nadgrids,h=m===void 0?void 0:m.split(`,`).map(e=>{let t=e.startsWith(`@`),n=t?e.slice(1):e;if(!n||/\s/.test(n))throw Error(`Invalid datum grid name`);return Object.freeze({name:n,optional:t})}),g=o.towgs84??f?.towgs84,_;if(g!==void 0&&(_=g.split(`,`).map(e=>U({value:e},`value`,NaN)),![3,7].includes(_.length)||_.some(e=>!Number.isFinite(e))||_.length===7&&_[6]<=-1e6))throw Error(`+towgs84 requires three or seven finite values and positive scale`);d===`none`&&(_=void 0),h&&d!==`none`&&(_=[0,0,0]);let v=m===`@null`||m===`null`?fm({ellps:`WGS84`}):p,y=o.axis||`enu`;if(y.length!==3||!/[ew]/.test(y)||!/[ns]/.test(y)||!/[ud]/.test(y))throw Error(`Invalid axis: `+y);let b=a.angularUnit??Gp;if(u===`geographic`&&(o.units&&o.units!==`degrees`||am(o,`to_meter`)))throw Error(`Geographic coordinates must use angular units`);if(u!==`geographic`&&o.units===`degrees`)throw Error(`Linear coordinates require linear units`);let x=dm(o,`units`,`to_meter`),S=a.verticalUnit??dm(o,`vunits`,`vto_meter`);if(!(S>0)||!Number.isFinite(S))throw Error(`Invalid vertical unit`);if(!(b>0)||!Number.isFinite(b))throw Error(`Invalid angular unit`);let C=o.pm,w=C===void 0?0:(sm(tm,C)??cm(C))*Gp;return Wp(Object.freeze({kind:u,projection:l,parameters:Object.freeze(o),ellipsoid:p,datum:Object.freeze({ellipsoid:v,towgs84:_&&Object.freeze(_),grids:d===`none`||m===`@null`||m===`null`?void 0:h&&Object.freeze(h)}),areaOfUse:a.areaOfUse,angularUnit:b,toMeter:x,verticalUnit:S,primeMeridian:w,axis:y,longitudeWrap:o.lon_wrap===void 0?void 0:Number(o.lon_wrap)*Gp,lossy:!!(a.lossy||r.lossy)}),r.spatialReference)}function dm(e,t,n){let r=e[t],i=ea;if(t===`vunits`&&r===`degrees`)throw Error(`Height requires linear units`);if(r&&![`m`,`degrees`].includes(r)&&!am(i,r))throw Error(`Unsupported units: `+r);let a=U(e,n,r&&i[r]?i[r].metersPerUnit:1);if(!(a>0))throw Error(`+`+n+` must be positive`);return a}function fm(e,t){let n=t||e.ellps||`WGS84`,r=sm(em,n);if(!r)throw Error(`Unsupported ellipsoid: `+n);let i=U(e,`a`,r.a),a=U(e,`f`,NaN),o=U(e,`rf`,Number.isNaN(a)?r.rf||0:a===0?0:1/a),s=U(e,`b`,o?i*(1-1/o):am(e,`f`)||am(e,`rf`)||am(e,`a`)?i:r.b||i),c=U(e,`R`,0);if(i<=0||s<=0||s>i||o<0||o>0&&o<=1||am(e,`R`)&&c<=0||!Number.isNaN(a)&&(a<0||a>=1))throw Error(`Invalid ellipsoid dimensions`);return Object.freeze({semiMajorAxis:c||i,semiMinorAxis:c||s,eccentricitySquared:c?0:1-(s/i)**2})}var pm=Math.PI/(180*3600),mm={ellipsoid:{semiMajorAxis:6378137,semiMinorAxis:6356752.314245179,eccentricitySquared:.0066943799901413165},towgs84:[0,0,0]};function hm(e,t){if(Math.abs(e.y)>Math.PI/2)throw Error(`Latitude outside geocentric domain`);if(!Vc(e,t))throw Error(`Geocentric coordinate must be finite`)}function gm(e,t){let n=e.x,r=e.y,i=e.z,{semiMajorAxis:a,semiMinorAxis:o,eccentricitySquared:s}=t;if(n===0&&r===0&&i===0)throw Error(`Geodetic coordinates are undefined at the Earth center`);if(s!==0&&Math.abs(n)<1e-12*a&&Math.abs(r)<1e-12*a&&Math.hypot(n,r)<1e-12*a){if(!Number.isFinite(Math.hypot(n,r,i)))throw Error(`Geocentric radius must be finite`);e.x=0,e.y=Math.sign(i)*Math.PI/2,e.z=Math.abs(i)-o;return}if(!Hc(e,t))throw Number.isFinite(Math.hypot(n,r,i))?Error(`Geocentric inverse did not converge`):Error(`Geocentric radius must be finite`)}function _m(e,t){let n=e[0],r=e[1],i=e[2],a=(e[3]||0)*pm,o=(e[4]||0)*pm,s=(e[5]||0)*pm,c=1+(e[6]||0)/1e6;return t?e=>{let t=(e.x-n)/c,l=(e.y-r)/c,u=(e.z-i)/c;e.x=t+s*l-o*u,e.y=-s*t+l+a*u,e.z=o*t-a*l+u}:e=>{let t=e.x,l=e.y,u=e.z;e.x=c*(t-s*l+o*u)+n,e.y=c*(s*t+l-a*u)+r,e.z=c*(-o*t+a*l+u)+i}}function vm(e){return!!e.towgs84?.some(e=>e!==0)}function ym(e,t){if(!(!e.towgs84||!t.towgs84)){if(e.grids||t.grids){if(e.grids&&t.grids&&e.ellipsoid.semiMajorAxis===t.ellipsoid.semiMajorAxis&&e.ellipsoid.eccentricitySquared===t.ellipsoid.eccentricitySquared&&e.grids.length===t.grids.length&&e.grids.every((e,n)=>e.name===t.grids[n].name&&e.optional===t.grids[n].optional&&e.grid===t.grids[n].grid))return;let n=ym(e.grids?mm:e,t.grids?mm:t);return r=>{e.grids&&xm(r,e,!1),n?.(r),t.grids&&xm(r,t,!0)}}if(vm(e)||vm(t)){let n=bm(e,mm),r=bm(mm,t);return e=>{n?.(e),r?.(e)}}return bm(e,t)}}function bm(e,t){if(!e.towgs84||!t.towgs84)return;let n=e.ellipsoid,r=t.ellipsoid,i=!0;for(let n=0;n<7;n++)(e.towgs84[n]||0)!==(t.towgs84[n]||0)&&(i=!1);if(n.semiMajorAxis===r.semiMajorAxis&&Math.abs(n.eccentricitySquared-r.eccentricitySquared)<=5e-11&&i)return;let a=vm(e)?_m(e.towgs84,!1):void 0,o=vm(t)?_m(t.towgs84,!0):void 0;return e=>{hm(e,n),a?.(e),o?.(e),gm(e,r)}}function xm(e,t,n){for(let r of t.grids){if(r.name===`null`)return;if(!r.grid){if(r.optional)continue;throw Error(`Required datum grid is not registered: `+r.name)}let t=!1;if(r.grid.shiftInPlace)t=r.grid.shiftInPlace(e,n);else{let i=r.grid.shift(e.x,e.y,n);i&&(e.x=i[0],e.y=i[1],t=!0)}if(t){if(!Number.isFinite(e.x)||!Number.isFinite(e.y)||Math.abs(e.y)>Math.PI/2)throw Error(`Datum grid produced a coordinate outside the geographic domain`);return}}throw Error(`No datum grid covers coordinate: `+t.grids.map(e=>e.name).join(`,`))}function Sm(e,t){let n={x:e[0],y:e[1],z:e[2]};return hm(n,t),[n.x,n.y,n.z]}function Cm(e,t){let n={x:e[0],y:e[1],z:e[2]};return gm(n,t),[n.x,n.y,n.z]}function wm(e,t,n=0,r=!1){let i=gp(t),a=i===360?n-180:t[0]+Math.round((n-t[0]-i/2)/360)*360,o=a+i;if(r){e.x=Math.max(a,Math.min(o,e.x)),e.y=Math.max(t[1],Math.min(t[3],e.y));return}let s=bp(t,[e.x,e.y]),c=s[0];s[0]===mp(e.x)&&e.x>=a&&e.x<=o?c=e.x:(c<a||c>o)&&(c+=Math.round(((a+o)/2-c)/360)*360);let l=c-n;e.x=Math.abs(l)<=180?c:n+mp(l),e.y=s[1]}function Tm(e,t,n=0,r=0,i=!1){let a=(n+r)*180/Math.PI;return{get bounds(){return e(xp(t,r,n))},normalize(e){wm(e,t,a,i)}}}function Em(e,t,n,r,i){let a=Dp(t,t=>Tm(e,t,n,r,i));if(!a)throw Error(`CRS coverage does not intersect the rendering target`);return a}function Dm(e,t,n,r=0,i=!1){let a=(t[0][0]+t[1][0])/2,o=Sp(t,r),s=(a+r)*180/Math.PI;return{...e,longitudeOrigin:a,getRenderingProfile(e){if(!e)return{bounds:n(t),normalize(e){wm(e,o,s,i)}};try{let t=Tm(n,e,a,r,i);return{bounds:t.bounds,normalize:t.normalize}}catch{return Em(n,yp(e,o),a,r,i)}}}}var Om=(e,t)=>[Math.min(e,t),Math.max(e,t)],W=(e,t)=>[e[0]+t[0],e[1]+t[1]],G=(e,t)=>Om(e[0]*t,e[1]*t);function km(e,t){let n=[e[0]*t[0],e[0]*t[1],e[1]*t[0],e[1]*t[1]];return[Math.min(...n),Math.max(...n)]}function Am([e,t]){let n=[Math.sin(e),Math.sin(t)];for(let[r,i]of[[Math.PI/2,1],[-Math.PI/2,-1]])Math.ceil((e-r)/(2*Math.PI))<=Math.floor((t-r)/(2*Math.PI))&&n.push(i);return[Math.min(...n),Math.max(...n)]}var jm=e=>Am([e[0]+Math.PI/2,e[1]+Math.PI/2]),Mm=e=>Math.max(Math.abs(e[0]),Math.abs(e[1]));function Nm(e,t){let n=e=>Math.max(1,Mm(e))*1e-12;if(![...e,...t].every(Number.isFinite))throw Error(`Projection rendering bounds are not finite`);return[[e[0]-n(e),t[0]-n(t),0],[e[1]+n(e),t[1]+n(t),0]]}function Pm(e,t,n=!1){let r=e[0][0]-t,i=e[1][0]-t;if(n)return[r,i];let a=i-r;if(a>=2*Math.PI-1e-12)return[-Math.PI,Math.PI];let o=qp(r);a>0&&Math.abs(o-Math.PI)<1e-12&&(o=-Math.PI);let s=o+a;return s>Math.PI+1e-12?[-Math.PI,Math.PI]:[o,Math.min(s,Math.PI)]}function Fm(e,t,n,r=!1){let i=Pm(t,n,r),a=[t[0][1],t[1][1],Math.max(t[0][1],Math.min(t[1][1],0))],o=i.flatMap(t=>a.map(r=>e(n+t,r)));return Nm([Math.min(...o.map(e=>e[0])),Math.max(...o.map(e=>e[0]))],[Math.min(...o.map(e=>e[1])),Math.max(...o.map(e=>e[1]))])}function Im(e,t,n,r=!1,i=0){let a=Pm(t,n,r);if(Mm(a)>Math.PI/6+1e-12)throw Error(`Unsupported transverse rendering coverage`);let o=[a[0],a[1],Math.max(a[0],Math.min(a[1],0))],s=[t[0][1],t[1][1],Math.max(t[0][1],Math.min(t[1][1],i))],c=o.flatMap(t=>s.map(r=>e(n+t,r)));return Nm([Math.min(...c.map(e=>e[0])),Math.max(...c.map(e=>e[0]))],[Math.min(...c.map(e=>e[1])),Math.max(...c.map(e=>e[1]))])}function Lm(e,t,n,r=!1){let i=Pm(t,n,r),a=[i[0],i[1],Math.max(i[0],Math.min(i[1],0))],o=[t[0][1],t[1][1],Math.max(t[0][1],Math.min(t[1][1],0))],s=a.flatMap(t=>o.map(r=>e(n+t,r)));return Nm([Math.min(...s.map(e=>e[0])),Math.max(...s.map(e=>e[0]))],[Math.min(...s.map(e=>e[1])),Math.max(...s.map(e=>e[1]))])}function Rm(e,t,n,r,i,a,o=!1){let s=G(Pm(t,n,o),r),c=Om(a-e(n,t[0][1])[1],a-e(n,t[1][1])[1]);return Nm(W([i,i],km(c,Am(s))),W([a,a],G(km(c,jm(s)),-1)))}function zm(e,t=0){let n=U(e,`lon_wrap`,0)*Gp;return e=>Tm(e=>{let t=Pm(e,n);return[[n+t[0],e[0][1],0],[n+t[1],e[1][1],0]]},e??[-180,-90,180,90],n,t)}function Bm(e,t={}){if(e===void 0)return;let n=[];for(let r of e.split(`,`)){let e=r.startsWith(`@`),i=e?r.slice(1):r;if(!i||/\s/.test(i))throw Error(`Invalid vertical grid name`);if(i===`null`){n.push(null);break}let a=Object.prototype.hasOwnProperty.call(t,i)?t[i]:void 0;if(a){if(typeof a.getOffset!=`function`)throw Error(`Invalid vertical grid: `+i);n.push(a.getOffset.bind(a))}else e||H(`Required vertical grid is not registered: `+i)}return(e,t)=>{for(let r of n){if(!r)return 0;let n=r(e,t);if(n!==void 0){if(!Number.isFinite(n))throw Error(`Vertical grid returned a non-finite offset`);return n}}throw Error(`No vertical grid covers this coordinate`)}}function Vm(e){let t=Object.freeze({...e.ellipsoid});return Object.freeze({kind:e.kind,projection:e.projection,parameters:Object.freeze(Object.fromEntries(Object.entries(e.parameters).map(([e,t])=>[e,t??null]))),ellipsoid:t,datum:Object.freeze({ellipsoid:Object.freeze({...e.datum.ellipsoid}),towgs84:e.datum.towgs84&&Object.freeze([...e.datum.towgs84]),grids:e.datum.grids&&Object.freeze(e.datum.grids.map(e=>Object.freeze({name:e.name,optional:e.optional,loaded:!!e.grid})))}),angularUnit:e.angularUnit,toMeter:e.toMeter,verticalUnit:e.verticalUnit,primeMeridian:e.primeMeridian,axis:e.axis,storedAxis:e.storedAxis,longitudeWrap:e.longitudeWrap,areaOfUse:e.areaOfUse&&Object.freeze([...e.areaOfUse]),lossy:e.lossy,algorithm:e.algorithm&&Object.freeze({...e.algorithm})})}function Hm(e,t,n,r){let i=[];return e.algorithm||i.push(`source-algorithm`),t.algorithm||i.push(`target-algorithm`),(e.datum.grids||t.datum.grids||e.parameters.geoidgrids||t.parameters.geoidgrids)&&i.push(`grid-resource`),Object.freeze({version:1,source:e,target:t,forward:n,inverse:r,lossy:e.lossy||t.lossy,complete:i.length===0,opaqueReasons:Object.freeze(i)})}var Um=class e{static async create(t={}){let n=await Promise.all(Wm(t).map(Mp));return new e({...t,projections:n})}get targetProfile(){return this.getTargetRenderingProfile(this.targetCoverage)}getTargetRenderingProfile(e){return this.targetRenderingProfile&&wp(this.targetRenderingProfile,e)}get description(){return this.deferred?.implementation?.description??this.resolvedDescription}constructor(e={}){this.coordinateScratch=new Pp,this.targetLongitudeOrigin=0;let t=e.projections||[],n=Km(t);if(t.some(e=>!(`create`in e))){let n=um(e.from??`WGS84`,e),r=um(e.to??`WGS84`,e);this.lossy=n.lossy||r.lossy,this.deferred={options:{...e,projections:[...t]}}}else{let t=e,r=n,i=qm(t.from??`WGS84`,r,t),a=qm(t.to??`WGS84`,r,t);this.targetRenderingProfile=a.implementation?.getRenderingProfile?.bind(a.implementation)??(a.kind===`geographic`?zm(a.parameters,a.primeMeridian):a.kind===`identity`?Op:void 0),this.targetCoverage=a.areaOfUse,this.targetLongitudeOrigin=a.implementation?.longitudeOrigin??(a.kind===`geographic`?a.longitudeWrap??0:0),this.lossy=i.lossy||a.lossy,this.lossy&&(i.kind===`geocentric`||a.kind===`geocentric`)&&H(`Horizontal extraction cannot supply ellipsoidal height for geocentric coordinates`),this.lossy&&(i.verticalGrid||a.verticalGrid)&&H(`Horizontal extraction cannot be combined with vertical grids`),this.forwardTransform=Xm(i,a,!!e.enforceAxis),this.inverseTransform=Xm(a,i,!!e.enforceAxis),this.resolvedDescription=Hm(Vm(i),Vm(a),this.forwardTransform.description,this.inverseTransform.description)}this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectTo=this.projectTo.bind(this),this.unprojectTo=this.unprojectTo.bind(this),this.projectToSync=this.projectToSync.bind(this),this.unprojectToSync=this.unprojectToSync.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this),this.projectSync=this.projectSync.bind(this),this.unprojectSync=this.unprojectSync.bind(this),this.projectFlatSync=this.projectFlatSync.bind(this),this.unprojectFlatSync=this.unprojectFlatSync.bind(this)}load(){let t=this.deferred;return t?t.implementation?Promise.resolve(t.implementation):(t.pending||=e.create(t.options).then(e=>(t.implementation=e,e)).catch(e=>{throw t.pending=void 0,e}),t.pending):Promise.resolve(this)}loadSync(){let t=this.deferred;if(!t)return this;if(!t.implementation){let n=Wm(t.options).map(e=>{let t=jp(e);if(!t)throw Error(`Projection is not preloaded: `+e.name+`. Call preload() first.`);return t});t.implementation=new e({...t.options,projections:n})}return t.implementation}projectSync(e){return this.deferred?this.loadSync().project(e):Zm(e,this.forwardTransform,this.coordinateScratch)}unprojectSync(e){return this.deferred?this.loadSync().unproject(e):Zm(e,this.inverseTransform,this.coordinateScratch)}projectFlatSync(e,t=2){return this.deferred?this.loadSync().projectFlat(e,t):Qm(e,t,this.forwardTransform,this.coordinateScratch)}unprojectFlatSync(e,t=2){return this.deferred?this.loadSync().unprojectFlat(e,t):Qm(e,t,this.inverseTransform,this.coordinateScratch)}async preload(){await this.load()}project(e){return this.deferred?this.projectLoaded(e,!1):Zm(e,this.forwardTransform,this.coordinateScratch)}unproject(e){return this.deferred?this.projectLoaded(e,!0):Zm(e,this.inverseTransform,this.coordinateScratch)}projectTo(e,t){return this.deferred?this.projectToLoaded(e,t,!1):this.projectToSync(e,t)}unprojectTo(e,t){return this.deferred?this.projectToLoaded(e,t,!0):this.unprojectToSync(e,t)}projectToSync(e,t){return this.deferred?this.loadSync().projectTo(e,t):(Rp(e,t,Math.max(e.length,this.forwardTransform.geocentricOutput?3:2)),Zm(e,this.forwardTransform,this.coordinateScratch,t))}unprojectToSync(e,t){return this.deferred?this.loadSync().unprojectTo(e,t):(Rp(e,t,Math.max(e.length,this.inverseTransform.geocentricOutput?3:2)),Zm(e,this.inverseTransform,this.coordinateScratch,t))}projectToLoaded(e,t,n){Rp(e,t,e.length);let r=e.slice();return this.load().then(e=>n?e.unprojectTo(r,t):e.projectTo(r,t))}projectLoaded(e,t){let n=e.slice();return this.load().then(e=>t?e.unproject(n):e.project(n))}projectFlat(e,t=2){return this.deferred?this.load().then(n=>n.projectFlat(e,t)):Qm(e,t,this.forwardTransform,this.coordinateScratch)}unprojectFlat(e,t=2){return this.deferred?this.load().then(n=>n.unprojectFlat(e,t)):Qm(e,t,this.inverseTransform,this.coordinateScratch)}};function Wm(e){let t=Km(e.projections||[]),n=new Set;for(let r of[e.from??`WGS84`,e.to??`WGS84`]){let i=um(r,e);if([`geographic`,`identity`].includes(i.kind))continue;let a=t.get(Gm(i.projection));if(!a)throw new Hp(`missing-plugin`,`Projection plugin is not registered: `+i.projection);n.add(a)}return[...n]}var Gm=e=>e.toLowerCase().replace(/[\s_-]/g,``);function Km(e){let t=new Map;for(let n of e)for(let e of new Set([n.name,...n.aliases||[]].map(Gm))){if(!e||[`longlat`,`latlong`,`latlon`,`lonlat`,`identity`].includes(e)||t.has(e))throw Error(`Duplicate or reserved projection plugin: `+e);t.set(e,n)}return t}function qm(e,t,n){let r=um(e,n),i=t.get(Gm(r.projection));if(![`geographic`,`identity`].includes(r.kind)&&!i)throw new Hp(`missing-plugin`,`Projection plugin is not registered: `+r.projection);let a=new Set([...rm,...i?.parameters||[]]);for(let e of Object.keys(r.parameters)){if(!a.has(e))throw new Hp(`missing-transform-stage`,`Unsupported PROJ parameter: +`+e);let t=im.includes(e)||i?.flags?.includes(e);if(t&&r.parameters[e]!==void 0)throw Error(`Expected a flag without a value: +`+e);if(!t&&!r.parameters[e])throw Error(`PROJ parameter requires a value: +`+e)}if(r.parameters.type&&r.parameters.type!==`crs`)throw Error(`Only +type=crs is supported`);let o=Gm(r.projection)===`fasttransversemercator`?Object.freeze({...r.parameters,approx:void 0}):r.parameters,s=i?.create({...r.ellipsoid,parameters:o,primeMeridian:r.primeMeridian});if(r.kind===`geocentric`&&(!s?.forward3D||!s?.inverse3D))throw Error(`Geocentric plugin must implement 3D operations`);let c=r.datum.grids,l=c?.findIndex(e=>e.name===`null`)??-1,u=c?.slice(0,l<0?void 0:l+1).map(e=>{let t=Object.prototype.hasOwnProperty.call(n.datumGrids||{},e.name)?n.datumGrids[e.name]:void 0;if(t&&typeof t.shift!=`function`)throw Error(`Invalid prepared datum grid: `+e.name);return Object.freeze({...e,grid:t})});for(let e of u||[]){if(e.name===`null`)break;!e.optional&&!e.grid&&H(`Required datum grid is not registered: `+e.name)}let d=u?Object.freeze({...r.datum,grids:Object.freeze(u)}):r.datum,f=Bm(r.parameters.geoidgrids,n.verticalGrids);f&&(r.kind===`geocentric`||r.kind===`identity`||r.lossy)&&H(`Vertical grids require a non-lossy geographic or projected CRS`);let p=i?i.semantics:{id:`@math.gl/geospatial/`+r.kind,version:1};return{...r,datum:d,implementation:s,verticalGrid:f,algorithm:p}}function Jm(e){return Number.isFinite(e.x)&&Number.isFinite(e.y)&&Number.isFinite(e.z)}function Ym(e,t){if(e===`enu`)return;let n=[0,0,0],r=[0,0,0];for(let i=0;i<3;i++){let a=e[i],o=`ew`.includes(a)?0:`ns`.includes(a)?1:2;n[t?i:o]=t?o:i,r[t?i:o]=`wsd`.includes(a)?-1:1}return e=>{let t=e.x,i=e.y,a=e.z;e.x=r[0]*(n[0]===0?t:n[0]===1?i:a),e.y=r[1]*(n[1]===0?t:n[1]===1?i:a),e.z=r[2]*(n[2]===0?t:n[2]===1?i:a)}}function Xm(e,t,n){let r=e.storedAxis||(n?e.axis:`enu`),i=t.storedAxis||(n?t.axis:`enu`),a=Ym(r,!1),o=Ym(i,!0),s=e.implementation&&Ip(e.implementation,!0,e.kind===`geocentric`),c=t.implementation&&Ip(t.implementation,!1,t.kind===`geocentric`),l=ym(e.datum,t.datum),u=e.lossy||t.lossy,d=e.kind===`geocentric`,f=e.kind===`geographic`?e.angularUnit:e.toMeter,p=t.kind===`geographic`?t.angularUnit:t.toMeter,m=d?1:e.verticalUnit,h=t.kind===`geocentric`?p:t.verticalUnit,g=e.primeMeridian,_=t.primeMeridian,v=t.kind===`geographic`?t.longitudeWrap:void 0,y;if(!l&&!e.verticalGrid&&!t.verticalGrid&&!u&&!a&&!o&&!g&&!_&&e.verticalUnit===1&&t.verticalUnit===1&&v===void 0){let n=Object.freeze({inputScale:f,outputScale:p});e.kind===`geographic`&&t.kind===`projected`&&(y=t.implementation?.createForwardFlat?.(n)),e.kind===`projected`&&t.kind===`geographic`&&(y=e.implementation?.createInverseFlat?.(n))}let b=!!(e.verticalGrid||t.verticalGrid)||e.kind===`geocentric`||/[ud]/.test(r.slice(0,2))||/[ud]/.test(i.slice(0,2)),x=[];return a&&x.push(`input-axis`),u&&x.push(`discard-height`),f!==1&&x.push(`input-scale`),s&&x.push(`source-inverse`),m!==1&&x.push(`input-height-scale`),x.push(`geographic-domain-check`),g&&x.push(`source-prime-meridian`),e.verticalGrid&&x.push(`source-vertical-grid`),l&&x.push(`datum`),t.verticalGrid&&x.push(`target-vertical-grid`),_&&x.push(`target-prime-meridian`),v!==void 0&&x.push(`longitude-wrap`),c&&x.push(`target-forward`),p!==1&&x.push(`output-scale`),h!==1&&x.push(`output-height-scale`),u&&x.push(`restore-height`),o&&x.push(`output-axis`),{description:Object.freeze({inputAxis:r,outputAxis:i,requiresInputZ:b,geocentricOutput:t.kind===`geocentric`,stages:Object.freeze(x)}),flat:y,requiresInputZ:b,geocentricOutput:t.kind===`geocentric`,run(n){if(!Jm(n))throw Error(`Coordinates must contain finite x, y and optional z values`);a?.(n);let r=n.z;if(u&&(n.z=0),f!==1&&(n.x*=f,n.y*=f,d&&(n.z*=f)),s?.(n),m!==1&&(n.z*=m),Math.abs(n.y)>Math.PI/2||!Jm(n))throw Error(`Coordinate is outside the geographic domain`);if(n.x+=g,e.verticalGrid&&(n.z+=e.verticalGrid(n.x,n.y)),l?.(n),t.verticalGrid&&(n.z-=t.verticalGrid(n.x,n.y)),n.x-=_,v!==void 0&&(n.x=v+qp(n.x-v)),c?.(n),p!==1&&(n.x/=p,n.y/=p),h!==1&&(n.z/=h),u&&(n.z=r),o?.(n),!Jm(n))throw Error(`Projection produced non-finite coordinates`)}}}function Zm(e,t,n,r){if(e.length<2)throw Error(`Coordinates must contain finite x, y and optional z values`);if(e.length<3&&t.requiresInputZ)throw Error(`This transform requires three ordinates`);let i=Math.max(e.length,t.geocentricOutput?3:2),a=n.acquire();try{if(a.x=e[0],a.y=e[1],a.z=e.length>=3?e[2]:0,t.run(a),r)return zp(e,r,a,i);let n=e.slice();return n[0]=a.x,n[1]=a.y,(e.length>=3||t.geocentricOutput)&&(n[2]=a.z),n}finally{n.release(a)}}function Qm(e,t,n,r){if(!(e instanceof Float32Array||e instanceof Float64Array))throw Error(`In-place projection requires a Float32Array or Float64Array`);if(!Number.isSafeInteger(t)||t<2||e.length%t!==0)throw Error(`Dimension must be an integer >= 2 and divide the typed array length`);if(t<3&&(n.requiresInputZ||n.geocentricOutput))throw Error(`This transform requires a dimension of at least 3`);if(n.flat)return n.flat(e,t),e;let i=r.acquire();try{let r=e instanceof Float32Array;for(let a=0;a<e.length;a+=t){if(i.x=e[a],i.y=e[a+1],i.z=t>=3?e[a+2]:0,n.run(i),r&&(Math.abs(i.x)>34028234663852886e22||Math.abs(i.y)>34028234663852886e22||t>=3&&Math.abs(i.z)>34028234663852886e22))throw Error(`Projected coordinate exceeds Float32 range`);e[a]=i.x,e[a+1]=i.y,t>=3&&(e[a+2]=i.z)}return e}finally{r.release(i)}}var $m=class{constructor(e){this.sample=e,this.result=[0,0,0],this.samples=Array.from({length:4},()=>[0,0,0]),this.coarse=[0,0,0],this.fine=[0,0,0]}evaluate(e,t,n=1e-6){if(!this.difference(e,this.coarse)||!this.difference(e/2,this.fine))return!1;let r=n*Math.max(t,Math.abs(this.fine[0]),Math.abs(this.fine[1]),Math.abs(this.fine[2]));for(let e=0;e<3;e++)if(Math.abs(this.coarse[e]-this.fine[e])>r||(this.fine[e]+=(this.fine[e]-this.coarse[e])/15,!Number.isFinite(this.fine[e])))return!1;for(let e=0;e<3;e++)this.result[e]=this.fine[e];return!0}difference(e,t){let[n,r,i,a]=this.samples;if(!this.sample(-2*e,n)||!this.sample(-e,r)||!this.sample(e,i)||!this.sample(2*e,a))return!1;for(let o=0;o<3;o++)if(t[o]=(n[o]-a[o]+8*(i[o]-r[o]))/(12*e),!Number.isFinite(t[o]))return!1;return!0}},eh=Math.PI/180,th=um(`WGS84`).ellipsoid;function nh(e){return Math.abs(e.semiMajorAxis-6375e3)<.007*6375e3}function rh(e){if(e.length!==3||e.some(e=>!Number.isFinite(e)||e<=0))throw Error(`Invalid CRS rendering scale`);return e}function ih(e,t,n,r){if(e.kind===`geocentric`)return rh([e.toMeter,e.toMeter,e.toMeter]);if(e.kind===`identity`)return rh([...n].map(t=>/[ud]/.test(t)?e.verticalUnit:e.toMeter));let i=[0,0,0],a=[0,0,0],o=[0,0,0],s=[0,0,0],c=Array.from({length:3},()=>[0,0,0]),l=nh(e.ellipsoid)?th:e.ellipsoid,u=0,d=0,f=0,p=!1,m=new $m((e,n)=>{for(let e=0;e<3;e++)a[e]=i[e];a[u]+=e,t.unprojectTo(a,s);let r=s[0]-o[0],c=Math.abs(r)<=180?r:((r+180)%360+360)%360-180;return Math.abs(s[1])>=90?!1:(n[0]=c*d,n[1]=(s[1]-o[1])*f,n[2]=s[2]-o[2],n.every(Number.isFinite))});return a=>{if(p||a.length<2)return null;p=!0;let s;try{if(i[0]=a[0],i[1]=a[1],i[2]=a[2]??0,!i.every(Number.isFinite))return null;t.unprojectTo(i,o);let p=o[1]*eh,h=l.semiMajorAxis,g=l.eccentricitySquared,_=1-g*Math.sin(p)**2;if(d=h*Math.cos(p)/Math.sqrt(_)*eh,f=h*(1-g)/_**1.5*eh,!(d>h*eh*1e-8)||!(f>0))return null;let v=((o[0]-r+180)%360+360)%360-180;if((e.kind===`geographic`?e.longitudeWrap!==void 0:!Object.prototype.hasOwnProperty.call(e.parameters,`over`))&&Math.abs(v)+2/d>=180||Math.abs(o[1])+2/f>=90)return null;for(u=0;u<3;u++){let t=n[u],r=/[ud]/.test(t)?e.verticalUnit:e.kind===`geographic`?(/[ew]/.test(t)?d:f)*e.angularUnit/eh:e.toMeter;if(!m.evaluate(1/r,r))return null;for(let e=0;e<3;e++)c[u][e]=m.result[e]}if(s=c.map(e=>Math.hypot(...e)),e.kind===`projected`){let t=c[n.search(/[ew]/)],r=c[n.search(/[ns]/)],i=Math.abs(t[0]*r[1]-t[1]*r[0])/e.toMeter**2;s[n.search(/[ud]/)]=e.verticalUnit*Math.sqrt(i)}}catch{return null}finally{p=!1}return rh(s)}}var ah={degrees:Math.PI/180,radians:1,gradians:Math.PI/200},oh={...Object.fromEntries(Object.values(ea).map(e=>[e.name,e.metersPerUnit]))};async function sh(e,t,n,r={},i=!1,a){let o=typeof t==`string`?t:JSON.parse(JSON.stringify(t)),s={enforceAxis:n.enforceAxis,mode:n.mode,...r,converters:r.converters&&[...r.converters]},c=a?await a(o,{...n,...s}):o,l=um(c,{...n,...s}),u=await e.createProjectionAsync({...s,from:`WGS84`,to:c}),d=l.storedAxis||(s.enforceAxis?l.axis:`enu`),f=ph(l.kind===`geographic`?l.angularUnit:l.toMeter,l.kind===`geographic`),p=ph(l.verticalUnit,!1),m=[...d].map(e=>l.kind!==`geocentric`&&/[ud]/.test(e)?p:f),h=u.targetProfile;if(!h)throw Error(`Projection must define a rendering profile for CRS retrieval`);let g=(u.targetLongitudeOrigin+l.primeMeridian)*180/Math.PI,_=fh(h,l,d),v=dh(h.normalize),y=ih(l,u,d,g),b=[...new Set([`WGS84`,...s.converters||[]])];if(b.some(e=>typeof e!=`string`||!e.trim()))throw Error(`Converter source CRS must be a nonempty string`);let x=await Promise.all(b.map(async t=>{if(t===`WGS84`)return[t,ch(u,v)];let[n,r]=await Promise.all([e.createProjectionAsync({...s,from:t,to:c}),e.createProjectionAsync({...s,from:`WGS84`,to:t})]);return[t,ch(n,lh(r,v))]})),S=Object.assign(Object.create(null),Object.fromEntries(x)),C={coordinateFrame:l.kind,projection:l.projection,parameters:l.parameters,ellipsoid:{semiMajorAxis:l.ellipsoid.semiMajorAxis,semiMinorAxis:l.ellipsoid.semiMinorAxis},axis:d,xUnit:m[0],yUnit:m[1],zUnit:m[2],areaOfUse:l.areaOfUse,lossy:l.lossy};return{...C,signature:i&&typeof c==`string`&&!s.enforceAxis&&!l.lossy?c:ta(C),renderingBounds:_,renderingScale:y,getRenderingScale:e=>typeof y==`function`?y(e):y,converter:S}}function ch(e,t){return{from:uh(e.project.bind(e),e.projectTo.bind(e)),to:uh(e.unproject.bind(e),e.unprojectTo.bind(e)),normalize:t}}function lh(e,t){function n(n,r){r!==void 0&&Rp(n,r,n.length);let i=e.unproject(Array.from(n)),[a,o,s]=i;return t(i,i),i[0]===a&&i[1]===o&&i[2]===s?r===void 0?Array.from(n):zp(n,r,{x:n[0],y:n[1],z:n[2]??0},n.length):r===void 0?e.project(i):e.projectTo(i,r)}return n}function uh(e,t){function n(n,r){return r===void 0?e(Array.isArray(n)?n:Array.from(n)):t(n,r)}return n}function dh(e){function t(t,n){let r=n??Array(t.length);Rp(t,r,t.length);let i=t[0],a=t[1],o=t[2]??0;if(t.length<2||!Number.isFinite(i)||!Number.isFinite(a)||!Number.isFinite(o))throw Error(`Normalization requires finite longitude, latitude and altitude`);let s={x:i,y:a,z:o};return e?.(s),zp(t,r,s,t.length)}return t}function fh(e,t,n){let r=t.kind===`geographic`?t.angularUnit:t.toMeter,i=[r,r,t.kind===`geocentric`?t.toMeter:t.verticalUnit],a=e.bounds,o=[...n].map(e=>{let t=/[ew]/.test(e)?0:/[ns]/.test(e)?1:2,n=a[0][t]/i[t],r=a[1][t]/i[t];return/[wsd]/.test(e)?[-r,-n]:[n,r]});return[[o[0][0],o[1][0],o[2][0]],[o[0][1],o[1][1],o[2][1]]]}function ph(e,t){let n=t?ah:oh,r=Object.keys(n).find(t=>n[t]===e)||`custom`;return t?{name:r,degreesPerUnit:e/ah.degrees}:{name:r,metersPerUnit:e}}function mh(e){return{...e,projections:e.projections&&[...e.projections],parsers:e.parsers&&[...e.parsers],datumCatalogs:e.datumCatalogs&&[...e.datumCatalogs],aliases:e.aliases&&JSON.parse(JSON.stringify(e.aliases)),datumGrids:e.datumGrids&&{...e.datumGrids},verticalGrids:e.verticalGrids&&{...e.verticalGrids}}}function hh(e){return!!(e.projections||e.parsers||e.datumCatalogs||e.aliases||e.datumGrids||e.verticalGrids||e.resolver)}async function gh(e){let t={...e,from:vh(e.from??`WGS84`),to:vh(e.to??`WGS84`)},[n,r]=await Promise.all([_h(t.from,t),_h(t.to,t)]);return{...t,from:n,to:r}}async function _h(e,t){let n=Up(e,t),r=lm(n.definition,t),i=typeof e==`string`||`type`in e?void 0:`crs`in e?e.crs:e,a=r===n.definition&&i?i.representation:T(r);if(a!==`identifier`||t.parsers?.some(e=>e.canParse(r)))return e;let o=Up((await t.resolver.resolve({state:`explicit`,provenance:i?.provenance??`unknown`,definition:r,representation:a})).input,t).definition;if(!i)return o;let s=e,c={...i,definition:o,representation:T(o),alternatives:[{definition:i.definition,representation:i.representation},...i.alternatives??[]]};return`crs`in s?{...s,crs:c}:c}function vh(e){return typeof e==`string`?e:JSON.parse(JSON.stringify(e))}var yh=class{constructor(e={}){this.options=mh(e),this.useDefinitionSignature=!hh(e)}getCRS(e,t={}){return sh(this,e,this.options,t,this.useDefinitionSignature,this.options.resolver?_h:void 0)}createProjection(e={}){return new Um({...this.options,...e})}async createProjectionAsync(e={}){let t={...this.options,...e};return Um.create(t.resolver?await gh(t):t)}};function bh(e,t){return{...Fp(e,t),createForwardFlat(t){return this.forwardInPlace===e?xh(e,!1,t):void 0},createInverseFlat(e){return this.inverseInPlace===t?xh(t,!0,e):void 0}}}function xh(e,t,{inputScale:n,outputScale:r}){let i=new Pp;return(a,o)=>{let s=i.acquire();try{let i=a instanceof Float32Array;for(let c=0;c<a.length;c+=o){if(s.x=a[c],s.y=a[c+1],s.z=o>=3?a[c+2]:0,!Number.isFinite(s.x)||!Number.isFinite(s.y)||!Number.isFinite(s.z))throw Error(`Coordinates must contain finite x, y and optional z values`);if(n!==1&&(s.x*=n,s.y*=n),t&&e(s),Math.abs(s.y)>Math.PI/2||!Number.isFinite(s.x)||!Number.isFinite(s.y))throw Error(`Coordinate is outside the geographic domain`);if(s.x+=0,s.x-=0,t||e(s),r!==1&&(s.x/=r,s.y/=r),!Number.isFinite(s.x)||!Number.isFinite(s.y))throw Error(`Projection produced non-finite coordinates`);if(i&&(Math.abs(s.x)>34028234663852886e22||Math.abs(s.y)>34028234663852886e22))throw Error(`Projected coordinate exceeds Float32 range`);a[c]=s.x,a[c+1]=s.y}}finally{i.release(s)}}}var Sh={name:`merc`,semantics:{id:`@math.gl/geospatial/merc`,version:1},aliases:[`Mercator`,`Popular Visualisation Pseudo Mercator`,`Mercator_1SP`,`Mercator_Auxiliary_Sphere`,`Mercator_Variant_A`],parameters:[`lon_0`,`lat_ts`,`k`,`k_0`,`x_0`,`y_0`],create({semiMajorAxis:e,eccentricitySquared:t,parameters:n,primeMeridian:r=0}){let i=Math.sqrt(t),a=Object.prototype.hasOwnProperty.call(n,`over`),o=U(n,`lon_0`,0)*Gp,s=U(n,`x_0`,0),c=U(n,`y_0`,0),l=U(n,`k_0`,U(n,`k`,1));if(Object.prototype.hasOwnProperty.call(n,`lat_ts`)){let e=Kp(n,`lat_ts`);l=Math.cos(e)/Math.sqrt(1-t*Math.sin(e)**2)}if(l<=0)throw Error(`Mercator scale must be positive`);let u=e*l,d=Math.atan(Math.sinh(Math.PI)),f=u*Math.PI,p=u*(Math.PI-i*Math.atanh(i*Math.sin(d)));return{longitudeOrigin:o,getRenderingProfile(e){if(e){let t=e[1]<=-90||e[3]>=90,n=[e[0],t?Math.max(-d*180/Math.PI,Math.min(d*180/Math.PI,e[1])):e[1],e[2],t?Math.max(-d*180/Math.PI,Math.min(d*180/Math.PI,e[3])):e[3]],l=e=>c+u*(Math.asinh(Math.tan(e))-i*Math.atanh(i*Math.sin(e)));return Tm(e=>Nm(W([s,s],G(Pm(e,o,a),u)),[l(e[0][1]),l(e[1][1])]),n,o,r,a)}let t=[[s-f,c-p,0],[s+f,c+p,0]];return{bounds:t,normalize:Tm(()=>t,Sp(V(o-Math.PI,-d,o+Math.PI,d),r),o,r,a).normalize}},...bh(e=>{let t=e.x,n=e.y;if(Math.abs(n)>=Math.PI/2)throw Error(`Mercator is undefined at the poles`);let r=Math.asinh(Math.tan(n));e.x=s+u*qp(t-o,a),e.y=c+u*(i===0?r+0:r-i*Math.atanh(i*Math.sin(n)))},e=>{let t=e.x,n=(e.y-c)/u,r=Math.atan(Math.sinh(n));if(i===0){e.x=qp(o+(t-s)/u,a),e.y=r+0;return}for(let c=0;c<30;c++){let c=Math.atan(Math.sinh(n+i*Math.atanh(i*Math.sin(r))));if(Math.abs(c-r)<1e-13){e.x=qp(o+(t-s)/u,a),e.y=c;return}r=c}throw Error(`Mercator inverse did not converge`)})}}},Ch={name:`eqc`,semantics:{id:`@math.gl/geospatial/eqc`,version:1},aliases:[`Equirectangular`,`Equidistant_Cylindrical`,`Equidistant_Cylindrical_Spherical`],parameters:[`lon_0`,`lat_0`,`lat_ts`,`x_0`,`y_0`],create({semiMajorAxis:e,parameters:t,primeMeridian:n=0}){let r=Object.prototype.hasOwnProperty.call(t,`over`),i=U(t,`lon_0`,0)*Gp,a=Kp(t,`lat_0`),o=Math.cos(Kp(t,`lat_ts`)),s=U(t,`x_0`,0),c=U(t,`y_0`,0),l=e*Math.abs(o)*Math.PI;return{longitudeOrigin:i,getRenderingProfile(t){if(t)return Tm(t=>Nm(W([s,s],G(Pm(t,i,r),e*o)),[c+e*(t[0][1]-a),c+e*(t[1][1]-a)]),t,i,n,r);let u=[[s-l,c+e*(-Math.PI/2-a),0],[s+l,c+e*(Math.PI/2-a),0]];return{bounds:u,normalize:Tm(()=>u,Sp(V(i-Math.PI,-(Math.PI/2),i+Math.PI,Math.PI/2),n),i,n,r).normalize}},...Fp(t=>{t.x=s+e*o*qp(t.x-i,r),t.y=c+e*(t.y-a)},t=>{t.x=qp(i+(t.x-s)/(e*o),r),t.y=a+(t.y-c)/e})}}},wh=[`lon_0`,`lat_0`,`x_0`,`y_0`],Th=[`k`,`k_0`];function Eh(e,t,n=0){let r=U(e,t,n);if(t!==`lon_0`&&Math.abs(r)>90)throw Error(`Latitude parameter must be between -90 and 90 degrees: +`+t);return r*Gp}function Dh(e,t){let n=Object.prototype.hasOwnProperty.call(e,t);if(n&&e[t]!==void 0)throw Error(`Expected a flag without a value: +`+t);return n}function Oh({semiMajorAxis:e,eccentricitySquared:t,parameters:n,primeMeridian:r=0}){let i=U(n,`k_0`,U(n,`k`,1));if(i<=0)throw Error(`Projection scale must be positive`);return{primeMeridian:r,a:e,b:e*Math.sqrt(1-t),es:t,e:Math.sqrt(t),ep2:t/(1-t),sphere:t===0,over:Dh(n,`over`),long0:Eh(n,`lon_0`),lat0:Eh(n,`lat_0`),lat1:Eh(n,`lat_1`),lat2:Eh(n,`lat_2`,U(n,`lat_1`,0)),lat_ts:Eh(n,`lat_ts`,NaN),x0:U(n,`x_0`,0),y0:U(n,`y_0`,0),k0:i}}function kh(e,t){if(!Object.prototype.hasOwnProperty.call(t,`lat_1`))throw Error(`Conic projections require +lat_1`);if(Math.abs(e.lat1+e.lat2)<1e-10||Math.abs(e.lat1)>=Math.PI/2||Math.abs(e.lat2)>=Math.PI/2)throw Error(`Conic standard parallels must not be opposite or at a pole`)}function Ah(e,t,n,r,i=Fp){let a=(n,r)=>{let i=n(t,r);if(!i||typeof i!=`object`||!Number.isFinite(i.x)||!Number.isFinite(i.y))throw Error(e+`: coordinate outside projection domain or inverse did not converge`);r.x=i.x,r.y=i.y};return i(e=>a(n,e),e=>a(r,e))}function jh(e,t){let n=Ip(t,!1);return Fp(t=>{let r=t.x,i=t.y,a=Math.atan2(Math.sin(r-e.long0),Math.cos(r-e.long0)),o=Math.abs(Math.abs(e.lat0)-Math.PI/2)<1e-10;if(Math.abs(i+e.lat0)<1e-10&&(o||Math.abs(Math.abs(a)-Math.PI)<1e-10))throw Error(`Azimuthal projection is undefined at the antipode`);n(t)},Ip(t,!0))}function Mh(e,t,n){var r=e*t;return n/Math.sqrt(1-r*r)}function Nh(e,t,n){let r=Math.cos(t);return Math.exp(e*Math.atanh(e*n))*(n>0?r/(1+n):(1-n)/r)}var Ph=1e-10,K=Math.PI/2,q=Math.PI/4,Fh=Math.PI*2,Ih=Math.PI/180,Lh=180/Math.PI,Rh=Math.PI/(180*3600);function zh(e){return e<0?-1:1}function J(e,t){return t||Math.abs(e)<=3.14159265359?e:e-zh(e)*Fh}function Bh(e,t){for(var n=.5*e,r,i,a=K-2*Math.atan(t),o=0;o<=15;o++)if(r=e*Math.sin(a),i=K-2*Math.atan(t*((1-r)/(1+r))**n)-a,a+=i,Math.abs(i)<=1e-10)return a;return-9999}function Vh(e){if(e.k0||=1,e.x0=e.x0||0,e.y0=e.y0||0,e.long0=e.long0||0,!(Math.abs(e.lat1+e.lat2)<1e-10)){var t=e.b/e.a;e.e=Math.sqrt(1-t*t);var n=Math.sin(e.lat1),r=Math.cos(e.lat1),i=Mh(e.e,n,r),a=Nh(e.e,e.lat1,n),o=Math.sin(e.lat2),s=Math.cos(e.lat2),c=Mh(e.e,o,s),l=Nh(e.e,e.lat2,o),u=Nh(e.e,e.lat0,Math.sin(e.lat0));Math.abs(e.lat1-e.lat2)>1e-10?e.ns=Math.log(i/c)/Math.log(a/l):e.ns=n,Number.isNaN(e.ns)&&(e.ns=n),e.f0=i/(e.ns*a**+e.ns),e.rh=Math.abs(Math.abs(e.lat0)-K)<1e-10?0:e.a*e.f0*u**+e.ns}}function Hh(e,t){var n=t.x,r=t.y,i=Math.abs(Math.abs(r)-K),a,o;if(i>1e-10)a=e.sphere?1/Math.tan(Math.PI/4+r/2):Nh(e.e,r,Math.sin(r)),o=e.a*e.f0*a**+e.ns;else{if(i=r*e.ns,i<=0)return null;o=0}var s=e.ns*J(n-e.long0,e.over);return t.x=e.k0*(o*Math.sin(s))+e.x0,t.y=e.k0*(e.rh-o*Math.cos(s))+e.y0,t}function Uh(e,t){var n,r,i,a,o,s=(t.x-e.x0)/e.k0,c=e.rh-(t.y-e.y0)/e.k0;e.ns>0?(n=Math.sqrt(s*s+c*c),r=1):(n=-Math.sqrt(s*s+c*c),r=-1);var l=0;if(n!==0&&(l=Math.atan2(r*s,r*c)),n!==0||e.ns>0){if(r=1/e.ns,i=(n/(e.a*e.f0))**+r,a=Bh(e.e,i),a===-9999)return null}else a=-K;return o=J(l/e.ns+e.long0,e.over),t.x=o,t.y=a,t}function Wh(e){let t={...e,ns:0,f0:0,rh:0};return Vh(t),t}var Gh={name:`lcc`,aliases:[`Lambert Tangential Conformal Conic Projection`,`Lambert_Conformal_Conic`,`Lambert_Conformal_Conic_1SP`,`Lambert_Conformal_Conic_2SP`,`Lambert Conic Conformal (1SP)`,`Lambert Conic Conformal (2SP)`],parameters:[...wh,...Th,`lat_1`,`lat_2`],create(e){let t=Oh(e);kh(t,e.parameters);let n=Wh(t),r=Ah(`lcc`,n,Hh,Uh),i={...bh(e=>{let t=e.y;if(Math.abs(t)===Math.PI/2&&t*n.ns<0)throw Error(`Lambert conformal conic is undefined at the opposite pole`);r.forwardInPlace(e)},r.inverseInPlace)};return Dm(i,V(t.long0-Math.PI,n.ns>0?-Math.PI/3:-Math.PI/2,t.long0+Math.PI,n.ns>0?Math.PI/2:Math.PI/3),e=>Rm(i.forward,e,t.long0,n.ns,n.x0,n.y0+n.k0*n.rh,t.over),t.primeMeridian,t.over)}};function Kh(e,t){var n;return e>1e-7?(n=e*t,(1-e*e)*(t/(1-n*n)-.5/e*Math.log((1-n)/(1+n)))):2*t}function qh(e,t){var n=1-(1-e*e)/(2*e)*Math.log((1-e)/(1+e));let r=4*2**-52*n;if(Math.abs(t)>n+r)return NaN;if(Math.abs(Math.abs(t)-n)<=r)return t<0?-1*K:K;for(var i=Math.asin(.5*t),a,o,s,c,l=0;l<30;l++)if(o=Math.sin(i),s=Math.cos(i),c=e*o,a=(1-c*c)**2/(2*s)*(t/(1-e*e)-o/(1-c*c)+.5/e*Math.log((1-c)/(1+c))),i+=a,Math.abs(a)<=1e-10)return i;return NaN}function Jh(e){Math.abs(e.lat1+e.lat2)<1e-10||(e.temp=e.b/e.a,e.es=1-e.temp**2,e.e3=Math.sqrt(e.es),e.sin_po=Math.sin(e.lat1),e.cos_po=Math.cos(e.lat1),e.t1=e.sin_po,e.con=e.sin_po,e.ms1=Mh(e.e3,e.sin_po,e.cos_po),e.qs1=Kh(e.e3,e.sin_po),e.sin_po=Math.sin(e.lat2),e.cos_po=Math.cos(e.lat2),e.t2=e.sin_po,e.ms2=Mh(e.e3,e.sin_po,e.cos_po),e.qs2=Kh(e.e3,e.sin_po),e.sin_po=Math.sin(e.lat0),e.cos_po=Math.cos(e.lat0),e.t3=e.sin_po,e.qs0=Kh(e.e3,e.sin_po),Math.abs(e.lat1-e.lat2)>1e-10?e.ns0=(e.ms1*e.ms1-e.ms2*e.ms2)/(e.qs2-e.qs1):e.ns0=e.con,e.c=e.ms1*e.ms1+e.ns0*e.qs1,e.rh=e.a*Math.sqrt(e.c-e.ns0*e.qs0)/e.ns0)}function Yh(e,t){var n=t.x,r=t.y;e.sin_phi=Math.sin(r),e.cos_phi=Math.cos(r);var i=Kh(e.e3,e.sin_phi),a=e.a*Math.sqrt(e.c-e.ns0*i)/e.ns0,o=e.ns0*J(n-e.long0,e.over),s=a*Math.sin(o)+e.x0,c=e.rh-a*Math.cos(o)+e.y0;return t.x=s,t.y=c,t}function Xh(e,t){var n,r,i,a,o,s;if(t.x-=e.x0,t.y=e.rh-t.y+e.y0,e.ns0>=0?(n=Math.sqrt(t.x*t.x+t.y*t.y),i=1):(n=-Math.sqrt(t.x*t.x+t.y*t.y),i=-1),a=0,n!==0&&(a=Math.atan2(i*t.x,i*t.y)),i=n*e.ns0/e.a,e.sphere){let t=(e.c-i*i)/(2*e.ns0);if(Math.abs(t)>1+8*2**-52)return null;s=Math.asin(Math.max(-1,Math.min(1,t)))}else{r=(e.c-i*i)/e.ns0;let t=Kh(e.e3,1);s=Math.abs(Math.abs(r)-t)<=16*2**-52*t?Math.sign(r)*Math.PI/2:qh(e.e3,r)}return o=J(a/e.ns0+e.long0,e.over),t.x=o,t.y=s,t}function Zh(e){let t={...e,temp:0,e3:0,sin_po:0,cos_po:0,t1:0,con:0,ms1:0,qs1:0,t2:0,ms2:0,qs2:0,t3:0,qs0:0,ns0:0,c:0,rh:0,sin_phi:0,cos_phi:0};return Jh(t),t}var Qh={name:`aea`,aliases:[`Albers_Conic_Equal_Area`,`Albers_Equal_Area`,`Albers`],parameters:[...wh,`lat_1`,`lat_2`],create(e){let t=Oh(e);kh(t,e.parameters);let n=Zh(t),r={...Ah(`aea`,n,Yh,Xh,bh)};return Dm(r,V(t.long0-Math.PI,-Math.PI/2,t.long0+Math.PI,Math.PI/2),e=>Rm(r.forward,e,t.long0,n.ns0,n.x0,n.y0+n.rh,t.over),t.primeMeridian,t.over)}},$h=1,eg=.25,tg=.046875,ng=.01953125,rg=.01068115234375,ig=.75,ag=.46875,og=.013020833333333334,sg=.007120768229166667,cg=.3645833333333333,lg=.005696614583333333,ug=.3076171875;function dg(e){var t=[];t[0]=$h-e*(eg+e*(tg+e*(ng+e*rg))),t[1]=e*(ig-e*(tg+e*(ng+e*rg)));var n=e*e;return t[2]=n*(ag-e*(og+e*sg)),n*=e,t[3]=n*(cg-e*lg),t[4]=n*e*ug,t}function fg(e,t,n,r){return n*=t,t*=t,r[0]*e-n*(r[1]+t*(r[2]+t*(r[3]+t*r[4])))}var pg=20;function mg(e,t,n){for(var r=1/(1-t),i=e,a=pg;a;--a){var o=Math.sin(i),s=1-t*o*o;if(s=(fg(i,o,Math.cos(i),n)-e)*(s*Math.sqrt(s))*r,i-=s,Math.abs(s)<1e-10)return i}return i}function hg(e){return Math.abs(e)<=K?e:e-zh(e)*Math.PI}function gg(e){Math.abs(e.lat1+e.lat2)<1e-10||(e.temp=e.b/e.a,e.es=1-e.temp**2,e.e=Math.sqrt(e.es),e.en=dg(e.es),e.sin_phi=Math.sin(e.lat1),e.cos_phi=Math.cos(e.lat1),e.ms1=Mh(e.e,e.sin_phi,e.cos_phi),e.ml1=fg(e.lat1,Math.sin(e.lat1),Math.cos(e.lat1),e.en),Math.abs(e.lat1-e.lat2)<1e-10?e.ns=e.sin_phi:(e.sin_phi=Math.sin(e.lat2),e.cos_phi=Math.cos(e.lat2),e.ms2=Mh(e.e,e.sin_phi,e.cos_phi),e.ml2=fg(e.lat2,Math.sin(e.lat2),Math.cos(e.lat2),e.en),e.ns=(e.ms1-e.ms2)/(e.ml2-e.ml1)),e.g=e.ml1+e.ms1/e.ns,e.ml0=fg(e.lat0,Math.sin(e.lat0),Math.cos(e.lat0),e.en),e.rh=e.a*(e.g-e.ml0))}function _g(e,t){var n=t.x,r=t.y,i;if(e.sphere)i=e.a*(e.g-r);else{var a=fg(r,Math.sin(r),Math.cos(r),e.en);i=e.a*(e.g-a)}var o=e.ns*J(n-e.long0,e.over),s=e.x0+i*Math.sin(o),c=e.y0+e.rh-i*Math.cos(o);return t.x=s,t.y=c,t}function vg(e,t){t.x-=e.x0,t.y=e.rh-t.y+e.y0;var n,r,i,a;e.ns>=0?(r=Math.sqrt(t.x*t.x+t.y*t.y),n=1):(r=-Math.sqrt(t.x*t.x+t.y*t.y),n=-1);var o=0;return r!==0&&(o=Math.atan2(n*t.x,n*t.y)),e.sphere?(a=J(e.long0+o/e.ns,e.over),i=hg(e.g-r/e.a),t.x=a,t.y=i,t):(i=mg(e.g-r/e.a,e.es,e.en),a=J(e.long0+o/e.ns,e.over),t.x=a,t.y=i,t)}function yg(e){let t={...e,temp:0,en:[],sin_phi:0,cos_phi:0,ms1:0,ml1:0,ns:0,ms2:0,ml2:0,g:0,ml0:0,rh:0};return gg(t),t}var bg={name:`eqdc`,aliases:[`Equidistant_Conic`],parameters:[...wh,`lat_1`,`lat_2`],create(e){let t=Oh(e);kh(t,e.parameters);let n=yg(t),r=Ah(`eqdc`,n,_g,vg,bh);return Dm(r,V(t.long0-Math.PI,-Math.PI/2,t.long0+Math.PI,Math.PI/2),e=>Rm(r.forward,e,t.long0,n.ns,n.x0,n.y0+n.rh,t.over),t.primeMeridian,t.over)}};function xg(e,t){let n=Math.abs(Math.sin(t)),r=Math.cos(t),i=r*r/(1+n);if(e===0)return 2*i;let a=e*e;return i*(1+a*n)/(1-a*n*n)+(1-a)/e*Math.atanh(e*i/(1-a*n))}function Sg(e,t,n){if(n===0||e===0)return n;let r=xg(e,n)/t;return Math.atan2(Math.sign(n)*(1-r),Math.sqrt(r*(2-r)))}function Cg(e,t,n){if(e===0||n===0||Math.abs(n)===Math.PI/2)return n;let r=Math.abs(Math.sin(n)),i=Math.cos(n),a=t*i*i/(1+r),o=Math.abs(n),s=e*e,c=0,l=Math.PI/2;for(let t=0;t<48;t++){let t=Math.sin(o),r=1-s*t*t,i=2*(1-s)*Math.cos(o)/(r*r),u=xg(e,o)-a,d=u/i;if(Math.abs(d)<2e-15)return Math.sign(n)*o;u>0?c=o:l=o;let f=o+d;o=f>c&&f<l?f:(c+l)/2}throw Error(`Authalic latitude inverse did not converge`)}function wg(e,t){return[Math.cos(t)*Math.cos(e),Math.cos(t)*Math.sin(e),Math.sin(t)]}var Tg=(e,t)=>e[0]*t[0]+e[1]*t[1]+e[2]*t[2];function Eg(e,t,n,r,i){let a=Math.hypot(e,t);if(!a||Math.abs(n)>a+1e-14)return[];let o=Math.atan2(t,e),s=Math.acos(Math.max(-1,Math.min(1,n/a))),c=[];for(let e of[o-s,o+s])for(let t=Math.ceil((r-e)/(2*Math.PI));t<=Math.floor((i-e)/(2*Math.PI));t++)c.push(e+t*2*Math.PI);return c}function Dg(e,t,n,r=!0){let[[i,a],[o,s]]=t,c=(i+o)/2,l=n?[Math.cos(n.latitude),0,Math.sin(n.latitude)]:[1,0,0],u=n?Math.cos(n.distance):-1,d=r?-1/0:1/0,f=[NaN,NaN],p=(t,p)=>{if(t=c+qp(t-c),t<i-1e-12||t>o+1e-12||p<a-1e-12||p>s+1e-12)return;let m=wg(t,p);if(n&&Tg(l,m)<u-1e-13)return;let h=Tg(e,m);(r?h>d:h<d)&&(d=h,f=[t,p])},m=[i,o,...Eg(-e[1],e[0],0,i,o)];for(let t of m){let n=e[0]*Math.cos(t)+e[1]*Math.sin(t);for(let r of[a,s,...Eg(e[2],-n,0,a,s)])p(t,r)}if(n){let[t,,r]=l;for(let e of[a,s])for(let n of Eg(t*Math.cos(e),0,u-r*Math.sin(e),i,o))p(n,e);for(let e of[i,o])for(let n of Eg(t*Math.cos(e),r,u,a,s))p(e,n);let c=Tg(e,l),d=e.map((e,t)=>e-c*l[t]),f=Math.hypot(...d);if(f<=1e-14&&(d=[-l[2],0,l[0]],f=1),f>1e-14)for(let e of[-1,1]){let t=l.map((t,r)=>t*u+e*d[r]*Math.sin(n.distance)/f);p(Math.atan2(t[1],t[0]),Math.atan2(t[2],Math.hypot(t[0],t[1])))}}if(!Number.isFinite(d))throw Error(`CRS coverage does not intersect the rendering domain`);return{value:d,point:f}}function Og(e,t,n){return[Dg(e,t,n,!1).value,Dg(e,t,n).value]}function kg(e,t,n,r,i){let a=Og(e,r,i),o=Og(t,r,i).map(e=>e+n);if(o[0]<=0)throw Error(`Projection rendering denominator is not positive`);let s=a.flatMap(e=>o.map(t=>e/t));return[!1,!0].map(a=>{let o=Math.min(...s),c=Math.max(...s);for(let s=0;s<60;s++){let s=(o+c)/2;Dg(e.map((e,n)=>e-s*t[n]),r,i,a).value-s*n>0?o=s:c=s}return a?c:o})}function Ag(e,t,n,r=Math.PI){let i=[-180,-90,180,90],a=(i,a)=>{let o=xp(i,e.primeMeridian,e.long0),s=V(o[0][0]-e.long0,o[0][1],o[1][0]-e.long0,o[1][1]),c=[Math.cos(e.lat0),0,Math.sin(e.lat0)],l=a?Dg(c,s,void 0,!1).value:-1,u=!a||l<=Math.cos(r)+1e-13?{latitude:e.lat0,distance:t}:void 0,d=Tm(()=>n(s,u),i,e.long0,e.primeMeridian),f=Math.abs(Math.cos(e.lat0))<1e-12,p=(Math.PI/2-t)*180/Math.PI,m=u&&!f&&Ep(t=>{let n=wg(t.x-e.long0,t.y);if(n[0]*Math.cos(e.lat0)+n[2]*Math.sin(e.lat0)>=Math.cos(u.distance)-1e-14)return;if(Math.hypot(n[0]+c[0],n[1],n[2]+c[2])<1e-12){let n=e.lat0+u.distance,r=(s[0][0]+s[1][0])/2,i=r+qp((Math.cos(n)<0?Math.PI:0)-r),a=Math.atan2(Math.sin(n),Math.abs(Math.cos(n)));if(i>=s[0][0]&&i<=s[1][0]&&a>=s[0][1]&&a<=s[1][1]){t.x=i+e.long0,t.y=a;return}}let r=Dg(n,s,u);[t.x,t.y]=[r.point[0]+e.long0,r.point[1]]},e.primeMeridian);return{get bounds(){return n(s,u)},normalize(t){d.normalize(t),u&&f?t.y=e.lat0>0?Math.max(p,t.y):Math.min(-p,t.y):m?.(t);let n=(e.long0+e.primeMeridian)*180/Math.PI,r=t.x-n;Math.abs(r)>180&&(t.x=n+mp(r))}}};return e=>a(e??i,!!e)}function jg(e,t,n,r,i=Math.PI){return{...e,longitudeOrigin:t.long0,getRenderingProfile:Ag(t,n,r,i)}}function Mg(e,t,n,r){let i=[-Math.sin(e.lat0),0,Math.cos(e.lat0)],a=[Math.cos(e.lat0),0,Math.sin(e.lat0)],o=[0,1,0],s=r===`stere`?1:0,c=e=>r===`ortho`?Og(e,t,n):kg(e,a,s,t,n),l=e.a*(r===`stere`?2*e.k0:1);return Nm(W([e.x0,e.x0],G(c(o),l)),W([e.y0,e.y0],G(c(i),l)))}function Ng(e,t,n){let r=Math.sin(e.lat0),i=Math.cos(e.lat0),a=Og([0,0,1],t,n);if(Math.abs(r)<1e-15&&(!n||Math.abs(n.distance-Math.PI/2)<1e-15)){let r=r=>{let i=Dg([0,1,0],t,n,r);return i.value/Math.sqrt(1-e.es*Math.sin(i.point[1])**2)},i=t=>(1-e.es)*t/Math.sqrt(1-e.es*t*t);return Nm(W([e.x0,e.x0],G([r(!1),r(!0)],e.a*e.k0)),W([e.y0,e.y0],G([i(a[0]),i(a[1])],e.a*e.k0)))}let o=a[0]<=0&&a[1]>=0?0:Math.min(a[0]**2,a[1]**2),s=Math.max(a[0]**2,a[1]**2),c=Om(1/Math.sqrt(1-e.es*o),1/Math.sqrt(1-e.es*s)),l=e.a*e.k0,u=e.es*r*i/Math.sqrt(1-e.es*r*r);return Nm(W([e.x0,e.x0],G(km(Og([0,1,0],t,n),c),l)),W([e.y0+l*u,e.y0+l*u],G(km(Og([-r,0,(1-e.es)*i],t,n),c),l)))}function Pg(e,t,n){let r=Og([Math.cos(e.lat0),0,Math.sin(e.lat0)],t,n)[0],i=e.a/Math.sqrt(1-e.es)*Math.acos(Math.max(-1,Math.min(1,r)));return Nm([e.x0-i,e.x0+i],[e.y0-i,e.y0+i])}function Fg(e,t,n,r,i,a,o){let s=i&&Og([0,0,1],r,i),c=V(r[0][0],o(s?Math.asin(Math.max(-1,s[0])):r[0][1]),r[1][0],o(s?Math.asin(Math.min(1,s[1])):r[1][1])),l=i&&{latitude:a,distance:Math.PI-(1-e.es)**2*(Math.PI-i.distance)},u=[Math.cos(a),0,Math.sin(a)],d=[-Math.sin(a),0,Math.cos(a)],f=Og(u,c,l),p=[Math.sqrt(2/(1+Math.min(1,f[1]))),f[0]>-.99999999999999?Math.sqrt(2/(1+f[0])):1/0],m=(t,n)=>{let r=Og(t,c,l),i=r[0]===0?0:r[0]*(r[0]<0?p[1]:p[0]),a=r[1]===0?0:r[1]*(r[1]>0?p[1]:p[0]);return G([Math.max(-2,i),Math.min(2,a)],e.a*n)};return Nm(W([e.x0,e.x0],m([0,1,0],t)),W([e.y0,e.y0],m(d,n)))}function Ig(e,t,n,r,i,a,o=1,s=e.e*Math.atanh(e.e)){let c=V(i[0][0]*o,t(i[0][1]),i[1][0]*o,t(i[1][1])),l=2*s+Math.PI*Math.abs(o-1),u=a&&o===1?Math.min(a.distance+l,Math.PI-(1-e.es)*(Math.PI-a.distance)):a&&a.distance+l,d=u&&u<Math.PI?{latitude:n,distance:u}:void 0,f=[Math.cos(n),0,Math.sin(n)],p=[-Math.sin(n),0,Math.cos(n)],m=c[1][0]-c[0][0]>=2*Math.PI?V(-Math.PI,c[0][1],Math.PI,c[1][1]):c,h=kg([0,1,0],f,1,m,d),g=kg(p,f,1,m,d);return Nm(W([e.x0,e.x0],G(h,r)),W([e.y0,e.y0],G(g,r)))}function Lg(e,t,n,r,i,a){let o=[Math.cos(e.lat0),0,Math.sin(e.lat0)],s=[-Math.sin(e.lat0),0,Math.cos(e.lat0)],c=[0,1,0],l=Math.cos(r),u=Math.sin(r),d=Math.cos(n),f=Math.sin(n),p=s.map((e,t)=>l*e+u*c[t]),m=c.map((e,t)=>l*e-u*s[t]),h=o.map((e,t)=>-d*e+f*p[t]),g=kg(m,h,d*t,i,a),_=kg(p,h,d*t,i,a);return Nm(W([e.x0,e.x0],G(g,e.a*(t-1)*d)),W([e.y0,e.y0],G(_,e.a*(t-1))))}function Rg(e,t,n){let r=Og([Math.cos(e.lat0),0,Math.sin(e.lat0)],t,n)[0],i=Math.acos(Math.max(-1,Math.min(1,r))),a=1-e.es,o=e.a*i/Math.sqrt(a),s=Math.cos(i/a);if(!(s>0))throw Error(`Gnomonic rendering coverage approaches its ellipsoidal horizon`);let c=o/s;return Nm([e.x0-c,e.x0+c],[e.y0-c,e.y0+c])}function zg(e,t,n,r,i,a,o){let s=i*n/o,c=r*t-a*n*e/o,l=r*e+a*n*t/o;return Math.atan2(l,Math.hypot(s,c))}function Bg(e){var t=Math.abs(e.lat0);if(Math.abs(t-K)<1e-10?e.mode=e.lat0<0?1:2:Math.abs(t)<1e-10?e.mode=3:e.mode=4,e.es>0){var n;switch(e.qp=Kh(e.e,1),e.mmf=.5/(1-e.es),e.mode){case 2:e.dd=1;break;case 1:e.dd=1;break;case 3:e.rq=Math.sqrt(.5*e.qp),e.dd=1/e.rq,e.xmf=1,e.ymf=.5*e.qp;break;case 4:e.rq=Math.sqrt(.5*e.qp),n=Math.sin(e.lat0),e.sinb1=Kh(e.e,n)/e.qp,e.cosb1=Math.sqrt(1-e.sinb1*e.sinb1),e.dd=Math.cos(e.lat0)/(Math.sqrt(1-e.es*n*n)*e.rq*e.cosb1),e.xmf=e.rq,e.ymf=e.xmf/e.dd,e.xmf*=e.dd;break}}else e.mode===4&&(e.sinph0=Math.sin(e.lat0),e.cosph0=Math.cos(e.lat0))}function Vg(e,t){var n,r,i,a,o,s,c,l,u,d,f=t.x,p=t.y;if(f=J(f-e.long0,e.over),e.sphere){if(o=Math.sin(p),d=Math.cos(p),i=Math.cos(f),e.mode===4||e.mode===3){if(r=e.mode===3?1+d*i:1+e.sinph0*o+e.cosph0*d*i,r<=1e-10)return null;r=Math.sqrt(2/r),n=r*d*Math.sin(f),r*=e.mode===3?o:e.cosph0*o-e.sinph0*d*i}else if(e.mode===2||e.mode===1){if(e.mode===2&&(i=-i),Math.abs(p+e.lat0)<1e-10)return null;r=q-p*.5,r=2*(e.mode===1?Math.cos(r):Math.sin(r)),n=r*Math.sin(f),r*=i}}else{if(c=0,l=0,u=0,i=Math.cos(f),a=Math.sin(f),o=Math.sin(p),s=Kh(e.e,o),e.mode===4||e.mode===3){c=s/e.qp;let t=xg(e.e,p)/e.qp;l=Math.sqrt(t*(2-t))}switch(e.mode){case 4:u=1+e.sinb1*c+e.cosb1*l*i;break;case 3:u=1+l*i;break;case 2:u=K+p,s=p>=0?xg(e.e,p):2*e.qp-xg(e.e,p);break;case 1:u=p-K,s=p<=0?xg(e.e,p):2*e.qp-xg(e.e,p);break}if(Math.abs(u)<1e-10)return null;switch(e.mode){case 4:case 3:u=Math.sqrt(2/u),e.mode===4?r=e.ymf*u*(e.cosb1*c-e.sinb1*l*i):(u=Math.sqrt(2/(1+l*i)),r=u*c*e.ymf),n=e.xmf*u*l*a;break;case 2:case 1:s>=0?(u=Math.sqrt(s),n=u*a,r=i*(e.mode===1?u:-u)):n=r=0;break}}return t.x=e.a*n+e.x0,t.y=e.a*r+e.y0,t}function Hg(e,t){t.x-=e.x0,t.y-=e.y0;var n=t.x/e.a,r=t.y/e.a,i,a,o,s,c,l,u;if(e.sphere){var d=0,f,p=0;if(f=Math.sqrt(n*n+r*r),a=f*.5,a>1+8*2**-52)return null;switch(a=2*Math.asin(Math.min(1,a)),(e.mode===4||e.mode===3)&&(p=Math.sin(a),d=Math.cos(a)),e.mode){case 3:a=Math.abs(f)<=1e-10?0:zg(0,1,p,d,n,r,f),n*=p,r=d*f;break;case 4:a=Math.abs(f)<=1e-10?e.lat0:zg(e.sinph0,e.cosph0,p,d,n,r,f),n*=p*e.cosph0,r=(d-Math.sin(a)*e.sinph0)*f;break;case 2:r=-r,a=K-a;break;case 1:a-=K;break}i=r===0&&(e.mode===3||e.mode===4)?0:Math.atan2(n,r)}else{if(u=0,e.mode===4||e.mode===3){if(n/=e.dd,r*=e.dd,l=Math.sqrt(n*n+r*r),l<1e-10)return t.x=e.long0,t.y=e.lat0,t;let i=.5*l/e.rq;if(i>1+8*2**-52)return null;s=2*Math.asin(Math.min(1,i)),o=Math.cos(s),s=Math.sin(s);let d=zg(e.mode===4?e.sinb1:0,e.mode===4?e.cosb1:1,s,o,n,r,l);a=Cg(e.e,e.qp,d),n*=s,e.mode===4?(u=o*e.sinb1+r*s*e.cosb1/l,c=e.qp*u,r=l*e.cosb1*o-r*e.sinb1*s):(u=r*s/l,c=e.qp*u,r=l*o)}else if(e.mode===2||e.mode===1){if(e.mode===2&&(r=-r),c=n*n+r*r,!c)return t.x=e.long0,t.y=e.lat0,t;u=1-c/e.qp,e.mode===1&&(u=-u)}if(i=Math.atan2(n,r),Math.abs(u)>1+8*2**-52)return null;if(e.mode===2||e.mode===1){let t=Math.max(0,Math.min(2,c/e.qp)),n=Math.atan2(u,Math.sqrt(t*(2-t)));a=Cg(e.e,e.qp,n)}}return t.x=J(e.long0+i,e.over),t.y=a,t}function Ug(e){let t={...e,mode:0,qp:0,mmf:0,dd:0,rq:0,xmf:0,ymf:0,sinb1:0,cosb1:0,sinph0:0,cosph0:0};return Bg(t),t}var Wg={name:`laea`,aliases:[`Lambert Azimuthal Equal Area`,`Lambert_Azimuthal_Equal_Area`],parameters:wh,create(e){let t=Oh(e),n=Ug(t);return jg(jh(t,Ah(`laea`,n,Vg,Hg)),t,Math.PI*179/180,(e,r)=>Fg(t,t.sphere?1:n.xmf||Math.sqrt(n.qp/2),t.sphere?1:n.ymf||Math.sqrt(n.qp/2),e,r,t.sphere?t.lat0:Sg(t.e,n.qp,t.lat0),t.sphere?e=>e:e=>Sg(t.e,n.qp,e)))}};function Gg(e,t,n){return t*=n,Math.tan(.5*(K+e))*((1-t)/(1+t))**(.5*n)}function Kg(e){e.x0=e.x0||0,e.y0=e.y0||0,e.lat0=e.lat0||0,e.long0=e.long0||0,e.coslat0=Math.cos(e.lat0),e.sinlat0=Math.sin(e.lat0),e.sphere?!Number.isNaN(e.lat_ts)&&Math.abs(e.coslat0)<=1e-10&&(e.k0=.5*(1+zh(e.lat0)*Math.sin(e.lat_ts))):(Math.abs(e.coslat0)<=1e-10&&(e.lat0>0?e.con=1:e.con=-1),e.cons=Math.sqrt((1+e.e)**+(1+e.e)*(1-e.e)**(1-e.e)),!Number.isNaN(e.lat_ts)&&Math.abs(e.coslat0)<=1e-10&&Math.abs(Math.cos(e.lat_ts))>1e-10&&(e.k0=.5*e.cons*Mh(e.e,Math.sin(e.lat_ts),Math.cos(e.lat_ts))/Nh(e.e,e.con*e.lat_ts,e.con*Math.sin(e.lat_ts))),e.ms1=Mh(e.e,e.sinlat0,e.coslat0),e.X0=2*Math.atan(Gg(e.lat0,e.sinlat0,e.e))-K,e.cosX0=Math.cos(e.X0),e.sinX0=Math.sin(e.X0))}function qg(e,t){var n=t.x,r=t.y,i=Math.sin(r),a=Math.cos(r),o,s,c,l,u,d,f=J(n-e.long0,e.over);if(Math.abs(Math.abs(n-e.long0)-Math.PI)<=1e-10&&Math.abs(r+e.lat0)<=1e-10)return t.x=NaN,t.y=NaN,t;if(e.sphere&&Math.abs(e.coslat0)<=1e-10){let n=e.lat0>0?1:-1,i=2*e.a*e.k0*Math.tan(Math.PI/4-n*r/2);return t.x=e.x0+i*Math.sin(f),t.y=e.y0-n*i*Math.cos(f),t}return e.sphere?(o=2*e.k0/(1+e.sinlat0*i+e.coslat0*a*Math.cos(f)),t.x=e.a*o*a*Math.sin(f)+e.x0,t.y=e.a*o*(e.coslat0*i-e.sinlat0*a*Math.cos(f))+e.y0,t):(s=2*Math.atan(Gg(r,i,e.e))-K,l=Math.cos(s),c=Math.sin(s),Math.abs(e.coslat0)<=1e-10?(u=Nh(e.e,r*e.con,e.con*i),d=2*e.a*e.k0*u/e.cons,t.x=e.x0+d*Math.sin(n-e.long0),t.y=e.y0-e.con*d*Math.cos(n-e.long0),t):(Math.abs(e.sinlat0)<1e-10?(o=2*e.a*e.k0/(1+l*Math.cos(f)),t.y=o*c+e.y0):(o=2*e.a*e.k0*e.ms1/(e.cosX0*(1+e.sinX0*c+e.cosX0*l*Math.cos(f))),t.y=o*(e.cosX0*c-e.sinX0*l*Math.cos(f))+e.y0),t.x=o*l*Math.sin(f)+e.x0,t))}function Jg(e,t){t.x-=e.x0,t.y-=e.y0;var n,r,i,a,o,s=Math.sqrt(t.x*t.x+t.y*t.y);if(e.sphere){var c=2*Math.atan(s/(2*e.a*e.k0));return n=e.long0,r=e.lat0,s<=1e-10?(t.x=n,t.y=r,t):(r=zg(e.sinlat0,e.coslat0,Math.sin(c),Math.cos(c),t.x,t.y,s),n=Math.abs(e.coslat0)<1e-10?e.lat0>0?J(e.long0+Math.atan2(t.x,-1*t.y),e.over):J(e.long0+Math.atan2(t.x,t.y),e.over):J(e.long0+Math.atan2(t.x*Math.sin(c),s*e.coslat0*Math.cos(c)-t.y*e.sinlat0*Math.sin(c)),e.over),t.x=n,t.y=r,t)}else if(Math.abs(e.coslat0)<=1e-10){if(s<=1e-10)return r=e.lat0,n=e.long0,t.x=n,t.y=r,t;t.x*=e.con,t.y*=e.con,i=s*e.cons/(2*e.a*e.k0),r=e.con*Bh(e.e,i),n=e.con*J(e.con*e.long0+Math.atan2(t.x,-1*t.y),e.over)}else a=2*Math.atan(s*e.cosX0/(2*e.a*e.k0*e.ms1)),n=e.long0,s<=1e-10?o=e.X0:(o=zg(e.sinX0,e.cosX0,Math.sin(a),Math.cos(a),t.x,t.y,s),n=J(e.long0+Math.atan2(t.x*Math.sin(a),s*e.cosX0*Math.cos(a)-t.y*e.sinX0*Math.sin(a)),e.over)),r=-1*Bh(e.e,Math.tan(.5*(K+o)));return t.x=n,t.y=r,t}function Yg(e){let t={...e,coslat0:0,sinlat0:0,con:0,cons:0,ms1:0,X0:0,cosX0:0,sinX0:0};return Kg(t),t}var Xg={name:`stere`,aliases:[`Stereographic_South_Pole`,`Polar_Stereographic_variant_A`,`Polar_Stereographic_variant_B`,`Polar_Stereographic`],parameters:[...wh,...Th,`lat_ts`],create(e){let t=Oh(e),n=Yg(t);return jg(jh(t,Ah(`stere`,n,qg,Jg)),t,150*Math.PI/180,(e,t)=>n.sphere?Mg(n,e,t,`stere`):Ig(n,e=>2*Math.atan(Math.tan(Math.PI/4+e/2)*((1-n.e*Math.sin(e))/(1+n.e*Math.sin(e)))**(n.e/2))-Math.PI/2,n.X0,2*n.a*n.k0*(Math.abs(n.coslat0)<1e-10?1/n.cons:n.ms1/n.cosX0),e,t))}};function Zg(e,t){return((1-e)/(1+e))**t}var Qg=20;function $g(e){var t=Math.sin(e.lat0),n=Math.cos(e.lat0);n*=n,e.rc=Math.sqrt(1-e.es)/(1-e.es*t*t),e.C=Math.sqrt(1+e.es*n*n/(1-e.es)),e.phic0=Math.asin(t/e.C),e.ratexp=.5*e.C*e.e,e.K=Math.tan(.5*e.phic0+q)/(Math.tan(.5*e.lat0+q)**+e.C*Zg(e.e*t,e.ratexp))}function e_(e,t){var n=t.x,r=t.y;return t.y=2*Math.atan(e.K*Math.tan(.5*r+q)**+e.C*Zg(e.e*Math.sin(r),e.ratexp))-K,t.x=e.C*n,t}function t_(e,t){for(var n=1e-14,r=t.x/e.C,i=t.y,a=(Math.tan(.5*i+q)/e.K)**(1/e.C),o=Qg;o>0&&(i=2*Math.atan(a*Zg(e.e*Math.sin(t.y),-.5*e.e))-K,!(Math.abs(i-t.y)<n));--o)t.y=i;return o?(t.x=r,t.y=i,t):null}function n_(e){let t={...e,rc:0,C:0,phic0:0,ratexp:0,K:0};return $g(t),t}function r_(e,t){e=Math.abs(e),t=Math.abs(t);var n=Math.max(e,t),r=Math.min(e,t)/(n||1);return n*Math.sqrt(1+r**2)}function i_(e){e.rc&&(e.sinc0=Math.sin(e.phic0),e.cosc0=Math.cos(e.phic0),e.R2=2*e.rc)}function a_(e,t){var n,r,i,a;return t.x=J(t.x-e.long0,e.over),e_(e,t),n=Math.sin(t.y),r=Math.cos(t.y),i=Math.cos(t.x),a=e.k0*e.R2/(1+e.sinc0*n+e.cosc0*r*i),t.x=a*r*Math.sin(t.x),t.y=a*(e.cosc0*n-e.sinc0*r*i),t.x=e.a*t.x+e.x0,t.y=e.a*t.y+e.y0,t}function o_(e,t){var n,r,i,a,o;if(t.x=(t.x-e.x0)/e.a,t.y=(t.y-e.y0)/e.a,t.x/=e.k0,t.y/=e.k0,o=r_(t.x,t.y),o){var s=2*Math.atan2(o,e.R2);n=Math.sin(s),r=Math.cos(s),a=zg(e.sinc0,e.cosc0,n,r,t.x,t.y,o),i=Math.atan2(t.x*n,o*e.cosc0*r-t.y*e.sinc0*n)}else a=e.phic0,i=0;if(t.x=i,t.y=a,!t_(e,t))throw Error(`Oblique stereographic inverse did not converge`);return t.x=J(t.x+e.long0,e.over),t}function s_(e){let t={...n_(e),sinc0:0,cosc0:0,R2:0};return i_(t),t}var c_={name:`sterea`,aliases:[`Stereographic_North_Pole`,`Oblique_Stereographic`,`Oblique Stereographic Alternative`,`Double_Stereographic`],parameters:[...wh,...Th],create(e){let t=Oh(e);if(Math.abs(t.lat0)===Math.PI/2)throw Error(`sterea requires a non-polar origin; use stere at the poles`);let n=s_(t);return jg(jh(t,Ah(`sterea`,n,a_,o_)),t,Math.PI*150/180,(e,r)=>Ig(t,e=>2*Math.atan(n.K*Math.tan(Math.PI/4+e/2)**+n.C*((1-t.e*Math.sin(e))/(1+t.e*Math.sin(e)))**n.ratexp)-Math.PI/2,n.phic0,t.a*t.k0*n.R2,e,r,n.C,Math.abs(Math.log(n.C))+Math.abs(Math.log(n.K))+n.C*t.e*Math.atanh(t.e)))}};function l_(e,t){let n=1-e*Math.sin(t)**2;return(1-e)/(n*Math.sqrt(n))}function u_(e,t,n,r){return l_(e,t-n*r)+l_(e,t+n*r)}function d_(e,t,n,r){let i=(r-n)/8,a=0;for(let e=0;e<4;e++){let r=n+(2*e+1)*i;a+=i*(.362683783378362*u_(t,r,i,.1834346424956498)+.3137066458778873*u_(t,r,i,.525532409916329)+.2223810344533745*u_(t,r,i,.7966664774136267)+.1012285362903763*u_(t,r,i,.9602898564975363))}return e*a}function f_(e,t,n){let r=Math.PI/2,i=d_(e,t,0,r);if(!Number.isFinite(n)||Math.abs(n)>i)return NaN;let a=-r,o=r,s=n/i*r;for(let r=0;r<48;r++){let r=d_(e,t,0,s)-n;if(Math.abs(r)<=8*2**-52*e)return s;r>0?o=s:a=s;let i=s-r/(e*l_(t,s));s=i>a&&i<o?i:(a+o)/2}return NaN}function p_(e,t,n,r,i,a,o){let s=r-t,c=Math.atan((1-a)*Math.tan(e)),l=Math.atan((1-a)*Math.tan(n)),u=Math.sin(c),d=Math.cos(c),f=Math.sin(l),p=Math.cos(l),m=s,h,g=100,_,v,y,b,x,S,C,w,T,E,D,O,k,A;do{if(_=Math.sin(m),v=Math.cos(m),y=Math.sqrt(p*_*(p*_)+(d*f-u*p*v)*(d*f-u*p*v)),y===0){o.x=0,o.y=0;return}b=u*f+d*p*v,x=Math.atan2(y,b),S=d*p*_/y,C=1-S*S,w=C===0?0:b-2*u*f/C,T=a/16*C*(4+a*(4-3*C)),h=m,m=s+(1-T)*a*S*(x+T*y*(w+T*b*(-1+2*w*w)))}while(Math.abs(m-h)>1e-12&&--g>0);if(g===0){o.x=NaN,o.y=NaN;return}E=C*(i*i-i*(1-a)*(i*(1-a)))/(i*(1-a)*(i*(1-a))),D=1+E/16384*(4096+E*(-768+E*(320-175*E))),O=E/1024*(256+E*(-128+E*(74-47*E))),k=O*y*(w+O/4*(b*(-1+2*w*w)-O/6*w*(-3+4*y*y)*(-3+4*w*w))),A=i*(1-a)*D*(x-k),o.x=Math.atan2(p*_,d*f-u*p*v),o.y=A}function m_(e,t,n,r,i,a,o){let s=Math.atan((1-a)*Math.tan(e)),c=Math.sin(s),l=Math.cos(s),u=Math.sin(n),d=Math.cos(n),f=Math.atan2(c,l*d),p=l*u,m=1-p*p,h=m*(i*i-i*(1-a)*(i*(1-a)))/(i*(1-a)*(i*(1-a))),g=1+h/16384*(4096+h*(-768+h*(320-175*h))),_=h/1024*(256+h*(-128+h*(74-47*h))),v=r/(i*(1-a)*g),y,b=100,x,S,C,w;do x=Math.cos(2*f+v),S=Math.sin(v),C=Math.cos(v),w=_*S*(x+_/4*(C*(-1+2*x*x)-_/6*x*(-3+4*S*S)*(-3+4*x*x))),y=v,v=r/(i*(1-a)*g)+w;while(Math.abs(v-y)>1e-12&&--b>0);if(b===0){o.x=NaN,o.y=NaN;return}let T=c*S-l*C*d,E=Math.atan2(c*C+l*S*d,(1-a)*Math.sqrt(p*p+T*T)),D=Math.atan2(S*u,l*C-c*S*d),O=a/16*m*(4+a*(4-3*m));o.x=t+(D-(1-O)*a*p*(v+O*S*(x+O*C*(-1+2*x*x)))),o.y=E}function h_(e){e.sin_p12=Math.sin(e.lat0),e.cos_p12=Math.cos(e.lat0),e.x0=e.x0||0,e.y0=e.y0||0,e.long0=e.long0||0,e.f=e.es/(1+Math.sqrt(1-e.es))}function g_(e,t){var n=t.x,r=t.y,i=Math.sin(t.y),a=Math.cos(t.y),o=J(n-e.long0,e.over),s,c,l,u,d;if(e.sphere)return Math.abs(e.sin_p12-1)<=1e-10?(t.x=e.x0+e.a*(K-r)*Math.sin(o),t.y=e.y0-e.a*(K-r)*Math.cos(o),t):Math.abs(e.sin_p12+1)<=1e-10?(t.x=e.x0+e.a*(K+r)*Math.sin(o),t.y=e.y0+e.a*(K+r)*Math.cos(o),t):(u=e.sin_p12*i+e.cos_p12*a*Math.cos(o),c=Math.acos(u),l=c?c/Math.sin(c):1,t.x=e.x0+e.a*l*a*Math.sin(o),t.y=e.y0+e.a*l*(e.cos_p12*i-e.sin_p12*a*Math.cos(o)),t);if(Math.abs(e.sin_p12-1)<=1e-10)return s=d_(e.a,e.es,r,K),t.x=e.x0+s*Math.sin(o),t.y=e.y0-s*Math.cos(o),t;if(Math.abs(e.sin_p12+1)<=1e-10)return s=d_(e.a,e.es,-K,r),t.x=e.x0+s*Math.sin(o),t.y=e.y0+s*Math.cos(o),t;{if(Math.abs(o)<1e-10&&Math.abs(r-e.lat0)<1e-10)return t.x=e.x0,t.y=e.y0,t;p_(e.lat0,e.long0,r,n,e.a,e.f,t),d=t.x;let i=t.y;return t.x=e.x0+i*Math.sin(d),t.y=e.y0+i*Math.cos(d),t}}function __(e,t){t.x-=e.x0,t.y-=e.y0;var n,r,i,a,o,s,c,l,u,d,f;if(e.sphere){if(n=Math.sqrt(t.x*t.x+t.y*t.y),n>2*K*e.a)return null;if(r=n/e.a,i=Math.sin(r),a=Math.cos(r),o=e.long0,Math.abs(n)<=1e-10)s=e.lat0;else if(s=zg(e.sin_p12,e.cos_p12,i,a,t.x,t.y,n),c=Math.abs(e.lat0)-K,Math.abs(c)<=1e-10)if(e.lat0>=0){if(!Number.isFinite(s))return null;o=J(e.long0+Math.atan2(t.x,-t.y),e.over)}else o=J(e.long0-Math.atan2(-t.x,t.y),e.over);else o=J(e.long0+Math.atan2(t.x*i,n*e.cos_p12*a-t.y*e.sin_p12*i),e.over);return t.x=o,t.y=s,t}else if(Math.abs(e.sin_p12-1)<=1e-10)return l=d_(e.a,e.es,0,K),n=Math.sqrt(t.x*t.x+t.y*t.y),u=l-n,s=f_(e.a,e.es,u),Number.isFinite(s)?(o=J(e.long0+Math.atan2(t.x,-1*t.y),e.over),t.x=o,t.y=s,t):null;else if(Math.abs(e.sin_p12+1)<=1e-10)return l=d_(e.a,e.es,0,K),n=Math.sqrt(t.x*t.x+t.y*t.y),u=n-l,s=f_(e.a,e.es,u),Number.isFinite(s)?(o=J(e.long0+Math.atan2(t.x,t.y),e.over),t.x=o,t.y=s,t):null;else return d=Math.atan2(t.x,t.y),f=Math.sqrt(t.x*t.x+t.y*t.y),m_(e.lat0,e.long0,d,f,e.a,e.f,t),t}function v_(e){let t={...e,sin_p12:0,cos_p12:0,f:0};return h_(t),t}var y_={name:`aeqd`,aliases:[`Azimuthal_Equidistant`],parameters:wh,create(e){let t=Oh(e);return jg(jh(t,Ah(`aeqd`,v_(t),g_,__)),t,Math.PI*179/180,(e,n)=>Pg(t,e,n))}};function b_(e){var t=Math.exp(e);return t=(t-1/t)/2,t}function x_(e){var t=1+e,n=t-1;return n===0?e:e*Math.log(t)/n}function S_(e){var t=Math.abs(e);return t=x_(t*(1+t/(r_(1,t)+1))),e<0?-t:t}function C_(e,t){for(var n=2*Math.cos(2*t),r=e.length-1,i=e[r],a=0,o;--r>=0;)o=-a+n*i+e[r],a=i,i=o;return t+o*Math.sin(2*t)}function w_(e,t){for(var n=2*Math.cos(t),r=e.length-1,i=e[r],a=0,o;--r>=0;)o=-a+n*i+e[r],a=i,i=o;return Math.sin(t)*o}function T_(e){var t=Math.exp(e);return t=(t+1/t)/2,t}function E_(e,t,n,r){for(var i=Math.sin(t),a=Math.cos(t),o=b_(n),s=T_(n),c=2*a*s,l=-2*i*o,u=e.length-1,d=e[u],f=0,p=0,m=0,h,g;--u>=0;)h=p,g=f,p=d,f=m,d=-h+c*p-l*f+e[u],m=-g+l*p+c*f;c=i*s,l=a*o,r.x=c*d-l*m,r.y=c*m+l*d}function D_(e){e.x0=e.x0===void 0?0:e.x0,e.y0=e.y0===void 0?0:e.y0,e.long0=e.long0===void 0?0:e.long0,e.lat0=e.lat0===void 0?0:e.lat0,e.k0=e.k0===void 0?1:e.k0,e.cgb=[],e.cbg=[],e.utg=[],e.gtu=[];var t=e.es/(1+Math.sqrt(1-e.es)),n=t/(2-t),r=n;e.cgb[0]=n*(2+n*(-2/3+n*(-2+n*(116/45+n*(26/45+-2854/675*n))))),e.cbg[0]=n*(-2+n*(2/3+n*(4/3+n*(-82/45+n*(32/45+4642/4725*n))))),r*=n,e.cgb[1]=r*(7/3+n*(-8/5+n*(-227/45+n*(2704/315+2323/945*n)))),e.cbg[1]=r*(5/3+n*(-16/15+n*(-13/9+n*(904/315+-1522/945*n)))),r*=n,e.cgb[2]=r*(56/15+n*(-136/35+n*(-1262/105+73814/2835*n))),e.cbg[2]=r*(-26/15+n*(34/21+n*(8/5+-12686/2835*n))),r*=n,e.cgb[3]=r*(4279/630+n*(-332/35+-399572/14175*n)),e.cbg[3]=r*(1237/630+n*(-12/5+-24832/14175*n)),r*=n,e.cgb[4]=r*(4174/315+-144838/6237*n),e.cbg[4]=r*(-734/315+109598/31185*n),r*=n,e.cgb[5]=601676/22275*r,e.cbg[5]=444337/155925*r,r=n**2,e.Qn=e.k0/(1+n)*(1+r*(1/4+r*(1/64+r/256))),e.utg[0]=n*(-.5+n*(2/3+n*(-37/96+n*(1/360+n*(81/512+-96199/604800*n))))),e.gtu[0]=n*(.5+n*(-2/3+n*(5/16+n*(41/180+n*(-127/288+7891/37800*n))))),e.utg[1]=r*(-1/48+n*(-1/15+n*(437/1440+n*(-46/105+1118711/3870720*n)))),e.gtu[1]=r*(13/48+n*(-3/5+n*(557/1440+n*(281/630+-1983433/1935360*n)))),r*=n,e.utg[2]=r*(-17/480+n*(37/840+n*(209/4480+-5569/90720*n))),e.gtu[2]=r*(61/240+n*(-103/140+n*(15061/26880+167603/181440*n))),r*=n,e.utg[3]=r*(-4397/161280+n*(11/504+830251/7257600*n)),e.gtu[3]=r*(49561/161280+n*(-179/168+6601661/7257600*n)),r*=n,e.utg[4]=r*(-4583/161280+108847/3991680*n),e.gtu[4]=r*(34729/80640+-3418889/1995840*n),r*=n,e.utg[5]=-20648693/638668800*r,e.gtu[5]=212378941/319334400*r;var i=C_(e.cbg,e.lat0);e.Zb=-e.Qn*(i+w_(e.gtu,2*i))}function O_(e,t){var n=J(t.x-e.long0,e.over),r=t.y;r=C_(e.cbg,r);var i=Math.sin(r),a=Math.cos(r),o=Math.sin(n),s=Math.cos(n);r=Math.atan2(i,s*a),n=Math.atan2(o*a,r_(i,a*s)),n=S_(Math.tan(n)),E_(e.gtu,2*r,2*n,t),r+=t.x,n+=t.y;var c,l;return Math.abs(n)<=2.623395162778?(c=e.a*(e.Qn*n)+e.x0,l=e.a*(e.Qn*r+e.Zb)+e.y0):(c=1/0,l=1/0),t.x=c,t.y=l,t}function k_(e,t){var n=(t.x-e.x0)*(1/e.a),r=(t.y-e.y0)*(1/e.a);r=(r-e.Zb)/e.Qn,n/=e.Qn;var i,a;if(Math.abs(n)<=2.623395162778){E_(e.utg,2*r,2*n,t),r+=t.x,n+=t.y,n=Math.atan(b_(n));var o=Math.sin(r),s=Math.cos(r),c=Math.sin(n),l=Math.cos(n);r=Math.atan2(o*l,r_(c,l*s)),n=Math.atan2(c,l*s),i=J(n+e.long0,e.over),a=C_(e.cgb,r)}else i=1/0,a=1/0;return t.x=i,t.y=a,t}function A_(e){let t={...e,cgb:[],cbg:[],utg:[],gtu:[],Qn:0,Zb:0};return D_(t),t}function j_(e){e.x0=e.x0===void 0?0:e.x0,e.y0=e.y0===void 0?0:e.y0,e.long0=e.long0===void 0?0:e.long0,e.lat0=e.lat0===void 0?0:e.lat0,e.es&&(e.en=dg(e.es),e.ml0=fg(e.lat0,Math.sin(e.lat0),Math.cos(e.lat0),e.en))}function M_(e,t){var n=t.x,r=t.y,i=J(n-e.long0,e.over),a,o,s,c=Math.sin(r),l=Math.cos(r);if(e.es){var u=l*i,d=u**2,f=e.ep2*l**2,p=f**2,m=(Math.abs(l)>1e-10?Math.tan(r):0)**2,h=m**2;a=1-e.es*c**2,u/=Math.sqrt(a);var g=fg(r,c,l,e.en);o=e.a*(e.k0*u*(1+d/6*(1-m+f+d/20*(5-18*m+h+14*f-58*m*f+d/42*(61+179*h-h*m-479*m)))))+e.x0,s=e.a*(e.k0*(g-e.ml0+c*i*u/2*(1+d/12*(5-m+9*f+4*p+d/30*(61+h-58*m+270*f-330*m*f+d/56*(1385+543*h-h*m-3111*m))))))+e.y0}else{var _=l*Math.sin(i);if(Math.abs(Math.abs(_)-1)<1e-10)return 93;if(o=.5*e.a*e.k0*Math.log((1+_)/(1-_))+e.x0,s=l*Math.cos(i)/Math.sqrt(1-_**2),_=Math.abs(s),_>=1){if(_-1>1e-10)return 93;s=0}else s=Math.acos(s);r<0&&(s=-s),s=e.a*e.k0*(s-e.lat0)+e.y0}return t.x=o,t.y=s,t}function N_(e,t){var n,r,i,a,o=(t.x-e.x0)*(1/e.a),s=(t.y-e.y0)*(1/e.a);if(!e.es){var c=Math.exp(o/e.k0),l=.5*(c-1/c),u=e.lat0+s/e.k0,d=Math.cos(u);n=Math.sqrt((1-d**2)/(1+l**2)),i=Math.asin(n),Math.sin(u)<0&&(i=-i),a=l===0&&d===0?0:J(Math.atan2(l,d)+e.long0,e.over)}else if(n=e.ml0+s/e.k0,r=mg(n,e.es,e.en),Math.abs(r)<K){var f=Math.sin(r),p=Math.cos(r),m=Math.abs(p)>1e-10?Math.tan(r):0,h=e.ep2*p**2,g=h**2,_=m**2,v=_**2;n=1-e.es*f**2;var y=o*Math.sqrt(n)/e.k0,b=y**2;n*=m,i=r-n*b/(1-e.es)*.5*(1-b/12*(5+3*_-9*h*_+h-4*g-b/30*(61+90*_-252*h*_+45*v+46*h-b/56*(1385+3633*_+4095*v+1574*v*_)))),a=J(e.long0+y*(1-b/6*(1+2*_+h-b/20*(5+28*_+24*v+8*h*_+6*h-b/42*(61+662*_+1320*v+720*v*_))))/p,e.over)}else i=K*zh(s),a=0;return t.x=a,t.y=i,t}function P_(e){let t={...e,en:[],ml0:0};return j_(t),t}function F_(e){let t=Oh(e),n=e=>Dm(e,V(t.long0-Math.PI/6,-Math.PI/2,t.long0+Math.PI/6,Math.PI/2),n=>Im(e.forward,n,t.long0,t.over),t.primeMeridian,t.over);if(Dh(e.parameters,`approx`))return n({...Ah(`tmerc +approx`,P_(t),M_,N_,bh)});if(t.sphere)throw Error(`Spherical transverse Mercator requires +approx`);return n({...Ah(`etmerc`,A_(t),O_,k_,bh)})}var I_={name:`tmerc`,aliases:[`Fast_Transverse_Mercator`,`Fast Transverse Mercator`,`Transverse_Mercator`,`Transverse Mercator`,`Gauss Kruger`,`Gauss_Kruger`],parameters:[...wh,...Th,`approx`],flags:[`approx`],create:F_},L_={name:`etmerc`,aliases:[`Extended_Transverse_Mercator`,`Extended Transverse Mercator`],parameters:[...wh,...Th,`approx`],flags:[`approx`],create:F_},R_={name:`utm`,aliases:[`Universal Transverse Mercator System`],parameters:[`zone`,`south`,`approx`],flags:[`south`,`approx`],create(e){let t=U(e.parameters,`zone`,NaN);if(!Number.isInteger(t)||t<1||t>60)throw Error(`UTM requires an integer +zone from 1 to 60`);let n=Dh(e.parameters,`south`),r=F_({...e,parameters:{...e.parameters,lat_0:`0`,lon_0:String(6*t-183),x_0:`500000`,y_0:n?`10000000`:`0`,k_0:`0.9996`}}),i=(6*t-183)*Math.PI/180;return Dm(r,V(i-Math.PI/60,n?-80*Math.PI/180:0,i+Math.PI/60,n?0:84*Math.PI/180),e=>Im(r.forward,e,i),e.primeMeridian??0,Object.prototype.hasOwnProperty.call(e.parameters,`over`))}},z_={name:`geocent`,aliases:[`Geocentric`,`geocentric`,`Geocent`],parameters:[],create({semiMajorAxis:e,semiMinorAxis:t,eccentricitySquared:n,primeMeridian:r=0}){let i={semiMajorAxis:e,eccentricitySquared:n,semiMinorAxis:t??e*Math.sqrt(1-n)};return{getRenderingProfile:()=>({bounds:[[-e,-e,-i.semiMinorAxis],[e,e,i.semiMinorAxis]],normalize:zm({},r)().normalize}),forward(){throw Error(`Geocentric projection requires the 3D pipeline`)},inverse(){throw Error(`Geocentric projection requires the 3D pipeline`)},forwardInPlace:e=>hm(e,i),inverseInPlace:e=>gm(e,i),forward3D:e=>Sm(e,i),inverse3D:e=>Cm(e,i)}}};function B_(e,t,n){let r=Mm(Pm(n,e.long0,e.over)),i=e.a/Math.sqrt(1-e.es),a=Om(t(e.long0,n[0][1])[1],t(e.long0,n[1][1])[1]),o=Math.max(Math.abs(e.a*(e.es?e.am1:e.cphi1)+e.y0-a[0]),Math.abs(e.a*(e.es?e.am1:e.cphi1)+e.y0-a[1])),s=Math.min(o,i*r),c=Math.min(2*o,i*r);return Nm([e.x0-s,e.x0+s],[a[0]-c,a[1]+c])}function V_(e,t,n){let r=Mm(Pm(n,e.long0,e.over)),i=e.a/Math.sqrt(1-e.es),a=i*r*r/4,o=Om(t(e.long0,n[0][1])[1],t(e.long0,n[1][1])[1]);return e.sphere&&(n[0][1]-e.lat0<-Math.PI/2||n[1][1]-e.lat0>Math.PI/2)&&(o=[e.y0-e.a*Math.PI/2,e.y0+e.a*Math.PI/2]),Nm([e.x0-i*r,e.x0+i*r],[o[0]-a,o[1]+a])}function H_(e,t,n){let r=Mm(Pm(n,e.long0,e.over));if(e.sphere&&r>Math.PI/2)throw Error(`Unsupported Cassini rendering coverage`);let i=e.a/Math.sqrt(1-e.es),a=e.es/(1-e.es),o=e.sphere?e.a*Math.asin(Math.min(1,Math.sin(Math.min(r,Math.PI/2)))):i*(r+r**3/6+(9+8*a)*r**5/120),s=e.sphere?e.a*r:i*(r*r/4+(6+6*a)*r**4/24),c=Om(t(e.long0,n[0][1])[1],t(e.long0,n[1][1])[1]);return Nm([e.x0-o,e.x0+o],[c[0]-s,c[1]+s])}function U_(e,t){return t[0]<=0&&t[1]>=0?[-1/0,1/0]:km(e,Om(1/t[0],1/t[1]))}function W_(e,t){let n=t=>{let n=e.alpha*(Math.asinh(Math.tan(t))-e.e*Math.atanh(e.e*Math.sin(t)))+e.K;return Math.asin(Math.tanh(n))},r=V((t[0][0]-e.long0)*e.alpha,n(t[0][1]),(t[1][0]-e.long0)*e.alpha,n(t[1][1])),i=Og([-Math.sin(e.b0),0,Math.cos(e.b0)],r);if(Mm(i)>=.99999999999999)throw Error(`Swiss oblique Mercator coverage reaches a rotated pole`);let a=U_(Og([0,1,0],r),Og([Math.cos(e.b0),0,Math.sin(e.b0)],r)).map(Math.atan),o=i.map(e=>Math.atanh(Math.max(-1+2**-52,Math.min(1-2**-52,e))));return Nm(W([e.x0,e.x0],G(a,e.R)),W([e.y0,e.y0],G(o,e.R)))}function G_(e,t){let n=t=>Math.log(e.E)-e.B*Math.log(Nh(e.e,t,Math.sin(t))),r=Om(n(t[0][1]),n(t[1][1])),i=G([t[0][0]-e.lam0,t[1][0]-e.lam0],e.B),a=V(i[0],Math.asin(Math.tanh(r[0])),i[1],Math.asin(Math.tanh(r[1]))),o=Og([0,-e.cosgam,e.singam],a),s=G(Om(-Math.atanh(o[0]),-Math.atanh(o[1])),e.ArB),c=W(G([Math.sinh(r[0]),Math.sinh(r[1])],e.cosgam),G(Am(i),e.singam)),l=jm(i),u=G(l[0]>0?U_(c,l).map(Math.atan):[-Math.PI,Math.PI],e.ArB),d,f;return e.no_rot?(d=u,f=s):(u=W(u,[-e.u_0,-e.u_0]),d=W(G(s,e.cosrot),G(u,e.sinrot)),f=W(G(u,e.cosrot),G(s,-e.sinrot))),Nm(W([e.x0,e.x0],G(d,e.a)),W([e.y0,e.y0],G(f,e.a)))}function K_(e,t){let n=t=>2*(Math.atan(e.k*Math.tan(t/2+e.s45)**+e.alfa/((1+e.e*Math.sin(t))/(1-e.e*Math.sin(t)))**(e.alfa*e.e/2))-e.s45),r=G(Pm(t,e.long0,e.over),-e.alfa),i=V(r[0],n(t[0][1]),r[1],n(t[1][1])),a=Og([Math.sin(e.ad),0,Math.cos(e.ad)],i),o=[Math.sqrt(Math.max(2**-52,1-Mm(a)**2)),1],s=G(U_(Og([0,1,0],i),o).map(e=>Math.asin(Math.max(-1,Math.min(1,e)))),e.n),c=t=>e.ro0*(Math.tan(e.s0/2+e.s45)/Math.tan(Math.asin(t)/2+e.s45))**+e.n,l=Om(c(a[0]),c(a[1])),u=e.czech?1:-1;return Nm(W([e.x0,e.x0],G(km(l,Am(s)),u)),W([e.y0,e.y0],G(km(l,jm(s)),u)))}function q_(e,t){let n=G([t[0][1]-e.lat0,t[1][1]-e.lat0],1e-5/Rh),r=Pm(t,e.long0,e.over),i=[0,0];for(let t=10;t>=1;t--)i=W([e.A[t],e.A[t]],km(i,n));i=km(i,n);let a=[0,0],o=[0,0];for(let t=6;t>=1;t--){let n=W(km(a,i),G(km(o,r),-1)),s=W(km(a,r),km(o,i));a=W(n,[e.B_re[t],e.B_re[t]]),o=W(s,[e.B_im[t],e.B_im[t]])}let s=W(km(a,i),G(km(o,r),-1)),c=W(km(a,r),km(o,i));return Nm(W([e.x0,e.x0],G(c,e.a)),W([e.y0,e.y0],G(s,e.a)))}function J_(e){let t=Oh(e);return{...t,x0:0,y0:0,lat_ts:Number.isNaN(t.lat_ts)?0:t.lat_ts}}function Y_(e,t){return{...e,x0:U(t.parameters,`x_0`,0),y0:U(t.parameters,`y_0`,0)}}function X_(e,t,n,r,i,a){let o=Ah(e,n,r,i),s=U(t.parameters,`x_0`,0),c=U(t.parameters,`y_0`,0);return Fp(e=>{a?.(e.x,e.y),o.forwardInPlace(e),e.x+=s,e.y+=c},e=>{e.x-=s,e.y-=c,o.inverseInPlace(e)})}function Z_(e,t=0,n=!1){return(r,i)=>{let a=Math.sin(e.lat0)*Math.sin(i)+Math.cos(e.lat0)*Math.cos(i)*Math.cos(r-e.long0);if(n?a<t-1e-14:a<=t+1e-14)throw Error(`Coordinate is outside the visible projection horizon`)}}var Q_=1e-10;function $_(e){var t;if(e.phi1=e.lat1,Math.abs(e.phi1)<Q_)throw Error();e.es?(e.en=dg(e.es),e.am1=Math.sin(e.phi1),t=Math.cos(e.phi1),e.m1=fg(e.phi1,e.am1,t,e.en),e.am1=t/(Math.sqrt(1-e.es*e.am1*e.am1)*e.am1)):Math.abs(e.phi1)+Q_>=K?e.cphi1=0:e.cphi1=1/Math.tan(e.phi1)}function ev(e,t){var n=J(t.x-(e.long0||0),e.over),r=t.y,i,a=Math.sin(r),o=Math.cos(r);return i=e.am1+e.m1-fg(r,a,o,e.en),a=o*n/(i*Math.sqrt(1-e.es*a*a)),t.x=i*Math.sin(a),t.y=e.am1-i*Math.cos(a),t.x=e.a*t.x+(e.x0||0),t.y=e.a*t.y+(e.y0||0),t}function tv(e,t){t.x=(t.x-(e.x0||0))/e.a,t.y=(t.y-(e.y0||0))/e.a;var n,r,i,a;if(t.y=e.am1-t.y,r=r_(t.x,t.y),e.phi1<0&&(r=-r),a=mg(e.am1+e.m1-r,e.es,e.en),n=Math.abs(a),n<K)n=Math.sin(a),i=r*Math.atan2(Math.sign(e.phi1)*t.x,Math.sign(e.phi1)*t.y)*Math.sqrt(1-e.es*n*n)/Math.cos(a);else if(Math.abs(n-K)<=Q_)i=0;else throw Error();return t.x=J(i+(e.long0||0),e.over),t.y=hg(a),t}function nv(e,t){var n=J(t.x-(e.long0||0),e.over),r=t.y,i,a=e.cphi1+e.phi1-r;return Math.abs(a)>Q_?(i=n*Math.cos(r)/a,t.x=a*Math.sin(i),t.y=e.cphi1-a*Math.cos(i)):t.x=t.y=0,t.x=e.a*t.x+(e.x0||0),t.y=e.a*t.y+(e.y0||0),t}function rv(e,t){t.x=(t.x-(e.x0||0))/e.a,t.y=(t.y-(e.y0||0))/e.a;var n,r;t.y=e.cphi1-t.y;var i=r_(t.x,t.y);if(e.phi1<0&&(i=-i),r=e.cphi1+e.phi1-i,Math.abs(r)>K)throw Error();return n=Math.abs(Math.abs(r)-K)<=Q_?0:i*Math.atan2(Math.sign(e.phi1)*t.x,Math.sign(e.phi1)*t.y)/Math.cos(r),t.x=J(n+(e.long0||0),e.over),t.y=hg(r),t}function iv(e,t){return e.es?ev(e,t):nv(e,t)}function av(e,t){return e.es?tv(e,t):rv(e,t)}function ov(e,t={}){let n={...e,phi1:0,en:[],m1:0,am1:0,cphi1:0,...t};return $_(n),n}var sv={name:`bonne`,aliases:[`Bonne (Werner lat_1=90)`],parameters:[`lon_0`,`x_0`,`y_0`,`lat_1`],create(e){let t=J_(e);if(!Object.prototype.hasOwnProperty.call(e.parameters,`lat_1`)||Math.abs(t.lat1)<1e-10)throw Error(`Bonne requires a nonzero lat_1`);let n=ov(t),r=X_(`bonne`,e,n,iv,av);return Dm(r,V(t.long0-Math.PI,-Math.PI/2,t.long0+Math.PI,Math.PI/2),t=>B_(Y_(n,e),r.forward,t),t.primeMeridian,t.over)}};function cv(e,t,n){var r=t*n;return e/Math.sqrt(1-r*r)}function lv(e){e.sphere||(e.en=dg(e.es),e.ml0=e.a*fg(e.lat0,Math.sin(e.lat0),Math.cos(e.lat0),e.en))}function uv(e,t){var n,r,i=t.x,a=t.y;if(i=J(i-e.long0,e.over),e.sphere)n=e.a*Math.asin(Math.cos(a)*Math.sin(i)),r=e.a*(Math.atan2(Math.tan(a),Math.cos(i))-e.lat0);else{var o=Math.sin(a),s=Math.cos(a),c=cv(e.a,e.e,o),l=Math.tan(a)*Math.tan(a),u=i*Math.cos(a),d=u*u,f=e.es*s*s/(1-e.es),p=e.a*fg(a,o,s,e.en);n=c*u*(1-d*l*(1/6+(8-l+8*f)*d/120)),r=p-e.ml0+c*o/s*d*(.5+(5-l+6*f)*d/24)}return t.x=n+e.x0,t.y=r+e.y0,t}function dv(e,t){t.x-=e.x0,t.y-=e.y0;var n=t.x/e.a,r=t.y/e.a,i,a;if(e.sphere){var o=r+e.lat0;i=Math.asin(Math.sin(o)*Math.cos(n)),a=Math.atan2(Math.tan(n),Math.cos(o))}else{var s=mg(e.ml0/e.a+r,e.es,e.en);if(Math.abs(Math.abs(s)-K)<=1e-10)return t.x=e.long0,t.y=Math.sign(s)*K,t;var c=cv(e.a,e.e,Math.sin(s)),l=c*c*c/e.a/e.a*(1-e.es),u=Math.tan(s)**2,d=n*e.a/c,f=d*d;i=s-c*Math.tan(s)/l*d*d*(.5-(1+3*u)*d*d/24),a=d*(1-f*(u/3-(1+3*u)*u*f/15))/Math.cos(s)}if(!e.sphere){let n=t.x+e.x0,r=t.y+e.y0,o=e.scratch,s=!1;for(let t=0;t<12;t++){fv(e,a,i);let t=o.x-n,c=o.y-r;if(Math.max(Math.abs(t),Math.abs(c))<1e-7){s=!0;break}let l=1e-7,u=i>K-l?-l:l,d=o.x,f=o.y;fv(e,a+l,i);let p=(o.x-d)/l,m=(o.y-f)/l;fv(e,a,i+u);let h=(o.x-d)/u,g=(o.y-f)/u,_=p*g-h*m;if(!Number.isFinite(_)||Math.abs(_)<1e-12||(a-=(g*t-h*c)/_,i-=(p*c-m*t)/_,!Number.isFinite(a)||Math.abs(i)>K))break}if(!s)throw Error(`Cassini inverse did not converge`)}return t.x=J(a+e.long0,e.over),t.y=hg(i),t}function fv(e,t,n){e.scratch.x=t+e.long0,e.scratch.y=n,uv(e,e.scratch)}function pv(e,t={}){let n={...e,en:[],scratch:{x:0,y:0},ml0:0,...t};return lv(n),n}var mv={name:`cass`,aliases:[`Cassini`,`Cassini_Soldner`],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`],create(e){let t=J_(e),n=X_(`cass`,e,pv(t),uv,dv);return Dm(n,V(t.long0-Math.PI/6,-Math.PI/2+1e-8,t.long0+Math.PI/6,Math.PI/2-1e-8),r=>H_(Y_(t,e),n.forward,r),t.primeMeridian,t.over)}};function hv(e){e.sphere||(e.k0=Mh(e.e,Math.sin(e.lat_ts),Math.cos(e.lat_ts)))}function gv(e,t){var n=t.x,r=t.y,i,a,o=J(n-e.long0,e.over);if(e.sphere)i=e.x0+e.a*o*Math.cos(e.lat_ts),a=e.y0+e.a*Math.sin(r)/Math.cos(e.lat_ts);else{var s=Kh(e.e,Math.sin(r));i=e.x0+e.a*e.k0*o,a=e.y0+e.a*s*.5/e.k0}return t.x=i,t.y=a,t}function _v(e,t){t.x-=e.x0,t.y-=e.y0;var n,r;return e.sphere?(n=J(e.long0+t.x/e.a/Math.cos(e.lat_ts),e.over),r=Math.asin(t.y/e.a*Math.cos(e.lat_ts))):(r=qh(e.e,2*t.y*e.k0/e.a),n=J(e.long0+t.x/(e.a*e.k0),e.over)),t.x=n,t.y=r,t}function vv(e,t={}){let n={...e,...t};return hv(n),n}var yv={name:`cea`,aliases:[],parameters:[`lon_0`,`x_0`,`y_0`,`lat_ts`],create(e){let t=J_(e);if(Math.abs(t.lat_ts)>=Math.PI/2)throw Error(`CEA standard parallel must be away from the poles`);let n=X_(`cea`,e,vv(t),gv,_v);return Dm(n,V(t.long0-Math.PI,-Math.PI/2,t.long0+Math.PI,Math.PI/2),e=>Fm(n.forward,e,t.long0,t.over),t.primeMeridian,t.over)}};function bv(e){return Math.abs(e)>1&&(e=e>1?1:-1),Math.asin(e)}var xv=20;function Sv(e){e.long0=e.long0||0,e.sphere?(e.n=1,e.m=0,e.es=0,e.C_y=Math.sqrt((e.m+1)/e.n),e.C_x=e.C_y/(e.m+1)):e.en=dg(e.es)}function Cv(e,t){var n,r,i=t.x,a=t.y;if(i=J(i-e.long0,e.over),e.sphere){if(!e.m)a=e.n===1?a:Math.asin(e.n*Math.sin(a));else for(var o=e.n*Math.sin(a),s=xv;s;--s){var c=(e.m*a+Math.sin(a)-o)/(e.m+Math.cos(a));if(a-=c,Math.abs(c)<1e-10)break}n=e.a*e.C_x*i*(e.m+Math.cos(a)),r=e.a*e.C_y*a}else{var l=Math.sin(a),u=Math.cos(a);r=e.a*fg(a,l,u,e.en),n=e.a*i*u/Math.sqrt(1-e.es*l*l)}return t.x=n,t.y=r,t}function wv(e,t){var n,r,i,a;if(t.x-=e.x0,i=t.x/e.a,t.y-=e.y0,n=t.y/e.a,e.sphere){if(n/=e.C_y,i/=e.C_x*(e.m+Math.cos(n)),e.m){let t=(e.m*n+Math.sin(n))/e.n;if(Math.abs(t)>1+8*2**-52)return null;n=bv(t)}else e.n!==1&&(n=bv(Math.sin(n)/e.n));i=J(i+e.long0,e.over),n=hg(n)}else n=mg(t.y/e.a,e.es,e.en),a=Math.abs(n),a<K?(a=Math.sin(n),r=e.long0+t.x*Math.sqrt(1-e.es*a*a)/(e.a*Math.cos(n)),i=J(r,e.over)):a-1e-10<K&&(i=e.long0);return t.x=i,t.y=n,t}function Tv(e,t={}){let n={...e,en:[],n:0,m:0,C_y:0,C_x:0,...t};return Sv(n),n}function Ev(e){e.sphere=!0,e.b=e.a,e.m=1,e.n=2.5707963267948966,e.es=0,e.C_y=Math.sqrt((e.m+1)/e.n),e.C_x=e.C_y/(e.m+1)}var Dv=Cv,Ov=wv;function kv(e,t={}){let n={...e,m:0,n:0,C_y:0,C_x:0,en:[],...t};return Ev(n),n}var Av={name:`eck6`,aliases:[`Eckert_VI`],parameters:[`lon_0`,`x_0`,`y_0`],create(e){let t=J_(e),n=X_(`eck6`,e,kv(t),Dv,Ov);return Dm(n,V(t.long0-Math.PI,-Math.PI/2,t.long0+Math.PI,Math.PI/2),e=>Fm(n.forward,e,t.long0,t.over),t.primeMeridian,t.over)}},jv=.3333333333333333,Mv=.17222222222222222,Nv=.10257936507936508,Pv=.06388888888888888,Fv=.0664021164021164,Iv=.016415012942191543;function Lv(e){var t,n=[];return n[0]=e*jv,t=e*e,n[0]+=t*Mv,n[1]=t*Pv,t*=e,n[0]+=t*Nv,n[1]+=t*Fv,n[2]=t*Iv,n}function Rv(e,t){var n=e+e;return e+t[0]*Math.sin(n)+t[1]*Math.sin(n+n)+t[2]*Math.sin(n+n+n)}var zv=1.340264,Bv=-.081106,Vv=893e-6,Hv=.003796,Uv=Math.sqrt(3)/2;function Wv(e){e.long0=e.long0===void 0?0:e.long0,e.x0=e.x0===void 0?0:e.x0,e.y0=e.y0===void 0?0:e.y0,e.es!==0&&(e.apa=Lv(e.es),e.qp=Kh(e.e,1),e.rqda=Math.sqrt(.5*e.qp))}function Gv(e,t){var n=J(t.x-e.long0,e.over),r=t.y,i=Math.sin(r);e.es!==0&&(i=Kh(e.e,i)/e.qp);var a=Math.asin(Uv*i),o=a*a,s=o*o*o;return t.x=n*Math.cos(a)/(Uv*(zv+3*Bv*o+s*(7*Vv+9*Hv*o))),t.y=a*(zv+Bv*o+s*(Vv+Hv*o)),e.es!==0&&(t.x*=e.rqda,t.y*=e.rqda),t.x=e.a*t.x+e.x0,t.y=e.a*t.y+e.y0,t}function Kv(e,t){t.x=(t.x-e.x0)/e.a,t.y=(t.y-e.y0)/e.a,e.es!==0&&(t.x/=e.rqda,t.y/=e.rqda);let n=Math.PI/3,r=n*n,i=n*(zv+Bv*r+r**3*(Vv+Hv*r));if(Math.abs(t.y)>i+8*2**-52*i)return null;var a=1e-9,o=12,s=t.y,c,l,u,d,f,p;for(p=0;p<o&&(c=s*s,l=c*c*c,u=s*(zv+Bv*c+l*(Vv+Hv*c))-t.y,d=zv+3*Bv*c+l*(7*Vv+9*Hv*c),s-=f=u/d,!(Math.abs(f)<a));++p);c=s*s,l=c*c*c,t.x=Uv*t.x*(zv+3*Bv*c+l*(7*Vv+9*Hv*c))/Math.cos(s);let m=Math.sin(s)/Uv,h=8*2**-52;return Math.abs(m)>1+h?null:(t.y=Math.abs(m)>=1-h?Math.sign(m)*Math.PI/2:Math.asin(m),e.es!==0&&(t.y=Rv(t.y,e.apa)),t.x=J(t.x+e.long0,e.over),t)}function qv(e,t={}){let n={...e,apa:[],qp:0,rqda:0,...t};return Wv(n),n}var Jv={name:`eqearth`,aliases:[`Equal Earth`,`Equal_Earth`],parameters:[`lon_0`,`x_0`,`y_0`],create(e){let t=J_(e),n=e.primeMeridian??0,r=X_(`eqearth`,e,qv(t),Gv,Kv),i=Math.sqrt(e.eccentricitySquared),a=e.semiMajorAxis*(i?Math.sqrt((1+(1-i*i)*Math.atanh(i)/i)/2):1),o=Math.PI/3,s=o*o,c=s**3,l=a*Math.PI/(Math.sqrt(3)/2*1.340264),u=U(e.parameters,`x_0`,0),d=U(e.parameters,`y_0`,0),f=a*o*(1.340264-.081106*s+c*(893e-6+.003796*s));return{...r,longitudeOrigin:t.long0,getRenderingProfile(e){if(e)return Tm(e=>Fm(r.forward,e,t.long0,t.over),e,t.long0,n,t.over);let i=[[u-l,d-f,0],[u+l,d+f,0]];return{bounds:i,normalize:Tm(()=>i,Sp(V(t.long0-Math.PI,-(Math.PI/2),t.long0+Math.PI,Math.PI/2),n),t.long0,n,t.over).normalize}}}}};function Yv(e){e.x0=e.x0||0,e.y0=e.y0||0,e.lat0=e.lat0||0,e.long0=e.long0||0}function Xv(e,t){var n=t.x,r=t.y,i=J(n-e.long0,e.over),a=e.x0+e.a*i*Math.cos(e.lat0),o=e.y0+e.a*r;return e.t1=a,e.t2=Math.cos(e.lat0),t.x=a,t.y=o,t}function Zv(e,t){t.x-=e.x0,t.y-=e.y0;var n=t.y/e.a;return Math.abs(n)>Math.PI/2&&Math.abs(n)<=Math.PI/2+8*2**-52&&(n=Math.sign(n)*Math.PI/2),t.x=J(e.long0+t.x/(e.a*Math.cos(e.lat0)),e.over),t.y=n,t}function Qv(e,t={}){let n={...e,t2:0,t1:0,...t};return Yv(n),n}var $v={name:`equi`,aliases:[],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`],create(e){let t=J_(e);if(Math.abs(t.lat0)>=Math.PI/2)throw Error(`Equirectangular standard parallel must be away from the poles`);let n=X_(`equi`,e,Qv(t),Xv,Zv);return Dm(n,V(t.long0-Math.PI,-Math.PI/2,t.long0+Math.PI,Math.PI/2),e=>Fm(n.forward,e,t.long0,t.over),t.primeMeridian,t.over)}};function ey(e,t,n=!1){let r=1+t/e.a,i=r/1.0000000001,a=t=>Math.acos(Math.min(1,Math.sqrt(1-e.es*Math.sin(t)**2)/(i*Math.cos(t)))),o=t=>{let n=(i*Math.cos(t))**2;return Math.asin(Math.sqrt(Math.max(0,(n-1)/(n-e.es))))},s=t*Math.asin(1/r),c=t*Math.atan(Math.sqrt((1-e.es)/(r*r-1))),l=(i,l)=>{let u=a(Math.max(i[0][1],Math.min(i[1][1],0))),d=Math.max(i[0][0]-e.long0,-u),f=Math.min(i[1][0]-e.long0,u),p=o(Math.max(d,Math.min(f,0))),m=Math.max(i[0][1],-p),h=Math.min(i[1][1],p);if(f<d||h<m)return null;let g=V(d,m,f,h),_=Sp(V(d+e.long0,m,f+e.long0,h),e.primeMeridian),v=(e.long0+e.primeMeridian)*180/Math.PI,y=Ep(t=>{let n=Math.max(d,Math.min(f,qp(t.x-e.long0))),r=o(n),i=Math.max(Math.max(m,-r),Math.min(Math.min(h,r),t.y));n!==t.x-e.long0&&(t.x=n+e.long0),t.y=i},e.primeMeridian);return{get bounds(){if(!l)return Nm([e.x0-s,e.x0+s],[e.y0-c,e.y0+c]);let i=Og([0,0,1],g),a=[1,1/Math.sqrt(1-e.es*Math.max(i[0]**2,i[1]**2))],o=km(Og([1,0,0],g),a),u=km(Og([0,1,0],g),a),d=km(i,[1-e.es,(1-e.es)*a[1]]),f=[r-Math.min(1,o[1]),r-Math.max(1/r,o[0])],p=(e,n,r,i)=>{let a=n[0]<=0&&n[1]>=0?0:Math.min(Math.abs(n[0]),Math.abs(n[1])),o=i?[Math.hypot(f[0],a),Math.hypot(f[1],Math.max(Math.abs(n[0]),Math.abs(n[1])))]:f,s=e.flatMap(e=>o.map(n=>t*Math.atan(e/n)));return[Math.max(-r,Math.min(...s)),Math.min(r,Math.max(...s))]};return Nm(W([e.x0,e.x0],p(u,d,s,n)),W([e.y0,e.y0],p(d,u,c,!n)))},normalize(e){wm(e,_,v),y(e)}}},u=Sp(V(e.long0-a(0),-o(0),e.long0+a(0),o(0)),e.primeMeridian);return t=>{let n=Dp(t?yp(t,u):[u],n=>l(xp(n,e.primeMeridian,e.long0),!!t));if(!n)throw Error(`CRS coverage does not intersect the satellite limb`);return n}}function ty(e){if(e.flip_axis=e.sweep===`x`?1:0,e.h=Number(e.h),e.radius_g_1=e.h/e.a,e.radius_g_1<=0||e.radius_g_1>1e10)throw Error();if(e.radius_g=1+e.radius_g_1,e.C=e.radius_g*e.radius_g-1,e.es!==0){var t=1-e.es,n=1/t;e.radius_p=Math.sqrt(t),e.radius_p2=t,e.radius_p_inv2=n,e.shape=`ellipse`}else e.radius_p=1,e.radius_p2=1,e.radius_p_inv2=1,e.shape=`sphere`}function ny(e,t){var n=t.x,r=t.y,i,a,o,s;if(n-=e.long0,e.shape===`ellipse`){r=Math.atan(e.radius_p2*Math.tan(r));var c=e.radius_p/r_(e.radius_p*Math.cos(r),Math.sin(r));if(a=c*Math.cos(n)*Math.cos(r),o=c*Math.sin(n)*Math.cos(r),s=c*Math.sin(r),(e.radius_g-a)*a-o*o-s*s*e.radius_p_inv2<0)return t.x=NaN,t.y=NaN,t;i=e.radius_g-a,e.flip_axis?(t.x=e.radius_g_1*Math.atan(o/r_(s,i)),t.y=e.radius_g_1*Math.atan(s/i)):(t.x=e.radius_g_1*Math.atan(o/i),t.y=e.radius_g_1*Math.atan(s/r_(o,i)))}else e.shape===`sphere`&&(i=Math.cos(r),a=Math.cos(n)*i,o=Math.sin(n)*i,s=Math.sin(r),i=e.radius_g-a,e.flip_axis?(t.x=e.radius_g_1*Math.atan(o/r_(s,i)),t.y=e.radius_g_1*Math.atan(s/i)):(t.x=e.radius_g_1*Math.atan(o/i),t.y=e.radius_g_1*Math.atan(s/r_(o,i))));return t.x*=e.a,t.y*=e.a,t}function ry(e,t){var n=-1,r=0,i=0,a,o,s,c;if(t.x/=e.a,t.y/=e.a,e.shape===`ellipse`){e.flip_axis?(i=Math.tan(t.y/e.radius_g_1),r=Math.tan(t.x/e.radius_g_1)*r_(1,i)):(r=Math.tan(t.x/e.radius_g_1),i=Math.tan(t.y/e.radius_g_1)*r_(1,r));var l=i/e.radius_p;if(a=r*r+l*l+n*n,o=2*e.radius_g*n,s=o*o-4*a*e.C,s<0)return t.x=NaN,t.y=NaN,t;c=(-o-Math.sqrt(s))/(2*a),n=e.radius_g+c*n,r*=c,i*=c,t.x=Math.atan2(r,n),t.y=Math.atan(i*Math.cos(t.x)/n),t.y=Math.atan(e.radius_p_inv2*Math.tan(t.y))}else if(e.shape===`sphere`){if(e.flip_axis?(i=Math.tan(t.y/e.radius_g_1),r=Math.tan(t.x/e.radius_g_1)*Math.sqrt(1+i*i)):(r=Math.tan(t.x/e.radius_g_1),i=Math.tan(t.y/e.radius_g_1)*Math.sqrt(1+r*r)),a=r*r+i*i+n*n,o=2*e.radius_g*n,s=o*o-4*a*e.C,s<0)return t.x=NaN,t.y=NaN,t;c=(-o-Math.sqrt(s))/(2*a),n=e.radius_g+c*n,r*=c,i*=c,t.x=Math.atan2(r,n),t.y=Math.atan(i*Math.cos(t.x)/n)}return t.x+=e.long0,t}function iy(e,t={}){let n={...e,flip_axis:0,sweep:``,h:0,radius_g_1:0,radius_g:0,C:0,radius_p:0,radius_p2:0,radius_p_inv2:0,shape:``,...t};return ty(n),n}var ay={name:`geos`,aliases:[`Geostationary Satellite View`,`Geostationary_Satellite`],parameters:[`lon_0`,`x_0`,`y_0`,`h`,`sweep`],create(e){let t=J_(e),n=U(e.parameters,`h`,NaN);if(!Number.isFinite(n)||n<=0)throw Error(`Geostationary projection requires positive h`);let r=e.parameters.sweep||`y`;if(![`x`,`y`].includes(r))throw Error(`Geostationary sweep must be x or y`);return{...X_(`geos`,e,iy(t,{h:n,sweep:r}),ny,ry,t.sphere?Z_({...t,lat0:0},1/(1+n/t.a),!0):void 0),longitudeOrigin:t.long0,getRenderingProfile:ey(Y_(t,e),n,r===`x`)}}},oy={};oy.Constants={},oy.Math={},oy.Accumulator={},(function(e){e.WGS84={a:6378137,f:1/298.257223563},e.version={major:2,minor:2,patch:0},e.version_string=`2.2.0`})(oy.Constants),(function(e){e.digits=53,e.epsilon=.5**(e.digits-1),e.degree=Math.PI/180,e.sq=function(e){return e*e},e.hypot=function(e,t){return Math.sqrt(e*e+t*t)},e.cbrt=Math.cbrt||function(e){var t=Math.abs(e)**(1/3);return e>0?t:e<0?-t:e},e.log1p=Math.log1p||function(e){var t=1+e,n=t-1;return n===0?e:e*Math.log(t)/n},e.atanh=Math.atanh||function(t){var n=Math.abs(t);return n=e.log1p(2*n/(1-n))/2,t>0?n:t<0?-n:t},e.copysign=function(e,t){return Math.abs(e)*(t<0||t===0&&1/t<0?-1:1)},e.sum=function(e,t){var n=e+t,r=n-t,i=n-r,a;return r-=e,i-=t,a=n&&0-(r+i),{s:n,t:a}},e.polyval=function(e,t,n,r){for(var i=e<0?0:t[n++];--e>=0;)i=i*r+t[n++];return i},e.AngRound=function(t){var n=1/16,r=Math.abs(t);return r=r<n?n-(n-r):r,e.copysign(r,t)},e.remainder=function(e,t){return e%=t,e<-t/2?e+t:e<t/2?e:e-t},e.AngNormalize=function(t){var n=e.remainder(t,360);return Math.abs(n)===180?e.copysign(180,t):n},e.LatFix=function(e){return Math.abs(e)>90?NaN:e},e.AngDiff=function(t,n){var r=e.sum(e.remainder(-t,360),e.remainder(n,360)),i,a;return r=e.sum(e.remainder(r.s,360),r.t),i=r.s,a=r.t,(i===0||Math.abs(i)===180)&&(i=e.copysign(i,a===0?n-t:-a)),{d:i,e:a}},e.sincosd=function(t){var n=t%360,r,i=Math.round(n/90),a,o,s,c;switch(n-=90*i,r=n*this.degree,a=Math.sin(r),o=Math.cos(r),Math.abs(n)===45?(o=Math.sqrt(.5),a=e.copysign(o,r)):Math.abs(n)===30&&(o=Math.sqrt(.75),a=e.copysign(.5,r)),i&3){case 0:s=a,c=o;break;case 1:s=o,c=-a;break;case 2:s=-a,c=-o;break;default:s=-o,c=a;break}return c+=0,s===0&&(s=e.copysign(s,t)),{s,c}},e.sincosde=function(t,n){var r=t%360,i,a=Math.round(r/90),o,s,c,l;switch(r=e.AngRound(r-90*a+n),i=r*this.degree,o=Math.sin(i),s=Math.cos(i),Math.abs(r)===45?(s=Math.sqrt(.5),o=e.copysign(s,i)):Math.abs(r)===30&&(s=Math.sqrt(.75),o=e.copysign(.5,i)),a&3){case 0:c=o,l=s;break;case 1:c=s,l=-o;break;case 2:c=-o,l=-s;break;default:c=-s,l=o;break}return l+=0,c===0&&(c=e.copysign(c,t+n)),{s:c,c:l}},e.atan2d=function(t,n){var r=0,i;switch(Math.abs(t)>Math.abs(n)&&([t,n]=[n,t],r=2),e.copysign(1,n)<0&&(n=-n,++r),i=Math.atan2(t,n)/this.degree,r){case 1:i=e.copysign(180,t)-i;break;case 2:i=90-i;break;case 3:i=-90+i;break;default:break}return i}})(oy.Math),(function(e,t){e.Accumulator=function(e){this.Set(e)},e.Accumulator.prototype.Set=function(t){t||=0,t.constructor===e.Accumulator?(this._s=t._s,this._t=t._t):(this._s=t,this._t=0)},e.Accumulator.prototype.Add=function(e){var n=t.sum(e,this._t),r=t.sum(n.s,this._s);n=n.t,this._s=r.s,this._t=r.t,this._s===0?this._s=n:this._t+=n},e.Accumulator.prototype.Sum=function(t){var n;return t?(n=new e.Accumulator(this),n.Add(t),n._s):this._s},e.Accumulator.prototype.Negate=function(){this._s*=-1,this._t*=-1},e.Accumulator.prototype.Remainder=function(e){this._s=t.remainder(this._s,e),this.Add(0)}})(oy.Accumulator,oy.Math),oy.Geodesic={},oy.GeodesicLine={},oy.PolygonArea={},(function(e,t,n,r,i){var a=6,o=a,s=a,c=a,l=c,u,d,f=20,p=f+r.digits+10,m=r.epsilon,h=200*m,g=Math.sqrt(m),_=m,v=1e3*g,y=0,b=31,x=32640,S,C,w,T,E,D,O,k,A;e.tiny_=Math.sqrt(Number.MIN_VALUE/2**-52),e.nC1_=a,e.nC1p_=a,e.nC2_=a,e.nC3_=a,e.nC4_=a,u=e.nC3_*(e.nC3_-1)/2,d=e.nC4_*(e.nC4_+1)/2,e.CAP_C1=1,e.CAP_C1p=2,e.CAP_C2=4,e.CAP_C3=8,e.CAP_C4=16,e.NONE=0,e.ARC=64,e.LATITUDE=128|y,e.LONGITUDE=256|e.CAP_C3,e.AZIMUTH=512|y,e.DISTANCE=1024|e.CAP_C1,e.STANDARD=e.LATITUDE|e.LONGITUDE|e.AZIMUTH|e.DISTANCE,e.DISTANCE_IN=2048|e.CAP_C1|e.CAP_C1p,e.REDUCEDLENGTH=4096|e.CAP_C1|e.CAP_C2,e.GEODESICSCALE=8192|e.CAP_C1|e.CAP_C2,e.AREA=16384|e.CAP_C4,e.ALL=x|b,e.LONG_UNROLL=32768,e.OUT_MASK=x|e.LONG_UNROLL,e.SinCosSeries=function(t,n,r,i,a){if(a!==void 0){var o=a/2,s=Math.sin(o),c=Math.cos(o);return-2*e.SinCosSeries(!1,r*c-n*s,n*c+r*s,i.map(function(e,t){return(t%2?-e:e)*Math.sin((2*t+1)*o)}))}var l=i.length,u=l-(t?1:0),d=2*(r-n)*(r+n),f=u&1?i[--l]:0,p=0;for(u=Math.floor(u/2);u--;)p=d*f-p+i[--l],f=d*p-f+i[--l];return t?2*n*r*f:r*(f-p)},S=function(e,t){var n,i=r.sq(e),a=r.sq(t),o=(i+a-1)/6,s,c,l,u,d,f,p,m,h,g,_;return a===0&&o<=0?n=0:(s=i*a/4,c=r.sq(o),l=o*c,u=s*(s+2*l),d=o,u>=0?(f=s+l,f+=f<0?-Math.sqrt(u):Math.sqrt(u),p=r.cbrt(f),d+=p+(p===0?0:c/p)):(m=Math.atan2(Math.sqrt(-u),-(s+l)),d+=2*o*Math.cos(m/3)),h=Math.sqrt(r.sq(d)+a),g=d<0?a/(h-d):d+h,_=(g-a)/(2*h),n=g/(Math.sqrt(g+r.sq(_))+_)),n},C=[1,4,64,0,256],e.A1m1f=function(e){var t=Math.floor(o/2);return(r.polyval(t,C,0,r.sq(e))/C[t+1]+e)/(1-e)},w=[-1,6,-16,32,-9,64,-128,2048,9,-16,768,3,-5,512,-7,1280,-7,2048],e.C1f=function(t,n){var i=r.sq(t),a=t,o=0,s,c;for(s=1;s<=e.nC1_;++s)c=Math.floor((e.nC1_-s)/2),n[s]=a*r.polyval(c,w,o,i)/w[o+c+1],o+=c+2,a*=t},T=[205,-432,768,1536,4005,-4736,3840,12288,-225,116,384,-7173,2695,7680,3467,7680,38081,61440],e.C1pf=function(t,n){var i=r.sq(t),a=t,o=0,s,c;for(s=1;s<=e.nC1p_;++s)c=Math.floor((e.nC1p_-s)/2),n[s]=a*r.polyval(c,T,o,i)/T[o+c+1],o+=c+2,a*=t},E=[-11,-28,-192,0,256],e.A2m1f=function(e){var t=Math.floor(s/2);return(r.polyval(t,E,0,r.sq(e))/E[t+1]-e)/(1+e)},D=[1,2,16,32,35,64,384,2048,15,80,768,7,35,512,63,1280,77,2048],e.C2f=function(t,n){var i=r.sq(t),a=t,o=0,s,c;for(s=1;s<=e.nC2_;++s)c=Math.floor((e.nC2_-s)/2),n[s]=a*r.polyval(c,D,o,i)/D[o+c+1],o+=c+2,a*=t},e.Geodesic=function(e,t){if(this.a=e,this.f=t,this._f1=1-this.f,this._e2=this.f*(2-this.f),this._ep2=this._e2/r.sq(this._f1),this._n=this.f/(2-this.f),this._b=this.a*this._f1,this._c2=(r.sq(this.a)+r.sq(this._b)*(this._e2===0?1:(this._e2>0?r.atanh(Math.sqrt(this._e2)):Math.atan(Math.sqrt(-this._e2)))/Math.sqrt(Math.abs(this._e2))))/2,this._etol2=.1*g/Math.sqrt(Math.max(.001,Math.abs(this.f))*Math.min(1,1-this.f/2)/2),!(isFinite(this.a)&&this.a>0))throw Error(`Equatorial radius is not positive`);if(!(isFinite(this._b)&&this._b>0))throw Error(`Polar semi-axis is not positive`);this._A3x=Array(l),this._C3x=Array(u),this._C4x=Array(d),this.A3coeff(),this.C3coeff(),this.C4coeff()},O=[-3,128,-2,-3,64,-1,-3,-1,16,3,-1,-2,8,1,-1,2,1,1],e.Geodesic.prototype.A3coeff=function(){var e=0,t=0,n,i;for(n=c-1;n>=0;--n)i=Math.min(c-n-1,n),this._A3x[t++]=r.polyval(i,O,e,this._n)/O[e+i+1],e+=i+2},k=[3,128,2,5,128,-1,3,3,64,-1,0,1,8,-1,1,4,5,256,1,3,128,-3,-2,3,64,1,-3,2,32,7,512,-10,9,384,5,-9,5,192,7,512,-14,7,512,21,2560],e.Geodesic.prototype.C3coeff=function(){var t=0,n=0,i,a,o;for(i=1;i<e.nC3_;++i)for(a=e.nC3_-1;a>=i;--a)o=Math.min(e.nC3_-a-1,a),this._C3x[n++]=r.polyval(o,k,t,this._n)/k[t+o+1],t+=o+2},A=[97,15015,1088,156,45045,-224,-4784,1573,45045,-10656,14144,-4576,-858,45045,64,624,-4576,6864,-3003,15015,100,208,572,3432,-12012,30030,45045,1,9009,-2944,468,135135,5792,1040,-1287,135135,5952,-11648,9152,-2574,135135,-64,-624,4576,-6864,3003,135135,8,10725,1856,-936,225225,-8448,4992,-1144,225225,-1440,4160,-4576,1716,225225,-136,63063,1024,-208,105105,3584,-3328,1144,315315,-128,135135,-2560,832,405405,128,99099],e.Geodesic.prototype.C4coeff=function(){var t=0,n=0,i,a,o;for(i=0;i<e.nC4_;++i)for(a=e.nC4_-1;a>=i;--a)o=e.nC4_-a-1,this._C4x[n++]=r.polyval(o,A,t,this._n)/A[t+o+1],t+=o+2},e.Geodesic.prototype.A3f=function(e){return r.polyval(l-1,this._A3x,0,e)},e.Geodesic.prototype.C3f=function(t,n){var i=1,a=0,o,s;for(o=1;o<e.nC3_;++o)s=e.nC3_-o-1,i*=t,n[o]=i*r.polyval(s,this._C3x,a,t),a+=s+1},e.Geodesic.prototype.C4f=function(t,n){var i=1,a=0,o,s;for(o=0;o<e.nC4_;++o)s=e.nC4_-o-1,n[o]=i*r.polyval(s,this._C4x,a,t),a+=s+1,i*=t},e.Geodesic.prototype.Lengths=function(t,n,r,i,a,o,s,c,l,u,d,f,p){d&=e.OUT_MASK;var m={},h=0,g=0,_=0,v=0,y,b,x,S,C;if(d&(e.DISTANCE|e.REDUCEDLENGTH|e.GEODESICSCALE)&&(_=e.A1m1f(t),e.C1f(t,f),d&(e.REDUCEDLENGTH|e.GEODESICSCALE)&&(v=e.A2m1f(t),e.C2f(t,p),h=_-v,v=1+v),_=1+_),d&e.DISTANCE)y=e.SinCosSeries(!0,o,s,f)-e.SinCosSeries(!0,r,i,f),m.s12b=_*(n+y),d&(e.REDUCEDLENGTH|e.GEODESICSCALE)&&(b=e.SinCosSeries(!0,o,s,p)-e.SinCosSeries(!0,r,i,p),g=h*n+(_*y-v*b));else if(d&(e.REDUCEDLENGTH|e.GEODESICSCALE)){for(x=1;x<=e.nC2_;++x)p[x]=_*f[x]-v*p[x];g=h*n+(e.SinCosSeries(!0,o,s,p)-e.SinCosSeries(!0,r,i,p))}return d&e.REDUCEDLENGTH?(m.m0=h,m.m12b=i*o*c-r*s*a-i*s*g):m.m12b=NaN,d&e.GEODESICSCALE&&(S=i*s+r*o,C=this._ep2*(l-u)*(l+u)/(a+c),m.M12=S+(C*o-s*g)*r/a,m.M21=S-(C*r-i*g)*o/c),m},e.Geodesic.prototype.InverseStart=function(t,n,i,a,o,s,c,l,u,d,f){var p={},m=a*n-o*t,g=o*n+a*t,_,y,b,x,C,w,T,E,D,O,k,A,j,M,ee,te,ne,re,ie,ae,N,oe,se;return p.sig12=-1,_=a*n,_+=o*t,y=g>=0&&m<.5&&o*c<.5,y?(x=r.sq(t+a),x/=x+r.sq(n+o),p.dnm=Math.sqrt(1+this._ep2*x),b=c/(this._f1*p.dnm),C=Math.sin(b),w=Math.cos(b)):(C=l,w=u),p.salp1=o*C,p.calp1=w>=0?m+o*t*r.sq(C)/(1+w):_-o*t*r.sq(C)/(1-w),E=r.hypot(p.salp1,p.calp1),D=t*a+n*o*w,y&&E<this._etol2?(p.salp2=n*C,p.calp2=m-n*a*(w>=0?r.sq(C)/(1+w):1-w),T=r.hypot(p.salp2,p.calp2),p.salp2/=T,p.calp2/=T,p.sig12=Math.atan2(E,D)):Math.abs(this._n)>.1||D>=0||E>=6*Math.abs(this._n)*Math.PI*r.sq(n)||(se=Math.atan2(-l,-u),this.f>=0?(M=r.sq(t)*this._ep2,ee=M/(2*(1+Math.sqrt(1+M))+M),A=this.f*n*this.A3f(ee)*Math.PI,j=A*n,O=se/A,k=_/j):(te=o*n-a*t,ne=Math.atan2(_,te),ae=this.Lengths(this._n,Math.PI+ne,t,-n,i,a,o,s,n,o,e.REDUCEDLENGTH,d,f),re=ae.m12b,ie=ae.m0,O=-1+re/(n*o*ie*Math.PI),j=O<-.01?_/O:-this.f*r.sq(n)*Math.PI,A=j/n,k=c/A),k>-h&&O>-1-v?this.f>=0?(p.salp1=Math.min(1,-O),p.calp1=-Math.sqrt(1-r.sq(p.salp1))):(p.calp1=Math.max(O>-h?0:-1,O),p.salp1=Math.sqrt(1-r.sq(p.calp1))):(N=S(O,k),oe=A*(this.f>=0?-O*N/(1+N):-k*(1+N)/N),C=Math.sin(oe),w=-Math.cos(oe),p.salp1=o*C,p.calp1=_-o*t*r.sq(C)/(1-w))),p.salp1<=0?(p.salp1=1,p.calp1=0):(T=r.hypot(p.salp1,p.calp1),p.salp1/=T,p.calp1/=T),p},e.Geodesic.prototype.Lambda12=function(t,n,i,a,o,s,c,l,u,d,f,p,m,h){var g={},_,v,y,b,x,S,C,w,T,E,D,O,k;return t===0&&l===0&&(l=-e.tiny_),v=c*n,y=r.hypot(l,c*t),g.ssig1=t,b=v*t,g.csig1=x=l*n,_=r.hypot(g.ssig1,g.csig1),g.ssig1/=_,g.csig1/=_,g.salp2=o===n?c:v/o,g.calp2=o!==n||Math.abs(a)!==-t?Math.sqrt(r.sq(l*n)+(n<-t?(o-n)*(n+o):(t-a)*(t+a)))/o:Math.abs(l),g.ssig2=a,S=v*a,g.csig2=C=g.calp2*o,_=r.hypot(g.ssig2,g.csig2),g.ssig2/=_,g.csig2/=_,g.sig12=Math.atan2(Math.max(0,g.csig1*g.ssig2-g.ssig1*g.csig2),g.csig1*g.csig2+g.ssig1*g.ssig2),w=Math.max(0,x*S-b*C),T=x*C+b*S,D=Math.atan2(w*d-T*u,T*d+w*u),O=r.sq(y)*this._ep2,g.eps=O/(2*(1+Math.sqrt(1+O))+O),this.C3f(g.eps,h),E=e.SinCosSeries(!0,g.ssig2,g.csig2,h)-e.SinCosSeries(!0,g.ssig1,g.csig1,h),g.domg12=-this.f*this.A3f(g.eps)*v*(g.sig12+E),g.lam12=D+g.domg12,f&&(g.calp2===0?g.dlam12=-2*this._f1*i/t:(k=this.Lengths(g.eps,g.sig12,g.ssig1,g.csig1,i,g.ssig2,g.csig2,s,n,o,e.REDUCEDLENGTH,p,m),g.dlam12=k.m12b,g.dlam12*=this._f1/(g.calp2*o))),g},e.Geodesic.prototype.Inverse=function(t,n,i,a,o){var s,c;return o||=e.STANDARD,o===e.LONG_UNROLL&&(o|=e.STANDARD),o&=e.OUT_MASK,s=this.InverseInt(t,n,i,a,o),c=s.vals,o&e.AZIMUTH&&(c.azi1=r.atan2d(s.salp1,s.calp1),c.azi2=r.atan2d(s.salp2,s.calp2)),c},e.Geodesic.prototype.InverseInt=function(t,n,i,a,o){var s={},c,l,u,d,h,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,ee,te,ne,re,ie,ae,N,oe,se,ce,le,ue,de,fe,pe,me,he,ge,P,F,_e,I,ve,ye,be,xe,Se,Ce,we,Te,Ee,De,Oe,ke,Ae,je,Me,Ne,Pe,Fe,Ie,Le,Re,L,ze;if(s.lat1=t=r.LatFix(t),s.lat2=i=r.LatFix(i),t=r.AngRound(t),i=r.AngRound(i),c=r.AngDiff(n,a),l=c.e,c=c.d,o&e.LONG_UNROLL?(s.lon1=n,s.lon2=n+c+l):(s.lon1=r.AngNormalize(n),s.lon2=r.AngNormalize(a)),u=r.copysign(1,c),c*=u,l*=u,D=c*r.degree,d=r.sincosde(c,l),O=d.s,k=d.c,l=180-c-l,h=Math.abs(t)<Math.abs(i)||isNaN(i)?-1:1,h<0&&(u*=-1,[i,t]=[t,i]),v=r.copysign(1,-t),t*=v,i*=v,d=r.sincosd(t),y=this._f1*d.s,b=d.c,d=r.hypot(y,b),y/=d,b/=d,b=Math.max(e.tiny_,b),d=r.sincosd(i),x=this._f1*d.s,S=d.c,d=r.hypot(x,S),x/=d,S/=d,S=Math.max(e.tiny_,S),b<-y?S===b&&(x=r.copysign(y,x)):Math.abs(x)===-y&&(S=b),T=Math.sqrt(1+this._ep2*r.sq(y)),E=Math.sqrt(1+this._ep2*r.sq(x)),ne=Array(e.nC1_+1),re=Array(e.nC2_+1),ie=Array(e.nC3_),ae=t===-90||O===0,ae&&(j=k,M=O,ee=1,te=0,oe=y,se=j*b,ce=x,le=ee*S,A=Math.atan2(Math.max(0,se*ce-oe*le),se*le+oe*ce),N=this.Lengths(this._n,A,oe,se,T,ce,le,E,b,S,o|e.DISTANCE|e.REDUCEDLENGTH,ne,re),C=N.s12b,w=N.m12b,o&e.GEODESICSCALE&&(s.M12=N.M12,s.M21=N.M21),A<g||w>=0?((A<3*e.tiny_||A<m&&(C<0||w<0))&&(A=w=C=0),w*=this._b,C*=this._b,s.a12=A/r.degree):ae=!1),Me=2,!ae&&y===0&&(this.f<=0||l>=this.f*180))j=ee=0,M=te=1,C=this.a*D,A=de=D/this._f1,w=this._b*Math.sin(A),o&e.GEODESICSCALE&&(s.M12=s.M21=Math.cos(A)),s.a12=c/this._f1;else if(!ae)if(N=this.InverseStart(y,b,T,x,S,E,D,O,k,ne,re),A=N.sig12,M=N.salp1,j=N.calp1,A>=0)te=N.salp2,ee=N.calp2,fe=N.dnm,C=A*this._b*fe,w=r.sq(fe)*this._b*Math.sin(A/fe),o&e.GEODESICSCALE&&(s.M12=s.M21=Math.cos(A/fe)),s.a12=A/r.degree,de=D/(this._f1*fe);else{for(pe=0,me=e.tiny_,he=1,ge=e.tiny_,P=-1,F=!1,_e=!1;N=this.Lambda12(y,b,T,x,S,E,M,j,O,k,pe<f,ne,re,ie),I=N.lam12,te=N.salp2,ee=N.calp2,A=N.sig12,oe=N.ssig1,se=N.csig1,ce=N.ssig2,le=N.csig2,ue=N.eps,Pe=N.domg12,ve=N.dlam12,!(_e||!(Math.abs(I)>=(F?8:1)*m)||pe==p);++pe){if(I>0&&(pe<f||j/M>P/ge)?(ge=M,P=j):I<0&&(pe<f||j/M<he/me)&&(me=M,he=j),pe<f&&ve>0&&(ye=-I/ve,Math.abs(ye)<Math.PI&&(be=Math.sin(ye),xe=Math.cos(ye),Se=M*xe+j*be,Se>0))){j=j*xe-M*be,M=Se,d=r.hypot(M,j),M/=d,j/=d,F=Math.abs(I)<=16*m;continue}M=(me+ge)/2,j=(he+P)/2,d=r.hypot(M,j),M/=d,j/=d,F=!1,_e=Math.abs(me-M)+(he-j)<_||Math.abs(M-ge)+(j-P)<_}Ce=o|(o&(e.REDUCEDLENGTH|e.GEODESICSCALE)?e.DISTANCE:e.NONE),N=this.Lengths(ue,A,oe,se,T,ce,le,E,b,S,Ce,ne,re),C=N.s12b,w=N.m12b,o&e.GEODESICSCALE&&(s.M12=N.M12,s.M21=N.M21),w*=this._b,C*=this._b,s.a12=A/r.degree,o&e.AREA&&(L=Math.sin(Pe),ze=Math.cos(Pe),Me=O*ze-k*L,Ne=k*ze+O*L)}return o&e.DISTANCE&&(s.s12=0+C),o&e.REDUCEDLENGTH&&(s.m12=0+w),o&e.AREA&&(we=M*b,Te=r.hypot(j,M*y),Te!==0&&we!==0?(oe=y,se=j*b,ce=x,le=ee*S,De=r.sq(Te)*this._ep2,ue=De/(2*(1+Math.sqrt(1+De))+De),Oe=r.sq(this.a)*Te*we*this._e2,d=r.hypot(oe,se),oe/=d,se/=d,d=r.hypot(ce,le),ce/=d,le/=d,ke=Array(e.nC4_),this.C4f(ue,ke),Ae=e.SinCosSeries(!1,oe,se,ke),je=e.SinCosSeries(!1,ce,le,ke),s.S12=Oe*(A<.01?e.SinCosSeries(!1,oe,se,ke,A):je-Ae)):s.S12=0,!ae&&Me==2&&(Me=Math.sin(de),Ne=Math.cos(de)),!ae&&Ne>-.7071&&x-y<1.75?(Pe=1+Ne,Fe=1+b,Ie=1+S,Ee=2*Math.atan2(Me*(y*Ie+x*Fe),Pe*(y*x+Fe*Ie))):(Le=te*j-ee*M,Re=ee*j+te*M,Le===0&&Re<0&&(Le=e.tiny_*j,Re=-1),Ee=Math.atan2(Le,Re)),s.S12+=this._c2*Ee,s.S12*=h*u*v,s.S12+=0),h<0&&([te,M]=[M,te],[ee,j]=[j,ee],o&e.GEODESICSCALE&&([s.M21,s.M12]=[s.M12,s.M21])),M*=h*u,j*=h*v,te*=h*u,ee*=h*v,{vals:s,salp1:M,calp1:j,salp2:te,calp2:ee}},e.Geodesic.prototype.GenDirect=function(n,r,i,a,o,s){var c;return s?s===e.LONG_UNROLL&&(s|=e.STANDARD):s=e.STANDARD,a||(s|=e.DISTANCE_IN),c=new t.GeodesicLine(this,n,r,i,s),c.GenPosition(a,o,s)},e.Geodesic.prototype.Direct=function(e,t,n,r,i){return this.GenDirect(e,t,n,!1,r,i)},e.Geodesic.prototype.ArcDirect=function(e,t,n,r,i){return this.GenDirect(e,t,n,!0,r,i)},e.Geodesic.prototype.Line=function(e,n,r,i){return new t.GeodesicLine(this,e,n,r,i)},e.Geodesic.prototype.DirectLine=function(e,t,n,r,i){return this.GenDirectLine(e,t,n,!1,r,i)},e.Geodesic.prototype.ArcDirectLine=function(e,t,n,r,i){return this.GenDirectLine(e,t,n,!0,r,i)},e.Geodesic.prototype.GenDirectLine=function(n,r,i,a,o,s){var c;return s||=e.STANDARD|e.DISTANCE_IN,a||(s|=e.DISTANCE_IN),c=new t.GeodesicLine(this,n,r,i,s),c.GenSetDistance(a,o),c},e.Geodesic.prototype.InverseLine=function(n,i,a,o,s){var c,l,u;return s||=e.STANDARD|e.DISTANCE_IN,c=this.InverseInt(n,i,a,o,e.ARC),u=r.atan2d(c.salp1,c.calp1),s&(e.OUT_MASK&e.DISTANCE_IN)&&(s|=e.DISTANCE),l=new t.GeodesicLine(this,n,i,u,s,c.salp1,c.calp1),l.SetArc(c.vals.a12),l},e.Geodesic.prototype.Polygon=function(e){return new n.PolygonArea(this,e)},e.WGS84=new e.Geodesic(i.WGS84.a,i.WGS84.f)})(oy.Geodesic,oy.GeodesicLine,oy.PolygonArea,oy.Math,oy.Constants),(function(e,t,n){t.GeodesicLine=function(t,r,i,a,o,s,c){var l,u,d,f,p,m;o||=e.STANDARD|e.DISTANCE_IN,this.a=t.a,this.f=t.f,this._b=t._b,this._c2=t._c2,this._f1=t._f1,this.caps=o|e.LATITUDE|e.AZIMUTH|e.LONG_UNROLL,this.lat1=n.LatFix(r),this.lon1=i,s===void 0||c===void 0?(this.azi1=n.AngNormalize(a),l=n.sincosd(n.AngRound(this.azi1)),this.salp1=l.s,this.calp1=l.c):(this.azi1=a,this.salp1=s,this.calp1=c),l=n.sincosd(n.AngRound(this.lat1)),d=this._f1*l.s,u=l.c,l=n.hypot(d,u),d/=l,u/=l,u=Math.max(e.tiny_,u),this._dn1=Math.sqrt(1+t._ep2*n.sq(d)),this._salp0=this.salp1*u,this._calp0=n.hypot(this.calp1,this.salp1*d),this._ssig1=d,this._somg1=this._salp0*d,this._csig1=this._comg1=d!==0||this.calp1!==0?u*this.calp1:1,l=n.hypot(this._ssig1,this._csig1),this._ssig1/=l,this._csig1/=l,this._k2=n.sq(this._calp0)*t._ep2,f=this._k2/(2*(1+Math.sqrt(1+this._k2))+this._k2),this.caps&e.CAP_C1&&(this._A1m1=e.A1m1f(f),this._C1a=Array(e.nC1_+1),e.C1f(f,this._C1a),this._B11=e.SinCosSeries(!0,this._ssig1,this._csig1,this._C1a),p=Math.sin(this._B11),m=Math.cos(this._B11),this._stau1=this._ssig1*m+this._csig1*p,this._ctau1=this._csig1*m-this._ssig1*p),this.caps&e.CAP_C1p&&(this._C1pa=Array(e.nC1p_+1),e.C1pf(f,this._C1pa)),this.caps&e.CAP_C2&&(this._A2m1=e.A2m1f(f),this._C2a=Array(e.nC2_+1),e.C2f(f,this._C2a),this._B21=e.SinCosSeries(!0,this._ssig1,this._csig1,this._C2a)),this.caps&e.CAP_C3&&(this._C3a=Array(e.nC3_),t.C3f(f,this._C3a),this._A3c=-this.f*this._salp0*t.A3f(f),this._B31=e.SinCosSeries(!0,this._ssig1,this._csig1,this._C3a)),this.caps&e.CAP_C4&&(this._C4a=Array(e.nC4_),t.C4f(f,this._C4a),this._A4=n.sq(this.a)*this._calp0*this._salp0*t._e2,this._B41=e.SinCosSeries(!1,this._ssig1,this._csig1,this._C4a)),this.a13=this.s13=NaN},t.GeodesicLine.prototype.GenPosition=function(t,r,i,a={}){var o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,ee,te;return i?i===e.LONG_UNROLL&&(i|=e.STANDARD):i=e.STANDARD,i&=this.caps&e.OUT_MASK,a.lat1=this.lat1,a.azi1=this.azi1,a.lon1=i&e.LONG_UNROLL?this.lon1:n.AngNormalize(this.lon1),t?a.a12=r:a.s12=r,t||this.caps&e.DISTANCE_IN&e.OUT_MASK?(l=0,u=0,t?(o=r*n.degree,j=n.sincosd(r),s=j.s,c=j.c):(p=r/(this._b*(1+this._A1m1)),m=Math.sin(p),h=Math.cos(p),l=-e.SinCosSeries(!0,this._stau1*h+this._ctau1*m,this._ctau1*h-this._stau1*m,this._C1pa),o=p-(l-this._B11),s=Math.sin(o),c=Math.cos(o),Math.abs(this.f)>.01&&(d=this._ssig1*c+this._csig1*s,f=this._csig1*c-this._ssig1*s,l=e.SinCosSeries(!0,d,f,this._C1a),g=(1+this._A1m1)*(o+(l-this._B11))-r/this._b,o-=g/Math.sqrt(1+this._k2*n.sq(d)),s=Math.sin(o),c=Math.cos(o))),d=this._ssig1*c+this._csig1*s,f=this._csig1*c-this._ssig1*s,D=Math.sqrt(1+this._k2*n.sq(d)),i&(e.DISTANCE|e.REDUCEDLENGTH|e.GEODESICSCALE)&&((t||Math.abs(this.f)>.01)&&(l=e.SinCosSeries(!0,d,f,this._C1a)),u=(1+this._A1m1)*(l-this._B11)),x=this._calp0*d,S=n.hypot(this._salp0,this._calp0*f),S===0&&(S=f=e.tiny_),T=this._salp0,E=this._calp0*f,t&&i&e.DISTANCE&&(a.s12=this._b*((1+this._A1m1)*o+u)),i&e.LONGITUDE&&(C=this._salp0*d,w=f,b=n.copysign(1,this._salp0),_=i&e.LONG_UNROLL?b*(o-(Math.atan2(d,f)-Math.atan2(this._ssig1,this._csig1))+(Math.atan2(b*C,w)-Math.atan2(b*this._somg1,this._comg1))):Math.atan2(C*this._comg1-w*this._somg1,w*this._comg1+C*this._somg1),v=_+this._A3c*(o+(e.SinCosSeries(!0,d,f,this._C3a)-this._B31)),y=v/n.degree,a.lon2=i&e.LONG_UNROLL?this.lon1+y:n.AngNormalize(n.AngNormalize(this.lon1)+n.AngNormalize(y))),i&e.LATITUDE&&(a.lat2=n.atan2d(x,this._f1*S)),i&e.AZIMUTH&&(a.azi2=n.atan2d(T,E)),i&(e.REDUCEDLENGTH|e.GEODESICSCALE)&&(O=e.SinCosSeries(!0,d,f,this._C2a),k=(1+this._A2m1)*(O-this._B21),A=(this._A1m1-this._A2m1)*o+(u-k),i&e.REDUCEDLENGTH&&(a.m12=this._b*(D*(this._csig1*d)-this._dn1*(this._ssig1*f)-this._csig1*f*A)),i&e.GEODESICSCALE&&(j=this._k2*(d-this._ssig1)*(d+this._ssig1)/(this._dn1+D),a.M12=c+(j*d-f*A)*this._ssig1/this._dn1,a.M21=c-(j*this._ssig1-this._csig1*A)*d/D)),i&e.AREA&&(M=e.SinCosSeries(!1,d,f,this._C4a),this._calp0===0||this._salp0===0?(ee=T*this.calp1-E*this.salp1,te=E*this.calp1+T*this.salp1):(ee=this._calp0*this._salp0*(c<=0?this._csig1*(1-c)+s*this._ssig1:s*(this._csig1*s/(1+c)+this._ssig1)),te=n.sq(this._salp0)+n.sq(this._calp0)*this._csig1*f),a.S12=this._c2*Math.atan2(ee,te)+this._A4*(Math.abs(o)<.01?e.SinCosSeries(!1,this._ssig1,this._csig1,this._C4a,o):M-this._B41)),t||(a.a12=o/n.degree),a):(a.a12=NaN,a)},t.GeodesicLine.prototype.Position=function(e,t){return this.GenPosition(!1,e,t)},t.GeodesicLine.prototype.ArcPosition=function(e,t){return this.GenPosition(!0,e,t)},t.GeodesicLine.prototype.GenSetDistance=function(e,t){e?this.SetArc(t):this.SetDistance(t)},t.GeodesicLine.prototype.SetDistance=function(t){var n;this.s13=t,n=this.GenPosition(!1,this.s13,e.ARC),this.a13=0+n.a12},t.GeodesicLine.prototype.SetArc=function(t){var n;this.a13=t,n=this.GenPosition(!0,this.a13,e.DISTANCE),this.s13=0+n.s12}})(oy.Geodesic,oy.GeodesicLine,oy.Math);var sy=oy.Geodesic;function cy(e){if(!Number.isFinite(e))throw Error(`Nonfinite axis, azimuth, distance or arc`)}var ly=sy.ALL&~sy.AREA;function uy({semiMajorAxis:e,semiMinorAxis:t}){return cy(e),cy(t),new sy.Geodesic(e,(e-t)/e)}var dy=180/Math.PI;function fy(e){return{engine:uy({semiMajorAxis:1,semiMinorAxis:Math.sqrt(1-e.es)}),latitude:e.lat0*dy}}function py(e,t,n){let r=t.engine.Inverse(t.latitude,0,n.y*dy,J(n.x-e.long0,e.over)*dy,ly);if(!(r.M12>0))throw Error(`Coordinate is outside the ellipsoidal gnomonic horizon`);let i=e.a*r.m12/r.M12,a=r.azi1/dy;return n.x=e.x0+i*Math.sin(a),n.y=e.y0+i*Math.cos(a),n}function my(e,t,n){let r=(n.x-e.x0)/e.a,i=(n.y-e.y0)/e.a,a=Math.hypot(r,i);if(a===0)return n.x=e.long0,n.y=e.lat0,n;let o=t.engine.Line(t.latitude,0,Math.atan2(r,i)*dy,ly),s=a<=1,c=s?a:1/a,l=Math.atan(a);for(let t=0;t<20;t++){let t=o.Position(l,ly),r=s?(t.m12-c*t.M12)*t.M12:(c*t.m12-t.M12)*t.m12;if(!Number.isFinite(r))break;if(l-=r,Math.abs(r)<1e-14){let t=o.Position(l,ly);if(!(t.M12>0))break;return n.x=J(e.long0+t.lon2/dy,e.over),n.y=t.lat2/dy,n}}throw Error(`Ellipsoidal gnomonic inverse did not converge`)}function hy(e){e.sphere||(e.ellipsoid=fy(e)),e.sin_p14=Math.sin(e.lat0),e.cos_p14=Math.cos(e.lat0),e.infinity_dist=1e3*e.a,e.rc=1}function gy(e,t){if(e.ellipsoid)return py(e,e.ellipsoid,t);var n,r,i,a,o,s,c,l,u=t.x,d=t.y;return i=J(u-e.long0,e.over),n=Math.sin(d),r=Math.cos(d),a=Math.cos(i),s=e.sin_p14*n+e.cos_p14*r*a,o=1,s>0||Math.abs(s)<=1e-10?(c=e.x0+e.a*o*r*Math.sin(i)/s,l=e.y0+e.a*o*(e.cos_p14*n-e.sin_p14*r*a)/s):(c=e.x0+e.infinity_dist*r*Math.sin(i),l=e.y0+e.infinity_dist*(e.cos_p14*n-e.sin_p14*r*a)),t.x=c,t.y=l,t}function _y(e,t){if(e.ellipsoid)return my(e,e.ellipsoid,t);var n,r,i,a,o,s;return t.x=(t.x-e.x0)/e.a,t.y=(t.y-e.y0)/e.a,t.x/=e.k0,t.y/=e.k0,n=Math.sqrt(t.x*t.x+t.y*t.y),n?(a=Math.atan2(n,e.rc),r=Math.sin(a),i=Math.cos(a),s=bv(i*e.sin_p14+t.y*r*e.cos_p14/n),o=Math.atan2(t.x*r,n*e.cos_p14*i-t.y*e.sin_p14*r),o=J(e.long0+o,e.over)):(s=e.lat0,o=e.long0),t.x=o,t.y=s,t}function vy(e,t={}){let n={...e,sin_p14:0,cos_p14:0,infinity_dist:0,rc:0,phic0:0,...t};return hy(n),n}var yy={name:`gnom`,aliases:[],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`],create(e){let t=J_(e);return jg(X_(`gnom`,e,vy(t),gy,_y,t.sphere?Z_(t):void 0),t,Math.min(Math.PI*80/180,(1-t.es)*Math.PI*.45),(n,r)=>t.sphere?Mg(Y_(t,e),n,r,`gnom`):Rg(Y_(t,e),n,r),(1-t.es)*Math.PI/2)}};function by(e,t){return 2*Math.atan(e*Math.exp(t))-K}function xy(e,t){var n=by(1,t),r=0,i=0;let a=0;do{if(++a>50)throw Error(`Isometric latitude inverse did not converge`);r=n,i=e*Math.sin(r),n=by(Math.exp(e*Math.log((1+i)/(1-i))/2),t)}while(Math.abs(n-r)>1e-12);return n}function Sy(e,t,n){if(Math.abs(t)>K)return NaN;if(t===K)return 1/0;if(t===-1*K)return-1/0;var r=e*n;return Math.log(Math.tan((K+t)/2))+e*Math.log((1-r)/(1+r))/2}function Cy(e){e.k0||=1;var t=e.b/e.a;e.e=Math.sqrt(1-t*t),e.lc=e.long0,e.rs=Math.sqrt(1+e.e*e.e*Math.cos(e.lat0)**4/(1-e.e*e.e));var n=Math.sin(e.lat0),r=Math.asin(n/e.rs);e.cp=Sy(0,r,Math.sin(r))-e.rs*Sy(e.e,e.lat0,n),e.n2=e.k0*e.a*Math.sqrt(1-e.e*e.e)/(1-e.e*e.e*n*n),e.xs=e.x0,e.ys=e.y0-e.n2*r}function wy(e,t){var n=t.x,r=t.y,i=e.rs*(n-e.lc),a=e.cp+e.rs*Sy(e.e,r,Math.sin(r)),o=Math.asin(Math.sin(i)/T_(a)),s=Sy(0,o,Math.sin(o));return t.x=e.xs+e.n2*s,t.y=e.ys+e.n2*Math.atan(b_(a)/Math.cos(i)),t}function Ty(e,t){var n=t.x,r=t.y,i=Math.atan(b_((n-e.xs)/e.n2)/Math.cos((r-e.ys)/e.n2)),a=Math.asin(Math.sin((r-e.ys)/e.n2)/T_((n-e.xs)/e.n2)),o=Sy(0,a,Math.sin(a));return t.x=e.lc+i/e.rs,t.y=xy(e.e,(o-e.cp)/e.rs),t}function Ey(e,t={}){let n={...e,lc:0,rs:0,cp:0,n2:0,xs:0,ys:0,...t};return Cy(n),n}var Dy={name:`gstmerc`,aliases:[`gstmerg`],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`,`k`,`k_0`],create(e){let t=J_(e),n=Ey(t),r=X_(`gstmerc`,e,n,wy,Ty);return Dm(r,V(t.long0-Math.PI/6,-Math.PI/3,t.long0+Math.PI/6,Math.PI/3),e=>Im(r.forward,e,t.long0,t.over,xy(n.e,-n.cp/n.rs)),t.primeMeridian,t.over)}};function Oy(e){e.a=6377397.155,e.es=.006674372230614,e.e=Math.sqrt(e.es),e.s45=Math.PI/4,e.s90=2*e.s45,e.fi0=e.lat0,e.e2=e.es,e.e=Math.sqrt(e.e2),e.alfa=Math.sqrt(1+e.e2*Math.cos(e.fi0)**4/(1-e.e2)),e.uq=1.04216856380474,e.u0=Math.asin(Math.sin(e.fi0)/e.alfa),e.g=((1+e.e*Math.sin(e.fi0))/(1-e.e*Math.sin(e.fi0)))**(e.alfa*e.e/2),e.k=Math.tan(e.u0/2+e.s45)/Math.tan(e.fi0/2+e.s45)**+e.alfa*e.g,e.k1=e.k0,e.n0=e.a*Math.sqrt(1-e.e2)/(1-e.e2*Math.sin(e.fi0)**2),e.s0=1.37008346281555,e.n=Math.sin(e.s0),e.ro0=e.k1*e.n0/Math.tan(e.s0),e.ad=e.s90-e.uq}function ky(e,t){var n,r,i,a,o,s,c,l=t.x,u=t.y,d=J(l-e.long0,e.over);return n=((1+e.e*Math.sin(u))/(1-e.e*Math.sin(u)))**(e.alfa*e.e/2),r=2*(Math.atan(e.k*Math.tan(u/2+e.s45)**+e.alfa/n)-e.s45),i=-d*e.alfa,a=Math.asin(Math.cos(e.ad)*Math.sin(r)+Math.sin(e.ad)*Math.cos(r)*Math.cos(i)),o=Math.asin(Math.cos(r)*Math.sin(i)/Math.cos(a)),s=e.n*o,c=e.ro0*Math.tan(e.s0/2+e.s45)**+e.n/Math.tan(a/2+e.s45)**+e.n,t.y=c*Math.cos(s)/1,t.x=c*Math.sin(s)/1,e.czech||(t.y*=-1,t.x*=-1),t}function Ay(e,t){var n,r,i,a,o,s,c,l,u=t.x;t.x=t.y,t.y=u,e.czech||(t.y*=-1,t.x*=-1),s=Math.sqrt(t.x*t.x+t.y*t.y),o=Math.atan2(t.y,t.x),a=o/Math.sin(e.s0),i=2*(Math.atan((e.ro0/s)**(1/e.n)*Math.tan(e.s0/2+e.s45))-e.s45),n=Math.asin(Math.cos(e.ad)*Math.sin(i)-Math.sin(e.ad)*Math.cos(i)*Math.cos(a)),r=Math.asin(Math.cos(i)*Math.sin(a)/Math.cos(n)),t.x=e.long0-r/e.alfa,c=n,l=0;var d=0;do t.y=2*(Math.atan(e.k**(-1/e.alfa)*Math.tan(n/2+e.s45)**(1/e.alfa)*((1+e.e*Math.sin(c))/(1-e.e*Math.sin(c)))**(e.e/2))-e.s45),Math.abs(c-t.y)<1e-10&&(l=1),c=t.y,d+=1;while(l===0&&d<15);return d>=15?null:t}function jy(e,t={}){let n={...e,s45:0,s90:0,fi0:0,e2:0,alfa:0,uq:0,u0:0,g:0,k:0,k1:0,n0:0,s0:0,n:0,ro0:0,ad:0,czech:!1,...t};return Oy(n),n}var My={name:`krovak`,aliases:[`Krovak`,`Krovak Modified`,`Krovak (North Orientated)`,`Krovak Modified (North Orientated)`],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`,`k`,`k_0`,`czech`,`alpha`,`lat_ts`],flags:[`czech`],create(e){let t=U(e.parameters,`alpha`,30.28813972222222),n=U(e.parameters,`lat_ts`,78.5);if(![30.28813972222222,30.28813975277778].some(e=>Math.abs(t-e)<=1e-10))throw Error(`Krovak requires its fixed cone-axis co-latitude`);if(Math.abs(n-78.5)>1e-10)throw Error(`Krovak requires its fixed 78.5 degree pseudo standard parallel`);let r=J_(e);r.lat0=Eh(e.parameters,`lat_0`,49.5),r.long0=Eh(e.parameters,`lon_0`,24.83333333333333),r.k0=U(e.parameters,`k_0`,U(e.parameters,`k`,.9999));let i=jy(r,{czech:Dh(e.parameters,`czech`)});return Dm(X_(`krovak`,e,i,ky,Ay),V(r.long0-Math.PI/12,Math.max(-Math.PI/2+1e-8,r.lat0-Math.PI/36),r.long0+Math.PI/12,Math.min(Math.PI/2-1e-8,r.lat0+Math.PI/36)),t=>K_(Y_(i,e),t),r.primeMeridian,r.over)}};function Ny(e,t){var n=t.x,r=t.y,i=J(n-e.long0,e.over),a=e.x0+e.a*i,o=e.y0+e.a*Math.log(Math.tan(Math.PI/4+r/2.5))*1.25;return t.x=a,t.y=o,t}function Py(e,t){t.x-=e.x0,t.y-=e.y0;var n=J(e.long0+t.x/e.a,e.over),r=2.5*(Math.atan(Math.exp(.8*t.y/e.a))-Math.PI/4);return t.x=n,t.y=r,t}function Fy(e,t={}){return{...e,...t}}var Iy={name:`mill`,aliases:[`Miller_Cylindrical`],parameters:[`lon_0`,`x_0`,`y_0`],create(e){let t=J_(e),n=X_(`mill`,e,Fy(t),Ny,Py);return Dm(n,V(t.long0-Math.PI,-Math.PI/2,t.long0+Math.PI,Math.PI/2),e=>Fm(n.forward,e,t.long0,t.over),t.primeMeridian,t.over)}};function Ly(e){e.x0=e.x0===void 0?0:e.x0,e.y0=e.y0===void 0?0:e.y0,e.long0=e.long0===void 0?0:e.long0}function Ry(e,t){var n=t.x,r=t.y,i=J(n-e.long0,e.over);let a=Math.sin(Math.abs(r)),o=Math.cos(r),s=Math.abs(r)===Math.PI/2?0:Math.PI*o*o/(1+a),c=Math.cbrt(6*s),l=0,u=Math.PI;c=Math.min(c,u);for(let e=0;e<32&&c>0;e++){let t=Vy(c)-s,n=t/(2*Math.sin(c/2)**2);if(Math.abs(n)<=16*2**-52*c)break;t>0?u=c:l=c;let r=c-n;if(r===c||u-l<=8*2**-52*Math.max(1,c))break;if(c=r>=l&&r<=u?r:(l+u)/2,e===31)throw Error(`Mollweide forward did not converge`)}var d=2*Math.SQRT2/Math.PI*e.a*i*Math.sin(c/2)+e.x0,f=Math.sign(r)*Math.SQRT2*e.a*Math.cos(c/2)+e.y0;return t.x=d,t.y=f,t}function zy(e,t){let n=t.x-e.x0,r=(t.y-e.y0)/(Math.SQRT2*e.a);if(Math.abs(r)>1+8*2**-52)return null;let i=n/(2*Math.SQRT2*e.a),a=i*i+r*r;if(!e.over&&a>1+8*2**-52)return null;let o=2*Math.acos(Math.min(1,Math.abs(r))),s=Math.sin(o/2);if(!e.over&&Math.abs(a-1)<=8*2**-52&&(s=Math.min(1,Math.abs(i)),o=2*Math.asin(s)),s===0&&Math.abs(n)>8*2**-52*e.a)return null;let c=s===0?0:Math.PI*i/s;var l=J(e.long0+c,e.over),u=Math.sign(r)*(Math.PI/2-2*Math.asin(Math.sqrt(Vy(o)/(2*Math.PI))));return t.x=l,t.y=u,t}function By(e,t={}){let n={...e,...t};return Ly(n),n}function Vy(e){if(e>.5)return e-Math.sin(e);let t=e*e;return e*t*(1/6+t*(-1/120+t*(1/5040+t*(-1/362880+t*(1/39916800+t*(-1/6227020800+t/1307674368e3))))))}var Hy={name:`moll`,aliases:[`Mollweide`],parameters:[`lon_0`,`x_0`,`y_0`],create(e){let t=J_(e),n=X_(`moll`,e,By(t),Ry,zy);return Dm(n,V(t.long0-Math.PI,-Math.PI/2,t.long0+Math.PI,Math.PI/2),e=>Fm(n.forward,e,t.long0,t.over),t.primeMeridian,t.over)}};function Uy(e){e.A=[],e.A[1]=.6399175073,e.A[2]=-.1358797613,e.A[3]=.063294409,e.A[4]=-.02526853,e.A[5]=.0117879,e.A[6]=-.0055161,e.A[7]=.0026906,e.A[8]=-.001333,e.A[9]=67e-5,e.A[10]=-34e-5,e.B_re=[],e.B_im=[],e.B_re[1]=.7557853228,e.B_im[1]=0,e.B_re[2]=.249204646,e.B_im[2]=.003371507,e.B_re[3]=-.001541739,e.B_im[3]=.04105856,e.B_re[4]=-.10162907,e.B_im[4]=.01727609,e.B_re[5]=-.26623489,e.B_im[5]=-.36249218,e.B_re[6]=-.6870983,e.B_im[6]=-1.1651967,e.C_re=[],e.C_im=[],e.C_re[1]=1.3231270439,e.C_im[1]=0,e.C_re[2]=-.577245789,e.C_im[2]=-.007809598,e.C_re[3]=.508307513,e.C_im[3]=-.112208952,e.C_re[4]=-.15094762,e.C_im[4]=.18200602,e.C_re[5]=1.01418179,e.C_im[5]=1.64497696,e.C_re[6]=1.9660549,e.C_im[6]=2.5127645,e.D=[],e.D[1]=1.5627014243,e.D[2]=.5185406398,e.D[3]=-.03333098,e.D[4]=-.1052906,e.D[5]=-.0368594,e.D[6]=.007317,e.D[7]=.0122,e.D[8]=.00394,e.D[9]=-.0013}function Wy(e,t){var n,r=t.x,i=t.y-e.lat0,a=r-e.long0,o=i/Rh*1e-5,s=a,c=1,l=0;for(n=1;n<=10;n++)c*=o,l+=e.A[n]*c;var u=l,d=s,f=1,p=0,m,h,g=0,_=0;for(n=1;n<=6;n++)m=f*u-p*d,h=p*u+f*d,f=m,p=h,g=g+e.B_re[n]*f-e.B_im[n]*p,_=_+e.B_im[n]*f+e.B_re[n]*p;return t.x=_*e.a+e.x0,t.y=g*e.a+e.y0,t}function Gy(e,t){var n,r=t.x,i=t.y,a=r-e.x0,o=(i-e.y0)/e.a,s=a/e.a,c=1,l=0,u,d,f=0,p=0;for(n=1;n<=6;n++)u=c*o-l*s,d=l*o+c*s,c=u,l=d,f=f+e.C_re[n]*c-e.C_im[n]*l,p=p+e.C_im[n]*c+e.C_re[n]*l;for(var m=0;m<e.iterations;m++){var h=f,g=p,_,v,y=o,b=s;for(n=2;n<=6;n++)_=h*f-g*p,v=g*f+h*p,h=_,g=v,y+=(n-1)*(e.B_re[n]*h-e.B_im[n]*g),b+=(n-1)*(e.B_im[n]*h+e.B_re[n]*g);h=1,g=0;var x=e.B_re[1],S=e.B_im[1];for(n=2;n<=6;n++)_=h*f-g*p,v=g*f+h*p,h=_,g=v,x+=n*(e.B_re[n]*h-e.B_im[n]*g),S+=n*(e.B_im[n]*h+e.B_re[n]*g);var C=x*x+S*S;f=(y*x+b*S)/C,p=(b*x-y*S)/C}var w=f,T=p,E=1,D=0;for(n=1;n<=9;n++)E*=w,D+=e.D[n]*E;var O=e.lat0+D*Rh*1e5;return t.x=e.long0+T,t.y=O,t}function Ky(e,t={}){let n={...e,A:[],B_re:[],B_im:[],C_re:[],C_im:[],D:[],iterations:1,...t};return Uy(n),n}var qy={name:`nzmg`,aliases:[`New_Zealand_Map_Grid`],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`,`iterations`],create(e){let t=J_(e),n=U(e.parameters,`iterations`,1);if(!Number.isInteger(n)||n<0||n>10)throw Error(`NZMG iterations must be an integer from 0 to 10`);if(!Object.prototype.hasOwnProperty.call(e.parameters,`lat_0`)||!Object.prototype.hasOwnProperty.call(e.parameters,`lon_0`))throw Error(`NZMG requires lat_0 and lon_0`);let r=Ky(t,{iterations:n});return Dm(X_(`nzmg`,e,r,Wy,Gy),V(t.long0-Math.PI/22.5,Math.max(-Math.PI/2,t.lat0-Math.PI/22.5),t.long0+Math.PI/22.5,Math.min(Math.PI/2,t.lat0+Math.PI/22.5)),t=>q_(Y_(r,e),t),t.primeMeridian,t.over)}},Jy=1e-7;function Yy(e){return e.no_uoff||e.no_off||[`hotineobliquemercator`,`hotineobliquemercatorvarianta`,`hotineobliquemercatorazimuthnaturalorigin`].includes(e.projName.toLowerCase().replace(/[ _-]/g,``))}function Xy(e){var t,n,r,i,a,o,s,c,l,u,d=0,f,p=0,m=0,h=0,g=0,_=0,v=0;e.k0||=1,e.no_off=Yy(e),e.no_rot=e.no_rot;var y=!1;Number.isFinite(e.alpha)&&(y=!0);var b=!1;if(Number.isFinite(e.rectified_grid_angle)&&(b=!0),y&&(v=e.alpha),b&&(d=e.rectified_grid_angle,y||=(v=0,!0)),y||b)p=e.longc;else if(m=e.long1,g=e.lat1,h=e.long2,_=e.lat2,Math.abs(g-_)<=Jy||Math.abs(g)<=Jy||Math.abs(Math.abs(g)-K)<=Jy||Math.abs(Math.abs(e.lat0)-K)<=Jy||Math.abs(Math.abs(_)-K)<=Jy)throw Error();var x=1-e.es;if(n=Math.sqrt(x),Math.abs(e.lat0)>1e-10?(c=Math.sin(e.lat0),r=Math.cos(e.lat0),t=1-e.es*c*c,e.B=r*r,e.B=Math.sqrt(1+e.es*e.B*e.B/x),e.A=e.B*e.k0*n/t,i=e.B*n/(r*Math.sqrt(t)),a=i*i-1,a<=0?a=0:(a=Math.sqrt(a),e.lat0<0&&(a=-a)),e.E=a+=i,e.E*=Nh(e.e,e.lat0,c)**+e.B):(e.B=1/n,e.A=e.k0,e.E=i=a=1),y||b){y?(f=Math.asin(Math.sin(v)/i),b||(d=v)):(f=d,v=Math.asin(i*Math.sin(f)));let t=.5*(a-1/a)*Math.tan(f);i>1&&Math.abs(Math.cos(v))<=8*2**-52?t=Math.sign(e.lat0)*Math.sign(Math.sin(v)):Math.abs(t)>1&&Math.abs(t)<=1+8*2**-52&&(t=Math.sign(t)),e.lam0=p-Math.asin(t)/e.B}else o=Nh(e.e,g,Math.sin(g))**+e.B,s=Nh(e.e,_,Math.sin(_))**+e.B,a=e.E/o,l=(s-o)/(s+o),u=e.E*e.E,u=(u-s*o)/(u+s*o),t=m-h,t<-Math.PI?h-=Fh:t>Math.PI&&(h+=Fh),e.lam0=J(.5*(m+h)-Math.atan(u*Math.tan(.5*e.B*(m-h))/l)/e.B,e.over),f=Math.atan(2*Math.sin(e.B*J(m-e.lam0,e.over))/(a-1/a)),d=v=Math.asin(i*Math.sin(f));e.singam=Math.sin(f),e.cosgam=Math.cos(f),e.sinrot=Math.sin(d),e.cosrot=Math.cos(d),e.rB=1/e.B,e.ArB=e.A*e.rB,e.BrA=1/e.ArB,e.no_off?e.u_0=0:(e.u_0=Math.abs(e.ArB*Math.atan(Math.sqrt(i*i-1)/Math.cos(v))),e.lat0<0&&(e.u_0=-e.u_0)),a=.5*f,e.v_pole_n=e.ArB*Math.log(Math.tan(q-a)),e.v_pole_s=e.ArB*Math.log(Math.tan(q+a))}function Zy(e,t){var n=t,r,i,a,o,s,c,l,u;if(t.x-=e.lam0,Math.abs(Math.abs(t.y)-K)>1e-10){if(s=e.E/Nh(e.e,t.y,Math.sin(t.y))**+e.B,c=1/s,r=.5*(s-c),i=.5*(s+c),o=Math.sin(e.B*t.x),a=(r*e.singam-o*e.cosgam)/i,Math.abs(Math.abs(a)-1)<1e-10)throw Error();u=.5*e.ArB*Math.log((1-a)/(1+a)),c=Math.cos(e.B*t.x),l=Math.abs(c)<Jy?e.A*t.x:e.ArB*Math.atan2(r*e.cosgam+o*e.singam,c)}else u=t.y>0?e.v_pole_n:e.v_pole_s,l=e.ArB*t.y;return e.no_rot?(n.x=l,n.y=u):(l-=e.u_0,n.x=u*e.cosrot+l*e.sinrot,n.y=l*e.cosrot-u*e.sinrot),n.x=e.a*n.x+e.x0,n.y=e.a*n.y+e.y0,n}function Qy(e,t){var n,r,i,a,o,s,c,l=t;if(t.x=(t.x-e.x0)*(1/e.a),t.y=(t.y-e.y0)*(1/e.a),e.no_rot?(r=t.y,n=t.x):(r=t.x*e.cosrot-t.y*e.sinrot,n=t.y*e.cosrot+t.x*e.sinrot+e.u_0),i=Math.exp(-e.BrA*r),a=.5*(i-1/i),o=.5*(i+1/i),s=Math.sin(e.BrA*n),c=(s*e.cosgam+a*e.singam)/o,Math.abs(Math.abs(c)-1)<1e-10)l.x=0,l.y=c<0?-K:K;else{if(l.y=e.E/Math.sqrt((1+c)/(1-c)),l.y=Bh(e.e,l.y**(1/e.B)),l.y===1/0)throw Error();l.x=-e.rB*Math.atan2(a*e.cosgam-s*e.singam,Math.cos(e.BrA*n))}return l.x+=e.lam0,l}function $y(e,t={}){let n={...e,no_off:!1,no_rot:!1,alpha:NaN,rectified_grid_angle:NaN,longc:0,long1:0,long2:0,B:0,A:0,E:0,lam0:0,singam:0,cosgam:0,sinrot:0,cosrot:0,rB:0,ArB:0,BrA:0,u_0:0,v_pole_n:0,v_pole_s:0,no_uoff:!1,projName:``,...t};return Xy(n),n}var eb={name:`omerc`,aliases:[`Hotine_Oblique_Mercator`,`Hotine Oblique Mercator`,`Hotine_Oblique_Mercator_variant_A`,`Hotine_Oblique_Mercator_Variant_B`,`Hotine_Oblique_Mercator_Azimuth_Natural_Origin`,`Hotine_Oblique_Mercator_Two_Point_Natural_Origin`,`Hotine_Oblique_Mercator_Azimuth_Center`,`Oblique_Mercator`],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`,`k`,`k_0`,`alpha`,`gamma`,`lonc`,`lon_1`,`lon_2`,`lat_1`,`lat_2`,`no_off`,`no_uoff`,`no_rot`],flags:[`no_off`,`no_uoff`,`no_rot`],create(e){let t=J_(e);if(Math.abs(t.lat0)>=Math.PI/2)throw Error(`Oblique Mercator origin must be away from the poles`);let n=Object.prototype.hasOwnProperty.call(e.parameters,`alpha`)||Object.prototype.hasOwnProperty.call(e.parameters,`gamma`)?[`lonc`]:[`lon_1`,`lat_1`,`lon_2`,`lat_2`];for(let t of n)if(!Object.prototype.hasOwnProperty.call(e.parameters,t))throw Error(`Oblique Mercator requires `+t);let r=$y(t,{projName:e.parameters.proj||`omerc`,alpha:U(e.parameters,`alpha`,NaN)*Math.PI/180,rectified_grid_angle:U(e.parameters,`gamma`,NaN)*Math.PI/180,longc:U(e.parameters,`lonc`,0)*Math.PI/180,long1:U(e.parameters,`lon_1`,0)*Math.PI/180,long2:U(e.parameters,`lon_2`,0)*Math.PI/180,no_off:Dh(e.parameters,`no_off`),no_uoff:Dh(e.parameters,`no_uoff`),no_rot:Dh(e.parameters,`no_rot`)});return Dm(X_(`omerc`,e,r,Zy,Qy),V(r.lam0-Math.PI/18,Math.max(-Math.PI/2+1e-8,t.lat0-Math.PI/18),r.lam0+Math.PI/18,Math.min(Math.PI/2-1e-8,t.lat0+Math.PI/18)),t=>G_(Y_(r,e),t),t.primeMeridian,t.over)}};function tb(e){let t=Math.sin(e.lat0),n=Math.cos(e.lat0),r=1/Math.sqrt(1-e.es*t*t);return{...e,sin0:t,cos0:n,originY:-e.es*r*t*n}}function nb(e,t){let n=J(t.x-e.long0,e.over),r=Math.sin(t.y),i=Math.cos(t.y),a=1/Math.sqrt(1-e.es*r*r);return t.x=e.x0+e.a*e.k0*a*i*Math.sin(n),t.y=e.y0+e.a*e.k0*(a*((1-e.es)*r*e.cos0-i*Math.cos(n)*e.sin0)-e.originY),t}function rb(e,t){let n=(t.x-e.x0)/(e.a*e.k0),r=(t.y-e.y0)/(e.a*e.k0)+e.originY,i=1-e.es,a=e.cos0*e.cos0+e.sin0*e.sin0/i,o=r*e.sin0*e.cos0*e.es/i,s=n*n+r*r*(e.sin0*e.sin0+e.cos0*e.cos0/i)-1,c=o*o-a*s;if(c<-32*2**-52*a)throw Error(`Coordinate is outside the orthographic ellipse`);let l=(-o+Math.sqrt(Math.max(0,c)))/a,u=l*e.cos0-r*e.sin0,d=l*e.sin0+r*e.cos0;return t.x=J(e.long0+Math.atan2(n,u),e.over),t.y=Math.atan2(d,i*Math.hypot(u,n)),t}var ib={name:`ortho`,aliases:[],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`,`k`,`k_0`],create(e){let t=J_(e);return jg(X_(`ortho`,e,tb(t),nb,rb,Z_(t,0,!0)),t,Math.PI/2,(n,r)=>Ng(Y_(t,e),n,r),Math.PI/2)}},ab=20;function ob(e){e.meridianPole=d_(e.a,e.es,0,Math.PI/2),e.poleRadius=e.a/Math.sqrt(1-e.es),e.ml0=d_(e.a,e.es,0,e.lat0)}function sb(e,t){var n=t.x,r=t.y,i,a,o,s=J(n-e.long0,e.over);if(o=s*Math.sin(r),e.sphere)r===0?(i=e.a*s,a=-1*e.a*e.lat0):(i=e.a*Math.sin(o)/Math.tan(r),a=e.a*(r-e.lat0+2*Math.sin(o/2)**2/Math.tan(r)));else if(r===0)i=e.a*s,a=-1*e.ml0;else{var c=cv(e.a,e.e,Math.sin(r))/Math.tan(r);i=c*Math.sin(o),a=d_(e.a,e.es,e.lat0,r)+c*(2*Math.sin(o/2)**2)}return t.x=i+e.x0,t.y=a+e.y0,t}function cb(e,t){var n,r,i=t.x-e.x0,a=t.y-e.y0,o,s,c,l,u;let d=a+(e.sphere?e.a*e.lat0:e.ml0),f=d<0?-1:1,p=(e.sphere?e.a*Math.PI/2:e.meridianPole)-f*d,m=Math.hypot(i,p);if(m/e.a<1e-6)return t.x=J(e.long0+Math.atan2(i,p),e.over),t.y=f*(Math.PI/2-m/e.poleRadius),t;if(e.sphere)if(Math.abs(a+e.a*e.lat0)<=1e-10)n=J(i/e.a+e.long0,e.over),r=0;else{s=e.lat0+a/e.a,c=i*i/e.a/e.a+s*s,l=s;var h;for(o=ab;o;--o)if(h=Math.tan(l),u=-1*(s*(l*h+1)-l-.5*(l*l+c)*h)/((l-s)/h-1),l+=u,Math.abs(u)<=1e-14){r=l;break}if(r=ub(e,r===void 0?l:r,i,a),r===void 0)return null;l=r,n=J(e.long0+Math.asin(i*Math.tan(l)/e.a)/Math.sin(r),e.over)}else if(Math.abs(a+e.ml0)<=1e-10)r=0,n=J(e.long0+i/e.a,e.over);else{s=(e.ml0+a)/e.a,c=i*i/e.a/e.a+s*s,l=s;var g,_,v,y,b;for(o=ab;o;--o)if(b=e.e*Math.sin(l),g=Math.sqrt(1-b*b)*Math.tan(l),_=d_(e.a,e.es,0,l),v=(1-e.es)/(1-b*b)**1.5,y=_/e.a,u=(s*(g*y+1)-y-.5*g*(y*y+c))/(e.es*Math.sin(2*l)*(y*y+c-2*s*y)/(4*g)+(s-y)*(g*v-2/Math.sin(2*l))-v),l-=u,Math.abs(u)<=1e-14){r=l;break}if(r=ub(e,r===void 0?l:r,i,a),r===void 0)return null;l=r,g=Math.sqrt(1-e.es*Math.sin(r)**2)*Math.tan(r),n=J(e.long0+Math.asin(i*g/e.a)/Math.sin(r),e.over)}return t.x=n,t.y=r,t}function lb(e,t={}){let n={...e,ml0:0,meridianPole:0,poleRadius:0,...t};return ob(n),n}function ub(e,t,n,r){for(let i=0;i<8;i++){if(!Number.isFinite(t)||Math.abs(t)>=Math.PI/2)return;let i=Math.sin(t),a=Math.cos(t),o=1-e.es*i*i,s=e.sphere?e.a:cv(e.a,e.e,i),c=s/Math.tan(t),l=Math.asin(n/c),u=c*Math.sin(l),d=2*Math.sin(l/2)**2,f=e.sphere?e.a*(t-e.lat0):d_(e.a,e.es,e.lat0,t),p=c*d,m=f+p-r;if(Math.abs(u-n)<=64*2**-52*Math.max(e.a,Math.abs(n))&&Math.abs(m)<=64*2**-52*Math.max(Math.abs(r),Math.abs(f),Math.abs(p),e.a*Math.max(Math.abs(t),Math.abs(e.lat0))))return t;let h=m/((e.sphere?e.a:e.a*(1-e.es)/o**1.5)+s*((e.sphere?0:e.es*a*a/o)-1/(i*i))*(-d/Math.cos(l)));if(!Number.isFinite(h)||Math.abs(h)>1e-6)return;t-=h}}var db={name:`poly`,aliases:[`Polyconic`,`American_Polyconic`],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`],create(e){let t=J_(e),n=X_(`poly`,e,lb(t),sb,cb);return Dm(n,V(t.long0-Math.PI/6,Math.max(-Math.PI/2+1e-8,t.lat0-Math.PI/2+1e-8),t.long0+Math.PI/6,Math.min(Math.PI/2-1e-8,t.lat0+Math.PI/2-1e-8)),r=>V_(Y_(t,e),n.forward,r),t.primeMeridian,t.over)}},fb={FRONT:1,RIGHT:2,BACK:3,LEFT:4,TOP:5,BOTTOM:6},Y={AREA_0:1,AREA_1:2,AREA_2:3,AREA_3:4};function pb(e){e.x0=e.x0||0,e.y0=e.y0||0,e.lat0=e.lat0||0,e.long0=e.long0||0,e.lat_ts=e.lat_ts||0,e.lat0>=K-q/2?e.face=fb.TOP:e.lat0<=-(K-q/2)?e.face=fb.BOTTOM:Math.abs(e.long0)<=q?e.face=fb.FRONT:Math.abs(e.long0)<=K+q?e.face=e.long0>0?fb.RIGHT:fb.LEFT:e.face=fb.BACK,e.es!==0&&(e.one_minus_f=1-(e.a-e.b)/e.a,e.one_minus_f_squared=e.one_minus_f*e.one_minus_f)}function mb(e,t){var n=t,r,i,a,o,s,c,l=0;if(t.x-=e.long0,r=e.es===0?t.y:Math.atan(e.one_minus_f_squared*Math.tan(t.y)),i=t.x,e.face===fb.TOP)o=K-r,i>=q&&i<=K+q?(l=Y.AREA_0,a=i-K):i>K+q||i<=-(K+q)?(l=Y.AREA_1,a=i>0?i-Math.PI:i+Math.PI):i>-(K+q)&&i<=-q?(l=Y.AREA_2,a=i+K):(l=Y.AREA_3,a=i);else if(e.face===fb.BOTTOM)o=K+r,i>=q&&i<=K+q?(l=Y.AREA_0,a=-i+K):i<q&&i>=-q?(l=Y.AREA_1,a=-i):i<-q&&i>=-(K+q)?(l=Y.AREA_2,a=-i-K):(l=Y.AREA_3,a=i>0?-i+Math.PI:-i-Math.PI);else{var u,d,f,p,m,h,g;e.face===fb.RIGHT?i=_b(i,+K):e.face===fb.BACK?i=_b(i,+Math.PI):e.face===fb.LEFT&&(i=_b(i,-K)),p=Math.sin(r),m=Math.cos(r),h=Math.sin(i),g=Math.cos(i),u=m*g,d=m*h,f=p,e.face===fb.FRONT?(o=Math.atan2(Math.hypot(d,f),u),a=gb(o,f,d)):e.face===fb.RIGHT?(o=Math.atan2(Math.hypot(u,f),d),a=gb(o,f,-u)):e.face===fb.BACK?(o=Math.atan2(Math.hypot(d,f),-u),a=gb(o,f,-d)):e.face===fb.LEFT?(o=Math.atan2(Math.hypot(u,f),-d),a=gb(o,f,u)):o=a=0,Math.abs(a)<=q?l=Y.AREA_0:a>q&&a<=K+q?(l=Y.AREA_1,a-=K):a>K+q||a<=-(K+q)?(l=Y.AREA_2,a=a>=0?a-Math.PI:a+Math.PI):(l=Y.AREA_3,a+=K)}return c=Math.atan(12/Math.PI*(a+Math.acos(Math.sin(a)*Math.cos(q))-K)),s=Math.sqrt(2*Math.sin(o/2)**2/(Math.cos(c)*Math.cos(c))/(1-Math.cos(Math.atan(1/Math.cos(a))))),l===Y.AREA_1?c+=K:l===Y.AREA_2?c+=Math.PI:l===Y.AREA_3&&(c+=1.5*Math.PI),n.x=s*Math.cos(c),n.y=s*Math.sin(c),n.x=n.x*e.a+e.x0,n.y=n.y*e.a+e.y0,t}function hb(e,t){var n=0,r=0,i,a,o,s,c,l,u,d,f=0;t.x=(t.x-e.x0)/e.a,t.y=(t.y-e.y0)/e.a,i=Math.atan2(t.y,t.x),t.x>=0&&t.x>=Math.abs(t.y)?f=Y.AREA_0:t.y>=0&&t.y>=Math.abs(t.x)?(f=Y.AREA_1,i-=K):t.x<0&&-t.x>=Math.abs(t.y)?(f=Y.AREA_2,i=i<0?i+Math.PI:i-Math.PI):(f=Y.AREA_3,i+=K),d=Math.PI/12*Math.tan(i),s=Math.sin(d)/(Math.cos(d)-1/Math.sqrt(2)),c=Math.atan(s),a=Math.cos(i),o=Math.hypot(t.x,t.y);let p=a*a*o*o*(1-Math.cos(Math.atan(1/Math.cos(c))));if(l=1-p,l<-1?l=-1:l>1&&(l=1),e.face===fb.TOP)u=2*Math.asin(Math.sqrt(Math.min(1,p/2))),r=K-u,n=f===Y.AREA_0?c+K:f===Y.AREA_1?c<0?c+Math.PI:c-Math.PI:f===Y.AREA_2?c-K:c;else if(e.face===fb.BOTTOM)u=2*Math.asin(Math.sqrt(Math.min(1,p/2))),r=u-K,n=f===Y.AREA_0?-c+K:f===Y.AREA_1?-c:f===Y.AREA_2?-c-K:c<0?-c-Math.PI:-c+Math.PI;else{var m=l,h,g;let t=Math.sqrt(Math.max(0,p*(2-p)));g=t*Math.sin(c),h=t*Math.cos(c),f===Y.AREA_1?(d=h,h=-g,g=d):f===Y.AREA_2?(h=-h,g=-g):f===Y.AREA_3&&(d=h,h=g,g=-d),e.face===fb.RIGHT?(d=m,m=-h,h=d):e.face===fb.BACK?(m=-m,h=-h):e.face===fb.LEFT&&(d=m,m=h,h=-d),r=Math.atan2(g,Math.hypot(m,h)),n=Math.atan2(h,m),e.face===fb.RIGHT?n=_b(n,-K):e.face===fb.BACK?n=_b(n,-Math.PI):e.face===fb.LEFT&&(n=_b(n,+K))}return e.es!==0&&(r=Math.atan2(Math.sin(r),e.one_minus_f_squared*Math.cos(r))),n+=e.long0,t.x=n,t.y=r,t}function gb(e,t,n){return e===0?0:Math.atan2(t,n)}function _b(e,t){var n=e+t;return n<-Math.PI?n+=Fh:n>+Math.PI&&(n-=Fh),n}function vb(e,t={}){let n={...e,face:0,one_minus_f:0,one_minus_f_squared:0,...t};return pb(n),n}var yb={name:`qsc`,aliases:[`Quadrilateralized Spherical Cube`,`Quadrilateralized_Spherical_Cube`],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`],create(e){let t=J_(e),n=e.primeMeridian??0,r=vb(t),i=X_(`qsc`,e,r,mb,hb),a=U(e.parameters,`x_0`,0),o=U(e.parameters,`y_0`,0);return{...i,longitudeOrigin:t.long0,getRenderingProfile(s){if(s)return Tm(e=>{let n=e=>t.es?Math.atan((1-t.es)*Math.tan(e)):e,i=V(e[0][0]-t.long0,n(e[0][1]),e[1][0]-t.long0,n(e[1][1])),s=Og(r.face===5?[0,0,1]:r.face===6?[0,0,-1]:[1,0,0],i)[0],c=t.a*Math.sqrt((1-s)/(.5*(1-Math.SQRT1_2)));return Nm([a-c,a+c],[o-c,o+c])},s,t.long0,n);let c=[[a-t.a,o-t.a,0],[a+t.a,o+t.a,0]],l=zm(e.parameters,n)().normalize,u=Ep(e=>{let[n,r]=i.forward(e.x,e.y);Math.abs(n-a)<=t.a&&Math.abs(r-o)<=t.a||([e.x,e.y]=i.inverse(a+Math.max(-t.a,Math.min(t.a,n-a)),o+Math.max(-t.a,Math.min(t.a,r-o))))},n);return{bounds:c,normalize(e){l(e),u(e)}}}}}},bb=[[1,22199e-21,-715515e-10,31103e-10],[.9986,-482243e-9,-24897e-9,-13309e-10],[.9954,-83103e-8,-448605e-10,-9.86701e-7],[.99,-.00135364,-59661e-9,36777e-10],[.9822,-.00167442,-449547e-11,-572411e-11],[.973,-.00214868,-903571e-10,1.8736e-8],[.96,-.00305085,-900761e-10,164917e-11],[.9427,-.00382792,-653386e-10,-26154e-10],[.9216,-.00467746,-10457e-8,481243e-11],[.8962,-.00536223,-323831e-10,-543432e-11],[.8679,-.00609363,-113898e-9,332484e-11],[.835,-.00698325,-640253e-10,9.34959e-7],[.7986,-.00755338,-500009e-10,9.35324e-7],[.7597,-.00798324,-35971e-9,-227626e-11],[.7186,-.00851367,-701149e-10,-86303e-10],[.6732,-.00986209,-199569e-9,191974e-10],[.6213,-.010418,883923e-10,624051e-11],[.5722,-.00906601,182e-6,624051e-11],[.5322,-.00677797,275608e-9,624051e-11]],xb=[[-520417e-23,.0124,121431e-23,-845284e-16],[.062,.0124,-1.26793e-9,422642e-15],[.124,.0124,5.07171e-9,-1.60604e-9],[.186,.0123999,-1.90189e-8,6.00152e-9],[.248,.0124002,7.10039e-8,-2.24e-8],[.31,.0123992,-2.64997e-7,8.35986e-8],[.372,.0124029,9.88983e-7,-3.11994e-7],[.434,.0123893,-369093e-11,-4.35621e-7],[.4958,.0123198,-102252e-10,-3.45523e-7],[.5571,.0121916,-154081e-10,-5.82288e-7],[.6176,.0119938,-241424e-10,-5.25327e-7],[.6769,.011713,-320223e-10,-5.16405e-7],[.7346,.0113541,-397684e-10,-6.09052e-7],[.7903,.0109107,-489042e-10,-104739e-11],[.8435,.0103431,-64615e-9,-1.40374e-9],[.8936,.00969686,-64636e-9,-8547e-9],[.9394,.00840947,-192841e-9,-42106e-10],[.9761,.00616527,-256e-6,-42106e-10],[1,.00328947,-319159e-9,-42106e-10]];bb=bb.map(e=>e.map(Math.fround)),xb=xb.map(e=>e.map(Math.fround));var Sb=.8487,Cb=1.3523,wb=Lh/5,Tb=1/wb,Eb=18,Db=function(e,t){return e[0]+t*(e[1]+t*(e[2]+t*e[3]))},Ob=function(e,t){return e[1]+t*(2*e[2]+t*3*e[3])};function kb(e,t,n,r,i){for(var a=n;i;--i){var o=(Db(e,a)-t)/Ob(e,a);if(a-=o,Math.abs(o)<r)break}return a}function Ab(e){e.x0=e.x0||0,e.y0=e.y0||0,e.long0=e.long0||0,e.es=0}function jb(e,t){var n=J(t.x-e.long0,e.over),r=Math.abs(t.y),i=Math.floor(r*wb+1e-15);i<0?i=0:i>=Eb&&(i=Eb),r=Lh*(r-Tb*i);var a=Db(bb[i],r)*n,o=Db(xb[i],r);return t.y<0&&(o=-o),t.x=a*e.a*Sb+e.x0,t.y=o*e.a*Cb+e.y0,t}function Mb(e,t){var n=t.y,r=t;r.x=(r.x-e.x0)/(e.a*Sb),r.y=Math.abs(n-e.y0)/(e.a*Cb);for(let t=0;t<=Eb;t++)if(Math.abs(r.y-xb[t][0])<=8*2**-52)return r.x=J(r.x/bb[t][0]+e.long0,e.over),r.y=(n<e.y0?-1:1)*t*5*Ih,r;if(r.y>=1)r.x/=bb[Eb][0],r.y=n<0?-K:K;else{var i=Math.floor(r.y*Eb);for(i<0?i=0:i>=Eb&&(i=Eb-1);;)if(xb[i][0]>r.y)--i;else if(xb[i+1][0]<=r.y)++i;else break;var a=xb[i],o=5*(r.y-a[0])/(xb[i+1][0]-a[0]);o=kb(a,r.y,o,Ph,100),r.x/=Db(bb[i],o),r.y=(5*i+o)*Ih,n<0&&(r.y=-r.y)}return r.x=J(r.x+e.long0,e.over),r}function Nb(e,t={}){let n={...e,...t};return Ab(n),n}var Pb={name:`robin`,aliases:[`Robinson`],parameters:[`lon_0`,`x_0`,`y_0`],create(e){let t=J_(e),n=X_(`robin`,e,Nb(t),jb,Mb);return Dm(n,V(t.long0-Math.PI,-Math.PI/2,t.long0+Math.PI,Math.PI/2),e=>Fm(n.forward,e,t.long0,t.over),t.primeMeridian,t.over)}},Fb={name:`sinu`,aliases:[`Sinusoidal`],parameters:[`lon_0`,`x_0`,`y_0`],create(e){let t=J_(e),n=X_(`sinu`,e,Tv(t),Cv,wv);return Dm(n,V(t.long0-Math.PI,-Math.PI/2,t.long0+Math.PI,Math.PI/2),e=>Fm(n.forward,e,t.long0,t.over),t.primeMeridian,t.over)}};function Ib(e){e.k0||=1;var t=e.lat0;e.lambda0=e.long0;var n=Math.sin(t),r=e.a,i=1/e.rf,a=2*i-i**2;e.e=Math.sqrt(a);var o=e.e;e.R=e.k0*r*Math.sqrt(1-a)/(1-a*n**2),e.alpha=Math.sqrt(1+a/(1-a)*Math.cos(t)**4),e.b0=Math.asin(n/e.alpha);var s=Math.log(Math.tan(Math.PI/4+e.b0/2)),c=Math.log(Math.tan(Math.PI/4+t/2)),l=Math.log((1+o*n)/(1-o*n));e.K=s-e.alpha*c+e.alpha*o/2*l}function Lb(e,t){let n=e.e*Math.sin(t.y),r=2*Math.atan(Math.exp(e.alpha*(Math.log(Math.tan(Math.PI/4+t.y/2))-e.e/2*Math.log((1+n)/(1-n)))+e.K))-Math.PI/2,i=e.alpha*(t.x-e.lambda0),a=Math.cos(r),o=Math.asin(Math.cos(e.b0)*Math.sin(r)-Math.sin(e.b0)*a*Math.cos(i)),s=Math.asin(a*Math.sin(i)/Math.cos(o));return t.x=e.x0+e.R*s,t.y=e.y0+e.R*Math.log(Math.tan(Math.PI/4+o/2)),t}function Rb(e,t){let n=(t.x-e.x0)/e.R,r=2*(Math.atan(Math.exp((t.y-e.y0)/e.R))-Math.PI/4),i=Math.asin(Math.cos(e.b0)*Math.sin(r)+Math.sin(e.b0)*Math.cos(r)*Math.cos(n)),a=Math.asin(Math.cos(r)*Math.sin(n)/Math.cos(i)),o=(e.K-Math.log(Math.tan(Math.PI/4+i/2)))/e.alpha;for(let n=0;n<6;n++){let n=e.e*Math.sin(i),r=(o+Math.log(Math.tan(Math.PI/4+i/2))-e.e/2*Math.log((1+n)/(1-n)))*(1-n*n)*Math.cos(i)/(1-e.es);if(i-=r,Math.abs(r)<1e-10)return t.x=e.lambda0+a/e.alpha,t.y=i,t}return null}function zb(e,t={}){let n={...e,lambda0:0,rf:0,R:0,alpha:0,b0:0,K:0,...t};return Ib(n),n}var Bb={name:`somerc`,aliases:[],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`,`k`,`k_0`],create(e){let t=J_(e),n=zb(t,{rf:t.a===t.b?1/0:1/(1-t.b/t.a)});return Dm(X_(`somerc`,e,n,Lb,Rb),V(t.long0-Math.PI/18,Math.max(-Math.PI/2+1e-8,t.lat0-Math.PI/18),t.long0+Math.PI/18,Math.min(Math.PI/2-1e-8,t.lat0+Math.PI/18)),t=>W_(Y_(n,e),t),t.primeMeridian,t.over)}},Vb={N_POLE:0,S_POLE:1,EQUIT:2,OBLIQ:3};function Hb(e){if(Math.abs(Math.abs(e.lat0)-K)<1e-10?e.mode=e.lat0<0?Vb.S_POLE:Vb.N_POLE:Math.abs(e.lat0)<1e-10?e.mode=Vb.EQUIT:(e.mode=Vb.OBLIQ,e.sinph0=Math.sin(e.lat0),e.cosph0=Math.cos(e.lat0)),e.pn1=e.h/e.a,e.pn1<=0||e.pn1>1e10)throw Error(`Invalid height`);e.p=1+e.pn1,e.rp=1/e.p,e.h1=1/e.pn1,e.pfact=(e.p+1)*e.h1,e.es=0;var t=e.tilt,n=e.azi;e.cg=Math.cos(n),e.sg=Math.sin(n),e.cw=Math.cos(t),e.sw=Math.sin(t)}function Ub(e,t){t.x-=e.long0;var n=Math.sin(t.y),r=Math.cos(t.y),i=Math.cos(t.x),a,o;switch(e.mode){case Vb.OBLIQ:o=e.sinph0*n+e.cosph0*r*i;break;case Vb.EQUIT:o=r*i;break;case Vb.S_POLE:o=-n;break;case Vb.N_POLE:o=n;break}switch(o=e.pn1/(e.p-o),a=o*r*Math.sin(t.x),e.mode){case Vb.OBLIQ:o*=e.cosph0*n-e.sinph0*r*i;break;case Vb.EQUIT:o*=n;break;case Vb.N_POLE:o*=-(r*i);break;case Vb.S_POLE:o*=r*i;break}var s=o*e.cg+a*e.sg,c=1/(s*e.sw*e.h1+e.cw);return a=(a*e.cg-o*e.sg)*e.cw*c,o=s*c,t.x=a*e.a,t.y=o*e.a,t}function Wb(e,t){t.x/=e.a,t.y/=e.a;var n=t.x,r=t.y,i,a,o=1/(e.pn1-t.y*e.sw);i=e.pn1*t.x*o,a=e.pn1*t.y*e.cw*o,t.x=i*e.cg+a*e.sg,t.y=a*e.cg-i*e.sg;var s=r_(t.x,t.y);if(Math.abs(s)<1e-10)n=0,r=e.lat0;else{var c,l=1-s*s*e.pfact;switch(l=(e.p-Math.sqrt(l))/(e.pn1/s+s/e.pn1),c=Math.sqrt(1-l*l),e.mode){case Vb.OBLIQ:r=Math.asin(c*e.sinph0+t.y*l*e.cosph0/s),t.y=(c-e.sinph0*Math.sin(r))*s,t.x*=l*e.cosph0;break;case Vb.EQUIT:r=Math.asin(t.y*l/s),t.y=c*s,t.x*=l;break;case Vb.N_POLE:r=Math.asin(c),t.y=-t.y;break;case Vb.S_POLE:r=-Math.asin(c);break}n=Math.atan2(t.x,t.y)}return t.x=n+e.long0,t.y=r,t}function Gb(e,t={}){let n={...e,mode:0,sinph0:0,cosph0:0,pn1:0,h:0,p:0,rp:0,h1:0,pfact:0,tilt:0,azi:0,cg:0,sg:0,cw:0,sw:0,...t};return Hb(n),n}var Kb={name:`tpers`,aliases:[`Tilted_Perspective`],parameters:[`lon_0`,`x_0`,`y_0`,`lat_0`,`h`,`tilt`,`azi`],create(e){let t=J_(e),n=U(e.parameters,`h`,1e5),r=U(e.parameters,`tilt`,0)*Math.PI/180,i=U(e.parameters,`azi`,0)*Math.PI/180;if(Math.abs(r)>=Math.PI/2)throw Error(`Perspective tilt must be between -90 and 90 degrees`);let a=Gb(t,{h:n,tilt:r,azi:i}),o=1+n/t.a,s=Math.acos(1/o),c=Math.abs(r),l=o*Math.cos(c)<1?c-Math.acos(o*Math.cos(c)):s,u=Math.min(s,l)*.9999999999;return jg(X_(`tpers`,e,a,Ub,Wb,Z_(t,1/(1+n/t.a))),t,u,(n,a)=>Lg(Y_(t,e),o,r,i,n,a),s)}};function qb(e){e.R=e.a}function Jb(e,t){var n=t.x,r=t.y,i=J(n-e.long0,e.over),a,o;if(Math.abs(r)<=1e-10)return a=e.x0+e.R*i,o=e.y0,t.x=a,t.y=o,t;var s=bv(2*Math.abs(r/Math.PI));if(Math.abs(i)<=1e-10||Math.abs(Math.abs(r)-K)<=1e-10)return a=e.x0,o=r>=0?e.y0+Math.PI*e.R*Math.tan(.5*s):e.y0+Math.PI*e.R*-Math.tan(.5*s),t.x=a,t.y=o,t;var c=.5*Math.abs(Math.PI/i-i/Math.PI),l=c*c,u=Math.sin(s),d=Math.cos(s)/(u-2*Math.sin(s/2)**2),f=d*d,p=d*(2/u-1),m=p*p,h=Math.sqrt(l*(d-m)*(d-m)-(m+l)*(f-m)),g=Math.PI*e.R*(m-f)/(h-c*(d-m));i<0&&(g=-g),a=e.x0+g;var _=l+d;return g=Math.PI*e.R*(l*(2*d-1)+f)/(p*_+c*Math.sqrt((m+l)*(l+1)-_*_)),o=r>=0?e.y0+g:e.y0-g,t.x=a,t.y=o,t}function Yb(e,t){var n,r,i,a,o,s,c,l,u,d,f,p,m;return t.x-=e.x0,t.y-=e.y0,Math.abs(t.y)<1e-10?(t.x=J(e.long0+t.x/e.R,e.over),t.y=0,t):(f=Math.PI*e.R,i=t.x/f,a=t.y/f,o=i*i+a*a,s=-Math.abs(a)*(1+o),c=s-2*a*a+i*i,l=-2*s+1+2*a*a+o*o,m=a*a/l+(2*c*c*c/l/l/l-9*s*c/l/l)/27,u=(s-c*c/3/l)/l,d=2*Math.sqrt(-u/3),f=3*m/u/d,Math.abs(f)>1&&(f=f>=0?1:-1),p=Math.acos(f)/3,r=t.y>=0?(-d*Math.cos(p+Math.PI/3)-c/3/l)*Math.PI:-(-d*Math.cos(p+Math.PI/3)-c/3/l)*Math.PI,n=Math.abs(i)<1e-10?e.long0:J(e.long0+2*Math.PI*i/(Math.sqrt(1+2*(i*i-a*a)+o*o)+1-o),e.over),t.x=n,t.y=r,t)}function Xb(e,t={}){let n={...e,R:0,...t};return qb(n),n}var Zb={name:`vandg`,aliases:[`Van_der_Grinten_I`,`VanDerGrinten`,`Van_der_Grinten`],parameters:[`lon_0`,`x_0`,`y_0`],create(e){let t=J_(e),n=X_(`vandg`,e,Xb(t),Jb,Yb);return Dm(n,V(t.long0-Math.PI,-Math.PI/2,t.long0+Math.PI,Math.PI/2),e=>Lm(n.forward,e,t.long0,t.over),t.primeMeridian,t.over)}},Qb=[`o_proj`,`o_alpha`,`o_lon_c`,`o_lat_c`,`o_lon_p`,`o_lat_p`,`o_lon_1`,`o_lat_1`,`o_lon_2`,`o_lat_2`],$b=e=>e.toLowerCase().replace(/[ _-]/g,``),ex=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),tx=(e,t)=>U(e,t,0)*Math.PI/180;function nx(e){let t=[[`o_alpha`,`o_lon_c`,`o_lat_c`],[`o_lat_p`,`o_lon_p`],[`o_lon_1`,`o_lat_1`,`o_lon_2`,`o_lat_2`]],n=t.find(t=>t.some(t=>ex(e,t)));if(!n)throw Error(`Oblique transformation requires a rotation parameter set`);for(let t of n){if(!ex(e,t))throw Error(`Oblique transformation requires `+t);if(t.includes(`lat`)&&Math.abs(tx(e,t))>Math.PI/2)throw Error(`Invalid rotation latitude: `+t)}if(n===t[0]){let t=tx(e,`o_alpha`),n=tx(e,`o_lon_c`),r=tx(e,`o_lat_c`);if(Math.abs(r)>=Math.PI/2-1e-10)throw Error(`Rotation center must be away from the poles`);return{lamp:n+Math.atan2(-Math.cos(t),-Math.sin(t)*Math.sin(r)),phip:Math.asin(Math.cos(r)*Math.sin(t))}}if(n===t[1])return{lamp:tx(e,`o_lon_p`),phip:tx(e,`o_lat_p`)};let r=tx(e,`o_lon_1`),i=tx(e,`o_lat_1`),a=tx(e,`o_lon_2`),o=tx(e,`o_lat_2`);if(Math.abs(i)>=Math.PI/2-1e-10||Math.abs(o)>=Math.PI/2-1e-10||Math.abs(i)<1e-10||Math.abs(i-o)<1e-10)throw Error(`Invalid new-equator reference points`);let s=Math.atan2(Math.cos(i)*Math.sin(o)*Math.cos(r)-Math.sin(i)*Math.cos(o)*Math.cos(a),Math.sin(i)*Math.cos(o)*Math.sin(a)-Math.cos(i)*Math.sin(o)*Math.sin(r));return{lamp:s,phip:Math.atan(-Math.cos(s-r)/Math.tan(i))}}function rx(e){let t=e===`longlat`;if(!t&&[`obtran`,`geocent`].includes($b(e.name)))throw Error(`Cannot wrap a composite or geocentric projection`);return{name:`ob_tran`,aliases:[`General Oblique Transformation`,`General_Oblique_Transformation`],parameters:[...Qb,`lon_0`,...t?[]:e.parameters],flags:t?[]:e.flags,create(n){let{parameters:r}=n,i=r.o_proj,a=t?[`longlat`,`latlong`,`lonlat`,`latlon`,`identity`]:[e.name,...e.aliases||[]];if(i&&!a.map($b).includes($b(i)))throw new Hp(`missing-plugin`,`Oblique transformation dependency does not match +o_proj=`+i);let{lamp:o,phip:s}=nx(r),c=Math.cos(s),l=Math.sin(s),u=Math.abs(s)>1e-10,d=tx(r,`lon_0`),f=ex(r,`over`),p={...r,proj:t?`longlat`:i||e.name,lon_0:`0`};for(let e of Qb)delete p[e];let m=t?Fp(e=>{e.x*=180/Math.PI,e.y*=180/Math.PI},e=>{e.x*=Math.PI/180,e.y*=Math.PI/180}):e.create({...n,parameters:Object.freeze(p),primeMeridian:0}),h=Ip(m,!1),g=Ip(m,!0),_=e=>Math.asin(Math.max(-1,Math.min(1,e))),v=e=>{let t=e.x,n=e.y,r=qp(t-d,f),i=Math.cos(r),a=Math.sin(n),s=Math.cos(n),p=qp(Math.atan2(s*Math.sin(r),u?l*s*i+c*a:a)+o),m=_(u?l*a-c*s*i:-s*i);e.x=p,e.y=m},y=e=>{let t=e.x,n=e.y,r=t-o,i=Math.cos(r),a=Math.sin(n),s=Math.cos(n),f=Math.atan2(s*Math.sin(r),u?l*s*i-c*a:-a),p=_(u?l*a+c*s*i:s*i);e.x=qp(f+d),e.y=p},b=Fp(e=>{v(e),h(e)},e=>{g(e),y(e)}),x=t?zm(p):m.getRenderingProfile?.bind(m);if(!x)return b;let S=(e,r)=>{let i=r&&Tm(()=>e.bounds,r,d,n.primeMeridian??0,f),a=Ep(t=>{let n=t.x,r=t.y;v(t);let i=t.x*180/Math.PI,a=t.y*180/Math.PI,o={x:i,y:a,z:t.z};if(e.normalize?.(o),o.x===i&&o.y===a){t.x=n,t.y=r;return}t.x=o.x*Math.PI/180,t.y=o.y*Math.PI/180,y(t),f&&(t.x+=Math.round((n-t.x)/(2*Math.PI))*2*Math.PI)},n.primeMeridian??0);return{get bounds(){let n=e.bounds,r=e=>[e[0]*180/Math.PI,e[1]*180/Math.PI,e[2]];return t?[r(n[0]),r(n[1])]:n},normalize(e){i?.normalize(e),a(e)}}};return{...b,longitudeOrigin:d,getRenderingProfile(e){if(!e)return S(x());let t=xp(e,n.primeMeridian??0,d),r=V(t[0][0]-d,t[0][1],t[1][0]-d,t[1][1]),i=Og(u?[-c,0,l]:[-1,0,0],r),a=u?[l,0,c]:[0,0,1],s=Og(a,r)[0]>0?kg([0,1,0],a,0,r).map(Math.atan):[-Math.PI,Math.PI];return S(x(Sp(V(s[0]+o,_(i[0]),s[1]+o,_(i[1])))),e)}}}}}function ix(e){if(!e||typeof e!=`object`||Array.isArray(e))throw Error(`Expected a CRS object`);return e}function ax(e){return Array.isArray(e)?e:[]}function ox(e){return String(e||``).toLowerCase().replace(/[^a-z0-9]/g,``)}function sx(e){if(typeof e!=`number`||!Number.isFinite(e))throw Error(`Expected a finite CRS parameter`);return e}function cx(e,t){if(e===void 0)return t;if(typeof e==`object`){let t=sx(ix(e).conversion_factor);if(t<=0)throw Error(`Unit conversion factor must be positive`);return t}let n={metre:1,meter:1,degree:Gp,radian:1,grad:Math.PI/200,gon:Math.PI/200,foot:.3048,ussurveyfoot:1200/3937,kilometre:1e3,arcsecond:Gp/3600,partspermillion:1e-6,unity:1}[ox(e)];return n||H(`Unsupported CRS unit: `+String(e)),n}var lx={hotineobliquemercator:`omerc`,hotineobliquemercatorvarianta:`omerc`,hotineobliquemercatorvariantb:`omerc`,hotineobliquemercatorazimuthnaturalorigin:`omerc`,hotineobliquemercatorazimuthcenter:`omerc`,obliquemercator:`omerc`,krovak:`krovak`,krovaknorthorientated:`krovak`,quadrilateralizedsphericalcube:`qsc`,transversemercator:`tmerc`,transversemercatorsouthorientated:`unsupported-south-tmerc`,mercator:`merc`,mercator1sp:`merc`,mercator2sp:`merc`,mercatorvarianta:`merc`,mercatorvariantb:`merc`,mercatorauxiliarysphere:`webmerc`,popularvisualisationpseudomercator:`webmerc`,lambertconformalconic:`lcc`,lambertconformalconic1sp:`lcc`,lambertconformalconic2sp:`lcc`,lambertconicconformal1sp:`lcc`,lambertconicconformal2sp:`lcc`,albers:`aea`,albersconicequalarea:`aea`,albersequalarea:`aea`,equidistantconic:`eqdc`,lambertazimuthalequalarea:`laea`,stereographic:`stere`,stereographicnorthpole:`sterea`,stereographicsouthpole:`stere`,polarstereographic:`stere`,polarstereographicvarianta:`stere`,polarstereographicvariantb:`stere`,obliquestereographic:`sterea`,doublestereographic:`sterea`,azimuthalequidistant:`aeqd`,modifiedazimuthalequidistant:`aeqd`,equidistantcylindrical:`eqc`,equidistantcylindricalspherical:`eqc`,equirectangular:`eqc`,platecarree:`eqc`,bonne:`bonne`,cassinisoldner:`cass`,cassini:`cass`,cylindricalequalarea:`cea`,lambertcylindricalequalarea:`cea`,eckertvi:`eck6`,equalearth:`eqearth`,millercylindrical:`mill`,mollweide:`moll`,robinson:`robin`,sinusoidal:`sinu`,vandergrinten:`vandg`,vandergrinteni:`vandg`,gnomonic:`gnom`,orthographic:`ortho`,polyconic:`poly`,americanpolyconic:`poly`,newzealandmapgrid:`nzmg`,gaussschreibertransversemercator:`gstmerc`},ux={centralmeridian:`lon_0`,longitudeoforigin:`lon_0`,longitudeofcenter:`lon_0`,longitudeofnaturalorigin:`lon_0`,longitudeoffalseorigin:`lon_0`,longitudeofprojectioncentre:`lon_0`,straightverticalpolelongitude:`lon_0`,longitudeoforiginmeridian:`lon_0`,latitudeoforigin:`lat_0`,latitudeofcenter:`lat_0`,latitudeofnaturalorigin:`lat_0`,latitudeoffalseorigin:`lat_0`,latitudeofprojectioncentre:`lat_0`,standardparallel1:`lat_1`,latitudeof1ststandardparallel:`lat_1`,standardparallel2:`lat_2`,latitudeof2ndstandardparallel:`lat_2`,latitudeofstandardparallel:`lat_ts`,scalefactor:`k_0`,scalefactoratnaturalorigin:`k_0`,scalefactoratprojectionorigin:`k_0`,falseeasting:`x_0`,falsenorthing:`y_0`,eastingatfalseorigin:`x_0`,northingatfalseorigin:`y_0`},dx={omerc:{longitudeofcenter:`lonc`,longitudeofprojectioncentre:`lonc`,azimuth:`alpha`,azimuthatprojectioncentre:`alpha`,rectifiedgridangle:`gamma`,anglefromrectifiedtoskewgrid:`gamma`,scalefactoratprojectioncentre:`k_0`,eastingatprojectioncentre:`x_0`,northingatprojectioncentre:`y_0`},krovak:{azimuth:`alpha`,colatitudeofconeaxis:`alpha`,pseudostandardparallel1:`lat_ts`,latitudeofpseudostandardparallel:`lat_ts`,scalefactoronpseudostandardparallel:`k_0`}},fx={east:`e`,west:`w`,north:`n`,south:`s`,up:`u`,down:`d`,geocentricx:`e`,geocentricy:`n`,geocentricz:`u`};function px(e,t){let n=String(e.type),r=mx(e.bbox);if(n===`CompoundCRS`){t.mode!==`horizontal`&&H(`CompoundCRS requires explicit horizontal extraction`);let n=ax(e.components).map(ix).filter(e=>[`ProjectedCRS`,`GeographicCRS`,`GeodeticCRS`,`BoundCRS`].includes(String(e.type)));if(n.length!==1)throw Error(`CompoundCRS requires exactly one horizontal component`);let i=px(n[0],t);return{...i,areaOfUse:r??i.areaOfUse,lossy:!0}}if(n===`BoundCRS`){let n=px(ix(e.source_crs),t),i=px(ix(e.target_crs),t);(i.parameters.datum!==`WGS84`||![`longlat`,`geocent`].includes(i.parameters.proj)||Number(i.parameters.pm||0)!==0||i.parameters.towgs84||Number(i.parameters.a)!==6378137||!(Math.abs(Number(i.parameters.rf)-298.257223563)<=1e-9||Math.abs(Number(i.parameters.b)-6356752.314245179)<=1e-6))&&H(`BoundCRS requires a WGS84 target`);let a=ix(e.transformation),o=ox(ix(a.method).name),s=o===`geocentrictranslations`||/^geocentrictranslationsgeog[23]ddomain$/.test(o),c=/^positionvector(?:transformation)?(?:geog[23]ddomain|geocentricdomain)?$/.test(o),l=/^coordinateframe(?:rotation)?(?:geog[23]ddomain|geocentricdomain)?$/.test(o);!s&&!c&&!l&&H(`Unsupported BoundCRS transformation: `+o);let u=[`xaxistranslation`,`yaxistranslation`,`zaxistranslation`,`xaxisrotation`,`yaxisrotation`,`zaxisrotation`,`scaledifference`],d=Array(s?3:7).fill(void 0);for(let e of ax(a.parameters)){let t=ix(e),n=u.indexOf(ox(t.name));(n<0||n>=d.length||d[n]!==void 0)&&H(`Unsupported or duplicate Helmert parameter: `+String(t.name));let r=n<3?1:n<6?Gp/3600:1e-6;d[n]=sx(t.value)*cx(t.unit,r)/r*(l&&n>=3&&n<6?-1:1)}if(d.some(e=>e===void 0))throw Error(`Incomplete BoundCRS Helmert transformation`);let f={...n.parameters,towgs84:d.join(`,`)};return delete f.datum,{...n,parameters:f,areaOfUse:r??n.areaOfUse}}[`ProjectedCRS`,`GeographicCRS`,`GeodeticCRS`].includes(n)||H(`Unsupported CRS type: `+n);let i=n===`ProjectedCRS`?ix(e.base_crs):e,a=ix(i.datum||i.datum_ensemble);(a.type===`DynamicGeodeticReferenceFrame`||a.frame_reference_epoch!==void 0||e.coordinate_epoch!==void 0)&&H(`Time-dependent datum transformations are not implemented`);let o=ix(a.ellipsoid),s=sx(o.semi_major_axis??o.radius),c={proj:`longlat`,a:String(s*cx(o.unit,1))};if(o.inverse_flattening!==void 0)c.rf=String(sx(o.inverse_flattening));else if(o.semi_minor_axis!==void 0)c.b=String(sx(o.semi_minor_axis)*cx(o.unit,1));else if(o.radius!==void 0)c.b=c.a;else throw Error(`Ellipsoid requires inverse flattening or semi-minor axis`);let l=$p(t),u=String(a.name||``),d=ox(u),f=Object.keys(l),p=f.find(e=>Qp(e)===Qp(u)),m=p?[p]:f.filter(e=>ox(e)===d||ox(e)===d.replace(/^d/,``)),h=m[0],g=l[h];if(g&&m.some(e=>{let t=l[e];return t.ellipse!==g.ellipse||t.towgs84!==g.towgs84||t.nadgrids!==g.nadgrids}))throw Error(`Ambiguous structured datum name: `+u);if(d&&(c.datum=h||u),h&&Qp(h)===`wgs84`&&(c.datum=`WGS84`),h&&[`nad83`,`northamericandatum1983`].includes(Qp(h))&&(c.datum=`NAD83`),!h){[`wgs84`,`worldgeodeticsystem1984`,`worldgeodeticsystem1984ensemble`,`dwgs1984`,`wgs1984`].includes(d)&&(c.datum=`WGS84`),[`nad83`,`northamericandatum1983`,`dnorthamerican1983`].includes(d)&&(c.datum=`NAD83`),[`nad27`,`northamericandatum1927`,`dnorthamerican1927`].includes(d)&&(c.datum=`NAD27`);let e={newzealand1949:`nzgd49`,belge1972:`rnb72`}[d.replace(/^d/,``)];e&&(c.datum=e)}if(n===`ProjectedCRS`&&i.id){let e=ix(i.id),t=String(e.authority)+`_`+String(e.code);Object.prototype.hasOwnProperty.call(l,t)&&(c.datum=t)}a.towgs84!==void 0&&(c.towgs84=ax(a.towgs84).map(sx).join(`,`),delete c.datum);let _=e.coordinate_system?ix(e.coordinate_system):{},v=ax(_.axis).map(ix),y=ox(_.subtype)===`cartesian`&&n===`GeodeticCRS`;n!==`ProjectedCRS`&&!y&&_.subtype&&ox(_.subtype)!==`ellipsoidal`&&H(`Unsupported coordinate system subtype`),y&&(c.proj=`geocent`);let b=cx(i.angular_unit,Gp),x=cx(v[0]?.unit,n===`ProjectedCRS`||y?1:b);v[1]&&cx(v[1].unit,x)!==x&&H(`Mixed horizontal axis units are not supported`),y&&v[2]&&cx(v[2].unit,x)!==x&&H(`Mixed geocentric axis units are not supported`);let S=i.prime_meridian||a.prime_meridian;if(S){let e=ix(S);c.pm=String(sx(e.longitude)*cx(e.unit,b)/Gp)}if(n===`ProjectedCRS`){let t=ix(e.conversion),n=ox(ix(t.method).name),r=ax(t.parameters).map(ix),i=n===`stereographicnorthpole`&&!r.some(e=>ox(e.name).startsWith(`scalefactor`)),a=i?`stere`:lx[n],o=r.filter(e=>[`xscale`,`yscale`,`xyplanerotation`].includes(ox(e.name)));if(o.length){let e={xscale:-1,yscale:1,xyplanerotation:90};(a!==`krovak`||o.length!==3||new Set(o.map(e=>ox(e.name))).size!==3||o.some(t=>{let n=ox(t.name),r=n===`xyplanerotation`?cx(t.unit,b)/Gp:cx(t.unit,1);return Math.abs(sx(t.value)*r-e[n])>1e-10}))&&H(`Unsupported ESRI Krovak axis adjustment`)}(!a||a.startsWith(`unsupported`))&&H(`Unsupported projection method: `+String(ix(t.method).name)),c.proj=a===`webmerc`?`merc`:a;let s=!1;for(let e of r){let t=ox(e.name);if(o.includes(e)||t===`auxiliaryspheretype`&&a===`webmerc`&&e.value===0)continue;if(t===`semiminor`&&a===`webmerc`){if(s)throw Error(`Duplicate conversion parameter: semi_minor`);s=!0;let t=sx(e.value)*cx(e.unit,1);Math.abs(t-Number(c.a))>4*2**-52*Number(c.a)&&H(`Pseudo-Mercator semi_minor must equal the semi-major axis`);continue}let r=dx[a]?.[t]||ux[t];if(r||H(`Unsupported conversion parameter: `+String(e.name)),r===`lat_1`&&n===`stereographicnorthpole`&&!i?r=`lat_0`:r===`lat_1`&&[`merc`,`webmerc`,`eqc`,`stere`,`cea`].includes(a)&&(r=`lat_ts`),c[r]!==void 0)throw Error(`Duplicate conversion parameter: `+r);if([`merc`,`webmerc`].includes(a)&&r===`lat_0`&&e.value===0)continue;let l=r.startsWith(`lat`)||r.startsWith(`lon`)||r===`alpha`||r===`gamma`,u=r===`x_0`||r===`y_0`,d=sx(e.value)*cx(e.unit,l?b:u?x:1)/(l?Gp:1);r.startsWith(`lat`)&&Math.abs(Math.abs(d)-90)<=4*2**-52*90&&(d=Math.sign(d)*90),c[r]=String(d)}if(a===`omerc`&&[`hotineobliquemercator`,`hotineobliquemercatorvarianta`,`hotineobliquemercatorazimuthnaturalorigin`].includes(n)&&(c.no_uoff=void 0),a===`omerc`&&c.lon_0!==void 0&&c.lonc!==void 0&&(Math.abs(Number(c.lon_0)-Number(c.lonc))>1e-10&&H(`Oblique Mercator central meridian conflicts with projection centre`),delete c.lon_0),n===`stereographicnorthpole`&&Math.abs(Number(c.lat_0))===90&&(c.proj=`stere`),a===`lcc`&&c.lat_1===void 0&&(c.lat_1=c.lat_0),n===`polarstereographic`&&c.lat_0!==void 0){if(c.lat_ts!==void 0)throw Error(`Duplicate polar stereographic latitude of true scale`);c.lat_ts=c.lat_0,delete c.lat_0}a===`stere`&&(n.includes(`polar`)||n===`stereographicsouthpole`||i)&&c.lat_0===void 0&&(c.lat_0=Number(c.lat_ts||90)<0?`-90`:`90`),a===`webmerc`&&(c.b=c.a,delete c.rf,c.nadgrids=`@null`)}let C=v.map(e=>hx(e,c,n===`ProjectedCRS`)).join(``);return C.length===2&&(C+=`u`),!y&&/[ud]/.test(C.slice(0,2))&&H(`Structured CRS vertical-first axes require an explicit PROJ axis definition`),C&&(c.axis=C),(n===`ProjectedCRS`||y)&&(c.to_meter=String(x)),{parameters:c,areaOfUse:r,angularUnit:n===`ProjectedCRS`||y?b:x,verticalUnit:y?1:cx(v[2]?.unit,1)}}function mx(e){let t;if(e!==void 0){let n=ix(e),r=sx(n.west_longitude),i=sx(n.south_latitude),a=sx(n.east_longitude),o=sx(n.north_latitude);if(r<-180||r>180||a<-180||a>180||i<-90||o>90||i>=o||r===a)throw Error(`Invalid CRS geographic bounding box`);t=[r,i,a,o]}return t}function hx(e,t,n){let r=String(e.direction),i=e.meridian,a=/^(north|south) along ([+-]?(?:\d+(?:\.\d*)?|\.\d+)) deg(?: (east|west))?$/i.exec(r);if(a){if(i!==void 0)throw Error(`Duplicate axis meridian`);r=a[1],i={longitude:Number(a[2])*(a[3]?.toLowerCase()===`west`?-1:1)}}if(i!==void 0){let e=Number(t.lat_0),a=e===90;(!n||t.proj!==`stere`||Math.abs(e)!==90||ox(r)!==(a?`south`:`north`))&&H(`Axis meridians require an outward-facing polar stereographic axis`);let o=ix(i).longitude,s=sx(((typeof o==`number`?sx(o):sx(ix(o).value)*cx(ix(o).unit,Gp)/Gp)-Number(t.lon_0||0))/90);Math.abs(s-Math.round(s))>1e-12&&H(`Non-cardinal axis meridians require an orientation operation`);let c=(Math.round(s)%4+4)%4;return(a?`senw`:`nesw`)[c]}let o=fx[ox(r)];return o||H(`Unsupported axis direction: `+r),o}function gx(e,...t){return e.values.filter(e=>e.type===`node`&&t.includes(e.keyword.toUpperCase()))}function _x(e,...t){return gx(e,...t)[0]}function X(e,t=0){let n=e.values[t];return n&&n.type!==`node`?n.value:void 0}function vx(e){return e?{name:X(e),conversion_factor:X(e,1)}:void 0}function yx(e,t){let n=X(e,1);if(t&&String(n).toLowerCase()===`unknown`){let t=String(X(e)).toLowerCase(),n=/^(easting|northing|westing|southing)(?:\s*\([a-z]\))?$/.exec(t);if(n)return{easting:`east`,northing:`north`,westing:`west`,southing:`south`}[n[1]]}return n}function bx(e){let t=_x(e,`MERIDIAN`);if(t)return{longitude:{value:X(t),unit:vx(_x(t,`ANGLEUNIT`))}}}function xx(e){let t=_x(e,`METHOD`,`PROJECTION`);if(!t)throw Error(`WKT conversion requires a METHOD or PROJECTION`);return _x(e,`PARAMETERFILE`)&&H(`Grid-based WKT operation is not implemented`),{method:{name:X(t)},parameters:gx(e,`PARAMETER`).map(e=>({name:X(e),value:X(e,1),unit:vx(_x(e,`ANGLEUNIT`,`LENGTHUNIT`,`SCALEUNIT`))}))}}function Sx(e){let t=e.keyword.toUpperCase();if(t===`COMPD_CS`||t===`COMPOUNDCRS`)return{type:`CompoundCRS`,components:gx(e,`PROJCS`,`PROJCRS`,`GEOGCS`,`GEOGCRS`,`GEODCRS`,`BOUNDCRS`,`VERT_CS`,`VERTCRS`).map(Sx)};if(t===`BOUNDCRS`){let t=_x(e,`SOURCECRS`),n=_x(e,`TARGETCRS`),r=_x(e,`ABRIDGEDTRANSFORMATION`);if(!t||!n||!r)throw Error(`Incomplete WKT BoundCRS`);let i=e=>{let t=e.values.find(e=>e.type===`node`);if(!t)throw Error(`Missing bound CRS component`);return t},a=xx(r),o=a.parameters;for(let e of o)String(e.name).toLowerCase()===`scale difference`&&e.unit===void 0&&(e.value=(Number(e.value)-1)*1e6);return{type:`BoundCRS`,source_crs:Sx(i(t)),target_crs:Sx(i(n)),transformation:a}}if([`VERT_CS`,`VERTCRS`].includes(t))return{type:`VerticalCRS`};let n=[`PROJCS`,`PROJCRS`,`PROJECTEDCRS`].includes(t),r=[`GEOGCS`,`GEOGCRS`,`GEODCRS`,`GEODETICCRS`,`GEOGRAPHICCRS`,`BASEGEOGCRS`,`BASEGEODCRS`,`GEOCCS`].includes(t);!n&&!r&&H(`Unsupported WKT CRS: `+t),_x(e,`DYNAMIC`,`DERIVINGCONVERSION`,`VELOCITYGRID`,`EXTENSION`)&&H(`Unsupported WKT dynamic/extension operation`);let i=_x(e,`CS`),a=t===`GEOCCS`||String(X(i||e)).toLowerCase()===`cartesian`&&!n,o=_x(e,n||a?`LENGTHUNIT`:`ANGLEUNIT`,`UNIT`),s=gx(e,`AXIS`).sort((e,t)=>Number(X(_x(e,`ORDER`)||e))-Number(X(_x(t,`ORDER`)||t))).map((e,r)=>({name:X(e),direction:t===`GEOCCS`?[`geocentricX`,`geocentricY`,`geocentricZ`][r]:yx(e,n),unit:vx(_x(e,`ANGLEUNIT`,`LENGTHUNIT`)||(!a&&!n&&/^(up|down)$/i.test(String(X(e,1)))?void 0:o)),meridian:bx(e)}));if(!s.length)for(let e of a?[`geocentricX`,`geocentricY`,`geocentricZ`]:[`east`,`north`])s.push({name:e,direction:e,unit:vx(o),meridian:void 0});let c=t===`GEOGCS`?void 0:_x(e,`ID`),l={type:n?`ProjectedCRS`:a?`GeodeticCRS`:`GeographicCRS`,name:X(e),id:c?{authority:X(c),code:X(c,1)}:void 0,coordinate_system:{subtype:n||a?`Cartesian`:`ellipsoidal`,axis:s}},u=_x(_x(e,`USAGE`)||e,`BBOX`);if(u&&(l.bbox={south_latitude:X(u,0),west_longitude:X(u,1),north_latitude:X(u,2),east_longitude:X(u,3)}),n){let t=_x(e,`GEOGCS`,`BASEGEOGCRS`,`BASEGEODCRS`,`GEODCRS`,`GEOGCRS`);if(!t)throw Error(`Projected WKT requires a base geographic CRS`);l.base_crs=Sx(t),l.conversion=xx(_x(e,`CONVERSION`)||e)}else{let t=_x(e,`DATUM`,`GEODETICDATUM`,`ENSEMBLE`);if(!t)throw Error(`WKT requires a geodetic datum`);_x(t,`EXTENSION`,`DYNAMIC`)&&H(`Unsupported datum extension`);let n=_x(t,`SPHEROID`,`ELLIPSOID`);if(!n)throw Error(`WKT datum requires an ellipsoid`);let r=_x(t,`TOWGS84`);l.datum={name:X(t),ellipsoid:{name:X(n),semi_major_axis:X(n,1),inverse_flattening:X(n,2),unit:vx(_x(n,`LENGTHUNIT`))},towgs84:r?.values.map((e,t)=>X(r,t))};let i=_x(e,`PRIMEM`);i&&(l.prime_meridian={name:X(i),longitude:X(i,1),unit:vx(_x(i,`ANGLEUNIT`)||(a?void 0:o))}),l.angular_unit=a?void 0:vx(o)}return l}var Cx={name:`wkt`,canParse:e=>T(e)===`wkt`,parse(e,t){if(typeof e!=`string`)throw Error(`Expected serialized WKT`);return px(Sx(Bi(e).root),t)}},wx={name:`projjson`,canParse:e=>T(e)===`projjson`,parse:(e,t)=>px(ix(e),t)},Tx={ch1903:{towgs84:`674.374,15.056,405.346`,ellipse:`bessel`,datumName:`swiss`},ggrs87:{towgs84:`-199.87,74.79,246.62`,ellipse:`GRS80`,datumName:`Greek_Geodetic_Reference_System_1987`},nad27:{nadgrids:`@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat`,ellipse:`clrk66`,datumName:`North_American_Datum_1927`},potsdam:{towgs84:`598.1,73.7,418.2,0.202,0.045,-2.455,6.7`,ellipse:`bessel`,datumName:`Potsdam Rauenberg 1950 DHDN`},carthage:{towgs84:`-263.0,6.0,431.0`,ellipse:`clrk80ign`,datumName:`Carthage 1934 Tunisia`},hermannskogel:{towgs84:`577.326,90.129,463.919,5.137,1.474,5.297,2.4232`,ellipse:`bessel`,datumName:`Hermannskogel`},mgi:{towgs84:`577.326,90.129,463.919,5.137,1.474,5.297,2.4232`,ellipse:`bessel`,datumName:`Militar-Geographische Institut`},osni52:{towgs84:`482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15`,ellipse:`airy`,datumName:`Irish National`},ire65:{towgs84:`482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15`,ellipse:`mod_airy`,datumName:`Ireland 1965`},rassadiran:{towgs84:`-133.63,-157.5,-158.62`,ellipse:`intl`,datumName:`Rassadiran`},nzgd49:{towgs84:`59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993`,ellipse:`intl`,datumName:`New Zealand Geodetic Datum 1949`},osgb36:{towgs84:`446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894`,ellipse:`airy`,datumName:`Ordnance Survey of Great Britain 1936`},s_jtsk:{towgs84:`589,76,480`,ellipse:`bessel`,datumName:`S-JTSK (Ferro)`},beduaram:{towgs84:`-106,-87,188`,ellipse:`clrk80`,datumName:`Beduaram`},gunung_segara:{towgs84:`-403,684,41`,ellipse:`bessel`,datumName:`Gunung Segara Jakarta`},rnb72:{towgs84:`106.869,-52.2978,103.724,-0.33657,0.456955,-1.84218,1`,ellipse:`intl`,datumName:`Reseau National Belge 1972`},EPSG_5451:{towgs84:`6.41,-49.05,-11.28,1.5657,0.5242,6.9718,-5.7649`},IGNF_LURESG:{towgs84:`-192.986,13.673,-39.309,-0.4099,-2.9332,2.6881,0.43`},EPSG_4614:{towgs84:`-119.4248,-303.65872,-11.00061,1.164298,0.174458,1.096259,3.657065`},EPSG_4615:{towgs84:`-494.088,-312.129,279.877,-1.423,-1.013,1.59,-0.748`},ESRI_37241:{towgs84:`-76.822,257.457,-12.817,2.136,-0.033,-2.392,-0.031`},ESRI_37249:{towgs84:`-440.296,58.548,296.265,1.128,10.202,4.559,-0.438`},ESRI_37245:{towgs84:`-511.151,-181.269,139.609,1.05,2.703,1.798,3.071`},EPSG_4178:{towgs84:`24.9,-126.4,-93.2,-0.063,-0.247,-0.041,1.01`},EPSG_4622:{towgs84:`-472.29,-5.63,-304.12,0.4362,-0.8374,0.2563,1.8984`},EPSG_4625:{towgs84:`126.93,547.94,130.41,-2.7867,5.1612,-0.8584,13.8227`},EPSG_5252:{towgs84:`0.023,0.036,-0.068,0.00176,0.00912,-0.01136,0.00439`},EPSG_4314:{towgs84:`597.1,71.4,412.1,0.894,0.068,-1.563,7.58`},EPSG_4282:{towgs84:`-178.3,-316.7,-131.5,5.278,6.077,10.979,19.166`},EPSG_4231:{towgs84:`-83.11,-97.38,-117.22,0.005693,-0.044698,0.044285,0.1218`},EPSG_4274:{towgs84:`-230.994,102.591,25.199,0.633,-0.239,0.9,1.95`},EPSG_4134:{towgs84:`-180.624,-225.516,173.919,-0.81,-1.898,8.336,16.71006`},EPSG_4254:{towgs84:`18.38,192.45,96.82,0.056,-0.142,-0.2,-0.0013`},EPSG_4159:{towgs84:`-194.513,-63.978,-25.759,-3.4027,3.756,-3.352,-0.9175`},EPSG_4687:{towgs84:`0.072,-0.507,-0.245,0.0183,-0.0003,0.007,-0.0093`},EPSG_4227:{towgs84:`-83.58,-397.54,458.78,-17.595,-2.847,4.256,3.225`},EPSG_4746:{towgs84:`599.4,72.4,419.2,-0.062,-0.022,-2.723,6.46`},EPSG_4745:{towgs84:`612.4,77,440.2,-0.054,0.057,-2.797,2.55`},EPSG_6311:{towgs84:`8.846,-4.394,-1.122,-0.00237,-0.146528,0.130428,0.783926`},EPSG_4289:{towgs84:`565.7381,50.4018,465.2904,-0.395026,0.330772,-1.876073,4.07244`},EPSG_4230:{towgs84:`-68.863,-134.888,-111.49,-0.53,-0.14,0.57,-3.4`},EPSG_4154:{towgs84:`-123.02,-158.95,-168.47`},EPSG_4156:{towgs84:`570.8,85.7,462.8,4.998,1.587,5.261,3.56`},EPSG_4299:{towgs84:`482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15`},EPSG_4179:{towgs84:`33.4,-146.6,-76.3,-0.359,-0.053,0.844,-0.84`},EPSG_4313:{towgs84:`-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747`},EPSG_4194:{towgs84:`163.511,127.533,-159.789`},EPSG_4195:{towgs84:`105,326,-102.5`},EPSG_4196:{towgs84:`-45,417,-3.5`},EPSG_4611:{towgs84:`-162.619,-276.959,-161.764,0.067753,-2.243648,-1.158828,-1.094246`},EPSG_4633:{towgs84:`137.092,131.66,91.475,-1.9436,-11.5993,-4.3321,-7.4824`},EPSG_4641:{towgs84:`-408.809,366.856,-412.987,1.8842,-0.5308,2.1655,-121.0993`},EPSG_4643:{towgs84:`-480.26,-438.32,-643.429,16.3119,20.1721,-4.0349,-111.7002`},EPSG_4300:{towgs84:`482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15`},EPSG_4188:{towgs84:`482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15`},EPSG_4660:{towgs84:`982.6087,552.753,-540.873,6.681627,-31.611492,-19.848161,16.805`},EPSG_4662:{towgs84:`97.295,-263.247,310.882,-1.5999,0.8386,3.1409,13.3259`},EPSG_3906:{towgs84:`577.88891,165.22205,391.18289,4.9145,-0.94729,-13.05098,7.78664`},EPSG_4307:{towgs84:`-209.3622,-87.8162,404.6198,0.0046,3.4784,0.5805,-1.4547`},EPSG_6892:{towgs84:`-76.269,-16.683,68.562,-6.275,10.536,-4.286,-13.686`},EPSG_4690:{towgs84:`221.597,152.441,176.523,2.403,1.3893,0.884,11.4648`},EPSG_4691:{towgs84:`218.769,150.75,176.75,3.5231,2.0037,1.288,10.9817`},EPSG_4629:{towgs84:`72.51,345.411,79.241,-1.5862,-0.8826,-0.5495,1.3653`},EPSG_4630:{towgs84:`165.804,216.213,180.26,-0.6251,-0.4515,-0.0721,7.4111`},EPSG_4692:{towgs84:`217.109,86.452,23.711,0.0183,-0.0003,0.007,-0.0093`},EPSG_9333:{towgs84:`0,0,0,-0.008393,0.000749,-0.010276,0`},EPSG_9059:{towgs84:`0,0,0`},EPSG_4312:{towgs84:`601.705,84.263,485.227,4.7354,1.3145,5.393,-2.3887`},EPSG_4123:{towgs84:`-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496`},EPSG_4309:{towgs84:`-124.45,183.74,44.64,-0.4384,0.5446,-0.9706,-2.1365`},ESRI_104106:{towgs84:`-283.088,-70.693,117.445,-1.157,0.059,-0.652,-4.058`},EPSG_4281:{towgs84:`-219.247,-73.802,269.529`},EPSG_4322:{towgs84:`0,0,4.5`},EPSG_4324:{towgs84:`0,0,1.9`},EPSG_4284:{towgs84:`43.822,-108.842,-119.585,1.455,-0.761,0.737,0.549`},EPSG_4277:{towgs84:`446.448,-125.157,542.06,0.15,0.247,0.842,-20.489`},EPSG_4207:{towgs84:`-282.1,-72.2,120,-1.529,0.145,-0.89,-4.46`},EPSG_4688:{towgs84:`347.175,1077.618,2623.677,33.9058,-70.6776,9.4013,186.0647`},EPSG_4689:{towgs84:`410.793,54.542,80.501,-2.5596,-2.3517,-0.6594,17.3218`},EPSG_4720:{towgs84:`0,0,4.5`},EPSG_4273:{towgs84:`278.3,93,474.5,7.889,0.05,-6.61,6.21`},EPSG_4240:{towgs84:`204.64,834.74,293.8`},EPSG_4817:{towgs84:`278.3,93,474.5,7.889,0.05,-6.61,6.21`},ESRI_104131:{towgs84:`426.62,142.62,460.09,4.98,4.49,-12.42,-17.1`},EPSG_4265:{towgs84:`-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68`},EPSG_4263:{towgs84:`-111.92,-87.85,114.5,1.875,0.202,0.219,0.032`},EPSG_4298:{towgs84:`-689.5937,623.84046,-65.93566,-0.02331,1.17094,-0.80054,5.88536`},EPSG_4270:{towgs84:`-253.4392,-148.452,386.5267,0.15605,0.43,-0.1013,-0.0424`},EPSG_4229:{towgs84:`-121.8,98.1,-10.7`},EPSG_4220:{towgs84:`-55.5,-348,-229.2`},EPSG_4214:{towgs84:`12.646,-155.176,-80.863`},EPSG_4232:{towgs84:`-345,3,223`},EPSG_4238:{towgs84:`-1.977,-13.06,-9.993,0.364,0.254,0.689,-1.037`},EPSG_4168:{towgs84:`-170,33,326`},EPSG_4131:{towgs84:`199,931,318.9`},EPSG_4152:{towgs84:`-0.9102,2.0141,0.5602,0.029039,0.010065,0.010101,0`},EPSG_5228:{towgs84:`572.213,85.334,461.94,4.9732,1.529,5.2484,3.5378`},EPSG_8351:{towgs84:`485.021,169.465,483.839,7.786342,4.397554,4.102655,0`},EPSG_4683:{towgs84:`-127.62,-67.24,-47.04,-3.068,4.903,1.578,-1.06`},EPSG_4133:{towgs84:`0,0,0`},EPSG_7373:{towgs84:`0.819,-0.5762,-1.6446,-0.00378,-0.03317,0.00318,0.0693`},EPSG_9075:{towgs84:`-0.9102,2.0141,0.5602,0.029039,0.010065,0.010101,0`},EPSG_9072:{towgs84:`-0.9102,2.0141,0.5602,0.029039,0.010065,0.010101,0`},EPSG_9294:{towgs84:`1.16835,-1.42001,-2.24431,-0.00822,-0.05508,0.01818,0.23388`},EPSG_4212:{towgs84:`-267.434,173.496,181.814,-13.4704,8.7154,7.3926,14.7492`},EPSG_4191:{towgs84:`-44.183,-0.58,-38.489,2.3867,2.7072,-3.5196,-8.2703`},EPSG_4237:{towgs84:`52.684,-71.194,-13.975,-0.312,-0.1063,-0.3729,1.0191`},EPSG_4740:{towgs84:`-1.08,-0.27,-0.9`},EPSG_4124:{towgs84:`419.3836,99.3335,591.3451,0.850389,1.817277,-7.862238,-0.99496`},EPSG_5681:{towgs84:`584.9636,107.7175,413.8067,1.1155,0.2824,-3.1384,7.9922`},EPSG_4141:{towgs84:`23.772,17.49,17.859,-0.3132,-1.85274,1.67299,-5.4262`},EPSG_4204:{towgs84:`-85.645,-273.077,-79.708,2.289,-1.421,2.532,3.194`},EPSG_4319:{towgs84:`226.702,-193.337,-35.371,-2.229,-4.391,9.238,0.9798`},EPSG_4200:{towgs84:`24.82,-131.21,-82.66`},EPSG_4130:{towgs84:`0,0,0`},EPSG_4127:{towgs84:`-82.875,-57.097,-156.768,-2.158,1.524,-0.982,-0.359`},EPSG_4149:{towgs84:`674.374,15.056,405.346`},EPSG_4617:{towgs84:`-0.991,1.9072,0.5129,0.02579,0.00965,0.01166,0`},EPSG_4663:{towgs84:`-210.502,-66.902,-48.476,2.094,-15.067,-5.817,0.485`},EPSG_4664:{towgs84:`-211.939,137.626,58.3,-0.089,0.251,0.079,0.384`},EPSG_4665:{towgs84:`-105.854,165.589,-38.312,-0.003,-0.026,0.024,-0.048`},EPSG_4666:{towgs84:`631.392,-66.551,481.442,1.09,-4.445,-4.487,-4.43`},EPSG_4756:{towgs84:`-192.873,-39.382,-111.202,-0.00205,-0.0005,0.00335,0.0188`},EPSG_4723:{towgs84:`-179.483,-69.379,-27.584,-7.862,8.163,6.042,-13.925`},EPSG_4726:{towgs84:`8.853,-52.644,180.304,-0.393,-2.323,2.96,-24.081`},EPSG_4267:{towgs84:`-8.0,160.0,176.0`},EPSG_5365:{towgs84:`-0.16959,0.35312,0.51846,0.03385,-0.16325,0.03446,0.03693`},EPSG_4218:{towgs84:`304.5,306.5,-318.1`},EPSG_4242:{towgs84:`-33.722,153.789,94.959,-8.581,-4.478,4.54,8.95`},EPSG_4216:{towgs84:`-292.295,248.758,429.447,4.9971,2.99,6.6906,1.0289`},ESRI_104105:{towgs84:`631.392,-66.551,481.442,1.09,-4.445,-4.487,-4.43`},ESRI_104129:{towgs84:`0,0,0`},EPSG_4673:{towgs84:`174.05,-25.49,112.57`},EPSG_4202:{towgs84:`-124,-60,154`},EPSG_4203:{towgs84:`-117.763,-51.51,139.061,0.292,0.443,0.277,-0.191`},EPSG_3819:{towgs84:`595.48,121.69,515.35,4.115,-2.9383,0.853,-3.408`},EPSG_8694:{towgs84:`-93.799,-132.737,-219.073,-1.844,0.648,-6.37,-0.169`},EPSG_4145:{towgs84:`275.57,676.78,229.6`},EPSG_4283:{towgs84:`0.06155,-0.01087,-0.04019,0.039492,0.032722,0.032898,-0.009994`},EPSG_4317:{towgs84:`2.3287,-147.0425,-92.0802,-0.309248,0.324822,0.497299,5.689063`},EPSG_4272:{towgs84:`59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993`},EPSG_4248:{towgs84:`-307.7,265.3,-363.5`},EPSG_5561:{towgs84:`24,-121,-76`},EPSG_5233:{towgs84:`-0.293,766.95,87.713,0.195704,1.695068,3.473016,-0.039338`},ESRI_104130:{towgs84:`-86,-98,-119`},ESRI_104102:{towgs84:`682,-203,480`},ESRI_37207:{towgs84:`7,-10,-26`},EPSG_4675:{towgs84:`59.935,118.4,-10.871`},ESRI_104109:{towgs84:`-89.121,-348.182,260.871`},ESRI_104112:{towgs84:`-185.583,-230.096,281.361`},ESRI_104113:{towgs84:`25.1,-275.6,222.6`},IGNF_WGS72G:{towgs84:`0,12,6`},IGNF_NTFG:{towgs84:`-168,-60,320`},IGNF_EFATE57G:{towgs84:`-127,-769,472`},IGNF_PGP50G:{towgs84:`324.8,153.6,172.1`},IGNF_REUN47G:{towgs84:`94,-948,-1262`},IGNF_CSG67G:{towgs84:`-186,230,110`},IGNF_GUAD48G:{towgs84:`-467,-16,-300`},IGNF_TAHI51G:{towgs84:`162,117,154`},IGNF_TAHAAG:{towgs84:`65,342,77`},IGNF_NUKU72G:{towgs84:`84,274,65`},IGNF_PETRELS72G:{towgs84:`365,194,166`},IGNF_WALL78G:{towgs84:`253,-133,-127`},IGNF_MAYO50G:{towgs84:`-382,-59,-262`},IGNF_TANNAG:{towgs84:`-139,-967,436`},IGNF_IGN72G:{towgs84:`-13,-348,292`},IGNF_ATIGG:{towgs84:`1118,23,66`},IGNF_FANGA84G:{towgs84:`150.57,158.33,118.32`},IGNF_RUSAT84G:{towgs84:`202.13,174.6,-15.74`},IGNF_KAUE70G:{towgs84:`126.74,300.1,-75.49`},IGNF_MOP90G:{towgs84:`-10.8,-1.8,12.77`},IGNF_MHPF67G:{towgs84:`338.08,212.58,-296.17`},IGNF_TAHI79G:{towgs84:`160.61,116.05,153.69`},IGNF_ANAA92G:{towgs84:`1.5,3.84,4.81`},IGNF_MARQUI72G:{towgs84:`330.91,-13.92,58.56`},IGNF_APAT86G:{towgs84:`143.6,197.82,74.05`},IGNF_TUBU69G:{towgs84:`237.17,171.61,-77.84`},IGNF_STPM50G:{towgs84:`11.363,424.148,373.13`},EPSG_4150:{towgs84:`674.374,15.056,405.346`},EPSG_4754:{towgs84:`-208.4058,-109.8777,-2.5764`},ESRI_104101:{towgs84:`372.87,149.23,585.29`},EPSG_4693:{towgs84:`0,-0.15,0.68`},EPSG_6207:{towgs84:`293.17,726.18,245.36`},EPSG_4153:{towgs84:`-133.63,-157.5,-158.62`},EPSG_4132:{towgs84:`-241.54,-163.64,396.06`},EPSG_4221:{towgs84:`-154.5,150.7,100.4`},EPSG_4266:{towgs84:`-80.7,-132.5,41.1`},EPSG_4193:{towgs84:`-70.9,-151.8,-41.4`},EPSG_5340:{towgs84:`-0.41,0.46,-0.35`},EPSG_4246:{towgs84:`-294.7,-200.1,525.5`},EPSG_4318:{towgs84:`-3.2,-5.7,2.8`},EPSG_4121:{towgs84:`-199.87,74.79,246.62`},EPSG_4223:{towgs84:`-260.1,5.5,432.2`},EPSG_4158:{towgs84:`-0.465,372.095,171.736`},EPSG_4285:{towgs84:`-128.16,-282.42,21.93`},EPSG_4613:{towgs84:`-404.78,685.68,45.47`},EPSG_4607:{towgs84:`195.671,332.517,274.607`},EPSG_4475:{towgs84:`-381.788,-57.501,-256.673`},EPSG_4208:{towgs84:`-157.84,308.54,-146.6`},EPSG_4743:{towgs84:`70.995,-335.916,262.898`},EPSG_4710:{towgs84:`-323.65,551.39,-491.22`},EPSG_7881:{towgs84:`-0.077,0.079,0.086`},EPSG_4682:{towgs84:`283.729,735.942,261.143`},EPSG_4739:{towgs84:`-156,-271,-189`},EPSG_4679:{towgs84:`-80.01,253.26,291.19`},EPSG_4750:{towgs84:`-56.263,16.136,-22.856`},EPSG_4644:{towgs84:`-10.18,-350.43,291.37`},EPSG_4695:{towgs84:`-103.746,-9.614,-255.95`},EPSG_4292:{towgs84:`-355,21,72`},EPSG_4302:{towgs84:`-61.702,284.488,472.052`},EPSG_4143:{towgs84:`-124.76,53,466.79`},EPSG_4606:{towgs84:`-153,153,307`},EPSG_4699:{towgs84:`-770.1,158.4,-498.2`},EPSG_4247:{towgs84:`-273.5,110.6,-357.9`},EPSG_4160:{towgs84:`8.88,184.86,106.69`},EPSG_4161:{towgs84:`-233.43,6.65,173.64`},EPSG_9251:{towgs84:`-9.5,122.9,138.2`},EPSG_9253:{towgs84:`-78.1,101.6,133.3`},EPSG_4297:{towgs84:`-198.383,-240.517,-107.909`},EPSG_4269:{towgs84:`0,0,0`},EPSG_4301:{towgs84:`-147,506,687`},EPSG_4618:{towgs84:`-59,-11,-52`},EPSG_4612:{towgs84:`0,0,0`},EPSG_4678:{towgs84:`44.585,-131.212,-39.544`},EPSG_4250:{towgs84:`-130,29,364`},EPSG_4144:{towgs84:`214,804,268`},EPSG_4147:{towgs84:`-17.51,-108.32,-62.39`},EPSG_4259:{towgs84:`-254.1,-5.36,-100.29`},EPSG_4164:{towgs84:`-76,-138,67`},EPSG_4211:{towgs84:`-378.873,676.002,-46.255`},EPSG_4182:{towgs84:`-422.651,-172.995,84.02`},EPSG_4224:{towgs84:`-143.87,243.37,-33.52`},EPSG_4225:{towgs84:`-205.57,168.77,-4.12`},EPSG_5527:{towgs84:`-67.35,3.88,-38.22`},EPSG_4752:{towgs84:`98,390,-22`},EPSG_4310:{towgs84:`-30,190,89`},EPSG_9248:{towgs84:`-192.26,65.72,132.08`},EPSG_4680:{towgs84:`124.5,-63.5,-281`},EPSG_4701:{towgs84:`-79.9,-158,-168.9`},EPSG_4706:{towgs84:`-146.21,112.63,4.05`},EPSG_4805:{towgs84:`682,-203,480`},EPSG_4201:{towgs84:`-165,-11,206`},EPSG_4210:{towgs84:`-157,-2,-299`},EPSG_4183:{towgs84:`-104,167,-38`},EPSG_4139:{towgs84:`11,72,-101`},EPSG_4668:{towgs84:`-86,-98,-119`},EPSG_4717:{towgs84:`-2,151,181`},EPSG_4732:{towgs84:`102,52,-38`},EPSG_4280:{towgs84:`-377,681,-50`},EPSG_4209:{towgs84:`-138,-105,-289`},EPSG_4261:{towgs84:`31,146,47`},EPSG_4658:{towgs84:`-73,46,-86`},EPSG_4721:{towgs84:`265.025,384.929,-194.046`},EPSG_4222:{towgs84:`-136,-108,-292`},EPSG_4601:{towgs84:`-255,-15,71`},EPSG_4602:{towgs84:`725,685,536`},EPSG_4603:{towgs84:`72,213.7,93`},EPSG_4605:{towgs84:`9,183,236`},EPSG_4621:{towgs84:`137,248,-430`},EPSG_4657:{towgs84:`-28,199,5`},EPSG_4316:{towgs84:`103.25,-100.4,-307.19`},EPSG_4642:{towgs84:`-13,-348,292`},EPSG_4698:{towgs84:`145,-187,103`},EPSG_4192:{towgs84:`-206.1,-174.7,-87.7`},EPSG_4311:{towgs84:`-265,120,-358`},EPSG_4135:{towgs84:`58,-283,-182`},ESRI_104138:{towgs84:`198,-226,-347`},EPSG_4245:{towgs84:`-11,851,5`},EPSG_4142:{towgs84:`-125,53,467`},EPSG_4213:{towgs84:`-106,-87,188`},EPSG_4253:{towgs84:`-133,-77,-51`},EPSG_4129:{towgs84:`-132,-110,-335`},EPSG_4713:{towgs84:`-77,-128,142`},EPSG_4239:{towgs84:`217,823,299`},EPSG_4146:{towgs84:`295,736,257`},EPSG_4155:{towgs84:`-83,37,124`},EPSG_4165:{towgs84:`-173,253,27`},EPSG_4672:{towgs84:`175,-38,113`},EPSG_4236:{towgs84:`-637,-549,-203`},EPSG_4251:{towgs84:`-90,40,88`},EPSG_4271:{towgs84:`-2,374,172`},EPSG_4175:{towgs84:`-88,4,101`},EPSG_4716:{towgs84:`298,-304,-375`},EPSG_4315:{towgs84:`-23,259,-9`},EPSG_4744:{towgs84:`-242.2,-144.9,370.3`},EPSG_4244:{towgs84:`-97,787,86`},EPSG_4293:{towgs84:`616,97,-251`},EPSG_4714:{towgs84:`-127,-769,472`},EPSG_4736:{towgs84:`260,12,-147`},EPSG_6883:{towgs84:`-235,-110,393`},EPSG_6894:{towgs84:`-63,176,185`},EPSG_4205:{towgs84:`-43,-163,45`},EPSG_4256:{towgs84:`41,-220,-134`},EPSG_4262:{towgs84:`639,405,60`},EPSG_4604:{towgs84:`174,359,365`},EPSG_4169:{towgs84:`-115,118,426`},EPSG_4620:{towgs84:`-106,-129,165`},EPSG_4184:{towgs84:`-203,141,53`},EPSG_4616:{towgs84:`-289,-124,60`},EPSG_9403:{towgs84:`-307,-92,127`},EPSG_4684:{towgs84:`-133,-321,50`},EPSG_4708:{towgs84:`-491,-22,435`},EPSG_4707:{towgs84:`114,-116,-333`},EPSG_4709:{towgs84:`145,75,-272`},EPSG_4712:{towgs84:`-205,107,53`},EPSG_4711:{towgs84:`124,-234,-25`},EPSG_4718:{towgs84:`230,-199,-752`},EPSG_4719:{towgs84:`211,147,111`},EPSG_4724:{towgs84:`208,-435,-229`},EPSG_4725:{towgs84:`189,-79,-202`},EPSG_4735:{towgs84:`647,1777,-1124`},EPSG_4722:{towgs84:`-794,119,-298`},EPSG_4728:{towgs84:`-307,-92,127`},EPSG_4734:{towgs84:`-632,438,-609`},EPSG_4727:{towgs84:`912,-58,1227`},EPSG_4729:{towgs84:`185,165,42`},EPSG_4730:{towgs84:`170,42,84`},EPSG_4733:{towgs84:`276,-57,149`},ESRI_37218:{towgs84:`230,-199,-752`},ESRI_37240:{towgs84:`-7,215,225`},ESRI_37221:{towgs84:`252,-209,-751`},ESRI_4305:{towgs84:`-123,-206,219`},ESRI_104139:{towgs84:`-73,-247,227`},EPSG_4748:{towgs84:`51,391,-36`},EPSG_4219:{towgs84:`-384,664,-48`},EPSG_4255:{towgs84:`-333,-222,114`},EPSG_4257:{towgs84:`-587.8,519.75,145.76`},EPSG_4646:{towgs84:`-963,510,-359`},EPSG_6881:{towgs84:`-24,-203,268`},EPSG_6882:{towgs84:`-183,-15,273`},EPSG_4715:{towgs84:`-104,-129,239`},IGNF_RGF93GDD:{towgs84:`0,0,0`},IGNF_RGM04GDD:{towgs84:`0,0,0`},IGNF_RGSPM06GDD:{towgs84:`0,0,0`},IGNF_RGTAAF07GDD:{towgs84:`0,0,0`},IGNF_RGFG95GDD:{towgs84:`0,0,0`},IGNF_RGNCG:{towgs84:`0,0,0`},IGNF_RGPFGDD:{towgs84:`0,0,0`},IGNF_ETRS89G:{towgs84:`0,0,0`},IGNF_RGR92GDD:{towgs84:`0,0,0`},EPSG_4173:{towgs84:`0,0,0`},EPSG_4180:{towgs84:`0,0,0`},EPSG_4619:{towgs84:`0,0,0`},EPSG_4667:{towgs84:`0,0,0`},EPSG_4075:{towgs84:`0,0,0`},EPSG_6706:{towgs84:`0,0,0`},EPSG_7798:{towgs84:`0,0,0`},EPSG_4661:{towgs84:`0,0,0`},EPSG_4669:{towgs84:`0,0,0`},EPSG_8685:{towgs84:`0,0,0`},EPSG_4151:{towgs84:`0,0,0`},EPSG_9702:{towgs84:`0,0,0`},EPSG_4758:{towgs84:`0,0,0`},EPSG_4761:{towgs84:`0,0,0`},EPSG_4765:{towgs84:`0,0,0`},EPSG_8997:{towgs84:`0,0,0`},EPSG_4023:{towgs84:`0,0,0`},EPSG_4670:{towgs84:`0,0,0`},EPSG_4694:{towgs84:`0,0,0`},EPSG_4148:{towgs84:`0,0,0`},EPSG_4163:{towgs84:`0,0,0`},EPSG_4167:{towgs84:`0,0,0`},EPSG_4189:{towgs84:`0,0,0`},EPSG_4190:{towgs84:`0,0,0`},EPSG_4176:{towgs84:`0,0,0`},EPSG_4659:{towgs84:`0,0,0`},EPSG_3824:{towgs84:`0,0,0`},EPSG_3889:{towgs84:`0,0,0`},EPSG_4046:{towgs84:`0,0,0`},EPSG_4081:{towgs84:`0,0,0`},EPSG_4558:{towgs84:`0,0,0`},EPSG_4483:{towgs84:`0,0,0`},EPSG_5013:{towgs84:`0,0,0`},EPSG_5264:{towgs84:`0,0,0`},EPSG_5324:{towgs84:`0,0,0`},EPSG_5354:{towgs84:`0,0,0`},EPSG_5371:{towgs84:`0,0,0`},EPSG_5373:{towgs84:`0,0,0`},EPSG_5381:{towgs84:`0,0,0`},EPSG_5393:{towgs84:`0,0,0`},EPSG_5489:{towgs84:`0,0,0`},EPSG_5593:{towgs84:`0,0,0`},EPSG_6135:{towgs84:`0,0,0`},EPSG_6365:{towgs84:`0,0,0`},EPSG_5246:{towgs84:`0,0,0`},EPSG_7886:{towgs84:`0,0,0`},EPSG_8431:{towgs84:`0,0,0`},EPSG_8427:{towgs84:`0,0,0`},EPSG_8699:{towgs84:`0,0,0`},EPSG_8818:{towgs84:`0,0,0`},EPSG_4757:{towgs84:`0,0,0`},EPSG_9140:{towgs84:`0,0,0`},EPSG_8086:{towgs84:`0,0,0`},EPSG_4686:{towgs84:`0,0,0`},EPSG_4737:{towgs84:`0,0,0`},EPSG_4702:{towgs84:`0,0,0`},EPSG_4747:{towgs84:`0,0,0`},EPSG_4749:{towgs84:`0,0,0`},EPSG_4674:{towgs84:`0,0,0`},EPSG_4755:{towgs84:`0,0,0`},EPSG_4759:{towgs84:`0,0,0`},EPSG_4762:{towgs84:`0,0,0`},EPSG_4763:{towgs84:`0,0,0`},EPSG_4764:{towgs84:`0,0,0`},EPSG_4166:{towgs84:`0,0,0`},EPSG_4170:{towgs84:`0,0,0`},EPSG_5546:{towgs84:`0,0,0`},EPSG_7844:{towgs84:`0,0,0`},EPSG_4818:{towgs84:`589,76,480`},EPSG_10328:{towgs84:`0,0,0`},EPSG_9782:{towgs84:`0,0,0`},EPSG_9777:{towgs84:`0,0,0`},EPSG_10690:{towgs84:`0,0,0`},EPSG_10639:{towgs84:`0,0,0`},EPSG_10739:{towgs84:`0,0,0`},EPSG_7686:{towgs84:`0,0,0`},EPSG_8900:{towgs84:`0,0,0`},EPSG_5886:{towgs84:`0,0,0`},EPSG_7683:{towgs84:`0,0,0`},EPSG_6668:{towgs84:`0,0,0`},EPSG_20046:{towgs84:`0,0,0`},EPSG_10299:{towgs84:`0,0,0`},EPSG_10310:{towgs84:`0,0,0`},EPSG_10475:{towgs84:`0,0,0`},EPSG_4742:{towgs84:`0,0,0`},EPSG_10671:{towgs84:`0,0,0`},EPSG_10762:{towgs84:`0,0,0`},EPSG_10725:{towgs84:`0,0,0`},EPSG_10791:{towgs84:`0,0,0`},EPSG_10800:{towgs84:`0,0,0`},EPSG_10305:{towgs84:`0,0,0`},EPSG_10941:{towgs84:`0,0,0`},EPSG_10968:{towgs84:`0,0,0`},EPSG_10875:{towgs84:`0,0,0`},EPSG_6318:{towgs84:`0,0,0`},EPSG_10910:{towgs84:`0,0,0`}};for(let e in Tx){let t=Tx[e];t.datumName&&(Tx[t.datumName]=t)}var Ex=Object.freeze({name:`regional-datums`,datums:Object.freeze(Tx)});function Dx(e){return{...e,parse(t,n){let r=e.parse(t,n),i=r.parameters.datum,a=e=>e.toLowerCase().replace(/[\s_-]/g,``);if(i&&!Object.keys($p(n)).some(e=>a(e)===a(i))){let e={...r.parameters};return delete e.datum,{...r,parameters:e}}return r}}}var Ox=[Cx,wx].map(Dx),kx;function Ax(){if(kx)return kx;let e=[Sh,Ch,Gh,Qh,bg,Wg,Xg,c_,y_,I_,L_,R_,z_,sv,mv,yv,Av,Jv,$v,ay,yy,Dy,My,Iy,Hy,qy,eb,ib,db,yb,Pb,Fb,Bb,Kb,Zb],t=e=>e.toLowerCase().replace(/[\s_-]/g,``),n=rx(`longlat`),r={name:n.name,aliases:n.aliases,parameters:[...new Set([...n.parameters,...e.flatMap(e=>e.parameters)])],flags:[...new Set(e.flatMap(e=>e.flags||[]))],create(n){let r=n.parameters.o_proj;if(!r)throw Error(`Oblique transformation requires +o_proj`);let i=[`longlat`,`latlong`,`latlon`,`lonlat`,`identity`].includes(t(r))?`longlat`:e.find(e=>[e.name,...e.aliases||[]].some(e=>t(e)===t(r)));if(!i)throw Error(`Unknown oblique transformation projection: `+r);let a=rx(i),o=new Set([...rm,...a.parameters]);for(let e of Object.keys(n.parameters))if(!o.has(e))throw Error(`Unsupported PROJ parameter: +`+e);return a.create(n)}};return kx=[...e,r],kx}var jx=new class extends yh{constructor(e={}){super({...e,projections:e.projections??Ax(),parsers:e.parsers??Ox,datumCatalogs:e.datumCatalogs??[Ex]}),this.useDefinitionSignature=!hh(e)}};function Z(e,t){if(!e)throw Error(t||`deck.gl: assertion failed.`)}var Mx=class{constructor(e){let{compare:t,extract:n,required:r}=e;this._propsToCompare=t,this._propsToExtract=n||t,this._requiredProps=r}arePropsEqual(e,t){for(let n of this._propsToCompare)if(!(n in e)||!(n in t)||!Oe(e[n],t[n]))return!1;return!0}initializeProps(e,t){let n={},r={};for(let i of this._propsToExtract)(i in e||i in t)&&(n[i]=e[i],r[i]=t[i]);return this._checkRequiredProps(n),this._checkRequiredProps(r),{start:n,end:r}}getDuration(e,t){return t.transitionDuration}_checkRequiredProps(e){this._requiredProps&&this._requiredProps.forEach(t=>{let n=e[t];Z(Number.isFinite(n)||Array.isArray(n),`${t} is required for transition`)})}};function Nx(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function Px(e,t){let n=Oc([],t,e);return Dc(n,n,1/n[3]),n}function Fx(e,t,n){return e<t?t:e>n?n:e}function Ix(e){return Math.log(e)*Math.LOG2E}var Lx=Math.log2||Ix;function Rx(e,t){if(!e)throw Error(t||`@math.gl/geospatial/web-mercator: assertion failed.`)}var zx=Math.PI,Bx=zx/4,Vx=zx/180,Hx=180/zx,Ux=512,Wx=4003e4,Gx=85.051129,Kx=1.5;function qx(e){let[t,n]=e;Rx(Number.isFinite(t)),Rx(Number.isFinite(n)&&n>=-90&&n<=90,`invalid latitude`);let r=t*Vx,i=n*Vx;return[Ux*(r+zx)/(2*zx),Ux*(zx+Math.log(Math.tan(Bx+i*.5)))/(2*zx)]}function Jx(e){let[t,n]=e,r=t/Ux*(2*zx)-zx,i=2*(Math.atan(Math.exp(n/Ux*(2*zx)-zx))-Bx);return[r*Hx,i*Hx]}function Yx(e){let t=Math.cos(e*Vx);return Ux/Wx/t}function Xx(e){let{latitude:t,longitude:n,highPrecision:r=!1}=e;Rx(Number.isFinite(t)&&Number.isFinite(n));let i=Ux,a=Math.cos(t*Vx),o=i/360,s=o/a,c=i/Wx/a,l={unitsPerMeter:[c,c,c],metersPerUnit:[1/c,1/c,1/c],unitsPerDegree:[o,s,c],degreesPerUnit:[1/o,1/s,1/c]};if(r){let e=Vx*Math.tan(t*Vx)/a,n=o*e/2,r=i/Wx*e,u=r/s*c;l.unitsPerDegree2=[0,n,r],l.unitsPerMeter2=[u,0,u]}return l}function Zx(e,t){let[n,r,i]=e,[a,o,s]=t,{unitsPerMeter:c,unitsPerMeter2:l}=Xx({longitude:n,latitude:r,highPrecision:!0}),u=qx(e);u[0]+=a*(c[0]+l[0]*o),u[1]+=o*(c[1]+l[1]*o);let d=Jx(u),f=(i||0)+(s||0);return Number.isFinite(i)||Number.isFinite(s)?[d[0],d[1],f]:d}function Qx(e){let{height:t,pitch:n,bearing:r,altitude:i,scale:a,center:o}=e,s=Nx();pc(s,s,[0,0,-i]),gc(s,s,-n*Vx),vc(s,s,r*Vx);let c=a/t;return mc(s,s,[c,c,c]),o&&pc(s,s,Gs([],o)),s}function $x(e){let{width:t,height:n,altitude:r,pitch:i=0,offset:a,center:o,scale:s,nearZMultiplier:c=1,farZMultiplier:l=1}=e,{fovy:u=eS(Kx)}=e;r!==void 0&&(u=eS(r));let d=u*Vx,f=i*Vx,p=tS(u),m=p;o&&(m+=o[2]*s/Math.cos(f)/n);let h=d*(.5+(a?a[1]:0)/n),g=Math.sin(h)*m/Math.sin(Fx(Math.PI/2-f-h,.01,Math.PI-.01)),_=Math.sin(f)*g+m,v=m*10,y=Math.min(_*l,v);return{fov:d,aspect:t/n,focalDistance:p,near:c,far:y}}function eS(e){return 2*Math.atan(.5/e)*Hx}function tS(e){return .5/Math.tan(.5*e*Vx)}function nS(e,t){let[n,r,i=0]=e;return Rx(Number.isFinite(n)&&Number.isFinite(r)&&Number.isFinite(i)),Px(t,[n,r,i,1])}function rS(e,t,n=0){let[r,i,a]=e;if(Rx(Number.isFinite(r)&&Number.isFinite(i),`invalid pixel coordinate`),Number.isFinite(a))return Px(t,[r,i,a,1]);let o=Px(t,[r,i,0,1]),s=Px(t,[r,i,1,1]),c=o[2],l=s[2];return Is([],o,s,c===l?0:((n||0)-c)/(l-c))}function iS(e){let{width:t,height:n,bounds:r,minExtent:i=0,maxZoom:a=24,offset:o=[0,0]}=e,[[s,c],[l,u]]=r,d=aS(e.padding),f=qx([s,Fx(u,-Gx,Gx)]),p=qx([l,Fx(c,-Gx,Gx)]),m=[Math.max(Math.abs(p[0]-f[0]),i),Math.max(Math.abs(p[1]-f[1]),i)],h=[t-d.left-d.right-Math.abs(o[0])*2,n-d.top-d.bottom-Math.abs(o[1])*2];Rx(h[0]>0&&h[1]>0);let g=h[0]/m[0],_=h[1]/m[1],v=Math.min(a,Lx(Math.abs(Math.min(g,_))));Rx(Number.isFinite(v));let y=2**v,b=(d.left-d.right)/2+o[0],x=(d.top-d.bottom)/2+o[1],S=Jx([(p[0]+f[0])/2-b/y,(p[1]+f[1])/2+x/y]);return{longitude:S[0],latitude:S[1],zoom:v}}function aS(e=0){return typeof e==`number`?{top:e,bottom:e,left:e,right:e}:(Rx(Number.isFinite(e.top)&&Number.isFinite(e.bottom)&&Number.isFinite(e.left)&&Number.isFinite(e.right)),e)}var oS=Math.PI/180;function sS(e,t=0){let{width:n,height:r,unproject:i}=e,a={targetZ:t},o=i([0,r],a),s=i([n,r],a),c,l;return(e.fovy?.5*e.fovy*oS:Math.atan(.5/e.altitude))>(90-e.pitch)*oS-.01?(c=cS(e,0,t),l=cS(e,n,t)):(c=i([0,0],a),l=i([n,0],a)),[o,s,l,c]}function cS(e,t,n){let{pixelUnprojectionMatrix:r}=e,i=Px(r,[t,0,1,1]),a=Px(r,[t,e.height,1,1]),o=Jx(Is([],i,a,(n*e.distanceScales.unitsPerMeter[2]-i[2])/(a[2]-i[2])));return o.push(n),o}var lS=Math.PI/180;180/Math.PI;var uS=6370972,dS=[1,1,1],fS={proj:`geocent`,R:String(uS),datum:`none`},pS=z_.create({semiMajorAxis:uS,semiMinorAxis:uS,eccentricitySquared:0,parameters:fS});function mS(e){return((t,n)=>{let r=e(Array.from(t));if(!n)return r;for(let e=0;e<r.length;e++)n[e]=r[e];return n})}var hS={signature:`+proj=geocent +R=${uS} +datum=none`,coordinateFrame:`geocentric`,projection:`geocent`,parameters:fS,ellipsoid:{semiMajorAxis:uS,semiMinorAxis:uS},axis:`enu`,xUnit:{name:`meters`,metersPerUnit:1},yUnit:{name:`meters`,metersPerUnit:1},zUnit:{name:`meters`,metersPerUnit:1},lossy:!1,renderingBounds:[[-uS,-uS,-uS],[uS,uS,uS]],renderingScale:dS,getRenderingScale:()=>dS,converter:{WGS84:{from:mS(e=>{let t=pS.forward3D([e[0]*lS,e[1]*lS,e[2]??0]);return[e[0],e[1],e[2]]=t,e}),to:mS(e=>{let t=pS.inverse3D([e[0],e[1],e[2]]);return e[0]=t[0]/lS,e[1]=t[1]/lS,e[2]=t[2],e}),normalize:mS(e=>{let t=e[0];return e[0]=Math.abs(t)<=180?t:((t+180)%360+360)%360-180,e[1]=Math.max(-90,Math.min(90,e[1])),e})}}};function gS(e,t){t&&(e=Math.max(Math.min(e,Gx),-Gx));let n=Math.PI*Math.cos(e*Math.PI/180);return Math.log2(n)}1/(1-Math.exp(-5));var _S=512,vS=Xx({longitude:0,latitude:0}).metersPerUnit[0],yS=vS*_S/(2*Math.PI);function bS(e,t,n=!1){let r=Xx({longitude:e,latitude:t,highPrecision:n});return{unitsPerMeter:r.unitsPerMeter,metersPerUnit:r.metersPerUnit,unitsPerWorldUnit:r.unitsPerDegree,unitsPerMeter2:r.unitsPerMeter2||[0,0,0],unitsPerWorldUnit2:r.unitsPerDegree2||[0,0,0]}}function xS(e){return((t,n)=>{let r=e(Array.from(t));if(!n)return r;for(let e=0;e<r.length;e++)n[e]=r[e];return n})}var SS=e=>{let[t,n]=Jx([e[0],_S-e[1]]),{metersPerUnit:r}=Xx({longitude:t,latitude:n});return[r[0],r[1],1]},CS={signature:`OSMTile512`,coordinateFrame:`projected`,projection:`merc`,parameters:{proj:`merc`},ellipsoid:{semiMajorAxis:yS,semiMinorAxis:yS},axis:`esu`,xUnit:{name:`tile units`,metersPerUnit:vS},yUnit:{name:`tile units`,metersPerUnit:vS},zUnit:{name:`meters`,metersPerUnit:1},lossy:!1,renderingBounds:[[0,0,0],[_S,_S,0]],renderingScale:SS,getRenderingScale:SS,converter:{WGS84:{from:xS(e=>{let[t,n]=qx(e);return e[0]=t,e[1]=_S-n,e}),to:xS(e=>{let[t,n]=Jx([e[0],_S-e[1]]);return e[0]=t,e[1]=n,e}),normalize:xS(e=>{let t=e[0];return e[0]=Math.abs(t)<=180?t:((t+180)%360+360)%360-180,e[1]=Math.max(-Gx,Math.min(Gx,e[1])),e})}}},wS=((e,t)=>{if(!t)return Array.from(e);for(let n=0;n<e.length;n++)t[n]=e[n];return t}),TS={signature:`WGS84`,projection:`longlat`,parameters:{proj:`longlat`,datum:`WGS84`},coordinateFrame:`geographic`,ellipsoid:{semiMajorAxis:6378137,semiMinorAxis:6356752.314245179},axis:`enu`,xUnit:{name:`degrees`,degreesPerUnit:1},yUnit:{name:`degrees`,degreesPerUnit:1},zUnit:{name:`meters`,metersPerUnit:1},lossy:!1,renderingBounds:[[-180,-90,0],[180,90,0]],renderingScale:()=>null,getRenderingScale:()=>null,converter:{WGS84:{from:wS,to:wS,normalize:wS}}},ES=new Map([[TS.signature,TS],[hS.signature,hS],[CS.signature,CS]]);function DS(e,t){return e===t?!0:(typeof e==`string`?e:JSON.stringify(e))===(typeof t==`string`?t:JSON.stringify(t))}function OS(e){let t=e;switch(typeof e==`string`?e.toLowerCase():null){case`lnglat`:case`longlat`:case`wgs84`:case`epsg:4326`:case`epsg:4979`:case`lnglat-offsets`:return TS;case`globe`:return hS;case`cartesian`:case`meter-offsets`:return null;case`epsg:4328`:t=`EPSG:4978`;break}let n=typeof t==`string`?t:JSON.stringify(t),r=ES.get(n);if(r)return r;let i=jx.getCRS(t).then(e=>(ES.set(n,e),ES.set(e.signature,e),e),e=>{throw ES.get(n)===i&&ES.delete(n),e});return ES.set(n,i),i}function kS(e,t,n){if(!t)return!0;switch(e){case B.CUSTOM_GEOSPATIAL:return t.signature===n?.signature;case B.WEB_MERCATOR:case B.WEB_MERCATOR_AUTO_OFFSET:case B.GLOBE:case B.IDENTITY:return t.signature===`WGS84`;default:return!1}}function AS(e,t){if(e??=`default`,typeof e!=`string`&&typeof e!=`object`)throw Error(`Invalid coordinateSystem: ${e}`);let n=e;switch(e){case`default`:n=t.isGeospatial?`WGS84`:`cartesian`;break}if(n===t.crs?.signature)return t.crs;let r=OS(n);if(r instanceof Promise)throw Error(`Coordinate system not loaded: ${e}`);return r}function jS(e,t,n=AS(e,t)){switch(e){case`cartesian`:case`meter-offsets`:return{coordinateSystem:e,preprojected:!1}}let r=!kS(t.projectionMode,n,t.crs);if(r)switch(t.projectionMode){case B.CUSTOM_GEOSPATIAL:return{coordinateSystem:`cartesian`,preprojected:r};default:return{coordinateSystem:`lnglat`,preprojected:r}}switch(e){case`default`:return{coordinateSystem:n?`lnglat`:`cartesian`,preprojected:r};case`lnglat-offsets`:return{coordinateSystem:e,preprojected:r}}switch(n?.signature){case`WGS84`:return{coordinateSystem:`lnglat`,preprojected:r};default:return{coordinateSystem:`cartesian`,preprojected:r}}}function MS(e,t){if(e===t)return!0;if(Array.isArray(e)){let n=e.length;if(!t||t.length!==n)return!1;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}return!1}function NS(e){let t={},n;return r=>{for(let i in r)if(!MS(r[i],t[i])){n=e(r),t=r;break}return n}}var PS=[0,0,0,0],FS=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],IS=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],LS=[0,0,0];function RS(e,t){switch(e){case`lnglat`:case`lnglat-offsets`:return fp.GEODETIC;case`meter-offsets`:return fp.IDENTITY;case`cartesian`:switch(t.crs?.coordinateFrame){case`geographic`:return fp.GEODETIC;case`geocentric`:return fp.GEOCENTRIC;case`projected`:return fp.PROJECTED;default:return fp.IDENTITY}default:throw Error(`Invalid coordinateSystem: ${e}`)}}function zS(e,t){switch(t){case`meter-offsets`:switch(e){case B.GLOBE:return B.GLOBE_METER_OFFSETS;case B.WEB_MERCATOR:case B.WEB_MERCATOR_AUTO_OFFSET:case B.CUSTOM_GEOSPATIAL:return B.METER_OFFSETS}break;case`lnglat-offsets`:switch(e){case B.WEB_MERCATOR:case B.WEB_MERCATOR_AUTO_OFFSET:return B.GEODETIC_OFFSETS}break}return e}var BS=NS(WS);function VS(e,t,n=LS,r){n.length<3&&(n=[n[0],n[1],0]);let i=n,a,o=jS(t,e,r);t=o.coordinateSystem,o.preprojected&&(n=LS);let s,c=!0;switch(t){case`lnglat-offsets`:case`meter-offsets`:s=n;break;default:s=e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null}switch(e.projectionMode){case B.WEB_MERCATOR:switch(t){case`lnglat`:s=[0,0,0],c=!1;break;case`cartesian`:c=!1,s=e.unprojectPosition([Math.fround(e.center[0]),Math.fround(e.center[1]),0]);break}break;case B.WEB_MERCATOR_AUTO_OFFSET:switch(t){case`lnglat`:i=s;break;case`cartesian`:i=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],s=e.unprojectPosition(i),i[0]-=n[0],i[1]-=n[1],i[2]-=n[2];break}break;case B.IDENTITY:i=e.position.map(Math.fround),i[2]=i[2]||0;break;case B.CUSTOM_GEOSPATIAL:{if(t===`meter-offsets`){i=LS,a=e.projectPosition(n);break}s=null;let r=e.distanceScales.unitsPerWorldUnit;i=e.center.map((e,t)=>Math.fround(e/r[t]-n[t])),a=i.map((e,t)=>(e+n[t])*r[t]);break}case B.GLOBE:c=!1,s=null;break;default:c=!1}return{geospatialOrigin:s,shaderCoordinateOrigin:i,commonOrigin:a,offsetMode:c}}function HS(e,t,n){let{viewMatrixUncentered:r,projectionMatrix:i}=e,{viewMatrix:a,viewProjectionMatrix:o}=e,s=PS,c=PS,l=e.cameraPosition,{geospatialOrigin:u,shaderCoordinateOrigin:d,commonOrigin:f,offsetMode:p}=VS(e,t,n);return p&&(c=f||e.projectPosition(u||d),l=[l[0]-c[0],l[1]-c[1],l[2]-c[2]],c[3]=1,s=Oc([],c,o),a=r||a,o=fc([],i,a),o=fc([],o,FS)),{viewMatrix:a,viewProjectionMatrix:o,projectionCenter:s,originCommon:c,cameraPosCommon:l,shaderCoordinateOrigin:d,geospatialOrigin:u}}function US({viewport:e,devicePixelRatio:t=1,modelMatrix:n=null,coordinateSystem:r=`default`,coordinateOrigin:i=LS,autoWrapLongitude:a=!1,sourceCrs:o}){let s=jS(r,e,o);switch(r=s.coordinateSystem,r){case`lnglat-offsets`:switch(e.projectionMode){case B.GLOBE:r=`lnglat`;break}break}if(!s.preprojected&&r===`lnglat`&&i.some(e=>e!==0)){let e=Array.from(n||IS);e[12]+=i[0],e[13]+=i[1],e[14]+=i[2]||0,n=e,i=LS}s.preprojected&&(i=LS,n=null,a=!1);let c=BS({viewport:e,devicePixelRatio:t,coordinateSystem:r,coordinateOrigin:i});return c.wrapLongitude=a,c.modelMatrix=n||IS,c}function WS({viewport:e,devicePixelRatio:t,coordinateSystem:n,coordinateOrigin:r}){let{projectionCenter:i,viewProjectionMatrix:a,originCommon:o,cameraPosCommon:s,shaderCoordinateOrigin:c,geospatialOrigin:l}=HS(e,n,r),u=e.getDistanceScales(),d=[e.width*t,e.height*t],f=Oc([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,p={coordinateFrame:RS(n,e),projectionMode:zS(e.projectionMode,n),coordinateOrigin:c,commonOrigin:o.slice(0,3),center:i,pseudoMeters:!!e._pseudoMeters,sizeScaleSize:1,sizeScaleTransform:[1,1,0,0],viewportSize:d,devicePixelRatio:t,focalDistance:f,commonUnitsPerMeter:u.unitsPerMeter,commonUnitsPerWorldUnit:u.unitsPerWorldUnit,commonUnitsPerWorldUnit2:u.unitsPerWorldUnit2,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:a,modelMatrix:IS,cameraPosition:s};if(l){let t=e.projectionMode===B.CUSTOM_GEOSPATIAL?e.crs.converter.WGS84.from(l):l,r=e.getDistanceScales(t);switch(n){case`meter-offsets`:p.commonUnitsPerWorldUnit=r.unitsPerMeter,p.commonUnitsPerWorldUnit2=r.unitsPerMeter2,e.projectionMode===B.CUSTOM_GEOSPATIAL&&(p.commonUnitsPerMeter=r.unitsPerMeter);break;case`lnglat`:case`lnglat-offsets`:e._pseudoMeters||(p.commonUnitsPerMeter=r.unitsPerMeter),p.commonUnitsPerWorldUnit=r.unitsPerWorldUnit,p.commonUnitsPerWorldUnit2=r.unitsPerWorldUnit2;break;case`cartesian`:p.commonUnitsPerWorldUnit=[1,1,r.unitsPerMeter[2]],p.commonUnitsPerWorldUnit2=[0,0,r.unitsPerMeter2[2]];break;default:break}}if(e.projectionMode===B.GLOBE&&n===`meter-offsets`){let e=r[0]*Math.PI/180,t=r[1]*Math.PI/180,n=Math.cos(t),i=((r[2]||0)/6370972+1)*256;p.commonOrigin=[Math.sin(e)*n*i,-Math.cos(e)*n*i,Math.sin(t)*i]}return p}var Q;(function(e){e[e.Start=1]=`Start`,e[e.Move=2]=`Move`,e[e.End=4]=`End`,e[e.Cancel=8]=`Cancel`})(Q||={});var GS;(function(e){e[e.None=0]=`None`,e[e.Left=1]=`Left`,e[e.Right=2]=`Right`,e[e.Up=4]=`Up`,e[e.Down=8]=`Down`,e[e.Horizontal=3]=`Horizontal`,e[e.Vertical=12]=`Vertical`,e[e.All=15]=`All`})(GS||={});var $;(function(e){e[e.Possible=1]=`Possible`,e[e.Began=2]=`Began`,e[e.Changed=4]=`Changed`,e[e.Ended=8]=`Ended`,e[e.Recognized=8]=`Recognized`,e[e.Cancelled=16]=`Cancelled`,e[e.Failed=32]=`Failed`})($||={});var KS=`auto`,qS=`manipulation`,JS=`none`,YS=`pan-x`,XS=`pan-y`;function ZS(e){if(e.includes(`none`))return JS;let t=e.includes(YS),n=e.includes(XS);return t&&n?JS:t||n?t?YS:XS:e.includes(`manipulation`)?qS:KS}var QS=class{constructor(e,t){this.actions=``,this.manager=e,this.set(t)}set(e){e===`compute`&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));return ZS(e.join(` `))}};function $S(e){return e.trim().split(/\s+/g)}function eC(e,t,n){if(e)for(let r of $S(t))e.addEventListener(r,n,!1)}function tC(e,t,n){if(e)for(let r of $S(t))e.removeEventListener(r,n,!1)}function nC(e){return(e.ownerDocument||e).defaultView}function rC(e,t){let n=e;for(;n;){if(n===t)return!0;n=n.parentNode}return!1}function iC(e){let t=e.length;if(t===1)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let n=0,r=0,i=0;for(;i<t;)n+=e[i].clientX,r+=e[i].clientY,i++;return{x:Math.round(n/t),y:Math.round(r/t)}}function aC(e){let t=[],n=0;for(;n<e.pointers.length;)t[n]={clientX:Math.round(e.pointers[n].clientX),clientY:Math.round(e.pointers[n].clientY)},n++;return{timeStamp:Date.now(),pointers:t,center:iC(t),deltaX:e.deltaX,deltaY:e.deltaY}}function oC(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.sqrt(n*n+r*r)}function sC(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.sqrt(n*n+r*r)}function cC(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.atan2(r,n)*180/Math.PI}function lC(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.atan2(r,n)*180/Math.PI}function uC(e,t){return e===t?GS.None:Math.abs(e)>=Math.abs(t)?e<0?GS.Left:GS.Right:t<0?GS.Up:GS.Down}function dC(e,t){let n=t.center,r=e.offsetDelta,i=e.prevDelta,a=e.prevInput;return(t.eventType===Q.Start||a?.eventType===Q.End)&&(i=e.prevDelta={x:a?.deltaX||0,y:a?.deltaY||0},r=e.offsetDelta={x:n.x,y:n.y}),{deltaX:i.x+(n.x-r.x),deltaY:i.y+(n.y-r.y)}}function fC(e,t,n){return{x:t/e||0,y:n/e||0}}function pC(e,t){return sC(t[0],t[1])/sC(e[0],e[1])}function mC(e,t){return lC(t[1],t[0])-lC(e[1],e[0])}function hC(e,t){let n=e.lastInterval||t,r=t.timeStamp-n.timeStamp,i,a,o,s;if(t.eventType!==Q.Cancel&&(r>25||n.velocity===void 0)){let c=t.deltaX-n.deltaX,l=t.deltaY-n.deltaY,u=fC(r,c,l);a=u.x,o=u.y,i=Math.abs(u.x)>Math.abs(u.y)?u.x:u.y,s=uC(c,l),e.lastInterval=t}else i=n.velocity,a=n.velocityX,o=n.velocityY,s=n.direction;t.velocity=i,t.velocityX=a,t.velocityY=o,t.direction=s}function gC(e,t){return`pointerId`in e?e.pointerId:t}function _C(e,t){e.movementOrigin=new Map(t.map((e,t)=>[gC(e,t),{clientX:e.clientX,clientY:e.clientY}])),e.firstMovementTime=void 0}function vC(e,t){let n=t.pointers.map(gC);if(e.movementOrigin?.size===n.length&&n.every(t=>e.movementOrigin.has(t))||_C(e,t.pointers),t.distancePerPointer=t.pointers.map((t,r)=>sC(e.movementOrigin.get(n[r]),t)),t.eventType&Q.Move&&t.distancePerPointer.some(e=>e>0)&&(e.firstMovementTime??=t.timeStamp),t.movementDeltaTime=e.firstMovementTime===void 0?0:t.timeStamp-e.firstMovementTime,t.eventType&(Q.End|Q.Cancel)){let r=t.changedPointers.map(e=>gC(e,t.pointers.indexOf(e)));_C(e,t.pointers.filter((e,t)=>!r.includes(n[t])))}}function yC(e,t){let{session:n}=e,{pointers:r}=t,{length:i}=r;n.firstInput||=aC(t),i>1&&!n.firstMultiple?n.firstMultiple=aC(t):i===1&&(n.firstMultiple=!1);let{firstInput:a,firstMultiple:o}=n,s=o?o.center:a.center,c=t.center=iC(r);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-a.timeStamp,vC(n,t),t.angle=cC(s,c),t.distance=oC(s,c);let{deltaX:l,deltaY:u}=dC(n,t);t.deltaX=l,t.deltaY=u,t.offsetDirection=uC(t.deltaX,t.deltaY);let d=fC(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=d.x,t.overallVelocityY=d.y,t.overallVelocity=Math.abs(d.x)>Math.abs(d.y)?d.x:d.y,t.scale=o?pC(o.pointers,r):1,t.rotation=o?mC(o.pointers,r):0,t.maxPointers=n.prevInput?t.pointers.length>n.prevInput.maxPointers?t.pointers.length:n.prevInput.maxPointers:t.pointers.length;let f=e.element;return rC(t.srcEvent.target,f)&&(f=t.srcEvent.target),t.target=f,hC(n,t),t}function bC(e,t,n){let r=n.pointers.length,i=n.changedPointers.length,a=t&Q.Start&&r-i===0,o=t&(Q.End|Q.Cancel)&&r-i===0;n.isFirst=!!a,n.isFinal=!!o,a&&(e.session={}),n.eventType=t;let s=yC(e,n);e.emit(`hammer.input`,s),e.recognize(s),e.session.prevInput=s}var xC=class{constructor(e){this.evEl=``,this.evWin=``,this.evTarget=``,this.domHandler=e=>{this.manager.options.enable&&this.handler(e)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){bC(this.manager,e,t)}init(){eC(this.element,this.evEl,this.domHandler),eC(this.target,this.evTarget,this.domHandler),eC(nC(this.element),this.evWin,this.domHandler)}destroy(){tC(this.element,this.evEl,this.domHandler),tC(this.target,this.evTarget,this.domHandler),tC(nC(this.element),this.evWin,this.domHandler)}},SC={pointerdown:Q.Start,pointermove:Q.Move,pointerup:Q.End,pointercancel:Q.Cancel,pointerout:Q.Cancel},CC=`pointerdown`,wC=`pointermove pointerup pointercancel`,TC=class extends xC{constructor(e){super(e),this.evEl=CC,this.evWin=wC,this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,n=!1,r=SC[e.type],i=e.pointerType,a=i===`touch`,o=t.findIndex(t=>t.pointerId===e.pointerId);r&Q.Start&&(e.buttons||a)?o<0&&(t.push(e),o=t.length-1):r&(Q.End|Q.Cancel)&&(n=!0),!(o<0)&&(t[o]=e,this.callback(r,{pointers:t,changedPointers:[e],eventType:r,pointerType:i,srcEvent:e}),n&&t.splice(o,1))}},EC=[``,`webkit`,`Moz`,`MS`,`ms`,`o`];function DC(e,t){let n=t[0].toUpperCase()+t.slice(1);for(let r of EC){let i=r?r+n:t;if(i in e)return i}}var OC=1,kC=2,AC={touchAction:`compute`,enable:!0,inputTarget:null,cssProps:{userSelect:`none`,userDrag:`none`,touchCallout:`none`,tapHighlightColor:`rgba(0,0,0,0)`}},jC=class{constructor(e,t){this.options={...AC,...t,cssProps:{...AC.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new TC(this),this.touchAction=new QS(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?kC:OC}recognize(e){let{session:t}=this;if(t.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let n,{recognizers:r}=this,{curRecognizer:i}=t;(!i||i&&i.state&$.Recognized)&&(i=t.curRecognizer=null);let a=0;for(;a<r.length;)n=r[a],t.stopped!==kC&&(!i||n===i||n.canRecognizeWith(i))?n.recognize(e):n.reset(),!i&&n.state&($.Began|$.Changed|$.Ended)&&(i=t.curRecognizer=n),a++}get(e){let{recognizers:t}=this;for(let n=0;n<t.length;n++)if(t[n].options.event===e)return t[n];return null}add(e){if(Array.isArray(e)){for(let t of e)this.add(t);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let t of e)this.remove(t);return this}let t=typeof e==`string`?this.get(e):e;if(t){let{recognizers:e}=this,n=e.indexOf(t);n!==-1&&(e.splice(n,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:n}=this;for(let r of $S(e))n[r]=n[r]||[],n[r].push(t)}off(e,t){if(!e)return;let{handlers:n}=this;for(let r of $S(e))t?n[r]&&n[r].splice(n[r].indexOf(t),1):delete n[r]}emit(e,t){let n=this.handlers[e]&&this.handlers[e].slice();if(!n||!n.length)return;let r=t;r.type=e,r.preventDefault=function(){t.srcEvent.preventDefault()};let i=0;for(;i<n.length;)n[i](r),i++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[n,r]of Object.entries(this.options.cssProps)){let i=DC(t.style,n);e?(this.oldCssProps[i]=t.style[i],t.style[i]=r):t.style[i]=this.oldCssProps[i]||``}e||(this.oldCssProps={})}}},MC=1;function NC(){return MC++}function PC(e){return e&$.Cancelled?`cancel`:e&$.Ended?`end`:e&$.Changed?`move`:e&$.Began?`start`:``}var FC=class{constructor(e){this.options=e,this.id=NC(),this.state=$.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){if(Array.isArray(e)){for(let t of e)this.recognizeWith(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:n}=this;return n[t.id]||(n[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){if(Array.isArray(e)){for(let t of e)this.dropRecognizeWith(t);return this}let t;return t=typeof e==`string`?this.manager.get(e):e,t&&delete this.simultaneous[t.id],this}requireFailure(e){if(Array.isArray(e)){for(let t of e)this.requireFailure(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:n}=this;return n.indexOf(t)===-1&&(n.push(t),t.requireFailure(this)),this}dropRequireFailure(e){if(Array.isArray(e)){for(let t of e)this.dropRequireFailure(t);return this}let t;if(t=typeof e==`string`?this.manager.get(e):e,t){let e=this.requireFail.indexOf(t);e>-1&&this.requireFail.splice(e,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<$.Ended&&this.manager.emit(this.options.event+PC(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=$.Ended&&this.manager.emit(this.options.event+PC(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=$.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&($.Failed|$.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=$.Failed;return}this.state&($.Recognized|$.Cancelled|$.Failed)&&(this.state=$.Possible),this.state=this.process(t),this.state&($.Began|$.Changed|$.Ended|$.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}};function IC(e){return Math.abs(((e+180)%360+360)%360-180)}function LC(e,t){return(t.distance===void 0||e.distance>=t.distance)&&(t.distancePerPointer===void 0||e.distancePerPointer.length>0&&e.distancePerPointer.every(e=>e>=t.distancePerPointer))&&(t.movementDeltaTime===void 0||e.movementDeltaTime>=t.movementDeltaTime)&&(t.rotation===void 0||IC(e.rotation)>=t.rotation)&&(t.scale===void 0||Math.abs(e.scale-1)>=t.scale)}var RC=class extends FC{attrTest(e){let t=this.options.pointers;return t===0||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(t=>LC(e,t))}process(e){let{state:t}=this,{eventType:n}=e,r=t&($.Began|$.Changed),i=this.attrTest(e);return r&&(n&Q.Cancel||!i)?t|$.Cancelled:r||i?n&Q.End?t|$.Ended:t&$.Began?t|$.Changed:$.Began:$.Failed}},zC=[``,`start`,`move`,`end`,`cancel`],BC=class extends FC{constructor(e={}){super({enable:!0,event:`doubleclickdrag`,pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[qS]}getEventNames(){return zC.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length===t.pointers?e.eventType&Q.Start?this._handleStart(e):e.eventType&Q.Move?this._handleMove(e):e.eventType&Q.Cancel?this._handleEnd(e,!0):e.eventType&Q.End?this._handleEnd(e,!1):$.Failed:(this.reset(),$.Failed)}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===$.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===$.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===$.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===$.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,$.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,$.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return $.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?$.Began:(this._drag.active=!0,e.scale=2**(t/this.options.pixelsPerScale),this._emittedStart?$.Changed:$.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:n,startCenter:r}=this._drag;return this._drag=null,this._tapStart=null,this._lastTap=null,n?(e.scale=2**((r.y-e.center.y)/this.options.pixelsPerScale),t?$.Cancelled:$.Ended):(this._emittedStart=!1,$.Failed)}return!this._tapStart||!this._isSamePointer(e,this._tapStart.pointerId)?(t&&this.reset(),$.Failed):(this._isValidTap(e)?this._lastTap={center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null,$.Failed)}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&oC(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return`pointerId`in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return t===null||this._getPointerId(e)===t}},VC=class extends FC{constructor(e={}){super({enable:!0,event:`tap`,pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[qS]}process(e){let{options:t}=this,n=e.pointers.length===t.pointers,r=e.distance<t.threshold,i=e.deltaTime<t.time;if(this.reset(),e.eventType&Q.Start&&this.count===0)return this.failTimeout();if(r&&i&&n){if(e.eventType!==Q.End)return this.failTimeout();let n=this.pTime?e.timeStamp-this.pTime<t.interval:!0,r=!this.pCenter||oC(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,!r||!n?this.count=1:this.count+=1,this._input=e,this.count%t.taps===0)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=$.Recognized,this.tryEmit(this._input)},t.interval),$.Began):$.Recognized}return $.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=$.Failed},this.options.interval),$.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===$.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}},HC=class extends RC{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{e.device===`trackpad`&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...n}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(n),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:n}=e,r=t.deltaX??e.deltaX,i=t.deltaY??e.deltaY,a=uC(r,i),o=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY),s=n;return{pointers:[s,s],changedPointers:[s,s],pointerType:`trackpad`,srcEvent:s,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:r,deltaY:i,angle:Math.atan2(i,r)*180/Math.PI,distance:Math.sqrt(r*r+i*i),distancePerPointer:[o,o],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:a,offsetDirection:a,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:n.target||this.manager.element,additionalEvent:``,...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&this.options.pointers===2);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}},UC=[``,`start`,`move`,`end`,`cancel`,`up`,`down`,`left`,`right`],WC=class extends HC{constructor(e={}){super({enable:!0,pointers:1,event:`pan`,threshold:10,direction:GS.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&GS.Horizontal&&t.push(XS),e&GS.Vertical&&t.push(YS),t}getEventNames(){return UC.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,n=!0,{distance:r}=e,{direction:i}=e,a=e.deltaX,o=e.deltaY;return i&t.direction||(t.direction&GS.Horizontal?(i=a===0?GS.None:a<0?GS.Left:GS.Right,n=a!==this.pX,r=Math.abs(e.deltaX)):(i=o===0?GS.None:o<0?GS.Up:GS.Down,n=o!==this.pY,r=Math.abs(e.deltaY))),e.direction=i,n&&r>t.threshold&&!!(i&t.direction)}attrTest(e){let t=!!(this.state&$.Began),n=!(this.options.coherent?.length&&e.eventType&(Q.End|Q.Cancel));return super.attrTest(e)&&(t||n&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=GS[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&($.Recognized|$.Cancelled|$.Failed)&&(this.state=$.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}},GC=[``,`start`,`move`,`end`,`cancel`,`in`,`out`],KC=class extends HC{constructor(e={}){super({enable:!0,event:`pinch`,threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return[JS]}getEventNames(){return GC.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,n=!!(this.state&$.Began),r=!(t&&e.eventType&(Q.End|Q.Cancel));return super.attrTest(e)&&(n||r&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(e.scale!==1){let t=e.scale<1?`in`:`out`;e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&($.Recognized|$.Cancelled|$.Failed)&&(this.state=$.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}},qC=class{constructor(e,t,n){this.element=e,this.callback=t,this.options=n}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}},JC=(typeof navigator<`u`&&navigator.userAgent?navigator.userAgent.toLowerCase():``).indexOf(`firefox`)!==-1,YC=40,XC=.25,ZC=class extends qC{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{if(!this.options.enable)return;let t=e.deltaY;globalThis.WheelEvent&&(JC&&e.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(t/=globalThis.devicePixelRatio),e.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(t*=YC)),e.shiftKey&&t&&(t*=XC),this.callback({type:`wheel`,center:{x:e.clientX,y:e.clientY},delta:-t,device:this.options.wheelSession?.device??`unknown`,srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen(`wheel`,!0))}destroy(){this.listen(`wheel`,!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){e===`wheel`&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen(`wheel`,t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}},QC=4.000244140625,$C=40,ew=0,tw=1,nw=40,rw=40,iw=120,aw={classificationDelay:32,endDelay:80},ow=class{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=e=>{if(!this.hasSubscribers)return`unknown`;let t=cw(e,this.pressedControlKeys.size>0),n=this.session;if(n&&t.timeStamp-n.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return`unknown`;n=null}n?(this.scheduleEnd(),this.addSample(n,t)):(n=this.startPendingSession(t),this.scheduleEnd());let{device:r}=n;return r===`unknown`&&(r=lw(n.samples,!1),r!==`unknown`&&this.begin(n,r)),r},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||this.session.device!==`unknown`)return;let e=this.session,t=lw(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)},this.end=()=>{if(!this.session)return;if(this.session.device===`unknown`){let e=this.session,t=lw(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)}if(!this.session)return;let e=this.session;this.emit(Q.End,e.lastEvent),this.reset()},this.handleKeyDown=e=>{e.key===`Control`&&this.pressedControlKeys.add(e.code||e.key)},this.handleKeyUp=e=>{e.key===`Control`&&(e.code?this.pressedControlKeys.delete(e.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...aw,...t},this.element?.addEventListener(`wheel`,this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??`unknown`}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&e.device!==`unknown`&&this.emit(Q.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener(`wheel`,this.handleEvent)}startPendingSession(e){let t={samples:[e],device:`unknown`,firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,e.device!==`unknown`){let n=e.samples[e.samples.length-2],r=t.timeStamp-n.timeStamp;e.velocityX=r>0?t.deltaX/r:0,e.velocityY=r>0?t.deltaY/r:0,this.emit(Q.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(Q.Start,e.samples[0].event);let n=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=n>0?e.totalDeltaX/n:0,e.velocityY=n>0?e.totalDeltaY/n:0,this.emit(Q.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,n){let r=this.session;if(!r||r.device===`unknown`)return;let i=e===Q.Start,a=e===Q.End||e===Q.Cancel,o=i?r.firstTimeStamp:r.lastTimeStamp,s=i?0:Math.max(0,o-r.firstTimeStamp),c=i?0:r.totalDeltaX,l=i?0:r.totalDeltaY,u=s>0?c/s:0,d=s>0?l/s:0,f=i?0:n?.velocityX??r.velocityX,p=i?0:n?.velocityY??r.velocityY,m={eventType:e,device:r.device,srcEvent:t,timeStamp:o,center:{x:t.clientX,y:t.clientY},deltaX:c,deltaY:l,deltaTime:s,velocity:Math.abs(f)>Math.abs(p)?f:p,velocityX:f,velocityY:p,overallVelocity:Math.abs(u)>Math.abs(d)?u:d,overallVelocityX:u,overallVelocityY:d,isFirst:i,isFinal:a};for(let{listener:e}of[...this.subscriptions.values()])e(m)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){this.classificationTimer!==null&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){this.endTimer!==null&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t=sw();!t||e===this.listeningForControlKeys||(this.listeningForControlKeys=e,e?(t.addEventListener(`keydown`,this.handleKeyDown,!0),t.addEventListener(`keyup`,this.handleKeyUp,!0),t.addEventListener(`blur`,this.handleWindowBlur)):(t.removeEventListener(`keydown`,this.handleKeyDown,!0),t.removeEventListener(`keyup`,this.handleKeyUp,!0),t.removeEventListener(`blur`,this.handleWindowBlur),this.pressedControlKeys.clear()))}};function sw(){return typeof window<`u`?window:globalThis.document?.defaultView}function cw(e,t){let n=e.deltaX,r=e.deltaY;return e.deltaMode===tw&&(n*=$C,r*=$C),{event:e,timeStamp:e.timeStamp,deltaX:n,deltaY:r,isControlKeyDown:t}}function lw(e,t){return e.some(({event:e,isControlKeyDown:t})=>e.ctrlKey&&!t)?`trackpad`:e.some(({event:e})=>e.deltaMode!==ew)||e.some(uw)||e.every(({event:e})=>{let t=e.wheelDelta;return t!==void 0&&Math.abs(t)%40==0})?`mouse`:e.some(({deltaX:e})=>e!==0)||e.length>1&&dw(e)?`trackpad`:t?`mouse`:`unknown`}function uw({event:e,deltaX:t,deltaY:n}){if(t!==0||n===0)return!1;let r=Math.abs(n/QC);if(Number.isInteger(r))return!0;let i=e.wheelDelta;return typeof i==`number`&&i!==0&&i%iw===0}function dw(e){for(let t=0;t<e.length;t++){let n=e[t];if(Math.abs(n.deltaX)>rw||Math.abs(n.deltaY)>rw||t>0&&n.timeStamp-e[t-1].timeStamp>nw)return!1}return!0}var fw=[`mousedown`,`mousemove`,`mouseup`,`mouseover`,`mouseout`,`mouseenter`,`mouseleave`],pw=class extends qC{constructor(e,t,n){super(e,t,{enable:!0,...n}),this.handleEvent=e=>{this.handleOverEvent(e),this.handleOutEvent(e),this.handleEnterEvent(e),this.handleLeaveEvent(e),this.handleMoveEvent(e)},this.pressed=!1;let{enable:r=!1}=this.options;this.enableMoveEvent=r,this.enableLeaveEvent=r,this.enableEnterEvent=r,this.enableOutEvent=r,this.enableOverEvent=r,r&&fw.forEach(e=>this.listen(e,!0))}destroy(){fw.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case`pointermove`:this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen(`mousedown`,t),this.listen(`mousemove`,t),this.listen(`mouseup`,t));break;case`pointerover`:this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen(`mouseover`,t));break;case`pointerout`:this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen(`mouseout`,t));break;case`pointerenter`:this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen(`mouseenter`,t));break;case`pointerleave`:this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen(`mouseleave`,t));break;default:}}handleOverEvent(e){this.enableOverEvent&&e.type===`mouseover`&&this._emit(`pointerover`,e)}handleOutEvent(e){this.enableOutEvent&&e.type===`mouseout`&&this._emit(`pointerout`,e)}handleEnterEvent(e){this.enableEnterEvent&&e.type===`mouseenter`&&this._emit(`pointerenter`,e)}handleLeaveEvent(e){this.enableLeaveEvent&&e.type===`mouseleave`&&this._emit(`pointerleave`,e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case`mousedown`:e.button>=0&&(this.pressed=!0);break;case`mousemove`:e.buttons===0&&(this.pressed=!1),this.pressed||this._emit(`pointermove`,e);break;case`mouseup`:this.pressed=!1;break;default:}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:`mouse`,target:t.target})}},mw=[`keydown`,`keyup`],hw=class extends qC{constructor(e,t,n){super(e,t,{enable:!0,tabIndex:0,...n}),this.handleEvent=e=>{let t=e.target||e.srcElement;t.tagName===`INPUT`&&t.type===`text`||t.tagName===`TEXTAREA`||(this.enableDownEvent&&e.type===`keydown`&&this.callback({type:`keydown`,srcEvent:e,key:e.key,target:e.target}),this.enableUpEvent&&e.type===`keyup`&&this.callback({type:`keyup`,srcEvent:e,key:e.key,target:e.target}))};let{enable:r=!1}=this.options;this.enableDownEvent=r,this.enableUpEvent=r,e.tabIndex=this.options.tabIndex,e.style.outline=`none`,r&&mw.forEach(e=>this.listen(e,!0))}destroy(){mw.forEach(e=>this.listen(e,!1))}enableEventType(e,t){e===`keydown`&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),e===`keyup`&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}},gw=class extends qC{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{this.options.enable&&this.callback({type:`contextmenu`,center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&this.listen(`contextmenu`,!0)}destroy(){this.listen(`contextmenu`,!1)}enableEventType(e,t){e===`contextmenu`&&this.options.enable!==t&&(this.options.enable=t,this.listen(`contextmenu`,t))}},_w=1,vw=2,yw=4,bw={pointerdown:_w,pointermove:vw,pointerup:yw,mousedown:_w,mousemove:vw,mouseup:yw},xw=0,Sw=1,Cw=2,ww=1,Tw=2,Ew=4;function Dw(e){let t=bw[e.srcEvent.type];if(!t)return null;let{buttons:n,button:r}=e.srcEvent,i=!1,a=!1,o=!1;return t===vw?(i=!!(n&ww),a=!!(n&Ew),o=!!(n&Tw)):(i=r===xw,a=r===Sw,o=r===Cw),{leftButton:i,middleButton:a,rightButton:o}}function Ow(e,t){let n=e.center;if(!n)return null;let r=t.getBoundingClientRect(),i=r.width/t.offsetWidth||1,a=r.height/t.offsetHeight||1;return{center:n,offsetCenter:{x:(n.x-r.left-t.clientLeft)/i,y:(n.y-r.top-t.clientTop)/a}}}var kw={srcElement:`root`,priority:0},Aw=class{constructor(e,t){this.handleEvent=e=>{if(this.isEmpty())return;let t=this._normalizeEvent(e),n=e.srcEvent.target;for(;n&&n!==t.rootElement;){if(this._emit(t,n),t.handled)return;n=n.parentNode}this._emit(t,`root`)},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,n,r=!1,i=!1){let{handlers:a,handlersByElement:o}=this,s={...kw,...n},c=o.get(s.srcElement);c||(c=[],o.set(s.srcElement,c));let l={type:e,handler:t,srcElement:s.srcElement,priority:s.priority};r&&(l.once=!0),i&&(l.passive=!0),a.push(l),this._active=this._active||!l.passive;let u=c.length-1;for(;u>=0&&!(c[u].priority>=l.priority);)u--;c.splice(u+1,0,l)}remove(e,t){let{handlers:n,handlersByElement:r}=this;for(let i=n.length-1;i>=0;i--){let a=n[i];if(a.type===e&&a.handler===t){n.splice(i,1);let e=r.get(a.srcElement);e.splice(e.indexOf(a),1),e.length===0&&r.delete(a.srcElement)}}this._active=n.some(e=>!e.passive)}_emit(e,t){let n=this.handlersByElement.get(t);if(n){let t=!1,r=()=>{e.handled=!0},i=()=>{e.handled=!0,t=!0},a=[];for(let o=0;o<n.length;o++){let{type:s,handler:c,once:l}=n[o];if(c({...e,type:s,stopPropagation:r,stopImmediatePropagation:i}),l&&a.push(n[o]),t)break}for(let e=0;e<a.length;e++){let{type:t,handler:n}=a[e];this.remove(t,n)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...Dw(e),...Ow(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}};function jw(e){if(`recognizer`in e)return e;let t,n=Array.isArray(e)?[...e]:[e];return t=typeof n[0]==`function`?new(n.shift())(n.shift()||{}):n.shift(),{recognizer:t,recognizeWith:typeof n[0]==`string`?[n[0]]:n[0],requireFailure:typeof n[1]==`string`?[n[1]]:n[1]}}var Mw=class{constructor(e=null,t={}){if(this._onBasicInput=e=>{this.manager.emit(e.srcEvent.type,e)},this._onOtherEvent=e=>{this.manager.emit(e.type,e)},this.options={recognizers:[],events:{},touchAction:`compute`,tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new ow(e),e){this.manager=new jC(e,this.options);for(let e of this.options.recognizers){let{recognizer:t,recognizeWith:n,requireFailure:r}=jw(e);this.manager.add(t),n&&t.recognizeWith(n),r&&t.requireFailure(r)}this.manager.on(`hammer.input`,this._onBasicInput),this.wheelInput=new ZC(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new pw(e,this._onOtherEvent,{enable:!1}),this.keyInput=new hw(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new gw(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}}getElement(){return this.element}destroy(){if(!this.element){this.wheelSession.destroy();return}this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()}on(e,t,n){this._addEventHandler(e,t,n,!1)}once(e,t,n){this._addEventHandler(e,t,n,!0)}watch(e,t,n){this._addEventHandler(e,t,n,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:n}=this;if(!n)return;let r=n.get(e);r&&(r.set({enable:t,wheelSession:this.wheelSession}),n.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,n,r,i){if(typeof e!=`string`){n=t;for(let[t,a]of Object.entries(e))this._addEventHandler(t,a,n,r,i);return}let{manager:a,events:o}=this;if(!a)return;let s=o.get(e);if(!s){let t=this._getRecognizerName(e)||e;s=new Aw(this,t),o.set(e,s),a&&a.on(e,s.handleEvent)}s.add(e,t,n,r,i),s.isEmpty()||this._toggleRecognizer(s.recognizerName,!0)}_removeEventHandler(e,t){if(typeof e!=`string`){for(let[t,n]of Object.entries(e))this._removeEventHandler(t,n);return}let{events:n}=this,r=n.get(e);if(r&&(r.remove(e,t),r.isEmpty())){let{recognizerName:e}=r,t=!1;for(let r of n.values())if(r.recognizerName===e&&!r.isEmpty()){t=!0;break}t||this._toggleRecognizer(e,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}},Nw={common:0,meters:1,pixels:2},Pw={click:`onClick`,dblclick:`onClick`,panstart:`onDragStart`,panmove:`onDrag`,panend:`onDragEnd`},Fw={multipan:[WC,{threshold:10,pointers:2,trackpad:!0}],pinch:[KC,{trackpad:!0},null,[`multipan`]],pan:[WC,{threshold:1},[`pinch`],[`multipan`]],dblclick:[VC,{event:`dblclick`,taps:2,enable:!1}],dblclickdrag:[BC,{event:`dblclickdrag`,enable:!1},[`dblclick`],null],click:[VC,{event:`click`},[`dblclickdrag`],[`dblclick`,`dblclickdrag`]]},Iw=`\
${`\
${Object.entries(fp).map(([e,t])=>`const COORDINATE_SYSTEM_${e}: i32 = ${t};`).join(``)}
${Object.keys(B).map(e=>`const PROJECTION_MODE_${e}: i32 = ${B[e]};`).join(``)}
${Object.keys(Nw).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${Nw[e]};`).join(``)}

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
  coordinateFrame: i32,
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
  sizeScaleSize: i32,
  sizeScaleTransform: vec4<f32>,
};

@group(0) @binding(auto)
var<uniform> project: ProjectUniforms;

#ifdef USE_EXTERNAL_PROJECTION
@group(0) @binding(auto)
var<storage, read> project_sizeScaleBuffer: array<vec4<f32>>;
#endif

// -----------------------------------------------------------------------------
// Geometry data shared across the project helpers.
// The active layer shader is responsible for populating this private module
// state before calling the project functions below.
// -----------------------------------------------------------------------------

alias Geometry = VertexGeometry;
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
      project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC &&
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

#ifdef USE_EXTERNAL_PROJECTION
// Nearest-record Taylor reconstruction: x=scalar XY scale, yz=slopes per sampler
// unit, w=Z scale. x=0 marks invalid samples. One load preserves instance aspect ratio.
// Alternatives if discontinuities/accuracy become visible: blend four local Taylor
// estimates for continuity, or use four-fetch bicubic Hermite with a mixed derivative
// for higher accuracy (which would require moving Z scale out of w).
fn project_external_size_scale_at(mapPosition: vec2<f32>) -> vec3<f32> {
  if (project.sizeScaleSize <= 0) { return project.commonUnitsPerMeter; }
  let samplePosition = mapPosition * project.sizeScaleTransform.xy + project.sizeScaleTransform.zw;
  if (any(samplePosition < vec2<f32>(0.0)) || any(samplePosition > vec2<f32>(512.0))) {
    return project.commonUnitsPerMeter;
  }
  let dimensions = vec2<i32>(project.sizeScaleSize);
  let index = clamp(vec2<i32>(floor(samplePosition / 512.0 * vec2<f32>(dimensions))),
    vec2<i32>(0), dimensions - 1);
  let record = project_sizeScaleBuffer[u32(index.y * project.sizeScaleSize + index.x)];
  if (record.x <= 0.0) { return project.commonUnitsPerMeter; }
  let center = (vec2<f32>(index) + 0.5) * 512.0 / vec2<f32>(dimensions);
  var scale = record.x + dot(record.yz, samplePosition - center);
  // This bound rejects non-finite reconstructions without WGSL classification builtins.
  if (!(scale > 0.0 && scale <= 3.4028234663852886e38)) { scale = record.x; }
  return vec3<f32>(scale, scale, record.w * scale / record.x) * project.commonUnitsPerWorldUnit;
}

fn project_external_size_scale() -> vec3<f32> {
  return project_external_size_scale_at(select((project.modelMatrix * vec4<f32>(geometry.worldPosition, 1.0)).xy + project.commonOrigin.xy / project.commonUnitsPerWorldUnit.xy - project.coordinateOrigin.xy,
    (geometry.position.xy + project.commonOrigin.xy) / project.commonUnitsPerWorldUnit.xy, geometry.position.w != 0.0));
}

#endif

// Overloads to scale offsets (meters to world units)
fn project_size_float(meters: f32) -> f32 {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) { return meters * project_external_size_scale().z; }
#endif
  return meters * project.commonUnitsPerMeter.z * project_size();
}

fn project_size_vec2(meters: vec2<f32>) -> vec2<f32> {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) { return meters * project_external_size_scale().xy; }
#endif
  return meters * project.commonUnitsPerMeter.xy * project_size();
}

fn project_size_vec3(meters: vec3<f32>) -> vec3<f32> {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) { return meters * project_external_size_scale(); }
#endif
  return meters * project.commonUnitsPerMeter * project_size();
}

fn project_size_vec4(meters: vec4<f32>) -> vec4<f32> {
#ifdef USE_EXTERNAL_PROJECTION
  if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) {
    return vec4<f32>(meters.xyz * project_external_size_scale(), meters.w);
  }
#endif
  return vec4<f32>(meters.xyz * project.commonUnitsPerMeter, meters.w);
}

// Returns a rotation matrix aligning the z‑axis with the given up vector.
// On the globe, ux points east and uy north. Longitude 0 lies on -y and the north pole on +z.
// At a pole, ux is the limit of east along the longitude that up retains; it is +x only when up
// lies exactly on the polar axis.
fn project_get_orientation_matrix(up: vec3<f32>) -> mat3x3<f32> {
  let uz = normalize(up);
  // Tangent on XY plane
  let horizontalLength = length(uz.xy);
  var ux = vec3<f32>(1.0, 0.0, 0.0);
  if (horizontalLength > 0.0) {
    ux = vec3<f32>(-uz.y, uz.x, 0.0) / horizontalLength;
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
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
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
  // Preserve longitude at the poles despite GPU cosine rounding to zero or negative.
  var cosPhi = cos(phi);
  if (abs(lnglatz.y) == 90.0) { cosPhi = max(abs(cosPhi), 1e-7); }
  let D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
  return vec3<f32>(
    sin(lambda) * cosPhi,
    -cos(lambda) * cosPhi,
    sin(phi)
  ) * D;
}

// Mercator y of project_mercator_'s latitude clamp: log(tan(PI / 4 + radians(89.9) / 2))
const MAX_MERCATOR_Y: f32 = 7.0439589847;

// Inverse of project_globe_ followed by project_mercator_, without forming lat/lng:
// Mercator y = atanh(sin(lat)) = log((D + |z|) / |xy|), which stays accurate near the poles
fn project_globe_to_mercator_(spherePos: vec3<f32>) -> vec2<f32> {
  let D = length(spherePos);
  let h = max(length(spherePos.xy), 1e-20);
  let y = sign(spherePos.z) * min(log((D + abs(spherePos.z)) / h), MAX_MERCATOR_Y);
  let x = atan2(spherePos.x, -spherePos.y);
  return (vec2<f32>(x, y) + PI) * WORLD_SCALE;
}

// Flat common space (Mercator or cartesian) of a common position; identity except under GLOBE.
// WGSL has no function overloading: pass position.xyz for a vec4. See project.glsl.ts.
fn project_common_position_to_flat(commonPosition: vec3<f32>) -> vec2<f32> {
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    return project_globe_to_mercator_(commonPosition);
  }
  return commonPosition.xy;
}

// World copy of a flat x nearest to referenceX
fn project_wrap_flat_x_(x: f32, referenceX: f32) -> f32 {
  return x - TILE_SIZE * floor((x - referenceX) / TILE_SIZE + 0.5);
}

// Flat position in the world copy nearest to referenceX (e.g. a bounds centre); geospatial only
fn project_common_position_to_flat_wrapped(commonPosition: vec3<f32>, referenceX: f32) -> vec2<f32> {
  var flatPosition = project_common_position_to_flat(commonPosition);
  if (project.projectionMode != PROJECTION_MODE_IDENTITY) {
    flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
  }
  return flatPosition;
}

// Flat position continuous across the antimeridian under GLOBE (seam moved opposite referenceX,
// e.g. the camera); identity for flat modes. For periodic patterns.
fn project_common_position_to_flat_continuous(commonPosition: vec3<f32>, referenceX: f32) -> vec2<f32> {
  var flatPosition = project_common_position_to_flat(commonPosition);
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
  }
  return flatPosition;
}

// Projects positions (with an optional 64-bit low part) from the input
// coordinate system to the common space.
fn project_position_vec4_f64(position: vec4<f32>, position64Low: vec3<f32>) -> vec4<f32> {
  var position_world = project.modelMatrix * position;

  // Work around for a Mac+NVIDIA bug:
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
      return vec4<f32>(
        project_mercator_(position_world.xy),
        _project_size_at_latitude_m(position_world.z, position_world.y),
        position_world.w
      );
    }
    if (project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED) {
      position_world = vec4f(position_world.xyz + project.coordinateOrigin, position_world.w);
    }
  }
  if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEOCENTRIC) {
      // Globe-centered Cartesian XYZ are meters, not longitude/latitude.
      let position_low = project.modelMatrix * vec4<f32>(position64Low, 0.0);
      return vec4<f32>(
        position_world.xyz * project.commonUnitsPerMeter + position_low.xyz * project.commonUnitsPerMeter,
        position_world.w
      );
    }
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
      return vec4<f32>(
        project_globe_(position_world.xyz),
        position_world.w
      );
    }
    if (project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS) {
      let enuMatrix = project_get_orientation_matrix(project.commonOrigin);
      let offsetCommon = (enuMatrix * position_world.xyz) * project.commonUnitsPerMeter;
      return vec4<f32>(project.commonOrigin + offsetCommon, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
    if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
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
      project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL ||
      (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
       (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC ||
        project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED))) {
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

// True when the globe hides commonPosition from the camera: the segment from the camera to the
// position passes through the sphere. Exact at any altitude. Always false for flat projections.
fn project_globe_is_occluded(commonPosition: vec3<f32>) -> bool {
  if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    return false;
  }
  let eye = project.cameraPosition;
  let ray = commonPosition - eye;
  let rayLength2 = dot(ray, ray);
  if (rayLength2 == 0.0) {
    return false;
  }
  let t = clamp(-dot(eye, ray) / rayLength2, 0.0, 1.0);
  let closest = eye + ray * t;
  return t < 1.0 && dot(closest, closest) < GLOBE_RADIUS * GLOBE_RADIUS;
}

// Distance from eye along the unit direction to the first globe surface point, or fallback
fn project_globe_ray_distance_(eye: vec3<f32>, direction: vec3<f32>, fallback: f32) -> f32 {
  let b = dot(eye, direction);
  let discriminant = b * b - dot(eye, eye) + GLOBE_RADIUS * GLOBE_RADIUS;
  if (discriminant < 0.0) {
    return fallback;
  }
  let distance = -b - sqrt(discriminant);
  return select(fallback, distance, distance > 0.0);
}

// Screen-space radius, in pixels, that a billboard is assumed to cover around its anchor
const GLOBE_BILLBOARD_FOOTPRINT_PIXELS: f32 = 64.0;

// Clip-space position for a billboard anchored at commonPosition. Under GLOBE the billboard is
// moved toward the camera by the amount the globe surface rises within its footprint, so the
// curve of the globe does not clip a sprite whose anchor is visible. The shift is zero where the
// surface faces the camera and grows with the grazing angle, about 1.8 km at zoom 12 with pitch
// 60, so other 3D geometry that is in front of the anchor by less than the shift no longer hides
// the sprite. Pair with project_globe_is_occluded. Identity for flat projections.
fn project_globe_billboard_clipspace(clipPosition: vec4<f32>, commonPosition: vec3<f32>) -> vec4<f32> {
  if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
    return clipPosition;
  }
  let eye = project.cameraPosition;
  let ray = commonPosition - eye;
  let anchorDistance = length(ray);
  if (anchorDistance == 0.0) {
    return clipPosition;
  }
  let direction = ray / anchorDistance;
  // On screen, the surface is nearest toward the point of the globe below the camera
  let inward = -eye - dot(-eye, direction) * direction;
  let inwardLength = length(inward);
  if (inwardLength == 0.0) {
    return clipPosition;
  }
  // Ray through the inward edge of the footprint
  let footprint = project_pixel_size_float(GLOBE_BILLBOARD_FOOTPRINT_PIXELS);
  let edgeDirection = normalize(ray + inward / inwardLength * footprint);
  let surfaceDistance = project_globe_ray_distance_(eye, direction, anchorDistance);
  let edgeDistance = project_globe_ray_distance_(eye, edgeDirection, surfaceDistance);
  let shift = surfaceDistance - edgeDistance;
  if (shift <= 0.0) {
    return clipPosition;
  }
  let shiftedClip = project_common_position_to_clipspace(vec4<f32>(commonPosition - direction * shift, 1.0));
  return vec4<f32>(clipPosition.xy, shiftedClip.z / shiftedClip.w * clipPosition.w, clipPosition.w);
}
`,Lw=`\
${Object.entries(fp).map(([e,t])=>`const int COORDINATE_SYSTEM_${e} = ${t};`).join(``)}
${Object.keys(B).map(e=>`const int PROJECTION_MODE_${e} = ${B[e]};`).join(``)}
${Object.keys(Nw).map(e=>`const int UNIT_${e.toUpperCase()} = ${Nw[e]};`).join(``)}
layout(std140) uniform projectUniforms {
bool wrapLongitude;
int coordinateFrame;
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
int sizeScaleSize;
vec4 sizeScaleTransform;
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
project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC &&
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
#ifdef USE_EXTERNAL_PROJECTION
uniform highp usampler2D project_sizeScaleTexture;
vec3 project_external_size_scale_at(vec2 mapPosition) {
if (project.sizeScaleSize <= 0) return project.commonUnitsPerMeter;
vec2 samplePosition = mapPosition * project.sizeScaleTransform.xy + project.sizeScaleTransform.zw;
if (any(lessThan(samplePosition, vec2(0.0))) || any(greaterThan(samplePosition, vec2(512.0)))) return project.commonUnitsPerMeter;
ivec2 dimensions = textureSize(project_sizeScaleTexture, 0);
ivec2 index = clamp(ivec2(floor(samplePosition / 512.0 * vec2(dimensions))), ivec2(0), dimensions - 1);
vec4 texel = uintBitsToFloat(texelFetch(project_sizeScaleTexture, index, 0));
if (texel.r <= 0.0) return project.commonUnitsPerMeter;
vec2 center = (vec2(index) + 0.5) * 512.0 / vec2(dimensions);
float scale = texel.r + dot(texel.gb, samplePosition - center);
if (!(scale > 0.0) || isinf(scale) || isnan(scale)) scale = texel.r;
return vec3(scale, scale, texel.a * scale / texel.r) * project.commonUnitsPerWorldUnit;
}
vec3 project_external_size_scale() {
return project_external_size_scale_at(geometry.position.w == 0.0
? (project.modelMatrix * vec4(geometry.worldPosition, 1.0)).xy + project.commonOrigin.xy / project.commonUnitsPerWorldUnit.xy - project.coordinateOrigin.xy : (geometry.position.xy + project.commonOrigin.xy) / project.commonUnitsPerWorldUnit.xy);
}
#endif
float project_size_at_latitude(float meters, float lat) {
return meters * project.commonUnitsPerMeter.z * project_size_at_latitude(lat);
}
float project_size(float meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return meters * project_external_size_scale().z;
#endif
return meters * project.commonUnitsPerMeter.z * project_size();
}
vec2 project_size(vec2 meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return meters * project_external_size_scale().xy;
#endif
return meters * project.commonUnitsPerMeter.xy * project_size();
}
vec3 project_size(vec3 meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return meters * project_external_size_scale();
#endif
return meters * project.commonUnitsPerMeter * project_size();
}
vec4 project_size(vec4 meters) {
#ifdef USE_EXTERNAL_PROJECTION
if (project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL) return vec4(meters.xyz * project_external_size_scale(), meters.w);
#endif
return vec4(meters.xyz * project.commonUnitsPerMeter, meters.w);
}
mat3 project_get_orientation_matrix(vec3 up) {
vec3 uz = normalize(up);
float horizontalLength = length(uz.xy);
vec3 ux = horizontalLength > 0.0 ? vec3(-uz.y, uz.x, 0.0) / horizontalLength : vec3(1.0, 0.0, 0.0);
vec3 uy = cross(uz, ux);
return mat3(ux, uy, uz);
}
bool project_needs_rotation(vec3 commonPosition, out mat3 transform) {
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
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
if (abs(lnglatz.y) == 90.0) cosPhi = max(abs(cosPhi), 1e-7);
float D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
return vec3(
sin(lambda) * cosPhi,
-cos(lambda) * cosPhi,
sin(phi)
) * D;
}
const float MAX_MERCATOR_Y = 7.0439589847;
vec2 project_globe_to_mercator_(vec3 spherePos) {
float D = length(spherePos);
float h = max(length(spherePos.xy), 1e-20);
float y = sign(spherePos.z) * min(log((D + abs(spherePos.z)) / h), MAX_MERCATOR_Y);
float x = atan(spherePos.x, -spherePos.y);
return (vec2(x, y) + PI) * WORLD_SCALE;
}
vec2 project_common_position_to_flat(vec3 commonPosition) {
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
return project_globe_to_mercator_(commonPosition);
}
return commonPosition.xy;
}
vec2 project_common_position_to_flat(vec4 commonPosition) {
return project_common_position_to_flat(commonPosition.xyz);
}
float project_wrap_flat_x_(float x, float referenceX) {
return x - TILE_SIZE * floor((x - referenceX) / TILE_SIZE + 0.5);
}
vec2 project_common_position_to_flat_wrapped(vec3 commonPosition, float referenceX) {
vec2 flatPosition = project_common_position_to_flat(commonPosition);
if (project.projectionMode != PROJECTION_MODE_IDENTITY) {
flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
}
return flatPosition;
}
vec2 project_common_position_to_flat_wrapped(vec4 commonPosition, float referenceX) {
return project_common_position_to_flat_wrapped(commonPosition.xyz, referenceX);
}
vec2 project_common_position_to_flat_continuous(vec3 commonPosition, float referenceX) {
vec2 flatPosition = project_common_position_to_flat(commonPosition);
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
flatPosition.x = project_wrap_flat_x_(flatPosition.x, referenceX);
}
return flatPosition;
}
vec2 project_common_position_to_flat_continuous(vec4 commonPosition, float referenceX) {
return project_common_position_to_flat_continuous(commonPosition.xyz, referenceX);
}
vec4 project_position(vec4 position, vec3 position64Low) {
vec4 position_world = project.modelMatrix * position;
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
return vec4(
project_mercator_(position_world.xy),
project_size_at_latitude(position_world.z, position_world.y),
position_world.w
);
}
if (project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED) {
position_world.xyz += project.coordinateOrigin;
}
}
if ((project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
if (project.coordinateFrame == COORDINATE_SYSTEM_GEOCENTRIC) {
vec4 position_low = project.modelMatrix * vec4(position64Low, 0.0);
return vec4(
position_world.xyz * project.commonUnitsPerMeter + position_low.xyz * project.commonUnitsPerMeter,
position_world.w
);
}
if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
return vec4(
project_globe_(position_world.xyz),
position_world.w
);
}
if (project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS) {
mat3 enuMatrix = project_get_orientation_matrix(project.commonOrigin);
vec3 offsetCommon = (enuMatrix * position_world.xyz) * project.commonUnitsPerMeter;
return vec4(project.commonOrigin + offsetCommon, position_world.w);
}
}
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
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
project.projectionMode == PROJECTION_MODE_CUSTOM_GEOSPATIAL ||
(project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
(project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC ||
project.coordinateFrame == COORDINATE_SYSTEM_PROJECTED))) {
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
bool project_globe_is_occluded(vec3 commonPosition) {
if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
return false;
}
vec3 eye = project.cameraPosition;
vec3 ray = commonPosition - eye;
float rayLength2 = dot(ray, ray);
if (rayLength2 == 0.0) {
return false;
}
float t = clamp(-dot(eye, ray) / rayLength2, 0.0, 1.0);
vec3 closest = eye + ray * t;
return t < 1.0 && dot(closest, closest) < GLOBE_RADIUS * GLOBE_RADIUS;
}
float project_globe_ray_distance_(vec3 eye, vec3 direction, float fallback) {
float b = dot(eye, direction);
float discriminant = b * b - dot(eye, eye) + GLOBE_RADIUS * GLOBE_RADIUS;
if (discriminant < 0.0) {
return fallback;
}
float distance = -b - sqrt(discriminant);
return distance > 0.0 ? distance : fallback;
}
#define GLOBE_BILLBOARD_FOOTPRINT_PIXELS 64.0
vec4 project_globe_billboard_clipspace(vec4 clipPosition, vec3 commonPosition) {
if (!(project.projectionMode == PROJECTION_MODE_GLOBE || project.projectionMode == PROJECTION_MODE_GLOBE_METER_OFFSETS)) {
return clipPosition;
}
vec3 eye = project.cameraPosition;
vec3 ray = commonPosition - eye;
float anchorDistance = length(ray);
if (anchorDistance == 0.0) {
return clipPosition;
}
vec3 direction = ray / anchorDistance;
vec3 inward = -eye - dot(-eye, direction) * direction;
float inwardLength = length(inward);
if (inwardLength == 0.0) {
return clipPosition;
}
float footprint = project_pixel_size(GLOBE_BILLBOARD_FOOTPRINT_PIXELS);
vec3 edgeDirection = normalize(ray + inward / inwardLength * footprint);
float surfaceDistance = project_globe_ray_distance_(eye, direction, anchorDistance);
float edgeDistance = project_globe_ray_distance_(eye, edgeDirection, surfaceDistance);
float shift = surfaceDistance - edgeDistance;
if (shift <= 0.0) {
return clipPosition;
}
vec4 shiftedClip = project_common_position_to_clipspace(vec4(commonPosition - direction * shift, 1.0));
clipPosition.z = shiftedClip.z / shiftedClip.w * clipPosition.w;
return clipPosition;
}
`,Rw={};function zw(e=Rw){return`viewport`in e?{...US(e),sizeScaleTransform:e.sizeScaleTransform||e.viewport.sizeScaleTransform||[1,1,0,0],...e.sizeScale instanceof I?{project_sizeScaleBuffer:e.sizeScale,sizeScaleSize:Math.sqrt(e.sizeScale.byteLength/16)}:e.sizeScale?{project_sizeScaleTexture:e.sizeScale,sizeScaleSize:e.sizeScale.width}:{sizeScaleSize:0}}:{}}var Bw={name:`project`,dependencies:[ae,dp],source:Iw,vs:Lw,getUniforms:zw,isCustomProjection:e=>e.projectionMode===B.CUSTOM_GEOSPATIAL,uniformTypes:{wrapLongitude:`f32`,coordinateFrame:`i32`,commonUnitsPerMeter:`vec3<f32>`,projectionMode:`i32`,scale:`f32`,commonUnitsPerWorldUnit:`vec3<f32>`,commonUnitsPerWorldUnit2:`vec3<f32>`,center:`vec4<f32>`,modelMatrix:`mat4x4<f32>`,viewProjectionMatrix:`mat4x4<f32>`,viewportSize:`vec2<f32>`,devicePixelRatio:`f32`,focalDistance:`f32`,cameraPosition:`vec3<f32>`,coordinateOrigin:`vec3<f32>`,commonOrigin:`vec3<f32>`,pseudoMeters:`f32`,sizeScaleSize:`i32`,sizeScaleTransform:`vec4<f32>`}},Vw={name:`project32`,dependencies:[Bw],source:`// Define a structure to hold both the clip-space position and the common position.
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
`},Hw=`
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
`,Uw=`
${Hw}

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

`,Ww=`
${Hw}

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

`,Gw=NS(Xw),Kw=NS(Zw),qw=[0,0,0,1],Jw=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0];function Yw(e){let{width:t,height:n,pixelUnprojectionMatrix:r}=e,i=[[0,0],[t,0],[t,n],[0,n]],a=i.map(([e,t])=>rS([e,t,-1],r)),o=i.map(([e,t])=>rS([e,t,1],r));if(!e.isGeospatial)return a.concat(o);let s=a.concat(o).filter(e=>e[2]>=0);for(let e=0;e<4;e++){let t=(e+1)%4;for(let[n,r]of[[a[e],o[e]],[a[e],a[t]],[o[e],o[t]]])if(n[2]<0!=r[2]<0){let e=n[2]/(n[2]-r[2]);s.push([n[0]+(r[0]-n[0])*e,n[1]+(r[1]-n[1])*e,0])}}return s.length>0?s:a.concat(o)}function Xw({viewport:e,center:t}){return new z(e.viewProjectionMatrix).invert().transform(t)}function Zw({viewport:e,shadowMatrices:t}){let n=[],r=Yw(e);for(let i of t){let t=i.clone().translate(new sc(e.center).negate()),a=r.map(e=>t.transform(e)),o=new z().ortho({left:Math.min(...a.map(e=>e[0])),right:Math.max(...a.map(e=>e[0])),bottom:Math.min(...a.map(e=>e[1])),top:Math.max(...a.map(e=>e[1])),near:Math.min(...a.map(e=>-e[2])),far:Math.max(...a.map(e=>-e[2]))});n.push(o.multiplyRight(i))}return n}function Qw(e){let{shadowEnabled:t=!0,project:n}=e;if(!t||!n||!e.shadowMatrices||!e.shadowMatrices.length)return{drawShadowMap:!1,useShadowMap:!1,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};let r=Bw.getUniforms(n),i=Gw({viewport:n.viewport,center:r.center}),a=[],o=Kw({shadowMatrices:e.shadowMatrices,viewport:n.viewport}).slice();for(let t=0;t<e.shadowMatrices.length;t++){let e=o[t],s=e.clone().translate(new sc(n.viewport.center).negate());r.coordinateFrame===fp.GEODETIC&&r.projectionMode===B.WEB_MERCATOR?(o[t]=s,a[t]=i):(o[t]=e.clone().multiplyRight(Jw),a[t]=s.transform(i))}let s={drawShadowMap:!!e.drawToShadowMap,useShadowMap:e.shadowMaps?e.shadowMaps.length>0:!1,color:e.shadowColor||qw,lightId:e.shadowLightId||0,lightCount:e.shadowMatrices.length,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};for(let e=0;e<o.length;e++)s[`viewProjectionMatrix${e}`]=o[e],s[`projectCenter${e}`]=a[e];for(let t=0;t<2;t++)s[`shadow_uShadowMap${t}`]=e.shadowMaps&&e.shadowMaps[t]||e.dummyShadowMap;return s}var $w={name:`shadow`,module:{name:`shadow`,dependencies:[Bw],vs:Uw,fs:Ww,getUniforms:Qw,uniformTypes:{drawShadowMap:`f32`,useShadowMap:`f32`,color:`vec4<f32>`,lightId:`i32`,lightCount:`f32`,viewProjectionMatrix0:`mat4x4<f32>`,viewProjectionMatrix1:`mat4x4<f32>`,projectCenter0:`vec4<f32>`,projectCenter1:`vec4<f32>`}},injections:{"glsl:vs:DECKGL_FILTER_GL_POSITION":`
    position = shadow_setVertexPosition(geometry.position);
    `,"glsl:fs:DECKGL_FILTER_COLOR":`
    color = shadow_filterShadowColor(color);
    `}},eT=16777215;function tT(e,t){e.length===10?R.warn(`pickMultipleObjects can only exclude 10 previously picked objects for layers without picking buffers`)():e.push(t)}var nT=`  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function rT(e){return e.replace(`  vec4 highlightColor;
} picking;`,`  vec4 highlightColor;\n${nT}} picking;`)}function iT(e,t){return[e[t]||0,e[t+1]||0,e[t+2]||0,e[t+3]||0]}var aT=`\
vec3 picking_getPickingColorFromIndex(float objectIndex) {
  if (objectIndex < 0.0 || objectIndex >= ${eT}.0) {
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
`,oT=`\
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
  if (objectIndex >= ${eT}u) {
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
`,sT={...al,vs:`${rT(al.vs)}\n${aT}`,fs:rT(al.fs),source:oT,uniformTypes:{...al.uniformTypes,disabledPickingIndexCount:`f32`,disabledPickingIndices0:`vec4<f32>`,disabledPickingIndices1:`vec4<f32>`,disabledPickingIndices2:`vec4<f32>`},defaultUniforms:{...al.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(e,t){let{highlightColor:n,normalizedHighlightColor:r,...i}=e,a=al.getUniforms(i,t);if(n){let t=!r&&(e.useByteColors??!0);a.highlightColor=$c([n[0],n[1],n[2],n[3]??(t?255:1)],t)}let o=e.disabledPickingIndices||[];return a.disabledPickingIndexCount=o.length,a.disabledPickingIndices0=iT(o,0),a.disabledPickingIndices1=iT(o,4),a.disabledPickingIndices2=iT(o,8),a}},cT={name:`picking`,module:sT,injections:[{stage:`vertex`,target:`DECKGL_FILTER_GL_POSITION`,glsl:`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `},{stage:`vertex`,target:`DECKGL_FILTER_COLOR`,glsl:`
  picking_setPickingColor(geometry.pickingColor);
  `},{stage:`fragment`,target:`DECKGL_FILTER_COLOR`,order:99,glsl:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}]},lT=[dp],uT=[{name:`DECKGL_FILTER_SIZE`,stage:`vertex`,glsl:{parameters:`inout vec3 size, VertexGeometry geometry`},wgsl:{parameters:`size: ptr<function, vec3<f32>>, geometry: VertexGeometry`}},{name:`DECKGL_FILTER_GL_POSITION`,stage:`vertex`,glsl:{parameters:`inout vec4 position, VertexGeometry geometry`},wgsl:{parameters:`position: ptr<function, vec4<f32>>, geometry: VertexGeometry`}},{name:`DECKGL_FILTER_COLOR`,stage:`vertex`,glsl:{parameters:`inout vec4 color, VertexGeometry geometry`},wgsl:{parameters:`color: ptr<function, vec4<f32>>, geometry: VertexGeometry`}},{name:`DECKGL_FILTER_COLOR`,stage:`fragment`,glsl:{parameters:`inout vec4 color, FragmentGeometry geometry`},wgsl:{parameters:`color: ptr<function, vec4<f32>>, geometry: FragmentGeometry`}},{name:`DECKGL_FILTER_COLOR_BEFORE_LIGHTING`,stage:`fragment`,wgsl:{parameters:`color: ptr<function, vec4<f32>>, geometry: FragmentGeometry`}}];function dT(e){let t=e===`wgsl`?new De:new Le;for(let e of lT)t.addDefaultModule(e);for(let e of uT)t.addShaderInjectionTarget(e);return t}var fT=dT(`glsl`),pT=dT(`wgsl`);Jd.defaultProps.shaderAssembler=fT,cf.defaultProps.shaderAssembler=fT;function mT(e){return e===`wgsl`?pT:fT}var hT=[255,255,255],gT=1,_T=0,vT=class{constructor(e={}){this.type=`ambient`;let{color:t=hT}=e,{intensity:n=gT}=e;this.id=e.id||`ambient-${_T++}`,this.color=t,this.intensity=n}},yT=[255,255,255],bT=1,xT=[0,0,-1],ST=0,CT=class{constructor(e={}){this.type=`directional`;let{color:t=yT}=e,{intensity:n=bT}=e,{direction:r=xT}=e,{_shadow:i=!1}=e;this.id=e.id||`directional-${ST++}`,this.color=t,this.intensity=n,this.type=`directional`,this.direction=new sc(r).normalize().toArray(),this.shadow=i}getProjectedLight(e){return this}},wT=new class{constructor(e={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(e)}setOptions(e){Object.assign(this.opts,e)}allocate(e,t,{size:n=1,type:r,padding:i=0,copy:a=!1,initialize:o=!1,maxCount:s}){let c=r||e&&e.constructor||Float32Array,l=t*n+i;if(ArrayBuffer.isView(e)){if(l<=e.length)return e;if(l*e.BYTES_PER_ELEMENT<=e.buffer.byteLength)return new c(e.buffer,0,l)}let u=1/0;s&&(u=s*n+i);let d=this._allocate(c,l,o,u);return e&&a?d.set(e):o||d.fill(0,0,4),this._release(e),d}release(e){this._release(e)}_allocate(e,t,n,r){let i=Math.max(Math.ceil(t*this.opts.overAlloc),1);i>r&&(i=r);let a=this._pool,o=e.BYTES_PER_ELEMENT*i,s=a.findIndex(e=>e.byteLength>=o);if(s>=0){let t=new e(a.splice(s,1)[0],0,i);return n&&t.fill(0),t}return new e(i)}_release(e){if(!ArrayBuffer.isView(e))return;let t=this._pool,{buffer:n}=e,{byteLength:r}=n,i=t.findIndex(e=>e.byteLength>=r);i<0?t.push(n):(i>0||t.length<this.opts.poolSize)&&t.splice(i,0,n),t.length>this.opts.poolSize&&t.shift()}};function TT(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function ET(e,t){let n=e%t;return n<0?t+n:n}function DT(e){return[e[12],e[13],e[14]]}function OT(e){return{left:AT(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),right:AT(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),bottom:AT(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),top:AT(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),near:AT(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),far:AT(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14])}}var kT=new sc;function AT(e,t,n,r){kT.set(e,t,n);let i=kT.len();return{distance:r/i,normal:new sc(-e/i,-t/i,-n/i)}}function jT(e){return e-Math.fround(e)}var MT;function NT(e,t){let{size:n=1,startIndex:r=0}=t,i=t.endIndex===void 0?e.length:t.endIndex,a=(i-r)/n;MT=wT.allocate(MT,a,{type:Float32Array,size:n*2});let o=r,s=0;for(;o<i;){for(let t=0;t<n;t++){let r=e[o++];MT[s+t]=r,MT[s+t+n]=jT(r)}s+=n*2}return MT.subarray(0,a*n*2)}function PT(e){let t=null,n=!1;for(let r of e)r&&(t?(n||=(t=[[t[0][0],t[0][1]],[t[1][0],t[1][1]]],!0),t[0][0]=Math.min(t[0][0],r[0][0]),t[0][1]=Math.min(t[0][1],r[0][1]),t[1][0]=Math.max(t[1][0],r[1][0]),t[1][1]=Math.max(t[1][1],r[1][1])):t=r);return t}var FT=Math.PI/180,IT=TT(),LT=[0,0,0];function RT(e={}){let t=e.unitsPerWorldUnit??[1,1,1],n=e.unitsPerMeter??t;return{unitsPerWorldUnit:t,unitsPerMeter:n,unitsPerWorldUnit2:e.unitsPerWorldUnit2??[0,0,0],unitsPerMeter2:e.unitsPerMeter2??[0,0,0],metersPerUnit:[1/n[0],1/n[1],1/n[2]]}}function zT({width:e,height:t,orthographic:n,fovyRadians:r,focalDistance:i,padding:a,near:o,far:s}){let c=e/t,l=n?new z().orthographic({fovy:r,aspect:c,focalDistance:i,near:o,far:s}):new z().perspective({fovy:r,aspect:c,near:o,far:s});if(a){let{left:n=0,right:r=0,top:i=0,bottom:o=0}=a,s=Pe((n+e-r)/2,0,e)-e/2,c=Pe((i+t-o)/2,0,t)-t/2;l[8]-=s*2/e,l[9]+=c*2/t}return l}var BT=class e{get projectionSignature(){return this.resolution||null}getSubdivisionStep(e){if(!this.resolution||!this.crs||e.signature===this.crs.signature)return 0;switch(this.projectionMode){case B.WEB_MERCATOR:case B.WEB_MERCATOR_AUTO_OFFSET:if(e.coordinateFrame===`geographic`)return 0;break}let t=e.ellipsoid?.semiMajorAxis??TS.ellipsoid.semiMajorAxis,n=2*Math.PI*t/this.resolution;switch(e.coordinateFrame){case`geographic`:return n/(t*Math.PI/180);default:{let t=e.xUnit.metersPerUnit,r=e.yUnit.metersPerUnit;return Z(typeof t==`number`&&t>0&&typeof r==`number`&&r>0),n/Math.max(t,r)}}}getPreprojection(e){if(kS(this.projectionMode,e,this.crs))return{preproject:null,unpreproject:null,packedCrs:e};let t=this.projectionMode===B.CUSTOM_GEOSPATIAL,n=e.signature===`WGS84`,r=e.converter.WGS84,i=t?this.crs.converter.WGS84:null;return{preproject:e=>{let t=n?e:r.to(e),a=i?i.from(i.normalize(t)):t;return[a[0],a[1],a[2]??0]},unpreproject:e=>{let t=i?i.to(e):e,a=n?t:r.from(t);return[a[0],a[1],a[2]??0]},packedCrs:t?this.crs:TS}}constructor(e={}){if(this._frustumPlanes={},this.resolution=e.resolution??0,!Number.isFinite(this.resolution)||this.resolution<0)throw Error(`resolution must be finite and non-negative`);this.crs=e.crs,e.targetToCommonMatrix&&(this.targetToCommonMatrix=new z(e.targetToCommonMatrix),this._commonToTargetMatrix=new z(this.targetToCommonMatrix).invert()),this._distanceScaleSampler=typeof e.distanceScales==`function`?e.distanceScales:void 0,this.id=e.id||this.constructor.displayName||`viewport`,this.x=e.x||0,this.y=e.y||0,this.width=e.width||1,this.height=e.height||1,this.zoom=e.zoom||0,this.padding=e.padding,this.distanceScales=RT({unitsPerWorldUnit:this.crs?[this.crs.xUnit,this.crs.yUnit,this.crs.zUnit].map(e=>e.metersPerUnit??1):void 0,...this._distanceScaleSampler?this._distanceScaleSampler():e.distanceScales}),this.focalDistance=e.focalDistance||1,this.position=e.position||LT,this.modelMatrix=e.modelMatrix||null,this.isGeospatial=!!this.crs,this._initProps(e),this._initMatrices(e),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return 1/this.distanceScales.unitsPerMeter[2]/this.scale}get projectionMode(){return B.IDENTITY}equals(t){return t instanceof e?this===t?!0:t.width===this.width&&t.height===this.height&&t.scale===this.scale&&t.projectionMode===this.projectionMode&&t.resolution===this.resolution&&t.projectionSignature===this.projectionSignature&&t.crs?.signature===this.crs?.signature&&Oe(t.targetToCommonMatrix||IT,this.targetToCommonMatrix||IT)&&Oe(t.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&Oe(t.projectionMatrix,this.projectionMatrix)&&Oe(t.viewMatrix,this.viewMatrix):!1}project(e,{topLeft:t=!0}={}){let n=nS(this.projectPosition(e),this.pixelProjectionMatrix),[r,i]=n,a=t?i:this.height-i;return e.length===2?[r,a]:[r,a,n[2]]}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[r,i,a]=e,o=t?i:this.height-i,s=this.targetToCommonMatrix?this.targetToCommonMatrix.transformAsPoint([0,0,n||0])[2]:n&&n*this.distanceScales.unitsPerWorldUnit[2],c=rS([r,o,a],this.pixelUnprojectionMatrix,s),[l,u,d]=this.unprojectPosition(c);return Number.isFinite(a)?[l,u,d]:Number.isFinite(n)?[l,u,n]:[l,u]}projectPosition(e,t={}){if(t.sourceCrs)return this._projectPositionFromCRS(e,t.sourceCrs);let n=this.distanceScales.unitsPerWorldUnit;if(this.crs){let t=this.crs.converter.WGS84.from(e);return this._projectTarget([t[0],t[1],t[2]||0])}let[r,i]=this.projectFlat(e);return[r,i,(e[2]||0)*n[2]]}unprojectPosition(e){let t=this.distanceScales.unitsPerWorldUnit;if(this.crs){let t=this.crs.converter.WGS84.to(this._unprojectCommon(e));return[t[0],t[1],t[2]||0]}let[n,r]=this.unprojectFlat(e);return[n,r,(e[2]||0)/t[2]]}projectFlat(e){if(!this.crs)return e;let t=this.crs.converter.WGS84.from(e),n=this._projectTarget([t[0],t[1],0]);return[n[0],n[1]]}unprojectFlat(e){if(!this.crs)return e;let t=this.crs.converter.WGS84.to(this._unprojectCommon([e[0],e[1],0]));return[t[0],t[1]]}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,0],t),r=this.unproject([this.width,0],t),i=this.unproject([0,this.height],t),a=this.unproject([this.width,this.height],t);return[Math.min(n[0],r[0],i[0],a[0]),Math.min(n[1],r[1],i[1],a[1]),Math.max(n[0],r[0],i[0],a[0]),Math.max(n[1],r[1],i[1],a[1])]}getDistanceScales(e){if(!e)return this.distanceScales;if(this._distanceScaleSampler)return RT(this._distanceScaleSampler(e));if(!this.crs)return this.distanceScales;let t=this.crs.getRenderingScale(e);if(!t)return this.distanceScales;let n=this.targetToCommonMatrix,r=t.map((e,t)=>{let r=t*4;return(n?Math.hypot(n[r],n[r+1],n[r+2]):this.distanceScales.unitsPerWorldUnit[t])/e});return RT({...this.distanceScales,unitsPerMeter:r})}containsPixel({x:e,y:t,width:n=1,height:r=1}){return e<this.x+this.width&&this.x<e+n&&t<this.y+this.height&&this.y<t+r}getFrustumPlanes(){return this._frustumPlanes.near||Object.assign(this._frustumPlanes,OT(this.viewProjectionMatrix)),this._frustumPlanes}panByPosition(e,t,n){return null}_projectPositionFromCRS(e,t){let n=t.signature===TS.signature?e:t.converter.WGS84.to(e);return this.projectPosition(n)}_projectTarget(e){return this.targetToCommonMatrix?this.targetToCommonMatrix.transformAsPoint(e,[]):e.map((e,t)=>e*this.distanceScales.unitsPerWorldUnit[t])}_unprojectCommon(e){let t=[e[0],e[1],e[2]||0];return this._commonToTargetMatrix?this._commonToTargetMatrix.transformAsPoint(t,[]):t.map((e,t)=>e/this.distanceScales.unitsPerWorldUnit[t])}_initProps(e){this.crs&&!e.distanceScales&&(this.distanceScales=this.getDistanceScales(this.crs.converter.WGS84.from(this.position))),this.scale=2**this.zoom;let{position:t,modelMatrix:n}=e,r=LT;t&&(r=n?new z(n).transformAsVector(t,[]):t),this.center=this._getCenter(e,r)}_getCenter(e,t){return this.projectPosition(t)}_initMatrices(e){let{viewMatrix:t=IT,projectionMatrix:n=null,orthographic:r=!1,fovyRadians:i,fovy:a=75,near:o=.1,far:s=1e3,padding:c=null,focalDistance:l=1}=e;this.viewMatrixUncentered=t,this.viewMatrix=new z().multiplyRight(t).translate(new sc(this.center).negate()),this.projectionMatrix=n||zT({width:this.width,height:this.height,orthographic:r,fovyRadians:i||a*FT,focalDistance:l,padding:c,near:o,far:s});let u=TT();fc(u,u,this.projectionMatrix),fc(u,u,this.viewMatrix),this.viewProjectionMatrix=u,this.viewMatrixInverse=uc([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=DT(this.viewMatrixInverse);let d=TT(),f=TT();mc(d,d,[this.width/2,-this.height/2,1]),pc(d,d,[1,-1,0]),fc(f,d,this.viewProjectionMatrix),this.pixelProjectionMatrix=f,this.pixelUnprojectionMatrix=uc(TT(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||R.warn(`Pixel project matrix not invertible`)()}};BT.displayName=`Viewport`;var VT=class e extends BT{constructor(t={}){let n=e._getViewportOptions(t);super(n),this.latitude=n.latitude??0,this.longitude=n.longitude??0,this.zoom=n.zoom??0,this.pitch=n.pitch??0,this.bearing=n.bearing??0,this.altitude=n.altitude??1.5,this.fovy=n.fovy??75,this.orthographic=n.orthographic??!1,this._subViewports=n.repeat?[]:null,this._pseudoMeters=n.legacyMeterSizes??!1,Object.freeze(this)}static _getViewportOptions(e){let{latitude:t=0,longitude:n=0,zoom:r=0,pitch:i=0,bearing:a=0,nearZMultiplier:o=.1,farZMultiplier:s=1.01,nearZ:c,farZ:l,orthographic:u=!1,projectionMatrix:d,worldOffset:f=0,position:p,padding:m}=e,{width:h,height:g,altitude:_=1.5}=e,v=2**r;h||=1,g||=1;let y,b=null;if(d)_=d[5]/2,y=eS(_);else{e.fovy?(y=e.fovy,_=tS(y)):y=eS(_);let n;if(m){let{top:e=0,bottom:t=0}=m;n=[0,Pe((e+g-t)/2,0,g)-g/2]}b=$x({width:h,height:g,scale:v,center:p&&[0,0,p[2]*Yx(t)],offset:n,pitch:i,fovy:y,nearZMultiplier:o,farZMultiplier:s}),Number.isFinite(c)&&(b.near=c),Number.isFinite(l)&&(b.far=l)}let x=Qx({height:g,pitch:i,bearing:a,scale:v,altitude:_});f&&(x=new z().translate([512*f,0,0]).multiplyLeft(x));let S=Number.isFinite(n)&&Number.isFinite(t);return{...e,crs:S?CS:void 0,distanceScales:S?bS(n,t):void 0,width:h,height:g,viewMatrix:x,longitude:n,latitude:t,zoom:r,...b,fovy:y,focalDistance:_,altitude:_,orthographic:u}}_getCenter(e,t){return this.crs?new sc(t).scale(this.distanceScales.unitsPerMeter).add(this.projectPosition([e.longitude??0,e.latitude??0,0])):super._getCenter(e,t)}get projectionMode(){return this.crs?this.zoom<12?B.WEB_MERCATOR:B.WEB_MERCATOR_AUTO_OFFSET:B.IDENTITY}projectFlat(e){if(!this.crs)return e;let t=qx(e);return t[1]=Pe(t[1],-318,830),t}unprojectFlat(e){return this.crs?Jx(e):e}getDistanceScales(e){return e&&this.crs?bS(e[0],e[1],!0):this.distanceScales}get subViewports(){if(this._subViewports&&!this._subViewports.length){let t=this.getBounds(),n=Math.floor((t[0]+180)/360),r=Math.ceil((t[2]-180)/360);for(let t=n;t<=r;t++){let n=t?new e({...this,worldOffset:t}):this;this._subViewports.push(n)}}return this._subViewports}equals(t){return t instanceof e&&t._pseudoMeters===this._pseudoMeters&&super.equals(t)}projectPosition(e,t={}){if(t.sourceCrs)return this._projectPositionFromCRS(e,t.sourceCrs);if(this._pseudoMeters){let[t,n]=this.projectFlat(e);return[t,n,(e[2]||0)*this.distanceScales.unitsPerWorldUnit[2]]}let[n,r]=this.projectFlat(e);return[n,r,(e[2]||0)*Yx(e[1])]}unprojectPosition(e){if(this._pseudoMeters){let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)/this.distanceScales.unitsPerWorldUnit[2]]}let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)/Yx(n)]}addMetersToLngLat(e,t){return Zx(e,t)}panByPosition(e,t,n){let r=rS(t,this.pixelUnprojectionMatrix),i=Ns([],this.projectFlat(e),Fs([],r)),a=Ns([],this.center,i),[o,s]=this.unprojectFlat(a);return{longitude:o,latitude:s}}panByPosition3D(e,t){let n=e[2]||0,r=Rs([],e,this.unproject(t,{targetZ:n}));return{longitude:this.longitude+r[0],latitude:this.latitude+r[1]}}getBounds(e={}){let t=sS(this,e.z||0);return[Math.min(t[0][0],t[1][0],t[2][0],t[3][0]),Math.min(t[0][1],t[1][1],t[2][1],t[3][1]),Math.max(t[0][0],t[1][0],t[2][0],t[3][0]),Math.max(t[0][1],t[1][1],t[2][1],t[3][1])]}fitBounds(t,n={}){let{width:r,height:i}=this,{longitude:a,latitude:o,zoom:s}=iS({width:r,height:i,bounds:t,...n});return new e({width:r,height:i,longitude:a,latitude:o,zoom:s})}};VT.displayName=`WebMercatorViewport`;function HT(e,t,n=!1){let r=t.projectPosition(e);if(n&&t instanceof VT){let[n,i,a=0]=e;r[2]=a*t.getDistanceScales([n,i]).unitsPerMeter[2]}return r}function UT(e,{sourceCrs:t,viewport:n,modelMatrix:r,coordinateOrigin:i,coordinateSystem:a,offsetMode:o=!1}){let[s,c,l=0]=e;switch(r&&([s,c,l]=Oc([],[s,c,l,1],r)),a){case`meter-offsets`:if(n.projectionMode===B.CUSTOM_GEOSPATIAL){let e=n.projectPosition(i),t=n.crs.converter.WGS84.from(i),{unitsPerMeter:r}=n.getDistanceScales(t);return[e[0]+s*r[0],e[1]+c*r[1],e[2]+l*r[2]]}return HT(Zx(i,[s,c,l]),n,o);case`cartesian`:break;default:if(t){let e=[s+i[0],c+i[1],l+(i[2]||0)],{preproject:r}=n.getPreprojection(t),a=r?r(e):e;return n.projectionMode===B.CUSTOM_GEOSPATIAL?a.map((e,t)=>e*n.distanceScales.unitsPerWorldUnit[t]):HT(a,n,o)}}if(n.projectionMode===B.CUSTOM_GEOSPATIAL){let e=n.distanceScales.unitsPerWorldUnit;return[(s+i[0])*e[0],(c+i[1])*e[1],(l+i[2])*e[2]]}return n.isGeospatial?[s+i[0],c+i[1],l+i[2]]:n.projectPosition([s,c,l])}function WT(e,t){let{viewport:n,sourceCrs:r,coordinateSystem:i,coordinateOrigin:a}=t,o=t.autoOffset===!1?null:VS(n,i,a,r),s=UT(e,{...t,offsetMode:!!o?.offsetMode});return o?.offsetMode&&nc(s,s,o.commonOrigin||n.projectPosition(o.geospatialOrigin||o.shaderCoordinateOrigin)),s}var GT=[255,255,255],KT=class{constructor(e,t={id:`pass`}){let{id:n}=t;this.id=n,this.device=e,this.props={...t}}setProps(e){Object.assign(this.props,e)}render(e){}cleanup(){}},qT={colorMask:15,depthWriteEnabled:!0,depthCompare:`less-equal`,blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaOperation:`add`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`},JT=class extends KT{constructor(){super(...arguments),this._lastRenderIndex=-1,this._activatedLayers=new Set}render(e){this._render(e)}_render(e){if(this.device.type===`webgl`&&e.colorMask!==void 0){let t=e.colorMask;return this.device.withParametersWebGL({colorMask:[!!(t&1),!!(t&2),!!(t&4),!!(t&8)]},()=>this._renderLayers(e))}return this._renderLayers(e)}_renderLayers(e){this._activatedLayers.clear();let{canvasContext:t=this.device.canvasContext}=e,n=e.target??t.getCurrentFramebuffer(),[r,i]=t.getDrawingBufferSize(),a=e.clearCanvas??!0,o=e.clearColor??(a?[0,0,0,0]:!1),s=a?1:!1,c=a?0:!1,l={viewport:[0,0,r,i]};e.scissorRect&&(l.scissorRect=e.scissorRect);let{shaderModuleProps:u,viewports:d,views:f,onViewportActive:p,clearStack:m=!0}=e,h=e.pass||`unknown`,g=this.device.type===`webgpu`;m&&(this._lastRenderIndex=-1);let _=[];if(!d.length)return this.device.beginRenderPass({framebuffer:n,parameters:l,clearColor:o,clearDepth:s,clearStencil:c}).end(),this.device.submit(),_;try{for(let r of d){p?.(r);let i=this._getDrawLayerParams(r,e),a=f&&f[r.id],d=r.subViewports||[r],m=g?d.map(e=>[e]):[d];for(let r of m){let d=this.device.beginRenderPass({framebuffer:n,parameters:l,clearColor:o,clearDepth:s,clearStencil:c});try{for(let o of r){let r=this._drawLayersInViewport(d,{target:n,canvasContext:t,shaderModuleProps:u,viewport:o,view:a,pass:h,layers:e.layers,isPicking:e.isPicking,normalizedColors:e.normalizedColors},i);_.push(r)}}finally{d.end(),g&&this.device.submit()}o=!1,s=!1,c=!1}}return _}finally{g||this.device.submit()}}_getDrawLayerParams(e,{layers:t,pass:n,isPicking:r=!1,layerFilter:i,onLayerEligible:a,cullRect:o,views:s,effects:c,canvasContext:l=this.device.canvasContext,colorMask:u,shaderModuleProps:d},f=!1){let p=[],m=YT(this._lastRenderIndex+1),h={layer:t[0],viewport:e,isPicking:r,renderPass:n,cullRect:o},g={};for(let o=0;o<t.length;o++){let _=t[o],v=this._shouldDrawLayer(_,h,i,g),y={shouldDrawLayer:v};v&&!f&&(y.shouldDrawLayer=!0,a&&n===`screen`&&!r&&_.isDrawable&&a(_,e),y.layerRenderIndex=m(_,v),y.shaderModuleProps=this._getShaderModuleProps(_,c,n,l,d),y.layerParameters={..._.context.device.type===`webgpu`?qT:null,..._.context.deck?.props.parameters,...s?.[e.id]?.props.parameters,...this.getLayerParameters(_,o,e)},u!==void 0&&(y.layerParameters.colorMask=u)),p[o]=y}return p}_drawLayersInViewport(e,{layers:t,shaderModuleProps:n,pass:r,target:i,canvasContext:a,viewport:o,view:s,isPicking:c,normalizedColors:l=!1},u){let d=XT(this.device,{canvasContext:a,shaderModuleProps:n,target:i,viewport:o});if(s){let{clear:e,clearColor:t,clearDepth:n,clearStencil:r}=s.props;if(e){let e=[0,0,0,0],a=1,o=0;Array.isArray(t)&&!c?e=$c([t[0],t[1],t[2],t[3]??(l?1:255)],!l):t===!1&&(e=!1),n!==void 0&&(a=n),r!==void 0&&(o=r),this.device.beginRenderPass({framebuffer:i,parameters:{viewport:d,scissorRect:d},clearColor:e,clearDepth:a,clearStencil:o}).end()}}let f={totalCount:t.length,visibleCount:0,compositeCount:0,pickableCount:0};e.setParameters({viewport:d});for(let n=0;n<t.length;n++){let i=t[n],a=u[n],{shouldDrawLayer:s}=a;if(s&&i.props.pickable&&f.pickableCount++,i.isComposite&&f.compositeCount++,i.isDrawable&&a.shouldDrawLayer){let{layerRenderIndex:t,shaderModuleProps:n,layerParameters:s}=a;f.visibleCount++,this._lastRenderIndex=Math.max(this._lastRenderIndex,t),n.project&&(n.project.viewport=o),i.context.renderPass=e;try{i._drawLayer({renderPass:e,shaderModuleProps:n,uniforms:{layerIndex:t},parameters:s})}catch(e){i.raiseError(e,`drawing ${i} to ${r}`)}}}return f}shouldDrawLayer(e){return!0}getShaderModuleProps(e,t,n){return null}getLayerParameters(e,t,n){return e.props.parameters}_shouldDrawLayer(e,t,n,r){if(!e.internalState||!e.isCoordinateSystemLoaded||!(e.props.visible&&this.shouldDrawLayer(e)))return!1;t.layer=e;let i=e.parent;for(;i;){if(!i.isCoordinateSystemLoaded||!i.props.visible||!i.filterSubLayer(t))return!1;t.layer=i,i=i.parent}if(n){let e=t.layer.id;if(e in r||(r[e]=n(t)),!r[e])return!1}return!t.isPicking&&!this._activatedLayers.has(e)&&(this._activatedLayers.add(e),e.activateViewport(t.viewport)),!0}_getShaderModuleProps(e,t,n,r,i){let a=r.cssToDeviceRatio(),o=e.internalState?.propsInTransition||e.props,s={layer:o,picking:{isActive:!1},project:{viewport:e.context.viewport,sizeScale:e.context.layerManager.projectionScaleResources.get(e.context.viewport),devicePixelRatio:a,modelMatrix:o.modelMatrix,coordinateSystem:o.coordinateSystem,sourceCrs:e.internalState.sourceCrs,coordinateOrigin:o.coordinateOrigin,autoWrapLongitude:e.wrapLongitude}};if(t)for(let n of t)ZT(s,n.getShaderModuleProps?.(e,s));for(let t of e.context.defaultShaderModules)t.name in s||(s[t.name]={});return ZT(s,this.getShaderModuleProps(e,t,s),i)}};function YT(e=0,t={}){let n={},r=(i,a)=>{let o=i.props._offset,s=i.id,c=i.parent&&i.parent.id,l;if(c&&!(c in t)&&r(i.parent,!1),c in n){let e=n[c]=n[c]||YT(t[c],t);l=e(i,a),n[s]=e}else Number.isFinite(o)?(l=o+(t[c]||0),n[s]=null):l=e;return a&&l>=e&&(e=l+1),t[s]=l,l};return r}function XT(e,{canvasContext:t=e.canvasContext,shaderModuleProps:n,target:r,viewport:i}){let a=n?.project?.devicePixelRatio??t.cssToDeviceRatio(),[,o]=t.getDrawingBufferSize(),s=r?r.height:o,c=i,l=e.type===`webgpu`?c.y*a:s-(c.y+c.height)*a;return[c.x*a,l,c.width*a,c.height*a]}function ZT(e,...t){for(let n of t)if(n)for(let t in n)e[t]?Object.assign(e[t],n[t]):e[t]=n[t];return e}var QT=class extends JT{constructor(e,t){super(e,t);let n=e.createTexture({format:`rgba8unorm`,width:1,height:1,sampler:{minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}),r=e.createTexture({format:`depth16unorm`,width:1,height:1});this.fbo=e.createFramebuffer({id:`shadowmap`,width:1,height:1,colorAttachments:[n],depthStencilAttachment:r})}delete(){this.fbo&&=(this.fbo.destroy(),null)}getShadowMap(){return this.fbo.colorAttachments[0].texture}render(e){let t=this.fbo,n=this.device.canvasContext.cssToDeviceRatio(),r=e.viewports[0],i=r.width*n,a=r.height*n,o=[1,1,1,1];(i!==t.width||a!==t.height)&&t.resize({width:i,height:a}),super.render({...e,clearColor:o,target:t,pass:`shadow`})}getLayerParameters(e,t,n){return{...e.props.parameters,blend:!1,depthWriteEnabled:!0,depthCompare:`less-equal`,depthBias:0}}shouldDrawLayer(e){return e.props.shadowEnabled!==!1}getShaderModuleProps(e,t,n){return{shadow:{project:n.project,drawToShadowMap:!0},lighting:{enabled:!1}}}},$T={intensity:1},eE=[{intensity:1,direction:[-1,3,-1]},{intensity:.9,direction:[1,-8,-2.5]}],tE=[0,0,0,200/255],nE=class{constructor(e={}){this.id=`lighting-effect`,this.shadowColor=tE,this.shadow=!1,this.directionalLights=[],this.pointLights=[],this.shadowPasses=[],this.dummyShadowMap=null,this.setProps(e)}setup(e){this.context=e;let{device:t,deck:n}=e;this.shadow&&!this.dummyShadowMap&&(this._createShadowPasses(t),n._addDefaultShaderPlugin($w),this.dummyShadowMap=t.createTexture({width:1,height:1}))}setProps(e){this.ambientLight=void 0,this.directionalLights=[],this.pointLights=[];for(let t in e){let n=e[t];switch(n.type){case`ambient`:this.ambientLight=n;break;case`directional`:this.directionalLights.push(n);break;case`point`:this.pointLights.push(n);break;default:}}this._applyDefaultLights(),this.shadow=this.directionalLights.some(e=>e.shadow),this.context&&(this.shadow||this.cleanup(this.context),this.setup(this.context)),this.props=e}preRender({layers:e,layerFilter:t,viewports:n,onViewportActive:r,views:i}){if(this.shadow){this.shadowMatrices=this._calculateMatrices();for(let a=0;a<this.shadowPasses.length;a++)this.shadowPasses[a].render({layers:e,layerFilter:t,viewports:n,onViewportActive:r,views:i,shaderModuleProps:{shadow:{shadowLightId:a,dummyShadowMap:this.dummyShadowMap,shadowMatrices:this.shadowMatrices}}})}}getShaderModuleProps(e,t){let n=this.shadow?{project:t.project,shadowMaps:this.shadowPasses.map(e=>e.getShadowMap()),dummyShadowMap:this.dummyShadowMap,shadowColor:this.shadowColor,shadowMatrices:this.shadowMatrices}:{},r={enabled:!0,useByteColors:!1,lights:this._getLights(e)},i=e.props.material;return{shadow:n,lighting:r,phongMaterial:i,gouraudMaterial:i}}cleanup(e){for(let e of this.shadowPasses)e.delete();this.shadowPasses.length=0,this.dummyShadowMap&&(this.dummyShadowMap.destroy(),this.dummyShadowMap=null,e.deck._removeDefaultShaderPlugin($w))}_calculateMatrices(){let e=[];for(let t of this.directionalLights){let n=new z().lookAt({eye:new sc(t.direction).negate()});e.push(n)}return e}_createShadowPasses(e){for(let t=0;t<this.directionalLights.length;t++){let n=new QT(e);this.shadowPasses[t]=n}}_applyDefaultLights(){let{ambientLight:e,pointLights:t,directionalLights:n}=this;!e&&t.length===0&&n.length===0&&(this.ambientLight=new vT($T),this.directionalLights.push(new CT(eE[0]),new CT(eE[1])))}_getLights(e){let t=[];this.ambientLight&&t.push(this.ambientLight);for(let n of this.pointLights)t.push(n.getProjectedLight({layer:e}));for(let n of this.directionalLights)t.push(n.getProjectedLight({layer:e}));let n=e.context?.normalizedColors;return t.map(e=>({...e,color:n&&Array.isArray(e.color)&&e.color!==hT&&e.color!==yT&&e.color!==GT?e.color:Qc(e.color)}))}},rE={blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`zero`,blendAlphaOperation:`add`,blendAlphaSrcFactor:`constant`,blendAlphaDstFactor:`zero`},iE=class extends JT{constructor(){super(...arguments),this._colorEncoderState=null}render(e){return`pickingFBO`in e?this._drawPickingBuffer(e):{decodePickingColor:null,stats:super._render(e)}}_drawPickingBuffer({layers:e,layerFilter:t,views:n,viewports:r,onViewportActive:i,pickingFBO:a,deviceRect:{x:o,y:s,width:c,height:l},cullRect:u,effects:d,pass:f=`picking`,pickZ:p,canvasContext:m,shaderModuleProps:h,clearColor:g}){this.pickZ=p;let _=this._resetColorEncoder(p),v=[o,this.device.type===`webgpu`?a.height-s-l:s,c,l],y=super._render({target:a,layers:e,layerFilter:t,views:n,viewports:r,onViewportActive:i,cullRect:u,effects:d?.filter(e=>e.useInPicking),pass:f,canvasContext:m,isPicking:!0,shaderModuleProps:h,clearColor:g??[0,0,0,0],colorMask:15,scissorRect:v});return this._colorEncoderState=null,{decodePickingColor:_&&oE.bind(null,_),stats:y}}shouldDrawLayer(e){let{pickable:t,operation:n}=e.props;return t&&n.includes(`draw`)||n.includes(`terrain`)||n.includes(`mask`)}getShaderModuleProps(e,t,n){return{picking:{isActive:1,isAttribute:this.pickZ,disabledPickingIndices:e.internalState?.disabledPickingIndices},lighting:{enabled:!1}}}getLayerParameters(e,t,n){let r={...e.props.parameters},{pickable:i,operation:a}=e.props;return this._colorEncoderState?i&&a.includes(`draw`)?(Object.assign(r,rE),r.blend=!0,this.device.type===`webgpu`?r.blendConstant=aE(this._colorEncoderState,e,n):r.blendColor=aE(this._colorEncoderState,e,n),a.includes(`terrain`)&&e.state?._hasPickingCover&&(r.blendAlphaSrcFactor=`one`)):a.includes(`terrain`)&&(e.state?._hasPickingCover?r.blend=!1:Object.assign(r,rE,{blend:!0,blendAlphaSrcFactor:`zero`})):r.blend=!1,r}_resetColorEncoder(e){return this._colorEncoderState=e?null:{byLayer:new Map,byAlpha:[]},this._colorEncoderState}};function aE(e,t,n){let{byLayer:r,byAlpha:i}=e,a,o=r.get(t);return o?(o.viewports.push(n),a=o.a):(a=r.size+1,a<=255?(o={a,layer:t,viewports:[n]},r.set(t,o),i[a]=o):(R.warn(`Too many pickable layers, only picking the first 255`)(),a=0)),[0,0,0,a/255]}function oE(e,t){let n=e.byAlpha[t[3]];return n&&{pickedLayer:n.layer,pickedViewports:n.viewports,pickedObjectIndex:n.layer.decodePickingColor(t)}}var sE={NO_STATE:`Awaiting state`,MATCHED:`Matched. State transferred from previous layer`,INITIALIZED:`Initialized`,AWAITING_GC:`Discarded. Awaiting garbage collection`,AWAITING_FINALIZATION:`No longer matched. Awaiting garbage collection`,FINALIZED:`Finalized! Awaiting garbage collection`},cE=Symbol.for(`component`),lE=Symbol.for(`propTypes`),uE=Symbol.for(`deprecatedProps`),dE=Symbol.for(`asyncPropDefaults`),fE=Symbol.for(`asyncPropOriginal`),pE=Symbol.for(`asyncPropResolved`),mE=Symbol(`accessorQueries`),hE=Symbol(`rowAccessorColumns`);function gE(e,t=()=>!0){return Array.isArray(e)?_E(e,t,[]):t(e)?[e]:[]}function _E(e,t,n){let r=-1;for(;++r<e.length;){let i=e[r];Array.isArray(i)?_E(i,t,n):t(i)&&n.push(i)}return n}function vE({target:e,source:t,start:n=0,count:r=1}){let i=t.length,a=r*i,o=0;for(let r=n;o<i;o++)e[r++]=t[o];for(;o<a;)o<a-o?(e.copyWithin(n+o,n,n+o),o*=2):(e.copyWithin(n+o,n,n+a-o),o=a);return e}var yE=class{constructor(e,t,n){this._loadCount=0,this._subscribers=new Set,this.id=e,this.context=n,this.setData(t)}subscribe(e){this._subscribers.add(e)}unsubscribe(e){this._subscribers.delete(e)}inUse(){return this._subscribers.size>0}delete(){}getData(){return this.isLoaded?this._error?Promise.reject(this._error):this._content:this._loader.then(()=>this.getData())}setData(e,t){if(e===this._data&&!t)return;this._data=e;let n=++this._loadCount,r=e;typeof e==`string`&&(r=is(e)),r instanceof Promise?(this.isLoaded=!1,this._loader=r.then(e=>{this._loadCount===n&&(this.isLoaded=!0,this._error=void 0,this._content=e)}).catch(e=>{this._loadCount===n&&(this.isLoaded=!0,this._error=e||!0)})):(this.isLoaded=!0,this._error=void 0,this._content=e);for(let e of this._subscribers)e.onChange(this.getData())}},bE=class{constructor(e){this.protocol=e.protocol||`resource://`,this._context={device:e.device,gl:e.device?.gl,resourceManager:this},this._resources={},this._consumers={},this._pruneRequest=null}contains(e){return e.startsWith(this.protocol)?!0:e in this._resources}add({resourceId:e,data:t,forceUpdate:n=!1,persistent:r=!0}){let i=this._resources[e];i?i.setData(t,n):(i=new yE(e,t,this._context),this._resources[e]=i),i.persistent=r}remove(e){let t=this._resources[e];t&&(t.delete(),delete this._resources[e])}unsubscribe({consumerId:e,requestId:t}){let n=this._consumers[e];if(n){for(let e of t===void 0?Object.keys(n):[t]){let t=n[e];t&&(this._resources[t.resourceId]?.unsubscribe(t),delete n[e])}Object.keys(n).length||delete this._consumers[e],this.prune()}}subscribe({resourceId:e,onChange:t,consumerId:n,requestId:r=`default`}){let{_resources:i,protocol:a}=this;e.startsWith(a)&&(e=e.replace(a,``),i[e]||this.add({resourceId:e,data:null,persistent:!1}));let o=i[e];if(this._track(n,r,o,t),o)return o.getData()}prune(){this._pruneRequest||=setTimeout(()=>this._prune(),0)}finalize(){for(let e in this._resources)this._resources[e].delete()}_track(e,t,n,r){let i=this._consumers,a=i[e]=i[e]||{},o=a[t],s=o&&o.resourceId&&this._resources[o.resourceId];s&&(s.unsubscribe(o),this.prune()),n&&(o?(o.onChange=r,o.resourceId=n.id):o={onChange:r,resourceId:n.id},a[t]=o,n.subscribe(o))}_prune(){this._pruneRequest=null;for(let e of Object.keys(this._resources)){let t=this._resources[e];!t.persistent&&!t.inUse()&&(t.delete(),delete this._resources[e])}}},xE=class{constructor(e){this.resources=new Map,this.device=e}get(e){if(e.projectionMode!==B.CUSTOM_GEOSPATIAL)return;let t=e,n=this.resources.get(e.id);if(n?.signature===t.sizeScaleSignature)return n.resource;let r=performance.now(),i=t.getSizeScaleData(),a=performance.now(),o=this.create(i,64),s=performance.now();return R.log(3,`Size scale sampler [${e.id}] 64×64: generation ${(a-r).toFixed(2)} ms, ${this.device.type===`webgpu`?`buffer`:`texture`} creation/upload submission ${(s-a).toFixed(2)} ms, total ${(s-r).toFixed(2)} ms`)(),n?.resource.destroy(),this.resources.set(e.id,{signature:t.sizeScaleSignature,resource:o}),o}delete(e){this.resources.get(e)?.resource.destroy(),this.resources.delete(e)}destroy(){for(let{resource:e}of this.resources.values())e.destroy();this.resources.clear()}create(e,t){return this.device.type===`webgpu`?this.device.createBuffer({id:`project-size-scale`,data:e,usage:I.STORAGE|I.COPY_DST}):this.device.createTexture({id:`project-size-scale`,width:t,height:t,format:`rgba32uint`,data:new Uint32Array(e.buffer,e.byteOffset,e.length),sampler:{minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}})}},SE=`layerManager.setLayers`,CE=`layerManager.activateViewport`,wE=class{constructor(e,t){this._coordinateSystems=new Map,this._lastRenderedLayers=[],this._viewports=new Map,this._layerFilter=null,this._needsRedraw=!1,this._needsUpdate=!1,this._nextLayers=null,this._debug=!1,this._defaultShaderModulesChanged=!1,this.activateViewport=e=>{hs(CE,this,e);let t=!this.context.viewport;if(this.context.viewport=e||null,e&&t){for(let t of this.layers){let n=t.internalState;n&&this.isViewportReady(t)&&(n.viewport=e,t.setChangeFlags({viewportChanged:!0}))}this.setNeedsUpdate(`viewport available`)}};let{deck:n,stats:r,viewport:i,timeline:a}=t||{};this.layers=[],this.resourceManager=new bE({device:e,protocol:`deck://`}),this.projectionScaleResources=new xE(e),this.context={mousePosition:null,userData:{},layerManager:this,device:e,gl:e?.gl,deck:n,shaderAssembler:mT(e?.info?.shadingLanguage||`glsl`),defaultShaderModules:[cp],defaultShaderPlugins:[],renderPass:void 0,stats:r||new d({id:`deck.gl`}),viewport:i||null,timeline:a||new xu,resourceManager:this.resourceManager,onError:void 0},Object.seal(this)}finalize(){this.projectionScaleResources.destroy(),this.resourceManager.finalize();for(let e of this.layers)this._finalizeLayer(e);this._coordinateSystems.clear()}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);for(let n of this.layers){let r=n.getNeedsRedraw(e);t||=r}return t}needsUpdate(){return this._nextLayers&&this._nextLayers!==this._lastRenderedLayers?`layers changed`:this._defaultShaderModulesChanged?`shader modules changed`:this._needsUpdate}setNeedsRedraw(e){this._needsRedraw=this._needsRedraw||e}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e}getLayers({layerIds:e}={}){return e?this.layers.filter(t=>e.find(e=>t.id.indexOf(e)===0)):this.layers}setProps(e){if(`layerFilter`in e&&e.layerFilter!==this._layerFilter&&(this._layerFilter=e.layerFilter,this.setNeedsUpdate(`layerFilter changed`)),`normalizedColors`in e&&e.normalizedColors!==this.context.normalizedColors){this.context.normalizedColors=e.normalizedColors;for(let e of this.layers)e.setNeedsUpdate();this.setNeedsUpdate(`normalizedColors changed`)}`sqlParser`in e&&e.sqlParser!==this.context.sqlParser&&(this.context.sqlParser=e.sqlParser,this.setNeedsUpdate(`SQL parser changed`)),`sqlFunctions`in e&&e.sqlFunctions!==this.context.sqlFunctions&&(this.context.sqlFunctions=e.sqlFunctions,this.setNeedsUpdate(`SQL functions changed`)),`debug`in e&&(this._debug=e.debug),`userData`in e&&(this.context.userData=e.userData),`layers`in e&&(this._nextLayers=e.layers),`onError`in e&&(this.context.onError=e.onError)}setLayers(e,t){if(hs(SE,this,t,e),!this.context.viewport){this._nextLayers=e,this.setNeedsUpdate(t||`viewport pending`);return}this._nextLayers=null,this._lastRenderedLayers=e;let n=gE(e,Boolean);for(let e of n)e.context=this.context;this._updateLayers(this.layers,n)}updateLayers(){if(!this.context.viewport)return;let e=this.needsUpdate();e&&(this.setNeedsRedraw(`updating layers: ${e}`),this.setLayers(this._nextLayers||this._lastRenderedLayers,e)),this._nextLayers=null}getViewports(){return this.context.deck?.getViewports()||(this.context.viewport?[this.context.viewport]:[])}setViewports(e,t){this._viewports=new Map(t.map(e=>[e.id,null]));for(let t of e)this._viewports.set(t.id,t);this.context.viewport=e[0]||null;for(let e of this.layers){let t=e.internalState;if(!t?.viewport)continue;let n=this._viewports.get(t.viewport.id);n!==null&&n!==t.viewport&&(t.viewport=n,e.setChangeFlags({viewportChanged:!0}))}this.setNeedsUpdate(`viewports changed`)}isViewportReady(e){let t=e.internalState?.viewport;return!t||this._viewports.get(t.id)!==null}addDefaultShaderModule(e){let{defaultShaderModules:t}=this.context;t.find(t=>t.name===e.name)||(t.push(e),this._defaultShaderModulesChanged=!0)}removeDefaultShaderModule(e){let{defaultShaderModules:t}=this.context,n=t.findIndex(t=>t.name===e.name);n>=0&&(t.splice(n,1),this._defaultShaderModulesChanged=!0)}addDefaultShaderPlugin(e){this.context.defaultShaderPlugins.some(t=>t.name===e.name)||(this.context.defaultShaderPlugins.push(e),e.module&&this.addDefaultShaderModule(e.module),this._defaultShaderModulesChanged=!0)}removeDefaultShaderPlugin(e){let t=this.context.defaultShaderPlugins.findIndex(t=>t.name===e.name);t>=0&&(this.context.defaultShaderPlugins.splice(t,1),e.module&&this.removeDefaultShaderModule(e.module),this._defaultShaderModulesChanged=!0)}_handleError(e,t,n){n.raiseError(t,`${e} of ${n}`)}_updateLayers(e,t){let n={};for(let t of e)n[t.id]?R.warn(`Multiple old layers with same id ${t.id}`)():n[t.id]=t;if(this._defaultShaderModulesChanged){for(let t of e)t.setNeedsUpdate(),t.setChangeFlags({extensionsChanged:!0});this._defaultShaderModulesChanged=!1}let r=[];this._updateSublayersRecursively(t,n,r),this._finalizeOldLayers(n);let i=!1;for(let e of r)if(e.hasUniformTransition()){i=`Uniform transition in ${e}`;break}this._needsUpdate=i,this.layers=r}_updateSublayersRecursively(e,t,n){for(let r of e){r.context=this.context;let e=t[r.id];e===null&&R.warn(`Multiple new layers with same id ${r.id}`)(),t[r.id]=null;let i=null;try{this._debug&&e!==r&&r.validateProps(),e?.internalState&&this._transferLayerState(e,r);let t=r.internalState?void 0:this._getInitialViewport(r);this.isViewportReady(r)&&this._resolveLayerCrs(r,t)&&(r.internalState?this._updateLayer(r):this._initializeLayer(r,t)),n.push(r),i=r.internalState&&r.isComposite?r.getSubLayers():null}catch(e){this._handleError(`matching`,e,r)}i&&this._updateSublayersRecursively(i,t,n)}}_getInitialViewport(e){let t=this._viewports.size?this._viewports.values():[this.context.viewport];for(let n of t)if(n&&(!this._layerFilter||this._layerFilter({layer:e.root,viewport:n,isPicking:!1,renderPass:`screen`})))return n}_resolveLayerCrs(e,t){let n=e.internalState?.viewport||t||this.context.viewport,r=(e.props.coordinateSystem??`default`)===`default`?n.isGeospatial?`WGS84`:`cartesian`:e.props.coordinateSystem,i=this._coordinateSystems.get(e.id);if(!i||!DS(i.coordinateSystem,r)){i={coordinateSystem:r,layer:e},this._coordinateSystems.set(e.id,i);let t=r===n.crs?.signature?n.crs:OS(r);if(t instanceof Promise){i.pending=t;let n=i;t.then(t=>{this._coordinateSystems.get(e.id)===n&&(n.sourceCrs=t,n.pending=void 0,this.setNeedsUpdate(`source CRS loaded`))},t=>{this._coordinateSystems.get(e.id)===n&&(n.error=t,n.pending=void 0,n.layer.raiseError(t,`loading coordinateSystem`))})}else i.sourceCrs=t}return i.coordinateSystem=r,i.layer=e,e._setSourceCrs(i.pending||i.error?void 0:i.sourceCrs),!i.pending&&!i.error}_finalizeOldLayers(e){for(let t in e){let n=e[t];n&&this._finalizeLayer(n)}}_initializeLayer(e,t){try{e._initialize(t),e.lifecycle=sE.INITIALIZED}catch(t){this._handleError(`initialization`,t,e)}}_transferLayerState(e,t){t._transferState(e),t.lifecycle=sE.MATCHED,t!==e&&(e.lifecycle=sE.AWAITING_GC)}_updateLayer(e){try{e._update()}catch(t){this._handleError(`update`,t,e)}}_finalizeLayer(e){if(this._coordinateSystems.delete(e.id),!e.internalState){e.lifecycle=sE.FINALIZED;return}this._needsRedraw=this._needsRedraw||`finalized ${e}`,e.lifecycle=sE.AWAITING_FINALIZATION;try{e._finalize(),e.lifecycle=sE.FINALIZED}catch(t){this._handleError(`finalization`,t,e)}}},TE=`default-canvas`,EE=class{constructor(e){this._failedViews=new WeakSet,this.views=[],this.width=100,this.height=100,this.viewState={},this.controllers={},this.timeline=e.timeline,this._viewports=[],this._viewportMap={},this._isUpdating=!1,this._needsRedraw=`First render`,this._needsUpdate=`Initialize`,this._eventManager=e.eventManager,this._eventManagers=e.eventManagers||{},this._viewEventManagers={},this._eventCallbacks={onViewStateChange:e.onViewStateChange,onInteractionStateChange:e.onInteractionStateChange,onViewRemoved:e.onViewRemoved,onError:e.onError},this._pickPosition=e.pickPosition,this._getCanvasContext=e.getCanvasContext,Object.seal(this),this.setProps(e)}finalize(){for(let e in this.controllers){let t=this.controllers[e];t&&t.finalize()}this.controllers={},this.views=[]}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e,this._needsRedraw=this._needsRedraw||e}updateViewStates(){for(let e in this.controllers){let t=this.controllers[e];t&&t.updateTransition()}}getViewports(e){return e?this._viewports.filter(t=>{let n=!e.canvasId||this.getCanvasId(t.id)===e.canvasId,r=!(`x`in e)||t.containsPixel(e);return n&&r}):this._viewports}getViews(){let e={};return this.views.forEach(t=>{e[t.id]=t}),e}getView(e){return this.views.find(t=>t.id===e)}getViewState(e){let t=typeof e==`string`?this.getView(e):e,n=t&&this.viewState[t.getViewStateId()]||this.viewState;return t?t.filterViewState(n):n}getViewport(e){return this._viewportMap[e]}getCanvasId(e){let t=typeof e==`string`?this.getView(e):e;return t?this._viewEventManagers[t.id]?.canvasId||this._getCanvasIdFromView(t):void 0}unproject(e,t){let n=this.getViewports(),r={x:e[0],y:e[1]};for(let i=n.length-1;i>=0;--i){let a=n[i];if(a.containsPixel(r)){let n=e.slice();return n[0]-=a.x,n[1]-=a.y,a.unproject(n,t)}}return null}setProps(e){e.views&&this._setViews(e.views),e.viewState&&this._setViewState(e.viewState),(`width`in e||`height`in e)&&this._setSize(e.width,e.height),`pickPosition`in e&&(this._pickPosition=e.pickPosition),`eventManagers`in e&&this._setEventManagers(e.eventManagers||{}),this.updateViewports()}updateViewports(){return this._isUpdating||!this._needsUpdate?!1:(this._update(),!0)}_update(){this._isUpdating=!0;try{this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports())}finally{this._isUpdating=!1}}_hasViewState(e){let t=e.props.viewState;if(t&&typeof t==`object`&&!t.id||this.viewState[e.getViewStateId()])return!0;let n=Object.values(this.viewState);return n.length===0||n.some(e=>!e||typeof e!=`object`||Array.isArray(e))}_setSize(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.setNeedsUpdate(`Size changed`))}_setViews(e){e=gE(e,Boolean);let t=this.views;if(e=e.map(e=>{let n=t.find(t=>t.id===e.id);return n&&!this._failedViews.has(n)&&n.equals(e)?n:e}),this._diffViews(e,t)){let t=new Set;for(let n of e)t.has(n.id)&&R.warn(`Multiple views with same id ${n.id}`)(),t.add(n.id);for(let e of this.views)t.has(e.id)||this._eventCallbacks.onViewRemoved?.(e.id);this.setNeedsUpdate(`views changed`)}this.views=e;for(let n of e){if(t.includes(n))continue;this._failedViews.delete(n);let e=e=>{this._failedViews.add(n),this.views.includes(n)&&(this._eventCallbacks.onError?this._eventCallbacks.onError(e):R.error(String(e))())};try{let t=n.initialize();t&&t.then(()=>{this.views.includes(n)&&this.setNeedsUpdate(`view initialized`)}).catch(e)}catch(t){e(t)}}}_setViewState(e){e?(Ke(e,this.viewState,3)||this.setNeedsUpdate(`viewState changed`),this.viewState=e):R.warn("missing `viewState` or `initialViewState`")()}_setEventManagers(e){this._eventManagers!==e&&(this._eventManagers=e,this.setNeedsUpdate(`eventManagers changed`))}_getCanvasIdFromView(e){return e.props.canvasId||this._getCanvasContext?.(e.id)?.id||`default-canvas`}_getCanvasDimensions(e){let[t,n]=(this._getCanvasContext?.(e.id))?.getCSSSize()||[this.width,this.height];return{width:t,height:n}}_getViewEventManager(e){let t=this.getCanvasId(e)||`default-canvas`;return{canvasId:t,eventManager:this._eventManagers[t]||this._eventManager}}_startViewportRebuild(){let e=this.controllers,t=this._viewEventManagers;return this._viewports=[],this.controllers={},this._viewEventManagers={},{oldControllers:e,oldViewEventManagers:t}}_getReusableController(e,t,n){return e&&(t?.canvasId!==n.canvasId||t?.eventManager!==n.eventManager)?(e.finalize(),null):e}_createController(e,t){let n=t.type;return new n({timeline:this.timeline,eventManager:this._getViewEventManager(e).eventManager,onViewStateChange:this._eventCallbacks.onViewStateChange,onStateChange:this._eventCallbacks.onInteractionStateChange,makeViewport:t=>this.getView(e.id)?.makeViewport({viewState:t,...this._getCanvasDimensions(e)}),pickPosition:(t,n)=>this._pickPosition?.(t,n,e.id)})}_updateController(e,t,n,r){let i=e.controller;if(i&&n){let a={...t,...i,id:e.id,x:n.x,y:n.y,width:n.width,height:n.height};return(!r||r.constructor!==i.type)&&(r=this._createController(e,a)),r&&r.setProps(a),r}return null}_rebuildViewports(){let{views:e}=this,{oldControllers:t,oldViewEventManagers:n}=this._startViewportRebuild(),r=new Map;e.forEach((e,t)=>{r.has(e.id)||r.set(e.id,t)});let i=!1;for(let a=e.length;a--;){let o=e[a],{width:s,height:c}=this._getCanvasDimensions(o),l=this.getViewState(o),u=o.makeViewport({viewState:l,width:s,height:c});if(r.get(o.id)!==a){u&&this._viewports.unshift(u);continue}let d=this._getViewEventManager(o);this._viewEventManagers[o.id]=d;let f=this._getReusableController(t[o.id],n[o.id],d),p=!!o.controller&&!!u;p&&!this._hasViewState(o)&&(p=!1),p&&!f&&(i=!0),(i||!p)&&f&&(f.finalize(),f=null),this.controllers[o.id]=p?this._updateController(o,l,u,f):null,u&&this._viewports.unshift(u)}for(let e in t){let n=t[e];n&&!this.controllers[e]&&n.finalize()}this._buildViewportMap()}_buildViewportMap(){this._viewportMap={},this._viewports.forEach(e=>{e.id&&(this._viewportMap[e.id]=this._viewportMap[e.id]||e)})}_diffViews(e,t){return e.length===t.length?e.some((e,n)=>!e.equals(t[n])||e!==t[n]&&this._failedViews.has(t[n])):!0}},DE=/^(?:\d+\.?\d*|\.\d+)$/;function OE(e){switch(typeof e){case`number`:if(!Number.isFinite(e))throw Error(`Could not parse position string ${e}`);return{type:`literal`,value:e};case`string`:try{return new ME(jE(e)).parseExpression()}catch(t){let n=t instanceof Error?t.message:String(t);throw Error(`Could not parse position string ${e}: ${n}`)}default:throw Error(`Could not parse position string ${e}`)}}function kE(e,t){switch(e.type){case`literal`:return e.value;case`percentage`:return Math.round(e.value*t);case`binary`:let n=kE(e.left,t),r=kE(e.right,t);return e.operator===`+`?n+r:n-r;default:throw Error(`Unknown layout expression type`)}}function AE(e,t){return kE(e,t)}function jE(e){let t=[],n=0;for(;n<e.length;){let r=e[n];if(/\s/.test(r)){n++;continue}if(r===`+`||r===`-`||r===`(`||r===`)`||r===`%`){t.push({type:`symbol`,value:r}),n++;continue}if(NE(r)||r===`.`){let i=n,a=r===`.`;for(n++;n<e.length;){let t=e[n];if(NE(t)){n++;continue}if(t===`.`&&!a){a=!0,n++;continue}break}let o=e.slice(i,n);if(!DE.test(o))throw Error(`Invalid number token`);t.push({type:`number`,value:parseFloat(o)});continue}if(PE(r)){let r=n;for(;n<e.length&&PE(e[n]);)n++;let i=e.slice(r,n).toLowerCase();t.push({type:`word`,value:i});continue}throw Error(`Invalid token in position string`)}return t}var ME=class{constructor(e){this.index=0,this.tokens=e}parseExpression(){let e=this.parseBinaryExpression();if(this.index<this.tokens.length)throw Error(`Unexpected token at end of expression`);return e}parseBinaryExpression(){let e=this.parseFactor(),t=this.peek();for(;FE(t);){this.index++;let n=this.parseFactor();e={type:`binary`,operator:t.value,left:e,right:n},t=this.peek()}return e}parseFactor(){let e=this.peek();if(!e)throw Error(`Unexpected end of expression`);if(e.type===`symbol`&&e.value===`+`)return this.index++,this.parseFactor();if(e.type===`symbol`&&e.value===`-`)return this.index++,{type:`binary`,operator:`-`,left:{type:`literal`,value:0},right:this.parseFactor()};if(e.type===`symbol`&&e.value===`(`){this.index++;let e=this.parseBinaryExpression();if(!this.consumeSymbol(`)`))throw Error(`Missing closing parenthesis`);return e}if(e.type===`word`&&e.value===`calc`){if(this.index++,!this.consumeSymbol(`(`))throw Error(`Missing opening parenthesis after calc`);let e=this.parseBinaryExpression();if(!this.consumeSymbol(`)`))throw Error(`Missing closing parenthesis`);return e}if(e.type===`number`){this.index++;let t=e.value,n=this.peek();return n&&n.type===`symbol`&&n.value===`%`?(this.index++,{type:`percentage`,value:t/100}):(n&&n.type===`word`&&n.value===`px`&&this.index++,{type:`literal`,value:t})}throw Error(`Unexpected token in expression`)}consumeSymbol(e){let t=this.peek();return t&&t.type===`symbol`&&t.value===e?(this.index++,!0):!1}peek(){return this.tokens[this.index]||null}};function NE(e){return e>=`0`&&e<=`9`}function PE(e){return e>=`a`&&e<=`z`||e>=`A`&&e<=`Z`}function FE(e){return!!(e&&e.type===`symbol`&&(e.value===`+`||e.value===`-`))}function IE(e,...t){let n=Object.assign(Object.create({id:e}),...t);return n.id===void 0&&delete n.id,n}function LE(e,t){let n={...e};for(let e in t)e!==`id`&&(Array.isArray(n[e])&&Array.isArray(t[e])?n[e]=RE(n[e],t[e]):n[e]=t[e]);return n}function RE(e,t){e=e.slice();for(let n=0;n<t.length;n++){let r=t[n];Number.isFinite(r)&&(e[n]=r)}return e}var zE=class{constructor(e){let{id:t,x:n=0,y:r=0,width:i=`100%`,height:a=`100%`,padding:o=null}=e;this.id=t||this.constructor.displayName||`view`;let s=Object.prototype.hasOwnProperty.call(e,`id`)?e.id:void 0;this.props=IE(this.id,e,{id:s||void 0}),this._x=OE(n),this._y=OE(r),this._width=OE(i),this._height=OE(a),this._padding=o&&{left:OE(o.left||0),right:OE(o.right||0),top:OE(o.top||0),bottom:OE(o.bottom||0)},this.equals=this.equals.bind(this),Object.seal(this)}initialize(){}equals(e){return this===e?!0:this.constructor===e.constructor&&Ke({...this.props,id:this.id},{...e.props,id:e.id},2)}clone(e){let t=this.constructor;return new t({...this.props,...e})}makeViewport({width:e,height:t,viewState:n}){n=this.filterViewState(n);let r=this.getDimensions({width:e,height:t});return!r.height||!r.width?null:new(this.getViewportType(n))({...n,...this.props,id:this.id,...r})}getViewStateId(){let{viewState:e}=this.props;return typeof e==`string`?e:e?.id||this.id}filterViewState(e){return this.props.viewState&&typeof this.props.viewState==`object`?this.props.viewState.id?LE(e,this.props.viewState):this.props.viewState:e}getDimensions({width:e,height:t}){let n={x:AE(this._x,e),y:AE(this._y,t),width:AE(this._width,e),height:AE(this._height,t)};return this._padding&&(n.padding={left:AE(this._padding.left,e),top:AE(this._padding.top,t),right:AE(this._padding.right,e),bottom:AE(this._padding.bottom,t)}),n}get controller(){let e=this.props.controller;return e?e===!0?{type:this.ControllerType}:typeof e==`function`?{type:e}:{type:this.ControllerType,...e}:null}},BE=class{constructor(e){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=e}get inProgress(){return this._inProgress}start(e){this.cancel(),this.settings=e,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&=(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,!1)}update(){if(!this._inProgress)return!1;if(this._handle===null){let{_timeline:e,settings:t}=this;this._handle=e.addChannel({delay:e.getTime(),duration:t.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}},VE=()=>{},HE={mode:`preserve`},UE={mode:`hard`},WE={BREAK:1,SNAP_TO_END:2,IGNORE:3},GE=e=>e,KE=WE.BREAK,qE=class{constructor(e){this._onTransitionUpdate=e=>{let{time:t,settings:{interpolator:n,startProps:r,endProps:i,duration:a,easing:o}}=e,s=o(t/a),c=n.interpolateProps(r,i,s);this.propsInTransition=this.getControllerState({...this.props,...c},HE).getViewportProps(),this.onViewStateChange({viewState:this.propsInTransition,oldViewState:this.props})},this.getControllerState=e.getControllerState,this.propsInTransition=null,this.transition=new BE(e.timeline),this.onViewStateChange=e.onViewStateChange||VE,this.onStateChange=e.onStateChange||VE}finalize(){this.transition.cancel()}getViewportInTransition(){return this.propsInTransition}processViewStateChange(e){let t=!1,n=this.props;if(this.props=e,!n||this._shouldIgnoreViewportChange(n,e))return!1;if(this._isTransitionEnabled(e)){let r=n;if(this.transition.inProgress){let{interruption:e,endProps:t}=this.transition.settings;r={...n,...e===WE.SNAP_TO_END?t:this.propsInTransition||n}}this._triggerTransition(r,e),t=!0}else this.transition.cancel();return t}updateTransition(){this.transition.update()}_isTransitionEnabled(e){let{transitionDuration:t,transitionInterpolator:n}=e;return(t>0||t===`auto`)&&!!n}_isUpdateDueToCurrentTransition(e){return this.transition.inProgress&&this.propsInTransition?this.transition.settings.interpolator.arePropsEqual(e,this.propsInTransition):!1}_shouldIgnoreViewportChange(e,t){return this.transition.inProgress?this.transition.settings.interruption===WE.IGNORE||this._isUpdateDueToCurrentTransition(t):this._isTransitionEnabled(t)?t.transitionInterpolator.arePropsEqual(e,t):!0}_triggerTransition(e,t){let n=this.getControllerState(e,HE),r=this.getControllerState(t,UE).shortestPathFrom(n),i=t.transitionInterpolator,a=i.getDuration?i.getDuration(e,t):t.transitionDuration;if(a===0)return;let o=i.initializeProps(e,r);this.propsInTransition={};let s={duration:a,easing:t.transitionEasing||GE,interpolator:i,interruption:t.transitionInterruption||KE,startProps:o.start,endProps:o.end,onStart:t.onTransitionStart,onUpdate:this._onTransitionUpdate,onInterrupt:this._onTransitionEnd(t.onTransitionInterrupt),onEnd:this._onTransitionEnd(t.onTransitionEnd)};this.transition.start(s),this.onStateChange({inTransition:!0}),this.updateTransition()}_onTransitionEnd(e){return t=>{this.propsInTransition=null,this.onStateChange({inTransition:!1,isZooming:!1,isPanning:!1,isRotating:!1}),e?.(t)}}},JE=[`longitude`,`latitude`,`zoom`,`bearing`,`pitch`],YE=[`longitude`,`latitude`,`zoom`],XE=class extends Mx{constructor(e={}){let t=Array.isArray(e)?e:e.transitionProps,n=Array.isArray(e)?{}:e;n.transitionProps=Array.isArray(t)?{compare:t,required:t}:t||{compare:JE,required:YE},super(n.transitionProps),this.opts=n}initializeProps(e,t){let n=super.initializeProps(e,t),{makeViewport:r,around:i}=this.opts;if(r&&i){let a=r(e),o=r(t),s=a.unproject(i);n.start.around=i,Object.assign(n.end,{around:o.project(s),aroundPosition:s,width:t.width,height:t.height})}return n}interpolateProps(e,t,n){let r={};for(let i of this._propsToExtract)r[i]=ke(e[i]||0,t[i]||0,n);if(t.aroundPosition&&this.opts.makeViewport){let i=this.opts.makeViewport({...t,...r});Object.assign(r,i.panByPosition(t.aroundPosition,ke(e.around,t.around,n)))}return r}},ZE={transitionDuration:0},QE=300,$E=300,eD=e=>1-(1-e)*(1-e),tD=e=>e===1?1:1-2**(-10*e),nD={WHEEL:[`wheel`],PAN:[`panstart`,`panmove`,`panend`],PINCH:[`pinchstart`,`pinchmove`,`pinchend`],MULTI_PAN:[`multipanstart`,`multipanmove`,`multipanend`],DOUBLE_CLICK:[`dblclick`],DOUBLE_CLICK_DRAG:[`dblclickdragstart`,`dblclickdragmove`,`dblclickdragend`,`dblclickdragcancel`],KEYBOARD:[`keydown`]},rD={},iD=class{constructor(e){this.state={},this._events={},this._interactionState={isDragging:!1},this._customEvents=[],this._eventStartBlocked=null,this._panMove=!1,this._multiPanMode=null,this._multiPanStartCenter=null,this._doubleClickDragAnchor=null,this._suppressDoubleClickUntil=0,this.invertPan=!1,this.dragMode=`rotate`,this.inertia=0,this.scrollZoom=!0,this.dragPan=!0,this.dragRotate=!0,this.doubleClickZoom=!0,this.doubleClickDragZoom=!0,this.touchZoom=!0,this.touchRotate=!1,this.multiTouchDrag=null,this.trackpadGesture=!1,this.zoomAround=`pointer`,this.keyboard=!0,this.transitionManager=new qE({...e,getControllerState:(t,n)=>new this.ControllerState({...t,constraintContext:n,makeViewport:e.makeViewport}),onViewStateChange:this._onTransition.bind(this),onStateChange:this._setInteractionState.bind(this)}),this.handleEvent=this.handleEvent.bind(this),this.eventManager=e.eventManager,this.onViewStateChange=e.onViewStateChange||(()=>{}),this.onStateChange=e.onStateChange||(()=>{}),this.makeViewport=e.makeViewport,this.pickPosition=e.pickPosition}set events(e){this.toggleEvents(this._customEvents,!1),this.toggleEvents(e,!0),this._customEvents=e,this.props&&this.setProps(this.props)}finalize(){for(let e in this._events)this._events[e]&&this.eventManager?.off(e,this.handleEvent);this.transitionManager.finalize()}handleEvent(e){this._controllerState=void 0;let t=this._eventStartBlocked;switch(e.type){case`panstart`:return t?!1:this._onPanStart(e);case`panmove`:return this._onPan(e);case`panend`:return this._onPanEnd(e);case`pinchstart`:return t||!this._isTrackpadGestureAllowed(e)?!1:this._onPinchStart(e);case`pinchmove`:return this._isTrackpadGestureAllowed(e)?this._onPinch(e):!1;case`pinchend`:return this._isTrackpadGestureAllowed(e)?this._onPinchEnd(e):!1;case`multipanstart`:return t?!1:this._onMultiPanStart(e);case`multipanmove`:return this._onMultiPan(e);case`multipanend`:return this._onMultiPanEnd(e);case`dblclick`:return this._onDoubleClick(e);case`dblclickdragstart`:return t?!1:this._onDoubleClickDragStart(e);case`dblclickdragmove`:return this._onDoubleClickDrag(e);case`dblclickdragend`:case`dblclickdragcancel`:return this._onDoubleClickDragEnd(e);case`wheel`:return this._onWheel(e);case`keydown`:return this._onKeyDown(e);default:return!1}}get controllerState(){return this._controllerState=this._controllerState||new this.ControllerState({makeViewport:this.makeViewport,...this.props,...this.state}),this._controllerState}getCenter(e){let{x:t,y:n}=this.props,{offsetCenter:r}=e;return[r.x-t,r.y-n]}getZoomPosition(e){if(this.zoomAround===`pointer`)return e;let t=this.makeViewport(this.controllerState.getViewportProps()),[n,r]=nS(t.center,t.pixelProjectionMatrix);return[n,r]}isPointInBounds(e,t){let{width:n,height:r}=this.props;if(t&&t.handled)return!1;let i=e[0]>=0&&e[0]<=n&&e[1]>=0&&e[1]<=r;return i&&t&&t.stopPropagation(),i}isFunctionKeyPressed(e){let{srcEvent:t}=e;return!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}isDragging(){return this._interactionState.isDragging||!1}blockEvents(e){let t=setTimeout(()=>{this._eventStartBlocked===t&&(this._eventStartBlocked=null)},e);this._eventStartBlocked=t}setProps(e){e.maxBoundsPadding===void 0&&(e.maxBoundsPadding=null),e.dragMode&&(this.dragMode=e.dragMode);let t=this.props;this.props=e,`transitionInterpolator`in e||(e.transitionInterpolator=this._getTransitionProps().transitionInterpolator),this.transitionManager.processViewStateChange(e);let{inertia:n}=e;this.inertia=Number.isFinite(n)?n:n===!0?QE:0;let{scrollZoom:r=!0,dragPan:i=!0,dragRotate:a=!0,doubleClickZoom:o=!0,doubleClickDragZoom:s=!1,touchZoom:c=!0,touchRotate:l=!1,multiTouchDrag:u=l?`rotate`:null,trackpadGesture:d=!1,zoomAround:f=`pointer`,keyboard:p=!0}=e,m=!!this.onViewStateChange;if(this.toggleEvents(nD.WHEEL,m&&r),this.toggleEvents(nD.PAN,m),this.toggleEvents(nD.PINCH,m&&(c||u===`rotate`)),this.toggleEvents(nD.MULTI_PAN,m&&!!u),this.toggleEvents(nD.DOUBLE_CLICK,m&&o),this.toggleEvents(nD.DOUBLE_CLICK_DRAG,m&&s),this.toggleEvents(nD.KEYBOARD,m&&p),this.scrollZoom=r,this.dragPan=i,this.dragRotate=a,this.doubleClickZoom=o,this.doubleClickDragZoom=s,this.touchZoom=c,this.touchRotate=u===`rotate`,this.multiTouchDrag=u,this.trackpadGesture=d,this.zoomAround=f,this.keyboard=p,(!t||t.height!==e.height||t.width!==e.width||t.maxBounds!==e.maxBounds||t.maxBoundsPadding!==e.maxBoundsPadding)&&e.maxBounds){let t=new this.ControllerState({...e,makeViewport:this.makeViewport}),n=t.getViewportProps();Object.keys(n).some(t=>!Ke(n[t],e[t],1))&&this.updateViewport(t)}}updateTransition(){this.transitionManager.updateTransition()}toggleEvents(e,t){this.eventManager&&e.forEach(e=>{this._events[e]!==t&&(this._events[e]=t,t?this.eventManager.on(e,this.handleEvent):this.eventManager.off(e,this.handleEvent))})}updateViewport(e,t=null,n={}){let r={...e.getViewportProps(),...t},i=this.controllerState!==e;if(this.state=e.getState(),this._setInteractionState(n),i){let e=this.controllerState&&this.controllerState.getViewportProps();this.onViewStateChange&&this.onViewStateChange({viewState:r,interactionState:this._interactionState,oldViewState:e,viewId:this.props.id})}}_onTransition(e){this.onViewStateChange({...e,interactionState:this._interactionState,viewId:this.props.id})}_setInteractionState(e){Object.assign(this._interactionState,e),this.onStateChange(this._interactionState)}_getConstraintContext(e,t){return this.props.rubberBand?{mode:t===`update`?`elastic`:t===`end`?`rebound`:`hard`}:{mode:`hard`}}_getReboundTransition(e,t){if(e.mode!==`rebound`)return null;let n=t.getViewportProps();return Object.keys(n).some(e=>!Ke(this.props[e],n[e],1))?{...this._getTransitionProps(),transitionDuration:$E,transitionEasing:tD}:null}_onPanStart(e){let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e)||e.rightButton||!1;(this.invertPan||this.dragMode===`pan`)&&(n=!n);let r=n?`pan`:`rotate`,i=this._getConstraintContext(r,`start`),a=n?this.controllerState.panStart({pos:t},i):this.controllerState.rotateStart({pos:t},i);return this._panMove=n,this.updateViewport(a,ZE,{isDragging:!0}),!0}_onPan(e){return this.isDragging()?this._panMove?this._onPanMove(e):this._onPanRotate(e):!1}_onPanEnd(e){return this.isDragging()?this._panMove?this._onPanMoveEnd(e):this._onPanRotateEnd(e):!1}_onPanMove(e){if(!this.dragPan)return!1;let t=this.getCenter(e),n=this.controllerState.pan({pos:t},this._getConstraintContext(`pan`,`update`));return this.updateViewport(n,ZE,{isDragging:!0,isPanning:!0}),!0}_onPanMoveEnd(e){let{inertia:t}=this;if(this.dragPan&&t&&e.velocity){let n=this.getCenter(e),r=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],i=this.controllerState.pan({pos:r}).panEnd();this.updateViewport(i,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:eD},{isDragging:!1,isPanning:!0})}else{let e=this.controllerState,t=this._getConstraintContext(`pan`,`end`),n=e.panEnd(t),r=this._getReboundTransition(t,n);this.updateViewport(n,r,{isDragging:!1,isPanning:!!r})}return!0}_onPanRotate(e){if(!this.dragRotate)return!1;let t=this.getCenter(e),n=this.controllerState.rotate({pos:t},this._getConstraintContext(`rotate`,`update`));return this.updateViewport(n,ZE,{isDragging:!0,isRotating:!0}),!0}_onPanRotateEnd(e){let{inertia:t}=this;if(this.dragRotate&&t&&e.velocity){let n=this.getCenter(e),r=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],i=this.controllerState.rotate({pos:r}).rotateEnd();this.updateViewport(i,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:eD},{isDragging:!1,isRotating:!0})}else{let e=this.controllerState,t=this._getConstraintContext(`rotate`,`end`),n=e.rotateEnd(t),r=this._getReboundTransition(t,n);this.updateViewport(n,r,{isDragging:!1,isRotating:!!r})}return!0}_onWheel(e){if(!this.scrollZoom||this.trackpadGesture&&e.device!==`mouse`)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;e.srcEvent.preventDefault();let{speed:n=.01,smooth:r=!1}=this.scrollZoom===!0?{}:this.scrollZoom,{delta:i}=e,a=2/(1+Math.exp(-Math.abs(i*n)));i<0&&a!==0&&(a=1/a);let o=this.getZoomPosition(t),s=r?{...this._getTransitionProps({around:o}),transitionDuration:250}:ZE,c=this.controllerState.zoom({pos:o,scale:a});return this.updateViewport(c,s,{isZooming:!0,isPanning:!0}),r||this._setInteractionState({isZooming:!1,isPanning:!1}),!0}_onMultiPanStart(e){let{multiTouchDrag:t}=this;if(!t||!this._isMultiPanEventAllowed(e,t))return!1;let n=e.offsetCenter;if(!this.isPointInBounds(this.getCenter(e),e))return!1;let r=e.pointerType===`trackpad`,i={x:n.x-(r?0:e.deltaX),y:n.y-(r?0:e.deltaY)},a={...e,offsetCenter:i},o=this.getCenter(a),s=t===`pan`?this.controllerState.panStart({pos:o},this._getConstraintContext(`pan`,`start`)):this.controllerState.rotateStart({pos:o},this._getConstraintContext(`rotate`,`start`));return this._multiPanMode=t,this._multiPanStartCenter=i,this.updateViewport(s,ZE,{isDragging:!0}),!0}_onMultiPan(e){let{mode:t,event:n}=this._getMultiPanEvent(e);return!t||!n||!this.isDragging()?!1:t===`pan`?this._onPanMove(n):this._onPanRotate(n)}_onMultiPanEnd(e){let{mode:t,event:n}=this._getMultiPanEvent(e);if(!t||!n||!this.isDragging())return this._resetMultiPan(),!1;let r=t===`pan`?this._onPanMoveEnd(n):this._onPanRotateEnd(n);return this._resetMultiPan(),r}_isTrackpadGestureAllowed(e){return e.pointerType!==`trackpad`||this.trackpadGesture}_isMultiPanEventAllowed(e,t){return e.pointerType===`trackpad`?this.trackpadGesture&&(t===`pan`?this.dragPan:this.dragRotate):e.pointerType===`touch`&&(t===`pan`?this.dragPan:this.dragRotate)}_getMultiPanEvent(e){let t=this._multiPanMode,n=this._multiPanStartCenter;return!t||!n?{mode:null,event:null}:{mode:t,event:{...e,offsetCenter:{x:n.x+e.deltaX,y:n.y+e.deltaY}}}}_resetMultiPan(){this._multiPanMode=null,this._multiPanStartCenter=null}_onPinchStart(e){this._doubleClickDragAnchor=null;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.controllerState.zoomStart({pos:this.getZoomPosition(t)},this._getConstraintContext(`zoom`,`start`)).rotateStart({pos:t},this._getConstraintContext(`rotate`,`start`));return rD._startPinchRotation=e.rotation,rD._lastPinchEvent=e,this.updateViewport(n,ZE,{isDragging:!0}),!0}_onPinch(e){if(!this.touchZoom&&!this.touchRotate||!this.isDragging())return!1;let t=this.controllerState;if(this.touchZoom){let{scale:n}=e,r=this.getCenter(e);t=t.zoom({pos:this.getZoomPosition(r),scale:n},this._getConstraintContext(`zoom`,`update`))}if(this.touchRotate){let{rotation:n}=e;t=t.rotate({deltaAngleX:rD._startPinchRotation-n},this._getConstraintContext(`rotate`,`update`))}return this.updateViewport(t,ZE,{isDragging:!0,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:this.touchRotate}),rD._lastPinchEvent=e,!0}_onPinchEnd(e){if(!this.isDragging())return!1;let{inertia:t}=this,{_lastPinchEvent:n}=rD;if(this.touchZoom&&t&&n&&e.scale!==n.scale){let r=this.getCenter(e),i=this.getZoomPosition(r),a=this.controllerState.rotateEnd(),o=Math.log2(e.scale),s=2**(o+(o-Math.log2(n.scale))/(e.deltaTime-n.deltaTime)*t/2);a=a.zoom({pos:i,scale:s}).zoomEnd(),this.updateViewport(a,{...this._getTransitionProps({around:i}),transitionDuration:t,transitionEasing:eD},{isDragging:!1,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:!1}),this.blockEvents(t)}else{let e=this.controllerState,t=this._getConstraintContext(`zoom`,`end`),n=this._getConstraintContext(`rotate`,`end`),r=e.zoomEnd(t).rotateEnd(n),i=this._getReboundTransition(this.touchZoom?t:n,r);this.updateViewport(r,i,{isDragging:!1,isPanning:!!i&&this.touchZoom,isZooming:!!i&&this.touchZoom,isRotating:!!i&&this.touchRotate})}return rD._startPinchRotation=null,rD._lastPinchEvent=null,!0}_onDoubleClick(e){if(!this.doubleClickZoom||Date.now()<this._suppressDoubleClickUntil)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e),r=this.getZoomPosition(t),i=this.controllerState.zoom({pos:r,scale:n?.5:2});return this.updateViewport(i,this._getTransitionProps({around:r}),{isZooming:!0,isPanning:!0}),this.blockEvents(100),!0}_onDoubleClickDragStart(e){if(!this.doubleClickDragZoom)return this._doubleClickDragAnchor=null,!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return this._doubleClickDragAnchor=null,!1;this._doubleClickDragAnchor=this.getZoomPosition(t);let n=this.controllerState.zoomStart({pos:this._doubleClickDragAnchor},this._getConstraintContext(`zoom`,`start`));return e.scale!==1&&(n=n.zoom({pos:this._doubleClickDragAnchor,scale:e.scale},this._getConstraintContext(`zoom`,`update`))),this.updateViewport(n,ZE,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDrag(e){let t=this._doubleClickDragAnchor;if(!t)return!1;let n=this.controllerState.zoom({pos:t,scale:e.scale},this._getConstraintContext(`zoom`,`update`));return this.updateViewport(n,ZE,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDragEnd(e){if(!this._doubleClickDragAnchor)return!1;this._doubleClickDragAnchor=null;let t=this.controllerState,n=this._getConstraintContext(`zoom`,`end`),r=t.zoomEnd(n),i=this._getReboundTransition(n,r);return this.updateViewport(r,i,{isDragging:!1,isPanning:!!i,isZooming:!!i}),this._suppressDoubleClickUntil=Date.now()+100,this.blockEvents(100),!0}_onKeyDown(e){if(!this.keyboard)return!1;let t=this.isFunctionKeyPressed(e),{zoomSpeed:n,moveSpeed:r,rotateSpeedX:i,rotateSpeedY:a}=this.keyboard===!0?{}:this.keyboard,{controllerState:o}=this,s,c={};switch(e.srcEvent.code){case`Minus`:s=t?o.zoomOut(n).zoomOut(n):o.zoomOut(n),c.isZooming=!0;break;case`Equal`:s=t?o.zoomIn(n).zoomIn(n):o.zoomIn(n),c.isZooming=!0;break;case`ArrowLeft`:t?(s=o.rotateLeft(i),c.isRotating=!0):(s=o.moveLeft(r),c.isPanning=!0);break;case`ArrowRight`:t?(s=o.rotateRight(i),c.isRotating=!0):(s=o.moveRight(r),c.isPanning=!0);break;case`ArrowUp`:t?(s=o.rotateUp(a),c.isRotating=!0):(s=o.moveUp(r),c.isPanning=!0);break;case`ArrowDown`:t?(s=o.rotateDown(a),c.isRotating=!0):(s=o.moveDown(r),c.isPanning=!0);break;default:return!1}return this.updateViewport(s,this._getTransitionProps(),c),!0}_getTransitionProps(e){let{transition:t}=this;return!t||!t.transitionInterpolator?ZE:e?{...t,transitionInterpolator:new XE({...e,...t.transitionInterpolator.opts,makeViewport:this.controllerState.makeViewport})}:t}},aD=Symbol(`constraintAround`),oD=class{constructor(e,t,n,r){this.makeViewport=n,this._viewportProps=this.applyConstraints(e,r),this._state=t}getViewportProps(){return this._viewportProps}getState(){return this._state}};function sD(e,t,n){let r=e-t;return r&&Number.isFinite(r)?t+r*n/(n+Math.abs(r)):t}function cD(e,t,n){let r=AE(OE(n?.left??0),e),i=AE(OE(n?.right??0),e),a=AE(OE(n?.top??0),t),o=AE(OE(n?.bottom??0),t);return{x:r,y:a,width:e-r-i,height:t-a-o}}function lD(e,t,n){let[r,i]=e.project(t);return r=Number.isFinite(r)?r:e.width/2,i=Number.isFinite(i)?i:e.height/2,{left:r-n.x,right:n.x+n.width-r,top:i-n.y,bottom:n.y+n.height-i}}var uD=5,dD=1.2,fD=512,pD=[[-1/0,-90],[1/0,90]],mD=1;function hD([e,t]){if(Math.abs(t)>90&&(t=Math.sign(t)*90),Number.isFinite(e)){let[n,r]=qx([e,t]);return[n,Pe(r,0,fD)]}let[,n]=qx([0,t]);return[e,Pe(n,0,fD)]}var gD=class extends oD{constructor(e){let{width:t,height:n,latitude:r,longitude:i,zoom:a,bearing:o=0,pitch:s=0,altitude:c=1.5,position:l=[0,0,0],maxZoom:u=20,minZoom:d=0,maxPitch:f=60,minPitch:p=0,startPanLngLat:m,startZoomLngLat:h,startRotatePos:g,startRotateLngLat:_,startBearing:v,startPitch:y,startZoom:b,normalize:x=!0,rubberBand:S=!1}=e,{[aD]:C}=e;Z(Number.isFinite(i)),Z(Number.isFinite(r)),Z(Number.isFinite(a));let w=e.maxBounds||(x?pD:null),T=e.maxBoundsPadding||null;super({width:t,height:n,latitude:r,longitude:i,zoom:a,bearing:o,pitch:s,altitude:c,maxZoom:u,minZoom:d,maxPitch:f,minPitch:p,normalize:x,position:l,maxBounds:w,maxBoundsPadding:T,rubberBand:S,[aD]:C},{startPanLngLat:m,startZoomLngLat:h,startRotatePos:g,startRotateLngLat:_,startBearing:v,startPitch:y,startZoom:b},e.makeViewport,e.constraintContext),this.getAltitude=e.getAltitude}panStart({pos:e},t){return this._getUpdatedState({startPanLngLat:this._unproject(e)},t)}pan({pos:e,startPos:t},n){let r=this.getState().startPanLngLat||this._unproject(t);if(!r)return this;let i=this.makeViewport(this.getViewportProps()).panByPosition(r,e);return this._getUpdatedState(i,n)}panEnd(e){return this._getUpdatedState({startPanLngLat:null},e)}rotateStart({pos:e}){let t=this.getAltitude?.(e);return this._getUpdatedState({startRotatePos:e,startRotateLngLat:t===void 0?void 0:this._unproject3D(e,t),startBearing:this.getViewportProps().bearing,startPitch:this.getViewportProps().pitch})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:n=0}){let{startRotatePos:r,startRotateLngLat:i,startBearing:a,startPitch:o}=this.getState();if(!r||a===void 0||o===void 0)return this;let s;if(s=e?this._getNewRotation(e,r,o,a):{bearing:a+t,pitch:o+n},i){let e=this.makeViewport({...this.getViewportProps(),...s}),t=`panByPosition3D`in e?`panByPosition3D`:`panByPosition`;return this._getUpdatedState({...s,...e[t](i,r)})}return this._getUpdatedState(s)}rotateEnd(){return this._getUpdatedState({startRotatePos:null,startRotateLngLat:null,startBearing:null,startPitch:null})}zoomStart({pos:e},t){return this._getUpdatedState({startZoomLngLat:this._unproject(e),startZoom:this.getViewportProps().zoom},t)}zoom({pos:e,startPos:t,scale:n},r){let{startZoom:i,startZoomLngLat:a}=this.getState();return a||=(i=this.getViewportProps().zoom,this._unproject(t)||this._unproject(e)),a?this._getUpdatedState({zoom:i+Math.log2(n),[aD]:{position:a,screenPosition:e}},r):this}zoomEnd(e){return this._getUpdatedState({startZoomLngLat:null,startZoom:null},e)}zoomIn(e=2,t){return this._zoomFromCenter(e,t)}zoomOut(e=2,t){return this._zoomFromCenter(1/e,t)}moveLeft(e=100,t){return this._panFromCenter([e,0],t)}moveRight(e=100,t){return this._panFromCenter([-e,0],t)}moveUp(e=100,t){return this._panFromCenter([0,e],t)}moveDown(e=100,t){return this._panFromCenter([0,-e],t)}rotateLeft(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing-e})}rotateRight(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing+e})}rotateUp(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch+e})}rotateDown(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch-e})}shortestPathFrom(e){let t=e.getViewportProps(),n={...this.getViewportProps()},{bearing:r,longitude:i}=n;return Math.abs(r-t.bearing)>180&&(n.bearing=r<0?r+360:r-360),Math.abs(i-t.longitude)>180&&(n.longitude=i<0?i+360:i-360),n}applyConstraints(e,t){let n=e,r=n[aD];delete n[aD];let{maxPitch:i,minPitch:a,pitch:o,bearing:s,normalize:c,maxBounds:l,rubberBand:u}=e;c&&(s<-180||s>180)&&(e.bearing=ET(s+180,360)-180),e.pitch=Pe(o,a,i);let d=this._constrainZoom(e.zoom,e),f=u&&t?.mode===`elastic`;if(e.zoom=t?.mode===`preserve`?e.zoom:f?sD(e.zoom,d,mD):d,r){let t=this.makeViewport(e);Object.assign(e,t.panByPosition(r.position,r.screenPosition))}if(c&&(e.longitude<-180||e.longitude>180)&&(e.longitude=ET(e.longitude+180,360)-180),l){let n=cD(e.width,e.height,e.maxBoundsPadding),r=lD(this.makeViewport({...e,bearing:0,pitch:0}),[e.longitude,e.latitude],n),i=hD(l[0]),a=hD(l[1]),o=2**e.zoom,s=[i[0]+r.left/o,i[1]+r.bottom/o],c=[a[0]-r.right/o,a[1]-r.top/o],u=hD([e.longitude,e.latitude]),d=[Pe(u[0],s[0],c[0]),Pe(u[1],s[1],c[1])],p=u.slice();if(n.width>=0&&(p[0]=t?.mode===`preserve`?u[0]:f?sD(u[0],d[0],n.width/2/o):d[0]),n.height>=0&&(p[1]=t?.mode===`preserve`?u[1]:f?sD(u[1],d[1],n.height/2/o):d[1]),p[0]!==u[0]||p[1]!==u[1]){let[t,n]=Jx(p);p[0]!==u[0]&&(e.longitude=t),p[1]!==u[1]&&(e.latitude=n)}}return e}_constrainZoom(e,t){t||=this.getViewportProps();let{maxZoom:n,maxBounds:r}=t,i=r!==null&&t.width>0&&t.height>0,{minZoom:a}=t;if(i){let e=cD(t.width,t.height,t.maxBoundsPadding),i=hD(r[0]),o=hD(r[1]),s=o[0]-i[0],c=o[1]-i[1];e.width>0&&Number.isFinite(s)&&s>0&&(a=Math.max(a,Math.log2(e.width/s))),e.height>0&&Number.isFinite(c)&&c>0&&(a=Math.max(a,Math.log2(e.height/c))),a>n&&(a=n)}return Pe(e,a,n)}_zoomFromCenter(e,t){let{width:n,height:r}=this.getViewportProps();return this.zoom({pos:[n/2,r/2],scale:e},t)}_panFromCenter(e,t){let{width:n,height:r}=this.getViewportProps();return this.pan({startPos:[n/2,r/2],pos:[n/2+e[0],r/2+e[1]]},t)}_getUpdatedState(e,t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e,constraintContext:t})}_unproject(e){let t=this.makeViewport(this.getViewportProps());return e&&t.unproject(e)}_unproject3D(e,t){return this.makeViewport(this.getViewportProps()).unproject(e,{targetZ:t})}_getNewRotation(e,t,n,r){let i=e[0]-t[0],a=e[1]-t[1],o=e[1],s=t[1],{width:c,height:l}=this.getViewportProps(),u=i/c,d=0;a>0?Math.abs(l-s)>uD&&(d=a/(s-l)*dD):a<0&&s>uD&&(d=1-o/s),d=Pe(d,-1,1);let{minPitch:f,maxPitch:p}=this.getViewportProps(),m=r+180*u,h=n;return d>0?h=n+d*(p-n):d<0&&(h=n-d*(f-n)),{pitch:h,bearing:m}}},_D=class extends iD{constructor(){super(...arguments),this.ControllerState=gD,this.transition={transitionDuration:300,transitionInterpolator:new XE({transitionProps:{compare:[`longitude`,`latitude`,`zoom`,`bearing`,`pitch`,`position`],required:[`longitude`,`latitude`,`zoom`]}})},this.dragMode=`pan`,this.rotationPivot=`center`,this._getAltitude=e=>{if(this.rotationPivot===`2d`)return 0;if(this.rotationPivot===`3d`&&this.pickPosition){let{x:t,y:n}=this.props,r=this.pickPosition(t+e[0],n+e[1]);if(r&&r.coordinate&&r.coordinate.length>=3)return r.coordinate[2]}}}setProps(e){`rotationPivot`in e&&(this.rotationPivot=e.rotationPivot||`center`),e.getAltitude=this._getAltitude,e.position=e.position||[0,0,0],e.maxBounds=e.maxBounds||(e.normalize===!1?null:pD),super.setProps(e)}updateViewport(e,t=null,n={}){let r=e.getState();n.isDragging&&r.startRotateLngLat?n={...n,rotationPivotPosition:r.startRotateLngLat}:n.isDragging===!1&&(n={...n,rotationPivotPosition:void 0}),super.updateViewport(e,t,n)}},vD=class extends zE{constructor(e={}){super(e)}getViewportType(){return VT}get ControllerType(){return _D}};vD.displayName=`MapView`;var yD=new nE;function bD(e,t){return(e.order??1/0)-(t.order??1/0)}var xD=class{constructor(e){this._resolvedEffects=[],this._defaultEffects=[],this.effects=[],this._context=e,this._needsRedraw=`Initial render`,this._setEffects([])}addDefaultEffect(e){let t=this._defaultEffects;if(!t.find(t=>t.id===e.id)){let n=t.findIndex(t=>bD(t,e)>0);n<0?t.push(e):t.splice(n,0,e),e.setup(this._context),this._setEffects(this.effects)}}setProps(e){`effects`in e&&(Ke(e.effects,this.effects,1)||this._setEffects(e.effects))}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}getEffects(){return this._resolvedEffects}_setEffects(e){let t={};for(let e of this.effects)t[e.id]=e;let n=[];for(let r of e){let e=t[r.id],i=r;e&&e!==r?e.setProps?(e.setProps(r.props),i=e):e.cleanup(this._context):e||r.setup(this._context),n.push(i),delete t[r.id]}for(let e in t)t[e].cleanup(this._context);this.effects=n,this._resolvedEffects=n.concat(this._defaultEffects),e.some(e=>e instanceof nE)||this._resolvedEffects.push(yD),this._needsRedraw=`effects changed`}finalize(){for(let e of this._resolvedEffects)e.cleanup(this._context);this.effects.length=0,this._resolvedEffects.length=0,this._defaultEffects.length=0}},SD=class extends JT{shouldDrawLayer(e){let{operation:t}=e.props;return t.includes(`draw`)||t.includes(`terrain`)}render(e){return this._render(e)}},CD=`deckRenderer.renderLayers`,wD=class{constructor(e,t={}){this.normalizedColors=!1,this.device=e,this.stats=t.stats,this.layerFilter=null,this.drawPickingColors=!1,this.drawLayersPass=new SD(e),this.pickLayersPass=new iE(e),this.renderCount=0,this._needsRedraw=`Initial render`,this.renderBuffers=[],this.lastPostProcessEffect=null}setProps(e){let t=e.normalizedColors??!1;this.normalizedColors!==t&&(this.normalizedColors=t,this._needsRedraw=`normalizedColors changed`),this.layerFilter!==e.layerFilter&&(this.layerFilter=e.layerFilter,this._needsRedraw=`layerFilter changed`),this.drawPickingColors!==e.drawPickingColors&&(this.drawPickingColors=e.drawPickingColors,this._needsRedraw=`drawPickingColors changed`)}renderLayers(e){let t=this.drawPickingColors?this.pickLayersPass:this.drawLayersPass,n={layerFilter:this.layerFilter,isPicking:this.drawPickingColors,normalizedColors:this.normalizedColors,...e};if(!e.viewports.length){let e=t.render(n),r=`stats`in e?e.stats:e;this._updateStats(r);return}n.effects&&this._preRender(n.effects,n);let r=this.lastPostProcessEffect?this.renderBuffers[0]:n.target;this.lastPostProcessEffect&&(n.clearColor=[0,0,0,0],n.clearCanvas=!0);let i=t.render({...n,target:r}),a=`stats`in i?i.stats:i;n.effects&&(this.lastPostProcessEffect&&(n.clearCanvas=e.clearCanvas===void 0?!0:e.clearCanvas),this._postRender(n.effects,n)),this.renderCount++,hs(CD,this,a,e),this._updateStats(a)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}finalize(){let{renderBuffers:e}=this;for(let t of e)t.delete();e.length=0}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get(`Layers rendered`).addCount(t)}_preRender(e,t){this.lastPostProcessEffect=null,t.preRenderStats=t.preRenderStats||{};for(let n of e)t.preRenderStats[n.id]=n.preRender(t),n.postRender&&(this.lastPostProcessEffect=n.id);this.lastPostProcessEffect&&this._resizeRenderBuffers(t.canvasContext)}_resizeRenderBuffers(e=this.device.canvasContext){let{renderBuffers:t}=this,n=e.getDrawingBufferSize(),[r,i]=n;t.length===0&&[0,1].map(e=>{let n=this.device.createTexture({sampler:{minFilter:`linear`,magFilter:`linear`},width:r,height:i});t.push(this.device.createFramebuffer({id:`deck-renderbuffer-${e}`,colorAttachments:[n]}))});for(let e of t)e.resize(n)}_postRender(e,t){let{renderBuffers:n}=this,r=t.target??t.canvasContext?.getCurrentFramebuffer()??t.target,i={...t,inputBuffer:n[0],swapBuffer:n[1]};for(let t of e)if(t.postRender){i.target=t.id===this.lastPostProcessEffect?r:void 0;let e=t.postRender(i);i.inputBuffer=e,i.swapBuffer=e===n[0]?n[1]:n[0]}}},TD={pickedColor:null,pickedObjectIndex:-1};function ED({pickedColors:e,decodePickingColor:t,deviceX:n,deviceY:r,deviceRadius:i,deviceRect:a}){let{x:o,y:s,width:c,height:l}=a,u=i*i,d=-1,f=0;for(let t=0;t<l;t++){let i=t+s-r,a=i*i;if(a>u)f+=4*c;else for(let t=0;t<c;t++){if(e[f+3]-1>=0){let e=t+o-n,r=e*e+a;r<=u&&(u=r,d=f)}f+=4}}if(d>=0){let n=e.slice(d,d+4),r=t(n);if(r){let e=Math.floor(d/4/c),t=d/4-e*c;return{...r,pickedColor:n,pickedX:o+t,pickedY:s+e}}R.error(`Picked non-existent layer. Is picking buffer corrupt?`)()}return TD}function DD({pickedColors:e,decodePickingColor:t}){let n=new Map;if(e){for(let r=0;r<e.length;r+=4)if(e[r+3]-1>=0){let i=e.slice(r,r+4),a=i.join(`,`);if(!n.has(a)){let e=t(i);e?n.set(a,{...e,color:i}):R.error(`Picked non-existent layer. Is picking buffer corrupt?`)()}}}return Array.from(n.values())}function OD({pickInfo:e,viewports:t,pixelRatio:n,x:r,y:i,z:a}){let o=t[0];t.length>1&&(o=jD(e?.pickedViewports||t,{x:r,y:i}));let s;if(o){let e=[r-o.x,i-o.y];a!==void 0&&(e[2]=a);try{s=o.unproject(e),s.every(Number.isFinite)||(s=null)}catch{s=null}}return{color:null,layer:null,viewport:o,index:-1,picked:!1,x:r,y:i,pixel:[r,i],coordinate:s,devicePixel:e&&`pickedX`in e?[e.pickedX,e.pickedY]:void 0,pixelRatio:n}}function kD(e){let{pickInfo:t,lastPickedInfo:n,mode:r,layers:i}=e,{pickedColor:a,pickedLayer:o,pickedObjectIndex:s}=t,c=o?[o]:[];if(r===`hover`){let e=n.index,t=n.layerId,r=o?o.props.id:null;if(r!==t||s!==e){if(r!==t){let e=i.find(e=>e.props.id===t);e&&c.unshift(e)}n.layerId=r,n.index=s,n.info=null}}let l=OD(e),u=new Map;return u.set(null,l),c.forEach(e=>{let t={...l};e===o&&(t.color=a,t.index=s,t.picked=!0),t=AD({layer:e,info:t,mode:r});let i=t.layer;e===o&&r===`hover`&&(n.info=t),u.set(i.id,t),r===`hover`&&i.updateAutoHighlight(t)}),u}function AD({layer:e,info:t,mode:n}){for(;e&&t;){let r=t.layer||null;t.sourceLayer=r,t.layer=e,t=e.getPickingInfo({info:t,mode:n,sourceLayer:r}),e=e.parent}return t}function jD(e,t){for(let n=e.length-1;n>=0;n--){let r=e[n];if(r.containsPixel(t))return r}return e[0]}var MD=class{constructor(e,t={}){this._pickable=!0,this.device=e,this.stats=t.stats,this.pickLayersPass=new iE(e),this.lastPickedInfo={index:-1,layerId:null,info:null}}setProps(e){`layerFilter`in e&&(this.layerFilter=e.layerFilter),`_pickable`in e&&(this._pickable=e._pickable)}finalize(){this.pickingFBO&&this.pickingFBO.destroy(),this.depthFBO&&this.depthFBO.destroy()}pickObjectAsync(e){return this._pickClosestObjectAsync(e)}pickObjectsAsync(e){return this._pickVisibleObjectsAsync(e)}pickObject(e){return this._pickClosestObject(e)}pickObjects(e){return this._pickVisibleObjects(e)}getLastPickedObject({x:e,y:t,layers:n,viewports:r},i=this.lastPickedInfo.info){let a=i&&i.layer&&i.layer.id,o=i&&i.viewport&&i.viewport.id,s=a?n.find(e=>e.id===a):null,c=o&&r.find(e=>e.id===o)||r[0],l={x:e,y:t,viewport:c,coordinate:c&&c.unproject([e-c.x,t-c.y]),layer:s};return{...i,...l}}_resizeBuffer(e=this.device.getDefaultCanvasContext()){if(!this.pickingFBO){let e=this.device.createTexture({format:`rgba8unorm`,width:1,height:1,usage:L.RENDER_ATTACHMENT|L.COPY_SRC});if(this.pickingFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:`depth16unorm`}),this.device.isTextureFormatRenderable(`rgba32float`)){let e=this.device.createTexture({format:`rgba32float`,width:1,height:1,usage:L.RENDER_ATTACHMENT|L.COPY_SRC});this.depthFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:`depth16unorm`})}}let[t,n]=e.getDrawingBufferSize();this.pickingFBO?.resize({width:t,height:n}),this.depthFBO?.resize({width:t,height:n})}_getPickable(e){if(this._pickable===!1)return null;let t=e.filter(e=>this.pickLayersPass.shouldDrawLayer(e)&&!e.isComposite);return t.length?t:null}async _pickClosestObjectAsync({layers:e,views:t,viewports:n,x:r,y:i,radius:a=0,depth:o=1,mode:s=`query`,unproject3D:c,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=l.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0){let t=kD({pickInfo:{pickedColor:null,pickedObjectIndex:-1},lastPickedInfo:this.lastPickedInfo,mode:s,layers:e,viewports:n,x:r,y:i,pixelRatio:f});return{result:Array.from(t.values()).filter(e=>e.layer),emptyInfo:OD({viewports:n,x:r,y:i,pixelRatio:f})}}this._resizeBuffer(l);let m=l.cssToDevicePixels([r,i],!0),h=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],g=Math.round(a*f),{width:_,height:v}=this.pickingFBO,y=this._getPickingRect({deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceWidth:_,deviceHeight:v}),b={x:r-a,y:i-a,width:a*2+1,height:a*2+1},x,S=[],C=new Set;for(let e=0;e<o;e++){let a;a=y?ED({...await this._drawAndSampleAsync({layers:p,views:t,viewports:n,onViewportActive:u,deviceRect:y,cullRect:b,effects:d,pass:`picking:${s}`,canvasContext:l}),deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceRect:y}):{pickedColor:null,pickedObjectIndex:-1};let m,_=this._getDepthLayers(a,p,c);if(_.length>0){let{pickedColors:e}=await this._drawAndSampleAsync({layers:_,views:t,viewports:n,onViewportActive:u,deviceRect:{x:a.pickedX??h[0],y:a.pickedY??h[1],width:1,height:1},cullRect:b,effects:d,pass:`picking:${s}:z`,canvasContext:l},!0);e[3]&&(m=e[0])}a.pickedLayer&&e+1<o&&(C.add(a.pickedLayer),a.pickedLayer.disablePickingIndex(a.pickedObjectIndex)),x=kD({pickInfo:a,lastPickedInfo:this.lastPickedInfo,mode:s,layers:p,viewports:n,x:r,y:i,z:m,pixelRatio:f});for(let e of x.values())e.layer&&S.push(e);if(!a.pickedColor)break}for(let e of C)e.restorePickingColors();return{result:S,emptyInfo:x.get(null)}}_pickClosestObject({layers:e,views:t,viewports:n,x:r,y:i,radius:a=0,depth:o=1,mode:s=`query`,unproject3D:c,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=l.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0){let t=kD({pickInfo:{pickedColor:null,pickedObjectIndex:-1},lastPickedInfo:this.lastPickedInfo,mode:s,layers:e,viewports:n,x:r,y:i,pixelRatio:f});return{result:Array.from(t.values()).filter(e=>e.layer),emptyInfo:OD({viewports:n,x:r,y:i,pixelRatio:f})}}this._resizeBuffer(l);let m=l.cssToDevicePixels([r,i],!0),h=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],g=Math.round(a*f),{width:_,height:v}=this.pickingFBO,y=this._getPickingRect({deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceWidth:_,deviceHeight:v}),b={x:r-a,y:i-a,width:a*2+1,height:a*2+1},x,S=[],C=new Set;for(let e=0;e<o;e++){let a;a=y?ED({...this._drawAndSample({layers:p,views:t,viewports:n,onViewportActive:u,deviceRect:y,cullRect:b,effects:d,pass:`picking:${s}`,canvasContext:l}),deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceRect:y}):{pickedColor:null,pickedObjectIndex:-1};let m,_=this._getDepthLayers(a,p,c);if(_.length>0){let{pickedColors:e}=this._drawAndSample({layers:_,views:t,viewports:n,onViewportActive:u,deviceRect:{x:a.pickedX??h[0],y:a.pickedY??h[1],width:1,height:1},cullRect:b,effects:d,pass:`picking:${s}:z`,canvasContext:l},!0);e[3]&&(m=e[0])}a.pickedLayer&&e+1<o&&(C.add(a.pickedLayer),a.pickedLayer.disablePickingIndex(a.pickedObjectIndex)),x=kD({pickInfo:a,lastPickedInfo:this.lastPickedInfo,mode:s,layers:p,viewports:n,x:r,y:i,z:m,pixelRatio:f});for(let e of x.values())e.layer&&S.push(e);if(!a.pickedColor)break}for(let e of C)e.restorePickingColors();return{result:S,emptyInfo:x.get(null)}}async _pickVisibleObjectsAsync({layers:e,views:t,viewports:n,x:r,y:i,width:a=1,height:o=1,mode:s=`query`,maxObjects:c=null,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=this._getPickable(e);if(!f||n.length===0)return[];this._resizeBuffer(l);let p=l.cssToDeviceRatio(),m=l.cssToDevicePixels([r,i],!0),h=m.x,g=m.y+m.height,_=l.cssToDevicePixels([r+a,i+o],!0),v=_.x+_.width,y=_.y,b={x:h,y,width:v-h,height:g-y},x=DD(await this._drawAndSampleAsync({layers:f,views:t,viewports:n,onViewportActive:u,deviceRect:b,cullRect:{x:r,y:i,width:a,height:o},effects:d,pass:`picking:${s}`,canvasContext:l})),S=new Map,C=[],w=Number.isFinite(c);for(let e=0;e<x.length&&!(w&&C.length>=c);e++){let t=x[e],n={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:i,pixelRatio:p};n=AD({layer:t.pickedLayer,info:n,mode:s});let a=n.layer.id;S.has(a)||S.set(a,new Set);let o=S.get(a),c=n.object??n.index;o.has(c)||(o.add(c),C.push(n))}return C}_pickVisibleObjects({layers:e,views:t,viewports:n,x:r,y:i,width:a=1,height:o=1,mode:s=`query`,maxObjects:c=null,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=this._getPickable(e);if(!f||n.length===0)return[];this._resizeBuffer(l);let p=l.cssToDeviceRatio(),m=l.cssToDevicePixels([r,i],!0),h=m.x,g=m.y+m.height,_=l.cssToDevicePixels([r+a,i+o],!0),v=_.x+_.width,y=_.y,b={x:h,y,width:v-h,height:g-y},x=DD(this._drawAndSample({layers:f,views:t,viewports:n,onViewportActive:u,deviceRect:b,cullRect:{x:r,y:i,width:a,height:o},effects:d,pass:`picking:${s}`,canvasContext:l})),S=new Map,C=[],w=Number.isFinite(c);for(let e=0;e<x.length&&!(w&&C.length>=c);e++){let t=x[e],n={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:i,pixelRatio:p};n=AD({layer:t.pickedLayer,info:n,mode:s});let a=n.layer.id;S.has(a)||S.set(a,new Set);let o=S.get(a),c=n.object??n.index;o.has(c)||(o.add(c),C.push(n))}return C}async _drawAndSampleAsync({layers:e,views:t,viewports:n,onViewportActive:r,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c},l=!1){let u=l?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:r,pickingFBO:u,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c,pickZ:l,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(d.preRenderStats[e.id]=e.preRender(d));let{decodePickingColor:f,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:h,width:g,height:_}=i,v=u.colorAttachments[0]?.texture;if(!v)throw Error(`Picking framebuffer color attachment is missing`);let y=await this._readTextureDataAsync(v,{x:m,y:h,width:g,height:_},l?Float32Array:Uint8Array);if(!l){let e=!1;for(let t=3;t<y.length;t+=4)if(y[t]!==0){e=!0;break}!e&&y.length>0&&R.warn(`Async pick readback returned only zero alpha values`,{deviceRect:i,bytes:Array.from(y.subarray(0,Math.min(y.length,16)))})()}return{pickedColors:y,decodePickingColor:f}}async _readTextureDataAsync(e,t,n){let{width:r,height:i}=t,a=e.computeMemoryLayout(t),o=this.device.createBuffer({byteLength:a.byteLength,usage:I.COPY_DST|I.MAP_READ});try{let s=this.device.type===`webgpu`;e.readBuffer(s?{...t,y:e.height-t.y-i}:t,o);let c=await o.readAsync(0,a.byteLength),l=n.BYTES_PER_ELEMENT;if(a.bytesPerRow%l!==0)throw Error(`Texture readback row stride ${a.bytesPerRow} is not aligned to ${l}-byte elements.`);let u=new n(c.buffer,c.byteOffset,a.byteLength/l),d=r*4,f=a.bytesPerRow/l;if(f<d)throw Error(`Texture readback row stride ${f} is smaller than packed row length ${d}.`);let p=new n(r*i*4);for(let e=0;e<i;e++){let t=(s?i-1-e:e)*f;p.set(u.subarray(t,t+d),e*d)}return p}finally{o.destroy()}}_drawAndSample({layers:e,views:t,viewports:n,onViewportActive:r,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c},l=!1){let u=l?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:r,pickingFBO:u,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c,pickZ:l,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(d.preRenderStats[e.id]=e.preRender(d));let{decodePickingColor:f,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:h,width:g,height:_}=i,v=new(l?Float32Array:Uint8Array)(g*_*4);return this.device.readPixelsToArrayWebGL(u,{sourceX:m,sourceY:h,sourceWidth:g,sourceHeight:_,target:v}),{pickedColors:v,decodePickingColor:f}}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get(`Layers picked`).addCount(t)}_getDepthLayers(e,t,n){if(!n||!this.depthFBO)return[];let{pickedLayer:r}=e,i=r?.state?.terrainDrawMode===`drape`;return r&&!i?[r]:t.filter(e=>e.props.operation.includes(`terrain`))}_getPickingRect({deviceX:e,deviceY:t,deviceRadius:n,deviceWidth:r,deviceHeight:i}){let a=Math.max(0,e-n),o=Math.max(0,t-n),s=Math.min(r,e+n+1)-a,c=Math.min(i,t+n+1)-o;return s<=0||c<=0?null:{x:a,y:o,width:s,height:c}}},ND={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},PD=`top-left`,FD=`root`,ID=class{constructor({deck:e,parentElement:t}){this.defaultWidgets=[],this.widgets=[],this.resolvedWidgets=[],this.containers={},this.lastViewports={},this.deck=e,t?.classList.add(`deck-widget-container`),this.parentElement=t}getWidgets(){return this.resolvedWidgets}setProps(e){if(e.widgets&&!Ke(e.widgets,this.widgets,1)){let t=e.widgets.filter(Boolean);this._setWidgets(t)}}finalize(){for(let e of this.getWidgets())this._removeWidget(e);this.defaultWidgets.length=0,this.resolvedWidgets.length=0;for(let e in this.containers)this.containers[e].remove()}addDefault(e){this.defaultWidgets.find(t=>t.id===e.id)||(this._addWidget(e),this.defaultWidgets.push(e),this._setWidgets(this.widgets))}onRedraw({viewports:e,layers:t,renderedLayers:n}){let r=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let i of this.getWidgets()){let{viewId:a}=i;if(a){let e=r[a];e&&(i.onViewportChange&&i.onViewportChange(e),i.onRedraw?.({viewports:[e],layers:t,renderedLayers:n}))}else{if(i.onViewportChange)for(let t of e)i.onViewportChange(t);i.onRedraw?.({viewports:e,layers:t,renderedLayers:n})}}this.lastViewports=r,this._updateContainers()}onHover(e,t){for(let n of this.getWidgets()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}getCanvasBounds(e){let t=(this.deck?.getCanvas?.())?.getBoundingClientRect(),n=this.parentElement?.getBoundingClientRect(),r=this.deck?.getCanvasContext?.(e?.id);if(r&&n){r.updatePosition();let[e,t]=r.getPosition(),[i,a]=r.getCSSSize();return{x:e-n.left,y:t-n.top,width:i,height:a}}return{x:t&&n?t.left-n.left:0,y:t&&n?t.top-n.top:0,width:t?.width||this.deck?.width||0,height:t?.height||this.deck?.height||0}}onEvent(e,t){let n=Pw[t.type];if(n)for(let r of this.getWidgets()){let{viewId:i}=r;(!i||i===e.viewport?.id)&&r[n]?.(e,t)}}_setWidgets(e){let t={};for(let e of this.resolvedWidgets)t[e.id]=e;this.resolvedWidgets.length=0;for(let e of this.defaultWidgets)t[e.id]=null,this.resolvedWidgets.push(e);for(let n of e){let e=t[n.id];if(e===null){R.warn(`Multiple widgets with same id ${n.id}`)();continue}e?LD(e)!==LD(n)||e.viewId!==n.viewId||e.placement!==n.placement?(this._removeWidget(e),this._addWidget(n)):n!==e&&(e.setProps(n.props),n=e):this._addWidget(n),t[n.id]=null,this.resolvedWidgets.push(n)}for(let e in t){let n=t[e];n&&this._removeWidget(n)}this.widgets=e}_addWidget(e){let{viewId:t=null,placement:n=PD}=e,r=e.props._container??t;e.widgetManager=this,e.deck=this.deck,e.rootElement=e._onAdd({deck:this.deck,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeWidget(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.widgetManager=void 0}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=e||FD,r=this.containers[n];r||(r=document.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,this.parentElement?.append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=globalThis.document.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,ND[t]),r.append(i)),i}_updateContainers(){for(let e in this.containers){let t=this.lastViewports[e]||null,n=e===FD||t,r=this.containers[e];if(n){let e=this._getContainerBounds(t);r.style.display=`block`,r.style.left=`${e.x}px`,r.style.top=`${e.y}px`,r.style.width=`${e.width}px`,r.style.height=`${e.height}px`}else r.style.display=`none`}}_getContainerBounds(e){if(!e)return{x:0,y:0,width:this.parentElement?.clientWidth||this.deck.width,height:this.parentElement?.clientHeight||this.deck.height};let t=this.getCanvasBounds(e);return{x:t.x+e.x,y:t.y+e.y,width:e.width,height:e.height}}};function LD(e){return e.constructor.defaultProps?.id}function RD(e,t){t&&Object.entries(t).map(([t,n])=>{t.startsWith(`--`)?e.style.setProperty(t,n):e.style[t]=n})}function zD(e,t){t&&Object.keys(t).map(t=>{t.startsWith(`--`)?e.style.removeProperty(t):e.style[t]=``})}var BD=class{constructor(e){this.viewId=null;let{id:t,...n}=this.constructor.defaultProps;this.props=IE(t,n,e,{id:(e&&Object.prototype.hasOwnProperty.call(e,`id`)?e.id:void 0)||void 0}),this.id=this.props.id}setProps(e){let t=this.props,n=this.rootElement;n&&t.className!==e.className&&(t.className&&n.classList.remove(t.className),e.className&&n.classList.add(e.className)),n&&!Ke(t.style,e.style,1)&&(zD(n,t.style),RD(n,e.style)),Object.assign(this.props,e),this.props.id||delete this.props.id,this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}get viewIds(){return this.viewId?[this.viewId]:this.deck?.getViews().map(e=>e.id)??[]}getViewState(e){return this.deck?.viewManager?.getViewState(e)||{}}setViewState(e,t){this.deck?._onViewStateChange({viewId:e,viewState:t,interactionState:{}})}onCreateRootElement(){let e=[`deck-widget`,this.className,this.props.className],t=document.createElement(`div`);return e.filter(e=>typeof e==`string`&&e.length>0).forEach(e=>t.classList.add(e)),RD(t,this.props.style),t}_onAdd(e){return this.onAdd(e)??this.onCreateRootElement()}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};BD.defaultProps={id:`widget`,style:{},_container:null,className:``};var VD={zIndex:`1`,position:`absolute`,pointerEvents:`none`,color:`#a0a7b4`,backgroundColor:`#29323c`,padding:`10px`,top:`0`,left:`0`,display:`none`},HD=class extends BD{constructor(e={}){super(e),this.placement=`fill`,this.className=`deck-tooltip`,this.isVisible=!1,this.setProps(e)}onCreateRootElement(){let e=document.createElement(`div`);return e.className=this.className,Object.assign(e.style,VD),e}onRenderHTML(e){}onViewportChange(e){this.isVisible&&e.id===this.lastViewport?.id&&!e.equals(this.lastViewport)&&this.setTooltip(null),this.lastViewport=e}onHover(e){let{deck:t}=this,n=t&&t.props.getTooltip;if(!n)return;let r=n(e),i=this.widgetManager?.getCanvasBounds(e.viewport),a=e.x+(i?.x||0),o=e.y+(i?.y||0);this.setTooltip(r,a,o)}setTooltip(e,t,n){let r=this.rootElement;if(r){if(typeof e==`string`)r.innerText=e;else if(e)e.text&&(r.innerText=e.text),e.html&&(r.innerHTML=e.html),e.className&&(r.className=e.className);else{this.isVisible=!1,r.style.display=`none`;return}this.isVisible=!0,r.style.display=`block`,r.style.transform=`translate(${t}px, ${n}px)`,e&&typeof e==`object`&&`style`in e&&Object.assign(r.style,e.style)}}};HD.defaultProps={...BD.defaultProps,id:`default-tooltip`};var UD=class{constructor(e){this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap,this._createEventManager=e.createEventManager,this._getEventRoot=e.getEventRoot}finalize(){for(let e of Object.values(this.targets))e.eventManager.destroy(),e.presentationContext.destroy();this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap}syncCanvasEntries(e){let t=this._normalizeCanvasList(e.canvases),n={},r=[],i=new Map;for(let{canvas:e}of t){let t=this._getEventRoot(e);i.set(t,(i.get(t)||0)+1)}for(let{id:a,canvas:o}of t){let t=this._getEventRoot(o),s=i.get(t)===1?t:o,c=this.targets[a];if(!c||c.device!==e.device||c.canvas!==o||c.eventRoot!==s){c?.eventManager.destroy(),c?.presentationContext.destroy();let t=e.device.createPresentationContext({id:a,canvas:o,useDevicePixels:e.useDevicePixels,autoResize:!0});c={id:a,device:e.device,canvas:o,eventRoot:s,presentationContext:t,eventManager:this._createEventManager(s)}}this._eventRootToCanvasId.set(s,a),this._eventRootToCanvasId.set(o,a),n[a]=c,r.push(a)}for(let[e,t]of Object.entries(this.targets))n[e]||(t.eventManager.destroy(),t.presentationContext.destroy());this.targets=n,this.order=r;let a=Object.fromEntries(Object.entries(n).map(([e,t])=>[e,t.eventManager]));this._haveSameEventManagers(a)||(this.eventManagers=a)}getCanvasIdFromEvent(e){return e?this._eventRootToCanvasId.get(e):void 0}getTarget(e){return this.targets[e||this.order[0]||`default-canvas`]||null}_normalizeCanvasList(e=[]){let t=new Set;return e.map((e,n)=>{let r,i;return typeof e==`string`?(r=document.getElementById(e),Z(r,`Canvas with id ${e} not found`),i=e):(r=e,i=r.id||`deckgl-canvas-${n}`),Z(!t.has(i),`Duplicate canvas id ${i}`),t.add(i),{id:i,canvas:r}})}_haveSameEventManagers(e){let t=Object.keys(e),n=Object.keys(this.eventManagers);return t.length===n.length&&t.every(t=>e[t]===this.eventManagers[t])}};function WD(e){try{return e.getDefaultCanvasContext().canvas}catch{return null}}var GD=new WeakMap;function KD(e){let t=GD.get(e);t?t.count++:GD.set(e,{count:1})}function qD(e){let t=GD.get(e);if(t&&--t.count===0){GD.delete(e);for(let e of t.teardowns?.values()??[])e()}}function JD({canvas:e,device:t,ownsCanvas:n}){t.then(t=>{if(!t)return;let r=!n&&t.type===`webgl`&&t.ownsHandle,i=()=>{if(r&&`isConnected`in e&&e.isConnected)return;let n=GD.get(e);n?(n.teardowns??=new Map).set(t,i):t.destroy()};r?setTimeout(i,0):i()})}var YD={WEBGL_depth_texture:{UNSIGNED_INT_24_8_WEBGL:34042},OES_element_index_uint:{},OES_texture_float:{},OES_texture_half_float:{HALF_FLOAT_OES:5131},EXT_color_buffer_float:{},OES_standard_derivatives:{FRAGMENT_SHADER_DERIVATIVE_HINT_OES:35723},EXT_frag_depth:{},EXT_blend_minmax:{MIN_EXT:32775,MAX_EXT:32776},EXT_shader_texture_lod:{}},XD=e=>({drawBuffersWEBGL(t){return e.drawBuffers(t)},COLOR_ATTACHMENT0_WEBGL:36064,COLOR_ATTACHMENT1_WEBGL:36065,COLOR_ATTACHMENT2_WEBGL:36066,COLOR_ATTACHMENT3_WEBGL:36067}),ZD=e=>({VERTEX_ARRAY_BINDING_OES:34229,createVertexArrayOES(){return e.createVertexArray()},deleteVertexArrayOES(t){return e.deleteVertexArray(t)},isVertexArrayOES(t){return e.isVertexArray(t)},bindVertexArrayOES(t){return e.bindVertexArray(t)}}),QD=e=>({VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE:35070,drawArraysInstancedANGLE(...t){return e.drawArraysInstanced(...t)},drawElementsInstancedANGLE(...t){return e.drawElementsInstanced(...t)},vertexAttribDivisorANGLE(...t){return e.vertexAttribDivisor(...t)}});function $D(e=!0){let t=HTMLCanvasElement.prototype;if(!e&&t.originalGetContext){t.getContext=t.originalGetContext,t.originalGetContext=void 0;return}t.originalGetContext=t.getContext,t.getContext=function(e,t){if(e===`webgl`||e===`experimental-webgl`){let e=this.originalGetContext(`webgl2`,t);return e instanceof HTMLElement&&eO(e),e}return this.originalGetContext(e,t)}}function eO(e){e.getExtension(`EXT_color_buffer_float`);let t={...YD,WEBGL_disjoint_timer_query:e.getExtension(`EXT_disjoint_timer_query_webgl2`),WEBGL_draw_buffers:XD(e),OES_vertex_array_object:ZD(e),ANGLE_instanced_arrays:QD(e)},n=e.getExtension.bind(e);e.getExtension=function(e){return n(e)||(e in t?t[e]:null)};let r=e.getSupportedExtensions;e.getSupportedExtensions=function(){return(r.apply(e)||[])?.concat(Object.keys(t))}}var tO=1,nO=class extends Ll{type=`webgl`;enforceWebGL2(e){$D(e)}isSupported(){return typeof WebGL2RenderingContext<`u`}isDeviceHandle(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:(typeof WebGLRenderingContext<`u`&&e instanceof WebGLRenderingContext&&F.warn(`WebGL1 is not supported`,e)(),!1)}async attach(e,t={}){let{WebGLDevice:n}=await l(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-kjtQ_MwY.js`);return{WebGLDevice:e}},__vite__mapDeps([0,1,2,3,4,5,6]));if(e instanceof n)return e;let r=n.getDeviceFromContext(e);if(r)return r;if(!rO(e))throw Error(`Invalid WebGL2RenderingContext`);t=aO(t),await oO(t);let i=t.createCanvasContext===!0?{}:t.createCanvasContext;return new n({...t,_handle:e,createCanvasContext:{canvas:e.canvas,autoResize:!1,...i}})}async create(e={}){let{WebGLDevice:t}=await l(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-kjtQ_MwY.js`);return{WebGLDevice:e}},__vite__mapDeps([0,1,2,3,4,5,6]));e=aO(e),await oO(e);try{let n=new t(e);F.groupCollapsed(tO,`WebGLDevice ${n.id} created`)();let r=`\
${n._reused?`Reusing`:`Created`} device with WebGL2 ${n.props.debug?`debug `:``}context: \
${n.info.vendor}, ${n.info.renderer} for canvas: ${n.canvasContext.id}`;return F.probe(tO,r)(),F.table(tO,n.info)(),n}finally{F.groupEnd(tO)(),F.info(tO,`%cWebGL call tracing: luma.log.set('debug-webgl') `,`color: white; background: blue; padding: 2px 6px; border-radius: 3px;`)()}}};function rO(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:!!(e&&typeof e.createVertexArray==`function`)}var iO=new nO;function aO(e){return{...e,debug:e.debug??x.defaultProps.debug,debugWebGL:e.debugWebGL??x.defaultProps.debugWebGL,debugSpectorJS:e.debugSpectorJS??!!F.get(`debug-spectorjs`)}}async function oO(e){let t=[];(e.debugWebGL||e.debug)&&t.push(Ue()),e.debugSpectorJS&&t.push(He(e));let n=await Promise.allSettled(t);for(let e of n)e.status===`rejected`&&F.error(`Failed to initialize debug libraries ${e.reason}`)()}var sO=`_createdByDeck`;function cO(){}var lO=({isDragging:e})=>e?`grabbing`:`grab`;function uO(e){return e.deviceProps?.debug??e.debug}var dO={sqlFunctions:[],id:``,width:`100%`,height:`100%`,style:null,viewState:null,initialViewState:null,pickingRadius:0,pickAsync:`auto`,layerFilter:null,normalizedColors:!1,parameters:{},parent:null,device:null,deviceProps:{},gl:null,canvas:null,_canvases:null,layers:[],effects:[],views:null,controller:null,useDevicePixels:!0,touchAction:`none`,eventRecognizerOptions:{},_framebuffer:null,_animate:!1,_pickable:!0,_typedArrayManagerProps:{},_customRender:null,widgets:[],onDeviceInitialized:cO,onWebGLInitialized:cO,onResize:cO,onViewStateChange:cO,onInteractionStateChange:cO,onBeforeRender:cO,onAfterRender:cO,onLoad:cO,onError:e=>R.error(e.message,e.cause)(),onHover:null,onClick:null,onDragStart:null,onDrag:null,onDragEnd:null,_onMetrics:null,getCursor:lO,getTooltip:null,debug:!1,drawPickingColors:!1};function fO(e){let t={...e};for(let e in t)t[e]===void 0&&e in dO&&(t[e]=dO[e]);return t}var pO=class{constructor(e){this.width=0,this.height=0,this.userData={},this.device=null,this.canvas=null,this.viewManager=null,this.layerManager=null,this.effectManager=null,this.deckRenderer=null,this.deckPicker=null,this.eventManager=null,this.eventManagers={},this.widgetManager=null,this.tooltip=null,this.animationLoop=null,this._canvasContext=null,this._deviceResizeHandler=null,this.cursorState={isHovering:!1,isDragging:!1},this.stats=new d({id:`deck.gl`}),this.metrics={fps:0,setPropsTime:0,layersCount:0,drawLayersCount:0,updateLayersCount:0,updateAttributesCount:0,updateAttributesTime:0,framesRedrawn:0,pickTime:0,pickCount:0,pickLayersCount:0,gpuTime:0,gpuTimePerFrame:0,cpuTime:0,cpuTimePerFrame:0,bufferMemory:0,textureMemory:0,renderbufferMemory:0,gpuMemory:0},this._metricsCounter=0,this._hoverPickSequence=0,this._pointerDownPickSequence=0,this._needsRedraw=`Initial render`,this._canvasManager=new UD({createEventManager:e=>this._createEventManager(e),getEventRoot:e=>this._getEventRoot(e)}),this._ownedCanvas=null,this._createdDevice=null,this._usedCanvas=null,this._pickRequest={mode:`hover`,x:-1,y:-1,radius:0,canvasId:void 0,event:null,unproject3D:!1},this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this._onPointerMove=e=>{let{_pickRequest:t}=this,n=this._getCanvasIdFromEvent(e);if(e.type===`pointerleave`)t.x=-1,t.y=-1,t.radius=0,t.canvasId=n;else if(e.leftButton||e.rightButton)return;else{let r=e.offsetCenter;if(!r)return;t.x=r.x,t.y=r.y,t.radius=this.props.pickingRadius,t.canvasId=n}this.layerManager&&(this.layerManager.context.mousePosition={x:t.x,y:t.y}),t.event=e},this._onEvent=e=>{let t=Pw[e.type],n=e.offsetCenter,r=this._getCanvasIdFromEvent(e);if(!t||!n||!this.layerManager)return;let i=this.layerManager.getLayers(),a=this._getInternalPickingMode();if(a){if(a===`sync`){let t=e.type===`click`&&this._shouldUnproject3D(i)?this._getFirstPickedInfo(this._pickPointSync(this._getPointPickOptions(n.x,n.y,{unproject3D:!0,canvasId:r},i))):this._getLastPointerDownPickingInfo(n.x,n.y,r,i);this._dispatchPickingEvent(t,e);return}(this._lastPointerDownInfoPromise||Promise.resolve(this._getLastPointerDownPickingInfo(n.x,n.y,r,i))).then(t=>{this._dispatchPickingEvent(t,e)}).catch(e=>this.props.onError?.(e))}},this._onPointerDown=e=>{let t=e.offsetCenter,n=this._getCanvasIdFromEvent(e);if(!t)return;let r=this._getInternalPickingMode();if(!r)return;let i=this.layerManager?.getLayers()||[],a=++this._pointerDownPickSequence;if(r===`sync`){let e=this._pickPointSync({x:t.x,y:t.y,canvasId:n,radius:this.props.pickingRadius}),r=this._getFirstPickedInfo(e);this._lastPointerDownInfo=r,this._lastPointerDownInfoPromise=Promise.resolve(r);return}let o=this._pickPointAsync(this._getPointPickOptions(t.x,t.y,{canvasId:n},i)).then(e=>this._getFirstPickedInfo(e)).then(e=>(a===this._pointerDownPickSequence&&(this._lastPointerDownInfo=e),e)).catch(e=>{this.props.onError?.(e);let r=this.deckPicker&&this.viewManager?this._getLastPointerDownPickingInfo(t.x,t.y,n,i):{};return a===this._pointerDownPickSequence&&(this._lastPointerDownInfo=r),r});this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=o};let t=e;this.props={...dO,...fO(e)},e=this.props,this._validateCanvasConfiguration(e),e.viewState&&e.initialViewState&&R.warn("View state tracking is disabled. Use either `initialViewState` for auto update or `viewState` for manual update.")(),this.viewState=this.props.initialViewState,e.device&&(this.device=e.device,this._setDeviceCanvasContext(e.device),this._useCanvas(WD(e.device)));let n=this.device;!n&&e.gl&&(e.gl instanceof WebGLRenderingContext&&R.error(`WebGL1 context not supported.`)(),this._useCanvas(e.gl.canvas),n=iO.attach(e.gl,{_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps,debug:uO(e)})),n||=this._createDevice(e),this.animationLoop=this._createAnimationLoop(n,e),this.setProps(t),e._typedArrayManagerProps&&wT.setOptions(e._typedArrayManagerProps),this.animationLoop.start()}finalize(){this._restoreDeviceResizeHandler(),this.animationLoop?.stop(),this.animationLoop?.destroy(),this.animationLoop=null,this._hoverPickSequence++,this._pointerDownPickSequence++,this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this.layerManager?.finalize(),this.layerManager=null,this.viewManager?.finalize(),this.viewManager=null,this.effectManager?.finalize(),this.effectManager=null,this.deckRenderer?.finalize(),this.deckRenderer=null,this.deckPicker?.finalize(),this.deckPicker=null,Object.keys(this._canvasManager.targets).length||this.eventManager?.destroy(),this.eventManager=null,this.eventManagers={},this.widgetManager?.finalize(),this.widgetManager=null,this._canvasManager.finalize(),this._isMultiCanvasMode()?this.canvas=null:this.canvas&&this.canvas===this._ownedCanvas&&(this.canvas.parentElement?.removeChild(this.canvas),this.canvas=null,this._ownedCanvas=null),this._canvasContext=null,this._useCanvas(null),this._createdDevice&&=(JD(this._createdDevice),null)}setProps(e){this.stats.get(`setProps Time`).timeStart(),e=fO(e),`onLayerHover`in e&&R.removed(`onLayerHover`,`onHover`)(),`onLayerClick`in e&&R.removed(`onLayerClick`,`onClick`)(),e.initialViewState&&!Ke(this.props.initialViewState,e.initialViewState,3)&&(this.viewState=e.initialViewState),Z(!(`_canvases`in e)||Array.isArray(e._canvases)===this._isMultiCanvasMode()),Object.assign(this.props,e),this._validateCanvasConfiguration(this.props),this._validateInternalPickingMode(),this.device&&this._isMultiCanvasMode()&&this._syncCanvasTargets(),this._setCanvasSize(this.props);let t=Object.create(this.props);if(Object.assign(t,{views:this._getViews(),width:this.width,height:this.height,viewState:this._getViewState(),eventManagers:this.eventManagers}),e.device&&e.device.id!==this.device?.id){this._useCanvas(WD(e.device));let t=e.device.getDefaultCanvasContext();this.animationLoop?.stop(),!this._isMultiCanvasMode()&&this.canvas!==t.canvas&&(this.canvas?.remove(),this.eventManager?.destroy(),this.canvas=null),this._setDeviceCanvasContext(e.device),R.log(`recreating animation loop for new device! id=${e.device.id}`)(),this.animationLoop=this._createAnimationLoop(e.device,e),this.animationLoop.start()}if(this.animationLoop?.setProps(t),e.useDevicePixels!==void 0&&this._canvasContext?.setProps){this._canvasContext.setProps({useDevicePixels:e.useDevicePixels});for(let t of Object.values(this._canvasManager.targets))t.presentationContext.setProps({useDevicePixels:e.useDevicePixels})}this.layerManager&&(this.viewManager.setProps(t),this.layerManager.setViewports(this.getViewports(),this.viewManager.views),this.layerManager.setProps(t),this.effectManager.setProps(t),this.deckRenderer.setProps(t),this.deckPicker.setProps(t),this.widgetManager.setProps(t)),this.stats.get(`setProps Time`).timeEnd()}needsRedraw(e={clearRedrawFlags:!1}){if(!this.layerManager)return!1;if(this.props._animate)return`Deck._animate`;let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);let n=this.viewManager.needsRedraw(e),r=this.layerManager.needsRedraw(e),i=this.effectManager.needsRedraw(e),a=this.deckRenderer.needsRedraw(e);return t=t||n||r||i||a,t}redraw(e){if(!this.layerManager)return;let t=this.needsRedraw({clearRedrawFlags:!0});t=e||t,t&&(this.stats.get(`Redraw Count`).incrementCount(),this.props._customRender?this.props._customRender(t):this._drawLayers(t))}get isInitialized(){return this.viewManager!==null}getViews(){return Z(this.viewManager),this.viewManager.views}getView(e){return Z(this.viewManager),this.viewManager.getView(e)}getViewports(e){return Z(this.viewManager),this.viewManager.getViewports(e)}getCanvas(){return this.canvas}getCanvasContext(e){let t=e?this.viewManager?.getView(e)?.props.canvasId:void 0;return this._getCanvasContext(t)}getEventManager(e){if(!e||!this.viewManager)return this.eventManager;let t=this.viewManager.getCanvasId(e)||`default-canvas`;return this.eventManagers[t]||this.eventManager}async pickObjectAsync(e){let t=(await this._pickAsync(`pickObjectAsync`,`pickObject Time`,e)).result;return t.length?t[0]:null}async pickObjectsAsync(e){return await this._pickAsync(`pickObjectsAsync`,`pickObjects Time`,e)}pickObject(e){let t=this._pick(`pickObject`,`pickObject Time`,e).result;return t.length?t[0]:null}pickMultipleObjects(e){return e.depth=e.depth||10,this._pick(`pickObject`,`pickMultipleObjects Time`,e).result}pickObjects(e){return this._pick(`pickObjects`,`pickObjects Time`,e)}_pickPositionForController(e,t,n){return this._getInternalPickingMode()===`sync`?this.pickObject({x:e,y:t,radius:0,unproject3D:!0,canvasId:n?this.viewManager?.getCanvasId(n):void 0}):null}_addResources(e,t=!1){for(let n in e)this.layerManager.resourceManager.add({resourceId:n,data:e[n],forceUpdate:t})}_removeResources(e){for(let t of e)this.layerManager.resourceManager.remove(t)}_addDefaultEffect(e){this.effectManager.addDefaultEffect(e)}_addDefaultShaderModule(e){this.layerManager.addDefaultShaderModule(e)}_removeDefaultShaderModule(e){this.layerManager?.removeDefaultShaderModule(e)}_addDefaultShaderPlugin(e){this.layerManager.addDefaultShaderPlugin(e)}_removeDefaultShaderPlugin(e){this.layerManager?.removeDefaultShaderPlugin(e)}_resolveInternalPickingMode(){let{pickAsync:e}=this.props,t=this.device?.type||this.props.deviceProps?.type;if(e===`auto`)return t===`webgpu`?`async`:`sync`;if(e===`sync`&&t===`webgpu`)throw Error('`pickAsync: "sync"` is not supported when Deck is using a WebGPU device.');return e}_getInternalPickingMode(){try{return this._resolveInternalPickingMode()}catch(e){return this.props.onError?.(e),null}}_validateInternalPickingMode(){this._getInternalPickingMode()}_getFirstPickedInfo({result:e,emptyInfo:t}){return e[0]||t}_shouldUnproject3D(e=this.layerManager?.getLayers()||[]){return e.some(e=>e.props.pickable===`3d`)}_getPointPickOptions(e,t,n={},r=this.layerManager?.getLayers()||[]){return{x:e,y:t,canvasId:n.canvasId,radius:this.props.pickingRadius,unproject3D:this._shouldUnproject3D(r),...n}}_pickPointSync(e){return this._pick(`pickObject`,`pickObject Time`,e)}_pickPointAsync(e){return this._pickAsync(`pickObjectAsync`,`pickObject Time`,e)}_getLastPointerDownPickingInfo(e,t,n,r=this.layerManager?.getLayers()||[]){return this.deckPicker.getLastPickedObject({x:e,y:t,layers:r,viewports:this.getViewports({x:e,y:t,canvasId:n})},this._lastPointerDownInfo)}_applyHoverCallbacks({result:e,emptyInfo:t},n){if(!this.widgetManager)return;this.cursorState.isHovering=e.some(e=>e.picked);let r=t,i=!1;for(let t of e)r=t,i=t.layer?.onHover(t,n)||i;i||(this.props.onHover?.(r,n),this.widgetManager.onHover(r,n))}_dispatchPickingEvent(e,t){if(!this.layerManager||!this.widgetManager)return;let n=Pw[t.type];if(!n)return;let{layer:r}=e,i=r&&(r[n]||r.props[n]),a=this.props[n],o=!1;i&&(o=i.call(r,e,t)),o||(a?.(e,t),this.widgetManager.onEvent(e,t))}_pickAsync(e,t,n){Z(this.deckPicker);let{stats:r}=this,i=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,a=this._getCanvasContext(i)||void 0;r.get(`Pick Count`).incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(i);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:i}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:i,canvasContext:a});return r.get(t).timeEnd(),o}_pick(e,t,n){Z(this.deckPicker);let{stats:r}=this,i=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,a=this._getCanvasContext(i)||void 0;r.get(`Pick Count`).incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(i);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:i}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:i,canvasContext:a});return r.get(t).timeEnd(),o}_createCanvas(e){let t=e.canvas;return typeof t==`string`&&(t=document.getElementById(t),Z(t)),t?this._ownedCanvas=null:(t=document.createElement(`canvas`),t.id=e.id||`deckgl-overlay`,e.width&&typeof e.width==`number`&&(t.width=e.width),e.height&&typeof e.height==`number`&&(t.height=e.height),(e.parent||document.body).appendChild(t),this._ownedCanvas=t),Object.assign(t.style,e.style),t}_isMultiCanvasMode(){return Array.isArray(this.props._canvases)}_getDefaultCanvasId(){return this._canvasManager.order[0]||`default-canvas`}_validateCanvasConfiguration(e){Array.isArray(e._canvases)&&(Z(!e.canvas),Z(!e.gl),Z(!e.device?.canvasContext||e.device.getDefaultCanvasContext().offscreenCanvas))}_createEventManager(e){let t=new Mw(e,{touchAction:this.props.touchAction,recognizers:Object.keys(Fw).map(e=>{let[t,n,r,i]=Fw[e],a=this.props.eventRecognizerOptions?.[e];return{recognizer:new t({...n,...a,event:e}),recognizeWith:r,requireFailure:i}}),events:{pointerdown:this._onPointerDown,pointermove:this._onPointerMove,pointerleave:this._onPointerMove}});for(let e in Pw)e===`dblclick`?t.watch(e,this._onEvent):t.on(e,this._onEvent);return t}_getEventRoot(e){return e.closest(`.deck-events-root`)||this.props.parent?.querySelector(`.deck-events-root`)||e}_syncCanvasTargets(){if(!this.device||!this._isMultiCanvasMode())return;this._canvasManager.syncCanvasEntries({device:this.device,canvases:this.props._canvases||[],useDevicePixels:this.props.useDevicePixels}),this.eventManagers=this._canvasManager.eventManagers;let e=this._getDefaultCanvasId();this.eventManager=this.eventManagers[e]||null,this.canvas=this._canvasManager.targets[e]?.canvas||null}_setCanvasContext(e){this._canvasContext=e,`style`in e.canvas&&(this.canvas=e.canvas)}_setDeviceCanvasContext(e,t={}){let n=e.getDefaultCanvasContext();this._setCanvasContext(n),this._setDeviceResizeHandler(e,t)}_setDeviceResizeHandler(e,t={}){let n=!!t.syncDrawingBuffer;if(this._deviceResizeHandler?.device===e){this._deviceResizeHandler.syncDrawingBuffer=n;return}this._restoreDeviceResizeHandler();let r=e=>{this._isMultiCanvasMode()?this._updateMultiCanvasDimensions():e===this._canvasContext&&this._canvasContext&&this._onCanvasContextResize(this._canvasContext,{syncDrawingBuffer:this._deviceResizeHandler?.syncDrawingBuffer})};e.props.onResize=r,this._deviceResizeHandler={device:e,onResize:r,syncDrawingBuffer:n}}_restoreDeviceResizeHandler(){let e=this._deviceResizeHandler;e&&e.device.props?.onResize===e.onResize&&(e.device.props.onResize=cO),this._deviceResizeHandler=null}_setCanvasSize(e){if(this._isMultiCanvasMode()||!this.canvas)return;let{width:t,height:n}=e;if(t||t===0){let e=Number.isFinite(t)?`${t}px`:t;this.canvas.style.width=e}if(n||n===0){let t=Number.isFinite(n)?`${n}px`:n;this.canvas.style.position=e.style?.position||`absolute`,this.canvas.style.height=t}}_getCanvasIdFromEvent(e){return this._canvasManager.getCanvasIdFromEvent(e?.rootElement)}_getCanvasContext(e){return this._canvasManager.getTarget(e)?.presentationContext||this._canvasContext}_resizeForCanvasTarget(e){let t=this._canvasManager.getTarget(e);if(!t||!this.device?.canvasContext)return;let[n,r]=t.presentationContext.getDrawingBufferSize();this.device.canvasContext.setDrawingBufferSize(n,r)}_createDeviceCanvas(e){if(this._isMultiCanvasMode()){let t=globalThis.OffscreenCanvas;if(!t)throw Error("`_canvases` requires OffscreenCanvas support.");return new t(typeof e.width==`number`&&Number.isFinite(e.width)?e.width:1,typeof e.height==`number`&&Number.isFinite(e.height)?e.height:1)}return this._createCanvas(e)}_updateCanvasSize(e=this._canvasContext){if(this._isMultiCanvasMode()){this._updateMultiCanvasDimensions();return}let{canvas:t}=this,[n,r]=e?e.getCSSSize():[t?.clientWidth??t?.width??0,t?.clientHeight??t?.height??0];(n!==this.width||r!==this.height)&&(this.width=n,this.height=r,this.viewManager?.setProps({width:n,height:r}),this.layerManager?.setViewports(this.getViewports(),this.viewManager.views),this.props.onResize({width:n,height:r},e||void 0))}_onCanvasContextResize(e,t={}){if(t.syncDrawingBuffer){let{width:t,height:n}=e.canvas;e.setDrawingBufferSize(t,n)}this._needsRedraw=`Canvas resized`,this._updateCanvasSize(e)}_updateMultiCanvasDimensions(){let[e,t]=this._getCanvasContext()?.getCSSSize()||[0,0];(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.props.onResize({width:e,height:t})),this._needsRedraw=`Canvas resized`,this.viewManager?.setNeedsUpdate(`Canvas resized`),this.viewManager?.setProps({width:this.width,height:this.height})}_createAnimationLoop(e,t){let{gl:n,onError:r}=t;return new Du({device:e,autoResizeDrawingBuffer:!n&&!Array.isArray(t._canvases),autoResizeViewport:!1,onInitialize:e=>this._setDevice(e.device),onRender:this._onRenderFrame.bind(this),onError:r})}_useCanvas(e){e!==this._usedCanvas&&(this._usedCanvas&&qD(this._usedCanvas),e&&KD(e),this._usedCanvas=e)}_createDevice(e){let t=this.props.deviceProps?.createCanvasContext,n=typeof t==`object`?t:void 0,r={_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps,adapters:[...e.deviceProps?.adapters??[]],debug:uO(e)};r.adapters.includes(iO)||r.adapters.push(iO);let i={alphaMode:this.props.deviceProps?.type===`webgpu`?`premultiplied`:void 0},a=this._createDeviceCanvas(e),o=this._isMultiCanvasMode()||a===this._ownedCanvas,s=r.type??`webgl`,c=s===`best-available`?Kl.getBestAvailableAdapterType(r.adapters):s,l=Kl.createDevice({_reuseDevices:!0,ownsHandle:o||c!==`webgl`,type:`webgl`,...r,createCanvasContext:{...i,...n,canvas:a,useDevicePixels:this.props.useDevicePixels,autoResize:!0},[sO]:!0});return this._useCanvas(a),this._createdDevice={canvas:a,device:l.then(e=>e.props[sO]?e:null,()=>null),ownsCanvas:o},l}_getViewState(){return this.props.viewState||this.viewState}_getViews(){let{views:e}=this.props,t=Array.isArray(e)?e:e?[e]:[new vD({id:`default-view`})];return t.length&&this.props.controller&&(t[0]=t[0].clone({controller:this.props.controller})),t}_onContextLost(){let{onError:e}=this.props;this.animationLoop&&e&&e(Error(`WebGL context is lost`))}_pickAndCallback(){let{_pickRequest:e}=this;if(e.event){let t=e.event,n=this.layerManager?.getLayers()||[],r=this._getPointPickOptions(e.x,e.y,{canvasId:e.canvasId,radius:e.radius,mode:e.mode},n),i=this._getInternalPickingMode(),a=++this._hoverPickSequence;if(e.event=null,e.canvasId=void 0,!i)return;if(i===`sync`){this._applyHoverCallbacks(this._pickPointSync(r),t);return}this._pickPointAsync(r).then(({result:e,emptyInfo:n})=>{a===this._hoverPickSequence&&this._applyHoverCallbacks({result:e,emptyInfo:n},t)}).catch(e=>this.props.onError?.(e))}}_updateCursor(){let e=this.props.getCursor(this.cursorState);if(this._isMultiCanvasMode()){for(let t of Object.values(this._canvasManager.targets))t.canvas.style.cursor=e;return}let t=this.props.parent||this.canvas;t&&(t.style.cursor=e)}_setDevice(e){if(this.device=e,this._validateInternalPickingMode(),!this.animationLoop)return;if(this._setDeviceCanvasContext(e,{syncDrawingBuffer:!!(this.props.gl&&this.props.device!==e)}),this._isMultiCanvasMode()?this._syncCanvasTargets():this.canvas&&!this.canvas.isConnected&&this.props.parent&&this.props.parent.insertBefore(this.canvas,this.props.parent.firstChild),this.device.type===`webgl`){let{gl:e}=this.device;this.device.setParametersWebGL({blend:!0,blendFunc:[770,771,1,771],polygonOffsetFill:!0,depthTest:!0,depthFunc:515})}this.props.onDeviceInitialized?.(this.device),this.device.type===`webgl`&&this.props.onWebGLInitialized(this.device.gl);let t=new xu;if(t.play(),this.animationLoop.attachTimeline(t),!this._isMultiCanvasMode()){let e=this.canvas&&this._getEventRoot(this.canvas);Z(e),this.eventManager=this._createEventManager(e),this.eventManagers={[TE]:this.eventManager}}this.viewManager=new EE({timeline:t,eventManager:this.eventManager,eventManagers:this.eventManagers,getCanvasContext:this._isMultiCanvasMode()?this.getCanvasContext.bind(this):void 0,onViewStateChange:this._onViewStateChange.bind(this),onInteractionStateChange:this._onInteractionStateChange.bind(this),onViewRemoved:e=>this.layerManager?.projectionScaleResources.delete(e),onError:e=>this.props.onError?.(e),pickPosition:this._pickPositionForController.bind(this),views:this._getViews(),viewState:this._getViewState(),width:this.width,height:this.height});let n=this.viewManager.getViewports()[0];this.layerManager=new wE(this.device,{deck:this,stats:this.stats,viewport:n,timeline:t}),this.effectManager=new xD({deck:this,device:this.device}),this.deckRenderer=new wD(this.device,{stats:this.stats}),this.deckPicker=new MD(this.device,{stats:this.stats});let r=this.props.parent?.querySelector(`.deck-widgets-root`)||(this._isMultiCanvasMode()?this.props.parent||this.canvas?.parentElement:null)||this.canvas?.parentElement;this.widgetManager=new ID({deck:this,parentElement:r}),this.widgetManager.addDefault(new HD),this.setProps({}),this._updateCanvasSize(this._canvasContext),this.props.onLoad()}_drawLayers(e,t){let{device:n,gl:r}=this.layerManager.context;this.props.onBeforeRender({device:n,gl:r});let i=new Map,a={target:this.props._framebuffer,layers:this.layerManager.getLayers(),viewports:this.viewManager.getViewports(),onViewportActive:this.layerManager.activateViewport,views:this.viewManager.getViews(),pass:`screen`,effects:this.effectManager.getEffects(),...t,onLayerEligible:(e,t)=>{let n=i.get(t);n||(n=new Set,i.set(t,n)),n.add(e)}};if(this._isMultiCanvasMode()&&a.pass===`screen`&&!a.target&&this._canvasManager.order.length)for(let e of this._canvasManager.order){let t=a.viewports.filter(t=>this.viewManager.getCanvasId(t.id)===e);if(!t.length){let t=this._canvasManager.targets[e];this._resizeForCanvasTarget(e),this.deckRenderer?.renderLayers({...a,canvasContext:t.presentationContext,target:t.presentationContext.getCurrentFramebuffer(),viewports:[],clearCanvas:!0}),t.presentationContext.present();continue}let n=this._canvasManager.targets[e];this._resizeForCanvasTarget(e);let r=n.presentationContext.getCurrentFramebuffer();this.deckRenderer?.renderLayers({...a,canvasContext:n.presentationContext,target:r,viewports:t}),n.presentationContext.present()}else this.deckRenderer?.renderLayers(a);a.pass===`screen`&&this.widgetManager.onRedraw({viewports:a.viewports,layers:a.layers,renderedLayers:i}),this.props.onAfterRender({device:n,gl:r})}_onRenderFrame(){this._getFrameStats(),this._metricsCounter++%60==0&&(this._getMetrics(),this.stats.reset(),R.table(4,this.metrics)(),this.props._onMetrics&&this.props._onMetrics(this.metrics)),this._updateCursor(),this.viewManager.updateViewports()&&this.layerManager.setViewports(this.getViewports(),this.viewManager.views),this.layerManager.updateLayers(),this._pickAndCallback(),this.redraw(),this.viewManager&&this.viewManager.updateViewStates()}_onViewStateChange(e){let t=this.props.onViewStateChange(e)||e.viewState;this.viewState&&(this.viewState={...this.viewState,[e.viewId]:t},this.props.viewState||this.viewManager&&this.viewManager.setProps({viewState:this.viewState}))}_onInteractionStateChange(e){this.cursorState.isDragging=e.isDragging||!1,this.props.onInteractionStateChange(e)}_getFrameStats(){let{stats:e}=this;e.get(`frameRate`).timeEnd(),e.get(`frameRate`).timeStart();let t=this.animationLoop.stats;e.get(`GPU Time`).addTime(t.get(`GPU Time`).lastTiming),e.get(`CPU Time`).addTime(t.get(`CPU Time`).lastTiming)}_getMetrics(){let{metrics:e,stats:t}=this;e.fps=t.get(`frameRate`).getHz(),e.setPropsTime=t.get(`setProps Time`).time,e.updateAttributesTime=t.get(`Update Attributes`).time,e.framesRedrawn=t.get(`Redraw Count`).count,e.pickTime=t.get(`pickObject Time`).time+t.get(`pickMultipleObjects Time`).time+t.get(`pickObjects Time`).time,e.pickCount=t.get(`Pick Count`).count,e.layersCount=this.layerManager?.layers.length??0,e.drawLayersCount=t.get(`Layers rendered`).lastSampleCount,e.pickLayersCount=t.get(`Layers picked`).lastSampleCount,e.updateLayersCount=t.get(`Layer updates`).count,e.updateAttributesCount=t.get(`Attributes updated`).count,e.gpuTime=t.get(`GPU Time`).time,e.cpuTime=t.get(`CPU Time`).time,e.gpuTimePerFrame=t.get(`GPU Time`).getAverageTime(),e.cpuTimePerFrame=t.get(`CPU Time`).getAverageTime();let n=Kl.stats.get(`GPU Time and Memory`);e.bufferMemory=n.get(`Buffer Memory`).count,e.textureMemory=n.get(`Texture Memory`).count,e.renderbufferMemory=n.get(`Renderbuffer Memory`).count,e.gpuMemory=n.get(`GPU Memory`).count}};pO.defaultProps=dO,pO.VERSION=ys;function mO(e){switch(e){case`float64`:return Float64Array;case`uint8`:case`unorm8`:return Uint8ClampedArray;default:return ye(e)}}var hO=_e.getDataType.bind(_e);function gO(e,t,n){if(t.size>4)return null;let r=n===`webgpu`&&t.type===`uint8`?`unorm8`:t.type,i=t.size,a=!!(n!==`webgpu`&&i===3&&r&&[`uint8`,`sint8`,`unorm8`,`snorm8`,`uint16`,`sint16`,`unorm16`,`snorm16`].includes(r));return{attribute:e,format:i>1?`${r}x${i}${a?`-webgl`:``}`:t.type,byteOffset:t.offset||0}}function _O(e){return e.stride||e.size*e.bytesPerElement}function vO(e,t){return e.type===t.type&&e.size===t.size&&_O(e)===_O(t)&&(e.offset||0)===(t.offset||0)}function yO(e,t){t.offset&&R.removed(`shaderAttribute.offset`,`vertexOffset, elementOffset`)();let n=_O(e),r=t.vertexOffset===void 0?e.vertexOffset||0:t.vertexOffset,i=t.elementOffset||0,a=r*n+i*e.bytesPerElement+(e.offset||0);return{...t,offset:a,stride:n}}function bO(e,t){let n=yO(e,t);return{high:n,low:{...n,offset:n.offset+e.size*4}}}var xO=class{constructor(e,t,n){this._buffer=null,this.device=e,this.id=t.id||``,this.size=t.size||1;let r=t.logicalType||t.type,i=r===`float64`,{defaultValue:a}=t;a=Number.isFinite(a)?[a]:a||Array(this.size).fill(0);let o;o=i?`float32`:!r&&t.isIndexed?`uint32`:r||`float32`;let s=mO(r||o);this.doublePrecision=i,i&&t.fp64===!1&&(s=Float32Array),this.value=null,this.settings={...t,defaultType:s,defaultValue:a,logicalType:r,type:o,normalized:o.includes(`norm`),size:this.size,bytesPerElement:s.BYTES_PER_ELEMENT},this.state={...n,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let e=this.getAccessor();return e.vertexOffset?e.vertexOffset*_O(e):0}get numInstances(){return this.state.numInstances}set numInstances(e){this.state.numInstances=e}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&=(this._buffer.delete(),null),wT.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&this.device.type!==`webgpu`?null:this.state.externalBuffer||this._buffer}getValue(e=this.id,t=null){let n={};if(this.state.constant){let r=this.value;if(this.device.type===`webgpu`&&this._buffer)n[e]=this._buffer;else if(t){let i=yO(this.getAccessor(),t),a=i.offset/r.BYTES_PER_ELEMENT,o=i.size||this.size;n[e]=r.subarray(a,a+o)}else n[e]=r}else n[e]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?n[`${e}64Low`]=n[e]:n[`${e}64Low`]=new Float32Array(this.size)),n}_getBufferLayout(e=this.id,t=null){let n=this.getAccessor(),r=[],i={name:this.id,byteStride:this.device.type===`webgpu`&&this.state.constant?0:_O(n)};if(this.doublePrecision){let i=bO(n,t||{});r.push(gO(e,{...n,...i.high},this.device.type),gO(`${e}64Low`,{...n,...i.low},this.device.type))}else if(t){let i=yO(n,t);r.push(gO(e,{...n,...i},this.device.type))}else r.push(gO(e,n,this.device.type));return i.attributes=r.filter(Boolean),i}setAccessor(e){this.state.bufferAccessor=e}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let e=null;if(this.state.constant&&this.value){let t=Array.from(this.value);e=[t,t]}else{let{value:t,numInstances:n,size:r}=this,i=n*r;if(t&&i&&t.length>=i){let n=Array(r).fill(1/0),a=Array(r).fill(-1/0);for(let e=0;e<i;)for(let i=0;i<r;i++){let r=t[e++];r<n[i]&&(n[i]=r),r>a[i]&&(a[i]=r)}e=[n,a]}}return this.state.bounds=e,e}setData(e){let{state:t}=this,n;n=ArrayBuffer.isView(e)?{value:e}:e instanceof I?{buffer:e}:e;let r={...this.settings,...n};if(ArrayBuffer.isView(n.value)){if(!n.type)if(this.doublePrecision&&n.value instanceof Float64Array)r.type=`float32`;else{let e=hO(n.value);r.type=r.normalized?e.replace(`int`,`norm`):e}r.bytesPerElement=n.value.BYTES_PER_ELEMENT,r.stride=_O(r)}if(t.bounds=null,n.constant){let e=n.value;if(e=this._normalizeValue(e,[],0),this.settings.normalized&&(e=this.normalizeConstant(e)),!(!t.constant||!this._areValuesEqual(e,this.value)))return!1;t.externalBuffer=null,t.constant=!0,this.value=ArrayBuffer.isView(e)?e:new Float32Array(e)}else if(n.buffer)t.externalBuffer=n.buffer,t.constant=!1,this.value=n.value||null;else if(n.value){this._checkExternalBuffer(n);let e=n.value,i=e;t.externalBuffer=null,t.constant=!1,this.value=e,this._shouldSplitDoublePrecisionValue(i)&&(i=NT(i,r),e instanceof Float32Array&&(r.stride=r.size*2*Float32Array.BYTES_PER_ELEMENT));let{buffer:a}=this,o=_O(r),s=(r.vertexOffset||0)*o;if(this.settings.isIndexed){let e=this.settings.defaultType;i.constructor!==e&&(i=new e(i))}let c=i.byteLength+s+o*2;(!a||a.byteLength<c)&&(a=this._createBuffer(c)),a.write(i,s)}return this.setAccessor(r),!0}updateSubBuffer(e={}){this.state.bounds=null;let t=this.value,{startOffset:n=0,endOffset:r}=e,i=this._shouldSplitDoublePrecisionValue(t);this.buffer.write(i?NT(t,{size:this.size,startIndex:n,endIndex:r}):t.subarray(n,r),n*(i?8:t.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(e,t=!1){let{state:n}=this,r=n.allocatedValue,i=wT.allocate(r,e+1,{size:this.size,type:this.settings.defaultType,copy:t});this.value=i;let a=this._shouldSplitDoublePrecisionValue(i),o=a&&i instanceof Float32Array?{...this.settings,stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(o);let{byteOffset:s}=this,{buffer:c}=this,l=i.byteLength*(a&&i instanceof Float32Array?2:1);return(!c||c.byteLength<l+s)&&(c=this._createBuffer(l+s),t&&r&&c.write(this._shouldSplitDoublePrecisionValue(r)?NT(r,this):r,s)),n.allocatedValue=i,n.constant=!1,n.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(e){return!!(this.doublePrecision&&(e instanceof Float64Array||this.device.type===`webgpu`&&e instanceof Float32Array))}_checkExternalBuffer(e){let{value:t}=e;if(!ArrayBuffer.isView(t))throw Error(`Attribute ${this.id} value is not TypedArray`);let n=this.settings.defaultType,r=!1;if(this.doublePrecision&&(r=t.BYTES_PER_ELEMENT<4),r)throw Error(`Attribute ${this.id} does not support ${t.constructor.name}`);!(t instanceof n)&&this.settings.normalized&&!(`normalized`in e)&&R.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(e){switch(this.settings.type){case`snorm8`:return new Float32Array(e).map(e=>(e+128)/255*2-1);case`snorm16`:return new Float32Array(e).map(e=>(e+32768)/65535*2-1);case`unorm8`:return new Float32Array(e).map(e=>e/255);case`unorm16`:return new Float32Array(e).map(e=>e/65535);default:return e}}_normalizeValue(e,t,n){let{defaultValue:r,size:i}=this.settings;if(Number.isFinite(e))return t[n]=e,t;if(!e){let e=i;for(;--e>=0;)t[n+e]=r[e];return t}switch(i){case 4:t[n+3]=Number.isFinite(e[3])?e[3]:r[3];case 3:t[n+2]=Number.isFinite(e[2])?e[2]:r[2];case 2:t[n+1]=Number.isFinite(e[1])?e[1]:r[1];case 1:t[n+0]=Number.isFinite(e[0])?e[0]:r[0];break;default:let a=i;for(;--a>=0;)t[n+a]=Number.isFinite(e[a])?e[a]:r[a]}return t}_areValuesEqual(e,t){if(!e||!t)return!1;let{size:n}=this;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}_createBuffer(e){this._buffer&&this._buffer.destroy();let{isIndexed:t,type:n}=this.settings,r=this.device.type===`webgpu`&&!t?I.VERTEX|I.STORAGE|I.COPY_DST|I.COPY_SRC:(t?I.INDEX:I.VERTEX)|I.COPY_DST;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:r,indexType:t?n:void 0,byteLength:e}),this._buffer}};function SO(e,t,n,r,i=0){for(let a=0;a<r;a++){let r=e[i+a];t[n+a]=Number.isFinite(r)?Math.round(Math.min(1,Math.max(0,r))*255):a===3?255:0}}var CO=[],wO=[];function TO(e,t=0,n=1/0){let r=CO,i={index:-1,data:e,target:[]};return e?typeof e[Symbol.iterator]==`function`?r=e:e.length>0&&(wO.length=e.length,r=wO):r=CO,(t>0||Number.isFinite(n))&&(r=(Array.isArray(r)?r:Array.from(r)).slice(t,n),i.index=t-1),{iterable:r,objectInfo:i}}function EO(e){return e&&e[Symbol.asyncIterator]}function DO(e,t){let{size:n,stride:r,offset:i,startIndices:a,nested:o}=t,s=e.BYTES_PER_ELEMENT,c=r?r/s:n,l=i?i/s:0,u=Math.floor((e.length-l)/c);return(t,{index:r,target:i})=>{if(!a){let t=r*c+l;for(let r=0;r<n;r++)i[r]=e[t+r];return i}let s=a[r],d=a[r+1]||u,f;if(o){f=Array(d-s);for(let t=s;t<d;t++){let r=t*c+l;i=Array(n);for(let t=0;t<n;t++)i[t]=e[r+t];f[t-s]=i}}else if(c===n)f=e.subarray(s*n+l,d*n+l);else{f=new e.constructor((d-s)*n);let t=0;for(let r=s;r<d;r++){let i=r*c+l;for(let r=0;r<n;r++)f[t++]=e[i+r]}}return f}}var OO=[],kO=[[0,1/0]];function AO(e,t){if(e===kO||(t[0]<0&&(t[0]=0),t[0]>=t[1]))return e;let n=[],r=e.length,i=0;for(let a=0;a<r;a++){let r=e[a];r[1]<t[0]?(n.push(r),i=a+1):r[0]>t[1]?n.push(r):t=[Math.min(r[0],t[0]),Math.max(r[1],t[1])]}return n.splice(i,0,t),n}var jO={interpolation:{duration:0,easing:e=>e},spring:{stiffness:.05,damping:.5}};function MO(e,t){if(!e)return null;Number.isFinite(e)&&(e={type:`interpolation`,duration:e});let n=e.type||`interpolation`;return{...jO[n],...t,...e,type:n}}var NO=class{isConstant=!0;format;value;byteLength;constructor({format:e,value:t}){let n=ne(e);if(n.fixedSizeList)throw Error(`GPUConstant cannot represent fixed-size-list storage columns`);let r=PO(e);if(t.constructor!==r)throw Error(`GPUConstant format "${e}" requires ${r.name}, received ${t.constructor.name}`);if(t.byteLength!==n.byteLength)throw Error(`GPUConstant format "${e}" requires exactly ${n.byteLength} bytes, received ${t.byteLength}`);let i=t.constructor;this.format=e,this.value=new i(t),this.byteLength=this.value.byteLength}};function PO(e){return e===`unorm10-10-10-2`?Uint32Array:ve(ne(e).type)}function FO(e){let[t,...n]=e.data;if(!t||n.length>0)throw Error(`GPUVector "${e.name}" requires exactly one GPUData chunk`);return t}var IO=[],LO=class extends xO{constructor(e,t){let n=t.semanticType===`color`?{...t,normalizedColorInput:!1,defaultValue:t.defaultValue??[0,0,0,255]}:t;super(e,n,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:kO}),this.constant=!1,this.settings.update=t.update||(t.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(e){this.state.startIndices=e}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:e=!1}={}){let t=this.state.needsRedraw;return this.state.needsRedraw=t&&!e,t}layoutChanged(){return this.state.layoutChanged}setLayoutChanged(){this.state.layoutChanged=!0}setAccessor(e){var t;(t=this.state).layoutChanged||(t.layoutChanged=!vO(e,this.getAccessor())),super.setAccessor(e)}getUpdateTriggers(){let{accessor:e}=this.settings;return[this.id].concat(typeof e!=`function`&&e||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(e){if(!e||!this.supportsTransition())return null;let{accessor:t}=this.settings,n=this.settings.transition;return MO(Array.isArray(t)?e[t.find(t=>e[t])]:e[t],n)}setNeedsUpdate(e=this.id,t){if(this.state.needsUpdate=this.state.needsUpdate||e,this.setNeedsRedraw(e),t){let{startRow:e=0,endRow:n=1/0}=t;this.state.updateRanges=AO(this.state.updateRanges,[e,n])}else this.state.updateRanges=kO}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=OO}setNeedsRedraw(e=this.id){this.state.needsRedraw=this.state.needsRedraw||e}allocate(e){let{state:t,settings:n}=this;if(n.noAlloc)return!1;if(n.update){let n=this.isConstant;return super.allocate(e,t.updateRanges!==kO),t.layoutChanged||=n&&this.device.type===`webgpu`,!0}return!1}updateBuffer({numInstances:e,data:t,props:n,context:r}){if(!this.needsUpdate())return!1;let{state:{updateRanges:i},settings:{update:a,noAlloc:o}}=this,s=!0;if(a){for(let[o,s]of i)a.call(r,this,{data:t,startRow:o,endRow:s,props:n,numInstances:e});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let e=this.value;this.value=null,this.setConstantValue(r,e)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[t,n]of i){let r=Number.isFinite(t)?this.getVertexOffset(t):0,i=Number.isFinite(n)?this.getVertexOffset(n):o||!Number.isFinite(e)?this.value.length:e*this.size;super.updateSubBuffer({startOffset:r,endOffset:i})}this._checkAttributeArray()}else s=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),s}setConstantValue(e,t){if(t===void 0||typeof t==`function`)return!1;let n=this.settings.transform&&e?this.settings.transform.call(e,t):t;switch(this.settings.semanticType){case`color`:this.settings.normalizedColorInput&&Array.isArray(n)&&t!==this.settings.defaultValue&&(SO(n,IO,0,this.size),n=IO);break;default:break}return this.setData({constant:!0,value:n}),!0}setData(e){var t,n;let r=this.isConstant;if(ArrayBuffer.isView(e)||e instanceof I||!e.constant){let n=super.setData(e);return this.state.constantValue=null,(t=this.state).layoutChanged||(t.layoutChanged=r&&this.device.type===`webgpu`),n}let i=this.settings.defaultType;this.state.constantValue=this._normalizeValue(e.value,new i(this.size),0);let a=super.setData(e);if(this.device.type===`webgpu`){let e=this.state.constantValue;this.doublePrecision&&(e instanceof Float32Array||e instanceof Float64Array)&&(e=NT(e,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}));let t=this._buffer;(!t||t.byteLength<e.byteLength)&&(t=this._createBuffer(e.byteLength)),t.write(e),(n=this.state).layoutChanged||(n.layoutChanged=!r),this.constant=!1}return a&&this.setNeedsRedraw(),this.clearNeedsUpdate(),a}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(e){let{state:t}=this;return e?(this.clearNeedsUpdate(),t.lastExternalBuffer===e?!0:(t.lastExternalBuffer=e,this.setNeedsRedraw(),this.setData(e),!0)):(t.lastExternalBuffer=null,!1)}setBinaryValue(e,t=null){let{state:n,settings:r}=this;if(!e)return n.binaryValue=null,n.binaryAccessor=null,!1;if(r.noAlloc)return!1;if(e instanceof pe&&Z(e.length>=this.numInstances,`GPUVector attribute is shorter than the draw count`),n.binaryValue===e&&!(r.transform&&this.needsUpdate()))return this.clearNeedsUpdate(),!0;if(n.binaryValue=e,this.setNeedsRedraw(),e instanceof pe){if(!e.format)throw Error(`GPUVector attributes require a format`);let t=ne(e.format),n=t.type;if(n===`float16`)throw Error(`GPUVector float16 attributes are not supported`);Z(!t.vertexList&&!t.valueList,`GPUVector attributes require fixed-width values`);let r=FO(e);Z(r.buffer instanceof I,`GPUVector attributes require a concrete Buffer`),e={buffer:r.buffer,type:n,size:t.components,offset:r.byteOffset,stride:r.byteStride}}if(r.transform||t!==this.startIndices){ArrayBuffer.isView(e)&&(e={value:e});let i=e;Z(ArrayBuffer.isView(i.value),`invalid ${r.accessor}`);let a=!!i.size&&i.size!==this.size;return n.binaryAccessor=DO(i.value,{size:i.size||this.size,stride:i.stride,offset:i.offset,startIndices:t,nested:a}),!1}return this.clearNeedsUpdate(),this.setData(e),!0}getVertexOffset(e){let{startIndices:t}=this;return(t?e<t.length?t[e]:this.numInstances:e)*this.size}getValue(){let e=this.settings.shaderAttributes,t=super.getValue();if(!e)return t;for(let n in e)Object.assign(t,super.getValue(n,e[n]));return t}getGPUVector(){if(!this.isConstant&&!this.getBuffer())return{};let e=this._getShaderBufferLayout(),t=this.getValue(),n={},r=this.getConstantValue();this.doublePrecision&&(r instanceof Float32Array||r instanceof Float64Array)&&(r=this.device.type===`webgpu`?NT(r,{size:this.size}):new Float32Array([...this.value,...new Float32Array(this.size)]));for(let i of e.attributes||[]){let a=i.attribute,o=t[a],s=ne(i.format);if(this.isConstant&&r){let e=ve(s.type),t=(i.byteOffset||0)/r.BYTES_PER_ELEMENT;n[a]=new NO({format:i.format,value:new e(r.subarray(t,t+s.components))})}else o instanceof I?n[a]=new pe({type:`buffer`,name:a,buffer:o,format:i.format,length:this.numInstances,byteOffset:i.byteOffset||0,byteStride:e.byteStride,ownsBuffer:!1}):o&&(n[a]=new NO({format:i.format,value:new(ve(s.type))(o).subarray(0,s.components)}))}return n}getBufferLayout(e){return this.state.layoutChanged=!1,this._getShaderBufferLayout(e)}_getShaderBufferLayout(e){let t=this.settings.shaderAttributes,n=super._getBufferLayout(),{stepMode:r}=this.settings;if(r===`dynamic`?n.stepMode=e?e.isInstanced?`instance`:`vertex`:`instance`:n.stepMode=r??`vertex`,!t)return n;for(let e in t){let r=super._getBufferLayout(e,t[e]);n.attributes.push(...r.attributes)}return n}_autoUpdater(e,{data:t,startRow:n,endRow:r,props:i,numInstances:a}){let{settings:o,state:s,value:c,size:l,startIndices:u}=e,{accessor:d,transform:f}=o,p=o.semanticType===`color`&&o.normalizedColorInput&&!s.binaryAccessor,m=s.binaryAccessor||(typeof d==`function`?d:i[d]);Z(typeof m==`function`,`accessor "${d}" is not a function`);let h=e.getVertexOffset(n),{iterable:g,objectInfo:_}=TO(t,n,r);for(let t of g){_.index++;let n=m(t,_);f&&(n=f.call(this,n));let r=p&&Array.isArray(n),i=u&&ArrayBuffer.isView(n?.[0]),o=r&&u&&n.length>4;if(r&&!i&&!o&&(!u||!Array.isArray(n[0]))&&(IO.length=l,SO(n,IO,0,l),n=IO),u){let t=(_.index<u.length-1?u[_.index+1]:a)-u[_.index];if(n&&(Array.isArray(n[0])||i)){let t=h;for(let i of n)r&&Array.isArray(i)?SO(i,c,t,l):e._normalizeValue(i,c,t),t+=l}else if(o)for(let e=0;e<n.length;e+=l)SO(n,c,h+e,l,e);else n&&n.length>l&&!(l===3&&n instanceof Uint8ClampedArray&&n.length===4)?c.set(n,h):(e._normalizeValue(n,_.target,0),vE({target:c,source:_.target,start:h,count:t}));h+=t*l}else e._normalizeValue(n,c,h),h+=l}}_validateAttributeUpdaters(){let{settings:e}=this;if(!(e.noAlloc||typeof e.update==`function`))throw Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:e}=this,t=Math.min(4,this.size);if(e&&e.length>=t){let n=!0;switch(t){case 4:n&&=Number.isFinite(e[3]);case 3:n&&=Number.isFinite(e[2]);case 2:n&&=Number.isFinite(e[1]);case 1:n&&=Number.isFinite(e[0]);break;default:n=!1}if(!n)throw Error(`Illegal attribute generated for ${this.id}`)}}};function RO({elementWise:e,func:t,inputs:n,output:r,outputBuffer:i}){let a=Array.isArray(n)?n:Object.values(n);for(let e of a)if(!e.value)throw Error(`${e} does not have CPU value`);let o=r.length,s=r.size,c=new r.ValueType(o*s);for(let n=0;n<o;n++){let r=a.map(e=>zO(e,n));if(e)for(let e=0;e<s;e++)c[n*s+e]=t.apply(null,r.map(t=>t[e]));else t.call(null,c.subarray(n*s,n*s+s),...r)}let l=r.ValueType.BYTES_PER_ELEMENT,u=r.offset/l,d=r.stride/l,f=s,p=c;if(u!==0||d!==f){p=new r.ValueType(u+r.byteLength/l);for(let e=0;e<o;e++){let t=e*f,n=u+e*d,r=c.subarray(t,t+s);p.set(r,n),i.write(r,n*l)}}else i.write(c);return{success:!0,value:p}}function zO(e,t){let n=e.value,r=e.size,i=e.offset/e.ValueType.BYTES_PER_ELEMENT,a=e.stride/e.ValueType.BYTES_PER_ELEMENT,o=i+(e.isConstant?0:t)*a,s=n.slice(o,o+r);if(!e.normalized)return s;let c=new Float32Array(r);for(let t=0;t<r;t++)c[t]=BO(s[t],e.type);return c}function BO(e,t){switch(t){case`uint8`:return e/255;case`uint16`:return e/65535;case`uint32`:return e/4294967295;case`sint8`:return Math.max(e/127,-1);case`sint16`:return Math.max(e/32767,-1);case`sint32`:return Math.max(e/2147483647,-1);case`float32`:return e;default:throw Error(`Unsupported normalized source type ${t}`)}}var VO=({inputs:e,output:t,target:n})=>{for(let t of Object.values(e.namedInputs))if(!t.value)throw Error(`${t} does not have CPU value`);let r=new t.ValueType(t.length*t.size);for(let n=0;n<t.length;n++){let i=Object.fromEntries(Object.entries(e.namedInputs).map(([e,t])=>[e,zO(t,n)]));for(let a=0;a<t.size;a++)r[n*t.size+a]=HO(e.expression,i,a)}return n.write(r),{success:!0,value:r}};function HO(e,t,n){switch(e.kind){case`input`:{let r=t[e.name];return n<r.length?r[n]:r.length===1?r[0]:0}case`literal`:return Array.isArray(e.value)?e.value[n]??0:e.value;case`call`:{UO(e.op,e.args.length);let r=e.args.map(e=>HO(e,t,n));switch(e.op){case`add`:return r[0]+r[1];case`subtract`:return r[0]-r[1];case`multiply`:return r[0]*r[1];case`divide`:return r[0]/r[1];case`pow`:return r[0]**+r[1];case`sqrt`:return Math.sqrt(r[0]);case`abs`:return Math.abs(r[0]);case`sin`:return Math.sin(r[0]);case`cos`:return Math.cos(r[0]);case`tan`:return Math.tan(r[0]);case`exp`:return Math.exp(r[0]);case`log`:return Math.log(r[0]);default:{let t=e.op;throw Error(`Unsupported arithmetic op ${t}`)}}}default:{let t=e;throw Error(`Unsupported expression node ${t.kind}`)}}}function UO(e,t){let n=le[e].arity;if(t!==n)throw Error(`Arithmetic op '${e}' expects ${n} args, got ${t}`)}var WO=({inputs:e,output:t,target:n})=>{let{sourceValues:r}=e;if(!r.value)throw Error(`${r} does not have CPU value`);let i=new t.ValueType(t.length*t.size);if(r.length===0)return{success:!1,error:Error(`${r} is empty`)};for(let e=0;e<r.size;e++){let n=zO(r,0)[e],a=e*t.size,o=a+1;i[a]=n,i[o]=n;for(let t=1;t<r.length;t++){let n=zO(r,t)[e];n<i[a]&&(i[a]=n),n>i[o]&&(i[o]=n)}}return n.write(i),{success:!0,value:i}},GO=({inputs:e,output:t,target:n})=>RO({func:(e,t)=>{let n=e.length/2,r=new Float64Array(t.buffer);for(let t=0;t<n;t++){let i=r[t];e[t]=Math.fround(i),e[t+n]=i-e[t]}return e},inputs:e,output:t,outputBuffer:n}),KO=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=r.value,o=i.value;if(!a)throw Error(`${r} does not have CPU value`);if(!o)throw Error(`${i} does not have CPU value`);let s=new t.ValueType(t.length*t.size),c=Array(t.size).fill(0);for(let e=0;e<t.length;e++){let n=zO(r,e),a=Number(n[0]),o=qO(a,i.length)?zO(i,a):c;s.set(o,e*t.size)}return n.write(s),{success:!0,value:s}};function qO(e,t){return Number.isInteger(e)&&e>=0&&e<t}var JO=({inputs:e,output:t,target:n})=>RO({func:(e,...t)=>{let n=0;for(let r of t)e.set(r,n),n+=r.length},inputs:e,output:t,outputBuffer:n}),YO=({inputs:e,output:t,target:n})=>{let{x:r,y:i}=e,a=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=zO(r,e),n=zO(i,e),o=0;for(let e=0;e<r.size;e++)o+=t[e]*n[e];a[e]=o}return n.write(a),{success:!0,value:a}},XO=({inputs:e,output:t,target:n})=>{let{x:r,y:i}=e,a=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=zO(r,e),n=zO(i,e),o=1;for(let e=0;e<r.size;e++)if(t[e]!==n[e]){o=0;break}a[e]=o}return n.write(a),{success:!0,value:a}},ZO=({inputs:e,output:t,target:n})=>{let{x:r}=e,i=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=zO(r,e),n=0;for(let e=0;e<r.size;e++)n+=t[e]*t[e];i[e]=Math.sqrt(n)}return n.write(i),{success:!0,value:i}},QO=async({inputs:e,output:t,target:n})=>{let{segments:r,vertexCount:i}=e,a=r.value;if(!a)throw Error(`${r} does not have CPU value`);$O(a,r,i);let o=new t.ValueType(t.length*t.size),s=0;for(let e=0;e<i;e++){for(;s+1<r.length&&a[ek(r,s+1)]<=e;)s++;let n=a[ek(r,s)],i=e*t.size;o[i]=s,o[i+1]=e-n}return n.write(o),{success:!0,value:o}};function $O(e,t,n){if(t.length<1)throw Error(`segmentedMap segments must contain at least one segment start`);let r=0;for(let n=0;n<t.length;n++){let i=e[ek(t,n)];if(n===0&&i!==0)throw Error(`segmentedMap segments must start at 0, got ${i}`);if(n>0&&i<r)throw Error(`segmentedMap segments must be non-decreasing, got ${i} after ${r}`);r=i}if(r>n)throw Error(`segmentedMap last segment start must be <= vertexCount, got ${r} > ${n}`)}function ek(e,t){return e.offset/e.ValueType.BYTES_PER_ELEMENT+t*(e.stride/e.ValueType.BYTES_PER_ELEMENT)}var tk=async({inputs:e,output:t,target:n})=>{let{condition:r,whenTrue:i,whenFalse:a}=e,o=new t.ValueType(t.length*t.size);for(let e=0;e<t.length;e++){let n=zO(r,e),s=zO(i,e),c=zO(a,e);for(let l=0;l<t.size;l++){let u=nk(n,r.size,l);o[e*t.size+l]=u===0?nk(c,a.size,l):nk(s,i.size,l)}}return n.write(o),{success:!0,value:o}};function nk(e,t,n){return n<t?e[n]:t===1?e[0]:0}var rk=({inputs:e,output:t,target:n})=>{let r=new t.ValueType(t.length);for(let n=0;n<t.length;n++)r[n]=e.start+n*e.step;return n.write(r),{success:!0,value:r}},ik=({inputs:e,output:t,target:n})=>{let{columns:r}=e;return RO({func:(e,t)=>{for(let n=0;n<r.length;n++)e[n]=t[r[n]]},inputs:{x:e.x},output:t,outputBuffer:n})},ak=e({arithmetic:()=>VO,castData:()=>Me,convertColors:()=>Ie,dot:()=>YO,equalAll:()=>XO,extent:()=>WO,fround:()=>GO,gather:()=>KO,interleave:()=>JO,length:()=>ZO,segmentedMap:()=>QO,select:()=>tk,sequence:()=>rk,swizzle:()=>ik}),ok=new class{_modules={cpu:ak};add(e,t){let n=this._modules[e];if(typeof t.then==`function`){let r=Promise.all([Promise.resolve(n||{}),t]).then(([e,t])=>({...e,...t}));return this._modules[e]=r,r.then(t=>{this._modules[e]=t}).catch(t=>{F.error(`Failed to register ${e} backend: ${t}`)()}),r}if(n&&typeof n.then==`function`){let r=Promise.resolve(n).then(e=>({...e,...t})).then(t=>(this._modules[e]=t,t)).catch(t=>{throw F.error(`Failed to register ${e} backend: ${t}`)(),t});return this._modules[e]=r,r}let r={...n||{},...t};return this._modules[e]=r,Promise.resolve(r)}async get(e,t){let n=this._modules[e];if(!n)if(e===`webgl`)n=this.add(`webgl`,l(()=>import(`./webgl-Kc0sM2Pj.js`),__vite__mapDeps([7,3,4,5,8,9,6,10])));else if(e===`webgpu`)n=this.add(`webgpu`,l(()=>import(`./webgpu-BLHKyplS.js`),__vite__mapDeps([11,12,9,3,4,8,6,13])));else throw Error(`${e} backend not registered`);let r=(await n)[t];if(typeof r!=`function`&&(e===`webgl`?r=(await l(()=>import(`./webgl-Kc0sM2Pj.js`),__vite__mapDeps([7,3,4,5,8,9,6,10])))[t]:e===`webgpu`&&(r=(await l(()=>import(`./webgpu-BLHKyplS.js`),__vite__mapDeps([11,12,9,3,4,8,6,13])))[t])),typeof r!=`function`)throw Error(`${e} backend does not implement ${t}`);return r}getSync(e,t){let n=this._modules[e];if(!n)throw Error(`${e} backend not registered`);if(typeof n.then==`function`)throw Error(`${e} backend is not loaded yet`);let r=n[t];if(typeof r!=`function`)throw Error(`${e} backend does not implement ${t}`);return r}clear(){this._modules={}}},sk=class{inputs;dependencies;constructor(e){this.inputs=e,this.dependencies=Array.from(e instanceof Array?e:Object.values(e)).filter(e=>e instanceof fe)}async execute(e,t,n){n||await this._resolveDependencies(e);let r=await ok.get(this._getHandlerRegistry(e,n),this.name);if(n&&(e.type!==`webgpu`||!r.supportsEvaluationScope))throw Error(`${this.name} does not support deferred-submission evaluation`);return n&&await this._resolveDependencies(e,n),await this._executeWithHandler(r,t,n)}executeSync(e,t){this._resolveDependenciesSync(e);let n=this._executeWithHandler(ok.getSync(this._getHandlerRegistry(e),this.name),t);if(ck(n))throw Error(`${this.name} returned a Promise in executeSync()`);return n}shouldExecuteOnCPU(){return this.output.length<=1&&Array.from(this.dependencies).every(e=>!!e.value)}_getHandlerRegistry(e,t){return!t&&this.shouldExecuteOnCPU()?`cpu`:e.type}async _resolveDependencies(e,t){for(let n of this.dependencies)await n.evaluate(e,{scope:t});if(this._getHandlerRegistry(e,t)===`cpu`||e.type===`null`)for(let e of this.dependencies)await e.ensureCPUValue()}_resolveDependenciesSync(e){for(let t of this.dependencies)t.evaluateSync(e);if(this._getHandlerRegistry(e)===`cpu`||e.type===`null`)for(let e of this.dependencies)e.ensureCPUValueSync()}_executeWithHandler(e,t,n){return e({scope:n,device:t.device,inputs:this.inputs,output:this.output,target:t})}};function ck(e){return typeof e?.then==`function`}function lk(...e){let t=uk(e.map(e=>e.type));return t[0]!==`f`&&e.some(e=>e.normalized)&&(t=`float32`),{isConstant:e.every(e=>e.isConstant),type:t,size:e.reduce((e,t)=>Math.max(e,t.size),0),length:e.reduce((e,t)=>Math.max(e,t.length),0)}}function uk(e){let t=0,n=0;for(let r of e){if(r[0]===`f`)return`float32`;let e=r.endsWith(`8`)?8:r.endsWith(`6`)?16:32;r[0]===`u`?t=Math.max(t,e):n=Math.max(n,e)}return t&&!n?`uint${t}`:n&&t<32?`sint${Math.max(n,t*2)}`:`float32`}var dk=class e{gpuDataEvaluators;format;length;id;_gpuVector;_ownsGPUDataEvaluators;_destroyed=!1;_evaluationScope;static fromGPUVector(t){if(t.bufferLayout)throw Error(`GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${t.name}"`);if(t.data.length===0)throw Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${t.name}"`);return new e({id:t.name,gpuDataEvaluators:t.data.map(e=>fe.fromGPUData(e,{id:t.name})),gpuVector:t,format:t.format})}static fromGPUDataEvaluators(t,n={}){return new e({id:n.id,gpuDataEvaluators:t,format:n.format})}constructor({id:e,gpuDataEvaluators:t,gpuVector:n,format:r}){if(t.length===0)throw Error(`GPUVectorEvaluator requires at least one GPUData evaluator`);fk(t),this.id=e,this.gpuDataEvaluators=t,this.format=r??t[0].format,this.length=t.reduce((e,t)=>e+t.length,0),this._gpuVector=n,this._ownsGPUDataEvaluators=!n}get evaluated(){return!!this._gpuVector}getInspection(){return ue(this.gpuDataEvaluators)}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}mapGPUData(t){return e.fromGPUDataEvaluators(this.gpuDataEvaluators.map((e,n)=>t(e,n)),{id:this.id})}async evaluate(e,t={}){if(this.assertScopeAccess(t.scope),this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);let n=t.scope,r;if(n){if(n.assertEvaluating(e),!this._evaluationScope){let e=this._gpuVector;this._evaluationScope=n,n.retain(t=>{this._evaluationScope=void 0,t||(this._gpuVector=e)})}r=[];for(let n of this.gpuDataEvaluators)r.push(await n.evaluate(e,t));if(this._gpuVector)return this._gpuVector}else{if(this._gpuVector)return this._gpuVector;r=await Promise.all(this.gpuDataEvaluators.map(n=>n.evaluate(e,t)))}let i=r[0],a=r.map(pk),o=t.format??this.format??i.format;return this._gpuVector=new pe({type:`data`,name:t.name??this.id??`vector`,format:o,data:a,stride:i.stride,byteStride:i.byteStride,rowByteLength:i.rowByteLength,bufferLayout:i.bufferLayout}),this._gpuVector}evaluateSync(e,t={}){if(t.scope)throw Error(`Use scope.evaluate() for deferred submission`);if(this.assertScopeAccess(),this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let n=this.gpuDataEvaluators.map(n=>n.evaluateSync(e,t)),r=n[0],i=n.map(pk),a=t.format??this.format??r.format;return this._gpuVector=new pe({type:`data`,name:t.name??this.id??`vector`,format:a,data:i,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}invalidate(){if(this.assertScopeAccess(),this._destroyed)throw Error(`Cannot invalidate a destroyed evaluator`);this._gpuVector=void 0}destroy(){if(this.assertScopeAccess(),this._ownsGPUDataEvaluators)for(let e of this.gpuDataEvaluators)e.destroy();this._gpuVector=void 0,this._destroyed=!0}assertScopeAccess(e){if(this._evaluationScope&&this._evaluationScope!==e)throw Error(`Evaluator is retained by an unsubmitted scope`)}toString(){return this.id??this.constructor.name}};function fk(e){let t=e[0];for(let n of e.slice(1))if(n.type!==t.type||n.size!==t.size||n.normalized!==t.normalized||n.format!==t.format)throw Error(`GPUVectorEvaluator requires matching GPUData evaluator layouts`)}function pk(e){let[t,...n]=e.data;if(!t||n.length>0)throw Error(`GPUVectorEvaluator requires one GPUData chunk for "${e.name}"`);return t}var mk=class extends sk{name=`interleave`;output;constructor(e){super(e);let{isConstant:t,type:n,length:r}=lk(...e);this.output=new fe({isConstant:t,type:n,size:e.reduce((e,t)=>e+t.size,0),length:r,source:this})}toString(){return`_${this.inputs.join(`_`)}_`}};function hk(...e){if(e.length===0)throw Error(`interleave() requires at least one input`);return e.length===1?N(e[0]):new mk(e.map(N)).output}function gk(e,t){let n=vk(t);for(let t of n)t.evaluateSync(e);return _k(n),t}function _k(e){let t=new Set(e.flatMap(Sk)),n=new Set;for(let t of e)xk(t,n);for(let e of n)e.evaluated&&!t.has(e.buffer)&&e.destroy()}function vk(e){let t=new Set;return yk(e,t,new Set),Array.from(t)}function yk(e,t,n){if(Ck(e)){t.add(e);return}if(!(!e||typeof e!=`object`||n.has(e))){if(n.add(e),Array.isArray(e)){for(let r of e)yk(r,t,n);return}if(bk(e))for(let r of Object.values(e))yk(r,t,n)}}function bk(e){let t=Object.getPrototypeOf(e);return t===Object.prototype||t===null}function xk(e,t){if(e instanceof dk){for(let n of e.gpuDataEvaluators)xk(n,t);return}let n=e.source;if(n){if(n instanceof fe){t.has(n)||(t.add(n),xk(n,t));return}for(let e of n.dependencies)t.has(e)||(t.add(e),xk(e,t))}}function Sk(e){return e instanceof fe?[e.buffer]:e.gpuVector.data.map(e=>e.buffer instanceof se?e.buffer.buffer:e.buffer)}function Ck(e){return e instanceof fe||e instanceof dk}var wk=class{constructor(e,{id:t,isTransitionAttribute:n}){this.packedBuffers={},this.device=e,this.id=t,this.isTransitionAttribute=n,this.device.type===`webgpu`&&ok.add(`webgpu`,{interleave:Ee})}hasGroups(e){return this.device.type===`webgpu`&&Object.values(e).some(e=>!!e.settings.bufferGroup)}finalize(){for(let e of Object.values(this.packedBuffers))e.packed.destroy();this.packedBuffers={}}getBufferLayouts(e,t){let n=this._getPackedGroups(e,t,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(e,n,t)}getBindings(e,t,n,r){let i=this._getPackedGroups(e,n,{requireValues:!0,excludeAttributes:r}),a={},o=new Set;for(let e of i.values()){let n=!this.packedBuffers[e.id]||e.attributes.some(e=>!!t[e.id]);a[e.id]=this._getPackedBuffer(e,n);for(let t of e.attributes)o.add(t.id)}return{bufferLayouts:this._getBufferLayouts(e,i,n).filter(t=>!r[t.name]&&!e[t.name]?.settings.isIndexed),buffers:a,groupedAttributeIds:o}}_getPackedGroups(e,t,{requireValues:n,excludeAttributes:r}){let i=new Map;for(let t of Object.values(e)){let e=t.settings.bufferGroup;if(!e)continue;let n=i.get(e)||[];n.push(t),i.set(e,n)}let a=new Map;for(let[e,o]of i){let i=this._getPackedGroup(e,o,t,n,r);i&&a.set(e,i)}return a}_getPackedGroup(e,t,n,r,i){if(t.length<2)return null;let a=t.map(e=>e.getBufferLayout(n)),o=a[0].stepMode,s=Math.max(1,t[0].numInstances),c=r&&t.every(e=>e.isConstant);for(let e=0;e<t.length;e++){let n=t[e],c=n.getAccessor(),l=c.size*c.bytesPerElement;if(i[n.id]||n.settings.isIndexed||n.settings.noAlloc||n.doublePrecision||this.isTransitionAttribute(n.id)||a[e].stepMode!==o||n.numInstances!==t[0].numInstances||(c.offset||0)!==0||(c.vertexOffset||0)!==0||_O(c)!==l||r&&(n.isConstant?!n.getConstantValue()||n.getConstantValue().byteLength<l:!ArrayBuffer.isView(n.value)||n.value.byteLength<s*l))return null}let l={},u=[],d=0;for(let e=0;e<t.length;e++){let n=t[e];d=Tk(d),l[n.id]=d;for(let t of a[e].attributes||[])u.push({...t,byteOffset:d+(t.byteOffset||0)});d+=_O(n.getAccessor())}return d=Tk(d),{id:e,attributes:t,byteStride:d,byteOffsets:l,rowCount:s,layout:{name:e,byteStride:c?0:d,stepMode:o,attributes:u}}}_getBufferLayouts(e,t,n){let r=[],i=new Set,a=new Set;for(let e of t.values())for(let t of e.attributes)a.add(t.id);for(let o of Object.values(e)){let e=o.settings.bufferGroup,s=e&&t.get(e);s&&a.has(o.id)?i.has(s.id)||(r.push(s.layout),i.add(s.id)):r.push(o.getBufferLayout(n))}return r}_getPackedBuffer(e,t){let n=JSON.stringify({byteStride:e.layout.byteStride,attributes:e.layout.attributes}),r=this.packedBuffers[e.id];if((!r||r.layoutKey!==n)&&(t=!0),t){r&&(r.packed.destroy(),delete this.packedBuffers[e.id]);let t=this._interleavePackedGroup(e);return this.packedBuffers[e.id]={packed:t,layoutKey:n},t.buffer}if(!r)throw Error(`Attribute buffer group ${e.id} has no packed buffer`);return r.packed.buffer}_interleavePackedGroup(e){let t=hk(...e.attributes.map(t=>this._getInterleaveInput(e,t)));return gk(this.device,t),t}_getInterleaveInput(e,t){let n=_O(t.getAccessor()),r=e.byteOffsets[t.id];if(Ek(`${e.id}.${t.id} rowByteLength`,n),Ek(`${e.id}.${t.id} groupByteOffset`,r),t.isConstant){let r=t.getConstantValue();if(!r)throw Error(`Attribute group ${e.id} is missing constant value ${t.id}`);return Ek(`${e.id}.${t.id} constant byteOffset`,r.byteOffset),new fe({id:t.id,type:`uint32`,size:n/4,isConstant:!0,value:new Uint32Array(r.buffer,r.byteOffset,n/Uint32Array.BYTES_PER_ELEMENT)})}let i=t.getBuffer(),a=t.byteOffset,o=t.getAccessor().stride||n;if(Ek(`${e.id}.${t.id} byteOffset`,a),Ek(`${e.id}.${t.id} stride`,o),!i)throw Error(`Attribute group ${e.id} cannot interleave missing buffer ${t.id}`);return new fe({id:t.id,type:`uint32`,size:n/4,offset:a,stride:o,length:e.rowCount,buffer:i})}};function Tk(e){return Math.ceil(e/4)*4}function Ek(e,t){if(t%4!=0)throw Error(`Attribute buffer groups require 32-bit alignment: ${e}=${t}`)}function Dk(e){let{source:t,target:n,start:r=0,size:i,getData:a}=e,o=e.end||n.length,s=t.length,c=o-r;if(s>c){n.set(t.subarray(0,c),r);return}if(n.set(t,r),!a)return;let l=s;for(;l<c;){let e=a(l,t);for(let t=0;t<i;t++)n[r+l]=e[t]||0,l++}}function Ok({source:e,target:t,size:n,getData:r,sourceStartIndices:i,targetStartIndices:a}){if(!i||!a)return Dk({source:e,target:t,size:n,getData:r}),t;let o=0,s=0,c=r&&((e,t)=>r(e+s,t)),l=Math.min(i.length,a.length);for(let r=1;r<l;r++){let l=i[r]*n,u=a[r]*n;Dk({source:e.subarray(o,l),target:t,start:s,end:u,size:n,getData:c}),o=l,s=u}return s<t.length&&Dk({source:[],target:t,start:s,size:n,getData:c}),t}function kk(e){let{device:t,settings:n,value:r}=e,i=new LO(t,n);return i.setData({value:r instanceof Float64Array?new Float64Array:new Float32Array,normalized:n.normalized}),i}function Ak(e){switch(e){case 1:return`float`;case 2:return`vec2`;case 3:return`vec3`;case 4:return`vec4`;default:throw Error(`No defined attribute type for size "${e}"`)}}function jk(e){switch(e){case 1:return`float32`;case 2:return`float32x2`;case 3:return`float32x3`;case 4:return`float32x4`;default:throw Error(`invalid type size`)}}function Mk(e){e.push(e.shift())}function Nk(e,t){let{settings:n,value:r,size:i}=e,a=e.isDoublePrecisionBuffer?2:1,o=0,{shaderAttributes:s}=e.settings;if(s)for(let e of Object.values(s))o=Math.max(o,e.vertexOffset??0);return(n.noAlloc?r.length:(t+o)*i)*a}function Pk({device:e,source:t,target:n}){return(!n||n.byteLength<t.byteLength)&&(n?.destroy(),n=e.createBuffer({byteLength:t.byteLength,usage:t.usage})),n}function Fk({device:e,buffer:t,attribute:n,fromLength:r,toLength:i,fromStartIndices:a,getData:o=e=>e}){let s=n.isDoublePrecisionBuffer?2:1,c=n.size*s,l=n.byteOffset,u=n.settings.bytesPerElement<4?l/n.settings.bytesPerElement*4:l,d=n.startIndices,f=a&&d,p=n.isConstant;if(!f&&t&&r>=i)return t;let m=n.value instanceof Float64Array?Float32Array:n.value.constructor,h=p?n.value:new m(n.getBuffer().readSyncWebGL(l,i*m.BYTES_PER_ELEMENT).buffer);if(n.settings.normalized&&!p){let e=o;o=(t,r)=>n.normalizeConstant(e(t,r))}let g=p?(e,t)=>o(h,t):(e,t)=>o(h.subarray(e,e+c),t),_=t?new Float32Array(t.readSyncWebGL(u,r*4).buffer):new Float32Array,v=new Float32Array(i);return Ok({source:_,target:v,sourceStartIndices:a,targetStartIndices:d,size:c,getData:g}),(!t||t.byteLength<v.byteLength+u)&&(t?.destroy(),t=e.createBuffer({byteLength:v.byteLength+u,usage:I.VERTEX|I.COPY_SRC|I.COPY_DST})),t.write(v,u),t}var Ik=class{constructor({device:e,attribute:t,timeline:n}){this.buffers=[],this.currentLength=0,this.device=e,this.transition=new BE(n),this.attribute=t,this.attributeInTransition=kk(t),this.currentStartIndices=t.startIndices}get inProgress(){return this.transition.inProgress}start(e,t,n=1/0){this.settings=e,this.attributeInTransition.numInstances=this.attribute.numInstances,this.currentStartIndices=this.attribute.startIndices,this.currentLength=Nk(this.attribute,t),this.transition.start({...e,duration:n})}update(){let e=this.transition.update();return e&&this.onUpdate(),e}setBuffer(e){let{stride:t}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:e,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:t})}cancel(){this.transition.cancel()}delete(){this.cancel();for(let e of this.buffers)e.destroy();this.buffers.length=0}},Lk=class extends Ik{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type=`interpolation`,this.hasUpdated=!1,this.transform=Hk(e,t)}start(e,t){let n=this.currentLength,r=this.currentStartIndices;if(super.start(e,t,e.duration),e.duration<=0){this.transition.cancel();return}let{buffers:i,attribute:a}=this;this.hasUpdated&&Mk(i),this.hasUpdated=!1,i[0]=Fk({device:this.device,buffer:i[0],attribute:a,fromLength:n,toLength:this.currentLength,fromStartIndices:r,getData:e.enter}),i[1]=Pk({device:this.device,source:i[0],target:i[1]}),this.setBuffer(i[1]);let{transform:o}=this,s=o.model,c=Math.floor(this.currentLength/a.size);Vk(a)&&(c/=2),s.setVertexCount(c),a.isConstant?(s.setAttributes({aFrom:i[0]}),s.setConstantAttributes({aTo:a.value})):s.setAttributes({aFrom:i[0],aTo:a.getBuffer()}),o.transformFeedback.setBuffers({vCurrent:i[1]})}onUpdate(){let{duration:e,easing:t}=this.settings,{time:n}=this.transition,r=n/e;t&&(r=t(r));let{model:i}=this.transform,a={time:r};i.shaderInputs.setProps({interpolation:a}),this.transform.run({discard:!0}),this.hasUpdated=!0}delete(){super.delete(),this.transform.destroy()}},Rk={name:`interpolation`,vs:`layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,uniformTypes:{time:`f32`}},zk=`#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,Bk=`#version 300 es
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
`;function Vk(e){return e.isDoublePrecisionBuffer}function Hk(e,t){let n=t.size,r=Ak(n),i=jk(n),a=t.getBufferLayout();return Vk(t)?new df(e,{vs:Bk,bufferLayout:[{name:`aFrom`,byteStride:8*n,attributes:[{attribute:`aFrom`,format:i,byteOffset:0},{attribute:`aFrom64Low`,format:i,byteOffset:4*n}]},{name:`aTo`,byteStride:8*n,attributes:[{attribute:`aTo`,format:i,byteOffset:0},{attribute:`aTo64Low`,format:i,byteOffset:4*n}]}],modules:[il,Rk],defines:{ATTRIBUTE_TYPE:r,ATTRIBUTE_SIZE:n},moduleSettings:{},varyings:[`vCurrent`,`vCurrent64Low`],feedbackBufferMode:`interleaved`,disableWarnings:!0}):new df(e,{vs:zk,bufferLayout:[{name:`aFrom`,format:i},{name:`aTo`,format:a.attributes[0].format}],modules:[Rk],defines:{ATTRIBUTE_TYPE:r},varyings:[`vCurrent`],disableWarnings:!0})}var Uk=class extends Ik{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type=`spring`,this.texture=Jk(e),this.framebuffer=Yk(e,this.texture),this.transform=qk(e,t)}start(e,t){let n=this.currentLength,r=this.currentStartIndices;super.start(e,t);let{buffers:i,attribute:a}=this;for(let t=0;t<2;t++)i[t]=Fk({device:this.device,buffer:i[t],attribute:a,fromLength:n,toLength:this.currentLength,fromStartIndices:r,getData:e.enter});i[2]=Pk({device:this.device,source:i[0],target:i[2]}),this.setBuffer(i[1]);let{model:o}=this.transform;o.setVertexCount(Math.floor(this.currentLength/a.size)),a.isConstant?o.setConstantAttributes({aTo:a.value}):o.setAttributes({aTo:a.getBuffer()})}onUpdate(){let{buffers:e,transform:t,framebuffer:n,transition:r}=this,i=this.settings;t.model.setAttributes({aPrev:e[0],aCur:e[1]}),t.transformFeedback.setBuffers({vNext:e[2]});let a={stiffness:i.stiffness,damping:i.damping};t.model.shaderInputs.setProps({spring:a}),t.run({framebuffer:n,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),Mk(e),this.setBuffer(e[1]),this.device.readPixelsToArrayWebGL(n)[0]>0||r.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}},Wk={name:`spring`,vs:`layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,uniformTypes:{damping:`f32`,stiffness:`f32`}},Gk=`#version 300 es
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
`,Kk=`#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`;function qk(e,t){let n=Ak(t.size),r=jk(t.size);return new df(e,{vs:Gk,fs:Kk,bufferLayout:[{name:`aPrev`,format:r},{name:`aCur`,format:r},{name:`aTo`,format:t.getBufferLayout().attributes[0].format}],varyings:[`vNext`],modules:[Wk],defines:{ATTRIBUTE_TYPE:n},parameters:{depthCompare:`always`,blendColorOperation:`max`,blendColorSrcFactor:`one`,blendColorDstFactor:`one`,blendAlphaOperation:`max`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one`}})}function Jk(e){return e.createTexture({data:new Uint8Array(4),format:`rgba8unorm`,width:1,height:1})}function Yk(e,t){return e.createFramebuffer({id:`spring-transition-is-transitioning-framebuffer`,width:1,height:1,colorAttachments:[t]})}var Xk={interpolation:Lk,spring:Uk},Zk=class{constructor(e,{id:t,timeline:n}){if(!e)throw Error(`AttributeTransitionManager is constructed without device`);this.id=t,this.device=e,this.timeline=n,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let e in this.transitions)this._removeTransition(e)}update({attributes:e,transitions:t,numInstances:n}){this.numInstances=n||1;for(let n in e){let r=e[n],i=r.getTransitionSetting(t);i&&this._updateAttribute(n,r,i)}for(let n in this.transitions){let r=e[n];(!r||!r.getTransitionSetting(t))&&(this._removeTransition(n),r&&(r.setNeedsRedraw(),r.setLayoutChanged()))}}hasAttribute(e){let t=this.transitions[e];return t&&t.inProgress}getAttributes(){let e={};for(let t in this.transitions){let n=this.transitions[t];n.inProgress&&(e[t]=n.attributeInTransition)}return e}run(){if(this.numInstances===0)return!1;for(let e in this.transitions)this.transitions[e].update()&&(this.needsRedraw=!0);let e=this.needsRedraw;return this.needsRedraw=!1,e}_removeTransition(e){this.transitions[e].delete(),delete this.transitions[e]}_updateAttribute(e,t,n){let r=this.transitions[e],i=!r||r.type!==n.type;if(i){r&&this._removeTransition(e);let a=Xk[n.type];a?this.transitions[e]=new a({attribute:t,timeline:this.timeline,device:this.device}):(R.error(`unsupported transition type '${n.type}'`)(),i=!1)}(i||t.needsRedraw())&&(this.needsRedraw=!0,this.transitions[e].start(n,this.numInstances))}},Qk=`attributeManager.invalidate`,$k=`attributeManager.updateStart`,eA=`attributeManager.updateEnd`,tA=`attribute.updateStart`,nA=`attribute.allocate`,rA=`attribute.updateEnd`,iA=class{constructor(e,{id:t=`attribute-manager`,stats:n,timeline:r}={}){this.mergeBoundsMemoized=NS(PT),this.id=t,this.device=e,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=n,this.attributeTransitionManager=new Zk(e,{id:`${t}-transitions`,timeline:r}),this.attributeBufferGroups=e.type===`webgpu`?new wk(e,{id:t,isTransitionAttribute:e=>this.attributeTransitionManager.hasAttribute(e)}):null,Object.seal(this)}finalize(){this.attributeBufferGroups?.finalize();for(let e in this.attributes)this.attributes[e].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(e={clearRedrawFlags:!1}){let t=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!e.clearRedrawFlags,t&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(e){this._add(e)}addInstanced(e){this._add(e,{stepMode:`instance`})}remove(e){for(let t of e)this.attributes[t]!==void 0&&(this.attributes[t].delete(),delete this.attributes[t])}invalidate(e,t){let n=this._invalidateTrigger(e,t);hs(Qk,this,e,n)}invalidateAll(e){for(let t in this.attributes)this.attributes[t].setNeedsUpdate(t,e);hs(Qk,this,`all`)}update({data:e,numInstances:t,startIndices:n=null,transitions:r,props:i={},buffers:a={},context:o={}}){let s=!1;hs($k,this),this.stats&&this.stats.get(`Update Attributes`).timeStart();for(let r in this.attributes){let c=this.attributes[r],l=c.settings.accessor;c.startIndices=n,c.numInstances=t,i[r]&&R.removed(`props.${r}`,`data.attributes.${r}`)(),c.setExternalBuffer(a[r])||c.setBinaryValue(typeof l==`string`?a[l]:void 0,e.startIndices)||typeof l==`string`&&!a[l]&&c.setConstantValue(o,i[l])||c.needsUpdate()&&(s=!0,this._updateAttribute({attribute:c,numInstances:t,data:e,props:i,context:o})),this.needsRedraw=this.needsRedraw||c.needsRedraw()}s&&hs(eA,this,t),this.stats&&(this.stats.get(`Update Attributes`).timeEnd(),s&&this.stats.get(`Attributes updated`).incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:t,transitions:r})}updateTransition(){let{attributeTransitionManager:e}=this,t=e.run();return this.needsRedraw=this.needsRedraw||t,t}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getGPUVectors(e=this.getAttributes(),t){let n={};for(let t of Object.values(e))Object.assign(n,t.getGPUVector());if(t)for(let e of t.bufferLayouts){let r=t.buffers[e.name];r&&(n[e.name]=new pe({type:`interleaved`,name:e.name,buffer:r,length:t.length,byteStride:e.byteStride,attributes:e.attributes,ownsBuffer:!1}))}return n}getBounds(e){let t=e.map(e=>this.attributes[e]?.getBounds());return this.mergeBoundsMemoized(t)}getChangedAttributes(e={clearChangedFlags:!1}){let{attributes:t,attributeTransitionManager:n}=this,r={...n.getAttributes()};for(let i in t){let a=t[i];a.needsRedraw(e)&&!n.hasAttribute(i)&&(r[i]=a)}return r}getBufferLayouts(e){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),e):Object.values(this.getAttributes()).map(t=>t.getBufferLayout(e))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(e,t,n={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),e,t,n):{bufferLayouts:this.getBufferLayouts(t),buffers:{},groupedAttributeIds:new Set}}_add(e,t){for(let n in e){let r=e[n],i={...r,id:n,size:r.isIndexed&&1||r.size||1,...t};this.attributes[n]=new LO(this.device,i)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let e={};for(let t in this.attributes)this.attributes[t].getUpdateTriggers().forEach(n=>{e[n]||(e[n]=[]),e[n].push(t)});this.updateTriggers=e}_invalidateTrigger(e,t){let{attributes:n,updateTriggers:r}=this,i=r[e];return i&&i.forEach(e=>{let r=n[e];r&&r.setNeedsUpdate(r.id,t)}),i}_updateAttribute(e){let{attribute:t,numInstances:n}=e;if(hs(tA,t),t.constant){t.setConstantValue(e.context,t.value);return}t.allocate(n)&&hs(nA,t,n),t.updateBuffer(e)&&(this.needsRedraw=!0,hs(rA,t,n))}};function aA(e){let t=e;return!!(t&&Number.isInteger(t.length)&&Number.isInteger(t.type?.typeId)&&Array.isArray(t.data)&&typeof t.get==`function`)}function oA(e){return e.typeId===16}function sA(e){return e.typeId===2||e.typeId===3}function cA(e,t={}){let{semantic:n=`auto`,...r}=t;if(n===`position`&&(!oA(e)||![2,3].includes(e.listSize)))throw Error(`Arrow positions must be FixedSizeList[2] or FixedSizeList[3]`);if(n===`scalar`&&!sA(e))throw Error(`Arrow scalar input must be numeric`);let i=r.format;if(i||(n===`color`&&(i=`unorm8x4`),n===`scalar`&&(i=`float32`),n===`position`&&(i=oA(e)&&e.listSize===2?`float32x2`:`float32x3`)),!i){let t=oA(e)?e.listSize:1;i=t===1?`float32`:`float32x${t}`}let a=n===`color`||i===`unorm8x4`,o=i===`float32`?1:Number(/x([234])$/.exec(i)?.[1]);if(!o||(a?i!==`unorm8x4`:!i.startsWith(`float32`)))throw Error(`Unsupported Arrow output format: ${i}`);let s=oA(e),c=s?e.listSize:1;if(!sA(s?e.children[0].type:e))throw Error(`Arrow input must contain numeric values`);if(!a&&!r.transform&&c>o||a&&![3,4].includes(c))throw Error(`Arrow input width does not match the requested output format`);return i}function lA(e,t,n=!1){let r=n&&qe(e.data)?e.data:null,i={};for(let[n,a]of Object.entries(t)){if(a.prop===!1)continue;let t=e[n];if(t!=null){if(!(t instanceof pe))throw Error(`Experimental column prop ${n} requires a GPUVector; pass Arrow vectors to ${a.accessor??`an Arrow accessor`}`);i[n]=t;continue}let o=a.accessor&&e[a.accessor];if(a.arrowAccessor&&aA(o)){i[n]=o;continue}if(!a.semantic)continue;let s=r?.getChild(n);if(s){try{let e=cA(s.type,{semantic:a.semantic===`vector`?`numeric`:a.semantic});if(a.semantic===`vector`&&a.size&&e!==(a.size===1?`float32`:`float32x${a.size}`))continue}catch{continue}i[n]=s}}return i}var uA=class extends cf{setConstantAttributes(e,t){if(this.device.type===`webgl`){for(let[t,n]of Object.entries(e))if(n instanceof Int32Array||n instanceof Uint32Array){let r=this.pipeline?.shaderLayout.attributes.find(e=>e.name===t);r&&!he(r.type).integer&&(e={...e,[t]:new Float32Array(n)})}}super.setConstantAttributes(e,t)}};uA.defaultProps={...cf.defaultProps,enforceMatchingVectorLengths:!1};var dA=class extends BE{get value(){return this._value}_onUpdate(){let{time:e,settings:{fromValue:t,toValue:n,duration:r,easing:i}}=this;this._value=ke(t,n,i(e/r))}},fA=1e-5;function pA(e,t,n,r,i){let a=t-e;return(n-t)*i+-a*r+a+t}function mA(e,t,n,r,i){if(Array.isArray(n)){let a=[];for(let o=0;o<n.length;o++)a[o]=pA(e[o],t[o],n[o],r,i);return a}return pA(e,t,n,r,i)}function hA(e,t){if(Array.isArray(e)){let n=0;for(let r=0;r<e.length;r++){let i=e[r]-t[r];n+=i*i}return Math.sqrt(n)}return Math.abs(e-t)}var gA={interpolation:dA,spring:class extends BE{get value(){return this._currValue}_onUpdate(){let{fromValue:e,toValue:t,damping:n,stiffness:r}=this.settings,{_prevValue:i=e,_currValue:a=e}=this,o=mA(i,a,t,n,r),s=hA(o,t),c=hA(o,a);s<fA&&c<fA&&(o=t,this.end()),this._prevValue=a,this._currValue=o}}},_A=class{constructor(e){this.transitions=new Map,this.timeline=e}get active(){return this.transitions.size>0}add(e,t,n,r){let{transitions:i}=this;if(i.has(e)){let n=i.get(e),{value:r=n.settings.fromValue}=n;t=r,this.remove(e)}if(r=MO(r),!r)return;let a=gA[r.type];if(!a){R.error(`unsupported transition type '${r.type}'`)();return}let o=new a(this.timeline);o.start({...r,fromValue:t,toValue:n}),i.set(e,o)}remove(e){let{transitions:t}=this;t.has(e)&&(t.get(e).cancel(),t.delete(e))}update(){let e={};for(let[t,n]of this.transitions)n.update(),e[t]=n.value,n.inProgress||this.remove(t);return e}clear(){for(let e of this.transitions.keys())this.remove(e)}};function vA(e){let t=e[lE];for(let n in t){let r=t[n],{validate:i}=r;if(i&&!i(e[n],r))throw Error(`Invalid prop ${n}: ${e[n]}`)}}function yA(e,t){let n=xA({newProps:e,oldProps:t,propTypes:e[lE],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),r=CA(e,t),i=!1;return r||(i=wA(e,t)),{dataChanged:r,propsChanged:n,updateTriggersChanged:i,extensionsChanged:TA(e,t),transitionsChanged:bA(e,t)}}function bA(e,t){if(!e.transitions)return!1;let n={},r=e[lE],i=!1;for(let a in e.transitions){let o=r[a],s=o&&o.type;(s===`number`||s===`color`||s===`array`)&&SA(e[a],t[a],o)&&(n[a]=!0,i=!0)}return i?n:!1}function xA({newProps:e,oldProps:t,ignoreProps:n={},propTypes:r={},triggerName:i=`props`}){if(t===e)return!1;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return`${i} changed shallowly`;for(let a of Object.keys(e))if(!(a in n)){if(!(a in t))return`${i}.${a} added`;let n=SA(e[a],t[a],r[a]);if(n)return`${i}.${a} ${n}`}for(let a of Object.keys(t))if(!(a in n)){if(!(a in e))return`${i}.${a} dropped`;if(!Object.hasOwnProperty.call(e,a)){let n=SA(e[a],t[a],r[a]);if(n)return`${i}.${a} ${n}`}}return!1}function SA(e,t,n){let r=n&&n.equal;return r&&!r(e,t,n)||!r&&(r=e&&t&&e.equals,r&&!r.call(e,t))?`changed deeply`:!r&&t!==e?`changed shallowly`:null}function CA(e,t){if(t===null)return`oldProps is null, initial diff`;let n=!1,{dataComparator:r,_dataDiff:i}=e;r?r(e.data,t.data)||(n=`Data comparator detected a change`):e.data!==t.data&&(n=`A new data container was supplied`);let a=e[hE],o=t[hE];if(Object.keys(a??{}).some(e=>a[e]!==o?.[e])||Object.keys(o??{}).some(e=>!a?.[e]))return`An Arrow row accessor changed`;let s=e[mE],c=t[mE];return Object.keys(c??{}).some(t=>{let n=e[lE][t];return(typeof n?.arrow==`string`||e.extensions?.length>0&&n?.arrowWithExtensions)&&s?.[t]?.sql!==c[t].sql})?`An Arrow row accessor query changed`:(n&&i&&(n=i(e.data,t.data)||n),n)}function wA(e,t){if(t===null||`all`in e.updateTriggers&&EA(e,t,`all`))return{all:!0};let n={},r=!1;for(let i in e.updateTriggers)i!==`all`&&EA(e,t,i)&&(n[i]=!0,r=!0);return r?n:!1}function TA(e,t){if(t===null)return!0;let n=t.extensions,{extensions:r}=e;if(r===n)return!1;if(!n||!r||r.length!==n.length)return!0;for(let e=0;e<r.length;e++)if(!r[e].equals(n[e]))return!0;return!1}function EA(e,t,n){let r=e.updateTriggers[n];r??={};let i=t.updateTriggers[n];return i??={},xA({oldProps:i,newProps:r,triggerName:n})}var DA=`count(): argument not an object`,OA=`count(): argument not a container`;function kA(e){if(!jA(e))throw Error(DA);if(qe(e))return e.numRows;if(typeof e.count==`function`)return e.count();if(Number.isFinite(e.size))return e.size;if(Number.isFinite(e.length))return e.length;if(AA(e))return Object.keys(e).length;throw Error(OA)}function AA(e){return typeof e==`object`&&!!e&&e.constructor===Object}function jA(e){return typeof e==`object`&&!!e}function MA(e,t){if(!t)return e;let n={...e,...t};if(`defines`in t&&(n.defines={...e.defines,...t.defines}),`modules`in t&&(n.modules=(e.modules||[]).concat(t.modules),t.modules.some(e=>e.name===`project64`))){let e=n.modules.findIndex(e=>e.name===`project32`);e>=0&&n.modules.splice(e,1)}if(`plugins`in t&&(n.plugins=[...new Set([...e.plugins||[],...t.plugins||[]])]),`inject`in t)if(!e.inject)n.inject=t.inject;else{let r={...e.inject};for(let e in t.inject)r[e]=(r[e]||``)+t.inject[e];n.inject=r}return n}function NA(e,t=!1){if(aA(e)){let n=e.type.typeId;if(t&&(n===2||n===3)){let t=n===3?255:1;return Uint8ClampedArray.from({length:e.length},(n,r)=>Number(e.get(r))*t)}return Array.from({length:e.length},(n,r)=>NA(e.get(r),t))}return e}var PA={minFilter:`linear`,mipmapFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},FA={};function IA(e,t,n,r){if(n instanceof L)return n;n.constructor&&n.constructor.name!==`Object`&&(n={data:n});let i=null;n.compressed&&(i={minFilter:`linear`,mipmapFilter:n.data.length>1?`nearest`:`linear`});let{width:a,height:o}=n.data,s=t.createTexture({...n,sampler:{...PA,...i,...r},mipLevels:t.getMipLevelCount(a,o)});return t.type===`webgl`?s.generateMipmapsWebGL():t.type===`webgpu`&&t.generateMipmapsWebGPU(s),FA[s.id]=e,s}function LA(e,t){!t||!(t instanceof L)||FA[t.id]===e&&(t.delete(),delete FA[t.id])}var RA={boolean:{validate(e,t){return!0},equal(e,t,n){return!!e==!!t}},number:{validate(e,t){return Number.isFinite(e)&&(!(`max`in t)||e<=t.max)&&(!(`min`in t)||e>=t.min)}},color:{validate(e,t){return t.optional&&!e||HA(e)&&(e.length===3||e.length===4)},equal(e,t,n){return Ke(e,t,1)}},accessor:{validate(e,t){let n=UA(e);return!!t.arrow&&aA(e)||n===`function`||t.constantTypes?.some(e=>e===n)||n===UA(t.value)},equal(e,t,n){return n.arrow&&(aA(e)||aA(t))?e===t:typeof t==`function`?!0:Ke(e,t,1)}},array:{validate(e,t){return t.optional&&!e||HA(e)},equal(e,t,n){let{compare:r}=n;return r?Ke(e,t,Number.isInteger(r)?r:r?1:0):e===t}},object:{equal(e,t,n){if(n.ignore)return!0;let{compare:r}=n;return r?Ke(e,t,Number.isInteger(r)?r:r?1:0):e===t}},function:{validate(e,t){return t.optional&&!e||typeof e==`function`},equal(e,t,n){return!n.compare&&n.ignore!==!1||e===t}},data:{transform:(e,t,n)=>{if(!e)return e;let{dataTransform:r}=n.props;return r&&(e=r(e)),t.materializeIterator&&typeof e?.next==`function`&&e[Symbol.iterator]?.()===e?Array.from(e):r?e:typeof e.shape==`string`&&e.shape.endsWith(`-table`)&&Array.isArray(e.data)?e.data:e}},image:{transform:(e,t,n)=>{let r=n.context;return!r||!r.device?null:IA(n.id,r.device,e,{...t.parameters,...n.props.textureParameters})},release:(e,t,n)=>{LA(n.id,e)}}};function zA(e){let t={},n={},r={};for(let[i,a]of Object.entries(e)){let e=a?.deprecatedFor;if(e)r[i]=Array.isArray(e)?e:[e];else{let e=BA(i,a);t[i]=e,n[i]=e.value}}return{propTypes:t,defaultProps:n,deprecatedProps:r}}function BA(e,t){switch(UA(t)){case`object`:return VA(e,t);case`array`:return VA(e,{type:`array`,value:t,compare:!1});case`boolean`:return VA(e,{type:`boolean`,value:t});case`number`:return VA(e,{type:`number`,value:t});case`function`:return VA(e,{type:`function`,value:t,compare:!0});default:return{name:e,type:`unknown`,value:t}}}function VA(e,t){return`type`in t?{name:e,...RA[t.type],...t}:`value`in t?{name:e,type:UA(t.value),...t}:{name:e,type:`object`,value:t}}function HA(e){return Array.isArray(e)||ArrayBuffer.isView(e)}function UA(e){return HA(e)?`array`:e===null?`null`:typeof e}function WA(e,t){let n;for(let e=t.length-1;e>=0;e--){let r=t[e];`extensions`in r&&(n=r.extensions)}let r=KA(e.constructor,n),i=Object.create(r);i[cE]=e,i[fE]={},i[pE]={};for(let e=0;e<t.length;++e){let n=t[e];for(let e in n)i[e]=n[e]}i.query&&`data`in i[pE]&&(i[fE].data=i[pE].data,delete i[pE].data);let a=r[lE];for(let e of Object.keys(i)){let t=a[e],r=i[e],o=t?.type===`accessor`?n?.length&&t.arrowWithExtensions||t.arrow:!1,s=typeof o==`string`,c=o===`row-color`;if(t?.type===`accessor`&&t.arrow&&typeof r?.sql==`string`){let n=i[mE]??(i[mE]=Object.create(null)),a={sql:r.sql},o=(e,{index:t})=>NA(a.column?.get(t),c);n[e]=a,Object.defineProperty(i,e,{enumerable:!0,get:()=>a.column?s?o:a.column:t.value})}else s&&aA(r)&&((i[hE]??(i[hE]=Object.create(null)))[e]=r,i[e]=(e,{index:t})=>NA(r.get(t),c))}return Object.freeze(i),i}var GA=`_mergedDefaultProps`;function KA(e,t){if(!(e instanceof nj.constructor))return{};let n=GA;if(t)for(let e of t){let t=e.constructor;t&&(n+=`:${t.extensionName||t.name}`)}return $A(e,n)||(e[n]=qA(e,t||[]))}function qA(e,t){if(!e.prototype)return null;let n=KA(Object.getPrototypeOf(e)),r=zA($A(e,`defaultProps`)||{}),i=Object.assign(Object.create(null),n,r.defaultProps),a=Object.assign(Object.create(null),n?.[lE],r.propTypes),o=Object.assign(Object.create(null),n?.[uE],r.deprecatedProps);for(let e of t){let t=KA(e.constructor);t&&(Object.assign(i,t),Object.assign(a,t[lE]),Object.assign(o,t[uE]))}return JA(i,e),XA(i,a),YA(i,o),i[lE]=a,i[uE]=o,t.length===0&&!QA(e,`_propTypes`)&&(e._propTypes=a),i}function JA(e,t){let n=ej(t);Object.defineProperties(e,{id:{writable:!0,value:n}})}function YA(e,t){for(let n in t)Object.defineProperty(e,n,{enumerable:!1,set(e){let r=`${this.id}: ${n}`;for(let r of t[n])QA(this,r)||(this[r]=e);R.deprecated(r,t[n].join(`/`))()}})}function XA(e,t){let n={},r={};for(let e in t){let i=t[e],{name:a,value:o}=i;i.async&&(n[a]=o,r[a]=ZA(a))}e[dE]=n,e[fE]={},Object.defineProperties(e,r)}function ZA(e){return{enumerable:!0,set(t){typeof t==`string`||t instanceof Promise||EO(t)?this[fE][e]=t:this[pE][e]=t},get(){if(this[pE]){if(e in this[pE])return this[pE][e]||this[dE][e];if(e in this[fE]){let t=this[cE]&&this[cE].internalState;if(t&&t.hasAsyncProp(e))return t.getAsyncProp(e)||this[dE][e]}}return this[dE][e]}}}function QA(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function $A(e,t){return QA(e,t)&&e[t]}function ej(e){let t=e.componentName;return t||R.warn(`${e.name}.componentName not specified`)(),t||e.name}var tj=0,nj=class{constructor(...e){this.props=WA(this,e),this.id=this.props.id,this.count=tj++}clone(e){let{props:t}=this,n={};for(let e in t[dE])e in t[pE]?n[e]=t[pE][e]:e in t[fE]&&(n[e]=t[fE][e]);let r=t[mE];for(let e in r)n[e]={sql:r[e].sql};return new this.constructor({...t,...t[hE],...n,...e})}};nj.componentName=`Component`,nj.defaultProps={};function rj(e,t){if(Object.getPrototypeOf(e)===t.Schema.prototype)return e;function n(e){return new t.Field(e.name,r(e.type),e.nullable,e.metadata)}function r(e){let i=t[e.constructor.name];if(typeof i!=`function`||!(i.prototype instanceof t.DataType))throw Error(`Unsupported Arrow type from another runtime`);let a=Object.assign(Object.create(i.prototype),e);return e.children&&(a.children=e.children.map(n)),t.DataType.isDictionary(e)&&(a.indices=r(e.indices),a.dictionary=r(e.dictionary)),a}return new t.Schema(e.fields.map(n),e.metadata)}function ij(e,t){let{Data:n,Vector:r}=t,{schema:i,data:a}=e,o=rj(i,t);function s(e,t){if(e.variadicBuffers?.length)throw Error(`Unsupported Arrow variadic buffers from another runtime`);return new n(t,e.offset,e.length,e.nullCount,e.buffers,e.children.map((e,n)=>s(e,t.children[n].type)),e.dictionary&&new r(e.dictionary.data.map(e=>s(e,t.dictionary))))}return new t.RecordBatch(o,s(a,new t.Struct(o.fields)))}var aj=Object.freeze({}),oj=class{constructor(e){this.component=e,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let e in this.asyncProps){let t=this.asyncProps[e];t&&t.type&&t.type.release&&t.type.release(t.resolvedValue,t.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||aj}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(e){return e in this.asyncProps}getAsyncProp(e){let t=this.asyncProps[e];return t&&t.resolvedValue}isAsyncPropLoading(e){if(e){let t=this.asyncProps[e];return!!(t&&t.pendingLoadCount>0&&t.pendingLoadCount!==t.resolvedLoadCount)}for(let e in this.asyncProps)if(this.isAsyncPropLoading(e))return!0;return!1}reloadAsyncProp(e,t){this._watchPromise(e,Promise.resolve(t))}setAsyncProps(e){this.component=e[cE]||this.component;let t=e[pE]||{},n=e[fE]||e,r=e[dE]||{};for(let e in t){let n=t[e];this._createAsyncPropData(e,r[e]);let i=this._updateAsyncProp(e,n);t[e]=this.getAsyncProp(e),i&&this._onResolve(e,t[e])}for(let e in n){let t=n[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,t)&&this._onResolve(e,this.getAsyncProp(e))}}_fetch(e,t){return null}_didAsyncRequestChange(e,t){return!1}_prepareAsyncInput(e,t){return t}_onProgress(e,t){}_onResolve(e,t){}_onError(e,t){}_updateAsyncProp(e,t){let n=this._didAsyncRequestChange(e,t);return!this._didAsyncInputValueChange(e,t)&&!n?!1:(t=typeof t==`string`?this._fetch(e,t):this._prepareAsyncInput(e,t),t instanceof Promise?(this._watchPromise(e,t),!1):EO(t)?(this._resolveAsyncIterable(e,t),!1):(this._setPropValue(e,t),!0))}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps){this.oldAsyncProps=Object.create(this.oldProps);for(let e in this.asyncProps)Object.defineProperty(this.oldAsyncProps,e,{enumerable:!0,value:this.oldProps[e]})}}_didAsyncInputValueChange(e,t){let n=this.asyncProps[e];return t===n.resolvedValue||t===n.lastValue?!1:(n.lastValue=t,!0)}_setPropValue(e,t){this._freezeAsyncOldProps();let n=this.asyncProps[e];n&&(t=this._postProcessValue(n,e===`data`?Je(t):t),n.resolvedValue=t,n.pendingLoadCount++,n.resolvedLoadCount=n.pendingLoadCount)}_setAsyncPropValue(e,t,n){let r=this.asyncProps[e];r&&n>=r.resolvedLoadCount&&t!==void 0&&(this._freezeAsyncOldProps(),r.resolvedValue=t,r.resolvedLoadCount=n,this.onAsyncPropUpdated(e,t))}_watchPromise(e,t){let n=this.asyncProps[e];if(n){n.pendingLoadCount++;let r=n.pendingLoadCount;t.then(t=>{if(this.component&&r===n.pendingLoadCount){if(e===`data`&&EO(t))return this._resolveAsyncIterable(e,t,r);t=this._postProcessValue(n,e===`data`?Je(t):t),this._setAsyncPropValue(e,t,r),this.component&&r===n.pendingLoadCount&&this._onResolve(e,t)}}).catch(t=>{this.component&&r===n.pendingLoadCount&&this._onError(e,t)})}}async _resolveAsyncIterable(e,t,n){if(e!==`data`){this._setPropValue(e,t);return}let r=this.asyncProps[e];if(!r||(n??=++r.pendingLoadCount,n!==r.pendingLoadCount))return;let i=[],a=0,o=[],s=i,c;try{for await(let u of t){if(!this.component||n!==r.pendingLoadCount)return;if(u?.batchType===`metadata`||u?.shape===`metadata`)continue;let{dataTransform:t,_dataLoadOptions:d=`auto`}=this.component.props,f=Je(u);if(qe(f)){if(c===`rows`)throw Error(`Cannot mix Arrow and row chunks`);c=`arrow`;let t=await l(()=>import(`./Arrow.dom-DgcicCtZ.js`),__vite__mapDeps([14,15,16])),{Table:i,RecordBatch:a}=t;if(!this.component||n!==r.pendingLoadCount)return;let u=(`batches`in f?f.batches:[f]).map(e=>Object.getPrototypeOf(e)===a.prototype?e:ij(e,t));d===`snapshots`?o=[...u]:o.push(...u);let p=new i(u[0]?.schema??rj(f.schema,t),o);s=p,this._setAsyncPropValue(e,p,n),this.component&&n===r.pendingLoadCount&&this._onProgress(e,p);continue}if(d===`snapshots`)throw Error(`snapshots requires Arrow chunks`);if(c===`arrow`)throw Error(`Cannot mix Arrow and row chunks`);c=`rows`;let p=(u?.shape===`object-row-table`||u?.shape===`array-row-table`||u?.shape===`unknown`)&&Array.isArray(u.data)?u.data:u;i=t?t(p,i):i.concat(p),Object.defineProperty(i,`__diff`,{enumerable:!1,value:[{startRow:a,endRow:i.length}]}),a=i.length,s=i,this._setAsyncPropValue(e,i,n),this.component&&n===r.pendingLoadCount&&this._onProgress(e,i)}this.component&&n===r.pendingLoadCount&&!c&&this._setAsyncPropValue(e,i,n),this.component&&n===r.pendingLoadCount&&this._onResolve(e,s)}catch(t){this.component&&n===r.pendingLoadCount&&this._onError(e,t)}}_postProcessValue(e,t){let n=e.type;return n&&this.component&&(n.release&&n.release(e.resolvedValue,n,this.component),n.transform)?n.transform(t,n,this.component):t}_createAsyncPropData(e,t){if(!this.asyncProps[e]){let n=this.component&&this.component.props[lE];this.asyncProps[e]={type:n&&n[e],lastValue:null,resolvedValue:t,pendingLoadCount:0,resolvedLoadCount:0}}}},sj=class extends oj{constructor({attributeManager:e,layer:t}){super(t),this.hoverHighlightInfo=null,this.normalizedHighlightColor=!1,this.sourceCrs=null,this.packedCrs=null,this.preproject=null,this.unpreproject=null,this.preprojectionSignature=null,this.preprojectionChanged=!1,this.tessellationSignature=null,this.attributeManager=e,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}refreshQueryParser(){let e=this.layer;e?.props.query&&this.dataRequest?.parser!==e.context.sqlParser?.parseQuery&&this.setAsyncProps(e.props)}_didAsyncRequestChange(e,t){if(e!==`data`)return!1;let n=this.layer,r=n?.props.query,i=typeof t==`string`,a=n?.props._dataLoadOptions??`auto`,o=n&&(r||i&&a!==`auto`)?{query:r,mode:i&&!r?a:void 0,parser:r?n.context.sqlParser?.parseQuery:void 0,fetch:i&&r?n.props.fetch:void 0,loaders:i?n.props.loaders:void 0,options:i?n.getLoadOptions():void 0}:void 0,s=!Va(this.dataRequest,o);return this.dataRequest=o,s}_onProgress(e,t){let n=this.layer;e===`data`&&n&&n.props.onDataProgress?.(t,{propName:e,layer:n})}_prepareAsyncInput(e,t){let n=e===`data`?this.dataRequest:void 0;if(!n?.query)return t;let{query:r,parser:i}=n;return Promise.resolve(t).then(async e=>{let{queryLayerData:t}=await l(async()=>{let{queryLayerData:e}=await import(`./data-query-CUzuRG2A.js`);return{queryLayerData:e}},__vite__mapDeps([17,18,19,20,21,22,23,24,25,26,27,15,16,28,29]));return t(e,r,void 0,void 0,i)})}_fetch(e,t){let n=this.layer,r=e===`data`?this.dataRequest:void 0,i=n?.props.fetch;if(r?.query&&n){n.context.resourceManager?.unsubscribe({consumerId:n.id,requestId:e});let{fetch:a}=Sj.defaultProps;if(i&&i!==a.value)return this._prepareAsyncInput(e,i(t,{propName:e,layer:n}));let{query:o}=r;return l(async()=>{let{queryLayerData:e}=await import(`./data-query-CUzuRG2A.js`);return{queryLayerData:e}},__vite__mapDeps([17,18,19,20,21,22,23,24,25,26,27,15,16,28,29])).then(({queryLayerData:e})=>e(t,o,r.loaders,r.options,r.parser))}return i?i(t,{propName:e,layer:n}):super._fetch(e,t)}_onResolve(e,t){let n=this.layer;if(n){let r=n.props.onDataLoad;e===`data`&&r&&r(t,{propName:e,layer:n})}}_onError(e,t){let n=this.layer;n&&n.raiseError(t,`loading ${e} of ${this.layer}`)}},cj=`layer.changeFlag`,lj=`layer.initialize`,uj=`layer.update`,dj=`layer.finalize`,fj=`layer.matched`,pj=2**24-1,mj=Object.freeze([]),hj=NS(({oldViewport:e,viewport:t})=>e.equals(t)),gj=new Uint8ClampedArray;function _j(e){return e.rowIndexes||e.pickingColors||e.instancePickingColors}function vj(e){return e.rowIndexes}function yj(e){return e.pickingColors||e.instancePickingColors}var bj=[0,0,128,128],xj={data:{type:`data`,value:mj,async:!0},dataComparator:{type:`function`,value:null,optional:!0},_dataDiff:{type:`function`,value:e=>e&&e.__diff,optional:!0},query:null,sqlFunctions:{type:`array`,value:[],compare:!0},dataTransform:{type:`function`,value:null,optional:!0},_dataLoadOptions:`auto`,onDataProgress:{type:`function`,value:null,optional:!0},onDataLoad:{type:`function`,value:null,optional:!0},onError:{type:`function`,value:null,optional:!0},fetch:{type:`function`,value:(e,{propName:t,layer:n,loaders:r,loadOptions:i,signal:a})=>{let{resourceManager:o}=n.context;if(i||=n.getLoadOptions(),r||=n.props.loaders,a&&(i={...i,core:{...i?.core,fetch:{...i?.core?.fetch,signal:a}}}),t===`data`&&n.props._dataLoadOptions!==`auto`)return o.unsubscribe({consumerId:n.id,requestId:t}),as(e,r,i);let s=o.contains(e);return!s&&!i&&(o.add({resourceId:e,data:is(e,r),persistent:!1}),s=!0),s?o.subscribe({resourceId:e,onChange:e=>n.internalState?.reloadAsyncProp(t,e),consumerId:n.id,requestId:t}):is(e,r,i)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:`number`,min:0,max:1,value:1},operation:`draw`,onHover:{type:`function`,value:null,optional:!0},onClick:{type:`function`,value:null,optional:!0},onDragStart:{type:`function`,value:null,optional:!0},onDrag:{type:`function`,value:null,optional:!0},onDragEnd:{type:`function`,value:null,optional:!0},coordinateSystem:{type:`object`,value:`default`,validate:e=>typeof e==`string`||!!e&&typeof e==`object`,equal:DS},coordinateOrigin:{type:`array`,value:[0,0,0],compare:!0},modelMatrix:{type:`array`,value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:`XYZ`,colorFormat:`RGBA`,parameters:{type:`object`,value:{},optional:!0,compare:2},loadOptions:{type:`object`,value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:`array`,value:[],optional:!0,ignore:!0},getPolygonOffset:{type:`function`,value:({layerIndex:e})=>[0,-e*100]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:`accessor`,value:bj}},Sj=class extends nj{constructor(){super(...arguments),this.internalState=null,this.lifecycle=sE.NO_STATE,this._coordinateSystemLoading=!1,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,`layerName`)?this.layerName:``}get root(){let e=this;for(;e.parent;)e=e.parent;return e}toString(){return`${this.constructor.layerName||this.constructor.name}({id: '${this.props.id}'})`}project(e){Z(this.internalState);let t=this.internalState.viewport||this.context.viewport,[n,r,i]=nS(this.projectPosition(e,{autoOffset:!1}),t.pixelProjectionMatrix);return e.length===2?[n,r]:[n,r,i]}unproject(e){return Z(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(e)}projectPosition(e,t={}){Z(this.internalState);let{viewport:n=this.internalState.viewport||this.context.viewport,sourceCrs:r=this.internalState.sourceCrs,coordinateSystem:i=t.sourceCrs?.signature??this.props.coordinateSystem,modelMatrix:a=this.props.modelMatrix,coordinateOrigin:o=this.props.coordinateOrigin,autoOffset:s}=t;return WT(e,{viewport:n,sourceCrs:r,coordinateSystem:i,modelMatrix:a,coordinateOrigin:o,autoOffset:s})}get isComposite(){return!1}get isDrawable(){return!0}setState(e){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,e),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return this.internalState?!this._coordinateSystemLoading&&!this.internalState.isAsyncPropLoading()&&!this.internalState.accessorQueries?.pending:!1}get isCoordinateSystemLoaded(){return!this._coordinateSystemLoading}_setSourceCrs(e){this._coordinateSystemLoading=e===void 0,e!==void 0&&(this._sourceCrs=e,this.internalState&&(this.internalState.sourceCrs=e,this._updatePreprojection(this.internalState.viewport||this.context.viewport)))}_updatePreprojection(e){let t=this.internalState,n=!kS(e.projectionMode,t.sourceCrs,e.crs),r=JSON.stringify([t.sourceCrs?.signature,n?e.projectionMode===B.CUSTOM_GEOSPATIAL?e.crs?.signature:`WGS84`:null]),i=t.preprojectionSignature!==r;i&&(Object.assign(t,e.getPreprojection(t.sourceCrs)),t.preprojectionSignature=r,t.preprojectionChanged=!0);let a=JSON.stringify([e.crs?.signature,e.projectionSignature]),o=t.tessellationSignature!==a;return t.tessellationSignature=a,Object.assign(this.state,{sourceCrs:t.sourceCrs,packedCrs:t.packedCrs,preproject:t.preproject,unpreproject:t.unpreproject}),(i||o)&&t.changeFlags&&this.setChangeFlags({projectionChanged:!0}),i||o}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let e=this.state;return e&&(e.models||e.model&&[e.model])||[]}setShaderModuleProps(...e){for(let t of this.getModels())t.shaderInputs.setProps(...e)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}usePositionTransforms(){return{transformSource:`projection`,transform:this.internalState?.preproject?Tj:null}}getSubdivisionStep(){let e=this.internalState?.sourceCrs;if(!e)return 0;let t=this.context.viewport.getSubdivisionStep(e),{modelMatrix:n}=this.props;if(!t||!n)return t;let r=Math.max(Math.hypot(n[0],n[1],n[2]),Math.hypot(n[4],n[5],n[6]));return r>0?t/r:0}use64bitPositions(){let{coordinateSystem:e}=this.props;return!!this.internalState?.sourceCrs||this.context?.viewport?.projectionMode===B.CUSTOM_GEOSPATIAL||e===`default`||e===`lnglat`||e===`cartesian`}onHover(e,t){return this.props.onHover&&this.props.onHover(e,t)||!1}onClick(e,t){return this.props.onClick&&this.props.onClick(e,t)||!1}nullPickingColor(){return[0,0,0]}encodePickingColor(e,t=[]){return t[0]=e+1&255,t[1]=e+1>>8&255,t[2]=e+1>>8>>8&255,t}decodePickingColor(e){Z(e instanceof Uint8Array);let[t,n,r]=e;return t+n*256+r*65536-1}getNumInstances(){return Number.isFinite(this.props.numInstances)?this.props.numInstances:this.state&&this.state.numInstances!==void 0?this.state.numInstances:kA(this.getColumnData())}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds([`positions`,`instancePositions`])}resolveColumns(e,t=!1){let n=t?this.getColumnData():this.props.data;return lA(n===this.props.data?this.props:Object.create(this.props,{data:{value:n}}),e,t)}getColumnData(){let e=Je(this.props.data);if(Array.isArray(e)&&e.length===0&&!this.internalState?.isAsyncPropLoading(`data`)){let e=this.props[hE];for(let[t,n]of Object.entries(e??{})){let e=this.props[lE][t];if(e?.type===`accessor`&&`arrowWithExtensions`in e&&e.arrowWithExtensions)return{length:n.length}}}return e}getSQLFunctions(){return Array.from(new Map([...this.context.sqlFunctions??[],...this.props.sqlFunctions??[]].map(e=>[e.name.toUpperCase(),e])).values())}updateAccessorQueries(){let e=this.internalState,t=this.props[mE];if(!t){e.accessorQueries=void 0;return}let n=this.props.data;if(n==null||Array.isArray(n)&&n.length===0||e.isAsyncPropLoading(`data`)&&!qe(Je(n))){e.accessorQueries=void 0;return}let r=this.context.sqlParser?.parseExpression,i=this.getSQLFunctions(),a=Object.fromEntries(Object.entries(t).map(([e,t])=>[e,t.sql])),o=e.accessorQueries,s=e=>{let t=e.props[mE];return t&&e.props.data===n&&e.context.sqlParser?.parseExpression===r&&Ke(e.getSQLFunctions(),i,1)&&Object.keys(t).length===Object.keys(a).length&&Object.entries(a).every(([e,n])=>t[e]?.sql===n)},c=(e,t)=>{for(let[n,r]of Object.entries(e.props[mE]))r.column=t?.[n]};if(o&&o.source===n&&o.parseExpression===r&&Ke(o.functions,i,1)&&Ke(o.expressions,a,1)){c(this,o.columns);return}let u={source:n,expressions:a,parseExpression:r,functions:i,scales:o?.scales,pending:!0};e.accessorQueries=u,c(this,void 0);let d=()=>{let t=e.layer;return e.accessorQueries===u&&t&&s(t)?t:null};l(async()=>{let{evaluateAccessorQueries:e}=await import(`./accessor-queries-BIphk7MI.js`);return{evaluateAccessorQueries:e}},__vite__mapDeps([30,19,20,21,22,31,32,33,15,16])).then(({evaluateAccessorQueries:e})=>e(n,a,r,o,i)).then(({table:e,scales:t})=>{let n=d();n&&(u.table=e,u.scales=Object.keys(t).length?t:void 0,u.pending=!1,u.columns=Object.fromEntries(Object.keys(a).map(t=>[t,e.getChild(t)])),c(n,u.columns),n.setChangeFlags({dataChanged:`SQL accessors resolved`}),n.setNeedsUpdate())},e=>{let t=d();t&&(u.scales=void 0,u.pending=!1,t.setNeedsUpdate(),t.raiseError(e,`evaluating SQL accessors`),t.setChangeFlags({dataChanged:`SQL accessor evaluation failed`}))})}hasAccessorQuery(e){return!!this.props[mE]?.[e]}getAccessorQueryTable(){return this.internalState?.accessorQueries?.table}_getResolvedColorScales(){return this.internalState?.accessorQueries?.scales}getShaders(e,t=this.props.extensions){e=MA({defines:{USE_EXTERNAL_PROJECTION:this.context.viewport.projectionMode===B.CUSTOM_GEOSPATIAL}},e),e.modules?.includes(sT)&&!e.plugins?.includes(cT)&&(e=MA(e,{plugins:[cT]})),e=MA(e,{disableWarnings:!0,modules:this.context.defaultShaderModules,plugins:this.context.defaultShaderPlugins});for(let n of t)e=MA(e,n.getShaders.call(this,n));return{...e,shaderAssembler:this.context.shaderAssembler}}shouldUpdateState(e){return e.changeFlags.propsOrDataChanged}updateState(e){let t=this.getAttributeManager(),{dataChanged:n}=e.changeFlags;if(n&&t)if(Array.isArray(n))for(let e of n)t.invalidateAll(e);else t.invalidateAll();if(t){let{props:n}=e,r=this.internalState.hasPickingBuffer,i=Number.isInteger(n.highlightedObjectIndex)||!!n.pickable||n.extensions.some(e=>e.getNeedsPickingBuffer.call(this,e));if(r!==i){this.internalState.hasPickingBuffer=i;let e=_j(t.attributes);e&&(i&&e.constant&&(e.constant=!1,t.invalidate(e.id)),!e.value&&!i&&(e.constant=!0,e.value=vj(t.attributes)?[eT]:[0,0,0]))}}}finalizeState(e){for(let e of this.getModels())e.destroy();let t=this.getAttributeManager();t&&t.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(e){for(let t of this.getModels())t.draw(e.renderPass)}getPickingInfo({info:e,mode:t,sourceLayer:n}){let{index:r}=e;if(r>=0){let t=this.getColumnData();Array.isArray(t)?e.object=t[r]:qe(t)&&(e.object=t.get(r))}return e}raiseError(e,t){t&&(e=Error(`${t}: ${e.message}`,{cause:e})),this.props.onError?.(e)||this.context?.onError?.(e,this)}getNeedsRedraw(e={clearRedrawFlags:!1}){return this._getNeedsRedraw(e)}needsUpdate(){return this.internalState?this.internalState.needsUpdate||this.internalState.changeFlags.projectionChanged||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()):!1}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(e){if(!this.internalState||!this.context.layerManager.isViewportReady(this))return;let t=this.internalState.viewport;if(this.internalState.viewport=e,this._coordinateSystemLoading)return;let n=this._updatePreprojection(e);(!t||!hj({oldViewport:t,viewport:e}))&&(this.setChangeFlags({viewportChanged:!0,projectionChanged:n}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(e=`all`){let t=this.getAttributeManager();t&&(e===`all`?t.invalidateAll():t.invalidate(e))}updateAttributes(e){let t=!1;for(let n in e)e[n].layoutChanged()&&(t=!0);let n=this.getAttributeManager(),r=!!n?.hasBufferGroups();r&&n.getBufferGroupBindings(e);for(let n of this.getModels())this._setModelAttributes(n,e,t,r)}usesNormalizedColors(){return!this.parent&&!!this.context.normalizedColors}_updateAttributes(){let e=this.getAttributeManager();if(!e)return;let t=this.props,n=this.usesNormalizedColors();for(let t of Object.values(e.attributes)){let{settings:e}=t;e.semanticType===`color`&&e.normalizedColorInput!==n&&(e.normalizedColorInput=n,t.setNeedsUpdate())}let r=this.getNumInstances(),i=this.getStartIndices(),a=this.getColumnData();e.update({data:a,numInstances:r,startIndices:i,props:t,transitions:t.transitions,buffers:a.attributes,context:this});let o=e.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(o)}_updateAttributeTransition(){let e=this.getAttributeManager();e&&e.updateTransition()}getUniformTransitionValue(e,t){return t}isUniformTransitionValue(e){return!Object.hasOwn(this.props,cE)&&Object.hasOwn(this.props,e)}_updateUniformTransition(){let{uniformTransitions:e}=this.internalState;if(e.active){let t=e.update(),n=Object.create(this.props);for(let e in t)Object.defineProperty(n,e,{value:t[e]});return n}return this.props}calculateInstancePickingColors(e,{numInstances:t}){if(e.constant)return;let n=Math.floor(gj.length/4);this.internalState.usesPickingColorCache=!0;let r=t>0&&gj[0]===0;if(n<t||r){t>pj&&R.warn(`Layer has too many data objects. Picking might not be able to distinguish all objects.`)(),gj=wT.allocate(gj,t,{size:4,copy:!0,maxCount:Math.max(t,pj)});let e=Math.floor(gj.length/4),i=[0,0,0],a=r?0:n;for(let t=a;t<e;t++)this.encodePickingColor(t,i),gj[t*4+0]=i[0],gj[t*4+1]=i[1],gj[t*4+2]=i[2],gj[t*4+3]=0}e.value=gj.subarray(0,t*4)}_setGPUVectorModelAttributes(e,t,n){let r=e.userData?.excludeAttributes||{},i=t.getBufferGroupBindings(n,e,r),a={...t.getAttributes()},o;for(let e in a)r[e]||i.groupedAttributeIds.has(e)?delete a[e]:a[e].settings.isIndexed&&(o=a[e].getBuffer(),delete a[e]);let s=t.getGPUVectors(a,{...i,length:this.getNumInstances()});e.setGPUAttributes(s,i.bufferLayouts),o!==void 0&&e.setIndexBuffer(o)}_setModelAttributes(e,t,n=!1,r=!1){if(!Object.keys(t).length)return;let i=this.getAttributeManager(),a=r?{}:t;if(e instanceof uA&&i){this._setGPUVectorModelAttributes(e,i,a);return}if(i?.hasBufferGroups()){this._setGroupedModelAttributes(e,i,a);return}if(n){let n=this.getAttributeManager();e.setBufferLayout(n.getBufferLayouts(e)),t=n.getAttributes()}let o=e.userData?.excludeAttributes||{},s={},c={};for(let n in t){if(o[n])continue;let r=t[n].getValue();for(let i in r){let a=r[i];a instanceof I?t[n].settings.isIndexed?e.setIndexBuffer(a):s[i]=a:a&&(c[i]=a)}}e.setAttributes(s),e.setConstantAttributes(c)}_setGroupedModelAttributes(e,t,n){let r=e.userData?.excludeAttributes||{},i=t.getBufferGroupBindings(n,e,r);e.setBufferLayout(i.bufferLayouts);let a={...i.buffers},o={},s=t.getAttributes();for(let t in s){if(r[t]||i.groupedAttributeIds.has(t))continue;let n=s[t],c=n.getValue();for(let t in c){let r=c[t];r instanceof I?n.settings.isIndexed?e.setIndexBuffer(r):a[t]=r:r&&(o[t]=r)}}e.setAttributes(a),e.setConstantAttributes(o)}disablePickingIndex(e){let t=this.props.data;if(!(`attributes`in t)||qe(t)){this._disablePickingIndex(e);return}let n=this.getAttributeManager()?.getAttributes()||{},r=vj(n),i=yj(n),a=r&&t.attributes&&t.attributes[r.id];if(a&&a.value){let n=a.value;for(let i=0;i<t.length;i++)n[r.getVertexOffset(i)]===e&&this._disablePickingIndex(i);return}let o=i&&t.attributes&&t.attributes[i.id];if(o&&o.value){let n=o.value,r=this.encodePickingColor(e);for(let e=0;e<t.length;e++){let t=i.getVertexOffset(e);n[t]===r[0]&&n[t+1]===r[1]&&n[t+2]===r[2]&&this._disablePickingIndex(e)}}else this._disablePickingIndex(e)}_disablePickingIndex(e){let t=this.getAttributeManager()?.getAttributes()||{},n=vj(t);if(n){let t=n.getVertexOffset(e),r=n.getVertexOffset(e+1),i=new Uint32Array(r-t);i.fill(eT),n.buffer.write(i,t*i.BYTES_PER_ELEMENT);return}let r=yj(t);if(!r){this.internalState&&tT(this.internalState.disabledPickingIndices,e);return}let i=r.getVertexOffset(e),a=r.getVertexOffset(e+1);r.buffer.write(new Uint8Array(a-i),i)}restorePickingColors(){let e=this.getAttributeManager()?.getAttributes()||{},t=_j(e);if(!t){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let n=yj(e);this.internalState.usesPickingColorCache&&n&&n.value.buffer!==gj.buffer&&(n.value=gj.subarray(0,n.value.length)),t.updateSubBuffer({startOffset:0})}_initialize(e){Z(!this.internalState);let t=this.context.viewport;this.context.viewport=e||t;try{hs(lj,this);let t=this._getAttributeManager();this.internalState=new sj({attributeManager:t,layer:this}),this.internalState.viewport=e,this._clearChangeFlags(),this.state={};let n=(this.props.coordinateSystem??`default`)===`default`?this.context.viewport.isGeospatial?`WGS84`:`cartesian`:this.props.coordinateSystem,r=this._sourceCrs===void 0?OS(n):this._sourceCrs;Z(!(r instanceof Promise)),this.internalState.sourceCrs=r,this._updatePreprojection(this.context.viewport),Object.defineProperty(this.state,`attributeManager`,{get:()=>(R.deprecated(`layer.state.attributeManager`,`layer.getAttributeManager()`)(),t)}),this.internalState.uniformTransitions=new _A(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context);for(let e of this.props.extensions)e.initializeState.call(this,this.context,e);this.setChangeFlags({dataChanged:`init`,propsChanged:`init`,viewportChanged:!0,extensionsChanged:!0}),this._update()}finally{this.context.viewport=t}}_transferState(e){hs(fj,this,this===e);let{state:t,internalState:n}=e;if(this===e){this.internalState?.refreshQueryParser();return}this.internalState=n,this.state=t,this.internalState.setAsyncProps(this.props),this.updateAccessorQueries(),this._diffProps(this.props,this.internalState.getOldProps())}_update(){if(!this.internalState||this._coordinateSystemLoading||!this.context.layerManager.isViewportReady(this)||(this._updatePreprojection(this.internalState?.viewport||this.context.viewport),this.updateAccessorQueries(),this.internalState.accessorQueries?.pending))return;let e=this.needsUpdate();if(hs(uj,this,e),!e)return;this.context.stats.get(`Layer updates`).incrementCount();let t=this.props,n=this.context,r=this.internalState,i=n.viewport,a=this._updateUniformTransition();r.propsInTransition=a,n.viewport=r.viewport||i,this.props=a;try{let e=this._getUpdateParams(),t=this.getModels(),i=!DS(e.props.coordinateSystem,e.oldProps.coordinateSystem);if(r.preprojectionChanged||this.internalState.preproject&&(i||!Ke(e.props.modelMatrix,e.oldProps.modelMatrix,1)||!Ke(e.props.coordinateOrigin,e.oldProps.coordinateOrigin,1))){let e=this.getAttributeManager();for(let[t,n]of Object.entries(e?.attributes||{}))n.settings.transformSource===`projection`&&(`transform`in n.settings&&(!n.settings.transform||n.settings.transform===Tj)&&(n.settings.transform=this.usePositionTransforms().transform),e.invalidate(t))}if(n.device)this.updateState(e);else try{this.updateState(e)}catch{}for(let t of this.props.extensions)t.updateState.call(this,e,t);this.setNeedsRedraw(),this._updateAttributes();let a=this.getModels()[0]!==t[0];this._postUpdate(e,a)}finally{n.viewport=i,this.props=t,this._clearChangeFlags(),r.needsUpdate=!1,r.preprojectionChanged=!1,r.resetOldProps()}}_finalize(){hs(dj,this),this.finalizeState(this.context);for(let e of this.props.extensions)e.finalizeState.call(this,this.context,e)}_drawLayer({renderPass:e,shaderModuleProps:t=null,uniforms:n={},parameters:r={}}){if(this.props[mE]&&!this.internalState?.propsInTransition)return;this._updateAttributeTransition();let i=this.props,a=this.context;this.props=this.internalState.propsInTransition||i;try{t&&this.setShaderModuleProps(t);let{getPolygonOffset:i}=this.props,o=i&&i(n)||[0,0];a.device instanceof We&&a.device.setParametersWebGL({polygonOffset:o});let s=a.device instanceof We?null:Cj(r);if(wj(this.getModels(),r,s,o),a.device instanceof We){let{colorMask:i,...o}=r;typeof i==`number`?Object.assign(o,{colorMask:[!!(i&1),!!(i&2),!!(i&4),!!(i&8)]}):i&&Object.assign(o,{colorMask:i}),a.device.withParametersWebGL(o,()=>{let i={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:r,context:a};for(let e of this.props.extensions)e.draw.call(this,i,e);this.draw(i)})}else{let i=e.getParameters();try{e.setParameters(s?.renderPassParameters||{});let i={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:r,context:a};for(let e of this.props.extensions)e.draw.call(this,i,e);this.draw(i)}finally{e.setParameters(i)}}}finally{this.props=i}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(e){if(!this.internalState)return;let{changeFlags:t}=this.internalState;for(let n in e)if(e[n]){let r=!1;switch(n){case`dataChanged`:let i=e[n],a=t[n];i&&Array.isArray(a)&&(t.dataChanged=Array.isArray(i)?a.concat(i):i,r=!0);default:t[n]||(t[n]=e[n],r=!0)}r&&hs(cj,this,n,e)}let n=!!(t.dataChanged||t.updateTriggersChanged||t.propsChanged||t.extensionsChanged);t.propsOrDataChanged=n,t.somethingChanged=n||t.viewportChanged||t.projectionChanged||t.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,projectionChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(e,t){let n={...yA(e,t),projectionChanged:!DS(e.coordinateSystem,t.coordinateSystem)};if(n.updateTriggersChanged)for(let e in n.updateTriggersChanged)n.updateTriggersChanged[e]&&this.invalidateAttribute(e);if(n.transitionsChanged)for(let r in n.transitionsChanged)this.internalState.uniformTransitions.add(r,this.getUniformTransitionValue(r,t[r]),this.getUniformTransitionValue(r,e[r]),e.transitions?.[r]);return this.setChangeFlags(n)}validateProps(){vA(this.props)}updateAutoHighlight(e){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(e)}_updateAutoHighlight(e){let t={highlightedObjectColor:e.picked?e.color:null},{highlightColor:n}=this.props,r=this.internalState;if(r.hoverHighlightInfo=e.picked?{...e}:null,e.picked&&typeof n==`function`){let r=n(e);t.highlightColor=r,t.normalizedHighlightColor=this.usesNormalizedColors()&&Array.isArray(r)}this.setShaderModuleProps({picking:t}),this.setNeedsRedraw()}_getAttributeManager(){let e=this.context;return new iA(e.device,{id:this.props.id,stats:e.stats,timeline:e.timeline})}_postUpdate(e,t){let{props:n,oldProps:r,changeFlags:i}=e,a=this.state.model;a?.isInstanced&&a.setInstanceCount(this.getNumInstances());let{autoHighlight:o,highlightedObjectIndex:s,highlightColor:c}=n,l=this.internalState,u=this.usesNormalizedColors(),d=l.normalizedHighlightColor!==u;l.normalizedHighlightColor=u;let f=!!(i.dataChanged&&l.hoverHighlightInfo);if((t||!o||Number.isInteger(s)||f)&&(l.hoverHighlightInfo=null),t||r.autoHighlight!==o||r.highlightedObjectIndex!==s||r.highlightColor!==c||d||f){let e={},n=l.hoverHighlightInfo,i=typeof c==`function`?n&&c({...n,layer:n.layer?.id===this.id?this:n.layer,sourceLayer:n.sourceLayer?.id===this.id?this:n.sourceLayer}):Array.isArray(c)&&c;i&&(e.highlightColor=i,e.normalizedHighlightColor=u&&Array.isArray(i)&&(typeof c==`function`||i!==bj)),(t||r.autoHighlight!==o||s!==r.highlightedObjectIndex||f)&&(e.highlightedObjectColor=Number.isFinite(s)&&s>=0?this.encodePickingColor(s):null),this.setShaderModuleProps({picking:e})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(e){if(!this.internalState)return!1;let t=!1;t||=this.internalState.needsRedraw&&this.id;let n=this.getAttributeManager(),r=n?n.getNeedsRedraw(e):!1;if(t||=r,t)for(let e of this.props.extensions)e.onNeedsRedraw.call(this,e);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!e.clearRedrawFlags,t}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}};Sj.defaultProps=xj,Sj.layerName=`Layer`;function Cj(e){let{blendConstant:t,...n}=e;return t?{pipelineParameters:n,renderPassParameters:{blendConstant:t}}:{pipelineParameters:n}}function wj(e,t,n,r){for(let i of e)i.device.type===`webgpu`?i.setParameters({...i.parameters,...i.topology.startsWith(`triangle`)&&{depthBias:Math.round(r[1]),depthBiasSlopeScale:r[0]},...n?.pipelineParameters}):i.setParameters(t)}function Tj(e){let t=[e[0],e[1],e[2]??0];this.props.modelMatrix&&Ys(t,t,this.props.modelMatrix);for(let e=0;e<3;e++)t[e]+=this.props.coordinateOrigin[e];return this.internalState.preproject(t)}var Ej=Math.PI/180,Dj=180/Math.PI,Oj=.75,kj=.35,Aj=1.15;function jj(e,t){let n=e*Ej,r=t*Ej,i=Math.sin(n),a=Math.cos(n),o=Math.sin(r),s=Math.cos(r),c=[a,i,0],l=[-i*o,a*o,s],u=[i*s,-a*s,o];return new z([...c,0,...l,0,...u,0,0,0,0,1])}function Mj(){let e=256/uS,t=Math.PI/180*256;return{unitsPerMeter:[e,e,e],unitsPerWorldUnit:[t,t,e]}}var Nj=class extends BT{constructor(e={}){let{longitude:t=0,bearing:n=0,pitch:r=0,zoom:i=0,nearZMultiplier:a=.5,farZMultiplier:o=1}=e,{latitude:s=0,height:c,altitude:l=1.5,fovy:u}=e;s=Math.max(Math.min(s,90),-90),c||=1,u?l=tS(u):u=eS(l);let d=2**(i-gS(Math.max(Math.min(s,Gx),-Gx))),f=r*Ej,p=e.nearZ??a,m=e.farZ??(l+256*2*d/c/Math.max(Math.cos(f),.1))*o,h=new z().lookAt({eye:[0,-l,0],up:[0,0,1]}).rotateX(-f).rotateY(-n*Ej).rotateX(s*Ej).rotateZ(-t*Ej).scale(d/c),g={...e,crs:hS,height:c,viewMatrix:h,longitude:t,latitude:s,zoom:i,modelMatrix:e.position?jj(t,s):null,distanceScales:Mj(),fovy:u,focalDistance:l,near:p,far:m};super(g),this.scale=d,this.latitude=s,this.longitude=t,this.bearing=n,this.pitch=r,this.fovy=u}_getCenter(e,t){return new sc(t).scale(this.distanceScales.unitsPerMeter).add(this.projectPosition([e.longitude??0,e.latitude??0,0]))}get projectionMode(){return B.GLOBE}getDistanceScales(){return this.distanceScales}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,this.height/2],t),r=this.unproject([this.width/2,0],t),i=this.unproject([this.width,this.height/2],t),a=this.unproject([this.width/2,this.height],t);return i[0]<this.longitude&&(i[0]+=360),n[0]>this.longitude&&(n[0]-=360),[Math.min(n[0],i[0],r[0],a[0]),Math.min(n[1],i[1],r[1],a[1]),Math.max(n[0],i[0],r[0],a[0]),Math.max(n[1],i[1],r[1],a[1])]}_getRayToGlobe(e,{topLeft:t=!0,targetZ:n}={}){let[r,i]=e,a=t?i:this.height-i,{pixelUnprojectionMatrix:o}=this,s=Pj(o,[r,a,-1,1]),c=Pj(o,[r,a,1,1]),l=((n||0)/uS+1)*256,u=ic(nc([],s,c)),d=ic(s),f=ic(c);return{rayStartPosition:s,rayEndPosition:c,radius:l,rayLengthSquared:u,rayStartDistanceSquared:d,distanceToCenterSquared:4*((4*d*f-(u-d-f)**2)/16)/u}}_getRayDistanceToGlobeCenterRatio(e,t){let{distanceToCenterSquared:n,radius:r}=this._getRayToGlobe(e,t);return Math.sqrt(Math.max(0,n))/r}getZoomAnchorStrength(e){let t=this._getRayDistanceToGlobeCenterRatio(e);return t>Aj?0:1-Math.max(0,Math.min(1,(t-Oj)/(1-Oj)))*(1-kj)}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[r,i,a]=e,o=t?i:this.height-i,{pixelUnprojectionMatrix:s}=this,c;if(Number.isFinite(a))c=Pj(s,[r,o,a,1]);else{let{rayStartPosition:r,rayEndPosition:i,radius:a,rayLengthSquared:o,rayStartDistanceSquared:s,distanceToCenterSquared:l}=this._getRayToGlobe(e,{topLeft:t,targetZ:n});c=Js([],r,i,(Math.sqrt(s-l)-Math.sqrt(Math.max(0,a*a-l)))/Math.sqrt(o))}let[l,u,d]=this.unprojectPosition(c);return Number.isFinite(a)?[l,u,d]:Number.isFinite(n)?[l,u,n]:[l,u]}projectPosition(e,t={}){if(t.sourceCrs)return this._projectPositionFromCRS(e,t.sourceCrs);let[n,r,i=0]=e,a=n*Ej,o=r*Ej,s=Math.cos(o),c=(i/uS+1)*256;return[Math.sin(a)*s*c,-Math.cos(a)*s*c,Math.sin(o)*c]}unprojectPosition(e){let[t,n,r]=e,i=rc(e),a=Math.asin(r/i);return[Math.atan2(t,-n)*Dj,a*Dj,(i/256-1)*uS]}projectFlat(e){return e}unprojectFlat(e){return e}panByPosition(e,t,n){if(!n){let n=this.getZoomAnchorStrength(t);if(n===0)return{longitude:this.longitude,latitude:this.latitude};let r=this.unproject(t),i=ET(e[0]-r[0]+180,360)-180;return{longitude:this.longitude+i*n,latitude:Math.max(Math.min(this.latitude+(e[1]-r[1])*n,90),-90)}}let[r,i,a]=e,o=.25/2**(this.zoom-gS(this.latitude)),s=r+o*(n[0]-t[0]),c=i-o*(n[1]-t[1]);c=Math.max(Math.min(c,90),-90);let l={longitude:s,latitude:c,zoom:a-gS(i)};return l.zoom+=gS(l.latitude),l}};Nj.displayName=`GlobeViewport`;function Pj(e,t){let n=Oc([],t,e);return Dc(n,n,1/n[3]),n}var Fj={name:`surfaceBuffer`,bindingLayout:[{name:`surfaceBuffer`,group:3}],source:`
struct SurfaceBufferUniforms {
  enabled: i32,
  viewMatrix: mat4x4<f32>,
};
@group(3) @binding(auto) var<uniform> surfaceBuffer: SurfaceBufferUniforms;
fn surfaceBuffer_encode(normal: vec3<f32>, roughness: f32) -> vec4<f32> {
  if (surfaceBuffer.enabled == 2) { return vec4<f32>(1.0); }
  let viewNormal = normalize((surfaceBuffer.viewMatrix * vec4<f32>(normal, 0.0)).xyz);
  return vec4<f32>(viewNormal * 0.5 + 0.5, roughness);
}
`,fs:`
layout(std140) uniform surfaceBufferUniforms {
  int enabled;
  mat4 viewMatrix;
} surfaceBuffer;
vec4 surfaceBuffer_encode(vec3 normal, float roughness) {
  if (surfaceBuffer.enabled == 2) return vec4(1.0);
  vec3 viewNormal = normalize((surfaceBuffer.viewMatrix * vec4(normal, 0.0)).xyz);
  return vec4(viewNormal * 0.5 + 0.5, roughness);
}
`,uniformTypes:{enabled:`i32`,viewMatrix:`mat4x4<f32>`},defaultUniforms:{enabled:0,viewMatrix:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}};function Ij(e,t,n){let r=e.projectPosition([t[0],t[1],t[2]||0]),i=n.map((e,t)=>e-r[t]),a=e.getDistanceScales([...t]);if(e instanceof Nj){let e=Math.hypot(...r),t=r.map(t=>t/e),n=Math.hypot(t[0],t[1]),o=Math.abs(t[2])===1?[1,0,0]:[t[1]/n,-t[0]/n,0],s=[t[1]*o[2]-t[2]*o[1],t[2]*o[0]-t[0]*o[2],t[0]*o[1]-t[1]*o[0]],c=e=>e.reduce((e,t,n)=>e+t*i[n],0);return[-c(o)/a.unitsPerMeter[0],-c(s)/a.unitsPerMeter[1],c(t)/a.unitsPerMeter[2]]}let o=a.unitsPerMeter,{unitsPerMeter2:s=[0,0,0]}=a,c=Math.max(0,o[1]**2+4*s[1]*i[1]),l=2*i[1]/(o[1]+Math.sqrt(c));return[i[0]/(o[0]+s[0]*l),l,i[2]/(o[2]+s[2]*l)]}var Lj=class extends Sj{static layerName=`WaterSurfaceLayer`;static defaultProps={coordinateSystem:`meter-offsets`,getPolygonOffset:()=>[0,0],time:0,style:`classic`,flowDirection:[0,1]};getAttributeManager(){return null}initializeState({device:e}){let t=new cf(e,{shaderAssembler:this.context.shaderAssembler,...this.getShaders({source:Rj,vs:zj,fs:Bj,modules:[Vw,sT,Dl,jl,Fj]}),id:`${this.id}-water`,topology:`triangle-list`,vertexCount:this.props.vertexCount,bufferLayout:[{name:`position`,format:`float32x3`}],attributes:{position:this.props.positions},parameters:{depthCompare:`less-equal`,depthWriteEnabled:!0,cullMode:`none`,blend:!0,blendColorSrcFactor:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`}});this.setState({model:t})}updateState({props:e,oldProps:t}){e.positions!==t.positions&&this.state.model.setAttributes({position:e.positions}),this.state.model.setVertexCount(e.vertexCount)}getModels(){return this.state.model?[this.state.model]:[]}draw({renderPass:e}){let t={...this.state.model.parameters};e.props.framebuffer&&!e.props.framebuffer.depthStencilAttachment?(delete t.depthCompare,delete t.depthWriteEnabled,delete t.depthFormat,delete t.depthBias,delete t.depthBiasSlopeScale,delete t.depthBiasClamp):(t.depthCompare=`less-equal`,t.depthWriteEnabled=!0),this.state.model.setParameters(t);let{skyZenithColor:n,skyUpDirection:r,...i}=this.props.material||{};this.state.model.shaderInputs.setProps({waterMaterial:{...Dl.defaultUniforms,mapping:`uv`,coordinateScale:[.08,.08],opacity:1,...i,time:typeof this.props.time==`function`?this.props.time():this.props.time},riverWaterMaterial:{enabled:this.props.style===`river`?1:0,flowDirection:this.props.flowDirection,skyZenithColor:n??jl.defaultUniforms.skyZenithColor,skyUpDirection:r??jl.defaultUniforms.skyUpDirection},lighting:{enabled:!0,lights:[{type:`ambient`,color:[255,255,255],intensity:.45},{type:`directional`,color:[255,244,218],intensity:.85,direction:[.5,.3,-.8]}]}}),this.state.model.draw(e)}},Rj=`
struct WaterVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) commonPosition: vec3<f32>,
  @location(1) localPosition: vec3<f32>,
  @location(2) commonNormal: vec3<f32>,
};
@vertex fn vertexMain(@location(0) position: vec3<f32>) -> WaterVertex {
  let projected = project_position_to_clipspace_and_commonspace(position, vec3<f32>(0.0), vec3<f32>(0.0));
  var output: WaterVertex;
  output.position = projected.clipPosition;
  geometry.position = projected.commonPosition;
  output.commonPosition = projected.commonPosition.xyz;
  output.localPosition = position;
  output.commonNormal = project_normal(vec3<f32>(0.0, 0.0, 1.0));
  return output;
}
@fragment fn fragmentMain(input: WaterVertex) -> @location(0) vec4<f32> {
  if (surfaceBuffer.enabled > 0) {
    var normal = water_getNormal(input.commonPosition, input.localPosition, input.commonNormal, input.localPosition.xy);
    if (riverWaterMaterial.enabled > 0) {
      normal = riverWater_getNormal(input.commonPosition, input.localPosition, input.commonNormal, input.localPosition.xy);
    }
    return surfaceBuffer_encode(normal, 0.08);
  }
  let pickingColor = picking_getPickingColorFromIndex(0u);
  if (picking.isActive > 0.5) {
    if (picking_isColorZero(pickingColor)) { discard; }
    return vec4<f32>(pickingColor, 1.0);
  }
  var color = water_getColorMapped(project.cameraPosition, input.commonPosition, input.localPosition, input.commonNormal, input.localPosition.xy);
  if (riverWaterMaterial.enabled > 0) {
    color = riverWater_getColorMapped(project.cameraPosition, input.commonPosition, input.localPosition, input.commonNormal, input.localPosition.xy);
  }
  if (picking.isHighlightActive > 0.5 && distance(pickingColor, picking_normalizeColor(picking.highlightedObjectColor)) < 0.00001) {
    color = vec4<f32>(mix(color.rgb, picking.highlightColor.rgb, picking.highlightColor.a), color.a);
  }
  return vec4<f32>(color.rgb, color.a * layer.opacity);
}
`,zj=`#version 300 es
in vec3 position;
out vec3 commonPosition;
out vec3 localPosition;
out vec3 cameraPosition;
out vec3 commonNormal;
void main() {
  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(0.0);
  vec4 commonPosition4;
  gl_Position = project_position_to_clipspace(position, vec3(0.0), vec3(0.0), commonPosition4);
  geometry.position = commonPosition4;
  commonNormal = project_normal(vec3(0.0, 0.0, 1.0));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  commonPosition = commonPosition4.xyz;
  localPosition = position;
  cameraPosition = project.cameraPosition;
  vec4 color = vec4(1.0);
  DECKGL_FILTER_COLOR(color, geometry);
}
`,Bj=`#version 300 es
precision highp float;
in vec3 commonPosition;
in vec3 localPosition;
in vec3 cameraPosition;
in vec3 commonNormal;
out vec4 fragColor;
void main() {
  if (surfaceBuffer.enabled > 0) {
    vec3 normal = water_getNormal(commonPosition, localPosition, commonNormal, localPosition.xy);
    if (riverWaterMaterial.enabled > 0) {
      normal = riverWater_getNormal(commonPosition, localPosition, commonNormal, localPosition.xy);
    }
    fragColor = surfaceBuffer_encode(normal, 0.08);
    return;
  }
  fragColor = water_getColorMapped(cameraPosition, commonPosition, localPosition, commonNormal, localPosition.xy);
  if (riverWaterMaterial.enabled > 0) {
    fragColor = riverWater_getColorMapped(cameraPosition, commonPosition, localPosition, commonNormal, localPosition.xy);
  }
  fragColor.a *= layer.opacity;
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Vj={name:`depthAwareBlur`,source:`struct depthAwareBlurUniforms {
  direction: vec2f,
  radius: f32,
  depthSigma: f32,
  spatialSigma: f32,
};

@group(0) @binding(auto) var<uniform> depthAwareBlur: depthAwareBlurUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn depthAwareBlur_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceDimensions = vec2f(textureDimensions(sourceTexture));
  let texel = depthAwareBlur.direction / sourceDimensions;
  let centerDepth = textureSample(depthTexture, depthTextureSampler, texCoord);
  var color = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  var totalWeight = 1.0;
  for (var index: i32 = 1; index <= 8; index++) {
    if (f32(index) > depthAwareBlur.radius) { break; }
    let offset = texel * f32(index);
    for (var side: i32 = -1; side <= 1; side += 2) {
      let sampleUv = clamp(texCoord + offset * f32(side), vec2f(0.0), vec2f(1.0));
      let sampleDepth = textureSample(depthTexture, depthTextureSampler, sampleUv);
      let spatialWeight = exp(-f32(index * index) / max(2.0 * depthAwareBlur.spatialSigma * depthAwareBlur.spatialSigma, 0.0001));
      let depthDelta = abs(sampleDepth - centerDepth);
      let depthWeight = exp(-(depthDelta * depthDelta) / max(2.0 * depthAwareBlur.depthSigma * depthAwareBlur.depthSigma, 0.000001));
      let weight = spatialWeight * depthWeight;
      color += textureSample(sourceTexture, sourceTextureSampler, sampleUv) * weight;
      totalWeight += weight;
    }
  }
  return color / totalWeight;
}
`,bindingLayout:[{name:`depthTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{direction:`vec2<f32>`,radius:`f32`,depthSigma:`f32`,spatialSigma:`f32`},propTypes:{direction:{value:[1,0]},radius:{value:4,min:1,max:8},depthSigma:{value:.01,min:1e-4,softMax:.1},spatialSigma:{value:3,min:.1,softMax:8}},passes:[{sampler:!0}]},Hj=`fn advancedSceneUV(uv: vec2f) -> vec2f {
  return uv;
}

fn advancedLinearDepth(depth: f32, nearPlane: f32, farPlane: f32) -> f32 {
  return (nearPlane * farPlane) / max(farPlane - depth * (farPlane - nearPlane), 0.0001);
}

fn advancedDepthNormal(depthTexture: texture_depth_2d, depthTextureSampler: sampler, uv: vec2f) -> vec3f {
  let dimensions = vec2i(textureDimensions(depthTexture));
  let coordinate = clamp(vec2i(uv * vec2f(dimensions)), vec2i(0), dimensions - vec2i(1));
  let center = textureLoad(depthTexture, coordinate, 0);
  let right = textureLoad(depthTexture, min(coordinate + vec2i(1, 0), dimensions - vec2i(1)), 0);
  let up = textureLoad(depthTexture, min(coordinate + vec2i(0, 1), dimensions - vec2i(1)), 0);
  return normalize(vec3f((center - right) * f32(dimensions.x), (center - up) * f32(dimensions.y), 1.0));
}
`,Uj=`
fn temporal_getTexelCoordinate(coordinate: vec2f, dimensions: vec2u) -> vec2i {
  return clamp(vec2i(coordinate * vec2f(dimensions)), vec2i(0), vec2i(dimensions) - vec2i(1));
}

fn temporal_getClipPosition(coordinate: vec2f, depth: f32) -> vec4f {
  return vec4f(coordinate * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0), depth, 1.0);
}

// Returns previous UV, device depth, and validity. Matrices use WebGPU clip depth.
fn temporal_getPreviousFrame(previousClip: vec4f, jitter: vec2f, epsilon: f32) -> vec4f {
  if (previousClip.w <= epsilon) { return vec4f(0.0); }
  let position = previousClip.xyz / previousClip.w;
  let coordinate = position.xy * vec2f(0.5, -0.5) + vec2f(0.5) + jitter;
  let valid = all(coordinate >= vec2f(0.0)) && all(coordinate <= vec2f(1.0)) &&
    position.z >= 0.0 && position.z <= 1.0;
  return vec4f(coordinate, position.z, select(0.0, 1.0, valid));
}

fn temporal_getViewDepth(
  coordinate: vec2f, depth: f32, inverseProjection: mat4x4f, epsilon: f32
) -> f32 {
  let position = inverseProjection * temporal_getClipPosition(coordinate, depth);
  return abs(position.z / max(abs(position.w), epsilon));
}

struct TemporalColorBounds { minimum: vec4f, maximum: vec4f };
fn temporal_getColorBounds(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler,
  coordinate: vec2f, current: vec4f
) -> TemporalColorBounds {
  let texel = 1.0 / vec2f(textureDimensions(sourceTexture));
  var minimum = current;
  var maximum = current;
  for (var vertical = -1; vertical <= 1; vertical++) {
    for (var horizontal = -1; horizontal <= 1; horizontal++) {
      let sampleCoordinate = clamp(coordinate + vec2f(f32(horizontal), f32(vertical)) * texel,
        vec2f(0.0), vec2f(1.0));
      let sample = textureSampleLevel(sourceTexture, sourceTextureSampler, sampleCoordinate, 0);
      minimum = min(minimum, sample);
      maximum = max(maximum, sample);
    }
  }
  return TemporalColorBounds(minimum, maximum);
}

struct TemporalHistoryFootprint { base: vec2i, fraction: vec2f, dimensions: vec2u };
struct TemporalHistoryTap { coordinate: vec2i, normalizedCoordinate: vec2f, weight: f32 };
fn temporal_getHistoryFootprint(coordinate: vec2f, dimensions: vec2u) -> TemporalHistoryFootprint {
  let position = coordinate * vec2f(dimensions) - vec2f(0.5);
  return TemporalHistoryFootprint(vec2i(floor(position)), fract(position), dimensions);
}
fn temporal_getHistoryTap(footprint: TemporalHistoryFootprint, offset: vec2i) -> TemporalHistoryTap {
  let coordinate = clamp(footprint.base + offset, vec2i(0), vec2i(footprint.dimensions) - vec2i(1));
  let horizontalWeight = select(1.0 - footprint.fraction.x, footprint.fraction.x, offset.x == 1);
  let verticalWeight = select(1.0 - footprint.fraction.y, footprint.fraction.y, offset.y == 1);
  return TemporalHistoryTap(coordinate,
    (vec2f(coordinate) + vec2f(0.5)) / vec2f(footprint.dimensions), horizontalWeight * verticalWeight);
}
`,Wj={name:`ssaoEvaluate`,source:`\
${Hj}
struct ssaoEvaluateUniforms {
  nearPlane: f32,
  farPlane: f32,
  radius: f32,
  bias: f32,
  intensity: f32,
  useNormalTexture: f32,
};
@group(0) @binding(auto) var<uniform> ssaoEvaluate: ssaoEvaluateUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn ssaoEvaluate_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let sceneCoord = advancedSceneUV(texCoord);
  let depth = textureSample(depthTexture, depthTextureSampler, sceneCoord);
  let dimensions = vec2f(textureDimensions(depthTexture));
  let linearDepth = advancedLinearDepth(depth, ssaoEvaluate.nearPlane, ssaoEvaluate.farPlane);
  let reconstructedNormal = advancedDepthNormal(depthTexture, depthTextureSampler, sceneCoord);
  let textureNormal = normalize(textureSample(normalTexture, normalTextureSampler, sceneCoord).xyz * 2.0 - 1.0);
  let normal = normalize(mix(reconstructedNormal, textureNormal, ssaoEvaluate.useNormalTexture));
  let angle = fract(sin(dot(texCoord * dimensions, vec2f(12.9898, 78.233))) * 43758.5453) * 6.2831853;
  var occlusion = 0.0;
  for (var index: i32 = 0; index < 12; index++) {
    let sampleAngle = angle + f32(index) * 2.399963;
    let sampleRadius = (0.25 + 0.75 * f32(index + 1) / 12.0) * ssaoEvaluate.radius;
    let direction = vec2f(cos(sampleAngle), sin(sampleAngle));
    let sampleUv = clamp(texCoord + direction * sampleRadius / dimensions, vec2f(0.0), vec2f(1.0));
    let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, advancedSceneUV(sampleUv), 0);
    let sampleLinearDepth = advancedLinearDepth(sampleDepth, ssaoEvaluate.nearPlane, ssaoEvaluate.farPlane);
    let rangeWeight = smoothstep(ssaoEvaluate.radius * 2.0, 0.0, abs(sampleLinearDepth - linearDepth));
    let horizonWeight = max(dot(normal, normalize(vec3f(direction, 0.35))), 0.15);
    occlusion += select(0.0, rangeWeight * horizonWeight, sampleLinearDepth + ssaoEvaluate.bias < linearDepth);
  }
  let ambient = select(clamp(1.0 - occlusion / 12.0 * ssaoEvaluate.intensity, 0.0, 1.0), 1.0, depth >= 0.99999);
  return vec4f(vec3f(ambient), 1.0);
}
`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{nearPlane:`f32`,farPlane:`f32`,radius:`f32`,bias:`f32`,intensity:`f32`,useNormalTexture:`f32`},propTypes:{nearPlane:{value:.1},farPlane:{value:200},radius:{value:7,min:1,softMax:32},bias:{value:.03,min:0,softMax:.2},intensity:{value:1.35,min:0,softMax:4},useNormalTexture:{value:0,min:0,max:1,private:!0}},passes:[{sampler:!0}]};function Gj(e={}){let t=e.resolutionScale??1,n=e.normalSource===`normal-texture`?1:0,r={sourceTexture:`previous`};return n||(r.normalTexture=`previous`),{name:`ssaoCompositeShaderPass`,renderTargets:{ssaoRaw:{scale:[t,t],format:`rgba8unorm`},ssaoScratch:{scale:[t,t],format:`rgba8unorm`},ssaoBlurred:{scale:[t,t],format:`rgba8unorm`}},steps:[{shaderPass:Wj,inputs:r,output:`ssaoRaw`,uniforms:{useNormalTexture:n}},{shaderPass:Vj,inputs:{sourceTexture:`ssaoRaw`},output:`ssaoScratch`,uniforms:{direction:[1,0]}},{shaderPass:Vj,inputs:{sourceTexture:`ssaoScratch`},output:`ssaoBlurred`,uniforms:{direction:[0,1]}},{shaderPass:Kj,inputs:{sourceTexture:`previous`,ambientOcclusionTexture:`ssaoBlurred`},output:`previous`}]}}var Kj={name:`ssaoComposite`,source:`struct ssaoCompositeUniforms {
  debugMode: f32,
};
@group(0) @binding(auto) var<uniform> ssaoComposite: ssaoCompositeUniforms;
@group(0) @binding(auto) var ambientOcclusionTexture: texture_2d<f32>;
@group(0) @binding(auto) var ambientOcclusionTextureSampler: sampler;
fn ssaoComposite_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let color = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let ambient = textureSample(ambientOcclusionTexture, ambientOcclusionTextureSampler, texCoord).r;
  if (ssaoComposite.debugMode > 0.5) { return vec4f(vec3f(ambient), 1.0); }
  let rawOcclusion = clamp(1.0 - ambient, 0.0, 1.0);
  let contactOcclusion = smoothstep(0.03, 0.5, rawOcclusion);
  return vec4f(color.rgb * (1.0 - contactOcclusion * 0.48), color.a);
}`,bindingLayout:[{name:`ambientOcclusionTexture`,group:0}],uniformTypes:{debugMode:`f32`},propTypes:{debugMode:{value:0,min:0,max:1,private:!0}},passes:[{sampler:!0}]},qj={minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},Jj={minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},Yj=new Set([`color`,`normalRoughness`,`velocity`,`depth`]),Xj=new Set([`rgba8unorm`,`rgba8unorm-srgb`,`rgba8snorm`,`bgra8unorm`,`bgra8unorm-srgb`,`rgb10a2uint`,`rgb10a2unorm`,`rg11b10ufloat`]),Zj=0,Qj=class{device;id;props;renderTargets;constructor(e,t){if(e.type!==`webgpu`)throw Error(`GBuffer requires a WebGPU device.`);this.device=e,this.id=t.id||lM(`g-buffer`),this.props=$j(this.id,t),eM(e,this.props),this.renderTargets=oM(e,this.props)}get framebuffer(){return this.renderTargets.framebuffer}get colorTexture(){return this.renderTargets.colorTexture}get normalRoughnessTexture(){return this.renderTargets.normalRoughnessTexture}get velocityTexture(){let e=this.renderTargets.velocityTexture;if(!e)throw Error(`GBuffer velocity attachment is disabled.`);return e}get depthTexture(){return this.renderTargets.depthTexture}get width(){return this.renderTargets.framebuffer.width}get height(){return this.renderTargets.framebuffer.height}getShaderPassBindings(){return{depthTexture:this.depthTexture,normalTexture:this.normalRoughnessTexture,velocityTexture:this.velocityTexture}}getExtraColorTexture(e){let t=this.renderTargets.extraColorTextures.get(e);if(!t)throw Error(`GBuffer has no extra color attachment named "`+e+`".`);return t}resize(e){if(rM(e.width,e.height),e.width===this.width&&e.height===this.height)return!1;let t=this.renderTargets;return this.renderTargets=oM(this.device,{...this.props,width:e.width,height:e.height}),cM(t),!0}destroy(){cM(this.renderTargets)}};function $j(e,t){return{id:e,width:t.width,height:t.height,colorFormat:t.colorFormat||`rgba8unorm`,normalRoughnessFormat:t.normalRoughnessFormat||`rgba8unorm`,velocity:t.velocity??!0,velocityFormat:t.velocityFormat||`rg16float`,depthStencilFormat:t.depthStencilFormat||`depth24plus`,extraColorAttachments:t.extraColorAttachments||[]}}function eM(e,t){rM(t.width,t.height);let n=[t.colorFormat,t.normalRoughnessFormat,...t.velocity?[t.velocityFormat]:[],...t.extraColorAttachments.map(e=>e.format)],r=n.length;if(r>e.limits.maxColorAttachments)throw Error(`GBuffer requires `+r+` color attachments, but the device supports `+e.limits.maxColorAttachments+`.`);iM(e,t.colorFormat,`color`),iM(e,t.normalRoughnessFormat,`normalRoughness`),t.velocity&&iM(e,t.velocityFormat,`velocity`),aM(e,t.depthStencilFormat,`depth`);let i=new Set;for(let n of t.extraColorAttachments){if(!n.name)throw Error(`GBuffer extra color attachment name is required.`);if(Yj.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is reserved.`);if(i.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is duplicated.`);i.add(n.name),iM(e,n.format,n.name)}let a=tM(e,n);if(a>e.limits.maxColorAttachmentBytesPerSample)throw Error(`GBuffer color attachments require `+a+` bytes per sample, but the device supports `+e.limits.maxColorAttachmentBytesPerSample+`.`)}function tM(e,t){let n=0;for(let r of t){let t=nM(r);n=Math.ceil(n/t)*t;let i=e.getTextureFormatInfo(r).bytesPerPixel;n+=Xj.has(r)?8:i}return n}function nM(e){return e.startsWith(`r8`)||e.startsWith(`rg8`)||e.startsWith(`rgba8`)||e.startsWith(`bgra8`)?1:e.startsWith(`r16`)||e.startsWith(`rg16`)||e.startsWith(`rgba16`)?2:4}function rM(e,t){if(!Number.isSafeInteger(e)||!Number.isSafeInteger(t)||e<=0||t<=0)throw Error(`GBuffer size must use positive safe integer dimensions.`)}function iM(e,t,n){if(!e.getTextureFormatCapabilities(t).render)throw Error(`GBuffer attachment "`+n+`" requires renderable format `+t+`.`)}function aM(e,t,n){if(!e.getTextureFormatCapabilities(t).create)throw Error(`GBuffer attachment "`+n+`" requires supported format `+t+`.`)}function oM(e,t){let n=sM(e,t,`color`,t.colorFormat),r=sM(e,t,`normal-roughness`,t.normalRoughnessFormat),i=t.velocity?sM(e,t,`velocity`,t.velocityFormat):void 0,a=new Map(t.extraColorAttachments.map(n=>[n.name,sM(e,t,n.name,n.format,n.sampler)])),o=e.createTexture({id:t.id+`-depth`,format:t.depthStencilFormat,width:t.width,height:t.height,usage:L.SAMPLE|L.RENDER|L.COPY_DST,sampler:Jj});return{framebuffer:e.createFramebuffer({id:t.id+`-framebuffer`,width:t.width,height:t.height,colorAttachments:[n,r,...i?[i]:[],...a.values()],depthStencilAttachment:o}),colorTexture:n,normalRoughnessTexture:r,velocityTexture:i,depthTexture:o,extraColorTextures:a}}function sM(e,t,n,r,i=qj){return e.createTexture({id:t.id+`-`+n,format:r,width:t.width,height:t.height,usage:L.SAMPLE|L.RENDER|L.COPY_DST,sampler:i})}function cM(e){e.framebuffer.destroy(),e.colorTexture.destroy(),e.normalRoughnessTexture.destroy(),e.velocityTexture?.destroy(),e.depthTexture.destroy();for(let t of e.extraColorTextures.values())t.destroy()}function lM(e){return Zj+=1,e+`-`+Zj}var uM={name:`toneMapping`,source:`struct toneMappingUniforms {
  exposure: f32,
  maximumLuminance: f32,
};

@group(0) @binding(auto) var<uniform> toneMapping: toneMappingUniforms;

fn toneMapping_filterColor_ext(color: vec4f, texSize: vec2f, texCoords: vec2f) -> vec4f {
  let exposedColor = max(color.rgb * toneMapping.exposure, vec3f(0.0));
  let numerator = exposedColor * (2.51 * exposedColor + vec3f(0.03));
  let denominator = exposedColor * (2.43 * exposedColor + vec3f(0.59)) + vec3f(0.14);
  let maximumLuminance = max(toneMapping.maximumLuminance, 1.0);
  let sceneLuminance = max(exposedColor.r, max(exposedColor.g, exposedColor.b));
  let highlightWeight = smoothstep(0.72, 1.7, sceneLuminance);
  let extendedScale = mix(1.0, maximumLuminance, highlightWeight);
  let mappedColor = clamp(
    numerator / denominator * extendedScale,
    vec3f(0.0),
    vec3f(maximumLuminance)
  );
  return vec4f(mappedColor, color.a);
}
`,fs:`layout(std140) uniform toneMappingUniforms {
  float exposure;
  float maximumLuminance;
} toneMapping;

vec4 toneMapping_filterColor_ext(vec4 color, vec2 texSize, vec2 texCoords) {
  vec3 exposedColor = max(color.rgb * toneMapping.exposure, vec3(0.0));
  vec3 numerator = exposedColor * (2.51 * exposedColor + vec3(0.03));
  vec3 denominator = exposedColor * (2.43 * exposedColor + vec3(0.59)) + vec3(0.14);
  float maximumLuminance = max(toneMapping.maximumLuminance, 1.0);
  float sceneLuminance = max(exposedColor.r, max(exposedColor.g, exposedColor.b));
  float highlightWeight = smoothstep(0.72, 1.7, sceneLuminance);
  float extendedScale = mix(1.0, maximumLuminance, highlightWeight);
  vec3 mappedColor = clamp(
    numerator / denominator * extendedScale,
    vec3(0.0),
    vec3(maximumLuminance)
  );
  return vec4(mappedColor, color.a);
}
`,props:{},uniforms:{},uniformTypes:{exposure:`f32`,maximumLuminance:`f32`},defaultUniforms:{exposure:1,maximumLuminance:1},propTypes:{exposure:{format:`f32`,value:1,min:0,max:10},maximumLuminance:{format:`f32`,value:1,min:1,max:4}},passes:[{filter:!0}]},dM={name:`screenSpaceOutline`,source:`\
struct screenSpaceOutlineUniforms {
  color: vec4f,
  thickness: f32,
  depthThreshold: f32,
  normalThreshold: f32,
  useNormalTexture: f32,
};
@group(0) @binding(auto) var<uniform> screenSpaceOutline: screenSpaceOutlineUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
${Hj}
fn screenSpaceOutline_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let texel = screenSpaceOutline.thickness / vec2f(textureDimensions(depthTexture));
  let centerSceneUv = advancedSceneUV(texCoord);
  let centerDepth = textureSample(depthTexture, depthTextureSampler, centerSceneUv);
  let centerReconstructed = advancedDepthNormal(depthTexture, depthTextureSampler, centerSceneUv);
  let centerTextureNormal = normalize(textureSample(normalTexture, normalTextureSampler, centerSceneUv).xyz * 2.0 - 1.0);
  let centerNormal = normalize(mix(centerReconstructed, centerTextureNormal, screenSpaceOutline.useNormalTexture));
  var depthEdge = 0.0;
  var normalEdge = 0.0;
  let offsets = array<vec2f, 4>(vec2f(texel.x, 0.0), vec2f(-texel.x, 0.0), vec2f(0.0, texel.y), vec2f(0.0, -texel.y));
  for (var index: i32 = 0; index < 4; index++) {
    let sampleUv = clamp(texCoord + offsets[index], vec2f(0.0), vec2f(1.0));
    let sampleSceneUv = advancedSceneUV(sampleUv);
    let sampleDepth = textureSample(depthTexture, depthTextureSampler, sampleSceneUv);
    depthEdge = max(depthEdge, abs(sampleDepth - centerDepth));
    let reconstructed = advancedDepthNormal(depthTexture, depthTextureSampler, sampleSceneUv);
    let textureNormal = normalize(textureSample(normalTexture, normalTextureSampler, sampleSceneUv).xyz * 2.0 - 1.0);
    let sampleNormal = normalize(mix(reconstructed, textureNormal, screenSpaceOutline.useNormalTexture));
    normalEdge = max(normalEdge, 1.0 - max(dot(centerNormal, sampleNormal), 0.0));
  }
  let edge = max(smoothstep(screenSpaceOutline.depthThreshold, screenSpaceOutline.depthThreshold * 2.0, depthEdge),
                 smoothstep(screenSpaceOutline.normalThreshold, screenSpaceOutline.normalThreshold * 2.0, normalEdge));
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  return mix(sourceColor, screenSpaceOutline.color, edge * screenSpaceOutline.color.a);
}`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0}],uniforms:{},uniformTypes:{color:`vec4<f32>`,thickness:`f32`,depthThreshold:`f32`,normalThreshold:`f32`,useNormalTexture:`f32`},propTypes:{color:{value:[.02,.08,.12,.48]},thickness:{value:1.5,min:.5,softMax:5},depthThreshold:{value:.003,min:1e-4,softMax:.05},normalThreshold:{value:.18,min:.01,softMax:1},useNormalTexture:{value:0,min:0,max:1,private:!0}},passes:[{sampler:!0}]};function fM(e={}){let t=e.normalSource===`normal-texture`?1:0,n={sourceTexture:`previous`};return t||(n.normalTexture=`previous`),{name:`outlineCompositeShaderPass`,steps:[{shaderPass:dM,inputs:n,output:`previous`,uniforms:{useNormalTexture:t}}]}}var pM=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],mM={name:`ssrCameraTemporal`,source:`
${Uj}
struct SSRCameraTemporalUniforms {
  currentClipToPreviousClip: mat4x4f,
  currentViewToPreviousView: mat4x4f,
  previousInverseProjectionMatrix: mat4x4f,
  historyWeight: f32,
  depthThreshold: f32,
  normalThreshold: f32,
};
@group(0) @binding(auto) var<uniform> ssrCameraTemporal: SSRCameraTemporalUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousNormalTexture: texture_2d<f32>;

fn ssrCameraTemporal_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler,
  texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let current = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let currentDepth = textureLoad(depthTexture,
    temporal_getTexelCoordinate(texCoord, textureDimensions(depthTexture)), 0);
  if (currentDepth >= 0.99999 || ssrCameraTemporal.historyWeight <= 0.0) {return current;}
  let previousClip = ssrCameraTemporal.currentClipToPreviousClip *
    temporal_getClipPosition(texCoord, currentDepth);
  let previousFrame = temporal_getPreviousFrame(previousClip, vec2f(0.0), 0.000001);
  if (previousFrame.w < 0.5 || previousFrame.z >= 1.0) {return current;}
  let previousCoordinate = previousFrame.xy;
  let currentSurface = textureLoad(normalTexture,
    temporal_getTexelCoordinate(texCoord, textureDimensions(normalTexture)), 0);
  let expectedNormal = normalize((ssrCameraTemporal.currentViewToPreviousView *
    vec4f(currentSurface.xyz * 2.0 - 1.0, 0.0)).xyz);
  let expectedDepth = temporal_getViewDepth(previousCoordinate, previousFrame.z,
    ssrCameraTemporal.previousInverseProjectionMatrix, 0.000001);
  let footprint = temporal_getHistoryFootprint(previousCoordinate, textureDimensions(historyTexture));
  var accumulatedHistory = vec4f(0.0);
  var accumulatedWeight = 0.0;
  // Validate each bilinear tap before mixing to avoid borrowing a foreground edge's history.
  for (var vertical = 0; vertical < 2; vertical++) {
    for (var horizontal = 0; horizontal < 2; horizontal++) {
      let tap = temporal_getHistoryTap(footprint, vec2i(horizontal, vertical));
      let tapCoordinate = tap.normalizedCoordinate;
      let packedDepth = textureLoad(previousDepthTexture,
        temporal_getTexelCoordinate(tapCoordinate, textureDimensions(previousDepthTexture)), 0).rgb;
      let depth = dot(round(packedDepth * 255.0), vec3f(65536.0, 256.0, 1.0)) / 16777215.0;
      let surface = textureLoad(previousNormalTexture,
        temporal_getTexelCoordinate(tapCoordinate, textureDimensions(previousNormalTexture)), 0);
      let normal = normalize(surface.xyz * 2.0 - 1.0);
      let depthDifference = abs(temporal_getViewDepth(tapCoordinate, depth,
        ssrCameraTemporal.previousInverseProjectionMatrix, 0.000001) - expectedDepth) /
        max(expectedDepth, 0.000001);
      let valid = depth < 0.99999 && depthDifference <= ssrCameraTemporal.depthThreshold &&
        dot(normal, expectedNormal) >= ssrCameraTemporal.normalThreshold &&
        abs(surface.a - currentSurface.a) < 0.05;
      let weight = select(0.0, tap.weight, valid);
      accumulatedHistory += textureLoad(historyTexture, tap.coordinate, 0) * weight;
      accumulatedWeight += weight;
    }
  }
  if (accumulatedWeight <= 0.000001) {return current;}
  let history = accumulatedHistory / accumulatedWeight;
  let bounds = temporal_getColorBounds(sourceTexture, sourceTextureSampler, texCoord, current);
  // Missing rays may retain confidence briefly, but never increase it without current support.
  let weight = clamp(ssrCameraTemporal.historyWeight, 0.0, 0.97);
  if (bounds.maximum.a <= 0.001) {return vec4f(history.rgb, history.a * weight);}
  return mix(current, clamp(history, bounds.minimum, bounds.maximum), weight);
}
`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0},{name:`historyTexture`,group:0},{name:`previousDepthTexture`,group:0},{name:`previousNormalTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{currentClipToPreviousClip:`mat4x4<f32>`,currentViewToPreviousView:`mat4x4<f32>`,previousInverseProjectionMatrix:`mat4x4<f32>`,historyWeight:`f32`,depthThreshold:`f32`,normalThreshold:`f32`},propTypes:{currentClipToPreviousClip:{value:pM,private:!0},currentViewToPreviousView:{value:pM,private:!0},previousInverseProjectionMatrix:{value:pM,private:!0},historyWeight:{value:.8,min:0,max:.97},depthThreshold:{value:.01,min:1e-4,max:.1},normalThreshold:{value:.96,min:-1,max:1}},passes:[{sampler:!0}]},hM={name:`ssrNormalHistoryCopy`,source:`
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
fn ssrNormalHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler,
  texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let dimensions = textureDimensions(normalTexture);
  let coordinate = clamp(vec2i(texCoord * vec2f(dimensions)), vec2i(0), vec2i(dimensions) - vec2i(1));
  return textureLoad(normalTexture, coordinate, 0);
}`,bindingLayout:[{name:`normalTexture`,group:0}],passes:[{sampler:!0}]},gM={name:`ssrCameraDepthHistoryCopy`,source:`
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
fn ssrCameraDepthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler,
  texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let dimensions = textureDimensions(depthTexture);
  let coordinate = clamp(vec2i(texCoord * vec2f(dimensions)), vec2i(0), vec2i(dimensions) - vec2i(1));
  let depth = textureLoad(depthTexture, coordinate, 0);
  let packed = u32(round(clamp(depth, 0.0, 1.0) * 16777215.0));
  return vec4f(vec3f(f32((packed >> 16u) & 255u), f32((packed >> 8u) & 255u), f32(packed & 255u)) / 255.0, 1.0);
}`,bindingLayout:[{name:`depthTexture`,group:0}],passes:[{sampler:!0}]},_M={fast:{resolutionScale:.25,sampleCount:32,maxRadius:3,historyWeight:.9},balanced:{resolutionScale:.5,sampleCount:96,maxRadius:2,historyWeight:.8},detailed:{resolutionScale:1,sampleCount:96,maxRadius:2,historyWeight:.8}},vM=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],yM={name:`ssrTrace`,source:`const SSR_TWO_PI: f32 = 6.283185307179586;

struct SSRTraceUniforms {
  projectionMatrix: mat4x4f,
  inverseProjectionMatrix: mat4x4f,
  intensity: f32,
  maxDistance: f32,
  thickness: f32,
  sampleCount: f32,
  maxRoughness: f32,
  frameIndex: f32,
};

@group(0) @binding(auto) var<uniform> ssrTrace: SSRTraceUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn ssrTrace_reconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let viewPosition = ssrTrace.inverseProjectionMatrix * clip;
  return viewPosition.xyz / max(viewPosition.w, 0.00001);
}

fn ssrTrace_projectViewPosition(position: vec3f) -> vec2f {
  let clip = ssrTrace.projectionMatrix * vec4f(position, 1.0);
  let normalizedDeviceCoordinate = clip.xy / max(clip.w, 0.00001);
  return vec2f(
    normalizedDeviceCoordinate.x * 0.5 + 0.5,
    0.5 - normalizedDeviceCoordinate.y * 0.5
  );
}

fn ssrTrace_hash(value: vec2f, frameIndex: f32) -> f32 {
  let temporalPhase = fract(frameIndex * 0.61803398875) * SSR_TWO_PI;
  return fract(sin(dot(value, vec2f(12.9898, 78.233)) + temporalPhase) * 43758.5453);
}

fn ssrTrace_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  let normalRoughness = textureSampleLevel(normalTexture, normalTextureSampler, sceneCoord, 0);
  let normal = normalize(normalRoughness.xyz * 2.0 - 1.0);
  let roughness = clamp(normalRoughness.a, 0.0, 1.0);
  let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, sceneCoord, 0);
  if (centerDepth >= 0.99999 || roughness >= ssrTrace.maxRoughness ||
      ssrTrace.intensity <= 0.0001) {
    return vec4f(0.0);
  }

  let viewPosition = ssrTrace_reconstructViewPosition(sceneCoord, centerDepth);
  let incidentDirection = normalize(viewPosition);
  let mirrorDirection = normalize(reflect(incidentDirection, normal));
  let pixelCoordinate = floor(sceneCoord * vec2f(textureDimensions(depthTexture)));
  let noise = ssrTrace_hash(pixelCoordinate, ssrTrace.frameIndex);
  let noiseAngle = noise * SSR_TWO_PI;
  let referenceAxis = select(
    vec3f(0.0, 1.0, 0.0),
    vec3f(1.0, 0.0, 0.0),
    abs(mirrorDirection.y) > 0.9
  );
  let tangent = normalize(cross(referenceAxis, mirrorDirection));
  let bitangent = normalize(cross(mirrorDirection, tangent));
  let roughnessCone = roughness * roughness * 0.32;
  let reflectedRay = normalize(
    mirrorDirection + (tangent * cos(noiseAngle) + bitangent * sin(noiseAngle)) * roughnessCone
  );
  let rayOrigin = viewPosition + normal * max(ssrTrace.thickness * 0.12, 0.025);

  var reflection = vec3f(0.0);
  var confidence = 0.0;
  var previousTravel = 0.06;
  var previousDepthDelta = -ssrTrace.thickness;
  let minimumSampleCount = ceil(
    ssrTrace.maxDistance / max(ssrTrace.thickness * 0.72, 0.12)
  );
  let effectiveSampleCount = min(96.0, max(ssrTrace.sampleCount, minimumSampleCount));
  for (var sampleIndex: i32 = 1; sampleIndex <= 96; sampleIndex++) {
    if (f32(sampleIndex) > effectiveSampleCount) {
      break;
    }
    let fraction = (f32(sampleIndex) - noise * 0.42) / max(effectiveSampleCount, 1.0);
    let travel = 0.08 + pow(max(fraction, 0.0), 1.3) * ssrTrace.maxDistance;
    let rayPosition = rayOrigin + reflectedRay * travel;
    if (rayPosition.z >= -0.04) {
      break;
    }
    let sampleCoord = ssrTrace_projectViewPosition(rayPosition);
    if (any(sampleCoord <= vec2f(0.0)) || any(sampleCoord >= vec2f(1.0))) {
      break;
    }
    let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleCoord, 0);
    if (sampleDepth >= 0.99999) {
      previousTravel = travel;
      previousDepthDelta = -ssrTrace.thickness;
      continue;
    }
    let scenePosition = ssrTrace_reconstructViewPosition(sampleCoord, sampleDepth);
    let depthDelta = (-rayPosition.z) - (-scenePosition.z);
    let rayStepLength = max(travel - previousTravel, 0.001);
    let hitThickness = max(ssrTrace.thickness, rayStepLength * 1.2) + travel * 0.008;
    let crossesCandidateSurface = previousDepthDelta <= 0.0 && depthDelta >= 0.0;
    let screenTravelPixels = length((sampleCoord - sceneCoord) * texSize);
    var entersCandidateSurface = true;
    if (crossesCandidateSurface && depthDelta < hitThickness && screenTravelPixels > 1.25) {
      let candidateNormal = normalize(
        textureSampleLevel(normalTexture, normalTextureSampler, sampleCoord, 0).rgb * 2.0 - 1.0
      );
      entersCandidateSurface = dot(reflectedRay, candidateNormal) < -0.015;
      if (entersCandidateSurface) {
        var nearTravel = previousTravel;
        var farTravel = travel;
        var hitCoord = sampleCoord;
        for (var refinementIndex: i32 = 0; refinementIndex < 5; refinementIndex++) {
          let refinedTravel = (nearTravel + farTravel) * 0.5;
          let refinedPosition = rayOrigin + reflectedRay * refinedTravel;
          let refinedCoord = ssrTrace_projectViewPosition(refinedPosition);
          let refinedDepth = textureSampleLevel(depthTexture, depthTextureSampler, refinedCoord, 0);
          let refinedScenePosition = ssrTrace_reconstructViewPosition(refinedCoord, refinedDepth);
          if ((-refinedPosition.z) - (-refinedScenePosition.z) >= 0.0) {
            farTravel = refinedTravel;
            hitCoord = refinedCoord;
          } else {
            nearTravel = refinedTravel;
          }
        }
        reflection = textureSampleLevel(sourceTexture, sourceTextureSampler, hitCoord, 0).rgb;
        let screenEdge = min(
          min(hitCoord.x, hitCoord.y),
          min(1.0 - hitCoord.x, 1.0 - hitCoord.y)
        );
        let fresnel = mix(
          0.32,
          1.0,
          pow(1.0 - max(dot(-incidentDirection, normal), 0.0), 5.0)
        );
        let roughnessFade = pow(1.0 - roughness / max(ssrTrace.maxRoughness, 0.001), 1.5);
        let distanceFade = 1.0 - clamp(farTravel / ssrTrace.maxDistance, 0.0, 1.0);
        confidence = smoothstep(0.0, 0.09, screenEdge) * roughnessFade * fresnel *
          distanceFade * ssrTrace.intensity;
        break;
      }
    }
    previousTravel = travel;
    previousDepthDelta = select(-ssrTrace.thickness, depthDelta, entersCandidateSurface);
  }

  return vec4f(reflection, clamp(confidence, 0.0, 1.0));
}`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{projectionMatrix:`mat4x4<f32>`,inverseProjectionMatrix:`mat4x4<f32>`,intensity:`f32`,maxDistance:`f32`,thickness:`f32`,sampleCount:`f32`,maxRoughness:`f32`,frameIndex:`f32`},propTypes:{projectionMatrix:{value:vM,private:!0},inverseProjectionMatrix:{value:vM,private:!0},intensity:{value:1.35,min:0,softMax:4},maxDistance:{value:60,min:1,softMax:180},thickness:{value:.45,min:.02,softMax:3},sampleCount:{value:48,min:8,max:96},maxRoughness:{value:.88,min:.1,max:1},frameIndex:{value:0,private:!0}},passes:[{sampler:!0}]},bM={name:`ssrTemporal`,source:`\
${Uj}
struct SSRTemporalUniforms {
  inverseProjectionMatrix: mat4x4f,
  historyWeight: f32,
  depthThreshold: f32,
};

@group(0) @binding(auto) var<uniform> ssrTemporal: SSRTemporalUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTextureSampler: sampler;
@group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
@group(0) @binding(auto) var velocityTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousDepthTextureSampler: sampler;

fn ssrTemporal_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let current = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let currentDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (currentDepth >= 0.99999) {
    return vec4f(0.0);
  }

  let velocity = textureSampleLevel(velocityTexture, velocityTextureSampler, texCoord, 0).xy;
  let previousCoord = texCoord - velocity;
  let validCoordinate = all(previousCoord >= vec2f(0.0)) &&
    all(previousCoord <= vec2f(1.0));
  let clampedPreviousCoord = clamp(previousCoord, vec2f(0.0), vec2f(1.0));
  let previousDepth = textureSampleLevel(
    previousDepthTexture,
    previousDepthTextureSampler,
    clampedPreviousCoord,
    0
  ).r;
  let currentViewDepth = temporal_getViewDepth(texCoord, currentDepth, ssrTemporal.inverseProjectionMatrix, 0.00001);
  let previousViewDepth = temporal_getViewDepth(clampedPreviousCoord, previousDepth, ssrTemporal.inverseProjectionMatrix, 0.00001);
  let relativeDepthDifference = abs(previousViewDepth - currentViewDepth) /
    max(currentViewDepth, 0.0001);
  let validDepth = relativeDepthDifference < ssrTemporal.depthThreshold;

  let bounds = temporal_getColorBounds(sourceTexture, sourceTextureSampler, texCoord, current);
  let minimumReflection = bounds.minimum;
  let maximumReflection = bounds.maximum;

  let historyReflection = textureSampleLevel(
    historyTexture,
    historyTextureSampler,
    clampedPreviousCoord,
    0
  );
  let validHistory = validCoordinate && validDepth && historyReflection.a > 0.001;
  if (!validHistory) {
    return current;
  }

  let hasCurrentSupport = maximumReflection.a > 0.001;
  if (!hasCurrentSupport) {
    return vec4f(
      historyReflection.rgb,
      historyReflection.a * ssrTemporal.historyWeight
    );
  }

  let clampedHistory = clamp(historyReflection, minimumReflection, maximumReflection);
  return mix(current, clampedHistory, ssrTemporal.historyWeight);
}`,bindingLayout:[{name:`historyTexture`,group:0},{name:`velocityTexture`,group:0},{name:`depthTexture`,group:0},{name:`previousDepthTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseProjectionMatrix:`mat4x4<f32>`,historyWeight:`f32`,depthThreshold:`f32`},propTypes:{inverseProjectionMatrix:{value:vM,private:!0},historyWeight:{value:.86,min:0,max:.97},depthThreshold:{value:.018,min:1e-4,softMax:.1}},passes:[{sampler:!0}]},xM={name:`ssrDepthHistoryCopy`,source:`@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn ssrDepthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  return vec4f(depth, 0.0, 0.0, 1.0);
}`,bindingLayout:[{name:`depthTexture`,group:0}],passes:[{sampler:!0}]},SM={name:`ssrSpatial`,source:`struct SSRSpatialUniforms {
  inverseProjectionMatrix: mat4x4f,
  direction: vec2f,
  maxRadius: f32,
  depthSigma: f32,
};

@group(0) @binding(auto) var<uniform> ssrSpatial: SSRSpatialUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn ssrSpatial_reconstructViewDepth(texCoord: vec2f, depth: f32) -> f32 {
  let clip = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, depth, 1.0);
  let viewPosition = ssrSpatial.inverseProjectionMatrix * clip;
  return abs(viewPosition.z / max(abs(viewPosition.w), 0.00001));
}

fn ssrSpatial_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let centerReflection = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let centerNormalRoughness = textureSampleLevel(normalTexture, normalTextureSampler, texCoord, 0);
  let roughness = clamp(centerNormalRoughness.a, 0.0, 1.0);
  let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (centerDepth >= 0.99999) {
    return vec4f(0.0);
  }
  let centerViewDepth = ssrSpatial_reconstructViewDepth(texCoord, centerDepth);
  let hasCenterReflection = centerReflection.a > 0.001;
  if (!hasCenterReflection && roughness >= 0.28) {
    return centerReflection;
  }
  let minimumRadius = select(5.0, 0.95, hasCenterReflection);
  let radius = clamp(
    max(roughness * roughness * ssrSpatial.maxRadius, minimumRadius),
    minimumRadius,
    6.0
  );

  let centerNormal = normalize(centerNormalRoughness.rgb * 2.0 - 1.0);
  let texel = ssrSpatial.direction / vec2f(textureDimensions(sourceTexture));
  let centerWeight = select(0.0, 1.0, hasCenterReflection);
  var reflection = centerReflection * centerWeight;
  var totalWeight = centerWeight;
  var supportingSampleCount = 0u;
  for (var sampleIndex: i32 = 1; sampleIndex <= 6; sampleIndex++) {
    if (f32(sampleIndex) > ceil(radius)) {
      break;
    }
    for (var side: i32 = -1; side <= 1; side += 2) {
      let sampleCoord = clamp(
        texCoord + texel * f32(sampleIndex * side),
        vec2f(0.0),
        vec2f(1.0)
      );
      let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleCoord, 0);
      let sampleNormal = normalize(
        textureSampleLevel(normalTexture, normalTextureSampler, sampleCoord, 0).rgb * 2.0 - 1.0
      );
      let sampleViewDepth = ssrSpatial_reconstructViewDepth(sampleCoord, sampleDepth);
      let relativeDepthDelta = abs(sampleViewDepth - centerViewDepth) /
        max(centerViewDepth, 0.0001);
      let depthWeight = exp(
        -(relativeDepthDelta * relativeDepthDelta) /
          max(2.0 * ssrSpatial.depthSigma * ssrSpatial.depthSigma, 0.000001)
      );
      let normalWeight = pow(max(dot(centerNormal, sampleNormal), 0.0), 16.0);
      let distanceWeight = exp(
        -f32(sampleIndex * sampleIndex) / max(2.0 * radius * radius, 0.1)
      );
      let sampleReflection = textureSampleLevel(sourceTexture, sourceTextureSampler, sampleCoord, 0);
      let confidenceWeight = smoothstep(0.001, 0.12, sampleReflection.a);
      let belongsToSamePlane = dot(centerNormal, sampleNormal) > 0.9995;
      let surfaceWeight = select(0.0, 1.0, hasCenterReflection || belongsToSamePlane);
      let weight = depthWeight * normalWeight * distanceWeight * confidenceWeight * surfaceWeight;
      if (weight > 0.001) {
        supportingSampleCount += 1u;
      }
      reflection += sampleReflection * weight;
      totalWeight += weight;
    }
  }

  if ((!hasCenterReflection && supportingSampleCount < 2u) || totalWeight <= 0.0001) {
    return centerReflection;
  }
  return reflection / totalWeight;
}`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseProjectionMatrix:`mat4x4<f32>`,direction:`vec2<f32>`,maxRadius:`f32`,depthSigma:`f32`},propTypes:{inverseProjectionMatrix:{value:vM,private:!0},direction:{value:[1,0]},maxRadius:{value:5,min:0,max:8},depthSigma:{value:.035,min:1e-4,softMax:.2}},passes:[{sampler:!0}]},CM={name:`ssrComposite`,source:`struct SSRCompositeUniforms {
  inverseProjectionMatrix: mat4x4f,
  strength: f32,
  debugMode: f32,
  depthSigma: f32,
};

@group(0) @binding(auto) var<uniform> ssrComposite: SSRCompositeUniforms;
@group(0) @binding(auto) var reflectionTexture: texture_2d<f32>;
@group(0) @binding(auto) var reflectionTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn ssrComposite_reconstructViewDepth(texCoord: vec2f, depth: f32) -> f32 {
  let clip = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, depth, 1.0);
  let viewPosition = ssrComposite.inverseProjectionMatrix * clip;
  return abs(viewPosition.z / max(abs(viewPosition.w), 0.00001));
}

fn ssrComposite_upsampleReflection(texCoord: vec2f) -> vec4f {
  let reflectionSize = vec2f(textureDimensions(reflectionTexture));
  let reflectionPosition = texCoord * reflectionSize - vec2f(0.5);
  let reflectionBase = vec2i(floor(reflectionPosition));
  let reflectionFraction = fract(reflectionPosition);
  let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (centerDepth >= 0.99999) {
    return textureSampleLevel(reflectionTexture, reflectionTextureSampler, texCoord, 0);
  }
  let centerViewDepth = ssrComposite_reconstructViewDepth(texCoord, centerDepth);
  let centerNormal = normalize(
    textureSampleLevel(normalTexture, normalTextureSampler, texCoord, 0).rgb * 2.0 - 1.0
  );

  var reflection = vec4f(0.0);
  var totalWeight = 0.0;
  for (var sampleY: i32 = 0; sampleY <= 1; sampleY++) {
    for (var sampleX: i32 = 0; sampleX <= 1; sampleX++) {
      let reflectionPixel = clamp(
        reflectionBase + vec2i(sampleX, sampleY),
        vec2i(0),
        vec2i(reflectionSize) - vec2i(1)
      );
      let sampleCoord = (vec2f(reflectionPixel) + vec2f(0.5)) / reflectionSize;
      let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleCoord, 0);
      let sampleNormal = normalize(
        textureSampleLevel(normalTexture, normalTextureSampler, sampleCoord, 0).rgb * 2.0 - 1.0
      );
      let horizontalWeight = select(
        1.0 - reflectionFraction.x,
        reflectionFraction.x,
        sampleX == 1
      );
      let verticalWeight = select(
        1.0 - reflectionFraction.y,
        reflectionFraction.y,
        sampleY == 1
      );
      let sampleViewDepth = ssrComposite_reconstructViewDepth(sampleCoord, sampleDepth);
      let relativeDepthDelta = abs(sampleViewDepth - centerViewDepth) /
        max(centerViewDepth, 0.0001);
      let depthWeight = exp(
        -(relativeDepthDelta * relativeDepthDelta) /
          max(2.0 * ssrComposite.depthSigma * ssrComposite.depthSigma, 0.000001)
      );
      let normalWeight = pow(max(dot(centerNormal, sampleNormal), 0.0), 12.0);
      let weight = horizontalWeight * verticalWeight * depthWeight * normalWeight;
      reflection += textureLoad(reflectionTexture, reflectionPixel, 0) * weight;
      totalWeight += weight;
    }
  }
  return reflection / max(totalWeight, 0.00001);
}

fn ssrComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let color = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let reflection = ssrComposite_upsampleReflection(texCoord);
  if (ssrComposite.debugMode > 1.5) {
    let confidence = clamp(reflection.a, 0.0, 1.0);
    let lowConfidence = vec3f(0.045, 0.08, 0.22);
    let highConfidence = vec3f(1.0, 0.7, 0.16);
    return vec4f(mix(lowConfidence, highConfidence, confidence), 1.0);
  }
  if (ssrComposite.debugMode > 0.5) {
    return vec4f(reflection.rgb * reflection.a, 1.0);
  }
  let reflectionWeight = clamp(reflection.a * ssrComposite.strength, 0.0, 1.0);
  return vec4f(color.rgb + reflection.rgb * reflectionWeight, color.a);
}`,bindingLayout:[{name:`reflectionTexture`,group:0},{name:`depthTexture`,group:0},{name:`normalTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseProjectionMatrix:`mat4x4<f32>`,strength:`f32`,debugMode:`f32`,depthSigma:`f32`},propTypes:{inverseProjectionMatrix:{value:vM,private:!0},strength:{value:1,min:0,softMax:2},debugMode:{value:0,min:0,max:2,private:!0},depthSigma:{value:.04,min:1e-4,softMax:.2}},passes:[{sampler:!0}]};function wM(e={}){let t=e.quality?_M[e.quality]:void 0,n=e.resolutionScale??t?.resolutionScale??1,r=e.reprojection===`camera`,i=t?{maxRadius:t.maxRadius}:{};return{name:`ssrCompositeShaderPass`,renderTargets:{ssrRaw:{scale:[n,n],format:`rgba16float`},ssrHistory:{scale:[n,n],format:`rgba16float`,lifetime:`history`,initialize:{clearColor:[0,0,0,0]}},ssrHistoryDepth:r?{format:`rgba8unorm`,lifetime:`history`,initialize:{clearColor:[1,1,1,1]}}:{scale:[n,n],format:`rgba16float`,lifetime:`history`,initialize:{clearColor:[1,0,0,1]}},...r?{ssrHistoryNormal:{format:`rgba8unorm`,lifetime:`history`,initialize:{clearColor:[.5,.5,1,1]}}}:{},ssrScratch:{scale:[n,n],format:`rgba16float`},ssrReflection:{scale:[n,n],format:`rgba16float`}},steps:[{shaderPass:yM,inputs:{sourceTexture:`previous`},output:`ssrRaw`,uniforms:t?{sampleCount:t.sampleCount}:void 0},{shaderPass:r?mM:bM,inputs:{sourceTexture:`ssrRaw`,historyTexture:`ssrHistory`,previousDepthTexture:`ssrHistoryDepth`,...r?{previousNormalTexture:`ssrHistoryNormal`}:{}},output:`ssrHistory`,uniforms:t?{historyWeight:t.historyWeight}:void 0},{shaderPass:r?gM:xM,inputs:{sourceTexture:`previous`},output:`ssrHistoryDepth`},...r?[{shaderPass:hM,inputs:{sourceTexture:`previous`},output:`ssrHistoryNormal`}]:[],{shaderPass:SM,inputs:{sourceTexture:`ssrHistory`},output:`ssrScratch`,uniforms:{...i,direction:[1,0]}},{shaderPass:SM,inputs:{sourceTexture:`ssrScratch`},output:`ssrReflection`,uniforms:{...i,direction:[0,1]}},{shaderPass:CM,inputs:{sourceTexture:`previous`,reflectionTexture:`ssrReflection`},output:`previous`}]}}function TM(e,t=[0,0,0]){let n=e.distanceScales.unitsPerMeter,r=n[2]*Math.hypot(e.viewMatrix[8],e.viewMatrix[9],e.viewMatrix[10]),i=new z([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]),a=new z(i).multiplyRight(e.projectionMatrix).scale(r),o=e.projectPosition([...t]),s=new z().scale(1/r).multiplyRight(e.viewMatrix).translate(o).scale(n),c=new z(i).multiplyRight(e.viewProjectionMatrix);return{projectionMatrix:a,inverseProjectionMatrix:new z(a).invert(),viewMatrix:s,inverseViewMatrix:new z(s).invert(),viewProjectionMatrix:c,inverseViewProjectionMatrix:new z(c).invert(),nearPlane:e.projectionMatrix[14]/r/(e.projectionMatrix[10]-1),farPlane:e.projectionMatrix[14]/r/(e.projectionMatrix[10]+1)}}var EM={name:`cameraMotion`,source:`struct CameraMotionUniforms {
    currentClipToPreviousClip: mat4x4f,
    viewportBounds: vec4f,
    textureSize: vec2f,
  };
  @group(3) @binding(auto) var<uniform> cameraMotion: CameraMotionUniforms;`,uniformTypes:{currentClipToPreviousClip:`mat4x4<f32>`,viewportBounds:`vec4<f32>`,textureSize:`vec2<f32>`},defaultUniforms:{currentClipToPreviousClip:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],viewportBounds:[0,0,1,1],textureSize:[1,1]}},DM=class{device;model;constructor(e){this.device=e,this.model=new cf(e,{id:`scene-camera-velocity`,source:OM,modules:[EM],vertexCount:3,parameters:{depthWriteEnabled:!1,depthCompare:`always`,blend:!1}})}render(e,t,n,r){this.model.setBindings({depthTexture:t}),this.model.shaderInputs.setProps({cameraMotion:{currentClipToPreviousClip:n,viewportBounds:r,textureSize:[e.width,e.height]}});let i=this.device.beginRenderPass({framebuffer:e,clearColor:[0,0,0,0],clearDepth:!1,depthReadOnly:!0});this.model.draw(i),i.end(),i.destroy()}destroy(){this.model.destroy()}},OM=`
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let bounds = cameraMotion.viewportBounds;
  if (any(position.xy < bounds.xy) || any(position.xy >= bounds.xy + bounds.zw)) { return vec4f(0.0); }
  let depth = textureLoad(depthTexture, vec2i(position.xy), 0);
  if (depth >= 0.99999) { return vec4f(0.0); }
  let currentCoordinate = (position.xy - bounds.xy) / bounds.zw;
  let clip = vec4f(currentCoordinate * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0), depth, 1.0);
  let previousClip = cameraMotion.currentClipToPreviousClip * clip;
  if (previousClip.w <= 0.00001) { return vec4f(0.0); }
  let previousCoordinate = previousClip.xy / previousClip.w * vec2f(0.5, -0.5) + vec2f(0.5);
  return vec4f((currentCoordinate - previousCoordinate) * bounds.zw / cameraMotion.textureSize, 0.0, 1.0);
}`,kM=class{id;props;useInPicking=!1;device;capturePass;velocityModel;views=new Map;frameIndex=0;constructor(e){this.props=e,this.id=e.id||`scene-buffers`}setup({device:e}){P(e.type===`webgpu`),this.device=e,this.props.motionVectors&&(this.velocityModel=new DM(e)),this.capturePass=new AM(e,{id:`${this.id}-capture`},this.props.getLayerOptions)}getFrame(e){return this.views.get(e)?.frame}resetHistory(e){for(let[t,n]of this.views)(e===void 0||e===t)&&(n.historyInvalidated=!0)}getShaderModuleProps(e){let t=this.props.getLayerOptions(e);return{...t?.surfaceBuffer?{surfaceBuffer:{enabled:0}}:{},...t?.motionBuffer?{motionBuffer:{enabled:0}}:{}}}preRender(e){if(e.isPicking||!this.device||!this.capturePass)return;let t=e.canvasContext||this.device.getCanvasContext(),[n,r]=t.getDrawingBufferSize();if(n<=0||r<=0)return;let i=new Set(e.viewports.filter(e=>e.width>0&&e.height>0).map(e=>e.id));for(let[e,t]of this.views)i.has(e)||(jM(t),this.views.delete(e));let a=this.props.getTime?.()??0,o=e.effects?.filter(e=>e!==this),s={...e,canvasContext:t,effects:o,isPicking:!1,views:void 0,clearColor:void 0};for(let i of e.viewports){if(i.width<=0||i.height<=0)continue;let o=this.views.get(i.id);if(!o||o.slots[0].buffer.width!==n||o.slots[0].buffer.height!==r){let e=this.createCapture(i.id,n,r);o&&jM(o),o=e,this.views.set(i.id,o)}let c=t.cssToDeviceRatio(),l=[i.x*c,i.y*c,i.width*c,i.height*c],u=!o.historyInvalidated&&o.frame?.viewportBounds.every((e,t)=>e===l[t])?o.frame:void 0,d=TM(i),f=new z(u?new z([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(u.viewProjectionMatrix):d.viewProjectionMatrix).multiplyRight(d.inverseViewProjectionMatrix);this.capturePass.motionProps={enabled:0,currentClipToPreviousClip:f,previousTime:u?.time??a,viewportScale:[l[2]/n,l[3]/r]};let p=this.props.history&&o.completedIndex===0?1:0,m=o.slots[p],h={...s,viewports:[i]};this.capturePass.viewParameters=e.views?.[i.id]?.props.parameters||{};let g=e.layers.flatMap(e=>e.getModels().map(e=>({model:e,parameters:{...e.parameters}})));try{this.capturePass.captureMode=`opaque`,this.capturePass.render({...h,pass:`${this.id}-opaque`,target:m.colorFramebuffer,clearCanvas:!0,clearColor:this.props.clearColor??[0,0,0,0]}),this.capturePass.captureMode=`normal`,this.capturePass.render({...h,pass:`${this.id}-normal`,target:m.normalFramebuffer,clearCanvas:!1,clearColor:[.5,.5,1,1]}),m.selectionFramebuffer&&(this.capturePass.captureMode=`selection`,this.capturePass.render({...h,pass:`${this.id}-selection`,target:m.selectionFramebuffer,clearCanvas:!1,clearColor:[0,0,0,0]})),m.velocityFramebuffer&&(this.velocityModel.render(m.velocityFramebuffer,m.buffer.depthTexture,f,l),this.capturePass.captureMode=`velocity`,this.capturePass.render({...h,pass:`${this.id}-velocity`,target:m.velocityFramebuffer,clearCanvas:!1,clearColor:void 0})),this.capturePass.captureMode=`transparent`,this.capturePass.render({...h,pass:`${this.id}-transparent`,target:m.colorFramebuffer,clearCanvas:!1})}finally{for(let{model:e,parameters:t}of g)e.setParameters(t);for(let t of e.layers)this.props.getLayerOptions(t)?.surfaceBuffer&&t.setShaderModuleProps({surfaceBuffer:{enabled:0}}),this.props.getLayerOptions(t)?.motionBuffer&&t.setShaderModuleProps({motionBuffer:{enabled:0}})}o.frame={buffer:m.buffer,previousBuffer:this.props.history?u?.buffer:void 0,viewProjectionMatrix:[...i.viewProjectionMatrix],previousViewProjectionMatrix:u?.viewProjectionMatrix,viewportBounds:l,frameIndex:this.frameIndex,historyValid:!!u,time:a,previousTime:u?.time??a},o.completedIndex=p,o.historyInvalidated=!1}this.frameIndex++}cleanup(){for(let e of this.views.values())jM(e);this.views.clear(),this.velocityModel?.destroy(),this.velocityModel=void 0,this.capturePass?.cleanup(),this.capturePass=void 0,this.device=void 0}createCapture(e,t,n){let r=[];try{for(let i=0;i<(this.props.history?2:1);i++){let a=new Qj(this.device,{id:`${this.id}-${e}-${i}`,width:t,height:n,colorFormat:this.props.colorFormat||`rgba16float`,velocity:this.props.motionVectors??!1,extraColorAttachments:this.props.selection?[{name:`selection`,format:`r8unorm`}]:[]}),o=[];try{for(let e of[a.colorTexture,a.normalRoughnessTexture,...this.props.selection?[a.getExtraColorTexture(`selection`)]:[],...this.props.motionVectors?[a.velocityTexture]:[]])o.push(this.device.createFramebuffer({width:t,height:n,colorAttachments:[e],depthStencilAttachment:a.depthTexture}));r.push({buffer:a,colorFramebuffer:o[0],normalFramebuffer:o[1],selectionFramebuffer:this.props.selection?o[2]:void 0,velocityFramebuffer:this.props.motionVectors?o[this.props.selection?3:2]:void 0})}catch(e){for(let e of o)e.destroy();throw a.destroy(),e}}return{slots:r,historyInvalidated:!0}}catch(e){throw jM({slots:r,historyInvalidated:!0}),e}}},AM=class extends JT{getLayerOptions;captureMode=`opaque`;viewParameters={};motionProps={};constructor(e,t,n){super(e,t),this.getLayerOptions=n}shouldDrawLayer(e){let t=this.getLayerOptions(e);return t?this.captureMode===`velocity`?!!t.motionBuffer:this.captureMode===`normal`||this.captureMode===`selection`?t.mode===`opaque`&&!!t.surfaceBuffer&&(this.captureMode!==`selection`||!!t.selected):t.mode===this.captureMode:!1}getShaderModuleProps(e){let t=this.getLayerOptions(e);return{...t?.motionBuffer?{motionBuffer:{...this.motionProps,enabled:this.captureMode===`velocity`?1:0}}:{},...t?.surfaceBuffer?{surfaceBuffer:{enabled:this.captureMode===`normal`?1:this.captureMode===`selection`?2:0,viewMatrix:e.context.viewport.viewMatrix}}:{}}}getLayerParameters(e,t,n){let r={...this.viewParameters,...e.props.parameters};return this.captureMode===`transparent`?{...r,depthCompare:`less-equal`,depthWriteEnabled:!1}:{...r,depthCompare:`less-equal`,depthWriteEnabled:this.captureMode===`opaque`,blend:!1,blendColorOperation:`add`,blendAlphaOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`zero`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`zero`}}};function jM(e){for(let t of e.slots)t.colorFramebuffer.destroy(),t.normalFramebuffer.destroy(),t.selectionFramebuffer?.destroy(),t.velocityFramebuffer?.destroy(),t.buffer.destroy()}var MM=`core-features-and-limits`,NM=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function PM(e){let t={};for(let n of NM){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function FM(e){return e.featureLevel??`core`}function IM(e){let t=FM(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!==`default`&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function LM(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(MM)&&r.push(MM);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function RM(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(MM)?`core`:e===`best-available`?`compatibility`:e}function zM(e,t){return e===`core`?`core`:RM(`compatibility`,t)}var BM=new class extends Ll{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){return await this._create(e,!0)}async _create(e,t){if(typeof navigator>`u`||!navigator.gpu)throw Error(`navigator.gpu is unavailable. WebGPU requires a supported browser and a secure context.`);if(typeof navigator.gpu.requestAdapter!=`function`)throw Error(`navigator.gpu.requestAdapter is unavailable.`);let n=FM(e),r=IM(e),i;try{i=await this.requestGPUAdapter(r)}catch(e){throw Error(`navigator.gpu.requestAdapter() failed`,{cause:e})}if(!i)throw Object.assign(Error(`navigator.gpu.requestAdapter() returned null. No matching WebGPU adapter is available.`),{code:t?Il:void 0});let a=await VM(i),o={},s=LM(i.features,n,e.optionalFeatures);s.length>0&&(o.requiredFeatures=s);let c={...n===`max`?PM(i.limits):{},...e.requiredLimits};Object.keys(c).length>0&&(o.requiredLimits=c);let u;try{u=await i.requestDevice(o)}catch(e){throw Error(`GPUAdapter.requestDevice() failed`,{cause:e})}let d=await HM(u);if(d){if(u.destroy(),t&&d.reason!==`destroyed`)return F.warn(`WebGPU device was returned already lost; retrying with a fresh adapter`)(),await this._create(e,!1);throw Error(`WebGPU device was returned already lost${d.message?`: ${d.message}`:``}`,{cause:d})}F.groupCollapsed(1,`WebGPUDevice created`)();try{let t;try{let{WebGPUDevice:r}=await l(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-BL-RBo3s.js`);return{WebGPUDevice:e}},__vite__mapDeps([34,2,3,4,5,9,35,13])),o=RM(n,u.features),s={...e,featureLevel:o};t=new r(s,u,i,a);let c=r.getCanvasContextProps(s);c&&t.initializeCanvasContext(c)}catch(e){throw t?(t.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})):(u.destroy(),Error(`WebGPU wrapper initialization failed`,{cause:e}))}return F.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),F.table(1,t.info)(),t}finally{F.groupEnd(1)()}}async attach(e,t={}){let{WebGPUDevice:n}=await l(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-BL-RBo3s.js`);return{WebGPUDevice:e}},__vite__mapDeps([34,2,3,4,5,9,35,13]));if(e instanceof n)return e;if(!this.isDeviceHandle(e))throw Error(`Invalid GPUDevice`);let r=n.getDeviceFromHandle(e);if(r)return r;let i=await HM(e);if(i)throw Error(`WebGPU device is already lost`,{cause:i});let a=n.getDeviceFromHandle(e);if(a)return a;let o=e.adapterInfo||{},s=zM(t.featureLevel,e.features),c={...t,featureLevel:s,_handle:e},u=new n(c,e,null,o,!1),d=n.getCanvasContextProps(c);if(d)try{u.initializeCanvasContext(d)}catch(e){throw u.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})}return u}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}};async function VM(e){try{return e.info||await e.requestAdapterInfo?.()||{}}catch(e){return F.warn(`WebGPU adapter metadata is unavailable`,e)(),{}}}async function HM(e){return await Promise.race([e.lost,Promise.resolve(null)])}function UM(e){return{type:e,adapters:e===`webgpu`?[BM,iO]:[iO]}}function WM({device:e,deviceType:t=`webgpu`}){return e?{device:e}:{deviceProps:UM(t)}}var GM={maxPitch:85},KM=[-74.006,40.7128,0];function qM(){let e=[{name:`District`,kind:`ground`,center:[0,0,-3],size:[1050,1250,2],color:[.17,.23,.27]},{name:`River`,kind:`water`,center:[0,0,0],size:[170,1250,0],color:[.08,.39,.48]},{name:`North bridge`,kind:`bridge`,center:[0,275,8],size:[240,30,5],color:[.69,.76,.74]},{name:`South bridge`,kind:`bridge`,center:[0,-265,8],size:[240,30,5],color:[.69,.76,.74]}];for(let t of[-1,1])for(let n=0;n<8;n++)for(let r=0;r<3;r++){let i=[t*(122+r*135),n*135-470,0];if((n+r*2)%7==0)e.push({name:`Riverside garden ${e.length}`,kind:`park`,center:i,size:[78,85,1],color:[.25,.43,.35]});else{let a=25+(n*17+r*31+(t+1)*11)%100;e.push({name:`${t<0?`West`:`East`} ${n+1}.${r+1}`,kind:`building`,center:i,size:[65+r*5,72,a],color:r===0?[.83,.76,.61]:[.61,.71,.73]})}}return e}function JM(e,t=!1){let n=[];return e.forEach((e,r)=>{let[i,a,o]=e.center,[s,c,l]=e.size,u=i-s/2,d=i+s/2,f=a-c/2,p=a+c/2,m=o+l;h([[u,f,m],[d,f,m],[d,p,m],[u,p,m]],[0,0,1]),l>0&&(h([[u,f,o],[d,f,o],[d,f,m],[u,f,m]],[0,-1,0]),h([[d,f,o],[d,p,o],[d,p,m],[d,f,m]],[1,0,0]),h([[d,p,o],[u,p,o],[u,p,m],[d,p,m]],[0,1,0]),h([[u,p,o],[u,f,o],[u,f,m],[u,p,m]],[-1,0,0]));function h(i,a){let o=e.kind===`building`&&a[2]===0,u=Math.max(1,Math.round((a[0]?c:s)/27)),d=Math.max(1,Math.round(l/16)),f=[[0,0],[u,0],[u,d],[0,d]];for(let s of[0,1,2,0,2,3])n.push(...i[s],...a,...e.color,r),t&&n.push(...f[s],Number(o))}}),new Float32Array(n)}var YM={name:`riverfrontWindows`,source:`
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
`},XM=class extends Sj{static layerName=`RiverDistrictLayer`;static defaultProps={fog:{},roughness:1,surfaceWeather:{},parameters:{depthCompare:`less-equal`,depthWriteEnabled:!0,cullMode:`none`}};getAttributeManager(){return null}initializeState(){}updateState({props:e,oldProps:t}){if(this.state.model&&e.features===t.features)return;this.destroyMesh();let n=JM(e.features,!0),r=this.context.device.createBuffer({data:n}),i=new Float32Array(n.length/13);for(let t=0;t<i.length;t++)i[t]=e.features[n[t*13+9]].kind===`water`?0:1;let a=this.context.device.createBuffer({data:i});try{let e=new cf(this.context.device,{shaderAssembler:this.context.shaderAssembler,...this.getShaders({source:QM,vs:$M,fs:eN,modules:[Vw,sT,Sl,Nl,Fl,Fj,ZM,YM]}),id:`${this.id}-mesh`,topology:`triangle-list`,vertexCount:n.length/13,bufferLayout:[{name:`vertices`,byteStride:52,attributes:[{attribute:`position`,format:`float32x3`,byteOffset:0},{attribute:`normal`,format:`float32x3`,byteOffset:12},{attribute:`color`,format:`float32x3`,byteOffset:24},{attribute:`featureIndex`,format:`float32`,byteOffset:36},{attribute:`facadeCoordinates`,format:`float32x3`,byteOffset:40}]},{name:`surfaceExposure`,format:`float32`}],attributes:{vertices:r,surfaceExposure:a},parameters:{depthCompare:`less-equal`,depthWriteEnabled:!0,cullMode:`none`}});this.setState({model:e,vertices:r,surfaceExposure:a})}catch(e){throw r.destroy(),a.destroy(),e}}getModels(){return this.state.model?[this.state.model]:[]}draw({renderPass:e}){this.state.model?.shaderInputs.setProps({heightFog:{...Nl.defaultUniforms,...typeof this.props.fog==`function`?this.props.fog():this.props.fog},surfaceWeather:{...Fl.defaultUniforms,...typeof this.props.surfaceWeather==`function`?this.props.surfaceWeather():this.props.surfaceWeather},districtMesh:{roughness:this.props.roughness,windowSky:this.props.windowSky??[1,1,1],windowSunDirection:this.props.windowSun?.direction??[0,0,1],windowSunColor:this.props.windowSun?.color??[0,0,0],cameraPosition:Ij(this.context.viewport,this.props.coordinateOrigin,this.context.viewport.cameraPosition)},lambertMaterial:{ambient:.45,diffuse:.55,...this.props.material},lighting:this.props.lighting?typeof this.props.lighting==`function`?this.props.lighting():this.props.lighting:{enabled:!0,lights:[{type:`ambient`,color:[255,255,255],intensity:1},{type:`directional`,color:[255,255,255],intensity:1,direction:[.5,.3,-.8]}]}}),this.state.model?.draw(e)}getPickingInfo({info:e}){return e.object=this.props.features[e.index],e}finalizeState(e){this.destroyMesh(),super.finalizeState(e)}destroyMesh(){this.state.model?.destroy(),this.state.vertices?.destroy(),this.state.surfaceExposure?.destroy(),this.setState({model:void 0,vertices:void 0,surfaceExposure:void 0})}},ZM={name:`districtMesh`,bindingLayout:[{name:`districtMesh`,group:3}],source:`struct DistrictMeshUniforms {
  roughness: f32,
  cameraPosition: vec3f,
  windowSky: vec3f,
  windowSunDirection: vec3f,
  windowSunColor: vec3f,
};
@group(3) @binding(auto) var<uniform> districtMesh: DistrictMeshUniforms;`,fs:`layout(std140) uniform districtMeshUniforms {
  float roughness;
  vec3 cameraPosition;
  vec3 windowSky;
  vec3 windowSunDirection;
  vec3 windowSunColor;
} districtMesh;`,uniformTypes:{roughness:`f32`,cameraPosition:`vec3<f32>`,windowSky:`vec3<f32>`,windowSunDirection:`vec3<f32>`,windowSunColor:`vec3<f32>`},defaultUniforms:{roughness:1,cameraPosition:[0,0,0],windowSky:[1,1,1],windowSunDirection:[0,0,1],windowSunColor:[0,0,0]}},QM=`
struct CityVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) @interpolate(flat) pickingColor: vec3<f32>,
  @location(2) worldPosition: vec3<f32>,
  @location(3) normal: vec3<f32>,
  @location(4) commonNormal: vec3<f32>,
  @location(5) exposure: f32,
  @location(6) facade: vec3f,
};
@vertex fn vertexMain(
  @location(0) position: vec3<f32>, @location(1) normal: vec3<f32>,
  @location(2) color: vec3<f32>, @location(3) featureIndex: f32, @location(4) surfaceExposure: f32,
  @location(5) facadeCoordinates: vec3f
) -> CityVertex {
  var output: CityVertex;
  output.position = project_position_to_clipspace(position, vec3<f32>(0.0), vec3<f32>(0.0));
  output.worldPosition = position;
  output.normal = normal;
  output.commonNormal = project_normal(normal);
  output.color = color;
  output.exposure = surfaceExposure;
  output.facade = facadeCoordinates;
  output.pickingColor = picking_getPickingColorFromIndex(u32(featureIndex));
  return output;
}
@fragment fn fragmentMain(input: CityVertex) -> @location(0) vec4<f32> {
  let windowCoverage = riverfrontWindowCoverage(input.facade);
  if (surfaceBuffer.enabled != 0) {
    let roughness = mix(districtMesh.roughness, 0.16, windowCoverage);
    return surfaceBuffer_encode(input.commonNormal, surfaceWeather_getRoughness(roughness, input.worldPosition, input.normal, input.exposure));
  }
  if (picking.isActive > 0.5) {
    if (picking_isColorZero(input.pickingColor)) { discard; }
    return vec4<f32>(input.pickingColor, 1.0);
  }
  let cameraPosition = districtMesh.cameraPosition;
  let albedo = surfaceWeather_getAlbedo(input.color, input.worldPosition, input.normal, input.exposure);
  var color = lighting_getLightColor2(albedo, cameraPosition, input.worldPosition, normalize(input.normal));
  color += surfaceWeather_getReflection(input.worldPosition, input.normal, cameraPosition,
    vec3f(-0.5, -0.3, 0.8), vec3f(1.0), input.exposure);
  color = riverfrontWindowReflection(color, input.normal, cameraPosition - input.worldPosition,
    districtMesh.windowSky, windowCoverage);
  color += districtMesh.windowSunColor * windowCoverage *
    riverfrontWindowSunGlare(input.normal, cameraPosition - input.worldPosition, districtMesh.windowSunDirection);
  if (picking.isHighlightActive > 0.5 && distance(input.pickingColor, picking_normalizeColor(picking.highlightedObjectColor)) < 0.00001) {
    color = mix(color, picking.highlightColor.rgb, picking.highlightColor.a);
  }
  return heightFog_getColor(vec4<f32>(color, layer.opacity), input.worldPosition, cameraPosition);
}
`,$M=`#version 300 es
in vec3 position;
in vec3 normal;
in vec3 color;
in float featureIndex;
in float surfaceExposure;
in vec3 facadeCoordinates;
out vec3 facade;
out float exposure;
out vec4 vertexColor;
out vec3 worldPosition;
out vec3 worldNormal;
out vec3 commonNormal;
void main() {
  worldPosition = position;
  exposure = surfaceExposure;
  facade = facadeCoordinates;
  worldNormal = normal;
  commonNormal = project_normal(normal);
  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(featureIndex);
  gl_Position = project_position_to_clipspace(position, vec3(0.0), vec3(0.0));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  vertexColor = vec4(color, layer.opacity);
  DECKGL_FILTER_COLOR(vertexColor, geometry);
}
`,eN=`#version 300 es
precision highp float;
in vec4 vertexColor;
in vec3 worldPosition;
in vec3 worldNormal;
in vec3 commonNormal;
in float exposure;
in vec3 facade;
out vec4 fragColor;
void main() {
  float windowCoverage = riverfrontWindowCoverage(facade);
  if (surfaceBuffer.enabled != 0) {
    float roughness = mix(districtMesh.roughness, 0.16, windowCoverage);
    fragColor = surfaceBuffer_encode(commonNormal, surfaceWeather_getRoughness(roughness, worldPosition, worldNormal, exposure));
    return;
  }
  vec3 albedo = surfaceWeather_getAlbedo(vertexColor.rgb, worldPosition, worldNormal, exposure);
  vec3 color = lighting_getLightColor(albedo, districtMesh.cameraPosition, worldPosition, normalize(worldNormal));
  color += surfaceWeather_getReflection(worldPosition, worldNormal, districtMesh.cameraPosition,
    vec3(-0.5, -0.3, 0.8), vec3(1.0), exposure);
  color = riverfrontWindowReflection(color, worldNormal, districtMesh.cameraPosition - worldPosition,
    districtMesh.windowSky, windowCoverage);
  color += districtMesh.windowSunColor * windowCoverage *
    riverfrontWindowSunGlare(worldNormal, districtMesh.cameraPosition - worldPosition, districtMesh.windowSunDirection);
  fragColor = heightFog_getColor(vec4(color, vertexColor.a), worldPosition, districtMesh.cameraPosition);
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,tN=class{id;props={};useInPicking=!1;frameCount=0;debugMode=0;historyFrames=0;quality=`balanced`;stableFrames=0;previousViewProjection=null;previousView=null;previousInverseProjection=null;device=null;renderer=null;capturedColor=null;presenter=null;constructor(e,t=`city-river-reflections`,n=1.5,r={}){this.capture=e,this.reflectionIntensity=n,this.passOptions=r,this.id=t}setup({device:e}){this.device=e,this.renderer=this.createRenderer(e)}setQuality(e){e!==this.quality&&(this.quality=e,this.resetHistory(),this.renderer?.destroy(),this.presenter?.destroy(),this.presenter=null,this.capturedColor=null,this.renderer=this.device?this.createRenderer(this.device):null)}get settlingFrameCount(){return 1+Math.ceil(Math.log(.01)/Math.log(_M[this.quality].historyWeight))}get needsRedraw(){return!!this.renderer&&this.stableFrames<this.settlingFrameCount}requestConvergence(){this.stableFrames=0}setReflectionIntensity(e){this.reflectionIntensity=e,this.resetHistory()}createRenderer(e){return new Pf(e,{shaderPasses:[...this.passOptions.beforeReflection??[],wM({reprojection:`camera`,quality:this.quality}),...this.passOptions.afterReflection??[]],colorFormat:`rgba16float`,flipY:!0})}preRender(e){}postRender(e){let t=this.device,n=this.renderer,r=e.viewports[0];if(!r)return e.inputBuffer;let i=this.capture.getFrame(r.id);if(!i)return e.inputBuffer;let{buffer:a}=i,{width:o,height:s}=a;this.capturedColor!==a.colorTexture&&(this.capturedColor=a.colorTexture,n.resize([o,s]),this.resetHistory());let c=t.commandEncoder,l=[0,0,o,s],u=r.viewMatrix,d=r.distanceScales.unitsPerMeter[2]*Math.hypot(u[8],u[9],u[10]),f=new z([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(r.projectionMatrix).scale(d),p=new z(f).invert(),m=new z(new z([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1])).multiplyRight(r.viewProjectionMatrix);this.previousViewProjection&&m.some((e,t)=>e!==this.previousViewProjection[t])&&this.requestConvergence();let h=this.previousViewProjection?new z(this.previousViewProjection).multiplyRight(new z(m).invert()):new z;h.some((e,t)=>Math.abs(e-(t%5==0?1:0))>.5)&&this.resetHistory();let g=n.renderToTexture({sourceTexture:a.colorTexture,bindings:{depthTexture:a.depthTexture,normalTexture:a.normalRoughnessTexture},uniforms:{...this.passOptions.getUniforms?.(r),ssrTrace:{projectionMatrix:f,inverseProjectionMatrix:p,intensity:this.reflectionIntensity,maxDistance:450,thickness:1.5,maxRoughness:.8,frameIndex:this.historyFrames},ssrCameraTemporal:{currentClipToPreviousClip:h,currentViewToPreviousView:this.previousView?new z(this.previousView).multiplyRight(new z(u).invert()):new z,previousInverseProjectionMatrix:this.previousInverseProjection??p,...this.historyFrames?{}:{historyWeight:0},depthThreshold:.01,normalThreshold:.96},ssrSpatial:{inverseProjectionMatrix:p},ssrComposite:{inverseProjectionMatrix:p,strength:this.debugMode===3?0:1,debugMode:this.debugMode===3?0:this.debugMode}}});if(!g)return e.inputBuffer;this.frameCount++,this.historyFrames++,this.stableFrames++,this.previousViewProjection=m,this.previousView=new z(u),this.previousInverseProjection=p,this.presenter??=new bf(t,{id:`city-reflection-presenter`,backgroundTexture:g,flipY:!0}),this.presenter.setProps({backgroundTexture:g}),this.presenter.predraw(c);let _=e.target??t.getCanvasContext().getCurrentFramebuffer(),v=c.beginRenderPass({id:`city-reflection-composite`,framebuffer:_,parameters:{viewport:l},clearColor:!1,clearDepth:!1});return this.presenter.draw(v),v.end(),t.submit(),_}resetHistory(){this.renderer?.resetHistory(),this.historyFrames=0,this.requestConvergence(),this.previousViewProjection=null,this.previousView=null,this.previousInverseProjection=null}cleanup(){this.resetHistory(),this.renderer?.destroy(),this.presenter?.destroy(),this.capturedColor=null,this.renderer=null,this.presenter=null,this.device=null}},nN={name:`riverfrontToneMapping`,steps:[{shaderPass:uM,inputs:{sourceTexture:`previous`},output:`previous`}]};function rN(e,t={}){let n=qM(),r=n.filter(e=>e.kind!==`water`),i=n.filter(e=>e.kind===`water`),a=i[0],o=a&&Math.abs(a.size[0])>Math.abs(a.size[1])?[1,0]:[0,1],s=JM(i),c=new Float32Array(s.length/10*3);for(let e=0,t=0;e<s.length;e+=10,t+=3)c.set(s.subarray(e,e+3),t);let l={ambientOcclusion:!0,outlines:!1,reflections:!0},u={frames:0,backend:``,error:``,time:0,finalized:!1},d=Promise.withResolvers(),f=new kM({id:`ambient-occlusion-buffers`,colorFormat:`rgba16float`,getLayerOptions:e=>e instanceof XM||e instanceof Lj?{mode:`opaque`,surfaceBuffer:!0}:null}),p=null,m=null,h=0,g={},_=new tN(f,`ambient-occlusion-stack`,1.3,{beforeReflection:[Gj({normalSource:`normal-texture`,resolutionScale:1})],afterReflection:[fM({normalSource:`normal-texture`}),nN],getUniforms:e=>iN(e,l,g)});m=_;let v=new pO({parent:e,...WM(t),views:new vD({id:`riverfront`,controller:!0}),initialViewState:{...GM,longitude:KM[0],latitude:KM[1],zoom:15.9,pitch:58,bearing:-18},effects:[f,_],layers:[],_animate:!0,onDeviceInitialized:e=>{u.backend=e.type,p=e.createBuffer({id:`ambient-occlusion-water`,data:c}),y()},onLoad:()=>d.resolve(),onBeforeRender:()=>{let e=performance.now();h&&(u.time+=Math.min(e-h,100)/1e3),h=e},onAfterRender:()=>{u.frames++},onError:e=>{u.error||=e.message,d.reject(e)},getTooltip:e=>e.object?.name??null});function y(){v.setProps({layers:[new XM({id:`riverfront-city`,features:r,data:r,pickable:!0,coordinateSystem:`meter-offsets`,coordinateOrigin:KM,roughness:.84}),p?new Lj({id:`riverfront-water`,data:i,positions:p,vertexCount:c.length/3,coordinateOrigin:KM,style:`river`,flowDirection:o,time:()=>u.time,material:{baseColor:[11/255,66/255,82/255],fresnelColor:[.48,.67,.79],normalStrength:.34,coordinateScale:[.22,.22],waveASpeed:1.1,waveBSpeed:-.7,specularIntensity:.72}}):null]})}return{deck:v,capture:f,effect:m,settings:l,diagnostics:u,ready:d.promise,setEffect(e,t){l[e]=t,e===`reflections`?m?.setReflectionIntensity(t?1.3:0):m?.requestConvergence(),v.redraw(`riverfront ${e}`)},finalize(){u.finalized||(u.finalized=!0,v.finalize(),p?.destroy(),p=null)}}}function iN(e,t,n){let r=e.distanceScales.unitsPerMeter[2]*Math.hypot(e.viewMatrix[8],e.viewMatrix[9],e.viewMatrix[10]),i=e.projectionMatrix[10],a=e.projectionMatrix[14]/r;return n.ssaoEvaluate={nearPlane:a/(i-1),farPlane:a/(i+1),radius:12,bias:.3,intensity:t.ambientOcclusion?1.5:0},n.ssaoComposite={debugMode:0},n.screenSpaceOutline={color:[.025,.045,.06,t.outlines?.5:0],thickness:1.2,depthThreshold:.003,normalThreshold:.18},n.toneMapping={exposure:1.1},n}var aN=document.querySelector(`#scene`),oN=document.querySelector(`#status`),sN=rN(aN);window.riverfrontAmbientOcclusionScene=sN;for(let e of[`ambientOcclusion`,`reflections`,`outlines`]){let t=document.querySelector(`#${e}`);t.addEventListener(`change`,()=>sN.setEffect(e,t.checked))}sN.ready.then(()=>{oN.value=`Toggle ambient occlusion to compare building faces.`,document.body.dataset.ready=`true`}).catch(e=>{oN.value=e instanceof Error?e.message:String(e),document.body.dataset.ready=`error`}),window.addEventListener(`pagehide`,()=>sN.finalize());