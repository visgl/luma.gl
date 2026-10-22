const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/webgl-device-hj0FA8UE.js","assets/shader-type-decoder-Bdse6Scz.js","assets/webgl-device-DuhQ1pWI.js","assets/buffer-layout-utils-Dgk4trQb.js","assets/get-attribute-from-layouts-B51EI0XP.js","assets/fence-Dj71R1zQ.js","assets/shader-block-layout-AGd2jUz5.js","assets/webgl-DsdTykkJ.js","assets/expression-ByeiNmDb.js","assets/wgsl-interface-scan-D-ju35lh.js","assets/buffer-transform-E6GrMvKI.js","assets/external-texture-BLF3u0Ck.js","assets/webgpu-BGeZZ9qZ.js","assets/webgpu-DgeGVOsc.js","assets/webgpu-device-ClLqdlI4.js"])))=>i.map(i=>d[i]);
import{t as e}from"./chunk-DtRyYLXJ.js";import{_ as t,f as n,l as r,m as i,o as a,y as o}from"./shader-type-decoder-Bdse6Scz.js";import{_ as s,g as c,h as l,m as u,u as d,v as f}from"./fence-Dj71R1zQ.js";import{d as p,f as m,l as h,u as g}from"./buffer-layout-utils-Dgk4trQb.js";import{t as _}from"./external-texture-BLF3u0Ck.js";import{i as v,n as y,r as b,t as x}from"./webgl-device-DuhQ1pWI.js";import{E as S,S as C,b as ee,c as w,d as te,i as ne,l as re,n as ie,o as ae,r as T,s as E,u as oe,v as se,y as ce}from"./expression-ByeiNmDb.js";import{a as le,i as ue,n as de,o as fe,r as pe,t as me}from"./buffer-transform-E6GrMvKI.js";import{$ as he,B as ge,F as _e,H as D,I as ve,J as ye,L as be,P as xe,Q as Se,R as Ce,V as we,X as Te,Z as Ee,_ as De,a as Oe,at as ke,b as Ae,c as je,d as Me,et as Ne,f as Pe,g as Fe,h as Ie,i as Le,it as O,j as Re,l as ze,m as Be,n as Ve,o as He,ot as Ue,p as We,r as Ge,s as Ke,t as qe,v as Je,x as k,y as Ye,z as Xe}from"./meshopt_decoder-DzCSxwZZ.js";import{a as Ze}from"./webgpu-DgeGVOsc.js";import{n as Qe,t as $e}from"./log-CYxK8fOx.js";import{t as et}from"./preload-helper-BVHhchWG.js";import{n as tt,t as nt}from"./globals-DwKYod15.js";import{a as rt,i as it,n as at,o as ot,t as st}from"./globals-B4nSVLQx.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var ct=`(max-width: 700px), (max-height: 500px) and (pointer: coarse)`,lt=15e5;function ut(e,t){let n=typeof e.matchMedia==`function`?e.matchMedia.bind(e):()=>({matches:!1}),r=n(`(pointer: coarse)`).matches,i=e.innerWidth||1,a=e.innerHeight||1;return{compactViewport:n(ct).matches,handheld:r&&t.maxTouchPoints>0&&Math.min(i,a)<=700,coarsePointer:r,maxTouchPoints:t.maxTouchPoints||0,viewportWidth:i,viewportHeight:a,devicePixelRatio:e.devicePixelRatio||1}}function dt({devicePixelRatio:e,viewportHeight:t,viewportWidth:n,handheld:r}){let i=Math.max(n,1)*Math.max(t,1);if(!r)return!0;let a=Math.max(1,Math.min(2,Math.sqrt(lt/i)));return e<=a?!0:a}function ft(e,t){let n=t.handheld&&e.mobileMode===`reduced`;return{canvasPixelRatio:dt(t),intermediateTargetScale:n?.75:1,maximumSampleCount:n?2:4,preferFloatingPointColor:!n,maximumWorkerCount:n?1:2,maximumConcurrentLoadCount:n?2:4,maximumResidentRecordCount:n?25e4:1e6,simulationDimensionScale:n?.5:1,simulationIterationScale:n?.5:1}}function pt(e,t){return t.handheld&&e.mobileMode===`unsupported`?e.unsupportedReason||`This example does not support mobile devices.`:void 0}function mt(e){switch(e){case`full`:return`Mobile`;case`reduced`:return`Mobile quality`;case`unsupported`:return`Desktop only`}}function ht(e,t,n){let r=pt(e,t);if(r)return{supported:!1,reason:r};let i=e.requirements;if(!i)return{supported:!0};if(!i.backends.some(e=>n.backends.includes(e)))return{supported:!1,reason:`This example requires ${wt(i.backends)}, but this browser does not expose a compatible graphics backend. Try a current browser on a capable device or use a desktop browser.`};let a=new Set(n.deviceFeatures),o=i.requiredDeviceFeatures?.find(e=>!a.has(e));if(o)return{supported:!1,reason:`This example requires the GPU feature “${o}”. Try a current browser on a capable device or use a desktop browser.`};let s=i.requiredDeviceLimits,c=n.deviceLimits;return s?.maxColorAttachments!==void 0&&(c?.maxColorAttachments??0)<s.maxColorAttachments?{supported:!1,reason:`This example requires ${s.maxColorAttachments} color attachments, but this GPU exposes only ${c?.maxColorAttachments??0}. Try a capable device or desktop browser.`}:s?.maxColorAttachmentBytesPerSample!==void 0&&(c?.maxColorAttachmentBytesPerSample??0)<s.maxColorAttachmentBytesPerSample?{supported:!1,reason:`This example requires ${s.maxColorAttachmentBytesPerSample} color-attachment bytes per sample, but this GPU exposes only ${c?.maxColorAttachmentBytesPerSample??0}. Try a capable device or desktop browser.`}:{supported:!0}}async function gt(){let e=document.documentElement,t=vt(document),n=ut(window,navigator),r=ht(t,n,{backends:await _t()}),i=ft(t,n);e.dataset.lumaExampleId=t.id,e.dataset.lumaExampleMobileMode=t.mobileMode,e.dataset.lumaExampleQualityProfile=t.mobileProfile,e.dataset.lumaExampleState=r.supported?`loading`:`unsupported`,n.handheld&&typeof i.canvasPixelRatio==`number`&&Object.defineProperty(window,`devicePixelRatio`,{configurable:!0,value:i.canvasPixelRatio});let a=t=>{e.dataset.lumaExampleState!==`unsupported`&&(e.dataset.lumaExampleState=`failed`,xt(`failed`,Ct(t)))},o=()=>{e.dataset.lumaExampleState===`loading`&&(e.dataset.lumaExampleState=`running`)};return window.addEventListener(`error`,e=>a(e.error||e.message)),window.addEventListener(`unhandledrejection`,e=>a(e.reason)),St(),n.handheld&&bt(t.mobileMode),r.supported===!1?xt(`unsupported`,r.reason):yt(o),{supported:r.supported,reportFailed:a,reportRunning:o}}async function _t(){let e=[];if(`WebGL2RenderingContext`in window&&e.push(`webgl2`),`gpu`in navigator)try{let t=navigator.gpu;t&&await t.requestAdapter()&&e.push(`webgpu`)}catch{}return e}function vt(e){let t=t=>e.querySelector(`meta[name="${t}"]`)?.content||void 0,n=t(`luma-example-mobile`),r=t(`luma-example-mobile-profile`),i=(t(`luma-example-backends`)||``).split(`,`).filter(Boolean);return{id:t(`luma-example-id`)||location.pathname,mobileMode:n||`reduced`,mobileProfile:r||`standard`,unsupportedReason:t(`luma-example-mobile-unsupported-reason`),requirements:i.length?{backends:i}:void 0}}function yt(e){let t=!1,n=()=>{if(t)return;let n=document.querySelector(`canvas`),i=n&&n.clientWidth>0&&n.clientHeight>0,a=[...document.body?.querySelectorAll(`*`)||[]].some(e=>{if(e instanceof HTMLScriptElement||e instanceof HTMLStyleElement||e.hasAttribute(`data-luma-example-mobile-badge`)||e.hasAttribute(`data-luma-example-status`))return!1;let t=e.getBoundingClientRect();return t.width>0&&t.height>0&&(e.textContent?.trim()||e.children.length)});(i||a)&&(t=!0,r.disconnect(),requestAnimationFrame(()=>requestAnimationFrame(e)))},r=new MutationObserver(n);r.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener(`load`,n,{once:!0})}function bt(e){let t=document.createElement(`span`);t.dataset.lumaExampleMobileBadge=``,t.setAttribute(`aria-label`,`Mobile support: ${mt(e)}`),t.style.cssText=`position:fixed;left:calc(8px + env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:2147483646;padding:4px 8px;border:1px solid #7dd3fc57;border-radius:999px;background:#020617dd;color:#bae6fd;font:700 11px/1.4 system-ui;pointer-events:none;`,t.textContent=mt(e),document.body.append(t)}function xt(e,t){document.querySelector(`[data-luma-example-status]`)?.remove();let n=document.createElement(`div`);n.dataset.lumaExampleStatus=e,n.setAttribute(`role`,`alert`),n.style.cssText=`position:fixed;inset:16px;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;border:1px solid #475569;border-radius:12px;background:#020617ee;color:#e2e8f0;font:16px/1.5 system-ui;text-align:center;`;let r=document.createElement(`div`);r.style.maxWidth=`620px`;let i=document.createElement(`strong`);i.style.cssText=`display:block;font-size:20px;margin-bottom:8px;`,i.textContent=e===`unsupported`?`This example is not supported on this device.`:`This example could not start.`;let a=document.createElement(`span`);a.textContent=t,r.append(i,a),n.append(r),document.body.append(n)}function St(){let e=document.createElement(`style`);e.textContent=`
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
  `,document.head.append(e)}function Ct(e){return e instanceof Error?e.message:typeof e==`string`?e:`An unexpected error stopped the example.`}function wt(e){return e.map(e=>e===`webgpu`?`WebGPU`:`WebGL2`).join(` or `)}(await gt()).supported||document.querySelectorAll(`script[type="module"]:not([data-luma-example-support-bootstrap])`).forEach(e=>e.remove());var Tt=`set luma.log.level=1 (or higher) to trace rendering`,Et="No matching device found. Ensure `@luma.gl/core/webgl` and/or `@luma.gl/core/webgpu` modules are imported.",Dt=class e{static defaultProps={...f,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=c;log=t;VERSION=typeof __VERSION__<`u`?__VERSION__:`running from source`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw t.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),t.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);t.error(`This version of luma.gl has already been initialized`)()}t.log(1,`${this.VERSION} - ${Tt}`)(),globalThis.luma=this}async createDevice(t={}){let n={...e.defaultProps,...t};try{let e=this.selectAdapter(n.type,n.adapters);if(!e)throw Error(Et);return n.waitForPageLoad&&await e.pageLoaded,await e.create(n)}catch(e){throw n.debug&&Ot(e),e}}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(Et);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(e=!0,n=[]){let r=this._getAdapterMap(n).get(`webgl`);r||t.warn(`enforceWebGL2: webgl adapter not found`)(),r?.enforceWebGL2?.(e)}setDefaultDeviceProps(t){Object.assign(e.defaultProps,t)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(e,n=[]){return e instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue?`webgpu`:e===null?`null`:(e instanceof WebGLRenderingContext?t.warn(`WebGL1 is not supported`,e)():t.warn(`Unknown handle type`,e)(),null)}};function Ot(e){typeof alert>`u`||alert(e instanceof Error?e.message:String(e))}var kt=new Dt,At=class{get pageLoaded(){return Pt()}},jt=o()&&typeof document<`u`,Mt=()=>jt&&document.readyState===`complete`,Nt=null;function Pt(){return Nt||=Mt()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),Nt}var Ft=class{name;playing=!0;speed=1;startTime=0;constructor(e={}){this.name=e.name||`unnamed`,Object.assign(this,e)}setTime(e){if(!this.playing)return;let t=(e/1e3-this.startTime)*this.speed;this.applyTime(t)}},It=class{clips;animations;constructor(e){this.clips=e,this.animations=e}animate(e){t.warn(`${this.constructor.name}#animate is deprecated. Use ${this.constructor.name}#setTime instead`)(),this.setTime(e)}setTime(e){this.clips.forEach(t=>t.setTime(e))}getAnimations(){return this.clips}};function Lt(e,t,n=`vector`){let{input:r,output:i,interpolation:a=`LINEAR`}=t;if(!r.length||!i.length||!Number.isFinite(e))return null;let o=r.length-1;if(e<=r[0]||o===0)return zt(i,a,0,n);if(e>=r[o])return zt(i,a,o,n);let s=0,c=o;for(;c-s>1;){let t=Math.floor((s+c)/2);r[t]<=e?s=t:c=t}let l=r[s],u=r[c]-l;if(u<=0||a===`STEP`)return zt(i,a,s,n);let d=(e-l)/u;switch(a){case`LINEAR`:{let e=i[s],t=i[c];return!e||!t?null:n===`quaternion`?Rt(e,t,d):Bt(e,t,d)}case`CUBICSPLINE`:{let e=i[s*3+1],t=i[s*3+2],r=i[c*3],a=i[c*3+1];if(!e||!t||!r||!a)return null;let o=Vt(e,t,r,a,u,d);return n===`quaternion`?Ht(o):o}default:return null}}function Rt(e,t,n){let r=Ht(e),i=Ht(t),a=r.reduce((e,t,n)=>e+t*i[n],0),o=a<0?-1:1;if(a=Math.min(Math.abs(a),1),a>.9995)return Ht(r.map((e,t)=>e+n*(i[t]*o-e)));let s=Math.acos(a),c=Math.sin(s),l=Math.sin((1-n)*s)/c,u=Math.sin(n*s)/c*o;return Ht(r.map((e,t)=>e*l+i[t]*u))}function zt(e,t,n,r){let i=e[t===`CUBICSPLINE`?n*3+1:n];return i?r===`quaternion`?Ht(i):[...i]:null}function Bt(e,t,n){return e.map((e,r)=>(1-n)*e+n*t[r])}function Vt(e,t,n,r,i,a){let o=a*a,s=o*a;return e.map((e,c)=>(2*s-3*o+1)*e+(s-2*o+a)*t[c]*i+(-2*s+3*o)*r[c]+(s-o)*n[c]*i)}function Ht(e){let t=Math.hypot(...e);return t>0?e.map(e=>e/t):[0,0,0,1]}var Ut=class{name;times;values;interpolation;valueType;binding;constructor(e){this.name=e.name||e.binding.id||`unnamed`,this.times=e.times,this.values=e.values,this.interpolation=e.interpolation||`LINEAR`,this.valueType=e.valueType||`vector`,this.binding=e.binding}get duration(){return this.times[this.times.length-1]||0}get sampler(){return{input:this.times,output:this.values,interpolation:this.interpolation}}evaluate(e){return Lt(e,this.sampler,this.valueType)}},Wt=class{name;tracks;duration;constructor(e){this.name=e.name||`unnamed`,this.tracks=e.tracks,this.duration=e.duration??Math.max(0,...e.tracks.map(e=>e.duration))}},Gt=class{clip;mixer;time=0;timeScale;weight;loop;repetitions;paused=!1;playing=!1;elapsedTime=0;fade=null;constructor(e,t,n={}){this.mixer=e,this.clip=t,this.loop=n.loop||`repeat`,this.repetitions=n.repetitions??1/0,this.timeScale=n.timeScale??1,this.weight=n.weight??1}play(){return this.playing=!0,this.paused=!1,this}pause(){return this.paused=!0,this}resume(){return this.playing=!0,this.paused=!1,this}stop(){return this.playing=!1,this.paused=!1,this.fade=null,this.reset()}reset(){return this.elapsedTime=0,this.time=0,this}setTime(e){return this.elapsedTime=e,this.time=this.resolveLocalTime(e),this}setLoop(e,t=1/0){return this.loop=e,this.repetitions=t,this.time=this.resolveLocalTime(this.elapsedTime),this}setEffectiveWeight(e){return this.weight=Math.max(0,e),this.fade=null,this}setEffectiveTimeScale(e){return this.timeScale=e,this}fadeIn(e){return this.scheduleFade(1,e)}fadeOut(e){return this.scheduleFade(0,e)}crossFadeTo(e,t){return e.weight=0,e.play().fadeIn(t),this.fadeOut(t)}crossFadeFrom(e,t){return e.crossFadeTo(this,t),this}advance(e){!this.playing||this.paused||(this.advanceFade(Math.abs(e)),this.elapsedTime+=e*this.timeScale,this.time=this.resolveLocalTime(this.elapsedTime),this.hasFinished()&&(this.playing=!1))}get shouldApply(){return(this.playing||this.hasFinished())&&this.weight>0}scheduleFade(e,t){return t<=0?(this.weight=e,this.fade=null,this):(this.fade={duration:t,elapsedTime:0,startWeight:this.weight,endWeight:e},this)}advanceFade(e){if(!this.fade)return;this.fade.elapsedTime+=e;let t=Math.min(this.fade.elapsedTime/this.fade.duration,1);this.weight=this.fade.startWeight+(this.fade.endWeight-this.fade.startWeight)*t,t===1&&(this.fade=null)}hasFinished(){let e=this.clip.duration;return e<=0?this.loop===`once`:this.loop===`once`?this.elapsedTime>=e||this.elapsedTime<0:Number.isFinite(this.repetitions)&&Math.abs(this.elapsedTime)>=e*this.repetitions}resolveLocalTime(e){let t=this.clip.duration;if(t<=0)return 0;if(this.loop===`once`)return Math.min(Math.max(e,0),t);if(Number.isFinite(this.repetitions)&&Math.abs(e)>=t*this.repetitions)return this.loop===`ping-pong`&&this.repetitions%2==0||e<0?0:t;let n=e>=0&&e<t?e:(e%t+t)%t;if(this.loop===`repeat`)return n;let r=Math.floor(e/t);return Math.abs(r%2)===0?n:t-n}},Kt=class{time=0;timeScale=1;clips=new Map;actions=new Map;initialValues=new Map;constructor(e=[]){e.forEach(e=>this.addClip(e))}addClip(e){return this.clips.set(e.name,e),this}clipAction(e,t){let n=typeof e==`string`?this.clips.get(e):e;if(!n)throw Error(`Unknown animation clip: ${e}`);this.addClip(n);let r=this.actions.get(n);return r||(r=new Gt(this,n,t),this.actions.set(n,r)),r}getAction(e){let t=this.clips.get(e);return t?this.actions.get(t):void 0}update(e){return this.advance(e),this.applyValues(),this}advance(e){let t=e*this.timeScale;return this.time+=t,this.actions.forEach(e=>e.advance(t)),this}setTime(e){return this.time=e,this.actions.forEach(t=>{t.paused||t.setTime(e*t.timeScale)}),this.applyValues(),this}stopAllAction(){return this.actions.forEach(e=>e.stop()),this}applyValues(){let e=new Map;this.actions.forEach(t=>{!t.shouldApply&&!(t.playing&&t.weight===0)||t.clip.tracks.forEach(n=>{let r=n.evaluate(t.time);if(!r)return;let i=n.binding.id||n.binding;if(!this.initialValues.has(i)){let e=n.binding.getValue?.();e&&this.initialValues.set(i,[...e])}if(t.weight===0&&!this.initialValues.has(i))return;let a=e.get(i);if(!a){e.set(i,{binding:n.binding,value:[...r],valueType:n.valueType,weight:t.weight});return}if(t.weight===0)return;let o=a.weight+t.weight,s=t.weight/o;a.value=n.valueType===`quaternion`?Rt(a.value,r,s):a.value.map((e,t)=>e+(r[t]-e)*s),a.weight=o})}),e.forEach(({binding:e,value:t,valueType:n,weight:r},i)=>{let a=r<1?this.initialValues.get(i):void 0;a&&a.length===t.length&&(t=n===`quaternion`?Rt(a,t,r):t.map((e,t)=>a[t]+(e-a[t])*r)),e.setValue(t)})}};function qt(e){let t=e.value;if(t instanceof Float32Array)return t;let n=new Float32Array(t.length),r=Zt(t),i=t instanceof Int8Array||t instanceof Int16Array||t instanceof Int32Array;for(let a=0;a<t.length;a++){let o=Number(t[a]);n[a]=e.normalized&&r?i?Math.max(o/r,-1):o/r:o}return n}function Jt(e,t,n){let r={};for(let i of[`POSITION`,`NORMAL`,`TANGENT`]){let a=e[i];if(!a)continue;let o=new Float32Array(a),s=i===`TANGENT`?4:3,c=Math.floor(a.length/s);for(let e=0;e<Math.min(t.length,n.length);e++){let r=n[e],a=t[e][i];if(!r||!a)continue;let l=i===`TANGENT`&&a.length===c*4?4:3;for(let e=0;e<c;e++){let t=e*s,n=e*l;for(let e=0;e<3;e++)o[t+e]+=(a[n+e]||0)*r}}i!==`POSITION`&&Qt(o,s),r[i]=o}return r}function Yt(e,t,n,r){let i={};for(let e of[`POSITION`,`NORMAL`,`TANGENT`]){let n=t.attributes[e];n&&(i[e]=qt(n))}let a=Jt(i,n,r),o={};for(let[e,n]of Object.entries(t.attributes))n&&(o[e]=n);for(let e of[`POSITION`,`NORMAL`,`TANGENT`]){let t=a[e],n=o[e];t&&n&&(o[e]={...n,value:Xt(n,t)})}let s=le(new fe({id:t.id,topology:t.topology||`triangle-list`,vertexCount:t.vertexCount,indices:t.indices,attributes:o,bufferLayout:t.bufferLayout})).attributes.geometry?.value,c=e._gpuGeometry?.attributes.geometry||e.bufferAttributes.geometry;if(s&&c){c.write(s);return}for(let t of[`POSITION`,`NORMAL`,`TANGENT`]){let n=a[t];if(n){let r=t===`POSITION`?`positions`:t===`NORMAL`?`normals`:`TANGENT`;e.bufferAttributes[r]?.write(n)}}}function Xt(e,t){if(e.value instanceof Float32Array)return t;let n=e.value.slice(),r=Zt(n),i=n instanceof Int8Array||n instanceof Int16Array||n instanceof Int32Array;for(let a=0;a<t.length;a++){let o=t[a];n[a]=e.normalized&&r?Math.round(Math.max(i?-1:0,Math.min(1,o))*r):o}return n}function Zt(e){return e instanceof Int8Array?127:e instanceof Uint8Array||e instanceof Uint8ClampedArray?255:e instanceof Int16Array?32767:e instanceof Uint16Array?65535:e instanceof Int32Array?2147483647:e instanceof Uint32Array?4294967295:0}function Qt(e,t){for(let n=0;n<e.length;n+=t){let t=Math.hypot(e[n],e[n+1],e[n+2]);t>0&&(e[n]/=t,e[n+1]/=t,e[n+2]/=t)}}function $t(e){let{joints:t,meshNode:n,worldMatrices:r,inverseBindMatrices:i,target:a}=e,o=t.length,s=a&&a.length===o*16?a:new Float32Array(o*16),c=n?r.get(n)||n.matrix:void 0,l=c?new k(c).invert():null;for(let e=0;e<o;e++){let n=t[e],a=r.get(n)||n.matrix,o=l?new k(l).multiplyRight(a):new k(a),c=e*16;if(i&&i.length>=c+16){let e=new k;for(let t=0;t<16;t++)e[t]=i[c+t];o.multiplyRight(e)}s.set(o,c)}return s}var en=1,tn=1,nn=class{time=0;channels=new Map;animations=new Map;playing=!1;lastEngineTime=-1;constructor(){}addChannel(e){let{delay:t=0,duration:n=1/0,rate:r=1,repeat:i=1}=e,a=en++,o={time:0,delay:t,duration:n,rate:r,repeat:i};return this._setChannelTime(o,this.time),this.channels.set(a,o),a}removeChannel(e){this.channels.delete(e);for(let[t,n]of this.animations)n.channel===e&&this.detachAnimation(t)}isFinished(e){let t=this.channels.get(e);return t===void 0?!1:this.time>=t.delay+t.duration*t.repeat}getTime(e){if(e===void 0)return this.time;let t=this.channels.get(e);return t===void 0?-1:t.time}setTime(e){this.time=Math.max(0,e);let t=this.channels.values();for(let e of t)this._setChannelTime(e,this.time);let n=this.animations.values();for(let e of n){let{animation:t,channel:n}=e;t.setTime(this.getTime(n))}}play(){this.playing=!0}pause(){this.playing=!1,this.lastEngineTime=-1}reset(){this.setTime(0)}attachAnimation(e,t){let n=tn++;return this.animations.set(n,{animation:e,channel:t}),e.setTime(this.getTime(t)),n}detachAnimation(e){this.animations.delete(e)}update(e){this.playing&&(this.lastEngineTime===-1&&(this.lastEngineTime=e),this.setTime(this.time+(e-this.lastEngineTime)),this.lastEngineTime=e)}_setChannelTime(e,t){let n=t-e.delay;n>=e.duration*e.repeat?e.time=e.duration*e.rate:(e.time=Math.max(0,n)%e.duration,e.time*=e.rate)}};function rn(e){let t=typeof window<`u`?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null;return t?t.call(window,e):setTimeout(()=>e(typeof performance<`u`?performance.now():Date.now()),1e3/60)}function an(e){let t=typeof window<`u`?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null;if(t){t.call(window,e);return}clearTimeout(e)}var on=0,sn=`Animation Loop`,cn={requestAnimationFrame:e=>rn(e),cancelAnimationFrame:e=>an(e)},ln=class e{static defaultAnimationLoopProps={device:null,mobileQuality:void 0,onAddHTML:()=>``,onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:cn};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw=`initialized`;_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(t){if(this.props={...e.defaultAnimationLoopProps,...t},t=this.props,!t.device)throw Error(`No device provided`);this.stats=t.stats||new s({id:`animation-loop-${on++}`}),this.sharedStats=kt.stats.get(sn),this.frameRate=this.stats.get(`Frame Rate`),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get(`CPU Time`),this.gpuTime=this.stats.get(`GPU Time`),this.setProps({autoResizeViewport:t.autoResizeViewport,animationFrameProvider:t.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this._stopEventHandling(),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(t){this._error=t,this.props.onError(t),this.props.onError===e.defaultAnimationLoopProps.onError&&typeof window<`u`&&typeof ErrorEvent<`u`&&window.dispatchEvent(new ErrorEvent(`error`,{error:t,message:t.message}))}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if(`autoResizeViewport`in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),`animationFrameProvider`in e){let t=e.animationFrameProvider||cn;if(t!==this.props.animationFrameProvider){let e=this._animationFrameId!==null;e&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,e&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}return this._running?(this._cancelAnimationFrame(),this._requestAnimationFrame(),this):null}catch(e){let t=e instanceof Error?e:Error(`Unknown error`);throw this.props.onError(t),t}}stop(){if(this._running){let e=this.animationProps;this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0,e&&this.props.onFinalize(e)}return this}redraw(e,t=null){return this.device?.isLost||this._error?this:(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&=(this._resolveNextFrame(this),this._nextFramePromise=null,null),this._endFrameTimers(),this)}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw(`waitForRender`),this._nextFramePromise||=new Promise(e=>{this._resolveNextFrame=e}),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw(`toDataURL`),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw Error(`OffscreenCanvas`)}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){this._animationFrameId!==null&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){if(this._running)try{this.redraw(e,t??null),this._requestAnimationFrame()}catch(e){let t=e instanceof Error?e:Error(String(e));this.reportError(t),this.stop()}}_renderFrame(e){if(this.display){this.display._renderFrame(e);return}let t=this.props.onRender(this._getAnimationProps());this.device&&t!==!1&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw Error(`loop`);let t=e?.canvas,n=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:n,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null,mobileQuality:this.props.mobileQuality}}_getAnimationProps(){if(!this.animationProps)throw Error(`animationProps`);return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:n}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw(`drawing buffer resized`),n!==this.animationProps.aspect&&this.setNeedsRedraw(`drawing buffer aspect changed`),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=n,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw Error(`No device provided`);this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement(`div`);document.body.appendChild(e),e.style.position=`relative`;let t=document.createElement(`div`);t.style.position=`absolute`,t.style.left=`10px`,t.style.bottom=`10px`,t.style.width=`300px`,t.style.background=`white`,this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let n=this.props.onAddHTML(t);n&&(t.innerHTML=n)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize();return{width:e,height:t,aspect:e>0&&t>0?e/t:1}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??(typeof performance<`u`?performance.now():Date.now());if(this._lastFrameTime){let e=t-this._lastFrameTime;e>0&&this.frameRate.addTime(e)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;e!==void 0&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener(`mousemove`,this._onMousemove),this.canvas.addEventListener(`mouseleave`,this._onMouseleave))}_stopEventHandling(){this.canvas?.removeEventListener(`mousemove`,this._onMousemove),this.canvas?.removeEventListener(`mouseleave`,this._onMouseleave)}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}};function un(e,t=[],n=0){let r=Math.fround(e),i=e-r;return t[n]=r,t[n+1]=i,t}function dn(e){return e-Math.fround(e)}function fn(e){let t=new Float32Array(32);for(let n=0;n<4;++n)for(let r=0;r<4;++r){let i=n*4+r;un(e[r*4+n],t,i*2)}return t}function pn(e,t=!0){return e??t}function mn(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}function hn(e,t=!0){let n=mn(e.slice(0,3),t),r=Number.isFinite(e[3]),i=r?e[3]:1;return[n[0],n[1],n[2],t&&r?i/255:i]}var gn=`
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
`,_n=`struct Fp64F32Bits {
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

`,vn={name:`fp64arithmetic`,source:`\
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
${_n}

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
${_n}

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
`,fs:gn,vs:gn,defaultUniforms:{ONE:1,SPLIT:4097},uniformTypes:{ONE:`f32`,SPLIT:`f32`},fp64ify:un,fp64LowPart:dn,fp64ifyMatrix4:fn},yn={props:{},uniforms:{},name:`picking`,uniformTypes:{isActive:`f32`,isAttribute:`f32`,isHighlightActive:`f32`,useByteColors:`f32`,highlightedObjectColor:`vec3<f32>`,highlightColor:`vec4<f32>`},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:[0,1,1,1]},vs:`layout(std140) uniform pickingUniforms {
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
`,getUniforms:bn};function bn(e={},t){let n={},r=pn(e.useByteColors,!0);return e.highlightedObjectColor===void 0||(e.highlightedObjectColor===null?n.isHighlightActive=!1:(n.isHighlightActive=!0,n.highlightedObjectColor=e.highlightedObjectColor.slice(0,3))),e.highlightColor&&(n.highlightColor=hn(e.highlightColor,r)),e.isActive!==void 0&&(n.isActive=!!e.isActive,n.isAttribute=!!e.isAttribute),e.useByteColors!==void 0&&(n.useByteColors=!!e.useByteColors),n}var xn={props:{},uniforms:{},bindings:{},name:`skin`,bindingLayout:[{name:`skin`,group:0},{name:`skinJointMatrices`,group:0,visibility:1}],dependencies:[],source:`
struct skinUniforms {
  jointMatrix: array<mat4x4<f32>, 64>,
};

@group(0) @binding(auto) var<uniform> skin: skinUniforms;

#ifdef HAS_INSTANCED_SKIN
@group(0) @binding(auto) var<storage, read> skinJointMatrices: array<mat4x4<f32>>;

fn getInstancedSkinMatrix(
  weights: vec4f,
  joints: vec4u,
  instanceIndex: u32,
  jointsPerInstance: u32
) -> mat4x4<f32> {
  let firstJoint = instanceIndex * jointsPerInstance;
  return (weights.x * skinJointMatrices[firstJoint + joints.x])
       + (weights.y * skinJointMatrices[firstJoint + joints.y])
       + (weights.z * skinJointMatrices[firstJoint + joints.z])
       + (weights.w * skinJointMatrices[firstJoint + joints.w]);
}
#else
#ifdef HAS_LARGE_SKIN
@group(0) @binding(auto) var<storage, read> skinJointMatrices: array<mat4x4<f32>>;
#endif
#endif

fn getSkinMatrix(weights: vec4f, joints: vec4u) -> mat4x4<f32> {
#ifdef HAS_LARGE_SKIN
  return (weights.x * skinJointMatrices[joints.x])
       + (weights.y * skinJointMatrices[joints.y])
       + (weights.z * skinJointMatrices[joints.z])
       + (weights.w * skinJointMatrices[joints.w]);
#else
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
#endif
}
`,vs:`
layout(std140) uniform skinUniforms {
  mat4 jointMatrix[SKIN_MAX_JOINTS];
} skin;

#ifdef HAS_INSTANCED_SKIN
uniform highp sampler2D skinJointMatrices;

mat4 getInstancedJointMatrix(uint jointIndex, uint instanceIndex) {
  int firstColumn = int(jointIndex * 4u);
  int row = int(instanceIndex);
  return mat4(
    texelFetch(skinJointMatrices, ivec2(firstColumn, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 1, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 2, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 3, row), 0)
  );
}

mat4 getInstancedSkinMatrix(
  vec4 weights,
  uvec4 joints,
  uint instanceIndex,
  uint jointsPerInstance
) {
  return (weights.x * getInstancedJointMatrix(joints.x, instanceIndex))
       + (weights.y * getInstancedJointMatrix(joints.y, instanceIndex))
       + (weights.z * getInstancedJointMatrix(joints.z, instanceIndex))
       + (weights.w * getInstancedJointMatrix(joints.w, instanceIndex));
}
#else
#ifdef HAS_LARGE_SKIN
uniform highp sampler2D skinJointMatrices;

mat4 getSkinJointMatrix(uint jointIndex) {
  int firstColumn = int(jointIndex * 4u);
  return mat4(
    texelFetch(skinJointMatrices, ivec2(firstColumn, 0), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 1, 0), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 2, 0), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 3, 0), 0)
  );
}
#endif
#endif

mat4 getSkinMatrix(vec4 weights, uvec4 joints) {
#ifdef HAS_LARGE_SKIN
  return (weights.x * getSkinJointMatrix(joints.x))
       + (weights.y * getSkinJointMatrix(joints.y))
       + (weights.z * getSkinJointMatrix(joints.z))
       + (weights.w * getSkinJointMatrix(joints.w));
#else
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
#endif
}

`,fs:``,defines:{SKIN_MAX_JOINTS:64},getUniforms:(e={},t)=>{let{jointMatrices:n,skinJointMatrices:r,scenegraphsFromGLTF:i,skinIndex:a=0,meshWorldMatrix:o}=e,s=r?{skinJointMatrices:r}:{};if(n)return{jointMatrix:Sn(n),...s};let c=i?.gltf?.skins?.[a];if(!c)return{jointMatrix:[],...s};let{inverseBindMatrices:l,joints:u,skeleton:d}=c,f=i.gltfNodeIndexToNodeMap,p=new Map,m=d===void 0?void 0:f?.get(d),h=m?[m]:i.scenes||[];for(let e of h)e.preorderTraversal((e,{worldMatrix:t})=>{p.set(e.id,t)});let g=o?new k(o).invert():null,_=new Float32Array(1024),v=l?.value;for(let e=0;e<Math.min(u.length,64);e++){let t=f?.get(u[e]);if(!t)continue;let n=p.get(t.id)||t.matrix,r=g?new k(g).multiplyRight(n):new k(n);v&&v.length>=(e+1)*16&&r.multiplyRight(new k(Array.from(v.slice(e*16,(e+1)*16)))),_.set(r,e*16)}return{jointMatrix:_,...s}},uniformTypes:{jointMatrix:[`mat4x4<f32>`,64]}};function Sn(e){let t=new Float32Array(1024);return t.set(e instanceof Float32Array?e.subarray(0,t.length):e.slice(0,t.length)),t}var Cn={name:`gpuAnimation`,props:{},uniforms:{},bindings:{},source:`
#ifdef HAS_GPU_CROWD_ANIMATION
@group(0) @binding(auto) var<storage, read> gpuAnimationFrames: array<vec4f>;

fn readGPUAnimationFrame(frame: u32, offset: u32, frameStride: u32) -> vec4f {
  return gpuAnimationFrames[frame * frameStride + offset];
}

fn sampleGPUAnimationFrame(
  frames: vec4f,
  blend: vec4f,
  offset: u32,
  frameStride: u32
) -> vec4f {
  let first = mix(
    readGPUAnimationFrame(u32(frames.x), offset, frameStride),
    readGPUAnimationFrame(u32(frames.y), offset, frameStride),
    frames.z
  );
  if (blend.w <= 0.0) {
    return first;
  }
  let second = mix(
    readGPUAnimationFrame(u32(blend.x), offset, frameStride),
    readGPUAnimationFrame(u32(blend.y), offset, frameStride),
    blend.z
  );
  return mix(first, second, blend.w);
}

fn sampleGPUAnimationMatrix(
  frames: vec4f,
  blend: vec4f,
  firstColumn: u32,
  frameStride: u32
) -> mat4x4f {
  return mat4x4f(
    sampleGPUAnimationFrame(frames, blend, firstColumn, frameStride),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 1u, frameStride),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 2u, frameStride),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 3u, frameStride)
  );
}

fn getGPUAnimatedSkinMatrix(
  weights: vec4f,
  joints: vec4u,
  frames: vec4f,
  blend: vec4f,
  frameStride: u32
) -> mat4x4f {
  return weights.x * sampleGPUAnimationMatrix(frames, blend, 4u + joints.x * 4u, frameStride)
       + weights.y * sampleGPUAnimationMatrix(frames, blend, 4u + joints.y * 4u, frameStride)
       + weights.z * sampleGPUAnimationMatrix(frames, blend, 4u + joints.z * 4u, frameStride)
       + weights.w * sampleGPUAnimationMatrix(frames, blend, 4u + joints.w * 4u, frameStride);
}
#endif

#ifdef HAS_INSTANCED_MORPH
@group(0) @binding(auto) var<storage, read> gpuMorphTargets: array<vec4f>;

#ifndef HAS_GPU_CROWD_ANIMATION
@group(0) @binding(auto) var<storage, read> gpuMorphWeights: array<vec4f>;
#endif

fn getGPUCrowdMorphWeight(
  instanceIndex: u32,
  targetIndex: u32,
  targetCount: u32,
  jointsPerInstance: u32,
  frames: vec4f,
  blend: vec4f,
  frameStride: u32
) -> f32 {
#ifdef HAS_GPU_CROWD_ANIMATION
  let offset = 4u + jointsPerInstance * 4u + targetIndex;
  return sampleGPUAnimationFrame(frames, blend, offset, frameStride).x;
#else
  let packedCount = (targetCount + 3u) / 4u;
  let packedWeights = gpuMorphWeights[instanceIndex * packedCount + targetIndex / 4u];
  return packedWeights[targetIndex % 4u];
#endif
}

fn getGPUCrowdMorphDelta(
  instanceIndex: u32,
  vertexIndex: u32,
  attributeIndex: u32,
  vertexCount: u32,
  targetCount: u32,
  jointsPerInstance: u32,
  frames: vec4f,
  blend: vec4f,
  frameStride: u32
) -> vec3f {
  var result = vec3f(0.0);
  for (var targetIndex = 0u; targetIndex < targetCount; targetIndex++) {
    let weight = getGPUCrowdMorphWeight(
      instanceIndex,
      targetIndex,
      targetCount,
      jointsPerInstance,
      frames,
      blend,
      frameStride
    );
    let offset = (targetIndex * 3u + attributeIndex) * vertexCount + vertexIndex;
    result += gpuMorphTargets[offset].xyz * weight;
  }
  return result;
}
#endif
`,vs:`
#ifdef HAS_GPU_CROWD_ANIMATION
uniform highp sampler2D gpuAnimationFrames;

vec4 sampleGPUAnimationFrame(vec4 frames, vec4 blend, int offset) {
  vec4 first = mix(
    texelFetch(gpuAnimationFrames, ivec2(offset, int(frames.x)), 0),
    texelFetch(gpuAnimationFrames, ivec2(offset, int(frames.y)), 0),
    frames.z
  );
  if (blend.w <= 0.0) {
    return first;
  }
  vec4 second = mix(
    texelFetch(gpuAnimationFrames, ivec2(offset, int(blend.x)), 0),
    texelFetch(gpuAnimationFrames, ivec2(offset, int(blend.y)), 0),
    blend.z
  );
  return mix(first, second, blend.w);
}

mat4 sampleGPUAnimationMatrix(vec4 frames, vec4 blend, int firstColumn) {
  return mat4(
    sampleGPUAnimationFrame(frames, blend, firstColumn),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 1),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 2),
    sampleGPUAnimationFrame(frames, blend, firstColumn + 3)
  );
}

mat4 getGPUAnimatedSkinMatrix(vec4 weights, uvec4 joints, vec4 frames, vec4 blend) {
  return weights.x * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.x) * 4)
       + weights.y * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.y) * 4)
       + weights.z * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.z) * 4)
       + weights.w * sampleGPUAnimationMatrix(frames, blend, 4 + int(joints.w) * 4);
}
#endif

#ifdef HAS_INSTANCED_MORPH
uniform highp sampler2D gpuMorphTargets;

#ifndef HAS_GPU_CROWD_ANIMATION
uniform highp sampler2D gpuMorphWeights;
#endif

float getGPUCrowdMorphWeight(
  uint instanceIndex,
  uint targetIndex,
  uint jointsPerInstance,
  vec4 frames,
  vec4 blend
) {
#ifdef HAS_GPU_CROWD_ANIMATION
  int offset = 4 + int(jointsPerInstance) * 4 + int(targetIndex);
  return sampleGPUAnimationFrame(frames, blend, offset).x;
#else
  vec4 packedWeights = texelFetch(
    gpuMorphWeights,
    ivec2(int(targetIndex / 4u), int(instanceIndex)),
    0
  );
  return packedWeights[int(targetIndex % 4u)];
#endif
}

vec3 getGPUCrowdMorphDelta(
  uint instanceIndex,
  uint vertexIndex,
  uint attributeIndex,
  uint targetCount,
  uint jointsPerInstance,
  vec4 frames,
  vec4 blend
) {
  vec3 result = vec3(0.0);
  for (uint targetIndex = 0u; targetIndex < targetCount; targetIndex++) {
    float weight = getGPUCrowdMorphWeight(
      instanceIndex,
      targetIndex,
      jointsPerInstance,
      frames,
      blend
    );
    result += texelFetch(
      gpuMorphTargets,
      ivec2(int(vertexIndex), int(targetIndex * 3u + attributeIndex)),
      0
    ).xyz * weight;
  }
  return result;
}
#endif
`,fs:``,bindingLayout:[{name:`gpuAnimationFrames`,group:0,visibility:1},{name:`gpuMorphTargets`,group:0,visibility:1},{name:`gpuMorphWeights`,group:0,visibility:1}],getUniforms(e={}){return e}};function wn(){return{color:[0,0,0],position:[0,0,0],halfAxisX:[0,0,0],halfAxisY:[0,0,0],normal:[0,0,-1],disk:0}}var Tn={color:`vec3<f32>`,position:`vec3<f32>`,halfAxisX:`vec3<f32>`,halfAxisY:`vec3<f32>`,normal:`vec3<f32>`,disk:`i32`};function En(e,t=!1){return Array.from({length:4},(n,r)=>{let i=e[r];if(!i)return wn();let a=mn(i.color||(t?[255,255,255]:[1,1,1]),t);return{position:i.position,halfAxisX:i.halfAxisX,halfAxisY:i.halfAxisY,normal:i.normal,disk:i.type===`disk`?1:0,color:a.map(e=>e*(i.intensity??1e3))}})}var Dn=`precision highp int;

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
`,On=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
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
`,kn=5,An={props:{},uniforms:{},name:`lighting`,defines:{},uniformTypes:{enabled:`i32`,directionalLightCount:`i32`,pointLightCount:`i32`,spotLightCount:`i32`,ambientColor:`vec3<f32>`,lights:[{color:`vec3<f32>`,position:`vec3<f32>`,direction:`vec3<f32>`,attenuation:`vec3<f32>`,coneCos:`vec2<f32>`},kn],areaLightCount:`i32`,areaLights:[Tn,4]},defaultUniforms:Fn(),bindingLayout:[{name:`lighting`,group:2}],firstBindingSlot:0,source:On,vs:Dn,fs:Dn,getUniforms:jn};function jn(e,t={}){e&&={...e};let n=(e?.lights||[]).filter(e=>e.type===`rect`||e.type===`disk`);if(!e)return Fn();e.lights&&(e={...e,...Nn(e.lights),lights:void 0});let{useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s}=e||{};if(!(i||a&&a.length>0||o&&o.length>0||s&&s.length>0)&&n.length===0)return{...Fn(),enabled:0};let c={...Fn(),...Mn({useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s})};return c.areaLightCount=Math.min(n.length,4),c.areaLights=En(n,pn(e.useByteColors,!0)),e.enabled!==void 0&&(c.enabled=e.enabled?1:0),c}function Mn({useByteColors:e,ambientLight:n,pointLights:r=[],spotLights:i=[],directionalLights:a=[]}){let o=In(),s=0,c=0,l=0,u=0;for(let t of r){if(s>=kn)break;o[s]={...o[s],color:Pn(t,e),position:t.position,attenuation:t.attenuation||[1,0,0]},s++,c++}for(let t of i){if(s>=kn)break;o[s]={...o[s],color:Pn(t,e),position:t.position,direction:t.direction,attenuation:t.attenuation||[1,0,0],coneCos:Rn(t)},s++,l++}for(let t of a){if(s>=kn)break;o[s]={...o[s],color:Pn(t,e),direction:t.direction},s++,u++}return r.length+i.length+a.length>kn&&t.warn(`MAX_LIGHTS exceeded, truncating to ${kn}`)(),{ambientColor:Pn(n,e),directionalLightCount:u,pointLightCount:c,spotLightCount:l,lights:o}}function Nn(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let n of e||[])switch(n.type){case`ambient`:t.ambientLight=n;break;case`directional`:t.directionalLights?.push(n);break;case`point`:t.pointLights?.push(n);break;case`spot`:t.spotLights?.push(n);break;default:}return t}function Pn(e={},t){let{color:n=[0,0,0],intensity:r=1}=e;return mn(n,pn(t,!0)).map(e=>e*r)}function Fn(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:In(),areaLightCount:0,areaLights:En([])}}function In(){return Array.from({length:kn},()=>Ln())}function Ln(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function Rn(e){let t=e.innerConeAngle??0,n=e.outerConeAngle??Math.PI/4;return[Math.cos(t),Math.cos(n)]}var zn=`#ifdef USE_IBL
@group(2) @binding(auto) var pbr_diffuseEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_diffuseEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_specularEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_specularEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_brdfLUT: texture_2d<f32>;
@group(2) @binding(auto) var pbr_brdfLUTSampler: sampler;
#endif
`,Bn=`#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif
`,Vn={name:`ibl`,firstBindingSlot:32,bindingLayout:[{name:`pbr_diffuseEnvSampler`,group:2},{name:`pbr_specularEnvSampler`,group:2},{name:`pbr_brdfLUT`,group:2}],source:zn,vs:Bn,fs:Bn},Hn=`
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
`,Un=`
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
`,Wn=`
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
`,Gn={name:`areaLighting`,props:{},uniforms:{},dependencies:[An],defaultUniforms:{lightCount:0,sampleCount:64,lights:Array.from({length:4},wn)},uniformTypes:{lightCount:`i32`,sampleCount:`i32`,lights:[Tn,4]},bindingLayout:[{name:`areaLighting`,group:2},{name:`areaLTCMatrix`,group:2},{name:`areaLTCAmplitude`,group:2}],source:`
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
`+Un,vs:Wn+Hn,fs:Wn+Hn,getUniforms(e={}){let t=e.lights||[];return{lightCount:Math.min(t.length,4),sampleCount:e.sampleCount||64,lights:En(t,e.useByteColors)}}},Kn=`out vec3 pbr_vPosition;
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
  pbr_vNormal = normalize(vec3(pbrProjection.modelMatrix * vec4(normal.xyz, 0.0)));
#endif
#endif

#ifdef HAS_UV
  pbr_vUV0 = uv0;
#else
  pbr_vUV0 = vec2(0.,0.);
#endif

  pbr_vUV1 = uv1;
}
`,qn=`precision highp float;

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
vec4 pbr_filterColorWithSpotShadows(vec4 vertexColor, vec4 spotVisibility)
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
      color *= lightmapIrradiance / M_PI;
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
      color += calculateFinalColor(pbrInfo, lighting.ambientColor);

      for(int i = 0; i < lighting.directionalLightCount; i++) {
        if (i < lighting.directionalLightCount) {
          PBRInfo_setDirectionalLight(pbrInfo, lighting_getDirectionalLight(i).direction);
          color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color);
        }
      }

      for(int i = 0; i < lighting.pointLightCount; i++) {
        if (i < lighting.pointLightCount) {
          PBRInfo_setPointLight(pbrInfo, lighting_getPointLight(i));
          float attenuation = getPointLightAttenuation(lighting_getPointLight(i), distance(lighting_getPointLight(i).position, pbr_vPosition));
          color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color / attenuation);
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

#ifdef USE_IBL
      if (pbrMaterial.IBLenabled) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
#endif

      // The pinned KHR_lightmap draft explicitly defines c_diff = (1 - metallic) * baseColor.
      color += baseColor.rgb * (1.0 - metallic) * lightmapIrradiance / M_PI;

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
      lighting.ambientColor,
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
        PBRInfo_setDirectionalLight(pbrInfo, lighting_getDirectionalLight(i).direction);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getDirectionalLight(i).color,
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
          lighting_getDirectionalLight(i).color,
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
          lighting_getPointLight(i).color / attenuation,
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
          lighting_getPointLight(i).color / attenuation,
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

vec4 pbr_filterColor(vec4 vertexColor) {
  return pbr_filterColorWithSpotShadows(vertexColor, vec4(1.0));
}
`,Jn=`#ifdef DOUBLE_SIDED
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
fn pbr_filterColorWithSpotShadows(vertexColor: vec4<f32>, spotVisibility: vec4f) -> vec4<f32> {
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
      color *= lightmapIrradiance / M_PI;
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
    let v = normalize(pbrProjection.camera - fragmentInputs.pbr_vPosition);  // Vector from surface point to camera
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
      color += calculateFinalColor(pbrInfo, lighting.ambientColor);

      for (var i = 0; i < lighting.directionalLightCount; i++) {
        if (i < lighting.directionalLightCount) {
          PBRInfo_setDirectionalLight(&pbrInfo, lighting_getDirectionalLight(i).direction);
          color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color);
        }
      }

      for (var i = 0; i < lighting.pointLightCount; i++) {
        if (i < lighting.pointLightCount) {
          PBRInfo_setPointLight(&pbrInfo, lighting_getPointLight(i));
          let attenuation = getPointLightAttenuation(
            lighting_getPointLight(i),
            distance(lighting_getPointLight(i).position, fragmentInputs.pbr_vPosition)
          );
          color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color / attenuation);
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

      #ifdef USE_IBL
      if (pbrMaterial.IBLenabled != 0) {
        color += getIBLContribution(pbrInfo, n, reflection);
      }
      #endif

      // The pinned KHR_lightmap draft explicitly defines c_diff = (1 - metallic) * baseColor.
      color += baseColor.rgb * (1.0 - metallic) * lightmapIrradiance / M_PI;

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
      lighting.ambientColor,
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
        PBRInfo_setDirectionalLight(&pbrInfo, lighting_getDirectionalLight(i).direction);
        color += calculateMaterialLightColor(
          pbrInfo,
          lighting_getDirectionalLight(i).color,
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
          lighting_getDirectionalLight(i).color,
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
          lighting_getPointLight(i).color / attenuation,
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
          lighting_getPointLight(i).color / attenuation,
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

fn pbr_filterColor(vertexColor: vec4<f32>) -> vec4<f32> {
  return pbr_filterColorWithSpotShadows(vertexColor, vec4f(1.0));
}
`,Yn=`layout(std140) uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,Xn={props:{},uniforms:{},defaultUniforms:{unlit:!1,baseColorMapEnabled:!1,baseColorFactor:[1,1,1,1],normalMapEnabled:!1,normalScale:1,emissiveMapEnabled:!1,lightmapMapEnabled:!1,emissiveFactor:[0,0,0],metallicRoughnessValues:[1,1],metallicRoughnessMapEnabled:!1,occlusionMapEnabled:!1,occlusionStrength:1,alphaCutoffEnabled:!1,alphaCutoff:.5,IBLenabled:!1,scaleIBLAmbient:[1,1],scaleDiffBaseMR:[0,0,0,0],scaleFGDSpec:[0,0,0,0],specularColorFactor:[1,1,1],specularIntensityFactor:1,specularColorMapEnabled:!1,specularIntensityMapEnabled:!1,ior:1.5,transmissionFactor:0,transmissionMapEnabled:!1,thicknessFactor:0,attenuationDistance:1e9,attenuationColor:[1,1,1],clearcoatFactor:0,clearcoatRoughnessFactor:0,clearcoatMapEnabled:!1,clearcoatRoughnessMapEnabled:!1,sheenColorFactor:[0,0,0],sheenRoughnessFactor:0,sheenColorMapEnabled:!1,sheenRoughnessMapEnabled:!1,iridescenceFactor:0,iridescenceIor:1.3,iridescenceThicknessRange:[100,400],iridescenceMapEnabled:!1,anisotropyStrength:0,anisotropyRotation:0,anisotropyDirection:[1,0],anisotropyMapEnabled:!1,emissiveStrength:1,lightmapIntensity:1,scatterStrengthFactor:0,dispersion:0,baseColorUVSet:0,baseColorUVTransform:[1,0,0,0,1,0,0,0,1],metallicRoughnessUVSet:0,metallicRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],normalUVSet:0,normalUVTransform:[1,0,0,0,1,0,0,0,1],occlusionUVSet:0,occlusionUVTransform:[1,0,0,0,1,0,0,0,1],emissiveUVSet:0,lightmapUVSet:0,emissiveUVTransform:[1,0,0,0,1,0,0,0,1],lightmapUVTransform:[1,0,0,0,1,0,0,0,1],specularColorUVSet:0,specularColorUVTransform:[1,0,0,0,1,0,0,0,1],specularIntensityUVSet:0,specularIntensityUVTransform:[1,0,0,0,1,0,0,0,1],transmissionUVSet:0,transmissionUVTransform:[1,0,0,0,1,0,0,0,1],thicknessUVSet:0,thicknessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatUVSet:0,clearcoatUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatRoughnessUVSet:0,clearcoatRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatNormalUVSet:0,clearcoatNormalUVTransform:[1,0,0,0,1,0,0,0,1],sheenColorUVSet:0,sheenColorUVTransform:[1,0,0,0,1,0,0,0,1],sheenRoughnessUVSet:0,sheenRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceUVSet:0,iridescenceUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceThicknessUVSet:0,iridescenceThicknessUVTransform:[1,0,0,0,1,0,0,0,1],anisotropyUVSet:0,anisotropyUVTransform:[1,0,0,0,1,0,0,0,1],bumpFactor:1,bumpMapEnabled:!1,diffuseTransmissionFactor:0,diffuseTransmissionMapEnabled:!1,diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorMapEnabled:!1,multiscatterColorFactor:[0,0,0],multiscatterColorMapEnabled:!1,scatterAnisotropy:0,bumpUVSet:0,bumpUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionUVSet:0,diffuseTransmissionUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionColorUVSet:0,diffuseTransmissionColorUVTransform:[1,0,0,0,1,0,0,0,1],multiscatterColorUVSet:0,multiscatterColorUVTransform:[1,0,0,0,1,0,0,0,1]},name:`pbrMaterial`,firstBindingSlot:0,bindingLayout:[{name:`pbrMaterial`,group:3},{name:`pbr_baseColorSampler`,group:3},{name:`pbr_normalSampler`,group:3},{name:`pbr_emissiveSampler`,group:3},{name:`pbr_lightmapSampler`,group:3},{name:`pbr_metallicRoughnessSampler`,group:3},{name:`pbr_occlusionSampler`,group:3},{name:`pbr_specularColorSampler`,group:3},{name:`pbr_specularIntensitySampler`,group:3},{name:`pbr_transmissionSampler`,group:3},{name:`pbr_thicknessSampler`,group:3},{name:`pbr_clearcoatSampler`,group:3},{name:`pbr_clearcoatRoughnessSampler`,group:3},{name:`pbr_clearcoatNormalSampler`,group:3},{name:`pbr_sheenColorSampler`,group:3},{name:`pbr_sheenRoughnessSampler`,group:3},{name:`pbr_iridescenceSampler`,group:3},{name:`pbr_iridescenceThicknessSampler`,group:3},{name:`pbr_anisotropySampler`,group:3},{name:`pbr_bumpSampler`,group:3},{name:`pbr_diffuseTransmissionSampler`,group:3},{name:`pbr_diffuseTransmissionColorSampler`,group:3},{name:`pbr_multiscatterColorSampler`,group:3}],dependencies:[An,Gn,Vn,{name:`pbrProjection`,bindingLayout:[{name:`pbrProjection`,group:0}],source:`struct pbrProjectionUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  camera: vec3<f32>
};

@group(0) @binding(auto) var<uniform> pbrProjection: pbrProjectionUniforms;
`,vs:Yn,fs:Yn,getUniforms:e=>e,uniformTypes:{modelViewProjectionMatrix:`mat4x4<f32>`,modelMatrix:`mat4x4<f32>`,normalMatrix:`mat4x4<f32>`,camera:`vec3<f32>`}}],source:Jn,vs:Kn,fs:qn,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_LIGHTMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,HAS_SPECULARCOLORMAP:!1,HAS_SPECULARINTENSITYMAP:!1,HAS_TRANSMISSIONMAP:!1,HAS_THICKNESSMAP:!1,HAS_CLEARCOATMAP:!1,HAS_CLEARCOATROUGHNESSMAP:!1,HAS_CLEARCOATNORMALMAP:!1,HAS_SHEENCOLORMAP:!1,HAS_SHEENROUGHNESSMAP:!1,HAS_IRIDESCENCEMAP:!1,HAS_IRIDESCENCETHICKNESSMAP:!1,HAS_ANISOTROPYMAP:!1,HAS_BUMPMAP:!1,HAS_DIFFUSETRANSMISSIONMAP:!1,HAS_DIFFUSETRANSMISSIONCOLORMAP:!1,HAS_MULTISCATTERCOLORMAP:!1,USE_MATERIAL_EXTENSIONS:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:e=>e,uniformTypes:{unlit:`i32`,baseColorMapEnabled:`i32`,baseColorFactor:`vec4<f32>`,normalMapEnabled:`i32`,normalScale:`f32`,emissiveMapEnabled:`i32`,emissiveFactor:`vec3<f32>`,metallicRoughnessValues:`vec2<f32>`,metallicRoughnessMapEnabled:`i32`,occlusionMapEnabled:`i32`,occlusionStrength:`f32`,alphaCutoffEnabled:`i32`,alphaCutoff:`f32`,specularColorFactor:`vec3<f32>`,specularIntensityFactor:`f32`,specularColorMapEnabled:`i32`,specularIntensityMapEnabled:`i32`,ior:`f32`,transmissionFactor:`f32`,transmissionMapEnabled:`i32`,thicknessFactor:`f32`,attenuationDistance:`f32`,attenuationColor:`vec3<f32>`,clearcoatFactor:`f32`,clearcoatRoughnessFactor:`f32`,clearcoatMapEnabled:`i32`,clearcoatRoughnessMapEnabled:`i32`,sheenColorFactor:`vec3<f32>`,sheenRoughnessFactor:`f32`,sheenColorMapEnabled:`i32`,sheenRoughnessMapEnabled:`i32`,iridescenceFactor:`f32`,iridescenceIor:`f32`,iridescenceThicknessRange:`vec2<f32>`,iridescenceMapEnabled:`i32`,anisotropyStrength:`f32`,anisotropyRotation:`f32`,anisotropyDirection:`vec2<f32>`,anisotropyMapEnabled:`i32`,emissiveStrength:`f32`,dispersion:`f32`,IBLenabled:`i32`,scaleIBLAmbient:`vec2<f32>`,scaleDiffBaseMR:`vec4<f32>`,scaleFGDSpec:`vec4<f32>`,baseColorUVSet:`i32`,baseColorUVTransform:`mat3x3<f32>`,metallicRoughnessUVSet:`i32`,metallicRoughnessUVTransform:`mat3x3<f32>`,normalUVSet:`i32`,normalUVTransform:`mat3x3<f32>`,occlusionUVSet:`i32`,occlusionUVTransform:`mat3x3<f32>`,emissiveUVSet:`i32`,emissiveUVTransform:`mat3x3<f32>`,specularColorUVSet:`i32`,specularColorUVTransform:`mat3x3<f32>`,specularIntensityUVSet:`i32`,specularIntensityUVTransform:`mat3x3<f32>`,transmissionUVSet:`i32`,transmissionUVTransform:`mat3x3<f32>`,thicknessUVSet:`i32`,thicknessUVTransform:`mat3x3<f32>`,clearcoatUVSet:`i32`,clearcoatUVTransform:`mat3x3<f32>`,clearcoatRoughnessUVSet:`i32`,clearcoatRoughnessUVTransform:`mat3x3<f32>`,clearcoatNormalUVSet:`i32`,clearcoatNormalUVTransform:`mat3x3<f32>`,sheenColorUVSet:`i32`,sheenColorUVTransform:`mat3x3<f32>`,sheenRoughnessUVSet:`i32`,sheenRoughnessUVTransform:`mat3x3<f32>`,iridescenceUVSet:`i32`,iridescenceUVTransform:`mat3x3<f32>`,iridescenceThicknessUVSet:`i32`,iridescenceThicknessUVTransform:`mat3x3<f32>`,anisotropyUVSet:`i32`,anisotropyUVTransform:`mat3x3<f32>`,bumpFactor:`f32`,bumpMapEnabled:`i32`,diffuseTransmissionFactor:`f32`,diffuseTransmissionMapEnabled:`i32`,diffuseTransmissionColorFactor:`vec3<f32>`,diffuseTransmissionColorMapEnabled:`i32`,multiscatterColorFactor:`vec3<f32>`,multiscatterColorMapEnabled:`i32`,scatterAnisotropy:`f32`,bumpUVSet:`i32`,bumpUVTransform:`mat3x3<f32>`,diffuseTransmissionUVSet:`i32`,diffuseTransmissionUVTransform:`mat3x3<f32>`,diffuseTransmissionColorUVSet:`i32`,diffuseTransmissionColorUVTransform:`mat3x3<f32>`,multiscatterColorUVSet:`i32`,multiscatterColorUVTransform:`mat3x3<f32>`,lightmapMapEnabled:`i32`,lightmapIntensity:`f32`,lightmapUVSet:`i32`,lightmapUVTransform:`mat3x3<f32>`,scatterStrengthFactor:`f32`}},Zn=class{device;modules;_materialBindingNames;_materialModuleNames;constructor(e,t={}){this.device=e,this.modules=t.modules||[];let n=new te(Object.fromEntries(this.modules.map(e=>[e.name,e])));this._materialBindingNames=$n(n),this._materialModuleNames=er(n)}createMaterial(e={}){return new tr(this.device,{...e,factory:this})}getBindingNames(){return Array.from(this._materialBindingNames)}ownsBinding(e){if(this._materialBindingNames.has(e))return!0;let t=Qn(e);return t?this._materialModuleNames.has(t):!1}ownsModule(e){return this._materialModuleNames.has(e)}getBindingsByGroup(e){return Object.keys(e).length>0?{3:e}:{}}};function Qn(e){return e.endsWith(`Uniforms`)?e.slice(0,-8):null}function $n(e){let t=new Set;for(let n of Object.values(e.modules))for(let e of n.bindingLayout||[])e.group===3&&t.add(e.name);return t}function er(e){let t=new Set;for(let n of Object.values(e.modules))n.name&&n.bindingLayout?.some(e=>e.group===3&&e.name===n.name)&&t.add(n.name);return t}var tr=class{id;device;factory;shaderInputs;bindings={};_uniformStore;_bindGroupCacheToken={};_dynamicResourceGenerations={};constructor(e,t={}){this.id=t.id||ce(`material`),this.device=e,this.factory=t.factory||new Zn(e,{modules:t.modules||t.shaderInputs?.getModules()||[]});let n=Object.fromEntries((t.shaderInputs?.getModules()||this.factory.modules).map(e=>[e.name,e]));this.shaderInputs=t.shaderInputs||new te(n),this._uniformStore=new S(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(this.ownsModule(e)&&se(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.updateShaderInputs(),t.bindings&&this._replaceOwnedBindings(t.bindings)}destroy(){this._uniformStore.destroy()}clone(e={}){let t=this.factory.createMaterial({id:e.id,shaderInputs:e.shaderInputs,bindings:{...this.getResourceBindings(),...e.bindings}});return e.shaderInputs||t.setProps(this.shaderInputs.getUniformValues()),e.moduleProps&&t.setProps(e.moduleProps),t.updateShaderInputs(),t}ownsBinding(e){return this.factory.ownsBinding(e)}ownsModule(e){return this.factory.ownsModule(e)}setProps(e){this.shaderInputs.setProps(e)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this._setOwnedBindings(this.shaderInputs.getBindingValues())&&(this._bindGroupCacheToken={})}getResourceBindings(){let e={};for(let[t,n]of Object.entries(this.bindings))Qn(t)||(e[t]=n);return e}getBindings(e={bindings:[]}){this._syncDynamicResourceGenerations();let t={},n=t;for(let[t,r]of Object.entries(this.bindings))if(ue(r)){let i=pe(e,t,{fallbackGroup:3}),a=i?r.resolveTextureBinding(i):null;a&&(n[t]=a)}else r instanceof E?n[t]=r.buffer:re(r)?n[t]=oe(r):n[t]=r;return this._syncDynamicResourceGenerations(),t}getBindingsByGroup(e={bindings:[]}){return this.factory.getBindingsByGroup(this.getBindings(e))}getBindGroupCacheKey(e){return this._syncDynamicResourceGenerations(),e===3?this._bindGroupCacheToken:null}getBindingsUpdateTimestamp(){let e=0;for(let t of Object.values(this.bindings))t instanceof h?e=Math.max(e,t.texture.updateTimestamp):t instanceof i||t instanceof g||t instanceof _||t instanceof E?e=Math.max(e,t.updateTimestamp):ue(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:re(t)&&(e=Math.max(e,(t.buffer instanceof E,t.buffer.updateTimestamp)));return e}_replaceOwnedBindings(e){this._setOwnedBindings(e)&&(this._bindGroupCacheToken={})}_setOwnedBindings(e){let t=!1;for(let[n,r]of Object.entries(e))r!==void 0&&this.ownsBinding(n)&&this.bindings[n]!==r&&(this.bindings[n]=r,t=!0);return t}_syncDynamicResourceGenerations(){let e={},t=!1;for(let[n,r]of Object.entries(this.bindings)){let i=nr(r);i!==null&&(e[n]=i,this._dynamicResourceGenerations[n]!==i&&(t=!0))}Object.keys(e).length!==Object.keys(this._dynamicResourceGenerations).length&&(t=!0),this._dynamicResourceGenerations=e,t&&(this._bindGroupCacheToken={})}};function nr(e){return ue(e)?e.generation:w(e)?.generation??null}var rr={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function ir(e){return e?Array.isArray(e)?e[0]??null:e:null}function ar(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=ir(n);if(!e)return null;let{width:t}=or(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=ir(n);return e?or(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=ir(n[0]);return e?or(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=ir(t);return r?or(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=ir(e[t]);return r?or(r):null}default:return null}}function or(e){if(l(e))return u(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function sr(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function cr(e){return ArrayBuffer.isView(e)}function lr(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function ur(e){let t=rr[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function dr(e,t){return 6*e+ur(t)}function fr(e){throw Error(`setTexture1DData not supported in WebGL.`)}function pr(e){return Array.isArray(e)?e:[e]}function mr(e,t,n,r){let i=pr(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(l(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if(sr(t))o.push({type:`texture-data`,data:t,textureFormat:lr(t),z:a,mipLevel:e});else if(cr(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function hr(e){let t=[];for(let n=0;n<e.length;n++)t.push(...mr(n,e[n]));return t}function gr(e){let t=[];for(let n=0;n<e.length;n++)t.push(...mr(n,e[n]));return t}function _r(e){let t=[];for(let[n,r]of Object.entries(e)){let e=ur(n);t.push(...mr(e,r))}return t}function vr(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=dr(n,r);t.push(...mr(e,i))}}),t}var yr=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=ce(`dynamic-texture`),i=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let n=await this._loadAllData(e);this._checkNotDestroyed();let r=n.data?br({...n,width:e.width,height:e.height,format:e.format}):[],i=`format`in e&&e.format!==void 0,a=`usage`in e&&e.usage!==void 0,o=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:ar(n)||{width:this.props.width||1,height:this.props.height||1};if(!o||o.width<=0||o.height<=0)throw Error(`${this} size could not be determined or was zero`);let s=xr(this.device,r,o,{format:i?e.format:void 0}),c=s.format??this.props.format,l={...this.props,...o,format:c,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(c)&&!a&&(l.usage=g.SAMPLE|g.COPY_DST);let u=this.props.mipmaps&&!s.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(c);if(this.device.type===`webgpu`&&u){let e=this.props.dimension===`3d`?g.SAMPLE|g.STORAGE|g.COPY_DST|g.COPY_SRC:g.SAMPLE|g.RENDER|g.COPY_DST|g.COPY_SRC;l.usage|=e}let d=this.device.getMipLevelCount(l.width,l.height),f=s.hasExplicitMipChain?s.mipLevels:this.props.mipLevels===`auto`?d:Math.max(1,Math.min(d,this.props.mipLevels??1)),p={...l,mipLevels:f};this._texture=this.device.createTexture(p),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),s.subresources.length&&this._setTextureSubresources(s.subresources),this.props.mipmaps&&!s.hasExplicitMipChain&&!u&&t.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),u&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),t.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):t.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof p?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,a=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),o=this.device.createBuffer({byteLength:a.byteLength,usage:i.COPY_DST|i.MAP_READ});this.texture.readBuffer({...e,width:t,height:n,depthOrArrayLayers:r},o);let s=this.device.createFence();return await s.signaled,s.destroy(),o}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let n=this.texture;return this._texture=n.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,n.destroy(),this._touchGeneration(),t.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=rr[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=fr(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=mr(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=hr(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=gr(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=_r(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=vr(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await Tr(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&t.warn(`${this} already destroyed`)}_checkReady(){this.isReady||t.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...g.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function br(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return fr(e.data);case`2d`:return mr(0,e.data,t,n);case`3d`:return hr(e.data);case`2d-array`:return gr(e.data);case`cube`:return _r(e.data);case`cube-array`:return vr(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function xr(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=Cr(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=Sr(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?wr(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=Cr(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=Sr(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function Sr(e){if(e.type===`texture-data`)return e.textureFormat??lr(e.data)}function Cr(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function wr(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function Tr(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(Tr));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(Tr)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}function Er(e,t){if(!e)throw Error(t)}var Dr=class{id;matrix=new k;display=!0;position=new D;rotation=new D;scale=new D(1,1,1);userData={};props={};constructor(e={}){let{id:t}=e;this.id=t||ce(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return Er(e.length===3,`setPosition requires vector argument`),this.position=e,this}setRotation(e){return Er(e.length===3||e.length===4,`setRotation requires vector argument`),this.rotation=e,this}setScale(e){return Er(e.length===3,`setScale requires vector argument`),this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){let{position:t,rotation:n,scale:r,update:i=!0}=e;return t&&this.setPosition(t),n&&this.setRotation(n),r&&this.setScale(r),i&&this.updateMatrix(),this}updateMatrix(){if(this.matrix.identity(),this.matrix.translate(this.position),this.rotation.length===4){let e=new k().fromQuaternion(this.rotation);this.matrix.multiplyRight(e)}else this.matrix.rotateXYZ(this.rotation);return this.matrix.scale(this.scale),this}update({position:e,rotation:t,scale:n}={}){return e&&this.setPosition(e),t&&this.setRotation(t),n&&this.setScale(n),this.updateMatrix(),this}getCoordinateUniforms(e,t){t||=this.matrix;let n=new k(e).multiplyRight(t),r=n.invert(),i=r.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:n,worldInverseMatrix:r,worldInverseTransposeMatrix:i}}_setScenegraphNodeProps(e){e.display!==void 0&&(this.display=e.display),e?.position&&this.setPosition(e.position),e?.rotation&&this.setRotation(e.rotation),e?.scale&&this.setScale(e.scale),this.updateMatrix(),e?.matrix&&this.setMatrix(e.matrix),Object.assign(this.props,e)}};function Or(){return[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]]}function kr(e,t,n){let r=new k(n);for(let n=0;n<8;n++){let i=new D(t[n&1?1:0][0],t[n&2?1:0][1],t[n&4?1:0][2]);r.transformAsPoint(i,i);for(let t=0;t<3;t++)e[0][t]=Math.min(e[0][t],i[t]),e[1][t]=Math.max(e[1][t],i[t])}}function Ar(e){return Number.isFinite(e[0][0])}var jr=class e extends Dr{children;constructor(e={}){e=Array.isArray(e)?{children:e}:e;let{children:n=[]}=e;t.assert(n.every(e=>e instanceof Dr),`every child must an instance of ScenegraphNode`),super(e),this.children=n}getBounds(){let e=Or();return this.traverse((t,{worldMatrix:n})=>{let r=t.getBounds();r&&kr(e,r,new k(n).multiplyRight(t.matrix))}),Ar(e)?e:null}destroy(){this.children.forEach(e=>e.destroy()),this.removeAll(),super.destroy()}add(...e){for(let t of e)Array.isArray(t)?this.add(...t):this.children.push(t);return this}remove(e){let t=this.children,n=t.indexOf(e);return n>-1&&t.splice(n,1),this}removeAll(){return this.children=[],this}traverse(t,{worldMatrix:n=new k}={}){if(!this.display)return;let r=new k(n).multiplyRight(this.matrix);for(let n of this.children)n.display&&(n instanceof e?n.traverse(t,{worldMatrix:r}):t(n,{worldMatrix:r}))}traverseDepthSorted(e,{viewMatrix:t,worldMatrix:n=new k,order:r=`back-to-front`}){let i=new k(t),a=[];this.traverse((e,t)=>{let n=e.getBounds(),r=n?new D(n[0]).add(n[1]).divide([2,2,2]):new D,o=new k(t.worldMatrix).multiplyRight(e.matrix);o.transformAsPoint(r,r),i.transformAsPoint(r,r),a.push({node:e,context:{worldMatrix:o,bounds:n,depth:-r[2]},index:a.length})},{worldMatrix:new k(n)});let o=r===`back-to-front`?-1:1;a.sort((e,t)=>o*(e.context.depth-t.context.depth)||e.index-t.index);for(let{node:t,context:n}of a)e(t,n)}preorderTraversal(t,{worldMatrix:n=new k}={}){let r=new k(n).multiplyRight(this.matrix);t(this,{worldMatrix:r});for(let n of this.children)n instanceof e?n.preorderTraversal(t,{worldMatrix:r}):t(n,{worldMatrix:r})}},Mr=class extends Dr{model;instanceMatrices;bounds=null;managedResources;constructor(e){super(e),this.model=e.model,this.managedResources=e.managedResources||[],this.instanceMatrices=e.instanceMatrices||null,this.bounds=e.bounds?this.instanceMatrices?Nr(e.bounds,this.instanceMatrices):e.bounds:null,this.setProps(e)}destroy(){this.model&&=(this.model.destroy(),null),this.managedResources.forEach(e=>e.destroy()),this.managedResources=[]}getBounds(){return this.bounds}draw(e){return this.model.draw(e)}};function Nr(e,t){let n=Or();for(let r of t)kr(n,e,r);return Ar(n)?n:null}var Pr=class{bindings;scenes;constructor(e){this.scenes=e.scenes,this.bindings=e.bindings,this.update()}update(){if(this.bindings.length===0)return;let e=new Map;for(let t of this.scenes)t.preorderTraversal((t,{worldMatrix:n})=>{t instanceof jr&&e.set(t,new k(n))});for(let t of this.bindings){$t({joints:t.joints,meshNode:t.node,worldMatrices:e,inverseBindMatrices:t.inverseBindMatrices,target:t.jointMatrices}),t.skinJointMatrices&&(t.skinJointMatrices instanceof i?t.skinJointMatrices.write(t.jointMatrices):t.skinJointMatrices.writeData(t.jointMatrices,{width:t.joints.length*4,height:1}));for(let e of t.models)e.model.shaderInputs.setProps({skin:t.skinJointMatrices?{jointMatrices:[],skinJointMatrices:t.skinJointMatrices}:{jointMatrices:t.jointMatrices}})}}getBinding(e){return this.bindings.find(t=>t.node===e)}destroy(){for(let e of this.bindings)e.skinJointMatrices?.destroy()}};function Fr(e,t,n){if(e.type===`webgpu`)return e.createBuffer({id:`${t}-skin-joint-matrices`,byteLength:n.byteLength,usage:i.STORAGE|i.COPY_DST});let r=n.length/4;if(r>e.limits.maxTextureDimension2D)throw Error(`Skin palette exceeds the device texture width limit`);return e.createTexture({id:`${t}-skin-joint-matrices`,format:`rgba32float`,width:r,height:1,usage:g.SAMPLE|g.COPY_DST,sampler:{minFilter:`nearest`,magFilter:`nearest`,mipmapFilter:`nearest`}})}var Ir=class{variants;names;activeVariant=null;bindings;constructor(e){this.variants=e.variants,this.names=this.variants.map(e=>e.name),this.bindings=e.bindings}selectVariant(e){let t=this.variants.find(t=>t.name===e);if(!t)throw Error(`Unknown material variant: ${e}`);for(let{modelNode:e,...n}of this.bindings){let r=n.mappings.get(t.index);e.model.setMaterial(r?.material||n.defaultMaterial),e.model.setParameters(r?.parameters||n.defaultParameters)}this.activeVariant=e}resetVariant(){for(let{modelNode:e,...t}of this.bindings)e.model.setMaterial(t.defaultMaterial),e.model.setParameters(t.defaultParameters);this.activeVariant=null}},Lr=new Set([`variable/get`,`pointer/get`,`math/and`,`math/add`,`math/sub`,`math/mul`,`math/div`,`math/rem`,`math/min`,`math/max`,`math/eq`,`math/lt`,`math/le`,`math/gt`,`math/ge`,`math/select`,`math/switch`,`math/neg`,`math/abs`,`math/clamp`,`type/intToFloat`,`type/floatToInt`]),Rr=new Set([`event/onStart`,`event/onTick`,`event/send`,`debug/log`,`flow/sequence`,`flow/branch`,`flow/switch`,`variable/set`,`pointer/set`,`flow/setDelay`,`KHR_node_selectability:event/onSelect`]);function zr(e){return e.slice()}function Br(e){if(!Array.isArray(e))throw Error(`KHR_interactivity: expected component array`);return e}function Vr(e){return e[0]}function A(e){let t=Vr(e);if(typeof t!=`number`)throw Error(`KHR_interactivity: expected numeric value`);return t}function Hr(e){if(e===`bool`)return[!1];if(e===`int`)return[0];if(e===`ref`)return[null];let t=e?.match(/^float(?:([234])(?:x([234]))?)?$/);if(t&&(!t[2]||t[1]===t[2]))return Array(Number(t[1]??1)*Number(t[2]??1)).fill(NaN);throw Error(`KHR_interactivity: unsupported default value type`)}var Ur=class{definition;graph;variables;properties;maxSteps;onEvent;onLog;started=!1;currentTimeSeconds=0;nextDelayIdentifier=0;pendingDelays=[];startTime=0;lastTick;eventOutputs=new Map;constructor(e,t={}){this.definition=e;let n=t.graph??e.graph??0,r=e.graphs[n];if(!r)throw Error(`KHR_interactivity: graph ${n} does not exist`);if(this.graph=r,this.properties=t.properties,this.onEvent=t.onEvent,this.onLog=t.onLog,this.maxSteps=t.maxSteps??1e4,!Number.isSafeInteger(this.maxSteps)||this.maxSteps<1)throw Error(`KHR_interactivity: maxSteps must be a positive safe integer`);this.variables=(r.variables??[]).map(e=>zr(e.value??[0]));for(let[e,t]of(r.nodes??[]).entries()){let i=this.getOperation(n,e);if(!Lr.has(i)&&!Rr.has(i))throw Error(`KHR_interactivity: unsupported operation ${i}`);if(i===`event/send`){let e=A(this.config(t,`event`));if(!Number.isInteger(e)||!r.events?.[e])throw Error(`KHR_interactivity: invalid custom event index`)}for(let e of Object.values(t.flows??{}))if(!Number.isInteger(e.node)||!(r.nodes??[])[e.node])throw Error(`KHR_interactivity: invalid flow target ${e.node}`)}}get graphCount(){return this.definition.graphs.length}getGraph(e){let t=this.definition.graphs[e];if(!t)throw Error(`KHR_interactivity: graph index ${e} is out of range`);return t}getOperation(e,t){let n=this.getGraph(e),r=n.nodes?.[t];if(!r)throw Error(`KHR_interactivity: node index ${t} is out of range`);let i=n.declarations?.[r.declaration];if(!i)throw Error(`KHR_interactivity: declaration index ${r.declaration} is out of range`);return i.extension?`${i.extension}:${i.op}`:i.op}op(e){let t=this.graph.nodes?.[e],n=t&&this.graph.declarations?.[t.declaration];if(!n)throw Error(`KHR_interactivity: invalid declaration for node ${e}`);return n.extension?`${n.extension}:${n.op}`:n.op}config(e,t){let n=e.configuration?.[t]?.value;if(!n)throw Error(`KHR_interactivity: missing configuration ${t}`);return Br(n)}getSwitchCases(e){let t=e.configuration?.cases?.value;return Array.isArray(t)&&t.every(e=>typeof e==`number`&&Number.isInteger(e)&&e>=-2147483648&&e<=2147483647)?t:[]}input(e,t,n){let r=this.graph.nodes?.[e]?.values?.[t];if(!r)throw Error(`KHR_interactivity: missing input ${t} on node ${e}`);if(r.node!==void 0){if(!r.socket)throw Error(`KHR_interactivity: connected input missing socket`);return this.evaluate(r.node,r.socket,n)}return r.value?zr(Br(r.value)):Hr(r.type===void 0?void 0:this.graph.types?.[r.type]?.signature)}pointer(e,t){let n=this.graph.nodes[e],r=Vr(this.config(n,`pointer`));if(typeof r!=`string`||!r.startsWith(`/`))throw Error(`KHR_interactivity: invalid pointer template`);return r.replace(/\[([^\]]+)\]|\{([^}]+)\}/g,(n,r,i)=>{let a=r??i,o=Vr(this.input(e,a,t));if(i&&typeof o==`string`&&/^\/(?:[^/~]|~[01])+(?:\/(?:[^/~]|~[01])+)*$/.test(o))return o.split(`/`).at(-1);if(!Number.isSafeInteger(o)||o<0)throw Error(`KHR_interactivity: invalid pointer parameter`);return String(o)})}evaluate(e,t=`value`,n=new Set){let r=this.graph.nodes?.[e];if(!r)throw Error(`KHR_interactivity: invalid node ${e}`);if(n.has(e))throw Error(`KHR_interactivity: cyclic value dependency`);n.add(e);try{let i=this.op(e),a=this.eventOutputs.get(e)?.[t];if(a)return zr(a);if(i===`flow/setDelay`&&t===`lastDelay`)return[null];if(i===`variable/get`){let e=A(this.config(r,`variable`)),t=this.variables[e];if(!t)throw Error(`KHR_interactivity: invalid variable index`);return zr(t)}if(i===`pointer/get`){let r=this.properties?.get(this.pointer(e,n));return t===`isValid`?[r!==void 0]:zr(r??[0])}if(t!==`value`)throw Error(`KHR_interactivity: unsupported output socket ${t}`);let o=()=>this.input(e,`a`,n),s=()=>this.input(e,`b`,n),c=e=>{let t=o().map(Number),n=s().map(Number);if(t.length!==n.length)throw Error(`KHR_interactivity: mismatched component lengths`);return t.map((t,r)=>e(t,n[r]))};switch(i){case`type/intToFloat`:return o().map(Number);case`type/floatToInt`:return o().map(e=>Number(e)|0);case`math/clamp`:{let t=s().map(Number),r=this.input(e,`c`,n).map(Number);return o().map((e,n)=>Math.min(r[n],Math.max(t[n],Number(e))))}case`math/and`:{let e=Vr(o()),t=Vr(s());if(typeof e==`boolean`&&typeof t==`boolean`)return[e&&t];if(typeof e==`number`&&typeof t==`number`)return[e&t];throw Error(`KHR_interactivity: incompatible AND arguments`)}case`math/add`:return c((e,t)=>e+t);case`math/sub`:return c((e,t)=>e-t);case`math/mul`:return c((e,t)=>e*t);case`math/div`:return c((e,t)=>e/t);case`math/rem`:return c((e,t)=>e%t);case`math/min`:return c(Math.min);case`math/max`:return c(Math.max);case`math/neg`:return o().map(e=>-Number(e));case`math/abs`:return o().map(e=>Math.abs(Number(e)));case`math/eq`:return[JSON.stringify(o())===JSON.stringify(s())];case`math/lt`:return[A(o())<A(s())];case`math/le`:return[A(o())<=A(s())];case`math/gt`:return[A(o())>A(s())];case`math/ge`:return[A(o())>=A(s())];case`math/select`:return this.input(e,Vr(this.input(e,`condition`,n))?`a`:`b`,n);case`math/switch`:{let t=A(this.input(e,`selection`,n)),i=this.getSwitchCases(r);return this.input(e,i.includes(t)?String(t):`default`,n)}default:throw Error(`KHR_interactivity: ${i} is not a value operation`)}}finally{n.delete(e)}}dispatch(e,t,n){let r=0,i=(e,t)=>{if(++r>this.maxSteps)throw Error(`KHR_interactivity: flow step limit exceeded`);let n=this.graph.nodes[e],a=this.op(e);if(a===`flow/setDelay`&&t===`cancel`){this.pendingDelays=this.pendingDelays.filter(t=>t.nodeIndex!==e),this.eventOutputs.set(e,{lastDelay:[null]});return}if(t!==`in`)throw Error(`KHR_interactivity: unsupported input flow ${t}`);let o=new Set,s=e=>{let t=n.flows?.[e];t&&i(t.node,t.socket??`in`)};switch(a){case`flow/setDelay`:{let t=A(this.input(e,`duration`,o)),n=this.currentTimeSeconds+t;if(!Number.isFinite(n)||!Number.isFinite(t)||t<0||this.pendingDelays.length>=1024){s(`err`);break}let i=`delay:${++this.nextDelayIdentifier}`;this.eventOutputs.set(e,{lastDelay:[i]}),this.pendingDelays.push({nodeIndex:e,reference:i,timeSeconds:n,activate:()=>{r=0,s(`done`)}}),s(`out`);break}case`flow/sequence`:for(let e of Object.keys(n.flows??{}).sort())s(e);break;case`flow/branch`:s(Vr(this.input(e,`condition`,o))?`true`:`false`);break;case`flow/switch`:{let t=A(this.input(e,`selection`,o));s(this.getSwitchCases(n).includes(t)?String(t):`default`);break}case`variable/set`:{let t=this.config(n,`variables`).map(Number),r=t.map(t=>this.input(e,String(t),o));t.forEach((e,t)=>{if(!this.variables[e])throw Error(`KHR_interactivity: invalid variable index`);this.variables[e]=zr(r[t])}),s(`out`);break}case`event/send`:{let t=A(this.config(n,`event`)),r=this.graph.events[t],i=Object.fromEntries(Object.entries(r.values??{}).map(([t,r])=>[t,n.values?.[t]?this.input(e,t,o):r.value?zr(r.value):Hr(this.graph.types?.[r.type]?.signature)]));this.onEvent?.(r.id,i),s(`out`);break}case`debug/log`:{let t=n.configuration?.severity?.value[0],r=n.configuration?.message?.value[0],i=typeof r==`string`?r.match(/\{\{|\}\}|\{[^{}]+\}|[^{}]+/g):null,a=typeof r==`string`&&(i??[]).join(``)===r?(i??[]).map(t=>t===`{{`?`{`:t===`}}`?`}`:t.startsWith(`{`)?JSON.stringify(this.input(e,t.slice(1,-1),o)):t).join(``):``;this.onLog?.(a,typeof t==`number`&&t===(t|0)?t:0),s(`out`);break}case`pointer/set`:{let t=this.pointer(e,o),n=this.input(e,`value`,o);s(this.properties?.set(t,n)?`out`:`err`);break}default:throw Error(`KHR_interactivity: ${a} is not an executable flow operation`)}},a=this.graph.nodes??[];for(let r=0;r<a.length;r++)if(this.op(r)===e&&(n===void 0||a[r].configuration?.nodeIndex?.value[0]===n)){this.eventOutputs.set(r,t);let e=a[r].flows?.out;e&&i(e.node,e.socket??`in`)}}start(){this.started||(this.started=!0,this.dispatch(`event/onStart`,{event:[null]}))}selectNode(e){this.start(),this.dispatch(`KHR_node_selectability:event/onSelect`,{selectedNode:[`/nodes/${e}`],selectionRayOrigin:[0,0,0],selectionPoint:[0,0,0],controllerIndex:[0],event:[null]},e)}tick(e){if(!Number.isFinite(e))throw Error(`KHR_interactivity: invalid tick time`);if(this.lastTick!==void 0&&e<this.lastTick)throw Error(`KHR_interactivity: tick time must be monotonic`);if(this.lastTick===void 0){this.startTime=e;let t=e-this.currentTimeSeconds;for(let e of this.pendingDelays)e.timeSeconds+=t}let t=this.lastTick===void 0?NaN:e-this.lastTick;this.lastTick=e,this.currentTimeSeconds=e,this.start();let n=this.pendingDelays.filter(t=>t.timeSeconds<=e).sort((e,t)=>e.timeSeconds-t.timeSeconds);for(let e of n)this.pendingDelays.includes(e)&&(this.pendingDelays=this.pendingDelays.filter(t=>t!==e),e.activate());this.dispatch(`event/onTick`,{timeSinceStart:[e-this.startTime],timeSinceLastTick:[t],event:[null]})}};function Wr(e,t){if(!e)throw Error(t||`loader assertion failed.`)}var Gr={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};Gr.self||Gr.window||Gr.global,Gr.window||Gr.self||Gr.global,Gr.global||Gr.self||Gr.window,Gr.document;var Kr=!!(typeof process!=`object`||String(process)!==`[object process]`||process.browser),qr=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);qr&&parseFloat(qr[1]);var Jr=`v4.5.2`;function Yr(){let e=new Qe({id:`loaders.gl`});return globalThis.loaders||={},globalThis.loaders.log=e,globalThis.loaders.version=Jr,globalThis.probe||={},globalThis.probe.loaders=e,e}var Xr=Yr(),Zr=e=>typeof e==`boolean`,Qr=e=>typeof e==`function`,$r=e=>typeof e==`object`&&!!e,ei=e=>$r(e)&&e.constructor==={}.constructor,ti=e=>typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer,ni=e=>$r(e)&&typeof e.byteLength==`number`&&typeof e.slice==`function`,ri=e=>!!e&&Qr(e[Symbol.iterator]),ii=e=>!!e&&Qr(e[Symbol.asyncIterator]),ai=e=>typeof Response<`u`&&e instanceof Response||$r(e)&&Qr(e.arrayBuffer)&&Qr(e.text)&&Qr(e.json),oi=e=>typeof Blob<`u`&&e instanceof Blob,si=e=>typeof ReadableStream<`u`&&e instanceof ReadableStream||$r(e)&&Qr(e.tee)&&Qr(e.cancel)&&Qr(e.getReader),ci=e=>$r(e)&&Qr(e.read)&&Qr(e.pipe)&&Zr(e.readable),li=e=>si(e)||ci(e);function ui(e,t){return di(e||{},t)}function di(e,t,n=0){if(n>3)return t;let r={...e};for(let[e,i]of Object.entries(t))i&&typeof i==`object`&&!Array.isArray(i)?r[e]=di(r[e]||{},t[e],n+1):r[e]=t[e];return r}var fi=`latest`;function pi(){return globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version=`4.5.2`),globalThis._loadersgl_.version}var mi=pi();function hi(e,t){if(!e)throw Error(t||`loaders.gl assertion failed.`)}var gi={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};gi.self||gi.window||gi.global,gi.window||gi.self||gi.global,gi.global||gi.self||gi.window,gi.document;var _i=typeof process!=`object`||String(process)!==`[object process]`||process.browser,vi=typeof window<`u`&&window.orientation!==void 0,yi=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);yi&&parseFloat(yi[1]);var bi=class{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t){this.workerThread.postMessage({source:`loaders.gl`,type:e,payload:t})}done(e){hi(this.isRunning),this.isRunning=!1,this._resolve(e)}error(e){hi(this.isRunning),this.isRunning=!1,this._reject(e)}},xi=class{terminate(){}},Si=new Map;function Ci(e){hi(e.source&&!e.url||!e.source&&e.url);let t=Si.get(e.source||e.url);return t||(e.url&&(t=wi(e.url),Si.set(e.url,t)),e.source&&(t=Ti(e.source),Si.set(e.source,t))),hi(t),t}function wi(e){return e.startsWith(`http`)?Ti(Ei(e)):e}function Ti(e){let t=new Blob([e],{type:`application/javascript`});return URL.createObjectURL(t)}function Ei(e){return`\
try {
  importScripts('${e}');
} catch (error) {
  console.error(error);
  throw error;
}`}function Di(e,t=!0,n){let r=n||new Set;if(e){if(Oi(e))r.add(e);else if(Oi(e.buffer))r.add(e.buffer);else if(!ArrayBuffer.isView(e)&&t&&typeof e==`object`)for(let n in e)Di(e[n],t,r)}return n===void 0?Array.from(r):[]}function Oi(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}var ki=()=>{},Ai=class{name;source;url;terminated=!1;worker;onMessage;onError;_loadableURL=``;static isSupported(){return typeof Worker<`u`&&_i||xi!==void 0&&!_i}constructor(e){let{name:t,source:n,url:r}=e;hi(n||r),this.name=t,this.source=n,this.url=r,this.onMessage=ki,this.onError=e=>console.log(e),this.worker=_i?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=ki,this.onError=ki,this.worker.terminate(),this.terminated=!0}get isRunning(){return!!this.onMessage}postMessage(e,t){t||=Di(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t=`Failed to load `;return t+=`worker ${this.name} from ${this.url}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){this._loadableURL=Ci({source:this.source,url:this.url});let e=new Worker(this._loadableURL,{name:this.name});return e.onmessage=e=>{e.data?this.onMessage(e.data):this.onError(Error(`No data received`))},e.onerror=e=>{this.onError(this._getErrorFromErrorEvent(e)),this.terminated=!0},e.onmessageerror=e=>console.error(e),e}_createNodeWorker(){let e;if(this.url)e=new xi(this.url.includes(`:/`)||this.url.startsWith(`/`)?this.url:`./${this.url}`,{eval:!1,type:this.url.endsWith(`.ts`)||this.url.endsWith(`.mjs`)?`module`:`commonjs`});else if(this.source)e=new xi(this.source,{eval:!0});else throw Error(`no worker`);return e.on(`message`,e=>{this.onMessage(e)}),e.on(`error`,e=>{this.onError(e)}),e.on(`exit`,e=>{}),e}},ji=class{name=`unnamed`;source;url;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];count=0;isDestroyed=!1;static isSupported(){return Ai.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.setProps(e)}destroy(){this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},e.name!==void 0&&(this.name=e.name),e.maxConcurrency!==void 0&&(this.maxConcurrency=e.maxConcurrency),e.maxMobileConcurrency!==void 0&&(this.maxMobileConcurrency=e.maxMobileConcurrency),e.reuseWorkers!==void 0&&(this.reuseWorkers=e.reuseWorkers),e.onDebug!==void 0&&(this.onDebug=e.onDebug)}async startJob(e,t=(e,t,n)=>e.done(n),n=(e,t)=>e.error(t)){let r=new Promise(r=>(this.jobQueue.push({name:e,onMessage:t,onError:n,onStart:r}),this));return this._startQueuedJob(),await r}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:`Starting job`,name:t.name,workerThread:e,backlog:this.jobQueue.length});let n=new bi(t.name,e);e.onMessage=e=>t.onMessage(n,e.type,e.payload),e.onError=e=>t.onError(n,e),t.onStart(n);try{await n.result}catch(e){console.error(`Worker exception: ${e}`)}finally{this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){!_i||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.destroy(),this.count--):this.idleQueue.push(e),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){return this.idleQueue.length>0?this.idleQueue.shift()||null:this.count<this._getMaxConcurrency()?(this.count++,new Ai({name:`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`,source:this.source,url:this.url})):null}_getMaxConcurrency(){return vi?this.maxMobileConcurrency:this.maxConcurrency}},Mi={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}},Ni=class e{props;workerPools=new Map;static _workerFarm;static isSupported(){return Ai.isSupported()}static getWorkerFarm(t={}){return e._workerFarm=e._workerFarm||new e({}),e._workerFarm.setProps(t),e._workerFarm}constructor(e){this.props={...Mi},this.setProps(e),this.workerPools=new Map}destroy(){for(let e of this.workerPools.values())e.destroy();this.workerPools=new Map}setProps(e){this.props={...this.props,...e};for(let e of this.workerPools.values())e.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:n,url:r}=e,i=this.workerPools.get(t);return i||(i=new ji({name:t,source:n,url:r}),i.setProps(this._getWorkerPoolProps()),this.workerPools.set(t,i)),i}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}};function Pi(e,t={}){let n=t[e.id]||{},r=_i?e.workerFile||`${e.id}-worker.js`:`${e.id}-worker-node.js`,i=n.workerUrl;if(!i&&e.id===`compression`&&(i=t.workerUrl),(t._workerType||t?.core?._workerType)===`test`&&(i=_i?`modules/${e.module}/dist/${r}`:`modules/${e.module}/src/workers/${e.id}-worker-node.ts`),!i){let t=e.version;t===`latest`&&(t=fi);let n=t?`@${t}`:``;i=`https://unpkg.com/@loaders.gl/${e.module}${n}/dist/${r}`}return hi(i),i}function Fi(e,t=mi){hi(e,`no worker provided`);let n=e.version;return!(!t||!n)}function Ii(e,t){if(!Ni.isSupported())return!1;let n=t?._nodeWorkers??t?.core?._nodeWorkers;if(!_i&&!n)return!1;let r=t?.worker??t?.core?.worker;return!!(e.worker&&r)}async function Li(e,t,n,r,i){let a=e.id,o=Pi(e,n),s=Ni.getWorkerFarm(n?.core).getWorkerPool({name:a,url:o});n=JSON.parse(JSON.stringify(n||{})),n._workerLoaderId=e.id,r=JSON.parse(JSON.stringify(r||{}));let c=await s.startJob(`process-on-worker`,Ri.bind(null,i));return c.postMessage(`process`,{input:t,options:n,context:r}),await(await c.result).result}async function Ri(e,t,n,r){switch(n){case`done`:t.done(r);break;case`error`:t.error(Error(r.error));break;case`process`:let{id:i,input:a,options:o}=r;try{let n=await e(a,o);t.postMessage(`done`,{id:i,result:n})}catch(e){let n=e instanceof Error?e.message:`unknown error`;t.postMessage(`error`,{id:i,error:n})}break;default:console.warn(`parse-with-worker unknown message ${n}`)}}function zi(e,t,n){if(n||=e.byteLength,e.byteLength<n||t.byteLength<n)return!1;let r=new Uint8Array(e),i=new Uint8Array(t);for(let e=0;e<r.length;++e)if(r[e]!==i[e])return!1;return!0}function Bi(...e){return Vi(e)}function Vi(e){let t=e.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),n=t.reduce((e,t)=>e+t.byteLength,0),r=new Uint8Array(n),i=0;for(let e of t)r.set(e,i),i+=e.byteLength;return r.buffer}async function Hi(e){let t=[];for await(let n of e)t.push(Ui(n));return Bi(...t)}function Ui(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:n,byteLength:r}=e;return Wi(t,n,r)}return Wi(e)}function Wi(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function Gi(){let e;if(typeof window<`u`&&window.performance)e=window.performance.now();else if(typeof process<`u`&&process.hrtime){let t=process.hrtime();e=t[0]*1e3+t[1]/1e6}else e=Date.now();return e}var Ki=class{constructor(e,t){this.sampleSize=1,this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this.name=e,this.type=t,this.reset()}reset(){return this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this}setSampleSize(e){return this.sampleSize=e,this}incrementCount(){return this.addCount(1),this}decrementCount(){return this.subtractCount(1),this}addCount(e){return this._count+=e,this._samples++,this._checkSampling(),this}subtractCount(e){return this._count-=e,this._samples++,this._checkSampling(),this}addTime(e){return this._time+=e,this.lastTiming=e,this._samples++,this._checkSampling(),this}timeStart(){return this._startTime=Gi(),this._timerPending=!0,this}timeEnd(){return this._timerPending?(this.addTime(Gi()-this._startTime),this._timerPending=!1,this._checkSampling(),this):this}getSampleAverageCount(){return this.sampleSize>0?this.lastSampleCount/this.sampleSize:0}getSampleAverageTime(){return this.sampleSize>0?this.lastSampleTime/this.sampleSize:0}getSampleHz(){return this.lastSampleTime>0?this.sampleSize/(this.lastSampleTime/1e3):0}getAverageCount(){return this.samples>0?this.count/this.samples:0}getAverageTime(){return this.samples>0?this.time/this.samples:0}getHz(){return this.time>0?this.samples/(this.time/1e3):0}_checkSampling(){this._samples===this.sampleSize&&(this.lastSampleTime=this._time,this.lastSampleCount=this._count,this.count+=this._count,this.time+=this._time,this.samples+=this._samples,this._time=0,this._count=0,this._samples=0)}},qi=class{constructor(e){this.stats={},this.id=e.id,this.stats={},this._initializeStats(e.stats),Object.seal(this)}get(e,t=`count`){return this._getOrCreate({name:e,type:t})}get size(){return Object.keys(this.stats).length}reset(){for(let e of Object.values(this.stats))e.reset();return this}forEach(e){for(let t of Object.values(this.stats))e(t)}getTable(){let e={};return this.forEach(t=>{e[t.name]={time:t.time||0,count:t.count||0,average:t.getAverageTime()||0,hz:t.getHz()||0}}),e}_initializeStats(e=[]){e.forEach(e=>this._getOrCreate(e))}_getOrCreate(e){let{name:t,type:n}=e,r=this.stats[t];return r||(r=e instanceof Ki?e:new Ki(t,n),this.stats[t]=r),r}},Ji=``,Yi={};function Xi(e){for(let t in Yi)if(e.startsWith(t)){let n=Yi[t];e=e.replace(t,n)}return!e.startsWith(`http://`)&&!e.startsWith(`https://`)&&(e=`${Ji}${e}`),e}function Zi(e){return e}function Qi(e){return e&&typeof e==`object`&&e.isBuffer}function $i(e){if(Qi(e))return Zi(e);if(e instanceof ArrayBuffer)return e;if(ti(e))return ta(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return e.byteOffset===0&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if(typeof e==`string`){let t=e;return new TextEncoder().encode(t).buffer}if(e&&typeof e==`object`&&e._toArrayBuffer)return e._toArrayBuffer();throw Error(`toArrayBuffer`)}function ea(e){if(e instanceof ArrayBuffer)return e;if(ti(e))return ta(e);let{buffer:t,byteOffset:n,byteLength:r}=e;return t instanceof ArrayBuffer&&n===0&&r===t.byteLength?t:ta(t,n,r)}function ta(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function na(e){return ArrayBuffer.isView(e)?e:new Uint8Array(e)}function ra(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(t+1):e}function ia(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(0,t):``}var aa=class extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response},oa=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,sa=/^([-\w.]+\/[-\w.+]+)/;function ca(e,t){return e.toLowerCase()===t.toLowerCase()}function la(e){let t=sa.exec(e);return t?t[1]:e}function ua(e){let t=oa.exec(e);return t?t[1]:``}var da=/\?.*/;function fa(e){let t=e.match(da);return t&&t[0]}function pa(e){return e.replace(da,``)}function ma(e){if(e.length<50)return e;let t=e.slice(e.length-15);return`${e.substr(0,32)}...${t}`}function ha(e){return ai(e)?e.url:oi(e)?(`name`in e?e.name:``)||``:typeof e==`string`?e:``}function ga(e){if(ai(e)){let t=e.headers.get(`content-type`)||``,n=pa(e.url);return la(t)||ua(n)}return oi(e)?e.type||``:typeof e==`string`?ua(e):``}function _a(e){return ai(e)?e.headers[`content-length`]||-1:oi(e)?e.size:typeof e==`string`?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}async function va(e){if(ai(e))return e;let t={},n=_a(e);n>=0&&(t[`content-length`]=String(n));let r=ha(e),i=ga(e);i&&(t[`content-type`]=i);let a=await xa(e);a&&(t[`x-first-bytes`]=a),typeof e==`string`&&(e=new TextEncoder().encode(e));let o=new Response(e,{headers:t});return Object.defineProperty(o,`url`,{value:r}),o}async function ya(e){if(!e.ok)throw await ba(e)}async function ba(e){let t=ma(e.url),n=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;n=n.length>100?`${n.slice(0,100)}...`:n;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get(`Content-Type`);r.reason=!e.bodyUsed&&t?.includes(`application/json`)?await e.json():await e.text()}catch{}return new aa(n,r)}async function xa(e){if(typeof e==`string`)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let n=new FileReader;n.onload=t=>e(t?.target?.result),n.readAsDataURL(t)})}return e instanceof ArrayBuffer?`data:base64,${Sa(e.slice(0,5))}`:null}function Sa(e){let t=``,n=new Uint8Array(e);for(let e=0;e<n.byteLength;e++)t+=String.fromCharCode(n[e]);return btoa(t)}function Ca(e){return!wa(e)&&!Ta(e)}function wa(e){return e.startsWith(`http:`)||e.startsWith(`https:`)}function Ta(e){return e.startsWith(`data:`)}async function Ea(e,t){if(typeof e==`string`){let n=Xi(e);return Ca(n)&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(n,t):await fetch(n,t)}return await va(e)}var Da=new Qe({id:`loaders.gl`}),Oa=class{log(){return()=>{}}info(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}},ka={core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,log:new class{console;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,CDN:`https://unpkg.com/@loaders.gl`,worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:Kr,_nodeWorkers:!1,_workerType:``,limit:0,_limitMB:0,batchSize:`auto`,batchDebounceMs:0,metadata:!1,transforms:[]}},Aa={baseUri:`core.baseUrl`,fetch:`core.fetch`,mimeType:`core.mimeType`,fallbackMimeType:`core.fallbackMimeType`,ignoreRegisteredLoaders:`core.ignoreRegisteredLoaders`,nothrow:`core.nothrow`,log:`core.log`,useLocalLibraries:`core.useLocalLibraries`,CDN:`core.CDN`,worker:`core.worker`,maxConcurrency:`core.maxConcurrency`,maxMobileConcurrency:`core.maxMobileConcurrency`,reuseWorkers:`core.reuseWorkers`,_nodeWorkers:`core.nodeWorkers`,_workerType:`core._workerType`,_worker:`core._workerType`,limit:`core.limit`,_limitMB:`core._limitMB`,batchSize:`core.batchSize`,batchDebounceMs:`core.batchDebounceMs`,metadata:`core.metadata`,transforms:`core.transforms`,throws:`nothrow`,dataType:`(no longer used)`,uri:`core.baseUrl`,method:`core.fetch.method`,headers:`core.fetch.headers`,body:`core.fetch.body`,mode:`core.fetch.mode`,credentials:`core.fetch.credentials`,cache:`core.fetch.cache`,redirect:`core.fetch.redirect`,referrer:`core.fetch.referrer`,referrerPolicy:`core.fetch.referrerPolicy`,integrity:`core.fetch.integrity`,keepalive:`core.fetch.keepalive`,signal:`core.fetch.signal`},ja=[`baseUrl`,`fetch`,`mimeType`,`fallbackMimeType`,`ignoreRegisteredLoaders`,`nothrow`,`log`,`useLocalLibraries`,`CDN`,`worker`,`maxConcurrency`,`maxMobileConcurrency`,`reuseWorkers`,`_nodeWorkers`,`_workerType`,`limit`,`_limitMB`,`batchSize`,`batchDebounceMs`,`metadata`,`transforms`];function Ma(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||={},e._state}function Na(){let e=Ma();return e.globalOptions=e.globalOptions||{...ka,core:{...ka.core}},Fa(e.globalOptions)}function Pa(e,t,n,r){return n||=[],n=Array.isArray(n)?n:[n],Ia(e,n),Fa(za(t,e,r))}function Fa(e){let t=Ha(e);Ua(t);for(let e of ja)t.core&&t.core[e]!==void 0&&delete t[e];return t.core&&t.core._workerType!==void 0&&delete t._worker,t}function Ia(e,t){La(e,null,ka,Aa,t);for(let n of t){let r=e&&e[n.id]||{},i=n.options&&n.options[n.id]||{},a=n.deprecatedOptions&&n.deprecatedOptions[n.id]||{};La(r,n.id,i,a,t)}}function La(e,t,n,r,i){let a=t||`Top level`,o=t?`${t}.`:``;for(let s in e){let c=!t&&$r(e[s]),l=s===`baseUri`&&!t,u=s===`workerUrl`&&t;if(!(s in n)&&!l&&!u){if(s in r)Da.level>0&&Da.warn(`${a} loader option \'${o}${s}\' no longer supported, use \'${r[s]}\'`)();else if(!c&&Da.level>0){let e=Ra(s,i);Da.warn(`${a} loader option \'${o}${s}\' not recognized. ${e}`)()}}}}function Ra(e,t){let n=e.toLowerCase(),r=``;for(let i of t)for(let t in i.options){if(e===t)return`Did you mean \'${i.id}.${t}\'?`;let a=t.toLowerCase();(n.startsWith(a)||a.startsWith(n))&&(r||=`Did you mean \'${i.id}.${t}\'?`)}return r}function za(e,t,n){let r=e.options||{},i={...r};return r.core&&(i.core={...r.core}),Ua(i),i.core?.log===null&&(i.core={...i.core,log:new Oa}),Ba(i,Fa(Na())),Ba(i,Fa(t)),Va(i,n),Wa(i),i}function Ba(e,t){for(let n in t)if(n in t){let r=t[n];ei(r)&&ei(e[n])?e[n]={...e[n],...t[n]}:e[n]=t[n]}}function Va(e,t){t&&e.core?.baseUrl===void 0&&(e.core||={},e.core.baseUrl=ia(pa(t)))}function Ha(e){let t={...e};return e.core&&(t.core={...e.core}),t}function Ua(e){e.baseUri!==void 0&&(e.core||={},e.core.baseUrl===void 0&&(e.core.baseUrl=e.baseUri));for(let t of ja)if(e[t]!==void 0){let n=e.core=e.core||{};n[t]===void 0&&(n[t]=e[t])}let t=e._worker;t!==void 0&&(e.core||={},e.core._workerType===void 0&&(e.core._workerType=t))}function Wa(e){let t=e.core;if(t)for(let n of ja)t[n]!==void 0&&(e[n]=t[n])}function Ga(e){return e?(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions)):!1}function Ka(e){Wr(e,`null loader`),Wr(Ga(e),`invalid loader`);let t;return Array.isArray(e)&&(t=e[1],e=e[0],e={...e,options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}var qa=()=>{let e=Ma();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function Ja(e){let t=qa();e=Array.isArray(e)?e:[e];for(let n of e){let e=Ka(n);t.find(t=>e===t)||t.unshift(e)}}function Ya(){return qa()}var Xa=/\.([^.]+)$/;async function Za(e,t=[],n,r){if(!to(e))return null;let i=Fa(n||{});if(i.core||={},e instanceof Response&&Qa(e)){let n=$a(await e.clone().text(),t,{...i,core:{...i.core,nothrow:!0}},r);if(n)return n}let a=$a(e,t,{...i,core:{...i.core,nothrow:!0}},r);if(a)return a;if(oi(e)&&(e=await e.slice(0,10).arrayBuffer(),a=$a(e,t,i,r)),!a&&e instanceof Response&&Qa(e)&&(a=$a(await e.clone().text(),t,i,r)),!a&&!i.core.nothrow)throw Error(no(e));return a}function Qa(e){let t=ga(e);return!!(t&&(t.startsWith(`text/`)||t===`application/json`||t.endsWith(`+json`)))}function $a(e,t=[],n,r){if(!to(e))return null;let i=Fa(n||{});if(i.core||={},t&&!Array.isArray(t))return Ka(t);let a=[];t&&(a=a.concat(t)),i.core.ignoreRegisteredLoaders||a.push(...Ya()),ro(a);let o=eo(e,a,i,r);if(!o&&!i.core.nothrow)throw Error(no(e));return o}function eo(e,t,n,r){let i=ha(e),a=ga(e),o=pa(i)||r?.url,s=null,c=``;return n?.core?.mimeType&&(s=oo(t,n?.core?.mimeType),c=`match forced by supplied MIME type ${n?.core?.mimeType}`),s||=io(t,o),c||=s?`matched url ${o}`:``,s||=oo(t,a),c||=s?`matched MIME type ${a}`:``,s||=so(t,e),c||=s?`matched initial data ${fo(e)}`:``,n?.core?.fallbackMimeType&&(s||=oo(t,n?.core?.fallbackMimeType),c||=s?`matched fallback MIME type ${a}`:``),c&&Xr.log(1,`selectLoader selected ${s?.name}: ${c}.`),s}function to(e){return!(e instanceof Response&&e.status===204)}function no(e){let t=ha(e),n=ga(e),r=`No valid loader found (`;r+=t?`${ra(t)}, `:`no url provided, `,r+=`MIME type: ${n?`"${n}"`:`not provided`}, `;let i=e?fo(e):``;return r+=i?` first bytes: "${i}"`:`first bytes: not available`,r+=`)`,r}function ro(e){for(let t of e)Ka(t)}function io(e,t){let n=t&&Xa.exec(t),r=n&&n[1];return r?ao(e,r):null}function ao(e,t){t=t.toLowerCase();for(let n of e)for(let e of n.extensions)if(e.toLowerCase()===t)return n;return null}function oo(e,t){for(let n of e)if(n.mimeTypes?.some(e=>ca(t,e))||ca(t,`application/x.${n.id}`))return n;return null}function so(e,t){if(!t)return null;for(let n of e)if(typeof t==`string`){if(co(t,n))return n}else if(ArrayBuffer.isView(t)){if(lo(t.buffer,t.byteOffset,n))return n}else if(t instanceof ArrayBuffer&&lo(t,0,n))return n;return null}function co(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}function lo(e,t,n){return(Array.isArray(n.tests)?n.tests:[n.tests]).some(r=>uo(e,t,n,r))}function uo(e,t,n,r){if(ni(r))return zi(r,e,r.byteLength);switch(typeof r){case`function`:return r(ea(e));case`string`:return r===po(e,t,r.length);default:return!1}}function fo(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?po(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?po(e,0,t):``}function po(e,t,n){if(e.byteLength<t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}var mo=256*1024;function*ho(e,t){let n=t?.chunkSize||mo,r=0,i=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,n),a=e.slice(r,r+t);r+=t,yield ea(i.encode(a))}}var go=256*1024;function*_o(e,t={}){let{chunkSize:n=go}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,n),i=new ArrayBuffer(t),a=new Uint8Array(e,r,t);new Uint8Array(i).set(a),r+=t,yield i}}var vo=1024*1024;async function*yo(e,t){let n=t?.chunkSize||vo,r=0;for(;r<e.size;){let t=r+n,i=await e.slice(r,t).arrayBuffer();r=t,yield i}}function bo(e,t){return Kr?xo(e,t):So(e,t)}async function*xo(e,t){let n=e.getReader(),r;try{for(;;){let e=r||n.read();t?._streamReadAhead&&(r=n.read());let{done:i,value:a}=await e;if(i)return;yield $i(a)}}catch{n.releaseLock()}}async function*So(e,t){for await(let t of e)yield $i(t)}function Co(e,t){if(typeof e==`string`)return ho(e,t);if(e instanceof ArrayBuffer)return _o(e,t);if(oi(e))return yo(e,t);if(li(e))return bo(e,t);if(ai(e)){let n=e.body;if(!n)throw Error(`Readable stream not available on Response`);return bo(n,t)}throw Error(`makeIterator`)}var wo=`Cannot convert supplied data type`;function To(e,t,n){if(t.text&&typeof e==`string`)return e;if(Qi(e)&&(e=e.buffer),ni(e)){let n=na(e);return t.text&&!t.binary?new TextDecoder(`utf8`).decode(n):$i(n)}throw Error(wo)}async function Eo(e,t,n){if(typeof e==`string`||ni(e))return To(e,t,n);if(oi(e)&&(e=await va(e)),ai(e))return await ya(e),t.binary?await e.arrayBuffer():await e.text();if(li(e)&&(e=Co(e,n)),ri(e)||ii(e))return Hi(e);throw Error(wo)}function Do(e,t){let n=Na(),r=e||n,i=r.fetch??r.core?.fetch;return typeof i==`function`?i:$r(i)?e=>Ea(e,i):t?.fetch?t?.fetch:Ea}function Oo(e,t,n){if(n)return n;let r={fetch:Do(t,e),...e};if(r.url){let e=pa(r.url);r.baseUrl=e,r.queryString=fa(r.url),r.filename=ra(e),r.baseUrl=ia(e)}return Array.isArray(r.loaders)||(r.loaders=null),r}function ko(e,t){if(e&&!Array.isArray(e))return e;let n;if(e&&(n=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];n=n?[...n,...e]:e}return n&&n.length?n:void 0}async function Ao(e,t,n,r){t&&!Array.isArray(t)&&!Ga(t)&&(r=void 0,n=t,t=void 0),e=await e,n||={};let i=ha(e),a=ko(t,r),o=await Za(e,a,n);if(!o)return null;let s=Pa(n,o,a,i);return r=Oo({url:i,_parse:Ao,loaders:a},s,r||null),await jo(o,e,s,r)}async function jo(e,t,n,r){if(Fi(e),n=ui(e.options,n),ai(t)){let{ok:e,redirected:n,status:i,statusText:a,type:o,url:s}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:n,status:i,statusText:a,type:o,url:s}}t=await Eo(t,e,n);let i=e;if(i.parseTextSync&&typeof t==`string`)return i.parseTextSync(t,n,r);if(Ii(e,n))return await Li(e,t,n,r,Ao);if(i.parseText&&typeof t==`string`)return await i.parseText(t,n,r);if(i.parse)return await i.parse(t,n,r);throw hi(!i.parseSync),Error(`${e.id} loader - no parser found and worker is disabled`)}async function Mo(e,t,n,r){let i,a;!Array.isArray(t)&&!Ga(t)?(i=[],a=t,r=void 0):(i=t,a=n);let o=Do(a),s=e;return typeof e==`string`&&(s=await o(e)),oi(e)&&(s=await o(e)),typeof e==`string`&&(Fa(a||{}).core?.baseUrl||(a={...a,core:{...a?.core,baseUrl:e}})),await Ao(s,i,a)}var No=`4.5.2`,Po=globalThis.loaders?.parseImageNode,Fo=typeof Image<`u`,Io=typeof ImageBitmap<`u`,Lo=Kr?!0:!!Po;function Ro(e){switch(e){case`auto`:return Io||Fo||Lo;case`imagebitmap`:return Io;case`image`:return Fo;case`data`:return Lo;default:throw Error(`@loaders.gl/images: image ${e} not supported in this environment`)}}function zo(){if(Io)return`imagebitmap`;if(Fo)return`image`;if(Lo)return`data`;throw Error(`Install '@loaders.gl/polyfills' to parse images under Node.js`)}function Bo(e){let t=Ho(e);if(!t)throw Error(`Not an image`);return t}function Vo(e){switch(Bo(e)){case`data`:return e;case`image`:case`imagebitmap`:let t=document.createElement(`canvas`),n=t.getContext(`2d`);if(!n)throw Error(`getImageData`);return t.width=e.width,t.height=e.height,n.drawImage(e,0,0),n.getImageData(0,0,e.width,e.height);default:throw Error(`getImageData`)}}function Ho(e){return typeof ImageBitmap<`u`&&e instanceof ImageBitmap?`imagebitmap`:typeof Image<`u`&&e instanceof Image?`image`:e&&typeof e==`object`&&e.data&&e.width&&e.height?`data`:null}var Uo=/^data:image\/svg\+xml/,Wo=/\.svg((\?|#).*)?$/;function Go(e){return e&&(Uo.test(e)||Wo.test(e))}function Ko(e,t){if(Go(t)){let t=new TextDecoder().decode(e);try{typeof unescape==`function`&&typeof encodeURIComponent==`function`&&(t=unescape(encodeURIComponent(t)))}catch(e){throw Error(e.message)}return`data:image/svg+xml;base64,${btoa(t)}`}return qo(e,t)}function qo(e,t){if(Go(t))throw Error(`SVG cannot be parsed directly to imagebitmap`);return new Blob([new Uint8Array(e)])}async function Jo(e,t,n){let r=Ko(e,n),i=self.URL||self.webkitURL,a=typeof r!=`string`&&i.createObjectURL(r);try{return await Yo(a||r,t)}finally{a&&i.revokeObjectURL(a)}}async function Yo(e,t){let n=new Image;return n.src=e,t.image&&t.image.decode&&n.decode?(await n.decode(),n):await new Promise((e,t)=>{try{n.onload=()=>e(n),n.onerror=e=>{let n=e instanceof Error?e.message:`error`;t(Error(n))}}catch(e){t(e)}})}var Xo=!0;async function Zo(e,t,n){let r;r=Go(n)?await Jo(e,t,n):qo(e,n);let i=t&&t.imagebitmap;return await Qo(r,i)}async function Qo(e,t=null){if(($o(t)||!Xo)&&(t=null),t)try{return await createImageBitmap(e,t)}catch(e){console.warn(e),Xo=!1}return await createImageBitmap(e)}function $o(e){if(!e)return!0;for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function es(e){return!is(e,`ftyp`,4)||!(e[8]&96)?null:ts(e)}function ts(e){switch(ns(e,8,12).replace(`\0`,` `).trim()){case`avif`:case`avis`:return{extension:`avif`,mimeType:`image/avif`};default:return null}}function ns(e,t,n){return String.fromCharCode(...e.slice(t,n))}function rs(e){return[...e].map(e=>e.charCodeAt(0))}function is(e,t,n=0){let r=rs(t);for(let t=0;t<r.length;++t)if(r[t]!==e[t+n])return!1;return!0}var as=!1,os=!0;function ss(e){let t=ms(e);return ls(t)||fs(t)||us(t)||ds(t)||cs(t)}function cs(e){let t=es(new Uint8Array(e instanceof DataView?e.buffer:e));return t?{mimeType:t.mimeType,width:0,height:0}:null}function ls(e){let t=ms(e);return t.byteLength>=24&&t.getUint32(0,as)===2303741511?{mimeType:`image/png`,width:t.getUint32(16,as),height:t.getUint32(20,as)}:null}function us(e){let t=ms(e);return t.byteLength>=10&&t.getUint32(0,as)===1195984440?{mimeType:`image/gif`,width:t.getUint16(6,os),height:t.getUint16(8,os)}:null}function ds(e){let t=ms(e);return t.byteLength>=14&&t.getUint16(0,as)===16973&&t.getUint32(2,os)===t.byteLength?{mimeType:`image/bmp`,width:t.getUint32(18,os),height:t.getUint32(22,os)}:null}function fs(e){let t=ms(e);if(!(t.byteLength>=3&&t.getUint16(0,as)===65496&&t.getUint8(2)===255))return null;let{tableMarkers:n,sofMarkers:r}=ps(),i=2;for(;i+9<t.byteLength;){let e=t.getUint16(i,as);if(r.has(e))return{mimeType:`image/jpeg`,height:t.getUint16(i+5,as),width:t.getUint16(i+7,as)};if(!n.has(e))return null;i+=2,i+=t.getUint16(i,as)}return null}function ps(){let e=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)e.add(t);return{tableMarkers:e,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}function ms(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw Error(`toDataView`)}async function hs(e,t){let{mimeType:n}=ss(e)||{},r=globalThis.loaders?.parseImageNode;return Wr(r),await r(e,n)}async function gs(e,t,n){t||={};let r=(t.image||{}).type||`auto`,{url:i}=n||{},a=_s(r),o;switch(a){case`imagebitmap`:o=await Zo(e,t,i);break;case`image`:o=await Jo(e,t,i);break;case`data`:o=await hs(e,t);break;default:Wr(!1)}return r===`data`&&(o=Vo(o)),o}function _s(e){switch(e){case`auto`:case`data`:return zo();default:return Ro(e),e}}var vs={dataType:null,batchType:null,id:`image`,module:`images`,name:`Images`,version:No,mimeTypes:[`image/png`,`image/jpeg`,`image/gif`,`image/webp`,`image/avif`,`image/bmp`,`image/vnd.microsoft.icon`,`image/svg+xml`],extensions:[`png`,`jpg`,`jpeg`,`gif`,`webp`,`bmp`,`ico`,`svg`,`avif`],parse:gs,tests:[e=>!!ss(new DataView(e))],options:{image:{type:`auto`,decode:!0}}},j=new Qe({id:`deck`}),ys={};function bs(e){ys=e}function M(e,t,n,r){j.level>0&&ys[e]&&ys[e].call(null,t,n,r)}function xs(e){let t=e[0],n=e[e.length-1];return t===`{`&&n===`}`||t===`[`&&n===`]`}var Ss={dataType:null,batchType:null,id:`JSON`,name:`JSON`,module:``,version:``,options:{},extensions:[`json`,`geojson`],mimeTypes:[`application/json`,`application/geo+json`],testText:xs,parseTextSync:JSON.parse};function Cs(){let e=`9.4.0`,t=globalThis.deck&&globalThis.deck.VERSION;if(t&&t!==e)throw Error(`deck.gl - multiple versions detected: ${t} vs ${e}`);return t||(j.log(1,`deck.gl ${e}`)(),globalThis.deck={...globalThis.deck,VERSION:e,version:e,log:j,_registerLoggers:bs},Ja([Ss,[vs,{imagebitmap:{premultiplyAlpha:`none`}}]])),e}var ws=Cs(),Ts=`struct LayerUniforms {
  opacity: f32,
};

@group(0) @binding(auto)
var<uniform> layer: LayerUniforms;
`,Es=`layout(std140) uniform layerUniforms {
  uniform float opacity;
} layer;
`,Ds={name:`layer`,source:Ts,vs:Es,fs:Es,getUniforms:e=>({opacity:e.opacity**(1/2.2)}),uniformTypes:{opacity:`f32`}},Os={name:`color`,dependencies:[],source:`

@must_use
fn deckgl_premultiplied_alpha(fragColor: vec4<f32>) -> vec4<f32> {
    return vec4(fragColor.rgb * fragColor.a, fragColor.a); 
};
`,getUniforms:e=>({})},ks=`const SMOOTH_EDGE_RADIUS: f32 = 0.5;

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
`,As=`#define SMOOTH_EDGE_RADIUS 0.5`,js={name:`geometry`,source:ks,vs:`\
${As}

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
${As}

struct FragmentGeometry {
  vec2 uv;
};
FragmentGeometry geometry;

float smoothedge(float edge, float x) {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`},N;(function(e){e[e.Start=1]=`Start`,e[e.Move=2]=`Move`,e[e.End=4]=`End`,e[e.Cancel=8]=`Cancel`})(N||={});var P;(function(e){e[e.None=0]=`None`,e[e.Left=1]=`Left`,e[e.Right=2]=`Right`,e[e.Up=4]=`Up`,e[e.Down=8]=`Down`,e[e.Horizontal=3]=`Horizontal`,e[e.Vertical=12]=`Vertical`,e[e.All=15]=`All`})(P||={});var F;(function(e){e[e.Possible=1]=`Possible`,e[e.Began=2]=`Began`,e[e.Changed=4]=`Changed`,e[e.Ended=8]=`Ended`,e[e.Recognized=8]=`Recognized`,e[e.Cancelled=16]=`Cancelled`,e[e.Failed=32]=`Failed`})(F||={});var Ms=`auto`,Ns=`manipulation`,Ps=`none`,Fs=`pan-x`,Is=`pan-y`;function Ls(e){if(e.includes(`none`))return Ps;let t=e.includes(Fs),n=e.includes(Is);return t&&n?Ps:t||n?t?Fs:Is:e.includes(`manipulation`)?Ns:Ms}var Rs=class{constructor(e,t){this.actions=``,this.manager=e,this.set(t)}set(e){e===`compute`&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));return Ls(e.join(` `))}};function zs(e){return e.trim().split(/\s+/g)}function Bs(e,t,n){if(e)for(let r of zs(t))e.addEventListener(r,n,!1)}function Vs(e,t,n){if(e)for(let r of zs(t))e.removeEventListener(r,n,!1)}function Hs(e){return(e.ownerDocument||e).defaultView}function Us(e,t){let n=e;for(;n;){if(n===t)return!0;n=n.parentNode}return!1}function Ws(e){let t=e.length;if(t===1)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let n=0,r=0,i=0;for(;i<t;)n+=e[i].clientX,r+=e[i].clientY,i++;return{x:Math.round(n/t),y:Math.round(r/t)}}function Gs(e){let t=[],n=0;for(;n<e.pointers.length;)t[n]={clientX:Math.round(e.pointers[n].clientX),clientY:Math.round(e.pointers[n].clientY)},n++;return{timeStamp:Date.now(),pointers:t,center:Ws(t),deltaX:e.deltaX,deltaY:e.deltaY}}function Ks(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.sqrt(n*n+r*r)}function qs(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.sqrt(n*n+r*r)}function Js(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.atan2(r,n)*180/Math.PI}function Ys(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.atan2(r,n)*180/Math.PI}function Xs(e,t){return e===t?P.None:Math.abs(e)>=Math.abs(t)?e<0?P.Left:P.Right:t<0?P.Up:P.Down}function Zs(e,t){let n=t.center,r=e.offsetDelta,i=e.prevDelta,a=e.prevInput;return(t.eventType===N.Start||a?.eventType===N.End)&&(i=e.prevDelta={x:a?.deltaX||0,y:a?.deltaY||0},r=e.offsetDelta={x:n.x,y:n.y}),{deltaX:i.x+(n.x-r.x),deltaY:i.y+(n.y-r.y)}}function Qs(e,t,n){return{x:t/e||0,y:n/e||0}}function $s(e,t){return qs(t[0],t[1])/qs(e[0],e[1])}function ec(e,t){return Ys(t[1],t[0])-Ys(e[1],e[0])}function tc(e,t){let n=e.lastInterval||t,r=t.timeStamp-n.timeStamp,i,a,o,s;if(t.eventType!==N.Cancel&&(r>25||n.velocity===void 0)){let c=t.deltaX-n.deltaX,l=t.deltaY-n.deltaY,u=Qs(r,c,l);a=u.x,o=u.y,i=Math.abs(u.x)>Math.abs(u.y)?u.x:u.y,s=Xs(c,l),e.lastInterval=t}else i=n.velocity,a=n.velocityX,o=n.velocityY,s=n.direction;t.velocity=i,t.velocityX=a,t.velocityY=o,t.direction=s}function nc(e,t){return`pointerId`in e?e.pointerId:t}function rc(e,t){e.movementOrigin=new Map(t.map((e,t)=>[nc(e,t),{clientX:e.clientX,clientY:e.clientY}])),e.firstMovementTime=void 0}function ic(e,t){let n=t.pointers.map(nc);if(e.movementOrigin?.size===n.length&&n.every(t=>e.movementOrigin.has(t))||rc(e,t.pointers),t.distancePerPointer=t.pointers.map((t,r)=>qs(e.movementOrigin.get(n[r]),t)),t.eventType&N.Move&&t.distancePerPointer.some(e=>e>0)&&(e.firstMovementTime??=t.timeStamp),t.movementDeltaTime=e.firstMovementTime===void 0?0:t.timeStamp-e.firstMovementTime,t.eventType&(N.End|N.Cancel)){let r=t.changedPointers.map(e=>nc(e,t.pointers.indexOf(e)));rc(e,t.pointers.filter((e,t)=>!r.includes(n[t])))}}function ac(e,t){let{session:n}=e,{pointers:r}=t,{length:i}=r;n.firstInput||=Gs(t),i>1&&!n.firstMultiple?n.firstMultiple=Gs(t):i===1&&(n.firstMultiple=!1);let{firstInput:a,firstMultiple:o}=n,s=o?o.center:a.center,c=t.center=Ws(r);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-a.timeStamp,ic(n,t),t.angle=Js(s,c),t.distance=Ks(s,c);let{deltaX:l,deltaY:u}=Zs(n,t);t.deltaX=l,t.deltaY=u,t.offsetDirection=Xs(t.deltaX,t.deltaY);let d=Qs(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=d.x,t.overallVelocityY=d.y,t.overallVelocity=Math.abs(d.x)>Math.abs(d.y)?d.x:d.y,t.scale=o?$s(o.pointers,r):1,t.rotation=o?ec(o.pointers,r):0,t.maxPointers=n.prevInput?t.pointers.length>n.prevInput.maxPointers?t.pointers.length:n.prevInput.maxPointers:t.pointers.length;let f=e.element;return Us(t.srcEvent.target,f)&&(f=t.srcEvent.target),t.target=f,tc(n,t),t}function oc(e,t,n){let r=n.pointers.length,i=n.changedPointers.length,a=t&N.Start&&r-i===0,o=t&(N.End|N.Cancel)&&r-i===0;n.isFirst=!!a,n.isFinal=!!o,a&&(e.session={}),n.eventType=t;let s=ac(e,n);e.emit(`hammer.input`,s),e.recognize(s),e.session.prevInput=s}var sc=class{constructor(e){this.evEl=``,this.evWin=``,this.evTarget=``,this.domHandler=e=>{this.manager.options.enable&&this.handler(e)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){oc(this.manager,e,t)}init(){Bs(this.element,this.evEl,this.domHandler),Bs(this.target,this.evTarget,this.domHandler),Bs(Hs(this.element),this.evWin,this.domHandler)}destroy(){Vs(this.element,this.evEl,this.domHandler),Vs(this.target,this.evTarget,this.domHandler),Vs(Hs(this.element),this.evWin,this.domHandler)}},cc={pointerdown:N.Start,pointermove:N.Move,pointerup:N.End,pointercancel:N.Cancel,pointerout:N.Cancel},lc=`pointerdown`,uc=`pointermove pointerup pointercancel`,dc=class extends sc{constructor(e){super(e),this.evEl=lc,this.evWin=uc,this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,n=!1,r=cc[e.type],i=e.pointerType,a=i===`touch`,o=t.findIndex(t=>t.pointerId===e.pointerId);r&N.Start&&(e.buttons||a)?o<0&&(t.push(e),o=t.length-1):r&(N.End|N.Cancel)&&(n=!0),!(o<0)&&(t[o]=e,this.callback(r,{pointers:t,changedPointers:[e],eventType:r,pointerType:i,srcEvent:e}),n&&t.splice(o,1))}},fc=[``,`webkit`,`Moz`,`MS`,`ms`,`o`];function pc(e,t){let n=t[0].toUpperCase()+t.slice(1);for(let r of fc){let i=r?r+n:t;if(i in e)return i}}var mc=1,hc=2,gc={touchAction:`compute`,enable:!0,inputTarget:null,cssProps:{userSelect:`none`,userDrag:`none`,touchCallout:`none`,tapHighlightColor:`rgba(0,0,0,0)`}},_c=class{constructor(e,t){this.options={...gc,...t,cssProps:{...gc.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new dc(this),this.touchAction=new Rs(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?hc:mc}recognize(e){let{session:t}=this;if(t.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let n,{recognizers:r}=this,{curRecognizer:i}=t;(!i||i&&i.state&F.Recognized)&&(i=t.curRecognizer=null);let a=0;for(;a<r.length;)n=r[a],t.stopped!==hc&&(!i||n===i||n.canRecognizeWith(i))?n.recognize(e):n.reset(),!i&&n.state&(F.Began|F.Changed|F.Ended)&&(i=t.curRecognizer=n),a++}get(e){let{recognizers:t}=this;for(let n=0;n<t.length;n++)if(t[n].options.event===e)return t[n];return null}add(e){if(Array.isArray(e)){for(let t of e)this.add(t);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let t of e)this.remove(t);return this}let t=typeof e==`string`?this.get(e):e;if(t){let{recognizers:e}=this,n=e.indexOf(t);n!==-1&&(e.splice(n,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:n}=this;for(let r of zs(e))n[r]=n[r]||[],n[r].push(t)}off(e,t){if(!e)return;let{handlers:n}=this;for(let r of zs(e))t?n[r]&&n[r].splice(n[r].indexOf(t),1):delete n[r]}emit(e,t){let n=this.handlers[e]&&this.handlers[e].slice();if(!n||!n.length)return;let r=t;r.type=e,r.preventDefault=function(){t.srcEvent.preventDefault()};let i=0;for(;i<n.length;)n[i](r),i++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[n,r]of Object.entries(this.options.cssProps)){let i=pc(t.style,n);e?(this.oldCssProps[i]=t.style[i],t.style[i]=r):t.style[i]=this.oldCssProps[i]||``}e||(this.oldCssProps={})}}},vc=1;function yc(){return vc++}function bc(e){return e&F.Cancelled?`cancel`:e&F.Ended?`end`:e&F.Changed?`move`:e&F.Began?`start`:``}var xc=class{constructor(e){this.options=e,this.id=yc(),this.state=F.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){if(Array.isArray(e)){for(let t of e)this.recognizeWith(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:n}=this;return n[t.id]||(n[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){if(Array.isArray(e)){for(let t of e)this.dropRecognizeWith(t);return this}let t;return t=typeof e==`string`?this.manager.get(e):e,t&&delete this.simultaneous[t.id],this}requireFailure(e){if(Array.isArray(e)){for(let t of e)this.requireFailure(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:n}=this;return n.indexOf(t)===-1&&(n.push(t),t.requireFailure(this)),this}dropRequireFailure(e){if(Array.isArray(e)){for(let t of e)this.dropRequireFailure(t);return this}let t;if(t=typeof e==`string`?this.manager.get(e):e,t){let e=this.requireFail.indexOf(t);e>-1&&this.requireFail.splice(e,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<F.Ended&&this.manager.emit(this.options.event+bc(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=F.Ended&&this.manager.emit(this.options.event+bc(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=F.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&(F.Failed|F.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=F.Failed;return}this.state&(F.Recognized|F.Cancelled|F.Failed)&&(this.state=F.Possible),this.state=this.process(t),this.state&(F.Began|F.Changed|F.Ended|F.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}};function Sc(e){return Math.abs(((e+180)%360+360)%360-180)}function Cc(e,t){return(t.distance===void 0||e.distance>=t.distance)&&(t.distancePerPointer===void 0||e.distancePerPointer.length>0&&e.distancePerPointer.every(e=>e>=t.distancePerPointer))&&(t.movementDeltaTime===void 0||e.movementDeltaTime>=t.movementDeltaTime)&&(t.rotation===void 0||Sc(e.rotation)>=t.rotation)&&(t.scale===void 0||Math.abs(e.scale-1)>=t.scale)}var wc=class extends xc{attrTest(e){let t=this.options.pointers;return t===0||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(t=>Cc(e,t))}process(e){let{state:t}=this,{eventType:n}=e,r=t&(F.Began|F.Changed),i=this.attrTest(e);return r&&(n&N.Cancel||!i)?t|F.Cancelled:r||i?n&N.End?t|F.Ended:t&F.Began?t|F.Changed:F.Began:F.Failed}},Tc=[``,`start`,`move`,`end`,`cancel`],Ec=class extends xc{constructor(e={}){super({enable:!0,event:`doubleclickdrag`,pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[Ns]}getEventNames(){return Tc.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length===t.pointers?e.eventType&N.Start?this._handleStart(e):e.eventType&N.Move?this._handleMove(e):e.eventType&N.Cancel?this._handleEnd(e,!0):e.eventType&N.End?this._handleEnd(e,!1):F.Failed:(this.reset(),F.Failed)}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===F.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===F.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===F.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===F.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,F.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,F.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return F.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?F.Began:(this._drag.active=!0,e.scale=2**(t/this.options.pixelsPerScale),this._emittedStart?F.Changed:F.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:n,startCenter:r}=this._drag;return this._drag=null,this._tapStart=null,this._lastTap=null,n?(e.scale=2**((r.y-e.center.y)/this.options.pixelsPerScale),t?F.Cancelled:F.Ended):(this._emittedStart=!1,F.Failed)}return!this._tapStart||!this._isSamePointer(e,this._tapStart.pointerId)?(t&&this.reset(),F.Failed):(this._isValidTap(e)?this._lastTap={center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null,F.Failed)}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&Ks(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return`pointerId`in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return t===null||this._getPointerId(e)===t}},Dc=class extends xc{constructor(e={}){super({enable:!0,event:`tap`,pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[Ns]}process(e){let{options:t}=this,n=e.pointers.length===t.pointers,r=e.distance<t.threshold,i=e.deltaTime<t.time;if(this.reset(),e.eventType&N.Start&&this.count===0)return this.failTimeout();if(r&&i&&n){if(e.eventType!==N.End)return this.failTimeout();let n=this.pTime?e.timeStamp-this.pTime<t.interval:!0,r=!this.pCenter||Ks(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,!r||!n?this.count=1:this.count+=1,this._input=e,this.count%t.taps===0)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=F.Recognized,this.tryEmit(this._input)},t.interval),F.Began):F.Recognized}return F.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=F.Failed},this.options.interval),F.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===F.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}},Oc=class extends wc{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{e.device===`trackpad`&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...n}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(n),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:n}=e,r=t.deltaX??e.deltaX,i=t.deltaY??e.deltaY,a=Xs(r,i),o=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY),s=n;return{pointers:[s,s],changedPointers:[s,s],pointerType:`trackpad`,srcEvent:s,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:r,deltaY:i,angle:Math.atan2(i,r)*180/Math.PI,distance:Math.sqrt(r*r+i*i),distancePerPointer:[o,o],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:a,offsetDirection:a,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:n.target||this.manager.element,additionalEvent:``,...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&this.options.pointers===2);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}},kc=[``,`start`,`move`,`end`,`cancel`,`up`,`down`,`left`,`right`],Ac=class extends Oc{constructor(e={}){super({enable:!0,pointers:1,event:`pan`,threshold:10,direction:P.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&P.Horizontal&&t.push(Is),e&P.Vertical&&t.push(Fs),t}getEventNames(){return kc.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,n=!0,{distance:r}=e,{direction:i}=e,a=e.deltaX,o=e.deltaY;return i&t.direction||(t.direction&P.Horizontal?(i=a===0?P.None:a<0?P.Left:P.Right,n=a!==this.pX,r=Math.abs(e.deltaX)):(i=o===0?P.None:o<0?P.Up:P.Down,n=o!==this.pY,r=Math.abs(e.deltaY))),e.direction=i,n&&r>t.threshold&&!!(i&t.direction)}attrTest(e){let t=!!(this.state&F.Began),n=!(this.options.coherent?.length&&e.eventType&(N.End|N.Cancel));return super.attrTest(e)&&(t||n&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=P[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(F.Recognized|F.Cancelled|F.Failed)&&(this.state=F.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}},jc=[``,`start`,`move`,`end`,`cancel`,`in`,`out`],Mc=class extends Oc{constructor(e={}){super({enable:!0,event:`pinch`,threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return[Ps]}getEventNames(){return jc.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,n=!!(this.state&F.Began),r=!(t&&e.eventType&(N.End|N.Cancel));return super.attrTest(e)&&(n||r&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(e.scale!==1){let t=e.scale<1?`in`:`out`;e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(F.Recognized|F.Cancelled|F.Failed)&&(this.state=F.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}},Nc=class{constructor(e,t,n){this.element=e,this.callback=t,this.options=n}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}},Pc=(typeof navigator<`u`&&navigator.userAgent?navigator.userAgent.toLowerCase():``).indexOf(`firefox`)!==-1,Fc=40,Ic=.25,Lc=class extends Nc{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{if(!this.options.enable)return;let t=e.deltaY;globalThis.WheelEvent&&(Pc&&e.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(t/=globalThis.devicePixelRatio),e.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(t*=Fc)),e.shiftKey&&t&&(t*=Ic),this.callback({type:`wheel`,center:{x:e.clientX,y:e.clientY},delta:-t,device:this.options.wheelSession?.device??`unknown`,srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen(`wheel`,!0))}destroy(){this.listen(`wheel`,!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){e===`wheel`&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen(`wheel`,t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}},Rc=4.000244140625,zc=40,Bc=0,Vc=1,Hc=40,Uc=40,Wc=120,Gc={classificationDelay:32,endDelay:80},Kc=class{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=e=>{if(!this.hasSubscribers)return`unknown`;let t=Jc(e,this.pressedControlKeys.size>0),n=this.session;if(n&&t.timeStamp-n.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return`unknown`;n=null}n?(this.scheduleEnd(),this.addSample(n,t)):(n=this.startPendingSession(t),this.scheduleEnd());let{device:r}=n;return r===`unknown`&&(r=Yc(n.samples,!1),r!==`unknown`&&this.begin(n,r)),r},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||this.session.device!==`unknown`)return;let e=this.session,t=Yc(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)},this.end=()=>{if(!this.session)return;if(this.session.device===`unknown`){let e=this.session,t=Yc(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)}if(!this.session)return;let e=this.session;this.emit(N.End,e.lastEvent),this.reset()},this.handleKeyDown=e=>{e.key===`Control`&&this.pressedControlKeys.add(e.code||e.key)},this.handleKeyUp=e=>{e.key===`Control`&&(e.code?this.pressedControlKeys.delete(e.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...Gc,...t},this.element?.addEventListener(`wheel`,this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??`unknown`}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&e.device!==`unknown`&&this.emit(N.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener(`wheel`,this.handleEvent)}startPendingSession(e){let t={samples:[e],device:`unknown`,firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,e.device!==`unknown`){let n=e.samples[e.samples.length-2],r=t.timeStamp-n.timeStamp;e.velocityX=r>0?t.deltaX/r:0,e.velocityY=r>0?t.deltaY/r:0,this.emit(N.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(N.Start,e.samples[0].event);let n=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=n>0?e.totalDeltaX/n:0,e.velocityY=n>0?e.totalDeltaY/n:0,this.emit(N.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,n){let r=this.session;if(!r||r.device===`unknown`)return;let i=e===N.Start,a=e===N.End||e===N.Cancel,o=i?r.firstTimeStamp:r.lastTimeStamp,s=i?0:Math.max(0,o-r.firstTimeStamp),c=i?0:r.totalDeltaX,l=i?0:r.totalDeltaY,u=s>0?c/s:0,d=s>0?l/s:0,f=i?0:n?.velocityX??r.velocityX,p=i?0:n?.velocityY??r.velocityY,m={eventType:e,device:r.device,srcEvent:t,timeStamp:o,center:{x:t.clientX,y:t.clientY},deltaX:c,deltaY:l,deltaTime:s,velocity:Math.abs(f)>Math.abs(p)?f:p,velocityX:f,velocityY:p,overallVelocity:Math.abs(u)>Math.abs(d)?u:d,overallVelocityX:u,overallVelocityY:d,isFirst:i,isFinal:a};for(let{listener:e}of[...this.subscriptions.values()])e(m)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){this.classificationTimer!==null&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){this.endTimer!==null&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t=qc();!t||e===this.listeningForControlKeys||(this.listeningForControlKeys=e,e?(t.addEventListener(`keydown`,this.handleKeyDown,!0),t.addEventListener(`keyup`,this.handleKeyUp,!0),t.addEventListener(`blur`,this.handleWindowBlur)):(t.removeEventListener(`keydown`,this.handleKeyDown,!0),t.removeEventListener(`keyup`,this.handleKeyUp,!0),t.removeEventListener(`blur`,this.handleWindowBlur),this.pressedControlKeys.clear()))}};function qc(){return typeof window<`u`?window:globalThis.document?.defaultView}function Jc(e,t){let n=e.deltaX,r=e.deltaY;return e.deltaMode===Vc&&(n*=zc,r*=zc),{event:e,timeStamp:e.timeStamp,deltaX:n,deltaY:r,isControlKeyDown:t}}function Yc(e,t){return e.some(({event:e,isControlKeyDown:t})=>e.ctrlKey&&!t)?`trackpad`:e.some(({event:e})=>e.deltaMode!==Bc)||e.some(Xc)||e.every(({event:e})=>{let t=e.wheelDelta;return t!==void 0&&Math.abs(t)%40==0})?`mouse`:e.some(({deltaX:e})=>e!==0)||e.length>1&&Zc(e)?`trackpad`:t?`mouse`:`unknown`}function Xc({event:e,deltaX:t,deltaY:n}){if(t!==0||n===0)return!1;let r=Math.abs(n/Rc);if(Number.isInteger(r))return!0;let i=e.wheelDelta;return typeof i==`number`&&i!==0&&i%Wc===0}function Zc(e){for(let t=0;t<e.length;t++){let n=e[t];if(Math.abs(n.deltaX)>Uc||Math.abs(n.deltaY)>Uc||t>0&&n.timeStamp-e[t-1].timeStamp>Hc)return!1}return!0}var Qc=[`mousedown`,`mousemove`,`mouseup`,`mouseover`,`mouseout`,`mouseenter`,`mouseleave`],$c=class extends Nc{constructor(e,t,n){super(e,t,{enable:!0,...n}),this.handleEvent=e=>{this.handleOverEvent(e),this.handleOutEvent(e),this.handleEnterEvent(e),this.handleLeaveEvent(e),this.handleMoveEvent(e)},this.pressed=!1;let{enable:r=!1}=this.options;this.enableMoveEvent=r,this.enableLeaveEvent=r,this.enableEnterEvent=r,this.enableOutEvent=r,this.enableOverEvent=r,r&&Qc.forEach(e=>this.listen(e,!0))}destroy(){Qc.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case`pointermove`:this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen(`mousedown`,t),this.listen(`mousemove`,t),this.listen(`mouseup`,t));break;case`pointerover`:this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen(`mouseover`,t));break;case`pointerout`:this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen(`mouseout`,t));break;case`pointerenter`:this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen(`mouseenter`,t));break;case`pointerleave`:this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen(`mouseleave`,t));break;default:}}handleOverEvent(e){this.enableOverEvent&&e.type===`mouseover`&&this._emit(`pointerover`,e)}handleOutEvent(e){this.enableOutEvent&&e.type===`mouseout`&&this._emit(`pointerout`,e)}handleEnterEvent(e){this.enableEnterEvent&&e.type===`mouseenter`&&this._emit(`pointerenter`,e)}handleLeaveEvent(e){this.enableLeaveEvent&&e.type===`mouseleave`&&this._emit(`pointerleave`,e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case`mousedown`:e.button>=0&&(this.pressed=!0);break;case`mousemove`:e.buttons===0&&(this.pressed=!1),this.pressed||this._emit(`pointermove`,e);break;case`mouseup`:this.pressed=!1;break;default:}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:`mouse`,target:t.target})}},el=[`keydown`,`keyup`],tl=class extends Nc{constructor(e,t,n){super(e,t,{enable:!0,tabIndex:0,...n}),this.handleEvent=e=>{let t=e.target||e.srcElement;t.tagName===`INPUT`&&t.type===`text`||t.tagName===`TEXTAREA`||(this.enableDownEvent&&e.type===`keydown`&&this.callback({type:`keydown`,srcEvent:e,key:e.key,target:e.target}),this.enableUpEvent&&e.type===`keyup`&&this.callback({type:`keyup`,srcEvent:e,key:e.key,target:e.target}))};let{enable:r=!1}=this.options;this.enableDownEvent=r,this.enableUpEvent=r,e.tabIndex=this.options.tabIndex,e.style.outline=`none`,r&&el.forEach(e=>this.listen(e,!0))}destroy(){el.forEach(e=>this.listen(e,!1))}enableEventType(e,t){e===`keydown`&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),e===`keyup`&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}},nl=class extends Nc{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{this.options.enable&&this.callback({type:`contextmenu`,center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&this.listen(`contextmenu`,!0)}destroy(){this.listen(`contextmenu`,!1)}enableEventType(e,t){e===`contextmenu`&&this.options.enable!==t&&(this.options.enable=t,this.listen(`contextmenu`,t))}},rl=1,il=2,al=4,ol={pointerdown:rl,pointermove:il,pointerup:al,mousedown:rl,mousemove:il,mouseup:al},sl=0,cl=1,ll=2,ul=1,dl=2,fl=4;function pl(e){let t=ol[e.srcEvent.type];if(!t)return null;let{buttons:n,button:r}=e.srcEvent,i=!1,a=!1,o=!1;return t===il?(i=!!(n&ul),a=!!(n&fl),o=!!(n&dl)):(i=r===sl,a=r===cl,o=r===ll),{leftButton:i,middleButton:a,rightButton:o}}function ml(e,t){let n=e.center;if(!n)return null;let r=t.getBoundingClientRect(),i=r.width/t.offsetWidth||1,a=r.height/t.offsetHeight||1;return{center:n,offsetCenter:{x:(n.x-r.left-t.clientLeft)/i,y:(n.y-r.top-t.clientTop)/a}}}var hl={srcElement:`root`,priority:0},gl=class{constructor(e,t){this.handleEvent=e=>{if(this.isEmpty())return;let t=this._normalizeEvent(e),n=e.srcEvent.target;for(;n&&n!==t.rootElement;){if(this._emit(t,n),t.handled)return;n=n.parentNode}this._emit(t,`root`)},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,n,r=!1,i=!1){let{handlers:a,handlersByElement:o}=this,s={...hl,...n},c=o.get(s.srcElement);c||(c=[],o.set(s.srcElement,c));let l={type:e,handler:t,srcElement:s.srcElement,priority:s.priority};r&&(l.once=!0),i&&(l.passive=!0),a.push(l),this._active=this._active||!l.passive;let u=c.length-1;for(;u>=0&&!(c[u].priority>=l.priority);)u--;c.splice(u+1,0,l)}remove(e,t){let{handlers:n,handlersByElement:r}=this;for(let i=n.length-1;i>=0;i--){let a=n[i];if(a.type===e&&a.handler===t){n.splice(i,1);let e=r.get(a.srcElement);e.splice(e.indexOf(a),1),e.length===0&&r.delete(a.srcElement)}}this._active=n.some(e=>!e.passive)}_emit(e,t){let n=this.handlersByElement.get(t);if(n){let t=!1,r=()=>{e.handled=!0},i=()=>{e.handled=!0,t=!0},a=[];for(let o=0;o<n.length;o++){let{type:s,handler:c,once:l}=n[o];if(c({...e,type:s,stopPropagation:r,stopImmediatePropagation:i}),l&&a.push(n[o]),t)break}for(let e=0;e<a.length;e++){let{type:t,handler:n}=a[e];this.remove(t,n)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...pl(e),...ml(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}};function _l(e){if(`recognizer`in e)return e;let t,n=Array.isArray(e)?[...e]:[e];return t=typeof n[0]==`function`?new(n.shift())(n.shift()||{}):n.shift(),{recognizer:t,recognizeWith:typeof n[0]==`string`?[n[0]]:n[0],requireFailure:typeof n[1]==`string`?[n[1]]:n[1]}}var vl=class{constructor(e=null,t={}){if(this._onBasicInput=e=>{this.manager.emit(e.srcEvent.type,e)},this._onOtherEvent=e=>{this.manager.emit(e.type,e)},this.options={recognizers:[],events:{},touchAction:`compute`,tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new Kc(e),e){this.manager=new _c(e,this.options);for(let e of this.options.recognizers){let{recognizer:t,recognizeWith:n,requireFailure:r}=_l(e);this.manager.add(t),n&&t.recognizeWith(n),r&&t.requireFailure(r)}this.manager.on(`hammer.input`,this._onBasicInput),this.wheelInput=new Lc(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new $c(e,this._onOtherEvent,{enable:!1}),this.keyInput=new tl(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new nl(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}}getElement(){return this.element}destroy(){if(!this.element){this.wheelSession.destroy();return}this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()}on(e,t,n){this._addEventHandler(e,t,n,!1)}once(e,t,n){this._addEventHandler(e,t,n,!0)}watch(e,t,n){this._addEventHandler(e,t,n,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:n}=this;if(!n)return;let r=n.get(e);r&&(r.set({enable:t,wheelSession:this.wheelSession}),n.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,n,r,i){if(typeof e!=`string`){n=t;for(let[t,a]of Object.entries(e))this._addEventHandler(t,a,n,r,i);return}let{manager:a,events:o}=this;if(!a)return;let s=o.get(e);if(!s){let t=this._getRecognizerName(e)||e;s=new gl(this,t),o.set(e,s),a&&a.on(e,s.handleEvent)}s.add(e,t,n,r,i),s.isEmpty()||this._toggleRecognizer(s.recognizerName,!0)}_removeEventHandler(e,t){if(typeof e!=`string`){for(let[t,n]of Object.entries(e))this._removeEventHandler(t,n);return}let{events:n}=this,r=n.get(e);if(r&&(r.remove(e,t),r.isEmpty())){let{recognizerName:e}=r,t=!1;for(let r of n.values())if(r.recognizerName===e&&!r.isEmpty()){t=!0;break}t||this._toggleRecognizer(e,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}},yl={DEFAULT:`default`,LNGLAT:`lnglat`,METER_OFFSETS:`meter-offsets`,LNGLAT_OFFSETS:`lnglat-offsets`,CARTESIAN:`cartesian`};Object.defineProperty(yl,`IDENTITY`,{get:()=>(j.deprecated(`COORDINATE_SYSTEM.IDENTITY`,`COORDINATE_SYSTEM.CARTESIAN`)(),yl.CARTESIAN)});var I={WEB_MERCATOR:1,GLOBE:2,WEB_MERCATOR_AUTO_OFFSET:4,IDENTITY:0},bl={common:0,meters:1,pixels:2},xl={click:`onClick`,dblclick:`onClick`,panstart:`onDragStart`,panmove:`onDrag`,panend:`onDragEnd`},Sl={multipan:[Ac,{threshold:10,pointers:2,trackpad:!0}],pinch:[Mc,{trackpad:!0},null,[`multipan`]],pan:[Ac,{threshold:1},[`pinch`],[`multipan`]],dblclick:[Dc,{event:`dblclick`,taps:2,enable:!1}],dblclickdrag:[Ec,{event:`dblclickdrag`,enable:!1},[`dblclick`],null],click:[Dc,{event:`click`},[`dblclickdrag`],[`dblclick`,`dblclickdrag`]]};function Cl(e,t){if(e===t)return!0;if(Array.isArray(e)){let n=e.length;if(!t||t.length!==n)return!1;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}return!1}function wl(e){let t={},n;return r=>{for(let i in r)if(!Cl(r[i],t[i])){n=e(r),t=r;break}return n}}var Tl=[0,0,0,0],El=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],Dl=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],Ol=[0,0,0],kl=[0,0,0],Al={default:-1,cartesian:0,lnglat:1,"meter-offsets":2,"lnglat-offsets":3};function jl(e){let t=Al[e];if(t===void 0)throw Error(`Invalid coordinateSystem: ${e}`);return t}var Ml=wl(Il);function Nl(e,t,n=kl){n.length<3&&(n=[n[0],n[1],0]);let r=n,i,a=!0;switch(i=t===`lnglat-offsets`||t===`meter-offsets`?n:e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null,e.projectionMode){case I.WEB_MERCATOR:(t===`lnglat`||t===`cartesian`)&&(i=[0,0,0],a=!1);break;case I.WEB_MERCATOR_AUTO_OFFSET:t===`lnglat`?r=i:t===`cartesian`&&(r=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],i=e.unprojectPosition(r),r[0]-=n[0],r[1]-=n[1],r[2]-=n[2]);break;case I.IDENTITY:r=e.position.map(Math.fround),r[2]=r[2]||0;break;case I.GLOBE:a=!1,i=null;break;default:a=!1}return{geospatialOrigin:i,shaderCoordinateOrigin:r,offsetMode:a}}function Pl(e,t,n){let{viewMatrixUncentered:r,projectionMatrix:i}=e,{viewMatrix:a,viewProjectionMatrix:o}=e,s=Tl,c=Tl,l=e.cameraPosition,{geospatialOrigin:u,shaderCoordinateOrigin:d,offsetMode:f}=Nl(e,t,n);return f&&(c=e.projectPosition(u||d),l=[l[0]-c[0],l[1]-c[1],l[2]-c[2]],c[3]=1,s=xe([],c,o),a=r||a,o=ve([],i,a),o=ve([],o,El)),{viewMatrix:a,viewProjectionMatrix:o,projectionCenter:s,originCommon:c,cameraPosCommon:l,shaderCoordinateOrigin:d,geospatialOrigin:u}}function Fl({viewport:e,devicePixelRatio:t=1,modelMatrix:n=null,coordinateSystem:r=`default`,coordinateOrigin:i=kl,autoWrapLongitude:a=!1}){r===`default`&&(r=e.isGeospatial?`lnglat`:`cartesian`);let o=Ml({viewport:e,devicePixelRatio:t,coordinateSystem:r,coordinateOrigin:i});return o.wrapLongitude=a,o.modelMatrix=n||Dl,o}function Il({viewport:e,devicePixelRatio:t,coordinateSystem:n,coordinateOrigin:r}){let{projectionCenter:i,viewProjectionMatrix:a,originCommon:o,cameraPosCommon:s,shaderCoordinateOrigin:c,geospatialOrigin:l}=Pl(e,n,r),u=e.getDistanceScales(),d=[e.width*t,e.height*t],f=xe([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,p={coordinateSystem:jl(n),projectionMode:e.projectionMode,coordinateOrigin:c,commonOrigin:o.slice(0,3),center:i,pseudoMeters:!!e._pseudoMeters,viewportSize:d,devicePixelRatio:t,focalDistance:f,commonUnitsPerMeter:u.unitsPerMeter,commonUnitsPerWorldUnit:u.unitsPerMeter,commonUnitsPerWorldUnit2:Ol,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:a,modelMatrix:Dl,cameraPosition:s};if(l){let t=e.getDistanceScales(l);switch(n){case`meter-offsets`:p.commonUnitsPerWorldUnit=t.unitsPerMeter,p.commonUnitsPerWorldUnit2=t.unitsPerMeter2;break;case`lnglat`:case`lnglat-offsets`:e._pseudoMeters||(p.commonUnitsPerMeter=t.unitsPerMeter),p.commonUnitsPerWorldUnit=t.unitsPerDegree,p.commonUnitsPerWorldUnit2=t.unitsPerDegree2;break;case`cartesian`:p.commonUnitsPerWorldUnit=[1,1,t.unitsPerMeter[2]],p.commonUnitsPerWorldUnit2=[0,0,t.unitsPerMeter2[2]];break;default:break}}if(e.projectionMode===I.GLOBE&&n===`meter-offsets`){let e=r[0]*Math.PI/180,t=r[1]*Math.PI/180,n=Math.cos(t),i=((r[2]||0)/6370972+1)*256;p.commonOrigin=[Math.sin(e)*n*i,-Math.cos(e)*n*i,Math.sin(t)*i]}return p}var Ll=`\
${`\
${[`default`,`lnglat`,`meter-offsets`,`lnglat-offsets`,`cartesian`].map(e=>`const COORDINATE_SYSTEM_${e.toUpperCase().replaceAll(`-`,`_`)}: i32 = ${jl(e)};`).join(``)}
${Object.keys(I).map(e=>`const PROJECTION_MODE_${e}: i32 = ${I[e]};`).join(``)}
${Object.keys(bl).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${bl[e]};`).join(``)}

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
`,Rl=`\
${[`default`,`lnglat`,`meter-offsets`,`lnglat-offsets`,`cartesian`].map(e=>`const int COORDINATE_SYSTEM_${e.toUpperCase().replaceAll(`-`,`_`)} = ${jl(e)};`).join(``)}
${Object.keys(I).map(e=>`const int PROJECTION_MODE_${e} = ${I[e]};`).join(``)}
${Object.keys(bl).map(e=>`const int UNIT_${e.toUpperCase()} = ${bl[e]};`).join(``)}
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
`,zl={};function Bl(e=zl){return`viewport`in e?Fl(e):{}}var Vl={name:`project`,dependencies:[ee,js],source:Ll,vs:Rl,getUniforms:Bl,uniformTypes:{wrapLongitude:`f32`,coordinateSystem:`i32`,commonUnitsPerMeter:`vec3<f32>`,projectionMode:`i32`,scale:`f32`,commonUnitsPerWorldUnit:`vec3<f32>`,commonUnitsPerWorldUnit2:`vec3<f32>`,center:`vec4<f32>`,modelMatrix:`mat4x4<f32>`,viewProjectionMatrix:`mat4x4<f32>`,viewportSize:`vec2<f32>`,devicePixelRatio:`f32`,focalDistance:`f32`,cameraPosition:`vec3<f32>`,coordinateOrigin:`vec3<f32>`,commonOrigin:`vec3<f32>`,pseudoMeters:`f32`}},Hl={name:`project32`,dependencies:[Vl],source:`// Define a structure to hold both the clip-space position and the common position.
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
`};function Ul(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function Wl(e,t){let n=xe([],t,e);return Re(n,n,1/n[3]),n}function Gl(e,t,n){return e<t?t:e>n?n:e}function Kl(e){return Math.log(e)*Math.LOG2E}var ql=Math.log2||Kl;function Jl(e,t){if(!e)throw Error(t||`@math.gl/web-mercator: assertion failed.`)}var Yl=Math.PI,Xl=Yl/4,Zl=Yl/180,Ql=180/Yl,$l=512,eu=4003e4,tu=85.051129,nu=1.5;function ru(e){return ql(e)}function iu(e){let[t,n]=e;Jl(Number.isFinite(t)),Jl(Number.isFinite(n)&&n>=-90&&n<=90,`invalid latitude`);let r=t*Zl,i=n*Zl;return[$l*(r+Yl)/(2*Yl),$l*(Yl+Math.log(Math.tan(Xl+i*.5)))/(2*Yl)]}function au(e){let[t,n]=e,r=t/$l*(2*Yl)-Yl,i=2*(Math.atan(Math.exp(n/$l*(2*Yl)-Yl))-Xl);return[r*Ql,i*Ql]}function ou(e){let{latitude:t}=e;return Jl(Number.isFinite(t)),ru(eu*Math.cos(t*Zl))-9}function su(e){let t=Math.cos(e*Zl);return $l/eu/t}function cu(e){let{latitude:t,longitude:n,highPrecision:r=!1}=e;Jl(Number.isFinite(t)&&Number.isFinite(n));let i=$l,a=Math.cos(t*Zl),o=i/360,s=o/a,c=i/eu/a,l={unitsPerMeter:[c,c,c],metersPerUnit:[1/c,1/c,1/c],unitsPerDegree:[o,s,c],degreesPerUnit:[1/o,1/s,1/c]};if(r){let e=Zl*Math.tan(t*Zl)/a,n=o*e/2,r=i/eu*e,u=r/s*c;l.unitsPerDegree2=[0,n,r],l.unitsPerMeter2=[u,0,u]}return l}function lu(e,t){let[n,r,i]=e,[a,o,s]=t,{unitsPerMeter:c,unitsPerMeter2:l}=cu({longitude:n,latitude:r,highPrecision:!0}),u=iu(e);u[0]+=a*(c[0]+l[0]*o),u[1]+=o*(c[1]+l[1]*o);let d=au(u),f=(i||0)+(s||0);return Number.isFinite(i)||Number.isFinite(s)?[d[0],d[1],f]:d}function uu(e){let{height:t,pitch:n,bearing:r,altitude:i,scale:a,center:o}=e,s=Ul();ge(s,s,[0,0,-i]),be(s,s,-n*Zl),Ce(s,s,r*Zl);let c=a/t;return Xe(s,s,[c,c,c]),o&&ge(s,s,ye([],o)),s}function du(e){let{width:t,height:n,altitude:r,pitch:i=0,offset:a,center:o,scale:s,nearZMultiplier:c=1,farZMultiplier:l=1}=e,{fovy:u=fu(nu)}=e;r!==void 0&&(u=fu(r));let d=u*Zl,f=i*Zl,p=pu(u),m=p;o&&(m+=o[2]*s/Math.cos(f)/n);let h=d*(.5+(a?a[1]:0)/n),g=Math.sin(h)*m/Math.sin(Gl(Math.PI/2-f-h,.01,Math.PI-.01)),_=Math.sin(f)*g+m,v=m*10,y=Math.min(_*l,v);return{fov:d,aspect:t/n,focalDistance:p,near:c,far:y}}function fu(e){return 2*Math.atan(.5/e)*Ql}function pu(e){return .5/Math.tan(.5*e*Zl)}function mu(e,t){let[n,r,i=0]=e;return Jl(Number.isFinite(n)&&Number.isFinite(r)&&Number.isFinite(i)),Wl(t,[n,r,i,1])}function hu(e,t,n=0){let[r,i,a]=e;if(Jl(Number.isFinite(r)&&Number.isFinite(i),`invalid pixel coordinate`),Number.isFinite(a))return Wl(t,[r,i,a,1]);let o=Wl(t,[r,i,0,1]),s=Wl(t,[r,i,1,1]),c=o[2],l=s[2];return Se([],o,s,c===l?0:((n||0)-c)/(l-c))}function gu(e){let{width:t,height:n,bounds:r,minExtent:i=0,maxZoom:a=24,offset:o=[0,0]}=e,[[s,c],[l,u]]=r,d=_u(e.padding),f=iu([s,Gl(u,-tu,tu)]),p=iu([l,Gl(c,-tu,tu)]),m=[Math.max(Math.abs(p[0]-f[0]),i),Math.max(Math.abs(p[1]-f[1]),i)],h=[t-d.left-d.right-Math.abs(o[0])*2,n-d.top-d.bottom-Math.abs(o[1])*2];Jl(h[0]>0&&h[1]>0);let g=h[0]/m[0],_=h[1]/m[1],v=(d.right-d.left)/2/g,y=(d.top-d.bottom)/2/_,b=au([(p[0]+f[0])/2+v,(p[1]+f[1])/2+y]),x=Math.min(a,ql(Math.abs(Math.min(g,_))));return Jl(Number.isFinite(x)),{longitude:b[0],latitude:b[1],zoom:x}}function _u(e=0){return typeof e==`number`?{top:e,bottom:e,left:e,right:e}:(Jl(Number.isFinite(e.top)&&Number.isFinite(e.bottom)&&Number.isFinite(e.left)&&Number.isFinite(e.right)),e)}var vu=Math.PI/180;function yu(e,t=0){let{width:n,height:r,unproject:i}=e,a={targetZ:t},o=i([0,r],a),s=i([n,r],a),c,l;return(e.fovy?.5*e.fovy*vu:Math.atan(.5/e.altitude))>(90-e.pitch)*vu-.01?(c=bu(e,0,t),l=bu(e,n,t)):(c=i([0,0],a),l=i([n,0],a)),[o,s,l,c]}function bu(e,t,n){let{pixelUnprojectionMatrix:r}=e,i=Wl(r,[t,0,1,1]),a=Wl(r,[t,e.height,1,1]),o=au(Se([],i,a,(n*e.distanceScales.unitsPerMeter[2]-i[2])/(a[2]-i[2])));return o.push(n),o}var xu=Math.PI;xu/180;var Su=180/xu,Cu=xu*6378137;Math.atan(Math.sinh(xu))*Su,512/(2*Cu);var wu=`
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
`,Tu=`
${wu}

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

`,Eu=`
${wu}

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

`,Du=wl(Mu),Ou=wl(Nu),ku=[0,0,0,1],Au=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0];function ju(e,t){let[n,r,i]=e,a=hu([n,r,i],t);return Number.isFinite(i)?a:[a[0],a[1],0]}function Mu({viewport:e,center:t}){return new k(e.viewProjectionMatrix).invert().transform(t)}function Nu({viewport:e,shadowMatrices:t}){let n=[],r=e.pixelUnprojectionMatrix,i=e.isGeospatial?void 0:1,a=[[0,0,i],[e.width,0,i],[0,e.height,i],[e.width,e.height,i],[0,0,-1],[e.width,0,-1],[0,e.height,-1],[e.width,e.height,-1]].map(e=>ju(e,r));for(let r of t){let t=r.clone().translate(new D(e.center).negate()),i=a.map(e=>t.transform(e)),o=new k().ortho({left:Math.min(...i.map(e=>e[0])),right:Math.max(...i.map(e=>e[0])),bottom:Math.min(...i.map(e=>e[1])),top:Math.max(...i.map(e=>e[1])),near:Math.min(...i.map(e=>-e[2])),far:Math.max(...i.map(e=>-e[2]))});n.push(o.multiplyRight(r))}return n}function Pu(e){let{shadowEnabled:t=!0,project:n}=e;if(!t||!n||!e.shadowMatrices||!e.shadowMatrices.length)return{drawShadowMap:!1,useShadowMap:!1,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};let r=Vl.getUniforms(n),i=Du({viewport:n.viewport,center:r.center}),a=[],o=Ou({shadowMatrices:e.shadowMatrices,viewport:n.viewport}).slice();for(let t=0;t<e.shadowMatrices.length;t++){let e=o[t],s=e.clone().translate(new D(n.viewport.center).negate());r.coordinateSystem===jl(`lnglat`)&&r.projectionMode===I.WEB_MERCATOR?(o[t]=s,a[t]=i):(o[t]=e.clone().multiplyRight(Au),a[t]=s.transform(i))}let s={drawShadowMap:!!e.drawToShadowMap,useShadowMap:e.shadowMaps?e.shadowMaps.length>0:!1,color:e.shadowColor||ku,lightId:e.shadowLightId||0,lightCount:e.shadowMatrices.length,shadow_uShadowMap0:e.dummyShadowMap,shadow_uShadowMap1:e.dummyShadowMap};for(let e=0;e<o.length;e++)s[`viewProjectionMatrix${e}`]=o[e],s[`projectCenter${e}`]=a[e];for(let t=0;t<2;t++)s[`shadow_uShadowMap${t}`]=e.shadowMaps&&e.shadowMaps[t]||e.dummyShadowMap;return s}var Fu={name:`shadow`,dependencies:[Vl],vs:Tu,fs:Eu,inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    position = shadow_setVertexPosition(geometry.position);
    `,"fs:DECKGL_FILTER_COLOR":`
    color = shadow_filterShadowColor(color);
    `},getUniforms:Pu,uniformTypes:{drawShadowMap:`f32`,useShadowMap:`f32`,color:`vec4<f32>`,lightId:`i32`,lightCount:`f32`,viewProjectionMatrix0:`mat4x4<f32>`,viewProjectionMatrix1:`mat4x4<f32>`,projectCenter0:`vec4<f32>`,projectCenter1:`vec4<f32>`}},Iu=16777215;function Lu(e,t){e.length===10?j.warn(`pickMultipleObjects can only exclude 10 previously picked objects for layers without picking buffers`)():e.push(t)}var Ru=`  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function zu(e){return e.replace(`  vec4 highlightColor;
} picking;`,`  vec4 highlightColor;\n${Ru}} picking;`)}function Bu(e,t){return[e[t]||0,e[t+1]||0,e[t+2]||0,e[t+3]||0]}var Vu=`\
vec3 picking_getPickingColorFromIndex(float objectIndex) {
  if (objectIndex < 0.0 || objectIndex >= ${Iu}.0) {
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
`,Hu=`\
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
  if (objectIndex >= ${Iu}u) {
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
`,Uu={...yn,vs:`${zu(yn.vs)}\n${Vu}`,fs:zu(yn.fs),source:Hu,uniformTypes:{...yn.uniformTypes,disabledPickingIndexCount:`f32`,disabledPickingIndices0:`vec4<f32>`,disabledPickingIndices1:`vec4<f32>`,disabledPickingIndices2:`vec4<f32>`},defaultUniforms:{...yn.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(e,t){let n=yn.getUniforms(e,t),r=e.disabledPickingIndices||[];return n.disabledPickingIndexCount=r.length,n.disabledPickingIndices0=Bu(r,0),n.disabledPickingIndices1=Bu(r,4),n.disabledPickingIndices2=Bu(r,8),n},inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `,"vs:DECKGL_FILTER_COLOR":`
  picking_setPickingColor(geometry.pickingColor);
  `,"fs:DECKGL_FILTER_COLOR":{order:99,injection:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}}},Wu=[js],Gu=[`vs:DECKGL_FILTER_SIZE(inout vec3 size, VertexGeometry geometry)`,`vs:DECKGL_FILTER_GL_POSITION(inout vec4 position, VertexGeometry geometry)`,`vs:DECKGL_FILTER_COLOR(inout vec4 color, VertexGeometry geometry)`,`fs:DECKGL_FILTER_COLOR(inout vec4 color, FragmentGeometry geometry)`],Ku=[];function qu(e){let t=C.getDefaultShaderAssembler(e);for(let e of Wu)t.addDefaultModule(e);t._hookFunctions.length=0;let n=e===`glsl`?Gu:Ku;for(let e of n)t.addShaderHook(e);return t}var Ju=[255,255,255],Yu=1,Xu=0,Zu=class{constructor(e={}){this.type=`ambient`;let{color:t=Ju}=e,{intensity:n=Yu}=e;this.id=e.id||`ambient-${Xu++}`,this.color=t,this.intensity=n}},Qu=[255,255,255],$u=1,ed=[0,0,-1],td=0,nd=class{constructor(e={}){this.type=`directional`;let{color:t=Qu}=e,{intensity:n=$u}=e,{direction:r=ed}=e,{_shadow:i=!1}=e;this.id=e.id||`directional-${td++}`,this.color=t,this.intensity=n,this.type=`directional`,this.direction=new D(r).normalize().toArray(),this.shadow=i}getProjectedLight(e){return this}},rd=class{constructor(e,t={id:`pass`}){let{id:n}=t;this.id=n,this.device=e,this.props={...t}}setProps(e){Object.assign(this.props,e)}render(e){}cleanup(){}},id={depthWriteEnabled:!0,depthCompare:`less-equal`,blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaOperation:`add`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`},ad=class extends rd{constructor(){super(...arguments),this._lastRenderIndex=-1}render(e){this._render(e)}_render(e){let{canvasContext:t=this.device.canvasContext}=e,n=e.target??t.getCurrentFramebuffer(),[r,i]=t.getDrawingBufferSize(),a=e.clearCanvas??!0,o=e.clearColor??(a?[0,0,0,0]:!1),s=a?1:!1,c=a?0:!1,l=e.colorMask??15,u={viewport:[0,0,r,i]};e.colorMask&&(u.colorMask=l),e.scissorRect&&(u.scissorRect=e.scissorRect);let{shaderModuleProps:d,viewports:f,views:p,onViewportActive:m,clearStack:h=!0}=e,g=e.pass||`unknown`,_=this.device.type===`webgpu`;h&&(this._lastRenderIndex=-1);let v=[];if(!f.length)return this.device.beginRenderPass({framebuffer:n,parameters:u,clearColor:o,clearDepth:s,clearStencil:c}).end(),this.device.submit(),v;try{for(let r of f){m?.(r);let i=this._getDrawLayerParams(r,e),a=p&&p[r.id],l=r.subViewports||[r],f=_?l.map(e=>[e]):[l];for(let r of f){let l=this.device.beginRenderPass({framebuffer:n,parameters:u,clearColor:o,clearDepth:s,clearStencil:c});try{for(let o of r){let r=this._drawLayersInViewport(l,{target:n,canvasContext:t,shaderModuleProps:d,viewport:o,view:a,pass:g,layers:e.layers,isPicking:e.isPicking},i);v.push(r)}}finally{l.end(),_&&this.device.submit()}o=!1,s=!1,c=!1}}return v}finally{_||this.device.submit()}}_getDrawLayerParams(e,{layers:t,pass:n,isPicking:r=!1,layerFilter:i,cullRect:a,views:o,effects:s,canvasContext:c=this.device.canvasContext,shaderModuleProps:l},u=!1){let d=[],f=od(this._lastRenderIndex+1),p={layer:t[0],viewport:e,isPicking:r,renderPass:n,cullRect:a},m={};for(let r=0;r<t.length;r++){let a=t[r],h=this._shouldDrawLayer(a,p,i,m),g={shouldDrawLayer:h};h&&!u&&(g.shouldDrawLayer=!0,g.layerRenderIndex=f(a,h),g.shaderModuleProps=this._getShaderModuleProps(a,s,n,c,l),g.layerParameters={...a.context.device.type===`webgpu`?id:null,...a.context.deck?.props.parameters,...o?.[e.id]?.props.parameters,...this.getLayerParameters(a,r,e)}),d[r]=g}return d}_drawLayersInViewport(e,{layers:t,shaderModuleProps:n,pass:r,target:i,canvasContext:a,viewport:o,view:s,isPicking:c},l){let u=sd(this.device,{canvasContext:a,shaderModuleProps:n,target:i,viewport:o});if(s){let{clear:e,clearColor:t,clearDepth:n,clearStencil:r}=s.props;if(e){let e=[0,0,0,0],a=1,o=0;Array.isArray(t)&&!c?e=[...t.slice(0,3),t[3]||255].map(e=>e/255):t===!1&&(e=!1),n!==void 0&&(a=n),r!==void 0&&(o=r),this.device.beginRenderPass({framebuffer:i,parameters:{viewport:u,scissorRect:u},clearColor:e,clearDepth:a,clearStencil:o}).end()}}let d={totalCount:t.length,visibleCount:0,compositeCount:0,pickableCount:0};e.setParameters({viewport:u});for(let n=0;n<t.length;n++){let i=t[n],a=l[n],{shouldDrawLayer:s}=a;if(s&&i.props.pickable&&d.pickableCount++,i.isComposite&&d.compositeCount++,i.isDrawable&&a.shouldDrawLayer){let{layerRenderIndex:t,shaderModuleProps:n,layerParameters:s}=a;d.visibleCount++,this._lastRenderIndex=Math.max(this._lastRenderIndex,t),n.project&&(n.project.viewport=o),i.context.renderPass=e;try{i._drawLayer({renderPass:e,shaderModuleProps:n,uniforms:{layerIndex:t},parameters:s})}catch(e){i.raiseError(e,`drawing ${i} to ${r}`)}}}return d}shouldDrawLayer(e){return!0}getShaderModuleProps(e,t,n){return null}getLayerParameters(e,t,n){return e.props.parameters}_shouldDrawLayer(e,t,n,r){if(!(e.props.visible&&this.shouldDrawLayer(e)))return!1;t.layer=e;let i=e.parent;for(;i;){if(!i.props.visible||!i.filterSubLayer(t))return!1;t.layer=i,i=i.parent}if(n){let e=t.layer.id;if(e in r||(r[e]=n(t)),!r[e])return!1}return e.activateViewport(t.viewport),!0}_getShaderModuleProps(e,t,n,r,i){let a=r.cssToDeviceRatio(),o=e.internalState?.propsInTransition||e.props,s={layer:o,picking:{isActive:!1},project:{viewport:e.context.viewport,devicePixelRatio:a,modelMatrix:o.modelMatrix,coordinateSystem:o.coordinateSystem,coordinateOrigin:o.coordinateOrigin,autoWrapLongitude:e.wrapLongitude}};if(t)for(let n of t)cd(s,n.getShaderModuleProps?.(e,s));for(let t of e.context.defaultShaderModules)t.name in s||(s[t.name]={});return cd(s,this.getShaderModuleProps(e,t,s),i)}};function od(e=0,t={}){let n={},r=(i,a)=>{let o=i.props._offset,s=i.id,c=i.parent&&i.parent.id,l;if(c&&!(c in t)&&r(i.parent,!1),c in n){let e=n[c]=n[c]||od(t[c],t);l=e(i,a),n[s]=e}else Number.isFinite(o)?(l=o+(t[c]||0),n[s]=null):l=e;return a&&l>=e&&(e=l+1),t[s]=l,l};return r}function sd(e,{canvasContext:t=e.canvasContext,shaderModuleProps:n,target:r,viewport:i}){let a=n?.project?.devicePixelRatio??t.cssToDeviceRatio(),[,o]=t.getDrawingBufferSize(),s=r?r.height:o,c=i;return[c.x*a,e.type===`webgpu`?c.y*a:s-(c.y+c.height)*a,c.width*a,c.height*a]}function cd(e,...t){for(let n of t)if(n)for(let t in n)e[t]?Object.assign(e[t],n[t]):e[t]=n[t];return e}var ld=class extends ad{constructor(e,t){super(e,t);let n=e.createTexture({format:`rgba8unorm`,width:1,height:1,sampler:{minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}),r=e.createTexture({format:`depth16unorm`,width:1,height:1});this.fbo=e.createFramebuffer({id:`shadowmap`,width:1,height:1,colorAttachments:[n],depthStencilAttachment:r})}delete(){this.fbo&&=(this.fbo.destroy(),null)}getShadowMap(){return this.fbo.colorAttachments[0].texture}render(e){let t=this.fbo,n=this.device.canvasContext.cssToDeviceRatio(),r=e.viewports[0],i=r.width*n,a=r.height*n,o=[1,1,1,1];(i!==t.width||a!==t.height)&&t.resize({width:i,height:a}),super.render({...e,clearColor:o,target:t,pass:`shadow`})}getLayerParameters(e,t,n){return{...e.props.parameters,blend:!1,depthWriteEnabled:!0,depthCompare:`less-equal`}}shouldDrawLayer(e){return e.props.shadowEnabled!==!1}getShaderModuleProps(e,t,n){return{shadow:{project:n.project,drawToShadowMap:!0}}}},ud={color:[255,255,255],intensity:1},dd=[{color:[255,255,255],intensity:1,direction:[-1,3,-1]},{color:[255,255,255],intensity:.9,direction:[1,-8,-2.5]}],fd=[0,0,0,200/255],pd=class{constructor(e={}){this.id=`lighting-effect`,this.shadowColor=fd,this.shadow=!1,this.directionalLights=[],this.pointLights=[],this.shadowPasses=[],this.dummyShadowMap=null,this.setProps(e)}setup(e){this.context=e;let{device:t,deck:n}=e;this.shadow&&!this.dummyShadowMap&&(this._createShadowPasses(t),n._addDefaultShaderModule(Fu),this.dummyShadowMap=t.createTexture({width:1,height:1}))}setProps(e){this.ambientLight=void 0,this.directionalLights=[],this.pointLights=[];for(let t in e){let n=e[t];switch(n.type){case`ambient`:this.ambientLight=n;break;case`directional`:this.directionalLights.push(n);break;case`point`:this.pointLights.push(n);break;default:}}this._applyDefaultLights(),this.shadow=this.directionalLights.some(e=>e.shadow),this.context&&this.setup(this.context),this.props=e}preRender({layers:e,layerFilter:t,viewports:n,onViewportActive:r,views:i}){if(this.shadow){this.shadowMatrices=this._calculateMatrices();for(let a=0;a<this.shadowPasses.length;a++)this.shadowPasses[a].render({layers:e,layerFilter:t,viewports:n,onViewportActive:r,views:i,shaderModuleProps:{shadow:{shadowLightId:a,dummyShadowMap:this.dummyShadowMap,shadowMatrices:this.shadowMatrices}}})}}getShaderModuleProps(e,t){let n=this.shadow?{project:t.project,shadowMaps:this.shadowPasses.map(e=>e.getShadowMap()),dummyShadowMap:this.dummyShadowMap,shadowColor:this.shadowColor,shadowMatrices:this.shadowMatrices}:{},r={enabled:!0,lights:this._getLights(e)},i=e.props.material;return{shadow:n,lighting:r,phongMaterial:i,gouraudMaterial:i}}cleanup(e){for(let e of this.shadowPasses)e.delete();this.shadowPasses.length=0,this.dummyShadowMap&&(this.dummyShadowMap.destroy(),this.dummyShadowMap=null,e.deck._removeDefaultShaderModule(Fu))}_calculateMatrices(){let e=[];for(let t of this.directionalLights){let n=new k().lookAt({eye:new D(t.direction).negate()});e.push(n)}return e}_createShadowPasses(e){for(let t=0;t<this.directionalLights.length;t++){let n=new ld(e);this.shadowPasses[t]=n}}_applyDefaultLights(){let{ambientLight:e,pointLights:t,directionalLights:n}=this;!e&&t.length===0&&n.length===0&&(this.ambientLight=new Zu(ud),this.directionalLights.push(new nd(dd[0]),new nd(dd[1])))}_getLights(e){let t=[];this.ambientLight&&t.push(this.ambientLight);for(let n of this.pointLights)t.push(n.getProjectedLight({layer:e}));for(let n of this.directionalLights)t.push(n.getProjectedLight({layer:e}));return t}},md=new class{constructor(e={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(e)}setOptions(e){Object.assign(this.opts,e)}allocate(e,t,{size:n=1,type:r,padding:i=0,copy:a=!1,initialize:o=!1,maxCount:s}){let c=r||e&&e.constructor||Float32Array,l=t*n+i;if(ArrayBuffer.isView(e)){if(l<=e.length)return e;if(l*e.BYTES_PER_ELEMENT<=e.buffer.byteLength)return new c(e.buffer,0,l)}let u=1/0;s&&(u=s*n+i);let d=this._allocate(c,l,o,u);return e&&a?d.set(e):o||d.fill(0,0,4),this._release(e),d}release(e){this._release(e)}_allocate(e,t,n,r){let i=Math.max(Math.ceil(t*this.opts.overAlloc),1);i>r&&(i=r);let a=this._pool,o=e.BYTES_PER_ELEMENT*i,s=a.findIndex(e=>e.byteLength>=o);if(s>=0){let t=new e(a.splice(s,1)[0],0,i);return n&&t.fill(0),t}return new e(i)}_release(e){if(!ArrayBuffer.isView(e))return;let t=this._pool,{buffer:n}=e,{byteLength:r}=n,i=t.findIndex(e=>e.byteLength>=r);i<0?t.push(n):(i>0||t.length<this.opts.poolSize)&&t.splice(i,0,n),t.length>this.opts.poolSize&&t.shift()}};function hd(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function gd(e,t){let n=e%t;return n<0?t+n:n}function _d(e){return[e[12],e[13],e[14]]}function vd(e){let t=e[10],n=e[14];return{near:n/(t-1),far:n/(t+1)}}function yd(e){return{left:xd(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),right:xd(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),bottom:xd(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),top:xd(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),near:xd(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),far:xd(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14])}}var bd=new D;function xd(e,t,n,r){bd.set(e,t,n);let i=bd.len();return{distance:r/i,normal:new D(-e/i,-t/i,-n/i)}}function Sd(e){return e-Math.fround(e)}var Cd;function wd(e,t){let{size:n=1,startIndex:r=0}=t,i=t.endIndex===void 0?e.length:t.endIndex,a=(i-r)/n;Cd=md.allocate(Cd,a,{type:Float32Array,size:n*2});let o=r,s=0;for(;o<i;){for(let t=0;t<n;t++){let r=e[o++];Cd[s+t]=r,Cd[s+t+n]=Sd(r)}s+=n*2}return Cd.subarray(0,a*n*2)}function Td(e){let t=null,n=!1;for(let r of e)r&&(t?(n||=(t=[[t[0][0],t[0][1]],[t[1][0],t[1][1]]],!0),t[0][0]=Math.min(t[0][0],r[0][0]),t[0][1]=Math.min(t[0][1],r[0][1]),t[1][0]=Math.max(t[1][0],r[1][0]),t[1][1]=Math.max(t[1][1],r[1][1])):t=r);return t}var Ed=Math.PI/180,Dd=hd(),Od=[0,0,0],kd={unitsPerMeter:[1,1,1],metersPerUnit:[1,1,1]};function Ad({width:e,height:t,orthographic:n,fovyRadians:r,focalDistance:i,padding:a,near:o,far:s}){let c=e/t,l=n?new k().orthographic({fovy:r,aspect:c,focalDistance:i,near:o,far:s}):new k().perspective({fovy:r,aspect:c,near:o,far:s});if(a){let{left:n=0,right:r=0,top:i=0,bottom:o=0}=a,s=O((n+e-r)/2,0,e)-e/2,c=O((i+t-o)/2,0,t)-t/2;l[8]-=s*2/e,l[9]+=c*2/t}return l}var jd=class e{constructor(e={}){this._frustumPlanes={},this.id=e.id||this.constructor.displayName||`viewport`,this.x=e.x||0,this.y=e.y||0,this.width=e.width||1,this.height=e.height||1,this.zoom=e.zoom||0,this.padding=e.padding,this.distanceScales=e.distanceScales||kd,this.focalDistance=e.focalDistance||1,this.position=e.position||Od,this.modelMatrix=e.modelMatrix||null;let{longitude:t,latitude:n}=e;this.isGeospatial=Number.isFinite(n)&&Number.isFinite(t),this._initProps(e),this._initMatrices(e),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return this.distanceScales.metersPerUnit[2]/this.scale}get projectionMode(){return this.isGeospatial?this.zoom<12?I.WEB_MERCATOR:I.WEB_MERCATOR_AUTO_OFFSET:I.IDENTITY}equals(t){return t instanceof e?this===t?!0:t.width===this.width&&t.height===this.height&&t.scale===this.scale&&t.projectionMode===this.projectionMode&&t.resolution===this.resolution&&ke(t.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&ke(t.projectionMatrix,this.projectionMatrix)&&ke(t.viewMatrix,this.viewMatrix):!1}project(e,{topLeft:t=!0}={}){let n=mu(this.projectPosition(e),this.pixelProjectionMatrix),[r,i]=n,a=t?i:this.height-i;return e.length===2?[r,a]:[r,a,n[2]]}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[r,i,a]=e,o=t?i:this.height-i,s=n&&n*this.distanceScales.unitsPerMeter[2],c=hu([r,o,a],this.pixelUnprojectionMatrix,s),[l,u,d]=this.unprojectPosition(c);return Number.isFinite(a)?[l,u,d]:Number.isFinite(n)?[l,u,n]:[l,u]}projectPosition(e){let[t,n]=this.projectFlat(e);return[t,n,(e[2]||0)*this.distanceScales.unitsPerMeter[2]]}unprojectPosition(e){let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)*this.distanceScales.metersPerUnit[2]]}projectFlat(e){if(this.isGeospatial){let t=iu(e);return t[1]=O(t[1],-318,830),t}return e}unprojectFlat(e){return this.isGeospatial?au(e):e}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,0],t),r=this.unproject([this.width,0],t),i=this.unproject([0,this.height],t),a=this.unproject([this.width,this.height],t);return[Math.min(n[0],r[0],i[0],a[0]),Math.min(n[1],r[1],i[1],a[1]),Math.max(n[0],r[0],i[0],a[0]),Math.max(n[1],r[1],i[1],a[1])]}getDistanceScales(e){return e&&this.isGeospatial?cu({longitude:e[0],latitude:e[1],highPrecision:!0}):this.distanceScales}containsPixel({x:e,y:t,width:n=1,height:r=1}){return e<this.x+this.width&&this.x<e+n&&t<this.y+this.height&&this.y<t+r}getFrustumPlanes(){return this._frustumPlanes.near||Object.assign(this._frustumPlanes,yd(this.viewProjectionMatrix)),this._frustumPlanes}panByPosition(e,t,n){return null}_initProps(e){let t=e.longitude,n=e.latitude;this.isGeospatial&&(Number.isFinite(e.zoom)||(this.zoom=ou({latitude:n})+Math.log2(this.focalDistance)),this.distanceScales=e.distanceScales||cu({latitude:n,longitude:t})),this.scale=2**this.zoom;let{position:r,modelMatrix:i}=e,a=Od;if(r&&(a=i?new k(i).transformAsVector(r,[]):r),this.isGeospatial){let e=this.projectPosition([t,n,0]);this.center=new D(a).scale(this.distanceScales.unitsPerMeter).add(e)}else this.center=this.projectPosition(a)}_initMatrices(e){let{viewMatrix:t=Dd,projectionMatrix:n=null,orthographic:r=!1,fovyRadians:i,fovy:a=75,near:o=.1,far:s=1e3,padding:c=null,focalDistance:l=1}=e;this.viewMatrixUncentered=t,this.viewMatrix=new k().multiplyRight(t).translate(new D(this.center).negate()),this.projectionMatrix=n||Ad({width:this.width,height:this.height,orthographic:r,fovyRadians:i||a*Ed,focalDistance:l,padding:c,near:o,far:s});let u=hd();ve(u,u,this.projectionMatrix),ve(u,u,this.viewMatrix),this.viewProjectionMatrix=u,this.viewMatrixInverse=_e([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=_d(this.viewMatrixInverse);let d=hd(),f=hd();Xe(d,d,[this.width/2,-this.height/2,1]),ge(d,d,[1,-1,0]),ve(f,d,this.viewProjectionMatrix),this.pixelProjectionMatrix=f,this.pixelUnprojectionMatrix=_e(hd(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||j.warn(`Pixel project matrix not invertible`)()}};jd.displayName=`Viewport`;var Md=class e extends jd{constructor(e={}){let{latitude:t=0,longitude:n=0,zoom:r=0,pitch:i=0,bearing:a=0,nearZMultiplier:o=.1,farZMultiplier:s=1.01,nearZ:c,farZ:l,orthographic:u=!1,projectionMatrix:d,repeat:f=!1,worldOffset:p=0,position:m,padding:h,legacyMeterSizes:g=!1}=e,{width:_,height:v,altitude:y=1.5}=e,b=2**r;_||=1,v||=1;let x,S=null;if(d)y=d[5]/2,x=fu(y);else{e.fovy?(x=e.fovy,y=pu(x)):x=fu(y);let n;if(h){let{top:e=0,bottom:t=0}=h;n=[0,O((e+v-t)/2,0,v)-v/2]}S=du({width:_,height:v,scale:b,center:m&&[0,0,m[2]*su(t)],offset:n,pitch:i,fovy:x,nearZMultiplier:o,farZMultiplier:s}),Number.isFinite(c)&&(S.near=c),Number.isFinite(l)&&(S.far=l)}let C=uu({height:v,pitch:i,bearing:a,scale:b,altitude:y});p&&(C=new k().translate([512*p,0,0]).multiplyLeft(C)),super({...e,width:_,height:v,viewMatrix:C,longitude:n,latitude:t,zoom:r,...S,fovy:x,focalDistance:y}),this.latitude=t,this.longitude=n,this.zoom=r,this.pitch=i,this.bearing=a,this.altitude=y,this.fovy=x,this.orthographic=u,this._subViewports=f?[]:null,this._pseudoMeters=g,Object.freeze(this)}get subViewports(){if(this._subViewports&&!this._subViewports.length){let t=this.getBounds(),n=Math.floor((t[0]+180)/360),r=Math.ceil((t[2]-180)/360);for(let t=n;t<=r;t++){let n=t?new e({...this,worldOffset:t}):this;this._subViewports.push(n)}}return this._subViewports}equals(t){return t instanceof e&&t._pseudoMeters===this._pseudoMeters&&super.equals(t)}projectPosition(e){if(this._pseudoMeters)return super.projectPosition(e);let[t,n]=this.projectFlat(e);return[t,n,(e[2]||0)*su(e[1])]}unprojectPosition(e){if(this._pseudoMeters)return super.unprojectPosition(e);let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)/su(n)]}addMetersToLngLat(e,t){return lu(e,t)}panByPosition(e,t,n){let r=hu(t,this.pixelUnprojectionMatrix),i=Ee([],this.projectFlat(e),he([],r)),a=Ee([],this.center,i),[o,s]=this.unprojectFlat(a);return{longitude:o,latitude:s}}panByPosition3D(e,t){let n=e[2]||0,r=Ne([],e,this.unproject(t,{targetZ:n}));return{longitude:this.longitude+r[0],latitude:this.latitude+r[1]}}getBounds(e={}){let t=yu(this,e.z||0);return[Math.min(t[0][0],t[1][0],t[2][0],t[3][0]),Math.min(t[0][1],t[1][1],t[2][1],t[3][1]),Math.max(t[0][0],t[1][0],t[2][0],t[3][0]),Math.max(t[0][1],t[1][1],t[2][1],t[3][1])]}fitBounds(t,n={}){let{width:r,height:i}=this,{longitude:a,latitude:o,zoom:s}=gu({width:r,height:i,bounds:t,...n});return new e({width:r,height:i,longitude:a,latitude:o,zoom:s})}};Md.displayName=`WebMercatorViewport`;var Nd=[0,0,0];function Pd(e,t,n=!1){let r=t.projectPosition(e);if(n&&t instanceof Md){let[n,i,a=0]=e;r[2]=a*t.getDistanceScales([n,i]).unitsPerMeter[2]}return r}function Fd(e){let{viewport:t,modelMatrix:n,coordinateOrigin:r}=e,{coordinateSystem:i,fromCoordinateSystem:a,fromCoordinateOrigin:o}=e;return i===`default`&&(i=t.isGeospatial?`lnglat`:`cartesian`),a===void 0?a=i:a===`default`&&(a=t.isGeospatial?`lnglat`:`cartesian`),o===void 0&&(o=r),{viewport:t,coordinateSystem:i,coordinateOrigin:r,modelMatrix:n,fromCoordinateSystem:a,fromCoordinateOrigin:o}}function Id(e,{viewport:t,modelMatrix:n,coordinateSystem:r,coordinateOrigin:i,offsetMode:a}){let[o,s,c=0]=e;switch(n&&([o,s,c]=xe([],[o,s,c,1],n)),r){case`default`:return Id(e,{viewport:t,modelMatrix:n,coordinateSystem:t.isGeospatial?`lnglat`:`cartesian`,coordinateOrigin:i,offsetMode:a});case`lnglat`:return Pd([o,s,c],t,a);case`lnglat-offsets`:return Pd([o+i[0],s+i[1],c+(i[2]||0)],t,a);case`meter-offsets`:return Pd(lu(i,[o,s,c]),t,a);case`cartesian`:return t.isGeospatial?[o+i[0],s+i[1],c+i[2]]:t.projectPosition([o,s,c]);default:throw Error(`Invalid coordinateSystem: ${r}`)}}function Ld(e,t){let{viewport:n,coordinateSystem:r,coordinateOrigin:i,modelMatrix:a,fromCoordinateSystem:o,fromCoordinateOrigin:s}=Fd(t),{autoOffset:c=!0}=t,{geospatialOrigin:l=Nd,shaderCoordinateOrigin:u=Nd,offsetMode:d=!1}=c?Nl(n,r,i):{},f=Id(e,{viewport:n,modelMatrix:a,coordinateSystem:o,coordinateOrigin:s,offsetMode:d});return d&&Te(f,f,n.projectPosition(l||u)),f}var Rd={blendColorOperation:`add`,blendColorSrcFactor:`one`,blendColorDstFactor:`zero`,blendAlphaOperation:`add`,blendAlphaSrcFactor:`constant`,blendAlphaDstFactor:`zero`},zd=class extends ad{constructor(){super(...arguments),this._colorEncoderState=null}render(e){return`pickingFBO`in e?this._drawPickingBuffer(e):{decodePickingColor:null,stats:super._render(e)}}_drawPickingBuffer({layers:e,layerFilter:t,views:n,viewports:r,onViewportActive:i,pickingFBO:a,deviceRect:{x:o,y:s,width:c,height:l},cullRect:u,effects:d,pass:f=`picking`,pickZ:p,canvasContext:m,shaderModuleProps:h,clearColor:g}){this.pickZ=p;let _=this._resetColorEncoder(p),v=[o,this.device.type===`webgpu`?a.height-s-l:s,c,l],y=super._render({target:a,layers:e,layerFilter:t,views:n,viewports:r,onViewportActive:i,cullRect:u,effects:d?.filter(e=>e.useInPicking),pass:f,canvasContext:m,isPicking:!0,shaderModuleProps:h,clearColor:g??[0,0,0,0],colorMask:15,scissorRect:v});return this._colorEncoderState=null,{decodePickingColor:_&&Vd.bind(null,_),stats:y}}shouldDrawLayer(e){let{pickable:t,operation:n}=e.props;return t&&n.includes(`draw`)||n.includes(`terrain`)||n.includes(`mask`)}getShaderModuleProps(e,t,n){return{picking:{isActive:1,isAttribute:this.pickZ,disabledPickingIndices:e.internalState?.disabledPickingIndices},lighting:{enabled:!1}}}getLayerParameters(e,t,n){let r={...e.props.parameters},{pickable:i,operation:a}=e.props;return this._colorEncoderState?i&&a.includes(`draw`)?(Object.assign(r,Rd),r.blend=!0,this.device.type===`webgpu`?r.blendConstant=Bd(this._colorEncoderState,e,n):r.blendColor=Bd(this._colorEncoderState,e,n),a.includes(`terrain`)&&e.state?._hasPickingCover&&(r.blendAlphaSrcFactor=`one`)):a.includes(`terrain`)&&(r.blend=!1):r.blend=!1,r}_resetColorEncoder(e){return this._colorEncoderState=e?null:{byLayer:new Map,byAlpha:[]},this._colorEncoderState}};function Bd(e,t,n){let{byLayer:r,byAlpha:i}=e,a,o=r.get(t);return o?(o.viewports.push(n),a=o.a):(a=r.size+1,a<=255?(o={a,layer:t,viewports:[n]},r.set(t,o),i[a]=o):(j.warn(`Too many pickable layers, only picking the first 255`)(),a=0)),[0,0,0,a/255]}function Vd(e,t){let n=e.byAlpha[t[3]];return n&&{pickedLayer:n.layer,pickedViewports:n.viewports,pickedObjectIndex:n.layer.decodePickingColor(t)}}var Hd={NO_STATE:`Awaiting state`,MATCHED:`Matched. State transferred from previous layer`,INITIALIZED:`Initialized`,AWAITING_GC:`Discarded. Awaiting garbage collection`,AWAITING_FINALIZATION:`No longer matched. Awaiting garbage collection`,FINALIZED:`Finalized! Awaiting garbage collection`},Ud=Symbol.for(`component`),Wd=Symbol.for(`propTypes`),Gd=Symbol.for(`deprecatedProps`),Kd=Symbol.for(`asyncPropDefaults`),qd=Symbol.for(`asyncPropOriginal`),Jd=Symbol.for(`asyncPropResolved`);function Yd(e,t=()=>!0){return Array.isArray(e)?Xd(e,t,[]):t(e)?[e]:[]}function Xd(e,t,n){let r=-1;for(;++r<e.length;){let i=e[r];Array.isArray(i)?Xd(i,t,n):t(i)&&n.push(i)}return n}function Zd({target:e,source:t,start:n=0,count:r=1}){let i=t.length,a=r*i,o=0;for(let r=n;o<i;o++)e[r++]=t[o];for(;o<a;)o<a-o?(e.copyWithin(n+o,n,n+o),o*=2):(e.copyWithin(n+o,n,n+a-o),o=a);return e}var Qd=class{constructor(e,t,n){this._loadCount=0,this._subscribers=new Set,this.id=e,this.context=n,this.setData(t)}subscribe(e){this._subscribers.add(e)}unsubscribe(e){this._subscribers.delete(e)}inUse(){return this._subscribers.size>0}delete(){}getData(){return this.isLoaded?this._error?Promise.reject(this._error):this._content:this._loader.then(()=>this.getData())}setData(e,t){if(e===this._data&&!t)return;this._data=e;let n=++this._loadCount,r=e;typeof e==`string`&&(r=Mo(e)),r instanceof Promise?(this.isLoaded=!1,this._loader=r.then(e=>{this._loadCount===n&&(this.isLoaded=!0,this._error=void 0,this._content=e)}).catch(e=>{this._loadCount===n&&(this.isLoaded=!0,this._error=e||!0)})):(this.isLoaded=!0,this._error=void 0,this._content=e);for(let e of this._subscribers)e.onChange(this.getData())}},$d=class{constructor(e){this.protocol=e.protocol||`resource://`,this._context={device:e.device,gl:e.device?.gl,resourceManager:this},this._resources={},this._consumers={},this._pruneRequest=null}contains(e){return e.startsWith(this.protocol)?!0:e in this._resources}add({resourceId:e,data:t,forceUpdate:n=!1,persistent:r=!0}){let i=this._resources[e];i?i.setData(t,n):(i=new Qd(e,t,this._context),this._resources[e]=i),i.persistent=r}remove(e){let t=this._resources[e];t&&(t.delete(),delete this._resources[e])}unsubscribe({consumerId:e}){let t=this._consumers[e];if(t){for(let e in t){let n=t[e],r=this._resources[n.resourceId];r&&r.unsubscribe(n)}delete this._consumers[e],this.prune()}}subscribe({resourceId:e,onChange:t,consumerId:n,requestId:r=`default`}){let{_resources:i,protocol:a}=this;e.startsWith(a)&&(e=e.replace(a,``),i[e]||this.add({resourceId:e,data:null,persistent:!1}));let o=i[e];if(this._track(n,r,o,t),o)return o.getData()}prune(){this._pruneRequest||=setTimeout(()=>this._prune(),0)}finalize(){for(let e in this._resources)this._resources[e].delete()}_track(e,t,n,r){let i=this._consumers,a=i[e]=i[e]||{},o=a[t],s=o&&o.resourceId&&this._resources[o.resourceId];s&&(s.unsubscribe(o),this.prune()),n&&(o?(o.onChange=r,o.resourceId=n.id):o={onChange:r,resourceId:n.id},a[t]=o,n.subscribe(o))}_prune(){this._pruneRequest=null;for(let e of Object.keys(this._resources)){let t=this._resources[e];!t.persistent&&!t.inUse()&&(t.delete(),delete this._resources[e])}}},ef=`layerManager.setLayers`,tf=`layerManager.activateViewport`,nf=class{constructor(e,t){this._lastRenderedLayers=[],this._needsRedraw=!1,this._needsUpdate=!1,this._nextLayers=null,this._debug=!1,this._defaultShaderModulesChanged=!1,this.activateViewport=e=>{M(tf,this,e),e&&(this.context.viewport=e)};let{deck:n,stats:r,viewport:i,timeline:a}=t||{};this.layers=[],this.resourceManager=new $d({device:e,protocol:`deck://`}),this.context={mousePosition:null,userData:{},layerManager:this,device:e,gl:e?.gl,deck:n,shaderAssembler:qu(e?.info?.shadingLanguage||`glsl`),defaultShaderModules:[Ds],renderPass:void 0,stats:r||new qi({id:`deck.gl`}),viewport:i||new jd({id:`DEFAULT-INITIAL-VIEWPORT`}),timeline:a||new nn,resourceManager:this.resourceManager,onError:void 0},Object.seal(this)}finalize(){this.resourceManager.finalize();for(let e of this.layers)this._finalizeLayer(e)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);for(let n of this.layers){let r=n.getNeedsRedraw(e);t||=r}return t}needsUpdate(){return this._nextLayers&&this._nextLayers!==this._lastRenderedLayers?`layers changed`:this._defaultShaderModulesChanged?`shader modules changed`:this._needsUpdate}setNeedsRedraw(e){this._needsRedraw=this._needsRedraw||e}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e}getLayers({layerIds:e}={}){return e?this.layers.filter(t=>e.find(e=>t.id.indexOf(e)===0)):this.layers}setProps(e){`debug`in e&&(this._debug=e.debug),`userData`in e&&(this.context.userData=e.userData),`layers`in e&&(this._nextLayers=e.layers),`onError`in e&&(this.context.onError=e.onError)}setLayers(e,t){M(ef,this,t,e),this._lastRenderedLayers=e;let n=Yd(e,Boolean);for(let e of n)e.context=this.context;this._updateLayers(this.layers,n)}updateLayers(){let e=this.needsUpdate();e&&(this.setNeedsRedraw(`updating layers: ${e}`),this.setLayers(this._nextLayers||this._lastRenderedLayers,e)),this._nextLayers=null}addDefaultShaderModule(e){let{defaultShaderModules:t}=this.context;t.find(t=>t.name===e.name)||(t.push(e),this._defaultShaderModulesChanged=!0)}removeDefaultShaderModule(e){let{defaultShaderModules:t}=this.context,n=t.findIndex(t=>t.name===e.name);n>=0&&(t.splice(n,1),this._defaultShaderModulesChanged=!0)}_handleError(e,t,n){n.raiseError(t,`${e} of ${n}`)}_updateLayers(e,t){let n={};for(let t of e)n[t.id]?j.warn(`Multiple old layers with same id ${t.id}`)():n[t.id]=t;if(this._defaultShaderModulesChanged){for(let t of e)t.setNeedsUpdate(),t.setChangeFlags({extensionsChanged:!0});this._defaultShaderModulesChanged=!1}let r=[];this._updateSublayersRecursively(t,n,r),this._finalizeOldLayers(n);let i=!1;for(let e of r)if(e.hasUniformTransition()){i=`Uniform transition in ${e}`;break}this._needsUpdate=i,this.layers=r}_updateSublayersRecursively(e,t,n){for(let r of e){r.context=this.context;let e=t[r.id];e===null&&j.warn(`Multiple new layers with same id ${r.id}`)(),t[r.id]=null;let i=null;try{this._debug&&e!==r&&r.validateProps(),e?(this._transferLayerState(e,r),this._updateLayer(r)):this._initializeLayer(r),n.push(r),i=r.isComposite?r.getSubLayers():null}catch(e){this._handleError(`matching`,e,r)}i&&this._updateSublayersRecursively(i,t,n)}}_finalizeOldLayers(e){for(let t in e){let n=e[t];n&&this._finalizeLayer(n)}}_initializeLayer(e){try{e._initialize(),e.lifecycle=Hd.INITIALIZED}catch(t){this._handleError(`initialization`,t,e)}}_transferLayerState(e,t){t._transferState(e),t.lifecycle=Hd.MATCHED,t!==e&&(e.lifecycle=Hd.AWAITING_GC)}_updateLayer(e){try{e._update()}catch(t){this._handleError(`update`,t,e)}}_finalizeLayer(e){this._needsRedraw=this._needsRedraw||`finalized ${e}`,e.lifecycle=Hd.AWAITING_FINALIZATION;try{e._finalize(),e.lifecycle=Hd.FINALIZED}catch(t){this._handleError(`finalization`,t,e)}}};function L(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!L(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=Object.keys(e),i=Object.keys(t);if(r.length!==i.length)return!1;for(let i of r)if(!t.hasOwnProperty(i)||!L(e[i],t[i],n-1))return!1;return!0}return!1}var rf=`default-canvas`,af=class{constructor(e){this.views=[],this.width=100,this.height=100,this.viewState={},this.controllers={},this.timeline=e.timeline,this._viewports=[],this._viewportMap={},this._isUpdating=!1,this._needsRedraw=`First render`,this._needsUpdate=`Initialize`,this._eventManager=e.eventManager,this._eventManagers=e.eventManagers||{},this._viewEventManagers={},this._eventCallbacks={onViewStateChange:e.onViewStateChange,onInteractionStateChange:e.onInteractionStateChange},this._pickPosition=e.pickPosition,this._getCanvasContext=e.getCanvasContext,Object.seal(this),this.setProps(e)}finalize(){for(let e in this.controllers){let t=this.controllers[e];t&&t.finalize()}this.controllers={}}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e,this._needsRedraw=this._needsRedraw||e}updateViewStates(){for(let e in this.controllers){let t=this.controllers[e];t&&t.updateTransition()}}getViewports(e){return e?this._viewports.filter(t=>{let n=!e.canvasId||this.getCanvasId(t.id)===e.canvasId,r=!(`x`in e)||t.containsPixel(e);return n&&r}):this._viewports}getViews(){let e={};return this.views.forEach(t=>{e[t.id]=t}),e}getView(e){return this.views.find(t=>t.id===e)}getViewState(e){let t=typeof e==`string`?this.getView(e):e,n=t&&this.viewState[t.getViewStateId()]||this.viewState;return t?t.filterViewState(n):n}getViewport(e){return this._viewportMap[e]}getCanvasId(e){let t=typeof e==`string`?this.getView(e):e;return t?this._viewEventManagers[t.id]?.canvasId||this._getCanvasIdFromView(t):void 0}unproject(e,t){let n=this.getViewports(),r={x:e[0],y:e[1]};for(let i=n.length-1;i>=0;--i){let a=n[i];if(a.containsPixel(r)){let n=e.slice();return n[0]-=a.x,n[1]-=a.y,a.unproject(n,t)}}return null}setProps(e){e.views&&this._setViews(e.views),e.viewState&&this._setViewState(e.viewState),(`width`in e||`height`in e)&&this._setSize(e.width,e.height),`pickPosition`in e&&(this._pickPosition=e.pickPosition),`eventManagers`in e&&this._setEventManagers(e.eventManagers||{}),this._isUpdating||this._update()}_update(){this._isUpdating=!0,this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._isUpdating=!1}_setSize(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.setNeedsUpdate(`Size changed`))}_setViews(e){e=Yd(e,Boolean),this._diffViews(e,this.views)&&this.setNeedsUpdate(`views changed`),this.views=e}_setViewState(e){e?(L(e,this.viewState,3)||this.setNeedsUpdate(`viewState changed`),this.viewState=e):j.warn("missing `viewState` or `initialViewState`")()}_setEventManagers(e){this._eventManagers!==e&&(this._eventManagers=e,this.setNeedsUpdate(`eventManagers changed`))}_getCanvasIdFromView(e){return e.props.canvasId||this._getCanvasContext?.(e.id)?.id||`default-canvas`}_getCanvasDimensions(e){let[t,n]=(this._getCanvasContext?.(e.id))?.getCSSSize()||[this.width,this.height];return{width:t,height:n}}_getViewEventManager(e){let t=this.getCanvasId(e)||`default-canvas`;return{canvasId:t,eventManager:this._eventManagers[t]||this._eventManager}}_startViewportRebuild(){let e=this.controllers,t=this._viewEventManagers;return this._viewports=[],this.controllers={},this._viewEventManagers={},{oldControllers:e,oldViewEventManagers:t}}_getReusableController(e,t,n){return e&&(t?.canvasId!==n.canvasId||t?.eventManager!==n.eventManager)?(e.finalize(),null):e}_createController(e,t){let n=t.type;return new n({timeline:this.timeline,eventManager:this._getViewEventManager(e).eventManager,onViewStateChange:this._eventCallbacks.onViewStateChange,onStateChange:this._eventCallbacks.onInteractionStateChange,makeViewport:t=>this.getView(e.id)?.makeViewport({viewState:t,...this._getCanvasDimensions(e)}),pickPosition:(t,n)=>this._pickPosition?.(t,n,e.id)})}_updateController(e,t,n,r){let i=e.controller;if(i&&n){let a={...t,...i,id:e.id,x:n.x,y:n.y,width:n.width,height:n.height};return(!r||r.constructor!==i.type)&&(r=this._createController(e,a)),r&&r.setProps(a),r}return null}_rebuildViewports(){let{views:e}=this,{oldControllers:t,oldViewEventManagers:n}=this._startViewportRebuild(),r=!1;for(let i=e.length;i--;){let a=e[i],{width:o,height:s}=this._getCanvasDimensions(a),c=this._getViewEventManager(a);this._viewEventManagers[a.id]=c;let l=this.getViewState(a),u=a.makeViewport({viewState:l,width:o,height:s}),d=this._getReusableController(t[a.id],n[a.id],c),f=!!a.controller;f&&!d&&(r=!0),(r||!f)&&d&&(d.finalize(),d=null),this.controllers[a.id]=this._updateController(a,l,u,d),u&&this._viewports.unshift(u)}for(let e in t){let n=t[e];n&&!this.controllers[e]&&n.finalize()}this._buildViewportMap()}_buildViewportMap(){this._viewportMap={},this._viewports.forEach(e=>{e.id&&(this._viewportMap[e.id]=this._viewportMap[e.id]||e)})}_diffViews(e,t){return e.length===t.length?e.some((n,r)=>!e[r].equals(t[r])):!0}},of=/^(?:\d+\.?\d*|\.\d+)$/;function sf(e){switch(typeof e){case`number`:if(!Number.isFinite(e))throw Error(`Could not parse position string ${e}`);return{type:`literal`,value:e};case`string`:try{return new df(uf(e)).parseExpression()}catch(t){let n=t instanceof Error?t.message:String(t);throw Error(`Could not parse position string ${e}: ${n}`)}default:throw Error(`Could not parse position string ${e}`)}}function cf(e,t){switch(e.type){case`literal`:return e.value;case`percentage`:return Math.round(e.value*t);case`binary`:let n=cf(e.left,t),r=cf(e.right,t);return e.operator===`+`?n+r:n-r;default:throw Error(`Unknown layout expression type`)}}function lf(e,t){return cf(e,t)}function uf(e){let t=[],n=0;for(;n<e.length;){let r=e[n];if(/\s/.test(r)){n++;continue}if(r===`+`||r===`-`||r===`(`||r===`)`||r===`%`){t.push({type:`symbol`,value:r}),n++;continue}if(ff(r)||r===`.`){let i=n,a=r===`.`;for(n++;n<e.length;){let t=e[n];if(ff(t)){n++;continue}if(t===`.`&&!a){a=!0,n++;continue}break}let o=e.slice(i,n);if(!of.test(o))throw Error(`Invalid number token`);t.push({type:`number`,value:parseFloat(o)});continue}if(pf(r)){let r=n;for(;n<e.length&&pf(e[n]);)n++;let i=e.slice(r,n).toLowerCase();t.push({type:`word`,value:i});continue}throw Error(`Invalid token in position string`)}return t}var df=class{constructor(e){this.index=0,this.tokens=e}parseExpression(){let e=this.parseBinaryExpression();if(this.index<this.tokens.length)throw Error(`Unexpected token at end of expression`);return e}parseBinaryExpression(){let e=this.parseFactor(),t=this.peek();for(;mf(t);){this.index++;let n=this.parseFactor();e={type:`binary`,operator:t.value,left:e,right:n},t=this.peek()}return e}parseFactor(){let e=this.peek();if(!e)throw Error(`Unexpected end of expression`);if(e.type===`symbol`&&e.value===`+`)return this.index++,this.parseFactor();if(e.type===`symbol`&&e.value===`-`)return this.index++,{type:`binary`,operator:`-`,left:{type:`literal`,value:0},right:this.parseFactor()};if(e.type===`symbol`&&e.value===`(`){this.index++;let e=this.parseBinaryExpression();if(!this.consumeSymbol(`)`))throw Error(`Missing closing parenthesis`);return e}if(e.type===`word`&&e.value===`calc`){if(this.index++,!this.consumeSymbol(`(`))throw Error(`Missing opening parenthesis after calc`);let e=this.parseBinaryExpression();if(!this.consumeSymbol(`)`))throw Error(`Missing closing parenthesis`);return e}if(e.type===`number`){this.index++;let t=e.value,n=this.peek();return n&&n.type===`symbol`&&n.value===`%`?(this.index++,{type:`percentage`,value:t/100}):(n&&n.type===`word`&&n.value===`px`&&this.index++,{type:`literal`,value:t})}throw Error(`Unexpected token in expression`)}consumeSymbol(e){let t=this.peek();return t&&t.type===`symbol`&&t.value===e?(this.index++,!0):!1}peek(){return this.tokens[this.index]||null}};function ff(e){return e>=`0`&&e<=`9`}function pf(e){return e>=`a`&&e<=`z`||e>=`A`&&e<=`Z`}function mf(e){return!!(e&&e.type===`symbol`&&(e.value===`+`||e.value===`-`))}function hf(e,t){let n={...e};for(let e in t)e!==`id`&&(Array.isArray(n[e])&&Array.isArray(t[e])?n[e]=gf(n[e],t[e]):n[e]=t[e]);return n}function gf(e,t){e=e.slice();for(let n=0;n<t.length;n++){let r=t[n];Number.isFinite(r)&&(e[n]=r)}return e}var _f=class{constructor(e){let{id:t,x:n=0,y:r=0,width:i=`100%`,height:a=`100%`,padding:o=null}=e;this.id=t||this.constructor.displayName||`view`,this.props={...e,id:this.id},this._x=sf(n),this._y=sf(r),this._width=sf(i),this._height=sf(a),this._padding=o&&{left:sf(o.left||0),right:sf(o.right||0),top:sf(o.top||0),bottom:sf(o.bottom||0)},this.equals=this.equals.bind(this),Object.seal(this)}equals(e){return this===e?!0:this.constructor===e.constructor&&L(this.props,e.props,2)}clone(e){let t=this.constructor;return new t({...this.props,...e})}makeViewport({width:e,height:t,viewState:n}){n=this.filterViewState(n);let r=this.getDimensions({width:e,height:t});return!r.height||!r.width?null:new(this.getViewportType(n))({...n,...this.props,...r})}getViewStateId(){let{viewState:e}=this.props;return typeof e==`string`?e:e?.id||this.id}filterViewState(e){return this.props.viewState&&typeof this.props.viewState==`object`?this.props.viewState.id?hf(e,this.props.viewState):this.props.viewState:e}getDimensions({width:e,height:t}){let n={x:lf(this._x,e),y:lf(this._y,t),width:lf(this._width,e),height:lf(this._height,t)};return this._padding&&(n.padding={left:lf(this._padding.left,e),top:lf(this._padding.top,t),right:lf(this._padding.right,e),bottom:lf(this._padding.bottom,t)}),n}get controller(){let e=this.props.controller;return e?e===!0?{type:this.ControllerType}:typeof e==`function`?{type:e}:{type:this.ControllerType,...e}:null}},vf=class{constructor(e){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=e}get inProgress(){return this._inProgress}start(e){this.cancel(),this.settings=e,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&=(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,!1)}update(){if(!this._inProgress)return!1;if(this._handle===null){let{_timeline:e,settings:t}=this;this._handle=e.addChannel({delay:e.getTime(),duration:t.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}},yf=()=>{},bf={mode:`preserve`},xf={mode:`hard`},Sf={BREAK:1,SNAP_TO_END:2,IGNORE:3},Cf=e=>e,wf=Sf.BREAK,Tf=class{constructor(e){this._onTransitionUpdate=e=>{let{time:t,settings:{interpolator:n,startProps:r,endProps:i,duration:a,easing:o}}=e,s=o(t/a),c=n.interpolateProps(r,i,s);this.propsInTransition=this.getControllerState({...this.props,...c},bf).getViewportProps(),this.onViewStateChange({viewState:this.propsInTransition,oldViewState:this.props})},this.getControllerState=e.getControllerState,this.propsInTransition=null,this.transition=new vf(e.timeline),this.onViewStateChange=e.onViewStateChange||yf,this.onStateChange=e.onStateChange||yf}finalize(){this.transition.cancel()}getViewportInTransition(){return this.propsInTransition}processViewStateChange(e){let t=!1,n=this.props;if(this.props=e,!n||this._shouldIgnoreViewportChange(n,e))return!1;if(this._isTransitionEnabled(e)){let r=n;if(this.transition.inProgress){let{interruption:e,endProps:t}=this.transition.settings;r={...n,...e===Sf.SNAP_TO_END?t:this.propsInTransition||n}}this._triggerTransition(r,e),t=!0}else this.transition.cancel();return t}updateTransition(){this.transition.update()}_isTransitionEnabled(e){let{transitionDuration:t,transitionInterpolator:n}=e;return(t>0||t===`auto`)&&!!n}_isUpdateDueToCurrentTransition(e){return this.transition.inProgress&&this.propsInTransition?this.transition.settings.interpolator.arePropsEqual(e,this.propsInTransition):!1}_shouldIgnoreViewportChange(e,t){return this.transition.inProgress?this.transition.settings.interruption===Sf.IGNORE||this._isUpdateDueToCurrentTransition(t):this._isTransitionEnabled(t)?t.transitionInterpolator.arePropsEqual(e,t):!0}_triggerTransition(e,t){let n=this.getControllerState(e,bf),r=this.getControllerState(t,xf).shortestPathFrom(n),i=t.transitionInterpolator,a=i.getDuration?i.getDuration(e,t):t.transitionDuration;if(a===0)return;let o=i.initializeProps(e,r);this.propsInTransition={};let s={duration:a,easing:t.transitionEasing||Cf,interpolator:i,interruption:t.transitionInterruption||wf,startProps:o.start,endProps:o.end,onStart:t.onTransitionStart,onUpdate:this._onTransitionUpdate,onInterrupt:this._onTransitionEnd(t.onTransitionInterrupt),onEnd:this._onTransitionEnd(t.onTransitionEnd)};this.transition.start(s),this.onStateChange({inTransition:!0}),this.updateTransition()}_onTransitionEnd(e){return t=>{this.propsInTransition=null,this.onStateChange({inTransition:!1,isZooming:!1,isPanning:!1,isRotating:!1}),e?.(t)}}};function R(e,t){if(!e)throw Error(t||`deck.gl: assertion failed.`)}var Ef=class{constructor(e){let{compare:t,extract:n,required:r}=e;this._propsToCompare=t,this._propsToExtract=n||t,this._requiredProps=r}arePropsEqual(e,t){for(let n of this._propsToCompare)if(!(n in e)||!(n in t)||!ke(e[n],t[n]))return!1;return!0}initializeProps(e,t){let n={},r={};for(let i of this._propsToExtract)(i in e||i in t)&&(n[i]=e[i],r[i]=t[i]);return this._checkRequiredProps(n),this._checkRequiredProps(r),{start:n,end:r}}getDuration(e,t){return t.transitionDuration}_checkRequiredProps(e){this._requiredProps&&this._requiredProps.forEach(t=>{let n=e[t];R(Number.isFinite(n)||Array.isArray(n),`${t} is required for transition`)})}},Df=[`longitude`,`latitude`,`zoom`,`bearing`,`pitch`],Of=[`longitude`,`latitude`,`zoom`],kf=class extends Ef{constructor(e={}){let t=Array.isArray(e)?e:e.transitionProps,n=Array.isArray(e)?{}:e;n.transitionProps=Array.isArray(t)?{compare:t,required:t}:t||{compare:Df,required:Of},super(n.transitionProps),this.opts=n}initializeProps(e,t){let n=super.initializeProps(e,t),{makeViewport:r,around:i}=this.opts;if(r&&i){let a=r(e),o=r(t),s=a.unproject(i);n.start.around=i,Object.assign(n.end,{around:o.project(s),aroundPosition:s,width:t.width,height:t.height})}return n}interpolateProps(e,t,n){let r={};for(let i of this._propsToExtract)r[i]=Ue(e[i]||0,t[i]||0,n);if(t.aroundPosition&&this.opts.makeViewport){let i=this.opts.makeViewport({...t,...r});Object.assign(r,i.panByPosition(t.aroundPosition,Ue(e.around,t.around,n)))}return r}},Af={transitionDuration:0},jf=300,Mf=300,Nf=e=>1-(1-e)*(1-e),Pf=e=>e===1?1:1-2**(-10*e),Ff={WHEEL:[`wheel`],PAN:[`panstart`,`panmove`,`panend`],PINCH:[`pinchstart`,`pinchmove`,`pinchend`],MULTI_PAN:[`multipanstart`,`multipanmove`,`multipanend`],DOUBLE_CLICK:[`dblclick`],DOUBLE_CLICK_DRAG:[`dblclickdragstart`,`dblclickdragmove`,`dblclickdragend`,`dblclickdragcancel`],KEYBOARD:[`keydown`]},If={},Lf=class{constructor(e){this.state={},this._events={},this._interactionState={isDragging:!1},this._customEvents=[],this._eventStartBlocked=null,this._panMove=!1,this._multiPanMode=null,this._multiPanStartCenter=null,this._doubleClickDragAnchor=null,this._suppressDoubleClickUntil=0,this.invertPan=!1,this.dragMode=`rotate`,this.inertia=0,this.scrollZoom=!0,this.dragPan=!0,this.dragRotate=!0,this.doubleClickZoom=!0,this.doubleClickDragZoom=!0,this.touchZoom=!0,this.touchRotate=!1,this.multiTouchDrag=null,this.trackpadGesture=!1,this.zoomAround=`pointer`,this.keyboard=!0,this.transitionManager=new Tf({...e,getControllerState:(t,n)=>new this.ControllerState({...t,constraintContext:n,makeViewport:e.makeViewport}),onViewStateChange:this._onTransition.bind(this),onStateChange:this._setInteractionState.bind(this)}),this.handleEvent=this.handleEvent.bind(this),this.eventManager=e.eventManager,this.onViewStateChange=e.onViewStateChange||(()=>{}),this.onStateChange=e.onStateChange||(()=>{}),this.makeViewport=e.makeViewport,this.pickPosition=e.pickPosition}set events(e){this.toggleEvents(this._customEvents,!1),this.toggleEvents(e,!0),this._customEvents=e,this.props&&this.setProps(this.props)}finalize(){for(let e in this._events)this._events[e]&&this.eventManager?.off(e,this.handleEvent);this.transitionManager.finalize()}handleEvent(e){this._controllerState=void 0;let t=this._eventStartBlocked;switch(e.type){case`panstart`:return t?!1:this._onPanStart(e);case`panmove`:return this._onPan(e);case`panend`:return this._onPanEnd(e);case`pinchstart`:return t||!this._isTrackpadGestureAllowed(e)?!1:this._onPinchStart(e);case`pinchmove`:return this._isTrackpadGestureAllowed(e)?this._onPinch(e):!1;case`pinchend`:return this._isTrackpadGestureAllowed(e)?this._onPinchEnd(e):!1;case`multipanstart`:return t?!1:this._onMultiPanStart(e);case`multipanmove`:return this._onMultiPan(e);case`multipanend`:return this._onMultiPanEnd(e);case`dblclick`:return this._onDoubleClick(e);case`dblclickdragstart`:return t?!1:this._onDoubleClickDragStart(e);case`dblclickdragmove`:return this._onDoubleClickDrag(e);case`dblclickdragend`:case`dblclickdragcancel`:return this._onDoubleClickDragEnd(e);case`wheel`:return this._onWheel(e);case`keydown`:return this._onKeyDown(e);default:return!1}}get controllerState(){return this._controllerState=this._controllerState||new this.ControllerState({makeViewport:this.makeViewport,...this.props,...this.state}),this._controllerState}getCenter(e){let{x:t,y:n}=this.props,{offsetCenter:r}=e;return[r.x-t,r.y-n]}getZoomPosition(e){if(this.zoomAround===`pointer`)return e;let t=this.makeViewport(this.controllerState.getViewportProps()),[n,r]=mu(t.center,t.pixelProjectionMatrix);return[n,r]}isPointInBounds(e,t){let{width:n,height:r}=this.props;if(t&&t.handled)return!1;let i=e[0]>=0&&e[0]<=n&&e[1]>=0&&e[1]<=r;return i&&t&&t.stopPropagation(),i}isFunctionKeyPressed(e){let{srcEvent:t}=e;return!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}isDragging(){return this._interactionState.isDragging||!1}blockEvents(e){let t=setTimeout(()=>{this._eventStartBlocked===t&&(this._eventStartBlocked=null)},e);this._eventStartBlocked=t}setProps(e){e.maxBoundsPadding===void 0&&(e.maxBoundsPadding=null),e.dragMode&&(this.dragMode=e.dragMode);let t=this.props;this.props=e,`transitionInterpolator`in e||(e.transitionInterpolator=this._getTransitionProps().transitionInterpolator),this.transitionManager.processViewStateChange(e);let{inertia:n}=e;this.inertia=Number.isFinite(n)?n:n===!0?jf:0;let{scrollZoom:r=!0,dragPan:i=!0,dragRotate:a=!0,doubleClickZoom:o=!0,doubleClickDragZoom:s=!1,touchZoom:c=!0,touchRotate:l=!1,multiTouchDrag:u=l?`rotate`:null,trackpadGesture:d=!1,zoomAround:f=`pointer`,keyboard:p=!0}=e,m=!!this.onViewStateChange;if(this.toggleEvents(Ff.WHEEL,m&&r),this.toggleEvents(Ff.PAN,m),this.toggleEvents(Ff.PINCH,m&&(c||u===`rotate`)),this.toggleEvents(Ff.MULTI_PAN,m&&!!u),this.toggleEvents(Ff.DOUBLE_CLICK,m&&o),this.toggleEvents(Ff.DOUBLE_CLICK_DRAG,m&&s),this.toggleEvents(Ff.KEYBOARD,m&&p),this.scrollZoom=r,this.dragPan=i,this.dragRotate=a,this.doubleClickZoom=o,this.doubleClickDragZoom=s,this.touchZoom=c,this.touchRotate=u===`rotate`,this.multiTouchDrag=u,this.trackpadGesture=d,this.zoomAround=f,this.keyboard=p,(!t||t.height!==e.height||t.width!==e.width||t.maxBounds!==e.maxBounds||t.maxBoundsPadding!==e.maxBoundsPadding)&&e.maxBounds){let t=new this.ControllerState({...e,makeViewport:this.makeViewport}),n=t.getViewportProps();Object.keys(n).some(t=>!L(n[t],e[t],1))&&this.updateViewport(t)}}updateTransition(){this.transitionManager.updateTransition()}toggleEvents(e,t){this.eventManager&&e.forEach(e=>{this._events[e]!==t&&(this._events[e]=t,t?this.eventManager.on(e,this.handleEvent):this.eventManager.off(e,this.handleEvent))})}updateViewport(e,t=null,n={}){let r={...e.getViewportProps(),...t},i=this.controllerState!==e;if(this.state=e.getState(),this._setInteractionState(n),i){let e=this.controllerState&&this.controllerState.getViewportProps();this.onViewStateChange&&this.onViewStateChange({viewState:r,interactionState:this._interactionState,oldViewState:e,viewId:this.props.id})}}_onTransition(e){this.onViewStateChange({...e,interactionState:this._interactionState,viewId:this.props.id})}_setInteractionState(e){Object.assign(this._interactionState,e),this.onStateChange(this._interactionState)}_getConstraintContext(e,t){return this.props.rubberBand?{mode:t===`update`?`elastic`:t===`end`?`rebound`:`hard`}:{mode:`hard`}}_getReboundTransition(e,t){if(e.mode!==`rebound`)return null;let n=t.getViewportProps();return Object.keys(n).some(e=>!L(this.props[e],n[e],1))?{...this._getTransitionProps(),transitionDuration:Mf,transitionEasing:Pf}:null}_onPanStart(e){let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e)||e.rightButton||!1;(this.invertPan||this.dragMode===`pan`)&&(n=!n);let r=n?`pan`:`rotate`,i=this._getConstraintContext(r,`start`),a=n?this.controllerState.panStart({pos:t},i):this.controllerState.rotateStart({pos:t},i);return this._panMove=n,this.updateViewport(a,Af,{isDragging:!0}),!0}_onPan(e){return this.isDragging()?this._panMove?this._onPanMove(e):this._onPanRotate(e):!1}_onPanEnd(e){return this.isDragging()?this._panMove?this._onPanMoveEnd(e):this._onPanRotateEnd(e):!1}_onPanMove(e){if(!this.dragPan)return!1;let t=this.getCenter(e),n=this.controllerState.pan({pos:t},this._getConstraintContext(`pan`,`update`));return this.updateViewport(n,Af,{isDragging:!0,isPanning:!0}),!0}_onPanMoveEnd(e){let{inertia:t}=this;if(this.dragPan&&t&&e.velocity){let n=this.getCenter(e),r=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],i=this.controllerState.pan({pos:r}).panEnd();this.updateViewport(i,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:Nf},{isDragging:!1,isPanning:!0})}else{let e=this.controllerState,t=this._getConstraintContext(`pan`,`end`),n=e.panEnd(t),r=this._getReboundTransition(t,n);this.updateViewport(n,r,{isDragging:!1,isPanning:!!r})}return!0}_onPanRotate(e){if(!this.dragRotate)return!1;let t=this.getCenter(e),n=this.controllerState.rotate({pos:t},this._getConstraintContext(`rotate`,`update`));return this.updateViewport(n,Af,{isDragging:!0,isRotating:!0}),!0}_onPanRotateEnd(e){let{inertia:t}=this;if(this.dragRotate&&t&&e.velocity){let n=this.getCenter(e),r=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],i=this.controllerState.rotate({pos:r}).rotateEnd();this.updateViewport(i,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:Nf},{isDragging:!1,isRotating:!0})}else{let e=this.controllerState,t=this._getConstraintContext(`rotate`,`end`),n=e.rotateEnd(t),r=this._getReboundTransition(t,n);this.updateViewport(n,r,{isDragging:!1,isRotating:!!r})}return!0}_onWheel(e){if(!this.scrollZoom||this.trackpadGesture&&e.device!==`mouse`)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;e.srcEvent.preventDefault();let{speed:n=.01,smooth:r=!1}=this.scrollZoom===!0?{}:this.scrollZoom,{delta:i}=e,a=2/(1+Math.exp(-Math.abs(i*n)));i<0&&a!==0&&(a=1/a);let o=this.getZoomPosition(t),s=r?{...this._getTransitionProps({around:o}),transitionDuration:250}:Af,c=this.controllerState.zoom({pos:o,scale:a});return this.updateViewport(c,s,{isZooming:!0,isPanning:!0}),r||this._setInteractionState({isZooming:!1,isPanning:!1}),!0}_onMultiPanStart(e){let{multiTouchDrag:t}=this;if(!t||!this._isMultiPanEventAllowed(e,t))return!1;let n=e.offsetCenter;if(!this.isPointInBounds(this.getCenter(e),e))return!1;let r=e.pointerType===`trackpad`,i={x:n.x-(r?0:e.deltaX),y:n.y-(r?0:e.deltaY)},a={...e,offsetCenter:i},o=this.getCenter(a),s=t===`pan`?this.controllerState.panStart({pos:o},this._getConstraintContext(`pan`,`start`)):this.controllerState.rotateStart({pos:o},this._getConstraintContext(`rotate`,`start`));return this._multiPanMode=t,this._multiPanStartCenter=i,this.updateViewport(s,Af,{isDragging:!0}),!0}_onMultiPan(e){let{mode:t,event:n}=this._getMultiPanEvent(e);return!t||!n||!this.isDragging()?!1:t===`pan`?this._onPanMove(n):this._onPanRotate(n)}_onMultiPanEnd(e){let{mode:t,event:n}=this._getMultiPanEvent(e);if(!t||!n||!this.isDragging())return this._resetMultiPan(),!1;let r=t===`pan`?this._onPanMoveEnd(n):this._onPanRotateEnd(n);return this._resetMultiPan(),r}_isTrackpadGestureAllowed(e){return e.pointerType!==`trackpad`||this.trackpadGesture}_isMultiPanEventAllowed(e,t){return e.pointerType===`trackpad`?this.trackpadGesture&&(t===`pan`?this.dragPan:this.dragRotate):e.pointerType===`touch`&&(t===`pan`?this.dragPan:this.dragRotate)}_getMultiPanEvent(e){let t=this._multiPanMode,n=this._multiPanStartCenter;return!t||!n?{mode:null,event:null}:{mode:t,event:{...e,offsetCenter:{x:n.x+e.deltaX,y:n.y+e.deltaY}}}}_resetMultiPan(){this._multiPanMode=null,this._multiPanStartCenter=null}_onPinchStart(e){this._doubleClickDragAnchor=null;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.controllerState.zoomStart({pos:this.getZoomPosition(t)},this._getConstraintContext(`zoom`,`start`)).rotateStart({pos:t},this._getConstraintContext(`rotate`,`start`));return If._startPinchRotation=e.rotation,If._lastPinchEvent=e,this.updateViewport(n,Af,{isDragging:!0}),!0}_onPinch(e){if(!this.touchZoom&&!this.touchRotate||!this.isDragging())return!1;let t=this.controllerState;if(this.touchZoom){let{scale:n}=e,r=this.getCenter(e);t=t.zoom({pos:this.getZoomPosition(r),scale:n},this._getConstraintContext(`zoom`,`update`))}if(this.touchRotate){let{rotation:n}=e;t=t.rotate({deltaAngleX:If._startPinchRotation-n},this._getConstraintContext(`rotate`,`update`))}return this.updateViewport(t,Af,{isDragging:!0,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:this.touchRotate}),If._lastPinchEvent=e,!0}_onPinchEnd(e){if(!this.isDragging())return!1;let{inertia:t}=this,{_lastPinchEvent:n}=If;if(this.touchZoom&&t&&n&&e.scale!==n.scale){let r=this.getCenter(e),i=this.getZoomPosition(r),a=this.controllerState.rotateEnd(),o=Math.log2(e.scale),s=2**(o+(o-Math.log2(n.scale))/(e.deltaTime-n.deltaTime)*t/2);a=a.zoom({pos:i,scale:s}).zoomEnd(),this.updateViewport(a,{...this._getTransitionProps({around:i}),transitionDuration:t,transitionEasing:Nf},{isDragging:!1,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:!1}),this.blockEvents(t)}else{let e=this.controllerState,t=this._getConstraintContext(`zoom`,`end`),n=this._getConstraintContext(`rotate`,`end`),r=e.zoomEnd(t).rotateEnd(n),i=this._getReboundTransition(this.touchZoom?t:n,r);this.updateViewport(r,i,{isDragging:!1,isPanning:!!i&&this.touchZoom,isZooming:!!i&&this.touchZoom,isRotating:!!i&&this.touchRotate})}return If._startPinchRotation=null,If._lastPinchEvent=null,!0}_onDoubleClick(e){if(!this.doubleClickZoom||Date.now()<this._suppressDoubleClickUntil)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e),r=this.getZoomPosition(t),i=this.controllerState.zoom({pos:r,scale:n?.5:2});return this.updateViewport(i,this._getTransitionProps({around:r}),{isZooming:!0,isPanning:!0}),this.blockEvents(100),!0}_onDoubleClickDragStart(e){if(!this.doubleClickDragZoom)return this._doubleClickDragAnchor=null,!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return this._doubleClickDragAnchor=null,!1;this._doubleClickDragAnchor=this.getZoomPosition(t);let n=this.controllerState.zoomStart({pos:this._doubleClickDragAnchor},this._getConstraintContext(`zoom`,`start`));return e.scale!==1&&(n=n.zoom({pos:this._doubleClickDragAnchor,scale:e.scale},this._getConstraintContext(`zoom`,`update`))),this.updateViewport(n,Af,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDrag(e){let t=this._doubleClickDragAnchor;if(!t)return!1;let n=this.controllerState.zoom({pos:t,scale:e.scale},this._getConstraintContext(`zoom`,`update`));return this.updateViewport(n,Af,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDragEnd(e){if(!this._doubleClickDragAnchor)return!1;this._doubleClickDragAnchor=null;let t=this.controllerState,n=this._getConstraintContext(`zoom`,`end`),r=t.zoomEnd(n),i=this._getReboundTransition(n,r);return this.updateViewport(r,i,{isDragging:!1,isPanning:!!i,isZooming:!!i}),this._suppressDoubleClickUntil=Date.now()+100,this.blockEvents(100),!0}_onKeyDown(e){if(!this.keyboard)return!1;let t=this.isFunctionKeyPressed(e),{zoomSpeed:n,moveSpeed:r,rotateSpeedX:i,rotateSpeedY:a}=this.keyboard===!0?{}:this.keyboard,{controllerState:o}=this,s,c={};switch(e.srcEvent.code){case`Minus`:s=t?o.zoomOut(n).zoomOut(n):o.zoomOut(n),c.isZooming=!0;break;case`Equal`:s=t?o.zoomIn(n).zoomIn(n):o.zoomIn(n),c.isZooming=!0;break;case`ArrowLeft`:t?(s=o.rotateLeft(i),c.isRotating=!0):(s=o.moveLeft(r),c.isPanning=!0);break;case`ArrowRight`:t?(s=o.rotateRight(i),c.isRotating=!0):(s=o.moveRight(r),c.isPanning=!0);break;case`ArrowUp`:t?(s=o.rotateUp(a),c.isRotating=!0):(s=o.moveUp(r),c.isPanning=!0);break;case`ArrowDown`:t?(s=o.rotateDown(a),c.isRotating=!0):(s=o.moveDown(r),c.isPanning=!0);break;default:return!1}return this.updateViewport(s,this._getTransitionProps(),c),!0}_getTransitionProps(e){let{transition:t}=this;return!t||!t.transitionInterpolator?Af:e?{...t,transitionInterpolator:new kf({...e,...t.transitionInterpolator.opts,makeViewport:this.controllerState.makeViewport})}:t}},Rf=Symbol(`constraintAround`),zf=class{constructor(e,t,n,r){this.makeViewport=n,this._viewportProps=this.applyConstraints(e,r),this._state=t}getViewportProps(){return this._viewportProps}getState(){return this._state}};function Bf(e,t,n){let r=e-t;return r&&Number.isFinite(r)?t+r*n/(n+Math.abs(r)):t}function Vf(e,t,n){let r=lf(sf(n?.left??0),e),i=lf(sf(n?.right??0),e),a=lf(sf(n?.top??0),t),o=lf(sf(n?.bottom??0),t);return{x:r,y:a,width:e-r-i,height:t-a-o}}function Hf(e,t,n){let[r,i]=e.project(t);return r=Number.isFinite(r)?r:e.width/2,i=Number.isFinite(i)?i:e.height/2,{left:r-n.x,right:n.x+n.width-r,top:i-n.y,bottom:n.y+n.height-i}}var Uf=5,Wf=1.2,Gf=512,Kf=[[-1/0,-90],[1/0,90]],qf=1;function Jf([e,t]){if(Math.abs(t)>90&&(t=Math.sign(t)*90),Number.isFinite(e)){let[n,r]=iu([e,t]);return[n,O(r,0,Gf)]}let[,n]=iu([0,t]);return[e,O(n,0,Gf)]}var Yf=class extends zf{constructor(e){let{width:t,height:n,latitude:r,longitude:i,zoom:a,bearing:o=0,pitch:s=0,altitude:c=1.5,position:l=[0,0,0],maxZoom:u=20,minZoom:d=0,maxPitch:f=60,minPitch:p=0,startPanLngLat:m,startZoomLngLat:h,startRotatePos:g,startRotateLngLat:_,startBearing:v,startPitch:y,startZoom:b,normalize:x=!0,rubberBand:S=!1}=e,{[Rf]:C}=e;R(Number.isFinite(i)),R(Number.isFinite(r)),R(Number.isFinite(a));let ee=e.maxBounds||(x?Kf:null),w=e.maxBoundsPadding||null;super({width:t,height:n,latitude:r,longitude:i,zoom:a,bearing:o,pitch:s,altitude:c,maxZoom:u,minZoom:d,maxPitch:f,minPitch:p,normalize:x,position:l,maxBounds:ee,maxBoundsPadding:w,rubberBand:S,[Rf]:C},{startPanLngLat:m,startZoomLngLat:h,startRotatePos:g,startRotateLngLat:_,startBearing:v,startPitch:y,startZoom:b},e.makeViewport,e.constraintContext),this.getAltitude=e.getAltitude}panStart({pos:e},t){return this._getUpdatedState({startPanLngLat:this._unproject(e)},t)}pan({pos:e,startPos:t},n){let r=this.getState().startPanLngLat||this._unproject(t);if(!r)return this;let i=this.makeViewport(this.getViewportProps()).panByPosition(r,e);return this._getUpdatedState(i,n)}panEnd(e){return this._getUpdatedState({startPanLngLat:null},e)}rotateStart({pos:e}){let t=this.getAltitude?.(e);return this._getUpdatedState({startRotatePos:e,startRotateLngLat:t===void 0?void 0:this._unproject3D(e,t),startBearing:this.getViewportProps().bearing,startPitch:this.getViewportProps().pitch})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:n=0}){let{startRotatePos:r,startRotateLngLat:i,startBearing:a,startPitch:o}=this.getState();if(!r||a===void 0||o===void 0)return this;let s;if(s=e?this._getNewRotation(e,r,o,a):{bearing:a+t,pitch:o+n},i){let e=this.makeViewport({...this.getViewportProps(),...s}),t=`panByPosition3D`in e?`panByPosition3D`:`panByPosition`;return this._getUpdatedState({...s,...e[t](i,r)})}return this._getUpdatedState(s)}rotateEnd(){return this._getUpdatedState({startRotatePos:null,startRotateLngLat:null,startBearing:null,startPitch:null})}zoomStart({pos:e},t){return this._getUpdatedState({startZoomLngLat:this._unproject(e),startZoom:this.getViewportProps().zoom},t)}zoom({pos:e,startPos:t,scale:n},r){let{startZoom:i,startZoomLngLat:a}=this.getState();return a||=(i=this.getViewportProps().zoom,this._unproject(t)||this._unproject(e)),a?this._getUpdatedState({zoom:i+Math.log2(n),[Rf]:{position:a,screenPosition:e}},r):this}zoomEnd(e){return this._getUpdatedState({startZoomLngLat:null,startZoom:null},e)}zoomIn(e=2,t){return this._zoomFromCenter(e,t)}zoomOut(e=2,t){return this._zoomFromCenter(1/e,t)}moveLeft(e=100,t){return this._panFromCenter([e,0],t)}moveRight(e=100,t){return this._panFromCenter([-e,0],t)}moveUp(e=100,t){return this._panFromCenter([0,e],t)}moveDown(e=100,t){return this._panFromCenter([0,-e],t)}rotateLeft(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing-e})}rotateRight(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing+e})}rotateUp(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch+e})}rotateDown(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch-e})}shortestPathFrom(e){let t=e.getViewportProps(),n={...this.getViewportProps()},{bearing:r,longitude:i}=n;return Math.abs(r-t.bearing)>180&&(n.bearing=r<0?r+360:r-360),Math.abs(i-t.longitude)>180&&(n.longitude=i<0?i+360:i-360),n}applyConstraints(e,t){let n=e,r=n[Rf];delete n[Rf];let{maxPitch:i,minPitch:a,pitch:o,bearing:s,normalize:c,maxBounds:l,rubberBand:u}=e;c&&(s<-180||s>180)&&(e.bearing=gd(s+180,360)-180),e.pitch=O(o,a,i);let d=this._constrainZoom(e.zoom,e),f=u&&t?.mode===`elastic`;if(e.zoom=t?.mode===`preserve`?e.zoom:f?Bf(e.zoom,d,qf):d,r){let t=this.makeViewport(e);Object.assign(e,t.panByPosition(r.position,r.screenPosition))}if(c&&(e.longitude<-180||e.longitude>180)&&(e.longitude=gd(e.longitude+180,360)-180),l){let n=Vf(e.width,e.height,e.maxBoundsPadding),r=Hf(this.makeViewport({...e,bearing:0,pitch:0}),[e.longitude,e.latitude],n),i=Jf(l[0]),a=Jf(l[1]),o=2**e.zoom,s=[i[0]+r.left/o,i[1]+r.bottom/o],c=[a[0]-r.right/o,a[1]-r.top/o],u=Jf([e.longitude,e.latitude]),d=[O(u[0],s[0],c[0]),O(u[1],s[1],c[1])],p=u.slice();if(n.width>=0&&(p[0]=t?.mode===`preserve`?u[0]:f?Bf(u[0],d[0],n.width/2/o):d[0]),n.height>=0&&(p[1]=t?.mode===`preserve`?u[1]:f?Bf(u[1],d[1],n.height/2/o):d[1]),p[0]!==u[0]||p[1]!==u[1]){let[t,n]=au(p);p[0]!==u[0]&&(e.longitude=t),p[1]!==u[1]&&(e.latitude=n)}}return e}_constrainZoom(e,t){t||=this.getViewportProps();let{maxZoom:n,maxBounds:r}=t,i=r!==null&&t.width>0&&t.height>0,{minZoom:a}=t;if(i){let e=Vf(t.width,t.height,t.maxBoundsPadding),i=Jf(r[0]),o=Jf(r[1]),s=o[0]-i[0],c=o[1]-i[1];e.width>0&&Number.isFinite(s)&&s>0&&(a=Math.max(a,Math.log2(e.width/s))),e.height>0&&Number.isFinite(c)&&c>0&&(a=Math.max(a,Math.log2(e.height/c))),a>n&&(a=n)}return O(e,a,n)}_zoomFromCenter(e,t){let{width:n,height:r}=this.getViewportProps();return this.zoom({pos:[n/2,r/2],scale:e},t)}_panFromCenter(e,t){let{width:n,height:r}=this.getViewportProps();return this.pan({startPos:[n/2,r/2],pos:[n/2+e[0],r/2+e[1]]},t)}_getUpdatedState(e,t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e,constraintContext:t})}_unproject(e){let t=this.makeViewport(this.getViewportProps());return e&&t.unproject(e)}_unproject3D(e,t){return this.makeViewport(this.getViewportProps()).unproject(e,{targetZ:t})}_getNewRotation(e,t,n,r){let i=e[0]-t[0],a=e[1]-t[1],o=e[1],s=t[1],{width:c,height:l}=this.getViewportProps(),u=i/c,d=0;a>0?Math.abs(l-s)>Uf&&(d=a/(s-l)*Wf):a<0&&s>Uf&&(d=1-o/s),d=O(d,-1,1);let{minPitch:f,maxPitch:p}=this.getViewportProps(),m=r+180*u,h=n;return d>0?h=n+d*(p-n):d<0&&(h=n-d*(f-n)),{pitch:h,bearing:m}}},Xf=class extends Lf{constructor(){super(...arguments),this.ControllerState=Yf,this.transition={transitionDuration:300,transitionInterpolator:new kf({transitionProps:{compare:[`longitude`,`latitude`,`zoom`,`bearing`,`pitch`,`position`],required:[`longitude`,`latitude`,`zoom`]}})},this.dragMode=`pan`,this.rotationPivot=`center`,this._getAltitude=e=>{if(this.rotationPivot===`2d`)return 0;if(this.rotationPivot===`3d`&&this.pickPosition){let{x:t,y:n}=this.props,r=this.pickPosition(t+e[0],n+e[1]);if(r&&r.coordinate&&r.coordinate.length>=3)return r.coordinate[2]}}}setProps(e){`rotationPivot`in e&&(this.rotationPivot=e.rotationPivot||`center`),e.getAltitude=this._getAltitude,e.position=e.position||[0,0,0],e.maxBounds=e.maxBounds||(e.normalize===!1?null:Kf),super.setProps(e)}updateViewport(e,t=null,n={}){let r=e.getState();n.isDragging&&r.startRotateLngLat?n={...n,rotationPivotPosition:r.startRotateLngLat}:n.isDragging===!1&&(n={...n,rotationPivotPosition:void 0}),super.updateViewport(e,t,n)}},Zf=class extends _f{constructor(e={}){super(e)}getViewportType(){return Md}get ControllerType(){return Xf}};Zf.displayName=`MapView`;var Qf=new pd;function $f(e,t){return(e.order??1/0)-(t.order??1/0)}var ep=class{constructor(e){this._resolvedEffects=[],this._defaultEffects=[],this.effects=[],this._context=e,this._needsRedraw=`Initial render`,this._setEffects([])}addDefaultEffect(e){let t=this._defaultEffects;if(!t.find(t=>t.id===e.id)){let n=t.findIndex(t=>$f(t,e)>0);n<0?t.push(e):t.splice(n,0,e),e.setup(this._context),this._setEffects(this.effects)}}setProps(e){`effects`in e&&(L(e.effects,this.effects,1)||this._setEffects(e.effects))}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}getEffects(){return this._resolvedEffects}_setEffects(e){let t={};for(let e of this.effects)t[e.id]=e;let n=[];for(let r of e){let e=t[r.id],i=r;e&&e!==r?e.setProps?(e.setProps(r.props),i=e):e.cleanup(this._context):e||r.setup(this._context),n.push(i),delete t[r.id]}for(let e in t)t[e].cleanup(this._context);this.effects=n,this._resolvedEffects=n.concat(this._defaultEffects),e.some(e=>e instanceof pd)||this._resolvedEffects.push(Qf),this._needsRedraw=`effects changed`}finalize(){for(let e of this._resolvedEffects)e.cleanup(this._context);this.effects.length=0,this._resolvedEffects.length=0,this._defaultEffects.length=0}},tp=class extends ad{shouldDrawLayer(e){let{operation:t}=e.props;return t.includes(`draw`)||t.includes(`terrain`)}render(e){return this._render(e)}},np=`deckRenderer.renderLayers`,rp=class{constructor(e,t={}){this.device=e,this.stats=t.stats,this.layerFilter=null,this.drawPickingColors=!1,this.drawLayersPass=new tp(e),this.pickLayersPass=new zd(e),this.renderCount=0,this._needsRedraw=`Initial render`,this.renderBuffers=[],this.lastPostProcessEffect=null}setProps(e){this.layerFilter!==e.layerFilter&&(this.layerFilter=e.layerFilter,this._needsRedraw=`layerFilter changed`),this.drawPickingColors!==e.drawPickingColors&&(this.drawPickingColors=e.drawPickingColors,this._needsRedraw=`drawPickingColors changed`)}renderLayers(e){let t=this.drawPickingColors?this.pickLayersPass:this.drawLayersPass,n={layerFilter:this.layerFilter,isPicking:this.drawPickingColors,...e};if(!e.viewports.length){let e=t.render(n),r=`stats`in e?e.stats:e;this._updateStats(r);return}n.effects&&this._preRender(n.effects,n);let r=this.lastPostProcessEffect?this.renderBuffers[0]:n.target;this.lastPostProcessEffect&&(n.clearColor=[0,0,0,0],n.clearCanvas=!0);let i=t.render({...n,target:r}),a=`stats`in i?i.stats:i;n.effects&&(this.lastPostProcessEffect&&(n.clearCanvas=e.clearCanvas===void 0?!0:e.clearCanvas),this._postRender(n.effects,n)),this.renderCount++,M(np,this,a,e),this._updateStats(a)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}finalize(){let{renderBuffers:e}=this;for(let t of e)t.delete();e.length=0}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get(`Layers rendered`).addCount(t)}_preRender(e,t){this.lastPostProcessEffect=null,t.preRenderStats=t.preRenderStats||{};for(let n of e)t.preRenderStats[n.id]=n.preRender(t),n.postRender&&(this.lastPostProcessEffect=n.id);this.lastPostProcessEffect&&this._resizeRenderBuffers(t.canvasContext)}_resizeRenderBuffers(e=this.device.canvasContext){let{renderBuffers:t}=this,n=e.getDrawingBufferSize(),[r,i]=n;t.length===0&&[0,1].map(e=>{let n=this.device.createTexture({sampler:{minFilter:`linear`,magFilter:`linear`},width:r,height:i});t.push(this.device.createFramebuffer({id:`deck-renderbuffer-${e}`,depthStencilAttachment:e===0?`depth24plus`:void 0,colorAttachments:[n]}))});for(let e of t)e.resize(n)}_postRender(e,t){let{renderBuffers:n}=this,r=t.target??t.canvasContext?.getCurrentFramebuffer()??t.target,i={...t,inputBuffer:n[0],swapBuffer:n[1]};for(let t of e)if(t.postRender){i.target=t.id===this.lastPostProcessEffect?r:void 0;let e=t.postRender(i);i.inputBuffer=e,i.swapBuffer=e===n[0]?n[1]:n[0]}}},ip={pickedColor:null,pickedObjectIndex:-1};function ap({pickedColors:e,decodePickingColor:t,deviceX:n,deviceY:r,deviceRadius:i,deviceRect:a}){let{x:o,y:s,width:c,height:l}=a,u=i*i,d=-1,f=0;for(let t=0;t<l;t++){let i=t+s-r,a=i*i;if(a>u)f+=4*c;else for(let t=0;t<c;t++){if(e[f+3]-1>=0){let e=t+o-n,r=e*e+a;r<=u&&(u=r,d=f)}f+=4}}if(d>=0){let n=e.slice(d,d+4),r=t(n);if(r){let e=Math.floor(d/4/c),t=d/4-e*c;return{...r,pickedColor:n,pickedX:o+t,pickedY:s+e}}j.error(`Picked non-existent layer. Is picking buffer corrupt?`)()}return ip}function op({pickedColors:e,decodePickingColor:t}){let n=new Map;if(e){for(let r=0;r<e.length;r+=4)if(e[r+3]-1>=0){let i=e.slice(r,r+4),a=i.join(`,`);if(!n.has(a)){let e=t(i);e?n.set(a,{...e,color:i}):j.error(`Picked non-existent layer. Is picking buffer corrupt?`)()}}}return Array.from(n.values())}function sp({pickInfo:e,viewports:t,pixelRatio:n,x:r,y:i,z:a}){let o=t[0];t.length>1&&(o=up(e?.pickedViewports||t,{x:r,y:i}));let s;if(o){let e=[r-o.x,i-o.y];a!==void 0&&(e[2]=a),s=o.unproject(e)}return{color:null,layer:null,viewport:o,index:-1,picked:!1,x:r,y:i,pixel:[r,i],coordinate:s,devicePixel:e&&`pickedX`in e?[e.pickedX,e.pickedY]:void 0,pixelRatio:n}}function cp(e){let{pickInfo:t,lastPickedInfo:n,mode:r,layers:i}=e,{pickedColor:a,pickedLayer:o,pickedObjectIndex:s}=t,c=o?[o]:[];if(r===`hover`){let e=n.index,t=n.layerId,r=o?o.props.id:null;if(r!==t||s!==e){if(r!==t){let e=i.find(e=>e.props.id===t);e&&c.unshift(e)}n.layerId=r,n.index=s,n.info=null}}let l=sp(e),u=new Map;return u.set(null,l),c.forEach(e=>{let t={...l};e===o&&(t.color=a,t.index=s,t.picked=!0),t=lp({layer:e,info:t,mode:r});let i=t.layer;e===o&&r===`hover`&&(n.info=t),u.set(i.id,t),r===`hover`&&i.updateAutoHighlight(t)}),u}function lp({layer:e,info:t,mode:n}){for(;e&&t;){let r=t.layer||null;t.sourceLayer=r,t.layer=e,t=e.getPickingInfo({info:t,mode:n,sourceLayer:r}),e=e.parent}return t}function up(e,t){for(let n=e.length-1;n>=0;n--){let r=e[n];if(r.containsPixel(t))return r}return e[0]}var dp=class{constructor(e,t={}){this._pickable=!0,this.device=e,this.stats=t.stats,this.pickLayersPass=new zd(e),this.lastPickedInfo={index:-1,layerId:null,info:null}}setProps(e){`layerFilter`in e&&(this.layerFilter=e.layerFilter),`_pickable`in e&&(this._pickable=e._pickable)}finalize(){this.pickingFBO&&this.pickingFBO.destroy(),this.depthFBO&&this.depthFBO.destroy()}pickObjectAsync(e){return this._pickClosestObjectAsync(e)}pickObjectsAsync(e){return this._pickVisibleObjectsAsync(e)}pickObject(e){return this._pickClosestObject(e)}pickObjects(e){return this._pickVisibleObjects(e)}getLastPickedObject({x:e,y:t,layers:n,viewports:r},i=this.lastPickedInfo.info){let a=i&&i.layer&&i.layer.id,o=i&&i.viewport&&i.viewport.id,s=a?n.find(e=>e.id===a):null,c=o&&r.find(e=>e.id===o)||r[0],l={x:e,y:t,viewport:c,coordinate:c&&c.unproject([e-c.x,t-c.y]),layer:s};return{...i,...l}}_resizeBuffer(e=this.device.getDefaultCanvasContext()){if(!this.pickingFBO){let e=this.device.createTexture({format:`rgba8unorm`,width:1,height:1,usage:g.RENDER_ATTACHMENT|g.COPY_SRC});if(this.pickingFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:`depth16unorm`}),this.device.isTextureFormatRenderable(`rgba32float`)){let e=this.device.createTexture({format:`rgba32float`,width:1,height:1,usage:g.RENDER_ATTACHMENT|g.COPY_SRC});this.depthFBO=this.device.createFramebuffer({colorAttachments:[e],depthStencilAttachment:`depth16unorm`})}}let[t,n]=e.getDrawingBufferSize();this.pickingFBO?.resize({width:t,height:n}),this.depthFBO?.resize({width:t,height:n})}_getPickable(e){if(this._pickable===!1)return null;let t=e.filter(e=>this.pickLayersPass.shouldDrawLayer(e)&&!e.isComposite);return t.length?t:null}async _pickClosestObjectAsync({layers:e,views:t,viewports:n,x:r,y:i,radius:a=0,depth:o=1,mode:s=`query`,unproject3D:c,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=l.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0){let t=cp({pickInfo:{pickedColor:null,pickedObjectIndex:-1},lastPickedInfo:this.lastPickedInfo,mode:s,layers:e,viewports:n,x:r,y:i,pixelRatio:f});return{result:Array.from(t.values()).filter(e=>e.layer),emptyInfo:sp({viewports:n,x:r,y:i,pixelRatio:f})}}this._resizeBuffer(l);let m=l.cssToDevicePixels([r,i],!0),h=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],g=Math.round(a*f),{width:_,height:v}=this.pickingFBO,y=this._getPickingRect({deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceWidth:_,deviceHeight:v}),b={x:r-a,y:i-a,width:a*2+1,height:a*2+1},x,S=[],C=new Set;for(let e=0;e<o;e++){let a;a=y?ap({...await this._drawAndSampleAsync({layers:p,views:t,viewports:n,onViewportActive:u,deviceRect:y,cullRect:b,effects:d,pass:`picking:${s}`,canvasContext:l}),deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceRect:y}):{pickedColor:null,pickedObjectIndex:-1};let m,_=this._getDepthLayers(a,p,c);if(_.length>0){let{pickedColors:e}=await this._drawAndSampleAsync({layers:_,views:t,viewports:n,onViewportActive:u,deviceRect:{x:a.pickedX??h[0],y:a.pickedY??h[1],width:1,height:1},cullRect:b,effects:d,pass:`picking:${s}:z`,canvasContext:l},!0);e[3]&&(m=e[0])}a.pickedLayer&&e+1<o&&(C.add(a.pickedLayer),a.pickedLayer.disablePickingIndex(a.pickedObjectIndex)),x=cp({pickInfo:a,lastPickedInfo:this.lastPickedInfo,mode:s,layers:p,viewports:n,x:r,y:i,z:m,pixelRatio:f});for(let e of x.values())e.layer&&S.push(e);if(!a.pickedColor)break}for(let e of C)e.restorePickingColors();return{result:S,emptyInfo:x.get(null)}}_pickClosestObject({layers:e,views:t,viewports:n,x:r,y:i,radius:a=0,depth:o=1,mode:s=`query`,unproject3D:c,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=l.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0){let t=cp({pickInfo:{pickedColor:null,pickedObjectIndex:-1},lastPickedInfo:this.lastPickedInfo,mode:s,layers:e,viewports:n,x:r,y:i,pixelRatio:f});return{result:Array.from(t.values()).filter(e=>e.layer),emptyInfo:sp({viewports:n,x:r,y:i,pixelRatio:f})}}this._resizeBuffer(l);let m=l.cssToDevicePixels([r,i],!0),h=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],g=Math.round(a*f),{width:_,height:v}=this.pickingFBO,y=this._getPickingRect({deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceWidth:_,deviceHeight:v}),b={x:r-a,y:i-a,width:a*2+1,height:a*2+1},x,S=[],C=new Set;for(let e=0;e<o;e++){let a;a=y?ap({...this._drawAndSample({layers:p,views:t,viewports:n,onViewportActive:u,deviceRect:y,cullRect:b,effects:d,pass:`picking:${s}`,canvasContext:l}),deviceX:h[0],deviceY:h[1],deviceRadius:g,deviceRect:y}):{pickedColor:null,pickedObjectIndex:-1};let m,_=this._getDepthLayers(a,p,c);if(_.length>0){let{pickedColors:e}=this._drawAndSample({layers:_,views:t,viewports:n,onViewportActive:u,deviceRect:{x:a.pickedX??h[0],y:a.pickedY??h[1],width:1,height:1},cullRect:b,effects:d,pass:`picking:${s}:z`,canvasContext:l},!0);e[3]&&(m=e[0])}a.pickedLayer&&e+1<o&&(C.add(a.pickedLayer),a.pickedLayer.disablePickingIndex(a.pickedObjectIndex)),x=cp({pickInfo:a,lastPickedInfo:this.lastPickedInfo,mode:s,layers:p,viewports:n,x:r,y:i,z:m,pixelRatio:f});for(let e of x.values())e.layer&&S.push(e);if(!a.pickedColor)break}for(let e of C)e.restorePickingColors();return{result:S,emptyInfo:x.get(null)}}async _pickVisibleObjectsAsync({layers:e,views:t,viewports:n,x:r,y:i,width:a=1,height:o=1,mode:s=`query`,maxObjects:c=null,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=this._getPickable(e);if(!f||n.length===0)return[];this._resizeBuffer(l);let p=l.cssToDeviceRatio(),m=l.cssToDevicePixels([r,i],!0),h=m.x,g=m.y+m.height,_=l.cssToDevicePixels([r+a,i+o],!0),v=_.x+_.width,y=_.y,b={x:h,y,width:v-h,height:g-y},x=op(await this._drawAndSampleAsync({layers:f,views:t,viewports:n,onViewportActive:u,deviceRect:b,cullRect:{x:r,y:i,width:a,height:o},effects:d,pass:`picking:${s}`,canvasContext:l})),S=new Map,C=[],ee=Number.isFinite(c);for(let e=0;e<x.length&&!(ee&&C.length>=c);e++){let t=x[e],n={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:i,pixelRatio:p};n=lp({layer:t.pickedLayer,info:n,mode:s});let a=n.layer.id;S.has(a)||S.set(a,new Set);let o=S.get(a),c=n.object??n.index;o.has(c)||(o.add(c),C.push(n))}return C}_pickVisibleObjects({layers:e,views:t,viewports:n,x:r,y:i,width:a=1,height:o=1,mode:s=`query`,maxObjects:c=null,canvasContext:l=this.device.getDefaultCanvasContext(),onViewportActive:u,effects:d}){let f=this._getPickable(e);if(!f||n.length===0)return[];this._resizeBuffer(l);let p=l.cssToDeviceRatio(),m=l.cssToDevicePixels([r,i],!0),h=m.x,g=m.y+m.height,_=l.cssToDevicePixels([r+a,i+o],!0),v=_.x+_.width,y=_.y,b={x:h,y,width:v-h,height:g-y},x=op(this._drawAndSample({layers:f,views:t,viewports:n,onViewportActive:u,deviceRect:b,cullRect:{x:r,y:i,width:a,height:o},effects:d,pass:`picking:${s}`,canvasContext:l})),S=new Map,C=[],ee=Number.isFinite(c);for(let e=0;e<x.length&&!(ee&&C.length>=c);e++){let t=x[e],n={color:t.pickedColor,layer:null,index:t.pickedObjectIndex,picked:!0,x:r,y:i,pixelRatio:p};n=lp({layer:t.pickedLayer,info:n,mode:s});let a=n.layer.id;S.has(a)||S.set(a,new Set);let o=S.get(a),c=n.object??n.index;o.has(c)||(o.add(c),C.push(n))}return C}async _drawAndSampleAsync({layers:e,views:t,viewports:n,onViewportActive:r,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c},l=!1){let u=l?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:r,pickingFBO:u,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c,pickZ:l,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(d.preRenderStats[e.id]=e.preRender(d));let{decodePickingColor:f,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:h,width:g,height:_}=i,v=u.colorAttachments[0]?.texture;if(!v)throw Error(`Picking framebuffer color attachment is missing`);let y=await this._readTextureDataAsync(v,{x:m,y:h,width:g,height:_},l?Float32Array:Uint8Array);if(!l){let e=!1;for(let t=3;t<y.length;t+=4)if(y[t]!==0){e=!0;break}!e&&y.length>0&&j.warn(`Async pick readback returned only zero alpha values`,{deviceRect:i,bytes:Array.from(y.subarray(0,Math.min(y.length,16)))})()}return{pickedColors:y,decodePickingColor:f}}async _readTextureDataAsync(e,t,n){let{width:r,height:a}=t,o=e.computeMemoryLayout(t),s=this.device.createBuffer({byteLength:o.byteLength,usage:i.COPY_DST|i.MAP_READ});try{let i=this.device.type===`webgpu`?{...t,y:e.height-t.y-a}:t;e.readBuffer(i,s);let c=await s.readAsync(0,o.byteLength),l=n.BYTES_PER_ELEMENT;if(o.bytesPerRow%l!==0)throw Error(`Texture readback row stride ${o.bytesPerRow} is not aligned to ${l}-byte elements.`);let u=new n(c.buffer,c.byteOffset,o.byteLength/l),d=r*4,f=o.bytesPerRow/l;if(f<d)throw Error(`Texture readback row stride ${f} is smaller than packed row length ${d}.`);let p=new n(r*a*4);for(let e=0;e<a;e++){let t=(this.device.type===`webgpu`?a-e-1:e)*f;p.set(u.subarray(t,t+d),e*d)}return p}finally{s.destroy()}}_drawAndSample({layers:e,views:t,viewports:n,onViewportActive:r,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c},l=!1){let u=l?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:r,pickingFBO:u,deviceRect:i,cullRect:a,effects:o,pass:s,canvasContext:c,pickZ:l,preRenderStats:{},isPicking:!0};for(let e of o)e.useInPicking&&(d.preRenderStats[e.id]=e.preRender(d));let{decodePickingColor:f,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:h,width:g,height:_}=i,v=new(l?Float32Array:Uint8Array)(g*_*4);return this.device.readPixelsToArrayWebGL(u,{sourceX:m,sourceY:h,sourceWidth:g,sourceHeight:_,target:v}),{pickedColors:v,decodePickingColor:f}}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get(`Layers picked`).addCount(t)}_getDepthLayers(e,t,n){if(!n||!this.depthFBO)return[];let{pickedLayer:r}=e,i=r?.state?.terrainDrawMode===`drape`;return r&&!i?[r]:t.filter(e=>e.props.operation.includes(`terrain`))}_getPickingRect({deviceX:e,deviceY:t,deviceRadius:n,deviceWidth:r,deviceHeight:i}){let a=Math.max(0,e-n),o=Math.max(0,t-n),s=Math.min(r,e+n+1)-a,c=Math.min(i,t+n+1)-o;return s<=0||c<=0?null:{x:a,y:o,width:s,height:c}}},fp={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},pp=`top-left`,mp=`root`,hp=class{constructor({deck:e,parentElement:t}){this.defaultWidgets=[],this.widgets=[],this.resolvedWidgets=[],this.containers={},this.lastViewports={},this.deck=e,t?.classList.add(`deck-widget-container`),this.parentElement=t}getWidgets(){return this.resolvedWidgets}setProps(e){if(e.widgets&&!L(e.widgets,this.widgets,1)){let t=e.widgets.filter(Boolean);this._setWidgets(t)}}finalize(){for(let e of this.getWidgets())this._removeWidget(e);this.defaultWidgets.length=0,this.resolvedWidgets.length=0;for(let e in this.containers)this.containers[e].remove()}addDefault(e){this.defaultWidgets.find(t=>t.id===e.id)||(this._addWidget(e),this.defaultWidgets.push(e),this._setWidgets(this.widgets))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getWidgets()){let{viewId:i}=r;if(i){let e=n[i];e&&(r.onViewportChange&&r.onViewportChange(e),r.onRedraw?.({viewports:[e],layers:t}))}else{if(r.onViewportChange)for(let t of e)r.onViewportChange(t);r.onRedraw?.({viewports:e,layers:t})}}this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getWidgets()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}getCanvasBounds(e){let t=(this.deck?.getCanvas?.())?.getBoundingClientRect(),n=this.parentElement?.getBoundingClientRect(),r=this.deck?.getCanvasContext?.(e?.id);if(r&&n){r.updatePosition();let[e,t]=r.getPosition(),[i,a]=r.getCSSSize();return{x:e-n.left,y:t-n.top,width:i,height:a}}return{x:t&&n?t.left-n.left:0,y:t&&n?t.top-n.top:0,width:t?.width||this.deck?.width||0,height:t?.height||this.deck?.height||0}}onEvent(e,t){let n=xl[t.type];if(n)for(let r of this.getWidgets()){let{viewId:i}=r;(!i||i===e.viewport?.id)&&r[n]?.(e,t)}}_setWidgets(e){let t={};for(let e of this.resolvedWidgets)t[e.id]=e;this.resolvedWidgets.length=0;for(let e of this.defaultWidgets)t[e.id]=null,this.resolvedWidgets.push(e);for(let n of e){let e=t[n.id];e?e.viewId!==n.viewId||e.placement!==n.placement?(this._removeWidget(e),this._addWidget(n)):n!==e&&(e.setProps(n.props),n=e):this._addWidget(n),t[n.id]=null,this.resolvedWidgets.push(n)}for(let e in t){let n=t[e];n&&this._removeWidget(n)}this.widgets=e}_addWidget(e){let{viewId:t=null,placement:n=pp}=e,r=e.props._container??t;e.widgetManager=this,e.deck=this.deck,e.rootElement=e._onAdd({deck:this.deck,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeWidget(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.widgetManager=void 0}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=e||mp,r=this.containers[n];r||(r=document.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,this.parentElement?.append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=globalThis.document.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,fp[t]),r.append(i)),i}_updateContainers(){for(let e in this.containers){let t=this.lastViewports[e]||null,n=e===mp||t,r=this.containers[e];if(n){let e=this._getContainerBounds(t);r.style.display=`block`,r.style.left=`${e.x}px`,r.style.top=`${e.y}px`,r.style.width=`${e.width}px`,r.style.height=`${e.height}px`}else r.style.display=`none`}}_getContainerBounds(e){if(!e)return{x:0,y:0,width:this.parentElement?.clientWidth||this.deck.width,height:this.parentElement?.clientHeight||this.deck.height};let t=this.getCanvasBounds(e);return{x:t.x+e.x,y:t.y+e.y,width:e.width,height:e.height}}};function gp(e,t){t&&Object.entries(t).map(([t,n])=>{t.startsWith(`--`)?e.style.setProperty(t,n):e.style[t]=n})}function _p(e,t){t&&Object.keys(t).map(t=>{t.startsWith(`--`)?e.style.removeProperty(t):e.style[t]=``})}var vp=class{constructor(e){this.viewId=null,this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n=this.rootElement;n&&t.className!==e.className&&(t.className&&n.classList.remove(t.className),e.className&&n.classList.add(e.className)),n&&!L(t.style,e.style,1)&&(_p(n,t.style),gp(n,e.style)),Object.assign(this.props,e),this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}get viewIds(){return this.viewId?[this.viewId]:this.deck?.getViews().map(e=>e.id)??[]}getViewState(e){return this.deck?.viewManager?.getViewState(e)||{}}setViewState(e,t){this.deck?._onViewStateChange({viewId:e,viewState:t,interactionState:{}})}onCreateRootElement(){let e=[`deck-widget`,this.className,this.props.className],t=document.createElement(`div`);return e.filter(e=>typeof e==`string`&&e.length>0).forEach(e=>t.classList.add(e)),gp(t,this.props.style),t}_onAdd(e){return this.onAdd(e)??this.onCreateRootElement()}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};vp.defaultProps={id:`widget`,style:{},_container:null,className:``};var yp={zIndex:`1`,position:`absolute`,pointerEvents:`none`,color:`#a0a7b4`,backgroundColor:`#29323c`,padding:`10px`,top:`0`,left:`0`,display:`none`},bp=class extends vp{constructor(e={}){super(e),this.id=`default-tooltip`,this.placement=`fill`,this.className=`deck-tooltip`,this.isVisible=!1,this.setProps(e)}onCreateRootElement(){let e=document.createElement(`div`);return e.className=this.className,Object.assign(e.style,yp),e}onRenderHTML(e){}onViewportChange(e){this.isVisible&&e.id===this.lastViewport?.id&&!e.equals(this.lastViewport)&&this.setTooltip(null),this.lastViewport=e}onHover(e){let{deck:t}=this,n=t&&t.props.getTooltip;if(!n)return;let r=n(e),i=this.widgetManager?.getCanvasBounds(e.viewport),a=e.x+(i?.x||0),o=e.y+(i?.y||0);this.setTooltip(r,a,o)}setTooltip(e,t,n){let r=this.rootElement;if(r){if(typeof e==`string`)r.innerText=e;else if(e)e.text&&(r.innerText=e.text),e.html&&(r.innerHTML=e.html),e.className&&(r.className=e.className);else{this.isVisible=!1,r.style.display=`none`;return}this.isVisible=!0,r.style.display=`block`,r.style.transform=`translate(${t}px, ${n}px)`,e&&typeof e==`object`&&`style`in e&&Object.assign(r.style,e.style)}}};bp.defaultProps={...vp.defaultProps};var xp=class{constructor(e){this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap,this._createEventManager=e.createEventManager,this._getEventRoot=e.getEventRoot}finalize(){for(let e of Object.values(this.targets))e.eventManager.destroy(),e.presentationContext.destroy();this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap}syncCanvasEntries(e){let t=this._normalizeCanvasList(e.canvases),n={},r=[],i=new Map;for(let{canvas:e}of t){let t=this._getEventRoot(e);i.set(t,(i.get(t)||0)+1)}for(let{id:a,canvas:o}of t){let t=this._getEventRoot(o),s=i.get(t)===1?t:o,c=this.targets[a];if(!c||c.device!==e.device||c.canvas!==o||c.eventRoot!==s){c?.eventManager.destroy(),c?.presentationContext.destroy();let t=e.device.createPresentationContext({id:a,canvas:o,useDevicePixels:e.useDevicePixels,autoResize:!0});c={id:a,device:e.device,canvas:o,eventRoot:s,presentationContext:t,eventManager:this._createEventManager(s)}}this._eventRootToCanvasId.set(s,a),this._eventRootToCanvasId.set(o,a),n[a]=c,r.push(a)}for(let[e,t]of Object.entries(this.targets))n[e]||(t.eventManager.destroy(),t.presentationContext.destroy());this.targets=n,this.order=r;let a=Object.fromEntries(Object.entries(n).map(([e,t])=>[e,t.eventManager]));this._haveSameEventManagers(a)||(this.eventManagers=a)}getCanvasIdFromEvent(e){return e?this._eventRootToCanvasId.get(e):void 0}getTarget(e){return this.targets[e||this.order[0]||`default-canvas`]||null}_normalizeCanvasList(e=[]){let t=new Set;return e.map((e,n)=>{let r,i;return typeof e==`string`?(r=document.getElementById(e),R(r,`Canvas with id ${e} not found`),i=e):(r=e,i=r.id||`deckgl-canvas-${n}`),R(!t.has(i),`Duplicate canvas id ${i}`),t.add(i),{id:i,canvas:r}})}_haveSameEventManagers(e){let t=Object.keys(e),n=Object.keys(this.eventManagers);return t.length===n.length&&t.every(t=>e[t]===this.eventManagers[t])}},Sp={WEBGL_depth_texture:{UNSIGNED_INT_24_8_WEBGL:v.UNSIGNED_INT_24_8},OES_element_index_uint:{},OES_texture_float:{},OES_texture_half_float:{HALF_FLOAT_OES:v.HALF_FLOAT},EXT_color_buffer_float:{},OES_standard_derivatives:{FRAGMENT_SHADER_DERIVATIVE_HINT_OES:v.FRAGMENT_SHADER_DERIVATIVE_HINT},EXT_frag_depth:{},EXT_blend_minmax:{MIN_EXT:v.MIN,MAX_EXT:v.MAX},EXT_shader_texture_lod:{}},Cp=e=>({drawBuffersWEBGL(t){return e.drawBuffers(t)},COLOR_ATTACHMENT0_WEBGL:v.COLOR_ATTACHMENT0,COLOR_ATTACHMENT1_WEBGL:v.COLOR_ATTACHMENT1,COLOR_ATTACHMENT2_WEBGL:v.COLOR_ATTACHMENT2,COLOR_ATTACHMENT3_WEBGL:v.COLOR_ATTACHMENT3}),wp=e=>({VERTEX_ARRAY_BINDING_OES:v.VERTEX_ARRAY_BINDING,createVertexArrayOES(){return e.createVertexArray()},deleteVertexArrayOES(t){return e.deleteVertexArray(t)},isVertexArrayOES(t){return e.isVertexArray(t)},bindVertexArrayOES(t){return e.bindVertexArray(t)}}),Tp=e=>({VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE:35070,drawArraysInstancedANGLE(...t){return e.drawArraysInstanced(...t)},drawElementsInstancedANGLE(...t){return e.drawElementsInstanced(...t)},vertexAttribDivisorANGLE(...t){return e.vertexAttribDivisor(...t)}});function Ep(e=!0){let t=HTMLCanvasElement.prototype;if(!e&&t.originalGetContext){t.getContext=t.originalGetContext,t.originalGetContext=void 0;return}t.originalGetContext=t.getContext,t.getContext=function(e,t){if(e===`webgl`||e===`experimental-webgl`){let e=this.originalGetContext(`webgl2`,t);return e instanceof HTMLElement&&Dp(e),e}return this.originalGetContext(e,t)}}function Dp(e){e.getExtension(`EXT_color_buffer_float`);let t={...Sp,WEBGL_disjoint_timer_query:e.getExtension(`EXT_disjoint_timer_query_webgl2`),WEBGL_draw_buffers:Cp(e),OES_vertex_array_object:wp(e),ANGLE_instanced_arrays:Tp(e)},n=e.getExtension.bind(e);e.getExtension=function(e){return n(e)||(e in t?t[e]:null)};let r=e.getSupportedExtensions;e.getSupportedExtensions=function(){return(r.apply(e)||[])?.concat(Object.keys(t))}}var Op=1,kp=class extends At{type=`webgl`;enforceWebGL2(e){Ep(e)}isSupported(){return typeof WebGL2RenderingContext<`u`}isDeviceHandle(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:(typeof WebGLRenderingContext<`u`&&e instanceof WebGLRenderingContext&&t.warn(`WebGL1 is not supported`,e)(),!1)}async attach(e,t={}){let{WebGLDevice:n}=await et(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-hj0FA8UE.js`);return{WebGLDevice:e}},__vite__mapDeps([0,1,2,3,4,5,6]));if(e instanceof n)return e;let r=n.getDeviceFromContext(e);if(r)return r;if(!Ap(e))throw Error(`Invalid WebGL2RenderingContext`);t=Mp(t),await Np(t);let i=t.createCanvasContext===!0?{}:t.createCanvasContext;return new n({...t,_handle:e,createCanvasContext:{canvas:e.canvas,autoResize:!1,...i}})}async create(e={}){let{WebGLDevice:n}=await et(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-hj0FA8UE.js`);return{WebGLDevice:e}},__vite__mapDeps([0,1,2,3,4,5,6]));e=Mp(e),await Np(e);try{let r=new n(e);t.groupCollapsed(Op,`WebGLDevice ${r.id} created`)();let i=`\
${r._reused?`Reusing`:`Created`} device with WebGL2 ${r.props.debug?`debug `:``}context: \
${r.info.vendor}, ${r.info.renderer} for canvas: ${r.canvasContext.id}`;return t.probe(Op,i)(),t.table(Op,r.info)(),r}finally{t.groupEnd(Op)(),t.info(Op,`%cWebGL call tracing: luma.log.set('debug-webgl') `,`color: white; background: blue; padding: 2px 6px; border-radius: 3px;`)()}}};function Ap(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:!!(e&&typeof e.createVertexArray==`function`)}var jp=new kp;function Mp(e){return{...e,debug:e.debug??d.defaultProps.debug,debugWebGL:e.debugWebGL??d.defaultProps.debugWebGL,debugSpectorJS:e.debugSpectorJS??!!t.get(`debug-spectorjs`)}}async function Np(e){let n=[];(e.debugWebGL||e.debug)&&n.push(b()),e.debugSpectorJS&&n.push(y(e));let r=await Promise.allSettled(n);for(let e of r)e.status===`rejected`&&t.error(`Failed to initialize debug libraries ${e.reason}`)()}function Pp(){}var Fp={id:``,width:`100%`,height:`100%`,style:null,viewState:null,initialViewState:null,pickingRadius:0,pickAsync:`auto`,layerFilter:null,parameters:{},parent:null,device:null,deviceProps:{},gl:null,canvas:null,_canvases:null,layers:[],effects:[],views:null,controller:null,useDevicePixels:!0,touchAction:`none`,eventRecognizerOptions:{},_framebuffer:null,_animate:!1,_pickable:!0,_typedArrayManagerProps:{},_customRender:null,widgets:[],onDeviceInitialized:Pp,onWebGLInitialized:Pp,onResize:Pp,onViewStateChange:Pp,onInteractionStateChange:Pp,onBeforeRender:Pp,onAfterRender:Pp,onLoad:Pp,onError:e=>j.error(e.message,e.cause)(),onHover:null,onClick:null,onDragStart:null,onDrag:null,onDragEnd:null,_onMetrics:null,getCursor:({isDragging:e})=>e?`grabbing`:`grab`,getTooltip:null,debug:!1,drawPickingColors:!1},Ip=class{constructor(e){this.width=0,this.height=0,this.userData={},this.device=null,this.canvas=null,this.viewManager=null,this.layerManager=null,this.effectManager=null,this.deckRenderer=null,this.deckPicker=null,this.eventManager=null,this.eventManagers={},this.widgetManager=null,this.tooltip=null,this.animationLoop=null,this._canvasContext=null,this._deviceResizeHandler=null,this.cursorState={isHovering:!1,isDragging:!1},this.stats=new qi({id:`deck.gl`}),this.metrics={fps:0,setPropsTime:0,layersCount:0,drawLayersCount:0,updateLayersCount:0,updateAttributesCount:0,updateAttributesTime:0,framesRedrawn:0,pickTime:0,pickCount:0,pickLayersCount:0,gpuTime:0,gpuTimePerFrame:0,cpuTime:0,cpuTimePerFrame:0,bufferMemory:0,textureMemory:0,renderbufferMemory:0,gpuMemory:0},this._metricsCounter=0,this._hoverPickSequence=0,this._pointerDownPickSequence=0,this._needsRedraw=`Initial render`,this._canvasManager=new xp({createEventManager:e=>this._createEventManager(e),getEventRoot:e=>this._getEventRoot(e)}),this._ownedCanvas=null,this._pickRequest={mode:`hover`,x:-1,y:-1,radius:0,canvasId:void 0,event:null,unproject3D:!1},this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this._onPointerMove=e=>{let{_pickRequest:t}=this,n=this._getCanvasIdFromEvent(e);if(e.type===`pointerleave`)t.x=-1,t.y=-1,t.radius=0,t.canvasId=n;else if(e.leftButton||e.rightButton)return;else{let r=e.offsetCenter;if(!r)return;t.x=r.x,t.y=r.y,t.radius=this.props.pickingRadius,t.canvasId=n}this.layerManager&&(this.layerManager.context.mousePosition={x:t.x,y:t.y}),t.event=e},this._onEvent=e=>{let t=xl[e.type],n=e.offsetCenter,r=this._getCanvasIdFromEvent(e);if(!t||!n||!this.layerManager)return;let i=this.layerManager.getLayers(),a=this._getInternalPickingMode();if(a){if(a===`sync`){let t=e.type===`click`&&this._shouldUnproject3D(i)?this._getFirstPickedInfo(this._pickPointSync(this._getPointPickOptions(n.x,n.y,{unproject3D:!0,canvasId:r},i))):this._getLastPointerDownPickingInfo(n.x,n.y,r,i);this._dispatchPickingEvent(t,e);return}(this._lastPointerDownInfoPromise||Promise.resolve(this._getLastPointerDownPickingInfo(n.x,n.y,r,i))).then(t=>{this._dispatchPickingEvent(t,e)}).catch(e=>this.props.onError?.(e))}},this._onPointerDown=e=>{let t=e.offsetCenter,n=this._getCanvasIdFromEvent(e);if(!t)return;let r=this._getInternalPickingMode();if(!r)return;let i=this.layerManager?.getLayers()||[],a=++this._pointerDownPickSequence;if(r===`sync`){let e=this._pickPointSync({x:t.x,y:t.y,canvasId:n,radius:this.props.pickingRadius}),r=this._getFirstPickedInfo(e);this._lastPointerDownInfo=r,this._lastPointerDownInfoPromise=Promise.resolve(r);return}let o=this._pickPointAsync(this._getPointPickOptions(t.x,t.y,{canvasId:n},i)).then(e=>this._getFirstPickedInfo(e)).then(e=>(a===this._pointerDownPickSequence&&(this._lastPointerDownInfo=e),e)).catch(e=>{this.props.onError?.(e);let r=this.deckPicker&&this.viewManager?this._getLastPointerDownPickingInfo(t.x,t.y,n,i):{};return a===this._pointerDownPickSequence&&(this._lastPointerDownInfo=r),r});this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=o};let t=e;this.props={...Fp,...e},e=this.props,this._validateCanvasConfiguration(e),e.viewState&&e.initialViewState&&j.warn("View state tracking is disabled. Use either `initialViewState` for auto update or `viewState` for manual update.")(),this.viewState=this.props.initialViewState,e.device&&(this.device=e.device,this._setDeviceCanvasContext(e.device));let n=this.device;!n&&e.gl&&(e.gl instanceof WebGLRenderingContext&&j.error(`WebGL1 context not supported.`)(),n=jp.attach(e.gl,{_cacheShaders:!0,_cachePipelines:!0,...this.props.deviceProps})),n||=this._createDevice(e),this.animationLoop=this._createAnimationLoop(n,e),this.setProps(t),e._typedArrayManagerProps&&md.setOptions(e._typedArrayManagerProps),this.animationLoop.start()}finalize(){this._restoreDeviceResizeHandler(),this.animationLoop?.stop(),this.animationLoop?.destroy(),this.animationLoop=null,this._hoverPickSequence++,this._pointerDownPickSequence++,this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this.layerManager?.finalize(),this.layerManager=null,this.viewManager?.finalize(),this.viewManager=null,this.effectManager?.finalize(),this.effectManager=null,this.deckRenderer?.finalize(),this.deckRenderer=null,this.deckPicker?.finalize(),this.deckPicker=null,Object.keys(this._canvasManager.targets).length||this.eventManager?.destroy(),this.eventManager=null,this.eventManagers={},this.widgetManager?.finalize(),this.widgetManager=null,this._canvasManager.finalize(),this._isMultiCanvasMode()?this.canvas=null:this.canvas&&this.canvas===this._ownedCanvas&&(this.canvas.parentElement?.removeChild(this.canvas),this.canvas=null,this._ownedCanvas=null),this._canvasContext=null}setProps(e){this.stats.get(`setProps Time`).timeStart(),`onLayerHover`in e&&j.removed(`onLayerHover`,`onHover`)(),`onLayerClick`in e&&j.removed(`onLayerClick`,`onClick`)(),e.initialViewState&&!L(this.props.initialViewState,e.initialViewState,3)&&(this.viewState=e.initialViewState),R(!(`_canvases`in e)||Array.isArray(e._canvases)===this._isMultiCanvasMode()),Object.assign(this.props,e),this._validateCanvasConfiguration(this.props),this._validateInternalPickingMode(),this.device&&this._isMultiCanvasMode()&&this._syncCanvasTargets(),this._setCanvasSize(this.props);let t=Object.create(this.props);if(Object.assign(t,{views:this._getViews(),width:this.width,height:this.height,viewState:this._getViewState(),eventManagers:this.eventManagers}),e.device&&e.device.id!==this.device?.id){let t=e.device.getDefaultCanvasContext();this.animationLoop?.stop(),!this._isMultiCanvasMode()&&this.canvas!==t.canvas&&(this.canvas?.remove(),this.eventManager?.destroy(),this.canvas=null),this._setDeviceCanvasContext(e.device),j.log(`recreating animation loop for new device! id=${e.device.id}`)(),this.animationLoop=this._createAnimationLoop(e.device,e),this.animationLoop.start()}if(this.animationLoop?.setProps(t),e.useDevicePixels!==void 0&&this._canvasContext?.setProps){this._canvasContext.setProps({useDevicePixels:e.useDevicePixels});for(let t of Object.values(this._canvasManager.targets))t.presentationContext.setProps({useDevicePixels:e.useDevicePixels})}this.layerManager&&(this.viewManager.setProps(t),this.layerManager.activateViewport(this.getViewports()[0]),this.layerManager.setProps(t),this.effectManager.setProps(t),this.deckRenderer.setProps(t),this.deckPicker.setProps(t),this.widgetManager.setProps(t)),this.stats.get(`setProps Time`).timeEnd()}needsRedraw(e={clearRedrawFlags:!1}){if(!this.layerManager)return!1;if(this.props._animate)return`Deck._animate`;let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);let n=this.viewManager.needsRedraw(e),r=this.layerManager.needsRedraw(e),i=this.effectManager.needsRedraw(e),a=this.deckRenderer.needsRedraw(e);return t=t||n||r||i||a,t}redraw(e){if(!this.layerManager)return;let t=this.needsRedraw({clearRedrawFlags:!0});t=e||t,t&&(this.stats.get(`Redraw Count`).incrementCount(),this.props._customRender?this.props._customRender(t):this._drawLayers(t))}get isInitialized(){return this.viewManager!==null}getViews(){return R(this.viewManager),this.viewManager.views}getView(e){return R(this.viewManager),this.viewManager.getView(e)}getViewports(e){return R(this.viewManager),this.viewManager.getViewports(e)}getCanvas(){return this.canvas}getCanvasContext(e){let t=e?this.viewManager?.getView(e)?.props.canvasId:void 0;return this._getCanvasContext(t)}getEventManager(e){if(!e||!this.viewManager)return this.eventManager;let t=this.viewManager.getCanvasId(e)||`default-canvas`;return this.eventManagers[t]||this.eventManager}async pickObjectAsync(e){let t=(await this._pickAsync(`pickObjectAsync`,`pickObject Time`,e)).result;return t.length?t[0]:null}async pickObjectsAsync(e){return await this._pickAsync(`pickObjectsAsync`,`pickObjects Time`,e)}pickObject(e){let t=this._pick(`pickObject`,`pickObject Time`,e).result;return t.length?t[0]:null}pickMultipleObjects(e){return e.depth=e.depth||10,this._pick(`pickObject`,`pickMultipleObjects Time`,e).result}pickObjects(e){return this._pick(`pickObjects`,`pickObjects Time`,e)}_pickPositionForController(e,t,n){return this._getInternalPickingMode()===`sync`?this.pickObject({x:e,y:t,radius:0,unproject3D:!0,canvasId:n?this.viewManager?.getCanvasId(n):void 0}):null}_addResources(e,t=!1){for(let n in e)this.layerManager.resourceManager.add({resourceId:n,data:e[n],forceUpdate:t})}_removeResources(e){for(let t of e)this.layerManager.resourceManager.remove(t)}_addDefaultEffect(e){this.effectManager.addDefaultEffect(e)}_addDefaultShaderModule(e){this.layerManager.addDefaultShaderModule(e)}_removeDefaultShaderModule(e){this.layerManager?.removeDefaultShaderModule(e)}_resolveInternalPickingMode(){let{pickAsync:e}=this.props,t=this.device?.type||this.props.deviceProps?.type;if(e===`auto`)return t===`webgpu`?`async`:`sync`;if(e===`sync`&&t===`webgpu`)throw Error('`pickAsync: "sync"` is not supported when Deck is using a WebGPU device.');return e}_getInternalPickingMode(){try{return this._resolveInternalPickingMode()}catch(e){return this.props.onError?.(e),null}}_validateInternalPickingMode(){this._getInternalPickingMode()}_getFirstPickedInfo({result:e,emptyInfo:t}){return e[0]||t}_shouldUnproject3D(e=this.layerManager?.getLayers()||[]){return e.some(e=>e.props.pickable===`3d`)}_getPointPickOptions(e,t,n={},r=this.layerManager?.getLayers()||[]){return{x:e,y:t,canvasId:n.canvasId,radius:this.props.pickingRadius,unproject3D:this._shouldUnproject3D(r),...n}}_pickPointSync(e){return this._pick(`pickObject`,`pickObject Time`,e)}_pickPointAsync(e){return this._pickAsync(`pickObjectAsync`,`pickObject Time`,e)}_getLastPointerDownPickingInfo(e,t,n,r=this.layerManager?.getLayers()||[]){return this.deckPicker.getLastPickedObject({x:e,y:t,layers:r,viewports:this.getViewports({x:e,y:t,canvasId:n})},this._lastPointerDownInfo)}_applyHoverCallbacks({result:e,emptyInfo:t},n){if(!this.widgetManager)return;this.cursorState.isHovering=e.some(e=>e.picked);let r=t,i=!1;for(let t of e)r=t,i=t.layer?.onHover(t,n)||i;i||(this.props.onHover?.(r,n),this.widgetManager.onHover(r,n))}_dispatchPickingEvent(e,t){if(!this.layerManager||!this.widgetManager)return;let n=xl[t.type];if(!n)return;let{layer:r}=e,i=r&&(r[n]||r.props[n]),a=this.props[n],o=!1;i&&(o=i.call(r,e,t)),o||(a?.(e,t),this.widgetManager.onEvent(e,t))}_pickAsync(e,t,n){R(this.deckPicker);let{stats:r}=this,i=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,a=this._getCanvasContext(i)||void 0;r.get(`Pick Count`).incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(i);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:i}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:i,canvasContext:a});return r.get(t).timeEnd(),o}_pick(e,t,n){R(this.deckPicker);let{stats:r}=this,i=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,a=this._getCanvasContext(i)||void 0;r.get(`Pick Count`).incrementCount(),r.get(t).timeStart(),this._resizeForCanvasTarget(i);let o=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:i}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:i,canvasContext:a});return r.get(t).timeEnd(),o}_createCanvas(e){let t=e.canvas;return typeof t==`string`&&(t=document.getElementById(t),R(t)),t?this._ownedCanvas=null:(t=document.createElement(`canvas`),t.id=e.id||`deckgl-overlay`,e.width&&typeof e.width==`number`&&(t.width=e.width),e.height&&typeof e.height==`number`&&(t.height=e.height),(e.parent||document.body).appendChild(t),this._ownedCanvas=t),Object.assign(t.style,e.style),t}_isMultiCanvasMode(){return Array.isArray(this.props._canvases)}_getDefaultCanvasId(){return this._canvasManager.order[0]||`default-canvas`}_validateCanvasConfiguration(e){Array.isArray(e._canvases)&&(R(!e.canvas),R(!e.gl),R(!e.device?.canvasContext||e.device.getDefaultCanvasContext().offscreenCanvas))}_createEventManager(e){let t=new vl(e,{touchAction:this.props.touchAction,recognizers:Object.keys(Sl).map(e=>{let[t,n,r,i]=Sl[e],a=this.props.eventRecognizerOptions?.[e];return{recognizer:new t({...n,...a,event:e}),recognizeWith:r,requireFailure:i}}),events:{pointerdown:this._onPointerDown,pointermove:this._onPointerMove,pointerleave:this._onPointerMove}});for(let e in xl)e===`dblclick`?t.watch(e,this._onEvent):t.on(e,this._onEvent);return t}_getEventRoot(e){return e.closest(`.deck-events-root`)||this.props.parent?.querySelector(`.deck-events-root`)||e}_syncCanvasTargets(){if(!this.device||!this._isMultiCanvasMode())return;this._canvasManager.syncCanvasEntries({device:this.device,canvases:this.props._canvases||[],useDevicePixels:this.props.useDevicePixels}),this.eventManagers=this._canvasManager.eventManagers;let e=this._getDefaultCanvasId();this.eventManager=this.eventManagers[e]||null,this.canvas=this._canvasManager.targets[e]?.canvas||null}_setCanvasContext(e){this._canvasContext=e,`style`in e.canvas&&(this.canvas=e.canvas)}_setDeviceCanvasContext(e,t={}){let n=e.getDefaultCanvasContext();this._setCanvasContext(n),this._setDeviceResizeHandler(e,t)}_setDeviceResizeHandler(e,t={}){let n=!!t.syncDrawingBuffer;if(this._deviceResizeHandler?.device===e){this._deviceResizeHandler.syncDrawingBuffer=n;return}this._restoreDeviceResizeHandler();let r=e=>{this._isMultiCanvasMode()?this._updateMultiCanvasDimensions():e===this._canvasContext&&this._canvasContext&&this._onCanvasContextResize(this._canvasContext,{syncDrawingBuffer:this._deviceResizeHandler?.syncDrawingBuffer})};e.props.onResize=r,this._deviceResizeHandler={device:e,onResize:r,syncDrawingBuffer:n}}_restoreDeviceResizeHandler(){let e=this._deviceResizeHandler;e&&e.device.props?.onResize===e.onResize&&(e.device.props.onResize=Pp),this._deviceResizeHandler=null}_setCanvasSize(e){if(this._isMultiCanvasMode()||!this.canvas)return;let{width:t,height:n}=e;if(t||t===0){let e=Number.isFinite(t)?`${t}px`:t;this.canvas.style.width=e}if(n||n===0){let t=Number.isFinite(n)?`${n}px`:n;this.canvas.style.position=e.style?.position||`absolute`,this.canvas.style.height=t}}_getCanvasIdFromEvent(e){return this._canvasManager.getCanvasIdFromEvent(e?.rootElement)}_getCanvasContext(e){return this._canvasManager.getTarget(e)?.presentationContext||this._canvasContext}_resizeForCanvasTarget(e){let t=this._canvasManager.getTarget(e);if(!t||!this.device?.canvasContext)return;let[n,r]=t.presentationContext.getDrawingBufferSize();this.device.canvasContext.setDrawingBufferSize(n,r)}_createDeviceCanvas(e){if(this._isMultiCanvasMode()){let t=globalThis.OffscreenCanvas;if(!t)throw Error("`_canvases` requires OffscreenCanvas support.");return new t(typeof e.width==`number`&&Number.isFinite(e.width)?e.width:1,typeof e.height==`number`&&Number.isFinite(e.height)?e.height:1)}return this._createCanvas(e)}_updateCanvasSize(e=this._canvasContext){if(this._isMultiCanvasMode()){this._updateMultiCanvasDimensions();return}let{canvas:t}=this,[n,r]=e?e.getCSSSize():[t?.clientWidth??t?.width??0,t?.clientHeight??t?.height??0];(n!==this.width||r!==this.height)&&(this.width=n,this.height=r,this.viewManager?.setProps({width:n,height:r}),this.layerManager?.activateViewport(this.getViewports()[0]),this.props.onResize({width:n,height:r},e||void 0))}_onCanvasContextResize(e,t={}){if(t.syncDrawingBuffer){let{width:t,height:n}=e.canvas;e.setDrawingBufferSize(t,n)}this._needsRedraw=`Canvas resized`,this._updateCanvasSize(e)}_updateMultiCanvasDimensions(){let[e,t]=this._getCanvasContext()?.getCSSSize()||[0,0];(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.props.onResize({width:e,height:t})),this._needsRedraw=`Canvas resized`,this.viewManager?.setNeedsUpdate(`Canvas resized`),this.viewManager?.setProps({width:this.width,height:this.height})}_createAnimationLoop(e,t){let{gl:n,onError:r}=t;return new ln({device:e,autoResizeDrawingBuffer:!n&&!Array.isArray(t._canvases),autoResizeViewport:!1,onInitialize:e=>this._setDevice(e.device),onRender:this._onRenderFrame.bind(this),onError:r})}_createDevice(e){let t=this.props.deviceProps?.createCanvasContext,n=typeof t==`object`?t:void 0,r={adapters:[],_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps};r.adapters.includes(jp)||r.adapters.push(jp);let i={alphaMode:this.props.deviceProps?.type===`webgpu`?`premultiplied`:void 0};return kt.createDevice({_reuseDevices:!0,type:`webgl`,...r,createCanvasContext:{...i,...n,canvas:this._createDeviceCanvas(e),useDevicePixels:this.props.useDevicePixels,autoResize:!0}})}_getViewState(){return this.props.viewState||this.viewState}_getViews(){let{views:e}=this.props,t=Array.isArray(e)?e:e?[e]:[new Zf({id:`default-view`})];return t.length&&this.props.controller&&(t[0]=t[0].clone({controller:this.props.controller})),t}_onContextLost(){let{onError:e}=this.props;this.animationLoop&&e&&e(Error(`WebGL context is lost`))}_pickAndCallback(){let{_pickRequest:e}=this;if(e.event){let t=e.event,n=this.layerManager?.getLayers()||[],r=this._getPointPickOptions(e.x,e.y,{canvasId:e.canvasId,radius:e.radius,mode:e.mode},n),i=this._getInternalPickingMode(),a=++this._hoverPickSequence;if(e.event=null,e.canvasId=void 0,!i)return;if(i===`sync`){this._applyHoverCallbacks(this._pickPointSync(r),t);return}this._pickPointAsync(r).then(({result:e,emptyInfo:n})=>{a===this._hoverPickSequence&&this._applyHoverCallbacks({result:e,emptyInfo:n},t)}).catch(e=>this.props.onError?.(e))}}_updateCursor(){let e=this.props.getCursor(this.cursorState);if(this._isMultiCanvasMode()){for(let t of Object.values(this._canvasManager.targets))t.canvas.style.cursor=e;return}let t=this.props.parent||this.canvas;t&&(t.style.cursor=e)}_setDevice(e){if(this.device=e,this._validateInternalPickingMode(),!this.animationLoop)return;this._setDeviceCanvasContext(e,{syncDrawingBuffer:!!(this.props.gl&&this.props.device!==e)}),this._isMultiCanvasMode()?this._syncCanvasTargets():this.canvas&&!this.canvas.isConnected&&this.props.parent&&this.props.parent.insertBefore(this.canvas,this.props.parent.firstChild),this.device.type===`webgl`&&this.device.setParametersWebGL({blend:!0,blendFunc:[770,771,1,771],polygonOffsetFill:!0,depthTest:!0,depthFunc:515}),this.props.onDeviceInitialized(this.device),this.device.type===`webgl`&&this.props.onWebGLInitialized(this.device.gl);let t=new nn;if(t.play(),this.animationLoop.attachTimeline(t),!this._isMultiCanvasMode()){let e=this.canvas&&this._getEventRoot(this.canvas);R(e),this.eventManager=this._createEventManager(e),this.eventManagers={[rf]:this.eventManager}}this.viewManager=new af({timeline:t,eventManager:this.eventManager,eventManagers:this.eventManagers,getCanvasContext:this._isMultiCanvasMode()?this.getCanvasContext.bind(this):void 0,onViewStateChange:this._onViewStateChange.bind(this),onInteractionStateChange:this._onInteractionStateChange.bind(this),pickPosition:this._pickPositionForController.bind(this),views:this._getViews(),viewState:this._getViewState(),width:this.width,height:this.height});let n=this.viewManager.getViewports()[0];this.layerManager=new nf(this.device,{deck:this,stats:this.stats,viewport:n,timeline:t}),this.effectManager=new ep({deck:this,device:this.device}),this.deckRenderer=new rp(this.device,{stats:this.stats}),this.deckPicker=new dp(this.device,{stats:this.stats});let r=this.props.parent?.querySelector(`.deck-widgets-root`)||(this._isMultiCanvasMode()?this.props.parent||this.canvas?.parentElement:null)||this.canvas?.parentElement;this.widgetManager=new hp({deck:this,parentElement:r}),this.widgetManager.addDefault(new bp),this.setProps({}),this._updateCanvasSize(this._canvasContext),this.props.onLoad()}_drawLayers(e,t){let{device:n,gl:r}=this.layerManager.context;this.props.onBeforeRender({device:n,gl:r});let i={target:this.props._framebuffer,layers:this.layerManager.getLayers(),viewports:this.viewManager.getViewports(),onViewportActive:this.layerManager.activateViewport,views:this.viewManager.getViews(),pass:`screen`,effects:this.effectManager.getEffects(),...t};if(this._isMultiCanvasMode()&&i.pass===`screen`&&!i.target&&this._canvasManager.order.length)for(let e of this._canvasManager.order){let t=i.viewports.filter(t=>this.viewManager.getCanvasId(t.id)===e);if(!t.length){let t=this._canvasManager.targets[e];this._resizeForCanvasTarget(e),this.deckRenderer?.renderLayers({...i,canvasContext:t.presentationContext,target:t.presentationContext.getCurrentFramebuffer(),viewports:[],clearCanvas:!0}),t.presentationContext.present();continue}let n=this._canvasManager.targets[e];this._resizeForCanvasTarget(e);let r=n.presentationContext.getCurrentFramebuffer();this.deckRenderer?.renderLayers({...i,canvasContext:n.presentationContext,target:r,viewports:t}),n.presentationContext.present()}else this.deckRenderer?.renderLayers(i);i.pass===`screen`&&this.widgetManager.onRedraw({viewports:i.viewports,layers:i.layers}),this.props.onAfterRender({device:n,gl:r})}_onRenderFrame(){this._getFrameStats(),this._metricsCounter++%60==0&&(this._getMetrics(),this.stats.reset(),j.table(4,this.metrics)(),this.props._onMetrics&&this.props._onMetrics(this.metrics)),this._updateCursor(),this.layerManager.updateLayers(),this._pickAndCallback(),this.redraw(),this.viewManager&&this.viewManager.updateViewStates()}_onViewStateChange(e){let t=this.props.onViewStateChange(e)||e.viewState;this.viewState&&(this.viewState={...this.viewState,[e.viewId]:t},this.props.viewState||this.viewManager&&this.viewManager.setProps({viewState:this.viewState}))}_onInteractionStateChange(e){this.cursorState.isDragging=e.isDragging||!1,this.props.onInteractionStateChange(e)}_getFrameStats(){let{stats:e}=this;e.get(`frameRate`).timeEnd(),e.get(`frameRate`).timeStart();let t=this.animationLoop.stats;e.get(`GPU Time`).addTime(t.get(`GPU Time`).lastTiming),e.get(`CPU Time`).addTime(t.get(`CPU Time`).lastTiming)}_getMetrics(){let{metrics:e,stats:t}=this;e.fps=t.get(`frameRate`).getHz(),e.setPropsTime=t.get(`setProps Time`).time,e.updateAttributesTime=t.get(`Update Attributes`).time,e.framesRedrawn=t.get(`Redraw Count`).count,e.pickTime=t.get(`pickObject Time`).time+t.get(`pickMultipleObjects Time`).time+t.get(`pickObjects Time`).time,e.pickCount=t.get(`Pick Count`).count,e.layersCount=this.layerManager?.layers.length??0,e.drawLayersCount=t.get(`Layers rendered`).lastSampleCount,e.pickLayersCount=t.get(`Layers picked`).lastSampleCount,e.updateLayersCount=t.get(`Layer updates`).count,e.updateAttributesCount=t.get(`Attributes updated`).count,e.gpuTime=t.get(`GPU Time`).time,e.cpuTime=t.get(`CPU Time`).time,e.gpuTimePerFrame=t.get(`GPU Time`).getAverageTime(),e.cpuTimePerFrame=t.get(`CPU Time`).getAverageTime();let n=kt.stats.get(`GPU Time and Memory`);e.bufferMemory=n.get(`Buffer Memory`).count,e.textureMemory=n.get(`Texture Memory`).count,e.renderbufferMemory=n.get(`Renderbuffer Memory`).count,e.gpuMemory=n.get(`GPU Memory`).count}};Ip.defaultProps=Fp,Ip.VERSION=ws;function Lp(e){switch(e){case`float64`:return Float64Array;case`uint8`:case`unorm8`:return Uint8ClampedArray;default:return n(e)}}var Rp=r.getDataType.bind(r);function zp(e,t,n){if(t.size>4)return null;let r=n===`webgpu`&&t.type===`uint8`?`unorm8`:t.type,i=t.size,a=!!(n!==`webgpu`&&i===3&&r&&[`uint8`,`sint8`,`unorm8`,`snorm8`,`uint16`,`sint16`,`unorm16`,`snorm16`].includes(r));return{attribute:e,format:i>1?`${r}x${i}${a?`-webgl`:``}`:t.type,byteOffset:t.offset||0}}function Bp(e){return e.stride||e.size*e.bytesPerElement}function Vp(e,t){return e.type===t.type&&e.size===t.size&&Bp(e)===Bp(t)&&(e.offset||0)===(t.offset||0)}function Hp(e,t){t.offset&&j.removed(`shaderAttribute.offset`,`vertexOffset, elementOffset`)();let n=Bp(e),r=t.vertexOffset===void 0?e.vertexOffset||0:t.vertexOffset,i=t.elementOffset||0,a=r*n+i*e.bytesPerElement+(e.offset||0);return{...t,offset:a,stride:n}}function Up(e,t){let n=Hp(e,t);return{high:n,low:{...n,offset:n.offset+e.size*4}}}var Wp=class{constructor(e,t,n){this._buffer=null,this.device=e,this.id=t.id||``,this.size=t.size||1;let r=t.logicalType||t.type,i=r===`float64`,{defaultValue:a}=t;a=Number.isFinite(a)?[a]:a||Array(this.size).fill(0);let o;o=i?`float32`:!r&&t.isIndexed?`uint32`:r||`float32`;let s=Lp(r||o);this.doublePrecision=i,i&&t.fp64===!1&&(s=Float32Array),this.value=null,this.settings={...t,defaultType:s,defaultValue:a,logicalType:r,type:o,normalized:o.includes(`norm`),size:this.size,bytesPerElement:s.BYTES_PER_ELEMENT},this.state={...n,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let e=this.getAccessor();return e.vertexOffset?e.vertexOffset*Bp(e):0}get numInstances(){return this.state.numInstances}set numInstances(e){this.state.numInstances=e}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&=(this._buffer.delete(),null),md.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&this.device.type!==`webgpu`?null:this.state.externalBuffer||this._buffer}getValue(e=this.id,t=null){let n={};if(this.state.constant){let r=this.value;if(this.device.type===`webgpu`&&this._buffer)n[e]=this._buffer;else if(t){let i=Hp(this.getAccessor(),t),a=i.offset/r.BYTES_PER_ELEMENT,o=i.size||this.size;n[e]=r.subarray(a,a+o)}else n[e]=r}else n[e]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?n[`${e}64Low`]=n[e]:n[`${e}64Low`]=new Float32Array(this.size)),n}_getBufferLayout(e=this.id,t=null){let n=this.getAccessor(),r=[],i={name:this.id,byteStride:this.device.type===`webgpu`&&this.state.constant?0:Bp(n)};if(this.doublePrecision){let i=Up(n,t||{});r.push(zp(e,{...n,...i.high},this.device.type),zp(`${e}64Low`,{...n,...i.low},this.device.type))}else if(t){let i=Hp(n,t);r.push(zp(e,{...n,...i},this.device.type))}else r.push(zp(e,n,this.device.type));return i.attributes=r.filter(Boolean),i}setAccessor(e){this.state.bufferAccessor=e}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let e=null;if(this.state.constant&&this.value){let t=Array.from(this.value);e=[t,t]}else{let{value:t,numInstances:n,size:r}=this,i=n*r;if(t&&i&&t.length>=i){let n=Array(r).fill(1/0),a=Array(r).fill(-1/0);for(let e=0;e<i;)for(let i=0;i<r;i++){let r=t[e++];r<n[i]&&(n[i]=r),r>a[i]&&(a[i]=r)}e=[n,a]}}return this.state.bounds=e,e}setData(e){let{state:t}=this,n;n=ArrayBuffer.isView(e)?{value:e}:e instanceof i?{buffer:e}:e;let r={...this.settings,...n};if(ArrayBuffer.isView(n.value)){if(!n.type)if(this.doublePrecision&&n.value instanceof Float64Array)r.type=`float32`;else{let e=Rp(n.value);r.type=r.normalized?e.replace(`int`,`norm`):e}r.bytesPerElement=n.value.BYTES_PER_ELEMENT,r.stride=Bp(r)}if(t.bounds=null,n.constant){let e=n.value;if(e=this._normalizeValue(e,[],0),this.settings.normalized&&(e=this.normalizeConstant(e)),!(!t.constant||!this._areValuesEqual(e,this.value)))return!1;t.externalBuffer=null,t.constant=!0,this.value=ArrayBuffer.isView(e)?e:new Float32Array(e)}else if(n.buffer)t.externalBuffer=n.buffer,t.constant=!1,this.value=n.value||null;else if(n.value){this._checkExternalBuffer(n);let e=n.value,i=e;t.externalBuffer=null,t.constant=!1,this.value=e,this._shouldSplitDoublePrecisionValue(i)&&(i=wd(i,r),e instanceof Float32Array&&(r.stride=r.size*2*Float32Array.BYTES_PER_ELEMENT));let{buffer:a}=this,o=Bp(r),s=(r.vertexOffset||0)*o;if(this.settings.isIndexed){let e=this.settings.defaultType;i.constructor!==e&&(i=new e(i))}let c=i.byteLength+s+o*2;(!a||a.byteLength<c)&&(a=this._createBuffer(c)),a.write(i,s)}return this.setAccessor(r),!0}updateSubBuffer(e={}){this.state.bounds=null;let t=this.value,{startOffset:n=0,endOffset:r}=e,i=this._shouldSplitDoublePrecisionValue(t);this.buffer.write(i?wd(t,{size:this.size,startIndex:n,endIndex:r}):t.subarray(n,r),n*(i?8:t.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(e,t=!1){let{state:n}=this,r=n.allocatedValue,i=md.allocate(r,e+1,{size:this.size,type:this.settings.defaultType,copy:t});this.value=i;let a=this._shouldSplitDoublePrecisionValue(i),o=a&&i instanceof Float32Array?{...this.settings,stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(o);let{byteOffset:s}=this,{buffer:c}=this,l=i.byteLength*(a&&i instanceof Float32Array?2:1);return(!c||c.byteLength<l+s)&&(c=this._createBuffer(l+s),t&&r&&c.write(this._shouldSplitDoublePrecisionValue(r)?wd(r,this):r,s)),n.allocatedValue=i,n.constant=!1,n.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(e){return!!(this.doublePrecision&&(e instanceof Float64Array||this.device.type===`webgpu`&&e instanceof Float32Array))}_checkExternalBuffer(e){let{value:t}=e;if(!ArrayBuffer.isView(t))throw Error(`Attribute ${this.id} value is not TypedArray`);let n=this.settings.defaultType,r=!1;if(this.doublePrecision&&(r=t.BYTES_PER_ELEMENT<4),r)throw Error(`Attribute ${this.id} does not support ${t.constructor.name}`);!(t instanceof n)&&this.settings.normalized&&!(`normalized`in e)&&j.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(e){switch(this.settings.type){case`snorm8`:return new Float32Array(e).map(e=>(e+128)/255*2-1);case`snorm16`:return new Float32Array(e).map(e=>(e+32768)/65535*2-1);case`unorm8`:return new Float32Array(e).map(e=>e/255);case`unorm16`:return new Float32Array(e).map(e=>e/65535);default:return e}}_normalizeValue(e,t,n){let{defaultValue:r,size:i}=this.settings;if(Number.isFinite(e))return t[n]=e,t;if(!e){let e=i;for(;--e>=0;)t[n+e]=r[e];return t}switch(i){case 4:t[n+3]=Number.isFinite(e[3])?e[3]:r[3];case 3:t[n+2]=Number.isFinite(e[2])?e[2]:r[2];case 2:t[n+1]=Number.isFinite(e[1])?e[1]:r[1];case 1:t[n+0]=Number.isFinite(e[0])?e[0]:r[0];break;default:let a=i;for(;--a>=0;)t[n+a]=Number.isFinite(e[a])?e[a]:r[a]}return t}_areValuesEqual(e,t){if(!e||!t)return!1;let{size:n}=this;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}_createBuffer(e){this._buffer&&this._buffer.destroy();let{isIndexed:t,type:n}=this.settings,r=this.device.type===`webgpu`&&!t?i.VERTEX|i.STORAGE|i.COPY_DST|i.COPY_SRC:(t?i.INDEX:i.VERTEX)|i.COPY_DST;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:r,indexType:t?n:void 0,byteLength:e}),this._buffer}},Gp=[],Kp=[];function qp(e,t=0,n=1/0){let r=Gp,i={index:-1,data:e,target:[]};return e?typeof e[Symbol.iterator]==`function`?r=e:e.length>0&&(Kp.length=e.length,r=Kp):r=Gp,(t>0||Number.isFinite(n))&&(r=(Array.isArray(r)?r:Array.from(r)).slice(t,n),i.index=t-1),{iterable:r,objectInfo:i}}function Jp(e){return e&&e[Symbol.asyncIterator]}function Yp(e,t){let{size:n,stride:r,offset:i,startIndices:a,nested:o}=t,s=e.BYTES_PER_ELEMENT,c=r?r/s:n,l=i?i/s:0,u=Math.floor((e.length-l)/c);return(t,{index:r,target:i})=>{if(!a){let t=r*c+l;for(let r=0;r<n;r++)i[r]=e[t+r];return i}let s=a[r],d=a[r+1]||u,f;if(o){f=Array(d-s);for(let t=s;t<d;t++){let r=t*c+l;i=Array(n);for(let t=0;t<n;t++)i[t]=e[r+t];f[t-s]=i}}else if(c===n)f=e.subarray(s*n+l,d*n+l);else{f=new e.constructor((d-s)*n);let t=0;for(let r=s;r<d;r++){let i=r*c+l;for(let r=0;r<n;r++)f[t++]=e[i+r]}}return f}}var Xp=[],Zp=[[0,1/0]];function Qp(e,t){if(e===Zp||(t[0]<0&&(t[0]=0),t[0]>=t[1]))return e;let n=[],r=e.length,i=0;for(let a=0;a<r;a++){let r=e[a];r[1]<t[0]?(n.push(r),i=a+1):r[0]>t[1]?n.push(r):t=[Math.min(r[0],t[0]),Math.max(r[1],t[1])]}return n.splice(i,0,t),n}var $p={interpolation:{duration:0,easing:e=>e},spring:{stiffness:.05,damping:.5}};function em(e,t){if(!e)return null;Number.isFinite(e)&&(e={type:`interpolation`,duration:e});let n=e.type||`interpolation`;return{...$p[n],...t,...e,type:n}}var tm=class extends Wp{constructor(e,t){super(e,t,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:Zp}),this.constant=!1,this.settings.update=t.update||(t.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(e){this.state.startIndices=e}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:e=!1}={}){let t=this.state.needsRedraw;return this.state.needsRedraw=t&&!e,t}layoutChanged(){return this.state.layoutChanged}setAccessor(e){var t;(t=this.state).layoutChanged||(t.layoutChanged=!Vp(e,this.getAccessor())),super.setAccessor(e)}getUpdateTriggers(){let{accessor:e}=this.settings;return[this.id].concat(typeof e!=`function`&&e||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(e){if(!e||!this.supportsTransition())return null;let{accessor:t}=this.settings,n=this.settings.transition;return em(Array.isArray(t)?e[t.find(t=>e[t])]:e[t],n)}setNeedsUpdate(e=this.id,t){if(this.state.needsUpdate=this.state.needsUpdate||e,this.setNeedsRedraw(e),t){let{startRow:e=0,endRow:n=1/0}=t;this.state.updateRanges=Qp(this.state.updateRanges,[e,n])}else this.state.updateRanges=Zp}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=Xp}setNeedsRedraw(e=this.id){this.state.needsRedraw=this.state.needsRedraw||e}allocate(e){let{state:t,settings:n}=this;if(n.noAlloc)return!1;if(n.update){let n=this.isConstant;return super.allocate(e,t.updateRanges!==Zp),t.layoutChanged||=n&&this.device.type===`webgpu`,!0}return!1}updateBuffer({numInstances:e,data:t,props:n,context:r}){if(!this.needsUpdate())return!1;let{state:{updateRanges:i},settings:{update:a,noAlloc:o}}=this,s=!0;if(a){for(let[o,s]of i)a.call(r,this,{data:t,startRow:o,endRow:s,props:n,numInstances:e});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let e=this.value;this.value=null,this.setConstantValue(r,e)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[t,n]of i){let r=Number.isFinite(t)?this.getVertexOffset(t):0,i=Number.isFinite(n)?this.getVertexOffset(n):o||!Number.isFinite(e)?this.value.length:e*this.size;super.updateSubBuffer({startOffset:r,endOffset:i})}this._checkAttributeArray()}else s=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),s}setConstantValue(e,t){var n;if(t===void 0||typeof t==`function`)return!1;let r=this.isConstant,i=this.settings.transform&&e?this.settings.transform.call(e,t):t,a=this.settings.defaultType;this.state.constantValue=this._normalizeValue(i,new a(this.size),0);let o=this.setData({constant:!0,value:i});if(this.device.type===`webgpu`){let e=this.state.constantValue;this.doublePrecision&&(e instanceof Float32Array||e instanceof Float64Array)&&(e=wd(e,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}));let t=this._buffer;(!t||t.byteLength<e.byteLength)&&(t=this._createBuffer(e.byteLength)),t.write(e),(n=this.state).layoutChanged||(n.layoutChanged=!r),this.constant=!1}return o&&this.setNeedsRedraw(),this.clearNeedsUpdate(),!0}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(e){let{state:t}=this;return e?(this.clearNeedsUpdate(),t.lastExternalBuffer===e?!0:(t.lastExternalBuffer=e,this.setNeedsRedraw(),this.setData(e),!0)):(t.lastExternalBuffer=null,!1)}setBinaryValue(e,t=null){let{state:n,settings:r}=this;if(!e)return n.binaryValue=null,n.binaryAccessor=null,!1;if(r.noAlloc)return!1;if(n.binaryValue===e)return this.clearNeedsUpdate(),!0;if(n.binaryValue=e,this.setNeedsRedraw(),r.transform||t!==this.startIndices){ArrayBuffer.isView(e)&&(e={value:e});let i=e;R(ArrayBuffer.isView(i.value),`invalid ${r.accessor}`);let a=!!i.size&&i.size!==this.size;return n.binaryAccessor=Yp(i.value,{size:i.size||this.size,stride:i.stride,offset:i.offset,startIndices:t,nested:a}),!1}return this.clearNeedsUpdate(),this.setData(e),!0}getVertexOffset(e){let{startIndices:t}=this;return(t?e<t.length?t[e]:this.numInstances:e)*this.size}getValue(){let e=this.settings.shaderAttributes,t=super.getValue();if(!e)return t;for(let n in e)Object.assign(t,super.getValue(n,e[n]));return t}getBufferLayout(e){this.state.layoutChanged=!1;let t=this.settings.shaderAttributes,n=super._getBufferLayout(),{stepMode:r}=this.settings;if(r===`dynamic`?n.stepMode=e?e.isInstanced?`instance`:`vertex`:`instance`:n.stepMode=r??`vertex`,!t)return n;for(let e in t){let r=super._getBufferLayout(e,t[e]);n.attributes.push(...r.attributes)}return n}_autoUpdater(e,{data:t,startRow:n,endRow:r,props:i,numInstances:a}){let{settings:o,state:s,value:c,size:l,startIndices:u}=e,{accessor:d,transform:f}=o,p=s.binaryAccessor||(typeof d==`function`?d:i[d]);R(typeof p==`function`,`accessor "${d}" is not a function`);let m=e.getVertexOffset(n),{iterable:h,objectInfo:g}=qp(t,n,r);for(let t of h){g.index++;let n=p(t,g);if(f&&(n=f.call(this,n)),u){let t=(g.index<u.length-1?u[g.index+1]:a)-u[g.index];if(n&&Array.isArray(n[0])){let t=m;for(let r of n)e._normalizeValue(r,c,t),t+=l}else n&&n.length>l?c.set(n,m):(e._normalizeValue(n,g.target,0),Zd({target:c,source:g.target,start:m,count:t}));m+=t*l}else e._normalizeValue(n,c,m),m+=l}}_validateAttributeUpdaters(){let{settings:e}=this;if(!(e.noAlloc||typeof e.update==`function`))throw Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:e}=this,t=Math.min(4,this.size);if(e&&e.length>=t){let n=!0;switch(t){case 4:n&&=Number.isFinite(e[3]);case 3:n&&=Number.isFinite(e[2]);case 2:n&&=Number.isFinite(e[1]);case 1:n&&=Number.isFinite(e[0]);break;default:n=!1}if(!n)throw Error(`Illegal attribute generated for ${this.id}`)}}},nm=class e{gpuDataEvaluators;format;length;id;_gpuVector;_ownsGPUDataEvaluators;_destroyed=!1;static fromGPUVector(t){if(t.bufferLayout)throw Error(`GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${t.name}"`);if(t.data.length===0)throw Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${t.name}"`);return new e({id:t.name,gpuDataEvaluators:t.data.map(e=>T.fromGPUData(e,{id:t.name})),gpuVector:t,format:t.format})}static fromGPUDataEvaluators(t,n={}){return new e({id:n.id,gpuDataEvaluators:t,format:n.format})}constructor({id:e,gpuDataEvaluators:t,gpuVector:n,format:r}){if(t.length===0)throw Error(`GPUVectorEvaluator requires at least one GPUData evaluator`);rm(t),this.id=e,this.gpuDataEvaluators=t,this.format=r??t[0].format,this.length=t.reduce((e,t)=>e+t.length,0),this._gpuVector=n,this._ownsGPUDataEvaluators=!n}get evaluated(){return!!this._gpuVector}get gpuVector(){if(!this._gpuVector)throw Error(`${this} not evaluated`);return this._gpuVector}mapGPUData(t){return e.fromGPUDataEvaluators(this.gpuDataEvaluators.map((e,n)=>t(e,n)),{id:this.id})}async evaluate(e,t={}){if(this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let n=await Promise.all(this.gpuDataEvaluators.map(n=>n.evaluate(e,t))),r=n[0],i=n.map(im),a=t.format??this.format??r.format;return this._gpuVector=new ae({type:`data`,name:t.name??this.id??`vector`,format:a,data:i,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}evaluateSync(e,t={}){if(this._destroyed)throw Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let n=this.gpuDataEvaluators.map(n=>n.evaluateSync(e,t)),r=n[0],i=n.map(im),a=t.format??this.format??r.format;return this._gpuVector=new ae({type:`data`,name:t.name??this.id??`vector`,format:a,data:i,stride:r.stride,byteStride:r.byteStride,rowByteLength:r.rowByteLength,bufferLayout:r.bufferLayout}),this._gpuVector}destroy(){if(this._ownsGPUDataEvaluators)for(let e of this.gpuDataEvaluators)e.destroy();this._gpuVector=void 0,this._destroyed=!0}toString(){return this.id??this.constructor.name}};function rm(e){let t=e[0];for(let n of e.slice(1))if(n.type!==t.type||n.size!==t.size||n.normalized!==t.normalized||n.format!==t.format)throw Error(`GPUVectorEvaluator requires matching GPUData evaluator layouts`)}function im(e){let[t,...n]=e.data;if(!t||n.length>0)throw Error(`GPUVectorEvaluator requires one GPUData chunk for "${e.name}"`);return t}function am({elementWise:e,func:t,inputs:n,output:r,outputBuffer:i}){let a=Array.isArray(n)?n:Object.values(n);for(let e of a)if(!e.value)throw Error(`${e} does not have CPU value`);let o=r.length,s=r.size,c=new r.ValueType(o*s);for(let n=0;n<o;n++){let r=a.map(e=>z(e,n));if(e)for(let e=0;e<s;e++)c[n*s+e]=t.apply(null,r.map(t=>t[e]));else t.call(null,c.subarray(n*s,n*s+s),...r)}let l=r.ValueType.BYTES_PER_ELEMENT,u=r.offset/l,d=r.stride/l,f=s,p=c;if(u!==0||d!==f){p=new r.ValueType(u+r.byteLength/l);for(let e=0;e<o;e++){let t=e*f,n=u+e*d,r=c.subarray(t,t+s);p.set(r,n),i.write(r,n*l)}}else i.write(c);return{success:!0,value:p}}function z(e,t){let n=e.value,r=e.size,i=e.offset/e.ValueType.BYTES_PER_ELEMENT,a=e.stride/e.ValueType.BYTES_PER_ELEMENT,o=i+(e.isConstant?0:t)*a,s=n.slice(o,o+r);if(!e.normalized)return s;let c=new Float32Array(r);for(let t=0;t<r;t++)c[t]=om(s[t],e.type);return c}function om(e,t){switch(t){case`uint8`:return e/255;case`uint16`:return e/65535;case`uint32`:return e/4294967295;case`sint8`:return Math.max(e/127,-1);case`sint16`:return Math.max(e/32767,-1);case`sint32`:return Math.max(e/2147483647,-1);case`float32`:return e;default:throw Error(`Unsupported normalized source type ${t}`)}}var sm=({inputs:e,output:t,target:n})=>{for(let t of Object.values(e.namedInputs))if(!t.value)throw Error(`${t} does not have CPU value`);let r=new t.ValueType(t.length*t.size);for(let n=0;n<t.length;n++){let i=Object.fromEntries(Object.entries(e.namedInputs).map(([e,t])=>[e,z(t,n)]));for(let a=0;a<t.size;a++)r[n*t.size+a]=cm(e.expression,i,a)}return n.write(r),{success:!0,value:r}};function cm(e,t,n){switch(e.kind){case`input`:{let r=t[e.name];return n<r.length?r[n]:r.length===1?r[0]:0}case`literal`:return Array.isArray(e.value)?e.value[n]??0:e.value;case`call`:{lm(e.op,e.args.length);let r=e.args.map(e=>cm(e,t,n));switch(e.op){case`add`:return r[0]+r[1];case`subtract`:return r[0]-r[1];case`multiply`:return r[0]*r[1];case`divide`:return r[0]/r[1];case`pow`:return r[0]**+r[1];case`sqrt`:return Math.sqrt(r[0]);case`abs`:return Math.abs(r[0]);case`sin`:return Math.sin(r[0]);case`cos`:return Math.cos(r[0]);case`tan`:return Math.tan(r[0]);case`exp`:return Math.exp(r[0]);case`log`:return Math.log(r[0]);default:{let t=e.op;throw Error(`Unsupported arithmetic op ${t}`)}}}default:{let t=e;throw Error(`Unsupported expression node ${t.kind}`)}}}function lm(e,t){let n=ie[e].arity;if(t!==n)throw Error(`Arithmetic op '${e}' expects ${n} args, got ${t}`)}var um=({inputs:e,output:t,target:n})=>{let{sourceValues:r}=e;if(!r.value)throw Error(`${r} does not have CPU value`);let i=new t.ValueType(t.length*t.size);if(r.length===0)return{success:!1,error:Error(`${r} is empty`)};for(let e=0;e<r.size;e++){let n=z(r,0)[e],a=e*t.size,o=a+1;i[a]=n,i[o]=n;for(let t=1;t<r.length;t++){let n=z(r,t)[e];n<i[a]&&(i[a]=n),n>i[o]&&(i[o]=n)}}return n.write(i),{success:!0,value:i}},dm=({inputs:e,output:t,target:n})=>am({func:(e,t)=>{let n=e.length/2,r=new Float64Array(t.buffer);for(let t=0;t<n;t++){let i=r[t];e[t]=Math.fround(i),e[t+n]=i-e[t]}return e},inputs:e,output:t,outputBuffer:n}),fm=async({inputs:e,output:t,target:n})=>{let{ids:r,sourceValues:i}=e,a=r.value,o=i.value;if(!a)throw Error(`${r} does not have CPU value`);if(!o)throw Error(`${i} does not have CPU value`);let s=new t.ValueType(t.length*t.size),c=Array(t.size).fill(0);for(let e=0;e<t.length;e++){let n=z(r,e),a=Number(n[0]),o=pm(a,i.length)?z(i,a):c;s.set(o,e*t.size)}return n.write(s),{success:!0,value:s}};function pm(e,t){return Number.isInteger(e)&&e>=0&&e<t}var mm=({inputs:e,output:t,target:n})=>am({func:(e,...t)=>{let n=0;for(let r of t)e.set(r,n),n+=r.length},inputs:e,output:t,outputBuffer:n}),hm=({inputs:e,output:t,target:n})=>{let{x:r,y:i}=e,a=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=z(r,e),n=z(i,e),o=0;for(let e=0;e<r.size;e++)o+=t[e]*n[e];a[e]=o}return n.write(a),{success:!0,value:a}},gm=({inputs:e,output:t,target:n})=>{let{x:r,y:i}=e,a=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=z(r,e),n=z(i,e),o=1;for(let e=0;e<r.size;e++)if(t[e]!==n[e]){o=0;break}a[e]=o}return n.write(a),{success:!0,value:a}},_m=({inputs:e,output:t,target:n})=>{let{x:r}=e,i=new t.ValueType(t.length);for(let e=0;e<t.length;e++){let t=z(r,e),n=0;for(let e=0;e<r.size;e++)n+=t[e]*t[e];i[e]=Math.sqrt(n)}return n.write(i),{success:!0,value:i}},vm=async({inputs:e,output:t,target:n})=>{let{segments:r,vertexCount:i}=e,a=r.value;if(!a)throw Error(`${r} does not have CPU value`);ym(a,r,i);let o=new t.ValueType(t.length*t.size),s=0;for(let e=0;e<i;e++){for(;s+1<r.length&&a[bm(r,s+1)]<=e;)s++;let n=a[bm(r,s)],i=e*t.size;o[i]=s,o[i+1]=e-n}return n.write(o),{success:!0,value:o}};function ym(e,t,n){if(t.length<1)throw Error(`segmentedMap segments must contain at least one segment start`);let r=0;for(let n=0;n<t.length;n++){let i=e[bm(t,n)];if(n===0&&i!==0)throw Error(`segmentedMap segments must start at 0, got ${i}`);if(n>0&&i<r)throw Error(`segmentedMap segments must be non-decreasing, got ${i} after ${r}`);r=i}if(r>n)throw Error(`segmentedMap last segment start must be <= vertexCount, got ${r} > ${n}`)}function bm(e,t){return e.offset/e.ValueType.BYTES_PER_ELEMENT+t*(e.stride/e.ValueType.BYTES_PER_ELEMENT)}var xm=async({inputs:e,output:t,target:n})=>{let{condition:r,whenTrue:i,whenFalse:a}=e,o=new t.ValueType(t.length*t.size);for(let e=0;e<t.length;e++){let n=z(r,e),s=z(i,e),c=z(a,e);for(let l=0;l<t.size;l++){let u=Sm(n,r.size,l);o[e*t.size+l]=u===0?Sm(c,a.size,l):Sm(s,i.size,l)}}return n.write(o),{success:!0,value:o}};function Sm(e,t,n){return n<t?e[n]:t===1?e[0]:0}var Cm=({inputs:e,output:t,target:n})=>{let r=new t.ValueType(t.length);for(let n=0;n<t.length;n++)r[n]=e.start+n*e.step;return n.write(r),{success:!0,value:r}},wm=({inputs:e,output:t,target:n})=>{let{columns:r}=e;return am({func:(e,t)=>{for(let n=0;n<r.length;n++)e[n]=t[r[n]]},inputs:{x:e.x},output:t,outputBuffer:n})},Tm=e({arithmetic:()=>sm,dot:()=>hm,equalAll:()=>gm,extent:()=>um,fround:()=>dm,gather:()=>fm,interleave:()=>mm,length:()=>_m,segmentedMap:()=>vm,select:()=>xm,sequence:()=>Cm,swizzle:()=>wm}),Em=new class{_modules={cpu:Tm};add(e,n){let r=this._modules[e];if(typeof n.then==`function`){let i=Promise.all([Promise.resolve(r||{}),n]).then(([e,t])=>({...e,...t}));return this._modules[e]=i,i.then(t=>{this._modules[e]=t}).catch(n=>{t.error(`Failed to register ${e} backend: ${n}`)()}),i}if(r&&typeof r.then==`function`){let i=Promise.resolve(r).then(e=>({...e,...n})).then(t=>(this._modules[e]=t,t)).catch(n=>{throw t.error(`Failed to register ${e} backend: ${n}`)(),n});return this._modules[e]=i,i}let i={...r||{},...n};return this._modules[e]=i,Promise.resolve(i)}async get(e,t){let n=this._modules[e];if(!n)if(e===`webgl`)n=this.add(`webgl`,et(()=>import(`./webgl-DsdTykkJ.js`),__vite__mapDeps([7,3,1,8,9,6,10,4,11])));else if(e===`webgpu`)n=this.add(`webgpu`,et(()=>import(`./webgpu-BGeZZ9qZ.js`),__vite__mapDeps([12,1,13,9,8,6])));else throw Error(`${e} backend not registered`);let r=(await n)[t];if(typeof r!=`function`)throw Error(`${e} backend does not implement ${t}`);return r}getSync(e,t){let n=this._modules[e];if(!n)throw Error(`${e} backend not registered`);if(typeof n.then==`function`)throw Error(`${e} backend is not loaded yet`);let r=n[t];if(typeof r!=`function`)throw Error(`${e} backend does not implement ${t}`);return r}clear(){this._modules={}}},Dm=class{inputs;dependencies;constructor(e){this.inputs=e,this.dependencies=Array.from(e instanceof Array?e:Object.values(e)).filter(e=>e instanceof T)}async execute(e,t){return await this._resolveDependencies(e),await this._executeWithHandler(await Em.get(this._getHandlerRegistry(e),this.name),t)}executeSync(e,t){this._resolveDependenciesSync(e);let n=this._executeWithHandler(Em.getSync(this._getHandlerRegistry(e),this.name),t);if(Om(n))throw Error(`${this.name} returned a Promise in executeSync()`);return n}shouldExecuteOnCPU(){return this.output.length<=1&&Array.from(this.dependencies).every(e=>!!e.value)}_getHandlerRegistry(e){return this.shouldExecuteOnCPU()?`cpu`:e.type}async _resolveDependencies(e){for(let t of this.dependencies)await t.evaluate(e);if(this._getHandlerRegistry(e)===`cpu`||e.type===`null`)for(let e of this.dependencies)await e.ensureCPUValue()}_resolveDependenciesSync(e){for(let t of this.dependencies)t.evaluateSync(e);if(this._getHandlerRegistry(e)===`cpu`||e.type===`null`)for(let e of this.dependencies)e.ensureCPUValueSync()}_executeWithHandler(e,t){return e({device:t.device,inputs:this.inputs,output:this.output,target:t})}};function Om(e){return typeof e?.then==`function`}function km(...e){let t=Am(e.map(e=>e.type));return t[0]!==`f`&&e.some(e=>e.normalized)&&(t=`float32`),{isConstant:e.every(e=>e.isConstant),type:t,size:e.reduce((e,t)=>Math.max(e,t.size),0),length:e.reduce((e,t)=>Math.max(e,t.length),0)}}function Am(e){let t=0,n=0;for(let r of e){if(r[0]===`f`)return`float32`;let e=r.endsWith(`8`)?8:r.endsWith(`6`)?16:32;r[0]===`u`?t=Math.max(t,e):n=Math.max(n,e)}return t&&!n?`uint${t}`:n&&t<32?`sint${Math.max(n,t*2)}`:`float32`}var jm=class extends Dm{name=`interleave`;output;constructor(e){super(e);let{isConstant:t,type:n,length:r}=km(...e);this.output=new T({isConstant:t,type:n,size:e.reduce((e,t)=>e+t.size,0),length:r,source:this})}toString(){return`_${this.inputs.join(`_`)}_`}};function Mm(...e){if(e.length===0)throw Error(`interleave() requires at least one input`);return e.length===1?ne(e[0]):new jm(e.map(ne)).output}function Nm(e,t){let n=Fm(t);for(let t of n)t.evaluateSync(e);return Pm(n),t}function Pm(e){let t=new Set(e.flatMap(zm)),n=new Set;for(let t of e)Rm(t,n);for(let e of n)e.evaluated&&!t.has(e.buffer)&&e.destroy()}function Fm(e){let t=new Set;return Im(e,t,new Set),Array.from(t)}function Im(e,t,n){if(Bm(e)){t.add(e);return}if(!(!e||typeof e!=`object`||n.has(e))){if(n.add(e),Array.isArray(e)){for(let r of e)Im(r,t,n);return}if(Lm(e))for(let r of Object.values(e))Im(r,t,n)}}function Lm(e){let t=Object.getPrototypeOf(e);return t===Object.prototype||t===null}function Rm(e,t){if(e instanceof nm){for(let n of e.gpuDataEvaluators)Rm(n,t);return}let n=e.source;if(n){if(n instanceof T){t.has(n)||(t.add(n),Rm(n,t));return}for(let e of n.dependencies)t.has(e)||(t.add(e),Rm(e,t))}}function zm(e){return e instanceof T?[e.buffer]:e.gpuVector.data.map(e=>e.buffer instanceof E?e.buffer.buffer:e.buffer)}function Bm(e){return e instanceof T||e instanceof nm}var Vm=class{constructor(e,{id:t,isTransitionAttribute:n}){this.packedBuffers={},this.device=e,this.id=t,this.isTransitionAttribute=n,this.device.type===`webgpu`&&Em.add(`webgpu`,{interleave:Ze})}hasGroups(e){return this.device.type===`webgpu`&&Object.values(e).some(e=>!!e.settings.bufferGroup)}finalize(){for(let e of Object.values(this.packedBuffers))e.packed.destroy();this.packedBuffers={}}getBufferLayouts(e,t){let n=this._getPackedGroups(e,t,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(e,n,t)}getBindings(e,t,n,r){let i=this._getPackedGroups(e,n,{requireValues:!0,excludeAttributes:r}),a={},o=new Set;for(let e of i.values()){let n=!this.packedBuffers[e.id]||e.attributes.some(e=>!!t[e.id]);a[e.id]=this._getPackedBuffer(e,n);for(let t of e.attributes)o.add(t.id)}return{bufferLayouts:this._getBufferLayouts(e,i,n).filter(t=>!r[t.name]&&!e[t.name]?.settings.isIndexed),buffers:a,groupedAttributeIds:o}}_getPackedGroups(e,t,{requireValues:n,excludeAttributes:r}){let i=new Map;for(let t of Object.values(e)){let e=t.settings.bufferGroup;if(!e)continue;let n=i.get(e)||[];n.push(t),i.set(e,n)}let a=new Map;for(let[e,o]of i){let i=this._getPackedGroup(e,o,t,n,r);i&&a.set(e,i)}return a}_getPackedGroup(e,t,n,r,i){if(t.length<2)return null;let a=t.map(e=>e.getBufferLayout(n)),o=a[0].stepMode,s=Math.max(1,t[0].numInstances),c=r&&t.every(e=>e.isConstant);for(let e=0;e<t.length;e++){let n=t[e],c=n.getAccessor(),l=c.size*c.bytesPerElement;if(i[n.id]||n.settings.isIndexed||n.settings.noAlloc||n.doublePrecision||this.isTransitionAttribute(n.id)||a[e].stepMode!==o||n.numInstances!==t[0].numInstances||(c.offset||0)!==0||(c.vertexOffset||0)!==0||Bp(c)!==l||r&&(n.isConstant?!n.getConstantValue()||n.getConstantValue().byteLength<l:!ArrayBuffer.isView(n.value)||n.value.byteLength<s*l))return null}let l={},u=[],d=0;for(let e=0;e<t.length;e++){let n=t[e];d=Hm(d),l[n.id]=d;for(let t of a[e].attributes||[])u.push({...t,byteOffset:d+(t.byteOffset||0)});d+=Bp(n.getAccessor())}return d=Hm(d),{id:e,attributes:t,byteStride:d,byteOffsets:l,rowCount:s,layout:{name:e,byteStride:c?0:d,stepMode:o,attributes:u}}}_getBufferLayouts(e,t,n){let r=[],i=new Set,a=new Set;for(let e of t.values())for(let t of e.attributes)a.add(t.id);for(let o of Object.values(e)){let e=o.settings.bufferGroup,s=e&&t.get(e);s&&a.has(o.id)?i.has(s.id)||(r.push(s.layout),i.add(s.id)):r.push(o.getBufferLayout(n))}return r}_getPackedBuffer(e,t){let n=JSON.stringify({byteStride:e.layout.byteStride,attributes:e.layout.attributes}),r=this.packedBuffers[e.id];if((!r||r.layoutKey!==n)&&(t=!0),t){r&&(r.packed.destroy(),delete this.packedBuffers[e.id]);let t=this._interleavePackedGroup(e);return this.packedBuffers[e.id]={packed:t,layoutKey:n},t.buffer}if(!r)throw Error(`Attribute buffer group ${e.id} has no packed buffer`);return r.packed.buffer}_interleavePackedGroup(e){let t=Mm(...e.attributes.map(t=>this._getInterleaveInput(e,t)));return Nm(this.device,t),t}_getInterleaveInput(e,t){let n=Bp(t.getAccessor()),r=e.byteOffsets[t.id];if(Um(`${e.id}.${t.id} rowByteLength`,n),Um(`${e.id}.${t.id} groupByteOffset`,r),t.isConstant){let r=t.getConstantValue();if(!r)throw Error(`Attribute group ${e.id} is missing constant value ${t.id}`);return Um(`${e.id}.${t.id} constant byteOffset`,r.byteOffset),new T({id:t.id,type:`uint32`,size:n/4,isConstant:!0,value:new Uint32Array(r.buffer,r.byteOffset,n/Uint32Array.BYTES_PER_ELEMENT)})}let i=t.getBuffer(),a=t.byteOffset,o=t.getAccessor().stride||n;if(Um(`${e.id}.${t.id} byteOffset`,a),Um(`${e.id}.${t.id} stride`,o),!i)throw Error(`Attribute group ${e.id} cannot interleave missing buffer ${t.id}`);return new T({id:t.id,type:`uint32`,size:n/4,offset:a,stride:o,length:e.rowCount,buffer:i})}};function Hm(e){return Math.ceil(e/4)*4}function Um(e,t){if(t%4!=0)throw Error(`Attribute buffer groups require 32-bit alignment: ${e}=${t}`)}function Wm(e){let{source:t,target:n,start:r=0,size:i,getData:a}=e,o=e.end||n.length,s=t.length,c=o-r;if(s>c){n.set(t.subarray(0,c),r);return}if(n.set(t,r),!a)return;let l=s;for(;l<c;){let e=a(l,t);for(let t=0;t<i;t++)n[r+l]=e[t]||0,l++}}function Gm({source:e,target:t,size:n,getData:r,sourceStartIndices:i,targetStartIndices:a}){if(!i||!a)return Wm({source:e,target:t,size:n,getData:r}),t;let o=0,s=0,c=r&&((e,t)=>r(e+s,t)),l=Math.min(i.length,a.length);for(let r=1;r<l;r++){let l=i[r]*n,u=a[r]*n;Wm({source:e.subarray(o,l),target:t,start:s,end:u,size:n,getData:c}),o=l,s=u}return s<t.length&&Wm({source:[],target:t,start:s,size:n,getData:c}),t}function Km(e){let{device:t,settings:n,value:r}=e,i=new tm(t,n);return i.setData({value:r instanceof Float64Array?new Float64Array:new Float32Array,normalized:n.normalized}),i}function qm(e){switch(e){case 1:return`float`;case 2:return`vec2`;case 3:return`vec3`;case 4:return`vec4`;default:throw Error(`No defined attribute type for size "${e}"`)}}function Jm(e){switch(e){case 1:return`float32`;case 2:return`float32x2`;case 3:return`float32x3`;case 4:return`float32x4`;default:throw Error(`invalid type size`)}}function Ym(e){e.push(e.shift())}function Xm(e,t){let{settings:n,value:r,size:i}=e,a=e.isDoublePrecisionBuffer?2:1,o=0,{shaderAttributes:s}=e.settings;if(s)for(let e of Object.values(s))o=Math.max(o,e.vertexOffset??0);return(n.noAlloc?r.length:(t+o)*i)*a}function Zm({device:e,source:t,target:n}){return(!n||n.byteLength<t.byteLength)&&(n?.destroy(),n=e.createBuffer({byteLength:t.byteLength,usage:t.usage})),n}function Qm({device:e,buffer:t,attribute:n,fromLength:r,toLength:i,fromStartIndices:a,getData:o=e=>e}){let s=n.isDoublePrecisionBuffer?2:1,c=n.size*s,l=n.byteOffset,u=n.settings.bytesPerElement<4?l/n.settings.bytesPerElement*4:l,d=n.startIndices,f=a&&d,p=n.isConstant;if(!f&&t&&r>=i)return t;let m=n.value instanceof Float64Array?Float32Array:n.value.constructor,h=p?n.value:new m(n.getBuffer().readSyncWebGL(l,i*m.BYTES_PER_ELEMENT).buffer);if(n.settings.normalized&&!p){let e=o;o=(t,r)=>n.normalizeConstant(e(t,r))}let g=p?(e,t)=>o(h,t):(e,t)=>o(h.subarray(e+l,e+l+c),t),_=t?new Float32Array(t.readSyncWebGL(u,r*4).buffer):new Float32Array,v=new Float32Array(i);return Gm({source:_,target:v,sourceStartIndices:a,targetStartIndices:d,size:c,getData:g}),(!t||t.byteLength<v.byteLength+u)&&(t?.destroy(),t=e.createBuffer({byteLength:v.byteLength+u,usage:35050})),t.write(v,u),t}var $m=class{constructor({device:e,attribute:t,timeline:n}){this.buffers=[],this.currentLength=0,this.device=e,this.transition=new vf(n),this.attribute=t,this.attributeInTransition=Km(t),this.currentStartIndices=t.startIndices}get inProgress(){return this.transition.inProgress}start(e,t,n=1/0){this.settings=e,this.currentStartIndices=this.attribute.startIndices,this.currentLength=Xm(this.attribute,t),this.transition.start({...e,duration:n})}update(){let e=this.transition.update();return e&&this.onUpdate(),e}setBuffer(e){let{stride:t}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:e,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:t})}cancel(){this.transition.cancel()}delete(){this.cancel();for(let e of this.buffers)e.destroy();this.buffers.length=0}},eh=class extends $m{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type=`interpolation`,this.transform=ah(e,t)}start(e,t){let n=this.currentLength,r=this.currentStartIndices;if(super.start(e,t,e.duration),e.duration<=0){this.transition.cancel();return}let{buffers:i,attribute:a}=this;Ym(i),i[0]=Qm({device:this.device,buffer:i[0],attribute:a,fromLength:n,toLength:this.currentLength,fromStartIndices:r,getData:e.enter}),i[1]=Zm({device:this.device,source:i[0],target:i[1]}),this.setBuffer(i[1]);let{transform:o}=this,s=o.model,c=Math.floor(this.currentLength/a.size);ih(a)&&(c/=2),s.setVertexCount(c),a.isConstant?(s.setAttributes({aFrom:i[0]}),s.setConstantAttributes({aTo:a.value})):s.setAttributes({aFrom:i[0],aTo:a.getBuffer()}),o.transformFeedback.setBuffers({vCurrent:i[1]})}onUpdate(){let{duration:e,easing:t}=this.settings,{time:n}=this.transition,r=n/e;t&&(r=t(r));let{model:i}=this.transform,a={time:r};i.shaderInputs.setProps({interpolation:a}),this.transform.run({discard:!0})}delete(){super.delete(),this.transform.destroy()}},th={name:`interpolation`,vs:`layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,uniformTypes:{time:`f32`}},nh=`#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,rh=`#version 300 es
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
`;function ih(e){return e.isDoublePrecisionBuffer}function ah(e,t){let n=t.size,r=qm(n),i=Jm(n),a=t.getBufferLayout();return ih(t)?new me(e,{vs:rh,bufferLayout:[{name:`aFrom`,byteStride:8*n,attributes:[{attribute:`aFrom`,format:i,byteOffset:0},{attribute:`aFrom64Low`,format:i,byteOffset:4*n}]},{name:`aTo`,byteStride:8*n,attributes:[{attribute:`aTo`,format:i,byteOffset:0},{attribute:`aTo64Low`,format:i,byteOffset:4*n}]}],modules:[vn,th],defines:{ATTRIBUTE_TYPE:r,ATTRIBUTE_SIZE:n},moduleSettings:{},varyings:[`vCurrent`,`vCurrent64Low`],bufferMode:35980,disableWarnings:!0}):new me(e,{vs:nh,bufferLayout:[{name:`aFrom`,format:i},{name:`aTo`,format:a.attributes[0].format}],modules:[th],defines:{ATTRIBUTE_TYPE:r},varyings:[`vCurrent`],disableWarnings:!0})}var oh=class extends $m{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type=`spring`,this.texture=dh(e),this.framebuffer=fh(e,this.texture),this.transform=uh(e,t)}start(e,t){let n=this.currentLength,r=this.currentStartIndices;super.start(e,t);let{buffers:i,attribute:a}=this;for(let t=0;t<2;t++)i[t]=Qm({device:this.device,buffer:i[t],attribute:a,fromLength:n,toLength:this.currentLength,fromStartIndices:r,getData:e.enter});i[2]=Zm({device:this.device,source:i[0],target:i[2]}),this.setBuffer(i[1]);let{model:o}=this.transform;o.setVertexCount(Math.floor(this.currentLength/a.size)),a.isConstant?o.setConstantAttributes({aTo:a.value}):o.setAttributes({aTo:a.getBuffer()})}onUpdate(){let{buffers:e,transform:t,framebuffer:n,transition:r}=this,i=this.settings;t.model.setAttributes({aPrev:e[0],aCur:e[1]}),t.transformFeedback.setBuffers({vNext:e[2]});let a={stiffness:i.stiffness,damping:i.damping};t.model.shaderInputs.setProps({spring:a}),t.run({framebuffer:n,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),Ym(e),this.setBuffer(e[1]),this.device.readPixelsToArrayWebGL(n)[0]>0||r.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}},sh={name:`spring`,vs:`layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,uniformTypes:{damping:`f32`,stiffness:`f32`}},ch=`#version 300 es
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
`,lh=`#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`;function uh(e,t){let n=qm(t.size),r=Jm(t.size);return new me(e,{vs:ch,fs:lh,bufferLayout:[{name:`aPrev`,format:r},{name:`aCur`,format:r},{name:`aTo`,format:t.getBufferLayout().attributes[0].format}],varyings:[`vNext`],modules:[sh],defines:{ATTRIBUTE_TYPE:n},parameters:{depthCompare:`always`,blendColorOperation:`max`,blendColorSrcFactor:`one`,blendColorDstFactor:`one`,blendAlphaOperation:`max`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one`}})}function dh(e){return e.createTexture({data:new Uint8Array(4),format:`rgba8unorm`,width:1,height:1})}function fh(e,t){return e.createFramebuffer({id:`spring-transition-is-transitioning-framebuffer`,width:1,height:1,colorAttachments:[t]})}var ph={interpolation:eh,spring:oh},mh=class{constructor(e,{id:t,timeline:n}){if(!e)throw Error(`AttributeTransitionManager is constructed without device`);this.id=t,this.device=e,this.timeline=n,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let e in this.transitions)this._removeTransition(e)}update({attributes:e,transitions:t,numInstances:n}){this.numInstances=n||1;for(let n in e){let r=e[n],i=r.getTransitionSetting(t);i&&this._updateAttribute(n,r,i)}for(let n in this.transitions){let r=e[n];(!r||!r.getTransitionSetting(t))&&this._removeTransition(n)}}hasAttribute(e){let t=this.transitions[e];return t&&t.inProgress}getAttributes(){let e={};for(let t in this.transitions){let n=this.transitions[t];n.inProgress&&(e[t]=n.attributeInTransition)}return e}run(){if(this.numInstances===0)return!1;for(let e in this.transitions)this.transitions[e].update()&&(this.needsRedraw=!0);let e=this.needsRedraw;return this.needsRedraw=!1,e}_removeTransition(e){this.transitions[e].delete(),delete this.transitions[e]}_updateAttribute(e,t,n){let r=this.transitions[e],i=!r||r.type!==n.type;if(i){r&&this._removeTransition(e);let a=ph[n.type];a?this.transitions[e]=new a({attribute:t,timeline:this.timeline,device:this.device}):(j.error(`unsupported transition type '${n.type}'`)(),i=!1)}(i||t.needsRedraw())&&(this.needsRedraw=!0,this.transitions[e].start(n,this.numInstances))}},hh=`attributeManager.invalidate`,gh=`attributeManager.updateStart`,_h=`attributeManager.updateEnd`,vh=`attribute.updateStart`,yh=`attribute.allocate`,bh=`attribute.updateEnd`,xh=class{constructor(e,{id:t=`attribute-manager`,stats:n,timeline:r}={}){this.mergeBoundsMemoized=wl(Td),this.id=t,this.device=e,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=n,this.attributeTransitionManager=new mh(e,{id:`${t}-transitions`,timeline:r}),this.attributeBufferGroups=e.type===`webgpu`?new Vm(e,{id:t,isTransitionAttribute:e=>this.attributeTransitionManager.hasAttribute(e)}):null,Object.seal(this)}finalize(){this.attributeBufferGroups?.finalize();for(let e in this.attributes)this.attributes[e].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(e={clearRedrawFlags:!1}){let t=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!e.clearRedrawFlags,t&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(e){this._add(e)}addInstanced(e){this._add(e,{stepMode:`instance`})}remove(e){for(let t of e)this.attributes[t]!==void 0&&(this.attributes[t].delete(),delete this.attributes[t])}invalidate(e,t){let n=this._invalidateTrigger(e,t);M(hh,this,e,n)}invalidateAll(e){for(let t in this.attributes)this.attributes[t].setNeedsUpdate(t,e);M(hh,this,`all`)}update({data:e,numInstances:t,startIndices:n=null,transitions:r,props:i={},buffers:a={},context:o={}}){let s=!1;M(gh,this),this.stats&&this.stats.get(`Update Attributes`).timeStart();for(let r in this.attributes){let c=this.attributes[r],l=c.settings.accessor;c.startIndices=n,c.numInstances=t,i[r]&&j.removed(`props.${r}`,`data.attributes.${r}`)(),c.setExternalBuffer(a[r])||c.setBinaryValue(typeof l==`string`?a[l]:void 0,e.startIndices)||typeof l==`string`&&!a[l]&&c.setConstantValue(o,i[l])||c.needsUpdate()&&(s=!0,this._updateAttribute({attribute:c,numInstances:t,data:e,props:i,context:o})),this.needsRedraw=this.needsRedraw||c.needsRedraw()}s&&M(_h,this,t),this.stats&&(this.stats.get(`Update Attributes`).timeEnd(),s&&this.stats.get(`Attributes updated`).incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:t,transitions:r})}updateTransition(){let{attributeTransitionManager:e}=this,t=e.run();return this.needsRedraw=this.needsRedraw||t,t}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getBounds(e){let t=e.map(e=>this.attributes[e]?.getBounds());return this.mergeBoundsMemoized(t)}getChangedAttributes(e={clearChangedFlags:!1}){let{attributes:t,attributeTransitionManager:n}=this,r={...n.getAttributes()};for(let i in t){let a=t[i];a.needsRedraw(e)&&!n.hasAttribute(i)&&(r[i]=a)}return r}getBufferLayouts(e){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),e):Object.values(this.getAttributes()).map(t=>t.getBufferLayout(e))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(e,t,n={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),e,t,n):{bufferLayouts:this.getBufferLayouts(t),buffers:{},groupedAttributeIds:new Set}}_add(e,t){for(let n in e){let r=e[n],i={...r,id:n,size:r.isIndexed&&1||r.size||1,...t};this.attributes[n]=new tm(this.device,i)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let e={};for(let t in this.attributes)this.attributes[t].getUpdateTriggers().forEach(n=>{e[n]||(e[n]=[]),e[n].push(t)});this.updateTriggers=e}_invalidateTrigger(e,t){let{attributes:n,updateTriggers:r}=this,i=r[e];return i&&i.forEach(e=>{let r=n[e];r&&r.setNeedsUpdate(r.id,t)}),i}_updateAttribute(e){let{attribute:t,numInstances:n}=e;if(M(vh,t),t.constant){t.setConstantValue(e.context,t.value);return}t.allocate(n)&&M(yh,t,n),t.updateBuffer(e)&&(this.needsRedraw=!0,M(bh,t,n))}},Sh=class extends vf{get value(){return this._value}_onUpdate(){let{time:e,settings:{fromValue:t,toValue:n,duration:r,easing:i}}=this;this._value=Ue(t,n,i(e/r))}},Ch=1e-5;function wh(e,t,n,r,i){let a=t-e;return(n-t)*i+-a*r+a+t}function Th(e,t,n,r,i){if(Array.isArray(n)){let a=[];for(let o=0;o<n.length;o++)a[o]=wh(e[o],t[o],n[o],r,i);return a}return wh(e,t,n,r,i)}function Eh(e,t){if(Array.isArray(e)){let n=0;for(let r=0;r<e.length;r++){let i=e[r]-t[r];n+=i*i}return Math.sqrt(n)}return Math.abs(e-t)}var Dh={interpolation:Sh,spring:class extends vf{get value(){return this._currValue}_onUpdate(){let{fromValue:e,toValue:t,damping:n,stiffness:r}=this.settings,{_prevValue:i=e,_currValue:a=e}=this,o=Th(i,a,t,n,r),s=Eh(o,t),c=Eh(o,a);s<Ch&&c<Ch&&(o=t,this.end()),this._prevValue=a,this._currValue=o}}},Oh=class{constructor(e){this.transitions=new Map,this.timeline=e}get active(){return this.transitions.size>0}add(e,t,n,r){let{transitions:i}=this;if(i.has(e)){let n=i.get(e),{value:r=n.settings.fromValue}=n;t=r,this.remove(e)}if(r=em(r),!r)return;let a=Dh[r.type];if(!a){j.error(`unsupported transition type '${r.type}'`)();return}let o=new a(this.timeline);o.start({...r,fromValue:t,toValue:n}),i.set(e,o)}remove(e){let{transitions:t}=this;t.has(e)&&(t.get(e).cancel(),t.delete(e))}update(){let e={};for(let[t,n]of this.transitions)n.update(),e[t]=n.value,n.inProgress||this.remove(t);return e}clear(){for(let e of this.transitions.keys())this.remove(e)}};function kh(e){let t=e[Wd];for(let n in t){let r=t[n],{validate:i}=r;if(i&&!i(e[n],r))throw Error(`Invalid prop ${n}: ${e[n]}`)}}function Ah(e,t){let n=Mh({newProps:e,oldProps:t,propTypes:e[Wd],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),r=Ph(e,t),i=!1;return r||(i=Fh(e,t)),{dataChanged:r,propsChanged:n,updateTriggersChanged:i,extensionsChanged:Ih(e,t),transitionsChanged:jh(e,t)}}function jh(e,t){if(!e.transitions)return!1;let n={},r=e[Wd],i=!1;for(let a in e.transitions){let o=r[a],s=o&&o.type;(s===`number`||s===`color`||s===`array`)&&Nh(e[a],t[a],o)&&(n[a]=!0,i=!0)}return i?n:!1}function Mh({newProps:e,oldProps:t,ignoreProps:n={},propTypes:r={},triggerName:i=`props`}){if(t===e)return!1;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return`${i} changed shallowly`;for(let a of Object.keys(e))if(!(a in n)){if(!(a in t))return`${i}.${a} added`;let n=Nh(e[a],t[a],r[a]);if(n)return`${i}.${a} ${n}`}for(let a of Object.keys(t))if(!(a in n)){if(!(a in e))return`${i}.${a} dropped`;if(!Object.hasOwnProperty.call(e,a)){let n=Nh(e[a],t[a],r[a]);if(n)return`${i}.${a} ${n}`}}return!1}function Nh(e,t,n){let r=n&&n.equal;return r&&!r(e,t,n)||!r&&(r=e&&t&&e.equals,r&&!r.call(e,t))?`changed deeply`:!r&&t!==e?`changed shallowly`:null}function Ph(e,t){if(t===null)return`oldProps is null, initial diff`;let n=!1,{dataComparator:r,_dataDiff:i}=e;return r?r(e.data,t.data)||(n=`Data comparator detected a change`):e.data!==t.data&&(n=`A new data container was supplied`),n&&i&&(n=i(e.data,t.data)||n),n}function Fh(e,t){if(t===null||`all`in e.updateTriggers&&Lh(e,t,`all`))return{all:!0};let n={},r=!1;for(let i in e.updateTriggers)i!==`all`&&Lh(e,t,i)&&(n[i]=!0,r=!0);return r?n:!1}function Ih(e,t){if(t===null)return!0;let n=t.extensions,{extensions:r}=e;if(r===n)return!1;if(!n||!r||r.length!==n.length)return!0;for(let e=0;e<r.length;e++)if(!r[e].equals(n[e]))return!0;return!1}function Lh(e,t,n){let r=e.updateTriggers[n];r??={};let i=t.updateTriggers[n];return i??={},Mh({oldProps:i,newProps:r,triggerName:n})}var Rh=`count(): argument not an object`,zh=`count(): argument not a container`;function Bh(e){if(!Hh(e))throw Error(Rh);if(typeof e.count==`function`)return e.count();if(Number.isFinite(e.size))return e.size;if(Number.isFinite(e.length))return e.length;if(Vh(e))return Object.keys(e).length;throw Error(zh)}function Vh(e){return typeof e==`object`&&!!e&&e.constructor===Object}function Hh(e){return typeof e==`object`&&!!e}function Uh(e,t){if(!t)return e;let n={...e,...t};if(`defines`in t&&(n.defines={...e.defines,...t.defines}),`modules`in t&&(n.modules=(e.modules||[]).concat(t.modules),t.modules.some(e=>e.name===`project64`))){let e=n.modules.findIndex(e=>e.name===`project32`);e>=0&&n.modules.splice(e,1)}if(`inject`in t)if(!e.inject)n.inject=t.inject;else{let r={...e.inject};for(let e in t.inject)r[e]=(r[e]||``)+t.inject[e];n.inject=r}return n}var Wh={minFilter:`linear`,mipmapFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},Gh={};function Kh(e,t,n,r){if(n instanceof g)return n;n.constructor&&n.constructor.name!==`Object`&&(n={data:n});let i=null;n.compressed&&(i={minFilter:`linear`,mipmapFilter:n.data.length>1?`nearest`:`linear`});let{width:a,height:o}=n.data,s=t.createTexture({...n,sampler:{...Wh,...i,...r},mipLevels:t.getMipLevelCount(a,o)});return t.type===`webgl`?s.generateMipmapsWebGL():t.type===`webgpu`&&t.generateMipmapsWebGPU(s),Gh[s.id]=e,s}function qh(e,t){!t||!(t instanceof g)||Gh[t.id]===e&&(t.delete(),delete Gh[t.id])}var Jh={boolean:{validate(e,t){return!0},equal(e,t,n){return!!e==!!t}},number:{validate(e,t){return Number.isFinite(e)&&(!(`max`in t)||e<=t.max)&&(!(`min`in t)||e>=t.min)}},color:{validate(e,t){return t.optional&&!e||Qh(e)&&(e.length===3||e.length===4)},equal(e,t,n){return L(e,t,1)}},accessor:{validate(e,t){let n=$h(e);return n===`function`||n===$h(t.value)},equal(e,t,n){return typeof t==`function`?!0:L(e,t,1)}},array:{validate(e,t){return t.optional&&!e||Qh(e)},equal(e,t,n){let{compare:r}=n;return r?L(e,t,Number.isInteger(r)?r:r?1:0):e===t}},object:{equal(e,t,n){if(n.ignore)return!0;let{compare:r}=n;return r?L(e,t,Number.isInteger(r)?r:r?1:0):e===t}},function:{validate(e,t){return t.optional&&!e||typeof e==`function`},equal(e,t,n){return!n.compare&&n.ignore!==!1||e===t}},data:{transform:(e,t,n)=>{if(!e)return e;let{dataTransform:r}=n.props;return r?r(e):typeof e.shape==`string`&&e.shape.endsWith(`-table`)&&Array.isArray(e.data)?e.data:e}},image:{transform:(e,t,n)=>{let r=n.context;return!r||!r.device?null:Kh(n.id,r.device,e,{...t.parameters,...n.props.textureParameters})},release:(e,t,n)=>{qh(n.id,e)}}};function Yh(e){let t={},n={},r={};for(let[i,a]of Object.entries(e)){let e=a?.deprecatedFor;if(e)r[i]=Array.isArray(e)?e:[e];else{let e=Xh(i,a);t[i]=e,n[i]=e.value}}return{propTypes:t,defaultProps:n,deprecatedProps:r}}function Xh(e,t){switch($h(t)){case`object`:return Zh(e,t);case`array`:return Zh(e,{type:`array`,value:t,compare:!1});case`boolean`:return Zh(e,{type:`boolean`,value:t});case`number`:return Zh(e,{type:`number`,value:t});case`function`:return Zh(e,{type:`function`,value:t,compare:!0});default:return{name:e,type:`unknown`,value:t}}}function Zh(e,t){return`type`in t?{name:e,...Jh[t.type],...t}:`value`in t?{name:e,type:$h(t.value),...t}:{name:e,type:`object`,value:t}}function Qh(e){return Array.isArray(e)||ArrayBuffer.isView(e)}function $h(e){return Qh(e)?`array`:e===null?`null`:typeof e}function eg(e,t){let n;for(let e=t.length-1;e>=0;e--){let r=t[e];`extensions`in r&&(n=r.extensions)}let r=ng(e.constructor,n),i=Object.create(r);i[Ud]=e,i[qd]={},i[Jd]={};for(let e=0;e<t.length;++e){let n=t[e];for(let e in n)i[e]=n[e]}return Object.freeze(i),i}var tg=`_mergedDefaultProps`;function ng(e,t){if(!(e instanceof fg.constructor))return{};let n=tg;if(t)for(let e of t){let t=e.constructor;t&&(n+=`:${t.extensionName||t.name}`)}return lg(e,n)||(e[n]=rg(e,t||[]))}function rg(e,t){if(!e.prototype)return null;let n=ng(Object.getPrototypeOf(e)),r=Yh(lg(e,`defaultProps`)||{}),i=Object.assign(Object.create(null),n,r.defaultProps),a=Object.assign(Object.create(null),n?.[Wd],r.propTypes),o=Object.assign(Object.create(null),n?.[Gd],r.deprecatedProps);for(let e of t){let t=ng(e.constructor);t&&(Object.assign(i,t),Object.assign(a,t[Wd]),Object.assign(o,t[Gd]))}return ig(i,e),og(i,a),ag(i,o),i[Wd]=a,i[Gd]=o,t.length===0&&!cg(e,`_propTypes`)&&(e._propTypes=a),i}function ig(e,t){let n=ug(t);Object.defineProperties(e,{id:{writable:!0,value:n}})}function ag(e,t){for(let n in t)Object.defineProperty(e,n,{enumerable:!1,set(e){let r=`${this.id}: ${n}`;for(let r of t[n])cg(this,r)||(this[r]=e);j.deprecated(r,t[n].join(`/`))()}})}function og(e,t){let n={},r={};for(let e in t){let i=t[e],{name:a,value:o}=i;i.async&&(n[a]=o,r[a]=sg(a))}e[Kd]=n,e[qd]={},Object.defineProperties(e,r)}function sg(e){return{enumerable:!0,set(t){typeof t==`string`||t instanceof Promise||Jp(t)?this[qd][e]=t:this[Jd][e]=t},get(){if(this[Jd]){if(e in this[Jd])return this[Jd][e]||this[Kd][e];if(e in this[qd]){let t=this[Ud]&&this[Ud].internalState;if(t&&t.hasAsyncProp(e))return t.getAsyncProp(e)||this[Kd][e]}}return this[Kd][e]}}}function cg(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function lg(e,t){return cg(e,t)&&e[t]}function ug(e){let t=e.componentName;return t||j.warn(`${e.name}.componentName not specified`)(),t||e.name}var dg=0,fg=class{constructor(...e){this.props=eg(this,e),this.id=this.props.id,this.count=dg++}clone(e){let{props:t}=this,n={};for(let e in t[Kd])e in t[Jd]?n[e]=t[Jd][e]:e in t[qd]&&(n[e]=t[qd][e]);return new this.constructor({...t,...n,...e})}};fg.componentName=`Component`,fg.defaultProps={};var pg=Object.freeze({}),mg=class{constructor(e){this.component=e,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let e in this.asyncProps){let t=this.asyncProps[e];t&&t.type&&t.type.release&&t.type.release(t.resolvedValue,t.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||pg}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(e){return e in this.asyncProps}getAsyncProp(e){let t=this.asyncProps[e];return t&&t.resolvedValue}isAsyncPropLoading(e){if(e){let t=this.asyncProps[e];return!!(t&&t.pendingLoadCount>0&&t.pendingLoadCount!==t.resolvedLoadCount)}for(let e in this.asyncProps)if(this.isAsyncPropLoading(e))return!0;return!1}reloadAsyncProp(e,t){this._watchPromise(e,Promise.resolve(t))}setAsyncProps(e){this.component=e[Ud]||this.component;let t=e[Jd]||{},n=e[qd]||e,r=e[Kd]||{};for(let e in t){let n=t[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,n),t[e]=this.getAsyncProp(e)}for(let e in n){let t=n[e];this._createAsyncPropData(e,r[e]),this._updateAsyncProp(e,t)}}_fetch(e,t){return null}_onResolve(e,t){}_onError(e,t){}_updateAsyncProp(e,t){if(this._didAsyncInputValueChange(e,t)){if(typeof t==`string`&&(t=this._fetch(e,t)),t instanceof Promise){this._watchPromise(e,t);return}if(Jp(t)){this._resolveAsyncIterable(e,t);return}this._setPropValue(e,t)}}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps){this.oldAsyncProps=Object.create(this.oldProps);for(let e in this.asyncProps)Object.defineProperty(this.oldAsyncProps,e,{enumerable:!0,value:this.oldProps[e]})}}_didAsyncInputValueChange(e,t){let n=this.asyncProps[e];return t===n.resolvedValue||t===n.lastValue?!1:(n.lastValue=t,!0)}_setPropValue(e,t){this._freezeAsyncOldProps();let n=this.asyncProps[e];n&&(t=this._postProcessValue(n,t),n.resolvedValue=t,n.pendingLoadCount++,n.resolvedLoadCount=n.pendingLoadCount)}_setAsyncPropValue(e,t,n){let r=this.asyncProps[e];r&&n>=r.resolvedLoadCount&&t!==void 0&&(this._freezeAsyncOldProps(),r.resolvedValue=t,r.resolvedLoadCount=n,this.onAsyncPropUpdated(e,t))}_watchPromise(e,t){let n=this.asyncProps[e];if(n){n.pendingLoadCount++;let r=n.pendingLoadCount;t.then(t=>{this.component&&(t=this._postProcessValue(n,t),this._setAsyncPropValue(e,t,r),this._onResolve(e,t))}).catch(t=>{this._onError(e,t)})}}async _resolveAsyncIterable(e,t){if(e!==`data`){this._setPropValue(e,t);return}let n=this.asyncProps[e];if(!n)return;n.pendingLoadCount++;let r=n.pendingLoadCount,i=[],a=0;for await(let n of t){if(!this.component)return;let{dataTransform:t}=this.component.props;i=t?t(n,i):i.concat(n),Object.defineProperty(i,`__diff`,{enumerable:!1,value:[{startRow:a,endRow:i.length}]}),a=i.length,this._setAsyncPropValue(e,i,r)}this._onResolve(e,i)}_postProcessValue(e,t){let n=e.type;return n&&this.component&&(n.release&&n.release(e.resolvedValue,n,this.component),n.transform)?n.transform(t,n,this.component):t}_createAsyncPropData(e,t){if(!this.asyncProps[e]){let n=this.component&&this.component.props[Wd];this.asyncProps[e]={type:n&&n[e],lastValue:null,resolvedValue:t,pendingLoadCount:0,resolvedLoadCount:0}}}},hg=class extends mg{constructor({attributeManager:e,layer:t}){super(t),this.attributeManager=e,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}_fetch(e,t){let n=this.layer,r=n?.props.fetch;return r?r(t,{propName:e,layer:n}):super._fetch(e,t)}_onResolve(e,t){let n=this.layer;if(n){let r=n.props.onDataLoad;e===`data`&&r&&r(t,{propName:e,layer:n})}}_onError(e,t){let n=this.layer;n&&n.raiseError(t,`loading ${e} of ${this.layer}`)}},gg=`layer.changeFlag`,_g=`layer.initialize`,vg=`layer.update`,yg=`layer.finalize`,bg=`layer.matched`,xg=2**24-1,Sg=Object.freeze([]),Cg=wl(({oldViewport:e,viewport:t})=>e.equals(t)),wg=new Uint8ClampedArray;function Tg(e){return e.rowIndexes||e.pickingColors||e.instancePickingColors}function Eg(e){return e.rowIndexes}function Dg(e){return e.pickingColors||e.instancePickingColors}var Og={data:{type:`data`,value:Sg,async:!0},dataComparator:{type:`function`,value:null,optional:!0},_dataDiff:{type:`function`,value:e=>e&&e.__diff,optional:!0},dataTransform:{type:`function`,value:null,optional:!0},onDataLoad:{type:`function`,value:null,optional:!0},onError:{type:`function`,value:null,optional:!0},fetch:{type:`function`,value:(e,{propName:t,layer:n,loaders:r,loadOptions:i,signal:a})=>{let{resourceManager:o}=n.context;i||=n.getLoadOptions(),r||=n.props.loaders,a&&(i={...i,core:{...i?.core,fetch:{...i?.core?.fetch,signal:a}}});let s=o.contains(e);return!s&&!i&&(o.add({resourceId:e,data:Mo(e,r),persistent:!1}),s=!0),s?o.subscribe({resourceId:e,onChange:e=>n.internalState?.reloadAsyncProp(t,e),consumerId:n.id,requestId:t}):Mo(e,r,i)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:`number`,min:0,max:1,value:1},operation:`draw`,onHover:{type:`function`,value:null,optional:!0},onClick:{type:`function`,value:null,optional:!0},onDragStart:{type:`function`,value:null,optional:!0},onDrag:{type:`function`,value:null,optional:!0},onDragEnd:{type:`function`,value:null,optional:!0},coordinateSystem:`default`,coordinateOrigin:{type:`array`,value:[0,0,0],compare:!0},modelMatrix:{type:`array`,value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:`XYZ`,colorFormat:`RGBA`,parameters:{type:`object`,value:{},optional:!0,compare:2},loadOptions:{type:`object`,value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:`array`,value:[],optional:!0,ignore:!0},getPolygonOffset:{type:`function`,value:({layerIndex:e})=>[0,-e*100]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:`accessor`,value:[0,0,128,128]}},kg=class extends fg{constructor(){super(...arguments),this.internalState=null,this.lifecycle=Hd.NO_STATE,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,`layerName`)?this.layerName:``}get root(){let e=this;for(;e.parent;)e=e.parent;return e}toString(){return`${this.constructor.layerName||this.constructor.name}({id: '${this.props.id}'})`}project(e){R(this.internalState);let t=this.internalState.viewport||this.context.viewport,[n,r,i]=mu(Id(e,{viewport:t,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem}),t.pixelProjectionMatrix);return e.length===2?[n,r]:[n,r,i]}unproject(e){return R(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(e)}projectPosition(e,t){return R(this.internalState),Ld(e,{viewport:this.internalState.viewport||this.context.viewport,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem,...t})}get isComposite(){return!1}get isDrawable(){return!0}setState(e){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,e),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return this.internalState?!this.internalState.isAsyncPropLoading():!1}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let e=this.state;return e&&(e.models||e.model&&[e.model])||[]}setShaderModuleProps(...e){for(let t of this.getModels())t.shaderInputs.setProps(...e)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}use64bitPositions(){let{coordinateSystem:e}=this.props;return e===`default`||e===`lnglat`||e===`cartesian`}onHover(e,t){return this.props.onHover&&this.props.onHover(e,t)||!1}onClick(e,t){return this.props.onClick&&this.props.onClick(e,t)||!1}nullPickingColor(){return[0,0,0]}encodePickingColor(e,t=[]){return t[0]=e+1&255,t[1]=e+1>>8&255,t[2]=e+1>>8>>8&255,t}decodePickingColor(e){R(e instanceof Uint8Array);let[t,n,r]=e;return t+n*256+r*65536-1}getNumInstances(){return Number.isFinite(this.props.numInstances)?this.props.numInstances:this.state&&this.state.numInstances!==void 0?this.state.numInstances:Bh(this.props.data)}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds([`positions`,`instancePositions`])}getShaders(e){e=Uh(e,{disableWarnings:!0,modules:this.context.defaultShaderModules});for(let t of this.props.extensions)e=Uh(e,t.getShaders.call(this,t));return e}shouldUpdateState(e){return e.changeFlags.propsOrDataChanged}updateState(e){let t=this.getAttributeManager(),{dataChanged:n}=e.changeFlags;if(n&&t)if(Array.isArray(n))for(let e of n)t.invalidateAll(e);else t.invalidateAll();if(t){let{props:n}=e,r=this.internalState.hasPickingBuffer,i=Number.isInteger(n.highlightedObjectIndex)||!!n.pickable||n.extensions.some(e=>e.getNeedsPickingBuffer.call(this,e));if(r!==i){this.internalState.hasPickingBuffer=i;let e=Tg(t.attributes);e&&(i&&e.constant&&(e.constant=!1,t.invalidate(e.id)),!e.value&&!i&&(e.constant=!0,e.value=Eg(t.attributes)?[Iu]:[0,0,0]))}}}finalizeState(e){for(let e of this.getModels())e.destroy();let t=this.getAttributeManager();t&&t.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(e){for(let t of this.getModels())t.draw(e.renderPass)}getPickingInfo({info:e,mode:t,sourceLayer:n}){let{index:r}=e;return r>=0&&Array.isArray(this.props.data)&&(e.object=this.props.data[r]),e}raiseError(e,t){t&&(e=Error(`${t}: ${e.message}`,{cause:e})),this.props.onError?.(e)||this.context?.onError?.(e,this)}getNeedsRedraw(e={clearRedrawFlags:!1}){return this._getNeedsRedraw(e)}needsUpdate(){return this.internalState?this.internalState.needsUpdate||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()):!1}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(e){if(!this.internalState)return;let t=this.internalState.viewport;this.internalState.viewport=e,(!t||!Cg({oldViewport:t,viewport:e}))&&(this.setChangeFlags({viewportChanged:!0}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(e=`all`){let t=this.getAttributeManager();t&&(e===`all`?t.invalidateAll():t.invalidate(e))}updateAttributes(e){let t=!1;for(let n in e)e[n].layoutChanged()&&(t=!0);for(let n of this.getModels())this._setModelAttributes(n,e,t)}_updateAttributes(){let e=this.getAttributeManager();if(!e)return;let t=this.props,n=this.getNumInstances(),r=this.getStartIndices();e.update({data:t.data,numInstances:n,startIndices:r,props:t,transitions:t.transitions,buffers:t.data.attributes,context:this});let i=e.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(i)}_updateAttributeTransition(){let e=this.getAttributeManager();e&&e.updateTransition()}_updateUniformTransition(){let{uniformTransitions:e}=this.internalState;if(e.active){let t=e.update(),n=Object.create(this.props);for(let e in t)Object.defineProperty(n,e,{value:t[e]});return n}return this.props}calculateInstancePickingColors(e,{numInstances:t}){if(e.constant)return;let n=Math.floor(wg.length/4);this.internalState.usesPickingColorCache=!0;let r=t>0&&wg[0]===0;if(n<t||r){t>xg&&j.warn(`Layer has too many data objects. Picking might not be able to distinguish all objects.`)(),wg=md.allocate(wg,t,{size:4,copy:!0,maxCount:Math.max(t,xg)});let e=Math.floor(wg.length/4),i=[0,0,0],a=r?0:n;for(let t=a;t<e;t++)this.encodePickingColor(t,i),wg[t*4+0]=i[0],wg[t*4+1]=i[1],wg[t*4+2]=i[2],wg[t*4+3]=0}e.value=wg.subarray(0,t*4)}_setModelAttributes(e,t,n=!1){if(!Object.keys(t).length)return;let r=this.getAttributeManager();if(r?.hasBufferGroups()){this._setGroupedModelAttributes(e,r,t);return}if(n){let n=this.getAttributeManager();e.setBufferLayout(n.getBufferLayouts(e)),t=n.getAttributes()}let a=e.userData?.excludeAttributes||{},o={},s={};for(let n in t){if(a[n])continue;let r=t[n].getValue();for(let a in r){let c=r[a];c instanceof i?t[n].settings.isIndexed?e.setIndexBuffer(c):o[a]=c:c&&(s[a]=c)}}e.setAttributes(o),e.setConstantAttributes(s)}_setGroupedModelAttributes(e,t,n){let r=e.userData?.excludeAttributes||{},a=t.getBufferGroupBindings(n,e,r);e.setBufferLayout(a.bufferLayouts);let o={...a.buffers},s={},c=t.getAttributes();for(let t in c){if(r[t]||a.groupedAttributeIds.has(t))continue;let n=c[t],l=n.getValue();for(let t in l){let r=l[t];r instanceof i?n.settings.isIndexed?e.setIndexBuffer(r):o[t]=r:r&&(s[t]=r)}}e.setAttributes(o),e.setConstantAttributes(s)}disablePickingIndex(e){let t=this.props.data;if(!(`attributes`in t)){this._disablePickingIndex(e);return}let n=this.getAttributeManager().attributes,r=Eg(n),i=Dg(n),a=r&&t.attributes&&t.attributes[r.id];if(a&&a.value){let n=a.value;for(let i=0;i<t.length;i++)n[r.getVertexOffset(i)]===e&&this._disablePickingIndex(i);return}let o=i&&t.attributes&&t.attributes[i.id];if(o&&o.value){let n=o.value,r=this.encodePickingColor(e);for(let e=0;e<t.length;e++){let t=i.getVertexOffset(e);n[t]===r[0]&&n[t+1]===r[1]&&n[t+2]===r[2]&&this._disablePickingIndex(e)}}else this._disablePickingIndex(e)}_disablePickingIndex(e){let t=this.getAttributeManager().attributes,n=Eg(t);if(n){let t=n.getVertexOffset(e),r=n.getVertexOffset(e+1),i=new Uint32Array(r-t);i.fill(Iu),n.buffer.write(i,t*i.BYTES_PER_ELEMENT);return}let r=Dg(t);if(!r){this.internalState&&Lu(this.internalState.disabledPickingIndices,e);return}let i=r.getVertexOffset(e),a=r.getVertexOffset(e+1);r.buffer.write(new Uint8Array(a-i),i)}restorePickingColors(){let e=this.getAttributeManager().attributes,t=Tg(e);if(!t){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let n=Dg(e);this.internalState.usesPickingColorCache&&n&&n.value.buffer!==wg.buffer&&(n.value=wg.subarray(0,n.value.length)),t.updateSubBuffer({startOffset:0})}_initialize(){R(!this.internalState),M(_g,this);let e=this._getAttributeManager();this.internalState=new hg({attributeManager:e,layer:this}),this._clearChangeFlags(),this.state={},Object.defineProperty(this.state,`attributeManager`,{get:()=>(j.deprecated(`layer.state.attributeManager`,`layer.getAttributeManager()`)(),e)}),this.internalState.uniformTransitions=new Oh(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context);for(let e of this.props.extensions)e.initializeState.call(this,this.context,e);this.setChangeFlags({dataChanged:`init`,propsChanged:`init`,viewportChanged:!0,extensionsChanged:!0}),this._update()}_transferState(e){M(bg,this,this===e);let{state:t,internalState:n}=e;this!==e&&(this.internalState=n,this.state=t,this.internalState.setAsyncProps(this.props),this._diffProps(this.props,this.internalState.getOldProps()))}_update(){let e=this.needsUpdate();if(M(vg,this,e),!e)return;this.context.stats.get(`Layer updates`).incrementCount();let t=this.props,n=this.context,r=this.internalState,i=n.viewport,a=this._updateUniformTransition();r.propsInTransition=a,n.viewport=r.viewport||i,this.props=a;try{let e=this._getUpdateParams(),t=this.getModels();if(n.device)this.updateState(e);else try{this.updateState(e)}catch{}for(let t of this.props.extensions)t.updateState.call(this,e,t);this.setNeedsRedraw(),this._updateAttributes();let r=this.getModels()[0]!==t[0];this._postUpdate(e,r)}finally{n.viewport=i,this.props=t,this._clearChangeFlags(),r.needsUpdate=!1,r.resetOldProps()}}_finalize(){M(yg,this),this.finalizeState(this.context);for(let e of this.props.extensions)e.finalizeState.call(this,this.context,e)}_drawLayer({renderPass:e,shaderModuleProps:t=null,uniforms:n={},parameters:r={}}){this._updateAttributeTransition();let i=this.props,a=this.context;this.props=this.internalState.propsInTransition||i;try{t&&this.setShaderModuleProps(t);let{getPolygonOffset:i}=this.props,o=i&&i(n)||[0,0];a.device instanceof x&&a.device.setParametersWebGL({polygonOffset:o});let s=a.device instanceof x?null:Ag(r);if(jg(this.getModels(),e,r,s),a.device instanceof x)a.device.withParametersWebGL(r,()=>{let i={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:r,context:a};for(let e of this.props.extensions)e.draw.call(this,i,e);this.draw(i)});else{s?.renderPassParameters&&e.setParameters(s.renderPassParameters);let i={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:r,context:a};for(let e of this.props.extensions)e.draw.call(this,i,e);this.draw(i)}}finally{this.props=i}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(e){if(!this.internalState)return;let{changeFlags:t}=this.internalState;for(let n in e)if(e[n]){let r=!1;switch(n){case`dataChanged`:let i=e[n],a=t[n];i&&Array.isArray(a)&&(t.dataChanged=Array.isArray(i)?a.concat(i):i,r=!0);default:t[n]||(t[n]=e[n],r=!0)}r&&M(gg,this,n,e)}let n=!!(t.dataChanged||t.updateTriggersChanged||t.propsChanged||t.extensionsChanged);t.propsOrDataChanged=n,t.somethingChanged=n||t.viewportChanged||t.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(e,t){let n=Ah(e,t);if(n.updateTriggersChanged)for(let e in n.updateTriggersChanged)n.updateTriggersChanged[e]&&this.invalidateAttribute(e);if(n.transitionsChanged)for(let r in n.transitionsChanged)this.internalState.uniformTransitions.add(r,t[r],e[r],e.transitions?.[r]);return this.setChangeFlags(n)}validateProps(){kh(this.props)}updateAutoHighlight(e){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(e)}_updateAutoHighlight(e){let t={highlightedObjectColor:e.picked?e.color:null},{highlightColor:n}=this.props;e.picked&&typeof n==`function`&&(t.highlightColor=n(e)),this.setShaderModuleProps({picking:t}),this.setNeedsRedraw()}_getAttributeManager(){let e=this.context;return new xh(e.device,{id:this.props.id,stats:e.stats,timeline:e.timeline})}_postUpdate(e,t){let{props:n,oldProps:r}=e,i=this.state.model;i?.isInstanced&&i.setInstanceCount(this.getNumInstances());let{autoHighlight:a,highlightedObjectIndex:o,highlightColor:s}=n;if(t||r.autoHighlight!==a||r.highlightedObjectIndex!==o||r.highlightColor!==s){let e={};Array.isArray(s)&&(e.highlightColor=s),(t||r.autoHighlight!==a||o!==r.highlightedObjectIndex)&&(e.highlightedObjectColor=Number.isFinite(o)&&o>=0?this.encodePickingColor(o):null),this.setShaderModuleProps({picking:e})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(e){if(!this.internalState)return!1;let t=!1;t||=this.internalState.needsRedraw&&this.id;let n=this.getAttributeManager(),r=n?n.getNeedsRedraw(e):!1;if(t||=r,t)for(let e of this.props.extensions)e.onNeedsRedraw.call(this,e);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!e.clearRedrawFlags,t}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}};kg.defaultProps=Og,kg.layerName=`Layer`;function Ag(e){let{blendConstant:t,...n}=e;return t?{pipelineParameters:n,renderPassParameters:{blendConstant:t}}:{pipelineParameters:n}}function jg(e,t,n,r){for(let i of e)i.device.type===`webgpu`?(Mg(i,t),i.setParameters({...i.parameters,...r?.pipelineParameters})):i.setParameters(n)}function Mg(e,t){let n=t.props.framebuffer||(t.framebuffer??null);if(!n)return;let r=n.colorAttachments.map(e=>e?.texture?.format??null),i=n.depthStencilAttachment?.texture?.format,a=e;(!Ng(a.props.colorAttachmentFormats,r)||a.props.depthStencilAttachmentFormat!==i)&&(a.props.colorAttachmentFormats=r,a.props.depthStencilAttachmentFormat=i,a._setPipelineNeedsUpdate(`attachment formats`))}function Ng(e,t){if(e===t)return!0;if(!e||!t||e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}var Pg=`compositeLayer.renderLayers`,Fg=class extends kg{get isComposite(){return!0}get isDrawable(){return!1}get isLoaded(){return super.isLoaded&&this.getSubLayers().every(e=>e.isLoaded)}getSubLayers(){return this.internalState&&this.internalState.subLayers||[]}initializeState(e){}setState(e){super.setState(e),this.setNeedsUpdate()}getPickingInfo({info:e}){let{object:t}=e;return t&&t.__source&&t.__source.parent&&t.__source.parent.id===this.id?(e.object=t.__source.object,e.index=t.__source.index,e):e}filterSubLayer(e){return!0}shouldRenderSubLayer(e,t){return t&&t.length}getSubLayerClass(e,t){let{_subLayerProps:n}=this.props;return n&&n[e]&&n[e].type||t}getSubLayerRow(e,t,n){return e.__source={parent:this,object:t,index:n},e}getSubLayerAccessor(e){if(typeof e==`function`){let t={index:-1,data:this.props.data,target:[]};return(n,r)=>n&&n.__source?(t.index=n.__source.index,e(n.__source.object,t)):e(n,r)}return e}getSubLayerProps(e={}){let{opacity:t,pickable:n,visible:r,parameters:i,getPolygonOffset:a,highlightedObjectIndex:o,autoHighlight:s,highlightColor:c,coordinateSystem:l,coordinateOrigin:u,wrapLongitude:d,positionFormat:f,modelMatrix:p,extensions:m,fetch:h,operation:g,_subLayerProps:_}=this.props,v={id:``,updateTriggers:{},opacity:t,pickable:n,visible:r,parameters:i,getPolygonOffset:a,highlightedObjectIndex:o,autoHighlight:s,highlightColor:c,coordinateSystem:l,coordinateOrigin:u,wrapLongitude:d,positionFormat:f,modelMatrix:p,extensions:m,fetch:h,operation:g},y=_&&e.id&&_[e.id],b=y&&y.updateTriggers,x=e.id||`sublayer`;if(y){let t=this.props[Wd],n=e.type?e.type._propTypes:{};for(let e in y){let r=n[e]||t[e];r&&r.type===`accessor`&&(y[e]=this.getSubLayerAccessor(y[e]))}}Object.assign(v,e,y),v.id=`${this.props.id}-${x}`,v.updateTriggers={all:this.props.updateTriggers?.all,...e.updateTriggers,...b};for(let e of m){let t=e.getSubLayerProps.call(this,e);t&&Object.assign(v,t,{updateTriggers:Object.assign(v.updateTriggers,t.updateTriggers)})}return v}_updateAutoHighlight(e){for(let t of this.getSubLayers())t.updateAutoHighlight(e)}_getAttributeManager(){return null}_postUpdate(e,t){let n=this.internalState.subLayers,r=!n||this.needsUpdate();r&&(n=Yd(this.renderLayers(),Boolean),this.internalState.subLayers=n),M(Pg,this,r,n);for(let e of n)e.parent=this}};Fg.layerName=`CompositeLayer`;var Ig=Math.PI/180;function Lg({height:e,focalDistance:t,orbitAxis:n,rotationX:r,rotationOrbit:i,zoom:a}){let o=n===`Z`?[0,0,1]:[0,1,0],s=n===`Z`?[0,-t,0]:[0,0,t],c=new k().lookAt({eye:s,up:o});c.rotateX(r*Ig),n===`Z`?c.rotateZ(i*Ig):c.rotateY(i*Ig);let l=2**a/e;return c.scale(l),c}var Rg=class extends jd{constructor(e){let{height:t,projectionMatrix:n,fovy:r=50,orbitAxis:i=`Z`,target:a=[0,0,0],rotationX:o=0,rotationOrbit:s=0,zoom:c=0}=e,l=n?n[5]/2:pu(r);super({...e,longitude:void 0,viewMatrix:Lg({height:t||1,focalDistance:l,orbitAxis:i,rotationX:o,rotationOrbit:s,zoom:c}),fovy:r,focalDistance:l,position:a,zoom:c}),this.target=a,this.orbitAxis=i,this.rotationX=o,this.rotationOrbit=s,this.fovy=r,this.projectedCenter=this.project(this.center)}unproject(e,{topLeft:t=!0}={}){let[n,r,i=this.projectedCenter[2]]=e,[a,o,s]=hu([n,t?r:this.height-r,i],this.pixelUnprojectionMatrix);return[a,o,s]}panByPosition(e,t,n){let r=this.project(e),{near:i,far:a}=vd(this.projectionMatrix),o=i*a/(a-r[2]*(a-i))/(i*a/(a-this.projectedCenter[2]*(a-i))),s=[this.width/2+(r[0]-t[0])*o,this.height/2+(r[1]-t[1])*o,this.projectedCenter[2]];return{target:this.unproject(s)}}};Rg.displayName=`OrbitViewport`;var zg=class extends zf{constructor(e){let{width:t,height:n,rotationX:r=0,rotationOrbit:i=0,target:a=[0,0,0],zoom:o=0,minRotationX:s=-90,maxRotationX:c=90,minZoom:l=-1/0,maxZoom:u=1/0,maxBounds:d=null,maxBoundsPadding:f=null,startPanPosition:p,startRotatePos:m,startRotationX:h,startRotationOrbit:g,startZoomPosition:_,startZoom:v}=e;super({width:t,height:n,rotationX:r,rotationOrbit:i,target:a,zoom:o,minRotationX:s,maxRotationX:c,minZoom:l,maxZoom:u,maxBounds:d,maxBoundsPadding:f},{startPanPosition:p,startRotatePos:m,startRotationX:h,startRotationOrbit:g,startZoomPosition:_,startZoom:v},e.makeViewport),this.unproject3D=e.unproject3D}panStart({pos:e}){return this._getUpdatedState({startPanPosition:this._unproject(e)})}pan({pos:e,startPosition:t}){let n=this.getState().startPanPosition||t;if(!n)return this;let r=this.makeViewport(this.getViewportProps()).panByPosition(n,e);return this._getUpdatedState(r)}panEnd(){return this._getUpdatedState({startPanPosition:null})}rotateStart({pos:e}){return this._getUpdatedState({startRotatePos:e,startRotationX:this.getViewportProps().rotationX,startRotationOrbit:this.getViewportProps().rotationOrbit})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:n=0}){let{startRotatePos:r,startRotationX:i,startRotationOrbit:a}=this.getState(),{width:o,height:s}=this.getViewportProps();if(!r||i===void 0||a===void 0)return this;let c;if(e){let t=(e[0]-r[0])/o,n=(e[1]-r[1])/s;(i<-90||i>90)&&(t*=-1),c={rotationX:i+n*180,rotationOrbit:a+t*180}}else c={rotationX:i+n,rotationOrbit:a+t};return this._getUpdatedState(c)}rotateEnd(){return this._getUpdatedState({startRotationX:null,startRotationOrbit:null})}shortestPathFrom(e){let t=e.getViewportProps(),n={...this.getViewportProps()},{rotationOrbit:r}=n;return Math.abs(r-t.rotationOrbit)>180&&(n.rotationOrbit=r<0?r+360:r-360),n}zoomStart({pos:e}){return this._getUpdatedState({startZoomPosition:this._unproject(e),startZoom:this.getViewportProps().zoom})}zoom({pos:e,startPos:t,scale:n}){let{startZoom:r,startZoomPosition:i}=this.getState();if(i||=(r=this.getViewportProps().zoom,this._unproject(t||e)),!i)return this;let a=this._calculateNewZoom({scale:n,startZoom:r}),o=this.makeViewport({...this.getViewportProps(),zoom:a});return this._getUpdatedState({zoom:a,...o.panByPosition(i,e)})}zoomEnd(){return this._getUpdatedState({startZoomPosition:null,startZoom:null})}zoomIn(e=2){return this._getUpdatedState({zoom:this._calculateNewZoom({scale:e})})}zoomOut(e=2){return this._getUpdatedState({zoom:this._calculateNewZoom({scale:1/e})})}moveLeft(e=50){return this._panFromCenter([-e,0])}moveRight(e=50){return this._panFromCenter([e,0])}moveUp(e=50){return this._panFromCenter([0,-e])}moveDown(e=50){return this._panFromCenter([0,e])}rotateLeft(e=15){return this._getUpdatedState({rotationOrbit:this.getViewportProps().rotationOrbit-e})}rotateRight(e=15){return this._getUpdatedState({rotationOrbit:this.getViewportProps().rotationOrbit+e})}rotateUp(e=10){return this._getUpdatedState({rotationX:this.getViewportProps().rotationX-e})}rotateDown(e=10){return this._getUpdatedState({rotationX:this.getViewportProps().rotationX+e})}_project(e){return this.makeViewport(this.getViewportProps()).project(e)}_unproject(e){return this.unproject3D?.(e)||this.makeViewport(this.getViewportProps()).unproject(e)}_calculateNewZoom({scale:e,startZoom:t}){t===void 0&&(t=this.getViewportProps().zoom);let n=t+Math.log2(e);return this._constrainZoom(n)}_panFromCenter(e){let{target:t}=this.getViewportProps(),n=this._project(t);return this.pan({startPosition:t,pos:[n[0]+e[0],n[1]+e[1]]})}_getUpdatedState(e){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e})}applyConstraints(e){let{maxRotationX:t,minRotationX:n,rotationOrbit:r}=e;return e.zoom=this._constrainZoom(e.zoom,e),e.rotationX=O(e.rotationX,n,t),(r<-180||r>180)&&(e.rotationOrbit=gd(r+180,360)-180),e.target=this._constrainTarget(e),e}_constrainZoom(e,t){t||=this.getViewportProps();let{maxZoom:n,maxBounds:r}=t,{minZoom:i}=t;if(r&&t.width>0&&t.height>0){let a=Vf(t.width,t.height,t.maxBoundsPadding),o=[];if(a.width>0||a.height>0){let s=Hf(this.makeViewport({...t,zoom:e}),t.target,a);a.width>0&&o.push(s.left,s.right),a.height>0&&o.push(s.top,s.bottom);let c=Math.min(...o)*2,l=r[1][0]-r[0][0],u=r[1][1]-r[0][1],d=(r[1][2]??0)-(r[0][2]??0),f=Math.sqrt(l*l+u*u+d*d);c>0&&f>0&&(i=Math.max(i,Math.log2(c/f)),i>n&&(i=n))}}return O(e,i,n)}_constrainTarget(e){let{target:t,maxBounds:n}=e;if(!n)return t;let r=Vf(e.width,e.height,e.maxBoundsPadding);if(r.width<0||r.height<0)return t;let[[i,a,o=0],[s,c,l=0]]=n;if(t[0]>=i&&t[0]<=s&&t[1]>=a&&t[1]<=c&&t[2]>=o&&t[2]<=l)return t;let u=this.makeViewport?.(e);if(u){let{cameraPosition:e}=u,n=e[0]-t[0],r=e[1]-t[1],d=e[2]-t[2],f=n*t[0]+r*t[1]+d*t[2],p=n*(n>=0?i:s)+r*(r>=0?a:c)+d*(d>=0?o:l),m=n*(n>=0?s:i)+r*(r>=0?c:a)+d*(d>=0?l:o);if((n||r||d)&&f>=p&&f<=m){let e=e=>O(e,i,s),u=e=>O(e,a,c),p=e=>O(e,o,l),m=i=>n*e(t[0]-i*n)+r*u(t[1]-i*r)+d*p(t[2]-i*d)-f,h=-1,g=1,_=m(h),v=m(g);for(;_<0;)g=h,v=_,h*=2,_=m(h);for(;v>0;)h=g,_=v,g*=2,v=m(g);for(let e=0;e<30;e++){let e=(h+g)/2;m(e)>0?h=e:g=e}let y=(h+g)/2;return[e(t[0]-y*n),u(t[1]-y*r),p(t[2]-y*d)]}}return[O(t[0],i,s),O(t[1],a,c),O(t[2],o,l)]}},Bg=class extends Lf{constructor(){super(...arguments),this.ControllerState=zg,this.transition={transitionDuration:300,transitionInterpolator:new kf({transitionProps:{compare:[`target`,`zoom`,`rotationX`,`rotationOrbit`],required:[`target`,`zoom`]}})},this._unproject3D=e=>{if(this.pickPosition){let{x:t,y:n}=this.props,r=this.pickPosition(t+e[0],n+e[1]);if(r&&r.coordinate)return r.coordinate}return null}}setProps(e){e.unproject3D=this._unproject3D,super.setProps(e)}},Vg=class extends _f{constructor(e={}){super(e),this.props.orbitAxis=e.orbitAxis||`Z`}getViewportType(){return Rg}get ControllerType(){return Bg}};Vg.displayName=`OrbitView`;var Hg=Math.PI/180,Ug=new Float32Array(16),Wg=new Float32Array(12);function Gg(e,t,n){let r=t[0]*Hg,i=t[1]*Hg,a=t[2]*Hg,o=Math.sin(a),s=Math.sin(r),c=Math.sin(i),l=Math.cos(a),u=Math.cos(r),d=Math.cos(i),f=n[0],p=n[1],m=n[2];e[0]=f*d*u,e[1]=f*c*u,e[2]=f*-s,e[3]=p*(-c*l+d*s*o),e[4]=p*(d*l+c*s*o),e[5]=p*u*o,e[6]=m*(c*o+d*s*l),e[7]=m*(-d*o+c*s*l),e[8]=m*u*l}function Kg(e){return e[0]=e[0],e[1]=e[1],e[2]=e[2],e[3]=e[4],e[4]=e[5],e[5]=e[6],e[6]=e[8],e[7]=e[9],e[8]=e[10],e[9]=e[12],e[10]=e[13],e[11]=e[14],e.subarray(0,12)}var qg={size:12,accessor:[`getOrientation`,`getScale`,`getTranslation`,`getTransformMatrix`],shaderAttributes:{instanceModelMatrixCol0:{size:3,elementOffset:0},instanceModelMatrixCol1:{size:3,elementOffset:3},instanceModelMatrixCol2:{size:3,elementOffset:6},instanceTranslation:{size:3,elementOffset:9}},update(e,{startRow:t,endRow:n}){let{data:r,getOrientation:i,getScale:a,getTranslation:o,getTransformMatrix:s}=this.props,c=Array.isArray(s),l=c&&s.length===16,u=Array.isArray(a),d=Array.isArray(i),f=Array.isArray(o),p=l||!c&&!!s(r[0]);p?e.constant=l:e.constant=d&&u&&f;let m=e.value;if(e.constant){let t;p?(Ug.set(s),t=Kg(Ug)):(t=Wg,Gg(t,i,a),t.set(o,9)),e.value=new Float32Array(t)}else{let c=t*e.size,{iterable:h,objectInfo:g}=qp(r,t,n);for(let e of h){g.index++;let t;if(p)Ug.set(l?s:s(e,g)),t=Kg(Ug);else{t=Wg;let n=d?i:i(e,g),r=u?a:a(e,g);Gg(t,n,r),t.set(f?o:o(e,g),9)}m[c++]=t[0],m[c++]=t[1],m[c++]=t[2],m[c++]=t[3],m[c++]=t[4],m[c++]=t[5],m[c++]=t[6],m[c++]=t[7],m[c++]=t[8],m[c++]=t[9],m[c++]=t[10],m[c++]=t[11]}}}};function Jg(e,t){return t===`cartesian`||t===`meter-offsets`||t===`default`&&!e.isGeospatial}var Yg=`
struct VertexInputs {
  @location(0) positions: vec3f,
#ifdef HAS_NORMALS
  @location(1) normals: vec3f,
#endif
#ifdef HAS_TANGENTS
  @location(2) TANGENT: vec4f,
#endif
#ifdef HAS_UV
  @location(3) texCoords: vec2f,
#endif
#ifdef HAS_UV_1
  @location(4) texCoords1: vec2f,
#endif
#ifdef HAS_SKIN
  @location(5) JOINTS_0: vec4u,
  @location(6) WEIGHTS_0: vec4f,
#endif
#ifdef HAS_SKIN_1
  @location(7) JOINTS_1: vec4u,
  @location(8) WEIGHTS_1: vec4f,
#endif
#ifdef HAS_GLTF_INSTANCING
  @location(9) instanceModelMatrixCol0: vec4f,
  @location(10) instanceModelMatrixCol1: vec4f,
  @location(11) instanceModelMatrixCol2: vec4f,
  @location(12) instanceModelMatrixCol3: vec4f,
  @builtin(instance_index) instanceIndex: u32,
#else
#ifdef HAS_INSTANCED_MORPH
  @builtin(instance_index) instanceIndex: u32,
#endif
#endif
#ifdef HAS_GPU_CROWD_ANIMATION
  @location(13) instanceAnimationFrames: vec4f,
  @location(14) instanceAnimationBlend: vec4f,
#endif
#ifdef HAS_INSTANCED_MORPH
  @builtin(vertex_index) vertexIndex: u32,
#endif
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) pbrPosition: vec3f,
  @location(1) pbrUV0: vec2f,
  @location(2) pbrUV1: vec2f,
  @location(3) pbrNormal: vec3f,
#ifdef HAS_TANGENTS
  @location(4) pbrTangent: vec4f,
#endif
};

#ifdef HAS_GLTF_INSTANCING
fn getGLTFInstanceNormalMatrix(matrix: mat3x3f) -> mat3x3f {
  let firstCofactor = cross(matrix[1], matrix[2]);
  let inverseDeterminant = 1.0 / dot(matrix[0], firstCofactor);
  return mat3x3f(
    firstCofactor,
    cross(matrix[2], matrix[0]),
    cross(matrix[0], matrix[1])
  ) * inverseDeterminant;
}
#endif

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  var position = vec4f(inputs.positions, 1.0);
  var normal = vec3f(0.0, 0.0, 1.0);
  var tangent = vec4f(1.0, 0.0, 0.0, 1.0);
  var uv0 = vec2f(0.0, 0.0);
  var uv1 = vec2f(0.0, 0.0);

#ifdef HAS_NORMALS
  normal = inputs.normals;
#endif
#ifdef HAS_UV
  uv0 = inputs.texCoords;
#endif
#ifdef HAS_UV_1
  uv1 = inputs.texCoords1;
#endif
#ifdef HAS_TANGENTS
  tangent = inputs.TANGENT;
#endif

#ifdef HAS_INSTANCED_MORPH
  var animationFrames = vec4f(0.0);
  var animationBlend = vec4f(0.0);
#ifdef HAS_GPU_CROWD_ANIMATION
  animationFrames = inputs.instanceAnimationFrames;
  animationBlend = inputs.instanceAnimationBlend;
#endif
  position = vec4f(
    position.xyz + getGPUCrowdMorphDelta(
      inputs.instanceIndex,
      inputs.vertexIndex,
      0u,
      u32(CROWD_MORPH_VERTEX_COUNT),
      u32(CROWD_MORPH_TARGET_COUNT),
      u32(CROWD_ANIMATION_JOINT_COUNT),
      animationFrames,
      animationBlend,
      u32(CROWD_ANIMATION_FRAME_STRIDE)
    ),
    1.0
  );
#ifdef HAS_NORMALS
  normal = normalize(normal + getGPUCrowdMorphDelta(
    inputs.instanceIndex,
    inputs.vertexIndex,
    1u,
    u32(CROWD_MORPH_VERTEX_COUNT),
    u32(CROWD_MORPH_TARGET_COUNT),
    u32(CROWD_ANIMATION_JOINT_COUNT),
    animationFrames,
    animationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  ));
#endif
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize(tangent.xyz + getGPUCrowdMorphDelta(
    inputs.instanceIndex,
    inputs.vertexIndex,
    2u,
    u32(CROWD_MORPH_VERTEX_COUNT),
    u32(CROWD_MORPH_TARGET_COUNT),
    u32(CROWD_ANIMATION_JOINT_COUNT),
    animationFrames,
    animationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  )), tangent.w);
#endif
#endif

#ifdef HAS_SKIN
#ifdef HAS_GPU_CROWD_ANIMATION
  var skinMatrix = getGPUAnimatedSkinMatrix(
    inputs.WEIGHTS_0,
    inputs.JOINTS_0,
    inputs.instanceAnimationFrames,
    inputs.instanceAnimationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  );
#else
#ifdef HAS_INSTANCED_SKIN
  var skinMatrix = getInstancedSkinMatrix(
    inputs.WEIGHTS_0,
    inputs.JOINTS_0,
    inputs.instanceIndex,
    u32(CROWD_JOINTS_PER_INSTANCE)
  );
#else
  var skinMatrix = getSkinMatrix(inputs.WEIGHTS_0, inputs.JOINTS_0);
#endif
#endif
#ifdef HAS_SKIN_1
#ifdef HAS_GPU_CROWD_ANIMATION
  skinMatrix += getGPUAnimatedSkinMatrix(
    inputs.WEIGHTS_1,
    inputs.JOINTS_1,
    inputs.instanceAnimationFrames,
    inputs.instanceAnimationBlend,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  );
#else
#ifdef HAS_INSTANCED_SKIN
  skinMatrix += getInstancedSkinMatrix(
    inputs.WEIGHTS_1,
    inputs.JOINTS_1,
    inputs.instanceIndex,
    u32(CROWD_JOINTS_PER_INSTANCE)
  );
#else
  skinMatrix += getSkinMatrix(inputs.WEIGHTS_1, inputs.JOINTS_1);
#endif
#endif
#endif
  position = skinMatrix * position;
  normal = normalize((skinMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((skinMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
#endif

#ifdef HAS_GLTF_INSTANCING
  var instanceMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
#ifdef HAS_GPU_CROWD_ANIMATION
  instanceMatrix *= sampleGPUAnimationMatrix(
    inputs.instanceAnimationFrames,
    inputs.instanceAnimationBlend,
    0u,
    u32(CROWD_ANIMATION_FRAME_STRIDE)
  );
#endif
  position = instanceMatrix * position;
  normal = normalize(getGLTFInstanceNormalMatrix(mat3x3f(
    instanceMatrix[0].xyz,
    instanceMatrix[1].xyz,
    instanceMatrix[2].xyz
  )) * normal);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((instanceMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
#endif

  let worldPosition = pbrProjection.modelMatrix * position;

#ifdef HAS_NORMALS
  normal = normalize((pbrProjection.normalMatrix * vec4f(normal, 0.0)).xyz);
#endif
#ifdef HAS_TANGENTS
  let worldTangent = normalize((pbrProjection.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz);
  outputs.pbrTangent = vec4f(worldTangent, tangent.w);
#endif

  outputs.position = pbrProjection.modelViewProjectionMatrix * position;
  outputs.pbrPosition = worldPosition.xyz / worldPosition.w;
  outputs.pbrUV0 = uv0;
  outputs.pbrUV1 = uv1;
  outputs.pbrNormal = normal;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs, @builtin(front_facing) frontFacing: bool) -> @location(0) vec4f {
#ifdef DOUBLE_SIDED
  pbr_frontFacing = frontFacing;
#endif
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  fragmentInputs.pbr_vUV0 = inputs.pbrUV0;
  fragmentInputs.pbr_vUV1 = inputs.pbrUV1;
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;
#ifdef HAS_TANGENTS
  let tangent = normalize(inputs.pbrTangent.xyz);
  let bitangent = normalize(cross(inputs.pbrNormal, tangent)) * inputs.pbrTangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangent, bitangent, inputs.pbrNormal);
#endif
  return pbr_filterColor(vec4f(1.0));
}
`,Xg=`#version 300 es

  // in vec4 POSITION;
  in vec4 positions;

  #ifdef HAS_NORMALS
    // in vec4 NORMAL;
    in vec4 normals;
  #endif

  #ifdef HAS_TANGENTS
    in vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    // in vec2 TEXCOORD_0;
    in vec2 texCoords;
  #endif

  #ifdef HAS_UV_1
    in vec2 texCoords1;
  #endif

  #ifdef HAS_SKIN
    in uvec4 JOINTS_0;
    in vec4 WEIGHTS_0;
  #endif

  #ifdef HAS_SKIN_1
    in uvec4 JOINTS_1;
    in vec4 WEIGHTS_1;
  #endif

  #ifdef HAS_GLTF_INSTANCING
    in vec4 instanceModelMatrixCol0;
    in vec4 instanceModelMatrixCol1;
    in vec4 instanceModelMatrixCol2;
    in vec4 instanceModelMatrixCol3;
  #endif

  #ifdef HAS_GPU_CROWD_ANIMATION
    in vec4 instanceAnimationFrames;
    in vec4 instanceAnimationBlend;
  #endif

  void main(void) {
    vec4 _NORMAL = vec4(0.);
    vec4 _TANGENT = vec4(0.);
    vec2 _TEXCOORD_0 = vec2(0.);
    vec2 _TEXCOORD_1 = vec2(0.);

    #ifdef HAS_NORMALS
      _NORMAL = normals;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = texCoords;
    #endif

    #ifdef HAS_UV_1
      _TEXCOORD_1 = texCoords1;
    #endif

    vec4 pos = positions;

    #ifdef HAS_INSTANCED_MORPH
      vec4 animationFrames = vec4(0.0);
      vec4 animationBlend = vec4(0.0);
      #ifdef HAS_GPU_CROWD_ANIMATION
        animationFrames = instanceAnimationFrames;
        animationBlend = instanceAnimationBlend;
      #endif
      pos.xyz += getGPUCrowdMorphDelta(
        uint(gl_InstanceID),
        uint(gl_VertexID),
        0u,
        uint(CROWD_MORPH_TARGET_COUNT),
        uint(CROWD_ANIMATION_JOINT_COUNT),
        animationFrames,
        animationBlend
      );
      #ifdef HAS_NORMALS
        _NORMAL.xyz = normalize(_NORMAL.xyz + getGPUCrowdMorphDelta(
          uint(gl_InstanceID),
          uint(gl_VertexID),
          1u,
          uint(CROWD_MORPH_TARGET_COUNT),
          uint(CROWD_ANIMATION_JOINT_COUNT),
          animationFrames,
          animationBlend
        ));
      #endif
      #ifdef HAS_TANGENTS
        _TANGENT.xyz = normalize(_TANGENT.xyz + getGPUCrowdMorphDelta(
          uint(gl_InstanceID),
          uint(gl_VertexID),
          2u,
          uint(CROWD_MORPH_TARGET_COUNT),
          uint(CROWD_ANIMATION_JOINT_COUNT),
          animationFrames,
          animationBlend
        ));
      #endif
    #endif

    #ifdef HAS_SKIN
      #ifdef HAS_GPU_CROWD_ANIMATION
        mat4 skinMat = getGPUAnimatedSkinMatrix(
          WEIGHTS_0,
          JOINTS_0,
          instanceAnimationFrames,
          instanceAnimationBlend
        );
      #else
      #ifdef HAS_INSTANCED_SKIN
        mat4 skinMat = getInstancedSkinMatrix(
          WEIGHTS_0,
          JOINTS_0,
          uint(gl_InstanceID),
          uint(CROWD_JOINTS_PER_INSTANCE)
        );
      #else
      mat4 skinMat = getSkinMatrix(WEIGHTS_0, JOINTS_0);
      #endif
      #endif
      #ifdef HAS_SKIN_1
        #ifdef HAS_GPU_CROWD_ANIMATION
          skinMat += getGPUAnimatedSkinMatrix(
            WEIGHTS_1,
            JOINTS_1,
            instanceAnimationFrames,
            instanceAnimationBlend
          );
        #else
        #ifdef HAS_INSTANCED_SKIN
          skinMat += getInstancedSkinMatrix(
            WEIGHTS_1,
            JOINTS_1,
            uint(gl_InstanceID),
            uint(CROWD_JOINTS_PER_INSTANCE)
          );
        #else
          skinMat += getSkinMatrix(WEIGHTS_1, JOINTS_1);
        #endif
        #endif
      #endif
      pos = skinMat * pos;
      _NORMAL = skinMat * _NORMAL;
      _TANGENT = vec4((skinMat * vec4(_TANGENT.xyz, 0.)).xyz, _TANGENT.w);
    #endif

    #ifdef HAS_GLTF_INSTANCING
      mat4 instanceMatrix = mat4(
        instanceModelMatrixCol0,
        instanceModelMatrixCol1,
        instanceModelMatrixCol2,
        instanceModelMatrixCol3
      );
      #ifdef HAS_GPU_CROWD_ANIMATION
        instanceMatrix *= sampleGPUAnimationMatrix(
          instanceAnimationFrames,
          instanceAnimationBlend,
          0
        );
      #endif
      pos = instanceMatrix * pos;
      _NORMAL = vec4(normalize(transpose(inverse(mat3(instanceMatrix))) * _NORMAL.xyz), 0.0);
      _TANGENT = vec4(normalize(mat3(instanceMatrix) * _TANGENT.xyz), _TANGENT.w);
    #endif

    pbr_setPositionNormalTangentUV(pos, _NORMAL, _TANGENT, _TEXCOORD_0, _TEXCOORD_1);
    gl_Position = pbrProjection.modelViewProjectionMatrix * pos;
  }
`,Zg=`#version 300 es
  out vec4 fragmentColor;

  void main(void) {
    vec3 pos = pbr_vPosition;
    fragmentColor = pbr_filterColor(vec4(1.0));
  }
`;function Qg(e,t){let n=t.materialFactory||new Zn(e,{modules:[Xn]}),r={...t.parsedPPBRMaterial.uniforms};delete r.camera;let i=Object.fromEntries(Object.entries({...r,...t.parsedPPBRMaterial.bindings}).filter(([e,t])=>n.ownsBinding(e)&&t_(t))),a=n.createMaterial({id:t.id,bindings:i});return a.setProps({pbrMaterial:r}),a}function $g(e,n){let{id:r,geometry:a,parsedPPBRMaterial:o,vertexCount:s,modelOptions:c={},instanceMatrices:l,usesLargeSkinPalette:u=!1,morphTargets:d=[]}=n,f=c.userData?.gltfAnimatedCrowd;if(f&&l)throw Error(`Nested glTF crowd instancing is unsupported`);t.info(4,`createGLTFModel defines: `,o.defines)();let p=[],m={depthWriteEnabled:!0,depthCompare:`less`,depthFormat:`depth24plus`,cullMode:`back`},h={},_=[],v=[],y=[],b=!!f?.gpuAnimation;if(l||f)for(let t=0;t<4;t++){let n=new Float32Array((f?.capacity||l?.length||0)*4);l?.forEach((e,r)=>{for(let i=0;i<4;i++)n[r*4+i]=e[t*4+i]});let a=`instanceModelMatrixCol${t}`,o=e.createBuffer({id:`${r||`gltf`}-${a}`,data:n,usage:i.VERTEX|i.COPY_DST});h[a]=o,_.push({name:a,format:`float32x4`,stepMode:`instance`}),p.push(o),v.push(o),y.push(n)}let x,S,C,ee;if(f&&b){x=new Float32Array(f.capacity*4),C=new Float32Array(f.capacity*4);for(let[t,n]of[[`instanceAnimationFrames`,x],[`instanceAnimationBlend`,C]]){let a=e.createBuffer({id:`${r||`gltf`}-${t}`,data:n,usage:i.VERTEX|i.COPY_DST});h[t]=a,_.push({name:t,format:`float32x4`,stepMode:`instance`}),p.push(a),t===`instanceAnimationFrames`?S=a:ee=a}}let w=!!o.defines.HAS_SKIN,te=!!(u&&w&&!f),ne=!!(f&&w&&!b),re,ie;f&&ne&&(ie=new Float32Array(f.capacity*f.jointsPerInstance*16),re=e.type===`webgpu`?e.createBuffer({id:`${r||`gltf`}-crowd-joint-matrices`,byteLength:ie.byteLength,usage:i.STORAGE|i.COPY_DST}):e.createTexture({id:`${r||`gltf`}-crowd-joint-matrices`,format:`rgba32float`,width:f.jointsPerInstance*4,height:f.capacity,usage:g.SAMPLE|g.COPY_DST,sampler:{minFilter:`nearest`,magFilter:`nearest`,mipmapFilter:`nearest`}}),p.push(re));let ae=d.length,T=Math.floor((a.attributes.POSITION?.value.length||0)/3),E,oe,se;if(ae>0&&T>0){let t=new Float32Array(ae*3*T*4);for(let[e,n]of d.entries())for(let[r,i]of[`POSITION`,`NORMAL`,`TANGENT`].entries()){let a=n[i];if(!a)continue;let o=i===`TANGENT`&&a.length===T*4?4:3;for(let n=0;n<T;n++){let i=((e*3+r)*T+n)*4,s=n*o;t[i]=a[s]||0,t[i+1]=a[s+1]||0,t[i+2]=a[s+2]||0}}if(E=e_(e,`${r||`gltf`}-crowd-morph-targets`,t,T,ae*3),p.push(E),!b){let t=Math.ceil(ae/4),n=f?.capacity||1;oe=new Float32Array(n*t*4),se=e_(e,`${r||`gltf`}-crowd-morph-weights`,oe,t,n),p.push(se)}}let ce=w&&f?f.jointsPerInstance:0,le=4+ce*4+ae,ue,fe;f?.gpuAnimation&&(fe=new Float32Array(f.gpuAnimation.frameCount*le*4),ue=e_(e,`${r||`gltf`}-crowd-animation-frames`,fe,le,f.gpuAnimation.frameCount),p.push(ue));let pe=Yg;for(let[e,t]of[[`CROWD_JOINTS_PER_INSTANCE`,f?.jointsPerInstance||0],[`CROWD_MORPH_VERTEX_COUNT`,T],[`CROWD_MORPH_TARGET_COUNT`,ae],[`CROWD_ANIMATION_JOINT_COUNT`,ce],[`CROWD_ANIMATION_FRAME_STRIDE`,le]])pe=pe.replaceAll(`u32(${e})`,`u32(${t})`);let me={id:r,source:pe,vs:Xg,fs:Zg,geometry:a,topology:a.topology,vertexCount:s,modules:[Xn,xn,...f||E?[Cn]:[]],...c,...l||f?{attributes:{...c.attributes,...h},bufferLayout:[...c.bufferLayout||[],..._],instanceCount:l?.length||0,isInstanced:!0}:{},defines:{...o.defines,...c.defines,...l||f?{HAS_GLTF_INSTANCING:!0}:{},...ne?{HAS_INSTANCED_SKIN:!0,CROWD_JOINTS_PER_INSTANCE:f.jointsPerInstance}:{},...te?{HAS_LARGE_SKIN:!0}:{},...b?{HAS_GPU_CROWD_ANIMATION:!0,CROWD_ANIMATION_FRAME_STRIDE:le}:{},...E?{HAS_INSTANCED_MORPH:!0,CROWD_MORPH_TARGET_COUNT:ae}:{},...f||E?{CROWD_ANIMATION_JOINT_COUNT:ce}:{}},parameters:{...m,...o.parameters,...c.parameters}},he=n.material||Qg(e,{id:r?`${r}-material`:void 0,parsedPPBRMaterial:o});me.material=he;let ge=new de(e,me),_e={...o.uniforms,...c.uniforms,...o.bindings,...c.bindings},D=n_(ge.shaderInputs.getModules(),he,_e);ge.shaderInputs.setProps(D),re&&ge.shaderInputs.setProps({skin:{jointMatrices:[],skinJointMatrices:re}}),(ue||E||se)&&ge.shaderInputs.setProps({gpuAnimation:{...ue?{gpuAnimationFrames:ue}:{},...E?{gpuMorphTargets:E}:{},...se?{gpuMorphWeights:se}:{}}});let ve=new Mr({managedResources:p,model:ge,bounds:n.bounds,instanceMatrices:l});return ve.userData.gltfLargeSkinPalette=te,oe&&se&&!f&&(ve.userData.gltfMorphWeights={values:oe,data:se,packedTargetCount:Math.ceil(ae/4)}),f&&(ve.userData.gltfAnimatedCrowd={transformBuffers:v,transformColumns:y,skinJointMatrices:re,jointMatrices:ie,jointsPerInstance:f.jointsPerInstance,morphTargetCount:ae,morphTargetData:E,morphWeights:oe,morphWeightData:se,animationFrames:ue,animationFrameValues:fe,animationFrameStride:le,animationJointCount:ce,animationParameters:x,animationParameterBuffer:S,animationBlend:C,animationBlendBuffer:ee}),ve}function e_(e,t,n,r,a){if(e.type===`webgpu`)return e.createBuffer({id:t,data:n,usage:i.STORAGE|i.COPY_DST});let o=e.createTexture({id:t,format:`rgba32float`,width:r,height:a,usage:g.SAMPLE|g.COPY_DST,sampler:{minFilter:`nearest`,magFilter:`nearest`,mipmapFilter:`nearest`}});return o.writeData(n,{width:r,height:a}),o}function t_(e){return e instanceof i||e instanceof yr||e instanceof p||e instanceof g||e instanceof h}function n_(e,t,n){let r=new Map;for(let t of e){for(let e of Object.keys(t.uniformTypes||{}))r.set(e,t.name);for(let e of t.bindingLayout||[])r.set(e.name,t.name)}let i={};for(let[e,a]of Object.entries(n)){if(a===void 0)continue;let n=r.get(e);!n||t.ownsModule(n)||(i[n]||={},i[n][e]=a)}return i}function r_(e,t){let n=t.extensions?.EXT_mesh_gpu_instancing?.attributes;if(!n||typeof n!=`object`)return null;let r={},i;for(let[t,a]of Object.entries(n)){let n=typeof a==`number`?e.accessors[a]:a;if(!n||!ArrayBuffer.isView(n.value))throw Error(`Invalid glTF instance accessor for ${t}`);if(i!==void 0&&n.count!==i)throw Error(`glTF instance attributes must have matching accessor counts`);i=n.count,r[t]={value:n.value,size:n.components||a_(n.type),count:n.count,normalized:!!n.normalized}}let a=[];for(let e=0;e<(i||0);e++){let t=i_(r.TRANSLATION,e,[0,0,0]),n=i_(r.ROTATION,e,[0,0,0,1]),i=i_(r.SCALE,e,[1,1,1]),o=Math.hypot(...n);if(o>0)for(let e=0;e<n.length;e++)n[e]/=o;a.push(new k().translate(t).multiplyRight(new k().fromQuaternion(n)).scale(i))}return{matrices:a,attributes:r}}function i_(e,t,n){if(!e)return[...n];let r=e.value;return n.map((n,i)=>{let a=r[t*e.size+i];return a===void 0?n:e.normalized?e.value instanceof Int8Array?Math.max(a/127,-1):e.value instanceof Int16Array?Math.max(a/32767,-1):e.value instanceof Uint8Array?a/255:e.value instanceof Uint16Array?a/65535:a:a})}function a_(e){switch(e){case`VEC2`:return 2;case`VEC3`:return 3;case`VEC4`:return 4;default:return 1}}var o_=[B(`baseColor`,`pbr_baseColorSampler`,`baseColorTexture`,[`pbrMetallicRoughness`,`baseColorTexture`]),B(`metallicRoughness`,`pbr_metallicRoughnessSampler`,`metallicRoughnessTexture`,[`pbrMetallicRoughness`,`metallicRoughnessTexture`]),B(`normal`,`pbr_normalSampler`,`normalTexture`,[`normalTexture`]),B(`occlusion`,`pbr_occlusionSampler`,`occlusionTexture`,[`occlusionTexture`]),B(`emissive`,`pbr_emissiveSampler`,`emissiveTexture`,[`emissiveTexture`]),B(`specularColor`,`pbr_specularColorSampler`,`KHR_materials_specular.specularColorTexture`,[`extensions`,`KHR_materials_specular`,`specularColorTexture`]),B(`specularIntensity`,`pbr_specularIntensitySampler`,`KHR_materials_specular.specularTexture`,[`extensions`,`KHR_materials_specular`,`specularTexture`]),B(`transmission`,`pbr_transmissionSampler`,`KHR_materials_transmission.transmissionTexture`,[`extensions`,`KHR_materials_transmission`,`transmissionTexture`]),B(`thickness`,`pbr_thicknessSampler`,`KHR_materials_volume.thicknessTexture`,[`extensions`,`KHR_materials_volume`,`thicknessTexture`]),B(`clearcoat`,`pbr_clearcoatSampler`,`KHR_materials_clearcoat.clearcoatTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatTexture`]),B(`clearcoatRoughness`,`pbr_clearcoatRoughnessSampler`,`KHR_materials_clearcoat.clearcoatRoughnessTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatRoughnessTexture`]),B(`clearcoatNormal`,`pbr_clearcoatNormalSampler`,`KHR_materials_clearcoat.clearcoatNormalTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatNormalTexture`]),B(`sheenColor`,`pbr_sheenColorSampler`,`KHR_materials_sheen.sheenColorTexture`,[`extensions`,`KHR_materials_sheen`,`sheenColorTexture`]),B(`sheenRoughness`,`pbr_sheenRoughnessSampler`,`KHR_materials_sheen.sheenRoughnessTexture`,[`extensions`,`KHR_materials_sheen`,`sheenRoughnessTexture`]),B(`iridescence`,`pbr_iridescenceSampler`,`KHR_materials_iridescence.iridescenceTexture`,[`extensions`,`KHR_materials_iridescence`,`iridescenceTexture`]),B(`iridescenceThickness`,`pbr_iridescenceThicknessSampler`,`KHR_materials_iridescence.iridescenceThicknessTexture`,[`extensions`,`KHR_materials_iridescence`,`iridescenceThicknessTexture`]),B(`anisotropy`,`pbr_anisotropySampler`,`KHR_materials_anisotropy.anisotropyTexture`,[`extensions`,`KHR_materials_anisotropy`,`anisotropyTexture`]),B(`bump`,`pbr_bumpSampler`,`EXT_materials_bump.bumpTexture`,[`extensions`,`EXT_materials_bump`,`bumpTexture`]),B(`diffuseTransmission`,`pbr_diffuseTransmissionSampler`,`KHR_materials_diffuse_transmission.diffuseTransmissionTexture`,[`extensions`,`KHR_materials_diffuse_transmission`,`diffuseTransmissionTexture`]),B(`diffuseTransmissionColor`,`pbr_diffuseTransmissionColorSampler`,`KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture`,[`extensions`,`KHR_materials_diffuse_transmission`,`diffuseTransmissionColorTexture`]),B(`multiscatterColor`,`pbr_multiscatterColorSampler`,`KHR_materials_volume_scatter.multiscatterColorTexture`,[`extensions`,`KHR_materials_volume_scatter`,`multiscatterColorTexture`])],s_=new Map(o_.map(e=>[e.slot,e]));function B(e,t,n,r){return{slot:e,binding:t,displayName:n,pathSegments:r,colorSpace:e===`baseColor`||e===`emissive`||e===`specularColor`||e===`sheenColor`||e===`diffuseTransmissionColor`||e===`multiscatterColor`?`srgb`:`linear`,uvSetUniform:`${e}UVSet`,uvTransformUniform:`${e}UVTransform`}}function c_(){return o_}function l_(e){let t=s_.get(e);if(!t)throw Error(`Unknown PBR texture transform slot ${e}`);return t}function u_(e){let t=e?.extensions?.KHR_texture_transform;return{offset:t?.offset?[t.offset[0],t.offset[1]]:[0,0],rotation:t?.rotation??0,scale:t?.scale?[t.scale[0],t.scale[1]]:[1,1]}}function d_(e){return e?.extensions?.KHR_texture_transform?.texCoord??e?.texCoord??0}function f_(e){if(e[0]===`extensions`&&e[1]===`KHR_materials_scatter`){let t=e[2]===`scatterStrengthTexture`?`diffuseTransmission`:e[2]===`multiscatterColorTexture`?`multiscatterColor`:null;if(t&&e.length===3)return{...l_(t),pathSegments:e}}return o_.find(t=>t.pathSegments.length===e.length&&t.pathSegments.every((t,n)=>e[n]===t))||null}function p_(e){let t=new we().set(1,0,0,0,1,0,e.offset[0],e.offset[1],1),n=new we().set(Math.cos(e.rotation),Math.sin(e.rotation),0,-Math.sin(e.rotation),Math.cos(e.rotation),0,0,0,1),r=new we().set(e.scale[0],0,0,0,e.scale[1],0,0,0,1);return Array.from(t.multiplyRight(n).multiplyRight(r))}function m_(e,t){let n=new we(p_(e)),r=new we(p_(t)),i=new we(n).invert();return Array.from(r.multiplyRight(i))}function h_(e,t){a(e.lightmaps.length>0);let n=new Set;for(let r of e.lightmaps)a(Number.isInteger(r.primitive)&&r.primitive>=0&&r.primitive<t),a(!n.has(r.primitive)),n.add(r.primitive)}function g_(e,t={}){let n=e.intensity??1,r=t.intensity??1;a(Number.isFinite(n)&&n>=0),a(Number.isFinite(r)&&r>=0);let i=new we(p_({offset:t.offset??[0,0],rotation:t.rotation??0,scale:t.scale??[1,1]})),o=p_(u_(e.lightmapTexture));return{textureIndex:e.lightmapTexture.index,texCoord:d_(e.lightmapTexture),transform:i.multiplyRight(o),intensity:n*r}}function __(e){let t=[`_LIGHTMAP_OFFSET`,`_LIGHTMAP_SCALE`,`_LIGHTMAP_ROTATION`,`_LIGHTMAP_INTENSITY`];if(!t.some(t=>e.attributes[t]))return null;let n=[2,2,1,1];for(let[r,i]of t.entries()){let t=e.attributes[i];t&&(a(t.value instanceof Float32Array&&!t.normalized),a(t.size===n[r]),a(t.count===e.matrices.length),a(t.value.length===t.count*t.size),a(t.value.every(e=>Number.isFinite(e)&&(i!==`_LIGHTMAP_INTENSITY`||e>=0))))}return e.matrices.map((t,n)=>{let r=e.attributes._LIGHTMAP_OFFSET?.value,i=e.attributes._LIGHTMAP_SCALE?.value,a=e.attributes._LIGHTMAP_ROTATION?.value,o=e.attributes._LIGHTMAP_INTENSITY?.value;return{offset:r?[r[n*2],r[n*2+1]]:[0,0],scale:i?[i[n*2],i[n*2+1]]:[1,1],rotation:a?.[n]??0,intensity:o?.[n]??1}})}function v_(e,t){e.userData.morphWeights=[...t];let n=e.userData.morphMeshes||[];for(let e of n)e.preorderTraversal(e=>{if(!(e instanceof Mr))return;let n=e.userData.morphTargets;if(!n)return;let r=e.userData.gltfMorphWeights;if(r){y_(r,t),e.userData.morphWeights=[...t];return}Yt(e.model,n.geometry,n.targets,t),e.userData.morphWeights=[...t]})}function y_(e,t){e.values.fill(0),e.values.set(t.slice(0,e.values.length)),e.data instanceof i?e.data.write(e.values):e.data.writeData(e.values,{width:e.packedTargetCount,height:1})}var V=function(e){return e[e.POINTS=0]=`POINTS`,e[e.LINES=1]=`LINES`,e[e.LINE_LOOP=2]=`LINE_LOOP`,e[e.LINE_STRIP=3]=`LINE_STRIP`,e[e.TRIANGLES=4]=`TRIANGLES`,e[e.TRIANGLE_STRIP=5]=`TRIANGLE_STRIP`,e[e.TRIANGLE_FAN=6]=`TRIANGLE_FAN`,e[e.ONE=1]=`ONE`,e[e.SRC_ALPHA=770]=`SRC_ALPHA`,e[e.ONE_MINUS_SRC_ALPHA=771]=`ONE_MINUS_SRC_ALPHA`,e[e.FUNC_ADD=32774]=`FUNC_ADD`,e[e.LINEAR=9729]=`LINEAR`,e[e.NEAREST=9728]=`NEAREST`,e[e.NEAREST_MIPMAP_NEAREST=9984]=`NEAREST_MIPMAP_NEAREST`,e[e.LINEAR_MIPMAP_NEAREST=9985]=`LINEAR_MIPMAP_NEAREST`,e[e.NEAREST_MIPMAP_LINEAR=9986]=`NEAREST_MIPMAP_LINEAR`,e[e.LINEAR_MIPMAP_LINEAR=9987]=`LINEAR_MIPMAP_LINEAR`,e[e.TEXTURE_MAG_FILTER=10240]=`TEXTURE_MAG_FILTER`,e[e.TEXTURE_MIN_FILTER=10241]=`TEXTURE_MIN_FILTER`,e[e.TEXTURE_WRAP_S=10242]=`TEXTURE_WRAP_S`,e[e.TEXTURE_WRAP_T=10243]=`TEXTURE_WRAP_T`,e[e.REPEAT=10497]=`REPEAT`,e[e.CLAMP_TO_EDGE=33071]=`CLAMP_TO_EDGE`,e[e.MIRRORED_REPEAT=33648]=`MIRRORED_REPEAT`,e[e.UNPACK_FLIP_Y_WEBGL=37440]=`UNPACK_FLIP_Y_WEBGL`,e}({});function b_(e){switch(e){case V.POINTS:return`point-list`;case V.LINES:return`line-list`;case V.LINE_STRIP:return`line-strip`;case V.TRIANGLES:return`triangle-list`;case V.TRIANGLE_STRIP:return`triangle-strip`;default:throw Error(String(e))}}function x_(e,t,n){if(e!==V.LINE_LOOP&&e!==V.TRIANGLE_FAN)return{topology:b_(e)};let r=t?.length??n,i=e===V.LINE_LOOP?r>=2?r*2:0:r>=3?(r-2)*3:0,a=new(t instanceof Uint32Array||!t&&n>65536?Uint32Array:Uint16Array)(i),o=e=>t?.[e]??e;if(e===V.LINE_LOOP){for(let e=0;e<r;e++)a[e*2]=o(e),a[e*2+1]=o((e+1)%r);return{topology:`line-list`,indices:a}}for(let e=0;e<r-2;e++)a[e*3]=o(0),a[e*3+1]=o(e+1),a[e*3+2]=o(e+2);return{topology:`triangle-list`,indices:a}}function S_(e={}){let t=e.wrapS??e.parameters?.[V.TEXTURE_WRAP_S],n=e.wrapT??e.parameters?.[V.TEXTURE_WRAP_T],r=e.magFilter??e.parameters?.[V.TEXTURE_MAG_FILTER],i=e.minFilter??e.parameters?.[V.TEXTURE_MIN_FILTER],a=C_(t),o=C_(n),s=w_(r);return{...a?{addressModeU:a}:{},...o?{addressModeV:o}:{},...s?{magFilter:s}:{},...T_(i)}}function C_(e){switch(e){case V.CLAMP_TO_EDGE:return`clamp-to-edge`;case V.REPEAT:return`repeat`;case V.MIRRORED_REPEAT:return`mirror-repeat`;default:return}}function w_(e){switch(e){case V.NEAREST:return`nearest`;case V.LINEAR:return`linear`;default:return}}function T_(e){switch(e){case V.NEAREST:return{minFilter:`nearest`};case V.LINEAR:return{minFilter:`linear`};case V.NEAREST_MIPMAP_NEAREST:return{minFilter:`nearest`,mipmapFilter:`nearest`};case V.LINEAR_MIPMAP_NEAREST:return{minFilter:`linear`,mipmapFilter:`nearest`};case V.NEAREST_MIPMAP_LINEAR:return{minFilter:`nearest`,mipmapFilter:`linear`};case V.LINEAR_MIPMAP_LINEAR:return{minFilter:`linear`,mipmapFilter:`linear`};default:return{}}}var E_={NORMAL:[`NORMAL`,`normals`],TANGENT:[`TANGENT`],TEXCOORD_0:[`TEXCOORD_0`,`texCoords`],TEXCOORD_1:[`TEXCOORD_1`,`texCoords1`],JOINTS_0:[`JOINTS_0`],WEIGHTS_0:[`WEIGHTS_0`],JOINTS_1:[`JOINTS_1`],WEIGHTS_1:[`WEIGHTS_1`],COLOR_0:[`COLOR_0`,`colors`]};function D_(e,t,n,r){let i={defines:{MANUAL_SRGB:!0},bindings:{},uniforms:{camera:[0,0,0],metallicRoughnessValues:[1,1]},parameters:{},glParameters:{},generatedTextures:[]};i.defines.USE_TEX_LOD=!0;let{imageBasedLightingEnvironment:o}=r;if(o&&(i.bindings.pbr_diffuseEnvSampler=o.diffuseEnvSampler.texture,i.bindings.pbr_specularEnvSampler=o.specularEnvSampler.texture,i.bindings.pbr_brdfLUT=o.brdfLutTexture.texture,i.uniforms.IBLenabled=!0,i.uniforms.scaleIBLAmbient=[1,1]),r?.pbrDebug&&(i.defines.PBR_DEBUG=!0,i.uniforms.scaleDiffBaseMR=[0,0,0,0],i.uniforms.scaleFGDSpec=[0,0,0,0]),H(n,`NORMAL`)&&(i.defines.HAS_NORMALS=!0),H(n,`TANGENT`)&&r?.useTangents&&(i.defines.HAS_TANGENTS=!0),H(n,`TEXCOORD_0`)&&(i.defines.HAS_UV=!0),H(n,`TEXCOORD_1`)&&(i.defines.HAS_UV_1=!0),H(n,`JOINTS_0`)&&H(n,`WEIGHTS_0`)&&(i.defines.HAS_SKIN=!0),i.defines.HAS_SKIN&&H(n,`JOINTS_1`)&&H(n,`WEIGHTS_1`)&&(i.defines.HAS_SKIN_1=!0),H(n,`COLOR_0`)&&(i.defines.HAS_COLORS=!0),r?.imageBasedLightingEnvironment&&(i.defines.USE_IBL=!0),r?.lights&&(i.defines.USE_LIGHTS=!0),t){if(r.validateAttributes!==!1){O_(t,n);let e=t.extensions?.KHR_lightmap;if(e&&r.validateLightmapAttributes!==!1){let t=d_(e.lightmapTexture);a((t===0||t===1)&&H(n,t===0?`TEXCOORD_0`:`TEXCOORD_1`))}}j_(e,t,i,n,r.gltf,r.materialResourcesOnly)}return i}function O_(e,n){let r=k_(e,0);r.length>0&&!H(n,`TEXCOORD_0`)&&t.warn(`glTF material uses ${r.join(`, `)} but primitive is missing TEXCOORD_0; textured shading will sample the default UV coordinates`)();let i=k_(e,1);if(i.length>0&&!H(n,`TEXCOORD_1`)&&t.warn(`glTF material uses ${i.join(`, `)} with TEXCOORD_1 but primitive is missing TEXCOORD_1; those textures will be skipped`)(),e.unlit||e.extensions?.KHR_materials_unlit||H(n,`NORMAL`))return;let a=e.normalTexture?`lit PBR shading with normalTexture`:`lit PBR shading`;t.warn(`glTF primitive is missing NORMAL while using ${a}; shading will fall back to geometric normals`)()}function k_(e,t){let n=[];for(let r of c_()){let i=A_(e,r.pathSegments);i&&d_(i)===t&&n.push(r.displayName)}return n}function H(e,t){return E_[t].some(t=>!!e[t])}function A_(e,t){let n=e;for(let e of t)if(n=n?.[e],!n)return null;return n}function j_(e,n,r,i,a,o=!1){if(r.parameters.cullMode=n.doubleSided?`none`:`back`,r.defines.DOUBLE_SIDED=!!n.doubleSided,r.uniforms.unlit=!!(n.unlit||n.extensions?.KHR_materials_unlit),n.pbrMetallicRoughness&&P_(e,n.pbrMetallicRoughness,r,i,a),n.normalTexture){U(e,n.normalTexture,`pbr_normalSampler`,r,{featureOptions:{define:`HAS_NORMALMAP`,enabledUniformName:`normalMapEnabled`},gltf:a,attributes:i,textureTransformSlot:`normal`});let{scale:t=1}=n.normalTexture;r.uniforms.normalScale=t}if(n.occlusionTexture){U(e,n.occlusionTexture,`pbr_occlusionSampler`,r,{featureOptions:{define:`HAS_OCCLUSIONMAP`,enabledUniformName:`occlusionMapEnabled`},gltf:a,attributes:i,textureTransformSlot:`occlusion`});let{strength:t=1}=n.occlusionTexture;r.uniforms.occlusionStrength=t}switch(r.uniforms.emissiveFactor=n.emissiveFactor||[0,0,0],n.emissiveTexture&&U(e,n.emissiveTexture,`pbr_emissiveSampler`,r,{featureOptions:{define:`HAS_EMISSIVEMAP`,enabledUniformName:`emissiveMapEnabled`},gltf:a,attributes:i,textureTransformSlot:`emissive`}),F_(e,n.extensions,r,a,i,o),n.alphaMode||`OPAQUE`){case`OPAQUE`:break;case`MASK`:{let{alphaCutoff:e=.5}=n;r.defines.ALPHA_CUTOFF=!0,r.uniforms.alphaCutoffEnabled=!0,r.uniforms.alphaCutoff=e;break}case`BLEND`:t.warn(`glTF BLEND alphaMode might not work well because it requires mesh sorting`)(),M_(r);break}}function M_(e){e.parameters.blend=!0,e.parameters.blendColorOperation=`add`,e.parameters.blendColorSrcFactor=`src-alpha`,e.parameters.blendColorDstFactor=`one-minus-src-alpha`,e.parameters.blendAlphaOperation=`add`,e.parameters.blendAlphaSrcFactor=`one`,e.parameters.blendAlphaDstFactor=`one-minus-src-alpha`,e.glParameters.blend=!0,e.glParameters.blendEquation=V.FUNC_ADD,e.glParameters.blendFunc=[V.SRC_ALPHA,V.ONE_MINUS_SRC_ALPHA,V.ONE,V.ONE_MINUS_SRC_ALPHA]}function N_(e){e.parameters.blend=!0,e.parameters.depthWriteEnabled=!1,e.parameters.blendColorOperation=`add`,e.parameters.blendColorSrcFactor=`one`,e.parameters.blendColorDstFactor=`one-minus-src-alpha`,e.parameters.blendAlphaOperation=`add`,e.parameters.blendAlphaSrcFactor=`one`,e.parameters.blendAlphaDstFactor=`one-minus-src-alpha`,e.glParameters.blend=!0,e.glParameters.depthMask=!1,e.glParameters.blendEquation=V.FUNC_ADD,e.glParameters.blendFunc=[V.ONE,V.ONE_MINUS_SRC_ALPHA,V.ONE,V.ONE_MINUS_SRC_ALPHA]}function P_(e,t,n,r,i){t.baseColorTexture&&U(e,t.baseColorTexture,`pbr_baseColorSampler`,n,{featureOptions:{define:`HAS_BASECOLORMAP`,enabledUniformName:`baseColorMapEnabled`},gltf:i,attributes:r,textureTransformSlot:`baseColor`}),n.uniforms.baseColorFactor=t.baseColorFactor||[1,1,1,1],t.metallicRoughnessTexture&&U(e,t.metallicRoughnessTexture,`pbr_metallicRoughnessSampler`,n,{featureOptions:{define:`HAS_METALROUGHNESSMAP`,enabledUniformName:`metallicRoughnessMapEnabled`},gltf:i,attributes:r,textureTransformSlot:`metallicRoughness`});let{metallicFactor:a=1,roughnessFactor:o=1}=t;n.uniforms.metallicRoughnessValues=[a,o]}function F_(e,t,n,r,i={},o=!1){if(!t)return;let s=t.KHR_lightmap;if(s){let t=s.intensity??1;a(Number.isFinite(t)&&t>=0),n.uniforms.lightmapIntensity=t,n.uniforms.lightmapUVSet=d_(s.lightmapTexture),n.uniforms.lightmapUVTransform=new we(p_(u_(s.lightmapTexture))),!o&&Object.keys(i).length>0&&U(e,s.lightmapTexture,`pbr_lightmapSampler`,n,{gltf:r,attributes:i,featureOptions:{define:`HAS_LIGHTMAP`,enabledUniformName:`lightmapMapEnabled`}})}I_(t)&&(n.defines.USE_MATERIAL_EXTENSIONS=!0),L_(e,t.KHR_materials_specular,n,r,i),R_(t.KHR_materials_ior,n),B_(e,t.EXT_materials_bump,n,r,i),z_(e,t.KHR_materials_transmission,n,r,i),V_(e,t.KHR_materials_diffuse_transmission,n,r,i),H_(e,t.KHR_materials_volume,n,r,i),U_(e,t.KHR_materials_volume_scatter,t.KHR_materials_volume,n,r,i);let c=t.KHR_materials_scatter;if(c&&t.KHR_materials_transmission){a(!t.KHR_materials_volume?.thicknessFactor),c.scatterStrengthTexture&&V_(e,{diffuseTransmissionTexture:c.scatterStrengthTexture},n,r,i),a(!t.KHR_materials_unlit&&!t.KHR_materials_diffuse_transmission&&!t.KHR_materials_pbrSpecularGlossiness);let o=c.scatterStrengthFactor??0,s=c.scatterAnisotropy??0;a(Number.isFinite(o)&&o>=0&&o<=1),a(Number.isFinite(s)&&s>-1&&s<1),n.defines.HAS_MATERIAL_SCATTER=!0,n.uniforms.scatterStrengthFactor=o,U_(e,c,{},n,r,i),n.uniforms.scatterAnisotropy=s,n.uniforms.multiscatterColorFactor=c.multiscatterColorFactor??c.multiscatterColor??[1,1,1]}W_(t.KHR_materials_dispersion,n),G_(e,t.KHR_materials_clearcoat,n,r,i),K_(e,t.KHR_materials_sheen,n,r,i),q_(e,t.KHR_materials_iridescence,n,r,i),J_(e,t.KHR_materials_anisotropy,n,r,i),Y_(t.KHR_materials_emissive_strength,n)}function I_(e){return!!(e.KHR_materials_specular||e.KHR_materials_ior||e.EXT_materials_bump||e.KHR_materials_transmission||e.KHR_materials_diffuse_transmission||e.KHR_materials_volume||e.KHR_materials_volume_scatter||e.KHR_materials_dispersion||e.KHR_materials_clearcoat||e.KHR_materials_sheen||e.KHR_materials_iridescence||e.KHR_materials_anisotropy)}function L_(e,t,n,r,i={}){t&&(t.specularColorFactor&&(n.uniforms.specularColorFactor=t.specularColorFactor),t.specularFactor!==void 0&&(n.uniforms.specularIntensityFactor=t.specularFactor),t.specularColorTexture&&U(e,t.specularColorTexture,`pbr_specularColorSampler`,n,{featureOptions:{define:`HAS_SPECULARCOLORMAP`,enabledUniformName:`specularColorMapEnabled`},gltf:r,attributes:i,textureTransformSlot:`specularColor`}),t.specularTexture&&U(e,t.specularTexture,`pbr_specularIntensitySampler`,n,{featureOptions:{define:`HAS_SPECULARINTENSITYMAP`,enabledUniformName:`specularIntensityMapEnabled`},gltf:r,attributes:i,textureTransformSlot:`specularIntensity`}))}function R_(e,t){e?.ior!==void 0&&(t.uniforms.ior=e.ior)}function z_(e,n,r,i,a={}){n&&(n.transmissionFactor!==void 0&&(r.uniforms.transmissionFactor=n.transmissionFactor),n.transmissionTexture&&U(e,n.transmissionTexture,`pbr_transmissionSampler`,r,{featureOptions:{define:`HAS_TRANSMISSIONMAP`,enabledUniformName:`transmissionMapEnabled`},gltf:i,attributes:a,textureTransformSlot:`transmission`}),((n.transmissionFactor??0)>0||n.transmissionTexture)&&(t.warn(`KHR_materials_transmission uses a premultiplied-alpha blending approximation and may require mesh sorting`)(),N_(r)))}function B_(e,t,n,r,i={}){t&&(n.uniforms.bumpFactor=Math.max(t.bumpFactor??1,0),t.bumpTexture&&U(e,t.bumpTexture,`pbr_bumpSampler`,n,{featureOptions:{define:`HAS_BUMPMAP`,enabledUniformName:`bumpMapEnabled`},gltf:r,attributes:i,textureTransformSlot:`bump`}))}function V_(e,t,n,r,i={}){t&&(n.uniforms.diffuseTransmissionFactor=Math.min(Math.max(t.diffuseTransmissionFactor??0,0),1),n.uniforms.diffuseTransmissionColorFactor=t.diffuseTransmissionColorFactor||[1,1,1],t.diffuseTransmissionTexture&&U(e,t.diffuseTransmissionTexture,`pbr_diffuseTransmissionSampler`,n,{featureOptions:{define:`HAS_DIFFUSETRANSMISSIONMAP`,enabledUniformName:`diffuseTransmissionMapEnabled`},gltf:r,attributes:i,textureTransformSlot:`diffuseTransmission`}),t.diffuseTransmissionColorTexture&&U(e,t.diffuseTransmissionColorTexture,`pbr_diffuseTransmissionColorSampler`,n,{featureOptions:{define:`HAS_DIFFUSETRANSMISSIONCOLORMAP`,enabledUniformName:`diffuseTransmissionColorMapEnabled`},gltf:r,attributes:i,textureTransformSlot:`diffuseTransmissionColor`}))}function H_(e,t,n,r,i={}){t&&(t.thicknessFactor!==void 0&&(n.uniforms.thicknessFactor=t.thicknessFactor),t.thicknessTexture&&U(e,t.thicknessTexture,`pbr_thicknessSampler`,n,{featureOptions:{define:`HAS_THICKNESSMAP`},gltf:r,attributes:i,textureTransformSlot:`thickness`}),t.attenuationDistance!==void 0&&(n.uniforms.attenuationDistance=t.attenuationDistance),t.attenuationColor&&(n.uniforms.attenuationColor=t.attenuationColor))}function U_(e,t,n,r,i,a={}){!t||!n||(r.uniforms.multiscatterColorFactor=t.multiscatterColorFactor||t.multiscatterColor||[0,0,0],r.uniforms.scatterAnisotropy=Math.min(Math.max(t.scatterAnisotropy??0,-.999),.999),t.multiscatterColorTexture&&U(e,t.multiscatterColorTexture,`pbr_multiscatterColorSampler`,r,{featureOptions:{define:`HAS_MULTISCATTERCOLORMAP`,enabledUniformName:`multiscatterColorMapEnabled`},gltf:i,attributes:a,textureTransformSlot:`multiscatterColor`}))}function W_(e,t){e?.dispersion!==void 0&&(t.uniforms.dispersion=Math.max(e.dispersion,0))}function G_(e,t,n,r,i={}){t&&(t.clearcoatFactor!==void 0&&(n.uniforms.clearcoatFactor=t.clearcoatFactor),t.clearcoatRoughnessFactor!==void 0&&(n.uniforms.clearcoatRoughnessFactor=t.clearcoatRoughnessFactor),t.clearcoatTexture&&U(e,t.clearcoatTexture,`pbr_clearcoatSampler`,n,{featureOptions:{define:`HAS_CLEARCOATMAP`,enabledUniformName:`clearcoatMapEnabled`},gltf:r,attributes:i,textureTransformSlot:`clearcoat`}),t.clearcoatRoughnessTexture&&U(e,t.clearcoatRoughnessTexture,`pbr_clearcoatRoughnessSampler`,n,{featureOptions:{define:`HAS_CLEARCOATROUGHNESSMAP`,enabledUniformName:`clearcoatRoughnessMapEnabled`},gltf:r,attributes:i,textureTransformSlot:`clearcoatRoughness`}),t.clearcoatNormalTexture&&U(e,t.clearcoatNormalTexture,`pbr_clearcoatNormalSampler`,n,{featureOptions:{define:`HAS_CLEARCOATNORMALMAP`},gltf:r,attributes:i,textureTransformSlot:`clearcoatNormal`}))}function K_(e,t,n,r,i={}){t&&(t.sheenColorFactor&&(n.uniforms.sheenColorFactor=t.sheenColorFactor),t.sheenRoughnessFactor!==void 0&&(n.uniforms.sheenRoughnessFactor=t.sheenRoughnessFactor),t.sheenColorTexture&&U(e,t.sheenColorTexture,`pbr_sheenColorSampler`,n,{featureOptions:{define:`HAS_SHEENCOLORMAP`,enabledUniformName:`sheenColorMapEnabled`},gltf:r,attributes:i,textureTransformSlot:`sheenColor`}),t.sheenRoughnessTexture&&U(e,t.sheenRoughnessTexture,`pbr_sheenRoughnessSampler`,n,{featureOptions:{define:`HAS_SHEENROUGHNESSMAP`,enabledUniformName:`sheenRoughnessMapEnabled`},gltf:r,attributes:i,textureTransformSlot:`sheenRoughness`}))}function q_(e,t,n,r,i={}){t&&(t.iridescenceFactor!==void 0&&(n.uniforms.iridescenceFactor=t.iridescenceFactor),t.iridescenceIor!==void 0&&(n.uniforms.iridescenceIor=t.iridescenceIor),(t.iridescenceThicknessMinimum!==void 0||t.iridescenceThicknessMaximum!==void 0)&&(n.uniforms.iridescenceThicknessRange=[t.iridescenceThicknessMinimum??100,t.iridescenceThicknessMaximum??400]),t.iridescenceTexture&&U(e,t.iridescenceTexture,`pbr_iridescenceSampler`,n,{featureOptions:{define:`HAS_IRIDESCENCEMAP`,enabledUniformName:`iridescenceMapEnabled`},gltf:r,attributes:i,textureTransformSlot:`iridescence`}),t.iridescenceThicknessTexture&&U(e,t.iridescenceThicknessTexture,`pbr_iridescenceThicknessSampler`,n,{featureOptions:{define:`HAS_IRIDESCENCETHICKNESSMAP`},gltf:r,attributes:i,textureTransformSlot:`iridescenceThickness`}))}function J_(e,t,n,r,i={}){t&&(t.anisotropyStrength!==void 0&&(n.uniforms.anisotropyStrength=t.anisotropyStrength),t.anisotropyRotation!==void 0&&(n.uniforms.anisotropyRotation=t.anisotropyRotation),t.anisotropyTexture&&U(e,t.anisotropyTexture,`pbr_anisotropySampler`,n,{featureOptions:{define:`HAS_ANISOTROPYMAP`,enabledUniformName:`anisotropyMapEnabled`},gltf:r,attributes:i,textureTransformSlot:`anisotropy`}))}function Y_(e,t){e?.emissiveStrength!==void 0&&(t.uniforms.emissiveStrength=e.emissiveStrength)}function U(e,n,r,i,a={}){let{featureOptions:o={},gltf:s,attributes:c={},textureTransformSlot:l}=a,{define:u,enabledUniformName:d}=o,f=d_(n);if(f>1){t.warn(`Skipping ${String(r)} because ${f} is not supported; only TEXCOORD_0 and TEXCOORD_1 are currently available`)();return}if(f===1&&!H(c,`TEXCOORD_1`)){t.warn(`Skipping ${String(r)} because it requires TEXCOORD_1 but the primitive does not provide TEXCOORD_1`)();return}let p=Z_(n,s),m=p.texture?.source?.image;if(!m){t.warn(`Skipping unresolved glTF texture for ${String(r)}`)();return}let h=X_(e,m,{id:p.uniformName||p.id,sampler:{addressModeU:`repeat`,addressModeV:`repeat`,minFilter:`linear`,magFilter:`linear`,...S_(p.texture.sampler)}});if(i.bindings[r]=h,u&&(i.defines[u]=!0),d&&(i.uniforms[d]=!0),l){let e=l_(l);i.uniforms[e.uvSetUniform]=f,i.uniforms[e.uvTransformUniform]=p_(u_(n))}i.generatedTextures.push(h)}function X_(e,t,n){if(`compressed`in t)return tv(e,t,{id:n.id,sampler:n.sampler});let r=n.width!==void 0&&n.height!==void 0?{width:n.width,height:n.height}:e.getExternalImageSize(t),i=n.sampler.mipmapFilter===`nearest`||n.sampler.mipmapFilter===`linear`,a=i?e.getMipLevelCount(r.width,r.height):1,o=e.createTexture({id:n.id,sampler:n.sampler,width:r.width,height:r.height,mipLevels:a,...i?{usage:g.SAMPLE|g.RENDER|g.COPY_DST|g.COPY_SRC}:{},...n.colorSpace?{format:n.colorSpace===`srgb`?`rgba8unorm-srgb`:`rgba8unorm`}:{},data:t});return a>1&&(e.type===`webgl`?o.generateMipmapsWebGL():e.type===`webgpu`&&e.generateMipmapsWebGPU(o)),o}function Z_(e,t){if(e.texture||e.index===void 0||!t?.textures)return e;let n=t.textures[e.index];return n?`texture`in n&&n.texture?{...n,...e,texture:n.texture}:`source`in n?{...e,texture:n}:e:e}function Q_(e,t){return e.createTexture({...t,format:`rgba8unorm`,width:1,height:1,mipLevels:1})}function $_(e){return e.textureFormat}function ev(e,t,n){let{blockWidth:r=1,blockHeight:i=1}=m.getInfo(n),a=1;for(let n=1;;n++){let o=Math.max(1,e>>n),s=Math.max(1,t>>n);if(o<r||s<i)break;a++}return a}function tv(e,n,r){let i;if(i=Array.isArray(n.data)&&n.data[0]?.data?n.data:`mipmaps`in n&&Array.isArray(n.mipmaps)?n.mipmaps:[],i.length===0||!i[0]?.data)return t.warn(`createCompressedTexture: compressed image has no valid mip levels, creating fallback`)(),Q_(e,r);let a=i[0],o=a.width??n.width??0,s=a.height??n.height??0;if(o<=0||s<=0)return t.warn(`createCompressedTexture: base level has invalid dimensions, creating fallback`)(),Q_(e,r);let c=$_(a);if(!c)return t.warn(`createCompressedTexture: compressed image has no textureFormat, creating fallback`)(),Q_(e,r);if(!e.isTextureFormatSupported(c))return t.warn(`createCompressedTexture: ${e.type} device does not support '${c}', creating fallback`)(),Q_(e,r);let l=ev(o,s,c),u=Math.min(i.length,l),d=1;for(let e=1;e<u;e++){let n=i[e];if(!n.data||n.width<=0||n.height<=0){t.warn(`createCompressedTexture: mip level ${e} has invalid data/dimensions, truncating`)();break}let r=$_(n);if(r&&r!==c){t.warn(`createCompressedTexture: mip level ${e} format '${r}' differs from base '${c}', truncating`)();break}let a=Math.max(1,o>>e),l=Math.max(1,s>>e);if(n.width!==a||n.height!==l){t.warn(`createCompressedTexture: mip level ${e} dimensions ${n.width}x${n.height} don't match expected ${a}x${l}, truncating`)();break}d++}let f=e.createTexture({...r,format:c,usage:g.TEXTURE|g.COPY_DST,width:o,height:s,mipLevels:d,data:a.data});for(let e=1;e<d;e++)f.writeData(i[e].data,{width:i[e].width,height:i[e].height,mipLevel:e});return f}var nv={modelOptions:{},pbrDebug:!1,imageBasedLightingEnvironment:void 0,lights:!0,useTangents:!1,useByteColors:!0,strictExtensions:!1};function rv(e,t,n={}){let r=new Set,i=new Map,o={...nv,...n,generatedTextures:r,materialInstances:i},s=new Zn(e,{modules:[Xn]}),c=(t.materials||[]).map((n,r)=>Qg(e,{id:fv(n,r),parsedPPBRMaterial:iv(e,n,{TEXCOORD_1:!0},{...o,gltf:t,validateAttributes:!1,materialResourcesOnly:!0}),materialFactory:s})),l=new Map;(t.materials||[]).forEach((e,t)=>{l.set(e.id,c[t])});let u=new Map;t.meshes.forEach((n,r)=>{let i=ov(e,n,t,l,{...o,validateLightmapAttributes:!1});u.set(n.id,i)});let d=new Map,f=new Map,p=new Set,m=new Set,h=new Set;return t.nodes.forEach((t,n)=>{let r=av(e,t,o);d.set(n,r),f.set(t.id,r)}),t.nodes.forEach((n,r)=>{if(d.get(r).add((n.children??[]).map(({id:e})=>{let t=f.get(e);if(!t)throw Error(`Cannot find child ${e} of node ${r}`);return t})),n.mesh){let i=n.mesh,s=r_(t,n),c=n.extensions?.KHR_lightmap;c&&h_(c,i.primitives.length);for(let[e,t]of i.primitives.entries()){let n=c?.lightmaps.find(t=>t.primitive===e)||t.material?.extensions?.KHR_lightmap;if(n){let e=d_(n.lightmapTexture);a((e===0||e===1)&&!!t.attributes[`TEXCOORD_${e}`])}}let f=i.primitives.some(e=>!!e.targets?.length),g=c||s||f&&p.has(i.id)?ov(e,i,t,l,o,s||void 0,c):u.get(i.id);if(!g)throw Error(`Cannot find mesh child ${n.mesh.id} of node ${r}`);let _=d.get(r),v=u.get(i.id),y=m.has(i.id)&&(n.skin!==void 0||h.has(i.id))&&g===v?ov(e,i,t,l,o):g;if(_.add(y),_.userData.gltfMesh=y,m.add(i.id),n.skin!==void 0&&h.add(i.id),f){p.add(i.id);let e=i.primitives.find(e=>e.targets?.length)?.targets?.length||0,t=n.weights||i.weights||Array(e).fill(0);_.userData.morphMeshes=[y],o.modelOptions?.userData?.gltfAnimatedCrowd?_.userData.morphWeights=[...t]:v_(_,t)}}}),{scenes:t.scenes.map(e=>{let t=(e.nodes||[]).map(({id:t})=>{let n=f.get(t);if(!n)throw Error(`Cannot find child ${t} of scene ${e.name||e.id}`);return n});return new jr({id:e.name||e.id,children:t})}),materials:c,gltfMeshIdToNodeMap:u,gltfNodeIdToNodeMap:f,gltfNodeIndexToNodeMap:d,generatedTextures:r,materialInstances:i}}function iv(e,t,n,r){let i=D_(e,t,n,r);for(let e of i.generatedTextures)r.generatedTextures.add(e);return i}function av(e,t,n){return new jr({id:t.name||t.id,children:[],matrix:t.matrix,display:t.extensions?.KHR_node_visibility?.visible!==!1,position:t.translation,rotation:t.rotation,scale:t.scale})}function ov(e,t,n,r,i,o,s,c){let l=t.primitives||[],u=o&&__(o);if(u)return a(!!s?.lightmaps.length||l.some(e=>e.material?.extensions?.KHR_lightmap)),new jr({id:t.name||t.id,children:u.map((a,c)=>new jr({matrix:o.matrices[c],children:[ov(e,t,n,r,i,void 0,s,a)]}))});let d=l.map((a,l)=>sv({device:e,gltfPrimitive:a,primitiveIndex:l,gltfMesh:t,gltf:n,gltfMaterialIdToMaterialMap:r,options:i,instancing:o,nodeLightmap:s,lightmapInstance:c}));return new jr({id:t.name||t.id,children:d})}function sv({device:e,gltfPrimitive:t,primitiveIndex:n,gltfMesh:r,gltf:i,gltfMaterialIdToMaterialMap:a,options:o,instancing:s,nodeLightmap:c,lightmapInstance:l}){let u=t.name||`${r.name||r.id}-primitive-${n}`,d=uv(t.attributes),f=dv(u,t,x_(t.mode??4,t.indices?.value,d)),p=f.vertexCount,m=lv(t,i,f),h=c?.lightmaps.find(e=>e.primitive===n),g=h?{...t.material,extensions:{...t.material?.extensions,KHR_lightmap:h}}:t.material,_=iv(e,g,f.attributes,{...o,gltf:i});if(l&&g?.extensions?.KHR_lightmap){let e=g_(g.extensions.KHR_lightmap,l);_.uniforms.lightmapUVTransform=e.transform,_.uniforms.lightmapIntensity=e.intensity}let v=$g(e,{id:u,geometry:f,material:!g?.extensions?.KHR_lightmap&&t.material&&a.get(t.material.id)||null,parsedPPBRMaterial:_,modelOptions:o.modelOptions,vertexCount:p,bounds:[t.attributes.POSITION.min,t.attributes.POSITION.max],instanceMatrices:s?.matrices,usesLargeSkinPalette:cv(t.attributes.JOINTS_0,t.attributes.JOINTS_1),morphTargets:m?.targets});if(t.material&&v.model.material){let e=i.materials.findIndex(e=>e.id===t.material.id);pv(o.materialInstances,e,v.model.material)}s&&(v.userData.gltfInstancing=s);let y=t.extensions?.KHR_materials_variants?.mappings||[];if(y.length){let t=new Map;for(let n of y){let r=typeof n.material==`number`?i.materials[n.material]:n.material,s=h?{...r,extensions:{...r?.extensions,KHR_lightmap:h}}:r,c=s&&a.get(s.id);if(!c)continue;let u=iv(e,s,f.attributes,{...o,gltf:i});if(s.extensions?.KHR_lightmap){if(l){let e=g_(s.extensions.KHR_lightmap,l);u.uniforms.lightmapUVTransform=e.transform,u.uniforms.lightmapIntensity=e.intensity}c=Qg(e,{parsedPPBRMaterial:u})}pv(o.materialInstances,i.materials.indexOf(r),c);for(let e of n.variants||[])t.set(e,{material:c,parameters:{...v.model.parameters,...u.parameters,depthWriteEnabled:s.alphaMode!==`BLEND`,cullMode:s.doubleSided?`none`:`back`}})}v.userData.gltfMaterialVariants={defaultMaterial:v.model.material,defaultParameters:{...v.model.parameters},mappings:t}}return m&&(v.userData.morphTargets=m),v}function cv(...e){for(let t of e)if(t){if(t.max?.some(e=>e>=64))return!0;for(let e=0;e<(t.value?.length||0);e++)if(t.value[e]>=64)return!0}return!1}function lv(e,t,n){if(!e.targets?.length)return;let r={};for(let e of[`POSITION`,`NORMAL`,`TANGENT`]){let t=n.attributes[e]?.value;t instanceof Float32Array&&(r[e]=new Float32Array(t))}return{geometry:n,baseAttributes:r,targets:e.targets.map(e=>{let n={};for(let r of[`POSITION`,`NORMAL`,`TANGENT`]){let i=e[r],a=typeof i==`number`?t.accessors[i]:i;a?.value&&ArrayBuffer.isView(a.value)&&(n[r]=qt(a))}return n})}}function uv(e){let t=1/0;for(let n of Object.values(e))if(n){let{value:e,size:r,components:i}=n,a=r??i;e?.length!==void 0&&a>=1&&(t=Math.min(t,e.length/a))}if(!Number.isFinite(t))throw Error(`Could not determine vertex count from attributes`);return t}function dv(e,t,n){let r={};for(let[e,n]of Object.entries(t.attributes)){let{components:i,size:a,value:o,normalized:s}=n,c=e===`POSITION`||e===`NORMAL`||e===`TANGENT`,l=!!(t.targets?.length&&c);r[e]={size:a??i,value:l?qt({value:o,normalized:s}):o,normalized:l?!1:s}}return new fe({id:e,topology:n.topology,indices:n.indices??t.indices?.value,attributes:r})}function fv(e,t){return e.name||e.id||`material-${t}`}function pv(e,t,n){if(t<0)return;let r=e.get(t)||[];r.includes(n)||r.push(n),e.set(t,r)}function mv(e,t={}){let n=t.lightDefinitions||e.lights||e.extensions?.KHR_lights_punctual?.lights;if(!n||!Array.isArray(n)||n.length===0)return[];let r=[],i=bv(e.nodes||[]),a=new Map;for(let o of e.nodes||[]){if(!hv(o,i,t.nodeVisibility))continue;let e=o.light??o.extensions?.KHR_lights_punctual?.light;if(typeof e!=`number`||t.nodeIdentifiers&&!t.nodeIdentifiers.has(o.id))continue;let s=n[e];if(!s)continue;let c=gv(s.color||[1,1,1],t.useByteColors??!0),l=s.intensity??1,u=s.range,d=xv(o,i,a);switch(s.type){case`directional`:r.push(vv(d,c,l));break;case`point`:r.push(_v(d,c,l,u));break;case`spot`:r.push(yv(d,c,l,u,s.spot));break;default:break}}return r}function hv(e,t,n){let r=e;for(;r;){let e=n?.get(r.id);if(e?!e.display:r.extensions?.KHR_node_visibility?.visible===!1)return!1;r=t.get(r.id)}return!0}function gv(e,t){return t?e.map(e=>e*255):mn(e,!1)}function _v(e,t,n,r){let i=Cv(e),a=[1,0,0];return r!==void 0&&r>0&&(a=[1,0,1/(r*r)]),{type:`point`,position:i,color:t,intensity:n,attenuation:a}}function vv(e,t,n){return{type:`directional`,direction:wv(e),color:t,intensity:n}}function yv(e,t,n,r,i={}){let a=Cv(e),o=wv(e),s=[1,0,0];return r!==void 0&&r>0&&(s=[1,0,1/(r*r)]),{type:`spot`,position:a,direction:o,color:t,intensity:n,attenuation:s,innerConeAngle:i.innerConeAngle??0,outerConeAngle:i.outerConeAngle??Math.PI/4}}function bv(e){let t=new Map;for(let n of e)for(let e of n.children||[])t.set(e.id,n);return t}function xv(e,t,n){let r=n.get(e.id);if(r)return r;let i=Sv(e),a=t.get(e.id),o=a?new k(xv(a,t,n)).multiplyRight(i):i;return n.set(e.id,o),o}function Sv(e){if(e.matrix)return new k(e.matrix);let t=new k;return e.translation&&t.translate(e.translation),e.rotation&&t.multiplyRight(new k().fromQuaternion(e.rotation)),e.scale&&t.scale(e.scale),t}function Cv(e){return e.transformAsPoint([0,0,0])}function wv(e){return e.transformAsVector([0,0,-1])}var Tv=class extends Ft{animation;gltfNodeIdToNodeMap;onVisibilityChange;cameras;lightDefinitions;onLightChange;materials;materialInstances;clip;mixer;action;materialTextureTransformState=new Map;constructor(e){if(super({name:e.animation.name||`unnamed`}),this.animation=e.animation,this.gltfNodeIdToNodeMap=e.gltfNodeIdToNodeMap,this.onVisibilityChange=e.onVisibilityChange,this.cameras=e.cameras||[],this.lightDefinitions=e.lightDefinitions||[],this.onLightChange=e.onLightChange,this.materials=e.materials||[],this.materialInstances=e.materialInstances||new Map,this.animation.name||=`unnamed`,this.name=this.animation.name,this.animation.channels.some(e=>e.type===`material`||e.type===`textureTransform`)&&!this.materials.length)throw Error(`Animation ${this.animation.name} targets materials, but GLTFAnimator was created without a materials array`);this.mixer=e.mixer||new Kt,this.clip=new Wt({name:this.name,tracks:this.animation.channels.map(e=>this.createAnimationTrack(e))}),this.action=this.mixer.clipAction(this.clip).play()}applyTime(e){this.action.setTime(e),this.mixer.update(0)}createAnimationTrack(e){let t=Dv(e.sampler.interpolation);if(e.type===`node`)return new Ut({name:`${e.targetNodeId}.${e.path}`,times:e.sampler.input,values:e.sampler.output,interpolation:t,valueType:e.path===`rotation`?`quaternion`:`vector`,binding:{id:`node:${e.targetNodeId}:${e.path}`,getValue:()=>this.getNodeAnimationValue(e.targetNodeId,e.path),setValue:t=>this.applyNodeAnimationValue(e.targetNodeId,e.path,t)}});if(e.type===`camera`||e.type===`light`)return new Ut({name:e.pointer,times:e.sampler.input,values:e.sampler.output,interpolation:t,binding:{id:e.pointer,getValue:()=>this.getSceneAnimationValue(e),setValue:t=>this.applySceneAnimationValue(e,t)}});let n=this.materials[e.targetMaterialIndex];if(!n)throw Error(`Cannot find animation target material ${e.targetMaterialIndex} for ${e.pointer}`);return new Ut({name:e.pointer,times:e.sampler.input,values:e.sampler.output,interpolation:t,binding:{id:e.pointer,getValue:e.type===`material`?()=>Ov(n,e):void 0,setValue:t=>{let r=new Set([n,...this.materialInstances.get(e.targetMaterialIndex)||[]]);for(let n of r)e.type===`material`?kv(n,e,t):Mv(n,e,t,this.materialTextureTransformState)}}})}getNodeAnimationValue(e,t){let n=this.getTargetNode(e);switch(t){case`translation`:return Array.from(n.position);case`rotation`:return Array.from(n.rotation);case`scale`:return Array.from(n.scale);case`weights`:return Array.from(n.userData.morphWeights||[]);case`visibility`:return[n.display?1:0];default:return[]}}applyNodeAnimationValue(e,n,r){let i=this.getTargetNode(e);switch(n){case`translation`:i.setPosition(r).updateMatrix();break;case`rotation`:i.setRotation(r).updateMatrix();break;case`scale`:i.setScale(r).updateMatrix();break;case`weights`:v_(i,r);break;case`visibility`:i.setProps({display:r[0]!==0}),this.onVisibilityChange?.();break;default:t.warn(`Bad animation path ${n}`)()}}getTargetNode(e){let t=this.gltfNodeIdToNodeMap.get(e);if(!t)throw Error(`Cannot find animation target node ${e}`);return t}getSceneAnimationValue(e){if(e.type===`camera`){let t=this.cameras[e.targetCameraIndex]?.[e.projection]?.[e.property];return typeof t==`number`?[t]:[]}let t=this.lightDefinitions[e.targetLightIndex],n=e.property===`innerConeAngle`||e.property===`outerConeAngle`?t?.spot?.[e.property]:t?.[e.property];return Array.isArray(n)?e.component===void 0?[...n]:[n[e.component]]:typeof n==`number`?[n]:[]}applySceneAnimationValue(e,t){if(e.type===`camera`){let n=this.cameras[e.targetCameraIndex];n?.[e.projection]&&(n[e.projection][e.property]=t[0]);return}let n=this.lightDefinitions[e.targetLightIndex];if(n){if(e.property===`innerConeAngle`||e.property===`outerConeAngle`)n.spot||={},n.spot[e.property]=t[0];else if(e.component!==void 0){let r=[...n[e.property]||[1,1,1]];r[e.component]=t[0],n[e.property]=r}else n[e.property]=t.length===1?t[0]:[...t];this.onLightChange?.()}}},Ev=class extends It{mixer;activeClip;onUpdate;previousTimeSeconds;constructor(e){let t=new Kt;super(e.animations.map((n,r)=>{let i=n.name||`Animation-${r}`;return new Tv({gltfNodeIdToNodeMap:e.gltfNodeIdToNodeMap,onVisibilityChange:e.onVisibilityChange,cameras:e.cameras,lightDefinitions:e.lightDefinitions,onLightChange:e.onLightChange,materials:e.materials,materialInstances:e.materialInstances,mixer:t,animation:{name:i,channels:n.channels}})})),this.mixer=t,this.onUpdate=e.onUpdate,this.activeClip=this.clips[0]?.name,e.autoplay===!1?this.clips.forEach(e=>{e.playing=!1,e.action.stop()}):e.autoplay===`first`&&this.activeClip&&this.selectClip(this.activeClip)}setUpdateHandler(e){return this.onUpdate=e,this}setTime(e){let t=e/1e3,n=this.previousTimeSeconds===void 0?0:t-this.previousTimeSeconds;this.previousTimeSeconds=t;let r=n*this.mixer.timeScale;this.clips.forEach(e=>{if(!e.playing){e.action.stop();return}if(e.action.paused)return;e.action.resume();let n=Math.max(0,t-e.startTime)*e.speed;e.action.setTime(n-r*e.action.timeScale)}),this.mixer.update(n),this.onUpdate?.()}update(e){this.mixer.update(e),this.onUpdate?.()}selectClip(e,t={}){let n=this.clips.find(t=>t.name===e);if(!n)throw Error(`Unknown animation clip: ${e}`);let r=this.clips.find(e=>e.name===this.activeClip),i=t.crossFadeDuration||0;for(let e of this.clips)e!==n&&!(i>0&&e===r)&&(e.playing=!1,e.action.stop());return n.playing=!0,i>0&&r&&r!==n?(r.playing=!0,r.action.crossFadeTo(n.action,i)):n.action.reset().setEffectiveWeight(1).play(),this.activeClip=e,n}};function Dv(e){switch(e){case`STEP`:case`LINEAR`:case`CUBICSPLINE`:return e;default:throw Error(`Unsupported animation interpolation: ${e}`)}}function Ov(e,t){let n=e.shaderInputs.getUniformValues().pbrMaterial?.[t.property];return Array.isArray(n)?t.component===void 0?[...n]:[n[t.component]]:typeof n==`number`?[n]:[]}function kv(e,t,n){let r=t.component===void 0?{[t.property]:n.length===1?n[0]:n}:{[t.property]:jv(Av(e,t.property),t.component,n[0])};e.setProps({pbrMaterial:r})}function Av(e,t){let n=e.shaderInputs.getUniformValues().pbrMaterial?.[t];return Array.isArray(n)?[...n]:[]}function jv(e,t,n){let r=[...e];return r[t]=n,r}function Mv(e,t,n,r){let i=l_(t.textureSlot),a=Nv(r,e,t);switch(t.path){case`offset`:t.component===void 0?a.offset=[n[0],n[1]]:a.offset[t.component]=n[0];break;case`rotation`:a.rotation=n[0];break;case`scale`:t.component===void 0?a.scale=[n[0],n[1]]:a.scale[t.component]=n[0];break}e.setProps({pbrMaterial:{[i.uvTransformUniform]:m_(t.baseTransform,a)}})}function Nv(e,t,n){let r=e.get(t)||{},i=r[n.textureSlot];return i||(i={offset:[...n.baseTransform.offset],rotation:n.baseTransform.rotation,scale:[...n.baseTransform.scale]},r[n.textureSlot]=i,e.set(t,r)),i}function Pv(e){return{scenes:e.scenes,bindings:Fv(e)}}function Fv(e){let{gltf:t,gltfNodeIndexToNodeMap:n}=e,r=[],i=t.skins||[],a=new Set;for(let t of e.scenes)t.preorderTraversal(e=>{e instanceof jr&&a.add(e)});for(let[o,s]of t.nodes.entries()){let c=s.skin;if(c===void 0||!s.mesh)continue;let l=i[Iv(t,c)],u=n.get(o);if(!l||!u||!a.has(u))continue;let d=l.joints.flatMap(e=>{let t=n.get(e);return t?[t]:[]});if(d.length!==l.joints.length)continue;let f=s.mesh,p=u.userData.gltfMesh,m=p instanceof jr?p:u.children.find(e=>e instanceof jr&&e.id===(f.name||f.id));if(!(m instanceof jr))continue;let h=[];m.preorderTraversal(e=>{e instanceof Mr&&h.push(e)});let g=l.inverseBindMatrices?.value,_=new Float32Array(d.length*16),v=d.length>64&&h.some(e=>e.userData.gltfLargeSkinPalette===!0),y;v&&(y=Fr(e.device,u.id,_)),r.push({node:u,joints:d,...g instanceof Float32Array?{inverseBindMatrices:g}:{},jointMatrices:_,...y?{skinJointMatrices:y}:{},models:h})}return r}function Iv(e,t){return typeof t==`number`?t:(e.skins||[]).findIndex(n=>{if(n===t||t.id&&n.id===t.id)return!0;if(n.joints.length!==t.joints?.length||!n.joints.every((e,n)=>e===t.joints?.[n]))return!1;if(typeof t.inverseBindMatrices==`number`){let r=e.accessors[t.inverseBindMatrices];return!n.inverseBindMatrices||n.inverseBindMatrices===r}return!0})}var Lv={supportLevel:`none`,standardStatus:`unknown`,comment:`Not currently listed in the luma.gl glTF extension support registry.`},Rv={KHR_physics_rigid_bodies:{supportLevel:`none`,standardStatus:`draft`,comment:`The optional @luma.gl/gltf/physics adapter validates a pinned subset; ordinary scenegraph loading does not execute physics.`},KHR_implicit_shapes:{supportLevel:`none`,standardStatus:`draft`,comment:`The optional physics adapter supports sphere/box colliders; shapes alone do not define rendering or simulation.`},EXT_lights_area:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Opt-in AreaLightController feeds the shared Light API. PBR supports four rect/disk lights with LTC diffuse, isotropic GGX and clearcoat; disks use a 32-gon and other lobes retain numerical integration. No shadows or indirect light; strict loading does not claim full draft conformance.`},KHR_lightmap:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Draft irradiance rendering supports UV0/UV1, node overrides and atlas instances through individual draws. Strict required-extension loading does not claim full draft conformance.`},KHR_billboard:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Optional BillboardController supports an explicit full-axis profile. Constrained-axis semantics remain ambiguous; strict required-extension loading does not claim full support.`},KHR_audio_emitter:{supportLevel:`parsed-and-wired`,standardStatus:`draft`,comment:`Opt-in AudioController provides Web Audio playback; the application owns context activation and listener updates.`},KHR_audio_environment:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Opt-in listener selection, environment zones, emitter sends and impulse-response or approximate parametric reverb. Doppler, air absorption and listener graph hooks remain unsupported.`},KHR_audio_graph:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Opt-in AudioController implements a processing and scheduled-source profile; animation pointers and general pulse-width synthesis remain unsupported.`},KHR_draco_mesh_compression:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Decoded by loaders.gl before luma.gl builds the scenegraph.`},EXT_meshopt_compression:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`EXT meshopt-compressed buffer views are decoded by loaders.gl before rendering.`},KHR_meshopt_compression:{supportLevel:`built-in`,standardStatus:`release-candidate`,comment:`Decoded by loaders.gl v5 before luma.gl builds the scenegraph.`},KHR_mesh_quantization:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Loader-materialized quantized accessors retain their typed values and normalization.`},EXT_mesh_features:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Feature identifiers are decoded by loaders.gl; automatic rendering and picking are application-owned.`},EXT_structural_metadata:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Structural metadata is decoded by loaders.gl; automatic rendering and querying are application-owned.`},KHR_lights_punctual:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Parsed into luma.gl Light objects.`},KHR_materials_unlit:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Unlit materials bypass the default lighting path.`},KHR_materials_emissive_strength:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Applied by the stock PBR shader.`},KHR_texture_basisu:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`BasisU / KTX2 textures pass through when the device supports them.`},KHR_texture_transform:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Per-slot UV transforms and animated pointers are applied at runtime; avoid duplicate legacy loader-side baking.`},EXT_texture_webp:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Texture source is resolved during load; final support depends on browser and device decode support.`},EXT_texture_avif:{supportLevel:`none`,standardStatus:`ratified`,comment:`The image loader can decode supported AVIF images, but GLTFLoader does not select EXT_texture_avif sources.`},KHR_materials_specular:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now applies specular factors and textures to the dielectric F0 term.`},KHR_materials_ior:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now drives dielectric reflectance from the glTF IOR value.`},KHR_materials_transmission:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now applies transmission to the base layer and exposes transparency through alpha, without a scene-color refraction buffer.`},KHR_materials_volume:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Thickness and attenuation now tint transmitted light in the stock shader.`},KHR_materials_clearcoat:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now adds a secondary clearcoat specular lobe.`},KHR_materials_sheen:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now adds a sheen lobe for cloth-like materials.`},KHR_materials_iridescence:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now tints specular response with a view-dependent thin-film iridescence approximation.`},KHR_materials_anisotropy:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now shapes highlights and IBL response with an anisotropy-direction approximation.`},KHR_materials_pbrSpecularGlossiness:{supportLevel:`loader-only`,standardStatus:`archived`,comment:`Extension data can be loaded, but it is not translated into the default metallic-roughness material path.`},KHR_materials_variants:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Primitive material variants can be selected and restored on the generated scenegraph.`},EXT_mesh_gpu_instancing:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Accessor-backed instance transforms use one instanced draw per source primitive.`},KHR_node_visibility:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Recursive node visibility controls rendered geometry, punctual lights, and animation.`},KHR_animation_pointer:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Node transforms, morph weights and visibility, material factors, texture transforms, camera projections, and punctual lights are wired to runtime updates.`},EXT_materials_bump:{supportLevel:`built-in`,standardStatus:`draft`,comment:`The experimental bump-map draft perturbs the canonical surface normal from a linear height texture.`},KHR_materials_diffuse_transmission:{supportLevel:`built-in`,standardStatus:`release-candidate`,comment:`The Khronos release candidate adds energy-conserving back-lit diffuse transmission and independent color/factor textures.`},KHR_materials_dispersion:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`The canonical PBR shader separates red, green, and blue transmission using wavelength-dependent refraction.`},KHR_materials_scatter:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Thin-wall rendering supports transmission-gated forward/backward diffuse scattering, alpha strength textures and sRGB scatter color. Volumetric mode is rejected; strict required-extension loading does not claim full draft conformance.`},KHR_materials_volume_scatter:{supportLevel:`parsed-and-wired`,standardStatus:`draft`,comment:`The unratified volume-scattering draft is approximated per surface; random-walk and screen-space diffusion are not implemented.`},KHR_xmp:{supportLevel:`none`,standardStatus:`archived`,comment:`Metadata payloads remain in the loaded glTF, but luma.gl does not interpret them.`},KHR_xmp_json_ld:{supportLevel:`none`,standardStatus:`ratified`,comment:`Metadata is preserved in the glTF, but luma.gl does not interpret it.`},EXT_lights_image_based:{supportLevel:`none`,standardStatus:`multi-vendor`,comment:`Use loadPBREnvironment() or custom environment setup instead.`},EXT_texture_video:{supportLevel:`none`,standardStatus:`multi-vendor`,comment:`Video textures are not created automatically by the stock pipeline.`},MSFT_lod:{supportLevel:`parsed-and-wired`,standardStatus:`vendor`,comment:`Node levels are parsed and selected by opt-in animated crowds; material LOD and GPU-driven selection are not implemented.`}};function zv(e,t){let n=Array.from(Gv(e)).sort(),r=new Set(e.extensionsRequired||[]),i=n.map(n=>{let i=Rv[n]||Lv,a=Hv(n,i,e,t);return[n,{extensionName:n,required:r.has(n),supported:qv(a.supportLevel),supportLevel:a.supportLevel,standardStatus:i.standardStatus,comment:a.comment}]});return new Map(i)}function Bv(e,t){return Array.from(zv(e,t).values()).filter(e=>e.required&&!e.supported)}function Vv(e,t){let n=Bv(e,t);if(n.length)throw Error(`Unsupported required glTF extensions: ${n.map(e=>e.extensionName).join(`, `)}`)}function Hv(e,t,n,r){if(e!==`KHR_texture_basisu`||!r)return t;let i=Uv(n).find(e=>e===null||!r.isTextureFormatSupported(e));return i===void 0?t:{supportLevel:`none`,comment:i===null?`The ${r.type} device cannot use a BasisU texture whose transcoded GPU format is missing.`:`The ${r.type} device does not support the transcoded BasisU texture format '${i}'.`}}function Uv(e){let t=[];for(let n of e.textures||[]){let e=n?.source?.image;if(!e?.compressed)continue;let r=Array.isArray(e.data)?e.data[0]:Array.isArray(e.mipmaps)?e.mipmaps[0]:void 0;t.push(r?.textureFormat??null)}return t}function Wv(e){return Rv[e]||null}function Gv(e){let t=e,n=new Set;return Kv(n,e.extensionsUsed),Kv(n,e.extensionsRequired),Kv(n,t.extensionsRemoved),Kv(n,Object.keys(e.extensions||{})),(t.lights?.length||(e.nodes||[]).some(e=>`light`in e))&&n.add(`KHR_lights_punctual`),(e.materials||[]).some(e=>{let t=e;return t.unlit||t.extensions?.KHR_materials_unlit})&&n.add(`KHR_materials_unlit`),n}function Kv(e,t=[]){for(let n of t)e.add(n)}function qv(e){return e===`built-in`||e===`parsed-and-wired`}function Jv(e){let t=e.animations||[],n=new Map,r=new Map;return t.flatMap((t,i)=>{let a=t.name||`Animation-${i}`,o=new Map,s=t.channels.flatMap(({sampler:i,target:a})=>{let s=ey(e,a),c=`${i}:${s??0}`,l=o.get(c);if(!l){let a=t.samplers[i];if(!a)throw Error(`Cannot find animation sampler ${i}`);let{input:u,interpolation:d=`LINEAR`,output:f}=a,p=dy(e.accessors[u],n),m=fy(e.accessors[f],r);l={input:p,interpolation:d,output:s===void 0?m:ty(m,p.length,d,s)},o.set(c,l)}let u=Yv(e,a,l);return u?[u]:[]});return s.length?[{name:a,channels:s}]:[]})}function Yv(e,t,n){if(t.path===`pointer`)return Xv(e,t,n);let r=ry(t.path);if(!r)return null;let i=e.nodes[t.node??0];if(!i)throw Error(`Cannot find animation target ${t.node}`);return{type:`node`,sampler:n,targetNodeId:i.id,path:r}}function Xv(e,n,r){let i=n.extensions?.KHR_animation_pointer?.pointer;if(typeof i!=`string`||!i.startsWith(`/`))return t.warn(`KHR_animation_pointer channel is missing a valid JSON pointer and will be skipped`)(),null;let a=sy(i);switch(a[0]){case`nodes`:return $v(e,a,r,i);case`materials`:return ny(e,a,r,i);case`cameras`:return Zv(e,a,r,i);case`extensions`:if(a[1]===`KHR_lights_punctual`)return Qv(e,a,r,i);break;default:break}return uy(i,`top-level target "${a[0]}" has no runtime animation mapping`),null}function Zv(e,t,n,r){let i=Number(t[1]),a=e.cameras?.[i],o=t[2],s=t[3];return t.length!==4||!Number.isInteger(i)||!a||o!==`perspective`&&o!==`orthographic`||a.type!==o||!(o===`perspective`?[`aspectRatio`,`yfov`,`znear`,`zfar`]:[`xmag`,`ymag`,`znear`,`zfar`]).includes(s)?(uy(r,`camera pointers must target a supported projection property`),null):{type:`camera`,sampler:n,pointer:r,targetCameraIndex:i,projection:o,property:s}}function Qv(e,t,n,r){let i=Number(t[3]),a=e.lights||e.extensions?.KHR_lights_punctual?.lights,o=t[4]===`spot`,s=o?t[5]:t[4],c=!o&&s===`color`?t[5]:void 0,l=[`color`,`intensity`,`range`,`innerConeAngle`,`outerConeAngle`],u=o||c!==void 0?6:5;return t[2]!==`lights`||t.length!==u||!Number.isInteger(i)||!Array.isArray(a)||!a[i]||!l.includes(s)||o&&s!==`innerConeAngle`&&s!==`outerConeAngle`||c!==void 0&&(!/^[0-2]$/.test(c)||s!==`color`)?(uy(r,`punctual-light pointers must target supported typed light properties`),null):{type:`light`,sampler:n,pointer:r,targetLightIndex:i,property:s,...c===void 0?{}:{component:Number(c)}}}function $v(e,n,r,i){let a=n.length===5&&n[2]===`extensions`&&n[3]===`KHR_node_visibility`&&n[4]===`visible`;if(n.length!==3&&!a)return uy(i,`node pointers must target transforms, morph weights, or KHR_node_visibility.visible`),null;let o=Number(n[1]),s=e.nodes[o];if(!Number.isInteger(o)||!s)return t.warn(`KHR_animation_pointer target ${i} references a missing node and will be skipped`)(),null;if(a&&r.interpolation!==`STEP`)return uy(i,`boolean visibility animation requires STEP interpolation`),null;let c=a?`visibility`:ry(n[2]);return c?{type:`node`,sampler:r,targetNodeId:s.id,path:c}:(uy(i,`node property "${n[2]}" has no runtime animation mapping`),null)}function ey(e,t){let n;if(t.path===`weights`)n=t.node;else if(t.path===`pointer`){let e=t.extensions?.KHR_animation_pointer?.pointer,r=typeof e==`string`?/^\/nodes\/(\d+)\/weights$/.exec(e):null;if(!r)return;n=Number(r[1])}else return;let r=e.nodes[n??0],i=typeof r?.mesh==`number`?e.meshes[r.mesh]:r?.mesh;return r?.weights?.length||i?.weights?.length||i?.primitives?.[0]?.targets?.length||1}function ty(e,t,n,r){let i=n===`CUBICSPLINE`?3:1,a=e.length/(Math.max(t,1)*i),o=r>1?r:Number.isInteger(a)&&a>1?a:r;if(o<=1)return e;let s=e.flat(),c=[];for(let e=0;e<s.length;e+=o)c.push(s.slice(e,e+o));return c}function ny(e,n,r,i){if(n.length<3)return uy(i,`material pointers must include a material index and target property path`),null;let a=Number(n[1]),o=e.materials[a];if(!Number.isInteger(a)||!o)return t.warn(`KHR_animation_pointer target ${i} references a missing material and will be skipped`)(),null;let s=iy(o,n.slice(2));return`reason`in s?(uy(i,s.reason),null):{sampler:r,pointer:i,targetMaterialIndex:a,...s}}function ry(e){switch(e){case`translation`:case`rotation`:case`scale`:case`weights`:return e;default:return null}}function iy(e,t){let n=ay(e,t);if(!(`reason`in n)||n.reason!==`not-a-texture-transform-target`)return n;switch(t.join(`/`)){case`pbrMetallicRoughness/baseColorFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`baseColorFactor`}:{reason:W(t)};case`pbrMetallicRoughness/metallicFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`metallicRoughnessValues`,component:0}:{reason:W(t)};case`pbrMetallicRoughness/roughnessFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`metallicRoughnessValues`,component:1}:{reason:W(t)};case`normalTexture/scale`:return e.normalTexture?{type:`material`,property:`normalScale`}:{reason:W(t)};case`occlusionTexture/strength`:return e.occlusionTexture?{type:`material`,property:`occlusionStrength`}:{reason:W(t)};case`emissiveFactor`:return{type:`material`,property:`emissiveFactor`};case`alphaCutoff`:return{type:`material`,property:`alphaCutoff`};case`extensions/KHR_materials_specular/specularFactor`:return e.extensions?.KHR_materials_specular?{type:`material`,property:`specularIntensityFactor`}:{reason:W(t)};case`extensions/KHR_materials_specular/specularColorFactor`:return e.extensions?.KHR_materials_specular?{type:`material`,property:`specularColorFactor`}:{reason:W(t)};case`extensions/KHR_materials_ior/ior`:return e.extensions?.KHR_materials_ior?{type:`material`,property:`ior`}:{reason:W(t)};case`extensions/EXT_materials_bump/bumpFactor`:return e.extensions?.EXT_materials_bump?{type:`material`,property:`bumpFactor`}:{reason:W(t)};case`extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor`:return e.extensions?.KHR_materials_diffuse_transmission?{type:`material`,property:`diffuseTransmissionFactor`}:{reason:W(t)};case`extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor`:return e.extensions?.KHR_materials_diffuse_transmission?{type:`material`,property:`diffuseTransmissionColorFactor`}:{reason:W(t)};case`extensions/KHR_materials_scatter/scatterStrengthFactor`:return e.extensions?.KHR_materials_scatter?{type:`material`,property:`scatterStrengthFactor`}:{reason:W(t)};case`extensions/KHR_materials_scatter/multiscatterColorFactor`:case`extensions/KHR_materials_scatter/multiscatterColor`:return e.extensions?.KHR_materials_scatter?{type:`material`,property:`multiscatterColorFactor`}:{reason:W(t)};case`extensions/KHR_materials_scatter/scatterAnisotropy`:return e.extensions?.KHR_materials_scatter?{type:`material`,property:`scatterAnisotropy`}:{reason:W(t)};case`extensions/KHR_materials_volume_scatter/multiscatterColorFactor`:case`extensions/KHR_materials_volume_scatter/multiscatterColor`:return e.extensions?.KHR_materials_volume_scatter?{type:`material`,property:`multiscatterColorFactor`}:{reason:W(t)};case`extensions/KHR_materials_volume_scatter/scatterAnisotropy`:return e.extensions?.KHR_materials_volume_scatter?{type:`material`,property:`scatterAnisotropy`}:{reason:W(t)};case`extensions/KHR_materials_dispersion/dispersion`:return e.extensions?.KHR_materials_dispersion?{type:`material`,property:`dispersion`}:{reason:W(t)};case`extensions/KHR_materials_transmission/transmissionFactor`:return e.extensions?.KHR_materials_transmission?{type:`material`,property:`transmissionFactor`}:{reason:W(t)};case`extensions/KHR_materials_volume/thicknessFactor`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`thicknessFactor`}:{reason:W(t)};case`extensions/KHR_materials_volume/attenuationDistance`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`attenuationDistance`}:{reason:W(t)};case`extensions/KHR_materials_volume/attenuationColor`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`attenuationColor`}:{reason:W(t)};case`extensions/KHR_materials_clearcoat/clearcoatFactor`:return e.extensions?.KHR_materials_clearcoat?{type:`material`,property:`clearcoatFactor`}:{reason:W(t)};case`extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor`:return e.extensions?.KHR_materials_clearcoat?{type:`material`,property:`clearcoatRoughnessFactor`}:{reason:W(t)};case`extensions/KHR_materials_sheen/sheenColorFactor`:return e.extensions?.KHR_materials_sheen?{type:`material`,property:`sheenColorFactor`}:{reason:W(t)};case`extensions/KHR_materials_sheen/sheenRoughnessFactor`:return e.extensions?.KHR_materials_sheen?{type:`material`,property:`sheenRoughnessFactor`}:{reason:W(t)};case`extensions/KHR_materials_iridescence/iridescenceFactor`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceFactor`}:{reason:W(t)};case`extensions/KHR_materials_iridescence/iridescenceIor`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceIor`}:{reason:W(t)};case`extensions/KHR_materials_iridescence/iridescenceThicknessMinimum`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceThicknessRange`,component:0}:{reason:W(t)};case`extensions/KHR_materials_iridescence/iridescenceThicknessMaximum`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceThicknessRange`,component:1}:{reason:W(t)};case`extensions/KHR_materials_anisotropy/anisotropyStrength`:return e.extensions?.KHR_materials_anisotropy?{type:`material`,property:`anisotropyStrength`}:{reason:W(t)};case`extensions/KHR_materials_anisotropy/anisotropyRotation`:return e.extensions?.KHR_materials_anisotropy?{type:`material`,property:`anisotropyRotation`}:{reason:W(t)};case`extensions/KHR_materials_emissive_strength/emissiveStrength`:return e.extensions?.KHR_materials_emissive_strength?{type:`material`,property:`emissiveStrength`}:{reason:W(t)};default:return{reason:W(t)}}}function ay(e,t){let n=t.lastIndexOf(`extensions`);if(n<0||t[n+1]!==`KHR_texture_transform`||n<1)return{reason:`not-a-texture-transform-target`};let r=f_(t.slice(0,n));if(!r)return{reason:cy(t.slice(0,n))};let i=oy(e,r.pathSegments);if(!i)return{reason:`texture-transform target "${t.slice(0,n).join(`/`)}" does not exist on the referenced material`};let a=t[n+2];if(a===`texCoord`)return{reason:`animated KHR_texture_transform.texCoord is unsupported because texCoord selection is structural, not a runtime float/vector update`};if(a!==`offset`&&a!==`rotation`&&a!==`scale`)return{reason:`KHR_texture_transform property "${a}" is not animatable; supported properties are offset, rotation, and scale`};let o=t[n+3];if(t.length>n+4)return{reason:`KHR_texture_transform.${a} does not support nested property paths`};let s;if(o!==void 0){if(s=Number(o),a===`rotation`)return{reason:`KHR_texture_transform.rotation does not support component indices`};if(!Number.isInteger(s)||s<0||s>1)return{reason:`KHR_texture_transform.${a} component index "${o}" is invalid; only 0 and 1 are supported`}}return{type:`textureTransform`,textureSlot:r.slot,path:a,component:s,baseTransform:u_(i)}}function oy(e,t){let n=e;for(let e of t)if(n=n?.[e],!n)return null;return n}function sy(e){return e.slice(1).split(`/`).map(e=>e.replace(/~1/g,`/`).replace(/~0/g,`~`))}function W(e){let t=ly(e);if(t){let e=Wv(t);if(e?.supportLevel===`none`)return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`no runtime target exists for material property "${e.join(`/`)}"`}function cy(e){let t=ly(e);if(t){let e=Wv(t);if(e?.supportLevel===`none`)return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`texture-transform target "${e.join(`/`)}" has no runtime texture-slot mapping`}function ly(e){let t=e.indexOf(`extensions`),n=e[t+1];return t>=0&&n?n:null}function uy(e,n){t.warn(`KHR_animation_pointer target ${e} will be skipped because ${n}`)()}function dy(e,t){if(t.has(e))return t.get(e);let{value:n,components:r}=py(e);my(r===1,`accessorToJsArray1D must have exactly 1 component`);let i=Array.from(n);return t.set(e,i),i}function fy(e,t){if(t.has(e))return t.get(e);let{value:n,components:r}=py(e);my(r>=1,`accessorToJsArray2D must have at least 1 component`);let i=[];for(let e=0;e<n.length;e+=r)i.push(Array.from(n.slice(e,e+r)));return t.set(e,i),i}function py(e){if(e.value)return my(!(e.value instanceof BigInt64Array)&&!(e.value instanceof BigUint64Array),`glTF animation accessors cannot use BigInt component arrays`),{value:e.value,components:e.components};let t=e.bufferView?.data;my(t!==void 0),my(e.componentType===5126);let n=e.type===`SCALAR`?1:Number(e.type.slice(3));return{value:new Float32Array(t.buffer,t.byteOffset+(e.byteOffset||0),e.count*n),components:n}}function my(e,t){if(!e)throw Error(t)}function hy(e,t){let n=(e.extensions?.KHR_materials_variants?.variants||[]).map((e,t)=>({name:e.name||`Variant-${t}`,index:t})),r=new Set,i=[];for(let e of t)e.preorderTraversal(e=>{if(!(e instanceof Mr)||r.has(e))return;let t=e.userData.gltfMaterialVariants;t&&(r.add(e),i.push({modelNode:e,...t}))});return{variants:n,bindings:i}}function gy(e,t,n){n?.strictExtensions&&Vv(t,e);let{scenes:r,materials:i,gltfMeshIdToNodeMap:a,gltfNodeIdToNodeMap:o,gltfNodeIndexToNodeMap:s,generatedTextures:c,materialInstances:l}=rv(e,t,n),u=Jv(t),d=(t.lights||t.extensions?.KHR_lights_punctual?.lights||[]).map(e=>({...e,...Array.isArray(e.color)?{color:[...e.color]}:{},...e.spot?{spot:{...e.spot}}:{}})),f=(t.cameras||[]).map(e=>{let t={...e};return e.perspective&&(t.perspective={...e.perspective}),e.orthographic&&(t.orthographic={...e.orthographic}),t}),p={useByteColors:n?.useByteColors??!0,nodeVisibility:o,lightDefinitions:d},m=mv(t,p),h=()=>{m.splice(0,m.length,...mv(t,p))},g=new Ev({onVisibilityChange:h,cameras:f,lightDefinitions:d,onLightChange:h,animations:u,gltfNodeIdToNodeMap:o,materials:i,materialInstances:l}),_=new Ir(hy(t,r)),v=zv(t,e),y=r.map(e=>_y(e.getBounds())),b=vy(y),x=new Pr(Pv({device:e,gltf:t,scenes:r,gltfNodeIndexToNodeMap:s}));g.setUpdateHandler(()=>x.update());let S=!1;return{scenes:r,materials:i,variants:_,cameras:f,animator:g,animations:u,lights:m,extensionSupport:v,sceneBounds:y,modelBounds:b,gltfMeshIdToNodeMap:a,gltfNodeIdToNodeMap:o,gltfNodeIndexToNodeMap:s,skins:x,gltf:t,destroy:()=>{if(S)return;S=!0,x.destroy();let e=new Set([...r,...a.values(),...o.values()]),t=new Set,n=new Set(i);for(let r of e)r.preorderTraversal(e=>{if(e instanceof Mr){t.add(e);let r=e.userData.gltfMaterialVariants;r?.defaultMaterial&&n.add(r.defaultMaterial);for(let e of r?.mappings.values()||[])n.add(e.material);e.model?.material&&n.add(e.model.material)}});for(let e of t)e.destroy();for(let t of e)t.destroy();for(let e of n)e.destroy();for(let e of c)e.destroy();c.clear()}}}function _y(e){if(!e)return{bounds:null,center:[0,0,0],size:[0,0,0],radius:.5,recommendedOrbitDistance:1};let t=[[e[0][0],e[0][1],e[0][2]],[e[1][0],e[1][1],e[1][2]]],n=[t[1][0]-t[0][0],t[1][1]-t[0][1],t[1][2]-t[0][2]],r=[t[0][0]+n[0]*.5,t[0][1]+n[1]*.5,t[0][2]+n[2]*.5],i=Math.max(n[0],n[1],n[2])*.5,a=Math.max(.5*Math.hypot(n[0],n[1],n[2]),.001);return{bounds:t,center:r,size:n,radius:a,recommendedOrbitDistance:Math.max(Math.max(i,.001)/Math.tan(Math.PI/6)*1.15,a*1.1)}}function vy(e){let t=null;for(let n of e)if(n.bounds){if(!t){t=[[...n.bounds[0]],[...n.bounds[1]]];continue}for(let e=0;e<3;e++)t[0][e]=Math.min(t[0][e],n.bounds[0][e]),t[1][e]=Math.max(t[1][e],n.bounds[1][e])}return _y(t)}function yy(e,t){return by(e||{},t)}function by(e,t,n=0){if(n>3)return t;let r={...e};for(let[e,i]of Object.entries(t))Je(i)?r[e]=by(r[e]||{},t[e],n+1):r[e]=t[e];return r}var xy=class{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t){this.workerThread.postMessage({source:`loaders.gl`,type:e,payload:t})}done(e){this.isRunning&&(this.isRunning=!1,this._resolve(e))}error(e){this.isRunning&&(this.isRunning=!1,this._reject(e))}abort(e){if(!this.isRunning)return;let t=e??Sy(`Worker job "${this.name}" was aborted`);this.workerThread.destroy(),this.error(t)}};function Sy(e){let t=Error(e);return t.name=`AbortError`,t}var Cy=class{constructor(...e){let t=globalThis.process?.getBuiltinModule?.(`node:worker_threads`).Worker;if(t)return new t(...e)}terminate(){}},wy=new Map;function Ty(e){it(e.source&&!e.url||!e.source&&e.url);let t=wy.get(e.source||e.url);return t||(e.url&&(t=Ey(e.url),wy.set(e.url,t)),e.source&&(t=Dy(e.source),wy.set(e.source,t))),it(t),t}function Ey(e){return e.startsWith(`http`)?Dy(Oy(e)):e}function Dy(e){let t=new Blob([e],{type:`application/javascript`});return URL.createObjectURL(t)}function Oy(e){return`\
try {
  importScripts('${e}');
} catch (error) {
  console.error(error);
  throw error;
}`}function ky(e,t=!0,n){let r=n||new Set;if(e){if(Ay(e))r.add(e);else if(Ay(e.buffer))r.add(e.buffer);else if(!ArrayBuffer.isView(e)&&t&&typeof e==`object`)for(let n in e)ky(e[n],t,r)}return n===void 0?Array.from(r):[]}function Ay(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}function jy(e){if(e===null)return{};let t=Object.assign({},e);return Object.keys(t).forEach(n=>{typeof e[n]==`object`&&!ArrayBuffer.isView(e[n])&&!(e[n]instanceof Array)?t[n]=jy(e[n]):typeof t[n]==`function`||t[n]instanceof RegExp?t[n]={}:t[n]=e[n]}),t}var My=()=>{},Ny=class{name;source;url;getUrl;loadWorker;terminated=!1;worker;onMessage;onError;_loadableURL=``;static isSupported(){return typeof Worker<`u`&&st||Cy!==void 0&&!st}constructor(e){let{name:t,source:n,url:r,getUrl:i,loadWorker:a}=e;it(n||r||i||a),this.name=t,this.source=n,this.url=r,this.getUrl=i,this.loadWorker=a,this.onMessage=My,this.onError=e=>console.log(e),this.worker=st?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=My,this.onError=My,this.worker.terminate(),this.terminated=!0}unref(){!st&&typeof this.worker.unref==`function`&&this.worker.unref()}ref(){!st&&typeof this.worker.ref==`function`&&this.worker.ref()}get isRunning(){return!!this.onMessage}postMessage(e,t){t||=ky(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t=`Failed to load `;return t+=`worker ${this.name} from ${this.url||`built-in worker factory`}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){if(this.loadWorker)try{let e=this.loadWorker();if(e)return this._initializeBrowserWorker(e)}catch(e){if(!this.source&&!this.url&&!this.getUrl)throw e}let e=this.url||this.getUrl?.();this._loadableURL=Ty({source:this.source,url:e});let t=new Worker(this._loadableURL,{name:this.name});return this._initializeBrowserWorker(t)}_initializeBrowserWorker(e){return e.onmessage=e=>{e.data?this.onMessage(e.data):this.onError(Error(`No data received`))},e.onerror=e=>{this.onError(this._getErrorFromErrorEvent(e)),this.terminated=!0},e.onmessageerror=e=>console.error(e),e}_createNodeWorker(){let e;if(this.url){let t=this.url.includes(`:/`)||this.url.startsWith(`/`)?this.url:`./${this.url}`;e=new Cy(t.startsWith(`file:`)?new URL(t):t,{eval:!1,type:this.url.endsWith(`.ts`)||this.url.endsWith(`.mjs`)?`module`:`commonjs`})}else if(this.source)e=new Cy(this.source,{eval:!0});else throw Error(`no worker`);return e.on(`message`,e=>{this.onMessage(e)}),e.on(`error`,e=>{this.onError(e)}),e.on(`exit`,e=>{}),e}},Py=class{name=`unnamed`;source;url;getUrl;loadWorker;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];activeJobs=new Set;count=0;isDestroyed=!1;static isSupported(){return Ny.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.getUrl=e.getUrl,this.loadWorker=e.loadWorker,this.setProps(e)}destroy(e=Error(`Worker pool was destroyed`)){this.activeJobs.forEach(t=>t.abort(e)),this.jobQueue.splice(0).forEach(t=>t.onReject(e)),this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},e.name!==void 0&&(this.name=e.name),e.maxConcurrency!==void 0&&(this.maxConcurrency=e.maxConcurrency),e.maxMobileConcurrency!==void 0&&(this.maxMobileConcurrency=e.maxMobileConcurrency),e.reuseWorkers!==void 0&&(this.reuseWorkers=e.reuseWorkers),e.onDebug!==void 0&&(this.onDebug=e.onDebug)}async startJob(e,t=(e,t,n)=>e.done(n),n=(e,t)=>e.error(t)){if(this.isDestroyed)return Promise.reject(Error(`Worker pool was destroyed`));let r=new Promise((r,i)=>(this.jobQueue.push({name:e,onMessage:t,onError:n,onStart:r,onReject:i}),this));return this._startQueuedJob(),await r}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:`Starting job`,name:t.name,workerThread:e,backlog:this.jobQueue.length});let n=new xy(t.name,e);this.activeJobs.add(n),e.ref(),e.onMessage=e=>t.onMessage(n,e.type,e.payload),e.onError=e=>t.onError(n,e),t.onStart(n);try{await n.result}catch{}finally{this.activeJobs.delete(n),this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){e.terminated||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.terminated||e.destroy(),this.count--):(e.unref(),this.idleQueue.push(e)),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){return this.idleQueue.length>0?this.idleQueue.shift()||null:this.count<this._getMaxConcurrency()?(this.count++,new Ny({name:`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`,source:this.source,url:this.url,getUrl:this.getUrl,loadWorker:this.loadWorker})):null}_getMaxConcurrency(){return at?this.maxMobileConcurrency:this.maxConcurrency}},Fy={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}},Iy=new WeakMap,Ly=1,Ry=class e{props;workerPools=new Map;static _workerFarm;static isSupported(){return Ny.isSupported()}static getWorkerFarm(t={}){return e._workerFarm=e._workerFarm||new e({}),e._workerFarm.setProps(t),e._workerFarm}constructor(e){this.props={...Fy},this.setProps(e),this.workerPools=new Map}destroy(e){for(let t of this.workerPools.values())t.destroy(e);this.workerPools=new Map}setProps(e){this.props={...this.props,...e};for(let e of this.workerPools.values())e.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:n,url:r,getUrl:i,loadWorker:a}=e,o=zy(e),s=this.workerPools.get(o);return s||(s=new Py({name:t,source:n,url:r,getUrl:i,loadWorker:a}),s.setProps(this._getWorkerPoolProps()),this.workerPools.set(o,s)),s}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}};function zy(e){let{name:t,source:n,url:r,urlKey:i,loadWorker:a}=e;return[t,n?`source:${n}`:``,r||i?`url:${r||i}`:``,a?`loadWorker:${By(a)}`:``].filter(Boolean).join(`|`)}function By(e){let t=Iy.get(e);return t||(t=Ly++,Iy.set(e,t)),t}var Vy=class{_values;_settlers;_closed;constructor(){this._values=[],this._settlers=[],this._closed=!1}[Symbol.asyncIterator](){return this}push(e){return this.enqueue(e)}enqueue(e){if(this._closed)throw Error(`Closed`);if(this._settlers.length>0){if(this._values.length>0)throw Error(`Illegal internal state`);let t=this._settlers.shift();e instanceof Error?t.reject(e):t.resolve({value:e})}else this._values.push(e)}close(){for(;this._settlers.length>0;)this._settlers.shift().resolve({done:!0});this._closed=!0}next(){if(this._values.length>0){let e=this._values.shift();return e instanceof Error?Promise.reject(e):Promise.resolve({done:!1,value:e})}if(this._closed){if(this._settlers.length>0)throw Error(`Illegal internal state`);return Promise.resolve({done:!0,value:void 0})}return new Promise((e,t)=>{this._settlers.push({resolve:e,reject:t})})}},Hy=new Set;function Uy(e){let t=e.version===rt?``:` (worker-utils@${rt})`;return`${e.name}@${e.version}${t}`}function Wy(e,t={}){let n=t[e.id]||{},r=st?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,i=n.workerUrl;!i&&e.id===`compression`&&(i=t.workerUrl);let a=t._workerType||t?.core?._workerType;return!i&&a===`test`&&(i=st?`modules/${e.module}/dist/${r}`:`modules/${e.module}/src/workers/${e.id}-worker-node.ts`),i||null}function Gy(e,t={}){let n=Wy(e,t),r=typeof e.worker==`string`?e.worker:null,i=n||r||Ky(e,!0);return it(i),i}function Ky(e,t=!1){let n=st?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,r=e.version;r===`latest`&&(r=ot);let i=r?`@${r}`:``,a=`https://unpkg.com/@loaders.gl/${e.module}${i}/dist/${n}`;return t&&qy(e,a),a}function qy(e,t){if(e.version!==`latest`)return;let n=`${e.module}:${e.id}`;Hy.has(n)||(Hy.add(n),console.warn(`loaders.gl: ${e.name} loader worker version is "latest" because __VERSION__ was not injected. Fetching ${t} from CDN.`))}function Jy(e,t){if(!Ry.isSupported())return!1;let n=t?.[e.id];return!!((e.worker||e.loadWorker||n?.workerUrl)&&t?.worker)}async function Yy(e,t,n={},r={},i={}){Qy(n.signal);let a=Uy(e),o=Ry.getWorkerFarm(n).getWorkerPool(rb(e,n,a)),s=n.jobName||e.name,c=await o.startJob(s,ib.bind(null,r)),l=()=>c.abort($y(n.signal));n.signal?.addEventListener(`abort`,l,{once:!0}),n.signal?.aborted&&l();try{let{signal:e,...r}=n,a=jy(r),o=jy(i);return c.isRunning&&c.postMessage(`process`,{input:t,options:a,context:o}),(await c.result).result}finally{n.signal?.removeEventListener(`abort`,l)}}function Xy(e,t,n={},r={},i={}){return Zy(e,t,n,r,i)}async function*Zy(e,t,n,r,i){Qy(n.signal);let a=Uy(e),o=Ry.getWorkerFarm(n).getWorkerPool(rb(e,n,a)),s=new Vy,c=tb(t),l=!1,u=!1,d=Promise.resolve(),f=Error(`Worker batch job failed`),p=()=>{l||(l=!0,s.close())},m=e=>{l||(l=!0,s.enqueue(f),s.close())},h=await o.startJob(n.jobName||e.name,(e,t,n)=>{switch(t){case`input-request`:d=d.then(async()=>{let t=await c.next();e.isRunning&&(t.done?(u=!0,e.postMessage(`input-done`,{})):e.postMessage(`input-batch`,{input:t.value}))}).catch(t=>e.abort(t));break;case`output-batch`:s.push(n.result);break;case`done`:e.done(n),p();break;case`error`:{let t=Error(n.error||`Worker batch processing failed`);e.error(t),m(t);break}case`process`:ib(r,e,t,n);break;default:{let n=Error(`Unexpected worker batch message: ${t}`);e.error(n),m(n);break}}}),g=()=>h.abort($y(n.signal));n.signal?.addEventListener(`abort`,g,{once:!0}),n.signal?.aborted&&g(),h.result.catch(m);try{let{signal:e,...t}=n;h.isRunning&&h.postMessage(`process-in-batches`,{options:jy(t),context:jy(i)});try{for await(let e of s)yield e,h.isRunning&&h.postMessage(`output-ack`,{})}catch(e){throw e===f&&await h.result,e}await h.result}finally{n.signal?.removeEventListener(`abort`,g),h.isRunning&&h.abort(eb(`Worker batch iterator was closed`)),u||nb(c)}}function Qy(e){if(e?.aborted)throw $y(e)}function $y(e){return e?.reason??eb(`Worker job was aborted`)}function eb(e){let t=Error(e);return t.name=`AbortError`,t}function tb(e){return Symbol.asyncIterator in e?e[Symbol.asyncIterator]():(async function*(){yield*e})()}function nb(e){try{Promise.resolve(e.return?.()).catch(()=>void 0)}catch{}}function rb(e,t,n){if(t.source)return{name:n,source:t.source};let r=Wy(e,t);return r?{name:n,url:r}:st&&e.loadWorker?{name:n,loadWorker:e.loadWorker,getUrl:()=>Gy(e,t),urlKey:Ky(e)}:{name:n,url:Gy(e,t)}}async function ib(e,t,n,r){switch(n){case`done`:t.done(r);break;case`error`:t.error(Error(r.error));break;case`process`:let{id:i,input:a,options:o}=r;try{if(!e.process){t.postMessage(`error`,{id:i,error:`Worker not set up to process on main thread`});return}let n=await e.process(a,o,void 0,r.context||{});t.postMessage(`done`,{id:i,result:n})}catch(e){let n=e instanceof Error?e.message:`unknown error`;t.postMessage(`error`,{id:i,error:n})}break;default:console.warn(`process-on-worker: unknown message ${n}`)}}function ab(e,t=rt){it(e,`no worker provided`);let n=e.version;return!(!t||!n)}function ob(e,t){if(t?.core?.credentials?.some(e=>e.type===`request`||`token`in e&&typeof e.token==`function`))return!1;let n=pb(t),r=n._nodeWorkers;return!st&&!r||e.id===`las`&&(t?.las?.shape??`arrow-table`)===`arrow-table`||e.id===`csv`&&!hb(t)?!1:!!Jy(e,n)}function sb(e,t,n,r,i=e){if(!ob(e,n))return!1;if(n?.core?.worker!==`auto`||!i.getWorkerEstimate)return!0;try{let e=i.getWorkerEstimate(t,n,r);return e===void 0||!Number.isFinite(e)||e<0||e>1?!0:e>=(n.core?.workerThreshold??.1)}catch{return!0}}async function cb(e,t,n,r,i,a){let o=a||ub(n),s=await Yy(e,t,{...pb(n,e),signal:o},{process:async(t,a,o,s)=>{if(!i)throw Error(`Worker not set up to parse on main thread`);let{_loaderIds:c,_loaderIsArray:l,...u}=s||{};return await db(i,t,a,r||s?{...r,...u}:void 0,fb(e,c,l,r,n))}},mb(r));return gb(e)?e.deserializeWorkerResult(s,n,r):s}async function*lb(e,t,n,r,i,a){let o=a||ub(n),s=Xy(e,t,{...pb(n),signal:o},{process:async(t,a,o,s)=>{if(!i)throw Error(`Worker not set up to parse on main thread`);let{_loaderIds:c,_loaderIsArray:l,...u}=s||{};return await db(i,t,a,r||s?{...r,...u}:void 0,fb(e,c,l,r,n))}},mb(r));for await(let t of s)yield e.deserializeWorkerBatch?e.deserializeWorkerBatch(t,n,r):t}function ub(e){let t=e?.parquet?.signal;if(typeof AbortSignal<`u`&&t instanceof AbortSignal)return t}function db(e,t,n,r,i){return!i&&e.length<=2?e(t,n):e(t,i,n,r)}function fb(e,t,n,r,i){if(!t)return;let a=new Map,o=new Set;for(let t of[e,...r?.loaders||[]])c(t);let s=t.map(e=>{let t=a.get(e);if(!t)throw Error(`Worker requested unknown loader "${e}". Declare it in loader.subloaders or pass it in context.loaders.`);return t});return n?s:s[0];function c(e){if(!o.has(e)){o.add(e),a.set(e.id,e);for(let[t,n]of Object.entries(e.subloaders||{})){let e=i?.core?.subloaders?.[t]||n;c(e),a.set(n.id,e)}}}}function pb(e={},t){let n=JSON.parse(JSON.stringify({...e,...e.core?{core:{...e.core,authentications:void 0}}:{}})),r={...n.core,...n};return r.worker===`auto`&&(r.worker=!0),t&&(r._workerLoaderId=t.id),r}function mb(e){if(!e)return{};let{fetch:t,loaders:n,coreApi:r,_parse:i,_parseSync:a,_parseInBatches:o,...s}=e;return JSON.parse(JSON.stringify(s))}function hb(e){let t=e;return(t?.csv?.shape??t?.core?.shape)===`arrow-table`}function gb(e){return typeof e.deserializeWorkerResult==`function`}async function _b(e){let t=[];for await(let n of e)t.push(vb(n));return ze(...t)}function vb(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:n,byteLength:r}=e;return yb(t,n,r)}return yb(e)}function yb(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function bb(e,t=[]){return e.every(Cb)?e:e.map((e,n)=>{if(Cb(e))return e;let r=t.find(t=>t.type===e?.type);if(!r)throw Error(`No authentication class registered for credential at index ${n}.`);let i;try{i=new r(e)}catch{throw Error(`Invalid authentication configuration at index ${n}.`)}if(!Cb(i))throw Error(`Authentication class returned an invalid credential at index ${n}.`);return i})}function xb(e){if(!e.core?.credentials?.length)return e;let t=bb(e.core.credentials,e.core.authentications);return t===e.core.credentials?e:{...e,core:{...e.core,credentials:t}}}async function Sb(e,t,n){if(!n.core?.credentials?.length||n.core.credentials.every(Cb))return n;let r=await e?.getAuthentications?.(t,n);return r?.length?xb({...n,core:{...n.core,authentications:[...n.core?.authentications||[],...r]}}):xb(n)}function Cb(e){return!e||typeof e!=`object`||typeof e.id!=`string`||!Array.isArray(e.origins)?!1:e.type===`request`?typeof e.authenticate==`function`:(e.type===`header`||e.type===`query-parameter`)&&typeof e.name==`string`&&(typeof e.token==`string`||typeof e.token==`function`)&&Array.isArray(e.refreshStatusCodes)}var wb=Symbol(`loaders.gl.authenticated-fetch`),Tb=new WeakMap;function Eb(e){let t=e.fetch||((e,t)=>fetch(e,t)),n=t[wb],r=new Map(n?.credentialResolutions),i=bb(e.credentials.map(e=>r.get(e)||e),e.authentications);if(e.credentials.forEach((e,t)=>{r.set(e,i[t])}),!e.fetchOptions&&(!i.length||n?.credentials.length===i.length&&i.every((e,t)=>e===n.credentials[t])))return t;let a=n?.fetch||t,o=n?[...new Set([...i,...n.credentials])]:i,s=Db(n?.fetchOptions||{},e.fetchOptions),c=o.filter(e=>e.type!==`request`),l=o.filter(e=>e.type===`request`);for(let e of l)Ab(e.origins);let u=async(e,t={})=>{if(t=Db(s,t),t.signal?.aborted)throw Ib();if(!o.length)return a(e,t);let n=Pb(e),r=n?await jb(n,t,c):{url:e,options:t,credentials:[]},i=await Ob(r,l,`request`),u=await a(i.url,i.options),d=[];for(let n of r.credentials){let{credential:r}=n;typeof r.token==`function`&&(Fb(t)||r.canReplayRequest?.(e,t))&&(Fb(i.options)||r.canReplayRequest?.(i.url,i.options))&&(r.refreshStatusCodes.includes(u.status)||await r.shouldRefresh?.(u))&&d.push(n)}let f=Fb(t)&&Fb(i.options)&&i.credentials.some(e=>e.refreshStatusCodes?.includes(u.status));if(!d.length&&!f)return u;if(t.signal?.aborted)throw Ib();let p=new Map;if(await Promise.all(d.map(async({credential:t})=>{let n=await Mb(t,e,u);n&&p.set(t,n)})),!p.size&&!f)return u;if(await u.body?.cancel().catch(()=>{}),t.signal?.aborted)throw Ib();let m=await Ob(n?await jb(n,t,c,p,r.credentials):{url:e,options:t},l,`retry`,u);return a(m.url,m.options)};return Object.defineProperty(u,wb,{value:{fetch:a,credentials:o,credentialResolutions:r,fetchOptions:s}}),u}function Db(e,t){let n={...e,...t};if(e.headers||t?.headers){let r=new Headers(e.headers);new Headers(t?.headers).forEach((e,t)=>r.set(t,e)),n.headers=r}return n}async function Ob(e,t,n,r){let i=[],a=e.options.signal;for(let o of t){let t=kb(e.url);if(!t||!Ab(o.origins).includes(t))continue;if(a?.aborted)throw Ib();let s=await o.authenticate({url:e.url,options:{...e.options,headers:new Headers(e.options.headers)},reason:n,response:r?{status:r.status,headers:new Headers(r.headers)}:void 0});if(!s||typeof s.url!=`string`||!s.options||typeof s.options!=`object`)throw Error(`Authentication callback returned an invalid request.`);e={url:s.url,options:{...s.options,...a?{signal:a}:{}}},i.push(o)}if(a?.aborted)throw Ib();return{...e,credentials:i}}function kb(e){try{let t=new URL(e);return!t.host||t.username||t.password?null:t.origin===`null`?`${t.protocol}//${t.host}`:t.origin}catch{return null}}function Ab(e){if(!e.length)throw Error(`Request authentication requires at least one exact origin.`);return e.map(e=>{let t=kb(e),n;try{n=new URL(e)}catch{throw Error(`Invalid request authentication origin.`)}if(!t||n.pathname&&n.pathname!==`/`||n.search||n.hash)throw Error(`Invalid request authentication origin.`);return t})}async function jb(e,t,n,r=new Map,i=[]){let a=new URL(e),o=new Headers(t.headers),s=[],c=new Map(i.map(({credential:e,token:t})=>[e,t]));for(let t of n){if(!t.origins.includes(a.origin))continue;let n=r.get(t),i=c.get(t),l=t.type===`query-parameter`&&i!==void 0,u=t.type===`header`&&i!==void 0;if(t.type===`query-parameter`&&a.searchParams.has(t.name)&&!l||t.type===`header`&&o.has(t.name)&&!u)continue;let d=n??i??await Nb(t.token,{url:e.toString(),reason:`request`});d&&(t.type===`query-parameter`?a.searchParams.set(t.name,d):o.set(t.name,`${t.prefix||``}${d}`),s.push({credential:t,token:d}))}return{url:a.toString(),options:{...t,headers:o},credentials:s}}async function Mb(e,t,n){let r=Tb.get(e);if(r)return r;let i=e.token,a=Promise.resolve(i({url:t,reason:`refresh`,response:{status:n.status,headers:n.headers}})).finally(()=>Tb.delete(e));return Tb.set(e,a),a}async function Nb(e,t){return typeof e==`function`?e(t):e}function Pb(e){try{let t=new URL(e);return[`http:`,`https:`].includes(t.protocol)?t:null}catch{return null}}function Fb(e){let t=(e.method||`GET`).toUpperCase();return[`GET`,`HEAD`,`OPTIONS`,`PUT`,`DELETE`].includes(t)?!(e.body&&typeof ReadableStream<`u`&&e.body instanceof ReadableStream):!1}function Ib(){return new DOMException(`The operation was aborted.`,`AbortError`)}var Lb=``,Rb={};function zb(e){for(let t in Rb)if(e.startsWith(t)){let n=Rb[t];e=e.replace(t,n)}return!e.startsWith(`http://`)&&!e.startsWith(`https://`)&&(e=`${Lb}${e}`),e}function Bb(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(t+1):e}function Vb(e){let t=e?e.lastIndexOf(`/`):-1;return t>=0?e.substr(0,t):``}function Hb(e){return!!(e&&typeof e==`object`&&`createDataSource`in e)}function Ub(e){switch(typeof e==`object`&&e?.shape){case`array-row-table`:case`object-row-table`:return Array.isArray(e.data);case`geojson-table`:return Array.isArray(e.features);case`columnar-table`:return!!(e.data&&typeof e.data==`object`);case`arrow-table`:return e?.data?.numRows!==void 0;default:return!1}}function Wb(e){switch(e.shape){case`array-row-table`:case`object-row-table`:return e.data.length;case`geojson-table`:return e.features.length;case`arrow-table`:return e.data.numRows;case`columnar-table`:for(let t of Object.values(e.data))return t.length||0;return 0;default:throw Error(`table`)}}function Gb(e){return{...e,length:Wb(e),batchType:`data`}}var Kb=`4.5.4`;async function qb(e,t,n,r){return r._parse(e,t,n,r)}function Jb(e,t){if(!e)throw Error(t||`loader assertion failed.`)}var Yb={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};Yb.self||Yb.window||Yb.global,Yb.window||Yb.self||Yb.global,Yb.global||Yb.self||Yb.window,Yb.document;var Xb=!!(typeof process!=`object`||String(process)!==`[object process]`||process.browser),Zb=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);Zb&&parseFloat(Zb[1]);var Qb=e=>typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer;function $b(e){globalThis.loaders||={},globalThis.loaders.modules||={},Object.assign(globalThis.loaders.modules,e)}function ex(e){return globalThis.loaders?.modules?.[e]||null}function tx(){return globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version=`4.5.4`),globalThis._loadersgl_.version}var nx=tx();function rx(e,t){if(!e)throw Error(t||`loaders.gl assertion failed.`)}var ix={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};ix.self||ix.window||ix.global,ix.window||ix.self||ix.global,ix.global||ix.self||ix.window,ix.document;var ax=typeof process!=`object`||String(process)!==`[object process]`||process.browser,ox=typeof importScripts==`function`;typeof window<`u`&&window.orientation;var sx=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);sx&&parseFloat(sx[1]);var cx={};function lx(e={}){let t=e.useLocalLibraries??e.core?.useLocalLibraries,n=e.CDN??e.core?.CDN,r=e.modules;return{...t===void 0?{}:{useLocalLibraries:t},...n===void 0?{}:{CDN:n},...r===void 0?{}:{modules:r}}}async function ux(e,t=null,n={},r=null){if(t){let i=n.modules?.[r||e];if(i!==void 0&&typeof i!=`string`)return i;e=dx(e,t,n,r)}return cx[e]=cx[e]||fx(e),await cx[e]}function dx(e,t,n={},r=null){if(n?.core)throw Error(`loadLibrary: options.core must be pre-normalized`);r||=e;let i=n.modules||{};return typeof i[r]==`string`?i[r]:!n.useLocalLibraries&&e.startsWith(`http`)?e:ax?n.CDN?(rx(n.CDN.startsWith(`http`)),`${n.CDN}/${t}@${nx}/dist/libs/${r}`):ox?`../src/libs/${r}`:`modules/${t}/src/libs/${r}`:`modules/${t}/dist/libs/${r}`}async function fx(e){if(e.endsWith(`wasm`))return await mx(e);if(!ax){let{requireFromFile:t}=globalThis.loaders||{};try{let n=await t?.(e);return n||!e.includes(`/dist/libs/`)?n:await t?.(e.replace(`/dist/libs/`,`/src/libs/`))}catch(n){if(e.includes(`/dist/libs/`))try{return await t?.(e.replace(`/dist/libs/`,`/src/libs/`))}catch{}return console.error(n),null}}return ox?importScripts(e):px(await hx(e),e)}function px(e,t){if(!ax){let{requireFromString:n}=globalThis.loaders||{};return n?.(e,t)}if(ox)return eval.call(globalThis,e),null;let n=document.createElement(`script`);n.id=t;try{n.appendChild(document.createTextNode(e))}catch{n.text=e}return document.body.appendChild(n),null}async function mx(e){let{readFileAsArrayBuffer:t}=globalThis.loaders||{};if(ax||!t||e.startsWith(`http`))return await(await fetch(e)).arrayBuffer();try{return await t(e)}catch{if(e.includes(`/dist/libs/`))return await t(e.replace(`/dist/libs/`,`/src/libs/`));throw Error(`Failed to load ArrayBuffer from ${e}`)}}async function hx(e){let{readFileAsText:t}=globalThis.loaders||{};if(ax||!t||e.startsWith(`http`))return await(await fetch(e)).text();try{return await t(e)}catch{if(e.includes(`/dist/libs/`))return await t(e.replace(`/dist/libs/`,`/src/libs/`));throw Error(`Failed to load text from ${e}`)}}function gx(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?_x(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?_x(e,0,t):``}function _x(e,t,n){if(e.byteLength<=t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}function vx(e){try{return JSON.parse(e)}catch{throw Error(`Failed to parse JSON from data starting with "${gx(e)}"`)}}function yx(e,t,n){let r=n===void 0?new Uint8Array(e).subarray(t):new Uint8Array(e).subarray(t,t+n);return new Uint8Array(r).buffer}function bx(e,t){return Jb(e>=0),Jb(t>0),e+(t-1)&~(t-1)}function xx(e,t,n){let r;if(e instanceof ArrayBuffer)r=new Uint8Array(e);else{let t=e.byteOffset,n=e.byteLength;r=new Uint8Array(e.buffer||e.arrayBuffer,t,n)}return t.set(r,n),n+bx(r.byteLength,4)}function Sx(e){if(e instanceof ArrayBuffer)return e;if(Qb(e))return Cx(e);let{buffer:t,byteOffset:n,byteLength:r}=e;return t instanceof ArrayBuffer&&n===0&&r===t.byteLength?t:Cx(t,n,r)}function Cx(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function wx(e,t){return new Promise((n,r)=>{let i=!1;function a(e){i||(i=!0,r(e))}function o(e){if(!i){i=!0;try{n(t(e))}catch(e){r(e)}}}try{e(o,a)?.then(o,a)}catch(e){a(e)}})}var Tx=globalThis.loaders?.parseImageNode,Ex=typeof Image<`u`,Dx=typeof ImageBitmap<`u`,Ox=Xb?!0:!!Tx;function kx(e){switch(e){case`auto`:return Dx||Ex||Ox;case`imagebitmap`:return Dx;case`image`:return Ex;case`data`:return Ox;default:throw Error(`@loaders.gl/images: image ${e} not supported in this environment`)}}function Ax(){if(Dx)return`imagebitmap`;if(Ex)return`image`;if(Ox)return`data`;throw Error(`Install '@loaders.gl/polyfills' to parse images under Node.js`)}function jx(e){let t=Nx(e);if(!t)throw Error(`Not an image`);return t}function Mx(e){switch(jx(e)){case`data`:return e;case`image`:case`imagebitmap`:let t=document.createElement(`canvas`),n=t.getContext(`2d`);if(!n)throw Error(`getImageData`);return t.width=e.width,t.height=e.height,n.drawImage(e,0,0),n.getImageData(0,0,e.width,e.height);default:throw Error(`getImageData`)}}function Nx(e){return typeof ImageBitmap<`u`&&e instanceof ImageBitmap?`imagebitmap`:typeof Image<`u`&&e instanceof Image?`image`:e&&typeof e==`object`&&e.data&&e.width&&e.height?`data`:null}var Px=/^data:image\/svg\+xml/,Fx=/\.svg((\?|#).*)?$/;function Ix(e){return e&&(Px.test(e)||Fx.test(e))}function Lx(e,t){if(Ix(t)){let t=new TextDecoder().decode(e);try{typeof unescape==`function`&&typeof encodeURIComponent==`function`&&(t=unescape(encodeURIComponent(t)))}catch(e){throw Error(e.message)}return`data:image/svg+xml;base64,${btoa(t)}`}return Rx(e,t)}function Rx(e,t){if(Ix(t))throw Error(`SVG cannot be parsed directly to imagebitmap`);return new Blob([new Uint8Array(e)])}async function zx(e,t,n){let r=Lx(e,n),i=self.URL||self.webkitURL,a=typeof r!=`string`&&i.createObjectURL(r);try{return await Bx(a||r,t)}finally{a&&i.revokeObjectURL(a)}}async function Bx(e,t){let n=new Image;return n.src=e,t.image&&t.image.decode&&n.decode?(await n.decode(),n):await new Promise((e,t)=>{try{n.onload=()=>e(n),n.onerror=e=>{let n=e instanceof Error?e.message:`error`;t(Error(n))}}catch(e){t(e)}})}var Vx=!0;async function Hx(e,t,n){let r;r=Ix(n)?await zx(e,t,n):Rx(e,n);let i=t&&t.imagebitmap;return await Ux(r,i)}async function Ux(e,t=null){if((Wx(t)||!Vx)&&(t=null),t)try{return await createImageBitmap(e,t)}catch(e){console.warn(e),Vx=!1}return await createImageBitmap(e)}function Wx(e){if(!e)return!0;for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function Gx(e){return!Yx(e,`ftyp`,4)||!(e[8]&96)?null:Kx(e)}function Kx(e){switch(qx(e,8,12).replace(`\0`,` `).trim()){case`avif`:case`avis`:return{extension:`avif`,mimeType:`image/avif`};default:return null}}function qx(e,t,n){return String.fromCharCode(...e.slice(t,n))}function Jx(e){return[...e].map(e=>e.charCodeAt(0))}function Yx(e,t,n=0){let r=Jx(t);for(let t=0;t<r.length;++t)if(r[t]!==e[t+n])return!1;return!0}var Xx=!1,Zx=!0;function Qx(e){let t=aS(e);return eS(t)||rS(t)||tS(t)||nS(t)||$x(t)}function $x(e){let t=Gx(new Uint8Array(e instanceof DataView?e.buffer:e));return t?{mimeType:t.mimeType,width:0,height:0}:null}function eS(e){let t=aS(e);return t.byteLength>=24&&t.getUint32(0,Xx)===2303741511?{mimeType:`image/png`,width:t.getUint32(16,Xx),height:t.getUint32(20,Xx)}:null}function tS(e){let t=aS(e);return t.byteLength>=10&&t.getUint32(0,Xx)===1195984440?{mimeType:`image/gif`,width:t.getUint16(6,Zx),height:t.getUint16(8,Zx)}:null}function nS(e){let t=aS(e);return t.byteLength>=14&&t.getUint16(0,Xx)===16973&&t.getUint32(2,Zx)===t.byteLength?{mimeType:`image/bmp`,width:t.getUint32(18,Zx),height:t.getUint32(22,Zx)}:null}function rS(e){let t=aS(e);if(!(t.byteLength>=3&&t.getUint16(0,Xx)===65496&&t.getUint8(2)===255))return null;let{tableMarkers:n,sofMarkers:r}=iS(),i=2;for(;i+9<t.byteLength;){let e=t.getUint16(i,Xx);if(r.has(e))return{mimeType:`image/jpeg`,height:t.getUint16(i+5,Xx),width:t.getUint16(i+7,Xx)};if(!n.has(e))return null;i+=2,i+=t.getUint16(i,Xx)}return null}function iS(){let e=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)e.add(t);return{tableMarkers:e,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}function aS(e){if(e instanceof DataView)return e;if(ArrayBuffer.isView(e))return new DataView(e.buffer);if(e instanceof ArrayBuffer)return new DataView(e);throw Error(`toDataView`)}async function oS(e,t){let{mimeType:n}=Qx(e)||{},r=globalThis.loaders?.parseImageNode;return Jb(r),await r(e,n)}async function sS(e,t,n){t||={};let r=(t.image||{}).type||`auto`,{url:i}=n||{},a=cS(r),o;switch(a){case`imagebitmap`:o=await Hx(e,t,i);break;case`image`:o=await zx(e,t,i);break;case`data`:o=await oS(e,t);break;default:Jb(!1)}return r===`data`&&(o=Mx(o)),o}function cS(e){switch(e){case`auto`:case`data`:return Ax();default:return kx(e),e}}var lS={dataType:null,batchType:null,id:`image`,module:`images`,name:`Images`,version:Kb,mimeTypes:[`image/png`,`image/jpeg`,`image/gif`,`image/webp`,`image/avif`,`image/bmp`,`image/vnd.microsoft.icon`,`image/svg+xml`],extensions:[`png`,`jpg`,`jpeg`,`gif`,`webp`,`bmp`,`ico`,`svg`,`avif`],parse:sS,tests:[e=>!!Qx(new DataView(e))],options:{image:{type:`auto`,decode:!0}}},uS=[`image/png`,`image/jpeg`,`image/gif`,`image/webp`,`image/avif`,`image/tiff`,`image/svg`,`image/svg+xml`,`image/bmp`,`image/vnd.microsoft.icon`],dS=null;async function fS(){return dS||=pS(),await dS}async function pS(){let e=new Set;for(let t of uS)(Xb?await yS(t):gS(t))&&e.add(t);return e}var mS={};function hS(e){return mS[e]===void 0&&(mS[e]=Xb?_S(e):gS(e)),mS[e]}function gS(e){let t=globalThis.loaders?.imageFormatsNode||[`image/png`,`image/jpeg`,`image/gif`];return!!globalThis.loaders?.parseImageNode&&t.includes(e)}function _S(e){switch(e){case`image/avif`:case`image/webp`:return bS(e);default:return!0}}var vS={"image/avif":`data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=`,"image/webp":`data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA`};async function yS(e){let t=vS[e];return t?await xS(t):!0}function bS(e){try{return document.createElement(`canvas`).toDataURL(e).indexOf(`data:${e}`)===0}catch{return!1}}async function xS(e){return new Promise(t=>{let n=new Image;n.src=e,n.onload=()=>t(n.height>0),n.onerror=()=>t(!1)})}function G(e,t){if(!e)throw Error(t||`assert failed: gltf`)}var SS={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},CS={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},wS=[`SCALAR`,`VEC2`,`VEC3`,`VEC4`],TS=[[Int8Array,5120],[Uint8Array,5121],[Int16Array,5122],[Uint16Array,5123],[Uint32Array,5125],[Float32Array,5126],[Float64Array,5130]],ES=new Map(TS),DS={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},OS={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},kS={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};function AS(e){return wS[e-1]||wS[0]}function jS(e){let t=ES.get(e.constructor);if(!t)throw Error(`Illegal typed array`);return t}function MS(e,t){let n=kS[e.componentType],r=DS[e.type],i=OS[e.componentType],a=e.count*r,o=e.count*r*i;return G(o>=0&&o<=t.byteLength),{ArrayType:n,length:a,byteLength:o,componentByteSize:CS[e.componentType],numberOfComponentsInElement:SS[e.type]}}function NS(e,t,n){let r=e.bufferViews[n];G(r);let i=t[r.buffer];G(i);let a=(r.byteOffset||0)+i.byteOffset;return new Uint8Array(i.arrayBuffer,a,r.byteLength)}function PS(e,t,n){let r=typeof n==`number`?e.accessors?.[n]:n;if(!r)throw Error(`No gltf accessor ${JSON.stringify(n)}`);let i=e.bufferViews?.[r.bufferView||0];if(!i)throw Error(`No gltf buffer view for accessor ${i}`);let{arrayBuffer:a,byteOffset:o}=t[i.buffer],s=(o||0)+(r.byteOffset||0)+(i.byteOffset||0),{ArrayType:c,length:l,componentByteSize:u,numberOfComponentsInElement:d}=MS(r,i),f=u*d,p=i.byteStride||f;if(i.byteStride===void 0||i.byteStride===f)return new c(a,s,l);let m=new c(l);for(let e=0;e<r.count;e++){let t=new c(a,s+e*p,d);m.set(t,e*d)}return m}function FS(){return{asset:{version:`2.0`,generator:`loaders.gl`},buffers:[],extensions:{},extensionsRequired:[],extensionsUsed:[]}}var K=class{gltf;sourceBuffers;byteLength;constructor(e){this.gltf={json:e?.json||FS(),buffers:e?.buffers||[],images:e?.images||[]},this.sourceBuffers=[],this.byteLength=0,this.gltf.buffers&&this.gltf.buffers[0]&&(this.byteLength=this.gltf.buffers[0].byteLength,this.sourceBuffers=[this.gltf.buffers[0]])}get json(){return this.gltf.json}getApplicationData(e){return this.json[e]}getExtraData(e){return(this.json.extras||{})[e]}hasExtension(e){let t=this.getUsedExtensions().find(t=>t===e),n=this.getRequiredExtensions().find(t=>t===e);return typeof t==`string`||typeof n==`string`}getExtension(e){let t=this.getUsedExtensions().find(t=>t===e),n=this.json.extensions||{};return t?n[e]:null}getRequiredExtension(e){return this.getRequiredExtensions().find(t=>t===e)?this.getExtension(e):null}getRequiredExtensions(){return this.json.extensionsRequired||[]}getUsedExtensions(){return this.json.extensionsUsed||[]}getRemovedExtensions(){return this.json.extensionsRemoved||[]}getObjectExtension(e,t){return(e.extensions||{})[t]}getScene(e){return this.getObject(`scenes`,e)}getNode(e){return this.getObject(`nodes`,e)}getSkin(e){return this.getObject(`skins`,e)}getMesh(e){return this.getObject(`meshes`,e)}getMaterial(e){return this.getObject(`materials`,e)}getAccessor(e){return this.getObject(`accessors`,e)}getTexture(e){return this.getObject(`textures`,e)}getSampler(e){return this.getObject(`samplers`,e)}getImage(e){return this.getObject(`images`,e)}getBufferView(e){return this.getObject(`bufferViews`,e)}getBuffer(e){return this.getObject(`buffers`,e)}getObject(e,t){if(typeof t==`object`)return t;let n=this.json[e]&&this.json[e][t];if(!n)throw Error(`glTF file error: Could not find ${e}[${t}]`);return n}getTypedArrayForBufferView(e){e=this.getBufferView(e);let t=e.buffer,n=this.gltf.buffers[t];G(n);let r=(e.byteOffset||0)+n.byteOffset;return new Uint8Array(n.arrayBuffer,r,e.byteLength)}getTypedArrayForAccessor(e){let t=this.getAccessor(e);return PS(this.gltf.json,this.gltf.buffers,t)}getTypedArrayForImageData(e){e=this.getAccessor(e);let t=this.getBufferView(e.bufferView),n=this.getBuffer(t.buffer).data,r=t.byteOffset||0;return new Uint8Array(n,r,t.byteLength)}addApplicationData(e,t){return this.json[e]=t,this}addExtraData(e,t){return this.json.extras=this.json.extras||{},this.json.extras[e]=t,this}addObjectExtension(e,t,n){return e.extensions=e.extensions||{},e.extensions[t]=n,this.registerUsedExtension(t),this}setObjectExtension(e,t,n){let r=e.extensions||{};r[t]=n}removeObjectExtension(e,t){let n=e?.extensions||{};if(n[t]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];let e=this.json.extensionsRemoved;e.includes(t)||e.push(t)}delete n[t]}addExtension(e,t={}){return G(t),this.json.extensions=this.json.extensions||{},this.json.extensions[e]=t,this.registerUsedExtension(e),t}addRequiredExtension(e,t={}){return G(t),this.addExtension(e,t),this.registerRequiredExtension(e),t}registerUsedExtension(e){this.json.extensionsUsed=this.json.extensionsUsed||[],this.json.extensionsUsed.find(t=>t===e)||this.json.extensionsUsed.push(e)}registerRequiredExtension(e){this.registerUsedExtension(e),this.json.extensionsRequired=this.json.extensionsRequired||[],this.json.extensionsRequired.find(t=>t===e)||this.json.extensionsRequired.push(e)}removeExtension(e){if(this.json.extensions?.[e]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];let t=this.json.extensionsRemoved;t.includes(e)||t.push(e)}this.json.extensions&&delete this.json.extensions[e],this.json.extensionsRequired&&this._removeStringFromArray(this.json.extensionsRequired,e),this.json.extensionsUsed&&this._removeStringFromArray(this.json.extensionsUsed,e)}setDefaultScene(e){this.json.scene=e}addScene(e){let{nodeIndices:t}=e;return this.json.scenes=this.json.scenes||[],this.json.scenes.push({nodes:t}),this.json.scenes.length-1}addNode(e){let{meshIndex:t,matrix:n}=e;this.json.nodes=this.json.nodes||[];let r={mesh:t};return n&&(r.matrix=n),this.json.nodes.push(r),this.json.nodes.length-1}addMesh(e){let{attributes:t,indices:n,material:r,mode:i=4}=e,a={primitives:[{attributes:this._addAttributes(t),mode:i}]};if(n){let e=this._addIndices(n);a.primitives[0].indices=e}return Number.isFinite(r)&&(a.primitives[0].material=r),this.json.meshes=this.json.meshes||[],this.json.meshes.push(a),this.json.meshes.length-1}addPointCloud(e){let t={primitives:[{attributes:this._addAttributes(e),mode:0}]};return this.json.meshes=this.json.meshes||[],this.json.meshes.push(t),this.json.meshes.length-1}addImage(e,t){let n=Qx(e),r=t||n?.mimeType,i={bufferView:this.addBufferView(e),mimeType:r};return this.json.images=this.json.images||[],this.json.images.push(i),this.json.images.length-1}addBufferView(e,t=0,n=this.byteLength){let r=e.byteLength;G(Number.isFinite(r)),this.sourceBuffers=this.sourceBuffers||[],this.sourceBuffers.push(e);let i={buffer:t,byteOffset:n,byteLength:r};return this.byteLength+=bx(r,4),this.json.bufferViews=this.json.bufferViews||[],this.json.bufferViews.push(i),this.json.bufferViews.length-1}addAccessor(e,t){let n={bufferView:e,type:AS(t.size),componentType:t.componentType,count:t.count,max:t.max,min:t.min};return this.json.accessors=this.json.accessors||[],this.json.accessors.push(n),this.json.accessors.length-1}addBinaryBuffer(e,t={size:3}){let n=this.addBufferView(e),r={min:t.min,max:t.max};(!r.min||!r.max)&&(r=this._getAccessorMinMax(e,t.size));let i={size:t.size,componentType:jS(e),count:Math.round(e.length/t.size),min:r.min,max:r.max};return this.addAccessor(n,Object.assign(i,t))}addTexture(e){let{imageIndex:t}=e,n={source:t};return this.json.textures=this.json.textures||[],this.json.textures.push(n),this.json.textures.length-1}addMaterial(e){return this.json.materials=this.json.materials||[],this.json.materials.push(e),this.json.materials.length-1}createBinaryChunk(){let e=this.byteLength,t=new ArrayBuffer(e),n=new Uint8Array(t),r=0;for(let e of this.sourceBuffers||[])r=xx(e,n,r);this.json?.buffers?.[0]?this.json.buffers[0].byteLength=e:this.json.buffers=[{byteLength:e}],this.gltf.binary=t,this.sourceBuffers=[t],this.gltf.buffers=[{arrayBuffer:t,byteOffset:0,byteLength:t.byteLength}]}_removeStringFromArray(e,t){let n=!0;for(;n;){let r=e.indexOf(t);r>-1?e.splice(r,1):n=!1}}_addAttributes(e={}){let t={};for(let n in e){let r=e[n],i=this._getGltfAttributeName(n);t[i]=this.addBinaryBuffer(r.value,r)}return t}_addIndices(e){return this.addBinaryBuffer(e,{size:1})}_getGltfAttributeName(e){switch(e.toLowerCase()){case`position`:case`positions`:case`vertices`:return`POSITION`;case`normal`:case`normals`:return`NORMAL`;case`color`:case`colors`:return`COLOR_0`;case`texcoord`:case`texcoords`:return`TEXCOORD_0`;default:return e}}_getAccessorMinMax(e,t){let n={min:null,max:null};if(e.length<t)return n;n.min=[],n.max=[];let r=e.subarray(0,t);for(let e of r)n.min.push(e),n.max.push(e);for(let r=t;r<e.length;r+=t)for(let i=0;i<t;i++)n.min[0+i]=Math.min(n.min[0+i],e[r+i]),n.max[0+i]=Math.max(n.max[0+i],e[r+i]);return n}};function IS(e){return(e%1+1)%1}var LS={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16,BOOLEAN:1,STRING:1,ENUM:1},RS={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:BigInt64Array,UINT64:BigUint64Array,FLOAT32:Float32Array,FLOAT64:Float64Array},zS={INT8:1,UINT8:1,INT16:2,UINT16:2,INT32:4,UINT32:4,INT64:8,UINT64:8,FLOAT32:4,FLOAT64:8};function BS(e,t){return zS[t]*LS[e]}function VS(e,t,n,r){if(n!==`UINT8`&&n!==`UINT16`&&n!==`UINT32`&&n!==`UINT64`)return null;let i=HS(e.getTypedArrayForBufferView(t),`SCALAR`,n,r+1);return i instanceof BigInt64Array||i instanceof BigUint64Array?null:i}function HS(e,t,n,r=1){let i=LS[t],a=RS[n],o=zS[n],s=r*i,c=s*o,l=e.buffer,u=e.byteOffset;return u%o!==0&&(l=new Uint8Array(l).slice(u,u+c).buffer,u=0),new a(Sx(l),u,s)}function US(e,t,n){let r=`TEXCOORD_${t.texCoord||0}`,i=n.attributes[r],a=e.getTypedArrayForAccessor(i),o=e.gltf.json,s=t.index,c=o.textures?.[s]?.source;if(c!==void 0){let n=o.images?.[c]?.mimeType,r=e.gltf.images?.[c];if(r&&r.width!==void 0){let e=[];for(let i=0;i<a.length;i+=2){let o=GS(r,n,a,i,t.channels);e.push(o)}return e}}return[]}function WS(e,t,n,r,i){if(!n?.length)return;let a=[];for(let e of n){let t=r.findIndex(t=>t===e);t===-1&&(t=r.push(e)-1),a.push(t)}let o=new Uint32Array(a),s=e.gltf.buffers.push({arrayBuffer:o.buffer,byteOffset:o.byteOffset,byteLength:o.byteLength})-1,c=e.addBufferView(o,s,0),l=e.addAccessor(c,{size:1,componentType:jS(o),count:o.length});i.attributes[t]=l}function GS(e,t,n,r,i=[0]){let a={r:{offset:0,shift:0},g:{offset:1,shift:8},b:{offset:2,shift:16},a:{offset:3,shift:24}},o=n[r],s=n[r+1],c=1;t&&(t.indexOf(`image/jpeg`)!==-1||t.indexOf(`image/png`)!==-1)&&(c=4);let l=KS(o,s,e,c),u=0;for(let t of i){let n=typeof t==`number`?Object.values(a)[t]:a[t],r=l+n.offset,i=Mx(e);if(i.data.length<=r)throw Error(`${i.data.length} <= ${r}`);let o=i.data[r];u|=o<<n.shift}return u}function KS(e,t,n,r=1){let i=n.width,a=IS(e)*(i-1),o=Math.round(a),s=n.height,c=IS(t)*(s-1),l=Math.round(c),u=n.components?n.components:r;return(l*i+o)*u}function qS(e,t,n,r,i){let a=[];for(let o=0;o<t;o++){let t=n[o],s=n[o+1]-n[o];if(s+t>r)break;let c=t/i,l=s/i;a.push(e.slice(c,c+l))}return a}function JS(e,t,n){let r=[];for(let i=0;i<t;i++){let t=i*n;r.push(e.slice(t,t+n))}return r}function YS(e,t,n,r){if(n)throw Error(`Not implemented - arrayOffsets for strings is specified`);if(r){let n=[],i=new TextDecoder(`utf8`),a=0;for(let o=0;o<e;o++){let e=r[o+1]-r[o];if(e+a<=t.length){let r=t.subarray(a,e+a),o=i.decode(r);n.push(o),a+=e}}return n}return[]}var XS=e({createExtMeshFeatures:()=>iC,decode:()=>$S,encode:()=>eC,name:()=>QS}),ZS=`EXT_mesh_features`,QS=ZS;async function $S(e,t){tC(new K(e),t)}function eC(e,t){let n=new K(e);return rC(n,t),n.createBinaryChunk(),n.gltf}function tC(e,t){let n=e.gltf.json;if(n.meshes)for(let r of n.meshes)for(let n of r.primitives)nC(e,n,t)}function nC(e,t,n){if(!n?.gltf?.loadBuffers)return;let r=t.extensions?.[ZS]?.featureIds;if(r)for(let i of r){let r;if(i.attribute!==void 0){let n=`_FEATURE_ID_${i.attribute}`,a=t.attributes[n];r=e.getTypedArrayForAccessor(a)}else r=i.texture!==void 0&&n?.gltf?.loadImages?US(e,i.texture,t):[];i.data=r}}function rC(e,t){let n=e.gltf.json.meshes;if(n)for(let t of n)for(let n of t.primitives)aC(e,n)}function iC(e,t,n,r){t.extensions||={};let i=t.extensions[ZS];i||(i={featureIds:[]},t.extensions[ZS]=i);let{featureIds:a}=i,o={featureCount:n.length,propertyTable:r,data:n};a.push(o),e.addObjectExtension(t,ZS,i)}function aC(e,t){let n=t.extensions?.[ZS];if(!n)return;let r=n.featureIds;r.forEach((n,i)=>{if(n.data){let{accessorKey:a,index:o}=oC(t.attributes),s=new Uint32Array(n.data);r[i]={featureCount:s.length,propertyTable:n.propertyTable,attribute:o},e.gltf.buffers.push({arrayBuffer:s.buffer,byteOffset:s.byteOffset,byteLength:s.byteLength});let c=e.addBufferView(s),l=e.addAccessor(c,{size:1,componentType:jS(s),count:s.length});t.attributes[a]=l}})}function oC(e){let t=`_FEATURE_ID_`,n=Object.keys(e).filter(e=>e.indexOf(t)===0),r=-1;for(let e of n){let t=Number(e.substring(12));t>r&&(r=t)}return r++,{accessorKey:`${t}${r}`,index:r}}var sC=e({createExtStructuralMetadata:()=>jC,decode:()=>uC,encode:()=>dC,name:()=>lC}),cC=`EXT_structural_metadata`,lC=cC;async function uC(e,t){fC(new K(e),t)}function dC(e,t){let n=new K(e);return kC(n,t),n.createBinaryChunk(),n.gltf}function fC(e,t){if(!t.gltf?.loadBuffers)return;let n=e.getExtension(cC);n&&(t.gltf?.loadImages&&pC(e,n),mC(e,n))}function pC(e,t){let n=t.propertyTextures,r=e.gltf.json;if(n&&r.meshes)for(let i of r.meshes)for(let r of i.primitives)gC(e,n,r,t)}function mC(e,t){let n=t.schema;if(!n)return;let r=n.classes,i=t.propertyTables;if(r&&i)for(let t in r){let r=hC(i,t);r&&vC(e,n,r)}}function hC(e,t){for(let n of e)if(n.class===t)return n;return null}function gC(e,t,n,r){if(!t)return;let i=n.extensions?.[cC]?.propertyTextures;if(i)for(let a of i){let i=t[a];_C(e,i,n,r)}}function _C(e,t,n,r){if(!t.properties)return;r.dataAttributeNames||=[];let i=t.class;for(let a in t.properties){let o=`${i}_${a}`,s=t.properties?.[a];if(!s)continue;s.data||=[];let c=s.data,l=US(e,s,n);l!==null&&(WS(e,o,l,c,n),s.data=c,r.dataAttributeNames.push(o))}}function vC(e,t,n){let r=t.classes?.[n.class];if(!r)throw Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${n.class}`);let i=n.count;for(let a in r.properties){let o=r.properties[a],s=n.properties?.[a];s&&(s.data=yC(e,t,o,i,s))}}function yC(e,t,n,r,i){let a=[],o=i.values,s=e.getTypedArrayForBufferView(o),c=bC(e,n,i,r),l=xC(e,i,r);switch(n.type){case`SCALAR`:case`VEC2`:case`VEC3`:case`VEC4`:case`MAT2`:case`MAT3`:case`MAT4`:a=SC(n,r,s,c);break;case`BOOLEAN`:throw Error(`Not implemented - classProperty.type=${n.type}`);case`STRING`:a=YS(r,s,c,l);break;case`ENUM`:a=CC(t,n,r,s,c);break;default:throw Error(`Unknown classProperty type ${n.type}`)}return a}function bC(e,t,n,r){return t.array&&t.count===void 0&&n.arrayOffsets!==void 0?VS(e,n.arrayOffsets,n.arrayOffsetType||`UINT32`,r):null}function xC(e,t,n){return t.stringOffsets===void 0?null:VS(e,t.stringOffsets,t.stringOffsetType||`UINT32`,n)}function SC(e,t,n,r){let i=e.array,a=e.count,o=BS(e.type,e.componentType),s=n.byteLength/o,c;return c=e.componentType?HS(n,e.type,e.componentType,s):n,i?r?qS(c,t,r,n.length,o):a?JS(c,t,a):[]:c}function CC(e,t,n,r,i){let a=t.enumType;if(!a)throw Error(`Incorrect data in the EXT_structural_metadata extension: classProperty.enumType is not set for type ENUM`);let o=e.enums?.[a];if(!o)throw Error(`Incorrect data in the EXT_structural_metadata extension: schema.enums does't contain ${a}`);let s=o.valueType||`UINT16`,c=BS(t.type,s),l=r.byteLength/c,u=HS(r,t.type,s,l);if(u||=r,t.array){if(i)return wC({valuesData:u,numberOfElements:n,arrayOffsets:i,valuesDataBytesLength:r.length,elementSize:c,enumEntry:o});let e=t.count;return e?TC(u,n,e,o):[]}return EC(u,0,n,o)}function wC(e){let{valuesData:t,numberOfElements:n,arrayOffsets:r,valuesDataBytesLength:i,elementSize:a,enumEntry:o}=e,s=[];for(let e=0;e<n;e++){let n=r[e],c=r[e+1]-r[e];if(c+n>i)break;let l=EC(t,n/a,c/a,o);s.push(l)}return s}function TC(e,t,n,r){let i=[];for(let a=0;a<t;a++){let t=EC(e,n*a,n,r);i.push(t)}return i}function EC(e,t,n,r){let i=[];for(let a=0;a<n;a++)if(e instanceof BigInt64Array||e instanceof BigUint64Array)i.push(``);else{let n=e[t+a],o=DC(r,n);o?i.push(o.name):i.push(``)}return i}function DC(e,t){for(let n of e.values)if(n.value===t)return n;return null}var OC=`schemaClassId`;function kC(e,t){let n=e.getExtension(cC);if(n&&n.propertyTables)for(let t of n.propertyTables){let r=t.class,i=n.schema?.classes?.[r];t.properties&&i&&AC(t,i,e)}}function AC(e,t,n){for(let r in e.properties){let i=e.properties[r].data;if(i){let a=t.properties[r];if(a){let t=PC(i,a,n);e.properties[r]=t}}}}function jC(e,t,n=OC){let r=e.getExtension(cC);r||=e.addExtension(cC),r.schema=MC(t,n,r.schema);let i=NC(t,n,r.schema);return r.propertyTables||=[],r.propertyTables.push(i)-1}function MC(e,t,n){let r=n??{id:`schema_id`},i={properties:{}};for(let t of e){let e={type:t.elementType,componentType:t.componentType};i.properties[t.name]=e}return r.classes={},r.classes[t]=i,r}function NC(e,t,n){let r={class:t,count:0},i=0,a=n.classes?.[t];for(let t of e){if(i===0&&(i=t.values.length),i!==t.values.length&&t.values.length)throw Error(`Illegal values in attributes`);a?.properties[t.name]&&(r.properties||={},r.properties[t.name]={values:0,data:t.values})}return r.count=i,r}function PC(e,t,n){let r={values:0};if(t.type===`STRING`){let{stringData:t,stringOffsets:i}=LC(e);r.stringOffsets=RC(i,n),r.values=RC(t,n)}else t.type===`SCALAR`&&t.componentType&&(r.values=RC(IC(e,t.componentType),n));return r}var FC={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:Int32Array,UINT64:Uint32Array,FLOAT32:Float32Array,FLOAT64:Float64Array};function IC(e,t){let n=[];for(let t of e)n.push(Number(t));let r=FC[t];if(!r)throw Error(`Illegal component type`);return new r(n)}function LC(e){let t=new TextEncoder,n=[],r=0;for(let i of e){let e=t.encode(i);r+=e.length,n.push(e)}let i=new Uint8Array(r),a=[],o=0;for(let e of n)i.set(e,o),a.push(o),o+=e.length;return a.push(o),{stringData:i,stringOffsets:new Uint32Array(a)}}function RC(e,t){return t.gltf.buffers.push({arrayBuffer:Sx(e.buffer),byteOffset:e.byteOffset,byteLength:e.byteLength}),t.addBufferView(e)}var zC=e({decode:()=>HC,name:()=>VC}),BC=`EXT_feature_metadata`,VC=BC;async function HC(e,t){UC(new K(e),t)}function UC(e,t){if(!t.gltf?.loadBuffers)return;let n=e.getExtension(BC);n&&(t.gltf?.loadImages&&WC(e,n),GC(e,n))}function WC(e,t){let n=t.schema;if(!n)return;let r=n.classes,{featureTextures:i}=t;if(r&&i)for(let t in r){let n=r[t],a=qC(i,t);a&&YC(e,a,n)}}function GC(e,t){let n=t.schema;if(!n)return;let r=n.classes,i=t.featureTables;if(r&&i)for(let t in r){let r=KC(i,t);r&&JC(e,n,r)}}function KC(e,t){for(let n in e){let r=e[n];if(r.class===t)return r}return null}function qC(e,t){for(let n in e){let r=e[n];if(r.class===t)return r}return null}function JC(e,t,n){if(!n.class)return;let r=t.classes?.[n.class];if(!r)throw Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${n.class}`);let i=n.count;for(let a in r.properties){let o=r.properties[a],s=n.properties?.[a];s&&(s.data=XC(e,t,o,i,s))}}function YC(e,t,n){let r=t.class;for(let i in n.properties){let n=t?.properties?.[i];n&&(n.data=tw(e,n,r))}}function XC(e,t,n,r,i){let a=[],o=i.bufferView,s=e.getTypedArrayForBufferView(o),c=ZC(e,n,i,r),l=QC(e,n,i,r);return n.type===`STRING`||n.componentType===`STRING`?a=YS(r,s,c,l):$C(n)&&(a=ew(n,r,s,c)),a}function ZC(e,t,n,r){return t.type===`ARRAY`&&t.componentCount===void 0&&n.arrayOffsetBufferView!==void 0?VS(e,n.arrayOffsetBufferView,n.offsetType||`UINT32`,r):null}function QC(e,t,n,r){return n.stringOffsetBufferView===void 0?null:VS(e,n.stringOffsetBufferView,n.offsetType||`UINT32`,r)}function $C(e){let t=[`UINT8`,`INT16`,`UINT16`,`INT32`,`UINT32`,`INT64`,`UINT64`,`FLOAT32`,`FLOAT64`];return t.includes(e.type)||e.componentType!==void 0&&t.includes(e.componentType)}function ew(e,t,n,r){let i=e.type===`ARRAY`,a=e.componentCount,o=`SCALAR`,s=e.componentType||e.type,c=BS(o,s),l=HS(n,o,s,n.byteLength/c);return i?r?qS(l,t,r,n.length,c):a?JS(l,t,a):[]:l}function tw(e,t,n){let r=e.gltf.json;if(!r.meshes)return[];let i=[];for(let a of r.meshes)for(let r of a.primitives)nw(e,n,t,i,r);return i}function nw(e,t,n,r,i){let a=US(e,{channels:n.channels,...n.texture},i);a&&WS(e,t,a,r,i)}var rw=`4.5.4`,iw=`4.5.4`,aw={TRANSCODER:`basis_transcoder.js`,TRANSCODER_WASM:`basis_transcoder.wasm`,ENCODER:`basis_encoder.js`,ENCODER_WASM:`basis_encoder.wasm`},ow;async function sw(e){return $b(e.modules),ex(`basis`)||(ow||=cw(e),await ow)}async function cw(e){let t=null,n=null;return[t,n]=await Promise.all([await ux(aw.TRANSCODER,`textures`,e),await ux(aw.TRANSCODER_WASM,`textures`,e)]),t||=globalThis.BASIS,await lw(t,n)}function lw(e,t){let n={};return t&&(n.wasmBinary=t),wx(()=>e(n),e=>{let{BasisFile:t,initializeBasis:n}=e;return n(),{BasisFile:t}})}var uw;async function dw(e){let t=e.modules||{};return t.basisEncoder?t.basisEncoder:(uw||=fw(e),await uw)}async function fw(e){let t=null,n=null;return[t,n]=await Promise.all([await ux(aw.ENCODER,`textures`,e),await ux(aw.ENCODER_WASM,`textures`,e)]),t||=globalThis.BASIS,await pw(t,n)}function pw(e,t){let n={};return t&&(n.wasmBinary=t),wx(()=>e(n),e=>{let{BasisFile:t,KTX2File:n,BasisEncoder:r,initializeBasis:i}=e;return i(),{BasisFile:t,KTX2File:n,BasisEncoder:r}})}var mw=32854,hw=32856,gw=36194,_w=33776,vw=33779,yw=37493,bw=35840,xw=35842,Sw=36196,Cw=35986,ww=34798,Tw=37808,Ew=36283,Dw=36285,Ow=36492,kw=[``,`WEBKIT_`,`MOZ_`],Aw={WEBGL_compressed_texture_s3tc:[`bc1-rgb-unorm-webgl`,`bc1-rgba-unorm`,`bc2-rgba-unorm`,`bc3-rgba-unorm`],WEBGL_compressed_texture_s3tc_srgb:[`bc1-rgb-unorm-srgb-webgl`,`bc1-rgba-unorm-srgb`,`bc2-rgba-unorm-srgb`,`bc3-rgba-unorm-srgb`],EXT_texture_compression_rgtc:[`bc4-r-unorm`,`bc4-r-snorm`,`bc5-rg-unorm`,`bc5-rg-snorm`],EXT_texture_compression_bptc:[`bc6h-rgb-ufloat`,`bc6h-rgb-float`,`bc7-rgba-unorm`,`bc7-rgba-unorm-srgb`],WEBGL_compressed_texture_etc1:[`etc1-rgb-unorm-webgl`],WEBGL_compressed_texture_etc:[`etc2-rgb8unorm`,`etc2-rgb8unorm-srgb`,`etc2-rgb8a1unorm`,`etc2-rgb8a1unorm-srgb`,`etc2-rgba8unorm`,`etc2-rgba8unorm-srgb`,`eac-r11unorm`,`eac-r11snorm`,`eac-rg11unorm`,`eac-rg11snorm`],WEBGL_compressed_texture_pvrtc:[`pvrtc-rgb4unorm-webgl`,`pvrtc-rgba4unorm-webgl`,`pvrtc-rgb2unorm-webgl`,`pvrtc-rgba2unorm-webgl`],WEBGL_compressed_texture_atc:[`atc-rgb-unorm-webgl`,`atc-rgba-unorm-webgl`,`atc-rgbai-unorm-webgl`],WEBGL_compressed_texture_astc:`astc-4x4-unorm.astc-4x4-unorm-srgb.astc-5x4-unorm.astc-5x4-unorm-srgb.astc-5x5-unorm.astc-5x5-unorm-srgb.astc-6x5-unorm.astc-6x5-unorm-srgb.astc-6x6-unorm.astc-6x6-unorm-srgb.astc-8x5-unorm.astc-8x5-unorm-srgb.astc-8x6-unorm.astc-8x6-unorm-srgb.astc-8x8-unorm.astc-8x8-unorm-srgb.astc-10x5-unorm.astc-10x5-unorm-srgb.astc-10x6-unorm.astc-10x6-unorm-srgb.astc-10x8-unorm.astc-10x8-unorm-srgb.astc-10x10-unorm.astc-10x10-unorm-srgb.astc-12x10-unorm.astc-12x10-unorm-srgb.astc-12x12-unorm.astc-12x12-unorm-srgb`.split(`.`)},jw=null;function Mw(e){if(!jw){e=e||Nw()||void 0,jw=new Set;for(let t of kw)for(let n in Aw)if(e&&e.getExtension(`${t}${n}`))for(let e of Aw[n])jw.add(e)}return jw}function Nw(){try{return document.createElement(`canvas`).getContext(`webgl`)}catch{return null}}var q=[171,75,84,88,32,50,48,187,13,10,26,10];function Pw(e){let t=new Uint8Array(e);return!(t.byteLength<q.length||t[0]!==q[0]||t[1]!==q[1]||t[2]!==q[2]||t[3]!==q[3]||t[4]!==q[4]||t[5]!==q[5]||t[6]!==q[6]||t[7]!==q[7]||t[8]!==q[8]||t[9]!==q[9]||t[10]!==q[10]||t[11]!==q[11])}var Fw=Promise.resolve(),Iw={etc1:{basisFormat:0,compressed:!0,format:Sw,textureFormat:`etc1-rgb-unorm-webgl`},etc2:{basisFormat:1,compressed:!0,format:yw,textureFormat:`etc2-rgba8unorm`},bc1:{basisFormat:2,compressed:!0,format:_w,textureFormat:`bc1-rgb-unorm-webgl`},bc3:{basisFormat:3,compressed:!0,format:vw,textureFormat:`bc3-rgba-unorm`},bc4:{basisFormat:4,compressed:!0,format:Ew,textureFormat:`bc4-r-unorm`},bc5:{basisFormat:5,compressed:!0,format:Dw,textureFormat:`bc5-rg-unorm`},"bc7-m6-opaque-only":{basisFormat:6,compressed:!0,format:Ow,textureFormat:`bc7-rgba-unorm`},"bc7-m5":{basisFormat:6,compressed:!0,format:Ow,textureFormat:`bc7-rgba-unorm`},"pvrtc1-4-rgb":{basisFormat:8,compressed:!0,format:bw,textureFormat:`pvrtc-rgb4unorm-webgl`},"pvrtc1-4-rgba":{basisFormat:9,compressed:!0,format:xw,textureFormat:`pvrtc-rgba4unorm-webgl`},"astc-4x4":{basisFormat:10,compressed:!0,format:Tw,textureFormat:`astc-4x4-unorm`},"atc-rgb":{basisFormat:11,compressed:!0,format:Cw,textureFormat:`atc-rgb-unorm-webgl`},"atc-rgba-interpolated-alpha":{basisFormat:12,compressed:!0,format:ww,textureFormat:`atc-rgbai-unorm-webgl`},rgba32:{basisFormat:13,compressed:!1,format:hw,textureFormat:`rgba8unorm`},rgb565:{basisFormat:14,compressed:!1,format:gw,textureFormat:`rgb565unorm-webgl`},bgr565:{basisFormat:15,compressed:!1,format:gw,textureFormat:`rgb565unorm-webgl`},rgba4444:{basisFormat:16,compressed:!1,format:mw,textureFormat:`rgba4unorm-webgl`}};Object.freeze(Object.keys(Iw));async function Lw(e){let t=Fw,n;Fw=new Promise(e=>{n=e}),await t;try{return await e()}finally{n()}}async function Rw(e,t={}){let n=lx(t);return await Lw(async()=>{if(!t.basis?.containerFormat||t.basis.containerFormat===`auto`){if(Pw(e))return Vw((await dw(n)).KTX2File,e,t);let{BasisFile:r}=await sw(n);return zw(r,e,t)}switch(t.basis.module){case`encoder`:let r=await dw(n);switch(t.basis.containerFormat){case`ktx2`:return Vw(r.KTX2File,e,t);default:return zw(r.BasisFile,e,t)}default:let{BasisFile:i}=await sw(n);return zw(i,e,t)}})}function zw(e,t,n){let r=new e(new Uint8Array(t));try{if(!r.startTranscoding())throw Error(`Failed to start basis transcoding`);let e=r.getNumImages(),t=[];for(let i=0;i<e;i++){let e=r.getNumLevels(i),a=[];for(let t=0;t<e;t++)a.push(Bw(r,i,t,n));t.push(a)}return t}finally{r.close(),r.delete()}}function Bw(e,t,n,r){let i=e.getImageWidth(t,n),a=e.getImageHeight(t,n),o=e.getHasAlpha(),{compressed:s,format:c,basisFormat:l,textureFormat:u}=Uw(r,o),d=e.getImageTranscodedSizeInBytes(t,n,l),f=new Uint8Array(d);if(!e.transcodeImage(f,t,n,l,0,0))throw Error(`failed to start Basis transcoding`);return{shape:`texture-level`,width:i,height:a,data:f,compressed:s,...c===void 0?{}:{format:c},...u===void 0?{}:{textureFormat:u},hasAlpha:o}}function Vw(e,t,n){let r=new e(new Uint8Array(t));try{if(!r.startTranscoding())throw Error(`failed to start KTX2 transcoding`);let e=r.getLevels(),t=[];for(let i=0;i<e;i++)t.push(Hw(r,i,n));return[t]}finally{r.close(),r.delete()}}function Hw(e,t,n){let{alphaFlag:r,height:i,width:a}=e.getImageLevelInfo(t,0,0),{compressed:o,format:s,basisFormat:c,textureFormat:l}=Uw(n,r),u=e.getImageTranscodedSizeInBytes(t,0,0,c),d=new Uint8Array(u);if(!e.transcodeImage(d,t,0,0,c,0,-1,-1))throw Error(`Failed to transcode KTX2 image`);return{shape:`texture-level`,width:a,height:i,data:d,compressed:o,...s===void 0?{}:{format:s},...l===void 0?{}:{textureFormat:l},levelSize:u,hasAlpha:r}}function Uw(e,t){let n=e.basis?.format||`auto`;n===`auto`&&(n=e.basis?.supportedTextureFormats?Ww(e.basis.supportedTextureFormats):Ww()),typeof n==`object`&&(n=t?n.alpha:n.noAlpha);let r=Iw[n.toLowerCase()];if(!r)throw Error(`Unknown Basis format ${n}`);return r}function Ww(e=Mw()){let t=new Set(e);return Gw(t,[`astc-4x4-unorm`,`astc-4x4-unorm-srgb`])?`astc-4x4`:Gw(t,[`bc7-rgba-unorm`,`bc7-rgba-unorm-srgb`])?{alpha:`bc7-m5`,noAlpha:`bc7-m6-opaque-only`}:Gw(t,[`bc1-rgb-unorm-webgl`,`bc1-rgb-unorm-srgb-webgl`,`bc1-rgba-unorm`,`bc1-rgba-unorm-srgb`,`bc2-rgba-unorm`,`bc2-rgba-unorm-srgb`,`bc3-rgba-unorm`,`bc3-rgba-unorm-srgb`])?{alpha:`bc3`,noAlpha:`bc1`}:Gw(t,[`pvrtc-rgb4unorm-webgl`,`pvrtc-rgba4unorm-webgl`,`pvrtc-rgb2unorm-webgl`,`pvrtc-rgba2unorm-webgl`])?{alpha:`pvrtc1-4-rgba`,noAlpha:`pvrtc1-4-rgb`}:Gw(t,[`etc2-rgb8unorm`,`etc2-rgb8unorm-srgb`,`etc2-rgb8a1unorm`,`etc2-rgb8a1unorm-srgb`,`etc2-rgba8unorm`,`etc2-rgba8unorm-srgb`,`eac-r11unorm`,`eac-r11snorm`,`eac-rg11unorm`,`eac-rg11snorm`])?`etc2`:t.has(`etc1-rgb-unorm-webgl`)?`etc1`:Gw(t,[`atc-rgb-unorm-webgl`,`atc-rgba-unorm-webgl`,`atc-rgbai-unorm-webgl`])?{alpha:`atc-rgba-interpolated-alpha`,noAlpha:`atc-rgb`}:`rgb565`}function Gw(e,t){return t.some(t=>e.has(t))}var Kw={dataType:null,batchType:null,name:`Basis`,id:`basis`,module:`textures`,version:iw,worker:!0,extensions:[`basis`,`ktx2`],mimeTypes:[`application/octet-stream`,`image/ktx2`],tests:[`sB`],binary:!0,options:{basis:{format:`auto`,containerFormat:`auto`,module:`transcoder`}},parse:Rw},qw=!0,Jw=1735152710,Yw=12,Xw=8,Zw=1313821514,Qw=5130562,$w=0,eT=0,tT=1;function nT(e,t=0){return`\
${String.fromCharCode(e.getUint8(t+0))}\
${String.fromCharCode(e.getUint8(t+1))}\
${String.fromCharCode(e.getUint8(t+2))}\
${String.fromCharCode(e.getUint8(t+3))}`}function rT(e,t=0,n={}){let r=new DataView(e),{magic:i=Jw}=n,a=r.getUint32(t,!1);return a===i||a===Jw}function iT(e,t,n=0,r={}){let i=new DataView(t),a=nT(i,n+0),o=i.getUint32(n+4,qw),s=i.getUint32(n+8,qw);switch(Object.assign(e,{header:{byteOffset:n,byteLength:s,hasBinChunk:!1},type:a,version:o,json:{},binChunks:[]}),n+=Yw,e.version){case 1:return aT(e,i,n);case 2:return oT(e,i,n,r={});default:throw Error(`Invalid GLB version ${e.version}. Only supports version 1 and 2.`)}}function aT(e,t,n){Jb(e.header.byteLength>Yw+Xw);let r=t.getUint32(n+0,qw),i=t.getUint32(n+4,qw);return n+=Xw,Jb(i===$w),cT(e,t,n,r),n+=r,n+=lT(e,t,n,e.header.byteLength),n}function oT(e,t,n,r){return Jb(e.header.byteLength>Yw+Xw),sT(e,t,n,r),n+e.header.byteLength}function sT(e,t,n,r){for(;n+8<=e.header.byteLength;){let i=t.getUint32(n+0,qw),a=t.getUint32(n+4,qw);switch(n+=Xw,a){case Zw:cT(e,t,n,i);break;case Qw:lT(e,t,n,i);break;case eT:r.strict||cT(e,t,n,i);break;case tT:r.strict||lT(e,t,n,i);break;default:break}n+=bx(i,4)}return n}function cT(e,t,n,r){let i=new Uint8Array(t.buffer,n,r),a=new TextDecoder(`utf8`).decode(i);return e.json=JSON.parse(a),bx(r,4)}function lT(e,t,n,r){return e.header.hasBinChunk=!0,e.binChunks.push({byteOffset:n,byteLength:r,arrayBuffer:t.buffer}),bx(r,4)}function uT(e,t,n){if(e.startsWith(`data:`)||e.startsWith(`http:`)||e.startsWith(`https:`))return e;let r=n?.baseUrl||dT(t?.core?.baseUrl);if(!r)throw Error(`'baseUrl' must be provided to resolve relative url ${e}`);return r.endsWith(`/`)?`${r}${e}`:`${r}/${e}`}function dT(e){if(!e)return;if(e.endsWith(`/`))return e;let t=e.lastIndexOf(`/`);return t>=0?e.slice(0,t+1):``}function fT(e){return typeof e==`string`?e:[`NONE`,`OCTAHEDRAL`,`QUATERNION`,`EXPONENTIAL`,`COLOR`][e]}async function pT(e,t,n,r,i,a=`NONE`){await qe.ready,qe.decodeGltfBuffer(e,t,n,r,i,fT(a))}async function mT(e,t,n){if(!t.gltf?.decompressMeshes||!t.gltf.loadBuffers)return;hT(e.json);let r=new K(e),i=e.json.bufferViews||[],a=i.map(e=>gT(r,e,n));await Promise.all(a);for(let e of i)r.removeObjectExtension(e,n);for(let t of e.json.buffers||[])r.removeObjectExtension(t,n);r.removeExtension(n)}function hT(e){let t=e.bufferViews||[];for(let e=0;e<t.length;e++){let n=t[e].extensions;if(n?.KHR_meshopt_compression&&n.EXT_meshopt_compression)throw Error(`glTF bufferView ${e} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`)}let n=e.buffers||[];for(let e=0;e<n.length;e++){let t=n[e].extensions;if(t?.KHR_meshopt_compression&&t.EXT_meshopt_compression)throw Error(`glTF buffer ${e} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`)}}async function gT(e,t,n){let r=e.getObjectExtension(t,n);if(!r)return;let{byteOffset:i=0,byteLength:a,byteStride:o,count:s,mode:c,filter:l=`NONE`,buffer:u}=r,d=e.gltf.buffers[u],f=e.gltf.buffers[t.buffer],p=new Uint8Array(d.arrayBuffer,d.byteOffset+i,a);await pT(new Uint8Array(f.arrayBuffer,f.byteOffset+(t.byteOffset||0),t.byteLength),s,o,p,c,l)}var _T=e({decode:()=>yT,name:()=>vT}),vT=`EXT_meshopt_compression`;async function yT(e,t){await mT(e,t,vT)}var bT=e({decode:()=>ST,name:()=>xT}),xT=`KHR_meshopt_compression`;async function ST(e,t){await mT(e,t,xT)}var CT=e({name:()=>TT,preprocess:()=>ET}),wT=`EXT_texture_webp`,TT=wT;function ET(e,t){let n=new K(e);if(!hS(`image/webp`)){if(n.getRequiredExtensions().includes(wT))throw Error(`gltf: Required extension ${wT} not supported by browser`);return}let{json:r}=n;for(let e of r.textures||[]){let t=n.getObjectExtension(e,wT);t&&(e.source=t.source),n.removeObjectExtension(e,wT)}n.removeExtension(wT)}var DT=e({name:()=>kT,preprocess:()=>AT}),OT=`EXT_texture_avif`,kT=OT;async function AT(e,t){let n=new K(e);if(!(await fS()).has(`image/avif`)){if(n.getRequiredExtensions().includes(OT))throw Error(`gltf: Required extension ${OT} not supported by browser`);return}let{json:r}=n;for(let e of r.textures||[]){let t=n.getObjectExtension(e,OT);t&&(e.source=t.source),n.removeObjectExtension(e,OT)}n.removeExtension(OT)}var jT=e({name:()=>NT,preprocess:()=>PT}),MT=`KHR_texture_basisu`,NT=MT;function PT(e,t){let n=new K(e),{json:r}=n;for(let e of r.textures||[]){let t=n.getObjectExtension(e,MT);t&&(e.source=t.source,n.removeObjectExtension(e,MT))}n.removeExtension(MT)}var FT=`1.5.6`,IT=`1.4.1`,LT=`https://www.gstatic.com/draco/versioned/decoders/${FT}`,J={DECODER:`draco_wasm_wrapper.js`,DECODER_WASM:`draco_decoder.wasm`,FALLBACK_DECODER:`draco_decoder.js`,ENCODER:`draco_encoder.js`},RT={[J.DECODER]:`${LT}/${J.DECODER}`,[J.DECODER_WASM]:`${LT}/${J.DECODER_WASM}`,[J.FALLBACK_DECODER]:`${LT}/${J.FALLBACK_DECODER}`,[J.ENCODER]:`https://raw.githubusercontent.com/google/draco/${IT}/javascript/${J.ENCODER}`},zT;async function BT(e={},t){let n=e.modules||{};return n.draco3d?zT||=wx(()=>n.draco3d.createDecoderModule({}),e=>({draco:e})):zT||=HT(e,t),await zT}function VT(e,t){if(e&&typeof e==`object`){if(e.default)return e.default;if(e[t])return e[t]}return e}async function HT(e,t){let n,r;switch(t){case`js`:n=await ux(RT[J.FALLBACK_DECODER],`draco`,e,J.FALLBACK_DECODER);break;default:try{[n,r]=await Promise.all([await ux(RT[J.DECODER],`draco`,e,J.DECODER),await ux(RT[J.DECODER_WASM],`draco`,e,J.DECODER_WASM)])}catch{n=null,r=null}}return n=VT(n,`DracoDecoderModule`),n||=globalThis.DracoDecoderModule,!n&&!ax&&([n,r]=await Promise.all([await ux(RT[J.DECODER],`draco`,{...e,useLocalLibraries:!0},J.DECODER),await ux(RT[J.DECODER_WASM],`draco`,{...e,useLocalLibraries:!0},J.DECODER_WASM)]),n=VT(n,`DracoDecoderModule`),n||=globalThis.DracoDecoderModule),await UT(n,r)}function UT(e,t){if(typeof e!=`function`)throw Error(`DracoDecoderModule could not be loaded`);let n={};return t&&(n.wasmBinary=t),wx(t=>e({...n,onModuleLoaded:t}),e=>({draco:e}))}var WT=`4.5.4`;function GT(e){switch(e.constructor){case Int8Array:return`int8`;case Uint8Array:case Uint8ClampedArray:return`uint8`;case Int16Array:return`int16`;case Uint16Array:return`uint16`;case Int32Array:return`int32`;case Uint32Array:return`uint32`;case Float32Array:return`float32`;case Float64Array:return`float64`;default:return`null`}}function KT(e){let t=1/0,n=1/0,r=1/0,i=-1/0,a=-1/0,o=-1/0,s=e.POSITION?e.POSITION.value:[],c=s&&s.length;for(let e=0;e<c;e+=3){let c=s[e],l=s[e+1],u=s[e+2];t=c<t?c:t,n=l<n?l:n,r=u<r?u:r,i=c>i?c:i,a=l>a?l:a,o=u>o?u:o}return[[t,n,r],[i,a,o]]}function qT(e,t,n){let r=GT(t.value),i=n||JT(t);return{name:e,type:{type:`fixed-size-list`,listSize:t.size,children:[{name:`value`,type:r}]},nullable:!1,metadata:i}}function JT(e){let t={};return`byteOffset`in e&&(t.byteOffset=e.byteOffset.toString(10)),`byteStride`in e&&(t.byteStride=e.byteStride.toString(10)),`normalized`in e&&(t.normalized=e.normalized.toString()),t}function YT(e,t,n){let r=QT(t.metadata),i=[],a=XT(t.attributes);for(let t in e){let n=e[t],r=ZT(t,n,a[t]);i.push(r)}if(n){let e=ZT(`indices`,n);i.push(e)}return{fields:i,metadata:r}}function XT(e){let t={};for(let n in e){let r=e[n];t[r.name||`undefined`]=r}return t}function ZT(e,t,n){return qT(e,t,n?QT(n.metadata):void 0)}function QT(e){Object.entries(e);let t={};for(let n in e)t[`${n}.string`]=JSON.stringify(e[n]);return t}var $T={POSITION:`POSITION`,NORMAL:`NORMAL`,COLOR:`COLOR_0`,TEX_COORD:`TEXCOORD_0`},eE={1:Int8Array,2:Uint8Array,3:Int16Array,4:Uint16Array,5:Int32Array,6:Uint32Array,9:Float32Array},tE=4,nE=class{draco;decoder;metadataQuerier;constructor(e){this.draco=e,this.decoder=new this.draco.Decoder,this.metadataQuerier=new this.draco.MetadataQuerier}destroy(){this.draco.destroy(this.decoder),this.draco.destroy(this.metadataQuerier)}parseSync(e,t={}){let n=new this.draco.DecoderBuffer;n.Init(new Int8Array(e),e.byteLength),this._disableAttributeTransforms(t);let r=this.decoder.GetEncodedGeometryType(n),i=r===this.draco.TRIANGULAR_MESH?new this.draco.Mesh:new this.draco.PointCloud;try{let e;switch(r){case this.draco.TRIANGULAR_MESH:e=this.decoder.DecodeBufferToMesh(n,i);break;case this.draco.POINT_CLOUD:e=this.decoder.DecodeBufferToPointCloud(n,i);break;default:throw Error(`DRACO: Unknown geometry type.`)}if(!e.ok()||!i.ptr){let t=`DRACO decompression failed: ${e.error_msg()}`;throw Error(t)}let a=this._getDracoLoaderData(i,r,t),o=this._getMeshData(i,a,t),s=KT(o.attributes),c=YT(o.attributes,a,o.indices);return{loader:`draco`,loaderData:a,header:{vertexCount:i.num_points(),boundingBox:s},...o,schema:c}}finally{this.draco.destroy(n),i&&this.draco.destroy(i)}}_getDracoLoaderData(e,t,n){let r=this._getTopLevelMetadata(e),i=this._getDracoAttributes(e,n);return{geometry_type:t,num_attributes:e.num_attributes(),num_points:e.num_points(),num_faces:e instanceof this.draco.Mesh?e.num_faces():0,metadata:r,attributes:i}}_getDracoAttributes(e,t){let n={};for(let r=0;r<e.num_attributes();r++){let i=this.decoder.GetAttribute(e,r),a=this._getAttributeMetadata(e,r);n[i.unique_id()]={unique_id:i.unique_id(),attribute_type:i.attribute_type(),data_type:i.data_type(),num_components:i.num_components(),byte_offset:i.byte_offset(),byte_stride:i.byte_stride(),normalized:i.normalized(),attribute_index:r,metadata:a};let o=this._getQuantizationTransform(i,t);o&&(n[i.unique_id()].quantization_transform=o);let s=this._getOctahedronTransform(i,t);s&&(n[i.unique_id()].octahedron_transform=s)}return n}_getMeshData(e,t,n){let r=this._getMeshAttributes(t,e,n);if(!r.POSITION)throw Error(`DRACO: No position attribute found.`);if(e instanceof this.draco.Mesh)switch(n.topology){case`triangle-strip`:return{topology:`triangle-strip`,mode:4,attributes:r,indices:{value:this._getTriangleStripIndices(e),size:1}};default:return{topology:`triangle-list`,mode:5,attributes:r,indices:{value:this._getTriangleListIndices(e),size:1}}}return{topology:`point-list`,mode:0,attributes:r}}_getMeshAttributes(e,t,n){let r={};for(let i of Object.values(e.attributes)){let e=this._deduceAttributeName(i,n);i.name=e;let a=this._getAttributeValues(t,i);if(a){let{value:t,size:n}=a;r[e]={value:t,size:n,byteOffset:i.byte_offset,byteStride:i.byte_stride,normalized:i.normalized}}}return r}_getTriangleListIndices(e){let t=e.num_faces()*3,n=t*tE,r=this.draco._malloc(n);try{return this.decoder.GetTrianglesUInt32Array(e,n,r),new Uint32Array(this.draco.HEAPF32.buffer,r,t).slice()}finally{this.draco._free(r)}}_getTriangleStripIndices(e){let t=new this.draco.DracoInt32Array;try{return this.decoder.GetTriangleStripsFromMesh(e,t),aE(t)}finally{this.draco.destroy(t)}}_getAttributeValues(e,t){let n=eE[t.data_type];if(!n)return console.warn(`DRACO: Unsupported attribute type ${t.data_type}`),null;let r=t.num_components,i=e.num_points()*r,a=i*n.BYTES_PER_ELEMENT,o=rE(this.draco,n),s,c=this.draco._malloc(a);try{let r=this.decoder.GetAttribute(e,t.attribute_index);this.decoder.GetAttributeDataArrayForAllPoints(e,r,o,a,c),s=new n(this.draco.HEAPF32.buffer,c,i).slice()}finally{this.draco._free(c)}return{value:s,size:r}}_deduceAttributeName(e,t){let n=e.unique_id;for(let[e,r]of Object.entries(t.extraAttributes||{}))if(r===n)return e;let r=e.attribute_type;for(let e in $T)if(this.draco[e]===r)return $T[e];let i=t.attributeNameEntry||`name`;return e.metadata[i]?e.metadata[i].string:`CUSTOM_ATTRIBUTE_${n}`}_getTopLevelMetadata(e){let t=this.decoder.GetMetadata(e);return this._getDracoMetadata(t)}_getAttributeMetadata(e,t){let n=this.decoder.GetAttributeMetadata(e,t);return this._getDracoMetadata(n)}_getDracoMetadata(e){if(!e||!e.ptr)return{};let t={},n=this.metadataQuerier.NumEntries(e);for(let r=0;r<n;r++){let n=this.metadataQuerier.GetEntryName(e,r);t[n]=this._getDracoMetadataField(e,n)}return t}_getDracoMetadataField(e,t){let n=new this.draco.DracoInt32Array;try{this.metadataQuerier.GetIntEntryArray(e,t,n);let r=iE(n);return{int:this.metadataQuerier.GetIntEntry(e,t),string:this.metadataQuerier.GetStringEntry(e,t),double:this.metadataQuerier.GetDoubleEntry(e,t),intArray:r}}finally{this.draco.destroy(n)}}_disableAttributeTransforms(e){let{quantizedAttributes:t=[],octahedronAttributes:n=[]}=e,r=[...t,...n];for(let e of r)this.decoder.SkipAttributeTransform(this.draco[e])}_getQuantizationTransform(e,t){let{quantizedAttributes:n=[]}=t,r=e.attribute_type();if(n.map(e=>this.decoder[e]).includes(r)){let t=new this.draco.AttributeQuantizationTransform;try{if(t.InitFromAttribute(e))return{quantization_bits:t.quantization_bits(),range:t.range(),min_values:new Float32Array([1,2,3]).map(e=>t.min_value(e))}}finally{this.draco.destroy(t)}}return null}_getOctahedronTransform(e,t){let{octahedronAttributes:n=[]}=t,r=e.attribute_type();if(n.map(e=>this.decoder[e]).includes(r)){let t=new this.draco.AttributeQuantizationTransform;try{if(t.InitFromAttribute(e))return{quantization_bits:t.quantization_bits()}}finally{this.draco.destroy(t)}}return null}};function rE(e,t){switch(t){case Float32Array:return e.DT_FLOAT32;case Int8Array:return e.DT_INT8;case Int16Array:return e.DT_INT16;case Int32Array:return e.DT_INT32;case Uint8Array:return e.DT_UINT8;case Uint16Array:return e.DT_UINT16;case Uint32Array:return e.DT_UINT32;default:return e.DT_INVALID}}function iE(e){let t=e.size(),n=new Int32Array(t);for(let r=0;r<t;r++)n[r]=e.GetValue(r);return n}function aE(e){let t=e.size(),n=new Int32Array(t);for(let r=0;r<t;r++)n[r]=e.GetValue(r);return n}var oE={dataType:null,batchType:null,name:`Draco`,id:`draco`,module:`draco`,version:WT,worker:!0,extensions:[`drc`],mimeTypes:[`application/octet-stream`],binary:!0,tests:[`DRACO`],options:{draco:{decoderType:typeof WebAssembly==`object`?`wasm`:`js`,extraAttributes:{},attributeNameEntry:void 0}},parse:sE};async function sE(e,t){let{draco:n}=await BT(lx(t),t?.draco?.decoderType||`wasm`),r=new nE(n);try{return r.parseSync(e,t?.draco)}finally{r.destroy()}}function cE(e){let t={};for(let n in e){let r=e[n];n!==`indices`&&(t[n]=lE(r))}return t}function lE(e){let{buffer:t,size:n,count:r}=uE(e);return{value:t,size:n,byteOffset:0,count:r,type:AS(n),componentType:jS(t)}}function uE(e){let t=e,n=1,r=0;return e&&e.value&&(t=e.value,n=e.size||1),t&&(ArrayBuffer.isView(t)||(t=dE(t,Float32Array)),r=t.length/n),{buffer:t,size:n,count:r}}function dE(e,t,n=!1){return e?Array.isArray(e)||n&&!(e instanceof t)?new t(e):e:null}var fE=e({decode:()=>gE,encode:()=>_E,name:()=>mE,preprocess:()=>hE}),pE=`KHR_draco_mesh_compression`,mE=pE;function hE(e,t,n){let r=new K(e);for(let e of xE(r))r.getObjectExtension(e,pE)}async function gE(e,t,n){if(!t?.gltf?.decompressMeshes)return;let r=new K(e),i=[];for(let e of xE(r))r.getObjectExtension(e,pE)&&i.push(vE(r,e,t,n));await Promise.all(i),r.removeExtension(pE)}function _E(e,t={}){let n=new K(e);for(let e of n.json.meshes||[])yE(e,t),n.addRequiredExtension(pE)}async function vE(e,t,n,r){let i=e.getObjectExtension(t,pE);if(!i)return;let a=e.getTypedArrayForBufferView(i.bufferView),o=yx(a.buffer,a.byteOffset),s={...n};delete s[`3d-tiles`];let c=await qb(o,oE,s,r),l=cE(c.attributes);for(let[n,r]of Object.entries(l))if(n in t.attributes){let i=t.attributes[n],a=e.getAccessor(i);a?.min&&a?.max&&(r.min=a.min,r.max=a.max)}t.attributes=l,c.indices&&(t.indices=lE(c.indices)),e.removeObjectExtension(t,pE),bE(t)}function yE(e,t,n=4,r,i){if(!r.DracoWriter)throw Error(`options.gltf.DracoWriter not provided`);let a=r.DracoWriter.encodeSync({attributes:e}),o=i?.parseSync?.({attributes:e}),s=r._addFauxAttributes(o.attributes),c=r.addBufferView(a);return{primitives:[{attributes:s,mode:n,extensions:{[pE]:{bufferView:c,attributes:s}}}]}}function bE(e){if(!e.attributes&&Object.keys(e.attributes).length>0)throw Error(`glTF: Empty primitive detected: Draco decompression failure?`)}function*xE(e){for(let t of e.json.meshes||[])for(let e of t.primitives)yield e}var SE=e({decode:()=>OE,name:()=>wE}),CE=`KHR_texture_transform`,wE=CE,TE=new D,EE=new we,DE=new we;async function OE(e,t){let n=new K(e);if(!n.hasExtension(CE)||!t.gltf?.loadBuffers)return;let r=e.json.materials||[];for(let t=0;t<r.length;t++)kE(t,e,n);r.some(e=>AE(e).length>0)||n.removeExtension(CE)}function kE(e,t,n){let r=t.json.materials?.[e],i=AE(r),a=new Map,o=jE(t);for(let r of i){let i=r.extensions?.[CE];if(i){let s=i.texCoord??r.texCoord??0,c=ME(s,i),l=a.get(c);if(!l){if(l={sourceTexCoord:s,texCoord:o,matrix:LE(i)},!NE(t,e,l))continue;o++,a.set(c,l)}r.texCoord=l.texCoord,n.removeObjectExtension(r,CE),r.extensions&&Object.keys(r.extensions).length===0&&delete r.extensions}}}function AE(e){if(!e||typeof e!=`object`)return[];let t=e,n=[],r=t.extensions;Number.isFinite(t.index)&&r?.[CE]&&n.push(t);for(let[e,r]of Object.entries(t))e!==`extras`&&n.push(...AE(r));return n}function jE(e){let t=-1;for(let n of e.json.meshes||[])for(let e of n.primitives)for(let n of Object.keys(e.attributes)){let e=/^TEXCOORD_(\d+)$/.exec(n);e&&(t=Math.max(t,Number(e[1])))}return t+1}function ME(e,t){let{offset:n=[0,0],rotation:r=0,scale:i=[1,1]}=t;return JSON.stringify([e,n,r,i])}function NE(e,t,n){let r=[],i=e.json.meshes||[];for(let e of i)for(let n of e.primitives){let e=n.material;Number.isFinite(e)&&t===e&&r.push(n)}if(r.length===0||r.some(t=>!PE(e,t,n.sourceTexCoord)))return!1;for(let t of r)FE(e,t,n);return!0}function PE(e,t,n){let r=t.attributes[`TEXCOORD_${n}`];if(!Number.isFinite(r))return!1;let i=e.json.accessors?.[r];if(!i||i.bufferView===void 0||i.sparse)return!1;let a=e.json.bufferViews?.[i.bufferView];return!!(a&&e.buffers[a.buffer])}function FE(e,t,n){let{sourceTexCoord:r,texCoord:i,matrix:a}=n,o=t.attributes[`TEXCOORD_${r}`];if(Number.isFinite(o)){let n=e.json.accessors?.[o];if(n&&n.bufferView!==void 0){let r=e.json.bufferViews?.[n.bufferView];if(r){let{arrayBuffer:o,byteOffset:s}=e.buffers[r.buffer],c=(s||0)+(n.byteOffset||0)+(r.byteOffset||0),{ArrayType:l,length:u}=MS(n,r),d=CS[n.componentType],f=SS[n.type],p=r.byteStride||d*f,m=new Float32Array(u);for(let e=0;e<n.count;e++){let t=new l(o,c+e*p,2);TE.set(t[0],t[1],1),TE.transformByMatrix3(a),m.set([TE[0],TE[1]],e*f)}IE(i,n,t,e,m)}}}}function IE(e,t,n,r,i){r.buffers.push({arrayBuffer:Sx(i.buffer),byteOffset:0,byteLength:i.buffer.byteLength}),r.json.bufferViews=r.json.bufferViews||[];let a=r.json.bufferViews;a.push({buffer:r.buffers.length-1,byteLength:i.buffer.byteLength,byteOffset:0});let o=r.json.accessors;o&&(o.push({bufferView:a?.length-1,byteOffset:0,componentType:5126,count:t.count,type:`VEC2`}),n.attributes[`TEXCOORD_${e}`]=o.length-1)}function LE(e){let{offset:t=[0,0],rotation:n=0,scale:r=[1,1]}=e,i=new we().set(1,0,0,0,1,0,t[0],t[1],1),a=EE.set(Math.cos(n),Math.sin(n),0,-Math.sin(n),Math.cos(n),0,0,0,1),o=DE.set(r[0],0,0,0,r[1],0,0,0,1);return i.multiplyRight(a).multiplyRight(o)}var RE=e({decode:()=>VE,encode:()=>HE,name:()=>BE}),zE=`KHR_lights_punctual`,BE=zE;async function VE(e){let t=new K(e),{json:n}=t,r=t.getExtension(zE);r&&(t.json.lights=r.lights,t.removeExtension(zE));for(let e of n.nodes||[]){let n=t.getObjectExtension(e,zE);n&&(e.light=n.light),t.removeObjectExtension(e,zE)}}async function HE(e){let t=new K(e),{json:n}=t;if(n.lights){let e=t.addExtension(zE);G(!e.lights),e.lights=n.lights,delete n.lights}if(t.json.lights){for(let e of t.json.lights){let n=e.node;t.addObjectExtension(n,zE,e)}delete t.json.lights}}var UE=e({decode:()=>KE,encode:()=>qE,name:()=>GE}),WE=`KHR_materials_unlit`,GE=WE;async function KE(e){let t=new K(e),{json:n}=t;for(let e of n.materials||[])e.extensions&&e.extensions.KHR_materials_unlit&&(e.unlit=!0),t.removeObjectExtension(e,WE);t.removeExtension(WE)}function qE(e){let t=new K(e),{json:n}=t;if(t.materials)for(let e of n.materials||[])e.unlit&&(delete e.unlit,t.addObjectExtension(e,WE,{}),t.addExtension(WE))}var JE=e({decode:()=>ZE,encode:()=>QE,name:()=>XE}),YE=`KHR_techniques_webgl`,XE=YE;async function ZE(e){let t=new K(e),{json:n}=t,r=t.getExtension(YE);if(r){let e=$E(r,t);for(let r of n.materials||[]){let n=t.getObjectExtension(r,YE);n&&(r.technique=Object.assign({},n,e[n.technique]),r.technique.values=eD(r.technique,t)),t.removeObjectExtension(r,YE)}t.removeExtension(YE)}}async function QE(e,t){}function $E(e,t){let{programs:n=[],shaders:r=[],techniques:i=[]}=e,a=new TextDecoder;return r.forEach(e=>{if(Number.isFinite(e.bufferView))e.code=a.decode(t.getTypedArrayForBufferView(e.bufferView));else throw Error(`KHR_techniques_webgl: no shader code`)}),n.forEach(e=>{e.fragmentShader=r[e.fragmentShader],e.vertexShader=r[e.vertexShader]}),i.forEach(e=>{e.program=n[e.program]}),i}function eD(e,t){let n=Object.assign({},e.values);return Object.keys(e.uniforms||{}).forEach(t=>{e.uniforms[t].value&&!(t in n)&&(n[t]=e.uniforms[t].value)}),Object.keys(n).forEach(e=>{typeof n[e]==`object`&&n[e].index!==void 0&&(n[e].texture=t.getTexture(n[e].index))}),n}var tD=[sC,XS,bT,_T,DT,CT,jT,fE,RE,UE,JE,SE,zC];async function nD(e,t={},n){let r=tD.filter(e=>iD(e.name,t));for(let i of r)await i.preprocess?.(e,t,n)}async function rD(e,t={},n){let r=tD.filter(e=>iD(e.name,t));for(let i of r)await i.decode?.(e,t,n)}function iD(e,t){let n=t?.gltf?.excludeExtensions||{};return!(e in n&&!n[e])}var aD=`KHR_binary_glTF`;function oD(e){let t=new K(e),{json:n}=t;for(let e of n.images||[]){let n=t.getObjectExtension(e,aD);n&&Object.assign(e,n),t.removeObjectExtension(e,aD)}n.buffers&&n.buffers[0]&&delete n.buffers[0].uri,t.removeExtension(aD)}var sD={accessors:`accessor`,animations:`animation`,buffers:`buffer`,bufferViews:`bufferView`,images:`image`,materials:`material`,meshes:`mesh`,nodes:`node`,samplers:`sampler`,scenes:`scene`,skins:`skin`,textures:`texture`},cD={accessor:`accessors`,animations:`animation`,buffer:`buffers`,bufferView:`bufferViews`,image:`images`,material:`materials`,mesh:`meshes`,node:`nodes`,sampler:`samplers`,scene:`scenes`,skin:`skins`,texture:`textures`},lD=class{idToIndexMap={animations:{},accessors:{},buffers:{},bufferViews:{},images:{},materials:{},meshes:{},nodes:{},samplers:{},scenes:{},skins:{},textures:{}};json;normalize(e,t){this.json=e.json;let n=e.json;switch(n.asset&&n.asset.version){case`2.0`:return;case void 0:case`1.0`:break;default:console.warn(`glTF: Unknown version ${n.asset.version}`);return}if(!t.normalize)throw Error(`glTF v1 is not supported.`);console.warn(`Converting glTF v1 to glTF v2 format. This is experimental and may fail.`),this._addAsset(n),this._convertTopLevelObjectsToArrays(n),oD(e),this._convertObjectIdsToArrayIndices(n),this._updateObjects(n),this._updateMaterial(n)}_addAsset(e){e.asset=e.asset||{},e.asset.version=`2.0`,e.asset.generator=e.asset.generator||`Normalized to glTF 2.0 by loaders.gl`}_convertTopLevelObjectsToArrays(e){for(let t in sD)this._convertTopLevelObjectToArray(e,t)}_convertTopLevelObjectToArray(e,t){let n=e[t];if(!(!n||Array.isArray(n))){e[t]=[];for(let r in n){let i=n[r];i.id=i.id||r;let a=e[t].length;e[t].push(i),this.idToIndexMap[t][r]=a}}}_convertObjectIdsToArrayIndices(e){for(let t in sD)this._convertIdsToIndices(e,t);`scene`in e&&(e.scene=this._convertIdToIndex(e.scene,`scene`));for(let t of e.textures)this._convertTextureIds(t);for(let t of e.meshes)this._convertMeshIds(t);for(let t of e.nodes)this._convertNodeIds(t);for(let t of e.scenes)this._convertSceneIds(t)}_convertTextureIds(e){e.source&&=this._convertIdToIndex(e.source,`image`)}_convertMeshIds(e){for(let t of e.primitives){let{attributes:e,indices:n,material:r}=t;for(let t in e)e[t]=this._convertIdToIndex(e[t],`accessor`);n&&(t.indices=this._convertIdToIndex(n,`accessor`)),r&&(t.material=this._convertIdToIndex(r,`material`))}}_convertNodeIds(e){e.children&&=e.children.map(e=>this._convertIdToIndex(e,`node`)),e.meshes&&=e.meshes.map(e=>this._convertIdToIndex(e,`mesh`))}_convertSceneIds(e){e.nodes&&=e.nodes.map(e=>this._convertIdToIndex(e,`node`))}_convertIdsToIndices(e,t){e[t]||(console.warn(`gltf v1: json doesn't contain attribute ${t}`),e[t]=[]);for(let n of e[t])for(let e in n){let t=n[e];n[e]=this._convertIdToIndex(t,e)}}_convertIdToIndex(e,t){let n=cD[t];if(n in this.idToIndexMap){let r=this.idToIndexMap[n][e];if(!Number.isFinite(r))throw Error(`gltf v1: failed to resolve ${t} with id ${e}`);return r}return e}_updateObjects(e){for(let e of this.json.buffers)delete e.type}_updateMaterial(e){for(let t of e.materials){t.pbrMetallicRoughness={baseColorFactor:[1,1,1,1],metallicFactor:1,roughnessFactor:1};let n=t.values?.tex||t.values?.texture2d_0||t.values?.diffuseTex,r=e.textures.findIndex(e=>e.id===n);r!==-1&&(t.pbrMetallicRoughness.baseColorTexture={index:r})}}};function uD(e,t={}){return new lD().normalize(e,t)}function dD(e,t){let n=e.basis,r=n?.format;return{...e,core:{...e.core,mimeType:t},basis:{...n,format:r&&r!==`auto`?r:Ww(n?.supportedTextureFormats)}}}async function fD(e,t,n=0,r,i){return pD(e,t,n,r),uD(e,{normalize:r?.gltf?.normalize}),await nD(e,r,i),r?.gltf?.loadBuffers&&e.json.buffers&&await mD(e,r,i),r?.gltf?.loadImages&&await hD(e,r,i),await rD(e,r,i),e}function pD(e,t,n,r){if(r.core?.baseUrl&&(e.baseUri=r.core?.baseUrl),t instanceof ArrayBuffer&&!rT(t,n,r.glb)&&(t=new TextDecoder().decode(t)),typeof t==`string`)e.json=vx(t);else if(t instanceof ArrayBuffer){let i={};n=iT(i,t,n,r.glb),G(i.type===`glTF`,`Invalid GLB magic string ${i.type}`),e._glb=i,e.json=i.json}else G(!1,`GLTF: must be ArrayBuffer or string`);let i=e.json.buffers||[];if(e.buffers=Array(i.length).fill(null),e._glb&&e._glb.header.hasBinChunk){let{binChunks:t}=e._glb;e.buffers[0]={arrayBuffer:t[0].arrayBuffer,byteOffset:t[0].byteOffset,byteLength:t[0].byteLength}}let a=e.json.images||[];e.images=Array(a.length).fill({})}async function mD(e,t,n){let r=e.json.buffers||[];for(let i=0;i<r.length;++i){let a=r[i];if(a.uri){let{fetch:r}=n;G(r);let o=uT(a.uri,t,n),s=await(await n?.fetch?.(o))?.arrayBuffer?.();e.buffers[i]={arrayBuffer:s,byteOffset:0,byteLength:s.byteLength},delete a.uri}else e.buffers[i]===null&&(e.buffers[i]={arrayBuffer:new ArrayBuffer(a.byteLength),byteOffset:0,byteLength:a.byteLength})}}async function hD(e,t,n){let r=gD(e),i=e.json.images||[],a=[];for(let o of r)a.push(_D(e,i[o],o,t,n));return await Promise.all(a)}function gD(e){let t=new Set,n=e.json.textures||[];for(let e of n)e.source!==void 0&&t.add(e.source);return Array.from(t).sort()}async function _D(e,t,n,r,i){let a;if(t.uri&&!t.hasOwnProperty(`bufferView`)){let e=uT(t.uri,r,i),{fetch:n}=i;a=await(await n(e)).arrayBuffer(),t.bufferView={data:a}}if(Number.isFinite(t.bufferView)){let n=NS(e.json,e.buffers,t.bufferView);a=yx(n.buffer,n.byteOffset,n.byteLength)}G(a,`glTF image has no data`);let o=dD(r,t.mimeType),s=await qb(a,[lS,Kw],o,i);s&&s[0]&&(s={compressed:!0,mipmaps:!1,width:s[0].width,height:s[0].height,data:s[0]}),e.images=e.images||[],e.images[n]=s}var vD={dataType:null,batchType:null,name:`glTF`,id:`gltf`,module:`gltf`,version:rw,extensions:[`gltf`,`glb`],mimeTypes:[`model/gltf+json`,`model/gltf-binary`],text:!0,binary:!0,tests:[`glTF`],parse:yD,options:{gltf:{normalize:!0,loadBuffers:!0,loadImages:!0,decompressMeshes:!0}}};async function yD(e,t={},n){let r={...vD.options,...t};return r.gltf={...vD.options.gltf,...r.gltf},await fD({},e,t?.glb?.byteOffset||0,r,n)}var bD={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},xD={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},Y={TEXTURE_MAG_FILTER:10240,TEXTURE_MIN_FILTER:10241,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,REPEAT:10497,LINEAR:9729,NEAREST_MIPMAP_LINEAR:9986},SD={magFilter:Y.TEXTURE_MAG_FILTER,minFilter:Y.TEXTURE_MIN_FILTER,wrapS:Y.TEXTURE_WRAP_S,wrapT:Y.TEXTURE_WRAP_T},CD={[Y.TEXTURE_MAG_FILTER]:Y.LINEAR,[Y.TEXTURE_MIN_FILTER]:Y.NEAREST_MIPMAP_LINEAR,[Y.TEXTURE_WRAP_S]:Y.REPEAT,[Y.TEXTURE_WRAP_T]:Y.REPEAT};function wD(){return{id:`default-sampler`,parameters:CD}}function TD(e){return xD[e]}function ED(e){return bD[e]}var DD=class{baseUri=``;jsonUnprocessed;json;buffers=[];images=[];postProcess(e,t={}){let{json:n,buffers:r=[],images:i=[]}=e,{baseUri:a=``}=e;return G(n),this.baseUri=a,this.buffers=r,this.images=i,this.jsonUnprocessed=n,this.json=this._resolveTree(e.json,t),this.json}_resolveTree(e,t={}){let n={...e};return this.json=n,e.bufferViews&&(n.bufferViews=e.bufferViews.map((e,t)=>this._resolveBufferView(e,t))),e.images&&(n.images=e.images.map((e,t)=>this._resolveImage(e,t))),e.samplers&&(n.samplers=e.samplers.map((e,t)=>this._resolveSampler(e,t))),e.textures&&(n.textures=e.textures.map((e,t)=>this._resolveTexture(e,t))),e.accessors&&(n.accessors=e.accessors.map((e,t)=>this._resolveAccessor(e,t))),e.materials&&(n.materials=e.materials.map((e,t)=>this._resolveMaterial(e,t))),e.meshes&&(n.meshes=e.meshes.map((e,t)=>this._resolveMesh(e,t))),e.nodes&&(n.nodes=e.nodes.map((e,t)=>this._resolveNode(e,t)),n.nodes=n.nodes.map((e,t)=>this._resolveNodeChildren(e))),e.skins&&(n.skins=e.skins.map((e,t)=>this._resolveSkin(e,t))),e.scenes&&(n.scenes=e.scenes.map((e,t)=>this._resolveScene(e,t))),typeof this.json.scene==`number`&&n.scenes&&(n.scene=n.scenes[this.json.scene]),n}getScene(e){return this._get(this.json.scenes,e)}getNode(e){return this._get(this.json.nodes,e)}getSkin(e){return this._get(this.json.skins,e)}getMesh(e){return this._get(this.json.meshes,e)}getMaterial(e){return this._get(this.json.materials,e)}getAccessor(e){return this._get(this.json.accessors,e)}getCamera(e){return this._get(this.json.cameras,e)}getTexture(e){return this._get(this.json.textures,e)}getSampler(e){return this._get(this.json.samplers,e)}getImage(e){return this._get(this.json.images,e)}getBufferView(e){return this._get(this.json.bufferViews,e)}getBuffer(e){return this._get(this.json.buffers,e)}_get(e,t){if(typeof t==`object`)return t;let n=e&&e[t];return n||console.warn(`glTF file error: Could not find ${e}[${t}]`),n}_resolveScene(e,t){return{...e,id:e.id||`scene-${t}`,nodes:(e.nodes||[]).map(e=>this.getNode(e))}}_resolveNode(e,t){let n={...e,id:e?.id||`node-${t}`};return e.mesh!==void 0&&(n.mesh=this.getMesh(e.mesh)),e.camera!==void 0&&(n.camera=this.getCamera(e.camera)),e.skin!==void 0&&(n.skin=this.getSkin(e.skin)),e.meshes!==void 0&&e.meshes.length&&(n.mesh=e.meshes.reduce((e,t)=>{let n=this.getMesh(t);return e.id=n.id,e.primitives=e.primitives.concat(n.primitives),e},{primitives:[]})),n}_resolveNodeChildren(e){return e.children&&=e.children.map(e=>this.getNode(e)),e}_resolveSkin(e,t){let n=typeof e.inverseBindMatrices==`number`?this.getAccessor(e.inverseBindMatrices):void 0;return{...e,id:e.id||`skin-${t}`,inverseBindMatrices:n}}_resolveMesh(e,t){let n={...e,id:e.id||`mesh-${t}`,primitives:[]};return e.primitives&&(n.primitives=e.primitives.map((e,t)=>{let r={...e,attributes:{},indices:void 0,material:void 0},i=e.attributes;for(let e in i)r.attributes[e]=this.getAccessor(i[e]);return e.indices!==void 0&&(r.indices=this.getAccessor(e.indices)),e.material!==void 0&&(r.material=this.getMaterial(e.material)),OD(r,n.id,t)})),n}_resolveMaterial(e,t){let n={...e,id:e.id||`material-${t}`};if(n.normalTexture&&(n.normalTexture={...n.normalTexture},n.normalTexture.texture=this.getTexture(n.normalTexture.index)),n.occlusionTexture&&(n.occlusionTexture={...n.occlusionTexture},n.occlusionTexture.texture=this.getTexture(n.occlusionTexture.index)),n.emissiveTexture&&(n.emissiveTexture={...n.emissiveTexture},n.emissiveTexture.texture=this.getTexture(n.emissiveTexture.index)),n.emissiveFactor||=n.emissiveTexture?[1,1,1]:[0,0,0],n.pbrMetallicRoughness){n.pbrMetallicRoughness={...n.pbrMetallicRoughness};let e=n.pbrMetallicRoughness;e.baseColorTexture&&(e.baseColorTexture={...e.baseColorTexture},e.baseColorTexture.texture=this.getTexture(e.baseColorTexture.index)),e.metallicRoughnessTexture&&(e.metallicRoughnessTexture={...e.metallicRoughnessTexture},e.metallicRoughnessTexture.texture=this.getTexture(e.metallicRoughnessTexture.index))}return n}_resolveAccessor(e,t){let n=TD(e.componentType),r=ED(e.type),i=n*r,a={...e,id:e.id||`accessor-${t}`,bytesPerComponent:n,components:r,bytesPerElement:i,value:void 0,bufferView:void 0,sparse:void 0};if(e.bufferView!==void 0&&(a.bufferView=this.getBufferView(e.bufferView)),a.bufferView){let e=a.bufferView.buffer,{ArrayType:t,byteLength:n}=MS(a,a.bufferView),r=(a.bufferView.byteOffset||0)+(a.byteOffset||0)+e.byteOffset,i=Cx(e.arrayBuffer,r,n);a.bufferView.byteStride&&(i=this._getValueFromInterleavedBuffer(e,r,a.bufferView.byteStride,a.bytesPerElement,a.count)),a.value=new t(i)}else{let{ArrayType:e}=MS(a,{byteLength:a.count*a.bytesPerElement});a.value=new e(a.count*a.components)}return e.sparse&&this._applySparseAccessor(a,e.sparse),a}_applySparseAccessor(e,t){let n=kD(t.indices.componentType),r=this._getTypedArrayFromBufferView(n,this.getBufferView(t.indices.bufferView),t.indices.byteOffset||0,t.count),i=e.value.constructor,a=this._getTypedArrayFromBufferView(i,this.getBufferView(t.values.bufferView),t.values.byteOffset||0,t.count*e.components);for(let n=0;n<t.count;n++){let t=Number(r[n]);G(Number.isInteger(t)&&t>=0&&t<e.count,`glTF sparse accessor index is out of bounds`);for(let r=0;r<e.components;r++){let i=t*e.components+r,o=n*e.components+r;Reflect.set(e.value,i,a[o])}}}_getTypedArrayFromBufferView(e,t,n,r){let i=r*e.BYTES_PER_ELEMENT;G(n+i<=t.byteLength,`glTF sparse accessor data exceeds its buffer view`);let a=t.buffer,o=a.byteOffset+(t.byteOffset||0)+n;return new e(Cx(a.arrayBuffer,o,i))}_getValueFromInterleavedBuffer(e,t,n,r,i){let a=new Uint8Array(i*r);for(let o=0;o<i;o++){let i=t+o*n;a.set(new Uint8Array(e.arrayBuffer.slice(i,i+r)),o*r)}return a.buffer}_resolveTexture(e,t){return{...e,id:e.id||`texture-${t}`,sampler:typeof e.sampler==`number`?this.getSampler(e.sampler):wD(),source:typeof e.source==`number`?this.getImage(e.source):void 0}}_resolveSampler(e,t){let n={id:e.id||`sampler-${t}`,...e,parameters:{}};for(let e in n){let t=this._enumSamplerParameter(e);t!==void 0&&(n.parameters[t]=n[e])}return n}_enumSamplerParameter(e){return SD[e]}_resolveImage(e,t){let n={...e,id:e.id||`image-${t}`,image:null,bufferView:e.bufferView===void 0?void 0:this.getBufferView(e.bufferView)},r=this.images[t];return r&&(n.image=r),n}_resolveBufferView(e,t){let n=e.buffer,r=this.buffers[n].arrayBuffer,i=this.buffers[n].byteOffset||0;return e.byteOffset&&(i+=e.byteOffset),{id:`bufferView-${t}`,...e,buffer:this.buffers[n],data:new Uint8Array(r,i,e.byteLength)}}_resolveCamera(e,t){let n={...e,id:e.id||`camera-${t}`};return n.perspective,n.orthographic,n}};function OD(e,t,n){if(e.mode!==2&&e.mode!==6)return e;let r=e.indices?.value,i=e.indices?.count??AD(e),a=jD(r,i),o=a<=65535?Uint16Array:Uint32Array,s=e.mode===2?PD(r,i,o):FD(r,i,o);return e.mode=e.mode===2?1:4,e.indices={id:`${t}-primitive-${n}-portable-indices`,components:1,bytesPerComponent:o.BYTES_PER_ELEMENT,bytesPerElement:o.BYTES_PER_ELEMENT,componentType:o===Uint16Array?5123:5125,normalized:!1,count:s.length,type:`SCALAR`,min:s.length?[MD(s)]:void 0,max:s.length?[a]:void 0,value:s},e}function kD(e){switch(e){case 5121:return Uint8Array;case 5123:return Uint16Array;case 5125:return Uint32Array;default:throw Error(`Invalid glTF sparse index component type ${e}`)}}function AD(e){let t=Object.values(e.attributes)[0];return G(t,`glTF primitive must define at least one attribute`),t.count}function jD(e,t){if(!e)return Math.max(0,t-1);let n=0;for(let r=0;r<t;r++)n=Math.max(n,Number(e[r]));return n}function MD(e){let t=1/0;for(let n of e)t=Math.min(t,n);return t}function ND(e,t){return e?Number(e[t]):t}function PD(e,t,n){if(t<2)return new n(0);let r=new n(t*2);for(let n=0;n<t;n++)r[n*2]=ND(e,n),r[n*2+1]=ND(e,(n+1)%t);return r}function FD(e,t,n){let r=Math.max(0,t-2),i=new n(r*3);for(let t=0;t<r;t++)i[t*3]=ND(e,0),i[t*3+1]=ND(e,t+1),i[t*3+2]=ND(e,t+2);return i}function ID(e,t){return new DD().postProcess(e,t)}async function LD(e){let t=[];return e.scenes.forEach(e=>{e.traverse(e=>{})}),await RD(()=>t.some(e=>!e.loaded))}async function RD(e){for(;e();)await new Promise(e=>requestAnimationFrame(e))}var zD=`struct ScenegraphUniforms {
  sizeScale: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  sceneModelMatrix: mat4x4<f32>,
  composeModelMatrix: f32,
};

@group(0) @binding(auto)
var<uniform> scenegraph: ScenegraphUniforms;
`,BD=`layout(std140) uniform scenegraphUniforms {
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  mat4 sceneModelMatrix;
  float composeModelMatrix;
} scenegraph;
`,VD={name:`scenegraph`,source:zD,vs:BD,fs:BD,uniformTypes:{sizeScale:`f32`,sizeMinPixels:`f32`,sizeMaxPixels:`f32`,sceneModelMatrix:`mat4x4<f32>`,composeModelMatrix:`f32`}},HD=`#version 300 es
#define SHADER_NAME scenegraph-layer-vertex-shader
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
in vec3 instanceModelMatrixCol0;
in vec3 instanceModelMatrixCol1;
in vec3 instanceModelMatrixCol2;
in vec3 instanceTranslation;
in vec3 positions;
#ifdef HAS_UV
in vec2 texCoords;
#endif
#ifdef LIGHTING_PBR
#ifdef HAS_NORMALS
in vec3 normals;
#endif
#endif
out vec4 vColor;
#ifndef LIGHTING_PBR
#ifdef HAS_UV
out vec2 vTEXCOORD_0;
#endif
#endif
void main(void) {
#if defined(HAS_UV) && !defined(LIGHTING_PBR)
vTEXCOORD_0 = texCoords;
geometry.uv = texCoords;
#endif
geometry.worldPosition = instancePositions;
geometry.pickingColor = picking_getPickingColorFromInstanceID();
mat3 instanceModelMatrix = mat3(instanceModelMatrixCol0, instanceModelMatrixCol1, instanceModelMatrixCol2);
vec3 normal = vec3(0.0, 0.0, 1.0);
#ifdef LIGHTING_PBR
#ifdef HAS_NORMALS
normal = instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4(normals, 0.0)).xyz;
#endif
#endif
float originalSize = project_size_to_pixel(scenegraph.sizeScale);
float clampedSize = clamp(originalSize, scenegraph.sizeMinPixels, scenegraph.sizeMaxPixels);
float sizeRatio = originalSize == 0.0 ? 0.0 : clampedSize / originalSize;
vec3 pos = (instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4(positions, 1.0)).xyz) * scenegraph.sizeScale * sizeRatio + instanceTranslation;
if(scenegraph.composeModelMatrix > 0.5) {
DECKGL_FILTER_SIZE(pos, geometry);
geometry.normal = project_normal(normal);
geometry.worldPosition += pos;
gl_Position = project_position_to_clipspace(pos + instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
}
else {
pos = project_size(pos);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, pos, geometry.position);
geometry.normal = project_normal(normal);
}
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
#ifdef LIGHTING_PBR
pbr_vPosition = geometry.position.xyz;
#ifdef HAS_NORMALS
pbr_vNormal = geometry.normal;
#endif
#ifdef HAS_UV
pbr_vUV0 = texCoords;
#else
pbr_vUV0 = vec2(0., 0.);
#endif
pbr_vUV1 = vec2(0., 0.);
geometry.uv = pbr_vUV0;
#endif
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,UD=`#version 300 es
#define SHADER_NAME scenegraph-layer-fragment-shader
in vec4 vColor;
out vec4 fragColor;
#ifndef LIGHTING_PBR
#if defined(HAS_UV) && defined(HAS_BASECOLORMAP)
in vec2 vTEXCOORD_0;
uniform sampler2D pbr_baseColorSampler;
#endif
#endif
void main(void) {
#ifdef LIGHTING_PBR
fragColor = pbr_filterColor(vColor);
geometry.uv = pbr_vUV0;
#else
#if defined(HAS_UV) && defined(HAS_BASECOLORMAP)
fragColor = vColor * texture(pbr_baseColorSampler, vTEXCOORD_0);
geometry.uv = vTEXCOORD_0;
#else
fragColor = vColor;
#endif
#endif
fragColor.a *= layer.opacity;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,WD=`struct VertexInputs {
  @location(0) positions: vec3<f32>,
#ifdef HAS_NORMALS
  @location(1) normals: vec3<f32>,
#endif
#ifdef HAS_UV
  @location(3) texCoords: vec2<f32>,
#endif
  @location(6) instancePositions: vec3<f32>,
  @location(7) instancePositions64Low: vec3<f32>,
  @location(8) instanceColors: vec4<f32>,
  @location(10) instanceModelMatrixCol0: vec3<f32>,
  @location(11) instanceModelMatrixCol1: vec3<f32>,
  @location(12) instanceModelMatrixCol2: vec3<f32>,
  @location(13) instanceTranslation: vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) vTexCoord: vec2<f32>,
  @location(2) pbrPosition: vec3<f32>,
  @location(3) pbrUV: vec2<f32>,
  @location(4) pbrNormal: vec3<f32>,
  @location(5) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> FragmentInputs {
  var outputs: FragmentInputs;

  geometry.worldPosition = inputs.instancePositions;
  geometry.pickingColor = picking_getPickingColorFromIndex(instanceIndex);

  var vertexPosition = inputs.positions;
  var texCoord = vec2<f32>(0.0, 0.0);
  var normal = vec3<f32>(0.0, 0.0, 1.0);

#ifdef HAS_UV
  texCoord = inputs.texCoords;
#endif
#ifdef HAS_NORMALS
  normal = inputs.normals;
#endif

  geometry.uv = texCoord;

  let instanceModelMatrix = mat3x3<f32>(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2
  );

  let scenePosition = (scenegraph.sceneModelMatrix * vec4<f32>(vertexPosition, 1.0)).xyz;
  let worldNormal = instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4<f32>(normal, 0.0)).xyz;

  let originalSize = project_meter_size_to_pixel(scenegraph.sizeScale);
  let clampedSize = clamp(originalSize, scenegraph.sizeMinPixels, scenegraph.sizeMaxPixels);
  let sizeRatio = select(0.0, clampedSize / originalSize, originalSize > 0.0);

  let pos =
    (instanceModelMatrix * scenePosition) * scenegraph.sizeScale * sizeRatio +
    inputs.instanceTranslation;

  if (scenegraph.composeModelMatrix > 0.5) {
    geometry.normal = project_normal(worldNormal);
    geometry.worldPosition = inputs.instancePositions + pos;
    geometry.position = vec4<f32>(
      project_position_vec3_f64(inputs.instancePositions + pos, inputs.instancePositions64Low),
      1.0
    );
  } else {
    let sizeAdjustedPos = project_size_vec3(pos);
    // Scenegraph offsets are east/north/up in globe mode. Use project32's helper so it can
    // rotate the offset onto the local tangent plane before producing the common position.
    let projectResult = project_position_to_clipspace_and_commonspace(
      inputs.instancePositions,
      inputs.instancePositions64Low,
      sizeAdjustedPos
    );
    geometry.position = projectResult.commonPosition;
    geometry.normal = project_normal(worldNormal);
  }

  outputs.position = project_common_position_to_clipspace(geometry.position);
  outputs.vColor = inputs.instanceColors;
  outputs.vTexCoord = texCoord;
  outputs.pbrPosition = geometry.position.xyz;
  outputs.pbrUV = texCoord;
  outputs.pbrNormal = geometry.normal;
  outputs.pickingColor = geometry.pickingColor;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  fragmentGeometry.uv = inputs.vTexCoord;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inputs.pickingColor)) {
      discard;
    }
    return vec4<f32>(inputs.pickingColor, 1.0);
  }

  var fragColor = inputs.vColor;

#ifdef LIGHTING_PBR
  fragmentInputs.pbr_vPosition = inputs.pbrPosition;
  // scenegraphPbrMaterial uses the indexed UV fields from the current PBR module.
  fragmentInputs.pbr_vUV0 = inputs.pbrUV;
  fragmentInputs.pbr_vUV1 = vec2<f32>(0.0);
  fragmentInputs.pbr_vNormal = inputs.pbrNormal;
  // Vertex color is part of the material base color and must be applied before lighting.
  fragColor = pbr_filterColor(fragColor);
#else
#ifdef HAS_BASECOLORMAP
  fragColor =
    fragColor *
    textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, inputs.vTexCoord);
#endif
#endif

  fragColor.a *= layer.opacity;

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inputs.pickingColor - highlightedObjectColor))) {
      let highlightAlpha = picking.highlightColor.a;
      let blendedAlpha = highlightAlpha + fragColor.a * (1.0 - highlightAlpha);
      if (blendedAlpha > 0.0) {
        let highlightRatio = highlightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highlightRatio),
          blendedAlpha
        );
      }
    }
  }

  return deckgl_premultiplied_alpha(fragColor);
}
`,GD=Xn.source.replace(/fn pbr_setPositionNormalTangentUV\([\s\S]*?\n}\n/,`fn pbr_setPositionNormalTangentUV(position: vec4f, normal: vec4f, tangent: vec4f, uv: vec2f)
{
  fragmentInputs.pbr_vPosition = position.xyz;
  fragmentInputs.pbr_vNormal = normal.xyz;
  fragmentInputs.pbr_vTBN = mat3x3f(
    vec3f(1.0, 0.0, 0.0),
    vec3f(0.0, 1.0, 0.0),
    vec3f(0.0, 0.0, 1.0)
  );
  fragmentInputs.pbr_vUV0 = uv;
  fragmentInputs.pbr_vUV1 = uv;
}
`).replace(/pbrProjection\.camera/g,`project.cameraPosition`),KD={...Xn,dependencies:[An],source:GD},qD=[255,255,255,255],JD={scenegraph:{type:`object`,value:null,async:!0},getScene:e=>e&&e.scenes?typeof e.scene==`object`?e.scene:e.scenes[e.scene||0]:e,getAnimator:e=>e&&e.animator,_animations:null,onFirstDraw:{type:`function`,value:()=>{}},sizeScale:{type:`number`,value:1,min:0},sizeMinPixels:{type:`number`,min:0,value:0},sizeMaxPixels:{type:`number`,min:0,value:2**53-1},getPosition:{type:`accessor`,value:e=>e.position},getColor:{type:`accessor`,value:qD},_lighting:`flat`,_imageBasedLightingEnvironment:void 0,getOrientation:{type:`accessor`,value:[0,0,0]},getScale:{type:`accessor`,value:[1,1,1]},getTranslation:{type:`accessor`,value:[0,0,0]},getTransformMatrix:{type:`accessor`,value:[]},loaders:[vD]},YD=class extends kg{getShaders(){let e={},t,n=this.context.device?.type===`webgpu`;this.props._lighting===`pbr`?(t=n?KD:Xn,e.LIGHTING_PBR=1):t=n?KD:{name:`pbrMaterial`};let r=[Hl,Os,Uu,VD,t];return super.getShaders({defines:e,vs:HD,fs:UD,source:WD,modules:r})}initializeState(){let e=this.getAttributeManager(),t=this.context.device.type!==`webgpu`;e.addInstanced({instancePositions:{size:3,type:`float64`,fp64:this.use64bitPositions(),accessor:`getPosition`,transition:t},instanceColors:{type:`unorm8`,size:this.props.colorFormat.length,accessor:`getColor`,defaultValue:qD,transition:t},instanceModelMatrix:qg})}updateState(e){super.updateState(e);let{props:t,oldProps:n}=e;t.scenegraph===n.scenegraph?t._animations!==n._animations&&this._applyAnimationsProp(this.state.animator,t._animations):this._updateScenegraph()}finalizeState(e){super.finalizeState(e),this._destroyScenegraphAssets()}get isLoaded(){return!!(this.state?.scenegraph&&super.isLoaded)}_updateScenegraph(){let e=this.props,{device:t}=this.context,n=null;if(e.scenegraph instanceof Dr)n={scenes:[e.scenegraph]};else if(e.scenegraph&&typeof e.scenegraph==`object`){let r=e.scenegraph,i=gy(t,r.json?ID(r):r,this._getModelOptions());n=i,LD(i).then(()=>this.setNeedsRedraw()).catch(e=>{this.raiseError(e,`loading glTF`)})}let r={layer:this,device:this.context.device},i=e.getScene(n,r),a=e.getAnimator(n,r);if(i instanceof jr){this._destroyScenegraphAssets(),this._applyAnimationsProp(a,e._animations);let t=[];i.traverse(e=>{e instanceof Mr&&t.push(e.model)}),this.setState({scenegraph:i,animator:a,materials:n?.materials||null,models:t,firstDrawSignaled:!1}),this.getAttributeManager().invalidateAll()}else i!==null&&j.warn(`invalid scenegraph:`,i)()}_destroyScenegraphAssets(){this.state.scenegraph?.destroy(),this.state.materials?.forEach(e=>e.destroy()),this.state.scenegraph=null,this.state.animator=null,this.state.materials=null,this.state.models=[]}_applyAnimationsProp(e,t){if(!e||!t)return;let n=e.getAnimations();Object.keys(t).sort().forEach(e=>{let r=t[e];if(e===`*`)n.forEach(e=>{Object.assign(e,r)});else if(Number.isFinite(Number(e))){let t=Number(e);t>=0&&t<n.length?Object.assign(n[t],r):j.warn(`animation ${e} not found`)()}else{let t=n.find(({animation:t})=>t.name===e);t?Object.assign(t,r):j.warn(`animation ${e} not found`)()}})}_getModelOptions(){let{_imageBasedLightingEnvironment:e}=this.props,t;e&&(t=typeof e==`function`?e({device:this.context.device,gl:this.context.gl,layer:this}):e);let n=this.context.device.type===`webgpu`?{depthWriteEnabled:!0,depthCompare:`less-equal`}:void 0;return{imageBasedLightingEnvironment:t,modelOptions:{id:this.props.id,isInstanced:!0,bufferLayout:this.getAttributeManager().getBufferLayouts(),parameters:n,...this.getShaders()},useTangents:!1}}draw({context:e}){if(!this.state.scenegraph)return;this.props._animations&&this.state.animator&&(this.state.animator.setTime(e.timeline.getTime()),this.setNeedsRedraw());let{viewport:t,renderPass:n}=this.context,{sizeScale:r,sizeMinPixels:i,sizeMaxPixels:a,coordinateSystem:o}=this.props,s={camera:t.cameraPosition},c=this.getNumInstances();this.state.scenegraph.traverse((e,{worldMatrix:l})=>{if(e instanceof Mr){let{model:u}=e;u.setInstanceCount(c);let d={sizeScale:r,sizeMinPixels:i,sizeMaxPixels:a,composeModelMatrix:Jg(t,o)?1:0,sceneModelMatrix:l};u.shaderInputs.setProps({pbrProjection:s,scenegraph:d}),u.draw(n)}}),this.state.firstDrawSignaled||(this.state.firstDrawSignaled=!0,this.props.onFirstDraw?.())}};YD.defaultProps=JD,YD.layerName=`ScenegraphLayer`;var XD=`layout(std140) uniform iconUniforms {
  float sizeScale;
  vec2 iconsTextureDim;
  float sizeBasis;
  float sizeMinPixels;
  float sizeMaxPixels;
  bool billboard;
  highp int sizeUnits;
  float alphaCutoff;
} icon;
`,ZD={name:`icon`,vs:XD,fs:XD,uniformTypes:{sizeScale:`f32`,iconsTextureDim:`vec2<f32>`,sizeBasis:`f32`,sizeMinPixels:`f32`,sizeMaxPixels:`f32`,billboard:`f32`,sizeUnits:`i32`,alphaCutoff:`f32`}},QD=`#version 300 es
#define SHADER_NAME icon-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceSizes;
in float instanceAngles;
in vec4 instanceColors;
#ifdef USE_ROW_INDEXES
in float rowIndexes;
#endif
in vec4 instanceIconFrames;
in float instanceColorModes;
in vec2 instanceOffsets;
in vec2 instancePixelOffset;
out float vColorMode;
out vec4 vColor;
out vec2 vTextureCoords;
out vec2 uv;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = angle * PI / 180.0;
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
#ifdef USE_ROW_INDEXES
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
#else
geometry.pickingColor = picking_getPickingColorFromInstanceID();
#endif
uv = positions;
vec2 iconSize = instanceIconFrames.zw;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * icon.sizeScale, icon.sizeUnits),
icon.sizeMinPixels, icon.sizeMaxPixels
);
float iconConstraint = icon.sizeBasis == 0.0 ? iconSize.x : iconSize.y;
float instanceScale = iconConstraint == 0.0 ? 0.0 : sizePixels / iconConstraint;
vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
pixelOffset += instancePixelOffset;
pixelOffset.y *= -1.0;
if (icon.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
DECKGL_FILTER_SIZE(offset_common, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vTextureCoords = mix(
instanceIconFrames.xy,
instanceIconFrames.xy + iconSize,
(positions.xy + 1.0) / 2.0
) / icon.iconsTextureDim;
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
vColorMode = instanceColorModes;
}
`,$D=`#version 300 es
#define SHADER_NAME icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in float vColorMode;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
vec4 texColor = texture(iconsTexture, vTextureCoords);
vec3 color = mix(texColor.rgb, vColor.rgb, vColorMode);
float a = texColor.a * layer.opacity * vColor.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color, a);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,eO=`struct IconUniforms {
  sizeScale: f32,
  iconsTextureDim: vec2<f32>,
  sizeBasis: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  billboard: i32,
  sizeUnits: i32,
  alphaCutoff: f32
};

@group(0) @binding(auto) var<uniform> icon: IconUniforms;
@group(0) @binding(auto) var iconsTexture : texture_2d<f32>;
@group(0) @binding(auto) var iconsTextureSampler : sampler;

fn rotate_by_angle(vertex: vec2<f32>, angle_deg: f32) -> vec2<f32> {
  let angle_radian = angle_deg * PI / 180.0;
  let c = cos(angle_radian);
  let s = sin(angle_radian);
  let rotation = mat2x2<f32>(vec2<f32>(c, s), vec2<f32>(-s, c));
  return rotation * vertex;
}

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @location(0) positions: vec2<f32>,

  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceSizes: f32,
  @location(4) instanceAngles: f32,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instanceIconFrames: vec4<f32>,
  @location(7) instanceColorModes: f32,
  @location(8) instanceOffsets: vec2<f32>,
  @location(9) instancePixelOffset: vec2<f32>,
  PICKING_COLOR_ATTRIBUTE
};

struct Varyings {
  @builtin(position) position: vec4<f32>,

  @location(0) vColorMode: f32,
  @location(1) vColor: vec4<f32>,
  @location(2) vTextureCoords: vec2<f32>,
  @location(3) uv: vec2<f32>,
  @location(4) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(inp: Attributes) -> Varyings {
  // write geometry fields used by filters + FS
  geometry.worldPosition = inp.instancePositions;
  geometry.uv = inp.positions;
  geometry.pickingColor = PICKING_COLOR_VALUE;

  var outp: Varyings;
  outp.uv = inp.positions;

  let iconSize = inp.instanceIconFrames.zw;

  // convert size in meters to pixels, then clamp
  let sizePixels = clamp(
    project_unit_size_to_pixel(inp.instanceSizes * icon.sizeScale, icon.sizeUnits),
    icon.sizeMinPixels, icon.sizeMaxPixels
  );

  // scale icon height to match instanceSize
  let iconConstraint = select(iconSize.y, iconSize.x, icon.sizeBasis == 0.0);
  let instanceScale = select(sizePixels / iconConstraint, 0.0, iconConstraint == 0.0);

  // scale and rotate vertex in "pixel" units; then add per-instance pixel offset
  var pixelOffset = inp.positions / 2.0 * iconSize + inp.instanceOffsets;
  pixelOffset = rotate_by_angle(pixelOffset, inp.instanceAngles) * instanceScale;
  pixelOffset = pixelOffset + inp.instancePixelOffset;
  pixelOffset.y = pixelOffset.y * -1.0;

  if (icon.billboard != 0) {
    var pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0)); // TODO, &geometry.position);
    // DECKGL_FILTER_GL_POSITION(pos, geometry);

    var offset = vec3<f32>(pixelOffset, 0.0);
    // DECKGL_FILTER_SIZE(offset, geometry);
    let clipOffset = project_pixel_size_to_clipspace(offset.xy);
    pos = vec4<f32>(pos.x + clipOffset.x, pos.y + clipOffset.y, pos.z, pos.w);
    outp.position = pos;
  } else {
    var offset_common = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    // DECKGL_FILTER_SIZE(offset_common, geometry);
    var pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, offset_common); // TODO, &geometry.position);
    // DECKGL_FILTER_GL_POSITION(pos, geometry);
    outp.position = pos;
  }

  let uvMix = (inp.positions.xy + vec2<f32>(1.0, 1.0)) * 0.5;
  outp.vTextureCoords = mix(inp.instanceIconFrames.xy, inp.instanceIconFrames.xy + iconSize, uvMix) / icon.iconsTextureDim;

  outp.vColor = inp.instanceColors;
  // DECKGL_FILTER_COLOR(outp.vColor, geometry);

  outp.vColorMode = inp.instanceColorModes;
  outp.pickingColor = geometry.pickingColor;

  return outp;
}

@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  // expose to deck.gl filter hooks
  geometry.uv = inp.uv;

  let texColor = textureSample(iconsTexture, iconsTextureSampler, inp.vTextureCoords);

  // if colorMode == 0, use pixel color from the texture
  // if colorMode == 1 (or picking), use texture as transparency mask
  let rgb = mix(texColor.rgb, inp.vColor.rgb, inp.vColorMode);
  let a = texColor.a * layer.opacity * inp.vColor.a;

  if (a < icon.alphaCutoff) {
    discard;
  }

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  var fragColor = deckgl_premultiplied_alpha(vec4<f32>(rgb, a));

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inp.pickingColor - highlightedObjectColor))) {
      let highLightAlpha = picking.highlightColor.a;
      let blendedAlpha = highLightAlpha + fragColor.a * (1.0 - highLightAlpha);
      if (blendedAlpha > 0.0) {
        let highLightRatio = highLightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highLightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  return fragColor;
}
`;function tO(e){return eO.replace(`PICKING_COLOR_ATTRIBUTE`,e?`@location(10) rowIndexes: u32,`:``).replace(`PICKING_COLOR_VALUE`,e?`picking_getPickingColorFromIndex(inp.rowIndexes)`:`picking_getPickingColorFromIndex(inp.instanceIndex)`)}var nO=class extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response},rO=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,iO=/^([-\w.]+\/[-\w.+]+)/;function aO(e,t){return e.toLowerCase()===t.toLowerCase()}function oO(e){let t=iO.exec(e);return t?t[1]:e}function sO(e){let t=rO.exec(e);return t?t[1]:``}var cO=/\?.*/;function lO(e){let t=e.match(cO);return t&&t[0]}function uO(e){return e.replace(cO,``)}function dO(e){if(e.length<50)return e;let t=e.slice(e.length-15);return`${e.substr(0,32)}...${t}`}function fO(e){return Ae(e)?e.url:We(e)?(`name`in e?e.name:``)||``:typeof e==`string`?e:``}function pO(e){if(Ae(e)){let t=e.headers.get(`content-type`)||``,n=uO(e.url);return oO(t)||sO(n)}return We(e)?e.type||``:typeof e==`string`?sO(e):``}function mO(e){return Ae(e)?e.headers[`content-length`]||-1:We(e)?e.size:typeof e==`string`?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}async function hO(e){if(Ae(e))return e;let t={},n=mO(e);n>=0&&(t[`content-length`]=String(n));let r=fO(e),i=pO(e);i&&(t[`content-type`]=i);let a=await vO(e);a&&(t[`x-first-bytes`]=a),typeof e==`string`&&(e=new TextEncoder().encode(e));let o=new Response(e,{headers:t});return Object.defineProperty(o,`url`,{value:r}),o}async function gO(e){if(!e.ok)throw await _O(e)}async function _O(e){let t=dO(e.url),n=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;n=n.length>100?`${n.slice(0,100)}...`:n;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get(`Content-Type`);r.reason=!e.bodyUsed&&t?.includes(`application/json`)?await e.json():await e.text()}catch{}return new nO(n,r)}async function vO(e){if(typeof e==`string`)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let n=new FileReader;n.onload=t=>e(t?.target?.result),n.readAsDataURL(t)})}return e instanceof ArrayBuffer?`data:base64,${Ke(e.slice(0,5))}`:null}function yO(e){return!bO(e)&&!xO(e)}function bO(e){return e.startsWith(`http:`)||e.startsWith(`https:`)}function xO(e){return e.startsWith(`data:`)}async function SO(e,t){if(typeof e==`string`){let n=zb(e);return yO(n)&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(n,t):await fetch(n,t)}return await hO(e)}var CO=new Qe({id:`loaders.gl`}),wO=class{log(){return()=>{}}info(){return()=>{}}once(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}},TO={searchParams:void 0,core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,shape:void 0,log:new class{console;onceMessages=new Set;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}once(...e){let t=String(e[0]);return this.onceMessages.has(t)?()=>{}:(this.onceMessages.add(t),this.console.info.bind(this.console,...e))}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,subloaders:void 0,CDN:`https://unpkg.com/@loaders.gl`,worker:!0,workerThreshold:.1,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:nt,_nodeWorkers:!1,_workerType:``,limit:0,_limitMB:0,batchSize:`auto`,batchDebounceMs:0,metadata:!1,transforms:[]}},EO={baseUri:`core.baseUrl`,fetch:`core.fetch`,mimeType:`core.mimeType`,fallbackMimeType:`core.fallbackMimeType`,ignoreRegisteredLoaders:`core.ignoreRegisteredLoaders`,nothrow:`core.nothrow`,log:`core.log`,useLocalLibraries:`core.useLocalLibraries`,CDN:`core.CDN`,worker:`core.worker`,maxConcurrency:`core.maxConcurrency`,maxMobileConcurrency:`core.maxMobileConcurrency`,reuseWorkers:`core.reuseWorkers`,_nodeWorkers:`core.nodeWorkers`,_workerType:`core._workerType`,_worker:`core._workerType`,limit:`core.limit`,_limitMB:`core._limitMB`,shape:`core.shape`,batchSize:`core.batchSize`,batchDebounceMs:`core.batchDebounceMs`,metadata:`core.metadata`,transforms:`core.transforms`,throws:`nothrow`,dataType:`(no longer used)`,uri:`core.baseUrl`,method:`core.fetch.method`,headers:`core.fetch.headers`,body:`core.fetch.body`,mode:`core.fetch.mode`,credentials:`core.fetch.credentials`,cache:`core.fetch.cache`,redirect:`core.fetch.redirect`,referrer:`core.fetch.referrer`,referrerPolicy:`core.fetch.referrerPolicy`,integrity:`core.fetch.integrity`,keepalive:`core.fetch.keepalive`,signal:`core.fetch.signal`},DO=[`baseUrl`,`fetch`,`mimeType`,`fallbackMimeType`,`ignoreRegisteredLoaders`,`nothrow`,`log`,`useLocalLibraries`,`CDN`,`worker`,`workerThreshold`,`maxConcurrency`,`maxMobileConcurrency`,`reuseWorkers`,`workerTransferBufferCopy`,`_nodeWorkers`,`_workerType`,`limit`,`_limitMB`,`shape`,`batchSize`,`batchDebounceMs`,`metadata`,`transforms`];function OO(e,t){let n=t?.searchParams;if(!n||Object.keys(n).length===0||/^(?:data|blob):/i.test(e))return e;let r=e.indexOf(`#`),i=r>=0?e.slice(r):``,a=r>=0?e.slice(0,r):e,o=a.indexOf(`?`),s=o>=0?a.slice(0,o):a,c=o>=0?a.slice(o+1):``,l=new URLSearchParams(c),u=new URLSearchParams;for(let[e,t]of Object.entries(n))l.has(e)||u.set(e,String(t));let d=u.toString();return`${s}${o>=0?`?${c}`:``}${d?`${o>=0?`&`:`?`}${d}`:``}${i}`}function kO(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||={},e._state}function AO(){let e=kO();return e.globalOptions=e.globalOptions||{...TO,core:{...TO.core}},MO(e.globalOptions)}function jO(e,t,n,r){n||=[],n=Array.isArray(n)?n:[n],NO(e,n),PO(e);let i=MO(LO(t,e,r));return PO(i),i}function MO(e){let t=VO(e);HO(t);for(let e of DO)t.core&&t.core[e]!==void 0&&delete t[e];return t.core&&t.core._workerType!==void 0&&delete t._worker,t}function NO(e,t){FO(e,null,TO,EO,t);for(let n of t){let r=e&&e[n.id]||{},i=n.options&&n.options[n.id]||{},a=n.deprecatedOptions&&n.deprecatedOptions[n.id]||{};FO(r,n.id,i,a,t)}}function PO(e){let t=e.core?.workerThreshold;if(t!==void 0&&(!Number.isFinite(t)||t<0||t>1))throw Error(`core.workerThreshold must be a finite number between 0 and 1`)}function FO(e,t,n,r,i){let a=t||`Top level`,o=t?`${t}.`:``;for(let s in e){let c=!t&&Fe(e[s]),l=s===`baseUri`&&!t,u=s===`workerUrl`&&t;if(!(s in n)&&!l&&!u){if(s in r)CO.level>0&&CO.warn(`${a} loader option \'${o}${s}\' no longer supported, use \'${r[s]}\'`)();else if(!c&&CO.level>0){let e=IO(s,i);CO.warn(`${a} loader option \'${o}${s}\' not recognized. ${e}`)()}}}}function IO(e,t){let n=e.toLowerCase(),r=``;for(let i of t)for(let t in i.options){if(e===t)return`Did you mean \'${i.id}.${t}\'?`;let a=t.toLowerCase();(n.startsWith(a)||a.startsWith(n))&&(r||=`Did you mean \'${i.id}.${t}\'?`)}return r}function LO(e,t,n){let r=e.options||{},i={...r};r.core&&(i.core={...r.core}),HO(i),i.core?.log===null&&(i.core={...i.core,log:new wO}),zO(i,MO(AO()));let a=MO(t);return zO(i,a),RO(i,a,e),BO(i,n),UO(i),i}function RO(e,t,n){let r=e.core?.shape;if(r===void 0)return;let i=n.options?.[n.id];if(!Je(i)||!(`shape`in i))return;let a=AO()[n.id];if(Je(a)&&`shape`in a)return;let o=t[n.id];if(Je(o)&&`shape`in o)return;let s=e[n.id];e[n.id]={...Je(s)?s:{},shape:r}}function zO(e,t){for(let n in t)if(n in t){let r=t[n];Je(r)&&Je(e[n])?e[n]={...e[n],...t[n]}:e[n]=t[n]}}function BO(e,t){t&&e.core?.baseUrl===void 0&&(e.core||={},e.core.baseUrl=Vb(uO(t)))}function VO(e){let t={...e};return e.core&&(t.core={...e.core}),t}function HO(e){e.baseUri!==void 0&&(e.core||={},e.core.baseUrl===void 0&&(e.core.baseUrl=e.baseUri));for(let t of DO)if(e[t]!==void 0){e.core||={};let n=e.core;n[t]===void 0&&(n[t]=e[t])}let t=e._worker;t!==void 0&&(e.core||={},e.core._workerType===void 0&&(e.core._workerType=t))}function UO(e){let t=e.core;if(t)for(let n of DO)t[n]!==void 0&&(e[n]=t[n])}function WO(e){return e?(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions)):!1}function GO(e){tt(e,`null loader`),tt(WO(e),`invalid loader`);let t;return Array.isArray(e)&&(t=e[1],e=e[0],e={...e,options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}var KO=()=>{let e=kO();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function qO(){return KO()}var JO=/\.([^.]+)$/;async function YO(e,t=[],n,r){if(!$O(e))return null;let i=MO(n||{});if(i.core||={},e instanceof Response&&XO(e)){let n=ZO(await e.clone().text(),t,{...i,core:{...i.core,nothrow:!0}},r);if(n)return n}let a=ZO(e,t,{...i,core:{...i.core,nothrow:!0}},r);if(a)return a;if(We(e)&&(e=await e.slice(0,10).arrayBuffer(),a=ZO(e,t,i,r)),!a&&e instanceof Response&&XO(e)&&(a=ZO(await e.clone().text(),t,i,r)),!a&&!i.core.nothrow)throw Error(ek(e));return a}function XO(e){let t=pO(e);return!!(t&&(t.startsWith(`text/`)||t===`application/json`||t.endsWith(`+json`)))}function ZO(e,t=[],n,r){if(!$O(e))return null;let i=MO(n||{});if(i.core||={},t&&!Array.isArray(t))return GO(t);let a=[];t&&(a=a.concat(t)),i.core.ignoreRegisteredLoaders||a.push(...qO()),tk(a);let o=QO(e,a,i,r);if(!o&&!i.core.nothrow)throw Error(ek(e));return o}function QO(e,t,n,r){let i=fO(e),a=pO(e),o=uO(i)||r?.url,s=null,c=``,l=n?.core&&`type`in n.core?n.core.type:void 0;return l&&l!==`auto`&&(s=ik(t,l),c=s?`match forced by supplied source type ${l}`:``),n?.core?.mimeType&&(s=sk(t,n?.core?.mimeType),c=`match forced by supplied MIME type ${n?.core?.mimeType}`),s||=ak(t,o),c||=s?`matched source url ${o}`:``,s||=nk(t,o),c||=s?`matched url ${o}`:``,s||=sk(t,a),c||=s?`matched MIME type ${a}`:``,s||=ck(t,e),c||=s?`matched initial data ${fk(e)}`:``,!s&&We(e)&&(s=ok(t,e),c||=s?`matched source testData`:``),n?.core?.fallbackMimeType&&(s||=sk(t,n?.core?.fallbackMimeType),c||=s?`matched fallback MIME type ${a}`:``),c&&$e.log(1,`selectLoader selected ${s?.name}: ${c}.`),s}function $O(e){return!(e instanceof Response&&e.status===204)}function ek(e){let t=fO(e),n=pO(e),r=`No valid loader found (`;r+=t?`${Bb(t)}, `:`no url provided, `,r+=`MIME type: ${n?`"${n}"`:`not provided`}, `;let i=e?fk(e):``;return r+=i?` first bytes: "${i}"`:`first bytes: not available`,r+=`)`,r}function tk(e){for(let t of e)GO(t)}function nk(e,t){let n=t&&JO.exec(t),r=n&&n[1];return r?rk(e,r):null}function rk(e,t){t=t.toLowerCase();for(let n of e)for(let e of n.extensions)if(e.toLowerCase()===t)return n;return null}function ik(e,t){for(let n of e)if(Hb(n)&&n.type===t)return n;return null}function ak(e,t){if(!t)return null;for(let n of e)if(Hb(n)&&n.testURL(t))return n;return null}function ok(e,t){for(let n of e)if(Hb(n)&&n.testData?.(t))return n;return null}function sk(e,t){for(let n of e)if(n.mimeTypes?.some(e=>aO(t,e))||aO(t,`application/x.${n.id}`))return n;return null}function ck(e,t){if(!t)return null;for(let n of e)if(typeof t==`string`){if(lk(t,n))return n}else if(ArrayBuffer.isView(t)){if(uk(t.buffer,t.byteOffset,n))return n}else if(t instanceof ArrayBuffer&&uk(t,0,n))return n;return null}function lk(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}function uk(e,t,n){return(Array.isArray(n.tests)?n.tests:[n.tests]).some(r=>dk(e,t,n,r))}function dk(e,t,n,r){if(Me(r))return je(r,e,r.byteLength);switch(typeof r){case`function`:return r(Ge(e));case`string`:return r===pk(e,t,r.length);default:return!1}}function fk(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?pk(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?pk(e,0,t):``}function pk(e,t,n){if(e.byteLength<t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}var mk=256*1024;function*hk(e,t){let n=t?.chunkSize||mk,r=0,i=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,n),a=e.slice(r,r+t);r+=t,yield Ge(i.encode(a))}}var gk=256*1024;function*_k(e,t={}){let{chunkSize:n=gk}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,n),i=new ArrayBuffer(t),a=new Uint8Array(e,r,t);new Uint8Array(i).set(a),r+=t,yield i}}var vk=1024*1024;async function*yk(e,t){let n=t?.chunkSize||vk,r=0;for(;r<e.size;){let t=r+n,i=await e.slice(r,t).arrayBuffer();r=t,yield i}}function bk(e,t){return nt?xk(e,t):Sk(e,t)}async function*xk(e,t){let n=e.getReader(),r,i=!1,a=!1,o=!1;try{for(;;){let e=r||n.read();r=void 0;let o;try{o=await e}catch(e){throw a=!0,e}let{done:s,value:c}=o;if(s){i=!0;return}t?._streamReadAhead&&(r=n.read(),r.catch(()=>{})),yield Oe(c)}}catch(e){throw o=!0,e}finally{let e=!1,t;if(!i&&!a)try{await n.cancel()}catch(n){e=!0,t=n}try{n.releaseLock()}catch(n){e||(e=!0,t=n)}if(!o&&e)throw t}}async function*Sk(e,t){for await(let t of e)yield Oe(t)}function Ck(e,t){if(typeof e==`string`)return hk(e,t);if(e instanceof ArrayBuffer)return _k(e,t);if(We(e))return yk(e,t);if(Ye(e))return bk(e,t);if(Ae(e)){let n=e.body;if(!n)throw Error(`Readable stream not available on Response`);return bk(n,t)}throw Error(`makeIterator`)}var wk=`Cannot convert supplied data type`;function Tk(e,t,n){if(t.text&&typeof e==`string`)return e;if(Le(e)&&(e=e.buffer),Me(e)){let n=He(e);return t.text&&!t.binary?new TextDecoder(`utf8`).decode(n):Oe(n)}throw Error(wk)}async function Ek(e,t,n){if(typeof e==`string`||Me(e))return Tk(e,t,n);if(We(e)&&(e=await hO(e)),Ae(e))return await gO(e),t.binary?await e.arrayBuffer():await e.text();if(Ye(e)&&(e=Ck(e,n)),Be(e)||Pe(e))return _b(e);throw Error(wk)}async function Dk(e,t){if(typeof e==`string`)return new TextEncoder().encode(e).buffer;if(Me(e))return Oe(He(e));if(We(e)&&(e=await hO(e)),Ae(e))return await gO(e),await e.arrayBuffer();if(Ye(e)&&(e=Ck(e,t)),Be(e)||Pe(e))return _b(e);throw Error(wk)}async function Ok(e,t){if(De(e)&&(e=await e),Ie(e))return e;if(Ae(e)){await gO(e);let n=await e.body;if(!n)throw Error(wk);return Ck(n,t)}return We(e)||Ye(e)?Ck(e,t):Pe(e)||Be(e)?e:kk(e)}function kk(e){if(ArrayBuffer.isView(e)||Me(e))return(function*(){yield Oe(e)})();if(Ie(e))return e;if(Be(e))return e[Symbol.iterator]();throw Error(wk)}function Ak(e,t){let n=AO(),r=e||n,i=r.fetch??r.core?.fetch,a;return a=typeof i==`function`?i:Fe(i)?t?.fetch||SO:t?.fetch?t.fetch:SO,Eb({fetch:a,credentials:r.core?.credentials||[],authentications:r.core?.authentications,fetchOptions:Fe(i)?i:void 0})}var jk=new Map,Mk=new Map;async function Nk(e,t,n){if(Hb(e)){let r=e.preload?await e.preload(n||``,t):e;if(!Hb(r))throw Error(`${e.id} source loader preload() did not return a runtime source loader`);return r}if(Fk(e))return e;let r=Rk(e,t),i=Mk.get(e)?.get(r);if(i)return i;let a=jk.get(e);a||(a=new Map,jk.set(e,a));let o=a.get(r);return o||(o=Ik(e,t,n).then(t=>{let n=Mk.get(e);return n||(n=new Map,Mk.set(e,n)),n.set(r,t),t}).catch(t=>{throw a.delete(r),a.size===0&&jk.delete(e),t}),a.set(r,o)),await o}function Pk(e){if(e.subloaders&&!Bk.has(e)){let t=Vk.get(e);if(t)return t;if(!Fk(e))return null}if(Fk(e))return e;let t=Rk(e);return Mk.get(e)?.get(t)||null}function Fk(e){let t=e;return!!(t.parse||t.parseSync||t.parseInBatches||t.parseText||t.parseTextSync||t.parseFile||t.parseFileInBatches)}async function Ik(e,t,n){if(e.preload){let r=await e.preload(n||``,t);if(Fk(r))return r;throw Error(`${e.id} loader preload() did not return a parser-bearing loader`)}return await zk(Lk(e,t),e.id)}function Lk(e,t){if((t?._workerType||t?.core?._workerType)===`test`){let t=`modules/${e.module}/src/${e.id}-loader.ts`;return typeof window<`u`?`/${t}`:typeof process<`u`&&process.cwd?new URL(t,`file://${process.cwd()}/`).toString():t}throw Error(`${e.id} loader does not provide a parser implementation. Import a parser-bearing loader directly, or use preload() before parse/load.`)}function Rk(e,t){let n=t?.[e.id],r=e.options?.[e.id];return String(n?.backend||r?.backend||``)}async function zk(e,t){let n=await et(()=>import(e),[]);for(let e of Object.values(n))if(e&&typeof e==`object`&&e.id===t&&Fk(e))return e;throw Error(`Could not find parser implementation for ${t} in ${e}`)}var Bk=new WeakSet,Vk=new WeakMap;async function Hk(e,t,n,r){t&&!Array.isArray(t)&&!WO(t)&&(r=void 0,n=t,t=void 0),n||={};let i=e.url||``,a=iA(t,r),o=await YO(i,a,n);if(!o)return null;if(Hb(o))throw Error(`${o.id} is a SourceLoader. Use load() to create a runtime source object instead of parseFile().`);let s=jO(n,o,a,i),c=await Sb(!o.getAuthentications&&s.core?.credentials?.length?await Nk(o,s,i||r?.url):o,i,s);return r=rA({url:i,_parse:aA,loaders:a},c,r||null),await Uk(o,e,c,r)}async function Uk(e,t,n,r){ab(e),n=yy(e.options,n);let i=await Nk(e,n,r.url);if(i.parseFile)return await i.parseFile(t,n,r);if(i.parse){let a=t.bigsize>0n?Number(t.bigsize):t.size;if(!a)throw Error(`${e.id} loader - cannot fall back to parse without a file size`);return await aA(await t.read(0n,a),i,n,r)}throw Error(`${e.id} loader - no file parser found`)}function Wk(e,t,n,r){!Array.isArray(t)&&!WO(t)&&(r=void 0,n=t,t=void 0),n||={};let i=iA(t,r),a=ZO(e,i,n);if(!a)return null;if(Hb(a))throw Error(`${a.id} is a SourceLoader. Use load() to create a runtime source object instead of parseSync().`);let o=jO(n,a,i),s=fO(e),c=()=>{throw Error(`parseSync called parse (which is async`)};return r=rA({url:s,_parseSync:c,_parse:c,loaders:t},o,r||null),Gk(Pk(a)||a,e,o,r)}function Gk(e,t,n,r){if(t=Tk(t,e,n),e.parseTextSync&&typeof t==`string`)return e.parseTextSync(t,n);if(e.parseSync&&t instanceof ArrayBuffer)return e.parseSync(t,n,r);throw e.preload?Error(`${e.name} loader: 'parseSync' requires a parser-bearing loader. Import the loader implementation directly, or call preload(loader) before parseSync(). ${r.url||``}`):Error(`${e.name} loader: 'parseSync' not supported by this loader, use 'parse' instead. ${r.url||``}`)}async function Kk(e,t,n,r){let i=Array.isArray(t)?t:void 0;!Array.isArray(t)&&!WO(t)&&(r=void 0,n=t,t=void 0),e=await e,n||={};let a=fO(e),o=await YO(e,t,n);if(!o)return[];let s=jO(n,o,i,a),c=await Sb(!o.getAuthentications&&s.core?.credentials?.length?await Nk(o,s,a||r?.url):o,a||``,s);return r=rA({url:a,_parseInBatches:Kk,_parse:aA,loaders:i},c,r||null),await qk(o,await Nk(o,c,r.url),e,c,r)}async function qk(e,t,n,r,i){let a=await Jk(t,n,r,i);if(!r?.core?.metadata)return a;let o={shape:`metadata`,batchType:`metadata`,metadata:{_loader:e,_context:i},data:[],bytesUsed:0};async function*s(e){yield o,yield*e}return s(a)}async function Jk(e,t,n,r){let i=await Zk(await Ok(t,n),n?.core?.transforms||[]);return e.parseInBatches?e.id===`csv`&&nt&&ob(e,n)?lb(e,i,n,r,aA):e.parseInBatches(i,n,r):Yk(i,e,n,r)}async function*Yk(e,t,n,r){yield Xk(await aA(await _b(e),t,{...n,core:{...n?.core,mimeType:t.mimeTypes[0]}},r),t)}function Xk(e,t){let n=Ub(e)?Gb(e):{shape:`unknown`,batchType:`data`,data:e,length:Array.isArray(e)?e.length:1};return n.mimeType=t.mimeTypes[0],n}async function Zk(e,t=[]){let n=e;for await(let e of t)n=e(n);return n}function Qk(e,t,n,r){let i;return!Array.isArray(t)&&!WO(t)?(r=void 0,n=t,i=void 0):i=t,Array.isArray(e)?e.map(e=>$k(e,i,n||{})):$k(e,i,n||{})}async function $k(e,t,n){if(typeof e==`string`){let r=e,i=await YO(r,t,{...n,core:{...n.core,nothrow:!0}});return n=await Sb(i&&!i.getAuthentications&&n.core?.credentials?.length?await Nk(i,n,r):i,r,n),await Kk(await Ak(n)(OO(r,n)),t,n)}return await Kk(e,t,n)}async function eA(e,t,n,r){let i,a;if(!Array.isArray(t)&&!WO(t)?(i=[],a=t,r=void 0):(i=t,a=n),a||=AO(),!Array.isArray(i)&&Hb(i)){let t=await tA(i,e,a);a=await Sb(i.getAuthentications?i:t,typeof e==`string`?e:``,a||{});let n={fetchFile:SO,parse:aA,parseFile:Hk,parseSync:Wk,parseInBatches:Kk,load:eA,loadInBatches:Qk};return t.createDataSource(e,a||{},n)}if(Array.isArray(i)&&i.length===1&&Hb(i[0])){let t=await tA(i[0],e,a);a=await Sb(i[0].getAuthentications?i[0]:t,typeof e==`string`?e:``,a||{});let n={fetchFile:SO,parse:aA,parseFile:Hk,parseSync:Wk,parseInBatches:Kk,load:eA,loadInBatches:Qk};return t.createDataSource(e,a||{},n)}if(typeof e==`string`||We(e)){let t=await YO(e,i,{...a,core:{...a?.core,nothrow:!0}});if(t&&Hb(t)){let n=await tA(t,e,a);return a=await Sb(t.getAuthentications?t:n,typeof e==`string`?e:``,a||{}),n.createDataSource(e,a||{},{fetchFile:SO,parse:aA,parseFile:Hk,parseSync:Wk,parseInBatches:Kk,load:eA,loadInBatches:Qk})}if(t&&typeof e==`string`){let n=await Nk(t,a,e);a=await Sb(t.getAuthentications?t:n,e,a||{});let i=n.parseUrl;if(i)return await i(OO(e,a),a,r)}}a&&=xb(a);let o=Ak(a),s=e;return typeof e==`string`&&(s=await o(OO(e,a))),We(e)&&(s=await o(e)),typeof e==`string`&&(MO(a||{}).core?.baseUrl||(a={...a,core:{...a?.core,baseUrl:e}})),await aA(s,i,a,r)}async function tA(e,t,n){if(!e.preload)return e;let r=await e.preload(typeof t==`string`?t:``,n);if(!Hb(r))throw Error(`${e.id} source loader preload() did not return a runtime source loader`);return r}var nA=Object.freeze({fetchFile:SO,parse:aA,parseFile:Hk,parseSync:Wk,parseInBatches:Kk,load:eA,loadInBatches:Qk});function rA(e,t,n){if(n)return{...n,coreApi:n.coreApi||e.coreApi||nA,_parse:n._parse||e._parse,fetch:Ak(t,n)};let r={...e,fetch:Ak(t,e),coreApi:e.coreApi||nA};if(r.url){let e=uO(r.url);r.baseUrl=e,r.queryString=lO(r.url),r.filename=Bb(e),r.baseUrl=Vb(e)}return Array.isArray(r.loaders)||(r.loaders=null),r}function iA(e,t){if(e&&!Array.isArray(e))return e;let n;if(e&&(n=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];n=n?[...n,...e]:e}return n&&n.length?n:void 0}async function aA(e,t,n,r){t&&!Array.isArray(t)&&!WO(t)&&(r=void 0,n=t,t=void 0),e=await e,n||={};let i=fO(e),a=iA(t,r),o=await YO(e,a,n);if(!o)return null;if(Hb(o))throw Error(`${o.id} is a SourceLoader. Use load() to create a runtime source object instead of parse().`);let s=jO(n,o,a,i),c=await Sb(!o.getAuthentications&&s.core?.credentials?.length?await Nk(o,s,i||r?.url):o,i||``,s);return r=rA({url:i,_parse:aA,loaders:a},c,r||null),await oA(o,e,c,r)}async function oA(e,t,n,r){if(ab(e),n=yy(e.options,n),Ae(t)){let{ok:e,redirected:n,status:i,statusText:a,type:o,url:s}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:n,status:i,statusText:a,type:o,url:s}}let i=await Nk(e,n,r.url);return sb(i,t,n,r,e)?(t=await Dk(t,n),await cb(i,t,n,r,aA)):We(t)&&i.parseBlob?await i.parseBlob(t,n,r):(t=await Ek(t,e,n),await sA(i,t,n,r))}async function sA(e,t,n,r){if(e.parseText&&typeof t==`string`)return await e.parseText(t,n,r);if(e.parseTextSync&&typeof t==`string`)return e.parseTextSync(t,n,r);if(e.parse)return await e.parse(t,n,r);throw e.parseSync?Error(`${e.name} loader: 'parse' not available on parser-bearing sync loader. Add an async 'parse' function to this loader, or call preload(loader) before parseSync(). ${r.url||``}`):Error(`${e.id} loader - no parser found and worker is disabled`)}var cA=1024,lA=4,uA=()=>{},dA={minFilter:`linear`,mipmapFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},fA={x:0,y:0,width:0,height:0};function pA(e){return 2**Math.ceil(Math.log2(e))}function mA(e,t,n,r){let i=Math.min(n/t.width,r/t.height),a=Math.floor(t.width*i),o=Math.floor(t.height*i);return i===1?{image:t,width:a,height:o}:(e.canvas.height=o,e.canvas.width=a,e.clearRect(0,0,a,o),e.drawImage(t,0,0,t.width,t.height,0,0,a,o),{image:e.canvas,width:a,height:o})}function hA(e){return e&&(e.id||e.url)}function gA(e){let{device:t}=e;t.type===`webgl`?e.generateMipmapsWebGL():t.type===`webgpu`&&t.generateMipmapsWebGPU(e)}function _A(e,t,n,r){let{width:i,height:a,device:o}=e,s=o.createTexture({format:`rgba8unorm`,width:t,height:n,sampler:r,mipLevels:o.getMipLevelCount(t,n)}),c=o.createCommandEncoder();c.copyTextureToTexture({sourceTexture:e,destinationTexture:s,width:i,height:a});let l=c.finish();return o.submit(l),gA(s),e.destroy(),s}function vA(e,t,n){for(let r=0;r<t.length;r++){let{icon:i,xOffset:a}=t[r],o=hA(i);e[o]={...i,x:a,y:n}}}function yA({icons:e,buffer:t,mapping:n={},xOffset:r=0,yOffset:i=0,rowHeight:a=0,canvasWidth:o}){let s=[];for(let c=0;c<e.length;c++){let l=e[c];if(!n[hA(l)]){let{height:e,width:c}=l;r+c+t>o&&(vA(n,s,i),r=0,i=a+i+t,a=0,s=[]),s.push({icon:l,xOffset:r}),r=r+c+t,a=Math.max(a,e)}}return s.length>0&&vA(n,s,i),{mapping:n,rowHeight:a,xOffset:r,yOffset:i,canvasWidth:o,canvasHeight:pA(a+i+t)}}function bA(e,t,n){if(!e||!t)return null;n||={};let r={},{iterable:i,objectInfo:a}=qp(e);for(let e of i){a.index++;let i=t(e,a),o=hA(i);if(!i)throw Error(`Icon is missing.`);if(!i.url)throw Error(`Icon url is missing.`);!r[o]&&(!n[o]||i.url!==n[o].url)&&(r[o]={...i,source:e,sourceIndex:a.index})}return r}var xA=class{constructor(e,{onUpdate:t=uA,onError:n=uA}){this._loadOptions=null,this._texture=null,this._externalTexture=null,this._mapping={},this._samplerParameters=null,this._pendingCount=0,this._autoPacking=!1,this._xOffset=0,this._yOffset=0,this._rowHeight=0,this._buffer=lA,this._canvasWidth=cA,this._canvasHeight=0,this._canvas=null,this.device=e,this.onUpdate=t,this.onError=n}finalize(){this._texture?.delete()}getTexture(){return this._texture||this._externalTexture}getIconMapping(e){let t=this._autoPacking?hA(e):e;return this._mapping[t]||fA}setProps({loadOptions:e,autoPacking:t,iconAtlas:n,iconMapping:r,textureParameters:i}){e&&(this._loadOptions=e),t!==void 0&&(this._autoPacking=t),r&&(this._mapping=r),n&&(this._texture?.delete(),this._texture=null,this._externalTexture=n),i&&(this._samplerParameters=i)}get isLoaded(){return this._pendingCount===0}packIcons(e,t){if(!this._autoPacking||typeof document>`u`)return;let n=Object.values(bA(e,t,this._mapping)||{});if(n.length>0){let{mapping:e,xOffset:t,yOffset:r,rowHeight:i,canvasHeight:a}=yA({icons:n,buffer:this._buffer,canvasWidth:this._canvasWidth,mapping:this._mapping,rowHeight:this._rowHeight,xOffset:this._xOffset,yOffset:this._yOffset});this._rowHeight=i,this._mapping=e,this._xOffset=t,this._yOffset=r,this._canvasHeight=a,this._texture||=this.device.createTexture({format:`rgba8unorm`,data:null,width:this._canvasWidth,height:this._canvasHeight,sampler:this._samplerParameters||dA,mipLevels:this.device.getMipLevelCount(this._canvasWidth,this._canvasHeight)}),this._texture.height!==this._canvasHeight&&(this._texture=_A(this._texture,this._canvasWidth,this._canvasHeight,this._samplerParameters||dA)),this.onUpdate(!0),this._canvas=this._canvas||document.createElement(`canvas`),this._loadIcons(n)}}_loadIcons(e){let t=this._canvas.getContext(`2d`,{willReadFrequently:!0});for(let n of e)this._pendingCount++,eA(n.url,this._loadOptions).then(e=>{let r=hA(n),i=this._mapping[r],{x:a,y:o,width:s,height:c}=i,{image:l,width:u,height:d}=mA(t,e,s,c),f=a+(s-u)/2,p=o+(c-d)/2;this._texture?.copyExternalImage({image:l,x:f,y:p,width:u,height:d}),i.x=f,i.y=p,i.width=u,i.height=d,this._texture&&gA(this._texture),this.onUpdate(u!==s||d!==c)}).catch(e=>{this.onError({url:n.url,source:n.source,sourceIndex:n.sourceIndex,loadOptions:this._loadOptions,error:e})}).finally(()=>{this._pendingCount--})}},SA=[0,0,0,255],CA={iconAtlas:{type:`image`,value:null,async:!0},iconMapping:{type:`object`,value:{},async:!0},sizeScale:{type:`number`,value:1,min:0},billboard:!0,sizeUnits:`pixels`,sizeBasis:`height`,sizeMinPixels:{type:`number`,min:0,value:0},sizeMaxPixels:{type:`number`,min:0,value:2**53-1},alphaCutoff:{type:`number`,value:.05,min:0,max:1},getPosition:{type:`accessor`,value:e=>e.position},getIcon:{type:`accessor`,value:e=>e.icon},getColor:{type:`accessor`,value:SA},getSize:{type:`accessor`,value:1},getAngle:{type:`accessor`,value:0},getPixelOffset:{type:`accessor`,value:[0,0]},onIconError:{type:`function`,value:null,optional:!0},textureParameters:{type:`object`,ignore:!0,value:null}},wA=class extends kg{getShaders(){let e=!!this.props.data?.attributes?.rowIndexes;return super.getShaders({vs:QD,fs:$D,source:tO(e),defines:e?{USE_ROW_INDEXES:!0}:{},modules:[Hl,Os,Uu,ZD]})}initializeState(){this.state={iconManager:new xA(this.context.device,{onUpdate:this._onUpdate.bind(this),onError:this._onError.bind(this)})},this.getAttributeManager().addInstanced({instancePositions:{size:3,type:`float64`,fp64:this.use64bitPositions(),transition:!0,accessor:`getPosition`},instanceSizes:{size:1,transition:!0,bufferGroup:`icon-instance-data`,accessor:`getSize`,defaultValue:1},instanceIconDefs:{size:7,bufferGroup:`icon-instance-data`,accessor:`getIcon`,transform:this.getInstanceIconDef,shaderAttributes:{instanceOffsets:{size:2,elementOffset:0},instanceIconFrames:{size:4,elementOffset:2},instanceColorModes:{size:1,elementOffset:6}}},instanceColors:{size:this.props.colorFormat.length,type:`unorm8`,transition:!0,bufferGroup:`icon-instance-data`,accessor:`getColor`,defaultValue:SA},instanceAngles:{size:1,transition:!0,bufferGroup:`icon-instance-data`,accessor:`getAngle`},instancePixelOffset:{size:2,transition:!0,bufferGroup:`icon-instance-data`,accessor:`getPixelOffset`},...this.props.data?.attributes?.rowIndexes?{rowIndexes:{size:1,type:`uint32`,noAlloc:!0}}:{}})}updateState(e){super.updateState(e);let{props:t,oldProps:n,changeFlags:r}=e,i=this.getAttributeManager(),{iconAtlas:a,iconMapping:o,data:s,getIcon:c,textureParameters:l}=t,{iconManager:u}=this.state;if(typeof a==`string`)return;let d=a||this.internalState.isAsyncPropLoading(`iconAtlas`);u.setProps({loadOptions:t.loadOptions,autoPacking:!d,iconAtlas:a,iconMapping:d?o:null,textureParameters:l}),d?n.iconMapping!==t.iconMapping&&i.invalidate(`getIcon`):(r.dataChanged||r.updateTriggersChanged&&(r.updateTriggersChanged.all||r.updateTriggersChanged.getIcon))&&u.packIcons(s,c),r.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),i.invalidateAll())}get isLoaded(){return super.isLoaded&&this.state.iconManager.isLoaded}finalizeState(e){super.finalizeState(e),this.state.iconManager.finalize()}draw({uniforms:e}){this._drawModel(this.state.model)}_drawModel(e){let{sizeScale:t,sizeBasis:n,sizeMinPixels:r,sizeMaxPixels:i,sizeUnits:a,billboard:o,alphaCutoff:s}=this.props,{iconManager:c}=this.state,l=c.getTexture();if(l){let c={iconsTexture:l,iconsTextureDim:[l.width,l.height],sizeUnits:bl[a],sizeScale:t,sizeBasis:n===`height`?1:0,sizeMinPixels:r,sizeMaxPixels:i,billboard:o,alphaCutoff:s};e.shaderInputs.setProps({icon:c}),e.draw(this.context.renderPass)}}_getModel(e=this.props.id){let t=[-1,-1,1,-1,-1,1,1,1];return new de(this.context.device,{...this.getShaders(),id:e,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new fe({topology:`triangle-strip`,attributes:{positions:{size:2,value:new Float32Array(t)}}}),isInstanced:!0})}_onUpdate(e){e?(this.getAttributeManager()?.invalidate(`getIcon`),this.setNeedsUpdate()):this.setNeedsRedraw()}_onError(e){let t=this.getCurrentLayer()?.props.onIconError;t?t(e):j.error(e.error.message)()}getInstanceIconDef(e){let{x:t,y:n,width:r,height:i,mask:a,anchorX:o=r/2,anchorY:s=i/2}=this.state.iconManager.getIconMapping(e);return[r/2-o,i/2-s,t,n,r,i,a?1:0]}};wA.defaultProps=CA,wA.layerName=`IconLayer`;var TA=`layout(std140) uniform sdfUniforms {
  float gamma;
  bool enabled;
  float buffer;
  float outlineBuffer;
  vec4 outlineColor;
} sdf;
`,EA={name:`sdf`,vs:TA,fs:TA,uniformTypes:{gamma:`f32`,enabled:`f32`,buffer:`f32`,outlineBuffer:`f32`,outlineColor:`vec4<f32>`}},DA={none:0,start:1,center:2,end:3},OA={name:`text`,vs:`\
layout(std140) uniform textUniforms {
  highp vec2 cutoffPixels;
  highp ivec2 align;
  highp float fontSize;
  bool flipY;
} text;

#define ALIGN_MODE_START ${DA.start}
#define ALIGN_MODE_CENTER ${DA.center}
#define ALIGN_MODE_END ${DA.end}
`,getUniforms:({contentCutoffPixels:e=[0,0],contentAlignHorizontal:t=`none`,contentAlignVertical:n=`none`,fontSize:r,viewport:i})=>({cutoffPixels:e,align:[DA[t],DA[n]],fontSize:r,flipY:i?.flipY??!1}),uniformTypes:{cutoffPixels:`vec2<f32>`,align:`vec2<i32>`,fontSize:`f32`,flipY:`f32`}},kA=`#version 300 es
#define SHADER_NAME multi-icon-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceSizes;
in float instanceAngles;
in vec4 instanceColors;
in float rowIndexes;
in vec4 instanceIconFrames;
in float instanceColorModes;
in vec2 instanceOffsets;
in vec2 instancePixelOffset;
in vec4 instanceClipRect;
out float vColorMode;
out vec4 vColor;
out vec2 vTextureCoords;
out vec2 uv;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = angle * PI / 180.0;
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
float getPixelOffsetFromAlignment(float anchor, float extent, float clipStart, float clipEnd, int mode) {
if (clipEnd < clipStart) return 0.0;
if (mode == ALIGN_MODE_START) {
return max(- (anchor + clipStart), 0.0);
}
if (mode == ALIGN_MODE_CENTER) {
float _min = max(0., anchor + clipStart);
float _max = min(extent, anchor + clipEnd);
return _min < _max ? (_min + _max) / 2.0 - anchor : 0.0;
}
if (mode == ALIGN_MODE_END) {
return min(extent - (anchor + clipEnd), 0.);
}
return 0.0;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
uv = positions;
vec2 iconSize = instanceIconFrames.zw;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * icon.sizeScale, icon.sizeUnits),
icon.sizeMinPixels, icon.sizeMaxPixels
);
float instanceScale = sizePixels / text.fontSize;
vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
pixelOffset += instancePixelOffset;
pixelOffset.y *= -1.0;
vec2 anchorPosScreen;
if (icon.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
anchorPosScreen = gl_Position.xy / gl_Position.w;
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
if (text.flipY) {
offset_common.y *= -1.;
}
DECKGL_FILTER_SIZE(offset_common, geometry);
vec4 anchorPos = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0));
anchorPosScreen = anchorPos.xy / anchorPos.w;
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
anchorPosScreen = vec2(anchorPosScreen.x + 1.0, 1.0 - anchorPosScreen.y) / 2.0 * project.viewportSize / project.devicePixelRatio;
vec2 xy = project_size_to_pixel(instanceClipRect.xy);
vec2 wh = project_size_to_pixel(instanceClipRect.zw);
if (text.flipY) {
xy.y = -xy.y - wh.y;
}
if (text.align.x > 0 || text.align.y > 0) {
vec2 viewportPixels = project.viewportSize / project.devicePixelRatio;
vec2 scrollPixels = vec2(
getPixelOffsetFromAlignment(anchorPosScreen.x, viewportPixels.x, xy.x, xy.x + wh.x, text.align.x),
-getPixelOffsetFromAlignment(anchorPosScreen.y, viewportPixels.y, -xy.y - wh.y, -xy.y, text.align.y)
);
pixelOffset += scrollPixels;
gl_Position.xy += project_pixel_size_to_clipspace(scrollPixels);
}
if (instanceClipRect.z >= 0.) {
if (pixelOffset.x < xy.x || pixelOffset.x > xy.x + wh.x) {
gl_Position = vec4(0.0);
}
else if (text.cutoffPixels.x > 0.) {
float vpWidth = project.viewportSize.x / project.devicePixelRatio;
float l = max(anchorPosScreen.x + xy.x, 0.0);
float r = min(anchorPosScreen.x + xy.x + wh.x, vpWidth);
if (r - l < text.cutoffPixels.x) {
gl_Position = vec4(0.0);
}
}
}
if (instanceClipRect.w >= 0.) {
if (pixelOffset.y < xy.y || pixelOffset.y > xy.y + wh.y) {
gl_Position = vec4(0.0);
}
else if (text.cutoffPixels.y > 0.) {
float vpHeight = project.viewportSize.y / project.devicePixelRatio;
float t = max(anchorPosScreen.y - xy.y - wh.y, 0.0);
float b = min(anchorPosScreen.y - xy.y, vpHeight);
if (b - t < text.cutoffPixels.y) {
gl_Position = vec4(0.0);
}
}
}
vTextureCoords = mix(
instanceIconFrames.xy,
instanceIconFrames.xy + iconSize,
(positions.xy + 1.0) / 2.0
) / icon.iconsTextureDim;
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
vColorMode = instanceColorModes;
}
`,AA=`#version 300 es
#define SHADER_NAME multi-icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
if (!bool(picking.isActive)) {
float alpha = texture(iconsTexture, vTextureCoords).a;
vec4 color = vColor;
if (sdf.enabled) {
float distance = alpha;
alpha = smoothstep(sdf.buffer - sdf.gamma, sdf.buffer + sdf.gamma, distance);
if (sdf.outlineBuffer > 0.0) {
float inFill = alpha;
float inBorder = smoothstep(sdf.outlineBuffer - sdf.gamma, sdf.outlineBuffer + sdf.gamma, distance);
color = mix(sdf.outlineColor, vColor, inFill);
alpha = inBorder;
}
}
float a = alpha * color.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color.rgb, a * layer.opacity);
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;function jA({collision:e=!1}={}){return`\
struct IconUniforms {
  sizeScale: f32,
  iconsTextureDim: vec2<f32>,
  sizeBasis: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  billboard: i32,
  sizeUnits: i32,
  alphaCutoff: f32
};

struct TextUniforms {
  cutoffPixels: vec2<f32>,
  align: vec2<i32>,
  fontSize: f32,
  flipY: f32
};

struct SdfUniforms {
  gamma: f32,
  enabled: f32,
  buffer: f32,
  outlineBuffer: f32,
  outlineColor: vec4<f32>
};

${e?`struct CollisionUniforms {
  sort: i32,
  enabled: i32
};
`:``}

const ALIGN_MODE_START: i32 = 1;
const ALIGN_MODE_CENTER: i32 = 2;
const ALIGN_MODE_END: i32 = 3;

@group(0) @binding(auto) var<uniform> icon: IconUniforms;
@group(0) @binding(auto) var<uniform> text: TextUniforms;
@group(0) @binding(auto) var<uniform> sdf: SdfUniforms;
${e?`@group(0) @binding(auto) var<uniform> collision: CollisionUniforms;`:``}
@group(0) @binding(auto) var iconsTexture : texture_2d<f32>;
@group(0) @binding(auto) var iconsTextureSampler : sampler;
${e?`@group(0) @binding(auto) var collision_texture : texture_2d<f32>;
`:``}

fn rotate_by_angle(vertex: vec2<f32>, angle_deg: f32) -> vec2<f32> {
  let angle_radian = angle_deg * PI / 180.0;
  let c = cos(angle_radian);
  let s = sin(angle_radian);
  let rotation = mat2x2<f32>(vec2<f32>(c, -s), vec2<f32>(s, c));
  return rotation * vertex;
}

fn get_pixel_offset_from_alignment(
  anchor: f32,
  extent: f32,
  clipStart: f32,
  clipEnd: f32,
  mode: i32
) -> f32 {
  if (clipEnd < clipStart) {
    return 0.0;
  }
  if (mode == ALIGN_MODE_START) {
    return max(-(anchor + clipStart), 0.0);
  }
  if (mode == ALIGN_MODE_CENTER) {
    let minValue = max(0.0, anchor + clipStart);
    let maxValue = min(extent, anchor + clipEnd);
    if (minValue < maxValue) {
      return (minValue + maxValue) / 2.0 - anchor;
    }
    return 0.0;
  }
  if (mode == ALIGN_MODE_END) {
    return min(extent - (anchor + clipEnd), 0.0);
  }
  return 0.0;
}

${e?`fn collision_match(texCoords: vec2<f32>, pickingColor: vec3<f32>) -> f32 {
  let textureSize = vec2<i32>(textureDimensions(collision_texture));
  let pixelCoords = clamp(
    vec2<i32>(texCoords * vec2<f32>(textureSize)),
    vec2<i32>(0),
    textureSize - vec2<i32>(1)
  );
  let collisionPickingColor = textureLoad(collision_texture, pixelCoords, 0);
  let delta = dot(abs(collisionPickingColor.rgb - pickingColor), vec3<f32>(1.0));
  return step(delta, 0.001);
}

fn collision_is_visible(texCoords: vec2<f32>, pickingColor: vec3<f32>) -> f32 {
  if (collision.enabled == 0) {
    return 1.0;
  }

  var accumulator = 0.0;
  let stepSize = vec2<f32>(1.0) / project.viewportSize;

  for (var i: i32 = -2; i <= 2; i = i + 1) {
    for (var j: i32 = -2; j <= 2; j = j + 1) {
      let delta = vec2<f32>(f32(j), f32(i)) * stepSize;
      accumulator = accumulator + collision_match(texCoords + delta, pickingColor);
    }
  }

  return pow(accumulator / 25.0, 2.2);
}
`:``}

struct Attributes {
  @location(0) positions: vec2<f32>,

  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceSizes: f32,
  @location(4) instanceAngles: f32,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instanceIconFrames: vec4<f32>,
  @location(7) instanceColorModes: f32,
  @location(8) instanceOffsets: vec2<f32>,
  @location(9) instancePixelOffset: vec2<f32>,
  @location(10) rowIndexes: u32,
  @location(11) instanceClipRect: vec4<f32>,
  ${e?`@location(12) collisionPriorities: f32,`:``}
};

struct Varyings {
  @builtin(position) position: vec4<f32>,

  @location(0) vColorMode: f32,
  @location(1) vColor: vec4<f32>,
  @location(2) vTextureCoords: vec2<f32>,
  @location(3) uv: vec2<f32>,
  @location(4) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(inp: Attributes) -> Varyings {
  geometry.worldPosition = inp.instancePositions;
  geometry.uv = inp.positions;
  geometry.pickingColor = picking_getPickingColorFromIndex(inp.rowIndexes);

  var outp: Varyings;
  outp.uv = inp.positions;

  let iconSize = inp.instanceIconFrames.zw;

  let sizePixels = clamp(
    project_unit_size_to_pixel(inp.instanceSizes * icon.sizeScale, icon.sizeUnits),
    icon.sizeMinPixels, icon.sizeMaxPixels
  );
  let instanceScale = sizePixels / text.fontSize;

  var pixelOffset = inp.positions / 2.0 * iconSize + inp.instanceOffsets;
  pixelOffset = rotate_by_angle(pixelOffset, inp.instanceAngles) * instanceScale;
  pixelOffset = pixelOffset + inp.instancePixelOffset;
  pixelOffset.y = pixelOffset.y * -1.0;

  var pos: vec4<f32>;
  var anchorPosScreen: vec2<f32>;
  if (icon.billboard != 0) {
    pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0));
    anchorPosScreen = pos.xy / pos.w;

    let clipOffset = project_pixel_size_to_clipspace(pixelOffset);
    pos = vec4<f32>(pos.x + clipOffset.x, pos.y + clipOffset.y, pos.z, pos.w);
  } else {
    var offsetCommon = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    if (text.flipY > 0.5) {
      offsetCommon.y = offsetCommon.y * -1.0;
    }
    let anchorPos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0));
    anchorPosScreen = anchorPos.xy / anchorPos.w;
    pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, offsetCommon);
  }

  anchorPosScreen = vec2<f32>(anchorPosScreen.x + 1.0, 1.0 - anchorPosScreen.y) / 2.0 *
    project.viewportSize / project.devicePixelRatio;
  var xy = project_size_vec2(inp.instanceClipRect.xy) * project.scale;
  var wh = project_size_vec2(inp.instanceClipRect.zw) * project.scale;

  if (text.flipY > 0.5) {
    xy.y = -xy.y - wh.y;
  }
  if (text.align.x > 0 || text.align.y > 0) {
    let viewportPixels = project.viewportSize / project.devicePixelRatio;
    let scrollPixels = vec2<f32>(
      get_pixel_offset_from_alignment(anchorPosScreen.x, viewportPixels.x, xy.x, xy.x + wh.x, text.align.x),
      -get_pixel_offset_from_alignment(anchorPosScreen.y, viewportPixels.y, -xy.y - wh.y, -xy.y, text.align.y)
    );
    pixelOffset = pixelOffset + scrollPixels;
    let scrollClipOffset = project_pixel_size_to_clipspace(scrollPixels);
    pos.x = pos.x + scrollClipOffset.x;
    pos.y = pos.y + scrollClipOffset.y;
  }

  if (inp.instanceClipRect.z >= 0.0) {
    if (pixelOffset.x < xy.x || pixelOffset.x > xy.x + wh.x) {
      pos = vec4<f32>(0.0);
    } else if (text.cutoffPixels.x > 0.0) {
      let viewportWidth = project.viewportSize.x / project.devicePixelRatio;
      let left = max(anchorPosScreen.x + xy.x, 0.0);
      let right = min(anchorPosScreen.x + xy.x + wh.x, viewportWidth);
      if (right - left < text.cutoffPixels.x) {
        pos = vec4<f32>(0.0);
      }
    }
  }
  if (inp.instanceClipRect.w >= 0.0) {
    if (pixelOffset.y < xy.y || pixelOffset.y > xy.y + wh.y) {
      pos = vec4<f32>(0.0);
    } else if (text.cutoffPixels.y > 0.0) {
      let viewportHeight = project.viewportSize.y / project.devicePixelRatio;
      let top = max(anchorPosScreen.y - xy.y - wh.y, 0.0);
      let bottom = min(anchorPosScreen.y - xy.y, viewportHeight);
      if (bottom - top < text.cutoffPixels.y) {
        pos = vec4<f32>(0.0);
      }
    }
  }

  ${e?`  if (collision.sort != 0) {
    pos.z = -0.001 * inp.collisionPriorities * pos.w;
  }
  `:``}

  let uvMix = (inp.positions.xy + vec2<f32>(1.0, 1.0)) * 0.5;
  outp.vTextureCoords = mix(inp.instanceIconFrames.xy, inp.instanceIconFrames.xy + iconSize, uvMix) / icon.iconsTextureDim;

  outp.position = pos;
  outp.vColor = inp.instanceColors;
  outp.vColorMode = inp.instanceColorModes;
  outp.pickingColor = picking_getPickingColorFromIndex(inp.rowIndexes);

  return outp;
}

@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = inp.uv;

  let texColor = textureSample(iconsTexture, iconsTextureSampler, inp.vTextureCoords);
  var alpha = texColor.a;
  var color = inp.vColor;

  if (sdf.enabled > 0.5) {
    let distance = alpha;
    alpha = smoothstep(sdf.buffer - sdf.gamma, sdf.buffer + sdf.gamma, distance);

    if (sdf.outlineBuffer > 0.0) {
      let inFill = alpha;
      let inBorder = smoothstep(sdf.outlineBuffer - sdf.gamma, sdf.outlineBuffer + sdf.gamma, distance);
      color = mix(sdf.outlineColor, inp.vColor, inFill);
      alpha = inBorder;
    }
  } else if (inp.vColorMode == 0.0) {
    color = texColor;
  }

  var a = alpha * color.a * layer.opacity;
  if (a < icon.alphaCutoff) {
    discard;
  }

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  ${e?`  let collisionFade = collision_is_visible(inp.position.xy / project.viewportSize, inp.pickingColor);
  a = a * collisionFade;
  if (a <= 0.0001) {
    discard;
  }
  `:``}

  var fragColor = deckgl_premultiplied_alpha(vec4<f32>(color.rgb, a));

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inp.pickingColor - highlightedObjectColor))) {
      let highLightAlpha = picking.highlightColor.a;
      let blendedAlpha = highLightAlpha + fragColor.a * (1.0 - highLightAlpha);
      if (blendedAlpha > 0.0) {
        let highLightRatio = highLightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highLightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  return fragColor;
}
`}var MA=jA(),NA=192/256,PA={getIconOffsets:{type:`accessor`,value:e=>e.offsets},getContentBox:{type:`accessor`,value:[0,0,-1,-1]},fontSize:1,alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:`color`,value:[0,0,0,255]},contentCutoffPixels:{type:`array`,value:[0,0]},contentAlignHorizontal:`none`,contentAlignVertical:`none`},FA=class extends wA{getShaders(){let e=super.getShaders();return{...e,modules:[...e.modules,OA,EA],vs:kA,fs:AA,source:MA}}initializeState(){super.initializeState();let e=this.getAttributeManager(),t=e.attributes.instanceIconDefs;t.settings.update=this.calculateInstanceIconDefs,e.addInstanced({rowIndexes:{type:`uint32`,size:1,bufferGroup:`icon-instance-data`,accessor:(e,{index:t})=>t},instanceClipRect:{size:4,bufferGroup:`icon-instance-data`,accessor:`getContentBox`,defaultValue:[0,0,-1,-1]}})}updateState(e){super.updateState(e);let{props:t,oldProps:n,changeFlags:r}=e,{outlineColor:i}=t;if(r.extensionsChanged){this.state.fillModel?.destroy();let e=this.context.device.type===`webgpu`?this._getModel(`${this.props.id}-fill`):void 0;this.setState({fillModel:e,models:e?[this.state.model,e]:[this.state.model]})}if(r.updateTriggersChanged&&(r.updateTriggersChanged.getIcon||r.updateTriggersChanged.getIconOffsets)&&this.getAttributeManager().invalidate(`instanceIconDefs`),i!==n.outlineColor){let e=[i[0]/255,i[1]/255,i[2]/255,(i[3]??255)/255];this.setState({outlineColor:e})}!t.sdf&&t.outlineWidth&&j.warn(`${this.id}: fontSettings.sdf is required to render outline`)()}draw(e){let{sdf:t,smoothing:n,fontSize:r,outlineWidth:i,contentCutoffPixels:a,contentAlignHorizontal:o,contentAlignVertical:s}=this.props,{outlineColor:c}=this.state,l=i?Math.max(n,NA*(1-i)):-1,u=this.state.model,d={buffer:NA,outlineBuffer:l,gamma:n,enabled:!!t,outlineColor:c},f={contentCutoffPixels:a,contentAlignHorizontal:o,contentAlignVertical:s,fontSize:r,viewport:this.context.viewport};if(u.shaderInputs.setProps({sdf:d,text:f}),super.draw(e),t&&i){let{iconManager:e}=this.state;if(e.getTexture()){let e=this.state.fillModel||u;e.shaderInputs.setProps({sdf:{...d,outlineBuffer:NA},text:f}),this._drawModel(e)}}}calculateInstanceIconDefs(e,{startRow:t,endRow:n}){let{data:r,getIcon:i,getIconOffsets:a}=this.props,o=e.getVertexOffset(t),s=e.value,{iterable:c,objectInfo:l}=qp(r,t,n);for(let t of c){l.index++;let n=i(t,l),r=a(t,l);if(n){let t=0;for(let i of Array.from(n)){let n=super.getInstanceIconDef(i);n[0]=r[t*2],n[1]+=r[t*2+1],n[6]=1,s.set(n,o),o+=e.size,t++}}}}};FA.defaultProps=PA,FA.layerName=`MultiIconLayer`;var IA=0x56bc75e2d63100000,LA=new Float64Array(256);for(let e=0;e<256;e++){let t=.5-(e/255)**(1/2.2);LA[e]=t*Math.abs(t)}LA[255]=-IA;var RA=class{constructor({fontSize:e=24,buffer:t=3,radius:n=8,cutoff:r=.25,fontFamily:i=`sans-serif`,fontWeight:a=`normal`,fontStyle:o=`normal`,lang:s=null}={}){this.buffer=t,this.radius=n,this.cutoff=r,this.lang=s;let c=this.size=e+t*4,l=this.ctx=this._createCanvas(c).getContext(`2d`,{willReadFrequently:!0});l.font=`${o} ${a} ${e}px ${i}`,l.textBaseline=`alphabetic`,l.textAlign=`left`,l.fillStyle=`black`,this.gridOuter=new Float64Array(c*c),this.gridInner=new Float64Array(c*c),this.f=new Float64Array(c),this.z=new Float64Array(c+1),this.v=new Uint16Array(c)}_createCanvas(e){if(typeof OffscreenCanvas<`u`)return new OffscreenCanvas(e,e);let t=document.createElement(`canvas`);return t.width=t.height=e,t}draw(e){let{width:t,actualBoundingBoxAscent:n,actualBoundingBoxDescent:r,actualBoundingBoxLeft:i,actualBoundingBoxRight:a}=this.ctx.measureText(e),o=Math.ceil(n),s=Math.floor(-i),c=Math.max(0,Math.min(this.size-this.buffer,Math.ceil(a)-s)),l=Math.max(0,Math.min(this.size-this.buffer,o+Math.ceil(r))),u=c+2*this.buffer,d=l+2*this.buffer,f=Math.max(u*d,0),p=new Uint8ClampedArray(f),m={data:p,width:u,height:d,glyphWidth:c,glyphHeight:l,glyphTop:o,glyphLeft:s,glyphAdvance:t};if(c===0||l===0)return m;let{ctx:h,buffer:g,gridInner:_,gridOuter:v}=this;this.lang&&(h.lang=this.lang),h.clearRect(g,g,c,l),h.fillText(e,g-s,g+o);let y=h.getImageData(g,g,c,l);v.fill(IA,0,f),_.fill(0,0,f);let b=3;for(let e=0;e<l;e++){let t=(e+g)*u+g;for(let e=0;e<c;e++,b+=4,t++){let e=y.data[b];if(e===0)continue;let n=LA[e];v[t]=Math.max(0,n),_[t]=Math.max(0,-n)}}zA(v,0,0,u,d,u,this.f,this.v,this.z);let x=Math.min(g,1);zA(_,g-x,g-x,c+2*x,l+2*x,u,this.f,this.v,this.z);let S=255/this.radius,C=255*(1-this.cutoff);for(let e=0;e<f;e++){let t=Math.sqrt(v[e])-Math.sqrt(_[e]);p[e]=Math.round(C-S*t)}return m}};function zA(e,t,n,r,i,a,o,s,c){for(let l=t;l<t+r;l++)BA(e,n*a+l,a,i,o,s,c);for(let l=n;l<n+i;l++)BA(e,l*a+t,1,r,o,s,c)}function BA(e,t,n,r,i,a,o){a[0]=0,o[0]=-IA,o[1]=IA,i[0]=e[t];for(let s=1,c=0,l=0;s<r;s++){i[s]=e[t+s*n];let r=s*s;do{let e=a[c];l=(i[s]-i[e]+r-e*e)/(s-e)/2}while(l<=o[c]&&--c>-1);c++,a[c]=s,o[c]=l,o[c+1]=IA}for(let s=0,c=0;s<r;s++){for(;o[c+1]<s;)c++;let r=a[c],l=s-r;e[t+s*n]=i[r]+l*l}}var VA=32,HA=[];function UA(e){return 2**Math.ceil(Math.log2(e))}function WA({characterSet:e,measureText:t,buffer:n,maxCanvasWidth:r,mapping:i={},xOffset:a=0,yOffsetMin:o=0,yOffsetMax:s=0}){let c=a,l=o,u=s;for(let a of e)if(!i[a]){let{advance:e,width:o,ascent:s,descent:d}=t(a),f=s+d;c+o+n*2>r&&(c=0,l=u),i[a]={x:c+n,y:l+n,width:o,height:f,advance:e,anchorX:o/2,anchorY:s},c+=o+n*2,u=Math.max(u,l+f+n*2)}return{mapping:i,xOffset:c,yOffsetMin:l,yOffsetMax:u,canvasHeight:UA(u)}}function GA(e,t,n,r){let i=0;for(let a=t;a<n;a++){let t=e[a];i+=r[t]?.advance||0}return i}function KA(e,t,n,r,i,a){let o=t,s=0;for(let c=t;c<n;c++){let t=GA(e,c,c+1,i);s+t>r&&(o<c&&a.push(c),o=c,s=0),s+=t}return s}function qA(e,t,n,r,i,a){let o=t,s=t,c=t,l=0;for(let u=t;u<n;u++)if((e[u]===` `||e[u+1]===` `||u+1===n)&&(c=u+1),c>s){let t=GA(e,s,c,i);l+t>r&&(o<s&&(a.push(s),o=s,l=0),t>r&&(t=KA(e,s,c,r,i,a),o=a[a.length-1])),s=c,l+=t}return l}function JA(e,t,n,r,i=0,a){a===void 0&&(a=e.length);let o=[];return t===`break-all`?KA(e,i,a,n,r,o):qA(e,i,a,n,r,o),o}function YA(e,t,n,r,i,a){let o=0,s=0;for(let i=t;i<n;i++){let t=r[e[i]];t&&(s=Math.max(s,t.height))}for(let a=t;a<n;a++){let t=e[a],n=r[t];n?(i[a]=o+n.anchorX,o+=n.advance):(j.warn(`Missing character: ${t} (${t.codePointAt(0)})`)(),i[a]=o,o+=VA)}a[0]=o,a[1]=s}function XA(e,t,n,r,i,a){let o=Array.from(e),s=o.length,c=Array(s),l=Array(s),u=Array(s),d=(r===`break-word`||r===`break-all`)&&isFinite(i)&&i>0,f=[0,0],p=[0,0],m=0,h=t+n/2,g=0,_=0;for(let e=0;e<=s;e++){let t=o[e];if((t===`
`||e===s)&&(_=e),_>g){let e=d?JA(o,r,i,a,g,_):HA;for(let t=0;t<=e.length;t++){let r=t===0?g:e[t-1],i=t<e.length?e[t]:_;YA(o,r,i,a,c,p);for(let e=r;e<i;e++)l[e]=h,u[e]=p[0];m++,h+=n,f[0]=Math.max(f[0],p[0])}g=_}t===`
`&&(c[g]=0,l[g]=0,u[g]=0,g++)}return f[1]=m*n,{x:c,y:l,rowWidth:u,size:f}}function ZA({value:e,length:t,stride:n,offset:r,startIndices:i,characterSet:a}){let o=e.BYTES_PER_ELEMENT,s=n?n/o:1,c=r?r/o:0,l=i[t]||Math.ceil((e.length-c)/s),u=a&&new Set,d=Array(t),f=e;if(s>1||c>0){let t=e.constructor;f=new t(l);for(let t=0;t<l;t++)f[t]=e[t*s+c]}for(let e=0;e<t;e++){let t=i[e],n=i[e+1]||l,r=f.subarray(t,n);d[e]=String.fromCodePoint.apply(null,r),u&&r.forEach(u.add,u)}if(u)for(let e of u)a.add(String.fromCodePoint(e));return{texts:d,characterCount:l}}var QA=class{constructor(e=5){this._cache={},this._order=[],this.limit=e}get(e){let t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?(this.delete(e),this._cache[e]=t,this._appendOrder(e)):(Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e))}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){let t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}};function $A(){let e=[];for(let t=32;t<128;t++)e.push(String.fromCharCode(t));return e}var ej={fontFamily:`Monaco, monospace`,fontWeight:`normal`,characterSet:$A(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},tj=1024,nj=.9,rj=.3,ij=3,aj=new QA(ij);function oj(e,t){let n;n=typeof t==`string`?new Set(Array.from(t)):new Set(t);let r=aj.get(e);if(!r)return n;for(let e in r.mapping)n.has(e)&&n.delete(e);return n}function sj(e,t){for(let n=0;n<e.length;n++)t.data[4*n+3]=e[n]}function cj(e,t,n,r){e.font=`${r} ${n}px ${t}`,e.fillStyle=`#000`,e.textBaseline=`alphabetic`,e.textAlign=`left`}function lj(e,t,n){if(n===void 0){let n=e.measureText(`A`);return n.fontBoundingBoxAscent?{advance:0,width:0,ascent:Math.ceil(n.fontBoundingBoxAscent),descent:Math.ceil(n.fontBoundingBoxDescent)}:{advance:0,width:0,ascent:t*nj,descent:t*rj}}let r=e.measureText(n);return r.actualBoundingBoxAscent?{advance:r.width,width:Math.ceil(r.actualBoundingBoxRight-r.actualBoundingBoxLeft),ascent:Math.ceil(r.actualBoundingBoxAscent),descent:Math.ceil(r.actualBoundingBoxDescent)}:{advance:r.width,width:r.width,ascent:t*nj,descent:t*rj}}function uj(e){j.assert(Number.isFinite(e)&&e>=ij,`Invalid cache limit`),aj=new QA(e)}var dj=class{constructor(){this.props={...ej}}get atlas(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}setProps(e={}){Object.assign(this.props,e),e._getFontRenderer&&(this._getFontRenderer=e._getFontRenderer),this._key=this._getKey();let t=oj(this._key,this.props.characterSet),n=aj.get(this._key);if(n&&t.size===0){this._atlas!==n&&(this._atlas=n);return}let r=this._generateFontAtlas(t,n);this._atlas=r,aj.set(this._key,r)}_generateFontAtlas(e,t){let{fontFamily:n,fontWeight:r,fontSize:i,buffer:a,sdf:o,radius:s,cutoff:c}=this.props,l=t&&t.data;l||(l=document.createElement(`canvas`),l.width=tj);let u=l.getContext(`2d`,{willReadFrequently:!0});cj(u,n,i,r);let d=e=>lj(u,i,e),f;this._getFontRenderer?f=this._getFontRenderer(this.props):o&&(f={measure:d,draw:fj(this.props)});let{mapping:p,canvasHeight:m,xOffset:h,yOffsetMin:g,yOffsetMax:_}=WA({measureText:e=>f?f.measure(e):d(e),buffer:a,characterSet:e,maxCanvasWidth:tj,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffsetMin:t.yOffsetMin,yOffsetMax:t.yOffsetMax}});if(l.height!==m){let e=l.height>0?u.getImageData(0,0,l.width,l.height):null;l.height=m,e&&u.putImageData(e,0,0)}if(cj(u,n,i,r),f)for(let t of e){let e=p[t],n=e.width,{data:r,left:i=0,top:a=0}=f.draw(t),o=e.x-i,s=e.y-a,c=Math.max(0,Math.round(o)),d=Math.max(0,Math.round(s)),m=Math.min(r.width,l.width-c),h=Math.min(r.height,l.height-d);u.putImageData(r,c,d,0,0,m,h),e.x=c,e.y=d,e.width=m,e.height=h,e.anchorX+=m/2-i-n/2,e.anchorY+=a}else for(let t of e){let e=p[t];u.fillText(t,e.x,e.y+e.anchorY)}let v=f?f.measure():d();return{baselineOffset:(v.ascent-v.descent)/2,xOffset:h,yOffsetMin:g,yOffsetMax:_,mapping:p,data:l,width:l.width,height:l.height}}_getKey(){let{fontFamily:e,fontWeight:t,fontSize:n,buffer:r,sdf:i,radius:a,cutoff:o}=this.props;return i?`${e} ${t} ${n} ${r} ${a} ${o}`:`${e} ${t} ${n} ${r}`}};function fj({fontSize:e,buffer:t,radius:n,cutoff:r,fontFamily:i,fontWeight:a}){let o=new RA({fontSize:e,buffer:t,radius:n,cutoff:r,fontFamily:i,fontWeight:`${a}`});return e=>{let{data:n,width:r,height:i}=o.draw(e),a=new ImageData(r,i);return sj(n,a),{data:a,left:t,top:t}}}var pj=`struct TextBackgroundUniforms {
  billboard: f32,
  sizeScale: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  borderRadius: vec4<f32>,
  padding: vec4<f32>,
  sizeUnits: i32,
  stroked: f32,
};

@group(0) @binding(auto) var<uniform> textBackground: TextBackgroundUniforms;
`,mj=`layout(std140) uniform textBackgroundUniforms {
  bool billboard;
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  vec4 borderRadius;
  vec4 padding;
  highp int sizeUnits;
  bool stroked;
} textBackground;
`,hj={name:`textBackground`,source:pj,vs:mj,fs:mj,uniformTypes:{billboard:`f32`,sizeScale:`f32`,sizeMinPixels:`f32`,sizeMaxPixels:`f32`,borderRadius:`vec4<f32>`,padding:`vec4<f32>`,sizeUnits:`i32`,stroked:`f32`}},gj=`#version 300 es
#define SHADER_NAME text-background-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceRects;
in vec4 instanceClipRect;
in float instanceSizes;
in float instanceAngles;
in vec2 instancePixelOffsets;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
out vec4 vFillColor;
out vec4 vLineColor;
out float vLineWidth;
out vec2 uv;
out vec2 dimensions;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = radians(angle);
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = picking_getPickingColorFromInstanceID();
uv = positions;
vLineWidth = instanceLineWidths;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * textBackground.sizeScale, textBackground.sizeUnits),
textBackground.sizeMinPixels, textBackground.sizeMaxPixels
);
float instanceScale = sizePixels / text.fontSize;
dimensions = instanceRects.zw * instanceScale + textBackground.padding.xy + textBackground.padding.zw;
vec2 pixelOffset = (positions * instanceRects.zw + instanceRects.xy) * instanceScale + mix(-textBackground.padding.xy, textBackground.padding.zw, positions);
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles);
pixelOffset += instancePixelOffsets;
pixelOffset.y *= -1.0;
vec2 xy = project_size_to_pixel(instanceClipRect.xy);
vec2 wh = project_size_to_pixel(instanceClipRect.zw);
if (text.flipY) {
xy.y = -xy.y - wh.y;
}
if (instanceClipRect.z >= 0.0) {
dimensions.x = wh.x;
pixelOffset.x = xy.x + uv.x * wh.x + mix(-textBackground.padding.x, textBackground.padding.z, uv.x);
}
if (instanceClipRect.w >= 0.0) {
dimensions.y = wh.y;
pixelOffset.y = xy.y + uv.y * wh.y + mix(-textBackground.padding.y, textBackground.padding.w, uv.y);
}
if (textBackground.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
if (text.flipY) {
offset_common.y *= -1.;
}
DECKGL_FILTER_SIZE(offset_common, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vFillColor, geometry);
vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,_j=`#version 300 es
#define SHADER_NAME text-background-layer-fragment-shader
precision highp float;
in vec4 vFillColor;
in vec4 vLineColor;
in float vLineWidth;
in vec2 uv;
in vec2 dimensions;
out vec4 fragColor;
float round_rect(vec2 p, vec2 size, vec4 radii) {
vec2 pixelPositionCB = (p - 0.5) * size;
vec2 sizeCB = size * 0.5;
float maxBorderRadius = min(size.x, size.y) * 0.5;
vec4 borderRadius = vec4(min(radii, maxBorderRadius));
borderRadius.xy =
(pixelPositionCB.x > 0.0) ? borderRadius.xy : borderRadius.zw;
borderRadius.x = (pixelPositionCB.y > 0.0) ? borderRadius.x : borderRadius.y;
vec2 q = abs(pixelPositionCB) - sizeCB + borderRadius.x;
return -(min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - borderRadius.x);
}
float rect(vec2 p, vec2 size) {
vec2 pixelPosition = p * size;
return min(min(pixelPosition.x, size.x - pixelPosition.x),
min(pixelPosition.y, size.y - pixelPosition.y));
}
vec4 get_stroked_fragColor(float dist) {
float isBorder = smoothedge(dist, vLineWidth);
return mix(vFillColor, vLineColor, isBorder);
}
void main(void) {
geometry.uv = uv;
if (textBackground.borderRadius != vec4(0.0)) {
float distToEdge = round_rect(uv, dimensions, textBackground.borderRadius);
float shapeAlpha = smoothedge(-distToEdge, 0.0);
if (shapeAlpha == 0.0) {
discard;
}
if (textBackground.stroked) {
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
fragColor.a *= shapeAlpha;
} else {
if (textBackground.stroked) {
float distToEdge = rect(uv, dimensions);
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,vj=`struct TextUniforms {
  cutoffPixels: vec2<f32>,
  align: vec2<i32>,
  fontSize: f32,
  flipY: f32,
};

@group(0) @binding(auto) var<uniform> text: TextUniforms;

fn rotate_by_angle(vertex: vec2<f32>, angle: f32) -> vec2<f32> {
  let angleRadian = radians(angle);
  let cosine = cos(angleRadian);
  let sine = sin(angleRadian);
  let rotationMatrix = mat2x2<f32>(
    vec2<f32>(cosine, -sine),
    vec2<f32>(sine, cosine)
  );
  return rotationMatrix * vertex;
}

struct Attributes {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec2<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceSizes: f32,
  @location(4) instanceAngles: f32,
  @location(5) instanceRects: vec4<f32>,
  @location(6) instanceClipRect: vec4<f32>,
  @location(7) instancePixelOffsets: vec2<f32>,
  @location(8) instanceFillColors: vec4<f32>,
  @location(9) instanceLineColors: vec4<f32>,
  @location(10) instanceLineWidths: f32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vFillColor: vec4<f32>,
  @location(1) vLineColor: vec4<f32>,
  @location(2) vLineWidth: f32,
  @location(3) uv: vec2<f32>,
  @location(4) dimensions: vec2<f32>,
  @location(5) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  geometry.worldPosition = attributes.instancePositions;
  geometry.uv = attributes.positions;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex);

  var varyings: Varyings;
  varyings.uv = attributes.positions;
  varyings.vLineWidth = attributes.instanceLineWidths;

  let sizePixels = clamp(
    project_unit_size_to_pixel(
      attributes.instanceSizes * textBackground.sizeScale,
      textBackground.sizeUnits
    ),
    textBackground.sizeMinPixels,
    textBackground.sizeMaxPixels
  );
  let instanceScale = sizePixels / text.fontSize;

  varyings.dimensions = attributes.instanceRects.zw * instanceScale +
    textBackground.padding.xy + textBackground.padding.zw;

  var pixelOffset =
    (attributes.positions * attributes.instanceRects.zw + attributes.instanceRects.xy) *
      instanceScale +
    mix(-textBackground.padding.xy, textBackground.padding.zw, attributes.positions);
  pixelOffset = rotate_by_angle(pixelOffset, attributes.instanceAngles);
  pixelOffset = pixelOffset + attributes.instancePixelOffsets;
  pixelOffset.y = pixelOffset.y * -1.0;

  var xy = project_size_vec2(attributes.instanceClipRect.xy) * project.scale;
  let wh = project_size_vec2(attributes.instanceClipRect.zw) * project.scale;
  if (text.flipY > 0.5) {
    xy.y = -xy.y - wh.y;
  }
  if (attributes.instanceClipRect.z >= 0.0) {
    varyings.dimensions.x = wh.x;
    pixelOffset.x = xy.x + varyings.uv.x * wh.x + mix(
      -textBackground.padding.x,
      textBackground.padding.z,
      varyings.uv.x
    );
  }
  if (attributes.instanceClipRect.w >= 0.0) {
    varyings.dimensions.y = wh.y;
    pixelOffset.y = xy.y + varyings.uv.y * wh.y + mix(
      -textBackground.padding.y,
      textBackground.padding.w,
      varyings.uv.y
    );
  }

  if (textBackground.billboard > 0.5) {
    var position = project_position_to_clipspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      vec3<f32>(0.0)
    );
    let clipOffset = project_pixel_size_to_clipspace(pixelOffset);
    position = vec4<f32>(
      position.x + clipOffset.x,
      position.y + clipOffset.y,
      position.z,
      position.w
    );
    varyings.position = position;
  } else {
    var offsetCommon = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    if (text.flipY > 0.5) {
      offsetCommon.y = offsetCommon.y * -1.0;
    }
    varyings.position = project_position_to_clipspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      offsetCommon
    );
  }

  varyings.vFillColor = vec4<f32>(
    attributes.instanceFillColors.rgb,
    attributes.instanceFillColors.a * layer.opacity
  );
  varyings.vLineColor = vec4<f32>(
    attributes.instanceLineColors.rgb,
    attributes.instanceLineColors.a * layer.opacity
  );
  varyings.pickingColor = geometry.pickingColor;
  return varyings;
}

fn round_rect(point: vec2<f32>, size: vec2<f32>, radii: vec4<f32>) -> f32 {
  let pixelPosition = (point - 0.5) * size;
  let halfSize = size * 0.5;
  let maxBorderRadius = min(size.x, size.y) * 0.5;
  var borderRadius = min(radii, vec4<f32>(maxBorderRadius));

  borderRadius = select(borderRadius.zwxy, borderRadius, pixelPosition.x > 0.0);
  let radius = select(borderRadius.y, borderRadius.x, pixelPosition.y > 0.0);
  let q = abs(pixelPosition) - halfSize + radius;
  return -(min(max(q.x, q.y), 0.0) + length(max(q, vec2<f32>(0.0))) - radius);
}

fn rect(point: vec2<f32>, size: vec2<f32>) -> f32 {
  let pixelPosition = point * size;
  return min(
    min(pixelPosition.x, size.x - pixelPosition.x),
    min(pixelPosition.y, size.y - pixelPosition.y)
  );
}

fn get_stroked_frag_color(
  distanceToEdge: f32,
  lineWidth: f32,
  fillColor: vec4<f32>,
  lineColor: vec4<f32>
) -> vec4<f32> {
  let isBorder = smoothedge(distanceToEdge, lineWidth);
  return mix(fillColor, lineColor, isBorder);
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = varyings.uv;
  var fragColor: vec4<f32>;

  if (any(textBackground.borderRadius != vec4<f32>(0.0))) {
    let distanceToEdge = round_rect(
      varyings.uv,
      varyings.dimensions,
      textBackground.borderRadius
    );
    let shapeAlpha = smoothedge(-distanceToEdge, 0.0);
    if (shapeAlpha == 0.0) {
      discard;
    }
    if (textBackground.stroked > 0.5) {
      fragColor = get_stroked_frag_color(
        distanceToEdge,
        varyings.vLineWidth,
        varyings.vFillColor,
        varyings.vLineColor
      );
    } else {
      fragColor = varyings.vFillColor;
    }
    fragColor.a = fragColor.a * shapeAlpha;
  } else if (textBackground.stroked > 0.5) {
    let distanceToEdge = rect(varyings.uv, varyings.dimensions);
    fragColor = get_stroked_frag_color(
      distanceToEdge,
      varyings.vLineWidth,
      varyings.vFillColor,
      varyings.vLineColor
    );
  } else {
    fragColor = varyings.vFillColor;
  }

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(varyings.pickingColor - highlightedObjectColor))) {
      let highlightAlpha = picking.highlightColor.a;
      let blendedAlpha = highlightAlpha + fragColor.a * (1.0 - highlightAlpha);
      if (blendedAlpha > 0.0) {
        let highlightRatio = highlightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highlightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  return deckgl_premultiplied_alpha(fragColor);
}
`,yj={billboard:!0,sizeScale:1,sizeUnits:`pixels`,sizeMinPixels:0,sizeMaxPixels:2**53-1,fontSize:1,borderRadius:{type:`object`,value:0},padding:{type:`array`,value:[0,0,0,0]},getPosition:{type:`accessor`,value:e=>e.position},getSize:{type:`accessor`,value:1},getAngle:{type:`accessor`,value:0},getPixelOffset:{type:`accessor`,value:[0,0]},getBoundingRect:{type:`accessor`,value:[0,0,0,0]},getClipRect:{type:`accessor`,value:[0,0,-1,-1]},getFillColor:{type:`accessor`,value:[0,0,0,255]},getLineColor:{type:`accessor`,value:[0,0,0,255]},getLineWidth:{type:`accessor`,value:1}},bj=class extends kg{getShaders(){return super.getShaders({vs:gj,fs:_j,source:vj,modules:[Hl,Os,Uu,hj,OA]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:`float64`,fp64:this.use64bitPositions(),transition:!0,accessor:`getPosition`},instanceSizes:{size:1,transition:!0,bufferGroup:`text-background-instance-data`,accessor:`getSize`,defaultValue:1},instanceAngles:{size:1,transition:!0,bufferGroup:`text-background-instance-data`,accessor:`getAngle`},instanceRects:{size:4,bufferGroup:`text-background-instance-data`,accessor:`getBoundingRect`},instanceClipRect:{size:4,bufferGroup:`text-background-instance-data`,accessor:`getClipRect`,defaultValue:[0,0,-1,-1]},instancePixelOffsets:{size:2,transition:!0,bufferGroup:`text-background-instance-data`,accessor:`getPixelOffset`},instanceFillColors:{size:4,transition:!0,type:`unorm8`,accessor:`getFillColor`,defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,type:`unorm8`,accessor:`getLineColor`,defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,bufferGroup:`text-background-instance-data`,accessor:`getLineWidth`,defaultValue:1}})}updateState(e){super.updateState(e);let{changeFlags:t}=e;t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{billboard:t,sizeScale:n,sizeUnits:r,sizeMinPixels:i,sizeMaxPixels:a,getLineWidth:o,fontSize:s}=this.props,{padding:c,borderRadius:l}=this.props;c.length<4&&(c=[c[0],c[1],c[0],c[1]]),Array.isArray(l)||(l=[l,l,l,l]);let u=this.state.model,d={billboard:t,stroked:!!o,borderRadius:l,padding:c,sizeUnits:bl[r],sizeScale:n,sizeMinPixels:i,sizeMaxPixels:a},f={fontSize:s,viewport:this.context.viewport};u.shaderInputs.setProps({textBackground:d,text:f}),u.draw(this.context.renderPass)}_getModel(){let e=[0,0,1,0,0,1,1,1];return new de(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new fe({topology:`triangle-strip`,vertexCount:4,attributes:{positions:{size:2,value:new Float32Array(e)}}}),isInstanced:!0})}};bj.defaultProps=yj,bj.layerName=`TextBackgroundLayer`;var xj={start:1,middle:0,end:-1},Sj={top:1,center:0,bottom:-1},Cj=[0,0,0,255],wj={billboard:!0,sizeScale:1,sizeUnits:`pixels`,sizeMinPixels:0,sizeMaxPixels:2**53-1,background:!1,getBackgroundColor:{type:`accessor`,value:[255,255,255,255]},getBorderColor:{type:`accessor`,value:Cj},getBorderWidth:{type:`accessor`,value:0},backgroundBorderRadius:{type:`object`,value:0},backgroundPadding:{type:`array`,value:[0,0,0,0]},characterSet:{type:`object`,value:ej.characterSet},fontFamily:ej.fontFamily,fontWeight:ej.fontWeight,lineHeight:1,outlineWidth:{type:`number`,value:0,min:0},outlineColor:{type:`color`,value:Cj},fontSettings:{type:`object`,value:{},compare:1},wordBreak:`break-word`,maxWidth:{type:`number`,value:-1},contentCutoffPixels:{type:`array`,value:[0,0]},contentAlignHorizontal:`none`,contentAlignVertical:`none`,getText:{type:`accessor`,value:e=>e.text},getPosition:{type:`accessor`,value:e=>e.position},getColor:{type:`accessor`,value:Cj},getSize:{type:`accessor`,value:32},getAngle:{type:`accessor`,value:0},getTextAnchor:{type:`accessor`,value:`middle`},getAlignmentBaseline:{type:`accessor`,value:`center`},getPixelOffset:{type:`accessor`,value:[0,0]},getContentBox:{type:`accessor`,value:[0,0,-1,-1]},backgroundColor:{deprecatedFor:[`background`,`getBackgroundColor`]}},Tj=class extends Fg{constructor(){super(...arguments),this.getBoundingRect=(e,t)=>{let{size:[n,r]}=this.transformParagraph(e,t),{getTextAnchor:i,getAlignmentBaseline:a}=this.props,o=xj[typeof i==`function`?i(e,t):i],s=Sj[typeof a==`function`?a(e,t):a];return[(o-1)*n/2,(s-1)*r/2,n,r]},this.getIconOffsets=(e,t)=>{let{getTextAnchor:n,getAlignmentBaseline:r}=this.props,{x:i,y:a,rowWidth:o,size:[,s]}=this.transformParagraph(e,t),c=xj[typeof n==`function`?n(e,t):n],l=Sj[typeof r==`function`?r(e,t):r],u=i.length,d=Array(u*2),f=0;for(let e=0;e<u;e++)d[f++]=(c-1)*o[e]/2+i[e],d[f++]=(l-1)*s/2+a[e];return d}}initializeState(){this.state={styleVersion:0,fontAtlasManager:new dj},this.props.maxWidth>0&&j.once(1,`v8.9 breaking change: TextLayer maxWidth is now relative to text size`)()}updateState(e){let{props:t,oldProps:n,changeFlags:r}=e;(r.dataChanged||r.updateTriggersChanged&&(r.updateTriggersChanged.all||r.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==n.lineHeight||t.wordBreak!==n.wordBreak||t.maxWidth!==n.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){let{fontSettings:e,fontFamily:t,fontWeight:n,_getFontRenderer:r}=this.props,{fontAtlasManager:i,characterSet:a}=this.state,o={...e,characterSet:a,fontFamily:t,fontWeight:n,_getFontRenderer:r};if(!i.mapping)return i.setProps(o),!0;for(let e in o)if(o[e]!==i.props[e])return i.setProps(o),!0;return!1}_updateText(){let{data:e,characterSet:t}=this.props,n=e.attributes?.getText,{getText:r}=this.props,i=e.startIndices,a,o=t===`auto`&&new Set;if(n&&i){let{texts:t,characterCount:s}=ZA({...ArrayBuffer.isView(n)?{value:n}:n,length:e.length,startIndices:i,characterSet:o});a=s,r=(e,{index:n})=>t[n]}else{let{iterable:t,objectInfo:n}=qp(e);i=[0],a=0;for(let e of t){n.index++;let t=Array.from(r(e,n)||``);o&&t.forEach(o.add,o),a+=t.length,i.push(a)}}this.setState({getText:r,startIndices:i,numInstances:a,characterSet:o||t})}transformParagraph(e,t){let{fontAtlasManager:n}=this.state,r=n.mapping,{baselineOffset:i}=n.atlas,{fontSize:a}=n.props,o=this.state.getText,{wordBreak:s,lineHeight:c,maxWidth:l}=this.props;return XA(o(e,t)||``,i,c*a,s,l*a,r)}renderLayers(){let{startIndices:e,numInstances:t,getText:n,fontAtlasManager:{atlas:r,mapping:i},styleVersion:a}=this.state,{data:o,_dataDiff:s,getPosition:c,getColor:l,getSize:u,getAngle:d,getPixelOffset:f,getBackgroundColor:p,getBorderColor:m,getBorderWidth:h,getContentBox:g,backgroundBorderRadius:_,backgroundPadding:v,background:y,billboard:b,fontSettings:x,outlineWidth:S,outlineColor:C,sizeScale:ee,sizeUnits:w,sizeMinPixels:te,sizeMaxPixels:ne,contentCutoffPixels:re,contentAlignHorizontal:ie,contentAlignVertical:ae,transitions:T,updateTriggers:E}=this.props,oe=this.getSubLayerClass(`characters`,FA),se=this.getSubLayerClass(`background`,bj),{fontSize:ce}=this.state.fontAtlasManager.props;return[y&&new se({getFillColor:p,getLineColor:m,getLineWidth:h,borderRadius:_,padding:v,getPosition:c,getSize:u,getAngle:d,getPixelOffset:f,getClipRect:g,billboard:b,sizeScale:ee,sizeUnits:w,sizeMinPixels:te,sizeMaxPixels:ne,fontSize:ce,transitions:T&&{getPosition:T.getPosition,getAngle:T.getAngle,getSize:T.getSize,getFillColor:T.getBackgroundColor,getLineColor:T.getBorderColor,getLineWidth:T.getBorderWidth,getPixelOffset:T.getPixelOffset}},this.getSubLayerProps({id:`background`,updateTriggers:{getPosition:E.getPosition,getAngle:E.getAngle,getSize:E.getSize,getFillColor:E.getBackgroundColor,getLineColor:E.getBorderColor,getLineWidth:E.getBorderWidth,getPixelOffset:E.getPixelOffset,getBoundingRect:{getText:E.getText,getTextAnchor:E.getTextAnchor,getAlignmentBaseline:E.getAlignmentBaseline,styleVersion:a}}}),{data:o.attributes&&o.attributes.background?{length:o.length,attributes:o.attributes.background}:o,_dataDiff:s,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new oe({sdf:x.sdf,smoothing:Number.isFinite(x.smoothing)?x.smoothing:ej.smoothing,outlineWidth:S/(x.radius||ej.radius),outlineColor:C,iconAtlas:r,iconMapping:i,getPosition:c,getColor:l,getSize:u,getAngle:d,getPixelOffset:f,getContentBox:g,billboard:b,sizeScale:ee,sizeUnits:w,sizeMinPixels:te,sizeMaxPixels:ne,fontSize:ce,contentCutoffPixels:re,contentAlignHorizontal:ie,contentAlignVertical:ae,transitions:T&&{getPosition:T.getPosition,getAngle:T.getAngle,getColor:T.getColor,getSize:T.getSize,getPixelOffset:T.getPixelOffset,getContentBox:T.getContentBox}},this.getSubLayerProps({id:`characters`,updateTriggers:{all:E.getText,getPosition:E.getPosition,getAngle:E.getAngle,getColor:E.getColor,getSize:E.getSize,getPixelOffset:E.getPixelOffset,getContentBox:E.getContentBox,getIconOffsets:{getTextAnchor:E.getTextAnchor,getAlignmentBaseline:E.getAlignmentBaseline,styleVersion:a}}}),{data:o,_dataDiff:s,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:n})]}static set fontAtlasCacheLimit(e){uj(e)}};Tj.defaultProps=wj,Tj.layerName=`TextLayer`;var Ej=`core-features-and-limits`,Dj=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function Oj(e){let t={};for(let n of Dj){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function kj(e){return e.featureLevel??`core`}function Aj(e){let t=kj(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!==`default`&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function jj(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(Ej)&&r.push(Ej);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function Mj(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(Ej)?`core`:e===`best-available`?`compatibility`:e}function Nj(e,t){return e===`core`?`core`:Mj(`compatibility`,t)}var Pj=new class extends At{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){return await this._create(e,!0)}async _create(e,n){if(typeof navigator>`u`||!navigator.gpu)throw Error(`WebGPU is not available`);let r=kj(e),i=Aj(e),a;try{a=await this.requestGPUAdapter(i)}catch(e){throw Error(`WebGPU adapter request failed`,{cause:e})}if(!a)throw Error(`Failed to request WebGPU adapter`);let o=await Fj(a),s={},c=jj(a.features,r,e.optionalFeatures);c.length>0&&(s.requiredFeatures=c);let l={...r===`max`?Oj(a.limits):{},...e.requiredLimits};Object.keys(l).length>0&&(s.requiredLimits=l);let u;try{u=await a.requestDevice(s)}catch(e){throw Error(`WebGPU device request failed`,{cause:e})}let d=await Ij(u);if(d){if(u.destroy(),n&&d.reason!==`destroyed`)return t.warn(`WebGPU device was returned already lost; retrying with a fresh adapter`)(),await this._create(e,!1);throw Error(`WebGPU device was returned already lost${d.message?`: ${d.message}`:``}`,{cause:d})}let{WebGPUDevice:f}=await et(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-ClLqdlI4.js`);return{WebGPUDevice:e}},__vite__mapDeps([14,3,1,9,5,11])),p=Mj(r,u.features),m={...e,featureLevel:p};t.groupCollapsed(1,`WebGPUDevice created`)();try{let e;try{e=new f(m,u,a,o)}catch(e){throw u.destroy(),Error(`WebGPU wrapper initialization failed`,{cause:e})}let n=f.getCanvasContextProps(m);if(n)try{e.initializeCanvasContext(n)}catch(t){throw e.destroy(),Error(`WebGPU canvas initialization failed`,{cause:t})}return t.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),t.table(1,e.info)(),e}finally{t.groupEnd(1)()}}async attach(e,t={}){let{WebGPUDevice:n}=await et(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-ClLqdlI4.js`);return{WebGPUDevice:e}},__vite__mapDeps([14,3,1,9,5,11]));if(e instanceof n)return e;if(!this.isDeviceHandle(e))throw Error(`Invalid GPUDevice`);let r=n.getDeviceFromHandle(e);if(r)return r;let i=await Ij(e);if(i)throw Error(`WebGPU device is already lost`,{cause:i});let a=n.getDeviceFromHandle(e);if(a)return a;let o=e.adapterInfo||{},s=Nj(t.featureLevel,e.features),c={...t,featureLevel:s,_handle:e},l=new n(c,e,null,o,!1),u=n.getCanvasContextProps(c);if(u)try{l.initializeCanvasContext(u)}catch(e){throw l.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})}return l}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}};async function Fj(e){try{return e.info||await e.requestAdapterInfo?.()||{}}catch(e){return t.warn(`WebGPU adapter metadata is unavailable`,e)(),{}}}async function Ij(e){return await Promise.race([e.lost,Promise.resolve(null)])}function Lj(e){return{type:e,adapters:e===`webgpu`?[Pj,jp]:[jp]}}function Rj({device:e,deviceType:t=`webgpu`}){return e?{device:e}:{deviceProps:Lj(t)}}var zj=class{static defaultProps={id:`panel-component`,style:{},className:``,_container:null};id;props;viewId=null;panelManager;deck;rootElement;get _container(){return this.props._container}constructor(e){this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n={...t,...e},r=this.rootElement;r&&t.className!==n.className&&(t.className&&r.classList.remove(t.className),n.className&&r.classList.add(n.className)),r&&!Hj(t.style,n.style)&&(Vj(r,t.style),Bj(r,n.style)),this.props=n,this.id=n.id,this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}onCreateRootElement(){let e=document.createElement(`div`);for(let t of[`deck-widget`,this.className,this.props.className])t&&e.classList.add(t);return Bj(e,this.props.style),e}_onAdd(e){this.deck=e.deck,this.viewId=e.viewId;let t=this.onAdd(e);return t?(this.rootElement=t,t):(this.rootElement=this.onCreateRootElement(),this.rootElement)}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};function Bj(e,t){if(t)for(let[n,r]of Object.entries(t))r!=null&&e.style.setProperty(Uj(n),String(r))}function Vj(e,t){if(t)for(let n of Object.keys(t))e.style.removeProperty(Uj(n))}function Hj(e,t){if(e===t)return!0;let n=Object.keys(e??{}),r=Object.keys(t??{});return n.length===r.length?n.every(n=>e?.[n]===t?.[n]):!1}function Uj(e){return e.replace(/[A-Z]/g,e=>`-${e.toLowerCase()}`)}var Wj=class extends zj{static defaultProps={...zj.defaultProps,panel:void 0,placement:`top-left`}},Gj=`data-deck-gl-community-panels-styles`,Kj=`.deck-widget {
  margin: var(--widget-margin, 12px);
  box-sizing: border-box;
}

/* Common button container styles */
.deck-widget-button,
.deck-widget-button-group {
  background: var(--button-stroke, rgba(255, 255, 255, 0.3));
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));

  display: flex;
  align-items: center;
  justify-content: center;
}

/* Single button */
.deck-widget-button {
  width: var(--button-size, 28px);
  height: var(--button-size, 28px);
}

/* Button group */
.deck-widget-button-group {
  width: calc(var(--button-size, 28px) - 2);
  height: calc((var(--button-size, 28px) * 2) - 1);

  flex-direction: row;
  padding: 1px;
  gap: 1px;
}
.deck-widget-button-group > .deck-widget-button {
  display: contents;
}

.deck-widget-button-group.vertical {
  display: inline-flex;
  flex-direction: column;
}

/* Common button background styles */
.deck-widget-button-group button,
.deck-widget-button button {
  width: calc(var(--button-size, 28px) - 2px);
  height: calc(var(--button-size, 28px) - 2px);

  box-sizing: border-box;
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  border: var(--button-inner-stroke, unset);
  border-radius: calc(var(--button-corner-radius, 8px) - 1px);

  pointer-events: auto;
  cursor: pointer;
  outline: none;
  padding: 0;
}

/* Border radius adjustments for grouped buttons */
.deck-widget-button-group.vertical > *:not(:last-child),
.deck-widget-button-group.vertical > *:not(:last-child) > button {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.deck-widget-button-group.vertical > *:not(:first-child),
.deck-widget-button-group.vertical > *:not(:first-child) > button {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.deck-widget-button-group.horizontal > *:not(:last-child),
.deck-widget-button-group.horizontal > *:not(:last-child) > button {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.deck-widget-button-group.horizontal > *:not(:first-child),
.deck-widget-button-group.horizontal > *:not(:first-child) > button {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* Icon button foreground styles */
.deck-widget button .deck-widget-icon {
  background-color: var(--button-icon-idle, #616166);
  background-position: 50%;
  background-repeat: no-repeat;
  display: block;
  height: 100%;
  width: 100%;
}

.deck-widget button .deck-widget-icon:hover {
  background-color: var(--button-icon-hover, rgb(24, 24, 26));
}

/* Icon menu styles */
.deck-widget .deck-widget-icon-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--menu-gap, 4px);
  z-index: 100;
}

/* Fullscreen styles */
.deck-widget.deck-widget-fullscreen button.deck-widget-fullscreen-enter .deck-widget-icon {
  mask-image: var(
    --icon-fullscreen-enter,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M7.90474 20.0953H10.6286C10.8984 20.0953 11.1246 20.1868 11.3071 20.37C11.4897 20.5532 11.5809 20.7802 11.5809 21.051C11.5809 21.3218 11.4897 21.5476 11.3071 21.7286C11.1246 21.9095 10.8984 22 10.6286 22H6.95237C6.68254 22 6.45635 21.9087 6.2738 21.7262C6.09127 21.5436 6 21.3175 6 21.0476V17.3714C6 17.1016 6.09159 16.8754 6.27477 16.6929C6.45795 16.5103 6.68493 16.4191 6.95571 16.4191C7.2265 16.4191 7.45236 16.5103 7.63331 16.6929C7.81427 16.8754 7.90474 17.1016 7.90474 17.3714V20.0953ZM7.90474 7.90474V10.6286C7.90474 10.8984 7.81315 11.1246 7.62997 11.3071C7.44679 11.4897 7.21981 11.5809 6.94903 11.5809C6.67825 11.5809 6.45238 11.4897 6.27143 11.3071C6.09048 11.1246 6 10.8984 6 10.6286V6.95237C6 6.68254 6.09127 6.45635 6.2738 6.2738C6.45635 6.09127 6.68254 6 6.95237 6H10.6286C10.8984 6 11.1246 6.09159 11.3071 6.27477C11.4897 6.45795 11.5809 6.68493 11.5809 6.95571C11.5809 7.2265 11.4897 7.45236 11.3071 7.63331C11.1246 7.81427 10.8984 7.90474 10.6286 7.90474H7.90474ZM20.0953 20.0953V17.3714C20.0953 17.1016 20.1868 16.8754 20.37 16.6929C20.5532 16.5103 20.7802 16.4191 21.051 16.4191C21.3218 16.4191 21.5476 16.5103 21.7286 16.6929C21.9095 16.8754 22 17.1016 22 17.3714V21.0476C22 21.3175 21.9087 21.5436 21.7262 21.7262C21.5436 21.9087 21.3175 22 21.0476 22H17.3714C17.1016 22 16.8754 21.9084 16.6929 21.7252C16.5103 21.542 16.4191 21.3151 16.4191 21.0443C16.4191 20.7735 16.5103 20.5476 16.6929 20.3667C16.8754 20.1857 17.1016 20.0953 17.3714 20.0953H20.0953ZM20.0953 7.90474H17.3714C17.1016 7.90474 16.8754 7.81315 16.6929 7.62997C16.5103 7.44679 16.4191 7.21981 16.4191 6.94903C16.4191 6.67825 16.5103 6.45238 16.6929 6.27143C16.8754 6.09048 17.1016 6 17.3714 6H21.0476C21.3175 6 21.5436 6.09127 21.7262 6.2738C21.9087 6.45635 22 6.68254 22 6.95237V10.6286C22 10.8984 21.9084 11.1246 21.7252 11.3071C21.542 11.4897 21.3151 11.5809 21.0443 11.5809C20.7735 11.5809 20.5476 11.4897 20.3667 11.3071C20.1857 11.1246 20.0953 10.8984 20.0953 10.6286V7.90474Z" /></svg>')
  );
  -webkit-mask-image: var(
    --icon-fullscreen-enter,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M7.90474 20.0953H10.6286C10.8984 20.0953 11.1246 20.1868 11.3071 20.37C11.4897 20.5532 11.5809 20.7802 11.5809 21.051C11.5809 21.3218 11.4897 21.5476 11.3071 21.7286C11.1246 21.9095 10.8984 22 10.6286 22H6.95237C6.68254 22 6.45635 21.9087 6.2738 21.7262C6.09127 21.5436 6 21.3175 6 21.0476V17.3714C6 17.1016 6.09159 16.8754 6.27477 16.6929C6.45795 16.5103 6.68493 16.4191 6.95571 16.4191C7.2265 16.4191 7.45236 16.5103 7.63331 16.6929C7.81427 16.8754 7.90474 17.1016 7.90474 17.3714V20.0953ZM7.90474 7.90474V10.6286C7.90474 10.8984 7.81315 11.1246 7.62997 11.3071C7.44679 11.4897 7.21981 11.5809 6.94903 11.5809C6.67825 11.5809 6.45238 11.4897 6.27143 11.3071C6.09048 11.1246 6 10.8984 6 10.6286V6.95237C6 6.68254 6.09127 6.45635 6.2738 6.2738C6.45635 6.09127 6.68254 6 6.95237 6H10.6286C10.8984 6 11.1246 6.09159 11.3071 6.27477C11.4897 6.45795 11.5809 6.68493 11.5809 6.95571C11.5809 7.2265 11.4897 7.45236 11.3071 7.63331C11.1246 7.81427 10.8984 7.90474 10.6286 7.90474H7.90474ZM20.0953 20.0953V17.3714C20.0953 17.1016 20.1868 16.8754 20.37 16.6929C20.5532 16.5103 20.7802 16.4191 21.051 16.4191C21.3218 16.4191 21.5476 16.5103 21.7286 16.6929C21.9095 16.8754 22 17.1016 22 17.3714V21.0476C22 21.3175 21.9087 21.5436 21.7262 21.7262C21.5436 21.9087 21.3175 22 21.0476 22H17.3714C17.1016 22 16.8754 21.9084 16.6929 21.7252C16.5103 21.542 16.4191 21.3151 16.4191 21.0443C16.4191 20.7735 16.5103 20.5476 16.6929 20.3667C16.8754 20.1857 17.1016 20.0953 17.3714 20.0953H20.0953ZM20.0953 7.90474H17.3714C17.1016 7.90474 16.8754 7.81315 16.6929 7.62997C16.5103 7.44679 16.4191 7.21981 16.4191 6.94903C16.4191 6.67825 16.5103 6.45238 16.6929 6.27143C16.8754 6.09048 17.1016 6 17.3714 6H21.0476C21.3175 6 21.5436 6.09127 21.7262 6.2738C21.9087 6.45635 22 6.68254 22 6.95237V10.6286C22 10.8984 21.9084 11.1246 21.7252 11.3071C21.542 11.4897 21.3151 11.5809 21.0443 11.5809C20.7735 11.5809 20.5476 11.4897 20.3667 11.3071C20.1857 11.1246 20.0953 10.8984 20.0953 10.6286V7.90474Z" /></svg>')
  );
}

.deck-widget.deck-widget-fullscreen button.deck-widget-fullscreen-exit .deck-widget-icon {
  mask-image: var(
    --icon-fullscreen-exit,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M9.6762 18.3238H6.95237C6.68254 18.3238 6.45635 18.2322 6.2738 18.049C6.09127 17.8658 6 17.6389 6 17.3681C6 17.0973 6.09127 16.8714 6.2738 16.6905C6.45635 16.5095 6.68254 16.4191 6.95237 16.4191H10.6286C10.8984 16.4191 11.1246 16.5103 11.3071 16.6929C11.4897 16.8754 11.5809 17.1016 11.5809 17.3714V21.0476C11.5809 21.3175 11.4894 21.5436 11.3062 21.7262C11.123 21.9087 10.896 22 10.6252 22C10.3544 22 10.1286 21.9087 9.94763 21.7262C9.76668 21.5436 9.6762 21.3175 9.6762 21.0476V18.3238ZM18.3238 18.3238V21.0476C18.3238 21.3175 18.2322 21.5436 18.049 21.7262C17.8658 21.9087 17.6389 22 17.3681 22C17.0973 22 16.8714 21.9087 16.6905 21.7262C16.5095 21.5436 16.4191 21.3175 16.4191 21.0476V17.3714C16.4191 17.1016 16.5103 16.8754 16.6929 16.6929C16.8754 16.5103 17.1016 16.4191 17.3714 16.4191H21.0476C21.3175 16.4191 21.5436 16.5106 21.7262 16.6938C21.9087 16.877 22 17.104 22 17.3748C22 17.6456 21.9087 17.8714 21.7262 18.0524C21.5436 18.2333 21.3175 18.3238 21.0476 18.3238H18.3238ZM9.6762 9.6762V6.95237C9.6762 6.68254 9.76779 6.45635 9.95097 6.2738C10.1342 6.09127 10.3611 6 10.6319 6C10.9027 6 11.1286 6.09127 11.3095 6.2738C11.4905 6.45635 11.5809 6.68254 11.5809 6.95237V10.6286C11.5809 10.8984 11.4897 11.1246 11.3071 11.3071C11.1246 11.4897 10.8984 11.5809 10.6286 11.5809H6.95237C6.68254 11.5809 6.45635 11.4894 6.2738 11.3062C6.09127 11.123 6 10.896 6 10.6252C6 10.3544 6.09127 10.1286 6.2738 9.94763C6.45635 9.76668 6.68254 9.6762 6.95237 9.6762H9.6762ZM18.3238 9.6762H21.0476C21.3175 9.6762 21.5436 9.76779 21.7262 9.95097C21.9087 10.1342 22 10.3611 22 10.6319C22 10.9027 21.9087 11.1286 21.7262 11.3095C21.5436 11.4905 21.3175 11.5809 21.0476 11.5809H17.3714C17.1016 11.5809 16.8754 11.4897 16.6929 11.3071C16.5103 11.1246 16.4191 10.8984 16.4191 10.6286V6.95237C16.4191 6.68254 16.5106 6.45635 16.6938 6.2738C16.877 6.09127 17.104 6 17.3748 6C17.6456 6 17.8714 6.09127 18.0524 6.2738C18.2333 6.45635 18.3238 6.68254 18.3238 6.95237V9.6762Z" /></svg>')
  );
  -webkit-mask-image: var(
    --icon-fullscreen-exit,
    url('data:image/svg+xml,<svg fill="black" height="100%" viewBox="0 0 28 28" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M9.6762 18.3238H6.95237C6.68254 18.3238 6.45635 18.2322 6.2738 18.049C6.09127 17.8658 6 17.6389 6 17.3681C6 17.0973 6.09127 16.8714 6.2738 16.6905C6.45635 16.5095 6.68254 16.4191 6.95237 16.4191H10.6286C10.8984 16.4191 11.1246 16.5103 11.3071 16.6929C11.4897 16.8754 11.5809 17.1016 11.5809 17.3714V21.0476C11.5809 21.3175 11.4894 21.5436 11.3062 21.7262C11.123 21.9087 10.896 22 10.6252 22C10.3544 22 10.1286 21.9087 9.94763 21.7262C9.76668 21.5436 9.6762 21.3175 9.6762 21.0476V18.3238ZM18.3238 18.3238V21.0476C18.3238 21.3175 18.2322 21.5436 18.049 21.7262C17.8658 21.9087 17.6389 22 17.3681 22C17.0973 22 16.8714 21.9087 16.6905 21.7262C16.5095 21.5436 16.4191 21.3175 16.4191 21.0476V17.3714C16.4191 17.1016 16.5103 16.8754 16.6929 16.6929C16.8754 16.5103 17.1016 16.4191 17.3714 16.4191H21.0476C21.3175 16.4191 21.5436 16.5106 21.7262 16.6938C21.9087 16.877 22 17.104 22 17.3748C22 17.6456 21.9087 17.8714 21.7262 18.0524C21.5436 18.2333 21.3175 18.3238 21.0476 18.3238H18.3238ZM9.6762 9.6762V6.95237C9.6762 6.68254 9.76779 6.45635 9.95097 6.2738C10.1342 6.09127 10.3611 6 10.6319 6C10.9027 6 11.1286 6.09127 11.3095 6.2738C11.4905 6.45635 11.5809 6.68254 11.5809 6.95237V10.6286C11.5809 10.8984 11.4897 11.1246 11.3071 11.3071C11.1246 11.4897 10.8984 11.5809 10.6286 11.5809H6.95237C6.68254 11.5809 6.45635 11.4894 6.2738 11.3062C6.09127 11.123 6 10.896 6 10.6252C6 10.3544 6.09127 10.1286 6.2738 9.94763C6.45635 9.76668 6.68254 9.6762 6.95237 9.6762H9.6762ZM18.3238 9.6762H21.0476C21.3175 9.6762 21.5436 9.76779 21.7262 9.95097C21.9087 10.1342 22 10.3611 22 10.6319C22 10.9027 21.9087 11.1286 21.7262 11.3095C21.5436 11.4905 21.3175 11.5809 21.0476 11.5809H17.3714C17.1016 11.5809 16.8754 11.4897 16.6929 11.3071C16.5103 11.1246 16.4191 10.8984 16.4191 10.6286V6.95237C16.4191 6.68254 16.5106 6.45635 16.6938 6.2738C16.877 6.09127 17.104 6 17.3748 6C17.6456 6 17.8714 6.09127 18.0524 6.2738C18.2333 6.45635 18.3238 6.68254 18.3238 6.95237V9.6762Z" /></svg>')
  );
}

.deck-pseudo-fullscreen {
  height: 100% !important;
  left: 0 !important;
  position: fixed !important;
  top: 0 !important;
  width: 100% !important;
  z-index: 99999;
}

/* Zoom styles */
.deck-widget.deck-widget-zoom button.deck-widget-zoom-in .deck-widget-icon {
  mask-image: var(
    --icon-zoom-in,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"><path d="M12.1029 13.8971H7.89332C7.64334 13.8971 7.43196 13.8105 7.25918 13.6373C7.08639 13.4641 7 13.2521 7 13.0014C7 12.7508 7.08639 12.5396 7.25918 12.368C7.43196 12.1963 7.64334 12.1105 7.89332 12.1105H12.1029V7.90097C12.1029 7.65161 12.1895 7.43912 12.3627 7.26348C12.5359 7.08783 12.7479 7 12.9986 7C13.2492 7 13.4604 7.08783 13.632 7.26348C13.8037 7.43912 13.8895 7.65161 13.8895 7.90097V12.1105H18.099C18.3484 12.1105 18.5609 12.1971 18.7365 12.3703C18.9122 12.5436 19 12.7555 19 13.0062C19 13.2569 18.9122 13.468 18.7365 13.6397C18.5609 13.8113 18.3484 13.8971 18.099 13.8971H13.8895V18.1067C13.8895 18.3567 13.8029 18.568 13.6297 18.7408C13.4564 18.9136 13.2445 19 12.9938 19C12.7431 19 12.532 18.9136 12.3603 18.7408C12.1887 18.568 12.1029 18.3567 12.1029 18.1067V13.8971Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-zoom-in,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"><path d="M12.1029 13.8971H7.89332C7.64334 13.8971 7.43196 13.8105 7.25918 13.6373C7.08639 13.4641 7 13.2521 7 13.0014C7 12.7508 7.08639 12.5396 7.25918 12.368C7.43196 12.1963 7.64334 12.1105 7.89332 12.1105H12.1029V7.90097C12.1029 7.65161 12.1895 7.43912 12.3627 7.26348C12.5359 7.08783 12.7479 7 12.9986 7C13.2492 7 13.4604 7.08783 13.632 7.26348C13.8037 7.43912 13.8895 7.65161 13.8895 7.90097V12.1105H18.099C18.3484 12.1105 18.5609 12.1971 18.7365 12.3703C18.9122 12.5436 19 12.7555 19 13.0062C19 13.2569 18.9122 13.468 18.7365 13.6397C18.5609 13.8113 18.3484 13.8971 18.099 13.8971H13.8895V18.1067C13.8895 18.3567 13.8029 18.568 13.6297 18.7408C13.4564 18.9136 13.2445 19 12.9938 19C12.7431 19 12.532 18.9136 12.3603 18.7408C12.1887 18.568 12.1029 18.3567 12.1029 18.1067V13.8971Z"/></svg>')
  );
}

.deck-widget.deck-widget-zoom button.deck-widget-zoom-out .deck-widget-icon {
  mask-image: var(
    --icon-zoom-out,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"> wBox="0 0 26 26" fill="none"><path d="M7.89332 13.8866C7.64334 13.8866 7.43196 13.8 7.25918 13.6268C7.08639 13.4535 7 13.2416 7 12.9909C7 12.7403 7.08639 12.5291 7.25918 12.3575C7.43196 12.1858 7.64334 12.1 7.89332 12.1H18.099C18.349 12.1 18.5617 12.1866 18.737 12.3598C18.9123 12.5331 19 12.745 19 12.9957C19 13.2463 18.9123 13.4575 18.737 13.6291C18.5617 13.8008 18.349 13.8866 18.099 13.8866H7.89332Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-zoom-out,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 26 26" fill="black"> wBox="0 0 26 26" fill="none"><path d="M7.89332 13.8866C7.64334 13.8866 7.43196 13.8 7.25918 13.6268C7.08639 13.4535 7 13.2416 7 12.9909C7 12.7403 7.08639 12.5291 7.25918 12.3575C7.43196 12.1858 7.64334 12.1 7.89332 12.1H18.099C18.349 12.1 18.5617 12.1866 18.737 12.3598C18.9123 12.5331 19 12.745 19 12.9957C19 13.2463 18.9123 13.4575 18.737 13.6291C18.5617 13.8008 18.349 13.8866 18.099 13.8866H7.89332Z"/></svg>')
  );
}

/* Screenshot styles */
.deck-widget.deck-widget-screenshot button.deck-widget-camera .deck-widget-icon {
  mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z"/></svg>')
  );
}

/* Theme panelContainer styles */
.deck-widget.deck-widget-theme button.deck-widget-sun .deck-widget-icon {
  mask-image: var(
    --icon-sun,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="black" stroke="black"><g ><circle cx="12" cy="12" r="6" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></g></svg>')
  );
}

.deck-widget.deck-widget-theme button.deck-widget-moon .deck-widget-icon {
  mask-image: var(
    --icon-moon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" ><circle cx="12" cy="12" r="6" fill="black" mask="url(%23moon-mask)" /><mask id="moon-mask" viewBox="0 0 24 24" ><rect x="0" y="0" width="24" height="24" fill="white" /><circle cx="24" cy="10" r="12" fill="black"/></mask></svg>')
  );
  -webbit-mask-image: var(
    --icon-moon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24"><circle x="12" cy="12" r="6" /></svg>')
  );
}

/* Reset view styles */
.deck-widget.deck-widget-reset-view button.deck-widget-reset-focus .deck-widget-icon {
  mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M480-320v-100q0-25 17.5-42.5T540-480h100v60H540v100h-60Zm60 240q-25 0-42.5-17.5T480-140v-100h60v100h100v60H540Zm280-240v-100H720v-60h100q25 0 42.5 17.5T880-420v100h-60ZM720-80v-60h100v-100h60v100q0 25-17.5 42.5T820-80H720Zm111-480h-83q-26-88-99-144t-169-56q-117 0-198.5 81.5T200-480q0 72 32.5 132t87.5 98v-110h80v240H160v-80h94q-62-50-98-122.5T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q129 0 226.5 79.5T831-560Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-camera,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M480-320v-100q0-25 17.5-42.5T540-480h100v60H540v100h-60Zm60 240q-25 0-42.5-17.5T480-140v-100h60v100h100v60H540Zm280-240v-100H720v-60h100q25 0 42.5 17.5T880-420v100h-60ZM720-80v-60h100v-100h60v100q0 25-17.5 42.5T820-80H720Zm111-480h-83q-26-88-99-144t-169-56q-117 0-198.5 81.5T200-480q0 72 32.5 132t87.5 98v-110h80v240H160v-80h94q-62-50-98-122.5T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q129 0 226.5 79.5T831-560Z"/></svg>')
  );
}

/* Timeline panelContainer styles */
.deck-widget.deck-widget-timeline {
  position: absolute;
  margin: var(--widget-margin, 12px);
  left: 0;
  right: 0;
  pointer-events: all;
}
.deck-widget.deck-widget-timeline[data-placement^=top-] {
  top: 0;
}
.deck-widget.deck-widget-timeline[data-placement^=bottom-] {
  bottom: 0;
}
.deck-widget.deck-widget-timeline .deck-widget-button-group {
  box-sizing: border-box;
  gap: var(--widget-margin, 12px);
  padding: var(--widget-margin, 12px);
}
.deck-widget-timeline button.deck-widget-timeline-pause .deck-widget-icon {
  mask-image: var(
    --icon-pause,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-pause,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z"/></svg>')
  );
}
.deck-widget-timeline button.deck-widget-timeline-play .deck-widget-icon {
  mask-image: var(
    --icon-play,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M320-200v-560l440 280-440 280Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-play,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M320-200v-560l440 280-440 280Z"/></svg>')
  );
}
.deck-widget-timeline-label {
  position: relative;
  pointer-events: none;
  width: fit-content;
  font-size: 13px;
  color: var(--menu-text, rgb(24, 24, 26));
  white-space: nowrap;
}
.deck-widget-timeline-label--current {
  transform: translate(-50%, -100%);
  border-radius: var(--button-corner-radius, 8px);
  background: var(--menu-background, #fff);
  padding: 4px;
}

/* Loading styles */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.deck-widget.deck-widget-loading button.deck-widget-spinner .deck-widget-icon {
  animation: spin 1s linear infinite;
}

.deck-widget.deck-widget-loading button.deck-widget-spinner .deck-widget-icon {
  mask-image: var(
    --loading-icon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>')
  );
  -webkit-mask-image: var(
    --loading-icon,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>')
  );
}

/* Scale styles */
.deck-widget .deck-widget-scale {
  background-color: var(--button-icon-idle, #616166);
  background-position: 50%;
  display: block;
}

/* Geocoder styles */
.deck-widget .deck-widget-geocoder {
  pointer-events: auto;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  background: var(--button-stroke, rgba(255, 255, 255, 0.3));
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  padding: 1px;
  gap: 1px;
}

.deck-widget .deck-widget-geocoder-input {
  flex: 1 1 auto;
  min-width: 200px;
  height: calc(var(--button-size, 28px) - 2px);
  margin: 0;
  padding: 0 8px;
  box-sizing: border-box;
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  color: var(--button-text, rgb(24, 24, 26));
  border: var(--button-inner-stroke, unset);
  border-radius: calc(var(--button-corner-radius, 8px) - 1px);
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 13px;
}

.deck-widget .deck-widget-geocoder-input:focus {
  outline: none;
}

.deck-widget .deck-widget-geocoder-input::placeholder {
  color: var(--button-icon-idle, rgba(97, 97, 102, 1));
}

.deck-widget .deck-widget-geocoder-error {
  position: absolute;
  top: calc(100% + var(--menu-gap, 4px));
  left: 1px;
  right: 1px;
  padding: 6px 10px;
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  border: var(--button-inner-stroke, unset);
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  color: rgb(220, 80, 80);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 12px;
  text-align: center;
}

/* When dropdown is not present, input should have full rounded corners */
.deck-widget .deck-widget-geocoder-input:last-child {
  border-top-right-radius: calc(var(--button-corner-radius, 8px) - 1px);
  border-bottom-right-radius: calc(var(--button-corner-radius, 8px) - 1px);
}

/* Dropdown menu styles */
.deck-widget .deck-widget-dropdown-container {
  position: static;
  display: inline-block;
}

.deck-widget .deck-widget-dropdown-button {
  width: calc(var(--button-size, 28px) - 2px);
  height: calc(var(--button-size, 28px) - 2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  background: var(--button-background, #fff);
  backdrop-filter: var(--button-backdrop-filter, unset);
  border: var(--button-inner-stroke, unset);
  border-radius: calc(var(--button-corner-radius, 8px) - 1px);
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  outline: none;
}

.deck-widget .deck-widget-dropdown-icon {
  width: 12px;
  height: 12px;
  background-color: var(--button-icon-idle, rgba(97, 97, 102, 1));
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>');
  -webkit-mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>');
  mask-size: contain;
  -webkit-mask-size: contain;
  transition: transform 0.2s ease;
}

.deck-widget .deck-widget-dropdown-icon.open {
  transform: rotate(180deg);
}

.deck-widget .deck-widget-dropdown-button:hover .deck-widget-dropdown-icon {
  background-color: var(--button-icon-hover, rgba(24, 24, 26, 1));
}

.deck-widget .deck-widget-dropdown-menu {
  top: calc(100% + var(--menu-gap, 4px));
  left: 1px;
  right: 1px;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  z-index: 1000;
  background: var(--menu-background, #fff);
  backdrop-filter: var(--menu-backdrop-filter, unset);
  border: var(--menu-border, unset);
  border-radius: var(--button-corner-radius, 8px);
  box-shadow: var(--menu-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 13px;
}

.deck-widget .deck-widget-dropdown-item {
  padding: 8px 12px;
  white-space: nowrap;
  overflow: hidden;
  cursor: default;
  user-select: none;
  text-overflow: ellipsis;
  color: var(--menu-text, rgb(24, 24, 26));
}

.deck-widget .deck-widget-dropdown-item:not(.disabled):hover {
  cursor: pointer;
  background: var(--menu-item-hover, rgba(128, 128, 128, 0.15));
}

.deck-widget .deck-widget-dropdown-item-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  vertical-align: text-bottom;
  background-color: var(--menu-text, rgb(24, 24, 26));
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
}

/* Stats styles */
.deck-widget.deck-widget-stats button .text {
  color: var(--button-text, rgb(24, 24, 26));
  font-family: monospace;
  font-size: 8px;
  font-weight: 700;
}
.deck-widget-stats-container {
  border-radius: var(--button-corner-radius, 8px);
  display: inline-flex;
  flex-direction: column;
  font-size: 0.7rem;
  /* Approximately 14px */
  line-height: 1.6;
  font-family: monospace;
  background-color: var(--menu-background, #fff);
  color: var(--menu-text, rgb(24, 24, 26));
  box-shadow: var(--menu-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
}
.deck-widget-stats-header {
  color: var(--button-icon-idle, rgba(97, 97, 102, 1));
  padding-left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.deck-widget-stats-device {
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 0.65rem;
  line-height: 1.2;
  background: color-mix(in srgb, currentColor 12%, transparent);
  color: inherit;
}
.deck-widget-stats-header:hover {
  color: var(--button-icon-hover, rgb(24, 24, 26));
}
.deck-widget-stats-header .deck-widget-dropdown-button {
  background: none;
  border: none;
}
.deck-widget-stats-content {
  padding: 4px 8px 8px;
}

/* Popup styles */
.deck-widget.deck-widget-popover {
  margin: 0 !important;
}
.deck-widget-popup-content {
  border-radius: var(--button-corner-radius, 8px);
  background: var(--menu-background, #fff);
  color: var(--menu-text, rgb(24, 24, 26));
  box-shadow: var(--menu-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
  padding: 10px;
}
.deck-widget-popup-content .deck-widget-popup-controls {
  --button-size: 20px;
}
.deck-widget-popup-content .deck-widget-popup-controls .deck-widget-button {
  box-shadow: none;
}
.deck-widget-popup-content button.deck-widget-popup-close-button .deck-widget-icon {
  mask-image: var(
    --icon-close,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -120 120 120" fill="black"><path d="m32-25-7-7 28-28-28-28 7-7 28 28 28-28 7 7-28 28 28 28-7 7-28-28-28 28Z"/></svg>')
  );
  -webkit-mask-image: var(
    --icon-close,
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -120 120 120" fill="black"><path d="m32-25-7-7 28-28-28-28 7-7 28 28 28-28 7 7-28 28 28 28-7 7-28-28-28 28Z"/></svg>')
  );
}

/** Range input */
.deck-widget-range {
  position: relative;
  pointer-events: all;
  display: flex;
  align-items: center;
  user-select: none;
  touch-action: none;
  box-sizing: border-box;
  margin: 0;
}
.deck-widget-range__track {
  position: relative;
  cursor: pointer;
  flex: 1;
  background: var(--range-track-color, #888);
  border-radius: calc(var(--range-track-size, 16px) / 2);
}
.deck-widget-range__decorations {
  position: absolute;
}
.deck-widget-range__decoration {
  position: absolute;
}
.deck-widget-range__decoration:active {
  background-color: var(--range-decoration-active-color, gold) !important;
}
.deck-widget-range__thumb {
  position: relative;
  box-sizing: content-box;
  padding: calc(var(--range-thumb-size, 10px) / 2);
  border-radius: calc(var(--range-thumb-size, 10px) / 2);
  margin: calc(var(--range-thumb-size, 10px) * -0.5);
  background: var(--range-thumb-color, #444);
}
.deck-widget-range__button {
  cursor: pointer;
  opacity: 0.4;
  background-color: transparent;
  width: var(--range-step-button-size, 24px);
  height: var(--range-step-button-size, 24px);
  background-size: cover;
  border: none;
  padding: 0;
}
.deck-widget-range__button:hover {
  opacity: 1;
}
.deck-widget-range:not(.deck-widget-range--disabled) .deck-widget-range__button:disabled {
  pointer-events: none;
  opacity: 0.1;
}
.deck-widget-range--disabled {
  display: none;
}
.deck-widget-range--vertical {
  flex-direction: column;
  height: 100%;
  top: 0;
}
.deck-widget-range--horizontal {
  flex-direction: row;
  width: 100%;
  left: 0;
}
.deck-widget-range--vertical .deck-widget-range__track {
  width: var(--range-track-size, 16px);
  padding-top: calc(var(--range-track-size, 16px) / 2);
  padding-bottom: calc(var(--range-track-size, 16px) / 2);
  height: 100%;
  min-height: calc(var(--range-track-size, 16px) * 3);
}
.deck-widget-range--vertical .deck-widget-range__thumb {
  width: 0;
  left: 50%;
  cursor: ns-resize;
}
.deck-widget-range--vertical .deck-widget-range__decorations {
  top: calc(var(--range-track-size, 16px) / 2);
  bottom: calc(var(--range-track-size, 16px) / 2);
  left: 0;
  right: 0;
}
.deck-widget-range--vertical .deck-widget-range__button--start .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/></svg>');
}
.deck-widget-range--vertical .deck-widget-range__button--end .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>');
}
.deck-widget-range--horizontal .deck-widget-range__track {
  height: var(--range-track-size, 16px);
  padding-left: calc(var(--range-track-size, 16px) / 2);
  padding-right: calc(var(--range-track-size, 16px) / 2);
  width: 100%;
  min-width: calc(var(--range-track-size, 16px) * 3);
}
.deck-widget-range--horizontal .deck-widget-range__thumb {
  height: 0;
  top: 50%;
  cursor: ew-resize;
}
.deck-widget-range--horizontal .deck-widget-range__decorations {
  left: calc(var(--range-track-size, 16px) / 2);
  right: calc(var(--range-track-size, 16px) / 2);
  top: 0;
  bottom: 0;
}
.deck-widget-range--horizontal .deck-widget-range__button--start .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg>');
}
.deck-widget-range--horizontal .deck-widget-range__button--end .deck-widget-icon {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 -960 960 960" fill="black"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg>');
}

/** Scrollbar */
.deck-widget-scrollbar .deck-widget-range {
  position: absolute;
}
.deck-widget-scrollbar .deck-widget-range--vertical {
  top: var(--range-step-button-size, 24px);
  height: calc(100% - var(--range-step-button-size, 24px) * 2);
}
.deck-widget-scrollbar[data-placement$=-left] .deck-widget-range--vertical {
  left: 0;
}
.deck-widget-scrollbar[data-placement$=-right] .deck-widget-range--vertical {
  right: 0;
}
.deck-widget-scrollbar .deck-widget-range--horizontal {
  left: var(--range-step-button-size, 24px);
  width: calc(100% - var(--range-step-button-size, 24px) * 2);
}
.deck-widget-scrollbar[data-placement^=top-] .deck-widget-range--horizontal {
  top: 0;
}
.deck-widget-scrollbar[data-placement^=bottom-] .deck-widget-range--horizontal {
  bottom: 0;
}

/** Splitter */
.deck-widget.deck-widget-splitter {
  position: absolute;
  margin: 0;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
.deck-widget-splitter-handle {
  position: absolute;
  background: var(--button-background, #fff);
  z-index: 10;
  pointer-events: auto;
  box-shadow: inset 1px 1px 1px var(--button-icon-idle, #616166);
}
.deck-widget-splitter-handle.active {
  box-shadow: var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25));
}
.deck-widget-splitter-handle:before {
  content: ' ';
  display: block;
  position: absolute;
  box-sizing: content-box;
  width: 100%;
  height: 100%;
  padding: 4px;
  margin: -4px;
}
.deck-widget-splitter-handle--horizontal {
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  cursor: col-resize;
}
.deck-widget-splitter-handle--vertical {
  left: 0;
  right: 0;
  height: 2px;
  margin-top: -1px;
  cursor: row-resize;
}
`;function qj(e){return`selectorText`in e&&typeof e.selectorText==`string`&&e.selectorText.includes(`.deck-widget`)}function Jj(e){for(let t of Array.from(e.styleSheets)){let e;try{e=t.cssRules}catch{e=null}if(e&&Array.from(e).some(qj))return!0}return!1}function Yj(e){if(e.querySelector(`style[${Gj}]`)||Jj(e))return;let t=e.createElement(`style`);t.setAttribute(Gj,`true`),t.textContent=Kj,e.head.appendChild(t)}var Xj={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},Zj=`top-left`,Qj=`root`,$j=class{deck;parentElement;className;defaultComponents=[];components=[];resolvedComponents=[];containers={};lastViewports={};constructor({parentElement:e,deck:t=null,className:n}){this.deck=t,this.parentElement=e,this.className=n,Yj(e.ownerDocument),this.parentElement.classList.add(`deck-widget-container`),n&&this.parentElement.classList.add(n)}getComponents(){return this.resolvedComponents}setProps(e){if(e.components&&!eM(e.components,this.components)){let t=e.components.filter(tM);this._setComponents(t)}}finalize(){for(let e of this.getComponents())this._removeComponent(e);this.defaultComponents.length=0,this.components.length=0,this.resolvedComponents.length=0,this.lastViewports={};for(let e in this.containers)this.containers[e].remove();this.containers={},this.className&&this.parentElement.classList.remove(this.className),this.parentElement.classList.remove(`deck-widget-container`)}addDefault(e){this.defaultComponents.find(t=>t.id===e.id)||(this._addComponent(e),this.defaultComponents.push(e),this._setComponents(this.components))}onRedraw({viewports:e,layers:t}){let n=e.reduce((e,t)=>(e[t.id]=t,e),{});for(let r of this.getComponents())if(r.viewId){let e=n[r.viewId];e&&this._notifyViewportChange(r,[e],t)}else this._notifyViewportChange(r,e,t);this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getComponents()){let{viewId:r}=n;(!r||r===e.viewport?.id)&&n.onHover?.(e,t)}}onEvent(e,t,n){for(let r of this.getComponents()){let{viewId:i}=r;(!i||i===t.viewport?.id)&&r[e]?.(t,n)}}_setComponents(e){let t={};for(let e of this.resolvedComponents)t[e.id]=e;this.resolvedComponents.length=0;for(let e of this.defaultComponents)t[e.id]=null,this.resolvedComponents.push(e);for(let n of e){let e=t[n.id];e?e.constructor!==n.constructor||e.viewId!==n.viewId||e.placement!==n.placement||e._container!==n._container?(this._removeComponent(e),this._addComponent(n)):n!==e&&(e.setProps(n.props),n=e):this._addComponent(n),t[n.id]=null,this.resolvedComponents.push(n)}for(let e in t){let n=t[e];n&&this._removeComponent(n)}this.components=e}_addComponent(e){let{viewId:t=null,placement:n=Zj}=e,r=e._container??t;e.panelManager=this,e.deck=this.deck??void 0,e.rootElement=e._onAdd({deck:this.deck??void 0,viewId:t}),e.rootElement&&this._getContainer(r,n).append(e.rootElement),e.updateHTML()}_removeComponent(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.panelManager=void 0}_notifyViewportChange(e,t,n){if(e.onViewportChange)for(let n of t)e.onViewportChange(n);e.onRedraw?.({viewports:t,layers:n})}_getContainer(e,t){if(e&&typeof e!=`string`)return e;let n=typeof e==`string`?e:Qj,r=this.containers[n];r||(r=this.parentElement.ownerDocument.createElement(`div`),r.style.pointerEvents=`none`,r.style.position=`absolute`,r.style.overflow=`hidden`,this.parentElement.append(r),this.containers[n]=r);let i=r.querySelector(`.${t}`);return i||(i=this.parentElement.ownerDocument.createElement(`div`),i.className=t,i.style.position=`absolute`,i.style.zIndex=`2`,Object.assign(i.style,Xj[t]),r.append(i)),i}_updateContainers(){let e=this.deck,t=e?.width??this.parentElement.clientWidth,n=e?.height??this.parentElement.clientHeight;for(let e in this.containers){let r=this.lastViewports[e]||null,i=e===Qj||r,a=this.containers[e];i?(a.style.display=`block`,a.style.left=`${r?r.x:0}px`,a.style.top=`${r?r.y:0}px`,a.style.width=`${r?r.width:t}px`,a.style.height=`${r?r.height:n}px`):a.style.display=`none`}}};function eM(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function tM(e){return e instanceof zj}var nM,X,rM,iM,aM,oM,sM,cM,lM,uM,dM,fM,pM,mM,hM,gM={},_M=[],vM=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,yM=Array.isArray;function bM(e,t){for(var n in t)e[n]=t[n];return e}function xM(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function SM(e,t,n){var r,i,a,o={};for(a in t)a==`key`?r=t[a]:a==`ref`?i=t[a]:o[a]=t[a];if(arguments.length>2&&(o.children=arguments.length>3?nM.call(arguments,2):n),typeof e==`function`&&e.defaultProps!=null)for(a in e.defaultProps)o[a]===void 0&&(o[a]=e.defaultProps[a]);return CM(e,o,r,i,null)}function CM(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++rM,__i:-1,__u:0};return i==null&&X.vnode!=null&&X.vnode(a),a}function wM(e){return e.children}function TM(e,t){this.props=e,this.context=t}function EM(e,t){if(t==null)return e.__?EM(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type==`function`?EM(e):null}function DM(e){if(e.__P&&e.__d){var t=e.__v,n=t.__e,r=[],i=[],a=bM({},t);a.__v=t.__v+1,X.vnode&&X.vnode(a),RM(e.__P,a,t,e.__n,e.__P.namespaceURI,32&t.__u?[n]:null,r,n??EM(t),!!(32&t.__u),i),a.__v=t.__v,a.__.__k[a.__i]=a,BM(r,a,i),t.__e=t.__=null,a.__e!=n&&OM(a)}}function OM(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),OM(e)}function kM(e){(!e.__d&&(e.__d=!0)&&iM.push(e)&&!AM.__r++||aM!=X.debounceRendering)&&((aM=X.debounceRendering)||oM)(AM)}function AM(){try{for(var e,t=1;iM.length;)iM.length>t&&iM.sort(sM),e=iM.shift(),t=iM.length,DM(e)}finally{iM.length=AM.__r=0}}function jM(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_,v=r&&r.__k||_M,y=t.length;for(c=MM(n,t,v,c,y),d=0;d<y;d++)(p=n.__k[d])!=null&&(f=p.__i!=-1&&v[p.__i]||gM,p.__i=d,g=RM(e,p,f,i,a,o,s,c,l,u),m=p.__e,p.ref&&f.ref!=p.ref&&(f.ref&&UM(f.ref,null,p),u.push(p.ref,p.__c||m,p)),h==null&&m!=null&&(h=m),(_=!!(4&p.__u))||f.__k===p.__k?(c=NM(p,c,e,_),_&&f.__e&&(f.__e=null)):typeof p.type==`function`&&g!==void 0?c=g:m&&(c=m.nextSibling),p.__u&=-7);return n.__e=h,c}function MM(e,t,n,r,i){var a,o,s,c,l,u=n.length,d=u,f=0;for(e.__k=Array(i),a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(typeof o==`string`||typeof o==`number`||typeof o==`bigint`||o.constructor==String?o=e.__k[a]=CM(null,o,null,null,null):yM(o)?o=e.__k[a]=CM(wM,{children:o},null,null,null):o.constructor===void 0&&o.__b>0?o=e.__k[a]=CM(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):e.__k[a]=o,c=a+f,o.__=e,o.__b=e.__b+1,s=null,(l=o.__i=PM(o,n,c,d))!=-1&&(d--,(s=n[l])&&(s.__u|=2)),s==null||s.__v==null?(l==-1&&(i>u?f--:i<u&&f++),typeof o.type!=`function`&&(o.__u|=4)):l!=c&&(l==c-1?f--:l==c+1?f++:(l>c?f--:f++,o.__u|=4))):e.__k[a]=null;if(d)for(a=0;a<u;a++)(s=n[a])!=null&&!(2&s.__u)&&(s.__e==r&&(r=EM(s)),WM(s,s));return r}function NM(e,t,n,r){var i,a;if(typeof e.type==`function`){for(i=e.__k,a=0;i&&a<i.length;a++)i[a]&&(i[a].__=e,t=NM(i[a],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=EM(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t&&=t.nextSibling;while(t!=null&&t.nodeType==8);return t}function PM(e,t,n,r){var i,a,o,s=e.key,c=e.type,l=t[n],u=l!=null&&(2&l.__u)==0;if(l===null&&s==null||u&&s==l.key&&c==l.type)return n;if(r>(u?1:0)){for(i=n-1,a=n+1;i>=0||a<t.length;)if((l=t[o=i>=0?i--:a++])!=null&&!(2&l.__u)&&s==l.key&&c==l.type)return o}return-1}function FM(e,t,n){t[0]==`-`?e.setProperty(t,n??``):e[t]=n==null?``:typeof n!=`number`||vM.test(t)?n:n+`px`}function IM(e,t,n,r,i){var a,o;n:if(t==`style`)if(typeof n==`string`)e.style.cssText=n;else{if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||FM(e.style,t,``);if(n)for(t in n)r&&n[t]==r[t]||FM(e.style,t,n[t])}else if(t[0]==`o`&&t[1]==`n`)a=t!=(t=t.replace(dM,`$1`)),o=t.toLowerCase(),t=o in e||t==`onFocusOut`||t==`onFocusIn`?o.slice(2):t.slice(2),e.l||={},e.l[t+a]=n,n?r?n[uM]=r[uM]:(n[uM]=fM,e.addEventListener(t,a?mM:pM,a)):e.removeEventListener(t,a?mM:pM,a);else{if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;break n}catch{}typeof n==`function`||(n==null||!1===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n))}}function LM(e){return function(t){if(this.l){var n=this.l[t.type+e];if(t[lM]==null)t[lM]=fM++;else if(t[lM]<n[uM])return;return n(X.event?X.event(t):t)}}}function RM(e,t,n,r,i,a,o,s,c,l){var u,d,f,p,m,h,g,_,v,y,b,x,S,C,ee,w=t.type;if(t.constructor!==void 0)return null;128&n.__u&&(c=!!(32&n.__u),a=[s=t.__e=n.__e]),(u=X.__b)&&u(t);n:if(typeof w==`function`)try{if(_=t.props,v=w.prototype&&w.prototype.render,y=(u=w.contextType)&&r[u.__c],b=u?y?y.props.value:u.__:r,n.__c?g=(d=t.__c=n.__c).__=d.__E:(v?t.__c=d=new w(_,b):(t.__c=d=new TM(_,b),d.constructor=w,d.render=GM),y&&y.sub(d),d.state||={},d.__n=r,f=d.__d=!0,d.__h=[],d._sb=[]),v&&d.__s==null&&(d.__s=d.state),v&&w.getDerivedStateFromProps!=null&&(d.__s==d.state&&(d.__s=bM({},d.__s)),bM(d.__s,w.getDerivedStateFromProps(_,d.__s))),p=d.props,m=d.state,d.__v=t,f)v&&w.getDerivedStateFromProps==null&&d.componentWillMount!=null&&d.componentWillMount(),v&&d.componentDidMount!=null&&d.__h.push(d.componentDidMount);else{if(v&&w.getDerivedStateFromProps==null&&_!==p&&d.componentWillReceiveProps!=null&&d.componentWillReceiveProps(_,b),t.__v==n.__v||!d.__e&&d.shouldComponentUpdate!=null&&!1===d.shouldComponentUpdate(_,d.__s,b)){t.__v!=n.__v&&(d.props=_,d.state=d.__s,d.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t)}),_M.push.apply(d.__h,d._sb),d._sb=[],d.__h.length&&o.push(d);break n}d.componentWillUpdate!=null&&d.componentWillUpdate(_,d.__s,b),v&&d.componentDidUpdate!=null&&d.__h.push(function(){d.componentDidUpdate(p,m,h)})}if(d.context=b,d.props=_,d.__P=e,d.__e=!1,x=X.__r,S=0,v)d.state=d.__s,d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),_M.push.apply(d.__h,d._sb),d._sb=[];else do d.__d=!1,x&&x(t),u=d.render(d.props,d.state,d.context),d.state=d.__s;while(d.__d&&++S<25);d.state=d.__s,d.getChildContext!=null&&(r=bM(bM({},r),d.getChildContext())),v&&!f&&d.getSnapshotBeforeUpdate!=null&&(h=d.getSnapshotBeforeUpdate(p,m)),C=u!=null&&u.type===wM&&u.key==null?VM(u.props.children):u,s=jM(e,yM(C)?C:[C],t,n,r,i,a,o,s,c,l),d.base=t.__e,t.__u&=-161,d.__h.length&&o.push(d),g&&(d.__E=d.__=null)}catch(e){if(t.__v=null,c||a!=null)if(e.then){for(t.__u|=c?160:128;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;a[a.indexOf(s)]=null,t.__e=s}else{for(ee=a.length;ee--;)xM(a[ee]);zM(t)}else t.__e=n.__e,t.__k=n.__k,e.then||zM(t);X.__e(e,t,n)}else a==null&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):s=t.__e=HM(n.__e,t,n,r,i,a,o,c,l);return(u=X.diffed)&&u(t),128&t.__u?void 0:s}function zM(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(zM))}function BM(e,t,n){for(var r=0;r<n.length;r++)UM(n[r],n[++r],n[++r]);X.__c&&X.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t)})}catch(e){X.__e(e,t.__v)}})}function VM(e){return typeof e!=`object`||!e||e.__b>0?e:yM(e)?e.map(VM):e.constructor===void 0?bM({},e):null}function HM(e,t,n,r,i,a,o,s,c){var l,u,d,f,p,m,h,g=n.props||gM,_=t.props,v=t.type;if(v==`svg`?i=`http://www.w3.org/2000/svg`:v==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a!=null){for(l=0;l<a.length;l++)if((p=a[l])&&`setAttribute`in p==!!v&&(v?p.localName==v:p.nodeType==3)){e=p,a[l]=null;break}}if(e==null){if(v==null)return document.createTextNode(_);e=document.createElementNS(i,v,_.is&&_),s&&=(X.__m&&X.__m(t,a),!1),a=null}if(v==null)g===_||s&&e.data==_||(e.data=_);else{if(a=v==`textarea`&&_.defaultValue!=null?null:a&&nM.call(e.childNodes),!s&&a!=null)for(g={},l=0;l<e.attributes.length;l++)g[(p=e.attributes[l]).name]=p.value;for(l in g)p=g[l],l==`dangerouslySetInnerHTML`?d=p:l==`children`||l in _||l==`value`&&`defaultValue`in _||l==`checked`&&`defaultChecked`in _||IM(e,l,null,p,i);for(l in _)p=_[l],l==`children`?f=p:l==`dangerouslySetInnerHTML`?u=p:l==`value`?m=p:l==`checked`?h=p:s&&typeof p!=`function`||g[l]===p||IM(e,l,p,g[l],i);if(u)s||d&&(u.__html==d.__html||u.__html==e.innerHTML)||(e.innerHTML=u.__html),t.__k=[];else if(d&&(e.innerHTML=``),jM(t.type==`template`?e.content:e,yM(f)?f:[f],t,n,r,v==`foreignObject`?`http://www.w3.org/1999/xhtml`:i,a,o,a?a[0]:n.__k&&EM(n,0),s,c),a!=null)for(l=a.length;l--;)xM(a[l]);s&&v!=`textarea`||(l=`value`,v==`progress`&&m==null?e.removeAttribute(`value`):m!=null&&(m!==e[l]||v==`progress`&&!m||v==`option`&&m!=g[l])&&IM(e,l,m,g[l],i),l=`checked`,h!=null&&h!=e[l]&&IM(e,l,h,g[l],i))}return e}function UM(e,t,n){try{if(typeof e==`function`){var r=typeof e.__u==`function`;r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(e){X.__e(e,n)}}function WM(e,t,n){var r,i;if(X.unmount&&X.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||UM(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(e){X.__e(e,t)}r.base=r.__P=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&WM(r[i],t,n||typeof e.type!=`function`);n||xM(e.__e),e.__c=e.__=e.__e=void 0}function GM(e,t,n){return this.constructor(e,n)}function KM(e,t,n){var r,i,a,o;t==document&&(t=document.documentElement),X.__&&X.__(e,t),i=(r=typeof n==`function`)?null:n&&n.__k||t.__k,a=[],o=[],RM(t,e=(!r&&n||t).__k=SM(wM,null,[e]),i||gM,gM,t.namespaceURI,!r&&n?[n]:i?null:t.firstChild?nM.call(t.childNodes):null,a,!r&&n?n:i?i.__e:t.firstChild,r,o),BM(a,e,o)}function qM(e){function t(e){var n,r;return this.getChildContext||(n=new Set,(r={})[t.__c]=this,this.getChildContext=function(){return r},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(e){this.props.value!=e.value&&n.forEach(function(e){e.__e=!0,kM(e)})},this.sub=function(e){n.add(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n&&n.delete(e),t&&t.call(e)}}),e.children}return t.__c=`__cC`+ hM++,t.__=e,t.Provider=t.__l=(t.Consumer=function(e,t){return e.children(t)}).contextType=t,t}nM=_M.slice,X={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!i.__)try{if((a=i.constructor)&&a.getDerivedStateFromError!=null&&(i.setState(a.getDerivedStateFromError(e)),o=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),o=i.__d),o)return i.__E=i}catch(t){e=t}throw e}},rM=0,TM.prototype.setState=function(e,t){var n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=bM({},this.state);typeof e==`function`&&(e=e(bM({},n),this.props)),e&&bM(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),kM(this))},TM.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),kM(this))},TM.prototype.render=wM,iM=[],oM=typeof Promise==`function`?Promise.prototype.then.bind(Promise.resolve()):setTimeout,sM=function(e,t){return e.__v.__b-t.__v.__b},AM.__r=0,cM=Math.random().toString(8),lM=`__d`+cM,uM=`__a`+cM,dM=/(PointerCapture)$|Capture$/i,fM=0,pM=LM(!1),mM=LM(!0),hM=0;var JM=0;Array.isArray;function Z(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--JM,__i:-1,__u:0,__source:i,__self:a};if(typeof e==`function`&&(o=e.defaultProps))for(s in o)c[s]===void 0&&(c[s]=o[s]);return X.vnode&&X.vnode(l),l}var YM,Q,XM,ZM,QM=0,$M=[],$=X,eN=$.__b,tN=$.__r,nN=$.diffed,rN=$.__c,iN=$.unmount,aN=$.__;function oN(e,t){$.__h&&$.__h(Q,e,QM||t),QM=0;var n=Q.__H||={__:[],__h:[]};return e>=n.__.length&&n.__.push({}),n.__[e]}function sN(e){return QM=1,cN(xN,e)}function cN(e,t,n){var r=oN(YM++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):xN(void 0,t),function(e){var t=r.__N?r.__N[0]:r.__[0],n=r.t(t,e);t!==n&&(r.__N=[n,r.__[1]],r.__c.setState({}))}],r.__c=Q,!Q.__f)){var i=function(e,t,n){if(!r.__c.__H)return!0;var i=r.__c.__H.__.filter(function(e){return e.__c});if(i.every(function(e){return!e.__N}))return!a||a.call(this,e,t,n);var o=r.__c.props!==e;return i.some(function(e){if(e.__N){var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(o=!0)}}),a&&a.call(this,e,t,n)||o};Q.__f=!0;var a=Q.shouldComponentUpdate,o=Q.componentWillUpdate;Q.componentWillUpdate=function(e,t,n){if(this.__e){var r=a;a=void 0,i(e,t,n),a=r}o&&o.call(this,e,t,n)},Q.shouldComponentUpdate=i}return r.__N||r.__}function lN(e,t){var n=oN(YM++,3);!$.__s&&bN(n.__H,t)&&(n.__=e,n.u=t,Q.__H.__h.push(n))}function uN(e,t){var n=oN(YM++,4);!$.__s&&bN(n.__H,t)&&(n.__=e,n.u=t,Q.__h.push(n))}function dN(e){return QM=5,fN(function(){return{current:e}},[])}function fN(e,t){var n=oN(YM++,7);return bN(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function pN(e,t){return QM=8,fN(function(){return e},t)}function mN(e){var t=Q.context[e.__c],n=oN(YM++,9);return n.c=e,t?(n.__??(n.__=!0,t.sub(Q)),t.props.value):e.__}function hN(){for(var e;e=$M.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(vN),t.__h.some(yN),t.__h=[]}catch(n){t.__h=[],$.__e(n,e.__v)}}}$.__b=function(e){Q=null,eN&&eN(e)},$.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),aN&&aN(e,t)},$.__r=function(e){tN&&tN(e),YM=0;var t=(Q=e.__c).__H;t&&(XM===Q?(t.__h=[],Q.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(vN),t.__h.some(yN),t.__h=[],YM=0)),XM=Q},$.diffed=function(e){nN&&nN(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&($M.push(t)!==1&&ZM===$.requestAnimationFrame||((ZM=$.requestAnimationFrame)||_N)(hN)),t.__H.__.some(function(e){e.u&&(e.__H=e.u),e.u=void 0})),XM=Q=null},$.__c=function(e,t){t.some(function(e){try{e.__h.some(vN),e.__h=e.__h.filter(function(e){return!e.__||yN(e)})}catch(n){t.some(function(e){e.__h&&=[]}),t=[],$.__e(n,e.__v)}}),rN&&rN(e,t)},$.unmount=function(e){iN&&iN(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(e){try{vN(e)}catch(e){t=e}}),n.__H=void 0,t&&$.__e(t,n.__v))};var gN=typeof requestAnimationFrame==`function`;function _N(e){var t,n=function(){clearTimeout(r),gN&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);gN&&(t=requestAnimationFrame(n))}function vN(e){var t=Q,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),Q=t}function yN(e){var t=Q;e.__c=e.__(),Q=t}function bN(e,t){return!e||e.length!==t.length||t.some(function(t,n){return t!==e[n]})}function xN(e,t){return typeof t==`function`?t(e):t}var SN={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`#fff`,"--button-stroke":`rgba(255, 255, 255, 0.3)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(97, 97, 102, 1)`,"--button-icon-hover":`rgba(24, 24, 26, 1)`,"--button-text":`rgb(24, 24, 26, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(204, 204, 204)`,"--menu-gap":`4px`,"--menu-background":`#fff`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(24, 24, 26, 1)`,"--menu-item-hover":`rgba(0, 0, 0, 0.08)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#d8d8e5`,"--range-thumb-color":`#616166`,"--range-decoration-active-color":`#f8dd50`},CN={"--widget-margin":`12px`,"--button-size":`28px`,"--button-corner-radius":`8px`,"--button-background":`rgba(18, 18, 20, 1)`,"--button-stroke":`rgba(18, 18, 20, 0.30)`,"--button-inner-stroke":`unset`,"--button-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--button-backdrop-filter":`unset`,"--button-icon-idle":`rgba(158, 157, 168, 1)`,"--button-icon-hover":`rgba(215, 214, 229, 1)`,"--button-text":`rgb(215, 214, 229, 1)`,"--icon-compass-north-color":`rgb(240, 92, 68)`,"--icon-compass-south-color":`rgb(200, 199, 209)`,"--menu-gap":`4px`,"--menu-background":`rgba(18, 18, 20, 1)`,"--menu-backdrop-filter":`unset`,"--menu-border":`unset`,"--menu-shadow":`0px 0px 8px 0px rgba(0, 0, 0, 0.25)`,"--menu-text":`rgb(215, 214, 229, 1)`,"--menu-item-hover":`rgba(255, 255, 255, 0.1)`,"--range-step-button-size":`24px`,"--range-track-size":`16px`,"--range-thumb-size":`10px`,"--range-track-color":`#2c2c30`,"--range-thumb-color":`#9e9da8`,"--range-decoration-active-color":`#dd7d2c`},wN=qM(void 0);function TN({panel:e,children:t}){let n=mN(wN),r=dN(null),[i,a]=sN(`light`),o=EN(n??i,e.theme);return uN(()=>{if(!n){let e=r.current;if(!e)return;let t=e.parentElement instanceof HTMLElement?e.parentElement:e,n=()=>{let e=kN(t);a(t=>t===e?t:e)};n();let i=new MutationObserver(()=>{n()});for(let e of DN(t))i.observe(e,{attributes:!0,attributeFilter:[`style`,`class`]});return()=>{i.disconnect()}}},[n]),Z(wN.Provider,{value:o,children:Z(`div`,{ref:r,"data-panel-theme-mode":o,style:ON(o),children:t})})}function EN(e,t){return t===`dark`?`dark`:t===`light`?`light`:t===`invert`?e===`dark`?`light`:`dark`:e}function DN(e){let t=[],n=e,r=e.ownerDocument.documentElement;for(;n&&(t.push(n),n!==r);)n=n.parentElement;return t}function ON(e){return{...e===`dark`?CN:SN}}function kN(e){let t=e.ownerDocument.defaultView;if(!t)return`light`;let n=AN(t.getComputedStyle(e).getPropertyValue(`--menu-background`).trim());return n&&jN(n)<.5?`dark`:`light`}function AN(e){if(!e)return null;if(e.startsWith(`#`)){let t=e.slice(1);return t.length===3?[parseInt(t[0]+t[0],16),parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16)]:t.length>=6?[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]:null}let t=e.match(/[\d.]+/g);return!t||t.length<3?null:[Number(t[0]),Number(t[1]),Number(t[2])]}function jN([e,t,n]){return(.2126*e+.7152*t+.0722*n)/255}var MN;function NN(e){let t=Math.max(220,Math.floor(e));return Number.isFinite(t)?t:360}function PN({panel:e,title:t,widthPx:n,maxHeightPx:r,open:i,collapsible:a,onOpenChange:o}){return Z(`section`,{style:RN(n,r),"aria-label":t??`Panel box`,onPointerDown:IN,onPointerMove:IN,onPointerUp:IN,onMouseDown:IN,onMouseMove:IN,onMouseUp:IN,onTouchStart:IN,onTouchMove:IN,onTouchEnd:IN,onClick:IN,onContextMenu:IN,onWheel:IN,children:[t?Z(`header`,{style:zN,children:a?Z(`button`,{type:`button`,"aria-expanded":i,style:BN,onClick:()=>o(!i),children:[Z(`span`,{children:t}),Z(`span`,{"aria-hidden":`true`,style:VN(i),children:i?`▾`:`▸`})]}):Z(`span`,{children:t})}):null,Z(`div`,{style:HN(i),children:e?Z(TN,{panel:e,children:e.content}):null})]})}var FN=class extends Wj{static defaultProps={...Wj.defaultProps,id:`box-panel-container`,placement:`bottom-left`,title:void 0,widthPx:360,collapsible:!0,defaultOpen:!0,open:void 0,onOpenChange:void 0,panel:void 0};className=`deck-widget-box`;placement=MN.defaultProps.placement;title=MN.defaultProps.title;widthPx=MN.defaultProps.widthPx;collapsible=MN.defaultProps.collapsible;isOpen=MN.defaultProps.defaultOpen;#e=MN.defaultProps.panel;#t=null;#n=void 0;#r=!1;#i=!1;#a=void 0;constructor(e={}){super({...MN.defaultProps,...e}),this.setProps(this.props)}setProps(e){e.placement!==void 0&&(this.placement=e.placement),`title`in e&&(this.title=e.title),e.widthPx!==void 0&&(this.widthPx=NN(e.widthPx)),e.collapsible!==void 0&&(this.collapsible=e.collapsible),this.#c(e),`panel`in e&&(this.#e=e.panel),this.#s(),super.setProps(e)}onRemove(){this.#t&&KM(null,this.#t)}onRenderHTML(e){this.#t=e,e.style.margin=`0`,this.#s()}onViewportChange(){this.#s()}#o=e=>{this.#i||(this.isOpen=e),this.#a?.(e),this.#s()};#s=()=>{this.#t&&(this.#n=LN(this.#t),KM(Z(PN,{panel:this.#e,title:this.title,widthPx:this.widthPx,maxHeightPx:this.#n,open:this.isOpen,collapsible:this.collapsible,onOpenChange:this.#o}),this.#t))};#c(e){if(this.#i=e.open!==void 0,e.onOpenChange!==void 0&&(this.#a=e.onOpenChange),e.open!==void 0){this.isOpen=e.open,this.#r=!0;return}!this.#r&&e.defaultOpen!==void 0&&(this.isOpen=e.defaultOpen,this.#r=!0)}};MN=FN;function IN(e){e.stopPropagation()}function LN(e){let t=e.parentElement;for(;t;){let n=t.ownerDocument.defaultView?.getComputedStyle(t);if((n?.overflow===`hidden`||n?.overflowX===`hidden`||n?.overflowY===`hidden`)&&t.clientHeight>0){let n=t.getBoundingClientRect().bottom-e.getBoundingClientRect().top;return n>0?n:t.clientHeight}t=t.parentElement}}var RN=(e,t)=>({width:`${e}px`,maxWidth:`min(84vw, ${e}px)`,...t===void 0?{}:{maxHeight:`${t}px`},boxSizing:`border-box`,display:`flex`,flexDirection:`column`,pointerEvents:`auto`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`12px`,background:`var(--menu-background, rgba(255, 255, 255, 0.96))`,backdropFilter:`var(--menu-backdrop-filter, unset)`,color:`var(--menu-text, rgb(24, 24, 26))`,boxShadow:`var(--menu-shadow, 0 18px 40px rgba(15, 23, 42, 0.16))`,overflow:`hidden`}),zN={padding:`14px 16px 10px`,fontSize:`18px`,fontWeight:700,lineHeight:1.2,color:`var(--button-text, currentColor)`},BN={width:`100%`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`12px`,border:`none`,background:`none`,color:`inherit`,padding:`0`,margin:`0`,cursor:`pointer`,font:`inherit`,textAlign:`left`},VN=e=>({fontSize:`18px`,lineHeight:1,color:`var(--button-icon-idle, #616166)`,transform:e?`translateY(1px)`:`translateY(-1px)`}),HN=e=>({display:e?`block`:`none`,flex:`1 1 auto`,minHeight:0,overflowX:`hidden`,overflowY:`auto`,touchAction:`pan-y`,overscrollBehavior:`contain`,padding:`0 16px 16px`});function UN(e,t){let[n,r]=sN(t),i=e!==void 0,a=i?e:n;return lN(()=>{i&&r(e)},[i,e]),[a,pN(e=>{i||r(e)},[i])]}var WN=class extends zj{static defaultProps={...zj.defaultProps,id:`panel`,title:`Panel`,content:null,theme:`inherit`,disabled:!1,keepMounted:!1};placement=`top-left`;className=`deck-widget-panel`;title;content;theme;disabled;keepMounted;constructor(e){super(e),this.title=this.props.title,this.content=this.props.content,this.theme=this.props.theme,this.disabled=this.props.disabled,this.keepMounted=this.props.keepMounted}setProps(e){let t={...this.props,...e};this.title=t.title,this.content=t.content,this.theme=t.theme,this.disabled=t.disabled,this.keepMounted=t.keepMounted,super.setProps(e)}onRenderHTML(e){KM(SM(TN,{panel:this},this.content),e)}onRemove(){this.rootElement&&KM(null,this.rootElement)}},GN=class extends WN{constructor({panels:e,id:t=`column-panels`,title:n=`Panels`,theme:r=`inherit`}){super({id:t,title:n,theme:r,content:Z(KN,{panels:e})})}};function KN({panels:e,className:t}){return Z(`div`,{className:t,style:qN,children:e.map((e,t)=>Z(`section`,{style:{...JN,borderTop:t>0?`1px solid var(--menu-border, rgba(148, 163, 184, 0.25))`:`none`,opacity:e.disabled?.55:1},children:[e.title?Z(`header`,{style:YN,children:e.title}):null,Z(`div`,{style:XN,children:Z(TN,{panel:e,children:e.content})})]},e.id))})}var qN={display:`grid`,gap:`0`},JN={display:`grid`,gap:`10px`,padding:`12px 0`},YN={fontSize:`12px`,fontWeight:700,color:`var(--button-text, currentColor)`,padding:`0 2px`},XN={minWidth:0},ZN=class extends WN{constructor({panels:e,id:t=`tabbed-panels`,title:n=`Panels`,tabListLayout:r=`wrap`,theme:i=`inherit`}){super({id:t,title:n,theme:i,content:Z(QN,{panels:e,tabListLayout:r})})}};function QN({panels:e,className:t,defaultActivePanelId:n,activePanelId:r,onActivePanelIdChange:i,tabListLayout:a=`wrap`}){let[o,s]=UN(r,n),c=fN(()=>e.filter(e=>!e.disabled),[e]),l=fN(()=>o&&c.some(e=>e.id===o)?o:c[0]?.id,[o,c]);return lN(()=>{o===l||!l||(s(l),i?.(l))},[o,l,i,s]),Z(`div`,{className:t,style:$N,children:[Z(`div`,{"data-panel-tabs":``,style:eP(a),children:e.map(e=>{let t=e.id===l;return Z(`button`,{type:`button`,style:{...tP,opacity:e.disabled?.55:1,backgroundColor:t?`var(--button-background, rgba(255, 255, 255, 0.96))`:`transparent`,borderColor:t?`var(--menu-border, rgba(148, 163, 184, 0.35))`:`transparent`,color:t?`var(--button-text, rgb(24, 24, 26))`:`var(--button-icon-idle, rgb(71, 85, 105))`,boxShadow:t?`0 1px 2px rgba(15, 23, 42, 0.08)`:`none`},disabled:e.disabled,onPointerDown:t=>{if(e.disabled){t.stopPropagation();return}t.preventDefault(),s(e.id),i?.(e.id)},children:e.title},e.id)})}),Z(`div`,{style:nP,children:e.map(e=>{let t=e.id===l;return Z(`div`,{"aria-hidden":!t,style:{...rP,visibility:t?`visible`:`hidden`,pointerEvents:t?`auto`:`none`},children:Z(TN,{panel:e,children:e.content})},e.id)})})]})}var $N={display:`flex`,flexDirection:`column`,minWidth:`220px`,border:`var(--menu-border, 1px solid rgba(148, 163, 184, 0.35))`,borderRadius:`var(--button-corner-radius, 8px)`,overflow:`hidden`,backgroundColor:`var(--menu-background, #fff)`,color:`var(--menu-text, rgb(24, 24, 26))`};function eP(e){return{display:`flex`,alignItems:`flex-start`,flexWrap:e===`wrap`?`wrap`:`nowrap`,gap:`4px`,overflowX:e===`scroll`?`auto`:`hidden`,overflowY:`hidden`,background:`var(--menu-weak-background, var(--button-background, var(--menu-background, #fff)))`,padding:`4px 6px`,borderBottom:`var(--menu-divider, var(--menu-border, 1px solid rgba(148, 163, 184, 0.2)))`,position:`sticky`,top:0,zIndex:1}}var tP={flex:`0 0 auto`,border:`1px solid transparent`,borderRadius:`4px`,margin:0,padding:`4px 8px`,fontSize:`12px`,fontWeight:600,lineHeight:1.25,cursor:`pointer`,color:`var(--menu-text, rgb(24, 24, 26))`,backgroundColor:`rgba(255, 255, 255, 0.35)`,whiteSpace:`nowrap`,transition:`background-color 120ms ease, border-color 120ms ease, color 120ms ease`},nP={display:`grid`,alignItems:`start`,padding:`10px`,overflow:`auto`},rP={gridArea:`1 / 1`,minWidth:0};function iP({className:e,onRenderHTML:t}){let n=dN(null);return uN(()=>{let e=n.current;if(!e)return;let r=t(e);return()=>{typeof r==`function`&&r()}},[t]),Z(`div`,{ref:n,className:e})}var aP=class extends WN{constructor({id:e,title:t,onRenderHTML:n,disabled:r,keepMounted:i,className:a,theme:o=`inherit`}){super({id:e,title:t,theme:o,disabled:r,keepMounted:i,content:Z(iP,{className:a,onRenderHTML:n})})}},oP=[[`surface`,`--luma-example-surface`],[`surfaceRaised`,`--luma-example-surface-raised`],[`border`,`--luma-example-border`],[`text`,`--luma-example-text`],[`textMuted`,`--luma-example-text-muted`],[`accent`,`--luma-example-accent`],[`radius`,`--luma-example-radius`],[`shadow`,`--luma-example-shadow`],[`backdrop`,`--luma-example-backdrop`]],sP={cinematic:{surface:`rgb(8, 15, 27)`,surfaceRaised:`rgba(15, 23, 42, 0.72)`,border:`rgba(148, 163, 184, 0.24)`,text:`rgb(226, 232, 240)`,textMuted:`rgb(148, 163, 184)`,accent:`rgb(56, 189, 248)`,radius:`14px`,shadow:`0 22px 58px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.07)`,backdrop:`blur(18px) saturate(135%)`},light:{surface:`rgb(255, 255, 255)`,surfaceRaised:`rgb(248, 250, 252)`,border:`rgba(15, 23, 42, 0.1)`,text:`rgb(17, 17, 17)`,textMuted:`rgb(89, 101, 121)`,accent:`rgb(20, 110, 245)`,radius:`14px`,shadow:`0 12px 32px rgba(0, 0, 0, 0.28)`,backdrop:`none`}};function cP(e,t){let n=sP[t];for(let[t,r]of oP)e.style.setProperty(r,n[t])}function lP(e){for(let[,t]of oP)e.style.removeProperty(t)}var uP=`data-example-panel-host`,dP=`data-example-settings-panel`,fP=`data-example-settings-sections`,pP=`example-source`,mP=`/examples/`,hP=`data-example-panel-appearance`;`${hP}${dP}${dP}${dP}${dP}${dP}${fP}${dP}${fP}`;function gP({id:e,title:t,html:n,onRender:r}){return new aP({id:e,title:t,onRenderHTML:e=>{e.innerHTML=n;let t=r?.(e);return()=>{t&&t(),e.replaceChildren()}}})}function _P({id:e,title:t,content:n}){return new aP({id:e,title:t,onRenderHTML:e=>(KM(SM(wM,{},n),e),()=>KM(null,e))})}function vP(e){let{sourcePaths:t,...n}=e,r=e.panels.some(e=>e.id===pP),i=xP()&&!r?[...e.panels,yP(t)]:e.panels;return new ZN({...n,panels:i})}function yP(e){return _P({id:pP,title:`Source`,content:SM(bP,{sourcePaths:e})})}function bP({sourcePaths:e}){let[t,n]=sN({});return lN(()=>{let t=e??SP();if(t.length===0){n({error:`Unable to determine source code path.`});return}let r=new AbortController;return CP(t,r.signal).then(e=>n({source:e})).catch(e=>{r.signal.aborted||n({error:e instanceof Error?e.message:`Unable to load source code.`})}),()=>r.abort()},[e]),t.error?SM(`p`,{role:`alert`,style:{margin:0,padding:`10px 12px`,borderLeft:`3px solid #f87171`,borderRadius:`0 6px 6px 0`,background:`var(--luma-example-surface-raised, rgba(15, 23, 42, 0.72))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.5 ui-sans-serif, system-ui, sans-serif`}},t.error):SM(`pre`,{"data-example-source-viewer":``,style:{margin:0,padding:`13px 14px`,maxWidth:`100%`,overflow:`auto`,border:`1px solid var(--luma-example-border, rgba(148, 163, 184, 0.24))`,borderRadius:`8px`,background:`var(--luma-example-surface, rgb(8, 15, 27))`,color:`var(--luma-example-text, rgb(226, 232, 240))`,font:`12px/1.45 ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace`,whiteSpace:`pre-wrap`,wordBreak:`break-word`}},SM(`code`,{},t.source??`// Loading source…`))}function xP(){return typeof window<`u`&&!!window.website}function SP(){if(typeof window>`u`)return[];let e=window.location.pathname.indexOf(mP);if(e<0)return[];let t=window.location.pathname.slice(e+10).replace(/\/+$/,``);return t?[`${t}/app.ts`,`${t}/app.tsx`]:[]}async function CP(e,t){let n=window.location.pathname.indexOf(mP),r=window.location.pathname.slice(0,n+1);for(let n of e){let e=await fetch(`${r}example-assets/${n}`,{signal:t});if(e.ok)return e.text()}throw Error(`Unable to load source code.`)}function wP(e,t=`inherit`){let n=e.closest(`[data-info-box-appearance]`)?.getAttribute(`data-info-box-appearance`),r=t===`inherit`&&(n===`cinematic`||n===`light`)?n:t;e.setAttribute(uP,``),e.style.minWidth=`0`,e.style.width=`100%`,e.setAttribute(hP,r),r===`cinematic`||r===`light`?cP(e,r):lP(e),e.style.setProperty(`--menu-backdrop-filter`,`unset`),e.style.setProperty(`--menu-background`,r===`cinematic`||r===`light`?sP[r].surface:`transparent`),e.style.setProperty(`--menu-border`,`none`),e.style.setProperty(`--menu-shadow`,`none`)}var TP=`926bec45dfbe052bad4013ab5852ed2f4042bff5`,EP=`https://raw.githubusercontent.com/KhronosGroup/glTF-Test-Assets-Interactivity/${TP}`,DP=[{id:`traffic-light`,title:`Traffic Light`,path:`Models/TrafficLight`,file:`TrafficLight.glb`},{id:`branch`,title:`Branch tests`,path:`Tests/Interactivity/flow/branch`,file:`branch.glb`},{id:`sequence`,title:`Sequence tests`,path:`Tests/Interactivity/flow/sequence`,file:`sequence.glb`},{id:`switch`,title:`Switch tests`,path:`Tests/Interactivity/flow/switch`,file:`switch.glb`}].map(e=>({...e,url:`${EP}/${e.path}/glTF-Binary/${e.file}`,sourceUrl:`https://github.com/KhronosGroup/glTF-Test-Assets-Interactivity/tree/${TP}/${e.path}`}));function OP(){let e=document.querySelector(`#panels`);cP(e,`cinematic`),e.dataset.theme=`dark`,e.classList.add(`gltf-example-panel`);let t=document.querySelector(`#interaction`),n=document.querySelector(`#info-content`),r=`<svg viewBox="0 0 16 16" width="14" height="14" fill="none" role="presentation" focusable="false"><path d="m10 3-5 5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;t.innerHTML=`<div class="gltf-example-toolbar">
<button id="previous" class="gltf-example-caret" aria-label="Previous sample" title="Previous sample">${r}</button>
<select id="sample" aria-label="Sample">${DP.map(e=>`<option value="${e.id}">${e.title}</option>`).join(``)}</select>
<button id="next" class="gltf-example-caret gltf-example-caret-next" aria-label="Next sample" title="Next sample">${r}</button>
<button id="run">Run</button><button id="reset">Reset</button></div>
<output id="result" class="gltf-example-status" aria-live="polite">Loading asset…</output>`;let i=(e,t)=>(wP(e,`cinematic`),t.hidden=!1,e.append(t),()=>{t.hidden=!0,document.body.append(t)}),a=new GN({id:`interactivity-panel`,theme:`dark`,title:``,panels:[gP({id:`interactivity-controls`,title:``,html:``,onRender:e=>i(e,t)}),vP({id:`interactivity-tabs`,title:``,theme:`dark`,panels:[gP({id:`interactivity-info`,title:`Info`,html:``,onRender:e=>i(e,n)}),gP({id:`interactivity-graph`,title:`Behavior Graph`,html:``,onRender:e=>i(e,o)})]})]}),o=document.createElement(`section`);o.className=`gltf-example-details`,o.hidden=!0,document.body.append(o);let s=new FN({id:`interactivity-info`,title:`luma.gl · glTF Interactivity`,placement:`top-left`,widthPx:420,collapsible:!0,defaultOpen:!1,panel:a});e.classList.add(`gltf-example-panel`);let c=new $j({parentElement:e});return c.setProps({components:[s]}),{redraw(){c.onRedraw({viewports:[],layers:[]})},setGraph(e,t){o.replaceChildren();let n=document.createElement(`p`);n.textContent=`${e.length} authored behavior nodes · CPU interpreter`,o.append(n);let r=document.createElement(`ol`);r.style.cssText=`margin:0;padding-left:26px;max-height:240px;overflow:auto;font:10px/1.6 ui-monospace,monospace`;for(let t of e){let e=document.createElement(`li`);e.textContent=t,r.append(e)}o.append(r);let i=document.querySelector(`#asset-source`);i&&(i.href=t)},destroy(){c.finalize(),o.remove()}}}var kP=0,AP=!0,jP=OP(),MP=document.querySelector(`#sample`),NP=document.querySelector(`#previous`),PP=document.querySelector(`#next`),FP=0;async function IP(e){let t=await eA(e.url,Ve,{gltf:{excludeExtensions:{KHR_texture_transform:!1}}}),n=t.json.materials??[];for(let t of n)e.id!==`traffic-light`&&t.name===`LiberationSans SDF Material`&&(t.alphaMode=`MASK`,t.alphaCutoff=.5,t.pbrMetallicRoughness={...t.pbrMetallicRoughness,baseColorFactor:[0,0,0,0]}),e.id!==`traffic-light`&&(t.name===`LabelBaclground`||t.name===`Background`)&&(t.pbrMetallicRoughness={baseColorFactor:[.84,.88,.92,1]});for(let e of t.json.nodes??[])if((e.mesh===void 0?void 0:t.json.meshes?.[e.mesh])?.primitives.some(e=>e.material!==void 0&&n[e.material]?.name===`Background`)){let t=e.scale??[1,1,1];e.scale=[t[0],t[1]*1.6,t[2]]}return t}var LP=document.querySelector(`#scene`),RP=document.querySelector(`#status`),zP=document.querySelector(`#run`),BP=document.querySelector(`#result`),VP=document.querySelector(`#reset`),HP=document.querySelector(`#scene-help`),UP=null,WP=``,GP=0,KP,qP=`initializing`,JP=null,YP=null,XP=new Map,ZP=[],QP=[],$P=0,eF=[],tF=new Map;function nF(){let e=JP?.getBounds();if(!e)return;let[t,n]=e,r=[(t[0]+n[0])/2,(t[1]+n[1])/2,(t[2]+n[2])/2],i=Math.min(LP.clientWidth*.82/Math.max(n[0]-t[0],.1),LP.clientHeight*.72/Math.max(n[1]-t[1],.1));KP.setProps({initialViewState:{target:r,rotationX:0,rotationOrbit:0,zoom:Math.log2(i)}})}function rF(){for(let[e,t]of tF)XP.get(e).setPosition([...t]).updateMatrix();UP=null,ZP.forEach((e,t)=>e.setProps({pbrMaterial:{baseColorFactor:QP[t]}}));let e=DP[kP].id===`traffic-light`;BP.value=e?`Click a blue-ringed button: left plays a sequence; right advances a phase.`:`Test suite · Run tests executes every check; the icons are results.`,HP.textContent=e?`Click the highlighted buttons · Left: timed sequence · Right: next phase`:`Test results, not toggles · Open the luma.gl panel → Run tests`,zP.hidden=e,zP.textContent=`Run tests`,e&&oF(),RP.value=`Authored graph: ${GP} nodes\nBackend: ${qP}`,KP.redraw(`Reset authored checks`)}function iF(){if(!YP||DP[kP].id===`traffic-light`||AP)return;rF();let e=[],t=``;try{UP=aF(e,e=>{t=e}),UP.start();let n=UP.variables.filter(e=>typeof e[0]==`boolean`),r=n.filter(e=>e[0]===!0).length;BP.value=`${r} / ${n.length} checks passed · ${t||`Completed`}`,HP.textContent=`${r} / ${n.length} checks passed · These are test results, not toggles · Reset clears results`,RP.value=`Authored graph: ${GP} nodes\nEvent: ${t}\nBackend: ${qP}\n\n${e.join(`
`)}`,KP.redraw(`Run authored interactivity graph`)}catch(e){BP.value=`Graph execution failed`,RP.value=String(e)}}function aF(e=[],t){return new Ur(YP,{properties:{get(e){let t=/^\/nodes\/(\d+)\/translation$/.exec(e),n=t&&XP.get(Number(t[1]));return n?[...n.position]:void 0},set(e,t){let n=/^\/materials\/(\d+)\/pbrMetallicRoughness\/baseColorFactor$/.exec(e);if(n&&t.length===4&&t.every(e=>typeof e==`number`&&Number.isFinite(e))){let e=ZP[Number(n[1])];return e?(e.setProps({pbrMaterial:{baseColorFactor:t.map(Number)}}),!0):!1}let r=/^\/nodes\/(\d+)\/translation$/.exec(e),i=r&&XP.get(Number(r[1]));return!i||t.length!==3||!t.every(e=>typeof e==`number`&&Number.isFinite(e))?!1:(i.setPosition([...t]).updateMatrix(),!0)}},onLog:t=>e.push(t),onEvent:t})}function oF(){UP=aF(),$P=performance.now()/1e3,UP.tick(0)}function sF(){eF.splice(0).forEach(e=>e.element.remove())}function cF(e){let t=e,n=[...XP.values()].find(e=>e.children.includes(t)),r=[];for(;n;)r.push(n),t=n,n=[...XP.values()].find(e=>e.children.includes(t));let i=new k;for(let e of r.reverse())i.multiplyRight(e.matrix);return i}var lF,uF=[];function dF(e){uF=[];for(let[t,n]of XP){let r=e[t],i=r.name?.startsWith(`CaseLabel_`);if(r.name!==`Label`&&!i)continue;let a=[...XP].find(([,e])=>e.children.includes(n)),o=i?r.name.replace(`CaseLabel_flow/`,``):e[a[0]].name.replace(`CheckBox_`,``),s=n.getBounds(),c=s?s[0].map((e,t)=>(e+s[1][t])/2):[0,0,0],l=cF(n).transformAsPoint(c);uF.push({position:[l[0],l[1],l[2]],text:i?o[0].toUpperCase()+o.slice(1):o.replaceAll(` > `,`
→ `).replace(`: `,`:
`),title:!!i})}lF&&KP.setProps({layers:[lF,fF()]})}function fF(){return new Tj({id:`readable-check-labels`,data:uF,coordinateSystem:yl.CARTESIAN,getPosition:e=>e.position,getText:e=>e.text,getSize:e=>e.title?16:11,getColor:[18,26,35,255],fontFamily:`Arial, sans-serif`,fontWeight:600,maxWidth:130,wordBreak:`break-word`,lineHeight:1.1,getTextAnchor:`middle`,getAlignmentBaseline:`center`,billboard:!0,parameters:{depthCompare:`always`,depthWriteEnabled:!1}})}function pF(){if(sF(),DP[kP].id===`traffic-light`)for(let[e,t]of[[5,`Play sequence`],[10,`Next phase`]]){let n=XP.get(e),r=n.getBounds();if(!r)continue;let i=r[0].map((e,t)=>(e+r[1][t])/2);i=Array.from(cF(n).transformAsPoint(i));let a=document.createElement(`button`);a.className=`traffic-hit-target`,a.setAttribute(`aria-label`,t),a.title=t;let o=document.createElement(`span`);o.textContent=t,a.append(o),a.onpointerdown=e=>e.stopPropagation(),a.onpointerup=e=>e.stopPropagation(),a.onclick=t=>{t.stopPropagation(),UP?.selectNode(e),BP.value=e===5?`Left light: running the authored timed sequence.`:`Right light: advanced one authored phase.`,KP.redraw(`Selected traffic light button`)},LP.append(a),eF.push({element:a,position:i})}}function mF(){let e=DP[kP],t=++FP,n=new YD({id:`khr-interactivity-scene-${t}`,data:[{position:[0,0,0]}],scenegraph:IP(e),_lighting:`pbr`,coordinateSystem:yl.CARTESIAN,sizeScale:1,pickable:!1,getPosition:e=>e.position,getScene:n=>{if(t!==FP||!n?.scenes?.length)return null;let r=n.gltf?.extensions?.KHR_interactivity,i=r?.graphs[r.graph??0];if(GP=i?.nodes?.length??0,YP=r,ZP=n.materials,QP=n.gltf.materials.map(e=>[...e.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1]]),jP.setGraph((i?.nodes??[]).map(e=>i.declarations[e.declaration]?.op||`Unknown`),e.sourceUrl),AP=!1,MP.disabled=NP.disabled=PP.disabled=!1,VP.disabled=!1,zP.disabled=e.id===`traffic-light`,r)try{new Ur(r)}catch(e){zP.disabled=!0,WP=String(e)}XP.clear(),tF.clear();for(let[e,t]of n.gltfNodeIndexToNodeMap.entries())XP.set(e,t),tF.set(e,[...t.position]);return JP=n.scenes[n.gltf?.scene??0]??n.scenes[0],queueMicrotask(()=>{try{if(!r)throw Error(`The source asset has no KHR_interactivity extension`);rF(),e.id!==`traffic-light`&&!WP&&iF(),WP&&(RP.value=WP),nF(),pF(),e.id!==`traffic-light`&&dF(n.gltf.nodes)}catch(e){WP=String(e),RP.value=WP}}),JP}});return lF=n,[n,fF()]}zP.disabled=VP.disabled=MP.disabled=NP.disabled=PP.disabled=!0,KP=new Ip({parent:LP,onDeviceInitialized:e=>{qP=e.type},...Rj({deviceType:`webgl`}),views:new Vg({id:`orbit`,controller:!0,orbitAxis:`Y`,orthographic:!0}),initialViewState:{target:[0,0,0],rotationX:0,rotationOrbit:0,zoom:6},controller:!0,_animate:!0,onAfterRender:()=>{if(jP.redraw(),!AP&&UP&&DP[kP].id===`traffic-light`){UP.tick(performance.now()/1e3-$P);let e=KP.getViewports()[0];for(let t of eF){let[n,r]=e.project(t.position);t.element.style.left=`${n}px`,t.element.style.top=`${r}px`}}},layers:mF(),onError:e=>{WP=e.message,RP.value=WP,BP.value=WP,AP=!1,MP.disabled=NP.disabled=PP.disabled=!1}}),zP.addEventListener(`click`,iF),VP.addEventListener(`click`,rF),document.querySelector(`#fit`).addEventListener(`click`,nF);var hF=new ResizeObserver(()=>{nF(),jP.redraw()});hF.observe(LP),window.addEventListener(`pagehide`,()=>{hF.disconnect(),sF(),jP.destroy(),KP.finalize()});function gF(e){AP||(kP=(e+DP.length)%DP.length,MP.selectedIndex=kP,AP=!0,sF(),uF=[],UP=null,YP=null,WP=``,zP.disabled=VP.disabled=MP.disabled=NP.disabled=PP.disabled=!0,BP.value=`Loading asset…`,RP.value=``,KP.setProps({layers:mF()}))}MP.addEventListener(`change`,()=>gF(MP.selectedIndex)),NP.addEventListener(`click`,()=>gF(kP-1)),PP.addEventListener(`click`,()=>gF(kP+1));