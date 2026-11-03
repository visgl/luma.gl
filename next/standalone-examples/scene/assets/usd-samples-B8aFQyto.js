const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./webgpu-device-Bq0M0PD0.js","./buffer-layout-utils-B1oxazus.js","./log-6ICLTgtF.js","./fence-DGoOENwh.js","./wgsl-interface-scan-D9SUns-i.js","./webgl-device-rmtBGSY7.js","./debug-hooks-DHo42mqP.js"])))=>i.map(i=>d[i]);
import{r as e,t}from"./log-6ICLTgtF.js";import{A as n,C as r,F as i,I as a,L as o,N as s,P as c,S as l,b as u,c as d,d as f,f as p,g as m,i as h,j as g,k as _,l as v,m as y,p as b,r as x,s as S,t as C,u as w,w as ee,x as T}from"./buffer-layout-utils-B1oxazus.js";import{a as E,c as te,d as ne,l as re,n as ie,o as ae,r as oe,u as se}from"./debug-hooks-DHo42mqP.js";import{a as ce,c as le,d as ue,f as de,i as fe,l as pe,n as me,o as he,r as ge,s as _e,t as ve,u as ye}from"./wgsl-interface-scan-D9SUns-i.js";import{F as be,I as xe,K as Se,S as D,_ as Ce,a as we,b as Te,c as Ee,f as De,g as Oe,h as ke,i as Ae,l as je,m as O,o as Me,p as Ne,s as Pe,t as Fe,u as Ie,v as Le,x as Re,y as ze}from"./gltf-loader-types-DcZAIH3N.js";import{t as Be}from"./preload-helper-Ds0ikemP.js";import{n as Ve,t as He}from"./globals-BcB9gCXy.js";import{t as Ue}from"./log-C4RiOGbE.js";import{a as We,i as Ge,n as Ke,t as qe}from"./globals-1Bfzcouj.js";import{i as Je,n as Ye,t as Xe}from"./path-CzlAVaEb.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var Ze=`(max-width: 700px), (max-height: 500px) and (pointer: coarse)`,Qe=15e5;function $e(e,t){let n=typeof e.matchMedia==`function`?e.matchMedia.bind(e):()=>({matches:!1}),r=n(`(pointer: coarse)`).matches,i=e.innerWidth||1,a=e.innerHeight||1;return{compactViewport:n(Ze).matches,handheld:r&&t.maxTouchPoints>0&&Math.min(i,a)<=700,coarsePointer:r,maxTouchPoints:t.maxTouchPoints||0,viewportWidth:i,viewportHeight:a,devicePixelRatio:e.devicePixelRatio||1}}function et({devicePixelRatio:e,viewportHeight:t,viewportWidth:n,handheld:r}){let i=Math.max(n,1)*Math.max(t,1);if(!r)return!0;let a=Math.max(1,Math.min(2,Math.sqrt(Qe/i)));return e<=a?!0:a}function tt(e,t){let n=t.handheld&&e.mobileMode===`reduced`;return{canvasPixelRatio:et(t),intermediateTargetScale:n?.75:1,maximumSampleCount:n?2:4,preferFloatingPointColor:!n,maximumWorkerCount:n?1:2,maximumConcurrentLoadCount:n?2:4,maximumResidentRecordCount:n?25e4:1e6,simulationDimensionScale:n?.5:1,simulationIterationScale:n?.5:1}}function nt(e,t){return t.handheld&&e.mobileMode===`unsupported`?e.unsupportedReason||`This example does not support mobile devices.`:void 0}function rt(e){switch(e){case`full`:return`Mobile`;case`reduced`:return`Mobile quality`;case`unsupported`:return`Desktop only`}}function it(e,t,n){let r=nt(e,t);if(r)return{supported:!1,reason:r};let i=e.requirements;if(!i)return{supported:!0};if(!i.backends.some(e=>n.backends.includes(e)))return{supported:!1,reason:`This example requires ${pt(i.backends)}, but this browser does not expose a compatible graphics backend. Try a current browser on a capable device or use a desktop browser.`};let a=new Set(n.deviceFeatures),o=i.requiredDeviceFeatures?.find(e=>!a.has(e));if(o)return{supported:!1,reason:`This example requires the GPU feature “${o}”. Try a current browser on a capable device or use a desktop browser.`};let s=i.requiredDeviceLimits,c=n.deviceLimits;return s?.maxColorAttachments!==void 0&&(c?.maxColorAttachments??0)<s.maxColorAttachments?{supported:!1,reason:`This example requires ${s.maxColorAttachments} color attachments, but this GPU exposes only ${c?.maxColorAttachments??0}. Try a capable device or desktop browser.`}:s?.maxColorAttachmentBytesPerSample!==void 0&&(c?.maxColorAttachmentBytesPerSample??0)<s.maxColorAttachmentBytesPerSample?{supported:!1,reason:`This example requires ${s.maxColorAttachmentBytesPerSample} color-attachment bytes per sample, but this GPU exposes only ${c?.maxColorAttachmentBytesPerSample??0}. Try a capable device or desktop browser.`}:{supported:!0}}async function at(){let e=document.documentElement,t=st(document),n=$e(window,navigator),r=it(t,n,{backends:await ot()}),i=tt(t,n);e.dataset.lumaExampleId=t.id,e.dataset.lumaExampleMobileMode=t.mobileMode,e.dataset.lumaExampleQualityProfile=t.mobileProfile,e.dataset.lumaExampleState=r.supported?`loading`:`unsupported`,n.handheld&&typeof i.canvasPixelRatio==`number`&&Object.defineProperty(window,`devicePixelRatio`,{configurable:!0,value:i.canvasPixelRatio});let a=t=>{e.dataset.lumaExampleState!==`unsupported`&&(e.dataset.lumaExampleState=`failed`,ut(`failed`,ft(t)))},o=()=>{e.dataset.lumaExampleState===`loading`&&(e.dataset.lumaExampleState=`running`)};return window.addEventListener(`error`,e=>a(e.error||e.message)),window.addEventListener(`unhandledrejection`,e=>a(e.reason)),dt(),n.handheld&&lt(t.mobileMode),r.supported===!1?ut(`unsupported`,r.reason):ct(o),{supported:r.supported,reportFailed:a,reportRunning:o}}async function ot(){let e=[];if(`WebGL2RenderingContext`in window&&e.push(`webgl2`),`gpu`in navigator)try{let t=navigator.gpu;t&&await t.requestAdapter()&&e.push(`webgpu`)}catch{}return e}function st(e){let t=t=>e.querySelector(`meta[name="${t}"]`)?.content||void 0,n=t(`luma-example-mobile`),r=t(`luma-example-mobile-profile`),i=(t(`luma-example-backends`)||``).split(`,`).filter(Boolean);return{id:t(`luma-example-id`)||location.pathname,mobileMode:n||`reduced`,mobileProfile:r||`standard`,unsupportedReason:t(`luma-example-mobile-unsupported-reason`),requirements:i.length?{backends:i}:void 0}}function ct(e){let t=!1,n=()=>{if(t)return;let n=document.querySelector(`canvas`),i=n&&n.clientWidth>0&&n.clientHeight>0,a=[...document.body?.querySelectorAll(`*`)||[]].some(e=>{if(e instanceof HTMLScriptElement||e instanceof HTMLStyleElement||e.hasAttribute(`data-luma-example-mobile-badge`)||e.hasAttribute(`data-luma-example-status`))return!1;let t=e.getBoundingClientRect();return t.width>0&&t.height>0&&(e.textContent?.trim()||e.children.length)});(i||a)&&(t=!0,r.disconnect(),requestAnimationFrame(()=>requestAnimationFrame(e)))},r=new MutationObserver(n);r.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener(`load`,n,{once:!0})}function lt(e){let t=document.createElement(`span`);t.dataset.lumaExampleMobileBadge=``,t.setAttribute(`aria-label`,`Mobile support: ${rt(e)}`),t.style.cssText=`position:fixed;left:calc(8px + env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:2147483646;padding:4px 8px;border:1px solid #7dd3fc57;border-radius:999px;background:#020617dd;color:#bae6fd;font:700 11px/1.4 system-ui;pointer-events:none;`,t.textContent=rt(e),document.body.append(t)}function ut(e,t){document.querySelector(`[data-luma-example-status]`)?.remove();let n=document.createElement(`div`);n.dataset.lumaExampleStatus=e,n.setAttribute(`role`,`alert`),n.style.cssText=`position:fixed;inset:16px;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;border:1px solid #475569;border-radius:12px;background:#020617ee;color:#e2e8f0;font:16px/1.5 system-ui;text-align:center;`;let r=document.createElement(`div`);r.style.maxWidth=`620px`;let i=document.createElement(`strong`);i.style.cssText=`display:block;font-size:20px;margin-bottom:8px;`,i.textContent=e===`unsupported`?`This example is not supported on this device.`:`This example could not start.`;let a=document.createElement(`span`);a.textContent=t,r.append(i,a),n.append(r),document.body.append(n)}function dt(){let e=document.createElement(`style`);e.textContent=`
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
  `,document.head.append(e)}function ft(e){return e instanceof Error?e.message:typeof e==`string`?e:`An unexpected error stopped the example.`}function pt(e){return e.map(e=>e===`webgpu`?`WebGPU`:`WebGL2`).join(` or `)}var mt=`set luma.log.level=1 (or higher) to trace rendering`,ht="No matching device found. Ensure `@luma.gl/core/webgl` and/or `@luma.gl/core/webgpu` modules are imported.",gt=class e{static defaultProps={...a,type:`best-available`,adapters:void 0,waitForPageLoad:!0};stats=c;log=o;VERSION=typeof __VERSION__<`u`?__VERSION__:`running from source`;spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw o.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),o.error(`'yarn why @luma.gl/core' can help identify the source of the conflict`)(),Error(`luma.gl - multiple versions detected: see console log`);o.error(`This version of luma.gl has already been initialized`)()}o.log(1,`${this.VERSION} - ${mt}`)(),globalThis.luma=this}async createDevice(t={}){let n={...e.defaultProps,...t};try{let e=this.selectAdapter(n.type,n.adapters);if(!e)throw Error(ht);return n.waitForPageLoad&&await e.pageLoaded,await e.create(n)}catch(e){throw n.debug&&_t(e),e}}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),r=n&&this.selectAdapter(n,t.adapters);if(!r)throw Error(ht);return await r?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,e])=>e).filter(e=>e.isSupported?.()).map(e=>e.type)}getBestAvailableAdapterType(e=[]){let t=[`webgpu`,`webgl`,`null`],n=this._getAdapterMap(e);for(let e of t)if(n.get(e)?.isSupported?.())return e;return null}selectAdapter(e,t=[]){let n=e;e===`best-available`&&(n=this.getBestAvailableAdapterType(t));let r=this._getAdapterMap(t);return n&&r.get(n)||null}enforceWebGL2(e=!0,t=[]){let n=this._getAdapterMap(t).get(`webgl`);n||o.warn(`enforceWebGL2: webgl adapter not found`)(),n?.enforceWebGL2?.(e)}setDefaultDeviceProps(t){Object.assign(e.defaultProps,t)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(e,t=[]){return e instanceof WebGL2RenderingContext?`webgl`:typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue?`webgpu`:e===null?`null`:(e instanceof WebGLRenderingContext?o.warn(`WebGL1 is not supported`,e)():o.warn(`Unknown handle type`,e)(),null)}};function _t(e){typeof alert>`u`||alert(e instanceof Error?e.message:String(e))}var vt=new gt,yt=class{get pageLoaded(){return Ct()}},bt=e()&&typeof document<`u`,xt=()=>bt&&document.readyState===`complete`,St=null;function Ct(){return St||=xt()||typeof window>`u`?Promise.resolve():new Promise(e=>window.addEventListener(`load`,()=>e())),St}var wt=new WeakMap,k=class e{static defaultProps={...v.defaultProps};static getDefaultPipelineFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultPipelineFactory||=new e(t),n.defaultPipelineFactory}static beginAsyncCompilation(e){if(wt.has(e))throw Error(`An asynchronous pipeline compilation scope is already active`);let t=[];return wt.set(e,t),t}static getAsyncCompilation(e){return wt.get(e)}static endAsyncCompilation(e,t){if(wt.get(e)!==t)throw Error(`The asynchronous pipeline compilation scope is not active`);wt.delete(e)}device;_hashCounter=0;_hashes={};_renderPipelineCache={};_computePipelineCache={};_pendingRenderPipelineCache={};_pendingComputePipelineCache={};_sharedRenderPipelineCache={};get[Symbol.toStringTag](){return`PipelineFactory`}toString(){return`PipelineFactory(${this.device.id})`}constructor(e){this.device=e}createRenderPipeline(e){if(!this.device.props._cachePipelines)return this.device.createRenderPipeline(e);let t={...v.defaultProps,...e},n=this._renderPipelineCache,r=this._hashRenderPipeline(t),i=n[r]?.resource;if(i)n[r].useCount++,this.device.props.debugFactories&&o.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)();else{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;i=this.device.createRenderPipeline({...t,id:t.id?`${t.id}-cached`:s(`unnamed-cached`),_sharedRenderPipeline:e}),i.hash=r,n[r]={resource:i,useCount:1},this.device.props.debugFactories&&o.log(3,`${this}: ${i} created, count=${n[r].useCount}`)()}return i}async createRenderPipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createRenderPipelineAsync(e);let t={...v.defaultProps,...e},n=this._hashRenderPipeline(t);return await this._createPipelineAsync(this._renderPipelineCache,this._pendingRenderPipelineCache,n,()=>{let e=this.device.type===`webgl`&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;return this.device.createRenderPipelineAsync({...t,id:t.id?`${t.id}-cached`:s(`unnamed-cached`),_sharedRenderPipeline:e})})}createComputePipeline(e){if(!this.device.props._cachePipelines)return this.device.createComputePipeline(e);let t={...ue.defaultProps,...e},n=this._computePipelineCache,r=this._hashComputePipeline(t),i=n[r]?.resource;return i?(n[r].useCount++,this.device.props.debugFactories&&o.log(3,`${this}: ${n[r].resource} reused, count=${n[r].useCount}, (id=${e.id})`)()):(i=this.device.createComputePipeline({...t,id:t.id?`${t.id}-cached`:void 0}),i.hash=r,n[r]={resource:i,useCount:1},this.device.props.debugFactories&&o.log(3,`${this}: ${i} created, count=${n[r].useCount}`)()),i}async createComputePipelineAsync(e){if(!this.device.props._cachePipelines)return await this.device.createComputePipelineAsync(e);let t={...ue.defaultProps,...e},n=this._hashComputePipeline(t);return await this._createPipelineAsync(this._computePipelineCache,this._pendingComputePipelineCache,n,()=>this.device.createComputePipelineAsync({...t,id:t.id?`${t.id}-cached`:void 0}))}release(e){if(!this.device.props._cachePipelines){e.destroy();return}let t=this._getCache(e),n=e.hash;t[n].useCount--,t[n].useCount===0?(this._destroyPipeline(e),this.device.props.debugFactories&&o.log(3,`${this}: ${e} released and destroyed`)()):t[n].useCount<0?(o.error(`${this}: ${e} released, useCount < 0, resetting`)(),t[n].useCount=0):this.device.props.debugFactories&&o.log(3,`${this}: ${e} released, count=${t[n].useCount}`)()}createSharedRenderPipeline(e){let t=this._hashSharedRenderPipeline(e),n=this._sharedRenderPipelineCache[t];return n||(n={resource:this.device._createSharedRenderPipelineWebGL(e),useCount:0},this._sharedRenderPipelineCache[t]=n),n.useCount++,n.resource}releaseSharedRenderPipeline(e){if(!e.sharedRenderPipeline)return;let t=this._hashSharedRenderPipeline(e.sharedRenderPipeline.props),n=this._sharedRenderPipelineCache[t];n&&(n.useCount--,n.useCount===0&&(n.resource.destroy(),delete this._sharedRenderPipelineCache[t]))}async _createPipelineAsync(e,t,n,r){let i=e[n];if(i)return i.useCount++,i.resource;let a=t[n];if(a)return a.useCount++,await a.promise;let o={promise:void 0,useCount:1};return o.promise=r().then(r=>{delete t[n];let i=e[n];return i?(i.useCount+=o.useCount,r.destroy(),r instanceof v&&this.releaseSharedRenderPipeline(r),i.resource):(r.hash=n,e[n]={resource:r,useCount:o.useCount},r)}).catch(e=>{throw delete t[n],e}),t[n]=o,await o.promise}_destroyPipeline(e){let t=this._getCache(e);return this.device.props._destroyPipelines?(delete t[e.hash],e.destroy(),e instanceof v&&this.releaseSharedRenderPipeline(e),!0):!1}_getCache(e){let t;if(e instanceof ue&&(t=this._computePipelineCache),e instanceof v&&(t=this._renderPipelineCache),!t)throw Error(`${this}`);if(!t[e.hash])throw Error(`${this}: ${e} matched incorrect entry`);return t}_hashComputePipeline(e){return`${this._getHash(e.shader.source)}/${this._getHash(JSON.stringify([e.shaderLayout,e.entryPoint??`main`,e.constants]))}`}_hashRenderPipeline(e){let t=e.vs?this._getHash(e.vs.source):0,n=e.fs?this._getHash(e.fs.source):0,r=this._getWebGLVaryingHash(e),i=this._getHash(JSON.stringify(e.shaderLayout)),a=this._getHash(JSON.stringify(e._uniformBlockLayouts)),o=this._getHash(JSON.stringify(e.bufferLayout)),{type:s}=this.device;switch(s){case`webgl`:let c=this._getHash(JSON.stringify(e.parameters));return`${s}/R/${t}/${n}V${r}T${e.topology}P${c}SL${i}UBL${a}BL${o}`;default:let l=this._getHash(JSON.stringify({vertexEntryPoint:e.vertexEntryPoint,fragmentEntryPoint:e.fragmentEntryPoint})),u=this._getHash(JSON.stringify(e.parameters)),d=this._getWebGPUAttachmentHash(e);return`${s}/R/${t}/${n}V${r}T${e.topology}EP${l}P${u}SL${i}BL${o}A${d}`}}_hashSharedRenderPipeline(e){return`webgl/S/${e.vs?this._getHash(e.vs.source):0}/${e.fs?this._getHash(e.fs.source):0}V${this._getWebGLVaryingHash(e)}`}_getHash(e){return this._hashes[e]===void 0&&(this._hashes[e]=this._hashCounter++),this._hashes[e]}_getWebGLVaryingHash(e){let{varyings:t=[],bufferMode:n=null}=e;return this._getHash(JSON.stringify({varyings:t,bufferMode:n}))}_getWebGPUAttachmentHash(e){let t=e.colorAttachmentFormats??[this.device.preferredColorFormat],n=e.depthStencilAttachmentFormat??(e.parameters?.depthWriteEnabled?this.device.preferredDepthFormat:null);return this._getHash(JSON.stringify({colorAttachmentFormats:t,depthStencilAttachmentFormat:n}))}},Tt=class e{static defaultProps={...w.defaultProps};static getDefaultShaderFactory(t){let n=t.getModuleData(`@luma.gl/core`);return n.defaultShaderFactory||=new e(t),n.defaultShaderFactory}device;_cache={};get[Symbol.toStringTag](){return`ShaderFactory`}toString(){return`${this[Symbol.toStringTag]}(${this.device.id})`}constructor(e){this.device=e}createShader(e){if(!this.device.props._cacheShaders)return this.device.createShader(e);let t=this._hashShader(e),n=this._cache[t];if(n)n.useCount++,this.device.props.debugFactories&&o.log(3,`${this}: Reusing shader ${n.resource.id} count=${n.useCount}`)();else{let r=this.device.createShader({...e,id:e.id?`${e.id}-cached`:void 0});this._cache[t]=n={resource:r,useCount:1},this.device.props.debugFactories&&o.log(3,`${this}: Created new shader ${r.id}`)()}return n.resource}release(e){if(!this.device.props._cacheShaders){e.destroy();return}let t=this._hashShader(e),n=this._cache[t];if(n)if(n.useCount--,n.useCount===0)this.device.props._destroyShaders&&(delete this._cache[t],n.resource.destroy(),this.device.props.debugFactories&&o.log(3,`${this}: Releasing shader ${e.id}, destroyed`)());else if(n.useCount<0)throw Error(`ShaderFactory: Shader ${e.id} released too many times`);else this.device.props.debugFactories&&o.log(3,`${this}: Releasing shader ${e.id} count=${n.useCount}`)()}_hashShader(e){return`${e.stage}:${e.source}`}};function Et(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Dt(e){return Array.isArray(e)?e.length===0||typeof e[0]==`number`:Et(e)}var Ot=class{layout;constructor(e){this.layout=e}has(e){return!!this.layout.fields[e]}get(e){let t=this.layout.fields[e];return t?{offset:t.offset,size:t.size}:void 0}getFlatUniformValues(e){let t={};for(let[n,r]of Object.entries(e)){let e=this.layout.uniformTypes[n];e?this._flattenCompositeValue(t,n,e,r):this.layout.fields[n]&&(t[n]=r)}return t}getData(e){let t=te(this.layout.byteLength);new Uint8Array(t,0,this.layout.byteLength).fill(0);let n={i32:new Int32Array(t),u32:new Uint32Array(t),f32:new Float32Array(t),f16:new Uint16Array(t)},r=this.getFlatUniformValues(e);for(let[e,t]of Object.entries(r))this._writeLeafValue(n,e,t);return new Uint8Array(t,0,this.layout.byteLength)}_flattenCompositeValue(e,t,n,r){if(r!==void 0){if(typeof n==`string`||this.layout.fields[t]){e[t]=r;return}if(Array.isArray(n)){let i=n[0],a=n[1];if(Array.isArray(i))throw Error(`Nested arrays are not supported for ${t}`);if(typeof i==`string`&&Dt(r)){this._flattenPackedArray(e,t,i,a,r);return}if(!Array.isArray(r)){o.warn(`Unsupported uniform array value for ${t}:`,r)();return}for(let n=0;n<Math.min(r.length,a);n++){let a=r[n];a!==void 0&&this._flattenCompositeValue(e,`${t}[${n}]`,i,a)}return}if(se(n)&&kt(r)){for(let[i,a]of Object.entries(r)){if(a===void 0)continue;let r=`${t}.${i}`;this._flattenCompositeValue(e,r,n[i],a)}return}o.warn(`Unsupported uniform value for ${t}:`,r)()}}_flattenPackedArray(e,t,n,r,i){let a=i,o=re(n,this.layout.layout).components;for(let n=0;n<r;n++){let r=n*o;if(r>=a.length)break;o===1?e[`${t}[${n}]`]=Number(a[r]):e[`${t}[${n}]`]=At(i,r,r+o)}}_writeLeafValue(e,t,n){let r=this.layout.fields[t];if(!r){o.warn(`Uniform ${t} not found in layout`)();return}let{type:i,components:a,columns:s,rows:c,offset:l,columnStride:u}=r,d=e[i];if(a===1){d[l]=Number(n);return}let f=n;if(s===1){for(let e=0;e<a;e++)d[l+e]=Number(f[e]??0);return}let p=0;for(let e=0;e<s;e++){let t=l+e*u;for(let e=0;e<c;e++)d[t+e]=Number(f[p++]??0)}}};function kt(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function At(e,t,n){return Array.prototype.slice.call(e,t,n)}var jt=128;function Mt(e,t,n=16){if(e===t)return!0;let r=e,i=t;if(!Dt(r)||!Dt(i)||r.length!==i.length)return!1;let a=Math.min(n,jt);if(r.length>a)return!1;for(let e=0;e<r.length;++e)if(i[e]!==r[e])return!1;return!0}function Nt(e){return Dt(e)?e.slice():e}var Pt=class{name;uniforms={};modifiedUniforms={};modified=!0;bindingLayout={};needsRedraw=`initialized`;constructor(e){if(this.name=e?.name||`unnamed`,e?.name&&e?.shaderLayout){let t=e?.shaderLayout.bindings?.find(t=>t.type===`uniform`&&t.name===e?.name);if(!t)throw Error(e?.name);let n=t;for(let e of n.uniforms||[])this.bindingLayout[e.name]=e}}setUniforms(e){for(let[t,n]of Object.entries(e))this._setUniform(t,n)&&!this.needsRedraw&&this.setNeedsRedraw(`${this.name}.${t}=${n}`)}setNeedsRedraw(e){this.needsRedraw=this.needsRedraw||e}getAllUniforms(){return this.modifiedUniforms={},this.needsRedraw=!1,this.uniforms||{}}_setUniform(e,t){return Mt(this.uniforms[e],t)?!1:(this.uniforms[e]=Nt(t),this.modifiedUniforms[e]=!0,this.modified=!0,!0)}},Ft=1024,It=class{device;uniformBlocks=new Map;shaderBlockLayouts=new Map;shaderBlockWriters=new Map;uniformBuffers=new Map;constructor(e,t){this.device=e;for(let[n,r]of Object.entries(t)){let t=n,i=ne(r.uniformTypes??{},{layout:r.layout??Lt(e)}),a=new Ot(i);this.shaderBlockLayouts.set(t,i),this.shaderBlockWriters.set(t,a);let o=new Pt({name:n});o.setUniforms(a.getFlatUniformValues(r.defaultUniforms||{})),this.uniformBlocks.set(t,o)}}destroy(){for(let e of this.uniformBuffers.values())e.destroy()}setUniforms(e,t){for(let[t,n]of Object.entries(e)){let e=t,r=this.shaderBlockWriters.get(e)?.getFlatUniformValues(n||{});this.uniformBlocks.get(e)?.setUniforms(r||{})}this.updateUniformBuffers(t)}getUniformBufferByteLength(e){let t=this.shaderBlockLayouts.get(e)?.byteLength||0;return Math.max(t,Ft)}getUniformBufferData(e){let t=this.uniformBlocks.get(e)?.getAllUniforms()||{};return this.shaderBlockWriters.get(e)?.getData(t)||new Uint8Array}createUniformBuffer(e,t){t&&this.setUniforms(t);let n=this.getUniformBufferByteLength(e),r=this.device.createBuffer({usage:g.UNIFORM|g.COPY_DST,byteLength:n}),i=this.getUniformBufferData(e);return r.write(i),r}getManagedUniformBuffer(e){if(!this.uniformBuffers.get(e)){let t=this.getUniformBufferByteLength(e),n=this.device.createBuffer({usage:g.UNIFORM|g.COPY_DST,byteLength:t});this.uniformBuffers.set(e,n)}return this.uniformBuffers.get(e)}updateUniformBuffers(e){let t=!1;for(let n of this.uniformBlocks.keys()){let r=this.updateUniformBuffer(n,e);t||=r}return t&&o.log(3,`UniformStore.updateUniformBuffers(): ${t}`)(),t}updateUniformBuffer(e,t){let n=this.uniformBlocks.get(e),r=this.uniformBuffers.get(e),i=!1;if(r&&n?.needsRedraw){i||=n.needsRedraw;let a=this.getUniformBufferData(e);if(r=this.uniformBuffers.get(e),r&&(t?this.device.writeBufferViaCommandEncoder(t,r,a):r.write(a)),o.level>=4){let t=this.uniformBlocks.get(e)?.getAllUniforms();o.log(4,`Writing to uniform buffer ${String(e)}`,a,t)()}}return i}};function Lt(e){return e.type===`webgpu`?`wgsl-uniform`:`std140`}function Rt(e,t,n=`vector`){let{input:r,output:i,interpolation:a=`LINEAR`}=t;if(!r.length||!i.length||!Number.isFinite(e))return null;let o=r.length-1;if(e<=r[0]||o===0)return Bt(i,a,0,n);if(e>=r[o])return Bt(i,a,o,n);let s=0,c=o;for(;c-s>1;){let t=Math.floor((s+c)/2);r[t]<=e?s=t:c=t}let l=r[s],u=r[c]-l;if(u<=0||a===`STEP`)return Bt(i,a,s,n);let d=(e-l)/u;switch(a){case`LINEAR`:{let e=i[s],t=i[c];return!e||!t?null:n===`quaternion`?zt(e,t,d):Vt(e,t,d)}case`CUBICSPLINE`:{let e=i[s*3+1],t=i[s*3+2],r=i[c*3],a=i[c*3+1];if(!e||!t||!r||!a)return null;let o=Ht(e,t,r,a,u,d);return n===`quaternion`?Ut(o):o}default:return null}}function zt(e,t,n){let r=Ut(e),i=Ut(t),a=r.reduce((e,t,n)=>e+t*i[n],0),o=a<0?-1:1;if(a=Math.min(Math.abs(a),1),a>.9995)return Ut(r.map((e,t)=>e+n*(i[t]*o-e)));let s=Math.acos(a),c=Math.sin(s),l=Math.sin((1-n)*s)/c,u=Math.sin(n*s)/c*o;return Ut(r.map((e,t)=>e*l+i[t]*u))}function Bt(e,t,n,r){let i=e[t===`CUBICSPLINE`?n*3+1:n];return i?r===`quaternion`?Ut(i):[...i]:null}function Vt(e,t,n){return e.map((e,r)=>(1-n)*e+n*t[r])}function Ht(e,t,n,r,i,a){let o=a*a,s=o*a;return e.map((e,c)=>(2*s-3*o+1)*e+(s-2*o+a)*t[c]*i+(-2*s+3*o)*r[c]+(s-o)*n[c]*i)}function Ut(e){let t=Math.hypot(...e);return t>0?e.map(e=>e/t):[0,0,0,1]}var Wt=class{name;times;values;interpolation;valueType;binding;constructor(e){this.name=e.name||e.binding.id||`unnamed`,this.times=e.times,this.values=e.values,this.interpolation=e.interpolation||`LINEAR`,this.valueType=e.valueType||`vector`,this.binding=e.binding}get duration(){return this.times[this.times.length-1]||0}get sampler(){return{input:this.times,output:this.values,interpolation:this.interpolation}}evaluate(e){return Rt(e,this.sampler,this.valueType)}},Gt=class{name;tracks;duration;constructor(e){this.name=e.name||`unnamed`,this.tracks=e.tracks,this.duration=e.duration??Math.max(0,...e.tracks.map(e=>e.duration))}},Kt=class{clip;mixer;time=0;timeScale;weight;loop;repetitions;paused=!1;playing=!1;elapsedTime=0;fade=null;constructor(e,t,n={}){this.mixer=e,this.clip=t,this.loop=n.loop||`repeat`,this.repetitions=n.repetitions??1/0,this.timeScale=n.timeScale??1,this.weight=n.weight??1}play(){return this.playing=!0,this.paused=!1,this}pause(){return this.paused=!0,this}resume(){return this.playing=!0,this.paused=!1,this}stop(){return this.playing=!1,this.paused=!1,this.fade=null,this.reset()}reset(){return this.elapsedTime=0,this.time=0,this}setTime(e){return this.elapsedTime=e,this.time=this.resolveLocalTime(e),this}setLoop(e,t=1/0){return this.loop=e,this.repetitions=t,this.time=this.resolveLocalTime(this.elapsedTime),this}setEffectiveWeight(e){return this.weight=Math.max(0,e),this.fade=null,this}setEffectiveTimeScale(e){return this.timeScale=e,this}fadeIn(e){return this.scheduleFade(1,e)}fadeOut(e){return this.scheduleFade(0,e)}crossFadeTo(e,t){return e.weight=0,e.play().fadeIn(t),this.fadeOut(t)}crossFadeFrom(e,t){return e.crossFadeTo(this,t),this}advance(e){!this.playing||this.paused||(this.advanceFade(Math.abs(e)),this.elapsedTime+=e*this.timeScale,this.time=this.resolveLocalTime(this.elapsedTime),this.hasFinished()&&(this.playing=!1))}get shouldApply(){return(this.playing||this.hasFinished())&&this.weight>0}scheduleFade(e,t){return t<=0?(this.weight=e,this.fade=null,this):(this.fade={duration:t,elapsedTime:0,startWeight:this.weight,endWeight:e},this)}advanceFade(e){if(!this.fade)return;this.fade.elapsedTime+=e;let t=Math.min(this.fade.elapsedTime/this.fade.duration,1);this.weight=this.fade.startWeight+(this.fade.endWeight-this.fade.startWeight)*t,t===1&&(this.fade=null)}hasFinished(){let e=this.clip.duration;return e<=0?this.loop===`once`:this.loop===`once`?this.elapsedTime>=e||this.elapsedTime<0:Number.isFinite(this.repetitions)&&Math.abs(this.elapsedTime)>=e*this.repetitions}resolveLocalTime(e){let t=this.clip.duration;if(t<=0)return 0;if(this.loop===`once`)return Math.min(Math.max(e,0),t);if(Number.isFinite(this.repetitions)&&Math.abs(e)>=t*this.repetitions)return this.loop===`ping-pong`&&this.repetitions%2==0||e<0?0:t;let n=e>=0&&e<t?e:(e%t+t)%t;if(this.loop===`repeat`)return n;let r=Math.floor(e/t);return Math.abs(r%2)===0?n:t-n}},qt=class{time=0;timeScale=1;clips=new Map;actions=new Map;initialValues=new Map;constructor(e=[]){e.forEach(e=>this.addClip(e))}addClip(e){return this.clips.set(e.name,e),this}clipAction(e,t){let n=typeof e==`string`?this.clips.get(e):e;if(!n)throw Error(`Unknown animation clip: ${e}`);this.addClip(n);let r=this.actions.get(n);return r||(r=new Kt(this,n,t),this.actions.set(n,r)),r}getAction(e){let t=this.clips.get(e);return t?this.actions.get(t):void 0}update(e){return this.advance(e),this.applyValues(),this}advance(e){let t=e*this.timeScale;return this.time+=t,this.actions.forEach(e=>e.advance(t)),this}setTime(e){return this.time=e,this.actions.forEach(t=>{t.paused||t.setTime(e*t.timeScale)}),this.applyValues(),this}stopAllAction(){return this.actions.forEach(e=>e.stop()),this}applyValues(){let e=new Map;this.actions.forEach(t=>{!t.shouldApply&&!(t.playing&&t.weight===0)||t.clip.tracks.forEach(n=>{let r=n.evaluate(t.time);if(!r)return;let i=n.binding.id||n.binding;if(!this.initialValues.has(i)){let e=n.binding.getValue?.();e&&this.initialValues.set(i,[...e])}if(t.weight===0&&!this.initialValues.has(i))return;let a=e.get(i);if(!a){e.set(i,{binding:n.binding,value:[...r],valueType:n.valueType,weight:t.weight});return}if(t.weight===0)return;let o=a.weight+t.weight,s=t.weight/o;a.value=n.valueType===`quaternion`?zt(a.value,r,s):a.value.map((e,t)=>e+(r[t]-e)*s),a.weight=o})}),e.forEach(({binding:e,value:t,valueType:n,weight:r},i)=>{let a=r<1?this.initialValues.get(i):void 0;a&&a.length===t.length&&(t=n===`quaternion`?zt(a,t,r):t.map((e,t)=>a[t]+(e-a[t])*r)),e.setValue(t)})}},Jt=0,Yt=class{constructor(e){this.userData={},this.id=e.id||`geometry-${++Jt}`,this.topology=e.topology,this.attributes={};let t=e.indices?Xt(e.indices):void 0;for(let[n,r]of Object.entries(e.attributes||{})){let e=Xt(r);if((n===`POSITION`||n===`positions`)&&(e.size||=3),n===`indices`){if(t)throw Error(`Geometry has multiple index attributes`);t=e}else this.attributes[n]=e}if(t){if(!(t.value instanceof Uint16Array||t.value instanceof Uint32Array))throw Error(`Geometry indices must be a Uint16Array or Uint32Array`);t.size=1,this.indices=t,Qt(t,this.attributes)}if(this.vertexCount=e.vertexCount??$t(this.attributes,this.indices),!Number.isInteger(this.vertexCount)||this.vertexCount<0)throw Error(`Geometry vertexCount must be a non-negative integer`)}getVertexCount(){return this.vertexCount}getAttributes(){return this.indices?{indices:this.indices,...this.attributes}:this.attributes}};function Xt(e){let t=Zt(e)?{value:e}:{...e};if(!Zt(t.value))throw Error(`Geometry attributes must contain a typed-array value`);if(t.size!==void 0&&(!Number.isInteger(t.size)||t.size<1))throw Error(`Geometry attribute size must be a positive integer`);if(t.size&&t.value.length%t.size!==0)throw Error(`Geometry attribute length must be divisible by its size`);return t}function Zt(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Qt(e,t){let n=-1;for(let t of e.value)n=Math.max(n,Number(t));for(let[e,r]of Object.entries(t))if(!r.constant&&r.size){let t=r.value.length/r.size;if(n>=t)throw Error(`Geometry index ${n} exceeds ${e} vertex count ${t}`)}}function $t(e,t){if(t)return t.value.length;let n=1/0;for(let t of Object.values(e))!t.constant&&t.size&&(n=Math.min(n,t.value.length/t.size));if(!Number.isFinite(n))throw Error(`Geometry has no countable attributes`);return n}function en(e){if(!e.indices)return e;let t=e.indices.value,n={};for(let[r,i]of Object.entries(e.attributes)){if(!i)continue;if(i.constant||!i.size){n[r]=i;continue}let e=i.value.constructor,a=new e(t.length*i.size);for(let e=0;e<t.length;e++)for(let n=0;n<i.size;n++)a[e*i.size+n]=i.value[Number(t[e])*i.size+n];n[r]={...i,value:a}}return{attributes:n}}function tn(e,t){if(!Number.isFinite(e)||e<=0)throw Error(`${t} must be greater than zero`)}function nn(e,t){if(!Number.isFinite(e)||e<0)throw Error(`${t} must be non-negative`)}function rn(e,t,n=1){if(!Number.isInteger(e)||e<n)throw Error(`${t} must be an integer >= ${n}`)}function an(e,t){return e>65535?new Uint32Array(t):new Uint16Array(t)}function on(e,t){let n=[],r=[],i=[],a=[],o=t+1;for(let a=0;a<e.length;a++){let o=e[a];for(let s=0;s<=t;s++){let c=s/t,l=c*Math.PI*2,u=Math.sin(l),d=Math.cos(l);n.push(u*o.radius,o.y,d*o.radius),r.push(u*o.normalRadius,o.normalY,d*o.normalRadius),i.push(c,a/(e.length-1))}}for(let n=0;n<e.length-1;n++)for(let e=0;e<t;e++){let t=n*o+e,r=t+1,i=t+o,s=i+1;a.push(t,r,s,t,s,i)}return{positions:n,normals:r,texCoords:i,indices:a,indexArray:an(n.length/3,a)}}var sn=class extends Yt{constructor(e={}){let{topRadius:t=0,bottomRadius:n=0,topCap:r=!1,bottomCap:i=!1,height:a=1,nradial:o=10,nvertical:s=1,verticalAxis:c=`y`}=e;if(nn(t,`topRadius`),nn(n,`bottomRadius`),t===0&&n===0)throw Error(`At least one radius must be greater than zero`);tn(a,`height`),rn(o,`nradial`,3),rn(s,`nvertical`);let l=[],u=[],d=[],f=[],p=o+1,m=(n-t)/a,h=1/Math.hypot(1,m),g=(e,t,n,r,i)=>{let a=l.length/3/p;for(let a=0;a<=o;a++){let s=a/o,f=s*Math.PI*2,p=Math.sin(f),m=Math.cos(f),h=cn([p*e,t,m*e],c),g=cn([p*n,r,m*n],c);l.push(...h),u.push(...g),d.push(s,i)}return a},_=(e,t)=>{for(let n=0;n<o;n++){let r=e*p+n,i=r+1,a=t*p+n,o=a+1;f.push(r,i,o,r,o,a)}},v;i&&(_(g(0,-a/2,0,-1,0),g(n,-a/2,0,-1,1)),v=g(n,-a/2,h,m*h,0));for(let e=0;e<=s;e++){let r=e/s,o=g(n+(t-n)*r,(r-.5)*a,h,m*h,r);v!==void 0&&!(i&&e===0)&&_(v,o),v=o}r&&v!==void 0&&_(g(t,a/2,0,1,1),g(0,a/2,0,1,0));let y=l.length/3;super({id:e.id,topology:`triangle-list`,indices:an(y,f),attributes:{POSITION:{size:3,value:new Float32Array(l)},NORMAL:{size:3,value:new Float32Array(u)},TEXCOORD_0:{size:2,value:new Float32Array(d)},...e.attributes}})}};function cn(e,t){switch(t){case`x`:return[e[1],e[2],e[0]];case`z`:return[e[2],e[0],e[1]];default:return[e[0],e[1],e[2]]}}var ln=class extends Yt{constructor(e){let{sizeX:t,sizeZ:n,nx:r=1,nz:i=1}=e;tn(t,`sizeX`),tn(n,`sizeZ`),rn(r,`nx`),rn(i,`nz`);let a=[],o=[],s=[],c=[];for(let e=0;e<=i;e++){let c=e/i;for(let e=0;e<=r;e++){let i=e/r;a.push((i-.5)*t,0,(.5-c)*n),o.push(0,1,0),s.push(i,c)}}let l=r+1;for(let e=0;e<i;e++)for(let t=0;t<r;t++){let n=e*l+t,r=n+1,i=n+l,a=i+1;c.push(n,r,a,n,a,i)}let u=a.length/3;super({id:e.id,topology:`triangle-list`,indices:an(u,c),attributes:{POSITION:{size:3,value:new Float32Array(a)},NORMAL:{size:3,value:new Float32Array(o)},TEXCOORD_0:{size:2,value:new Float32Array(s)},...e.attributes}})}},un=class extends Yt{constructor(e={}){let{radius:t=.5,nlat:n=10,nlong:r=10}=e;tn(t,`radius`),rn(n,`nlat`,2),rn(r,`nlong`,3);let i=[];for(let e=0;e<=n;e++){let r=-Math.PI/2+e/n*Math.PI,a=Math.cos(r),o=Math.sin(r);i.push({radius:t*a,y:t*o,normalRadius:a,normalY:o})}let a=on(i,r);super({id:e.id,topology:`triangle-list`,indices:a.indexArray,attributes:{POSITION:{size:3,value:new Float32Array(a.positions)},NORMAL:{size:3,value:new Float32Array(a.normals)},TEXCOORD_0:{size:2,value:new Float32Array(a.texCoords)},...e.attributes}})}},dn=class extends Yt{constructor(e){let{sample:t,normal:n,uSegments:r=32,vSegments:i=32,periodicU:a=!1,periodicV:o=!1}=e;rn(r,`uSegments`),rn(i,`vSegments`);let s=(r+1)*(i+1),c=r*i*6;if(!Number.isSafeInteger(c)||c>4294967295)throw RangeError(`Surface exceeds 32-bit index-buffer length`);if(!Number.isSafeInteger(s)||s>4294967295)throw RangeError(`Surface exceeds 32-bit indexing`);let l=new Float32Array(s*3),u=new Float32Array(s*3),d=new Float32Array(s*2),f=(e,t)=>t?(e%1+1)%1:Math.max(0,Math.min(1,e)),p=(e,n)=>fn(t(f(e,a),f(n,o))),m=1e-5,h=0;for(let e=0;e<=i;e++)for(let t=0;t<=r;t++,h++){let s=t/r,c=e/i,g=f(s,a),_=f(c,o);l.set(p(g,_),h*3);let v;if(n)v=fn(n(g,_));else{let e=p(g-m,_),t=p(g+m,_),n=p(g,_-m),r=p(g,_+m),i=pn(t.map((t,n)=>t-e[n])),a=pn(r.map((e,t)=>e-n[t]));v=[i[1]*a[2]-i[2]*a[1],i[2]*a[0]-i[0]*a[2],i[0]*a[1]-i[1]*a[0]]}u.set(pn(v),h*3),d.set([s,c],h*2)}for(let e of l)if(!Number.isFinite(e))throw RangeError(`Positions must be representable as Float32`);let g=s>65535?new Uint32Array(c):new Uint16Array(c),_=r+1,v=0;for(let e=0;e<i;e++)for(let t=0;t<r;t++){let n=e*_+t,r=n+1,i=n+_,a=i+1;g[v++]=n,g[v++]=r,g[v++]=a,g[v++]=n,g[v++]=a,g[v++]=i}super({id:e.id,topology:`triangle-list`,indices:g,attributes:{POSITION:{size:3,value:l},NORMAL:{size:3,value:u},TEXCOORD_0:{size:2,value:d},...e.attributes}})}};function fn(e){if(!e||e.length!==3||!Array.from(e).every(Number.isFinite))throw RangeError(`Surface samples and normals must be finite triples`);return Array.from(e)}function pn(e){let t=Math.max(...e.map(Math.abs));if(!t)return[0,0,0];let n=e.map(e=>e/t),r=Math.hypot(...n);return n.map(e=>e===0?0:e/r)}var mn=class extends dn{constructor(e={}){let{majorRadius:t=1,minorRadius:n=.3,majorSegments:r=48,minorSegments:i=24,arc:a=Math.PI*2,startAngle:o=0,cap:s=!1}=e;if(tn(t,`majorRadius`),tn(n,`minorRadius`),n>=t)throw RangeError(`Ring torus requires minorRadius < majorRadius`);if(!Number.isFinite(a)||a<=0||a>Math.PI*2)throw RangeError(`arc must be in (0, 2π]`);if(rn(r,`majorSegments`,3),rn(i,`minorSegments`,3),!Number.isFinite(o))throw RangeError(`startAngle must be finite`);let c=s&&a<Math.PI*2;if(super({...e,attributes:c?void 0:e.attributes,uSegments:r,vSegments:i,periodicU:a===Math.PI*2,periodicV:!0,sample:(e,r)=>{let i=o+e*a,s=r*Math.PI*2,c=t+n*Math.cos(s);return[c*Math.cos(i),n*Math.sin(s),-c*Math.sin(i)]},normal:(e,t)=>[Math.cos(t*Math.PI*2)*Math.cos(o+e*a),Math.sin(t*Math.PI*2),-Math.cos(t*Math.PI*2)*Math.sin(o+e*a)]}),c){let n=this.attributes.POSITION.value,s=Array.from(n),c=Array.from(this.attributes.NORMAL.value),l=Array.from(this.attributes.TEXCOORD_0.value),u=Array.from(this.indices.value);for(let[e,d]of[[o,-1],[o+a,1]]){let a=[-Math.sin(e)*d,0,-Math.cos(e)*d],o=s.length/3;s.push(t*Math.cos(e),0,-t*Math.sin(e)),c.push(...a),l.push(.5,.5);for(let e=0;e<=i;e++){let t=e%i*Math.PI*2/i,f=(e*(r+1)+(d<0?0:r))*3;if(s.push(...n.slice(f,f+3)),c.push(...a),l.push((Math.cos(t)+1)/2,(Math.sin(t)+1)/2),e<i){let t=o+e+1,n=t+1;u.push(o,...d>0?[n,t]:[t,n])}}}let d=new Yt({id:this.id,topology:this.topology,indices:an(s.length/3,u),attributes:{POSITION:{size:3,value:new Float32Array(s)},NORMAL:{size:3,value:new Float32Array(c)},TEXCOORD_0:{size:2,value:new Float32Array(l)},...e.attributes}});Object.assign(this,{attributes:d.attributes,indices:d.indices,vertexCount:d.vertexCount})}}},hn=class extends dn{constructor(e){let{points:t,segments:n=48,phiStart:r=0,phiLength:i=Math.PI*2}=e;if(!t||t.length<2||t.some(e=>e.length!==2||!e.every(Number.isFinite)||e[0]<0))throw RangeError(`Lathe needs at least two finite [nonnegative radius, height] points`);if(!Number.isFinite(r)||!Number.isFinite(i)||i<=0||i>Math.PI*2)throw RangeError(`Invalid lathe angular sweep`);if(n<3)throw RangeError(`Lathe requires at least three angular segments`);let a=t.map(e=>[...e]),o=a.slice(1).map((e,t)=>{let n=e[0]-a[t][0],r=e[1]-a[t][1];if(n===0&&r===0)throw RangeError(`Consecutive profile points must differ`);return pn([r,-n,0])}),s=a.map((e,t)=>{let n=o[Math.max(0,t-1)],r=o[Math.min(t,o.length-1)];return pn(n.map((e,t)=>e+r[t]))}),c=e=>{let t=e*(a.length-1),n=Math.min(a.length-2,Math.floor(t));return{i:n,t:t-n}};super({...e,uSegments:n,vSegments:a.length-1,periodicU:i===Math.PI*2,sample:(e,t)=>{let{i:n,t:o}=c(t),s=a[n][0]*(1-o)+a[n+1][0]*o,l=a[n][1]*(1-o)+a[n+1][1]*o,u=r+e*i;return[s*Math.cos(u),l,-s*Math.sin(u)]},normal:(e,t)=>{let{i:n,t:a}=c(t),o=s[n].map((e,t)=>e*(1-a)+s[n+1][t]*a),l=r+e*i;return[o[0]*Math.cos(l),o[1],-o[0]*Math.sin(l)]}})}},gn=class extends Yt{bufferLayout;constructor(e){let t={},n=new Map;for(let[r,i]of Object.entries(e.attributes)){let e=_n(r),a=n.get(e);a&&delete t[a],n.set(e,r),t[r]=i}let r=e.indices,i=r instanceof Uint8Array?new Uint16Array(r):r&&!ArrayBuffer.isView(r)&&r.value instanceof Uint8Array?{...r,value:new Uint16Array(r.value)}:r;super({...e,attributes:t,indices:i});for(let[e,n]of Object.entries(t))!ArrayBuffer.isView(n)&&Object.isExtensible(n)&&e!==`indices`&&(Object.assign(n,this.attributes[e]),this.attributes[e]=n);this.bufferLayout=e.bufferLayout||vn(this.attributes)}};function _n(e){switch(e){case`POSITION`:return`positions`;case`NORMAL`:return`normals`;case`TEXCOORD_0`:return`texCoords`;case`TEXCOORD_1`:return`texCoords1`;case`COLOR_0`:return`colors`;default:return e}}function vn(e){let t=[];for(let[n,i]of Object.entries(e)){if(!i)continue;let{value:e,size:a,normalized:o}=i;if(a===void 0)throw Error(`Attribute ${n} is missing a size`);t.push({name:_n(n),format:r.getVertexFormatFromAttribute(e,a,o)})}return t}function yn(e,t={}){let n=t.bufferName||`geometry`;if(bn(e,n))return e;let i=t.minAttributeAlignment||4,a=xn(e,t.attributes),o=[],s=0,c=1/0;for(let[e,t]of a){if(!t)continue;if(t.constant)throw Error(`Attribute ${e} is constant`);let{value:n,size:a,normalized:l}=t;if(!ArrayBuffer.isView(n))throw Error(`Attribute ${e} is missing typed array data`);if(a===void 0)throw Error(`Attribute ${e} is missing a size`);let u=r.getVertexFormatFromAttribute(n,a,l),d=r.getVertexFormatInfo(u);s=Cn(s,i),o.push({sourceName:e,attributeName:_n(e),value:n,size:a,format:u,byteOffset:s,byteLength:d.byteLength}),s+=d.byteLength;let f=n.length/a;if(!Number.isInteger(f))throw Error(`Attribute ${e} length is not divisible by size`);c=Math.min(c,f)}if(o.length===0||!Number.isFinite(c))throw Error(`Geometry ${e.id} has no interleavable attributes`);let l=Cn(s,i),u=new ArrayBuffer(c*l);for(let e of o)Sn(u,c,l,e);return new gn({id:e.id,topology:e.topology||`triangle-list`,vertexCount:e.vertexCount,indices:e.indices,attributes:{[n]:{value:new Uint8Array(u),size:l,byteStride:l}},bufferLayout:[{name:n,stepMode:`vertex`,byteStride:l,attributes:o.map(e=>({attribute:e.attributeName,format:e.format,byteOffset:e.byteOffset}))}]})}function bn(e,t){if(e.bufferLayout?.length!==1)return!1;let n=e.bufferLayout[0];return n.name===t&&!!n.attributes?.length&&!!e.attributes[t]}function xn(e,t){let n=new Map,r=t||Object.keys(e.attributes);for(let t of r){let r=e.attributes[t];r&&n.set(_n(t),[t,r])}return Array.from(n.values())}function Sn(e,t,n,r){let i=r.value.constructor,a=i.BYTES_PER_ELEMENT;if(r.byteOffset%a!==0||n%a!==0)throw Error(`Attribute ${r.sourceName} is not aligned to its component type`);let o=new i(e),s=r.value,c=r.byteOffset/a,l=n/a;for(let e=0;e<t;e++){let t=e*r.size,n=e*l+c;for(let e=0;e<r.size;e++)o[n+e]=s[t+e]}}function Cn(e,t){return Math.ceil(e/t)*t}function wn(e){let t=e.value;if(t instanceof Float32Array)return t;let n=new Float32Array(t.length),r=On(t),i=t instanceof Int8Array||t instanceof Int16Array||t instanceof Int32Array;for(let a=0;a<t.length;a++){let o=Number(t[a]);n[a]=e.normalized&&r?i?Math.max(o/r,-1):o/r:o}return n}function Tn(e,t,n){let r={};for(let i of[`POSITION`,`NORMAL`,`TANGENT`]){let a=e[i];if(!a)continue;let o=new Float32Array(a),s=i===`TANGENT`?4:3,c=Math.floor(a.length/s);for(let e=0;e<Math.min(t.length,n.length);e++){let r=n[e],a=t[e][i];if(!r||!a)continue;let l=i===`TANGENT`&&a.length===c*4?4:3;for(let e=0;e<c;e++){let t=e*s,n=e*l;for(let e=0;e<3;e++)o[t+e]+=(a[n+e]||0)*r}}i!==`POSITION`&&kn(o,s),r[i]=o}return r}function En(e,t,n,r){let i={};for(let e of[`POSITION`,`NORMAL`,`TANGENT`]){let n=t.attributes[e];n&&(i[e]=wn(n))}let a=Tn(i,n,r),o={};for(let[e,n]of Object.entries(t.attributes))n&&(o[e]=n);for(let e of[`POSITION`,`NORMAL`,`TANGENT`]){let t=a[e],n=o[e];t&&n&&(o[e]={...n,value:Dn(n,t)})}let s=yn(new gn({id:t.id,topology:t.topology||`triangle-list`,vertexCount:t.vertexCount,indices:t.indices,attributes:o,bufferLayout:t.bufferLayout})).attributes.geometry?.value,c=e._gpuGeometry?.attributes.geometry||e.bufferAttributes.geometry;if(s&&c){c.write(s);return}for(let t of[`POSITION`,`NORMAL`,`TANGENT`]){let n=a[t];if(n){let r=t===`POSITION`?`positions`:t===`NORMAL`?`normals`:`TANGENT`;e.bufferAttributes[r]?.write(n)}}}function Dn(e,t){if(e.value instanceof Float32Array)return t;let n=e.value.slice(),r=On(n),i=n instanceof Int8Array||n instanceof Int16Array||n instanceof Int32Array;for(let a=0;a<t.length;a++){let o=t[a];n[a]=e.normalized&&r?Math.round(Math.max(i?-1:0,Math.min(1,o))*r):o}return n}function On(e){return e instanceof Int8Array?127:e instanceof Uint8Array||e instanceof Uint8ClampedArray?255:e instanceof Int16Array?32767:e instanceof Uint16Array?65535:e instanceof Int32Array?2147483647:e instanceof Uint32Array?4294967295:0}function kn(e,t){for(let n=0;n<e.length;n+=t){let t=Math.hypot(e[n],e[n+1],e[n+2]);t>0&&(e[n]/=t,e[n+1]/=t,e[n+2]/=t)}}function An(e){let{joints:t,meshNode:n,worldMatrices:r,inverseBindMatrices:i,target:a}=e,o=t.length,s=a&&a.length===o*16?a:new Float32Array(o*16),c=n?r.get(n)||n.matrix:void 0,l=c?new D(c).invert():null;for(let e=0;e<o;e++){let n=t[e],a=r.get(n)||n.matrix,o=l?new D(l).multiplyRight(a):new D(a),c=e*16;if(i&&i.length>=c+16){let e=new D;for(let t=0;t<16;t++)e[t]=i[c+t];o.multiplyRight(e)}s.set(o,c)}return s}var jn=class{constructor(e){}async onInitialize(e){return null}};function Mn(e){let t=typeof window<`u`?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null;return t?t.call(window,e):setTimeout(()=>e(typeof performance<`u`?performance.now():Date.now()),1e3/60)}function Nn(e){let t=typeof window<`u`?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null;if(t){t.call(window,e);return}clearTimeout(e)}var Pn=0,Fn=`Animation Loop`,In={requestAnimationFrame:e=>Mn(e),cancelAnimationFrame:e=>Nn(e)},Ln=class e{static defaultAnimationLoopProps={device:null,mobileQuality:void 0,onAddHTML:()=>``,onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:In};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw=`initialized`;_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(t){if(this.props={...e.defaultAnimationLoopProps,...t},t=this.props,!t.device)throw Error(`No device provided`);this.stats=t.stats||new i({id:`animation-loop-${Pn++}`}),this.sharedStats=vt.stats.get(Fn),this.frameRate=this.stats.get(`Frame Rate`),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get(`CPU Time`),this.gpuTime=this.stats.get(`GPU Time`),this.setProps({autoResizeViewport:t.autoResizeViewport,animationFrameProvider:t.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this._stopEventHandling(),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(t){this._error=t,this.props.onError(t),this.props.onError===e.defaultAnimationLoopProps.onError&&typeof window<`u`&&typeof ErrorEvent<`u`&&window.dispatchEvent(new ErrorEvent(`error`,{error:t,message:t.message}))}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if(`autoResizeViewport`in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),`animationFrameProvider`in e){let t=e.animationFrameProvider||In;if(t!==this.props.animationFrameProvider){let e=this._animationFrameId!==null;e&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,e&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}return this._running?(this._cancelAnimationFrame(),this._requestAnimationFrame(),this):null}catch(e){let t=e instanceof Error?e:Error(`Unknown error`);throw this.props.onError(t),t}}stop(){if(this._running){let e=this.animationProps;this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0,e&&this.props.onFinalize(e)}return this}redraw(e,t=null){return this.device?.isLost||this._error?this:(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&=(this._resolveNextFrame(this),this._nextFramePromise=null,null),this._endFrameTimers(),this)}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw(`waitForRender`),this._nextFramePromise||=new Promise(e=>{this._resolveNextFrame=e}),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw(`toDataURL`),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw Error(`OffscreenCanvas`)}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){this._animationFrameId!==null&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){if(this._running)try{this.redraw(e,t??null),this._requestAnimationFrame()}catch(e){let t=e instanceof Error?e:Error(String(e));this.reportError(t),this.stop()}}_renderFrame(e){if(this.display){this.display._renderFrame(e);return}let t=this.props.onRender(this._getAnimationProps());this.device&&t!==!1&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw Error(`loop`);let t=e?.canvas,n=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:n,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null,mobileQuality:this.props.mobileQuality}}_getAnimationProps(){if(!this.animationProps)throw Error(`animationProps`);return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:n}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw(`drawing buffer resized`),n!==this.animationProps.aspect&&this.setNeedsRedraw(`drawing buffer aspect changed`),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=n,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw Error(`No device provided`);this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement(`div`);document.body.appendChild(e),e.style.position=`relative`;let t=document.createElement(`div`);t.style.position=`absolute`,t.style.left=`10px`,t.style.bottom=`10px`,t.style.width=`300px`,t.style.background=`white`,this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let n=this.props.onAddHTML(t);n&&(t.innerHTML=n)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize();return{width:e,height:t,aspect:e>0&&t>0?e/t:1}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??(typeof performance<`u`?performance.now():Date.now());if(this._lastFrameTime){let e=t-this._lastFrameTime;e>0&&this.frameRate.addTime(e)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;e!==void 0&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener(`mousemove`,this._onMousemove),this.canvas.addEventListener(`mouseleave`,this._onMouseleave))}_stopEventHandling(){this.canvas?.removeEventListener(`mousemove`,this._onMousemove),this.canvas?.removeEventListener(`mouseleave`,this._onMouseleave)}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}};function Rn(e,t){let n=null,r=t?.device||vt.createDevice({id:`animation-loop`,adapters:t?.adapters,createCanvasContext:!0}),i=new Ln({...t,device:r,async onInitialize(t){Bn(t.animationLoop.device);try{return n=new e(t),await n?.onInitialize(t)}catch(e){console.error(e),n=null;let r=e instanceof Error?e:Error(String(e));return zn(t.animationLoop.device,r),t.animationLoop.reportError(r),t.animationLoop.stop(),null}},onRender(e){let r=n?.onRender(e),i=t?.onAfterRender?.(e,n);return t?.onAfterRender?r!==!1||i!==!1:r},onFinalize(e){try{n?.onFinalize(e)}finally{n=null}}}),a=i;return a.getAnimationLoopTemplate=()=>n,i.getInfo=()=>this.AnimationLoopTemplateCtor.info,a}function zn(e,t){if(!e)return;let n=e.getDefaultCanvasContext().canvas;if(n instanceof HTMLCanvasElement){n.style.overflow=`visible`;let e=document.getElementById(`animation-loop-error`);e?.remove(),e=document.createElement(`h1`),e.id=`animation-loop-error`,e.innerHTML=t.message,e.style.position=`absolute`,e.style.top=`10px`,e.style.left=`10px`,e.style.color=`black`,e.style.backgroundColor=`red`,n.parentElement?.appendChild(e)}}function Bn(e){if(!e)return;let t=document.getElementById(`animation-loop-error`);t&&t.remove()}var Vn={target:[0,0,0],distance:10,yaw:0,pitch:.25,roll:0,minDistance:1,maxDistance:100,minPitch:-Math.PI/2+.01,maxPitch:Math.PI/2-.01,rotateSpeed:.006,zoomSpeed:.001,enabled:!0,enableRotate:!1,enableZoom:!0,enablePan:!1,panModifier:`shift`,panSpeed:.0018,autoRotate:!1,autoRotateSpeed:.1},Hn=class{canvas;props;yaw;pitch;roll;distance;dragging=!1;activePointers=new Map;lastPointer=[0,0];previousPinchDistance=null;previousPinchAngle=null;previousTimeMilliseconds=null;previousCursor;previousTouchAction;constructor(e,t={}){this.canvas=e,this.props={...Vn,...t},this.props.target=[...this.props.target],this.yaw=this.props.yaw,this.pitch=Un(this.props.pitch,this.props.minPitch,this.props.maxPitch),this.roll=this.props.roll,this.distance=Un(this.props.distance,this.props.minDistance,this.props.maxDistance),this.previousCursor=e.style.cursor,this.previousTouchAction=e.style.touchAction,e.style.cursor=`grab`,e.style.touchAction=`none`,e.addEventListener(`pointerdown`,this.handlePointerDown),e.addEventListener(`pointermove`,this.handlePointerMove),e.addEventListener(`pointerup`,this.handlePointerUp),e.addEventListener(`pointercancel`,this.handlePointerUp),e.addEventListener(`wheel`,this.handleWheel,{passive:!1})}update(e){if(this.previousTimeMilliseconds!==null&&this.props.enabled&&this.props.autoRotate&&!this.dragging){let t=Math.min(Math.max(e-this.previousTimeMilliseconds,0)/1e3,.1);this.yaw+=this.props.autoRotateSpeed*t}this.previousTimeMilliseconds=e}getEyePosition(){let e=this.distance*Math.cos(this.pitch);return[this.props.target[0]+e*Math.sin(this.yaw),this.props.target[1]+this.distance*Math.sin(this.pitch),this.props.target[2]+e*Math.cos(this.yaw)]}getUpDirection(){return this.getCameraFrame().up}getCameraFrame(){let e=Math.sin(this.yaw),t=Math.cos(this.yaw),n=Math.sin(this.pitch),r=Math.cos(this.pitch),i=Math.sin(this.roll),a=Math.cos(this.roll),o=[t,0,-e],s=[-n*e,r,-n*t];return{right:[o[0]*a-s[0]*i,o[1]*a-s[1]*i,o[2]*a-s[2]*i],up:[s[0]*a+o[0]*i,s[1]*a+o[1]*i,s[2]*a+o[2]*i]}}setAutoRotate(e){this.props.autoRotate=e}setProps(e){Object.assign(this.props,e),e.enabled===!1&&this.dragging&&this.endPointerInteraction(),e.target&&(this.props.target=[...e.target]),e.yaw!==void 0&&(this.yaw=e.yaw),(e.pitch!==void 0||e.minPitch!==void 0||e.maxPitch!==void 0)&&(this.pitch=Un(e.pitch??this.pitch,this.props.minPitch,this.props.maxPitch)),e.roll!==void 0&&(this.roll=e.roll),(e.distance!==void 0||e.minDistance!==void 0||e.maxDistance!==void 0)&&(this.distance=Un(e.distance??this.distance,this.props.minDistance,this.props.maxDistance))}reset(){this.yaw=this.props.yaw,this.pitch=Un(this.props.pitch,this.props.minPitch,this.props.maxPitch),this.roll=this.props.roll,this.distance=Un(this.props.distance,this.props.minDistance,this.props.maxDistance)}destroy(){this.canvas.removeEventListener(`pointerdown`,this.handlePointerDown),this.canvas.removeEventListener(`pointermove`,this.handlePointerMove),this.canvas.removeEventListener(`pointerup`,this.handlePointerUp),this.canvas.removeEventListener(`pointercancel`,this.handlePointerUp),this.canvas.removeEventListener(`wheel`,this.handleWheel),this.endPointerInteraction(),this.canvas.style.cursor=this.previousCursor,this.canvas.style.touchAction=this.previousTouchAction}handlePointerDown=e=>{if(!(!this.props.enabled||e.button!==0||this.activePointers.has(e.pointerId)||this.activePointers.size>=2||this.activePointers.size>0&&e.pointerType!==`touch`)){if(this.activePointers.size===0&&this.props.onInteractionStart?.(),this.dragging=!0,this.activePointers.set(e.pointerId,[e.clientX,e.clientY]),this.activePointers.size===1)this.lastPointer=[e.clientX,e.clientY];else{let{center:e,distance:t,angle:n}=this.getMultiPointerState();this.lastPointer=e,this.previousPinchDistance=t,this.previousPinchAngle=t>0?n:null}this.canvas.setPointerCapture(e.pointerId),this.canvas.style.cursor=`grabbing`}};handlePointerMove=e=>{if(!this.props.enabled||!this.dragging||!this.activePointers.has(e.pointerId))return;if(this.activePointers.set(e.pointerId,[e.clientX,e.clientY]),this.activePointers.size>1){let{center:e,distance:t,angle:n}=this.getMultiPointerState();this.props.enablePan&&this.panTarget(e[0]-this.lastPointer[0],e[1]-this.lastPointer[1]),this.props.enableZoom&&this.previousPinchDistance&&t>0&&(this.distance=Un(this.distance*this.previousPinchDistance/t,this.props.minDistance,this.props.maxDistance)),this.props.enableRotate&&this.previousPinchAngle!==null&&t>0&&(this.roll+=Wn(n-this.previousPinchAngle)),this.lastPointer=e,this.previousPinchDistance=t,this.previousPinchAngle=t>0?n:null;return}let t=e.clientX-this.lastPointer[0],n=e.clientY-this.lastPointer[1];this.lastPointer=[e.clientX,e.clientY],this.props.enablePan&&e[`${this.props.panModifier}Key`]?this.panTarget(t,n):(this.yaw-=t*this.props.rotateSpeed,this.pitch=Un(this.pitch-n*(this.props.pitchSpeed??this.props.rotateSpeed),this.props.minPitch,this.props.maxPitch))};handlePointerUp=e=>{if(!this.activePointers.has(e.pointerId))return;this.canvas.hasPointerCapture(e.pointerId)&&this.canvas.releasePointerCapture(e.pointerId),this.activePointers.delete(e.pointerId),this.previousPinchDistance=null,this.previousPinchAngle=null;let t=this.activePointers.entries().next().value;if(t){this.lastPointer=t[1];return}this.endPointerInteraction()};endPointerInteraction(){this.dragging=!1;for(let e of this.activePointers.keys())this.canvas.hasPointerCapture(e)&&this.canvas.releasePointerCapture(e);this.activePointers.clear(),this.previousPinchDistance=null,this.previousPinchAngle=null,this.canvas.style.cursor=`grab`}getMultiPointerState(){let[e,t]=this.activePointers.values(),n=t[0]-e[0],r=t[1]-e[1];return{center:[(e[0]+t[0])/2,(e[1]+t[1])/2],distance:Math.hypot(n,r),angle:Math.atan2(r,n)}}panTarget(e,t){let n=this.distance*this.props.panSpeed,{right:r,up:i}=this.getCameraFrame();this.props.target=[this.props.target[0]+(-r[0]*e+i[0]*t)*n,this.props.target[1]+(-r[1]*e+i[1]*t)*n,this.props.target[2]+(-r[2]*e+i[2]*t)*n]}handleWheel=e=>{if(!this.props.enabled||!this.props.enableZoom)return;e.preventDefault(),this.props.onInteractionStart?.();let t=Un(e.deltaY,-240,240);this.distance=Un(this.distance*Math.exp(t*this.props.zoomSpeed),this.props.minDistance,this.props.maxDistance)}};function Un(e,t,n){return Math.min(Math.max(e,t),n)}function Wn(e){return Math.atan2(Math.sin(e),Math.cos(e))}function Gn(e,t){if(!e){let e=Error(t||`shaders: assertion failed.`);throw Error.captureStackTrace?.(e,Gn),e}}var Kn={number:{type:`number`,validate(e,t){return Number.isFinite(e)&&typeof t==`object`&&(t.max===void 0||e<=t.max)&&(t.min===void 0||e>=t.min)}},array:{type:`array`,validate(e,t){return Array.isArray(e)||ArrayBuffer.isView(e)}}};function qn(e){let t={};for(let[n,r]of Object.entries(e))t[n]=Jn(r);return t}function Jn(e){let t=Yn(e);if(t!==`object`)return{value:e,...Kn[t],type:t};if(typeof e==`object`)return e?e.type===void 0?e.value===void 0?{type:`object`,value:e}:(t=Yn(e.value),{...e,...Kn[t],type:t}):{...e,...Kn[e.type],type:e.type}:{type:`object`,value:null};throw Error(`props`)}function Yn(e){return Array.isArray(e)||ArrayBuffer.isView(e)?`array`:typeof e}var Xn={vertex:`#ifdef MODULE_LOGDEPTH
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
`},Zn=/void\s+main\s*\([^)]*\)\s*\{\n?/,Qn=/}\n?[^{}]*$/,$n=[],er=`__LUMA_INJECT_DECLARATIONS__`;function tr(e){let t={vertex:{},fragment:{}};for(let n in e){let r=e[n],i=nr(n);typeof r==`string`&&(r={order:0,injection:r}),t[i][n]=r}return t}function nr(e){let t=e.slice(0,2);switch(t){case`vs`:return`vertex`;case`fs`:return`fragment`;default:throw Error(t)}}function rr(e,t,n,r=!1,i=`glsl`,a={}){let o=t===`vertex`;for(let t in n){let r=n[t];r.sort((e,t)=>e.order-t.order),$n.length=r.length;for(let e=0,t=r.length;e<t;++e)$n[e]=r[e].injection;let s=`${$n.join(`
`)}\n`;switch(t){case`vs:#decl`:(i===`wgsl`||o)&&(e=e.replace(er,s));break;case`vs:#main-start`:(i===`wgsl`||o)&&(e=i===`wgsl`?ir(e,`vertex`,s,`start`,a.vertex):e.replace(Zn,e=>e+s));break;case`vs:#main-end`:(i===`wgsl`||o)&&(e=i===`wgsl`?ir(e,`vertex`,s,`end`,a.vertex):e.replace(Qn,e=>s+e));break;case`fs:#decl`:(i===`wgsl`||!o)&&(e=e.replace(er,s));break;case`fs:#main-start`:(i===`wgsl`||!o)&&(e=i===`wgsl`?ir(e,`fragment`,s,`start`,a.fragment):e.replace(Zn,e=>e+s));break;case`fs:#main-end`:(i===`wgsl`||!o)&&(e=i===`wgsl`?ir(e,`fragment`,s,`end`,a.fragment):e.replace(Qn,e=>s+e));break;default:e=e.replace(t,e=>e+s)}}return e=e.replace(er,``),r&&(e=e.replace(/\}\s*$/,e=>e+Xn[t])),e}function ir(e,t,n,r,i){let a=ar(e,t,i);if(!a)return e;if(r===`start`){let t=a.openBraceIndex+1;return`${e.slice(0,t)}\n${n}${e.slice(t)}`}return`${e.slice(0,a.closeBraceIndex)}${n}${e.slice(a.closeBraceIndex)}`}function ar(e,t,n){let r=t===`vertex`?`@vertex`:`@fragment`,i=e.indexOf(r);if(i<0)return null;let a=n?e.search(RegExp(`\\bfn\\s+${or(n)}\\s*\\(`)):e.indexOf(`fn`,i);if(a<0)return null;let o=e.indexOf(`{`,a);if(o<0)return null;let s=0;for(let t=o;t<e.length;t++){let n=e[t];if(n===`{`)s++;else if(n===`}`&&(s--,s===0))return{openBraceIndex:o,closeBraceIndex:t}}return null}function or(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function sr(e){e.map(e=>cr(e))}function cr(e){if(e.instance)return;sr(e.dependencies||[]);let{propTypes:t={},deprecations:n=[],inject:r={}}=e,i={normalizedInjections:tr(r),parsedDeprecations:ur(n)};t&&(i.propValidators=qn(t)),e.instance=i;let a={};t&&(a=Object.entries(t).reduce((e,[t,n])=>{let r=n?.value;return r&&(e[t]=r),e},{})),e.defaultUniforms={...e.defaultUniforms,...a}}function lr(e,t,n){e.deprecations?.forEach(e=>{e.regex?.test(t)&&(e.deprecated?n.deprecated(e.old,e.new)():n.removed(e.old,e.new)())})}function ur(e){return e.forEach(e=>{switch(e.type){case`function`:e.regex=RegExp(`\\b${e.old}\\(`);break;default:e.regex=RegExp(`${e.type} ${e.old};`)}}),e}function dr(e){let t=new Set,n=new Set,r=[],i=new Map;function a(e){let t=i.get(e.name);if(t&&t!==e)throw Error(`Shader module name collision: Multiple different module objects share the name "${e.name}". Each module object must have a unique name.`);i.set(e.name,e)}function o(e,i){if(n.has(e)){let t=[...i,e.name].join(` -> `);throw Error(`Shader module dependency cycle detected: ${t}`)}if(t.has(e))return;a(e),n.add(e);let s=[...i,e.name];if(e.dependencies)for(let t of e.dependencies)o(t,s);n.delete(e),t.add(e),r.push(e)}for(let t of e)o(t,[]);let s=new Set;for(let e of r)e.implements!==void 0&&(Gn(!s.has(e.implements)),s.add(e.implements));return sr(r),r}var fr=/^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][\w-]*)$/;function pr(e=[],t){let n={modules:[],hooks:[],defines:{},injections:{},vertexInputs:{},interStageVariables:{}};for(let r of e)hr(n,r,t);let{vertexInputs:r,interStageVariables:i}=n;for(let e of Object.keys(i))if(r[e])throw Error(`ShaderPlugin name "${e}" cannot be both a vertex input and a varying`);return n}function mr(e=[],t=[],n={}){let r=[...e],i=new Map;for(let e of r){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||i.set(e.name,e)}for(let e of t){let t=i.get(e.name);t&&t!==e&&n.onConflict?.(e.name,t,e),t||(r.push(e),i.set(e.name,e))}return r}function hr(e,t,n){t.module&&e.modules.push(t.module),t.defines&&Object.assign(e.defines,t.defines);for(let[n,r]of Object.entries(t.vertexInputs||{})){gr(n,`vertex input`);let t=e.vertexInputs[n];if(t&&t!==r)throw Error(`ShaderPlugin vertex input "${n}" has conflicting types "${t}" and "${r}"`);e.vertexInputs[n]=r}for(let[n,r]of Object.entries(t.interStageVariables||{})){gr(n,`varying`);let t=_r(n,r),i=e.interStageVariables[n];if(i&&(i.type!==t.type||i.interpolation!==t.interpolation))throw Error(`ShaderPlugin varying "${n}" has conflicting declarations "${i.type}/${i.interpolation}" and "${t.type}/${t.interpolation}"`);e.interStageVariables[n]=t}for(let r of t.hooks||[]){let t=typeof r==`string`?br(r,n):void 0;if(typeof r==`string`&&t===void 0)continue;let i=typeof r==`string`?t.slice(t.indexOf(`(`)):r[n];if(i===void 0)continue;let a=typeof r==`string`?t.split(`(`)[0]:yr(r);if(!/^(vs|fs):[A-Za-z_][A-Za-z0-9_]*$/.test(a)||!/^\([^]*\)$/.test(i.trim()))throw Error(`Invalid ShaderPlugin hook ${a}`);let o={hook:`${a}${i.trim()}`},s=e.hooks.find(e=>e.hook.split(`(`)[0]===a);if(s&&s.hook!==o.hook)throw Error(`Conflicting ShaderPlugin hook ${a}`);s||e.hooks.push(o)}let r=Array.isArray(t.injections)?t.injections:Object.entries(t.injections||{}).flatMap(([e,t])=>{let r=br(e,n);if(r===void 0)return[];let[i,...a]=r.split(`:`);if(i!==`vs`&&i!==`fs`)throw Error(`Invalid ShaderPlugin injection ${e}`);return[{stage:i===`vs`?`vertex`:`fragment`,target:a.join(`:`),[n]:t}]});for(let i of r){let r=i[n];if(r===void 0)continue;let a=yr(i);vr(a),e.injections[a]||(e.injections[a]=[]),e.injections[a].push({pluginName:t.name,injection:r,order:i.order??0})}}function gr(e,t){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(e)||e.startsWith(`_luma_`))throw Error(`ShaderPlugin ${t} "${e}" must be a valid non-reserved identifier`)}function _r(e,t){let{primitiveType:n}=_.getAttributeShaderTypeInfo(t.type),r=n===`i32`||n===`u32`,i=t.interpolation||(r?`flat`:`smooth`);if(r&&i===`smooth`)throw Error(`ShaderPlugin integer varying "${e}" must use flat interpolation`);return{type:t.type,interpolation:i}}function vr(e){if(!fr.test(e))throw Error(`ShaderPlugin injection target "${e}" must be a named shader anchor or hook`)}function yr(e){if(e.stage!==`vertex`&&e.stage!==`fragment`||e.target.includes(`:`))throw Error(`ShaderPlugin object targets require an explicit stage and unqualified target`);return`${e.stage===`vertex`?`vs`:`fs`}:${e.target}`}function br(e,t){let n=/^(glsl|wgsl):([\s\S]+)$/.exec(e);return n?n[1]===t?n[2]:void 0:e}var xr=/^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/,Sr=/((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g;function Cr(e){return`${e.name}Uniforms`}function wr(e,t){let n=t===`wgsl`?e.source:t===`vertex`?e.vs:e.fs;if(!n)return null;let r=Cr(e);return kr(n,t===`wgsl`?`wgsl`:`glsl`,r)}function Tr(e,t){let n=Object.keys(e.uniformTypes||{});if(!n.length)return null;let r=wr(e,t);return r?{moduleName:e.name,uniformBlockName:Cr(e),stage:t,expectedUniformNames:n,actualUniformNames:r,matches:Mr(n,r)}:null}function Er(e,t,n={}){let r=Tr(e,t);if(!r||r.matches)return r;let i=Nr(r);return n.log?.error?.(i,r)(),n.throwOnError!==!1&&Gn(!1,i),r}function Dr(e){let t=[],n=Pr(e);for(let e of n.matchAll(Sr)){let n=e[1]?.trim()||null;t.push({blockName:e[2],body:e[3],instanceName:e[4]||null,layoutQualifier:n,hasLayoutQualifier:!!n,isStd140:!!(n&&/\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(n))})}return t}function Or(e,t,n,r){let i=Dr(e).filter(e=>!e.isStd140),a=new Set;for(let e of i){if(a.has(e.blockName))continue;a.add(e.blockName);let i=r?.label?`${r.label} `:``,o=e.hasLayoutQualifier?`declares ${Fr(e.layoutQualifier)} instead of layout(std140)`:`does not declare layout(std140)`,s=`${i}${t} shader uniform block ${e.blockName} ${o}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;n?.warn?.(s,e)()}return i}function kr(e,t,n){let r=t===`wgsl`?Ar(e,n):jr(e,n);if(!r)return null;let i=[];for(let e of r.split(`
`)){let n=e.replace(/\/\/.*$/,``).trim();if(!n||n.startsWith(`#`))continue;let r=t===`wgsl`?n.match(/^([A-Za-z0-9_]+)\s*:/):n.match(xr);r&&i.push(r[1])}return i}function Ar(e,t){let n=RegExp(`\\bstruct\\s+${t}\\b`,`m`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index);if(r<0)return null;let i=0;for(let t=r;t<e.length;t++){let n=e[t];if(n===`{`){i++;continue}if(n===`}`&&(i--,i===0))return e.slice(r+1,t)}return null}function jr(e,t){return Dr(e).find(e=>e.blockName===t)?.body||null}function Mr(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function Nr(e){let{expectedUniformNames:t,actualUniformNames:n}=e,r=t.filter(e=>!n.includes(e)),i=n.filter(e=>!t.includes(e)),a=[`Expected ${t.length} fields, found ${n.length}.`],o=Ir(t,n);return o&&a.push(o),r.length&&a.push(`Missing from shader block (${r.length}): ${Lr(r)}.`),i.length&&a.push(`Unexpected in shader block (${i.length}): ${Lr(i)}.`),t.length<=12&&n.length<=12&&(r.length||i.length)&&(a.push(`Expected: ${t.join(`, `)}.`),a.push(`Actual: ${n.join(`, `)}.`)),`${e.moduleName}: ${e.stage} shader uniform block ${e.uniformBlockName} does not match module.uniformTypes. ${a.join(` `)}`}function Pr(e){return e.replace(/\/\*[\s\S]*?\*\//g,``).replace(/\/\/.*$/gm,``)}function Fr(e){return e.replace(/\s+/g,` `).trim()}function Ir(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++)if(e[r]!==t[r])return`First mismatch at field ${r+1}: expected ${e[r]}, found ${t[r]}.`;return e.length>t.length?`Shader block ends after field ${t.length}; expected next field ${e[t.length]}.`:t.length>e.length?`Shader block has extra field ${t.length}: ${t[e.length]}.`:null}function Lr(e,t=8){if(e.length<=t)return e.join(`, `);let n=e.length-t;return`${e.slice(0,t).join(`, `)}, ... (${n} more)`}var Rr=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${ge}\\s*:\\s*([^;]+);`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${ge}\\s*:\\s*([^;]+);`,`g`)];function zr(e,t=[]){let n=pe(e),r=new Map;for(let e of t)r.set(Vr(e.name,e.group,e.location),e.moduleName);let i=[];for(let e of Rr){e.lastIndex=0;let t;for(t=e.exec(n);t;){let a=e===Rr[0],o=Number(t[a?1:2]),s=Number(t[a?2:1]),c=t[3]?.trim(),l=t[4],u=t[5].trim(),d=r.get(Vr(l,s,o));i.push(Br({name:l,group:s,binding:o,owner:d?`module`:`application`,moduleName:d,accessDeclaration:c,resourceType:u})),t=e.exec(n)}}return i.sort((e,t)=>e.group===t.group?e.binding===t.binding?e.name.localeCompare(t.name):e.binding-t.binding:e.group-t.group)}function Br(e){let t={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:`unknown`,moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let n=e.accessDeclaration.split(`,`).map(e=>e.trim());if(n[0]===`uniform`)return{...t,kind:`uniform`,access:`uniform`};if(n[0]===`storage`){let e=n[1]||`read_write`;return{...t,kind:e===`read`?`read-only-storage`:`storage`,access:e}}}return e.resourceType===`sampler`||e.resourceType===`sampler_comparison`?{...t,kind:`sampler`,samplerKind:e.resourceType===`sampler_comparison`?`comparison`:`filtering`}:e.resourceType.startsWith(`texture_storage_`)?{...t,kind:`storage-texture`,access:Wr(e.resourceType),viewDimension:Hr(e.resourceType)}:e.resourceType.startsWith(`texture_`)?{...t,kind:`texture`,viewDimension:Hr(e.resourceType),sampleType:Ur(e.resourceType),multisampled:e.resourceType.startsWith(`texture_multisampled_`)}:t}function Vr(e,t,n){return`${t}:${n}:${e}`}function Hr(e){if(e.includes(`cube_array`))return`cube-array`;if(e.includes(`2d_array`))return`2d-array`;if(e.includes(`cube`))return`cube`;if(e.includes(`3d`))return`3d`;if(e.includes(`2d`))return`2d`;if(e.includes(`1d`))return`1d`}function Ur(e){if(e.startsWith(`texture_depth_`))return`depth`;if(e.includes(`<i32>`))return`sint`;if(e.includes(`<u32>`))return`uint`;if(e.includes(`<f32>`))return`float`}function Wr(e){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e)?.[1]}var Gr=`\n\n${er}\n`;function Kr(e){return function(t){let n={};for(let r of e){let e=r.getUniforms?.(t,n);Object.assign(n,e)}return n}}function qr(e,t,n,r){for(let i in e){let a=/^(v|f)s:(#)?([\w-]+)$/.exec(i);if(a){let o=a[2],s=a[3],c=o?s===`decl`?n:r:t;c[i]=c[i]||[],c[i].push(...e[i])}else r[i]=r[i]||[],r[i].push(...e[i])}}function Jr(e,t,n){let r;switch(t){case`vertex`:r=e.vs||``;break;case`fragment`:r=e.fs||``;break;case`wgsl`:r=e.source||``;break;default:Gn(!1)}if(!e.name)throw Error(`Shader module must have a name`);Er(e,t,{log:n});let i=e.name.toUpperCase().replace(/[^0-9a-z]/gi,`_`),a=`\
// ----- MODULE ${e.name} ---------------

`;return t!==`wgsl`&&(a+=`#define MODULE_${i}\n`),a+=`${r}\n`,a}var Yr=`([a-zA-Z_][a-zA-Z0-9_]*)`,Xr=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,Zr=RegExp(`^\\s*\\#\\s*ifdef\\s*${Yr}\\s*$`),Qr=RegExp(`^\\s*\\#\\s*ifndef\\s*${Yr}\\s*(?:\\/\\/.*)?$`),$r=/^\s*\#\s*else\s*(?:\/\/.*)?$/,ei=/^\s*\#\s*endif\s*$/,ti=RegExp(`^\\s*\\#\\s*ifdef\\s*${Yr}\\s*(?:\\/\\/.*)?$`),ni=/^\s*\#\s*endif\s*(?:\/\/.*)?$/;function ri(e,t){let n=e.split(`
`),r=[],i=[],a=!0;for(let e of n){let n=e.match(Xr),o=e.match(ti)||e.match(Zr),s=e.match(Qr),c=e.match($r),l=e.match(ni)||e.match(ei);if(n){let e=ii(n[1],t?.defines||{}),r=a&&e;i.push({parentActive:a,branchTaken:e,active:r}),a=r}else if(o||s){let e=(o||s)?.[1],n=!!t?.defines?.[e],r=o?n:!n,c=a&&r;i.push({parentActive:a,branchTaken:r,active:c}),a=c}else if(c){let e=i[i.length-1];if(!e)throw Error(`Encountered #else without matching #if, #ifdef or #ifndef`);e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,a=e.active}else l?(i.pop(),a=i.length?i[i.length-1].active:!0):a&&r.push(e)}if(i.length>0)throw Error(`Unterminated conditional block in shader source`);return r.join(`
`)}function ii(e,t){let n=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(n))return Number(n)!==0;if(n===`true`)return!0;if(n===`false`)return!1;let r=`(?:[A-Za-z_][A-Za-z0-9_]*|[+-]?\\d+(?:\\.\\d+)?)`,i=n.match(RegExp(`^(${r})\\s*(==|!=|<=|>=|<|>)\\s*(${r})$`));if(i){let e=e=>/^[A-Za-z_]/.test(e)?Number(t[e]??0):Number(e),n=e(i[1]),r=e(i[3]);switch(i[2]){case`==`:return n===r;case`!=`:return n!==r;case`<=`:return n<=r;case`>=`:return n>=r;case`<`:return n<r;case`>`:return n>r}}let a=n.match(RegExp(`^!\\s*${Yr}$`));if(a)return!t[a[1]];let o=n.match(RegExp(`^${Yr}$`));if(o)return!!t[o[1]];let s=n.match(RegExp(`^defined\\s*\\(\\s*${Yr}\\s*\\)$`));if(s)return t[s[1]]!==void 0;let c=n.match(RegExp(`^!\\s*defined\\s*\\(\\s*${Yr}\\s*\\)$`));if(c)return t[c[1]]===void 0;throw Error(`Unsupported #if expression "${e}"`)}function ai(e,t){let n=[];for(let[r,i]of Object.entries(t))ci(e,r),n.push(`in ${si(i)} ${r};`);return n.join(`
`)}function oi(e,t,n){let r=Object.entries(n);if(r.length===0)return{source:e,declarations:``,initialization:``};let i=li(e,t),a=e.slice(i.openParenthesis+1,i.closeParenthesis),o=ui(e,a),s=new Set(o.locations),c=[],l=[],u=[];for(let[t,n]of r){if(o.names.has(t)||hi(e,t))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing WGSL shader input or variable`);let r=gi(s);s.add(r);let i=`_luma_${t}`;c.push(`@location(${r}) ${i}: ${n}`),l.push(`var<private> ${t}: ${n};`),u.push(`${t} = ${i};`)}let d=a.trim()?`,
  `:`
  `,f=a.trim()?``:`
`,p=`${a}${d}${c.join(`,
  `)}${f}`;return{source:e.slice(0,i.openParenthesis+1)+p+e.slice(i.closeParenthesis),declarations:l.join(`
`),initialization:u.join(`
`)}}function si(e){let{primitiveType:t,components:n}=_.getAttributeShaderTypeInfo(e),r=t===`i32`?`int`:t===`u32`?`uint`:`float`;return n===1?r:`${r===`int`?`i`:r===`uint`?`u`:``}vec${n}`}function ci(e,t){let n=yi(t);if(RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${n}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing GLSL input`)}function li(e,t){let n=RegExp(`\\bfn\\s+${yi(t)}\\s*\\(`,`g`).exec(e);if(!n)throw Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${t}"`);let r=e.indexOf(`(`,n.index),i=_i(e,r,`(`,`)`);if(i<0)throw Error(`Unable to parse WGSL vertex entry point "${t}" parameters`);return{openParenthesis:r,closeParenthesis:i}}function ui(e,t){let n=di(t),r=new Set(fi(t)),i=pi(t);for(let t of i){let i=mi(e,t);if(i!==null){n.push(...di(i));for(let e of fi(i))r.add(e)}}return{locations:n,names:r}}function di(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function fi(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function pi(e){let t=[],n=/:\s*([A-Za-z_][\w]*)\b/g,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function mi(e,t){let n=RegExp(`\\bstruct\\s+${yi(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=_i(e,r,`{`,`}`);return i<0?null:e.slice(r+1,i)}function hi(e,t){let n=yi(t),r=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${n}\\b`,`g`),i=r.exec(e);for(;i;){if(vi(e,i.index)===0)return!0;i=r.exec(e)}return!1}function gi(e){let t=0;for(;e.has(t);)t++;return t}function _i(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function vi(e,t){let n=0,r=0,i=!1;for(let a=0;a<t;a++){let t=e[a],o=e[a+1];if(i){t===`
`&&(i=!1);continue}if(r>0){t===`/`&&o===`*`?(r++,a++):t===`*`&&o===`/`&&(r--,a++);continue}t===`/`&&o===`/`?(i=!0,a++):t===`/`&&o===`*`?(r=1,a++):t===`{`?n++:t===`}`&&n--}return n}function yi(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function bi(e,t,n){let r=[],i=[];for(let[a,o]of Object.entries(n)){Bi(e,a);let n=o.interpolation===`flat`?`flat `:``,s=t===`vertex`?`out`:`in`;r.push(`${n}${s} ${si(o.type)} ${a};`),t===`vertex`&&i.push(`${a} = ${Ri(o.type)};`)}return{declarations:r.join(`
`),initialization:i.join(`
`)}}function xi(e,t,n,r){let i=Object.entries(r);if(i.length===0)return{source:e,declarations:``,vertexInitialization:``,fragmentInitialization:``};let a=e,o=Si(a,t,`vertex`),s=Ci(a,o),c=Si(a,n,`fragment`),l=wi(a,c),u=Ti(a,s),d=l?Ti(a,l.type):null,f=new Set([...Fi(o.parameters),...Fi(u.body),...Fi(c.parameters),...Fi(d?.body||``)]),p=new Set([...Pi(u.body),...Pi(d?.body||``),...Pi(c.parameters)]),m=[],h=[],g=[],_=[],v=[];for(let[e,t]of i){if(f.has(e)||Ii(a,e))throw Error(`ShaderPlugin varying "${e}" conflicts with existing WGSL stage I/O or a module variable`);let n=Li(p);p.add(n);let r=t.interpolation===`flat`?` @interpolate(flat)`:``;if(m.push(`  @location(${n})${r} ${e}: ${t.type},`),g.push(`var<private> ${e}: ${t.type};`),_.push(`${e} = ${zi(t.type)};`),l)v.push(`${e} = ${l.name}.${e};`);else{let i=`_luma_${e}`;if(f.has(i))throw Error(`ShaderPlugin varying "${e}" conflicts with a generated fragment parameter`);h.push(`@location(${n})${r} ${i}: ${t.type}`),v.push(`${e} = ${i};`)}}Di(a,s,o.openBrace,o.closeBrace),a=Oi(a,s,o,i.map(([e])=>e)),o=Si(a,t,`vertex`),a=ki(a,o,i.map(([e])=>e));let y=(!l||s===l.type?[s]:[s,l.type]).map(e=>Ti(a,e).closeBrace).sort((e,t)=>t-e);for(let e of y)a=a.slice(0,e)+`${m.join(`
`)}\n`+a.slice(e);if(c=Si(a,n,`fragment`),h.length){let e=c.parameters,t=pe(e).trimEnd();if(t.trim()&&!t.endsWith(`,`)){let n=t.length;e=`${e.slice(0,n)},${e.slice(n)}`}a=a.slice(0,c.openParenthesis+1)+e+`
  `+h.join(`,
  `)+`
`+a.slice(c.closeParenthesis)}return{source:a,declarations:g.join(`
`),vertexInitialization:_.join(`
`),fragmentInitialization:v.join(`
`)}}function Si(e,t,n){let r=RegExp(`\\bfn\\s+${Ui(t)}\\s*\\(`,`g`).exec(e);if(!r)throw Error(`ShaderPlugin interStageVariables require WGSL ${n} entry point "${t}"`);let i=e.indexOf(`(`,r.index),a=Vi(e,i,`(`,`)`),o=e.indexOf(`{`,a),s=Vi(e,o,`{`,`}`);if(a<0||o<0||s<0)throw Error(`Unable to parse WGSL ${n} entry point "${t}"`);return{openParenthesis:i,closeParenthesis:a,openBrace:o,closeBrace:s,parameters:e.slice(i+1,a)}}function Ci(e,t){let n=e.slice(t.closeParenthesis+1,t.openBrace),r=/->\s*([A-Za-z_][\w]*)\s*$/.exec(n.trim());if(!r||Ei(e,r[1])===null)throw Error(`ShaderPlugin interStageVariables require the WGSL vertex entry point to return a named struct`);return r[1]}function wi(e,t){let n=[];for(let r of Ni(pe(t.parameters),`,`)){let t=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(r.trim());t&&Ei(e,t[2])&&n.push({name:t[1],type:t[2]})}if(n.length>1)throw Error(`ShaderPlugin interStageVariables require exactly one named WGSL fragment input struct; found ${n.length}`);return n[0]||null}function Ti(e,t){let n=Ei(e,t);if(!n)throw Error(`Unable to find WGSL stage I/O struct "${t}"`);return n}function Ei(e,t){let n=RegExp(`\\bstruct\\s+${Ui(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=Vi(e,r,`{`,`}`);return i<0?null:{openBrace:r,closeBrace:i,body:e.slice(r+1,i)}}function Di(e,t,n,r){let i=RegExp(`\\b${Ui(t)}\\s*\\(`,`g`),a=i.exec(e);for(;a;){if(a.index<n||a.index>r)throw Error(`ShaderPlugin varying output struct "${t}" is constructed outside the selected vertex entry point`);a=i.exec(e)}}function Oi(e,t,n,r){let i=RegExp(`\\b${Ui(t)}\\s*\\(`,`g`),a=[],o=i.exec(e);for(;o;){if(o.index>n.openBrace&&o.index<n.closeBrace){let r=e.indexOf(`(`,o.index),i=Vi(e,r,`(`,`)`);if(i<0||i>n.closeBrace)throw Error(`Unable to parse WGSL output constructor "${t}"`);a.push({openParenthesis:r,closeParenthesis:i})}o=i.exec(e)}for(let t of a.sort((e,t)=>t.closeParenthesis-e.closeParenthesis)){let n=e.slice(t.openParenthesis+1,t.closeParenthesis).trim()?`, `:``;e=e.slice(0,t.closeParenthesis)+n+r.join(`, `)+e.slice(t.closeParenthesis)}return e}function ki(e,t,n){let r=Ai(e,t.openBrace+1,t.closeBrace);for(let t=r.length-1;t>=0;t--){let i=r[t],a=e.slice(i.expressionStart,i.semicolon).trim();if(!a)throw Error(`ShaderPlugin varying vertex entry point cannot use an empty return`);let o=`_luma_vertexOutput${t}`,s=`{\nvar ${o} = ${a};\n${n.map(e=>`${o}.${e} = ${e};`).join(`
`)}\nreturn ${o};\n}`;e=e.slice(0,i.start)+s+e.slice(i.semicolon+1)}return e}function Ai(e,t,n){let r=[],i=t;for(;i<n;)if(i=Mi(e,i,n),e.slice(i,i+6)===`return`&&!/[A-Za-z0-9_]/.test(e[i+6]||``)){let t=i+6,a=ji(e,t,n);if(a<0)throw Error(`Unable to parse WGSL return statement in selected vertex entry point`);r.push({start:i,expressionStart:t,semicolon:a}),i=a+1}else i++;return r}function ji(e,t,n){let r=0,i=0;for(let a=t;a<n;a++){let t=Mi(e,a,n);if(t!==a){a=t-1;continue}let o=e[a];if(o===`(`&&r++,o===`)`&&r--,o===`[`&&i++,o===`]`&&i--,o===`;`&&r===0&&i===0)return a}return-1}function Mi(e,t,n){let r=t;if(e[r]===`/`&&e[r+1]===`/`){let t=e.indexOf(`
`,r+2);return t<0||t>n?n:t+1}if(e[r]===`/`&&e[r+1]===`*`){let t=1;for(r+=2;r<n&&t>0;)e[r]===`/`&&e[r+1]===`*`?(t++,r+=2):e[r]===`*`&&e[r+1]===`/`?(t--,r+=2):r++}return r}function Ni(e,t){let n=[],r=0,i=0,a=0;for(let o=0;o<e.length;o++){let s=e[o];s===`(`&&i++,s===`)`&&i--,s===`<`&&a++,s===`>`&&a--,s===t&&i===0&&a===0&&(n.push(e.slice(r,o)),r=o+1)}return n.push(e.slice(r)),n}function Pi(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function Fi(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Ii(e,t){let n=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${Ui(t)}\\b`,`g`),r=n.exec(e);for(;r;){if(Hi(e,r.index)===0)return!0;r=n.exec(e)}return!1}function Li(e){let t=0;for(;e.has(t);)t++;return t}function Ri(e){let{primitiveType:t,components:n}=_.getAttributeShaderTypeInfo(e),r=t===`u32`?`0u`:t===`i32`?`0`:`0.0`;return n===1?r:`${si(e)}(${r})`}function zi(e){let{primitiveType:t,components:n}=_.getAttributeShaderTypeInfo(e),r=`${t}(0)`;return n===1?r:`${e}(${r})`}function Bi(e,t){if(RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${Ui(t)}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin varying "${t}" conflicts with existing GLSL stage I/O`)}function Vi(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function Hi(e,t){let n=0;for(let r=0;r<t;r++){let i=Mi(e,r,t);if(i!==r){r=i-1;continue}e[r]===`{`&&n++,e[r]===`}`&&n--}return n}function Ui(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function Wi(e,t,n=`glsl`){let r=``;for(let i in e){let a=e[i];if(r+=`${n===`wgsl`?`fn`:`void`} ${a.signature} {\n`,a.header&&(r+=`  ${a.header}`),t[i]){let e=t[i];e.sort((e,t)=>e.order-t.order);for(let t of e)r+=`  ${t.injection}\n`}a.footer&&(r+=`  ${a.footer}`),r+=`}
`}return r}function Gi(e,t=[],n){let r={vertex:{},fragment:{}};for(let t of e){let e=typeof t==`string`?t:t.hook,i=/^(glsl|wgsl):([\s\S]+)$/.exec(e);i&&i[1]!==n||Ji(r,i?typeof t==`string`?i[2]:{...t,hook:i[2]}:t)}for(let e of t){let t=Gi([e]);for(let e of[`vertex`,`fragment`])for(let[n,i]of Object.entries(t[e])){let t=r[e][n];if(t&&t.signature!==i.signature)throw Error(`Conflicting ShaderPlugin hook ${n}`);r[e][n]=t||i}}return r}function Ki(e,t){return!!(t.startsWith(`vs:`)?e.vertex:e.fragment)[t]}function qi(e,t,n){let r=n===`vertex`?`vs:`:n===`fragment`?`fs:`:null;for(let n in t)if(!(r&&!n.startsWith(r))&&!Ki(e,n)){let e=[...new Set(t[n].map(e=>e.pluginName).filter(Boolean))];throw Error(`Unknown shader hook ${n}${e.length?` (plugins: ${e.join(`, `)})`:``}`)}}function Ji(e,t){let n=typeof t==`string`?{}:t,r=(typeof t==`string`?t:t.hook).trim(),i=r.indexOf(`:`),a=r.slice(0,i),o=r.slice(i+1),s=r.split(`(`)[0].trim(),c={hook:s,signature:o,header:n.header||``,footer:n.footer||``};switch(a){case`vs`:e.vertex[s]=c;break;case`fs`:e.fragment[s]=c;break;default:throw Error(a)}}function Yi(e){let t=dr(e.modules||[]),{source:n,bindingAssignments:r}=Xi(e.platformInfo,{...e,source:e.source,stage:`vertex`,modules:t});return{source:n,getUniforms:Kr(t),bindingAssignments:r}}function Xi(e,t){let{source:n,stage:r,modules:i,defines:a={},hookFunctions:o=[],inject:s={},pluginInjections:c={},pluginVertexInputs:l={},pluginInterStageVariables:u={},vertexEntryPoint:d=`vertexMain`,fragmentEntryPoint:f=`fragmentMain`,log:p}=t;Gn(typeof n==`string`,`shader source must be a string`);let m=oi(ri(n,{defines:a}),d,l),h=xi(m.source,d,f,u),g=h.source,_=``,v=Gi(o,t.pluginHooks,`wgsl`),y={},b={},x={};qr(c,y,b,x);for(let e in s){let t=typeof s[e]==`string`?{injection:s[e],order:0}:s[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?b[e]=[...b[e]||[],t]:x[e]=[...x[e]||[],t]:y[e]=[...y[e]||[],t]}else x[e]=[...x[e]||[],t]}Zi(m.declarations,m.initialization,b,x),Qi(h,b,x),qi(v,y);let S=i.map(e=>({module:e,source:ri(Jr(e,`wgsl`,p),{defines:a})})),C=ra(g),w=na(C.source),ee=sa(S,t._bindingRegistry,w),T=[],E=S.map(({module:e,source:n})=>{let r=ia(n,e,{usedBindingsByGroup:w,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:ee});return T.push(...r.bindingAssignments),{module:e,source:r.source}});for(let{module:e,source:t}of E){p&&lr(e,g,p),_+=t;let n=$i(e);for(let e in n){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let r=t[2]===`decl`?b:x;r[e]=r[e]||[],r[e].push(n[e])}else Ki(v,e)&&(y[e]=y[e]||[],y[e].push(n[e]))}}return _+=Gr,_=rr(_,r,ea(b),!1,`wgsl`,{vertex:d,fragment:f}),_+=ta(v,y),_+=ha(T),_+=C.source,_=rr(_,r,x,!1,`wgsl`,{vertex:d,fragment:f}),ma(_),{source:_,bindingAssignments:T}}function Zi(e,t,n,r){e&&(n[`vs:#decl`]=n[`vs:#decl`]||[],n[`vs:#decl`].push({injection:e,order:-(2**53-1)})),t&&(r[`vs:#main-start`]=r[`vs:#main-start`]||[],r[`vs:#main-start`].push({injection:t,order:-(2**53-1)}))}function Qi(e,t,n){e.declarations&&(t[`vs:#decl`]=t[`vs:#decl`]||[],t[`vs:#decl`].push({injection:e.declarations,order:-(2**53-1)})),e.vertexInitialization&&(n[`vs:#main-start`]=n[`vs:#main-start`]||[],n[`vs:#main-start`].push({injection:e.vertexInitialization,order:-(2**53-1)})),e.fragmentInitialization&&(n[`fs:#main-start`]=n[`fs:#main-start`]||[],n[`fs:#main-start`].push({injection:e.fragmentInitialization,order:-(2**53-1)}))}function $i(e){return{...e.instance?.normalizedInjections.vertex||{},...e.instance?.normalizedInjections.fragment||{}}}function ea(e){let t=[...e[`vs:#decl`]||[],...e[`fs:#decl`]||[]];return t.length?{"vs:#decl":t}:{}}function ta(e,t){return Wi(e.vertex,t,`wgsl`)+Wi(e.fragment,t,`wgsl`)}function na(e){let t=new Map;for(let n of _e(e,ce)){let e=Number(n.bindingToken),r=Number(n.groupToken);la(r,e,n.name),da(t,r,e,`application binding "${n.name}"`)}return t}function ra(e){let t=_e(e,fe),n=new Map;for(let e of t){if(e.bindingToken===`auto`)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);la(r,t,e.name),da(n,r,t,`application binding "${e.name}"`)}let r={sawSupportedBindingDeclaration:t.length>0},i=ye(e,fe,e=>oa(e,n,r));if(le(e)&&!r.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:i}}function ia(e,t,n){let r=[],i={sawSupportedBindingDeclaration:_e(e,me).length>0,nextHintedBindingLocation:typeof t.firstBindingSlot==`number`?t.firstBindingSlot:null},a=ye(e,me,e=>aa(e,{module:t,context:n,bindingAssignments:r,relocationState:i}));if(le(e)&&!i.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:a,bindingAssignments:r}}function aa(e,t){let{module:n,context:r,bindingAssignments:i,relocationState:a}=t,{match:o,bindingToken:s,groupToken:c,name:l}=e,u=Number(c);if(s===`auto`){let e=ga(u,n.name,l),t=r.bindingRegistry?.get(e),s=t===void 0?fa(u,r.usedBindingsByGroup,n.name,a.nextHintedBindingLocation??void 0,r.bindingRegistry):t;return ua(n.name,u,s,l),t!==void 0&&ca(r.reservedBindingKeysByGroup,u,s,e)?(i.push({moduleName:n.name,name:l,group:u,location:s}),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`)):(da(r.usedBindingsByGroup,u,s,`module "${n.name}" binding "${l}"`),r.bindingRegistry?.set(e,s),i.push({moduleName:n.name,name:l,group:u,location:s}),a.nextHintedBindingLocation!==null&&t===void 0&&(a.nextHintedBindingLocation=s+1),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`))}let d=Number(s);ua(n.name,u,d,l);let f=ga(u,n.name,l);return ca(r.reservedBindingKeysByGroup,u,d,f)||da(r.usedBindingsByGroup,u,d,`module "${n.name}" binding "${l}"`),i.push({moduleName:n.name,name:l,group:u,location:d}),o}function oa(e,t,n){let{match:r,bindingToken:i,groupToken:a,name:o}=e,s=Number(a);if(i===`auto`){let e=pa(s,t);return la(s,e,o),da(t,s,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return n.sawSupportedBindingDeclaration=!0,r}function sa(e,t,n){let r=new Map,i=[];function a(e,t,i,a){da(n,e,t,a);let o=r.get(e)||new Map;o.set(t,i),r.set(e,o)}for(let{module:t,source:n}of e)for(let e of _e(n,me)){let n=Number(e.groupToken);if(e.bindingToken===`auto`){i.push({module:t,name:e.name,group:n});continue}let r=Number(e.bindingToken);ua(t.name,n,r,e.name),a(n,r,ga(n,t.name,e.name),`module "${t.name}" binding "${e.name}"`)}for(let{module:e,name:n,group:r}of i){let i=ga(r,e.name,n),o=t?.get(i);o!==void 0&&a(r,o,i,`registered module binding "${i}"`)}return r}function ca(e,t,n,r){let i=e.get(t);if(!i)return!1;let a=i.get(n);if(!a)return!1;if(a!==r)throw Error(`Registered module binding "${r}" collided with "${a}": group ${t}, binding ${n}.`);return i.delete(n),!0}function la(e,t,n){if(e===0&&t>=100)throw Error(`Application binding "${n}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below 100.`)}function ua(e,t,n,r){if(t===0&&n<100)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${n}. Module-owned explicit group-0 bindings must be 100 or higher.`)}function da(e,t,n,r){let i=e.get(t)||new Set;if(i.has(n))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${n}.`);i.add(n),e.set(t,i)}function fa(e,t,n,r,i){let a=t.get(e)||new Set,o=new Set,s=`${e}:`,c=`${s}${n}:`;for(let[e,t]of i||[])e.startsWith(c)&&o.add(t);let l=r??(e===0?100:a.size>0?Math.max(...a)+1:0);for(;a.has(l)||o.has(l);)l++;for(let[e,t]of i||[])t===l&&e.startsWith(s)&&i?.delete(e);return l}function pa(e,t){let n=t.get(e)||new Set,r=0;for(;n.has(r);)r++;return r}function ma(e){let t=he(e,me);if(!t)return;let n=_a(e,t.index);throw n?Error(`Unresolved @binding(auto) for module "${n}" binding "${t.name}" remained in assembled WGSL source.`):va(e,t.index)?Error(`Unresolved @binding(auto) for application binding "${t.name}" remained in assembled WGSL source.`):Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${ya(t.match)}".`)}function ha(e){if(e.length===0)return``;let t=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let n of e)t+=`// ${n.moduleName}.${n.name} -> @group(${n.group}) @binding(${n.location})\n`;return t+=`
`,t}function ga(e,t,n){return`${e}:${t}:${n}`}function _a(e,t){let n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,r,i;for(i=n.exec(e);i&&i.index<=t;)r=i[1],i=n.exec(e);return r}function va(e,t){let n=e.indexOf(Gr);return n>=0?t>n:!0}function ya(e){return e.replace(/\s+/g,` `).trim()}function ba(e,t){return{name:xa(e,t),language:`glsl`,version:Sa(e)}}function xa(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function Sa(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}function Ca(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
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
`}}function wa(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=Oa(e,Ea),e;case`fragment`:return e=Oa(e,Da),e;default:throw Error(t)}}var Ta=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],Ea=[...Ta,[ka(`attribute`),`in $1`],[ka(`varying`),`out $1`]],Da=[...Ta,[ka(`varying`),`in $1`]];function Oa(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function ka(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}var Aa=`precision highp float;
`;function ja(e){let{vs:t,fs:n}=e,r=dr(e.modules||[]);return{vs:Ma(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:Ma(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:Kr(r)}}function Ma(e,t){let{source:n,stage:r,language:i=`glsl`,modules:a,defines:o={},hookFunctions:s=[],inject:c={},pluginInjections:l={},pluginVertexInputs:u={},pluginInterStageVariables:d={},prologue:f=!0,log:p}=t;Gn(typeof n==`string`,`shader source must be a string`);let m=i===`glsl`?ba(n).version:-1,h=e.shaderLanguageVersion,g=m===100?`#version 100`:`#version 300 es`,_=n.split(`
`).slice(1).join(`
`),v={};a.forEach(e=>{Object.assign(v,e.defines)}),Object.assign(v,o);let y=``;switch(i){case`wgsl`:break;case`glsl`:y=f?`\
${g}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${r.toUpperCase()}`}

${Ca(e)}
${r===`fragment`?Aa:``}

// ----- APPLICATION DEFINES -------------------------

${Na(v)}

`:`${g}
`;break}let b=Gi(s,t.pluginHooks,`glsl`),x={},S={},C={};qr(l,x,S,C);for(let e in c){let t=typeof c[e]==`string`?{injection:c[e],order:0}:c[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?S[e]=[...S[e]||[],t]:C[e]=[...C[e]||[],t]:x[e]=[...x[e]||[],t]}else C[e]=[...C[e]||[],t]}if(r===`vertex`){let e=ai(_,u);e&&(y+=`${e}\n`)}let w=bi(_,r,d);w.declarations&&(y+=`${w.declarations}\n`),w.initialization&&(C[`vs:#main-start`]=C[`vs:#main-start`]||[],C[`vs:#main-start`].push({injection:w.initialization,order:-(2**53-1)}));for(let e of a){p&&lr(e,_,p);let t=Jr(e,r,p);y+=t;let n=e.instance?.normalizedInjections[r]||{};for(let e in n){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let r=t[2]===`decl`?S:C;r[e]=r[e]||[],r[e].push(n[e])}else x[e]=x[e]||[],x[e].push(n[e])}}return qi(b,x,r),y+=`// ----- MAIN SHADER SOURCE -------------------------`,y+=Gr,y=rr(y,r,S),y+=Wi(b[r],x),y+=_,y=rr(y,r,C),i===`glsl`&&m!==h&&(y=wa(y,r)),i===`glsl`&&Or(y,r,p),y.trim()}function Na(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}var Pa=class{_shaderTranspilers=new Map;_hookFunctions=[];_defaultModules=[];addShaderTranspiler(e){this._shaderTranspilers.set(e.sourceLanguage,e)}removeShaderTranspiler(e){this._shaderTranspilers.delete(e)}_transpileShader(e,t,n,r){let i=e.sourceLanguage||this.shaderLanguage;if(i===this.shaderLanguage)return Gn(!dr(t).some(e=>e.sourceLanguage&&e.sourceLanguage!==this.shaderLanguage)),{code:n||``,modules:t};let a=this._shaderTranspilers.get(i);Gn(a);let o=dr(t);Gn(!o.some(e=>e.sourceLanguage&&e.sourceLanguage!==i&&e.sourceLanguage!==this.shaderLanguage));let s=o.filter(e=>e.sourceLanguage===i).map(e=>e.source||``).join(`
`),c={vertex:e.vertexEntryPoint,fragment:e.fragmentEntryPoint,compute:e.computeEntryPoint},l=n==null?{code:``}:a.transpile({source:[s,n].filter(Boolean).join(`
`),target:this.shaderLanguage,stage:r,entryPoints:c,platformInfo:e.platformInfo}),u=o.map(e=>({...e,dependencies:void 0,...e.sourceLanguage===i?{source:void 0,vs:void 0,fs:void 0}:{}}));return{...l,modules:u}}addDefaultModule(e){this._defaultModules.find(t=>t.name===(typeof e==`string`?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t=typeof e==`string`?e:e.name;this._defaultModules=this._defaultModules.filter(e=>e.name!==t)}addShaderHook(e,t){this._hookFunctions.push(t?{...t,hook:e}:e)}resetShaderHooks(){this._hookFunctions.length=0}_getModuleList(e=[]){let t=Array(this._defaultModules.length+e.length),n={},r=0;for(let e=0,i=this._defaultModules.length;e<i;++e){let i=this._defaultModules[e],a=i.name;t[r++]=i,n[a]=!0}for(let i=0,a=e.length;i<a;++i){let a=e[i],o=a.name;n[o]||(t[r++]=a,n[o]=!0)}return t.length=r,sr(t),t}},Fa=class extends Pa{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=[...this._hookFunctions,...e.hookFunctions||[]],r=this._transpileShader(e,t,e.vs,`vertex`),i=this._transpileShader(e,t,e.fs,`fragment`);return{...ja({...e,vs:r.code,fs:e.fs==null?void 0:i.code,modules:r.modules,hookFunctions:n}),modules:t}}},Ia=class e extends Pa{shaderLanguage=`wgsl`;_wgslBindingRegistry=new Map;assembleWGSLShader(t){let n=this._getModuleList(t.modules),r=[...this._hookFunctions,...t.hookFunctions||[]],i=this._transpileShader(t,n,t.source,t.shaderStage??(t.computeEntryPoint?`compute`:void 0)),a={vertex:i.entryPoints?.vertex??t.vertexEntryPoint,fragment:i.entryPoints?.fragment??t.fragmentEntryPoint,compute:i.entryPoints?.compute??t.computeEntryPoint},o=e.getShaderPreprocessorDefines(t,n),s=t.platformInfo.shaderLanguage===`wgsl`&&i.code?ri(i.code,{defines:o}):i.code,{source:c,getUniforms:l,bindingAssignments:u}=Yi({...t,source:s,vertexEntryPoint:a.vertex,fragmentEntryPoint:a.fragment,defines:o,_bindingRegistry:this._wgslBindingRegistry,modules:i.modules,hookFunctions:r}),d=t.platformInfo.shaderLanguage===`wgsl`?ri(c,{defines:o}):c;return{source:d,entryPoints:a,getUniforms:l,modules:n,bindingAssignments:u,bindingTable:zr(d,u),shaderLayout:ve(d,{vertexEntryPoint:a.vertex,scanVertexAttributes:t.scanVertexAttributes})}}static getShaderPreprocessorDefines(t,n){return{...e.getPlatformPreprocessorDefines(t.platformInfo),...n.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...t.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type===`webgpu`&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP32_TAN_PRECISION_WORKAROUND:e.type===`webgpu`&&e.gpu.toLowerCase()!==`nvidia`&&e.gpu.toLowerCase()!==`amd`,LUMA_FP64_INTEGER_ARITHMETIC:e.type===`webgpu`&&e.gpu.toLowerCase()===`apple`}}};function La(e,t=!0){return e??t}function Ra(e=[0,0,0],t=!0){return t?e.map(e=>e/255):[...e]}var za={props:{},uniforms:{},bindings:{},name:`skin`,bindingLayout:[{name:`skin`,group:0},{name:`skinJointMatrices`,group:0,visibility:1}],dependencies:[],source:`
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

`,fs:``,defines:{SKIN_MAX_JOINTS:64},getUniforms:(e={},t)=>{let{jointMatrices:n,skinJointMatrices:r,scenegraphsFromGLTF:i,skinIndex:a=0,meshWorldMatrix:o}=e,s=r?{skinJointMatrices:r}:{};if(n)return{jointMatrix:Ba(n),...s};let c=i?.gltf?.skins?.[a];if(!c)return{jointMatrix:[],...s};let{inverseBindMatrices:l,joints:u,skeleton:d}=c,f=i.gltfNodeIndexToNodeMap,p=new Map,m=d===void 0?void 0:f?.get(d),h=m?[m]:i.scenes||[];for(let e of h)e.preorderTraversal((e,{worldMatrix:t})=>{p.set(e.id,t)});let g=o?new D(o).invert():null,_=new Float32Array(1024),v=l?.value;for(let e=0;e<Math.min(u.length,64);e++){let t=f?.get(u[e]);if(!t)continue;let n=p.get(t.id)||t.matrix,r=g?new D(g).multiplyRight(n):new D(n);v&&v.length>=(e+1)*16&&r.multiplyRight(new D(Array.from(v.slice(e*16,(e+1)*16)))),_.set(r,e*16)}return{jointMatrix:_,...s}},uniformTypes:{jointMatrix:[`mat4x4<f32>`,64]}};function Ba(e){let t=new Float32Array(1024);return t.set(e instanceof Float32Array?e.subarray(0,t.length):e.slice(0,t.length)),t}function Va(){return{color:[0,0,0],position:[0,0,0],halfAxisX:[0,0,0],halfAxisY:[0,0,0],normal:[0,0,-1],disk:0}}var Ha={color:`vec3<f32>`,position:`vec3<f32>`,halfAxisX:`vec3<f32>`,halfAxisY:`vec3<f32>`,normal:`vec3<f32>`,disk:`i32`};function Ua(e,t=!1){return Array.from({length:4},(n,r)=>{let i=e[r];if(!i)return Va();let a=Ra(i.color||(t?[255,255,255]:[1,1,1]),t);return{position:i.position,halfAxisX:i.halfAxisX,halfAxisY:i.halfAxisY,normal:i.normal,disk:i.type===`disk`?1:0,color:a.map(e=>e*(i.intensity??1e3))}})}var Wa=`precision highp int;

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
`,Ga=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
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
`,Ka=5,qa={props:{},uniforms:{},name:`lighting`,defines:{},uniformTypes:{enabled:`i32`,directionalLightCount:`i32`,pointLightCount:`i32`,spotLightCount:`i32`,ambientColor:`vec3<f32>`,lights:[{color:`vec3<f32>`,position:`vec3<f32>`,direction:`vec3<f32>`,attenuation:`vec3<f32>`,coneCos:`vec2<f32>`},Ka],areaLightCount:`i32`,areaLights:[Ha,4]},defaultUniforms:Qa(),bindingLayout:[{name:`lighting`,group:2}],firstBindingSlot:0,source:Ga,vs:Wa,fs:Wa,getUniforms:Ja};function Ja(e,t={}){e&&={...e};let n=(e?.lights||[]).filter(e=>e.type===`rect`||e.type===`disk`);if(!e)return Qa();e.lights&&(e={...e,...Xa(e.lights),lights:void 0});let{useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s}=e||{};if(!(i||a&&a.length>0||o&&o.length>0||s&&s.length>0)&&n.length===0)return{...Qa(),enabled:0};let c={...Qa(),...Ya({useByteColors:r,ambientLight:i,pointLights:a,spotLights:o,directionalLights:s})};return c.areaLightCount=Math.min(n.length,4),c.areaLights=Ua(n,La(e.useByteColors,!0)),e.enabled!==void 0&&(c.enabled=e.enabled?1:0),c}function Ya({useByteColors:e,ambientLight:t,pointLights:n=[],spotLights:r=[],directionalLights:i=[]}){let a=$a(),o=0,s=0,c=0,l=0;for(let t of n){if(o>=Ka)break;a[o]={...a[o],color:Za(t,e),position:t.position,attenuation:t.attenuation||[1,0,0]},o++,s++}for(let t of r){if(o>=Ka)break;a[o]={...a[o],color:Za(t,e),position:t.position,direction:t.direction,attenuation:t.attenuation||[1,0,0],coneCos:to(t)},o++,c++}for(let t of i){if(o>=Ka)break;a[o]={...a[o],color:Za(t,e),direction:t.direction},o++,l++}return n.length+r.length+i.length>Ka&&console.warn(`MAX_LIGHTS exceeded, truncating to ${Ka}`),{ambientColor:Za(t,e),directionalLightCount:l,pointLightCount:s,spotLightCount:c,lights:a}}function Xa(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let n of e||[])switch(n.type){case`ambient`:t.ambientLight=n;break;case`directional`:t.directionalLights?.push(n);break;case`point`:t.pointLights?.push(n);break;case`spot`:t.spotLights?.push(n);break;default:}return t}function Za(e={},t){let{color:n=[0,0,0],intensity:r=1}=e;return Ra(n,La(t,!0)).map(e=>e*r)}function Qa(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:$a(),areaLightCount:0,areaLights:Ua([])}}function $a(){return Array.from({length:Ka},()=>eo())}function eo(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function to(e){let t=e.innerConeAngle??0,n=e.outerConeAngle??Math.PI/4;return[Math.cos(t),Math.cos(n)]}var no=`#ifdef USE_IBL
@group(2) @binding(auto) var pbr_diffuseEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_diffuseEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_specularEnvSampler: texture_cube<f32>;
@group(2) @binding(auto) var pbr_specularEnvSamplerSampler: sampler;
@group(2) @binding(auto) var pbr_brdfLUT: texture_2d<f32>;
@group(2) @binding(auto) var pbr_brdfLUTSampler: sampler;
#endif
`,ro=`#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif
`,io={name:`ibl`,firstBindingSlot:32,bindingLayout:[{name:`pbr_diffuseEnvSampler`,group:2},{name:`pbr_specularEnvSampler`,group:2},{name:`pbr_brdfLUT`,group:2}],source:no,vs:ro,fs:ro},ao=`
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
`,oo=`
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
`,so=`
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
`,co={name:`areaLighting`,props:{},uniforms:{},dependencies:[qa],defaultUniforms:{lightCount:0,sampleCount:64,lights:Array.from({length:4},Va)},uniformTypes:{lightCount:`i32`,sampleCount:`i32`,lights:[Ha,4]},bindingLayout:[{name:`areaLighting`,group:2},{name:`areaLTCMatrix`,group:2},{name:`areaLTCAmplitude`,group:2}],source:`
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
`+oo,vs:so+ao,fs:so+ao,getUniforms(e={}){let t=e.lights||[];return{lightCount:Math.min(t.length,4),sampleCount:e.sampleCount||64,lights:Ua(t,e.useByteColors)}}},lo=`out vec3 pbr_vPosition;
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
`,uo=`precision highp float;

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
          PBRInfo_setDirectionalLight(pbrInfo, -lighting_getDirectionalLight(i).direction);
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
        PBRInfo_setDirectionalLight(pbrInfo, -lighting_getDirectionalLight(i).direction);
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
`,fo=`#ifdef DOUBLE_SIDED
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
          PBRInfo_setDirectionalLight(&pbrInfo, -lighting_getDirectionalLight(i).direction);
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
        PBRInfo_setDirectionalLight(&pbrInfo, -lighting_getDirectionalLight(i).direction);
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
`,po=`layout(std140) uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,mo={name:`pbrProjection`,bindingLayout:[{name:`pbrProjection`,group:0}],source:`struct pbrProjectionUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  camera: vec3<f32>
};

@group(0) @binding(auto) var<uniform> pbrProjection: pbrProjectionUniforms;
`,vs:po,fs:po,getUniforms:e=>e,uniformTypes:{modelViewProjectionMatrix:`mat4x4<f32>`,modelMatrix:`mat4x4<f32>`,normalMatrix:`mat4x4<f32>`,camera:`vec3<f32>`}},ho={NONE:0,REINHARD:1,KHRONOS_PBR_NEUTRAL:2,ACES:3},go=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],_o=`layout(std140) uniform pbrSceneUniforms {
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
`,vo={name:`pbrScene`,bindingLayout:[{name:`pbrScene`,group:1},{name:`pbr_transmissionFramebufferSampler`,group:1}],source:`struct pbrSceneUniforms {
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
`,vs:_o,fs:_o,getUniforms:e=>e,uniformTypes:{exposure:`f32`,toneMapMode:`i32`,environmentIntensity:`f32`,environmentRotation:`f32`,environmentMipCount:`f32`,outputEncoding:`i32`,framebufferSize:`vec2<f32>`,viewMatrix:`mat4x4<f32>`,projectionMatrix:`mat4x4<f32>`},defaultUniforms:{exposure:1,toneMapMode:ho.KHRONOS_PBR_NEUTRAL,environmentIntensity:1,environmentRotation:Math.PI*.5,environmentMipCount:1,outputEncoding:1,framebufferSize:[1,1],viewMatrix:go,projectionMatrix:go}},yo={props:{},uniforms:{},defaultUniforms:{unlit:!1,baseColorMapEnabled:!1,baseColorFactor:[1,1,1,1],normalMapEnabled:!1,normalScale:1,emissiveMapEnabled:!1,lightmapMapEnabled:!1,emissiveFactor:[0,0,0],metallicRoughnessValues:[1,1],metallicRoughnessMapEnabled:!1,occlusionMapEnabled:!1,occlusionStrength:1,alphaCutoffEnabled:!1,alphaCutoff:.5,IBLenabled:!1,scaleIBLAmbient:[1,1],scaleDiffBaseMR:[0,0,0,0],scaleFGDSpec:[0,0,0,0],specularColorFactor:[1,1,1],specularIntensityFactor:1,specularColorMapEnabled:!1,specularIntensityMapEnabled:!1,ior:1.5,transmissionFactor:0,transmissionMapEnabled:!1,thicknessFactor:0,attenuationDistance:1e9,attenuationColor:[1,1,1],clearcoatFactor:0,clearcoatRoughnessFactor:0,clearcoatMapEnabled:!1,clearcoatRoughnessMapEnabled:!1,sheenColorFactor:[0,0,0],sheenRoughnessFactor:0,sheenColorMapEnabled:!1,sheenRoughnessMapEnabled:!1,iridescenceFactor:0,iridescenceIor:1.3,iridescenceThicknessRange:[100,400],iridescenceMapEnabled:!1,anisotropyStrength:0,anisotropyRotation:0,anisotropyDirection:[1,0],anisotropyMapEnabled:!1,emissiveStrength:1,lightmapIntensity:1,scatterStrengthFactor:0,dispersion:0,baseColorUVSet:0,baseColorUVTransform:[1,0,0,0,1,0,0,0,1],metallicRoughnessUVSet:0,metallicRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],normalUVSet:0,normalUVTransform:[1,0,0,0,1,0,0,0,1],occlusionUVSet:0,occlusionUVTransform:[1,0,0,0,1,0,0,0,1],emissiveUVSet:0,lightmapUVSet:0,emissiveUVTransform:[1,0,0,0,1,0,0,0,1],lightmapUVTransform:[1,0,0,0,1,0,0,0,1],specularColorUVSet:0,specularColorUVTransform:[1,0,0,0,1,0,0,0,1],specularIntensityUVSet:0,specularIntensityUVTransform:[1,0,0,0,1,0,0,0,1],transmissionUVSet:0,transmissionUVTransform:[1,0,0,0,1,0,0,0,1],thicknessUVSet:0,thicknessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatUVSet:0,clearcoatUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatRoughnessUVSet:0,clearcoatRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],clearcoatNormalUVSet:0,clearcoatNormalUVTransform:[1,0,0,0,1,0,0,0,1],sheenColorUVSet:0,sheenColorUVTransform:[1,0,0,0,1,0,0,0,1],sheenRoughnessUVSet:0,sheenRoughnessUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceUVSet:0,iridescenceUVTransform:[1,0,0,0,1,0,0,0,1],iridescenceThicknessUVSet:0,iridescenceThicknessUVTransform:[1,0,0,0,1,0,0,0,1],anisotropyUVSet:0,anisotropyUVTransform:[1,0,0,0,1,0,0,0,1],bumpFactor:1,bumpMapEnabled:!1,diffuseTransmissionFactor:0,diffuseTransmissionMapEnabled:!1,diffuseTransmissionColorFactor:[1,1,1],diffuseTransmissionColorMapEnabled:!1,multiscatterColorFactor:[0,0,0],multiscatterColorMapEnabled:!1,scatterAnisotropy:0,bumpUVSet:0,bumpUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionUVSet:0,diffuseTransmissionUVTransform:[1,0,0,0,1,0,0,0,1],diffuseTransmissionColorUVSet:0,diffuseTransmissionColorUVTransform:[1,0,0,0,1,0,0,0,1],multiscatterColorUVSet:0,multiscatterColorUVTransform:[1,0,0,0,1,0,0,0,1]},name:`pbrMaterial`,firstBindingSlot:0,bindingLayout:[{name:`pbrMaterial`,group:3},{name:`pbr_baseColorSampler`,group:3},{name:`pbr_normalSampler`,group:3},{name:`pbr_emissiveSampler`,group:3},{name:`pbr_lightmapSampler`,group:3},{name:`pbr_metallicRoughnessSampler`,group:3},{name:`pbr_occlusionSampler`,group:3},{name:`pbr_specularColorSampler`,group:3},{name:`pbr_specularIntensitySampler`,group:3},{name:`pbr_transmissionSampler`,group:3},{name:`pbr_thicknessSampler`,group:3},{name:`pbr_clearcoatSampler`,group:3},{name:`pbr_clearcoatRoughnessSampler`,group:3},{name:`pbr_clearcoatNormalSampler`,group:3},{name:`pbr_sheenColorSampler`,group:3},{name:`pbr_sheenRoughnessSampler`,group:3},{name:`pbr_iridescenceSampler`,group:3},{name:`pbr_iridescenceThicknessSampler`,group:3},{name:`pbr_anisotropySampler`,group:3},{name:`pbr_bumpSampler`,group:3},{name:`pbr_diffuseTransmissionSampler`,group:3},{name:`pbr_diffuseTransmissionColorSampler`,group:3},{name:`pbr_multiscatterColorSampler`,group:3}],dependencies:[qa,co,io,mo,vo],source:fo,vs:lo,fs:uo,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_LIGHTMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,HAS_SPECULARCOLORMAP:!1,HAS_SPECULARINTENSITYMAP:!1,HAS_TRANSMISSIONMAP:!1,HAS_THICKNESSMAP:!1,HAS_CLEARCOATMAP:!1,HAS_CLEARCOATROUGHNESSMAP:!1,HAS_CLEARCOATNORMALMAP:!1,HAS_SHEENCOLORMAP:!1,HAS_SHEENROUGHNESSMAP:!1,HAS_IRIDESCENCEMAP:!1,HAS_IRIDESCENCETHICKNESSMAP:!1,HAS_ANISOTROPYMAP:!1,HAS_BUMPMAP:!1,HAS_DIFFUSETRANSMISSIONMAP:!1,HAS_DIFFUSETRANSMISSIONCOLORMAP:!1,HAS_MULTISCATTERCOLORMAP:!1,USE_MATERIAL_EXTENSIONS:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:e=>e,uniformTypes:{unlit:`i32`,baseColorMapEnabled:`i32`,baseColorFactor:`vec4<f32>`,normalMapEnabled:`i32`,normalScale:`f32`,emissiveMapEnabled:`i32`,emissiveFactor:`vec3<f32>`,metallicRoughnessValues:`vec2<f32>`,metallicRoughnessMapEnabled:`i32`,occlusionMapEnabled:`i32`,occlusionStrength:`f32`,alphaCutoffEnabled:`i32`,alphaCutoff:`f32`,specularColorFactor:`vec3<f32>`,specularIntensityFactor:`f32`,specularColorMapEnabled:`i32`,specularIntensityMapEnabled:`i32`,ior:`f32`,transmissionFactor:`f32`,transmissionMapEnabled:`i32`,thicknessFactor:`f32`,attenuationDistance:`f32`,attenuationColor:`vec3<f32>`,clearcoatFactor:`f32`,clearcoatRoughnessFactor:`f32`,clearcoatMapEnabled:`i32`,clearcoatRoughnessMapEnabled:`i32`,sheenColorFactor:`vec3<f32>`,sheenRoughnessFactor:`f32`,sheenColorMapEnabled:`i32`,sheenRoughnessMapEnabled:`i32`,iridescenceFactor:`f32`,iridescenceIor:`f32`,iridescenceThicknessRange:`vec2<f32>`,iridescenceMapEnabled:`i32`,anisotropyStrength:`f32`,anisotropyRotation:`f32`,anisotropyDirection:`vec2<f32>`,anisotropyMapEnabled:`i32`,emissiveStrength:`f32`,dispersion:`f32`,IBLenabled:`i32`,scaleIBLAmbient:`vec2<f32>`,scaleDiffBaseMR:`vec4<f32>`,scaleFGDSpec:`vec4<f32>`,baseColorUVSet:`i32`,baseColorUVTransform:`mat3x3<f32>`,metallicRoughnessUVSet:`i32`,metallicRoughnessUVTransform:`mat3x3<f32>`,normalUVSet:`i32`,normalUVTransform:`mat3x3<f32>`,occlusionUVSet:`i32`,occlusionUVTransform:`mat3x3<f32>`,emissiveUVSet:`i32`,emissiveUVTransform:`mat3x3<f32>`,specularColorUVSet:`i32`,specularColorUVTransform:`mat3x3<f32>`,specularIntensityUVSet:`i32`,specularIntensityUVTransform:`mat3x3<f32>`,transmissionUVSet:`i32`,transmissionUVTransform:`mat3x3<f32>`,thicknessUVSet:`i32`,thicknessUVTransform:`mat3x3<f32>`,clearcoatUVSet:`i32`,clearcoatUVTransform:`mat3x3<f32>`,clearcoatRoughnessUVSet:`i32`,clearcoatRoughnessUVTransform:`mat3x3<f32>`,clearcoatNormalUVSet:`i32`,clearcoatNormalUVTransform:`mat3x3<f32>`,sheenColorUVSet:`i32`,sheenColorUVTransform:`mat3x3<f32>`,sheenRoughnessUVSet:`i32`,sheenRoughnessUVTransform:`mat3x3<f32>`,iridescenceUVSet:`i32`,iridescenceUVTransform:`mat3x3<f32>`,iridescenceThicknessUVSet:`i32`,iridescenceThicknessUVTransform:`mat3x3<f32>`,anisotropyUVSet:`i32`,anisotropyUVTransform:`mat3x3<f32>`,bumpFactor:`f32`,bumpMapEnabled:`i32`,diffuseTransmissionFactor:`f32`,diffuseTransmissionMapEnabled:`i32`,diffuseTransmissionColorFactor:`vec3<f32>`,diffuseTransmissionColorMapEnabled:`i32`,multiscatterColorFactor:`vec3<f32>`,multiscatterColorMapEnabled:`i32`,scatterAnisotropy:`f32`,bumpUVSet:`i32`,bumpUVTransform:`mat3x3<f32>`,diffuseTransmissionUVSet:`i32`,diffuseTransmissionUVTransform:`mat3x3<f32>`,diffuseTransmissionColorUVSet:`i32`,diffuseTransmissionColorUVTransform:`mat3x3<f32>`,multiscatterColorUVSet:`i32`,multiscatterColorUVTransform:`mat3x3<f32>`,lightmapMapEnabled:`i32`,lightmapIntensity:`f32`,lightmapUVSet:`i32`,lightmapUVTransform:`mat3x3<f32>`,scatterStrengthFactor:`f32`}},bo=class{buffer;byteOffset=0;constructor(e){this.device=e}prepare(e){if(!this.buffer||this.buffer.byteLength<e){let t=Math.max(1024,(this.buffer?.byteLength??0)*2,e),n=this.device.createBuffer({id:`batch-uniforms`,byteLength:t,usage:g.UNIFORM|g.COPY_DST});this.buffer?.destroy(),this.buffer=n}this.byteOffset=0}getAlignedByteLength(e){let t=this.device.limits.minUniformBufferOffsetAlignment||1;return Math.ceil(e/t)*t}write(e){y(this.buffer&&this.byteOffset+e.byteLength<=this.buffer.byteLength);let t={buffer:this.buffer,offset:this.byteOffset,size:e.byteLength};return this.buffer.write(e,t.offset),this.byteOffset+=this.getAlignedByteLength(e.byteLength),t}destroy(){this.buffer?.destroy(),this.buffer=void 0,this.byteOffset=0}};function xo(e,t){let n={},r=`Values`;if(e.attributes.length===0&&!e.varyings?.length)return{"No attributes or varyings":{[r]:`N/A`}};for(let t of e.attributes)if(t){let e=`${t.location} ${t.name}: ${t.type}`;n[`in ${e}`]={[r]:t.stepMode||`vertex`}}for(let t of e.varyings||[]){let e=`${t.location} ${t.name}`;n[`out ${e}`]={[r]:JSON.stringify(t)}}return n}var So=`__debugFramebufferState`,Co=8;function wo(e,t,n){if(e.device.type!==`webgl`)return;let r=Do(e.device);if(!r.flushing){if(ko(e)){To(e,n,r);return}t&&Oo(t)&&t.handle!==null&&(r.queuedFramebuffers.includes(t)||r.queuedFramebuffers.push(t))}}function To(e,t,n){if(n.queuedFramebuffers.length===0)return;let{gl:r}=e.device,i=r.getParameter(r.READ_FRAMEBUFFER_BINDING),a=r.getParameter(r.DRAW_FRAMEBUFFER_BINDING),[o,s]=e.device.getDefaultCanvasContext().getDrawingBufferSize(),c=Ao(t.top,Co),l=Ao(t.left,Co);n.flushing=!0;try{for(let e of n.queuedFramebuffers){let[n,i,a,u,d]=Eo({framebuffer:e,targetWidth:o,targetHeight:s,topPx:c,leftPx:l,minimap:t.minimap});r.bindFramebuffer(r.READ_FRAMEBUFFER,e.handle),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.blitFramebuffer(0,0,e.width,e.height,n,i,a,u,r.COLOR_BUFFER_BIT,r.NEAREST),c+=d+Co}}finally{r.bindFramebuffer(r.READ_FRAMEBUFFER,i),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,a),n.flushing=!1}}function Eo(e){let{framebuffer:t,targetWidth:n,targetHeight:r,topPx:i,leftPx:a,minimap:o}=e,s=o?Math.max(Math.floor(n/4),1):n,c=o?Math.max(Math.floor(r/4),1):r,l=Math.min(s/t.width,c/t.height),u=Math.max(Math.floor(t.width*l),1),d=Math.max(Math.floor(t.height*l),1),f=a,p=Math.max(r-i-d,0);return[f,p,f+u,p+d,d]}function Do(e){return e.userData[So]||={flushing:!1,queuedFramebuffers:[]},e.userData[So]}function Oo(e){return`colorAttachments`in e}function ko(e){let t=e.props.framebuffer;return!t||t.handle===null}function Ao(e,t){if(!e)return t;let n=Number.parseInt(e,10);return Number.isFinite(n)?n:t}function jo(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!jo(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=e,i=t,a=Object.keys(e),o=Object.keys(t);if(a.length!==o.length)return!1;for(let e of a)if(!t.hasOwnProperty(e)||!jo(r[e],i[e],n-1))return!1;return!0}return!1}var Mo=class{bufferLayouts;constructor(e){this.bufferLayouts=e}getBufferLayout(e){return this.bufferLayouts.find(t=>t.name===e)||null}getAttributeNamesForBuffer(e){return C(e)}mergeBufferLayouts(e,t){let n=[...e];for(let e of t){let t=n.findIndex(t=>t.name===e.name);t<0?n.push(e):n[t]=e}return n}};function No(e,t){let n=h(e),r=t.slice();return r.sort((e,t)=>x(C(e).map(e=>n[e]))-x(C(t).map(e=>n[e]))),r}function Po(e,t){if(!e||!t.some(e=>e.bindingLayout?.length))return e;let n={...e,bindings:e.bindings.map(e=>({...e}))};`attributes`in(e||{})&&(n.attributes=e?.attributes||[]);for(let e of t)for(let t of e.bindingLayout||[])for(let e of zo(t.name)){let r=n.bindings.find(t=>t.name===e);r?.group===0&&(r.group=t.group),r&&t.visibility!==void 0&&(r.visibility=t.visibility)}return n}function Fo(e,t,n=[]){return e?t?{...e,attributes:e.attributes.length?Ho(e.attributes,t.attributes.filter(e=>n.includes(e.name))):t.attributes,bindings:Vo(e.bindings,t.bindings)}:e:t}function Io(e){return!!(e.uniformTypes&&!Bo(e.uniformTypes))}function Lo(e){let t=[];for(let n of e){let e=Cr(n),r=new Set([n.vs,n.fs].flatMap(e=>e?Dr(e).filter(e=>e.isStd140).map(e=>e.blockName):[])),i=r.has(e)?e:r.size===1?r.values().next().value:void 0;Io(n)&&i&&t.push({name:i,uniformTypes:n.uniformTypes})}return t}function Ro(e,t){let n=[],r=new Set;for(let i of[...e||[],...t||[]])r.has(i.name)||(r.add(i.name),n.push(i));return n}function zo(e){let t=new Set([e,`${e}Uniforms`]);return e.endsWith(`Uniforms`)||t.add(`${e}Sampler`),[...t]}function Bo(e){for(let t in e)return!1;return!0}function Vo(e,t){let n=e.map(e=>({...e})),r=new Set(e.map(e=>e.name)),i=new Set(e.map(e=>`${e.group}:${e.location}`));for(let e of t){let t=`${e.group}:${e.location}`;!r.has(e.name)&&!i.has(t)&&n.push({...e})}return n}function Ho(e,t){let n=e.map(e=>({...e})),r=new Map(e.map(e=>[e.name,e])),i=new Map(e.map(e=>[e.location,e]));for(let e of t){let t=r.get(e.name);if(t){if(t.type!==e.type||t.location!==e.location)throw Error(`Shader attribute "${e.name}" conflicts with its inferred type or location`);continue}let a=i.get(e.location);if(a)throw Error(`Shader attributes "${a.name}" and "${e.name}" both use location ${e.location}`);n.push({...e})}return n}function Uo(e){return{type:e.type,shaderLanguage:e.info.shadingLanguage,shaderLanguageVersion:e.info.shadingLanguageVersion,gpu:e.info.gpu,limits:e.limits,features:e.features}}var Wo={};function Go(e=`id`){return Wo[e]=Wo[e]||1,`${e}-${Wo[e]++}`}function Ko(e,t,n){for(let[r,i]of Object.entries(t)){if(!i)continue;if(!i.format)throw Error(`${e} GPUVector "${r}" requires a format`);let t=n.find(e=>e.name===r);if(!t)throw Error(`${e} GPUVector "${r}" requires a Model buffer layout`);let a=t.attributes??[];if(a.length>1)throw Error(`${e} GPUVector "${r}" does not support interleaved layouts`);let o=a[0],s=t.format??o?.format,c=Jo(e,r,i.format),l=t.byteStride??c.byteLength;if(s!==i.format||l!==i.byteStride||i.rowByteLength!==c.byteLength)throw Error(`${e} GPUVector "${r}" must match its Model buffer layout`)}}function qo(e,t){let n=Object.entries(t).filter(e=>e[1]!==void 0);if(n.length===0)return[];let[r,i]=n[0];for(let[t,a]of n){if(!a.format)throw Error(`${e} GPUVector "${t}" requires a format`);if(Jo(e,t,a.format),a.length!==i.length)throw Error(`${e} GPUVector "${t}" rows must match "${r}" rows`);if(a.data.length!==i.data.length)throw Error(`${e} GPUVector chunk counts must align`)}let a=0;return i.data.map((t,r)=>{let i={};for(let[a,o]of n){let n=o.data[r];if(!n||n.length!==t.length)throw Error(`${e} GPUVector chunk ${r} row counts must align`);if(n.format!==o.format||n.byteStride!==o.byteStride||n.rowByteLength!==o.rowByteLength)throw Error(`${e} GPUVector "${a}" chunk layout must be stable`);i[a]=n}let o={batchIndex:r,rowIndexOffset:a,rowCount:t.length,data:i};return a+=t.length,o})}function Jo(e,t,n){if(n.includes(`<`))throw Error(`${e} GPUVector "${t}" requires a fixed-width scalar format`);return r.getVertexFormatInfo(n)}function Yo(e){let t;for(let n of Object.values(e)){if(!n||`isConstant`in n)continue;let e=0;for(let t of n.data)e+=t.length;if(y(e===n.length),t){y(n.length===t.length&&n.data.length===t.data.length);for(let e=0;e<n.data.length;e++)y(n.data[e].length===t.data[e].length)}else t=n}}function Xo(e,t,n,r,i){let a=t.inputs,o=n.inputs,s=t.sourceLayouts,c=n.sourceLayouts,l=t.layouts,u=n.layouts,d=n.stepMode,f=t.batchCount,p=n.batchCount,m=Array.from({length:f},(e,n)=>t.getBatch(n)),h=Array.from({length:p},(e,t)=>n.getBatch(t)),g=Zo(m),_=Zo(h),v=e.vertexCount,y=e.instanceCount,b=!0;try{let a=e.isInstanced&&n.vertexCount===void 0,o=a?f*p:Math.max(f,p);if(f===0||p===0)return!0;for(let s=0;s<o;s++){let o=a?Math.floor(s/p):Math.min(s,f-1),c=a?s%p:Math.min(s,p-1);t.setInputs(m[o],l,`vertex`),n.setInputs(h[c],u,d),r();let x=t.rowCount===void 0?n.vertexCount===void 0?0:_[c]:g[o];e.setVertexCount(Math.max(0,Math.min(t.rowCount??n.vertexCount??v,v-x))),n.instanceCount!==void 0&&e.setInstanceCount(Math.max(0,Math.min(n.instanceCount,y-_[c]))),!(!e.indexBuffer&&e.vertexCount===0||e.isInstanced&&e.instanceCount===0)&&(b=i()&&b)}}finally{t.setInputs(a,s,`vertex`),n.setInputs(o,c,d),r(),e.setVertexCount(v),e.setInstanceCount(y)}return b}function Zo(e){let t=0;return e.map(e=>{let n=t;for(let n of Object.values(e))if(n&&`data`in n){t+=n.length;break}return n})}var Qo=class{inputs={};sourceLayouts;stepMode=`vertex`;claimedNames=new Set;layouts=[];buffers={};byteOffsets={};constants={};rowCount;vertexCount;instanceCount;constantBuffers={};constructor(e,t){this.device=e,this.id=t}setInputs(e,t,n){Yo(e),this.claimedNames.clear(),this.inputs=e,this.sourceLayouts=t,this.stepMode=n,this.rowCount=void 0,this.vertexCount=void 0,this.instanceCount=void 0;let r=t??Object.entries(e).flatMap(([e,t])=>t&&!A(t)&&t.bufferLayout?[{...t.bufferLayout,name:e}]:[]),i=Object.entries(e).flatMap(([e,t])=>{if(!t||r.some(t=>t.name===e||t.attributes?.some(t=>t.attribute===e)))return[];y(t.format);let i=t.format;return[{name:e,stepMode:n,byteStride:A(t)?0:t.byteStride,attributes:[{attribute:e,format:i,byteOffset:0}]}]}),a=[...r,...es(e,i)];for(let[t,r]of Object.entries(e))if(r){if(!A(r)&&!Array.isArray(r.data))throw TypeError(`Expected a GPU vector or constant for ${t}`);A(r)||((a.find(e=>e.name===t||e.attributes?.some(e=>e.attribute===t))?.stepMode??n)===`instance`?(y(this.instanceCount===void 0||this.instanceCount===r.length),this.instanceCount=r.length):(y(this.vertexCount===void 0||this.vertexCount===r.length),this.vertexCount=r.length),this.rowCount=n===`instance`?this.instanceCount:this.vertexCount),this.claimedNames.add(t)}this.layouts=a.flatMap(t=>{let r=e[t.name],i=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]),a=i.filter(t=>A(e[t.attribute])),o={...t,stepMode:t.stepMode??n};return this.device.type!==`webgpu`||r&&!A(r)&&r.bufferLayout||!a.length||a.length===i.length?[{...o,byteStride:a.length===i.length&&a.length?0:o.byteStride}]:[{...o,attributes:i.filter(t=>!A(e[t.attribute]))},{...o,name:`${t.name}-constants`,byteStride:0,attributes:a}]}),this.buffers={},this.byteOffsets={},this.constants={};let o=new Set;for(let t of this.layouts){this.claimedNames.add(t.name);let n=t.attributes??(t.format?[{attribute:t.name,format:t.format,byteOffset:0}]:[]);for(let e of n)this.claimedNames.add(e.attribute);let r=e[t.name];if(r&&!A(r)){let e=r.bufferLayout||!r.format?0:(n.find(e=>e.attribute===t.name)??n[0])?.byteOffset??0;this.bindVector(t.name,r,e)}let i=0;for(let r of n){let n=e[r.attribute]??(r.attribute===t.name?e[t.name]:void 0);n&&(y(n.format===void 0||n.format===r.format),A(n)?(this.constants[r.attribute]=$o(n),i=Math.max(i,(r.byteOffset??0)+n.byteLength)):this.buffers[t.name]||this.bindVector(t.name,n,r.byteOffset??0))}if(this.device.type===`webgpu`&&i&&!this.buffers[t.name]){let r=new Uint8Array(Math.ceil(i/4)*4);for(let t of n){let n=e[t.attribute];A(n)&&r.set(new Uint8Array(n.value.buffer,n.value.byteOffset,n.byteLength),t.byteOffset??0)}let a=this.constantBuffers[t.name];(!a||a.byteLength<r.byteLength)&&(a?.destroy(),a=this.device.createBuffer({id:`${this.id}-${t.name}-constant`,byteLength:r.byteLength,usage:g.VERTEX|g.COPY_DST|g.COPY_SRC}),this.constantBuffers[t.name]=a),a.write(r),this.buffers[t.name]=a,o.add(t.name)}}for(let[e,t]of Object.entries(this.constantBuffers))o.has(e)||(t.destroy(),delete this.constantBuffers[e])}get batchCount(){let e=Object.values(this.inputs).find(e=>e&&!A(e));return e&&!A(e)?e.data.length:1}getBatch(e){return Object.fromEntries(Object.entries(this.inputs).map(([t,n])=>{if(!n||A(n))return[t,n];let r=n.data[e];return[t,{...n,length:r?.length??0,data:r?[r]:[]}]}))}destroy(){for(let e of Object.values(this.constantBuffers))e.destroy();this.constantBuffers={}}bindVector(e,t,n){let r=t.data[0];if(!r)return;let i=r.byteOffset-n;y(i>=0),this.buffers[e]=r.buffer,this.byteOffsets[e]=i}};function A(e){return!!(e&&`isConstant`in e&&e.isConstant)}function $o(e){let t=r.getVertexFormatInfo(e.format);if(e.format===`unorm10-10-10-2`){let t=e.value[0];return new Float32Array([(t&1023)/1023,(t>>>10&1023)/1023,(t>>>20&1023)/1023,(t>>>30)/3])}let n=Array.from(e.value);if(e.format===`unorm8x4-bgra`&&([n[0],n[2]]=[n[2],n[0]]),t.normalized){let r=e.value.BYTES_PER_ELEMENT*8,i=2**r-1;return new Float32Array(n.map(e=>t.signed?(e+2**(r-1))/i*2-1:e/i))}return t.integer?t.signed?new Int32Array(n):new Uint32Array(n):new Float32Array(n)}function es(e,t){let n=[],r,i=0,a=[...t].sort((t,n)=>{let r=e[t.name],i=e[n.name];return(r&&!A(r)?r.data[0]?.byteOffset??0:0)-(i&&!A(i)?i.data[0]?.byteOffset??0:0)});for(let t of a){let a=e[t.name],o=t.attributes[0];if(A(a)){r||(r={...t,attributes:[]},n.push(r));let e=Math.min(4,a.byteLength);i=Math.ceil(i/e)*e,r.attributes.push({...o,byteOffset:i}),i+=a.byteLength;continue}let s=n.find(n=>{let r=e[n.name];if(!r||A(r)||!r.data.length||!a.data.length)return!1;let i=a.data[0].byteOffset-r.data[0].byteOffset;return n.stepMode===t.stepMode&&n.byteStride===t.byteStride&&i>=0&&i+a.rowByteLength<=a.byteStride&&a.data.every((e,t)=>{let n=r.data[t];return e.buffer===n.buffer&&e.byteStride===n.byteStride&&e.byteOffset-n.byteOffset===i})});if(s){let t=e[s.name];s.attributes.push({...o,byteOffset:a.data[0].byteOffset-t.data[0].byteOffset})}else n.push({...t,attributes:[...t.attributes]})}return n}function ts(e){return(Array.isArray(e)?e.length===0||typeof e[0]==`number`:ArrayBuffer.isView(e)&&!(e instanceof DataView))||typeof e==`number`||typeof e==`boolean`}function ns(e,t={}){let n={bindings:{},uniforms:{}};return Object.keys(e).forEach(r=>{let i=e[r];Object.prototype.hasOwnProperty.call(t,r)||ts(i)?n.uniforms[r]=i:n.bindings[r]=i}),n}var rs=class{options={disableWarnings:!1};modules;moduleUniforms;moduleBindings;directBindings={};constructor(e,t){Object.assign(this.options,t);let n=dr(Object.values(e).filter(ls));for(let t of n)e[t.name]=t;o.log(1,`Creating ShaderInputs with modules`,Object.keys(e))(),this.modules=e,this.moduleUniforms={},this.moduleBindings={};for(let[t,n]of Object.entries(e))n&&(this._addModule(n),n.name&&t!==n.name&&!this.options.disableWarnings&&o.warn(`Module name: ${t} vs ${n.name}`)())}destroy(){}setProps(e){e.bindings&&Object.assign(this.directBindings,e.bindings);for(let t of Object.keys(e)){if(t===`bindings`)continue;let n=t,r=e[n]||{},i=this.modules[n];if(!i)this.options.disableWarnings||o.warn(`Module ${t} not found`)();else{let e=this.moduleUniforms[n],t=this.moduleBindings[n],{uniforms:a,bindings:o}=ns(i.getUniforms?.(r,e)||r,i.uniformTypes);this.moduleUniforms[n]=is(e,a,i.uniformTypes),this.moduleBindings[n]={...t,...o}}}}getModules(){return Object.values(this.modules)}addModules(e){let t=dr(e);for(let e of t){let t=e.name;this.modules[t]||(this.modules[t]=e,this._addModule(e))}}getUniformValues(){return this.moduleUniforms}getBindingValues(){let e={};for(let t of Object.values(this.moduleBindings))Object.assign(e,t);return Object.assign(e,this.directBindings),e}getModuleBindingValues(e){let t=this.moduleBindings[e];return t?{...t}:{}}getDebugTable(){let e={};for(let[t,n]of Object.entries(this.moduleUniforms))for(let[r,i]of Object.entries(n))e[`${t}.${r}`]={type:this.modules[t].uniformTypes?.[r],value:String(i)};return e}_addModule(e){let t=e.name;this.moduleUniforms[t]=is({},e.defaultUniforms||{},e.uniformTypes),this.moduleBindings[t]={}}};function is(e={},t={},n={}){let r={...e};for(let[i,a]of Object.entries(t))a!==void 0&&(r[i]=as(e[i],a,n[i]));return r}function as(e,t,n){if(!n||typeof n==`string`)return os(t);if(Array.isArray(n)){if(ss(t)||!Array.isArray(t))return os(t);let r=Array.isArray(e)&&!ss(e)?[...e]:[],i=r.slice();for(let e=0;e<t.length;e++){let a=t[e];a!==void 0&&(i[e]=as(r[e],a,n[0]))}return i}if(!cs(t))return os(t);let r=n,i=cs(e)?e:{},a={...i};for(let[e,n]of Object.entries(t))n!==void 0&&(a[e]=as(i[e],n,r[e]));return a}function os(e){return ArrayBuffer.isView(e)?Array.prototype.slice.call(e):Array.isArray(e)?ss(e)?e.slice():e.map(e=>e===void 0?void 0:os(e)):cs(e)?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t===void 0?void 0:os(t)])):e}function ss(e){return ArrayBuffer.isView(e)||Array.isArray(e)&&(e.length===0||typeof e[0]==`number`)}function cs(e){return!!e&&typeof e==`object`&&!Array.isArray(e)&&!ArrayBuffer.isView(e)}function ls(e){return!!e?.dependencies}var us=g.DEBUG_DATA_MAX_LENGTH,j=class{device;id;ready;usage;props;isReady=!0;destroyed=!1;generation=0;updateTimestamp;debugData=new ArrayBuffer(0);_debugDataEnabled;_maxDebugDataByteLength;_ownsBuffer;_buffer;get buffer(){return this._buffer}get byteLength(){return this._buffer.byteLength}get[Symbol.toStringTag](){return`DynamicBuffer`}toString(){return`DynamicBuffer:"${this.id}":${this.byteLength}B`}toJSON(){return this.toString()}constructor(e,t){let{debugData:n=!1,buffer:r,ownsBuffer:i=!0,...a}=t;if(r&&r.device!==e)throw Error(`DynamicBuffer adopted buffers must belong to the supplied device`);if(r&&(a.byteLength!==void 0||a.data!==void 0))throw Error(`DynamicBuffer cannot combine an adopted buffer with byteLength or data`);let o=t.id||r?.id||s(`dynamic-buffer`),c={...a,id:o,usage:a.usage??r?.usage,indexType:a.indexType??r?.indexType};(c.usage||0)&g.INDEX&&!c.indexType&&(a.data instanceof Uint32Array?c.indexType=`uint32`:a.data instanceof Uint16Array?c.indexType=`uint16`:a.data instanceof Uint8Array&&(c.indexType=`uint8`)),delete c.data,delete c.byteOffset,this.device=e,this.id=o,this.props=c,this.usage=c.usage||0,this._debugDataEnabled=!!n,this._maxDebugDataByteLength=typeof n==`object`&&n.maxByteLength!==void 0?n.maxByteLength:us,this._ownsBuffer=i,this._buffer=r??this.device.createBuffer({...a,id:o}),this.ready=Promise.resolve(this._buffer),this.updateTimestamp=this._buffer.updateTimestamp,this._resetDebugData(this._buffer.byteLength),a.data&&this._writeDebugData(a.data,a.byteOffset||0)}write(e,t=0){this._buffer.write(e,t),this._touch(),this._writeDebugData(e,t)}async mapAndWriteAsync(e,t=0,n=this.byteLength-t){let r=null;await this._buffer.mapAndWriteAsync(async(t,i)=>{await e(t,i),r=new Uint8Array(t.slice(0,n))},t,n),this._touch(),r&&this._writeDebugData(r,t)}async readAsync(e=0,t=this.byteLength-e){let n=await this._buffer.readAsync(e,t);return this._writeDebugData(n,e)&&this._touch(),n}async mapAndReadAsync(e,t=0,n=this.byteLength-t){let r=null,i=await this._buffer.mapAndReadAsync(async(t,n)=>(r=new Uint8Array(t.slice(0)),await e(t,n)),t,n);return r&&this._writeDebugData(r,t)&&this._touch(),i}resize(e){let{byteLength:t,preserveData:n=!1}=e;if(t===this.byteLength)return!1;let r=Math.min(e.copyByteLength??Math.min(this.byteLength,t),this.byteLength,t),i=this._buffer,a=this.debugData.slice(0),{data:o,byteOffset:s,...c}=this.props,l=this.device.createBuffer({...c,byteLength:t});return n&&r>0&&this._copyBufferContents(i,l,r),this._buffer=l,this._resetDebugData(t),n&&a.byteLength>0&&this._writeDebugData(a,0),this._ownsBuffer&&i.destroy(),this._ownsBuffer=!0,this.generation++,this._touch(),!0}ensureSize(e,t){return e<=this.byteLength?!1:this.resize({byteLength:e,preserveData:t?.preserveData})}getBinding(e){return e?.offset===void 0&&e?.size===void 0?this._buffer:{buffer:this._buffer,offset:e?.offset,size:e?.size}}destroy(){this.destroyed||(this._ownsBuffer&&this._buffer.destroy(),this.destroyed=!0,this.debugData=new ArrayBuffer(0))}_copyBufferContents(e,t,n){let r=this.device.type===`webgpu`?Math.ceil(n/4)*4:n,i=this.device.createCommandEncoder();i.copyBufferToBuffer({sourceBuffer:e,destinationBuffer:t,size:r}),this.device.submit(i.finish())}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_resetDebugData(e){if(!this._debugDataEnabled){this.debugData=new ArrayBuffer(0);return}this.debugData=new ArrayBuffer(Math.min(e,this._maxDebugDataByteLength))}_writeDebugData(e,t){if(!this._debugDataEnabled||this.debugData.byteLength===0||t>=this.debugData.byteLength)return!1;let n=ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):new Uint8Array(e),r=new Uint8Array(this.debugData),i=Math.min(n.byteLength,r.byteLength-t);return r.set(n.subarray(0,i),t),i>0}};function ds(e){return typeof e==`object`&&!!e&&`buffer`in e}function fs(e){return e instanceof j?e:ds(e)&&e.buffer instanceof j?e.buffer:null}function ps(e){return e instanceof j?e.buffer:e}function ms(e){return{buffer:ps(e.buffer),offset:e.offset,size:e.size}}var hs={"+X":0,"-X":1,"+Y":2,"-Y":3,"+Z":4,"-Z":5};function gs(e){return e?Array.isArray(e)?e[0]??null:e:null}function _s(e){let{dimension:t,data:n}=e;if(!n)return null;switch(t){case`1d`:{let e=gs(n);if(!e)return null;let{width:t}=vs(e);return{width:t,height:1}}case`2d`:{if(ArrayBuffer.isView(n))return null;let e=gs(n);return e?vs(e):null}case`3d`:case`2d-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=gs(n[0]);return e?vs(e):null}case`cube`:{let e=Object.keys(n)[0]??null;if(!e)return null;let t=n[e],r=gs(t);return r?vs(r):null}case`cube-array`:{if(!Array.isArray(n)||n.length===0)return null;let e=n[0],t=Object.keys(e)[0]??null;if(!t)return null;let r=gs(e[t]);return r?vs(r):null}default:return null}}function vs(e){if(T(e))return u(e);if(typeof e==`object`&&`width`in e&&`height`in e)return{width:e.width,height:e.height};throw Error(`Unsupported mip-level data`)}function ys(e){return typeof e==`object`&&!!e&&`data`in e&&`width`in e&&`height`in e}function bs(e){return ArrayBuffer.isView(e)}function xs(e){let{textureFormat:t,format:n}=e;if(t&&n&&t!==n)throw Error(`Conflicting texture formats "${t}" and "${n}" provided for the same mip level`);return t??n}function Ss(e){let t=hs[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}function Cs(e,t){return 6*e+Ss(t)}function ws(e){throw Error(`setTexture1DData not supported in WebGL.`)}function Ts(e){return Array.isArray(e)?e:[e]}function Es(e,t,n,r){let i=Ts(t),a=e,o=[];for(let e=0;e<i.length;e++){let t=i[e];if(T(t))o.push({type:`external-image`,image:t,z:a,mipLevel:e});else if(ys(t))o.push({type:`texture-data`,data:t,textureFormat:xs(t),z:a,mipLevel:e});else if(bs(t)&&n)o.push({type:`texture-data`,data:{data:t,width:Math.max(1,n.width>>e),height:Math.max(1,n.height>>e),...r?{format:r}:{}},textureFormat:r,z:a,mipLevel:e});else throw Error(`Unsupported 2D mip-level payload`)}return o}function Ds(e){let t=[];for(let n=0;n<e.length;n++)t.push(...Es(n,e[n]));return t}function Os(e){let t=[];for(let n=0;n<e.length;n++)t.push(...Es(n,e[n]));return t}function ks(e){let t=[];for(let[n,r]of Object.entries(e)){let e=Ss(n);t.push(...Es(e,r))}return t}function As(e){let t=[];return e.forEach((e,n)=>{for(let[r,i]of Object.entries(e)){let e=Cs(n,r);t.push(...Es(e,i))}}),t}var js=class e{device;id;props;_texture=null;_sampler=null;_view=null;ready;isReady=!1;destroyed=!1;generation=0;updateTimestamp;resolveReady=()=>{};rejectReady=()=>{};get texture(){if(!this._texture)throw Error(`Texture not initialized yet`);return this._texture}get sampler(){if(!this._sampler)throw Error(`Sampler not initialized yet`);return this._sampler}get view(){if(!this._view)throw Error(`View not initialized yet`);return this._view}get[Symbol.toStringTag](){return`DynamicTexture`}toString(){let e=this._texture?.width??this.props.width??`?`,t=this._texture?.height??this.props.height??`?`;return`DynamicTexture:"${this.id}":${e}x${t}px:(${this.isReady?`ready`:`loading...`})`}resolveTextureBinding(e){return this.isReady?this.texture:null}constructor(t,n){this.device=t;let r=s(`dynamic-texture`),i=n;this.props={...e.defaultProps,id:r,...n,data:null},this.id=this.props.id,this.ready=new Promise((e,t)=>{this.resolveReady=e,this.rejectReady=t}),this.updateTimestamp=this.device.incrementTimestamp(),this.initAsync(i)}async initAsync(e){try{let t=await this._loadAllData(e);this._checkNotDestroyed();let n=t.data?Ms({...t,width:e.width,height:e.height,format:e.format}):[],r=`format`in e&&e.format!==void 0,i=`usage`in e&&e.usage!==void 0,a=this.props.width&&this.props.height?{width:this.props.width,height:this.props.height}:_s(t)||{width:this.props.width||1,height:this.props.height||1};if(!a||a.width<=0||a.height<=0)throw Error(`${this} size could not be determined or was zero`);let s=Ns(this.device,n,a,{format:r?e.format:void 0}),c=s.format??this.props.format,l={...this.props,...a,format:c,mipLevels:1,data:void 0};this.device.isTextureFormatCompressed(c)&&!i&&(l.usage=p.SAMPLE|p.COPY_DST);let u=this.props.mipmaps&&!s.hasExplicitMipChain&&!this.device.isTextureFormatCompressed(c);if(this.device.type===`webgpu`&&u){let e=this.props.dimension===`3d`?p.SAMPLE|p.STORAGE|p.COPY_DST|p.COPY_SRC:p.SAMPLE|p.RENDER|p.COPY_DST|p.COPY_SRC;l.usage|=e}let d=this.device.getMipLevelCount(l.width,l.height),f=s.hasExplicitMipChain?s.mipLevels:this.props.mipLevels===`auto`?d:Math.max(1,Math.min(d,this.props.mipLevels??1)),m={...l,mipLevels:f};this._texture=this.device.createTexture(m),this._sampler=this.texture.sampler,this._view=this.texture.view,this._touchGeneration(),s.subresources.length&&this._setTextureSubresources(s.subresources),this.props.mipmaps&&!s.hasExplicitMipChain&&!u&&o.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)(),u&&this.generateMipmaps(),this.isReady=!0,this.resolveReady(this.texture),o.info(1,`${this} created`)()}catch(e){let t=e instanceof Error?e:Error(String(e));this.rejectReady(t)}}destroy(){this._texture&&(this._texture.destroy(),this._texture=null,this._sampler=null,this._view=null),this.isReady=!1,this.destroyed=!0}generateMipmaps(){this.device.type===`webgl`?(this.texture.generateMipmapsWebGL(),this._touch()):this.device.type===`webgpu`?(this.device.generateMipmapsWebGPU(this.texture),this._touch()):o.warn(`${this} mipmaps not supported on ${this.device.type}`)}setSampler(e={}){this._checkReady();let t=e instanceof b?e:this.device.createSampler(e);this.texture.setSampler(t),this._sampler=t,this._touchGeneration()}async readBuffer(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=this.device.createBuffer({byteLength:i.byteLength,usage:g.COPY_DST|g.MAP_READ});this.texture.readBuffer({...e,width:t,height:n,depthOrArrayLayers:r},a);let o=this.device.createFence();return await o.signaled,o.destroy(),a}async readAsync(e={}){this.isReady||await this.ready;let t=e.width??this.texture.width,n=e.height??this.texture.height,r=e.depthOrArrayLayers??this.texture.depth,i=this.texture.computeMemoryLayout({width:t,height:n,depthOrArrayLayers:r}),a=await this.readBuffer(e),o=await a.readAsync(0,i.byteLength);return a.destroy(),o.buffer instanceof ArrayBuffer?o.buffer:o.slice().buffer}resize(e){if(this._checkReady(),e.width===this.texture.width&&e.height===this.texture.height)return!1;let t=this.texture;return this._texture=t.clone(e),this._sampler=this.texture.sampler,this._view=this.texture.view,t.destroy(),this._touchGeneration(),o.info(`${this} resized`),!0}getCubeFaceIndex(e){let t=hs[e];if(t===void 0)throw Error(`Invalid cube face: ${e}`);return t}getCubeArrayFaceIndex(e,t){return 6*e+this.getCubeFaceIndex(t)}setTexture1DData(e){if(this._checkReady(),this.texture.props.dimension!==`1d`)throw Error(`${this} is not 1d`);let t=ws(e);this._setTextureSubresources(t)}setTexture2DData(e,t=0){if(this._checkReady(),this.texture.props.dimension!==`2d`)throw Error(`${this} is not 2d`);let n=Es(t,e);this._setTextureSubresources(n)}setTexture3DData(e){if(this.texture.props.dimension!==`3d`)throw Error(`${this} is not 3d`);let t=Ds(e);this._setTextureSubresources(t)}setTextureArrayData(e){if(this.texture.props.dimension!==`2d-array`)throw Error(`${this} is not 2d-array`);let t=Os(e);this._setTextureSubresources(t)}setTextureCubeData(e){if(this.texture.props.dimension!==`cube`)throw Error(`${this} is not cube`);let t=ks(e);this._setTextureSubresources(t)}setTextureCubeArrayData(e){if(this.texture.props.dimension!==`cube-array`)throw Error(`${this} is not cube-array`);let t=As(e);this._setTextureSubresources(t)}_setTextureSubresources(e){for(let t of e){let{z:e,mipLevel:n}=t;switch(t.type){case`external-image`:let{image:r,flipY:i}=t;this.texture.copyExternalImage({image:r,z:e,mipLevel:n,flipY:i});break;case`texture-data`:let{data:a,textureFormat:o}=t;if(o&&o!==this.texture.format)throw Error(`${this} mip level ${n} uses format "${o}" but texture format is "${this.texture.format}"`);this.texture.writeData(a.data,{x:0,y:0,z:e,width:a.width,height:a.height,depthOrArrayLayers:1,mipLevel:n});break;default:throw Error(`Unsupported 2D mip-level payload`)}}e.length>0&&this._touch()}async _loadAllData(e){let t=await Ls(e.data);return{dimension:e.dimension??`2d`,data:t??null}}_checkNotDestroyed(){this.destroyed&&o.warn(`${this} already destroyed`)}_checkReady(){this.isReady||o.warn(`${this} Cannot perform this operation before ready`)}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_touchGeneration(){this.generation++,this._touch()}static defaultProps={...p.defaultProps,dimension:`2d`,data:null,mipmaps:!1}};function Ms(e){if(!e.data)return[];let t=e.width&&e.height?{width:e.width,height:e.height}:void 0,n=`format`in e?e.format:void 0;switch(e.dimension){case`1d`:return ws(e.data);case`2d`:return Es(0,e.data,t,n);case`3d`:return Ds(e.data);case`2d-array`:return Os(e.data);case`cube`:return ks(e.data);case`cube-array`:return As(e.data);default:throw Error(`Unhandled dimension ${e.dimension}`)}}function Ns(e,t,n,r){if(t.length===0)return{subresources:t,mipLevels:1,format:r.format,hasExplicitMipChain:!1};let i=new Map;for(let e of t){let t=i.get(e.z)??[];t.push(e),i.set(e.z,t)}let a=t.some(e=>e.mipLevel>0),o=r.format,s=1/0,c=[];for(let[t,r]of i){let i=[...r].sort((e,t)=>e.mipLevel-t.mipLevel),a=i[0];if(!a||a.mipLevel!==0)throw Error(`DynamicTexture: slice ${t} is missing mip level 0`);let l=Fs(e,a);if(l.width!==n.width||l.height!==n.height)throw Error(`DynamicTexture: slice ${t} base level dimensions ${l.width}x${l.height} do not match expected ${n.width}x${n.height}`);let u=Ps(a);if(u){if(o&&o!==u)throw Error(`DynamicTexture: slice ${t} base level format "${u}" does not match texture format "${o}"`);o=u}let d=o&&e.isTextureFormatCompressed(o)?Is(e,l.width,l.height,o):e.getMipLevelCount(l.width,l.height),f=0;for(let t=0;t<i.length;t++){let n=i[t];if(!n||n.mipLevel!==t||t>=d)break;let r=Fs(e,n),a=Math.max(1,l.width>>t),s=Math.max(1,l.height>>t);if(r.width!==a||r.height!==s)break;let u=Ps(n);if(u&&(o||=u,u!==o))break;f++,c.push(n)}s=Math.min(s,f)}let l=Number.isFinite(s)?Math.max(1,s):1;return{subresources:c.filter(e=>e.mipLevel<l),mipLevels:l,format:o,hasExplicitMipChain:a}}function Ps(e){if(e.type===`texture-data`)return e.textureFormat??xs(e.data)}function Fs(e,t){switch(t.type){case`external-image`:return e.getExternalImageSize(t.image);case`texture-data`:return{width:t.data.width,height:t.data.height};default:throw Error(`Unsupported texture subresource`)}}function Is(e,t,n,r){let{blockWidth:i=1,blockHeight:a=1}=e.getTextureFormatInfo(r),o=1;for(let e=1;;e++){let r=Math.max(1,t>>e),s=Math.max(1,n>>e);if(r<i||s<a)break;o++}return o}async function Ls(e){if(e=await e,Array.isArray(e))return await Promise.all(e.map(Ls));if(e&&typeof e==`object`&&e.constructor===Object){let t=e,n=await Promise.all(Object.values(t).map(Ls)),r=Object.keys(t),i={};for(let e=0;e<r.length;e++)i[r[e]]=n[e];return i}return e}function Rs(e){return typeof e==`object`&&!!e&&`resolveTextureBinding`in e&&typeof e.resolveTextureBinding==`function`}function zs(e){return e?.type===`texture`||e?.type===`external-texture`}function Bs(e,t,n){let r=S(e,t,{ignoreWarnings:!0});return zs(r)?r:e.bindings.length===0&&n?.fallbackGroup!==void 0?{type:`texture`,name:t,group:n.fallbackGroup,location:0}:null}var Vs=2,Hs=1e4,Us=`render pipeline initialization failed`,Ws=[`stencil8`,`depth16unorm`,`depth24plus`,`depth24plus-stencil8`,`depth32float`,`depth32float-stencil8`],Gs=class e{static async createAsync(e,t){let n=!k.getAsyncCompilation(e),r=n?k.beginAsyncCompilation(e):k.getAsyncCompilation(e),i;try{i=new this(e,t)}finally{n&&k.endAsyncCompilation(e,r)}try{return n?await Promise.all(r):await i._pipelineInitialization,i}catch(e){throw i.destroy(),e}}static defaultProps={...v.defaultProps,gpuVectorCount:`instance`,geometry:null,attributeVectors:void 0,source:void 0,sourceLanguage:void 0,vs:null,fs:null,id:`unnamed`,handle:void 0,userData:{},defines:{},modules:[],plugins:[],indexBuffer:null,indexCount:void 0,firstVertex:0,firstIndex:0,attributes:{},constantAttributes:{},bindings:{},uniforms:{},varyings:[],isInstanced:void 0,instanceCount:0,vertexCount:0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,transformFeedback:void 0,shaderAssembler:void 0,debugShaders:void 0,disableWarnings:void 0};device;id;source;vs;fs;pipelineFactory;shaderFactory;userData={};parameters;topology;bufferLayout;isInstanced=void 0;instanceCount=0;vertexCount;indexCount;firstVertex;firstIndex;indexBuffer=null;bufferAttributes={};constantAttributes={};bindings={};vertexArray;transformFeedback=null;pipeline;shaderInputs;_uniformStore;_attributeInfos={};props;batchUniformBuffer;geometryVectorBindings;attributeVectorBindings;explicitBufferLayout=[];constructorDrawCounts;constructorDrawOffsets;drawingVectorBatches=!1;indexVector=null;currentAttributes={};currentAttributeByteOffsets={};_dynamicIndexBufferSource=null;_dynamicAttributeBufferSources={};_colorAttachmentFormats;_depthStencilAttachmentFormat;_pipelineNeedsUpdate=`newly created`;_needsRedraw=`initializing`;_drawBlockedReason=!1;_destroyed=!1;_vertexCountSet=!1;_lastDrawTimestamp=-1;_bindingTable=[];_pipelineInitialization;get[Symbol.toStringTag](){return`Model`}toString(){return`Model(${this.id})`}constructor(t,n){this.constructorDrawOffsets={firstVertex:n.firstVertex,firstIndex:n.firstIndex};let r=this.constructor.defaultProps;this.constructorDrawCounts={vertexCount:n.vertexCount??(r.vertexCount||void 0),instanceCount:n.instanceCount??(r.instanceCount||void 0)};let i=r.shaderAssembler,a=Object.hasOwn(n,`vertexCount`);this.props={...r,...n,shaderAssembler:n.shaderAssembler??(i&&Ks(i,t.info.shadingLanguage)?i:t.info.shadingLanguage===`wgsl`?new Ia:new Fa)},this._vertexCountSet=a,n=this.props,this.id=n.id||Go(`model`),this.device=t,Object.assign(this.userData,n.userData),this.vertexCount=this.props.vertexCount,this.indexCount=this.props.indexCount,this.firstVertex=this.props.firstVertex,this.firstIndex=this.props.firstIndex,this.instanceCount=this.props.instanceCount,this.topology=this.props.topology,this.bufferLayout=this.props.bufferLayout,this.parameters=this.props.parameters,this._colorAttachmentFormats=this.props.colorAttachmentFormats,this._depthStencilAttachmentFormat=this.props.depthStencilAttachmentFormat,this.isInstanced=n.isInstanced??(n.instanceCount?!0:void 0),this.explicitBufferLayout=this.bufferLayout,this.geometryVectorBindings=new Qo(t,`${this.id}-geometry`),this.attributeVectorBindings=new Qo(t,`${this.id}-attributes`);try{this._initializeProps(n);let e=Uo(t),r=pr(this.props.plugins,e.shaderLanguage),i=mr(this.props.modules,r.modules),a=Object.fromEntries(i.map(e=>[e.name,e])),o=n.shaderInputs||new rs(a,{disableWarnings:this.props.disableWarnings});n.shaderInputs&&r.modules.length>0&&o.addModules(r.modules),this.setShaderInputs(o);let s=Ro(this.props.modules,o.getModules()),c={...r.defines,...this.props.defines};if(this.device.type===`webgl`&&(this.props._uniformBlockLayouts=Lo(s)),this.props.shaderLayout=Po(this.props.shaderLayout,s)||null,this.device.type===`webgpu`&&this.props.source){let n=this.props.shaderAssembler;y(Ks(n,`wgsl`));let{source:i,getUniforms:a,bindingTable:o,entryPoints:l={},shaderLayout:u}=n.assembleWGSLShader({platformInfo:e,...this.props,modules:s,defines:c,pluginHooks:r.hooks,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.source=i,this.props.vertexEntryPoint=l.vertex||this.props.vertexEntryPoint,this.props.fragmentEntryPoint=l.fragment||this.props.fragmentEntryPoint,this._getModuleUniforms=a,this._bindingTable=o;let d=qs(u??t.getShaderLayout?.(this.source),r.vertexInputs),f=Fo(this.props.shaderLayout,d,Object.keys(r.vertexInputs));this.props.shaderLayout=Po(f||null,s)||null}else{let t=this.props.shaderAssembler;y(Ks(t,`glsl`));let{vs:n,fs:i,getUniforms:a}=t.assembleGLSLShaderPair({platformInfo:e,...this.props,modules:s,defines:c,pluginHooks:r.hooks,pluginInjections:r.injections,pluginVertexInputs:r.vertexInputs,pluginInterStageVariables:r.interStageVariables});this.vs=n,this.fs=i,this._getModuleUniforms=a,this._bindingTable=[]}this.pipelineFactory=n.pipelineFactory||k.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||Tt.getDefaultShaderFactory(this.device);let l=k.getAsyncCompilation(this.device);l?(this._pipelineInitialization=this._initializePipelineAsync(n),l.push(this._pipelineInitialization)):(this.pipeline=this._updatePipeline(),this._initializePipelineResources(n))}catch(t){try{e.prototype.destroy.call(this)}finally{throw t}}}_initializeProps(e){e.geometry&&this.setGeometry(e.geometry),e.attributeVectors&&this.setAttributeVectors(e.attributeVectors)}_usesManagedUniformBuffer(e){return!0}async _initializePipelineAsync(e){await this._updatePipelineAsync(),this._initializePipelineResources(e)}_initializeAttributes(){this.applyVectorAttributes(),this.indexVector&&this.bindIndexVector()}_initializePipelineResources(e){this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._initializeAttributes(),e.indexBuffer&&this.setIndexBuffer(e.indexBuffer),e.indexCount!==void 0&&this.setIndexCount(e.indexCount),this.constructorDrawOffsets.firstVertex!==void 0&&(this.firstVertex=this.constructorDrawOffsets.firstVertex),this.constructorDrawOffsets.firstIndex!==void 0&&(this.firstIndex=this.constructorDrawOffsets.firstIndex),e.isInstanced!==void 0&&(this.isInstanced=e.isInstanced),this.constructorDrawCounts.instanceCount!==void 0&&this.setInstanceCount(this.constructorDrawCounts.instanceCount),this.constructorDrawCounts.vertexCount!==void 0&&this.setVertexCount(this.constructorDrawCounts.vertexCount),e.attributes&&this.setAttributes(e.attributes),e.constantAttributes&&this.setConstantAttributes(e.constantAttributes),e.bindings&&this.setBindings(e.bindings),e.transformFeedback&&(this.transformFeedback=e.transformFeedback)}destroy(){this._destroyed||=(this.pipeline&&(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.pipeline.vs),this.pipeline.fs&&this.pipeline.fs!==this.pipeline.vs&&this.shaderFactory.release(this.pipeline.fs)),this.vertexArray?.destroy(),this.geometryVectorBindings.destroy(),this.attributeVectorBindings.destroy(),this._uniformStore?.destroy(),this.batchUniformBuffer?.destroy(),!0)}needsRedraw(){this._getBindingsUpdateTimestamp()>this._lastDrawTimestamp&&this.setNeedsRedraw(`contents of bound textures or buffers updated`);let e=this._needsRedraw;return this._needsRedraw=!1,e}setNeedsRedraw(e){this._needsRedraw||=e}getBindingDebugTable(){return this._bindingTable}predraw(e){this._syncDynamicBuffers(),this.updateShaderInputs(e),this.pipeline=this._updatePipeline()}draw(e){if(this.indexVector?.length===0)return this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1,!0;if(!this.drawingVectorBatches&&(this.geometryVectorBindings.batchCount!==1||this.attributeVectorBindings.batchCount!==1))return this.drawVectorGroups(e);if(this._drawBlockedReason&&!this._pipelineNeedsUpdate)return o.info(Vs,`>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)(),!1;let t=this._areBindingsLoading();if(t)return o.info(Vs,`>>> DRAWING ABORTED ${this.id}: ${t} not loaded`)(),!1;this._syncAttachmentFormats(e);try{e.pushDebugGroup(`${this}.predraw(${e})`),this.device.type===`webgpu`?(this.updateShaderInputs(),this._syncDynamicBuffers(),this.pipeline=this._updatePipeline()):this.predraw(this.device.commandEncoder)}finally{e.popDebugGroup()}let n,r=this.pipeline.isErrored;try{if(e.pushDebugGroup(`${this}.draw(${e})`),this._logDrawCallStart(),this.pipeline=this._updatePipeline(),r=this.pipeline.isErrored,r)o.info(Vs,`>>> DRAWING ABORTED ${this.id}: ${Us}`)(),n=!1;else{let t=this.vertexArray.getDrawValidationError();if(t)o.info(Vs,`>>> DRAWING ABORTED ${this.id}: ${t}`)(),this._drawBlockedReason=t,n=!1;else{let t=this._getCurrentShaderLayout(),r=this._getBindings(t),i=this._getBindGroups(t,r),{indexBuffer:a}=this.vertexArray,o=a?this.indexCount??(this._vertexCountSet?this.vertexCount:a.byteLength/(a.indexType===`uint32`?4:2)):void 0;e.setPipeline(this.pipeline),e.setBindings(i,{_bindGroupCacheKeys:this._getBindGroupCacheKeys()}),e.setVertexArray(this.vertexArray),n=this.isInstanced===!0&&this.instanceCount===0?!0:e.draw({isInstanced:this.isInstanced,vertexCount:this.vertexCount,instanceCount:this.isInstanced?this.instanceCount:void 0,indexCount:o,firstVertex:this.firstVertex,firstIndex:this.firstIndex,transformFeedback:this.transformFeedback||void 0,uniforms:this.props.uniforms,parameters:this.parameters,topology:this.topology})}}}finally{e.popDebugGroup(),this._logDrawCallEnd()}return this._logFramebuffer(e),n?(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1):r?(this._needsRedraw=Us,this._drawBlockedReason=Us):this._drawBlockedReason?this._needsRedraw=this._drawBlockedReason:this._needsRedraw=`waiting for resource initialization`,n}setGeometry(e){e&&this.setTopology(e.topology),this.setGeometryVectors(e?.attributes??{},e?.bufferLayout),this.setIndexVector(e?.indices??null),e?.vertexCount!==void 0&&this.setVertexCount(e.vertexCount)}setGeometryVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.geometryVectorBindings.sourceLayouts),Yo(e),(!this.isInstanced||this.attributeVectorBindings.vertexCount!==void 0)&&Yo([...Object.values(e),...Object.values(this.attributeVectorBindings.inputs)]),this.geometryVectorBindings.setInputs(e,t,`vertex`),this.claimVectorLayouts(this.geometryVectorBindings),this.syncVectorBindings();let n=this.geometryVectorBindings.rowCount;y(n===void 0||this.attributeVectorBindings.vertexCount===void 0||n===this.attributeVectorBindings.vertexCount),this.setVertexCount(n??this.attributeVectorBindings.vertexCount??0)}setAttributeVectors(e,t){t??=this.getExplicitVectorLayouts(e)??this.getExplicitVectorLayouts(e,this.attributeVectorBindings.sourceLayouts),this.isInstanced===void 0&&(t?.some(e=>e.stepMode===`instance`)||Object.values(e).some(e=>e&&`data`in e&&e.bufferLayout?.stepMode===`instance`))&&(this.isInstanced=!0),(!this.isInstanced||Object.entries(e).some(([e,n])=>n&&`data`in n&&(t?.find(t=>t.name===e||t.attributes?.some(t=>t.attribute===e))?.stepMode??n.bufferLayout?.stepMode)===`vertex`))&&Yo([...Object.values(this.geometryVectorBindings.inputs),...Object.values(e)]),this.attributeVectorBindings.setInputs(e,t,this.isInstanced?`instance`:`vertex`),this.claimVectorLayouts(this.attributeVectorBindings),this.syncVectorBindings(),this.attributeVectorBindings.instanceCount!==void 0&&this.setInstanceCount(this.attributeVectorBindings.instanceCount);let n=this.attributeVectorBindings.vertexCount;if(n!==void 0){let e=this.geometryVectorBindings.rowCount;y(e===void 0||e===n),e===void 0&&this.setVertexCount(n)}}setGPUAttributes(e,t){this.setAttributeVectors(e,t)}setIndexVector(e){e&&(y(e.format===`uint8`||e.format===`uint16`||e.format===`uint32`),y(e.data.length<=1),y(e.byteStride===(e.format===`uint32`?4:e.format===`uint16`?2:1))),this.indexVector=e,this.vertexArray&&this.bindIndexVector()}bindIndexVector(){let e=this.indexVector,t=e?.data[0];t&&this.indexVector&&y((t.buffer instanceof j?t.buffer.buffer:t.buffer).indexType===this.indexVector.format&&t.byteOffset%this.indexVector.byteStride===0),this.indexVector=null,this.setIndexBuffer(t?.buffer??null),this.indexVector=e,this.indexCount=e?.length,this.setDrawOffsets({firstVertex:t?.byteOffset??0,firstIndex:t?t.byteOffset/this.indexVector.byteStride:0})}claimVectorLayouts(e){this.explicitBufferLayout=this.explicitBufferLayout.filter(t=>!e.claimedNames.has(t.name)&&!t.attributes?.some(t=>e.claimedNames.has(t.attribute)))}getExplicitVectorLayouts(e,t=this.explicitBufferLayout){let n=new Set(Object.keys(e)),r=t.filter(e=>n.has(e.name)||e.attributes?.some(e=>n.has(e.attribute)));return r.length?r:void 0}getVectorBufferLayout(){let e=[this.geometryVectorBindings,this.attributeVectorBindings];return[...this.explicitBufferLayout.filter(t=>!e.some(e=>e.claimedNames.has(t.name)||t.attributes?.some(t=>e.claimedNames.has(t.attribute)))),...this.geometryVectorBindings.layouts,...this.attributeVectorBindings.layouts]}syncVectorBindings(){let e=this.getVectorBufferLayout();this.vertexArray?(this.applyBufferLayout(e),this.applyVectorAttributes()):this.bufferLayout=e}applyVectorAttributes(){let e=new Set(this.bufferLayout.map(e=>e.name));for(let t of Object.keys(this.currentAttributes))e.has(t)||delete this.currentAttributes[t];this.setAttributes({...this.currentAttributes,...this.geometryVectorBindings.buffers,...this.attributeVectorBindings.buffers},{byteOffsets:{...this.currentAttributeByteOffsets,...this.geometryVectorBindings.byteOffsets,...this.attributeVectorBindings.byteOffsets},disableWarnings:!0}),this.device.type===`webgl`&&this.setConstantAttributes({...this.geometryVectorBindings.constants,...this.attributeVectorBindings.constants})}setGPUVectors(e,t){let n=qo(this.id,e);y(n.length<=1),Ko(this.id,e,this.bufferLayout),n[0]&&this.setGPUData(n[0].data),this.setBatchDrawCount(n[0]?.rowCount??0,t?.count)}drawVectorGroups(t){let n=this.drawingVectorBatches,r=this._vertexCountSet;this.drawingVectorBatches=!0;try{let n=Xo(this,this.geometryVectorBindings,this.attributeVectorBindings,()=>this.syncVectorBindings(),()=>e.prototype.draw.call(this,t));return n&&(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1),n}finally{this._vertexCountSet=r,this.drawingVectorBatches=n}}drawBatches(t,{vectors:n,onBatch:r}){let i=qo(this.id,n);Ko(this.id,n,this.bufferLayout);for(let e of Object.keys(n))y(!n[e]||this.currentAttributes[e]);let a={...this.currentAttributes},o={...this.currentAttributeByteOffsets},s={...this.bindings},c=this.instanceCount,l=this.vertexCount,u=this.isInstanced,d=this._vertexCountSet,f=this.drawingVectorBatches,p=this.device.type===`webgpu`&&i.length?new It(this.device,this.shaderInputs.modules):void 0;if(p&&this._uniformStore.uniformBuffers.size){this.batchUniformBuffer??=new bo(this.device);let e=0;for(let t of this._uniformStore.uniformBuffers.keys())e+=this.batchUniformBuffer.getAlignedByteLength(p.getUniformBufferData(t).byteLength);this.batchUniformBuffer.prepare(e*i.length)}this.drawingVectorBatches=!0;let m=!0;try{for(let n of i){this.setGPUData(n.data),this.setBatchDrawCount(n.rowCount),r?.(n);let i={};try{if(p){p.setUniforms(this.shaderInputs.getUniformValues());for(let[e,t]of this._uniformStore.uniformBuffers){let n=`${e}Uniforms`;this.bindings[n]===t&&(i[n]=t,this.setBindings({[n]:this.batchUniformBuffer.write(p.getUniformBufferData(e))}))}}m=e.prototype.draw.call(this,t)&&m}finally{this.setBindings(i)}}}finally{p?.destroy(),this.setAttributes(a,{byteOffsets:o});for(let e of Object.keys(this.bindings))e in s||delete this.bindings[e];this.setBindings(s),this.setInstanceCount(c),this.setVertexCount(l),this.isInstanced=u,this._vertexCountSet=d,this.drawingVectorBatches=f}return m}setGPUData(e){this.setAttributes(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t.buffer])),{byteOffsets:Object.fromEntries(Object.entries(e).map(([e,t])=>{let n=this.bufferLayout.find(t=>t.name===e),r=t.byteOffset-(n?.attributes?.[0]?.byteOffset??0);return y(r>=0),[e,r]}))})}setBatchDrawCount(e,t=this.props.gpuVectorCount){t===`instance`?this.setInstanceCount(e):t===`vertex`&&this.setVertexCount(e)}setTopology(e){e!==this.topology&&(this.topology=e,this._setPipelineNeedsUpdate(`topology`))}setBufferLayout(e){this.explicitBufferLayout=e;let t=this.geometryVectorBindings,n=this.attributeVectorBindings,r=this.getExplicitVectorLayouts(t.inputs)??t.sourceLayouts,i=this.getExplicitVectorLayouts(n.inputs)??n.sourceLayouts;t.setInputs(t.inputs,r,`vertex`),n.setInputs(n.inputs,i,this.isInstanced?`instance`:`vertex`),(!this.isInstanced||n.vertexCount!==void 0)&&Yo([...Object.values(t.inputs),...Object.values(n.inputs)]),this.claimVectorLayouts(t),this.claimVectorLayouts(n),this.applyBufferLayout(this.getVectorBufferLayout())}applyBufferLayout(e){if(e=No(this.pipeline.shaderLayout,e),jo(e,this.bufferLayout,-1))return;this.bufferLayout=e,this._setPipelineNeedsUpdate(`bufferLayout`),this.pipeline=this._updatePipeline();let t=this.vertexArray;this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),t.destroy(),this._dynamicAttributeBufferSources={},this.applyVectorAttributes(),this.indexBuffer&&this.vertexArray.setIndexBuffer(this.indexBuffer)}setParameters(e){jo(e,this.parameters,2)||(this.parameters=e,this.device.type===`webgl`?this.setNeedsRedraw(`parameters`):this._setPipelineNeedsUpdate(`parameters`))}setInstanceCount(e){this.instanceCount=e,this.isInstanced===void 0&&e>0&&(this.isInstanced=!0),this.setNeedsRedraw(`instanceCount`)}setVertexCount(e){this.vertexCount=e,this._vertexCountSet=!0,this.setNeedsRedraw(`vertexCount`)}setIndexCount(e){this.indexCount=e,this.setNeedsRedraw(`indexCount`)}setDrawOffsets({firstVertex:e,firstIndex:t}){this.firstVertex=e,this.firstIndex=t,this.setNeedsRedraw(`drawOffsets`)}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new It(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(Io(t)&&this._usesManagedUniformBuffer(e)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.setNeedsRedraw(`shaderInputs`)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this.setBindings(this._getShaderInputBindings()),this.setNeedsRedraw(`shaderInputs`)}_getShaderInputBindings(){return this.shaderInputs.getBindingValues()}setBindings(e){Object.assign(this.bindings,e),this.setNeedsRedraw(`bindings`)}setTransformFeedback(e){this.transformFeedback=e,this.setNeedsRedraw(`transformFeedback`)}setIndexBuffer(e){this.indexVector&&(this.indexCount=void 0,this.firstVertex=0,this.firstIndex=0),this.indexVector=null;let t=e instanceof j?e.buffer:e;this.indexBuffer=t,this._dynamicIndexBufferSource=e instanceof j?{source:e,generation:e.generation}:null,this.vertexArray.setIndexBuffer(t),this.setNeedsRedraw(`indexBuffer`)}setAttributes(e,t){Object.assign(this.currentAttributes,e);for(let n of Object.keys(e))this.currentAttributeByteOffsets[n]=t?.byteOffsets?.[n]??0;this._drawBlockedReason=!1;let n=t?.disableWarnings??this.props.disableWarnings;e.indices&&o.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)(),this.bufferLayout=No(this.pipeline.shaderLayout,this.bufferLayout);let r=new Mo(this.bufferLayout);for(let[i,a]of Object.entries(e)){let e=a instanceof j?a.buffer:a,s=r.getBufferLayout(i);if(!s){n||o.warn(`Model(${this.id}): Missing layout for buffer "${i}".`)();continue}let c=r.getAttributeNamesForBuffer(s),l=!1;for(let r of c){let s=this._attributeInfos[r];if(s){let r=this.device.type===`webgpu`?this.vertexArray.getBufferSlot(s.bufferName):s.location;if(r===null){n||o.warn(`Model(${this.id}): Missing vertex array slot for buffer "${s.bufferName}".`)();continue}let c=t?.byteOffsets?.[i]??0;this.vertexArray.setBuffer(r,e,c),a instanceof j?this._dynamicAttributeBufferSources[r]={source:a,generation:a.generation,byteOffset:c}:delete this._dynamicAttributeBufferSources[r],l=!0}}!l&&!n&&o.warn(`Model(${this.id}): Ignoring buffer "${e.id}" for unknown attribute "${i}"`)()}this.setNeedsRedraw(`attributes`)}setConstantAttributes(e,t){for(let[n,r]of Object.entries(e)){let e=this._attributeInfos[n];e?this.vertexArray.setConstantWebGL(e.location,r):(t?.disableWarnings??this.props.disableWarnings)||o.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${n}"`)()}this.setNeedsRedraw(`constants`)}_areBindingsLoading(){for(let e of Object.values(this.bindings))if(Rs(e)&&!e.isReady)return e.id;return!1}_getBindings(e=this._getCurrentShaderLayout()){let t={};for(let[n,r]of Object.entries(this.bindings)){let i=Js(n,r,e);i&&(t[n]=i)}return t}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){return e.bindings.length?d(e,t):{0:t}}_getBindGroupCacheKeys(){return{}}_getBindingsUpdateTimestamp(){let e=0;this._dynamicIndexBufferSource&&(e=Math.max(e,this._dynamicIndexBufferSource.source.updateTimestamp));for(let t of Object.values(this._dynamicAttributeBufferSources))e=Math.max(e,t.source.updateTimestamp);for(let t of Object.values(this.bindings))t instanceof f?e=Math.max(e,t.texture.updateTimestamp):t instanceof g||t instanceof p||t instanceof de||t instanceof j?e=Math.max(e,t.updateTimestamp):Rs(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:ds(t)&&(e=Math.max(e,(t.buffer instanceof j,t.buffer.updateTimestamp)));return e}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate||=e,this._drawBlockedReason=!1,this.setNeedsRedraw(e)}_updatePipeline(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=this.pipelineFactory.createRenderPipeline(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createRenderPipelineAsync(e.props)}catch(t){throw this._releasePipelineShaders(e.vertexShader,e.fragmentShader),this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?.vs??null,t=this.pipeline?.fs??null;this.pipeline&&o.log(1,`GPUVectorModel ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1;let n=null,r=null;try{n=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:`vertex`,source:this.source||this.vs,debugShaders:this.props.debugShaders}),this.source?r=n:this.fs&&(r=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`fragment`,source:this.fs,debugShaders:this.props.debugShaders}))}catch(e){throw this._releasePipelineShaders(n,r),this._pipelineNeedsUpdate=`shader creation failed`,e}return{props:{...this.props,bindings:void 0,bufferLayout:this.bufferLayout,colorAttachmentFormats:this._colorAttachmentFormats,depthStencilAttachmentFormat:this._depthStencilAttachmentFormat,topology:this.topology,parameters:this.parameters,bindGroups:void 0,vs:n,fs:r},vertexShader:n,fragmentShader:r,previousVertexShader:e,previousFragmentShader:t}}_finishPipelineUpdate(e){this._attributeInfos=ae(this.pipeline.shaderLayout,this.bufferLayout),this._releasePipelineShaders(e.previousVertexShader,e.previousFragmentShader)}_releasePipelineShaders(e,t){e&&this.shaderFactory.release(e),t&&t!==e&&this.shaderFactory.release(t)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=o.level>3?0:Hs;o.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,o.group(Vs,`>>> DRAWING MODEL ${this.id}`,{collapsed:o.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=xo(this.pipeline.shaderLayout,this.id);o.table(Vs,e)();let t=this.shaderInputs.getDebugTable();o.table(Vs,t)();let n=this._getAttributeDebugTable();o.table(Vs,this._attributeInfos)(),o.table(Vs,n)(),o.groupEnd(Vs)(),this._logOpen=!1}}_drawCount=0;_logFramebuffer(e){let t=this.device.props.debugFramebuffers;if(this._drawCount++,!t)return;let n=e.props.framebuffer;wo(e,n,{id:n?.id||`${this.id}-framebuffer`,minimap:!0})}_getAttributeDebugTable(){let e={};for(let[t,n]of Object.entries(this._attributeInfos)){let r=this.vertexArray.attributes[n.location];e[n.location]={name:t,type:n.shaderType,values:r?this._getBufferOrConstantValues(r,n.bufferDataType):`null`}}if(this.vertexArray.indexBuffer){let{indexBuffer:t}=this.vertexArray,n=t.indexType===`uint32`?new Uint32Array(t.debugData):new Uint16Array(t.debugData);e.indices={name:`indices`,type:t.indexType,values:n.toString()}}return e}_getBufferOrConstantValues(e,t){let n=ee.getTypedArrayConstructor(t);return(e instanceof g?new n(e.debugData):e).toString()}_getCurrentShaderLayout(){return this.pipeline?.shaderLayout||this.props.shaderLayout||{bindings:[]}}_syncDynamicBuffers(){if(this._dynamicIndexBufferSource&&this._dynamicIndexBufferSource.generation!==this._dynamicIndexBufferSource.source.generation){let e=this._dynamicIndexBufferSource.source.buffer;this.indexBuffer=e,this.vertexArray.setIndexBuffer(e),this._dynamicIndexBufferSource.generation=this._dynamicIndexBufferSource.source.generation,this.setNeedsRedraw(`dynamic index buffer`)}for(let[e,t]of Object.entries(this._dynamicAttributeBufferSources))t.generation!==t.source.generation&&(this.vertexArray.setBuffer(Number(e),t.source.buffer,t.byteOffset),t.generation=t.source.generation,this.setNeedsRedraw(`dynamic attribute buffer`))}_syncAttachmentFormats(e){if(this.device.type!==`webgpu`)return;let t=e.framebuffer||e.props.framebuffer,n=e.props,r=n.colorAttachmentFormats??t?.colorAttachments?.map(e=>Ys(e?.texture?.format)),i=n.depthStencilAttachmentFormat===!1?void 0:n.depthStencilAttachmentFormat??Xs(t?.depthStencilAttachment?.texture?.format);(!jo(this._colorAttachmentFormats,r,1)||this._depthStencilAttachmentFormat!==i)&&(this._colorAttachmentFormats=r,this._depthStencilAttachmentFormat=i,this._setPipelineNeedsUpdate(`attachment formats`))}};function Ks(e,t){return e.shaderLanguage!==void 0&&e.shaderLanguage!==t?!1:t===`glsl`?`assembleGLSLShaderPair`in e&&typeof e.assembleGLSLShaderPair==`function`:`assembleWGSLShader`in e&&typeof e.assembleWGSLShader==`function`}function qs(e,t){return!e||Object.keys(t).length===0?e:{...e,attributes:e.attributes.map(e=>{let n=e.name.startsWith(`_luma_`)?e.name.slice(6):null;return n&&t[n]?{...e,name:n}:e})}}function Js(e,t,n){if(Rs(t)){let r=Bs(n,e,{fallbackGroup:0});return r?t.resolveTextureBinding(r):null}return t instanceof j?t.buffer:ds(t)?ms(t):t}function Ys(e){return e&&!Zs(e)?e:null}function Xs(e){return e&&Zs(e)?e:void 0}function Zs(e){return Ws.includes(e)}var Qs=class{id;userData={};topology;bufferLayout=[];vertexCount;indices;attributes;constructor(e){if(this.id=e.id||Go(`geometry`),this.topology=e.topology,this.indices=e.indices||null,this.attributes=e.attributes,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout||[],this.indices&&!(this.indices.usage&g.INDEX))throw Error(`Index buffer must have INDEX usage`)}destroy(){this.indices?.destroy();for(let e of Object.values(this.attributes))e.destroy()}getVertexCount(){return this.vertexCount}getAttributes(){return this.attributes}getIndexes(){return this.indices||null}_calculateVertexCount(e){return e.byteLength/12}};function $s(e,t){if(t instanceof Qs)return t;let n=yn(t),r=ec(e,n),{attributes:i,bufferLayout:a}=tc(e,n);return new Qs({topology:n.topology||`triangle-list`,bufferLayout:a,vertexCount:n.vertexCount,indices:r,attributes:i})}function ec(e,t){if(!t.indices)return;let n=t.indices.value;return e.createBuffer({usage:g.INDEX,data:n})}function tc(e,t){let n={};for(let[r,i]of Object.entries(t.attributes)){let a=t.bufferLayout?.find(e=>e.name===r)?.name||_n(r);i&&(n[a]=e.createBuffer({data:i.value,id:`${r}-buffer`}))}return{attributes:n,bufferLayout:t.bufferLayout||vn(t.attributes),vertexCount:t.vertexCount}}var nc=class{attributes;indices;topology;vertexCount;bufferLayout;constructor(e){this.attributes=e.attributes,this.indices=e.indices??null,this.topology=e.topology??`triangle-list`,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout}};function rc(e){let t={};for(let[n,i]of Object.entries(e.attributes)){let a=e.bufferLayout.find(e=>e.name===n),o=a?.format,s=a?.byteStride??(o?r.getVertexFormatInfo(o).byteLength:0),c=e.indices&&s?Math.floor(i.byteLength/s):e.vertexCount;t[n]={name:n,format:o,length:c,byteStride:s,rowByteLength:s,bufferLayout:a,data:[{buffer:i,byteOffset:0,length:c,format:o,byteStride:s,rowByteLength:s}]}}if(e.indices){let e=Math.min(...Object.values(t).map(e=>e.length));for(let[n,r]of Object.entries(t))t[n]={...r,length:e,data:r.data.map(t=>({...t,length:e}))}}let n=e.indices,i=n?.indexType===`uint32`?4:n?.indexType===`uint8`?1:2,a=n?n.byteLength/i:0;return new nc({attributes:t,indices:n?{name:`indices`,format:n.indexType,length:a,byteStride:i,rowByteLength:i,data:[{buffer:n,byteOffset:0,length:a,format:n.indexType,byteStride:i,rowByteLength:i}]}:null,topology:e.topology,vertexCount:e.vertexCount,bufferLayout:e.bufferLayout})}var ic=class extends Gs{static defaultProps={...Gs.defaultProps,material:void 0};get sourceGeometry(){return this.sourceGeometryValue}constructor(e,t){let n=t.geometry===void 0?new.target.defaultProps.geometry:t.geometry,r=n&&!(n instanceof nc)?$s(e,n):null,i=r?rc(r):n,a={...t,geometry:i instanceof nc?i:null};try{super(e,a)}catch(e){throw r?.destroy(),e}this._gpuGeometry=r,this.sourceGeometryValue=n,r&&this.setIndexCount(this.props.indexCount)}_initializeProps(e){this.material=e.material||null,this._gpuGeometry=null,this.sourceGeometryValue=null,super._initializeProps(e)}_initializeAttributes(){super._initializeAttributes(),this._gpuGeometry&&super.setIndexCount(this.indexCountOverride)}destroy(){super.destroy(),this._gpuGeometry?.destroy(),this._gpuGeometry=null,this.sourceGeometryValue=null}setGeometry(e){this._gpuGeometry?.destroy(),this._gpuGeometry=e&&!(e instanceof nc)?$s(this.device,e):null;let t=this._gpuGeometry?rc(this._gpuGeometry):e;super.setGeometry(t instanceof nc?t:null),e instanceof nc||super.setIndexCount(this.indexCountOverride),this.sourceGeometryValue=e}setIndexCount(e){this.indexCountOverride=e,super.setIndexCount(e)}setMaterial(e){this.material=e,this.setNeedsRedraw(`material`)}_usesManagedUniformBuffer(e){return!this.material?.ownsModule(e)}updateShaderInputs(e){super.updateShaderInputs(e),this.material?.updateShaderInputs(e)}_getShaderInputBindings(){let e=super._getShaderInputBindings(),t=this.material;return t?Object.fromEntries(Object.entries(e).filter(([e])=>!t.ownsBinding(e))):e}_areBindingsLoading(){let e=super._areBindingsLoading();if(e)return e;for(let e of Object.values(this.material?.bindings||{}))if(Rs(e)&&!e.isReady)return e.id;return!1}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){let n=super._getBindGroups(e,t);for(let[t,r]of Object.entries(this.material?.getBindingsByGroup(e)||{})){let e=Number(t);n[e]={...n[e]||{},...r}}return n}_getBindGroupCacheKeys(){let e=this.material?.getBindGroupCacheKey(3);return e?{3:e}:{}}_getBindingsUpdateTimestamp(){return Math.max(super._getBindingsUpdateTimestamp(),this.material?.getBindingsUpdateTimestamp()||0)}},ac=class{device;modules;_materialBindingNames;_materialModuleNames;constructor(e,t={}){this.device=e,this.modules=t.modules||[];let n=new rs(Object.fromEntries(this.modules.map(e=>[e.name,e])));this._materialBindingNames=sc(n),this._materialModuleNames=cc(n)}createMaterial(e={}){return new lc(this.device,{...e,factory:this})}getBindingNames(){return Array.from(this._materialBindingNames)}ownsBinding(e){if(this._materialBindingNames.has(e))return!0;let t=oc(e);return t?this._materialModuleNames.has(t):!1}ownsModule(e){return this._materialModuleNames.has(e)}getBindingsByGroup(e){return Object.keys(e).length>0?{3:e}:{}}};function oc(e){return e.endsWith(`Uniforms`)?e.slice(0,-8):null}function sc(e){let t=new Set;for(let n of Object.values(e.modules))for(let e of n.bindingLayout||[])e.group===3&&t.add(e.name);return t}function cc(e){let t=new Set;for(let n of Object.values(e.modules))n.name&&n.bindingLayout?.some(e=>e.group===3&&e.name===n.name)&&t.add(n.name);return t}var lc=class{id;device;factory;shaderInputs;bindings={};_uniformStore;_bindGroupCacheToken={};_dynamicResourceGenerations={};constructor(e,t={}){this.id=t.id||Go(`material`),this.device=e,this.factory=t.factory||new ac(e,{modules:t.modules||t.shaderInputs?.getModules()||[]});let n=Object.fromEntries((t.shaderInputs?.getModules()||this.factory.modules).map(e=>[e.name,e]));this.shaderInputs=t.shaderInputs||new rs(n),this._uniformStore=new It(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(this.ownsModule(e)&&Io(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}this.updateShaderInputs(),t.bindings&&this._replaceOwnedBindings(t.bindings)}destroy(){this._uniformStore.destroy()}clone(e={}){let t=this.factory.createMaterial({id:e.id,shaderInputs:e.shaderInputs,bindings:{...this.getResourceBindings(),...e.bindings}});return e.shaderInputs||t.setProps(this.shaderInputs.getUniformValues()),e.moduleProps&&t.setProps(e.moduleProps),t.updateShaderInputs(),t}ownsBinding(e){return this.factory.ownsBinding(e)}ownsModule(e){return this.factory.ownsModule(e)}setProps(e){this.shaderInputs.setProps(e)}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this._setOwnedBindings(this.shaderInputs.getBindingValues())&&(this._bindGroupCacheToken={})}getResourceBindings(){let e={};for(let[t,n]of Object.entries(this.bindings))oc(t)||(e[t]=n);return e}getBindings(e={bindings:[]}){this._syncDynamicResourceGenerations();let t={},n=t;for(let[t,r]of Object.entries(this.bindings))if(Rs(r)){let i=Bs(e,t,{fallbackGroup:3}),a=i?r.resolveTextureBinding(i):null;a&&(n[t]=a)}else r instanceof j?n[t]=r.buffer:ds(r)?n[t]=ms(r):n[t]=r;return this._syncDynamicResourceGenerations(),t}getBindingsByGroup(e={bindings:[]}){return this.factory.getBindingsByGroup(this.getBindings(e))}getBindGroupCacheKey(e){return this._syncDynamicResourceGenerations(),e===3?this._bindGroupCacheToken:null}getBindingsUpdateTimestamp(){let e=0;for(let t of Object.values(this.bindings))t instanceof f?e=Math.max(e,t.texture.updateTimestamp):t instanceof g||t instanceof p||t instanceof de||t instanceof j?e=Math.max(e,t.updateTimestamp):Rs(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:ds(t)&&(e=Math.max(e,(t.buffer instanceof j,t.buffer.updateTimestamp)));return e}_replaceOwnedBindings(e){this._setOwnedBindings(e)&&(this._bindGroupCacheToken={})}_setOwnedBindings(e){let t=!1;for(let[n,r]of Object.entries(e))r!==void 0&&this.ownsBinding(n)&&this.bindings[n]!==r&&(this.bindings[n]=r,t=!0);return t}_syncDynamicResourceGenerations(){let e={},t=!1;for(let[n,r]of Object.entries(this.bindings)){let i=uc(r);i!==null&&(e[n]=i,this._dynamicResourceGenerations[n]!==i&&(t=!0))}Object.keys(e).length!==Object.keys(this._dynamicResourceGenerations).length&&(t=!0),this._dynamicResourceGenerations=e,t&&(this._bindGroupCacheToken={})}};function uc(e){return Rs(e)?e.generation:fs(e)?.generation??null}var dc=`struct VertexInputs {
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
`,fc=`#version 300 es
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
`,pc=[-1,-1,1,-1,-1,1,1,1],mc=[-1,-1,3,-1,-1,3],hc=class extends ic{constructor(e,t){let{geometryType:n=`quad`,...r}=t,i=n===`triangle`?mc:pc,a=i.map(e=>(e+1)/2),o=i.length/2;r.source&&=`${dc}\n${r.source}`,super(e,{id:r.id||Go(`clip-space`),...r,vs:fc,vertexCount:o,geometry:new gn({topology:n===`triangle`?`triangle-list`:`triangle-strip`,vertexCount:o,attributes:{clipSpacePositions:{size:2,value:new Float32Array(i)},texCoords:{size:2,value:new Float32Array(a)},coordinates:{size:2,value:new Float32Array(a)}}})})}},gc={name:`background`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},_c=`@group(0) @binding(auto) var backgroundTexture: texture_2d<f32>;
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
`,vc=`#version 300 es
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
`,yc=class extends hc{backgroundTexture=null;flipY=!1;constructor(e,t){if(super(e,{...t,id:t.id||`background-texture-model`,source:_c,fs:vc,modules:[...t.modules||[],gc],parameters:{depthWriteEnabled:!1,...t.parameters||{},...t.blend?{blend:!0,blendColorOperation:`add`,blendAlphaOperation:`add`,blendColorSrcFactor:`one-minus-dst-alpha`,blendColorDstFactor:`one`,blendAlphaSrcFactor:`one-minus-dst-alpha`,blendAlphaDstFactor:`one`}:{}}}),!t.backgroundTexture)throw Error(`BackgroundTextureModel requires a backgroundTexture prop`);this.setProps(t)}setProps(e){let{backgroundTexture:t}=e;if(e.flipY!==void 0&&(this.flipY=e.flipY,this.backgroundTexture&&this.updateScale(this.backgroundTexture)),t)if(this.setBindings({backgroundTexture:t}),t.isReady){let e=t instanceof js?t.texture:t;this.backgroundTexture=e,this.updateScale(e)}else t.ready.then(e=>{this.backgroundTexture=e,this.updateScale(e)})}predraw(e){super.predraw(e)}updateScale(e){if(!e){this.shaderInputs.setProps({background:{scale:[1,1],flipY:0}});return}let[t,n]=this.device.getCanvasContext().getDrawingBufferSize(),r=e.width,i=e.height,a=t/n,o=r/i,s=1,c=1;a>o?c=a/o:s=o/a,this.shaderInputs.setProps({background:{scale:[s,c],flipY:this.flipY?1:0}})}},bc=class extends gn{constructor(e={}){let t=new mn(e);super({...t,attributes:t.attributes})}},xc=class extends gn{constructor(e={}){let t=new un({...e,attributes:void 0,radius:e.radius??1});for(let e of[`POSITION`,`NORMAL`]){let n=t.attributes[e].value;for(let e=0;e<n.length;e+=3){let t=n[e];n[e]=n[e+2],n[e+2]=t}}let n=t.indices?.value;if(n)for(let e=0;e<n.length;e+=3){let t=n[e+1];n[e+1]=n[e+2],n[e+2]=t}super({...t,attributes:{...t.attributes,...e.attributes}})}},Sc=class extends gn{constructor(e={}){let t=new sn({...e,bottomRadius:e.bottomRadius??1});super({...t,attributes:t.attributes})}},Cc=class extends Sc{constructor(e={}){let t=e.radius??1;super({...e,topRadius:t,bottomRadius:t})}},wc=class extends Sc{constructor(e={}){let t=e.cap??!0;super({...e,topRadius:0,bottomRadius:e.radius??1,topCap:t,bottomCap:t})}},Tc=class extends gn{constructor(e={}){let{type:t=`x,y`,offset:n=0,flipCull:r=!1}=e,i={"x,y":{sizeX:e.xlen,sizeZ:e.ylen,nx:e.nx,nz:e.ny},"x,z":{sizeX:e.xlen,sizeZ:e.zlen,nx:e.nx,nz:e.nz},"y,z":{sizeX:e.ylen,sizeZ:e.zlen,nx:e.ny,nz:e.nz}}[t];if(!i)throw Error(`Invalid plane axes`);let a=new ln({sizeX:i.sizeX||1,sizeZ:i.sizeZ||1,nx:i.nx||1,nz:i.nz||1});Ec(a,t,n,r);let o=e.unpack?en(a):a;super({id:e.id,topology:a.topology,indices:e.unpack?void 0:a.indices,attributes:Dc(o.attributes,e.attributes)})}};function Ec(e,t,n,r){let i=e.attributes.POSITION.value,a=e.attributes.NORMAL.value,o=e.attributes.TEXCOORD_0.value;for(let e=0;e<i.length/3;e++){let s=e*3,c=Number(i[s])*(r?-1:1),l=-Number(i[s+2]),u=r?1:-1;t===`x,y`?(i.set([c,l,n],s),a.set([0,0,u],s)):t===`x,z`?(i.set([c,n,l],s),a.set([0,u,0],s)):(i.set([n,c,l],s),a.set([u,0,0],s)),r&&(o[e*2]=1-Number(o[e*2]))}if(t!==`x,z`&&e.indices){let t=e.indices.value;for(let e=0;e<t.length;e+=3){let n=t[e+1];t[e+1]=t[e+2],t[e+2]=n}}}function Dc(e,t={}){let n={};for(let[t,r]of Object.entries(e))r&&(n[t]=r);return{...n,...t}}function Oc(e,t){if(!e)throw Error(t)}var kc=class{id;matrix=new D;display=!0;position=new xe;rotation=new xe;scale=new xe(1,1,1);userData={};props={};constructor(e={}){let{id:t}=e;this.id=t||Go(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return Oc(e.length===3,`setPosition requires vector argument`),this.position=e,this}setRotation(e){return Oc(e.length===3||e.length===4,`setRotation requires vector argument`),this.rotation=e,this}setScale(e){return Oc(e.length===3,`setScale requires vector argument`),this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){let{position:t,rotation:n,scale:r,update:i=!0}=e;return t&&this.setPosition(t),n&&this.setRotation(n),r&&this.setScale(r),i&&this.updateMatrix(),this}updateMatrix(){if(this.matrix.identity(),this.matrix.translate(this.position),this.rotation.length===4){let e=new D().fromQuaternion(this.rotation);this.matrix.multiplyRight(e)}else this.matrix.rotateXYZ(this.rotation);return this.matrix.scale(this.scale),this}update({position:e,rotation:t,scale:n}={}){return e&&this.setPosition(e),t&&this.setRotation(t),n&&this.setScale(n),this.updateMatrix(),this}getCoordinateUniforms(e,t){t||=this.matrix;let n=new D(e).multiplyRight(t),r=n.invert(),i=r.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:n,worldInverseMatrix:r,worldInverseTransposeMatrix:i}}_setScenegraphNodeProps(e){e.display!==void 0&&(this.display=e.display),e?.position&&this.setPosition(e.position),e?.rotation&&this.setRotation(e.rotation),e?.scale&&this.setScale(e.scale),this.updateMatrix(),e?.matrix&&this.setMatrix(e.matrix),Object.assign(this.props,e)}};function Ac(){return[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]]}function jc(e,t,n){let r=new D(n);for(let n=0;n<8;n++){let i=new xe(t[n&1?1:0][0],t[n&2?1:0][1],t[n&4?1:0][2]);r.transformAsPoint(i,i);for(let t=0;t<3;t++)e[0][t]=Math.min(e[0][t],i[t]),e[1][t]=Math.max(e[1][t],i[t])}}function Mc(e){return Number.isFinite(e[0][0])}var Nc=class e extends kc{children;transformSource;constructor(e={}){e=Array.isArray(e)?{children:e}:e;let{children:t=[]}=e;o.assert(t.every(e=>e instanceof kc),`every child must an instance of ScenegraphNode`),super(e),this.children=t,this.transformSource=e.transformSource??null}getBounds(){let e=Ac();return this.traverse((t,{worldMatrix:n})=>{let r=t.getBounds();r&&jc(e,r,new D(n).multiplyRight(t.matrix))}),Mc(e)?e:null}destroy(){this.children.forEach(e=>e.destroy()),this.removeAll(),super.destroy()}add(...e){for(let t of e)Array.isArray(t)?this.add(...t):this.children.push(t);return this}remove(e){let t=this.children,n=t.indexOf(e);return n>-1&&t.splice(n,1),this}removeAll(){return this.children=[],this}findNode(e){let t=this.findNodes(e);if(t.length>1)throw Error(`Ambiguous scenegraph path: ${e} (${t.length} matches)`);return t[0]}findNodes(t){let n=t.startsWith(`/`),r=t===`/`?[]:(n?t.slice(1):t).split(`/`).map(e=>{if(!e||/~(?![01])/.test(e))throw Error(`Invalid scenegraph path: ${t}`);return e.replace(/~1/g,`/`).replace(/~0/g,`~`)}),i=[],a=[],o=new Set,s=[{node:this,depth:0}];for(;s.length;){let{node:t,depth:c}=s.pop();y(!o.has(t)),o.add(t),a.length=c,a.push(t.id);let l=a.length-r.length;if((n?l===1:l>=0)&&r.every((e,t)=>e===a[l+t])&&i.push(t),t instanceof e)for(let e=t.children.length-1;e>=0;e--)s.push({node:t.children[e],depth:c+1})}return i}traverse(t,{worldMatrix:n=new D}={}){if(!this.display)return;let r=new D(n).multiplyRight(this.matrix);for(let n of this.children)n.display&&(n instanceof e?n.traverse(t,{worldMatrix:r}):t(n,{worldMatrix:r}))}traverseDepthSorted(e,{viewMatrix:t,worldMatrix:n=new D,order:r=`back-to-front`}){let i=new D(t),a=[];this.traverse((e,t)=>{let n=e.getBounds(),r=n?new xe(n[0]).add(n[1]).divide([2,2,2]):new xe,o=new D(t.worldMatrix).multiplyRight(e.matrix);o.transformAsPoint(r,r),i.transformAsPoint(r,r),a.push({node:e,context:{worldMatrix:o,bounds:n,depth:-r[2]},index:a.length})},{worldMatrix:new D(n)});let o=r===`back-to-front`?-1:1;a.sort((e,t)=>o*(e.context.depth-t.context.depth)||e.index-t.index);for(let{node:t,context:n}of a)e(t,n)}preorderTraversal(t,{worldMatrix:n=new D}={}){let r=new D(n).multiplyRight(this.matrix);t(this,{worldMatrix:r});for(let n of this.children)n instanceof e?n.preorderTraversal(t,{worldMatrix:r}):t(n,{worldMatrix:r})}},Pc=class extends kc{geometry;constructor(e){super(e),this.geometry=e.geometry}getBounds(){let e=this.geometry.attributes.POSITION;if(!e||e.size!==3||!e.value.length)return null;let t=[1/0,1/0,1/0],n=[-1/0,-1/0,-1/0];for(let r=0;r<e.value.length;r++){let i=r%3;t[i]=Math.min(t[i],e.value[r]),n[i]=Math.max(n[i],e.value[r])}return[t,n]}},Fc=class{id;current;next;constructor(e){this.id=e.id||`swap`,this.current=e.current,this.next=e.next}destroy(){this.current?.destroy(),this.next?.destroy()}swap(){let e=this.current;this.current=this.next,this.next=e}},Ic=class extends Fc{constructor(e,t){t={...t};let{width:n=1,height:r=1}=t,i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-0`,format:i,usage:p.SAMPLE|p.RENDER|p.COPY_SRC|p.COPY_DST,width:n,height:r}):i),a=e.createFramebuffer({...t,colorAttachments:i});i=t.colorAttachments?.map(i=>typeof i==`string`?e.createTexture({id:`${t.id}-texture-1`,format:i,usage:p.SAMPLE|p.RENDER|p.COPY_SRC|p.COPY_DST,width:n,height:r}):i);let o=e.createFramebuffer({...t,colorAttachments:i});super({current:a,next:o});for(let[e,n]of(t.colorAttachments||[]).entries())typeof n==`string`&&(a.attachResource(a.colorAttachments[e].texture),o.attachResource(o.colorAttachments[e].texture))}resize(e){if(e.width===this.current.width&&e.height===this.current.height)return!1;let{current:t,next:n}=this;return this.current=t.clone(e),Lc(this.current),t.destroy(),this.next=n.clone(e),Lc(this.next),n.destroy(),!0}};function Lc(e){for(let t of e.colorAttachments)e.attachResource(t.texture);e.depthStencilAttachment&&e.attachResource(e.depthStencilAttachment.texture)}var Rc=2,zc=1e4,M=class e{static async createAsync(t,n){let r=!k.getAsyncCompilation(t),i=r?k.beginAsyncCompilation(t):k.getAsyncCompilation(t),a;try{a=new e(t,n)}finally{r&&k.endAsyncCompilation(t,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}static defaultProps={...ue.defaultProps,id:`unnamed`,handle:void 0,userData:{},source:``,sourceLanguage:void 0,modules:[],defines:{},plugins:[],bindings:void 0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,shaderAssembler:void 0,debugShaders:void 0};device;id;pipelineFactory;shaderFactory;userData={};bindings={};pipeline;source;shader;shaderInputs;_uniformStore;_pipelineNeedsUpdate=`newly created`;_getModuleUniforms;props;_destroyed=!1;_pipelineInitialization;constructor(t,n){if(t.type!==`webgpu`)throw Error(`Computation is only supported in WebGPU`);this.props={...e.defaultProps,...n,shaderAssembler:n.shaderAssembler??e.defaultProps.shaderAssembler??new Ia},n=this.props,this.id=n.id||Go(`model`),this.device=t,Object.assign(this.userData,n.userData);let r=Uo(t),i=pr(this.props.plugins,r.shaderLanguage);if(i.hooks.length>0)throw Error(`Computation does not support ShaderPlugin render hooks`);if(Object.keys(i.vertexInputs).length>0||Object.keys(i.interStageVariables).length>0)throw Error(`Computation does not support ShaderPlugin vertex inputs or interStageVariables`);let a=mr(this.props.modules,i.modules),o=Object.fromEntries(a.map(e=>[e.name,e]));this.shaderInputs=n.shaderInputs||new rs(o),n.shaderInputs&&i.modules.length>0&&this.shaderInputs.addModules(i.modules),this.setShaderInputs(this.shaderInputs);let s=Ro(this.props.modules,this.shaderInputs?.getModules()),c={...i.defines,...this.props.defines};this.props.shaderLayout=Po(this.props.shaderLayout,s)||null,this.pipelineFactory=n.pipelineFactory||k.getDefaultPipelineFactory(this.device),this.shaderFactory=n.shaderFactory||Tt.getDefaultShaderFactory(this.device);let l=this.props.shaderAssembler;y(l instanceof Ia);let{source:u,getUniforms:d,entryPoints:f={},shaderLayout:p}=l.assembleWGSLShader({platformInfo:r,...this.props,modules:s,defines:c,shaderStage:`compute`,computeEntryPoint:this.props.entryPoint,scanVertexAttributes:!1,pluginInjections:i.injections});this.source=u,this.props.entryPoint=f.compute||this.props.entryPoint,this._getModuleUniforms=d;let m=p??t.getShaderLayout?.(this.source,{scanVertexAttributes:!1});this.props.shaderLayout=Po(this.props.shaderLayout||m||null,s)||null;let h=k.getAsyncCompilation(this.device);h?(this._pipelineInitialization=this._updatePipelineAsync(),h.push(this._pipelineInitialization)):this.pipeline=this._updatePipeline(),n.bindings&&this.setBindings(n.bindings)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shader&&this.shaderFactory.release(this.shader),this._uniformStore.destroy(),!0)}predraw(e){this.updateShaderInputs(e)}dispatch(e,t,n,r){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatch(t,n,r)}finally{this._logDrawCallEnd()}}dispatchIndirect(e,t,n=0){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatchIndirect(t,n)}finally{this._logDrawCallEnd()}}_setPipeline(e){this.pipeline=this._updatePipeline(),this.pipeline.setBindings(this.bindings),e.setPipeline(this.pipeline),e.setBindings({})}setVertexCount(e){}setInstanceCount(e){}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new It(this.device,this.shaderInputs.modules);for(let[e,t]of Object.entries(this.shaderInputs.modules))if(Io(t)){let t=this._uniformStore.getManagedUniformBuffer(e);this.bindings[`${e}Uniforms`]=t}}setShaderModuleProps(e){let t=this._getModuleUniforms(e),n=Object.keys(t).filter(e=>{let n=t[e];return!ts(n)}),r={};for(let e of n)r[e]=t[e],delete t[e]}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e)}setBindings(e){Object.assign(this.bindings,e)}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate=this._pipelineNeedsUpdate||e}_updatePipeline(){let e=this._preparePipelineUpdate();return e&&(this.pipeline=this.pipelineFactory.createComputePipeline(e.props),this._finishPipelineUpdate(e.previousShader)),this.pipeline}async _updatePipelineAsync(){let e=this._preparePipelineUpdate();if(e){try{this.pipeline=await this.pipelineFactory.createComputePipelineAsync(e.props)}catch(t){throw this.shaderFactory.release(this.shader),this.shader=e.previousShader,this._pipelineNeedsUpdate=`asynchronous pipeline creation failed`,t}this._finishPipelineUpdate(e.previousShader)}return this.pipeline}_preparePipelineUpdate(){if(!this._pipelineNeedsUpdate)return null;let e=this.pipeline?this.shader:null;return this.pipeline&&o.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),this._pipelineNeedsUpdate=!1,this.shader=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:`compute`,source:this.source,debugShaders:this.props.debugShaders}),{props:{...this.props,shader:this.shader},previousShader:e}}_finishPipelineUpdate(e){e&&this.shaderFactory.release(e)}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=o.level>3?0:zc;o.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,o.group(Rc,`>>> DRAWING MODEL ${this.id}`,{collapsed:o.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=this.shaderInputs.getDebugTable();o.table(Rc,e)(),o.groupEnd(Rc)(),this._logOpen=!1}}_drawCount=0;_getBufferOrConstantValues(e,t){let n=ee.getTypedArrayConstructor(t);return(e instanceof g?new n(e.debugData):e).toString()}};function Bc(e){let{shaderPass:t,action:n,shadingLanguage:r}=e;switch(n){case`filter`:let e=`${t.name}_filterColor_ext`;return r===`wgsl`?Vc(e):Uc(e);case`sample`:let n=`${t.name}_sampleColor`;return r===`wgsl`?Hc(n):Wc(n);default:throw Error(`${t.name} no fragment shader generated for shader pass`)}}function Vc(e){return`\
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
`}function Hc(e){return`\
@group(0) @binding(auto) var sourceTexture: texture_2d<f32>;
@group(0) @binding(auto) var sourceTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let texCoord = shaderPassRenderer_getTextureUV(inputs.coordinate);
  let texSize = vec2f(textureDimensions(sourceTexture));
  return ${e}(sourceTexture, sourceTextureSampler, texSize, texCoord);
}
`}function Uc(e){return`\
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
`}function Wc(e){return`\
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
`}var Gc={name:`textureTransform`,source:`
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
`,uniformTypes:{scale:`vec2<f32>`,flipY:`i32`}},Kc=new Set([`original`,`previous`]),qc=class{device;shaderInputs;passRenderers;swapFramebuffers;textureModel;constructor(e,t){this.device=e;let n=Zc(t.shaderPasses);n.map(e=>cr(e));let r=n.reduce((e,t)=>({...e,[t.name]:t}),{});this.shaderInputs=t.shaderInputs||new rs(r);let i=e.getCanvasContext().getDrawingBufferSize();this.swapFramebuffers=new Ic(e,{colorAttachments:[t.colorFormat||e.preferredColorFormat],width:i[0],height:i[1]}),this.textureModel=new yc(e,{backgroundTexture:this.swapFramebuffers.current.colorAttachments[0].texture,flipY:t.flipY??e.type===`webgpu`});let a=t.flipY??e.type===`webgpu`;this.passRenderers=t.shaderPasses.map(t=>new Jc(e,t,this.shaderInputs,a))}destroy(){for(let e of this.passRenderers)e.destroy();this.swapFramebuffers.destroy(),this.textureModel.destroy()}resize(e){e||=this.device.getCanvasContext().getDrawingBufferSize(),this.swapFramebuffers.resize({width:e[0],height:e[1]});for(let t of this.passRenderers)t.resize(e)}resetHistory(){for(let e of this.passRenderers)e.resetHistory()}renderToScreen(e){return this.encodeToScreen(this.device.commandEncoder,e)}encodeToScreen(e,t){let n=this.encodeToTexture(e,t);if(!n)return!1;let r=this.device.getDefaultCanvasContext().getCurrentFramebuffer({depthStencilFormat:!1});this.textureModel.setProps({backgroundTexture:n}),this.textureModel.predraw(e);let i=e.beginRenderPass({id:`shader-pass-renderer-to-screen`,framebuffer:r,clearDepth:!1});return this.textureModel.draw(i),i.end(),!0}renderToTexture(e){return this.encodeToTexture(this.device.commandEncoder,e)}encodeToTexture(e,t){if(e.device!==this.device)throw Error(`ShaderPassRenderer command encoder must belong to the renderer device`);let{sourceTexture:n}=t;if(n instanceof js&&!n.isReady)return null;let r=n instanceof js?n.texture:n;if(this.passRenderers.length===0)return r;t.resetHistory&&this.resetHistory(),this.textureModel.setProps({backgroundTexture:r}),this.textureModel.predraw(e);let i=_l(this.swapFramebuffers,r),a=e.beginRenderPass({id:`shader-pass-renderer-seed-source`,framebuffer:i,clearColor:[0,0,0,1],clearDepth:!1});this.textureModel.draw(a),a.end();let o=i,s=hl(i),c=!1;try{for(let n of this.passRenderers){n.initializeHistoryTargets(r,this.textureModel,e),n.runComputeOptimization({commandEncoder:e,originalTexture:r,previousTexture:s,runtimeUniforms:t.uniforms||{}});for(let i of n.subPassExecutions){let a=i.output||`previous`,c=a===`previous`?gl(this.swapFramebuffers,o):n.getOutputFramebuffer(a),l=hl(c),u=n.resolveBindings({execution:i,originalTexture:r,previousTexture:s,outputTexture:l,externalBindings:t.bindings||{}}),d=il(this.shaderInputs,i,t.uniforms||{});i.subPassRenderer.prepare({commandEncoder:e,bindings:u,textureScale:vl(u.sourceTexture||s,l),uniforms:d});let f=e.beginRenderPass({id:`shader-pass-renderer-run-pass`,framebuffer:c,clearColor:[0,0,0,1],clearDepth:1});i.subPassRenderer.draw(f),f.end(),a===`previous`?(s=l,o=c):n.markTargetWritten(a)}}c=!0}finally{for(let e of this.passRenderers)e.finishFrame(c)}return s}},Jc=class{device;shaderInputs;passDefinition;renderTargets;subPassExecutions;computeRenderer;constructor(e,t,n,r){if(this.device=e,this.shaderInputs=n,this.passDefinition=t,Qc(t)){tl(t.name,t.renderTargets||{}),this.renderTargets=al(e,t.renderTargets||{}),$c(e,t)&&(this.computeRenderer=new Yc(e,t.compute,this.renderTargets,n)),this.subPassExecutions=(this.computeRenderer?t.steps.filter(e=>!t.compute.replacedPasses.includes(e.shaderPass.name)):t.steps).flatMap(e=>this.createStepExecutions(t,e,r));return}el(t,t.name),this.renderTargets={},this.subPassExecutions=this.createPassExecutions(t,{ownerName:t.name,flipY:r})}destroy(){this.computeRenderer?.destroy();for(let e of this.subPassExecutions)e.subPassRenderer.destroy();cl(this.renderTargets)}resize(e){ll(this.device,this.renderTargets,e)}runComputeOptimization(e){if(!this.computeRenderer)return;let t=this.resolveInputTexture(this.computeRenderer.optimization.input,e.originalTexture,e.previousTexture);this.computeRenderer.encode(e.commandEncoder,t,e.runtimeUniforms);for(let e of Object.values(this.computeRenderer.optimization.outputs))this.markTargetWritten(e)}resetHistory(){for(let e of Object.values(this.renderTargets))e.historyInitialized=!1,e.writtenThisFrame=!1}initializeHistoryTargets(e,t,n){for(let r of Object.values(this.renderTargets)){if(r.spec.lifetime!==`history`||r.historyInitialized)continue;let i=pl(r),a=r.spec.initialize||{clearColor:[0,0,0,0]};if(a===`original`){t.setProps({backgroundTexture:e}),t.predraw(n);let a=n.beginRenderPass({id:`${r.name}-initialize-history`,framebuffer:i,clearColor:[0,0,0,0],clearDepth:!1});t.draw(a),a.end()}else n.beginRenderPass({id:`${r.name}-clear-history`,framebuffer:i,clearColor:a.clearColor,clearDepth:!1}).end();r.historyInitialized=!0}}getOutputFramebuffer(e){return this.getRenderTarget(e).framebuffer}markTargetWritten(e){this.getRenderTarget(e).writtenThisFrame=!0}finishFrame(e){for(let t of Object.values(this.renderTargets)){if(e&&t.spec.lifetime===`history`&&t.writtenThisFrame){let e=fl(t),n=pl(t);t.historyTexture=t.texture,t.historyFramebuffer=t.framebuffer,t.texture=e,t.framebuffer=n,t.historyInitialized=!0}t.writtenThisFrame=!1}}getRenderTarget(e){let t=this.renderTargets[e];if(!t)throw Error(`${this.getOwnerName()}: unknown render target "${e}"`);return t}resolveBindings(e){let{execution:t,originalTexture:n,previousTexture:r,outputTexture:i,externalBindings:a}=e,o=t.inputs||{sourceTexture:`previous`},s=this.shaderInputs.getModuleBindingValues(t.shaderPass.name),c=Object.fromEntries(Object.entries(a).filter(([e])=>t.shaderPass.bindingLayout?.some(t=>t.name===e))),l={...s,...c},u=t.output||`previous`;for(let[e,a]of Object.entries(o)){if(!a)continue;let o=this.resolveInputTexture(a,n,r),s=a in this.renderTargets?this.renderTargets[a]:null;if(u!==`previous`&&a===u&&s?.spec.lifetime!==`history`)throw Error(`${t.ownerName}: subpass cannot read and write render target "${u}" in the same draw`);if(o===i)throw Error(`${t.ownerName}: subpass cannot sample from the render target it is writing to`);l[e]=o}return`sourceTexture`in l||(l.sourceTexture=r),l}createStepExecutions(e,t,n){return el(t.shaderPass,`${e.name}/${t.shaderPass.name}`),this.createPassExecutions(t.shaderPass,{ownerName:`${e.name}/${t.shaderPass.name}`,firstInputs:t.inputs,lastOutput:t.output,uniformOverrides:t.uniforms,flipY:n})}createPassExecutions(e,t){let n=e.passes||[];return n.map((r,i)=>{let a=i===0,o=i===n.length-1,s=a&&t.firstInputs!==void 0?t.firstInputs:r.inputs,c=o&&t.lastOutput!==void 0?t.lastOutput:r.output;return nl(t.ownerName,s,c,this.renderTargets),{ownerName:t.ownerName,shaderPass:e,subPassRenderer:new Xc(this.device,e,r,t.flipY),inputs:s,output:c,uniforms:rl(t.uniformOverrides,r.uniforms)}})}resolveInputTexture(e,t,n){switch(e){case`original`:return t;case`previous`:return n;default:{let t=this.getRenderTarget(e);return t.spec.lifetime===`history`&&!t.writtenThisFrame?fl(t):t.texture}}}getOwnerName(){return this.passDefinition.name}},Yc=class{optimization;renderTargets;shaderInputs;computation;parameterBuffer;constructor(e,t,n,r){this.optimization=t,this.renderTargets=n,this.shaderInputs=r,this.parameterBuffer=e.createBuffer({id:`${t.name}-parameters`,byteLength:Math.max(Math.ceil(t.uniformNames.length/4)*16,16),usage:g.UNIFORM|g.COPY_DST});let i=Object.entries(t.outputs).map(([e,t],r)=>({name:e,type:`storage`,group:0,location:r+2,access:`write-only`,format:n[t].texture.format}));try{this.computation=new M(e,{id:t.name,source:t.source,shaderLayout:{bindings:[{name:t.uniformBinding,type:`uniform`,group:0,location:0},{name:`sourceTexture`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},...i]}})}catch(e){throw this.parameterBuffer.destroy(),e}}encode(e,t,n){let r={...this.shaderInputs.getUniformValues()[this.optimization.uniformModule]||{},...this.optimization.uniforms,...n[this.optimization.uniformModule]||{}},i=new Float32Array(Math.max(Math.ceil(this.optimization.uniformNames.length/4)*4,4));for(let[e,t]of this.optimization.uniformNames.entries()){let n=r[t];i[e]=typeof n==`number`?n:0}this.parameterBuffer.write(i);let a=Object.entries(this.optimization.outputs),o={[this.optimization.uniformBinding]:this.parameterBuffer,sourceTexture:t.view};for(let[e,t]of a)o[e]=this.renderTargets[t].texture.view;this.computation.setBindings(o),this.computation.predraw(e);let s=this.renderTargets[a[0][1]].texture,c=e.beginComputePass({id:this.optimization.name});this.computation.dispatch(c,Math.ceil(s.width/this.optimization.workgroupSize[0]),Math.ceil(s.height/this.optimization.workgroupSize[1]),1),c.end()}destroy(){this.computation.destroy(),this.parameterBuffer.destroy()}},Xc=class{model;shaderPass;subPass;flipY;constructor(e,t,n,r){this.shaderPass=t,this.subPass=n,this.flipY=r;let i=Bc({shaderPass:t,action:n.action||n.filter&&`filter`||n.sampler&&`sample`||`filter`,shadingLanguage:e.info.shadingLanguage});this.model=new hc(e,{id:`${t.name}-subpass`,source:i,fs:i,modules:[Gc,t],parameters:{depthWriteEnabled:!1}})}destroy(){this.model.destroy()}prepare(e){let{commandEncoder:t,bindings:n,textureScale:r,uniforms:i}=e;this.model.shaderInputs.setProps({textureTransform:{scale:r,flipY:this.flipY?1:0}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:this.shaderPass.uniforms||{}}),this.model.shaderInputs.setProps({[this.shaderPass.name]:i||{}}),this.model.setBindings(n||{}),this.model.predraw(t)}draw(e){this.model.draw(e)}};function Zc(e){return e.flatMap(e=>Qc(e)?e.steps.map(e=>e.shaderPass):[e])}function Qc(e){return`steps`in e}function $c(e,t){let n=t.compute;if(!n||e.type!==`webgpu`)return!1;let r=Object.values(n.outputs);return r.length===0||r.length>e.limits.maxStorageTexturesPerShaderStage||n.workgroupSize[0]>e.limits.maxComputeWorkgroupSizeX||n.workgroupSize[1]>e.limits.maxComputeWorkgroupSizeY||n.workgroupSize[0]*n.workgroupSize[1]>e.limits.maxComputeInvocationsPerWorkgroup?!1:r.every(n=>{let r=t.renderTargets?.[n];if(!r?.storage)return!1;let i=r.format||e.preferredColorFormat;return e.getTextureFormatCapabilities(i).store})}function el(e,t){let n=e.renderTargets;if(n&&Object.keys(n).length>0)throw Error(`${t}: ShaderPass.renderTargets is not supported; use CompositeShaderPass.renderTargets instead`)}function tl(e,t){for(let n of Object.keys(t))if(Kc.has(n))throw Error(`${e}: render target name "${n}" is reserved`)}function nl(e,t,n,r){let i=t||{sourceTexture:`previous`};for(let t of Object.values(i))if(t&&t!==`original`&&t!==`previous`&&!(t in r))throw Error(`${e}: unknown input source "${t}"`);if(n&&n!==`previous`&&!(n in r))throw Error(`${e}: unknown output target "${n}"`)}function rl(e,t){if(!(!e&&!t))return{...e||{},...t||{}}}function il(e,t,n){return rl(rl(e.getUniformValues()[t.shaderPass.name],t.uniforms),n[t.shaderPass.name])}function al(e,t){let n=e.getCanvasContext().getDrawingBufferSize(),r={};for(let[i,a]of Object.entries(t)){if(a.aliasFor){let t=r[a.aliasFor];if(!t)throw Error(`${i}: target alias references an unknown earlier target`);let o=ml(n,a.scale),s=a.format||e.preferredColorFormat;if(a.lifetime===`history`||t.spec.lifetime===`history`||!ol(a,t.spec)||t.texture.width!==o[0]||t.texture.height!==o[1]||t.texture.format!==s||a.storage&&!t.spec.storage||!sl(a,t.spec))throw Error(`${i}: target alias must match a transient target's size, format, and sampler`);r[i]=t;continue}r[i]=ul(e,i,a,n)}return r}function ol(e,t){let n=e.scale||[1,1],r=t.scale||[1,1];return n[0]===r[0]&&n[1]===r[1]}function sl(e,t){let n=e.sampler||{},r=t.sampler||{},i=Object.entries(n);return i.length===Object.keys(r).length&&i.every(([e,t])=>r[e]===t)}function cl(e){for(let t of new Set(Object.values(e)))t.framebuffer.destroy(),t.texture.destroy(),t.historyFramebuffer?.destroy(),t.historyTexture?.destroy()}function ll(e,t,n){for(let r of new Set(Object.values(t))){let t=ml(n,r.spec.scale);if(r.texture.width===t[0]&&r.texture.height===t[1])continue;r.framebuffer.destroy(),r.texture.destroy(),r.historyFramebuffer?.destroy(),r.historyTexture?.destroy();let i=ul(e,r.name,r.spec,n);r.texture=i.texture,r.framebuffer=i.framebuffer,r.historyTexture=i.historyTexture,r.historyFramebuffer=i.historyFramebuffer,r.historyInitialized=!1,r.writtenThisFrame=!1}}function ul(e,t,n,r){let i=ml(r,n.scale),{texture:a,framebuffer:o}=dl(e,t,n,i),s,c;if(n.lifetime===`history`){let r=dl(e,`${t}-history`,n,i);s=r.texture,c=r.framebuffer}return{name:t,spec:n,texture:a,framebuffer:o,historyTexture:s,historyFramebuffer:c,historyInitialized:!1,writtenThisFrame:!1}}function dl(e,t,n,r){let i=e.createTexture({id:`${t}-texture`,width:r[0],height:r[1],format:n.format||e.preferredColorFormat,usage:p.SAMPLE|p.RENDER|p.COPY_SRC|p.COPY_DST|(n.storage&&e.type===`webgpu`&&e.getTextureFormatCapabilities(n.format||e.preferredColorFormat).store?p.STORAGE:0),...n.sampler?{sampler:n.sampler}:{}});return{texture:i,framebuffer:e.createFramebuffer({id:`${t}-framebuffer`,width:r[0],height:r[1],colorAttachments:[i]})}}function fl(e){if(!e.historyTexture)throw Error(`${e.name}: transient render target has no history texture`);return e.historyTexture}function pl(e){if(!e.historyFramebuffer)throw Error(`${e.name}: transient render target has no history framebuffer`);return e.historyFramebuffer}function ml(e,t=[1,1]){return[Math.max(1,Math.round(e[0]*t[0])),Math.max(1,Math.round(e[1]*t[1]))]}function hl(e){let t=e.colorAttachments[0]?.texture;if(!t)throw Error(`ShaderPassRenderer: framebuffer is missing a color attachment texture`);return t}function gl(e,t){return t===e.current?e.next:e.current}function _l(e,t){return hl(e.current)===t?e.next:e.current}function vl(e,t){let n=e.width/e.height,r=t.width/t.height;return r>n?[1,r/n]:[n/r,1]}var yl=class extends gn{constructor(e={}){let{innerRadius:t=.5,outerRadius:n=1,height:r=.2,segments:i=48,startAngle:a=0,angle:o=Math.PI*2}=e;y(Number.isFinite(t)&&t>=0&&Number.isFinite(n)&&n>t&&Number.isFinite(r)&&r>0&&Number.isFinite(a)&&Number.isFinite(o)&&o>0&&o<=Math.PI*2&&Number.isInteger(i)&&i>=3);let s=r/2,c=[[[n,-s],[n,s]],[[n,s],[t,s]],[[t,-s],[n,-s]]];t>0&&c.push([[t,s],[t,-s]]);let l=c.map(e=>new hn({points:e,segments:i,phiStart:a,phiLength:o}));if(o<Math.PI*2)for(let[e,i]of[a,a+o].entries()){let a=new ln({sizeX:n-t,sizeZ:r}),o=a.attributes.POSITION.value,s=a.attributes.NORMAL.value,c=Math.cos(i),u=Math.sin(i),d=e===0?1:-1;for(let e=0;e<o.length;e+=3){let r=Number(o[e])+(t+n)/2,i=-d*Number(o[e+2]);o[e]=r*c,o[e+1]=i,o[e+2]=-r*u,s[e]=d*u,s[e+1]=0,s[e+2]=d*c}l.push(a)}let u=[],d=[],f=[],p=[];for(let e of l){let t=u.length/3;for(let t of e.attributes.POSITION.value)u.push(t);for(let t of e.attributes.NORMAL.value)d.push(t);for(let t of e.attributes.TEXCOORD_0.value)f.push(t);for(let n of e.indices.value)p.push(Number(n)+t)}super({id:e.id,topology:`triangle-list`,indices:new Uint32Array(p),attributes:{POSITION:{size:3,value:new Float32Array(u)},NORMAL:{size:3,value:new Float32Array(d)},TEXCOORD_0:{size:2,value:new Float32Array(f)},...e.attributes}})}};function bl(e){let t=new be().set(1,0,0,0,1,0,e.offset[0],e.offset[1],1),n=new be().set(Math.cos(e.rotation),Math.sin(e.rotation),0,-Math.sin(e.rotation),Math.cos(e.rotation),0,0,0,1),r=new be().set(e.scale[0],0,0,0,e.scale[1],0,0,0,1);return Array.from(t.multiplyRight(n).multiplyRight(r))}var xl=`core-features-and-limits`,Sl=`maxTextureDimension1D.maxTextureDimension2D.maxTextureDimension3D.maxTextureArrayLayers.maxBindGroups.maxBindGroupsPlusVertexBuffers.maxBindingsPerBindGroup.maxDynamicUniformBuffersPerPipelineLayout.maxDynamicStorageBuffersPerPipelineLayout.maxSampledTexturesPerShaderStage.maxSamplersPerShaderStage.maxStorageBuffersPerShaderStage.maxStorageBuffersInVertexStage.maxStorageBuffersInFragmentStage.maxStorageTexturesPerShaderStage.maxStorageTexturesInVertexStage.maxStorageTexturesInFragmentStage.maxUniformBuffersPerShaderStage.maxUniformBufferBindingSize.maxStorageBufferBindingSize.minUniformBufferOffsetAlignment.minStorageBufferOffsetAlignment.maxVertexBuffers.maxBufferSize.maxVertexAttributes.maxVertexBufferArrayStride.maxInterStageShaderVariables.maxColorAttachments.maxColorAttachmentBytesPerSample.maxComputeWorkgroupStorageSize.maxComputeInvocationsPerWorkgroup.maxComputeWorkgroupSizeX.maxComputeWorkgroupSizeY.maxComputeWorkgroupSizeZ.maxComputeWorkgroupsPerDimension.maxImmediateSize`.split(`.`);function Cl(e){let t={};for(let n of Sl){let r=e[n];typeof r==`number`&&(t[n]=r)}return t}function wl(e){return e.featureLevel??`core`}function Tl(e){let t=wl(e),n={featureLevel:t===`compatibility`||t===`best-available`?`compatibility`:`core`};return e.powerPreference&&e.powerPreference!==`default`&&(n.powerPreference=e.powerPreference),e.xrCompatible&&(n.xrCompatible=!0),n}function El(e,t,n=[]){if(t===`max`)return Array.from(e);let r=[];t===`best-available`&&e.has(xl)&&r.push(xl);for(let t of n){let n=t;e.has(n)&&!r.includes(n)&&r.push(n)}return r}function Dl(e,t){return(e===`compatibility`||e===`best-available`)&&t.has(xl)?`core`:e===`best-available`?`compatibility`:e}function Ol(e,t){return e===`core`?`core`:Dl(`compatibility`,t)}var kl=new class extends yt{type=`webgpu`;isSupported(){return!!(typeof navigator<`u`&&navigator.gpu)}isDeviceHandle(e){return!!(typeof GPUDevice<`u`&&e instanceof GPUDevice||e?.queue)}async create(e){return await this._create(e,!0)}async _create(e,t){if(typeof navigator>`u`||!navigator.gpu)throw Error(`WebGPU is not available`);let n=wl(e),r=Tl(e),i;try{i=await this.requestGPUAdapter(r)}catch(e){throw Error(`WebGPU adapter request failed`,{cause:e})}if(!i)throw Error(`Failed to request WebGPU adapter`);let a=await Al(i),s={},c=El(i.features,n,e.optionalFeatures);c.length>0&&(s.requiredFeatures=c);let l={...n===`max`?Cl(i.limits):{},...e.requiredLimits};Object.keys(l).length>0&&(s.requiredLimits=l);let u;try{u=await i.requestDevice(s)}catch(e){throw Error(`WebGPU device request failed`,{cause:e})}let d=await jl(u);if(d){if(u.destroy(),t&&d.reason!==`destroyed`)return o.warn(`WebGPU device was returned already lost; retrying with a fresh adapter`)(),await this._create(e,!1);throw Error(`WebGPU device was returned already lost${d.message?`: ${d.message}`:``}`,{cause:d})}let{WebGPUDevice:f}=await Be(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-Bq0M0PD0.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),p=Dl(n,u.features),m={...e,featureLevel:p};o.groupCollapsed(1,`WebGPUDevice created`)();try{let e;try{e=new f(m,u,i,a)}catch(e){throw u.destroy(),Error(`WebGPU wrapper initialization failed`,{cause:e})}let t=f.getCanvasContextProps(m);if(t)try{e.initializeCanvasContext(t)}catch(t){throw e.destroy(),Error(`WebGPU canvas initialization failed`,{cause:t})}return o.probe(1,`Device created. For more info, set chrome://flags/#enable-webgpu-developer-features`)(),o.table(1,e.info)(),e}finally{o.groupEnd(1)()}}async attach(e,t={}){let{WebGPUDevice:n}=await Be(async()=>{let{WebGPUDevice:e}=await import(`./webgpu-device-Bq0M0PD0.js`);return{WebGPUDevice:e}},__vite__mapDeps([0,1,2,3,4]),import.meta.url);if(e instanceof n)return e;if(!this.isDeviceHandle(e))throw Error(`Invalid GPUDevice`);let r=n.getDeviceFromHandle(e);if(r)return r;let i=await jl(e);if(i)throw Error(`WebGPU device is already lost`,{cause:i});let a=n.getDeviceFromHandle(e);if(a)return a;let o=e.adapterInfo||{},s=Ol(t.featureLevel,e.features),c={...t,featureLevel:s,_handle:e},l=new n(c,e,null,o,!1),u=n.getCanvasContextProps(c);if(u)try{l.initializeCanvasContext(u)}catch(e){throw l.destroy(),Error(`WebGPU canvas initialization failed`,{cause:e})}return l}requestGPUAdapter(e){return navigator.gpu.requestAdapter(e)}};async function Al(e){try{return e.info||await e.requestAdapterInfo?.()||{}}catch(e){return o.warn(`WebGPU adapter metadata is unavailable`,e)(),{}}}async function jl(e){return await Promise.race([e.lost,Promise.resolve(null)])}var Ml={WEBGL_depth_texture:{UNSIGNED_INT_24_8_WEBGL:E.UNSIGNED_INT_24_8},OES_element_index_uint:{},OES_texture_float:{},OES_texture_half_float:{HALF_FLOAT_OES:E.HALF_FLOAT},EXT_color_buffer_float:{},OES_standard_derivatives:{FRAGMENT_SHADER_DERIVATIVE_HINT_OES:E.FRAGMENT_SHADER_DERIVATIVE_HINT},EXT_frag_depth:{},EXT_blend_minmax:{MIN_EXT:E.MIN,MAX_EXT:E.MAX},EXT_shader_texture_lod:{}},Nl=e=>({drawBuffersWEBGL(t){return e.drawBuffers(t)},COLOR_ATTACHMENT0_WEBGL:E.COLOR_ATTACHMENT0,COLOR_ATTACHMENT1_WEBGL:E.COLOR_ATTACHMENT1,COLOR_ATTACHMENT2_WEBGL:E.COLOR_ATTACHMENT2,COLOR_ATTACHMENT3_WEBGL:E.COLOR_ATTACHMENT3}),Pl=e=>({VERTEX_ARRAY_BINDING_OES:E.VERTEX_ARRAY_BINDING,createVertexArrayOES(){return e.createVertexArray()},deleteVertexArrayOES(t){return e.deleteVertexArray(t)},isVertexArrayOES(t){return e.isVertexArray(t)},bindVertexArrayOES(t){return e.bindVertexArray(t)}}),Fl=e=>({VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE:35070,drawArraysInstancedANGLE(...t){return e.drawArraysInstanced(...t)},drawElementsInstancedANGLE(...t){return e.drawElementsInstanced(...t)},vertexAttribDivisorANGLE(...t){return e.vertexAttribDivisor(...t)}});function Il(e=!0){let t=HTMLCanvasElement.prototype;if(!e&&t.originalGetContext){t.getContext=t.originalGetContext,t.originalGetContext=void 0;return}t.originalGetContext=t.getContext,t.getContext=function(e,t){if(e===`webgl`||e===`experimental-webgl`){let e=this.originalGetContext(`webgl2`,t);return e instanceof HTMLElement&&Ll(e),e}return this.originalGetContext(e,t)}}function Ll(e){e.getExtension(`EXT_color_buffer_float`);let t={...Ml,WEBGL_disjoint_timer_query:e.getExtension(`EXT_disjoint_timer_query_webgl2`),WEBGL_draw_buffers:Nl(e),OES_vertex_array_object:Pl(e),ANGLE_instanced_arrays:Fl(e)},n=e.getExtension.bind(e);e.getExtension=function(e){return n(e)||(e in t?t[e]:null)};let r=e.getSupportedExtensions;e.getSupportedExtensions=function(){return(r.apply(e)||[])?.concat(Object.keys(t))}}var Rl=1,zl=class extends yt{type=`webgl`;enforceWebGL2(e){Il(e)}isSupported(){return typeof WebGL2RenderingContext<`u`}isDeviceHandle(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:(typeof WebGLRenderingContext<`u`&&e instanceof WebGLRenderingContext&&o.warn(`WebGL1 is not supported`,e)(),!1)}async attach(e,t={}){let{WebGLDevice:n}=await Be(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-rmtBGSY7.js`);return{WebGLDevice:e}},__vite__mapDeps([5,1,2,6,3]),import.meta.url);if(e instanceof n)return e;let r=n.getDeviceFromContext(e);if(r)return r;if(!Bl(e))throw Error(`Invalid WebGL2RenderingContext`);t=Hl(t),await Ul(t);let i=t.createCanvasContext===!0?{}:t.createCanvasContext;return new n({...t,_handle:e,createCanvasContext:{canvas:e.canvas,autoResize:!1,...i}})}async create(e={}){let{WebGLDevice:t}=await Be(async()=>{let{WebGLDevice:e}=await import(`./webgl-device-rmtBGSY7.js`);return{WebGLDevice:e}},__vite__mapDeps([5,1,2,6,3]),import.meta.url);e=Hl(e),await Ul(e);try{let n=new t(e);o.groupCollapsed(Rl,`WebGLDevice ${n.id} created`)();let r=`\
${n._reused?`Reusing`:`Created`} device with WebGL2 ${n.props.debug?`debug `:``}context: \
${n.info.vendor}, ${n.info.renderer} for canvas: ${n.canvasContext.id}`;return o.probe(Rl,r)(),o.table(Rl,n.info)(),n}finally{o.groupEnd(Rl)(),o.info(Rl,`%cWebGL call tracing: luma.log.set('debug-webgl') `,`color: white; background: blue; padding: 2px 6px; border-radius: 3px;`)()}}};function Bl(e){return typeof WebGL2RenderingContext<`u`&&e instanceof WebGL2RenderingContext?!0:!!(e&&typeof e.createVertexArray==`function`)}var Vl=new zl;function Hl(e){return{...e,debug:e.debug??m.defaultProps.debug,debugWebGL:e.debugWebGL??m.defaultProps.debugWebGL,debugSpectorJS:e.debugSpectorJS??!!o.get(`debug-spectorjs`)}}async function Ul(e){let t=[];(e.debugWebGL||e.debug)&&t.push(oe()),e.debugSpectorJS&&t.push(ie(e));let n=await Promise.allSettled(t);for(let e of n)e.status===`rejected`&&o.error(`Failed to initialize debug libraries ${e.reason}`)()}var Wl=0,N=class{device;type;subtype;id;version=0;pendingParameters;committedParameters={};constructor(e,t,n,r={}){this.device=e,this.type=t,this.subtype=n,this.id=`${t}-${++Wl}`,this.pendingParameters={...r},this.commitParameters()}setParameter(e,t){return this.pendingParameters[e]=t,this}setParameters(e){return Object.assign(this.pendingParameters,e),this}unsetParameter(e){return delete this.pendingParameters[e],this}getParameter(e){return this.committedParameters[e]}getParameters(){return this.committedParameters}commitParameters(){let e=this.committedParameters;this.committedParameters={...this.pendingParameters},this.version++;let t=this.type===`instance`&&Reflect.get(e,`group`)!==Reflect.get(this.committedParameters,`group`);return this.device.recordSceneObjectCommit(this.type,this.id,t),this}},P=class extends N{constructor(e,t){super(e,`array`,`array1D`,t)}get data(){return this.getParameter(`data`)}get length(){return this.data.length}},Gl=class extends N{constructor(e,t,n={}){super(e,`geometry`,t,n)}},Kl=class extends N{constructor(e,t,n={}){super(e,`material`,t,n)}},ql=class extends N{constructor(e,t,n){super(e,`sampler`,t,n)}},Jl=class extends N{constructor(e,t){super(e,`surface`,`default`,t)}},Yl=class extends N{constructor(e,t={}){super(e,`group`,`default`,t)}},Xl=class extends N{constructor(e,t){super(e,`instance`,`transform`,t)}},Zl=class extends N{constructor(e,t={}){super(e,`world`,`default`,t)}},Ql=class extends N{constructor(e,t,n={}){super(e,`light`,t,n)}},$l=class extends N{constructor(e,t,n={}){super(e,`camera`,t,n)}},eu=class extends N{constructor(e,t,n={}){super(e,`renderer`,t,n)}},tu=class extends N{statistics={surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};constructor(e,t){super(e,`frame`,`default`,t)}render(){return this.statistics=this.device.renderFrame(this),this.statistics}captureChannels(){return this.device.captureFrameChannels(this)}pick(e,t){return this.device.pickFrame(this,e,t)}destroy(){this.device.destroyFrame(this)}};function nu(e){return new ac(e,{modules:[yo]})}function ru(e,t={}){let n=t.factory||nu(e),r={};for(let[e,i]of Object.entries(t.bindings||{}))i&&n.ownsBinding(e)&&(r[e]=i);let i=n.createMaterial({id:t.id,bindings:r});return i.setProps({pbrMaterial:{...iu(r),...t.uniforms}}),i}function iu(e){return{baseColorMapEnabled:!!e.pbr_baseColorSampler,normalMapEnabled:!!e.pbr_normalSampler,emissiveMapEnabled:!!e.pbr_emissiveSampler,metallicRoughnessMapEnabled:!!e.pbr_metallicRoughnessSampler,occlusionMapEnabled:!!e.pbr_occlusionSampler,specularColorMapEnabled:!!e.pbr_specularColorSampler,specularIntensityMapEnabled:!!e.pbr_specularIntensitySampler,transmissionMapEnabled:!!e.pbr_transmissionSampler,clearcoatMapEnabled:!!e.pbr_clearcoatSampler,clearcoatRoughnessMapEnabled:!!e.pbr_clearcoatRoughnessSampler,sheenColorMapEnabled:!!e.pbr_sheenColorSampler,sheenRoughnessMapEnabled:!!e.pbr_sheenRoughnessSampler,iridescenceMapEnabled:!!e.pbr_iridescenceSampler,anisotropyMapEnabled:!!e.pbr_anisotropySampler,bumpMapEnabled:!!e.pbr_bumpSampler,diffuseTransmissionMapEnabled:!!e.pbr_diffuseTransmissionSampler,diffuseTransmissionColorMapEnabled:!!e.pbr_diffuseTransmissionColorSampler,multiscatterColorMapEnabled:!!e.pbr_multiscatterColorSampler}}var au=`
struct ScenePBRVertexInputs {
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
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  @location(7) colors: vec4f,
#else
  @location(7) colors: vec3f,
#endif
#endif
#ifdef USE_SCENE_INSTANCES
  @location(12) instanceMetadata: vec4u,
#endif
#ifdef HAS_INSTANCING
  @location(8) instanceModelMatrixCol0: vec4f,
  @location(9) instanceModelMatrixCol1: vec4f,
  @location(10) instanceModelMatrixCol2: vec4f,
  @location(11) instanceModelMatrixCol3: vec4f,
#endif
};

struct ScenePBRFragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) pbrPosition: vec3f,
  @location(1) pbrUV0: vec2f,
  @location(2) pbrUV1: vec2f,
  @location(3) pbrNormal: vec3f,
  @location(4) pbrColor: vec4f,
#ifdef USE_SCENE_INSTANCES
  @location(6) @interpolate(flat) instanceIdentifier: u32,
#endif
#ifdef HAS_TANGENTS
  @location(5) pbrTangent: vec4f,
#endif
};

fn getPBRInstanceNormalMatrix(matrix: mat3x3f) -> mat3x3f {
  let firstCofactor = cross(matrix[1], matrix[2]);
  let inverseDeterminant = 1.0 / dot(matrix[0], firstCofactor);
  return mat3x3f(
    firstCofactor,
    cross(matrix[2], matrix[0]),
    cross(matrix[0], matrix[1])
  ) * inverseDeterminant;
}

@vertex
fn vertexMain(inputs: ScenePBRVertexInputs) -> ScenePBRFragmentInputs {
  var outputs: ScenePBRFragmentInputs;
  var position = vec4f(inputs.positions, 1.0);
  var normal = vec3f(0.0, 0.0, 1.0);
  var tangent = vec4f(1.0, 0.0, 0.0, 1.0);
  var textureCoordinates = vec2f(0.0);
  var secondTextureCoordinates = vec2f(0.0);
  var vertexColor = vec4f(1.0);

#ifdef HAS_NORMALS
  normal = inputs.normals;
#endif
#ifdef HAS_UV
  textureCoordinates = inputs.texCoords;
#endif
#ifdef HAS_UV_1
  secondTextureCoordinates = inputs.texCoords1;
#endif
#ifdef HAS_TANGENTS
  tangent = inputs.TANGENT;
#endif
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  vertexColor = inputs.colors;
#else
  vertexColor = vec4f(inputs.colors, 1.0);
#endif
#endif

#ifdef HAS_SKIN
  let skinMatrix = getSkinMatrix(inputs.WEIGHTS_0, inputs.JOINTS_0);
  position = skinMatrix * position;
  normal = normalize((skinMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((skinMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
#endif

#ifdef HAS_INSTANCING
  var instanceMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
#ifdef HAS_GPU_TRANSFORMS
  let metadata = inputs.instanceMetadata;
  if (metadata.y != 0xffffffffu) {
    let first = sceneWorldMatrices[metadata.x][3].xyz;
    let second = sceneWorldMatrices[metadata.y][3].xyz;
    let displacement = second - first;
    let direction = select(displacement / max(length(displacement), 0.000001), vec3f(0, 0, 1), length(displacement) < 0.000001);
    let reference = select(vec3f(0, 1, 0), vec3f(1, 0, 0), abs(direction.y) > 0.9);
    let tangent = normalize(cross(direction, reference));
    let radius = bitcast<f32>(metadata.w);
    instanceMatrix = mat4x4f(vec4f(tangent * radius, 0),
      vec4f(cross(direction, tangent) * radius, 0),
      vec4f(direction * max(length(displacement), 0.000001) * 0.5, 0), vec4f((first + second) * 0.5, 1));
  } else {
    instanceMatrix = sceneWorldMatrices[metadata.x] * instanceMatrix;
  }
#endif
  let worldPosition = instanceMatrix * position;
  let normalMatrix = getPBRInstanceNormalMatrix(mat3x3f(
    instanceMatrix[0].xyz,
    instanceMatrix[1].xyz,
    instanceMatrix[2].xyz
  ));
  normal = normalize(normalMatrix * normal);
#ifdef HAS_TANGENTS
  tangent = vec4f(normalize((instanceMatrix * vec4f(tangent.xyz, 0.0)).xyz), tangent.w);
#endif
  outputs.position = pbrProjection.modelViewProjectionMatrix * worldPosition;
#else
  let worldPosition = pbrProjection.modelMatrix * position;
  normal = normalize((pbrProjection.normalMatrix * vec4f(normal, 0.0)).xyz);
#ifdef HAS_TANGENTS
  tangent = vec4f(
    normalize((pbrProjection.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz),
    tangent.w
  );
#endif
  outputs.position = pbrProjection.modelViewProjectionMatrix * position;
#endif

#ifdef USE_SCENE_INSTANCES
  outputs.instanceIdentifier = inputs.instanceMetadata.z;
#endif
  outputs.pbrPosition = worldPosition.xyz / worldPosition.w;
  outputs.pbrUV0 = textureCoordinates;
  outputs.pbrUV1 = secondTextureCoordinates;
  outputs.pbrNormal = normal;
  outputs.pbrColor = vertexColor;
#ifdef HAS_TANGENTS
  outputs.pbrTangent = tangent;
#endif
  return outputs;
}

// Depth, shadow and picking must use the visible material's alpha cutoff and UV transform.
fn sceneDiscardMaskedFragment(inputs: ScenePBRFragmentInputs) {
#ifdef ALPHA_CUTOFF
  var alpha = pbrMaterial.baseColorFactor.a * inputs.pbrColor.a;
#ifdef HAS_BASECOLORMAP
  let coordinates = getMaterialUV(pbrMaterial.baseColorUVSet, pbrMaterial.baseColorUVTransform);
  alpha *= textureSample(pbr_baseColorSampler, pbr_baseColorSamplerSampler, coordinates).a;
#endif
  if (alpha < pbrMaterial.alphaCutoff) {discard;}
#endif
}

#ifdef SCENE_DEPTH_PASS
@fragment
fn fragmentMain(inputs: ScenePBRFragmentInputs) {
#else
@fragment
fn fragmentMain(inputs: ScenePBRFragmentInputs) -> @location(0) vec4f {
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
#ifndef SCENE_DEPTH_PASS
#ifndef SCENE_PICK_PASS
#ifdef DEBUG_NORMALS
  return vec4f(normalize(inputs.pbrNormal) * 0.5 + vec3f(0.5), 1.0);
#endif
#ifdef DEBUG_DEPTH
  return vec4f(vec3f(inputs.position.z), 1.0);
#endif
#endif
#endif
#ifdef SCENE_DEPTH_PASS
  sceneDiscardMaskedFragment(inputs);
#else
#ifdef SCENE_PICK_PASS
  sceneDiscardMaskedFragment(inputs);
  let identifier = inputs.instanceIdentifier;
  return vec4f(f32(identifier & 255u), f32((identifier >> 8u) & 255u),
    f32((identifier >> 16u) & 255u), 255.0) / 255.0;
#else
#ifdef USE_SCENE_SHADOWS
  let normal = normalize(inputs.pbrNormal);
  let visibility = vec4f(
    shadow_getSpotFactor(0, inputs.pbrPosition, normal),
    shadow_getSpotFactor(1, inputs.pbrPosition, normal),
    shadow_getSpotFactor(2, inputs.pbrPosition, normal),
    shadow_getSpotFactor(3, inputs.pbrPosition, normal));
  return pbr_filterColorWithSpotShadows(inputs.pbrColor, visibility);
#else
  return pbr_filterColor(inputs.pbrColor);
#endif
#endif
#endif
}
`,ou=`#version 300 es
in vec3 positions;
#ifdef HAS_NORMALS
in vec3 normals;
#endif
#ifdef HAS_TANGENTS
in vec4 TANGENT;
#endif
#ifdef HAS_UV
in vec2 texCoords;
#endif
#ifdef HAS_UV_1
in vec2 texCoords1;
#endif
#ifdef HAS_SKIN
in uvec4 JOINTS_0;
in vec4 WEIGHTS_0;
#endif
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
in vec4 colors;
#else
in vec3 colors;
#endif
#endif
#ifdef HAS_INSTANCING
in vec4 instanceModelMatrixCol0;
in vec4 instanceModelMatrixCol1;
in vec4 instanceModelMatrixCol2;
in vec4 instanceModelMatrixCol3;
#endif
out vec4 sceneVertexColor;

void main(void) {
  vec4 position = vec4(positions, 1.0);
  vec4 normal = vec4(0.0, 0.0, 1.0, 0.0);
  vec4 tangent = vec4(1.0, 0.0, 0.0, 1.0);
  vec2 textureCoordinates = vec2(0.0);
  vec2 secondTextureCoordinates = vec2(0.0);
  sceneVertexColor = vec4(1.0);

#ifdef HAS_NORMALS
  normal = vec4(normals, 0.0);
#endif
#ifdef HAS_TANGENTS
  tangent = TANGENT;
#endif
#ifdef HAS_UV
  textureCoordinates = texCoords;
#endif
#ifdef HAS_UV_1
  secondTextureCoordinates = texCoords1;
#endif
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  sceneVertexColor = colors;
#else
  sceneVertexColor = vec4(colors, 1.0);
#endif
#endif

#ifdef HAS_SKIN
  mat4 skinMatrix = getSkinMatrix(WEIGHTS_0, JOINTS_0);
  position = skinMatrix * position;
  normal = skinMatrix * normal;
  tangent = vec4((skinMatrix * vec4(tangent.xyz, 0.0)).xyz, tangent.w);
#endif

#ifdef HAS_INSTANCING
  mat4 instanceMatrix = mat4(
    instanceModelMatrixCol0,
    instanceModelMatrixCol1,
    instanceModelMatrixCol2,
    instanceModelMatrixCol3
  );
  position = instanceMatrix * position;
  normal = vec4(normalize(transpose(inverse(mat3(instanceMatrix))) * normal.xyz), 0.0);
  tangent = vec4(normalize(mat3(instanceMatrix) * tangent.xyz), tangent.w);
#endif

  pbr_setPositionNormalTangentUV(
    position,
    normal,
    tangent,
    textureCoordinates,
    secondTextureCoordinates
  );
  gl_Position = pbrProjection.modelViewProjectionMatrix * position;
}
`,su=`#version 300 es
in vec4 sceneVertexColor;
out vec4 fragmentColor;

void main(void) {
#ifdef DEBUG_NORMALS
#ifdef HAS_TANGENTS
  fragmentColor = vec4(normalize(pbr_vTBN[2]) * 0.5 + 0.5, 1.0);
#else
#ifdef HAS_NORMALS
  fragmentColor = vec4(normalize(pbr_vNormal) * 0.5 + 0.5, 1.0);
#else
  fragmentColor = vec4(0.5, 0.5, 1.0, 1.0);
#endif
#endif
#else
#ifdef DEBUG_DEPTH
  fragmentColor = vec4(vec3(gl_FragCoord.z), 1.0);
#else
  fragmentColor = pbr_filterColor(sceneVertexColor);
#endif
#endif
}
`;function cu(e,t){let n=[vo,yo,...t.modules||[]],r=n.filter((e,t)=>n.findIndex(t=>t.name===e.name)===t),i=lu(t.geometry);return(t.defines?.HAS_SKIN??i.HAS_SKIN)&&!r.some(e=>e.name===za.name)&&r.push(za),new ic(e,{source:au,vs:ou,fs:su,...t,modules:r,defines:{...i,...uu(t.material.getResourceBindings()),...t.defines}})}function lu(e){let t=e&&`attributes`in e?e.attributes:{},n=t.COLOR_0||t.colors;return{HAS_NORMALS:!!(t.NORMAL||t.normals),HAS_TANGENTS:!!(t.TANGENT||t.tangents),HAS_UV:!!(t.TEXCOORD_0||t.texCoords),HAS_UV_1:!!(t.TEXCOORD_1||t.texCoords1),HAS_SKIN:!!(t.JOINTS_0&&t.WEIGHTS_0),HAS_COLORS:!!n,HAS_RGBA_COLORS:!!(n&&`size`in n&&n.size===4)}}function uu(e){return{HAS_BASECOLORMAP:!!e.pbr_baseColorSampler,HAS_NORMALMAP:!!e.pbr_normalSampler,HAS_EMISSIVEMAP:!!e.pbr_emissiveSampler,HAS_METALROUGHNESSMAP:!!e.pbr_metallicRoughnessSampler,HAS_OCCLUSIONMAP:!!e.pbr_occlusionSampler,HAS_SPECULARCOLORMAP:!!e.pbr_specularColorSampler,HAS_SPECULARINTENSITYMAP:!!e.pbr_specularIntensitySampler,HAS_TRANSMISSIONMAP:!!e.pbr_transmissionSampler,HAS_THICKNESSMAP:!!e.pbr_thicknessSampler,HAS_CLEARCOATMAP:!!e.pbr_clearcoatSampler,HAS_CLEARCOATROUGHNESSMAP:!!e.pbr_clearcoatRoughnessSampler,HAS_CLEARCOATNORMALMAP:!!e.pbr_clearcoatNormalSampler,HAS_SHEENCOLORMAP:!!e.pbr_sheenColorSampler,HAS_SHEENROUGHNESSMAP:!!e.pbr_sheenRoughnessSampler,HAS_IRIDESCENCEMAP:!!e.pbr_iridescenceSampler,HAS_IRIDESCENCETHICKNESSMAP:!!e.pbr_iridescenceThicknessSampler,HAS_ANISOTROPYMAP:!!e.pbr_anisotropySampler,HAS_BUMPMAP:!!e.pbr_bumpSampler,HAS_DIFFUSETRANSMISSIONMAP:!!e.pbr_diffuseTransmissionSampler,HAS_DIFFUSETRANSMISSIONCOLORMAP:!!e.pbr_diffuseTransmissionColorSampler,HAS_MULTISCATTERCOLORMAP:!!e.pbr_multiscatterColorSampler}}var du={name:`sceneInstances`,source:`
#ifdef HAS_GPU_TRANSFORMS
@group(0) @binding(auto) var<storage,read> sceneWorldMatrices:array<mat4x4f>;
#endif
`,bindingLayout:[{name:`sceneWorldMatrices`,group:0}]},fu=class extends Pc{material;environment;connection;constructor(e){super(e),this.material=e.material,this.environment=e.environment,this.connection=e.connection}},pu=class{identifiers=new Map;nextIdentifier=1;used=new Set;getIdentifier(e){this.used.add(e);let t=this.identifiers.get(e);return t===void 0&&(t=this.nextIdentifier++,this.identifiers.set(e,t)),t}getSurfaces(e){this.used.clear();let t=new Map,n=new Set,r=[{node:e,matrix:new D,frame:null,visible:!0}];for(;r.length;){let e=r.pop(),{node:i}=e;y(!n.has(i)),n.add(i);let a=new D(e.matrix).multiplyRight(i.matrix),o=i instanceof Nc&&i.transformSource?i.transformSource.getFrame():e.frame,s=o?.bindings.get(i),c=e.visible&&i.display&&s?.visible!==!1;if(i instanceof Nc)for(let e=i.children.length-1;e>=0;e--)r.push({node:i.children[e],matrix:a,frame:o,visible:c});else if(i instanceof fu&&c){if(i.connection&&!o)continue;let e=!!(o&&(s||i.connection)),n=[this.getIdentifier(i.geometry),this.getIdentifier(i.material),i.environment?this.getIdentifier(i.environment):0,e?this.getIdentifier(o.matrices):0,_d(i.material)===`BLEND`?this.getIdentifier(i):0].join(`-`),r=t.get(n);if(r||(r={id:n,geometry:i.geometry,material:i.material,transforms:[],nodes:[],environment:i.environment,...e?{gpuTransforms:{matrices:o.matrices,matrixCount:o.matrixCount,revision:o.revision,indices:[],connections:[]}}:{}},t.set(n,r)),r.transforms.push(s?new D(s.localMatrix):a),r.nodes.push(i),e){let e=i.connection?.first??s.matrixIndex,t=i.connection?.second;y(Number.isInteger(e)&&e>=0&&e<o.matrixCount),y(t===void 0||Number.isInteger(t)&&t>=0&&t<o.matrixCount),r.gpuTransforms.indices.push(e),r.gpuTransforms.connections.push(i.connection)}}else if(c&&!(i instanceof fu)&&`model`in i)throw Error(`SceneRenderer scene traversal requires SceneMeshNode for renderable leaves`)}for(let e of this.identifiers.keys())this.used.has(e)||this.identifiers.delete(e);return Array.from(t.values())}destroy(){this.identifiers.clear(),this.used.clear()}},mu=Object.freeze({low:Object.freeze({cascadeCount:3,directionalMapSize:1024,spotMapSize:512,pointMapSize:256,blockerSampleCount:8,filterSampleCount:12,contactScale:.5,contactStepCount:12}),balanced:Object.freeze({cascadeCount:4,directionalMapSize:1536,spotMapSize:1024,pointMapSize:512,blockerSampleCount:16,filterSampleCount:24,contactScale:.75,contactStepCount:24}),cinematic:Object.freeze({cascadeCount:4,directionalMapSize:2048,spotMapSize:2048,pointMapSize:1024,blockerSampleCount:24,filterSampleCount:48,contactScale:1,contactStepCount:40})}),hu=1,gu=4,_u=4,vu=4,yu=6,bu=.1,xu=[1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1],Su=[1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],Cu=[{face:`+X`,direction:[1,0,0],up:[0,-1,0]},{face:`-X`,direction:[-1,0,0],up:[0,-1,0]},{face:`+Y`,direction:[0,1,0],up:[0,0,1]},{face:`-Y`,direction:[0,-1,0],up:[0,0,-1]},{face:`+Z`,direction:[0,0,1],up:[0,-1,0]},{face:`-Z`,direction:[0,0,-1],up:[0,-1,0]}],wu=0,Tu=class{device;props;inputProps;resources;destroyed=!1;constructor(e,t={}){if(e.type!==`webgpu`&&e.type!==`webgl`)throw Error(`ShadowMapRenderer requires a WebGPU or WebGL2 device.`);this.device=e,this.inputProps={...t},this.props=Au(e,this.inputProps),this.resources=ju(e,this.props)}setProps(e){this.assertNotDestroyed();let t={...this.inputProps,...e},n=Au(this.device,t),r=!Fu(this.props,n);if(this.inputProps=t,this.props=n,!r)return;let i=this.resources;this.resources=ju(this.device,n),Pu(i)}render(e){this.assertNotDestroyed(),Bu(e.camera);let t=e.directionalLights||[],n=e.spotLights||[],r=e.pointLights||[];Uu(`directional`,t.length,this.props.directionalLightCapacity),Uu(`spot`,n.length,this.props.spotLightCapacity),Uu(`point`,r.length,this.props.pointLightCapacity);let i=[],a=Gu([],e.camera.far);if(t[0]){let n=Iu(t[0],e.camera);a=Gu(Eu(e.camera.near,n.shadowDistance,this.props.cascadeCount,n.cascadeSplitLambda),n.shadowDistance),i.push(...Du(e.camera,n,a,this.props.cascadeCount,this.props.directionalMapSize)),i.forEach((t,r)=>{this.renderView({framebuffer:this.resources.directionalFramebuffers[r],view:t,type:`directional`,lightIndex:0,cascadeIndex:r,mapSize:this.props.directionalMapSize,light:n,drawShadowCasters:e.drawShadowCasters,prepareShadowCasters:e.prepareShadowCasters})})}let o=n.map(e=>Ou(Lu(e)));o.forEach((t,r)=>{this.renderView({framebuffer:this.resources.spotFramebuffers[r],view:t,type:`spot`,lightIndex:r,mapSize:this.props.spotMapSize,light:Lu(n[r]),drawShadowCasters:e.drawShadowCasters,prepareShadowCasters:e.prepareShadowCasters})});let s=r.flatMap(e=>ku(Ru(e)));return r.forEach((t,n)=>{let r=Ru(t);for(let t=0;t<yu;t++){let i=n*yu+t;this.renderView({framebuffer:this.resources.pointFramebuffers[i],view:s[i],type:`point`,lightIndex:n,pointFace:Cu[t].face,mapSize:this.props.pointMapSize,light:r,drawShadowCasters:e.drawShadowCasters,prepareShadowCasters:e.prepareShadowCasters})}}),{quality:this.props.quality,cascadeCount:this.props.cascadeCount,cascadeSplits:a,blockerSampleCount:this.props.blockerSampleCount,filterSampleCount:this.props.filterSampleCount,directionalLights:t.map(t=>Iu(t,e.camera)),spotLights:n.map(Lu),pointLights:r.map(Ru),directionalViewProjectionMatrices:Ku(i.map(e=>e.viewProjectionMatrix),vu),spotViewProjectionMatrices:Ku(o.map(e=>e.viewProjectionMatrix),gu),pointViewProjectionMatrices:Ku(s.map(e=>e.viewProjectionMatrix),_u*yu),directionalShadowTexture:this.resources.directionalTexture,spotShadowTexture:this.resources.spotTexture,pointShadowTexture:this.resources.pointTexture,comparisonSampler:this.resources.comparisonSampler,nonFilteringSampler:this.resources.nonFilteringSampler}}destroy(){this.destroyed||(this.destroyed=!0,Pu(this.resources))}renderView(e){let t=Object.freeze({depthWriteEnabled:!0,depthCompare:`less-equal`,depthBias:e.light.depthBias,depthBiasSlopeScale:e.light.depthBiasSlopeScale,cullMode:`back`}),n={framebuffer:e.framebuffer,type:e.type,lightIndex:e.lightIndex,cascadeIndex:e.cascadeIndex,pointFace:e.pointFace,camera:e.view.camera,viewProjectionMatrix:e.view.viewProjectionMatrix,mapSize:e.mapSize,rasterParameters:t};e.prepareShadowCasters?.(n);let r=this.device.beginRenderPass({id:id(`${e.type}-shadow-pass`),framebuffer:e.framebuffer,clearDepth:1});try{e.drawShadowCasters({renderPass:r,framebuffer:e.framebuffer,type:e.type,lightIndex:e.lightIndex,cascadeIndex:e.cascadeIndex,pointFace:e.pointFace,camera:e.view.camera,viewProjectionMatrix:e.view.viewProjectionMatrix,mapSize:e.mapSize,rasterParameters:t})}finally{r.end()}}assertNotDestroyed(){if(this.destroyed)throw Error(`ShadowMapRenderer has been destroyed.`)}};function Eu(e,t,n,r=.5){if(!(e>0&&t>e))throw Error(`Cascade split range requires 0 < near < far.`);if(!Number.isInteger(n)||n<1||n>vu)throw Error(`Cascade count must be an integer from 1 to ${vu}.`);let i=rd(r,0,1),a=[];for(let r=1;r<=n;r++){let o=r/n,s=e*(t/e)**+o,c=e+(t-e)*o;a.push(c*(1-i)+s*i)}return a}function Du(e,t,n,r,i){let a=new D(e.projectionMatrix).multiplyRight(e.viewMatrix).invert(),o=qu(a,e.clipDepth===`zero-to-one`?0:-1),s=qu(a,1),c=Yu(t.direction),l=[],u=e.near;for(let a=0;a<r;a++){let r=n[a],d=(u-e.near)/(e.far-e.near),f=(r-e.near)/(e.far-e.near),p=[];for(let e=0;e<4;e++)p.push(ed(o[e],s[e],d)),p.push(ed(o[e],s[e],f));let m=td(p),h=0;for(let e of p)h=Math.max(h,nd(m,e));h=Math.ceil(h*16)/16;let g=h*2/i,_=Zu(c,-1),v=Yu($u(_,Math.abs(_[1])>.99?[0,0,1]:[0,1,0])),y=Yu($u(v,_)),b=Qu(m,v),x=Qu(m,y),S=Xu(m,Xu(Zu(v,Math.round(b/g)*g-b),Zu(y,Math.round(x/g)*g-x))),C=Xu(S,Zu(c,h+t.casterDistance)),w=new D().lookAt({eye:C,center:S,up:y}),ee=new D(xu).multiplyRight(new D().ortho({left:-h,right:h,bottom:-h,top:h,near:.01,far:h*2+t.casterDistance}));l.push({camera:{viewMatrix:w,projectionMatrix:ee,near:.01,far:h*2+t.casterDistance,clipDepth:`zero-to-one`},viewProjectionMatrix:new D(ee).multiplyRight(w)}),u=r}return l}function Ou(e){let t=Yu(e.direction),n=Math.abs(t[1])>.99?[0,0,1]:[0,1,0],r=new D().lookAt({eye:e.position,center:Xu(e.position,t),up:n}),i=new D(xu).multiplyRight(new D().perspective({fovy:e.outerConeAngle*2,aspect:1,near:e.nearPlane,far:e.range}));return{camera:{viewMatrix:r,projectionMatrix:i,near:e.nearPlane,far:e.range,clipDepth:`zero-to-one`},viewProjectionMatrix:new D(i).multiplyRight(r)}}function ku(e){let t=new D(xu).multiplyRight(new D().perspective({fovy:Se(90),aspect:1,near:e.nearPlane,far:e.range}));return Cu.map(n=>{let r=new D().lookAt({eye:e.position,center:Xu(e.position,n.direction),up:n.up});return{camera:{viewMatrix:r,projectionMatrix:t,near:e.nearPlane,far:e.range,clipDepth:`zero-to-one`},viewProjectionMatrix:new D(t).multiplyRight(r)}})}function Au(e,t){let n=t.quality||`balanced`,r=mu[n];if(!r)throw Error(`Unknown shadow quality: ${String(n)}.`);let i={quality:n,directionalLightCapacity:t.directionalLightCapacity??1,spotLightCapacity:t.spotLightCapacity??1,pointLightCapacity:t.pointLightCapacity??1,directionalMapSize:t.directionalMapSize??r.directionalMapSize,spotMapSize:t.spotMapSize??r.spotMapSize,pointMapSize:t.pointMapSize??r.pointMapSize,cascadeCount:r.cascadeCount,blockerSampleCount:r.blockerSampleCount,filterSampleCount:r.filterSampleCount};Vu(`directionalLightCapacity`,i.directionalLightCapacity,hu),Vu(`spotLightCapacity`,i.spotLightCapacity,gu),Vu(`pointLightCapacity`,i.pointLightCapacity,_u),Hu(e,`directionalMapSize`,i.directionalMapSize),Hu(e,`spotMapSize`,i.spotMapSize),Hu(e,`pointMapSize`,i.pointMapSize);let a=Math.max(yu,i.pointLightCapacity*yu);if(a>e.limits.maxTextureArrayLayers)throw Error(`pointLightCapacity requires ${a} array layers, exceeding the device limit ${e.limits.maxTextureArrayLayers}.`);return i}function ju(e,t){let n=Math.max(1,t.directionalLightCapacity*t.cascadeCount),r=Math.max(1,t.spotLightCapacity),i=Math.max(yu,t.pointLightCapacity*yu),a=e.createSampler({id:id(`shadow-comparison-sampler`),type:`comparison-sampler`,compare:`less-equal`,minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,addressModeW:`clamp-to-edge`}),o=e.createSampler({id:id(`shadow-depth-sampler`),minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,addressModeW:`clamp-to-edge`}),s=Mu(e,`directional-shadow-map`,`2d-array`,t.directionalMapSize,n,o),c=Mu(e,`spot-shadow-map`,`2d-array`,t.spotMapSize,r,o),l=Mu(e,`point-shadow-map`,e.type===`webgpu`?`cube-array`:`2d-array`,t.pointMapSize,i,o),u=[];return{directionalTexture:s,spotTexture:c,pointTexture:l,comparisonSampler:a,nonFilteringSampler:o,directionalFramebuffers:Nu(e,s,t.directionalMapSize,n,u),spotFramebuffers:Nu(e,c,t.spotMapSize,r,u),pointFramebuffers:Nu(e,l,t.pointMapSize,i,u),attachmentViews:u}}function Mu(e,t,n,r,i,a){return e.createTexture({id:id(t),dimension:n,format:`depth32float`,width:r,height:r,depth:i,sampler:a,usage:p.SAMPLE|p.RENDER})}function Nu(e,t,n,r,i){return Array.from({length:r},(r,a)=>{let o=t.createView({id:id(`shadow-layer-view`),format:t.format,dimension:`2d`,baseMipLevel:0,mipLevelCount:1,baseArrayLayer:a,arrayLayerCount:1});return i.push(o),e.createFramebuffer({id:id(`shadow-layer-framebuffer`),width:n,height:n,colorAttachments:[],depthStencilAttachment:o})})}function Pu(e){for(let t of[...e.directionalFramebuffers,...e.spotFramebuffers,...e.pointFramebuffers])t.destroy();for(let t of e.attachmentViews)t.destroy();e.directionalTexture.destroy(),e.spotTexture.destroy(),e.pointTexture.destroy(),e.comparisonSampler.destroy(),e.nonFilteringSampler.destroy()}function Fu(e,t){return e.cascadeCount===t.cascadeCount&&e.directionalLightCapacity===t.directionalLightCapacity&&e.spotLightCapacity===t.spotLightCapacity&&e.pointLightCapacity===t.pointLightCapacity&&e.directionalMapSize===t.directionalMapSize&&e.spotMapSize===t.spotMapSize&&e.pointMapSize===t.pointMapSize}function Iu(e,t){let n=rd(e.shadowDistance??t.far,t.near,t.far);return{direction:Yu(e.direction),shadowDistance:n,casterDistance:e.casterDistance??n,sourceAngularRadius:e.sourceAngularRadius??.00465,cascadeSplitLambda:e.cascadeSplitLambda??.5,cascadeBlendFraction:e.cascadeBlendFraction??.1,farFadeFraction:e.farFadeFraction??.1,normalBias:e.normalBias??.04,depthBias:e.depthBias??2,depthBiasSlopeScale:e.depthBiasSlopeScale??2,strength:rd(e.strength??1,0,1)}}function Lu(e){if(Wu(`Spot shadow`,e.range),!(e.outerConeAngle>0&&e.outerConeAngle<Math.PI/2))throw Error(`Spot shadow outerConeAngle must be between 0 and PI / 2 radians.`);return{position:[...e.position],direction:Yu(e.direction),range:e.range,outerConeAngle:e.outerConeAngle,nearPlane:zu(e.nearPlane,e.range),sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,depthBias:e.depthBias??2,depthBiasSlopeScale:e.depthBiasSlopeScale??2,strength:rd(e.strength??1,0,1)}}function Ru(e){return Wu(`Point shadow`,e.range),{position:[...e.position],range:e.range,nearPlane:zu(e.nearPlane,e.range),sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,depthBias:e.depthBias??2,depthBiasSlopeScale:e.depthBiasSlopeScale??2,strength:rd(e.strength??1,0,1)}}function zu(e,t){let n=e??Math.max(bu,t/1e3);if(!(n>0&&n<t))throw Error(`Shadow nearPlane must be greater than zero and less than range.`);return n}function Bu(e){if(!(e.near>0&&e.far>e.near))throw Error(`ShadowCamera requires 0 < near < far.`)}function Vu(e,t,n){if(!Number.isInteger(t)||t<0||t>n)throw Error(`${e} must be an integer from 0 to ${n}.`)}function Hu(e,t,n){if(!Number.isInteger(n)||n<1||n>e.limits.maxTextureDimension2D)throw Error(`${t} must be a positive integer no greater than ${e.limits.maxTextureDimension2D}.`)}function Uu(e,t,n){if(t>n)throw Error(`${e} shadow light count ${t} exceeds configured capacity ${n}.`)}function Wu(e,t){if(!(t>0&&Number.isFinite(t)))throw Error(`${e} range must be a finite positive number.`)}function Gu(e,t){let n=e.slice(0,vu);for(;n.length<vu;)n.push(n[n.length-1]??t);return n}function Ku(e,t){let n=e.slice(0,t);for(;n.length<t;)n.push(Su);return n}function qu(e,t){return[Ju(e,[-1,-1,t]),Ju(e,[1,-1,t]),Ju(e,[1,1,t]),Ju(e,[-1,1,t])]}function Ju(e,t){let n=t[0],r=t[1],i=t[2],a=e[3]*n+e[7]*r+e[11]*i+e[15];return[(e[0]*n+e[4]*r+e[8]*i+e[12])/a,(e[1]*n+e[5]*r+e[9]*i+e[13])/a,(e[2]*n+e[6]*r+e[10]*i+e[14])/a]}function Yu(e){let t=Math.hypot(e[0],e[1],e[2]);if(!(t>0))throw Error(`Shadow light direction must be non-zero.`);return[e[0]/t,e[1]/t,e[2]/t]}function Xu(e,t){return[e[0]+t[0],e[1]+t[1],e[2]+t[2]]}function Zu(e,t){return[e[0]*t,e[1]*t,e[2]*t]}function Qu(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function $u(e,t){return[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]]}function ed(e,t,n){return[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n]}function td(e){let t=[0,0,0];for(let n of e)t[0]+=n[0],t[1]+=n[1],t[2]+=n[2];return Zu(t,1/e.length)}function nd(e,t){return Math.hypot(e[0]-t[0],e[1]-t[1],e[2]-t[2])}function rd(e,t,n){return Math.max(t,Math.min(n,e))}function id(e){return wu+=1,`${e}-${wu}`}var ad=`
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
`,od=4,sd=4,cd=4,ld={name:`shadow`,source:`const SHADOW_PI: f32 = 3.141592653589793;

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
`,fs:ad,props:{},uniforms:{},bindings:{},uniformTypes:{directionalLightCount:`i32`,spotLightCount:`i32`,pointLightCount:`i32`,cascadeCount:`i32`,blockerSampleCount:`i32`,filterSampleCount:`i32`,cascadeSplits:`vec4<f32>`,directionalViewProjectionMatrices:[`mat4x4<f32>`,od],spotViewProjectionMatrices:[`mat4x4<f32>`,sd],pointViewProjectionMatrices:[`mat4x4<f32>`,24],directionalLights:[{direction:`vec3<f32>`,strength:`f32`,normalBias:`f32`,sourceAngularRadius:`f32`,cascadeBlendFraction:`f32`,farFadeFraction:`f32`,shadowDistance:`f32`},1],spotLights:[{position:`vec3<f32>`,range:`f32`,direction:`vec3<f32>`,outerConeCos:`f32`,sourceRadius:`f32`,normalBias:`f32`,strength:`f32`,nearPlane:`f32`},sd],pointLights:[{position:`vec3<f32>`,range:`f32`,sourceRadius:`f32`,normalBias:`f32`,strength:`f32`,nearPlane:`f32`},cd]},bindingLayout:[{name:`shadow`,group:2},{name:`directionalShadowTexture`,group:2},{name:`spotShadowTexture`,group:2},{name:`pointShadowTexture`,group:2},{name:`shadowComparisonSampler`,group:2}],getUniforms(e){return!e.directionalLights||!e.spotLights||!e.pointLights||!e.cascadeSplits||!e.directionalViewProjectionMatrices||!e.spotViewProjectionMatrices||!e.pointViewProjectionMatrices||!e.directionalShadowTexture||!e.spotShadowTexture||!e.pointShadowTexture||!e.nonFilteringSampler||!e.comparisonSampler?{}:{directionalLightCount:e.directionalLights.length,spotLightCount:e.spotLights.length,pointLightCount:e.pointLights.length,cascadeCount:e.cascadeCount,blockerSampleCount:e.blockerSampleCount,filterSampleCount:e.filterSampleCount,cascadeSplits:e.cascadeSplits,directionalViewProjectionMatrices:e.directionalViewProjectionMatrices,spotViewProjectionMatrices:e.spotViewProjectionMatrices,pointViewProjectionMatrices:e.pointViewProjectionMatrices,directionalLights:ud(e.directionalLights),spotLights:dd(e.spotLights),pointLights:fd(e.pointLights),directionalShadowTexture:e.directionalShadowTexture,spotShadowTexture:e.spotShadowTexture,pointShadowTexture:e.pointShadowTexture,...e.directionalShadowTexture.device.type===`webgpu`?{shadowComparisonSampler:e.comparisonSampler}:{}}}};function ud(e){let t=e[0];return[t?{direction:t.direction,strength:t.strength??1,normalBias:t.normalBias??.04,sourceAngularRadius:t.sourceAngularRadius??.00465,cascadeBlendFraction:t.cascadeBlendFraction??.1,farFadeFraction:t.farFadeFraction??.1,shadowDistance:t.shadowDistance??1}:{direction:[0,1,0],strength:0,normalBias:0,sourceAngularRadius:0,cascadeBlendFraction:0,farFadeFraction:0,shadowDistance:1}]}function dd(e){return pd(e.map(e=>({position:e.position,range:e.range,direction:e.direction,outerConeCos:Math.cos(e.outerConeAngle),sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,strength:e.strength??1,nearPlane:e.nearPlane??.1})),sd,{position:[0,0,0],range:1,direction:[0,-1,0],outerConeCos:1,sourceRadius:0,normalBias:0,strength:0,nearPlane:.1})}function fd(e){return pd(e.map(e=>({position:e.position,range:e.range,sourceRadius:e.sourceRadius??.2,normalBias:e.normalBias??.025,strength:e.strength??1,nearPlane:e.nearPlane??.1})),cd,{position:[0,0,0],range:1,sourceRadius:0,normalBias:0,strength:0,nearPlane:.1})}function pd(e,t,n){let r=e.slice(0,t);for(;r.length<t;)r.push(n);return r}var md=new D,hd=class{device;materialFactory;scenegraphs=new Map;nextSceneIdentifier=1;shadowMaps=new Map;pickNodes=new Map;frames=new Map;constructor(e){this.device=e,this.materialFactory=nu(e)}render(e){let t=this.resolveSceneOptions(e),n;t.spotShadows&&!t.rasterPass&&(n=this.renderShadows(t));let r=this.getTransmissionResources(t),i=t.background||[0,0,0,1];if(r){let e={...t,id:Dd(t.id),surfaces:t.surfaces.filter(e=>!Td(e)&&_d(e.material)!==`BLEND`),framebuffer:r.framebuffer,exposure:1,toneMapMode:ho.NONE,outputColorSpace:`linear`,transmission:!1},a=this.prepareScene(e,void 0,n),o=this.device.beginRenderPass({id:`scene-${t.id}-transmission`,framebuffer:r.framebuffer,clearColor:[i[0],i[1],i[2],i[3]??1],clearDepth:1});this.drawPreparedScene(a,o),o.end()}else this.destroyFrame(Dd(t.id));let a=this.prepareScene(t,r?.colorTexture,n),o=this.device.beginRenderPass({id:`scene-${t.id}`,framebuffer:t.framebuffer,clearColor:Nd(this.device,t,i),clearDepth:1});return a.statistics.drawCount=this.drawPreparedScene(a,o),o.end(),a.statistics}resolveSceneOptions(e){if(!(`scene`in e))return e;let t=this.scenegraphs.get(e.scene);t||(t={id:`scenegraph-${this.nextSceneIdentifier++}`,adapter:new pu},this.scenegraphs.set(e.scene,t));let{scene:n,...r}=e;return{...r,id:t.id,surfaces:t.adapter.getSurfaces(n)}}destroyScene(e){let t=this.scenegraphs.get(e);t&&(this.destroyFrame(t.id),t.adapter.destroy(),this.scenegraphs.delete(e))}async pick(e,t){y(this.device.type===`webgpu`);let n=this.resolveSceneOptions(e),[r,i]=Fd(this.device,n);if(!Number.isInteger(t.x)||!Number.isInteger(t.y)||t.x<0||t.y<0||t.x>=r||t.y>=i)return;let a=this.device.createTexture({width:r,height:i,format:`rgba8unorm`,usage:p.RENDER|p.COPY_SRC}),o=this.device.createTexture({width:r,height:i,format:`depth24plus`,usage:p.RENDER}),s=this.device.createFramebuffer({width:r,height:i,colorAttachments:[a],depthStencilAttachment:o}),c=a.computeMemoryLayout({width:1,height:1}),l=this.device.createBuffer({byteLength:c.byteLength,usage:g.COPY_DST|g.MAP_READ}),u=`${n.id}-pick-${this.nextSceneIdentifier++}`;try{this.pickNodes.clear(),this.render({...n,id:u,framebuffer:s,rasterPass:`picking`,renderMode:`default`,spotShadows:void 0,transmission:!1,background:[0,0,0,0],environment:void 0,lights:[],outputColorSpace:`linear`,toneMapMode:0});let e=new Map(this.pickNodes);this.pickNodes.clear(),this.device.submit(),a.readBuffer({x:t.x,y:t.y,width:1,height:1},l);let r=await l.readAsync(0,c.byteLength),i=new Uint8Array(r.buffer,r.byteOffset,4);return e.get(i[0]|i[1]<<8|i[2]<<16)}finally{this.pickNodes.clear(),this.destroyFrame(u),l.destroy(),s.destroy(),a.destroy(),o.destroy()}}renderShadows(e){y(this.device.type===`webgpu`);let t=this.shadowMaps.get(e.id);t||(t=new Tu(this.device,{directionalLightCapacity:0,pointLightCapacity:0,spotLightCapacity:e.spotShadows.spotLights.length,spotMapSize:e.spotShadows.mapSize??2048}),this.shadowMaps.set(e.id,t)),t.setProps({spotMapSize:e.spotShadows.mapSize??2048,spotLightCapacity:e.spotShadows.spotLights.length});let n=new Map;return t.render({camera:{viewMatrix:new D(e.camera.viewMatrix),projectionMatrix:new D(e.camera.projectionMatrix),near:e.camera.near??.1,far:e.camera.far??1e3,clipDepth:e.camera.clipDepth},spotLights:[...e.spotShadows.spotLights],prepareShadowCasters:t=>{let r=this.prepareScene({...e,id:`${e.id}-shadow-${t.lightIndex}`,spotShadows:void 0,rasterPass:`depth`,transmission:!1,environment:void 0,lights:[],framebuffer:t.framebuffer,camera:{...e.camera,viewMatrix:t.camera.viewMatrix,projectionMatrix:t.camera.projectionMatrix},rasterParameters:t.rasterParameters});n.set(t.lightIndex,r)},drawShadowCasters:e=>{this.drawPreparedScene(n.get(e.lightIndex),e.renderPass)}})}destroyFrame(e){let t=this.frames.get(e);if(t){for(let e of t.surfaces.values())Rd(e);Id(t.transmission),this.frames.delete(e)}this.shadowMaps.get(e)?.destroy(),this.shadowMaps.delete(e);for(let t=0;t<4;t++){let n=`${e}-shadow-${t}`;(this.frames.has(n)||this.shadowMaps.has(n))&&this.destroyFrame(n)}let n=Dd(e);this.frames.has(n)&&this.destroyFrame(n)}destroy(){for(let e of this.scenegraphs.values())e.adapter.destroy();this.scenegraphs.clear(),this.pickNodes.clear();for(let e of Array.from(this.frames.keys()))this.destroyFrame(e);for(let e of this.shadowMaps.values())e.destroy();this.shadowMaps.clear()}prepareScene(e,t,n){let r=this.frames.get(e.id);r||(r={surfaces:new Map},this.frames.set(e.id,r));let i=new Set,a=[],o=0,s=0,c=1;e.rasterPass===`picking`&&y(e.surfaces.reduce((e,t)=>e+t.transforms.length,0)<=16777215),(e.rasterPass||e.spotShadows)&&y(this.device.type===`webgpu`);for(let l of e.surfaces){if(l.transforms.length===0)continue;let u=l.environment?{...e,environment:l.environment}:e;l.gpuTransforms&&(y(this.device.type===`webgpu`&&_d(l.material)!==`BLEND`),y(l.gpuTransforms.indices.length===l.transforms.length),y(l.gpuTransforms.matrices.usage&g.STORAGE),y(Number.isSafeInteger(l.gpuTransforms.matrixCount)&&l.gpuTransforms.matrixCount>0),y(l.gpuTransforms.matrices.byteLength>=l.gpuTransforms.matrixCount*64));let d=Td(l)?t:void 0,f=this.getCompiledSurface(r,l,u,d);bd(f,l.transforms);let p=new Uint32Array(l.transforms.length*4),m=new Float32Array(p.buffer);for(let t=0;t<l.transforms.length;t++){let n=l.gpuTransforms?.indices[t]??4294967295,r=l.gpuTransforms?.connections?.[t];l.gpuTransforms&&(y(Number.isInteger(n)&&n>=0&&n<l.gpuTransforms.matrixCount),y(!r||r.second>=0&&r.second<l.gpuTransforms.matrixCount&&r.radius>0)),p[t*4]=n,p[t*4+1]=r?.second??4294967295,p[t*4+2]=c,m[t*4+3]=r?.radius??0;let i=l.nodes?.[t];i&&e.rasterPass===`picking`&&this.pickNodes.set(c,i),c++}f.metadataBuffer.write(p),l.gpuTransforms&&f.model.setBindings({sceneWorldMatrices:l.gpuTransforms.matrices}),Ed(l)&&f.model.shaderInputs.setProps({skin:l.skin}),gd(f,l),f.material.setProps({pbrMaterial:{...iu(l.material.bindings||{}),...l.material.uniforms,alphaCutoffEnabled:f.alphaMode===`MASK`,IBLenabled:Cd(u.environment)}}),xd(f.model,u,d),n&&f.model.shaderInputs.setProps({shadow:n}),f.model.predraw(this.device.commandEncoder),f.depth=Ld(l.transforms,e.camera.viewMatrix),i.add(l.id),a.push(f),o+=l.transforms.length,s+=f.triangleCount*l.transforms.length}for(let[e,t]of r.surfaces)i.has(e)||(Rd(t),r.surfaces.delete(e));return a.sort((e,t)=>{let n=e.alphaMode===`BLEND`;return n===(t.alphaMode===`BLEND`)?!n&&e.transmissive!==t.transmissive?e.transmissive?1:-1:n?t.depth-e.depth:0:n?1:-1}),{surfaces:a,statistics:{surfaceCount:a.length,instanceCount:o,drawCount:0,triangleCount:s}}}drawPreparedScene(e,t){let n=0;for(let r of e.surfaces)r.model.draw(t)&&n++;return n}getSurfaceModelOptions(e,t){return{}}getCompiledSurface(e,t,n,r){let i=_d(t.material),a=vd(t,n,i,r),o=Object.entries(t.material.bindings||{}).filter(([,e])=>!!e),s=e.surfaces.get(t.id);if(s&&(s.source.geometry!==t.geometry||s.signature!==a||!yd(s.textureBindings,o))&&(Rd(s),e.surfaces.delete(t.id),s=void 0),!s){let c=ru(this.device,{id:t.material.id,uniforms:t.material.uniforms,bindings:t.material.bindings,factory:this.materialFactory}),l=[],u=[],d={},f=[];for(let e=0;e<4;e++){let n=new Float32Array(t.transforms.length*4),r=this.device.createBuffer({id:`${t.id}-instance-column-${e}`,data:n,usage:g.VERTEX|g.COPY_DST}),i=`instanceModelMatrixCol${e}`;d[i]=r,f.push({name:i,format:`float32x4`,stepMode:`instance`}),l.push(r),u.push(n)}let p=this.device.createBuffer({id:`${t.id}-metadata`,data:new Uint32Array(t.transforms.length*4),usage:g.VERTEX|g.COPY_DST});d.instanceMetadata=p,f.push({name:`instanceMetadata`,format:`uint32x4`,stepMode:`instance`});let m=this.getSurfaceModelOptions(t,n),h=Ed(t),_=cu(this.device,{id:`${t.id}-model`,geometry:t.geometry,topology:t.geometry.topology,material:c,attributes:d,bufferLayout:f,instanceCount:t.transforms.length,modules:[...t.gpuTransforms?[du]:[],...n.spotShadows&&!n.rasterPass?[ld]:[]],bindings:t.gpuTransforms?{sceneWorldMatrices:t.gpuTransforms.matrices}:{},shaderInputs:new rs({pbrMaterial:yo,pbrScene:vo,...h?{skin:za}:{},...t.gpuTransforms?{sceneInstances:du}:{},...n.spotShadows&&!n.rasterPass?{shadow:ld}:{}}),colorAttachmentFormats:n.framebuffer?.colorAttachments.map(e=>e.texture.format),depthStencilAttachmentFormat:zd(n.framebuffer),parameters:{...n.rasterParameters,cullMode:t.material.doubleSided?`none`:`back`,depthWriteEnabled:i!==`BLEND`,depthCompare:`less-equal`,...n.rasterPass===`depth`?{}:{blend:i===`BLEND`,blendColorSrcFactor:`src-alpha`,blendColorDstFactor:`one-minus-src-alpha`,blendAlphaSrcFactor:`one`,blendAlphaDstFactor:`one-minus-src-alpha`},...m.parameters},...m,defines:{HAS_INSTANCING:!0,USE_SCENE_INSTANCES:!0,HAS_GPU_TRANSFORMS:!!t.gpuTransforms,USE_SCENE_SHADOWS:!!(n.spotShadows&&!n.rasterPass),SCENE_DEPTH_PASS:n.rasterPass===`depth`,SCENE_PICK_PASS:n.rasterPass===`picking`,USE_LIGHTS:!!n.lights?.length,USE_MATERIAL_EXTENSIONS:!0,ALPHA_CUTOFF:i===`MASK`,USE_IBL:Cd(n.environment),USE_SCENE_ENVIRONMENT:Cd(n.environment),USE_TEX_LOD:wd(n.environment),USE_TRANSMISSION_FRAMEBUFFER:!!r,USE_SCENE_COLOR_MANAGEMENT:!0,DEBUG_NORMALS:n.renderMode===`debugNormals`,DEBUG_DEPTH:n.renderMode===`debugDepth`,...t.material.defines,...m.defines,HAS_SKIN:h}});s={id:t.id,source:t,material:c,model:_,instanceBuffers:l,instanceColumns:u,metadataBuffer:p,signature:a,textureBindings:o,triangleCount:Math.floor((t.geometry.indices?.value.length||t.geometry.vertexCount)/3),alphaMode:i,transmissive:!!r,depth:0},e.surfaces.set(t.id,s)}return s.source=t,s}getTransmissionResources(e){let t=e.transmission!==!1&&!e.rasterPass&&(!e.renderMode||e.renderMode===`default`)&&e.surfaces.some(Td),n=this.frames.get(e.id);if(!t){n?.transmission&&(Id(n.transmission),n.transmission=void 0);return}n||(n={surfaces:new Map},this.frames.set(e.id,n));let[r,i]=Fd(this.device,e);if(n.transmission&&(n.transmission.colorTexture.width!==r||n.transmission.colorTexture.height!==i)&&(Id(n.transmission),n.transmission=void 0),!n.transmission){let t=this.device.createTexture({id:`scene-${e.id}-transmission-color`,width:r,height:i,format:Od(this.device),usage:p.SAMPLE|p.RENDER,sampler:{minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}),a=this.device.createTexture({id:`scene-${e.id}-transmission-depth`,width:r,height:i,format:`depth24plus`,usage:p.RENDER}),o=this.device.createFramebuffer({id:`scene-${e.id}-transmission-framebuffer`,width:r,height:i,colorAttachments:[t],depthStencilAttachment:a});n.transmission={colorTexture:t,depthTexture:a,framebuffer:o}}return n.transmission}};function gd(e,t){if(!t.morphTargets?.length)return;let n=t.morphWeights||[];e.morphWeights?.length===n.length&&e.morphWeights.every((e,t)=>e===n[t])||(En(e.model,t.geometry,t.morphTargets,n),e.morphWeights=[...n])}function _d(e){return e.alphaMode?e.alphaMode:(e.uniforms?.baseColorFactor?.[3]??1)<1?`BLEND`:`OPAQUE`}function vd(e,t,n,r){return JSON.stringify({gpuTransforms:!!e.gpuTransforms,rasterPass:t.rasterPass,shadows:!!t.spotShadows,depthFormat:t.framebuffer?.depthStencilAttachment?.texture.format,rasterParameters:t.rasterParameters,geometryVersion:e.geometryVersion,material:e.material.id,instanceCount:e.transforms.length,alphaMode:n,doubleSided:!!e.material.doubleSided,skin:Ed(e),defines:Object.entries(e.material.defines||{}).sort(([e],[t])=>e.localeCompare(t)),environment:Cd(t.environment),lights:!!t.lights?.length,environmentMipmapped:wd(t.environment),transmission:!!r,transmissionWidth:r?.width,transmissionHeight:r?.height,colorFormat:t.framebuffer?.colorAttachments[0]?.texture.format,renderMode:t.renderMode||`default`})}function yd(e,t){return e.length===t.length?e.every(([e,n])=>t.some(([t,r])=>e===t&&n===r)):!1}function bd(e,t){for(let n=0;n<t.length;n++){let r=t[n];for(let t=0;t<4;t++)for(let i=0;i<4;i++)e.instanceColumns[t][n*4+i]=r[t*4+i]}for(let t=0;t<4;t++)e.instanceBuffers[t].write(e.instanceColumns[t])}function xd(e,t,n){let r=new D(t.camera.viewMatrix),i=new D(t.camera.projectionMatrix),a=t.framebuffer?.width||t.width||n?.width||1,o=t.framebuffer?.height||t.height||n?.height||1;e.shaderInputs.setProps({pbrProjection:{modelViewProjectionMatrix:new D(i).multiplyRight(r),modelMatrix:md,normalMatrix:md,camera:t.camera.position},pbrScene:{exposure:t.exposure??1,toneMapMode:jd(e.device,t),environmentIntensity:t.environment?.intensity??1,environmentRotation:t.environment?.rotation??0,environmentMipCount:t.environment?.specularTexture?.mipLevels??1,outputEncoding:Md(e.device,t),framebufferSize:[a,o],viewMatrix:r,projectionMatrix:i,...n?{pbr_transmissionFramebufferSampler:n}:{}},lighting:{lights:Sd(t.lights),useByteColors:!1},...Cd(t.environment)?{ibl:{pbr_diffuseEnvSampler:t.environment.diffuseTexture,pbr_specularEnvSampler:t.environment.specularTexture,pbr_brdfLUT:t.environment.brdfLUTTexture}}:{}})}function Sd(e=[]){let t=[...e],n=t.filter(e=>e.type===`ambient`);if(n.length<=1)return t;let r=[0,0,0];for(let e of n){let t=e.color??[1,1,1],n=e.intensity??1;r[0]+=t[0]*n,r[1]+=t[1]*n,r[2]+=t[2]*n}return[{type:`ambient`,color:r,intensity:1},...t.filter(e=>e.type!==`ambient`)]}function Cd(e){return!!(e?.diffuseTexture&&e.specularTexture&&e.brdfLUTTexture)}function wd(e){return Cd(e)&&(e?.specularTexture?.mipLevels??1)>1}function Td(e){return(e.material.uniforms?.transmissionFactor??0)>0}function Ed(e){return!!(e.skin?.jointMatrices?.length&&lu(e.geometry).HAS_SKIN)}function Dd(e){return`${e}::linear-transmission-capture`}function Od(e){let t=e.getTextureFormatCapabilities(`rgba16float`);return t.render&&t.filter?`rgba16float`:`rgba8unorm`}function kd(e,t){return t.framebuffer?.colorAttachments[0]?.texture.format||e.preferredColorFormat}function Ad(e){return!!(l.getInfo(e).dataType?.startsWith(`float`)||e.endsWith(`ufloat`))}function jd(e,t){return t.toneMapMode??(Ad(kd(e,t))?ho.NONE:ho.KHRONOS_PBR_NEUTRAL)}function Md(e,t){if(t.outputColorSpace)return t.outputColorSpace===`srgb`?1:0;let n=kd(e,t);return Ad(n)||n.endsWith(`-srgb`)?0:1}function Nd(e,t,n){let r=Math.max(t.exposure??1,0),i=[Math.max(n[0],0)*r,Math.max(n[1],0)*r,Math.max(n[2],0)*r];switch(jd(e,t)){case ho.REINHARD:i=i.map(e=>e/(1+e));break;case ho.KHRONOS_PBR_NEUTRAL:i=Pd(i);break;case ho.ACES:i=i.map(e=>Math.min(Math.max(e*(2.51*e+.03)/(e*(2.43*e+.59)+.14),0),1));break}return Md(e,t)!==0&&(i=i.map(e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055)),[...i,n[3]??1]}function Pd(e){let t=Math.min(...e),n=t<.08?t-6.25*t*t:.04,r=e.map(e=>e-n),i=Math.max(...r),a=.76;if(i<a)return r;let o=1-a,s=1-o*o/(i+o-a),c=s/Math.max(i,1e-4),l=1-1/(.15*(i-s)+1);return r.map(e=>e*c*(1-l)+s*l)}function Fd(e,t){return t.framebuffer?[t.framebuffer.width,t.framebuffer.height]:t.width&&t.height?[t.width,t.height]:e.getDefaultCanvasContext().getDrawingBufferSize()}function Id(e){e&&(e.framebuffer.destroy(),e.colorTexture.destroy(),e.depthTexture.destroy())}function Ld(e,t){let n=new D(t),r=0;for(let t of e){let e=n.transformAsPoint([t[12],t[13],t[14]]);r-=e[2]}return r/e.length}function Rd(e){e.model.destroy(),e.metadataBuffer.destroy(),e.material.destroy();for(let t of e.instanceBuffers)t.destroy()}function zd(e){let t=e?.depthStencilAttachment?.texture.format;return t&&l.isDepthStencil(t)?t:void 0}var Bd=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];function Vd(e,t=64){if(!Number.isSafeInteger(t)||t<1)throw Error(`maxLightCount must be a positive safe integer.`);if(e.length>t)throw Error(`Point light count exceeds maxLightCount.`);let n=new Float32Array(t*8);for(let t=0;t<e.length;t++){let r=e[t];if(!(r.range>0)||!(r.intensity>=0))throw Error(`Point light range must be positive and intensity must be non-negative.`);let i=t*8;n.set(r.position,i),n[i+3]=r.range,n.set(r.color,i+4),n[i+7]=r.intensity}return n}var Hd={name:`deferredLighting`,source:`const DEFERRED_LIGHTING_PI: f32 = 3.141592653589793;
const DEFERRED_LIGHTING_MAX_POINT_LIGHTS: u32 = 64u;

struct DeferredLightingUniforms {
  inverseProjectionMatrix: mat4x4f,
  ambientColor: vec3f,
  exposure: f32,
  fogColor: vec3f,
  fogDensity: f32,
  directionalLightDirectionView: vec3f,
  directionalLightColor: vec3f,
  directionalLightIntensity: f32,
  pointLightCount: u32,
};

struct DeferredPointLight {
  positionRange: vec4f,
  colorIntensity: vec4f,
};

@group(0) @binding(auto) var<uniform> deferredLighting: DeferredLightingUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
@group(0) @binding(auto) var baseColorMetallicTexture: texture_2d<f32>;
@group(0) @binding(auto) var baseColorMetallicTextureSampler: sampler;
@group(0) @binding(auto) var emissiveOcclusionTexture: texture_2d<f32>;
@group(0) @binding(auto) var<storage, read> pointLights: array<DeferredPointLight>;

fn deferredLighting_reconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let viewPosition = deferredLighting.inverseProjectionMatrix * clip;
  return viewPosition.xyz / max(viewPosition.w, 0.00001);
}

fn deferredLighting_distributionGGX(normal: vec3f, halfVector: vec3f, roughness: f32) -> f32 {
  let alpha = roughness * roughness;
  let alphaSquared = alpha * alpha;
  let normalDotHalf = max(dot(normal, halfVector), 0.0);
  let normalDotHalfSquared = normalDotHalf * normalDotHalf;
  let denominator = normalDotHalfSquared * (alphaSquared - 1.0) + 1.0;
  return alphaSquared / max(DEFERRED_LIGHTING_PI * denominator * denominator, 0.0001);
}

fn deferredLighting_geometrySchlickGGX(normalDotDirection: f32, roughness: f32) -> f32 {
  let radius = roughness + 1.0;
  let k = radius * radius / 8.0;
  return normalDotDirection / max(normalDotDirection * (1.0 - k) + k, 0.0001);
}

fn deferredLighting_geometrySmith(
  normal: vec3f, viewDirection: vec3f, lightDirection: vec3f, roughness: f32
) -> f32 {
  let normalDotView = max(dot(normal, viewDirection), 0.0);
  let normalDotLight = max(dot(normal, lightDirection), 0.0);
  return deferredLighting_geometrySchlickGGX(normalDotView, roughness) *
    deferredLighting_geometrySchlickGGX(normalDotLight, roughness);
}

fn deferredLighting_fresnelSchlick(cosine: f32, baseReflectance: vec3f) -> vec3f {
  return baseReflectance + (vec3f(1.0) - baseReflectance) * pow(1.0 - cosine, 5.0);
}

fn deferredLighting_evaluateLight(
  normal: vec3f,
  viewDirection: vec3f,
  lightDirection: vec3f,
  radiance: vec3f,
  baseColor: vec3f,
  metallic: f32,
  roughness: f32
) -> vec3f {
  let normalDotLight = max(dot(normal, lightDirection), 0.0);
  if (normalDotLight <= 0.0) {
    return vec3f(0.0);
  }
  let halfVector = normalize(viewDirection + lightDirection);
  let baseReflectance = mix(vec3f(0.04), baseColor, metallic);
  let fresnel = deferredLighting_fresnelSchlick(
    max(dot(halfVector, viewDirection), 0.0),
    baseReflectance
  );
  let distribution = deferredLighting_distributionGGX(normal, halfVector, roughness);
  let geometry = deferredLighting_geometrySmith(normal, viewDirection, lightDirection, roughness);
  let normalDotView = max(dot(normal, viewDirection), 0.0);
  let specular = distribution * geometry * fresnel /
    max(4.0 * normalDotView * normalDotLight, 0.0001);
  let diffuseWeight = (vec3f(1.0) - fresnel) * (1.0 - metallic);
  let diffuse = diffuseWeight * baseColor / DEFERRED_LIGHTING_PI;
  return (diffuse + specular) * radiance * normalDotLight;
}

fn deferredLighting_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, sceneCoord, 0);
  if (depth >= 0.99999) {
    return textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  }

  let normalRoughness = textureSampleLevel(normalTexture, normalTextureSampler, sceneCoord, 0);
  let normal = normalize(normalRoughness.rgb * 2.0 - 1.0);
  let roughness = clamp(normalRoughness.a, 0.045, 1.0);
  let baseColorMetallic = textureSampleLevel(
    baseColorMetallicTexture,
    baseColorMetallicTextureSampler,
    sceneCoord,
    0
  );
  let baseColor = max(baseColorMetallic.rgb, vec3f(0.0));
  let metallic = clamp(baseColorMetallic.a, 0.0, 1.0);
  let emissiveOcclusionCoordinates = vec2i(
    clamp(sceneCoord * texSize, vec2f(0.0), texSize - vec2f(1.0))
  );
  let emissiveOcclusion = textureLoad(emissiveOcclusionTexture, emissiveOcclusionCoordinates, 0);
  let emissive = max(emissiveOcclusion.rgb, vec3f(0.0));
  let occlusion = clamp(emissiveOcclusion.a, 0.0, 1.0);
  let viewPosition = deferredLighting_reconstructViewPosition(sceneCoord, depth);
  let viewDirection = normalize(-viewPosition);

  var color = baseColor * deferredLighting.ambientColor * occlusion + emissive;
  let directionalLightDirection = normalize(deferredLighting.directionalLightDirectionView);
  color += deferredLighting_evaluateLight(
    normal,
    viewDirection,
    directionalLightDirection,
    deferredLighting.directionalLightColor * deferredLighting.directionalLightIntensity,
    baseColor,
    metallic,
    roughness
  );

  let lightCount = min(
    min(deferredLighting.pointLightCount, arrayLength(&pointLights)),
    DEFERRED_LIGHTING_MAX_POINT_LIGHTS
  );
  for (var lightIndex = 0u; lightIndex < lightCount; lightIndex++) {
    let light = pointLights[lightIndex];
    let toLight = light.positionRange.xyz - viewPosition;
    let distance = length(toLight);
    if (distance >= light.positionRange.w || distance <= 0.0001) {
      continue;
    }
    let lightDirection = toLight / distance;
    let rangeFade = pow(clamp(1.0 - distance / light.positionRange.w, 0.0, 1.0), 2.0);
    let attenuation = rangeFade / max(1.0, distance * distance * 0.06);
    let radiance = light.colorIntensity.rgb * light.colorIntensity.a * attenuation;
    color += deferredLighting_evaluateLight(
      normal,
      viewDirection,
      lightDirection,
      radiance,
      baseColor,
      metallic,
      roughness
    );
  }

  let cameraDistance = length(viewPosition);
  let fogAmount = 1.0 - exp(-cameraDistance * cameraDistance * deferredLighting.fogDensity);
  color = mix(color, deferredLighting.fogColor, clamp(fogAmount, 0.0, 0.93));
  color *= deferredLighting.exposure;

  return vec4f(color, 1.0);
}`,bindingLayout:[{name:`depthTexture`,group:0},{name:`normalTexture`,group:0},{name:`baseColorMetallicTexture`,group:0},{name:`emissiveOcclusionTexture`,group:0},{name:`pointLights`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseProjectionMatrix:`mat4x4<f32>`,ambientColor:`vec3<f32>`,exposure:`f32`,fogColor:`vec3<f32>`,fogDensity:`f32`,directionalLightDirectionView:`vec3<f32>`,directionalLightColor:`vec3<f32>`,directionalLightIntensity:`f32`,pointLightCount:`u32`},propTypes:{inverseProjectionMatrix:{value:Bd,private:!0},ambientColor:{value:[.04,.04,.05],private:!0},exposure:{value:1,min:0,softMax:4},fogColor:{value:[.025,.035,.075],private:!0},fogDensity:{value:0,min:0,softMax:.01},directionalLightDirectionView:{value:[.3,.75,.55],private:!0},directionalLightColor:{value:[1,.95,.86],private:!0},directionalLightIntensity:{value:2.5,min:0,softMax:8},pointLightCount:{value:0,min:0,max:64}},passes:[{sampler:!0}]};function Ud(){return{name:`deferredLightingCompositeShaderPass`,steps:[{shaderPass:Hd,inputs:{sourceTexture:`previous`},output:`previous`}]}}var Wd={minFilter:`linear`,magFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},Gd={minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`},Kd=new Set([`color`,`normalRoughness`,`velocity`,`depth`]),qd=new Set([`rgba8unorm`,`rgba8unorm-srgb`,`rgba8snorm`,`bgra8unorm`,`bgra8unorm-srgb`,`rgb10a2uint`,`rgb10a2unorm`,`rg11b10ufloat`]),Jd=0,Yd=class{device;id;props;renderTargets;constructor(e,t){if(e.type!==`webgpu`)throw Error(`GBuffer requires a WebGPU device.`);this.device=e,this.id=t.id||sf(`g-buffer`),this.props=Xd(this.id,t),Zd(e,this.props),this.renderTargets=rf(e,this.props)}get framebuffer(){return this.renderTargets.framebuffer}get colorTexture(){return this.renderTargets.colorTexture}get normalRoughnessTexture(){return this.renderTargets.normalRoughnessTexture}get velocityTexture(){let e=this.renderTargets.velocityTexture;if(!e)throw Error(`GBuffer velocity attachment is disabled.`);return e}get depthTexture(){return this.renderTargets.depthTexture}get width(){return this.renderTargets.framebuffer.width}get height(){return this.renderTargets.framebuffer.height}getShaderPassBindings(){return{depthTexture:this.depthTexture,normalTexture:this.normalRoughnessTexture,velocityTexture:this.velocityTexture}}getExtraColorTexture(e){let t=this.renderTargets.extraColorTextures.get(e);if(!t)throw Error(`GBuffer has no extra color attachment named "`+e+`".`);return t}resize(e){if(ef(e.width,e.height),e.width===this.width&&e.height===this.height)return!1;let t=this.renderTargets;return this.renderTargets=rf(this.device,{...this.props,width:e.width,height:e.height}),of(t),!0}destroy(){of(this.renderTargets)}};function Xd(e,t){return{id:e,width:t.width,height:t.height,colorFormat:t.colorFormat||`rgba8unorm`,normalRoughnessFormat:t.normalRoughnessFormat||`rgba8unorm`,velocity:t.velocity??!0,velocityFormat:t.velocityFormat||`rg16float`,depthStencilFormat:t.depthStencilFormat||`depth24plus`,extraColorAttachments:t.extraColorAttachments||[]}}function Zd(e,t){ef(t.width,t.height);let n=[t.colorFormat,t.normalRoughnessFormat,...t.velocity?[t.velocityFormat]:[],...t.extraColorAttachments.map(e=>e.format)],r=n.length;if(r>e.limits.maxColorAttachments)throw Error(`GBuffer requires `+r+` color attachments, but the device supports `+e.limits.maxColorAttachments+`.`);tf(e,t.colorFormat,`color`),tf(e,t.normalRoughnessFormat,`normalRoughness`),t.velocity&&tf(e,t.velocityFormat,`velocity`),nf(e,t.depthStencilFormat,`depth`);let i=new Set;for(let n of t.extraColorAttachments){if(!n.name)throw Error(`GBuffer extra color attachment name is required.`);if(Kd.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is reserved.`);if(i.has(n.name))throw Error(`GBuffer extra color attachment name "`+n.name+`" is duplicated.`);i.add(n.name),tf(e,n.format,n.name)}let a=Qd(e,n);if(a>e.limits.maxColorAttachmentBytesPerSample)throw Error(`GBuffer color attachments require `+a+` bytes per sample, but the device supports `+e.limits.maxColorAttachmentBytesPerSample+`.`)}function Qd(e,t){let n=0;for(let r of t){let t=$d(r);n=Math.ceil(n/t)*t;let i=e.getTextureFormatInfo(r).bytesPerPixel;n+=qd.has(r)?8:i}return n}function $d(e){return e.startsWith(`r8`)||e.startsWith(`rg8`)||e.startsWith(`rgba8`)||e.startsWith(`bgra8`)?1:e.startsWith(`r16`)||e.startsWith(`rg16`)||e.startsWith(`rgba16`)?2:4}function ef(e,t){if(!Number.isSafeInteger(e)||!Number.isSafeInteger(t)||e<=0||t<=0)throw Error(`GBuffer size must use positive safe integer dimensions.`)}function tf(e,t,n){if(!e.getTextureFormatCapabilities(t).render)throw Error(`GBuffer attachment "`+n+`" requires renderable format `+t+`.`)}function nf(e,t,n){if(!e.getTextureFormatCapabilities(t).create)throw Error(`GBuffer attachment "`+n+`" requires supported format `+t+`.`)}function rf(e,t){let n=af(e,t,`color`,t.colorFormat),r=af(e,t,`normal-roughness`,t.normalRoughnessFormat),i=t.velocity?af(e,t,`velocity`,t.velocityFormat):void 0,a=new Map(t.extraColorAttachments.map(n=>[n.name,af(e,t,n.name,n.format,n.sampler)])),o=e.createTexture({id:t.id+`-depth`,format:t.depthStencilFormat,width:t.width,height:t.height,usage:p.SAMPLE|p.RENDER|p.COPY_DST,sampler:Gd});return{framebuffer:e.createFramebuffer({id:t.id+`-framebuffer`,width:t.width,height:t.height,colorAttachments:[n,r,...i?[i]:[],...a.values()],depthStencilAttachment:o}),colorTexture:n,normalRoughnessTexture:r,velocityTexture:i,depthTexture:o,extraColorTextures:a}}function af(e,t,n,r,i=Wd){return e.createTexture({id:t.id+`-`+n,format:r,width:t.width,height:t.height,usage:p.SAMPLE|p.RENDER|p.COPY_DST,sampler:i})}function of(e){e.framebuffer.destroy(),e.colorTexture.destroy(),e.normalRoughnessTexture.destroy(),e.velocityTexture?.destroy(),e.depthTexture.destroy();for(let t of e.extraColorTextures.values())t.destroy()}function sf(e){return Jd+=1,e+`-`+Jd}var cf=`
struct DeferredSceneVertexInputs {
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
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  @location(7) colors: vec4f,
#else
  @location(7) colors: vec3f,
#endif
#endif
  @location(8) instanceModelMatrixCol0: vec4f,
  @location(9) instanceModelMatrixCol1: vec4f,
  @location(10) instanceModelMatrixCol2: vec4f,
  @location(11) instanceModelMatrixCol3: vec4f,
};

struct DeferredSceneVertexOutputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) color: vec4f,
  @location(3) textureCoordinates: vec2f,
  @location(4) secondTextureCoordinates: vec2f,
#ifdef HAS_TANGENTS
  @location(5) worldTangent: vec4f,
#endif
};

struct DeferredSceneFragmentOutputs {
  @location(0) color: vec4f,
  @location(1) normalRoughness: vec4f,
  @location(2) baseColorMetallic: vec4f,
  @location(3) emissiveOcclusion: vec4f,
};

fn getDeferredSceneNormalMatrix(matrix: mat3x3f) -> mat3x3f {
  let firstCofactor = cross(matrix[1], matrix[2]);
  let inverseDeterminant = 1.0 / dot(matrix[0], firstCofactor);
  return mat3x3f(
    firstCofactor,
    cross(matrix[2], matrix[0]),
    cross(matrix[0], matrix[1])
  ) * inverseDeterminant;
}

@vertex
fn vertexMain(inputs: DeferredSceneVertexInputs) -> DeferredSceneVertexOutputs {
  let modelMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
  let worldPosition = modelMatrix * vec4f(inputs.positions, 1.0);
  let normalMatrix = getDeferredSceneNormalMatrix(mat3x3f(
    modelMatrix[0].xyz,
    modelMatrix[1].xyz,
    modelMatrix[2].xyz
  ));

  var outputs: DeferredSceneVertexOutputs;
  outputs.position = pbrProjection.modelViewProjectionMatrix * worldPosition;
  outputs.worldPosition = worldPosition.xyz;
  outputs.worldNormal = vec3f(0.0, 0.0, 1.0);
  outputs.textureCoordinates = vec2f(0.0);
  outputs.secondTextureCoordinates = vec2f(0.0);
  outputs.color = vec4f(1.0);

#ifdef HAS_NORMALS
  outputs.worldNormal = normalize(normalMatrix * inputs.normals);
#endif
#ifdef HAS_UV
  outputs.textureCoordinates = inputs.texCoords;
#endif
#ifdef HAS_UV_1
  outputs.secondTextureCoordinates = inputs.texCoords1;
#endif
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  outputs.color = inputs.colors;
#else
  outputs.color = vec4f(inputs.colors, 1.0);
#endif
#endif
#ifdef HAS_TANGENTS
  outputs.worldTangent = vec4f(
    normalize((modelMatrix * vec4f(inputs.TANGENT.xyz, 0.0)).xyz),
    inputs.TANGENT.w
  );
#endif
  return outputs;
}

@fragment
fn fragmentMain(inputs: DeferredSceneVertexOutputs) -> DeferredSceneFragmentOutputs {
  fragmentInputs.pbr_vPosition = inputs.worldPosition;
  fragmentInputs.pbr_vNormal = normalize(inputs.worldNormal);
  fragmentInputs.pbr_vUV0 = inputs.textureCoordinates;
  fragmentInputs.pbr_vUV1 = inputs.secondTextureCoordinates;
#ifdef HAS_TANGENTS
  let tangent = normalize(inputs.worldTangent.xyz);
  let bitangent = normalize(cross(inputs.worldNormal, tangent)) * inputs.worldTangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangent, bitangent, inputs.worldNormal);
#endif

  let normalCoordinates = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  let worldNormal = getNormal(getTBN(normalCoordinates), normalCoordinates);
  let viewNormal = normalize((pbrScene.viewMatrix * vec4f(worldNormal, 0.0)).xyz);

  var baseColor = pbrMaterial.baseColorFactor * inputs.color;
#ifdef HAS_BASECOLORMAP
  let baseColorCoordinates = getMaterialUV(
    pbrMaterial.baseColorUVSet,
    pbrMaterial.baseColorUVTransform
  );
  baseColor *= SRGBtoLINEAR(textureSample(
    pbr_baseColorSampler,
    pbr_baseColorSamplerSampler,
    baseColorCoordinates
  ));
#endif
#ifdef ALPHA_CUTOFF
  if (baseColor.a < pbrMaterial.alphaCutoff) {
    discard;
  }
#endif

  var metallic = pbrMaterial.metallicRoughnessValues.x;
  var roughness = pbrMaterial.metallicRoughnessValues.y;
#ifdef HAS_METALROUGHNESSMAP
  let metallicRoughnessCoordinates = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  let metallicRoughness = textureSample(
    pbr_metallicRoughnessSampler,
    pbr_metallicRoughnessSamplerSampler,
    metallicRoughnessCoordinates
  );
  roughness *= metallicRoughness.g;
  metallic *= metallicRoughness.b;
#endif

  var emissive = pbrMaterial.emissiveFactor * pbrMaterial.emissiveStrength;
#ifdef HAS_EMISSIVEMAP
  let emissiveCoordinates = getMaterialUV(
    pbrMaterial.emissiveUVSet,
    pbrMaterial.emissiveUVTransform
  );
  emissive *= SRGBtoLINEAR(textureSample(
    pbr_emissiveSampler,
    pbr_emissiveSamplerSampler,
    emissiveCoordinates
  )).rgb;
#endif

  var occlusion = 1.0;
#ifdef HAS_OCCLUSIONMAP
  let occlusionCoordinates = getMaterialUV(
    pbrMaterial.occlusionUVSet,
    pbrMaterial.occlusionUVTransform
  );
  let sampledOcclusion = textureSample(
    pbr_occlusionSampler,
    pbr_occlusionSamplerSampler,
    occlusionCoordinates
  ).r;
  occlusion = mix(1.0, sampledOcclusion, pbrMaterial.occlusionStrength);
#endif

  var outputs: DeferredSceneFragmentOutputs;
  outputs.color = vec4f(baseColor.rgb * 0.015 + emissive, baseColor.a);
  outputs.normalRoughness = vec4f(viewNormal * 0.5 + 0.5, clamp(roughness, 0.045, 1.0));
  outputs.baseColorMetallic = vec4f(baseColor.rgb, clamp(metallic, 0.0, 1.0));
  outputs.emissiveOcclusion = vec4f(max(emissive, vec3f(0.0)), clamp(occlusion, 0.0, 1.0));
  return outputs;
}
`,lf=[`rgba16float`,`rgba8unorm`,`rgba8unorm`,`rgba16float`];function uf(e){if(e.renderMode&&e.renderMode!==`default`)return!1;let t=0,n=0;for(let r of e.lights||[])if(r.type===`spot`||r.type===`directional`&&++t>1||r.type===`point`&&++n>64)return!1;return e.environment?.diffuseTexture||e.environment?.specularTexture||e.environment?.brdfLUTTexture?!1:!e.rasterPass&&!e.spotShadows&&e.surfaces.every(e=>{if(e.gpuTransforms||e.environment?.diffuseTexture||e.environment?.specularTexture||e.environment?.brdfLUTTexture)return!1;let t=e.material.uniforms||{},n=e.material.bindings||{};return _d(e.material)!==`BLEND`&&!t.unlit&&!(t.transmissionFactor&&t.transmissionFactor>0)&&!(t.diffuseTransmissionFactor&&t.diffuseTransmissionFactor>0)&&!(t.multiscatterColorFactor||[]).some(e=>e>0)&&!t.bumpMapEnabled&&!n.pbr_bumpSampler&&!(t.thicknessFactor&&t.thicknessFactor>0)&&!(t.clearcoatFactor&&t.clearcoatFactor>0)&&!(t.iridescenceFactor&&t.iridescenceFactor>0)&&!(t.anisotropyStrength&&t.anisotropyStrength>0)&&!(t.sheenColorFactor||[]).some(e=>e>0)&&(t.ior===void 0||t.ior===1.5)&&(t.specularIntensityFactor===void 0||t.specularIntensityFactor===1)&&(t.specularColorFactor||[1,1,1]).every(e=>e===1)&&!t.specularColorMapEnabled&&!t.specularIntensityMapEnabled&&!n.pbr_specularColorSampler&&!n.pbr_specularIntensitySampler})}var df=class extends hd{buffers=new Map;pointLightBuffer;lightingRenderer;forwardRenderer=null;lastDeferredFrameIdentifiers=new Set;constructor(e){if(e.type!==`webgpu`)throw Error(`Deferred scene rendering requires a WebGPU device.`);super(e),this.pointLightBuffer=e.createBuffer({id:`deferred-scene-point-lights`,data:Vd([],64),usage:g.STORAGE|g.COPY_DST}),this.lightingRenderer=new qc(e,{shaderPasses:[Ud()],colorFormat:`rgba16float`,flipY:!0})}pick(e,t){return this.forwardRenderer||=new hd(this.device),this.forwardRenderer.pick(this.resolveSceneOptions(e),t)}render(e){let t=this.resolveSceneOptions(e);if(!uf(t))return this.lastDeferredFrameIdentifiers.delete(t.id),this.forwardRenderer||=new hd(this.device),this.forwardRenderer.render(t);let[n,r]=ff(this.device,t),i=this.getGBuffer(t.id,n,r);this.lastDeferredFrameIdentifiers.add(t.id);let a=this.prepareScene(t),o=t.background||[0,0,0,1],s=this.device.beginRenderPass({id:`scene-${t.id}-deferred-gbuffer`,framebuffer:i.framebuffer,clearColors:[new Float32Array([o[0],o[1],o[2],o[3]??1]),new Float32Array([.5,.5,1,1]),new Float32Array([0,0,0,0]),new Float32Array([0,0,0,0])],clearDepth:1});a.statistics.drawCount=this.drawPreparedScene(a,s),s.end();let c=pf(t.lights||[],new D(t.camera.viewMatrix));this.pointLightBuffer.write(Vd(c.pointLights,64)),this.lightingRenderer.resize([n,r]);let l={sourceTexture:i.colorTexture,bindings:{depthTexture:i.depthTexture,normalTexture:i.normalRoughnessTexture,baseColorMetallicTexture:i.getExtraColorTexture(`baseColorMetallic`),emissiveOcclusionTexture:i.getExtraColorTexture(`emissiveOcclusion`),pointLights:this.pointLightBuffer},uniforms:{deferredLighting:{inverseProjectionMatrix:new D(t.camera.projectionMatrix).invert(),ambientColor:c.ambientColor,exposure:t.exposure??1,fogColor:t.fogColor||[0,0,0],fogDensity:t.fogDensity??0,directionalLightDirectionView:c.directionalLightDirectionView,directionalLightColor:c.directionalLightColor,directionalLightIntensity:c.directionalLightIntensity,pointLightCount:c.pointLights.length}}};if(t.framebuffer){let e=this.lightingRenderer.renderToTexture(l);if(e){let n=this.lightingRenderer.textureModel;n.setProps({backgroundTexture:e}),n.predraw(this.device.commandEncoder);let r=this.device.beginRenderPass({id:`scene-${t.id}-deferred-resolve`,framebuffer:t.framebuffer,clearDepth:!1});n.draw(r),r.end()}}else this.lightingRenderer.renderToScreen(l);return a.statistics}getLastDepthTexture(e){return this.lastDeferredFrameIdentifiers.has(e)&&this.buffers.get(e)?.depthTexture||null}destroyFrame(e){super.destroyFrame(e),this.forwardRenderer?.destroyFrame(e),this.buffers.get(e)?.destroy(),this.buffers.delete(e),this.lastDeferredFrameIdentifiers.delete(e)}destroy(){super.destroy(),this.forwardRenderer?.destroy();for(let e of this.buffers.values())e.destroy();this.buffers.clear(),this.lastDeferredFrameIdentifiers.clear(),this.lightingRenderer.destroy(),this.pointLightBuffer.destroy()}getSurfaceModelOptions(e,t){return{source:cf,colorAttachmentFormats:lf,depthStencilAttachmentFormat:`depth24plus`}}getGBuffer(e,t,n){let r=this.buffers.get(e);return r?r.resize({width:t,height:n}):(r=new Yd(this.device,{id:`scene-${e}-deferred`,width:t,height:n,colorFormat:`rgba16float`,normalRoughnessFormat:`rgba8unorm`,velocity:!1,depthStencilFormat:`depth24plus`,extraColorAttachments:[{name:`baseColorMetallic`,format:`rgba8unorm`},{name:`emissiveOcclusion`,format:`rgba16float`}]}),this.buffers.set(e,r)),r}};function ff(e,t){return t.framebuffer?[t.framebuffer.width,t.framebuffer.height]:t.width&&t.height?[t.width,t.height]:e.getDefaultCanvasContext().getDrawingBufferSize()}function pf(e,t){let n=[0,0,0],r=[0,0,1],i=[1,1,1],a=[],o=0;for(let s of e){let e=mf(s.color||[1,1,1]),c=s.intensity??1;switch(s.type){case`ambient`:n[0]+=e[0]*c,n[1]+=e[1]*c,n[2]+=e[2]*c;break;case`directional`:{let n=t.transformAsVector(s.direction),a=Math.hypot(n[0],n[1],n[2])||1;r[0]=-n[0]/a,r[1]=-n[1]/a,r[2]=-n[2]/a,i[0]=e[0],i[1]=e[1],i[2]=e[2],o=c;break}case`point`:if(a.length<64){let n=t.transformAsPoint(s.position);a.push({position:[n[0],n[1],n[2]],range:Math.max(4,Math.sqrt(Math.max(c,0))*3),color:e,intensity:c})}break}}return{ambientColor:n,directionalLightDirectionView:r,directionalLightColor:i,directionalLightIntensity:o,pointLights:a}}function mf(e){let t=e[0]>1||e[1]>1||e[2]>1?1/255:1;return[e[0]*t,e[1]*t,e[2]*t]}function hf(e,t,n=new Map){if(!e.length)return n.clear(),[];let r=new Set,i=new Map;if(t?.emitterSelection===`power`){let a=0,o=new Set(e);for(let e of t.surfaces){let s=e.material.uniforms?.emissiveFactor??[0,0,0],c=e.material.uniforms?.emissiveStrength??1,l=Math.max(0,(s[0]*.2126+s[1]*.7152+s[2]*.0722)*c);for(let[s,c]of e.transforms.entries()){if(o.has(a)){let o=t.primitives?.[e.id],u=`${e.id}:${s}`;r.add(u);let d=gf(e,c,o?.type===`sphere`?o.radius:0,u,n);i.set(a,Number.isFinite(d*l)?d*l:0)}a++}}}for(let e of n.keys())r.has(e)||n.delete(e);let a=e.reduce((e,t)=>Math.max(e,i.get(t)??0),0),o=e.map(e=>a>0?(i.get(e)??0)/a:1),s=o.reduce((e,t)=>e+t,0),c=0,l=0,u=Math.min(.5,Math.max(.01,e.length*2**-22));return o.map((t,n)=>{let r=(1-u)*t/s+u/e.length;c+=r;let i=n===e.length-1?1:Math.fround(c),a=i-l;return l=i,{probability:a,cumulative:i}})}function gf(e,t,n,r,i){let a=e.geometry.attributes.POSITION?.value,o=e.geometry.indices?.value,s=i.get(r);if(s&&s.geometry===e.geometry&&s.geometryVersion===e.geometryVersion&&s.positions===a&&s.indices===o&&s.sphereRadius===n&&s.transform.every((e,n)=>e===t[n]))return s.area;let c=0;if(n>0){let e=new D(t),r=e.clone().invert(),i=Math.hypot(r[0],r[4],r[8])+Math.hypot(r[1],r[5],r[9])+Math.hypot(r[2],r[6],r[10]);c=4*Math.PI*n**2*Math.abs(e.determinant())*i/3}else if(a){let e=o?.length??a.length/3;for(let n=0;n+2<e;n+=3){let e=(o?.[n]??n)*3,r=(o?.[n+1]??n+1)*3,i=(o?.[n+2]??n+2)*3,s=a[r]-a[e],l=a[r+1]-a[e+1],u=a[r+2]-a[e+2],d=a[i]-a[e],f=a[i+1]-a[e+1],p=a[i+2]-a[e+2],m=t[0]*s+t[4]*l+t[8]*u,h=t[1]*s+t[5]*l+t[9]*u,g=t[2]*s+t[6]*l+t[10]*u,_=t[0]*d+t[4]*f+t[8]*p,v=t[1]*d+t[5]*f+t[9]*p,y=t[2]*d+t[6]*f+t[10]*p;c+=Math.hypot(h*y-g*v,g*_-m*y,m*v-h*_)/2}}return i.set(r,{geometry:e.geometry,geometryVersion:e.geometryVersion,positions:a,indices:o,transform:Array.from(t),sphereRadius:n,area:c}),c}var _f=/^vertex-list<([^<>]+)>$/,vf=/^value-list<([^<>]+)>$/,yf=/^fixed-size-list<([^<>,]+),([1-9][0-9]*)>$/;function bf(e){return _f.test(e)}function xf(e){return vf.test(e)}function Sf(e){let t=_f.exec(e),n=vf.exec(e),i=wf(e)?.elementFormat??t?.[1]??n?.[1]??e;try{r.getVertexFormatInfo(i)}catch{throw Error(`Unsupported GPUVector format ${e}`)}return i}function Cf(e){let t=Sf(e),n=bf(e),i=xf(e),a=wf(e),o=r.getVertexFormatInfo(t),s=o.byteLength*(a?.listSize??1);if(!Number.isSafeInteger(s))throw Error(`Unsupported GPUVector format ${e}`);let c=o.type,l=o.normalized,u=Tf(c,l);return{format:e,elementFormat:t,vertexList:n,valueList:i,fixedSizeList:!!a,...a?{listSize:a.listSize}:{},type:c,signedDataType:Ef(t,c),primitiveType:u,components:o.components,elementByteLength:o.byteLength,byteLength:s,integer:o.integer,signed:o.signed,normalized:l,...o.webglOnly?{webglOnly:!0}:{}}}function wf(e){let t=yf.exec(e);if(!t)return;let n=Number(t[2]);if(!Number.isSafeInteger(n))return;let i=t[1];try{let e=r.getVertexFormatInfo(i);if(!Number.isSafeInteger(n*e.components)||!Number.isSafeInteger(n*e.byteLength))return}catch{return}return{elementFormat:i,listSize:n}}function Tf(e,t){if(t)return`f32`;switch(e){case`float32`:return`f32`;case`float16`:return`f16`;case`uint8`:case`uint16`:case`uint32`:return`u32`;case`sint8`:case`sint16`:case`sint32`:return`i32`;default:throw Error(`Unsupported GPUVector component type ${e}`)}}function Ef(e,t){if(e===`unorm10-10-10-2`)return`uint32`;switch(t){case`unorm8`:return`uint8`;case`snorm8`:return`sint8`;case`unorm16`:return`uint16`;case`snorm16`:return`sint16`;default:return t}}function Df(e){let t=0;return Object.freeze(e.map(e=>{let n=Object.freeze({offset:t,length:e.length,data:e});return t+=e.length,n}))}async function Of(e,t){if(e.destroyed)throw Error(`Resource has been destroyed.`);if(e instanceof g){if(!(e.usage&g.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);let n=t.byteOffset??0,r=Math.min(256,t.byteLength??e.byteLength-n);if(n<0||r<0||n+r>e.byteLength)throw Error(`Preview range is outside the buffer.`);return{data:r?await e.readAsync(n,r):new Uint8Array,format:t.format}}let n=e.device.getTextureFormatInfo(e.format);if(n.packed)throw Error(`Packed texture previews are not supported.`);if(e.device.type!==`webgpu`)throw Error(`Texture previews require WebGPU.`);if(!((e.props.usage??0)&p.COPY_SRC))throw Error(`Preview requires COPY_SRC usage.`);if(e.samples!==1||n.compressed||e.format.startsWith(`depth`)||e.format.startsWith(`stencil`))throw Error(`Preview requires a single-sample, uncompressed color texture.`);let r=t.baseMipLevel??0,i=Math.min(32,t.width??Math.max(1,e.width>>r)),a=Math.min(32,t.height??Math.max(1,e.height>>r)),o=e.computeMemoryLayout({width:i,height:a,depthOrArrayLayers:1}),s=e.device.createBuffer({byteLength:o.byteLength,usage:g.MAP_READ|g.COPY_DST}),c=e.device.createCommandEncoder();try{c.copyTextureToBuffer({sourceTexture:e,destinationBuffer:s,mipLevel:r,origin:[0,0,t.baseArrayLayer??0],width:i,height:a,depthOrArrayLayers:1,bytesPerRow:o.bytesPerRow}),e.device.submit(c.finish());let l=await s.readAsync(),u=i*n.bytesPerPixel,d=new Uint8Array(u*a);for(let e=0;e<a;e++)d.set(l.subarray(e*o.bytesPerRow,e*o.bytesPerRow+u),e*u);return{data:d,width:i,height:a,format:e.format}}finally{s.destroy(),c.destroy()}}var kf=class{values=[];constructor(e){this.compare=e}peek(){return this.values[0]}push(e){let t=this.values.length;for(this.values.push(e);t>0;){let n=Math.floor((t-1)/2);if(this.compare(this.values[n],e)<=0)break;this.values[t]=this.values[n],t=n}this.values[t]=e}pop(){let e=this.values[0],t=this.values.pop();if(this.values.length&&t!==void 0){let e=0;for(;e*2+1<this.values.length;){let n=e*2+1;if(n+1<this.values.length&&this.compare(this.values[n+1],this.values[n])<0&&n++,this.compare(t,this.values[n])<=0)break;this.values[e]=this.values[n],e=n}this.values[e]=t}return e}};function Af(e){let t=Kf(e.nodes),n=Zf(t,e.buffers.values()),r=Qf(t,e.textures.values()),i=new Map,a=new Map,o=[];try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}for(let n of t)o.push({node:n,executable:n.compile({device:e.device})})}catch(e){for(let e of o)e.executable.destroy?.();for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}return Mf(e,t,o,i,a,n,r)}async function jf(e){let t=Kf(e.nodes),n=Zf(t,e.buffers.values()),r=Qf(t,e.textures.values()),i=new Map,a=new Map;try{for(let t of n){t.buffer=e.device.createBuffer({id:`${e.id}-transient-buffer-${n.indexOf(t)}`,byteLength:t.byteLength,usage:t.usage});for(let e of t.handles)i.set(e,t.buffer)}for(let t of r){t.texture=e.device.createTexture({...t.descriptor,id:`${e.id}-transient-texture-${r.indexOf(t)}`});for(let e of t.handles)a.set(e,t.texture)}let o=k.beginAsyncCompilation(e.device),s=t.map(async t=>({node:t,executable:t.compileAsync?await t.compileAsync({device:e.device}):t.compile({device:e.device})}));k.endAsyncCompilation(e.device,o);let[c,l]=await Promise.all([Promise.allSettled(s),Promise.allSettled(o)]),u=[],d=l.find(e=>e.status===`rejected`),f=d?.status===`rejected`?d.reason:void 0;for(let e of c)e.status===`fulfilled`?u.push(e.value):f??=e.reason;if(f){for(let e of u)e.executable.destroy?.();throw f}return Mf(e,t,u,i,a,n,r)}catch(e){for(let e of n)e.buffer?.destroy();for(let e of r)e.texture?.destroy();throw e}}function Mf(e,t,n,r,i,a,o){let s=Array.from(e.buffers.values()),c=s.filter(e=>!e.transient),l=s.filter(e=>e.transient),u=ip(c.map(e=>e.byteLength),`imported buffer capacities`),d=ip(l.map(e=>e.byteLength),`logical transient buffer capacities`),f=rp(u,d,`logical buffer capacities`),p=ip(a.map(e=>e.byteLength),`physical transient buffer capacities`),m=Math.max(0,d-p),h=Array.from(e.textures.values()),g=h.filter(e=>!e.transient),_=h.filter(e=>e.transient),v=ip(g.map(np),`imported texture estimates`),y=ip(_.map(np),`logical transient texture estimates`),b=rp(v,y,`logical texture estimates`),x=ip(o.map(e=>e.byteLength),`physical transient texture estimates`),S=Math.max(0,y-x),C={nodeOrder:t.map(e=>e.id),importedBufferCount:c.length,importedBufferBytes:u,logicalBufferCount:s.length,logicalBufferBytes:f,logicalTransientBufferCount:l.length,physicalTransientBufferCount:a.length,logicalTransientBytes:d,physicalTransientBytes:p,reusedTransientBytes:m,reusePercentage:d>0?m/d*100:0,importedTextureCount:g.length,importedTextureBytes:v,logicalTextureCount:h.length,logicalTextureBytes:b,logicalTransientTextureCount:_.length,physicalTransientTextureCount:o.length,logicalTransientTextureBytes:y,physicalTransientTextureBytes:x,reusedTransientTextureBytes:S,textureReusePercentage:y>0?S/y*100:0,logicalResourceBytes:rp(f,b,`logical resource estimates`),physicalTransientResourceBytes:rp(p,x,`physical transient resource estimates`)},w=Pf(e.device,s,t);return{device:e.device,id:e.id,buffers:new Map(e.buffers),textures:new Map(e.textures),externalTextures:new Map(e.externalTextures),compiledNodes:n,transientBuffers:r,transientTextures:i,bufferTransientAllocations:a,textureTransientAllocations:o,stats:C,preflight:w}}function Nf(e){if(`buffer`in e){let t=e.buffer,n=`buffer`in t?t:void 0;return Object.freeze({id:n?n.buffer.id:t.id,kind:`buffer`,usage:e.usage,byteOffset:n?.byteOffset??0,byteLength:n?n.length===0?0:(n.length-1)*n.byteStride+n.rowByteLength:t.byteLength,...n?{format:n.format,length:n.length}:{}})}let t=`texture`in e?e.texture:e.externalTexture;return Object.freeze({id:`texture`in t?t.texture.id:t.id,kind:`externalTexture`in e?`external-texture`:`texture`,usage:e.usage,width:t.width,height:t.height,...`texture`in t?{baseMipLevel:t.baseMipLevel,baseArrayLayer:t.baseArrayLayer,mipLevelCount:t.mipLevelCount,arrayLayerCount:t.arrayLayerCount,aspect:t.aspect}:{},...`format`in t?{format:t.format,depth:t.depth}:{}})}function Pf(e,t,n){let r=n.map(e=>{let t=e.workload??{};return Object.freeze({id:e.id,...e.description===void 0?{}:{description:e.description},type:e.type,resources:Object.freeze((e.resources??[]).map(Nf)),...t.operation?{operation:t.operation}:{},...t.variant?{variant:t.variant}:{},...e.publication?{publication:Object.freeze({...e.publication})}:{},...e.condition?{condition:Object.freeze(e.condition.source===`cpu`?{id:e.condition.id,source:`cpu`,mode:`skip`}:{id:e.condition.id,source:`gpu`,mode:`indirect`,bufferId:e.condition.buffer.id,byteOffset:e.condition.byteOffset??0})}:{},commandCount:t.commandCount??0,maximumWorkgroupCount:t.maximumWorkgroupCount??0,maximumInvocationCount:t.maximumInvocationCount??0,readByteLength:t.readByteLength??0,writeByteLength:t.writeByteLength??0})}),i=t.reduce((e,t)=>Math.max(e,t.byteLength),0),a=n.reduce((e,t)=>{for(let n of t.resources??[])Lf(n)&&(n.usage===`storage-read`||n.usage===`storage-write`||n.usage===`storage-read-write`)&&(e=Math.max(e,Bf(n.buffer).size));return e},0),o=e=>r.reduce((t,n)=>{let r=n[e];return typeof r==`number`?rp(t,r,`workload estimates`):t},0);return Object.freeze({nodes:Object.freeze(r),annotatedNodeCount:n.filter(e=>e.workload!==void 0).length,conditionalNodeCount:n.filter(e=>e.condition!==void 0).length,commandCount:o(`commandCount`),maximumWorkgroupCount:o(`maximumWorkgroupCount`),maximumInvocationCount:o(`maximumInvocationCount`),readByteLength:o(`readByteLength`),writeByteLength:o(`writeByteLength`),largestBufferByteLength:i,largestStorageBufferBindingByteLength:a,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,fitsDeviceLimits:i<=e.limits.maxBufferSize&&a<=e.limits.maxStorageBufferBindingSize})}function Ff(e){return`buffer`in e?e.buffer:e}function If(e){return`texture`in e?e.texture:e}function Lf(e){return`buffer`in e}function Rf(e){return`texture`in e}function zf(e){if(e.type===`copy`)return;let t=(e.resources??[]).filter(e=>Lf(e)&&(e.usage===`storage-read`||e.usage===`storage-write`||e.usage===`storage-read-write`));for(let n=0;n<t.length;n++){let r=t[n];for(let i=n+1;i<t.length;i++){let n=t[i];if(r.buffer===n.buffer||Ff(r.buffer)!==Ff(n.buffer)||!Uf(r.usage)&&!Uf(n.usage))continue;let a=Bf(r.buffer),o=Bf(n.buffer);if(a.offset<o.offset+o.size&&o.offset<a.offset+a.size){let t=Ff(r.buffer);throw Error(`GPUCommandGraph node "${e.id}" has overlapping writable storage bindings for buffer "${t.id}" (${Vf(a)} and ${Vf(o)}). Bind the shared range once or align the views to non-overlapping storage binding ranges.`)}}}}function Bf(e){if(!(`buffer`in e))return{offset:0,size:e.byteLength};let t=Math.floor(e.byteOffset/256)*256,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function Vf(e){return`${e.offset}–${e.offset+e.size} bytes`}function Hf(e){return e===`storage-read`||e===`storage-read-write`||e===`uniform`||e===`copy-source`||e===`indirect`||e===`vertex`||e===`index`}function Uf(e){return e===`storage-write`||e===`storage-read-write`||e===`copy-destination`}function Wf(e){return e===`sampled`||e===`storage-read`||e===`storage-read-write`||e===`render-attachment`||e===`copy-source`}function Gf(e){return e===`storage-write`||e===`storage-read-write`||e===`render-attachment`||e===`copy-destination`}function Kf(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=new Map,i=new Map,a=new Map;for(let o of e){let e=new Set(o.dependsOn??[]);for(let n of e)if(!t.has(n))throw Error(`GPUCommandGraph node "${o.id}" depends on missing node "${n}"`);for(let t of o.resources??[])if(Lf(t)){let n=Ff(t.buffer);if(Hf(t.usage)){let t=r.get(n);t&&e.add(t);let a=i.get(n)??new Set;a.add(o.id),i.set(n,a)}if(Uf(t.usage)){let t=r.get(n);t&&e.add(t);for(let t of i.get(n)??[])t!==o.id&&e.add(t);i.set(n,new Set),r.set(n,o.id)}}else if(Rf(t)){let n=If(t.texture),r=a.get(n)??[];for(let n of r)n.nodeId!==o.id&&qf(n.resource,t)&&(Wf(t.usage)&&Gf(n.resource.usage)||Gf(t.usage)&&(Wf(n.resource.usage)||Gf(n.resource.usage)))&&e.add(n.nodeId);r.push({nodeId:o.id,resource:t}),a.set(n,r)}e.delete(o.id),n.set(o.id,e)}let o=e.map(()=>[]),s=new Map(e.map((e,t)=>[e.id,t])),c=e.map(e=>n.get(e.id).size);for(let[t,r]of e.entries())for(let e of n.get(r.id))o[s.get(e)].push(t);let l=c.flatMap((e,t)=>e===0?[t]:[]),u=[];for(;l.length;){let t=[];for(let n of l){u.push(e[n]);for(let e of o[n])--c[e]===0&&t.push(e)}l=t.sort((e,t)=>e-t)}if(u.length!==e.length)throw Error(`GPUCommandGraph contains a dependency cycle`);return u}function qf(e,t){if(If(e.texture)!==If(t.texture))return!1;let n=Jf(e.texture),r=Jf(t.texture);return Yf(n.aspect,r.aspect)&&Xf(n.baseMipLevel,n.mipLevelCount,r.baseMipLevel,r.mipLevelCount)&&Xf(n.baseArrayLayer,n.arrayLayerCount,r.baseArrayLayer,r.arrayLayerCount)}function Jf(e){return`texture`in e?e:{aspect:`all`,baseMipLevel:0,mipLevelCount:e.mipLevels,baseArrayLayer:0,arrayLayerCount:e.dimension===`3d`?1:e.depth}}function Yf(e,t){return e===`all`||t===`all`||e===t}function Xf(e,t,n,r){return e<n+r&&n<e+t}function Zf(e,t){let n=$f(e,e=>Lf(e)?Ff(e.buffer):null),r=new Map;e.forEach((e,t)=>{if(!e.retainedBuffers?.length)return;let n=r.get(e.retainedBuffers);n?n.lastUse=t:r.set(e.retainedBuffers,{firstUse:t,lastUse:t})});for(let[e,t]of r)for(let r of e){if(!r.transient)continue;let e=n.get(r);n.set(r,{firstUse:Math.min(e?.firstUse??t.firstUse,t.firstUse),lastUse:Math.max(e?.lastUse??t.lastUse,t.lastUse)})}let i=[],a=Array.from(t).filter(e=>e.transient).map(e=>({buffer:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1)),o=new kf((e,t)=>e.allocation.lastUse-t.allocation.lastUse||e.index-t.index),s=new Map,c=e=>{let t=e&(g.MAP_READ|g.MAP_WRITE),n=s.get(t);return n||(n=new kf((e,t)=>e.allocation.byteLength-t.allocation.byteLength||e.index-t.index),s.set(t,n)),n};for(let{buffer:e,lifetime:t}of a){if(!t)continue;for(;o.peek()&&o.peek().allocation.lastUse<t.firstUse;){let e=o.pop();c(e.allocation.usage).push(e)}let n=c(e.usage).pop();n||(n={allocation:{byteLength:0,usage:0,lastUse:-1,handles:[]},index:i.length},i.push(n.allocation));let{allocation:r}=n;r.byteLength=Math.max(r.byteLength,e.byteLength),r.usage|=e.usage,r.lastUse=t.lastUse,r.handles.push(e),o.push(n)}return i}function Qf(e,t){let n=$f(e,e=>Rf(e)?If(e.texture):null),r=[],i=Array.from(t).filter(e=>e.transient).map(e=>({texture:e,lifetime:n.get(e)})).sort((e,t)=>(e.lifetime?.firstUse??2**53-1)-(t.lifetime?.firstUse??2**53-1));for(let{texture:e,lifetime:t}of i){if(!t)continue;let n=r.find(n=>n.lastUse<t.firstUse&&tp(n.descriptor,e));n||(n={descriptor:ep(e),byteLength:np(e),lastUse:-1,handles:[]},r.push(n)),n.descriptor.usage|=e.usage,n.lastUse=t.lastUse,n.handles.push(e)}return r}function $f(e,t){let n=new Map;return e.forEach((e,r)=>{for(let i of e.resources??[]){let e=t(i);if(!e||!(`transient`in e)||!e.transient)continue;let a=n.get(e);a?a.lastUse=r:n.set(e,{firstUse:r,lastUse:r})}}),n}function ep(e){return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:e.dimension,depth:e.depth,mipLevels:e.mipLevels,samples:e.samples}}function tp(e,t){return e.format===t.format&&e.width===t.width&&e.height===t.height&&e.dimension===t.dimension&&e.depth===t.depth&&e.mipLevels===t.mipLevels&&e.samples===t.samples}function np(e){let t=0;for(let n=0;n<e.mipLevels;n++)t=rp(t,l.computeMemoryLayout({format:e.format,width:Math.max(1,e.width>>n),height:e.dimension===`1d`?1:Math.max(1,e.height>>n),depth:e.dimension===`3d`?Math.max(1,e.depth>>n):e.depth,byteAlignment:1}).byteLength,`texture "${e.id}" mip estimates`);let n=t*e.samples;if(!Number.isSafeInteger(n))throw Error(`GPUCommandGraph texture "${e.id}" byte estimate exceeds safe integer range`);return n}function rp(e,t,n){let r=e+t;if(!Number.isSafeInteger(r))throw Error(`GPUCommandGraph ${n} exceed safe integer range`);return r}function ip(e,t){return e.reduce((e,n)=>rp(e,n,t),0)}var ap=class{id;byteLength;usage;transient;graph;defaultBuffer;constructor(e,t,n,r){this.graph=e,this.id=t.id,this.byteLength=t.byteLength,this.usage=t.usage,this.transient=n,this.defaultBuffer=r}},op=class{buffer;format;length;byteOffset;byteStride;rowByteLength;constructor(e,t){this.buffer=e,this.format=t.format,this.length=t.length,this.byteOffset=t.byteOffset,this.byteStride=t.byteStride,this.rowByteLength=t.rowByteLength}},F=class{chunks;id;name;format;length;valueLength;stride;byteStride;rowByteLength;data;constructor(e){if(this.id=e.id,this.name=e.name,this.format=e.format,this.length=e.length,this.valueLength=e.valueLength,this.stride=e.stride,this.byteStride=e.byteStride,this.rowByteLength=e.rowByteLength,e.data.some(t=>t.format!==e.format)||e.data.reduce((e,t)=>e+t.length,0)!==e.length)throw Error(`${e.id} length must equal its ordered source chunks, with matching formats`);this.data=Object.freeze([...e.data]),this.chunks=Df(this.data)}},sp=class{id;format;width;height;usage;dimension;depth;mipLevels;samples;transient;frameScoped;graph;defaultTexture;constructor(e,t,n,r,i=!1){this.graph=e,this.id=t.id,this.format=t.format,this.width=t.width,this.height=t.height,this.usage=t.usage,this.dimension=t.dimension,this.depth=t.depth,this.mipLevels=t.mipLevels,this.samples=t.samples,this.transient=n,this.frameScoped=i,this.defaultTexture=r}},cp=class{id;width;height;graph;constructor(e,t){this.graph=e,this.id=t.id,this.width=t.width,this.height=t.height}},lp=class{texture;format;dimension;aspect;baseMipLevel;mipLevelCount;baseArrayLayer;arrayLayerCount;width;height;depth;constructor(e,t){this.texture=e,this.format=e.format,this.dimension=t.dimension,this.aspect=t.aspect,this.baseMipLevel=t.baseMipLevel,this.mipLevelCount=t.mipLevelCount,this.baseArrayLayer=t.baseArrayLayer,this.arrayLayerCount=t.arrayLayerCount,this.width=t.width,this.height=t.height,this.depth=t.depth}};function up(e,t){switch(t.type){case`compute`:{let{type:n,...r}=t;e.addComputePass(r);return}case`render`:{let{type:n,...r}=t;e.addRenderPass(r);return}case`copy`:{let{type:n,...r}=t;e.addCopyPass(r);return}}}function dp(e,t){for(let n of t)up(e,n)}function fp(e){return{...e,type:`compute`}}var pp=4,mp=class{nodeCount;budget;plan;encodeNodeRange;nextStepIndex=0;currentPublishedProgress=0;constructor(e){bp(e.budget),this.plan=e.plan,this.nodeCount=e.plan.nodeCount,this.budget=Object.freeze({...e.budget}),this.encodeNodeRange=e.encodeNodeRange}get completed(){return this.nextStepIndex>=this.plan.stepCount}get progress(){return this.plan.stepCount===0?1:this.nextStepIndex/this.plan.stepCount}get publishedProgress(){return this.currentPublishedProgress}encodeNext(e,t){if(this.completed)throw Error(`GPUCommandGraph execution has already completed`);let n=this.plan.steps[this.nextStepIndex],r=this.encodeNodeRange(e,t,n.firstNodeIndex,n.nextNodeIndex);return this.nextStepIndex++,n.publishable&&(this.currentPublishedProgress=this.progress),{...n,encoding:r,progress:this.progress,completed:this.completed,publishedProgress:this.publishedProgress}}};function hp(e,t,n={}){bp(t);let r=n.latencyPriority??`normal`,i=n.publicationPolicy??`final`;if(![`interactive`,`normal`,`background`].includes(r))throw Error(`GPUCommandGraph execution latency priority "${r}" is invalid`);if(![`final`,`progressive`].includes(i))throw Error(`GPUCommandGraph execution publication policy "${i}" is invalid`);let a=e.nodes,o=[],s=0;for(;s<a.length;){let e=s,n=gp();for(;s<a.length;){let r=_p(n,a[s]);if(s>e&&vp(r,t)||(n=r,s++,i===`progressive`&&a[s-1].publication)||yp(n,t))break}let c=i===`progressive`?Object.freeze(a.slice(e,s).flatMap(e=>e.publication?[e.publication]:[])):Object.freeze([]),l=s===a.length;o.push(Object.freeze({stepIndex:o.length,firstNodeIndex:e,nextNodeIndex:s,...n,exceedsBudget:vp(n,t),latencyPriority:r,publications:c,publishable:l||c.length>0}))}let c=a.reduce((e,t)=>_p(e,t),gp());return Object.freeze({...c,annotatedNodeCount:e.annotatedNodeCount,stepCount:o.length,oversizedStepCount:o.filter(e=>e.exceedsBudget).length,latencyPriority:r,publicationPolicy:i,publicationCount:o.reduce((e,t)=>e+t.publications.length,0),steps:Object.freeze(o)})}function gp(){return{nodeCount:0,commandCount:0,maximumInvocationCount:0,readByteLength:0,writeByteLength:0,conditionalNodeCount:0}}function _p(e,t){return{nodeCount:e.nodeCount+1,commandCount:e.commandCount+t.commandCount,maximumInvocationCount:e.maximumInvocationCount+t.maximumInvocationCount,readByteLength:e.readByteLength+t.readByteLength,writeByteLength:e.writeByteLength+t.writeByteLength,conditionalNodeCount:e.conditionalNodeCount+(t.condition?1:0)}}function vp(e,t){return e.maximumInvocationCount>t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>t.maximumWriteByteLength}function yp(e,t){return e.maximumInvocationCount>=t.maximumInvocationCount||t.maximumNodeCount!==void 0&&e.nodeCount>=t.maximumNodeCount||t.maximumCommandCount!==void 0&&e.commandCount>=t.maximumCommandCount||t.maximumReadByteLength!==void 0&&e.readByteLength>=t.maximumReadByteLength||t.maximumWriteByteLength!==void 0&&e.writeByteLength>=t.maximumWriteByteLength}function bp(e){let t=[[`maximumInvocationCount`,e.maximumInvocationCount],[`maximumNodeCount`,e.maximumNodeCount],[`maximumCommandCount`,e.maximumCommandCount],[`maximumReadByteLength`,e.maximumReadByteLength],[`maximumWriteByteLength`,e.maximumWriteByteLength]];for(let[e,n]of t)if(n!==void 0&&(!Number.isSafeInteger(n)||n<=0))throw Error(`GPUCommandGraph execution ${e} must be a positive safe integer`)}function xp(e,t,n,r){let i=0;return{computePass:new Proxy(e,{get(e,a){if(a===`dispatch`)return()=>{if(i>0)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`);i++,e.dispatchIndirect(t,n)};if(a===`dispatchIndirect`)return()=>{throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must use dispatch(); the graph supplies its indirect command`)};let o=Reflect.get(e,a,e);return typeof o==`function`?o.bind(e):o}}),assertDispatched:()=>{if(i!==1)throw Error(`GPUCommandGraph GPU-conditional compute node "${r}" must encode exactly one dispatch`)}}}var Sp=class{stats;canReadGPUTimings;nodes;constructor(e,t,n=e.filter(e=>e.stats.type===`compute`&&e.stats.condition?.outcome!==`skipped`).length,r,i,a){this.readResource=a,this.nodes=e,this.canReadGPUTimings=e.some(e=>e.timestamp!==void 0);let o=e.filter(e=>e.stats.condition?.outcome!==`skipped`),s=o.filter(e=>e.stats.type===`compute`).length;this.stats={cpuEncodeTimeMilliseconds:t,cpuEncodeStartTimeMilliseconds:r,cpuEncodeEndTimeMilliseconds:i,nodeCount:o.length,skippedNodeCount:e.length-o.length,computePassCount:n,coalescedComputeNodeCount:s-n,timestampedNodeCount:e.filter(e=>e.timestamp!==void 0).length,nodes:e.map(e=>e.stats)}}async readTimings(){let e=await Promise.all(this.nodes.map(async({stats:e,timestamp:t})=>{if(!t)return{...e};let{querySet:n,snapshot:r,beginIndex:i,endIndex:a}=t;if(n.device.type!==`webgpu`)return{...e,gpuTimeMilliseconds:await n.readTimestampDuration(i,a)};let o=await(r??n).readResults({firstQuery:i,queryCount:a-i+1}),s=o[0],c=o[o.length-1];return{...e,gpuStartTimeMilliseconds:Number(s)/1e6,gpuEndTimeMilliseconds:Number(c)/1e6,gpuTimeMilliseconds:Number(c-s)/1e6}})),t=e.filter(e=>e.gpuTimeMilliseconds!==void 0),n=e.filter(e=>e.gpuStartTimeMilliseconds!==void 0),r=this.nodes.flatMap(e=>e.timestamp?.snapshot?.clockCorrelation?[e.timestamp.snapshot.clockCorrelation]:[]).sort((e,t)=>e.uncertaintyMilliseconds-t.uncertaintyMilliseconds)[0];return{...r?{clockCorrelation:r}:{},cpuEncodeStartTimeMilliseconds:this.stats.cpuEncodeStartTimeMilliseconds,cpuEncodeEndTimeMilliseconds:this.stats.cpuEncodeEndTimeMilliseconds,...n.length>0?{gpuStartTimeMilliseconds:Math.min(...n.map(e=>e.gpuStartTimeMilliseconds)),gpuEndTimeMilliseconds:Math.max(...n.map(e=>e.gpuEndTimeMilliseconds))}:{},cpuEncodeTimeMilliseconds:this.stats.cpuEncodeTimeMilliseconds,...t.length>0?{gpuTimeMilliseconds:t.reduce((e,t)=>e+(t.gpuTimeMilliseconds??0),0)}:{},nodes:e}}},Cp=class{device;id;autotuner;buffers=new Map;textures=new Map;externalTextures=new Map;importedBufferHandles=new Map;dynamicBufferHandles=new Map;nodes=[];nodeIds=new Set;compiled=!1;constructor(e,t={}){if(e.type!==`webgpu`)throw Error(`GPUCommandGraph requires a WebGPU device`);Mp(e,`construction`),this.device=e,this.id=t.id??`gpu-command-graph`,this.autotuner=t.autotuner}importBuffer(e,t){this.assertMutable(),Pp(e,this.device),t&&zp(t,e,this.device);let n=this.addBuffer(new ap(this,e,!1,t));if(t){let e=Tp(t);this.importedBufferHandles.has(e)||this.importedBufferHandles.set(e,n),t instanceof j&&!this.dynamicBufferHandles.has(t)&&this.dynamicBufferHandles.set(t,n)}return n}createTransientBuffer(e){return this.assertMutable(),Pp(e,this.device),this.addBuffer(new ap(this,e,!0))}createDataView(e,t){this.assertBuffer(e);let n=Cf(t.format),r=t.byteOffset??0,i=t.rowByteLength??n.byteLength,a=t.byteStride??i;return Rp(e,{length:t.length,byteOffset:r,byteStride:a,rowByteLength:i}),new op(e,{format:t.format,length:t.length,byteOffset:r,byteStride:a,rowByteLength:i})}importGPUData(e,t){return this.importGPUDataView(e,t)}importGPUVector(e,t){if(t.bufferLayout)throw Error(`GPUCommandGraph import "${e}" does not accept interleaved GPUVector data`);let n=t.format??t.data[0]?.format;if(!n)throw Error(`GPUCommandGraph import "${e}" requires GPUVector.format`);if(bf(n)||xf(n))throw Error(`GPUCommandGraph import "${e}" requires a fixed-width GPUVector format`);let r=Cf(n),i=t.data.map((r,i)=>{if(r.format!==n)throw Error(`GPUCommandGraph import "${e}" requires matching GPUVector chunk formats`);let a=t.data.length===1?e:`${e}-chunk-${i}`;return this.importGPUDataView(a,r)});return new F({id:e,name:t.name??e,format:n,length:t.length,valueLength:t.valueLength??t.data.reduce((e,t)=>e+t.valueLength,0),stride:t.stride??t.data[0]?.stride??r.components*(r.listSize??1),byteStride:t.byteStride??i[0]?.byteStride??r.byteLength,rowByteLength:t.rowByteLength??i[0]?.rowByteLength??r.byteLength,data:i})}importTexture(e,t){this.assertMutable();let n=Ip(e,this.device);return t&&Bp(t,n,this.device),this.addTexture(new sp(this,n,!1,t))}importFrameTexture(e){this.assertMutable();let t=Ip(e,this.device);return this.addTexture(new sp(this,t,!1,void 0,!0))}importExternalTexture(e){return this.assertMutable(),Fp(e,this.device),this.addExternalTexture(new cp(this,e))}createTransientTexture(e){this.assertMutable();let t=Ip(e,this.device);return this.addTexture(new sp(this,t,!0))}createTextureView(e,t={}){return this.assertTexture(e),new lp(e,Lp(e,t))}add(e){if(this.assertMutable(),`getNodes`in e)for(let t of e.getNodes())this.add(t);else if(`getCommandNodes`in e)dp(this,e.getCommandNodes(this));else if(`type`in e)up(this,e);else for(let t of e)this.add(t)}addComputePass(e){this.addNode({...e,type:`compute`})}addRenderPass(e){e.attachments&&this.validateRenderAttachments(e.id,e.attachments);let t=e.attachments?[...e.attachments.colorAttachments.map(e=>({texture:e,usage:`render-attachment`})),...(e.attachments.resolveTargets??[]).filter(e=>e!==null).map(e=>({texture:e,usage:`render-attachment`})),...e.attachments.depthStencilAttachment?[{texture:e.attachments.depthStencilAttachment,usage:`render-attachment`}]:[]]:[];this.addNode({...e,resources:[...e.resources??[],...t],type:`render`})}addCopyPass(e){this.addNode({...e,type:`copy`})}compile(){return this.assertMutable(),Mp(this.device,`compilation`),this.compiled=!0,new wp(Af({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}async compileAsync(){return this.assertMutable(),Mp(this.device,`compilation`),this.compiled=!0,new wp(await jf({device:this.device,id:this.id,buffers:this.buffers,textures:this.textures,externalTextures:this.externalTextures,nodes:this.nodes}))}addNode(e){if(this.assertMutable(),!e.id)throw Error(`GPUCommandGraph node id is required`);if(this.nodeIds.has(e.id))throw Error(`GPUCommandGraph node id "${e.id}" is already in use`);for(let[t,n]of Object.entries(e.workload??{}))if(t===`operation`||t===`variant`){if(typeof n!=`string`||!n)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be nonempty`)}else if(typeof n!=`number`||!Number.isSafeInteger(n)||n<0)throw Error(`GPUCommandGraph node "${e.id}" workload ${t} must be a nonnegative safe integer`);if(e.condition){if(!e.condition.id)throw Error(`GPUCommandGraph node "${e.id}" condition id is required`);if(e.condition.source===`cpu`){if(typeof e.condition.evaluate!=`function`)throw Error(`GPUCommandGraph node "${e.id}" CPU condition requires an evaluate function`)}else{let t=e.condition;if(e.type!==`compute`||t.mode!==`indirect`)throw Error(`GPUCommandGraph node "${e.id}" GPU conditions require an indirect compute node`);if(!t.buffer)throw Error(`GPUCommandGraph node "${e.id}" GPU condition requires an indirect command buffer`);this.assertBuffer(t.buffer);let n=t.byteOffset??0;if(!Number.isSafeInteger(n)||n<0||n%4!=0)throw Error(`GPUCommandGraph node "${e.id}" GPU condition byteOffset must be a nonnegative multiple of 4`);if(n+3*pp>t.buffer.byteLength)throw Error(`GPUCommandGraph node "${e.id}" GPU condition indirect command exceeds buffer "${t.buffer.id}"`);(e.resources??[]).some(e=>Lf(e)&&Ff(e.buffer)===t.buffer&&e.usage===`indirect`)||(e={...e,resources:[...e.resources??[],{buffer:t.buffer,usage:`indirect`}]})}}if(e.publication){if(e.condition)throw Error(`GPUCommandGraph node "${e.id}" cannot combine conditional execution with a publication boundary`);if(!e.publication.id)throw Error(`GPUCommandGraph node "${e.id}" publication id is required`);if(![`partial`,`complete`].includes(e.publication.completeness))throw Error(`GPUCommandGraph node "${e.id}" publication completeness is invalid`)}for(let t of e.resources??[])if(Lf(t)){let e=Ff(t.buffer);this.assertBuffer(e),Hp(e,t.usage)}else if(Rf(t)){let e=If(t.texture);this.assertTexture(e),Up(e,t.usage),Wp(t.texture,t.usage)}else{if(this.assertExternalTexture(t.externalTexture),t.usage!==`sampled`)throw Error(`GPUCommandGraph external textures support sampled access only`);if(e.type!==`render`)throw Error(`GPUCommandGraph external textures can be sampled only by render nodes`)}zf(e),this.nodeIds.add(e.id),this.nodes.push(e)}addBuffer(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.buffers.set(e.id,e),e}addTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.textures.set(e.id,e),e}addExternalTexture(e){if(this.buffers.has(e.id)||this.textures.has(e.id)||this.externalTextures.has(e.id))throw Error(`GPUCommandGraph resource id "${e.id}" is already in use`);return this.externalTextures.set(e.id,e),e}importGPUDataView(e,t){if(!t.format)throw Error(`GPUCommandGraph import "${e}" requires GPUData.format`);let n=Tp(t.buffer),r={byteLength:Ep(t),usage:n.usage},i=t.buffer instanceof j?this.getDynamicBufferHandle(t.buffer,r):this.getImportedBufferHandle(n,r);return i||(i=this.importBuffer({id:e,byteLength:n.byteLength,usage:n.usage},t.buffer),t.buffer instanceof j?this.dynamicBufferHandles.set(t.buffer,i):this.importedBufferHandles.set(n,i)),this.createDataView(i,{format:t.format,length:t.length,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}getDynamicBufferHandle(e,t){let n=this.dynamicBufferHandles.get(e);if(n?.defaultBuffer===e&&Dp(n,t))return n;this.dynamicBufferHandles.delete(e);for(let n of this.buffers.values())if(n.defaultBuffer===e&&Dp(n,t))return this.dynamicBufferHandles.set(e,n),n}getImportedBufferHandle(e,t){let n=this.importedBufferHandles.get(e);if(n?.defaultBuffer&&Tp(n.defaultBuffer)===e&&Dp(n,t))return n;this.importedBufferHandles.delete(e);for(let[n,r]of this.dynamicBufferHandles)if(n.buffer===e&&Dp(r,t))return this.importedBufferHandles.set(e,r),r;for(let n of this.buffers.values())if(n.defaultBuffer===e&&Dp(n,t))return this.importedBufferHandles.set(e,n),n}assertBuffer(e){if(e.graph!==this||this.buffers.get(e.id)!==e)throw Error(`Graph buffer "${e.id}" does not belong to ${this.id}`)}assertTexture(e){if(e.graph!==this||this.textures.get(e.id)!==e)throw Error(`Graph texture "${e.id}" does not belong to ${this.id}`)}assertExternalTexture(e){if(e.graph!==this||this.externalTextures.get(e.id)!==e)throw Error(`Graph external texture "${e.id}" does not belong to ${this.id}`)}assertMutable(){if(this.compiled)throw Error(`GPUCommandGraph "${this.id}" has already been compiled`)}validateRenderAttachments(e,t){if(t.colorAttachments.length===0&&!t.depthStencilAttachment)throw Error(`GPUCommandGraph render node "${e}" requires at least one attachment`);let n=[...t.colorAttachments,...t.depthStencilAttachment?[t.depthStencilAttachment]:[]];for(let t of n)if(this.assertTexture(t.texture),t.dimension!==`2d`||t.mipLevelCount!==1||t.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" attachments must be single-mip, single-layer 2d views`);let[r,...i]=n;for(let t of i)if(t.width!==r.width||t.height!==r.height||t.texture.samples!==r.texture.samples)throw Error(`GPUCommandGraph render node "${e}" attachments must have matching extent and samples`);this.validateResolveTargets(e,t)}validateResolveTargets(e,t){let n=t.resolveTargets;if(n){if(this.device.type!==`webgpu`)throw Error(`GPUCommandGraph render node "${e}" resolve targets require WebGPU`);if(n.length!==t.colorAttachments.length)throw Error(`GPUCommandGraph render node "${e}" requires one resolve entry per color attachment`);for(let r=0;r<n.length;r++){let i=n[r];if(!i)continue;let a=t.colorAttachments[r];if(this.assertTexture(i.texture),a.texture.samples<=1||i.texture.samples!==1||a.format!==i.format||a.width!==i.width||a.height!==i.height)throw Error(`GPUCommandGraph render node "${e}" resolve target ${r} must match a multisampled source and be single-sampled`);if(i.dimension!==`2d`||i.aspect!==`all`||i.mipLevelCount!==1||i.arrayLayerCount!==1)throw Error(`GPUCommandGraph render node "${e}" resolve targets must be single-mip, single-layer 2d color views`)}}}},wp=class{device;id;stats;preflight;capabilities;buffers;textures;externalTextures;compiledNodes;activeImportedBufferHandles=new Set;writableImportedBufferHandles=new Set;activeImportedTextureHandles=new Set;writableImportedTextureHandles=new Set;transientBuffers;transientTextures;bufferTransientAllocations;textureTransientAllocations;cachedTextureViews=[];cachedFramebuffers=[];lastFrameIds=new Map;lastExternalTextureFrameIds=new Map;consumedExternalTextures=new WeakSet;destroyed=!1;get[Symbol.toStringTag](){return`CompiledGPUCommandGraph`}toString(){let e=this.destroyed?`destroyed`:`active`;return`${this[Symbol.toStringTag]}:"${this.id}":${this.stats.nodeOrder.length} nodes:${this.stats.physicalTransientResourceBytes}B transient:${e}`}toJSON(){return this.toString()}constructor(e){this.device=e.device,this.id=e.id,this.buffers=e.buffers,this.textures=e.textures,this.externalTextures=e.externalTextures,this.compiledNodes=e.compiledNodes;for(let{node:e}of this.compiledNodes)for(let t of e.resources??[])if(Lf(t)){let e=Ff(t.buffer);e.transient||(this.activeImportedBufferHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`copy-destination`)&&this.writableImportedBufferHandles.add(e))}else if(Rf(t)){let e=If(t.texture);e.transient||(this.activeImportedTextureHandles.add(e),(t.usage===`storage-write`||t.usage===`storage-read-write`||t.usage===`render-attachment`||t.usage===`copy-destination`)&&this.writableImportedTextureHandles.add(e))}this.transientBuffers=e.transientBuffers,this.transientTextures=e.transientTextures,this.bufferTransientAllocations=e.bufferTransientAllocations,this.textureTransientAllocations=e.textureTransientAllocations,this.stats=e.stats,this.preflight=e.preflight,this.capabilities=jp(this.device)}encode(e,t){return this.encodeNodeRange(e,t,0,this.compiledNodes.length)}getExecutionPlan(e,t={}){return hp(this.preflight,e,t)}createExecution(e,t={}){return new mp({plan:this.getExecutionPlan(e,t),budget:e,encodeNodeRange:(e,t,n,r)=>this.encodeNodeRange(e,t,n,r)})}encodeNodeRange(e,t,n,r){if(this.destroyed)throw Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);if(Mp(this.device,`encoding`),e.device!==this.device)throw Error(`GPUCommandGraph command encoder must belong to the graph device`);let i=Np(),a=this.resolveImportedBuffers(t.buffers??{});kp(t.frameTextures??{},t.externalTextures??{});let o=this.resolveImportedTextures(t.textures??{},t.frameTextures??{}),s=this.resolveExternalTextures(t.externalTextures??{});for(let[e,t]of o.frameIds)this.lastFrameIds.set(e,t);for(let[e,t]of s.frameIds)this.lastExternalTextureFrameIds.set(e,t);for(let e of s.textures.values())this.consumedExternalTextures.add(e);let c=o.textures,l=e=>{let t=Ff(e),n=t.transient?this.transientBuffers.get(t):a.get(t);if(!n)throw Error(`GPUCommandGraph buffer "${t.id}" is not bound`);return n},u=e=>{let t=If(e),n=t.transient?this.transientTextures.get(t):c.get(t);if(!n)throw Error(`GPUCommandGraph texture "${t.id}" is not bound`);return n},d=e=>{let t=u(e);if(e instanceof sp||qp(e))return t.view;if(e.texture.frameScoped){let t=this.lastFrameIds.get(e.texture);for(let n=this.cachedTextureViews.length-1;n>=0;n--){let r=this.cachedTextureViews[n];r.logicalView===e&&r.frameId!==t&&(this.destroyFramebuffersUsingView(r.view),r.view.destroy(),this.cachedTextureViews.splice(n,1))}}let n=this.cachedTextureViews.find(n=>n.logicalView===e&&n.texture===t&&(!e.texture.frameScoped||n.frameId===this.lastFrameIds.get(e.texture)));if(n)return n.view;let r=t.createView({format:e.format,dimension:e.dimension,aspect:e.aspect,baseMipLevel:e.baseMipLevel,mipLevelCount:e.mipLevelCount,baseArrayLayer:e.baseArrayLayer,arrayLayerCount:e.arrayLayerCount});return this.cachedTextureViews.push({logicalView:e,texture:t,view:r,...e.texture.frameScoped?{frameId:this.lastFrameIds.get(e.texture)}:{}}),r},f={commandEncoder:e,parameters:t.parameters,getBuffer:l,getTexture:u,getTextureView:d,getExternalTexture:e=>{let t=s.textures.get(e);if(!t)throw Error(`GPUCommandGraph external texture "${e.id}" is not bound`);return t}},p=[],m,h=0,_=t.coalesceComputePasses!==!1&&e.getTimeProfilingQuerySet()===null,v=()=>{let e=m;m=void 0,e?.end()};try{for(let i=n;i<r;i++){let{node:n,executable:r}=this.compiledNodes[i],a=Np();if(n.condition?.source===`cpu`){let e=!1;try{e=n.condition.evaluate(t.parameters)}catch(e){let t=e instanceof Error?e.message:String(e);throw Error(`GPUCommandGraph CPU condition "${n.condition.id}" failed for node "${n.id}": ${t}`)}if(!e){let e=Np();p.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:e,cpuEncodeTimeMilliseconds:e-a,hasGPUTimestamps:!1,condition:{id:n.condition.id,source:`cpu`,outcome:`skipped`}}});continue}}let o;switch(n.type){case`compute`:{m||(m=e.beginComputePass({id:n.id}),h++);let t=m;o=Ap(t,e),o&&(_=!1),t.pushDebugGroup(n.id);try{let e=n.condition?.source===`gpu`?n.condition:void 0,i=e?xp(t,l(e.buffer),e.byteOffset??0,n.id):void 0;r.encode({...f,computePass:i?.computePass??t}),i?.assertDispatched()}finally{t.popDebugGroup()}_||v();break}case`render`:{v();let t=r,i=t.getRenderPassProps?.(f)??{id:n.id};if(n.attachments&&i.framebuffer!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply framebuffer with graph attachments`);if(n.attachments?.resolveTargets&&i.resolveTargets!==void 0)throw Error(`GPUCommandGraph render node "${n.id}" cannot supply resolveTargets with graph attachments`);let a=n.attachments?this.getFramebuffer(n.id,n.attachments,d):void 0,s=n.attachments?.resolveTargets?.map(e=>e?d(e):null),c=e.beginRenderPass({...i,...a?{framebuffer:a}:{},...s?{resolveTargets:s}:{}});o=Ap(c,e),c.pushDebugGroup(n.id);try{t.encode({...f,renderPass:c})}finally{c.popDebugGroup(),c.end()}break}case`copy`:v(),r.encode(f);break}let s=Np();p.push({stats:{id:n.id,description:n.description,resources:this.preflight.nodes[i].resources,operation:n.workload?.operation,type:n.type,cpuEncodeStartTimeMilliseconds:a,cpuEncodeEndTimeMilliseconds:s,cpuEncodeTimeMilliseconds:s-a,hasGPUTimestamps:o!==void 0,...n.condition?{condition:{id:n.condition.id,source:n.condition.source,outcome:n.condition.source===`gpu`?`gpu-resolved`:`executed`}}:{}},timestamp:o})}}finally{v()}let y=Np();return new Sp(p,y-i,h,i,y,async(e,t)=>{if(this.destroyed)throw Error(`Graph has been destroyed.`);let n=this.compiledNodes.findIndex(({node:t})=>t.id===e),r=this.compiledNodes[n]?.node.resources?.[t],i=this.preflight.nodes[n]?.resources?.[t];if(!r||!i)throw Error(`Resource is unavailable.`);if(`externalTexture`in r)throw Error(`External images cannot be read back.`);let a=`buffer`in r?Ff(r.buffer):If(r.texture);if(`frameScoped`in a&&a.frameScoped)throw Error(`Frame textures expire after presentation.`);let o=`buffer`in r?l(r.buffer):u(r.texture),s=o instanceof g?this.transientBuffers:this.transientTextures;if(a.transient&&[...s].some(([e,t])=>e!==a&&t===o))throw Error(`Transient allocation is reused; logical contents are no longer available.`);return Of(o,i)})}destroy(){if(!this.destroyed){for(let{executable:e}of this.compiledNodes)e.destroy?.();for(let e of this.cachedFramebuffers)e.framebuffer.destroy();for(let e of this.cachedTextureViews)e.view.destroy();for(let e of this.bufferTransientAllocations)e.buffer?.destroy();for(let e of this.textureTransientAllocations)e.texture?.destroy();this.destroyed=!0}}resolveImportedBuffers(e){let t=new Map,n=new Map;for(let[r,i]of this.buffers){if(i.transient)continue;let a=e[r]??i.defaultBuffer;if(!a)throw Error(`GPUCommandGraph imported buffer "${r}" is required`);zp(a,i,this.device);let o=Tp(a);if(this.activeImportedBufferHandles.has(i)){let e=o.handle,t=typeof e==`object`&&e||typeof e==`function`?e:o,a=n.get(t);if(a&&(this.writableImportedBufferHandles.has(a)||this.writableImportedBufferHandles.has(i)))throw Error(`GPUCommandGraph imported buffers "${a.id}" and "${r}" resolve to the same physical buffer`);a||n.set(t,i)}t.set(i,o)}for(let t of Object.keys(e)){let e=this.buffers.get(t);if(!e||e.transient)throw Error(`GPUCommandGraph has no imported buffer named "${t}"`)}return t}resolveImportedTextures(e,t){let n=new Map,r=new Map;for(let[i,a]of this.textures){if(a.transient)continue;if(a.frameScoped){let e=t[i];if(!e)throw Error(`GPUCommandGraph frame texture "${i}" is required`);let o=this.lastFrameIds.get(a);if(o!==void 0&&e.frameId<=o)throw Error(`GPUCommandGraph frame texture "${i}" frameId ${e.frameId} is stale; expected greater than ${o}`);Bp(e.texture,a,this.device),n.set(a,Op(e.texture)),r.set(a,e.frameId);continue}let o=e[i]??a.defaultTexture;if(!o)throw Error(`GPUCommandGraph imported texture "${i}" is required`);Bp(o,a,this.device),n.set(a,Op(o))}for(let t of Object.keys(e)){let e=this.textures.get(t);if(!e||e.transient||e.frameScoped)throw Error(`GPUCommandGraph has no imported texture named "${t}"`)}for(let e of Object.keys(t))if(!this.textures.get(e)?.frameScoped)throw Error(`GPUCommandGraph has no frame texture named "${e}"`);let i=new Map;for(let[e,t]of n){if(!this.activeImportedTextureHandles.has(e))continue;let n=t.handle,r=typeof n==`object`&&n||typeof n==`function`?n:t,a=i.get(r);if(a&&(this.writableImportedTextureHandles.has(a)||this.writableImportedTextureHandles.has(e)))throw Error(`GPUCommandGraph imported textures "${a.id}" and "${e.id}" resolve to the same physical texture`);a||i.set(r,e)}return{textures:n,frameIds:r}}resolveExternalTextures(e){let t=new Map,n=new Map;for(let[r,i]of this.externalTextures){let a=e[r];if(!a)throw Error(`GPUCommandGraph external texture "${r}" is required`);let o=this.lastExternalTextureFrameIds.get(i);if(o!==void 0&&a.frameId<=o)throw Error(`GPUCommandGraph external texture "${r}" frameId ${a.frameId} is stale; expected greater than ${o}`);if(this.consumedExternalTextures.has(a.texture))throw Error(`GPUCommandGraph external texture "${r}" requires a fresh binding for each frame`);Vp(a.texture,i,this.device),t.set(i,a.texture),n.set(i,a.frameId)}for(let t of Object.keys(e))if(!this.externalTextures.has(t))throw Error(`GPUCommandGraph has no external texture named "${t}"`);return{textures:t,frameIds:n}}getFramebuffer(e,t,n){let r=t.colorAttachments.map(n),i=t.depthStencilAttachment?n(t.depthStencilAttachment):void 0,a=this.cachedFramebuffers.find(t=>t.nodeId===e&&t.depthStencilAttachment===i&&t.colorAttachments.length===r.length&&t.colorAttachments.every((e,t)=>e===r[t]));if(a)return a.framebuffer;let o=t.colorAttachments[0]??t.depthStencilAttachment,s=this.device.createFramebuffer({id:`${this.id}-${e}-framebuffer-${this.cachedFramebuffers.length}`,width:o.width,height:o.height,colorAttachments:r,depthStencilAttachment:i??null});return this.cachedFramebuffers.push({nodeId:e,colorAttachments:r,depthStencilAttachment:i,framebuffer:s}),s}destroyFramebuffersUsingView(e){for(let t=this.cachedFramebuffers.length-1;t>=0;t--){let n=this.cachedFramebuffers[t];(n.depthStencilAttachment===e||n.colorAttachments.some(t=>t===e))&&(n.framebuffer.destroy(),this.cachedFramebuffers.splice(t,1))}}};function Tp(e){return e instanceof j?e.buffer:e}function Ep(e){let t=e.length===0?0:(e.length-1)*e.byteStride+e.rowByteLength;return e.byteOffset+t}function Dp(e,t){return e.byteLength>=t.byteLength&&(e.usage&t.usage)===t.usage}function Op(e){if(e instanceof js){if(!e.isReady)throw Error(`GPUCommandGraph dynamic texture "${e.id}" is not ready`);return e.texture}return e}function kp(e,t){let n;for(let[r,i]of[...Object.entries(e),...Object.entries(t)]){if(!Number.isSafeInteger(i.frameId)||i.frameId<0)throw Error(`GPUCommandGraph frame resource "${r}" requires a valid frameId`);if(n!==void 0&&i.frameId!==n)throw Error(`GPUCommandGraph frame resources must share one frameId per encoding`);n=i.frameId}}function Ap(e,t){let{timestampQuerySet:n,beginTimestampIndex:r,endTimestampIndex:i}=e.props;return n&&Number.isSafeInteger(r)&&Number.isSafeInteger(i)&&r>=0&&i>r?{querySet:n,snapshot:n.device.type===`webgpu`?t.captureTimestampQuerySet?.(n):void 0,beginIndex:r,endIndex:i}:void 0}function jp(e){return Object.freeze({timestampQueries:e.features.has(`timestamp-query`),subgroups:e.features.has(`subgroups`),subgroupId:e.wgslLanguageFeatures.has(`subgroup_id`),subgroupMinSize:e.info.subgroupMinSize,subgroupMaxSize:e.info.subgroupMaxSize,softwareAdapter:e.info.gpu===`software`||e.info.gpuType===`cpu`||!!e.info.fallback,maxBufferByteLength:e.limits.maxBufferSize,maxStorageBufferBindingByteLength:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupsPerDimension:e.limits.maxComputeWorkgroupsPerDimension})}function Mp(e,t){if(e.isLost)throw Error(`GPUCommandGraph cannot perform ${t} after device loss`)}function Np(){return globalThis.performance?.now()??Date.now()}function Pp(e,t){if(!e.id)throw Error(`GPUCommandGraph buffer id is required`);if(!Number.isSafeInteger(e.byteLength)||e.byteLength<0)throw Error(`GPUCommandGraph buffer "${e.id}" requires a valid byteLength`);if(e.byteLength>t.limits.maxBufferSize)throw Error(`GPUCommandGraph buffer "${e.id}" exceeds the device buffer limit`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph buffer "${e.id}" requires buffer usage flags`)}function Fp(e,t){if(!e.id)throw Error(`GPUCommandGraph external texture id is required`);for(let[t,n]of Object.entries({width:e.width,height:e.height}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph external texture "${e.id}" ${t} must be a positive safe integer`);if(e.width>t.limits.maxTextureDimension2D||e.height>t.limits.maxTextureDimension2D)throw Error(`GPUCommandGraph external texture "${e.id}" exceeds device dimension limits`)}function Ip(e,t){if(!e.id)throw Error(`GPUCommandGraph texture id is required`);let n=e.dimension??`2d`,r=n===`cube`?6:e.depth??1,i=e.mipLevels??1,a=e.samples??1;for(let[t,n]of Object.entries({width:e.width,height:e.height,depth:r,mipLevels:i,samples:a}))if(!Number.isSafeInteger(n)||n<=0)throw Error(`GPUCommandGraph texture "${e.id}" ${t} must be a positive safe integer`);if(!Number.isSafeInteger(e.usage)||e.usage<=0)throw Error(`GPUCommandGraph texture "${e.id}" requires texture usage flags`);if(!t.isTextureFormatSupported(e.format))throw Error(`GPUCommandGraph texture "${e.id}" format ${e.format} is unsupported`);if(n===`1d`&&(e.height!==1||r!==1))throw Error(`GPUCommandGraph 1d texture "${e.id}" requires height and depth 1`);if(n===`cube`&&e.width!==e.height)throw Error(`GPUCommandGraph cube texture "${e.id}" must be square`);if(n===`cube-array`&&(e.width!==e.height||r%6!=0))throw Error(`GPUCommandGraph cube-array texture "${e.id}" must be square with depth divisible by 6`);if(i>t.getMipLevelCount(e.width,e.height,n===`3d`?r:1))throw Error(`GPUCommandGraph texture "${e.id}" declares too many mip levels`);let o=n===`1d`?t.limits.maxTextureDimension1D:n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,s=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureDimension2D,c=n===`3d`?t.limits.maxTextureDimension3D:t.limits.maxTextureArrayLayers;if(e.width>o||e.height>s||r>c)throw Error(`GPUCommandGraph texture "${e.id}" exceeds device dimension limits`);return{id:e.id,format:e.format,width:e.width,height:e.height,usage:e.usage,dimension:n,depth:r,mipLevels:i,samples:a}}function Lp(e,t){let n=t.dimension??e.dimension,r=t.aspect??`all`,i=t.baseMipLevel??0,a=t.mipLevelCount??e.mipLevels-i,o=t.baseArrayLayer??0,s=e.dimension===`3d`?1:e.depth,c=t.arrayLayerCount??s-o;for(let[e,t]of Object.entries({baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c}))if(!Number.isSafeInteger(t)||t<0)throw Error(`Graph texture view ${e} must be a non-negative safe integer`);if(a===0||i+a>e.mipLevels)throw Error(`Graph texture view exceeds texture "${e.id}" mip levels`);if(c===0||o+c>s||e.dimension===`3d`&&(o!==0||c!==1))throw Error(`Graph texture view exceeds texture "${e.id}" array layers`);return{dimension:n,aspect:r,baseMipLevel:i,mipLevelCount:a,baseArrayLayer:o,arrayLayerCount:c,width:Math.max(1,e.width>>i),height:e.dimension===`1d`?1:Math.max(1,e.height>>i),depth:e.dimension===`3d`?Math.max(1,e.depth>>i):c}}function Rp(e,t){for(let[e,n]of Object.entries(t))if(!Number.isSafeInteger(n)||n<0)throw Error(`Graph data view ${e} must be a non-negative safe integer`);if(t.length>1&&t.byteStride===0)throw Error(`Graph data view byteStride must be positive for multiple rows`);if(t.rowByteLength>t.byteStride&&t.length>1)throw Error(`Graph data view rowByteLength cannot exceed byteStride`);let n=t.length===0?0:(t.length-1)*t.byteStride+t.rowByteLength,r=t.byteOffset+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r))throw Error(`Graph data view byte range exceeds safe integer precision`);if(r>e.byteLength)throw Error(`Graph data view exceeds buffer "${e.id}" byte length`)}function zp(e,t,n){let r=Tp(e);if(r.device!==n)throw Error(`GPUCommandGraph buffer "${t.id}" belongs to another device`);if(r.byteLength<t.byteLength)throw Error(`GPUCommandGraph buffer "${t.id}" is smaller than compiled capacity`);if((r.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph buffer "${t.id}" has incompatible usage flags`)}function Bp(e,t,n){let r=Op(e);if(r.device!==n)throw Error(`GPUCommandGraph texture "${t.id}" belongs to another device`);for(let[e,n,i]of[[`format`,t.format,r.format],[`dimension`,t.dimension,r.dimension],[`width`,t.width,r.width],[`height`,t.height,r.height],[`depth`,t.depth,r.depth],[`mipLevels`,t.mipLevels,r.mipLevels],[`samples`,t.samples,r.samples]])if(i!==n)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible ${e} (${i} !== ${n})`);if((r.props.usage&t.usage)!==t.usage)throw Error(`GPUCommandGraph texture "${t.id}" has incompatible usage flags`)}function Vp(e,t,n){if(e.device!==n)throw Error(`GPUCommandGraph external texture "${t.id}" belongs to another device`);if(e.destroyed)throw Error(`GPUCommandGraph external texture "${t.id}" has been destroyed`);if(e.width!==t.width||e.height!==t.height)throw Error(`GPUCommandGraph external texture "${t.id}" has incompatible dimensions (${e.width}x${e.height} !== ${t.width}x${t.height})`)}function Hp(e,t){let n=Gp(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph buffer "${e.id}" does not declare usage required by ${t}`)}function Up(e,t){let n=Kp(t);if((e.usage&n)!==n)throw Error(`GPUCommandGraph texture "${e.id}" does not declare usage required by ${t}`)}function Wp(e,t){if(e instanceof lp&&t.startsWith(`storage-`)&&e.mipLevelCount!==1)throw Error(`GPUCommandGraph storage texture views must contain exactly one mip level`)}function Gp(e){switch(e){case`storage-read`:case`storage-write`:case`storage-read-write`:return g.STORAGE;case`uniform`:return g.UNIFORM;case`copy-source`:return g.COPY_SRC;case`copy-destination`:return g.COPY_DST;case`indirect`:return g.INDIRECT;case`vertex`:return g.VERTEX;case`index`:return g.INDEX}}function Kp(e){switch(e){case`sampled`:return p.SAMPLE;case`storage-read`:case`storage-write`:case`storage-read-write`:return p.STORAGE;case`render-attachment`:return p.RENDER;case`copy-source`:return p.COPY_SRC;case`copy-destination`:return p.COPY_DST}}function qp(e){let t=e.texture;return e.dimension===t.dimension&&e.aspect===`all`&&e.baseMipLevel===0&&e.mipLevelCount===t.mipLevels&&e.baseArrayLayer===0&&e.arrayLayerCount===(t.dimension===`3d`?1:t.depth)}var Jp=Uint32Array.BYTES_PER_ELEMENT,Yp=256;function Xp(e,t,n){let r=Cf(e.format);if(!t.includes(e.format)||e.byteStride!==r.byteLength||e.rowByteLength!==r.byteLength||e.byteOffset%Jp!==0)throw Error(`${n} must be packed, uint32-aligned ${t.join(` or `)} GPU data`)}function Zp(e,t){Xp(e,[`uint32`],t)}function I(e,t){let n=Qp(e),r={buffer:t(e),...n};if(r.offset+r.size>e.buffer.byteLength)throw Error(`GraphDataView storage binding exceeds its logical buffer`);return r}function Qp(e){let t=Math.floor(e.byteOffset/Yp)*Yp,n=e.byteOffset-t,r=e.length===0?e.rowByteLength:(e.length-1)*e.byteStride+e.rowByteLength;return{offset:t,size:n+Math.max(r,e.rowByteLength)}}function L(e){if(e.byteOffset%Jp!==0)throw Error(`GraphDataView storage binding must be uint32-aligned`);return e.byteOffset%Yp/Jp}function $p(e,t){if(e.buffer!==t.buffer||e.length===0||t.length===0)return!1;let n=e.byteOffset+(e.length-1)*e.byteStride+e.rowByteLength,r=t.byteOffset+(t.length-1)*t.byteStride+t.rowByteLength;return e.byteOffset<r&&t.byteOffset<n}function R(e,t,n,r,i=g.STORAGE){if(!Number.isSafeInteger(r)||r<0)throw Error(`Transient GraphDataView length must be a non-negative safe integer`);if((i&g.STORAGE)===0)throw Error(`Transient GraphDataView usage must include Buffer.STORAGE`);if(bf(n)||xf(n))throw Error(`Transient GraphDataView requires a fixed-width GPUVector format`);let a=Cf(n),o=e.createTransientBuffer({id:t,byteLength:Math.max(r,1)*a.byteLength,usage:i});return e.createDataView(o,{format:n,length:r})}var em=class e{static async createAsync(t,n){let r=!k.getAsyncCompilation(t),i=r?k.beginAsyncCompilation(t):k.getAsyncCompilation(t),a;try{a=new e(t,n)}finally{r&&k.endAsyncCompilation(t,i)}try{return r?await Promise.all(i):await a._pipelineInitialization,a}catch(e){throw a.destroy(),e}}device;id;source;pipelineFactory;shaderFactory;shader;pipeline;_pipelineInitialization;_destroyed=!1;constructor(e,t){if(e.type!==`webgpu`)throw Error(`Kernel is only supported in WebGPU`);let{source:n,pipelineFactory:r,shaderFactory:i,debugShaders:a,...o}=t;this.device=e,this.id=t.id??`kernel`,this.source=n,this.pipelineFactory=r??k.getDefaultPipelineFactory(e),this.shaderFactory=i??Tt.getDefaultShaderFactory(e),this.shader=this.shaderFactory.createShader({id:`${this.id}-compute`,stage:`compute`,source:this.source,debugShaders:a});let s={...o,shader:this.shader},c=k.getAsyncCompilation(e);if(c){let e=this.pipelineFactory.createComputePipelineAsync(s);this._pipelineInitialization=e,c.push(e.then(e=>(this.pipeline=e,e)))}else this.pipeline=this.pipelineFactory.createComputePipeline(s)}dispatch(e,t){this._setPipeline(e,t.bindings),e.dispatch(t.x,t.y,t.z)}dispatchIndirect(e,t){this._setPipeline(e,t.bindings),e.dispatchIndirect(t.indirectBuffer,t.indirectOffset??0)}destroy(){this._destroyed||=(this.pipeline&&this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),!0)}_setPipeline(e,t={}){e.setPipeline(this.pipeline),e.setBindings(t)}};function z(e){return e instanceof F?e.data:[e]}function tm(e,t){let n=t[0]?.length??0;if(t.some(e=>e.length!==n))throw Error(`Aligned vectors must have equal logical lengths`);let r=t.map(z),i=t.map(()=>0),a=t.map(()=>0),o=[],s=0;for(;s<n;){for(let e=0;e<r.length;e++)for(;r[e][i[e]]?.length===a[e];)i[e]++,a[e]=0;let t=r.map((e,t)=>e[i[t]]),n=Math.min(...t.map((e,t)=>e.length-a[t])),c=[];for(let r=0;r<t.length;r++){let i=t[r],o=t.findIndex((e,t)=>t<r&&e===i&&a[t]===a[r]);c.push(o>=0?c[o]:a[r]===0&&n===i.length?i:e.createDataView(i.buffer,{format:i.format,length:n,byteOffset:i.byteOffset+a[r]*i.byteStride,byteStride:i.byteStride,rowByteLength:i.rowByteLength}))}o.push(c);for(let e=0;e<a.length;e++)a[e]+=n;s+=n}return o}var nm=class{device;id;textures;previousIndex=0;destroyed=!1;constructor(e,t){this.device=e,this.id=t.id??`gpu-texture-history`;let n=e.createTexture({...t,id:`${this.id}-previous`});try{this.textures=[n,e.createTexture({...t,id:`${this.id}-current`})]}catch(e){throw n.destroy(),e}}get previousTexture(){return this.assertAvailable(),this.textures[this.previousIndex]}get currentTexture(){return this.assertAvailable(),this.textures[1-this.previousIndex]}getBindings(e,t){if(this.assertAvailable(),e===t)throw Error(`GPUTextureHistory previous and current identifiers must differ`);return{[e]:this.previousTexture,[t]:this.currentTexture}}advance(){this.assertAvailable(),this.previousIndex=1-this.previousIndex}reset(){this.assertAvailable(),this.previousIndex=0}destroy(){this.destroyed||(this.destroyed=!0,this.textures[0].destroy(),this.textures[1].destroy())}assertAvailable(){if(this.destroyed)throw Error(`GPUTextureHistory has been destroyed`)}},rm=4294967295,im=4294967296;function am(e,t,n,r){if(!Number.isSafeInteger(t)||t<0||t>rm)throw Error(`${e} element count must be a non-negative uint32`);sm(e,n);let i=Math.floor(r);if(!Number.isSafeInteger(i)||i<1)throw Error(`maxComputeWorkgroupsPerDimension must be a positive integer`);let a=Math.max(1,Math.ceil(t/n)),o=Math.min(a,i),s=Math.min(Math.ceil(a/o),i),c=Math.ceil(a/o/s);if(c>i)throw Error(`${e} requires ${a} workgroups, exceeding the 3D dispatch limit of ${i} per dimension`);return{x:o,y:s,z:c}}function om(e,t){sm(`GPU dispatch`,t);let n=Math.floor(rm/t)+1;return`let workgroupIndex = (workgroupId.z * ${e.y}u + workgroupId.y) * ${e.x}u + workgroupId.x;
  if (workgroupIndex >= ${n}u) { return; }
  let index = workgroupIndex * ${t}u + localInvocationIndex;`}function sm(e,t){if(!Number.isSafeInteger(t)||t<2||t>rm||im%t!==0)throw Error(`${e} workgroup size must be a power of two greater than one`)}function cm(e,t){let[n,r,i]=t;for(let[e,t]of[[`x`,n],[`y`,r],[`z`,i]])if(!Number.isSafeInteger(t)||t<0)throw Error(`compute dispatch ${e} workgroup count must be a non-negative safe integer`);return{...e,dispatchWorkgroups:Object.freeze([n,r,i])}}function lm(e,t={}){let n=e.features?.has(`subgroups`),r=!t.requiresSubgroupId||e.wgslLanguageFeatures?.has(`subgroup_id`);return n&&r?`subgroups`:`portable`}var B=256,um=64;function dm(e,t=!1){return t?`portable`:lm(e,{requiresSubgroupId:!0})}var fm=class{id;input;output;mode;segmentFlags;constructor(e){if(this.id=e.id??`gpu-scan`,this.input=e.input,this.output=e.output,this.mode=e.mode??`exclusive`,this.segmentFlags=e.segmentFlags,vm(this.input,`${this.id} input`),vm(this.output,`${this.id} output`),this.output.length<this.input.length)throw Error(`${this.id} output must contain at least input.length rows`);if(this.output instanceof F&&this.output.length!==this.input.length)throw Error(`${this.id} vector output length must equal input length`);if(this.segmentFlags){if(vm(this.segmentFlags,`${this.id} segmentFlags`),this.segmentFlags.length<this.input.length)throw Error(`${this.id} segmentFlags must contain at least input.length rows`);if(this.segmentFlags instanceof F&&this.segmentFlags.length!==this.input.length)throw Error(`${this.id} vector segmentFlags length must equal input length`);let e=new Set(ym(this.output).map(e=>e.buffer));if(ym(this.segmentFlags).some(t=>e.has(t.buffer)))throw Error(`${this.id} segmentFlags and output must use separate buffers`)}}getCommandNodes(e){let t=[];return t.push(...pm(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function pm(e,t,n){let r=[];bm(t,e.input,e.id),bm(t,e.output,e.id),e.segmentFlags&&bm(t,e.segmentFlags,e.id);let i=mm(t,e.output,e.input.length),a=e.segmentFlags?mm(t,e.segmentFlags,e.input.length):void 0,o=a?tm(t,[e.input,i,a]):tm(t,[e.input,i]);return r.push(...hm(t,{id:e.id,inputChunks:o.map(e=>e[0]),outputChunks:o.map(e=>e[1]),segmentFlagChunks:a?o.map(e=>e[2]):void 0,isVector:o.length>1,mode:e.mode},n)),r}function mm(e,t,n){return t.length===n||t instanceof F?t:e.createDataView(t.buffer,{format:t.format,length:n,byteOffset:t.byteOffset,byteStride:t.byteStride,rowByteLength:t.rowByteLength})}function hm(e,t,n){let r=[],i=t.inputChunks,a=t.outputChunks,o=t.segmentFlagChunks,s=i.map((e,t)=>({chunkIndex:t,input:e,output:a[t],segmentFlags:o?.[t]})).filter(e=>e.input.length>0);if(s.length===0)return r;if(s.length===1){let i=s[0];return r.push(...gm(e,{id:t.isVector?`${t.id}-chunk-${i.chunkIndex}`:t.id,input:i.input,output:i.output,mode:t.mode,segmentFlags:i.segmentFlags,maxComputeWorkgroupsPerDimension:n})),r}let c=R(e,`${t.id}-chunk-totals`,`uint32`,s.length),l=R(e,`${t.id}-chunk-offsets`,`uint32`,s.length),u=o?R(e,`${t.id}-chunk-segment-flags`,`uint32`,s.length):void 0,d=o?s.map(n=>R(e,`${t.id}-chunk-${n.chunkIndex}-segment-prefixes`,`uint32`,n.input.length)):void 0;for(let[i,a]of s.entries())r.push(...gm(e,{id:`${t.id}-chunk-${a.chunkIndex}`,input:a.input,output:a.output,mode:t.mode,segmentFlags:a.segmentFlags,outputSegmentPrefixes:d?.[i],finalSum:_m(e,c,i),finalSegmentFlag:u?_m(e,u,i):void 0,maxComputeWorkgroupsPerDimension:n}));r.push(...gm(e,{id:`${t.id}-chunk-carries`,input:c,output:l,mode:`exclusive`,segmentFlags:u,segmentSummaryInput:!!u,maxComputeWorkgroupsPerDimension:n}));for(let[i,a]of s.entries())r.push(...wm(e,{id:`${t.id}-chunk-${a.chunkIndex}-add-carry`,output:a.output,offsets:l,length:a.output.length,offsetIndex:i,segmentPrefixes:d?.[i],dispatchLayout:Tm(a.output.length,n)}));return r}function gm(e,t){let n=[];if(t.input.length===0)return n;let r=[],i=t.input,a=t.output,o=t.segmentFlags,s=t.input.length,c=0;for(;;){let l=Math.ceil(s/B),u,d;l>1&&(u=R(e,`${t.id}-level-${c}-block-sums`,`uint32`,l),o&&(d=R(e,`${t.id}-level-${c}-block-segment-flags`,`uint32`,l)));let f=o?c===0&&t.outputSegmentPrefixes?t.outputSegmentPrefixes:l>1||c>0?R(e,`${t.id}-level-${c}-segment-prefixes`,`uint32`,s):void 0:void 0;if(n.push(...xm(e,{id:`${t.id}-level-${c}-scan`,input:i,output:a,mode:c===0?t.mode:`exclusive`,segmentFlags:o,segmentSummaryInput:!!o&&(c>0||t.segmentSummaryInput),segmentPrefixes:f,blockSums:u,blockSegmentFlags:d,finalSum:u?void 0:t.finalSum,finalSegmentFlag:u?void 0:t.finalSegmentFlag,length:s,blockCount:l,dispatchLayout:Tm(s,t.maxComputeWorkgroupsPerDimension)})),r.push({output:a,length:s,segmentPrefixes:f}),!u)break;let p=R(e,`${t.id}-level-${c}-block-offsets`,`uint32`,l);r[r.length-1].blockOffsets=p,i=u,a=p,o=d,s=l,c++}for(let i=r.length-2;i>=0;i--){let a=r[i],o=r[i+1];n.push(...wm(e,{id:`${t.id}-level-${i}-add-offsets`,output:a.output,offsets:a.blockOffsets,length:a.length,segmentPrefixes:a.segmentPrefixes,offsetSegmentPrefixes:o.segmentPrefixes,dispatchLayout:Tm(a.length,t.maxComputeWorkgroupsPerDimension)}))}return n}function _m(e,t,n){return e.createDataView(t.buffer,{format:`uint32`,length:1,byteOffset:t.byteOffset+n*t.rowByteLength})}function vm(e,t){let n=e instanceof F?e.data:[e];for(let e of n)Zp(e,t)}function ym(e){return e instanceof F?e.data:[e]}function bm(e,t,n){if((t instanceof F?t.data:[t]).some(t=>t.buffer.graph!==e))throw Error(`${n} views must belong to the target graph`)}function xm(e,t){let n=[],r=t.blockSums??t.finalSum,i=t.blockSegmentFlags??t.finalSegmentFlag,a=r?`@group(0) @binding(2) var<storage, read_write> sumValues: array<u32>;`:``,o=t.segmentFlags?`@group(0) @binding(3) var<storage, read> segmentFlags: array<u32>;`:``,s=t.segmentPrefixes?`@group(0) @binding(4) var<storage, read_write> segmentPrefixes: array<u32>;`:``,c=i?`@group(0) @binding(5) var<storage, read_write> summarySegmentFlags: array<u32>;`:``,l=t.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = scratch[255u];`:t.finalSum?`sumValues[SUM_OFFSET] = scratch[255u];`:``,u=t.blockSegmentFlags?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET + workgroupIndex] = segmentScratch[255u];`:t.finalSegmentFlag?`summarySegmentFlags[SUMMARY_SEGMENT_FLAGS_OFFSET] = segmentScratch[255u];`:``,d=t.segmentFlags?`segmentFlags[SEGMENT_FLAGS_OFFSET + index]`:`0u`,f=t.segmentFlags?`if (lane >= stride) {
      scratch[lane] = select(addend + scratch[lane], scratch[lane], segmentScratch[lane] != 0u);
      segmentScratch[lane] = addendSegment | segmentScratch[lane];
    }`:`if (lane >= stride) {
      scratch[lane] = scratch[lane] + addend;
    }`,p=t.mode===`inclusive`?`scratch[lane]`:`scratch[lane] - inputValue`,m=t.segmentFlags&&t.mode===`exclusive`?`var scannedOutput = 0u;
    if (lane > 0u) {
      scannedOutput = scratch[lane - 1u];
    }
    ${t.segmentSummaryInput?``:`if (inputSegmentFlag != 0u) { scannedOutput = 0u; }`}
    outputValues[OUTPUT_OFFSET + index] = scannedOutput;`:`outputValues[OUTPUT_OFFSET + index] = ${p};`,h=t.segmentPrefixes?t.segmentSummaryInput?`var segmentPrefix = 0u;
    if (lane > 0u) {
      segmentPrefix = segmentScratch[lane - 1u];
    }
    segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix;`:`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentScratch[lane];`:``,g=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const BLOCK_COUNT: u32 = ${t.blockCount}u;
const INPUT_OFFSET: u32 = ${L(t.input)}u;
const OUTPUT_OFFSET: u32 = ${L(t.output)}u;
${r?`const SUM_OFFSET: u32 = ${L(r)}u;`:``}
${t.segmentFlags?`const SEGMENT_FLAGS_OFFSET: u32 = ${L(t.segmentFlags)}u;`:``}
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${L(t.segmentPrefixes)}u;`:``}
${i?`const SUMMARY_SEGMENT_FLAGS_OFFSET: u32 = ${L(i)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${a}
${o}
${s}
${c}
var<workgroup> scratch: array<u32, ${B}>;
${t.segmentFlags?`var<workgroup> segmentScratch: array<u32, ${B}>;`:``}

@compute @workgroup_size(${B}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Em(t.dispatchLayout)}
  if (workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = localInvocationIndex;
  var inputValue = 0u;
  var inputSegmentFlag = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
    inputSegmentFlag = ${d};
  }
  scratch[lane] = inputValue;
  ${t.segmentFlags?`segmentScratch[lane] = inputSegmentFlag;`:``}
  workgroupBarrier();

  for (var stride = 1u; stride < ${B}u; stride = stride * 2u) {
    var addend = 0u;
    ${t.segmentFlags?`var addendSegment = 0u;`:``}
    if (lane >= stride) {
      addend = scratch[lane - stride];
      ${t.segmentFlags?`addendSegment = segmentScratch[lane - stride];`:``}
    }
    workgroupBarrier();
    ${f}
    workgroupBarrier();
  }

  if (lane == ${B-1}u) {
    ${l}
    ${u}
  }
  if (index < ELEMENT_COUNT) {
    ${m}
    ${h}
  }
}`,_=Sm(e,!!t.segmentFlags,t.length),v=_===`subgroups`?Cm(t,r,a):g;return n.push(fp({id:t.id,workload:{operation:`GPUScan`,variant:_,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*B,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT+t.blockCount*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.input,usage:`storage-read`},{buffer:t.output,usage:`storage-write`},...r?[{buffer:r,usage:`storage-write`}]:[],...t.segmentFlags?[{buffer:t.segmentFlags,usage:`storage-read`}]:[],...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:`storage-write`}]:[],...i?[{buffer:i,usage:`storage-write`}]:[]],compile:({device:e})=>{let n=new em(e,{id:t.id,source:v,shaderLayout:{bindings:[{name:`inputValues`,type:`storage`,group:0,location:0},{name:`outputValues`,type:`storage`,group:0,location:1},...r?[{name:`sumValues`,type:`storage`,group:0,location:2}]:[],...t.segmentFlags?[{name:`segmentFlags`,type:`storage`,group:0,location:3}]:[],...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:4}]:[],...i?[{name:`summarySegmentFlags`,type:`storage`,group:0,location:5}]:[]]}});return{encode:({computePass:e,getBuffer:a})=>{let o={inputValues:I(t.input,a),outputValues:I(t.output,a)};r&&(o.sumValues=I(r,a)),t.segmentFlags&&(o.segmentFlags=I(t.segmentFlags,a)),t.segmentPrefixes&&(o.segmentPrefixes=I(t.segmentPrefixes,a)),i&&(o.summarySegmentFlags=I(i,a)),n.dispatch(e,{bindings:o,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>cm(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function Sm(e,t,n){let r=dm(e.device,t);if(!e.autotuner||t)return r;let i=r===`subgroups`?`portable`:`subgroups`;return e.autotuner.selectKernel({operation:`GPUScan`,workloadSize:n,candidates:[{id:r},{id:i,supported:i===`portable`||dm(e.device,!1)===`subgroups`}]}).variant}function Cm(e,t,n){let r=e.mode===`inclusive`?`blockPrefix`:`blockPrefix - inputValue`,i=e.blockSums?`sumValues[SUM_OFFSET + workgroupIndex] = blockPrefix;`:e.finalSum?`sumValues[SUM_OFFSET] = blockPrefix;`:``,a=Math.floor(4294967295/B)+1;return`
enable subgroups;
requires subgroup_id;

const ELEMENT_COUNT: u32 = ${e.length}u;
const BLOCK_COUNT: u32 = ${e.blockCount}u;
const INPUT_OFFSET: u32 = ${L(e.input)}u;
const OUTPUT_OFFSET: u32 = ${L(e.output)}u;
${t?`const SUM_OFFSET: u32 = ${L(t)}u;`:``}
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${n}
var<workgroup> subgroupOffsets: array<u32, ${um}>;

@compute @workgroup_size(${B}) fn main(
  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${e.dispatchLayout.y}u + workgroupId.y) * ${e.dispatchLayout.x}u + workgroupId.x;
  if (workgroupIndex >= ${a}u || workgroupIndex >= BLOCK_COUNT) { return; }
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  let index = workgroupIndex * ${B}u + lane;
  var inputValue = 0u;
  if (index < ELEMENT_COUNT) {
    inputValue = inputValues[INPUT_OFFSET + index];
  }

  let subgroupPrefix = subgroupInclusiveAdd(inputValue);
  if (subgroupInvocationId == subgroupSize - 1u) {
    subgroupOffsets[subgroupId] = subgroupPrefix;
  }
  workgroupBarrier();

  let subgroupCount = ${B}u / subgroupSize;
  if (lane == 0u) {
    var runningOffset = 0u;
    for (var subgroupIndex = 0u; subgroupIndex < subgroupCount; subgroupIndex++) {
      let subgroupSum = subgroupOffsets[subgroupIndex];
      subgroupOffsets[subgroupIndex] = runningOffset;
      runningOffset = runningOffset + subgroupSum;
    }
  }
  workgroupBarrier();

  let blockPrefix = subgroupOffsets[subgroupId] + subgroupPrefix;
  if (lane == ${B-1}u) {
    ${i}
  }
  if (index < ELEMENT_COUNT) {
    outputValues[OUTPUT_OFFSET + index] = ${r};
  }
}`}function wm(e,t){let n=[],r=t.offsetIndex===void 0?`index / ${B}u`:`${t.offsetIndex}u`,i=`
const ELEMENT_COUNT: u32 = ${t.length}u;
const OUTPUT_OFFSET: u32 = ${L(t.output)}u;
const OFFSETS_OFFSET: u32 = ${L(t.offsets)}u;
${t.segmentPrefixes?`const SEGMENT_PREFIXES_OFFSET: u32 = ${L(t.segmentPrefixes)}u;`:``}
${t.offsetSegmentPrefixes?`const OFFSET_SEGMENT_PREFIXES_OFFSET: u32 = ${L(t.offsetSegmentPrefixes)}u;`:``}
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
${t.segmentPrefixes?`@group(0) @binding(2) var<storage, ${t.offsetSegmentPrefixes?`read_write`:`read`}> segmentPrefixes: array<u32>;`:``}
${t.offsetSegmentPrefixes?`@group(0) @binding(3) var<storage, read> offsetSegmentPrefixes: array<u32>;`:``}

@compute @workgroup_size(${B}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${Em(t.dispatchLayout)}
  if (index < ELEMENT_COUNT) {
    ${t.offsetSegmentPrefixes?`let offsetSegmentPrefix = offsetSegmentPrefixes[OFFSET_SEGMENT_PREFIXES_OFFSET + ${r}];`:``}
    ${t.segmentPrefixes?`let segmentPrefix = segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index];
    if (segmentPrefix == 0u) {`:``}
      outputValues[OUTPUT_OFFSET + index] = outputValues[OUTPUT_OFFSET + index] + offsets[OFFSETS_OFFSET + ${r}];
    ${t.segmentPrefixes?`}`:``}
    ${t.segmentPrefixes&&t.offsetSegmentPrefixes?`segmentPrefixes[SEGMENT_PREFIXES_OFFSET + index] = segmentPrefix | offsetSegmentPrefix;`:``}
  }
}`;return n.push(fp({id:t.id,workload:{operation:`GPUScan`,commandCount:1,maximumWorkgroupCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z,maximumInvocationCount:t.dispatchLayout.x*t.dispatchLayout.y*t.dispatchLayout.z*B,readByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT*2,writeByteLength:t.length*Uint32Array.BYTES_PER_ELEMENT},resources:[{buffer:t.output,usage:`storage-read-write`},{buffer:t.offsets,usage:`storage-read`},...t.segmentPrefixes?[{buffer:t.segmentPrefixes,usage:t.offsetSegmentPrefixes?`storage-read-write`:`storage-read`}]:[],...t.offsetSegmentPrefixes?[{buffer:t.offsetSegmentPrefixes,usage:`storage-read`}]:[]],compile:({device:e})=>{let n=new em(e,{id:t.id,source:i,shaderLayout:{bindings:[{name:`outputValues`,type:`storage`,group:0,location:0},{name:`offsets`,type:`storage`,group:0,location:1},...t.segmentPrefixes?[{name:`segmentPrefixes`,type:`storage`,group:0,location:2}]:[],...t.offsetSegmentPrefixes?[{name:`offsetSegmentPrefixes`,type:`storage`,group:0,location:3}]:[]]}});return{encode:({computePass:e,getBuffer:r})=>{let i={outputValues:I(t.output,r),offsets:I(t.offsets,r)};t.segmentPrefixes&&(i.segmentPrefixes=I(t.segmentPrefixes,r)),t.offsetSegmentPrefixes&&(i.offsetSegmentPrefixes=I(t.offsetSegmentPrefixes,r)),n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n.map(e=>cm(e,[t.dispatchLayout.x,t.dispatchLayout.y,t.dispatchLayout.z]))}function Tm(e,t){return am(`GPUScan`,e,B,t)}function Em(e){return om(e,B)}function Dm(e,t,n,r){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(r)||n<0||r<0||n+r>t.length)throw Error(`Graph range must fit the source`);let i=[],a=t instanceof F?t.chunks:[{offset:0,length:t.length,data:t}],o=0,s=a.length;for(;o<s;){let e=Math.floor((o+s)/2);a[e].offset+a[e].length<=n?o=e+1:s=e}for(let t=o;t<a.length&&a[t].offset<n+r;t++){let{data:o,offset:s}=a[t],c=Math.max(n,s),l=Math.min(n+r,s+o.length);c<l&&i.push(c===s&&l===s+o.length?o:e.createDataView(o.buffer,{format:o.format,length:l-c,byteOffset:o.byteOffset+(c-s)*o.byteStride,byteStride:o.byteStride,rowByteLength:o.rowByteLength}))}return new F({id:`graph-range-${n}-${r}`,name:`graph-range-${n}-${r}`,stride:t instanceof F?t.stride:Cf(t.format).components*(Cf(t.format).listSize??1),format:t.format,length:r,valueLength:r*(Cf(t.format).listSize??1),byteStride:t.byteStride,rowByteLength:t.rowByteLength,data:i})}function Om(e,t,n){if([...t,...n].some(e=>e.length>4294967295))throw Error(`Logical lengths must fit uint32 addressing`);let r=t.flatMap(z),i=n.flatMap(z);for(let t of[...r,...i])if(t.buffer.graph!==e)throw Error(`Views must belong to the target graph`);let a=new Set(r.map(e=>e.buffer)),o=new Map;for(let e of i){if(a.has(e.buffer))throw Error(`Outputs must use separate buffers from inputs`);if(!e.length)continue;let t=o.get(e.buffer)??[];t.push(e),o.set(e.buffer,t)}for(let e of o.values()){e.sort((e,t)=>e.byteOffset-t.byteOffset);let t=0;for(let n of e){if(n.byteOffset<t)throw Error(`Writable chunks must not overlap`);t=n.byteOffset+(n.length-1)*n.byteStride+n.rowByteLength}}}function km(e,t){let n=[...Object.entries(t.inputs??{}),...Object.entries(t.outputs)];for(let[,t]of n)if(Qp(t).size>e.device.limits.maxStorageBufferBindingSize)throw Error(`Active chunks must fit a storage binding`);let r=t.dispatch.x*t.dispatch.y*t.dispatch.z;return cm(fp({id:t.id,workload:{commandCount:1,maximumWorkgroupCount:r,maximumInvocationCount:r*(t.workgroupSize??256)},resources:[...Object.values(t.inputs??{}).map(e=>({buffer:e,usage:`storage-read`})),...Object.values(t.outputs).map(e=>({buffer:e,usage:`storage-read-write`}))],compile:({device:e})=>{let r=new em(e,{id:t.id,source:t.source,shaderLayout:{bindings:n.map(([e],n)=>({name:e,group:0,location:n,type:n<Object.keys(t.inputs??{}).length?`read-only-storage`:`storage`}))}});return{encode:({computePass:e,getBuffer:i})=>{let a={};for(let[e,t]of n)a[e]=I(t,i);r.dispatch(e,{bindings:a,x:t.dispatch.x,y:t.dispatch.y,z:t.dispatch.z})},destroy:()=>r.destroy()}}}),[t.dispatch.x,t.dispatch.y,t.dispatch.z])}function Am(e,t,n){let r=[],i=tm(e,[t.keys,t.values]),a=tm(e,[t.outputKeys,t.outputValues]),o=i.map(([i,a],o)=>{let s=`${t.id}-span-${o}`,c=R(e,`${s}-keys`,`uint32`,i.length),l=R(e,`${s}-values`,`uint32`,i.length),u=R(e,`${s}-ranks`,`uint32`,i.length);return r.push(...zm(new Rm({id:s,keys:i,values:a,outputKeys:c,outputValues:l,algorithm:t.resolvedAlgorithm,direction:t.direction,keyBits:t.keyBits}),e,n)),{keys:c,values:l,ranks:u}}),s=t.resolvedAlgorithm===`radix`&&t.keyBits<32?2**t.keyBits-1:4294967295,c=t.direction===`ascending`?`<`:`>`;for(let[i,l]of o.entries()){let u=am(`GPUSort merge`,l.keys.length,256,n),d=om(u,256);r.push(km(e,{id:`${t.id}-ranks-${i}`,outputs:{ranks:l.ranks},dispatch:u,source:`
@group(0) @binding(0) var<storage, read_write> ranks: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${d}
  if (index < ${l.keys.length}u) { ranks[index] = index; }
}`}));for(let[n,a]of o.entries())n!==i&&r.push(km(e,{id:`${t.id}-rank-${i}-against-${n}`,inputs:{keys:l.keys,otherKeys:a.keys},outputs:{ranks:l.ranks},dispatch:u,source:`
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> otherKeys: array<u32>;
@group(0) @binding(2) var<storage, read_write> ranks: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${d}
  if (index >= ${l.keys.length}u) { return; }
  let key = keys[index] & ${s}u;
  var first = 0u;
  var last = ${a.keys.length}u;
  loop {
    if (first == last) { break; }
    let middle = first + (last - first) / 2u;
    let otherKey = otherKeys[middle] & ${s}u;
    if (otherKey ${c} key${n<i?` || otherKey == key`:``}) { first = middle + 1u; }
    else { last = middle; }
  }
  ranks[index] += first;
}`}));let f=0;for(let[n,[o,s]]of a.entries())r.push(km(e,{id:`${t.id}-publish-${i}-${n}`,inputs:{keys:l.keys,values:l.values,ranks:l.ranks},outputs:{outputKeys:o,outputValues:s},dispatch:u,source:`
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> ranks: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${d}
  if (index >= ${l.keys.length}u) { return; }
  let rank = ranks[index];
  if (rank >= ${f}u && rank - ${f}u < ${o.length}u) {
    let localRank = rank - ${f}u;
    outputKeys[${L(o)}u + localRank] = keys[index];
    outputValues[${L(s)}u + localRank] = values[index];
  }
}`})),f+=o.length}return r}var jm=256,Mm=256,Nm=4,Pm=Mm/32,Fm=4294967295,Im=2147483648,Lm=jm,Rm=class{id;keys;values;outputKeys;outputValues;algorithm;direction;keyBits;resolvedAlgorithm;constructor(e){this.id=e.id??`gpu-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.algorithm=e.algorithm??`auto`,this.direction=e.direction??`ascending`,this.keyBits=e.keyBits??32;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])for(let n of z(t))Zp(n,`${this.id} ${e}`);if(![`auto`,`bitonic`,`radix`].includes(this.algorithm))throw Error(`${this.id} algorithm must be auto, bitonic, or radix`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);if(!Number.isInteger(this.keyBits)||this.keyBits<1||this.keyBits>32)throw Error(`${this.id} keyBits must be an integer from 1 to 32`);if(this.values.length!==this.keys.length||this.outputKeys.length!==this.keys.length||this.outputValues.length!==this.keys.length)throw Error(`${this.id} key, value, and output lengths must match`);if(this.keys.length>Im)throw Error(`${this.id} supports at most ${Im} rows`);Vm(this),this.resolvedAlgorithm=this.algorithm===`auto`?this.keys.length<=Lm?`bitonic`:`radix`:this.algorithm}getCommandNodes(e){let t=[];return t.push(...zm(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function zm(e,t,n){for(let n of[e.keys,e.values,e.outputKeys,e.outputValues])for(let r of z(n))if(r.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);return[e.keys,e.values,e.outputKeys,e.outputValues].some(e=>e instanceof F)?Am(t,e,n):Bm(e,t,n)}function Bm(e,t,n){let r=[];if(e.keys.length===0)return r;if(e.keys.length===1)return r.push(...Hm(t,e)),r;let i=am(`GPUSort`,e.keys.length,Mm,n);return e.resolvedAlgorithm===`bitonic`?r.push(...Um(t,e,i,n)):r.push(...Xm(t,e,i,n)),r}function Vm(e){let t=z(e.outputKeys),n=z(e.outputValues),r=[...z(e.keys),...z(e.values)];if([...t,...n].some(e=>r.some(t=>t.buffer===e.buffer))||t.some(e=>n.some(t=>e.buffer===t.buffer)))throw Error(`${e.id} outputs must use separate buffers from inputs and each other`);for(let r of[t,n])for(let[t,n]of r.entries())if(r.slice(0,t).some(e=>$p(e,n)))throw Error(`${e.id} output chunks must not overlap`)}function Hm(e,t,n=t.keys,r=t.values,i=`copy-pair`,a={x:1,y:1,z:1}){let o=[],s=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${L(n)}u;
const VALUES_OFFSET: u32 = ${L(r)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${L(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${L(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${Mm}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${om(a,Mm)}
  if (index >= ELEMENT_COUNT) { return; }
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + index];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + index];
}`;return o.push(...th(e,{id:`${t.id}-${i}`,source:s,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:n,values:r,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:a})),o}function Um(e,t,n,r){let i=[],a=$m(t.keys.length);if(a<=jm)return i.push(...Wm(e,t,a)),i;let o=am(`GPUSort bitonic`,a,jm,r),s=R(e,`${t.id}-bitonic-indices-a`,`uint32`,a),c=R(e,`${t.id}-bitonic-indices-b`,`uint32`,a);i.push(...qm(e,t,s,a,o));let l=s,u=c;for(let n of eh(a))i.push(...Jm(e,t,l,u,a,n,o)),[l,u]=[u,l];return i.push(...Ym(e,t,l,n)),i}function Wm(e,t,n){let r=[],i=t.direction===`descending`,a=lm(e.device,{requiresSubgroupId:!0})===`subgroups`,o=`
${a?`enable subgroups;
requires subgroup_id;`:``}
const INVALID_INDEX: u32 = ${Fm}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${n}u;
const KEYS_OFFSET: u32 = ${L(t.keys)}u;
const VALUES_OFFSET: u32 = ${L(t.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${L(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${L(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;
var<workgroup> indices: array<u32, ${n}>;
var<workgroup> cachedKeys: array<u32, ${n}>;

fn comes_before(leftIndex: u32, rightIndex: u32) -> bool {
  let leftValid = leftIndex != INVALID_INDEX && leftIndex < LOGICAL_LENGTH;
  let rightValid = rightIndex != INVALID_INDEX && rightIndex < LOGICAL_LENGTH;
  if (leftValid != rightValid) { return leftValid; }
  if (!leftValid) { return false; }
  let leftKey = cachedKeys[leftIndex];
  let rightKey = cachedKeys[rightIndex];
  if (leftKey == rightKey) { return leftIndex < rightIndex; }
  return ${i?`leftKey > rightKey`:`leftKey < rightKey`};
}

@compute @workgroup_size(${n}) fn main(
  ${a?`@builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32`:`@builtin(local_invocation_index) localInvocationIndex: u32`}
) {
${a?Km():Gm()}
}`;return r.push(...th(e,{id:`${t.id}-bitonic-local`,source:o,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:{x:1,y:1,z:1}})),r}function Gm(){return`
  indices[localInvocationIndex] = select(
    INVALID_INDEX,
    localInvocationIndex,
    localInvocationIndex < LOGICAL_LENGTH
  );
  if (localInvocationIndex < LOGICAL_LENGTH) {
    cachedKeys[localInvocationIndex] = keys[KEYS_OFFSET + localInvocationIndex];
  } else {
    cachedKeys[localInvocationIndex] = 0u;
  }
  workgroupBarrier();

  for (var blockWidth = 2u; blockWidth <= PADDED_LENGTH; blockWidth <<= 1u) {
    for (var compareStride = blockWidth >> 1u; compareStride > 0u; compareStride >>= 1u) {
      let partnerIndex = localInvocationIndex ^ compareStride;
      if (partnerIndex > localInvocationIndex) {
        let leftIndex = indices[localInvocationIndex];
        let rightIndex = indices[partnerIndex];
        let ascending = (localInvocationIndex & blockWidth) == 0u;
        let shouldSwap = select(
          comes_before(leftIndex, rightIndex),
          comes_before(rightIndex, leftIndex),
          ascending
        );
        indices[localInvocationIndex] = select(leftIndex, rightIndex, shouldSwap);
        indices[partnerIndex] = select(rightIndex, leftIndex, shouldSwap);
      }
      workgroupBarrier();
    }
  }

  if (localInvocationIndex < LOGICAL_LENGTH) {
    let sourceIndex = indices[localInvocationIndex];
    outputKeys[OUTPUT_KEYS_OFFSET + localInvocationIndex] = cachedKeys[sourceIndex];
    outputValues[OUTPUT_VALUES_OFFSET + localInvocationIndex] = values[VALUES_OFFSET + sourceIndex];
  }`}function Km(){return`
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  var currentIndex = select(INVALID_INDEX, lane, lane < LOGICAL_LENGTH);
  if (lane < LOGICAL_LENGTH) {
    cachedKeys[lane] = keys[KEYS_OFFSET + lane];
  } else {
    cachedKeys[lane] = 0u;
  }
  workgroupBarrier();

  for (var blockWidth = 2u; blockWidth <= PADDED_LENGTH; blockWidth <<= 1u) {
    for (var compareStride = blockWidth >> 1u; compareStride > 0u; compareStride >>= 1u) {
      var partnerIndex = INVALID_INDEX;
      if (compareStride < subgroupSize) {
        partnerIndex = subgroupShuffleXor(currentIndex, compareStride);
      } else {
        indices[lane] = currentIndex;
        workgroupBarrier();
        partnerIndex = indices[lane ^ compareStride];
      }

      let lowerLane = (lane & compareStride) == 0u;
      let leftIndex = select(partnerIndex, currentIndex, lowerLane);
      let rightIndex = select(currentIndex, partnerIndex, lowerLane);
      let ascending = (lane & blockWidth) == 0u;
      let shouldSwap = select(
        comes_before(leftIndex, rightIndex),
        comes_before(rightIndex, leftIndex),
        ascending
      );
      let sortedLeft = select(leftIndex, rightIndex, shouldSwap);
      let sortedRight = select(rightIndex, leftIndex, shouldSwap);
      currentIndex = select(sortedRight, sortedLeft, lowerLane);

      if (compareStride >= subgroupSize) {
        workgroupBarrier();
      }
    }
  }

  if (lane < LOGICAL_LENGTH) {
    outputKeys[OUTPUT_KEYS_OFFSET + lane] = cachedKeys[currentIndex];
    outputValues[OUTPUT_VALUES_OFFSET + lane] = values[VALUES_OFFSET + currentIndex];
  }`}function qm(e,t,n,r,i){let a=[],o=`
const INVALID_INDEX: u32 = ${Fm}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${r}u;
const INDICES_OFFSET: u32 = ${L(n)}u;
@group(0) @binding(0) var<storage, read_write> indices: array<u32>;

@compute @workgroup_size(${jm}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${om(i,jm)}
  if (index < PADDED_LENGTH) {
    indices[INDICES_OFFSET + index] = select(INVALID_INDEX, index, index < LOGICAL_LENGTH);
  }
}`;return a.push(...th(e,{id:`${t.id}-bitonic-initialize`,source:o,resources:[{buffer:n,usage:`storage-write`}],bindings:{indices:n},dispatchLayout:i})),a}function Jm(e,t,n,r,i,a,o){let s=[],c=t.direction===`descending`,l=`
const INVALID_INDEX: u32 = ${Fm}u;
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const PADDED_LENGTH: u32 = ${i}u;
const BLOCK_WIDTH: u32 = ${a.blockWidth}u;
const COMPARE_STRIDE: u32 = ${a.compareStride}u;
const KEYS_OFFSET: u32 = ${L(t.keys)}u;
const INDICES_IN_OFFSET: u32 = ${L(n)}u;
const INDICES_OUT_OFFSET: u32 = ${L(r)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> indicesIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> indicesOut: array<u32>;

fn is_valid(index: u32) -> bool {
  return index != INVALID_INDEX && index < LOGICAL_LENGTH;
}

fn comes_before(leftIndex: u32, rightIndex: u32) -> bool {
  let leftValid = is_valid(leftIndex);
  let rightValid = is_valid(rightIndex);
  if (leftValid != rightValid) { return leftValid; }
  if (!leftValid) { return false; }
  let leftKey = keys[KEYS_OFFSET + leftIndex];
  let rightKey = keys[KEYS_OFFSET + rightIndex];
  if (leftKey == rightKey) { return leftIndex < rightIndex; }
  return ${c?`leftKey > rightKey`:`leftKey < rightKey`};
}

@compute @workgroup_size(${jm}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${om(o,jm)}
  if (index >= PADDED_LENGTH) { return; }
  let partnerIndex = index ^ COMPARE_STRIDE;
  if (partnerIndex <= index) { return; }
  let leftIndex = indicesIn[INDICES_IN_OFFSET + index];
  let rightIndex = indicesIn[INDICES_IN_OFFSET + partnerIndex];
  let ascending = (index & BLOCK_WIDTH) == 0u;
  let shouldSwap = select(
    comes_before(leftIndex, rightIndex),
    comes_before(rightIndex, leftIndex),
    ascending
  );
  indicesOut[INDICES_OUT_OFFSET + index] = select(leftIndex, rightIndex, shouldSwap);
  indicesOut[INDICES_OUT_OFFSET + partnerIndex] = select(rightIndex, leftIndex, shouldSwap);
}`;return s.push(...th(e,{id:`${t.id}-bitonic-${a.blockWidth}-${a.compareStride}`,source:l,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:t.keys,indicesIn:n,indicesOut:r},dispatchLayout:o})),s}function Ym(e,t,n,r){let i=[],a=`
const LOGICAL_LENGTH: u32 = ${t.keys.length}u;
const KEYS_OFFSET: u32 = ${L(t.keys)}u;
const VALUES_OFFSET: u32 = ${L(t.values)}u;
const INDICES_OFFSET: u32 = ${L(n)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${L(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${L(t.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${jm}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${om(r,jm)}
  if (index >= LOGICAL_LENGTH) { return; }
  let sourceIndex = indices[INDICES_OFFSET + index];
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + sourceIndex];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + sourceIndex];
}`;return i.push(...th(e,{id:`${t.id}-bitonic-gather`,source:a,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:n,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],bindings:{keys:t.keys,values:t.values,indices:n,outputKeys:t.outputKeys,outputValues:t.outputValues},dispatchLayout:r})),i}function Xm(e,t,n,r){let i=[],a=Math.ceil(t.keyBits/Nm),o=Math.ceil(t.keys.length/Mm),s=a>1?R(e,`${t.id}-radix-scratch-keys`,`uint32`,t.keys.length):void 0,c=a>1?R(e,`${t.id}-radix-scratch-values`,`uint32`,t.keys.length):void 0,l=t.keys,u=t.values;for(let d=0;d<a;d++){let f=d*Nm,p=Math.min(Nm,t.keyBits-f),m=2**p,h=R(e,`${t.id}-radix-digit-${f}-histogram`,`uint32`,m*o),g=R(e,`${t.id}-radix-digit-${f}-offsets`,`uint32`,m*o),_=(a-d)%2==1,v=_?t.outputKeys:s,y=_?t.outputValues:c;if(!v||!y)throw Error(`${t.id} radix scratch is missing`);i.push(...Zm(e,t,l,h,f,p,o,n));let b=new fm({id:`${t.id}-radix-digit-${f}-scan`,input:h,output:g});i.push(...pm(b,e,r)),i.push(...Qm(e,t,l,u,g,v,y,f,p,o,n)),l=v,u=y}return i}function Zm(e,t,n,r,i,a,o,s){let c=[],l=2**a,u=t.direction===`descending`,d=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${i}u;
const BUCKET_COUNT: u32 = ${l}u;
const DIGIT_MASK: u32 = ${l-1}u;
const WORKGROUP_COUNT: u32 = ${o}u;
const KEYS_OFFSET: u32 = ${L(n)}u;
const HISTOGRAM_OFFSET: u32 = ${L(r)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read_write> histogram: array<u32>;
var<workgroup> digitCounts: array<atomic<u32>, ${l}>;

@compute @workgroup_size(${Mm}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex =
    (workgroupId.z * ${s.y}u + workgroupId.y) * ${s.x}u + workgroupId.x;
  if (workgroupIndex >= WORKGROUP_COUNT) { return; }
  if (localInvocationIndex < BUCKET_COUNT) {
    atomicStore(&digitCounts[localInvocationIndex], 0u);
  }
  workgroupBarrier();

  let index = workgroupIndex * ${Mm}u + localInvocationIndex;
  if (index < ELEMENT_COUNT) {
    let key = keys[KEYS_OFFSET + index];
    let digit = (key >> BIT_OFFSET) & DIGIT_MASK;
    let bucket = ${u?`DIGIT_MASK - digit`:`digit`};
    atomicAdd(&digitCounts[bucket], 1u);
  }
  workgroupBarrier();

  if (localInvocationIndex < BUCKET_COUNT) {
    histogram[HISTOGRAM_OFFSET + localInvocationIndex * WORKGROUP_COUNT + workgroupIndex] =
      atomicLoad(&digitCounts[localInvocationIndex]);
  }
}`;return c.push(...th(e,{id:`${t.id}-radix-digit-${i}-histogram`,source:d,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-write`}],bindings:{keys:n,histogram:r},dispatchLayout:s})),c}function Qm(e,t,n,r,i,a,o,s,c,l,u){let d=[],f=2**c,p=t.direction===`descending`,m=`
const ELEMENT_COUNT: u32 = ${t.keys.length}u;
const BIT_OFFSET: u32 = ${s}u;
const DIGIT_MASK: u32 = ${f-1}u;
const WORKGROUP_COUNT: u32 = ${l}u;
const MASK_WORD_COUNT: u32 = ${Pm}u;
const MASK_COUNT: u32 = ${f*Pm}u;
const KEYS_OFFSET: u32 = ${L(n)}u;
const VALUES_OFFSET: u32 = ${L(r)}u;
const OFFSETS_OFFSET: u32 = ${L(i)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${L(a)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${L(o)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;
var<workgroup> digitMasks: array<atomic<u32>, ${f*Pm}>;

@compute @workgroup_size(${Mm}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex =
    (workgroupId.z * ${u.y}u + workgroupId.y) * ${u.x}u + workgroupId.x;
  if (workgroupIndex >= WORKGROUP_COUNT) { return; }
  if (localInvocationIndex < MASK_COUNT) {
    atomicStore(&digitMasks[localInvocationIndex], 0u);
  }
  workgroupBarrier();

  let index = workgroupIndex * ${Mm}u + localInvocationIndex;
  let valid = index < ELEMENT_COUNT;
  var key = 0u;
  var bucket = 0u;
  if (valid) {
    key = keys[KEYS_OFFSET + index];
    let digit = (key >> BIT_OFFSET) & DIGIT_MASK;
    bucket = ${p?`DIGIT_MASK - digit`:`digit`};
    let wordIndex = localInvocationIndex >> 5u;
    let bitIndex = localInvocationIndex & 31u;
    atomicOr(&digitMasks[bucket * MASK_WORD_COUNT + wordIndex], 1u << bitIndex);
  }
  workgroupBarrier();

  if (index >= ELEMENT_COUNT) { return; }
  let maskBase = bucket * MASK_WORD_COUNT;
  let currentWord = localInvocationIndex >> 5u;
  var localRank = 0u;
  for (var word = 0u; word < currentWord; word++) {
    localRank += countOneBits(atomicLoad(&digitMasks[maskBase + word]));
  }
  let precedingBits = (1u << (localInvocationIndex & 31u)) - 1u;
  localRank += countOneBits(atomicLoad(&digitMasks[maskBase + currentWord]) & precedingBits);
  let bucketOffset = offsets[OFFSETS_OFFSET + bucket * WORKGROUP_COUNT + workgroupIndex];
  let outputIndex = bucketOffset + localRank;
  outputKeys[OUTPUT_KEYS_OFFSET + outputIndex] = key;
  outputValues[OUTPUT_VALUES_OFFSET + outputIndex] = values[VALUES_OFFSET + index];
}`;return d.push(...th(e,{id:`${t.id}-radix-digit-${s}-scatter`,source:m,resources:[{buffer:n,usage:`storage-read`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`}],bindings:{keys:n,values:r,offsets:i,outputKeys:a,outputValues:o},dispatchLayout:u})),d}function $m(e){let t=1;for(;t<e;)t*=2;return t}function eh(e){let t=[];for(let n=2;n<=e;n*=2)for(let e=n/2;e>=1;e/=2)t.push({blockWidth:n,compareStride:e});return t}function th(e,t){let n=[];return n.push(fp({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new em(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=I(n,r);n.dispatch(e,{bindings:i,x:t.dispatchLayout.x,y:t.dispatchLayout.y,z:t.dispatchLayout.z})},destroy:()=>n.destroy()}}})),n}var nh=256,rh=4294967295,ih=4294967295,ah=class{id;keys;values;outputKeys;outputValues;segments;direction;constructor(e){this.id=e.id??`gpu-segmented-sort`,this.keys=e.keys,this.values=e.values,this.outputKeys=e.outputKeys,this.outputValues=e.outputValues,this.direction=e.direction??`ascending`;for(let[e,t]of[[`keys`,this.keys],[`values`,this.values],[`outputKeys`,this.outputKeys],[`outputValues`,this.outputValues]])for(let n of z(t))Zp(n,`${this.id} ${e}`);if(![`ascending`,`descending`].includes(this.direction))throw Error(`${this.id} direction must be ascending or descending`);let t=[...z(this.keys),...z(this.values)];if([...z(this.outputKeys),...z(this.outputValues)].some(e=>t.some(t=>t.buffer===e.buffer))||z(this.outputKeys).some(e=>z(this.outputValues).some(t=>e.buffer===t.buffer)))throw Error(`${this.id} outputs must use separate buffers from inputs and each other`);this.segments=e.segments.map((e,t)=>sh(this,e,t)),ch(this.segments,`outputKeysOffset`,`${this.id} output keys`),ch(this.segments,`outputValuesOffset`,`${this.id} output values`)}getCommandNodes(e){let t=[];return t.push(...oh(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function oh(e,t,n){let r=[];if(Om(t,[e.keys,e.values],[e.outputKeys,e.outputValues]),[e.keys,e.values,e.outputKeys,e.outputValues].some(e=>e instanceof F)){for(let[i,a]of e.segments.entries()){if(!a.length)continue;let o=new Rm({id:`${e.id}-segment-${i}`,algorithm:`bitonic`,direction:e.direction,keys:Dm(t,e.keys,a.keysOffset,a.length),values:Dm(t,e.values,a.valuesOffset,a.length),outputKeys:Dm(t,e.outputKeys,a.outputKeysOffset,a.length),outputValues:Dm(t,e.outputValues,a.outputValuesOffset,a.length)});r.push(...zm(o,t,n))}return r}let i=e,a=lh(e.segments),o=Array.from(a,([t,r])=>({width:t,segments:r,dispatchLayout:am(`${e.id} ${t}-wide segments`,r.length*t,t,n)}));for(let e of o)r.push(...uh(t,i,e.width,e.segments,e.dispatchLayout));return r}function sh(e,t,n){let r=`${e.id} segment ${n}`;if(!Number.isInteger(t.length)||t.length<0||t.length>nh)throw Error(`${r} length must be an integer from 0 to ${nh}`);for(let[n,i]of[[`keysOffset`,e.keys],[`valuesOffset`,e.values],[`outputKeysOffset`,e.outputKeys],[`outputValuesOffset`,e.outputValues]]){let e=t[n];if(!Number.isSafeInteger(e)||e<0||e>ih)throw Error(`${r} ${n} must be a non-negative uint32`);if(e>i.length||t.length>i.length-e)throw Error(`${r} ${n} and length exceed the parent view`)}return{keysOffset:t.keysOffset,valuesOffset:t.valuesOffset,outputKeysOffset:t.outputKeysOffset,outputValuesOffset:t.outputValuesOffset,length:t.length}}function ch(e,t,n){let r=e.filter(e=>e.length>0).slice().sort((e,n)=>e[t]-n[t]);for(let e=1;e<r.length;e++){let i=r[e-1];if(r[e][t]<i[t]+i.length)throw Error(`${n} segments must not overlap`)}}function lh(e){let t=new Map;for(let n of e){if(n.length===0)continue;let e=2;for(;e<n.length;)e*=2;let r=t.get(e);r?r.push(n):t.set(e,[n])}return new Map(Array.from(t).sort(([e],[t])=>e-t))}function uh(e,t,n,r,i){let a=[],o=r.map(e=>`  SortSegment(${e.keysOffset}u, ${e.valuesOffset}u, ${e.outputKeysOffset}u, ${e.outputValuesOffset}u, ${e.length}u)`).join(`,
`),s=t.direction===`descending`,c=lm(e.device,{requiresSubgroupId:!0})===`subgroups`,l=`
${c?`enable subgroups;
requires subgroup_id;`:``}
struct SortSegment {
  keysOffset: u32,
  valuesOffset: u32,
  outputKeysOffset: u32,
  outputValuesOffset: u32,
  length: u32,
};

const INVALID_INDEX: u32 = ${rh}u;
const SEGMENT_COUNT: u32 = ${r.length}u;
const KEYS_OFFSET: u32 = ${L(t.keys)}u;
const VALUES_OFFSET: u32 = ${L(t.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${L(t.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${L(t.outputValues)}u;
const SEGMENTS: array<SortSegment, ${r.length}> = array<SortSegment, ${r.length}>(
${o}
);

@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;
var<workgroup> indices: array<u32, ${n}>;
var<workgroup> cachedKeys: array<u32, ${n}>;

fn comes_before(leftIndex: u32, rightIndex: u32, length: u32) -> bool {
  let leftValid = leftIndex != INVALID_INDEX && leftIndex < length;
  let rightValid = rightIndex != INVALID_INDEX && rightIndex < length;
  if (leftValid != rightValid) { return leftValid; }
  if (!leftValid) { return false; }
  let leftKey = cachedKeys[leftIndex];
  let rightKey = cachedKeys[rightIndex];
  if (leftKey == rightKey) { return leftIndex < rightIndex; }
  return ${s?`leftKey > rightKey`:`leftKey < rightKey`};
}

@compute @workgroup_size(${n}) fn main(
  ${c?`@builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,`:`@builtin(local_invocation_index) localInvocationIndex: u32,`}
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let segmentIndex =
    (workgroupId.z * ${i.y}u + workgroupId.y) * ${i.x}u + workgroupId.x;
  if (segmentIndex >= SEGMENT_COUNT) { return; }
  let segment = SEGMENTS[segmentIndex];
${c?fh(n):dh(n)}
}`,u=`${t.id}-bitonic-local-${n}`,d={keys:t.keys,values:t.values,outputKeys:t.outputKeys,outputValues:t.outputValues};return a.push(fp({id:u,resources:[{buffer:t.keys,usage:`storage-read`},{buffer:t.values,usage:`storage-read`},{buffer:t.outputKeys,usage:`storage-write`},{buffer:t.outputValues,usage:`storage-write`}],compile:({device:e})=>{let t=new em(e,{id:u,source:l,shaderLayout:{bindings:Object.keys(d).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:n})=>{let r={};for(let[e,t]of Object.entries(d))r[e]=I(t,n);t.dispatch(e,{bindings:r,x:i.x,y:i.y,z:i.z})},destroy:()=>t.destroy()}}})),a}function dh(e){return`
  indices[localInvocationIndex] = select(
    INVALID_INDEX,
    localInvocationIndex,
    localInvocationIndex < segment.length
  );
  if (localInvocationIndex < segment.length) {
    cachedKeys[localInvocationIndex] =
      keys[KEYS_OFFSET + segment.keysOffset + localInvocationIndex];
  } else {
    cachedKeys[localInvocationIndex] = 0u;
  }
  workgroupBarrier();

  for (var blockWidth = 2u; blockWidth <= ${e}u; blockWidth <<= 1u) {
    for (var compareStride = blockWidth >> 1u; compareStride > 0u; compareStride >>= 1u) {
      let partnerIndex = localInvocationIndex ^ compareStride;
      if (partnerIndex > localInvocationIndex) {
        let leftIndex = indices[localInvocationIndex];
        let rightIndex = indices[partnerIndex];
        let ascending = (localInvocationIndex & blockWidth) == 0u;
        let shouldSwap = select(
          comes_before(leftIndex, rightIndex, segment.length),
          comes_before(rightIndex, leftIndex, segment.length),
          ascending
        );
        indices[localInvocationIndex] = select(leftIndex, rightIndex, shouldSwap);
        indices[partnerIndex] = select(rightIndex, leftIndex, shouldSwap);
      }
      workgroupBarrier();
    }
  }

  if (localInvocationIndex < segment.length) {
    let sourceIndex = indices[localInvocationIndex];
    outputKeys[OUTPUT_KEYS_OFFSET + segment.outputKeysOffset + localInvocationIndex] =
      cachedKeys[sourceIndex];
    outputValues[OUTPUT_VALUES_OFFSET + segment.outputValuesOffset + localInvocationIndex] =
      values[VALUES_OFFSET + segment.valuesOffset + sourceIndex];
  }`}function fh(e){return`
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  var currentIndex = select(INVALID_INDEX, lane, lane < segment.length);
  if (lane < segment.length) {
    cachedKeys[lane] = keys[KEYS_OFFSET + segment.keysOffset + lane];
  } else {
    cachedKeys[lane] = 0u;
  }
  workgroupBarrier();

  for (var blockWidth = 2u; blockWidth <= ${e}u; blockWidth <<= 1u) {
    for (var compareStride = blockWidth >> 1u; compareStride > 0u; compareStride >>= 1u) {
      var partnerIndex = INVALID_INDEX;
      if (compareStride < subgroupSize) {
        partnerIndex = subgroupShuffleXor(currentIndex, compareStride);
      } else {
        indices[lane] = currentIndex;
        workgroupBarrier();
        partnerIndex = indices[lane ^ compareStride];
      }

      let lowerLane = (lane & compareStride) == 0u;
      let leftIndex = select(partnerIndex, currentIndex, lowerLane);
      let rightIndex = select(currentIndex, partnerIndex, lowerLane);
      let ascending = (lane & blockWidth) == 0u;
      let shouldSwap = select(
        comes_before(leftIndex, rightIndex, segment.length),
        comes_before(rightIndex, leftIndex, segment.length),
        ascending
      );
      let sortedLeft = select(leftIndex, rightIndex, shouldSwap);
      let sortedRight = select(rightIndex, leftIndex, shouldSwap);
      currentIndex = select(sortedRight, sortedLeft, lowerLane);

      if (compareStride >= subgroupSize) {
        workgroupBarrier();
      }
    }
  }

  if (lane < segment.length) {
    outputKeys[OUTPUT_KEYS_OFFSET + segment.outputKeysOffset + lane] = cachedKeys[currentIndex];
    outputValues[OUTPUT_VALUES_OFFSET + segment.outputValuesOffset + lane] =
      values[VALUES_OFFSET + segment.valuesOffset + currentIndex];
  }`}var ph=256,mh=128,hh=64,gh=4294967295,_h=class{id;strategy;resolvedStrategy;minima;maxima;sourceIds;leafCapacity;nodeMinima;nodeMaxima;nodeChildren;leafIds;count;overflow;dimension;nodeCount;internalNodeCount;levelCount;rootNode=0;topology=`complete-binary`;updatePolicy=`refit`;stats;constructor(e){if(this.id=e.id??`gpu-bvh`,this.strategy=e.strategy??`auto`,this.minima=e.minima,this.maxima=e.maxima,this.sourceIds=e.sourceIds,this.leafCapacity=e.leafCapacity,this.nodeMinima=e.nodeMinima,this.nodeMaxima=e.nodeMaxima,this.nodeChildren=e.nodeChildren,this.leafIds=e.leafIds,this.count=e.count,this.overflow=e.overflow,this.dimension=this.minima.format===`float32x2`?2:3,this.minima.length>gh)throw Error(`${this.id} source row count exceeds uint32 range`);if(!Number.isSafeInteger(this.leafCapacity)||!wh(this.leafCapacity))throw Error(`${this.id} leafCapacity must be a positive power of two`);if(![`auto`,`fused`,`level`].includes(this.strategy))throw Error(`${this.id} strategy must be auto, fused, or level`);let t=this.minima.buffer.graph.device.limits,n=this.leafCapacity<=mh&&this.leafCapacity<=t.maxComputeInvocationsPerWorkgroup&&this.leafCapacity<=t.maxComputeWorkgroupSizeX&&this.leafCapacity*hh<=t.maxComputeWorkgroupStorageSize;if(this.strategy===`fused`&&!n)throw Error(`${this.id} fused strategy exceeds portable single-workgroup limits`);if(this.resolvedStrategy=this.strategy===`level`||!n?`level`:`fused`,this.nodeCount=this.leafCapacity*2-1,this.internalNodeCount=this.leafCapacity-1,this.levelCount=Math.log2(this.leafCapacity)+1,!Number.isSafeInteger(this.nodeCount)||this.nodeCount>gh)throw Error(`${this.id} node count exceeds uint32 range`);if(Xp(this.minima,[`float32x2`,`float32x3`],`${this.id} minima`),Xp(this.maxima,[`float32x2`,`float32x3`],`${this.id} maxima`),Xp(this.nodeMinima,[`float32x2`,`float32x3`],`${this.id} nodeMinima`),Xp(this.nodeMaxima,[`float32x2`,`float32x3`],`${this.id} nodeMaxima`),Xp(this.nodeChildren,[`uint32x2`],`${this.id} nodeChildren`),Zp(this.leafIds,`${this.id} leafIds`),Zp(this.count,`${this.id} count`),Zp(this.overflow,`${this.id} overflow`),this.sourceIds&&Zp(this.sourceIds,`${this.id} sourceIds`),this.minima.format!==this.maxima.format||this.minima.length!==this.maxima.length)throw Error(`${this.id} minima and maxima must have matching formats and lengths`);if(this.sourceIds&&this.sourceIds.length!==this.minima.length)throw Error(`${this.id} sourceIds.length must equal bounds length`);if(this.nodeMinima.format!==this.minima.format||this.nodeMaxima.format!==this.minima.format||this.nodeMinima.length!==this.nodeCount||this.nodeMaxima.length!==this.nodeCount)throw Error(`${this.id} node bounds must match source format and node count`);if(this.nodeChildren.length!==this.nodeCount)throw Error(`${this.id} nodeChildren.length must equal node count`);if(this.leafIds.length!==this.leafCapacity)throw Error(`${this.id} leafIds.length must equal leafCapacity`);if(this.count.length<1||this.overflow.length<1)throw Error(`${this.id} count and overflow must each contain one uint32 row`);let r=Cf(this.minima.format).byteLength;this.stats={dimension:this.dimension,leafCapacity:this.leafCapacity,internalNodeCount:this.internalNodeCount,nodeCount:this.nodeCount,levelCount:this.levelCount,outputByteLength:this.nodeCount*(r*2+Uint32Array.BYTES_PER_ELEMENT*2)+this.leafCapacity*Uint32Array.BYTES_PER_ELEMENT+Uint32Array.BYTES_PER_ELEMENT*2}}getCommandNodes(e){let t=[];if([this.minima,this.maxima,...this.sourceIds?[this.sourceIds]:[],this.nodeMinima,this.nodeMaxima,this.nodeChildren,this.leafIds,this.count,this.overflow].some(t=>t.buffer.graph!==e))throw Error(`${this.id} views must belong to the target graph`);if(this.resolvedStrategy===`fused`)t.push(...vh(e,this));else{t.push(...yh(e,this,Ch(this.nodeCount,e.device.limits.maxComputeWorkgroupsPerDimension)));for(let n=this.levelCount-2;n>=0;n--)t.push(...xh(e,this,n))}return this.sourceIds&&t.push(...bh(e,this,this.sourceIds)),t}};function vh(e,t){let n=[],r=`
const SOURCE_COUNT: u32 = ${t.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(t.minima.length,t.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${t.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${t.internalNodeCount}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${L(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${L(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${L(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${L(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${L(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${L(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${L(t.count)}u;
const OVERFLOW_OFFSET: u32 = ${L(t.overflow)}u;
@group(0) @binding(0) var<storage, read> sourceMinima: array<f32>;
@group(0) @binding(1) var<storage, read> sourceMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(4) var<storage, read_write> nodeChildren: array<u32>;
@group(0) @binding(5) var<storage, read_write> leafIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(7) var<storage, read_write> outputOverflow: array<u32>;

var<workgroup> sharedMinima: array<vec4<f32>, ${t.leafCapacity*2}>;
var<workgroup> sharedMaxima: array<vec4<f32>, ${t.leafCapacity*2}>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${t.leafCapacity}) fn main(
  @builtin(local_invocation_index) localIndex: u32
) {
  var minimum = vec4<f32>(3.402823466e+38);
  var maximum = vec4<f32>(-3.402823466e+38);
  let leafNode = INTERNAL_NODE_COUNT + localIndex;
  let leafComponent = leafNode * DIMENSION;
  let leafChildComponent = leafNode * 2u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent] = ${gh}u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent + 1u] = ${gh}u;
  leafIds[LEAF_IDS_OFFSET + localIndex] = ${gh}u;

  if (localIndex < STORED_COUNT) {
    let sourceComponent = localIndex * DIMENSION;
    var valid = true;
    for (var axis = 0u; axis < DIMENSION; axis++) {
      let sourceMinimum = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
      let sourceMaximum = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
      valid = valid && finite(sourceMinimum) && finite(sourceMaximum) &&
        sourceMinimum <= sourceMaximum;
    }
    leafIds[LEAF_IDS_OFFSET + localIndex] = localIndex;
    if (valid) {
      for (var axis = 0u; axis < DIMENSION; axis++) {
        minimum[axis] = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
        maximum[axis] = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
      }
    }
  }

  for (var axis = 0u; axis < DIMENSION; axis++) {
    nodeMinima[NODE_MINIMA_OFFSET + leafComponent + axis] = minimum[axis];
    nodeMaxima[NODE_MAXIMA_OFFSET + leafComponent + axis] = maximum[axis];
  }
  sharedMinima[localIndex] = minimum;
  sharedMaxima[localIndex] = maximum;

  if (localIndex < INTERNAL_NODE_COUNT) {
    let childComponent = localIndex * 2u;
    nodeChildren[CHILDREN_OFFSET + childComponent] = localIndex * 2u + 1u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = localIndex * 2u + 2u;
  }
  if (localIndex == 0u) {
    outputCount[COUNT_OFFSET] = SOURCE_COUNT;
    outputOverflow[OVERFLOW_OFFSET] = select(0u, 1u, SOURCE_COUNT > LEAF_CAPACITY);
  }
  workgroupBarrier();

  var sourceOffset = 0u;
  var destinationOffset = LEAF_CAPACITY;
  for (var levelNodeCount = LEAF_CAPACITY / 2u;
       levelNodeCount > 0u;
       levelNodeCount = levelNodeCount / 2u) {
    if (localIndex < levelNodeCount) {
      let firstChild = sourceOffset + localIndex * 2u;
      let reducedMinimum = min(sharedMinima[firstChild], sharedMinima[firstChild + 1u]);
      let reducedMaximum = max(sharedMaxima[firstChild], sharedMaxima[firstChild + 1u]);
      sharedMinima[destinationOffset + localIndex] = reducedMinimum;
      sharedMaxima[destinationOffset + localIndex] = reducedMaximum;

      let nodeIndex = levelNodeCount - 1u + localIndex;
      let nodeComponent = nodeIndex * DIMENSION;
      for (var axis = 0u; axis < DIMENSION; axis++) {
        nodeMinima[NODE_MINIMA_OFFSET + nodeComponent + axis] = reducedMinimum[axis];
        nodeMaxima[NODE_MAXIMA_OFFSET + nodeComponent + axis] = reducedMaximum[axis];
      }
    }
    workgroupBarrier();
    let previousSourceOffset = sourceOffset;
    sourceOffset = destinationOffset;
    destinationOffset = previousSourceOffset;
  }
}`,i=[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.count,usage:`storage-write`},{buffer:t.overflow,usage:`storage-write`}];return n.push(...Sh(e,{id:`${t.id}-fused-refit`,source:r,resources:i,bindings:{sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCount:t.count,outputOverflow:t.overflow},dispatchCount:1})),n}function yh(e,t,n){let r=[],i=`
const SOURCE_COUNT: u32 = ${t.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(t.minima.length,t.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${t.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${t.internalNodeCount}u;
const NODE_COUNT: u32 = ${t.nodeCount}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${L(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${L(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${L(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${L(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${L(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${L(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${L(t.count)}u;
const OVERFLOW_OFFSET: u32 = ${L(t.overflow)}u;
@group(0) @binding(0) var<storage, read> sourceMinima: array<f32>;
@group(0) @binding(1) var<storage, read> sourceMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(4) var<storage, read_write> nodeChildren: array<u32>;
@group(0) @binding(5) var<storage, read_write> leafIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(7) var<storage, read_write> outputOverflow: array<u32>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${ph}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${n.y}u + workgroupId.y) * ${n.x}u + workgroupId.x;
  let nodeIndex = workgroupIndex * ${ph}u + localId.x;
  if (nodeIndex >= NODE_COUNT) { return; }
  let nodeComponent = nodeIndex * DIMENSION;
  for (var axis = 0u; axis < DIMENSION; axis++) {
    nodeMinima[NODE_MINIMA_OFFSET + nodeComponent + axis] = 3.402823466e+38;
    nodeMaxima[NODE_MAXIMA_OFFSET + nodeComponent + axis] = -3.402823466e+38;
  }
  let childComponent = nodeIndex * 2u;
  if (nodeIndex < INTERNAL_NODE_COUNT) {
    nodeChildren[CHILDREN_OFFSET + childComponent] = nodeIndex * 2u + 1u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = nodeIndex * 2u + 2u;
  } else {
    nodeChildren[CHILDREN_OFFSET + childComponent] = ${gh}u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = ${gh}u;
    let leafIndex = nodeIndex - INTERNAL_NODE_COUNT;
    leafIds[LEAF_IDS_OFFSET + leafIndex] = ${gh}u;
    if (leafIndex < STORED_COUNT) {
      var valid = true;
      let sourceComponent = leafIndex * DIMENSION;
      for (var axis = 0u; axis < DIMENSION; axis++) {
        let minimum = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
        let maximum = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
        valid = valid && finite(minimum) && finite(maximum) && minimum <= maximum;
      }
      leafIds[LEAF_IDS_OFFSET + leafIndex] = leafIndex;
      if (valid) {
        for (var axis = 0u; axis < DIMENSION; axis++) {
          nodeMinima[NODE_MINIMA_OFFSET + nodeComponent + axis] =
            sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
          nodeMaxima[NODE_MAXIMA_OFFSET + nodeComponent + axis] =
            sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
        }
      }
    }
  }
  if (nodeIndex == 0u) {
    outputCount[COUNT_OFFSET] = SOURCE_COUNT;
    outputOverflow[OVERFLOW_OFFSET] = select(0u, 1u, SOURCE_COUNT > LEAF_CAPACITY);
  }
}`,a=[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.count,usage:`storage-write`},{buffer:t.overflow,usage:`storage-write`}];return r.push(...Sh(e,{id:`${t.id}-load-leaves`,source:i,resources:a,bindings:{sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCount:t.count,outputOverflow:t.overflow},dispatchSize:n})),r}function bh(e,t,n){let r=[],i=Math.min(n.length,t.leafCapacity),a=Ch(i,e.device.limits.maxComputeWorkgroupsPerDimension),o=`
const STORED_COUNT: u32 = ${i}u;
const SOURCE_IDS_OFFSET: u32 = ${L(n)}u;
const LEAF_IDS_OFFSET: u32 = ${L(t.leafIds)}u;
@group(0) @binding(0) var<storage, read> sourceIds: array<u32>;
@group(0) @binding(1) var<storage, read_write> leafIds: array<u32>;

@compute @workgroup_size(${ph}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${a.y}u + workgroupId.y) * ${a.x}u + workgroupId.x;
  let leafIndex = workgroupIndex * ${ph}u + localId.x;
  if (leafIndex >= STORED_COUNT) { return; }
  let sourceIndex = leafIds[LEAF_IDS_OFFSET + leafIndex];
  if (sourceIndex == ${gh}u) { return; }
  leafIds[LEAF_IDS_OFFSET + leafIndex] = sourceIds[SOURCE_IDS_OFFSET + sourceIndex];
}`;return r.push(...Sh(e,{id:`${t.id}-remap-source-ids`,source:o,resources:[{buffer:n,usage:`storage-read`},{buffer:t.leafIds,usage:`storage-read-write`}],bindings:{sourceIds:n,leafIds:t.leafIds},dispatchSize:a})),r}function xh(e,t,n){let r=[],i=2**n-1,a=2**n,o=`
const FIRST_NODE: u32 = ${i}u;
const LEVEL_NODE_COUNT: u32 = ${a}u;
const DIMENSION: u32 = ${t.dimension}u;
const NODE_MINIMA_OFFSET: u32 = ${L(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${L(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${L(t.nodeChildren)}u;
@group(0) @binding(0) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(1) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> nodeChildren: array<u32>;

@compute @workgroup_size(${ph}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x >= LEVEL_NODE_COUNT) { return; }
  let nodeIndex = FIRST_NODE + globalId.x;
  let childComponent = nodeIndex * 2u;
  let left = nodeChildren[CHILDREN_OFFSET + childComponent];
  let right = nodeChildren[CHILDREN_OFFSET + childComponent + 1u];
  for (var axis = 0u; axis < DIMENSION; axis++) {
    nodeMinima[NODE_MINIMA_OFFSET + nodeIndex * DIMENSION + axis] = min(
      nodeMinima[NODE_MINIMA_OFFSET + left * DIMENSION + axis],
      nodeMinima[NODE_MINIMA_OFFSET + right * DIMENSION + axis]
    );
    nodeMaxima[NODE_MAXIMA_OFFSET + nodeIndex * DIMENSION + axis] = max(
      nodeMaxima[NODE_MAXIMA_OFFSET + left * DIMENSION + axis],
      nodeMaxima[NODE_MAXIMA_OFFSET + right * DIMENSION + axis]
    );
  }
}`;return r.push(...Sh(e,{id:`${t.id}-refit-depth-${n}`,source:o,resources:[{buffer:t.nodeMinima,usage:`storage-read-write`},{buffer:t.nodeMaxima,usage:`storage-read-write`},{buffer:t.nodeChildren,usage:`storage-read`}],bindings:{nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren},dispatchCount:Math.ceil(a/ph)})),r}function Sh(e,t){let n=[];return n.push(fp({id:t.id,resources:t.resources,compile:({device:e})=>{let n=new em(e,{id:t.id,source:t.source,shaderLayout:{bindings:Object.keys(t.bindings).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:r})=>{let i={};for(let[e,n]of Object.entries(t.bindings))i[e]=I(n,r);t.dispatchSize?n.dispatch(e,{bindings:i,x:t.dispatchSize.x,y:t.dispatchSize.y,z:t.dispatchSize.z}):n.dispatch(e,{bindings:i,x:t.dispatchCount})},destroy:()=>n.destroy()}}})),n}function Ch(e,t){let n=Math.floor(t),r=Math.max(1,Math.ceil(e/ph)),i=Math.min(r,n),a=Math.min(Math.ceil(r/i),n),o=Math.ceil(r/i/a);if(o>n)throw Error(`GPUBVH requires ${r} workgroups, exceeding the 3D dispatch limit of ${n} per dimension`);return{x:i,y:a,z:o}}function wh(e){return e>0&&Number.isInteger(Math.log2(e))}var Th=128,Eh=64,Dh=4294967295,Oh=class{id;minima;maxima;nodeMinima;nodeMaxima;nodeChildren;leafIds;counts;overflows;segments;dimension;topology=`complete-binary`;updatePolicy=`refit`;constructor(e){if(this.id=e.id??`gpu-segmented-bvh`,this.minima=e.minima,this.maxima=e.maxima,this.nodeMinima=e.nodeMinima,this.nodeMaxima=e.nodeMaxima,this.nodeChildren=e.nodeChildren,this.leafIds=e.leafIds,this.counts=e.counts,this.overflows=e.overflows,this.dimension=this.minima.format===`float32x2`?2:3,Xp(this.minima,[`float32x2`,`float32x3`],`${this.id} minima`),Xp(this.maxima,[`float32x2`,`float32x3`],`${this.id} maxima`),Xp(this.nodeMinima,[`float32x2`,`float32x3`],`${this.id} nodeMinima`),Xp(this.nodeMaxima,[`float32x2`,`float32x3`],`${this.id} nodeMaxima`),Xp(this.nodeChildren,[`uint32x2`],`${this.id} nodeChildren`),Zp(this.leafIds,`${this.id} leafIds`),Zp(this.counts,`${this.id} counts`),Zp(this.overflows,`${this.id} overflows`),this.minima.format!==this.maxima.format||this.minima.length!==this.maxima.length)throw Error(`${this.id} minima and maxima must have matching formats and lengths`);if(this.nodeMinima.format!==this.minima.format||this.nodeMaxima.format!==this.minima.format||this.nodeMinima.length!==this.nodeMaxima.length||this.nodeMinima.length!==this.nodeChildren.length)throw Error(`${this.id} node views must have matching formats and lengths`);if(this.counts.length!==this.overflows.length)throw Error(`${this.id} counts and overflows must have matching lengths`);let t=[this.minima,this.maxima],n=[this.nodeMinima,this.nodeMaxima,this.nodeChildren,this.leafIds,this.counts,this.overflows];for(let[e,r]of n.entries())if(t.some(e=>e.buffer===r.buffer)||n.slice(0,e).some(e=>e.buffer===r.buffer))throw Error(`${this.id} outputs must use separate buffers from inputs and each other`);this.segments=e.segments.map((e,t)=>Ah(this,e,t)),Mh(this.segments,`nodeOffset`,e=>e.leafCapacity*2-1),Mh(this.segments,`leafOffset`,e=>e.leafCapacity),Mh(this.segments,`metadataOffset`,()=>1)}getCommandNodes(e){let t=[];return t.push(...kh(this,e,e.device.limits.maxComputeWorkgroupsPerDimension)),t}};function kh(e,t,n){let r=[];for(let n of[e.minima,e.maxima,e.nodeMinima,e.nodeMaxima,e.nodeChildren,e.leafIds,e.counts,e.overflows])if(n.buffer.graph!==t)throw Error(`${e.id} views must belong to the target graph`);let i=Nh(e.segments),a=Array.from(i,([t,r])=>{let i=Math.max(2,t);return{leafCapacity:t,segments:r,dispatchLayout:am(`${e.id} ${t}-leaf hierarchies`,r.length*i,i,n)}});for(let n of a)r.push(...Ph(t,e,n.leafCapacity,n.segments,n.dispatchLayout));return r}function Ah(e,t,n){let r=`${e.id} segment ${n}`;if(!Number.isSafeInteger(t.leafCapacity)||t.leafCapacity<1||t.leafCapacity>Th||t.leafCapacity&t.leafCapacity-1)throw Error(`${r} leafCapacity must be a positive power of two from 1 through 128`);let i=e.minima.buffer.graph.device.limits;if(t.leafCapacity>i.maxComputeInvocationsPerWorkgroup||t.leafCapacity>i.maxComputeWorkgroupSizeX||t.leafCapacity*Eh>i.maxComputeWorkgroupStorageSize)throw Error(`${r} leafCapacity exceeds portable single-workgroup limits`);for(let e of[`sourceOffset`,`sourceCount`,`nodeOffset`,`leafOffset`,`metadataOffset`]){let n=t[e];if(!Number.isSafeInteger(n)||n<0||n>Dh)throw Error(`${r} ${e} must be a non-negative uint32`)}return jh(r,`sourceOffset`,t.sourceOffset,t.sourceCount,e.minima.length),jh(r,`nodeOffset`,t.nodeOffset,t.leafCapacity*2-1,e.nodeMinima.length),jh(r,`leafOffset`,t.leafOffset,t.leafCapacity,e.leafIds.length),jh(r,`metadataOffset`,t.metadataOffset,1,e.counts.length),{sourceOffset:t.sourceOffset,sourceCount:t.sourceCount,nodeOffset:t.nodeOffset,leafOffset:t.leafOffset,metadataOffset:t.metadataOffset,leafCapacity:t.leafCapacity}}function jh(e,t,n,r,i){if(n>i||r>i-n)throw Error(`${e} ${t} and required rows exceed the parent view`)}function Mh(e,t,n){let r=e.slice().sort((e,n)=>e[t]-n[t]);for(let e=1;e<r.length;e++){let i=r[e-1];if(r[e][t]<i[t]+n(i))throw Error(`GPUSegmentedBVH ${t} ranges must not overlap`)}}function Nh(e){let t=new Map;for(let n of e){let e=t.get(n.leafCapacity);e?e.push(n):t.set(n.leafCapacity,[n])}return new Map(Array.from(t).sort(([e],[t])=>e-t))}function Ph(e,t,n,r,i){let a=[],o=r.map(e=>`  BVHSegment(${e.sourceOffset}u, ${e.sourceCount}u, ${e.nodeOffset}u, ${e.leafOffset}u, ${e.metadataOffset}u)`).join(`,
`),s=`
struct BVHSegment {
  sourceOffset: u32,
  sourceCount: u32,
  nodeOffset: u32,
  leafOffset: u32,
  metadataOffset: u32,
};

const SEGMENT_COUNT: u32 = ${r.length}u;
const LEAF_CAPACITY: u32 = ${n}u;
const INTERNAL_NODE_COUNT: u32 = ${n-1}u;
const DIMENSION: u32 = ${t.dimension}u;
const MINIMA_OFFSET: u32 = ${L(t.minima)}u;
const MAXIMA_OFFSET: u32 = ${L(t.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${L(t.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${L(t.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${L(t.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${L(t.leafIds)}u;
const COUNT_OFFSET: u32 = ${L(t.counts)}u;
const OVERFLOW_OFFSET: u32 = ${L(t.overflows)}u;
const SEGMENTS: array<BVHSegment, ${r.length}> = array<BVHSegment, ${r.length}>(
${o}
);

@group(0) @binding(0) var<storage, read> sourceMinima: array<f32>;
@group(0) @binding(1) var<storage, read> sourceMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(4) var<storage, read_write> nodeChildren: array<u32>;
@group(0) @binding(5) var<storage, read_write> leafIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> outputCounts: array<u32>;
@group(0) @binding(7) var<storage, read_write> outputOverflows: array<u32>;

var<workgroup> sharedMinima: array<vec4<f32>, ${n*2}>;
var<workgroup> sharedMaxima: array<vec4<f32>, ${n*2}>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${n}) fn main(
  @builtin(local_invocation_index) localIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let segmentIndex =
    (workgroupId.z * ${i.y}u + workgroupId.y) * ${i.x}u + workgroupId.x;
  if (segmentIndex >= SEGMENT_COUNT) { return; }
  let segment = SEGMENTS[segmentIndex];
  let storedCount = min(segment.sourceCount, LEAF_CAPACITY);
  var minimum = vec4<f32>(3.402823466e+38);
  var maximum = vec4<f32>(-3.402823466e+38);
  let localLeafNode = INTERNAL_NODE_COUNT + localIndex;
  let globalLeafNode = segment.nodeOffset + localLeafNode;
  let leafComponent = globalLeafNode * DIMENSION;
  let leafChildComponent = globalLeafNode * 2u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent] = ${Dh}u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent + 1u] = ${Dh}u;
  leafIds[LEAF_IDS_OFFSET + segment.leafOffset + localIndex] = ${Dh}u;

  if (localIndex < storedCount) {
    let sourceComponent = (segment.sourceOffset + localIndex) * DIMENSION;
    var valid = true;
    for (var axis = 0u; axis < DIMENSION; axis++) {
      let sourceMinimum = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
      let sourceMaximum = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
      valid = valid && finite(sourceMinimum) && finite(sourceMaximum) &&
        sourceMinimum <= sourceMaximum;
    }
    leafIds[LEAF_IDS_OFFSET + segment.leafOffset + localIndex] = localIndex;
    if (valid) {
      for (var axis = 0u; axis < DIMENSION; axis++) {
        minimum[axis] = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
        maximum[axis] = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
      }
    }
  }

  for (var axis = 0u; axis < DIMENSION; axis++) {
    nodeMinima[NODE_MINIMA_OFFSET + leafComponent + axis] = minimum[axis];
    nodeMaxima[NODE_MAXIMA_OFFSET + leafComponent + axis] = maximum[axis];
  }
  sharedMinima[localIndex] = minimum;
  sharedMaxima[localIndex] = maximum;

  if (localIndex < INTERNAL_NODE_COUNT) {
    let childComponent = (segment.nodeOffset + localIndex) * 2u;
    nodeChildren[CHILDREN_OFFSET + childComponent] = localIndex * 2u + 1u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = localIndex * 2u + 2u;
  }
  if (localIndex == 0u) {
    outputCounts[COUNT_OFFSET + segment.metadataOffset] = segment.sourceCount;
    outputOverflows[OVERFLOW_OFFSET + segment.metadataOffset] =
      select(0u, 1u, segment.sourceCount > LEAF_CAPACITY);
  }
  workgroupBarrier();

  var sourceOffset = 0u;
  var destinationOffset = LEAF_CAPACITY;
  for (var levelNodeCount = LEAF_CAPACITY / 2u;
       levelNodeCount > 0u;
       levelNodeCount = levelNodeCount / 2u) {
    if (localIndex < levelNodeCount) {
      let firstChild = sourceOffset + localIndex * 2u;
      let reducedMinimum = min(sharedMinima[firstChild], sharedMinima[firstChild + 1u]);
      let reducedMaximum = max(sharedMaxima[firstChild], sharedMaxima[firstChild + 1u]);
      sharedMinima[destinationOffset + localIndex] = reducedMinimum;
      sharedMaxima[destinationOffset + localIndex] = reducedMaximum;

      let nodeIndex = segment.nodeOffset + levelNodeCount - 1u + localIndex;
      let nodeComponent = nodeIndex * DIMENSION;
      for (var axis = 0u; axis < DIMENSION; axis++) {
        nodeMinima[NODE_MINIMA_OFFSET + nodeComponent + axis] = reducedMinimum[axis];
        nodeMaxima[NODE_MAXIMA_OFFSET + nodeComponent + axis] = reducedMaximum[axis];
      }
    }
    workgroupBarrier();
    let previousSourceOffset = sourceOffset;
    sourceOffset = destinationOffset;
    destinationOffset = previousSourceOffset;
  }
}`,c=`${t.id}-fused-refit-${n}`,l={sourceMinima:t.minima,sourceMaxima:t.maxima,nodeMinima:t.nodeMinima,nodeMaxima:t.nodeMaxima,nodeChildren:t.nodeChildren,leafIds:t.leafIds,outputCounts:t.counts,outputOverflows:t.overflows};return a.push(fp({id:c,resources:[{buffer:t.minima,usage:`storage-read`},{buffer:t.maxima,usage:`storage-read`},{buffer:t.nodeMinima,usage:`storage-write`},{buffer:t.nodeMaxima,usage:`storage-write`},{buffer:t.nodeChildren,usage:`storage-write`},{buffer:t.leafIds,usage:`storage-write`},{buffer:t.counts,usage:`storage-write`},{buffer:t.overflows,usage:`storage-write`}],compile:({device:e})=>{let t=new em(e,{id:c,source:s,shaderLayout:{bindings:Object.keys(l).map((e,t)=>({name:e,type:`storage`,group:0,location:t}))}});return{encode:({computePass:e,getBuffer:n})=>{let r={};for(let[e,t]of Object.entries(l))r[e]=I(t,n);t.dispatch(e,{bindings:r,x:i.x,y:i.y,z:i.z})},destroy:()=>t.destroy()}}})),a}var Fh=`
struct RayTracingUniforms {
  inverseViewProjection: mat4x4<f32>,
  cameraPosition: vec4<f32>,
  background: vec4<f32>,
  dimensions: vec4<u32>,
  settings: vec4<f32>,
  fog: vec4<f32>,
  acceleration: vec4<u32>,
  displayPhase: vec4<u32>,
  temporal: vec4<f32>,
  previousViewProjection: mat4x4<f32>,
  previousCameraPosition: vec4<f32>,
  sampling: vec4<u32>,
  imageRegion: vec4<u32>,
  emitters: vec4<u32>,
};

struct RayPrimitive {
  transform: mat4x4<f32>,
  inverseTransform: mat4x4<f32>,
  baseColor: vec4<f32>,
  emissive: vec4<f32>,
  properties: vec4<f32>,
  bounds: vec4<f32>,
  blas: vec4<f32>,
  previousTransform: mat4x4<f32>,
  material: vec4<f32>,
};

struct RayBlasNode {
  minimum: vec4<f32>,
  maximum: vec4<f32>,
};
`,Ih=`
${Fh}

@group(0) @binding(0) var<uniform> uniforms: RayTracingUniforms;
@group(0) @binding(1) var<storage, read> primitives: array<RayPrimitive>;
@group(0) @binding(2) var<storage, read_write> primitiveMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> primitiveMaxima: array<f32>;
@group(0) @binding(4) var<storage, read> blasNodes: array<RayBlasNode>;

const INVALID_BOUND = 3.402823466e+38;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let primitiveIndex = invocation.x;
  if (primitiveIndex >= uniforms.acceleration.z) {
    return;
  }

  let componentIndex = primitiveIndex * 3u;
  if (primitiveIndex >= uniforms.dimensions.z) {
    for (var axis = 0u; axis < 3u; axis++) {
      primitiveMinima[componentIndex + axis] = INVALID_BOUND;
      primitiveMaxima[componentIndex + axis] = -INVALID_BOUND;
    }
    return;
  }

  let primitive = primitives[primitiveIndex];
  var localCenter = primitive.bounds.xyz;
  var localExtent = vec3<f32>(max(primitive.bounds.w, 0.0));
  let usesMeshBounds = primitive.properties.y <= 0.0 && primitive.properties.w > 0.0;
  if (usesMeshBounds) {
    let rootNode = blasNodes[u32(primitive.blas.x)];
    localCenter = (rootNode.minimum.xyz + rootNode.maximum.xyz) * 0.5;
    localExtent = max((rootNode.maximum.xyz - rootNode.minimum.xyz) * 0.5, vec3<f32>(0.0));
  }
  let center = (primitive.transform * vec4<f32>(localCenter, 1.0)).xyz;
  let firstRow = vec3<f32>(
    primitive.transform[0].x,
    primitive.transform[1].x,
    primitive.transform[2].x
  );
  let secondRow = vec3<f32>(
    primitive.transform[0].y,
    primitive.transform[1].y,
    primitive.transform[2].y
  );
  let thirdRow = vec3<f32>(
    primitive.transform[0].z,
    primitive.transform[1].z,
    primitive.transform[2].z
  );
  let sphereExtent = vec3<f32>(length(firstRow), length(secondRow), length(thirdRow)) *
    max(primitive.bounds.w, 0.0);
  let meshExtent = vec3<f32>(
    dot(abs(firstRow), localExtent),
    dot(abs(secondRow), localExtent),
    dot(abs(thirdRow), localExtent)
  );
  let extent = select(sphereExtent, meshExtent, usesMeshBounds);
  let minimum = center - extent;
  let maximum = center + extent;
  for (var axis = 0u; axis < 3u; axis++) {
    primitiveMinima[componentIndex + axis] = minimum[axis];
    primitiveMaxima[componentIndex + axis] = maximum[axis];
  }
}
`,Lh=`
${Fh}

@group(0) @binding(0) var<uniform> uniforms: RayTracingUniforms;
@group(0) @binding(1) var historyImage: texture_2d<f32>;
@group(0) @binding(2) var historyMetadata: texture_2d<f32>;
@group(0) @binding(3) var outputImage: texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var outputMetadata: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let phaseCount = max(uniforms.displayPhase.w, 1u);
  if (phaseCount <= 1u || invocation.y >= uniforms.dimensions.y) {
    return;
  }

  let untouchedPhaseCount = phaseCount - 1u;
  let compactWidth =
    (uniforms.dimensions.x * untouchedPhaseCount + phaseCount - 1u) / phaseCount;
  if (invocation.x >= compactWidth) {
    return;
  }

  let selectedPhase = (uniforms.displayPhase.z + invocation.y) % phaseCount;
  let blockIndex = invocation.x / untouchedPhaseCount;
  let laneIndex = invocation.x % untouchedPhaseCount;
  let pixelX = blockIndex * phaseCount + laneIndex + select(0u, 1u, laneIndex >= selectedPhase);
  if (pixelX >= uniforms.dimensions.x) {
    return;
  }

  let pixel = vec2<i32>(i32(pixelX), i32(invocation.y));
  textureStore(outputImage, pixel, textureLoad(historyImage, pixel, 0));
  textureStore(outputMetadata, pixel, textureLoad(historyMetadata, pixel, 0));
}
`,Rh=`
${Fh}

struct RayTriangle {
  firstPosition: vec4<f32>,
  secondPosition: vec4<f32>,
  thirdPosition: vec4<f32>,
  firstNormal: vec4<f32>,
  secondNormal: vec4<f32>,
  thirdNormal: vec4<f32>,
};

struct RayLight {
  colorIntensity: vec4<f32>,
  positionInnerCone: vec4<f32>,
  directionType: vec4<f32>,
  attenuationOuterCone: vec4<f32>,
};

struct Ray {
  origin: vec3<f32>,
  direction: vec3<f32>,
};

struct RayHit {
  distance: f32,
  normal: vec3<f32>,
  primitiveIndex: u32,
};

struct PendingRayNode {
  nodeIndex: u32,
  entryDistance: f32,
};

struct HistoricalRaySample {
  color: vec3<f32>,
  sampleCount: f32,
  valid: bool,
};

@group(0) @binding(0) var<uniform> uniforms: RayTracingUniforms;
@group(0) @binding(1) var<storage, read> primitives: array<RayPrimitive>;
@group(0) @binding(2) var<storage, read> triangles: array<RayTriangle>;
@group(0) @binding(3) var<storage, read> lights: array<RayLight>;
@group(0) @binding(4) var<storage, read> nodeMinima: array<f32>;
@group(0) @binding(5) var<storage, read> nodeMaxima: array<f32>;
@group(0) @binding(6) var<storage, read> leafPrimitiveIds: array<u32>;
@group(0) @binding(7) var<storage, read> blasNodes: array<RayBlasNode>;
@group(0) @binding(8) var<storage, read> blasTriangleIds: array<u32>;
@group(0) @binding(9) var historyImage: texture_2d<f32>;
@group(0) @binding(10) var historyMetadata: texture_2d<f32>;
@group(0) @binding(11) var outputImage: texture_storage_2d<rgba16float, write>;
@group(0) @binding(12) var outputMetadata: texture_storage_2d<rgba16float, write>;

const RAY_EPSILON = 0.0005;
const RAY_INFINITY = 1.0e20;
const PI = 3.141592653589793;
const BVH_STACK_CAPACITY = 32u;
const BLAS_STACK_CAPACITY = 32u;
fn getHistorySampleLimit() -> f32 {
  return f32(clamp(select(64u, uniforms.sampling.z, uniforms.sampling.z > 0u), 1u, 256u));
}
const MINIMUM_HISTORY_NORMAL_ALIGNMENT = 0.75;
const MAXIMUM_HISTORY_RELATIVE_DEPTH_DIFFERENCE = 0.06;
const MAXIMUM_EXACT_HISTORY_PRIMITIVE_INDEX = 2047u;
const OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER = 65504.0;

fn makeRandom(seed: u32) -> f32 {
  var value = seed * 747796405u + 2891336453u;
  value = ((value >> ((value >> 28u) + 4u)) ^ value) * 277803737u;
  value = (value >> 22u) ^ value;
  return f32(value) / 4294967295.0;
}

fn makeCameraRayAtFullCoordinates(coordinates: vec2<f32>) -> Ray {
  let clipCoordinates = vec2<f32>(coordinates.x * 2.0 - 1.0, 1.0 - coordinates.y * 2.0);
  let farPoint = uniforms.inverseViewProjection * vec4<f32>(clipCoordinates, 1.0, 1.0);
  let farPosition = farPoint.xyz / farPoint.w;
  var origin = uniforms.cameraPosition.xyz;
  if (uniforms.cameraPosition.w > 0.5) {
    let nearPoint = uniforms.inverseViewProjection * vec4<f32>(clipCoordinates, -1.0, 1.0);
    origin = nearPoint.xyz / nearPoint.w;
  }
  return Ray(origin, normalize(farPosition - origin));
}

fn makeCameraRayAtCoordinates(coordinates: vec2<f32>) -> Ray {
  if (uniforms.imageRegion.z > 0u) {
    return makeCameraRayAtFullCoordinates((coordinates * vec2<f32>(uniforms.displayPhase.xy)
      + vec2<f32>(uniforms.imageRegion.xy)) / vec2<f32>(uniforms.imageRegion.zw));
  }
  return makeCameraRayAtFullCoordinates(coordinates);
}

fn makeCameraRayAtOffset(pixel: vec2<u32>, offset: vec2<f32>) -> Ray {
  if (uniforms.imageRegion.z > 0u) {
    return makeCameraRayAtFullCoordinates((vec2<f32>(pixel + uniforms.imageRegion.xy) + offset)
      / vec2<f32>(uniforms.imageRegion.zw));
  }
  return makeCameraRayAtFullCoordinates(
    (vec2<f32>(pixel) + offset) / vec2<f32>(uniforms.dimensions.xy)
  );
}

fn getSamplingPixelIndex(pixel: vec2<u32>) -> u32 {
  if (uniforms.imageRegion.z > 0u) {
    let fullPixel = pixel + uniforms.imageRegion.xy;
    return fullPixel.y * uniforms.imageRegion.z + fullPixel.x;
  }
  return pixel.y * uniforms.dimensions.x + pixel.x;
}

fn makeRadianceSampleOffset(pixel: vec2<u32>, sampleIndex: u32) -> vec2<f32> {
  let pixelIndex = getSamplingPixelIndex(pixel);
  let pixelRotation = vec2<f32>(
    makeRandom((pixelIndex * 1973u + 17u) ^ uniforms.sampling.x),
    makeRandom((pixelIndex * 26699u + 101u) ^ uniforms.sampling.x)
  );
  let sequenceIndex = uniforms.acceleration.w * 16u + sampleIndex;
  let lowDiscrepancyOffset = vec2<f32>(
    f32(sequenceIndex) * 0.7548776662466927,
    f32(sequenceIndex) * 0.5698402909980532
  );
  return fract(pixelRotation + lowDiscrepancyOffset);
}

fn makeCameraRay(pixel: vec2<u32>, sampleIndex: u32) -> Ray {
  return makeCameraRayAtOffset(pixel, makeRadianceSampleOffset(pixel, sampleIndex));
}

fn makeGuideCameraRay(pixel: vec2<u32>) -> Ray {
  return makeCameraRayAtOffset(pixel, vec2<f32>(0.5));
}

fn intersectSphere(ray: Ray, radius: f32, maximumDistance: f32) -> f32 {
  let directionLength = dot(ray.direction, ray.direction);
  let halfProjection = dot(ray.origin, ray.direction);
  let discriminant = halfProjection * halfProjection -
    directionLength * (dot(ray.origin, ray.origin) - radius * radius);
  if (discriminant < 0.0) {
    return RAY_INFINITY;
  }
  let root = sqrt(discriminant);
  let firstDistance = (-halfProjection - root) / directionLength;
  let secondDistance = (-halfProjection + root) / directionLength;
  let distance = select(secondDistance, firstDistance, firstDistance > RAY_EPSILON);
  return select(RAY_INFINITY, distance, distance > RAY_EPSILON && distance < maximumDistance);
}

fn intersectTriangle(ray: Ray, triangle: RayTriangle, maximumDistance: f32) -> vec3<f32> {
  let firstEdge = triangle.secondPosition.xyz - triangle.firstPosition.xyz;
  let secondEdge = triangle.thirdPosition.xyz - triangle.firstPosition.xyz;
  let perpendicular = cross(ray.direction, secondEdge);
  let determinant = dot(firstEdge, perpendicular);
  if (abs(determinant) < 0.0000001) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  let inverseDeterminant = 1.0 / determinant;
  let originOffset = ray.origin - triangle.firstPosition.xyz;
  let firstWeight = dot(originOffset, perpendicular) * inverseDeterminant;
  if (firstWeight < 0.0 || firstWeight > 1.0) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  let projectedOrigin = cross(originOffset, firstEdge);
  let secondWeight = dot(ray.direction, projectedOrigin) * inverseDeterminant;
  if (secondWeight < 0.0 || firstWeight + secondWeight > 1.0) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  let distance = dot(secondEdge, projectedOrigin) * inverseDeterminant;
  if (distance <= RAY_EPSILON || distance >= maximumDistance) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  return vec3<f32>(distance, firstWeight, secondWeight);
}

fn makeInverseRayDirection(direction: vec3<f32>) -> vec3<f32> {
  let parallelAxes = abs(direction) < vec3<f32>(0.0000001);
  let safeDirection = select(direction, vec3<f32>(1.0), parallelAxes);
  return vec3<f32>(1.0) / safeDirection;
}

fn intersectNodeBounds(
  ray: Ray,
  inverseDirection: vec3<f32>,
  nodeIndex: u32,
  maximumDistance: f32
) -> f32 {
  var nearestDistance = 0.0;
  var farthestDistance = maximumDistance;
  let componentIndex = nodeIndex * 3u;

  for (var axis = 0u; axis < 3u; axis++) {
    let minimum = nodeMinima[componentIndex + axis];
    let maximum = nodeMaxima[componentIndex + axis];
    if (minimum > maximum) {
      return RAY_INFINITY;
    }

    let origin = ray.origin[axis];
    let direction = ray.direction[axis];
    if (abs(direction) < 0.0000001) {
      if (origin < minimum || origin > maximum) {
        return RAY_INFINITY;
      }
    } else {
      let firstDistance = (minimum - origin) * inverseDirection[axis];
      let secondDistance = (maximum - origin) * inverseDirection[axis];
      nearestDistance = max(nearestDistance, min(firstDistance, secondDistance));
      farthestDistance = min(farthestDistance, max(firstDistance, secondDistance));
      if (nearestDistance > farthestDistance) {
        return RAY_INFINITY;
      }
    }
  }

  if (farthestDistance <= RAY_EPSILON || nearestDistance >= maximumDistance) {
    return RAY_INFINITY;
  }
  return nearestDistance;
}

fn intersectBlasNodeBounds(
  ray: Ray,
  inverseDirection: vec3<f32>,
  nodeIndex: u32,
  maximumDistance: f32
) -> f32 {
  var nearestDistance = 0.0;
  var farthestDistance = maximumDistance;
  let node = blasNodes[nodeIndex];

  for (var axis = 0u; axis < 3u; axis++) {
    let minimum = node.minimum[axis];
    let maximum = node.maximum[axis];
    if (minimum > maximum) {
      return RAY_INFINITY;
    }

    let origin = ray.origin[axis];
    let direction = ray.direction[axis];
    if (abs(direction) < 0.0000001) {
      if (origin < minimum || origin > maximum) {
        return RAY_INFINITY;
      }
    } else {
      let firstDistance = (minimum - origin) * inverseDirection[axis];
      let secondDistance = (maximum - origin) * inverseDirection[axis];
      nearestDistance = max(nearestDistance, min(firstDistance, secondDistance));
      farthestDistance = min(farthestDistance, max(firstDistance, secondDistance));
      if (nearestDistance > farthestDistance) {
        return RAY_INFINITY;
      }
    }
  }

  if (farthestDistance <= RAY_EPSILON || nearestDistance >= maximumDistance) {
    return RAY_INFINITY;
  }
  return nearestDistance;
}

fn intersectPrimitive(ray: Ray, primitiveIndex: u32, maximumDistance: f32) -> RayHit {
  var closestHit = RayHit(maximumDistance, vec3<f32>(0.0), 0u);
  let primitive = primitives[primitiveIndex];
  if (primitive.material.x >= 0.0 && primitive.baseColor.a < primitive.material.x) { return closestHit; }
  let localOrigin = (primitive.inverseTransform * vec4<f32>(ray.origin, 1.0)).xyz;
  let localDirection = (primitive.inverseTransform * vec4<f32>(ray.direction, 0.0)).xyz;
  let localRay = Ray(localOrigin, localDirection);
  let sphereRadius = primitive.properties.y;
  if (sphereRadius > 0.0) {
    let distance = intersectSphere(localRay, sphereRadius, closestHit.distance);
    if (distance < closestHit.distance) {
      let localNormal = normalize(localOrigin + localDirection * distance);
      let worldNormal = normalize((transpose(primitive.inverseTransform) *
        vec4<f32>(localNormal, 0.0)).xyz);
      closestHit = RayHit(distance, worldNormal, primitiveIndex);
    }
    return closestHit;
  }

  let triangleStart = u32(primitive.properties.z);
  let triangleCount = u32(primitive.properties.w);
  let packedNodeStart = u32(primitive.blas.x);
  let triangleIdStart = u32(primitive.blas.y);
  let internalNodeCount = u32(primitive.blas.z);
  let leafCapacity = u32(primitive.blas.w);
  if (triangleCount == 0u || leafCapacity == 0u) {
    return closestHit;
  }

  let inverseLocalDirection = makeInverseRayDirection(localDirection);
  let rootBlasDistance = intersectBlasNodeBounds(
    localRay,
    inverseLocalDirection,
    packedNodeStart,
    closestHit.distance
  );
  if (rootBlasDistance >= closestHit.distance) {
    return closestHit;
  }

  var pendingBlasNodes: array<PendingRayNode, BLAS_STACK_CAPACITY>;
  var pendingBlasCount = 1u;
  pendingBlasNodes[0] = PendingRayNode(0u, rootBlasDistance);
  while (pendingBlasCount > 0u) {
    pendingBlasCount--;
    let pendingBlasNode = pendingBlasNodes[pendingBlasCount];
    if (pendingBlasNode.entryDistance >= closestHit.distance) {
      continue;
    }
    let localNodeIndex = pendingBlasNode.nodeIndex;

    if (localNodeIndex >= internalNodeCount) {
      let leafIndex = localNodeIndex - internalNodeCount;
      if (leafIndex < leafCapacity) {
        let localTriangleIndex = blasTriangleIds[triangleIdStart + leafIndex];
        if (localTriangleIndex < triangleCount) {
          let triangleIndex = triangleStart + localTriangleIndex;
          let triangle = triangles[triangleIndex];
          let intersection = intersectTriangle(localRay, triangle, closestHit.distance);
          if (intersection.x < closestHit.distance) {
            let normalWeight = 1.0 - intersection.y - intersection.z;
            var localNormal = normalize(triangle.firstNormal.xyz * normalWeight +
              triangle.secondNormal.xyz * intersection.y +
              triangle.thirdNormal.xyz * intersection.z);
            if (dot(localNormal, localDirection) > 0.0) {
              localNormal = -localNormal;
            }
            let worldNormal = normalize((transpose(primitive.inverseTransform) *
              vec4<f32>(localNormal, 0.0)).xyz);
            closestHit = RayHit(intersection.x, worldNormal, primitiveIndex);
          }
        }
      }
      continue;
    }

    let leftNode = localNodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + leftNode,
      closestHit.distance
    );
    let rightBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + rightNode,
      closestHit.distance
    );
    let leftFirst = leftBlasDistance <= rightBlasDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerBlasDistance = min(leftBlasDistance, rightBlasDistance);
    let fartherBlasDistance = max(leftBlasDistance, rightBlasDistance);

    if (fartherBlasDistance < closestHit.distance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(fartherNode, fartherBlasDistance);
      pendingBlasCount++;
    }
    if (nearerBlasDistance < closestHit.distance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(nearerNode, nearerBlasDistance);
      pendingBlasCount++;
    }
  }
  return closestHit;
}

fn intersectsPrimitive(ray: Ray, primitiveIndex: u32, maximumDistance: f32) -> bool {
  let primitive = primitives[primitiveIndex];
  if (primitive.material.x >= 0.0 && primitive.baseColor.a < primitive.material.x) { return false; }
  let localOrigin = (primitive.inverseTransform * vec4<f32>(ray.origin, 1.0)).xyz;
  let localDirection = (primitive.inverseTransform * vec4<f32>(ray.direction, 0.0)).xyz;
  let localRay = Ray(localOrigin, localDirection);
  let sphereRadius = primitive.properties.y;
  if (sphereRadius > 0.0) {
    return intersectSphere(localRay, sphereRadius, maximumDistance) < maximumDistance;
  }

  let triangleStart = u32(primitive.properties.z);
  let triangleCount = u32(primitive.properties.w);
  let packedNodeStart = u32(primitive.blas.x);
  let triangleIdStart = u32(primitive.blas.y);
  let internalNodeCount = u32(primitive.blas.z);
  let leafCapacity = u32(primitive.blas.w);
  if (triangleCount == 0u || leafCapacity == 0u) {
    return false;
  }

  let inverseLocalDirection = makeInverseRayDirection(localDirection);
  let rootBlasDistance = intersectBlasNodeBounds(
    localRay,
    inverseLocalDirection,
    packedNodeStart,
    maximumDistance
  );
  if (rootBlasDistance >= maximumDistance) {
    return false;
  }

  var pendingBlasNodes: array<PendingRayNode, BLAS_STACK_CAPACITY>;
  var pendingBlasCount = 1u;
  pendingBlasNodes[0] = PendingRayNode(0u, rootBlasDistance);
  while (pendingBlasCount > 0u) {
    pendingBlasCount--;
    let pendingBlasNode = pendingBlasNodes[pendingBlasCount];
    if (pendingBlasNode.entryDistance >= maximumDistance) {
      continue;
    }
    let localNodeIndex = pendingBlasNode.nodeIndex;

    if (localNodeIndex >= internalNodeCount) {
      let leafIndex = localNodeIndex - internalNodeCount;
      if (leafIndex < leafCapacity) {
        let localTriangleIndex = blasTriangleIds[triangleIdStart + leafIndex];
        if (localTriangleIndex < triangleCount) {
          let triangleIndex = triangleStart + localTriangleIndex;
          if (intersectTriangle(localRay, triangles[triangleIndex], maximumDistance).x <
              maximumDistance) {
            return true;
          }
        }
      }
      continue;
    }

    let leftNode = localNodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + leftNode,
      maximumDistance
    );
    let rightBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + rightNode,
      maximumDistance
    );
    let leftFirst = leftBlasDistance <= rightBlasDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerBlasDistance = min(leftBlasDistance, rightBlasDistance);
    let fartherBlasDistance = max(leftBlasDistance, rightBlasDistance);

    if (fartherBlasDistance < maximumDistance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(fartherNode, fartherBlasDistance);
      pendingBlasCount++;
    }
    if (nearerBlasDistance < maximumDistance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(nearerNode, nearerBlasDistance);
      pendingBlasCount++;
    }
  }
  return false;
}

fn intersectScene(ray: Ray, maximumDistance: f32) -> RayHit {
  var closestHit = RayHit(maximumDistance, vec3<f32>(0.0), 0u);
  if (uniforms.dimensions.z == 0u) {
    return closestHit;
  }

  let inverseDirection = makeInverseRayDirection(ray.direction);
  let rootDistance = intersectNodeBounds(ray, inverseDirection, 0u, closestHit.distance);
  if (rootDistance >= closestHit.distance) {
    return closestHit;
  }

  var pendingNodes: array<PendingRayNode, BVH_STACK_CAPACITY>;
  var pendingCount = 1u;
  pendingNodes[0] = PendingRayNode(0u, rootDistance);

  while (pendingCount > 0u) {
    pendingCount--;
    let pendingNode = pendingNodes[pendingCount];
    if (pendingNode.entryDistance >= closestHit.distance) {
      continue;
    }
    let nodeIndex = pendingNode.nodeIndex;

    if (nodeIndex >= uniforms.acceleration.x) {
      let leafIndex = nodeIndex - uniforms.acceleration.x;
      let primitiveIndex = leafPrimitiveIds[leafIndex];
      if (primitiveIndex < uniforms.dimensions.z) {
        let primitiveHit = intersectPrimitive(ray, primitiveIndex, closestHit.distance);
        if (primitiveHit.distance < closestHit.distance) {
          closestHit = primitiveHit;
        }
      }
      continue;
    }

    let leftNode = nodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftDistance = intersectNodeBounds(ray, inverseDirection, leftNode, closestHit.distance);
    let rightDistance = intersectNodeBounds(ray, inverseDirection, rightNode, closestHit.distance);
    let leftFirst = leftDistance <= rightDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerDistance = min(leftDistance, rightDistance);
    let fartherDistance = max(leftDistance, rightDistance);

    if (fartherDistance < closestHit.distance) {
      pendingNodes[pendingCount] = PendingRayNode(fartherNode, fartherDistance);
      pendingCount++;
    }
    if (nearerDistance < closestHit.distance) {
      pendingNodes[pendingCount] = PendingRayNode(nearerNode, nearerDistance);
      pendingCount++;
    }
  }
  return closestHit;
}

fn intersectsScene(ray: Ray, maximumDistance: f32) -> bool {
  if (uniforms.dimensions.z == 0u || maximumDistance <= RAY_EPSILON) {
    return false;
  }

  let inverseDirection = makeInverseRayDirection(ray.direction);
  let rootDistance = intersectNodeBounds(ray, inverseDirection, 0u, maximumDistance);
  if (rootDistance >= maximumDistance) {
    return false;
  }

  var pendingNodes: array<PendingRayNode, BVH_STACK_CAPACITY>;
  var pendingCount = 1u;
  pendingNodes[0] = PendingRayNode(0u, rootDistance);

  while (pendingCount > 0u) {
    pendingCount--;
    let pendingNode = pendingNodes[pendingCount];
    if (pendingNode.entryDistance >= maximumDistance) {
      continue;
    }
    let nodeIndex = pendingNode.nodeIndex;

    if (nodeIndex >= uniforms.acceleration.x) {
      let leafIndex = nodeIndex - uniforms.acceleration.x;
      let primitiveIndex = leafPrimitiveIds[leafIndex];
      if (primitiveIndex < uniforms.dimensions.z &&
          intersectsPrimitive(ray, primitiveIndex, maximumDistance)) {
        return true;
      }
      continue;
    }

    let leftNode = nodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftDistance = intersectNodeBounds(ray, inverseDirection, leftNode, maximumDistance);
    let rightDistance = intersectNodeBounds(ray, inverseDirection, rightNode, maximumDistance);
    let leftFirst = leftDistance <= rightDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerDistance = min(leftDistance, rightDistance);
    let fartherDistance = max(leftDistance, rightDistance);

    if (fartherDistance < maximumDistance) {
      pendingNodes[pendingCount] = PendingRayNode(fartherNode, fartherDistance);
      pendingCount++;
    }
    if (nearerDistance < maximumDistance) {
      pendingNodes[pendingCount] = PendingRayNode(nearerNode, nearerDistance);
      pendingCount++;
    }
  }
  return false;
}

fn evaluateDirectLighting(ray: Ray, hit: RayHit, includeEmission: bool) -> vec3<f32> {
  let primitive = primitives[hit.primitiveIndex];
  let hitPosition = ray.origin + ray.direction * hit.distance;
  let normal = hit.normal;
  let viewDirection = -ray.direction;
  let baseColor = primitive.baseColor.rgb;
  let metallic = clamp(primitive.emissive.w, 0.0, 1.0);
  let roughness = clamp(primitive.properties.x, 0.04, 1.0);
  let dielectricReflectance = vec3<f32>(0.04);
  let reflectance = mix(dielectricReflectance, baseColor, metallic);
  let maximumReflectance = max(reflectance.r, max(reflectance.g, reflectance.b));
  let grazingReflectance = vec3<f32>(clamp(maximumReflectance * 25.0, 0.0, 1.0));
  let alphaRoughness = roughness * roughness;
  let alphaRoughnessSquared = alphaRoughness * alphaRoughness;
  let diffuse = baseColor * (vec3<f32>(1.0) - dielectricReflectance) *
    (1.0 - metallic) / PI;
  let normalView = clamp(abs(dot(normal, viewDirection)), 0.001, 1.0);
  var result = select(vec3<f32>(0.0), primitive.emissive.rgb, includeEmission);
  let directLightCount = u32(max(uniforms.temporal.y, 0.0));
  let boundedDirectLightCount = max(directLightCount, 1u);
  let requestedShadowSamples = u32(max(uniforms.temporal.z, 0.0));
  let shadowSampleCount = select(
    min(requestedShadowSamples, directLightCount),
    directLightCount,
    requestedShadowSamples == 0u || uniforms.settings.w <= 0.5
  );
  let rotatingLightOffset = uniforms.acceleration.w % boundedDirectLightCount;
  let lightSampleWeight = f32(directLightCount) / f32(max(shadowSampleCount, 1u));
  var directLightIndex = 0u;

  for (var lightIndex = 0u; lightIndex < uniforms.dimensions.w; lightIndex++) {
    let light = lights[lightIndex];
    let lightType = u32(light.directionType.w);
    let lightColor = light.colorIntensity.rgb * light.colorIntensity.w;
    if (lightType == 0u) {
      result += baseColor * lightColor;
      continue;
    }

    let rotatingLightIndex = (directLightIndex + directLightCount - rotatingLightOffset) %
      boundedDirectLightCount;
    directLightIndex++;
    if (rotatingLightIndex >= shadowSampleCount) {
      continue;
    }

    var lightDirection = vec3<f32>(0.0);
    var lightDistance = RAY_INFINITY;
    var attenuation = 1.0;
    if (lightType >= 2u) {
      let offset = light.positionInnerCone.xyz - hitPosition;
      lightDistance = length(offset);
      lightDirection = offset / max(lightDistance, RAY_EPSILON);
      let factors = light.attenuationOuterCone.xyz;
      attenuation = 1.0 / max(factors.x + factors.y * lightDistance +
        factors.z * lightDistance * lightDistance, 0.0001);
      if (lightType == 3u) {
        let angle = dot(-lightDirection, normalize(light.directionType.xyz));
        let innerCone = light.positionInnerCone.w;
        let outerCone = light.attenuationOuterCone.w;
        attenuation *= smoothstep(outerCone, innerCone, angle);
      }
    } else {
      lightDirection = normalize(-light.directionType.xyz);
    }

    let normalLight = max(dot(normal, lightDirection), 0.0);
    if (normalLight <= 0.0 || attenuation <= 0.0) {
      continue;
    }
    if (uniforms.settings.w > 0.5) {
      let shadowRay = Ray(hitPosition + normal * 0.002, lightDirection);
      let shadowDistance = select(lightDistance - 0.003, RAY_INFINITY, lightType == 1u);
      if (intersectsScene(shadowRay, shadowDistance)) {
        continue;
      }
    }

    let halfDirection = normalize(lightDirection + viewDirection);
    let normalHalf = max(dot(normal, halfDirection), 0.0);
    let viewHalf = max(dot(viewDirection, halfDirection), 0.0);
    let fresnel = reflectance + (grazingReflectance - reflectance) *
      pow(clamp(1.0 - viewHalf, 0.0, 1.0), 5.0);
    let distributionDenominator =
      (normalHalf * alphaRoughnessSquared - normalHalf) * normalHalf + 1.0;
    let distribution = alphaRoughnessSquared /
      (PI * distributionDenominator * distributionDenominator);
    let lightVisibility = 2.0 * normalLight /
      (normalLight + sqrt(alphaRoughnessSquared +
        (1.0 - alphaRoughnessSquared) * normalLight * normalLight));
    let viewVisibility = 2.0 * normalView /
      (normalView + sqrt(alphaRoughnessSquared +
        (1.0 - alphaRoughnessSquared) * normalView * normalView));
    let geometricOcclusion = lightVisibility * viewVisibility;
    let diffuseContribution = (vec3<f32>(1.0) - fresnel) * diffuse;
    let specular = fresnel * geometricOcclusion * distribution /
      (4.0 * normalLight * normalView);
    result += (diffuseContribution + specular) * lightColor * normalLight *
      attenuation * lightSampleWeight;
  }

  if (uniforms.fog.w > 0.0) {
    let visibility = exp(-uniforms.fog.w * hit.distance);
    result = mix(uniforms.fog.rgb, result, visibility);
  }
  return result;
}

fn rejectHistoricalRaySample() -> HistoricalRaySample {
  return HistoricalRaySample(vec3<f32>(0.0), 0.0, false);
}

fn signNotZero(value: f32) -> f32 {
  return select(-1.0, 1.0, value >= 0.0);
}

fn encodeRayNormal(normal: vec3<f32>) -> vec2<f32> {
  let normalizedNormal = normal / max(
    abs(normal.x) + abs(normal.y) + abs(normal.z),
    RAY_EPSILON
  );
  var encodedNormal = normalizedNormal.xy;
  if (normalizedNormal.z < 0.0) {
    encodedNormal = (vec2<f32>(1.0) - abs(encodedNormal.yx)) * vec2<f32>(
      signNotZero(encodedNormal.x),
      signNotZero(encodedNormal.y)
    );
  }
  return encodedNormal * 0.5 + vec2<f32>(0.5);
}

fn decodeRayNormal(encodedNormal: vec2<f32>) -> vec3<f32> {
  let signedNormal = encodedNormal * 2.0 - vec2<f32>(1.0);
  var normal = vec3<f32>(
    signedNormal,
    1.0 - abs(signedNormal.x) - abs(signedNormal.y)
  );
  let fold = max(-normal.z, 0.0);
  normal.x += select(-fold, fold, normal.x < 0.0);
  normal.y += select(-fold, fold, normal.y < 0.0);
  return normalize(normal);
}

fn encodeRayPrimitiveIdentifier(primitiveIndex: u32) -> f32 {
  return select(
    OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER,
    f32(primitiveIndex + 1u),
    primitiveIndex <= MAXIMUM_EXACT_HISTORY_PRIMITIVE_INDEX
  );
}

fn isHistoricalRayMetadataValid(
  historicalMetadata: vec4<f32>,
  hit: RayHit,
  previousDistance: f32
) -> bool {
  if (hit.distance >= RAY_INFINITY) {
    return historicalMetadata.a <= RAY_EPSILON;
  }

  let expectedPrimitiveIdentifier = encodeRayPrimitiveIdentifier(hit.primitiveIndex);
  let primitiveIdentifierOverflow =
    expectedPrimitiveIdentifier == OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER ||
    historicalMetadata.a == OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER;
  let primitiveIdentifierMatches =
    abs(historicalMetadata.a - expectedPrimitiveIdentifier) <= 0.5;
  if (historicalMetadata.a <= RAY_EPSILON ||
      primitiveIdentifierOverflow ||
      !primitiveIdentifierMatches ||
      dot(decodeRayNormal(historicalMetadata.xy), hit.normal) <
        MINIMUM_HISTORY_NORMAL_ALIGNMENT) {
    return false;
  }
  let relativeDepthDifference = abs(historicalMetadata.z - previousDistance) /
    max(previousDistance, RAY_EPSILON);
  return relativeDepthDifference <= MAXIMUM_HISTORY_RELATIVE_DEPTH_DIFFERENCE;
}

fn clampHistoricalRayColor(
  historyPixel: vec2<i32>,
  historicalColor: vec3<f32>,
  currentColor: vec3<f32>
) -> vec3<f32> {
  let maximumPixel = vec2<i32>(uniforms.dimensions.xy) - vec2<i32>(1);
  var minimumColor = currentColor;
  var maximumColor = currentColor;
  for (var verticalOffset = -1; verticalOffset <= 1; verticalOffset++) {
    for (var horizontalOffset = -1; horizontalOffset <= 1; horizontalOffset++) {
      let neighborhoodPixel = clamp(
        historyPixel + vec2<i32>(horizontalOffset, verticalOffset),
        vec2<i32>(0),
        maximumPixel
      );
      let neighborhoodColor = textureLoad(historyImage, neighborhoodPixel, 0);
      if (neighborhoodColor.a > 0.0) {
        minimumColor = min(minimumColor, neighborhoodColor.rgb);
        maximumColor = max(maximumColor, neighborhoodColor.rgb);
      }
    }
  }
  let neighborhoodRadius = max((maximumColor - minimumColor) * 0.5, vec3<f32>(0.04));
  return clamp(historicalColor, currentColor - neighborhoodRadius, currentColor + neighborhoodRadius);
}

fn loadHistoricalRaySample(
  historyPixel: vec2<i32>,
  hit: RayHit,
  previousDistance: f32
) -> HistoricalRaySample {
  let historicalMetadata = textureLoad(historyMetadata, historyPixel, 0);
  if (!isHistoricalRayMetadataValid(historicalMetadata, hit, previousDistance)) {
    return rejectHistoricalRaySample();
  }

  let historicalColor = textureLoad(historyImage, historyPixel, 0);
  if (historicalColor.a <= 0.0) {
    return rejectHistoricalRaySample();
  }
  return HistoricalRaySample(
    historicalColor.rgb,
    min(historicalColor.a, getHistorySampleLimit()),
    true
  );
}

fn getHistoricalRaySample(
  pixel: vec2<u32>,
  ray: Ray,
  hit: RayHit,
  currentColor: vec3<f32>
) -> HistoricalRaySample {
  if (uniforms.settings.y <= 0.0) {
    return rejectHistoricalRaySample();
  }

  var historySamplePosition = vec2<f32>(pixel);
  var previousDistance = distance(
    ray.origin + ray.direction * min(hit.distance, 65504.0),
    uniforms.cameraPosition.xyz
  );
  if (hit.distance < RAY_INFINITY && uniforms.temporal.w > 0.5) {
    let primitive = primitives[hit.primitiveIndex];
    let hitPosition = ray.origin + ray.direction * hit.distance;
    let localHitPosition = primitive.inverseTransform * vec4<f32>(hitPosition, 1.0);
    let previousHitPosition = (primitive.previousTransform * localHitPosition).xyz;
    let previousClipPosition = uniforms.previousViewProjection *
      vec4<f32>(previousHitPosition, 1.0);
    if (previousClipPosition.w <= RAY_EPSILON) {
      return rejectHistoricalRaySample();
    }

    let previousNormalizedPosition = previousClipPosition.xy / previousClipPosition.w;
    let previousTextureCoordinates = vec2<f32>(
      previousNormalizedPosition.x * 0.5 + 0.5,
      0.5 - previousNormalizedPosition.y * 0.5
    );
    if (any(previousTextureCoordinates < vec2<f32>(0.0)) ||
        any(previousTextureCoordinates >= vec2<f32>(1.0))) {
      return rejectHistoricalRaySample();
    }

    historySamplePosition = previousTextureCoordinates *
      vec2<f32>(uniforms.dimensions.xy) - vec2<f32>(0.5);
    previousDistance = distance(previousHitPosition, uniforms.previousCameraPosition.xyz);
  }

  let maximumPixel = vec2<i32>(uniforms.dimensions.xy) - vec2<i32>(1);
  let clampedHistorySamplePosition = clamp(
    historySamplePosition,
    vec2<f32>(0.0),
    vec2<f32>(maximumPixel)
  );
  let firstHistoryPixel = vec2<i32>(floor(clampedHistorySamplePosition));
  let secondHistoryPixel = min(firstHistoryPixel + vec2<i32>(1), maximumPixel);
  let historyFraction = fract(clampedHistorySamplePosition);
  let topLeftWeight = (1.0 - historyFraction.x) * (1.0 - historyFraction.y);
  let topRightWeight = historyFraction.x * (1.0 - historyFraction.y);
  let bottomLeftWeight = (1.0 - historyFraction.x) * historyFraction.y;
  let bottomRightWeight = historyFraction.x * historyFraction.y;
  var historicalColor = vec3<f32>(0.0);
  var historicalSampleCount = 0.0;
  var totalWeight = 0.0;
  if (topLeftWeight > 0.0) {
    let topLeftSample = loadHistoricalRaySample(firstHistoryPixel, hit, previousDistance);
    if (topLeftSample.valid) {
      historicalColor += topLeftSample.color * topLeftWeight;
      historicalSampleCount += topLeftSample.sampleCount * topLeftWeight;
      totalWeight += topLeftWeight;
    }
  }
  if (topRightWeight > 0.0) {
    let topRightSample = loadHistoricalRaySample(
      vec2<i32>(secondHistoryPixel.x, firstHistoryPixel.y),
      hit,
      previousDistance
    );
    if (topRightSample.valid) {
      historicalColor += topRightSample.color * topRightWeight;
      historicalSampleCount += topRightSample.sampleCount * topRightWeight;
      totalWeight += topRightWeight;
    }
  }
  if (bottomLeftWeight > 0.0) {
    let bottomLeftSample = loadHistoricalRaySample(
      vec2<i32>(firstHistoryPixel.x, secondHistoryPixel.y),
      hit,
      previousDistance
    );
    if (bottomLeftSample.valid) {
      historicalColor += bottomLeftSample.color * bottomLeftWeight;
      historicalSampleCount += bottomLeftSample.sampleCount * bottomLeftWeight;
      totalWeight += bottomLeftWeight;
    }
  }
  if (bottomRightWeight > 0.0) {
    let bottomRightSample = loadHistoricalRaySample(secondHistoryPixel, hit, previousDistance);
    if (bottomRightSample.valid) {
      historicalColor += bottomRightSample.color * bottomRightWeight;
      historicalSampleCount += bottomRightSample.sampleCount * bottomRightWeight;
      totalWeight += bottomRightWeight;
    }
  }

  if (totalWeight <= 0.0) {
    return rejectHistoricalRaySample();
  }
  let nearestHistoryPixel = clamp(
    vec2<i32>(round(clampedHistorySamplePosition)),
    vec2<i32>(0),
    maximumPixel
  );
  return HistoricalRaySample(
    clampHistoricalRayColor(nearestHistoryPixel, historicalColor / totalWeight, currentColor),
    min(historicalSampleCount / totalWeight, getHistorySampleLimit()),
    true
  );
}


struct RayMaterialSample {
  direction: vec3<f32>,
  weight: vec3<f32>,
};

// Sample a cosine/GGX-NDF mixture, then evaluate both lobes with the combined PDF.
// Specular half-vector density D(N.H)*(N.H) becomes direction density / (4*V.H).
fn samplePBRMaterial(ray: Ray, hit: RayHit, randomSeed: u32) -> RayMaterialSample {
  let primitive = primitives[hit.primitiveIndex];
  let baseColor = clamp(primitive.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0));
  let metallic = clamp(primitive.emissive.w, 0.0, 1.0);
  let roughness = clamp(primitive.properties.x, 0.04, 1.0);
  let alphaRoughness = roughness * roughness;
  let alphaSquared = alphaRoughness * alphaRoughness;
  let normal = select(hit.normal, -hit.normal, dot(hit.normal, ray.direction) > 0.0);
  let viewDirection = -ray.direction;
  let normalView = clamp(dot(normal, viewDirection), 0.001, 1.0);
  let reference = select(vec3<f32>(0.0, 0.0, 1.0), vec3<f32>(0.0, 1.0, 0.0), abs(normal.z) > 0.999);
  let tangent = normalize(cross(reference, normal));
  let bitangent = cross(normal, tangent);
  let radialSample = makeRandom(randomSeed ^ 17u);
  let angle = 2.0 * PI * makeRandom(randomSeed ^ 101u);
  let specularProbability = mix(0.25, 1.0, metallic);
  var direction: vec3<f32>;
  if (specularProbability >= 1.0 || makeRandom(randomSeed ^ 263u) < specularProbability) {
    let normalHalf = sqrt((1.0 - radialSample) /
      ((1.0 - radialSample) + alphaSquared * radialSample));
    let tangentHalf = sqrt(max(1.0 - normalHalf * normalHalf, 0.0));
    let halfDirection = tangent * (tangentHalf * cos(angle)) +
      bitangent * (tangentHalf * sin(angle)) + normal * normalHalf;
    direction = normalize(reflect(ray.direction, halfDirection));
  } else {
    let radius = sqrt(radialSample);
    direction = normalize(tangent * (radius * cos(angle)) + bitangent * (radius * sin(angle)) +
      normal * sqrt(max(1.0 - radialSample, 0.0)));
  }
  let normalLight = dot(normal, direction);
  if (normalLight <= 0.0) {
    return RayMaterialSample(direction, vec3<f32>(0.0));
  }
  let halfDirection = normalize(viewDirection + direction);
  let normalHalf = max(dot(normal, halfDirection), 0.0);
  let viewHalf = max(dot(viewDirection, halfDirection), 0.000001);
  let normalHalfSquared = normalHalf * normalHalf;
  let distributionDenominator = (1.0 - normalHalfSquared) + alphaSquared * normalHalfSquared;
  let distribution = alphaSquared / (PI * distributionDenominator * distributionDenominator);
  let specularDensity = distribution * normalHalf / (4.0 * viewHalf);
  let sampleDensity = specularProbability * specularDensity +
    (1.0 - specularProbability) * normalLight / PI;
  if (sampleDensity <= 0.0) {
    return RayMaterialSample(direction, vec3<f32>(0.0));
  }
  return RayMaterialSample(direction, evaluatePBRResponse(ray, hit, direction) / sampleDensity);
}

fn evaluatePBRResponse(ray: Ray, hit: RayHit, direction: vec3<f32>) -> vec3<f32> {
  let primitive = primitives[hit.primitiveIndex];
  let baseColor = clamp(primitive.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0));
  let metallic = clamp(primitive.emissive.w, 0.0, 1.0);
  let roughness = clamp(primitive.properties.x, 0.04, 1.0);
  let alphaRoughness = roughness * roughness;
  let alphaSquared = alphaRoughness * alphaRoughness;
  let normal = select(hit.normal, -hit.normal, dot(hit.normal, ray.direction) > 0.0);
  let viewDirection = -ray.direction;
  let normalView = clamp(dot(normal, viewDirection), 0.001, 1.0);
  let normalLight = dot(normal, direction);
  if (normalLight <= 0.0) { return vec3<f32>(0.0); }
  let halfDirection = normalize(viewDirection + direction);
  let normalHalf = max(dot(normal, halfDirection), 0.0);
  let viewHalf = max(dot(viewDirection, halfDirection), 0.000001);
  let normalHalfSquared = normalHalf * normalHalf;
  let distributionDenominator = (1.0 - normalHalfSquared) + alphaSquared * normalHalfSquared;
  let distribution = alphaSquared / (PI * distributionDenominator * distributionDenominator);
  let reflectance = mix(vec3<f32>(0.04), baseColor, metallic);
  let grazingReflectance = vec3<f32>(clamp(max(reflectance.r, max(reflectance.g, reflectance.b)) * 25.0, 0.0, 1.0));
  let fresnel = reflectance + (grazingReflectance - reflectance) * pow(clamp(1.0 - viewHalf, 0.0, 1.0), 5.0);
  let lightVisibility = 2.0 * normalLight / (normalLight + sqrt(alphaSquared +
    (1.0 - alphaSquared) * normalLight * normalLight));
  let viewVisibility = 2.0 * normalView / (normalView + sqrt(alphaSquared +
    (1.0 - alphaSquared) * normalView * normalView));
  // Match the scalar direct-light BRDF; cancel N.L before dividing by the PDF.
  let diffuse = (vec3<f32>(1.0) - fresnel) * baseColor * 0.96 * (1.0 - metallic) * normalLight / PI;
  let specular = fresnel * lightVisibility * viewVisibility * distribution / (4.0 * normalView);
  return diffuse + specular;
}

// CDF emitter selection, uniform triangle selection and conditional area sampling. Visibility rejects far sides of spheres.
// The sphere Jacobian supports nonuniform scales and general affine instance transforms.
fn evaluateEmitterLighting(ray: Ray, hit: RayHit, randomSeed: u32) -> vec3<f32> {
  let emitterCount = uniforms.emitters.x;
  if (uniforms.emitters.y == 0u || emitterCount == 0u) { return vec3<f32>(0.0); }
  let emitterSample = makeRandom(randomSeed ^ 701u);
  var emitterIndex = min(u32(emitterSample * f32(emitterCount)), emitterCount - 1u);
  var inverseSelectionProbability = f32(emitterCount);
  if (uniforms.emitters.z == 1u) {
    var lower = 0u;
    var upper = emitterCount;
    while (lower < upper) {
      let middle = lower + (upper - lower) / 2u;
      if (emitterSample < lights[uniforms.dimensions.w + middle].colorIntensity.z) {
        upper = middle;
      } else {
        lower = middle + 1u;
      }
    }
    emitterIndex = min(lower, emitterCount - 1u);
    inverseSelectionProbability = 1.0 / lights[uniforms.dimensions.w + emitterIndex].colorIntensity.y;
  }
  let primitiveIndex = u32(lights[uniforms.dimensions.w + emitterIndex].colorIntensity.x);
  let emitter = primitives[primitiveIndex];
  var lightPosition: vec3<f32>;
  var lightNormal: vec3<f32>;
  var inverseAreaDensity: f32;
  let firstSample = makeRandom(randomSeed ^ 911u);
  let secondSample = makeRandom(randomSeed ^ 1301u);
  if (emitter.properties.y > 0.0) {
    let height = 1.0 - 2.0 * firstSample;
    let radius = sqrt(max(1.0 - height * height, 0.0));
    let angle = 2.0 * PI * secondSample;
    let localNormal = vec3<f32>(radius * cos(angle), height, radius * sin(angle));
    lightPosition = (emitter.transform * vec4<f32>(localNormal * emitter.properties.y, 1.0)).xyz;
    let transformedNormal = (transpose(emitter.inverseTransform) * vec4<f32>(localNormal, 0.0)).xyz;
    lightNormal = normalize(transformedNormal);
    let linearTransform = mat3x3<f32>(emitter.transform[0].xyz, emitter.transform[1].xyz, emitter.transform[2].xyz);
    inverseAreaDensity = 4.0 * PI * emitter.properties.y * emitter.properties.y *
      abs(determinant(linearTransform)) * length(transformedNormal) * inverseSelectionProbability;
  } else {
    let triangleCount = u32(emitter.properties.w);
    if (triangleCount == 0u) { return vec3<f32>(0.0); }
    let triangleIndex = min(u32(makeRandom(randomSeed ^ 1571u) * f32(triangleCount)), triangleCount - 1u);
    let triangle = triangles[u32(emitter.properties.z) + triangleIndex];
    let firstPosition = (emitter.transform * vec4<f32>(triangle.firstPosition.xyz, 1.0)).xyz;
    let secondPosition = (emitter.transform * vec4<f32>(triangle.secondPosition.xyz, 1.0)).xyz;
    let thirdPosition = (emitter.transform * vec4<f32>(triangle.thirdPosition.xyz, 1.0)).xyz;
    let rootSample = sqrt(firstSample);
    lightPosition = firstPosition * (1.0 - rootSample) + secondPosition * (rootSample * (1.0 - secondSample)) + thirdPosition * (rootSample * secondSample);
    let areaNormal = cross(secondPosition - firstPosition, thirdPosition - firstPosition);
    let twiceArea = length(areaNormal);
    if (twiceArea <= 0.00000001) { return vec3<f32>(0.0); }
    lightNormal = areaNormal / twiceArea;
    inverseAreaDensity = 0.5 * twiceArea * f32(triangleCount) * inverseSelectionProbability;
  }
  let position = ray.origin + ray.direction * hit.distance;
  let normal = select(hit.normal, -hit.normal, dot(hit.normal, ray.direction) > 0.0);
  let offset = lightPosition - position;
  let distanceSquared = dot(offset, offset);
  if (distanceSquared <= RAY_EPSILON * RAY_EPSILON) { return vec3<f32>(0.0); }
  let direction = offset / sqrt(distanceSquared);
  let normalLight = max(dot(normal, direction), 0.0);
  if (normalLight <= 0.0) { return vec3<f32>(0.0); }
  let shadowOrigin = position + normal * 0.002;
  let shadowOffset = lightPosition - shadowOrigin;
  let shadowDistance = length(shadowOffset);
  if (uniforms.settings.w > 0.5 && shadowDistance > RAY_EPSILON && intersectsScene(Ray(shadowOrigin, shadowOffset / shadowDistance), shadowDistance - 0.002)) { return vec3<f32>(0.0); }
  let receiver = primitives[hit.primitiveIndex];
  var response = clamp(receiver.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0)) * 0.96 *
    (1.0 - clamp(receiver.emissive.w, 0.0, 1.0)) * normalLight / PI;
  if (uniforms.sampling.w > 0u) { response = evaluatePBRResponse(ray, hit, direction); }
  let visibility = exp(-max(uniforms.fog.w, 0.0) * hit.distance);
  return response * emitter.emissive.rgb * abs(dot(lightNormal, -direction)) * inverseAreaDensity / distanceSquared * visibility;
}

// Explicit connections replace secondary emission gathering to avoid double counting.
// There are no delta BSDFs: roughness is clamped to 0.04. MIS remains a convergence follow-up.
fn evaluateSecondaryLighting(ray: Ray, hit: RayHit) -> vec3<f32> {
  return evaluateDirectLighting(ray, hit, uniforms.emitters.y == 0u);
}

fn evaluatePBRTransport(primaryRay: Ray, primaryHit: RayHit, pixel: vec2<u32>, sampleIndex: u32) -> vec3<f32> {
  var ray = primaryRay;
  var hit = primaryHit;
  var radiance = evaluateDirectLighting(ray, hit, true);
  var throughput = vec3<f32>(1.0);
  let pixelIndex = getSamplingPixelIndex(pixel);
  let sequenceIndex = uniforms.acceleration.w * 16u + sampleIndex;
  let pathSeed = uniforms.sampling.x ^ (pixelIndex * 1973u) ^ (sequenceIndex * 26699u);
  radiance += evaluateEmitterLighting(ray, hit, pathSeed);
  for (var bounceIndex = 0u; bounceIndex < min(uniforms.sampling.y, 8u); bounceIndex++) {
    let sample = samplePBRMaterial(ray, hit, pathSeed ^ (bounceIndex * 104729u));
    throughput *= sample.weight;
    if (max(throughput.r, max(throughput.g, throughput.b)) <= 0.0) { break; }
    let normal = select(hit.normal, -hit.normal, dot(hit.normal, ray.direction) > 0.0);
    let position = ray.origin + ray.direction * hit.distance;
    ray = Ray(position + normal * 0.002, sample.direction);
    hit = intersectScene(ray, RAY_INFINITY);
    if (hit.distance >= RAY_INFINITY) { break; }
    radiance += throughput * (evaluateSecondaryLighting(ray, hit) + evaluateEmitterLighting(ray, hit, pathSeed ^ ((bounceIndex + 1u) * 1987u)));
  }
  return radiance;
}

// Cosine-weighted Lambertian transport. The BRDF cosine and sampling PDF cancel.
fn evaluateDiffuseTransport(primaryRay: Ray, primaryHit: RayHit, pixel: vec2<u32>, sampleIndex: u32) -> vec3<f32> {
  var ray = primaryRay;
  var hit = primaryHit;
  var radiance = evaluateDirectLighting(ray, hit, true);
  var throughput = vec3<f32>(1.0);
  let pixelIndex = getSamplingPixelIndex(pixel);
  let sequenceIndex = uniforms.acceleration.w * 16u + sampleIndex;
  let pathSeed = uniforms.sampling.x ^ (pixelIndex * 1973u) ^ (sequenceIndex * 26699u);
  radiance += evaluateEmitterLighting(ray, hit, pathSeed);
  for (var bounceIndex = 0u; bounceIndex < min(uniforms.sampling.y, 8u); bounceIndex++) {
    let primitive = primitives[hit.primitiveIndex];
    throughput *= clamp(primitive.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0)) *
      0.96 * (1.0 - clamp(primitive.emissive.w, 0.0, 1.0));
    if (max(throughput.r, max(throughput.g, throughput.b)) <= 0.0) {
      break;
    }
    let normal = select(hit.normal, -hit.normal, dot(hit.normal, ray.direction) > 0.0);
    let reference = select(vec3<f32>(0.0, 0.0, 1.0), vec3<f32>(0.0, 1.0, 0.0), abs(normal.z) > 0.999);
    let tangent = normalize(cross(reference, normal));
    let bitangent = cross(normal, tangent);
    let radialSample = makeRandom(pathSeed ^ (bounceIndex * 104729u + 17u));
    let angle = 2.0 * PI * makeRandom(pathSeed ^ (bounceIndex * 130363u + 101u));
    let radius = sqrt(radialSample);
    let direction = tangent * (radius * cos(angle)) + bitangent * (radius * sin(angle)) +
      normal * sqrt(max(1.0 - radialSample, 0.0));
    let position = ray.origin + ray.direction * hit.distance;
    ray = Ray(position + normal * 0.002, normalize(direction));
    hit = intersectScene(ray, RAY_INFINITY);
    if (hit.distance >= RAY_INFINITY) {
      break;
    }
    radiance += throughput * (evaluateSecondaryLighting(ray, hit) + evaluateEmitterLighting(ray, hit, pathSeed ^ ((bounceIndex + 1u) * 1987u)));
  }
  return radiance;
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let phaseCount = max(uniforms.displayPhase.w, 1u);
  let phaseOffset = (uniforms.displayPhase.z + invocation.y) % phaseCount;
  let pixel = vec2<u32>(invocation.x * phaseCount + phaseOffset, invocation.y);
  if (pixel.x >= uniforms.dimensions.x || pixel.y >= uniforms.dimensions.y) {
    return;
  }

  let sampleCount = clamp(u32(uniforms.settings.z), 1u, 16u);
  let guideRay = makeGuideCameraRay(pixel);
  let guideHit = intersectScene(guideRay, RAY_INFINITY);
  var accumulatedColor = vec3<f32>(0.0);
  for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++) {
    let ray = makeCameraRay(pixel, sampleIndex);
    let hit = intersectScene(ray, RAY_INFINITY);
    var color = uniforms.background.rgb;
    if (hit.distance < RAY_INFINITY) {
      if (uniforms.sampling.w > 0u) {
        color = evaluatePBRTransport(ray, hit, pixel, sampleIndex);
      } else {
        color = evaluateDiffuseTransport(ray, hit, pixel, sampleIndex);
      }
    }
    accumulatedColor += color;
  }

  var color = accumulatedColor / f32(sampleCount) * uniforms.settings.x;
  let historicalSample = getHistoricalRaySample(pixel, guideRay, guideHit, color);
  var totalSampleCount = min(f32(sampleCount), getHistorySampleLimit());
  if (historicalSample.valid) {
    totalSampleCount = min(
      historicalSample.sampleCount + f32(sampleCount),
      getHistorySampleLimit()
    );
    let currentWeight = min(f32(sampleCount) / totalSampleCount, 1.0);
    color = mix(historicalSample.color, color, currentWeight);
  }
  let guideHitPosition = guideRay.origin +
    guideRay.direction * min(guideHit.distance, 65504.0);
  let metadata = select(
    vec4<f32>(0.0),
    vec4<f32>(
      encodeRayNormal(guideHit.normal),
      min(distance(guideHitPosition, uniforms.cameraPosition.xyz), 65504.0),
      encodeRayPrimitiveIdentifier(guideHit.primitiveIndex)
    ),
    guideHit.distance < RAY_INFINITY
  );
  textureStore(outputImage, vec2<i32>(pixel), vec4<f32>(color, totalSampleCount));
  textureStore(outputMetadata, vec2<i32>(pixel), metadata);
}
`,zh=`
${Rh}

struct RayPickResult {
  positionDistance: vec4<f32>,
  normal: vec3<f32>,
  primitiveIdentifier: u32,
};

@group(0) @binding(13) var<storage, read_write> pickResult: RayPickResult;
@group(0) @binding(14) var<uniform> pickCoordinates: vec4<f32>;

@compute @workgroup_size(1)
fn pick() {
  let ray = makeCameraRayAtCoordinates(pickCoordinates.xy);
  let hit = intersectScene(ray, RAY_INFINITY);
  pickResult.primitiveIdentifier = 0u;
  if (hit.distance < RAY_INFINITY) {
    pickResult.positionDistance = vec4<f32>(ray.origin + ray.direction * hit.distance, hit.distance);
    pickResult.normal = hit.normal;
    pickResult.primitiveIdentifier = hit.primitiveIndex + 1u;
  }
}
`,Bh=`
${Rh}

@group(0) @binding(13) var identifierImage: texture_storage_2d<r32uint, write>;
@group(0) @binding(14) var distanceImage: texture_storage_2d<r32float, write>;
@group(0) @binding(15) var normalImage: texture_storage_2d<rgba32float, write>;
@group(0) @binding(16) var projectedDepthImage: texture_storage_2d<r32float, write>;
@group(0) @binding(17) var<uniform> channelViewProjection: mat4x4<f32>;

@compute @workgroup_size(8, 8)
fn captureChannels(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let dimensions = textureDimensions(identifierImage);
  if (any(invocation.xy >= dimensions)) { return; }
  let pixel = vec2<i32>(invocation.xy);
  let coordinates = (vec2<f32>(invocation.xy) + vec2<f32>(0.5)) / vec2<f32>(dimensions);
  let ray = makeCameraRayAtCoordinates(coordinates);
  let hit = intersectScene(ray, RAY_INFINITY);
  var identifier = 0u;
  var distance = 0.0;
  var normal = vec4<f32>(0.0);
  var projectedDepth = 1.0;
  if (hit.distance < RAY_INFINITY) {
    identifier = hit.primitiveIndex + 1u;
    distance = hit.distance;
    normal = vec4<f32>(hit.normal, 1.0);
    let position = ray.origin + ray.direction * hit.distance;
    let clipPosition = channelViewProjection * vec4<f32>(position, 1.0);
    // Camera matrices use OpenGL clip depth; WebGPU attachments use zero to one.
    projectedDepth = clamp(clipPosition.z / clipPosition.w * 0.5 + 0.5, 0.0, 1.0);
  }
  textureStore(projectedDepthImage, pixel, vec4<f32>(projectedDepth));
  textureStore(identifierImage, pixel, vec4<u32>(identifier));
  textureStore(distanceImage, pixel, vec4<f32>(distance));
  textureStore(normalImage, pixel, normal);
}
`;function Vh(e){let t=typeof e==`boolean`?e?0:2:e.toneMapMode,n=typeof e==`boolean`?e?0:1:e.outputEncoding,r=typeof e==`boolean`?0:e.denoiseRadius??0,i=typeof e==`boolean`?`color`:e.debugView??`color`;return`
@group(0) @binding(0) var image: texture_2d<f32>;
${r>0||i!==`color`?`@group(0) @binding(1) var metadata: texture_2d<f32>;
fn decodeGuidanceNormal(encoded: vec2<f32>) -> vec3<f32> {
  let signedNormal = encoded * 2.0 - vec2<f32>(1.0);
  var normal = vec3<f32>(signedNormal, 1.0 - abs(signedNormal.x) - abs(signedNormal.y));
  let fold = clamp(-normal.z, 0.0, 1.0);
  normal.x += select(-fold, fold, normal.x < 0.0);
  normal.y += select(-fold, fold, normal.y < 0.0);
  return normalize(normal);
}
fn loadGuidedColor(pixel: vec2<i32>) -> vec3<f32> {
  let center = textureLoad(metadata, pixel, 0);
  let centerColor = textureLoad(image, pixel, 0).rgb;
  if (center.a <= 0.0 || center.a >= 65504.0) { return centerColor; }
  let normal = decodeGuidanceNormal(center.xy);
  var color = vec3<f32>(0.0);
  var totalWeight = 0.0;
  let maximumPixel = vec2<i32>(textureDimensions(image)) - vec2<i32>(1);
  for (var vertical = -${r}; vertical <= ${r}; vertical++) {
    for (var horizontal = -${r}; horizontal <= ${r}; horizontal++) {
      let offset = vec2<i32>(horizontal, vertical);
      let neighborPixel = pixel + offset;
      if (any(neighborPixel < vec2<i32>(0)) || any(neighborPixel > maximumPixel)) { continue; }
      let neighbor = textureLoad(metadata, neighborPixel, 0);
      let normalAgreement = dot(normal, decodeGuidanceNormal(neighbor.xy));
      let depthDifference = abs(center.z - neighbor.z) / max(center.z, 0.0001);
      if (neighbor.a != center.a || normalAgreement < 0.9 || depthDifference > 0.02) { continue; }
      let weight = exp(-0.5 * f32(dot(offset, offset))) * pow(max(normalAgreement, 0.0), 16.0)
        * exp(-100.0 * depthDifference);
      color += textureLoad(image, neighborPixel, 0).rgb * weight;
      totalWeight += weight;
    }
  }
  return color / max(totalWeight, 0.0001);
}`:``}

struct PresentationVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) textureCoordinates: vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> PresentationVertexOutput {
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  let position = positions[vertexIndex];
  var output: PresentationVertexOutput;
  output.position = vec4<f32>(position, 0.0, 1.0);
  output.textureCoordinates = vec2<f32>(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
  return output;
}

fn sampleRayTracingImage(textureCoordinates: vec2<f32>) -> vec3<f32> {
  let dimensions = textureDimensions(image);
  let maximumPixel = vec2<i32>(dimensions) - vec2<i32>(1);
  let samplePosition = clamp(
    textureCoordinates * vec2<f32>(dimensions) - vec2<f32>(0.5),
    vec2<f32>(0.0),
    vec2<f32>(maximumPixel)
  );
  let firstPixel = vec2<i32>(floor(samplePosition));
  let secondPixel = min(firstPixel + vec2<i32>(1), maximumPixel);
  let fraction = fract(samplePosition);
  let topLeft = ${r?`loadGuidedColor(firstPixel)`:`textureLoad(image, firstPixel, 0).rgb`};
  let topRight = ${r?`loadGuidedColor(vec2<i32>(secondPixel.x, firstPixel.y))`:`textureLoad(image, vec2<i32>(secondPixel.x, firstPixel.y), 0).rgb`};
  let bottomLeft = ${r?`loadGuidedColor(vec2<i32>(firstPixel.x, secondPixel.y))`:`textureLoad(image, vec2<i32>(firstPixel.x, secondPixel.y), 0).rgb`};
  let bottomRight = ${r?`loadGuidedColor(secondPixel)`:`textureLoad(image, secondPixel, 0).rgb`};
  return mix(mix(topLeft, topRight, fraction.x), mix(bottomLeft, bottomRight, fraction.x), fraction.y);
}

fn encodeRayTracingLinearSRGB(linearColor: vec3<f32>) -> vec3<f32> {
  let positiveColor = max(linearColor, vec3<f32>(0.0));
  return select(
    positiveColor * 12.92,
    1.055 * pow(positiveColor, vec3<f32>(1.0 / 2.4)) - 0.055,
    positiveColor > vec3<f32>(0.0031308)
  );
}

fn toneMapRayTracingKhronosPBRNeutral(inputColor: vec3<f32>) -> vec3<f32> {
  let startCompression = 0.76;
  let darkestChannel = min(inputColor.r, min(inputColor.g, inputColor.b));
  let offset = select(
    0.04,
    darkestChannel - 6.25 * darkestChannel * darkestChannel,
    darkestChannel < 0.08
  );
  var color = inputColor - vec3<f32>(offset);
  let peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) {
    return color;
  }

  let compressionRange = 1.0 - startCompression;
  let compressedPeak = 1.0 - compressionRange * compressionRange /
    (peak + compressionRange - startCompression);
  color *= compressedPeak / max(peak, 0.0001);
  let desaturation = 1.0 - 1.0 / (0.15 * (peak - compressedPeak) + 1.0);
  return mix(color, vec3<f32>(compressedPeak), desaturation);
}

@fragment
fn fragmentMain(@location(0) textureCoordinates: vec2<f32>) -> @location(0) vec4<f32> {
  ${i===`color`?`
  let radiance = sampleRayTracingImage(textureCoordinates);
  var color = max(radiance, vec3<f32>(0.0));
  if (${t} == 1) {
    color /= vec3<f32>(1.0) + color;
  } else if (${t} == 2) {
    color = toneMapRayTracingKhronosPBRNeutral(color);
  } else if (${t} == 3) {
    color = clamp(
      (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14),
      vec3<f32>(0.0),
      vec3<f32>(1.0)
    );
  }
  if (${n} == 0) {
    return vec4<f32>(color, 1.0);
  }
  return vec4<f32>(encodeRayTracingLinearSRGB(color), 1.0);
  `:Hh(i)}
}
`}function Hh(e){let t=`let pixel = clamp(vec2<i32>(textureCoordinates * vec2<f32>(textureDimensions(image))),
    vec2<i32>(0), vec2<i32>(textureDimensions(image)) - vec2<i32>(1));`;if(e===`history`)return`${t}
      let confidence = log2(1.0 + textureLoad(image, pixel, 0).a) / log2(257.0);
      return vec4<f32>(vec3<f32>(clamp(confidence, 0.0, 1.0)), 1.0);`;let n=`${t}
    let guidance = textureLoad(metadata, pixel, 0);
    if (guidance.a <= 0.0) { return vec4<f32>(0.0, 0.0, 0.0, 1.0); }`;switch(e){case`normal`:return`${n}
        return vec4<f32>(decodeGuidanceNormal(guidance.xy) * 0.5 + vec3<f32>(0.5), 1.0);`;case`cameraDistance`:return`${n}
        return vec4<f32>(vec3<f32>(guidance.z / (1.0 + guidance.z)), 1.0);`;case`identity`:return`${n}
        if (guidance.a >= 65504.0) { return vec4<f32>(1.0, 0.0, 1.0, 1.0); }
        let identifier = u32(guidance.a);
        let hashed = identifier * 747796405u + 2891336453u;
        return vec4<f32>(vec3<f32>(f32(hashed & 255u), f32((hashed >> 8u) & 255u), f32((hashed >> 16u) & 255u)) / 255.0, 1.0);`;default:return``}}var Uh=72,Wh=24,Gh=8,Kh=16,qh=80,Jh=.5,Yh=.25,Xh=33.3,Zh=[.25,.375,.5,.75,1],Qh=750,$h=1.2,eg=.65,tg=6,ng=45,rg=8,ig=64,ag=4294967295,og=32,sg=.25,cg=`
const INVALID_BOUND = 3.402823466e+38;

@group(0) @binding(0) var<storage, read_write> sceneBounds: array<atomic<u32>>;

fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}

@compute @workgroup_size(1)
fn main() {
  for (var axis = 0u; axis < 3u; axis++) {
    atomicStore(&sceneBounds[axis], encodeOrderedFloat(INVALID_BOUND));
    atomicStore(&sceneBounds[axis + 3u], encodeOrderedFloat(-INVALID_BOUND));
  }
}
`,lg=`
const PRIMITIVE_CAPACITY = __PRIMITIVE_CAPACITY__u;

@group(0) @binding(0) var<storage, read> primitiveMinima: array<f32>;
@group(0) @binding(1) var<storage, read> primitiveMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> sceneBounds: array<atomic<u32>>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let primitiveIndex = invocation.x;
  if (primitiveIndex >= PRIMITIVE_CAPACITY) {
    return;
  }

  let componentIndex = primitiveIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  var valid = true;
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = primitiveMinima[componentIndex + axis];
    maximum[axis] = primitiveMaxima[componentIndex + axis];
    valid = valid && finite(minimum[axis]) && finite(maximum[axis]) &&
      minimum[axis] <= maximum[axis];
  }
  if (!valid) {
    return;
  }

  for (var axis = 0u; axis < 3u; axis++) {
    atomicMin(&sceneBounds[axis], encodeOrderedFloat(minimum[axis]));
    atomicMax(&sceneBounds[axis + 3u], encodeOrderedFloat(maximum[axis]));
  }
}
`,ug=`
const PRIMITIVE_CAPACITY = __PRIMITIVE_CAPACITY__u;
const INVALID_PRIMITIVE_ID = 0xffffffffu;

@group(0) @binding(0) var<storage, read> primitiveMinima: array<f32>;
@group(0) @binding(1) var<storage, read> primitiveMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sceneBounds: array<u32>;
@group(0) @binding(3) var<storage, read_write> mortonKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> primitiveIds: array<u32>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn decodeOrderedFloat(value: u32) -> f32 {
  let bits = select(value ^ 0x80000000u, ~value, (value & 0x80000000u) == 0u);
  return bitcast<f32>(bits);
}

fn expandMortonBits(value: u32) -> u32 {
  var bits = value & 1023u;
  bits = (bits | (bits << 16u)) & 0x030000ffu;
  bits = (bits | (bits << 8u)) & 0x0300f00fu;
  bits = (bits | (bits << 4u)) & 0x030c30c3u;
  bits = (bits | (bits << 2u)) & 0x09249249u;
  return bits;
}

fn makeMortonKey(position: vec3<f32>) -> u32 {
  let coordinates = clamp(position, vec3<f32>(0.0), vec3<f32>(0.99999994)) * 1024.0;
  let quantized = vec3<u32>(
    u32(coordinates.x),
    u32(coordinates.y),
    u32(coordinates.z)
  );
  return expandMortonBits(quantized.x) * 4u +
    expandMortonBits(quantized.y) * 2u +
    expandMortonBits(quantized.z);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let primitiveIndex = invocation.x;
  if (primitiveIndex >= PRIMITIVE_CAPACITY) {
    return;
  }

  primitiveIds[primitiveIndex] = primitiveIndex;
  let componentIndex = primitiveIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  var valid = true;
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = primitiveMinima[componentIndex + axis];
    maximum[axis] = primitiveMaxima[componentIndex + axis];
    valid = valid && finite(minimum[axis]) && finite(maximum[axis]) &&
      minimum[axis] <= maximum[axis];
  }
  if (!valid) {
    mortonKeys[primitiveIndex] = INVALID_PRIMITIVE_ID;
    return;
  }

  var sceneMinimum = vec3<f32>();
  var sceneMaximum = vec3<f32>();
  for (var axis = 0u; axis < 3u; axis++) {
    sceneMinimum[axis] = decodeOrderedFloat(sceneBounds[axis]);
    sceneMaximum[axis] = decodeOrderedFloat(sceneBounds[axis + 3u]);
  }
  let extent = max(sceneMaximum - sceneMinimum, vec3<f32>(0.000001));
  let center = (minimum + maximum) * 0.5;
  mortonKeys[primitiveIndex] = makeMortonKey((center - sceneMinimum) / extent);
}
`,dg=`
const PRIMITIVE_CAPACITY = __PRIMITIVE_CAPACITY__u;
const INVALID_BOUND = 3.402823466e+38;

@group(0) @binding(0) var<storage, read> primitiveMinima: array<f32>;
@group(0) @binding(1) var<storage, read> primitiveMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sortedPrimitiveIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> sortedMinima: array<f32>;
@group(0) @binding(4) var<storage, read_write> sortedMaxima: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let sortedIndex = invocation.x;
  if (sortedIndex >= PRIMITIVE_CAPACITY) {
    return;
  }

  let destinationComponent = sortedIndex * 3u;
  let primitiveIndex = sortedPrimitiveIds[sortedIndex];
  if (primitiveIndex >= PRIMITIVE_CAPACITY) {
    for (var axis = 0u; axis < 3u; axis++) {
      sortedMinima[destinationComponent + axis] = INVALID_BOUND;
      sortedMaxima[destinationComponent + axis] = -INVALID_BOUND;
    }
    return;
  }

  let sourceComponent = primitiveIndex * 3u;
  for (var axis = 0u; axis < 3u; axis++) {
    sortedMinima[destinationComponent + axis] = primitiveMinima[sourceComponent + axis];
    sortedMaxima[destinationComponent + axis] = primitiveMaxima[sourceComponent + axis];
  }
}
`,fg=`
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;

struct RayTriangle {
  firstPosition: vec4<f32>,
  secondPosition: vec4<f32>,
  thirdPosition: vec4<f32>,
  firstNormal: vec4<f32>,
  secondNormal: vec4<f32>,
  thirdNormal: vec4<f32>,
};

@group(0) @binding(0) var<storage, read> triangles: array<RayTriangle>;
@group(0) @binding(1) var<storage, read_write> triangleMinima: array<f32>;
@group(0) @binding(2) var<storage, read_write> triangleMaxima: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let triangleIndex = invocation.x;
  if (triangleIndex >= TRIANGLE_COUNT) {
    return;
  }

  let triangle = triangles[triangleIndex];
  let minimum = min(
    min(triangle.firstPosition.xyz, triangle.secondPosition.xyz),
    triangle.thirdPosition.xyz
  );
  let maximum = max(
    max(triangle.firstPosition.xyz, triangle.secondPosition.xyz),
    triangle.thirdPosition.xyz
  );
  let componentIndex = triangleIndex * 3u;
  for (var axis = 0u; axis < 3u; axis++) {
    triangleMinima[componentIndex + axis] = minimum[axis];
    triangleMaxima[componentIndex + axis] = maximum[axis];
  }
}
`,pg=`
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;
const MINIMA_OFFSET = __MINIMA_OFFSET__u;
const MAXIMA_OFFSET = __MAXIMA_OFFSET__u;

@group(0) @binding(0) var<storage, read> triangleMinima: array<f32>;
@group(0) @binding(1) var<storage, read> triangleMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> sceneBounds: array<atomic<u32>>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let triangleIndex = invocation.x;
  if (triangleIndex >= TRIANGLE_COUNT) {
    return;
  }

  let componentIndex = triangleIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  var valid = true;
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = triangleMinima[MINIMA_OFFSET + componentIndex + axis];
    maximum[axis] = triangleMaxima[MAXIMA_OFFSET + componentIndex + axis];
    valid = valid && finite(minimum[axis]) && finite(maximum[axis]) &&
      minimum[axis] <= maximum[axis];
  }
  if (!valid) {
    return;
  }

  for (var axis = 0u; axis < 3u; axis++) {
    atomicMin(&sceneBounds[axis], encodeOrderedFloat(minimum[axis]));
    atomicMax(&sceneBounds[axis + 3u], encodeOrderedFloat(maximum[axis]));
  }
}
`,mg=`
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;
const MINIMA_OFFSET = __MINIMA_OFFSET__u;
const MAXIMA_OFFSET = __MAXIMA_OFFSET__u;
const MORTON_KEYS_OFFSET = __MORTON_KEYS_OFFSET__u;
const TRIANGLE_IDS_OFFSET = __TRIANGLE_IDS_OFFSET__u;

@group(0) @binding(0) var<storage, read> triangleMinima: array<f32>;
@group(0) @binding(1) var<storage, read> triangleMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sceneBounds: array<u32>;
@group(0) @binding(3) var<storage, read_write> mortonKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> triangleIds: array<u32>;

fn decodeOrderedFloat(value: u32) -> f32 {
  let bits = select(value ^ 0x80000000u, ~value, (value & 0x80000000u) == 0u);
  return bitcast<f32>(bits);
}

fn expandMortonBits(value: u32) -> u32 {
  var bits = value & 1023u;
  bits = (bits | (bits << 16u)) & 0x030000ffu;
  bits = (bits | (bits << 8u)) & 0x0300f00fu;
  bits = (bits | (bits << 4u)) & 0x030c30c3u;
  bits = (bits | (bits << 2u)) & 0x09249249u;
  return bits;
}

fn makeMortonKey(position: vec3<f32>) -> u32 {
  let coordinates = clamp(position, vec3<f32>(0.0), vec3<f32>(0.99999994)) * 1024.0;
  let quantized = vec3<u32>(
    u32(coordinates.x),
    u32(coordinates.y),
    u32(coordinates.z)
  );
  return expandMortonBits(quantized.x) * 4u +
    expandMortonBits(quantized.y) * 2u +
    expandMortonBits(quantized.z);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let triangleIndex = invocation.x;
  if (triangleIndex >= TRIANGLE_COUNT) {
    return;
  }

  triangleIds[TRIANGLE_IDS_OFFSET + triangleIndex] = triangleIndex;
  let componentIndex = triangleIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = triangleMinima[MINIMA_OFFSET + componentIndex + axis];
    maximum[axis] = triangleMaxima[MAXIMA_OFFSET + componentIndex + axis];
  }

  var sceneMinimum = vec3<f32>();
  var sceneMaximum = vec3<f32>();
  for (var axis = 0u; axis < 3u; axis++) {
    sceneMinimum[axis] = decodeOrderedFloat(sceneBounds[axis]);
    sceneMaximum[axis] = decodeOrderedFloat(sceneBounds[axis + 3u]);
  }
  let extent = max(sceneMaximum - sceneMinimum, vec3<f32>(0.000001));
  let center = (minimum + maximum) * 0.5;
  mortonKeys[MORTON_KEYS_OFFSET + triangleIndex] =
    makeMortonKey((center - sceneMinimum) / extent);
}
`,hg=`
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;
const MINIMA_OFFSET = __MINIMA_OFFSET__u;
const MAXIMA_OFFSET = __MAXIMA_OFFSET__u;
const SORTED_TRIANGLE_IDS_OFFSET = __SORTED_TRIANGLE_IDS_OFFSET__u;
const SORTED_MINIMA_OFFSET = __SORTED_MINIMA_OFFSET__u;
const SORTED_MAXIMA_OFFSET = __SORTED_MAXIMA_OFFSET__u;

@group(0) @binding(0) var<storage, read> triangleMinima: array<f32>;
@group(0) @binding(1) var<storage, read> triangleMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sortedTriangleIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> sortedMinima: array<f32>;
@group(0) @binding(4) var<storage, read_write> sortedMaxima: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let sortedIndex = invocation.x;
  if (sortedIndex >= TRIANGLE_COUNT) {
    return;
  }

  let triangleIndex = sortedTriangleIds[SORTED_TRIANGLE_IDS_OFFSET + sortedIndex];
  let sourceComponent = triangleIndex * 3u;
  let destinationComponent = sortedIndex * 3u;
  for (var axis = 0u; axis < 3u; axis++) {
    sortedMinima[SORTED_MINIMA_OFFSET + destinationComponent + axis] =
      triangleMinima[MINIMA_OFFSET + sourceComponent + axis];
    sortedMaxima[SORTED_MAXIMA_OFFSET + destinationComponent + axis] =
      triangleMaxima[MAXIMA_OFFSET + sourceComponent + axis];
  }
}
`,gg=`
const NODE_COUNT = __NODE_COUNT__u;
const NODE_MINIMA_OFFSET = __NODE_MINIMA_OFFSET__u;
const NODE_MAXIMA_OFFSET = __NODE_MAXIMA_OFFSET__u;
const PACKED_NODES_OFFSET = __PACKED_NODES_OFFSET__u;

@group(0) @binding(0) var<storage, read> nodeMinima: array<f32>;
@group(0) @binding(1) var<storage, read> nodeMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> packedNodes: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let nodeIndex = invocation.x;
  if (nodeIndex >= NODE_COUNT) {
    return;
  }

  let sourceComponent = nodeIndex * 3u;
  let destinationComponent = nodeIndex * 8u;
  for (var axis = 0u; axis < 3u; axis++) {
    packedNodes[PACKED_NODES_OFFSET + destinationComponent + axis] =
      nodeMinima[NODE_MINIMA_OFFSET + sourceComponent + axis];
    packedNodes[PACKED_NODES_OFFSET + destinationComponent + 4u + axis] =
      nodeMaxima[NODE_MAXIMA_OFFSET + sourceComponent + axis];
  }
  packedNodes[PACKED_NODES_OFFSET + destinationComponent + 3u] = 0.0;
  packedNodes[PACKED_NODES_OFFSET + destinationComponent + 7u] = 0.0;
}
`,_g=class{device;frames=new Map;emitterAreaCaches=new Map;geometryCache=new Map;pickComputation;channelComputation;constructor(e){if(e.type!==`webgpu`)throw Error(`Ray tracing scene rendering requires a WebGPU device.`);this.device=e}render(e){let[t,n]=vg(this.device,e);if(e.imageRegion){let{offset:r,fullSize:i}=e.imageRegion;y([...r,...i].every(Number.isInteger)&&r.every(e=>e>=0)&&i.every(e=>e>0)&&i[0]*i[1]<=4294967295&&r[0]+t<=i[0]&&r[1]+n<=i[1]),e={...e,resolutionScale:1,adaptiveResolution:!1,temporalReprojection:!1}}y(e.samplingFrameIndex===void 0||Number.isInteger(e.samplingFrameIndex)&&e.samplingFrameIndex>=0&&e.samplingFrameIndex<=4294967295);let r=yg(this.device,e),i=e.lights??[],a=Wg(e),o=new D(e.camera.projectionMatrix).multiplyRight(e.camera.viewMatrix),s=new D(o).invert(),c=Dg(e),l=kg(e),u=Og(e,l),d=Ag(e,i),f=this.frames.get(e.id),p=e_();if(f){Kg(f,p),Gg(f,a)&&(f.historyNeedsReset=!0);let s=f.topologyRevision!==c,m=f.primitiveRevision!==u,h=f.transformRevision!==l,g=f.lightRevision!==d;((e.maxBounces??0)>0||e.emitterSampling)&&(m||g)&&(f.historyNeedsReset=!0);let _=wg(e,f,s,h),v=!s&&!m&&f.previousTransformsNeedCommit&&f.pendingPreviousTransformInstanceIds.size>0&&f.pendingPreviousTransformInstanceIds.size<=Cg(f),y,b,x;s&&(y=Mg(e.surfaces,e.primitives??{},this.geometryCache)),s||m&&!_?b=Ng(e.surfaces,e.primitives??{},y?.geometryLayouts??f.geometryLayouts,f.previousTransforms):f.previousTransformsNeedCommit&&!_&&!v&&(b=Ng(e.surfaces,e.primitives??{},f.geometryLayouts,f.previousTransforms));let S=b?Rg(b.primitives):f.emitterPrimitiveIndices;if((g||e.emitterSampling&&(m||s))&&(x=zg(i,e.emitterSampling?S:[],e,this.getEmitterAreaCache(e.id))),s||b&&f.primitiveBuffer.byteLength<b.primitives.byteLength||y&&f.triangleBuffer.byteLength<y.triangles.byteLength||x&&f.lightBuffer.byteLength<x.byteLength){y??=Mg(e.surfaces,e.primitives??{},this.geometryCache),b??=Ng(e.surfaces,e.primitives??{},y.geometryLayouts,f.previousTransforms);let s=Pg(b,y.triangles,i,e.emitterSampling??!1,e,this.getEmitterAreaCache(e.id)),p=f.previousTransformsNeedCommit||h;this.destroyFrame(e.id),f=this.createFrameResources({frameIdentifier:e.id,displayWidth:t,displayHeight:n,presentation:r,scene:s,topology:y,primitiveData:b,surfaces:e.surfaces,quality:a,viewProjection:o,cameraPosition:e.camera.position}),f.previousTransformsNeedCommit=p;let m=f.primitivePlacements;f.pendingPreviousTransformInstanceIds=new Set(p?(e.sceneRevisions?.dirtyInstanceIds??[]).filter(e=>m.has(e)):[]),f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d,this.frames.set(e.id,f)}else{if(y&&(f.triangleBuffer.write(y.triangles),f.geometryLayouts=y.geometryLayouts,f.historyNeedsReset=!0,f.accelerationUpdateMode=`rebuild`),b){f.primitiveBuffer.write(b.primitives),f.previousTransforms=b.previousTransforms,f.primitivePlacements=b.placements,f.pickIdentities=b.pickIdentities,f.emitterPrimitiveIndices=S,f.retainedSurfaces=e.surfaces;let t=b.placements;f.pendingPreviousTransformInstanceIds=new Set(h?(e.sceneRevisions?.dirtyInstanceIds??[]).filter(e=>t.has(e)):[]),f.previousTransformsNeedCommit=h,f.primitiveCount=b.primitiveCount,f.triangleCount=b.triangleCount,h?(Eg(f),(e.temporalReprojection??!0)||(f.historyNeedsReset=!0)):m&&(f.historyNeedsReset=!0)}else (_||v)&&(Tg(f,_??[]),h&&(Eg(f),(e.temporalReprojection??!0)||(f.historyNeedsReset=!0)));if(x){let t=f.lightCount!==i.length;f.lightBuffer.write(x),f.lightCount=i.length,f.emitterPrimitiveIndices=S,(t||!(e.temporalReprojection??!0))&&(f.historyNeedsReset=!0)}f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d}}else{let s=Mg(e.surfaces,e.primitives??{},this.geometryCache),p=Ng(e.surfaces,e.primitives??{},s.geometryLayouts,new Map),m=Pg(p,s.triangles,i,e.emitterSampling??!1,e,this.getEmitterAreaCache(e.id));f=this.createFrameResources({frameIdentifier:e.id,displayWidth:t,displayHeight:n,presentation:r,scene:m,topology:s,primitiveData:p,surfaces:e.surfaces,quality:a,viewProjection:o,cameraPosition:e.camera.position}),f.topologyRevision=c,f.primitiveRevision=u,f.transformRevision=l,f.materialRevision=e.sceneRevisions?.materials,f.lightRevision=d,this.frames.set(e.id,f)}f.lastRenderTimeMilliseconds||=p;let m=jg(e,s);f.renderRevision!==m&&(f.renderRevision=m,f.historyNeedsReset=!0),(e.temporalReprojection??!0)&&$g(f.previousViewProjection,o,f.previousCameraPosition,e.camera.position)&&(f.historyNeedsReset=!0),(f.displayWidth!==t||f.displayHeight!==n)&&(f.historyNeedsReset=!0),qg(f,p);let h=Jg(t,n,f.resolutionScale);f.displayWidth!==t||f.displayHeight!==n||f.internalWidth!==h.width||f.internalHeight!==h.height?this.recreateTraceResources(e.id,f,t,n,h.width,h.height,r):bg(f.presentation,r)||this.recreateTraceGraph(e.id,f,r);let g=e.progressive??!0,_=e.temporalReprojection??!0;f.historyNeedsReset&&(f.accumulatedFrameCount=0,f.phaseCount=1,f.phaseIndex=0);let v=f.historyNeedsReset?1:f.phaseCount,b=f.historyNeedsReset?0:f.phaseIndex%v,x=g?f.accumulatedFrameCount:0;f.uniformBuffer.write(Vg({options:e,inverseViewProjection:s,previousViewProjection:f.previousViewProjection,previousCameraPosition:f.previousCameraPosition,displayWidth:t,displayHeight:n,internalWidth:f.internalWidth,internalHeight:f.internalHeight,resolutionScale:f.resolutionScale,phaseIndex:b,phaseCount:v,primitiveCount:f.primitiveCount,primitiveCapacity:f.primitiveCapacity,leafCapacity:f.leafCapacity,lightCount:f.lightCount,emitterCount:e.emitterSampling?f.emitterPrimitiveIndices.length:0,directLightCount:i.reduce((e,t)=>e+Number(t.type!==`ambient`),0),accumulatedFrameCount:x,frameIndex:g||_?f.frameIndex:0}));let S,C,w;f.topologyNeedsUpdate&&(S=f.topologyGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.topologyNeedsUpdate=!1),f.accelerationUpdateMode===`rebuild`?(C=f.accelerationGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.refitsSinceMortonRebuild=0):f.accelerationUpdateMode===`refit`&&(w=f.refitGraph.encode(this.device.commandEncoder,{parameters:void 0}).stats,f.refitsSinceMortonRebuild++),f.accelerationUpdateMode=`none`;let ee=f.traceGraph.encode(this.device.commandEncoder,{parameters:{dispatchWidth:Math.ceil(f.internalWidth/v),carryWidth:v>1?Math.ceil(f.internalWidth*(v-1)/v):0,...e.framebuffer?{framebuffer:e.framebuffer}:{}},textures:{...f.colorHistory.getBindings(`history`,`output`),...f.metadataHistory.getBindings(`history-metadata`,`output-metadata`)}}).stats;f.colorHistory.advance(),f.metadataHistory.advance(),f.previousViewProjection=new D(o),f.previousCameraPosition=Array.from(e.camera.position),f.historyNeedsReset=!1,f.phaseIndex=(b+1)%f.phaseCount,f.frameIndex++,f.accumulatedFrameCount=g?x+1:0;let T=Qg(e);return{surfaceCount:e.surfaces.length,instanceCount:f.primitiveCount,drawCount:1,triangleCount:f.triangleCount,rayTracing:{internalWidth:f.internalWidth,internalHeight:f.internalHeight,resolutionScale:f.resolutionScale,sampledPixelCoverage:1/v,frameTimeMilliseconds:f.averageFrameTimeMilliseconds??f.targetFrameTimeMilliseconds,accumulatedSamples:g?Math.min(f.accumulatedFrameCount*T,t_(e)):T,memory:n_(f),graph:Sg({topology:S,acceleration:C,refit:w,trace:ee})}}}async pick(e,t,n){let r=this.frames.get(e);if(!r||!Number.isFinite(t)||!Number.isFinite(n)||t<0||n<0||t>=r.displayWidth||n>=r.displayHeight)return null;let i=r.pickIdentities,a=this.device.createBuffer({usage:g.UNIFORM|g.COPY_DST,data:new Float32Array([(Math.floor(t)+.5)/r.displayWidth,(Math.floor(n)+.5)/r.displayHeight,0,0])}),o=this.device.createBuffer({usage:g.STORAGE|g.COPY_SRC,byteLength:32}),s=this.device.createCommandEncoder(),c;try{this.pickComputation??=new M(this.device,{id:`ray-scene-picking`,source:zh,entryPoint:`pick`,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`triangles`,type:`read-only-storage`,group:0,location:2},{name:`nodeMinima`,type:`read-only-storage`,group:0,location:4},{name:`nodeMaxima`,type:`read-only-storage`,group:0,location:5},{name:`leafPrimitiveIds`,type:`read-only-storage`,group:0,location:6},{name:`blasNodes`,type:`read-only-storage`,group:0,location:7},{name:`blasTriangleIds`,type:`read-only-storage`,group:0,location:8},{name:`pickResult`,type:`storage`,group:0,location:13},{name:`pickCoordinates`,type:`uniform`,group:0,location:14}]}}),this.pickComputation.setBindings({uniforms:r.uniformBuffer,primitives:r.primitiveBuffer,triangles:r.triangleBuffer,nodeMinima:r.nodeMinimaBuffer,nodeMaxima:r.nodeMaximaBuffer,leafPrimitiveIds:r.sortedPrimitiveIdsBuffer,blasNodes:r.blasNodesBuffer,blasTriangleIds:r.blasTriangleIdsBuffer,pickResult:o,pickCoordinates:a});let e=s.beginComputePass();this.pickComputation.dispatch(e,1),e.end(),c=s.finish(),this.device.submit(c);let t=await o.readAsync(),n=new Float32Array(t.buffer,t.byteOffset,8),l=i[new Uint32Array(t.buffer,t.byteOffset,8)[7]-1];return l?{...l,position:[n[0],n[1],n[2]],distance:n[3],normal:[n[4],n[5],n[6]]}:null}finally{c?.destroy(),s.destroy(),a.destroy(),o.destroy()}}captureChannels(e){let t=this.frames.get(e);if(!t)return null;let n=e=>this.device.createTexture({width:t.displayWidth,height:t.displayHeight,format:e,usage:p.STORAGE|p.SAMPLE|p.COPY_SRC}),r=[],i=this.device.createCommandEncoder(),a;try{a=this.device.createBuffer({data:new Float32Array(t.previousViewProjection),usage:g.UNIFORM});let e=n(`r32uint`);r.push(e);let o=n(`r32float`);r.push(o);let s=n(`rgba32float`);r.push(s);let c=n(`r32float`);r.push(c),this.channelComputation??=new M(this.device,{id:`ray-scene-channels`,source:Bh,entryPoint:`captureChannels`,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`triangles`,type:`read-only-storage`,group:0,location:2},{name:`nodeMinima`,type:`read-only-storage`,group:0,location:4},{name:`nodeMaxima`,type:`read-only-storage`,group:0,location:5},{name:`leafPrimitiveIds`,type:`read-only-storage`,group:0,location:6},{name:`blasNodes`,type:`read-only-storage`,group:0,location:7},{name:`blasTriangleIds`,type:`read-only-storage`,group:0,location:8},{name:`identifierImage`,type:`storage`,group:0,location:13,access:`write-only`,format:`r32uint`},{name:`distanceImage`,type:`storage`,group:0,location:14,access:`write-only`,format:`r32float`},{name:`normalImage`,type:`storage`,group:0,location:15,access:`write-only`,format:`rgba32float`},{name:`projectedDepthImage`,type:`storage`,group:0,location:16,access:`write-only`,format:`r32float`},{name:`channelViewProjection`,type:`uniform`,group:0,location:17}]}}),this.channelComputation.setBindings({uniforms:t.uniformBuffer,primitives:t.primitiveBuffer,triangles:t.triangleBuffer,nodeMinima:t.nodeMinimaBuffer,nodeMaxima:t.nodeMaximaBuffer,leafPrimitiveIds:t.sortedPrimitiveIdsBuffer,blasNodes:t.blasNodesBuffer,blasTriangleIds:t.blasTriangleIdsBuffer,identifierImage:e,distanceImage:o,normalImage:s,projectedDepthImage:c,channelViewProjection:a});let l=i.beginComputePass();return this.channelComputation.dispatch(l,Math.ceil(t.displayWidth/8),Math.ceil(t.displayHeight/8)),l.end(),this.device.submit(i.finish()),{identifiers:t.pickIdentities.slice(),identifierTexture:e,distanceTexture:o,normalTexture:s,projectedDepthTexture:c,destroy:()=>{for(let e of r)e.destroy()}}}catch(e){for(let e of r)e.destroy();throw e}finally{a?.destroy(),i.destroy()}}getEmitterAreaCache(e){let t=this.emitterAreaCaches.get(e);return t||(t=new Map,this.emitterAreaCaches.set(e,t)),t}destroyFrame(e){this.emitterAreaCaches.delete(e);let t=this.frames.get(e);t&&(t.topologyGraph.destroy(),t.accelerationGraph.destroy(),t.refitGraph.destroy(),t.traceGraph.destroy(),t.uniformBuffer.destroy(),t.primitiveBuffer.destroy(),t.triangleBuffer.destroy(),t.lightBuffer.destroy(),t.nodeMinimaBuffer.destroy(),t.nodeMaximaBuffer.destroy(),t.nodeChildrenBuffer.destroy(),t.leafIdsBuffer.destroy(),t.sortedPrimitiveIdsBuffer.destroy(),t.blasNodesBuffer.destroy(),t.blasTriangleIdsBuffer.destroy(),t.bvhCountBuffer.destroy(),t.bvhOverflowBuffer.destroy(),t.colorHistory.destroy(),t.metadataHistory.destroy(),this.frames.delete(e))}destroy(){for(let e of Array.from(this.frames.keys()))this.destroyFrame(e);this.emitterAreaCaches.clear(),this.pickComputation?.destroy(),this.pickComputation=void 0,this.channelComputation?.destroy(),this.channelComputation=void 0}createFrameResources(e){let{frameIdentifier:t,scene:n}=e,r=this.device.createBuffer({id:`${t}-ray-tracing-uniforms`,byteLength:qh*Float32Array.BYTES_PER_ELEMENT,usage:g.UNIFORM|g.COPY_DST}),i=this.device.createBuffer({id:`${t}-ray-tracing-primitives`,data:n.primitives,usage:g.STORAGE|g.COPY_DST}),a=this.device.createBuffer({id:`${t}-ray-tracing-triangles`,data:n.triangles,usage:g.STORAGE|g.COPY_DST}),o=this.device.createBuffer({id:`${t}-ray-tracing-lights`,data:n.lights,usage:g.STORAGE|g.COPY_DST}),s=Math.max(1,Math.floor(i.byteLength/(Uh*Float32Array.BYTES_PER_ELEMENT))),c=2**Math.ceil(Math.log2(s)),l=c*2-1,u=this.device.createBuffer({id:`${t}-ray-tracing-node-minima`,byteLength:l*3*Float32Array.BYTES_PER_ELEMENT,usage:g.STORAGE}),d=this.device.createBuffer({id:`${t}-ray-tracing-node-maxima`,byteLength:l*3*Float32Array.BYTES_PER_ELEMENT,usage:g.STORAGE}),f=this.device.createBuffer({id:`${t}-ray-tracing-node-children`,byteLength:l*2*Uint32Array.BYTES_PER_ELEMENT,usage:g.STORAGE}),p=this.device.createBuffer({id:`${t}-ray-tracing-leaf-ids`,byteLength:c*Uint32Array.BYTES_PER_ELEMENT,usage:g.STORAGE}),m=this.device.createBuffer({id:`${t}-ray-tracing-sorted-primitive-ids`,data:new Uint32Array(c).fill(ag),usage:g.STORAGE}),h=this.device.createBuffer({id:`${t}-ray-tracing-blas-nodes`,byteLength:Math.max(1,e.topology.blasNodeCount)*Gh*Float32Array.BYTES_PER_ELEMENT,usage:g.STORAGE}),_=this.device.createBuffer({id:`${t}-ray-tracing-blas-triangle-ids`,data:new Uint32Array(Math.max(1,e.topology.blasTriangleIdCount)).fill(ag),usage:g.STORAGE}),v=this.device.createBuffer({id:`${t}-ray-tracing-bvh-count`,byteLength:Uint32Array.BYTES_PER_ELEMENT,usage:g.STORAGE}),y=this.device.createBuffer({id:`${t}-ray-tracing-bvh-overflow`,byteLength:Uint32Array.BYTES_PER_ELEMENT,usage:g.STORAGE}),b=Jg(e.displayWidth,e.displayHeight,e.quality.resolutionScale),x=this.createTextureHistory(t,`history`,b.width,b.height),S=this.createTextureHistory(t,`history-metadata`,b.width,b.height),C=this.createTopologyGraph({frameIdentifier:t,topology:e.topology,triangleBuffer:a,blasNodesBuffer:h,blasTriangleIdsBuffer:_}),w=this.createAccelerationGraph({frameIdentifier:t,uniformBuffer:r,primitiveBuffer:i,blasNodesBuffer:h,primitiveCapacity:s,leafCapacity:c,nodeMinimaBuffer:u,nodeMaximaBuffer:d,nodeChildrenBuffer:f,leafIdsBuffer:p,sortedPrimitiveIdsBuffer:m,bvhCountBuffer:v,bvhOverflowBuffer:y}),ee=this.createRefitGraph({frameIdentifier:t,uniformBuffer:r,primitiveBuffer:i,blasNodesBuffer:h,primitiveCapacity:s,leafCapacity:c,nodeMinimaBuffer:u,nodeMaximaBuffer:d,nodeChildrenBuffer:f,leafIdsBuffer:p,sortedPrimitiveIdsBuffer:m,bvhCountBuffer:v,bvhOverflowBuffer:y}),T=this.createTraceGraph({frameIdentifier:t,internalWidth:b.width,internalHeight:b.height,presentation:e.presentation,uniformBuffer:r,primitiveBuffer:i,triangleBuffer:a,lightBuffer:o,nodeMinimaBuffer:u,nodeMaximaBuffer:d,sortedPrimitiveIdsBuffer:m,blasNodesBuffer:h,blasTriangleIdsBuffer:_,colorHistory:x,metadataHistory:S});return{displayWidth:e.displayWidth,displayHeight:e.displayHeight,presentation:e.presentation,internalWidth:b.width,internalHeight:b.height,resolutionScale:e.quality.resolutionScale,requestedResolutionScale:e.quality.requestedResolutionScale,minimumResolutionScale:e.quality.minimumResolutionScale,adaptiveResolution:e.quality.adaptiveResolution,targetFrameTimeMilliseconds:e.quality.targetFrameTimeMilliseconds,phaseCount:1,phaseIndex:0,overBudgetFrameCount:0,underBudgetFrameCount:0,lastBudgetAdjustmentTimeMilliseconds:0,uniformBuffer:r,primitiveBuffer:i,triangleBuffer:a,lightBuffer:o,nodeMinimaBuffer:u,nodeMaximaBuffer:d,nodeChildrenBuffer:f,leafIdsBuffer:p,sortedPrimitiveIdsBuffer:m,blasNodesBuffer:h,blasTriangleIdsBuffer:_,bvhCountBuffer:v,bvhOverflowBuffer:y,colorHistory:x,metadataHistory:S,topologyGraph:C,accelerationGraph:w,refitGraph:ee,traceGraph:T,topologyRevision:``,primitiveRevision:``,transformRevision:``,lightRevision:``,renderRevision:``,geometryLayouts:e.topology.geometryLayouts,retainedSurfaces:e.surfaces,previousTransforms:e.primitiveData.previousTransforms,primitivePlacements:e.primitiveData.placements,pickIdentities:e.primitiveData.pickIdentities,pendingPreviousTransformInstanceIds:new Set,previousTransformsNeedCommit:!1,previousViewProjection:new D(e.viewProjection),previousCameraPosition:Array.from(e.cameraPosition),historyNeedsReset:!0,topologyNeedsUpdate:!0,accelerationUpdateMode:`rebuild`,refitsSinceMortonRebuild:0,frameIndex:0,accumulatedFrameCount:0,primitiveCount:n.primitiveCount,primitiveCapacity:s,leafCapacity:c,lightCount:n.lightCount,emitterPrimitiveIndices:n.emitterPrimitiveIndices,triangleCount:n.triangleCount}}recreateTraceResources(e,t,n,r,i,a,o){t.traceGraph.destroy(),t.colorHistory.destroy(),t.metadataHistory.destroy(),t.colorHistory=this.createTextureHistory(e,`history`,i,a),t.metadataHistory=this.createTextureHistory(e,`history-metadata`,i,a),t.traceGraph=this.createTraceGraph({frameIdentifier:e,internalWidth:i,internalHeight:a,presentation:o,uniformBuffer:t.uniformBuffer,primitiveBuffer:t.primitiveBuffer,triangleBuffer:t.triangleBuffer,lightBuffer:t.lightBuffer,nodeMinimaBuffer:t.nodeMinimaBuffer,nodeMaximaBuffer:t.nodeMaximaBuffer,sortedPrimitiveIdsBuffer:t.sortedPrimitiveIdsBuffer,blasNodesBuffer:t.blasNodesBuffer,blasTriangleIdsBuffer:t.blasTriangleIdsBuffer,colorHistory:t.colorHistory,metadataHistory:t.metadataHistory}),t.displayWidth=n,t.displayHeight=r,t.presentation=o,t.internalWidth=i,t.internalHeight=a,t.phaseIndex=0,t.historyNeedsReset=!0}recreateTraceGraph(e,t,n){let r=this.createTraceGraph({frameIdentifier:e,internalWidth:t.internalWidth,internalHeight:t.internalHeight,presentation:n,uniformBuffer:t.uniformBuffer,primitiveBuffer:t.primitiveBuffer,triangleBuffer:t.triangleBuffer,lightBuffer:t.lightBuffer,nodeMinimaBuffer:t.nodeMinimaBuffer,nodeMaximaBuffer:t.nodeMaximaBuffer,sortedPrimitiveIdsBuffer:t.sortedPrimitiveIdsBuffer,blasNodesBuffer:t.blasNodesBuffer,blasTriangleIdsBuffer:t.blasTriangleIdsBuffer,colorHistory:t.colorHistory,metadataHistory:t.metadataHistory});t.traceGraph.destroy(),t.traceGraph=r,t.presentation=n}createTextureHistory(e,t,n,r){return new nm(this.device,{id:`${e}-ray-tracing-${t}`,width:n,height:r,format:`rgba16float`,usage:p.SAMPLE|p.STORAGE})}createTopologyGraph(e){let t=new Cp(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-topology`}),n=t.importBuffer({id:`triangles`,byteLength:e.triangleBuffer.byteLength,usage:e.triangleBuffer.usage},e.triangleBuffer),r=Math.max(1,e.topology.triangleCount),i=Math.max(1,e.topology.blasNodeCount),a=Math.max(1,e.topology.blasTriangleIdCount),o=R(t,`triangle-minima`,`float32x3`,r),s=R(t,`triangle-maxima`,`float32x3`,r),c=R(t,`blas-morton-keys`,`uint32`,a),l=R(t,`blas-local-triangle-ids`,`uint32`,a),u=R(t,`blas-sorted-morton-keys`,`uint32`,a),d=H(t,`blas-triangle-ids`,e.blasTriangleIdsBuffer,`uint32`,a),f=R(t,`blas-sorted-minima`,`float32x3`,r),p=R(t,`blas-sorted-maxima`,`float32x3`,r),m=R(t,`blas-node-minima`,`float32x3`,i),h=R(t,`blas-node-maxima`,`float32x3`,i),g=R(t,`blas-node-children`,`uint32x2`,i),_=R(t,`blas-leaf-ids`,`uint32`,a),v=H(t,`blas-nodes`,e.blasNodesBuffer,`float32x4`,i*2),y=Math.max(1,e.topology.geometryLayouts.size),b=R(t,`blas-counts`,`uint32`,y),x=R(t,`blas-overflows`,`uint32`,y);t.addComputePass({id:`${e.frameIdentifier}-build-triangle-bounds`,resources:[{buffer:n,usage:`storage-read`},{buffer:o,usage:`storage-write`},{buffer:s,usage:`storage-write`}],compile:({device:t})=>{let i=new M(t,{id:`${e.frameIdentifier}-triangle-bounds-computation`,source:Hg(fg,{TRIANGLE_COUNT:e.topology.triangleCount}),shaderLayout:{bindings:[{name:`triangles`,type:`read-only-storage`,group:0,location:0},{name:`triangleMinima`,type:`storage`,group:0,location:1},{name:`triangleMaxima`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangles:t(n),triangleMinima:I(o,t),triangleMaxima:I(s,t)}),i.dispatch(e,Math.ceil(r/128))},destroy:()=>i.destroy()}}});let S=[],C=[],w=[];for(let[n,r]of Array.from(e.topology.geometryLayouts.values()).entries()){if(r.triangleCount===0)continue;let i=r.blasLeafCapacity*2-1,a=V(t,o,`float32x3`,r.triangleStart,r.triangleCount),y=V(t,s,`float32x3`,r.triangleStart,r.triangleCount),ee=V(t,c,`uint32`,r.blasTriangleIdStart,r.triangleCount),T=V(t,l,`uint32`,r.blasTriangleIdStart,r.triangleCount),E=V(t,u,`uint32`,r.blasTriangleIdStart,r.triangleCount),te=V(t,d,`uint32`,r.blasTriangleIdStart,r.triangleCount),ne=V(t,f,`float32x3`,r.triangleStart,r.triangleCount),re=V(t,p,`float32x3`,r.triangleStart,r.triangleCount),ie=V(t,m,`float32x3`,r.blasNodeStart,i),ae=V(t,h,`float32x3`,r.blasNodeStart,i),oe=V(t,g,`uint32x2`,r.blasNodeStart,i),se=V(t,_,`uint32`,r.blasTriangleIdStart,r.blasLeafCapacity),ce=V(t,v,`float32x4`,r.blasNodeStart*2,i*2),le=V(t,b,`uint32`,n,1),ue=V(t,x,`uint32`,n,1),de=r.triangleCount<=256;if(r.triangleCount>0){let o=R(t,`blas-${n}-scene-bounds`,`uint32`,6);if(t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-initialize-scene-bounds`,resources:[{buffer:o,usage:`storage-write`}],compile:({device:t})=>{let r=new M(t,{id:`${e.frameIdentifier}-blas-${n}-scene-bounds-initialize-computation`,source:cg,shaderLayout:{bindings:[{name:`sceneBounds`,type:`storage`,group:0,location:0}]}});return{encode:({computePass:e,getBuffer:t})=>{r.setBindings({sceneBounds:I(o,t)}),r.dispatch(e,1)},destroy:()=>r.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-reduce-scene-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:o,usage:`storage-read-write`}],compile:({device:t})=>{let i=new M(t,{id:`${e.frameIdentifier}-blas-${n}-scene-bounds-reduce-computation`,source:Hg(pg,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:L(a),MAXIMA_OFFSET:L(y)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:I(a,t),triangleMaxima:I(y,t),sceneBounds:I(o,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-build-morton-keys`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:ee,usage:`storage-write`},{buffer:T,usage:`storage-write`}],compile:({device:t})=>{let i=new M(t,{id:`${e.frameIdentifier}-blas-${n}-morton-keys-computation`,source:Hg(mg,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:L(a),MAXIMA_OFFSET:L(y),MORTON_KEYS_OFFSET:L(ee),TRIANGLE_IDS_OFFSET:L(T)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`read-only-storage`,group:0,location:2},{name:`mortonKeys`,type:`storage`,group:0,location:3},{name:`triangleIds`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:I(a,t),triangleMaxima:I(y,t),sceneBounds:I(o,t),mortonKeys:I(ee,t),triangleIds:I(T,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}}),de){let e=r.blasTriangleIdStart;S.push({keysOffset:e,valuesOffset:e,outputKeysOffset:e,outputValuesOffset:e,length:r.triangleCount})}else t.add(new Rm({id:`${e.frameIdentifier}-blas-${n}-sort-triangle-morton-keys`,keys:ee,values:T,outputKeys:E,outputValues:te}));let s=()=>{t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:y,usage:`storage-read`},{buffer:te,usage:`storage-read`},{buffer:ne,usage:`storage-write`},{buffer:re,usage:`storage-write`}],compile:({device:t})=>{let i=new M(t,{id:`${e.frameIdentifier}-blas-${n}-gather-sorted-bounds-computation`,source:Hg(hg,{TRIANGLE_COUNT:r.triangleCount,MINIMA_OFFSET:L(a),MAXIMA_OFFSET:L(y),SORTED_TRIANGLE_IDS_OFFSET:L(te),SORTED_MINIMA_OFFSET:L(ne),SORTED_MAXIMA_OFFSET:L(re)}),shaderLayout:{bindings:[{name:`triangleMinima`,type:`read-only-storage`,group:0,location:0},{name:`triangleMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedTriangleIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:e,getBuffer:t})=>{i.setBindings({triangleMinima:I(a,t),triangleMaxima:I(y,t),sortedTriangleIds:I(te,t),sortedMinima:I(ne,t),sortedMaxima:I(re,t)}),i.dispatch(e,Math.ceil(r.triangleCount/128))},destroy:()=>i.destroy()}}})},c=()=>{let i=new _h({id:`${e.frameIdentifier}-blas-${n}-bvh`,minima:ne,maxima:re,leafCapacity:r.blasLeafCapacity,nodeMinima:ie,nodeMaxima:ae,nodeChildren:oe,leafIds:se,count:le,overflow:ue});t.add(i)},l=()=>{t.addComputePass({id:`${e.frameIdentifier}-blas-${n}-pack-nodes`,resources:[{buffer:ie,usage:`storage-read`},{buffer:ae,usage:`storage-read`},{buffer:ce,usage:`storage-write`}],compile:({device:t})=>{let r=new M(t,{id:`${e.frameIdentifier}-blas-${n}-pack-nodes-computation`,source:Hg(gg,{NODE_COUNT:i,NODE_MINIMA_OFFSET:L(ie),NODE_MAXIMA_OFFSET:L(ae),PACKED_NODES_OFFSET:L(ce)}),shaderLayout:{bindings:[{name:`nodeMinima`,type:`read-only-storage`,group:0,location:0},{name:`nodeMaxima`,type:`read-only-storage`,group:0,location:1},{name:`packedNodes`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:e,getBuffer:t})=>{r.setBindings({nodeMinima:I(ie,t),nodeMaxima:I(ae,t),packedNodes:I(ce,t)}),r.dispatch(e,Math.ceil(i/128))},destroy:()=>r.destroy()}}})};if(de){let e=r.blasLeafCapacity<=128;e&&C.push({sourceOffset:r.triangleStart,sourceCount:r.triangleCount,nodeOffset:r.blasNodeStart,leafOffset:r.blasTriangleIdStart,metadataOffset:n,leafCapacity:r.blasLeafCapacity}),w.push({addGatherPass:s,addHierarchyPass:c,addPackPass:l,usesSegmentedHierarchy:e})}else s(),c(),l()}}if(S.length>0){t.add(new ah({id:`${e.frameIdentifier}-blas-sort-triangle-morton-keys`,keys:c,values:l,outputKeys:u,outputValues:d,segments:S}));for(let e of w)e.addGatherPass();C.length>0&&t.add(new Oh({id:`${e.frameIdentifier}-blas-bvh`,minima:f,maxima:p,nodeMinima:m,nodeMaxima:h,nodeChildren:g,leafIds:_,counts:b,overflows:x,segments:C}));for(let e of w)e.usesSegmentedHierarchy||e.addHierarchyPass(),e.addPackPass()}return t.compile()}createAccelerationGraph(e){let t=new Cp(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-acceleration`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`blas-nodes`,byteLength:e.blasNodesBuffer.byteLength,usage:e.blasNodesBuffer.usage},e.blasNodesBuffer),a=R(t,`primitive-minima`,`float32x3`,e.primitiveCapacity),o=R(t,`primitive-maxima`,`float32x3`,e.primitiveCapacity),s=R(t,`scene-bounds`,`uint32`,6),c=R(t,`primitive-morton-keys`,`uint32`,e.primitiveCapacity),l=R(t,`primitive-ids`,`uint32`,e.primitiveCapacity),u=R(t,`sorted-primitive-morton-keys`,`uint32`,e.primitiveCapacity),d=H(t,`sorted-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,e.primitiveCapacity),f=R(t,`sorted-primitive-minima`,`float32x3`,e.primitiveCapacity),p=R(t,`sorted-primitive-maxima`,`float32x3`,e.primitiveCapacity),m=e.leafCapacity*2-1,h=H(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,m),g=H(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,m),_=H(t,`node-children`,e.nodeChildrenBuffer,`uint32x2`,m),v=H(t,`leaf-ids`,e.leafIdsBuffer,`uint32`,e.leafCapacity),y=new _h({id:`${e.frameIdentifier}-ray-tracing-bvh`,minima:f,maxima:p,leafCapacity:e.leafCapacity,nodeMinima:h,nodeMaxima:g,nodeChildren:_,leafIds:v,count:H(t,`bvh-count`,e.bvhCountBuffer,`uint32`,1),overflow:H(t,`bvh-overflow`,e.bvhOverflowBuffer,`uint32`,1)});return t.addComputePass({id:`${e.frameIdentifier}-build-primitive-bounds`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`},{buffer:i,usage:`storage-read`}],compile:({device:t})=>{let s=new M(t,{id:`${e.frameIdentifier}-primitive-bounds-computation`,source:Ih,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`primitiveMinima`,type:`storage`,group:0,location:2},{name:`primitiveMaxima`,type:`storage`,group:0,location:3},{name:`blasNodes`,type:`read-only-storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:c})=>{s.setBindings({uniforms:c(n),primitives:c(r),primitiveMinima:I(a,c),primitiveMaxima:I(o,c),blasNodes:c(i)}),s.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>s.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-initialize-scene-bounds`,resources:[{buffer:s,usage:`storage-write`}],compile:({device:t})=>{let n=new M(t,{id:`${e.frameIdentifier}-scene-bounds-initialize-computation`,source:cg,shaderLayout:{bindings:[{name:`sceneBounds`,type:`storage`,group:0,location:0}]}});return{encode:({computePass:e,getBuffer:t})=>{n.setBindings({sceneBounds:I(s,t)}),n.dispatch(e,1)},destroy:()=>n.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-reduce-scene-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read-write`}],compile:({device:t})=>{let n=new M(t,{id:`${e.frameIdentifier}-scene-bounds-reduce-computation`,source:lg.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`storage`,group:0,location:2}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:I(a,r),primitiveMaxima:I(o,r),sceneBounds:I(s,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-build-morton-keys`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read`},{buffer:c,usage:`storage-write`},{buffer:l,usage:`storage-write`}],compile:({device:t})=>{let n=new M(t,{id:`${e.frameIdentifier}-morton-keys-computation`,source:ug.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sceneBounds`,type:`read-only-storage`,group:0,location:2},{name:`mortonKeys`,type:`storage`,group:0,location:3},{name:`primitiveIds`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:I(a,r),primitiveMaxima:I(o,r),sceneBounds:I(s,r),mortonKeys:I(c,r),primitiveIds:I(l,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),t.add(new Rm({id:`${e.frameIdentifier}-sort-primitive-morton-keys`,keys:c,values:l,outputKeys:u,outputValues:d})),t.addComputePass({id:`${e.frameIdentifier}-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:d,usage:`storage-read`},{buffer:f,usage:`storage-write`},{buffer:p,usage:`storage-write`}],compile:({device:t})=>{let n=new M(t,{id:`${e.frameIdentifier}-gather-sorted-bounds-computation`,source:dg.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedPrimitiveIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:I(a,r),primitiveMaxima:I(o,r),sortedPrimitiveIds:I(d,r),sortedMinima:I(f,r),sortedMaxima:I(p,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),t.add(y),t.compile()}createRefitGraph(e){let t=new Cp(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-refit`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`blas-nodes`,byteLength:e.blasNodesBuffer.byteLength,usage:e.blasNodesBuffer.usage},e.blasNodesBuffer),a=R(t,`primitive-minima`,`float32x3`,e.primitiveCapacity),o=R(t,`primitive-maxima`,`float32x3`,e.primitiveCapacity),s=H(t,`sorted-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,e.primitiveCapacity),c=R(t,`sorted-primitive-minima`,`float32x3`,e.primitiveCapacity),l=R(t,`sorted-primitive-maxima`,`float32x3`,e.primitiveCapacity),u=e.leafCapacity*2-1,d=H(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,u),f=H(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,u),p=H(t,`node-children`,e.nodeChildrenBuffer,`uint32x2`,u),m=H(t,`leaf-ids`,e.leafIdsBuffer,`uint32`,e.leafCapacity),h=new _h({id:`${e.frameIdentifier}-ray-tracing-refit-bvh`,minima:c,maxima:l,leafCapacity:e.leafCapacity,nodeMinima:d,nodeMaxima:f,nodeChildren:p,leafIds:m,count:H(t,`bvh-count`,e.bvhCountBuffer,`uint32`,1),overflow:H(t,`bvh-overflow`,e.bvhOverflowBuffer,`uint32`,1)});return t.addComputePass({id:`${e.frameIdentifier}-refit-primitive-bounds`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:a,usage:`storage-write`},{buffer:o,usage:`storage-write`},{buffer:i,usage:`storage-read`}],compile:({device:t})=>{let s=new M(t,{id:`${e.frameIdentifier}-refit-primitive-bounds-computation`,source:Ih,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`primitiveMinima`,type:`storage`,group:0,location:2},{name:`primitiveMaxima`,type:`storage`,group:0,location:3},{name:`blasNodes`,type:`read-only-storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:c})=>{s.setBindings({uniforms:c(n),primitives:c(r),primitiveMinima:I(a,c),primitiveMaxima:I(o,c),blasNodes:c(i)}),s.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>s.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-refit-gather-sorted-bounds`,resources:[{buffer:a,usage:`storage-read`},{buffer:o,usage:`storage-read`},{buffer:s,usage:`storage-read`},{buffer:c,usage:`storage-write`},{buffer:l,usage:`storage-write`}],compile:({device:t})=>{let n=new M(t,{id:`${e.frameIdentifier}-refit-gather-sorted-bounds-computation`,source:dg.replace(`__PRIMITIVE_CAPACITY__`,String(e.primitiveCapacity)),shaderLayout:{bindings:[{name:`primitiveMinima`,type:`read-only-storage`,group:0,location:0},{name:`primitiveMaxima`,type:`read-only-storage`,group:0,location:1},{name:`sortedPrimitiveIds`,type:`read-only-storage`,group:0,location:2},{name:`sortedMinima`,type:`storage`,group:0,location:3},{name:`sortedMaxima`,type:`storage`,group:0,location:4}]}});return{encode:({computePass:t,getBuffer:r})=>{n.setBindings({primitiveMinima:I(a,r),primitiveMaxima:I(o,r),sortedPrimitiveIds:I(s,r),sortedMinima:I(c,r),sortedMaxima:I(l,r)}),n.dispatch(t,Math.ceil(e.primitiveCapacity/128))},destroy:()=>n.destroy()}}}),t.add(h),t.compile()}createTraceGraph(e){let t=new Cp(this.device,{id:`scene-${e.frameIdentifier}-ray-tracing-trace`}),n=t.importBuffer({id:`uniforms`,byteLength:e.uniformBuffer.byteLength,usage:e.uniformBuffer.usage},e.uniformBuffer),r=t.importBuffer({id:`primitives`,byteLength:e.primitiveBuffer.byteLength,usage:e.primitiveBuffer.usage},e.primitiveBuffer),i=t.importBuffer({id:`triangles`,byteLength:e.triangleBuffer.byteLength,usage:e.triangleBuffer.usage},e.triangleBuffer),a=t.importBuffer({id:`lights`,byteLength:e.lightBuffer.byteLength,usage:e.lightBuffer.usage},e.lightBuffer),o=Math.max(1,Math.floor(e.nodeMinimaBuffer.byteLength/(3*Float32Array.BYTES_PER_ELEMENT))),s=H(t,`node-minima`,e.nodeMinimaBuffer,`float32x3`,o),c=H(t,`node-maxima`,e.nodeMaximaBuffer,`float32x3`,o),l=H(t,`leaf-primitive-ids`,e.sortedPrimitiveIdsBuffer,`uint32`,Math.max(1,Math.floor(e.sortedPrimitiveIdsBuffer.byteLength/Uint32Array.BYTES_PER_ELEMENT))),u=H(t,`blas-nodes`,e.blasNodesBuffer,`float32x4`,Math.max(1,Math.floor(e.blasNodesBuffer.byteLength/(4*Float32Array.BYTES_PER_ELEMENT)))),d=H(t,`blas-triangle-ids`,e.blasTriangleIdsBuffer,`uint32`,Math.max(1,Math.floor(e.blasTriangleIdsBuffer.byteLength/Uint32Array.BYTES_PER_ELEMENT))),f=t.importTexture({id:`history`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:p.SAMPLE|p.STORAGE},e.colorHistory.previousTexture),m=t.importTexture({id:`history-metadata`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:p.SAMPLE|p.STORAGE},e.metadataHistory.previousTexture),h=t.importTexture({id:`output`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:p.SAMPLE|p.STORAGE},e.colorHistory.currentTexture),g=t.importTexture({id:`output-metadata`,format:`rgba16float`,width:e.internalWidth,height:e.internalHeight,usage:p.SAMPLE|p.STORAGE},e.metadataHistory.currentTexture),_=t.createTextureView(f),v=t.createTextureView(m),y=t.createTextureView(h),b=t.createTextureView(g);return t.addComputePass({id:`${e.frameIdentifier}-carry-ray-tracing-history`,resources:[{buffer:n,usage:`uniform`},{texture:_,usage:`sampled`},{texture:v,usage:`sampled`},{texture:y,usage:`storage-write`},{texture:b,usage:`storage-write`}],compile:({device:t})=>{let r=new M(t,{id:`${e.frameIdentifier}-ray-tracing-history-carry-computation`,source:Lh,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`historyImage`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`},{name:`historyMetadata`,type:`texture`,group:0,location:2,sampleType:`unfilterable-float`},{name:`outputImage`,type:`storage`,group:0,location:3,access:`write-only`,format:`rgba16float`},{name:`outputMetadata`,type:`storage`,group:0,location:4,access:`write-only`,format:`rgba16float`}]}});return{encode:({computePass:t,getBuffer:i,getTextureView:a,parameters:o})=>{o.carryWidth!==0&&(r.setBindings({uniforms:i(n),historyImage:a(_),historyMetadata:a(v),outputImage:a(y),outputMetadata:a(b)}),r.dispatch(t,Math.ceil(o.carryWidth/8),Math.ceil(e.internalHeight/8),1))},destroy:()=>r.destroy()}}}),t.addComputePass({id:`${e.frameIdentifier}-trace-rays`,resources:[{buffer:n,usage:`uniform`},{buffer:r,usage:`storage-read`},{buffer:i,usage:`storage-read`},{buffer:a,usage:`storage-read`},{buffer:s,usage:`storage-read`},{buffer:c,usage:`storage-read`},{buffer:l,usage:`storage-read`},{buffer:u,usage:`storage-read`},{buffer:d,usage:`storage-read`},{texture:_,usage:`sampled`},{texture:v,usage:`sampled`},{texture:y,usage:`storage-write`},{texture:b,usage:`storage-write`}],compile:({device:t})=>{let o=new M(t,{id:`${e.frameIdentifier}-ray-tracing-computation`,source:Rh,shaderLayout:{bindings:[{name:`uniforms`,type:`uniform`,group:0,location:0},{name:`primitives`,type:`read-only-storage`,group:0,location:1},{name:`triangles`,type:`read-only-storage`,group:0,location:2},{name:`lights`,type:`read-only-storage`,group:0,location:3},{name:`nodeMinima`,type:`read-only-storage`,group:0,location:4},{name:`nodeMaxima`,type:`read-only-storage`,group:0,location:5},{name:`leafPrimitiveIds`,type:`read-only-storage`,group:0,location:6},{name:`blasNodes`,type:`read-only-storage`,group:0,location:7},{name:`blasTriangleIds`,type:`read-only-storage`,group:0,location:8},{name:`historyImage`,type:`texture`,group:0,location:9,sampleType:`unfilterable-float`},{name:`historyMetadata`,type:`texture`,group:0,location:10,sampleType:`unfilterable-float`},{name:`outputImage`,type:`storage`,group:0,location:11,access:`write-only`,format:`rgba16float`},{name:`outputMetadata`,type:`storage`,group:0,location:12,access:`write-only`,format:`rgba16float`}]}});return{encode:({computePass:t,getBuffer:f,getTextureView:p,parameters:m})=>{o.setBindings({uniforms:f(n),primitives:f(r),triangles:f(i),lights:f(a),nodeMinima:I(s,f),nodeMaxima:I(c,f),leafPrimitiveIds:I(l,f),blasNodes:I(u,f),blasTriangleIds:I(d,f),historyImage:p(_),historyMetadata:p(v),outputImage:p(y),outputMetadata:p(b)}),o.dispatch(t,Math.ceil(m.dispatchWidth/8),Math.ceil(e.internalHeight/8),1)},destroy:()=>o.destroy()}}}),t.addRenderPass({id:`${e.frameIdentifier}-present-ray-tracing`,resources:[{texture:y,usage:`sampled`},...e.presentation.denoiseRadius||e.presentation.debugView!==`color`?[{texture:b,usage:`sampled`}]:[]],compile:({device:t})=>{let n=new ic(t,{id:`${e.frameIdentifier}-ray-tracing-presentation`,source:Vh({toneMapMode:e.presentation.toneMapMode,outputEncoding:e.presentation.outputEncoding,denoiseRadius:e.presentation.denoiseRadius,debugView:e.presentation.debugView}),vertexCount:3,colorAttachmentFormats:[e.presentation.colorFormat],...e.presentation.depthStencilFormat?{depthStencilAttachmentFormat:e.presentation.depthStencilFormat}:{},shaderLayout:{attributes:[],bindings:[{name:`image`,type:`texture`,group:0,location:0,sampleType:`unfilterable-float`},...e.presentation.denoiseRadius||e.presentation.debugView!==`color`?[{name:`metadata`,type:`texture`,group:0,location:1,sampleType:`unfilterable-float`}]:[]]},parameters:{depthWriteEnabled:!1,...e.presentation.depthStencilFormat?{depthCompare:`always`}:{}}});return{getRenderPassProps:({parameters:t})=>({id:`${e.frameIdentifier}-present-ray-tracing`,...t.framebuffer?{framebuffer:t.framebuffer}:{}}),encode:({renderPass:t,getTextureView:r})=>{n.setBindings({image:r(y),...e.presentation.denoiseRadius||e.presentation.debugView!==`color`?{metadata:r(b)}:{}}),n.draw(t)},destroy:()=>n.destroy()}}}),t.compile()}};function vg(e,t){if(t.framebuffer)return[t.framebuffer.width,t.framebuffer.height];if(t.width!==void 0&&t.height!==void 0)return[t.width,t.height];let[n,r]=e.getDefaultCanvasContext().getDrawingBufferSize();return[t.width??n,t.height??r]}function yg(e,t){let n=t.framebuffer?.colorAttachments[0]?.texture.format??e.preferredColorFormat,r=!!(l.getInfo(n).dataType?.startsWith(`float`)||n.endsWith(`ufloat`)),i=t.framebuffer?t.framebuffer.depthStencilAttachment?.texture.format:`depth24plus`;return{colorFormat:n,denoiseRadius:t.denoiseRadius??0,debugView:t.debugView??`color`,...i?{depthStencilFormat:i}:{},toneMapMode:t.toneMapMode??(r?ho.NONE:ho.KHRONOS_PBR_NEUTRAL),outputEncoding:t.outputColorSpace?Number(t.outputColorSpace===`srgb`):Number(!r&&!n.endsWith(`-srgb`))}}function bg(e,t){return e.colorFormat===t.colorFormat&&e.depthStencilFormat===t.depthStencilFormat&&e.toneMapMode===t.toneMapMode&&e.outputEncoding===t.outputEncoding&&e.denoiseRadius===t.denoiseRadius&&e.debugView===t.debugView}function xg(e){return{nodeCount:e.nodeCount,computePassCount:e.computePassCount,coalescedComputeNodeCount:e.coalescedComputeNodeCount,cpuEncodeTimeMilliseconds:e.cpuEncodeTimeMilliseconds}}function Sg(e){let t=e.topology&&xg(e.topology),n=e.acceleration&&xg(e.acceleration),r=e.refit&&xg(e.refit),i=xg(e.trace),a=[t,n,r,i].filter(e=>!!e);return{nodeCount:a.reduce((e,t)=>e+t.nodeCount,0),computePassCount:a.reduce((e,t)=>e+t.computePassCount,0),coalescedComputeNodeCount:a.reduce((e,t)=>e+t.coalescedComputeNodeCount,0),cpuEncodeTimeMilliseconds:a.reduce((e,t)=>e+t.cpuEncodeTimeMilliseconds,0),...t?{topology:t}:{},...n?{acceleration:n}:{},...r?{refit:r}:{},trace:i}}function Cg(e){return Math.max(1,Math.floor(e.primitiveCount*sg))}function wg(e,t,n,r){let i=e.sceneRevisions,a=i?.dirtyInstanceIds;if(n||!r||!i||!a||a.length===0||e.surfaces!==t.retainedSurfaces||t.materialRevision!==i.materials)return;let o=Array.from(new Set(a));if(!(o.length>Cg(t)||o.some(n=>{let r=t.primitivePlacements.get(n);return!r||e.surfaces[r.surfaceIndex]!==r.surface||r.surface.instanceIds?.[r.transformIndex]!==n})))return o}function Tg(e,t){let n=new Set(t);for(let t of e.pendingPreviousTransformInstanceIds){if(n.has(t))continue;let r=e.primitivePlacements.get(t);if(!r)continue;let i=e.previousTransforms.get(r.placementIdentifier);i&&e.primitiveBuffer.write(Float32Array.from(i),(r.primitiveIndex*Uh+52)*Float32Array.BYTES_PER_ELEMENT)}for(let t of n){let n=e.primitivePlacements.get(t);if(!n)continue;let r=n.surface.transforms[n.transformIndex],i=e.previousTransforms.get(n.placementIdentifier)??r,a=new Float32Array(32);a.set(r),a.set(new D(r).invert(),16);let o=n.primitiveIndex*Uh*Float32Array.BYTES_PER_ELEMENT;e.primitiveBuffer.write(a,o),e.primitiveBuffer.write(Float32Array.from(i),o+52*Float32Array.BYTES_PER_ELEMENT),e.previousTransforms.set(n.placementIdentifier,new D(r))}e.pendingPreviousTransformInstanceIds=n,e.previousTransformsNeedCommit=n.size>0}function Eg(e){e.accelerationUpdateMode!==`rebuild`&&(e.accelerationUpdateMode=e.refitsSinceMortonRebuild>=og?`rebuild`:`refit`)}function Dg(e){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.topology}`:JSON.stringify(e.surfaces.map(t=>[t.id,t.geometry.id,t.geometryVersion,t.transforms.length,t.morphWeights,e.primitives?.[t.id]]))}function Og(e,t){return e.sceneRevisions?`${t}:${e.sceneRevisions.materials}`:JSON.stringify([t,e.surfaces.map(t=>[t.material.id,t.material.version,t.material.uniforms,e.primitives?.[t.id]])])}function kg(e){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.transforms}`:JSON.stringify(e.surfaces.map(e=>[e.id,e.transforms.map(e=>Array.from(e)),e.instanceIds]))}function Ag(e,t){return e.sceneRevisions?`${e.sceneRevisions.identity}:${e.sceneRevisions.lights}:${e.emitterSampling??!1}:${e.emitterSelection??`uniform`}`:JSON.stringify([t,e.emitterSampling,e.emitterSelection])}function jg(e,t){let n=e.transportMode===`pbr`&&((e.maxBounces??0)>0||e.emitterSampling===!0),r=(e.temporalReprojection??!0)&&!n?void 0:[Array.from(t),Array.from(e.camera.position)];return JSON.stringify([e.cameraProjection,r,e.background,e.exposure,e.fogColor,e.fogDensity,e.samplesPerPixel,e.samplingSeed,e.imageRegion,e.historySampleLimit,e.maxBounces,e.transportMode,e.emitterSampling,e.emitterSelection,e.progressive,e.shadows,e.temporalReprojection,e.shadowSamplesPerFrame])}function Mg(e,t,n){let r=[],i=new Map,a=0,o=0;for(let s of e){if(t[s.id]?.type===`sphere`)continue;let e=Ig(s);if(i.has(e))continue;let c=Fg(s,n),l=r.length/Wh,u=Ug(Math.max(1,c.triangleCount)),d=u*2-1;for(let e of c.triangles)r.push(e);i.set(e,{triangleStart:l,triangleCount:c.triangleCount,blasNodeStart:a,blasTriangleIdStart:o,blasInternalNodeCount:u-1,blasLeafCapacity:u,bounds:c.bounds}),a+=d,o+=u}return{triangles:Bg(r,Wh),geometryLayouts:i,triangleCount:r.length/Wh,blasNodeCount:a,blasTriangleIdCount:o}}function Ng(e,t,n,r){let i=e.reduce((e,t)=>e+t.transforms.length,0),a=new Float32Array(Math.max(i,1)*Uh),o=new Map,s=new Map,c=[],l=0,u=0;for(let[i,d]of e.entries()){let e=t[d.id],f=e?.type===`sphere`?e.radius:0,p=f>0?void 0:n.get(Ig(d)),m=p?.bounds??[0,0,0,f],h=d.material.uniforms,g=h?.baseColorFactor??[.8,.8,.8,1],_=h?.emissiveFactor??[0,0,0],v=h?.emissiveStrength??1,y=h?.metallicRoughnessValues??[0,.5],b=d.instanceIds;for(let e=0;e<d.transforms.length;e++){let t=d.transforms[e],n=new D(t).invert(),x=b?.[e]??String(e),S=`${d.id}:${x}`,C=r.get(S)??t,w=l*Uh;a.set(t,w),a.set(n,w+16),a[w+32]=g[0],a[w+33]=g[1],a[w+34]=g[2],a[w+35]=g[3]??1,a[w+36]=_[0]*v,a[w+37]=_[1]*v,a[w+38]=_[2]*v,a[w+39]=y[0],a[w+40]=y[1],a[w+41]=f,a[w+42]=p?.triangleStart??0,a[w+43]=p?.triangleCount??0,a[w+44]=m[0],a[w+45]=m[1],a[w+46]=m[2],a[w+47]=m[3],a[w+48]=p?.blasNodeStart??0,a[w+49]=p?.blasTriangleIdStart??0,a[w+50]=p?.blasInternalNodeCount??0,a[w+51]=p?.blasLeafCapacity??0,a.set(C,w+52),a[w+68]=d.material.alphaMode===`MASK`?h?.alphaCutoff??.5:-1,o.set(S,new D(t)),s.set(b?.[e]??S,{surface:d,surfaceIndex:i,transformIndex:e,primitiveIndex:l,placementIdentifier:S}),c.push({surfaceId:d.id,placementId:b?.[e]??S}),l++,u+=p?.triangleCount??0}}return{primitives:a,primitiveCount:i,triangleCount:u,previousTransforms:o,placements:s,pickIdentities:c}}function Pg(e,t,n,r,i,a){let o=Rg(e.primitives);return{primitives:e.primitives,triangles:t,lights:zg(n,r?o:[],i,a),emitterPrimitiveIndices:o,primitiveCount:e.primitiveCount,lightCount:n.length,triangleCount:e.triangleCount}}function Fg(e,t){let n=Ig(e),r=t.get(n);if(r)return r;let i=e.geometry,a=i.attributes.POSITION?.value,o=i.attributes.NORMAL?.value;if(!a||!o)throw Error(`Ray tracing scene geometry requires positions and normals.`);let s=[],c=Lg(i),l=i.indices?.value,u=l?.length??a.length/3;for(let e=0;e+2<u;e+=3){for(let t=0;t<3;t++){let n=Number(l?.[e+t]??e+t)*3;s.push(Number(a[n]),Number(a[n+1]),Number(a[n+2]),0)}for(let t=0;t<3;t++){let n=Number(l?.[e+t]??e+t)*3;s.push(Number(o[n]),Number(o[n+1]),Number(o[n+2]),0)}}let d={triangles:new Float32Array(s),triangleCount:s.length/Wh,bounds:c};return t.set(n,d),d}function Ig(e){return`${e.geometry.id}:${e.geometryVersion??0}`}function Lg(e){let t=e.attributes.POSITION?.value;if(!t||t.length===0)return[0,0,0,0];let n=[1/0,1/0,1/0],r=[-1/0,-1/0,-1/0];for(let e=0;e+2<t.length;e+=3)for(let i=0;i<3;i++){let a=Number(t[e+i]);n[i]=Math.min(n[i],a),r[i]=Math.max(r[i],a)}let i=n.map((e,t)=>(e+r[t])*.5),a=0;for(let e=0;e+2<t.length;e+=3){let n=(Number(t[e])-i[0])**2+(Number(t[e+1])-i[1])**2+(Number(t[e+2])-i[2])**2;a=Math.max(a,n)}return[i[0],i[1],i[2],Math.sqrt(a)+1e-4]}function Rg(e){let t=[];for(let n=0;n<e.length;n+=Uh)(e[n+68]<0||e[n+35]>=e[n+68])&&(e[n+41]>0||e[n+43]>0)&&Math.max(e[n+36],e[n+37],e[n+38])>0&&t.push(n/Uh);return t}function zg(e,t,n,r){let i=[];for(let t of e){let e=t.color??[1,1,1],n=t.intensity??1,r=t.type===`point`||t.type===`spot`?t.position:[0,0,0],a=t.type===`directional`||t.type===`spot`?t.direction:[0,-1,0],o=t.type===`point`||t.type===`spot`?t.attenuation??[1,0,0]:[1,0,0],s=t.type===`ambient`?0:t.type===`directional`?1:t.type===`point`?2:3,c=t.type===`spot`?Math.cos(t.innerConeAngle??.35):1,l=t.type===`spot`?Math.cos(t.outerConeAngle??.5):0;i.push(e[0],e[1],e[2],n,r[0],r[1],r[2],c,a[0],a[1],a[2],s,o[0],o[1],o[2],l)}let a=hf(t,n,r);for(let[e,n]of t.entries())i.push(n,a[e].probability,a[e].cumulative,0,0,0,0,0,0,0,0,4,0,0,0,0);return Bg(i,Kh)}function Bg(e,t){return e.length>0?new Float32Array(e):new Float32Array(t)}function Vg(e){let t=new Float32Array(qh),n=new Uint32Array(t.buffer),r=e.options.background??[.015,.018,.038,1],i=e.options.fogColor??[.025,.035,.075];return t.set(e.inverseViewProjection,0),t.set(e.options.camera.position,16),t[19]=e.options.cameraProjection===`orthographic`?1:0,t.set(r,20),n[24]=e.internalWidth,n[25]=e.internalHeight,n[26]=e.primitiveCount,n[27]=e.lightCount,t[28]=e.options.exposure??1.35,t[29]=e.accumulatedFrameCount,t[30]=e.options.samplesPerPixel??1,t[31]=e.options.shadows??!0?1:0,t.set(i,32),t[35]=e.options.fogDensity??0,n[36]=e.leafCapacity-1,n[37]=e.leafCapacity,n[38]=e.primitiveCapacity,n[39]=e.options.samplingFrameIndex??e.frameIndex,n[40]=e.displayWidth,n[41]=e.displayHeight,n[42]=e.phaseIndex,n[43]=e.phaseCount,t[44]=e.resolutionScale,t[45]=e.directLightCount,t[46]=e.options.shadowSamplesPerFrame??1,t[47]=e.options.temporalReprojection??!0?1:0,t.set(e.previousViewProjection,48),t.set(e.previousCameraPosition,64),t[67]=e.options.progressive??!0?1:0,n[76]=e.emitterCount,n[77]=Number(e.options.emitterSampling??!1),n[78]=Number(e.options.emitterSelection===`power`),n[71]=Number(e.options.transportMode===`pbr`),n[70]=t_(e.options),n[68]=e.options.samplingSeed??0,n[69]=Math.min(8,Math.max(0,Math.floor(e.options.maxBounces??0))),e.options.imageRegion&&(n.set(e.options.imageRegion.offset,72),n.set(e.options.imageRegion.fullSize,74)),t}function V(e,t,n,r,i){return e.createDataView(t.buffer,{format:n,length:i,byteOffset:t.byteOffset+r*t.byteStride})}function H(e,t,n,r,i){let a=e.importBuffer({id:t,byteLength:n.byteLength,usage:n.usage},n);return e.createDataView(a,{format:r,length:i})}function Hg(e,t){let n=e;for(let[e,r]of Object.entries(t))n=n.replaceAll(`__${e}__`,String(r));return n}function Ug(e){return 2**Math.ceil(Math.log2(Math.max(1,e)))}function Wg(e){let t=e.adaptiveResolution??!0,n=Zg(e.minimumResolutionScale??Yh,.125,1),r=Zg(e.resolutionScale??Jh,n,1);return{resolutionScale:r,requestedResolutionScale:r,minimumResolutionScale:n,adaptiveResolution:t,targetFrameTimeMilliseconds:Math.max(1,e.targetFrameTimeMilliseconds??Xh)}}function Gg(e,t){return e.minimumResolutionScale===t.minimumResolutionScale&&e.adaptiveResolution===t.adaptiveResolution&&e.targetFrameTimeMilliseconds===t.targetFrameTimeMilliseconds&&e.requestedResolutionScale===t.requestedResolutionScale?!1:(e.resolutionScale=t.resolutionScale,e.requestedResolutionScale=t.requestedResolutionScale,e.minimumResolutionScale=t.minimumResolutionScale,e.adaptiveResolution=t.adaptiveResolution,e.targetFrameTimeMilliseconds=t.targetFrameTimeMilliseconds,e.phaseCount=1,e.phaseIndex=0,e.overBudgetFrameCount=0,e.underBudgetFrameCount=0,e.averageFrameTimeMilliseconds=void 0,!0)}function Kg(e,t){let n=e.lastRenderTimeMilliseconds;if(e.lastRenderTimeMilliseconds=t,n===void 0)return;let r=t-n;r<=0||r>1e3||(e.averageFrameTimeMilliseconds=e.averageFrameTimeMilliseconds===void 0?r:e.averageFrameTimeMilliseconds*.8+r*.2)}function qg(e,t){if(e.historyNeedsReset){e.phaseCount=1,e.phaseIndex=0,e.overBudgetFrameCount=0,e.underBudgetFrameCount=0;return}if(!e.adaptiveResolution||e.averageFrameTimeMilliseconds===void 0)return;let n=e.averageFrameTimeMilliseconds,r=e.targetFrameTimeMilliseconds;if(n>r*$h?(e.overBudgetFrameCount=Math.min(tg,e.overBudgetFrameCount+1),e.underBudgetFrameCount=0):n<r*eg?(e.underBudgetFrameCount=Math.min(ng,e.underBudgetFrameCount+1),e.overBudgetFrameCount=0):(e.overBudgetFrameCount=0,e.underBudgetFrameCount=0),!(t-e.lastBudgetAdjustmentTimeMilliseconds<Qh)){if(e.overBudgetFrameCount>=tg){let n=Yg(e.resolutionScale,e.minimumResolutionScale,e.requestedResolutionScale,-1);if(n<e.resolutionScale)e.resolutionScale=n,e.historyNeedsReset=!0;else if(e.accumulatedFrameCount>=rg)e.phaseCount=Math.min(4,e.phaseCount*2),e.phaseIndex%=e.phaseCount;else return;e.overBudgetFrameCount=0,e.lastBudgetAdjustmentTimeMilliseconds=t;return}if(e.underBudgetFrameCount>=ng){if(e.phaseCount>1)e.phaseCount=Math.max(1,e.phaseCount/2),e.phaseIndex%=e.phaseCount;else{let t=Yg(e.resolutionScale,e.minimumResolutionScale,e.requestedResolutionScale,1);if(t<=e.resolutionScale){e.underBudgetFrameCount=0;return}e.resolutionScale=t,e.historyNeedsReset=!0}e.underBudgetFrameCount=0,e.lastBudgetAdjustmentTimeMilliseconds=t}}}function Jg(e,t,n){return{width:Math.max(1,Math.ceil(e*n)),height:Math.max(1,Math.ceil(t*n))}}function Yg(e,t,n,r){let i=Xg(t,n),a=i.findIndex(t=>t>=e-1e-4),o=a<0?i.length-1:a;return i[Math.max(0,Math.min(i.length-1,o+r))]}function Xg(e,t){let n=[e,...Zh.filter(n=>n>e&&n<t),t].sort((e,t)=>e-t);return n.filter((e,t)=>t===0||Math.abs(e-n[t-1])>1e-4)}function Zg(e,t,n){return Math.max(t,Math.min(n,Number.isFinite(e)?e:t))}function Qg(e){return Math.max(1,Math.min(16,Math.floor(e.samplesPerPixel??1)))}function $g(e,t,n,r){let i=0;for(let n=0;n<16;n++)i=Math.max(i,Math.abs(Number(e[n])-Number(t[n])));let a=Math.hypot(Number(n[0]??0)-Number(r[0]??0),Number(n[1]??0)-Number(r[1]??0),Number(n[2]??0)-Number(r[2]??0));return i>.75||a>4}function e_(){return globalThis.performance?.now()??Date.now()}function t_(e){return Math.min(256,Math.max(1,Math.floor(e.historySampleLimit??ig)))}function n_(e){let t=[e.uniformBuffer,e.primitiveBuffer,e.triangleBuffer,e.lightBuffer,e.nodeMinimaBuffer,e.nodeMaximaBuffer,e.nodeChildrenBuffer,e.leafIdsBuffer,e.sortedPrimitiveIdsBuffer,e.blasNodesBuffer,e.blasTriangleIdsBuffer,e.bvhCountBuffer,e.bvhOverflowBuffer].reduce((e,t)=>e+t.byteLength,0),n=e.internalWidth*e.internalHeight*32,r=[e.topologyGraph,e.accelerationGraph,e.refitGraph,e.traceGraph].reduce((e,t)=>e+t.stats.physicalTransientResourceBytes,0);return{sceneBufferBytes:t,historyTextureBytes:n,graphTransientBytes:r,totalBytes:t+n+r}}var r_=new D,i_=[1,0,0,0,1,0,0,0,1],a_=[{parameter:`baseColorTexture`,binding:`pbr_baseColorSampler`,enabled:`baseColorMapEnabled`,textureCoordinateSet:`baseColorUVSet`,transform:`baseColorUVTransform`},{parameter:`normalTexture`,binding:`pbr_normalSampler`,enabled:`normalMapEnabled`,textureCoordinateSet:`normalUVSet`,transform:`normalUVTransform`},{parameter:`metallicRoughnessTexture`,binding:`pbr_metallicRoughnessSampler`,enabled:`metallicRoughnessMapEnabled`,textureCoordinateSet:`metallicRoughnessUVSet`,transform:`metallicRoughnessUVTransform`},{parameter:`emissiveTexture`,binding:`pbr_emissiveSampler`,enabled:`emissiveMapEnabled`,textureCoordinateSet:`emissiveUVSet`,transform:`emissiveUVTransform`},{parameter:`occlusionTexture`,binding:`pbr_occlusionSampler`,enabled:`occlusionMapEnabled`,textureCoordinateSet:`occlusionUVSet`,transform:`occlusionUVTransform`},{parameter:`specularColorTexture`,binding:`pbr_specularColorSampler`,enabled:`specularColorMapEnabled`,textureCoordinateSet:`specularColorUVSet`,transform:`specularColorUVTransform`},{parameter:`specularIntensityTexture`,binding:`pbr_specularIntensitySampler`,enabled:`specularIntensityMapEnabled`,textureCoordinateSet:`specularIntensityUVSet`,transform:`specularIntensityUVTransform`},{parameter:`transmissionTexture`,binding:`pbr_transmissionSampler`,enabled:`transmissionMapEnabled`,textureCoordinateSet:`transmissionUVSet`,transform:`transmissionUVTransform`},{parameter:`thicknessTexture`,binding:`pbr_thicknessSampler`,enabled:null,textureCoordinateSet:`thicknessUVSet`,transform:`thicknessUVTransform`},{parameter:`clearcoatTexture`,binding:`pbr_clearcoatSampler`,enabled:`clearcoatMapEnabled`,textureCoordinateSet:`clearcoatUVSet`,transform:`clearcoatUVTransform`},{parameter:`clearcoatRoughnessTexture`,binding:`pbr_clearcoatRoughnessSampler`,enabled:`clearcoatRoughnessMapEnabled`,textureCoordinateSet:`clearcoatRoughnessUVSet`,transform:`clearcoatRoughnessUVTransform`},{parameter:`clearcoatNormalTexture`,binding:`pbr_clearcoatNormalSampler`,enabled:null,textureCoordinateSet:`clearcoatNormalUVSet`,transform:`clearcoatNormalUVTransform`},{parameter:`sheenColorTexture`,binding:`pbr_sheenColorSampler`,enabled:`sheenColorMapEnabled`,textureCoordinateSet:`sheenColorUVSet`,transform:`sheenColorUVTransform`},{parameter:`sheenRoughnessTexture`,binding:`pbr_sheenRoughnessSampler`,enabled:`sheenRoughnessMapEnabled`,textureCoordinateSet:`sheenRoughnessUVSet`,transform:`sheenRoughnessUVTransform`},{parameter:`iridescenceTexture`,binding:`pbr_iridescenceSampler`,enabled:`iridescenceMapEnabled`,textureCoordinateSet:`iridescenceUVSet`,transform:`iridescenceUVTransform`},{parameter:`iridescenceThicknessTexture`,binding:`pbr_iridescenceThicknessSampler`,enabled:null,textureCoordinateSet:`iridescenceThicknessUVSet`,transform:`iridescenceThicknessUVTransform`},{parameter:`anisotropyTexture`,binding:`pbr_anisotropySampler`,enabled:`anisotropyMapEnabled`,textureCoordinateSet:`anisotropyUVSet`,transform:`anisotropyUVTransform`},{parameter:`bumpTexture`,binding:`pbr_bumpSampler`,enabled:`bumpMapEnabled`,textureCoordinateSet:`bumpUVSet`,transform:`bumpUVTransform`},{parameter:`diffuseTransmissionTexture`,binding:`pbr_diffuseTransmissionSampler`,enabled:`diffuseTransmissionMapEnabled`,textureCoordinateSet:`diffuseTransmissionUVSet`,transform:`diffuseTransmissionUVTransform`},{parameter:`diffuseTransmissionColorTexture`,binding:`pbr_diffuseTransmissionColorSampler`,enabled:`diffuseTransmissionColorMapEnabled`,textureCoordinateSet:`diffuseTransmissionColorUVSet`,transform:`diffuseTransmissionColorUVTransform`},{parameter:`multiscatterColorTexture`,binding:`pbr_multiscatterColorSampler`,enabled:`multiscatterColorMapEnabled`,textureCoordinateSet:`multiscatterColorUVSet`,transform:`multiscatterColorUVTransform`}],o_=class{geometries=new Map;materials=new Map;worlds=new Map;makeRenderOptions(e){let t=e.getParameter(`world`),n=e.getParameter(`camera`),r=e.getParameter(`renderer`);if(!t||!n||!r)return null;let[i,a]=l_(e,e.device.device),o=r.getParameter(`ambientRadiance`)??.12,s=r.getParameter(`toneMapMode`),c=r.getParameter(`outputColorSpace`),l=this.worlds.get(t);return l?this.updateCachedWorld(l,o):(l=this.createCachedWorld(t,o),this.worlds.set(t,l)),{id:e.id,surfaces:l.surfaces,sceneRevisions:{...l.revisions},camera:h_(n,i,a),lights:l.lights,background:r.getParameter(`background`)||[.015,.018,.038,1],width:i,height:a,environment:r.getParameter(`environment`),exposure:r.getParameter(`exposure`)??1.35,...s===void 0?{}:{toneMapMode:s},...c===void 0?{}:{outputColorSpace:c},fogColor:r.getParameter(`fogColor`)||[.025,.035,.075],fogDensity:r.getParameter(`fogDensity`)??0,renderMode:r.subtype===`debugNormals`?`debugNormals`:r.subtype===`debugDepth`?`debugDepth`:`default`}}getAnalyticPrimitives(e){let t=this.worlds.get(e);return t||(t=this.createCachedWorld(e,.12),this.worlds.set(e,t)),t.analyticPrimitives}getPickPlacements(e){return this.worlds.get(e)?.pickPlacements??new Map}destroy(){this.geometries.clear(),this.materials.clear(),this.worlds.clear()}createCachedWorld(e,t){let n={world:e,surfaces:[],pickPlacements:new Map,surfaceEntries:[],lights:[],analyticPrimitives:{},ambientRadiance:t,observedCommitRevision:e.device.getSceneCommitRevision(),topologyObjectIds:new Set,lightObjectIds:new Set,instancePlacements:new Map,materialSurfaces:new Map,samplerMaterials:new Map,revisions:{identity:e.id,topology:0,transforms:0,materials:0,lights:0}};return this.rebuildCachedWorld(n,t),n}updateCachedWorld(e,t){let n=e.world.device.getSceneCommitRevision(),r=e.ambientRadiance!==t;if(n===e.observedCommitRevision&&!r)return;let i=e.world.device.getSceneCommitsSince(e.observedCommitRevision),a=i===null,o=r||i===null,s=i===null,c=new Set,l=new Set;for(let t of i??[])if(t.categories.includes(`topology`)&&e.topologyObjectIds.has(t.objectId)&&(a=!0),t.categories.includes(`lights`)&&e.lightObjectIds.has(t.objectId)&&(o=!0,t.categories.includes(`topology`)&&(s=!0)),t.categories.includes(`transforms`)&&e.instancePlacements.has(t.objectId)&&c.add(t.objectId),t.categories.includes(`materials`)){for(let n of e.materialSurfaces.get(t.objectId)??[])l.add(n.material);for(let n of e.samplerMaterials.get(t.objectId)??[])l.add(n)}if(a){this.rebuildCachedWorld(e,t),e.revisions.topology++,e.revisions.lights++,delete e.revisions.dirtyInstanceIds;return}if(c.size>0){let t=new Set;for(let n of c)for(let r of e.instancePlacements.get(n)??[])r.transforms[r.transformIndex]=r.instance.getParameter(`transform`)||r_,t.add(r.instanceId);e.revisions.transforms++,e.revisions.dirtyInstanceIds=Array.from(t)}if(l.size>0){for(let t of l){let n=this.getMaterial(t);for(let r of e.materialSurfaces.get(t.id)??[])r.surface.material=n}this.updateMaterialDependencies(e),e.revisions.materials++}o&&(e.lights=p_(e.world,t),e.ambientRadiance=t,e.revisions.lights++,s&&this.updateLightDependencies(e)),e.observedCommitRevision=n}rebuildCachedWorld(e,t){e.topologyObjectIds.clear(),e.lightObjectIds.clear(),e.instancePlacements.clear(),e.materialSurfaces.clear(),e.samplerMaterials.clear(),e.surfaceEntries=[],e.analyticPrimitives={},e.surfaces=this.makeSceneSurfaces(e),e.lights=p_(e.world,t),this.updateLightDependencies(e),e.ambientRadiance=t,e.observedCommitRevision=e.world.device.getSceneCommitRevision()}makeSceneSurfaces(e){let t=new Map,n=u_(e.world,e);e.pickPlacements=new Map(n.map(e=>[e.instanceId,e]));for(let e of n){let n=t.get(e.surface)||[];n.push(e),t.set(e.surface,n)}let r=[];for(let[n,i]of t){let t=n.getParameter(`geometry`),a=n.getParameter(`material`);if(!t||!a)continue;let o=this.getGeometry(t),s=this.geometries.get(t),c=i.map(e=>e.transform),l={id:n.id,geometry:o,geometryVersion:s.structuralVersion,material:this.getMaterial(a),transforms:c,instanceIds:i.map(e=>e.instanceId),...n.getParameter(`skin`)?{skin:n.getParameter(`skin`)}:{},...t.getParameter(`morphTargets`)?{morphTargets:t.getParameter(`morphTargets`),morphWeights:t.getParameter(`morphWeights`)||[]}:{}};r.push(l),e.topologyObjectIds.add(n.id),e.topologyObjectIds.add(t.id);for(let n of Object.values(t.getParameters()))n instanceof P&&e.topologyObjectIds.add(n.id);let u={source:n,material:a,surface:l};e.surfaceEntries.push(u);let d=e.materialSurfaces.get(a.id)??[];d.push(u),e.materialSurfaces.set(a.id,d),t.subtype===`sphere`&&(e.analyticPrimitives[n.id]={type:`sphere`,radius:t.getParameter(`radius`)??1});for(let[t,n]of i.entries()){if(!n.instance)continue;let r=e.instancePlacements.get(n.instance.id)??[];r.push({instance:n.instance,transforms:c,transformIndex:t,instanceId:n.instanceId}),e.instancePlacements.set(n.instance.id,r)}}return this.updateMaterialDependencies(e),r}updateMaterialDependencies(e){e.samplerMaterials.clear();for(let t of e.surfaceEntries){let n=t.material.getParameters();for(let r of a_){let i=n[r.parameter];if(!i)continue;let a=e.samplerMaterials.get(i.id)??new Set;a.add(t.material),e.samplerMaterials.set(i.id,a)}}}updateLightDependencies(e){let{world:t}=e,n=t.getParameters();e.lightObjectIds.clear(),e.lightObjectIds.add(t.id),n.light instanceof P&&e.lightObjectIds.add(n.light.id);for(let t of f_(n.light,n.lights))e.lightObjectIds.add(t.id);n.instance instanceof P&&e.lightObjectIds.add(n.instance.id);for(let t of f_(n.instance,n.instances)){e.lightObjectIds.add(t.id);let n=t.getParameter(`group`);n instanceof P&&e.lightObjectIds.add(n.id);let r=n instanceof P?n.data:Array.isArray(n)?n:n?[n]:[];for(let t of r){if(!(t instanceof Yl))continue;e.lightObjectIds.add(t.id);let n=t.getParameters();n.light instanceof P&&e.lightObjectIds.add(n.light.id);for(let t of f_(n.light,n.lights))e.lightObjectIds.add(t.id)}}}getMaterial(e){let t=this.materials.get(e);if(t?.version===e.version&&Array.from(t.samplers).every(([e,t])=>e.version===t))return t.material;let n=new Map,r=e.getParameters();for(let e of a_){let t=r[e.parameter];t&&n.set(t,t.version)}let i=c_(e);return this.materials.set(e,{version:e.version,samplers:n,material:i}),i}getGeometry(e){let t=this.geometries.get(e),n=t!==void 0&&Array.from(t.arrayVersions).every(([e,t])=>e.version===t);if(t?.version===e.version&&n)return t.geometry;let r=e.getParameters();if(t&&n&&s_(t.parameters,r))return t.version=e.version,t.parameters=r,t.geometry;let i=g_(e),a=new Map;for(let e of Object.values(r))e instanceof P&&a.set(e,e.version);return this.geometries.set(e,{version:e.version,structuralVersion:Math.max(e.version,(t?.structuralVersion??0)+1),geometry:i,parameters:r,arrayVersions:a}),i}};function s_(e,t){let n=new Set([...Object.keys(e),...Object.keys(t)]);return n.delete(`morphWeights`),Array.from(n).every(n=>{let r=n;return e[r]===t[r]})}function c_(e){let t=e.getParameters(),n=t.baseColor||t.color||[.8,.8,.8],r=t.opacity??(n.length>3?n[3]??1:1),i=t.alphaMode?t.alphaMode.toUpperCase():r<1?`BLEND`:`OPAQUE`,a={...yo.defaultUniforms,unlit:t.unlit??!1,baseColorFactor:[n[0],n[1],n[2],r],metallicRoughnessValues:[e.subtype===`matte`?0:t.metallic??0,e.subtype===`matte`?.92:t.roughness??.38],normalScale:t.normalScale??1,occlusionStrength:t.occlusionStrength??1,emissiveFactor:t.emissive||[0,0,0],emissiveStrength:t.emissiveStrength??1,alphaCutoffEnabled:i===`MASK`,alphaCutoff:t.alphaCutoff??.5,specularColorFactor:t.specularColor||[1,1,1],specularIntensityFactor:t.specularIntensity??1,ior:t.indexOfRefraction??1.5,transmissionFactor:t.transmission??0,diffuseTransmissionFactor:t.diffuseTransmission??0,diffuseTransmissionColorFactor:t.diffuseTransmissionColor||[1,1,1],dispersion:t.dispersion??0,thicknessFactor:t.thickness??0,attenuationDistance:t.attenuationDistance??1e9,attenuationColor:t.attenuationColor||[1,1,1],multiscatterColorFactor:t.multiscatterColor||[0,0,0],scatterAnisotropy:t.scatterAnisotropy??0,clearcoatFactor:t.clearcoat??0,clearcoatRoughnessFactor:t.clearcoatRoughness??.18,sheenColorFactor:t.sheenColor||[0,0,0],sheenRoughnessFactor:t.sheenRoughness??.5,iridescenceFactor:t.iridescence??0,iridescenceIor:t.iridescenceIndexOfRefraction??1.3,iridescenceThicknessRange:[t.iridescenceThicknessMinimum??100,t.iridescenceThicknessMaximum??400],anisotropyStrength:t.anisotropyStrength??0,anisotropyRotation:t.anisotropyRotation??0,anisotropyDirection:t.anisotropyDirection||[1,0],bumpFactor:t.bumpFactor??1},o={};for(let e of a_){let n=t[e.parameter];if(!n)continue;let r=n.getParameter(`image`);r&&(o[e.binding]=r,e.enabled&&(a[e.enabled]=!0),a[e.textureCoordinateSet]=n.getParameter(`textureCoordinateSet`)??0,a[e.transform]=n.getParameter(`transform`)||i_)}return{id:e.id,version:e.version,uniforms:a,bindings:o,alphaMode:i===`MASK`?`MASK`:i===`BLEND`?`BLEND`:`OPAQUE`,doubleSided:t.doubleSided??!0}}function l_(e,t){let n=e.getParameter(`size`);return n?[n[0],n[1]]:t.getDefaultCanvasContext().getDrawingBufferSize()}function u_(e,t){let n=[],r=e.getParameters();t?.topologyObjectIds.add(e.id),t?.lightObjectIds.add(e.id),r.surface instanceof P&&t?.topologyObjectIds.add(r.surface.id),r.instance instanceof P&&(t?.topologyObjectIds.add(r.instance.id),t?.lightObjectIds.add(r.instance.id)),r.light instanceof P&&t?.lightObjectIds.add(r.light.id);for(let e of f_(r.light,r.lights))t?.lightObjectIds.add(e.id);let i=new Map;for(let e of f_(r.surface,r.surfaces)){t?.topologyObjectIds.add(e.id);let r=i.get(e.id)||0;i.set(e.id,r+1),n.push({surface:e,transform:r_,instanceId:r===0?e.id:`${e.id}:${r}`})}let a=new Map;for(let e of f_(r.instance,r.instances))t?.topologyObjectIds.add(e.id),t?.lightObjectIds.add(e.id),d_(e,n,t,a);return n}function d_(e,t,n,r){let i=e.getParameters();i.group instanceof P&&(n?.topologyObjectIds.add(i.group.id),n?.lightObjectIds.add(i.group.id));let a=i.group instanceof P?i.group.data:Array.isArray(i.group)?i.group:i.group?[i.group]:[];for(let o of a){if(!(o instanceof Yl))continue;n?.topologyObjectIds.add(o.id),n?.lightObjectIds.add(o.id);let a=o.getParameters();a.surface instanceof P&&n?.topologyObjectIds.add(a.surface.id),a.light instanceof P&&n?.lightObjectIds.add(a.light.id);for(let e of f_(a.light,a.lights))n?.lightObjectIds.add(e.id);for(let s of f_(a.surface,a.surfaces)){n?.topologyObjectIds.add(s.id);let a=`${e.id}:${o.id}:${s.id}`,c=r.get(a)||0;r.set(a,c+1),t.push({surface:s,transform:i.transform||r_,instanceId:c===0?a:`${a}:${c}`,instance:e})}}}function f_(e,t){let n=e||t||[];if(n instanceof P){let e=n.data;return ArrayBuffer.isView(e)?[]:e.filter(e=>typeof e==`object`&&!!e&&`type`in e)}return Array.from(n)}function p_(e,t){let n=[{type:`ambient`,color:[1,1,1],intensity:t}],r=e.getParameters();for(let e of f_(r.light,r.lights))m_(e,n);for(let e of f_(r.instance,r.instances)){let t=e.getParameter(`group`),r=t instanceof P?t.data:Array.isArray(t)?t:t?[t]:[];for(let e of r){if(!(e instanceof Yl))continue;let t=e.getParameters();for(let e of f_(t.light,t.lights))m_(e,n)}}return n}function m_(e,t){let n=e.getParameters(),r=n.color||[1,1,1];switch(e.subtype){case`ambient`:t.push({type:`ambient`,color:r,intensity:n.radiance??n.intensity??1});break;case`directional`:t.push({type:`directional`,color:r,direction:n.direction||[0,-1,-1],intensity:n.irradiance??n.intensity??1});break;case`point`:t.push({type:`point`,color:r,position:n.position||[0,0,0],intensity:n.intensity??1,attenuation:[1,0,.025]});break;case`spot`:t.push({type:`spot`,color:r,position:n.position||[0,0,0],direction:n.direction||[0,-1,0],intensity:n.intensity??1,attenuation:[1,0,.018],innerConeAngle:n.falloffAngle??(n.openingAngle??.5)*.7,outerConeAngle:n.openingAngle??.5});break}}function h_(e,t,n){let r=e.getParameters(),i=r.position||[0,0,5],a=r.direction||[0,0,-1],o=[i[0]+a[0],i[1]+a[1],i[2]+a[2]],s=r.aspect||t/Math.max(n,1),c=r.near??.05,l=r.far??500;return{projectionMatrix:e.subtype===`orthographic`?new D().ortho({left:-(r.height??12)*s*.5,right:(r.height??12)*s*.5,bottom:-(r.height??12)*.5,top:(r.height??12)*.5,near:c,far:l}):new D().perspective({fovy:r.fovy??Math.PI/3,aspect:s,near:c,far:l}),viewMatrix:new D().lookAt({eye:i,center:o,up:r.up||[0,1,0]}),position:i}}function g_(e){let t=e.getParameters(),n=t.segments??32,r;switch(e.subtype){case`sphere`:r=new xc({radius:t.radius??1,nlat:n,nlong:n*2});break;case`hexPrism`:{let e=en(new Cc({radius:t.radius??1,height:t.height??1,nradial:6,nvertical:1,topCap:!0,bottomCap:!0})),n=e.attributes.POSITION.value;r=new gn({topology:`triangle-list`,attributes:{...e.attributes,NORMAL:{size:3,value:v_(new Float32Array(n))}}});break}case`cylinder`:r=new Cc({radius:t.radius??1,height:t.height??1,nradial:n,nvertical:1,topCap:!0,bottomCap:!0});break;case`ring`:r=new yl({innerRadius:t.innerRadius,outerRadius:t.outerRadius,height:t.height,segments:t.segments,startAngle:t.startAngle,angle:t.angle});break;case`torus`:r=new bc({majorRadius:t.majorRadius,minorRadius:t.minorRadius,majorSegments:t.majorSegments,minorSegments:t.minorSegments,arc:t.arc});break;case`cone`:r=new wc({radius:t.radius??1,height:t.height??1,nradial:n,nvertical:1,cap:!0});break;case`quad`:r=new Tc({type:`x,z`,xlen:t.width??1,zlen:t.height??t.width??1,flipCull:!0});break;case`triangle`:{let e=__(t[`vertex.position`]),n=__(t[`vertex.normal`]),i=__(t[`vertex.tangent`]),a=__(t[`vertex.joint`]),o=__(t[`vertex.weight`]),s=__(t[`vertex.attribute1`]),c=__(t[`vertex.attribute2`]),l=__(t[`primitive.index`]);if(!(e instanceof Float32Array))throw Error(`Triangle geometry requires vertex.position`);r=new gn({topology:`triangle-list`,attributes:{POSITION:{size:3,value:e},NORMAL:{size:3,value:n instanceof Float32Array?n:v_(e)},...i instanceof Float32Array?{TANGENT:{size:4,value:i}}:{},...a instanceof Uint8Array||a instanceof Uint16Array||a instanceof Uint32Array?{JOINTS_0:{size:4,value:a}}:{},...o instanceof Float32Array?{WEIGHTS_0:{size:4,value:o}}:{},TEXCOORD_0:{size:2,value:s instanceof Float32Array?s:new Float32Array(e.length/3*2)},...c instanceof Float32Array?{TEXCOORD_1:{size:2,value:c}}:{}},indices:l instanceof Uint16Array||l instanceof Uint32Array?l:void 0});break}}let i=r.attributes.POSITION?.value,a=i?i.length/3:r.vertexCount,o=__(t[`vertex.attribute0`]),s=o instanceof Float32Array?o:new Float32Array(a*3).fill(1),c=s.length===a*4?4:3,l=r.attributes.TEXCOORD_0?.value;return new gn({topology:r.topology||`triangle-list`,attributes:{...r.attributes,COLOR_0:{size:c,value:s},TEXCOORD_0:{size:2,value:l instanceof Float32Array?l:new Float32Array(a*2)}},indices:r.indices})}function __(e){return e instanceof P?e.data:e}function v_(e){let t=new Float32Array(e.length);for(let n=0;n<e.length;n+=9){let r=e[n+3]-e[n],i=e[n+4]-e[n+1],a=e[n+5]-e[n+2],o=e[n+6]-e[n],s=e[n+7]-e[n+1],c=e[n+8]-e[n+2],l=i*c-a*s,u=a*o-r*c,d=r*s-i*o,f=Math.hypot(l,u,d)||1;for(let e=0;e<3;e++)t[n+e*3]=l/f,t[n+e*3+1]=u/f,t[n+e*3+2]=d/f}return t}var y_=class{adapter=new o_;renderer;framePlacements=new Map;constructor(e){this.renderer=new _g(e)}render(e){let t=this.adapter.makeRenderOptions(e),n=e.getParameter(`world`),r=e.getParameter(`camera`),i=e.getParameter(`renderer`);if(!t||!n||!r||!i)return{surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};let a=this.adapter.getAnalyticPrimitives(n);return this.framePlacements.set(e.id,this.adapter.getPickPlacements(n)),this.renderer.render({...t,primitives:a,cameraProjection:r.subtype,samplesPerPixel:i.getParameter(`samplesPerPixel`),samplingSeed:i.getParameter(`samplingSeed`),historySampleLimit:i.getParameter(`historySampleLimit`),denoiseRadius:i.getParameter(`denoiseRadius`),debugView:i.getParameter(`debugView`),maxBounces:i.getParameter(`maxBounces`),transportMode:i.getParameter(`transportMode`),emitterSampling:i.getParameter(`emitterSampling`),emitterSelection:i.getParameter(`emitterSelection`),progressive:i.getParameter(`progressive`),shadows:i.getParameter(`shadows`),resolutionScale:i.getParameter(`resolutionScale`),minimumResolutionScale:i.getParameter(`minimumResolutionScale`),adaptiveResolution:i.getParameter(`adaptiveResolution`),targetFrameTimeMilliseconds:i.getParameter(`targetFrameTimeMilliseconds`),temporalReprojection:i.getParameter(`temporalReprojection`),shadowSamplesPerFrame:i.getParameter(`shadowSamplesPerFrame`)})}async pick(e,t,n){let r=this.framePlacements.get(e.id);if(!r)return null;let i=await this.renderer.pick(e.id,t,n),a=i?r.get(i.placementId):void 0;return i&&a?{surface:a.surface,...a.instance?{instance:a.instance}:{},placementId:i.placementId,position:i.position,normal:i.normal,distance:i.distance}:null}captureChannels(e){let t=this.framePlacements.get(e.id);if(!t)return null;let n=this.renderer.captureChannels(e.id);return n?{...n,identifiers:n.identifiers.map(e=>{let n=t.get(e.placementId);return{surface:n.surface,...n.instance?{instance:n.instance}:{},placementId:e.placementId}})}:null}destroyFrame(e){this.framePlacements.delete(e.id),this.renderer.destroyFrame(e.id)}destroy(){this.framePlacements.clear(),this.renderer.destroy(),this.adapter.destroy()}},b_=24,x_={minFilter:`linear`,magFilter:`linear`},S_={name:`bloomExtract`,source:`
struct bloomExtractUniforms {
  threshold: f32,
  softKnee: f32,
  fireflyReduction: f32,
  exposure: f32,
  exposureCompensation: f32,
};

@group(0) @binding(auto) var<uniform> bloomExtract: bloomExtractUniforms;

fn bloomExtract_applyThreshold(sourceColor: vec4f) -> vec4f {
  let luminance = dot(sourceColor.rgb, vec3f(0.2126, 0.7152, 0.0722));
  let exposure = max(bloomExtract.exposure * exp2(bloomExtract.exposureCompensation), 0.0001);
  let threshold = bloomExtract.threshold / exposure;
  let knee = max(threshold * bloomExtract.softKnee, 0.00001);
  let soft = clamp((luminance - threshold + knee) / (2.0 * knee), 0.0, 1.0);
  let softContribution = soft * soft * knee;
  let hardContribution = max(luminance - threshold, 0.0);
  let bloomContribution = max(hardContribution, softContribution) / max(luminance, 0.00001);
  return vec4f(sourceColor.rgb * bloomContribution, sourceColor.a * bloomContribution);
}

fn bloomExtract_loadColor(sourceTexture: texture_2d<f32>, coordinate: vec2i) -> vec4f {
  let maximumCoordinate = vec2i(textureDimensions(sourceTexture)) - vec2i(1);
  return textureLoad(sourceTexture, clamp(coordinate, vec2i(0), maximumCoordinate), 0);
}

fn bloomExtract_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceDimensions = vec2i(textureDimensions(sourceTexture));
  let sourceCenter = texCoord * vec2f(sourceDimensions) - vec2f(0.5);
  let sourceFootprint = max(
    (abs(dpdx(texCoord)) + abs(dpdy(texCoord))) * vec2f(sourceDimensions),
    vec2f(1.0)
  );
  let filterRadius = max(sourceFootprint, vec2f(2.0));
  let minimumCoordinate = vec2i(floor(sourceCenter - filterRadius)) + vec2i(1);
  let maximumCoordinate = vec2i(ceil(sourceCenter + filterRadius)) - vec2i(1);
  var color = vec4f(0.0);
  var totalWeight = 0.0;

  // The tent radius follows the actual source-to-target ratio so reduced-resolution pyramids do
  // not leave unsampled bands. At the default half resolution this is the original 4x4 tent.
  for (var sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY += 1) {
    let weightY = max(1.0 - abs(f32(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (var sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX += 1) {
      let weightX = max(1.0 - abs(f32(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      let sourceColor = bloomExtract_loadColor(
        sourceTexture,
        vec2i(sourceX, sourceY)
      );
      let luminance = dot(sourceColor.rgb, vec3f(0.2126, 0.7152, 0.0722));
      let fireflyWeight = mix(
        1.0,
        1.0 / (1.0 + max(luminance, 0.0)),
        clamp(bloomExtract.fireflyReduction, 0.0, 1.0)
      );
      let weight = weightX * weightY * fireflyWeight;
      color += bloomExtract_applyThreshold(sourceColor) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,fs:`
layout(std140) uniform bloomExtractUniforms {
  float threshold;
  float softKnee;
  float fireflyReduction;
  float exposure;
  float exposureCompensation;
} bloomExtract;

vec4 bloomExtract_applyThreshold(vec4 sourceColor) {
  float luminance = dot(sourceColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float exposure = max(bloomExtract.exposure * exp2(bloomExtract.exposureCompensation), 0.0001);
  float threshold = bloomExtract.threshold / exposure;
  float knee = max(threshold * bloomExtract.softKnee, 0.00001);
  float soft = clamp((luminance - threshold + knee) / (2.0 * knee), 0.0, 1.0);
  float softContribution = soft * soft * knee;
  float hardContribution = max(luminance - threshold, 0.0);
  float bloomContribution = max(hardContribution, softContribution) / max(luminance, 0.00001);
  return vec4(sourceColor.rgb * bloomContribution, sourceColor.a * bloomContribution);
}

vec4 bloomExtract_loadColor(sampler2D sourceTexture, ivec2 coordinate) {
  ivec2 maximumCoordinate = textureSize(sourceTexture, 0) - ivec2(1);
  return texelFetch(sourceTexture, clamp(coordinate, ivec2(0), maximumCoordinate), 0);
}

vec4 bloomExtract_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  ivec2 sourceDimensions = textureSize(sourceTexture, 0);
  vec2 sourceCenter = texCoord * vec2(sourceDimensions) - vec2(0.5);
  vec2 sourceFootprint = max(
    (abs(dFdx(texCoord)) + abs(dFdy(texCoord))) * vec2(sourceDimensions),
    vec2(1.0)
  );
  vec2 filterRadius = max(sourceFootprint, vec2(2.0));
  ivec2 minimumCoordinate = ivec2(floor(sourceCenter - filterRadius)) + ivec2(1);
  ivec2 maximumCoordinate = ivec2(ceil(sourceCenter + filterRadius)) - ivec2(1);
  vec4 color = vec4(0.0);
  float totalWeight = 0.0;

  // Keep this kernel identical to the WGSL path so WebGL and WebGPU conserve the same energy.
  for (int sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY++) {
    float weightY = max(1.0 - abs(float(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (int sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX++) {
      float weightX = max(1.0 - abs(float(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      vec4 sourceColor = bloomExtract_loadColor(
        sourceTexture,
        ivec2(sourceX, sourceY)
      );
      float luminance = dot(sourceColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      float fireflyWeight = mix(
        1.0,
        1.0 / (1.0 + max(luminance, 0.0)),
        clamp(bloomExtract.fireflyReduction, 0.0, 1.0)
      );
      float weight = weightX * weightY * fireflyWeight;
      color += bloomExtract_applyThreshold(sourceColor) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,uniformTypes:{threshold:`f32`,softKnee:`f32`,fireflyReduction:`f32`,exposure:`f32`,exposureCompensation:`f32`},defaultUniforms:{threshold:.8,softKnee:.5,fireflyReduction:0,exposure:1,exposureCompensation:0},propTypes:{threshold:{value:.8,min:0,max:1},softKnee:{value:.5,min:0,max:1},fireflyReduction:{value:0,min:0,max:1},exposure:{value:1,min:1e-4,softMax:8},exposureCompensation:{value:0,min:-8,max:8}},passes:[{sampler:!0}]},C_={name:`bloomDownsample`,source:`
fn bloomDownsample_loadColor(sourceTexture: texture_2d<f32>, coordinate: vec2i) -> vec4f {
  let maximumCoordinate = vec2i(textureDimensions(sourceTexture)) - vec2i(1);
  return textureLoad(sourceTexture, clamp(coordinate, vec2i(0), maximumCoordinate), 0);
}

fn bloomDownsample_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceDimensions = vec2i(textureDimensions(sourceTexture));
  let sourceCenter = texCoord * vec2f(sourceDimensions) - vec2f(0.5);
  let sourceFootprint = max(
    (abs(dpdx(texCoord)) + abs(dpdy(texCoord))) * vec2f(sourceDimensions),
    vec2f(1.0)
  );
  let filterRadius = max(sourceFootprint, vec2f(2.0));
  let minimumCoordinate = vec2i(floor(sourceCenter - filterRadius)) + vec2i(1);
  let maximumCoordinate = vec2i(ceil(sourceCenter + filterRadius)) - vec2i(1);
  var color = vec4f(0.0);
  var totalWeight = 0.0;

  for (var sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY += 1) {
    let weightY = max(1.0 - abs(f32(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (var sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX += 1) {
      let weightX = max(1.0 - abs(f32(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      let weight = weightX * weightY;
      color += bloomDownsample_loadColor(
        sourceTexture,
        vec2i(sourceX, sourceY)
      ) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,fs:`
vec4 bloomDownsample_loadColor(sampler2D sourceTexture, ivec2 coordinate) {
  ivec2 maximumCoordinate = textureSize(sourceTexture, 0) - ivec2(1);
  return texelFetch(sourceTexture, clamp(coordinate, ivec2(0), maximumCoordinate), 0);
}

vec4 bloomDownsample_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  ivec2 sourceDimensions = textureSize(sourceTexture, 0);
  vec2 sourceCenter = texCoord * vec2(sourceDimensions) - vec2(0.5);
  vec2 sourceFootprint = max(
    (abs(dFdx(texCoord)) + abs(dFdy(texCoord))) * vec2(sourceDimensions),
    vec2(1.0)
  );
  vec2 filterRadius = max(sourceFootprint, vec2(2.0));
  ivec2 minimumCoordinate = ivec2(floor(sourceCenter - filterRadius)) + ivec2(1);
  ivec2 maximumCoordinate = ivec2(ceil(sourceCenter + filterRadius)) - ivec2(1);
  vec4 color = vec4(0.0);
  float totalWeight = 0.0;

  for (int sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY++) {
    float weightY = max(1.0 - abs(float(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (int sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX++) {
      float weightX = max(1.0 - abs(float(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      float weight = weightX * weightY;
      color += bloomDownsample_loadColor(
        sourceTexture,
        ivec2(sourceX, sourceY)
      ) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,passes:[{sampler:!0}]},w_={name:`bloomBlur`,source:`
const BLOOM_BLUR_MAX_RADIUS = ${b_}.0;
const BLOOM_BLUR_MAX_PAIRS = ${Math.ceil(b_/2)};

struct bloomBlurUniforms {
  radius: f32,
  delta: vec2f,
};

@group(0) @binding(auto) var<uniform> bloomBlur: bloomBlurUniforms;

fn bloomBlur_applySample(color: vec4f) -> vec4f {
  return color;
}

fn bloomBlur_getEffectiveRadius() -> f32 {
  return clamp(bloomBlur.radius, 0.0, BLOOM_BLUR_MAX_RADIUS);
}

fn bloomBlur_getSigma(radius: f32) -> f32 {
  return max(radius / 3.0, 0.00001);
}

fn bloomBlur_getWeight(offset: f32, sigma: f32) -> f32 {
  let normalizedOffset = offset / sigma;
  return exp(-0.5 * normalizedOffset * normalizedOffset);
}

fn bloomBlur_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let effectiveRadius = bloomBlur_getEffectiveRadius();
  if (effectiveRadius <= 0.0) {
    return textureSample(sourceTexture, sourceTextureSampler, texCoord);
  }

  let adjustedDelta = bloomBlur.delta / texSize;
  let sigma = bloomBlur_getSigma(effectiveRadius);
  let centerWeight = bloomBlur_getWeight(0.0, sigma);

  var color = vec4f(0.0);
  var totalWeight = centerWeight;

  let centerColor = bloomBlur_applySample(
    textureSample(sourceTexture, sourceTextureSampler, texCoord)
  );
  color += centerColor * centerWeight;

  for (var pairIndex = 0; pairIndex < BLOOM_BLUR_MAX_PAIRS; pairIndex += 1) {
    let firstOffset = f32(pairIndex * 2 + 1);
    if (firstOffset > effectiveRadius) {
      continue;
    }

    let secondOffset = firstOffset + 1.0;
    let firstWeight = bloomBlur_getWeight(firstOffset, sigma);
    let secondWeight =
      select(0.0, bloomBlur_getWeight(secondOffset, sigma), secondOffset <= effectiveRadius);
    let combinedWeight = firstWeight + secondWeight;
    let combinedOffset =
      (firstOffset * firstWeight + secondOffset * secondWeight) / max(combinedWeight, 0.00001);

    let positiveColor = bloomBlur_applySample(
      textureSample(sourceTexture, sourceTextureSampler, texCoord + adjustedDelta * combinedOffset)
    );
    let negativeColor = bloomBlur_applySample(
      textureSample(sourceTexture, sourceTextureSampler, texCoord - adjustedDelta * combinedOffset)
    );

    color += (positiveColor + negativeColor) * combinedWeight;
    totalWeight += combinedWeight * 2.0;
  }

  return color / totalWeight;
}
`,fs:`
#define BLOOM_BLUR_MAX_RADIUS ${b_}.0
#define BLOOM_BLUR_MAX_PAIRS ${Math.ceil(b_/2)}

layout(std140) uniform bloomBlurUniforms {
  float radius;
  vec2 delta;
} bloomBlur;

vec4 bloomBlur_applySample(vec4 color) {
  return color;
}

float bloomBlur_getEffectiveRadius() {
  return clamp(bloomBlur.radius, 0.0, BLOOM_BLUR_MAX_RADIUS);
}

float bloomBlur_getSigma(float radius) {
  return max(radius / 3.0, 0.00001);
}

float bloomBlur_getWeight(float offset, float sigma) {
  float normalizedOffset = offset / sigma;
  return exp(-0.5 * normalizedOffset * normalizedOffset);
}

vec4 bloomBlur_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  float effectiveRadius = bloomBlur_getEffectiveRadius();
  if (effectiveRadius <= 0.0) {
    return texture(sourceTexture, texCoord);
  }

  vec2 adjustedDelta = bloomBlur.delta / texSize;
  float sigma = bloomBlur_getSigma(effectiveRadius);
  float centerWeight = bloomBlur_getWeight(0.0, sigma);

  vec4 color = vec4(0.0);
  float totalWeight = centerWeight;

  vec4 centerColor = bloomBlur_applySample(texture(sourceTexture, texCoord));
  color += centerColor * centerWeight;

  for (int pairIndex = 0; pairIndex < BLOOM_BLUR_MAX_PAIRS; pairIndex++) {
    float firstOffset = float(pairIndex * 2 + 1);
    if (firstOffset > effectiveRadius) {
      continue;
    }

    float secondOffset = firstOffset + 1.0;
    float firstWeight = bloomBlur_getWeight(firstOffset, sigma);
    float secondWeight = secondOffset <= effectiveRadius ? bloomBlur_getWeight(secondOffset, sigma) : 0.0;
    float combinedWeight = firstWeight + secondWeight;
    float combinedOffset =
      (firstOffset * firstWeight + secondOffset * secondWeight) / max(combinedWeight, 0.00001);

    vec4 positiveColor = bloomBlur_applySample(texture(sourceTexture, texCoord + adjustedDelta * combinedOffset));
    vec4 negativeColor = bloomBlur_applySample(texture(sourceTexture, texCoord - adjustedDelta * combinedOffset));
    color += (positiveColor + negativeColor) * combinedWeight;
    totalWeight += combinedWeight * 2.0;
  }

  color /= totalWeight;
  return color;
}
`,uniformTypes:{radius:`f32`,delta:`vec2<f32>`},propTypes:{radius:{value:8,min:0,max:b_,softMax:b_},delta:{value:[1,0],private:!0}},passes:[{sampler:!0}]},T_={name:`bloomCompositeShaderPass`,renderTargets:{extractHalf:{scale:[.5,.5],sampler:x_},blurHalfScratch:{scale:[.5,.5],sampler:x_},blurHalf:{scale:[.5,.5],sampler:x_},extractQuarter:{scale:[.25,.25],sampler:x_},blurQuarterScratch:{scale:[.25,.25],sampler:x_},blurQuarter:{scale:[.25,.25],sampler:x_},extractEighth:{scale:[.125,.125],sampler:x_},blurEighthScratch:{scale:[.125,.125],sampler:x_},blurEighth:{scale:[.125,.125],sampler:x_}},steps:[{shaderPass:S_,inputs:{sourceTexture:`previous`},output:`extractHalf`,uniforms:{threshold:.8}},{shaderPass:w_,inputs:{sourceTexture:`extractHalf`},output:`blurHalfScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:w_,inputs:{sourceTexture:`blurHalfScratch`},output:`blurHalf`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:C_,inputs:{sourceTexture:`extractHalf`},output:`extractQuarter`},{shaderPass:w_,inputs:{sourceTexture:`extractQuarter`},output:`blurQuarterScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:w_,inputs:{sourceTexture:`blurQuarterScratch`},output:`blurQuarter`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:C_,inputs:{sourceTexture:`extractQuarter`},output:`extractEighth`},{shaderPass:w_,inputs:{sourceTexture:`extractEighth`},output:`blurEighthScratch`,uniforms:{radius:8,delta:[1,0]}},{shaderPass:w_,inputs:{sourceTexture:`blurEighthScratch`},output:`blurEighth`,uniforms:{radius:8,delta:[0,1]}},{shaderPass:{name:`bloomComposite`,source:`
struct bloomCompositeUniforms {
  intensity: f32,
};

@group(0) @binding(auto) var<uniform> bloomComposite: bloomCompositeUniforms;
@group(0) @binding(auto) var glowHalf: texture_2d<f32>;
@group(0) @binding(auto) var glowHalfSampler: sampler;
@group(0) @binding(auto) var glowQuarter: texture_2d<f32>;
@group(0) @binding(auto) var glowQuarterSampler: sampler;
@group(0) @binding(auto) var glowEighth: texture_2d<f32>;
@group(0) @binding(auto) var glowEighthSampler: sampler;

fn bloomComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let halfGlow = textureSample(glowHalf, glowHalfSampler, texCoord).rgb;
  let quarterGlow = textureSample(glowQuarter, glowQuarterSampler, texCoord).rgb;
  let eighthGlow = textureSample(glowEighth, glowEighthSampler, texCoord).rgb;
  let glowColor = halfGlow * 0.50 + quarterGlow * 0.32 + eighthGlow * 0.18;
  return vec4f(sourceColor.rgb + glowColor * bloomComposite.intensity, sourceColor.a);
}
`,fs:`
layout(std140) uniform bloomCompositeUniforms {
  float intensity;
} bloomComposite;

uniform sampler2D glowHalf;
uniform sampler2D glowQuarter;
uniform sampler2D glowEighth;

vec4 bloomComposite_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 sourceColor = texture(sourceTexture, texCoord);
  vec3 halfGlow = texture(glowHalf, texCoord).rgb;
  vec3 quarterGlow = texture(glowQuarter, texCoord).rgb;
  vec3 eighthGlow = texture(glowEighth, texCoord).rgb;
  vec3 glowColor = halfGlow * 0.50 + quarterGlow * 0.32 + eighthGlow * 0.18;
  return vec4(sourceColor.rgb + glowColor * bloomComposite.intensity, sourceColor.a);
}
`,bindingLayout:[{name:`glowHalf`,group:0},{name:`glowQuarter`,group:0},{name:`glowEighth`,group:0}],uniforms:{},bindings:{},uniformTypes:{intensity:`f32`},propTypes:{intensity:{value:1,min:0,softMax:3}},passes:[{sampler:!0}]},inputs:{sourceTexture:`previous`,glowHalf:`blurHalf`,glowQuarter:`blurQuarter`,glowEighth:`blurEighth`},output:`previous`,uniforms:{intensity:1}}]},E_={name:`advancedCopy`,source:`fn advancedCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f { return textureSample(sourceTexture, sourceTextureSampler, texCoord); }`,passes:[{sampler:!0}]},D_=`
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
`,O_=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],k_={name:`cameraReprojectionTaaResolve`,source:`\
${D_}
const CAMERA_REPROJECTION_TAA_EPSILON: f32 = 0.00001;

struct CameraReprojectionTaaResolveUniforms {
  inverseViewProjectionMatrix: mat4x4f,
  previousViewProjectionMatrix: mat4x4f,
  historyWeight: f32,
  depthThreshold: f32,
  currentJitter: vec2f,
  previousJitter: vec2f,
};

@group(0) @binding(auto) var<uniform> cameraReprojectionTaaResolve:
  CameraReprojectionTaaResolveUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;

fn cameraReprojectionTaaResolve_previousFrameCoordinate(
  texCoord: vec2f,
  depth: f32
) -> vec4f {
  let unjitteredCoordinate = texCoord - cameraReprojectionTaaResolve.currentJitter;
  if (any(unjitteredCoordinate < vec2f(0.0)) ||
      any(unjitteredCoordinate > vec2f(1.0))) {
    return vec4f(0.0);
  }

  let currentClip = temporal_getClipPosition(unjitteredCoordinate, depth);
  let worldPositionHomogeneous =
    cameraReprojectionTaaResolve.inverseViewProjectionMatrix * currentClip;
  if (abs(worldPositionHomogeneous.w) <= CAMERA_REPROJECTION_TAA_EPSILON) {
    return vec4f(0.0);
  }

  let worldPosition = worldPositionHomogeneous.xyz / worldPositionHomogeneous.w;
  let previousClip =
    cameraReprojectionTaaResolve.previousViewProjectionMatrix * vec4f(worldPosition, 1.0);
  return temporal_getPreviousFrame(previousClip,
    cameraReprojectionTaaResolve.previousJitter, CAMERA_REPROJECTION_TAA_EPSILON);
}

fn cameraReprojectionTaaResolve_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let currentColor = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let currentDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (currentDepth >= 0.99999) {
    return currentColor;
  }

  let previousFrame = cameraReprojectionTaaResolve_previousFrameCoordinate(
    texCoord,
    currentDepth
  );
  if (previousFrame.w < 0.5) {
    return currentColor;
  }

  let bounds = temporal_getColorBounds(sourceTexture, sourceTextureSampler, texCoord, currentColor);
  let footprint = temporal_getHistoryFootprint(previousFrame.xy, textureDimensions(historyTexture));
  var accumulatedHistoryColor = vec3f(0.0);
  var accumulatedHistoryWeight = 0.0;
  for (var tapY: i32 = 0; tapY <= 1; tapY++) {
    for (var tapX: i32 = 0; tapX <= 1; tapX++) {
      let tap = temporal_getHistoryTap(footprint, vec2i(tapX, tapY));
      let tapDepth = textureLoad(previousDepthTexture, tap.coordinate, 0).r;
      let validTapDepth =
        abs(tapDepth - previousFrame.z) <= cameraReprojectionTaaResolve.depthThreshold;
      let tapWeight = select(0.0, tap.weight, validTapDepth);
      accumulatedHistoryColor += textureLoad(historyTexture, tap.coordinate, 0).rgb * tapWeight;
      accumulatedHistoryWeight += tapWeight;
    }
  }

  if (accumulatedHistoryWeight <= CAMERA_REPROJECTION_TAA_EPSILON) {
    return currentColor;
  }

  let historyColor = accumulatedHistoryColor / accumulatedHistoryWeight;
  let clampedHistoryColor = clamp(historyColor, bounds.minimum.rgb, bounds.maximum.rgb);
  let resolvedColor = mix(
    currentColor.rgb,
    clampedHistoryColor,
    cameraReprojectionTaaResolve.historyWeight
  );
  return vec4f(resolvedColor, currentColor.a);
}`,bindingLayout:[{name:`historyTexture`,group:0},{name:`depthTexture`,group:0},{name:`previousDepthTexture`,group:0}],props:{},uniforms:{},bindings:{},uniformTypes:{inverseViewProjectionMatrix:`mat4x4<f32>`,previousViewProjectionMatrix:`mat4x4<f32>`,historyWeight:`f32`,depthThreshold:`f32`,currentJitter:`vec2<f32>`,previousJitter:`vec2<f32>`},propTypes:{inverseViewProjectionMatrix:{value:O_,private:!0},previousViewProjectionMatrix:{value:O_,private:!0},historyWeight:{value:.9,min:0,max:.98},depthThreshold:{value:.0025,min:1e-5,softMax:.05},currentJitter:{value:[0,0],private:!0},previousJitter:{value:[0,0],private:!0}},passes:[{sampler:!0}]},A_={name:`cameraReprojectionTaaDepthHistoryCopy`,source:`@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn cameraReprojectionTaaDepthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  return vec4f(depth, 0.0, 0.0, 1.0);
}`,bindingLayout:[{name:`depthTexture`,group:0}],passes:[{sampler:!0}]};function j_(){return{name:`cameraReprojectionTaaCompositeShaderPass`,renderTargets:{cameraReprojectionTaaHistoryColor:{format:`rgba16float`,lifetime:`history`,initialize:`original`},cameraReprojectionTaaHistoryDepth:{format:`rgba16float`,lifetime:`history`,initialize:{clearColor:[1,0,0,1]}}},steps:[{shaderPass:k_,inputs:{sourceTexture:`previous`,historyTexture:`cameraReprojectionTaaHistoryColor`,previousDepthTexture:`cameraReprojectionTaaHistoryDepth`},output:`cameraReprojectionTaaHistoryColor`},{shaderPass:E_,inputs:{sourceTexture:`cameraReprojectionTaaHistoryColor`},output:`previous`},{shaderPass:A_,inputs:{sourceTexture:`previous`},output:`cameraReprojectionTaaHistoryDepth`}]}}var M_=8,N_=.5,P_=class{device;adapter=new o_;renderer;frames=new Map;constructor(e,{deferred:t=!1}={}){this.device=e,this.renderer=t?new df(e):new hd(e)}render(e){let t=this.adapter.makeRenderOptions(e),n=e.getParameter(`renderer`);if(!t||!n)return{surfaceCount:0,instanceCount:0,drawCount:0,triangleCount:0};let r=t.renderMode===`default`?n.getParameter(`bloomIntensity`)??0:0,i=this.device.type===`webgpu`&&t.renderMode===`default`&&(n.getParameter(`temporalAntialiasing`)??!0),a=i||r>0?this.getFrameResources(e):null,o=!1,s=null;if(a){let n=this.getFramebuffer(e,a,i);t.framebuffer=n.framebuffer,o=n.resized}i&&a?(s=L_(t,a.temporalAntialiasingState,o),t.camera={...t.camera,projectionMatrix:s.jitteredProjectionMatrix}):a&&I_(a.temporalAntialiasingState);let c=this.renderer.render(t);if(!a||!t.framebuffer)return c;let l=t.framebuffer.colorAttachments[0].texture;if(s){let t=this.getTemporalAntialiasingRenderer(a),[n,i]=l_(e,this.device);t.resize([n,i]);let o=this.getTemporalAntialiasingDepthTexture(e.id,a),c={sourceTexture:l,bindings:{depthTexture:o},uniforms:{cameraReprojectionTaaResolve:{inverseViewProjectionMatrix:new D(s.currentViewProjectionMatrix).invert(),previousViewProjectionMatrix:s.previousViewProjectionMatrix,currentJitter:s.currentJitter,previousJitter:s.previousJitter}},resetHistory:s.resetHistory};if(r>0){let e=t.renderToTexture(c);e&&(l=e)}else t.renderToScreen(c);R_(a.temporalAntialiasingState,s)}if(r>0){let t=this.getBloomRenderer(a);t.resize(l_(e,this.device)),t.renderToScreen({sourceTexture:l,uniforms:{bloomExtract:{threshold:n.getParameter(`bloomThreshold`)??.62},bloomBlur:{radius:n.getParameter(`bloomRadius`)??7},bloomComposite:{intensity:r}}})}return c}destroyFrame(e){this.renderer.destroyFrame(e.id);let t=this.frames.get(e);t&&(t.framebuffer?.destroy(),t.colorTexture?.destroy(),t.depthTexture?.destroy(),t.bloomRenderer?.destroy(),t.temporalAntialiasingRenderer?.destroy(),this.frames.delete(e))}destroy(){for(let e of Array.from(this.frames.keys()))this.destroyFrame(e);this.renderer.destroy(),this.adapter.destroy()}getFrameResources(e){let t=this.frames.get(e);return t||(t={framebuffer:null,colorTexture:null,depthTexture:null,bloomRenderer:null,temporalAntialiasingRenderer:null,temporalAntialiasingState:F_()},this.frames.set(e,t)),t}getFramebuffer(e,t,n){let[r,i]=l_(e,this.device),a=this.device.preferredColorFormat,o=t.framebuffer&&(t.framebuffer.width!==r||t.framebuffer.height!==i||t.colorTexture?.format!==a||!!t.depthTexture!==n);return o&&G_(t),t.framebuffer||=(t.colorTexture=this.device.createTexture({id:`anari-${e.id}-color-texture`,width:r,height:i,format:a,usage:p.RENDER_ATTACHMENT|p.SAMPLE}),t.depthTexture=n?this.device.createTexture({id:`anari-${e.id}-depth-texture`,width:r,height:i,format:`depth24plus`,usage:p.RENDER_ATTACHMENT|p.SAMPLE,sampler:{minFilter:`nearest`,magFilter:`nearest`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`}}):null,this.device.createFramebuffer({id:`anari-${e.id}-color`,width:r,height:i,colorAttachments:[t.colorTexture],depthStencilAttachment:t.depthTexture||`depth24plus`})),{framebuffer:t.framebuffer,resized:!!o}}getTemporalAntialiasingDepthTexture(e,t){if(this.renderer instanceof df){let t=this.renderer.getLastDepthTexture(e);if(t)return t}if(!t.depthTexture)throw Error(`ANARI temporal antialiasing requires a sampleable scene depth texture.`);return t.depthTexture}getBloomRenderer(e){return e.bloomRenderer||=new qc(this.device,{shaderPasses:[T_]}),e.bloomRenderer}getTemporalAntialiasingRenderer(e){return e.temporalAntialiasingRenderer||=new qc(this.device,{shaderPasses:[j_()],colorFormat:`rgba16float`}),e.temporalAntialiasingRenderer}};function F_(){return{frameIndex:0,previousViewProjectionMatrix:null,previousViewMatrix:null,previousProjectionMatrix:null,previousJitter:[0,0],topologySignature:null}}function I_(e){e.frameIndex=0,e.previousViewProjectionMatrix=null,e.previousViewMatrix=null,e.previousProjectionMatrix=null,e.previousJitter=[0,0],e.topologySignature=null}function L_(e,t,n){let r=new D(e.camera.viewMatrix),i=new D(e.camera.projectionMatrix),a=new D(i).multiplyRight(r),o=V_(e),s=n||!t.previousViewProjectionMatrix||t.topologySignature!==o||z_(t,r,i),c=s?0:t.frameIndex,l=H_(c,e.width||1,e.height||1);return{currentViewMatrix:r,currentProjectionMatrix:i,currentViewProjectionMatrix:a,previousViewProjectionMatrix:s?a:t.previousViewProjectionMatrix,jitteredProjectionMatrix:U_(i,l),currentJitter:l,previousJitter:s?l:t.previousJitter,topologySignature:o,resetHistory:s,nextFrameIndex:(c+1)%M_}}function R_(e,t){e.frameIndex=t.nextFrameIndex,e.previousViewProjectionMatrix=t.currentViewProjectionMatrix,e.previousViewMatrix=t.currentViewMatrix,e.previousProjectionMatrix=t.currentProjectionMatrix,e.previousJitter=t.currentJitter,e.topologySignature=t.topologySignature}function z_(e,t,n){return e.previousViewMatrix!==null&&B_(e.previousViewMatrix,t)>N_||e.previousProjectionMatrix!==null&&B_(e.previousProjectionMatrix,n)>N_}function B_(e,t){let n=0;for(let r=0;r<16;r++)n=Math.max(n,Math.abs((e[r]||0)-(t[r]||0)));return n}function V_(e){return e.surfaces.map(e=>`${e.id}:${e.geometryVersion??0}:${e.material.id}:${e.material.version??0}:${e.transforms.length}:${e.instanceIds?.join(`,`)||``}`).sort().join(`|`)}function H_(e,t,n){let r=e%M_+1;return[(W_(r,2)-.5)/Math.max(t,1),(W_(r,3)-.5)/Math.max(n,1)]}function U_(e,t){let n=new D(e),r=t[0]*2,i=t[1]*-2;for(let e=0;e<4;e++){let t=e*4,a=n[t+3];n[t]+=r*a,n[t+1]+=i*a}return n}function W_(e,t){let n=0,r=1,i=e;for(;i>0;)r/=t,n+=i%t*r,i=Math.floor(i/t);return n}function G_(e){e.framebuffer?.destroy(),e.colorTexture?.destroy(),e.depthTexture?.destroy(),e.framebuffer=null,e.colorTexture=null,e.depthTexture=null}var K_={array:[`array1D`],camera:[`perspective`,`orthographic`],frame:[`default`],geometry:[`triangle`,`sphere`,`cylinder`,`cone`,`quad`,`hexPrism`,`torus`,`ring`],group:[`default`],instance:[`transform`],light:[`ambient`,`directional`,`point`,`spot`],material:[`matte`,`physicallyBased`],sampler:[`image2D`],surface:[`default`],world:[`default`]},q_=[`KHR_CAMERA_PERSPECTIVE`,`KHR_CAMERA_ORTHOGRAPHIC`,`KHR_GEOMETRY_TRIANGLE`,`KHR_GEOMETRY_SPHERE`,`KHR_GEOMETRY_CYLINDER`,`KHR_GEOMETRY_CONE`,`KHR_GEOMETRY_QUAD`,`KHR_INSTANCE_TRANSFORM`,`KHR_LIGHT_DIRECTIONAL`,`KHR_LIGHT_POINT`,`KHR_LIGHT_SPOT`,`KHR_MATERIAL_MATTE`,`KHR_MATERIAL_PHYSICALLY_BASED`,`KHR_SAMPLER_IMAGE2D`],J_=256,Y_=class{device;extensions=q_;rendererRuntimeFactories=new Map;renderingRuntimes=new Map;frameRenderingRuntimes=new Map;sceneCommits=[];sceneCommitRevision=0;constructor(e){this.device=e;let t=e=>new P_(e);this.registerRenderer(`default`,t),this.registerRenderer(`deferred`,e=>new P_(e,{deferred:!0})),this.registerRenderer(`debugNormals`,t),this.registerRenderer(`debugDepth`,t),this.registerRenderer(`raytrace`,e=>new y_(e))}newArray(e){return new P(this,e)}newGeometry(e,t={}){return new Gl(this,e,t)}newMaterial(e,t={}){return new Kl(this,e,t)}newSampler(e,t){return new ql(this,e,t)}newSurface(e){return new Jl(this,e)}newGroup(e={}){return new Yl(this,e)}newInstance(e){return new Xl(this,e)}newWorld(e={}){return new Zl(this,e)}newLight(e,t={}){return new Ql(this,e,t)}newCamera(e,t={}){return new $l(this,e,t)}newRenderer(e=`default`,t={}){return new eu(this,e,t)}registerRenderer(e,t){let n=this.rendererRuntimeFactories.get(e);if(this.rendererRuntimeFactories.set(e,t),n&&n!==t&&!Array.from(this.rendererRuntimeFactories.values()).includes(n)){let e=this.renderingRuntimes.get(n);for(let[t,n]of this.frameRenderingRuntimes)n===e&&this.frameRenderingRuntimes.delete(t);e?.destroy(),this.renderingRuntimes.delete(n)}return this}newFrame(e){return new tu(this,e)}getObjectSubtypes(e){return e===`renderer`?Array.from(this.rendererRuntimeFactories.keys()):K_[e]}getObjectInfo(e){return{type:e,subtypes:this.getObjectSubtypes(e),extensions:this.extensions}}getSceneCommitRevision(){return this.sceneCommitRevision}getSceneCommitsSince(e){return e===this.sceneCommitRevision?[]:this.sceneCommits.length===0||e<this.sceneCommits[0].revision-1?null:this.sceneCommits.filter(t=>t.revision>e)}recordSceneObjectCommit(e,t,n=!1){let r;switch(e){case`world`:case`group`:case`array`:r=[`topology`,`lights`];break;case`geometry`:case`surface`:r=[`topology`];break;case`instance`:r=n?[`topology`,`lights`]:[`transforms`];break;case`material`:case`sampler`:r=[`materials`];break;case`light`:r=[`lights`];break;default:return}this.sceneCommitRevision++,this.sceneCommits.push({revision:this.sceneCommitRevision,objectId:t,categories:r}),this.sceneCommits.length>J_&&this.sceneCommits.shift()}renderFrame(e){let t=e.getParameter(`renderer`)?.subtype??`default`,n=this.rendererRuntimeFactories.get(t);if(!n)throw Error(`ANARI renderer "${t}" is not registered.`);let r=this.renderingRuntimes.get(n);r||(r=n(this.device),this.renderingRuntimes.set(n,r));let i=r.render(e);return this.frameRenderingRuntimes.set(e.id,r),i}pickFrame(e,t,n){return this.frameRenderingRuntimes.get(e.id)?.pick?.(e,t,n)??Promise.resolve(null)}captureFrameChannels(e){return this.frameRenderingRuntimes.get(e.id)?.captureChannels?.(e)??null}destroyFrame(e){this.frameRenderingRuntimes.delete(e.id);for(let t of this.renderingRuntimes.values())t.destroyFrame(e)}destroy(){for(let e of this.renderingRuntimes.values())e.destroy();this.frameRenderingRuntimes.clear(),this.renderingRuntimes.clear(),this.sceneCommits.length=0}},X_=[U(`baseColor`,`pbr_baseColorSampler`,`baseColorTexture`,[`pbrMetallicRoughness`,`baseColorTexture`]),U(`metallicRoughness`,`pbr_metallicRoughnessSampler`,`metallicRoughnessTexture`,[`pbrMetallicRoughness`,`metallicRoughnessTexture`]),U(`normal`,`pbr_normalSampler`,`normalTexture`,[`normalTexture`]),U(`occlusion`,`pbr_occlusionSampler`,`occlusionTexture`,[`occlusionTexture`]),U(`emissive`,`pbr_emissiveSampler`,`emissiveTexture`,[`emissiveTexture`]),U(`specularColor`,`pbr_specularColorSampler`,`KHR_materials_specular.specularColorTexture`,[`extensions`,`KHR_materials_specular`,`specularColorTexture`]),U(`specularIntensity`,`pbr_specularIntensitySampler`,`KHR_materials_specular.specularTexture`,[`extensions`,`KHR_materials_specular`,`specularTexture`]),U(`transmission`,`pbr_transmissionSampler`,`KHR_materials_transmission.transmissionTexture`,[`extensions`,`KHR_materials_transmission`,`transmissionTexture`]),U(`thickness`,`pbr_thicknessSampler`,`KHR_materials_volume.thicknessTexture`,[`extensions`,`KHR_materials_volume`,`thicknessTexture`]),U(`clearcoat`,`pbr_clearcoatSampler`,`KHR_materials_clearcoat.clearcoatTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatTexture`]),U(`clearcoatRoughness`,`pbr_clearcoatRoughnessSampler`,`KHR_materials_clearcoat.clearcoatRoughnessTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatRoughnessTexture`]),U(`clearcoatNormal`,`pbr_clearcoatNormalSampler`,`KHR_materials_clearcoat.clearcoatNormalTexture`,[`extensions`,`KHR_materials_clearcoat`,`clearcoatNormalTexture`]),U(`sheenColor`,`pbr_sheenColorSampler`,`KHR_materials_sheen.sheenColorTexture`,[`extensions`,`KHR_materials_sheen`,`sheenColorTexture`]),U(`sheenRoughness`,`pbr_sheenRoughnessSampler`,`KHR_materials_sheen.sheenRoughnessTexture`,[`extensions`,`KHR_materials_sheen`,`sheenRoughnessTexture`]),U(`iridescence`,`pbr_iridescenceSampler`,`KHR_materials_iridescence.iridescenceTexture`,[`extensions`,`KHR_materials_iridescence`,`iridescenceTexture`]),U(`iridescenceThickness`,`pbr_iridescenceThicknessSampler`,`KHR_materials_iridescence.iridescenceThicknessTexture`,[`extensions`,`KHR_materials_iridescence`,`iridescenceThicknessTexture`]),U(`anisotropy`,`pbr_anisotropySampler`,`KHR_materials_anisotropy.anisotropyTexture`,[`extensions`,`KHR_materials_anisotropy`,`anisotropyTexture`]),U(`bump`,`pbr_bumpSampler`,`EXT_materials_bump.bumpTexture`,[`extensions`,`EXT_materials_bump`,`bumpTexture`]),U(`diffuseTransmission`,`pbr_diffuseTransmissionSampler`,`KHR_materials_diffuse_transmission.diffuseTransmissionTexture`,[`extensions`,`KHR_materials_diffuse_transmission`,`diffuseTransmissionTexture`]),U(`diffuseTransmissionColor`,`pbr_diffuseTransmissionColorSampler`,`KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture`,[`extensions`,`KHR_materials_diffuse_transmission`,`diffuseTransmissionColorTexture`]),U(`multiscatterColor`,`pbr_multiscatterColorSampler`,`KHR_materials_volume_scatter.multiscatterColorTexture`,[`extensions`,`KHR_materials_volume_scatter`,`multiscatterColorTexture`])],Z_=new Map(X_.map(e=>[e.slot,e]));function U(e,t,n,r){return{slot:e,binding:t,displayName:n,pathSegments:r,colorSpace:e===`baseColor`||e===`emissive`||e===`specularColor`||e===`sheenColor`||e===`diffuseTransmissionColor`||e===`multiscatterColor`?`srgb`:`linear`,uvSetUniform:`${e}UVSet`,uvTransformUniform:`${e}UVTransform`}}function Q_(){return X_}function $_(e){let t=Z_.get(e);if(!t)throw Error(`Unknown PBR texture transform slot ${e}`);return t}function ev(e){let t=e?.extensions?.KHR_texture_transform;return{offset:t?.offset?[t.offset[0],t.offset[1]]:[0,0],rotation:t?.rotation??0,scale:t?.scale?[t.scale[0],t.scale[1]]:[1,1]}}function tv(e){return e?.extensions?.KHR_texture_transform?.texCoord??e?.texCoord??0}function nv(e){if(e[0]===`extensions`&&e[1]===`KHR_materials_scatter`){let t=e[2]===`scatterStrengthTexture`?`diffuseTransmission`:e[2]===`multiscatterColorTexture`?`multiscatterColor`:null;if(t&&e.length===3)return{...$_(t),pathSegments:e}}return X_.find(t=>t.pathSegments.length===e.length&&t.pathSegments.every((t,n)=>e[n]===t))||null}var W=function(e){return e[e.POINTS=0]=`POINTS`,e[e.LINES=1]=`LINES`,e[e.LINE_LOOP=2]=`LINE_LOOP`,e[e.LINE_STRIP=3]=`LINE_STRIP`,e[e.TRIANGLES=4]=`TRIANGLES`,e[e.TRIANGLE_STRIP=5]=`TRIANGLE_STRIP`,e[e.TRIANGLE_FAN=6]=`TRIANGLE_FAN`,e[e.ONE=1]=`ONE`,e[e.SRC_ALPHA=770]=`SRC_ALPHA`,e[e.ONE_MINUS_SRC_ALPHA=771]=`ONE_MINUS_SRC_ALPHA`,e[e.FUNC_ADD=32774]=`FUNC_ADD`,e[e.LINEAR=9729]=`LINEAR`,e[e.NEAREST=9728]=`NEAREST`,e[e.NEAREST_MIPMAP_NEAREST=9984]=`NEAREST_MIPMAP_NEAREST`,e[e.LINEAR_MIPMAP_NEAREST=9985]=`LINEAR_MIPMAP_NEAREST`,e[e.NEAREST_MIPMAP_LINEAR=9986]=`NEAREST_MIPMAP_LINEAR`,e[e.LINEAR_MIPMAP_LINEAR=9987]=`LINEAR_MIPMAP_LINEAR`,e[e.TEXTURE_MAG_FILTER=10240]=`TEXTURE_MAG_FILTER`,e[e.TEXTURE_MIN_FILTER=10241]=`TEXTURE_MIN_FILTER`,e[e.TEXTURE_WRAP_S=10242]=`TEXTURE_WRAP_S`,e[e.TEXTURE_WRAP_T=10243]=`TEXTURE_WRAP_T`,e[e.REPEAT=10497]=`REPEAT`,e[e.CLAMP_TO_EDGE=33071]=`CLAMP_TO_EDGE`,e[e.MIRRORED_REPEAT=33648]=`MIRRORED_REPEAT`,e[e.UNPACK_FLIP_Y_WEBGL=37440]=`UNPACK_FLIP_Y_WEBGL`,e}({});function rv(e={}){let t=e.wrapS??e.parameters?.[W.TEXTURE_WRAP_S],n=e.wrapT??e.parameters?.[W.TEXTURE_WRAP_T],r=e.magFilter??e.parameters?.[W.TEXTURE_MAG_FILTER],i=e.minFilter??e.parameters?.[W.TEXTURE_MIN_FILTER],a=av(t),o=av(n),s=lv(r);return{...a?{addressModeU:a}:{},...o?{addressModeV:o}:{},...s?{magFilter:s}:{},...uv(i)}}function iv(e){let t=ov(e.addressModeU),n=ov(e.addressModeV),r=sv(e.magFilter),i=cv(e.minFilter,e.mipmapFilter);return{...t===void 0?{}:{wrapS:t},...n===void 0?{}:{wrapT:n},...r===void 0?{}:{magFilter:r},...i===void 0?{}:{minFilter:i}}}function av(e){switch(e){case W.CLAMP_TO_EDGE:return`clamp-to-edge`;case W.REPEAT:return`repeat`;case W.MIRRORED_REPEAT:return`mirror-repeat`;default:return}}function ov(e){switch(e){case`clamp-to-edge`:return W.CLAMP_TO_EDGE;case`repeat`:return W.REPEAT;case`mirror-repeat`:return W.MIRRORED_REPEAT;default:return}}function sv(e){switch(e){case`nearest`:return W.NEAREST;case`linear`:return W.LINEAR;default:return}}function cv(e,t){if(e)return t===`nearest`?e===`nearest`?W.NEAREST_MIPMAP_NEAREST:W.LINEAR_MIPMAP_NEAREST:t===`linear`?e===`nearest`?W.NEAREST_MIPMAP_LINEAR:W.LINEAR_MIPMAP_LINEAR:e===`nearest`?W.NEAREST:W.LINEAR}function lv(e){switch(e){case W.NEAREST:return`nearest`;case W.LINEAR:return`linear`;default:return}}function uv(e){switch(e){case W.NEAREST:return{minFilter:`nearest`};case W.LINEAR:return{minFilter:`linear`};case W.NEAREST_MIPMAP_NEAREST:return{minFilter:`nearest`,mipmapFilter:`nearest`};case W.LINEAR_MIPMAP_NEAREST:return{minFilter:`linear`,mipmapFilter:`nearest`};case W.NEAREST_MIPMAP_LINEAR:return{minFilter:`nearest`,mipmapFilter:`linear`};case W.LINEAR_MIPMAP_LINEAR:return{minFilter:`linear`,mipmapFilter:`linear`};default:return{}}}function dv(e,t,n){if(`compressed`in t)return hv(e,t,{id:n.id,sampler:n.sampler});let r=n.width!==void 0&&n.height!==void 0?{width:n.width,height:n.height}:e.getExternalImageSize(t),i=n.sampler.mipmapFilter===`nearest`||n.sampler.mipmapFilter===`linear`,a=i?e.getMipLevelCount(r.width,r.height):1,o=e.createTexture({id:n.id,sampler:n.sampler,width:r.width,height:r.height,mipLevels:a,...i?{usage:p.SAMPLE|p.RENDER|p.COPY_DST|p.COPY_SRC}:{},...n.colorSpace?{format:n.colorSpace===`srgb`?`rgba8unorm-srgb`:`rgba8unorm`}:{},data:t});return a>1&&(e.type===`webgl`?o.generateMipmapsWebGL():e.type===`webgpu`&&e.generateMipmapsWebGPU(o)),o}function fv(e,t){return e.createTexture({...t,format:`rgba8unorm`,width:1,height:1,mipLevels:1})}function pv(e){return e.textureFormat}function mv(e,t,n){let{blockWidth:r=1,blockHeight:i=1}=l.getInfo(n),a=1;for(let n=1;;n++){let o=Math.max(1,e>>n),s=Math.max(1,t>>n);if(o<r||s<i)break;a++}return a}function hv(e,t,n){let r;if(r=Array.isArray(t.data)&&t.data[0]?.data?t.data:`mipmaps`in t&&Array.isArray(t.mipmaps)?t.mipmaps:[],r.length===0||!r[0]?.data)return o.warn(`createCompressedTexture: compressed image has no valid mip levels, creating fallback`)(),fv(e,n);let i=r[0],a=i.width??t.width??0,s=i.height??t.height??0;if(a<=0||s<=0)return o.warn(`createCompressedTexture: base level has invalid dimensions, creating fallback`)(),fv(e,n);let c=pv(i);if(!c)return o.warn(`createCompressedTexture: compressed image has no textureFormat, creating fallback`)(),fv(e,n);if(!e.isTextureFormatSupported(c))return o.warn(`createCompressedTexture: ${e.type} device does not support '${c}', creating fallback`)(),fv(e,n);let l=mv(a,s,c),u=Math.min(r.length,l),d=1;for(let e=1;e<u;e++){let t=r[e];if(!t.data||t.width<=0||t.height<=0){o.warn(`createCompressedTexture: mip level ${e} has invalid data/dimensions, truncating`)();break}let n=pv(t);if(n&&n!==c){o.warn(`createCompressedTexture: mip level ${e} format '${n}' differs from base '${c}', truncating`)();break}let i=Math.max(1,a>>e),l=Math.max(1,s>>e);if(t.width!==i||t.height!==l){o.warn(`createCompressedTexture: mip level ${e} dimensions ${t.width}x${t.height} don't match expected ${i}x${l}, truncating`)();break}d++}let f=e.createTexture({...n,format:c,usage:p.TEXTURE|p.COPY_DST,width:a,height:s,mipLevels:d,data:i.data});for(let e=1;e<d;e++)f.writeData(r[e].data,{width:r[e].width,height:r[e].height,mipLevel:e});return f}function gv(e,t={}){let n=t.lightDefinitions||e.lights||e.extensions?.KHR_lights_punctual?.lights;if(!n||!Array.isArray(n)||n.length===0)return[];let r=[],i=Sv(e.nodes||[]),a=new Map;for(let o of e.nodes||[]){if(!_v(o,i,t.nodeVisibility))continue;let e=o.light??o.extensions?.KHR_lights_punctual?.light;if(typeof e!=`number`||t.nodeIdentifiers&&!t.nodeIdentifiers.has(o.id))continue;let s=n[e];if(!s)continue;let c=vv(s.color||[1,1,1],t.useByteColors??!0),l=s.intensity??1,u=s.range,d=Cv(o,i,a);switch(s.type){case`directional`:r.push(bv(d,c,l));break;case`point`:r.push(yv(d,c,l,u));break;case`spot`:r.push(xv(d,c,l,u,s.spot));break;default:break}}return r}function _v(e,t,n){let r=e;for(;r;){let e=n?.get(r.id);if(e?!e.display:r.extensions?.KHR_node_visibility?.visible===!1)return!1;r=t.get(r.id)}return!0}function vv(e,t){return t?e.map(e=>e*255):Ra(e,!1)}function yv(e,t,n,r){let i=Tv(e),a=[1,0,0];return r!==void 0&&r>0&&(a=[1,0,1/(r*r)]),{type:`point`,position:i,color:t,intensity:n,attenuation:a}}function bv(e,t,n){return{type:`directional`,direction:Ev(e),color:t,intensity:n}}function xv(e,t,n,r,i={}){let a=Tv(e),o=Ev(e),s=[1,0,0];return r!==void 0&&r>0&&(s=[1,0,1/(r*r)]),{type:`spot`,position:a,direction:o,color:t,intensity:n,attenuation:s,innerConeAngle:i.innerConeAngle??0,outerConeAngle:i.outerConeAngle??Math.PI/4}}function Sv(e){let t=new Map;for(let n of e)for(let e of n.children||[])t.set(e.id,n);return t}function Cv(e,t,n){let r=n.get(e.id);if(r)return r;let i=wv(e),a=t.get(e.id),o=a?new D(Cv(a,t,n)).multiplyRight(i):i;return n.set(e.id,o),o}function wv(e){if(e.matrix)return new D(e.matrix);let t=new D;return e.translation&&t.translate(e.translation),e.rotation&&t.multiplyRight(new D().fromQuaternion(e.rotation)),e.scale&&t.scale(e.scale),t}function Tv(e){return e.transformAsPoint([0,0,0])}function Ev(e){return e.transformAsVector([0,0,-1])}function Dv(e,t){return typeof t==`number`?t:(e.skins||[]).findIndex(n=>{if(n===t||t.id&&n.id===t.id)return!0;if(n.joints.length!==t.joints?.length||!n.joints.every((e,n)=>e===t.joints?.[n]))return!1;if(typeof t.inverseBindMatrices==`number`){let r=e.accessors[t.inverseBindMatrices];return!n.inverseBindMatrices||n.inverseBindMatrices===r}return!0})}function Ov(e){let t=/^(.*)\/(0|[1-9]\d*)$/.exec(e);if(t){let e=/\/(centerOfMass|inertiaDiagonal|linearVelocity|angularVelocity|size)$/.test(t[1])?3:/\/inertiaOrientation$/.test(t[1])?4:0;if(Number(t[2])<e)return Ov(t[1])}return/^\/extensions\/KHR_implicit_shapes\/shapes\/\d+\/(sphere\/radius|box\/size|(?:capsule|cylinder)\/(height|radiusBottom|radiusTop)|plane\/(sizeX|sizeZ|doubleSided))$/.test(e)||/^\/nodes\/\d+\/extensions\/KHR_physics_rigid_bodies\/(motion\/(isKinematic|mass|centerOfMass|inertiaDiagonal|inertiaOrientation|linearVelocity|angularVelocity|gravityFactor)|joint\/enableCollision)$/.test(e)||/^\/extensions\/KHR_physics_rigid_bodies\/physicsMaterials\/\d+\/(staticFriction|dynamicFriction|restitution)$/.test(e)||/^\/extensions\/KHR_physics_rigid_bodies\/physicsJoints\/\d+\/(limits\/\d+\/(min|max|stiffness|damping)|drives\/\d+\/(maxForce|positionTarget|velocityTarget|stiffness|damping))$/.test(e)}var kv={KHR_physics_rigid_bodies:{supportLevel:`none`,standardStatus:`draft`,comment:`The optional @luma.gl/engine/gltf-physics adapter validates a pinned subset; ordinary scenegraph loading does not execute physics.`},KHR_implicit_shapes:{supportLevel:`none`,standardStatus:`draft`,comment:`The optional physics adapter supports sphere/box colliders; shapes alone do not define rendering or simulation.`},EXT_lights_area:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Opt-in AreaLightController feeds the shared Light API. PBR supports four rect/disk lights with LTC diffuse, isotropic GGX and clearcoat; disks use a 32-gon and other lobes retain numerical integration. No shadows or indirect light; strict loading does not claim full draft conformance.`},KHR_lightmap:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Draft irradiance rendering supports UV0/UV1, node overrides and atlas instances through individual draws. Strict required-extension loading does not claim full draft conformance.`},KHR_billboard:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Optional BillboardController supports an explicit full-axis profile. Constrained-axis semantics remain ambiguous; strict required-extension loading does not claim full support.`},KHR_audio_emitter:{supportLevel:`parsed-and-wired`,standardStatus:`draft`,comment:`Opt-in AudioController provides Web Audio playback; the application owns context activation and listener updates.`},KHR_audio_environment:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Opt-in listener selection, environment zones, emitter sends and impulse-response or approximate parametric reverb. Doppler, air absorption and listener graph hooks remain unsupported.`},KHR_audio_graph:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Opt-in AudioController implements a processing and scheduled-source profile; animation pointers and general pulse-width synthesis remain unsupported.`},KHR_draco_mesh_compression:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Decoded by loaders.gl before luma.gl builds the scenegraph.`},EXT_meshopt_compression:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`EXT meshopt-compressed buffer views are decoded by loaders.gl before rendering.`},KHR_meshopt_compression:{supportLevel:`built-in`,standardStatus:`release-candidate`,comment:`Decoded by loaders.gl v5 before luma.gl builds the scenegraph.`},KHR_mesh_quantization:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Loader-materialized quantized accessors retain their typed values and normalization.`},EXT_mesh_features:{supportLevel:`loader-only`,standardStatus:`unknown`,comment:`Feature identifiers are decoded by loaders.gl; automatic rendering and picking are application-owned.`},EXT_structural_metadata:{supportLevel:`loader-only`,standardStatus:`unknown`,comment:`Structural metadata is decoded by loaders.gl; automatic rendering and querying are application-owned.`},KHR_gaussian_splatting:{supportLevel:`none`,standardStatus:`ratified`,comment:`A splat adapter exists, but ordinary glTF scene creation does not integrate it.`},KHR_interactivity:{supportLevel:`none`,standardStatus:`ratified`,comment:`The subset interpreter is not integrated into ordinary glTF scene creation.`},KHR_node_selectability:{supportLevel:`none`,standardStatus:`ratified`,comment:`Authored selection semantics are not wired into scene picking.`},KHR_node_hoverability:{supportLevel:`none`,standardStatus:`ratified`,comment:`Authored hover semantics are not wired into pointer dispatch.`},KHR_lights_punctual:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Parsed into luma.gl Light objects.`},KHR_materials_unlit:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Unlit materials bypass the default lighting path.`},KHR_materials_emissive_strength:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Applied by the stock PBR shader.`},KHR_texture_basisu:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`BasisU / KTX2 textures pass through when the device supports them.`},KHR_texture_transform:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Per-slot UV transforms and animated pointers are applied at runtime; avoid duplicate legacy loader-side baking.`},EXT_texture_webp:{supportLevel:`loader-only`,standardStatus:`ratified`,comment:`Texture source is resolved during load; final support depends on browser and device decode support.`},EXT_texture_avif:{supportLevel:`none`,standardStatus:`unknown`,comment:`Source selection depends on the loaders.gl version and decoder; luma.gl does not independently resolve AVIF sources.`},KHR_materials_specular:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now applies specular factors and textures to the dielectric F0 term.`},KHR_materials_ior:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now drives dielectric reflectance from the glTF IOR value.`},KHR_materials_transmission:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now applies transmission to the base layer and exposes transparency through alpha, without a scene-color refraction buffer.`},KHR_materials_volume:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Thickness and attenuation now tint transmitted light in the stock shader.`},KHR_materials_clearcoat:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now adds a secondary clearcoat specular lobe.`},KHR_materials_sheen:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now adds a sheen lobe for cloth-like materials.`},KHR_materials_iridescence:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now tints specular response with a view-dependent thin-film iridescence approximation.`},KHR_materials_anisotropy:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`The stock shader now shapes highlights and IBL response with an anisotropy-direction approximation.`},KHR_materials_pbrSpecularGlossiness:{supportLevel:`loader-only`,standardStatus:`archived`,comment:`Extension data can be loaded, but it is not translated into the default metallic-roughness material path.`},KHR_materials_variants:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Primitive material variants can be selected and restored on the generated scenegraph.`},EXT_mesh_gpu_instancing:{supportLevel:`built-in`,standardStatus:`ratified`,comment:`Accessor-backed instance transforms use one instanced draw per source primitive.`},KHR_node_visibility:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Recursive node visibility controls rendered geometry, punctual lights, and animation.`},KHR_animation_pointer:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`Node transforms, morph weights and visibility, material factors, texture transforms, camera projections, and punctual lights are wired to runtime updates.`},EXT_materials_bump:{supportLevel:`built-in`,standardStatus:`draft`,comment:`The experimental bump-map draft perturbs the canonical surface normal from a linear height texture.`},KHR_materials_diffuse_transmission:{supportLevel:`built-in`,standardStatus:`release-candidate`,comment:`The Khronos release candidate adds energy-conserving back-lit diffuse transmission and independent color/factor textures.`},KHR_materials_dispersion:{supportLevel:`parsed-and-wired`,standardStatus:`ratified`,comment:`The canonical PBR shader separates red, green, and blue transmission using wavelength-dependent refraction.`},KHR_materials_scatter:{supportLevel:`loader-only`,standardStatus:`draft`,comment:`Thin-wall rendering supports transmission-gated forward/backward diffuse scattering, alpha strength textures and sRGB scatter color. Volumetric mode is rejected; strict required-extension loading does not claim full draft conformance.`},KHR_materials_volume_scatter:{supportLevel:`parsed-and-wired`,standardStatus:`draft`,comment:`The unratified volume-scattering draft is approximated per surface; random-walk and screen-space diffusion are not implemented.`},KHR_xmp:{supportLevel:`none`,standardStatus:`archived`,comment:`Metadata payloads remain in the loaded glTF, but luma.gl does not interpret them.`},KHR_xmp_json_ld:{supportLevel:`none`,standardStatus:`ratified`,comment:`Metadata is preserved in the glTF, but luma.gl does not interpret it.`},EXT_lights_image_based:{supportLevel:`none`,standardStatus:`multi-vendor`,comment:`Use loadPBREnvironment() or custom environment setup instead.`},EXT_texture_video:{supportLevel:`none`,standardStatus:`multi-vendor`,comment:`Video textures are not created automatically by the stock pipeline.`},MSFT_lod:{supportLevel:`parsed-and-wired`,standardStatus:`vendor`,comment:`Node levels are parsed and selected by opt-in animated crowds; material LOD and GPU-driven selection are not implemented.`}};function Av(e){return kv[e]||null}function jv(e){let t=e.animations||[],n=new Map,r=new Map;return t.flatMap((t,i)=>{let a=t.name||`Animation-${i}`,o=new Map,s=t.channels.flatMap(({sampler:i,target:a})=>{let s=Lv(e,a),c=`${i}:${s??0}`,l=o.get(c);if(!l){let a=t.samplers[i];if(!a)throw Error(`Cannot find animation sampler ${i}`);let{input:u,interpolation:d=`LINEAR`,output:f}=a,p=Jv(e.accessors[u],n),m=Yv(e.accessors[f],r);l={input:p,interpolation:d,output:s===void 0?m:Rv(m,p.length,d,s)},o.set(c,l)}let u=Mv(e,a,l);return u?[u]:[]});return s.length?[{name:a,channels:s}]:[]})}function Mv(e,t,n){if(t.path===`pointer`)return Nv(e,t,n);let r=Bv(t.path);if(!r)return null;let i=e.nodes[t.node??0];if(!i)throw Error(`Cannot find animation target ${t.node}`);return{type:`node`,sampler:n,targetNodeId:i.id,path:r}}function Nv(e,t,n){let r=t.extensions?.KHR_animation_pointer?.pointer;if(typeof r!=`string`||!r.startsWith(`/`))return o.warn(`KHR_animation_pointer channel is missing a valid JSON pointer and will be skipped`)(),null;if(Ov(r)){if(/(isKinematic|enableCollision)$/.test(r)&&n.interpolation!==`STEP`)throw Error(`Boolean physics channels require STEP interpolation`);return{type:`property`,pointer:r,sampler:n}}let i=Wv(r);switch(i[0]){case`nodes`:return Iv(e,i,n,r);case`materials`:return zv(e,i,n,r);case`cameras`:return Pv(e,i,n,r);case`extensions`:if(i[1]===`KHR_lights_punctual`)return Fv(e,i,n,r);break;default:break}return qv(r,`top-level target "${i[0]}" has no runtime animation mapping`),null}function Pv(e,t,n,r){let i=Number(t[1]),a=e.cameras?.[i],o=t[2],s=t[3];return t.length!==4||!Number.isInteger(i)||!a||o!==`perspective`&&o!==`orthographic`||a.type!==o||!(o===`perspective`?[`aspectRatio`,`yfov`,`znear`,`zfar`]:[`xmag`,`ymag`,`znear`,`zfar`]).includes(s)?(qv(r,`camera pointers must target a supported projection property`),null):{type:`camera`,sampler:n,pointer:r,targetCameraIndex:i,projection:o,property:s}}function Fv(e,t,n,r){let i=Number(t[3]),a=e.lights||e.extensions?.KHR_lights_punctual?.lights,o=t[4]===`spot`,s=o?t[5]:t[4],c=!o&&s===`color`?t[5]:void 0,l=[`color`,`intensity`,`range`,`innerConeAngle`,`outerConeAngle`],u=o||c!==void 0?6:5;return t[2]!==`lights`||t.length!==u||!Number.isInteger(i)||!Array.isArray(a)||!a[i]||!l.includes(s)||o&&s!==`innerConeAngle`&&s!==`outerConeAngle`||c!==void 0&&(!/^[0-2]$/.test(c)||s!==`color`)?(qv(r,`punctual-light pointers must target supported typed light properties`),null):{type:`light`,sampler:n,pointer:r,targetLightIndex:i,property:s,...c===void 0?{}:{component:Number(c)}}}function Iv(e,t,n,r){let i=t.length===5&&t[2]===`extensions`&&t[3]===`KHR_node_visibility`&&t[4]===`visible`;if(t.length!==3&&!i)return qv(r,`node pointers must target transforms, morph weights, or KHR_node_visibility.visible`),null;let a=Number(t[1]),s=e.nodes[a];if(!Number.isInteger(a)||!s)return o.warn(`KHR_animation_pointer target ${r} references a missing node and will be skipped`)(),null;if(i&&n.interpolation!==`STEP`)return qv(r,`boolean visibility animation requires STEP interpolation`),null;let c=i?`visibility`:Bv(t[2]);return c?{type:`node`,sampler:n,targetNodeId:s.id,path:c}:(qv(r,`node property "${t[2]}" has no runtime animation mapping`),null)}function Lv(e,t){let n;if(t.path===`weights`)n=t.node;else if(t.path===`pointer`){let e=t.extensions?.KHR_animation_pointer?.pointer,r=typeof e==`string`?/^\/nodes\/(\d+)\/weights$/.exec(e):null;if(!r)return;n=Number(r[1])}else return;let r=e.nodes[n??0],i=typeof r?.mesh==`number`?e.meshes[r.mesh]:r?.mesh;return r?.weights?.length||i?.weights?.length||i?.primitives?.[0]?.targets?.length||1}function Rv(e,t,n,r){let i=n===`CUBICSPLINE`?3:1,a=e.length/(Math.max(t,1)*i),o=r>1?r:Number.isInteger(a)&&a>1?a:r;if(o<=1)return e;let s=e.flat(),c=[];for(let e=0;e<s.length;e+=o)c.push(s.slice(e,e+o));return c}function zv(e,t,n,r){if(t.length<3)return qv(r,`material pointers must include a material index and target property path`),null;let i=Number(t[1]),a=e.materials[i];if(!Number.isInteger(i)||!a)return o.warn(`KHR_animation_pointer target ${r} references a missing material and will be skipped`)(),null;let s=Vv(a,t.slice(2));return`reason`in s?(qv(r,s.reason),null):{sampler:n,pointer:r,targetMaterialIndex:i,...s}}function Bv(e){switch(e){case`translation`:case`rotation`:case`scale`:case`weights`:return e;default:return null}}function Vv(e,t){let n=Hv(e,t);if(!(`reason`in n)||n.reason!==`not-a-texture-transform-target`)return n;switch(t.join(`/`)){case`pbrMetallicRoughness/baseColorFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`baseColorFactor`}:{reason:G(t)};case`pbrMetallicRoughness/metallicFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`metallicRoughnessValues`,component:0}:{reason:G(t)};case`pbrMetallicRoughness/roughnessFactor`:return e.pbrMetallicRoughness?{type:`material`,property:`metallicRoughnessValues`,component:1}:{reason:G(t)};case`normalTexture/scale`:return e.normalTexture?{type:`material`,property:`normalScale`}:{reason:G(t)};case`occlusionTexture/strength`:return e.occlusionTexture?{type:`material`,property:`occlusionStrength`}:{reason:G(t)};case`emissiveFactor`:return{type:`material`,property:`emissiveFactor`};case`alphaCutoff`:return{type:`material`,property:`alphaCutoff`};case`extensions/KHR_materials_specular/specularFactor`:return e.extensions?.KHR_materials_specular?{type:`material`,property:`specularIntensityFactor`}:{reason:G(t)};case`extensions/KHR_materials_specular/specularColorFactor`:return e.extensions?.KHR_materials_specular?{type:`material`,property:`specularColorFactor`}:{reason:G(t)};case`extensions/KHR_materials_ior/ior`:return e.extensions?.KHR_materials_ior?{type:`material`,property:`ior`}:{reason:G(t)};case`extensions/EXT_materials_bump/bumpFactor`:return e.extensions?.EXT_materials_bump?{type:`material`,property:`bumpFactor`}:{reason:G(t)};case`extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor`:return e.extensions?.KHR_materials_diffuse_transmission?{type:`material`,property:`diffuseTransmissionFactor`}:{reason:G(t)};case`extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor`:return e.extensions?.KHR_materials_diffuse_transmission?{type:`material`,property:`diffuseTransmissionColorFactor`}:{reason:G(t)};case`extensions/KHR_materials_scatter/scatterStrengthFactor`:return e.extensions?.KHR_materials_scatter?{type:`material`,property:`scatterStrengthFactor`}:{reason:G(t)};case`extensions/KHR_materials_scatter/multiscatterColorFactor`:case`extensions/KHR_materials_scatter/multiscatterColor`:return e.extensions?.KHR_materials_scatter?{type:`material`,property:`multiscatterColorFactor`}:{reason:G(t)};case`extensions/KHR_materials_scatter/scatterAnisotropy`:return e.extensions?.KHR_materials_scatter?{type:`material`,property:`scatterAnisotropy`}:{reason:G(t)};case`extensions/KHR_materials_volume_scatter/multiscatterColorFactor`:case`extensions/KHR_materials_volume_scatter/multiscatterColor`:return e.extensions?.KHR_materials_volume_scatter?{type:`material`,property:`multiscatterColorFactor`}:{reason:G(t)};case`extensions/KHR_materials_volume_scatter/scatterAnisotropy`:return e.extensions?.KHR_materials_volume_scatter?{type:`material`,property:`scatterAnisotropy`}:{reason:G(t)};case`extensions/KHR_materials_dispersion/dispersion`:return e.extensions?.KHR_materials_dispersion?{type:`material`,property:`dispersion`}:{reason:G(t)};case`extensions/KHR_materials_transmission/transmissionFactor`:return e.extensions?.KHR_materials_transmission?{type:`material`,property:`transmissionFactor`}:{reason:G(t)};case`extensions/KHR_materials_volume/thicknessFactor`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`thicknessFactor`}:{reason:G(t)};case`extensions/KHR_materials_volume/attenuationDistance`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`attenuationDistance`}:{reason:G(t)};case`extensions/KHR_materials_volume/attenuationColor`:return e.extensions?.KHR_materials_volume?{type:`material`,property:`attenuationColor`}:{reason:G(t)};case`extensions/KHR_materials_clearcoat/clearcoatFactor`:return e.extensions?.KHR_materials_clearcoat?{type:`material`,property:`clearcoatFactor`}:{reason:G(t)};case`extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor`:return e.extensions?.KHR_materials_clearcoat?{type:`material`,property:`clearcoatRoughnessFactor`}:{reason:G(t)};case`extensions/KHR_materials_sheen/sheenColorFactor`:return e.extensions?.KHR_materials_sheen?{type:`material`,property:`sheenColorFactor`}:{reason:G(t)};case`extensions/KHR_materials_sheen/sheenRoughnessFactor`:return e.extensions?.KHR_materials_sheen?{type:`material`,property:`sheenRoughnessFactor`}:{reason:G(t)};case`extensions/KHR_materials_iridescence/iridescenceFactor`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceFactor`}:{reason:G(t)};case`extensions/KHR_materials_iridescence/iridescenceIor`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceIor`}:{reason:G(t)};case`extensions/KHR_materials_iridescence/iridescenceThicknessMinimum`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceThicknessRange`,component:0}:{reason:G(t)};case`extensions/KHR_materials_iridescence/iridescenceThicknessMaximum`:return e.extensions?.KHR_materials_iridescence?{type:`material`,property:`iridescenceThicknessRange`,component:1}:{reason:G(t)};case`extensions/KHR_materials_anisotropy/anisotropyStrength`:return e.extensions?.KHR_materials_anisotropy?{type:`material`,property:`anisotropyStrength`}:{reason:G(t)};case`extensions/KHR_materials_anisotropy/anisotropyRotation`:return e.extensions?.KHR_materials_anisotropy?{type:`material`,property:`anisotropyRotation`}:{reason:G(t)};case`extensions/KHR_materials_emissive_strength/emissiveStrength`:return e.extensions?.KHR_materials_emissive_strength?{type:`material`,property:`emissiveStrength`}:{reason:G(t)};default:return{reason:G(t)}}}function Hv(e,t){let n=t.lastIndexOf(`extensions`);if(n<0||t[n+1]!==`KHR_texture_transform`||n<1)return{reason:`not-a-texture-transform-target`};let r=nv(t.slice(0,n));if(!r)return{reason:Gv(t.slice(0,n))};let i=Uv(e,r.pathSegments);if(!i)return{reason:`texture-transform target "${t.slice(0,n).join(`/`)}" does not exist on the referenced material`};let a=t[n+2];if(a===`texCoord`)return{reason:`animated KHR_texture_transform.texCoord is unsupported because texCoord selection is structural, not a runtime float/vector update`};if(a!==`offset`&&a!==`rotation`&&a!==`scale`)return{reason:`KHR_texture_transform property "${a}" is not animatable; supported properties are offset, rotation, and scale`};let o=t[n+3];if(t.length>n+4)return{reason:`KHR_texture_transform.${a} does not support nested property paths`};let s;if(o!==void 0){if(s=Number(o),a===`rotation`)return{reason:`KHR_texture_transform.rotation does not support component indices`};if(!Number.isInteger(s)||s<0||s>1)return{reason:`KHR_texture_transform.${a} component index "${o}" is invalid; only 0 and 1 are supported`}}return{type:`textureTransform`,textureSlot:r.slot,path:a,component:s,baseTransform:ev(i)}}function Uv(e,t){let n=e;for(let e of t)if(n=n?.[e],!n)return null;return n}function Wv(e){return e.slice(1).split(`/`).map(e=>e.replace(/~1/g,`/`).replace(/~0/g,`~`))}function G(e){let t=Kv(e);if(t){let e=Av(t);if(e?.supportLevel===`none`)return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`no runtime target exists for material property "${e.join(`/`)}"`}function Gv(e){let t=Kv(e);if(t){let e=Av(t);if(e?.supportLevel===`none`)return`${t} is referenced by this pointer, but ${e.comment.charAt(0).toLowerCase()}${e.comment.slice(1)}`}return`texture-transform target "${e.join(`/`)}" has no runtime texture-slot mapping`}function Kv(e){let t=e.indexOf(`extensions`),n=e[t+1];return t>=0&&n?n:null}function qv(e,t){o.warn(`KHR_animation_pointer target ${e} will be skipped because ${t}`)()}function Jv(e,t){if(t.has(e))return t.get(e);let{value:n,components:r}=Xv(e);Zv(r===1,`accessorToJsArray1D must have exactly 1 component`);let i=Array.from(n);return t.set(e,i),i}function Yv(e,t){if(t.has(e))return t.get(e);let{value:n,components:r}=Xv(e);Zv(r>=1,`accessorToJsArray2D must have at least 1 component`);let i=[];for(let e=0;e<n.length;e+=r)i.push(Array.from(n.slice(e,e+r)));return t.set(e,i),i}function Xv(e){if(e.value)return Zv(!(e.value instanceof BigInt64Array)&&!(e.value instanceof BigUint64Array),`glTF animation accessors cannot use BigInt component arrays`),{value:e.value,components:e.components};let t=e.bufferView?.data;Zv(t!==void 0),Zv(e.componentType===5126);let n=e.type===`SCALAR`?1:Number(e.type.slice(3));return{value:new Float32Array(t.buffer,t.byteOffset+(e.byteOffset||0),e.count*n),components:n}}function Zv(e,t){if(!e)throw Error(t)}var Qv={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5124:Int32Array,5125:Uint32Array,5126:Float32Array,5130:Float64Array,5131:n(),5134:BigInt64Array,5135:BigUint64Array};function $v(e,t){let n=Qv[e.componentType];y(n);let r=e.count*e.components*n.BYTES_PER_ELEMENT;return y(r>=0&&r<=t.byteLength),{ArrayType:n,byteLength:r}}function ey(e,t,n){return new Uint8Array(e,t,n).slice().buffer}function ty(e,t,n=e.byteOffset||0,r=e.count){let{ArrayType:i}=$v(e,t),a={MAT2:2,MAT3:3,MAT4:4}[e.type],o=a||1,s=e.components/o*e.bytesPerComponent,c=a?Math.ceil(s/4)*4:s,l=t.byteStride||o*c,u=r>0?(r-1)*l+(o-1)*c+s:0;y(n>=0&&n+u<=t.byteLength);let d=t.buffer,f=t.byteOffset||0;y(f>=0&&f+t.byteLength<=d.byteLength);let p=new Uint8Array(d.arrayBuffer,d.byteOffset+f+n,u),m=new Uint8Array(r*e.bytesPerElement);for(let t=0;t<r;t++)for(let n=0;n<o;n++){let r=t*l+n*c,i=t*e.bytesPerElement+n*s;m.set(p.subarray(r,r+s),i)}return new i(m.buffer)}var ny={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},ry={5120:1,5121:1,5122:2,5123:2,5124:4,5125:4,5126:4,5130:8,5131:2,5134:8,5135:8},K={TEXTURE_MAG_FILTER:10240,TEXTURE_MIN_FILTER:10241,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,REPEAT:10497,LINEAR:9729,NEAREST_MIPMAP_LINEAR:9986},iy={magFilter:K.TEXTURE_MAG_FILTER,minFilter:K.TEXTURE_MIN_FILTER,wrapS:K.TEXTURE_WRAP_S,wrapT:K.TEXTURE_WRAP_T},ay={[K.TEXTURE_MAG_FILTER]:K.LINEAR,[K.TEXTURE_MIN_FILTER]:K.NEAREST_MIPMAP_LINEAR,[K.TEXTURE_WRAP_S]:K.REPEAT,[K.TEXTURE_WRAP_T]:K.REPEAT};function oy(){return{id:`default-sampler`,parameters:ay}}function sy(e){return ry[e]}function cy(e){return ny[e]}var ly=class{json;buffers=[];images=[];postProcess(e){let{json:t,buffers:n=[],images:r=[]}=e;y(t);let i=Math.max(t.buffers?.length||0,n.length);return this.buffers=Array.from({length:i},(e,r)=>({...t.buffers?.[r]||{},...n[r]||{}})),this.images=r,this.json=this._resolveTree(e.json),this.json.buffers=this.buffers,this.json.gaussianSplatPrimitives=e.gaussianSplatPrimitives,this.json}_resolveTree(e){let t={...e,accessors:e.accessors??[],animations:e.animations??[],buffers:e.buffers??[],bufferViews:e.bufferViews??[],cameras:e.cameras??[],images:e.images??[],materials:e.materials??[],meshes:e.meshes??[],nodes:e.nodes??[],samplers:e.samplers??[],scenes:e.scenes??[],skins:e.skins??[],textures:e.textures??[],extensionsUsed:e.extensionsUsed??[],extensionsRequired:e.extensionsRequired??[]};return this.json=t,e.bufferViews&&(t.bufferViews=e.bufferViews.map((e,t)=>this._resolveBufferView(e,t))),e.cameras&&(t.cameras=e.cameras.map((e,t)=>this._resolveCamera(e,t))),e.images&&(t.images=e.images.map((e,t)=>this._resolveImage(e,t))),t.asset=this._resolveAsset(e.asset),e.samplers&&(t.samplers=e.samplers.map((e,t)=>this._resolveSampler(e,t))),e.textures&&(t.textures=e.textures.map((e,t)=>this._resolveTexture(e,t))),e.accessors&&(t.accessors=e.accessors.map((e,t)=>this._resolveAccessor(e,t))),e.materials&&(t.materials=e.materials.map((e,t)=>this._resolveMaterial(e,t))),e.meshes&&(t.meshes=e.meshes.map((e,t)=>this._resolveMesh(e,t))),e.nodes&&(t.nodes=e.nodes.map((e,t)=>this._resolveNode(e,t)),t.nodes=t.nodes.map(e=>this._resolveNodeChildren(e))),e.skins&&(t.skins=e.skins.map((e,t)=>this._resolveSkin(e,t)),e.nodes?.forEach((e,n)=>{e.skin!==void 0&&(t.nodes[n].skin=this.getSkin(e.skin))})),e.scenes&&(t.scenes=e.scenes.map((e,t)=>this._resolveScene(e,t))),typeof this.json.scene==`number`&&t.scenes&&(t.scene=t.scenes[this.json.scene]),t}getScene(e){return this._get(this.json.scenes,e)}getNode(e){return this._get(this.json.nodes,e)}getSkin(e){return this._get(this.json.skins,e)}getMesh(e){return this._get(this.json.meshes,e)}getMaterial(e){return this._get(this.json.materials,e)}getAccessor(e){let t=this._get(this.json.accessors,e);if(typeof e==`object`){let e=cy(t.type),n=sy(t.componentType);return{...t,components:e,bytesPerComponent:n,bytesPerElement:e*n}}return t}getCamera(e){return this._get(this.json.cameras,e)}getTexture(e){return this._get(this.json.textures,e)}getSampler(e){return this._get(this.json.samplers,e)}getImage(e){return this._get(this.json.images,e)}getBufferView(e){return this._get(this.json.bufferViews,e)}getBuffer(e){return this._get(this.json.buffers,e)}_get(e,t){if(typeof t==`object`)return t;let n=e&&e[t];return y(n),n}_resolveAsset(e){return{...e,thumbnail:e.thumbnail===void 0?void 0:this.getImage(e.thumbnail)}}_resolveScene(e,t){return{...e,id:e.id||`scene-${t}`,nodes:(e.nodes||[]).map(e=>this.getNode(e))}}_resolveNode(e,t){let n={...e,id:e?.id||`node-${t}`};return e.mesh!==void 0&&(n.mesh=this.getMesh(e.mesh)),e.camera!==void 0&&(n.camera=this.getCamera(e.camera)),e.skin!==void 0&&(n.skin=this.getSkin(e.skin)),n}_resolveNodeChildren(e){return e.children&&=e.children.map(e=>this.getNode(e)),e}_resolveSkin(e,t){let n=typeof e.inverseBindMatrices==`number`?this.getAccessor(e.inverseBindMatrices):void 0;return{...e,id:e.id||`skin-${t}`,inverseBindMatrices:n}}_resolveMesh(e,t){let n={...e,id:e.id||`mesh-${t}`,primitives:[]};return e.primitives&&(n.primitives=e.primitives.map((e,t)=>{let r={...e,attributes:{},indices:void 0,material:void 0},i=e.attributes;for(let e in i)r.attributes[e]=this.getAccessor(i[e]);return e.indices!==void 0&&(r.indices=this.getAccessor(e.indices)),e.material!==void 0&&(r.material=this.getMaterial(e.material)),uy(r,n.id,t)})),n}_resolveMaterial(e,t){let n={...e,id:e.id||`material-${t}`};if(n.normalTexture&&(n.normalTexture={...n.normalTexture},n.normalTexture.texture=this.getTexture(n.normalTexture.index)),n.occlusionTexture&&(n.occlusionTexture={...n.occlusionTexture},n.occlusionTexture.texture=this.getTexture(n.occlusionTexture.index)),n.emissiveTexture&&(n.emissiveTexture={...n.emissiveTexture},n.emissiveTexture.texture=this.getTexture(n.emissiveTexture.index)),n.emissiveFactor||=[0,0,0],n.pbrMetallicRoughness){n.pbrMetallicRoughness={...n.pbrMetallicRoughness};let e=n.pbrMetallicRoughness;e.baseColorTexture&&(e.baseColorTexture={...e.baseColorTexture},e.baseColorTexture.texture=this.getTexture(e.baseColorTexture.index)),e.metallicRoughnessTexture&&(e.metallicRoughnessTexture={...e.metallicRoughnessTexture},e.metallicRoughnessTexture.texture=this.getTexture(e.metallicRoughnessTexture.index))}return n}_resolveAccessor(e,t){let n=sy(e.componentType),r=cy(e.type),i=n*r,a={...e,id:e.id||`accessor-${t}`,bytesPerComponent:n,components:r,bytesPerElement:i,value:void 0,bufferView:void 0,sparse:void 0};if(e.bufferView!==void 0&&(a.bufferView=this.getBufferView(e.bufferView)),e.value)y(e.value.length===a.count*a.components),a.value=e.sparse?Uint8Array.prototype.slice.call(e.value):e.value;else if(a.bufferView)a.value=ty(a,a.bufferView);else{let{ArrayType:e}=$v(a,{byteLength:a.count*a.bytesPerElement});a.value=new e(a.count*a.components)}return e.sparse&&this._applySparseAccessor(a,e.sparse),a}_applySparseAccessor(e,t){let n=dy(t.indices.componentType),r=this._getTypedArrayFromBufferView(n,this.getBufferView(t.indices.bufferView),t.indices.byteOffset||0,t.count),i=ty({...e,count:t.count},this.getBufferView(t.values.bufferView),t.values.byteOffset||0,t.count);for(let n=0;n<t.count;n++){let t=Number(r[n]);y(Number.isInteger(t)&&t>=0&&t<e.count);for(let r=0;r<e.components;r++){let a=t*e.components+r,o=n*e.components+r;Reflect.set(e.value,a,i[o])}}}_getTypedArrayFromBufferView(e,t,n,r){let i=r*e.BYTES_PER_ELEMENT;y(n>=0&&i>=0&&n+i<=t.byteLength);let a=t.buffer,o=a.byteOffset+(t.byteOffset||0)+n;return new e(ey(a.arrayBuffer,o,i))}_resolveTexture(e,t){return{...e,id:e.id||`texture-${t}`,sampler:typeof e.sampler==`number`?this.getSampler(e.sampler):oy(),source:typeof e.source==`number`?this.getImage(e.source):void 0}}_resolveSampler(e,t){let n={id:e.id||`sampler-${t}`,...e,parameters:{}};for(let t of Object.keys(iy)){let r=e[t];r!==void 0&&(n.parameters[iy[t]]=r)}return n}_resolveImage(e,t){return{...e,id:e.id||`image-${t}`,image:this.images[t]??null,bufferView:e.bufferView===void 0?void 0:this.getBufferView(e.bufferView)}}_resolveBufferView(e,t){let n=e.buffer,r=this.buffers[n];y(r),y(r.byteOffset>=0&&r.byteLength>=0&&r.byteOffset+r.byteLength<=r.arrayBuffer.byteLength);let i=e.byteOffset||0;y(i>=0&&e.byteLength>=0&&i+e.byteLength<=r.byteLength);let a=r.byteOffset+i;return{id:`bufferView-${t}`,...e,buffer:this.buffers[n],data:new Uint8Array(r.arrayBuffer,a,e.byteLength)}}_resolveCamera(e,t){return{...e,id:e.id||`camera-${t}`}}};function uy(e,t,n){if(e.mode!==2&&e.mode!==6)return e;let r=e.indices?.value,i=e.indices?.count??fy(e),a=py(r,i),o=a<=65535?Uint16Array:Uint32Array,s=e.mode===2?gy(r,i,o):_y(r,i,o);return e.mode=e.mode===2?1:4,e.indices={id:`${t}-primitive-${n}-portable-indices`,components:1,bytesPerComponent:o.BYTES_PER_ELEMENT,bytesPerElement:o.BYTES_PER_ELEMENT,componentType:o===Uint16Array?5123:5125,normalized:!1,count:s.length,type:`SCALAR`,min:s.length?[my(s)]:void 0,max:s.length?[a]:void 0,value:s},e}function dy(e){switch(e){case 5121:return Uint8Array;case 5123:return Uint16Array;case 5125:return Uint32Array;default:throw Error(`Invalid glTF sparse index component type ${e}`)}}function fy(e){let t=Object.values(e.attributes)[0];return y(t),t.count}function py(e,t){if(!e)return Math.max(0,t-1);let n=0;for(let r=0;r<t;r++)n=Math.max(n,Number(e[r]));return n}function my(e){let t=1/0;for(let n of e)t=Math.min(t,n);return t}function hy(e,t){return e?Number(e[t]):t}function gy(e,t,n){if(t<2)return new n(0);let r=new n(t*2);for(let n=0;n<t;n++)r[n*2]=hy(e,n),r[n*2+1]=hy(e,(n+1)%t);return r}function _y(e,t,n){let r=Math.max(0,t-2),i=new n(r*3);for(let t=0;t<r;t++)i[t*3]=hy(e,0),i[t*3+1]=hy(e,t+1),i[t*3+2]=hy(e,t+2);return i}function vy(e){return new ly().postProcess(e)}var yy={alphaCutoff:`alphaCutoff`,anisotropyRotation:`anisotropyRotation`,anisotropyStrength:`anisotropyStrength`,attenuationColor:`attenuationColor`,attenuationDistance:`attenuationDistance`,baseColorFactor:`baseColor`,clearcoatFactor:`clearcoat`,clearcoatRoughnessFactor:`clearcoatRoughness`,bumpFactor:`bumpFactor`,diffuseTransmissionFactor:`diffuseTransmission`,diffuseTransmissionColorFactor:`diffuseTransmissionColor`,dispersion:`dispersion`,emissiveFactor:`emissive`,emissiveStrength:`emissiveStrength`,ior:`indexOfRefraction`,iridescenceFactor:`iridescence`,iridescenceIor:`iridescenceIndexOfRefraction`,normalScale:`normalScale`,multiscatterColorFactor:`multiscatterColor`,scatterAnisotropy:`scatterAnisotropy`,occlusionStrength:`occlusionStrength`,sheenColorFactor:`sheenColor`,sheenRoughnessFactor:`sheenRoughness`,specularColorFactor:`specularColor`,specularIntensityFactor:`specularIntensity`,thicknessFactor:`thickness`,transmissionFactor:`transmission`};function by(e,t={}){return e.flatMap(e=>{let n=e.channels.flatMap(e=>Cy(e,t));return n.length>0?[{name:e.name,tracks:n}]:[]})}function xy(e,t){let n=e.nodes||{},r=new Map,i=new Map,a=new Map,o=!1,s;for(let[e,t]of Object.entries(n)){let n=new Nc({id:e,...t.translation?{position:[...t.translation]}:{},...t.rotation?{rotation:[...t.rotation]}:{},...t.scale?{scale:[...t.scale]}:{},...t.matrix?{matrix:[...t.matrix]}:{}});t.weights&&(n.userData.morphWeights=[...t.weights]),r.set(e,n)}for(let[e,t]of Object.entries(n))t.parent&&r.get(t.parent)?.add(r.get(e));let c=(e,t,n)=>{let r=i.get(e)||{};if(t.component!==void 0){let i=e.getParameters(),a=r[t.path]||i[t.path],o=Array.isArray(a)?[...a]:[];o[t.component]=n[0],r[t.path]=o}else r[t.path]=n.length===1?n[0]:[...n];i.set(e,r)},l=e=>{let{target:s}=e,l=`${s.type}:${s.identifier}:${s.path}:${s.component??`*`}`;if(s.type===`node`){let e=r.get(s.identifier);return e?{id:l,getValue:()=>s.path===`translation`?e.position:s.path===`rotation`?e.rotation:s.path===`scale`?e.scale:e.userData.morphWeights||[],setValue:r=>{if(s.path===`translation`)e.setPosition(r);else if(s.path===`rotation`)e.setRotation(r);else if(s.path===`scale`)e.setScale(r);else if(s.path===`weights`){e.userData.morphWeights=[...r];for(let e of n[s.identifier]?.geometries||[]){let n=t.geometries?.get(e);if(n){let e=i.get(n)||{};e.morphWeights=[...r],i.set(n,e)}}return}e.updateMatrix(),o=!0}}:null}if(s.type===`sampler`){let n=t.samplers?.get(s.identifier);if(!n)return null;let r=e.baseTransform||{offset:[0,0],rotation:0,scale:[1,1]},o=a.get(s.identifier);o||(o={offset:[...r.offset],rotation:r.rotation,scale:[...r.scale]},a.set(s.identifier,o));let c=o;return{id:l,setValue:e=>{s.path===`rotation`?c.rotation=e[0]:(s.path===`offset`||s.path===`scale`)&&(s.component===void 0?c[s.path]=[e[0],e[1]]:c[s.path][s.component]=e[0]);let t=i.get(n)||{};t.transform=bl(c),i.set(n,t)}}}let u=s.type===`instance`?t.instances.get(s.identifier):s.type===`material`?t.materials?.get(s.identifier):s.type===`light`?t.lights?.get(s.identifier):s.type===`camera`?t.camera:void 0;return u?{id:l,getValue:()=>{let e=u.getParameters()[s.path];return Array.isArray(e)?s.component===void 0?e:[e[s.component]||0]:typeof e==`number`?[e]:[]},setValue:e=>c(u,s,e)}:null},u=(e.clips||[]).map(e=>{let t=e.tracks.flatMap(e=>{let t=l(e);return t?[new Wt({name:`${e.target.type}:${e.target.identifier}:${e.target.path}`,times:e.times,values:e.values,interpolation:e.interpolation,valueType:e.target.path===`rotation`&&e.target.type===`node`?`quaternion`:`vector`,binding:t})]:[]});return new Gt({name:e.name,tracks:t,duration:e.duration})}),d=new qt(u),f=e.playback?.clip||u[0]?.name;if(f){let t=d.clipAction(f,{loop:e.playback?.loop,timeScale:e.playback?.speed});t.play(),e.playback?.playing===!1&&t.pause()}let p=(e,a)=>{let o=r.get(e);if(!o)return;let s=new D(a).multiplyRight(o.matrix);for(let r of n[e]?.instances||[]){let e=t.instances.get(r);if(e){let t=i.get(e)||{};t.transform=Array.from(s),i.set(e,t)}}for(let[t,r]of Object.entries(n))r.parent===e&&p(t,s)},m=()=>{if(!t.skins?.size)return;let e=new Map;for(let[t,i]of Object.entries(n))i.parent||r.get(t)?.preorderTraversal((t,{worldMatrix:n})=>{t instanceof Nc&&e.set(t,new D(n))});for(let[n,a]of t.skins){let t=r.get(a.node),o=a.joints.flatMap(e=>{let t=r.get(e);return t?[t]:[]});if(!t||o.length!==a.joints.length)continue;let s=An({joints:o,meshNode:t,worldMatrices:e,inverseBindMatrices:a.inverseBindMatrices}),c=n.getParameter(`skin`)?.jointMatrices;if(c?.length===s.length&&s.every((e,t)=>e===c[t]))continue;let l=i.get(n)||{};l.skin={jointMatrices:s},i.set(n,l)}},h=()=>{if(o){for(let[e,t]of Object.entries(n))t.parent||p(e,new D);m(),o=!1}for(let[e,t]of i){let n=e.getParameters(),r=Object.fromEntries(Object.entries(t).filter(([e,t])=>!Sy(n[e],t)));Object.keys(r).length!==0&&(e.type===`geometry`||e.type===`material`||e.type===`light`||e.type===`camera`||e.type===`surface`?e.setParameters(r):(e.type===`sampler`||e.type===`instance`)&&e.setParameter(`transform`,r.transform),e.commitParameters())}i.clear()};return t.skins?.size&&(m(),h()),{mixer:d,clipNames:u.map(e=>e.name),get activeClip(){return f},update(e){let t=s===void 0?0:e-s;s=e,d.update(t),h()},selectClip(e){f&&f!==e&&d.getAction(f)?.stop(),f=e,d.clipAction(e).play(),h()},play(){f&&d.clipAction(f).play()},pause(){f&&d.clipAction(f).pause()},seek(e){let t=f?d.getAction(f):void 0;t?(t.setTime(e),d.time=e,d.update(0)):d.setTime(e),h()},setSpeed(e){f&&d.clipAction(f).setEffectiveTimeScale(e)}}}function Sy(e,t){return Array.isArray(e)&&Array.isArray(t)?e.length===t.length&&e.every((e,n)=>e===t[n]):e===t}function Cy(e,t){let n,r;if(e.type===`node`)n={type:`node`,identifier:t.nodeIdentifiers?.[e.targetNodeId]||e.targetNodeId,path:e.path};else if(e.type===`material`){let r=t.materialIdentifiers?.[e.targetMaterialIndex];if(!r)return[];let i=e.property===`baseColorFactor`&&e.component===3;if(i&&t.materialAlphaModes?.[e.targetMaterialIndex]===`OPAQUE`)return[];let a=e.property===`metallicRoughnessValues`||e.property===`iridescenceThicknessRange`||i,o=i?`opacity`:e.property===`metallicRoughnessValues`?e.component===0?`metallic`:`roughness`:e.property===`iridescenceThicknessRange`?e.component===0?`iridescenceThicknessMinimum`:`iridescenceThicknessMaximum`:yy[e.property];if(!o)return[];n={type:`material`,identifier:r,path:o,...e.component!==void 0&&!a?{component:e.component}:{}}}else if(e.type===`textureTransform`){let i=t.samplerIdentifiers?.[`${e.targetMaterialIndex}:${e.textureSlot}`];if(!i)return[];n={type:`sampler`,identifier:i,path:e.path,...e.component===void 0?{}:{component:e.component}},r={offset:[...e.baseTransform.offset],rotation:e.baseTransform.rotation,scale:[...e.baseTransform.scale]}}else return[];let i=e.sampler.interpolation,a={target:n,times:[...e.sampler.input],values:e.sampler.output.map(e=>[...e]),...i===`LINEAR`?{}:{interpolation:i},...r?{baseTransform:r}:{}};return e.type===`material`&&e.property===`baseColorFactor`&&e.component===void 0&&e.sampler.output.every(e=>e.length>3)&&t.materialAlphaModes?.[e.targetMaterialIndex]!==`OPAQUE`?[a,{...a,target:{...n,path:`opacity`},values:e.sampler.output.map(e=>[e[3]])}]:[a]}var wy=[`triangle`,`sphere`,`cylinder`,`cone`,`quad`,`hexPrism`,`torus`,`ring`],Ty=[`matte`,`physicallyBased`],Ey=[`ambient`,`directional`,`point`,`spot`],Dy=[`perspective`,`orthographic`],Oy=[`default`,`deferred`,`raytrace`,`debugNormals`,`debugDepth`],ky={"@@type":`default`,background:[.016,.019,.044,1],ambientRadiance:.1,exposure:1.5,bloomIntensity:.82,bloomThreshold:.64,bloomRadius:8,fogColor:[.018,.025,.065],fogDensity:24e-5},Ay={resolutionScale:.5,minimumResolutionScale:.25,adaptiveResolution:!0,targetFrameTimeMilliseconds:33.3,temporalReprojection:!0,shadowSamplesPerFrame:1,progressive:!0,shadows:!0},jy=[`baseColorTexture`,`normalTexture`,`bumpTexture`,`metallicRoughnessTexture`,`emissiveTexture`,`occlusionTexture`,`specularColorTexture`,`specularIntensityTexture`,`clearcoatTexture`,`clearcoatRoughnessTexture`,`clearcoatNormalTexture`,`transmissionTexture`,`diffuseTransmissionTexture`,`diffuseTransmissionColorTexture`,`thicknessTexture`,`multiscatterColorTexture`,`sheenColorTexture`,`sheenRoughnessTexture`,`iridescenceTexture`,`iridescenceThicknessTexture`,`anisotropyTexture`],My=new Map;async function Ny(e){if(typeof createImageBitmap!=`function`)return;let t=new Map;for(let n of Object.values(e.textures||{}))My.has(n.source)||t.has(n.source)||t.set(n.source,fetch(n.source).then(async e=>{if(!e.ok)throw Error(`Unable to load texture "${n.source}": ${e.status}.`);return createImageBitmap(await e.blob())}).then(e=>{My.set(n.source,e)}).catch(e=>{throw Error(`Unable to load texture "${n.source}": ${String(e)}`)}));await Promise.all(t.values())}function Py(e,t,n={}){if(t.version!==1)throw Error(`Scene "version" must be 1.`);let r=new Map,i=new Map,a=[],o=new Map,s=new Map,c=new Map,l=new Map,u=new Map,d=new Map,f=new Map,p=[],m=[],h=Fy(t),g=[];for(let[n,i]of Object.entries(t.geometries)){let{"@@type":t,"vertex.position":a,"vertex.normal":o,"vertex.tangent":s,"vertex.joint":c,"vertex.weight":l,"vertex.attribute0":u,"vertex.attribute1":d,"vertex.attribute2":f,"primitive.index":p,morphTargets:m,generator:h,...g}=i;Xy(`geometry`,t,wy);let _={...g};if(a&&(_[`vertex.position`]=new Float32Array(a)),o&&(_[`vertex.normal`]=new Float32Array(o)),s&&(_[`vertex.tangent`]=new Float32Array(s)),c&&(_[`vertex.joint`]=new Uint16Array(c)),l&&(_[`vertex.weight`]=new Float32Array(l)),u&&(_[`vertex.attribute0`]=new Float32Array(u)),d&&(_[`vertex.attribute1`]=new Float32Array(d)),f&&Object.assign(_,{"vertex.attribute2":new Float32Array(f)}),p&&(_[`primitive.index`]=new Uint32Array(p)),m&&(_.morphTargets=m.map(e=>({...e.POSITION?{POSITION:new Float32Array(e.POSITION)}:{},...e.NORMAL?{NORMAL:new Float32Array(e.NORMAL)}:{},...e.TANGENT?{TANGENT:new Float32Array(e.TANGENT)}:{}}))),h){if(t!==`triangle`)throw Error(`Geometry "${n}" generators require the "triangle" subtype.`);Object.assign(_,By(h))}r.set(n,e.newGeometry(t,_))}for(let[n,r]of Object.entries(t.textures||{})){let t=My.get(r.source);if(!t)throw Error(`Texture "${n}" must be loaded before creating its ANARI scene.`);let o=dv(e.device,t,{id:`anari-${n}`,width:t.width,height:t.height,colorSpace:r.colorSpace||`linear`,sampler:{addressModeU:`repeat`,addressModeV:`repeat`,minFilter:`linear`,magFilter:`linear`,...r.sampler}});a.push(o),i.set(n,e.newSampler(`image2D`,{image:o,transform:r.transform,textureCoordinateSet:r.textureCoordinateSet}))}for(let[n,r]of Object.entries(t.materials)){let{"@@type":t,...a}=r;Xy(`material`,t,Ty);let s={};for(let[e,t]of Object.entries(a))jy.includes(e)?s[e]=Jy(i,String(t),`texture`):Object.assign(s,{[e]:t});o.set(n,e.newMaterial(t,s))}for(let[n,i]of Object.entries(t.surfaces)){let t=Jy(r,i.geometry,`geometry`),a=Jy(o,i.material,`material`),l=e.newSurface({geometry:t,material:a,...i.skin?{skin:{jointMatrices:new Float32Array(i.skin.joints.length*16)}}:{}});s.set(n,l),i.skin&&c.set(l,i.skin)}for(let n of t.lights||[]){let{"@@id":t,"@@type":r,animation:i,...a}=n;Xy(`light`,r,Ey),Yy(l,t,`light`);let o=e.newLight(r,a);l.set(t,o),i&&g.push({identifier:t,light:o,parameters:a,animation:i})}for(let[n,r]of Object.entries(t.groups||{}))u.set(n,e.newGroup({surface:r.surfaces.map(e=>Jy(s,e,`surface`)),light:r.lights?.map(e=>Jy(l,e,`light`))}));let _=t=>{let n=t[`@@id`];Yy(d,n,`instance`);let r;if(t.group)r=Jy(u,t.group,`group`);else if(t.surface){let n=f.get(t.surface);r=n||e.newGroup({surface:[Jy(s,t.surface,`surface`)]}),n||f.set(t.surface,r)}else throw Error(`Instance "${n}" must declare a "group" or "surface".`);let i=e.newInstance({group:r,transform:Ky(t)});d.set(n,i);let a=t.animations||(t.animation?[t.animation]:[]);a.length>0&&!h.instances.has(n)&&p.push(Iy(i,t,a))};for(let e of t.instances||[])_(e);for(let e of t.distributions||[]){if(e[`@@type`]!==`starfield`)throw Error(`Unsupported distribution "${e[`@@type`]}".`);for(let t of zy(e))_(t)}for(let{identifier:e,light:t,parameters:n,animation:r}of g)h.lights.has(e)||m.push(Ly(t,n,r,d));let v=e.newWorld({surface:(t.world?.surfaces||[]).map(e=>Jy(s,e,`surface`)),instance:t.world?.instances?t.world.instances.map(e=>Jy(d,e,`instance`)):Array.from(d.values()),light:t.world?.lights?t.world.lights.map(e=>Jy(l,e,`light`)):Array.from(l.values())}),{"@@type":y,target:b=[0,0,0],orbit:x,...S}=t.camera;Xy(`camera`,y,Dy);let C=S.position||[0,4,12],w=e.newCamera(y,{...S,position:C,direction:S.direction||qy(b,C)}),{"@@type":ee,...T}=t.renderer||ky,E=n.rendererSubtype||ee;Xy(`renderer`,E,Oy);let te=e.newRenderer(E,{...E===`raytrace`?Ay:{},...T}),ne=e.newFrame({world:v,camera:w,renderer:te}),re=t.clips?.length||c.size>0?xy(t,{instances:d,geometries:r,materials:o,samplers:i,lights:l,camera:w,skins:c}):void 0;return{frame:ne,name:t.name,description:t.description||``,cameraTarget:b,cameraPosition:C,cameraOrbitSpeed:x?.speed||0,instanceIdentifiers:new Map(Array.from(d,([e,t])=>[t,e])),animations:re,update(e){re?.update(e);for(let t of p)t(e);for(let t of m)t(e)},destroy(){ne.destroy();for(let e of a)e.destroy()}}}function Fy(e){let t=new Set,n=new Set,r=new Set;for(let i of e.clips||[])for(let{target:e}of i.tracks)e.type===`instance`?t.add(e.identifier):e.type===`light`?n.add(e.identifier):e.type===`node`&&r.add(e.identifier);for(let[n,i]of Object.entries(e.nodes||{})){let a=new Set,o=n;for(;o&&!a.has(o);){if(r.has(o)){for(let e of i.instances||[])t.add(e);break}a.add(o),o=e.nodes?.[o]?.parent}}return{instances:t,lights:n}}function Iy(e,t,n){let r=t.position||[0,0,0],i=t.rotation||[0,0,0];for(let e of n)if(e[`@@type`]!==`orbit`&&e[`@@type`]!==`bob`&&e[`@@type`]!==`spin`&&e[`@@type`]!==`wobble`)throw Error(`Instance "${t[`@@id`]}" does not support "${e[`@@type`]}" animation.`);return a=>{let o=r,s=[...i];for(let e of n)if(e[`@@type`]===`orbit`)o=Ry(e,r,a);else if(e[`@@type`]===`bob`)o=[o[0],o[1]+Math.sin(a*(e.speed??1)+(e.phase||0))*(e.amplitude??.4),o[2]];else if(e[`@@type`]===`spin`){let t=e.axis===`x`?0:e.axis===`z`?2:1;s[t]+=a*(e.speed??1)+(e.phase||0)}else if(e[`@@type`]===`wobble`){let t=e.axis===`x`?0:e.axis===`z`?2:1;s[t]+=Math.sin(a*(e.speed??1)+(e.phase||0))*(e.amplitude??.08)}e.setParameter(`transform`,Ky({...t,position:o,rotation:s})).commitParameters()}}function Ly(e,t,n,r){if(n[`@@type`]===`orbit`){let r=t.position||[3,2,0];return t=>{e.setParameter(`position`,Ry(n,r,t)).commitParameters()}}if(n[`@@type`]===`pulse`){let r=t.intensity??1,i=n.amplitude??.5,a=n.speed??1,o=n.phase||0;return t=>{e.setParameter(`intensity`,r*(1+Math.sin(t*a+o)*i)).commitParameters()}}if(n[`@@type`]===`follow`){let t=Jy(r,n.target,`instance`),i=n.offset||[0,0,0];return()=>{let n=t.getParameter(`transform`);n&&e.setParameter(`position`,[n[12]+i[0],n[13]+i[1],n[14]+i[2]]).commitParameters()}}throw Error(`Lights do not support "${n[`@@type`]}" animation.`)}function Ry(e,t,n){let r=e.center||[0,t[1],0],i=e.radius||Math.hypot(t[0]-r[0],t[2]-r[2])||3,a=n*(e.speed??1)+(e.phase||0),o=Math.sin(a)*Math.sin(e.inclination||0)*i,s=(e.height||0)*Math.sin(a*(e.verticalFrequency??2));return[r[0]+Math.cos(a)*i,r[1]+o+s,r[2]+Math.sin(a)*i]}function zy(e){let t=[],n=e.seed||0;for(let r=0;r<e.count;r++){let i=Gy(r*7+1+n)*Math.PI*2,a=Gy(r*11+3+n)*.82+.08,o=e.radius*(.72+Gy(r*13+5+n)*.32),s=.7+Gy(r*19+n)*2;t.push({"@@id":`${e[`@@id`]}-${r}`,surface:e.surface,position:[Math.cos(i)*Math.cos(a)*o,Math.sin(a)*o,Math.sin(i)*Math.cos(a)*o],scale:[s,s,s]})}return t}function By(e){return e[`@@type`]===`torus`?Vy(e):e[`@@type`]===`crystal`?Hy(e):Uy(e)}function Vy(e){let t=e.majorRadius??1,n=e.minorRadius??.035,r=e.majorSegments??64,i=e.minorSegments??8,a=(r+1)*(i+1),o=new Float32Array(a*3),s=new Float32Array(a*3),c=new Uint32Array(r*i*6);for(let e=0;e<=r;e++){let a=e/r*Math.PI*2,c=Math.cos(a),l=Math.sin(a);for(let r=0;r<=i;r++){let a=r/i*Math.PI*2,u=Math.cos(a),d=Math.sin(a),f=(e*(i+1)+r)*3,p=t+n*u;o[f]=p*c,o[f+1]=n*d,o[f+2]=p*l,s[f]=u*c,s[f+1]=d,s[f+2]=u*l}}let l=0;for(let e=0;e<r;e++)for(let t=0;t<i;t++){let n=e*(i+1)+t,r=(e+1)*(i+1)+t;c[l++]=n,c[l++]=r,c[l++]=n+1,c[l++]=n+1,c[l++]=r,c[l++]=r+1}return{"vertex.position":o,"vertex.normal":s,"primitive.index":c}}function Hy(e){let t=e.radius??.5,n=e.height??1.8,r=e.sides??6,i=[],a=[];for(let e=0;e<r;e++){let o=e/r*Math.PI*2,s=(e+1)/r*Math.PI*2,c=[Math.cos(o)*t,0,Math.sin(o)*t],l=[Math.cos(s)*t,0,Math.sin(s)*t];Wy(i,a,[0,n*.66,0],l,c),Wy(i,a,[0,-n*.34,0],c,l)}return{"vertex.position":new Float32Array(i),"vertex.normal":new Float32Array(a)}}function Uy(e){let t=e.radius??.5,n=e.height??1,r=e.sides??12,i=Math.min(e.bevel??.11,n*.24),a=[],o=[];for(let e=0;e<r;e++){let s=e/r*Math.PI*2,c=(e+1)/r*Math.PI*2,l=(e,t,n)=>[Math.cos(e)*t,n,Math.sin(e)*t],u=l(s,t*.77,-n/2),d=l(c,t*.77,-n/2),f=l(s,t,-n/2+i),p=l(c,t,-n/2+i),m=l(s,t,n/2-i),h=l(c,t,n/2-i),g=l(s,t*.77,n/2),_=l(c,t*.77,n/2);Wy(a,o,u,f,p),Wy(a,o,u,p,d),Wy(a,o,f,m,h),Wy(a,o,f,h,p),Wy(a,o,m,g,_),Wy(a,o,m,_,h),Wy(a,o,[0,-n/2,0],u,d),Wy(a,o,[0,n/2,0],_,g)}return{"vertex.position":new Float32Array(a),"vertex.normal":new Float32Array(o)}}function Wy(e,t,n,r,i){let a=qy(r,n),o=qy(i,n),s=[a[1]*o[2]-a[2]*o[1],a[2]*o[0]-a[0]*o[2],a[0]*o[1]-a[1]*o[0]],c=Math.hypot(...s)||1,l=[s[0]/c,s[1]/c,s[2]/c];e.push(...n,...r,...i),t.push(...l,...l,...l)}function Gy(e){let t=Math.sin(e*91.7341+19.19)*43758.5453;return t-Math.floor(t)}function Ky(e){if(e.matrix)return e.matrix;let t=new D().translate(e.position||[0,0,0]);return e.rotation&&(t.rotateX(e.rotation[0]),t.rotateY(e.rotation[1]),t.rotateZ(e.rotation[2])),e.scale&&t.scale(e.scale),t}function qy(e,t){return[e[0]-t[0],e[1]-t[1],e[2]-t[2]]}function Jy(e,t,n){let r=e.get(t);if(!r)throw Error(`Unknown ${n} reference "${t}".`);return r}function Yy(e,t,n){if(!t)throw Error(`Every ${n} requires an "@@id".`);if(e.has(t))throw Error(`Duplicate ${n} identifier "${t}".`)}function Xy(e,t,n){if(!n.some(e=>e===t))throw Error(`Unsupported ${e} subtype "${t}". Expected ${n.join(`, `)}.`)}function Zy(e,t){return Qy(e||{},t)}function Qy(e,t,n=0){if(n>3)return t;let r={...e};for(let[e,i]of Object.entries(t))ze(i)?r[e]=Qy(r[e]||{},t[e],n+1):r[e]=t[e];return r}var $y=`master`;`${$y}`,`${$y}`;var eb=`beta`,tb=`latest`;function nb(){return typeof __VERSION__>`u`?tb:__VERSION__}var rb=nb();function ib(e,t){if(!e)throw Error(t||`loaders.gl assertion failed.`)}var ab={self:typeof self<`u`&&self,window:typeof window<`u`&&window,global:typeof global<`u`&&global,document:typeof document<`u`&&document};ab.self||ab.window||ab.global,ab.window||ab.self||ab.global,ab.global||ab.self||ab.window,ab.document;var ob=typeof process!=`object`||String(process)!==`[object process]`||process.browser,sb=typeof window<`u`&&window.orientation!==void 0,cb=typeof process<`u`&&process.version&&/v([0-9]*)/.exec(process.version);cb&&parseFloat(cb[1]);var lb=class{constructor(e,t){this.isRunning=!0,this.isCancelled=!1,this.failed=!1,this.postMessageMs=0,this.complete=()=>{},this.processStarted=!1,this._resolve=()=>{},this._reject=()=>{},this.name=e,this.workerThread=t,this.completion=new Promise(e=>{this.complete=e}),this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t,n){if(!this.isRunning||this.isCancelled)return;let r=performance.now();(e===`process`||e===`process-in-batches`||e===`preload`)&&(this.processStarted=!0);try{this.workerThread.postMessage({source:`loaders.gl`,type:e,payload:t},n)}finally{this.postMessageMs+=performance.now()-r}}done(e){this.isRunning&&(this.isRunning=!1,this.executionMs=e?.executionMs,clearTimeout(this.cancellationTimer),this.complete(),this.isCancelled||this._resolve(e))}error(e){this.isRunning&&(this.isRunning=!1,this.failed=!0,this.sharedState?.snapshot.cancelled&&(this.isCancelled=!0),clearTimeout(this.cancellationTimer),this.complete(),this._reject(e))}cancel(e,t=1e3){if(!this.isRunning||this.isCancelled)return;if(!Number.isFinite(t)||t<0){this.abort(RangeError(`cancellationTimeout must be finite and nonnegative`));return}this.isCancelled=!0,this.sharedState?.cancel();let n=arguments.length?e:ub(`Worker job "${this.name}" was cancelled`);if(!this.processStarted){this.error(n);return}this._reject(n);try{this.workerThread.postMessage({source:`loaders.gl`,type:`cancel`,payload:{}},[]),this.cancellationTimer=setTimeout(()=>this.abort(e),t)}catch(e){this.abort(e)}}abort(e){this.isRunning&&(this.isCancelled=!0,this.sharedState?.cancel(),this.workerThread.destroy(),this.error(arguments.length?e:ub(`Worker job "${this.name}" was aborted`)))}};function ub(e){let t=Error(e);return t.name=`AbortError`,t}var db=class{constructor(...e){let t=globalThis.process?.getBuiltinModule?.(`node:worker_threads`).Worker;if(t)return new t(...e)}terminate(){}};globalThis.process?.getBuiltinModule?.(`node:worker_threads`)?.parentPort;var fb=new Map;function pb(e){if(ib(e.source&&!e.url||!e.source&&e.url),e.url&&e.workerType===`module`){let t=globalThis.document?.baseURI??globalThis.location?.href;if(!t)return e.url;let n=new URL(e.url,t),r=globalThis.location?.origin;return/^https?:$/.test(n.protocol)&&n.origin!==r?hb(`import ${JSON.stringify(n.href)};`):e.url}let t=fb.get(e.source||e.url);return t||(e.url&&(t=mb(e.url),fb.set(e.url,t)),e.source&&(t=hb(e.source),fb.set(e.source,t))),ib(t),t}function mb(e){return e.startsWith(`http`)?hb(gb(e)):e}function hb(e){let t=new Blob([e],{type:`application/javascript`});return URL.createObjectURL(t)}function gb(e){return`\
try {
  importScripts('${e}');
} catch (error) {
  console.error(error);
  throw error;
}`}function _b(e,t=!0,n){let r=n||new Set,i=new Set;function a(e){if(!(!e||typeof e!=`object`||i.has(e))){if(i.add(e),vb(e))r.add(e);else if(ArrayBuffer.isView(e))vb(e.buffer)&&r.add(e.buffer);else if(t&&typeof MessageChannel<`u`&&e instanceof MessageChannel)a(e.port1),a(e.port2);else if(t&&e instanceof Map)for(let[t,n]of e)a(t),a(n);else if(t&&e instanceof Set)for(let t of e)a(t);else if(t)for(let t of Object.keys(e))a(e[t])}}return a(e),n===void 0?Array.from(r):[]}function vb(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}function yb(e){let t=new Map;function n(e){if(typeof e==`function`||e instanceof RegExp)return{};if(!e||typeof e!=`object`)return e;if(t.has(e))return t.get(e);if(ArrayBuffer.isView(e)||e instanceof ArrayBuffer||typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer||e instanceof Date||typeof WebAssembly<`u`&&e instanceof WebAssembly.Module||vb(e))return e;let r=e instanceof Map?new Map:e instanceof Set?new Set:Array.isArray(e)?[]:{};if(t.set(e,r),e instanceof Map)for(let[t,i]of e)r.set(n(t),n(i));else if(e instanceof Set)for(let t of e)r.add(n(t));else for(let t of Object.keys(e))Object.defineProperty(r,t,{value:n(e[t]),enumerable:!0,writable:!0,configurable:!0});return r}return e===null?{}:n(e)}var bb=()=>{},xb=class{static isSupported(){return typeof Worker<`u`&&ob||db!==void 0&&!ob}constructor(e){this.terminated=!1,this.createdAt=performance.now(),this._loadableURL=``;let{name:t,source:n,url:r,getUrl:i,loadWorker:a}=e;ib(n||r||i||a),this.name=t,this.source=n,this.url=r,this.workerType=e.workerType??`classic`,this.getUrl=i,this.loadWorker=a,this.onMessage=bb,this.onError=e=>console.log(e);let o=performance.now();this.worker=ob?this._createBrowserWorker():this._createNodeWorker(),this.creationTimeMs=performance.now()-o}destroy(){return this.onMessage=bb,this.onError=bb,this.terminated?this.termination??Promise.resolve():(this.terminated=!0,this.termination=Promise.resolve(this.worker.terminate()).then(()=>void 0).finally(()=>this.releaseModuleWorkerURL()),this.termination.catch(()=>void 0),this.termination)}unref(){!ob&&typeof this.worker.unref==`function`&&this.worker.unref()}ref(){!ob&&typeof this.worker.ref==`function`&&this.worker.ref()}get isRunning(){return!!this.onMessage}postMessage(e,t){t||=_b(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t=`Failed to load `;return t+=`worker ${this.name} from ${this.url||`built-in worker factory`}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){if(this.loadWorker)try{let e=this.loadWorker();if(e)return this._initializeBrowserWorker(e)}catch(e){if(!this.source&&!this.url&&!this.getUrl)throw e}let e=this.url||this.getUrl?.();this._loadableURL=pb({source:this.source,url:e,workerType:this.workerType}),this.workerType===`module`&&e&&this._loadableURL!==e&&this._loadableURL.startsWith(`blob:`)&&(this.ownedModuleWorkerURL=this._loadableURL);try{let e=new Worker(this._loadableURL,{name:this.name,type:this.workerType});return this._initializeBrowserWorker(e)}catch(e){throw this.releaseModuleWorkerURL(),e}}releaseModuleWorkerURL(){this.ownedModuleWorkerURL&&=(URL.revokeObjectURL(this.ownedModuleWorkerURL),void 0)}_initializeBrowserWorker(e){return e.onmessage=e=>{e.data?e.data.type===`ready`?this.startupTimeMs=performance.now()-this.createdAt:this.onMessage(e.data):this.onError(Error(`No data received`))},e.onerror=e=>{let t=this.onError,n=this._getErrorFromErrorEvent(e);this.destroy(),t(n)},e.onmessageerror=()=>{let e=this.onError;this.destroy(),e(Error(`Worker message could not be deserialized`))},e}_createNodeWorker(){let e;if(this.url){let t=this.url.includes(`:/`)||this.url.startsWith(`/`)?this.url:`./${this.url}`;e=new db(t.startsWith(`file:`)?new URL(t):t,{eval:!1,type:this.url.endsWith(`.ts`)||this.url.endsWith(`.mjs`)?`module`:`commonjs`})}else if(this.source)e=new db(this.source,{eval:!0});else throw Error(`no worker`);return e.on(`message`,e=>{e?.type===`ready`?this.startupTimeMs=performance.now()-this.createdAt:this.onMessage(e)}),e.on(`error`,e=>{this.terminated=!0,this.onError(e)}),this.termination=new Promise(t=>e.on(`exit`,()=>t())),e.on(`exit`,e=>{this.terminated||(this.terminated=!0,this.onError(Error(`Worker ${this.name} exited unexpectedly (code ${e})`)))}),e}},Sb=class{get stats(){return{...this.totals,queuedJobs:this.jobQueue.length,activeJobs:this.activeJobs.size,queuedBytes:this.queuedBytes+this.reservedBytes,inFlightBytes:this.inFlightBytes,pendingAdmissions:this.admissions.length,reservations:this.reservations.size}}reserve(e,t={}){let{signal:n}=t;return n?.aborted?Promise.reject(n.reason):this.isDestroyed?Promise.reject(Error(`Worker pool was destroyed`)):this.isClosing?Promise.reject(Error(`Worker pool is closing`)):!Number.isSafeInteger(e)||e<0||e>this.maxQueuedBytes||e>this.maxInFlightBytes?Promise.reject(RangeError(`Reservation exceeds worker byte budgets`)):this.maxQueuedJobs<1||this.admissions.length>=this.maxPendingAdmissions?Promise.reject(RangeError(`Worker admission queue is full`)):new Promise((t,r)=>{let i=()=>{let e=this.admissions.indexOf(a);e>=0&&this.admissions.splice(e,1),a.cleanup(),r(n?.reason),this._admit()},a={inputBytes:e,resolve:t,reject:r,cleanup:()=>n?.removeEventListener(`abort`,i)};this.admissions.push(a),n?.addEventListener(`abort`,i,{once:!0}),this._admit()})}_admit(){for(;!this.isDestroyed&&!this.isClosing&&this.admissions.length;){let e=this.admissions[0];if(e.inputBytes>this.maxQueuedBytes||e.inputBytes>this.maxInFlightBytes){this.admissions.shift(),e.cleanup(),e.reject(RangeError(`Reservation exceeds worker byte budgets`));continue}if(this.jobQueue.length+this.reservations.size>=this.maxQueuedJobs||e.inputBytes>this.maxQueuedBytes-this.queuedBytes-this.reservedBytes)return;this.admissions.shift(),e.cleanup();let t={inputBytes:e.inputBytes,release:()=>{this.reservations.delete(t)&&(this.reservedBytes-=t.inputBytes,this._admit())}};this.reservations.add(t),this.reservedBytes+=t.inputBytes,this.totals.peakQueuedBytes=Math.max(this.totals.peakQueuedBytes,this.queuedBytes+this.reservedBytes),e.resolve(t)}}static isSupported(){return xb.isSupported()}constructor(e){this.name=`unnamed`,this.maxConcurrency=1,this.maxMobileConcurrency=1,this.onDebug=()=>{},this.reuseWorkers=!0,this.props={},this.jobQueue=[],this.idleQueue=[],this.activeJobs=new Set,this.startingJobs=0,this.count=0,this.workers=new Set,this.queuedBytes=0,this.inFlightBytes=0,this.maxQueuedBytes=1/0,this.maxInFlightBytes=1/0,this.isDestroyed=!1,this.isClosing=!1,this.maxQueuedJobs=1/0,this.maxPendingAdmissions=128,this.priorityAgingMs=1e3,this.reservations=new Set,this.admissions=[],this.reservedBytes=0,this.totals={peakQueuedBytes:0,peakInFlightBytes:0,workersCreated:0,workerRestarts:0,completed:0,failed:0,cancelled:0},this.source=e.source,this.url=e.url,this.workerType=e.workerType,this.getUrl=e.getUrl,this.loadWorker=e.loadWorker,this.setProps(e)}close(e={}){if(this.closing)return this.closing;if(this.isDestroyed)return this.destroy();if(e.timeout!==void 0&&(!Number.isFinite(e.timeout)||e.timeout<0||e.timeout>2147483647))return Promise.reject(RangeError(`Close timeout must be between 0 and 2147483647 ms`));this.isClosing=!0;let t=Error(`Worker pool is closing`);this.admissions.splice(0).forEach(e=>{e.cleanup(),e.reject(t)}),this.reservations.clear(),this.reservedBytes=0;let n,r=new Promise(e=>{this.onDrained=e});return this.closing=(e.timeout===void 0?r:Promise.race([r,new Promise(t=>{n=setTimeout(t,e.timeout)})])).then(async()=>{clearTimeout(n),await this.destroy()}),this._checkDrained(),this.closing}_checkDrained(){this.isClosing&&!this.jobQueue.length&&!this.activeJobs.size&&!this.startingJobs&&this.onDrained?.()}destroy(e=Error(`Worker pool was destroyed`)){if(this.destruction)return this.destruction;let t=[...this.workers];this.isDestroyed=!0,this.onDrained?.(),this.activeJobs.forEach(t=>t.abort(e)),this.admissions.splice(0).forEach(t=>{t.cleanup(),t.reject(e)}),this.reservations.clear(),this.reservedBytes=0;let n=this.jobQueue.splice(0);return this.queuedBytes=0,n.forEach(t=>{t.removeAbortListener(),t.onReject(e)}),this.idleQueue.splice(0).forEach(e=>{e.destroy(),this.count--}),this.isDestroyed=!0,this.destruction=Promise.all(t.map(e=>e.destroy())).then(()=>{this.workers.clear()}),this.destruction.catch(()=>void 0),this.destruction}setProps(e){for(let t of[`maxQueuedBytes`,`maxInFlightBytes`,`maxQueuedJobs`,`maxPendingAdmissions`]){let n=e[t];if(n!==void 0&&(!(n>=0)||n!==1/0&&!Number.isSafeInteger(n)))throw RangeError(`${t} must be a nonnegative safe integer or Infinity`)}if(e.priorityAgingMs!==void 0&&(!Number.isFinite(e.priorityAgingMs)||e.priorityAgingMs<=0))throw RangeError(`priorityAgingMs must be positive and finite`);this.maxQueuedJobs=e.maxQueuedJobs??this.maxQueuedJobs,this.maxPendingAdmissions=e.maxPendingAdmissions??this.maxPendingAdmissions,this.priorityAgingMs=e.priorityAgingMs??this.priorityAgingMs,this.maxQueuedBytes=e.maxQueuedBytes??this.maxQueuedBytes,this.maxInFlightBytes=e.maxInFlightBytes??this.maxInFlightBytes,this.props={...this.props,...e},e.name!==void 0&&(this.name=e.name),e.maxConcurrency!==void 0&&(this.maxConcurrency=e.maxConcurrency),e.maxMobileConcurrency!==void 0&&(this.maxMobileConcurrency=e.maxMobileConcurrency),e.reuseWorkers!==void 0&&(this.reuseWorkers=e.reuseWorkers),e.onDebug!==void 0&&(this.onDebug=e.onDebug);for(let e of[...this.jobQueue])e.inputBytes>this.maxInFlightBytes&&(this.jobQueue.splice(this.jobQueue.indexOf(e),1),this.queuedBytes-=e.inputBytes,e.removeAbortListener(),e.onReject(RangeError(`Worker job exceeds maxInFlightBytes`)));this._admit(),this._startQueuedJob(),this._checkDrained()}get requiresInputBytes(){return this.maxQueuedBytes!==1/0||this.maxInFlightBytes!==1/0}async startJob(e,t=(e,t,n)=>e.done(n),n=(e,t)=>e.error(t),r,i={}){if(i.cancellationMode!==void 0&&![`terminate`,`cooperative`].includes(i.cancellationMode))throw Error(`Invalid worker cancellation mode`);if(i.cancellationTimeout!==void 0&&(!Number.isFinite(i.cancellationTimeout)||i.cancellationTimeout<0))throw RangeError(`cancellationTimeout must be finite and nonnegative`);if(r?.aborted)throw r.reason;if(this.isDestroyed)return Promise.reject(Error(`Worker pool was destroyed`));if(this.isClosing)return Promise.reject(Error(`Worker pool is closing`));let{inputBytes:a=0,priority:o=0}=i;if(!Number.isSafeInteger(a)||a<0||!Number.isFinite(o))throw RangeError(`Invalid worker scheduling inputBytes or priority`);if(a>this.maxInFlightBytes)throw RangeError(`Worker job exceeds maxInFlightBytes`);let s=i.admission;if(s&&(!this.reservations.has(s)||s.inputBytes!==a))throw Error(`Invalid or consumed worker admission`);let c=!this.jobQueue.length&&this.activeJobs.size<this._getMaxConcurrency()&&this.inFlightBytes+a<=this.maxInFlightBytes;if(!s&&!c&&(this.jobQueue.length+this.reservations.size>=this.maxQueuedJobs||a>this.maxQueuedBytes-this.queuedBytes-this.reservedBytes))throw RangeError(`Worker queue exceeds maxQueuedBytes or maxQueuedJobs`);s&&(this.reservations.delete(s),this.reservedBytes-=s.inputBytes);let l=new Promise((s,l)=>{let u=()=>{let e=this.jobQueue.indexOf(d);e>=0&&(this.jobQueue.splice(e,1),this.queuedBytes-=d.inputBytes,this._admit(),this._startQueuedJob(),d.removeAbortListener(),l(r?.reason),this._checkDrained())},d={name:e,inputBytes:a,priority:o,queuedAt:performance.now(),sharedState:i.sharedState,cancellationMode:i.cancellationMode,cancellationTimeout:i.cancellationTimeout,onMessage:t,onError:n,onStart:s,onReject:l,signal:r,removeAbortListener:()=>r?.removeEventListener(`abort`,u)},f=this.jobQueue.findIndex(e=>e.priority<o);return this.jobQueue.splice(f<0?this.jobQueue.length:f,0,d),this.queuedBytes+=a,c||(this.totals.peakQueuedBytes=Math.max(this.totals.peakQueuedBytes,this.queuedBytes+this.reservedBytes)),r?.addEventListener(`abort`,u,{once:!0}),this});return this._startQueuedJob(),await l}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=performance.now();if(this.jobQueue.sort((t,n)=>n.priority+Math.floor((e-n.queuedAt)/this.priorityAgingMs)-(t.priority+Math.floor((e-t.queuedAt)/this.priorityAgingMs))),this.jobQueue[0].inputBytes>this.maxInFlightBytes-this.inFlightBytes)return;let t;try{t=this._getAvailableWorker()}catch(e){let t=this.jobQueue.shift();t&&(this.queuedBytes-=t.inputBytes),this._admit(),t?.removeAbortListener(),t?.onReject(e),this._startQueuedJob(),this._checkDrained();return}if(!t)return;let n=this.jobQueue.shift();if(n){this.startingJobs++,this.queuedBytes-=n.inputBytes,this.inFlightBytes+=n.inputBytes,this.totals.peakInFlightBytes=Math.max(this.totals.peakInFlightBytes,this.inFlightBytes),this._admit();let e=performance.now();try{this.onDebug({message:`Starting job`,name:n.name,workerThread:t,backlog:this.jobQueue.length})}catch{}if(this.isDestroyed||t.terminated){this.startingJobs--,this.inFlightBytes-=n.inputBytes,n.removeAbortListener(),n.onReject(Error(`Worker pool was destroyed before job start`)),this.returnWorkerToQueue(t);return}let r=new lb(n.name,t);r.sharedState=n.sharedState,n.removeAbortListener();let i=()=>{n.cancellationMode===`cooperative`?r.cancel(n.signal?.reason,n.cancellationTimeout):r.abort(n.signal?.reason)};n.signal?.addEventListener(`abort`,i,{once:!0}),n.signal?.aborted&&i(),this.activeJobs.add(r),this.startingJobs--,t.ref(),t.onMessage=e=>{try{r.isRunning&&n.onMessage(r,e.type,e.payload)}catch(e){r.abort(e)}},t.onError=e=>{try{n.onError(r,e)}catch(e){r.abort(e)}},r.result.catch(()=>void 0),n.onStart(r),this._startQueuedJob();try{await r.completion}catch{}finally{n.signal?.removeEventListener(`abort`,i),this.activeJobs.delete(r),this.inFlightBytes-=n.inputBytes;let a=r.isCancelled?`cancelled`:r.failed?`failed`:`completed`;this.totals[a]++;let o={name:r.name,outcome:a,queueWaitMs:e-n.queuedAt,durationMs:performance.now()-e,workerCreationMs:t.creationTimeMs,workerStartupMs:t.startupTimeMs,postMessageMs:r.postMessageMs,executionMs:r.executionMs,inputBytes:n.inputBytes};try{this.props.onMetrics?.(o),this.props.performanceMarks&&typeof performance.measure==`function`&&performance.measure(`math.gl.worker:${r.name}`,{start:n.queuedAt,end:performance.now(),detail:o})}catch{}this._admit(),this.returnWorkerToQueue(t)}}else this.returnWorkerToQueue(t)}returnWorkerToQueue(e){e.terminated||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.terminated&&!this.isDestroyed&&this.totals.workerRestarts++,e.terminated||e.destroy(),e.destroy().then(()=>this.workers.delete(e)),this.count--):(e.unref(),this.idleQueue.push(e)),this.isDestroyed||this._startQueuedJob(),this._checkDrained()}_getAvailableWorker(){for(;this.idleQueue.length>0;){let e=this.idleQueue.shift();if(e&&(e.terminated||this.count>this._getMaxConcurrency()))e.terminated&&this.totals.workerRestarts++,e.destroy().then(()=>this.workers.delete(e)),this.count--;else if(e)return e}if(this.count<this._getMaxConcurrency()){this.count++;let e=`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`;try{let t=new xb({name:e,source:this.source,url:this.url,workerType:this.workerType,getUrl:this.getUrl,loadWorker:this.loadWorker});return this.totals.workersCreated++,this.workers.add(t),t}catch(e){throw this.count--,e}}return null}_getMaxConcurrency(){return sb?this.maxMobileConcurrency:this.maxConcurrency}},Cb={maxQueuedJobs:1/0,maxPendingAdmissions:128,priorityAgingMs:1e3,onMetrics:()=>{},performanceMarks:!1,maxQueuedBytes:1/0,maxInFlightBytes:1/0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}},wb=new WeakMap,Tb=1,Eb=class e{static isSupported(){return xb.isSupported()}static getWorkerFarm(t={}){return e._workerFarm=e._workerFarm||new e({}),e._workerFarm.setProps(t),e._workerFarm}constructor(e){this.workerPools=new Map,this.props={...Cb},this.setProps(e),this.workerPools=new Map}destroy(e){let t=[...this.workerPools.values()];return this.workerPools.clear(),Promise.all(t.map(t=>t.destroy(e))).then(()=>void 0)}setProps(e){let t={};for(let n of Object.keys(Cb))e[n]!==void 0&&(t[n]=e[n]);this.props={...this.props,...t};for(let e of this.workerPools.values())e.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:n,url:r,getUrl:i,loadWorker:a,workerType:o}=e,s=Db(e),c=this.workerPools.get(s);return c||(c=new Sb({name:t,source:n,url:r,getUrl:i,loadWorker:a,workerType:o}),c.setProps(this._getWorkerPoolProps()),this.workerPools.set(s,c)),c}_getWorkerPoolProps(){return{maxQueuedJobs:this.props.maxQueuedJobs,maxPendingAdmissions:this.props.maxPendingAdmissions,priorityAgingMs:this.props.priorityAgingMs,onMetrics:this.props.onMetrics,performanceMarks:this.props.performanceMarks,maxQueuedBytes:this.props.maxQueuedBytes,maxInFlightBytes:this.props.maxInFlightBytes,maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}};function Db(e){let{name:t,source:n,url:r,urlKey:i,loadWorker:a,workerType:o}=e;return[t,n?`source:${n}`:``,r||i?`url:${r||i}`:``,a?`loadWorker:${Ob(a)}`:``,`type:${o||`classic`}`].filter(Boolean).join(`|`)}function Ob(e){let t=wb.get(e);return t||(t=Tb++,wb.set(e,t)),t}var kb=class{constructor(){this._values=[],this._settlers=[],this._closed=!1}[Symbol.asyncIterator](){return this}push(e){return this.enqueue(e)}enqueue(e){if(this._closed)throw Error(`Closed`);if(this._settlers.length>0){if(this._values.length>0)throw Error(`Illegal internal state`);let t=this._settlers.shift();e instanceof Error?t.reject(e):t.resolve({value:e})}else this._values.push(e)}close(){for(;this._settlers.length>0;)this._settlers.shift().resolve({done:!0});this._closed=!0}next(){if(this._values.length>0){let e=this._values.shift();return e instanceof Error?Promise.reject(e):Promise.resolve({done:!1,value:e})}if(this._closed){if(this._settlers.length>0)throw Error(`Illegal internal state`);return Promise.resolve({done:!0,value:void 0})}return new Promise((e,t)=>{this._settlers.push({resolve:e,reject:t})})}},Ab=new Set;function jb(e){let t=e.version===rb?``:` (worker-utils@${rb})`;return`${e.name}@${e.version}${t}`}function Mb(e,t={}){let n=ob?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,r=Nb(e,t),i=t._workerType||t?.core?._workerType;if(!r&&i===`test`)if(ob)r=`modules/${e.module}/dist/${n}`;else{let t=e.module===`core`&&e.workerNode?.startsWith(`worker-utils/`)?`worker-utils/workers`:`workers`,n=e.workerSourceNode||`${t}/${e.id}-worker-node.ts`;r=`modules/${e.module}/src/${n}`}return r||null}function Nb(e,t={}){return(t[e.id]||{}).workerUrl||(e.id===`compression`?t.workerUrl:null)||null}function Pb(e,t={}){let n=Mb(e,t),r=typeof e.worker==`string`?e.worker:null,i=n||r||Fb(e,!0);return ib(i),i}function Fb(e,t=!1){let n=ob?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,r=e.version;r===`latest`&&(r=tb);let i=r?`@${r}`:``,a=`https://unpkg.com/${e.packageName||`@loaders.gl/${e.module}`}${i}/dist/${n}`;return t&&Ib(e,a),a}function Ib(e,t){if(e.version!==`latest`)return;let n=`${e.module}:${e.id}`;Ab.has(n)||(Ab.add(n),console.warn(`loaders.gl: ${e.name} loader worker version is "latest" because __VERSION__ was not injected. Fetching ${t} from CDN.`))}function Lb(){let e=typeof globalThis.crossOriginIsolated==`boolean`?globalThis.crossOriginIsolated:void 0,t={workers:xb.isSupported(),sharedMemory:!1,crossOriginIsolated:e};if(ob&&e!==!0)t.sharedMemoryUnavailableReason=`cross-origin-isolation`;else if(typeof SharedArrayBuffer>`u`||typeof Atomics>`u`||typeof structuredClone!=`function`)t.sharedMemoryUnavailableReason=`unsupported`;else try{let e=new SharedArrayBuffer(4),n=structuredClone(e);Atomics.store(new Int32Array(e),0,17),t.sharedMemory=Atomics.load(new Int32Array(n),0)===17,t.sharedMemory||(t.sharedMemoryUnavailableReason=`blocked`)}catch{t.sharedMemoryUnavailableReason=`blocked`}return t}var Rb=class{constructor(e){if(typeof SharedArrayBuffer>`u`||!(e instanceof SharedArrayBuffer)||e.byteLength!==16)throw Error(`Expected a 16-byte shared worker control buffer`);this.buffer=e,this.values=new Int32Array(e)}get snapshot(){return{cancelled:Atomics.load(this.values,0)!==0,completed:Atomics.load(this.values,1),total:Atomics.load(this.values,2),revision:Atomics.load(this.values,3)}}cancel(){Atomics.store(this.values,0,1),Atomics.add(this.values,3,1),Atomics.notify(this.values,0)}throwIfCancelled(){if(Atomics.load(this.values,0)!==0){let e=Error(`Shared worker task was cancelled`);throw e.name=`AbortError`,e}}setProgress(e,t=-1){if(!Number.isInteger(e)||e<0||e>2147483647||!Number.isInteger(t)||t<-1||t>2147483647)throw RangeError(`Shared progress requires nonnegative int32 counts (or total -1)`);Atomics.store(this.values,1,e),Atomics.store(this.values,2,t),Atomics.add(this.values,3,1)}};function zb(){if(!Lb().sharedMemory)return null;let e=new Rb(new SharedArrayBuffer(16));return e.setProgress(0),e}function Bb(e){if(e.sharedState===void 0&&e.cancellationMode===`cooperative`){let t=zb();return t?{...e,sharedState:t.buffer}:e}if(e.sharedState){if(!Lb().sharedMemory)throw Error(`Shared worker memory is unavailable`);new Rb(e.sharedState).throwIfCancelled()}return e}function Vb(e){let t=new Set,n=0;function r(e){if(!(!e||typeof e!=`object`||t.has(e)))if(t.add(e),ArrayBuffer.isView(e))r(e.buffer);else if(e instanceof ArrayBuffer||typeof SharedArrayBuffer<`u`&&e instanceof SharedArrayBuffer)n+=e.byteLength;else if(e instanceof Map)for(let[t,n]of e)r(t),r(n);else if(e instanceof Set)for(let t of e)r(t);else for(let t of Object.keys(e))r(e[t])}return r(e),n}function Hb(e){if(e!==void 0&&e!==`copy`&&e!==`transfer`)throw Error(`Invalid worker output ownership`)}async function Ub(e,t,n={},r={},i={}){if(Hb(n.outputOwnership),n.inputOwnership!==void 0&&![`copy`,`transfer`,`share`].includes(n.inputOwnership))throw Error(`Invalid worker input ownership`);n=Bb(n),Kb(n.signal),tx(n,[t,ex(n),i]);let a=jb(e),o=n.workerPool??Eb.getWorkerFarm(n).getWorkerPool(Zb(e,n,a)),s=n.jobName||e.name,c=await o.startJob(s,Qb.bind(null,r,n),void 0,n.signal,{inputBytes:Vb([t,nx(n),i]),priority:n.priority,admission:n.admission,sharedState:n.sharedState?new Rb(n.sharedState):void 0,cancellationMode:n.cancellationMode,cancellationTimeout:n.cancellationTimeout});try{n.signal?.aborted&&!c.isCancelled&&c.abort(qb(n.signal));let e=yb(ex(n)),r=yb(i);return c.isRunning&&c.postMessage(`process`,{input:t,options:e,context:r},n.inputOwnership===`copy`||n.inputOwnership===`share`?[]:void 0),(await c.result).result}catch(e){throw c.isCancelled||c.abort(e),e}}function Wb(e,t,n={},r={},i={}){if(Hb(n.outputOwnership),n.inputOwnership!==void 0&&![`copy`,`transfer`,`share`].includes(n.inputOwnership))throw Error(`Invalid worker input ownership`);return Gb(e,t,n,r,i)}async function*Gb(e,t,n,r,i){n=Bb(n),Kb(n.signal);let a=jb(e),o=n.workerPool??Eb.getWorkerFarm(n).getWorkerPool(Zb(e,n,a));tx(n,[ex(n),i]);let s=Vb([nx(n),i]),c=n.inputBytes??s;if(o.requiresInputBytes&&n.inputBytes===void 0)throw Error(`Byte-bounded batch sessions require inputBytes`);if(!Number.isSafeInteger(c)||c<s)throw RangeError(`Batch inputBytes must cover options and context buffers`);let l=new kb,u=Yb(t),d=!1,f=!1,p=!1,m=Promise.resolve(),h=Error(`Worker batch job failed`),g=()=>{!f&&!p&&(p=!0,Xb(u))},_=()=>{d||(d=!0,l.close())},v=e=>{d||(d=!0,l.enqueue(h),l.close())},y=await o.startJob(n.jobName||e.name,(e,t,i)=>{if(!(e.isCancelled&&t!==`done`&&t!==`error`))switch(t){case`progress`:$b(e,n,i);break;case`input-request`:m=m.then(async()=>{if(!e.isRunning)return;let t=await u.next();if(e.isRunning)if(t.done)f=!0,e.postMessage(`input-done`,{});else{if(tx(n,t.value),n.inputBytes!==void 0&&Vb(t.value)+s>c)throw RangeError(`Worker batch exceeds reserved inputBytes`);e.postMessage(`input-batch`,{input:t.value},n.inputOwnership===`copy`||n.inputOwnership===`share`?[]:void 0)}}).catch(t=>{e.isCancelled||e.abort(t)});break;case`output-batch`:l.push(i.result);break;case`done`:e.done(i),_();break;case`error`:{let t=Error(i.error||`Worker batch processing failed`);t.name=i.errorName||`Error`,e.error(t),v(t);break}case`process`:Qb(r,n,e,t,i);break;default:{let n=Error(`Unexpected worker batch message: ${t}`);e.error(n),v(n);break}}},void 0,n.signal,{inputBytes:c,priority:n.priority,admission:n.admission,sharedState:n.sharedState?new Rb(n.sharedState):void 0,cancellationMode:n.cancellationMode,cancellationTimeout:n.cancellationTimeout}).catch(e=>{throw g(),e});y.result.catch(e=>{v(e),g()});try{let e=ex(n);y.isRunning&&y.postMessage(`process-in-batches`,{options:yb(e),context:yb(i)},n.inputOwnership===`copy`||n.inputOwnership===`share`?[]:void 0);try{for await(let e of l)yield e,y.isRunning&&y.postMessage(`output-ack`,{})}catch(e){throw e===h&&await y.result,e}await y.result}finally{y.isRunning&&!y.isCancelled&&y.abort(Jb(`Worker batch iterator was closed`)),g()}}function Kb(e){if(e?.aborted)throw qb(e)}function qb(e){return e?e.reason:Jb(`Worker job was aborted`)}function Jb(e){let t=Error(e);return t.name=`AbortError`,t}function Yb(e){return Symbol.asyncIterator in e?e[Symbol.asyncIterator]():(async function*(){yield*e})()}function Xb(e){try{Promise.resolve(e.return?.()).catch(()=>void 0)}catch{}}function Zb(e,t,n){if(t.source)return{name:n,source:t.source,workerType:t.workerType};let r=Mb(e,t);return r?{name:n,url:r,workerType:t.workerType}:ob&&e.loadWorker?{name:n,workerType:t.workerType,loadWorker:e.loadWorker,getUrl:()=>Pb(e,t),urlKey:Fb(e)}:{name:n,url:Pb(e,t),workerType:t.workerType}}async function Qb(e,t,n,r,i){if(!(n.isCancelled&&r!==`done`&&r!==`error`))switch(r){case`progress`:$b(n,t,i);break;case`done`:n.done(i);break;case`error`:let a=Error(i.error);a.name=i.errorName||`Error`,n.error(a);break;case`process`:let{id:o,input:s,options:c}=i;try{if(!e.process){n.postMessage(`error`,{id:o,error:`Worker not set up to process on main thread`});return}let r=await e.process(s,{...c,signal:t.signal,onProgress:t.onProgress},void 0,i.context||{});n.postMessage(`done`,{id:o,result:r})}catch(e){let t=e instanceof Error?e.message:`unknown error`;n.postMessage(`error`,{id:o,error:t})}break;default:console.warn(`process-on-worker: unknown message ${r}`)}}function $b(e,t,n){if(!(!e.isRunning||e.isCancelled||!n.progress))try{t.onProgress?.(n.progress)}catch(t){e.abort(t)}}function ex(e){let{signal:t,onProgress:n,onMetrics:r,workerPool:i,admission:a,workerType:o,...s}=e;return s}function tx(e,t){if(e.inputOwnership===`share`&&_b(t).length)throw Error(`Share ownership requires SharedArrayBuffer storage; ordinary transferables are not allowed`)}function nx(e){let{sharedState:t,...n}=ex(e);return n}var rx=new WeakMap,ix=new WeakSet;function ax(e,t){if(!e.preload)return Promise.resolve();let n=rx.get(e);return n||(n=Promise.resolve().then(()=>e.preload()).then(()=>{ix.add(e)}),rx.set(e,n),n.catch(()=>rx.delete(e))),sx(n,t)}function ox(e){return!e.preload||ix.has(e)}function sx(e,t){return t?new Promise((n,r)=>{let i=()=>{t.removeEventListener(`abort`,i),r(t.reason)};t.addEventListener(`abort`,i,{once:!0}),t.aborted&&i(),e.then(e=>{t.removeEventListener(`abort`,i),n(e)},e=>{t.removeEventListener(`abort`,i),r(e)})}):e}function cx(e){if(!e||typeof e!=`object`||Object.getPrototypeOf(e)!==Object.prototype)throw TypeError(`Task payloads must be plain objects with named fields`)}function q(e,t=`copy`){if(cx(e),![`copy`,`transfer`,`share`].includes(t))throw TypeError(`Invalid input ownership`);let n=_b(e);if(t===`share`&&n.length)throw TypeError(`Share requires shared storage`);return structuredClone(e,{transfer:t===`transfer`?n:[]})}function lx(e,t={}){let n=t.signal??new AbortController().signal;return{state:e,signal:n,throwIfAborted:()=>{n.throwIfAborted(),t.throwIfAborted?.()},reportProgress:e=>t.reportProgress?.({...e,phase:e.phase??`process`,unit:e.unit??`items`})}}var ux=class{constructor(e){this.task=e,this.initialized=!1}async initialize(e,t={}){if(this.initialized)throw Error(`Task is already initialized`);return cx(e),await ax(this.task,t.signal),t.signal?.throwIfAborted(),this.state=await this.task.initialize?.(e,lx(void 0,t)),this.initialized=!0,{}}async destroy(){if(this.initialized){this.initialized=!1;let e=this.state;this.state=void 0,this.task.initialize&&await this.task.destroy?.(e)}return{}}async process(e,t,n={}){if(!this.initialized)throw Error(`Task is not initialized`);if(!this.task.process)throw Error(`Task has no atomic processor`);cx(e);let r=await this.task.process(e,t,lx(this.state,n));return cx(r),r}async*stream(e,t,n={}){if(!this.initialized)throw Error(`Task is not initialized`);if(!this.task.processInBatches)throw Error(`Task has no streaming processor`);for await(let r of this.task.processInBatches(e,t,lx(this.state,n)))cx(r),yield r}};function dx(e){return{signal:e.signal,reportProgress:t=>e.onProgress?.(t)}}function fx(e,t,n={}){if(!ox(e))throw Error(`Preload task on the main thread before runTaskSync`);if(`execution`in n)throw TypeError(`runTaskSync always runs on the calling thread`);if(!e.process)throw TypeError(`Task has no atomic processor`);for(let t of[e.initialize,e.process,e.destroy])if(t&&Object.prototype.toString.call(t)===`[object AsyncFunction]`)throw TypeError(`runTaskSync requires synchronous lifecycle hooks`);if(n.outputOwnership&&![`copy`,`transfer`].includes(n.outputOwnership))throw TypeError(`Invalid output ownership`);let r=lx(void 0,dx(n));r.throwIfAborted();let i=n.options??{};if(n.inputOwnership===`transfer`){let e=new Set(_b(i));if(_b(t).some(t=>e.has(t)))throw Error(`Transferred input aliases reusable options; use inputOwnership: copy`)}let a=q(i),o=q(n.initialization??{},n.initializationOwnership),s=!1,c,l=!1,u;try{let i=e.initialize?.(o,r);if(px(i))throw Promise.resolve(i).then(t=>e.destroy?.(t)).catch(()=>{}),TypeError(`runTaskSync initialize returned a promise`);r.state=i,s=!0,r.throwIfAborted();let c=q(t,n.inputOwnership),l=e.process(c,a,r);if(px(l))throw s=!1,Promise.resolve(l).catch(()=>{}).then(()=>{if(e.initialize)return e.destroy?.(r.state)}).catch(()=>{}),TypeError(`runTaskSync process returned a promise`);cx(l),r.throwIfAborted(),u=q(l,n.outputOwnership??`transfer`)}catch(e){l=!0,c=e}finally{if(s&&e.initialize)try{let t=e.destroy?.(r.state);if(px(t))throw Promise.resolve(t).catch(()=>{}),TypeError(`runTaskSync destroy returned a promise`)}catch(e){throw l?AggregateError([c,e],`Task processing and destruction failed`):e}}if(l)throw c;return u}function px(e){return!!(e&&(typeof e==`object`||typeof e==`function`)&&typeof e.then==`function`)}var mx=class{constructor(e,t,n){this.task=e,this.release=t,this.tail=Promise.resolve(),this.closed=!1,this.streams=new Set,this.invalid=!1,this.controller=new AbortController,this.runtime=new ux(e);let r=n.execution??`auto`;if(![`auto`,`main-thread`,`worker`].includes(r))throw TypeError(`Invalid execution mode`);if(r===`worker`&&!e.worker)throw Error(`Task has no worker`);if(r!==`main-thread`&&e.worker){let t=e.worker;if(!!t.url==!!t.create)throw Error(`Supply exactly one worker URL or factory`);this.pool=new Sb({name:e.id,url:t.url?.toString(),loadWorker:t.create,workerType:`module`,maxConcurrency:1,maxMobileConcurrency:1}),this.descriptor={id:e.id,name:e.id,module:`core`,version:`prototype`,options:{},worker:t.url?.toString()??!0,loadWorker:t.create,workerInBatches:t.capabilities.streaming}}}async initialize(e,t){try{cx(e),await this.enqueue(()=>this.invoke(`initialize`,e,{},t))}catch(e){throw await this.terminate(e),e}}runTask(e,...t){return this.enqueue(async()=>(this.checkCapability(`atomic`),this.invoke(`process`,e,t[0]?.options??{},t[0])))}async*runTasks(e,...t){yield*this.serialStream(async function*(n){n.checkCapability(`atomic`);for await(let r of _x(e,n.controls(t[0]).signal))yield await n.invoke(`process`,r,t[0]?.options??{},t[0])})}async*runTaskInBatches(e,...t){yield*this.serialStream(async function*(n){n.checkCapability(`streaming`);let r=n.controls(t[0]),i=q(t[0]?.options??{});async function*a(){for await(let n of _x(e,r.signal))r.signal?.throwIfAborted(),vx(n,t[0]?.options??{},r.inputOwnership),yield q(n,r.inputOwnership)}let o=!1;try{if(n.pool)await n.invoke(`stream-options`,{},i,r),yield*Wb(n.descriptor,a(),{...n.workerOptions(r),inputOwnership:`transfer`,workerInBatches:!0});else for await(let e of n.runtime.stream(a(),i,dx(r)))r.signal?.throwIfAborted(),yield q(e,r.outputOwnership??`transfer`);o=!0}catch(e){throw n.pool&&(n.invalid=!0,await n.pool.destroy(e)),e}finally{n.pool&&!o&&(n.invalid=!0)}})}close(){return this.closing||=(this.closed=!0,(async()=>{try{await this.tail,this.invalid||await this.invoke(`destroy`,{},{})}finally{try{await this.pool?.destroy()}finally{this.release()}}})()),this.closing}async terminate(e=Error(`Task terminated`)){this.controller.abort(e),this.pool&&(this.invalid=!0,await this.pool.destroy(e)),await Promise.allSettled([...this.streams].map(e=>e())),await this.close()}checkCapability(e){if(this.pool?!this.task.worker?.capabilities[e]:!(e===`atomic`?this.task.process:this.task.processInBatches))throw Error(`Task has no ${e} processor for this execution route`)}controls(e={}){if(e.outputOwnership&&![`copy`,`transfer`].includes(e.outputOwnership))throw TypeError(`Invalid output ownership`);return{...e,signal:e.signal?AbortSignal.any([e.signal,this.controller.signal]):this.controller.signal}}workerOptions(e){return{workerPool:this.pool,workerType:`module`,inputOwnership:e.inputOwnership??`copy`,outputOwnership:e.outputOwnership??`transfer`,signal:e.signal,onProgress:e.onProgress,cancellationMode:`terminate`}}async invoke(e,t,n,r={}){if(this.invalid)throw Error(`Initialized task is invalid; initialize a new instance`);let i=e===`destroy`?{}:this.controls(r);i.signal?.throwIfAborted(),cx(t),vx(t,n,i.inputOwnership);let a=q(n);if(this.pool)try{return await Ub(this.descriptor,{operation:e,input:q(t,i.inputOwnership),options:a},this.workerOptions({...i,inputOwnership:`transfer`}))}catch(e){throw this.invalid=!0,await this.pool.destroy(e),e}if(e===`destroy`)return this.runtime.destroy();let o=q(t,i.inputOwnership),s=dx(i);if(e===`initialize`){let e=await this.runtime.initialize(o,s);return i.signal?.throwIfAborted(),e}let c=await this.runtime.process(o,a,s);return i.signal?.throwIfAborted(),q(c,i.outputOwnership??`transfer`)}enqueue(e){if(this.closed)return Promise.reject(Error(`Initialized task is closed`));let t=this.tail.then(e);return this.tail=t.catch(()=>{}),t}async*serialStream(e){if(this.closed)throw Error(`Initialized task is closed`);let t=this.tail,n;if(this.tail=new Promise(e=>{n=e}),await t,this.controller.signal.aborted)throw n(),this.controller.signal.reason;let r=e(this)[Symbol.asyncIterator](),i,a=()=>(i??=(async()=>{try{await r.return?.()}finally{this.streams.delete(a),n()}})(),i);this.streams.add(a);try{for(;;){this.controller.signal.throwIfAborted();let e=await r.next();if(e.done)return;yield e.value}}finally{await a()}}},hx=class{constructor(e={}){if(this.active=new Set,this.count=0,this.waiters=[],this.closed=!1,this.initializing=new Set,this.iterations=new Set,this.maxConcurrency=e.maxConcurrency??1,!Number.isSafeInteger(this.maxConcurrency)||this.maxConcurrency<1)throw RangeError(`maxConcurrency must be a positive safe integer`)}runTaskSync(e,t,...n){if(this.closed)throw Error(`Task runner is closed`);if(this.count>=this.maxConcurrency)throw Error(`Task runner has no synchronous capacity`);this.count++;try{return fx(e,t,n[0])}finally{let e=this.waiters.shift();e?e.resolve():this.count--}}initializeTask(e,t,n={}){let r=this.open(e,t,n);return this.initializing.add(r),r.then(()=>this.initializing.delete(r),()=>this.initializing.delete(r)),r}async runTask(e,t,...n){let r=n[0]??{},i=await this.initializeTask(e,r.initialization??{},{...r,inputOwnership:r.initializationOwnership??`copy`});return gx(i,()=>i.runTask(t,r))}async*runTasks(e,t,...n){let r=n[0]??{};if(this.closed)throw Error(`Task runner is closed`);if(r.initializationOwnership===`transfer`)throw TypeError(`runTasks initialization is a reusable template; use copy or share`);let i=r.concurrency??1;if(!Number.isSafeInteger(i)||i<1||i>this.maxConcurrency)throw RangeError(`concurrency must be between 1 and maxConcurrency`);let a=[],o=new Set,s=[],c=new AbortController;this.iterations.add(c);let l=r.signal?AbortSignal.any([r.signal,c.signal]):c.signal,u=_x(t,l)[Symbol.asyncIterator](),d=!1,f;try{for(;!d||s.length;){l.throwIfAborted(),!d&&!f&&s.length<i&&(f=u.next().then(e=>({kind:`input`,next:e})));let t=await Promise.race([...s.length?[s[0]]:[],...f?[f]:[]]);if(t.kind===`result`){if(s.shift(),o.delete(t.handle),t.failed)throw t.error;yield t.value;continue}if(f=void 0,t.next.done){d=!0;continue}let n=a.find(e=>!o.has(e));if(!n&&(a.length===0||this.count<this.maxConcurrency)&&(n=await this.initializeTask(e,q(r.initialization??{},r.initializationOwnership),{...r,signal:l,inputOwnership:r.initializationOwnership??`copy`}),a.push(n)),!n){let e=await s.shift();if(o.delete(e.handle),e.failed)throw e.error;yield e.value,n=e.handle}o.add(n);let c=n;s.push(n.runTask(t.next.value,{...r,signal:l}).then(e=>({kind:`result`,handle:c,value:e}),e=>({kind:`result`,handle:c,failed:!0,error:e})))}}finally{this.iterations.delete(c),c.abort(Error(`Task iteration closed`));try{f&&await f.catch(()=>{}),d||await u.return?.()}finally{await Promise.all(s),await Promise.all(a.map(e=>e.close()))}}}async*runTaskInBatches(e,t,...n){let r=n[0]??{},i=await this.initializeTask(e,r.initialization??{},{...r,inputOwnership:r.initializationOwnership??`copy`});try{yield*i.runTaskInBatches(t,r)}finally{await i.close()}}close(){if(!this.closing){this.closed=!0;for(let e of this.waiters.splice(0))e.reject(Error(`Task runner is closed`));this.closing=(async()=>{await Promise.allSettled(this.initializing);let e=(await Promise.allSettled([...this.active].map(e=>e.close()))).find(e=>e.status===`rejected`);if(e?.status===`rejected`)throw e.reason})()}return this.closing}async terminate(e=Error(`Task runner terminated`)){for(let t of this.iterations)t.abort(e);let t=this.close();await Promise.allSettled([...this.active].map(t=>t.terminate(e))),await t}async open(e,t,n){if(this.closed)throw Error(`Task runner is closed`);n.signal?.throwIfAborted(),this.count>=this.maxConcurrency?await new Promise((e,t)=>{let r={resolve:()=>{a(),e()},reject:e=>{a(),t(e)}},i=()=>{this.waiters=this.waiters.filter(e=>e!==r),r.reject(n.signal?.reason)},a=()=>n.signal?.removeEventListener(`abort`,i);this.waiters.push(r),n.signal?.addEventListener(`abort`,i,{once:!0}),n.signal?.aborted&&i()}):this.count++;let r,i=!1,a=()=>{if(i)return;i=!0,r&&this.active.delete(r);let e=this.waiters.shift();e?e.resolve():this.count--};try{if(this.closed)throw Error(`Task runner is closed`);return r=new mx(e,a,n),this.active.add(r),await r.initialize(t,n),r}catch(e){throw a(),e}}};async function gx(e,t){let n;try{n=await t()}catch(t){try{await e.close()}catch(e){throw AggregateError([t,e],`Task processing and destruction failed`)}throw t}return await e.close(),n}async function*_x(e,t){let n=Symbol.asyncIterator in e?e[Symbol.asyncIterator]():e[Symbol.iterator](),r=!1,i=!1;try{for(;;){let e=await new Promise((e,r)=>{let a=()=>t?.removeEventListener(`abort`,o),o=()=>{a(),r(t?.reason)};if(t?.addEventListener(`abort`,o,{once:!0}),t?.aborted){o();return}try{i=!0,Promise.resolve(n.next()).then(t=>{i=!1,a(),e(t)},e=>{i=!1,a(),r(e)})}catch(e){i=!1,a(),r(e)}});if(e.done){r=!0;return}yield e.value}}finally{if(!r)if(i)try{Promise.resolve(n.return?.()).catch(()=>{})}catch{}else await n.return?.()}}function vx(e,t,n){if(n===`transfer`){let n=new Set(_b(t));if(_b(e).some(e=>n.has(e)))throw Error(`Transferred input aliases reusable options; use inputOwnership: copy`)}}function yx(e){return{...e,phase:e.phase??`process`,unit:e.unit??`items`}}var bx=new Set;function xx(e,t={}){let n=qe?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,r=Sx(e,t),i=t._workerType||t?.core?._workerType;if(!r&&i===`test`)if(qe)r=`modules/${e.module}/dist/${n}`;else{let t=e.module===`core`&&e.workerNode?.startsWith(`worker-utils/`)?`worker-utils/workers`:`workers`,n=e.workerSourceNode||`${t}/${e.id}-worker-node.ts`;r=`modules/${e.module}/src/${n}`}return r||null}function Sx(e,t={}){return(t[e.id]||{}).workerUrl||(e.id===`compression`?t.workerUrl:null)||null}function Cx(e,t={}){let n=xx(e,t),r=typeof e.worker==`string`?e.worker:null,i=n||r||wx(e,!0);return Ge(i),i}function wx(e,t=!1){let n=qe?e.workerFile||`${e.id}-worker.js`:e.workerNode||`${e.id}-worker-node.js`,r=e.version;r===`latest`&&(r=eb);let i=r?`@${r}`:``,a=`https://unpkg.com/@loaders.gl/${e.module}${i}/dist/${n}`;return t&&Tx(e,a),a}function Tx(e,t){if(e.version!==`latest`)return;let n=`${e.module}:${e.id}`;bx.has(n)||(bx.add(n),console.warn(`loaders.gl: ${e.name} loader worker version is "latest" because __VERSION__ was not injected. Fetching ${t} from CDN.`))}function Ex(e,t=!0,n){let r=n||new Set;if(e){if(Dx(e))r.add(e);else if(Dx(e.buffer))r.add(e.buffer);else if(!ArrayBuffer.isView(e)&&t&&typeof e==`object`)for(let n in e)Ex(e[n],t,r)}return n===void 0?Array.from(r):[]}function Dx(e){return e?e instanceof ArrayBuffer||typeof MessagePort<`u`&&e instanceof MessagePort||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas:!1}function Ox(e){if(e===null)return{};let t=Object.assign({},e);return Object.keys(t).forEach(n=>{e[n]!==null&&typeof e[n]==`object`&&!ArrayBuffer.isView(e[n])&&!(e[n]instanceof Array)?t[n]=Ox(e[n]):typeof t[n]==`function`||t[n]instanceof RegExp?t[n]={}:t[n]=e[n]}),t}var kx=new WeakMap,Ax=new Set,jx=new Map;function Mx(e,t={}){return!!((qe?typeof Worker<`u`:t._nodeWorkers)&&t.worker&&(e.worker||e.loadWorker||Sx(e,t)))}function Nx(e,t={}){return Mx(e,t)?t.workerInBatches===void 0?!!(e.workerInBatches&&!Sx(e,t)):t.workerInBatches:!1}async function Px(e,t,n={},r={},i={}){let a=await zx(e,n,r,i);try{return(await a.handle.runTask({value:t},{...Lx(n),options:Rx(n)})).value}finally{await a.close()}}async function*Fx(e,t,n={},r={},i={}){let a=Bx(t),o;try{o=await zx(e,n,r,i);for await(let e of o.handle.runTaskInBatches(a,{...Lx(n),options:Rx(n)}))yield e.value}finally{(a.return?.())?.catch(()=>{}),await o?.close()}}function Ix(e,t){if(t.source||t.core?.source)throw Error(`Inline legacy worker source is unsupported; use a TaskRunner worker URL or factory`);let n=!xx(e,t)&&qe?e.loadWorker:void 0,r=Cx(e,t);return{id:`${e.module}:${e.id}`,initialize:e=>e,worker:{...n?{create:()=>n()??Vx(r)}:{url:r},capabilities:{atomic:!0,streaming:!0}}}}function Lx(e){return{execution:`worker`,signal:e.signal,inputOwnership:e.inputOwnership??`transfer`,outputOwnership:e.outputOwnership??`transfer`,onProgress:e.onProgress?t=>e.onProgress?.(yx(t)):void 0}}function Rx(e){let{signal:t,onProgress:n,...r}=e;return Ox(r)}async function zx(e,t,n,r){t.signal?.throwIfAborted();let i=Ix(e,t),a=kx.get(e);a||(a={runner:new hx({maxConcurrency:Ke?t.maxMobileConcurrency??1:t.maxConcurrency??3}),requests:0},kx.set(e,a));let o=a,s=n.process?new MessageChannel:void 0,c=new AbortController,l=!1,u=()=>c.abort(t.signal?.reason);t.signal?.addEventListener(`abort`,u,{once:!0});let d=()=>{l=!0,t.signal?.removeEventListener(`abort`,u),c.abort(),s?.port1.close(),s?.port2.close()};s&&(s.port1.onmessage=async({data:e})=>{try{let t=await n.process(e.input,e.options,{signal:c.signal,throwIfAborted:()=>c.signal.throwIfAborted()},e.context);!l&&!c.signal.aborted&&s.port1.postMessage({identifier:e.identifier,value:t},Ex(t))}catch(t){if(l||c.signal.aborted)return;s.port1.postMessage({identifier:e.identifier,error:{name:t instanceof Error?t.name:`Error`,message:t instanceof Error?t.message:String(t)}})}},s.port1.start()),o.requests++,Ax.add(o);let f=!1,p=()=>{f||(f=!0,o.requests--,o.requests||Ax.delete(o))},m;try{m=await o.runner.initializeTask(i,{context:structuredClone(r),...s?{port:s.port2}:{}},{...Lx(t),inputOwnership:`transfer`})}catch(e){throw p(),d(),e}return{handle:m,async close(){try{await m.close()}finally{d(),p()}}}}function Bx(e){let t=Symbol.asyncIterator in e?e[Symbol.asyncIterator]():e[Symbol.iterator](),n=!1;return{[Symbol.asyncIterator](){return this},async next(){if(n)return{done:!0,value:void 0};let e=await t.next();return e.done||n?(n=!0,{done:!0,value:void 0}):{done:!1,value:{value:e.value}}},async return(){return n||(n=!0,await t.return?.()),{done:!0,value:void 0}}}}function Vx(e){let t=new URL(e,globalThis.document?.baseURI??globalThis.location.href),n=t.href;if(/^https?:$/.test(t.protocol)&&t.origin!==globalThis.location.origin){let e=jx.get(t.href);e||(e=URL.createObjectURL(new Blob([`import ${JSON.stringify(t.href)};`],{type:`application/javascript`})),jx.set(t.href,e)),n=e}return new Worker(n,{type:`module`})}function Hx(e,t=We){Ge(e,`no worker provided`);let n=e.version;return!(!t||!n)}function Ux(e,t){let n=t?.[e.id]?.workerUrl;if(t?.core?.worker===!1||!(e.worker||e.loadWorker||n)||t?.core?.credentials?.some(e=>e.type===`request`||`token`in e&&typeof e.token==`function`)||e.id===`shapefile`&&(typeof t?.fetch==`function`||typeof t?.core?.fetch==`function`))return!1;let r=Zx(t),i=r._nodeWorkers;return!qe&&!i||e.id===`csv`&&!eS(t)?!1:!!Mx(e,r)}function Wx(e,t){let n=t?.parquet;return e.id===`parquet`&&typeof n?.keyRetriever==`function`?!1:!!(e.workerInBatches&&Ux(e,t)&&Nx(e,Zx(t)))}function Gx(e,t,n,r,i=e){if(!Ux(e,n))return!1;if(n?.core?.worker!==`auto`||!i.getWorkerEstimate)return!0;try{let e=i.getWorkerEstimate(t,n,r);return e===void 0||!Number.isFinite(e)||e<0||e>1?!0:e>=(n.core?.workerThreshold??.1)}catch{return!0}}async function Kx(e,t,n,r,i,a){let o=a||Jx(n)||r?.signal,s=await Px(e,t,{...Zx(n,e),signal:o,onProgress:n?.onProgress||r?.reportProgress},{process:async(t,a,o,s)=>{if(!i)throw Error(`Worker not set up to parse on main thread`);let{_loaderIds:c,_loaderIsArray:l,...u}=s||{};return await Yx(i,t,a,r||s||o?.signal?{...r,...u,signal:o?.signal??r?.signal}:void 0,Xx(e,c,l,r,n))}},$x(r));return tS(e)?e.deserializeWorkerResult(s,n,r):s}async function*qx(e,t,n,r,i,a){let o=a||Jx(n)||r?.signal,s=Fx(e,t,{...Zx(n,e),signal:o,onProgress:n?.onProgress||r?.reportProgress},{process:async(t,a,o,s)=>{if(!i)throw Error(`Worker not set up to parse on main thread`);let{_loaderIds:c,_loaderIsArray:l,...u}=s||{};return await Yx(i,t,a,r||s||o?.signal?{...r,...u,signal:o?.signal??r?.signal}:void 0,Xx(e,c,l,r,n))}},$x(r));for await(let t of s)yield e.deserializeWorkerBatch?e.deserializeWorkerBatch(t,n,r):t}function Jx(e){if(e?.signal)return e.signal;let t=e?.parquet?.signal;if(typeof AbortSignal<`u`&&t instanceof AbortSignal)return t}function Yx(e,t,n,r,i){return!i&&e.length<=2?e(t,n):e(t,i,n,r)}function Xx(e,t,n,r,i){if(!t)return;let a=new Map,o=new Set;for(let t of[e,...r?.loaders||[]])c(t);let s=t.map(e=>{let t=a.get(e);if(!t)throw Error(`Worker requested unknown loader "${e}". Declare it in loader.subloaders or pass it in context.loaders.`);return t});return n?s:s[0];function c(e){if(!o.has(e)){o.add(e),a.set(e.id,e);for(let[t,n]of Object.entries(e.subloaders||{})){let e=i?.core?.subloaders?.[t]||n;c(e),a.set(n.id,e)}}}}function Zx(e={},t){let n=t?.serializeWorkerOptions?.(e)||e,r={...n,signal:void 0,onProgress:void 0,...n.core?{core:{...n.core,authentications:void 0}}:{}},i=JSON.parse(JSON.stringify(r,(e,t)=>{if(typeof Headers<`u`&&t instanceof Headers)return Object.fromEntries(t.entries());if(!(typeof AbortSignal<`u`&&t instanceof AbortSignal))return typeof t==`bigint`?null:t}));Qx(r,i);let a={...i.core,...i};return a.worker===`auto`&&(a.worker=!0),t&&(a._workerLoaderId=t.id),a}function Qx(e,t){if(!(!t||typeof t!=`object`))for(let n of Object.keys(t)){let r=e?.[n];typeof r==`bigint`?t[n]=r:Qx(r,t[n])}}function $x(e){if(!e)return{};let{fetch:t,loaders:n,coreApi:r,signal:i,reportProgress:a,_parse:o,_parseSync:s,_parseInBatches:c,...l}=e;return JSON.parse(JSON.stringify(l))}function eS(e){let t=e;return(t?.csv?.shape??t?.core?.shape)===`arrow-table`}function tS(e){return typeof e.deserializeWorkerResult==`function`}async function nS(e){let t=[];for await(let n of e)t.push(rS(n));return Ie(...t)}function rS(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:n,byteLength:r}=e;return iS(t,n,r)}return iS(e)}function iS(e,t=0,n=e.byteLength-t){let r=new Uint8Array(e,t,n),i=new Uint8Array(r.length);return i.set(r),i.buffer}function aS(e,t=[]){return e.every(cS)?e:e.map((e,n)=>{if(cS(e))return e;let r=t.find(t=>t.type===e?.type);if(!r)throw Error(`No authentication class registered for credential at index ${n}.`);let i;try{i=new r(e)}catch{throw Error(`Invalid authentication configuration at index ${n}.`)}if(!cS(i))throw Error(`Authentication class returned an invalid credential at index ${n}.`);return i})}function oS(e){if(!e.core?.credentials?.length)return e;let t=aS(e.core.credentials,e.core.authentications);return t===e.core.credentials?e:{...e,core:{...e.core,credentials:t}}}async function sS(e,t,n){if(!n.core?.credentials?.length||n.core.credentials.every(cS))return n;let r=await e?.getAuthentications?.(t,n);return r?.length?oS({...n,core:{...n.core,authentications:[...n.core?.authentications||[],...r]}}):oS(n)}function cS(e){return!e||typeof e!=`object`||typeof e.id!=`string`||!Array.isArray(e.origins)?!1:e.type===`request`?typeof e.authenticate==`function`:(e.type===`header`||e.type===`query-parameter`)&&typeof e.name==`string`&&(typeof e.token==`string`||typeof e.token==`function`)&&Array.isArray(e.refreshStatusCodes)}var lS=Symbol(`loaders.gl.authenticated-fetch`),uS=new WeakMap;function dS(e){let t=e.fetch||((e,t)=>fetch(e,t)),n=t[lS],r=new Map(n?.credentialResolutions),i=aS(e.credentials.map(e=>r.get(e)||e),e.authentications);if(e.credentials.forEach((e,t)=>{r.set(e,i[t])}),!e.fetchOptions&&(!i.length||n?.credentials.length===i.length&&i.every((e,t)=>e===n.credentials[t])))return t;let a=n?.fetch||t,o=n?[...new Set([...i,...n.credentials])]:i,s=fS(n?.fetchOptions||{},e.fetchOptions),c=o.filter(e=>e.type!==`request`),l=o.filter(e=>e.type===`request`);for(let e of l)hS(e.origins);let u=async(e,t={})=>{if(t=fS(s,t),t.signal?.throwIfAborted(),!o.length)return a(e,t);let n=yS(e),r=n?await gS(n,t,c):{url:e,options:t,credentials:[]},i=await pS(r,l,`request`),u=await a(i.url,i.options),d=[];for(let n of r.credentials){let{credential:r}=n;typeof r.token==`function`&&(bS(t)||r.canReplayRequest?.(e,t))&&(bS(i.options)||r.canReplayRequest?.(i.url,i.options))&&(r.refreshStatusCodes.includes(u.status)||await r.shouldRefresh?.(u))&&d.push(n)}let f=bS(t)&&bS(i.options)&&i.credentials.some(e=>e.refreshStatusCodes?.includes(u.status));if(!d.length&&!f)return u;t.signal?.throwIfAborted();let p=new Map;if(await Promise.all(d.map(async({credential:t})=>{let n=await _S(t,e,u);n&&p.set(t,n)})),!p.size&&!f)return u;await u.body?.cancel().catch(()=>{}),t.signal?.throwIfAborted();let m=await pS(n?await gS(n,t,c,p,r.credentials):{url:e,options:t},l,`retry`,u);return a(m.url,m.options)};return Object.defineProperty(u,lS,{value:{fetch:a,credentials:o,credentialResolutions:r,fetchOptions:s}}),u}function fS(e,t){let n={...e,...t};if(e.headers||t?.headers){let r=new Headers(e.headers);new Headers(t?.headers).forEach((e,t)=>r.set(t,e)),n.headers=r}return n}async function pS(e,t,n,r){let i=[],a=e.options.signal;for(let o of t){let t=mS(e.url);if(!t||!hS(o.origins).includes(t))continue;a?.throwIfAborted();let s=await o.authenticate({url:e.url,options:{...e.options,headers:new Headers(e.options.headers)},reason:n,response:r?{status:r.status,headers:new Headers(r.headers)}:void 0});if(!s||typeof s.url!=`string`||!s.options||typeof s.options!=`object`)throw Error(`Authentication callback returned an invalid request.`);e={url:s.url,options:{...s.options,...a?{signal:a}:{}}},i.push(o)}return a?.throwIfAborted(),{...e,credentials:i}}function mS(e){try{let t=new URL(e);return!t.host||t.username||t.password?null:t.origin===`null`?`${t.protocol}//${t.host}`:t.origin}catch{return null}}function hS(e){if(!e.length)throw Error(`Request authentication requires at least one exact origin.`);return e.map(e=>{let t=mS(e),n;try{n=new URL(e)}catch{throw Error(`Invalid request authentication origin.`)}if(!t||n.pathname&&n.pathname!==`/`||n.search||n.hash)throw Error(`Invalid request authentication origin.`);return t})}async function gS(e,t,n,r=new Map,i=[]){let a=new URL(e),o=new Headers(t.headers),s=[],c=new Map(i.map(({credential:e,token:t})=>[e,t]));for(let t of n){if(!t.origins.includes(a.origin))continue;let n=r.get(t),i=c.get(t),l=t.type===`query-parameter`&&i!==void 0,u=t.type===`header`&&i!==void 0;if(t.type===`query-parameter`&&a.searchParams.has(t.name)&&!l||t.type===`header`&&o.has(t.name)&&!u)continue;let d=n??i??await vS(t.token,{url:e.toString(),reason:`request`});d&&(t.type===`query-parameter`?a.searchParams.set(t.name,d):o.set(t.name,`${t.prefix||``}${d}`),s.push({credential:t,token:d}))}return{url:a.toString(),options:{...t,headers:o},credentials:s}}async function _S(e,t,n){let r=uS.get(e);if(r)return r;let i=e.token,a=Promise.resolve(i({url:t,reason:`refresh`,response:{status:n.status,headers:n.headers}})).finally(()=>uS.delete(e));return uS.set(e,a),a}async function vS(e,t){return typeof e==`function`?e(t):e}function yS(e){try{let t=new URL(e);return[`http:`,`https:`].includes(t.protocol)?t:null}catch{return null}}function bS(e){let t=(e.method||`GET`).toUpperCase();return[`GET`,`HEAD`,`OPTIONS`,`PUT`,`DELETE`].includes(t)?!(e.body&&typeof ReadableStream<`u`&&e.body instanceof ReadableStream):!1}function J(e){return!!(e&&typeof e==`object`&&`createDataSource`in e)}var xS=class extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response},SS=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,CS=/^([-\w.]+\/[-\w.+]+)/;function wS(e,t){return e.toLowerCase()===t.toLowerCase()}function TS(e){let t=CS.exec(e);return t?t[1]:e}function ES(e){let t=SS.exec(e);return t?t[1]:``}var DS=/\?.*/;function OS(e){let t=e.match(DS);return t&&t[0]}function kS(e){return e.replace(DS,``)}function AS(e){if(e.length<50)return e;let t=e.slice(e.length-15);return`${e.substr(0,32)}...${t}`}function jS(e){return Re(e)?e.url:O(e)?(`name`in e?e.name:``)||``:typeof e==`string`?e:``}function MS(e){if(Re(e)){let t=e.headers.get(`content-type`)||``,n=kS(e.url);return TS(t)||ES(n)}return O(e)?e.type||``:typeof e==`string`?ES(e):``}function NS(e){return Re(e)?e.headers[`content-length`]||-1:O(e)?e.size:typeof e==`string`?e.length:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?e.byteLength:-1}async function PS(e){if(Re(e))return e;let t={},n=NS(e);n>=0&&(t[`content-length`]=String(n));let r=jS(e),i=MS(e);i&&(t[`content-type`]=i);let a=await LS(e);a&&(t[`x-first-bytes`]=a),typeof e==`string`&&(e=new TextEncoder().encode(e));let o=new Response(e,{headers:t});return Object.defineProperty(o,`url`,{value:r}),o}async function FS(e){if(!e.ok)throw await IS(e)}async function IS(e){let t=AS(e.url),n=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;n=n.length>100?`${n.slice(0,100)}...`:n;let r={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get(`Content-Type`);r.reason=!e.bodyUsed&&t?.includes(`application/json`)?await e.json():await e.text()}catch{}return new xS(n,r)}async function LS(e){if(typeof e==`string`)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let n=new FileReader;n.onload=t=>e(t?.target?.result),n.readAsDataURL(t)})}return e instanceof ArrayBuffer?`data:base64,${Ee(e.slice(0,5))}`:null}function RS(e){return!zS(e)&&!BS(e)}function zS(e){return e.startsWith(`http:`)||e.startsWith(`https:`)}function BS(e){return e.startsWith(`data:`)}async function VS(e,t){if(typeof e==`string`){let n=Je(e);return RS(n)&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(n,t):await fetch(n,t)}return await PS(e)}var HS=new t({id:`loaders.gl`}),US=class{log(){return()=>{}}info(){return()=>{}}once(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}},WS={searchParams:void 0,core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,shape:void 0,log:new class{console;onceMessages=new Set;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}once(...e){let t=String(e[0]);return this.onceMessages.has(t)?()=>{}:(this.onceMessages.add(t),this.console.info.bind(this.console,...e))}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,subloaders:void 0,CDN:`https://unpkg.com/@loaders.gl`,worker:!0,workerThreshold:.1,workerInBatches:void 0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:He,_nodeWorkers:!1,_workerType:``,limit:0,_limitMB:0,batchSize:`auto`,batchDebounceMs:0,metadata:!1,transforms:[]}},GS={baseUri:`core.baseUrl`,fetch:`core.fetch`,mimeType:`core.mimeType`,fallbackMimeType:`core.fallbackMimeType`,ignoreRegisteredLoaders:`core.ignoreRegisteredLoaders`,nothrow:`core.nothrow`,log:`core.log`,useLocalLibraries:`core.useLocalLibraries`,CDN:`core.CDN`,worker:`core.worker`,maxConcurrency:`core.maxConcurrency`,maxMobileConcurrency:`core.maxMobileConcurrency`,reuseWorkers:`core.reuseWorkers`,_nodeWorkers:`core.nodeWorkers`,_workerType:`core._workerType`,_worker:`core._workerType`,limit:`core.limit`,_limitMB:`core._limitMB`,shape:`core.shape`,batchSize:`core.batchSize`,batchDebounceMs:`core.batchDebounceMs`,metadata:`core.metadata`,transforms:`core.transforms`,throws:`nothrow`,dataType:`(no longer used)`,uri:`core.baseUrl`,method:`core.fetch.method`,headers:`core.fetch.headers`,body:`core.fetch.body`,mode:`core.fetch.mode`,credentials:`core.fetch.credentials`,cache:`core.fetch.cache`,redirect:`core.fetch.redirect`,referrer:`core.fetch.referrer`,referrerPolicy:`core.fetch.referrerPolicy`,integrity:`core.fetch.integrity`,keepalive:`core.fetch.keepalive`,signal:`core.fetch.signal`},KS=[`baseUrl`,`fetch`,`mimeType`,`fallbackMimeType`,`ignoreRegisteredLoaders`,`nothrow`,`log`,`useLocalLibraries`,`CDN`,`worker`,`workerThreshold`,`maxConcurrency`,`maxMobileConcurrency`,`reuseWorkers`,`workerTransferBufferCopy`,`_nodeWorkers`,`_workerType`,`limit`,`_limitMB`,`shape`,`batchSize`,`batchDebounceMs`,`metadata`,`transforms`];function qS(e,t){let n=t?.searchParams;if(!n||Object.keys(n).length===0||/^(?:data|blob):/i.test(e))return e;let r=e.indexOf(`#`),i=r>=0?e.slice(r):``,a=r>=0?e.slice(0,r):e,o=a.indexOf(`?`),s=o>=0?a.slice(0,o):a,c=o>=0?a.slice(o+1):``,l=new URLSearchParams(c),u=new URLSearchParams;for(let[e,t]of Object.entries(n))l.has(e)||u.set(e,String(t));let d=u.toString();return`${s}${o>=0?`?${c}`:``}${d?`${o>=0?`&`:`?`}${d}`:``}${i}`}function JS(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||={},e._state}function YS(){let e=JS();return e.globalOptions=e.globalOptions||{...WS,core:{...WS.core}},ZS(e.globalOptions)}function XS(e,t,n,r){n||=[],n=Array.isArray(n)?n:[n],QS(e,n),$S(e);let i=ZS(nC(t,e,r));return $S(i),i}function ZS(e){let t=oC(e);sC(t);for(let e of KS)t.core&&t.core[e]!==void 0&&delete t[e];return t.core&&t.core._workerType!==void 0&&delete t._worker,t}function QS(e,t){eC(e,null,WS,GS,t);for(let n of t){let r=e&&e[n.id]||{},i=n.options&&n.options[n.id]||{},a=n.deprecatedOptions&&n.deprecatedOptions[n.id]||{};eC(r,n.id,i,a,t)}}function $S(e){let t=e.core?.workerThreshold;if(t!==void 0&&(!Number.isFinite(t)||t<0||t>1))throw Error(`core.workerThreshold must be a finite number between 0 and 1`)}function eC(e,t,n,r,i){let a=t||`Top level`,o=t?`${t}.`:``;for(let s in e){let c=!t&&Ce(e[s]),l=!t&&[`baseUri`,`signal`,`onProgress`].includes(s),u=s===`workerUrl`&&t;if(!(s in n)&&!l&&!u){if(s in r)HS.level>0&&HS.warn(`${a} loader option \'${o}${s}\' no longer supported, use \'${r[s]}\'`)();else if(!c&&HS.level>0){let e=tC(s,i);HS.warn(`${a} loader option \'${o}${s}\' not recognized. ${e}`)()}}}}function tC(e,t){let n=e.toLowerCase(),r=``;for(let i of t)for(let t in i.options){if(e===t)return`Did you mean \'${i.id}.${t}\'?`;let a=t.toLowerCase();(n.startsWith(a)||a.startsWith(n))&&(r||=`Did you mean \'${i.id}.${t}\'?`)}return r}function nC(e,t,n){let r=e.options||{},i={...r};r.core&&(i.core={...r.core}),sC(i),i.core?.log===null&&(i.core={...i.core,log:new US}),iC(i,ZS(YS()));let a=ZS(t);return iC(i,a),rC(i,a,e),aC(i,n),cC(i),i}function rC(e,t,n){let r=e.core?.shape;if(r===void 0)return;let i=n.options?.[n.id];if(!ze(i)||!(`shape`in i))return;let a=YS()[n.id];if(ze(a)&&`shape`in a)return;let o=t[n.id];if(ze(o)&&`shape`in o)return;let s=e[n.id];e[n.id]={...ze(s)?s:{},shape:r}}function iC(e,t){for(let n in t)if(n in t){let r=t[n];ze(r)&&ze(e[n])?e[n]={...e[n],...t[n]}:e[n]=t[n]}}function aC(e,t){t&&e.core?.baseUrl===void 0&&(e.core||={},e.core.baseUrl=Xe(kS(t)))}function oC(e){let t={...e};return e.core&&(t.core={...e.core}),t}function sC(e){e.baseUri!==void 0&&(e.core||={},e.core.baseUrl===void 0&&(e.core.baseUrl=e.baseUri));for(let t of KS)if(e[t]!==void 0){e.core||={};let n=e.core;n[t]===void 0&&(n[t]=e[t])}let t=e._worker;t!==void 0&&(e.core||={},e.core._workerType===void 0&&(e.core._workerType=t))}function cC(e){let t=e.core;if(t)for(let n of KS)t[n]!==void 0&&(e[n]=t[n])}function lC(e){return e?(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions)):!1}function uC(e){Ve(e,`null loader`),Ve(lC(e),`invalid loader`);let t;return Array.isArray(e)&&(t=e[1],e=e[0],e={...e,options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}var dC=()=>{let e=JS();return e.loaderRegistry=e.loaderRegistry||[],e.loaderRegistry};function fC(){return dC()}var pC=/\.([^.]+)$/;async function mC(e,t=[],n,r){if(!vC(e))return null;let i=ZS(n||{});if(i.core||={},e instanceof Response&&hC(e)){let n=gC(await e.clone().text(),t,{...i,core:{...i.core,nothrow:!0}},r);if(n)return n}let a=gC(e,t,{...i,core:{...i.core,nothrow:!0}},r);if(a)return a;if(O(e)&&(e=await e.slice(0,10).arrayBuffer(),a=gC(e,t,i,r)),!a&&e instanceof Response&&hC(e)&&(a=gC(await e.clone().text(),t,i,r)),!a&&!i.core.nothrow)throw Error(yC(e));return a}function hC(e){let t=MS(e);return!!(t&&(t.startsWith(`text/`)||t===`application/json`||t.endsWith(`+json`)))}function gC(e,t=[],n,r){if(!vC(e))return null;let i=ZS(n||{});if(i.core||={},t&&!Array.isArray(t))return uC(t);let a=[];t&&(a=a.concat(t)),i.core.ignoreRegisteredLoaders||a.push(...fC()),bC(a);let o=_C(e,a,i,r);if(!o&&!i.core.nothrow)throw Error(yC(e));return o}function _C(e,t,n,r){let i=jS(e),a=MS(e),o=kS(i)||r?.url,s=null,c=``,l=n?.core&&`type`in n.core?n.core.type:void 0;return l&&l!==`auto`&&(s=CC(t,l),c=s?`match forced by supplied source type ${l}`:``),n?.core?.mimeType&&(s=EC(t,n?.core?.mimeType),c=`match forced by supplied MIME type ${n?.core?.mimeType}`),s||=wC(t,o),c||=s?`matched source url ${o}`:``,s||=xC(t,o),c||=s?`matched url ${o}`:``,s||=EC(t,a),c||=s?`matched MIME type ${a}`:``,s||=DC(t,e),c||=s?`matched initial data ${jC(e)}`:``,!s&&O(e)&&(s=TC(t,e),c||=s?`matched source testData`:``),n?.core?.fallbackMimeType&&(s||=EC(t,n?.core?.fallbackMimeType),c||=s?`matched fallback MIME type ${a}`:``),c&&Ue.log(1,`selectLoader selected ${s?.name}: ${c}.`),s}function vC(e){return!(e instanceof Response&&e.status===204)}function yC(e){let t=jS(e),n=MS(e),r=`No valid loader found (`;r+=t?`${Ye(t)}, `:`no url provided, `,r+=`MIME type: ${n?`"${n}"`:`not provided`}, `;let i=e?jC(e):``;return r+=i?` first bytes: "${i}"`:`first bytes: not available`,r+=`)`,r}function bC(e){for(let t of e)uC(t)}function xC(e,t){let n=t&&pC.exec(t),r=n&&n[1];return r?SC(e,r):null}function SC(e,t){t=t.toLowerCase();for(let n of e)for(let e of n.extensions)if(e.toLowerCase()===t)return n;return null}function CC(e,t){for(let n of e)if(J(n)&&n.type===t)return n;return null}function wC(e,t){if(!t)return null;for(let n of e)if(J(n)&&n.testURL(t))return n;return null}function TC(e,t){for(let n of e)if(J(n)&&n.testData?.(t))return n;return null}function EC(e,t){for(let n of e)if(n.mimeTypes?.some(e=>wS(t,e))||wS(t,`application/x.${n.id}`))return n;return null}function DC(e,t){if(!t)return null;for(let n of e)if(typeof t==`string`){if(OC(t,n))return n}else if(ArrayBuffer.isView(t)){if(kC(t.buffer,t.byteOffset,n))return n}else if(t instanceof ArrayBuffer&&kC(t,0,n))return n;return null}function OC(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}function kC(e,t,n){return(Array.isArray(n.tests)?n.tests:[n.tests]).some(r=>AC(e,t,n,r))}function AC(e,t,n,r){if(De(r))return je(r,e,r.byteLength);switch(typeof r){case`function`:return r(Ae(e));case`string`:return r===MC(e,t,r.length);default:return!1}}function jC(e,t=5){return typeof e==`string`?e.slice(0,t):ArrayBuffer.isView(e)?MC(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?MC(e,0,t):``}function MC(e,t,n){if(e.byteLength<t+n)return``;let r=new DataView(e),i=``;for(let e=0;e<n;e++)i+=String.fromCharCode(r.getUint8(t+e));return i}var NC=256*1024;function*PC(e,t){let n=t?.chunkSize||NC,r=0,i=new TextEncoder;for(;r<e.length;){let t=Math.min(e.length-r,n),a=e.slice(r,r+t);r+=t,yield Ae(i.encode(a))}}var FC=256*1024;function*IC(e,t={}){let{chunkSize:n=FC}=t,r=0;for(;r<e.byteLength;){let t=Math.min(e.byteLength-r,n),i=new ArrayBuffer(t),a=new Uint8Array(e,r,t);new Uint8Array(i).set(a),r+=t,yield i}}var LC=1024*1024;async function*RC(e,t){let n=t?.chunkSize||LC,r=0;for(;r<e.size;){let t=r+n,i=await e.slice(r,t).arrayBuffer();r=t,yield i}}function zC(e,t){return He?BC(e,t):VC(e,t)}async function*BC(e,t){let n=e.getReader(),r,i=!1,a=!1,o=!1;try{for(;;){let e=r||n.read();r=void 0;let o;try{o=await e}catch(e){throw a=!0,e}let{done:s,value:c}=o;if(s){i=!0;return}t?._streamReadAhead&&(r=n.read(),r.catch(()=>{})),yield Me(c)}}catch(e){throw o=!0,e}finally{let e=!1,t;if(!i&&!a)try{await n.cancel()}catch(n){e=!0,t=n}try{n.releaseLock()}catch(n){e||(e=!0,t=n)}if(!o&&e)throw t}}async function*VC(e,t){for await(let t of e)yield Me(t)}function HC(e,t){if(typeof e==`string`)return PC(e,t);if(e instanceof ArrayBuffer)return IC(e,t);if(O(e))return RC(e,t);if(Te(e))return zC(e,t);if(Re(e)){let n=e.body;if(!n)throw Error(`Readable stream not available on Response`);return zC(n,t)}throw Error(`makeIterator`)}var UC=`Cannot convert supplied data type`;function WC(e,t,n){if(t.text&&typeof e==`string`)return e;if(we(e)&&(e=e.buffer),De(e)){let n=Pe(e);return t.text&&!t.binary?new TextDecoder(`utf8`).decode(n):Me(n)}throw Error(UC)}async function GC(e,t,n){if(typeof e==`string`||De(e))return WC(e,t,n);if(O(e)&&(e=await PS(e)),Re(e))return await FS(e),t.binary?await e.arrayBuffer():await e.text();if(Te(e)&&(e=HC(e,n)),ke(e)||Ne(e))return nS(e);throw Error(UC)}async function KC(e,t){if(typeof e==`string`)return new TextEncoder().encode(e).buffer;if(De(e))return Me(Pe(e));if(O(e)&&(e=await PS(e)),Re(e))return await FS(e),await e.arrayBuffer();if(Te(e)&&(e=HC(e,t)),ke(e)||Ne(e))return nS(e);throw Error(UC)}async function qC(e,t){if(Le(e)&&(e=await e),Oe(e))return e;if(Re(e)){await FS(e);let n=await e.body;if(!n)throw Error(UC);return HC(n,t)}return O(e)||Te(e)?HC(e,t):Ne(e)||ke(e)?e:JC(e)}function JC(e){if(ArrayBuffer.isView(e)||De(e))return(function*(){yield Me(e)})();if(Oe(e))return e;if(ke(e))return e[Symbol.iterator]();throw Error(UC)}function YC(e,t){let n=YS(),r=e||n,i=r.fetch??r.core?.fetch,a;a=typeof i==`function`?i:Ce(i)?t?.fetch||VS:t?.fetch?t.fetch:VS;let o=r.signal||t?.signal,s=Ce(i)?i:void 0;return dS({fetch:a,credentials:r.core?.credentials||[],authentications:r.core?.authentications,fetchOptions:o?{...s,signal:o}:s})}var XC=new Map,ZC=new Map;async function QC(e,t,n){if(J(e)){let r=e.preload?await e.preload(n||``,t):e;if(!J(r))throw Error(`${e.id} source loader preload() did not return a runtime source loader`);return r}if(ew(e))return e;let r=rw(e,t),i=ZC.get(e)?.get(r);if(i)return i;let a=XC.get(e);a||(a=new Map,XC.set(e,a));let o=a.get(r);return o||(o=tw(e,t,n).then(t=>{let n=ZC.get(e);return n||(n=new Map,ZC.set(e,n)),n.set(r,t),t}).catch(t=>{throw a.delete(r),a.size===0&&XC.delete(e),t}),a.set(r,o)),await o}function $C(e){if(e.subloaders&&!aw.has(e)){let t=ow.get(e);if(t)return t;if(!ew(e))return null}if(ew(e))return e;let t=rw(e);return ZC.get(e)?.get(t)||null}function ew(e){let t=e;return!!(t.parse||t.parseSync||t.parseInBatches||t.parseText||t.parseTextSync||t.parseFile||t.parseFileInBatches)}async function tw(e,t,n){if(e.preload){let r=await e.preload(n||``,t);if(ew(r))return r;throw Error(`${e.id} loader preload() did not return a parser-bearing loader`)}return await iw(nw(e,t),e.id)}function nw(e,t){if((t?._workerType||t?.core?._workerType)===`test`){let t=`modules/${e.module}/src/${e.id}-loader.ts`;return typeof window<`u`?`/${t}`:typeof process<`u`&&process.cwd?new URL(t,`file://${process.cwd()}/`).toString():t}throw Error(`${e.id} loader does not provide a parser implementation. Import a parser-bearing loader directly, or use preload() before parse/load.`)}function rw(e,t){let n=t?.[e.id],r=e.options?.[e.id];return String(n?.backend||r?.backend||``)}async function iw(e,t){let n=await Be(()=>import(e),[],import.meta.url);for(let e of Object.values(n))if(e&&typeof e==`object`&&e.id===t&&ew(e))return e;throw Error(`Could not find parser implementation for ${t} in ${e}`)}var aw=new WeakSet,ow=new WeakMap;async function sw(e,t,n,r){t&&!Array.isArray(t)&&!lC(t)&&(r=void 0,n=t,t=void 0),n||={},(n.signal||r?.signal)?.throwIfAborted();let i=e.url||``,a=Tw(t,r),o=await mC(i,a,n);if(!o)return null;if(J(o))throw Error(`${o.id} is a SourceLoader. Use load() to create a runtime source object instead of parseFile().`);let s=XS(n,o,a,i),c=await sS(!o.getAuthentications&&s.core?.credentials?.length?await QC(o,s,i||r?.url):o,i,s);return r=ww({url:i,_parse:Y,loaders:a},c,r||null),await cw(o,e,c,r)}async function cw(e,t,n,r){(n.signal||r.signal)?.throwIfAborted(),Hx(e),n=Zy(e.options,n);let i=await QC(e,n,r.url);if(i.parseFile)return await i.parseFile(t,n,r);if(i.parse){let a=t.bigsize>0n?Number(t.bigsize):t.size;if(!a)throw Error(`${e.id} loader - cannot fall back to parse without a file size`);return await Y(await t.read(0n,a),i,n,r)}throw Error(`${e.id} loader - no file parser found`)}function lw(e,t,n,r){!Array.isArray(t)&&!lC(t)&&(r=void 0,n=t,t=void 0),n||={};let i=Tw(t,r),a=gC(e,i,n);if(!a)return null;if(J(a))throw Error(`${a.id} is a SourceLoader. Use load() to create a runtime source object instead of parseSync().`);let o=XS(n,a,i),s=jS(e),c=()=>{throw Error(`parseSync called parse (which is async`)};return r=ww({url:s,_parseSync:c,_parse:c,loaders:t},o,r||null),uw($C(a)||a,e,o,r)}function uw(e,t,n,r){if(t=WC(t,e,n),e.parseTextSync&&typeof t==`string`)return e.parseTextSync(t,n);if(e.parseSync&&t instanceof ArrayBuffer)return e.parseSync(t,n,r);throw e.preload?Error(`${e.name} loader: 'parseSync' requires a parser-bearing loader. Import the loader implementation directly, or call preload(loader) before parseSync(). ${r.url||``}`):Error(`${e.name} loader: 'parseSync' not supported by this loader, use 'parse' instead. ${r.url||``}`)}async function dw(e,t,n,r){let i=Array.isArray(t)?t:void 0;!Array.isArray(t)&&!lC(t)&&(r=void 0,n=t,t=void 0),(n?.signal||r?.signal)?.throwIfAborted(),e=await e,n||={},(n.signal||r?.signal)?.throwIfAborted();let a=jS(e),o=await mC(e,t,n);if(!o)return[];let s=XS(n,o,i,a),c=await sS(!o.getAuthentications&&s.core?.credentials?.length?await QC(o,s,a||r?.url):o,a||``,s);return r=ww({url:a,_parseInBatches:dw,_parse:Y,loaders:i},c,r||null),await fw(o,await QC(o,c,r.url),e,c,r)}async function fw(e,t,n,r,i){let a=await pw(t,n,r,i);if(!r?.core?.metadata)return a;let o={shape:`metadata`,batchType:`metadata`,metadata:{_loader:e,_context:i},data:[],bytesUsed:0};async function*s(e){yield o,yield*e}return s(a)}async function pw(e,t,n,r){let i=await vw(await qC(t,n),n?.core?.transforms||[]);return e.parseInBatches?Wx(e,n)?qx(e,i,n,r,Y):e.parseInBatches(i,n,r):mw(i,e,n,r)}async function*mw(e,t,n,r){yield hw(await Y(await nS(e),t,{...n,core:{...n?.core,mimeType:t.mimeTypes[0]}},r),t)}function hw(e,t){let n=gw(e)?{...e,length:_w(e),batchType:`data`}:{shape:`unknown`,batchType:`data`,data:e,length:Array.isArray(e)?e.length:1};return n.mimeType=t.mimeTypes[0],n}function gw(e){if(!e||typeof e!=`object`||!(`shape`in e))return!1;let t=e;switch(t.shape){case`array-row-table`:case`object-row-table`:return Array.isArray(t.data);case`geojson-table`:return Array.isArray(t.features);case`columnar-table`:return!!(t.data&&typeof t.data==`object`);case`arrow-table`:return!!(t.data&&typeof t.data==`object`&&`numRows`in t.data);default:return!1}}function _w(e){switch(e.shape){case`array-row-table`:case`object-row-table`:return e.data.length;case`geojson-table`:return e.features.length;case`arrow-table`:return e.data.numRows;case`columnar-table`:for(let t of Object.values(e.data))return t.length||0;return 0}}async function vw(e,t=[]){let n=e;for await(let e of t)n=e(n);return n}function yw(e,t,n,r){let i;return!Array.isArray(t)&&!lC(t)?(r=void 0,n=t,i=void 0):i=t,Array.isArray(e)?e.map(e=>bw(e,i,n||{})):bw(e,i,n||{})}async function bw(e,t,n){if(typeof e==`string`){let r=e,i=await mC(r,t,{...n,core:{...n.core,nothrow:!0}});return n=await sS(i&&!i.getAuthentications&&n.core?.credentials?.length?await QC(i,n,r):i,r,n),await dw(await YC(n)(qS(r,n)),t,n)}return await dw(e,t,n)}async function xw(e,t,n,r){let i,a;if(!Array.isArray(t)&&!lC(t)?(i=[],a=t,r=void 0):(i=t,a=n),a||=YS(),!Array.isArray(i)&&J(i)){let t=await Sw(i,e,a);a=await sS(i.getAuthentications?i:t,typeof e==`string`?e:``,a||{});let n={fetchFile:VS,parse:Y,parseFile:sw,parseSync:lw,parseInBatches:dw,load:xw,loadInBatches:yw};return t.createDataSource(e,a||{},n)}if(Array.isArray(i)&&i.length===1&&J(i[0])){let t=await Sw(i[0],e,a);a=await sS(i[0].getAuthentications?i[0]:t,typeof e==`string`?e:``,a||{});let n={fetchFile:VS,parse:Y,parseFile:sw,parseSync:lw,parseInBatches:dw,load:xw,loadInBatches:yw};return t.createDataSource(e,a||{},n)}if(typeof e==`string`||O(e)){let t=await mC(e,i,{...a,core:{...a?.core,nothrow:!0}});if(t&&J(t)){let n=await Sw(t,e,a);return a=await sS(t.getAuthentications?t:n,typeof e==`string`?e:``,a||{}),n.createDataSource(e,a||{},{fetchFile:VS,parse:Y,parseFile:sw,parseSync:lw,parseInBatches:dw,load:xw,loadInBatches:yw})}if(t&&typeof e==`string`){let n=await QC(t,a,e);a=await sS(t.getAuthentications?t:n,e,a||{});let i=n.parseUrl;if(i)return await i(qS(e,a),a,r)}}a&&=oS(a);let o=YC(a),s=e;return typeof e==`string`&&(s=await o(qS(e,a))),O(e)&&(s=await o(e)),typeof e==`string`&&(ZS(a||{}).core?.baseUrl||(a={...a,core:{...a?.core,baseUrl:e}})),await Y(s,i,a,r)}async function Sw(e,t,n){if(!e.preload)return e;let r=await e.preload(typeof t==`string`?t:``,n);if(!J(r))throw Error(`${e.id} source loader preload() did not return a runtime source loader`);return r}var Cw=Object.freeze({fetchFile:VS,parse:Y,parseFile:sw,parseSync:lw,parseInBatches:dw,load:xw,loadInBatches:yw});function ww(e,t,n){if(n)return{...n,signal:t.signal||n.signal,reportProgress:t.onProgress||n.reportProgress,coreApi:n.coreApi||e.coreApi||Cw,_parse:n._parse||e._parse,fetch:YC(t,n)};let r={...e,signal:t.signal||e.signal,reportProgress:t.onProgress||e.reportProgress,fetch:YC(t,e),coreApi:e.coreApi||Cw};if(r.url){let e=kS(r.url);r.baseUrl=e,r.queryString=OS(r.url),r.filename=Ye(e),r.baseUrl=Xe(e)}return Array.isArray(r.loaders)||(r.loaders=null),r}function Tw(e,t){if(e&&!Array.isArray(e))return e;let n;if(e&&(n=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];n=n?[...n,...e]:e}return n&&n.length?n:void 0}async function Y(e,t,n,r){t&&!Array.isArray(t)&&!lC(t)&&(r=void 0,n=t,t=void 0),(n?.signal||r?.signal)?.throwIfAborted(),e=await e,n||={},(n.signal||r?.signal)?.throwIfAborted();let i=jS(e),a=Tw(t,r),o=await mC(e,a,n);if(!o)return null;if(J(o))throw Error(`${o.id} is a SourceLoader. Use load() to create a runtime source object instead of parse().`);let s=XS(n,o,a,i),c=await sS(!o.getAuthentications&&s.core?.credentials?.length?await QC(o,s,i||r?.url):o,i||``,s);return r=ww({url:i,_parse:Y,loaders:a},c,r||null),await Ew(o,e,c,r)}async function Ew(e,t,n,r){if((n.signal||r.signal)?.throwIfAborted(),Hx(e),n=Zy(e.options,n),Re(t)){let{ok:e,redirected:n,status:i,statusText:a,type:o,url:s}=t;r.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:n,status:i,statusText:a,type:o,url:s}}let i=await QC(e,n,r.url);return Gx(i,t,n,r,e)?(t=await KC(t,n),await Kx(i,t,n,r,Y)):O(t)&&i.parseBlob?await i.parseBlob(t,n,r):(t=await GC(t,e,n),await Dw(i,t,n,r))}async function Dw(e,t,n,r){if(e.parseText&&typeof t==`string`)return await e.parseText(t,n,r);if(e.parseTextSync&&typeof t==`string`)return e.parseTextSync(t,n,r);if(e.parse)return await e.parse(t,n,r);throw e.parseSync?Error(`${e.name} loader: 'parse' not available on parser-bearing sync loader. Add an async 'parse' function to this loader, or call preload(loader) before parseSync(). ${r.url||``}`):Error(`${e.id} loader - no parser found and worker is disabled`)}function Ow(e,t){let n={version:1,name:t||Kw(e),description:`Imported OpenUSD · ${e.layers.length} composed ${e.layers.length===1?`layer`:`layers`}`,camera:{"@@type":`perspective`,position:[12,8,15],target:[0,1,0],fovy:Math.PI/3.6,near:.03,far:2e3,orbit:{speed:.075}},renderer:{"@@type":`default`,background:[.012,.017,.036,1],ambientRadiance:.105,exposure:1.55,bloomIntensity:.7,bloomThreshold:.76,bloomRadius:7,fogColor:[.024,.035,.072],fogDensity:4e-5},geometries:{},textures:{},materials:{},surfaces:{},instances:[],lights:[]},r={scene:n,materials:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,textureIdentifiers:new Map,bounds:{minimum:[1/0,1/0,1/0],maximum:[-1/0,-1/0,-1/0]},nextIdentifier:0};for(let t of e.rootPrims)Uw(t,r.materials);let i=new D;e.metadata.upAxis===`Z`&&i.rotateX(-Math.PI/2);for(let t of e.rootPrims)Aw(t,i,r);return Fw(r),n}function kw(e,t){Fw({scene:e,materials:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,textureIdentifiers:new Map,bounds:t,nextIdentifier:Object.keys(e.geometries).length})}function Aw(e,t,n){if(X(e,`visibility`)===`invisible`)return;let r=new D(t).multiplyRight(Ww(e));if(e.type===`Mesh`)jw(e,r,n);else if(e.type===`Sphere`||e.type===`Cylinder`||e.type===`Cone`||e.type===`Cube`||e.type===`Capsule`)Mw(e,r,n);else if(e.type===`DistantLight`||e.type===`SphereLight`||e.type===`DiskLight`)Pw(e,r,n);else if(e.type===`PointInstancer`){Nw(e,r,n);return}if(e.type!==`Material`&&e.type!==`Shader`&&e.type!==`GeomSubset`)for(let t of e.children)Aw(t,r,n)}function jw(e,t,n){let r=Qw(X(e,`points`)),i=Zw(X(e,`faceVertexCounts`)),a=Zw(X(e,`faceVertexIndices`));if(r.length===0||i.length===0||a.length===0)return;let o=[],s=0;for(let e of i)o.push(s),s+=e;let c=Qw((e.attributes.normals||e.attributes[`primvars:normals`])?.value),l=e.attributes[`primvars:st`]||e.attributes[`primvars:map1`]||e.attributes[`primvars:st0`]||e.attributes[`primvars:uv`],u=Qw(l?.value),d=l?Zw(X(e,`${l.name}:indices`)):[],f=qw(e),p=e.children.filter(e=>e.type===`GeomSubset`),m=new Set,h=p.map(e=>{let t=Zw(X(e,`indices`));for(let e of t)m.add(e);return{name:e.name,faceIndices:t,materialPath:qw(e)||f}}),g=i.map((e,t)=>t).filter(e=>!m.has(e));(g.length>0||h.length===0)&&h.push({name:e.name,faceIndices:g,materialPath:f});for(let s of h){if(s.faceIndices.length===0)continue;let l=Rw(s.materialPath,s.name,n),f=`${e.sourceUrl||e.path}:${e.name}:${s.name}:${l}`,p=n.surfaceIdentifiers.get(f);if(!p){let t=[],m=[],h=[];for(let e of s.faceIndices){let n=i[e],s=o[e];for(let e=1;e<n-1;e++)for(let n of[0,e,e+1]){let e=a[s+n],i=r[e];if(!i)continue;t.push(i[0],i[1],i[2]);let o=c.length===a.length?c[s+n]:c.length===r.length?c[e]:void 0;o&&m.push(o[0],o[1],o[2]);let l=u[d[s+n]??(u.length===a.length?s+n:e)];l&&l.length>=2&&h.push(l[0],l[1])}}if(t.length===0)continue;let g=nT(e.name,s.name,n),_={"@@type":`triangle`,"vertex.position":t};m.length===t.length&&(_[`vertex.normal`]=m),h.length===t.length/3*2&&(_[`vertex.attribute1`]=h),n.scene.geometries[g]=_,n.scene.surfaces[g]={geometry:g,material:l},p=g,n.surfaceIdentifiers.set(f,g)}Gw(n,p,t,`${e.name}-${s.name}`);for(let e of s.faceIndices){let s=i[e],c=o[e];for(let e=0;e<s;e++){let i=r[a[c+e]];i&&rT(n.bounds,t.transformAsPoint(i))}}}}function Mw(e,t,n){let r=eT(X(e,`radius`),.5),i=eT(X(e,`height`),1),a=eT(X(e,`size`),1),o=X(e,`axis`),s=Rw(qw(e),e.name,n,e),c=`${e.sourceUrl||``}:${e.path}:${e.type}:${s}:${r}:${i}:${a}:${o}`,l=n.surfaceIdentifiers.get(c);if(!l){l=nT(e.name,e.type,n);let t;t=e.type===`Sphere`?{"@@type":`sphere`,radius:r,segments:24}:e.type===`Cylinder`?{"@@type":`cylinder`,radius:r,height:i,segments:32}:e.type===`Cone`?{"@@type":`cone`,radius:r,height:i,segments:32}:e.type===`Capsule`?{"@@type":`sphere`,radius:r,segments:24}:{"@@type":`triangle`,"vertex.position":iT(a)},n.scene.geometries[l]=t,n.scene.surfaces[l]={geometry:l,material:s},n.surfaceIdentifiers.set(c,l)}e.type===`Capsule`&&t.scale([1,Math.max(1,i/Math.max(r*2,.001)),1]),(e.type===`Cylinder`||e.type===`Cone`)&&o===`Z`&&t.rotateX(Math.PI/2),(e.type===`Cylinder`||e.type===`Cone`)&&o===`X`&&t.rotateZ(Math.PI/2),Gw(n,l,t,e.name);let u=e.type===`Cube`?a/2:Math.max(r,i/2);rT(n.bounds,t.transformAsPoint([-u,-u,-u])),rT(n.bounds,t.transformAsPoint([u,u,u]))}function Nw(e,t,n){let r=Qw(X(e,`positions`)),i=Zw(X(e,`protoIndices`)),a=Yw(X(e,`prototypes`));for(let o=0;o<r.length;o++){let s=a[i[o]||0]?.split(`/`).pop(),c=e.children.find(e=>e.name===s);c&&Aw(c,new D(t).translate(r[o]),n)}}function Pw(e,t,n){let r=$w(X(e,`inputs:color`))||[1,1,1],i=eT(X(e,`inputs:intensity`),1),a=nT(e.name,`light`,n),o;if(e.type===`DistantLight`){let e=t.transformAsVector([0,0,-1]);o={"@@id":a,"@@type":`directional`,direction:[e[0],e[1],e[2]],color:r,irradiance:Math.min(4,Math.max(.6,i*.003))}}else o={"@@id":a,"@@type":`point`,position:[t[12],t[13],t[14]],color:r,intensity:Math.min(70,Math.max(8,i*.02))};n.scene.lights=[...n.scene.lights||[],o]}function Fw(e){if(!Number.isFinite(e.bounds.minimum[0]))throw Error(`The imported OpenUSD stage contains no supported renderable geometry.`);Iw(e);let t=e.bounds.minimum,n=e.bounds.maximum,r=[(t[0]+n[0])/2,t[1]+(n[1]-t[1])*.41,(t[2]+n[2])/2],i=Math.max(n[0]-t[0],n[1]-t[1],n[2]-t[2],.5);e.scene.camera.target=r,e.scene.camera.position=[r[0]+i*.76,r[1]+i*.43,r[2]+i*.96],e.scene.camera.near=Math.max(.01,i*.001),e.scene.camera.far=Math.max(200,i*18),e.scene.renderer||={"@@type":`default`},e.scene.renderer.fogDensity=.003/i;let a=nT(`gallery`,`floor`,e);e.scene.geometries[a]={"@@type":`quad`,width:i*8,height:i*8},e.scene.materials[a]={"@@type":`physicallyBased`,baseColor:[.033,.046,.084],metallic:.48,roughness:.23,clearcoat:.78},e.scene.surfaces[a]={geometry:a,material:a},e.scene.instances=[...e.scene.instances||[],{"@@id":`${a}-placement`,surface:a,position:[r[0],t[1]-i*.035,r[2]]}];let o=Lw(e,{identifier:`cyan`,color:[.12,.65,1],center:[r[0],r[1]+i*.28,r[2]],radius:i*.76,height:i*.14,phase:.2,speed:.36,size:i*.015}),s=Lw(e,{identifier:`amber`,color:[1,.43,.14],center:[r[0],r[1]+i*.43,r[2]],radius:i*.68,height:i*.1,phase:Math.PI*.75,speed:-.28,size:i*.013}),c=(e.scene.lights||[]).some(e=>e[`@@type`]===`directional`);e.scene.lights=[...e.scene.lights||[],{"@@id":`gallery-key-light`,"@@type":`directional`,direction:[-.36,-1,-.42],color:[1,.91,.8],irradiance:c?1.45:2.35},{"@@id":`gallery-fill-light`,"@@type":`point`,position:[r[0]+i*.76,r[1]+i*.28,r[2]],color:[.12,.62,1],intensity:46,animation:{"@@type":`follow`,target:o}},{"@@id":`gallery-rim-light`,"@@type":`point`,position:[r[0]-i*.58,r[1]+i*.43,r[2]],color:[1,.41,.14],intensity:39,animation:{"@@type":`follow`,target:s}}];let l=Object.keys(e.scene.geometries).length-1;e.scene.description+=` · ${l} ${l===1?`mesh`:`meshes`}`}function Iw(e){let t=e.bounds.minimum,n=e.bounds.maximum,r=Math.max(n[0]-t[0],n[1]-t[1],n[2]-t[2],.001),i=[(t[0]+n[0])/2,t[1],(t[2]+n[2])/2],a=new D().scale(11.5/r).translate([-i[0],-i[1],-i[2]]);e.scene.instances=(e.scene.instances||[]).map(e=>({...e,matrix:e.matrix?Array.from(new D(a).multiplyRight(e.matrix)):Array.from(a)})),e.scene.lights=(e.scene.lights||[]).map(e=>{if(!e.position)return e;let t=a.transformAsPoint(e.position);return{...e,position:[t[0],t[1],t[2]]}});let o=a.transformAsPoint(t),s=a.transformAsPoint(n);e.bounds={minimum:[o[0],o[1],o[2]],maximum:[s[0],s[1],s[2]]}}function Lw(e,t){let n=`studio-${t.identifier}-emitter`;e.scene.geometries[n]={"@@type":`sphere`,radius:t.size,segments:18},e.scene.materials[n]={"@@type":`physicallyBased`,baseColor:t.color,emissive:t.color,emissiveStrength:11,roughness:.09,clearcoat:.82},e.scene.surfaces[n]={geometry:n,material:n};let r=`${n}-placement`;return e.scene.instances=[...e.scene.instances||[],{"@@id":r,surface:n,position:[t.center[0]+Math.cos(t.phase)*t.radius,t.center[1],t.center[2]+Math.sin(t.phase)*t.radius],animation:{"@@type":`orbit`,center:t.center,radius:t.radius,height:t.height,phase:t.phase,speed:t.speed}}],r}function Rw(e,t,n,r){let i=e||t,a=n.materialIdentifiers.get(i);if(a)return a;a=nT(i.split(`/`).pop()||t,`material`,n);let o=e?Vw(e,n):void 0,s=o?Hw(o):void 0,c=o&&s?zw(o,s,`inputs:diffuseColor`,`srgb`,n):void 0,l=Qw(r?X(r,`primvars:displayColor`):void 0),u=l[0]?[l[0][0],l[0][1],l[0][2]]:void 0,d=$w(s?X(s,`inputs:diffuseColor`):void 0)||$w(s?X(s,`inputs:base_color`):void 0)||u||(c?[1,1,1]:tT(i)),f=i.toLowerCase(),p=f.includes(`window`)||f.includes(`glass`),m=f.includes(`frontlight`)||f.includes(`backlight`)||f.includes(`headlight`)||f.includes(`taillight`)||f.includes(`emissive`),h=$w(s?X(s,`inputs:emissiveColor`):void 0)||(m?d:void 0),g={"@@type":`physicallyBased`,baseColor:d,metallic:eT(s?X(s,`inputs:metallic`):void 0,p?.22:f.includes(`grey`)?.82:.48),roughness:eT(s?X(s,`inputs:roughness`):void 0,p?.07:f.includes(`grey`)?.16:.13),clearcoat:p?.96:.89,iridescence:p?.25:.045};if(c&&(g.baseColorTexture=c),o&&s){let e=zw(o,s,`inputs:normal`,`linear`,n);e&&(g.normalTexture=e)}return p&&(g.opacity=eT(s?X(s,`inputs:opacity`):void 0,.52)),h&&(g.emissive=h,g.emissiveStrength=m?3.6:1.2,c&&m&&(g.emissiveTexture=c)),n.scene.materials[a]=g,n.materialIdentifiers.set(i,a),a}function zw(e,t,n,r,i){let a=X(t,`${n}.connect`)||X(t,n);if(!Jw(a))return;let o=a.path.split(`.outputs:`)[0],s=Bw(e,o);if(!s||X(s,`info:id`)!==`UsdUVTexture`)return;let c=X(s,`inputs:file`);if(!c||typeof c!=`object`||Array.isArray(c)||!(`assetPath`in c))return;let l=s.sourceUrl||e.sourceUrl;if(!l)return;let u=new URL(String(c.assetPath),l).href,d=`${u}:${r}`,f=i.textureIdentifiers.get(d);return f||(f=nT(s.name,`texture`,i),i.scene.textures||={},i.scene.textures[f]={source:u,colorSpace:r},i.textureIdentifiers.set(d,f)),f}function Bw(e,t){if(e.path===t||t.endsWith(`/${e.name}`))return e;for(let n of e.children){let e=Bw(n,t);if(e)return e}}function Vw(e,t){let n=t.materials.get(e);if(n)return n;let r=e.split(`/`).pop();if(r)return Array.from(t.materials.values()).find(e=>e.name===r)}function Hw(e){for(let t of e.children){let e=X(t,`info:id`);if(t.type===`Shader`&&(e===`UsdPreviewSurface`||e===`ND_standard_surface_surfaceshader`||e===`ND_UsdPreviewSurface_surfaceshader`))return t;let n=Hw(t);if(n)return n}}function Uw(e,t){e.type===`Material`&&t.set(e.path,e);for(let n of e.children)Uw(n,t)}function Ww(e){let t=new D,n=Xw(X(e,`xformOpOrder`)),r=n.length?n:Object.keys(e.attributes).filter(e=>e.startsWith(`xformOp:`));for(let n of r){let r=X(e,n);if(n.startsWith(`xformOp:translate`)){let e=$w(r);e&&t.translate(e)}else if(n.startsWith(`xformOp:scale`)){let e=$w(r);e&&t.scale(e)}else if(n.startsWith(`xformOp:transform`)){let e=Qw(r);e.length===4&&e.every(e=>e.length===4)&&t.multiplyRight(new D(e.flat()))}else if(n.startsWith(`xformOp:rotate`)){let e=n.slice(14).split(`:`)[0],i=Array.isArray(r)?r:[r];for(let n=0;n<e.length;n++){let r=eT(i[n],0)*(Math.PI/180);e[n]===`X`?t.rotateX(r):e[n]===`Y`?t.rotateY(r):e[n]===`Z`&&t.rotateZ(r)}}else if(n.startsWith(`xformOp:orient`)&&Array.isArray(r)){let e=r.map(e=>eT(e,0));e.length===4&&t.multiplyRight(new D().fromQuaternion([e[1],e[2],e[3],e[0]]))}}return t}function Gw(e,t,n,r){let i={"@@id":nT(r,`instance`,e),surface:t,matrix:Array.from(n)};e.scene.instances=[...e.scene.instances||[],i]}function Kw(e){let t=e.metadata.defaultPrim;return typeof t==`string`?t.replace(/([a-z])([A-Z])/g,`$1 $2`).toUpperCase():`IMPORTED OPENUSD STAGE`}function X(e,t){return e.attributes[t]?.value}function qw(e){let t=X(e,`material:binding`);return Jw(t)?t.path:void 0}function Jw(e){return!!(e&&typeof e==`object`&&!Array.isArray(e)&&`path`in e)}function Yw(e){return Jw(e)?[e.path]:Array.isArray(e)?e.filter(Jw).map(e=>e.path):[]}function Xw(e){return Array.isArray(e)?e.filter(e=>typeof e==`string`):[]}function Zw(e){return Array.isArray(e)?e.filter(e=>typeof e==`number`):[]}function Qw(e){return Array.isArray(e)?e.filter(e=>Array.isArray(e)).map(e=>e.filter(e=>typeof e==`number`)):[]}function $w(e){if(!(!Array.isArray(e)||e.length<3)&&!(typeof e[0]!=`number`||typeof e[1]!=`number`||typeof e[2]!=`number`))return[e[0],e[1],e[2]]}function eT(e,t){return typeof e==`number`&&Number.isFinite(e)?e:t}function tT(e){let t=e.toLowerCase();return t.includes(`frontlight`)?[1,.87,.58]:t.includes(`backlight`)?[1,.12,.055]:t.includes(`red`)?[.92,.065,.085]:t.includes(`blue`)?[.075,.36,.96]:t.includes(`green`)?[.09,.66,.31]:t.includes(`gold`)?[1,.69,.2]:t.includes(`window`)||t.includes(`glass`)?[.31,.67,.96]:t.includes(`lightgrey`)||t.includes(`greylight`)?[.78,.84,.93]:t.includes(`mediumgrey`)||t.includes(`greymedium`)?[.22,.27,.35]:[.52,.65,.83]}function nT(e,t,n){return`${e.replace(/[^a-zA-Z0-9]+/g,`-`).replace(/^-|-$/g,``).toLowerCase()||`usd`}-${t}-${++n.nextIdentifier}`}function rT(e,t){for(let n=0;n<3;n++)e.minimum[n]=Math.min(e.minimum[n],t[n]),e.maximum[n]=Math.max(e.maximum[n],t[n])}function iT(e){let t=e/2,n=[[-t,-t,-t],[t,-t,-t],[t,t,-t],[-t,t,-t],[-t,-t,t],[t,-t,t],[t,t,t],[-t,t,t]];return[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,2,3,7,2,7,6,1,2,6,1,6,5,3,0,4,3,4,7].flatMap(e=>n[e])}async function aT(e,t){let n={version:1,name:t,description:`Imported glTF · full PBR textures, mapped emission, and retained meshes`,camera:{"@@type":`perspective`,position:[12,8,15],target:[0,1,0],fovy:Math.PI/3.6,near:.03,far:2e3,orbit:{speed:.075}},renderer:{"@@type":`default`,background:[.012,.017,.036,1],ambientRadiance:.16,exposure:1.62,bloomIntensity:.7,bloomThreshold:.76,bloomRadius:7,fogColor:[.024,.035,.072],fogDensity:4e-5},geometries:{},textures:{},materials:{},surfaces:{},instances:[],lights:[]},r={gltf:e,scene:n,bounds:{minimum:[1/0,1/0,1/0],maximum:[-1/0,-1/0,-1/0]},imageSources:new Map,textureIdentifiers:new Map,materialIdentifiers:new Map,surfaceIdentifiers:new Map,nodeIdentifiers:{},nextIdentifier:0},i=e.scene?.nodes||e.scenes[0]?.nodes||e.nodes;for(let e of i)cT(e,new D,r);r.scene.lights=oT(e,r);let a=(e.materials||[]).map(e=>r.materialIdentifiers.get(e)),o={};for(let[e,t]of a.entries()){if(!t)continue;let r=n.materials[t];for(let{slot:t}of Q_()){let n=r[`${t}Texture`];n&&(o[`${e}:${t}`]=n)}}let s=by(jv(e),{nodeIdentifiers:r.nodeIdentifiers,materialIdentifiers:a,materialAlphaModes:(e.materials||[]).map(e=>e.alphaMode===`BLEND`?`BLEND`:e.alphaMode===`MASK`?`MASK`:`OPAQUE`),samplerIdentifiers:o});s.length>0&&(n.clips=s,n.playback={clip:s[0].name,playing:!0,loop:`repeat`},n.description=`Imported glTF · ${s.length} animation clip${s.length===1?``:`s`} · retained PBR scene`);let c=sT(r.bounds);if(kw(n,r.bounds),n.nodes&&Object.keys(n.nodes).length>0){let e=`anari-presentation-root`;for(;e in n.nodes;)e+=`-root`;for(let t of Object.values(n.nodes))t.parent||=e;n.nodes[e]={matrix:Array.from(c)}}return n}function oT(e,t){return gv(e,{nodeIdentifiers:new Set(Object.keys(t.nodeIdentifiers)),useByteColors:!1}).flatMap(e=>{if(e.type===`ambient`||e.type===`rect`||e.type===`disk`)return[];let n={"@@id":yT(`source-${e.type}`,`light`,t),"@@type":e.type,color:_T(e.color,[1,1,1]),intensity:e.intensity??1};return`position`in e&&(n.position=_T(e.position,[0,0,0])),`direction`in e&&(n.direction=_T(e.direction,[0,0,-1])),e.type===`spot`&&(n.openingAngle=e.outerConeAngle??Math.PI/4,n.falloffAngle=e.innerConeAngle??0),[n]})}function sT(e){let t=Math.max(e.maximum[0]-e.minimum[0],e.maximum[1]-e.minimum[1],e.maximum[2]-e.minimum[2],.001);return new D().scale(11.5/t).translate([-(e.minimum[0]+e.maximum[0])/2,-e.minimum[1],-(e.minimum[2]+e.maximum[2])/2])}function cT(e,t,n,r){let i=e.id,a=e.mesh?.primitives.find(e=>e.targets?.length)?.targets?.length||0,o=e.weights||e.mesh?.weights||(a?Array(a).fill(0):void 0);n.nodeIdentifiers[e.id]=i,n.scene.nodes||={};let s={...r?{parent:r}:{},...e.translation?{translation:[e.translation[0],e.translation[1],e.translation[2]]}:{},...e.rotation?{rotation:[e.rotation[0],e.rotation[1],e.rotation[2],e.rotation[3]]}:{},...e.scale?{scale:[e.scale[0],e.scale[1],e.scale[2]]}:{},...e.matrix?{matrix:Array.from(e.matrix)}:{},...o?{weights:[...o]}:{}};n.scene.nodes[i]=s;let c=new D(t);if(e.matrix?c.multiplyRight(e.matrix):(e.translation&&c.translate(e.translation),e.rotation&&c.multiplyRight(new D().fromQuaternion(e.rotation)),e.scale&&c.scale(e.scale)),e.mesh)for(let[t,r]of e.mesh.primitives.entries()){if(r.mode!==void 0&&r.mode!==4)continue;let i=lT(e.mesh.id,t,r,n,e);if(!i)continue;let a=r.attributes.POSITION,o=Z(a);for(let e=0;e<o.length;e+=3){let t=c.transformAsPoint([o[e],o[e+1],o[e+2]]);vT(n.bounds,t)}let l=yT(e.name||e.id,`instance`,n);n.scene.instances=[...n.scene.instances||[],{"@@id":l,surface:i,matrix:Array.from(c)}],s.instances=[...s.instances||[],l],r.targets?.length&&(s.geometries=[...s.geometries||[],i])}for(let t of e.children||[])cT(t,c,n,i)}function lT(e,t,n,r,i){let a=n.attributes.POSITION;if(!a)return;let o=`${e}:${t}${n.targets?.length||i.skin!==void 0?`:${i.id}`:``}`,s=r.surfaceIdentifiers.get(o);if(s)return s;s=yT(e,`primitive-${t}`,r);let c={"@@type":`triangle`,"vertex.position":Array.from(Z(a))},l=n.attributes.NORMAL;l&&(c[`vertex.normal`]=Array.from(Z(l)));let u=n.attributes.TANGENT;u&&(c[`vertex.tangent`]=Array.from(Z(u)));let d=n.attributes.JOINTS_0;d&&(c[`vertex.joint`]=Array.from(Z(d)));let f=n.attributes.WEIGHTS_0;if(f){let e=Z(f),t=f.normalized?e instanceof Uint8Array?255:e instanceof Uint16Array?65535:1:1;c[`vertex.weight`]=Array.from(e,e=>e/t)}n.indices&&(c[`primitive.index`]=Array.from(Z(n.indices)));let p=dT(n,a.count);p&&(c[`vertex.attribute0`]=p);let m=n.attributes.TEXCOORD_0;m&&(c[`vertex.attribute1`]=Array.from(Z(m)));let h=n.attributes.TEXCOORD_1;h&&(c[`vertex.attribute2`]=Array.from(Z(h))),n.targets?.length&&(c.morphTargets=n.targets.map(e=>{let t={};for(let n of[`POSITION`,`NORMAL`,`TANGENT`]){let i=e[n],a=typeof i==`number`?r.gltf.accessors[i]:i;a&&(t[n]=Array.from(Z(a)))}return t}),c.morphWeights=[...i.weights||i.mesh?.weights||Array(n.targets.length).fill(0)]);let g=uT(n.material,r),_=i.skin===void 0?void 0:r.gltf.skins?.[Dv(r.gltf,i.skin)],v=_?{node:i.id,joints:_.joints.map(e=>r.gltf.nodes[e].id),..._.inverseBindMatrices?.value?{inverseBindMatrices:Array.from(Z(_.inverseBindMatrices))}:{}}:void 0;return r.scene.geometries[s]=c,r.scene.surfaces[s]={geometry:s,material:g,...v?{skin:v}:{}},r.surfaceIdentifiers.set(o,s),s}function uT(e,t){if(!e){let e=`default-material`;return t.scene.materials[e]||={"@@type":`physicallyBased`,baseColor:[1,1,1],metallic:1,roughness:1,clearcoat:0},e}let n=t.materialIdentifiers.get(e);if(n)return n;let r=yT(e.name||e.id,`material`,t),i=e.pbrMetallicRoughness,a=i?.baseColorFactor||[1,1,1,1],o=e.alphaMode===`BLEND`?`blend`:e.alphaMode===`MASK`?`mask`:`opaque`,s=e.extensions?.KHR_materials_clearcoat,c=e.extensions?.EXT_materials_bump,l=e.extensions?.KHR_materials_diffuse_transmission,u=e.extensions?.KHR_materials_dispersion,d=e.extensions?.KHR_materials_iridescence,f=e.extensions?.KHR_materials_transmission,p=e.extensions?.KHR_materials_sheen,m=e.extensions?.KHR_materials_specular,h=e.extensions?.KHR_materials_volume,g=e.extensions?.KHR_materials_volume_scatter,_=e.extensions?.KHR_materials_anisotropy,v=e.extensions?.KHR_materials_ior,y={"@@type":`physicallyBased`,baseColor:[a[0],a[1],a[2]],alphaMode:o,doubleSided:e.doubleSided??!1,metallic:Q(i?.metallicFactor??1,0,1),roughness:Q(i?.roughnessFactor??1,0,1),unlit:!!(`unlit`in e&&e.unlit||e.extensions?.KHR_materials_unlit),specularColor:_T(m?.specularColorFactor,[1,1,1]),specularIntensity:Q(m?.specularFactor??1,0,1),clearcoat:Q(s?.clearcoatFactor??0,0,1),clearcoatRoughness:Q(s?.clearcoatRoughnessFactor??0,0,1),iridescence:Q(d?.iridescenceFactor??0,0,1),transmission:Q(f?.transmissionFactor??0,0,1),diffuseTransmission:Q(l?.diffuseTransmissionFactor??0,0,1),diffuseTransmissionColor:_T(l?.diffuseTransmissionColorFactor,[1,1,1]),dispersion:Math.max(u?.dispersion??0,0),thickness:Math.max(h?.thicknessFactor??0,0),attenuationColor:_T(h?.attenuationColor,[1,1,1]),multiscatterColor:h?_T(g?.multiscatterColorFactor||g?.multiscatterColor,[0,0,0]):[0,0,0],scatterAnisotropy:h?Q(g?.scatterAnisotropy??0,-.999,.999):0,indexOfRefraction:Q(v?.ior??1.5,1,2.5),sheenColor:_T(p?.sheenColorFactor,[0,0,0]),sheenRoughness:Q(p?.sheenRoughnessFactor??0,0,1),iridescenceIndexOfRefraction:Math.max(d?.iridescenceIor??1.3,1),iridescenceThicknessMinimum:Math.max(d?.iridescenceThicknessMinimum??100,0),iridescenceThicknessMaximum:Math.max(d?.iridescenceThicknessMaximum??400,0),anisotropyStrength:Q(_?.anisotropyStrength??0,0,1),anisotropyRotation:_?.anisotropyRotation??0,bumpFactor:Math.max(c?.bumpFactor??1,0),normalScale:Q(e.normalTexture?.scale??1,0,4),occlusionStrength:Q(e.occlusionTexture?.strength??1,0,1)};h?.attenuationDistance!==void 0&&h.attenuationDistance>0&&(y.attenuationDistance=h.attenuationDistance);for(let{slot:n,pathSegments:r,colorSpace:i}of Q_())pT(y,`${n}Texture`,mT(e,r),i,t);let b=e.emissiveFactor||[0,0,0];return(e.emissiveTexture||b.some(e=>e>0))&&(y.emissive=_T(b,[1,1,1]),y.emissiveStrength=e.extensions?.KHR_materials_emissive_strength?.emissiveStrength??1),o===`mask`&&(y.alphaCutoff=Q(e.alphaCutoff??.5,0,1)),(o===`blend`||o===`mask`)&&(y.opacity=Q(a[3],0,1)),t.scene.materials[r]=y,t.materialIdentifiers.set(e,r),r}function dT(e,t){let n=e.attributes.COLOR_0;if(!n)return;let r=n.components===4?4:3,i=Z(n),a=Array(t*r);for(let e=0;e<t;e++){let t=fT(n,e),o=e*r;if(a[o]=t[0],a[o+1]=t[1],a[o+2]=t[2],r===4){let t=i[e*n.components+3],r=n.normalized?n.componentType===5121?255:n.componentType===5123?65535:1:1;a[o+3]=t/r}}return a}function fT(e,t){if(!e)return[1,1,1];let n=t*e.components,r=Z(e),i=e.normalized?e.componentType===5121?255:e.componentType===5123?65535:1:1;return[r[n]/i,r[n+1]/i,r[n+2]/i]}function Z(e){if(e.value instanceof BigInt64Array||e.value instanceof BigUint64Array)throw Error(`glTF accessors cannot use BigInt component arrays`);return e.value}function pT(e,t,n,r,i){if(!n)return;let a=n.texture||(typeof n.index==`number`?i.gltf.textures[n.index]:void 0),o=a?.source;if(!o)return;let s=gT(n),c=tv(n)===1?1:0,l=rv(a.sampler),u=Object.entries(l).map(([e,t])=>`${e}:${t}`).join(`,`),d=`${o.id}:${r}:${c}:${s?.join(`,`)||`identity`}:${u}`,f=i.textureIdentifiers.get(d);if(!f){let e=hT(o,i);if(!e)return;f=yT(o.name||o.id,`texture`,i);let t={source:e,colorSpace:r};c===1&&(t.textureCoordinateSet=c),s&&(t.transform=s),Object.keys(l).length>0&&(t.sampler=l),i.scene.textures||={},i.scene.textures[f]=t,i.textureIdentifiers.set(d,f)}e[t]=f}function mT(e,t){let n=e;for(let e of t){if(!n||typeof n!=`object`)return;n=Reflect.get(n,e)}return n&&typeof n==`object`?n:void 0}function hT(e,t){let n=t.imageSources.get(e);if(n)return n;let r=e.image,i=r&&`data`in r?r.data:void 0,a=e.bufferView?.data||(ArrayBuffer.isView(i)?new Uint8Array(i.buffer,i.byteOffset,i.byteLength):void 0),o=a?URL.createObjectURL(new Blob([new Uint8Array(a)],{type:e.mimeType||`image/png`})):e.uri;return o&&t.imageSources.set(e,o),o}function gT(e){if(!e.extensions?.KHR_texture_transform)return;let t=bl(ev(e));return[t[0],t[1],t[2],t[3],t[4],t[5],t[6],t[7],t[8]]}function _T(e,t){return e&&e.length>=3?[e[0],e[1],e[2]]:t}function vT(e,t){for(let n=0;n<3;n++)e.minimum[n]=Math.min(e.minimum[n],t[n]),e.maximum[n]=Math.max(e.maximum[n],t[n])}function yT(e,t,n){return`${e.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)||`gltf`}-${t}-${n.nextIdentifier++}`}function Q(e,t,n){return Math.max(t,Math.min(n,e))}var bT=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/,xT=new Set([`uniform`,`varying`,`custom`,`prepend`,`append`,`add`,`delete`,`reorder`]);function ST(e,t){if(!e.trimStart().startsWith(`#usda`))throw Error(`OpenUSD ASCII layers must begin with the #usda header.`);return new CT(e,t).parse()}var CT=class{tokenizer;url;constructor(e,t){this.tokenizer=new wT(e),this.url=t}parse(){let e=this.tokenizer.match(`(`)?this.parseMetadata(`)`):{},t=[];for(;!this.tokenizer.isAtEnd();)this.isPrimDeclaration()?t.push(this.parsePrim(``)):this.tokenizer.read();return{format:`usda`,url:this.url,metadata:e,rootPrims:t,layers:this.url?[this.url]:[]}}parsePrim(e){let t=this.tokenizer.read().value,n=this.tokenizer.read(),r=this.tokenizer.peek().kind===`string`,i=r?n.value:``,a=r?this.tokenizer.read().value:n.value,o=`${e}/${a}`,s=this.tokenizer.match(`(`)?this.parseMetadata(`)`):{};this.tokenizer.expect(`{`);let c=this.parsePrimContents(o);return{name:a,path:o,sourceUrl:this.url,type:i,specifier:t,attributes:c.attributes,metadata:{...s,...c.metadata},variants:c.variants,children:c.children}}parsePrimContents(e){let t={},n={},r=[],i={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(`}`);)if(this.isPrimDeclaration())r.push(this.parsePrim(e));else if(this.tokenizer.peek().value===`variantSet`)this.parseVariantSet(e,i);else{let e=this.parseAttribute();e&&(t[e.name]=e)}return{attributes:t,metadata:n,children:r,variants:i}}parseVariantSet(e,t){this.tokenizer.expect(`variantSet`);let n=this.tokenizer.read().value;this.tokenizer.expect(`=`),this.tokenizer.expect(`{`);let r={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(`}`);){let t=this.tokenizer.read().value;this.tokenizer.expect(`{`);let n=this.parsePrimContents(e);r[t]={attributes:n.attributes,metadata:n.metadata,children:n.children}}t[n]=r}parseAttribute(){let e=this.tokenizer.read();if(e.kind===`end`)return null;let t=[e];for(;!this.tokenizer.isAtEnd()&&this.tokenizer.peek().line===e.line;){let e=this.tokenizer.peek();if(e.value===`=`){this.tokenizer.read();break}if(e.value===`{`||e.value===`}`)return null;t.push(this.tokenizer.read())}if(this.tokenizer.previousValue!==`=`)return null;let n=t.filter(e=>!xT.has(e.value));return n.length===0?null:{name:n[n.length-1].value,type:n.slice(0,-1).map(e=>e.value).join(``),value:this.parseValue(),metadata:this.tokenizer.match(`(`)?this.parseMetadata(`)`):{}}}parseMetadata(e){let t={};for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(e);){if(this.tokenizer.match(`,`),this.tokenizer.peek().value===e){this.tokenizer.read();break}let n=this.tokenizer.read(),r=[n];for(;!this.tokenizer.isAtEnd()&&this.tokenizer.peek().line===n.line;){if(this.tokenizer.peek().value===`=`||this.tokenizer.peek().value===`:`){this.tokenizer.read();break}if(this.tokenizer.peek().value===e)break;r.push(this.tokenizer.read())}if(this.tokenizer.previousValue!==`=`&&this.tokenizer.previousValue!==`:`)continue;let i=r[r.length-1].value;t[i]=this.parseValue(),this.tokenizer.match(`,`)}return t}parseValue(){let e=this.tokenizer.read();if(e.value===`[`)return this.parseList(`]`);if(e.value===`(`)return this.parseList(`)`);if(e.value===`{`)return this.parseMetadata(`}`);if(e.kind===`asset`){let t={assetPath:e.value};return this.tokenizer.peek().kind===`path`&&this.tokenizer.peek().line===e.line&&(t.primPath=this.tokenizer.read().value),t}return e.kind===`path`?{path:e.value}:e.kind===`number`?Number(e.value):e.value===`true`?!0:e.value===`false`?!1:e.value===`None`||e.value===`null`?null:e.value}parseList(e){let t=[];for(;!this.tokenizer.isAtEnd()&&!this.tokenizer.match(e);)this.tokenizer.match(`,`)||(t.push(this.parseValue()),this.tokenizer.match(`,`));return t}isPrimDeclaration(){let e=this.tokenizer.peek().value;return e===`def`||e===`over`||e===`class`}},wT=class{source;offset=0;line=1;bufferedToken=null;previousValue=``;constructor(e){this.source=e}peek(){return this.bufferedToken||=this.readToken(),this.bufferedToken}read(){let e=this.peek();return this.bufferedToken=null,this.previousValue=e.value,e}match(e){return this.peek().value===e?(this.read(),!0):!1}expect(e){let t=this.read();if(t.value!==e)throw Error(`Expected "${e}" at USDA line ${t.line}, received "${t.value}".`)}isAtEnd(){return this.peek().kind===`end`}readToken(){this.skipIgnoredText();let e=this.line,t=this.source[this.offset];if(t===void 0)return{value:``,line:e,kind:`end`};if(`{}[](),=`.includes(t))return this.offset++,{value:t,line:e,kind:`punctuation`};if(t===`"`||t===`'`)return{value:this.readQuotedString(t),line:e,kind:`string`};if(t===`@`)return{value:this.readDelimitedValue(`@`),line:e,kind:`asset`};if(t===`<`)return{value:this.readDelimitedValue(`>`),line:e,kind:`path`};let n=this.source.slice(this.offset).match(bT);if(n)return this.offset+=n[0].length,{value:n[0],line:e,kind:`number`};let r=this.offset;for(;this.offset<this.source.length;){let e=this.source[this.offset];if(/\s/.test(e)||`{}[](),=@<>`.includes(e))break;this.offset++}return this.offset===r&&this.offset++,{value:this.source.slice(r,this.offset),line:e,kind:`word`}}skipIgnoredText(){for(;this.offset<this.source.length;){let e=this.source[this.offset];if(e===`
`)this.line++,this.offset++;else if(/\s/.test(e))this.offset++;else if(e===`#`)for(;this.offset<this.source.length&&this.source[this.offset]!==`
`;)this.offset++;else if(e===`/`&&this.source[this.offset+1]===`*`){for(this.offset+=2;this.offset<this.source.length&&!this.source.startsWith(`*/`,this.offset);)this.source[this.offset]===`
`&&this.line++,this.offset++;this.offset+=2}else if(this.source.startsWith(`"""`,this.offset)){for(this.offset+=3;this.offset<this.source.length&&!this.source.startsWith(`"""`,this.offset);)this.source[this.offset]===`
`&&this.line++,this.offset++;this.offset+=3}else break}}readQuotedString(e){this.offset++;let t=``;for(;this.offset<this.source.length;){let n=this.source[this.offset++];if(n===e)break;if(n===`\\`&&this.offset<this.source.length){let e=this.source[this.offset++];t+=e===`n`?`
`:e}else t+=n}return t}readDelimitedValue(e){this.offset++;let t=this.offset;for(;this.offset<this.source.length&&this.source[this.offset]!==e;)this.offset++;let n=this.source.slice(t,this.offset);return this.offset++,n}},TT=101010256,ET=33639248,DT=67324752;function OT(e){let t=new DataView(e),n=kT(t),r=t.getUint16(n+10,!0),i=t.getUint32(n+16,!0),a=new Map,o=new TextDecoder;for(let n=0;n<r;n++){if(t.getUint32(i,!0)!==ET)throw Error(`USDZ archive contains an invalid ZIP central-directory entry.`);let n=t.getUint16(i+10,!0),r=t.getUint32(i+20,!0),s=t.getUint16(i+28,!0),c=t.getUint16(i+30,!0),l=t.getUint16(i+32,!0),u=t.getUint32(i+42,!0),d=o.decode(new Uint8Array(e,i+46,s));if(n!==0)throw Error(`USDZ entry "${d}" is compressed; USDZ requires stored ZIP entries.`);if(t.getUint32(u,!0)!==DT)throw Error(`USDZ entry "${d}" has an invalid local ZIP header.`);let f=t.getUint16(u+26,!0),p=t.getUint16(u+28,!0),m=u+30+f+p;a.set(d,e.slice(m,m+r)),i+=46+s+c+l}return a}function kT(e){let t=Math.max(0,e.byteLength-65557);for(let n=e.byteLength-22;n>=t;n--)if(e.getUint32(n,!0)===TT)return n;throw Error(`USDZ archive does not contain a ZIP end-of-central-directory record.`)}var AT=new TextDecoder,jT=`PXR-USDC`,MT=67324752,NT={dataType:null,batchType:null,name:`Universal Scene Description`,id:`usd`,module:`usd`,version:`0.0.0-experimental`,extensions:[`usd`,`usda`,`usdz`],mimeTypes:[`model/vnd.usd`,`model/vnd.usda`,`model/vnd.usdz+zip`],text:!0,binary:!0,tests:[`#usda`,`PK`],parse:PT,options:{usd:{compose:!0,loadReferences:!0,maxReferenceDepth:12,variantSelections:{}}}};async function PT(e,t={},n){let r=n?.url||t.core?.baseUrl,i={fetch:async e=>{let t=await(n?.fetch||fetch)(e);if(!(t instanceof Response))throw Error(`OpenUSD reference "${e}" did not return an HTTP response.`);if(!t.ok)throw Error(`Unable to load OpenUSD reference "${e}": ${t.status}.`);return t},cache:new Map,archiveFiles:new Map,layers:new Set,options:{...t,usd:{...NT.options.usd,...t.usd}}},a;if(KT(e)){let t=OT(e),n=Array.from(t.keys()).find(e=>/\.usda?$/i.test(e));if(!n)throw Error(`USDZ archives with binary USDC root layers are not implemented yet.`);let r=`https://usd.archive/`;for(let[e,n]of t)i.archiveFiles.set(new URL(e,r).href,n);let o=new URL(n,r).href;a=FT(t.get(n),o),a.format=`usdz`}else a=FT(e,r);return a.url&&i.layers.add(a.url),i.options.usd?.compose!==!1&&(a.rootPrims=await IT(a.rootPrims,a.url,{},i,0)),a.layers=Array.from(i.layers),r&&(a.url=r),a}function FT(e,t){if(AT.decode(e.slice(0,8))===jT)throw Error(`Binary USDC crate layers are not implemented yet; use ASCII USDA layers.`);return ST(AT.decode(e),t)}async function IT(e,t,n,r,i){if(i>(r.options.usd?.maxReferenceDepth??12))throw Error(`OpenUSD reference composition exceeded the configured depth limit.`);let a=[];for(let o of e){if(o.specifier===`class`)continue;let e={...VT(o.metadata.variants),...n,...r.options.usd?.variantSelections},s=o.sourceUrl||t,c=UT(o);for(let[t,n]of Object.entries(c.variants)){let r=n[e[t]||Object.keys(n)[0]];r&&(c=GT(c,{...c,attributes:r.attributes,metadata:r.metadata,children:r.children,variants:{}}))}let l=BT(c);if(r.options.usd?.loadReferences!==!1&&l.length>0)for(let t of l){if(!s)throw Error(`OpenUSD references require a source URL or options.core.baseUrl.`);let n=new URL(t.assetPath,s).href,a=await IT(RT(await LT(n,r),t.primPath),n,e,r,i+1);for(let e of a)c=GT(WT(e,c.path),c)}c.children=await IT(c.children,s,e,r,i+1),a.push(c)}return a}async function LT(e,t){let n=t.cache.get(e);return n||(n=(async()=>{let n=t.archiveFiles.get(e);if(!n){let r;try{r=await t.fetch(e)}catch(t){throw Error(`Unable to fetch USD layer "${e}": ${String(t)}`)}if(!r.ok)throw Error(`Unable to fetch USD layer "${e}": ${r.status}.`);n=r.arrayBuffer()}let r=FT(await n,e);return t.layers.add(e),r})(),t.cache.set(e,n)),n}function RT(e,t){let n=t||e.metadata.defaultPrim;if(typeof n!=`string`)return e.rootPrims;let r=n.startsWith(`/`)?n:`/${n}`,i=zT(e.rootPrims,r);return i?[i]:[]}function zT(e,t){for(let n of e){if(n.path===t)return n;let e=zT(n.children,t);if(e)return e}}function BT(e){let t=[];for(let n of[e.metadata.references,e.metadata.payload,e.metadata.payloads])Array.isArray(n)?t.push(...n.filter(HT)):HT(n)&&t.push(n);return t}function VT(e){return!e||typeof e!=`object`||Array.isArray(e)||HT(e)?{}:Object.fromEntries(Object.entries(e).filter(e=>typeof e[1]==`string`))}function HT(e){return!!(e&&typeof e==`object`&&!Array.isArray(e)&&`assetPath`in e)}function UT(e){return{...e,attributes:{...e.attributes},metadata:{...e.metadata},variants:{...e.variants},children:e.children.map(UT)}}function WT(e,t){let n=UT(e);return n.path=t,n.children=n.children.map(e=>WT(e,`${t}/${e.name}`)),n}function GT(e,t){let n=e.children.map(UT);for(let e of t.children){let t=n.findIndex(t=>t.name===e.name);t>=0?n[t]=GT(n[t],e):n.push(UT(e))}return{...e,...t,sourceUrl:BT(t).length>0?t.sourceUrl:e.sourceUrl||t.sourceUrl,type:t.type||e.type,attributes:{...e.attributes,...t.attributes},metadata:{...e.metadata,...t.metadata},variants:{...e.variants,...t.variants},children:n}}function KT(e){return e.byteLength>=4&&new DataView(e).getUint32(0,!0)===MT}var qT={usd:{variantSelections:{wheels:`wheelNormal`}}};function $(e){return new URL(e,document.baseURI).href}var JT=[{identifier:`gltf-expressive-robot`,label:`glTF · Expressive Robot · 14 Animated Clips`,url:$(`./gltf/RobotExpressive.glb`),format:`gltf`},{identifier:`gltf-animated-morphs`,label:`glTF · Animated Morph Targets`,url:$(`./gltf/AnimatedMorphCube.glb`),format:`gltf`},{identifier:`gltf-animated-skin`,label:`glTF · Animated Skeleton`,url:$(`./gltf/SimpleSkin.gltf`),format:`gltf`},{identifier:`gltf-animated-colors`,label:`glTF · Animated Colors`,url:$(`./gltf/AnimatedColorsCube.glb`),format:`gltf`},{identifier:`gltf-antique-camera`,label:`glTF · Antique Camera`,url:$(`./gltf/AntiqueCamera.glb`),format:`gltf`},{identifier:`gltf-lantern`,label:`glTF · Brass Lantern`,url:$(`./gltf/Lantern.glb`),format:`gltf`},{identifier:`gltf-toy-car`,label:`glTF · Vintage Toy Car`,url:$(`./gltf/ToyCar.glb`),format:`gltf`},{identifier:`porcelain-atelier`,label:`OpenUSD · Porcelain Atelier`,url:$(`./usd/porcelain-atelier.usda`),format:`usd`},{identifier:`knights-gambit`,label:`OpenUSD · Knight’s Gambit`,url:$(`./usd/knights-gambit.usda`),format:`usd`},{identifier:`vehicle-gallery`,label:`OpenUSD · Vehicle Gallery`,url:$(`./usd/vehicle-gallery.usda`),format:`usd`,options:qT},{identifier:`material-laboratory`,label:`OpenUSD · Prismatic Materials`,url:$(`./usd/material-laboratory.usda`),format:`usd`},{identifier:`formula-racer`,label:`OpenUSD · Formula Racer`,url:$(`./usd/mini-vehicles/assets/vehicles/formula/asset/formulaFullAsset.usda`),format:`usd`,options:qT},{identifier:`crimson-sedan`,label:`OpenUSD · Crimson Sedan`,url:$(`./usd/mini-vehicles/assets/vehicles/sedan/asset/sedanFullAsset.usda`),format:`usd`,options:qT},{identifier:`precision-wheel`,label:`OpenUSD · Precision Wheel`,url:$(`./usd/mini-vehicles/assets/wheels/wheelNormal/asset/wheelNormalAsset.usda`),format:`usd`}];async function YT(e){let t=JT.find(t=>t.identifier===e);if(!t)throw Error(`Unknown 3D sample "${e}".`);let n=t.label.replace(/^(OpenUSD|glTF) · /,``).toUpperCase();if(t.format===`gltf`){let e=await aT(vy(await xw(t.url,Fe,{gltf:{loadImages:!1}})),n);return await Ny(e),e}let r=Ow(await xw(t.url,NT,t.options),n);return await Ny(r),r}async function XT(e){let t=e.name.replace(/\.(usd|usda|usdz|gltf|glb)$/i,``).replace(/[-_]/g,` `).toUpperCase();if(/\.(gltf|glb)$/i.test(e.name)){let n=await aT(vy(await Y(await e.arrayBuffer(),Fe,{gltf:{loadImages:!1}})),t);return await Ny(n),n}let n=Ow(await NT.parse(await e.arrayBuffer()),t);return await Ny(n),n}export{vt as _,By as a,iv as c,Vl as d,kl as f,jn as g,Rn as h,Py as i,Q_ as l,Hn as m,XT as n,Ky as o,ic as p,YT as r,zy as s,JT as t,Y_ as u,at as v};