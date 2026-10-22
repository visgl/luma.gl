const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/webgl-device-OED5-1E4.js","assets/shader-type-decoder-DAw-4A6z.js","assets/webgl-device-CbuBsl1n.js","assets/buffer-layout-utils-IrZV0BKG.js","assets/get-attribute-from-layouts-D85nBJfU.js","assets/fence-Bz0gITu5.js","assets/shader-block-layout-gM1OvLV7.js","assets/webgl-D8jmobwM.js","assets/arithmetic-expression-BpX0wvOz.js","assets/compute-pipeline-DMOuMYt6.js","assets/convert-colors-CyL5yMUa.js","assets/external-texture-CUGMREVn.js","assets/expression-DmLk9S9K.js","assets/webgpu-D3dW6ooO.js","assets/interleave-Dz4j_afd.js","assets/webgpu-device-D0kXGLDL.js"])))=>i.map(i=>d[i]);
import{O as e,a as t,n,r,s as i,t as a,u as o,v as s,x as c,y as l}from"./arithmetic-expression-BpX0wvOz.js";import{_ as u,f as d,l as f,m as p,o as m,y as h}from"./shader-type-decoder-DAw-4A6z.js";import{_ as g,g as _,h as v,m as y,u as b,v as x}from"./fence-Bz0gITu5.js";import{d as S,u as C}from"./buffer-layout-utils-IrZV0BKG.js";import{i as w,n as T,r as E,t as D}from"./webgl-device-CbuBsl1n.js";import{a as O,c as k,d as A,i as j,l as ee,n as te,o as M,r as ne,s as re,t as ie,u as ae}from"./convert-colors-CyL5yMUa.js";import{t as oe,u as se}from"./interleave-Dz4j_afd.js";var ce=Object.defineProperty,le=(e,t)=>{let n={};for(var r in e)ce(n,r,{get:e[r],enumerable:!0});return t||ce(n,Symbol.toStringTag,{value:`Module`}),n};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var ue=`(max-width: 700px), (max-height: 500px) and (pointer: coarse)`,de=15e5;function fe(e,t){let n=typeof e.matchMedia==`function`?e.matchMedia.bind(e):()=>({matches:!1}),r=n(`(pointer: coarse)`).matches,i=e.innerWidth||1,a=e.innerHeight||1;return{compactViewport:n(ue).matches,handheld:r&&t.maxTouchPoints>0&&Math.min(i,a)<=700,coarsePointer:r,maxTouchPoints:t.maxTouchPoints||0,viewportWidth:i,viewportHeight:a,devicePixelRatio:e.devicePixelRatio||1}}function pe({devicePixelRatio:e,viewportHeight:t,viewportWidth:n,handheld:r}){let i=Math.max(n,1)*Math.max(t,1);if(!r)return!0;let a=Math.max(1,Math.min(2,Math.sqrt(de/i)));return e<=a?!0:a}function me(e,t){let n=t.handheld&&e.mobileMode===`reduced`;return{canvasPixelRatio:pe(t),intermediateTargetScale:n?.75:1,maximumSampleCount:n?2:4,preferFloatingPointColor:!n,maximumWorkerCount:n?1:2,maximumConcurrentLoadCount:n?2:4,maximumResidentRecordCount:n?25e4:1e6,simulationDimensionScale:n?.5:1,simulationIterationScale:n?.5:1}}function he(e,t){return t.handheld&&e.mobileMode===`unsupported`?e.unsupportedReason||`This example does not support mobile devices.`:void 0}function ge(e){switch(e){case`full`:return`Mobile`;case`reduced`:return`Mobile quality`;case`unsupported`:return`Desktop only`}}function _e(e,t,n){let r=he(e,t);if(r)return{supported:!1,reason:r};let i=e.requirements;if(!i)return{supported:!0};if(!i.backends.some(e=>n.backends.includes(e)))return{supported:!1,reason:`This example requires ${Ee(i.backends)}, but this browser does not expose a compatible graphics backend. Try a current browser on a capable device or use a desktop browser.`};let a=new Set(n.deviceFeatures),o=i.requiredDeviceFeatures?.find(e=>!a.has(e));if(o)return{supported:!1,reason:`This example requires the GPU feature “${o}”. Try a current browser on a capable device or use a desktop browser.`};let s=i.requiredDeviceLimits,c=n.deviceLimits;return s?.maxColorAttachments!==void 0&&(c?.maxColorAttachments??0)<s.maxColorAttachments?{supported:!1,reason:`This example requires ${s.maxColorAttachments} color attachments, but this GPU exposes only ${c?.maxColorAttachments??0}. Try a capable device or desktop browser.`}:s?.maxColorAttachmentBytesPerSample!==void 0&&(c?.maxColorAttachmentBytesPerSample??0)<s.maxColorAttachmentBytesPerSample?{supported:!1,reason:`This example requires ${s.maxColorAttachmentBytesPerSample} color-attachment bytes per sample, but this GPU exposes only ${c?.maxColorAttachmentBytesPerSample??0}. Try a capable device or desktop browser.`}:{supported:!0}}async function ve(){let e=document.documentElement,t=be(document),n=fe(window,navigator),r=_e(t,n,{backends:await ye()}),i=me(t,n);e.dataset.lumaExampleId=t.id,e.dataset.lumaExampleMobileMode=t.mobileMode,e.dataset.lumaExampleQualityProfile=t.mobileProfile,e.dataset.lumaExampleState=r.supported?`loading`:`unsupported`,n.handheld&&typeof i.canvasPixelRatio==`number`&&Object.defineProperty(window,`devicePixelRatio`,{configurable:!0,value:i.canvasPixelRatio});let a=t=>{e.dataset.lumaExampleState!==`unsupported`&&(e.dataset.lumaExampleState=`failed`,Ce(`failed`,Te(t)))},o=()=>{e.dataset.lumaExampleState===`loading`&&(e.dataset.lumaExampleState=`running`)};return window.addEventListener(`error`,e=>a(e.error||e.message)),window.addEventListener(`unhandledrejection`,e=>a(e.reason)),we(),n.handheld&&Se(t.mobileMode),r.supported===!1?Ce(`unsupported`,r.reason):xe(o),{supported:r.supported,reportFailed:a,reportRunning:o}}async function ye(){let e=[];if(`WebGL2RenderingContext`in window&&e.push(`webgl2`),`gpu`in navigator)try{let t=navigator.gpu;t&&await t.requestAdapter()&&e.push(`webgpu`)}catch{}return e}function be(e){let t=t=>e.querySelector(`meta[name="${t}"]`)?.content||void 0,n=t(`luma-example-mobile`),r=t(`luma-example-mobile-profile`),i=(t(`luma-example-backends`)||``).split(`,`).filter(Boolean);return{id:t(`luma-example-id`)||location.pathname,mobileMode:n||`reduced`,mobileProfile:r||`standard`,unsupportedReason:t(`luma-example-mobile-unsupported-reason`),requirements:i.length?{backends:i}:void 0}}function xe(e){let t=!1,n=()=>{if(t)return;let n=document.querySelector(`canvas`),i=n&&n.clientWidth>0&&n.clientHeight>0,a=[...document.body?.querySelectorAll(`*`)||[]].some(e=>{if(e instanceof HTMLScriptElement||e instanceof HTMLStyleElement||e.hasAttribute(`data-luma-example-mobile-badge`)||e.hasAttribute(`data-luma-example-status`))return!1;let t=e.getBoundingClientRect();return t.width>0&&t.height>0&&(e.textContent?.trim()||e.children.length)});(i||a)&&(t=!0,r.disconnect(),requestAnimationFrame(()=>requestAnimationFrame(e)))},r=new MutationObserver(n);r.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener(`load`,n,{once:!0})}function Se(e){let t=document.createElement(`span`);t.dataset.lumaExampleMobileBadge=``,t.setAttribute(`aria-label`,`Mobile support: ${ge(e)}`),t.style.cssText=`position:fixed;left:calc(8px + env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:2147483646;padding:4px 8px;border:1px solid #7dd3fc57;border-radius:999px;background:#020617dd;color:#bae6fd;font:700 11px/1.4 system-ui;pointer-events:none;`,t.textContent=ge(e),document.body.append(t)}function Ce(e,t){document.querySelector(`[data-luma-example-status]`)?.remove();let n=document.createElement(`div`);n.dataset.lumaExampleStatus=e,n.setAttribute(`role`,`alert`),n.style.cssText=`position:fixed;inset:16px;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;border:1px solid #475569;border-radius:12px;background:#020617ee;color:#e2e8f0;font:16px/1.5 system-ui;text-align:center;`;let r=document.createElement(`div`);r.style.maxWidth=`620px`;let i=document.createElement(`strong`);i.style.cssText=`display:block;font-size:20px;margin-bottom:8px;`,i.textContent=e===`unsupported`?`This example is not supported on this device.`:`This example could not start.`;let a=document.createElement(`span`);a.textContent=t,r.append(i,a),n.append(r),document.body.append(n)}function we(){let e=document.createElement(`style`);e.textContent=`
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
  `,document.head.append(e)}function Te(e){return e instanceof Error?e.message:typeof e==`string`?e:`An unexpected error stopped the example.`}function Ee(e){return e.map(e=>e===`webgpu`?`WebGPU`:`WebGL2`).join(` or `)}(await ve()).supported||document.querySelectorAll(`script[type="module"]:not([data-luma-example-support-bootstrap])`).forEach(e=>e.remove());function De(e,t){if(!e)throw Error(t||`loader assertion failed.`)}var Oe={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};Oe.self||Oe.window||Oe.global,Oe.window||Oe.self||Oe.global,Oe.global||Oe.self||Oe.window,Oe.document;var ke=!!(typeof process!=`object`||String(process)!==`[object process]`||process.browser),Ae=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);Ae&&parseFloat(Ae[1]);var je=globalThis;globalThis.document;var Me=globalThis.process||{};globalThis.console,globalThis.navigator;function Ne(e){if(typeof window<`u`&&window.process?.type===`renderer`||typeof process<`u`&&process.versions?.electron)return!0;let t=typeof navigator<`u`&&navigator.userAgent,n=e||t;return!!(n&&n.indexOf(`Electron`)>=0)}function Pe(){return!(typeof process==`object`&&String(process)===`[object process]`&&!process?.browser)||Ne()}var Fe=`4.1.1`;function Ie(e,t){if(!e)throw Error(t||`Assertion failed`)}function Le(e){if(!e)return 0;let t;switch(typeof e){case`number`:t=e;break;case`object`:t=e.logLevel||e.priority||0;break;default:return 0}return Ie(Number.isFinite(t)&&t>=0),t}function Re(e){let{logLevel:t,message:n}=e;e.logLevel=Le(t);let r=e.args?Array.from(e.args):[];for(;r.length&&r.shift()!==n;);switch(typeof t){case`string`:case`function`:n!==void 0&&r.unshift(n),e.message=t;break;case`object`:Object.assign(e,t);break;default:}typeof e.message==`function`&&(e.message=e.message());let i=typeof e.message;return Ie(i===`string`||i===`object`),Object.assign(e,{args:r},e.opts)}var ze=()=>{},Be=class{constructor({level:e=0}={}){this.userData={},this._onceCache=new Set,this._level=e}set level(e){this.setLevel(e)}get level(){return this.getLevel()}setLevel(e){return this._level=e,this}getLevel(){return this._level}warn(e,...t){return this._log(`warn`,0,e,t,{once:!0})}error(e,...t){return this._log(`error`,0,e,t)}log(e,t,...n){return this._log(`log`,e,t,n)}info(e,t,...n){return this._log(`info`,e,t,n)}once(e,t,...n){return this._log(`once`,e,t,n,{once:!0})}_log(e,t,n,r,i={}){let a=Re({logLevel:t,message:n,args:this._buildArgs(t,n,r),opts:i});return this._createLogFunction(e,a,i)}_buildArgs(e,t,n){return[e,t,...n]}_createLogFunction(e,t,n){if(!this._shouldLog(t.logLevel))return ze;let r=this._getOnceTag(n.tag??t.tag??t.message);if((n.once||t.once)&&r!==void 0){if(this._onceCache.has(r))return ze;this._onceCache.add(r)}return this._emit(e,t)}_shouldLog(e){return this.getLevel()>=Le(e)}_getOnceTag(e){if(e!==void 0)try{return typeof e==`string`?e:String(e)}catch{return}}};function Ve(e){try{let t=window[e],n=`__storage_test__`;return t.setItem(n,n),t.removeItem(n),t}catch{return null}}var He=class{constructor(e,t,n=`sessionStorage`){this.storage=Ve(n),this.id=e,this.config=t,this._loadConfiguration()}getConfiguration(){return this.config}setConfiguration(e){if(Object.assign(this.config,e),this.storage){let e=JSON.stringify(this.config);this.storage.setItem(this.id,e)}}_loadConfiguration(){let e={};if(this.storage){let t=this.storage.getItem(this.id);e=t?JSON.parse(t):{}}return Object.assign(this.config,e),this}};function Ue(e){let t;return t=e<10?`${e.toFixed(2)}ms`:e<100?`${e.toFixed(1)}ms`:e<1e3?`${e.toFixed(0)}ms`:`${(e/1e3).toFixed(2)}s`,t}function We(e,t=8){let n=Math.max(t-e.length,0);return`${` `.repeat(n)}${e}`}var Ge;(function(e){e[e.BLACK=30]=`BLACK`,e[e.RED=31]=`RED`,e[e.GREEN=32]=`GREEN`,e[e.YELLOW=33]=`YELLOW`,e[e.BLUE=34]=`BLUE`,e[e.MAGENTA=35]=`MAGENTA`,e[e.CYAN=36]=`CYAN`,e[e.WHITE=37]=`WHITE`,e[e.BRIGHT_BLACK=90]=`BRIGHT_BLACK`,e[e.BRIGHT_RED=91]=`BRIGHT_RED`,e[e.BRIGHT_GREEN=92]=`BRIGHT_GREEN`,e[e.BRIGHT_YELLOW=93]=`BRIGHT_YELLOW`,e[e.BRIGHT_BLUE=94]=`BRIGHT_BLUE`,e[e.BRIGHT_MAGENTA=95]=`BRIGHT_MAGENTA`,e[e.BRIGHT_CYAN=96]=`BRIGHT_CYAN`,e[e.BRIGHT_WHITE=97]=`BRIGHT_WHITE`})(Ge||={});var Ke=10;function qe(e){return typeof e==`string`?(e=e.toUpperCase(),Ge[e]||Ge.WHITE):e}function Je(e,t,n){return!Pe&&typeof e==`string`&&(t&&(e=`\u001b[${qe(t)}m${e}\u001b[39m`),n&&(e=`\u001b[${qe(n)+Ke}m${e}\u001b[49m`)),e}function Ye(e,t=[`constructor`]){let n=Object.getPrototypeOf(e),r=Object.getOwnPropertyNames(n),i=e;for(let n of r){let r=i[n];typeof r==`function`&&(t.find(e=>n===e)||(i[n]=r.bind(e)))}}function Xe(){let e;if(Pe()&&je.performance)e=je?.performance?.now?.();else if(`hrtime`in Me){let t=Me?.hrtime?.();e=t[0]*1e3+t[1]/1e6}else e=Date.now();return e}var Ze={debug:Pe()&&console.debug||console.log,log:console.log,info:console.info,warn:console.warn,error:console.error},Qe={enabled:!0,level:0},$e=class extends Be{constructor({id:e}={id:``}){super({level:0}),this.VERSION=Fe,this._startTs=Xe(),this._deltaTs=Xe(),this.userData={},this.LOG_THROTTLE_TIMEOUT=0,this.id=e,this.userData={},this._storage=new He(`__probe-${this.id}__`,{[this.id]:Qe}),this.timeStamp(`${this.id} started`),Ye(this),Object.seal(this)}isEnabled(){return this._getConfiguration().enabled}getLevel(){return this._getConfiguration().level}getTotal(){return Number((Xe()-this._startTs).toPrecision(10))}getDelta(){return Number((Xe()-this._deltaTs).toPrecision(10))}set priority(e){this.level=e}get priority(){return this.level}getPriority(){return this.level}enable(e=!0){return this._updateConfiguration({enabled:e}),this}setLevel(e){return this._updateConfiguration({level:e}),this}get(e){return this._getConfiguration()[e]}set(e,t){this._updateConfiguration({[e]:t})}settings(){console.table?console.table(this._storage.config):console.log(this._storage.config)}assert(e,t){if(!e)throw Error(t||`Assertion failed`)}warn(e,...t){return this._log(`warn`,0,e,t,{method:Ze.warn,once:!0})}error(e,...t){return this._log(`error`,0,e,t,{method:Ze.error})}deprecated(e,t){return this.warn(`\`${e}\` is deprecated and will be removed \
in a later version. Use \`${t}\` instead`)}removed(e,t){return this.error(`\`${e}\` has been removed. Use \`${t}\` instead`)}probe(e,t,...n){return this._log(`log`,e,t,n,{method:Ze.log,time:!0,once:!0})}log(e,t,...n){return this._log(`log`,e,t,n,{method:Ze.debug})}info(e,t,...n){return this._log(`info`,e,t,n,{method:console.info})}once(e,t,...n){return this._log(`once`,e,t,n,{method:Ze.debug||Ze.info,once:!0})}table(e,t,n){return t?this._log(`table`,e,t,n&&[n]||[],{method:console.table||ze,tag:tt(t)}):ze}time(e,t){return this._log(`time`,e,t,[],{method:console.time?console.time:console.info})}timeEnd(e,t){return this._log(`time`,e,t,[],{method:console.timeEnd?console.timeEnd:console.info})}timeStamp(e,t){return this._log(`time`,e,t,[],{method:console.timeStamp||ze})}group(e,t,n={collapsed:!1}){let r=(n.collapsed?console.groupCollapsed:console.group)||console.info;return this._log(`group`,e,t,[],{method:r})}groupCollapsed(e,t,n={}){return this.group(e,t,Object.assign({},n,{collapsed:!0}))}groupEnd(e){return this._log(`groupEnd`,e,``,[],{method:console.groupEnd||ze})}withGroup(e,t,n){this.group(e,t)();try{n()}finally{this.groupEnd(e)()}}trace(){console.trace&&console.trace()}_shouldLog(e){return this.isEnabled()&&super._shouldLog(e)}_emit(e,t){let n=t.method;Ie(n),t.total=this.getTotal(),t.delta=this.getDelta(),this._deltaTs=Xe();let r=et(this.id,t.message,t);return n.bind(console,r,...t.args)}_getConfiguration(){return this._storage.config[this.id]||this._updateConfiguration(Qe),this._storage.config[this.id]}_updateConfiguration(e){let t=this._storage.config[this.id]||{...Qe};this._storage.setConfiguration({[this.id]:{...t,...e}})}};$e.VERSION=Fe;function et(e,t,n){if(typeof t==`string`){let r=n.time?We(Ue(n.total)):``;t=n.time?`${e}: ${r}  ${t}`:`${e}: ${t}`,t=Je(t,n.color,n.background)}return t}function tt(e){for(let t in e)for(let n in e[t])return n||`untitled`;return`empty`}var nt=`v4.5.2`;function rt(){let e=new $e({id:`loaders.gl`});return globalThis.loaders||={},globalThis.loaders.log=e,globalThis.loaders.version=nt,globalThis.probe||={},globalThis.probe.loaders=e,e}var it=rt(),at=e=>typeof e==`boolean`,ot=e=>typeof e==`function`,st=e=>typeof e==`object`&&!!e,ct=e=>st(e)&&e.constructor==={}.constructor,lt=e=>typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer,ut=e=>st(e)&&typeof e.byteLength==`number`&&typeof e.slice==`function`,dt=e=>!!e&&ot(e[Symbol.iterator]),ft=e=>!!e&&ot(e[Symbol.asyncIterator]),pt=e=>typeof Response<`u`&&e instanceof Response||st(e)&&ot(e.arrayBuffer)&&ot(e.text)&&ot(e.json),mt=e=>typeof Blob<`u`&&e instanceof Blob,ht=e=>typeof ReadableStream<`u`&&e instanceof ReadableStream||st(e)&&ot(e.tee)&&ot(e.cancel)&&ot(e.getReader),gt=e=>st(e)&&ot(e.read)&&ot(e.pipe)&&at(e.readable),_t=e=>ht(e)||gt(e);function vt(e,t){return yt(e||{},t)}function yt(e,t,n=0){if(n>3)return t;let r={...e};for(let[e,i]of Object.entries(t))i&&typeof i==`object`&&!Array.isArray(i)?r[e]=yt(r[e]||{},t[e],n+1):r[e]=t[e];return r}var bt=`latest`;function xt(){return globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version=`4.5.2`),globalThis._loadersgl_.version}var St=xt();function Ct(e,t){if(!e)throw Error(t||`loaders.gl assertion failed.`)}var wt={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};wt.self||wt.window||wt.global,wt.window||wt.self||wt.global,wt.global||wt.self||wt.window,wt.document;var Tt=typeof process!=`object`||String(process)!==`[object process]`||process.browser,Et=typeof window<`u`&&window.orientation!==void 0,Dt=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);Dt&&parseFloat(Dt[1]);var Ot=class{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t){this.workerThread.postMessage({source:`loaders.gl`,type:e,payload:t})}done(e){Ct(this.isRunning),this.isRunning=!1,this._resolve(e)}error(e){Ct(this.isRunning),this.isRunning=!1,this._reject(e)}},kt=class{terminate(){}},At=new Map;function jt(e){Ct(e.source&&!e.url||!e.source&&e.url);let t=At.get(e.source||e.url);return t||(e.url&&(t=Mt(e.url),At.set(e.url,t)),e.source&&(t=Nt(e.source),At.set(e.source,t))),Ct(t),t}function Mt(e){return e.startsWith(`http`)?Nt(Pt(e)):e}function Nt(e){let t=new Blob([e],{type:`application/javascript`});return URL.createObjectURL(t)}function Pt(e){return`\
try {
  importScripts('${e}');
} catch (error) {
  console.error(error);
  throw error;
}`}function Ft(e,t=!0,n){let r=n||new Set;if(e){if(It(e))r.add(e);else if(It(e.buffer))r.add(e.buffer);else if(!ArrayBuffer.isView(e)&&t&&typeof e==`object`)for(let n in e)Ft(e[n],t,r)}return n===void 0?Array.from(r):[]}function It(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}var Lt=()=>{},Rt=class{name;source;url;terminated=!1;worker;onMessage;onError;_loadableURL=``;static isSupported(){return typeof Worker<`u`&&Tt||kt!==void 0&&!Tt}constructor(e){let{name:t,source:n,url:r}=e;Ct(n||r),this.name=t,this.source=n,this.url=r,this.onMessage=Lt,this.onError=e=>console.log(e),this.worker=Tt?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=Lt,this.onError=Lt,this.worker.terminate(),this.terminated=!0}get isRunning(){return!!this.onMessage}postMessage(e,t){t||=Ft(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t=`Failed to load `;return t+=`worker ${this.name} from ${this.url}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){this._loadableURL=jt({source:this.source,url:this.url});let e=new Worker(this._loadableURL,{name:this.name});return e.onmessage=e=>{e.data?this.onMessage(e.data):this.onError(Error(`No data received`))},e.onerror=e=>{this.onError(this._getErrorFromErrorEvent(e)),this.terminated=!0},e.onmessageerror=e=>console.error(e),e}_createNodeWorker(){let e;if(this.url)e=new kt(this.url.includes(`:/`)||this.url.startsWith(`/`)?this.url:`./${this.url}`,{eval:!1,type:this.url.endsWith(`.ts`)||this.url.endsWith(`.mjs`)?`module`:`commonjs`});else if(this.source)e=new kt(this.source,{eval:!0});else throw Error(`no worker`);return e.on(`message`,e=>{this.onMessage(e)}),e.on(`error`,e=>{this.onError(e)}),e.on(`exit`,e=>{}),e}},zt=class{name=`unnamed`;source;url;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];count=0;isDestroyed=!1;static isSupported(){return Rt.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.setProps(e)}destroy(){this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},e.name!==void 0&&(this.name=e.name),e.maxConcurrency!==void 0&&(this.maxConcurrency=e.maxConcurrency),e.maxMobileConcurrency!==void 0&&(this.maxMobileConcurrency=e.maxMobileConcurrency),e.reuseWorkers!==void 0&&(this.reuseWorkers=e.reuseWorkers),e.onDebug!==void 0&&(this.onDebug=e.onDebug)}async startJob(e,t=(e,t,n)=>e.done(n),n=(e,t)=>e.error(t)){let r=new Promise(r=>(this.jobQueue.push({name:e,onMessage:t,onError:n,onStart:r}),this));return this._startQueuedJob(),await r}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:`Starting job`,name:t.name,workerThread:e,backlog:this.jobQueue.length});let n=new Ot(t.name,e);e.onMessage=e=>t.onMessage(n,e.type,e.payload),e.onError=e=>t.onError(n,e),t.onStart(n);try{await n.result}catch(e){console.error(`Worker exception: ${e}`)}finally{this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){!Tt||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.destroy(),this.count--):this.idleQueue.push(e),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){return this.idleQueue.length>0?this.idleQueue.shift()||null:this.count<this._getMaxConcurrency()?(this.count++,new Rt({name:`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`,source:this.source,url:this.url})):null}_getMaxConcurrency(){return Et?this.maxMobileConcurrency:this.maxConcurrency}},Bt={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}},Vt=class e{props;workerPools=new Map;static _workerFarm;static isSupported(){return Rt.isSupported()}static getWorkerFarm(t={}){return e._workerFarm=e._workerFarm||new e({}),e._workerFarm.setProps(t),e._workerFarm}constructor(e){this.props={...Bt},this.setProps(e),this.workerPools=new Map}destroy(){for(let e of this.workerPools.values())e.destroy();this.workerPools=new Map}setProps(e){this.props={...this.props,...e};for(let e of this.workerPools.values())e.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:n,url:r}=e,i=this.workerPools.get(t);return i||(i=new zt({name:t,source:n,url:r}),i.setProps(this._getWorkerPoolProps()),this.workerPools.set(t,i)),i}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}};function Ht(e,t={}){let n=t[e.id]||{},r=Tt?e.workerFile||`${e.id}-worker.js`:`${e.id}-worker-node.js`,i=n.workerUrl;if(!i&&e.id===`compression`&&(i=t.workerUrl),(t._workerType||t?.core?._workerType)===`test`&&(i=Tt?`modules/${e.module}/dist/${r}`:`modules/${e.module}/src/workers/${e.id}-worker-node.ts`),!i){let t=e.version;t===`latest`&&(t=bt);let n=t?`@${t}`:``;i=`https://unpkg.com/@loaders.gl/${e.module}${n}/dist/${r}`}return Ct(i),i}function Ut(e,t=St){Ct(e,`no worker provided`);let n=e.version;return!(!t||!n)}function Wt(e,t){if(!Vt.isSupported())return!1;let n=t?._nodeWorkers??t?.core?._nodeWorkers;if(!Tt&&!n)return!1;let r=t?.worker??t?.core?.worker;return!!(e.worker&&r)}async function Gt(e,t,n,r,i){let a=e.id,o=Ht(e,n),s=Vt.getWorkerFarm(n?.core).getWorkerPool({name:a,url:o});n=JSON.parse(JSON.stringify(n||{})),n._workerLoaderId=e.id,r=JSON.parse(JSON.stringify(r||{}));let c=await s.startJob(`process-on-worker`,Kt.bind(null,i));return c.postMessage(`process`,{input:t,options:n,context:r}),await(await c.result).result}async function Kt(e,t,n,r){switch(n){case`done`:t.done(r);break;case`error`:t.error(Error(r.error));break;case`process`:let{id:i,input:a,options:o}=r;try{let n=await e(a,o);t.postMessage(`done`,{id:i,result:n})}catch(e){let n=e instanceof Error?e.message:`unknown error`;t.postMessage(`error`,{id:i,error:n})}break;default:console.warn(`parse-with-worker unknown message ${n}`)}}function qt(e,t,n){if(n||=e.byteLength,e.byteLength<n||t.byteLength<n)return!1;let r=new Uint8Array(e),i=new Uint8Array(t);for(let e=0;e<r.length;++e)if(r[e]!==i[e])return!1;return!0}function Jt(...e){return Yt(e)}function Yt(e){let t=e.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),n=t.reduce((e,t)=>e+t.byteLength,0),r=new Uint8Array(n),i=0;for(let e of t)r.set(e,i),i+=e.byteLength;return r.buffer}async function Xt(e){let t=[];for await(let n of e)t.push(Zt(n));return Jt(...t)}function Zt(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:n,byteLength:r}=e;return Qt(t,n,r)}return Qt(e)}function Qt(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function $t(){let e;if(typeof window<`u`&&window.performance)e=window.performance.now();else if(typeof process<`u`&&process.hrtime){let t=process.hrtime();e=t[0]*1e3+t[1]/1e6}else e=Date.now();return e}var en=class{constructor(e,t){this.sampleSize=1,this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this.name=e,this.type=t,this.reset()}reset(){return this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this}setSampleSize(e){return this.sampleSize=e,this}incrementCount(){return this.addCount(1),this}decrementCount(){return this.subtractCount(1),this}addCount(e){return this._count+=e,this._samples++,this._checkSampling(),this}subtractCount(e){return this._count-=e,this._samples++,this._checkSampling(),this}addTime(e){return this._time+=e,this.lastTiming=e,this._samples++,this._checkSampling(),this}timeStart(){return this._startTime=$t(),this._timerPending=!0,this}timeEnd(){return this._timerPending?(this.addTime($t()-this._startTime),this._timerPending=!1,this._checkSampling(),this):this}getSampleAverageCount(){return this.sampleSize>0?this.lastSampleCount/this.sampleSize:0}getSampleAverageTime(){return this.sampleSize>0?this.lastSampleTime/this.sampleSize:0}getSampleHz(){return this.lastSampleTime>0?this.sampleSize/(this.lastSampleTime/1e3):0}getAverageCount(){return this.samples>0?this.count/this.samples:0}getAverageTime(){return this.samples>0?this.time/this.samples:0}getHz(){return this.time>0?this.samples/(this.time/1e3):0}_checkSampling(){this._samples===this.sampleSize&&(this.lastSampleTime=this._time,this.lastSampleCount=this._count,this.count+=this._count,this.time+=this._time,this.samples+=this._samples,this._time=0,this._count=0,this._samples=0)}},tn=class{constructor(e){this.stats={},this.id=e.id,this.stats={},this._initializeStats(e.stats),Object.seal(this)}get(e,t=`count`){return this._getOrCreate({name:e,type:t})}get size(){return Object.keys(this.stats).length}reset(){for(let e of Object.values(this.stats))e.reset();return this}forEach(e){for(let t of Object.values(this.stats))e(t)}getTable(){let e={};return this.forEach(t=>{e[t.name]={time:t.time||0,count:t.count||0,average:t.getAverageTime()||0,hz:t.getHz()||0}}),e}_initializeStats(e=[]){e.forEach(e=>this._getOrCreate(e))}_getOrCreate(e){let{name:t,type:n}=e,r=this.stats[t];return r||(r=e instanceof en?e:new en(t,n),this.stats[t]=r),r}},nn=``,rn={};function an(e){for(let t in rn)if(e.startsWith(t)){let n=rn[t];e=e.replace(t,n)}return!e.startsWith(`http://`)&&!e.startsWith(`https://`)&&(e=`${nn}${e}`),e}function on(e){return e}function sn(e){return e&&typeof e==`object`&&e.isBuffer}function cn(e){if(sn(e))return on(e);if(e instanceof ArrayBuffer)return e;if(lt(e))return un(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return e.byteOffset===0&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if(typeof e==`string`){let t=e;return new TextEncoder().encode(t).buffer}if(e&&typeof e==`object`&&e._toArrayBuffer)return e._toArrayBuffer();throw Error(`toArrayBuffer`)}function ln(e){if(e instanceof ArrayBuffer)return e;if(lt(e))return un(e);let{buffer:t,byteOffset:n,byteLength:r}=e;return t instanceof ArrayBuffer&&n===0&&r===t.byteLength?t:un(t,n,r)}function un(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function dn(e){return ArrayBuffer.isView(e)?e:new Uint8Array(e)}function fn(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(t+1):e}function pn(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(0,t):``}var mn=class extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response},hn=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,gn=/^([-\w.]+\/[-\w.+]+)/;function _n(e,t){return e.toLowerCase()===t.toLowerCase()}function vn(e){let t=gn.exec(e);return t?t[1]:e}function yn(e){let t=hn.exec(e);return t?t[1]:``}var bn=/\?.*/;function xn(e){let t=e.match(bn);return t&&t[0]}function Sn(e){return e.replace(bn,``)}function Cn(e){if(e.length<50)return e;let t=e.slice(e.length-15);return`${e.substr(0,32)}...${t}`}function wn(e){return pt(e)?e.url:mt(e)?(`name`in e?e.name:``)||``:typeof e==`string`?e:``}function Tn(e){if(pt(e)){let t=e.headers.get(`content-type`)||``,n=Sn(e.url);return vn(t)||yn(n)}return mt(e)?e.type||``:typeof e==`string`?yn(e):``}function En(e){return pt(e)?e.headers[`content-length`]||-1:mt(e)?e.size:typeof e==`string`?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}async function Dn(e){if(pt(e))return e;let t={},n=En(e);n>=0&&(t[`content-length`]=String(n));let r=wn(e),i=Tn(e);i&&(t[`content-type`]=i);let a=await An(e);a&&(t[`x-first-bytes`]=a),typeof e==`string`&&(e=new TextEncoder().encode(e));let o=new Response(e,{headers:t});return Object.defineProperty(o,`url`,{value:r}),o}async function On(e){if(!e.ok)throw await kn(e)}async function kn(e){let t=Cn(e.url),n=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;n=n.length>100?`${n.slice(0,100)}...`:n;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get(`Content-Type`);r.reason=!e.bodyUsed&&t?.includes(`application/json`)?await e.json():await e.text()}catch{}return new mn(n,r)}async function An(e){if(typeof e==`string`)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let n=new FileReader;n.onload=t=>e(t?.target?.result),n.readAsDataURL(t)})}return e instanceof ArrayBuffer?`data:base64,${jn(e.slice(0,5))}`:null}function jn(e){let t=``,n=new Uint8Array(e);for(let e=0;e<n.byteLength;e++)t+=String.fromCharCode(n[e]);return btoa(t)}function Mn(e){return!Nn(e)&&!Pn(e)}function Nn(e){return e.startsWith(`http:`)||e.startsWith(`https:`)}function Pn(e){return e.startsWith(`data:`)}async function Fn(e,t){if(typeof e==`string`){let n=an(e);return Mn(n)&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(n,t):await fetch(n,t)}return await Dn(e)}var In=new $e({id:`loaders.gl`}),Ln=class{log(){return()=>{}}info(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}},Rn={core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,log:new class{console;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,CDN:`https://unpkg.com/@loaders.gl`,worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:ke,_nodeWorkers:!1,_workerType:``,limit:0,_limitMB:0,batchSize:`auto`,batchDebounceMs:0,metadata:!1,transforms:[]}},zn={baseUri:`core.baseUrl`,fetch:`core.fetch`,mimeType:`core.mimeType`,fallbackMimeType:`core.fallbackMimeType`,ignoreRegisteredLoaders:`core.ignoreRegisteredLoaders`,nothrow:`core.nothrow`,log:`core.log`,useLocalLibraries:`core.useLocalLibraries`,CDN:`core.CDN`,worker:`core.worker`,maxConcurrency:`core.maxConcurrency`,maxMobileConcurrency:`core.maxMobileConcurrency`,reuseWorkers:`core.reuseWorkers`,_nodeWorkers:`core.nodeWorkers`,_workerType:`core._workerType`,_worker:`core._workerType`,limit:`core.limit`,_limitMB:`core._limitMB`,batchSize:`core.batchSize`,batchDebounceMs:`core.batchDebounceMs`,metadata:`core.metadata`,transforms:`core.transforms`,throws:`nothrow`,dataType:`(no longer used)`,uri:`core.baseUrl`,method:`core.fetch.method`,headers:`core.fetch.headers`,body:`core.fetch.body`,mode:`core.fetch.mode`,credentials:`core.fetch.credentials`,cache:`core.fetch.cache`,redirect:`core.fetch.redirect`,referrer:`core.fetch.referrer`,referrerPolicy:`core.fetch.referrerPolicy`,integrity:`core.fetch.integrity`,keepalive:`core.fetch.keepalive`,signal:`core.fetch.signal`},Bn=[`baseUrl`,`fetch`,`mimeType`,`fallbackMimeType`,`ignoreRegisteredLoaders`,`nothrow`,`log`,`useLocalLibraries`,`CDN`,`worker`,`maxConcurrency`,`maxMobileConcurrency`,`reuseWorkers`,`_nodeWorkers`,`_workerType`,`limit`,`_limitMB`,`batchSize`,`batchDebounceMs`,`metadata`,`transforms`];function Vn(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||={},e._state}function Hn(){let e=Vn();return e.globalOptions=e.globalOptions||{...Rn,core:{...Rn.core}},Wn(e.globalOptions)}function Un(e,t,n,r){return n||=[],n=Array.isArray(n)?n:[n],Gn(e,n),Wn(Jn(t,e,r))}function Wn(e){let t=Zn(e);Qn(t);for(let e of Bn)t.core&&t.core[e]!==void 0&&delete t[e];return t.core&&t.core._workerType!==void 0&&delete t._worker,t}function Gn(e,t){Kn(e,null,Rn,zn,t);for(let n of t){let r=e&&e[n.id]||{},i=n.options&&n.options[n.id]||{},a=n.deprecatedOptions&&n.deprecatedOptions[n.id]||{};Kn(r,n.id,i,a,t)}}function Kn(e,t,n,r,i){let a=t||`Top level`,o=t?`${t}.`:``;for(let s in e){let c=!t&&st(e[s]),l=s===`baseUri`&&!t,u=s===`workerUrl`&&t;if(!(s in n)&&!l&&!u){if(s in r)In.level>0&&In.warn(`${a} loader option \'${o}${s}\' no longer supported, use \'${r[s]}\'`)();else if(!c&&In.level>0){let e=qn(s,i);In.warn(`${a} loader option \'${o}${s}\' not recognized. ${e}`)()}}}}function qn(e,t){let n=e.toLowerCase(),r=``;for(let i of t)for(let t in i.options){if(e===t)return`Did you mean \'${i.id}.${t}\'?`;let a=t.toLowerCase();(n.startsWith(a)||a.startsWith(n))&&(r||=`Did you mean \'${i.id}.${t}\'?`)}return r}function Jn(e,t,n){let r=e.options||{},i={...r};return r.core&&(i.core={...r.core}),Qn(i),i.core?.log===null&&(i.core={...i.core,log:new Ln}),Yn(i,Wn(Hn())),Yn(i,Wn(t)),Xn(i,n),$n(i),i}function Yn(e,t){for(let n in t)if(n in t){let r=t[n];ct(r)&&ct(e[n])?e[n]={...e[n],...t[n]}:e[n]=t[n]}}function Xn(e,t){t&&e.core?.baseUrl===void 0&&(e.core||={},e.core.baseUrl=pn(Sn(t)))}function Zn(e){let t={...e};return e.core&&(t.core={...e.core}),t}function Qn(e){e.baseUri!==void 0&&(e.core||={},e.core.baseUrl===void 0&&(e.core.baseUrl=e.baseUri));for(let t of Bn)if(e[t]!==void 0){let n=e.core=e.core||{};n[t]===void 0&&(n[t]=e[t])}let t=e._worker;t!==void 0&&(e.core||={},e.core._workerType===void 0&&(e.core._workerType=t))}function $n(e){let t=e.core;if(t)for(let n of Bn)t[n]!==void 0&&(e[n]=t[n])}function er(e){return e?(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions)):!1}function tr(e){De(e,`null loader`),De(er(e),`invalid loader`);let t;return Array.isArray(e)&&(t=e[1],e=e[0],e={...e,options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}var nr=()=>{let e=Vn();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function rr(e){let t=nr();e=Array.isArray(e)?e:[e];for(let n of e){let e=tr(n);t.find(t=>e===t)||t.unshift(e)}}function ir(){return nr()}var ar=/\.([^.]+)$/;async function or(e,t=[],n,r){if(!ur(e))return null;let i=Wn(n||{});if(i.core||={},e instanceof Response&&sr(e)){let n=cr(await e.clone().text(),t,{...i,core:{...i.core,nothrow:!0}},r);if(n)return n}let a=cr(e,t,{...i,core:{...i.core,nothrow:!0}},r);if(a)return a;if(mt(e)&&(e=await e.slice(0,10).arrayBuffer(),a=cr(e,t,i,r)),!a&&e instanceof Response&&sr(e)&&(a=cr(await e.clone().text(),t,i,r)),!a&&!i.core.nothrow)throw Error(dr(e));return a}function sr(e){let t=Tn(e);return!!(t&&(t.startsWith(`text/`)||t===`application/json`||t.endsWith(`+json`)))}function cr(e,t=[],n,r){if(!ur(e))return null;let i=Wn(n||{});if(i.core||={},t&&!Array.isArray(t))return tr(t);let a=[];t&&(a=a.concat(t)),i.core.ignoreRegisteredLoaders||a.push(...ir()),fr(a);let o=lr(e,a,i,r);if(!o&&!i.core.nothrow)throw Error(dr(e));return o}function lr(e,t,n,r){let i=wn(e),a=Tn(e),o=Sn(i)||r?.url,s=null,c=``;return n?.core?.mimeType&&(s=hr(t,n?.core?.mimeType),c=`match forced by supplied MIME type ${n?.core?.mimeType}`),s||=pr(t,o),c||=s?`matched url ${o}`:``,s||=hr(t,a),c||=s?`matched MIME type ${a}`:``,s||=gr(t,e),c||=s?`matched initial data ${br(e)}`:``,n?.core?.fallbackMimeType&&(s||=hr(t,n?.core?.fallbackMimeType),c||=s?`matched fallback MIME type ${a}`:``),c&&it.log(1,`selectLoader selected ${s?.name}: ${c}.`),s}function ur(e){return!(e instanceof Response&&e.status===204)}function dr(e){let t=wn(e),n=Tn(e),r=`No valid loader found (`;r+=t?`${fn(t)}, `:`no url provided, `,r+=`MIME type: ${n?`"${n}"`:`not provided`}, `;let i=e?br(e):``;return r+=i?` first bytes: "${i}"`:`first bytes: not available`,r+=`)`,r}function fr(e){for(let t of e)tr(t)}function pr(e,t){let n=t&&ar.exec(t),r=n&&n[1];return r?mr(e,r):null}function mr(e,t){t=t.toLowerCase();for(let n of e)for(let e of n.extensions)if(e.toLowerCase()===t)return n;return null}function hr(e,t){for(let n of e)if(n.mimeTypes?.some(e=>_n(t,e))||_n(t,`application/x.${n.id}`))return n;return null}function gr(e,t){if(!t)return null;for(let n of e)if(typeof t==`string`){if(_r(t,n))return n}else if(ArrayBuffer.isView(t)){if(vr(t.buffer,t.byteOffset,n))return n}else if(t instanceof ArrayBuffer&&vr(t,0,n))return n;return null}function _r(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}function vr(e,t,n){return(Array.isArray(n.tests)?n.tests:[n.tests]).some(r=>yr(e,t,n,r))}function yr(e,t,n,r){if(ut(r))return qt(r,e,r.byteLength);switch(typeof r){case`function`:return r(ln(e));case`string`:return r===xr(e,t,r.length);default:return!1}}function br(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?xr(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?xr(e,0,t):``}function xr(e,t,n){if(e.byteLength<t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}var Sr=256*1024;function*Cr(e,t){let n=t?.chunkSize||Sr,r=0,i=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,n),a=e.slice(r,r+t);r+=t,yield ln(i.encode(a))}}var wr=256*1024;function*Tr(e,t={}){let{chunkSize:n=wr}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,n),i=new ArrayBuffer(t),a=new Uint8Array(e,r,t);new Uint8Array(i).set(a),r+=t,yield i}}var Er=1024*1024;async function*Dr(e,t){let n=t?.chunkSize||Er,r=0;for(;r<e.size;){let t=r+n,i=await e.slice(r,t).arrayBuffer();r=t,yield i}}function Or(e,t){return ke?kr(e,t):Ar(e,t)}async function*kr(e,t){let n=e.getReader(),r;try{for(;;){let e=r||n.read();t?._streamReadAhead&&(r=n.read());let{done:i,value:a}=await e;if(i)return;yield cn(a)}}catch{n.releaseLock()}}async function*Ar(e,t){for await(let t of e)yield cn(t)}function jr(e,t){if(typeof e==`string`)return Cr(e,t);if(e instanceof ArrayBuffer)return Tr(e,t);if(mt(e))return Dr(e,t);if(_t(e))return Or(e,t);if(pt(e)){let n=e.body;if(!n)throw Error(`Readable stream not available on Response`);return Or(n,t)}throw Error(`makeIterator`)}var Mr=`Cannot convert supplied data type`;function Nr(e,t,n){if(t.text&&typeof e==`string`)return e;if(sn(e)&&(e=e.buffer),ut(e)){let n=dn(e);return t.text&&!t.binary?new TextDecoder(`utf8`).decode(n):cn(n)}throw Error(Mr)}async function Pr(e,t,n){if(typeof e==`string`||ut(e))return Nr(e,t,n);if(mt(e)&&(e=await Dn(e)),pt(e))return await On(e),t.binary?await e.arrayBuffer():await e.text();if(_t(e)&&(e=jr(e,n)),dt(e)||ft(e))return Xt(e);throw Error(Mr)}function Fr(e,t){let n=Hn(),r=e||n,i=r.fetch??r.core?.fetch;return typeof i==`function`?i:st(i)?e=>Fn(e,i):t?.fetch?t?.fetch:Fn}function Ir(e,t,n){if(n)return n;let r={fetch:Fr(t,e),...e};if(r.url){let e=Sn(r.url);r.baseUrl=e,r.queryString=xn(r.url),r.filename=fn(e),r.baseUrl=pn(e)}return Array.isArray(r.loaders)||(r.loaders=null),r}function Lr(e,t){if(e&&!Array.isArray(e))return e;let n;if(e&&(n=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];n=n?[...n,...e]:e}return n&&n.length?n:void 0}async function Rr(e,t,n,r){t&&!Array.isArray(t)&&!er(t)&&(r=void 0,n=t,t=void 0),e=await e,n||={};let i=wn(e),a=Lr(t,r),o=await or(e,a,n);if(!o)return null;let s=Un(n,o,a,i);return r=Ir({url:i,_parse:Rr,loaders:a},s,r||null),await zr(o,e,s,r)}async function zr(e,t,n,r){if(Ut(e),n=vt(e.options,n),pt(t)){let{ok:e,redirected:n,status:i,statusText:a,type:o,url:s}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:n,status:i,statusText:a,type:o,url:s}}t=await Pr(t,e,n);let i=e;if(i.parseTextSync&&typeof t==`string`)return i.parseTextSync(t,n,r);if(Wt(e,n))return await Gt(e,t,n,r,Rr);if(i.parseText&&typeof t==`string`)return await i.parseText(t,n,r);if(i.parse)return await i.parse(t,n,r);throw Ct(!i.parseSync),Error(`${e.id} loader - no parser found and worker is disabled`)}async function Br(e,t,n,r){let i,a;!Array.isArray(t)&&!er(t)?(i=[],a=t,r=void 0):(i=t,a=n);let o=Fr(a),s=e;return typeof e==`string`&&(s=await o(e)),mt(e)&&(s=await o(e)),typeof e==`string`&&(Wn(a||{}).core?.baseUrl||(a={...a,core:{...a?.core,baseUrl:e}})),await Rr(s,i,a)}var Vr=`4.5.2`,Hr=globalThis.loaders?.parseImageNode,Ur=typeof Image<`u`,Wr=typeof ImageBitmap<`u`,Gr=ke?!0:!!Hr;function Kr(e){switch(e){case`auto`:return Wr||Ur||Gr;case`imagebitmap`:return Wr;case`image`:return Ur;case`data`:return Gr;default:throw Error(`@loaders.gl/images: image ${e} not supported in this environment`)}}function qr(){if(Wr)return`imagebitmap`;if(Ur)return`image`;if(Gr)return`data`;throw Error(`Install '@loaders.gl/polyfills' to parse images under Node.js`)}function Jr(e){let t=Xr(e);if(!t)throw Error(`Not an image`);return t}function Yr(e){switch(Jr(e)){case`data`:return e;case`image`:case`imagebitmap`:let t=document.createElement(`canvas`),n=t.getContext(`2d`);if(!n)throw Error(`getImageData`);return t.width=e.width,t.height=e.height,n.drawImage(e,0,0),n.getImageData(0,0,e.width,e.height);default:throw Error(`getImageData`)}}function Xr(e){return typeof ImageBitmap<`u`&&e instanceof ImageBitmap?`imagebitmap`:typeof Image<`u`&&e instanceof Image?`image`:e&&typeof e==`object`&&e.data&&e.width&&e.height?`data`:null}var Zr=/^data:image\/svg\+xml/,Qr=/\.svg((\?|#).*)?$/;function $r(e){return e&&(Zr.test(e)||Qr.test(e))}function ei(e,t){if($r(t)){let t=new TextDecoder().decode(e);try{typeof unescape==`function`&&typeof encodeURIComponent==`function`&&(t=unescape(encodeURIComponent(t)))}catch(e){throw Error(e.message)}return`data:image/svg+xml;base64,${btoa(t)}`}return ti(e,t)}function ti(e,t){if($r(t))throw Error(`SVG cannot be parsed directly to imagebitmap`);return new Blob([new Uint8Array(e)])}async function ni(e,t,n){let r=ei(e,n),i=self.URL||self.webkitURL,a=typeof r!=`string`&&i.createObjectURL(r);try{return await ri(a||r,t)}finally{a&&i.revokeObjectURL(a)}}async function ri(e,t){let n=new Image;return n.src=e,t.image&&t.image.decode&&n.decode?(await n.decode(),n):await new Promise((e,t)=>{try{n.onload=()=>e(n),n.onerror=e=>{let n=e instanceof Error?e.message:`error`;t(Error(n))}}catch(e){t(e)}})}var ii=!0;async function ai(e,t,n){let r;r=$r(n)?await ni(e,t,n):ti(e,n);let i=t&&t.imagebitmap;return await oi(r,i)}async function oi(e,t=null){if((si(t)||!ii)&&(t=null),t)try{return await createImageBitmap(e,t)}catch(e){console.warn(e),ii=!1}return await createImageBitmap(e)}function si(e){if(!e)return!0;for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function ci(e){return!fi(e,`ftyp`,4)||!(e[8]&96)?null:li(e)}function li(e){switch(ui(e,8,12).replace(`\0`,` `).trim()){case`avif`:case`avis`:return{extension:`avif`,mimeType:`image/avif`};default:return null}}function ui(e,t,n){return String.fromCharCode(...e.slice(t,n))}function di(e){return[...e].map(e=>e.charCodeAt(0))}function fi(e,t,n=0){let r=di(t);for(let t=0;t<r.length;++t)if(r[t]!==e[t+n])return!1;return!0}var N=!1,pi=!0;function mi(e){let t=xi(e);return gi(t)||yi(t)||_i(t)||vi(t)||hi(t)}function hi(e){let t=ci(new Uint8Array(e instanceof DataView?e.buffer:e));return t?{mimeType:t.mimeType,width:0,height:0}:null}function gi(e){let t=xi(e);return t.byteLength>=24&&t.getUint32(0,N)===2303741511?{mimeType:`image/png`,width:t.getUint32(16,N),height:t.getUint32(20,N)}:null}function _i(e){let t=xi(e);return t.byteLength>=10&&t.getUint32(0,N)===1195984440?{mimeType:`image/gif`,width:t.getUint16(6,pi),height:t.getUint16(8,pi)}:null}function vi(e){let t=xi(e);return t.byteLength>=14&&t.getUint16(0,N)===16973&&t.getUint32(2,pi)===t.byteLength?{mimeType:`image/bmp`,width:t.getUint32(18,pi),height:t.getUint32(22,pi)}:null}function yi(e){let t=xi(e);if(!(t.byteLength>=3&&t.getUint16(0,N)===65496&&t.getUint8(2)===255))return null;let{tableMarkers:n,sofMarkers:r}=bi(),i=2;for(;i+9<t.byteLength;){let e=t.getUint16(i,N);if(r.has(e))return{mimeType:`image/jpeg`,height:t.getUint16(i+5,N),width:t.getUint16(i+7,N)};if(!n.has(e))return null;i+=2,i+=t.getUint16(i,N)}return null}function bi(){let e=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)e.add(t);return{tableMarkers:e,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}function xi(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw Error(`toDataView`)}async function Si(e,t){let{mimeType:n}=mi(e)||{},r=globalThis.loaders?.parseImageNode;return De(r),await r(e,n)}async function Ci(e,t,n){t||={};let r=(t.image||{}).type||`auto`,{url:i}=n||{},a=wi(r),o;switch(a){case`imagebitmap`:o=await ai(e,t,i);break;case`image`:o=await ni(e,t,i);break;case`data`:o=await Si(e,t);break;default:De(!1)}return r===`data`&&(o=Yr(o)),o}function wi(e){switch(e){case`auto`:case`data`:return qr();default:return Kr(e),e}}var Ti={dataType:null,batchType:null,id:`image`,module:`images`,name:`Images`,version:Vr,mimeTypes:[`image/png`,`image/jpeg`,`image/gif`,`image/webp`,`image/avif`,`image/bmp`,`image/vnd.microsoft.icon`,`image/svg+xml`],extensions:[`png`,`jpg`,`jpeg`,`gif`,`webp`,`bmp`,`ico`,`svg`,`avif`],parse:Ci,tests:[e=>!!mi(new DataView(e))],options:{image:{type:`auto`,decode:!0}}},P=new $e({id:`deck`}),Ei={};function Di(e){Ei=e}function F(e,t,n,r){P.level>0&&Ei[e]&&Ei[e].call(null,t,n,r)}function Oi(e){let t=e[0],n=e[e.length-1];return t===`{`&&n===`}`||t===`[`&&n===`]`}var ki={dataType:null,batchType:null,id:`JSON`,name:`JSON`,module:``,version:``,options:{},extensions:[`json`,`geojson`],mimeTypes:[`application/json`,`application/geo+json`],testText:Oi,parseTextSync:JSON.parse};function Ai(){let e=`9.4.0`,t=globalThis.deck&&globalThis.deck.VERSION;if(t&&t!==e)throw Error(`deck.gl - multiple versions detected: ${t} vs ${e}`);return t||(P.log(1,`deck.gl ${e}`)(),globalThis.deck={...globalThis.deck,VERSION:e,version:e,log:P,_registerLoggers:Di},rr([ki,[Ti,{imagebitmap:{premultiplyAlpha:`none`}}]])),e}var ji=Ai(),Mi=`set luma.log.level=1 (or higher) to trace rendering`,Ni="No matching device found. Ensure `@luma.gl/core/webgl` and/or `@luma.gl/core/webgpu` modules are imported.",Pi=class e{static defaultProps={...x,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=_;log=u;VERSION=typeof __VERSION__<`u`?__VERSION__:`running from source`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw u.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),u.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);u.error(`This version of luma.gl has already been initialized`)()}u.log(1,`${this.VERSION} - ${Mi}`)(),globalThis.luma=this}async createDevice(t={}){let n={...e.defaultProps,...t};try{let e=this.selectAdapter(n.type,n.adapters);if(!e)throw Error(Ni);return n.waitForPageLoad&&await e.pageLoaded,await e.create(n)}catch(e){throw n.debug&&Fi(e),e}}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(Ni);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(e=!0,t=[]){let n=this._getAdapterMap(t).get(`webgl`);n||u.warn(`enforceWebGL2: webgl adapter not found`)(),n?.enforceWebGL2?.(e)}setDefaultDeviceProps(t){Object.assign(e.defaultProps,t)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(e,t=[]){return e instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue?`webgpu`:e===null?`null`:(e instanceof WebGLRenderingContext?u.warn(`WebGL1 is not supported`,e)():u.warn(`Unknown handle type`,e)(),null)}};function Fi(e){typeof alert>`u`||alert(e instanceof Error?e.message:String(e))}var Ii=new Pi,Li=class{get pageLoaded(){return Vi()}},Ri=h()&&typeof document<`u`,zi=()=>Ri&&document.readyState===`complete`,Bi=null;function Vi(){return Bi||=zi()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),Bi}var Hi=class extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let n=0;n<this.ELEMENTS;++n)this[n]=e[n+t];return this.check()}toArray(e=[],t=0){for(let n=0;n<this.ELEMENTS;++n)e[t+n]=this[n];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:ae(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toString(){return this.formatString(re)}formatString(e){let t=``;for(let n=0;n<this.ELEMENTS;++n)t+=(n>0?`, `:``)+ee(this[n],e);return`${e.printTypes?this.constructor.name:``}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!k(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,n){if(n===void 0)return this.lerp(this,e,t);for(let r=0;r<this.ELEMENTS;++r){let i=e[r];this[r]=i+n*((typeof t==`number`?t:t[r])-i)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(Math.max(this[n],e[n]),t[n]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if(typeof e==`number`)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(re.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e&&=Number.isFinite(this[t]);return e}};function Ui(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}function I(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}function Wi(e,t,n=``){if(re.debug&&!Ui(e,t))throw Error(`math.gl: ${n} some fields set to invalid numbers'`);return e}var Gi=class extends Hi{toString(){let e=`[`;if(re.printRowMajor){e+=`row-major:`;for(let t=0;t<this.RANK;++t)for(let n=0;n<this.RANK;++n)e+=` ${this[n*this.RANK+t]}`}else{e+=`column-major:`;for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+=`]`,e}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,n){return this[t*this.RANK+e]=I(n),this}getColumn(e,t=Array(this.RANK).fill(-0)){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[n+e];return t}setColumn(e,t){let n=e*this.RANK;for(let e=0;e<this.RANK;++e)this[n+e]=t[e];return this}};function Ki(e,t){if(!e)throw Error(`math.gl assertion ${t}`)}var qi=class extends Hi{get x(){return this[0]}set x(e){this[0]=I(e)}get y(){return this[1]}set y(e){this[1]=I(e)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let e=0;for(let t=0;t<this.ELEMENTS;++t)e+=this[t]*this[t];return e}magnitudeSquared(){return this.lengthSquared()}distance(e){return Math.sqrt(this.distanceSquared(e))}distanceSquared(e){let t=0;for(let n=0;n<this.ELEMENTS;++n){let r=this[n]-e[n];t+=r*r}return I(t)}dot(e){let t=0;for(let n=0;n<this.ELEMENTS;++n)t+=this[n]*e[n];return I(t)}normalize(){let e=this.magnitude();if(e!==0)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e;return this.check()}multiply(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]*=t[e];return this.check()}divide(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]/=t[e];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(e){return this.distance(e)}distanceToSquared(e){return this.distanceSquared(e)}getComponent(e){return Ki(e>=0&&e<this.ELEMENTS,`index is out of range`),I(this[e])}setComponent(e,t){return Ki(e>=0&&e<this.ELEMENTS,`index is out of range`),this[e]=t,this.check()}addVectors(e,t){return this.copy(e).add(t)}subVectors(e,t){return this.copy(e).subtract(t)}multiplyVectors(e,t){return this.copy(e).multiply(t)}addScaledVector(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]+=e[n]*t;return this.check()}};Math.PI/180;function Ji(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e}function Yi(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e}function Xi(e,t){return e[0]=-t[0],e[1]=-t[1],e}function Zi(e,t,n,r){let i=t[0],a=t[1];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e}function Qi(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[4]*i+n[12],e[1]=n[1]*r+n[5]*i+n[13],e}var $i=Yi;function ea(e,t,n){let r=t[0],i=t[1],a=n[3]*r+n[7]*i||1;return e[0]=(n[0]*r+n[4]*i)/a,e[1]=(n[1]*r+n[5]*i)/a,e}function ta(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a||1;return e[0]=(n[0]*r+n[4]*i+n[8]*a)/o,e[1]=(n[1]*r+n[5]*i+n[9]*a)/o,e[2]=(n[2]*r+n[6]*i+n[10]*a)/o,e}function na(e,t,n){let r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i,e[1]=n[1]*r+n[3]*i,e[2]=t[2],e}function ra(e){let t=e[0],n=e[1],r=e[2];return Math.sqrt(t*t+n*n+r*r)}function ia(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e}function aa(e){let t=e[0],n=e[1],r=e[2];return t*t+n*n+r*r}function oa(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e}function sa(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function ca(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2];return e[0]=i*c-a*s,e[1]=a*o-r*c,e[2]=r*s-i*o,e}function la(e,t,n,r){let i=t[0],a=t[1],o=t[2];return e[0]=i+r*(n[0]-i),e[1]=a+r*(n[1]-a),e[2]=o+r*(n[2]-o),e}function ua(e,t,n){let r=t[0],i=t[1],a=t[2],o=n[3]*r+n[7]*i+n[11]*a+n[15];return o||=1,e[0]=(n[0]*r+n[4]*i+n[8]*a+n[12])/o,e[1]=(n[1]*r+n[5]*i+n[9]*a+n[13])/o,e[2]=(n[2]*r+n[6]*i+n[10]*a+n[14])/o,e}function da(e,t,n){let r=t[0],i=t[1],a=t[2];return e[0]=r*n[0]+i*n[3]+a*n[6],e[1]=r*n[1]+i*n[4]+a*n[7],e[2]=r*n[2]+i*n[5]+a*n[8],e}function fa(e,t,n){let r=n[0],i=n[1],a=n[2],o=n[3],s=t[0],c=t[1],l=t[2],u=i*l-a*c,d=a*s-r*l,f=r*c-i*s,p=i*f-a*d,m=a*u-r*f,h=r*d-i*u,g=o*2;return u*=g,d*=g,f*=g,p*=2,m*=2,h*=2,e[0]=s+u+p,e[1]=c+d+m,e[2]=l+f+h,e}function pa(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0],a[1]=i[1]*Math.cos(r)-i[2]*Math.sin(r),a[2]=i[1]*Math.sin(r)+i[2]*Math.cos(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function ma(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[2]*Math.sin(r)+i[0]*Math.cos(r),a[1]=i[1],a[2]=i[2]*Math.cos(r)-i[0]*Math.sin(r),e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function ha(e,t,n,r){let i=[],a=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],a[0]=i[0]*Math.cos(r)-i[1]*Math.sin(r),a[1]=i[0]*Math.sin(r)+i[1]*Math.cos(r),a[2]=i[2],e[0]=a[0]+n[0],e[1]=a[1]+n[1],e[2]=a[2]+n[2],e}function ga(e,t){let n=e[0],r=e[1],i=e[2],a=t[0],o=t[1],s=t[2],c=Math.sqrt((n*n+r*r+i*i)*(a*a+o*o+s*s)),l=c&&sa(e,t)/c;return Math.acos(Math.min(Math.max(l,-1),1))}var _a=ia,va=ra,ya=aa,ba=[0,0,0],xa,Sa=class e extends qi{static get ZERO(){return xa||(xa=new e(0,0,0),Object.freeze(xa)),xa}constructor(e=0,t=0,n=0){super(-0,-0,-0),arguments.length===1&&ae(e)?this.copy(e):(re.debug&&(I(e),I(t),I(n)),this[0]=e,this[1]=t,this[2]=n)}set(e,t,n){return this[0]=e,this[1]=t,this[2]=n,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this.check()}fromObject(e){return re.debug&&(I(e.x),I(e.y),I(e.z)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this.check()}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e}get ELEMENTS(){return 3}get z(){return this[2]}set z(e){this[2]=I(e)}angle(e){return ga(this,e)}cross(e){return ca(this,this,e),this.check()}rotateX({radians:e,origin:t=ba}){return pa(this,this,t,e),this.check()}rotateY({radians:e,origin:t=ba}){return ma(this,this,t,e),this.check()}rotateZ({radians:e,origin:t=ba}){return ha(this,this,t,e),this.check()}transform(e){return this.transformAsPoint(e)}transformAsPoint(e){return ua(this,this,e),this.check()}transformAsVector(e){return ta(this,this,e),this.check()}transformByMatrix3(e){return da(this,this,e),this.check()}transformByMatrix2(e){return na(this,this,e),this.check()}transformByQuaternion(e){return fa(this,this,e),this.check()}};function Ca(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function wa(e,t){if(e===t){let n=t[1],r=t[2],i=t[3],a=t[6],o=t[7],s=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=a,e[11]=t[14],e[12]=i,e[13]=o,e[14]=s}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}function Ta(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=t[4],s=t[5],c=t[6],l=t[7],u=t[8],d=t[9],f=t[10],p=t[11],m=t[12],h=t[13],g=t[14],_=t[15],v=n*s-r*o,y=n*c-i*o,b=n*l-a*o,x=r*c-i*s,S=r*l-a*s,C=i*l-a*c,w=u*h-d*m,T=u*g-f*m,E=u*_-p*m,D=d*g-f*h,O=d*_-p*h,k=f*_-p*g,A=v*k-y*O+b*D+x*E-S*T+C*w;return A?(A=1/A,e[0]=(s*k-c*O+l*D)*A,e[1]=(i*O-r*k-a*D)*A,e[2]=(h*C-g*S+_*x)*A,e[3]=(f*S-d*C-p*x)*A,e[4]=(c*E-o*k-l*T)*A,e[5]=(n*k-i*E+a*T)*A,e[6]=(g*b-m*C-_*y)*A,e[7]=(u*C-f*b+p*y)*A,e[8]=(o*O-s*E+l*w)*A,e[9]=(r*E-n*O-a*w)*A,e[10]=(m*S-h*b+_*v)*A,e[11]=(d*b-u*S-p*v)*A,e[12]=(s*T-o*D-c*w)*A,e[13]=(n*D-r*T+i*w)*A,e[14]=(h*y-m*x-g*v)*A,e[15]=(u*x-d*y+f*v)*A,e):null}function Ea(e){let t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=n*s-r*o,b=l*m-u*p,x=l*h-d*p,S=u*h-d*m,C=t*S-n*x+r*b,w=a*S-o*x+s*b,T=l*y-u*v+d*_,E=p*y-m*v+h*_;return c*C-i*w+g*T-f*E}function Da(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e}function Oa(e,t,n){let r=n[0],i=n[1],a=n[2],o,s,c,l,u,d,f,p,m,h,g,_;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*a+t[12],e[13]=t[1]*r+t[5]*i+t[9]*a+t[13],e[14]=t[2]*r+t[6]*i+t[10]*a+t[14],e[15]=t[3]*r+t[7]*i+t[11]*a+t[15]):(o=t[0],s=t[1],c=t[2],l=t[3],u=t[4],d=t[5],f=t[6],p=t[7],m=t[8],h=t[9],g=t[10],_=t[11],e[0]=o,e[1]=s,e[2]=c,e[3]=l,e[4]=u,e[5]=d,e[6]=f,e[7]=p,e[8]=m,e[9]=h,e[10]=g,e[11]=_,e[12]=o*r+u*i+m*a+t[12],e[13]=s*r+d*i+h*a+t[13],e[14]=c*r+f*i+g*a+t[14],e[15]=l*r+p*i+_*a+t[15]),e}function ka(e,t,n){let r=n[0],i=n[1],a=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*a,e[9]=t[9]*a,e[10]=t[10]*a,e[11]=t[11]*a,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function Aa(e,t,n,r){let i=r[0],a=r[1],o=r[2],s=Math.sqrt(i*i+a*a+o*o),c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j;return s<1e-6?null:(s=1/s,i*=s,a*=s,o*=s,l=Math.sin(n),c=Math.cos(n),u=1-c,d=t[0],f=t[1],p=t[2],m=t[3],h=t[4],g=t[5],_=t[6],v=t[7],y=t[8],b=t[9],x=t[10],S=t[11],C=i*i*u+c,w=a*i*u+o*l,T=o*i*u-a*l,E=i*a*u-o*l,D=a*a*u+c,O=o*a*u+i*l,k=i*o*u+a*l,A=a*o*u-i*l,j=o*o*u+c,e[0]=d*C+h*w+y*T,e[1]=f*C+g*w+b*T,e[2]=p*C+_*w+x*T,e[3]=m*C+v*w+S*T,e[4]=d*E+h*D+y*O,e[5]=f*E+g*D+b*O,e[6]=p*E+_*D+x*O,e[7]=m*E+v*D+S*O,e[8]=d*k+h*A+y*j,e[9]=f*k+g*A+b*j,e[10]=p*k+_*A+x*j,e[11]=m*k+v*A+S*j,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)}function ja(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[4],o=t[5],s=t[6],c=t[7],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=a*i+l*r,e[5]=o*i+u*r,e[6]=s*i+d*r,e[7]=c*i+f*r,e[8]=l*i-a*r,e[9]=u*i-o*r,e[10]=d*i-s*r,e[11]=f*i-c*r,e}function Ma(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[8],u=t[9],d=t[10],f=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i-l*r,e[1]=o*i-u*r,e[2]=s*i-d*r,e[3]=c*i-f*r,e[8]=a*r+l*i,e[9]=o*r+u*i,e[10]=s*r+d*i,e[11]=c*r+f*i,e}function Na(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=t[0],o=t[1],s=t[2],c=t[3],l=t[4],u=t[5],d=t[6],f=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=a*i+l*r,e[1]=o*i+u*r,e[2]=s*i+d*r,e[3]=c*i+f*r,e[4]=l*i-a*r,e[5]=u*i-o*r,e[6]=d*i-s*r,e[7]=f*i-c*r,e}function Pa(e,t){let n=t[0],r=t[1],i=t[2],a=t[3],o=n+n,s=r+r,c=i+i,l=n*o,u=r*o,d=r*s,f=i*o,p=i*s,m=i*c,h=a*o,g=a*s,_=a*c;return e[0]=1-d-m,e[1]=u+_,e[2]=f-g,e[3]=0,e[4]=u-_,e[5]=1-l-m,e[6]=p+h,e[7]=0,e[8]=f+g,e[9]=p-h,e[10]=1-l-d,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function Fa(e,t,n,r,i,a,o){let s=1/(n-t),c=1/(i-r),l=1/(a-o);return e[0]=a*2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a*2*c,e[6]=0,e[7]=0,e[8]=(n+t)*s,e[9]=(i+r)*c,e[10]=(o+a)*l,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*a*2*l,e[15]=0,e}function Ia(e,t,n,r,i){let a=1/Math.tan(t/2);if(e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0){let t=1/(r-i);e[10]=(i+r)*t,e[14]=2*i*r*t}else e[10]=-1,e[14]=-2*r;return e}var La=Ia;function Ra(e,t,n,r,i,a,o){let s=1/(t-n),c=1/(r-i),l=1/(a-o);return e[0]=-2*s,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*c,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*l,e[11]=0,e[12]=(t+n)*s,e[13]=(i+r)*c,e[14]=(o+a)*l,e[15]=1,e}var za=Ra;function Ba(e,t,n,r){let i,a,o,s,c,l,u,d,f,p,m=t[0],h=t[1],g=t[2],_=r[0],v=r[1],y=r[2],b=n[0],x=n[1],S=n[2];return Math.abs(m-b)<1e-6&&Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6?Ca(e):(d=m-b,f=h-x,p=g-S,i=1/Math.sqrt(d*d+f*f+p*p),d*=i,f*=i,p*=i,a=v*p-y*f,o=y*d-_*p,s=_*f-v*d,i=Math.sqrt(a*a+o*o+s*s),i?(i=1/i,a*=i,o*=i,s*=i):(a=0,o=0,s=0),c=f*s-p*o,l=p*a-d*s,u=d*o-f*a,i=Math.sqrt(c*c+l*l+u*u),i?(i=1/i,c*=i,l*=i,u*=i):(c=0,l=0,u=0),e[0]=a,e[1]=c,e[2]=d,e[3]=0,e[4]=o,e[5]=l,e[6]=f,e[7]=0,e[8]=s,e[9]=u,e[10]=p,e[11]=0,e[12]=-(a*m+o*h+s*g),e[13]=-(c*m+l*h+u*g),e[14]=-(d*m+f*h+p*g),e[15]=1,e)}function Va(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e}function Ha(e,t,n){let r=t[0],i=t[1],a=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*a+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*a+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*a+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*a+n[15]*o,e}var Ua;(function(e){e[e.COL0ROW0=0]=`COL0ROW0`,e[e.COL0ROW1=1]=`COL0ROW1`,e[e.COL0ROW2=2]=`COL0ROW2`,e[e.COL0ROW3=3]=`COL0ROW3`,e[e.COL1ROW0=4]=`COL1ROW0`,e[e.COL1ROW1=5]=`COL1ROW1`,e[e.COL1ROW2=6]=`COL1ROW2`,e[e.COL1ROW3=7]=`COL1ROW3`,e[e.COL2ROW0=8]=`COL2ROW0`,e[e.COL2ROW1=9]=`COL2ROW1`,e[e.COL2ROW2=10]=`COL2ROW2`,e[e.COL2ROW3=11]=`COL2ROW3`,e[e.COL3ROW0=12]=`COL3ROW0`,e[e.COL3ROW1=13]=`COL3ROW1`,e[e.COL3ROW2=14]=`COL3ROW2`,e[e.COL3ROW3=15]=`COL3ROW3`})(Ua||={});var Wa=45*Math.PI/180,Ga=1,Ka=.1,qa=500,Ja=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),L=class extends Gi{static get IDENTITY(){return Qa()}static get ZERO(){return Za()}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return Ua}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=t,this[2]=n,this[3]=r,this[4]=i,this[5]=a,this[6]=o,this[7]=s,this[8]=c,this[9]=l,this[10]=u,this[11]=d,this[12]=f,this[13]=p,this[14]=m,this[15]=h,this.check()}setRowMajor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){return this[0]=e,this[1]=i,this[2]=c,this[3]=f,this[4]=t,this[5]=a,this[6]=l,this[7]=p,this[8]=n,this[9]=o,this[10]=u,this[11]=m,this[12]=r,this[13]=s,this[14]=d,this[15]=h,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(Ja)}fromObject(e){return this.check()}fromQuaternion(e){return Pa(this,e),this.check()}fromMatrix3(e){return this.set(e[0],e[1],e[2],0,e[3],e[4],e[5],0,e[6],e[7],e[8],0,0,0,0,1)}frustum(e){let{left:t,right:n,bottom:r,top:i,near:a=Ka,far:o=qa}=e;return o===1/0?eo(this,t,n,r,i,a):Fa(this,t,n,r,i,a,o),this.check()}lookAt(e){let{eye:t,center:n=[0,0,0],up:r=[0,1,0]}=e;return Ba(this,t,n,r),this.check()}ortho(e){let{left:t,right:n,bottom:r,top:i,near:a=Ka,far:o=qa}=e;return za(this,t,n,r,i,a,o),this.check()}orthographic(e){let{fovy:t=Wa,aspect:n=Ga,focalDistance:r=1,near:i=Ka,far:a=qa}=e;$a(t);let o=t/2,s=r*Math.tan(o),c=s*n;return this.ortho({left:-c,right:c,bottom:-s,top:s,near:i,far:a})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:n=1,near:r=.1,far:i=500}=e;return $a(t),La(this,t,n,r,i),this.check()}determinant(){return Ea(this)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=0,e[4]=this[4]*r,e[5]=this[5]*i,e[6]=this[6]*a,e[7]=0,e[8]=this[8]*r,e[9]=this[9]*i,e[10]=this[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}getRotationMatrix3(e,t){e||=[-0,-0,-0,-0,-0,-0,-0,-0,-0],t||=[-0,-0,-0];let n=this.getScale(t),r=1/n[0],i=1/n[1],a=1/n[2];return e[0]=this[0]*r,e[1]=this[1]*i,e[2]=this[2]*a,e[3]=this[4]*r,e[4]=this[5]*i,e[5]=this[6]*a,e[6]=this[8]*r,e[7]=this[9]*i,e[8]=this[10]*a,e}transpose(){return wa(this,this),this.check()}invert(){return Ta(this,this),this.check()}multiplyLeft(e){return Da(this,e,this),this.check()}multiplyRight(e){return Da(this,this,e),this.check()}rotateX(e){return ja(this,this,e),this.check()}rotateY(e){return Ma(this,this,e),this.check()}rotateZ(e){return Na(this,this,e),this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){return Aa(this,this,e,t),this.check()}scale(e){return ka(this,this,Array.isArray(e)?e:[e,e,e]),this.check()}translate(e){return Oa(this,this,e),this.check()}transform(e,t){return e.length===4?(t=Ha(t||[-0,-0,-0,-0],e,this),Wi(t,4),t):this.transformAsPoint(e,t)}transformAsPoint(e,t){let{length:n}=e,r;switch(n){case 2:r=Qi(t||[-0,-0],e,this);break;case 3:r=ua(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return Wi(r,e.length),r}transformAsVector(e,t){let n;switch(e.length){case 2:n=ea(t||[-0,-0],e,this);break;case 3:n=ta(t||[-0,-0,-0],e,this);break;default:throw Error(`Illegal vector`)}return Wi(n,e.length),n}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,n){return this.identity().translate([e,t,n])}},Ya,Xa;function Za(){return Ya||(Ya=new L([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),Object.freeze(Ya)),Ya}function Qa(){return Xa||(Xa=new L,Object.freeze(Xa)),Xa}function $a(e){if(e>Math.PI*2)throw Error(`expected radians`)}function eo(e,t,n,r,i,a){let o=2*a/(n-t),s=2*a/(i-r),c=(n+t)/(n-t),l=(i+r)/(i-r),u=-2*a;return e[0]=o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=c,e[9]=l,e[10]=-1,e[11]=-1,e[12]=0,e[13]=0,e[14]=u,e[15]=0,e}function to(e,t=[],n=0){let r=Math.fround(e),i=e-r;return t[n]=r,t[n+1]=i,t}function no(e){return e-Math.fround(e)}function ro(e){let t=new Float32Array(32);for(let n=0;n<4;++n)for(let r=0;r<4;++r){let i=n*4+r;to(e[r*4+n],t,i*2)}return t}function io(e,t=!0){return e??t}function ao(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}function oo(e,t=!0){let n=ao(e.slice(0,3),t),r=Number.isFinite(e[3]),i=r?e[3]:1;return[n[0],n[1],n[2],t&&r?i/255:i]}var so={width:2,jitter:.7,variation:.35,grain:.45,offset:0,extension:3,sketch:1,minimumAntialias:.7},co=`
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
`,lo={name:`sketchStroke`,bindingLayout:[{name:`sketchStroke`,group:3}],source:`
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
`,vs:co,fs:co+`
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
`,uniformTypes:{width:`f32`,jitter:`f32`,variation:`f32`,grain:`f32`,offset:`f32`,extension:`f32`,sketch:`f32`,minimumAntialias:`f32`},defaultUniforms:so,getUniforms(e={}){return{...so,...e}}},uo=`
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
`,fo=`struct Fp64F32Bits {
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

`,po={name:`fp64arithmetic`,source:`\
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
${fo}

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
${fo}

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
`,fs:uo,vs:uo,defaultUniforms:{ONE:1,SPLIT:4097},uniformTypes:{ONE:`f32`,SPLIT:`f32`},fp64ify:to,fp64LowPart:no,fp64ifyMatrix4:ro},mo={props:{},uniforms:{},name:`picking`,uniformTypes:{isActive:`f32`,isAttribute:`f32`,isHighlightActive:`f32`,useByteColors:`f32`,highlightedObjectColor:`vec3<f32>`,highlightColor:`vec4<f32>`},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:[0,1,1,1]},vs:`layout(std140) uniform pickingUniforms {
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
`,getUniforms:ho};function ho(e={},t){let n={},r=io(e.useByteColors,!0);return e.highlightedObjectColor===void 0||(e.highlightedObjectColor===null?n.isHighlightActive=!1:(n.isHighlightActive=!0,n.highlightedObjectColor=e.highlightedObjectColor.slice(0,3))),e.highlightColor&&(n.highlightColor=oo(e.highlightColor,r)),e.isActive!==void 0&&(n.isActive=!!e.isActive,n.isAttribute=!!e.isAttribute),e.useByteColors!==void 0&&(n.useByteColors=!!e.useByteColors),n}function go(){return{color:[0,0,0],position:[0,0,0],halfAxisX:[0,0,0],halfAxisY:[0,0,0],normal:[0,0,-1],disk:0}}var _o={color:`vec3<f32>`,position:`vec3<f32>`,halfAxisX:`vec3<f32>`,halfAxisY:`vec3<f32>`,normal:`vec3<f32>`,disk:`i32`};function vo(e,t=!1){return Array.from({length:4},(n,r)=>{let i=e[r];if(!i)return go();let a=ao(i.color||(t?[255,255,255]:[1,1,1]),t);return{position:i.position,halfAxisX:i.halfAxisX,halfAxisY:i.halfAxisY,normal:i.normal,disk:i.type===`disk`?1:0,color:a.map(e=>e*(i.intensity??1e3))}})}var yo=`precision highp int;

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
`,bo=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
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
`,xo=5,So={props:{},uniforms:{},name:`lighting`,defines:{},uniformTypes:{enabled:`i32`,directionalLightCount:`i32`,pointLightCount:`i32`,spotLightCount:`i32`,ambientColor:`vec3<f32>`,lights:[{color:`vec3<f32>`,position:`vec3<f32>`,direction:`vec3<f32>`,attenuation:`vec3<f32>`,coneCos:`vec2<f32>`},xo],areaLightCount:`i32`,areaLights:[_o,4]},defaultUniforms:Do(),bindingLayout:[{name:`lighting`,group:2}],firstBindingSlot:0,source:bo,vs:yo,fs:yo,getUniforms:Co};function Co(e,t={}){e&&={...e};let n=(e?.lights||[]).filter(e=>e.type===`rect`||e.type===`disk`);if(!e)return Do();e.lights&&(e={...e,...To(e.lights),lights:void 0});let{useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s}=e||{};if(!(i||a&&a.length>0||o&&o.length>0||s&&s.length>0)&&n.length===0)return{...Do(),enabled:0};let c={...Do(),...wo({useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s})};return c.areaLightCount=Math.min(n.length,4),c.areaLights=vo(n,io(e.useByteColors,!0)),e.enabled!==void 0&&(c.enabled=e.enabled?1:0),c}function wo({useByteColors:e,ambientLight:t,pointLights:n=[],spotLights:r=[],directionalLights:i=[]}){let a=Oo(),o=0,s=0,c=0,l=0;for(let t of n){if(o>=xo)break;a[o]={...a[o],color:Eo(t,e),position:t.position,attenuation:t.attenuation||[1,0,0]},o++,s++}for(let t of r){if(o>=xo)break;a[o]={...a[o],color:Eo(t,e),position:t.position,direction:t.direction,attenuation:t.attenuation||[1,0,0],coneCos:Ao(t)},o++,c++}for(let t of i){if(o>=xo)break;a[o]={...a[o],color:Eo(t,e),direction:t.direction},o++,l++}return n.length+r.length+i.length>xo&&u.warn(`MAX_LIGHTS exceeded, truncating to ${xo}`)(),{ambientColor:Eo(t,e),directionalLightCount:l,pointLightCount:s,spotLightCount:c,lights:a}}function To(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let n of e||[])switch(n.type){case`ambient`:t.ambientLight=n;break;case`directional`:t.directionalLights?.push(n);break;case`point`:t.pointLights?.push(n);break;case`spot`:t.spotLights?.push(n);break;default:}return t}function Eo(e={},t){let{color:n=[0,0,0],intensity:r=1}=e;return ao(n,io(t,!0)).map(e=>e*r)}function Do(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:Oo(),areaLightCount:0,areaLights:vo([])}}function Oo(){return Array.from({length:xo},()=>ko())}function ko(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function Ao(e){let t=e.innerConeAngle??0,n=e.outerConeAngle??Math.PI/4;return[Math.cos(t),Math.cos(n)]}var jo={name:`lambertMaterial`,firstBindingSlot:0,bindingLayout:[{name:`lambertMaterial`,group:3}],dependencies:[So],source:`struct lambertMaterialUniforms {
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
`,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:`i32`,ambient:`f32`,diffuse:`f32`},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6},getUniforms(e){return{...jo.defaultUniforms,...e}}},Mo=`layout(std140) uniform waterMaterialUniforms {
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
`,No=`layout(std140) uniform waterMaterialUniforms {
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
`,Po=`struct waterMaterialUniforms {
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
`,R={time:0,baseColor:[.04,.18,.31],opacity:.82,fresnelColor:[.86,.95,1],fresnelPower:5,specularIntensity:1.4,normalStrength:.35,mappingMode:0,coordinateScale:[1,1],coordinateOffset:[0,0],waveADirection:[.9805806756909201,.19611613513818402],waveASpeed:.6,waveAFrequency:4,waveAAmplitude:.08,waveBDirection:[.09950371902099893,.9950371902099893],waveBSpeed:-.45,waveBFrequency:7,waveBAmplitude:.04},Fo={name:`waterMaterial`,firstBindingSlot:0,bindingLayout:[{name:`waterMaterial`,group:3}],dependencies:[So],source:Po,vs:Mo,fs:No,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{time:`f32`,baseColor:`vec3<f32>`,opacity:`f32`,fresnelColor:`vec3<f32>`,fresnelPower:`f32`,specularIntensity:`f32`,normalStrength:`f32`,mappingMode:`i32`,coordinateScale:`vec2<f32>`,coordinateOffset:`vec2<f32>`,waveADirection:`vec2<f32>`,waveASpeed:`f32`,waveAFrequency:`f32`,waveAAmplitude:`f32`,waveBDirection:`vec2<f32>`,waveBSpeed:`f32`,waveBFrequency:`f32`,waveBAmplitude:`f32`},defaultUniforms:R,getUniforms(e,t=R){let{mapping:n,...r}=e||{},i=Io(t);return r.time!==void 0&&(i.time=r.time),r.opacity!==void 0&&(i.opacity=r.opacity),r.fresnelPower!==void 0&&(i.fresnelPower=r.fresnelPower),r.specularIntensity!==void 0&&(i.specularIntensity=r.specularIntensity),r.normalStrength!==void 0&&(i.normalStrength=r.normalStrength),r.coordinateScale!==void 0&&(i.coordinateScale=[Number(r.coordinateScale[0]),Number(r.coordinateScale[1])]),r.coordinateOffset!==void 0&&(i.coordinateOffset=[Number(r.coordinateOffset[0]),Number(r.coordinateOffset[1])]),r.waveASpeed!==void 0&&(i.waveASpeed=r.waveASpeed),r.waveAFrequency!==void 0&&(i.waveAFrequency=r.waveAFrequency),r.waveAAmplitude!==void 0&&(i.waveAAmplitude=r.waveAAmplitude),r.waveBSpeed!==void 0&&(i.waveBSpeed=r.waveBSpeed),r.waveBFrequency!==void 0&&(i.waveBFrequency=r.waveBFrequency),r.waveBAmplitude!==void 0&&(i.waveBAmplitude=r.waveBAmplitude),r.baseColor&&(i.baseColor=Lo(r.baseColor)),r.fresnelColor&&(i.fresnelColor=Lo(r.fresnelColor)),r.waveADirection&&(i.waveADirection=Ro(r.waveADirection)),r.waveBDirection&&(i.waveBDirection=Ro(r.waveBDirection)),n!==void 0&&(i.mappingMode=n===`world`?1:n===`object`?2:0),i}};function Io(e){return{time:e.time??R.time,baseColor:e.baseColor?Lo(e.baseColor):R.baseColor,opacity:e.opacity??R.opacity,fresnelColor:e.fresnelColor?Lo(e.fresnelColor):R.fresnelColor,fresnelPower:e.fresnelPower??R.fresnelPower,specularIntensity:e.specularIntensity??R.specularIntensity,normalStrength:e.normalStrength??R.normalStrength,mappingMode:e.mappingMode??R.mappingMode,coordinateScale:e.coordinateScale?[Number(e.coordinateScale[0]),Number(e.coordinateScale[1])]:R.coordinateScale,coordinateOffset:e.coordinateOffset?[Number(e.coordinateOffset[0]),Number(e.coordinateOffset[1])]:R.coordinateOffset,waveADirection:e.waveADirection?Ro(e.waveADirection):R.waveADirection,waveASpeed:e.waveASpeed??R.waveASpeed,waveAFrequency:e.waveAFrequency??R.waveAFrequency,waveAAmplitude:e.waveAAmplitude??R.waveAAmplitude,waveBDirection:e.waveBDirection?Ro(e.waveBDirection):R.waveBDirection,waveBSpeed:e.waveBSpeed??R.waveBSpeed,waveBFrequency:e.waveBFrequency??R.waveBFrequency,waveBAmplitude:e.waveBAmplitude??R.waveBAmplitude}}function Lo(e){let t=[Number(e[0]),Number(e[1]),Number(e[2])];return Math.max(...t.map(e=>Math.abs(e)))>1&&(t[0]/=255,t[1]/=255,t[2]/=255),t}function Ro(e){let t=Number(e[0]),n=Number(e[1]),r=Math.hypot(t,n);return r===0?[1,0]:[t/r,n/r]}var zo={name:`riverWaterMaterial`,firstBindingSlot:1,bindingLayout:[{name:`riverWaterMaterial`,group:3}],dependencies:[Fo],source:`struct riverWaterMaterialUniforms {
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
`,uniformTypes:{enabled:`i32`,flowDirection:`vec2<f32>`,skyZenithColor:`vec3<f32>`,skyUpDirection:`vec3<f32>`},defaultUniforms:{enabled:0,flowDirection:[0,1],skyZenithColor:[.22,.48,.57],skyUpDirection:[0,0,1]},getUniforms(e={},t={}){return{enabled:e.enabled??t.enabled??0,flowDirection:e.flowDirection??t.flowDirection??[0,1],skyZenithColor:e.skyZenithColor??t.skyZenithColor??[.22,.48,.57],skyUpDirection:e.skyUpDirection??t.skyUpDirection??[0,0,1]}}},Bo={name:`valueNoise`,fs:`
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
`},Vo={name:`heightFog`,dependencies:[{name:`heightFogFunctions`,dependencies:[Bo],fs:`
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
`},Ho={wetness:0,snow:0,puddles:.8,scale:20,snowColor:[.9,.94,.98],skyColor:[.48,.6,.72]},Uo={name:`surfaceWeather`,dependencies:[Bo],uniformTypes:{wetness:`f32`,snow:`f32`,puddles:`f32`,scale:`f32`,snowColor:`vec3<f32>`,skyColor:`vec3<f32>`},defaultUniforms:Ho,getUniforms(e={},t=Ho){return{...Ho,...t,...e}},fs:`
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
`},Wo=`struct LayerUniforms {
  opacity: f32,
};

@group(0) @binding(auto)
var<uniform> layer: LayerUniforms;
`,Go=`layout(std140) uniform layerUniforms {
  uniform float opacity;
} layer;
`,Ko={name:`layer`,source:Wo,vs:Go,fs:Go,getUniforms:e=>({opacity:e.opacity**(1/2.2)}),uniformTypes:{opacity:`f32`}},qo=`const SMOOTH_EDGE_RADIUS: f32 = 0.5;

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
`,Jo=`#define SMOOTH_EDGE_RADIUS 0.5`,Yo={name:`geometry`,source:qo,vs:`\
${Jo}

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
${Jo}

struct FragmentGeometry {
  vec2 uv;
};
FragmentGeometry geometry;

float smoothedge(float edge, float x) {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`},z;(function(e){e[e.Start=1]=`Start`,e[e.Move=2]=`Move`,e[e.End=4]=`End`,e[e.Cancel=8]=`Cancel`})(z||={});var B;(function(e){e[e.None=0]=`None`,e[e.Left=1]=`Left`,e[e.Right=2]=`Right`,e[e.Up=4]=`Up`,e[e.Down=8]=`Down`,e[e.Horizontal=3]=`Horizontal`,e[e.Vertical=12]=`Vertical`,e[e.All=15]=`All`})(B||={});var V;(function(e){e[e.Possible=1]=`Possible`,e[e.Began=2]=`Began`,e[e.Changed=4]=`Changed`,e[e.Ended=8]=`Ended`,e[e.Recognized=8]=`Recognized`,e[e.Cancelled=16]=`Cancelled`,e[e.Failed=32]=`Failed`})(V||={});var Xo=`auto`,Zo=`manipulation`,Qo=`none`,$o=`pan-x`,es=`pan-y`;function ts(e){if(e.includes(`none`))return Qo;let t=e.includes($o),n=e.includes(es);return t&&n?Qo:t||n?t?$o:es:e.includes(`manipulation`)?Zo:Xo}var ns=class{constructor(e,t){this.actions=``,this.manager=e,this.set(t)}set(e){e===`compute`&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));return ts(e.join(` `))}};function rs(e){return e.trim().split(/\s+/g)}function is(e,t,n){if(e)for(let r of rs(t))e.addEventListener(r,n,!1)}function as(e,t,n){if(e)for(let r of rs(t))e.removeEventListener(r,n,!1)}function os(e){return(e.ownerDocument||e).defaultView}function ss(e,t){let n=e;for(;n;){if(n===t)return!0;n=n.parentNode}return!1}function cs(e){let t=e.length;if(t===1)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let n=0,r=0,i=0;for(;i<t;)n+=e[i].clientX,r+=e[i].clientY,i++;return{x:Math.round(n/t),y:Math.round(r/t)}}function ls(e){let t=[],n=0;for(;n<e.pointers.length;)t[n]={clientX:Math.round(e.pointers[n].clientX),clientY:Math.round(e.pointers[n].clientY)},n++;return{timeStamp:Date.now(),pointers:t,center:cs(t),deltaX:e.deltaX,deltaY:e.deltaY}}function us(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.sqrt(n*n+r*r)}function ds(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.sqrt(n*n+r*r)}function fs(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.atan2(r,n)*180/Math.PI}function ps(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.atan2(r,n)*180/Math.PI}function ms(e,t){return e===t?B.None:Math.abs(e)>=Math.abs(t)?e<0?B.Left:B.Right:t<0?B.Up:B.Down}function hs(e,t){let n=t.center,r=e.offsetDelta,i=e.prevDelta,a=e.prevInput;return(t.eventType===z.Start||a?.eventType===z.End)&&(i=e.prevDelta={x:a?.deltaX||0,y:a?.deltaY||0},r=e.offsetDelta={x:n.x,y:n.y}),{deltaX:i.x+(n.x-r.x),deltaY:i.y+(n.y-r.y)}}function gs(e,t,n){return{x:t/e||0,y:n/e||0}}function _s(e,t){return ds(t[0],t[1])/ds(e[0],e[1])}function vs(e,t){return ps(t[1],t[0])-ps(e[1],e[0])}function ys(e,t){let n=e.lastInterval||t,r=t.timeStamp-n.timeStamp,i,a,o,s;if(t.eventType!==z.Cancel&&(r>25||n.velocity===void 0)){let c=t.deltaX-n.deltaX,l=t.deltaY-n.deltaY,u=gs(r,c,l);a=u.x,o=u.y,i=Math.abs(u.x)>Math.abs(u.y)?u.x:u.y,s=ms(c,l),e.lastInterval=t}else i=n.velocity,a=n.velocityX,o=n.velocityY,s=n.direction;t.velocity=i,t.velocityX=a,t.velocityY=o,t.direction=s}function bs(e,t){return`pointerId`in e?e.pointerId:t}function xs(e,t){e.movementOrigin=new Map(t.map((e,t)=>[bs(e,t),{clientX:e.clientX,clientY:e.clientY}])),e.firstMovementTime=void 0}function Ss(e,t){let n=t.pointers.map(bs);if(e.movementOrigin?.size===n.length&&n.every(t=>e.movementOrigin.has(t))||xs(e,t.pointers),t.distancePerPointer=t.pointers.map((t,r)=>ds(e.movementOrigin.get(n[r]),t)),t.eventType&z.Move&&t.distancePerPointer.some(e=>e>0)&&(e.firstMovementTime??=t.timeStamp),t.movementDeltaTime=e.firstMovementTime===void 0?0:t.timeStamp-e.firstMovementTime,t.eventType&(z.End|z.Cancel)){let r=t.changedPointers.map(e=>bs(e,t.pointers.indexOf(e)));xs(e,t.pointers.filter((e,t)=>!r.includes(n[t])))}}function Cs(e,t){let{session:n}=e,{pointers:r}=t,{length:i}=r;n.firstInput||=ls(t),i>1&&!n.firstMultiple?n.firstMultiple=ls(t):i===1&&(n.firstMultiple=!1);let{firstInput:a,firstMultiple:o}=n,s=o?o.center:a.center,c=t.center=cs(r);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-a.timeStamp,Ss(n,t),t.angle=fs(s,c),t.distance=us(s,c);let{deltaX:l,deltaY:u}=hs(n,t);t.deltaX=l,t.deltaY=u,t.offsetDirection=ms(t.deltaX,t.deltaY);let d=gs(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=d.x,t.overallVelocityY=d.y,t.overallVelocity=Math.abs(d.x)>Math.abs(d.y)?d.x:d.y,t.scale=o?_s(o.pointers,r):1,t.rotation=o?vs(o.pointers,r):0,t.maxPointers=n.prevInput?t.pointers.length>n.prevInput.maxPointers?t.pointers.length:n.prevInput.maxPointers:t.pointers.length;let f=e.element;return ss(t.srcEvent.target,f)&&(f=t.srcEvent.target),t.target=f,ys(n,t),t}function ws(e,t,n){let r=n.pointers.length,i=n.changedPointers.length,a=t&z.Start&&r-i===0,o=t&(z.End|z.Cancel)&&r-i===0;n.isFirst=!!a,n.isFinal=!!o,a&&(e.session={}),n.eventType=t;let s=Cs(e,n);e.emit(`hammer.input`,s),e.recognize(s),e.session.prevInput=s}var Ts=class{constructor(e){this.evEl=``,this.evWin=``,this.evTarget=``,this.domHandler=e=>{this.manager.options.enable&&this.handler(e)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){ws(this.manager,e,t)}init(){is(this.element,this.evEl,this.domHandler),is(this.target,this.evTarget,this.domHandler),is(os(this.element),this.evWin,this.domHandler)}destroy(){as(this.element,this.evEl,this.domHandler),as(this.target,this.evTarget,this.domHandler),as(os(this.element),this.evWin,this.domHandler)}},Es={pointerdown:z.Start,pointermove:z.Move,pointerup:z.End,pointercancel:z.Cancel,pointerout:z.Cancel},Ds=`pointerdown`,Os=`pointermove pointerup pointercancel`,ks=class extends Ts{constructor(e){super(e),this.evEl=Ds,this.evWin=Os,this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,n=!1,r=Es[e.type],i=e.pointerType,a=i===`touch`,o=t.findIndex(t=>t.pointerId===e.pointerId);r&z.Start&&(e.buttons||a)?o<0&&(t.push(e),o=t.length-1):r&(z.End|z.Cancel)&&(n=!0),!(o<0)&&(t[o]=e,this.callback(r,{pointers:t,changedPointers:[e],eventType:r,pointerType:i,srcEvent:e}),n&&t.splice(o,1))}},As=[``,`webkit`,`Moz`,`MS`,`ms`,`o`];function js(e,t){let n=t[0].toUpperCase()+t.slice(1);for(let r of As){let i=r?r+n:t;if(i in e)return i}}var Ms=1,Ns=2,Ps={touchAction:`compute`,enable:!0,inputTarget:null,cssProps:{userSelect:`none`,userDrag:`none`,touchCallout:`none`,tapHighlightColor:`rgba(0,0,0,0)`}},Fs=class{constructor(e,t){this.options={...Ps,...t,cssProps:{...Ps.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new ks(this),this.touchAction=new ns(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?Ns:Ms}recognize(e){let{session:t}=this;if(t.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let n,{recognizers:r}=this,{curRecognizer:i}=t;(!i||i&&i.state&V.Recognized)&&(i=t.curRecognizer=null);let a=0;for(;a<r.length;)n=r[a],t.stopped!==Ns&&(!i||n===i||n.canRecognizeWith(i))?n.recognize(e):n.reset(),!i&&n.state&(V.Began|V.Changed|V.Ended)&&(i=t.curRecognizer=n),a++}get(e){let{recognizers:t}=this;for(let n=0;n<t.length;n++)if(t[n].options.event===e)return t[n];return null}add(e){if(Array.isArray(e)){for(let t of e)this.add(t);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let t of e)this.remove(t);return this}let t=typeof e==`string`?this.get(e):e;if(t){let{recognizers:e}=this,n=e.indexOf(t);n!==-1&&(e.splice(n,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:n}=this;for(let r of rs(e))n[r]=n[r]||[],n[r].push(t)}off(e,t){if(!e)return;let{handlers:n}=this;for(let r of rs(e))t?n[r]&&n[r].splice(n[r].indexOf(t),1):delete n[r]}emit(e,t){let n=this.handlers[e]&&this.handlers[e].slice();if(!n||!n.length)return;let r=t;r.type=e,r.preventDefault=function(){t.srcEvent.preventDefault()};let i=0;for(;i<n.length;)n[i](r),i++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[n,r]of Object.entries(this.options.cssProps)){let i=js(t.style,n);e?(this.oldCssProps[i]=t.style[i],t.style[i]=r):t.style[i]=this.oldCssProps[i]||``}e||(this.oldCssProps={})}}},Is=1;function Ls(){return Is++}function Rs(e){return e&V.Cancelled?`cancel`:e&V.Ended?`end`:e&V.Changed?`move`:e&V.Began?`start`:``}var zs=class{constructor(e){this.options=e,this.id=Ls(),this.state=V.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){if(Array.isArray(e)){for(let t of e)this.recognizeWith(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:n}=this;return n[t.id]||(n[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){if(Array.isArray(e)){for(let t of e)this.dropRecognizeWith(t);return this}let t;return t=typeof e==`string`?this.manager.get(e):e,t&&delete this.simultaneous[t.id],this}requireFailure(e){if(Array.isArray(e)){for(let t of e)this.requireFailure(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:n}=this;return n.indexOf(t)===-1&&(n.push(t),t.requireFailure(this)),this}dropRequireFailure(e){if(Array.isArray(e)){for(let t of e)this.dropRequireFailure(t);return this}let t;if(t=typeof e==`string`?this.manager.get(e):e,t){let e=this.requireFail.indexOf(t);e>-1&&this.requireFail.splice(e,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<V.Ended&&this.manager.emit(this.options.event+Rs(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=V.Ended&&this.manager.emit(this.options.event+Rs(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=V.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&(V.Failed|V.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=V.Failed;return}this.state&(V.Recognized|V.Cancelled|V.Failed)&&(this.state=V.Possible),this.state=this.process(t),this.state&(V.Began|V.Changed|V.Ended|V.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}};function Bs(e){return Math.abs(((e+180)%360+360)%360-180)}function Vs(e,t){return(t.distance===void 0||e.distance>=t.distance)&&(t.distancePerPointer===void 0||e.distancePerPointer.length>0&&e.distancePerPointer.every(e=>e>=t.distancePerPointer))&&(t.movementDeltaTime===void 0||e.movementDeltaTime>=t.movementDeltaTime)&&(t.rotation===void 0||Bs(e.rotation)>=t.rotation)&&(t.scale===void 0||Math.abs(e.scale-1)>=t.scale)}var Hs=class extends zs{attrTest(e){let t=this.options.pointers;return t===0||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(t=>Vs(e,t))}process(e){let{state:t}=this,{eventType:n}=e,r=t&(V.Began|V.Changed),i=this.attrTest(e);return r&&(n&z.Cancel||!i)?t|V.Cancelled:r||i?n&z.End?t|V.Ended:t&V.Began?t|V.Changed:V.Began:V.Failed}},Us=[``,`start`,`move`,`end`,`cancel`],Ws=class extends zs{constructor(e={}){super({enable:!0,event:`doubleclickdrag`,pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[Zo]}getEventNames(){return Us.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length===t.pointers?e.eventType&z.Start?this._handleStart(e):e.eventType&z.Move?this._handleMove(e):e.eventType&z.Cancel?this._handleEnd(e,!0):e.eventType&z.End?this._handleEnd(e,!1):V.Failed:(this.reset(),V.Failed)}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===V.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===V.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===V.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===V.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,V.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,V.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return V.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?V.Began:(this._drag.active=!0,e.scale=2**(t/this.options.pixelsPerScale),this._emittedStart?V.Changed:V.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:n,startCenter:r}=this._drag;return this._drag=null,this._tapStart=null,this._lastTap=null,n?(e.scale=2**((r.y-e.center.y)/this.options.pixelsPerScale),t?V.Cancelled:V.Ended):(this._emittedStart=!1,V.Failed)}return!this._tapStart||!this._isSamePointer(e,this._tapStart.pointerId)?(t&&this.reset(),V.Failed):(this._isValidTap(e)?this._lastTap={center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null,V.Failed)}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&us(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return`pointerId`in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return t===null||this._getPointerId(e)===t}},Gs=class extends zs{constructor(e={}){super({enable:!0,event:`tap`,pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[Zo]}process(e){let{options:t}=this,n=e.pointers.length===t.pointers,r=e.distance<t.threshold,i=e.deltaTime<t.time;if(this.reset(),e.eventType&z.Start&&this.count===0)return this.failTimeout();if(r&&i&&n){if(e.eventType!==z.End)return this.failTimeout();let n=this.pTime?e.timeStamp-this.pTime<t.interval:!0,r=!this.pCenter||us(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,!r||!n?this.count=1:this.count+=1,this._input=e,this.count%t.taps===0)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=V.Recognized,this.tryEmit(this._input)},t.interval),V.Began):V.Recognized}return V.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=V.Failed},this.options.interval),V.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===V.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}},Ks=class extends Hs{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{e.device===`trackpad`&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...n}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(n),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:n}=e,r=t.deltaX??e.deltaX,i=t.deltaY??e.deltaY,a=ms(r,i),o=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY),s=n;return{pointers:[s,s],changedPointers:[s,s],pointerType:`trackpad`,srcEvent:s,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:r,deltaY:i,angle:Math.atan2(i,r)*180/Math.PI,distance:Math.sqrt(r*r+i*i),distancePerPointer:[o,o],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:a,offsetDirection:a,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:n.target||this.manager.element,additionalEvent:``,...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&this.options.pointers===2);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}},qs=[``,`start`,`move`,`end`,`cancel`,`up`,`down`,`left`,`right`],Js=class extends Ks{constructor(e={}){super({enable:!0,pointers:1,event:`pan`,threshold:10,direction:B.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&B.Horizontal&&t.push(es),e&B.Vertical&&t.push($o),t}getEventNames(){return qs.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,n=!0,{distance:r}=e,{direction:i}=e,a=e.deltaX,o=e.deltaY;return i&t.direction||(t.direction&B.Horizontal?(i=a===0?B.None:a<0?B.Left:B.Right,n=a!==this.pX,r=Math.abs(e.deltaX)):(i=o===0?B.None:o<0?B.Up:B.Down,n=o!==this.pY,r=Math.abs(e.deltaY))),e.direction=i,n&&r>t.threshold&&!!(i&t.direction)}attrTest(e){let t=!!(this.state&V.Began),n=!(this.options.coherent?.length&&e.eventType&(z.End|z.Cancel));return super.attrTest(e)&&(t||n&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=B[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(V.Recognized|V.Cancelled|V.Failed)&&(this.state=V.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}},Ys=[``,`start`,`move`,`end`,`cancel`,`in`,`out`],Xs=class extends Ks{constructor(e={}){super({enable:!0,event:`pinch`,threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return[Qo]}getEventNames(){return Ys.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,n=!!(this.state&V.Began),r=!(t&&e.eventType&(z.End|z.Cancel));return super.attrTest(e)&&(n||r&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(e.scale!==1){let t=e.scale<1?`in`:`out`;e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(V.Recognized|V.Cancelled|V.Failed)&&(this.state=V.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}},Zs=class{constructor(e,t,n){this.element=e,this.callback=t,this.options=n}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}},Qs=(typeof navigator<`u`&&navigator.userAgent?navigator.userAgent.toLowerCase():``).indexOf(`firefox`)!==-1,$s=40,ec=.25,tc=class extends Zs{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{if(!this.options.enable)return;let t=e.deltaY;globalThis.WheelEvent&&(Qs&&e.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(t/=globalThis.devicePixelRatio),e.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(t*=$s)),e.shiftKey&&t&&(t*=ec),this.callback({type:`wheel`,center:{x:e.clientX,y:e.clientY},delta:-t,device:this.options.wheelSession?.device??`unknown`,srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen(`wheel`,!0))}destroy(){this.listen(`wheel`,!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){e===`wheel`&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen(`wheel`,t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}},nc=4.000244140625,rc=40,ic=0,ac=1,oc=40,sc=40,cc=120,lc={classificationDelay:32,endDelay:80},uc=class{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=e=>{if(!this.hasSubscribers)return`unknown`;let t=fc(e,this.pressedControlKeys.size>0),n=this.session;if(n&&t.timeStamp-n.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return`unknown`;n=null}n?(this.scheduleEnd(),this.addSample(n,t)):(n=this.startPendingSession(t),this.scheduleEnd());let{device:r}=n;return r===`unknown`&&(r=pc(n.samples,!1),r!==`unknown`&&this.begin(n,r)),r},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||this.session.device!==`unknown`)return;let e=this.session,t=pc(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)},this.end=()=>{if(!this.session)return;if(this.session.device===`unknown`){let e=this.session,t=pc(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)}if(!this.session)return;let e=this.session;this.emit(z.End,e.lastEvent),this.reset()},this.handleKeyDown=e=>{e.key===`Control`&&this.pressedControlKeys.add(e.code||e.key)},this.handleKeyUp=e=>{e.key===`Control`&&(e.code?this.pressedControlKeys.delete(e.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...lc,...t},this.element?.addEventListener(`wheel`,this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??`unknown`}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&e.device!==`unknown`&&this.emit(z.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener(`wheel`,this.handleEvent)}startPendingSession(e){let t={samples:[e],device:`unknown`,firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,e.device!==`unknown`){let n=e.samples[e.samples.length-2],r=t.timeStamp-n.timeStamp;e.velocityX=r>0?t.deltaX/r:0,e.velocityY=r>0?t.deltaY/r:0,this.emit(z.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(z.Start,e.samples[0].event);let n=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=n>0?e.totalDeltaX/n:0,e.velocityY=n>0?e.totalDeltaY/n:0,this.emit(z.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,n){let r=this.session;if(!r||r.device===`unknown`)return;let i=e===z.Start,a=e===z.End||e===z.Cancel,o=i?r.firstTimeStamp:r.lastTimeStamp,s=i?0:Math.max(0,o-r.firstTimeStamp),c=i?0:r.totalDeltaX,l=i?0:r.totalDeltaY,u=s>0?c/s:0,d=s>0?l/s:0,f=i?0:n?.velocityX??r.velocityX,p=i?0:n?.velocityY??r.velocityY,m={eventType:e,device:r.device,srcEvent:t,timeStamp:o,center:{x:t.clientX,y:t.clientY},deltaX:c,deltaY:l,deltaTime:s,velocity:Math.abs(f)>Math.abs(p)?f:p,velocityX:f,velocityY:p,overallVelocity:Math.abs(u)>Math.abs(d)?u:d,overallVelocityX:u,overallVelocityY:d,isFirst:i,isFinal:a};for(let{listener:e}of[...this.subscriptions.values()])e(m)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){this.classificationTimer!==null&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){this.endTimer!==null&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t=dc();!t||e===this.listeningForControlKeys||(this.listeningForControlKeys=e,e?(t.addEventListener(`keydown`,this.handleKeyDown,!0),t.addEventListener(`keyup`,this.handleKeyUp,!0),t.addEventListener(`blur`,this.handleWindowBlur)):(t.removeEventListener(`keydown`,this.handleKeyDown,!0),t.removeEventListener(`keyup`,this.handleKeyUp,!0),t.removeEventListener(`blur`,this.handleWindowBlur),this.pressedControlKeys.clear()))}};function dc(){return typeof window<`u`?window:globalThis.document?.defaultView}function fc(e,t){let n=e.deltaX,r=e.deltaY;return e.deltaMode===ac&&(n*=rc,r*=rc),{event:e,timeStamp:e.timeStamp,deltaX:n,deltaY:r,isControlKeyDown:t}}function pc(e,t){return e.some(({event:e,isControlKeyDown:t})=>e.ctrlKey&&!t)?`trackpad`:e.some(({event:e})=>e.deltaMode!==ic)||e.some(mc)||e.every(({event:e})=>{let t=e.wheelDelta;return t!==void 0&&Math.abs(t)%40==0})?`mouse`:e.some(({deltaX:e})=>e!==0)||e.length>1&&hc(e)?`trackpad`:t?`mouse`:`unknown`}function mc({event:e,deltaX:t,deltaY:n}){if(t!==0||n===0)return!1;let r=Math.abs(n/nc);if(Number.isInteger(r))return!0;let i=e.wheelDelta;return typeof i==`number`&&i!==0&&i%cc===0}function hc(e){for(let t=0;t<e.length;t++){let n=e[t];if(Math.abs(n.deltaX)>sc||Math.abs(n.deltaY)>sc||t>0&&n.timeStamp-e[t-1].timeStamp>oc)return!1}return!0}var gc=[`mousedown`,`mousemove`,`mouseup`,`mouseover`,`mouseout`,`mouseenter`,`mouseleave`],_c=class extends Zs{constructor(e,t,n){super(e,t,{enable:!0,...n}),this.handleEvent=e=>{this.handleOverEvent(e),this.handleOutEvent(e),this.handleEnterEvent(e),this.handleLeaveEvent(e),this.handleMoveEvent(e)},this.pressed=!1;let{enable:r=!1}=this.options;this.enableMoveEvent=r,this.enableLeaveEvent=r,this.enableEnterEvent=r,this.enableOutEvent=r,this.enableOverEvent=r,r&&gc.forEach(e=>this.listen(e,!0))}destroy(){gc.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case`pointermove`:this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen(`mousedown`,t),this.listen(`mousemove`,t),this.listen(`mouseup`,t));break;case`pointerover`:this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen(`mouseover`,t));break;case`pointerout`:this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen(`mouseout`,t));break;case`pointerenter`:this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen(`mouseenter`,t));break;case`pointerleave`:this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen(`mouseleave`,t));break;default:}}handleOverEvent(e){this.enableOverEvent&&e.type===`mouseover`&&this._emit(`pointerover`,e)}handleOutEvent(e){this.enableOutEvent&&e.type===`mouseout`&&this._emit(`pointerout`,e)}handleEnterEvent(e){this.enableEnterEvent&&e.type===`mouseenter`&&this._emit(`pointerenter`,e)}handleLeaveEvent(e){this.enableLeaveEvent&&e.type===`mouseleave`&&this._emit(`pointerleave`,e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case`mousedown`:e.button>=0&&(this.pressed=!0);break;case`mousemove`:e.buttons===0&&(this.pressed=!1),this.pressed||this._emit(`pointermove`,e);break;case`mouseup`:this.pressed=!1;break;default:}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:`mouse`,target:t.target})}},vc=[`keydown`,`keyup`],yc=class extends Zs{constructor(e,t,n){super(e,t,{enable:!0,tabIndex:0,...n}),this.handleEvent=e=>{let t=e.target||e.srcElement;t.tagName===`INPUT`&&t.type===`text`||t.tagName===`TEXTAREA`||(this.enableDownEvent&&e.type===`keydown`&&this.callback({type:`keydown`,srcEvent:e,key:e.key,target:e.target}),this.enableUpEvent&&e.type===`keyup`&&this.callback({type:`keyup`,srcEvent:e,key:e.key,target:e.target}))};let{enable:r=!1}=this.options;this.enableDownEvent=r,this.enableUpEvent=r,e.tabIndex=this.options.tabIndex,e.style.outline=`none`,r&&vc.forEach(e=>this.listen(e,!0))}destroy(){vc.forEach(e=>this.listen(e,!1))}enableEventType(e,t){e===`keydown`&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),e===`keyup`&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}},bc=class extends Zs{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{this.options.enable&&this.callback({type:`contextmenu`,center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&this.listen(`contextmenu`,!0)}destroy(){this.listen(`contextmenu`,!1)}enableEventType(e,t){e===`contextmenu`&&this.options.enable!==t&&(this.options.enable=t,this.listen(`contextmenu`,t))}},xc=1,Sc=2,Cc=4,wc={pointerdown:xc,pointermove:Sc,pointerup:Cc,mousedown:xc,mousemove:Sc,mouseup:Cc},Tc=0,Ec=1,Dc=2,Oc=1,kc=2,Ac=4;function jc(e){let t=wc[e.srcEvent.type];if(!t)return null;let{buttons:n,button:r}=e.srcEvent,i=!1,a=!1,o=!1;return t===Sc?(i=!!(n&Oc),a=!!(n&Ac),o=!!(n&kc)):(i=r===Tc,a=r===Ec,o=r===Dc),{leftButton:i,middleButton:a,rightButton:o}}function Mc(e,t){let n=e.center;if(!n)return null;let r=t.getBoundingClientRect(),i=r.width/t.offsetWidth||1,a=r.height/t.offsetHeight||1;return{center:n,offsetCenter:{x:(n.x-r.left-t.clientLeft)/i,y:(n.y-r.top-t.clientTop)/a}}}var Nc={srcElement:`root`,priority:0},Pc=class{constructor(e,t){this.handleEvent=e=>{if(this.isEmpty())return;let t=this._normalizeEvent(e),n=e.srcEvent.target;for(;n&&n!==t.rootElement;){if(this._emit(t,n),t.handled)return;n=n.parentNode}this._emit(t,`root`)},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,n,r=!1,i=!1){let{handlers:a,handlersByElement:o}=this,s={...Nc,...n},c=o.get(s.srcElement);c||(c=[],o.set(s.srcElement,c));let l={type:e,handler:t,srcElement:s.srcElement,priority:s.priority};r&&(l.once=!0),i&&(l.passive=!0),a.push(l),this._active=this._active||!l.passive;let u=c.length-1;for(;u>=0&&!(c[u].priority>=l.priority);)u--;c.splice(u+1,0,l)}remove(e,t){let{handlers:n,handlersByElement:r}=this;for(let i=n.length-1;i>=0;i--){let a=n[i];if(a.type===e&&a.handler===t){n.splice(i,1);let e=r.get(a.srcElement);e.splice(e.indexOf(a),1),e.length===0&&r.delete(a.srcElement)}}this._active=n.some(e=>!e.passive)}_emit(e,t){let n=this.handlersByElement.get(t);if(n){let t=!1,r=()=>{e.handled=!0},i=()=>{e.handled=!0,t=!0},a=[];for(let o=0;o<n.length;o++){let{type:s,handler:c,once:l}=n[o];if(c({...e,type:s,stopPropagation:r,stopImmediatePropagation:i}),l&&a.push(n[o]),t)break}for(let e=0;e<a.length;e++){let{type:t,handler:n}=a[e];this.remove(t,n)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...jc(e),...Mc(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}};function Fc(e){if(`recognizer`in e)return e;let t,n=Array.isArray(e)?[...e]:[e];return t=typeof n[0]==`function`?new(n.shift())(n.shift()||{}):n.shift(),{recognizer:t,recognizeWith:typeof n[0]==`string`?[n[0]]:n[0],requireFailure:typeof n[1]==`string`?[n[1]]:n[1]}}var Ic=class{constructor(e=null,t={}){if(this._onBasicInput=e=>{this.manager.emit(e.srcEvent.type,e)},this._onOtherEvent=e=>{this.manager.emit(e.type,e)},this.options={recognizers:[],events:{},touchAction:`compute`,tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new uc(e),e){this.manager=new Fs(e,this.options);for(let e of this.options.recognizers){let{recognizer:t,recognizeWith:n,requireFailure:r}=Fc(e);this.manager.add(t),n&&t.recognizeWith(n),r&&t.requireFailure(r)}this.manager.on(`hammer.input`,this._onBasicInput),this.wheelInput=new tc(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new _c(e,this._onOtherEvent,{enable:!1}),this.keyInput=new yc(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new bc(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}}getElement(){return this.element}destroy(){if(!this.element){this.wheelSession.destroy();return}this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()}on(e,t,n){this._addEventHandler(e,t,n,!1)}once(e,t,n){this._addEventHandler(e,t,n,!0)}watch(e,t,n){this._addEventHandler(e,t,n,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:n}=this;if(!n)return;let r=n.get(e);r&&(r.set({enable:t,wheelSession:this.wheelSession}),n.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,n,r,i){if(typeof e!=`string`){n=t;for(let[t,a]of Object.entries(e))this._addEventHandler(t,a,n,r,i);return}let{manager:a,events:o}=this;if(!a)return;let s=o.get(e);if(!s){let t=this._getRecognizerName(e)||e;s=new Pc(this,t),o.set(e,s),a&&a.on(e,s.handleEvent)}s.add(e,t,n,r,i),s.isEmpty()||this._toggleRecognizer(s.recognizerName,!0)}_removeEventHandler(e,t){if(typeof e!=`string`){for(let[t,n]of Object.entries(e))this._removeEventHandler(t,n);return}let{events:n}=this,r=n.get(e);if(r&&(r.remove(e,t),r.isEmpty())){let{recognizerName:e}=r,t=!1;for(let r of n.values())if(r.recognizerName===e&&!r.isEmpty()){t=!0;break}t||this._toggleRecognizer(e,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}},Lc={DEFAULT:`default`,LNGLAT:`lnglat`,METER_OFFSETS:`meter-offsets`,LNGLAT_OFFSETS:`lnglat-offsets`,CARTESIAN:`cartesian`};Object.defineProperty(Lc,`IDENTITY`,{get:()=>(P.deprecated(`COORDINATE_SYSTEM.IDENTITY`,`COORDINATE_SYSTEM.CARTESIAN`)(),Lc.CARTESIAN)});var H={WEB_MERCATOR:1,GLOBE:2,WEB_MERCATOR_AUTO_OFFSET:4,IDENTITY:0},Rc={common:0,meters:1,pixels:2},zc={click:`onClick`,dblclick:`onClick`,panstart:`onDragStart`,panmove:`onDrag`,panend:`onDragEnd`},Bc={multipan:[Js,{threshold:10,pointers:2,trackpad:!0}],pinch:[Xs,{trackpad:!0},null,[`multipan`]],pan:[Js,{threshold:1},[`pinch`],[`multipan`]],dblclick:[Gs,{event:`dblclick`,taps:2,enable:!1}],dblclickdrag:[Ws,{event:`dblclickdrag`,enable:!1},[`dblclick`],null],click:[Gs,{event:`click`},[`dblclickdrag`],[`dblclick`,`dblclickdrag`]]};function Vc(e,t){if(e===t)return!0;if(Array.isArray(e)){let n=e.length;if(!t||t.length!==n)return!1;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}return!1}function Hc(e){let t={},n;return r=>{for(let i in r)if(!Vc(r[i],t[i])){n=e(r),t=r;break}return n}}var Uc=[0,0,0,0],Wc=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],Gc=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],Kc=[0,0,0],qc=[0,0,0],Jc={default:-1,cartesian:0,lnglat:1,"meter-offsets":2,"lnglat-offsets":3};function Yc(e){let t=Jc[e];if(t===void 0)throw Error(`Invalid coordinateSystem: ${e}`);return t}var Xc=Hc(el);function Zc(e,t,n=qc){n.length<3&&(n=[n[0],n[1],0]);let r=n,i,a=!0;switch(i=t===`lnglat-offsets`||t===`meter-offsets`?n:e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null,e.projectionMode){case H.WEB_MERCATOR:(t===`lnglat`||t===`cartesian`)&&(i=[0,0,0],a=!1);break;case H.WEB_MERCATOR_AUTO_OFFSET:t===`lnglat`?r=i:t===`cartesian`&&(r=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],i=e.unprojectPosition(r),r[0]-=n[0],r[1]-=n[1],r[2]-=n[2]);break;case H.IDENTITY:r=e.position.map(Math.fround),r[2]=r[2]||0;break;case H.GLOBE:a=!1,i=null;break;default:a=!1}return{geospatialOrigin:i,shaderCoordinateOrigin:r,offsetMode:a}}function Qc(e,t,n){let{viewMatrixUncentered:r,projectionMatrix:i}=e,{viewMatrix:a,viewProjectionMatrix:o}=e,s=Uc,c=Uc,l=e.cameraPosition,{geospatialOrigin:u,shaderCoordinateOrigin:d,offsetMode:f}=Zc(e,t,n);return f&&(c=e.projectPosition(u||d),l=[l[0]-c[0],l[1]-c[1],l[2]-c[2]],c[3]=1,s=Ha([],c,o),a=r||a,o=Da([],i,a),o=Da([],o,Wc)),{viewMatrix:a,viewProjectionMatrix:o,projectionCenter:s,originCommon:c,cameraPosCommon:l,shaderCoordinateOrigin:d,geospatialOrigin:u}}function $c({viewport:e,devicePixelRatio:t=1,modelMatrix:n=null,coordinateSystem:r=`default`,coordinateOrigin:i=qc,autoWrapLongitude:a=!1}){r===`default`&&(r=e.isGeospatial?`lnglat`:`cartesian`);let o=Xc({viewport:e,devicePixelRatio:t,coordinateSystem:r,coordinateOrigin:i});return o.wrapLongitude=a,o.modelMatrix=n||Gc,o}function el({viewport:e,devicePixelRatio:t,coordinateSystem:n,coordinateOrigin:r}){let{projectionCenter:i,viewProjectionMatrix:a,originCommon:o,cameraPosCommon:s,shaderCoordinateOrigin:c,geospatialOrigin:l}=Qc(e,n,r),u=e.getDistanceScales(),d=[e.width*t,e.height*t],f=Ha([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,p={coordinateSystem:Yc(n),projectionMode:e.projectionMode,coordinateOrigin:c,commonOrigin:o.slice(0,3),center:i,pseudoMeters:!!e._pseudoMeters,viewportSize:d,devicePixelRatio:t,focalDistance:f,commonUnitsPerMeter:u.unitsPerMeter,commonUnitsPerWorldUnit:u.unitsPerMeter,commonUnitsPerWorldUnit2:Kc,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:a,modelMatrix:Gc,cameraPosition:s};if(l){let t=e.getDistanceScales(l);switch(n){case`meter-offsets`:p.commonUnitsPerWorldUnit=t.unitsPerMeter,p.commonUnitsPerWorldUnit2=t.unitsPerMeter2;break;case`lnglat`:case`lnglat-offsets`:e._pseudoMeters||(p.commonUnitsPerMeter=t.unitsPerMeter),p.commonUnitsPerWorldUnit=t.unitsPerDegree,p.commonUnitsPerWorldUnit2=t.unitsPerDegree2;break;case`cartesian`:p.commonUnitsPerWorldUnit=[1,1,t.unitsPerMeter[2]],p.commonUnitsPerWorldUnit2=[0,0,t.unitsPerMeter2[2]];break;default:break}}if(e.projectionMode===H.GLOBE&&n===`meter-offsets`){let e=r[0]*Math.PI/180,t=r[1]*Math.PI/180,n=Math.cos(t),i=((r[2]||0)/6370972+1)*256;p.commonOrigin=[Math.sin(e)*n*i,-Math.cos(e)*n*i,Math.sin(t)*i]}return p}var tl=`\
${`\
${[`default`,`lnglat`,`meter-offsets`,`lnglat-offsets`,`cartesian`].map(e=>`const COORDINATE_SYSTEM_${e.toUpperCase().replaceAll(`-`,`_`)}: i32 = ${Yc(e)};`).join(``)}
${Object.keys(H).map(e=>`const PROJECTION_MODE_${e}: i32 = ${H[e]};`).join(``)}
${Object.keys(Rc).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${Rc[e]};`).join(``)}

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
`,nl=`\
${[`default`,`lnglat`,`meter-offsets`,`lnglat-offsets`,`cartesian`].map(e=>`const int COORDINATE_SYSTEM_${e.toUpperCase().replaceAll(`-`,`_`)} = ${Yc(e)};`).join(``)}
${Object.keys(H).map(e=>`const int PROJECTION_MODE_${e} = ${H[e]};`).join(``)}
${Object.keys(Rc).map(e=>`const int UNIT_${e.toUpperCase()} = ${Rc[e]};`).join(``)}
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
`,rl={};function il(e=rl){return`viewport`in e?$c(e):{}}var al={name:`project`,dependencies:[l,Yo],source:tl,vs:nl,getUniforms:il,uniformTypes:{wrapLongitude:`f32`,coordinateSystem:`i32`,commonUnitsPerMeter:`vec3<f32>`,projectionMode:`i32`,scale:`f32`,commonUnitsPerWorldUnit:`vec3<f32>`,commonUnitsPerWorldUnit2:`vec3<f32>`,center:`vec4<f32>`,modelMatrix:`mat4x4<f32>`,viewProjectionMatrix:`mat4x4<f32>`,viewportSize:`vec2<f32>`,devicePixelRatio:`f32`,focalDistance:`f32`,cameraPosition:`vec3<f32>`,coordinateOrigin:`vec3<f32>`,commonOrigin:`vec3<f32>`,pseudoMeters:`f32`}},ol={name:`project32`,dependencies:[al],source:`// Define a structure to hold both the clip-space position and the common position.
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
`};function sl(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function cl(e,t){let n=Ha([],t,e);return Va(n,n,1/n[3]),n}function ll(e,t,n){return e<t?t:e>n?n:e}function ul(e){return Math.log(e)*Math.LOG2E}var dl=Math.log2||ul;function fl(e,t){if(!e)throw Error(t||`@math.gl/web-mercator: assertion failed.`)}var U=Math.PI,pl=U/4,W=U/180,ml=180/U,hl=512,gl=4003e4,G=85.051129,_l=1.5;function vl(e){return dl(e)}function yl(e){let[t,n]=e;fl(Number.isFinite(t)),fl(Number.isFinite(n)&&n>=-90&&n<=90,`invalid latitude`);let r=t*W,i=n*W;return[hl*(r+U)/(2*U),hl*(U+Math.log(Math.tan(pl+i*.5)))/(2*U)]}function bl(e){let[t,n]=e,r=t/hl*(2*U)-U,i=2*(Math.atan(Math.exp(n/hl*(2*U)-U))-pl);return[r*ml,i*ml]}function xl(e){let{latitude:t}=e;return fl(Number.isFinite(t)),vl(gl*Math.cos(t*W))-9}function Sl(e){let t=Math.cos(e*W);return hl/gl/t}function Cl(e){let{latitude:t,longitude:n,highPrecision:r=!1}=e;fl(Number.isFinite(t)&&Number.isFinite(n));let i=hl,a=Math.cos(t*W),o=i/360,s=o/a,c=i/gl/a,l={unitsPerMeter:[c,c,c],metersPerUnit:[1/c,1/c,1/c],unitsPerDegree:[o,s,c],degreesPerUnit:[1/o,1/s,1/c]};if(r){let e=W*Math.tan(t*W)/a,n=o*e/2,r=i/gl*e,u=r/s*c;l.unitsPerDegree2=[0,n,r],l.unitsPerMeter2=[u,0,u]}return l}function wl(e,t){let[n,r,i]=e,[a,o,s]=t,{unitsPerMeter:c,unitsPerMeter2:l}=Cl({longitude:n,latitude:r,highPrecision:!0}),u=yl(e);u[0]+=a*(c[0]+l[0]*o),u[1]+=o*(c[1]+l[1]*o);let d=bl(u),f=(i||0)+(s||0);return Number.isFinite(i)||Number.isFinite(s)?[d[0],d[1],f]:d}function Tl(e){let{height:t,pitch:n,bearing:r,altitude:i,scale:a,center:o}=e,s=sl();Oa(s,s,[0,0,-i]),ja(s,s,-n*W),Na(s,s,r*W);let c=a/t;return ka(s,s,[c,c,c]),o&&Oa(s,s,oa([],o)),s}function El(e){let{width:t,height:n,altitude:r,pitch:i=0,offset:a,center:o,scale:s,nearZMultiplier:c=1,farZMultiplier:l=1}=e,{fovy:u=Dl(_l)}=e;r!==void 0&&(u=Dl(r));let d=u*W,f=i*W,p=Ol(u),m=p;o&&(m+=o[2]*s/Math.cos(f)/n);let h=d*(.5+(a?a[1]:0)/n),g=Math.sin(h)*m/Math.sin(ll(Math.PI/2-f-h,.01,Math.PI-.01)),_=Math.sin(f)*g+m,v=m*10,y=Math.min(_*l,v);return{fov:d,aspect:t/n,focalDistance:p,near:c,far:y}}function Dl(e){return 2*Math.atan(.5/e)*ml}function Ol(e){return .5/Math.tan(.5*e*W)}function kl(e,t){let[n,r,i=0]=e;return fl(Number.isFinite(n)&&Number.isFinite(r)&&Number.isFinite(i)),cl(t,[n,r,i,1])}function Al(e,t,n=0){let[r,i,a]=e;if(fl(Number.isFinite(r)&&Number.isFinite(i),`invalid pixel coordinate`),Number.isFinite(a))return cl(t,[r,i,a,1]);let o=cl(t,[r,i,0,1]),s=cl(t,[r,i,1,1]),c=o[2],l=s[2];return Zi([],o,s,c===l?0:((n||0)-c)/(l-c))}function jl(e){let{width:t,height:n,bounds:r,minExtent:i=0,maxZoom:a=24,offset:o=[0,0]}=e,[[s,c],[l,u]]=r,d=Ml(e.padding),f=yl([s,ll(u,-G,G)]),p=yl([l,ll(c,-G,G)]),m=[Math.max(Math.abs(p[0]-f[0]),i),Math.max(Math.abs(p[1]-f[1]),i)],h=[t-d.left-d.right-Math.abs(o[0])*2,n-d.top-d.bottom-Math.abs(o[1])*2];fl(h[0]>0&&h[1]>0);let g=h[0]/m[0],_=h[1]/m[1],v=(d.right-d.left)/2/g,y=(d.top-d.bottom)/2/_,b=bl([(p[0]+f[0])/2+v,(p[1]+f[1])/2+y]),x=Math.min(a,dl(Math.abs(Math.min(g,_))));return fl(Number.isFinite(x)),{longitude:b[0],latitude:b[1],zoom:x}}function Ml(e=0){return typeof e==`number`?{top:e,bottom:e,left:e,right:e}:(fl(Number.isFinite(e.top)&&Number.isFinite(e.bottom)&&Number.isFinite(e.left)&&Number.isFinite(e.right)),e)}var Nl=Math.PI/180;function Pl(e,t=0){let{width:n,height:r,unproject:i}=e,a={targetZ:t},o=i([0,r],a),s=i([n,r],a),c,l;return(e.fovy?.5*e.fovy*Nl:Math.atan(.5/e.altitude))>(90-e.pitch)*Nl-.01?(c=Fl(e,0,t),l=Fl(e,n,t)):(c=i([0,0],a),l=i([n,0],a)),[o,s,l,c]}function Fl(e,t,n){let{pixelUnprojectionMatrix:r}=e,i=cl(r,[t,0,1,1]),a=cl(r,[t,e.height,1,1]),o=bl(Zi([],i,a,(n*e.distanceScales.unitsPerMeter[2]-i[2])/(a[2]-i[2])));return o.push(n),o}var Il=Math.PI;Il/180;var Ll=180/Il,Rl=Il*6378137;Math.atan(Math.sinh(Il))*Ll,512/(2*Rl);var zl=`
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
`,Bl=`
${zl}

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

`,Vl=`
${zl}

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

`,Hl=Hc(ql),Ul=Hc(Jl),Wl=[0,0,0,1],Gl=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0];function Kl(e,t){let[n,r,i]=e,a=Al([n,r,i],t);return Number.isFinite(i)?a:[a[0],a[1],0]}function ql({viewport:e,center:t}){return new L(e.viewProjectionMatrix).invert().transform(t)}function Jl({viewport:e,shadowMatrices:t}){let n=[],r=e.pixelUnprojectionMatrix,i=e.isGeospatial?void 0:1,a=[[0,0,i],[e.width,0,i],[0,e.height,i],[e.width,e.height,i],[0,0,-1],[e.width,0,-1],[0,e.height,-1],[e.width,e.height,-1]].map(e=>Kl(e,r));for(let r of t){let t=r.clone().translate(new Sa(e.center).negate()),i=a.map(e=>t.transform(e)),o=new L().ortho({left:Math.min(...i.map(e=>e[0])),right:Math.max(...i.map(e=>e[0])),bottom:Math.min(...i.map(e=>e[1])),top:Math.max(...i.map(e=>e[1])),near:Math.min(...i.map(e=>-e[2])),far:Math.max(...i.map(e=>-e[2]))});n.push(o.multiplyRight(r))}return n}function Yl(e){let{shadowEnabled:t=!0,project:n}=e;if(!t||!n||!e.shadowMatrices||!e.shadowMatrices.length)return{drawShadowMap:!1,useShadowMap:!1,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};let r=al.getUniforms(n),i=Hl({viewport:n.viewport,center:r.center}),a=[],o=Ul({shadowMatrices:e.shadowMatrices,viewport:n.viewport}).slice();for(let t=0;t<e.shadowMatrices.length;t++){let e=o[t],s=e.clone().translate(new Sa(n.viewport.center).negate());r.coordinateSystem===Yc(`lnglat`)&&r.projectionMode===H.WEB_MERCATOR?(o[t]=s,a[t]=i):(o[t]=e.clone().multiplyRight(Gl),a[t]=s.transform(i))}let s={drawShadowMap:!!e.drawToShadowMap,useShadowMap:e.shadowMaps?e.shadowMaps.length>0:!1,color:e.shadowColor||Wl,lightId:e.shadowLightId||0,lightCount:e.shadowMatrices.length,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};for(let e=0;e<o.length;e++)s[`viewProjectionMatrix${e}`]=o[e],s[`projectCenter${e}`]=a[e];for(let t=0;t<2;t++)s[`shadow_uShadowMap${t}`]=e.shadowMaps&&e.shadowMaps[t]||e.dummyShadowMap;return s}var Xl={name:`shadow`,dependencies:[al],vs:Bl,fs:Vl,inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    position = shadow_setVertexPosition(geometry.position);
    `,"fs:DECKGL_FILTER_COLOR":`
    color = shadow_filterShadowColor(color);
    `},getUniforms:Yl,uniformTypes:{drawShadowMap:`f32`,useShadowMap:`f32`,color:`vec4<f32>`,lightId:`i32`,lightCount:`f32`,viewProjectionMatrix0:`mat4x4<f32>`,viewProjectionMatrix1:`mat4x4<f32>`,projectCenter0:`vec4<f32>`,projectCenter1:`vec4<f32>`}},Zl=16777215;function Ql(e,t){e.length===10?P.warn(`pickMultipleObjects can only exclude 10 previously picked objects for layers without picking buffers`)():e.push(t)}var $l=`  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function eu(e){return e.replace(`  vec4 highlightColor;
} picking;`,`  vec4 highlightColor;\n${$l}} picking;`)}function tu(e,t){return[e[t]||0,e[t+1]||0,e[t+2]||0,e[t+3]||0]}var nu=`\
vec3 picking_getPickingColorFromIndex(float objectIndex) {
  if (objectIndex < 0.0 || objectIndex >= ${Zl}.0) {
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
`,ru=`\
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
  if (objectIndex >= ${Zl}u) {
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
`,iu={...mo,vs:`${eu(mo.vs)}\n${nu}`,fs:eu(mo.fs),source:ru,uniformTypes:{...mo.uniformTypes,disabledPickingIndexCount:`f32`,disabledPickingIndices0:`vec4<f32>`,disabledPickingIndices1:`vec4<f32>`,disabledPickingIndices2:`vec4<f32>`},defaultUniforms:{...mo.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(e,t){let n=mo.getUniforms(e,t),r=e.disabledPickingIndices||[];return n.disabledPickingIndexCount=r.length,n.disabledPickingIndices0=tu(r,0),n.disabledPickingIndices1=tu(r,4),n.disabledPickingIndices2=tu(r,8),n},inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `,"vs:DECKGL_FILTER_COLOR":`
  picking_setPickingColor(geometry.pickingColor);
  `,"fs:DECKGL_FILTER_COLOR":{order:99,injection:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}}},au=[Yo],ou=[`vs:DECKGL_FILTER_SIZE(inout vec3 size, VertexGeometry geometry)`,`vs:DECKGL_FILTER_GL_POSITION(inout vec4 position, VertexGeometry geometry)`,`vs:DECKGL_FILTER_COLOR(inout vec4 color, VertexGeometry geometry)`,`fs:DECKGL_FILTER_COLOR(inout vec4 color, FragmentGeometry geometry)`],su=[];function cu(e){let t=c.getDefaultShaderAssembler(e);for(let e of au)t.addDefaultModule(e);t._hookFunctions.length=0;let n=e===`glsl`?ou:su;for(let e of n)t.addShaderHook(e);return t}var lu=[255,255,255],uu=1,du=0,fu=class{constructor(e={}){this.type=`ambient`;let{color:t=lu}=e,{intensity:n=uu}=e;this.id=e.id||`ambient-${du++}`,this.color=t,this.intensity=n}},pu=[255,255,255],mu=1,hu=[0,0,-1],gu=0,_u=class{constructor(e={}){this.type=`directional`;let{color:t=pu}=e,{intensity:n=mu}=e,{direction:r=hu}=e,{_shadow:i=!1}=e;this.id=e.id||`directional-${gu++}`,this.color=t,this.intensity=n,this.type=`directional`,this.direction=new Sa(r).normalize().toArray(),this.shadow=i}getProjectedLight(e){return this}},vu=class{constructor(e,t={id:`pass`}){let{id:n}=t;this.id=n,this.device=e,this.props={...t}}setProps(e){Object.assign(this.props,e)}render(e){}cleanup(){}},yu={depthWriteEnabled:!0,depthCompare:`less-equal`,blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaOperation:`add`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`},bu=class extends vu{constructor(){super(...arguments),this._lastRenderIndex=-1}render(e){this._render(e)}_render(e){let{canvasContext:t=this.device.canvasContext}=e,n=e.target??t.getCurrentFramebuffer(),[r,i]=t.getDrawingBufferSize(),a=e.clearCanvas??!0,o=e.clearColor??(a?[0,0,0,0]:!1),s=a?1:!1,c=a?0:!1,l=e.colorMask??15,u={viewport:[0,0,r,i]};e.colorMask&&(u.colorMask=l),e.scissorRect&&(u.scissorRect=e.scissorRect);let{shaderModuleProps:d,viewports:f,views:p,onViewportActive:m,clearStack:h=!0}=e,g=e.pass||`unknown`,_=this.device.type===`webgpu`;h&&(this._lastRenderIndex=-1);let v=[];if(!f.length)return this.device.beginRenderPass({framebuffer:n,parameters:u,clearColor:o,clearDepth:s,clearStencil:c}).end(),this.device.submit(),v;try{for(let r of f){m?.(r);let i=this._getDrawLayerParams(r,e),a=p&&p[r.id],l=r.subViewports||[r],f=_?l.map(e=>[e]):[l];for(let r of f){let l=this.device.beginRenderPass({framebuffer:n,parameters:u,clearColor:o,clearDepth:s,clearStencil:c});try{for(let o of r){let r=this._drawLayersInViewport(l,{target:n,canvasContext:t,shaderModuleProps:d,viewport:o,view:a,pass:g,layers:e.layers,isPicking:e.isPicking},i);v.push(r)}}finally{l.end(),_&&this.device.submit()}o=!1,s=!1,c=!1}}return v}finally{_||this.device.submit()}}_getDrawLayerParams(e,{layers:t,pass:n,isPicking:r=!1,layerFilter:i,cullRect:a,views:o,effects:s,canvasContext:c=this.device.canvasContext,shaderModuleProps:l},u=!1){let d=[],f=xu(this._lastRenderIndex+1),p={layer:t[0],viewport:e,isPicking:r,renderPass:n,cullRect:a},m={};for(let r=0;r<t.length;r++){let a=t[r],h=this._shouldDrawLayer(a,p,i,m),g={shouldDrawLayer:h};h&&!u&&(g.shouldDrawLayer=!0,g.layerRenderIndex=f(a,h),g.shaderModuleProps=this._getShaderModuleProps(a,s,n,c,l),g.layerParameters={...a.context.device.type===`webgpu`?yu:null,...a.context.deck?.props.parameters,...o?.[e.id]?.props.parameters,...this.getLayerParameters(a,r,e)}),d[r]=g}return d}_drawLayersInViewport(e,{layers:t,shaderModuleProps:n,pass:r,target:i,canvasContext:a,viewport:o,view:s,isPicking:c},l){let u=Su(this.device,{canvasContext:a,shaderModuleProps:n,target:i,viewport:o});if(s){let{clear:e,clearColor:t,clearDepth:n,clearStencil:r}=s.props;if(e){let e=[0,0,0,0],a=1,o=0;Array.isArray(t)&&!c?e=[...t.slice(0,3),t[3]||255].map(e=>e/255):t===!1&&(e=!1),n!==void 0&&(a=n),r!==void 0&&(o=r),this.device.beginRenderPass({framebuffer:i,parameters:{viewport:u,scissorRect:u},clearColor:e,clearDepth:a,clearStencil:o}).end()}}let d={totalCount:t.length,visibleCount:0,compositeCount:0,pickableCount:0};e.setParameters({viewport:u});for(let n=0;n<t.length;n++){let i=t[n],a=l[n],{shouldDrawLayer:s}=a;if(s&&i.props.pickable&&d.pickableCount++,i.isComposite&&d.compositeCount++,i.isDrawable&&a.shouldDrawLayer){let{layerRenderIndex:t,shaderModuleProps:n,layerParameters:s}=a;d.visibleCount++,this._lastRenderIndex=Math.max(this._lastRenderIndex,t),n.project&&(n.project.viewport=o),i.context.renderPass=e;try{i._drawLayer({renderPass:e,shaderModuleProps:n,uniforms:{layerIndex:t},parameters:s})}catch(e){i.raiseError(e,`drawing ${i} to ${r}`)}}}return d}shouldDrawLayer(e){return!0}getShaderModuleProps(e,t,n){return null}getLayerParameters(e,t,n){return e.props.parameters}_shouldDrawLayer(e,t,n,r){if(!(e.props.visible&&this.shouldDrawLayer(e)))return!1;t.layer=e;let i=e.parent;for(;i;){if(!i.props.visible||!i.filterSubLayer(t))return!1;t.layer=i,i=i.parent}if(n){let e=t.layer.id;if(e in r||(r[e]=n(t)),!r[e])return!1}return e.activateViewport(t.viewport),!0}_getShaderModuleProps(e,t,n,r,i){let a=r.cssToDeviceRatio(),o=e.internalState?.propsInTransition||e.props,s={layer:o,picking:{isActive:!1},project:{viewport:e.context.viewport,devicePixelRatio:a,modelMatrix:o.modelMatrix,coordinateSystem:o.coordinateSystem,coordinateOrigin:o.coordinateOrigin,autoWrapLongitude:e.wrapLongitude}};if(t)for(let n of t)Cu(s,n.getShaderModuleProps?.(e,s));for(let t of e.context.defaultShaderModules)t.name in s||(s[t.name]={});return Cu(s,this.getShaderModuleProps(e,t,s),i)}};function xu(e=0,t={}){let n={},r=(i,a)=>{let o=i.props._offset,s=i.id,c=i.parent&&i.parent.id,l;if(c&&!(c in t)&&r(i.parent,!1),c in n){let e=n[c]=n[c]||xu(t[c],t);l=e(i,a),n[s]=e}else Number.isFinite(o)?(l=o+(t[c]||0),n[s]=null):l=e;return a&&l>=e&&(e=l+1),t[s]=l,l};return r}function Su(e,{canvasContext:t=e.canvasContext,shaderModuleProps:n,target:r,viewport:i}){let a=n?.project?.devicePixelRatio??t.cssToDeviceRatio(),[,o]=t.getDrawingBufferSize(),s=r?r.height:o,c=i;return[c.x*a,e.type===`webgpu`?c.y*a:s-(c.y+c.height)*a,c.width*a,c.height*a]}function Cu(e,...t){for(let n of t)if(n)for(let t in n)e[t]?Object.assign(e[t],n[t]):e[t]=n[t];return e}var wu=class extends bu{constructor(e,t){super(e,t);let n=e.createTexture({format:`rgba8unorm`,width:1,height:1,sampler:{minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}),r=e.createTexture({format:`depth16unorm`,width:1,height:1});this.fbo=e.createFramebuffer({id:`shadowmap`,width:1,height:1,colorAttachments:[n],depthStencilAttachment:r})}delete(){this.fbo&&=(this.fbo.destroy(),null)}getShadowMap(){return this.fbo.colorAttachments[0].texture}render(e){let t=this.fbo,n=this.device.canvasContext.cssToDeviceRatio(),r=e.viewports[0],i=r.width*n,a=r.height*n,o=[1,1,1,1];(i!==t.width||a!==t.height)&&t.resize({width:i,height:a}),super.render({...e,clearColor:o,target:t,pass:`shadow`})}getLayerParameters(e,t,n){return{...e.props.parameters,blend:!1,depthWriteEnabled:!0,depthCompare:`less-equal`}}shouldDrawLayer(e){return e.props.shadowEnabled!==!1}getShaderModuleProps(e,t,n){return{shadow:{project:n.project,drawToShadowMap:!0}}}},Tu={color:[255,255,255],intensity:1},Eu=[{color:[255,255,255],intensity:1,direction:[-1,3,-1]},{color:[255,255,255],intensity:.9,direction:[1,-8,-2.5]}],Du=[0,0,0,200/255],Ou=class{constructor(e={}){this.id=`lighting-effect`,this.shadowColor=Du,this.shadow=!1,this.directionalLights=[],this.pointLights=[],this.shadowPasses=[],this.dummyShadowMap=null,this.setProps(e)}setup(e){this.context=e;let{device:t,deck:n}=e;this.shadow&&!this.dummyShadowMap&&(this._createShadowPasses(t),n._addDefaultShaderModule(Xl),this.dummyShadowMap=t.createTexture({width:1,height:1}))}setProps(e){this.ambientLight=void 0,this.directionalLights=[],this.pointLights=[];for(let t in e){let n=e[t];switch(n.type){case`ambient`:this.ambientLight=n;break;case`directional`:this.directionalLights.push(n);break;case`point`:this.pointLights.push(n);break;default:}}this._applyDefaultLights(),this.shadow=this.directionalLights.some(e=>e.shadow),this.context&&this.setup(this.context),this.props=e}preRender({layers:e,layerFilter:t,viewports:n,onViewportActive:r,views:i}){if(this.shadow){this.shadowMatrices=this._calculateMatrices();for(let a=0;a<this.shadowPasses.length;a++)this.shadowPasses[a].render({layers:e,layerFilter:t,viewports:n,onViewportActive:r,views:i,shaderModuleProps:{shadow:{shadowLightId:a,dummyShadowMap:this.dummyShadowMap,shadowMatrices:this.shadowMatrices}}})}}getShaderModuleProps(e,t){let n=this.shadow?{project:t.project,shadowMaps:this.shadowPasses.map(e=>e.getShadowMap()),dummyShadowMap:this.dummyShadowMap,shadowColor:this.shadowColor,shadowMatrices:this.shadowMatrices}:{},r={enabled:!0,lights:this._getLights(e)},i=e.props.material;return{shadow:n,lighting:r,phongMaterial:i,gouraudMaterial:i}}cleanup(e){for(let e of this.shadowPasses)e.delete();this.shadowPasses.length=0,this.dummyShadowMap&&(this.dummyShadowMap.destroy(),this.dummyShadowMap=null,e.deck._removeDefaultShaderModule(Xl))}_calculateMatrices(){let e=[];for(let t of this.directionalLights){let n=new L().lookAt({eye:new Sa(t.direction).negate()});e.push(n)}return e}_createShadowPasses(e){for(let t=0;t<this.directionalLights.length;t++){let n=new wu(e);this.shadowPasses[t]=n}}_applyDefaultLights(){let{ambientLight:e,pointLights:t,directionalLights:n}=this;!e&&t.length===0&&n.length===0&&(this.ambientLight=new fu(Tu),this.directionalLights.push(new _u(Eu[0]),new _u(Eu[1])))}_getLights(e){let t=[];this.ambientLight&&t.push(this.ambientLight);for(let n of this.pointLights)t.push(n.getProjectedLight({layer:e}));for(let n of this.directionalLights)t.push(n.getProjectedLight({layer:e}));return t}},ku=new class{constructor(e={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(e)}setOptions(e){Object.assign(this.opts,e)}allocate(e,t,{size:n=1,type:r,padding:i=0,copy:a=!1,initialize:o=!1,maxCount:s}){let c=r||e&&e.constructor||Float32Array,l=t*n+i;if(ArrayBuffer.isView(e)){if(l<=e.length)return e;if(l*e.BYTES_PER_ELEMENT<=e.buffer.byteLength)return new c(e.buffer,0,l)}let u=1/0;s&&(u=s*n+i);let d=this._allocate(c,l,o,u);return e&&a?d.set(e):o||d.fill(0,0,4),this._release(e),d}release(e){this._release(e)}_allocate(e,t,n,r){let i=Math.max(Math.ceil(t*this.opts.overAlloc),1);i>r&&(i=r);let a=this._pool,o=e.BYTES_PER_ELEMENT*i,s=a.findIndex(e=>e.byteLength>=o);if(s>=0){let t=new e(a.splice(s,1)[0],0,i);return n&&t.fill(0),t}return new e(i)}_release(e){if(!ArrayBuffer.isView(e))return;let t=this._pool,{buffer:n}=e,{byteLength:r}=n,i=t.findIndex(e=>e.byteLength>=r);i<0?t.push(n):(i>0||t.length<this.opts.poolSize)&&t.splice(i,0,n),t.length>this.opts.poolSize&&t.shift()}};function Au(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function ju(e,t){let n=e%t;return n<0?t+n:n}function Mu(e){return[e[12],e[13],e[14]]}function Nu(e){return{left:Fu(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),right:Fu(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),bottom:Fu(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),top:Fu(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),near:Fu(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),far:Fu(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14])}}var Pu=new Sa;function Fu(e,t,n,r){Pu.set(e,t,n);let i=Pu.len();return{distance:r/i,normal:new Sa(-e/i,-t/i,-n/i)}}function Iu(e){return e-Math.fround(e)}var Lu;function Ru(e,t){let{size:n=1,startIndex:r=0}=t,i=t.endIndex===void 0?e.length:t.endIndex,a=(i-r)/n;Lu=ku.allocate(Lu,a,{type:Float32Array,size:n*2});let o=r,s=0;for(;o<i;){for(let t=0;t<n;t++){let r=e[o++];Lu[s+t]=r,Lu[s+t+n]=Iu(r)}s+=n*2}return Lu.subarray(0,a*n*2)}function zu(e){let t=null,n=!1;for(let r of e)r&&(t?(n||=(t=[[t[0][0],t[0][1]],[t[1][0],t[1][1]]],!0),t[0][0]=Math.min(t[0][0],r[0][0]),t[0][1]=Math.min(t[0][1],r[0][1]),t[1][0]=Math.max(t[1][0],r[1][0]),t[1][1]=Math.max(t[1][1],r[1][1])):t=r);return t}var Bu=Math.PI/180,Vu=Au(),Hu=[0,0,0],Uu={unitsPerMeter:[1,1,1],metersPerUnit:[1,1,1]};function Wu({width:e,height:t,orthographic:n,fovyRadians:r,focalDistance:i,padding:a,near:o,far:s}){let c=e/t,l=n?new L().orthographic({fovy:r,aspect:c,focalDistance:i,near:o,far:s}):new L().perspective({fovy:r,aspect:c,near:o,far:s});if(a){let{left:n=0,right:r=0,top:i=0,bottom:o=0}=a,s=M((n+e-r)/2,0,e)-e/2,c=M((i+t-o)/2,0,t)-t/2;l[8]-=s*2/e,l[9]+=c*2/t}return l}var Gu=class e{constructor(e={}){this._frustumPlanes={},this.id=e.id||this.constructor.displayName||`viewport`,this.x=e.x||0,this.y=e.y||0,this.width=e.width||1,this.height=e.height||1,this.zoom=e.zoom||0,this.padding=e.padding,this.distanceScales=e.distanceScales||Uu,this.focalDistance=e.focalDistance||1,this.position=e.position||Hu,this.modelMatrix=e.modelMatrix||null;let{longitude:t,latitude:n}=e;this.isGeospatial=Number.isFinite(n)&&Number.isFinite(t),this._initProps(e),this._initMatrices(e),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return this.distanceScales.metersPerUnit[2]/this.scale}get projectionMode(){return this.isGeospatial?this.zoom<12?H.WEB_MERCATOR:H.WEB_MERCATOR_AUTO_OFFSET:H.IDENTITY}equals(t){return t instanceof e?this===t?!0:t.width===this.width&&t.height===this.height&&t.scale===this.scale&&t.projectionMode===this.projectionMode&&t.resolution===this.resolution&&k(t.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&k(t.projectionMatrix,this.projectionMatrix)&&k(t.viewMatrix,this.viewMatrix):!1}project(e,{topLeft:t=!0}={}){let n=kl(this.projectPosition(e),this.pixelProjectionMatrix),[r,i]=n,a=t?i:this.height-i;return e.length===2?[r,a]:[r,a,n[2]]}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[r,i,a]=e,o=t?i:this.height-i,s=n&&n*this.distanceScales.unitsPerMeter[2],c=Al([r,o,a],this.pixelUnprojectionMatrix,s),[l,u,d]=this.unprojectPosition(c);return Number.isFinite(a)?[l,u,d]:Number.isFinite(n)?[l,u,n]:[l,u]}projectPosition(e){let[t,n]=this.projectFlat(e);return[t,n,(e[2]||0)*this.distanceScales.unitsPerMeter[2]]}unprojectPosition(e){let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)*this.distanceScales.metersPerUnit[2]]}projectFlat(e){if(this.isGeospatial){let t=yl(e);return t[1]=M(t[1],-318,830),t}return e}unprojectFlat(e){return this.isGeospatial?bl(e):e}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,0],t),r=this.unproject([this.width,0],t),i=this.unproject([0,this.height],t),a=this.unproject([this.width,this.height],t);return[Math.min(n[0],r[0],i[0],a[0]),Math.min(n[1],r[1],i[1],a[1]),Math.max(n[0],r[0],i[0],a[0]),Math.max(n[1],r[1],i[1],a[1])]}getDistanceScales(e){return e&&this.isGeospatial?Cl({longitude:e[0],latitude:e[1],highPrecision:!0}):this.distanceScales}containsPixel({x:e,y:t,width:n=1,height:r=1}){return e<this.x+this.width&&this.x<e+n&&t<this.y+this.height&&this.y<t+r}getFrustumPlanes(){return this._frustumPlanes.near||Object.assign(this._frustumPlanes,Nu(this.viewProjectionMatrix)),this._frustumPlanes}panByPosition(e,t,n){return null}_initProps(e){let t=e.longitude,n=e.latitude;this.isGeospatial&&(Number.isFinite(e.zoom)||(this.zoom=xl({latitude:n})+Math.log2(this.focalDistance)),this.distanceScales=e.distanceScales||Cl({latitude:n,longitude:t})),this.scale=2**this.zoom;let{position:r,modelMatrix:i}=e,a=Hu;if(r&&(a=i?new L(i).transformAsVector(r,[]):r),this.isGeospatial){let e=this.projectPosition([t,n,0]);this.center=new Sa(a).scale(this.distanceScales.unitsPerMeter).add(e)}else this.center=this.projectPosition(a)}_initMatrices(e){let{viewMatrix:t=Vu,projectionMatrix:n=null,orthographic:r=!1,fovyRadians:i,fovy:a=75,near:o=.1,far:s=1e3,padding:c=null,focalDistance:l=1}=e;this.viewMatrixUncentered=t,this.viewMatrix=new L().multiplyRight(t).translate(new Sa(this.center).negate()),this.projectionMatrix=n||Wu({width:this.width,height:this.height,orthographic:r,fovyRadians:i||a*Bu,focalDistance:l,padding:c,near:o,far:s});let u=Au();Da(u,u,this.projectionMatrix),Da(u,u,this.viewMatrix),this.viewProjectionMatrix=u,this.viewMatrixInverse=Ta([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=Mu(this.viewMatrixInverse);let d=Au(),f=Au();ka(d,d,[this.width/2,-this.height/2,1]),Oa(d,d,[1,-1,0]),Da(f,d,this.viewProjectionMatrix),this.pixelProjectionMatrix=f,this.pixelUnprojectionMatrix=Ta(Au(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||P.warn(`Pixel project matrix not invertible`)()}};Gu.displayName=`Viewport`;var Ku=class e extends Gu{constructor(e={}){let{latitude:t=0,longitude:n=0,zoom:r=0,pitch:i=0,bearing:a=0,nearZMultiplier:o=.1,farZMultiplier:s=1.01,nearZ:c,farZ:l,orthographic:u=!1,projectionMatrix:d,repeat:f=!1,worldOffset:p=0,position:m,padding:h,legacyMeterSizes:g=!1}=e,{width:_,height:v,altitude:y=1.5}=e,b=2**r;_||=1,v||=1;let x,S=null;if(d)y=d[5]/2,x=Dl(y);else{e.fovy?(x=e.fovy,y=Ol(x)):x=Dl(y);let n;if(h){let{top:e=0,bottom:t=0}=h;n=[0,M((e+v-t)/2,0,v)-v/2]}S=El({width:_,height:v,scale:b,center:m&&[0,0,m[2]*Sl(t)],offset:n,pitch:i,fovy:x,nearZMultiplier:o,farZMultiplier:s}),Number.isFinite(c)&&(S.near=c),Number.isFinite(l)&&(S.far=l)}let C=Tl({height:v,pitch:i,bearing:a,scale:b,altitude:y});p&&(C=new L().translate([512*p,0,0]).multiplyLeft(C)),super({...e,width:_,height:v,viewMatrix:C,longitude:n,latitude:t,zoom:r,...S,fovy:x,focalDistance:y}),this.latitude=t,this.longitude=n,this.zoom=r,this.pitch=i,this.bearing=a,this.altitude=y,this.fovy=x,this.orthographic=u,this._subViewports=f?[]:null,this._pseudoMeters=g,Object.freeze(this)}get subViewports(){if(this._subViewports&&!this._subViewports.length){let t=this.getBounds(),n=Math.floor((t[0]+180)/360),r=Math.ceil((t[2]-180)/360);for(let t=n;t<=r;t++){let n=t?new e({...this,worldOffset:t}):this;this._subViewports.push(n)}}return this._subViewports}equals(t){return t instanceof e&&t._pseudoMeters===this._pseudoMeters&&super.equals(t)}projectPosition(e){if(this._pseudoMeters)return super.projectPosition(e);let[t,n]=this.projectFlat(e);return[t,n,(e[2]||0)*Sl(e[1])]}unprojectPosition(e){if(this._pseudoMeters)return super.unprojectPosition(e);let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)/Sl(n)]}addMetersToLngLat(e,t){return wl(e,t)}panByPosition(e,t,n){let r=Al(t,this.pixelUnprojectionMatrix),i=Ji([],this.projectFlat(e),Xi([],r)),a=Ji([],this.center,i),[o,s]=this.unprojectFlat(a);return{longitude:o,latitude:s}}panByPosition3D(e,t){let n=e[2]||0,r=$i([],e,this.unproject(t,{targetZ:n}));return{longitude:this.longitude+r[0],latitude:this.latitude+r[1]}}getBounds(e={}){let t=Pl(this,e.z||0);return[Math.min(t[0][0],t[1][0],t[2][0],t[3][0]),Math.min(t[0][1],t[1][1],t[2][1],t[3][1]),Math.max(t[0][0],t[1][0],t[2][0],t[3][0]),Math.max(t[0][1],t[1][1],t[2][1],t[3][1])]}fitBounds(t,n={}){let{width:r,height:i}=this,{longitude:a,latitude:o,zoom:s}=jl({width:r,height:i,bounds:t,...n});return new e({width:r,height:i,longitude:a,latitude:o,zoom:s})}};Ku.displayName=`WebMercatorViewport`;var qu=[0,0,0];function Ju(e,t,n=!1){let r=t.projectPosition(e);if(n&&t instanceof Ku){let[n,i,a=0]=e;r[2]=a*t.getDistanceScales([n,i]).unitsPerMeter[2]}return r}function Yu(e){let{viewport:t,modelMatrix:n,coordinateOrigin:r}=e,{coordinateSystem:i,fromCoordinateSystem:a,fromCoordinateOrigin:o}=e;return i===`default`&&(i=t.isGeospatial?`lnglat`:`cartesian`),a===void 0?a=i:a===`default`&&(a=t.isGeospatial?`lnglat`:`cartesian`),o===void 0&&(o=r),{viewport:t,coordinateSystem:i,coordinateOrigin:r,modelMatrix:n,fromCoordinateSystem:a,fromCoordinateOrigin:o}}function Xu(e,{viewport:t,modelMatrix:n,coordinateSystem:r,coordinateOrigin:i,offsetMode:a}){let[o,s,c=0]=e;switch(n&&([o,s,c]=Ha([],[o,s,c,1],n)),r){case`default`:return Xu(e,{viewport:t,modelMatrix:n,coordinateSystem:t.isGeospatial?`lnglat`:`cartesian`,coordinateOrigin:i,offsetMode:a});case`lnglat`:return Ju([o,s,c],t,a);case`lnglat-offsets`:return Ju([o+i[0],s+i[1],c+(i[2]||0)],t,a);case`meter-offsets`:return Ju(wl(i,[o,s,c]),t,a);case`cartesian`:return t.isGeospatial?[o+i[0],s+i[1],c+i[2]]:t.projectPosition([o,s,c]);default:throw Error(`Invalid coordinateSystem: ${r}`)}}function Zu(e,t){let{viewport:n,coordinateSystem:r,coordinateOrigin:i,modelMatrix:a,fromCoordinateSystem:o,fromCoordinateOrigin:s}=Yu(t),{autoOffset:c=!0}=t,{geospatialOrigin:l=qu,shaderCoordinateOrigin:u=qu,offsetMode:d=!1}=c?Zc(n,r,i):{},f=Xu(e,{viewport:n,modelMatrix:a,coordinateSystem:o,coordinateOrigin:s,offsetMode:d});return d&&_a(f,f,n.projectPosition(l||u)),f}var Qu=1,$u=1,ed=class{time=0;channels=new Map;animations=new Map;playing=!1;lastEngineTime=-1;constructor(){}addChannel(e){let{delay:t=0,duration:n=1/0,rate:r=1,repeat:i=1}=e,a=Qu++,o={time:0,delay:t,duration:n,rate:r,repeat:i};return this._setChannelTime(o,this.time),this.channels.set(a,o),a}removeChannel(e){this.channels.delete(e);for(let[t,n]of this.animations)n.channel===e&&this.detachAnimation(t)}isFinished(e){let t=this.channels.get(e);return t===void 0?!1:this.time>=t.delay+t.duration*t.repeat}getTime(e){if(e===void 0)return this.time;let t=this.channels.get(e);return t===void 0?-1:t.time}setTime(e){this.time=Math.max(0,e);let t=this.channels.values();for(let e of t)this._setChannelTime(e,this.time);let n=this.animations.values();for(let e of n){let{animation:t,channel:n}=e;t.setTime(this.getTime(n))}}play(){this.playing=!0}pause(){this.playing=!1,this.lastEngineTime=-1}reset(){this.setTime(0)}attachAnimation(e,t){let n=$u++;return this.animations.set(n,{animation:e,channel:t}),e.setTime(this.getTime(t)),n}detachAnimation(e){this.animations.delete(e)}update(e){this.playing&&(this.lastEngineTime===-1&&(this.lastEngineTime=e),this.setTime(this.time+(e-this.lastEngineTime)),this.lastEngineTime=e)}_setChannelTime(e,t){let n=t-e.delay;n>=e.duration*e.repeat?e.time=e.duration*e.rate:(e.time=Math.max(0,n)%e.duration,e.time*=e.rate)}};function td(e){let t=typeof window<`u`?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null;return t?t.call(window,e):setTimeout(()=>e(typeof performance<`u`?performance.now():Date.now()),1e3/60)}function nd(e){let t=typeof window<`u`?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null;if(t){t.call(window,e);return}clearTimeout(e)}var rd=0,id=`Animation Loop`,ad={requestAnimationFrame:e=>td(e),cancelAnimationFrame:e=>nd(e)},od=class e{static defaultAnimationLoopProps={device:null,mobileQuality:void 0,onAddHTML:()=>``,onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:ad};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw=`initialized`;_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(t){if(this.props={...e.defaultAnimationLoopProps,...t},t=this.props,!t.device)throw Error(`No device provided`);this.stats=t.stats||new g({id:`animation-loop-${rd++}`}),this.sharedStats=Ii.stats.get(id),this.frameRate=this.stats.get(`Frame Rate`),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get(`CPU Time`),this.gpuTime=this.stats.get(`GPU Time`),this.setProps({autoResizeViewport:t.autoResizeViewport,animationFrameProvider:t.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this._stopEventHandling(),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(t){this._error=t,this.props.onError(t),this.props.onError===e.defaultAnimationLoopProps.onError&&typeof window<`u`&&typeof ErrorEvent<`u`&&window.dispatchEvent(new ErrorEvent(`error`,{error:t,message:t.message}))}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if(`autoResizeViewport`in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),`animationFrameProvider`in e){let t=e.animationFrameProvider||ad;if(t!==this.props.animationFrameProvider){let e=this._animationFrameId!==null;e&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,e&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}return this._running?(this._cancelAnimationFrame(),this._requestAnimationFrame(),this):null}catch(e){let t=e instanceof Error?e:Error(`Unknown error`);throw this.props.onError(t),t}}stop(){if(this._running){let e=this.animationProps;this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0,e&&this.props.onFinalize(e)}return this}redraw(e,t=null){return this.device?.isLost||this._error?this:(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&=(this._resolveNextFrame(this),this._nextFramePromise=null,null),this._endFrameTimers(),this)}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw(`waitForRender`),this._nextFramePromise||=new Promise(e=>{this._resolveNextFrame=e}),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw(`toDataURL`),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw Error(`OffscreenCanvas`)}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){this._animationFrameId!==null&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){if(this._running)try{this.redraw(e,t??null),this._requestAnimationFrame()}catch(e){let t=e instanceof Error?e:Error(String(e));this.reportError(t),this.stop()}}_renderFrame(e){if(this.display){this.display._renderFrame(e);return}let t=this.props.onRender(this._getAnimationProps());this.device&&t!==!1&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw Error(`loop`);let t=e?.canvas,n=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:n,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null,mobileQuality:this.props.mobileQuality}}_getAnimationProps(){if(!this.animationProps)throw Error(`animationProps`);return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:n}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw(`drawing buffer resized`),n!==this.animationProps.aspect&&this.setNeedsRedraw(`drawing buffer aspect changed`),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=n,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw Error(`No device provided`);this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement(`div`);document.body.appendChild(e),e.style.position=`relative`;let t=document.createElement(`div`);t.style.position=`absolute`,t.style.left=`10px`,t.style.bottom=`10px`,t.style.width=`300px`,t.style.background=`white`,this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let n=this.props.onAddHTML(t);n&&(t.innerHTML=n)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize();return{width:e,height:t,aspect:e>0&&t>0?e/t:1}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??(typeof performance<`u`?performance.now():Date.now());if(this._lastFrameTime){let e=t-this._lastFrameTime;e>0&&this.frameRate.addTime(e)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;e!==void 0&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener(`mousemove`,this._onMousemove),this.canvas.addEventListener(`mouseleave`,this._onMouseleave))}_stopEventHandling(){this.canvas?.removeEventListener(`mousemove`,this._onMousemove),this.canvas?.removeEventListener(`mouseleave`,this._onMouseleave)}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}},sd=`struct VertexInputs {
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
`,cd=`#version 300 es
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
`,ld=[-1,-1,1,-1,-1,1,1,1],ud=[-1,-1,3,-1,-1,3],dd=class extends j{constructor(e,t){let{geometryType:n=`quad`,...r}=t,i=n===`triangle`?ud:ld,a=i.map(e=>(e+1)/2),o=i.length/2;r.source&&=`${sd}\n${r.source}`,super(e,{id:r.id||s(`clip-space`),...r,vs:cd,vertexCount:o,geometry:new O({topology:n===`triangle`?`triangle-list`:`triangle-strip`,vertexCount:o,attributes:{clipSpacePositions:{size:2,value:new Float32Array(i)},texCoords:{size:2,value:new Float32Array(a)},coordinates:{size:2,value:new Float32Array(a)}}})})}},fd={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function pd(e){return e?Array.isArray(e)?e[0]??null:e:null}function md(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=pd(n);if(!e)return null;let{width:t}=hd(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=pd(n);return e?hd(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=pd(n[0]);return e?hd(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=pd(t);return r?hd(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=pd(e[t]);return r?hd(r):null}default:return null}}function hd(e){if(v(e))return y(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function gd(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function _d(e){return ArrayBuffer.isView(e)}function vd(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function yd(e){let t=fd[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function bd(e,t){return 6*e+yd(t)}function xd(e){throw Error(`setTexture1DData not supported in WebGL.`)}function Sd(e){return Array.isArray(e)?e:[e]}function Cd(e,t,n,r){let i=Sd(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(v(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if(gd(t))o.push({type:`texture-data`,data:t,textureFormat:vd(t),z:a,mipLevel:e});else if(_d(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function wd(e){let t=[];for(let n=0;n<e.length;n++)t.push(...Cd(n,e[n]));return t}function Td(e){let t=[];for(let n=0;n<e.length;n++)t.push(...Cd(n,e[n]));return t}function Ed(e){let t=[];for(let[n,r]of Object.entries(e)){let e=yd(n);t.push(...Cd(e,r))}return t}function Dd(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=bd(n,r);t.push(...Cd(e,i))}}),t}var Od=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=s(`dynamic-texture`),i=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let t=await this._loadAllData(e);this._checkNotDestroyed();let n=t.data?kd({...t,width:e.width,height:e.height,format:e.format}):[],r=`format`in e&&e.format!==void 0,i=`usage`in e&&e.usage!==void 0,a=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:md(t)||{width:this.props.width||1,height:this.props.height||1};if(!a||a.width<=0||a.height<=0)throw Error(`${this} size could not be determined or was zero`);let o=Ad(this.device,n,a,{format:r?e.format:void 0}),s=o.format??this.props.format,c={...this.props,...a,format:s,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(s)&&!i&&(c.usage=C.SAMPLE|C.COPY_DST);let l=this.props.mipmaps&&!o.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(s);if(this.device.type===`webgpu`&&l){let e=this.props.dimension===`3d`?C.SAMPLE|C.STORAGE|C.COPY_DST|C.COPY_SRC:C.SAMPLE|C.RENDER|C.COPY_DST|C.COPY_SRC;c.usage|=e}let d=this.device.getMipLevelCount(c.width,c.height),f=o.hasExplicitMipChain?o.mipLevels:this.props.mipLevels===`auto`?d:Math.max(1,Math.min(d,this.props.mipLevels??1)),p={...c,mipLevels:f};this._texture=this.device.createTexture(p),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),o.subresources.length&&this._setTextureSubresources(o.subresources),this.props.mipmaps&&!o.hasExplicitMipChain&&!l&&u.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),l&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),u.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):u.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof S?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=this.device.createBuffer({byteLength:i.byteLength,usage:p.COPY_DST|p.MAP_READ});this.texture.readBuffer({...e,width:t,height:n,depthOrArrayLayers:r},a);let o=this.device.createFence();return await o.signaled,o.destroy(),a}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),u.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=fd[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=xd(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=Cd(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=wd(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=Td(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=Ed(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=Dd(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await Pd(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&u.warn(`${this} already destroyed`)}_checkReady(){this.isReady||u.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...C.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function kd(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return xd(e.data);case`2d`:return Cd(0,e.data,t,n);case`3d`:return wd(e.data);case`2d-array`:return Td(e.data);case`cube`:return Ed(e.data);case`cube-array`:return Dd(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function Ad(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=Md(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=jd(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?Nd(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=Md(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=jd(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function jd(e){if(e.type===`texture-data`)return e.textureFormat??vd(e.data)}function Md(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function Nd(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function Pd(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(Pd));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(Pd)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}var Fd={name:`background`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},Id=`@group(0) @binding(auto) var backgroundTexture: texture_2d<f32>;
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
`,Ld=`#version 300 es
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
`,Rd=class extends dd{backgroundTexture=null;flipY=!1;constructor(e,t){if(super(e,{...t,id:t.id||`background-texture-model`,source:Id,fs:Ld,modules:[...t.modules||[],Fd],parameters:{depthWriteEnabled:!1,...t.parameters||{},...t.blend?{blend:!0,blendColorOperation:`add`,blendAlphaOperation:`add`,blendColorSrcFactor:`one-minus-dst-alpha`,blendColorDstFactor:`one`,blendAlphaSrcFactor:`one-minus-dst-alpha`,blendAlphaDstFactor:`one`}:{}}}),!t.backgroundTexture)throw Error(`BackgroundTextureModel requires a backgroundTexture prop`);this.setProps(t)}setProps(e){let{backgroundTexture:t}=e;if(e.flipY!==void 0&&(this.flipY=e.flipY,this.backgroundTexture&&this.updateScale(this.backgroundTexture)),t)if(this.setBindings({backgroundTexture:t}),t.isReady){let e=t instanceof Od?t.texture:t;this.backgroundTexture=e,this.updateScale(e)}else t.ready.then(e=>{this.backgroundTexture=e,this.updateScale(e)})}predraw(e){super.predraw(e)}updateScale(e){if(!e){this.shaderInputs.setProps({background:{scale:[1,1],flipY:0}});return}let[t,n]=this.device.getCanvasContext().getDrawingBufferSize(),r=e.width,i=e.height,a=t/n,o=r/i,s=1,c=1;a>o?c=a/o:s=o/a,this.shaderInputs.setProps({background:{scale:[s,c],flipY:this.flipY?1:0}})}};function zd(e,t={}){let{angleThreshold:n=30,weldTolerance:r=0,positionAttribute:i=`POSITION`}=t,a=Bd(e,i);m(Number.isFinite(r)&&r>=0),m(Number.isFinite(n)&&n>=0&&n<=180);let o=e.indices?.value,s=a.value.length/3,c=new Map,l=new Map,u=new Set,d=new Map,f=Math.cos(n*Math.PI/180),p=r*r;function h(e){return[a.value[e*3],a.value[e*3+1],a.value[e*3+2]]}function g(e){let t=c.get(e);if(t!==void 0)return t;m(Number.isInteger(e)&&e>=0&&e<s);let n=h(e);m(n.every(Number.isFinite));let i=r>0?n.map(e=>Math.floor(e/r)):n,a=r>0?1:0;for(let t=-a;t<=a;t++)for(let r=-a;r<=a;r++)for(let o=-a;o<=a;o++){let a=l.get(`${i[0]+t},${i[1]+r},${i[2]+o}`);for(let t of a||[]){let r=h(t);if((n[0]-r[0])**2+(n[1]-r[1])**2+(n[2]-r[2])**2<=p)return c.set(e,t),t}}let o=i.join(`,`),u=l.get(o)||[];return u.push(e),l.set(o,u),c.set(e,e),e}function _(e,t,n){let r=Math.min(e,t),i=Math.max(e,t),a=`${r},${i}`,o=d.get(a);if(o){o.faceCount++;let e=n[0]*o.normal[0]+n[1]*o.normal[1]+n[2]*o.normal[2];o.crease||=e<.9999999&&e<=f+1e-7}else d.set(a,{start:r,end:i,normal:n,faceCount:1,crease:!1})}for(let t=0;t<e.vertexCount;t+=3){let e=g(o?.[t]??t),n=g(o?.[t+1]??t+1),r=g(o?.[t+2]??t+2);if(e===n||n===r||r===e)continue;let i=[e,n,r].sort((e,t)=>e-t).join(`,`);if(u.has(i))continue;u.add(i);let a=h(e),s=h(n),c=h(r),l=s.map((e,t)=>e-a[t]),d=c.map((e,t)=>e-a[t]),f=[l[1]*d[2]-l[2]*d[1],l[2]*d[0]-l[0]*d[2],l[0]*d[1]-l[1]*d[0]],p=Math.hypot(...f);p!==0&&(f[0]/=p,f[1]/=p,f[2]/=p,_(e,n,f),_(n,r,f),_(r,e,f))}let v=[...d.values()].filter(e=>t.includeCoplanarEdges||e.faceCount!==2||e.crease).sort((e,t)=>e.start-t.start||e.end-t.end);return new O({id:`${e.id}-edges`,topology:`line-list`,attributes:{[i]:a},indices:new Uint32Array(v.flatMap(e=>[e.start,e.end]))})}function Bd(e,t){let n=e.attributes[t];return m(e.topology===`triangle-list`&&n?.size===3),m(n.value.length%3==0&&e.vertexCount%3==0),m(!n.byteStride||n.byteStride===n.value.BYTES_PER_ELEMENT*3),m(e.vertexCount>=0&&e.vertexCount<=(e.indices?.value.length??n.value.length/3)),n}var Vd=class{id;current;next;constructor(e){this.id=e.id||`swap`,this.current=e.current,this.next=e.next}destroy(){this.current?.destroy(),this.next?.destroy()}swap(){let e=this.current;this.current=this.next,this.next=e}},Hd=class extends Vd{constructor(e,t){t={...t};let{width:n=1,height:r=1}=t,i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-0`,format:i,usage:C.SAMPLE|C.RENDER|C.COPY_SRC|C.COPY_DST,width:n,height:r}):i),a=e.createFramebuffer({...t,colorAttachments:i});i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-1`,format:i,usage:C.SAMPLE|C.RENDER|C.COPY_SRC|C.COPY_DST,width:n,height:r}):i);let o=e.createFramebuffer({...t,colorAttachments:i});super({current:a,next:o});for(let[e,n]of(t.colorAttachments||[]).entries())typeof n==`string`&&(a.attachResource(a.colorAttachments[e].texture),o.attachResource(o.colorAttachments[e].texture))}resize(e){if(e.width===this.current.width&&e.height===this.current.height)return!1;let{current:t,next:n}=this;return this.current=t.clone(e),Ud(this.current),t.destroy(),this.next=n.clone(e),Ud(this.next),n.destroy(),!0}};function Ud(e){for(let t of e.colorAttachments)e.attachResource(t.texture);e.depthStencilAttachment&&e.attachResource(e.depthStencilAttachment.texture)}function Wd(e){let{shaderPass:t,action:n,shadingLanguage:r}=e;switch(n){case`filter`:let e=`${t.name}_filterColor_ext`;return r===`wgsl`?Gd(e):qd(e);case`sample`:let n=`${t.name}_sampleColor`;return r===`wgsl`?Kd(n):Jd(n);default:throw Error(`${t.name} no fragment shader generated for shader pass`)}}function Gd(e){return`\
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
`}function Kd(e){return`\
@group(0) @binding(auto) var sourceTexture: texture_2d<f32>;
@group(0) @binding(auto) var sourceTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let texCoord = shaderPassRenderer_getTextureUV(inputs.coordinate);
  let texSize = vec2f(textureDimensions(sourceTexture));
  return ${e}(sourceTexture, sourceTextureSampler, texSize, texCoord);
}
`}function qd(e){return`\
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
`}function Jd(e){return`\
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
`}var Yd={name:`textureTransform`,source:`
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
`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},Xd=new Set([`original`,`previous`]),Zd=class{device;shaderInputs;passRenderers;swapFramebuffers;textureModel;constructor(t,n){this.device=t;let r=tf(n.shaderPasses);r.map(t=>e(t));let i=r.reduce((e,t)=>({...e,[t.name]:t}),{});this.shaderInputs=n.shaderInputs||new o(i);let a=t.getCanvasContext().getDrawingBufferSize();this.swapFramebuffers=new Hd(t,{colorAttachments:[n.colorFormat||t.preferredColorFormat],width:a[0],height:a[1]}),this.textureModel=new Rd(t,{backgroundTexture:this.swapFramebuffers.current.colorAttachments[0].texture,flipY:n.flipY??t.type===`webgpu`});let s=n.flipY??t.type===`webgpu`;this.passRenderers=n.shaderPasses.map(e=>new Qd(t,e,this.shaderInputs,s))}destroy(){for(let e of this.passRenderers)e.destroy();this.swapFramebuffers.destroy(),this.textureModel.destroy()}resize(e){e||=this.device.getCanvasContext().getDrawingBufferSize(),this.swapFramebuffers.resize({width:e[0],height:e[1]});for(let t of this.passRenderers)t.resize(e)}resetHistory(){for(let e of this.passRenderers)e.resetHistory()}renderToScreen(e){return this.encodeToScreen(this.device.commandEncoder,e)}encodeToScreen(e,t){let n=this.encodeToTexture(e,t);if(!n)return!1;let r=this.device.getDefaultCanvasContext().getCurrentFramebuffer({depthStencilFormat:!1});this.textureModel.setProps({backgroundTexture:n}),this.textureModel.predraw(e);let i=e.beginRenderPass({id:`shader-pass-renderer-to-screen`,framebuffer:r,clearDepth:!1});return this.textureModel.draw(i),i.end(),!0}renderToTexture(e){return this.encodeToTexture(this.device.commandEncoder,e)}encodeToTexture(e,t){if(e.device!==this.device)throw Error(`ShaderPassRenderer command encoder must belong to the renderer device`);let{sourceTexture:n}=t;if(n instanceof Od&&!n.isReady)return null;let r=n instanceof Od?n.texture:n;if(this.passRenderers.length===0)return r;t.resetHistory&&this.resetHistory(),this.textureModel.setProps({backgroundTexture:r}),this.textureModel.predraw(e);let i=Sf(this.swapFramebuffers,r),a=e.beginRenderPass({id:`shader-pass-renderer-seed-source`,framebuffer:i,clearColor:[0,0,0,1],clearDepth:!1});this.textureModel.draw(a),a.end();let o=i,s=bf(i),c=!1;try{for(let n of this.passRenderers){n.initializeHistoryTargets(r,this.textureModel,e),n.runComputeOptimization({commandEncoder:e,originalTexture:r,previousTexture:s,runtimeUniforms:t.uniforms||{}});for(let i of n.subPassExecutions){let a=i.output||`previous`,c=a===`previous`?xf(this.swapFramebuffers,o):n.getOutputFramebuffer(a),l=bf(c),u=n.resolveBindings({execution:i,originalTexture:r,previousTexture:s,outputTexture:l,externalBindings:t.bindings||{}}),d=lf(this.shaderInputs,i,t.uniforms||{});i.subPassRenderer.prepare({commandEncoder:e,bindings:u,textureScale:Cf(u.sourceTexture||s,l),uniforms:d});let f=e.beginRenderPass({id:`shader-pass-renderer-run-pass`,framebuffer:c,clearColor:[0,0,0,1],clearDepth:1});i.subPassRenderer.draw(f),f.end(),a===`previous`?(s=l,o=c):n.markTargetWritten(a)}}c=!0}finally{for(let e of this.passRenderers)e.finishFrame(c)}return s}},Qd=class{device;shaderInputs;passDefinition;renderTargets;subPassExecutions;computeRenderer;constructor(e,t,n,r){if(this.device=e,this.shaderInputs=n,this.passDefinition=t,nf(t)){of(t.name,t.renderTargets||{}),this.renderTargets=uf(e,t.renderTargets||{}),rf(e,t)&&(this.computeRenderer=new $d(e,t.compute,this.renderTargets,n)),this.subPassExecutions=(this.computeRenderer?t.steps.filter(e=>!t.compute.replacedPasses.includes(e.shaderPass.name)):t.steps).flatMap(e=>this.createStepExecutions(t,e,r));return}af(t,t.name),this.renderTargets={},this.subPassExecutions=this.createPassExecutions(t,{ownerName:t.name,flipY:r})}destroy(){this.computeRenderer?.destroy();for(let e of this.subPassExecutions)e.subPassRenderer.destroy();pf(this.renderTargets)}resize(e){mf(this.device,this.renderTargets,e)}runComputeOptimization(e){if(!this.computeRenderer)return;let t=this.resolveInputTexture(this.computeRenderer.optimization.input,e.originalTexture,e.previousTexture);this.computeRenderer.encode(e.commandEncoder,t,e.runtimeUniforms);for(let e of Object.values(this.computeRenderer.optimization.outputs))this.markTargetWritten(e)}resetHistory(){for(let e of Object.values(this.renderTargets))e.historyInitialized=!1,e.writtenThisFrame=!1}initializeHistoryTargets(e,t,n){for(let r of Object.values(this.renderTargets)){if(r.spec.lifetime!==`history`||r.historyInitialized)continue;let i=vf(r),a=r.spec.initialize||{clearColor:[0,0,0,0]};if(a===`original`){t.setProps({backgroundTexture:e}),t.predraw(n);let a=n.beginRenderPass({id:`${r.name}-initialize-history`,framebuffer:i,clearColor:[0,0,0,0],clearDepth:!1});t.draw(a),a.end()}else n.beginRenderPass({id:`${r.name}-clear-history`,framebuffer:i,clearColor:a.clearColor,clearDepth:!1}).end();r.historyInitialized=!0}}getOutputFramebuffer(e){return this.getRenderTarget(e).framebuffer}markTargetWritten(e){this.getRenderTarget(e).writtenThisFrame=!0}finishFrame(e){for(let t of Object.values(this.renderTargets)){if(e&&t.spec.lifetime===`history`&&t.writtenThisFrame){let e=_f(t),n=vf(t);t.historyTexture=t.texture,t.historyFramebuffer=t.framebuffer,t.texture=e,t.framebuffer=n,t.historyInitialized=!0}t.writtenThisFrame=!1}}getRenderTarget(e){let t=this.renderTargets[e];if(!t)throw Error(`${this.getOwnerName()}: unknown render target "${e}"`);return t}resolveBindings(e){let{execution:t,originalTexture:n,previousTexture:r,outputTexture:i,externalBindings:a}=e,o=t.inputs||{sourceTexture:`previous`},s=this.shaderInputs.getModuleBindingValues(t.shaderPass.name),c=Object.fromEntries(Object.entries(a).filter(([e])=>t.shaderPass.bindingLayout?.some(t=>t.name===e))),l={...s,...c},u=t.output||`previous`;for(let[e,a]of Object.entries(o)){if(!a)continue;let o=this.resolveInputTexture(a,n,r),s=a in this.renderTargets?this.renderTargets[a]:null;if(u!==`previous`&&a===u&&s?.spec.lifetime!==`history`)throw Error(`${t.ownerName}: subpass cannot read and write render target "${u}" in the same draw`);if(o===i)throw Error(`${t.ownerName}: subpass cannot sample from the render target it is writing to`);l[e]=o}return`sourceTexture`in l||(l.sourceTexture=r),l}createStepExecutions(e,t,n){return af(t.shaderPass,`${e.name}/${t.shaderPass.name}`),this.createPassExecutions(t.shaderPass,{ownerName:`${e.name}/${t.shaderPass.name}`,firstInputs:t.inputs,lastOutput:t.output,uniformOverrides:t.uniforms,flipY:n})}createPassExecutions(e,t){let n=e.passes||[];return n.map((r,i)=>{let a=i===0,o=i===n.length-1,s=a&&t.firstInputs!==void 0?t.firstInputs:r.inputs,c=o&&t.lastOutput!==void 0?t.lastOutput:r.output;return sf(t.ownerName,s,c,this.renderTargets),{ownerName:t.ownerName,shaderPass:e,subPassRenderer:new ef(this.device,e,r,t.flipY),inputs:s,output:c,uniforms:cf(t.uniformOverrides,r.uniforms)}})}resolveInputTexture(e,t,n){switch(e){case`original`:return t;case`previous`:return n;default:{let t=this.getRenderTarget(e);return t.spec.lifetime===`history`&&!t.writtenThisFrame?_f(t):t.texture}}}getOwnerName(){return this.passDefinition.name}},$d=class{optimization;renderTargets;shaderInputs;computation;parameterBuffer;constructor(e,t,n,r){this.optimization=t,this.renderTargets=n,this.shaderInputs=r,this.parameterBuffer=e.createBuffer({id:`${t.name}-parameters`,byteLength:Math.max(Math.ceil(t.uniformNames.length/4)*16,16),usage:p.UNIFORM|p.COPY_DST});let i=Object.entries(t.outputs).map(([e,t],r)=>({name:e,type:`storage`,group:0,location:r+2,access:`write-only`,format:n[t].texture.format}));try{this.computation=new se(e,{id:t.name,source:t.source,shaderLayout:{bindings:[{name:t.uniformBinding,type:`uniform`,group:0,location:0},{name:`sourceTexture`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},...i]}})}catch(e){throw this.parameterBuffer.destroy(),e}}encode(e,t,n){let r={...this.shaderInputs.getUniformValues()[this.optimization.uniformModule]||{},...this.optimization.uniforms,...n[this.optimization.uniformModule]||{}},i=new Float32Array(Math.max(Math.ceil(this.optimization.uniformNames.length/4)*4,4));for(let[e,t]of this.optimization.uniformNames.entries()){let n=r[t];i[e]=typeof n==`number`?n:0}this.parameterBuffer.write(i);let a=Object.entries(this.optimization.outputs),o={[this.optimization.uniformBinding]:this.parameterBuffer,sourceTexture:t.view};for(let[e,t]of a)o[e]=this.renderTargets[t].texture.view;this.computation.setBindings(o),this.computation.predraw(e);let s=this.renderTargets[a[0][1]].texture,c=e.beginComputePass({id:this.optimization.name});this.computation.dispatch(c,Math.ceil(s.width/this.optimization.workgroupSize[0]),Math.ceil(s.height/this.optimization.workgroupSize[1]),1),c.end()}destroy(){this.computation.destroy(),this.parameterBuffer.destroy()}},ef=class{model;shaderPass;subPass;flipY;constructor(e,t,n,r){this.shaderPass=t,this.subPass=n,this.flipY=r;let i=Wd({shaderPass:t,action:n.action||n.filter&&`filter`||n.sampler&&`sample`||`filter`,shadingLanguage:e.info.shadingLanguage});this.model=new dd(e,{id:`${t.name}-subpass`,source:i,fs:i,modules:[Yd,t],parameters:{depthWriteEnabled:!1}})}destroy(){this.model.destroy()}prepare(e){let{commandEncoder:t,bindings:n,textureScale:r,uniforms:i}=e;this.model.shaderInputs.setProps({textureTransform:{scale:r,flipY:this.flipY?1:0}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:this.shaderPass.uniforms||{}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:i||{}}),this.model.setBindings(n||{}),this.model.predraw(t)}draw(e){this.model.draw(e)}};function tf(e){return e.flatMap(e=>nf(e)?e.steps.map(e=>e.shaderPass):[e])}function nf(e){return`steps`in e}function rf(e,t){let n=t.compute;if(!n||e.type!==`webgpu`)return!1;let r=Object.values(n.outputs);return r.length===0||r.length>e.limits.maxStorageTexturesPerShaderStage||n.workgroupSize[0]>e.limits.maxComputeWorkgroupSizeX||n.workgroupSize[1]>e.limits.maxComputeWorkgroupSizeY||n.workgroupSize[0]*n.workgroupSize[1]>e.limits.maxComputeInvocationsPerWorkgroup?!1:r.every(n=>{let r=t.renderTargets?.[n];if(!r?.storage)return!1;let i=r.format||e.preferredColorFormat;return e.getTextureFormatCapabilities(i).store})}function af(e,t){let n=e.renderTargets;if(n&&Object.keys(n).length>0)throw Error(`${t}: ShaderPass.renderTargets is not supported; use CompositeShaderPass.renderTargets instead`)}function of(e,t){for(let n of Object.keys(t))if(Xd.has(n))throw Error(`${e}: render target name "${n}" is reserved`)}function sf(e,t,n,r){let i=t||{sourceTexture:`previous`};for(let t of Object.values(i))if(t&&t!==`original`&&t!==`previous`&&!(t in r))throw Error(`${e}: unknown input source "${t}"`);if(n&&n!==`previous`&&!(n in r))throw Error(`${e}: unknown output target "${n}"`)}function cf(e,t){if(!(!e&&!t))return{...e||{},...t||{}}}function lf(e,t,n){return cf(cf(e.getUniformValues()[t.shaderPass.name],t.uniforms),n[t.shaderPass.name])}function uf(e,t){let n=e.getCanvasContext().getDrawingBufferSize(),r={};for(let[i,a]of Object.entries(t)){if(a.aliasFor){let t=r[a.aliasFor];if(!t)throw Error(`${i}: target alias references an unknown earlier target`);let o=yf(n,a.scale),s=a.format||e.preferredColorFormat;if(a.lifetime===`history`||t.spec.lifetime===`history`||!df(a,t.spec)||t.texture.width!==o[0]||t.texture.height!==o[1]||t.texture.format!==s||a.storage&&!t.spec.storage||!ff(a,t.spec))throw Error(`${i}: target alias must match a transient target's size, format, and sampler`);r[i]=t;continue}r[i]=hf(e,i,a,n)}return r}function df(e,t){let n=e.scale||[1,1],r=t.scale||[1,1];return n[0]===r[0]&&n[1]===r[1]}function ff(e,t){let n=e.sampler||{},r=t.sampler||{},i=Object.entries(n);return i.length===Object.keys(r).length&&i.every(([e,t])=>r[e]===t)}function pf(e){for(let t of new Set(Object.values(e)))t.framebuffer.destroy(),t.texture.destroy(),t.historyFramebuffer?.destroy(),t.historyTexture?.destroy()}function mf(e,t,n){for(let r of new Set(Object.values(t))){let t=yf(n,r.spec.scale);if(r.texture.width===t[0]&&r.texture.height===t[1])continue;r.framebuffer.destroy(),r.texture.destroy(),r.historyFramebuffer?.destroy(),r.historyTexture?.destroy();let i=hf(e,r.name,r.spec,n);r.texture=i.texture,r.framebuffer=i.framebuffer,r.historyTexture=i.historyTexture,r.historyFramebuffer=i.historyFramebuffer,r.historyInitialized=!1,r.writtenThisFrame=!1}}function hf(e,t,n,r){let i=yf(r,n.scale),{texture:a,framebuffer:o}=gf(e,t,n,i),s,c;if(n.lifetime===`history`){let r=gf(e,`${t}-history`,n,i);s=r.texture,c=r.framebuffer}return{name:t,spec:n,texture:a,framebuffer:o,historyTexture:s,historyFramebuffer:c,historyInitialized:!1,writtenThisFrame:!1}}function gf(e,t,n,r){let i=e.createTexture({id:`${t}-texture`,width:r[0],height:r[1],format:n.format||e.preferredColorFormat,usage:C.SAMPLE|C.RENDER|C.COPY_SRC|C.COPY_DST|(n.storage&&e.type===`webgpu`&&e.getTextureFormatCapabilities(n.format||e.preferredColorFormat).store?C.STORAGE:0),...n.sampler?{sampler:n.sampler}:{}});return{texture:i,framebuffer:e.createFramebuffer({id:`${t}-framebuffer`,width:r[0],height:r[1],colorAttachments:[i]})}}function _f(e){if(!e.historyTexture)throw Error(`${e.name}: transient render target has no history texture`);return e.historyTexture}function vf(e){if(!e.historyFramebuffer)throw Error(`${e.name}: transient render target has no history framebuffer`);return e.historyFramebuffer}function yf(e,t=[1,1]){return[Math.max(1,Math.round(e[0]*t[0])),Math.max(1,Math.round(e[1]*t[1]))]}function bf(e){let t=e.colorAttachments[0]?.texture;if(!t)throw Error(`ShaderPassRenderer: framebuffer is missing a color attachment texture`);return t}function xf(e,t){return t===e.current?e.next:e.current}function Sf(e,t){return bf(e.current)===t?e.next:e.current}function Cf(e,t){let n=e.width/e.height,r=t.width/t.height;return r>n?[1,r/n]:[n/r,1]}var wf={blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`zero`,blendAlphaOperation:`add`,blendAlphaSrcFactor:`constant`,blendAlphaDstFactor:`zero`},Tf=class extends bu{constructor(){super(...arguments),this._colorEncoderState=null}render(e){return`pickingFBO`in e?this._drawPickingBuffer(e):{decodePickingColor:null,stats:super._render(e)}}_drawPickingBuffer({layers:e,layerFilter:t,views:n,viewports:r,onViewportActive:i,pickingFBO:a,deviceRect:{x:o,y:s,width:c,height:l},cullRect:u,effects:d,pass:f=`picking`,pickZ:p,canvasContext:m,shaderModuleProps:h,clearColor:g}){this.pickZ=p;let _=this._resetColorEncoder(p),v=[o,this.device.type===`webgpu`?a.height-s-l:s,c,l],y=super._render({target:a,layers:e,layerFilter:t,views:n,viewports:r,onViewportActive:i,cullRect:u,effects:d?.filter(e=>e.useInPicking),pass:f,canvasContext:m,isPicking:!0,shaderModuleProps:h,clearColor:g??[0,0,0,0],colorMask:15,scissorRect:v});return this._colorEncoderState=null,{decodePickingColor:_&&Df.bind(null,_),stats:y}}shouldDrawLayer(e){let{pickable:t,operation:n}=e.props;return t&&n.includes(`draw`)||n.includes(`terrain`)||n.includes(`mask`)}getShaderModuleProps(e,t,n){return{picking:{isActive:1,isAttribute:this.pickZ,disabledPickingIndices:e.internalState?.disabledPickingIndices},lighting:{enabled:!1}}}getLayerParameters(e,t,n){let r={...e.props.parameters},{pickable:i,operation:a}=e.props;return this._colorEncoderState?i&&a.includes(`draw`)?(Object.assign(r,wf),r.blend=!0,this.device.type===`webgpu`?r.blendConstant=Ef(this._colorEncoderState,e,n):r.blendColor=Ef(this._colorEncoderState,e,n),a.includes(`terrain`)&&e.state?._hasPickingCover&&(r.blendAlphaSrcFactor=`one`)):a.includes(`terrain`)&&(r.blend=!1):r.blend=!1,r}_resetColorEncoder(e){return this._colorEncoderState=e?null:{byLayer:new Map,byAlpha:[]},this._colorEncoderState}};function Ef(e,t,n){let{byLayer:r,byAlpha:i}=e,a,o=r.get(t);return o?(o.viewports.push(n),a=o.a):(a=r.size+1,a<=255?(o={a,layer:t,viewports:[n]},r.set(t,o),i[a]=o):(P.warn(`Too many pickable layers, only picking the first 255`)(),a=0)),[0,0,0,a/255]}function Df(e,t){let n=e.byAlpha[t[3]];return n&&{pickedLayer:n.layer,pickedViewports:n.viewports,pickedObjectIndex:n.layer.decodePickingColor(t)}}var Of={NO_STATE:`Awaiting state`,MATCHED:`Matched. State transferred from previous layer`,INITIALIZED:`Initialized`,AWAITING_GC:`Discarded. Awaiting garbage collection`,AWAITING_FINALIZATION:`No longer matched. Awaiting garbage collection`,FINALIZED:`Finalized! Awaiting garbage collection`},kf=Symbol.for(`component`),Af=Symbol.for(`propTypes`),jf=Symbol.for(`deprecatedProps`),Mf=Symbol.for(`asyncPropDefaults`),Nf=Symbol.for(`asyncPropOriginal`),Pf=Symbol.for(`asyncPropResolved`);function Ff(e,t=()=>!0){return Array.isArray(e)?If(e,t,[]):t(e)?[e]:[]}function If(e,t,n){let r=-1;for(;++r<e.length;){let i=e[r];Array.isArray(i)?If(i,t,n):t(i)&&n.push(i)}return n}function Lf({target:e,source:t,start:n=0,count:r=1}){let i=t.length,a=r*i,o=0;for(let r=n;o<i;o++)e[r++]=t[o];for(;o<a;)o<a-o?(e.copyWithin(n+o,n,n+o),o*=2):(e.copyWithin(n+o,n,n+a-o),o=a);return e}var Rf=class{constructor(e,t,n){this._loadCount=0,this._subscribers=new Set,this.id=e,this.context=n,this.setData(t)}subscribe(e){this._subscribers.add(e)}unsubscribe(e){this._subscribers.delete(e)}inUse(){return this._subscribers.size>0}delete(){}getData(){return this.isLoaded?this._error?Promise.reject(this._error):this._content:this._loader.then(()=>this.getData())}setData(e,t){if(e===this._data&&!t)return;this._data=e;let n=++this._loadCount,r=e;typeof e==`string`&&(r=Br(e)),r instanceof Promise?(this.isLoaded=!1,this._loader=r.then(e=>{this._loadCount===n&&(this.isLoaded=!0,this._error=void 0,this._content=e)}).catch(e=>{this._loadCount===n&&(this.isLoaded=!0,this._error=e||!0)})):(this.isLoaded=!0,this._error=void 0,this._content=e);for(let e of this._subscribers)e.onChange(this.getData())}},zf=class{constructor(e){this.protocol=e.protocol||`resource://`,this._context={device:e.device,gl:e.device?.gl,resourceManager:this},this._resources={},this._consumers={},this._pruneRequest=null}contains(e){return e.startsWith(this.protocol)?!0:e in this._resources}add({resourceId:e,data:t,forceUpdate:n=!1,persistent:r=!0}){let i=this._resources[e];i?i.setData(t,n):(i=new Rf(e,t,this._context),this._resources[e]=i),i.persistent=r}remove(e){let t=this._resources[e];t&&(t.delete(),delete this._resources[e])}unsubscribe({consumerId:e}){let t=this._consumers[e];if(t){for(let e in t){let n=t[e],r=this._resources[n.resourceId];r&&r.unsubscribe(n)}delete this._consumers[e],this.prune()}}subscribe({resourceId:e,onChange:t,consumerId:n,requestId:r=`default`}){let{_resources:i,protocol:a}=this;e.startsWith(a)&&(e=e.replace(a,``),i[e]||this.add({resourceId:e,data:null,persistent:!1}));let o=i[e];if(this._track(n,r,o,t),o)return o.getData()}prune(){this._pruneRequest||=setTimeout(()=>this._prune(),0)}finalize(){for(let e in this._resources)this._resources[e].delete()}_track(e,t,n,r){let i=this._consumers,a=i[e]=i[e]||{},o=a[t],s=o&&o.resourceId&&this._resources[o.resourceId];s&&(s.unsubscribe(o),this.prune()),n&&(o?(o.onChange=r,o.resourceId=n.id):o={onChange:r,resourceId:n.id},a[t]=o,n.subscribe(o))}_prune(){this._pruneRequest=null;for(let e of Object.keys(this._resources)){let t=this._resources[e];!t.persistent&&!t.inUse()&&(t.delete(),delete this._resources[e])}}},Bf=`layerManager.setLayers`,Vf=`layerManager.activateViewport`,Hf=class{constructor(e,t){this._lastRenderedLayers=[],this._needsRedraw=!1,this._needsUpdate=!1,this._nextLayers=null,this._debug=!1,this._defaultShaderModulesChanged=!1,this.activateViewport=e=>{F(Vf,this,e),e&&(this.context.viewport=e)};let{deck:n,stats:r,viewport:i,timeline:a}=t||{};this.layers=[],this.resourceManager=new zf({device:e,protocol:`deck://`}),this.context={mousePosition:null,userData:{},layerManager:this,device:e,gl:e?.gl,deck:n,shaderAssembler:cu(e?.info?.shadingLanguage||`glsl`),defaultShaderModules:[Ko],renderPass:void 0,stats:r||new tn({id:`deck.gl`}),viewport:i||new Gu({id:`DEFAULT-INITIAL-VIEWPORT`}),timeline:a||new ed,resourceManager:this.resourceManager,onError:void 0},Object.seal(this)}finalize(){this.resourceManager.finalize();for(let e of this.layers)this._finalizeLayer(e)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);for(let n of this.layers){let r=n.getNeedsRedraw(e);t||=r}return t}needsUpdate(){return this._nextLayers&&this._nextLayers!==this._lastRenderedLayers?`layers changed`:this._defaultShaderModulesChanged?`shader modules changed`:this._needsUpdate}setNeedsRedraw(e){this._needsRedraw=this._needsRedraw||e}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e}getLayers({layerIds:e}={}){return e?this.layers.filter(t=>e.find(e=>t.id.indexOf(e)===0)):this.layers}setProps(e){`debug`in e&&(this._debug=e.debug),`userData`in e&&(this.context.userData=e.userData),`layers`in e&&(this._nextLayers=e.layers),`onError`in e&&(this.context.onError=e.onError)}setLayers(e,t){F(Bf,this,t,e),this._lastRenderedLayers=e;let n=Ff(e,Boolean);for(let e of n)e.context=this.context;this._updateLayers(this.layers,n)}updateLayers(){let e=this.needsUpdate();e&&(this.setNeedsRedraw(`updating layers: ${e}`),this.setLayers(this._nextLayers||this._lastRenderedLayers,e)),this._nextLayers=null}addDefaultShaderModule(e){let{defaultShaderModules:t}=this.context;t.find(t=>t.name===e.name)||(t.push(e),this._defaultShaderModulesChanged=!0)}removeDefaultShaderModule(e){let{defaultShaderModules:t}=this.context,n=t.findIndex(t=>t.name===e.name);n>=0&&(t.splice(n,1),this._defaultShaderModulesChanged=!0)}_handleError(e,t,n){n.raiseError(t,`${e} of ${n}`)}_updateLayers(e,t){let n={};for(let t of e)n[t.id]?P.warn(`Multiple old layers with same id ${t.id}`)():n[t.id]=t;if(this._defaultShaderModulesChanged){for(let t of e)t.setNeedsUpdate(),t.setChangeFlags({extensionsChanged:!0});this._defaultShaderModulesChanged=!1}let r=[];this._updateSublayersRecursively(t,n,r),this._finalizeOldLayers(n);let i=!1;for(let e of r)if(e.hasUniformTransition()){i=`Uniform transition in ${e}`;break}this._needsUpdate=i,this.layers=r}_updateSublayersRecursively(e,t,n){for(let r of e){r.context=this.context;let e=t[r.id];e===null&&P.warn(`Multiple new layers with same id ${r.id}`)(),t[r.id]=null;let i=null;try{this._debug&&e!==r&&r.validateProps(),e?(this._transferLayerState(e,r),this._updateLayer(r)):this._initializeLayer(r),n.push(r),i=r.isComposite?r.getSubLayers():null}catch(e){this._handleError(`matching`,e,r)}i&&this._updateSublayersRecursively(i,t,n)}}_finalizeOldLayers(e){for(let t in e){let n=e[t];n&&this._finalizeLayer(n)}}_initializeLayer(e){try{e._initialize(),e.lifecycle=Of.INITIALIZED}catch(t){this._handleError(`initialization`,t,e)}}_transferLayerState(e,t){t._transferState(e),t.lifecycle=Of.MATCHED,t!==e&&(e.lifecycle=Of.AWAITING_GC)}_updateLayer(e){try{e._update()}catch(t){this._handleError(`update`,t,e)}}_finalizeLayer(e){this._needsRedraw=this._needsRedraw||`finalized ${e}`,e.lifecycle=Of.AWAITING_FINALIZATION;try{e._finalize(),e.lifecycle=Of.FINALIZED}catch(t){this._handleError(`finalization`,t,e)}}};function K(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!K(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=Object.keys(e),i=Object.keys(t);if(r.length!==i.length)return!1;for(let i of r)if(!t.hasOwnProperty(i)||!K(e[i],t[i],n-1))return!1;return!0}return!1}var Uf=`default-canvas`,Wf=class{constructor(e){this.views=[],this.width=100,this.height=100,this.viewState={},this.controllers={},this.timeline=e.timeline,this._viewports=[],this._viewportMap={},this._isUpdating=!1,this._needsRedraw=`First render`,this._needsUpdate=`Initialize`,this._eventManager=e.eventManager,this._eventManagers=e.eventManagers||{},this._viewEventManagers={},this._eventCallbacks={onViewStateChange:e.onViewStateChange,onInteractionStateChange:e.onInteractionStateChange},this._pickPosition=e.pickPosition,this._getCanvasContext=e.getCanvasContext,Object.seal(this),this.setProps(e)}finalize(){for(let e in this.controllers){let t=this.controllers[e];t&&t.finalize()}this.controllers={}}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e,this._needsRedraw=this._needsRedraw||e}updateViewStates(){for(let e in this.controllers){let t=this.controllers[e];t&&t.updateTransition()}}getViewports(e){return e?this._viewports.filter(t=>{let n=!e.canvasId||this.getCanvasId(t.id)===e.canvasId,r=!(`x`in e)||t.containsPixel(e);return n&&r}):this._viewports}getViews(){let e={};return this.views.forEach(t=>{e[t.id]=t}),e}getView(e){return this.views.find(t=>t.id===e)}getViewState(e){let t=typeof e==`string`?this.getView(e):e,n=t&&this.viewState[t.getViewStateId()]||this.viewState;return t?t.filterViewState(n):n}getViewport(e){return this._viewportMap[e]}getCanvasId(e){let t=typeof e==`string`?this.getView(e):e;return t?this._viewEventManagers[t.id]?.canvasId||this._getCanvasIdFromView(t):void 0}unproject(e,t){let n=this.getViewports(),r={x:e[0],y:e[1]};for(let i=n.length-1;i>=0;--i){let a=n[i];if(a.containsPixel(r)){let n=e.slice();return n[0]-=a.x,n[1]-=a.y,a.unproject(n,t)}}return null}setProps(e){e.views&&this._setViews(e.views),e.viewState&&this._setViewState(e.viewState),(`width`in e||`height`in e)&&this._setSize(e.width,e.height),`pickPosition`in e&&(this._pickPosition=e.pickPosition),`eventManagers`in e&&this._setEventManagers(e.eventManagers||{}),this._isUpdating||this._update()}_update(){this._isUpdating=!0,this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._isUpdating=!1}_setSize(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.setNeedsUpdate(`Size changed`))}_setViews(e){e=Ff(e,Boolean),this._diffViews(e,this.views)&&this.setNeedsUpdate(`views changed`),this.views=e}_setViewState(e){e?(K(e,this.viewState,3)||this.setNeedsUpdate(`viewState changed`),this.viewState=e):P.warn("missing `viewState` or `initialViewState`")()}_setEventManagers(e){this._eventManagers!==e&&(this._eventManagers=e,this.setNeedsUpdate(`eventManagers changed`))}_getCanvasIdFromView(e){return e.props.canvasId||this._getCanvasContext?.(e.id)?.id||`default-canvas`}_getCanvasDimensions(e){let[t,n]=(this._getCanvasContext?.(e.id))?.getCSSSize()||[this.width,this.height];return{width:t,height:n}}_getViewEventManager(e){let t=this.getCanvasId(e)||`default-canvas`;return{canvasId:t,eventManager:this._eventManagers[t]||this._eventManager}}_startViewportRebuild(){let e=this.controllers,t=this._viewEventManagers;return this._viewports=[],this.controllers={},this._viewEventManagers={},{oldControllers:e,oldViewEventManagers:t}}_getReusableController(e,t,n){return e&&(t?.canvasId!==n.canvasId||t?.eventManager!==n.eventManager)?(e.finalize(),null):e}_createController(e,t){let n=t.type;return new n({timeline:this.timeline,eventManager:this._getViewEventManager(e).eventManager,onViewStateChange:this._eventCallbacks.onViewStateChange,onStateChange:this._eventCallbacks.onInteractionStateChange,makeViewport:t=>this.getView(e.id)?.makeViewport({viewState:t,...this._getCanvasDimensions(e)}),pickPosition:(t,n)=>this._pickPosition?.(t,n,e.id)})}_updateController(e,t,n,r){let i=e.controller;if(i&&n){let a={...t,...i,id:e.id,x:n.x,y:n.y,width:n.width,height:n.height};return(!r||r.constructor!==i.type)&&(r=this._createController(e,a)),r&&r.setProps(a),r}return null}_rebuildViewports(){let{views:e}=this,{oldControllers:t,oldViewEventManagers:n}=this._startViewportRebuild(),r=!1;for(let i=e.length;i--;){let a=e[i],{width:o,height:s}=this._getCanvasDimensions(a),c=this._getViewEventManager(a);this._viewEventManagers[a.id]=c;let l=this.getViewState(a),u=a.makeViewport({viewState:l,width:o,height:s}),d=this._getReusableController(t[a.id],n[a.id],c),f=!!a.controller;f&&!d&&(r=!0),(r||!f)&&d&&(d.finalize(),d=null),this.controllers[a.id]=this._updateController(a,l,u,d),u&&this._viewports.unshift(u)}for(let e in t){let n=t[e];n&&!this.controllers[e]&&n.finalize()}this._buildViewportMap()}_buildViewportMap(){this._viewportMap={},this._viewports.forEach(e=>{e.id&&(this._viewportMap[e.id]=this._viewportMap[e.id]||e)})}_diffViews(e,t){return e.length===t.length?e.some((n,r)=>!e[r].equals(t[r])):!0}},Gf=/^(?:\d+\.?\d*|\.\d+)$/;function q(e){switch(typeof e){case`number`:if(!Number.isFinite(e))throw Error(`Could not parse position string ${e}`);return{type:`literal`,value:e};case`string`:try{return new Jf(qf(e)).parseExpression()}catch(t){let n=t instanceof Error?t.message:String(t);throw Error(`Could not parse position string ${e}: ${n}`)}default:throw Error(`Could not parse position string ${e}`)}}function Kf(e,t){switch(e.type){case`literal`:return e.value;case`percentage`:return Math.round(e.value*t);case`binary`:let n=Kf(e.left,t),r=Kf(e.right,t);return e.operator===`+`?n+r:n-r;default:throw Error(`Unknown layout expression type`)}}function J(e,t){return Kf(e,t)}function qf(e){let t=[],n=0;for(;n<e.length;){let r=e[n];if(/\s/.test(r)){n++;continue}if(r===`+`||r===`-`||r===`(`||r===`)`||r===`%`){t.push({type:`symbol`,value:r}),n++;continue}if(Yf(r)||r===`.`){let i=n,a=r===`.`;for(n++;n<e.length;){let t=e[n];if(Yf(t)){n++;continue}if(t===`.`&&!a){a=!0,n++;continue}break}let o=e.slice(i,n);if(!Gf.test(o))throw Error(`Invalid number token`);t.push({type:`number`,value:parseFloat(o)});continue}if(Xf(r)){let r=n;for(;n<e.length&&Xf(e[n]);)n++;let i=e.slice(r,n).toLowerCase();t.push({type:`word`,value:i});continue}throw Error(`Invalid token in position string`)}return t}var Jf=class{constructor(e){this.index=0,this.tokens=e}parseExpression(){let e=this.parseBinaryExpression();if(this.index<this.tokens.length)throw Error(`Unexpected token at end of expression`);return e}parseBinaryExpression(){let e=this.parseFactor(),t=this.peek();for(;Zf(t);){this.index++;let n=this.parseFactor();e={type:`binary`,operator:t.value,left:e,right:n},t=this.peek()}return e}parseFactor(){let e=this.peek();if(!e)throw Error(`Unexpected end of expression`);if(e.type===`symbol`&&e.value===`+`)return this.index++,this.parseFactor();if(e.type===`symbol`&&e.value===`-`)return this.index++,{type:`binary`,operator:`-`,left:{type:`literal`,value:0},right:this.parseFactor()};if(e.type===`symbol`&&e.value===`(`){this.index++;let e=this.parseBinaryExpression();if(!this.consumeSymbol(`)`))throw Error(`Missing closing parenthesis`);return e}if(e.type===`word`&&e.value===`calc`){if(this.index++,!this.consumeSymbol(`(`))throw Error(`Missing opening parenthesis after calc`);let e=this.parseBinaryExpression();if(!this.consumeSymbol(`)`))throw Error(`Missing closing parenthesis`);return e}if(e.type===`number`){this.index++;let t=e.value,n=this.peek();return n&&n.type===`symbol`&&n.value===`%`?(this.index++,{type:`percentage`,value:t/100}):(n&&n.type===`word`&&n.value===`px`&&this.index++,{type:`literal`,value:t})}throw Error(`Unexpected token in expression`)}consumeSymbol(e){let t=this.peek();return t&&t.type===`symbol`&&t.value===e?(this.index++,!0):!1}peek(){return this.tokens[this.index]||null}};function Yf(e){return e>=`0`&&e<=`9`}function Xf(e){return e>=`a`&&e<=`z`||e>=`A`&&e<=`Z`}function Zf(e){return!!(e&&e.type===`symbol`&&(e.value===`+`||e.value===`-`))}function Qf(e,t){let n={...e};for(let e in t)e!==`id`&&(Array.isArray(n[e])&&Array.isArray(t[e])?n[e]=$f(n[e],t[e]):n[e]=t[e]);return n}function $f(e,t){e=e.slice();for(let n=0;n<t.length;n++){let r=t[n];Number.isFinite(r)&&(e[n]=r)}return e}var ep=class{constructor(e){let{id:t,x:n=0,y:r=0,width:i=`100%`,height:a=`100%`,padding:o=null}=e;this.id=t||this.constructor.displayName||`view`,this.props={...e,id:this.id},this._x=q(n),this._y=q(r),this._width=q(i),this._height=q(a),this._padding=o&&{left:q(o.left||0),right:q(o.right||0),top:q(o.top||0),bottom:q(o.bottom||0)},this.equals=this.equals.bind(this),Object.seal(this)}equals(e){return this===e?!0:this.constructor===e.constructor&&K(this.props,e.props,2)}clone(e){let t=this.constructor;return new t({...this.props,...e})}makeViewport({width:e,height:t,viewState:n}){n=this.filterViewState(n);let r=this.getDimensions({width:e,height:t});return!r.height||!r.width?null:new(this.getViewportType(n))({...n,...this.props,...r})}getViewStateId(){let{viewState:e}=this.props;return typeof e==`string`?e:e?.id||this.id}filterViewState(e){return this.props.viewState&&typeof this.props.viewState==`object`?this.props.viewState.id?Qf(e,this.props.viewState):this.props.viewState:e}getDimensions({width:e,height:t}){let n={x:J(this._x,e),y:J(this._y,t),width:J(this._width,e),height:J(this._height,t)};return this._padding&&(n.padding={left:J(this._padding.left,e),top:J(this._padding.top,t),right:J(this._padding.right,e),bottom:J(this._padding.bottom,t)}),n}get controller(){let e=this.props.controller;return e?e===!0?{type:this.ControllerType}:typeof e==`function`?{type:e}:{type:this.ControllerType,...e}:null}},tp=class{constructor(e){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=e}get inProgress(){return this._inProgress}start(e){this.cancel(),this.settings=e,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&=(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,!1)}update(){if(!this._inProgress)return!1;if(this._handle===null){let{_timeline:e,settings:t}=this;this._handle=e.addChannel({delay:e.getTime(),duration:t.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}},np=()=>{},rp={mode:`preserve`},ip={mode:`hard`},ap={BREAK:1,SNAP_TO_END:2,IGNORE:3},op=e=>e,sp=ap.BREAK,cp=class{constructor(e){this._onTransitionUpdate=e=>{let{time:t,settings:{interpolator:n,startProps:r,endProps:i,duration:a,easing:o}}=e,s=o(t/a),c=n.interpolateProps(r,i,s);this.propsInTransition=this.getControllerState({...this.props,...c},rp).getViewportProps(),this.onViewStateChange({viewState:this.propsInTransition,oldViewState:this.props})},this.getControllerState=e.getControllerState,this.propsInTransition=null,this.transition=new tp(e.timeline),this.onViewStateChange=e.onViewStateChange||np,this.onStateChange=e.onStateChange||np}finalize(){this.transition.cancel()}getViewportInTransition(){return this.propsInTransition}processViewStateChange(e){let t=!1,n=this.props;if(this.props=e,!n||this._shouldIgnoreViewportChange(n,e))return!1;if(this._isTransitionEnabled(e)){let r=n;if(this.transition.inProgress){let{interruption:e,endProps:t}=this.transition.settings;r={...n,...e===ap.SNAP_TO_END?t:this.propsInTransition||n}}this._triggerTransition(r,e),t=!0}else this.transition.cancel();return t}updateTransition(){this.transition.update()}_isTransitionEnabled(e){let{transitionDuration:t,transitionInterpolator:n}=e;return(t>0||t===`auto`)&&!!n}_isUpdateDueToCurrentTransition(e){return this.transition.inProgress&&this.propsInTransition?this.transition.settings.interpolator.arePropsEqual(e,this.propsInTransition):!1}_shouldIgnoreViewportChange(e,t){return this.transition.inProgress?this.transition.settings.interruption===ap.IGNORE||this._isUpdateDueToCurrentTransition(t):this._isTransitionEnabled(t)?t.transitionInterpolator.arePropsEqual(e,t):!0}_triggerTransition(e,t){let n=this.getControllerState(e,rp),r=this.getControllerState(t,ip).shortestPathFrom(n),i=t.transitionInterpolator,a=i.getDuration?i.getDuration(e,t):t.transitionDuration;if(a===0)return;let o=i.initializeProps(e,r);this.propsInTransition={};let s={duration:a,easing:t.transitionEasing||op,interpolator:i,interruption:t.transitionInterruption||sp,startProps:o.start,endProps:o.end,onStart:t.onTransitionStart,onUpdate:this._onTransitionUpdate,onInterrupt:this._onTransitionEnd(t.onTransitionInterrupt),onEnd:this._onTransitionEnd(t.onTransitionEnd)};this.transition.start(s),this.onStateChange({inTransition:!0}),this.updateTransition()}_onTransitionEnd(e){return t=>{this.propsInTransition=null,this.onStateChange({inTransition:!1,isZooming:!1,isPanning:!1,isRotating:!1}),e?.(t)}}};function Y(e,t){if(!e)throw Error(t||`deck.gl: assertion failed.`)}var lp=class{constructor(e){let{compare:t,extract:n,required:r}=e;this._propsToCompare=t,this._propsToExtract=n||t,this._requiredProps=r}arePropsEqual(e,t){for(let n of this._propsToCompare)if(!(n in e)||!(n in t)||!k(e[n],t[n]))return!1;return!0}initializeProps(e,t){let n={},r={};for(let i of this._propsToExtract)(i in e||i in t)&&(n[i]=e[i],r[i]=t[i]);return this._checkRequiredProps(n),this._checkRequiredProps(r),{start:n,end:r}}getDuration(e,t){return t.transitionDuration}_checkRequiredProps(e){this._requiredProps&&this._requiredProps.forEach(t=>{let n=e[t];Y(Number.isFinite(n)||Array.isArray(n),`${t} is required for transition`)})}},up=[`longitude`,`latitude`,`zoom`,`bearing`,`pitch`],dp=[`longitude`,`latitude`,`zoom`],fp=class extends lp{constructor(e={}){let t=Array.isArray(e)?e:e.transitionProps,n=Array.isArray(e)?{}:e;n.transitionProps=Array.isArray(t)?{compare:t,required:t}:t||{compare:up,required:dp},super(n.transitionProps),this.opts=n}initializeProps(e,t){let n=super.initializeProps(e,t),{makeViewport:r,around:i}=this.opts;if(r&&i){let a=r(e),o=r(t),s=a.unproject(i);n.start.around=i,Object.assign(n.end,{around:o.project(s),aroundPosition:s,width:t.width,height:t.height})}return n}interpolateProps(e,t,n){let r={};for(let i of this._propsToExtract)r[i]=A(e[i]||0,t[i]||0,n);if(t.aroundPosition&&this.opts.makeViewport){let i=this.opts.makeViewport({...t,...r});Object.assign(r,i.panByPosition(t.aroundPosition,A(e.around,t.around,n)))}return r}},pp={transitionDuration:0},mp=300,hp=300,gp=e=>1-(1-e)*(1-e),_p=e=>e===1?1:1-2**(-10*e),vp={WHEEL:[`wheel`],PAN:[`panstart`,`panmove`,`panend`],PINCH:[`pinchstart`,`pinchmove`,`pinchend`],MULTI_PAN:[`multipanstart`,`multipanmove`,`multipanend`],DOUBLE_CLICK:[`dblclick`],DOUBLE_CLICK_DRAG:[`dblclickdragstart`,`dblclickdragmove`,`dblclickdragend`,`dblclickdragcancel`],KEYBOARD:[`keydown`]},yp={},bp=class{constructor(e){this.state={},this._events={},this._interactionState={isDragging:!1},this._customEvents=[],this._eventStartBlocked=null,this._panMove=!1,this._multiPanMode=null,this._multiPanStartCenter=null,this._doubleClickDragAnchor=null,this._suppressDoubleClickUntil=0,this.invertPan=!1,this.dragMode=`rotate`,this.inertia=0,this.scrollZoom=!0,this.dragPan=!0,this.dragRotate=!0,this.doubleClickZoom=!0,this.doubleClickDragZoom=!0,this.touchZoom=!0,this.touchRotate=!1,this.multiTouchDrag=null,this.trackpadGesture=!1,this.zoomAround=`pointer`,this.keyboard=!0,this.transitionManager=new cp({...e,getControllerState:(t,n)=>new this.ControllerState({...t,constraintContext:n,makeViewport:e.makeViewport}),onViewStateChange:this._onTransition.bind(this),onStateChange:this._setInteractionState.bind(this)}),this.handleEvent=this.handleEvent.bind(this),this.eventManager=e.eventManager,this.onViewStateChange=e.onViewStateChange||(()=>{}),this.onStateChange=e.onStateChange||(()=>{}),this.makeViewport=e.makeViewport,this.pickPosition=e.pickPosition}set events(e){this.toggleEvents(this._customEvents,!1),this.toggleEvents(e,!0),this._customEvents=e,this.props&&this.setProps(this.props)}finalize(){for(let e in this._events)this._events[e]&&this.eventManager?.off(e,this.handleEvent);this.transitionManager.finalize()}handleEvent(e){this._controllerState=void 0;let t=this._eventStartBlocked;switch(e.type){case`panstart`:return t?!1:this._onPanStart(e);case`panmove`:return this._onPan(e);case`panend`:return this._onPanEnd(e);case`pinchstart`:return t||!this._isTrackpadGestureAllowed(e)?!1:this._onPinchStart(e);case`pinchmove`:return this._isTrackpadGestureAllowed(e)?this._onPinch(e):!1;case`pinchend`:return this._isTrackpadGestureAllowed(e)?this._onPinchEnd(e):!1;case`multipanstart`:return t?!1:this._onMultiPanStart(e);case`multipanmove`:return this._onMultiPan(e);case`multipanend`:return this._onMultiPanEnd(e);case`dblclick`:return this._onDoubleClick(e);case`dblclickdragstart`:return t?!1:this._onDoubleClickDragStart(e);case`dblclickdragmove`:return this._onDoubleClickDrag(e);case`dblclickdragend`:case`dblclickdragcancel`:return this._onDoubleClickDragEnd(e);case`wheel`:return this._onWheel(e);case`keydown`:return this._onKeyDown(e);default:return!1}}get controllerState(){return this._controllerState=this._controllerState||new this.ControllerState({makeViewport:this.makeViewport,...this.props,...this.state}),this._controllerState}getCenter(e){let{x:t,y:n}=this.props,{offsetCenter:r}=e;return[r.x-t,r.y-n]}getZoomPosition(e){if(this.zoomAround===`pointer`)return e;let t=this.makeViewport(this.controllerState.getViewportProps()),[n,r]=kl(t.center,t.pixelProjectionMatrix);return[n,r]}isPointInBounds(e,t){let{width:n,height:r}=this.props;if(t&&t.handled)return!1;let i=e[0]>=0&&e[0]<=n&&e[1]>=0&&e[1]<=r;return i&&t&&t.stopPropagation(),i}isFunctionKeyPressed(e){let{srcEvent:t}=e;return!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}isDragging(){return this._interactionState.isDragging||!1}blockEvents(e){let t=setTimeout(()=>{this._eventStartBlocked===t&&(this._eventStartBlocked=null)},e);this._eventStartBlocked=t}setProps(e){e.maxBoundsPadding===void 0&&(e.maxBoundsPadding=null),e.dragMode&&(this.dragMode=e.dragMode);let t=this.props;this.props=e,`transitionInterpolator`in e||(e.transitionInterpolator=this._getTransitionProps().transitionInterpolator),this.transitionManager.processViewStateChange(e);let{inertia:n}=e;this.inertia=Number.isFinite(n)?n:n===!0?mp:0;let{scrollZoom:r=!0,dragPan:i=!0,dragRotate:a=!0,doubleClickZoom:o=!0,doubleClickDragZoom:s=!1,touchZoom:c=!0,touchRotate:l=!1,multiTouchDrag:u=l?`rotate`:null,trackpadGesture:d=!1,zoomAround:f=`pointer`,keyboard:p=!0}=e,m=!!this.onViewStateChange;if(this.toggleEvents(vp.WHEEL,m&&r),this.toggleEvents(vp.PAN,m),this.toggleEvents(vp.PINCH,m&&(c||u===`rotate`)),this.toggleEvents(vp.MULTI_PAN,m&&!!u),this.toggleEvents(vp.DOUBLE_CLICK,m&&o),this.toggleEvents(vp.DOUBLE_CLICK_DRAG,m&&s),this.toggleEvents(vp.KEYBOARD,m&&p),this.scrollZoom=r,this.dragPan=i,this.dragRotate=a,this.doubleClickZoom=o,this.doubleClickDragZoom=s,this.touchZoom=c,this.touchRotate=u===`rotate`,this.multiTouchDrag=u,this.trackpadGesture=d,this.zoomAround=f,this.keyboard=p,(!t||t.height!==e.height||t.width!==e.width||t.maxBounds!==e.maxBounds||t.maxBoundsPadding!==e.maxBoundsPadding)&&e.maxBounds){let t=new this.ControllerState({...e,makeViewport:this.makeViewport}),n=t.getViewportProps();Object.keys(n).some(t=>!K(n[t],e[t],1))&&this.updateViewport(t)}}updateTransition(){this.transitionManager.updateTransition()}toggleEvents(e,t){this.eventManager&&e.forEach(e=>{this._events[e]!==t&&(this._events[e]=t,t?this.eventManager.on(e,this.handleEvent):this.eventManager.off(e,this.handleEvent))})}updateViewport(e,t=null,n={}){let r={...e.getViewportProps(),...t},i=this.controllerState!==e;if(this.state=e.getState(),this._setInteractionState(n),i){let e=this.controllerState&&this.controllerState.getViewportProps();this.onViewStateChange&&this.onViewStateChange({viewState:r,interactionState:this._interactionState,oldViewState:e,viewId:this.props.id})}}_onTransition(e){this.onViewStateChange({...e,interactionState:this._interactionState,viewId:this.props.id})}_setInteractionState(e){Object.assign(this._interactionState,e),this.onStateChange(this._interactionState)}_getConstraintContext(e,t){return this.props.rubberBand?{mode:t===`update`?`elastic`:t===`end`?`rebound`:`hard`}:{mode:`hard`}}_getReboundTransition(e,t){if(e.mode!==`rebound`)return null;let n=t.getViewportProps();return Object.keys(n).some(e=>!K(this.props[e],n[e],1))?{...this._getTransitionProps(),transitionDuration:hp,transitionEasing:_p}:null}_onPanStart(e){let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e)||e.rightButton||!1;(this.invertPan||this.dragMode===`pan`)&&(n=!n);let r=n?`pan`:`rotate`,i=this._getConstraintContext(r,`start`),a=n?this.controllerState.panStart({pos:t},i):this.controllerState.rotateStart({pos:t},i);return this._panMove=n,this.updateViewport(a,pp,{isDragging:!0}),!0}_onPan(e){return this.isDragging()?this._panMove?this._onPanMove(e):this._onPanRotate(e):!1}_onPanEnd(e){return this.isDragging()?this._panMove?this._onPanMoveEnd(e):this._onPanRotateEnd(e):!1}_onPanMove(e){if(!this.dragPan)return!1;let t=this.getCenter(e),n=this.controllerState.pan({pos:t},this._getConstraintContext(`pan`,`update`));return this.updateViewport(n,pp,{isDragging:!0,isPanning:!0}),!0}_onPanMoveEnd(e){let{inertia:t}=this;if(this.dragPan&&t&&e.velocity){let n=this.getCenter(e),r=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],i=this.controllerState.pan({pos:r}).panEnd();this.updateViewport(i,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:gp},{isDragging:!1,isPanning:!0})}else{let e=this.controllerState,t=this._getConstraintContext(`pan`,`end`),n=e.panEnd(t),r=this._getReboundTransition(t,n);this.updateViewport(n,r,{isDragging:!1,isPanning:!!r})}return!0}_onPanRotate(e){if(!this.dragRotate)return!1;let t=this.getCenter(e),n=this.controllerState.rotate({pos:t},this._getConstraintContext(`rotate`,`update`));return this.updateViewport(n,pp,{isDragging:!0,isRotating:!0}),!0}_onPanRotateEnd(e){let{inertia:t}=this;if(this.dragRotate&&t&&e.velocity){let n=this.getCenter(e),r=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],i=this.controllerState.rotate({pos:r}).rotateEnd();this.updateViewport(i,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:gp},{isDragging:!1,isRotating:!0})}else{let e=this.controllerState,t=this._getConstraintContext(`rotate`,`end`),n=e.rotateEnd(t),r=this._getReboundTransition(t,n);this.updateViewport(n,r,{isDragging:!1,isRotating:!!r})}return!0}_onWheel(e){if(!this.scrollZoom||this.trackpadGesture&&e.device!==`mouse`)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;e.srcEvent.preventDefault();let{speed:n=.01,smooth:r=!1}=this.scrollZoom===!0?{}:this.scrollZoom,{delta:i}=e,a=2/(1+Math.exp(-Math.abs(i*n)));i<0&&a!==0&&(a=1/a);let o=this.getZoomPosition(t),s=r?{...this._getTransitionProps({around:o}),transitionDuration:250}:pp,c=this.controllerState.zoom({pos:o,scale:a});return this.updateViewport(c,s,{isZooming:!0,isPanning:!0}),r||this._setInteractionState({isZooming:!1,isPanning:!1}),!0}_onMultiPanStart(e){let{multiTouchDrag:t}=this;if(!t||!this._isMultiPanEventAllowed(e,t))return!1;let n=e.offsetCenter;if(!this.isPointInBounds(this.getCenter(e),e))return!1;let r=e.pointerType===`trackpad`,i={x:n.x-(r?0:e.deltaX),y:n.y-(r?0:e.deltaY)},a={...e,offsetCenter:i},o=this.getCenter(a),s=t===`pan`?this.controllerState.panStart({pos:o},this._getConstraintContext(`pan`,`start`)):this.controllerState.rotateStart({pos:o},this._getConstraintContext(`rotate`,`start`));return this._multiPanMode=t,this._multiPanStartCenter=i,this.updateViewport(s,pp,{isDragging:!0}),!0}_onMultiPan(e){let{mode:t,event:n}=this._getMultiPanEvent(e);return!t||!n||!this.isDragging()?!1:t===`pan`?this._onPanMove(n):this._onPanRotate(n)}_onMultiPanEnd(e){let{mode:t,event:n}=this._getMultiPanEvent(e);if(!t||!n||!this.isDragging())return this._resetMultiPan(),!1;let r=t===`pan`?this._onPanMoveEnd(n):this._onPanRotateEnd(n);return this._resetMultiPan(),r}_isTrackpadGestureAllowed(e){return e.pointerType!==`trackpad`||this.trackpadGesture}_isMultiPanEventAllowed(e,t){return e.pointerType===`trackpad`?this.trackpadGesture&&(t===`pan`?this.dragPan:this.dragRotate):e.pointerType===`touch`&&(t===`pan`?this.dragPan:this.dragRotate)}_getMultiPanEvent(e){let t=this._multiPanMode,n=this._multiPanStartCenter;return!t||!n?{mode:null,event:null}:{mode:t,event:{...e,offsetCenter:{x:n.x+e.deltaX,y:n.y+e.deltaY}}}}_resetMultiPan(){this._multiPanMode=null,this._multiPanStartCenter=null}_onPinchStart(e){this._doubleClickDragAnchor=null;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.controllerState.zoomStart({pos:this.getZoomPosition(t)},this._getConstraintContext(`zoom`,`start`)).rotateStart({pos:t},this._getConstraintContext(`rotate`,`start`));return yp._startPinchRotation=e.rotation,yp._lastPinchEvent=e,this.updateViewport(n,pp,{isDragging:!0}),!0}_onPinch(e){if(!this.touchZoom&&!this.touchRotate||!this.isDragging())return!1;let t=this.controllerState;if(this.touchZoom){let{scale:n}=e,r=this.getCenter(e);t=t.zoom({pos:this.getZoomPosition(r),scale:n},this._getConstraintContext(`zoom`,`update`))}if(this.touchRotate){let{rotation:n}=e;t=t.rotate({deltaAngleX:yp._startPinchRotation-n},this._getConstraintContext(`rotate`,`update`))}return this.updateViewport(t,pp,{isDragging:!0,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:this.touchRotate}),yp._lastPinchEvent=e,!0}_onPinchEnd(e){if(!this.isDragging())return!1;let{inertia:t}=this,{_lastPinchEvent:n}=yp;if(this.touchZoom&&t&&n&&e.scale!==n.scale){let r=this.getCenter(e),i=this.getZoomPosition(r),a=this.controllerState.rotateEnd(),o=Math.log2(e.scale),s=2**(o+(o-Math.log2(n.scale))/(e.deltaTime-n.deltaTime)*t/2);a=a.zoom({pos:i,scale:s}).zoomEnd(),this.updateViewport(a,{...this._getTransitionProps({around:i}),transitionDuration:t,transitionEasing:gp},{isDragging:!1,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:!1}),this.blockEvents(t)}else{let e=this.controllerState,t=this._getConstraintContext(`zoom`,`end`),n=this._getConstraintContext(`rotate`,`end`),r=e.zoomEnd(t).rotateEnd(n),i=this._getReboundTransition(this.touchZoom?t:n,r);this.updateViewport(r,i,{isDragging:!1,isPanning:!!i&&this.touchZoom,isZooming:!!i&&this.touchZoom,isRotating:!!i&&this.touchRotate})}return yp._startPinchRotation=null,yp._lastPinchEvent=null,!0}_onDoubleClick(e){if(!this.doubleClickZoom||Date.now()<this._suppressDoubleClickUntil)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e),r=this.getZoomPosition(t),i=this.controllerState.zoom({pos:r,scale:n?.5:2});return this.updateViewport(i,this._getTransitionProps({around:r}),{isZooming:!0,isPanning:!0}),this.blockEvents(100),!0}_onDoubleClickDragStart(e){if(!this.doubleClickDragZoom)return this._doubleClickDragAnchor=null,!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return this._doubleClickDragAnchor=null,!1;this._doubleClickDragAnchor=this.getZoomPosition(t);let n=this.controllerState.zoomStart({pos:this._doubleClickDragAnchor},this._getConstraintContext(`zoom`,`start`));return e.scale!==1&&(n=n.zoom({pos:this._doubleClickDragAnchor,scale:e.scale},this._getConstraintContext(`zoom`,`update`))),this.updateViewport(n,pp,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDrag(e){let t=this._doubleClickDragAnchor;if(!t)return!1;let n=this.controllerState.zoom({pos:t,scale:e.scale},this._getConstraintContext(`zoom`,`update`));return this.updateViewport(n,pp,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDragEnd(e){if(!this._doubleClickDragAnchor)return!1;this._doubleClickDragAnchor=null;let t=this.controllerState,n=this._getConstraintContext(`zoom`,`end`),r=t.zoomEnd(n),i=this._getReboundTransition(n,r);return this.updateViewport(r,i,{isDragging:!1,isPanning:!!i,isZooming:!!i}),this._suppressDoubleClickUntil=Date.now()+100,this.blockEvents(100),!0}_onKeyDown(e){if(!this.keyboard)return!1;let t=this.isFunctionKeyPressed(e),{zoomSpeed:n,moveSpeed:r,rotateSpeedX:i,rotateSpeedY:a}=this.keyboard===!0?{}:this.keyboard,{controllerState:o}=this,s,c={};switch(e.srcEvent.code){case`Minus`:s=t?o.zoomOut(n).zoomOut(n):o.zoomOut(n),c.isZooming=!0;break;case`Equal`:s=t?o.zoomIn(n).zoomIn(n):o.zoomIn(n),c.isZooming=!0;break;case`ArrowLeft`:t?(s=o.rotateLeft(i),c.isRotating=!0):(s=o.moveLeft(r),c.isPanning=!0);break;case`ArrowRight`:t?(s=o.rotateRight(i),c.isRotating=!0):(s=o.moveRight(r),c.isPanning=!0);break;case`ArrowUp`:t?(s=o.rotateUp(a),c.isRotating=!0):(s=o.moveUp(r),c.isPanning=!0);break;case`ArrowDown`:t?(s=o.rotateDown(a),c.isRotating=!0):(s=o.moveDown(r),c.isPanning=!0);break;default:return!1}return this.updateViewport(s,this._getTransitionProps(),c),!0}_getTransitionProps(e){let{transition:t}=this;return!t||!t.transitionInterpolator?pp:e?{...t,transitionInterpolator:new fp({...e,...t.transitionInterpolator.opts,makeViewport:this.controllerState.makeViewport})}:t}},xp=Symbol(`constraintAround`),Sp=class{constructor(e,t,n,r){this.makeViewport=n,this._viewportProps=this.applyConstraints(e,r),this._state=t}getViewportProps(){return this._viewportProps}getState(){return this._state}};function Cp(e,t,n){let r=e-t;return r&&Number.isFinite(r)?t+r*n/(n+Math.abs(r)):t}function wp(e,t,n){let r=J(q(n?.left??0),e),i=J(q(n?.right??0),e),a=J(q(n?.top??0),t),o=J(q(n?.bottom??0),t);return{x:r,y:a,width:e-r-i,height:t-a-o}}function Tp(e,t,n){let[r,i]=e.project(t);return r=Number.isFinite(r)?r:e.width/2,i=Number.isFinite(i)?i:e.height/2,{left:r-n.x,right:n.x+n.width-r,top:i-n.y,bottom:n.y+n.height-i}}var Ep=5,Dp=1.2,Op=512,kp=[[-1/0,-90],[1/0,90]],Ap=1;function jp([e,t]){if(Math.abs(t)>90&&(t=Math.sign(t)*90),Number.isFinite(e)){let[n,r]=yl([e,t]);return[n,M(r,0,Op)]}let[,n]=yl([0,t]);return[e,M(n,0,Op)]}var Mp=class extends Sp{constructor(e){let{width:t,height:n,latitude:r,longitude:i,zoom:a,bearing:o=0,pitch:s=0,altitude:c=1.5,position:l=[0,0,0],maxZoom:u=20,minZoom:d=0,maxPitch:f=60,minPitch:p=0,startPanLngLat:m,startZoomLngLat:h,startRotatePos:g,startRotateLngLat:_,startBearing:v,startPitch:y,startZoom:b,normalize:x=!0,rubberBand:S=!1}=e,{[xp]:C}=e;Y(Number.isFinite(i)),Y(Number.isFinite(r)),Y(Number.isFinite(a));let w=e.maxBounds||(x?kp:null),T=e.maxBoundsPadding||null;super({width:t,height:n,latitude:r,longitude:i,zoom:a,bearing:o,pitch:s,altitude:c,maxZoom:u,minZoom:d,maxPitch:f,minPitch:p,normalize:x,position:l,maxBounds:w,maxBoundsPadding:T,rubberBand:S,[xp]:C},{startPanLngLat:m,startZoomLngLat:h,startRotatePos:g,startRotateLngLat:_,startBearing:v,startPitch:y,startZoom:b},e.makeViewport,e.constraintContext),this.getAltitude=e.getAltitude}panStart({pos:e},t){return this._getUpdatedState({startPanLngLat:this._unproject(e)},t)}pan({pos:e,startPos:t},n){let r=this.getState().startPanLngLat||this._unproject(t);if(!r)return this;let i=this.makeViewport(this.getViewportProps()).panByPosition(r,e);return this._getUpdatedState(i,n)}panEnd(e){return this._getUpdatedState({startPanLngLat:null},e)}rotateStart({pos:e}){let t=this.getAltitude?.(e);return this._getUpdatedState({startRotatePos:e,startRotateLngLat:t===void 0?void 0:this._unproject3D(e,t),startBearing:this.getViewportProps().bearing,startPitch:this.getViewportProps().pitch})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:n=0}){let{startRotatePos:r,startRotateLngLat:i,startBearing:a,startPitch:o}=this.getState();if(!r||a===void 0||o===void 0)return this;let s;if(s=e?this._getNewRotation(e,r,o,a):{bearing:a+t,pitch:o+n},i){let e=this.makeViewport({...this.getViewportProps(),...s}),t=`panByPosition3D`in e?`panByPosition3D`:`panByPosition`;return this._getUpdatedState({...s,...e[t](i,r)})}return this._getUpdatedState(s)}rotateEnd(){return this._getUpdatedState({startRotatePos:null,startRotateLngLat:null,startBearing:null,startPitch:null})}zoomStart({pos:e},t){return this._getUpdatedState({startZoomLngLat:this._unproject(e),startZoom:this.getViewportProps().zoom},t)}zoom({pos:e,startPos:t,scale:n},r){let{startZoom:i,startZoomLngLat:a}=this.getState();return a||=(i=this.getViewportProps().zoom,this._unproject(t)||this._unproject(e)),a?this._getUpdatedState({zoom:i+Math.log2(n),[xp]:{position:a,screenPosition:e}},r):this}zoomEnd(e){return this._getUpdatedState({startZoomLngLat:null,startZoom:null},e)}zoomIn(e=2,t){return this._zoomFromCenter(e,t)}zoomOut(e=2,t){return this._zoomFromCenter(1/e,t)}moveLeft(e=100,t){return this._panFromCenter([e,0],t)}moveRight(e=100,t){return this._panFromCenter([-e,0],t)}moveUp(e=100,t){return this._panFromCenter([0,e],t)}moveDown(e=100,t){return this._panFromCenter([0,-e],t)}rotateLeft(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing-e})}rotateRight(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing+e})}rotateUp(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch+e})}rotateDown(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch-e})}shortestPathFrom(e){let t=e.getViewportProps(),n={...this.getViewportProps()},{bearing:r,longitude:i}=n;return Math.abs(r-t.bearing)>180&&(n.bearing=r<0?r+360:r-360),Math.abs(i-t.longitude)>180&&(n.longitude=i<0?i+360:i-360),n}applyConstraints(e,t){let n=e,r=n[xp];delete n[xp];let{maxPitch:i,minPitch:a,pitch:o,bearing:s,normalize:c,maxBounds:l,rubberBand:u}=e;c&&(s<-180||s>180)&&(e.bearing=ju(s+180,360)-180),e.pitch=M(o,a,i);let d=this._constrainZoom(e.zoom,e),f=u&&t?.mode===`elastic`;if(e.zoom=t?.mode===`preserve`?e.zoom:f?Cp(e.zoom,d,Ap):d,r){let t=this.makeViewport(e);Object.assign(e,t.panByPosition(r.position,r.screenPosition))}if(c&&(e.longitude<-180||e.longitude>180)&&(e.longitude=ju(e.longitude+180,360)-180),l){let n=wp(e.width,e.height,e.maxBoundsPadding),r=Tp(this.makeViewport({...e,bearing:0,pitch:0}),[e.longitude,e.latitude],n),i=jp(l[0]),a=jp(l[1]),o=2**e.zoom,s=[i[0]+r.left/o,i[1]+r.bottom/o],c=[a[0]-r.right/o,a[1]-r.top/o],u=jp([e.longitude,e.latitude]),d=[M(u[0],s[0],c[0]),M(u[1],s[1],c[1])],p=u.slice();if(n.width>=0&&(p[0]=t?.mode===`preserve`?u[0]:f?Cp(u[0],d[0],n.width/2/o):d[0]),n.height>=0&&(p[1]=t?.mode===`preserve`?u[1]:f?Cp(u[1],d[1],n.height/2/o):d[1]),p[0]!==u[0]||p[1]!==u[1]){let[t,n]=bl(p);p[0]!==u[0]&&(e.longitude=t),p[1]!==u[1]&&(e.latitude=n)}}return e}_constrainZoom(e,t){t||=this.getViewportProps();let{maxZoom:n,maxBounds:r}=t,i=r!==null&&t.width>0&&t.height>0,{minZoom:a}=t;if(i){let e=wp(t.width,t.height,t.maxBoundsPadding),i=jp(r[0]),o=jp(r[1]),s=o[0]-i[0],c=o[1]-i[1];e.width>0&&Number.isFinite(s)&&s>0&&(a=Math.max(a,Math.log2(e.width/s))),e.height>0&&Number.isFinite(c)&&c>0&&(a=Math.max(a,Math.log2(e.height/c))),a>n&&(a=n)}return M(e,a,n)}_zoomFromCenter(e,t){let{width:n,height:r}=this.getViewportProps();return this.zoom({pos:[n/2,r/2],scale:e},t)}_panFromCenter(e,t){let{width:n,height:r}=this.getViewportProps();return this.pan({startPos:[n/2,r/2],pos:[n/2+e[0],r/2+e[1]]},t)}_getUpdatedState(e,t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e,constraintContext:t})}_unproject(e){let t=this.makeViewport(this.getViewportProps());return e&&t.unproject(e)}_unproject3D(e,t){return this.makeViewport(this.getViewportProps()).unproject(e,{targetZ:t})}_getNewRotation(e,t,n,r){let i=e[0]-t[0],a=e[1]-t[1],o=e[1],s=t[1],{width:c,height:l}=this.getViewportProps(),u=i/c,d=0;a>0?Math.abs(l-s)>Ep&&(d=a/(s-l)*Dp):a<0&&s>Ep&&(d=1-o/s),d=M(d,-1,1);let{minPitch:f,maxPitch:p}=this.getViewportProps(),m=r+180*u,h=n;return d>0?h=n+d*(p-n):d<0&&(h=n-d*(f-n)),{pitch:h,bearing:m}}},Np=class extends bp{constructor(){super(...arguments),this.ControllerState=Mp,this.transition={transitionDuration:300,transitionInterpolator:new fp({transitionProps:{compare:[`longitude`,`latitude`,`zoom`,`bearing`,`pitch`,`position`],required:[`longitude`,`latitude`,`zoom`]}})},this.dragMode=`pan`,this.rotationPivot=`center`,this._getAltitude=e=>{if(this.rotationPivot===`2d`)return 0;if(this.rotationPivot===`3d`&&this.pickPosition){let{x:t,y:n}=this.props,r=this.pickPosition(t+e[0],n+e[1]);if(r&&r.coordinate&&r.coordinate.length>=3)return r.coordinate[2]}}}setProps(e){`rotationPivot`in e&&(this.rotationPivot=e.rotationPivot||`center`),e.getAltitude=this._getAltitude,e.position=e.position||[0,0,0],e.maxBounds=e.maxBounds||(e.normalize===!1?null:kp),super.setProps(e)}updateViewport(e,t=null,n={}){let r=e.getState();n.isDragging&&r.startRotateLngLat?n={...n,rotationPivotPosition:r.startRotateLngLat}:n.isDragging===!1&&(n={...n,rotationPivotPosition:void 0}),super.updateViewport(e,t,n)}},Pp=class extends ep{constructor(e={}){super(e)}getViewportType(){return Ku}get ControllerType(){return Np}};Pp.displayName=`MapView`;var Fp=new Ou;function Ip(e,t){return(e.order??1/0)-(t.order??1/0)}var Lp=class{constructor(e){this._resolvedEffects=[],this._defaultEffects=[],this.effects=[],this._context=e,this._needsRedraw=`Initial render`,this._setEffects([])}addDefaultEffect(e){let t=this._defaultEffects;if(!t.find(t=>t.id===e.id)){let n=t.findIndex(t=>Ip(t,e)>0);n<0?t.push(e):t.splice(n,0,e),e.setup(this._context),this._setEffects(this.effects)}}setProps(e){`effects`in e&&(K(e.effects,this.effects,1)||this._setEffects(e.effects))}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}getEffects(){return this._resolvedEffects}_setEffects(e){let t={};for(let e of this.effects)t[e.id]=e;let n=[];for(let r of e){let e=t[r.id],i=r;e&&e!==r?e.setProps?(e.setProps(r.props),i=e):e.cleanup(this._context):e||r.setup(this._context),n.push(i),delete t[r.id]}for(let e in t)t[e].cleanup(this._context);this.effects=n,this._resolvedEffects=n.concat(this._defaultEffects),e.some(e=>e instanceof Ou)||this._resolvedEffects.push(Fp),this._needsRedraw=`effects changed`}finalize(){for(let e of this._resolvedEffects)e.cleanup(this._context);this.effects.length=0,this._resolvedEffects.length=0,this._defaultEffects.length=0}},Rp=class extends bu{shouldDrawLayer(e){let{operation:t}=e.props;return t.includes(`draw`)||t.includes(`terrain`)}render(e){return this._render(e)}},zp=`deckRenderer.renderLayers`,Bp=class{constructor(e,t={}){this.device=e,this.stats=t.stats,this.layerFilter=null,this.drawPickingColors=!1,this.drawLayersPass=new Rp(e),this.pickLayersPass=new Tf(e),this.renderCount=0,this._needsRedraw=`Initial render`,this.renderBuffers=[],this.lastPostProcessEffect=null}setProps(e){this.layerFilter!==e.layerFilter&&(this.layerFilter=e.layerFilter,this._needsRedraw=`layerFilter changed`),this.drawPickingColors!==e.drawPickingColors&&(this.drawPickingColors=e.drawPickingColors,this._needsRedraw=`drawPickingColors changed`)}renderLayers(e){let t=this.drawPickingColors?this.pickLayersPass:this.drawLayersPass,n={layerFilter:this.layerFilter,isPicking:this.drawPickingColors,...e};if(!e.viewports.length){let e=t.render(n),r=`stats`in e?e.stats:e;this._updateStats(r);return}n.effects&&this._preRender(n.effects,n);let r=this.lastPostProcessEffect?this.renderBuffers[0]:n.target;this.lastPostProcessEffect&&(n.clearColor=[0,0,0,0],n.clearCanvas=!0);let i=t.render({...n,target:r}),a=`stats`in i?i.stats:i;n.effects&&(this.lastPostProcessEffect&&(n.clearCanvas=e.clearCanvas===void 0?!0:e.clearCanvas),this._postRender(n.effects,n)),this.renderCount++,F(zp,this,a,e),this._updateStats(a)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}finalize(){let{renderBuffers:e}=this;for(let t of e)t.delete();e.length=0}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get(`Layers rendered`).addCount(t)}_preRender(e,t){this.lastPostProcessEffect=null,t.preRenderStats=t.preRenderStats||{};for(let n of e)t.preRenderStats[n.id]=n.preRender(t),n.postRender&&(this.lastPostProcessEffect=n.id);this.lastPostProcessEffect&&this._resizeRenderBuffers(t.canvasContext)}_resizeRenderBuffers(e=this.device.canvasContext){let{renderBuffers:t}=this,n=e.getDrawingBufferSize(),[r,i]=n;t.length===0&&[0,1].map(e=>{let n=this.device.createTexture({sampler:{minFilter:`linear`,magFilter:`linear`},width:r,height:i});t.push(this.device.createFramebuffer({id:`deck-renderbuffer-${e}`,depthStencilAttachment:e===0?`depth24plus`:void 0,colorAttachments:[n]}))});for(let e of t)e.resize(n)}_postRender(e,t){let{renderBuffers:n}=this,r=t.target??t.canvasContext?.getCurrentFramebuffer()??t.target,i={...t,inputBuffer:n[0],swapBuffer:n[1]};for(let t of e)if(t.postRender){i.target=t.id===this.lastPostProcessEffect?r:void 0;let e=t.postRender(i);i.inputBuffer=e,i.swapBuffer=e===n[0]?n[1]:n[0]}}},Vp={pickedColor:null,pickedObjectIndex:-1};function Hp({pickedColors:e,decodePickingColor:t,deviceX:n,deviceY:r,deviceRadius:i,deviceRect:a}){let{x:o,y:s,width:c,height:l}=a,u=i*i,d=-1,f=0;for(let t=0;t<l;t++){let i=t+s-r,a=i*i;if(a>u)f+=4*c;else for(let t=0;t<c;t++){if(e[f+3]-1>=0){let e=t+o-n,r=e*e+a;r<=u&&(u=r,d=f)}f+=4}}if(d>=0){let n=e.slice(d,d+4),r=t(n);if(r){let e=Math.floor(d/4/c),t=d/4-e*c;return{...r,pickedColor:n,pickedX:o+t,pickedY:s+e}}P.error(`Picked non-existent layer. Is picking buffer corrupt?`)()}return Vp}function Up({pickedColors:e,decodePickingColor:t}){let n=new Map;if(e){for(let r=0;r<e.length;r+=4)if(e[r+3]-1>=0){let i=e.slice(r,r+4),a=i.join(`,`);if(!n.has(a)){let e=t(i);e?n.set(a,{...e,color:i}):P.error(`Picked non-existent layer. Is picking buffer corrupt?`)()}}}return Array.from(n.values())}function Wp({pickInfo:e,viewports:t,pixelRatio:n,x:r,y:i,z:a}){let o=t[0];t.length>1&&(o=qp(e?.pickedViewports||t,{x:r,y:i}));let s;if(o){let e=[r-o.x,i-o.y];a!==void 0&&(e[2]=a),s=o.unproject(e)}return{color:null,layer:null,viewport:o,index:-1,picked:!1,x:r,y:i,pixel:[r,i],coordinate:s,devicePixel:e&&`pickedX`in e?[e.pickedX,e.pickedY]:void 0,pixelRatio:n}}function Gp(e){let{pickInfo:t,lastPickedInfo:n,mode:r,layers:i}=e,{pickedColor:a,pickedLayer:o,pickedObjectIndex:s}=t,c=o?[o]:[];if(r===`hover`){let e=n.index,t=n.layerId,r=o?o.props.id:null;if(r!==t||s!==e){if(r!==t){let e=i.find(e=>e.props.id===t);e&&c.unshift(e)}n.layerId=r,n.index=s,n.info=null}}let l=Wp(e),u=new Map;return u.set(null,l),c.forEach(e=>{let t={...l};e===o&&(t.color=a,t.index=s,t.picked=!0),t=Kp({layer:e,info:t,mode:r});let i=t.layer;e===o&&r===`hover`&&(n.info=t),u.set(i.id,t),r===`hover`&&i.updateAutoHighlight(t)}),u}function Kp({layer:e,info:t,mode:n}){for(;e&&t;){let r=t.layer||null;t.sourceLayer=r,t.layer=e,t=e.getPickingInfo({info:t,mode:n,sourceLayer:r}),e=e.parent}return t}function qp(e,t){for(let n=e.length-1;n>=0;n--){let r=e[n];if(r.containsPixel(t))return r}return e[0]}var Jp=class{constructor(e,t={}){this._pickable=!0,this.device=e,this.stats=t.stats,this.pickLayersPass=new Tf(e),this.lastPickedInfo={index:-1,layerId:null,info:null}}setProps(e){`layerFilter`in e&&(this.layerFilter=e.layerFilter),`_pickable`in e&&(this._pickable=e._pickable)}finalize(){this.pickingFBO&&this.pickingFBO.destroy(),this.depthFBO&&this.depthFBO.destroy()}pickObjectAsync(e){return this._pickClosestObjectAsync(e)}pickObjectsAsync(e){return this._pickVisibleObjectsAsync(e)}pickObject(e){return this._pickClosestObject(e)}pickObjects(e){return this._pickVisibleObjects(e)}getLastPickedObject({x:e,y:t,layers:n,viewports:r},i=this.lastPickedInfo.info){let a=i&&i.layer&&i.layer.id,o=i&&i.viewport&&i.viewport.id,s=a?n.find(e=>e.id===a):null,c=o&&r.find(e=>e.id===o)||r[0],l={x:e,y:t,viewport:c,coordinate:c&&c.unproject([e-c.x,t-c.y]),layer:s};return{...i,...l}}_resizeBuffer(e=this.device.getDefaultCanvasContext()){if(!this.pickingFBO){let e=this.device.createTexture({format:`rgba8unorm`,width:1,height:1,usage:C.RENDER_ATTACHMENT|C.COPY_SRC});if(this.pickingFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:`depth16unorm`}),this.device.isTextureFormatRenderable(`rgba32float`)){let e=this.device.createTexture({format:`rgba32float`,width:1,height:1,usage:C.RENDER_ATTACHMENT|C.COPY_SRC});this.depthFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:`depth16unorm`})}}let[t,n]=e.getDrawingBufferSize();this.pickingFBO?.resize({width:t,height:n}),this.depthFBO?.resize({width:t,height:n})}_getPickable(e){if(this._pickable===!1)return null;let t=e.filter(e=>this.pickLayersPass.shouldDrawLayer(e)&&!e.isComposite);return t.length?t:null}async _pickClosestObjectAsync({layers:e,views:t,viewports:n,x:r,y:i,radius:a=0,depth:o=1,mode:s=`query`,unproject3D:c,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=l.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0){let t=Gp({pickInfo:{pickedColor:null,pickedObjectIndex:-1},lastPickedInfo:this.lastPickedInfo,mode:s,layers:e,viewports:n,x:r,y:i,pixelRatio:f});return{result:Array.from(t.values()).filter(e=>e.layer),emptyInfo:Wp({viewports:n,x:r,y:i,pixelRatio:f})}}this._resizeBuffer(l);let m=l.cssToDevicePixels([r,i],!0),h=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],g=Math.round(a*f),{width:_,height:v}=this.pickingFBO,y=this._getPickingRect({deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceWidth:_,deviceHeight:v}),b={x:r-a,y:i-a,width:a*2+1,height:a*2+1},x,S=[],C=new Set;for(let e=0;e<o;e++){let a;a=y?Hp({...await this._drawAndSampleAsync({layers:p,views:t,viewports:n,onViewportActive:u,deviceRect:y,cullRect:b,effects:d,pass:`picking:${s}`,canvasContext:l}),deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceRect:y}):{pickedColor:null,pickedObjectIndex:-1};let m,_=this._getDepthLayers(a,p,c);if(_.length>0){let{pickedColors:e}=await this._drawAndSampleAsync({layers:_,views:t,viewports:n,onViewportActive:u,deviceRect:{x:a.pickedX??h[0],y:a.pickedY??h[1],width:1,height:1},cullRect:b,effects:d,pass:`picking:${s}:z`,canvasContext:l},!0);e[3]&&(m=e[0])}a.pickedLayer&&e+1<o&&(C.add(a.pickedLayer),a.pickedLayer.disablePickingIndex(a.pickedObjectIndex)),x=Gp({pickInfo:a,lastPickedInfo:this.lastPickedInfo,mode:s,layers:p,viewports:n,x:r,y:i,z:m,pixelRatio:f});for(let e of x.values())e.layer&&S.push(e);if(!a.pickedColor)break}for(let e of C)e.restorePickingColors();return{result:S,emptyInfo:x.get(null)}}_pickClosestObject({layers:e,views:t,viewports:n,x:r,y:i,radius:a=0,depth:o=1,mode:s=`query`,unproject3D:c,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=l.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0){let t=Gp({pickInfo:{pickedColor:null,pickedObjectIndex:-1},lastPickedInfo:this.lastPickedInfo,mode:s,layers:e,viewports:n,x:r,y:i,pixelRatio:f});return{result:Array.from(t.values()).filter(e=>e.layer),emptyInfo:Wp({viewports:n,x:r,y:i,pixelRatio:f})}}this._resizeBuffer(l);let m=l.cssToDevicePixels([r,i],!0),h=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],g=Math.round(a*f),{width:_,height:v}=this.pickingFBO,y=this._getPickingRect({deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceWidth:_,deviceHeight:v}),b={x:r-a,y:i-a,width:a*2+1,height:a*2+1},x,S=[],C=new Set;for(let e=0;e<o;e++){let a;a=y?Hp({...this._drawAndSample({layers:p,views:t,viewports:n,onViewportActive:u,deviceRect:y,cullRect:b,effects:d,pass:`picking:${s}`,canvasContext:l}),deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceRect:y}):{pickedColor:null,pickedObjectIndex:-1};let m,_=this._getDepthLayers(a,p,c);if(_.length>0){let{pickedColors:e}=this._drawAndSample({layers:_,views:t,viewports:n,onViewportActive:u,deviceRect:{x:a.pickedX??h[0],y:a.pickedY??h[1],width:1,height:1},cullRect:b,effects:d,pass:`picking:${s}:z`,canvasContext:l},!0);e[3]&&(m=e[0])}a.pickedLayer&&e+1<o&&(C.add(a.pickedLayer),a.pickedLayer.disablePickingIndex(a.pickedObjectIndex)),x=Gp({pickInfo:a,lastPickedInfo:this.lastPickedInfo,mode:s,layers:p,viewports:n,x:r,y:i,z:m,pixelRatio:f});for(let e of x.values())e.layer&&S.push(e);if(!a.pickedColor)break}for(let e of C)e.restorePickingColors();return{result:S,emptyInfo:x.get(null)}}async _pickVisibleObjectsAsync({layers:e,views:t,viewports:n,x:r,y:i,width:a=1,height:o=1,mode:s=`query`,maxObjects:c=null,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=this._getPickable(e);if(!f||n.length===0)return[];this._resizeBuffer(l);let p=l.cssToDeviceRatio(),m=l.cssToDevicePixels([r,i],!0),h=m.x,g=m.y+m.height,_=l.cssToDevicePixels([r+a,i+o],!0),v=_.x+_.width,y=_.y,b={x:h,y,width:v-h,height:g-y},x=Up(await this._drawAndSampleAsync({layers:f,views:t,viewports:n,onViewportActive:u,deviceRect:b,cullRect:{x:r,y:i,width:a,height:o},effects:d,pass:`picking:${s}`,canvasContext:l})),S=new Map,C=[],w=Number.isFinite(c);for(let e=0;e<x.length&&!(w&&C.length>=c);e++){let t=x[e],n={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:i,pixelRatio:p};n=Kp({layer:t.pickedLayer,info:n,mode:s});let a=n.layer.id;S.has(a)||S.set(a,new Set);let o=S.get(a),c=n.object??n.index;o.has(c)||(o.add(c),C.push(n))}return C}_pickVisibleObjects({layers:e,views:t,viewports:n,x:r,y:i,width:a=1,height:o=1,mode:s=`query`,maxObjects:c=null,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=this._getPickable(e);if(!f||n.length===0)return[];this._resizeBuffer(l);let p=l.cssToDeviceRatio(),m=l.cssToDevicePixels([r,i],!0),h=m.x,g=m.y+m.height,_=l.cssToDevicePixels([r+a,i+o],!0),v=_.x+_.width,y=_.y,b={x:h,y,width:v-h,height:g-y},x=Up(this._drawAndSample({layers:f,views:t,viewports:n,onViewportActive:u,deviceRect:b,cullRect:{x:r,y:i,width:a,height:o},effects:d,pass:`picking:${s}`,canvasContext:l})),S=new Map,C=[],w=Number.isFinite(c);for(let e=0;e<x.length&&!(w&&C.length>=c);e++){let t=x[e],n={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:i,pixelRatio:p};n=Kp({layer:t.pickedLayer,info:n,mode:s});let a=n.layer.id;S.has(a)||S.set(a,new Set);let o=S.get(a),c=n.object??n.index;o.has(c)||(o.add(c),C.push(n))}return C}async _drawAndSampleAsync({layers:e,views:t,viewports:n,onViewportActive:r,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c},l=!1){let u=l?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:r,pickingFBO:u,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c,pickZ:l,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(d.preRenderStats[e.id]=e.preRender(d));let{decodePickingColor:f,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:h,width:g,height:_}=i,v=u.colorAttachments[0]?.texture;if(!v)throw Error(`Picking framebuffer color attachment is missing`);let y=await this._readTextureDataAsync(v,{x:m,y:h,width:g,height:_},l?Float32Array:Uint8Array);if(!l){let e=!1;for(let t=3;t<y.length;t+=4)if(y[t]!==0){e=!0;break}!e&&y.length>0&&P.warn(`Async pick readback returned only zero alpha values`,{deviceRect:i,bytes:Array.from(y.subarray(0,Math.min(y.length,16)))})()}return{pickedColors:y,decodePickingColor:f}}async _readTextureDataAsync(e,t,n){let{width:r,height:i}=t,a=e.computeMemoryLayout(t),o=this.device.createBuffer({byteLength:a.byteLength,usage:p.COPY_DST|p.MAP_READ});try{let s=this.device.type===`webgpu`?{...t,y:e.height-t.y-i}:t;e.readBuffer(s,o);let c=await o.readAsync(0,a.byteLength),l=n.BYTES_PER_ELEMENT;if(a.bytesPerRow%l!==0)throw Error(`Texture readback row stride ${a.bytesPerRow} is not aligned to ${l}-byte elements.`);let u=new n(c.buffer,c.byteOffset,a.byteLength/l),d=r*4,f=a.bytesPerRow/l;if(f<d)throw Error(`Texture readback row stride ${f} is smaller than packed row length ${d}.`);let p=new n(r*i*4);for(let e=0;e<i;e++){let t=(this.device.type===`webgpu`?i-e-1:e)*f;p.set(u.subarray(t,t+d),e*d)}return p}finally{o.destroy()}}_drawAndSample({layers:e,views:t,viewports:n,onViewportActive:r,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c},l=!1){let u=l?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:r,pickingFBO:u,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c,pickZ:l,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(d.preRenderStats[e.id]=e.preRender(d));let{decodePickingColor:f,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:h,width:g,height:_}=i,v=new(l?Float32Array:Uint8Array)(g*_*4);return this.device.readPixelsToArrayWebGL(u,{sourceX:m,sourceY:h,sourceWidth:g,sourceHeight:_,target:v}),{pickedColors:v,decodePickingColor:f}}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get(`Layers picked`).addCount(t)}_getDepthLayers(e,t,n){if(!n||!this.depthFBO)return[];let{pickedLayer:r}=e,i=r?.state?.terrainDrawMode===`drape`;return r&&!i?[r]:t.filter(e=>e.props.operation.includes(`terrain`))}_getPickingRect({deviceX:e,deviceY:t,deviceRadius:n,deviceWidth:r,deviceHeight:i}){let a=Math.max(0,e-n),o=Math.max(0,t-n),s=Math.min(r,e+n+1)-a,c=Math.min(i,t+n+1)-o;return s<=0||c<=0?null:{x:a,y:o,width:s,height:c}}},Yp={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},Xp=`top-left`,Zp=`root`,Qp=class{constructor({deck:e,parentElement:t}){this.defaultWidgets=[],this.widgets=[],this.resolvedWidgets=[],this.containers={},this.lastViewports={},this.deck=e,t?.classList.add(`deck-widget-container`),this.parentElement=t}getWidgets(){return this.resolvedWidgets}setProps(e){if(e.widgets&&!K(e.widgets,this.widgets,1)){let t=e.widgets.filter(Boolean);this._setWidgets(t)}}finalize(){for(let e of this.getWidgets())this._removeWidget(e);this.defaultWidgets.length=0,this.resolvedWidgets.length=0;for(let e in this.containers)this.containers[e].remove()}addDefault(e){this.defaultWidgets.find(t=>t.id===e.id)||(this._addWidget(e),this.defaultWidgets.push(e),this._setWidgets(this.widgets))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getWidgets()){let{viewId:i}=r;if(i){let e=n[i];e&&(r.onViewportChange&&r.onViewportChange(e),r.onRedraw?.({viewports:[e],layers:t}))}else{if(r.onViewportChange)for(let t of e)r.onViewportChange(t);r.onRedraw?.({viewports:e,layers:t})}}this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getWidgets()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}getCanvasBounds(e){let t=(this.deck?.getCanvas?.())?.getBoundingClientRect(),n=this.parentElement?.getBoundingClientRect(),r=this.deck?.getCanvasContext?.(e?.id);if(r&&n){r.updatePosition();let[e,t]=r.getPosition(),[i,a]=r.getCSSSize();return{x:e-n.left,y:t-n.top,width:i,height:a}}return{x:t&&n?t.left-n.left:0,y:t&&n?t.top-n.top:0,width:t?.width||this.deck?.width||0,height:t?.height||this.deck?.height||0}}onEvent(e,t){let n=zc[t.type];if(n)for(let r of this.getWidgets()){let{viewId:i}=r;(!i||i===e.viewport?.id)&&r[n]?.(e,t)}}_setWidgets(e){let t={};for(let e of this.resolvedWidgets)t[e.id]=e;this.resolvedWidgets.length=0;for(let e of this.defaultWidgets)t[e.id]=null,this.resolvedWidgets.push(e);for(let n of e){let e=t[n.id];e?e.viewId!==n.viewId||e.placement!==n.placement?(this._removeWidget(e),this._addWidget(n)):n!==e&&(e.setProps(n.props),n=e):this._addWidget(n),t[n.id]=null,this.resolvedWidgets.push(n)}for(let e in t){let n=t[e];n&&this._removeWidget(n)}this.widgets=e}_addWidget(e){let{viewId:t=null,placement:n=Xp}=e,r=e.props._container??t;e.widgetManager=this,e.deck=this.deck,e.rootElement=e._onAdd({deck:this.deck,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeWidget(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.widgetManager=void 0}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=e||Zp,r=this.containers[n];r||(r=document.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,this.parentElement?.append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=globalThis.document.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,Yp[t]),r.append(i)),i}_updateContainers(){for(let e in this.containers){let t=this.lastViewports[e]||null,n=e===Zp||t,r=this.containers[e];if(n){let e=this._getContainerBounds(t);r.style.display=`block`,r.style.left=`${e.x}px`,r.style.top=`${e.y}px`,r.style.width=`${e.width}px`,r.style.height=`${e.height}px`}else r.style.display=`none`}}_getContainerBounds(e){if(!e)return{x:0,y:0,width:this.parentElement?.clientWidth||this.deck.width,height:this.parentElement?.clientHeight||this.deck.height};let t=this.getCanvasBounds(e);return{x:t.x+e.x,y:t.y+e.y,width:e.width,height:e.height}}};function $p(e,t){t&&Object.entries(t).map(([t,n])=>{t.startsWith(`--`)?e.style.setProperty(t,n):e.style[t]=n})}function em(e,t){t&&Object.keys(t).map(t=>{t.startsWith(`--`)?e.style.removeProperty(t):e.style[t]=``})}var tm=class{constructor(e){this.viewId=null,this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n=this.rootElement;n&&t.className!==e.className&&(t.className&&n.classList.remove(t.className),e.className&&n.classList.add(e.className)),n&&!K(t.style,e.style,1)&&(em(n,t.style),$p(n,e.style)),Object.assign(this.props,e),this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}get viewIds(){return this.viewId?[this.viewId]:this.deck?.getViews().map(e=>e.id)??[]}getViewState(e){return this.deck?.viewManager?.getViewState(e)||{}}setViewState(e,t){this.deck?._onViewStateChange({viewId:e,viewState:t,interactionState:{}})}onCreateRootElement(){let e=[`deck-widget`,this.className,this.props.className],t=document.createElement(`div`);return e.filter(e=>typeof e==`string`&&e.length>0).forEach(e=>t.classList.add(e)),$p(t,this.props.style),t}_onAdd(e){return this.onAdd(e)??this.onCreateRootElement()}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};tm.defaultProps={id:`widget`,style:{},_container:null,className:``};var nm={zIndex:`1`,position:`absolute`,pointerEvents:`none`,color:`#a0a7b4`,backgroundColor:`#29323c`,padding:`10px`,top:`0`,left:`0`,display:`none`},rm=class extends tm{constructor(e={}){super(e),this.id=`default-tooltip`,this.placement=`fill`,this.className=`deck-tooltip`,this.isVisible=!1,this.setProps(e)}onCreateRootElement(){let e=document.createElement(`div`);return e.className=this.className,Object.assign(e.style,nm),e}onRenderHTML(e){}onViewportChange(e){this.isVisible&&e.id===this.lastViewport?.id&&!e.equals(this.lastViewport)&&this.setTooltip(null),this.lastViewport=e}onHover(e){let{deck:t}=this,n=t&&t.props.getTooltip;if(!n)return;let r=n(e),i=this.widgetManager?.getCanvasBounds(e.viewport),a=e.x+(i?.x||0),o=e.y+(i?.y||0);this.setTooltip(r,a,o)}setTooltip(e,t,n){let r=this.rootElement;if(r){if(typeof e==`string`)r.innerText=e;else if(e)e.text&&(r.innerText=e.text),e.html&&(r.innerHTML=e.html),e.className&&(r.className=e.className);else{this.isVisible=!1,r.style.display=`none`;return}this.isVisible=!0,r.style.display=`block`,r.style.transform=`translate(${t}px, ${n}px)`,e&&typeof e==`object`&&`style`in e&&Object.assign(r.style,e.style)}}};rm.defaultProps={...tm.defaultProps};var im=class{constructor(e){this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap,this._createEventManager=e.createEventManager,this._getEventRoot=e.getEventRoot}finalize(){for(let e of Object.values(this.targets))e.eventManager.destroy(),e.presentationContext.destroy();this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap}syncCanvasEntries(e){let t=this._normalizeCanvasList(e.canvases),n={},r=[],i=new Map;for(let{canvas:e}of t){let t=this._getEventRoot(e);i.set(t,(i.get(t)||0)+1)}for(let{id:a,canvas:o}of t){let t=this._getEventRoot(o),s=i.get(t)===1?t:o,c=this.targets[a];if(!c||c.device!==e.device||c.canvas!==o||c.eventRoot!==s){c?.eventManager.destroy(),c?.presentationContext.destroy();let t=e.device.createPresentationContext({id:a,canvas:o,useDevicePixels:e.useDevicePixels,autoResize:!0});c={id:a,device:e.device,canvas:o,eventRoot:s,presentationContext:t,eventManager:this._createEventManager(s)}}this._eventRootToCanvasId.set(s,a),this._eventRootToCanvasId.set(o,a),n[a]=c,r.push(a)}for(let[e,t]of Object.entries(this.targets))n[e]||(t.eventManager.destroy(),t.presentationContext.destroy());this.targets=n,this.order=r;let a=Object.fromEntries(Object.entries(n).map(([e,t])=>[e,t.eventManager]));this._haveSameEventManagers(a)||(this.eventManagers=a)}getCanvasIdFromEvent(e){return e?this._eventRootToCanvasId.get(e):void 0}getTarget(e){return this.targets[e||this.order[0]||`default-canvas`]||null}_normalizeCanvasList(e=[]){let t=new Set;return e.map((e,n)=>{let r,i;return typeof e==`string`?(r=document.getElementById(e),Y(r,`Canvas with id ${e} not found`),i=e):(r=e,i=r.id||`deckgl-canvas-${n}`),Y(!t.has(i),`Duplicate canvas id ${i}`),t.add(i),{id:i,canvas:r}})}_haveSameEventManagers(e){let t=Object.keys(e),n=Object.keys(this.eventManagers);return t.length===n.length&&t.every(t=>e[t]===this.eventManagers[t])}},am={WEBGL_depth_texture:{UNSIGNED_INT_24_8_WEBGL:w.UNSIGNED_INT_24_8},OES_element_index_uint:{},OES_texture_float:{},OES_texture_half_float:{HALF_FLOAT_OES:w.HALF_FLOAT},EXT_color_buffer_float:{},OES_standard_derivatives:{FRAGMENT_SHADER_DERIVATIVE_HINT_OES:w.FRAGMENT_SHADER_DERIVATIVE_HINT},EXT_frag_depth:{},EXT_blend_minmax:{MIN_EXT:w.MIN,MAX_EXT:w.MAX},EXT_shader_texture_lod:{}},om=e=>({drawBuffersWEBGL(t){return e.drawBuffers(t)},COLOR_ATTACHMENT0_WEBGL:w.COLOR_ATTACHMENT0,COLOR_ATTACHMENT1_WEBGL:w.COLOR_ATTACHMENT1,COLOR_ATTACHMENT2_WEBGL:w.COLOR_ATTACHMENT2,COLOR_ATTACHMENT3_WEBGL:w.COLOR_ATTACHMENT3}),sm=e=>({VERTEX_ARRAY_BINDING_OES:w.VERTEX_ARRAY_BINDING,createVertexArrayOES(){return e.createVertexArray()},deleteVertexArrayOES(t){return e.deleteVertexArray(t)},isVertexArrayOES(t){return e.isVertexArray(t)},bindVertexArrayOES(t){return e.bindVertexArray(t)}}),cm=e=>({VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE:35070,drawArraysInstancedANGLE(...t){return e.drawArraysInstanced(...t)},drawElementsInstancedANGLE(...t){return e.drawElementsInstanced(...t)},vertexAttribDivisorANGLE(...t){return e.vertexAttribDivisor(...t)}});function lm(e=!0){let t=HTMLCanvasElement.prototype;if(!e&&t.originalGetContext){t.getContext=t.originalGetContext,t.originalGetContext=void 0;return}t.originalGetContext=t.getContext,t.getContext=function(e,t){if(e===`webgl`||e===`experimental-webgl`){let e=this.originalGetContext(`webgl2`,t);return e instanceof HTMLElement&&um(e),e}return this.originalGetContext(e,t)}}function um(e){e.getExtension(`EXT_color_buffer_float`);let t={...am,WEBGL_disjoint_timer_query:e.getExtension(`EXT_disjoint_timer_query_webgl2`),WEBGL_draw_buffers:om(e),OES_vertex_array_object:sm(e),ANGLE_instanced_arrays:cm(e)},n=e.getExtension.bind(e);e.getExtension=function(e){return n(e)||(e in t?t[e]:null)};let r=e.getSupportedExtensions;e.getSupportedExtensions=function(){return(r.apply(e)||[])?.concat(Object.keys(t))}}var dm=`modulepreload`,fm=function(e){return`/next/standalone-examples/city-scene/`+e},pm={},mm=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=fm(t,n),t in pm)return;pm[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:dm,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},hm=1,gm=class extends Li{type=`webgl`;enforceWebGL2(e){lm(e)}isSupported(){return typeof WebGL2RenderingContext<`u`}isDeviceHandle(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:(typeof WebGLRenderingContext<`u`&&e instanceof WebGLRenderingContext&&u.warn(`WebGL1 is not supported`,e)(),!1)}async attach(e,t={}){let{WebGLDevice:n}=await mm(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-OED5-1E4.js`);return{WebGLDevice:e}},__vite__mapDeps([0,1,2,3,4,5,6]));if(e instanceof n)return e;let r=n.getDeviceFromContext(e);if(r)return r;if(!_m(e))throw Error(`Invalid WebGL2RenderingContext`);t=ym(t),await bm(t);let i=t.createCanvasContext===!0?{}:t.createCanvasContext;return new n({...t,_handle:e,createCanvasContext:{canvas:e.canvas,autoResize:!1,...i}})}async create(e={}){let{WebGLDevice:t}=await mm(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-OED5-1E4.js`);return{WebGLDevice:e}},__vite__mapDeps([0,1,2,3,4,5,6]));e=ym(e),await bm(e);try{let n=new t(e);u.groupCollapsed(hm,`WebGLDevice ${n.id} created`)();let r=`\
${n._reused?`Reusing`:`Created`} device with WebGL2 ${n.props.debug?`debug `:``}context: \
${n.info.vendor}, ${n.info.renderer} for canvas: ${n.canvasContext.id}`;return u.probe(hm,r)(),u.table(hm,n.info)(),n}finally{u.groupEnd(hm)(),u.info(hm,`%cWebGL call tracing: luma.log.set('debug-webgl') `,`color: white; background: blue; padding: 2px 6px; border-radius: 3px;`)()}}};function _m(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:!!(e&&typeof e.createVertexArray==`function`)}var vm=new gm;function ym(e){return{...e,debug:e.debug??b.defaultProps.debug,debugWebGL:e.debugWebGL??b.defaultProps.debugWebGL,debugSpectorJS:e.debugSpectorJS??!!u.get(`debug-spectorjs`)}}async function bm(e){let t=[];(e.debugWebGL||e.debug)&&t.push(E()),e.debugSpectorJS&&t.push(T(e));let n=await Promise.allSettled(t);for(let e of n)e.status===`rejected`&&u.error(`Failed to initialize debug libraries ${e.reason}`)()}function xm(){}var Sm={id:``,width:`100%`,height:`100%`,style:null,viewState:null,initialViewState:null,pickingRadius:0,pickAsync:`auto`,layerFilter:null,parameters:{},parent:null,device:null,deviceProps:{},gl:null,canvas:null,_canvases:null,layers:[],effects:[],views:null,controller:null,useDevicePixels:!0,touchAction:`none`,eventRecognizerOptions:{},_framebuffer:null,_animate:!1,_pickable:!0,_typedArrayManagerProps:{},_customRender:null,widgets:[],onDeviceInitialized:xm,onWebGLInitialized:xm,onResize:xm,onViewStateChange:xm,onInteractionStateChange:xm,onBeforeRender:xm,onAfterRender:xm,onLoad:xm,onError:e=>P.error(e.message,e.cause)(),onHover:null,onClick:null,onDragStart:null,onDrag:null,onDragEnd:null,_onMetrics:null,getCursor:({isDragging:e})=>e?`grabbing`:`grab`,getTooltip:null,debug:!1,drawPickingColors:!1},Cm=class{constructor(e){this.width=0,this.height=0,this.userData={},this.device=null,this.canvas=null,this.viewManager=null,this.layerManager=null,this.effectManager=null,this.deckRenderer=null,this.deckPicker=null,this.eventManager=null,this.eventManagers={},this.widgetManager=null,this.tooltip=null,this.animationLoop=null,this._canvasContext=null,this._deviceResizeHandler=null,this.cursorState={isHovering:!1,isDragging:!1},this.stats=new tn({id:`deck.gl`}),this.metrics={fps:0,setPropsTime:0,layersCount:0,drawLayersCount:0,updateLayersCount:0,updateAttributesCount:0,updateAttributesTime:0,framesRedrawn:0,pickTime:0,pickCount:0,pickLayersCount:0,gpuTime:0,gpuTimePerFrame:0,cpuTime:0,cpuTimePerFrame:0,bufferMemory:0,textureMemory:0,renderbufferMemory:0,gpuMemory:0},this._metricsCounter=0,this._hoverPickSequence=0,this._pointerDownPickSequence=0,this._needsRedraw=`Initial render`,this._canvasManager=new im({createEventManager:e=>this._createEventManager(e),getEventRoot:e=>this._getEventRoot(e)}),this._ownedCanvas=null,this._pickRequest={mode:`hover`,x:-1,y:-1,radius:0,canvasId:void 0,event:null,unproject3D:!1},this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this._onPointerMove=e=>{let{_pickRequest:t}=this,n=this._getCanvasIdFromEvent(e);if(e.type===`pointerleave`)t.x=-1,t.y=-1,t.radius=0,t.canvasId=n;else if(e.leftButton||e.rightButton)return;else{let r=e.offsetCenter;if(!r)return;t.x=r.x,t.y=r.y,t.radius=this.props.pickingRadius,t.canvasId=n}this.layerManager&&(this.layerManager.context.mousePosition={x:t.x,y:t.y}),t.event=e},this._onEvent=e=>{let t=zc[e.type],n=e.offsetCenter,r=this._getCanvasIdFromEvent(e);if(!t||!n||!this.layerManager)return;let i=this.layerManager.getLayers(),a=this._getInternalPickingMode();if(a){if(a===`sync`){let t=e.type===`click`&&this._shouldUnproject3D(i)?this._getFirstPickedInfo(this._pickPointSync(this._getPointPickOptions(n.x,n.y,{unproject3D:!0,canvasId:r},i))):this._getLastPointerDownPickingInfo(n.x,n.y,r,i);this._dispatchPickingEvent(t,e);return}(this._lastPointerDownInfoPromise||Promise.resolve(this._getLastPointerDownPickingInfo(n.x,n.y,r,i))).then(t=>{this._dispatchPickingEvent(t,e)}).catch(e=>this.props.onError?.(e))}},this._onPointerDown=e=>{let t=e.offsetCenter,n=this._getCanvasIdFromEvent(e);if(!t)return;let r=this._getInternalPickingMode();if(!r)return;let i=this.layerManager?.getLayers()||[],a=++this._pointerDownPickSequence;if(r===`sync`){let e=this._pickPointSync({x:t.x,y:t.y,canvasId:n,radius:this.props.pickingRadius}),r=this._getFirstPickedInfo(e);this._lastPointerDownInfo=r,this._lastPointerDownInfoPromise=Promise.resolve(r);return}let o=this._pickPointAsync(this._getPointPickOptions(t.x,t.y,{canvasId:n},i)).then(e=>this._getFirstPickedInfo(e)).then(e=>(a===this._pointerDownPickSequence&&(this._lastPointerDownInfo=e),e)).catch(e=>{this.props.onError?.(e);let r=this.deckPicker&&this.viewManager?this._getLastPointerDownPickingInfo(t.x,t.y,n,i):{};return a===this._pointerDownPickSequence&&(this._lastPointerDownInfo=r),r});this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=o};let t=e;this.props={...Sm,...e},e=this.props,this._validateCanvasConfiguration(e),e.viewState&&e.initialViewState&&P.warn("View state tracking is disabled. Use either `initialViewState` for auto update or `viewState` for manual update.")(),this.viewState=this.props.initialViewState,e.device&&(this.device=e.device,this._setDeviceCanvasContext(e.device));let n=this.device;!n&&e.gl&&(e.gl instanceof WebGLRenderingContext&&P.error(`WebGL1 context not supported.`)(),n=vm.attach(e.gl,{_cacheShaders:!0,_cachePipelines:!0,...this.props.deviceProps})),n||=this._createDevice(e),this.animationLoop=this._createAnimationLoop(n,e),this.setProps(t),e._typedArrayManagerProps&&ku.setOptions(e._typedArrayManagerProps),this.animationLoop.start()}finalize(){this._restoreDeviceResizeHandler(),this.animationLoop?.stop(),this.animationLoop?.destroy(),this.animationLoop=null,this._hoverPickSequence++,this._pointerDownPickSequence++,this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this.layerManager?.finalize(),this.layerManager=null,this.viewManager?.finalize(),this.viewManager=null,this.effectManager?.finalize(),this.effectManager=null,this.deckRenderer?.finalize(),this.deckRenderer=null,this.deckPicker?.finalize(),this.deckPicker=null,Object.keys(this._canvasManager.targets).length||this.eventManager?.destroy(),this.eventManager=null,this.eventManagers={},this.widgetManager?.finalize(),this.widgetManager=null,this._canvasManager.finalize(),this._isMultiCanvasMode()?this.canvas=null:this.canvas&&this.canvas===this._ownedCanvas&&(this.canvas.parentElement?.removeChild(this.canvas),this.canvas=null,this._ownedCanvas=null),this._canvasContext=null}setProps(e){this.stats.get(`setProps Time`).timeStart(),`onLayerHover`in e&&P.removed(`onLayerHover`,`onHover`)(),`onLayerClick`in e&&P.removed(`onLayerClick`,`onClick`)(),e.initialViewState&&!K(this.props.initialViewState,e.initialViewState,3)&&(this.viewState=e.initialViewState),Y(!(`_canvases`in e)||Array.isArray(e._canvases)===this._isMultiCanvasMode()),Object.assign(this.props,e),this._validateCanvasConfiguration(this.props),this._validateInternalPickingMode(),this.device&&this._isMultiCanvasMode()&&this._syncCanvasTargets(),this._setCanvasSize(this.props);let t=Object.create(this.props);if(Object.assign(t,{views:this._getViews(),width:this.width,height:this.height,viewState:this._getViewState(),eventManagers:this.eventManagers}),e.device&&e.device.id!==this.device?.id){let t=e.device.getDefaultCanvasContext();this.animationLoop?.stop(),!this._isMultiCanvasMode()&&this.canvas!==t.canvas&&(this.canvas?.remove(),this.eventManager?.destroy(),this.canvas=null),this._setDeviceCanvasContext(e.device),P.log(`recreating animation loop for new device! id=${e.device.id}`)(),this.animationLoop=this._createAnimationLoop(e.device,e),this.animationLoop.start()}if(this.animationLoop?.setProps(t),e.useDevicePixels!==void 0&&this._canvasContext?.setProps){this._canvasContext.setProps({useDevicePixels:e.useDevicePixels});for(let t of Object.values(this._canvasManager.targets))t.presentationContext.setProps({useDevicePixels:e.useDevicePixels})}this.layerManager&&(this.viewManager.setProps(t),this.layerManager.activateViewport(this.getViewports()[0]),this.layerManager.setProps(t),this.effectManager.setProps(t),this.deckRenderer.setProps(t),this.deckPicker.setProps(t),this.widgetManager.setProps(t)),this.stats.get(`setProps Time`).timeEnd()}needsRedraw(e={clearRedrawFlags:!1}){if(!this.layerManager)return!1;if(this.props._animate)return`Deck._animate`;let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);let n=this.viewManager.needsRedraw(e),r=this.layerManager.needsRedraw(e),i=this.effectManager.needsRedraw(e),a=this.deckRenderer.needsRedraw(e);return t=t||n||r||i||a,t}redraw(e){if(!this.layerManager)return;let t=this.needsRedraw({clearRedrawFlags:!0});t=e||t,t&&(this.stats.get(`Redraw Count`).incrementCount(),this.props._customRender?this.props._customRender(t):this._drawLayers(t))}get isInitialized(){return this.viewManager!==null}getViews(){return Y(this.viewManager),this.viewManager.views}getView(e){return Y(this.viewManager),this.viewManager.getView(e)}getViewports(e){return Y(this.viewManager),this.viewManager.getViewports(e)}getCanvas(){return this.canvas}getCanvasContext(e){let t=e?this.viewManager?.getView(e)?.props.canvasId:void 0;return this._getCanvasContext(t)}getEventManager(e){if(!e||!this.viewManager)return this.eventManager;let t=this.viewManager.getCanvasId(e)||`default-canvas`;return this.eventManagers[t]||this.eventManager}async pickObjectAsync(e){let t=(await this._pickAsync(`pickObjectAsync`,`pickObject Time`,e)).result;return t.length?t[0]:null}async pickObjectsAsync(e){return await this._pickAsync(`pickObjectsAsync`,`pickObjects Time`,e)}pickObject(e){let t=this._pick(`pickObject`,`pickObject Time`,e).result;return t.length?t[0]:null}pickMultipleObjects(e){return e.depth=e.depth||10,this._pick(`pickObject`,`pickMultipleObjects Time`,e).result}pickObjects(e){return this._pick(`pickObjects`,`pickObjects Time`,e)}_pickPositionForController(e,t,n){return this._getInternalPickingMode()===`sync`?this.pickObject({x:e,y:t,radius:0,unproject3D:!0,canvasId:n?this.viewManager?.getCanvasId(n):void 0}):null}_addResources(e,t=!1){for(let n in e)this.layerManager.resourceManager.add({resourceId:n,data:e[n],forceUpdate:t})}_removeResources(e){for(let t of e)this.layerManager.resourceManager.remove(t)}_addDefaultEffect(e){this.effectManager.addDefaultEffect(e)}_addDefaultShaderModule(e){this.layerManager.addDefaultShaderModule(e)}_removeDefaultShaderModule(e){this.layerManager?.removeDefaultShaderModule(e)}_resolveInternalPickingMode(){let{pickAsync:e}=this.props,t=this.device?.type||this.props.deviceProps?.type;if(e===`auto`)return t===`webgpu`?`async`:`sync`;if(e===`sync`&&t===`webgpu`)throw Error('`pickAsync: "sync"` is not supported when Deck is using a WebGPU device.');return e}_getInternalPickingMode(){try{return this._resolveInternalPickingMode()}catch(e){return this.props.onError?.(e),null}}_validateInternalPickingMode(){this._getInternalPickingMode()}_getFirstPickedInfo({result:e,emptyInfo:t}){return e[0]||t}_shouldUnproject3D(e=this.layerManager?.getLayers()||[]){return e.some(e=>e.props.pickable===`3d`)}_getPointPickOptions(e,t,n={},r=this.layerManager?.getLayers()||[]){return{x:e,y:t,canvasId:n.canvasId,radius:this.props.pickingRadius,unproject3D:this._shouldUnproject3D(r),...n}}_pickPointSync(e){return this._pick(`pickObject`,`pickObject Time`,e)}_pickPointAsync(e){return this._pickAsync(`pickObjectAsync`,`pickObject Time`,e)}_getLastPointerDownPickingInfo(e,t,n,r=this.layerManager?.getLayers()||[]){return this.deckPicker.getLastPickedObject({x:e,y:t,layers:r,viewports:this.getViewports({x:e,y:t,canvasId:n})},this._lastPointerDownInfo)}_applyHoverCallbacks({result:e,emptyInfo:t},n){if(!this.widgetManager)return;this.cursorState.isHovering=e.some(e=>e.picked);let r=t,i=!1;for(let t of e)r=t,i=t.layer?.onHover(t,n)||i;i||(this.props.onHover?.(r,n),this.widgetManager.onHover(r,n))}_dispatchPickingEvent(e,t){if(!this.layerManager||!this.widgetManager)return;let n=zc[t.type];if(!n)return;let{layer:r}=e,i=r&&(r[n]||r.props[n]),a=this.props[n],o=!1;i&&(o=i.call(r,e,t)),o||(a?.(e,t),this.widgetManager.onEvent(e,t))}_pickAsync(e,t,n){Y(this.deckPicker);let{stats:r}=this,i=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,a=this._getCanvasContext(i)||void 0;r.get(`Pick Count`).incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(i);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:i}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:i,canvasContext:a});return r.get(t).timeEnd(),o}_pick(e,t,n){Y(this.deckPicker);let{stats:r}=this,i=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,a=this._getCanvasContext(i)||void 0;r.get(`Pick Count`).incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(i);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:i}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:i,canvasContext:a});return r.get(t).timeEnd(),o}_createCanvas(e){let t=e.canvas;return typeof t==`string`&&(t=document.getElementById(t),Y(t)),t?this._ownedCanvas=null:(t=document.createElement(`canvas`),t.id=e.id||`deckgl-overlay`,e.width&&typeof e.width==`number`&&(t.width=e.width),e.height&&typeof e.height==`number`&&(t.height=e.height),(e.parent||document.body).appendChild(t),this._ownedCanvas=t),Object.assign(t.style,e.style),t}_isMultiCanvasMode(){return Array.isArray(this.props._canvases)}_getDefaultCanvasId(){return this._canvasManager.order[0]||`default-canvas`}_validateCanvasConfiguration(e){Array.isArray(e._canvases)&&(Y(!e.canvas),Y(!e.gl),Y(!e.device?.canvasContext||e.device.getDefaultCanvasContext().offscreenCanvas))}_createEventManager(e){let t=new Ic(e,{touchAction:this.props.touchAction,recognizers:Object.keys(Bc).map(e=>{let[t,n,r,i]=Bc[e],a=this.props.eventRecognizerOptions?.[e];return{recognizer:new t({...n,...a,event:e}),recognizeWith:r,requireFailure:i}}),events:{pointerdown:this._onPointerDown,pointermove:this._onPointerMove,pointerleave:this._onPointerMove}});for(let e in zc)e===`dblclick`?t.watch(e,this._onEvent):t.on(e,this._onEvent);return t}_getEventRoot(e){return e.closest(`.deck-events-root`)||this.props.parent?.querySelector(`.deck-events-root`)||e}_syncCanvasTargets(){if(!this.device||!this._isMultiCanvasMode())return;this._canvasManager.syncCanvasEntries({device:this.device,canvases:this.props._canvases||[],useDevicePixels:this.props.useDevicePixels}),this.eventManagers=this._canvasManager.eventManagers;let e=this._getDefaultCanvasId();this.eventManager=this.eventManagers[e]||null,this.canvas=this._canvasManager.targets[e]?.canvas||null}_setCanvasContext(e){this._canvasContext=e,`style`in e.canvas&&(this.canvas=e.canvas)}_setDeviceCanvasContext(e,t={}){let n=e.getDefaultCanvasContext();this._setCanvasContext(n),this._setDeviceResizeHandler(e,t)}_setDeviceResizeHandler(e,t={}){let n=!!t.syncDrawingBuffer;if(this._deviceResizeHandler?.device===e){this._deviceResizeHandler.syncDrawingBuffer=n;return}this._restoreDeviceResizeHandler();let r=e=>{this._isMultiCanvasMode()?this._updateMultiCanvasDimensions():e===this._canvasContext&&this._canvasContext&&this._onCanvasContextResize(this._canvasContext,{syncDrawingBuffer:this._deviceResizeHandler?.syncDrawingBuffer})};e.props.onResize=r,this._deviceResizeHandler={device:e,onResize:r,syncDrawingBuffer:n}}_restoreDeviceResizeHandler(){let e=this._deviceResizeHandler;e&&e.device.props?.onResize===e.onResize&&(e.device.props.onResize=xm),this._deviceResizeHandler=null}_setCanvasSize(e){if(this._isMultiCanvasMode()||!this.canvas)return;let{width:t,height:n}=e;if(t||t===0){let e=Number.isFinite(t)?`${t}px`:t;this.canvas.style.width=e}if(n||n===0){let t=Number.isFinite(n)?`${n}px`:n;this.canvas.style.position=e.style?.position||`absolute`,this.canvas.style.height=t}}_getCanvasIdFromEvent(e){return this._canvasManager.getCanvasIdFromEvent(e?.rootElement)}_getCanvasContext(e){return this._canvasManager.getTarget(e)?.presentationContext||this._canvasContext}_resizeForCanvasTarget(e){let t=this._canvasManager.getTarget(e);if(!t||!this.device?.canvasContext)return;let[n,r]=t.presentationContext.getDrawingBufferSize();this.device.canvasContext.setDrawingBufferSize(n,r)}_createDeviceCanvas(e){if(this._isMultiCanvasMode()){let t=globalThis.OffscreenCanvas;if(!t)throw Error("`_canvases` requires OffscreenCanvas support.");return new t(typeof e.width==`number`&&Number.isFinite(e.width)?e.width:1,typeof e.height==`number`&&Number.isFinite(e.height)?e.height:1)}return this._createCanvas(e)}_updateCanvasSize(e=this._canvasContext){if(this._isMultiCanvasMode()){this._updateMultiCanvasDimensions();return}let{canvas:t}=this,[n,r]=e?e.getCSSSize():[t?.clientWidth??t?.width??0,t?.clientHeight??t?.height??0];(n!==this.width||r!==this.height)&&(this.width=n,this.height=r,this.viewManager?.setProps({width:n,height:r}),this.layerManager?.activateViewport(this.getViewports()[0]),this.props.onResize({width:n,height:r},e||void 0))}_onCanvasContextResize(e,t={}){if(t.syncDrawingBuffer){let{width:t,height:n}=e.canvas;e.setDrawingBufferSize(t,n)}this._needsRedraw=`Canvas resized`,this._updateCanvasSize(e)}_updateMultiCanvasDimensions(){let[e,t]=this._getCanvasContext()?.getCSSSize()||[0,0];(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.props.onResize({width:e,height:t})),this._needsRedraw=`Canvas resized`,this.viewManager?.setNeedsUpdate(`Canvas resized`),this.viewManager?.setProps({width:this.width,height:this.height})}_createAnimationLoop(e,t){let{gl:n,onError:r}=t;return new od({device:e,autoResizeDrawingBuffer:!n&&!Array.isArray(t._canvases),autoResizeViewport:!1,onInitialize:e=>this._setDevice(e.device),onRender:this._onRenderFrame.bind(this),onError:r})}_createDevice(e){let t=this.props.deviceProps?.createCanvasContext,n=typeof t==`object`?t:void 0,r={adapters:[],_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps};r.adapters.includes(vm)||r.adapters.push(vm);let i={alphaMode:this.props.deviceProps?.type===`webgpu`?`premultiplied`:void 0};return Ii.createDevice({_reuseDevices:!0,type:`webgl`,...r,createCanvasContext:{...i,...n,canvas:this._createDeviceCanvas(e),useDevicePixels:this.props.useDevicePixels,autoResize:!0}})}_getViewState(){return this.props.viewState||this.viewState}_getViews(){let{views:e}=this.props,t=Array.isArray(e)?e:e?[e]:[new Pp({id:`default-view`})];return t.length&&this.props.controller&&(t[0]=t[0].clone({controller:this.props.controller})),t}_onContextLost(){let{onError:e}=this.props;this.animationLoop&&e&&e(Error(`WebGL context is lost`))}_pickAndCallback(){let{_pickRequest:e}=this;if(e.event){let t=e.event,n=this.layerManager?.getLayers()||[],r=this._getPointPickOptions(e.x,e.y,{canvasId:e.canvasId,radius:e.radius,mode:e.mode},n),i=this._getInternalPickingMode(),a=++this._hoverPickSequence;if(e.event=null,e.canvasId=void 0,!i)return;if(i===`sync`){this._applyHoverCallbacks(this._pickPointSync(r),t);return}this._pickPointAsync(r).then(({result:e,emptyInfo:n})=>{a===this._hoverPickSequence&&this._applyHoverCallbacks({result:e,emptyInfo:n},t)}).catch(e=>this.props.onError?.(e))}}_updateCursor(){let e=this.props.getCursor(this.cursorState);if(this._isMultiCanvasMode()){for(let t of Object.values(this._canvasManager.targets))t.canvas.style.cursor=e;return}let t=this.props.parent||this.canvas;t&&(t.style.cursor=e)}_setDevice(e){if(this.device=e,this._validateInternalPickingMode(),!this.animationLoop)return;this._setDeviceCanvasContext(e,{syncDrawingBuffer:!!(this.props.gl&&this.props.device!==e)}),this._isMultiCanvasMode()?this._syncCanvasTargets():this.canvas&&!this.canvas.isConnected&&this.props.parent&&this.props.parent.insertBefore(this.canvas,this.props.parent.firstChild),this.device.type===`webgl`&&this.device.setParametersWebGL({blend:!0,blendFunc:[770,771,1,771],polygonOffsetFill:!0,depthTest:!0,depthFunc:515}),this.props.onDeviceInitialized(this.device),this.device.type===`webgl`&&this.props.onWebGLInitialized(this.device.gl);let t=new ed;if(t.play(),this.animationLoop.attachTimeline(t),!this._isMultiCanvasMode()){let e=this.canvas&&this._getEventRoot(this.canvas);Y(e),this.eventManager=this._createEventManager(e),this.eventManagers={[Uf]:this.eventManager}}this.viewManager=new Wf({timeline:t,eventManager:this.eventManager,eventManagers:this.eventManagers,getCanvasContext:this._isMultiCanvasMode()?this.getCanvasContext.bind(this):void 0,onViewStateChange:this._onViewStateChange.bind(this),onInteractionStateChange:this._onInteractionStateChange.bind(this),pickPosition:this._pickPositionForController.bind(this),views:this._getViews(),viewState:this._getViewState(),width:this.width,height:this.height});let n=this.viewManager.getViewports()[0];this.layerManager=new Hf(this.device,{deck:this,stats:this.stats,viewport:n,timeline:t}),this.effectManager=new Lp({deck:this,device:this.device}),this.deckRenderer=new Bp(this.device,{stats:this.stats}),this.deckPicker=new Jp(this.device,{stats:this.stats});let r=this.props.parent?.querySelector(`.deck-widgets-root`)||(this._isMultiCanvasMode()?this.props.parent||this.canvas?.parentElement:null)||this.canvas?.parentElement;this.widgetManager=new Qp({deck:this,parentElement:r}),this.widgetManager.addDefault(new rm),this.setProps({}),this._updateCanvasSize(this._canvasContext),this.props.onLoad()}_drawLayers(e,t){let{device:n,gl:r}=this.layerManager.context;this.props.onBeforeRender({device:n,gl:r});let i={target:this.props._framebuffer,layers:this.layerManager.getLayers(),viewports:this.viewManager.getViewports(),onViewportActive:this.layerManager.activateViewport,views:this.viewManager.getViews(),pass:`screen`,effects:this.effectManager.getEffects(),...t};if(this._isMultiCanvasMode()&&i.pass===`screen`&&!i.target&&this._canvasManager.order.length)for(let e of this._canvasManager.order){let t=i.viewports.filter(t=>this.viewManager.getCanvasId(t.id)===e);if(!t.length){let t=this._canvasManager.targets[e];this._resizeForCanvasTarget(e),this.deckRenderer?.renderLayers({...i,canvasContext:t.presentationContext,target:t.presentationContext.getCurrentFramebuffer(),viewports:[],clearCanvas:!0}),t.presentationContext.present();continue}let n=this._canvasManager.targets[e];this._resizeForCanvasTarget(e);let r=n.presentationContext.getCurrentFramebuffer();this.deckRenderer?.renderLayers({...i,canvasContext:n.presentationContext,target:r,viewports:t}),n.presentationContext.present()}else this.deckRenderer?.renderLayers(i);i.pass===`screen`&&this.widgetManager.onRedraw({viewports:i.viewports,layers:i.layers}),this.props.onAfterRender({device:n,gl:r})}_onRenderFrame(){this._getFrameStats(),this._metricsCounter++%60==0&&(this._getMetrics(),this.stats.reset(),P.table(4,this.metrics)(),this.props._onMetrics&&this.props._onMetrics(this.metrics)),this._updateCursor(),this.layerManager.updateLayers(),this._pickAndCallback(),this.redraw(),this.viewManager&&this.viewManager.updateViewStates()}_onViewStateChange(e){let t=this.props.onViewStateChange(e)||e.viewState;this.viewState&&(this.viewState={...this.viewState,[e.viewId]:t},this.props.viewState||this.viewManager&&this.viewManager.setProps({viewState:this.viewState}))}_onInteractionStateChange(e){this.cursorState.isDragging=e.isDragging||!1,this.props.onInteractionStateChange(e)}_getFrameStats(){let{stats:e}=this;e.get(`frameRate`).timeEnd(),e.get(`frameRate`).timeStart();let t=this.animationLoop.stats;e.get(`GPU Time`).addTime(t.get(`GPU Time`).lastTiming),e.get(`CPU Time`).addTime(t.get(`CPU Time`).lastTiming)}_getMetrics(){let{metrics:e,stats:t}=this;e.fps=t.get(`frameRate`).getHz(),e.setPropsTime=t.get(`setProps Time`).time,e.updateAttributesTime=t.get(`Update Attributes`).time,e.framesRedrawn=t.get(`Redraw Count`).count,e.pickTime=t.get(`pickObject Time`).time+t.get(`pickMultipleObjects Time`).time+t.get(`pickObjects Time`).time,e.pickCount=t.get(`Pick Count`).count,e.layersCount=this.layerManager?.layers.length??0,e.drawLayersCount=t.get(`Layers rendered`).lastSampleCount,e.pickLayersCount=t.get(`Layers picked`).lastSampleCount,e.updateLayersCount=t.get(`Layer updates`).count,e.updateAttributesCount=t.get(`Attributes updated`).count,e.gpuTime=t.get(`GPU Time`).time,e.cpuTime=t.get(`CPU Time`).time,e.gpuTimePerFrame=t.get(`GPU Time`).getAverageTime(),e.cpuTimePerFrame=t.get(`CPU Time`).getAverageTime();let n=Ii.stats.get(`GPU Time and Memory`);e.bufferMemory=n.get(`Buffer Memory`).count,e.textureMemory=n.get(`Texture Memory`).count,e.renderbufferMemory=n.get(`Renderbuffer Memory`).count,e.gpuMemory=n.get(`GPU Memory`).count}};Cm.defaultProps=Sm,Cm.VERSION=ji;function wm(e){switch(e){case`float64`:return Float64Array;case`uint8`:case`unorm8`:return Uint8ClampedArray;default:return d(e)}}var Tm=f.getDataType.bind(f);function Em(e,t,n){if(t.size>4)return null;let r=n===`webgpu`&&t.type===`uint8`?`unorm8`:t.type,i=t.size,a=!!(n!==`webgpu`&&i===3&&r&&[`uint8`,`sint8`,`unorm8`,`snorm8`,`uint16`,`sint16`,`unorm16`,`snorm16`].includes(r));return{attribute:e,format:i>1?`${r}x${i}${a?`-webgl`:``}`:t.type,byteOffset:t.offset||0}}function X(e){return e.stride||e.size*e.bytesPerElement}function Dm(e,t){return e.type===t.type&&e.size===t.size&&X(e)===X(t)&&(e.offset||0)===(t.offset||0)}function Om(e,t){t.offset&&P.removed(`shaderAttribute.offset`,`vertexOffset, elementOffset`)();let n=X(e),r=t.vertexOffset===void 0?e.vertexOffset||0:t.vertexOffset,i=t.elementOffset||0,a=r*n+i*e.bytesPerElement+(e.offset||0);return{...t,offset:a,stride:n}}function km(e,t){let n=Om(e,t);return{high:n,low:{...n,offset:n.offset+e.size*4}}}var Am=class{constructor(e,t,n){this._buffer=null,this.device=e,this.id=t.id||``,this.size=t.size||1;let r=t.logicalType||t.type,i=r===`float64`,{defaultValue:a}=t;a=Number.isFinite(a)?[a]:a||Array(this.size).fill(0);let o;o=i?`float32`:!r&&t.isIndexed?`uint32`:r||`float32`;let s=wm(r||o);this.doublePrecision=i,i&&t.fp64===!1&&(s=Float32Array),this.value=null,this.settings={...t,defaultType:s,defaultValue:a,logicalType:r,type:o,normalized:o.includes(`norm`),size:this.size,bytesPerElement:s.BYTES_PER_ELEMENT},this.state={...n,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let e=this.getAccessor();return e.vertexOffset?e.vertexOffset*X(e):0}get numInstances(){return this.state.numInstances}set numInstances(e){this.state.numInstances=e}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&=(this._buffer.delete(),null),ku.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&this.device.type!==`webgpu`?null:this.state.externalBuffer||this._buffer}getValue(e=this.id,t=null){let n={};if(this.state.constant){let r=this.value;if(this.device.type===`webgpu`&&this._buffer)n[e]=this._buffer;else if(t){let i=Om(this.getAccessor(),t),a=i.offset/r.BYTES_PER_ELEMENT,o=i.size||this.size;n[e]=r.subarray(a,a+o)}else n[e]=r}else n[e]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?n[`${e}64Low`]=n[e]:n[`${e}64Low`]=new Float32Array(this.size)),n}_getBufferLayout(e=this.id,t=null){let n=this.getAccessor(),r=[],i={name:this.id,byteStride:this.device.type===`webgpu`&&this.state.constant?0:X(n)};if(this.doublePrecision){let i=km(n,t||{});r.push(Em(e,{...n,...i.high},this.device.type),Em(`${e}64Low`,{...n,...i.low},this.device.type))}else if(t){let i=Om(n,t);r.push(Em(e,{...n,...i},this.device.type))}else r.push(Em(e,n,this.device.type));return i.attributes=r.filter(Boolean),i}setAccessor(e){this.state.bufferAccessor=e}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let e=null;if(this.state.constant&&this.value){let t=Array.from(this.value);e=[t,t]}else{let{value:t,numInstances:n,size:r}=this,i=n*r;if(t&&i&&t.length>=i){let n=Array(r).fill(1/0),a=Array(r).fill(-1/0);for(let e=0;e<i;)for(let i=0;i<r;i++){let r=t[e++];r<n[i]&&(n[i]=r),r>a[i]&&(a[i]=r)}e=[n,a]}}return this.state.bounds=e,e}setData(e){let{state:t}=this,n;n=ArrayBuffer.isView(e)?{value:e}:e instanceof p?{buffer:e}:e;let r={...this.settings,...n};if(ArrayBuffer.isView(n.value)){if(!n.type)if(this.doublePrecision&&n.value instanceof Float64Array)r.type=`float32`;else{let e=Tm(n.value);r.type=r.normalized?e.replace(`int`,`norm`):e}r.bytesPerElement=n.value.BYTES_PER_ELEMENT,r.stride=X(r)}if(t.bounds=null,n.constant){let e=n.value;if(e=this._normalizeValue(e,[],0),this.settings.normalized&&(e=this.normalizeConstant(e)),!(!t.constant||!this._areValuesEqual(e,this.value)))return!1;t.externalBuffer=null,t.constant=!0,this.value=ArrayBuffer.isView(e)?e:new Float32Array(e)}else if(n.buffer)t.externalBuffer=n.buffer,t.constant=!1,this.value=n.value||null;else if(n.value){this._checkExternalBuffer(n);let e=n.value,i=e;t.externalBuffer=null,t.constant=!1,this.value=e,this._shouldSplitDoublePrecisionValue(i)&&(i=Ru(i,r),e instanceof Float32Array&&(r.stride=r.size*2*Float32Array.BYTES_PER_ELEMENT));let{buffer:a}=this,o=X(r),s=(r.vertexOffset||0)*o;if(this.settings.isIndexed){let e=this.settings.defaultType;i.constructor!==e&&(i=new e(i))}let c=i.byteLength+s+o*2;(!a||a.byteLength<c)&&(a=this._createBuffer(c)),a.write(i,s)}return this.setAccessor(r),!0}updateSubBuffer(e={}){this.state.bounds=null;let t=this.value,{startOffset:n=0,endOffset:r}=e,i=this._shouldSplitDoublePrecisionValue(t);this.buffer.write(i?Ru(t,{size:this.size,startIndex:n,endIndex:r}):t.subarray(n,r),n*(i?8:t.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(e,t=!1){let{state:n}=this,r=n.allocatedValue,i=ku.allocate(r,e+1,{size:this.size,type:this.settings.defaultType,copy:t});this.value=i;let a=this._shouldSplitDoublePrecisionValue(i),o=a&&i instanceof Float32Array?{...this.settings,stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(o);let{byteOffset:s}=this,{buffer:c}=this,l=i.byteLength*(a&&i instanceof Float32Array?2:1);return(!c||c.byteLength<l+s)&&(c=this._createBuffer(l+s),t&&r&&c.write(this._shouldSplitDoublePrecisionValue(r)?Ru(r,this):r,s)),n.allocatedValue=i,n.constant=!1,n.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(e){return!!(this.doublePrecision&&(e instanceof Float64Array||this.device.type===`webgpu`&&e instanceof Float32Array))}_checkExternalBuffer(e){let{value:t}=e;if(!ArrayBuffer.isView(t))throw Error(`Attribute ${this.id} value is not TypedArray`);let n=this.settings.defaultType,r=!1;if(this.doublePrecision&&(r=t.BYTES_PER_ELEMENT<4),r)throw Error(`Attribute ${this.id} does not support ${t.constructor.name}`);!(t instanceof n)&&this.settings.normalized&&!(`normalized`in e)&&P.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(e){switch(this.settings.type){case`snorm8`:return new Float32Array(e).map(e=>(e+128)/255*2-1);case`snorm16`:return new Float32Array(e).map(e=>(e+32768)/65535*2-1);case`unorm8`:return new Float32Array(e).map(e=>e/255);case`unorm16`:return new Float32Array(e).map(e=>e/65535);default:return e}}_normalizeValue(e,t,n){let{defaultValue:r,size:i}=this.settings;if(Number.isFinite(e))return t[n]=e,t;if(!e){let e=i;for(;--e>=0;)t[n+e]=r[e];return t}switch(i){case 4:t[n+3]=Number.isFinite(e[3])?e[3]:r[3];case 3:t[n+2]=Number.isFinite(e[2])?e[2]:r[2];case 2:t[n+1]=Number.isFinite(e[1])?e[1]:r[1];case 1:t[n+0]=Number.isFinite(e[0])?e[0]:r[0];break;default:let a=i;for(;--a>=0;)t[n+a]=Number.isFinite(e[a])?e[a]:r[a]}return t}_areValuesEqual(e,t){if(!e||!t)return!1;let{size:n}=this;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}_createBuffer(e){this._buffer&&this._buffer.destroy();let{isIndexed:t,type:n}=this.settings,r=this.device.type===`webgpu`&&!t?p.VERTEX|p.STORAGE|p.COPY_DST|p.COPY_SRC:(t?p.INDEX:p.VERTEX)|p.COPY_DST;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:r,indexType:t?n:void 0,byteLength:e}),this._buffer}},jm=[],Mm=[];function Nm(e,t=0,n=1/0){let r=jm,i={index:-1,data:e,target:[]};return e?typeof e[Symbol.iterator]==`function`?r=e:e.length>0&&(Mm.length=e.length,r=Mm):r=jm,(t>0||Number.isFinite(n))&&(r=(Array.isArray(r)?r:Array.from(r)).slice(t,n),i.index=t-1),{iterable:r,objectInfo:i}}function Pm(e){return e&&e[Symbol.asyncIterator]}function Fm(e,t){let{size:n,stride:r,offset:i,startIndices:a,nested:o}=t,s=e.BYTES_PER_ELEMENT,c=r?r/s:n,l=i?i/s:0,u=Math.floor((e.length-l)/c);return(t,{index:r,target:i})=>{if(!a){let t=r*c+l;for(let r=0;r<n;r++)i[r]=e[t+r];return i}let s=a[r],d=a[r+1]||u,f;if(o){f=Array(d-s);for(let t=s;t<d;t++){let r=t*c+l;i=Array(n);for(let t=0;t<n;t++)i[t]=e[r+t];f[t-s]=i}}else if(c===n)f=e.subarray(s*n+l,d*n+l);else{f=new e.constructor((d-s)*n);let t=0;for(let r=s;r<d;r++){let i=r*c+l;for(let r=0;r<n;r++)f[t++]=e[i+r]}}return f}}var Im=[],Lm=[[0,1/0]];function Rm(e,t){if(e===Lm||(t[0]<0&&(t[0]=0),t[0]>=t[1]))return e;let n=[],r=e.length,i=0;for(let a=0;a<r;a++){let r=e[a];r[1]<t[0]?(n.push(r),i=a+1):r[0]>t[1]?n.push(r):t=[Math.min(r[0],t[0]),Math.max(r[1],t[1])]}return n.splice(i,0,t),n}var zm={interpolation:{duration:0,easing:e=>e},spring:{stiffness:.05,damping:.5}};function Bm(e,t){if(!e)return null;Number.isFinite(e)&&(e={type:`interpolation`,duration:e});let n=e.type||`interpolation`;return{...zm[n],...t,...e,type:n}}var Vm=class extends Am{constructor(e,t){super(e,t,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:Lm}),this.constant=!1,this.settings.update=t.update||(t.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(e){this.state.startIndices=e}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:e=!1}={}){let t=this.state.needsRedraw;return this.state.needsRedraw=t&&!e,t}layoutChanged(){return this.state.layoutChanged}setAccessor(e){var t;(t=this.state).layoutChanged||(t.layoutChanged=!Dm(e,this.getAccessor())),super.setAccessor(e)}getUpdateTriggers(){let{accessor:e}=this.settings;return[this.id].concat(typeof e!=`function`&&e||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(e){if(!e||!this.supportsTransition())return null;let{accessor:t}=this.settings,n=this.settings.transition;return Bm(Array.isArray(t)?e[t.find(t=>e[t])]:e[t],n)}setNeedsUpdate(e=this.id,t){if(this.state.needsUpdate=this.state.needsUpdate||e,this.setNeedsRedraw(e),t){let{startRow:e=0,endRow:n=1/0}=t;this.state.updateRanges=Rm(this.state.updateRanges,[e,n])}else this.state.updateRanges=Lm}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=Im}setNeedsRedraw(e=this.id){this.state.needsRedraw=this.state.needsRedraw||e}allocate(e){let{state:t,settings:n}=this;if(n.noAlloc)return!1;if(n.update){let n=this.isConstant;return super.allocate(e,t.updateRanges!==Lm),t.layoutChanged||=n&&this.device.type===`webgpu`,!0}return!1}updateBuffer({numInstances:e,data:t,props:n,context:r}){if(!this.needsUpdate())return!1;let{state:{updateRanges:i},settings:{update:a,noAlloc:o}}=this,s=!0;if(a){for(let[o,s]of i)a.call(r,this,{data:t,startRow:o,endRow:s,props:n,numInstances:e});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let e=this.value;this.value=null,this.setConstantValue(r,e)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[t,n]of i){let r=Number.isFinite(t)?this.getVertexOffset(t):0,i=Number.isFinite(n)?this.getVertexOffset(n):o||!Number.isFinite(e)?this.value.length:e*this.size;super.updateSubBuffer({startOffset:r,endOffset:i})}this._checkAttributeArray()}else s=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),s}setConstantValue(e,t){var n;if(t===void 0||typeof t==`function`)return!1;let r=this.isConstant,i=this.settings.transform&&e?this.settings.transform.call(e,t):t,a=this.settings.defaultType;this.state.constantValue=this._normalizeValue(i,new a(this.size),0);let o=this.setData({constant:!0,value:i});if(this.device.type===`webgpu`){let e=this.state.constantValue;this.doublePrecision&&(e instanceof Float32Array||e instanceof Float64Array)&&(e=Ru(e,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}));let t=this._buffer;(!t||t.byteLength<e.byteLength)&&(t=this._createBuffer(e.byteLength)),t.write(e),(n=this.state).layoutChanged||(n.layoutChanged=!r),this.constant=!1}return o&&this.setNeedsRedraw(),this.clearNeedsUpdate(),!0}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(e){let{state:t}=this;return e?(this.clearNeedsUpdate(),t.lastExternalBuffer===e?!0:(t.lastExternalBuffer=e,this.setNeedsRedraw(),this.setData(e),!0)):(t.lastExternalBuffer=null,!1)}setBinaryValue(e,t=null){let{state:n,settings:r}=this;if(!e)return n.binaryValue=null,n.binaryAccessor=null,!1;if(r.noAlloc)return!1;if(n.binaryValue===e)return this.clearNeedsUpdate(),!0;if(n.binaryValue=e,this.setNeedsRedraw(),r.transform||t!==this.startIndices){ArrayBuffer.isView(e)&&(e={value:e});let i=e;Y(ArrayBuffer.isView(i.value),`invalid ${r.accessor}`);let a=!!i.size&&i.size!==this.size;return n.binaryAccessor=Fm(i.value,{size:i.size||this.size,stride:i.stride,offset:i.offset,startIndices:t,nested:a}),!1}return this.clearNeedsUpdate(),this.setData(e),!0}getVertexOffset(e){let{startIndices:t}=this;return(t?e<t.length?t[e]:this.numInstances:e)*this.size}getValue(){let e=this.settings.shaderAttributes,t=super.getValue();if(!e)return t;for(let n in e)Object.assign(t,super.getValue(n,e[n]));return t}getBufferLayout(e){this.state.layoutChanged=!1;let t=this.settings.shaderAttributes,n=super._getBufferLayout(),{stepMode:r}=this.settings;if(r===`dynamic`?n.stepMode=e?e.isInstanced?`instance`:`vertex`:`instance`:n.stepMode=r??`vertex`,!t)return n;for(let e in t){let r=super._getBufferLayout(e,t[e]);n.attributes.push(...r.attributes)}return n}_autoUpdater(e,{data:t,startRow:n,endRow:r,props:i,numInstances:a}){let{settings:o,state:s,value:c,size:l,startIndices:u}=e,{accessor:d,transform:f}=o,p=s.binaryAccessor||(typeof d==`function`?d:i[d]);Y(typeof p==`function`,`accessor "${d}" is not a function`);let m=e.getVertexOffset(n),{iterable:h,objectInfo:g}=Nm(t,n,r);for(let t of h){g.index++;let n=p(t,g);if(f&&(n=f.call(this,n)),u){let t=(g.index<u.length-1?u[g.index+1]:a)-u[g.index];if(n&&Array.isArray(n[0])){let t=m;for(let r of n)e._normalizeValue(r,c,t),t+=l}else n&&n.length>l?c.set(n,m):(e._normalizeValue(n,g.target,0),Lf({target:c,source:g.target,start:m,count:t}));m+=t*l}else e._normalizeValue(n,c,m),m+=l}}_validateAttributeUpdaters(){let{settings:e}=this;if(!(e.noAlloc||typeof e.update==`function`))throw Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:e}=this,t=Math.min(4,this.size);if(e&&e.length>=t){let n=!0;switch(t){case 4:n&&=Number.isFinite(e[3]);case 3:n&&=Number.isFinite(e[2]);case 2:n&&=Number.isFinite(e[1]);case 1:n&&=Number.isFinite(e[0]);break;default:n=!1}if(!n)throw Error(`Illegal attribute generated for ${this.id}`)}}},Hm=class e{gpuDataEvaluators;format;length;id;_gpuVector;_ownsGPUDataEvaluators;_destroyed=!1;static fromGPUVector(t){if(t.bufferLayout)throw Error(`GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${t.name}"`);if(t.data.length===0)throw Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${t.name}"`);return new e({id:t.name,gpuDataEvaluators:t.data.map(e=>n.fromGPUData(e,{id:t.name})),gpuVector:t,format:t.format})}static fromGPUDataEvaluators(t,n={}){return new e({id:n.id,gpuDataEvaluators:t,format:n.format})}constructor({id:e,gpuDataEvaluators:t,gpuVector:n,format:r}){if(t.length===0)throw Error(`GPUVectorEvaluator requires at least one GPUData evaluator`);Um(t),this.id=e,this.gpuDataEvaluators=t,this.format=r??t[0].format,this.length=t.reduce((e,t)=>e+t.length,0),this._gpuVector=n,this._ownsGPUDataEvaluators=!n}get evaluated(){return!!this._gpuVector}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}mapGPUData(t){return e.fromGPUDataEvaluators(this.gpuDataEvaluators.map((e,n)=>t(e,n)),{id:this.id})}async evaluate(e,n={}){if(n.scope)throw Error(`Deferred-submission vector evaluation is outside this proof of concept`);if(this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let r=await Promise.all(this.gpuDataEvaluators.map(t=>t.evaluate(e,n))),i=r[0],a=r.map(Wm),o=n.format??this.format??i.format;return this._gpuVector=new t({type:`data`,name:n.name??this.id??`vector`,format:o,data:a,stride:i.stride,byteStride:i.byteStride,rowByteLength:i.rowByteLength,bufferLayout:i.bufferLayout}),this._gpuVector}evaluateSync(e,n={}){if(n.scope)throw Error(`Use scope.evaluate() for deferred submission`);if(this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let r=this.gpuDataEvaluators.map(t=>t.evaluateSync(e,n)),i=r[0],a=r.map(Wm),o=n.format??this.format??i.format;return this._gpuVector=new t({type:`data`,name:n.name??this.id??`vector`,format:o,data:a,stride:i.stride,byteStride:i.byteStride,rowByteLength:i.rowByteLength,bufferLayout:i.bufferLayout}),this._gpuVector}destroy(){if(this._ownsGPUDataEvaluators)for(let e of this.gpuDataEvaluators)e.destroy();this._gpuVector=void 0,this._destroyed=!0}toString(){return this.id??this.constructor.name}};function Um(e){let t=e[0];for(let n of e.slice(1))if(n.type!==t.type||n.size!==t.size||n.normalized!==t.normalized||n.format!==t.format)throw Error(`GPUVectorEvaluator requires matching GPUData evaluator layouts`)}function Wm(e){let[t,...n]=e.data;if(!t||n.length>0)throw Error(`GPUVectorEvaluator requires one GPUData chunk for "${e.name}"`);return t}function Gm({elementWise:e,func:t,inputs:n,output:r,outputBuffer:i}){let a=Array.isArray(n)?n:Object.values(n);for(let e of a)if(!e.value)throw Error(`${e} does not have CPU value`);let o=r.length,s=r.size,c=new r.ValueType(o*s);for(let n=0;n<o;n++){let r=a.map(e=>Z(e,n));if(e)for(let e=0;e<s;e++)c[n*s+e]=t.apply(null,r.map(t=>t[e]));else t.call(null,c.subarray(n*s,n*s+s),...r)}let l=r.ValueType.BYTES_PER_ELEMENT,u=r.offset/l,d=r.stride/l,f=s,p=c;if(u!==0||d!==f){p=new r.ValueType(u+r.byteLength/l);for(let e=0;e<o;e++){let t=e*f,n=u+e*d,r=c.subarray(t,t+s);p.set(r,n),i.write(r,n*l)}}else i.write(c);return{success:!0,value:p}}function Z(e,t){let n=e.value,r=e.size,i=e.offset/e.ValueType.BYTES_PER_ELEMENT,a=e.stride/e.ValueType.BYTES_PER_ELEMENT,o=i+(e.isConstant?0:t)*a,s=n.slice(o,o+r);if(!e.normalized)return s;let c=new Float32Array(r);for(let t=0;t<r;t++)c[t]=Km(s[t],e.type);return c}function Km(e,t){switch(t){case`uint8`:return e/255;case`uint16`:return e/65535;case`uint32`:return e/4294967295;case`sint8`:return Math.max(e/127,-1);case`sint16`:return Math.max(e/32767,-1);case`sint32`:return Math.max(e/2147483647,-1);case`float32`:return e;default:throw Error(`Unsupported normalized source type ${t}`)}}var qm=({inputs:e,output:t,target:n})=>{for(let t of Object.values(e.namedInputs))if(!t.value)throw Error(`${t} does not have CPU value`);let r=new t.ValueType(t.length*t.size);for(let n=0;n<t.length;n++){let i=Object.fromEntries(Object.entries(e.namedInputs).map(([e,t])=>[e,Z(t,n)]));for(let a=0;a<t.size;a++)r[n*t.size+a]=Jm(e.expression,i,a)}return n.write(r),{success:!0,value:r}};function Jm(e,t,n){switch(e.kind){case`input`:{let r=t[e.name];return n<r.length?r[n]:r.length===1?r[0]:0}case`literal`:return Array.isArray(e.value)?e.value[n]??0:e.value;case`call`:{Ym(e.op,e.args.length);let r=e.args.map(e=>Jm(e,t,n));switch(e.op){case`add`:return r[0]+r[1];case`subtract`:return r[0]-r[1];case`multiply`:return r[0]*r[1];case`divide`:return r[0]/r[1];case`pow`:return r[0]**+r[1];case`sqrt`:return Math.sqrt(r[0]);case`abs`:return Math.abs(r[0]);case`sin`:return Math.sin(r[0]);case`cos`:return Math.cos(r[0]);case`tan`:return Math.tan(r[0]);case`exp`:return Math.exp(r[0]);case`log`:return Math.log(r[0]);default:{let t=e.op;throw Error(`Unsupported arithmetic op ${t}`)}}}default:{let t=e;throw Error(`Unsupported expression node ${t.kind}`)}}}function Ym(e,t){let n=a[e].arity;if(t!==n)throw Error(`Arithmetic op '${e}' expects ${n} args, got ${t}`)}var Xm=({inputs:e,output:t,target:n})=>{let{sourceValues:r}=e;if(!r.value)throw Error(`${r} does not have CPU value`);let i=new t.ValueType(t.length*t.size);if(r.length===0)return{success:!1,error:Error(`${r} is empty`)};for(let e=0;e<r.size;e++){let n=Z(r,0)[e],a=e*t.size,o=a+1;i[a]=n,i[o]=n;for(let t=1;t<r.length;t++){let n=Z(r,t)[e];n<i[a]&&(i[a]=n),n>i[o]&&(i[o]=n)}}return n.write(i),{success:!0,value:i}},Zm=({inputs:e,output:t,target:n})=>Gm({func:(e,t)=>{let n=e.length/2,r=new Float64Array(t.buffer);for(let t=0;t<n;t++){let i=r[t];e[t]=Math.fround(i),e[t+n]=i-e[t]}return e},inputs:e,output:t,outputBuffer:n}),Qm=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=r.value,o=i.value;if(!a)throw Error(`${r} does not have CPU value`);if(!o)throw Error(`${i} does not have CPU value`);let s=new t.ValueType(t.length*t.size),c=Array(t.size).fill(0);for(let e=0;e<t.length;e++){let n=Z(r,e),a=Number(n[0]),o=$m(a,i.length)?Z(i,a):c;s.set(o,e*t.size)}return n.write(s),{success:!0,value:s}};function $m(e,t){return Number.isInteger(e)&&e>=0&&e<t}var eh=({inputs:e,output:t,target:n})=>Gm({func:(e,...t)=>{let n=0;for(let r of t)e.set(r,n),n+=r.length},inputs:e,output:t,outputBuffer:n}),th=({inputs:e,output:t,target:n})=>{let{x:r,y:i}=e,a=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=Z(r,e),n=Z(i,e),o=0;for(let e=0;e<r.size;e++)o+=t[e]*n[e];a[e]=o}return n.write(a),{success:!0,value:a}},nh=({inputs:e,output:t,target:n})=>{let{x:r,y:i}=e,a=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=Z(r,e),n=Z(i,e),o=1;for(let e=0;e<r.size;e++)if(t[e]!==n[e]){o=0;break}a[e]=o}return n.write(a),{success:!0,value:a}},rh=({inputs:e,output:t,target:n})=>{let{x:r}=e,i=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=Z(r,e),n=0;for(let e=0;e<r.size;e++)n+=t[e]*t[e];i[e]=Math.sqrt(n)}return n.write(i),{success:!0,value:i}},ih=async({inputs:e,output:t,target:n})=>{let{segments:r,vertexCount:i}=e,a=r.value;if(!a)throw Error(`${r} does not have CPU value`);ah(a,r,i);let o=new t.ValueType(t.length*t.size),s=0;for(let e=0;e<i;e++){for(;s+1<r.length&&a[oh(r,s+1)]<=e;)s++;let n=a[oh(r,s)],i=e*t.size;o[i]=s,o[i+1]=e-n}return n.write(o),{success:!0,value:o}};function ah(e,t,n){if(t.length<1)throw Error(`segmentedMap segments must contain at least one segment start`);let r=0;for(let n=0;n<t.length;n++){let i=e[oh(t,n)];if(n===0&&i!==0)throw Error(`segmentedMap segments must start at 0, got ${i}`);if(n>0&&i<r)throw Error(`segmentedMap segments must be non-decreasing, got ${i} after ${r}`);r=i}if(r>n)throw Error(`segmentedMap last segment start must be <= vertexCount, got ${r} > ${n}`)}function oh(e,t){return e.offset/e.ValueType.BYTES_PER_ELEMENT+t*(e.stride/e.ValueType.BYTES_PER_ELEMENT)}var sh=async({inputs:e,output:t,target:n})=>{let{condition:r,whenTrue:i,whenFalse:a}=e,o=new t.ValueType(t.length*t.size);for(let e=0;e<t.length;e++){let n=Z(r,e),s=Z(i,e),c=Z(a,e);for(let l=0;l<t.size;l++){let u=ch(n,r.size,l);o[e*t.size+l]=u===0?ch(c,a.size,l):ch(s,i.size,l)}}return n.write(o),{success:!0,value:o}};function ch(e,t,n){return n<t?e[n]:t===1?e[0]:0}var lh=({inputs:e,output:t,target:n})=>{let r=new t.ValueType(t.length);for(let n=0;n<t.length;n++)r[n]=e.start+n*e.step;return n.write(r),{success:!0,value:r}},uh=({inputs:e,output:t,target:n})=>{let{columns:r}=e;return Gm({func:(e,t)=>{for(let n=0;n<r.length;n++)e[n]=t[r[n]]},inputs:{x:e.x},output:t,outputBuffer:n})},dh=le({arithmetic:()=>qm,castData:()=>te,convertColors:()=>ie,dot:()=>th,equalAll:()=>nh,extent:()=>Xm,fround:()=>Zm,gather:()=>Qm,interleave:()=>eh,length:()=>rh,segmentedMap:()=>ih,select:()=>sh,sequence:()=>lh,swizzle:()=>uh}),fh=new class{_modules={cpu:dh};add(e,t){let n=this._modules[e];if(typeof t.then==`function`){let r=Promise.all([Promise.resolve(n||{}),t]).then(([e,t])=>({...e,...t}));return this._modules[e]=r,r.then(t=>{this._modules[e]=t}).catch(t=>{u.error(`Failed to register ${e} backend: ${t}`)()}),r}if(n&&typeof n.then==`function`){let r=Promise.resolve(n).then(e=>({...e,...t})).then(t=>(this._modules[e]=t,t)).catch(t=>{throw u.error(`Failed to register ${e} backend: ${t}`)(),t});return this._modules[e]=r,r}let r={...n||{},...t};return this._modules[e]=r,Promise.resolve(r)}async get(e,t){let n=this._modules[e];if(!n)if(e===`webgl`)n=this.add(`webgl`,mm(()=>import(`./webgl-D8jmobwM.js`),__vite__mapDeps([7,3,1,8,9,6,10,4,11,12])));else if(e===`webgpu`)n=this.add(`webgpu`,mm(()=>import(`./webgpu-D3dW6ooO.js`),__vite__mapDeps([13,1,8,9,6,14,12])));else throw Error(`${e} backend not registered`);let r=(await n)[t];if(typeof r!=`function`&&(e===`webgl`?r=(await mm(()=>import(`./webgl-D8jmobwM.js`),__vite__mapDeps([7,3,1,8,9,6,10,4,11,12])))[t]:e===`webgpu`&&(r=(await mm(()=>import(`./webgpu-D3dW6ooO.js`),__vite__mapDeps([13,1,8,9,6,14,12])))[t])),typeof r!=`function`)throw Error(`${e} backend does not implement ${t}`);return r}getSync(e,t){let n=this._modules[e];if(!n)throw Error(`${e} backend not registered`);if(typeof n.then==`function`)throw Error(`${e} backend is not loaded yet`);let r=n[t];if(typeof r!=`function`)throw Error(`${e} backend does not implement ${t}`);return r}clear(){this._modules={}}},ph=class{inputs;dependencies;constructor(e){this.inputs=e,this.dependencies=Array.from(e instanceof Array?e:Object.values(e)).filter(e=>e instanceof n)}async execute(e,t,n){n||await this._resolveDependencies(e);let r=await fh.get(this._getHandlerRegistry(e,n),this.name);if(n&&(e.type!==`webgpu`||!r.supportsEvaluationScope))throw Error(`${this.name} does not support deferred-submission evaluation`);return n&&await this._resolveDependencies(e,n),await this._executeWithHandler(r,t,n)}executeSync(e,t){this._resolveDependenciesSync(e);let n=this._executeWithHandler(fh.getSync(this._getHandlerRegistry(e),this.name),t);if(mh(n))throw Error(`${this.name} returned a Promise in executeSync()`);return n}shouldExecuteOnCPU(){return this.output.length<=1&&Array.from(this.dependencies).every(e=>!!e.value)}_getHandlerRegistry(e,t){return!t&&this.shouldExecuteOnCPU()?`cpu`:e.type}async _resolveDependencies(e,t){for(let n of this.dependencies)await n.evaluate(e,{scope:t});if(this._getHandlerRegistry(e,t)===`cpu`||e.type===`null`)for(let e of this.dependencies)await e.ensureCPUValue()}_resolveDependenciesSync(e){for(let t of this.dependencies)t.evaluateSync(e);if(this._getHandlerRegistry(e)===`cpu`||e.type===`null`)for(let e of this.dependencies)e.ensureCPUValueSync()}_executeWithHandler(e,t,n){return e({scope:n,device:t.device,inputs:this.inputs,output:this.output,target:t})}};function mh(e){return typeof e?.then==`function`}function hh(...e){let t=gh(e.map(e=>e.type));return t[0]!==`f`&&e.some(e=>e.normalized)&&(t=`float32`),{isConstant:e.every(e=>e.isConstant),type:t,size:e.reduce((e,t)=>Math.max(e,t.size),0),length:e.reduce((e,t)=>Math.max(e,t.length),0)}}function gh(e){let t=0,n=0;for(let r of e){if(r[0]===`f`)return`float32`;let e=r.endsWith(`8`)?8:r.endsWith(`6`)?16:32;r[0]===`u`?t=Math.max(t,e):n=Math.max(n,e)}return t&&!n?`uint${t}`:n&&t<32?`sint${Math.max(n,t*2)}`:`float32`}var _h=class extends ph{name=`interleave`;output;constructor(e){super(e);let{isConstant:t,type:r,length:i}=hh(...e);this.output=new n({isConstant:t,type:r,size:e.reduce((e,t)=>e+t.size,0),length:i,source:this})}toString(){return`_${this.inputs.join(`_`)}_`}};function vh(...e){if(e.length===0)throw Error(`interleave() requires at least one input`);return e.length===1?r(e[0]):new _h(e.map(r)).output}function yh(e,t){let n=xh(t);for(let t of n)t.evaluateSync(e);return bh(n),t}function bh(e){let t=new Set(e.flatMap(Th)),n=new Set;for(let t of e)wh(t,n);for(let e of n)e.evaluated&&!t.has(e.buffer)&&e.destroy()}function xh(e){let t=new Set;return Sh(e,t,new Set),Array.from(t)}function Sh(e,t,n){if(Eh(e)){t.add(e);return}if(!(!e||typeof e!=`object`||n.has(e))){if(n.add(e),Array.isArray(e)){for(let r of e)Sh(r,t,n);return}if(Ch(e))for(let r of Object.values(e))Sh(r,t,n)}}function Ch(e){let t=Object.getPrototypeOf(e);return t===Object.prototype||t===null}function wh(e,t){if(e instanceof Hm){for(let n of e.gpuDataEvaluators)wh(n,t);return}let r=e.source;if(r){if(r instanceof n){t.has(r)||(t.add(r),wh(r,t));return}for(let e of r.dependencies)t.has(e)||(t.add(e),wh(e,t))}}function Th(e){return e instanceof n?[e.buffer]:e.gpuVector.data.map(e=>e.buffer instanceof i?e.buffer.buffer:e.buffer)}function Eh(e){return e instanceof n||e instanceof Hm}var Dh=class{constructor(e,{id:t,isTransitionAttribute:n}){this.packedBuffers={},this.device=e,this.id=t,this.isTransitionAttribute=n,this.device.type===`webgpu`&&fh.add(`webgpu`,{interleave:oe})}hasGroups(e){return this.device.type===`webgpu`&&Object.values(e).some(e=>!!e.settings.bufferGroup)}finalize(){for(let e of Object.values(this.packedBuffers))e.packed.destroy();this.packedBuffers={}}getBufferLayouts(e,t){let n=this._getPackedGroups(e,t,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(e,n,t)}getBindings(e,t,n,r){let i=this._getPackedGroups(e,n,{requireValues:!0,excludeAttributes:r}),a={},o=new Set;for(let e of i.values()){let n=!this.packedBuffers[e.id]||e.attributes.some(e=>!!t[e.id]);a[e.id]=this._getPackedBuffer(e,n);for(let t of e.attributes)o.add(t.id)}return{bufferLayouts:this._getBufferLayouts(e,i,n).filter(t=>!r[t.name]&&!e[t.name]?.settings.isIndexed),buffers:a,groupedAttributeIds:o}}_getPackedGroups(e,t,{requireValues:n,excludeAttributes:r}){let i=new Map;for(let t of Object.values(e)){let e=t.settings.bufferGroup;if(!e)continue;let n=i.get(e)||[];n.push(t),i.set(e,n)}let a=new Map;for(let[e,o]of i){let i=this._getPackedGroup(e,o,t,n,r);i&&a.set(e,i)}return a}_getPackedGroup(e,t,n,r,i){if(t.length<2)return null;let a=t.map(e=>e.getBufferLayout(n)),o=a[0].stepMode,s=Math.max(1,t[0].numInstances),c=r&&t.every(e=>e.isConstant);for(let e=0;e<t.length;e++){let n=t[e],c=n.getAccessor(),l=c.size*c.bytesPerElement;if(i[n.id]||n.settings.isIndexed||n.settings.noAlloc||n.doublePrecision||this.isTransitionAttribute(n.id)||a[e].stepMode!==o||n.numInstances!==t[0].numInstances||(c.offset||0)!==0||(c.vertexOffset||0)!==0||X(c)!==l||r&&(n.isConstant?!n.getConstantValue()||n.getConstantValue().byteLength<l:!ArrayBuffer.isView(n.value)||n.value.byteLength<s*l))return null}let l={},u=[],d=0;for(let e=0;e<t.length;e++){let n=t[e];d=Oh(d),l[n.id]=d;for(let t of a[e].attributes||[])u.push({...t,byteOffset:d+(t.byteOffset||0)});d+=X(n.getAccessor())}return d=Oh(d),{id:e,attributes:t,byteStride:d,byteOffsets:l,rowCount:s,layout:{name:e,byteStride:c?0:d,stepMode:o,attributes:u}}}_getBufferLayouts(e,t,n){let r=[],i=new Set,a=new Set;for(let e of t.values())for(let t of e.attributes)a.add(t.id);for(let o of Object.values(e)){let e=o.settings.bufferGroup,s=e&&t.get(e);s&&a.has(o.id)?i.has(s.id)||(r.push(s.layout),i.add(s.id)):r.push(o.getBufferLayout(n))}return r}_getPackedBuffer(e,t){let n=JSON.stringify({byteStride:e.layout.byteStride,attributes:e.layout.attributes}),r=this.packedBuffers[e.id];if((!r||r.layoutKey!==n)&&(t=!0),t){r&&(r.packed.destroy(),delete this.packedBuffers[e.id]);let t=this._interleavePackedGroup(e);return this.packedBuffers[e.id]={packed:t,layoutKey:n},t.buffer}if(!r)throw Error(`Attribute buffer group ${e.id} has no packed buffer`);return r.packed.buffer}_interleavePackedGroup(e){let t=vh(...e.attributes.map(t=>this._getInterleaveInput(e,t)));return yh(this.device,t),t}_getInterleaveInput(e,t){let r=X(t.getAccessor()),i=e.byteOffsets[t.id];if(kh(`${e.id}.${t.id} rowByteLength`,r),kh(`${e.id}.${t.id} groupByteOffset`,i),t.isConstant){let i=t.getConstantValue();if(!i)throw Error(`Attribute group ${e.id} is missing constant value ${t.id}`);return kh(`${e.id}.${t.id} constant byteOffset`,i.byteOffset),new n({id:t.id,type:`uint32`,size:r/4,isConstant:!0,value:new Uint32Array(i.buffer,i.byteOffset,r/Uint32Array.BYTES_PER_ELEMENT)})}let a=t.getBuffer(),o=t.byteOffset,s=t.getAccessor().stride||r;if(kh(`${e.id}.${t.id} byteOffset`,o),kh(`${e.id}.${t.id} stride`,s),!a)throw Error(`Attribute group ${e.id} cannot interleave missing buffer ${t.id}`);return new n({id:t.id,type:`uint32`,size:r/4,offset:o,stride:s,length:e.rowCount,buffer:a})}};function Oh(e){return Math.ceil(e/4)*4}function kh(e,t){if(t%4!=0)throw Error(`Attribute buffer groups require 32-bit alignment: ${e}=${t}`)}function Ah(e){let{source:t,target:n,start:r=0,size:i,getData:a}=e,o=e.end||n.length,s=t.length,c=o-r;if(s>c){n.set(t.subarray(0,c),r);return}if(n.set(t,r),!a)return;let l=s;for(;l<c;){let e=a(l,t);for(let t=0;t<i;t++)n[r+l]=e[t]||0,l++}}function jh({source:e,target:t,size:n,getData:r,sourceStartIndices:i,targetStartIndices:a}){if(!i||!a)return Ah({source:e,target:t,size:n,getData:r}),t;let o=0,s=0,c=r&&((e,t)=>r(e+s,t)),l=Math.min(i.length,a.length);for(let r=1;r<l;r++){let l=i[r]*n,u=a[r]*n;Ah({source:e.subarray(o,l),target:t,start:s,end:u,size:n,getData:c}),o=l,s=u}return s<t.length&&Ah({source:[],target:t,start:s,size:n,getData:c}),t}function Mh(e){let{device:t,settings:n,value:r}=e,i=new Vm(t,n);return i.setData({value:r instanceof Float64Array?new Float64Array:new Float32Array,normalized:n.normalized}),i}function Nh(e){switch(e){case 1:return`float`;case 2:return`vec2`;case 3:return`vec3`;case 4:return`vec4`;default:throw Error(`No defined attribute type for size "${e}"`)}}function Ph(e){switch(e){case 1:return`float32`;case 2:return`float32x2`;case 3:return`float32x3`;case 4:return`float32x4`;default:throw Error(`invalid type size`)}}function Fh(e){e.push(e.shift())}function Ih(e,t){let{settings:n,value:r,size:i}=e,a=e.isDoublePrecisionBuffer?2:1,o=0,{shaderAttributes:s}=e.settings;if(s)for(let e of Object.values(s))o=Math.max(o,e.vertexOffset??0);return(n.noAlloc?r.length:(t+o)*i)*a}function Lh({device:e,source:t,target:n}){return(!n||n.byteLength<t.byteLength)&&(n?.destroy(),n=e.createBuffer({byteLength:t.byteLength,usage:t.usage})),n}function Rh({device:e,buffer:t,attribute:n,fromLength:r,toLength:i,fromStartIndices:a,getData:o=e=>e}){let s=n.isDoublePrecisionBuffer?2:1,c=n.size*s,l=n.byteOffset,u=n.settings.bytesPerElement<4?l/n.settings.bytesPerElement*4:l,d=n.startIndices,f=a&&d,p=n.isConstant;if(!f&&t&&r>=i)return t;let m=n.value instanceof Float64Array?Float32Array:n.value.constructor,h=p?n.value:new m(n.getBuffer().readSyncWebGL(l,i*m.BYTES_PER_ELEMENT).buffer);if(n.settings.normalized&&!p){let e=o;o=(t,r)=>n.normalizeConstant(e(t,r))}let g=p?(e,t)=>o(h,t):(e,t)=>o(h.subarray(e+l,e+l+c),t),_=t?new Float32Array(t.readSyncWebGL(u,r*4).buffer):new Float32Array,v=new Float32Array(i);return jh({source:_,target:v,sourceStartIndices:a,targetStartIndices:d,size:c,getData:g}),(!t||t.byteLength<v.byteLength+u)&&(t?.destroy(),t=e.createBuffer({byteLength:v.byteLength+u,usage:35050})),t.write(v,u),t}var zh=class{constructor({device:e,attribute:t,timeline:n}){this.buffers=[],this.currentLength=0,this.device=e,this.transition=new tp(n),this.attribute=t,this.attributeInTransition=Mh(t),this.currentStartIndices=t.startIndices}get inProgress(){return this.transition.inProgress}start(e,t,n=1/0){this.settings=e,this.currentStartIndices=this.attribute.startIndices,this.currentLength=Ih(this.attribute,t),this.transition.start({...e,duration:n})}update(){let e=this.transition.update();return e&&this.onUpdate(),e}setBuffer(e){let{stride:t}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:e,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:t})}cancel(){this.transition.cancel()}delete(){this.cancel();for(let e of this.buffers)e.destroy();this.buffers.length=0}},Bh=class extends zh{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type=`interpolation`,this.transform=Gh(e,t)}start(e,t){let n=this.currentLength,r=this.currentStartIndices;if(super.start(e,t,e.duration),e.duration<=0){this.transition.cancel();return}let{buffers:i,attribute:a}=this;Fh(i),i[0]=Rh({device:this.device,buffer:i[0],attribute:a,fromLength:n,toLength:this.currentLength,fromStartIndices:r,getData:e.enter}),i[1]=Lh({device:this.device,source:i[0],target:i[1]}),this.setBuffer(i[1]);let{transform:o}=this,s=o.model,c=Math.floor(this.currentLength/a.size);Wh(a)&&(c/=2),s.setVertexCount(c),a.isConstant?(s.setAttributes({aFrom:i[0]}),s.setConstantAttributes({aTo:a.value})):s.setAttributes({aFrom:i[0],aTo:a.getBuffer()}),o.transformFeedback.setBuffers({vCurrent:i[1]})}onUpdate(){let{duration:e,easing:t}=this.settings,{time:n}=this.transition,r=n/e;t&&(r=t(r));let{model:i}=this.transform,a={time:r};i.shaderInputs.setProps({interpolation:a}),this.transform.run({discard:!0})}delete(){super.delete(),this.transform.destroy()}},Vh={name:`interpolation`,vs:`layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,uniformTypes:{time:`f32`}},Hh=`#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,Uh=`#version 300 es
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
`;function Wh(e){return e.isDoublePrecisionBuffer}function Gh(e,t){let n=t.size,r=Nh(n),i=Ph(n),a=t.getBufferLayout();return Wh(t)?new ne(e,{vs:Uh,bufferLayout:[{name:`aFrom`,byteStride:8*n,attributes:[{attribute:`aFrom`,format:i,byteOffset:0},{attribute:`aFrom64Low`,format:i,byteOffset:4*n}]},{name:`aTo`,byteStride:8*n,attributes:[{attribute:`aTo`,format:i,byteOffset:0},{attribute:`aTo64Low`,format:i,byteOffset:4*n}]}],modules:[po,Vh],defines:{ATTRIBUTE_TYPE:r,ATTRIBUTE_SIZE:n},moduleSettings:{},varyings:[`vCurrent`,`vCurrent64Low`],bufferMode:35980,disableWarnings:!0}):new ne(e,{vs:Hh,bufferLayout:[{name:`aFrom`,format:i},{name:`aTo`,format:a.attributes[0].format}],modules:[Vh],defines:{ATTRIBUTE_TYPE:r},varyings:[`vCurrent`],disableWarnings:!0})}var Kh=class extends zh{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type=`spring`,this.texture=Zh(e),this.framebuffer=Qh(e,this.texture),this.transform=Xh(e,t)}start(e,t){let n=this.currentLength,r=this.currentStartIndices;super.start(e,t);let{buffers:i,attribute:a}=this;for(let t=0;t<2;t++)i[t]=Rh({device:this.device,buffer:i[t],attribute:a,fromLength:n,toLength:this.currentLength,fromStartIndices:r,getData:e.enter});i[2]=Lh({device:this.device,source:i[0],target:i[2]}),this.setBuffer(i[1]);let{model:o}=this.transform;o.setVertexCount(Math.floor(this.currentLength/a.size)),a.isConstant?o.setConstantAttributes({aTo:a.value}):o.setAttributes({aTo:a.getBuffer()})}onUpdate(){let{buffers:e,transform:t,framebuffer:n,transition:r}=this,i=this.settings;t.model.setAttributes({aPrev:e[0],aCur:e[1]}),t.transformFeedback.setBuffers({vNext:e[2]});let a={stiffness:i.stiffness,damping:i.damping};t.model.shaderInputs.setProps({spring:a}),t.run({framebuffer:n,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),Fh(e),this.setBuffer(e[1]),this.device.readPixelsToArrayWebGL(n)[0]>0||r.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}},qh={name:`spring`,vs:`layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,uniformTypes:{damping:`f32`,stiffness:`f32`}},Jh=`#version 300 es
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
`,Yh=`#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`;function Xh(e,t){let n=Nh(t.size),r=Ph(t.size);return new ne(e,{vs:Jh,fs:Yh,bufferLayout:[{name:`aPrev`,format:r},{name:`aCur`,format:r},{name:`aTo`,format:t.getBufferLayout().attributes[0].format}],varyings:[`vNext`],modules:[qh],defines:{ATTRIBUTE_TYPE:n},parameters:{depthCompare:`always`,blendColorOperation:`max`,blendColorSrcFactor:`one`,blendColorDstFactor:`one`,blendAlphaOperation:`max`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one`}})}function Zh(e){return e.createTexture({data:new Uint8Array(4),format:`rgba8unorm`,width:1,height:1})}function Qh(e,t){return e.createFramebuffer({id:`spring-transition-is-transitioning-framebuffer`,width:1,height:1,colorAttachments:[t]})}var $h={interpolation:Bh,spring:Kh},eg=class{constructor(e,{id:t,timeline:n}){if(!e)throw Error(`AttributeTransitionManager is constructed without device`);this.id=t,this.device=e,this.timeline=n,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let e in this.transitions)this._removeTransition(e)}update({attributes:e,transitions:t,numInstances:n}){this.numInstances=n||1;for(let n in e){let r=e[n],i=r.getTransitionSetting(t);i&&this._updateAttribute(n,r,i)}for(let n in this.transitions){let r=e[n];(!r||!r.getTransitionSetting(t))&&this._removeTransition(n)}}hasAttribute(e){let t=this.transitions[e];return t&&t.inProgress}getAttributes(){let e={};for(let t in this.transitions){let n=this.transitions[t];n.inProgress&&(e[t]=n.attributeInTransition)}return e}run(){if(this.numInstances===0)return!1;for(let e in this.transitions)this.transitions[e].update()&&(this.needsRedraw=!0);let e=this.needsRedraw;return this.needsRedraw=!1,e}_removeTransition(e){this.transitions[e].delete(),delete this.transitions[e]}_updateAttribute(e,t,n){let r=this.transitions[e],i=!r||r.type!==n.type;if(i){r&&this._removeTransition(e);let a=$h[n.type];a?this.transitions[e]=new a({attribute:t,timeline:this.timeline,device:this.device}):(P.error(`unsupported transition type '${n.type}'`)(),i=!1)}(i||t.needsRedraw())&&(this.needsRedraw=!0,this.transitions[e].start(n,this.numInstances))}},tg=`attributeManager.invalidate`,ng=`attributeManager.updateStart`,rg=`attributeManager.updateEnd`,ig=`attribute.updateStart`,ag=`attribute.allocate`,og=`attribute.updateEnd`,sg=class{constructor(e,{id:t=`attribute-manager`,stats:n,timeline:r}={}){this.mergeBoundsMemoized=Hc(zu),this.id=t,this.device=e,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=n,this.attributeTransitionManager=new eg(e,{id:`${t}-transitions`,timeline:r}),this.attributeBufferGroups=e.type===`webgpu`?new Dh(e,{id:t,isTransitionAttribute:e=>this.attributeTransitionManager.hasAttribute(e)}):null,Object.seal(this)}finalize(){this.attributeBufferGroups?.finalize();for(let e in this.attributes)this.attributes[e].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(e={clearRedrawFlags:!1}){let t=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!e.clearRedrawFlags,t&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(e){this._add(e)}addInstanced(e){this._add(e,{stepMode:`instance`})}remove(e){for(let t of e)this.attributes[t]!==void 0&&(this.attributes[t].delete(),delete this.attributes[t])}invalidate(e,t){let n=this._invalidateTrigger(e,t);F(tg,this,e,n)}invalidateAll(e){for(let t in this.attributes)this.attributes[t].setNeedsUpdate(t,e);F(tg,this,`all`)}update({data:e,numInstances:t,startIndices:n=null,transitions:r,props:i={},buffers:a={},context:o={}}){let s=!1;F(ng,this),this.stats&&this.stats.get(`Update Attributes`).timeStart();for(let r in this.attributes){let c=this.attributes[r],l=c.settings.accessor;c.startIndices=n,c.numInstances=t,i[r]&&P.removed(`props.${r}`,`data.attributes.${r}`)(),c.setExternalBuffer(a[r])||c.setBinaryValue(typeof l==`string`?a[l]:void 0,e.startIndices)||typeof l==`string`&&!a[l]&&c.setConstantValue(o,i[l])||c.needsUpdate()&&(s=!0,this._updateAttribute({attribute:c,numInstances:t,data:e,props:i,context:o})),this.needsRedraw=this.needsRedraw||c.needsRedraw()}s&&F(rg,this,t),this.stats&&(this.stats.get(`Update Attributes`).timeEnd(),s&&this.stats.get(`Attributes updated`).incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:t,transitions:r})}updateTransition(){let{attributeTransitionManager:e}=this,t=e.run();return this.needsRedraw=this.needsRedraw||t,t}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getBounds(e){let t=e.map(e=>this.attributes[e]?.getBounds());return this.mergeBoundsMemoized(t)}getChangedAttributes(e={clearChangedFlags:!1}){let{attributes:t,attributeTransitionManager:n}=this,r={...n.getAttributes()};for(let i in t){let a=t[i];a.needsRedraw(e)&&!n.hasAttribute(i)&&(r[i]=a)}return r}getBufferLayouts(e){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),e):Object.values(this.getAttributes()).map(t=>t.getBufferLayout(e))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(e,t,n={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),e,t,n):{bufferLayouts:this.getBufferLayouts(t),buffers:{},groupedAttributeIds:new Set}}_add(e,t){for(let n in e){let r=e[n],i={...r,id:n,size:r.isIndexed&&1||r.size||1,...t};this.attributes[n]=new Vm(this.device,i)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let e={};for(let t in this.attributes)this.attributes[t].getUpdateTriggers().forEach(n=>{e[n]||(e[n]=[]),e[n].push(t)});this.updateTriggers=e}_invalidateTrigger(e,t){let{attributes:n,updateTriggers:r}=this,i=r[e];return i&&i.forEach(e=>{let r=n[e];r&&r.setNeedsUpdate(r.id,t)}),i}_updateAttribute(e){let{attribute:t,numInstances:n}=e;if(F(ig,t),t.constant){t.setConstantValue(e.context,t.value);return}t.allocate(n)&&F(ag,t,n),t.updateBuffer(e)&&(this.needsRedraw=!0,F(og,t,n))}},cg=class extends tp{get value(){return this._value}_onUpdate(){let{time:e,settings:{fromValue:t,toValue:n,duration:r,easing:i}}=this;this._value=A(t,n,i(e/r))}},lg=1e-5;function ug(e,t,n,r,i){let a=t-e;return(n-t)*i+-a*r+a+t}function dg(e,t,n,r,i){if(Array.isArray(n)){let a=[];for(let o=0;o<n.length;o++)a[o]=ug(e[o],t[o],n[o],r,i);return a}return ug(e,t,n,r,i)}function fg(e,t){if(Array.isArray(e)){let n=0;for(let r=0;r<e.length;r++){let i=e[r]-t[r];n+=i*i}return Math.sqrt(n)}return Math.abs(e-t)}var pg={interpolation:cg,spring:class extends tp{get value(){return this._currValue}_onUpdate(){let{fromValue:e,toValue:t,damping:n,stiffness:r}=this.settings,{_prevValue:i=e,_currValue:a=e}=this,o=dg(i,a,t,n,r),s=fg(o,t),c=fg(o,a);s<lg&&c<lg&&(o=t,this.end()),this._prevValue=a,this._currValue=o}}},mg=class{constructor(e){this.transitions=new Map,this.timeline=e}get active(){return this.transitions.size>0}add(e,t,n,r){let{transitions:i}=this;if(i.has(e)){let n=i.get(e),{value:r=n.settings.fromValue}=n;t=r,this.remove(e)}if(r=Bm(r),!r)return;let a=pg[r.type];if(!a){P.error(`unsupported transition type '${r.type}'`)();return}let o=new a(this.timeline);o.start({...r,fromValue:t,toValue:n}),i.set(e,o)}remove(e){let{transitions:t}=this;t.has(e)&&(t.get(e).cancel(),t.delete(e))}update(){let e={};for(let[t,n]of this.transitions)n.update(),e[t]=n.value,n.inProgress||this.remove(t);return e}clear(){for(let e of this.transitions.keys())this.remove(e)}};function hg(e){let t=e[Af];for(let n in t){let r=t[n],{validate:i}=r;if(i&&!i(e[n],r))throw Error(`Invalid prop ${n}: ${e[n]}`)}}function gg(e,t){let n=vg({newProps:e,oldProps:t,propTypes:e[Af],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),r=bg(e,t),i=!1;return r||(i=xg(e,t)),{dataChanged:r,propsChanged:n,updateTriggersChanged:i,extensionsChanged:Sg(e,t),transitionsChanged:_g(e,t)}}function _g(e,t){if(!e.transitions)return!1;let n={},r=e[Af],i=!1;for(let a in e.transitions){let o=r[a],s=o&&o.type;(s===`number`||s===`color`||s===`array`)&&yg(e[a],t[a],o)&&(n[a]=!0,i=!0)}return i?n:!1}function vg({newProps:e,oldProps:t,ignoreProps:n={},propTypes:r={},triggerName:i=`props`}){if(t===e)return!1;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return`${i} changed shallowly`;for(let a of Object.keys(e))if(!(a in n)){if(!(a in t))return`${i}.${a} added`;let n=yg(e[a],t[a],r[a]);if(n)return`${i}.${a} ${n}`}for(let a of Object.keys(t))if(!(a in n)){if(!(a in e))return`${i}.${a} dropped`;if(!Object.hasOwnProperty.call(e,a)){let n=yg(e[a],t[a],r[a]);if(n)return`${i}.${a} ${n}`}}return!1}function yg(e,t,n){let r=n&&n.equal;return r&&!r(e,t,n)||!r&&(r=e&&t&&e.equals,r&&!r.call(e,t))?`changed deeply`:!r&&t!==e?`changed shallowly`:null}function bg(e,t){if(t===null)return`oldProps is null, initial diff`;let n=!1,{dataComparator:r,_dataDiff:i}=e;return r?r(e.data,t.data)||(n=`Data comparator detected a change`):e.data!==t.data&&(n=`A new data container was supplied`),n&&i&&(n=i(e.data,t.data)||n),n}function xg(e,t){if(t===null||`all`in e.updateTriggers&&Cg(e,t,`all`))return{all:!0};let n={},r=!1;for(let i in e.updateTriggers)i!==`all`&&Cg(e,t,i)&&(n[i]=!0,r=!0);return r?n:!1}function Sg(e,t){if(t===null)return!0;let n=t.extensions,{extensions:r}=e;if(r===n)return!1;if(!n||!r||r.length!==n.length)return!0;for(let e=0;e<r.length;e++)if(!r[e].equals(n[e]))return!0;return!1}function Cg(e,t,n){let r=e.updateTriggers[n];r??={};let i=t.updateTriggers[n];return i??={},vg({oldProps:i,newProps:r,triggerName:n})}var wg=`count(): argument not an object`,Tg=`count(): argument not a container`;function Eg(e){if(!Og(e))throw Error(wg);if(typeof e.count==`function`)return e.count();if(Number.isFinite(e.size))return e.size;if(Number.isFinite(e.length))return e.length;if(Dg(e))return Object.keys(e).length;throw Error(Tg)}function Dg(e){return typeof e==`object`&&!!e&&e.constructor===Object}function Og(e){return typeof e==`object`&&!!e}function kg(e,t){if(!t)return e;let n={...e,...t};if(`defines`in t&&(n.defines={...e.defines,...t.defines}),`modules`in t&&(n.modules=(e.modules||[]).concat(t.modules),t.modules.some(e=>e.name===`project64`))){let e=n.modules.findIndex(e=>e.name===`project32`);e>=0&&n.modules.splice(e,1)}if(`inject`in t)if(!e.inject)n.inject=t.inject;else{let r={...e.inject};for(let e in t.inject)r[e]=(r[e]||``)+t.inject[e];n.inject=r}return n}var Ag={minFilter:`linear`,mipmapFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},jg={};function Mg(e,t,n,r){if(n instanceof C)return n;n.constructor&&n.constructor.name!==`Object`&&(n={data:n});let i=null;n.compressed&&(i={minFilter:`linear`,mipmapFilter:n.data.length>1?`nearest`:`linear`});let{width:a,height:o}=n.data,s=t.createTexture({...n,sampler:{...Ag,...i,...r},mipLevels:t.getMipLevelCount(a,o)});return t.type===`webgl`?s.generateMipmapsWebGL():t.type===`webgpu`&&t.generateMipmapsWebGPU(s),jg[s.id]=e,s}function Ng(e,t){!t||!(t instanceof C)||jg[t.id]===e&&(t.delete(),delete jg[t.id])}var Pg={boolean:{validate(e,t){return!0},equal(e,t,n){return!!e==!!t}},number:{validate(e,t){return Number.isFinite(e)&&(!(`max`in t)||e<=t.max)&&(!(`min`in t)||e>=t.min)}},color:{validate(e,t){return t.optional&&!e||Rg(e)&&(e.length===3||e.length===4)},equal(e,t,n){return K(e,t,1)}},accessor:{validate(e,t){let n=zg(e);return n===`function`||n===zg(t.value)},equal(e,t,n){return typeof t==`function`?!0:K(e,t,1)}},array:{validate(e,t){return t.optional&&!e||Rg(e)},equal(e,t,n){let{compare:r}=n;return r?K(e,t,Number.isInteger(r)?r:r?1:0):e===t}},object:{equal(e,t,n){if(n.ignore)return!0;let{compare:r}=n;return r?K(e,t,Number.isInteger(r)?r:r?1:0):e===t}},function:{validate(e,t){return t.optional&&!e||typeof e==`function`},equal(e,t,n){return!n.compare&&n.ignore!==!1||e===t}},data:{transform:(e,t,n)=>{if(!e)return e;let{dataTransform:r}=n.props;return r?r(e):typeof e.shape==`string`&&e.shape.endsWith(`-table`)&&Array.isArray(e.data)?e.data:e}},image:{transform:(e,t,n)=>{let r=n.context;return!r||!r.device?null:Mg(n.id,r.device,e,{...t.parameters,...n.props.textureParameters})},release:(e,t,n)=>{Ng(n.id,e)}}};function Fg(e){let t={},n={},r={};for(let[i,a]of Object.entries(e)){let e=a?.deprecatedFor;if(e)r[i]=Array.isArray(e)?e:[e];else{let e=Ig(i,a);t[i]=e,n[i]=e.value}}return{propTypes:t,defaultProps:n,deprecatedProps:r}}function Ig(e,t){switch(zg(t)){case`object`:return Lg(e,t);case`array`:return Lg(e,{type:`array`,value:t,compare:!1});case`boolean`:return Lg(e,{type:`boolean`,value:t});case`number`:return Lg(e,{type:`number`,value:t});case`function`:return Lg(e,{type:`function`,value:t,compare:!0});default:return{name:e,type:`unknown`,value:t}}}function Lg(e,t){return`type`in t?{name:e,...Pg[t.type],...t}:`value`in t?{name:e,type:zg(t.value),...t}:{name:e,type:`object`,value:t}}function Rg(e){return Array.isArray(e)||ArrayBuffer.isView(e)}function zg(e){return Rg(e)?`array`:e===null?`null`:typeof e}function Bg(e,t){let n;for(let e=t.length-1;e>=0;e--){let r=t[e];`extensions`in r&&(n=r.extensions)}let r=Hg(e.constructor,n),i=Object.create(r);i[kf]=e,i[Nf]={},i[Pf]={};for(let e=0;e<t.length;++e){let n=t[e];for(let e in n)i[e]=n[e]}return Object.freeze(i),i}var Vg=`_mergedDefaultProps`;function Hg(e,t){if(!(e instanceof Qg.constructor))return{};let n=Vg;if(t)for(let e of t){let t=e.constructor;t&&(n+=`:${t.extensionName||t.name}`)}return Yg(e,n)||(e[n]=Ug(e,t||[]))}function Ug(e,t){if(!e.prototype)return null;let n=Hg(Object.getPrototypeOf(e)),r=Fg(Yg(e,`defaultProps`)||{}),i=Object.assign(Object.create(null),n,r.defaultProps),a=Object.assign(Object.create(null),n?.[Af],r.propTypes),o=Object.assign(Object.create(null),n?.[jf],r.deprecatedProps);for(let e of t){let t=Hg(e.constructor);t&&(Object.assign(i,t),Object.assign(a,t[Af]),Object.assign(o,t[jf]))}return Wg(i,e),Kg(i,a),Gg(i,o),i[Af]=a,i[jf]=o,t.length===0&&!Jg(e,`_propTypes`)&&(e._propTypes=a),i}function Wg(e,t){let n=Xg(t);Object.defineProperties(e,{id:{writable:!0,value:n}})}function Gg(e,t){for(let n in t)Object.defineProperty(e,n,{enumerable:!1,set(e){let r=`${this.id}: ${n}`;for(let r of t[n])Jg(this,r)||(this[r]=e);P.deprecated(r,t[n].join(`/`))()}})}function Kg(e,t){let n={},r={};for(let e in t){let i=t[e],{name:a,value:o}=i;i.async&&(n[a]=o,r[a]=qg(a))}e[Mf]=n,e[Nf]={},Object.defineProperties(e,r)}function qg(e){return{enumerable:!0,set(t){typeof t==`string`||t instanceof Promise||Pm(t)?this[Nf][e]=t:this[Pf][e]=t},get(){if(this[Pf]){if(e in this[Pf])return this[Pf][e]||this[Mf][e];if(e in this[Nf]){let t=this[kf]&&this[kf].internalState;if(t&&t.hasAsyncProp(e))return t.getAsyncProp(e)||this[Mf][e]}}return this[Mf][e]}}}function Jg(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function Yg(e,t){return Jg(e,t)&&e[t]}function Xg(e){let t=e.componentName;return t||P.warn(`${e.name}.componentName not specified`)(),t||e.name}var Zg=0,Qg=class{constructor(...e){this.props=Bg(this,e),this.id=this.props.id,this.count=Zg++}clone(e){let{props:t}=this,n={};for(let e in t[Mf])e in t[Pf]?n[e]=t[Pf][e]:e in t[Nf]&&(n[e]=t[Nf][e]);return new this.constructor({...t,...n,...e})}};Qg.componentName=`Component`,Qg.defaultProps={};var $g=Object.freeze({}),e_=class{constructor(e){this.component=e,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let e in this.asyncProps){let t=this.asyncProps[e];t&&t.type&&t.type.release&&t.type.release(t.resolvedValue,t.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||$g}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(e){return e in this.asyncProps}getAsyncProp(e){let t=this.asyncProps[e];return t&&t.resolvedValue}isAsyncPropLoading(e){if(e){let t=this.asyncProps[e];return!!(t&&t.pendingLoadCount>0&&t.pendingLoadCount!==t.resolvedLoadCount)}for(let e in this.asyncProps)if(this.isAsyncPropLoading(e))return!0;return!1}reloadAsyncProp(e,t){this._watchPromise(e,Promise.resolve(t))}setAsyncProps(e){this.component=e[kf]||this.component;let t=e[Pf]||{},n=e[Nf]||e,r=e[Mf]||{};for(let e in t){let n=t[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,n),t[e]=this.getAsyncProp(e)}for(let e in n){let t=n[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,t)}}_fetch(e,t){return null}_onResolve(e,t){}_onError(e,t){}_updateAsyncProp(e,t){if(this._didAsyncInputValueChange(e,t)){if(typeof t==`string`&&(t=this._fetch(e,t)),t instanceof Promise){this._watchPromise(e,t);return}if(Pm(t)){this._resolveAsyncIterable(e,t);return}this._setPropValue(e,t)}}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps){this.oldAsyncProps=Object.create(this.oldProps);for(let e in this.asyncProps)Object.defineProperty(this.oldAsyncProps,e,{enumerable:!0,value:this.oldProps[e]})}}_didAsyncInputValueChange(e,t){let n=this.asyncProps[e];return t===n.resolvedValue||t===n.lastValue?!1:(n.lastValue=t,!0)}_setPropValue(e,t){this._freezeAsyncOldProps();let n=this.asyncProps[e];n&&(t=this._postProcessValue(n,t),n.resolvedValue=t,n.pendingLoadCount++,n.resolvedLoadCount=n.pendingLoadCount)}_setAsyncPropValue(e,t,n){let r=this.asyncProps[e];r&&n>=r.resolvedLoadCount&&t!==void 0&&(this._freezeAsyncOldProps(),r.resolvedValue=t,r.resolvedLoadCount=n,this.onAsyncPropUpdated(e,t))}_watchPromise(e,t){let n=this.asyncProps[e];if(n){n.pendingLoadCount++;let r=n.pendingLoadCount;t.then(t=>{this.component&&(t=this._postProcessValue(n,t),this._setAsyncPropValue(e,t,r),this._onResolve(e,t))}).catch(t=>{this._onError(e,t)})}}async _resolveAsyncIterable(e,t){if(e!==`data`){this._setPropValue(e,t);return}let n=this.asyncProps[e];if(!n)return;n.pendingLoadCount++;let r=n.pendingLoadCount,i=[],a=0;for await(let n of t){if(!this.component)return;let{dataTransform:t}=this.component.props;i=t?t(n,i):i.concat(n),Object.defineProperty(i,`__diff`,{enumerable:!1,value:[{startRow:a,endRow:i.length}]}),a=i.length,this._setAsyncPropValue(e,i,r)}this._onResolve(e,i)}_postProcessValue(e,t){let n=e.type;return n&&this.component&&(n.release&&n.release(e.resolvedValue,n,this.component),n.transform)?n.transform(t,n,this.component):t}_createAsyncPropData(e,t){if(!this.asyncProps[e]){let n=this.component&&this.component.props[Af];this.asyncProps[e]={type:n&&n[e],lastValue:null,resolvedValue:t,pendingLoadCount:0,resolvedLoadCount:0}}}},t_=class extends e_{constructor({attributeManager:e,layer:t}){super(t),this.attributeManager=e,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}_fetch(e,t){let n=this.layer,r=n?.props.fetch;return r?r(t,{propName:e,layer:n}):super._fetch(e,t)}_onResolve(e,t){let n=this.layer;if(n){let r=n.props.onDataLoad;e===`data`&&r&&r(t,{propName:e,layer:n})}}_onError(e,t){let n=this.layer;n&&n.raiseError(t,`loading ${e} of ${this.layer}`)}},n_=`layer.changeFlag`,r_=`layer.initialize`,i_=`layer.update`,a_=`layer.finalize`,o_=`layer.matched`,s_=2**24-1,c_=Object.freeze([]),l_=Hc(({oldViewport:e,viewport:t})=>e.equals(t)),Q=new Uint8ClampedArray;function u_(e){return e.rowIndexes||e.pickingColors||e.instancePickingColors}function d_(e){return e.rowIndexes}function f_(e){return e.pickingColors||e.instancePickingColors}var p_={data:{type:`data`,value:c_,async:!0},dataComparator:{type:`function`,value:null,optional:!0},_dataDiff:{type:`function`,value:e=>e&&e.__diff,optional:!0},dataTransform:{type:`function`,value:null,optional:!0},onDataLoad:{type:`function`,value:null,optional:!0},onError:{type:`function`,value:null,optional:!0},fetch:{type:`function`,value:(e,{propName:t,layer:n,loaders:r,loadOptions:i,signal:a})=>{let{resourceManager:o}=n.context;i||=n.getLoadOptions(),r||=n.props.loaders,a&&(i={...i,core:{...i?.core,fetch:{...i?.core?.fetch,signal:a}}});let s=o.contains(e);return!s&&!i&&(o.add({resourceId:e,data:Br(e,r),persistent:!1}),s=!0),s?o.subscribe({resourceId:e,onChange:e=>n.internalState?.reloadAsyncProp(t,e),consumerId:n.id,requestId:t}):Br(e,r,i)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:`number`,min:0,max:1,value:1},operation:`draw`,onHover:{type:`function`,value:null,optional:!0},onClick:{type:`function`,value:null,optional:!0},onDragStart:{type:`function`,value:null,optional:!0},onDrag:{type:`function`,value:null,optional:!0},onDragEnd:{type:`function`,value:null,optional:!0},coordinateSystem:`default`,coordinateOrigin:{type:`array`,value:[0,0,0],compare:!0},modelMatrix:{type:`array`,value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:`XYZ`,colorFormat:`RGBA`,parameters:{type:`object`,value:{},optional:!0,compare:2},loadOptions:{type:`object`,value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:`array`,value:[],optional:!0,ignore:!0},getPolygonOffset:{type:`function`,value:({layerIndex:e})=>[0,-e*100]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:`accessor`,value:[0,0,128,128]}},m_=class extends Qg{constructor(){super(...arguments),this.internalState=null,this.lifecycle=Of.NO_STATE,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,`layerName`)?this.layerName:``}get root(){let e=this;for(;e.parent;)e=e.parent;return e}toString(){return`${this.constructor.layerName||this.constructor.name}({id: '${this.props.id}'})`}project(e){Y(this.internalState);let t=this.internalState.viewport||this.context.viewport,[n,r,i]=kl(Xu(e,{viewport:t,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem}),t.pixelProjectionMatrix);return e.length===2?[n,r]:[n,r,i]}unproject(e){return Y(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(e)}projectPosition(e,t){return Y(this.internalState),Zu(e,{viewport:this.internalState.viewport||this.context.viewport,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem,...t})}get isComposite(){return!1}get isDrawable(){return!0}setState(e){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,e),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return this.internalState?!this.internalState.isAsyncPropLoading():!1}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let e=this.state;return e&&(e.models||e.model&&[e.model])||[]}setShaderModuleProps(...e){for(let t of this.getModels())t.shaderInputs.setProps(...e)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}use64bitPositions(){let{coordinateSystem:e}=this.props;return e===`default`||e===`lnglat`||e===`cartesian`}onHover(e,t){return this.props.onHover&&this.props.onHover(e,t)||!1}onClick(e,t){return this.props.onClick&&this.props.onClick(e,t)||!1}nullPickingColor(){return[0,0,0]}encodePickingColor(e,t=[]){return t[0]=e+1&255,t[1]=e+1>>8&255,t[2]=e+1>>8>>8&255,t}decodePickingColor(e){Y(e instanceof Uint8Array);let[t,n,r]=e;return t+n*256+r*65536-1}getNumInstances(){return Number.isFinite(this.props.numInstances)?this.props.numInstances:this.state&&this.state.numInstances!==void 0?this.state.numInstances:Eg(this.props.data)}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds([`positions`,`instancePositions`])}getShaders(e){e=kg(e,{disableWarnings:!0,modules:this.context.defaultShaderModules});for(let t of this.props.extensions)e=kg(e,t.getShaders.call(this,t));return e}shouldUpdateState(e){return e.changeFlags.propsOrDataChanged}updateState(e){let t=this.getAttributeManager(),{dataChanged:n}=e.changeFlags;if(n&&t)if(Array.isArray(n))for(let e of n)t.invalidateAll(e);else t.invalidateAll();if(t){let{props:n}=e,r=this.internalState.hasPickingBuffer,i=Number.isInteger(n.highlightedObjectIndex)||!!n.pickable||n.extensions.some(e=>e.getNeedsPickingBuffer.call(this,e));if(r!==i){this.internalState.hasPickingBuffer=i;let e=u_(t.attributes);e&&(i&&e.constant&&(e.constant=!1,t.invalidate(e.id)),!e.value&&!i&&(e.constant=!0,e.value=d_(t.attributes)?[Zl]:[0,0,0]))}}}finalizeState(e){for(let e of this.getModels())e.destroy();let t=this.getAttributeManager();t&&t.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(e){for(let t of this.getModels())t.draw(e.renderPass)}getPickingInfo({info:e,mode:t,sourceLayer:n}){let{index:r}=e;return r>=0&&Array.isArray(this.props.data)&&(e.object=this.props.data[r]),e}raiseError(e,t){t&&(e=Error(`${t}: ${e.message}`,{cause:e})),this.props.onError?.(e)||this.context?.onError?.(e,this)}getNeedsRedraw(e={clearRedrawFlags:!1}){return this._getNeedsRedraw(e)}needsUpdate(){return this.internalState?this.internalState.needsUpdate||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()):!1}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(e){if(!this.internalState)return;let t=this.internalState.viewport;this.internalState.viewport=e,(!t||!l_({oldViewport:t,viewport:e}))&&(this.setChangeFlags({viewportChanged:!0}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(e=`all`){let t=this.getAttributeManager();t&&(e===`all`?t.invalidateAll():t.invalidate(e))}updateAttributes(e){let t=!1;for(let n in e)e[n].layoutChanged()&&(t=!0);for(let n of this.getModels())this._setModelAttributes(n,e,t)}_updateAttributes(){let e=this.getAttributeManager();if(!e)return;let t=this.props,n=this.getNumInstances(),r=this.getStartIndices();e.update({data:t.data,numInstances:n,startIndices:r,props:t,transitions:t.transitions,buffers:t.data.attributes,context:this});let i=e.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(i)}_updateAttributeTransition(){let e=this.getAttributeManager();e&&e.updateTransition()}_updateUniformTransition(){let{uniformTransitions:e}=this.internalState;if(e.active){let t=e.update(),n=Object.create(this.props);for(let e in t)Object.defineProperty(n,e,{value:t[e]});return n}return this.props}calculateInstancePickingColors(e,{numInstances:t}){if(e.constant)return;let n=Math.floor(Q.length/4);this.internalState.usesPickingColorCache=!0;let r=t>0&&Q[0]===0;if(n<t||r){t>s_&&P.warn(`Layer has too many data objects. Picking might not be able to distinguish all objects.`)(),Q=ku.allocate(Q,t,{size:4,copy:!0,maxCount:Math.max(t,s_)});let e=Math.floor(Q.length/4),i=[0,0,0],a=r?0:n;for(let t=a;t<e;t++)this.encodePickingColor(t,i),Q[t*4+0]=i[0],Q[t*4+1]=i[1],Q[t*4+2]=i[2],Q[t*4+3]=0}e.value=Q.subarray(0,t*4)}_setModelAttributes(e,t,n=!1){if(!Object.keys(t).length)return;let r=this.getAttributeManager();if(r?.hasBufferGroups()){this._setGroupedModelAttributes(e,r,t);return}if(n){let n=this.getAttributeManager();e.setBufferLayout(n.getBufferLayouts(e)),t=n.getAttributes()}let i=e.userData?.excludeAttributes||{},a={},o={};for(let n in t){if(i[n])continue;let r=t[n].getValue();for(let i in r){let s=r[i];s instanceof p?t[n].settings.isIndexed?e.setIndexBuffer(s):a[i]=s:s&&(o[i]=s)}}e.setAttributes(a),e.setConstantAttributes(o)}_setGroupedModelAttributes(e,t,n){let r=e.userData?.excludeAttributes||{},i=t.getBufferGroupBindings(n,e,r);e.setBufferLayout(i.bufferLayouts);let a={...i.buffers},o={},s=t.getAttributes();for(let t in s){if(r[t]||i.groupedAttributeIds.has(t))continue;let n=s[t],c=n.getValue();for(let t in c){let r=c[t];r instanceof p?n.settings.isIndexed?e.setIndexBuffer(r):a[t]=r:r&&(o[t]=r)}}e.setAttributes(a),e.setConstantAttributes(o)}disablePickingIndex(e){let t=this.props.data;if(!(`attributes`in t)){this._disablePickingIndex(e);return}let n=this.getAttributeManager().attributes,r=d_(n),i=f_(n),a=r&&t.attributes&&t.attributes[r.id];if(a&&a.value){let n=a.value;for(let i=0;i<t.length;i++)n[r.getVertexOffset(i)]===e&&this._disablePickingIndex(i);return}let o=i&&t.attributes&&t.attributes[i.id];if(o&&o.value){let n=o.value,r=this.encodePickingColor(e);for(let e=0;e<t.length;e++){let t=i.getVertexOffset(e);n[t]===r[0]&&n[t+1]===r[1]&&n[t+2]===r[2]&&this._disablePickingIndex(e)}}else this._disablePickingIndex(e)}_disablePickingIndex(e){let t=this.getAttributeManager().attributes,n=d_(t);if(n){let t=n.getVertexOffset(e),r=n.getVertexOffset(e+1),i=new Uint32Array(r-t);i.fill(Zl),n.buffer.write(i,t*i.BYTES_PER_ELEMENT);return}let r=f_(t);if(!r){this.internalState&&Ql(this.internalState.disabledPickingIndices,e);return}let i=r.getVertexOffset(e),a=r.getVertexOffset(e+1);r.buffer.write(new Uint8Array(a-i),i)}restorePickingColors(){let e=this.getAttributeManager().attributes,t=u_(e);if(!t){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let n=f_(e);this.internalState.usesPickingColorCache&&n&&n.value.buffer!==Q.buffer&&(n.value=Q.subarray(0,n.value.length)),t.updateSubBuffer({startOffset:0})}_initialize(){Y(!this.internalState),F(r_,this);let e=this._getAttributeManager();this.internalState=new t_({attributeManager:e,layer:this}),this._clearChangeFlags(),this.state={},Object.defineProperty(this.state,`attributeManager`,{get:()=>(P.deprecated(`layer.state.attributeManager`,`layer.getAttributeManager()`)(),e)}),this.internalState.uniformTransitions=new mg(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context);for(let e of this.props.extensions)e.initializeState.call(this,this.context,e);this.setChangeFlags({dataChanged:`init`,propsChanged:`init`,viewportChanged:!0,extensionsChanged:!0}),this._update()}_transferState(e){F(o_,this,this===e);let{state:t,internalState:n}=e;this!==e&&(this.internalState=n,this.state=t,this.internalState.setAsyncProps(this.props),this._diffProps(this.props,this.internalState.getOldProps()))}_update(){let e=this.needsUpdate();if(F(i_,this,e),!e)return;this.context.stats.get(`Layer updates`).incrementCount();let t=this.props,n=this.context,r=this.internalState,i=n.viewport,a=this._updateUniformTransition();r.propsInTransition=a,n.viewport=r.viewport||i,this.props=a;try{let e=this._getUpdateParams(),t=this.getModels();if(n.device)this.updateState(e);else try{this.updateState(e)}catch{}for(let t of this.props.extensions)t.updateState.call(this,e,t);this.setNeedsRedraw(),this._updateAttributes();let r=this.getModels()[0]!==t[0];this._postUpdate(e,r)}finally{n.viewport=i,this.props=t,this._clearChangeFlags(),r.needsUpdate=!1,r.resetOldProps()}}_finalize(){F(a_,this),this.finalizeState(this.context);for(let e of this.props.extensions)e.finalizeState.call(this,this.context,e)}_drawLayer({renderPass:e,shaderModuleProps:t=null,uniforms:n={},parameters:r={}}){this._updateAttributeTransition();let i=this.props,a=this.context;this.props=this.internalState.propsInTransition||i;try{t&&this.setShaderModuleProps(t);let{getPolygonOffset:i}=this.props,o=i&&i(n)||[0,0];a.device instanceof D&&a.device.setParametersWebGL({polygonOffset:o});let s=a.device instanceof D?null:h_(r);if(g_(this.getModels(),e,r,s),a.device instanceof D)a.device.withParametersWebGL(r,()=>{let i={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:r,context:a};for(let e of this.props.extensions)e.draw.call(this,i,e);this.draw(i)});else{s?.renderPassParameters&&e.setParameters(s.renderPassParameters);let i={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:r,context:a};for(let e of this.props.extensions)e.draw.call(this,i,e);this.draw(i)}}finally{this.props=i}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(e){if(!this.internalState)return;let{changeFlags:t}=this.internalState;for(let n in e)if(e[n]){let r=!1;switch(n){case`dataChanged`:let i=e[n],a=t[n];i&&Array.isArray(a)&&(t.dataChanged=Array.isArray(i)?a.concat(i):i,r=!0);default:t[n]||(t[n]=e[n],r=!0)}r&&F(n_,this,n,e)}let n=!!(t.dataChanged||t.updateTriggersChanged||t.propsChanged||t.extensionsChanged);t.propsOrDataChanged=n,t.somethingChanged=n||t.viewportChanged||t.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(e,t){let n=gg(e,t);if(n.updateTriggersChanged)for(let e in n.updateTriggersChanged)n.updateTriggersChanged[e]&&this.invalidateAttribute(e);if(n.transitionsChanged)for(let r in n.transitionsChanged)this.internalState.uniformTransitions.add(r,t[r],e[r],e.transitions?.[r]);return this.setChangeFlags(n)}validateProps(){hg(this.props)}updateAutoHighlight(e){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(e)}_updateAutoHighlight(e){let t={highlightedObjectColor:e.picked?e.color:null},{highlightColor:n}=this.props;e.picked&&typeof n==`function`&&(t.highlightColor=n(e)),this.setShaderModuleProps({picking:t}),this.setNeedsRedraw()}_getAttributeManager(){let e=this.context;return new sg(e.device,{id:this.props.id,stats:e.stats,timeline:e.timeline})}_postUpdate(e,t){let{props:n,oldProps:r}=e,i=this.state.model;i?.isInstanced&&i.setInstanceCount(this.getNumInstances());let{autoHighlight:a,highlightedObjectIndex:o,highlightColor:s}=n;if(t||r.autoHighlight!==a||r.highlightedObjectIndex!==o||r.highlightColor!==s){let e={};Array.isArray(s)&&(e.highlightColor=s),(t||r.autoHighlight!==a||o!==r.highlightedObjectIndex)&&(e.highlightedObjectColor=Number.isFinite(o)&&o>=0?this.encodePickingColor(o):null),this.setShaderModuleProps({picking:e})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(e){if(!this.internalState)return!1;let t=!1;t||=this.internalState.needsRedraw&&this.id;let n=this.getAttributeManager(),r=n?n.getNeedsRedraw(e):!1;if(t||=r,t)for(let e of this.props.extensions)e.onNeedsRedraw.call(this,e);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!e.clearRedrawFlags,t}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}};m_.defaultProps=p_,m_.layerName=`Layer`;function h_(e){let{blendConstant:t,...n}=e;return t?{pipelineParameters:n,renderPassParameters:{blendConstant:t}}:{pipelineParameters:n}}function g_(e,t,n,r){for(let i of e)i.device.type===`webgpu`?(__(i,t),i.setParameters({...i.parameters,...r?.pipelineParameters})):i.setParameters(n)}function __(e,t){let n=t.props.framebuffer||(t.framebuffer??null);if(!n)return;let r=n.colorAttachments.map(e=>e?.texture?.format??null),i=n.depthStencilAttachment?.texture?.format,a=e;(!v_(a.props.colorAttachmentFormats,r)||a.props.depthStencilAttachmentFormat!==i)&&(a.props.colorAttachmentFormats=r,a.props.depthStencilAttachmentFormat=i,a._setPipelineNeedsUpdate(`attachment formats`))}function v_(e,t){if(e===t)return!0;if(!e||!t||e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}var y_=Math.PI/180,b_=180/Math.PI,x_=1,S_=6370972,C_=.75,w_=1.15;function T_(e){let t=ju(e+180,360)-180;return Math.abs(t)<x_}function E_(){let e=256/S_,t=Math.PI/180*256;return{unitsPerMeter:[e,e,e],unitsPerMeter2:[0,0,0],metersPerUnit:[1/e,1/e,1/e],unitsPerDegree:[t,t,e],unitsPerDegree2:[0,0,0],degreesPerUnit:[1/t,1/t,1/e]}}var D_=class extends Gu{constructor(e={}){let{longitude:t=0,bearing:n=0,pitch:r=0,zoom:i=0,nearZMultiplier:a=.5,farZMultiplier:o=1,resolution:s=10}=e,{latitude:c=0,height:l,altitude:u=1.5,fovy:d}=e;c=Math.max(Math.min(c,90),-90),l||=1,d?u=Ol(d):d=Dl(u);let f=2**(i-O_(Math.max(Math.min(c,G),-G))),p=r*y_,m=e.nearZ??a,h=e.farZ??(u+256*2*f/l/Math.max(Math.cos(p),.1))*o,g=new L().lookAt({eye:[0,-u,0],up:[0,0,1]}).rotateX(-p).rotateY(-n*y_).rotateX(c*y_).rotateZ(-t*y_).scale(f/l);super({...e,height:l,viewMatrix:g,longitude:t,latitude:c,zoom:i,distanceScales:E_(),fovy:d,focalDistance:u,near:m,far:h}),this.scale=f,this.latitude=c,this.longitude=t,this.bearing=n,this.pitch=r,this.fovy=d,this.resolution=s}get projectionMode(){return H.GLOBE}getDistanceScales(){return this.distanceScales}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,this.height/2],t),r=this.unproject([this.width/2,0],t),i=this.unproject([this.width,this.height/2],t),a=this.unproject([this.width/2,this.height],t);return i[0]<this.longitude&&(i[0]+=360),n[0]>this.longitude&&(n[0]-=360),[Math.min(n[0],i[0],r[0],a[0]),Math.min(n[1],i[1],r[1],a[1]),Math.max(n[0],i[0],r[0],a[0]),Math.max(n[1],i[1],r[1],a[1])]}_getRayToGlobe(e,{topLeft:t=!0,targetZ:n}={}){let[r,i]=e,a=t?i:this.height-i,{pixelUnprojectionMatrix:o}=this,s=k_(o,[r,a,-1,1]),c=k_(o,[r,a,1,1]),l=((n||0)/S_+1)*256,u=ya(_a([],s,c)),d=ya(s),f=ya(c);return{rayStartPosition:s,rayEndPosition:c,radius:l,rayLengthSquared:u,rayStartDistanceSquared:d,distanceToCenterSquared:4*((4*d*f-(u-d-f)**2)/16)/u}}_getRayDistanceToGlobeCenterRatio(e,t){let{distanceToCenterSquared:n,radius:r}=this._getRayToGlobe(e,t);return Math.sqrt(Math.max(0,n))/r}getZoomAnchorStrength(e){let t=this._getRayDistanceToGlobeCenterRatio(e);if(t>=w_)return 0;let n=Math.max(0,Math.min(1,(t-C_)/(w_-C_)));return 1-n*n*(3-2*n)}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[r,i,a]=e,o=t?i:this.height-i,{pixelUnprojectionMatrix:s}=this,c;if(Number.isFinite(a))c=k_(s,[r,o,a,1]);else{let{rayStartPosition:r,rayEndPosition:i,radius:a,rayLengthSquared:o,rayStartDistanceSquared:s,distanceToCenterSquared:l}=this._getRayToGlobe(e,{topLeft:t,targetZ:n});c=la([],r,i,(Math.sqrt(s-l)-Math.sqrt(Math.max(0,a*a-l)))/Math.sqrt(o))}let[l,u,d]=this.unprojectPosition(c);return Number.isFinite(a)?[l,u,d]:Number.isFinite(n)?[l,u,n]:[l,u]}projectPosition(e){let[t,n,r=0]=e,i=t*y_,a=n*y_,o=Math.cos(a),s=(r/S_+1)*256;return[Math.sin(i)*o*s,-Math.cos(i)*o*s,Math.sin(a)*s]}unprojectPosition(e){let[t,n,r]=e,i=va(e),a=Math.asin(r/i);return[Math.atan2(t,-n)*b_,a*b_,(i/256-1)*S_]}projectFlat(e){return e}unprojectFlat(e){return e}panByPosition(e,t,n){if(!n){let n=this.getZoomAnchorStrength(t);if(n===0)return{longitude:this.longitude,latitude:this.latitude};let r=this.unproject(t),i=ju(e[0]-r[0]+180,360)-180,a=e[1]-r[1],o=Math.abs(r[1])>85.051129||Math.abs(i)>90;if(T_(this.bearing)&&o)return{longitude:this.longitude,latitude:this.latitude};if(T_(this.bearing)&&a!==0){let e=((a>0?G:-G)-this.latitude)/a;n=Math.min(n,Math.max(0,e))}return{longitude:this.longitude+i*n,latitude:Math.max(Math.min(this.latitude+a*n,90),-90)}}let[r,i,a]=e,o=.25/2**(this.zoom-O_(this.latitude)),s=r+o*(n[0]-t[0]),c=i-o*(n[1]-t[1]);c=Math.max(Math.min(c,90),-90);let l={longitude:s,latitude:c,zoom:a-O_(i)};return l.zoom+=O_(l.latitude),l}};D_.displayName=`GlobeViewport`;function O_(e,t){t&&(e=Math.max(Math.min(e,G),-G));let n=Math.PI*Math.cos(e*Math.PI/180);return Math.log2(n)}function k_(e,t){let n=Ha([],t,e);return Va(n,n,1/n[3]),n}var A_={name:`surfaceBuffer`,bindingLayout:[{name:`surfaceBuffer`,group:3}],source:`
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
`,uniformTypes:{enabled:`i32`,viewMatrix:`mat4x4<f32>`},defaultUniforms:{enabled:0,viewMatrix:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}};function j_(e,t,n){let r=e.projectPosition([t[0],t[1],t[2]||0]),i=n.map((e,t)=>e-r[t]),a=e.getDistanceScales([...t]);if(e instanceof D_){let e=Math.hypot(...r),t=r.map(t=>t/e),n=Math.hypot(t[0],t[1]),o=Math.abs(t[2])===1?[1,0,0]:[t[1]/n,-t[0]/n,0],s=[t[1]*o[2]-t[2]*o[1],t[2]*o[0]-t[0]*o[2],t[0]*o[1]-t[1]*o[0]],c=e=>e.reduce((e,t,n)=>e+t*i[n],0);return[-c(o)/a.unitsPerMeter[0],-c(s)/a.unitsPerMeter[1],c(t)/a.unitsPerMeter[2]]}let o=a.unitsPerMeter,{unitsPerMeter2:s=[0,0,0]}=a,c=Math.max(0,o[1]**2+4*s[1]*i[1]),l=2*i[1]/(o[1]+Math.sqrt(c));return[i[0]/(o[0]+s[0]*l),l,i[2]/(o[2]+s[2]*l)]}var M_=class extends m_{static layerName=`WaterSurfaceLayer`;static defaultProps={coordinateSystem:Lc.METER_OFFSETS,getPolygonOffset:()=>[0,0],time:0,style:`classic`,flowDirection:[0,1]};getAttributeManager(){return null}initializeState({device:e}){let t=new j(e,{...this.getShaders({source:N_,vs:P_,fs:F_,modules:[ol,iu,Fo,zo,A_]}),id:`${this.id}-water`,topology:`triangle-list`,vertexCount:this.props.vertexCount,bufferLayout:[{name:`position`,format:`float32x3`}],attributes:{position:this.props.positions},parameters:{depthCompare:`less-equal`,depthWriteEnabled:!0,cullMode:`none`,blend:!0,blendColorSrcFactor:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`}});this.setState({model:t})}updateState({props:e,oldProps:t}){e.positions!==t.positions&&this.state.model.setAttributes({position:e.positions}),this.state.model.setVertexCount(e.vertexCount)}getModels(){return this.state.model?[this.state.model]:[]}draw({renderPass:e}){let t={...this.state.model.parameters};e.props.framebuffer&&!e.props.framebuffer.depthStencilAttachment?(delete t.depthCompare,delete t.depthWriteEnabled,delete t.depthFormat,delete t.depthBias,delete t.depthBiasSlopeScale,delete t.depthBiasClamp):(t.depthCompare=`less-equal`,t.depthWriteEnabled=!0),this.state.model.setParameters(t);let{skyZenithColor:n,skyUpDirection:r,...i}=this.props.material||{};this.state.model.shaderInputs.setProps({waterMaterial:{...Fo.defaultUniforms,mapping:`uv`,coordinateScale:[.08,.08],opacity:1,...i,time:typeof this.props.time==`function`?this.props.time():this.props.time},riverWaterMaterial:{enabled:this.props.style===`river`?1:0,flowDirection:this.props.flowDirection,skyZenithColor:n??zo.defaultUniforms.skyZenithColor,skyUpDirection:r??zo.defaultUniforms.skyUpDirection},lighting:{enabled:!0,lights:[{type:`ambient`,color:[255,255,255],intensity:.45},{type:`directional`,color:[255,244,218],intensity:.85,direction:[.5,.3,-.8]}]}}),this.state.model.draw(e)}},N_=`
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
`,P_=`#version 300 es
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
`,F_=`#version 300 es
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
`,I_={name:`sketchEdge`,bindingLayout:[{name:`sketchEdge`,group:3}],source:`struct SketchEdgeUniforms { color: vec4<f32> }; @group(3) @binding(auto) var<uniform> sketchEdge: SketchEdgeUniforms;`,fs:`layout(std140) uniform sketchEdgeUniforms { vec4 color; } sketchEdge;`,uniformTypes:{color:`vec4<f32>`},defaultUniforms:{color:[.1,.1,.1,1]}},L_=class extends m_{static layerName=`SketchEdgeLayer`;static defaultProps={coordinateSystem:Lc.METER_OFFSETS,getPolygonOffset:()=>[0,0],color:[35,31,29,255],style:{}};getAttributeManager(){return null}getNumInstances(){return this.props.segmentCount}initializeState({device:e}){let t=e.createBuffer({data:new Float32Array([0,-1,1,-1,0,1,0,1,1,-1,1,1])});try{let n=new j(e,{...this.getShaders({source:R_,vs:z_,fs:B_,modules:[ol,iu,lo,I_]}),id:`${this.id}-strokes`,topology:`triangle-list`,vertexCount:6,instanceCount:this.props.segmentCount,bufferLayout:[{name:`corner`,format:`float32x2`},{name:`segments`,stepMode:`instance`,byteStride:32,attributes:[{attribute:`startPosition`,format:`float32x3`,byteOffset:0},{attribute:`endPosition`,format:`float32x3`,byteOffset:12},{attribute:`featureIndex`,format:`float32`,byteOffset:24},{attribute:`seed`,format:`float32`,byteOffset:28}]}],attributes:{corner:t,segments:this.props.segments},parameters:{depthCompare:`less-equal`,depthWriteEnabled:!1,cullMode:`none`,blend:!0,blendColorSrcFactor:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`}});this.setState({model:n,corners:t})}catch(e){throw t.destroy(),e}}updateState({props:e,oldProps:t}){e.segments!==t.segments&&this.state.model.setAttributes({segments:e.segments}),this.state.model.setInstanceCount(e.segmentCount)}getModels(){return this.state.model?[this.state.model]:[]}draw({renderPass:e}){let t=this.props.color;this.state.model.shaderInputs.setProps({sketchStroke:this.props.style||{},sketchEdge:{color:[t[0]/255,t[1]/255,t[2]/255,(t[3]??255)/255*this.props.opacity]}}),this.state.model.draw(e)}finalizeState(e){this.state.model?.destroy(),this.state.corners?.destroy(),super.finalizeState(e)}},R_=`
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
`,z_=`#version 300 es
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
`,B_=`#version 300 es
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
`,V_={minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},H_={minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},U_=new Set([`color`,`normalRoughness`,`velocity`,`depth`]),W_=new Set([`rgba8unorm`,`rgba8unorm-srgb`,`rgba8snorm`,`bgra8unorm`,`bgra8unorm-srgb`,`rgb10a2uint`,`rgb10a2unorm`,`rg11b10ufloat`]),G_=0,K_=class{device;id;props;renderTargets;constructor(e,t){if(e.type!==`webgpu`)throw Error(`GBuffer requires a WebGPU device.`);this.device=e,this.id=t.id||rv(`g-buffer`),this.props=q_(this.id,t),J_(e,this.props),this.renderTargets=ev(e,this.props)}get framebuffer(){return this.renderTargets.framebuffer}get colorTexture(){return this.renderTargets.colorTexture}get normalRoughnessTexture(){return this.renderTargets.normalRoughnessTexture}get velocityTexture(){let e=this.renderTargets.velocityTexture;if(!e)throw Error(`GBuffer velocity attachment is disabled.`);return e}get depthTexture(){return this.renderTargets.depthTexture}get width(){return this.renderTargets.framebuffer.width}get height(){return this.renderTargets.framebuffer.height}getShaderPassBindings(){return{depthTexture:this.depthTexture,normalTexture:this.normalRoughnessTexture,velocityTexture:this.velocityTexture}}getExtraColorTexture(e){let t=this.renderTargets.extraColorTextures.get(e);if(!t)throw Error(`GBuffer has no extra color attachment named "`+e+`".`);return t}resize(e){if(Z_(e.width,e.height),e.width===this.width&&e.height===this.height)return!1;let t=this.renderTargets;return this.renderTargets=ev(this.device,{...this.props,width:e.width,height:e.height}),nv(t),!0}destroy(){nv(this.renderTargets)}};function q_(e,t){return{id:e,width:t.width,height:t.height,colorFormat:t.colorFormat||`rgba8unorm`,normalRoughnessFormat:t.normalRoughnessFormat||`rgba8unorm`,velocity:t.velocity??!0,velocityFormat:t.velocityFormat||`rg16float`,depthStencilFormat:t.depthStencilFormat||`depth24plus`,extraColorAttachments:t.extraColorAttachments||[]}}function J_(e,t){Z_(t.width,t.height);let n=[t.colorFormat,t.normalRoughnessFormat,...t.velocity?[t.velocityFormat]:[],...t.extraColorAttachments.map(e=>e.format)],r=n.length;if(r>e.limits.maxColorAttachments)throw Error(`GBuffer requires `+r+` color attachments, but the device supports `+e.limits.maxColorAttachments+`.`);Q_(e,t.colorFormat,`color`),Q_(e,t.normalRoughnessFormat,`normalRoughness`),t.velocity&&Q_(e,t.velocityFormat,`velocity`),$_(e,t.depthStencilFormat,`depth`);let i=new Set;for(let n of t.extraColorAttachments){if(!n.name)throw Error(`GBuffer extra color attachment name is required.`);if(U_.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is reserved.`);if(i.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is duplicated.`);i.add(n.name),Q_(e,n.format,n.name)}let a=Y_(e,n);if(a>e.limits.maxColorAttachmentBytesPerSample)throw Error(`GBuffer color attachments require `+a+` bytes per sample, but the device supports `+e.limits.maxColorAttachmentBytesPerSample+`.`)}function Y_(e,t){let n=0;for(let r of t){let t=X_(r);n=Math.ceil(n/t)*t;let i=e.getTextureFormatInfo(r).bytesPerPixel;n+=W_.has(r)?8:i}return n}function X_(e){return e.startsWith(`r8`)||e.startsWith(`rg8`)||e.startsWith(`rgba8`)||e.startsWith(`bgra8`)?1:e.startsWith(`r16`)||e.startsWith(`rg16`)||e.startsWith(`rgba16`)?2:4}function Z_(e,t){if(!Number.isSafeInteger(e)||!Number.isSafeInteger(t)||e<=0||t<=0)throw Error(`GBuffer size must use positive safe integer dimensions.`)}function Q_(e,t,n){if(!e.getTextureFormatCapabilities(t).render)throw Error(`GBuffer attachment "`+n+`" requires renderable format `+t+`.`)}function $_(e,t,n){if(!e.getTextureFormatCapabilities(t).create)throw Error(`GBuffer attachment "`+n+`" requires supported format `+t+`.`)}function ev(e,t){let n=tv(e,t,`color`,t.colorFormat),r=tv(e,t,`normal-roughness`,t.normalRoughnessFormat),i=t.velocity?tv(e,t,`velocity`,t.velocityFormat):void 0,a=new Map(t.extraColorAttachments.map(n=>[n.name,tv(e,t,n.name,n.format,n.sampler)])),o=e.createTexture({id:t.id+`-depth`,format:t.depthStencilFormat,width:t.width,height:t.height,usage:C.SAMPLE|C.RENDER|C.COPY_DST,sampler:H_});return{framebuffer:e.createFramebuffer({id:t.id+`-framebuffer`,width:t.width,height:t.height,colorAttachments:[n,r,...i?[i]:[],...a.values()],depthStencilAttachment:o}),colorTexture:n,normalRoughnessTexture:r,velocityTexture:i,depthTexture:o,extraColorTextures:a}}function tv(e,t,n,r,i=V_){return e.createTexture({id:t.id+`-`+n,format:r,width:t.width,height:t.height,usage:C.SAMPLE|C.RENDER|C.COPY_DST,sampler:i})}function nv(e){e.framebuffer.destroy(),e.colorTexture.destroy(),e.normalRoughnessTexture.destroy(),e.velocityTexture?.destroy(),e.depthTexture.destroy();for(let t of e.extraColorTextures.values())t.destroy()}function rv(e){return G_+=1,e+`-`+G_}function iv(e,t=[0,0,0]){let n=e.distanceScales.unitsPerMeter,r=n[2]*Math.hypot(e.viewMatrix[8],e.viewMatrix[9],e.viewMatrix[10]),i=new L([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]),a=new L(i).multiplyRight(e.projectionMatrix).scale(r),o=e.projectPosition([...t]),s=new L().scale(1/r).multiplyRight(e.viewMatrix).translate(o).scale(n),c=new L(i).multiplyRight(e.viewProjectionMatrix);return{projectionMatrix:a,inverseProjectionMatrix:new L(a).invert(),viewMatrix:s,inverseViewMatrix:new L(s).invert(),viewProjectionMatrix:c,inverseViewProjectionMatrix:new L(c).invert(),nearPlane:e.projectionMatrix[14]/r/(e.projectionMatrix[10]-1),farPlane:e.projectionMatrix[14]/r/(e.projectionMatrix[10]+1)}}var av={name:`cameraMotion`,source:`struct CameraMotionUniforms {
    currentClipToPreviousClip: mat4x4f,
    viewportBounds: vec4f,
    textureSize: vec2f,
  };
  @group(3) @binding(auto) var<uniform> cameraMotion: CameraMotionUniforms;`,uniformTypes:{currentClipToPreviousClip:`mat4x4<f32>`,viewportBounds:`vec4<f32>`,textureSize:`vec2<f32>`},defaultUniforms:{currentClipToPreviousClip:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],viewportBounds:[0,0,1,1],textureSize:[1,1]}},ov=class{model;constructor(e){this.device=e,this.model=new j(e,{id:`scene-camera-velocity`,source:sv,modules:[av],vertexCount:3,parameters:{depthWriteEnabled:!1,depthCompare:`always`,blend:!1}})}render(e,t,n,r){this.model.setBindings({depthTexture:t}),this.model.shaderInputs.setProps({cameraMotion:{currentClipToPreviousClip:n,viewportBounds:r,textureSize:[e.width,e.height]}});let i=this.device.beginRenderPass({framebuffer:e,clearColor:[0,0,0,0],clearDepth:!1,depthReadOnly:!0});this.model.draw(i),i.end(),i.destroy()}destroy(){this.model.destroy()}},sv=`
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
}`,cv=class{id;props;useInPicking=!1;device;capturePass;velocityModel;views=new Map;frameIndex=0;constructor(e){this.props=e,this.id=e.id||`scene-buffers`}setup({device:e}){m(e.type===`webgpu`),this.device=e,this.props.motionVectors&&(this.velocityModel=new ov(e)),this.capturePass=new lv(e,{id:`${this.id}-capture`},this.props.getLayerOptions)}getFrame(e){return this.views.get(e)?.frame}resetHistory(e){for(let[t,n]of this.views)(e===void 0||e===t)&&(n.historyInvalidated=!0)}getShaderModuleProps(e){let t=this.props.getLayerOptions(e);return{...t?.surfaceBuffer?{surfaceBuffer:{enabled:0}}:{},...t?.motionBuffer?{motionBuffer:{enabled:0}}:{}}}preRender(e){if(e.isPicking||!this.device||!this.capturePass)return;let t=e.canvasContext||this.device.getCanvasContext(),[n,r]=t.getDrawingBufferSize();if(n<=0||r<=0)return;let i=new Set(e.viewports.filter(e=>e.width>0&&e.height>0).map(e=>e.id));for(let[e,t]of this.views)i.has(e)||(uv(t),this.views.delete(e));let a=this.props.getTime?.()??0,o=e.effects?.filter(e=>e!==this),s={...e,canvasContext:t,effects:o,isPicking:!1,views:void 0,clearColor:void 0};for(let i of e.viewports){if(i.width<=0||i.height<=0)continue;let o=this.views.get(i.id);if(!o||o.slots[0].buffer.width!==n||o.slots[0].buffer.height!==r){let e=this.createCapture(i.id,n,r);o&&uv(o),o=e,this.views.set(i.id,o)}let c=t.cssToDeviceRatio(),l=[i.x*c,i.y*c,i.width*c,i.height*c],u=!o.historyInvalidated&&o.frame?.viewportBounds.every((e,t)=>e===l[t])?o.frame:void 0,d=iv(i),f=new L(u?new L([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(u.viewProjectionMatrix):d.viewProjectionMatrix).multiplyRight(d.inverseViewProjectionMatrix);this.capturePass.motionProps={enabled:0,currentClipToPreviousClip:f,previousTime:u?.time??a,viewportScale:[l[2]/n,l[3]/r]};let p=this.props.history&&o.completedIndex===0?1:0,m=o.slots[p],h={...s,viewports:[i]};this.capturePass.viewParameters=e.views?.[i.id]?.props.parameters||{};let g=e.layers.flatMap(e=>e.getModels().map(e=>({model:e,parameters:{...e.parameters}})));try{this.capturePass.captureMode=`opaque`,this.capturePass.render({...h,pass:`${this.id}-opaque`,target:m.colorFramebuffer,clearCanvas:!0,clearColor:this.props.clearColor??[0,0,0,0]}),this.capturePass.captureMode=`normal`,this.capturePass.render({...h,pass:`${this.id}-normal`,target:m.normalFramebuffer,clearCanvas:!1,clearColor:[.5,.5,1,1]}),m.selectionFramebuffer&&(this.capturePass.captureMode=`selection`,this.capturePass.render({...h,pass:`${this.id}-selection`,target:m.selectionFramebuffer,clearCanvas:!1,clearColor:[0,0,0,0]})),m.velocityFramebuffer&&(this.velocityModel.render(m.velocityFramebuffer,m.buffer.depthTexture,f,l),this.capturePass.captureMode=`velocity`,this.capturePass.render({...h,pass:`${this.id}-velocity`,target:m.velocityFramebuffer,clearCanvas:!1,clearColor:void 0})),this.capturePass.captureMode=`transparent`,this.capturePass.render({...h,pass:`${this.id}-transparent`,target:m.colorFramebuffer,clearCanvas:!1})}finally{for(let{model:e,parameters:t}of g)e.setParameters(t);for(let t of e.layers)this.props.getLayerOptions(t)?.surfaceBuffer&&t.setShaderModuleProps({surfaceBuffer:{enabled:0}}),this.props.getLayerOptions(t)?.motionBuffer&&t.setShaderModuleProps({motionBuffer:{enabled:0}})}o.frame={buffer:m.buffer,previousBuffer:this.props.history?u?.buffer:void 0,viewProjectionMatrix:[...i.viewProjectionMatrix],previousViewProjectionMatrix:u?.viewProjectionMatrix,viewportBounds:l,frameIndex:this.frameIndex,historyValid:!!u,time:a,previousTime:u?.time??a},o.completedIndex=p,o.historyInvalidated=!1}this.frameIndex++}cleanup(){for(let e of this.views.values())uv(e);this.views.clear(),this.velocityModel?.destroy(),this.velocityModel=void 0,this.capturePass?.cleanup(),this.capturePass=void 0,this.device=void 0}createCapture(e,t,n){let r=[];try{for(let i=0;i<(this.props.history?2:1);i++){let a=new K_(this.device,{id:`${this.id}-${e}-${i}`,width:t,height:n,colorFormat:this.props.colorFormat||`rgba16float`,velocity:this.props.motionVectors??!1,extraColorAttachments:this.props.selection?[{name:`selection`,format:`r8unorm`}]:[]}),o=[];try{for(let e of[a.colorTexture,a.normalRoughnessTexture,...this.props.selection?[a.getExtraColorTexture(`selection`)]:[],...this.props.motionVectors?[a.velocityTexture]:[]])o.push(this.device.createFramebuffer({width:t,height:n,colorAttachments:[e],depthStencilAttachment:a.depthTexture}));r.push({buffer:a,colorFramebuffer:o[0],normalFramebuffer:o[1],selectionFramebuffer:this.props.selection?o[2]:void 0,velocityFramebuffer:this.props.motionVectors?o[this.props.selection?3:2]:void 0})}catch(e){for(let e of o)e.destroy();throw a.destroy(),e}}return{slots:r,historyInvalidated:!0}}catch(e){throw uv({slots:r,historyInvalidated:!0}),e}}},lv=class extends bu{captureMode=`opaque`;viewParameters={};motionProps={};constructor(e,t,n){super(e,t),this.getLayerOptions=n}shouldDrawLayer(e){let t=this.getLayerOptions(e);return t?this.captureMode===`velocity`?!!t.motionBuffer:this.captureMode===`normal`||this.captureMode===`selection`?t.mode===`opaque`&&!!t.surfaceBuffer&&(this.captureMode!==`selection`||!!t.selected):t.mode===this.captureMode:!1}getShaderModuleProps(e){let t=this.getLayerOptions(e);return{...t?.motionBuffer?{motionBuffer:{...this.motionProps,enabled:this.captureMode===`velocity`?1:0}}:{},...t?.surfaceBuffer?{surfaceBuffer:{enabled:this.captureMode===`normal`?1:this.captureMode===`selection`?2:0,viewMatrix:e.context.viewport.viewMatrix}}:{}}}getLayerParameters(e,t,n){let r={...this.viewParameters,...e.props.parameters};return this.captureMode===`transparent`?{...r,depthCompare:`less-equal`,depthWriteEnabled:!1}:{...r,depthCompare:`less-equal`,depthWriteEnabled:this.captureMode===`opaque`,blend:!1,blendColorOperation:`add`,blendAlphaOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`zero`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`zero`}}};function uv(e){for(let t of e.slots)t.colorFramebuffer.destroy(),t.normalFramebuffer.destroy(),t.selectionFramebuffer?.destroy(),t.velocityFramebuffer?.destroy(),t.buffer.destroy()}var dv=`core-features-and-limits`,fv=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function pv(e){let t={};for(let n of fv){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function mv(e){return e.featureLevel??`core`}function hv(e){let t=mv(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!==`default`&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function gv(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(dv)&&r.push(dv);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function _v(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(dv)?`core`:e===`best-available`?`compatibility`:e}function vv(e,t){return e===`core`?`core`:_v(`compatibility`,t)}var yv=new class extends Li{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){return await this._create(e,!0)}async _create(e,t){if(typeof navigator>`u`||!navigator.gpu)throw Error(`WebGPU is not available`);let n=mv(e),r=hv(e),i;try{i=await this.requestGPUAdapter(r)}catch(e){throw Error(`WebGPU adapter request failed`,{cause:e})}if(!i)throw Error(`Failed to request WebGPU adapter`);let a=await bv(i),o={},s=gv(i.features,n,e.optionalFeatures);s.length>0&&(o.requiredFeatures=s);let c={...n===`max`?pv(i.limits):{},...e.requiredLimits};Object.keys(c).length>0&&(o.requiredLimits=c);let l;try{l=await i.requestDevice(o)}catch(e){throw Error(`WebGPU device request failed`,{cause:e})}let d=await xv(l);if(d){if(l.destroy(),t&&d.reason!==`destroyed`)return u.warn(`WebGPU device was returned already lost; retrying with a fresh adapter`)(),await this._create(e,!1);throw Error(`WebGPU device was returned already lost${d.message?`: ${d.message}`:``}`,{cause:d})}let{WebGPUDevice:f}=await mm(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-D0kXGLDL.js`);return{WebGPUDevice:e}},__vite__mapDeps([15,3,1,9,5,11])),p=_v(n,l.features),m={...e,featureLevel:p};u.groupCollapsed(1,`WebGPUDevice created`)();try{let e;try{e=new f(m,l,i,a)}catch(e){throw l.destroy(),Error(`WebGPU wrapper initialization failed`,{cause:e})}let t=f.getCanvasContextProps(m);if(t)try{e.initializeCanvasContext(t)}catch(t){throw e.destroy(),Error(`WebGPU canvas initialization failed`,{cause:t})}return u.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),u.table(1,e.info)(),e}finally{u.groupEnd(1)()}}async attach(e,t={}){let{WebGPUDevice:n}=await mm(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-D0kXGLDL.js`);return{WebGPUDevice:e}},__vite__mapDeps([15,3,1,9,5,11]));if(e instanceof n)return e;if(!this.isDeviceHandle(e))throw Error(`Invalid GPUDevice`);let r=n.getDeviceFromHandle(e);if(r)return r;let i=await xv(e);if(i)throw Error(`WebGPU device is already lost`,{cause:i});let a=n.getDeviceFromHandle(e);if(a)return a;let o=e.adapterInfo||{},s=vv(t.featureLevel,e.features),c={...t,featureLevel:s,_handle:e},l=new n(c,e,null,o,!1),u=n.getCanvasContextProps(c);if(u)try{l.initializeCanvasContext(u)}catch(e){throw l.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})}return l}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}};async function bv(e){try{return e.info||await e.requestAdapterInfo?.()||{}}catch(e){return u.warn(`WebGPU adapter metadata is unavailable`,e)(),{}}}async function xv(e){return await Promise.race([e.lost,Promise.resolve(null)])}function Sv(e){return{type:e,adapters:e===`webgpu`?[yv,vm]:[vm]}}function Cv({device:e,deviceType:t=`webgpu`}){return e?{device:e}:{deviceProps:Sv(t)}}var wv={maxPitch:85},Tv=[-74.006,40.7128,0];function Ev(){let e=[{name:`District`,kind:`ground`,center:[0,0,-3],size:[1050,1250,2],color:[.17,.23,.27]},{name:`River`,kind:`water`,center:[0,0,0],size:[170,1250,0],color:[.08,.39,.48]},{name:`North bridge`,kind:`bridge`,center:[0,275,8],size:[240,30,5],color:[.69,.76,.74]},{name:`South bridge`,kind:`bridge`,center:[0,-265,8],size:[240,30,5],color:[.69,.76,.74]}];for(let t of[-1,1])for(let n=0;n<8;n++)for(let r=0;r<3;r++){let i=[t*(122+r*135),n*135-470,0];if((n+r*2)%7==0)e.push({name:`Riverside garden ${e.length}`,kind:`park`,center:i,size:[78,85,1],color:[.25,.43,.35]});else{let a=25+(n*17+r*31+(t+1)*11)%100;e.push({name:`${t<0?`West`:`East`} ${n+1}.${r+1}`,kind:`building`,center:i,size:[65+r*5,72,a],color:r===0?[.83,.76,.61]:[.61,.71,.73]})}}return e}function Dv(e){let t=[];return e.forEach((e,n)=>{let[r,i,a]=e.center,[o,s,c]=e.size,l=r-o/2,u=r+o/2,d=i-s/2,f=i+s/2,p=a+c;m([[l,d,p],[u,d,p],[u,f,p],[l,f,p]],[0,0,1]),c>0&&(m([[l,d,a],[u,d,a],[u,d,p],[l,d,p]],[0,-1,0]),m([[u,d,a],[u,f,a],[u,f,p],[u,d,p]],[1,0,0]),m([[u,f,a],[l,f,a],[l,f,p],[u,f,p]],[0,1,0]),m([[l,f,a],[l,d,a],[l,d,p],[l,f,p]],[-1,0,0]));function m(r,i){for(let a of[0,1,2,0,2,3])t.push(...r[a],...i,...e.color,n)}}),new Float32Array(t)}var Ov=class extends m_{static layerName=`RiverDistrictLayer`;static defaultProps={fog:{},roughness:1,surfaceWeather:{},parameters:{depthCompare:`less-equal`,depthWriteEnabled:!0,cullMode:`none`}};getAttributeManager(){return null}initializeState(){}updateState({props:e,oldProps:t}){if(this.state.model&&e.features===t.features)return;this.destroyMesh();let n=Dv(e.features),r=this.context.device.createBuffer({data:n}),i=new Float32Array(n.length/10);for(let t=0;t<i.length;t++)i[t]=e.features[n[t*10+9]].kind===`water`?0:1;let a=this.context.device.createBuffer({data:i});try{let e=new j(this.context.device,{...this.getShaders({source:Av,vs:jv,fs:Mv,modules:[ol,iu,jo,Vo,Uo,A_,kv]}),id:`${this.id}-mesh`,topology:`triangle-list`,vertexCount:n.length/10,bufferLayout:[{name:`vertices`,byteStride:40,attributes:[{attribute:`position`,format:`float32x3`,byteOffset:0},{attribute:`normal`,format:`float32x3`,byteOffset:12},{attribute:`color`,format:`float32x3`,byteOffset:24},{attribute:`featureIndex`,format:`float32`,byteOffset:36}]},{name:`surfaceExposure`,format:`float32`}],attributes:{vertices:r,surfaceExposure:a},parameters:{depthCompare:`less-equal`,depthWriteEnabled:!0,cullMode:`none`}});this.setState({model:e,vertices:r,surfaceExposure:a})}catch(e){throw r.destroy(),a.destroy(),e}}getModels(){return this.state.model?[this.state.model]:[]}draw({renderPass:e}){this.state.model?.shaderInputs.setProps({heightFog:{...Vo.defaultUniforms,...typeof this.props.fog==`function`?this.props.fog():this.props.fog},surfaceWeather:{...Uo.defaultUniforms,...typeof this.props.surfaceWeather==`function`?this.props.surfaceWeather():this.props.surfaceWeather},districtMesh:{roughness:this.props.roughness,cameraPosition:j_(this.context.viewport,this.props.coordinateOrigin,this.context.viewport.cameraPosition)},lambertMaterial:{ambient:.45,diffuse:.55,...this.props.material},lighting:this.props.lighting?typeof this.props.lighting==`function`?this.props.lighting():this.props.lighting:{enabled:!0,lights:[{type:`ambient`,color:[255,255,255],intensity:1},{type:`directional`,color:[255,255,255],intensity:1,direction:[.5,.3,-.8]}]}}),this.state.model?.draw(e)}getPickingInfo({info:e}){return e.object=this.props.features[e.index],e}finalizeState(e){this.destroyMesh(),super.finalizeState(e)}destroyMesh(){this.state.model?.destroy(),this.state.vertices?.destroy(),this.state.surfaceExposure?.destroy(),this.setState({model:void 0,vertices:void 0,surfaceExposure:void 0})}},kv={name:`districtMesh`,bindingLayout:[{name:`districtMesh`,group:3}],source:`struct DistrictMeshUniforms {
  roughness: f32,
  cameraPosition: vec3f,
};
@group(3) @binding(auto) var<uniform> districtMesh: DistrictMeshUniforms;`,fs:`layout(std140) uniform districtMeshUniforms {
  float roughness;
  vec3 cameraPosition;
} districtMesh;`,uniformTypes:{roughness:`f32`,cameraPosition:`vec3<f32>`},defaultUniforms:{roughness:1,cameraPosition:[0,0,0]}},Av=`
struct CityVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) @interpolate(flat) pickingColor: vec3<f32>,
  @location(2) worldPosition: vec3<f32>,
  @location(3) normal: vec3<f32>,
  @location(4) commonNormal: vec3<f32>,
  @location(5) exposure: f32,
};
@vertex fn vertexMain(
  @location(0) position: vec3<f32>, @location(1) normal: vec3<f32>,
  @location(2) color: vec3<f32>, @location(3) featureIndex: f32, @location(4) surfaceExposure: f32
) -> CityVertex {
  var output: CityVertex;
  output.position = project_position_to_clipspace(position, vec3<f32>(0.0), vec3<f32>(0.0));
  output.worldPosition = position;
  output.normal = normal;
  output.commonNormal = project_normal(normal);
  output.color = color;
  output.exposure = surfaceExposure;
  output.pickingColor = picking_getPickingColorFromIndex(u32(featureIndex));
  return output;
}
@fragment fn fragmentMain(input: CityVertex) -> @location(0) vec4<f32> {
  if (surfaceBuffer.enabled != 0) {
    return surfaceBuffer_encode(input.commonNormal, surfaceWeather_getRoughness(districtMesh.roughness, input.worldPosition, input.normal, input.exposure));
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
  if (picking.isHighlightActive > 0.5 && distance(input.pickingColor, picking_normalizeColor(picking.highlightedObjectColor)) < 0.00001) {
    color = mix(color, picking.highlightColor.rgb, picking.highlightColor.a);
  }
  return heightFog_getColor(vec4<f32>(color, layer.opacity), input.worldPosition, cameraPosition);
}
`,jv=`#version 300 es
in vec3 position;
in vec3 normal;
in vec3 color;
in float featureIndex;
in float surfaceExposure;
out float exposure;
out vec4 vertexColor;
out vec3 worldPosition;
out vec3 worldNormal;
out vec3 commonNormal;
void main() {
  worldPosition = position;
  exposure = surfaceExposure;
  worldNormal = normal;
  commonNormal = project_normal(normal);
  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(featureIndex);
  gl_Position = project_position_to_clipspace(position, vec3(0.0), vec3(0.0));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  vertexColor = vec4(color, layer.opacity);
  DECKGL_FILTER_COLOR(vertexColor, geometry);
}
`,Mv=`#version 300 es
precision highp float;
in vec4 vertexColor;
in vec3 worldPosition;
in vec3 worldNormal;
in vec3 commonNormal;
in float exposure;
out vec4 fragColor;
void main() {
  if (surfaceBuffer.enabled != 0) {
    fragColor = surfaceBuffer_encode(commonNormal, surfaceWeather_getRoughness(districtMesh.roughness, worldPosition, worldNormal, exposure));
    return;
  }
  vec3 albedo = surfaceWeather_getAlbedo(vertexColor.rgb, worldPosition, worldNormal, exposure);
  vec3 color = lighting_getLightColor(albedo, districtMesh.cameraPosition, worldPosition, normalize(worldNormal));
  color += surfaceWeather_getReflection(worldPosition, worldNormal, districtMesh.cameraPosition,
    vec3(-0.5, -0.3, 0.8), vec3(1.0), exposure);
  fragColor = heightFog_getColor(vec4(color, vertexColor.a), worldPosition, districtMesh.cameraPosition);
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;function Nv(){return Ev().map((e,t)=>({...e,id:t})).filter(e=>e.kind===`building`)}function Pv(e,t={}){let n=[];return e.forEach((e,r)=>{let i=Dv([e]),a=new Float32Array(i.length/10*3);for(let e=0;e<i.length;e+=10)a.set(i.subarray(e,e+3),e/10*3);let o=zd(new O({topology:`triangle-list`,attributes:{POSITION:a}}),t).indices.value;for(let t=0;t<o.length;t+=2){let i=o[t]*3,s=o[t+1]*3;n.push(...a.subarray(i,i+3),...a.subarray(s,s+3),r,e.id*37+t/2+1)}}),new Float32Array(n)}var Fv=`
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
`,Iv=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],Lv={name:`ssrCameraTemporal`,source:`
${Fv}
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
`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0},{name:`historyTexture`,group:0},{name:`previousDepthTexture`,group:0},{name:`previousNormalTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{currentClipToPreviousClip:`mat4x4<f32>`,currentViewToPreviousView:`mat4x4<f32>`,previousInverseProjectionMatrix:`mat4x4<f32>`,historyWeight:`f32`,depthThreshold:`f32`,normalThreshold:`f32`},propTypes:{currentClipToPreviousClip:{value:Iv,private:!0},currentViewToPreviousView:{value:Iv,private:!0},previousInverseProjectionMatrix:{value:Iv,private:!0},historyWeight:{value:.8,min:0,max:.97},depthThreshold:{value:.01,min:1e-4,max:.1},normalThreshold:{value:.96,min:-1,max:1}},passes:[{sampler:!0}]},Rv={name:`ssrNormalHistoryCopy`,source:`
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
fn ssrNormalHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler,
  texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let dimensions = textureDimensions(normalTexture);
  let coordinate = clamp(vec2i(texCoord * vec2f(dimensions)), vec2i(0), vec2i(dimensions) - vec2i(1));
  return textureLoad(normalTexture, coordinate, 0);
}`,bindingLayout:[{name:`normalTexture`,group:0}],passes:[{sampler:!0}]},zv={name:`ssrCameraDepthHistoryCopy`,source:`
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
}`,bindingLayout:[{name:`depthTexture`,group:0}],passes:[{sampler:!0}]},Bv={fast:{resolutionScale:.25,sampleCount:32,maxRadius:3,historyWeight:.9},balanced:{resolutionScale:.5,sampleCount:96,maxRadius:2,historyWeight:.8},detailed:{resolutionScale:1,sampleCount:96,maxRadius:2,historyWeight:.8}},Vv=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],Hv={name:`ssrTrace`,source:`const SSR_TWO_PI: f32 = 6.283185307179586;

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
}`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{projectionMatrix:`mat4x4<f32>`,inverseProjectionMatrix:`mat4x4<f32>`,intensity:`f32`,maxDistance:`f32`,thickness:`f32`,sampleCount:`f32`,maxRoughness:`f32`,frameIndex:`f32`},propTypes:{projectionMatrix:{value:Vv,private:!0},inverseProjectionMatrix:{value:Vv,private:!0},intensity:{value:1.35,min:0,softMax:4},maxDistance:{value:60,min:1,softMax:180},thickness:{value:.45,min:.02,softMax:3},sampleCount:{value:48,min:8,max:96},maxRoughness:{value:.88,min:.1,max:1},frameIndex:{value:0,private:!0}},passes:[{sampler:!0}]},Uv={name:`ssrTemporal`,source:`\
${Fv}
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
}`,bindingLayout:[{name:`historyTexture`,group:0},{name:`velocityTexture`,group:0},{name:`depthTexture`,group:0},{name:`previousDepthTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseProjectionMatrix:`mat4x4<f32>`,historyWeight:`f32`,depthThreshold:`f32`},propTypes:{inverseProjectionMatrix:{value:Vv,private:!0},historyWeight:{value:.86,min:0,max:.97},depthThreshold:{value:.018,min:1e-4,softMax:.1}},passes:[{sampler:!0}]},Wv={name:`ssrDepthHistoryCopy`,source:`@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn ssrDepthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  return vec4f(depth, 0.0, 0.0, 1.0);
}`,bindingLayout:[{name:`depthTexture`,group:0}],passes:[{sampler:!0}]},Gv={name:`ssrSpatial`,source:`struct SSRSpatialUniforms {
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
}`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseProjectionMatrix:`mat4x4<f32>`,direction:`vec2<f32>`,maxRadius:`f32`,depthSigma:`f32`},propTypes:{inverseProjectionMatrix:{value:Vv,private:!0},direction:{value:[1,0]},maxRadius:{value:5,min:0,max:8},depthSigma:{value:.035,min:1e-4,softMax:.2}},passes:[{sampler:!0}]},Kv={name:`ssrComposite`,source:`struct SSRCompositeUniforms {
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
}`,bindingLayout:[{name:`reflectionTexture`,group:0},{name:`depthTexture`,group:0},{name:`normalTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseProjectionMatrix:`mat4x4<f32>`,strength:`f32`,debugMode:`f32`,depthSigma:`f32`},propTypes:{inverseProjectionMatrix:{value:Vv,private:!0},strength:{value:1,min:0,softMax:2},debugMode:{value:0,min:0,max:2,private:!0},depthSigma:{value:.04,min:1e-4,softMax:.2}},passes:[{sampler:!0}]};function qv(e={}){let t=e.quality?Bv[e.quality]:void 0,n=e.resolutionScale??t?.resolutionScale??1,r=e.reprojection===`camera`,i=t?{maxRadius:t.maxRadius}:{};return{name:`ssrCompositeShaderPass`,renderTargets:{ssrRaw:{scale:[n,n],format:`rgba16float`},ssrHistory:{scale:[n,n],format:`rgba16float`,lifetime:`history`,initialize:{clearColor:[0,0,0,0]}},ssrHistoryDepth:r?{format:`rgba8unorm`,lifetime:`history`,initialize:{clearColor:[1,1,1,1]}}:{scale:[n,n],format:`rgba16float`,lifetime:`history`,initialize:{clearColor:[1,0,0,1]}},...r?{ssrHistoryNormal:{format:`rgba8unorm`,lifetime:`history`,initialize:{clearColor:[.5,.5,1,1]}}}:{},ssrScratch:{scale:[n,n],format:`rgba16float`},ssrReflection:{scale:[n,n],format:`rgba16float`}},steps:[{shaderPass:Hv,inputs:{sourceTexture:`previous`},output:`ssrRaw`,uniforms:t?{sampleCount:t.sampleCount}:void 0},{shaderPass:r?Lv:Uv,inputs:{sourceTexture:`ssrRaw`,historyTexture:`ssrHistory`,previousDepthTexture:`ssrHistoryDepth`,...r?{previousNormalTexture:`ssrHistoryNormal`}:{}},output:`ssrHistory`,uniforms:t?{historyWeight:t.historyWeight}:void 0},{shaderPass:r?zv:Wv,inputs:{sourceTexture:`previous`},output:`ssrHistoryDepth`},...r?[{shaderPass:Rv,inputs:{sourceTexture:`previous`},output:`ssrHistoryNormal`}]:[],{shaderPass:Gv,inputs:{sourceTexture:`ssrHistory`},output:`ssrScratch`,uniforms:{...i,direction:[1,0]}},{shaderPass:Gv,inputs:{sourceTexture:`ssrScratch`},output:`ssrReflection`,uniforms:{...i,direction:[0,1]}},{shaderPass:Kv,inputs:{sourceTexture:`previous`,reflectionTexture:`ssrReflection`},output:`previous`}]}}var Jv=class{id;props={};useInPicking=!1;frameCount=0;debugMode=0;historyFrames=0;quality=`balanced`;stableFrames=0;previousViewProjection=null;previousView=null;previousInverseProjection=null;device=null;renderer=null;capturedColor=null;presenter=null;constructor(e,t=`city-river-reflections`,n=1.5,r={}){this.capture=e,this.reflectionIntensity=n,this.passOptions=r,this.id=t}setup({device:e}){this.device=e,this.renderer=this.createRenderer(e)}setQuality(e){e!==this.quality&&(this.quality=e,this.resetHistory(),this.renderer?.destroy(),this.presenter?.destroy(),this.presenter=null,this.capturedColor=null,this.renderer=this.device?this.createRenderer(this.device):null)}get settlingFrameCount(){return 1+Math.ceil(Math.log(.01)/Math.log(Bv[this.quality].historyWeight))}get needsRedraw(){return!!this.renderer&&this.stableFrames<this.settlingFrameCount}requestConvergence(){this.stableFrames=0}setReflectionIntensity(e){this.reflectionIntensity=e,this.resetHistory()}createRenderer(e){return new Zd(e,{shaderPasses:[...this.passOptions.beforeReflection??[],qv({reprojection:`camera`,quality:this.quality}),...this.passOptions.afterReflection??[]],colorFormat:`rgba16float`,flipY:!0})}preRender(e){}postRender(e){let t=this.device,n=this.renderer,r=e.viewports[0];if(!r)return e.inputBuffer;let i=this.capture.getFrame(r.id);if(!i)return e.inputBuffer;let{buffer:a}=i,{width:o,height:s}=a;this.capturedColor!==a.colorTexture&&(this.capturedColor=a.colorTexture,n.resize([o,s]),this.resetHistory());let c=t.commandEncoder,l=[0,0,o,s],u=r.viewMatrix,d=r.distanceScales.unitsPerMeter[2]*Math.hypot(u[8],u[9],u[10]),f=new L([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(r.projectionMatrix).scale(d),p=new L(f).invert(),m=new L(new L([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1])).multiplyRight(r.viewProjectionMatrix);this.previousViewProjection&&m.some((e,t)=>e!==this.previousViewProjection[t])&&this.requestConvergence();let h=this.previousViewProjection?new L(this.previousViewProjection).multiplyRight(new L(m).invert()):new L;h.some((e,t)=>Math.abs(e-(t%5==0?1:0))>.5)&&this.resetHistory();let g=n.renderToTexture({sourceTexture:a.colorTexture,bindings:{depthTexture:a.depthTexture,normalTexture:a.normalRoughnessTexture},uniforms:{...this.passOptions.getUniforms?.(r),ssrTrace:{projectionMatrix:f,inverseProjectionMatrix:p,intensity:this.reflectionIntensity,maxDistance:450,thickness:1.5,maxRoughness:.8,frameIndex:this.historyFrames},ssrCameraTemporal:{currentClipToPreviousClip:h,currentViewToPreviousView:this.previousView?new L(this.previousView).multiplyRight(new L(u).invert()):new L,previousInverseProjectionMatrix:this.previousInverseProjection??p,...this.historyFrames?{}:{historyWeight:0},depthThreshold:.01,normalThreshold:.96},ssrSpatial:{inverseProjectionMatrix:p},ssrComposite:{inverseProjectionMatrix:p,strength:this.debugMode===3?0:1,debugMode:this.debugMode===3?0:this.debugMode}}});if(!g)return e.inputBuffer;this.frameCount++,this.historyFrames++,this.stableFrames++,this.previousViewProjection=m,this.previousView=new L(u),this.previousInverseProjection=p,this.presenter??=new Rd(t,{id:`city-reflection-presenter`,backgroundTexture:g,flipY:!0}),this.presenter.setProps({backgroundTexture:g}),this.presenter.predraw(c);let _=e.target??t.getCanvasContext().getCurrentFramebuffer(),v=c.beginRenderPass({id:`city-reflection-composite`,framebuffer:_,parameters:{viewport:l},clearColor:!1,clearDepth:!1});return this.presenter.draw(v),v.end(),t.submit(),_}resetHistory(){this.renderer?.resetHistory(),this.historyFrames=0,this.requestConvergence(),this.previousViewProjection=null,this.previousView=null,this.previousInverseProjection=null}cleanup(){this.resetHistory(),this.renderer?.destroy(),this.presenter?.destroy(),this.capturedColor=null,this.renderer=null,this.presenter=null,this.device=null}},Yv={district:{longitude:Tv[0],latitude:Tv[1],zoom:15.6,pitch:52,bearing:-28},overhead:{longitude:Tv[0],latitude:Tv[1],zoom:15.5,pitch:0,bearing:0},waterfront:{longitude:Tv[0],latitude:Tv[1],zoom:16.3,pitch:68,bearing:15}};function Xv(e,t={}){let n=Ev(),r=Nv(),i=Pv(r),a={frames:0,backend:``,selected:``,finalized:!1,error:``,timeSeconds:0,waterEnabled:!0,buildingsVisible:!0,edgeStyle:`none`,waterStyle:`river`,reflectionsEnabled:!0,reflectionQuality:`balanced`,playing:!0},o=Promise.withResolvers(),s=n,c=n.filter(e=>e.kind!==`water`),l=null,u=null,d=2.2,f=.55,p=[11/255,66/255,82/255],m=null,h=null,g=n.filter(e=>e.kind===`water`),_=g[0],v=_&&Math.abs(_.size[0])>Math.abs(_.size[1])?[1,0]:[0,1],y=Dv(g),b=new Float32Array(y.length/10*3);for(let e=0,t=0;e<y.length;e+=10,t+=3)b.set(y.subarray(e,e+3),t);let x=new Cm({parent:e,...Cv(t),views:new Pp({id:`city`,controller:!0}),initialViewState:{...wv,...Yv.district},layers:[],_animate:!0,onLoad:()=>{S(),o.resolve()},onDeviceInitialized:e=>{a.backend=e.type,l=e.createBuffer({id:`river-positions`,data:b}),u=e.createBuffer({id:`city-building-edges`,data:i}),e.type===`webgpu`?(m=new Jv(new cv({id:`city-scene-buffers`,colorFormat:`rgba8unorm`,getLayerOptions:e=>e instanceof Ov||e instanceof M_?{mode:`opaque`,surfaceBuffer:!0}:e instanceof L_?{mode:`transparent`}:null})),T()):a.reflectionsEnabled=!1},onBeforeRender:()=>{let e=performance.now();a.playing&&a.waterEnabled&&(h!==null&&(a.timeSeconds+=Math.min(e-h,100)/1e3),h=e)},onAfterRender:()=>{a.frames++,w()},onError:t=>{a.error=t.message,o.reject(t),e.dispatchEvent(new CustomEvent(`city-error`,{detail:t.message}))},getTooltip:({object:e})=>e?`${e.name} · ${e.kind}`:null,onClick:({object:t})=>{a.selected=t?.name??``,e.dispatchEvent(new CustomEvent(`city-selection`,{detail:a.selected}))}});function S(){m?.resetHistory();let e=new Ov({id:`city-mesh`,features:a.waterEnabled?c:s,pickable:!0,autoHighlight:!0,highlightColor:[255,196,92,160],coordinateSystem:Lc.METER_OFFSETS,coordinateOrigin:Tv}),t=a.waterEnabled&&l?new M_({id:`river-water`,data:g,positions:l,vertexCount:b.length/3,coordinateOrigin:Tv,pickable:!0,autoHighlight:!0,highlightColor:[255,196,92,160],style:a.waterStyle,flowDirection:v,time:()=>a.timeSeconds,material:{baseColor:a.waterStyle===`river`?p:[.045,.26,.32],fresnelColor:a.waterStyle===`river`?p.map(e=>Math.min(e+.48,1)):[.7,.87,.92],normalStrength:f,coordinateScale:[.22,.22],waveASpeed:1.1,waveBSpeed:-.7,specularIntensity:.8}}):null;x.setProps({layers:[e,t,a.buildingsVisible&&a.edgeStyle!==`none`&&u?new L_({id:`city-building-edges`,segments:u,segmentCount:i.length/8,data:r,coordinateOrigin:Tv,pickable:!0,style:{width:d,sketch:a.edgeStyle===`pencil`?1:0,jitter:.85,variation:.65,grain:.6,extension:a.edgeStyle===`pencil`?4:0}}):null],_animate:C()})}function C(){return a.waterEnabled&&(a.playing||!!(a.reflectionsEnabled&&m?.needsRedraw))}function w(){let e=C();x.props._animate!==e&&x.setProps({_animate:e})}function T(){x.setProps({effects:a.reflectionsEnabled&&m?[m.capture,m]:[],_animate:C()})}return{deck:x,ready:o.promise,diagnostics:a,features:n,setCamera(e){m?.resetHistory(),x.setProps({initialViewState:{...wv,...Yv[e]},_animate:C()})},setEdgeStyle(e){a.edgeStyle=e,S()},setEdgeWidth(e){d=e,S()},setBuildingsVisible(e){a.buildingsVisible=e,s=e?n:n.filter(e=>e.kind!==`building`),c=s.filter(e=>e.kind!==`water`),S()},setWaterEnabled(e){a.waterEnabled=e,h=null,S()},setWaterStyle(e){a.waterStyle=e,S()},setReflectionsEnabled(e){a.reflectionsEnabled=e&&!!m,T()},setReflectionQuality(e){a.reflectionQuality=e,m?.setQuality(e),x.redraw(`reflection quality changed`)},setReflectionDebugMode(e){m&&(m.debugMode=e),x.redraw(`reflection debug view`)},setWaterColor(e){p=e,S()},setPlaying(e){a.playing=e,h=null,e||m?.requestConvergence(),w()},setTime(e){m?.resetHistory(),a.playing=!1,a.timeSeconds=e,h=null,x.setProps({_animate:!1}),x.redraw(`water time changed`)},setWaveStrength(e){f=e,S()},getFeatureScreenPosition(e){let t=x.props.layers?.find(e=>e instanceof Ov),n=s.find(t=>t.name===e);return!(t instanceof Ov)||!n?null:t.project([n.center[0],n.center[1],n.center[2]+n.size[2]])},finalize(){a.finalized||(a.finalized=!0,x.finalize(),l?.destroy(),l=null,u?.destroy(),u=null)}}}var Zv=document.querySelector(`#city`),Qv=document.querySelector(`#status`),$v=document.querySelector(`#selection`),ey=document.querySelector(`#backend`),ty=document.querySelector(`#camera`),ny=document.querySelector(`#buildings`),ry=document.querySelector(`#edge-style`),iy=document.querySelector(`#edge-width`),ay=document.querySelector(`#water`),oy=document.querySelector(`#reflection-quality`),sy=document.querySelector(`#reflections`),cy=document.querySelector(`#reflection-view`),ly=document.querySelector(`#water-style`),uy=document.querySelector(`#water-preset`),dy=document.querySelector(`#water-color`),fy=document.querySelector(`#strength`),py=document.querySelector(`#playback`);if(!Zv||!Qv||!$v||!ey||!ty||!ny||!ry||!iy||!ay||!sy||!oy||!cy||!ly||!uy||!dy||!fy||!py)throw Error(`Missing city scene controls`);var my=Zv,hy=Qv,gy=ty,_y=ny,vy=ey,yy=ry,by=iy,xy=ay,Sy=sy,Cy=oy,wy=cy,Ty=ly,Ey=uy,Dy=dy,Oy=fy,ky=py,$,Ay={teal:`#0b4252`,slate:`#67747a`,"deep-blue":`#205875`};function jy(e){return[Number.parseInt(e.slice(1,3),16)/255,Number.parseInt(e.slice(3,5),16)/255,Number.parseInt(e.slice(5,7),16)/255]}async function My(){$?.finalize(),document.body.dataset.ready=`false`,hy.value=`Preparing the district…`,$=Xv(my,{deviceType:vy.value===`webgl`?`webgl`:`webgpu`});let e=$;window.cityScene=$;try{if(await e.ready,$!==e)return;gy.value=`district`,_y.checked=!0,yy.value=`none`,by.value=`2.2`,by.disabled=!0,xy.checked=!0,Sy.disabled=$.diagnostics.backend!==`webgpu`,Sy.checked=!Sy.disabled,Sy.title=Sy.disabled?`Scene reflections require WebGPU`:``,Cy.disabled=Sy.disabled,Cy.value=`balanced`,wy.value=`0`,wy.disabled=Sy.disabled,Ty.value=`river`,Ey.value=`teal`,Dy.value=`#0b4252`,Oy.value=`0.55`,ky.textContent=`Pause waves`,hy.value=`${$.features.filter(e=>e.kind===`building`).length} buildings · local fixture`,document.body.dataset.ready=`true`}catch(t){if($!==e)return;hy.value=t instanceof Error?t.message:String(t),document.body.dataset.ready=`error`}}ey.addEventListener(`change`,()=>{My()}),ty.addEventListener(`change`,()=>{let e=gy.value;$.setCamera(e===`overhead`||e===`waterfront`?e:`district`)}),ny.addEventListener(`change`,()=>$.setBuildingsVisible(_y.checked)),ry.addEventListener(`change`,()=>{let e=yy.value;$.setEdgeStyle(e===`solid`||e===`pencil`?e:`none`),by.disabled=e===`none`}),iy.addEventListener(`input`,()=>$.setEdgeWidth(Number(by.value))),ay.addEventListener(`change`,()=>$.setWaterEnabled(xy.checked)),sy.addEventListener(`change`,()=>{$.setReflectionsEnabled(Sy.checked),Cy.disabled=!Sy.checked,wy.disabled=!Sy.checked}),cy.addEventListener(`change`,()=>$.setReflectionDebugMode(Number(wy.value))),oy.addEventListener(`change`,()=>{let e=Cy.value;$.setReflectionQuality(e===`fast`||e===`detailed`?e:`balanced`)}),ly.addEventListener(`change`,()=>$.setWaterStyle(Ty.value===`classic`?`classic`:`river`)),uy.addEventListener(`change`,()=>{let e=Ey.value;e in Ay&&(Dy.value=Ay[e],$.setWaterColor(jy(Dy.value)))}),dy.addEventListener(`input`,()=>{Ey.value=`custom`,$.setWaterColor(jy(Dy.value))}),fy.addEventListener(`input`,()=>$.setWaveStrength(Number(Oy.value))),py.addEventListener(`click`,()=>{$.setPlaying(!$.diagnostics.playing),ky.textContent=$.diagnostics.playing?`Pause waves`:`Play waves`}),Zv.addEventListener(`city-selection`,()=>{$v.value=$.diagnostics.selected||`Click a building or the river`}),Zv.addEventListener(`city-error`,()=>{hy.value=$.diagnostics.error,document.body.dataset.ready=`error`}),window.addEventListener(`pagehide`,()=>$.finalize());var Ny=new URLSearchParams(location.search).get(`backend`);(Ny===`webgl`||Ny===`webgpu`)&&(ey.value=Ny),My();